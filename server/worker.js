var request = require('request');
var async = require('async');
var later = require('later');

var config = require('./config');
var logger = require('./logger');
var credential = require(process.env.DEV ? './secret' : './credential');
require('./db')(logger);
var Item = require('./models/Item');

function requestData(params, callback) {
    var url = credential.urlEndPoint + 'movies?page=' + params.page;
    return request({
        url: url,
        headers: {
            'User-Agent': config.userAgent
        },
        jar: true
    }, function (error, response, body) {
        if (error) {
            return callback(error);
        }
        return callback(null, body);
    });
}

function getFilmData(id, path, callback) {
    return request({
        url: credential.urlEndPoint + path,
        headers: {
            'User-Agent': config.userAgent
        },
        jar: true
    }, function (error, response, body) {
        if (error || response.statusCode !== 200) {
            return callback(error || response.statusCode);
        }

        body = body.replace(/(\n|\r|\t|\s)+/gm, ' ');
        var re = new RegExp('<div class="plate head-plate">.*?(?:<a class="button middle rounded download zona-link".*?data-default="(.*?)".*?>.*?<\/a>.*?)?(?:<img src="(.*?)" alt=".*?" \/>.*?)?(?:<h1 class="module-header" itemprop="name">(.*?)<\/h1>.*?)?(?:<h2 itemprop="alternateName">(.*?)<\/h2>.*?)?<div class="specialty"> <div class="section numbers">.*?(?:<td class="value" itemprop="copyrightYear">(.*?)<\/td>.*?)?(?:<meta itemprop="ratingValue" content="(.*?)" \/>.*?)?(?:<td class="value" itemprop="duration" datetime=".*?">(.*?)<\/td>.*?)?(?:<td class="label">Жанр<\/td> <td class="value"> (.*?) <\/td>.*?)?(?:<\/table> <\/div>(.*?)<\/div> <\/div>.*?)?<\/div> <div class="plate list-start">.*?<h3 class="module-header">Торренты фильма.*?<\/h3>.*?<tbody>(.*?)<\/tbody>.*?<\/div>.*?(?:.*?video: "(.*?)")?', 'gm');
        var value = re.exec(body).splice(1);

        var torrents = [];
        var torrent, torrentRe = new RegExp('<tr.*?class="item.*?">.*?<td class="column video">(.*?)<\/td>.*?<td class="column languages">(.*?)<\/td>.*?<td class="column seed-leech"> <span class="seed">(.*?)<\/span>.*?data-default="(.*?)".*?" title=".*?\\(.*?\\) в (.*?) качестве".*?<\/tr>', 'gm');
        while ((torrent = torrentRe.exec(value[9])) !== null) {
            torrents.push(torrent.splice(1));
        }

        torrents = torrents.filter(function (torrent) {
            return (/ru/.test(torrent[1])) && !(/Blu\-ray/.test(torrent[4]));
        }).sort(function (a, b) {
            return (b[0].split('x').reduce(function (a1, b1) {
                return a1 * b1;
            })) - (a[0].split('x').reduce(function (a1, b1) {
                return a1 * b1;
            }));
        }).slice(0, 5).sort(function (a, b) {
            return b[2] - a[2];
        });
        var magnet = torrents[0] && torrents[0][3];

        var genre, genreRe = new RegExp('<span itemprop="genre">(.*?)</span>', 'gm');
        var genres = [];
        while ((genre = genreRe.exec(value[7])) !== null) {
            genres = genres.concat(genre.splice(1));
        }

        var duration = 0;
        if (value[6]) {
            duration = value[6].split(':').map(Number).reduce(function (pre, cur, index) {
                if (index === 1) {
                    pre *= 60;
                }
                return pre + cur;
            });
        }

        return callback(null, {
            id: id,
            magnet: magnet,
            image: value[1],
            title: value[2],
            title2: value[3],
            year: value[4],
            rating: value[5] || 0,
            duration: duration,
            genres: genres,
            description: value[8],
            trailer: value[10],
            date: Date.now()
        });
    });
}

function saveFilmData(film, callback) {
    if (!film.magnet) {
        return callback();
    }
    var options = {
        new: true,
        upsert: true,
        setDefaultsOnInsert: true
    };
    Item.findOneAndUpdate({
        id: film.id
    }, film, options, function (error) {
        if (error) {
            return callback(error);
        }
        return callback();
    });
}

function getPageData(data, callback) {
    var films = [];
    data = data.toString().replace(/(\n|\r|\t|\s)+/gm, ' ');
    var tilesRe = new RegExp('<div class="plate showcase">.*?<div class="tiles">(.*?)<\/div> <ul class="pagination">.*?<\/ul> <\/div>', 'gm');
    var tiles = tilesRe.exec(data).splice(1);
    var value, re = new RegExp('<div class="tile" data-movie-id="(.*?)"> <a target="_blank" href="(.*?)".*?>', 'gm');
    while ((value = re.exec(tiles)) !== null) {
        films.push({
            id: value[1],
            path: value[2]
        });
    }

    async.mapLimit(films, 20, function (film, innerCallback) {
        return getFilmData(film.id, film.path, innerCallback);
    }, callback);
}

function run(total) {
    var page = 1;
    async.during(function (callback) {
        return callback(null, page <= total);
    }, function (callback) {
        console.log('start');
        requestData({
            page: page
        }, function (error, data) {
            if (error) {
                return callback(error);
            }
            return getPageData(data, function (error, films) {
                if (error) {
                    return callback(error);
                }
                async.mapSeries(films, saveFilmData, function (error) {
                    if (error) {
                        return callback(error);
                    }
                    console.log('stop');
                    page += 1;
                    return callback();
                });
            });
        });
    }, function (error) {
        if (error) {
            console.error(error);
            return logger.error(error);
        }
        console.log('done');
    });
}

var worker = module.exports = {
    start: function (total) {
        total = total || 1;
        return run(total);
    }
};

if (require.main === module) {
    var args = process.argv;
    var count = args[2] && args[2] === '-c' && args[3];
    worker.start(count || 1);
} else {
    later.date.localTime();
    for (var i in config.tasks) {
        if (config.tasks.hasOwnProperty(i)) {
            var task = config.tasks[i];
            var scheduler = later.parse.cron(task.cron, true);
            later.setInterval(worker.start.bind(this, task.total), scheduler);
        }
    }
}