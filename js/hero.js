function enterApp() {
  if (document.body.classList.contains('hero-mode')) {
    document.body.classList.remove('hero-mode');
    document.body.classList.add('app-active');
  }
}

window.addEventListener('wheel', (e) => {
  if (e.deltaY > 0) enterApp();
}, { passive: true });

window.addEventListener('scroll', () => {
  if (window.scrollY > 10) enterApp();
});

window.addEventListener('touchmove', enterApp, { passive: true });

window.addEventListener('keydown', (e) => {
  if (['ArrowDown', 'PageDown', 'Space'].includes(e.code)) {
    enterApp();
  }
});
