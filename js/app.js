const TMDB_BASE_URL = 'https://api.themoviedb.org/3';
const TMDB_IMAGE_BASE = 'https://image.tmdb.org/t500';

const moviesGrid = document.getElementById('movies-grid');
const searchInput = document.getElementById('search-input');
const categoryButtons = document.querySelectorAll('.category-tag');

let hasScrolled = false;

window.addEventListener('scroll', () => {
  if (window.scrollY > 30) {
    if (!hasScrolled) {
      document.body.classList.remove('hero-mode');
      document.body.classList.add('app-active');
      hasScrolled = true;
    }
  } else if (window.scrollY === 0) {
    document.body.classList.remove('app-active');
    document.body.classList.add('hero-mode');
    hasScrolled = false;
  }
});

class Media {
  constructor(data) {
    this.id = data.id;
    this.title = data.title || data.name || 'Sin título';
    this.posterPath = data.poster_path;
    this.rating = data.vote_average ? data.vote_average.toFixed(1) : 'N/D';
  }

  render() {
    throw new Error("El método render() debe ser implementado por la subclase.");
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
      : 'https://placehold.co/500x750/161616/f2f0e9?text=Sin+Imagen';

    const card = document.createElement('article');
    card.classList.add('movie-card');

    card.innerHTML = `
      <img src="${imagePath}" alt="${this.title}" loading="lazy">
      <div class="movie-info">
        <h3>${this.title}</h3>
        <div class="movie-details">
          <span>${this.releaseYear}</span>
          <span class="rating">★ ${this.rating}</span>
        </div>
      </div>
    `;

    return card;
  }
}

class FeaturedMovie extends Movie {
  render() {
    const card = super.render();
    card.classList.add('featured-card');

    const badge = document.createElement('span');
    badge.classList.add('featured-badge');
    badge.textContent = '★ TOP';

    card.appendChild(badge);
    return card;
  }
}

function createMediaInstance(item) {
  if (item.vote_average && item.vote_average >= 8.0) {
    return new FeaturedMovie(item);
  }
  return new Movie(item);
}

async function initCentralFilmStrip() {
  const filmTrack = document.getElementById('central-film-track');
  if (!filmTrack) return;

  try {
    const response = await fetch(`${TMDB_BASE_URL}/movie/popular?api_key=${API_KEY}&language=es-ES`);
    const data = await response.json();
    const movies = data.results.slice(0, 10);
    const loopMovies = [...movies, ...movies]; // Duplicamos para bucle continuo

    filmTrack.innerHTML = '';

    loopMovies.forEach((movie, index) => {
      if (!movie.poster_path) return;

      const frameNumber = String((index % 10) + 1).padStart(2, '0');
      const posterUrl = `${TMDB_IMAGE_BASE}${movie.poster_path}`;

      const frame = document.createElement('div');
      frame.classList.add('central-frame');

      frame.innerHTML = `
        <div class="frame-sprockets top-sprockets"></div>
        <div class="frame-body">
          <span class="frame-num">${frameNumber}</span>
          <img 
            src="${posterUrl}" 
            alt="${movie.title}" 
            loading="lazy"
            onerror="this.src='https://placehold.co/500x750/161616/f2f0e9?text=${encodeURIComponent(movie.title)}'"
          >
        </div>
        <div class="frame-sprockets bottom-sprockets"></div>
      `;

      filmTrack.appendChild(frame);

      const gap = document.createElement('div');
      gap.classList.add('central-frame-gap');
      filmTrack.appendChild(gap);
    });
  } catch (error) {
    console.error('Error al cargar la tira de celuloide central:', error);
  }
}

async function getPopularMovies() {
  try {
    const response = await fetch(`${TMDB_BASE_URL}/movie/popular?api_key=${API_KEY}&language=es-ES`);
    const data = await response.json();
    displayMovies(data.results);
  } catch (error) {
    console.error('Error al cargar películas:', error);
  }
}

function displayMovies(movies) {
  moviesGrid.innerHTML = '';

  if (!movies || movies.length === 0) {
    moviesGrid.innerHTML = '<p style="color: var(--text-secondary); grid-column: 1/-1; text-align: center;">No se encontraron películas.</p>';
    return;
  }

  movies.forEach(movieData => {
    const mediaObj = createMediaInstance(movieData);
    moviesGrid.appendChild(mediaObj.render());
  });
}

categoryButtons.forEach(button => {
  button.addEventListener('click', async () => {
    categoryButtons.forEach(btn => btn.classList.remove('active'));
    button.classList.add('active');

    const genreId = button.dataset.genre;

    if (genreId === 'all') {
      getPopularMovies();
    } else {
      try {
        const response = await fetch(`${TMDB_BASE_URL}/discover/movie?api_key=${API_KEY}&with_genres=${genreId}&language=es-ES`);
        const data = await response.json();
        displayMovies(data.results);
      } catch (error) {
        console.error('Error al filtrar por género:', error);
      }
    }
  });
});

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
    console.error('Error en la búsqueda:', error);
  }
}

searchInput.addEventListener('input', (e) => {
  searchMovies(e.target.value);
});

initCentralFilmStrip();
getPopularMovies();