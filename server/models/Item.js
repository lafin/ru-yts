var mongoose = require('mongoose');

var itemSchema = new mongoose.Schema({
    id: String,
    // back compatibility field
    magnet: String,
    torrents: [{
        magnet: String,
        quality: String
    }],
    storedImage: {
        data: Buffer,
        contentType: String
    },
    image: String,
    title: String,
    title2: String,
    year: Number,
    rating: Number,
    duration: Number,
    genres: String,
    description: String,
    trailer: String,
    created: Date,
    updated: Date
});

itemSchema.index({
    'id': 1
});

module.exports = mongoose.model('Item', itemSchema);