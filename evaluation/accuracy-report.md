# TODO 5: Accuracy evaluation

Evaluated on November 7, 2026. Three live OpenRouter responses were captured using separate, empty chat sessions. All requests used `openrouter/free`; the actual response model is recorded in each evidence file. These are live responses, not stubbed test outputs.

## Result and scoring method

**Supported-claim accuracy: 19 / 20 × 100 = 95%.**

A claim is a distinct, checkable factual relationship, such as a movie’s genre, an average, a review count, or a particular comment paired with its rating. A listed genre counts as one claim. Repeated facts are counted once within each response. A quoted review and its associated rating count as one record-matching claim. Subjective judgments such as “high,” “solid,” and “recommended” are not scored as facts. Interpretive wording in summaries is distinguished from literal database text below.

- **Supported:** matches the captured records or the independent database verification.
- **Inaccurate:** contradicted by the records.
- **Unsupported:** not established by the supplied records; this does not necessarily mean false.
- **Omitted:** a requested fact absent from the answer. Omissions are noted separately and do not reduce the claim-accuracy denominator.

| Evaluation | Supported | Inaccurate | Unsupported | Total claims | Accuracy |
| --- | ---: | ---: | ---: | ---: | ---: |
| Supported genres | 5 | 0 | 0 | 5 | 100% |
| Sci-fi recommendation | 10 | 0 | 0 | 10 | 100% |
| Inception review summary | 4 | 0 | 1 | 5 | 80% |
| **Total** | **19** | **0** | **1** | **20** | **95%** |

No requested genre, recommendation field, review, average, or review count was omitted in these three responses. This small sample measures the captured answers only; it is not a general accuracy guarantee or an automatic score for future messages.

## Claim-by-claim assessment

### Genres: 5 supported claims

The response lists action, sci-fi, drama, comedy, and horror. Each appears in the supplied `context.genres`, and the list matches the database’s distinct genres. No genres were added or omitted.

### Recommendation: 10 supported claims

1. Inception is a sci-fi movie.
2. Inception’s average review rating is 4.1.
3. Inception has two stored reviews.
4. Inception is the only sci-fi movie with stored reviews. The three retrieved sci-fi candidates support the comparison; the independent full sci-fi database query also confirms the database-wide wording.
5. A stored review praises Inception as “Mind-bending and visually stunning.”
6. Another stored review calls it confusing.
7. Guardians of the Galaxy is a sci-fi candidate.
8. Guardians of the Galaxy has no stored reviews or aggregate review rating.
9. Interstellar is a sci-fi candidate.
10. Interstellar has no stored reviews or aggregate review rating.

The recommendation follows the requested review-based criterion: Inception has a numeric average; the two alternatives are unrated, not rated zero. “High” is a subjective characterization, not an additional scored factual claim.

### Review summary: 4 supported claims, 1 unsupported claim

1. **Supported:** Inception’s average is 4.1, calculated from all two stored ratings: (4.7 + 3.5) / 2.
2. **Supported:** The total review count is two.
3. **Supported:** The favorable comment is paired with rating 4.7. The response changes a hyphen to a typographic nonbreaking hyphen without changing meaning.
4. **Supported:** The critical comment is paired with rating 3.5.
5. **Unsupported:** The response describes the average as **4.1/5**. The context contains the numeric ratings but does not declare a maximum rating scale. The “/5” assumption is not established by this evidence, even if the application convention is five points.

The final sentence’s “creativity” and “plot somewhat convoluted” are interpretive paraphrases of “mind-bending” and “overcomplicated and a bit confusing”; they are not literal quotations or new independently verified movie facts. “Solid” is subjective. The exact source wording is retained in the evidence for review.

## Evidence and effect of context

Each JSON file contains the original prompt, full model response, timestamp, requested and returned model names, selected database records with movie/review IDs, and the exact `requestMessages` array. The context inside that array was checked against the exported snapshot. The records, counts, and calculated averages were then independently checked against MongoDB; see [database verification](database-verification.json). That independent check was not additional context sent to OpenRouter.

