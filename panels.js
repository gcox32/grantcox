(function () {

    // ── Spring physics ────────────────────────────────────────
    class Spring {
        constructor(stiffness, damping) {
            this.stiffness = stiffness;
            this.damping   = damping;
            this.value     = 1;
            this.velocity  = 0;
            this.target    = 1;
        }

        tick(dt) {
            const force    = -this.stiffness * (this.value - this.target)
                             - this.damping * this.velocity;
            this.velocity += force * dt;
            this.value    += this.velocity * dt;
        }

        get settled() {
            return Math.abs(this.value - this.target) < 0.002
                && Math.abs(this.velocity)             < 0.002;
        }
    }

    const EXPANDED  = 7;
    const COLLAPSED = 1;

    function lerp(a, b, t) { return a + (b - a) * t; }

    // ── Per-panel setup ───────────────────────────────────────
    document.querySelectorAll('.panel').forEach(panel => {
        const header = panel.querySelector('.panel__header');

        // Each panel gets its own slightly different spring character
        const spring = new Spring(
            220 + Math.random() * 100,   // stiffness  220–320
             14 + Math.random() * 10     // damping     14–24
        );

        let rafId    = null;
        let lastTime = null;

        function animateSpring(now) {
            if (lastTime === null) lastTime = now;
            const dt = Math.min((now - lastTime) / 1000, 0.05);
            lastTime = now;

            spring.tick(dt);
            panel.style.flexGrow = spring.value;

            if (spring.settled) {
                panel.style.flexGrow = spring.target;
                rafId = lastTime = null;
            } else {
                rafId = requestAnimationFrame(animateSpring);
            }
        }

        panel._spring    = spring;
        panel._openSpring = function (open) {
            spring.target = open ? EXPANDED : COLLAPSED;
            if (open) panel.classList.add('is-open');
            else      panel.classList.remove('is-open');
            if (rafId) cancelAnimationFrame(rafId);
            lastTime = null;
            rafId = requestAnimationFrame(animateSpring);
        };

        header.addEventListener('click', () => {
            const opening = !panel.classList.contains('is-open');
            // Collapse every other panel
            document.querySelectorAll('.panel').forEach(p => {
                if (p !== panel && p.classList.contains('is-open')) {
                    p._openSpring(false);
                }
            });
            panel._openSpring(opening);
        });

        // ── Specular glow tracking ────────────────────────────
        let targetX = 50, targetY = -20;
        let currentX = 50, currentY = -20;
        let glowRaf = null;

        function animateGlow() {
            currentX = lerp(currentX, targetX, 0.1);
            currentY = lerp(currentY, targetY, 0.1);
            panel.style.setProperty('--mx', `${currentX}%`);
            panel.style.setProperty('--my', `${currentY}%`);

            const settled = Math.abs(currentX - targetX) < 0.05
                         && Math.abs(currentY - targetY) < 0.05;
            glowRaf = settled ? null : requestAnimationFrame(animateGlow);
        }

        panel.addEventListener('mousemove', e => {
            const r = panel.getBoundingClientRect();
            targetX = ((e.clientX - r.left) / r.width)  * 100;
            targetY = ((e.clientY - r.top)  / r.height) * 100;
            if (!glowRaf) glowRaf = requestAnimationFrame(animateGlow);
        });

        panel.addEventListener('mouseleave', () => {
            targetX = 50;
            targetY = -20;
            if (!glowRaf) glowRaf = requestAnimationFrame(animateGlow);
        });
    });

})();
