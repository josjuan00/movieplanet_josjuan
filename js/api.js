const TMDB_BASE_URL = 'https://api.themoviedb.org/3';
const TMDB_IMAGE_BASE = 'https://image.tmdb.org/t/p/w500';
const TMDB_BACKDROP_BASE = 'https://image.tmdb.org/t/p/w780';

const getApiKey = () => (typeof API_KEY !== 'undefined' ? API_KEY : '');

const PLACEHOLDER_POSTER = 'https://placehold.co/500x750/161616/f2f0e9?text=Sin+Imagen';
const BLANK_IMG = 'data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7';


async function fetchTMDB(endpoint, params = {}) {
  const queryParams = new URLSearchParams({
    api_key: getApiKey(),
    language: 'es-ES',
    ...params
  });
  try {
    const response = await fetch(`${TMDB_BASE_URL}${endpoint}?${queryParams}`);
    if (!response.ok) throw new Error(`HTTP Error: ${response.status}`);
    return await response.json();
  } catch (error) {
    console.error(`Error en petición TMDB [${endpoint}]:`, error);
    return null;
  }
}
