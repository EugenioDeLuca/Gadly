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
        try {
            window.dispatchEvent(new Event("gadly-cookie-state-change"));
        } catch (eEv) { /* ignore */ }
    }

    function applyPromptState() {
        root.classList.remove("gadly-cookie-accepted");
        root.classList.add("gadly-cookie-prompt");
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

    function resetBannerTypography() {
        banner.style.removeProperty("font-size");
        banner.style.removeProperty("-webkit-text-size-adjust");
        banner.style.removeProperty("text-size-adjust");
        var p = banner.querySelector("p");
        if (p) {
            p.style.removeProperty("font-size");
            p.style.removeProperty("-webkit-text-size-adjust");
            p.style.removeProperty("text-size-adjust");
        }
        var acceptBtn = banner.querySelector(".cookie-banner-btn");
        if (acceptBtn) {
            acceptBtn.style.removeProperty("font-size");
            acceptBtn.style.removeProperty("-webkit-text-size-adjust");
            acceptBtn.style.removeProperty("text-size-adjust");
        }
    }

    window.addEventListener("orientationchange", function () {
        setTimeout(function () {
            syncFromStorage();
            resetBannerTypography();
        }, 120);
    });

    window.addEventListener("pageshow", function(ev) {
        if (!ev.persisted) return;
        syncFromStorage();
    });
})();
