var mongoose = require('mongoose');

var itemSchema = new mongoose.Schema({
    title: {
        type: String,
        unique: true
    },
    hash: {
        type: String
    },
    info: {
        description: {
            type: String
        },
        time: {
            type: Number
        },
        magnet: {
            type: String
        },
        size: {
            type: Number
        },
        cover: {
            type: String
        },
        genre: {
            type: String
        },
        year: {
            type: Number
        },
        quality: {
            type: String
        },
        rating: {
            type: Number
        },
        date: {
            type: Date
        },
        seeders: {
            type: Number
        },
        leechers: {
            type: Number
        }
    }
});

module.exports = mongoose.model('Item', itemSchema);