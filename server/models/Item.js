var mongoose = require('mongoose');

var itemSchema = new mongoose.Schema({
    id: String,
    magnet: String,
    image: String,
    title: String,
    title2: String,
    year: Number,
    rating: Number,
    duration: Number,
    genres: String,
    description: String,
    trailer: String,
    date: Date
});

itemSchema.index({
    'id': 1
}, {
    unique: true
});

module.exports = mongoose.model('Item', itemSchema);