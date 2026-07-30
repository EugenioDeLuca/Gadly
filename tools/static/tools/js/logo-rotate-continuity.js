/**
 * Gadly header logo: keep logo-slow-rotate phase across refresh (22s loop).
 * Uses a wall-clock anchor in sessionStorage (no getAnimations on pagehide).
 */
(function () {
    var ANCHOR_KEY = "gadly-logo-rotate-anchor-v1";
    var DURATION = 22;

    function currentPhase() {
        if (typeof window.__gadlyLogoRotatePhase === "number" && !isNaN(window.__gadlyLogoRotatePhase)) {
            return window.__gadlyLogoRotatePhase;
        }
        try {
            if (!sessionStorage.getItem(ANCHOR_KEY)) {
                sessionStorage.setItem(ANCHOR_KEY, String(Date.now()));
            }
            var start = parseInt(sessionStorage.getItem(ANCHOR_KEY), 10);
            if (isNaN(start)) return 0;
            return ((Date.now() - start) / 1000) % DURATION;
        } catch (e) {
            return 0;
        }
    }

    function gadlyLogoIcons() {
        var logo = document.querySelector(".header-logo:not(.header-logo--drose)");
        if (!logo) return [];
        return logo.querySelectorAll(".header-logo-icon");
    }

    function applyLogoRotation() {
        var phase = currentPhase();
        var animValue = "logo-slow-rotate 22s linear " + (-phase) + "s infinite";
        gadlyLogoIcons().forEach(function (icon) {
            icon.style.setProperty("animation", animValue, "important");
            icon.style.setProperty("transform-origin", "center", "important");
        });
    }

    function scheduleApply() {
        applyLogoRotation();
        requestAnimationFrame(applyLogoRotation);
    }

    scheduleApply();
    document.addEventListener("DOMContentLoaded", scheduleApply, { once: true });
    window.addEventListener("load", applyLogoRotation, { once: true });
    window.addEventListener("gadly-orient-unlocked", scheduleApply);
})();
