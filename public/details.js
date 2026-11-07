const BASE_URL = 'http://localhost:3000';

document.addEventListener('DOMContentLoaded', async () => {
    const params = new URLSearchParams(window.location.search);
    const movieId = params.get('id');

    if (!movieId) {
        document.getElementById('details').innerText = 'No movie ID provided.';
        return;
    }

    try {
        // Load movie (still fetched from backend)
        const res = await fetch(`${BASE_URL}/movies/${movieId}`);
        const movie = await res.json();

        const detailsContainer = document.getElementById('details');
        detailsContainer.textContent = '';

        const title = document.createElement('h4');
        title.textContent = movie.name;

        const genre = document.createElement('p');
        genre.innerHTML = `<strong>Genre:</strong> ${movie.genre}`;

        // MOCKED REVIEWS (replace backend with sample data)
        const randomCount = Math.floor(Math.random() * 5) + 1; // 1 to 5 reviews

        // Generate placeholder reviews
        const reviews = Array.from({ length: randomCount });

        // Render reviews
        const reviewList = document.getElementById('reviewList');
        reviewList.textContent = '';

        let totalRating = 0;

        if (reviews.length === 0) {
            reviewList.textContent = 'No reviews yet.';
        } else {
            reviews.forEach((_, i) => {
                const rating = Math.floor(Math.random() * 5) + 1; // Random rating between 1 and 5
                totalRating += rating;

                const row = document.createElement('div');
                row.classList.add('d-flex', 'mb-3', 'border-bottom', 'pb-3', 'gap-3');

                const avatar = document.createElement('img');
                avatar.src = 'profile_img.png';
                avatar.alt = 'User avatar';
                avatar.classList.add('rounded-circle');
                avatar.width = 48;
                avatar.height = 48;

                const content = document.createElement('div');

                const header = document.createElement('p');
                header.classList.add('mb-1');
                header.innerHTML = `<strong>Reviewer ${i + 1}</strong> | Rating: <strong>${rating}</strong>`;

                const comment = document.createElement('p');
                comment.classList.add('fst-italic', 'mb-0');
                comment.textContent = `This is a hardcoded comment ${i + 1}. Replace with real data later.`;

                content.append(header, comment);
                row.append(avatar, content);
                reviewList.appendChild(row);
            });
        }


        // Compute and display the average rating
        const averageRating = 0 //replace this
        const rating = document.createElement('p');
        rating.innerHTML = `<strong>Rating:</strong> ${averageRating} (NOT YET IMPLEMENTED)`;

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
