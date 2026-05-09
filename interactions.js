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
