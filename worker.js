var request = require('request'),
    bencode = require('bencode'),
    iconv = require('iconv-lite'),
    Rusha = require('rusha'),
    async = require('async'),
    config = require('./config'),
    mongoose = require('mongoose'),
    itemModel = require('models/Item');

mongoose.connect(config.db);

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
        url: config.urlEndPoint + 'portal.php?c=' + (params.page * 10),
        headers: {
            'User-Agent': config.userAgent
        },
        jar: true,
        encoding: null
    }, function (error, response, body) {
        if (error || body === '') {
            return console.log(error);
        }
        return callback(body);
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
            sha1 = new Rusha();
        film['link'] = sha1.digest(bencode.encode(metadata.info));
        film['link'] = 'magnet:?xt=urn:btih:' + film['link'] + '&dn=' + metadata.info.name;
        return callback(null, film);
    });
}

function fixValue(value) {
    var record = {};

    // title
    record['title'] = value[0].replace(/(DVDRip|\[Line\]|HDRip|BDRip|WEB-DLRip|WEBRip|\[H\.264\]|DVBRip|AVO|TVRip|\[VO\]|\[Unrated\]|\[1080p\]|\[720p\])+/gmi, '').trim();

    // get year
    var re = /\([0-9]+\)/gm;
    record['year'] = re.exec(value[0])[0].substr(1, 4);

    // description
    record['description'] = value[2].replace(/&nbsp;\(<a href=".*?"> Читать дальше... <\/a>\)/gm, '.').replace(/&quot;/gm, '"');

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

requestLogin(function (status) {
    if (status) {
        var params = {
            page: 0
        };
        requestData(params, function (data) {
            var films = [];
            data = iconv.decode(data, 'cp1251');

            var re = /<table width=\"100%\" class=\"pline\">.*?<a.*?>(.*?)<\/a>.*?<var class=\"portalImg\".*?title=\"(.*?)\"><\/var><\/a>(.*?)<br \/><br \/><b>Жанр<\/b>: (.*?)<br \/><b>.*?<br \/><b>Продолжительность<\/b>: (.*?)<\/span><\/td>.*?<div style=\"float:right\"><a href=\"(.*?)\" rel=\"nofollow\">.*?<\/table>/gm;
            data = data.replace(/(\n|\r|\t|\s)+/gm, ' ');

            var value;
            while ((value = re.exec(data)) !== null) {
                films.push(fixValue(value.splice(1, 6)));
            }

            async.mapSeries(films, function (film, callback) {
                return getMagnet(film, callback);
            }, function () {
                for (var i = 0; i < films.length; i++) {
                    var film = films[i];
                    var item = new itemModel({
                        title: film.title,
                        description: film.description,
                        time: film.time,
                        link: film.link,
                        year: film.year
                    });
                    item.save();
                }
            });
        });
    }
});

mongoose.disconnect();