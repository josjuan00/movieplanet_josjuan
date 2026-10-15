const THEME_CLASSES = ['theme-cyberpunk', 'theme-redcarpet', 'theme-matrix'];

function applyTheme(theme) {
  document.body.classList.remove(...THEME_CLASSES);
  if (theme !== 'sepia') document.body.classList.add(`theme-${theme}`);
  themeOptions.forEach(o => o.classList.toggle('active', o.dataset.theme === theme));
}

let savedTheme = 'sepia';
try {
  savedTheme = localStorage.getItem('movieplanet_theme') || 'sepia';
} catch (e) { }
if (![...themeOptions].some(o => o.dataset.theme === savedTheme)) savedTheme = 'sepia';
applyTheme(savedTheme);

themeOptions.forEach(option => {
  option.addEventListener('click', () => {
    const theme = option.dataset.theme;
    applyTheme(theme);
    try { localStorage.setItem('movieplanet_theme', theme); } catch (e) { /* ignorar */ }
    showToast(`🎨 Tema cambiado a: <strong>${escapeHTML(option.textContent.trim())}</strong>`);
    if (themesDropdownContainer) themesDropdownContainer.classList.remove('open');
  });
});

if (themesDropdownBtn && themesDropdownContainer) {
  themesDropdownBtn.addEventListener('click', (e) => {
    e.stopPropagation();
    if (filmotecaDropdownContainer) filmotecaDropdownContainer.classList.remove('open');
    themesDropdownContainer.classList.toggle('open');
  });
}
