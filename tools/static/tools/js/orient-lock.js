/**
 * Mobile landscape: overlay "gira il telefono".
 * Durante la rotazione OS: solo colore pieno (niente card) — evita la card inclinata.
 * Animazione tilt del telefono: solo quando la card è già stabile in landscape.
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
    var ROTATE_COVER_MS = 380;

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

    /* In uscita: colore vicino alla pagina, meno “flash” verso portrait */
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
        var el = lockEl();
        if (el) el.classList.remove('gadly-orient-lock--layouting');
        clearInlineOverlayBg();
        paintLockedChrome();
    }

    /* Nasconde la card e NON programma il reveal (per l’uscita) */
    function veilCardOnly() {
        var el = lockEl();
        if (el) el.classList.add('gadly-orient-lock--layouting');
        if (revealTimer) {
            clearTimeout(revealTimer);
            revealTimer = null;
        }
    }

    /* Nasconde la card, poi la mostra solo se siamo ancora in landscape lock */
    function veilThenReveal(ms) {
        var el = lockEl();
        if (!el) return;
        el.classList.add('gadly-orient-lock--layouting');
        if (revealTimer) clearTimeout(revealTimer);
        revealTimer = setTimeout(function () {
            revealTimer = null;
            if (unlocking || !wantsLock()) return;
            if (!document.documentElement.classList.contains('gadly-orient-locked')) return;
            requestAnimationFrame(function () {
                requestAnimationFrame(revealCard);
            });
        }, typeof ms === 'number' ? ms : 360);
    }

    function finishUnlock() {
        var root = document.documentElement;
        unlockTimer = null;
        if (wantsLock()) {
            unlocking = false;
            root.classList.add('gadly-orient-locked');
            root.classList.remove('gadly-orient-settling');
            locked = true;
            paintLockedChrome();
            veilThenReveal(60);
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
            if (revealTimer) { clearTimeout(revealTimer); revealTimer = null; }
            root.classList.remove('gadly-orient-locked', 'gadly-orient-settling');
            var el = lockEl();
            if (el) el.classList.remove('gadly-orient-lock--layouting');
            if (locked) {
                locked = false;
                restoreChrome();
            }
            return;
        }

        if (unlockTimer) return;

        unlocking = true;
        /* Subito: via la card, solo colore (niente overlay inclinato al ritorno) */
        veilCardOnly();
        root.classList.add('gadly-orient-locked', 'gadly-orient-settling');
        paintUnlockVeil();
        locked = true;
        unlockTimer = setTimeout(finishUnlock, UNLOCK_MS);
    }

    function beginLock() {
        var root = document.documentElement;
        unlocking = false;
        if (unlockTimer) {
            clearTimeout(unlockTimer);
            unlockTimer = null;
        }
        root.classList.add('gadly-orient-locked');
        root.classList.remove('gadly-orient-settling');
        paintLockedChrome();
        locked = true;
    }

    function sync() {
        if (isDesktop()) {
            beginUnlock();
            return;
        }
        if (wantsLock()) beginLock();
        else beginUnlock();
    }

    function coverDuringRotate() {
        if (isDesktop()) return;
        var root = document.documentElement;

        /* Qualsiasi rotazione: nascondi subito la card */
        veilCardOnly();
        root.classList.add('gadly-orient-locked', 'gadly-orient-settling');
        locked = true;

        if (unlockTimer) {
            clearTimeout(unlockTimer);
            unlockTimer = null;
        }

        /* Se stiamo uscendo → velo colore pagina; se entriamo → colore overlay */
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
                beginLock();
                veilThenReveal(40);
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

    sync();
    bind(phoneLandscape);
    bind(desktopPointer);
    window.addEventListener('resize', sync, { passive: true });
    window.addEventListener('orientationchange', coverDuringRotate);

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
