const TMDB_BASE_URL = 'https://api.themoviedb.org/3';
const TMDB_IMAGE_BASE = 'https://image.tmdb.org/t500';


const moviesGrid = document.getElementById('movies-grid');
const searchInput = document.getElementById('search-input');
const header = document.getElementById('main-header');


window.addEventListener('scroll', () => {
  if (window.scrollY > 40) {
    header.classList.add('scrolled');
  } else {
    header.classList.remove('scrolled');
  }
});

async function getPopularMovies() {
  try {
    const response = await fetch(`${TMDB_BASE_URL}/movie/popular?api_key=${API_KEY}&language=es-ES`);
    const data = await response.json();
    displayMovies(data.results);
  } catch (error) {
    console.error('Error al cargar películas populares:', error);
  }
}

function displayMovies(movies) {
  moviesGrid.innerHTML = '';

  if (!movies || movies.length === 0) {
    moviesGrid.innerHTML = '<p style="color: var(--text-secondary); grid-column: 1/-1; text-align: center;">Eres tan alternativo que ni nosotros la conocemos.</p>';
    return;
  }

  movies.forEach(movie => {
    const posterPath = movie.poster_path 
      ? `${TMDB_IMAGE_BASE}${movie.poster_path}` 
      : 'https://via.placeholder.com/500x750/161616/f2f0e9?text=Sin+Imagen';

    const releaseYear = movie.release_date ? movie.release_date.split('-')[0] : 'N/D';
    const rating = movie.vote_average ? movie.vote_average.toFixed(1) : 'N/D';

    const movieCard = document.createElement('div');
    movieCard.classList.add('movie-card');

    movieCard.innerHTML = `
      <img src="${posterPath}" alt="${movie.title}">
      <div class="movie-info">
        <h3>${movie.title}</h3>
        <div class="movie-details">
          <span>${releaseYear}</span>
          <span class="rating">★ ${rating}</span>
        </div>
      </div>
    `;

    moviesGrid.appendChild(movieCard);
  });
}

async function searchMovies(query) {
  if (!query.trim()) {
    getPopularMovies();
    return;
  }

  try {
    const response = await fetch(`${TMDB_BASE_URL}/search/movie?api_key=${API_KEY}&query=${encodeURIComponent(query)}&language=es-ES`);
    const data = await response.json();
    displayMovies(data.results);
  } catch (error) {
    console.error('Eres tan indie que ni la tenemos en el catalogo:', error);
  }
}

searchInput.addEventListener('input', (e) => {
  searchMovies(e.target.value);
});

getPopularMovies();