(function () {
    var form = document.getElementById("account-profile-form");
    if (!form) return;

    var flashSlot = document.getElementById("account-flash-slot");
    var saveBtn = form.querySelector('button[type="submit"]');
    var usernameInput = document.getElementById("id_username");
    var emailInput = document.getElementById("id_email");
    var pendingNoteId = "account-pending-email-note";
    var flashHideTimer = null;
    var flashRemoveTimer = null;

    function getCsrfToken() {
        var input = form.querySelector('input[name="csrfmiddlewaretoken"]');
        return input ? input.value : "";
    }

    function clearFieldErrors() {
        form.querySelectorAll(".field-error").forEach(function (el) {
            el.remove();
        });
    }

    function showFieldError(fieldName, message) {
        var input = fieldName === "_all" ? null : document.getElementById("id_" + fieldName);
        var host = input ? input.closest(".form-group") : form;
        if (!host) return;
        var span = document.createElement("span");
        span.className = "field-error";
        span.textContent = message;
        host.appendChild(span);
    }

    function applyErrors(errors) {
        clearFieldErrors();
        if (!errors) return;
        Object.keys(errors).forEach(function (field) {
            var messages = errors[field];
            if (!messages || !messages.length) return;
            showFieldError(field, messages[0]);
        });
    }

    function hideFlashMessage() {
        if (!flashSlot) return;
        var msg = flashSlot.querySelector("#account-profile-saved-msg");
        if (!msg) return;
        msg.classList.add("account-avatar-removed-msg--hide");
        window.setTimeout(function () {
            msg.hidden = true;
        }, 350);
    }

    function showFlashMessage(message) {
        if (!flashSlot) return;
        if (flashHideTimer) window.clearTimeout(flashHideTimer);
        if (flashRemoveTimer) window.clearTimeout(flashRemoveTimer);

        flashSlot.innerHTML = "";
        var node = document.createElement("div");
        node.className = "account-msg account-msg--ok";
        node.id = "account-profile-saved-msg";
        node.setAttribute("role", "status");
        node.textContent = message;
        flashSlot.appendChild(node);

        flashHideTimer = window.setTimeout(function () {
            hideFlashMessage();
        }, 2500);
    }

    function updateHeaderInitials(initials) {
        document.querySelectorAll(".header-avatar-initials").forEach(function (el) {
            el.textContent = initials;
        });
    }

    function updatePendingEmailNote(pendingEmail, currentEmail) {
        var existing = document.getElementById(pendingNoteId);
        if (!pendingEmail) {
            if (existing) existing.remove();
            return;
        }
        var tpl = form.getAttribute("data-pending-email-tpl") || "";
        var text = tpl
            .replace("%(pending)s", pendingEmail)
            .replace("%(current)s", currentEmail || "");
        if (!existing) {
            existing = document.createElement("p");
            existing.className = "account-pending-email-note";
            existing.id = pendingNoteId;
            if (emailInput && emailInput.parentNode) {
                emailInput.parentNode.insertBefore(existing, emailInput.nextSibling);
            }
        }
        existing.textContent = text;
    }

    form.addEventListener("submit", function (event) {
        event.preventDefault();
        if (saveBtn) saveBtn.disabled = true;

        var body = new FormData(form);
        fetch(form.getAttribute("action") || window.location.href, {
            method: "POST",
            body: body,
            credentials: "same-origin",
            headers: {
                "X-Gadly-Profile-Ajax": "1",
                "X-CSRFToken": getCsrfToken(),
            },
        })
            .then(function (response) {
                return response.json().then(function (data) {
                    return { ok: response.ok, data: data };
                });
            })
            .then(function (result) {
                var data = result.data || {};
                if (data.redirect) {
                    window.location.href = data.redirect;
                    return;
                }
                if (data.ok) {
                    clearFieldErrors();
                    if (data.username && usernameInput) {
                        usernameInput.value = data.username;
                    }
                    if (data.email && emailInput) {
                        emailInput.value = data.email;
                    }
                    if (data.initials) {
                        updateHeaderInitials(data.initials);
                    }
                    updatePendingEmailNote(data.pending_email || "", data.email || "");
                    showFlashMessage(data.message || "Profile updated.");
                    return;
                }
                applyErrors(data.errors || {});
            })
            .catch(function () {
                form.submit();
            })
            .finally(function () {
                if (saveBtn) saveBtn.disabled = false;
            });
    });
})();
