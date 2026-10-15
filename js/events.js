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
