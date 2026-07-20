/**
 * Header + footer nav links (desktop): keep hover pill while pointer is over the link,
 * including during/after click when :focus would otherwise flash the highlight off.
 */
(function () {
    "use strict";

    if (!window.matchMedia || !window.matchMedia("(min-width: 769px)").matches) {
        return;
    }

    var HOVER_CLASS = "is-nav-link-hover";
    var SELECTOR = ".site-header .header-link:not(.active), .footer-links a, .header-lang-btn, .header-actions .theme-toggle, .header-actions .warm-tone-toggle";

    function bindNavLink(link) {
        if (!link || link.dataset.navHoverBound === "1") {
            return;
        }
        link.dataset.navHoverBound = "1";

        link.addEventListener("mouseenter", function () {
            link.classList.add(HOVER_CLASS);
        });

        link.addEventListener("mouseleave", function () {
            link.classList.remove(HOVER_CLASS);
            if (typeof link.blur === "function") {
                link.blur();
            }
        });

        link.addEventListener("mousedown", function () {
            link.classList.add(HOVER_CLASS);
        });

        link.addEventListener("mouseup", function () {
            if (!link.matches(":hover")) {
                return;
            }
            link.classList.add(HOVER_CLASS);
            requestAnimationFrame(function () {
                if (!link.matches(":hover")) {
                    link.classList.remove(HOVER_CLASS);
                    return;
                }
                link.classList.add(HOVER_CLASS);
                if (typeof link.blur === "function") {
                    link.blur();
                }
            });
        });

        link.addEventListener("focus", function () {
            if (link.matches(":hover")) {
                link.classList.add(HOVER_CLASS);
            }
        });
    }

    function init() {
        document.querySelectorAll(SELECTOR).forEach(bindNavLink);
    }

    if (document.readyState === "loading") {
        document.addEventListener("DOMContentLoaded", init);
    } else {
        init();
    }
})();
