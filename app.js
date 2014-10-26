var express = require('express'),
    config = require('./config'),
    mongoose = require('mongoose'),
    itemModel = require('./models/Item'),
    Logme = require('logme').Logme,
    fs = require('fs'),
    path = require('path');


var app = express(),
    countItems = null;

app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'jade');
var hour = 3600000,
    day = hour * 24,
    week = day * 7;
app.use(express['static'](path.join(__dirname, 'public'), {
    maxAge: week
}));
app.use(function (req, res, next) {
    res.header('Access-Control-Allow-Origin', '*');
    next();
});

var logFile = fs.createWriteStream(__dirname + '/log.txt', {
        flags: 'a'
    }),
    logger = new Logme({
        stream: logFile,
        theme: 'clean'
    });

mongoose.connect(config.db, function () {
    return itemModel.count({}, function (error, count) {
        if (error) {
            return logger.error(error);
        }
        countItems = count;
    });
});

var templateRecord = function (item) {
    var info = item.info;
    return {
        'MovieID': item.hash,
        'State': 'OK',
        'MovieUrl': '',
        'MovieTitle': item.title,
        'MovieTitleClean': item.title,
        'MovieYear': info.year,
        'AgeRating': '',
        'DateUploaded': '',
        'DateUploadedEpoch': Date.now(),
        'Quality': 'HDRip',
        'CoverImage': info.cover,
        'ImdbCode': item.hash,
        'ImdbLink': '',
        'Size': parseInt(info.size / 1024 / 1024, 10) + ' Mb',
        'SizeByte': info.size + '',
        'MovieRating': '',
        'Genre': info.genre,
        'Uploader': '',
        'UploaderUID': '',
        'TorrentSeeds': '',
        'Downloaded': '',
        'TorrentPeers': '',
        'TorrentUrl': info.magnet,
        'TorrentHash': item.hash,
        'TorrentMagnetUrl': info.magnet
    };
};

app.get('/', function (req, res) {
    return res.render('index', {
        count: countItems
    });
});

app.get('/api/list.json', function (req, res) {
    var params = req.query,
        limit = params.limit || 20,
        page = params.set || 1,
        keywords = params.keywords || false,
        filter = {};
    if (keywords) {
        keywords = new RegExp(keywords, 'i');
        filter = {
            title: keywords
        };
    }
    return itemModel.find(filter, null, {
            skip: limit * (page - 1),
            limit: limit
        },
        function (error, items) {
            if (error) {
                return logger.error(error);
            }

            var list = [],
                i = null;
            for (i = 0; i < items.length; i++) {
                var item = items[i];
                list.push(templateRecord(item));
            }

            return res.json({
                'MovieCount': countItems,
                'MovieList': list
            });
        });
});

app.get('/api/listimdb.json', function (req, res) {
    var params = req.query;
    return itemModel.find({
        'hash': params.imdb_id
    }, function (error, items) {
        if (error) {
            return logger.error(error);
        }

        var list = [],
            i = null;
        for (i = 0; i < items.length; i++) {
            var item = items[i];
            list.push(templateRecord(item));
        }

        return res.json({
            'MovieCount': countItems,
            'MovieList': list
        });
    });
});

var server = app.listen(3000, function () {
    console.log('Listening on port %d', server.address().port);
});