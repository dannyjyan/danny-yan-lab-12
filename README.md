# CPSC 449 Lab 12: Context-Aware Movie Chat with OpenRouter

## Overview

In this lab, extend the **Movie Manager** with a chat assistant that answers questions using movie and rating data stored in MongoDB. The application uses Node.js, Express, Socket.IO, Mongoose, and the OpenRouter chat completions API. Messages containing `@openrouter` are sent from the browser to the Express server, which retrieves relevant records and includes them as context in the model request.

The server retrieves focused movie records for each OpenRouter request and includes the conversation’s recent messages. Evaluate whether responses accurately reflect the source data.

AI conversations use a random session token stored in the browser tab’s `sessionStorage`, so refreshing or reconnecting that tab keeps its conversation. The `conversations` collection stores up to 20 recent user/assistant messages per token, in chronological order. Each request includes that history before the newest question and database context. Only messages containing `@openrouter` and successful assistant replies are saved; failed requests retain the user question without inventing an assistant reply. AI messages and replies are not broadcast to other chats or the manager. Normal manager messages retain their existing behavior. Keep the session token private; this lab uses session tokens rather than user accounts. To test a separate conversation, open the app independently in another tab (duplicating a tab can copy its session storage).

## Learning Objectives

- Call a hosted language model from a Node.js backend.
- Keep API keys and database credentials outside source control.
- Retrieve relevant movie and rating records from MongoDB.
- Add database records and clear instructions to an OpenRouter request.
- Preserve conversation history while keeping chats isolated by session.
- Evaluate generated answers against authoritative database records.

## Before You Start

