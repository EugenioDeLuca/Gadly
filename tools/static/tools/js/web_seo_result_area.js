/**
 * Meta Tag / Sitemap / Site Speed — stato area risultato su mobile.
 */
(function (global) {
    function clearResultChrome(el) {
        if (!el) return;
        el.style.removeProperty("border");
        el.style.removeProperty("border-width");
        el.style.removeProperty("border-style");
        el.style.removeProperty("background");
        el.style.removeProperty("background-color");
        el.style.removeProperty("box-shadow");
        el.style.removeProperty("border-radius");
    }

    function setLoadingChrome(el, on) {
        if (!el) return;
        if (on) {
            el.style.setProperty("border", "0", "important");
            el.style.setProperty("border-width", "0", "important");
            el.style.setProperty("border-style", "none", "important");
            el.style.setProperty("background", "transparent", "important");
            el.style.setProperty("background-color", "transparent", "important");
            el.style.setProperty("box-shadow", "none", "important");
            el.style.setProperty("border-radius", "0", "important");
        } else {
            clearResultChrome(el);
        }
    }

    global.gadlyWebSeoResultArea = {
        showLoading: function (el) {
            if (!el) return;
            el.classList.remove("hidden", "error", "has-result");
            el.classList.add("is-loading");
            setLoadingChrome(el, true);
            el.textContent = global.gettext ? global.gettext("Loading…") : "Loading…";
        },
        showError: function (el, message) {
            if (!el) return;
            el.classList.remove("hidden", "is-loading", "has-result");
            setLoadingChrome(el, false);
            el.classList.add("error");
            el.textContent = message;
        },
        showResult: function (el, html) {
            if (!el) return;
            el.classList.remove("hidden", "error", "is-loading");
            setLoadingChrome(el, false);
            el.classList.add("has-result");
            el.innerHTML = html;
        },
        showEmptyValidation: function (el, message) {
            if (!el) return;
            el.classList.remove("hidden", "is-loading", "has-result");
            setLoadingChrome(el, false);
            el.classList.add("error");
            el.textContent = message;
        },
        reveal: function (el) {
            if (!el) return;
            el.classList.remove("hidden");
            el.removeAttribute("hidden");
            el.removeAttribute("aria-hidden");
        }
    };
})(window);
