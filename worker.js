var request = require('request'),
    bencode = require('bencode'),
    iconv = require('iconv-lite'),
    async = require('async'),
    // config = require('./secret'),
    config = require('./config'),
    mongoose = require('mongoose'),
    crypto = require('crypto'),
    itemModel = require('./models/Item'),
    Logme = require('logme').Logme,
    fs = require('fs');

mongoose.connect(config.db);
var db = mongoose.connection;

var total = process.argv[2] || config.total,
    offset = 15,
    category = process.argv[3] || 10;

var logFile = fs.createWriteStream(__dirname + '/log.txt', {
        flags: 'a'
    }),
    logger = new Logme({
        stream: logFile,
        theme: 'clean'
    });

var months = {
    'Янв': 'Jan',
    'Фев': 'Fed',
    'Мар': 'Mar',
    'Апр': 'Apr',
    'Май': 'May',
    'Июн': 'Jun',
    'Июл': 'Jul',
    'Авг': 'Aug',
    'Сен': 'Sep',
    'Окт': 'Oct',
    'Ноя': 'Nov',
    'Дек': 'Dec'
};

function isLastPage(page) {
    return (page + offset) >= total;
}

function requestLogin(callback) {
    var form = {
        username: config.username,
        password: config.password,
        autologin: 'on',
        redirect: '',
        login: config.username
    };
    return request({
        url: config.urlEndPoint + 'login.php',
        headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
            'User-Agent': config.userAgent
        },
        method: 'POST',
        form: form,
        jar: true,
        followAllRedirects: true,
        encoding: null
    }, function (error) {
        if (error) {
            return callback(error);
        }
        return callback(null, true);
    });
}

function requestData(params, callback) {
    return request({
        url: config.urlEndPoint + 'portal.php?c=' + category + '&start=' + params.page,
        headers: {
            'User-Agent': config.userAgent
        },
        jar: true,
        encoding: null
    }, function (error, response, body) {
        if (error) {
            return callback(error);
        }
        return callback(null, body, isLastPage(params.page));
    });
}

function getMagnet(film, callback) {
    return request({
        url: config.urlEndPoint + film['magnet'],
        jar: true,
        encoding: null
    }, function (error, response, body) {
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

    // title
    record['title'] = value[0].match(/(.*?)\(.*?\)/i)[1].trim();

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
    record['time'] = value[6].split(':').splice(0, 2).map(function (item, index) {
        return index ? +item : item * 60;
    }).reduce(function (previousValue, currentValue) {
        return previousValue + currentValue;
    });

    // magnet
    record['magnet'] = value[7];

    // quality
    var quality = value[0].match(/(480p|720p|1080p|1080i)/i);
    record['quality'] = (quality ? quality[1].replace('i', 'p') : 'HDRip');

    // nnm-club's rating. x2 because nnm-club has five-point scale
    var rating = parseFloat(value[2].trim().replace(',', '.'));
    record['rating'] = (isNaN(rating) ? 0 : (rating * 2));

    var date = value[1].trim();
    for (var month in months) {
        if (months.hasOwnProperty(month)) {
            date = date.replace(month, months[month]);
        }
    }
    record['date'] = +(new Date(date));
    return record;
}

function prepareData(error, data, end) {
    if (error) {
        throw error;
    }
    var films = [];
    data = iconv.decode(data, 'cp1251');

    var re = /<table width=\"100%\" class=\"pline\">.*?<a.*?>(.*?)<\/a>.*?<\/b>.*?\| (.*?)<\/span>.*?<span.*?Рейтинг: (.*?)".*?>.*?<var class=\"portalImg\".*?title=\"(.*?)\"><\/var><\/a>(.*?)<br \/><br \/><b>Жанр[ы]?<\/b>: (.*?)<br \/><b>.*?<br \/><b>Продолжительность<\/b>: (.*?)<\/span><\/td>.*?<div style=\"float:right\"><a href=\"(.*?)\" rel=\"nofollow\">.*?<\/table>/gm;
    data = data.replace(/(\n|\r|\t|\s)+/gm, ' ');

    var value;
    while ((value = re.exec(data)) !== null) {
        value = getData(value.splice(1, 8));
        if (value) {
            films.push(value);
        }
    }

    var afterSave = function (disconnect) {
        if (disconnect) {
            mongoose.disconnect();
        }
    };

    async.mapSeries(films, function (film, callback) {
        return getMagnet(film, callback);
    }, function () {
        films = films.filter(function (item) {
            return !!item.magnet;
        });
        if (films.length === 0) {
            afterSave(true);
        }
        for (var i = 0; i < films.length; i++) {
            var film = films[i];
            var item = new itemModel({
                title: film.title,
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
            item.save(afterSave.bind(this, (end && films.length === i + 1)));
        }
    });
}

db.on('error', function (e) {
    logger.error(e.message);
});

db.once('open', function () {
    try {
        requestLogin(function (error, status) {
            if (error) {
                throw error;
            }
            if (status) {
                for (var page = 0; page < total; page += offset) {
                    var params = {
                        page: page
                    };
                    requestData(params, prepareData);
                }
            }
        });
    } catch (e) {
        logger.error(e.message);
    }
});