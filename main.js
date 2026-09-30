const year = document.querySelector('#year');
if (year) year.textContent = String(new Date().getFullYear());

const canvas = document.querySelector('#starfield');
const context = canvas?.getContext('2d');
const flightToggle = document.querySelector('#flight-toggle');

if (context) {
  const motionPreference = window.matchMedia('(prefers-reduced-motion: reduce)');
  const starColors = ['#e1eeff', '#9aedff', '#e7b0ff', '#ffaacb', '#baffec'];
  let width = 0;
  let height = 0;
  let horizon = 0;
  let stars = [];
  let frame = 0;
  let previousTime = 0;
  let elapsed = 0;
  let paused = false;
  let flightAmount = 1;
  let sceneryTime = 0;

  // Paint the detailed scenery once, then move these textures through space.
  function texture(size, paint) {
    const surface = document.createElement('canvas');
    surface.width = surface.height = size;
    paint(surface.getContext('2d'), size);
    return surface;
  }

  function glow(ctx, x, y, radius, color, alpha) {
    const gradient = ctx.createRadialGradient(x, y, 0, x, y, radius);
    gradient.addColorStop(0, 'rgba(' + color + ',' + alpha + ')');
    gradient.addColorStop(.35, 'rgba(' + color + ',' + alpha * .42 + ')');
    gradient.addColorStop(1, 'rgba(' + color + ',0)');
    ctx.fillStyle = gradient;
    ctx.fillRect(x - radius, y - radius, radius * 2, radius * 2);
  }

  // A stable seed makes the clouds and galaxies look consistent after resizing.
  function randomGenerator(seed) {
    return () => {
      seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0;
      return seed / 4294967296;
    };
  }

  function nebula(seed, palette) {
    const random = randomGenerator(seed);
    return texture(768, (ctx, size) => {
      ctx.globalCompositeOperation = 'screen';
      for (let i = 0; i < 72; i++) {
        const t = i / 71;
        const x = size * (.16 + t * .68);
        const y = size * (.5 + Math.sin(t * 7 + seed) * .16);
        const spread = 30 + Math.sin(t * Math.PI) * 70;
        glow(ctx, x + (random() - .5) * spread, y + (random() - .5) * spread,
          48 + random() * 92, palette[Math.floor(t * (palette.length - 1))], .14);
      }
      for (let i = 0; i < 600; i++) {
        const t = random();
        const x = size * (.16 + t * .68);
        const y = size * (.5 + Math.sin(t * 7 + seed) * .16) + (random() - .5) * 120;
        ctx.fillStyle = 'rgba(221,200,255,' + random() * .25 + ')';
        ctx.fillRect(x, y, .5 + random(), .5 + random());
      }
    });
  }

  function galaxy(seed, palette) {
    const random = randomGenerator(seed);
    return texture(640, (ctx, size) => {
      ctx.translate(size / 2, size / 2);
      ctx.scale(1, .55);
      ctx.globalCompositeOperation = 'screen';
      glow(ctx, 0, 0, 180, palette[0], .25);
      for (let i = 0; i < 2200; i++) {
        const radius = Math.pow(random(), .7) * 245;
        const arm = i % 3;
        const angle = arm * Math.PI * 2 / 3 + radius * .018 + (random() - .5) * .35;
        const x = Math.cos(angle) * radius + (random() - .5) * 12;
        const y = Math.sin(angle) * radius + (random() - .5) * 12;
        const color = palette[Math.min(palette.length - 1, Math.floor(radius / 245 * palette.length))];
        const alpha = (.25 + random() * .6) * (1 - radius / 320);
        ctx.fillStyle = 'rgba(' + color + ',' + alpha + ')';
        ctx.beginPath();
        ctx.arc(x, y, .7 + random() * 1.8, 0, Math.PI * 2);
        ctx.fill();
      }
      glow(ctx, 0, 0, 65, '255,212,168', .85);
      glow(ctx, 0, 0, 28, '255,245,218', .95);
    });
  }

  const scenery = [
    { image: nebula(7, ['91,57,255', '223,40,181', '255,114,179']), x: -1.06, y: -.52, z: 1.5, startZ: 1.5, size: 1.8, angle: -.65, spin: .006, alpha: .85 },
    { image: nebula(19, ['23,214,234', '42,107,255', '168,67,255']), x: 1.18, y: .65, z: 1.65, startZ: 1.65, size: 1.8, angle: -.65, spin: -.008, alpha: .85 },
    { image: nebula(31, ['255,104,62', '246,66,162', '114,62,255']), x: -.95, y: .94, z: 2.3, startZ: 2.3, size: 1.9, angle: .55, spin: .008, alpha: .6 },
    { image: galaxy(13, ['255,214,148', '241,103,212', '143,105,255', '85,226,255']), x: -1.05, y: -.68, z: 1.55, startZ: 1.55, size: .6, angle: -.4, spin: .022, alpha: .95 },
    { image: galaxy(29, ['255,212,149', '122,248,240', '103,153,255', '200,118,255']), x: 1.2, y: .72, z: 1.8, startZ: 1.8, size: .65, angle: .6, spin: -.018, alpha: .95 },
  ];

  function resetStar(star, initial = false) {
    star.z = initial ? .15 + Math.random() * 2 : 2;
    star.x = (Math.random() - .5) * width / horizon * star.z * 1.2;
    star.y = (Math.random() - .5) * height / horizon * star.z * 1.2;
    star.color = starColors[Math.floor(Math.random() * starColors.length)];
    star.brightness = .4 + Math.random() * .6;
    star.phase = Math.random() * Math.PI * 2;
  }

  function resize() {
    width = window.innerWidth;
    height = window.innerHeight;
    horizon = Math.max(width, height) * .52;
    const scale = Math.min(window.devicePixelRatio || 1, 1.5);
    canvas.width = Math.round(width * scale);
    canvas.height = Math.round(height * scale);
    context.setTransform(scale, 0, 0, scale, 0, 0);
    stars = Array.from({ length: Math.min(950, Math.max(300, Math.round(width * height / 1200))) }, () => {
      const star = {};
      resetStar(star, true);
      return star;
    });
    draw(0);
  }

  function draw(delta) {
    elapsed += delta;
    const targetFlight = paused || motionPreference.matches ? 0 : 1;
    flightAmount += (targetFlight - flightAmount) * (1 - Math.exp(-delta * 3.2));
    if (Math.abs(targetFlight - flightAmount) < .002) flightAmount = targetFlight;
    // Rest keeps a little life in the sky, without moving forward through it.
    sceneryTime += delta * (.16 + flightAmount * .84);
    context.clearRect(0, 0, width, height);
    const drift = .004 + flightAmount * .011;
    const centerX = width * .5 + Math.sin(elapsed * .18) * width * drift;
    const centerY = height * .46 + Math.cos(elapsed * .15) * height * drift;
    const speed = .46 * flightAmount;
    const still = motionPreference.matches;
    context.globalCompositeOperation = 'screen';

    for (const object of scenery) {
      object.z -= delta * .028 * flightAmount;
      if (object.z < .65) object.z = 2.8;
      const size = horizon * object.size / object.z;
      context.save();
      context.translate(centerX + object.x * width * .5 / object.z, centerY + object.y * height * .5 / object.z);
      context.rotate(object.angle + sceneryTime * object.spin);
      context.globalAlpha = object.alpha;
      context.drawImage(object.image, -size / 2, -size / 2, size, size);
      context.restore();
    }

    for (const star of stars) {
      star.z -= delta * speed;
      if (star.z < .08) resetStar(star);
      const x = centerX + star.x * horizon / star.z;
      const y = centerY + star.y * horizon / star.z;
      if (x < -140 || x > width + 140 || y < -140 || y > height + 140) {
        resetStar(star);
        continue;
      }
      const tailZ = star.z + (still ? 0 : speed * .085);
      let tailX = centerX + star.x * horizon / tailZ;
      let tailY = centerY + star.y * horizon / tailZ;
      const length = Math.hypot(x - tailX, y - tailY);
      if (length > 130) {
        tailX = x + (tailX - x) * 130 / length;
        tailY = y + (tailY - y) * 130 / length;
      }
      const twinkle = 1 - (1 - flightAmount) * (.12 - .12 * Math.sin(elapsed * .55 + star.phase));
      const brightness = Math.min(1, (.2 + .8 / star.z) * star.brightness) * twinkle;
      const radius = Math.min(2.1, .35 + .45 / star.z);
      context.globalAlpha = brightness;
      context.strokeStyle = star.color;
      context.lineWidth = Math.min(1.9, radius * .75);
      context.beginPath();
      context.moveTo(tailX, tailY);
      context.lineTo(x, y);
      context.stroke();
      context.fillStyle = star.color;
      context.beginPath();
      context.arc(x, y, radius * .6, 0, Math.PI * 2);
      context.fill();
    }
    context.globalAlpha = 1;
    context.globalCompositeOperation = 'source-over';
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
    document.body.dataset.flightPaused = String(paused || motionPreference.matches || document.hidden);
    if (flightToggle) {
      flightToggle.hidden = false;
      flightToggle.disabled = motionPreference.matches;
      flightToggle.textContent = motionPreference.matches ? 'Motion off' : paused ? 'Resume flight' : 'Pause flight';
      flightToggle.title = paused && !motionPreference.matches ? 'Rest in space with gentle ambient movement' : '';
      flightToggle.setAttribute('aria-pressed', String(paused || motionPreference.matches));
    }
    if (motionPreference.matches) {
      flightAmount = 0;
      draw(0);
    } else if (!document.hidden) frame = requestAnimationFrame(animate);
  }

  flightToggle?.addEventListener('click', () => {
    paused = !paused;
    updateMotion();
  });
  window.addEventListener('resize', resize, { passive: true });
  motionPreference.addEventListener('change', updateMotion);
  document.addEventListener('visibilitychange', updateMotion);
  resize();
  updateMotion();
}
