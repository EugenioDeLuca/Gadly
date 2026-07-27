(function() {
    var key = "gadly-cookies-accepted";
    var banner = document.getElementById("cookie-banner");
    var btn = document.getElementById("cookie-accept");
    if (!banner || !btn) return;

    var root = document.documentElement;

    function isOrientLocked() {
        return root.classList.contains("gadly-orient-locked") ||
            root.classList.contains("gadly-orient-settling");
    }

    function applyAcceptedState() {
        root.classList.add("gadly-cookie-accepted");
        root.classList.remove("gadly-cookie-prompt");
        root.classList.remove("gadly-cookie-banner-ready");
        banner.setAttribute("hidden", "");
        banner.classList.add("hidden");
    }

    function applyPromptState() {
        root.classList.remove("gadly-cookie-accepted");
        root.classList.add("gadly-cookie-prompt");
        /* Landscape lock: banner resta nascosto (niente FOUC font) */
        if (isOrientLocked()) {
            root.classList.remove("gadly-cookie-banner-ready");
            banner.setAttribute("hidden", "");
            banner.classList.add("hidden");
            return;
        }
        banner.removeAttribute("hidden");
        banner.classList.remove("hidden");
        root.classList.add("gadly-cookie-banner-ready");
    }

    function syncFromStorage() {
        var accepted = false;
        try {
            accepted = localStorage.getItem(key) === "1";
        } catch (e) {}
        if (accepted) {
            applyAcceptedState();
            return;
        }
        applyPromptState();
    }

    function wireAccept() {
        if (btn.dataset.gadlyCookieWired === "1") return;
        btn.dataset.gadlyCookieWired = "1";
        btn.addEventListener("click", function() {
            try {
                localStorage.setItem(key, "1");
            } catch (e) {}
            applyAcceptedState();
        });
    }

    syncFromStorage();
    wireAccept();

    window.addEventListener("orientationchange", function () {
        setTimeout(syncFromStorage, 50);
        setTimeout(syncFromStorage, 250);
    });
    window.addEventListener("resize", function () {
        syncFromStorage();
    }, { passive: true });
    window.addEventListener("gadly-orient-unlocked", function () {
        syncFromStorage();
    });

    window.addEventListener("pageshow", function(ev) {
        if (!ev.persisted) return;
        syncFromStorage();
    });
})();
