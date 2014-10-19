/**
 * Api endpoint
 * docs: https://yts.re/api
 */

var express = require('express'),
    // bodyParser = require('body-parser'),
    config = require('./config'),
    mongoose = require('mongoose'),
    itemModel = require('./models/Item'),
    app = express();

mongoose.connect(config.db);

// app.use(bodyParser.urlencoded({
//     extended: true
// }));

app.get('/api/list.json', function (req, res) {
    var params = req.query;
    itemModel.find(function (err, items) {
        if (err) {
            return console.error(err);
        }
        var list = [];
        for (var i = 0; i < items; i++) {
            var item = items[i];
            list.push({
                'MovieID': null,
                'State': 'OK',
                'MovieUrl': null,
                'MovieTitle': item.title,
                'MovieTitleClean': item.title,
                'MovieYear': item.year,
                'AgeRating': null,
                'DateUploaded': null,
                'DateUploadedEpoch': null,
                'Quality': null,
                'CoverImage': item.image,
                'ImdbCode': null,
                'ImdbLink': null,
                'Size': (item.size / 1024 / 1024) + 'Mb',
                'SizeByte': item.size,
                'MovieRating': null,
                'Genre': item.genre,
                'Uploader': null,
                'UploaderUID': null,
                'TorrentSeeds': null,
                'Downloaded': null,
                'TorrentPeers': null,
                'TorrentUrl': item.link,
                'TorrentHash': item.hash,
                'TorrentMagnetUrl': item.link
            });
        }
        return res.json({
            'MovieCount': list.length,
            'MovieList': list
        });
    });
});

app.get('/api/listimdb.json', function (req, res) {
    var params = req.query;
    return res.json({
        'MovieCount': 10,
        'MovieList': []
    });
});

var server = app.listen(3000, function () {
    console.log('Listening on port %d', server.address().port);
});