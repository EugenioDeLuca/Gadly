/**
 * Mobile landscape: overlay "gira il telefono".
 * Regola: la CARD non deve mai essere visibile mentre l'OS sta ancora ruotando
 * (né verso landscape né verso portrait) — solo colore pieno, poi reveal.
 */
(function () {
    if (!window.matchMedia) return;

    var phoneLandscape = window.matchMedia('(orientation: landscape) and (max-height: 600px)');
    var desktopPointer = window.matchMedia('(hover: hover) and (pointer: fine)');
    var locked = false;
    var unlocking = false;
    var unlockTimer = null;
    var settleTimers = [];
    var revealTimer = null;
    var UNLOCK_MS = 320;
    /* Tempo minimo a card nascosta dopo un lock / orientationchange */
    var REVEAL_AFTER_LOCK_MS = 480;
    var ROTATE_COVER_MS = 400;

    function isDesktop() {
        return desktopPointer.matches;
    }

    function wantsLock() {
        return phoneLandscape.matches && !isDesktop();
    }

    function lockEl() {
        return document.getElementById('gadly-orient-lock');
    }

    function isDark() {
        return !!(document.body && document.body.classList.contains('dark-mode'));
    }

    function isDrose() {
        var b = document.body;
        return !!(b && (b.classList.contains('is-drose-brand') || b.classList.contains('drose-page')));
    }

    function overlayChromeColor() {
        if (isDark()) return '#0f172a';
        if (isDrose()) return '#f8fafc';
        return '#f4f6fa';
    }

    function unlockVeilColor() {
        if (isDark()) return '#0f0f23';
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

    function paintUnlockVeil() {
        paintColor(unlockVeilColor());
    }

    function clearInlineOverlayBg() {
        var el = lockEl();
        if (!el) return;
        el.style.removeProperty('background-color');
        el.style.removeProperty('background-image');
    }

    function restoreChrome() {
        clearInlineOverlayBg();
        try {
            if (typeof window.gadlySyncViewportChrome === 'function') {
                window.gadlySyncViewportChrome(isDark(), { forceResample: true });
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

    /** Nasconde la card SUBITO e annulla eventuali reveal in coda. */
    function veilCardOnly() {
        var el = lockEl();
        if (el) el.classList.add('gadly-orient-lock--layouting');
        if (revealTimer) {
            clearTimeout(revealTimer);
            revealTimer = null;
        }
    }

    /** Card nascosta, poi reveal solo se ancora in landscape lock. */
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
            beginLock(80);
            return;
        }
        root.classList.remove('gadly-orient-locked', 'gadly-orient-settling');
        var el = lockEl();
        if (el) el.classList.remove('gadly-orient-lock--layouting');
        locked = false;
        unlocking = false;
        restoreChrome();
    }

    function beginUnlock() {
        var root = document.documentElement;
        if (isDesktop()) {
            unlocking = false;
            if (unlockTimer) { clearTimeout(unlockTimer); unlockTimer = null; }
            clearSettleTimers();
            veilCardOnly();
            root.classList.remove('gadly-orient-locked', 'gadly-orient-settling');
            var el = lockEl();
            if (el) el.classList.remove('gadly-orient-lock--layouting');
            if (locked) {
                locked = false;
                restoreChrome();
            }
            return;
        }

        if (unlockTimer) {
            /* Già in unlock: tieni comunque la card nascosta */
            veilCardOnly();
            paintUnlockVeil();
            return;
        }

        unlocking = true;
        veilCardOnly();
        root.classList.add('gadly-orient-locked', 'gadly-orient-settling');
        paintUnlockVeil();
        locked = true;
        unlockTimer = setTimeout(finishUnlock, UNLOCK_MS);
    }

    /**
     * Entra in lock: overlay acceso ma CARD sempre nascosta all'inizio.
     * revealAfterMs: quando mostrare la card (dopo che l'OS ha finito di ruotare).
     */
    function beginLock(revealAfterMs) {
        var root = document.documentElement;
        unlocking = false;
        if (unlockTimer) {
            clearTimeout(unlockTimer);
            unlockTimer = null;
        }
        /* Prima di tutto: card nascosta (evita 1 frame inclinato) */
        veilCardOnly();
        root.classList.add('gadly-orient-locked');
        root.classList.remove('gadly-orient-settling');
        paintLockedChrome();
        locked = true;
        veilThenReveal(typeof revealAfterMs === 'number' ? revealAfterMs : REVEAL_AFTER_LOCK_MS);
    }

    function sync() {
        if (isDesktop()) {
            beginUnlock();
            return;
        }
        if (wantsLock()) {
            /* Non rivelare subito: resize/MQ scattano a metà rotazione OS */
            beginLock(REVEAL_AFTER_LOCK_MS);
        } else {
            beginUnlock();
        }
    }

    function coverDuringRotate() {
        if (isDesktop()) return;
        var root = document.documentElement;

        /* Sempre: via la card al primo segnale di rotazione */
        veilCardOnly();
        root.classList.add('gadly-orient-locked', 'gadly-orient-settling');
        locked = true;

        if (unlockTimer) {
            clearTimeout(unlockTimer);
            unlockTimer = null;
        }

        if (!phoneLandscape.matches) {
            unlocking = true;
            paintUnlockVeil();
        } else {
            unlocking = false;
            paintLockedChrome();
        }

        clearSettleTimers();
        settleTimers.push(setTimeout(function () {
            if (wantsLock()) {
                unlocking = false;
                /* Già aspettato ROTATE_COVER_MS: piccolo buffer poi card */
                beginLock(120);
            } else {
                beginUnlock();
            }
        }, ROTATE_COVER_MS));
    }

    function bind(m) {
        if (typeof m.addEventListener === 'function') {
            m.addEventListener('change', sync);
        } else if (typeof m.addListener === 'function') {
            m.addListener(sync);
        }
    }

    /* Se già landscape al load */
    if (wantsLock()) beginLock(0);
    else sync();

    bind(phoneLandscape);
    bind(desktopPointer);
    window.addEventListener('resize', function () {
        /* In resize a metà rotate: se lock, tieni card nascosta e riparte il timer reveal */
        if (wantsLock()) beginLock(REVEAL_AFTER_LOCK_MS);
        else beginUnlock();
    }, { passive: true });
    window.addEventListener('orientationchange', coverDuringRotate);

    if (window.screen && screen.orientation && typeof screen.orientation.addEventListener === 'function') {
        try {
            screen.orientation.addEventListener('change', coverDuringRotate);
        } catch (eOr) {}
    }

    try {
        var mo = new MutationObserver(function () {
            if (!document.documentElement.classList.contains('gadly-orient-locked')) return;
            if (unlocking) paintUnlockVeil();
            else paintLockedChrome();
        });
        if (document.body) {
            mo.observe(document.body, { attributes: true, attributeFilter: ['class'] });
        } else {
            document.addEventListener('DOMContentLoaded', function () {
                mo.observe(document.body, { attributes: true, attributeFilter: ['class'] });
            });
        }
    } catch (eMo) {}
})();
