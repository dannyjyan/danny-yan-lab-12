const BASE_URL = 'http://localhost:3000';

document.addEventListener('DOMContentLoaded', async () => {
    const params = new URLSearchParams(window.location.search);
    const movieId = params.get('id');

    if (!movieId) {
        document.getElementById('details').innerText = 'No movie ID provided.';
        return;
    }

    try {
        // Load the movie and its stored reviews.
        const res = await fetch(`${BASE_URL}/movies/${movieId}`);
        if (!res.ok) throw new Error('Unable to load movie.');
        const movie = await res.json();

        const detailsContainer = document.getElementById('details');
        detailsContainer.textContent = '';

        const title = document.createElement('h4');
        title.textContent = movie.name;

        const genre = document.createElement('p');
        genre.textContent = `Genre: ${movie.genre}`;

        const reviews = movie.reviews;

        // Render reviews
        const reviewList = document.getElementById('reviewList');
        reviewList.textContent = '';

        if (reviews.length === 0) {
            reviewList.textContent = 'No reviews yet.';
        } else {
            reviews.forEach((review) => {
                const row = document.createElement('div');
                row.classList.add('d-flex', 'mb-3', 'border-bottom', 'pb-3', 'gap-3');

                const content = document.createElement('div');

                const header = document.createElement('p');
                header.classList.add('mb-1');
                header.textContent = `Rating: ${review.rating ?? 'Not rated'}`;

                const comment = document.createElement('p');
                comment.classList.add('fst-italic', 'mb-0');
                comment.textContent = review.comment;

                content.append(header, comment);
                row.append(content);
                reviewList.appendChild(row);
            });
        }


        const rating = document.createElement('p');
        rating.textContent = movie.averageRating == null
            ? 'Rating: No ratings yet'
            : `Rating: ${movie.averageRating.toFixed(1)} (${movie.reviewCount} reviews)`;

        detailsContainer.append(title, genre, rating);
        // Create edit/delete buttons
        const actionsDiv = document.createElement('div');
        actionsDiv.classList.add('mt-3', 'd-flex', 'gap-2');

        const editBtn = document.createElement('button');
        editBtn.classList.add('btn', 'btn-primary', 'btn-sm');
        editBtn.textContent = '✏️ Edit';

        const deleteBtn = document.createElement('button');
        deleteBtn.classList.add('btn', 'btn-danger', 'btn-sm');
        deleteBtn.textContent = '🗑️ Delete';

        actionsDiv.append(editBtn, deleteBtn);
        detailsContainer.appendChild(actionsDiv);

        // Enable edit mode
        let isEditing = false;
        editBtn.addEventListener('click', () => {
            if (!isEditing) {
                const titleInput = document.createElement('input');
                titleInput.classList.add('form-control', 'mb-2');
                titleInput.value = movie.name;

                const genreInput = document.createElement('input');
                genreInput.classList.add('form-control', 'mb-2');
                genreInput.value = movie.genre;

                detailsContainer.innerHTML = ''; // Clear previous content
                detailsContainer.append(titleInput, genreInput);

                const saveBtn = document.createElement('button');
                saveBtn.classList.add('btn', 'btn-success', 'me-2');
                saveBtn.textContent = 'Save Changes';

                saveBtn.addEventListener('click', async () => {
                    const updatedMovie = {
                        // Use the current values from the input fields
                    };

                    try {
                        // const res = await fetch('SOME_URL', {
                        //     method: 'SOME_METHOD',
                        //     headers: {
                        //         'Content-Type': 'application/json'
                        //     },
                        //     body: //updatedMovie
                        // });

                        // if (res.ok) {
                        //     location.reload();
                        // } else {
                        //     const errorText = await res.text(); // capture server message
                        //     alert(`Failed to update movie.\nStatus: ${res.status} ${res.statusText}`);
                        //     console.error(`PUT error: ${res.status} - ${errorText}`);
                        // }
                        alert(`NOT YET IMPLEMENTED`);

                    } catch (err) {
                        console.error('Fetch error during PUT:', err);
                        alert('An unexpected error occurred while updating the movie.');
                    }
                });

                detailsContainer.append(saveBtn);
                isEditing = true;
            }
        });

        deleteBtn.addEventListener('click', async () => {
            if (confirm('Are you sure you want to delete this movie?')) {
                try {
                    // const res = await fetch("SOME_URL", { method: 'SOME_METHOD' });
                    // Implement the DELETE request to your backend
                    alert(`NOT YET IMPLEMENTED`);

                } catch (err) {
                    console.error('Fetch error during DELETE:', err);
                    alert('An unexpected error occurred while deleting the movie.');
                }
            }
        });

    } catch (err) {
        console.error(err);
        document.getElementById('details').textContent = 'Error loading movie.';
        document.getElementById('reviewList').textContent = 'Error loading reviews.';
    }
});
