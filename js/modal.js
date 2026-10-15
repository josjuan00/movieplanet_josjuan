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