1. Install Node.js and npm.
2. Create an [OpenRouter](https://openrouter.ai/) account and API key.
3. Prepare MongoDB data containing movies and, if available, reviews and user preferences.
4. Review the provider's current model availability, quotas, and data-use terms before sending data.

Check your Node.js and npm versions:

```bash
node -v
npm -v
```

Keep API keys and database credentials on the server. Do not commit `.env` or put secrets in browser JavaScript.

## Project Structure

- `server.js` configures Express, Socket.IO, Mongoose, OpenRouter, and the movie routes.
- `models/Movie.js` defines the movie model (`name`, `genre`, and `rating`).
- `models/Review.js` reads written reviews from the existing `reviews` collection.
- `movie-context.js` selects movies and reviews for assistant requests.
- `public/index.html` contains the movie search and chat interface.
- `public/script.js` sends user messages and renders assistant and manager replies.
- `public/manager.html` and `public/manager.js` provide the manager dashboard.
- `.env.sample` documents the server-side OpenRouter configuration.

## Request and Context Flow

```text
Browser sends userMessage over Socket.IO
                 |
                 v
Express detects the @openrouter mention
                 |
                 v
Query MongoDB for relevant movies and ratings
                 |
                 v
Build OpenRouter messages with instructions and database context
                 |
                 v
OpenRouter returns a model response
                 |
                 v
Express emits agentReply to the browser
```

MongoDB is the source of truth for application-specific facts. The model should summarize or reason over retrieved records, and say when those records do not contain an answer.

## Setup and Running the App

1. Install the project dependencies:

   ```bash
   npm install
   ```

2. Copy `.env.sample` to `.env` and set your OpenRouter key. The default `openrouter/free` route selects an available free model; model availability and limits can change.

   ```env
   OPENROUTER_API_KEY=your_openrouter_api_key
   OPENROUTER_MODEL=openrouter/free
   ```

3. Start MongoDB Community Server and confirm the Lab 3 seed data is loaded in `moviesDB.movies`.

4. Start the development server:

   ```bash
   npm run dev
   ```

5. Open the application through Express:

   ```text
   http://localhost:3000/index.html
   ```

6. Optionally open the manager dashboard in another browser session:

   ```text
   http://localhost:3000/manager.html
   ```

Send a chat message containing `@openrouter` to call the assistant. Normal messages remain available to the manager dashboard.

## OpenRouter Free Models

The starter uses the `openrouter/free` model route. OpenRouter chooses a currently available free model for each request. This route does not guarantee a particular model, and free model availability and rate limits may change. Review the [free models collection](https://openrouter.ai/collections/free-models) before selecting or documenting a specific model.

## MongoDB Integration

The app uses Mongoose and connects in `server.js` to the Lab 3 `moviesDB.movies` database at `mongodb://localhost:27017/moviesDB`. No MongoDB variables are needed in `.env`. Start MongoDB and populate the database using your Lab 3 project before starting this server.

The movie API is also backed by the same Mongoose model:

| Method | Route | Behavior |
| --- | --- | --- |
| `GET` | `/movies` | Return all movie documents. |
| `GET` | `/movies/genre/:genre` | Return movies matching a genre, case-insensitively. |
| `GET` | `/movies/search/:name` | Return partial, case-insensitive name matches. |
| `GET` | `/movies/:id` | Return one movie by its MongoDB ID. |

The current database uses the later labs’ schema: movies have `name`, `genre`, and numeric `rating`; written reviews are stored in `reviews` with `movieId`, `comment`, `rating`, and `createdAt`. `server.js` connects through Mongoose once at startup. The UI and assistant use `averageRating`, calculated from stored reviews; movies without ratings have a null average. The legacy movie `rating` field is not used for assistant recommendations.

Example Mongoose lookup for a title and its stored fields:

```javascript
const movies = await Movie.find({
  name: { $regex: escapedSearchTerm, $options: 'i' },
}).limit(10).lean();
```

For example, escape input before using it in a regular expression:

```javascript
const escapedSearchTerm = searchTerm.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
```

For specific movie questions, the assistant matches full titles. Recommendation questions retrieve candidates by the named genre, or the genre of a referenced movie if no genre is named, and recognize exclusions such as “excluding Inception,” “other than Inception,” and “don’t recommend Inception.” Otherwise, it selects movies by highest average review rating. It includes the database’s distinct genres, up to 10 movies, and up to 5 recent written reviews per selected movie. Reviewer identities are excluded. Questions using partial titles may need the full title to retrieve the intended record.

## Add MongoDB Records as OpenRouter Context

Build the OpenRouter `messages` array from the instructions, selected records, and user's question. The following example shows the expected structure; define `records` from your MongoDB query and `question` from the incoming chat message with the `@openrouter` trigger removed if desired.

```javascript
const messages = [
  {
    role: 'system',
    content: 'Answer movie questions using the supplied database context. If the context lacks the answer, say so. Do not invent movie or review facts.',
  },
  {
    role: 'user',
    content: `Database context:\n${JSON.stringify(records)}\n\nQuestion:\n${question}`,
  },
];
```

Pass `messages` in the chat completions request:

```javascript
const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
  method: 'POST',
  headers: {
    Authorization: `Bearer ${process.env.OPENROUTER_API_KEY}`,
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({
    model: process.env.OPENROUTER_MODEL || 'openrouter/free',
    messages,
  }),
});

const result = await response.json();
if (!response.ok) {
  throw new Error(result.error?.message || `OpenRouter returned HTTP ${response.status}`);
}
const reply = result.choices?.[0]?.message?.content;
```

Keep context compact and label records clearly. For example, include a movie title, genre, stored rating, and a small set of review texts. Treat database values as untrusted input and never include secrets or private user information in the prompt.

## Student TODOs

### TODO 1: Run and Inspect the Starter

1. Add `OPENROUTER_API_KEY` to your local `.env` file and confirm `.env` is ignored by Git.
2. Start the server and open the app through Express.
3. Send a normal message, then one containing `@openrouter`.
4. Inspect how `server.js` queries MongoDB and passes the returned records as OpenRouter context.

### TODO 2: Extend MongoDB Context

1. Review the Mongoose model and confirm the Lab 3 movies are loaded in `moviesDB.movies`.
2. Test title, genre, and recommendation questions against the stored records.
3. If your database has written reviews in a separate collection, query relevant reviews and add them to the context.
4. Add relevant user preferences or conversation history if your implementation stores them.
5. Handle connection and query errors without exposing credentials to clients.

### TODO 3: Ground Responses in Database Records

1. Identify which database records are relevant to each question.
2. Convert the retrieved records into compact context.
3. Add a system instruction that tells the model to use the supplied context and acknowledge missing information.
4. Include the user's question in the OpenRouter `messages` array.
5. Test questions about a movie with records, a movie without records, and recommendations based on stored ratings or reviews.
6. Compare factual claims in each answer with the MongoDB records used as context.

### TODO 4: Add Conversation Memory

1. Assign a conversation ID to each chat session.
2. Load prior user and assistant turns in chronological order.
3. Convert them to OpenRouter `user` and `assistant` message objects.
4. Include the history before the newest user message.
5. Save each user message and completed assistant reply.
6. Limit history by count, age, relevance, or token budget.
7. Keep one user's conversation separate from every other user's conversation.

Test memory by sharing a movie or genre preference, continuing the conversation, and later asking the assistant to recall it.

Run `npm test` with local MongoDB running to check saved history, session isolation, history limits, failed requests, and overlapping requests. The test uses a temporary database that it deletes afterward and stubs OpenRouter; it does not call a live model.

### TODO 5: Evaluate and Document

1. Ask which genres the database supports.
2. Request a recommendation from the stored movie list.
3. Ask for a summary of stored movie reviews and ratings.
4. Capture each prompt, response, and database records used as evidence.
5. Identify accurate, inaccurate, unsupported, and omitted claims.
6. Report an accuracy measure and explain how you calculated it.
7. Explain how database context affected the response.

Do not claim that a response is grounded merely because it sounds correct. Show that the relevant records were retrieved and included in the request.

## Completion Checklist

- [ ] The application calls OpenRouter from the backend.
- [ ] API keys and database credentials remain outside source control.
- [ ] MongoDB movie and review data load successfully.
- [ ] Requests include relevant database context.
- [ ] Conversation history is saved, loaded, and isolated by session.
- [ ] Responses reflect stored genres, movies, and reviews without inventing missing facts.
- [ ] Database and model errors are handled without breaking the chat interface.

## Submission Requirements

Submit the items required by your instructor, including:

1. A screenshot of the MongoDB records used as model context.
2. A prompt and response about genres supported by the database.
3. A prompt and response requesting a supported movie recommendation.
4. A prompt and response summarizing stored reviews and ratings.
5. Evidence that a later prompt uses an earlier conversation detail.
6. An accuracy report comparing generated claims with the database.
7. A short description of how context is retrieved, limited, ordered, and saved.
8. Your completed project files in the correct repository and branch.

Before submitting, confirm screenshots do not show API keys, connection strings, private user information, or other secrets. Do not commit `.env` or `node_modules/`.

## Troubleshooting

### The server does not start

- Run `npm install` and try `npm run dev` again.
- Confirm `.env` exists and contains `OPENROUTER_API_KEY`.
- Confirm port `3000` is available.
- Read the first meaningful error in the server terminal.

### OpenRouter rejects the request

- Confirm the OpenRouter key is valid and loaded from `.env`.
- Review the provider error, selected model availability, and free-tier limits.
- Check that the request uses the chat completions format shown above.
- Revoke and replace a key immediately if it was committed or exposed.

### The assistant does not answer

- Include `@openrouter` in the message.
- Check the browser console for Socket.IO errors.
- Check the server terminal for the `userMessage` event and OpenRouter error.
- Confirm chat controls are re-enabled after the error path.

### MongoDB context is missing or inaccurate

- Confirm MongoDB Community Server is running and `moviesDB.movies` contains the Lab 3 seed data.
- Check the connection string in `server.js` and confirm model fields match the stored documents.
- Log query result counts and safe record identifiers on the server.
- Verify the context included in the request matches the records returned by MongoDB.

### The assistant invents movie or review details

- Reduce unrelated context and clearly label authoritative records.
- Tell the assistant to use only supplied records for database-specific claims.
- Ask it to state when the database lacks an answer.
- Verify that the query returned the intended movie and reviews.

## References

- [OpenRouter](https://openrouter.ai/)
- [OpenRouter free models](https://openrouter.ai/collections/free-models)
- [OpenRouter API documentation](https://openrouter.ai/docs)
- [Mongoose documentation](https://mongoosejs.com/docs/)
- [MongoDB Node.js driver documentation](https://www.mongodb.com/docs/drivers/node/current/)
