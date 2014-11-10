var Client = require('bittorrent-tracker'),
    parseTorrent = require('parse-torrent'),
    // config = require('./secret'),
    config = require('./config'),
    mongoose = require('mongoose'),
    itemModel = require('./models/Item'),
    Logme = require('logme').Logme,
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

var checked = 0,
    error = 0,
    warning = 0,
    success = 0;

var watcher = function (torrent, item, length) {
    var client = new Client(peerId, port, torrent);
    client.start();

    client.once('error', function (err) {
        error++;
        logger.error(err);
        client.stop();
        if ((checked++) && checked === length) {
            mongoose.disconnect();
        }
    });

    client.once('warning', function (err) {
        warning++;
        logger.error(err);
        client.stop();
        if ((checked++) && checked === length) {
            mongoose.disconnect();
        }
    });

    client.once('update', function (data) {
        success++;
        var seeders = data.complete,
            leechers = data.incomplete;
        item.info.seeders = seeders;
        item.info.leechers = leechers;
        item.save();
        client.stop();
        if ((checked++) && checked === length) {
            mongoose.disconnect();
        }
    });
};

itemModel.find({}, function (error, items) {
    if (error) {
        return logger.error(error);
    }
    var length = items.length;
    for (var i = 0; i < length; i++) {
        var item = items[i];
        var torrent = parseTorrent(item.info.magnet);
        if (torrent) {
            watcher(torrent, item, length);
        }
    }
});

mongoose.connection.on('disconnected', function () {
    console.log('Result:');
    console.log('Total:', checked);
    console.log('Success:', success);
    console.log('Errors:', error);
    console.log('Warnings:', warning);
});