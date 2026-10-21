/* Shared navigation and restrained, progressively enhanced reveals. */
(() => {
  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
  const carousels = document.querySelectorAll('.carousel');
  const carouselControls = document.querySelector('.carousel-controls');
  const carouselToggle = document.querySelector('.carousel-toggle');
  if (carousels.length && carouselControls && carouselToggle) {
    let photosPaused = false;
    const updatePhotos = () => {
      carouselControls.hidden = reducedMotion.matches;
      carousels.forEach(carousel => {
        carousel.classList.toggle('is-animated', !reducedMotion.matches);
        carousel.classList.toggle('is-paused', photosPaused);
        carousel.querySelector('.carousel__wrapper').setAttribute('aria-label', reducedMotion.matches
          ? 'Event photos — scroll horizontally for more'
          : 'Automatically scrolling event photos — focus or hover to pause');
      });
      carouselToggle.setAttribute('aria-pressed', String(photosPaused));
      carouselToggle.textContent = photosPaused ? 'Resume photos' : 'Pause photos';
    };
    carouselToggle.addEventListener('click', () => { photosPaused = !photosPaused; updatePhotos(); });
    reducedMotion.addEventListener('change', updatePhotos);
    updatePhotos();
  }
  if ('IntersectionObserver' in window && !reducedMotion.matches) {
    const observer = new IntersectionObserver(entries => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.remove('is-pending');
          entry.target.classList.add('visible');
          observer.unobserve(entry.target);
        }
      });
    }, {threshold: .05});
    document.querySelectorAll('.fade-up').forEach(el => {
      // Keep initial content visible, even if observation is delayed.
      if (el.getBoundingClientRect().top > innerHeight) el.classList.add('is-pending');
      observer.observe(el);
    });
    reducedMotion.addEventListener('change', event => {
      if (event.matches) document.querySelectorAll('.is-pending').forEach(el => el.classList.remove('is-pending'));
    });
  }
  document.querySelectorAll('.nav-toggle').forEach(button => {
    const nav = button.closest('.nav-bar');
    nav.classList.add('is-enhanced');
    const links = nav.querySelector('.nav-links');
    const close = () => {
      nav.classList.remove('open');
      button.setAttribute('aria-expanded', 'false');
      button.setAttribute('aria-label', 'Open menu');
    };
    button.addEventListener('click', () => {
      const open = nav.classList.toggle('open');
      button.setAttribute('aria-expanded', String(open));
      button.setAttribute('aria-label', open ? 'Close menu' : 'Open menu');
    });
    links.addEventListener('click', e => { if (e.target.closest('a')) close(); });
    document.addEventListener('click', e => { if (!nav.contains(e.target)) close(); });
    document.addEventListener('keydown', e => {
      if (e.key === 'Escape' && nav.classList.contains('open')) { close(); button.focus(); }
    });
    nav.addEventListener('focusout', e => { if (!nav.contains(e.relatedTarget)) close(); });
    window.matchMedia('(min-width: 801px)').addEventListener('change', close);
  });
})();
