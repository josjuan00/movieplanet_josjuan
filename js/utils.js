function escapeHTML(value) {
  return String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}


function debounce(func, delay = 350) {
  let timeout;
  return (...args) => {
    clearTimeout(timeout);
    timeout = setTimeout(() => func(...args), delay);
  };
}

function sortMovieList(movies, sortType) {
  if (!Array.isArray(movies) || movies.length === 0) return [];
  const sorted = [...movies];

  switch (sortType) {
    case 'rating_desc':
      return sorted.sort((a, b) => (b.vote_average || 0) - (a.vote_average || 0));
    case 'date_desc':
      return sorted.sort((a, b) => {
        const dateA = a.release_date ? new Date(a.release_date) : new Date(0);
        const dateB = b.release_date ? new Date(b.release_date) : new Date(0);
        return dateB - dateA;
      });
    case 'title_asc':
      return sorted.sort((a, b) => {
        const titleA = (a.title || a.name || '').toLowerCase();
        const titleB = (b.title || b.name || '').toLowerCase();
        return titleA.localeCompare(titleB, 'es', { sensitivity: 'base' });
      });
    case 'popular':
    default:
      return sorted.sort((a, b) => (b.popularity || 0) - (a.popularity || 0));
  }
}
