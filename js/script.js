

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
                <div class="p-3 d-flex flex-column h-100">
                  <h3 class="h6 mb-2 text-white">${title}</h3>
                  <div class="mt-auto">
                    <p class="mb-1 text-muted small">Year: ${year}</p>
                    <p class="mb-3 text-muted small">Type: ${type}</p>
                    <button
                      class="btn btn-outline-primary btn-sm w-100 view-details-btn"
                      type="button"
                      data-imdb-id="${movie.imdbID || ""}"
                      aria-label="View details for ${title}"
                    >
                      View Details
                    </button>
                  </div>
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
    console.log("Search started");
    showLoader();

    console.log("Fetching movies:", query);
    const movies = await fetchMovies(query);

    console.log("API Response received");
    console.log("Rendering movies");
    displayMovies(movies);
  } catch (err) {
    console.error("Search Error:", err);
    showError(err?.message || "Something went wrong. Please try again.");
    // Keep results empty/clean
    clearResults();
  } finally {
    console.log("Hiding loader");
    hideLoader();
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

  // Event delegation for View Details
  document.body.addEventListener("click", async (e) => {
    const btn = e.target?.closest?.(".view-details-btn");
    if (!btn) return;

    const imdbID = btn.getAttribute("data-imdb-id");
    if (!imdbID) {
      showErrorInModal("Invalid movie identifier.");
      return;
    }

    await fetchMovieDetails(imdbID);
  });
});

// ===== Movie Details Modal (Block 3) =====
const modalEl = document.getElementById("movie-details-modal");
const modalLoadingEl = document.getElementById("movie-details-loading");
const modalErrorEl = document.getElementById("movie-details-error");
const modalContentEl = document.getElementById("movie-details-content");
const modalPosterEl = document.getElementById("movie-details-poster");
const modalTitleEl = document.getElementById("movie-details-title");
const modalMetaEl = document.getElementById("movie-details-meta");

const modalRatingEl = document.getElementById("movie-details-rating");
const modalGenreEl = document.getElementById("movie-details-genre");
const modalRuntimeEl = document.getElementById("movie-details-runtime");

const modalReleasedEl = document.getElementById("movie-details-released");
const modalLanguageEl = document.getElementById("movie-details-language");
const modalCountryEl = document.getElementById("movie-details-country");
const modalDirectorEl = document.getElementById("movie-details-director");
const modalActorsEl = document.getElementById("movie-details-actors");
const modalAwardsEl = document.getElementById("movie-details-awards");
const modalPlotEl = document.getElementById("movie-details-plot");

function showModalLoading() {
  if (modalLoadingEl) modalLoadingEl.classList.remove("d-none");
  if (modalErrorEl) modalErrorEl.classList.add("d-none");
  if (modalContentEl) modalContentEl.classList.add("d-none");
}

function showErrorInModal(message) {
  if (modalLoadingEl) modalLoadingEl.classList.add("d-none");
  if (modalErrorEl) {
    modalErrorEl.textContent = message;
    modalErrorEl.classList.remove("d-none");
  }
  if (modalContentEl) modalContentEl.classList.add("d-none");
}

function showMovieDetails(movie) {
  if (!movie) {
    showErrorInModal("Movie details unavailable.");
    return;
  }

  const posterUrl = movie.Poster && movie.Poster !== "N/A" ? movie.Poster : PLACEHOLDER_POSTER_DATA_URI;
  const title = movie.Title ?? "Untitled";

  if (modalPosterEl) modalPosterEl.src = posterUrl;
  if (modalPosterEl) modalPosterEl.alt = `Poster for ${title}`;
  if (modalTitleEl) modalTitleEl.textContent = title;

  if (modalMetaEl) {
    const imdbIdText = movie.imdbID ? `IMDb: ${movie.imdbID}` : "";
    const metaPieces = [movie.Year ? `Year: ${movie.Year}` : "", imdbIdText].filter(Boolean);
    modalMetaEl.textContent = metaPieces.join(" • ");
  }

  if (modalRatingEl) modalRatingEl.textContent = `IMDb: ${movie.imdbRating ?? "—"}`;
  if (modalGenreEl) modalGenreEl.textContent = movie.Genre ?? "—";
  if (modalRuntimeEl) modalRuntimeEl.textContent = movie.Runtime ?? "—";

  if (modalReleasedEl) modalReleasedEl.textContent = movie.Released ?? "—";
  if (modalLanguageEl) modalLanguageEl.textContent = movie.Language ?? "—";
  if (modalCountryEl) modalCountryEl.textContent = movie.Country ?? "—";
  if (modalDirectorEl) modalDirectorEl.textContent = movie.Director ?? "—";
  if (modalActorsEl) modalActorsEl.textContent = movie.Actors ?? "—";
  if (modalAwardsEl) modalAwardsEl.textContent = movie.Awards ?? "—";
  if (modalPlotEl) modalPlotEl.textContent = movie.Plot && movie.Plot !== "N/A" ? movie.Plot : "Plot unavailable.";

  if (modalLoadingEl) modalLoadingEl.classList.add("d-none");
  if (modalErrorEl) modalErrorEl.classList.add("d-none");
  if (modalContentEl) modalContentEl.classList.remove("d-none");
}

function openMovieModal() {
  if (!modalEl) return;

  // Bootstrap modal instance
  // eslint-disable-next-line no-undef
  const modal = bootstrap?.Modal?.getOrCreateInstance?.(modalEl);
  if (modal && typeof modal.show === "function") modal.show();

  // Focus management: keep the close button reachable
  const closeBtn = modalEl.querySelector(".btn-close");
  closeBtn?.focus?.();
}

function closeMovieModal() {
  if (!modalEl) return;
  // eslint-disable-next-line no-undef
  const modal = bootstrap?.Modal?.getOrCreateInstance?.(modalEl);
  if (modal && typeof modal.hide === "function") modal.hide();
}

async function fetchMovieDetails(imdbID) {
  if (!imdbID) {
    showErrorInModal("Invalid IMDb ID.");
    return;
  }

  if (!modalEl) return;

  openMovieModal();
  showModalLoading();

  try {
    const url = new URL(BASE_URL);
    url.searchParams.set("apikey", API_KEY);
    url.searchParams.set("i", imdbID);
    url.searchParams.set("plot", "full");

    const res = await fetch(url.toString());
    if (!res.ok) {
      throw new Error("Network failure. Please try again.");
    }

    const data = await res.json();

    if (data?.Response === "False") {
      const errMsg = data?.Error || "Movie details unavailable.";
      throw new Error(errMsg);
    }

    showMovieDetails(data);
  } catch (err) {
    showErrorInModal(err?.message || "Something went wrong. Please try again.");
  }
}




