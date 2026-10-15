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
