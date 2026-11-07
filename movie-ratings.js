const Movie = require('./models/Movie');
const Review = require('./models/Review');

function findMoviesWithRatings(filter = {}) {
    return Movie.aggregate([
        { $match: filter },
        {
            $lookup: {
                from: Review.collection.name,
                localField: '_id',
                foreignField: 'movieId',
                pipeline: [{ $group: { _id: null, average: { $avg: '$rating' }, count: { $sum: 1 } } }],
                as: 'reviewSummary',
            },
        },
        {
            $set: {
                averageRating: { $ifNull: [{ $first: '$reviewSummary.average' }, null] },
                reviewCount: { $ifNull: [{ $first: '$reviewSummary.count' }, 0] },
            },
        },
        { $project: { reviewSummary: 0 } },
    ]);
}

module.exports = findMoviesWithRatings;
