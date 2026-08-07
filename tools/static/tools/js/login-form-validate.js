(function () {
    if (!document.body || !document.body.classList.contains("login-page")) return;

    var form = document.querySelector(".login-form");
    if (!form) return;

    function clearClientErrors() {
        form.querySelectorAll(".login-input.is-invalid, .login-input.login-input--flash").forEach(function (el) {
            el.classList.remove("is-invalid", "login-input--flash");
        });
    }

    function flashFields(inputs) {
        inputs.forEach(function (input) {
            if (!input) return;
            input.classList.remove("login-input--flash");
            // reflow so the animation can restart
            void input.offsetWidth;
            input.classList.add("login-input--flash");
            input.addEventListener(
                "animationend",
                function () {
                    input.classList.remove("login-input--flash");
                },
                { once: true }
            );
        });
    }

    function isEmpty(input) {
        return !input || !String(input.value || "").trim();
    }

    form.setAttribute("novalidate", "novalidate");

    form.addEventListener("submit", function (ev) {
        clearClientErrors();
        var username = form.querySelector("#id_username");
        var password = form.querySelector("#id_password");
        var missing = [];
        if (isEmpty(username)) missing.push(username);
        if (isEmpty(password)) missing.push(password);
        if (!missing.length) return;

        ev.preventDefault();
        ev.stopPropagation();

        try {
            if (document.activeElement && typeof document.activeElement.blur === "function") {
                document.activeElement.blur();
            }
        } catch (e) {}

        flashFields(missing);
        return false;
    });

    /* Banner cookie: con tastiera iOS fixed-bottom sale in mezzo al form */
    var banner = document.getElementById("cookie-banner");
    if (!banner || !window.visualViewport) return;

    function syncBannerForKeyboard() {
        var vv = window.visualViewport;
        var keyboardLikely = vv.height < window.innerHeight * 0.8;
        banner.classList.toggle("cookie-banner--keyboard-away", keyboardLikely);
    }

    window.visualViewport.addEventListener("resize", syncBannerForKeyboard, { passive: true });
    window.visualViewport.addEventListener("scroll", syncBannerForKeyboard, { passive: true });
    window.addEventListener("focusin", function (ev) {
        if (ev.target && ev.target.classList && ev.target.classList.contains("login-input")) {
            setTimeout(syncBannerForKeyboard, 50);
        }
    });
    window.addEventListener("focusout", function () {
        setTimeout(syncBannerForKeyboard, 80);
    });
    syncBannerForKeyboard();
})();
