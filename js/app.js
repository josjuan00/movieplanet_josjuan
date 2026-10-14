const TMDB_BASE_URL = 'https://api.themoviedb.org/3';
const TMDB_IMAGE_BASE = 'https://image.tmdb.org/t/p/w500';
const TMDB_BACKDROP_BASE = 'https://image.tmdb.org/t/p/w780';

const getApiKey = () => (typeof API_KEY !== 'undefined' ? API_KEY : '');

const PLACEHOLDER_POSTER = 'https://placehold.co/500x750/161616/f2f0e9?text=Sin+Imagen';
const BLANK_IMG = 'data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7';

function escapeHTML(value) {
  return String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

async function fetchTMDB(endpoint, params = {}) {
  const queryParams = new URLSearchParams({
    api_key: getApiKey(),
    language: 'es-ES',
    ...params
  });
  try {
    const response = await fetch(`${TMDB_BASE_URL}${endpoint}?${queryParams}`);
    if (!response.ok) throw new Error(`HTTP Error: ${response.status}`);
    return await response.json();
  } catch (error) {
    console.error(`Error en petición TMDB [${endpoint}]:`, error);
    return null;
  }
}


const moviesGrid = document.getElementById('movies-grid');
const featuredBannerTrack = document.getElementById('featured-banner-track');
const bannerSection = document.querySelector('.banner-section');
const categoriesSection = document.querySelector('.categories-section');
const searchInput = document.getElementById('search-input');
const searchWrapper = document.getElementById('search-wrapper') || document.querySelector('.search-wrapper');
const categoryCards = document.querySelectorAll('.category-card');
const catalogTitle = document.getElementById('catalog-title');
const loadMoreBtn = document.getElementById('load-more-btn');


const backToHomeBtn = document.getElementById('back-to-home-btn');
const inlineGenreWrapper = document.getElementById('inline-genre-wrapper');
const inlineGenreSelect = document.getElementById('inline-genre-select');
const sortSelect = document.getElementById('sort-select');


const movieModal = document.getElementById('movie-modal');
const modalCloseBtn = document.getElementById('modal-close-btn');
const modalBgGlow = document.getElementById('modal-bg-glow');

const filmotecaDropdownContainer = document.getElementById('filmoteca-dropdown-container');
const filmotecaDropdownBtn = document.getElementById('filmoteca-dropdown-btn');
const headerNavButtons = document.querySelectorAll('.header-nav-btn');


const themesDropdownContainer = document.getElementById('themes-dropdown-container');
const themesDropdownBtn = document.getElementById('themes-dropdown-btn');
const themeOptions = document.querySelectorAll('.theme-option');
const quizModal = document.getElementById('quiz-modal');
const quizBtn = document.getElementById('quiz-btn');
const quizCloseBtn = document.getElementById('quiz-close-btn');
const quizStepContainer = document.getElementById('quiz-step-container');


let currentPage = 1;
let currentGenre = 'all';
let currentSearchQuery = '';
let currentActorId = null;
let currentSort = 'popular';
let isPersonalViewActive = false;
let currentLoadedMovies = [];
let totalPages = 1;
let catalogRequestId = 0;
let quizAnswers = { genre: '', era: '', rating: '' };


const LIST_KEYS = {
  favorites: 'movieplanet_favs',
  watched: 'movieplanet_watched',
  watchlist: 'movieplanet_watchlist'
};

function getList(key) {
  try {
    const data = localStorage.getItem(key);
    const parsed = data ? JSON.parse(data) : [];
    return Array.isArray(parsed) ? parsed : [];
  } catch (error) {
    console.error(`Error al leer LocalStorage [${key}]:`, error);
    return [];
  }
}

function isInList(key, movieId) {
  return getList(key).some(m => String(m.id) === String(movieId));
}

function toggleMovieInList(key, movieData) {
  try {
    let list = getList(key);
    const index = list.findIndex(m => String(m.id) === String(movieData.id));
    const title = movieData.title || movieData.name || 'Película';
    const safeTitle = escapeHTML(title);

    if (index >= 0) {
      list.splice(index, 1);
      if (key === LIST_KEYS.favorites) showToast('💔 Eliminada de Favoritos');
      if (key === LIST_KEYS.watched) showToast('👁️ Marcada como no vista');
      if (key === LIST_KEYS.watchlist) showToast('📌 Eliminada de Mi Lista');
    } else {
      list.push({
        id: movieData.id,
        title: title,
        poster_path: movieData.poster_path,
        vote_average: movieData.vote_average,
        release_date: movieData.release_date
      });
      if (key === LIST_KEYS.favorites) showToast(`❤️ <strong>${safeTitle}</strong> añadida a Favoritos`);
      if (key === LIST_KEYS.watched) showToast(`👁️ <strong>${safeTitle}</strong> marcada como vista`);
      if (key === LIST_KEYS.watchlist) showToast(`📌 <strong>${safeTitle}</strong> añadida a Mi Lista`);
    }

    localStorage.setItem(key, JSON.stringify(list));
    updateCardActionButtonsUI(movieData.id);
  } catch (error) {
    console.error(`Error al actualizar LocalStorage [${key}]:`, error);
  }
}

function updateCardActionButtonsUI(movieId) {
  const isFav = isInList(LIST_KEYS.favorites, movieId);
  const isWatched = isInList(LIST_KEYS.watched, movieId);
  const isWatchlist = isInList(LIST_KEYS.watchlist, movieId);

  document.querySelectorAll(`.card-action-btn[data-movie-id="${movieId}"]`).forEach(btn => {
    const type = btn.dataset.type;
    if (type === 'fav') btn.classList.toggle('active', isFav);
    if (type === 'watched') btn.classList.toggle('active', isWatched);
    if (type === 'watchlist') btn.classList.toggle('active', isWatchlist);
  });

  document.querySelectorAll(`.modal-action-btn[data-movie-id="${movieId}"]`).forEach(btn => {
    const type = btn.dataset.type;
    if (type === 'fav') {
      btn.classList.toggle('active', isFav);
      btn.innerHTML = isFav ? '❤️ En Favoritos' : '🤍 Añadir Favoritos';
    }
    if (type === 'watched') {
      btn.classList.toggle('active', isWatched);
      btn.innerHTML = isWatched ? '👁️ Vista' : '👁️ Marcar Vista';
    }
    if (type === 'watchlist') {
      btn.classList.toggle('active', isWatchlist);
      btn.innerHTML = isWatchlist ? '📌 En Mi Lista' : '📌 Añadir a Mi Lista';
    }
  });
}

function getUserNotesData(movieId) {
  try {
    const notes = JSON.parse(localStorage.getItem('movieplanet_user_notes') || '{}');
    return notes[movieId] || { rating: 0, note: '' };
  } catch {
    return { rating: 0, note: '' };
  }
}

function saveUserNotesData(movieId, rating, note) {
  try {
    const notes = JSON.parse(localStorage.getItem('movieplanet_user_notes') || '{}');
    notes[movieId] = { rating, note };
    localStorage.setItem('movieplanet_user_notes', JSON.stringify(notes));
    showToast('📝 Nota personal guardada');
  } catch (e) {
    console.error('Error al guardar notas:', e);
  }
}


function showToast(message) {
  // Si hay un modal abierto, el toast debe vivir dentro de él (capa superior)
  const host = document.querySelector('dialog[open]') || document.body;
  let container = host.querySelector(':scope > .toast-container');
  if (!container) {
    container = document.createElement('div');
    container.className = 'toast-container';
    host.appendChild(container);
  }

  const toast = document.createElement('div');
  toast.className = 'toast';
  toast.setAttribute('role', 'status');
  toast.setAttribute('aria-live', 'polite');
  toast.innerHTML = message;

  container.appendChild(toast);

  requestAnimationFrame(() => toast.classList.add('show'));

  setTimeout(() => {
    toast.classList.remove('show');
    setTimeout(() => {
      toast.remove();
      if (container.children.length === 0) container.remove();
    }, 350);
  }, 3000);
}

function renderSkeletons(count = 10) {
  if (!moviesGrid) return;
  moviesGrid.innerHTML = '';
  for (let i = 0; i < count; i++) {
    const skeleton = document.createElement('div');
    skeleton.className = 'skeleton-card';
    moviesGrid.appendChild(skeleton);
  }
}

function debounce(func, delay = 350) {
  let timeout;
  return (...args) => {
    clearTimeout(timeout);
    timeout = setTimeout(() => func(...args), delay);
  };
}

function sortMovieList(movies, sortType) {
  if (!Array.isArray(movies) || movies.length === 0) return [];
  const sorted = [...movies];

  switch (sortType) {
    case 'rating_desc':
      return sorted.sort((a, b) => (b.vote_average || 0) - (a.vote_average || 0));
    case 'date_desc':
      return sorted.sort((a, b) => {
        const dateA = a.release_date ? new Date(a.release_date) : new Date(0);
        const dateB = b.release_date ? new Date(b.release_date) : new Date(0);
        return dateB - dateA;
      });
    case 'title_asc':
      return sorted.sort((a, b) => {
        const titleA = (a.title || a.name || '').toLowerCase();
        const titleB = (b.title || b.name || '').toLowerCase();
        return titleA.localeCompare(titleB, 'es', { sensitivity: 'base' });
      });
    case 'popular':
    default:
      return sorted.sort((a, b) => (b.popularity || 0) - (a.popularity || 0));
  }
}


const THEME_CLASSES = ['theme-cyberpunk', 'theme-redcarpet', 'theme-matrix'];

function applyTheme(theme) {
  document.body.classList.remove(...THEME_CLASSES);
  if (theme !== 'sepia') document.body.classList.add(`theme-${theme}`);
  themeOptions.forEach(o => o.classList.toggle('active', o.dataset.theme === theme));
}

let savedTheme = 'sepia';
try {
  savedTheme = localStorage.getItem('movieplanet_theme') || 'sepia';
} catch (e) { /* sin acceso a localStorage */ }
if (![...themeOptions].some(o => o.dataset.theme === savedTheme)) savedTheme = 'sepia';
applyTheme(savedTheme);

themeOptions.forEach(option => {
  option.addEventListener('click', () => {
    const theme = option.dataset.theme;
    applyTheme(theme);
    try { localStorage.setItem('movieplanet_theme', theme); } catch (e) { /* ignorar */ }
    showToast(`🎨 Tema cambiado a: <strong>${escapeHTML(option.textContent.trim())}</strong>`);
    if (themesDropdownContainer) themesDropdownContainer.classList.remove('open');
  });
});

if (themesDropdownBtn && themesDropdownContainer) {
  themesDropdownBtn.addEventListener('click', (e) => {
    e.stopPropagation();
    if (filmotecaDropdownContainer) filmotecaDropdownContainer.classList.remove('open');
    themesDropdownContainer.classList.toggle('open');
  });
}


function clearPersonalNav() {
  headerNavButtons.forEach(b => b.classList.remove('active'));
  if (filmotecaDropdownBtn) filmotecaDropdownBtn.classList.remove('active');
}

function setActiveCategoryCard(genreId) {
  categoryCards.forEach(c => c.classList.toggle('active', c.dataset.genre === String(genreId)));
}

function activateFilteredView(titleText, genreId = 'all') {
  if (bannerSection) bannerSection.classList.add('hidden');
  if (categoriesSection) categoriesSection.classList.add('hidden');
  if (!isPersonalViewActive) clearPersonalNav();

  if (backToHomeBtn) {
    backToHomeBtn.style.display = 'inline-flex';
    backToHomeBtn.innerHTML = '← Volver al inicio';
  }
  if (inlineGenreWrapper) inlineGenreWrapper.style.display = 'inline-flex';
  if (inlineGenreSelect) inlineGenreSelect.value = genreId;
  if (catalogTitle) catalogTitle.textContent = titleText;
}

function resetToHomeState() {
  if (movieModal && movieModal.open) closeMovieModal();

  if (bannerSection) bannerSection.classList.remove('hidden');
  if (categoriesSection) categoriesSection.classList.remove('hidden');

  if (backToHomeBtn) backToHomeBtn.style.display = 'none';
  if (inlineGenreWrapper) inlineGenreWrapper.style.display = 'none';
  if (inlineGenreSelect) inlineGenreSelect.value = 'all';
  if (searchInput) searchInput.value = '';

  currentPage = 1;
  currentGenre = 'all';
  currentSearchQuery = '';
  currentActorId = null;
  isPersonalViewActive = false;

  clearPersonalNav();
  setActiveCategoryCard('all');

  if (catalogTitle) catalogTitle.textContent = '🎬 Catálogo Completo';
  window.scrollTo({ top: 0, behavior: 'smooth' });
  getPopularMovies(1, false);
}

if (backToHomeBtn) {
  backToHomeBtn.addEventListener('click', resetToHomeState);
}

const logoLink = document.getElementById('logo-link');
if (logoLink) {
  logoLink.addEventListener('click', (e) => {
    e.preventDefault();
    resetToHomeState();
  });
}


class Media {
  constructor(data) {
    this.id = data.id;
    this.title = data.title || data.name || 'Sin título';
    this.posterPath = data.poster_path;
    this.rating = data.vote_average ? Number(data.vote_average).toFixed(1) : 'N/D';
    this.rawArrayData = data;
  }

  render() {
    throw new Error('El método render() debe ser implementado.');
  }
}

class Movie extends Media {
  constructor(data) {
    super(data);
    this.releaseYear = data.release_date ? data.release_date.split('-')[0] : 'N/D';
  }

  render() {
    const imagePath = this.posterPath
      ? `${TMDB_IMAGE_BASE}${this.posterPath}`
      : PLACEHOLDER_POSTER;
    const safeTitle = escapeHTML(this.title);

    const card = document.createElement('article');
    card.classList.add('movie-card');
    card.dataset.id = this.id;
    card.tabIndex = 0;
    card.setAttribute('role', 'button');
    card.setAttribute('aria-label', `Ver detalles de ${this.title}`);

    const isFav = isInList(LIST_KEYS.favorites, this.id);
    const isWatched = isInList(LIST_KEYS.watched, this.id);
    const isWatchlist = isInList(LIST_KEYS.watchlist, this.id);

    card.innerHTML = `
      <div class="card-actions-bar">
        <button type="button" class="card-action-btn ${isFav ? 'active' : ''}" data-type="fav" data-movie-id="${this.id}" aria-label="Favoritos">❤️</button>
        <button type="button" class="card-action-btn ${isWatched ? 'active' : ''}" data-type="watched" data-movie-id="${this.id}" aria-label="Marcar como vista">👁️</button>
        <button type="button" class="card-action-btn ${isWatchlist ? 'active' : ''}" data-type="watchlist" data-movie-id="${this.id}" aria-label="Añadir a Mi Lista">📌</button>
      </div>
      <img src="${imagePath}" alt="${safeTitle}" loading="lazy">
      <div class="movie-info">
        <h3>${safeTitle}</h3>
        <div class="movie-details">
          <span>${this.releaseYear}</span>
          <span class="rating">★ ${this.rating}</span>
        </div>
      </div>
    `;

    card.querySelectorAll('.card-action-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        const type = btn.dataset.type;
        if (type === 'fav') toggleMovieInList(LIST_KEYS.favorites, this.rawArrayData);
        if (type === 'watched') toggleMovieInList(LIST_KEYS.watched, this.rawArrayData);
        if (type === 'watchlist') toggleMovieInList(LIST_KEYS.watchlist, this.rawArrayData);

        refreshCurrentPersonalView();
      });
    });

    return card;
  }
}

