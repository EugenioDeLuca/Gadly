(function () {
    if (!document.body || !document.body.classList.contains("login-page")) return;

    var form = document.querySelector(".login-form");
    if (!form) return;

    var msgRequired =
        form.getAttribute("data-msg-required") || "Please fill in this field.";

    function clearClientErrors() {
        form.querySelectorAll(".field-error[data-client-error='1']").forEach(function (el) {
            el.remove();
        });
        form.querySelectorAll(".login-input.is-invalid").forEach(function (el) {
            el.classList.remove("is-invalid");
        });
    }

    function showFieldError(input, message) {
        if (!input) return;
        input.classList.add("is-invalid");
        var group = input.closest(".form-group") || input.parentElement;
        if (!group) return;
        var existing = group.querySelector(".field-error[data-client-error='1']");
        if (existing) {
            existing.textContent = message;
            return;
        }
        var span = document.createElement("span");
        span.className = "field-error";
        span.setAttribute("data-client-error", "1");
        span.setAttribute("role", "alert");
        span.textContent = message;
        group.appendChild(span);
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

        // Chiudi tastiera / evita scroll del browser sul campo invalid
        try {
            if (document.activeElement && typeof document.activeElement.blur === "function") {
                document.activeElement.blur();
            }
        } catch (e) {}

        missing.forEach(function (input) {
            showFieldError(input, msgRequired);
        });

        // Non fare focus: su mobile apre tastiera e alza pagina + banner cookie
        return false;
    });

    form.querySelectorAll(".login-input").forEach(function (input) {
        input.addEventListener("input", function () {
            if (!isEmpty(input)) {
                input.classList.remove("is-invalid");
                var group = input.closest(".form-group");
                if (group) {
                    var err = group.querySelector(".field-error[data-client-error='1']");
                    if (err) err.remove();
                }
            }
        });
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
