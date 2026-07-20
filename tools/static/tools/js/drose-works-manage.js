(function () {
    "use strict";

    document.querySelectorAll(".drose-works-manage-form input[type='file']").forEach(function (input) {
        input.addEventListener("change", function () {
            var file = input.files && input.files[0];
            if (!file) return;

            var form = input.closest(".drose-works-manage-form");
            var wrapper = input.closest(".drose-works-file-input-wrapper");
            if (!form || !wrapper) return;

            var nameEl = wrapper.querySelector(".drose-works-file-name");
            var label = wrapper.querySelector(".drose-works-choose-file-btn");
            if (nameEl) {
                nameEl.textContent = file.name;
            }
            if (label) {
                var uploadingLabel = nameEl && nameEl.getAttribute("data-uploading-label");
                if (uploadingLabel) {
                    nameEl.textContent = uploadingLabel;
                }
                label.classList.add("is-uploading");
                label.style.pointerEvents = "none";
            }
            form.submit();
        });
    });

    var statusText = document.getElementById("drose-works-manage-status-text");
    if (!statusText || statusText.classList.contains("drose-works-manage-status__text--empty")) {
        return;
    }

    window.setTimeout(function () {
        statusText.classList.add("drose-works-manage-status__text--hide");
        window.setTimeout(function () {
            statusText.classList.remove(
                "drose-works-manage-status__text--success",
                "drose-works-manage-status__text--error",
                "drose-works-manage-status__text--hide"
            );
            statusText.classList.add("drose-works-manage-status__text--empty");
            statusText.textContent = "\u00a0";
            statusText.removeAttribute("role");
        }, 350);
    }, 2500);
})();
