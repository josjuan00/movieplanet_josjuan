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

    catalogRequestId++;
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
