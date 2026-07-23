/**
 * Mobile landscape: blocca scroll sotto l'overlay "gira il telefono".
 * Desktop: non fa nulla.
 * Usa max-height (non max-width): in landscape i telefoni superano spesso 768px di width.
 * Durante orientationchange copre il flash; in uscita sblocca presto (senza restare appiccicato).
 */
(function () {
    if (!window.matchMedia) return;

    var phoneLandscape = window.matchMedia('(orientation: landscape) and (max-height: 600px)');
    var desktopPointer = window.matchMedia('(hover: hover) and (pointer: fine)');
    var locked = false;
    var unlockTimer = null;
    var settleTimers = [];
    /* Breve: abbastanza per l'animazione OS, non resta dopo il ritorno in portrait */
    var SETTLE_MS = 180;

    function isDesktop() {
        return desktopPointer.matches;
    }

    function wantsLock() {
        return phoneLandscape.matches && !isDesktop();
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

    function paintLockedChrome() {
        var c = overlayChromeColor();
        var root = document.documentElement;
        var body = document.body;
        root.style.setProperty('background-color', c, 'important');
        root.style.setProperty('background-image', 'none', 'important');
        if (body) {
            body.style.setProperty('background-color', c, 'important');
            body.style.setProperty('background-image', 'none', 'important');
        }
        setThemeColor(c);
    }

    function restoreChrome() {
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

    function finishUnlock() {
        var root = document.documentElement;
        unlockTimer = null;
        if (wantsLock()) {
            root.classList.add('gadly-orient-locked');
            root.classList.remove('gadly-orient-settling');
            paintLockedChrome();
            locked = true;
            return;
        }
        root.classList.remove('gadly-orient-locked', 'gadly-orient-settling');
        locked = false;
        restoreChrome();
    }

    function setLocked(on) {
        var root = document.documentElement;
        if (isDesktop()) {
            if (unlockTimer) { clearTimeout(unlockTimer); unlockTimer = null; }
            clearSettleTimers();
            root.classList.remove('gadly-orient-locked', 'gadly-orient-settling');
            if (locked) {
                locked = false;
                restoreChrome();
            }
            return;
        }

        if (on) {
            if (unlockTimer) { clearTimeout(unlockTimer); unlockTimer = null; }
            root.classList.add('gadly-orient-locked');
            root.classList.remove('gadly-orient-settling');
            paintLockedChrome();
            locked = true;
            return;
        }

        if (!locked && !root.classList.contains('gadly-orient-locked')) return;

        /* Già in unlock: non riavviare il timer (altrimenti resta troppo a lungo) */
        if (unlockTimer) return;

        root.classList.add('gadly-orient-locked', 'gadly-orient-settling');
        paintLockedChrome();
        locked = true;
        unlockTimer = setTimeout(finishUnlock, SETTLE_MS);
    }

    function sync() {
        if (wantsLock()) setLocked(true);
        else setLocked(false);
    }

    function coverDuringRotate() {
        if (isDesktop()) return;
        var root = document.documentElement;
        /* Copri subito il flash OS; poi sync decide lock/unlock senza allungare all'infinito */
        if (unlockTimer) {
            clearTimeout(unlockTimer);
            unlockTimer = null;
        }
        root.classList.add('gadly-orient-locked', 'gadly-orient-settling');
        paintLockedChrome();
        locked = true;
        clearSettleTimers();
        settleTimers.push(setTimeout(sync, 60));
        settleTimers.push(setTimeout(sync, 200));
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
            if (document.documentElement.classList.contains('gadly-orient-locked')) {
                paintLockedChrome();
            }
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
