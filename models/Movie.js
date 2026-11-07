const mongoose = require('mongoose');

const movieSchema = new mongoose.Schema({
    name: String,
    genre: String,
    rating: Number,
});

module.exports = mongoose.model('Movie', movieSchema);
