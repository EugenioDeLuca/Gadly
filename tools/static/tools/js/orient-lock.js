/**
 * Mobile landscape: blocca scroll sotto l'overlay "gira il telefono".
 * Desktop: non fa nulla.
 * Usa max-height (non max-width): in landscape i telefoni superano spesso 768px di width.
 */
(function () {
    if (!window.matchMedia) return;

    var phoneLandscape = window.matchMedia('(orientation: landscape) and (max-height: 600px)');
    var desktopPointer = window.matchMedia('(hover: hover) and (pointer: fine)');

    function sync() {
        var on = phoneLandscape.matches && !desktopPointer.matches;
        document.documentElement.classList.toggle('gadly-orient-locked', on);
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
    });
})();
