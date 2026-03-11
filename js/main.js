(function() {
    'use strict';

    /* ─── MATRIX RAIN (avec devicePixelRatio & anti-reset) ─── */
    var matrixCanvas = document.getElementById('matrix-canvas');
    if (matrixCanvas) {
        var mCtx = matrixCanvas.getContext('2d');
        var matrixCols, drops;
        var matrixChars = 'アイウエオカキクケコサシスセソタチツテトナニヌネノハヒフヘホマミムメモヤユヨラリルレロワヲン0123456789ABCDEF<>{}[];:./\\|=+-*&^%$#@!';
        var fontSize = 14;

        var lastW = 0, lastH = 0;

        function initMatrix() {
            var dpr = window.devicePixelRatio || 1;
            var cssWidth = window.innerWidth;
            var cssHeight = window.innerHeight;

            matrixCanvas.style.width = cssWidth + 'px';
            matrixCanvas.style.height = cssHeight + 'px';

            matrixCanvas.width = cssWidth * dpr;
            matrixCanvas.height = cssHeight * dpr;

            mCtx.setTransform(1, 0, 0, 1, 0, 0);
            mCtx.scale(dpr, dpr);

            matrixCols = Math.floor(cssWidth / fontSize);
            drops = new Array(matrixCols).fill(1).map(function() { return Math.random() * -100; });

            mCtx.font = fontSize + 'px Share Tech Mono, monospace';

            lastW = cssWidth;
            lastH = cssHeight;
        }

        var matrixFrame = 0;
        var matrixSpeed = 5;

        function drawMatrix() {
            matrixFrame++;
            if (matrixFrame % matrixSpeed !== 0) {
                requestAnimationFrame(drawMatrix);
                return;
            }

            mCtx.fillStyle = 'rgba(2, 6, 23, 0.08)';
            mCtx.fillRect(0, 0, matrixCanvas.width, matrixCanvas.height);
            mCtx.font = fontSize + 'px Share Tech Mono, monospace';

            for (var i = 0; i < drops.length; i++) {
                var char = matrixChars[Math.floor(Math.random() * matrixChars.length)];
                var x = i * fontSize;
                var y = drops[i] * fontSize;

                var colors = ['#00f0ff', '#39ff14', '#ff00de', '#00f0ff', '#00f0ff', '#39ff14'];
                mCtx.fillStyle = colors[Math.floor(Math.random() * colors.length)];
                mCtx.fillText(char, x, y);

                if (y > window.innerHeight && Math.random() > 0.98) {
                    drops[i] = 0;
                }
                drops[i]++;
            }
            requestAnimationFrame(drawMatrix);
        }

        function onResizeMatrix() {
            var w = window.innerWidth;
            var h = window.innerHeight;
            if (Math.abs(w - lastW) < 50) {
                return; 
            }

            initMatrix();
        }

        initMatrix();
        drawMatrix();

        window.addEventListener('resize', onResizeMatrix);
        window.addEventListener('orientationchange', function() {
            setTimeout(initMatrix, 200);
        });
    }

    /* ═══════════════════════════════════════════
       CYBER GALLERY — Auto-init from data-images
    ═══════════════════════════════════════════ */
    var galleries = document.querySelectorAll('.cyber-gallery[data-images]');

    galleries.forEach(function(gallery) {
        var images = gallery.getAttribute('data-images').split('|').filter(Boolean);
        var alts = (gallery.getAttribute('data-alts') || '').split('|');
        var count = images.length;
        var currentSlide = 0;

        // Set count for CSS (hides arrows/dots if 1)
        gallery.setAttribute('data-count', count);

        // Build HTML
        var html = '';

        // Counter badge
        html += '<span class="gallery-counter"><span class="gallery-counter-current">1</span> / ' + count + '</span>';

        // Viewport + track
        html += '<div class="gallery-viewport">';
        html += '<button class="gallery-arrow gallery-arrow--prev" aria-label="Previous">‹</button>';
        html += '<button class="gallery-arrow gallery-arrow--next" aria-label="Next">›</button>';
        html += '<div class="gallery-track">';
        for (var i = 0; i < count; i++) {
            html += '<div class="gallery-slide" data-index="' + i + '">';
            html += '<img src="' + images[i] + '" alt="' + (alts[i] || 'Screenshot ' + (i + 1)) + '" loading="lazy" draggable="false">';
            html += '</div>';
            }
        html += '</div></div>';

        // Dots
        html += '<div class="gallery-dots">';
        for (var j = 0; j < count; j++) {
            html += '<button class="gallery-dot' + (j === 0 ? ' active' : '') + '" data-index="' + j + '" aria-label="Image ' + (j + 1) + '"></button>';
        }
        html += '</div>';

        gallery.innerHTML = html;

        // Refs
        var track = gallery.querySelector('.gallery-track');
        var dots = gallery.querySelectorAll('.gallery-dot');
        var counterEl = gallery.querySelector('.gallery-counter-current');
        var prevBtn = gallery.querySelector('.gallery-arrow--prev');
        var nextBtn = gallery.querySelector('.gallery-arrow--next');
        var slides = gallery.querySelectorAll('.gallery-slide');

        function goTo(idx) {
            if (idx < 0) idx = count - 1;
            if (idx >= count) idx = 0;
            currentSlide = idx;
            track.style.transform = 'translateX(-' + (idx * 100) + '%)';
            dots.forEach(function(d, di) { d.classList.toggle('active', di === idx); });
            if (counterEl) counterEl.textContent = idx + 1;
        }

        // Arrow clicks
        if (prevBtn) prevBtn.addEventListener('click', function(e) { e.stopPropagation(); goTo(currentSlide - 1); });
        if (nextBtn) nextBtn.addEventListener('click', function(e) { e.stopPropagation(); goTo(currentSlide + 1); });

        // Dot clicks
        dots.forEach(function(dot) {
            dot.addEventListener('click', function() {
                goTo(parseInt(this.getAttribute('data-index')));
            });
        });

        // Click slide → open lightbox
        slides.forEach(function(slide) {
            slide.addEventListener('click', function() {
                openLightbox(images, alts, parseInt(this.getAttribute('data-index')));
            });
        });

        // Touch swipe support
        var touchStartX = 0;
        var touchStartY = 0;
        var touchDeltaX = 0;
        var isSwiping = false;
        var viewport = gallery.querySelector('.gallery-viewport');

        viewport.addEventListener('touchstart', function(e) {
            touchStartX = e.touches[0].clientX;
            touchStartY = e.touches[0].clientY;
            touchDeltaX = 0;
            isSwiping = false;
            track.style.transition = 'none';
        }, { passive: true });

        viewport.addEventListener('touchmove', function(e) {
            var dx = e.touches[0].clientX - touchStartX;
            var dy = e.touches[0].clientY - touchStartY;

            // Determine if horizontal swipe
            if (!isSwiping && Math.abs(dx) > Math.abs(dy) && Math.abs(dx) > 10) {
                isSwiping = true;
            }

            if (isSwiping) {
                e.preventDefault();
                touchDeltaX = dx;
                var offset = -(currentSlide * 100) + (dx / viewport.offsetWidth * 100);
                track.style.transform = 'translateX(' + offset + '%)';
            }
        }, { passive: false });

        viewport.addEventListener('touchend', function() {
            track.style.transition = 'transform 0.4s cubic-bezier(0.25, 0.46, 0.45, 0.94)';
            if (Math.abs(touchDeltaX) > 50) {
                if (touchDeltaX < 0) goTo(currentSlide + 1);
                else goTo(currentSlide - 1);
            } else {
                goTo(currentSlide);
            }
            touchDeltaX = 0;
            isSwiping = false;
        }, { passive: true });
    });

    /* ═══════════════════════════════════════════
       LIGHTBOX
    ═══════════════════════════════════════════ */
    var lightbox, lightboxImg, lightboxClose, lightboxPrev, lightboxNext;
    var lbImages = [];
    var lbAlts = [];
    var lbIndex = 0;

    function ensureLightbox() {
        if (lightbox) return;

        lightbox = document.createElement('div');
        lightbox.id = 'lightbox';
        lightbox.className = 'lightbox-overlay';
        lightbox.innerHTML =
            '<button class="lightbox-close" id="lightboxClose" aria-label="Close">&times;</button>' +
            '<button class="lightbox-arrow lightbox-arrow--prev" id="lightboxPrev" aria-label="Previous">&#8249;</button>' +
            '<button class="lightbox-arrow lightbox-arrow--next" id="lightboxNext" aria-label="Next">&#8250;</button>' +
            '<div class="lightbox-img-wrapper">' +
                '<img id="lightboxImg" class="lightbox-img" src="" alt="" draggable="false">' +
            '</div>';

        document.body.appendChild(lightbox);

        lightboxImg = document.getElementById('lightboxImg');
        lightboxClose = document.getElementById('lightboxClose');
        lightboxPrev = document.getElementById('lightboxPrev');
        lightboxNext = document.getElementById('lightboxNext');

        lightboxClose.addEventListener('click', closeLightbox);
        lightboxPrev.addEventListener('click', function(e) { e.stopPropagation(); lbGoTo(lbIndex - 1); });
        lightboxNext.addEventListener('click', function(e) { e.stopPropagation(); lbGoTo(lbIndex + 1); });

        lightbox.addEventListener('click', function(e) {
            if (e.target === lightbox || e.target.classList.contains('lightbox-img-wrapper')) {
                closeLightbox();
            }
        });

        lightboxImg.addEventListener('click', function(e) {
            e.stopPropagation();
        });

        document.addEventListener('keydown', function(e) {
            if (!lightbox.classList.contains('open')) return;
            if (e.key === 'Escape') closeLightbox();
            if (e.key === 'ArrowLeft') lbGoTo(lbIndex - 1);
            if (e.key === 'ArrowRight') lbGoTo(lbIndex + 1);
        });

        // Lightbox swipe
        var lbTouchStartX = 0;
        lightbox.addEventListener('touchstart', function(e) {
            lbTouchStartX = e.touches[0].clientX;
        }, { passive: true });

        lightbox.addEventListener('touchend', function(e) {
            var dx = e.changedTouches[0].clientX - lbTouchStartX;
            if (Math.abs(dx) > 60) {
                if (dx < 0) lbGoTo(lbIndex + 1);
                else lbGoTo(lbIndex - 1);
            }
        }, { passive: true });
    }

    function openLightbox(images, alts, index) {
        ensureLightbox();
        lbImages = images;
        lbAlts = alts;
        lbIndex = index;
        lightboxImg.src = images[index];
        lightboxImg.alt = alts[index] || '';
        lightbox.classList.add('open');
        document.body.style.overflow = 'hidden';

        var multi = images.length > 1;
        lightboxPrev.style.display = multi ? 'flex' : 'none';
        lightboxNext.style.display = multi ? 'flex' : 'none';
    }

    function closeLightbox() {
        if (!lightbox) return;
        lightbox.classList.remove('open');
        document.body.style.overflow = '';
        lightboxImg.src = '';
    }

    function lbGoTo(idx) {
        if (idx < 0) idx = lbImages.length - 1;
        if (idx >= lbImages.length) idx = 0;
        lbIndex = idx;
        lightboxImg.src = lbImages[idx];
        lightboxImg.alt = lbAlts[idx] || '';
    }

    /* ═══════════════════════════════════════════
       FIX PANEL TOGGLE
    ═══════════════════════════════════════════ */
    var fixPanel = document.getElementById('fixPanel');
    var fixToggle = document.getElementById('fixToggle');
    if (fixPanel && fixToggle) {
        fixToggle.addEventListener('click', function() {
            fixPanel.classList.toggle('collapsed');
        });
    }

    /* ─── NAVBAR ─── */
    var navbar = document.getElementById('navbar');
    var burger = document.getElementById('burger');
    var navLinks = document.getElementById('navLinks');

    if (burger && navLinks) {
        var allNavLinks = navLinks.querySelectorAll('a');

        burger.addEventListener('click', function() {
            burger.classList.toggle('active');
            navLinks.classList.toggle('open');
        });

        allNavLinks.forEach(function(link) {
            link.addEventListener('click', function() {
                burger.classList.remove('active');
                navLinks.classList.remove('open');
            });
        });
    }

    // Scroll effects (only on pages with sections)
    var sections = document.querySelectorAll('section[id]');
    if (navbar && sections.length > 0 && navLinks) {
        function onScroll() {
            var scrollY = window.scrollY;
            navbar.classList.toggle('scrolled', scrollY > 50);

            sections.forEach(function(sec) {
                var top = sec.offsetTop - 120;
                var bottom = top + sec.offsetHeight;
                var id = sec.getAttribute('id');
                var link = navLinks.querySelector('a[href="#' + id + '"]');
                if (link) {
                    link.classList.toggle('active', scrollY >= top && scrollY < bottom);
                }
            });
        }
        window.addEventListener('scroll', onScroll);
    } else if (navbar) {
        // For project pages – just scrolled class
        window.addEventListener('scroll', function() {
            navbar.classList.toggle('scrolled', window.scrollY > 50);
        });
    }

    /* ─── TYPEWRITER ─── */
    var typewriterEl = document.getElementById('typewriter');
    if (typewriterEl) {
        var phrases = [
            'Deploying detection rules and threat signatures...',
            'root@red-team:~$ nmap -sV --script vuln target',
            'Analyzing packets with Wireshark...',
            'Isolating compromised hosts...',
            'Building zero-trust architectures...',
            'root@blue-team:~$ netstat -antp | grep ESTABLISHED',
            'Detecting lateral movement across subnets...',
            '[ STATUS: All systems operational ]'
        ];
        var phraseIdx = 0, charIdx = 0, isDeleting = false;

        function typewrite() {
            var current = phrases[phraseIdx];
            if (isDeleting) {
                typewriterEl.textContent = current.substring(0, charIdx - 1);
                charIdx--;
            } else {
                typewriterEl.textContent = current.substring(0, charIdx + 1);
                charIdx++;
            }

            var speed = isDeleting ? 30 : 60;

            if (!isDeleting && charIdx === current.length) {
                speed = 2000;
                isDeleting = true;
            } else if (isDeleting && charIdx === 0) {
                isDeleting = false;
                phraseIdx = (phraseIdx + 1) % phrases.length;
                speed = 400;
            }

            setTimeout(typewrite, speed);
        }
        typewrite();
    }

    /* ═══════════════════════════════════════════
       SCROLL ANIMATIONS (unique declaration)
    ═══════════════════════════════════════════ */
    var observerOpts = { threshold: 0.15, rootMargin: '0px 0px -50px 0px' };
    var scrollObserver = new IntersectionObserver(function(entries) {
        entries.forEach(function(entry) {
            if (entry.isIntersecting) {
                entry.target.classList.add('visible');

                // Trigger skill bars
                var bars = entry.target.querySelectorAll('.skill-bar-fill');
                bars.forEach(function(bar) {
                    setTimeout(function() {
                        bar.style.width = bar.dataset.width + '%';
                    }, 200);
                });

                // Trigger stat counters
                var counters = entry.target.querySelectorAll('.stat-number[data-target]');
                counters.forEach(function(counter) { animateCounter(counter); });
            }
        });
    }, observerOpts);

    document.querySelectorAll('.animate-on-scroll').forEach(function(el) {
        scrollObserver.observe(el);
    });

    /* ─── COUNTER ANIMATION ─── */
    function animateCounter(el) {
        var target = parseInt(el.dataset.target);
        var duration = 2000;
        var start = performance.now();

        function update(currentTime) {
            var elapsed = currentTime - start;
            var progress = Math.min(elapsed / duration, 1);
            var eased = 1 - Math.pow(1 - progress, 3);
            el.textContent = Math.floor(eased * target);

            if (progress < 1) {
                requestAnimationFrame(update);
            } else {
                el.textContent = target;
                if (el.closest('.stat-card:last-child')) {
                    el.textContent = target + '%';
                }
            }
        }
        requestAnimationFrame(update);
    }

    /* ─── LIVE CLOCK ─── */
    var clockEl = document.getElementById('liveClock');
    function updateClock() {
        if (!clockEl) return;
        var now = new Date();
        var h = String(now.getHours()).padStart(2, '0');
        var m = String(now.getMinutes()).padStart(2, '0');
        var s = String(now.getSeconds()).padStart(2, '0');
        clockEl.textContent = h + ':' + m + ':' + s;
    }
    if (clockEl) {
        updateClock();
        setInterval(updateClock, 1000);
    }

    /* ─── PING TEST ─── */
    var pingEl = document.getElementById("pingValue");
    function updatePing() {
        if (!pingEl) return;
        var start = Date.now();

        fetch("https://api.ipify.org?format=json")
        .then(() => {
            var ping = Date.now() - start;
            pingEl.textContent = ping + " ms";
        })
        .catch(() => {
            pingEl.textContent = "-- ms";
        });

    }
    if (pingEl) {    
     updatePing();
     setInterval(updatePing, 1000);
    }

    /* ─── OS DETECTION ─── */
    var osEl = document.getElementById('osInfo');
    function updateOS() {
        if (!osEl) return;
        if (navigator.userAgentData && navigator.userAgentData.platform) {
        
        var platform = navigator.userAgentData.platform;
        if (platform === "Windows") osEl.textContent = "Windows";
        else if (platform === "macOS") osEl.textContent = "macOS";
        else if (platform === "Linux") osEl.textContent = "Linux";
        else if (platform === "Android") osEl.textContent = "Android";
        else if (platform === "iOS") osEl.textContent = "iOS";
        else osEl.textContent = platform;

        } else {

        var ua = navigator.userAgent;
        if (/android/i.test(ua)) osEl.textContent = "Android";
        else if (/iphone|ipad|ipod/i.test(ua)) osEl.textContent = "iOS";
        else if (/win/i.test(ua)) osEl.textContent = "Windows";
        else if (/mac/i.test(ua)) osEl.textContent = "macOS";
        else if (/linux/i.test(ua)) osEl.textContent = "Linux";
        else osEl.textContent = "Unknown";

        }
    }
     if (osEl) {
     updateOS();
    }

    /* ─── BROWSER INFO ─── */
    var browserEl = document.getElementById('browserInfo');
    function updateBrowser() {
        if (!browserEl) return;
        var ua = navigator.userAgent;
        var browser = "Unknown";

        if (navigator.brave && navigator.brave.isBrave) {
        browser = "Brave";
        }
        else if (ua.includes("TorBrowser")) {
        browser = "Tor";
        }
        else if (ua.includes("Firefox")) {
        browser = "Firefox";
        }
        else if (ua.includes("Edg")) {
        browser = "Edge";
        }
        else if (ua.includes("OPR") || ua.includes("Opera")) {
        browser = "Opera";
        }
        else if (ua.includes("Chrome")) {
        browser = "Chrome";
        }
        else if (ua.includes("Safari")) {
        browser = "Safari";
        }

        browserEl.textContent = browser;
    }
     if (browserEl) {
     updateBrowser();
    }

    /* ─── USER IP ─── */
    var ipEl = document.getElementById('userIP');
    function updateIP() {
        if (!ipEl) return;

        fetch("https://api.ipify.org?format=json")
        .then(function(response) {
            return response.json();
        })
        .then(function(data) {
            ipEl.textContent = data.ip;
        })
        .catch(function() {
            ipEl.textContent = "Unavailable";
        });

    }
     if (ipEl) {
    updateIP();
    }
    
    /* ─── FOOTER UPTIME ─── */
    var uptimeEl = document.getElementById('uptime');
    var launchDate = new Date('2025-01-01');
    function updateUptime() {
        if (!uptimeEl) return;
        var now = new Date();
        var diff = now - launchDate;
        var days = Math.floor(diff / 86400000);
        var hours = Math.floor((diff % 86400000) / 3600000);
        var mins = Math.floor((diff % 3600000) / 60000);
        uptimeEl.textContent = days + 'd ' + hours + 'h ' + mins + 'm';
    }
    if (uptimeEl) {
        updateUptime();
        setInterval(updateUptime, 60000);
    }

    var yearEl = document.getElementById('year');
    if (yearEl) yearEl.textContent = new Date().getFullYear();

    var buildEl = document.getElementById('buildDate');
    if (buildEl) buildEl.textContent = new Date().toLocaleDateString('fr-FR');

    /* ─── FOOTER TERMINAL TYPING ─── */
    var footerCmdEl = document.getElementById('footerCmd');
    if (footerCmdEl) {
        var footerCmds = [
            'echo "Merci pour la Visite"',
            'cat /dev/null && echo "Personne ici… ?"',
            'uptime --pretty',
            'sudo apt install pizza --extra-cheese',
            'neofetch',
            'echo "404 coffee not found"',
            'systemctl status portfolio',
            'sudo rm -rf /',
            'echo "Ce Site Web s"autodétruira dans 3… 2… 1…"'
        ];
        var fCmdIdx = 0, fCharIdx = 0, fIsDeleting = false;

        function footerType() {
            var cmd = footerCmds[fCmdIdx];
            if (fIsDeleting) {
                footerCmdEl.textContent = cmd.substring(0, fCharIdx - 1);
                fCharIdx--;
            } else {
                footerCmdEl.textContent = cmd.substring(0, fCharIdx + 1);
                fCharIdx++;
            }

            var speed = fIsDeleting ? 40 : 80;
            if (!fIsDeleting && fCharIdx === cmd.length) {
                speed = 3000;
                fIsDeleting = true;
            } else if (fIsDeleting && fCharIdx === 0) {
                fIsDeleting = false;
                fCmdIdx = (fCmdIdx + 1) % footerCmds.length;
                speed = 600;
            }
            setTimeout(footerType, speed);
        }
        footerType();
    }

    /* ─── PROJECT TABS FILTER ─── */
    var tabBtns = document.querySelectorAll('.projects-tab-btn');
    var projectCards = document.querySelectorAll('.project-card[data-category]');

    if (tabBtns.length > 0 && projectCards.length > 0) {
        tabBtns.forEach(function(btn) {
            btn.addEventListener('click', function() {
                /* active state */
                tabBtns.forEach(function(b) { b.classList.remove('active'); });
                btn.classList.add('active');

                var filter = btn.getAttribute('data-filter');

                projectCards.forEach(function(card) {
                    var cat = card.getAttribute('data-category');
                    var show = (filter === 'all' || cat === filter);

                    if (show) {
                        card.classList.remove('hide');
                        card.classList.add('show');
                    } else {
                        card.classList.remove('show');
                        card.classList.add('hide');
                    }
                });
            });
        });
    }    

    /* ─── SMOOTH REVEAL on load ─── */
    window.addEventListener('load', function() {
        document.body.style.opacity = '1';
    });

})();
