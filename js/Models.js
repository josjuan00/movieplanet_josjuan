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
