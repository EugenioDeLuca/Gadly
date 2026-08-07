(function () {
    if (!document.body || !document.body.classList.contains("login-page")) return;

    function isEmpty(input) {
        return !input || !String(input.value || "").trim();
    }

    function clearClientErrors(form) {
        form.querySelectorAll(".login-input.is-invalid, .login-input.login-input--flash").forEach(function (el) {
            el.classList.remove("is-invalid", "login-input--flash");
        });
    }

    function flashFields(inputs) {
        inputs.forEach(function (input) {
            if (!input) return;
            input.classList.remove("login-input--flash");
            void input.offsetWidth;
            input.classList.add("login-input--flash");
            input.addEventListener(
                "animationend",
                function () {
                    input.classList.remove("login-input--flash");
                    input.style.removeProperty("outline");
                    input.style.removeProperty("box-shadow");
                },
                { once: true }
            );
        });
    }

    function collectInvalid(form) {
        var missing = [];
        var seen = {};
        function add(input) {
            if (!input) return;
            var key = input.id || input.name || String(missing.length);
            if (seen[key]) return;
            seen[key] = true;
            missing.push(input);
        }

        /* Solo campi vuoti: non far lampeggiare email già compilata */
        form.querySelectorAll("input.login-input").forEach(function (input) {
            if (isEmpty(input)) {
                add(input);
                return;
            }
            /* Password troppo corta (< 12): lampeggia anche se non è vuota */
            if (input.id === "id_password1" && String(input.value).length < 12) add(input);
        });

        /* Se entrambe le password ci sono ma non coincidono, segnala solo conferma */
        var p1 = form.querySelector("#id_password1");
        var p2 = form.querySelector("#id_password2");
        if (p1 && p2 && !isEmpty(p1) && !isEmpty(p2) && p1.value !== p2.value) add(p2);
        return missing;
    }

    function bindForm(form) {
        if (!form || form.dataset.gadlyFlashBound === "1") return;
        form.dataset.gadlyFlashBound = "1";
        form.setAttribute("novalidate", "novalidate");
        form.noValidate = true;

        form.addEventListener("invalid", function (ev) {
            ev.preventDefault();
        }, true);

        form.addEventListener("submit", function (ev) {
            clearClientErrors(form);
            var missing = collectInvalid(form);
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
    }

    document.querySelectorAll("form.login-form").forEach(bindForm);

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