class FeaturedMovie extends Movie {
  render() {
    const card = super.render();
    card.classList.add('featured-card');
    return card;
  }
}

function createMediaInstance(item) {
  if (item.vote_average && item.vote_average >= 8.0) {
    return new FeaturedMovie(item);
  }
  return new Movie(item);
}


async function initCentralFilmStrip() {
  const filmTrack = document.getElementById('central-film-track');
  if (!filmTrack) return;

  const data = await fetchTMDB('/movie/popular');
  if (!data || !data.results) return;

  const movies = data.results.slice(0, 20);
  const loopMovies = [...movies, ...movies];

  filmTrack.innerHTML = '';

  loopMovies.forEach((movie, index) => {
    if (!movie.poster_path) return;
    const frameNumber = String((index % movies.length) + 1).padStart(2, '0');
    const posterUrl = `${TMDB_IMAGE_BASE}${movie.poster_path}`;

    const frame = document.createElement('div');
    frame.classList.add('central-frame');
    frame.dataset.id = movie.id;

    frame.innerHTML = `
      <div class="frame-sprockets top-sprockets"></div>
      <div class="frame-body">
        <span class="frame-num">${frameNumber}</span>
        <img src="${posterUrl}" alt="${escapeHTML(movie.title)}" loading="lazy">
      </div>
      <div class="frame-sprockets bottom-sprockets"></div>
    `;

    filmTrack.appendChild(frame);
    const gap = document.createElement('div');
    gap.classList.add('central-frame-gap');
    filmTrack.appendChild(gap);
  });
}

