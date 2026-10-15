function showToast(message) {
  const host = document.querySelector('dialog[open]') || document.body;
  let container = host.querySelector(':scope > .toast-container');
  if (!container) {
    container = document.createElement('div');
    container.className = 'toast-container';
    host.appendChild(container);
  }

  const toast = document.createElement('div');
  toast.className = 'toast';
  toast.setAttribute('role', 'status');
  toast.setAttribute('aria-live', 'polite');
  toast.innerHTML = message;

  container.appendChild(toast);

  requestAnimationFrame(() => toast.classList.add('show'));

  setTimeout(() => {
    toast.classList.remove('show');
    setTimeout(() => {
      toast.remove();
      if (container.children.length === 0) container.remove();
    }, 350);
  }, 3000);
}

function renderSkeletons(count = 10) {
  if (!moviesGrid) return;
  moviesGrid.innerHTML = '';
  for (let i = 0; i < count; i++) {
    const skeleton = document.createElement('div');
    skeleton.className = 'skeleton-card';
    moviesGrid.appendChild(skeleton);
  }
}
