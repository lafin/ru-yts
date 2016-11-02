var express = require('express');
var fs = require('fs');
var path = require('path');
var morgan = require('morgan');

var data = require('./controller/data');
var logger = require('./logger');
require('./worker');
require('./db')(logger);

var app = express();
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'pug');
app.use(function(req, res, next) {
    res.header('Access-Control-Allow-Origin', '*');
    next();
});

var file = fs.createWriteStream(__dirname + '/../log/access.log', {
    flags: 'a'
});
app.use(morgan('combined', {
    stream: file
}));

app.get('/', data.index);
app.get('/api/v2/list_movies.json', data.list);

app.listen(3000, function() {
    console.log('Listening on port %d', this.address().port);
});