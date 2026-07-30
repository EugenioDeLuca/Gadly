(function () {
    if (!document.body || !document.body.classList.contains("login-page")) return;

    /* Un solo SVG: occhio fisso + barra che compare/sparisce (niente salto verticale) */
    var ICON =
        '<svg class="login-password-toggle__icon" viewBox="0 0 24 24" width="22" height="22" aria-hidden="true" focusable="false">' +
        '<path class="login-password-toggle__eye" fill="currentColor" d="M12 5c-5 0-9.27 3.11-11 7.5C2.73 16.89 7 20 12 20s9.27-3.11 11-7.5C21.27 8.11 17 5 12 5zm0 12.5c-2.76 0-5-2.24-5-5s2.24-5 5-5 5 2.24 5 5-2.24 5-5 5zm0-8a3 3 0 100 6 3 3 0 000-6z"/>' +
        '<path class="login-password-toggle__slash" fill="none" stroke="currentColor" stroke-width="2.25" stroke-linecap="round" d="M4 4l16 16"/>' +
        "</svg>";

    function labelShow(btn) {
        return btn.getAttribute("data-label-show") || "Show password";
    }
    function labelHide(btn) {
        return btn.getAttribute("data-label-hide") || "Hide password";
    }

    function sync(btn, input) {
        var visible = input.type === "text";
        btn.classList.toggle("is-password-visible", visible);
        btn.setAttribute("aria-pressed", visible ? "true" : "false");
        btn.setAttribute("aria-label", visible ? labelHide(btn) : labelShow(btn));
    }

    function enhance(input) {
        if (!input || input.dataset.passwordToggleReady === "1") return;
        if (input.parentElement && input.parentElement.classList.contains("login-password-wrap")) {
            input.dataset.passwordToggleReady = "1";
            return;
        }

        var wrap = document.createElement("div");
        wrap.className = "login-password-wrap";
        input.parentNode.insertBefore(wrap, input);
        wrap.appendChild(input);

        var btn = document.createElement("button");
        btn.type = "button";
        btn.className = "login-password-toggle";
        btn.setAttribute("data-label-show", input.getAttribute("data-toggle-show") || "Show password");
        btn.setAttribute("data-label-hide", input.getAttribute("data-toggle-hide") || "Hide password");
        btn.innerHTML = ICON;
        wrap.appendChild(btn);

        btn.addEventListener("click", function (e) {
            e.preventDefault();
            input.type = input.type === "password" ? "text" : "password";
            sync(btn, input);
        });

        sync(btn, input);
        input.dataset.passwordToggleReady = "1";
    }

    document.querySelectorAll(".login-form input[type='password'].login-input").forEach(enhance);
})();
