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