async function loadFeaturedBanner() {
  if (!featuredBannerTrack) return;

  const data = await fetchTMDB('/movie/now_playing');
  if (!data || !Array.isArray(data.results)) return;

  const topMovies = data.results.slice(0, 6);
  featuredBannerTrack.innerHTML = '';

  topMovies.forEach(movie => {
    const bannerImg = movie.backdrop_path
      ? `${TMDB_BACKDROP_BASE}${movie.backdrop_path}`
      : movie.poster_path
        ? `${TMDB_IMAGE_BASE}${movie.poster_path}`
        : PLACEHOLDER_POSTER;

    const bannerCard = document.createElement('article');
    bannerCard.classList.add('banner-card');
    bannerCard.dataset.id = movie.id;
    bannerCard.tabIndex = 0;
    bannerCard.setAttribute('role', 'button');
    bannerCard.setAttribute('aria-label', `Ver detalles de ${movie.title}`);

    bannerCard.innerHTML = `
      <img src="${bannerImg}" alt="${escapeHTML(movie.title)}" loading="lazy">
      <div class="banner-overlay">
        <h3 class="banner-title">${escapeHTML(movie.title)}</h3>
        <p class="banner-desc">${escapeHTML(movie.overview || 'Sin descripción disponible.')}</p>
        <div class="banner-meta">
          <span>★ ${movie.vote_average ? Number(movie.vote_average).toFixed(1) : 'N/D'}</span>
          <span>📅 ${escapeHTML(movie.release_date || 'N/D')}</span>
        </div>
      </div>
    `;

    featuredBannerTrack.appendChild(bannerCard);
  });
}


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
    // TMDB puede repetir películas entre páginas: evitamos duplicados
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


