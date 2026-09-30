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

  function galaxy(seed, palette, shape = 'spiral') {
    const random = randomGenerator(seed);
    return texture(640, (ctx, size) => {
      ctx.translate(size / 2, size / 2);
      ctx.globalCompositeOperation = 'screen';

      function dust(x, y, color, alpha, radius = .7 + random() * 1.8) {
        ctx.fillStyle = 'rgba(' + color + ',' + alpha + ')';
        ctx.beginPath();
        ctx.arc(x, y, radius, 0, Math.PI * 2);
        ctx.fill();
      }

      function core(x, y, radius, color = '255,224,178') {
        glow(ctx, x, y, radius * 2.4, color, .45);
        glow(ctx, x, y, radius, '255,246,221', .9);
      }

      if (shape === 'elliptical') {
        ctx.scale(1, .72);
        glow(ctx, 0, 0, 245, palette[1], .28);
        glow(ctx, 0, 0, 140, palette[0], .5);
        for (let i = 0; i < 3200; i++) {
          const radius = Math.min(275, Math.sqrt(-2 * Math.log(Math.max(.0001, random()))) * 77);
          const angle = random() * Math.PI * 2;
          dust(Math.cos(angle) * radius, Math.sin(angle) * radius,
            palette[Math.floor(random() * palette.length)], (.18 + random() * .6) * (1 - radius / 300));
        }
        core(0, 0, 38);
        return;
      }

      if (shape === 'irregular') {
        const clusters = [
          [-95, -42, 55], [-27, 42, 74], [57, -28, 68],
          [121, 47, 43], [13, -106, 30], [-135, 64, 28],
        ];
        for (let i = 0; i < clusters.length; i++) {
          const [x, y, spread] = clusters[i];
          glow(ctx, x, y, spread * 2, palette[i % palette.length], .32);
          for (let j = 0; j < 340; j++) {
            const r = Math.pow(random(), .8) * spread;
            const angle = random() * Math.PI * 2;
            dust(x + Math.cos(angle) * r, y + Math.sin(angle) * r * .75,
              palette[(i + j) % palette.length], .2 + random() * .6);
          }
          // Scattered star-forming knots rather than a single central nucleus.
          core(x, y, 8 + random() * 8, palette[i % palette.length]);
        }
        return;
      }

      if (shape === 'edge-on') {
        ctx.save();
        ctx.scale(1, .17);
        glow(ctx, 0, 0, 260, palette[1], .5);
        for (let i = 0; i < 2200; i++) {
          const radius = Math.pow(random(), .65) * 250;
          const angle = random() * Math.PI * 2;
          dust(Math.cos(angle) * radius, Math.sin(angle) * radius,
            palette[i % palette.length], (.18 + random() * .6) * (1 - radius / 310));
        }
        ctx.restore();
        ctx.save();
        ctx.scale(1, .7);
        core(0, 0, 48);
        ctx.restore();
        // A dark dust lane gives this disk a distinct side-on silhouette.
        ctx.globalCompositeOperation = 'source-over';
        ctx.strokeStyle = 'rgba(28,10,47,.72)';
        ctx.lineWidth = 7;
        ctx.beginPath();
        ctx.moveTo(-230, 3);
        ctx.bezierCurveTo(-90, -6, 85, -6, 230, 3);
        ctx.stroke();
        return;
      }

      ctx.scale(1, shape === 'barred' ? .68 : .55);
      glow(ctx, 0, 0, 180, palette[0], .25);
      for (let i = 0; i < 2200; i++) {
        const radius = Math.pow(random(), .7) * 245;
        const arm = i % (shape === 'barred' ? 2 : 3);
        const angle = arm * Math.PI * 2 / (shape === 'barred' ? 2 : 3)
          + radius * .018 + (random() - .5) * .35;
        const barOffset = shape === 'barred' ? (arm === 0 ? 45 : -45) * Math.max(0, 1 - radius / 300) : 0;
        const x = Math.cos(angle) * radius + barOffset + (random() - .5) * 12;
        const y = Math.sin(angle) * radius + (random() - .5) * 12;
        const color = palette[Math.min(palette.length - 1, Math.floor(radius / 245 * palette.length))];
        dust(x, y, color, (.25 + random() * .6) * (1 - radius / 320));
      }
      if (shape === 'barred') {
        for (let i = 0; i < 700; i++) {
          dust((random() - .5) * 120, (random() - .5) * 20,
            '255,214,169', .25 + random() * .6);
        }
      }
      core(0, 0, 28);
    });
  }

  const galaxyCatalog = [
    galaxy(13, ['255,214,148', '241,103,212', '143,105,255', '85,226,255']),
    galaxy(41, ['255,225,171', '234,155,107', '215,126,166'], 'elliptical'),
    galaxy(29, ['122,248,240', '103,153,255', '244,127,209'], 'irregular'),
    galaxy(73, ['255,230,173', '177,164,255', '239,140,163'], 'edge-on'),
    galaxy(89, ['255,214,148', '232,120,238', '116,182,255'], 'barred'),
  ];

  const scenery = [
    { image: nebula(7, ['91,57,255', '223,40,181', '255,114,179']), x: -1.06, y: -.52, z: 1.5, size: 1.8, angle: -.65, spin: .006, alpha: .85 },
    { image: nebula(19, ['23,214,234', '42,107,255', '168,67,255']), x: 1.18, y: .65, z: 1.65, size: 1.8, angle: -.65, spin: -.008, alpha: .85 },
    { image: nebula(31, ['255,104,62', '246,66,162', '114,62,255']), x: -.95, y: .94, z: 2.3, size: 1.9, angle: .55, spin: .008, alpha: .6 },
    { image: galaxyCatalog[0], galaxyIndex: 0, x: -1.05, y: -.68, z: 1.55, size: .6, angle: -.4, spin: .022, alpha: .95 },
    { image: galaxyCatalog[2], galaxyIndex: 2, x: 1.2, y: .72, z: 1.8, size: .6, angle: .35, spin: -.012, alpha: .9 },
    { image: galaxyCatalog[1], galaxyIndex: 1, x: 1.12, y: -.95, z: 2.05, size: .57, angle: -.25, spin: .006, alpha: .95 },
    { image: galaxyCatalog[3], galaxyIndex: 3, x: -1.35, y: .03, z: 1.6, size: .45, angle: -.28, spin: .004, alpha: .9 },
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
      if (object.z < .65) {
        object.z = 2.8;
        if (object.galaxyIndex !== undefined) {
          object.galaxyIndex = (object.galaxyIndex + 1) % galaxyCatalog.length;
          object.image = galaxyCatalog[object.galaxyIndex];
        }
      }
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
