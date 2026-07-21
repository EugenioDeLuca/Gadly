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

(function () {
    var avatarForm = document.getElementById("account-avatar-form");
    if (!avatarForm) return;

    var flashSlot = document.getElementById("account-flash-slot");
    var saveAvatarBtn = avatarForm.querySelector(".login-btn--save-avatar");
    var removeAvatarBtn = avatarForm.querySelector(".login-btn--remove-avatar");
    var avatarInput = document.getElementById("id_avatar");
    var avatarFlashHideTimer = null;
    var avatarFlashRemoveTimer = null;
    var submitter = null;

    function getCsrfToken() {
        var input = avatarForm.querySelector('input[name="csrfmiddlewaretoken"]');
        return input ? input.value : "";
    }

    function clearAvatarFieldErrors() {
        avatarForm.querySelectorAll(".field-error").forEach(function (el) {
            el.remove();
        });
    }

    function showAvatarFieldError(message) {
        var host = avatarInput ? avatarInput.closest(".form-group") : avatarForm;
        if (!host) return;
        var span = document.createElement("span");
        span.className = "field-error";
        span.textContent = message;
        host.appendChild(span);
    }

    function applyAvatarErrors(errors) {
        clearAvatarFieldErrors();
        if (!errors) return;
        var messages = errors.avatar || errors._all || [];
        if (messages.length) {
            showAvatarFieldError(messages[0]);
        }
    }

    function replaceAvatarElement(oldEl, className, size, hasAvatar, uri, initials, ariaHidden) {
        var parent = oldEl.parentNode;
        if (!parent) return;
        var next;
        if (hasAvatar && uri) {
            next = document.createElement("img");
            next.src = uri;
            next.alt = "";
            next.className = className;
            next.width = size;
            next.height = size;
            next.decoding = "sync";
        } else {
            next = document.createElement("span");
            next.className = className + " header-avatar--letter";
            if (ariaHidden) next.setAttribute("aria-hidden", "true");
            var inner = document.createElement("span");
            inner.className = "header-avatar-initials";
            inner.textContent = initials;
            next.appendChild(inner);
        }
        parent.replaceChild(next, oldEl);
    }

    function updateHeaderAvatars(hasAvatar, headerUri, initials) {
        var triggerEl = document.querySelector(
            ".header-user-trigger img.header-avatar, .header-user-trigger .header-avatar.header-avatar--letter"
        );
        if (triggerEl) {
            replaceAvatarElement(triggerEl, "header-avatar", 28, hasAvatar, headerUri, initials, true);
        }
        var navEl = document.querySelector(
            ".header-nav-account-profile img.header-nav-account-avatar, .header-nav-account-profile .header-nav-account-avatar.header-avatar--letter"
        );
        if (navEl) {
            replaceAvatarElement(navEl, "header-nav-account-avatar", 36, hasAvatar, headerUri, initials, false);
        }
    }

    function updateAccountAvatarWrap(hasAvatar, accountUri, initials) {
        var wrap = document.querySelector(".account-avatar-wrap");
        if (!wrap) return;
        var current = wrap.querySelector(".account-avatar");
        if (hasAvatar && accountUri) {
            if (current && current.tagName === "IMG") {
                current.src = accountUri;
            } else {
                var img = document.createElement("img");
                img.src = accountUri;
                img.alt = "";
                img.className = "account-avatar";
                img.width = 80;
                img.height = 80;
                img.decoding = "sync";
                wrap.innerHTML = "";
                wrap.appendChild(img);
            }
        } else {
            var div = document.createElement("div");
            div.className = "account-avatar account-avatar--placeholder";
            div.textContent = initials;
            wrap.innerHTML = "";
            wrap.appendChild(div);
        }
    }

    function markAvatarSaveButton(saved) {
        if (!saveAvatarBtn) return;
        saveAvatarBtn.classList.toggle("login-btn--saved", saved);
        var check = saveAvatarBtn.querySelector(".save-check");
        if (check) check.textContent = saved ? "✓" : "";
    }

    function setRemoveAvatarEnabled(enabled) {
        if (!removeAvatarBtn) return;
        removeAvatarBtn.disabled = !enabled;
    }

    function hideAvatarFlashMessage() {
        if (!flashSlot) return;
        var msg = flashSlot.querySelector("#account-avatar-removed-msg, #account-avatar-saved-msg");
        if (!msg) return;
        msg.classList.add("account-avatar-removed-msg--hide");
        window.setTimeout(function () {
            msg.hidden = true;
        }, 350);
    }

    function showAvatarFlashMessage(message, id) {
        if (!flashSlot) return;
        if (avatarFlashHideTimer) window.clearTimeout(avatarFlashHideTimer);
        if (avatarFlashRemoveTimer) window.clearTimeout(avatarFlashRemoveTimer);

        flashSlot.innerHTML = "";
        var node = document.createElement("p");
        node.className = id === "account-avatar-saved-msg"
            ? "account-msg account-msg--ok"
            : "account-avatar-removed-msg";
        node.id = id;
        node.setAttribute("role", "status");
        node.textContent = message;
        flashSlot.appendChild(node);

        avatarFlashHideTimer = window.setTimeout(function () {
            hideAvatarFlashMessage();
        }, 2500);
    }

    function applyAvatarSuccess(data, action) {
        var hasAvatar = !!data.has_avatar;
        var initials = data.initials || "?";
        updateAccountAvatarWrap(hasAvatar, data.avatar_inline_account || "", initials);
        updateHeaderAvatars(hasAvatar, data.avatar_inline_header || "", initials);
        setRemoveAvatarEnabled(hasAvatar);
        if (action === "save") {
            markAvatarSaveButton(true);
            if (data.message) {
                showAvatarFlashMessage(data.message, "account-avatar-saved-msg");
            }
        } else if (action === "remove" && data.message) {
            markAvatarSaveButton(false);
            showAvatarFlashMessage(data.message, "account-avatar-removed-msg");
        } else if (action === "upload") {
            markAvatarSaveButton(false);
        }
        if (avatarInput) {
            avatarInput.value = "";
        }
    }

    avatarForm.addEventListener("click", function (event) {
        var btn = event.target.closest('button[type="submit"][name="avatar_action"]');
        if (btn) submitter = btn;
    });

    avatarForm.addEventListener("submit", function (event) {
        event.preventDefault();
        var actionBtn = submitter || avatarForm.querySelector('button[type="submit"][name="avatar_action"]');
        submitter = null;
        if (!actionBtn) return;

        var buttons = avatarForm.querySelectorAll('button[type="submit"]');
        buttons.forEach(function (btn) {
            btn.disabled = true;
        });

        var body = new FormData(avatarForm);
        body.set("avatar_action", actionBtn.value);

        fetch(avatarForm.getAttribute("action") || window.location.href, {
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
                if (data.ok) {
                    clearAvatarFieldErrors();
                    applyAvatarSuccess(data, actionBtn.value);
                    return;
                }
                applyAvatarErrors(data.errors || {});
            })
            .catch(function () {
                avatarForm.submit();
            })
            .finally(function () {
                buttons.forEach(function (btn) {
                    btn.disabled = false;
                });
            });
    });
})();