function openGenreView(genreId, title) {
  currentPage = 1;
  currentGenre = genreId;
  currentSearchQuery = '';
  currentActorId = null;
  isPersonalViewActive = false;
  if (searchInput) searchInput.value = '';

  activateFilteredView(title, genreId);
  setActiveCategoryCard(genreId);
  loadGenreMovies(genreId, 1, false);
}

categoryCards.forEach(card => {
  card.tabIndex = 0;
  card.setAttribute('role', 'button');

  const activate = () => {
    const genreId = card.dataset.genre;
    const categoryName = card.querySelector('h3').textContent;

    if (genreId === 'all') {
      resetToHomeState();
    } else {
      openGenreView(genreId, `🎬 Género: ${categoryName}`);
    }
  };

  card.addEventListener('click', activate);
  card.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      activate();
    }
  });
});

if (inlineGenreSelect) {
  inlineGenreSelect.addEventListener('change', (e) => {
    const genreId = e.target.value;
    const selectedOptionText = inlineGenreSelect.options[inlineGenreSelect.selectedIndex].text;

    if (genreId === 'all') {
      resetToHomeState();
    } else {
      openGenreView(genreId, `🎬 ${selectedOptionText}`);
    }
  });
}

if (sortSelect) {
  sortSelect.addEventListener('change', (e) => {
    currentSort = e.target.value;
    displayMovies(currentLoadedMovies, false);
  });
}

const handleSearchInput = debounce(async (query) => {
  const trimmed = query.trim();

  if (!trimmed) {
    if (currentSearchQuery) resetToHomeState();
    return;
  }

  currentPage = 1;
  currentSearchQuery = trimmed;
  currentActorId = null;
  currentGenre = 'all';
  isPersonalViewActive = false;

  activateFilteredView(`🔍 Búsqueda: "${trimmed}"`, 'all');
  await searchMovies(trimmed, 1, false);
}, 350);

if (searchInput) {
  searchInput.addEventListener('input', (e) => handleSearchInput(e.target.value));
}

// Buscador desplegable en móvil (la clase .active la usa el CSS responsive)
const mobileQuery = window.matchMedia('(max-width: 768px)');
if (searchWrapper && searchInput) {
  searchWrapper.addEventListener('click', () => {
    if (mobileQuery.matches && !searchWrapper.classList.contains('active')) {
      searchWrapper.classList.add('active');
      searchInput.focus();
    }
  });

  searchInput.addEventListener('blur', () => {
    if (!searchInput.value.trim()) searchWrapper.classList.remove('active');
  });
}

