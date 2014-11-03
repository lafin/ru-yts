var Client = require('bittorrent-tracker'),
    parseTorrent = require('parse-torrent'),
    config = require('./config'),
    mongoose = require('mongoose'),
    itemModel = require('./models/Item'),
    Logme = require('logme').Logme,
    async = require('async'),
    fs = require('fs');

var logFile = fs.createWriteStream(__dirname + '/log.txt', {
        flags: 'a'
    }),
    logger = new Logme({
        stream: logFile,
        theme: 'clean'
    });

mongoose.connect(config.db);

var peerId = new Buffer('01234567890123456789');
var port = 6881;

itemModel.find({}, function (error, items) {
    if (error) {
        return logger.error(error);
    }

    var checked = 0;

    items.forEach(function (item) {
        var torrent = parseTorrent(item.info.magnet);
        if (torrent) {
            var client = new Client(peerId, port, torrent);

            client.start();
            client.once('error', function (err) {
                logger.error(err);
                if ((checked++) && checked == items.length) mongoose.disconnect();
                client.stop();
            });

            client.once('warning', function (err) {
                logger.error(err);
                if ((checked++) && checked == items.length) mongoose.disconnect();
                client.stop();
            });

            client.once('update', function (data) {
                var seeders = data.complete,
                    leechers = data.incomplete;
                item.info.seeders = seeders;
                item.info.leechers = leechers;
                item.save();
                if ((checked++) && checked == items.length) mongoose.disconnect();
                client.stop();
            });
        }
    });
});