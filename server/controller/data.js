var logger = require('../logger');
var config = require('../config');
var Item = require('../models/Item');

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
    return {
        id: item.id,
        imdb_code: item.id,
        title: item.title,
        title_long: item.title + '(' + item.title2 + ')',
        year: item.year,
        genres: item.genres.split(','),
        rating: item.rating,
        medium_cover_image: item.image,
        small_cover_image: item.image,
        synopsis: item.description,
        runtime: item.duration,
        trailer: item.trailer,
        state: 'ok',
        torrents: [{
            url: item.magnet,
            hash: item.magnet ? item.magnet.match(/btih:(.*?)&/)[1] : null
        }]
    };
};

module.exports = {
    index: function(req, res) {
        Item.count({}, function(error, count) {
            if (error) {
                return logger.error(error);
            }
            return res.render('index', {
                count: count
            });
        });
    },
    list: function(req, res) {
        var params = req.query,
            limit = ~~params.limit || 20,
            page = params.page || 1,
            genre = params.genre || 'All',
            query_term = params.query_term || false,
            filter = genre === 'All' ? {} : {
                'genres': new RegExp(config.genres[genre], 'i')
            },
            sort_by = {};

        if (query_term) {
            query_term = new RegExp(genreKeywords(query_term), 'i');
            filter.title = query_term;
        }

        if (params.sort_by) {
            switch (params.sort_by) {
                case 'year':
                    params.sort_by = 'year';
                    break;
                case 'title':
                    params.sort_by = 'title';
                    break;
                case 'date_added':
                default:
                    params.sort_by = 'created';
                    break;
            }
            if (params.sort_by) {
                sort_by[params.sort_by] = params.order_by === 'desc' ? -1 : 1;
            }
        }

        var count = 0;
        return Item
            .aggregate()
            .match(filter)
            .skip(limit * (page - 1))
            .limit(limit)
            .sort(sort_by)
            .exec(function(error, items) {
                if (error) {
                    return logger.error(error);
                }

                var list = [];
                for (var i = 0; i < items.length; i++) {
                    list.push(templateRecord(items[i]));
                    count++;
                }

                return res.json({
                    data: {
                        movie_count: count,
                        limit: limit,
                        page_number: parseInt(page, 10),
                        movies: list
                    }
                });
            });
    }
};