The genre answer used the database-wide genre list. The recommendation used the three matching sci-fi movies, their calculated averages, and their review counts, instead of the legacy zero-valued movie rating fields. The review summary used the two actual Inception comments and ratings. All three requests had no prior conversation turns, so the answers were evaluated without contamination from earlier assistant replies.

Retrieval supplies at most ten movies, ordered by average review rating, and at most five recent written reviews per movie. Genre names come from the complete movie catalog; review averages and counts use all stored reviews. In this evaluation Inception had only two reviews, so its supplied review text was complete. For larger review sets, the text sample would be partial even though the average and count cover all reviews.

An initial recommendation attempt was interrupted by the development server reloading while evidence files were being written. It produced no captured answer and is not scored. The successful recommendation and summary were run through an isolated instance of the same application to avoid further reload interruptions. No failed request is counted as a correct response.

## Captured prompts and responses

### Genres

[Full evidence](genres.json) · captured `2026-11-07T22:19:45.220Z` · model `dots-studio/dots-3-note-preview:free`

**Prompt:** @openrouter What genres are supported by our database? List the genre names.

**Response:**

> Based on the database context, the supported genres are:
> 
> * action
> * sci-fi
> * drama
> * comedy
> * horror

### Recommendation

[Full evidence](recommendation.json) · captured `2026-11-07T22:21:20.650Z` · model `dots-studio/dots-3-note-preview:free`

**Prompt:** @openrouter Recommend a sci-fi movie based on stored review ratings. Give its title, genre, average rating, review count, and a brief reason.

**Response:**

> Based on the stored review ratings in the database, the recommended sci-fi movie is **Inception**. 
> 
> Here are the details:
> * **Title:** Inception
> * **Genre:** sci-fi
> * **Average Rating:** 4.1
> * **Review Count:** 2
> * **Reason:** It is the only sci-fi movie in the database with stored reviews, holding a high average rating of 4.1. Viewers have praised it as "mind-bending and visually stunning," though some found it a bit confusing. The other sci-fi options (*Guardians of the Galaxy* and *Interstellar*) currently have no ratings or reviews stored.

### Reviews

[Full evidence](reviews.json) · captured `2026-11-07T22:21:22.797Z` · model `nvidia/nemotron-3-ultra-550b-a55b:free`

**Prompt:** @openrouter Summarize the stored reviews and ratings for Inception, including its average rating and review count.

**Response:**

> **Inception – Review Summary**
> 
> - **Average Rating:** 4.1 (based on all stored reviews)  
> - **Total Review Count:** 2  
> 
> **Stored Written Reviews**
> 
> | Rating | Comment |
> |--------|---------|
> | 4.7 | “Mind‑bending and visually stunning.” |
> | 3.5 | “Overcomplicated and a bit confusing.” |
> 
> Overall, the two reviews give Inception a solid average of **4.1/5**, with one viewer praising its creativity and visuals, while the other found the plot somewhat convoluted.

## Using the UI for submission evidence

Refresh the app after the updated server is running. Each new successful AI reply shows a **Sources** summary with movie, review, and prior-turn counts. Expand it to see titles, record IDs, sent versus total review counts, and averages. Expand **Exact prompt, response, and context** to inspect the full evidence, or select **Download evidence JSON** to save it. The same evidence is stored with the assistant message in MongoDB, until that message is trimmed by the 20-message conversation limit.

The source list is generated from the actual request snapshot; it is not a list of citations invented by the model. It identifies supplied evidence, not whether the model used every record correctly. Database records are sent, not source-code files. API credentials, reviewer identities, and the browser’s conversation token are excluded from the evidence export.

The automated evidence test passed, including request/snapshot equality, record identifiers, persistence, credential exclusion, and separation of evidence from later chat history. Live captures were also checked against MongoDB. A visual browser inspection and screenshots were not performed because no browser was connected.
