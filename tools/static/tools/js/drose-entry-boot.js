(function () {

    'use strict';



    var PROP_KEY = 'drosePropellerAngle';

    var SIDE_KEY = 'gadly-quick-nav-side-v1';

    var root = document.documentElement;



    function isDesktop() {

        return window.matchMedia && window.matchMedia('(min-width: 769px)').matches;

    }



    function isReloadOrBack() {

        try {

            var nav = performance.getEntriesByType('navigation')[0];

            return !!(nav && (nav.type === 'reload' || nav.type === 'back_forward'));

        } catch (e) {

            return false;

        }

    }



    function markReady() {

        root.classList.add('drose-propellers-ready');

    }



    function getSavedSide() {

        try {

            var side = localStorage.getItem(SIDE_KEY);

            return side === 'left' || side === 'right' ? side : 'right';

        } catch (e) {

            return 'right';

        }

    }



    try {

        var savedSide = getSavedSide();

        root.classList.add(savedSide === 'left' ? 'gadly-qn-anchor-left' : 'gadly-qn-anchor-right');

    } catch (e) {

        root.classList.add('gadly-qn-anchor-right');

    }



    /* Desktop: mai visibile finché il layout non è misurato (niente flash al refresh). */
    if (isDesktop()) {
        var shield = document.createElement('style');
        shield.id = 'drose-entry-boot-shield';
        shield.textContent =
            '@media (min-width:769px){' +
            'html:not(.drose-layout-ready) .drose-float-entry,' +
            '.drose-float-entry.is-layout-hidden{' +
            'display:none!important;visibility:hidden!important;opacity:0!important;pointer-events:none!important' +
            '}}';
        document.head.appendChild(shield);
    }

    /* Sempre pending: il JS misura lo spazio prima di mostrare il drone (niente flash al refresh). */
    root.classList.add('drose-layout-pending');



    try {

        var saved = sessionStorage.getItem(PROP_KEY);

        if (saved !== null) {

            var angle = ((parseFloat(saved) % 360) + 360) % 360;

            if (!isNaN(angle)) {

                var style = document.createElement('style');

                style.id = 'drose-propeller-boot';

                style.textContent =

                    '.drose-propeller-spin--cw{transform:rotate(' + angle + 'deg);transform-box:fill-box;transform-origin:center center}' +

                    '.drose-propeller-spin--ccw{transform:rotate(' + (-angle) + 'deg);transform-box:fill-box;transform-origin:center center}';

                document.head.appendChild(style);

            }

        }

    } catch (e) {

        /* ignore */

    }



    markReady();

})();


