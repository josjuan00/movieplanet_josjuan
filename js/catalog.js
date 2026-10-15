async function loadCatalog(endpoint, params = {}, append = false) {
  const requestId = ++catalogRequestId;
  const page = params.page || 1;
  if (!append) renderSkeletons(10);

  const data = await fetchTMDB(endpoint, params);
  if (requestId !== catalogRequestId) return false;

  if (!data || !Array.isArray(data.results)) {
    if (!append) {
      showCatalogMessage('No se han podido cargar las películas. Comprueba tu conexión y la API key de TMDB (js/config.js).');
    }
    return false;
  }

  currentPage = page;
  totalPages = data.total_pages || 1;
  displayMovies(data.results, append);
  return true;
}

function showCatalogMessage(message) {
  if (!moviesGrid) return;
  moviesGrid.innerHTML = `<p style="color: var(--text-secondary); grid-column: 1/-1; text-align: center; padding: 3rem 1rem;">${message}</p>`;
  if (loadMoreBtn) loadMoreBtn.style.display = 'none';
}

function getPopularMovies(page = 1, append = false) {
  return loadCatalog('/movie/popular', { page }, append);
}

function loadGenreMovies(genreId, page = 1, append = false) {
  return loadCatalog('/discover/movie', { with_genres: genreId, page }, append);
}

function loadActorMovies(actorId, page = 1, append = false) {
  return loadCatalog('/discover/movie', { with_cast: actorId, page }, append);
}

function searchMovies(query, page = 1, append = false) {
  return loadCatalog('/search/movie', { query, page }, append);
}

function displayMovies(movies, append = false) {
  if (!moviesGrid) return;

  if (!append) {
    currentLoadedMovies = Array.isArray(movies) ? [...movies] : [];
  } else if (Array.isArray(movies)) {
    const existingIds = new Set(currentLoadedMovies.map(m => m.id));
    currentLoadedMovies = [...currentLoadedMovies, ...movies.filter(m => !existingIds.has(m.id))];
  }

  moviesGrid.innerHTML = '';
  const sortedMovies = sortMovieList(currentLoadedMovies, currentSort);

  if (!sortedMovies || sortedMovies.length === 0) {
    showCatalogMessage('No hay películas disponibles en esta sección.');
    return;
  }

  sortedMovies.forEach(movieData => {
    const mediaObj = createMediaInstance(movieData);
    moviesGrid.appendChild(mediaObj.render());
  });

  if (loadMoreBtn) {
    const hasMore = !isPersonalViewActive && currentPage < totalPages;
    loadMoreBtn.style.display = hasMore ? 'inline-flex' : 'none';
  }
}

function refreshCurrentPersonalView() {
  if (!isPersonalViewActive) return;
  const activeHeaderBtn = document.querySelector('.header-nav-btn.active');
  if (activeHeaderBtn) {
    const view = activeHeaderBtn.dataset.view;
    if (view === 'favorites') displayMovies(getList(LIST_KEYS.favorites));
    if (view === 'watched') displayMovies(getList(LIST_KEYS.watched));
    if (view === 'watchlist') displayMovies(getList(LIST_KEYS.watchlist));
  }
}
