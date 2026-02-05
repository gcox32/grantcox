(function () {
    const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)').matches;

    // ── Time-aware color temperature ──────────────────────────────
    function initTimeAwareColors() {
        const periods = {
            dawn:      { deep: [28, 30, 16], mid: [20, 25, 25], foam: [15, 20, 37] },
            morning:   { deep: [210, 30, 15], mid: [205, 25, 23], foam: [200, 18, 35] },
            afternoon: { deep: [210, 30, 15], mid: [205, 25, 23], foam: [200, 18, 35] },
            dusk:      { deep: [25, 28, 16], mid: [22, 22, 25], foam: [18, 18, 37] },
            night:     { deep: [215, 35, 14], mid: [210, 28, 22], foam: [205, 22, 33] }
        };

        function getPeriod(hour) {
            if (hour >= 5 && hour < 8) return 'dawn';
            if (hour >= 8 && hour < 12) return 'morning';
            if (hour >= 12 && hour < 17) return 'afternoon';
            if (hour >= 17 && hour < 20) return 'dusk';
            return 'night';
        }

        function apply() {
            const period = getPeriod(new Date().getHours());
            const colors = periods[period];
            const root = document.documentElement;
            root.style.setProperty('--sea-deep', `hsl(${colors.deep[0]} ${colors.deep[1]}% ${colors.deep[2]}%)`);
            root.style.setProperty('--sea-mid', `hsl(${colors.mid[0]} ${colors.mid[1]}% ${colors.mid[2]}%)`);
            root.style.setProperty('--sea-foam', `hsl(${colors.foam[0]} ${colors.foam[1]}% ${colors.foam[2]}%)`);
        }

        apply();
        setInterval(apply, 60000);
    }

    // ── Parallax drift ────────────────────────────────────────────
    function initParallax() {
        if (reducedMotion) return;

        let targetX = 0, targetY = 0;
        let currentX = 0, currentY = 0;

        function onMove(x, y) {
            targetX = (x / window.innerWidth) * 2 - 1;
            targetY = (y / window.innerHeight) * 2 - 1;
        }

        document.addEventListener('mousemove', (e) => onMove(e.clientX, e.clientY));
        document.addEventListener('touchmove', (e) => {
            const t = e.touches[0];
            onMove(t.clientX, t.clientY);
        }, { passive: true });

        function tick() {
            currentX += (targetX - currentX) * 0.05;
            currentY += (targetY - currentY) * 0.05;
            document.body.style.setProperty('--mouse-x', currentX.toFixed(4));
            document.body.style.setProperty('--mouse-y', currentY.toFixed(4));
            requestAnimationFrame(tick);
        }

        requestAnimationFrame(tick);
    }

    // ── Canvas particles ──────────────────────────────────────────
    function initParticles() {
        const canvas = document.getElementById('particles');
        if (!canvas) return;
        const ctx = canvas.getContext('2d');

        let width, height;
        const mouse = { x: -1000, y: -1000 };
        const PARTICLE_COUNT = 35;
        const REPEL_RADIUS = 100;
        const particles = [];

        function resize() {
            width = canvas.width = window.innerWidth;
            height = canvas.height = window.innerHeight;
        }

        function createParticle() {
            return {
                x: Math.random() * width,
                y: Math.random() * height,
                baseVx: 0.15 + Math.random() * 0.25,
                baseVy: 0.05 + Math.random() * 0.15,
                vx: 0,
                vy: 0,
                size: 1 + Math.random() * 2,
                opacity: 0.15 + Math.random() * 0.25,
                hue: 200 + Math.random() * 15
            };
        }

        function init() {
            resize();
            particles.length = 0;
            for (let i = 0; i < PARTICLE_COUNT; i++) {
                particles.push(createParticle());
            }
        }

        function draw() {
            ctx.clearRect(0, 0, width, height);

            for (const p of particles) {
                if (!reducedMotion) {
                    // Drift
                    p.x += p.baseVx + p.vx;
                    p.y += p.baseVy + p.vy;

                    // Cursor repulsion
                    const dx = p.x - mouse.x;
                    const dy = p.y - mouse.y;
                    const dist = Math.sqrt(dx * dx + dy * dy);
                    if (dist < REPEL_RADIUS && dist > 0) {
                        const force = (1 - dist / REPEL_RADIUS) * 1.5;
                        p.vx += (dx / dist) * force;
                        p.vy += (dy / dist) * force;
                    }

                    // Dampen velocity
                    p.vx *= 0.95;
                    p.vy *= 0.95;
                }

                // Wrap around
                if (p.x > width + 10) p.x = -10;
                if (p.x < -10) p.x = width + 10;
                if (p.y > height + 10) p.y = -10;
                if (p.y < -10) p.y = height + 10;

                ctx.beginPath();
                ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
                ctx.fillStyle = `hsla(${p.hue}, 20%, 45%, ${p.opacity})`;
                ctx.fill();
            }

            requestAnimationFrame(draw);
        }

        document.addEventListener('mousemove', (e) => {
            mouse.x = e.clientX;
            mouse.y = e.clientY;
        });

        document.addEventListener('touchmove', (e) => {
            const t = e.touches[0];
            mouse.x = t.clientX;
            mouse.y = t.clientY;
        }, { passive: true });

        document.addEventListener('mouseleave', () => {
            mouse.x = -1000;
            mouse.y = -1000;
        });

        window.addEventListener('resize', resize);
        init();
        requestAnimationFrame(draw);
    }

    // ── Typed tagline ─────────────────────────────────────────────
    function initTypedTagline() {
        const el = document.querySelector('.tagline');
        if (!el) return;

        const final = 'Web developer';

        if (reducedMotion) {
            el.textContent = final;
            return;
        }

        const steps = [];
        const typoAt = 7;  // after "Web dev", hit "l" instead of "e"

        const typeDelay = 100 + Math.random() * 40;
        function type(text, delay = typeDelay) { steps.push({ text, delay: delay }); }
        function del(text)  { steps.push({ text, delay: typeDelay }); }
        function pause(ms)  { steps.push({ text: steps[steps.length - 1].text, delay: ms }); }

        // Type correctly: "W" → "Web dev"
        for (let i = 1; i <= typoAt; i++) type(final.substring(0, i));

        const immediate = 100;
        const shortPause = 250;
        const longPause = 1200;

        // First mistake
        type('Web devl');
        type('Web devlo');
        pause(immediate);
        del('Web devl');
        del('Web dev');
        pause(shortPause);

        // Second mistake
        type('Web devl');
        type('Web deveo', 140 + Math.random() * 40);
        pause(immediate);
        del('Web devl');
        del('Web dev');
        pause(shortPause);

        // Third mistake — longer pause after this one
        type('Web devl');
        type('Web devlo');
        pause(longPause);
        del('Web devl');
        del('Web dev');
        pause(longPause);

        // Get it right this time
        for (let i = typoAt; i < final.length; i++) type(final.substring(0, i + 1));

        let i = 0;
        el.textContent = '';

        function tick() {
            if (i >= steps.length) return;
            el.textContent = steps[i].text;
            const delay = steps[i].delay;
            i++;
            setTimeout(tick, delay);
        }

        setTimeout(tick, 600);
    }

    // ── Init ──────────────────────────────────────────────────────
    initTimeAwareColors();
    initParallax();
    initParticles();
    initTypedTagline();
})();
