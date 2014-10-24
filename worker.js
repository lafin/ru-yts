var request = require('request'),
    bencode = require('bencode'),
    iconv = require('iconv-lite'),
    async = require('async'),
    config = require('./config'),
    mongoose = require('mongoose'),
    crypto = require('crypto'),
    itemModel = require('./models/Item');

mongoose.connect(config.db);
var db = mongoose.connection;

var total = 100,
    offset = 15;

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
    }, function (error, response, body) {
        if (error || body === '') {
            return callback(false, error);
        }
        return callback(true);
    });
}

function requestData(params, callback) {
    return request({
        url: config.urlEndPoint + 'portal.php?c=10&start=' + params.page,
        headers: {
            'User-Agent': config.userAgent
        },
        jar: true,
        encoding: null
    }, function (error, response, body) {
        if (error || body === '') {
            return console.log(error);
        }
        return callback(body, isLastPage(params.page));
    });
}

function getMagnet(film, callback) {
    request({
        url: config.urlEndPoint + film['link'],
        jar: true,
        encoding: null
    }, function (error, response, body) {
        if (error || body === '') {
            return callback(error);
        }
        var metadata = bencode.decode(body),
            sha1 = crypto.createHash('sha1');
        sha1.update(bencode.encode(metadata.info));

        film['hash'] = sha1.digest('hex');
        film['size'] = metadata.info.length;
        film['link'] = 'magnet:?xt=urn:btih:' + film['hash'] + '&dn=' + metadata.info.name;
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

    // cover image
    record['image'] = value[1];

    // description
    record['description'] = value[2].replace(/&nbsp;\(<a href=".*?"> Читать дальше... <\/a>\)/gm, '.').replace(/&quot;/gm, '"');

    // genre
    record['genre'] = value[3].split(', ');

    // time
    record['time'] = value[4].split(':').splice(0, 2).map(function (item, index) {
        return index ? +item : item * 60;
    }).reduce(function (previousValue, currentValue) {
        return previousValue + currentValue;
    });

    // link
    record['link'] = value[5];

    return record;
}

function prepareData(data, end) {
    var films = [];
    data = iconv.decode(data, 'cp1251');

    var re = /<table width=\"100%\" class=\"pline\">.*?<a.*?>(.*?)<\/a>.*?<var class=\"portalImg\".*?title=\"(.*?)\"><\/var><\/a>(.*?)<br \/><br \/><b>Жанр<\/b>: (.*?)<br \/><b>.*?<br \/><b>Продолжительность<\/b>: (.*?)<\/span><\/td>.*?<div style=\"float:right\"><a href=\"(.*?)\" rel=\"nofollow\">.*?<\/table>/gm;
    data = data.replace(/(\n|\r|\t|\s)+/gm, ' ');

    var value;
    while ((value = re.exec(data)) !== null) {
        value = getData(value.splice(1, 6));
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
        for (var i = 0; i < films.length; i++) {
            var film = films[i];
            var md5 = crypto.createHash('md5');
            md5.update(film.title);
            var item = new itemModel({
                title: film.title,
                description: film.description,
                time: film.time,
                genre: film.genre,
                image: film.image,
                size: film.size,
                hash: film.hash,
                link: film.link,
                year: film.year,
                movieId: md5.digest('hex')
            });
            item.save(afterSave.call(this, (end && films.length === i + 1)));
        }
    });
}

db.on('error', console.error.bind(console, 'error:'));
db.once('open', function () {
    requestLogin(function (status) {
        if (status) {
            for (var page = 0; page < total; page += offset) {
                var params = {
                    page: page
                };
                requestData(params, prepareData);
            }
        }
    });
});