if (loadMoreBtn) {
  loadMoreBtn.addEventListener('click', async () => {
    if (isPersonalViewActive) return;

    const nextPage = currentPage + 1;
    loadMoreBtn.disabled = true;
    loadMoreBtn.textContent = '⏳ Cargando fotogramas...';

    try {
      if (currentActorId) {
        await loadActorMovies(currentActorId, nextPage, true);
      } else if (currentSearchQuery) {
        await searchMovies(currentSearchQuery, nextPage, true);
      } else if (currentGenre === 'all') {
        await getPopularMovies(nextPage, true);
      } else {
        await loadGenreMovies(currentGenre, nextPage, true);
      }
    } catch (err) {
      console.error('Error al cargar más películas:', err);
    } finally {
      loadMoreBtn.disabled = false;
      loadMoreBtn.textContent = '🎞️ Cargar más fotogramas';
    }
  });
}


function resetCinemaMode() {
  if (movieModal) movieModal.classList.remove('cinema-mode-active');
  const cinemaBtn = document.getElementById('cinema-mode-toggle');
  if (cinemaBtn) cinemaBtn.remove();
}

function setupCinemaMode() {
  const trailerContainer = document.getElementById('modal-trailer-container');
  if (!trailerContainer || !trailerContainer.querySelector('iframe')) return;

  let btn = document.getElementById('cinema-mode-toggle');
  if (!btn) {
    btn = document.createElement('button');
    btn.type = 'button';
    btn.id = 'cinema-mode-toggle';
    btn.className = 'cinema-mode-btn';
    btn.innerHTML = '🍿 Activar Modo Cine';
    trailerContainer.parentNode.insertBefore(btn, trailerContainer);
  }

  btn.onclick = () => {
    const isCinema = movieModal.classList.toggle('cinema-mode-active');
    btn.innerHTML = isCinema ? '💡 Apagar Modo Cine' : '🍿 Activar Modo Cine';

    if (isCinema) {
      setTimeout(() => {
        trailerContainer.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }, 100);
    }
  };
}

function renderUserNotesSection(movieId, targetContainer) {
  if (!targetContainer) return;

  const existingNotes = targetContainer.querySelector('.user-notes-section');
  if (existingNotes) existingNotes.remove();

  const userData = getUserNotesData(movieId);
  const wrapper = document.createElement('div');
  wrapper.className = 'user-notes-section';

  wrapper.innerHTML = `
    <span class="user-notes-title">✍️ Tu valoración y nota privada</span>
    <div class="user-rating-stars" id="user-stars">
      ${[1, 2, 3, 4, 5].map(star => `
        <span class="star-opt ${star <= userData.rating ? 'active' : ''}" data-star="${star}">★</span>
      `).join('')}
    </div>
    <textarea id="user-note-input" class="user-note-textarea" placeholder="Escribe tu opinión o anotación personal...">${escapeHTML(userData.note)}</textarea>
  `;

  targetContainer.appendChild(wrapper);

  let currentRating = userData.rating;
  let lastSavedNote = userData.note;
  const stars = wrapper.querySelectorAll('.star-opt');
  const textarea = wrapper.querySelector('#user-note-input');

  const persist = () => {
    lastSavedNote = textarea.value;
    saveUserNotesData(movieId, currentRating, textarea.value);
  };

  stars.forEach(s => {
    s.addEventListener('click', () => {
      currentRating = Number(s.dataset.star);
      stars.forEach(st => st.classList.toggle('active', Number(st.dataset.star) <= currentRating));
      persist();
    });
  });

  textarea.addEventListener('blur', () => {
    if (textarea.value !== lastSavedNote) persist();
  });
}


let modalRequestId = 0;

