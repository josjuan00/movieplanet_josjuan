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
