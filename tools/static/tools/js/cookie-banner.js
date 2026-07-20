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

    window.addEventListener("pageshow", function(ev) {
        if (!ev.persisted) return;
        syncFromStorage();
    });
})();
