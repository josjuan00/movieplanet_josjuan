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
