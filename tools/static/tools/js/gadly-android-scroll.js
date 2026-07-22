(function () {
    "use strict";

    function isCoarseMobile() {
        return !!(window.matchMedia && window.matchMedia("(max-width: 768px)").matches);
    }

    function isIOSMobile() {
        var ua = navigator.userAgent || "";
        return (
            /iPad|iPhone|iPod/i.test(ua) ||
            (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1)
        );
    }

    function shouldUseAndroidScroll() {
        return isCoarseMobile() && !isIOSMobile();
    }

    function rootEl() {
        return document.documentElement;
    }

    function scrollLocked() {
        var root = rootEl();
        var nav = document.getElementById("header-nav");
        if (!root) return true;
        if (nav && nav.classList.contains("is-open")) return true;
        if (root.classList.contains("nav-open")) return true;
        if (root.classList.contains("gadly-trash-scroll-lock")) return true;
        if (root.classList.contains("gadly-scroll-restore-pending")) return true;
        if (root.classList.contains("gadly-cl-scroll-pending")) return true;
        return false;
    }

    function readScrollY() {
        var body = document.body;
        return Math.max(
            0,
            window.scrollY ||
                rootEl().scrollTop ||
                (body ? body.scrollTop : 0) ||
                0
        );
    }

    function maxScrollY() {
        var root = rootEl();
        var body = document.body;
        var height = Math.max(
            root.scrollHeight || 0,
            root.offsetHeight || 0,
            body ? body.scrollHeight : 0,
            body ? body.offsetHeight : 0
        );
        return Math.max(0, height - window.innerHeight);
    }

    function writeScrollY(y) {
        var top = Math.max(0, Math.min(maxScrollY(), y));
        window.scrollTo(0, top);
        rootEl().scrollTop = top;
        if (document.body) document.body.scrollTop = top;
        return top;
    }

    function unlockScrollChrome() {
        var root = rootEl();
        var body = document.body;
        if (!root) return;
        root.classList.remove(
            "nav-open",
            "gadly-trash-scroll-lock",
            "gadly-trash-mobile-press",
            "gadly-trash-drag-active",
            "gadly-scroll-restore-pending",
            "gadly-cl-scroll-pending"
        );
        root.style.removeProperty("height");
        root.style.removeProperty("min-height");
        root.style.removeProperty("overflow");
        root.style.removeProperty("touch-action");
        if (!body) return;
        body.classList.remove("nav-open", "nav-closing");
        body.style.removeProperty("overflow");
        body.style.removeProperty("touch-action");
        body.style.removeProperty("position");
        body.style.removeProperty("top");
        body.style.removeProperty("left");
        body.style.removeProperty("right");
        body.style.removeProperty("width");
    }

    function isNestedScroller(target) {
        if (!target || !target.closest) return false;
        if (target.closest(
            ".header-nav.is-open, textarea, select, [contenteditable='true'], " +
            ".mobile-home-fab, .gadly-trash-drag-shield, .gadly-trash-draggable, " +
            ".tool-quick-nav-panel, .cookie-banner"
        )) {
            return true;
        }
        var node = target;
        while (node && node !== document.body && node !== document.documentElement) {
            try {
                var style = window.getComputedStyle(node);
                var oy = style.overflowY;
                if ((oy === "auto" || oy === "scroll" || oy === "overlay") &&
                    node.scrollHeight > node.clientHeight + 2) {
                    return true;
                }
            } catch (eStyle) { /* ignore */ }
            node = node.parentElement;
        }
        return false;
    }

    function bootAndroidScroll() {
        if (!shouldUseAndroidScroll()) return;
        rootEl().classList.add("gadly-android-scroll");
        unlockScrollChrome();
    }

    function setupTouchScrollShim() {
        if (!shouldUseAndroidScroll()) return;

        var active = false;
        var startY = 0;
        var startScroll = 0;

        document.addEventListener("touchstart", function (event) {
            if (scrollLocked() || !event.touches || event.touches.length !== 1) return;
            if (isNestedScroller(event.target)) return;
            active = true;
            startY = event.touches[0].clientY;
            startScroll = readScrollY();
        }, { passive: true, capture: true });

        document.addEventListener("touchmove", function (event) {
            if (!active || scrollLocked() || !event.touches || event.touches.length !== 1) return;
            if (maxScrollY() < 1) return;
            var dy = startY - event.touches[0].clientY;
            if (Math.abs(dy) < 2) return;
            writeScrollY(startScroll + dy);
        }, { passive: true, capture: true });

        function endTouch() {
            active = false;
        }
        document.addEventListener("touchend", endTouch, { passive: true, capture: true });
        document.addEventListener("touchcancel", endTouch, { passive: true, capture: true });
    }

    bootAndroidScroll();
    if (document.readyState === "loading") {
        document.addEventListener("DOMContentLoaded", function () {
            bootAndroidScroll();
            setupTouchScrollShim();
        }, { once: true });
    } else {
        bootAndroidScroll();
        setupTouchScrollShim();
    }
    window.addEventListener("pageshow", bootAndroidScroll);
    window.__gadlyBootAndroidScroll = bootAndroidScroll;
})();
