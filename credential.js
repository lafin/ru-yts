var mongoPort = process.env.MONGODB_PORT_27017_TCP_PORT || 27017;
var ip = process.env.MONGODB_PORT_27017_TCP_ADDR || 'localhost';
var connectionString = 'mongodb://' + ip + ':' + mongoPort + '/db';
module.exports = {
    db: connectionString,
    urlEndPoint: 'http://nnm-club.me/forum/',
    username: 'sk-project',
    password: '2125159'
};