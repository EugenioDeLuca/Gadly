/**
 * Mobile landscape: overlay "gira il telefono".
 * - Card nascosta mentre l'OS ruota (solo colore pieno) in ingresso landscape.
 * - In uscita (portrait): unlock immediato, senza schermo pieno bianco/blu.
 * - Early lock da <head> + soglia altezza alta (evita unlock al refresh).
 * - Nessun unlock/velo se non eravamo in lock (evita flash al refresh in portrait).
 */
(function () {
    if (!window.matchMedia) return;

    /* 1024: viewport telefono anche in DevTools; esclude monitor desktop larghi */
    var phoneLandscape = window.matchMedia('(orientation: landscape) and (max-height: 1100px) and (max-width: 1024px)');
    var desktopPointer = window.matchMedia('(hover: hover) and (pointer: fine)');
    var locked = false;
    var unlocking = false;
    var unlockTimer = null;
    var settleTimers = [];
    var revealTimer = null;
    var booted = false;
    var bootGraceUntil = 0;
    var REVEAL_AFTER_LOCK_MS = 70;
    var ROTATE_COVER_MS = 50;

    function isDesktop() {
        try {
            /* DevTools / telefono: viewport stretto → mai “desktop” per l’overlay */
            if (window.innerWidth <= 1024) return false;
        } catch (eW) {}
        return desktopPointer.matches;
    }

    function isDroseLightboxOpen() {
        var body = document.body;
        if (!body) return false;
        return body.classList.contains('drose-works-page') &&
            body.classList.contains('drose-works-lightbox-open');
    }

    function isDroseLightboxAllowRotate() {
        return document.documentElement.classList.contains('drose-lightbox-allow-rotate');
    }

    function wantsLock() {
        /* Lightbox aperta: lock solo se la foto/video NON permette la rotazione */
        if (isDroseLightboxOpen() && isDroseLightboxAllowRotate()) return false;
        if (isDesktop()) return false;
        if (phoneLandscape.matches) return true;
        try {
            return window.innerWidth > window.innerHeight &&
                window.innerHeight <= 1100 &&
                window.innerWidth <= 1024;
        } catch (e) {
            return false;
        }
    }

    function isActiveLock() {
        return locked || document.documentElement.classList.contains('gadly-orient-locked');
    }

    function lockEl() {
        return document.getElementById('gadly-orient-lock');
    }

    function isDark() {
        return !!(document.body && document.body.classList.contains('dark-mode'));
    }

    function isWarm() {
        var b = document.body;
        if (b && b.classList.contains('warm-tone')) return true;
        try {
            return localStorage.getItem('gadly-warm-tone') === '1';
        } catch (e) {
            return false;
        }
    }

    function overlayChromeColor() {
        if (isDark()) return isWarm() ? '#26201c' : '#0f0f23';
        if (isWarm()) return '#fff8ec';
        return '#ffffff';
    }

    function setThemeColor(c) {
        var head = document.head;
        if (!head) return;
        ['gadly-theme-color', 'gadly-theme-color-light', 'gadly-theme-color-dark'].forEach(function (id) {
            var meta = document.getElementById(id);
            if (!meta) {
                meta = document.createElement('meta');
                meta.id = id;
                meta.setAttribute('name', 'theme-color');
                head.insertBefore(meta, head.firstChild);
            }
            meta.setAttribute('content', c);
            meta.removeAttribute('media');
        });
    }

    function paintColor(c) {
        var root = document.documentElement;
        var body = document.body;
        root.style.setProperty('background-color', c, 'important');
        root.style.setProperty('background-image', 'none', 'important');
        if (body) {
            body.style.setProperty('background-color', c, 'important');
            body.style.setProperty('background-image', 'none', 'important');
        }
        setThemeColor(c);
        var el = lockEl();
        if (el) {
            el.style.setProperty('background-color', c, 'important');
            el.style.setProperty('background-image', 'none', 'important');
        }
    }

    function paintLockedChrome() {
        paintColor(overlayChromeColor());
    }

    function clearInlineOverlayBg() {
        var el = lockEl();
        if (!el) return;
        el.style.removeProperty('background-color');
        el.style.removeProperty('background-image');
    }

    function clearThemeToggleFlash() {
        ['theme-toggle', 'warm-tone-toggle'].forEach(function (id) {
            var b = document.getElementById(id);
            if (!b) return;
            try { b.blur(); } catch (eBlur) {}
            b.classList.remove('is-nav-link-hover', 'tap-active');
        });
    }

    function restoreChrome() {
        clearInlineOverlayBg();
        clearThemeToggleFlash();
        try {
            if (typeof window.gadlySyncViewportChrome === 'function') {
                /* Niente forceResample: absolute→fixed sull'header fa lampeggiare il toggle tema. */
                window.gadlySyncViewportChrome(isDark(), { forceResample: false });
                return;
            }
        } catch (e) {}
        var root = document.documentElement;
        var body = document.body;
        root.style.removeProperty('background-color');
        root.style.removeProperty('background-image');
        if (body) {
            body.style.removeProperty('background-color');
            body.style.removeProperty('background-image');
        }
    }

    function clearSettleTimers() {
        settleTimers.forEach(function (id) { clearTimeout(id); });
        settleTimers = [];
    }

    function revealCard() {
        if (unlocking || !wantsLock()) return;
        if (!document.documentElement.classList.contains('gadly-orient-locked')) return;
        var el = lockEl();
        if (el) el.classList.remove('gadly-orient-lock--layouting');
        clearInlineOverlayBg();
        paintLockedChrome();
    }

    function veilCardOnly() {
        var el = lockEl();
        if (el) el.classList.add('gadly-orient-lock--layouting');
        if (revealTimer) {
            clearTimeout(revealTimer);
            revealTimer = null;
        }
    }

    function veilThenReveal(ms) {
        veilCardOnly();
        revealTimer = setTimeout(function () {
            revealTimer = null;
            requestAnimationFrame(function () {
                requestAnimationFrame(revealCard);
            });
        }, typeof ms === 'number' ? ms : REVEAL_AFTER_LOCK_MS);
    }

    function finishUnlock() {
        var root = document.documentElement;
        unlockTimer = null;
        if (wantsLock()) {
            unlocking = false;
            beginLock(0);
            return;
        }
        var el = lockEl();
        clearInlineOverlayBg();
        root.style.removeProperty('background-color');
        root.style.removeProperty('background-image');
        if (document.body) {
            document.body.style.removeProperty('background-color');
            document.body.style.removeProperty('background-image');
            document.body.style.removeProperty('overflow');
            document.body.style.removeProperty('touch-action');
        }
        root.style.removeProperty('overflow');
        root.style.removeProperty('touch-action');
        /* Congela stile toggle tema mentre l'header ridiventa visibile */
        root.classList.add('gadly-orient-post-unlock');
        root.classList.remove('gadly-orient-locked', 'gadly-orient-settling');
        if (el) el.classList.remove('gadly-orient-lock--layouting');
        locked = false;
        unlocking = false;
        clearThemeToggleFlash();
        /* Paint chrome dopo lo sblocco: evita di campionare il velo bianco/blu */
        requestAnimationFrame(function () {
            restoreChrome();
            try {
                window.dispatchEvent(new Event('gadly-orient-unlocked'));
            } catch (eUnlockEv) { /* ignore */ }
            settleTimers.push(setTimeout(function () {
                root.classList.remove('gadly-orient-post-unlock');
                clearThemeToggleFlash();
            }, 320));
        });
    }

    function beginUnlock() {
        if (!isActiveLock()) {
            unlocking = false;
            return;
        }

        /* Dopo refresh early-lock: non sbloccare per jitter di altezza */
        if (Date.now() < bootGraceUntil && wantsLock()) {
            beginLock(0);
            return;
        }
        if (Date.now() < bootGraceUntil && window.__gadlyOrientEarlyLock) {
            beginLock(0);
            return;
        }

        if (unlockTimer) {
            clearTimeout(unlockTimer);
            unlockTimer = null;
        }
        clearSettleTimers();
        if (revealTimer) {
            clearTimeout(revealTimer);
            revealTimer = null;
        }

        /* Unlock immediato: niente velo solido bianco/blu in uscita */
        unlocking = true;
        finishUnlock();
    }

    function beginLock(revealAfterMs) {
        var root = document.documentElement;
        unlocking = false;
        if (unlockTimer) {
            clearTimeout(unlockTimer);
            unlockTimer = null;
        }
        clearSettleTimers();
        root.classList.remove('gadly-orient-post-unlock');

        /* Già in lock stabile: non ri-nascondere la card (evita flash logo in rotazione). */
        var el = lockEl();
        var stablyLocked =
            locked &&
            root.classList.contains('gadly-orient-locked') &&
            !root.classList.contains('gadly-orient-settling') &&
            !(el && el.classList.contains('gadly-orient-lock--layouting'));
        if (stablyLocked) {
            paintLockedChrome();
            return;
        }

        veilCardOnly();
        root.classList.add('gadly-orient-locked');
        root.classList.remove('gadly-orient-settling');
        paintLockedChrome();
        locked = true;
        veilThenReveal(typeof revealAfterMs === 'number' ? revealAfterMs : REVEAL_AFTER_LOCK_MS);
    }

    function sync() {
        if (isDesktop()) {
            if (isActiveLock()) beginUnlock();
            return;
        }
        if (wantsLock()) {
            var root = document.documentElement;
            if (
                locked &&
                root.classList.contains('gadly-orient-locked') &&
                !root.classList.contains('gadly-orient-settling')
            ) {
                paintLockedChrome();
                return;
            }
            beginLock(REVEAL_AFTER_LOCK_MS);
        } else {
            beginUnlock();
        }
    }

    var rotateCoverQueued = false;

    function coverDuringRotate() {
        if (isDesktop()) return;
        /* orientationchange + screen.orientation.change spesso sparano entrambi → 1 solo ciclo */
        if (rotateCoverQueued) return;
        rotateCoverQueued = true;
        requestAnimationFrame(function () {
            rotateCoverQueued = false;
            coverDuringRotateNow();
        });
    }

    function coverDuringRotateNow() {
        if (isDesktop()) return;
        var root = document.documentElement;

        unlocking = false;
        if (unlockTimer) {
            clearTimeout(unlockTimer);
            unlockTimer = null;
        }
        clearSettleTimers();

        /* Ritorno in portrait: sblocca subito, senza schermo pieno bianco/blu */
        if (!wantsLock()) {
            if (isActiveLock()) {
                unlocking = true;
                finishUnlock();
            }
            return;
        }

        veilCardOnly();
        root.classList.remove('gadly-orient-post-unlock');
        root.classList.add('gadly-orient-locked', 'gadly-orient-settling');
        paintLockedChrome();
        locked = true;

        settleTimers.push(setTimeout(function () {
            if (wantsLock()) {
                beginLock(0);
            } else {
                unlocking = true;
                finishUnlock();
            }
        }, ROTATE_COVER_MS));
    }

    function onResize() {
        if (isDesktop()) {
            if (isActiveLock()) beginUnlock();
            return;
        }
        if (document.documentElement.classList.contains('gadly-orient-settling')) {
            veilCardOnly();
            paintLockedChrome();
            return;
        }
        if (Date.now() < bootGraceUntil) {
            if (wantsLock() || window.__gadlyOrientEarlyLock) {
                beginLock(0);
                return;
            }
        }
        if (wantsLock()) {
            var root = document.documentElement;
            if (
                locked &&
                root.classList.contains('gadly-orient-locked') &&
                !root.classList.contains('gadly-orient-settling')
            ) {
                paintLockedChrome();
                return;
            }
            beginLock(REVEAL_AFTER_LOCK_MS);
        } else if (isActiveLock()) {
            beginUnlock();
        }
    }

    function bind(m) {
        if (typeof m.addEventListener === 'function') {
            m.addEventListener('change', sync);
        } else if (typeof m.addListener === 'function') {
            m.addListener(sync);
        }
    }

    function boot() {
        if (booted) return;
        booted = true;
        if (wantsLock() || window.__gadlyOrientEarlyLock ||
            document.documentElement.classList.contains('gadly-orient-locked')) {
            bootGraceUntil = Date.now() + 1200;
            beginLock(0);
        }
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', boot);
    } else {
        boot();
    }

    bind(phoneLandscape);
    bind(desktopPointer);
    window.addEventListener('resize', onResize, { passive: true });
    window.addEventListener('orientationchange', coverDuringRotate);

    if (window.screen && screen.orientation && typeof screen.orientation.addEventListener === 'function') {
        try {
            screen.orientation.addEventListener('change', coverDuringRotate);
        } catch (eOr) {}
    }

    try {
        /* Solo tema (class su body): ridipinge il colore. Niente sync() qui → evita loop. */
        var mo = new MutationObserver(function () {
            if (!document.documentElement.classList.contains('gadly-orient-locked')) return;
            paintLockedChrome();
        });
        function observeThemeClass() {
            if (!document.body) return;
            mo.observe(document.body, { attributes: true, attributeFilter: ['class'] });
        }
        if (document.body) {
            observeThemeClass();
        } else {
            document.addEventListener('DOMContentLoaded', observeThemeClass);
        }
    } catch (eMo) {}

    window.gadlyOrientLockSync = sync;
})();
