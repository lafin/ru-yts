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
app.get('/api/v2/movie_details.json', data.one);

var args = process.argv;
var onlyWorker = args.indexOf('--only-worker') > -1;
var onlyApi = args.indexOf('--only-api') > -1;
var params = {};

process.on('unhandledRejection', console.error);

if (onlyWorker) {
    var totalIndex = args.indexOf('-c');
    params.total = totalIndex > -1 ? +args[totalIndex + 1] : 1;
    var offsetIndex = args.indexOf('-s');
    params.offset = offsetIndex > -1 ? +args[offsetIndex + 1] : 1;
    var ttlIndex = args.indexOf('--ttl');
    params.ttl = ttlIndex > -1 ? +args[ttlIndex + 1] : 86400;

    worker.start(params, true);
} else {
    if (!onlyApi) {
        later.date.localTime();
        for (var i in config.tasks) {
            if (config.tasks.hasOwnProperty(i)) {
                var task = config.tasks[i];
                var scheduler = later.parse.cron(task.cron, true);
                params = {
                    offset: 1,
                    total: task.total,
                    ttl: 86400
                };
                later.setInterval(worker.start.bind(this, params), scheduler);
            }
        }
    }

    app.listen(process.env.PORT || 3000, function() {
        console.log('Listening on port %d', this.address().port);
    });
}