async function openMovieModal(movieId) {
  if (!movieId || !movieModal) return;

  const requestId = ++modalRequestId;

  if (!movieModal.open) movieModal.showModal();
  movieModal.scrollTop = 0;
  resetCinemaMode();

  const titleEl = document.getElementById('modal-title');
  const overviewEl = document.getElementById('modal-overview');
  const genresContainer = document.getElementById('modal-genres');
  const creditsContainer = document.getElementById('modal-credits');
  const trailerContainer = document.getElementById('modal-trailer-container');
  const recommendationsContainer = document.getElementById('modal-recommendations');
  const modalInfo = document.querySelector('.modal-info');
  const ratingEl = document.getElementById('modal-rating');
  const dateEl = document.getElementById('modal-date');
  const runtimeEl = document.getElementById('modal-runtime');
  const posterEl = document.getElementById('modal-poster');

  if (titleEl) titleEl.textContent = 'Cargando...';
  if (overviewEl) overviewEl.textContent = 'Obteniendo detalles desde TMDB...';
  if (genresContainer) genresContainer.innerHTML = '';
  if (creditsContainer) creditsContainer.innerHTML = '';
  if (trailerContainer) trailerContainer.innerHTML = '';
  if (recommendationsContainer) recommendationsContainer.innerHTML = '';
  if (modalBgGlow) modalBgGlow.style.backgroundImage = 'none';
  if (ratingEl) ratingEl.textContent = '★ N/D';
  if (dateEl) dateEl.textContent = '📅 N/D';
  if (runtimeEl) runtimeEl.textContent = '⏱️ N/D';
  if (posterEl) posterEl.src = BLANK_IMG;
  const oldNotes = movieModal.querySelector('.user-notes-section');
  if (oldNotes) oldNotes.remove();

  const movie = await fetchTMDB(`/movie/${movieId}`, {
    append_to_response: 'videos,credits,recommendations',
    include_video_language: 'es,en,null'
  });


  if (requestId !== modalRequestId) return;

  if (!movie) {
    if (titleEl) titleEl.textContent = 'No se pudo cargar la película';
    if (overviewEl) overviewEl.textContent = 'Inténtalo de nuevo en unos segundos.';
    return;
  }

  const posterUrl = movie.poster_path
    ? `${TMDB_IMAGE_BASE}${movie.poster_path}`
    : PLACEHOLDER_POSTER;

  if (modalBgGlow) modalBgGlow.style.backgroundImage = `url('${posterUrl}')`;

  if (titleEl) titleEl.textContent = movie.title || movie.name;
  if (overviewEl) overviewEl.textContent = movie.overview || 'Sin sinopsis disponible.';

  if (ratingEl) ratingEl.textContent = `★ ${movie.vote_average ? Number(movie.vote_average).toFixed(1) : 'N/D'}`;
  if (dateEl) dateEl.textContent = `📅 ${movie.release_date ? movie.release_date.split('-')[0] : 'N/D'}`;
  if (runtimeEl) runtimeEl.textContent = `⏱️ ${movie.runtime ? `${movie.runtime} min` : 'N/D'}`;
  if (posterEl) {
    posterEl.src = posterUrl;
    posterEl.alt = `Póster de ${movie.title || movie.name}`;
  }


  if (genresContainer) {
    genresContainer.innerHTML = '';

    const actionsWrapper = document.createElement('div');
    actionsWrapper.className = 'modal-actions-wrapper';

    const isFav = isInList(LIST_KEYS.favorites, movie.id);
    const isWatched = isInList(LIST_KEYS.watched, movie.id);
    const isWatchlist = isInList(LIST_KEYS.watchlist, movie.id);

    actionsWrapper.innerHTML = `
      <button type="button" class="modal-action-btn ${isFav ? 'active' : ''}" data-type="fav" data-movie-id="${movie.id}">
        ${isFav ? '❤️ En Favoritos' : '🤍 Añadir Favoritos'}
      </button>
      <button type="button" class="modal-action-btn ${isWatched ? 'active' : ''}" data-type="watched" data-movie-id="${movie.id}">
        ${isWatched ? '👁️ Vista' : '👁️ Marcar Vista'}
      </button>
      <button type="button" class="modal-action-btn ${isWatchlist ? 'active' : ''}" data-type="watchlist" data-movie-id="${movie.id}">
        ${isWatchlist ? '📌 En Mi Lista' : '📌 Añadir a Mi Lista'}
      </button>
    `;

    actionsWrapper.querySelectorAll('.modal-action-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const type = btn.dataset.type;
        if (type === 'fav') toggleMovieInList(LIST_KEYS.favorites, movie);
        if (type === 'watched') toggleMovieInList(LIST_KEYS.watched, movie);
        if (type === 'watchlist') toggleMovieInList(LIST_KEYS.watchlist, movie);
        refreshCurrentPersonalView();
      });
    });

    genresContainer.appendChild(actionsWrapper);

    if (movie.genres && movie.genres.length > 0) {
      movie.genres.forEach(genre => {
        const badge = document.createElement('span');
        badge.classList.add('genre-badge');
        badge.textContent = genre.name;
        genresContainer.appendChild(badge);
      });
    }
  }

  if (modalInfo) {
    renderUserNotesSection(movie.id, modalInfo);
  }


  if (creditsContainer && movie.credits) {
    creditsContainer.innerHTML = '';
    const director = movie.credits.crew ? movie.credits.crew.find(person => person.job === 'Director') : null;
    const topCast = movie.credits.cast ? movie.credits.cast.slice(0, 5) : [];

    let creditsHTML = '';
    if (director) creditsHTML += `<p class="modal-director">🎬 <strong>Dirección:</strong> ${escapeHTML(director.name)}</p>`;

    if (topCast.length > 0) {
      creditsHTML += `
        <div class="cast-wrapper">
          <h4 class="modal-cast-heading">🎭 Reparto Principal (Haz clic para ver sus películas)</h4>
          <div class="cast-grid">
      `;

      topCast.forEach(actor => {
        const avatarUrl = actor.profile_path
          ? `${TMDB_IMAGE_BASE}${actor.profile_path}`
          : 'https://placehold.co/200x200/1e1e1e/888888?text=?';

        creditsHTML += `
          <div class="cast-card" data-actor-id="${actor.id}" data-actor-name="${escapeHTML(actor.name)}">
            <img src="${avatarUrl}" alt="${escapeHTML(actor.name)}" class="cast-avatar" loading="lazy">
            <span class="cast-name">${escapeHTML(actor.name)}</span>
            <span class="cast-character">${escapeHTML(actor.character || 'N/D')}</span>
          </div>
        `;
      });

      creditsHTML += `</div></div>`;
    }

    creditsContainer.innerHTML = creditsHTML;

    creditsContainer.querySelectorAll('.cast-card').forEach(card => {
      card.addEventListener('click', () => {
        const actorId = card.dataset.actorId;
        const actorName = card.dataset.actorName;

        closeMovieModal();

        currentPage = 1;
        currentActorId = actorId;
        currentGenre = 'all';
        currentSearchQuery = '';
        isPersonalViewActive = false;
        if (searchInput) searchInput.value = '';

        activateFilteredView(`🎭 Filmografía de: ${actorName}`, 'all');
        loadActorMovies(actorId, 1, false);
      });
    });
  }


  if (trailerContainer) {
    trailerContainer.innerHTML = '';
    const videos = (movie.videos && movie.videos.results) || [];
    const youtubeVideos = videos.filter(v => v.site === 'YouTube');
    const trailer = youtubeVideos.find(v => v.type === 'Trailer') || youtubeVideos[0];

    if (trailer) {
      trailerContainer.innerHTML = `<iframe src="https://www.youtube.com/embed/${encodeURIComponent(trailer.key)}" title="Tráiler" allow="encrypted-media; picture-in-picture" allowfullscreen></iframe>`;
      setupCinemaMode();
    }
  }


  if (recommendationsContainer && movie.recommendations && movie.recommendations.results.length > 0) {
    const topRecs = movie.recommendations.results.slice(0, 5);
    let recsHTML = `
      <h4 class="recommendations-heading">🍿 Si te gusta esta, te recomendamos:</h4>
      <div class="recommendations-grid">
    `;

    topRecs.forEach(rec => {
      const recPoster = rec.poster_path
        ? `${TMDB_IMAGE_BASE}${rec.poster_path}`
        : 'https://placehold.co/300x450/161616/f2f0e9?text=Sin+Imagen';

      const recRating = rec.vote_average ? Number(rec.vote_average).toFixed(1) : 'N/D';

      recsHTML += `
        <article class="recommendation-card" data-rec-id="${rec.id}">
          <img src="${recPoster}" alt="${escapeHTML(rec.title)}" class="recommendation-poster" loading="lazy">
          <div class="recommendation-info">
            <span class="recommendation-title">${escapeHTML(rec.title)}</span>
            <span class="recommendation-rating">★ ${recRating}</span>
          </div>
        </article>
      `;
    });

    recsHTML += `</div>`;
    recommendationsContainer.innerHTML = recsHTML;

    recommendationsContainer.querySelectorAll('.recommendation-card').forEach(card => {
      card.addEventListener('click', () => openMovieModal(card.dataset.recId));
    });
  }
}

