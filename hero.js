/* Decorative, deterministic data field. Draws only when scroll/size changes. */
(() => {
  const section = document.querySelector('.hero-scroll');
  const svg = document.getElementById('signal-svg');
  if (!section || !svg) return;
  const motion = window.matchMedia('(prefers-reduced-motion: reduce)');
  const compact = window.matchMedia('(max-width: 800px)');
  const hero = document.getElementById('hero');
  const group = document.getElementById('signal-points');
  const line = document.getElementById('signal-line');
  const stages = [...document.querySelectorAll('.signal-stages span')];
  const ns = 'http://www.w3.org/2000/svg';
  const points = [];
  const signalY = x => 260 - 64 * Math.sin((x - 40) / 84) - (x - 300) * .19;
  for (let row = 0; row < 17; row++) {
    for (let col = 0; col < 31; col++) {
      const x = 46 + col * 17;
      const y = 240 + (row - 8) * 16 + 44 * Math.sin(col * .19 + row * .12);
      const circle = document.createElementNS(ns, 'circle');
      circle.setAttribute('fill', row === 8 ? '#EDE6DA' : '#7A95B8');
      group.appendChild(circle);
      points.push({circle, x, y, row, col});
    }
  }
  const path = Array.from({length: 121}, (_, i) => {
    const x = 46 + i * 4.25;
    return `${i ? 'L' : 'M'}${x.toFixed(2)},${signalY(x).toFixed(2)}`;
  }).join(' ');
  line.setAttribute('d', path);
  let scheduled = false, lastProgress = -1;
  function render() {
    scheduled = false;
    const rect = section.getBoundingClientRect();
    const scrollDistance = Math.max(1, rect.height - hero.offsetHeight);
    // Smaller screens use ordinary document scroll so content stays easy to reach.
    const progress = motion.matches ? 1 : compact.matches
      ? Math.min(1, Math.max(0, -rect.top / Math.max(1, rect.height * .6)))
      : Math.min(1, Math.max(0, (16 - rect.top) / scrollDistance));
    if (progress === lastProgress) return;
    lastProgress = progress;
    const eased = progress * progress * (3 - 2 * progress);
    points.forEach(({circle, x, y, row, col}) => {
      const target = signalY(x) + (row - 8) * 3;
      circle.setAttribute('cx', (x + (1 - eased) * (row - 8) * 2.1).toFixed(2));
      circle.setAttribute('cy', (y + (target - y) * eased).toFixed(2));
      circle.setAttribute('r', row === 8 ? '2.4' : '1.5');
      const distance = Math.abs(row - 8) / 8;
      circle.setAttribute('opacity', ((.65 - distance * .35) * (1 - eased * distance * .75)).toFixed(2));
    });
    line.setAttribute('opacity', (.08 + eased * .85).toFixed(2));
    hero.style.setProperty('--progress', progress.toFixed(3));
    stages.forEach((stage, i) => stage.classList.toggle('is-active', i === Math.min(2, Math.floor(progress * 3))));
  }
  function schedule() {
    if (!scheduled) { scheduled = true; requestAnimationFrame(render); }
  }
  // Do not pin a hero taller than the available viewport (including zoomed layouts).
  function size() {
    section.classList.toggle('is-enhanced', !motion.matches && (compact.matches || hero.offsetHeight < innerHeight - 32));
    schedule();
  }
  window.addEventListener('scroll', schedule, {passive: true});
  window.addEventListener('resize', size, {passive: true});
  motion.addEventListener('change', size);
  compact.addEventListener('change', size);
  new ResizeObserver(size).observe(hero);
  size();
})();
