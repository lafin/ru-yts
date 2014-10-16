/**
 * Api endpoint
 * docs: https://yts.re/api
 */

var express = require('express'),
    bodyParser = require('body-parser'),
    app = express();

app.use(bodyParser.urlencoded({
    extended: true
}));

app.get('/api/list.json', function (req, res) {
    var params = req.query;
    var response = {
        'MovieID': null,
        'State': null,
        'MovieUrl': null,
        'MovieTitle': null,
        'MovieTitleClean': null,
        'MovieYear': null,
        'AgeRating': null,
        'DateUploaded': null,
        'DateUploadedEpoch': null,
        'Quality': null,
        'CoverImage': null,
        'ImdbCode': null,
        'ImdbLink': null,
        'Size': null,
        'SizeByte': null,
        'MovieRating': null,
        'Genre': null,
        'Uploader': null,
        'UploaderUID': null,
        'TorrentSeeds': null,
        'Downloaded': null,
        'TorrentPeers': null,
        'TorrentUrl': null,
        'TorrentHash': null,
        'TorrentMagnetUrl': null
    };
    return res.json({
        'MovieCount': 10,
        'MovieList': []
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