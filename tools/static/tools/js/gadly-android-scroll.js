(function () {
    "use strict";

    var SCROLL_START_PX = 8;

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

    function isAndroidMobile() {
        return isCoarseMobile() && !isIOSMobile();
    }

    function rootEl() {
        return document.documentElement;
    }

    function menuIsOpen() {
        var nav = document.getElementById("header-nav");
        return !!(nav && nav.classList.contains("is-open"));
    }

    /* Solo lock “duri”: menu aperto o drag cestino attivo — NON il solo press su un bottone. */
    function scrollLocked() {
        if (menuIsOpen()) return true;
        var root = rootEl();
        if (!root) return true;
        if (root.classList.contains("nav-open")) return true;
        if (root.classList.contains("gadly-trash-scroll-lock")) return true;
        if (root.classList.contains("gadly-trash-drag-active")) return true;
        if (root.classList.contains("gadly-scroll-restore-pending")) return true;
        if (root.classList.contains("gadly-cl-scroll-pending")) return true;
        return false;
    }

    function readScrollY() {
        return Math.max(
            0,
            window.pageYOffset ||
                window.scrollY ||
                rootEl().scrollTop ||
                (document.body && document.body.scrollTop) ||
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
            body ? body.offsetHeight : 0,
            body ? body.clientHeight : 0
        );
        return Math.max(0, height - (window.innerHeight || root.clientHeight || 0));
    }

    function writeScrollY(y) {
        var top = Math.max(0, Math.min(maxScrollY(), y));
        try {
            window.scrollTo(0, top);
        } catch (eScroll) { /* ignore */ }
        rootEl().scrollTop = top;
        if (document.body) document.body.scrollTop = top;
        return top;
    }

    function clearInlineScrollBlocks() {
        var root = rootEl();
        var body = document.body;
        if (!root) return;
        if (!menuIsOpen()) {
            root.classList.remove("nav-open");
            if (body) body.classList.remove("nav-open", "nav-closing");
            var scrim = document.getElementById("gadly-nav-scrim");
            if (scrim) scrim.classList.remove("is-active");
        }
        root.classList.remove("gadly-scroll-restore-pending", "gadly-cl-scroll-pending");
        root.style.removeProperty("height");
        root.style.removeProperty("min-height");
        root.style.removeProperty("overflow");
        root.style.removeProperty("overflow-x");
        root.style.removeProperty("overflow-y");
        root.style.removeProperty("touch-action");
        root.style.removeProperty("position");
        if (!body) return;
        body.style.removeProperty("overflow");
        body.style.removeProperty("overflow-x");
        body.style.removeProperty("overflow-y");
        body.style.removeProperty("touch-action");
        body.style.removeProperty("position");
        body.style.removeProperty("top");
        body.style.removeProperty("left");
        body.style.removeProperty("right");
        body.style.removeProperty("width");
        body.style.removeProperty("height");
    }

    function bootUnlock() {
        var root = rootEl();
        if (!root) return;
        clearInlineScrollBlocks();
        if (!menuIsOpen() && !root.classList.contains("gadly-trash-drag-active")) {
            root.classList.remove(
                "gadly-trash-scroll-lock",
                "gadly-trash-mobile-press",
                "gadly-trash-drag-active"
            );
        }
    }

    function cancelSoftButtonPress() {
        var root = rootEl();
        if (typeof window.__gadlyCancelMobileTrashTouch === "function") {
            try {
                window.__gadlyCancelMobileTrashTouch();
            } catch (eCancel) { /* ignore */ }
        }
        if (root) {
            root.classList.remove("gadly-trash-mobile-press");
        }
    }

    function isInteractiveIgnore(target) {
        if (!target || !target.closest) return false;
        return !!target.closest(
            "textarea, select, input:not([type='button']):not([type='submit']), " +
            "[contenteditable='true'], " +
            ".header-nav.is-open, .mobile-home-fab, .mobile-home-fab-link, " +
            ".gadly-trash-drag-shield, .tool-quick-nav-panel, " +
            "#gadly-nav-scrim.is-active"
        );
    }

    function bootAndroidScroll() {
        if (!isAndroidMobile()) return;
        rootEl().classList.add("gadly-android-scroll");
        bootUnlock();
    }

    function setupTouchScrollShim() {
        if (!isAndroidMobile()) return;

        var active = false;
        var startY = 0;
        var startScroll = 0;
        var scrolling = false;

        document.addEventListener("touchstart", function (event) {
            clearInlineScrollBlocks();
            if (scrollLocked() || !event.touches || event.touches.length !== 1) {
                active = false;
                scrolling = false;
                return;
            }
            if (isInteractiveIgnore(event.target)) {
                active = false;
                scrolling = false;
                return;
            }
            active = true;
            scrolling = false;
            startY = event.touches[0].clientY;
            startScroll = readScrollY();
        }, { passive: true, capture: true });

        document.addEventListener("touchmove", function (event) {
            if (!active || scrollLocked() || !event.touches || event.touches.length !== 1) return;
            var maxY = maxScrollY();
            if (maxY < 1) return;

            var y = event.touches[0].clientY;
            var dy = startY - y;
            if (Math.abs(dy) < SCROLL_START_PX && !scrolling) return;

            if (!scrolling) {
                scrolling = true;
                cancelSoftButtonPress();
            }

            writeScrollY(startScroll + dy);

            if (event.cancelable) {
                event.preventDefault();
            }
        }, { passive: false, capture: true });

        function endTouch() {
            active = false;
            scrolling = false;
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
    window.addEventListener("pageshow", function () {
        bootAndroidScroll();
    });
    window.__gadlyBootAndroidScroll = bootAndroidScroll;
})();
