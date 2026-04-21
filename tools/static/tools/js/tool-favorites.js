(function () {
    "use strict";

    if (!document.body || !document.body.classList.contains("text-tools-page")) return;

    var userAuthenticated = window.GADLY_USER_AUTHENTICATED === true;
    var storageSuffix = window.GADLY_USER_STORAGE_KEY || "anon";
    var favKey = "gadly-favorites:" + storageSuffix;

    function getFavorites() {
        try {
            return JSON.parse(localStorage.getItem(favKey) || "[]");
        } catch (e) {
            return [];
        }
    }

    function setFavorites(arr) {
        localStorage.setItem(favKey, JSON.stringify(arr));
    }

    function ensureLoginModal() {
        var existing = document.getElementById("login-required-modal");
        if (existing) return existing;
        var loginUrl = "/accounts/login/?next=" + encodeURIComponent(window.location.pathname);
        var wrapper = document.createElement("div");
        wrapper.id = "login-required-modal";
        wrapper.className = "login-required-modal";
        wrapper.setAttribute("role", "dialog");
        wrapper.setAttribute("aria-modal", "true");
        wrapper.innerHTML =
            '<div class="login-required-backdrop"></div>' +
            '<div class="login-required-box">' +
            '<p class="login-required-text">' + gettext("You cannot use this feature. Please log in.") + "</p>" +
            '<div class="login-required-buttons">' +
            '<a class="login-required-btn" href="' + loginUrl + '">' + gettext("Log in") + "</a>" +
            '<button type="button" class="login-required-btn login-required-btn--close">' + gettext("Close") + "</button>" +
            "</div></div>";
        document.body.appendChild(wrapper);
        var closeBtn = wrapper.querySelector(".login-required-btn--close");
        var backdrop = wrapper.querySelector(".login-required-backdrop");
        function closeModal() {
            wrapper.style.display = "none";
        }
        if (closeBtn) closeBtn.addEventListener("click", closeModal);
        if (backdrop) backdrop.addEventListener("click", closeModal);
        return wrapper;
    }

    function updateStarIcons() {
        var favs = userAuthenticated ? getFavorites() : [];
        document.querySelectorAll(".text-tools-page .tool-btn-wrap").forEach(function (wrap) {
            var a = wrap.querySelector("a.tool-btn");
            var star = wrap.querySelector(".tool-fav");
            if (!a || !star) return;
            var url = a.getAttribute("href");
            var isFav = favs.indexOf(url) >= 0;
            star.textContent = isFav ? "★" : "☆";
            star.classList.toggle("is-favorite", isFav);
        });
    }

    function toggleFavorite(url) {
        var favs = getFavorites();
        var i = favs.indexOf(url);
        if (i >= 0) favs.splice(i, 1);
        else favs.push(url);
        setFavorites(favs);
        updateStarIcons();
    }

    document.querySelectorAll(".text-tools-page .tool-btn-wrap").forEach(function (wrap) {
        var a = wrap.querySelector("a.tool-btn");
        if (!a || wrap.querySelector(".tool-fav")) return;
        var star = document.createElement("button");
        star.type = "button";
        star.className = "tool-fav";
        star.title = gettext("Add to favorites");
        star.setAttribute("aria-label", gettext("Favorite"));
        star.textContent = "☆";
        star.addEventListener("click", function (e) {
            e.preventDefault();
            e.stopPropagation();
            if (!userAuthenticated) {
                ensureLoginModal().style.display = "flex";
                return;
            }
            var url = a.getAttribute("href");
            if (url) toggleFavorite(url);
        });
        wrap.appendChild(star);
    });

    updateStarIcons();
})();