function closeMovieModal() {
  if (movieModal && movieModal.open) movieModal.close();
}


if (movieModal) {
  movieModal.addEventListener('close', () => {
    modalRequestId++;
    resetCinemaMode();
    const trailerContainer = document.getElementById('modal-trailer-container');
    if (trailerContainer) trailerContainer.innerHTML = '';
  });

  
  let mouseDownOnBackdrop = false;
  movieModal.addEventListener('mousedown', (e) => {
    mouseDownOnBackdrop = e.target === movieModal;
  });
  movieModal.addEventListener('click', (e) => {
    if (mouseDownOnBackdrop && e.target === movieModal) closeMovieModal();
    mouseDownOnBackdrop = false;
  });
}

if (modalCloseBtn) modalCloseBtn.addEventListener('click', closeMovieModal);


if (quizBtn && quizModal) {
  quizBtn.addEventListener('click', () => {
    quizAnswers = { genre: '', era: '', rating: '' };
    showQuizStep(1);
    quizModal.showModal();
  });

  if (quizCloseBtn) quizCloseBtn.addEventListener('click', () => quizModal.close());
}

function showQuizStep(step) {
  if (!quizStepContainer) return;

  if (step === 1) {
    quizStepContainer.innerHTML = `
      <p style="text-align:center; font-size: 0.9rem;">1. ¿De qué humor estás hoy?</p>
      <div class="quiz-options-grid">
        <button class="quiz-option-btn" onclick="selectQuizAnswer('genre', '28', 2)">💥 Acción</button>
        <button class="quiz-option-btn" onclick="selectQuizAnswer('genre', '35', 2)">😂 Comedia</button>
        <button class="quiz-option-btn" onclick="selectQuizAnswer('genre', '27', 2)">😱 Terror</button>
        <button class="quiz-option-btn" onclick="selectQuizAnswer('genre', '878', 2)">🚀 CiFi</button>
      </div>
    `;
  } else if (step === 2) {
    quizStepContainer.innerHTML = `
      <p style="text-align:center; font-size: 0.9rem;">2. ¿Qué época prefieres?</p>
      <div class="quiz-options-grid">
        <button class="quiz-option-btn" onclick="selectQuizAnswer('era', 'classic', 3)">📜 Clásicos (&lt;1995)</button>
        <button class="quiz-option-btn" onclick="selectQuizAnswer('era', 'modern', 3)">📼 Éxitos (2000-2015)</button>
        <button class="quiz-option-btn" onclick="selectQuizAnswer('era', 'recent', 3)">🔥 Recientes (&gt;2020)</button>
        <button class="quiz-option-btn" onclick="selectQuizAnswer('era', 'any', 3)">🎲 Cualquier época</button>
      </div>
    `;
  } else if (step === 3) {
    quizStepContainer.innerHTML = `
      <p style="text-align:center; font-size: 0.9rem;">3. Exigencia de calidad:</p>
      <div class="quiz-options-grid">
        <button class="quiz-option-btn" onclick="selectQuizAnswer('rating', 'high', 4)">🏆 Obras Maestras (★ &gt; 7.5)</button>
        <button class="quiz-option-btn" onclick="selectQuizAnswer('rating', 'any', 4)">🍿 Entretenimiento puro</button>
      </div>
    `;
  } else if (step === 4) {
    fetchQuizRecommendation();
  }
}

window.selectQuizAnswer = function(key, val, nextStep) {
  quizAnswers[key] = val;
  showQuizStep(nextStep);
};

