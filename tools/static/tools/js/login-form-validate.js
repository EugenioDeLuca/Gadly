(function () {
    function isDark() {
        return !!(document.body && document.body.classList.contains("dark-mode"));
    }

    /* Light: giallo. Dark mobile = input grigi chiari → giallo invisibile, serve rosso pieno. */
    function flashStyle() {
        if (isDark()) {
            return {
                border: "4px solid #ff0000",
                bg: "#ff3b4d",
                outline: "5px solid #ff0000",
                shadow: "0 0 0 8px rgba(255, 0, 0, 0.85), 0 0 40px 8px rgba(255, 0, 0, 1)"
            };
        }
        return {
            border: "3px solid #ffea00",
            bg: "#ffe566",
            outline: "3px solid #ff9900",
            shadow: "0 0 0 4px rgba(255, 200, 0, 0.95), 0 0 18px rgba(255, 220, 0, 0.9)"
        };
    }

    function isEmpty(input) {
        return !input || !String(input.value || "").trim();
    }

    function killNativeValidation(form) {
        if (!form) return;
        form.setAttribute("novalidate", "novalidate");
        form.noValidate = true;
        form.querySelectorAll("input, select, textarea").forEach(function (el) {
            el.removeAttribute("required");
            el.removeAttribute("minlength");
            el.removeAttribute("pattern");
            if (typeof el.setCustomValidity === "function") {
                try {
                    el.setCustomValidity("");
                } catch (e) {}
            }
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

        form.querySelectorAll("input.login-input").forEach(function (input) {
            if (isEmpty(input)) {
                add(input);
                return;
            }
            if (input.id === "id_password1" && String(input.value).length < 12) add(input);
            if (input.type === "email") {
                var v = String(input.value).trim();
                if (v && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v)) add(input);
            }
        });

        var p1 = form.querySelector("#id_password1");
        var p2 = form.querySelector("#id_password2");
        if (p1 && p2 && !isEmpty(p1) && !isEmpty(p2) && p1.value !== p2.value) add(p2);
        return missing;
    }

    function setFlashOn(el) {
        var s = flashStyle();
        el.classList.add("login-input--flash");
        if (isDark()) el.classList.add("login-input--flash-dark");
        else el.classList.remove("login-input--flash-dark");
        el.style.setProperty("border", s.border, "important");
        el.style.setProperty("background", s.bg, "important");
        el.style.setProperty("background-color", s.bg, "important");
        el.style.setProperty("box-shadow", s.shadow, "important");
        el.style.setProperty("outline", s.outline, "important");
        el.style.setProperty("outline-offset", "2px", "important");
        el.style.setProperty("transition", "none", "important");
        var wrap = el.closest(".form-group");
        if (wrap) wrap.classList.add("login-field--flash");
    }

    function setFlashOff(el) {
        el.classList.remove("login-input--flash");
        el.classList.remove("login-input--flash-dark");
        el.style.removeProperty("border");
        el.style.removeProperty("background");
        el.style.removeProperty("background-color");
        el.style.removeProperty("box-shadow");
        el.style.removeProperty("outline");
        el.style.removeProperty("outline-offset");
        el.style.removeProperty("transition");
        var wrap = el.closest(".form-group");
        if (wrap) wrap.classList.remove("login-field--flash");
    }

    function flashBorder(inputs) {
        if (!inputs || !inputs.length) return;
        var n = 0;
        function pulseOn() {
            inputs.forEach(setFlashOn);
            window.setTimeout(pulseOff, 380);
        }
        function pulseOff() {
            inputs.forEach(setFlashOff);
            n += 1;
            if (n < 2) window.setTimeout(pulseOn, 180);
        }
        pulseOn();
    }

    function nativeSubmit(form) {
        killNativeValidation(form);
        if (typeof form.requestSubmit === "function") {
            form.requestSubmit();
            return;
        }
        var helper = document.createElement("button");
        helper.type = "submit";
        helper.hidden = true;
        helper.setAttribute("aria-hidden", "true");
        form.appendChild(helper);
        helper.click();
        form.removeChild(helper);
    }

    function blockAndFlash(form, ev) {
        killNativeValidation(form);
        var missing = collectInvalid(form);
        if (!missing.length) return false;
        if (ev) {
            ev.preventDefault();
            if (typeof ev.stopPropagation === "function") ev.stopPropagation();
            if (typeof ev.stopImmediatePropagation === "function") ev.stopImmediatePropagation();
        }
        try {
            if (document.activeElement && document.activeElement.blur) document.activeElement.blur();
        } catch (e) {}
        flashBorder(missing);
        return true;
    }

    function bindForm(form) {
        if (!form || form.dataset.gadlyFlashBound === "1") return;
        form.dataset.gadlyFlashBound = "1";
        killNativeValidation(form);

        form.addEventListener(
            "invalid",
            function (ev) {
                ev.preventDefault();
                if (typeof ev.stopPropagation === "function") ev.stopPropagation();
            },
            true
        );

        form.addEventListener(
            "submit",
            function (ev) {
                blockAndFlash(form, ev);
            },
            true
        );

        form.addEventListener("keydown", function (ev) {
            if (ev.key !== "Enter" && ev.keyCode !== 13) return;
            var t = ev.target;
            if (t && String(t.tagName || "").toLowerCase() === "textarea") return;
            if (blockAndFlash(form, ev)) return;
            ev.preventDefault();
            nativeSubmit(form);
        });

        var btn = form.querySelector("button.login-btn, button[type='submit'], button[type='button'].login-btn");
        if (!btn) return;

        btn.setAttribute("type", "button");

        function onActivate(ev) {
            if (blockAndFlash(form, ev)) return;
            nativeSubmit(form);
        }

        btn.addEventListener("click", onActivate, true);
    }

    function init() {
        document.querySelectorAll("form.login-form").forEach(bindForm);
    }

    if (document.readyState === "loading") {
        document.addEventListener("DOMContentLoaded", init);
    } else {
        init();
    }
    window.setTimeout(init, 0);
    window.setTimeout(init, 200);

    function setupCookieBanner() {
        if (!document.body || !document.body.classList.contains("login-page")) return;
        var banner = document.getElementById("cookie-banner");
        if (!banner || !window.visualViewport) return;
        function sync() {
            var vv = window.visualViewport;
            banner.classList.toggle("cookie-banner--keyboard-away", vv.height < window.innerHeight * 0.8);
        }
        window.visualViewport.addEventListener("resize", sync, { passive: true });
        window.visualViewport.addEventListener("scroll", sync, { passive: true });
        sync();
    }
    if (document.readyState === "loading") {
        document.addEventListener("DOMContentLoaded", setupCookieBanner);
    } else {
        setupCookieBanner();
    }
})();
