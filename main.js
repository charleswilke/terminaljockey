const year = document.querySelector('#year');
if (year) year.textContent = String(new Date().getFullYear());

const canvas = document.querySelector('#starfield');
const context = canvas?.getContext('2d');

if (context) {
  const motionPreference = window.matchMedia('(prefers-reduced-motion: reduce)');
  const colors = ['224, 220, 255', '154, 204, 255', '206, 169, 255'];
  let width = 0;
  let height = 0;
  let stars = [];
  let frame = 0;
  let previousTime = 0;
  let elapsed = 0;
  let shootingStar = null;
  let nextShootingStar = 8;

  function resize() {
    width = window.innerWidth;
    height = window.innerHeight;
    const scale = Math.min(window.devicePixelRatio || 1, 2);
    canvas.width = Math.round(width * scale);
    canvas.height = Math.round(height * scale);
    context.setTransform(scale, 0, 0, scale, 0, 0);
    stars = Array.from({ length: Math.min(650, Math.round(width * height / 1700)) }, () => ({
      x: Math.random() * width,
      y: Math.random() * height,
      depth: Math.random(),
      phase: Math.random() * Math.PI * 2,
      color: colors[Math.floor(Math.random() * colors.length)],
    }));
    draw(0);
  }

  function draw(delta) {
    elapsed += delta;
    context.clearRect(0, 0, width, height);
    for (const star of stars) {
      star.x -= delta * (1 + star.depth * 4);
      star.y += delta * (.25 + star.depth * .65);
      if (star.x < -4) star.x = width + 4;
      if (star.y > height + 4) star.y = -4;
      const shimmer = motionPreference.matches ? 1 : .83 + .17 * Math.sin(elapsed * .7 + star.phase);
      const opacity = (.22 + star.depth * .65) * shimmer;
      const radius = .35 + star.depth * .95;
      context.fillStyle = 'rgba(' + star.color + ', ' + opacity + ')';
      context.beginPath();
      context.arc(star.x, star.y, radius, 0, Math.PI * 2);
      context.fill();
      if (star.depth > .985) {
        context.strokeStyle = 'rgba(' + star.color + ', ' + opacity * .3 + ')';
        context.lineWidth = .6;
        context.beginPath();
        context.moveTo(star.x - 4, star.y);
        context.lineTo(star.x + 4, star.y);
        context.moveTo(star.x, star.y - 4);
        context.lineTo(star.x, star.y + 4);
        context.stroke();
      }
    }

    if (!motionPreference.matches && elapsed > nextShootingStar && !shootingStar) {
      shootingStar = { x: width * (.4 + Math.random() * .5), y: height * Math.random() * .25, age: 0 };
      nextShootingStar = elapsed + 10 + Math.random() * 8;
    }
    if (shootingStar) {
      shootingStar.age += delta;
      const x = shootingStar.x - shootingStar.age * 320;
      const y = shootingStar.y + shootingStar.age * 130;
      const alpha = Math.sin(Math.min(shootingStar.age / 1.2, 1) * Math.PI) * .5;
      const tail = context.createLinearGradient(x, y, x + 110, y - 45);
      tail.addColorStop(0, 'rgba(214, 234, 255, ' + alpha + ')');
      tail.addColorStop(1, 'rgba(214, 234, 255, 0)');
      context.strokeStyle = tail;
      context.lineWidth = 1;
      context.beginPath();
      context.moveTo(x, y);
      context.lineTo(x + 110, y - 45);
      context.stroke();
      if (shootingStar.age > 1.2) shootingStar = null;
    }
  }

  function animate(time) {
    const delta = previousTime ? Math.min((time - previousTime) / 1000, .05) : 0;
    previousTime = time;
    draw(delta);
    frame = requestAnimationFrame(animate);
  }

  function updateMotion() {
    cancelAnimationFrame(frame);
    previousTime = 0;
    shootingStar = null;
    if (motionPreference.matches || document.hidden) draw(0);
    else frame = requestAnimationFrame(animate);
  }

  window.addEventListener('resize', resize, { passive: true });
  motionPreference.addEventListener('change', updateMotion);
  document.addEventListener('visibilitychange', updateMotion);
  resize();
  updateMotion();
}
