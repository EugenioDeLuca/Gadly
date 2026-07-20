/**
 * Drose desktop: reliable hover on every interactive element in main content.
 * Delegated listeners + is-drose-hover class (same idea as nav-link-hover-lock).
 * Brief hold on mouseleave so fast pointer passes still show feedback.
 */
(function () {
    "use strict";

    var HOVER_CLASS = "is-drose-hover";
    var HOLD_MS = 70;
    var ROOT_SEL = ".site-main";
    var INTERACTIVE_SEL = [
        "a[href]",
        "button",
        "input[type=\"submit\"]",
        "input[type=\"button\"]",
        ".text-tool-select-trigger",
        ".text-tool-select-menu li",
        ".drose-quote-staff-menu__trigger",
        ".drose-quote-staff-menu__item",
        ".drose-works-open",
        ".drose-works-lightbox__close",
        ".drose-works-lightbox__nav",
        "label[for]",
        ".drose-card--service"
    ].join(", ");
    var EXCLUDE_SEL = [
        ".drose-hero__logo-hit",
        ".drose-hero__logo",
        ".header-nav",
        ".header-actions",
        ".mobile-home-fab",
        ".cookie-banner",
        "[disabled]",
        "[aria-disabled=\"true\"]"
    ].join(", ");

    var desktop = window.matchMedia("(min-width: 769px)");
    var finePointer = window.matchMedia("(hover: hover) and (pointer: fine)");
    var holdTimers = typeof WeakMap !== "undefined" ? new WeakMap() : null;
    var fallbackTimers = new Map();

    function isDrose() {
        return document.body.classList.contains("drose-page") ||
            document.body.classList.contains("is-drose-brand");
    }

    function activeMedia() {
        return desktop.matches && finePointer.matches;
    }

    function clearHold(el) {
        if (!el) {
            return;
        }
        if (holdTimers) {
            var t = holdTimers.get(el);
            if (t) {
                window.clearTimeout(t);
                holdTimers.delete(el);
            }
            return;
        }
        var id = fallbackTimers.get(el);
        if (id) {
            window.clearTimeout(id);
            fallbackTimers.delete(el);
        }
    }

    function setHold(el, fn) {
        clearHold(el);
        var id = window.setTimeout(fn, HOLD_MS);
        if (holdTimers) {
            holdTimers.set(el, id);
        } else {
            fallbackTimers.set(el, id);
        }
    }

    function resolveInteractive(target) {
        if (!target || !target.closest || !isDrose() || !activeMedia()) {
            return null;
        }
        var root = target.closest(ROOT_SEL);
        if (!root) {
            return null;
        }
        var el = target.closest(INTERACTIVE_SEL);
        if (!el || !root.contains(el)) {
            return null;
        }
        if (el.closest(EXCLUDE_SEL)) {
            return null;
        }
        if (el.disabled || el.getAttribute("aria-disabled") === "true") {
            return null;
        }
        if (el.matches(".drose-btn")) {
            return null;
        }
        if (
            el.matches("a[href]") &&
            !el.classList.contains("drose-btn") &&
            !el.classList.contains("drose-quote-staff-menu__item") &&
            (
                el.closest(".drose-landing__container") ||
                el.closest(".static-container") ||
                el.closest(".faq-container") ||
                el.classList.contains("drose-quote-trash-home-link")
            )
        ) {
            return null;
        }
        return el;
    }

    function activate(el) {
        clearHold(el);
        el.classList.add(HOVER_CLASS);
    }

    function deactivate(el) {
        clearHold(el);
        /* Service cards: leave immediately so exit animation is one smooth step */
        var hold = el.classList.contains("drose-card--service") ? 0 : HOLD_MS;
        if (hold <= 0) {
            el.classList.remove(HOVER_CLASS);
            if (typeof el.blur === "function") {
                el.blur();
            }
            return;
        }
        setHold(el, function () {
            el.classList.remove(HOVER_CLASS);
            clearHold(el);
            if (typeof el.blur === "function") {
                el.blur();
            }
        });
    }

    function onPointerOver(event) {
        var el = resolveInteractive(event.target);
        if (!el) {
            return;
        }
        activate(el);
    }

    function onPointerOut(event) {
        var el = resolveInteractive(event.target);
        if (!el) {
            return;
        }
        var rel = event.relatedTarget;
        if (rel && el.contains(rel)) {
            return;
        }
        deactivate(el);
    }

    function onPointerDown(event) {
        var el = resolveInteractive(event.target);
        if (!el) {
            return;
        }
        activate(el);
    }

    function onPointerUp(event) {
        var el = resolveInteractive(event.target);
        if (!el) {
            return;
        }
        if (!el.matches(":hover")) {
            return;
        }
        activate(el);
    }

    function bindRoot() {
        if (!isDrose() || !activeMedia()) {
            return;
        }
        document.querySelectorAll(ROOT_SEL + " " + INTERACTIVE_SEL).forEach(function (el) {
            if (!el.closest(EXCLUDE_SEL) && !el.disabled) {
                el.classList.remove(HOVER_CLASS);
            }
        });
    }

    function init() {
        if (!isDrose()) {
            return;
        }
        document.addEventListener("pointerover", onPointerOver, true);
        document.addEventListener("pointerout", onPointerOut, true);
        document.addEventListener("pointerdown", onPointerDown, true);
        document.addEventListener("pointerup", onPointerUp, true);
        bindRoot();
    }

    desktop.addEventListener("change", bindRoot);
    finePointer.addEventListener("change", bindRoot);

    /* Mobile home: tap sulla card servizi = mostra descrizione (come hover desktop). */
    function initMobileServiceCardTap() {
        if (!document.body.classList.contains("drose-home")) {
            return;
        }
        var mobile = window.matchMedia("(max-width: 768px)");

        document.addEventListener("click", function (event) {
            if (!mobile.matches) return;
            var card = event.target && event.target.closest
                ? event.target.closest(".drose-card--service")
                : null;
            if (!card || !document.body.contains(card)) {
                document.querySelectorAll(".drose-card--service." + HOVER_CLASS).forEach(function (el) {
                    el.classList.remove(HOVER_CLASS);
                });
                return;
            }
            var open = card.classList.contains(HOVER_CLASS);
            document.querySelectorAll(".drose-card--service." + HOVER_CLASS).forEach(function (el) {
                if (el !== card) el.classList.remove(HOVER_CLASS);
            });
            if (open) {
                card.classList.remove(HOVER_CLASS);
            } else {
                card.classList.add(HOVER_CLASS);
            }
        });
    }

    if (document.readyState === "loading") {
        document.addEventListener("DOMContentLoaded", function () {
            init();
            initMobileServiceCardTap();
        }, { once: true });
    } else {
        init();
        initMobileServiceCardTap();
    }
})();
