/**
 * Api endpoint
 * docs: https://yts.re/api
 */

var express = require('express'),
    config = require('./config'),
    mongoose = require('mongoose'),
    itemModel = require('./models/Item'),
    countItems = null,
    app = express();

mongoose.connect(config.db, function () {
    itemModel.count({}, function (err, count) {
        countItems = count;
    });
});

app.use(function (req, res, next) {
    res.header('Access-Control-Allow-Origin', '*');
    next();
});

function templateRecord(item) {
    return {
        'MovieID': item.movieId,
        'State': 'OK',
        'MovieUrl': '',
        'MovieTitle': item.title,
        'MovieTitleClean': item.title,
        'MovieYear': item.year,
        'AgeRating': '',
        'DateUploaded': '',
        'DateUploadedEpoch': Date.now(),
        'Quality': 'HDRip',
        'CoverImage': item.image,
        'ImdbCode': item.movieId,
        'ImdbLink': '',
        'Size': parseInt(item.size / 1024 / 1024, 10) + ' Mb',
        'SizeByte': item.size + '',
        'MovieRating': '',
        'Genre': item.genre,
        'Uploader': '',
        'UploaderUID': '',
        'TorrentSeeds': '',
        'Downloaded': '',
        'TorrentPeers': '',
        'TorrentUrl': item.link,
        'TorrentHash': item.hash,
        'TorrentMagnetUrl': item.link
    };
}

app.get('/api/list.json', function (req, res) {
    var params = req.query,
        limit = params.limit || 20,
        page = parseInt(params.set, 10) || 0;

    itemModel.find({}, null, {
            skip: limit * (page - 1),
            limit: limit
        },
        function (err, items) {
            if (err) {
                return console.error(err);
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
    itemModel.find({
        'movieId': params.imdb_id
    }, function (err, items) {
        if (err) {
            return console.error(err);
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