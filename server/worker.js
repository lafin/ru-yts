var request = require('request');
var async = require('async');

var config = require('./config');
var logger = require('./logger');
var credential = require('./credential');
var connect = require('./db')(logger);
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

function getFilmData(params, callback) {
    var id = params.id;
    var path = params.path;

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
        var value = re.exec(body);
        value = value && value.splice(1);
        if (!value) {
            return callback('No data');
        }
        var torrents = [];
        var torrent, torrentRe = new RegExp('<tr.*?class="item.*?">.*?<td class="column video">(.*?)<\/td>.*?<td class="column languages">(.*?)<\/td>.*?<td class="column seed-leech"> <span class="seed">(.*?)<\/span>.*?data-default="(.*?)".*?" title=".*?\\(.*?\\) в (.*?) качестве".*?<\/tr>', 'gm');
        while ((torrent = torrentRe.exec(value[9])) !== null) {
            torrents.push(torrent.splice(1));
        }

        var qualities = ['1080p', '720p', null];
        torrents = torrents.filter(function (torrent) {
            return (/ru/.test(torrent[1])) && !(/Blu\-ray/.test(torrent[4]));
        }).sort(function (a, b) {
            return (b[0].split('x').reduce(function (a1, b1) {
                return a1 * b1;
            })) - (a[0].split('x').reduce(function (a1, b1) {
                return a1 * b1;
            }));
        }).sort(function (a, b) {
            return b[2] - a[2];
        }).map(function (torrent) {
            var quality = parseInt(torrent[0].split('x')[1], 10);
            if (quality > 650 && quality < 750) {
                quality = '720p';
            } else if (quality > 1000 && quality < 1100) {
                quality = '1080p';
            } else {
                quality = null;
            }
            return {
                quality: quality,
                magnet: torrent[3]
            };
        }).filter(function (torrent) {
            var index = qualities.indexOf(torrent.quality);
            if (index > -1) {
                qualities.splice(index, 1);
            }
            return index > -1;
        });

        if (torrents.length > 1) {
            torrents = torrents.filter(function (torrent) {
                return torrent.quality !== null;
            });
        }

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
            torrents: torrents,
            image: value[1],
            title: value[2],
            title2: value[3],
            year: value[4],
            rating: value[5] || 0,
            duration: duration,
            genres: genres,
            description: value[8],
            trailer: value[10],
            created: params.created,
            updated: Date.now()
        });
    });
}

function checkFilmData(params, callback) {
    var id = params.id;
    var ttl = params.ttl;

    Item.findOne({id: id}, function(error, data) {
        if (error) {
            return callback(error);
        }
        if (data) {
            if (!data.updated || (new Date(data.updated).valueOf() + ttl) < Date.now()) {
                params.created = data.created ? new Date(data.created).valueOf() : Date.now();
                // update
                return getFilmData(params, callback);
            }
            // skip
            return callback();
        }
        params.created = Date.now();
        // create new
        return getFilmData(params, callback);
    });
}

function saveFilmData(film, callback) {
    if (!film || !film.torrents.length) {
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

function getPageData(data, ttl, callback) {
    var films = [];
    data = data.toString().replace(/(\n|\r|\t|\s)+/gm, ' ');
    var tilesRe = new RegExp('<div class="plate showcase">.*?<div class="tiles">(.*?)<\/div> <ul class="pagination">.*?<\/ul> <\/div>', 'gm');
    var tiles = tilesRe.exec(data);
    tiles = tiles && tiles.splice(1);
    if (!tiles) {
        return callback('No data');
    }
    var value, re = new RegExp('<div class="tile" data-movie-id="(.*?)"> <a target="_blank" href="(.*?)".*?>', 'gm');
    while ((value = re.exec(tiles)) !== null) {
        films.push({
            id: value[1],
            path: value[2]
        });
    }

    async.mapLimit(films, 1, function (film, innerCallback) {
        return checkFilmData({
            id: film.id,
            path: film.path,
            ttl: ttl
        }, innerCallback);
    }, callback);
}

function run(params, done) {
    done = done || function () {};
    var total = params.total + params.offset;
    var page = params.offset;
    var ttl = params.ttl;

    async.during(function (callback) {
        return callback(null, page < total);
    }, function (callback) {
        console.log('start page:', page);
        requestData({
            page: page
        }, function (error, data) {
            if (error) {
                console.error(error);
                logger.error(error);
                return callback();
            }
            return getPageData(data, ttl, function (error, films) {
                if (error) {
                    console.error(error);
                    logger.error(error);
                    return callback();
                }
                async.mapSeries(films, saveFilmData, function (error) {
                    if (error) {
                        console.error(error);
                        logger.error(error);
                    }
                    console.log('stop page:', page);
                    page += 1;
                    return callback();
                });
            });
        });
    }, function () {
        console.log('done');
        done();
    });
}

module.exports = {
    start: function (params, interruptConnectAfter) {
        params.ttl *= 1e3;
        return run(params, interruptConnectAfter ? function () {
            connect.close();
        } : null);
    }
};