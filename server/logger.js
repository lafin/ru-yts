var Logme = require('logme').Logme;
var fs = require('fs');

var file = fs.createWriteStream(__dirname + '/../log/error.log', {
    flags: 'a'
});

module.exports = new Logme({
    stream: file,
    theme: 'clean'
});