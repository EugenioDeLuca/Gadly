/**
 * Home mobile — pill Drose: scale a ogni pressione (anche ripetute),
 * press prolungato non naviga.
 */
(function () {
    if (!window.matchMedia || !window.matchMedia("(max-width: 768px)").matches) {
        return;
    }

    var TAP_CLASS = "tap-active";
    var LONG_PRESS_MS = 380;
    var TAP_MIN_MS = 160;
    var link = document.querySelector(".home-drose-entry__link");
    if (!link) return;

    var pressStart = 0;
    var pressing = false;
    var suppressClick = false;
    var releaseTimer = null;
    var releaseRaf = null;
    /** Incrementa a ogni begin/end: invalida release in ritardo del tap precedente. */
    var scaleGen = 0;
    var useTouch = false;

    function clearReleaseScheduled() {
        if (releaseTimer) {
            clearTimeout(releaseTimer);
            releaseTimer = null;
        }
        if (releaseRaf != null) {
            cancelAnimationFrame(releaseRaf);
            releaseRaf = null;
        }
    }

    function applyScale() {
        link.classList.add(TAP_CLASS);
    }

    function clearScale() {
        link.classList.remove(TAP_CLASS);
    }

    function setScaled(on) {
        clearReleaseScheduled();
        var gen = ++scaleGen;
        if (on) {
            /* Forza restart: togli → reflow → applica (anche al 2°/3° tap). */
            clearScale();
            void link.offsetWidth;
            applyScale();
            return;
        }
        var elapsed = Date.now() - pressStart;
        var delay = Math.max(0, TAP_MIN_MS - elapsed);
        releaseTimer = setTimeout(function () {
            releaseTimer = null;
            releaseRaf = requestAnimationFrame(function () {
                releaseRaf = null;
                if (gen !== scaleGen) return;
                clearScale();
            });
        }, delay);
    }

    function beginPress() {
        pressStart = Date.now();
        pressing = true;
        suppressClick = false;
        setScaled(true);
    }

    function endPress(fromCancel) {
        if (!pressing) return;
        pressing = false;
        var held = Date.now() - pressStart;
        if (fromCancel || held >= LONG_PRESS_MS) {
            suppressClick = true;
        }
        setScaled(false);
    }

    link.addEventListener("touchstart", function (e) {
        if (e.touches.length !== 1) return;
        useTouch = true;
        beginPress();
    }, { passive: true });

    link.addEventListener("touchend", function () {
        if (!useTouch) return;
        endPress(false);
    }, { passive: true });

    link.addEventListener("touchcancel", function () {
        if (!useTouch) return;
        endPress(true);
    }, { passive: true });

    /* Solo se non ci sono touch events (alcuni WebView). */
    link.addEventListener("pointerdown", function (e) {
        if (e.pointerType === "mouse" || useTouch || pressing) return;
        beginPress();
    }, { passive: true });

    link.addEventListener("pointerup", function (e) {
        if (e.pointerType === "mouse" || useTouch) return;
        endPress(false);
    }, { passive: true });

    link.addEventListener("pointercancel", function (e) {
        if (e.pointerType === "mouse" || useTouch) return;
        endPress(true);
    }, { passive: true });

    link.addEventListener("click", function (e) {
        if (!suppressClick) return;
        e.preventDefault();
        e.stopPropagation();
        suppressClick = false;
    }, true);

    link.addEventListener("contextmenu", function (e) {
        e.preventDefault();
        suppressClick = true;
    });

    link.setAttribute("draggable", "false");
})();
