var request = require('request');
var bencode = require('bencode');
var iconv = require('iconv-lite');
var async = require('async');
var mongoose = require('mongoose');
var crypto = require('crypto');
var Logme = require('logme').Logme;
var fs = require('fs');
var later = require('later');

var Item = require('./models/Item');
var config = require('./config');
var credential = require(process.env.DEV ? './secret' : './credential');

var offset = 16;
var needSaveItem = 0;

var logInfoFile = fs.createWriteStream(__dirname + '/../info.log', {
    flags: 'a'
});
var loggerInfo = new Logme({
    stream: logInfoFile,
    theme: 'clean'
});

var logErrorFile = fs.createWriteStream(__dirname + '/../error.log', {
    flags: 'a'
});
var loggerError = new Logme({
    stream: logErrorFile,
    theme: 'clean'
});

var db = mongoose.connection;
db.on('error', function(error) {
    loggerError.error(error.message);
});

function requestLogin(callback) {
    var form = {
        username: credential.username,
        password: credential.password,
        autologin: 'on',
        redirect: '',
        login: credential.username
    };
    return request({
        url: credential.urlEndPoint + 'login.php',
        headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
            'User-Agent': config.userAgent
        },
        method: 'POST',
        form: form,
        jar: true,
        followAllRedirects: true,
        encoding: null
    }, function(error) {
        if (error) {
            return callback(error);
        }
        return callback(null, true);
    });
}

function requestData(params, callback) {
    var url = credential.urlEndPoint + 'portal.php?c=' + params.category + '&start=' + params.page;
    return request({
        url: url,
        headers: {
            'User-Agent': config.userAgent
        },
        jar: true,
        encoding: null
    }, function(error, response, body) {
        if (error) {
            return callback(error);
        }
        return callback(null, body);
    });
}

function getMagnet(film, callback) {
    return request({
        url: credential.urlEndPoint + film['magnet'],
        headers: {
            'User-Agent': config.userAgent
        },
        timeout: 10000,
        jar: true,
        encoding: null
    }, function(error, response, body) {
        if (error || response.statusCode !== 200) {
            film['magnet'] = null;
            return callback(null, film);
        }
        var metadata = bencode.decode(body),
            sha1 = crypto.createHash('sha1');
        sha1.update(bencode.encode(metadata.info));
        film['hash'] = sha1.digest('hex');
        film['size'] = metadata.info.length;
        film['magnet'] = 'magnet:?xt=urn:btih:' + film['hash'] + '&dn=' + metadata.info.name + '&tr=' + metadata.announce;
        return callback(null, film);
    });
}

function getData(value) {
    var record = {};

    var title = value[0].match(/(.*?)\(.*?\)/i);
    if (!title) {
        return false;
    }

    // title
    record['title'] = title[1].trim();

    // get year
    var re = /\(.*?\)/i;
    re = re.exec(value[0]);
    record['year'] = re ? re[0].replace(/[^\d.]/g, '').substr(0, 4) : '';

    record['cover'] = value[3];

    // description
    record['description'] = value[4].replace(/&nbsp;\(<a href=".*?"> Читать дальше... <\/a>\)/gm, '.').replace(/&quot;/gm, '"');

    // genre
    record['genre'] = value[5].toLowerCase().split(', ');

    // time
    record['time'] = value[6].split(':').splice(0, 2).map(function(item, index) {
        return index ? +item : item * 60;
    }).reduce(function(previousValue, currentValue) {
        return previousValue + currentValue;
    });

    // magnet
    record['magnet'] = value[7];

    // quality
    var quality = value[0].match(/(3D|480p|720p|1080p|1080i)/i);
    record['quality'] = (quality ? quality[1].replace('i', 'p') : 'HDRip');

    // nnm-club's rating. x2 because nnm-club has five-point scale
    var rating = parseFloat(value[2].trim().replace(',', '.'));
    record['rating'] = (isNaN(rating) ? 0 : (rating * 2));

    var date = value[1].trim();
    for (var month in config.months) {
        if (config.months.hasOwnProperty(month)) {
            date = date.replace(month, config.months[month]);
        }
    }
    record['date'] = +(new Date(date));
    return record;
}

function afterSave(lastItem, callback) {
    callback = callback || function() {};
    if (lastItem) {
        loggerInfo.info('stop');
        return callback();
    }
}

function doSave(films, callback) {
    async.mapLimit(films, 2, function(film, callback) {
        return getMagnet(film, callback);
    }, function() {
        films = films.filter(function(item) {
            return !!item.magnet && item.quality !== '3D';
        });
        if (films.length === 0) {
            return afterSave(true, callback);
        }
        needSaveItem = films.length;
        for (var i = 0; i < films.length; i++) {
            var film = films[i];
            var md5 = crypto.createHash('md5');
            var item = new Item({
                title: film.title,
                guid: md5.update(film.title).digest('hex'),
                hash: film.hash,
                info: {
                    description: film.description,
                    time: film.time,
                    genre: film.genre,
                    cover: film.cover,
                    size: film.size,
                    magnet: film.magnet,
                    year: film.year,
                    quality: film.quality,
                    rating: film.rating,
                    date: film.date,
                    seeders: 0,
                    leechers: 0
                }
            });
            item.save(function(error) {
                if (error) {
                    loggerError.error(error.message);
                }
                return afterSave(--needSaveItem === 0, callback);
            });
        }
    });
}

function prepareAndSaveData(data, callback) {
    var films = [];
    data = iconv.decode(data, 'cp1251');
    data = data.replace(/(\n|\r|\t|\s)+/gm, ' ');
    var value, re = new RegExp('<table width=\"100%\" class=\"pline\">.*?<a.*?>(.*?)<\/a>.*?<span class=\"genmed\"> <b>.*?<\/b> \\\| (.*?)<\/span> \\\| <span class=\"tit\".*?Рейтинг: (.*?)".*?>.*?<var class=\"portalImg\".*?title=\"(.*?)\"><\/var><\/a>(.*?)<br \/><br \/>.*?<b>Жанр[ы]?<\/b>: (.*?)<br \/><b>.*?<br \/><b>Продолжительность<\/b>: (.*?)<\/span><\/td>.*?<div style=\"float:right\"><a href=\"(.*?)\" rel=\"nofollow\">.*?<\/table>', 'gm');
    while ((value = re.exec(data)) !== null) {
        value = getData(value.splice(1, 8));
        if (value) {
            films.push(value);
        }
    }
    return doSave(films, callback);
}

var worker = module.exports = {
    start: function(total, category) {
        total = total || 10;
        category = category || 10;
        loggerInfo.info('start');
        try {
            return requestLogin(function(error, status) {
                if (error) {
                    throw error;
                }
                if (status) {
                    for (var page = 0; page < total; page += offset) {
                        var params = {
                            page: page,
                            category: category
                        };
                        requestData(params, function(error, data) {
                            if (error) {
                                throw error;
                            }
                            prepareAndSaveData(data);
                        });
                    }
                }
            });
        } catch (error) {
            loggerError.error(error.message);
        }
    }
};

if (require.main === module) {
    worker.start(25, 10);
} else {
    later.date.localTime();
    for (var i in config.tasks) {
        if (config.tasks.hasOwnProperty(i)) {
            var task = config.tasks[i];
            var scheduler = later.parse.cron(task.cron, true);
            later.setInterval(worker.start.bind(this, task.total, task.category), scheduler);
        }
    }
}