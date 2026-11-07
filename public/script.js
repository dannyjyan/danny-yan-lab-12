// Specify the base URL for the backend
const BASE_URL = 'http://localhost:3000'; // Change this when deploying to production

const movieName = document.getElementById('movieName');
const movieGenre = document.getElementById('movieGenre');
const genreDropdown = document.getElementById('genre');
const searchInput = document.getElementById('searchInput');
const getMovieButton = document.getElementById('getMovieButton');
const searchButton = document.getElementById('searchButton');
const clearButton = document.getElementById('clearButton');
document.getElementById('agentTimestamp').textContent = new Date().toLocaleString('en-US');
// Function to fetch and display movies
function fetchMovies(endpoint) {
    console.log(`Fetching movies from: ${BASE_URL}${endpoint}`);
    fetch(`${BASE_URL}${endpoint}`).then(response => response.json()).then(data => {
        if (data.length === 0) {
            movieName.textContent = "No movies found.";
            movieGenre.textContent = "";
            return;
        }

        // Display the first movie from the results
        const movie = data[Math.floor(Math.random() * data.length)];
        movieName.textContent = `🎬 Name: ${movie.name}`;
        movieGenre.textContent = `📽️ Genre: ${movie.genre}`;
        if (movie.name.toLowerCase() === "unknown movie") {
            alert("Search is not implemented yet.");
        }
    }).catch(error => console.error('Error fetching movies:', error));
}

// Event listeners
getMovieButton.addEventListener('click', () => {
    fetchMovies('/movies');
});

searchButton.addEventListener('click', () => {
    const searchTerm = searchInput.value.trim().toLowerCase();
    if (!searchTerm) {
        alert("Please enter a movie name to search.");
        return;
    }
    fetchMovies(`/movies/search/${searchTerm}`);
});

genreDropdown.addEventListener('change', () => {
    const genre = genreDropdown.value.toLowerCase();
    const url = genre === 'all' ? '/movies' : `/movies/genre/${genre}`;
    fetchMovies(url);
});

clearButton.addEventListener('click', () => {
    movieName.textContent = "Click 'Get Movie' to start!";
    movieGenre.textContent = "";
    searchInput.value = "";
});

// Setup WebSocket connection
const socket = io(BASE_URL, {
    auth: { conversationId: sessionStorage.getItem('conversationId') },
});
socket.on('conversationSession', (conversationId) => {
    sessionStorage.setItem('conversationId', conversationId);
    socket.auth.conversationId = conversationId;
});

// DOM elements
const chatWindow = document.getElementById('chatWindow');
const chatInput = document.getElementById('chatInput');
const sendChatBtn = document.getElementById('sendChatBtn');

// Send message to server
sendChatBtn.addEventListener('click', () => {
    const msg = chatInput.value.trim();
    if (!msg) return;

    appendMessage('User', msg);
    console.log(`User (${socket.id}) sent:`, msg);

    // Check if the message contains '@openrouter' (case-insensitive)
    if (msg.toLowerCase().includes('@openrouter')) {
        // Disable input and button while waiting for Gemini's response
        chatInput.disabled = true;
        sendChatBtn.disabled = true;

        // Display a note to the user
        const note = document.createElement('div');
        note.id = 'openrouterNote';
        note.textContent = 'The assistant is generating a response.';
        note.style.color = 'blue';
        note.style.marginTop = '10px';
        chatWindow.appendChild(note);
    }

    socket.emit('userMessage', msg);
    chatInput.value = '';
});

socket.off('agentReply'); // Ensure no duplicate listeners
// Receive reply from server/agent
socket.on('agentReply', (reply) => {
    appendMessage('Agent', reply);

    // Re-enable input and button after receiving Gemini's response
    chatInput.disabled = false;
    sendChatBtn.disabled = false;

    // Remove the note if it exists
    const note = document.getElementById('openrouterNote');
    if (note) {
        chatWindow.removeChild(note);
    }
});

// Remove redundant listener for `userIncomingMessage`
socket.off('userIncomingMessage');

// Listen for manager replies
socket.on('managerReply', (reply) => {
    appendMessage('Manager', reply);
});

// Helper to format timestamp
function formatTimestamp() {
    const now = new Date();
    const date = now.toLocaleDateString('en-US');
    const time = now.toLocaleTimeString('en-US');
    return `${date}, ${time}`;
}

// Helper to show messages with proper format
function appendMessage(sender, message) {
    const messageDiv = document.createElement('div');

    // Determine the class based on the sender
    if (sender === 'Agent') {
        messageDiv.className = 'message agent-message';
    } else if (sender === 'Manager') {
        messageDiv.className = 'message manager-message';
    } else {
        messageDiv.className = 'message user-message';
    }

    const timestamp = formatTimestamp();
    const timestampElement = document.createElement('small');
    timestampElement.className = 'timestamp';
    timestampElement.textContent = timestamp;

    const messageContent = document.createElement('p');

    // Determine the label based on the sender
    if (sender === 'Agent') {
        messageContent.textContent = `🛎️ Agent (OpenRouter): ${message}`;
    } else if (sender === 'Manager') {
        messageContent.textContent = `👨‍💼 Manager: ${message}`;
    } else {
        messageContent.textContent = `🧑 You: ${message}`;
    }

    messageDiv.appendChild(timestampElement);
    messageDiv.appendChild(messageContent);

    chatWindow.appendChild(messageDiv);
    chatWindow.scrollTop = chatWindow.scrollHeight;
}

// Update agent timestamp dynamically
const agentTimestampElement = document.getElementById('agentTimestamp');
if (agentTimestampElement) {
    agentTimestampElement.textContent = formatTimestamp();
}
