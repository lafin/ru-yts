var mongoAddr = process.env.MONGO_PORT_27017_TCP_ADDR || process.env.MONGO_ADDR || 'localhost';
var mongoPort = process.env.MONGO_PORT_27017_TCP_PORT || process.env.MONGO_PORT || 27017;
var mongoDbName = process.env.MONGO_DB_NAME || 'db';
var mongoUser = process.env.MONGO_USER;
var mongoPassword = process.env.MONGO_PASSWORD;
if (mongoUser && mongoPassword) {
    mongoAddr = mongoUser + ':' + mongoPassword + '@' + mongoAddr;
}

module.exports = {
    db: 'mongodb://' + mongoAddr + ':' + mongoPort + '/' + mongoDbName,
    urlEndPoint: 'http://www.torrentino.me/'
};