// Scroll-triggered fade-up — disabled on mobile to prevent scroll interference
const isMobile = window.matchMedia('(max-width: 768px)').matches;

if (isMobile) {
  document.querySelectorAll('.fade-up').forEach(el => el.classList.add('visible'));
} else {
  const fadeObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('visible');
      }
    });
  }, { threshold: 0.08, rootMargin: '-30px' });

  document.querySelectorAll('.fade-up').forEach(el => fadeObserver.observe(el));
}

// Nav shadow on scroll
window.addEventListener('scroll', () => {
  const nav = document.querySelector('.nav-bar');
  if (nav) nav.classList.toggle('scrolled', window.scrollY > 20);
}, { passive: true });

// 3D tilt on hover — skip on mobile
if (!isMobile) {
  const TILT_SELECTORS = [
    '.bento-card',
    '.exec-card',
    '.event-preview-card',
    '.trek-card',
    '.event-highlight-card',
    '.pillar-card',
    '.join-section',
  ].join(', ');

  document.querySelectorAll(TILT_SELECTORS).forEach(el => {
    el.addEventListener('mousemove', e => {
      const r = el.getBoundingClientRect();
      const x = (e.clientX - r.left) / r.width  - 0.5;
      const y = (e.clientY - r.top)  / r.height - 0.5;
      el.style.transition = 'transform 0.08s ease, box-shadow 0.08s ease';
      el.style.transform = `perspective(700px) rotateX(${-y * 7}deg) rotateY(${x * 7}deg) translateY(-5px)`;
    });

    el.addEventListener('mouseleave', () => {
      el.style.transition = 'transform 0.45s ease, box-shadow 0.45s ease, background 0.25s ease, border-color 0.25s ease';
      el.style.transform = '';
      setTimeout(() => { el.style.transition = ''; }, 460);
    });
  });
}
