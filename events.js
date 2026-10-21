/* Event photos: keyboard-accessible gallery and user-controlled trek slider. */
(() => {
  const slider = document.getElementById('chicago-slider');
  if (slider) {
    const track = slider.querySelector('.trek-slider__track');
    const dots = [...slider.querySelectorAll('.trek-dot')];
    let current = 0;
    const goTo = index => {
      current = (index + dots.length) % dots.length;
      track.style.transform = `translateX(-${current * 100}%)`;
      dots.forEach((dot, i) => {
        dot.classList.toggle('active', i === current);
        dot.setAttribute('aria-label', `Show Chicago photo ${i + 1}`);
        dot.setAttribute('aria-pressed', String(i === current));
      });
    };
    slider.querySelector('.trek-slider__prev').addEventListener('click', () => goTo(current - 1));
    slider.querySelector('.trek-slider__next').addEventListener('click', () => goTo(current + 1));
    dots.forEach((dot, i) => dot.addEventListener('click', () => goTo(i)));
    goTo(0);
  }
  const galleries = {};
  const triggers = [...document.querySelectorAll('[data-gallery][data-index]')];
  triggers.forEach(el => {
    const image = el.querySelector('img');
    (galleries[el.dataset.gallery] ||= [])[Number(el.dataset.index)] = {src: image.src, alt: image.alt || el.getAttribute('aria-label').replace('Open ', '')};
  });
  const dialog = document.getElementById('lightbox');
  if (!dialog) return;
  const image = document.getElementById('lightbox-img');
  const counter = document.getElementById('lightbox-counter');
  const closeButton = document.getElementById('lightbox-close');
  const controls = [...dialog.querySelectorAll('button')];
  let gallery = [], index = 0, opener = null, previousOverflow = '';
  function show() {
    image.src = gallery[index].src;
    image.alt = gallery[index].alt;
    counter.textContent = `${index + 1} / ${gallery.length}`;
    document.getElementById('lightbox-prev').disabled = gallery.length < 2;
    document.getElementById('lightbox-next').disabled = gallery.length < 2;
  }
  function open(el) {
    opener = el;
    gallery = galleries[el.dataset.gallery];
    index = Number(el.dataset.index);
    show();
    dialog.classList.add('active');
    dialog.setAttribute('aria-hidden', 'false');
    document.querySelector('main').inert = true;
    document.querySelector('.site-header').inert = true;
    document.querySelector('footer').inert = true;
    previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    closeButton.focus();
  }
  function close() {
    dialog.classList.remove('active');
    dialog.setAttribute('aria-hidden', 'true');
    document.querySelector('main').inert = false;
    document.querySelector('.site-header').inert = false;
    document.querySelector('footer').inert = false;
    document.body.style.overflow = previousOverflow;
    opener?.focus();
  }
  function step(direction) { index = (index + direction + gallery.length) % gallery.length; show(); }
  triggers.forEach(el => {
    el.addEventListener('click', () => open(el));
    el.addEventListener('keydown', event => {
      if (event.key === 'Enter' || event.key === ' ') { event.preventDefault(); open(el); }
    });
  });
  closeButton.addEventListener('click', close);
  document.getElementById('lightbox-prev').addEventListener('click', () => step(-1));
  document.getElementById('lightbox-next').addEventListener('click', () => step(1));
  dialog.addEventListener('click', e => { if (e.target === dialog) close(); });
  document.addEventListener('keydown', e => {
    if (!dialog.classList.contains('active')) return;
    if (e.key === 'Escape') close();
    if (e.key === 'ArrowLeft') step(-1);
    if (e.key === 'ArrowRight') step(1);
    if (e.key === 'Tab') {
      const enabled = controls.filter(control => !control.disabled);
      if (e.shiftKey && document.activeElement === enabled[0]) { e.preventDefault(); enabled.at(-1).focus(); }
      else if (!e.shiftKey && document.activeElement === enabled.at(-1)) { e.preventDefault(); enabled[0].focus(); }
    }
  });
})();
