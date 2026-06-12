/* Movie Search Engine (Block 2)
   Implements OMDb-backed movie search UI:
   - searchMovies() / fetchMovies(query)
   - loader + error handling
   - Bootstrap responsive movie cards
*/

const API_KEY = "ec28b25";
const BASE_URL = "https://www.omdbapi.com/";

const inputEl = document.getElementById("movie-search-input");
const resultsEl = document.getElementById("movie-container");
const loaderEl = document.getElementById("loader");
const errorEl = document.getElementById("error-message");

// The Search button currently has no id; select it inside the search section.
const searchButtonEl = document.querySelector("#search .btn.btn-primary");

const PLACEHOLDER_POSTER_DATA_URI =
  "data:image/svg+xml;charset=UTF-8," +
  encodeURIComponent(
    `<?xml version="1.0" encoding="UTF-8"?>
     <svg xmlns="http://www.w3.org/2000/svg" width="300" height="450" viewBox="0 0 300 450">
       <defs>
         <linearGradient id="g" x1="0" y1="0" x2="0" y2="1">
           <stop offset="0" stop-color="#1f2a44"/>
           <stop offset="1" stop-color="#0b1220"/>
         </linearGradient>
       </defs>
       <rect width="300" height="450" fill="url(#g)" rx="16" ry="16"/>
       <rect x="22" y="22" width="256" height="406" fill="none" stroke="#6ea8fe" stroke-opacity="0.35" rx="14" ry="14"/>
       <text x="150" y="232" text-anchor="middle" font-family="system-ui,Segoe UI,Roboto,Arial" font-size="16" fill="#eaf0ff" fill-opacity="0.85">Poster</text>
       <text x="150" y="258" text-anchor="middle" font-family="system-ui,Segoe UI,Roboto,Arial" font-size="14" fill="#aab6da" fill-opacity="0.95">Unavailable</text>
     </svg>`
  );

/**
 * Clears the movie results container.
 */
function clearResults() {
  if (!resultsEl) return;
  resultsEl.innerHTML =
    '<p class="text-muted mb-0 empty-state">Search for a movie to get started.</p>';
}

function showLoader() {
  if (!loaderEl) return;
  loaderEl.classList.remove("d-none");
}

function hideLoader() {
  if (!loaderEl) return;
  loaderEl.classList.add("d-none");
}

/**
 * Shows a friendly error message.
 * @param {string} message
 */
function showError(message) {
  if (!errorEl) return;
  errorEl.textContent = message;
  errorEl.classList.remove("d-none");
}

/**
 * Renders movie cards inside the results container.
 * @param {Array<{imdbID:string, Poster:string, Title:string, Year:string, Type:string}>} movies
 */
function displayMovies(movies) {
  if (!resultsEl) return;

  if (!Array.isArray(movies) || movies.length === 0) {
    resultsEl.innerHTML =
      '<p class="text-muted mb-0 empty-state">No results found.</p>';
    return;
  }

  const cardsHtml = movies
    .map((movie) => {
      const posterUrl = movie.Poster && movie.Poster !== "N/A" ? movie.Poster : PLACEHOLDER_POSTER_DATA_URI;
      const title = movie.Title ?? "Untitled";
      const year = movie.Year ?? "—";
      const type = movie.Type ?? "—";

      return `
        <div class="col-12 col-md-6 col-lg-4 col-xl-3">
          <div class="card h-100 bg-transparent border-0">
            <div class="card-body p-0">
              <div
                class="movie-card border rounded-4 overflow-hidden"
                data-imdb-id="${movie.imdbID || ""}"
                aria-label="Movie result: ${title}"
              >
                <img
                  src="${posterUrl}"
                  class="w-100 d-block"
                  alt="Poster for ${title}"
                  loading="lazy"
                />
                <div class="p-3">
                  <h3 class="h6 mb-1 text-white">${title}</h3>
                  <p class="mb-1 text-muted small">Year: ${year}</p>
                  <p class="mb-0 text-muted small">Type: ${type}</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      `;
    })
    .join("");

  resultsEl.innerHTML = `
    <div class="row g-3" role="list">
      ${cardsHtml}
    </div>
  `;
}

/**
 * Fetches movies from OMDb.
 * @param {string} query
 */
async function fetchMovies(query) {
  const url = new URL(BASE_URL);
  url.searchParams.set("apikey", API_KEY);
  url.searchParams.set("s", query);

  const res = await fetch(url.toString());
  if (!res.ok) {
    throw new Error("Network failure. Please try again.");
  }

  const data = await res.json();

  // OMDb uses { Response: "False", Error: "Movie not found!" }
  if (data?.Response === "False") {
    const apiError = data?.Error || "Movie not found.";
    // Normalize to a friendlier message.
    if (/not found/i.test(apiError)) {
      throw new Error("Movie not found. Try a different title.");
    }
    throw new Error("API failure. Please try again.");
  }

  if (!Array.isArray(data?.Search)) {
    throw new Error("Unexpected API response. Please try again.");
  }

  return data.Search;
}

/**
 * Validates input, fetches movies, shows loader, and displays results.
 */
async function searchMovies() {
  const rawQuery = inputEl?.value ?? "";
  const query = rawQuery.trim();

  // Reset UI state
  if (errorEl) errorEl.classList.add("d-none");
  clearResults();

  if (!query) {
    showError("Please enter a movie title.");
    return;
  }

  try {
    showLoader();
    const movies = await fetchMovies(query);
    hideLoader();
    displayMovies(movies);
  } catch (err) {
    hideLoader();
    showError(err?.message || "Something went wrong. Please try again.");
    // Keep results empty/clean
    clearResults();
  }
}

// Initialize once DOM is ready (script is module so it executes late, but keep safe)
window.addEventListener("DOMContentLoaded", () => {
  // Default results
  clearResults();

  // Search button click
  if (searchButtonEl) {
    searchButtonEl.addEventListener("click", () => {
      searchMovies();
    });
  }

  // Enter key press inside input
  if (inputEl) {
    inputEl.addEventListener("keydown", (e) => {
      if (e.key === "Enter") {
        e.preventDefault();
        searchMovies();
      }
    });
  }
});