async function fetchQuizRecommendation() {
  quizStepContainer.innerHTML = '<p style="text-align:center; padding: 2rem;">🎲 Encontrando tu película ideal...</p>';

  const params = {
    with_genres: quizAnswers.genre,
    page: 1,
    sort_by: 'popularity.desc',
    'vote_count.gte': 100
  };

  if (quizAnswers.era === 'classic') params['primary_release_date.lte'] = '1995-12-31';
  if (quizAnswers.era === 'modern') {
    params['primary_release_date.gte'] = '2000-01-01';
    params['primary_release_date.lte'] = '2015-12-31';
  }
  if (quizAnswers.era === 'recent') params['primary_release_date.gte'] = '2020-01-01';
  if (quizAnswers.rating === 'high') params['vote_average.gte'] = 7.5;

  const data = await fetchTMDB('/discover/movie', params);

  if (data && data.results && data.results.length > 0) {
    const randomIdx = Math.floor(Math.random() * Math.min(data.results.length, 10));
    const movie = data.results[randomIdx];

    if (quizModal) quizModal.close();
    if (document.body.classList.contains('hero-mode')) enterApp();
    openMovieModal(movie.id);
    showToast('🎯 ¡Recomendación personalizada para ti!');
  } else {
    quizStepContainer.innerHTML = `
      <p style="text-align:center;">No encontramos películas con esos filtros tan específicos.</p>
      <button class="quiz-option-btn" style="margin: 1rem auto; grid-column: 1/-1;" onclick="showQuizStep(1)">Intentar de nuevo</button>
    `;
  }
}


if (filmotecaDropdownBtn && filmotecaDropdownContainer) {
  filmotecaDropdownBtn.addEventListener('click', (e) => {
    e.stopPropagation();
    if (themesDropdownContainer) themesDropdownContainer.classList.remove('open');
    filmotecaDropdownContainer.classList.toggle('open');
  });
}

const PERSONAL_VIEW_TITLES = {
  favorites: '❤️ Mis Favoritos',
  watched: '👁️ Películas Vistas',
  watchlist: '📌 Mi Lista'
};

headerNavButtons.forEach(btn => {
  btn.addEventListener('click', () => {
    const view = btn.dataset.view;
    if (!LIST_KEYS[view]) return;

    catalogRequestId++; // cancela cargas pendientes del catálogo
    headerNavButtons.forEach(b => b.classList.remove('active'));
    categoryCards.forEach(c => c.classList.remove('active'));
    btn.classList.add('active');
    if (filmotecaDropdownBtn) filmotecaDropdownBtn.classList.add('active');

    isPersonalViewActive = true;
    currentPage = 1;
    currentGenre = 'all';
    currentSearchQuery = '';
    currentActorId = null;
    if (searchInput) searchInput.value = '';

    activateFilteredView(PERSONAL_VIEW_TITLES[view], 'all');
    displayMovies(getList(LIST_KEYS[view]));

    if (filmotecaDropdownContainer) filmotecaDropdownContainer.classList.remove('open');
  });
});

document.addEventListener('click', (e) => {
  if (filmotecaDropdownContainer && !filmotecaDropdownContainer.contains(e.target)) {
    filmotecaDropdownContainer.classList.remove('open');
  }
  if (themesDropdownContainer && !themesDropdownContainer.contains(e.target)) {
    themesDropdownContainer.classList.remove('open');
  }

  const card = e.target.closest('.movie-card, .banner-card, .central-frame');
  if (card && card.dataset.id && !e.target.closest('.card-action-btn')) {
    if (card.classList.contains('central-frame')) enterApp();
    openMovieModal(card.dataset.id);
  }
});


document.addEventListener('keydown', (e) => {
  if (e.key !== 'Enter' && e.key !== ' ') return;
  const card = e.target.closest && e.target.closest('.banner-card');
  if (card && card.dataset.id) {
    e.preventDefault();
    openMovieModal(card.dataset.id);
  }
});

const randomMovieBtn = document.getElementById('random-movie-btn');

if (randomMovieBtn) {
  randomMovieBtn.addEventListener('click', async () => {
    const originalText = randomMovieBtn.innerHTML;
    randomMovieBtn.disabled = true;
    randomMovieBtn.innerHTML = '🎲 Buscando...';

    const randomPage = Math.floor(Math.random() * 20) + 1;
    const data = await fetchTMDB('/movie/popular', { page: randomPage });

    if (data && data.results && data.results.length > 0) {
      const randomIndex = Math.floor(Math.random() * data.results.length);
      const randomMovie = data.results[randomIndex];

      if (document.body.classList.contains('hero-mode')) enterApp();
      openMovieModal(randomMovie.id);
    }

    randomMovieBtn.disabled = false;
    randomMovieBtn.innerHTML = originalText;
  });
}


if (moviesGrid) {
  moviesGrid.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' || e.key === ' ') {
      const card = e.target.closest('.movie-card');
      if (card && card.dataset.id && !e.target.closest('.card-action-btn')) {
        e.preventDefault();
        openMovieModal(card.dataset.id);
      }
    }
  });
}

window.addEventListener('keydown', (e) => {
  if (e.key === 'Escape' && movieModal && movieModal.open) {
    closeMovieModal();
  }
});

function enterApp() {
  if (document.body.classList.contains('hero-mode')) {
    document.body.classList.remove('hero-mode');
    document.body.classList.add('app-active');
  }
}

window.addEventListener('wheel', (e) => {
  if (e.deltaY > 0) enterApp();
}, { passive: true });

window.addEventListener('scroll', () => {
  if (window.scrollY > 10) enterApp();
});

window.addEventListener('touchmove', enterApp, { passive: true });

window.addEventListener('keydown', (e) => {
  if (['ArrowDown', 'PageDown', 'Space'].includes(e.code)) {
    enterApp();
  }
});

initCentralFilmStrip();
loadFeaturedBanner();
getPopularMovies(1, false);