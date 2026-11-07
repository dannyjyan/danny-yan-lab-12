const mongoose = require('mongoose');

const reviewSchema = new mongoose.Schema({
    movieId: { type: mongoose.Schema.Types.ObjectId, ref: 'Movie' },
    comment: String,
    rating: Number,
    createdAt: Date,
});

module.exports = mongoose.model('Review', reviewSchema);
