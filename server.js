require('dotenv').config();

const express = require('express');
const cors = require('cors');
const http = require('http');              // Required for WebSocket server
const { Server } = require('socket.io');   // Socket.IO

const app = express();
const server = http.createServer(app);     // Create server
const io = new Server(server);             // Attach Socket.IO

const port = 3000;

const openRouterModel = process.env.OPENROUTER_MODEL || 'openrouter/free';

// CORS and static
app.use(cors());
app.use(express.static('public'));

// WebSocket: handle client connections
io.on('connection', (socket) => {
    console.log('A user connected:', socket.id);

    // When a user sends a message...
    socket.on('userMessage', async (msg) => {
        console.log(`User (${socket.id}) says:`, msg);

        // Broadcast the user message to all clients, including the manager
        socket.broadcast.emit('userIncomingMessage', msg);

        // Check if the message contains '@openrouter' (case-insensitive)
        if (msg.toLowerCase().includes('@openrouter')) {
            // Prepare OpenRouter request
            // TODO: Integrate MongoDB or another database to store load up current conversations and reviews from our database
            // and feed them to Gemini to get overall review summary for a specific movie
            // Append the reviews of a the movie from database as context for Gemini in the `contents` variable below
            // Instead of random movie reviews, Gemini will use the reviews from our database to generate a summary
            // Also, Gemini should also remember the conversation history and provide context-aware responses such as "I remember you asked about X earlier"
            // or "You mentioned Y before, here's more information on that". 

            // This starter sends only the current message; conversation history is not stored yet.

            try {
                if (!process.env.OPENROUTER_API_KEY) {
                    throw new Error('Missing OPENROUTER_API_KEY in .env');
                }

                const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
                    method: 'POST',
                    headers: {
                        'Authorization': `Bearer ${process.env.OPENROUTER_API_KEY}`,
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({
                        model: openRouterModel,
                        messages: [{ role: 'user', content: msg }],
                    }),
                });

                const result = await response.json();
                if (!response.ok) {
                    throw new Error(result.error?.message || `OpenRouter returned HTTP ${response.status}`);
                }
                const reply = result.choices?.[0]?.message?.content || 'I could not generate a response.';

                console.log(`OpenRouter reply: ${reply}`);
                io.emit('agentReply', reply); // Broadcast the model reply to all clients
            } catch (error) {
                console.error('Error with OpenRouter:', error);
                socket.emit('agentReply', 'Sorry, there was an error processing your request.');
            }
        }
    });

    // When the manager sends a reply
    socket.on('managerReply', (reply) => {
        console.log(`Manager replied: ${reply}`);
        // Broadcast the manager's reply to all clients except the sender
        socket.broadcast.emit('managerReply', reply);
    });

    socket.on('disconnect', () => {
        console.log('User disconnected:', socket.id);
    });
});


// Static list of movies
const movies = [
    { name: "The Dark Knight", genre: "action", rating: 4.9 },
    { name: "Inception", genre: "sci-fi", rating: 4.7 },
    { name: "The Godfather", genre: "drama", rating: 4.8 },
    { name: "Superbad", genre: "comedy", rating: 3.9 },
    { name: "Interstellar", genre: "sci-fi", rating: 4.6 },
    { name: "Pulp Fiction", genre: "drama", rating: 4.7 },
    { name: "Avengers: Endgame", genre: "action", rating: 4.5 },
    { name: "The Hangover", genre: "comedy", rating: 3.8 },
    { name: "Forrest Gump", genre: "drama", rating: 4.6 },
    { name: "Guardians of the Galaxy", genre: "sci-fi", rating: 4.3 }
];

// Use the cors middleware to allow requests from any origin
app.use(cors()); // This allows all origins (e.g., http://localhost:5500 or 8000)

// Middleware to serve static files (frontend)
app.use(express.static('public'));

// Route to get all movies
app.get('/movies', (req, res) => {
    res.json(movies);
});

// Route to get movies by genre
app.get('/movies/genre/:genre', (req, res) => {
    const genre = req.params.genre.toLowerCase();
    const filteredMovies = movies.filter(movie => movie.genre.toLowerCase() === genre);
    res.json(filteredMovies);
});

// Route to search movies by name
app.get('/movies/search/:name', (req, res) => {
    // For now, return a default response indicating "unknown movie and genre".
    // You should replace this logic with actual search functionality.

    // Default response
    const result = {
        name: "Unknown Movie",
        genre: "Unknown Genre"
    };

    res.json([result]); // Send the default response as JSON

    // TODO: Implement the search functionality here
    // Hints:
    // 1. Extract the `name` parameter from the request using `req.params.name`.
    // 2. Convert the `name` parameter and movie names to lowercase for case-insensitive matching.
    // 3. Use `.filter()` to find movies whose names include the search term.
    // 4. Return the filtered list of movies using `res.json(filteredMovies)`.
});

// Start server with HTTP + WebSocket support
server.listen(port, () => {
    console.log(`Server running at http://localhost:${port}`);
});
