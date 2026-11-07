const Movie = require('./models/Movie');
const Review = require('./models/Review');
const findMoviesWithRatings = require('./movie-ratings');

async function getMovieContext(question) {
    const catalog = await Movie.find().select('name genre').lean();
    const genres = [...new Set(catalog.map(movie => movie.genre).filter(Boolean))];
    const text = question.toLowerCase();
    const titles = catalog.filter(movie => movie.name && text.includes(movie.name.toLowerCase()));
    const excludedTitles = titles.filter(movie => {
        const escapedTitle = movie.name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
        return new RegExp(`\\b(?:excluding|exclude|except(?: for)?|besides|other than|apart from|instead of|anything but|avoid|not|no|don't|don’t)\\s+(?:(?:recommend|suggest)\\s+)?["'“]?${escapedTitle}`, 'i').test(question);
    });
    const recommendation = /\b(?:recommend\w*|suggest\w*|alternative\w*|another|something else)\b/i.test(question)
        || excludedTitles.length > 0;
    let matchingGenres = genres.filter(genre => text.includes(genre.toLowerCase()));
    // A named movie can be a reference or an exclusion, rather than the requested result.
    if (recommendation && !matchingGenres.length) {
        matchingGenres = [...new Set(titles.map(movie => movie.genre).filter(Boolean))];
    }
    const matchTitles = !recommendation && titles.length > 0;
    const filter = matchTitles
        ? { _id: { $in: titles.map(movie => movie._id) } }
        : matchingGenres.length ? { genre: { $in: matchingGenres } } : {};
    if (excludedTitles.length) {
        filter._id = { $nin: excludedTitles.map(movie => movie._id) };
    }

    const movies = await findMoviesWithRatings(filter)
        .sort({ averageRating: -1, name: 1 }).limit(10)
        .project({ name: 1, genre: 1, averageRating: 1, reviewCount: 1 });
    await Promise.all(movies.map(async movie => {
        movie.reviews = await Review.find({ movieId: movie._id })
            .select('comment rating').sort({ createdAt: -1, _id: -1 }).limit(5).lean();
    }));

    return {
        genres,
        selection: matchTitles ? 'Matching titles' : matchingGenres.length ? 'Matching genres' : 'Highest average review ratings',
        excludedTitles: excludedTitles.map(movie => movie.name),
        limits: 'Up to 10 movies and the 5 most recent written reviews per movie. This may not be the complete catalog or review history.',
        movies,
    };
}

module.exports = getMovieContext;
