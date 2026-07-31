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
    var REVEAL_AFTER_LOCK_MS = 120;
    /* Solo in ingresso landscape (da portrait): velo mentre l’OS ruota */
    var ROTATE_COVER_MS = 280;

    /* Preferisci visual/client se innerWidth è gonfiato (overflow tabella Quotes/Bin). */
    function layoutInnerW() {
        var iw = (typeof window.innerWidth === 'number' && window.innerWidth > 0) ? window.innerWidth : 0;
        var cw = (document.documentElement && document.documentElement.clientWidth) || 0;
        var vv = window.visualViewport;
        var vw = (vv && vv.width > 0) ? vv.width : 0;
        if (vw > 0 && iw > vw + 40) return Math.round(vw);
        if (cw > 0 && iw > cw + 40) return Math.round(cw);
        return Math.round(iw || cw || vw || 0);
    }

    function layoutInnerH() {
        var ih = (typeof window.innerHeight === 'number' && window.innerHeight > 0) ? window.innerHeight : 0;
        var ch = (document.documentElement && document.documentElement.clientHeight) || 0;
        var vv = window.visualViewport;
        var vh = (vv && vv.height > 0) ? vv.height : 0;
        if (vh > 0 && ih > vh + 40) return Math.round(vh);
        if (ch > 0 && ih > ch + 40) return Math.round(ch);
        return Math.round(ih || ch || vh || 0);
    }

    function isSettlingRotate() {
        return document.documentElement.classList.contains('gadly-orient-settling');
    }

    function pinOverlayToVisualViewport() {
        var el = lockEl();
        if (!el) return;
        /* Durante la rotazione OS il visualViewport è instabile: pin parziale = buco e header visibile */
        if (isSettlingRotate() || (el.classList.contains('gadly-orient-lock--layouting'))) {
            clearOverlayPin();
            return;
        }
        var vv = window.visualViewport;
        if (!vv || !(vv.width > 0) || !(vv.height > 0)) {
            clearOverlayPin();
            return;
        }
        el.style.setProperty('top', Math.round(vv.offsetTop) + 'px', 'important');
        el.style.setProperty('left', Math.round(vv.offsetLeft) + 'px', 'important');
        el.style.setProperty('width', Math.round(vv.width) + 'px', 'important');
        el.style.setProperty('height', Math.round(vv.height) + 'px', 'important');
        el.style.setProperty('right', 'auto', 'important');
        el.style.setProperty('bottom', 'auto', 'important');
    }

    function clearOverlayPin() {
        var el = lockEl();
        if (!el) return;
        el.style.removeProperty('top');
        el.style.removeProperty('left');
        el.style.removeProperty('width');
        el.style.removeProperty('height');
        el.style.removeProperty('right');
        el.style.removeProperty('bottom');
    }

    function isDesktop() {
        try {
            /* DevTools / telefono: viewport stretto → mai “desktop” per l’overlay */
            if (layoutInnerW() <= 1024) return false;
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
            var w = layoutInnerW();
            var h = layoutInnerH();
            return w > h && h <= 1100 && w <= 1024;
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
        pinOverlayToVisualViewport();
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
        clearOverlayPin();
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

        /* Unlock immediato (niente ritardo: la pagina deve riprendere subito) */
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
            pinOverlayToVisualViewport();
            return;
        }

        veilCardOnly();
        root.classList.add('gadly-orient-locked');
        root.classList.remove('gadly-orient-settling');
        paintLockedChrome();
        /* Pin solo dopo il reveal (settling/layouting = copertura piena CSS) */
        clearOverlayPin();
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
                pinOverlayToVisualViewport();
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
        /* Copertura sincrona: niente rAF (1+ frame di header ruotato visibile) */
        try {
            coverDuringRotateNow();
        } finally {
            requestAnimationFrame(function () {
                rotateCoverQueued = false;
            });
        }
    }

    function isStablyShowingCard() {
        var root = document.documentElement;
        var el = lockEl();
        return !!(
            locked &&
            root.classList.contains('gadly-orient-locked') &&
            !root.classList.contains('gadly-orient-settling') &&
            !(el && el.classList.contains('gadly-orient-lock--layouting'))
        );
    }

    function coverDuringRotateNow() {
        if (isDesktop()) return;
        var root = document.documentElement;

        /* Ritorno in portrait: sblocco subito (niente velo lungo) */
        if (!wantsLock()) {
            if (unlockTimer) {
                clearTimeout(unlockTimer);
                unlockTimer = null;
            }
            clearSettleTimers();
            if (revealTimer) {
                clearTimeout(revealTimer);
                revealTimer = null;
            }
            if (isActiveLock()) {
                unlocking = true;
                finishUnlock();
            }
            return;
        }

        /*
         * Ancora landscape: se la card è già stabile, NON ri-avviare settling/velo
         * né clearPin — all’inizio del ritorno l’OS spara orientationchange e
         * nascondere la card / ripinare l’overlay fa lo “scatto”.
         */
        if (isStablyShowingCard()) {
            paintLockedChrome();
            return;
        }

        unlocking = false;
        if (unlockTimer) {
            clearTimeout(unlockTimer);
            unlockTimer = null;
        }
        clearSettleTimers();

        /* Ingresso landscape da portrait: velo solido, poi card */
        veilCardOnly();
        root.classList.remove('gadly-orient-post-unlock');
        root.classList.add('gadly-orient-locked', 'gadly-orient-settling');
        paintLockedChrome();
        clearOverlayPin();
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
            clearOverlayPin();
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
                pinOverlayToVisualViewport();
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

    if (window.visualViewport) {
        window.visualViewport.addEventListener('resize', function () {
            if (isActiveLock()) pinOverlayToVisualViewport();
        }, { passive: true });
        window.visualViewport.addEventListener('scroll', function () {
            if (isActiveLock()) pinOverlayToVisualViewport();
        }, { passive: true });
    }

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
