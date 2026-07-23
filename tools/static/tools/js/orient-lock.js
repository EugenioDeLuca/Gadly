/**
 * Mobile landscape: blocca scroll sotto l'overlay "gira il telefono".
 * Desktop: non fa nulla.
 * Usa max-height (non max-width): in landscape i telefoni superano spesso 768px di width.
 * Allinea anche theme-color / html background all'overlay (evita striscia bianca/nera).
 */
(function () {
    if (!window.matchMedia) return;

    var phoneLandscape = window.matchMedia('(orientation: landscape) and (max-height: 600px)');
    var desktopPointer = window.matchMedia('(hover: hover) and (pointer: fine)');
    var locked = false;

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

    function sync() {
        var on = phoneLandscape.matches && !desktopPointer.matches;
        document.documentElement.classList.toggle('gadly-orient-locked', on);
        if (on) {
            paintLockedChrome();
            locked = true;
        } else if (locked) {
            locked = false;
            restoreChrome();
        }
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
    window.addEventListener('orientationchange', function () {
        setTimeout(sync, 50);
        setTimeout(sync, 300);
    });

    /* Se l'utente cambia tema mentre è in landscape lock, aggiorna la chrome */
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
