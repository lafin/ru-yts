var express = require('express');
var mongoose = require('mongoose');
var Logme = require('logme').Logme;
var fs = require('fs');
var path = require('path');
var morgan = require('morgan');

var credential = require(process.env.DEV ? './secret' : './credential');
var config = require('./config');
var itemModel = require('./models/Item');
require('./worker');

var app = express();
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'jade');
app.use(express['static'](path.join(__dirname, '../client')));
app.use(function(req, res, next) {
    res.header('Access-Control-Allow-Origin', '*');
    next();
});

var logErrorFile = fs.createWriteStream(__dirname + '/../error.log', {
    flags: 'a'
});
var logger = new Logme({
    stream: logErrorFile,
    theme: 'clean'
});

var logAccessFile = fs.createWriteStream(__dirname + '/../access.log', {
    flags: 'a'
});
app.use(morgan('combined', {
    stream: logAccessFile
}));

mongoose.connect(credential.db);

var genreKeywords = function(keywords) {
    return (function(keywords) {
        var string = '';
        keywords.forEach(function(keyword) {
            string += '(?=.*' + keyword + '.*)';
        });
        return string;
    }(keywords.split('% '))).replace(/(е|ё)/i, '(е|ё)');
};

var templateRecord = function(item) {
    var info = item.info;
    return {
        imdb_code: item.guid,
        title: item.title,
        title_long: item.title,
        year: info.year,
        genres: info.genre.split(','),
        rating: info.rating,
        medium_cover_image: info.cover,
        small_cover_image: info.cover,
        synopsis: info.description,
        runtime: info.time,
        state: 'ok',
        torrents: [{
            url: info.magnet,
            hash: item.hash,
            quality: info.quality,
            seeds: 0,
            peers: 0,
            size: info.size ? parseInt(info.size / 1024 / 1024, 10) + ' Mb' : null,
            size_bytes: info.size
        }]
    };
};

app.get('/', function(req, res) {
    itemModel.count({}, function(error, count) {
        if (error) {
            return logger.error(error);
        }
        return res.render('index', {
            count: count
        });
    });
});

app.get('/api/v2/list_movies.json', function(req, res) {
    var params = req.query,
        limit = ~~params.limit || 20,
        page = params.page || 1,
        genre = params.genre || 'All',
        query_term = params.query_term || false,
        filter = genre === 'All' ? {} : {
            'info.genre': new RegExp(config.genres[genre], 'i')
        },
        sort_by = {};

    if (query_term) {
        query_term = new RegExp(genreKeywords(query_term), 'i');
        filter.title = query_term;
    }

    if (params.sort_by) {
        switch (params.sort_by) {
            case 'year':
                params.sort_by = 'info.year';
                break;
            case 'title':
                params.sort_by = 'title';
                break;
            case 'date_added':
                params.sort_by = 'info.date';
                break;
            default:
                params.sort_by = 'info.date';
                break;
        }
        if (params.sort_by) {
            sort_by[params.sort_by] = params.order_by === 'desc' ? -1 : 1;
        }
    }

    return itemModel.count({}, function(error, count) {
        if (error) {
            return logger.error(error);
        }

        itemModel
            .aggregate()
            // .group({
            //     _id: '$guid',
            //     year: {
            //         $max: '$info.year'
            //     },
            //     torrents: {
            //         $addToSet: {
            //             hash: "$hash",
            //             magnet: "$info.magnet",
            //             quality: "$info.quality",
            //             size: "$info.size"
            //         }
            //     }
            // })
            .match(filter)
            .skip(limit * (page - 1))
            .limit(limit)
            .sort(sort_by)
            .exec(function(error, items) {
                if (error) {
                    return logger.error(error);
                }

                var list = [],
                    i = null;
                for (i = 0; i < items.length; i++) {
                    var item = items[i];
                    list.push(templateRecord(item));
                }

                return res.json({
                    status: 'ok',
                    status_message: 'Query was successful',
                    data: {
                        movie_count: count,
                        limit: limit,
                        page_number: page,
                        movies: list
                    }
                });
            });
    });
});

var server = app.listen(3000, function() {
    console.log('Listening on port %d', server.address().port);
});