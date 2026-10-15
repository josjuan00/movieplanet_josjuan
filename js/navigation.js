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
