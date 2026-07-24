/**
 * Mobile tap feedback (≤768px): stesso comportamento di CV Generator.
 * Classe tap-active + scale(0.96) solo mentre il dito è premuto (touch).
 */
(function () {
    if (!window.matchMedia || !window.matchMedia("(max-width: 768px)").matches) {
        return;
    }

    var tapClass = "tap-active";
    var tapSelector = [
        ".site-main button",
        ".site-main input[type=\"submit\"]",
        ".site-main input[type=\"button\"]",
        ".site-main .choose-file-btn",
        ".site-main .file-upload-btn",
        ".site-main .custom-select-trigger",
        ".site-main .text-tool-select-trigger",
        ".site-main .cv-target-role-native",
        ".site-main .chart-select-trigger",
        ".site-main .format-toggle",
        ".site-main [data-level]",
        ".site-main [data-template]",
        ".site-main [data-cv-lang]",
        ".site-main .role-arrow",
        ".site-main .text-tool-select-menu li",
        ".site-main .shortcuts-btn",
        ".site-main a.tool-btn",
        ".site-main .login-required-btn",
        ".site-main .btn",
        ".site-main .home-link-wrap .home-link"
    ].join(", ");
    var excludeSelector = [
        ".mobile-home-fab-link",
        ".home-drose-entry__link",
        ".header-menu-btn",
        ".interview-settings-toggle",
        ".split-preset-btn",
        ".qr-options .qr-custom-select .qr-select-trigger",
        "#qr-wifi-security-wrap > .qr-select-trigger",
        ".tool-quick-nav-toggle",
        ".tool-quick-nav-panel",
        ".header-nav",
        "#cv-score-tab-btn",
        ".cv-score-tab-btn",
        ".cv-score-tab-close",
        "#cv-target-role",
        "#cv-language-list .lang-level-select .text-tool-select-menu li",
        "#btn-copy.copy-disabled"
    ].join(", ");

    var tapPressTarget = null;
    var tapReleaseTimer = null;
    var tapPressStart = 0;
    /** Durata minima visibile: tap veloci altrimenti non ridisegnano scale prima del pointerup */
    var TAP_MIN_MS = 160;

    function forceBlur(target) {
        if (!target) return;
        try {
            target.blur();
        } catch (e) { /* ignore */ }
        try {
            if (document.activeElement && document.activeElement.blur) {
                document.activeElement.blur();
            }
        } catch (e2) { /* ignore */ }
    }

    function isHelpBackLink(el) {
        return !!(
            document.body &&
            document.body.classList.contains("help-page") &&
            el &&
            el.classList &&
            el.classList.contains("home-link") &&
            el.closest &&
            el.closest(".home-link-wrap")
        );
    }

    function setTapPressed(target, pressed) {
        if (!target || !target.classList) return;
        var smoothHelp = isHelpBackLink(target);
        if (pressed) {
            if (tapReleaseTimer) {
                clearTimeout(tapReleaseTimer);
                tapReleaseTimer = null;
            }
            if (tapPressTarget && tapPressTarget !== target) {
                tapPressTarget.classList.remove(tapClass);
            }
            tapPressTarget = target;
            tapPressStart = Date.now();
            if (smoothHelp) {
                /* Niente remove+reflow: lascia animare la transition CSS */
                target.classList.add(tapClass);
                return;
            }
            target.classList.remove(tapClass);
            void target.offsetWidth;
            target.classList.add(tapClass);
            void target.offsetWidth;
            return;
        }
        var elapsed = Date.now() - tapPressStart;
        var minMs = smoothHelp ? 0 : TAP_MIN_MS;
        var delay = Math.max(0, minMs - elapsed);
        var releaseTarget = target;
        tapReleaseTimer = setTimeout(function () {
            requestAnimationFrame(function () {
                if (releaseTarget && releaseTarget.classList) {
                    releaseTarget.classList.remove(tapClass);
                }
                if (tapPressTarget === releaseTarget) {
                    tapPressTarget = null;
                }
                tapReleaseTimer = null;
            });
        }, delay);
    }

    function resolveTapTarget(event) {
        if (!event.target || !event.target.closest) return null;
        if (document.body.classList.contains("homepage")) {
            if (document.documentElement.classList.contains("gadly-trash-drag-active")) {
                return null;
            }
            if (event.target.closest(
                ".tool-btn-wrap.gadly-trash-draggable a.tool-btn, .category-btn.gadly-trash-draggable"
            )) {
                return null;
            }
        }
        var target = event.target.closest(tapSelector);
        if (!target || target.closest(excludeSelector)) return null;
        if (document.body.classList.contains("json-formatter") && target.closest(".button-group")) {
            return null;
        }
        /* Ruolo target: tap sulla freccia → scale del wrap; tap sul testo → niente scale */
        if (document.body.classList.contains("cv-generator") && target.id === "cv-target-role") {
            return null;
        }
        if (target.classList && target.classList.contains("role-arrow")) {
            var roleWrap = target.closest("#cv-target-role-wrap");
            if (roleWrap) return roleWrap;
        }
        return target;
    }

    function setupNoFocusMobileControls() {
        document.querySelectorAll(tapSelector).forEach(function (el) {
            if (el.closest(excludeSelector)) return;
            try {
                el.style.webkitTapHighlightColor = "transparent";
                el.style.outline = "none";
                el.style.boxShadow = "none";
            } catch (e) { /* ignore */ }
        });
    }

    function scheduleClearFocus(event) {
        var target = resolveTapTarget(event);
        if (!target) return;
        setTimeout(function () {
            requestAnimationFrame(function () {
                forceBlur(target);
                setTimeout(function () {
                    forceBlur(target);
                }, 0);
            });
        }, TAP_MIN_MS);
    }

    document.addEventListener("pointerdown", function (event) {
        if (event.pointerType === "mouse") return;
        var target = resolveTapTarget(event);
        if (!target) return;
        setTapPressed(target, true);
    }, { passive: true });

    function releaseTapPress(event) {
        if (document.documentElement.classList.contains("gadly-trash-mobile-press") ||
            document.documentElement.classList.contains("gadly-trash-drag-active")) {
            return;
        }
        if (tapPressTarget && tapPressTarget.classList.contains("gadly-trash-holding")) {
            return;
        }
        var target = resolveTapTarget(event);
        if (target) {
            setTapPressed(target, false);
        } else if (tapPressTarget) {
            setTapPressed(tapPressTarget, false);
        }
    }

    document.addEventListener("pointerup", releaseTapPress, { passive: true });
    document.addEventListener("pointercancel", releaseTapPress, { passive: true });
    document.addEventListener("pointerup", scheduleClearFocus, { passive: true });
    document.addEventListener("click", scheduleClearFocus);
    document.addEventListener("focusin", function (event) {
        var target = resolveTapTarget(event);
        if (!target) return;
        setTimeout(function () {
            forceBlur(target);
        }, 0);
    });

    /* Help: bottone "Torna al tool" — anima press+release fluidi, poi naviga */
    var HELP_NAV_HOLD_MS = 220;
    var HELP_NAV_RELEASE_MS = 220;
    document.addEventListener("click", function (event) {
        if (!document.body || !document.body.classList.contains("help-page")) return;
        if (!event.target || !event.target.closest) return;
        var link = event.target.closest(".site-main .home-link-wrap a.home-link");
        if (!link) return;
        var href = link.getAttribute("href");
        if (!href || href.charAt(0) === "#") return;
        if (link.getAttribute("data-gadly-help-nav") === "1") return;

        event.preventDefault();
        if (typeof event.stopImmediatePropagation === "function") {
            event.stopImmediatePropagation();
        }

        /* Tiene premuto (annulla release di pointerup) finché l’animazione è completa */
        setTapPressed(link, true);
        var elapsed = Date.now() - tapPressStart;
        var waitHold = Math.max(80, HELP_NAV_HOLD_MS - elapsed);
        setTimeout(function () {
            setTapPressed(link, false);
            setTimeout(function () {
                link.setAttribute("data-gadly-help-nav", "1");
                window.location.href = link.href;
            }, HELP_NAV_RELEASE_MS);
        }, waitHold);
    }, true);

    setupNoFocusMobileControls();
    setInterval(setupNoFocusMobileControls, 1000);
})();
