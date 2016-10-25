var mongoAddr = process.env.MONGO_PORT_27017_TCP_ADDR || 'localhost';
var mongoPort = process.env.MONGO_PORT_27017_TCP_PORT || 27017;

module.exports = {
    db: 'mongodb://' + mongoAddr + ':' + mongoPort + '/db',
    urlEndPoint: 'http://www.torrentino.me/'
};