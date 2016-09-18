var mongoAddr = process.env.MONGO_PORT_27017_TCP_ADDR || 'localhost';
var mongoPort = process.env.MONGO_PORT_27017_TCP_PORT || 27017;
var username = process.env.USERNAME || 'username';
var password = process.env.PASSWORD || 'password';

module.exports = {
    db: 'mongodb://' + mongoAddr + ':' + mongoPort + '/db',
    urlEndPoint: 'http://nnmclub.to/forum/',
    username: username,
    password: password
};