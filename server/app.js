var express = require('express');
var fs = require('fs');
var path = require('path');
var morgan = require('morgan');
var later = require('later');

var data = require('./controller/data');
var logger = require('./logger');
var worker = require('./worker');
var config = require('./config');
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

var args = process.argv;
var onlyWorker = args.indexOf('--only-worker') > -1;
if (onlyWorker) {
    var countIndex = args.indexOf('-c');
    var count = countIndex > -1 ? +args[countIndex + 1] : 1;
    var offsetIndex = args.indexOf('-s');
    var offset = offsetIndex > -1 ? +args[offsetIndex + 1] : 1;
    worker.start(count, offset, true);
} else {
    later.date.localTime();
    for (var i in config.tasks) {
        if (config.tasks.hasOwnProperty(i)) {
            var task = config.tasks[i];
            var scheduler = later.parse.cron(task.cron, true);
            later.setInterval(worker.start.bind(this, task.total, 0), scheduler);
        }
    }

    app.listen(3000, function() {
        console.log('Listening on port %d', this.address().port);
    });
}