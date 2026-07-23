/**
 * Mobile landscape: blocca scroll sotto l'overlay "gira il telefono".
 * Desktop: non fa nulla.
 */
(function () {
    if (!window.matchMedia) return;

    var mq = window.matchMedia('(max-width: 768px) and (orientation: landscape)');

    function sync() {
        document.documentElement.classList.toggle('gadly-orient-locked', mq.matches);
    }

    sync();
    if (typeof mq.addEventListener === 'function') {
        mq.addEventListener('change', sync);
    } else if (typeof mq.addListener === 'function') {
        mq.addListener(sync);
    }
})();
