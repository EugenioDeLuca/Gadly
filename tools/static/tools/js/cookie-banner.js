(function() {
    var key = "gadly-cookies-accepted";
    var banner = document.getElementById("cookie-banner");
    var btn = document.getElementById("cookie-accept");
    if (!banner || !btn) return;

    var root = document.documentElement;

    function applyAcceptedState() {
        root.classList.add("gadly-cookie-accepted");
        root.classList.remove("gadly-cookie-prompt");
        banner.setAttribute("hidden", "");
        banner.classList.add("hidden");
    }

    function applyPromptState() {
        root.classList.remove("gadly-cookie-accepted");
        root.classList.add("gadly-cookie-prompt");
        /* In landscape lock l’overlay ha priorità: non forzare il banner in vista */
        if (root.classList.contains("gadly-orient-locked") ||
            root.classList.contains("gadly-orient-settling")) {
            banner.setAttribute("hidden", "");
            banner.classList.add("hidden");
            return;
        }
        banner.removeAttribute("hidden");
        banner.classList.remove("hidden");
    }

    function syncFromStorage() {
        var accepted = false;
        try {
            accepted = localStorage.getItem(key) === "1";
        } catch (e) {}
        if (accepted) {
            if (
                root.classList.contains("gadly-cookie-accepted") &&
                !root.classList.contains("gadly-cookie-prompt") &&
                banner.hasAttribute("hidden") &&
                banner.classList.contains("hidden")
            ) {
                return;
            }
            applyAcceptedState();
            return;
        }
        if (
            root.classList.contains("gadly-cookie-prompt") &&
            !root.classList.contains("gadly-cookie-accepted") &&
            !banner.hasAttribute("hidden") &&
            !banner.classList.contains("hidden")
        ) {
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

    function lockBannerTypography() {
        /* px fissi: dopo rotate iOS a volte gonfia rem/% sul banner */
        banner.style.setProperty("-webkit-text-size-adjust", "100%", "important");
        banner.style.setProperty("text-size-adjust", "100%", "important");
        var p = banner.querySelector("p");
        if (p) {
            p.style.setProperty("font-size", "14.4px", "important");
            p.style.setProperty("line-height", "1.4", "important");
            p.style.setProperty("-webkit-text-size-adjust", "100%", "important");
            p.style.setProperty("text-size-adjust", "100%", "important");
        }
        var acceptBtn = banner.querySelector(".cookie-banner-btn");
        if (acceptBtn) {
            acceptBtn.style.setProperty("font-size", "16px", "important");
            acceptBtn.style.setProperty("-webkit-text-size-adjust", "100%", "important");
            acceptBtn.style.setProperty("text-size-adjust", "100%", "important");
        }
    }

    function onOrientationSettle() {
        syncFromStorage();
        if (root.classList.contains("gadly-cookie-prompt") &&
            !root.classList.contains("gadly-cookie-accepted")) {
            lockBannerTypography();
        }
    }

    lockBannerTypography();

    window.addEventListener("orientationchange", function () {
        setTimeout(onOrientationSettle, 50);
        setTimeout(onOrientationSettle, 200);
        setTimeout(onOrientationSettle, 450);
    });
    window.addEventListener("resize", function () {
        if (window.matchMedia && window.matchMedia("(orientation: portrait)").matches) {
            onOrientationSettle();
        }
    }, { passive: true });
    window.addEventListener("gadly-orient-unlocked", function () {
        syncFromStorage();
        if (root.classList.contains("gadly-cookie-prompt") &&
            !root.classList.contains("gadly-cookie-accepted")) {
            banner.removeAttribute("hidden");
            banner.classList.remove("hidden");
            lockBannerTypography();
        }
    });

    window.addEventListener("pageshow", function(ev) {
        if (!ev.persisted) return;
        syncFromStorage();
        lockBannerTypography();
    });
})();
