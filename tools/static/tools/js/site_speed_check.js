document.addEventListener("DOMContentLoaded", function() {
    var urlInput = document.getElementById("url-input");
    var btnCheck = document.getElementById("btn-check");
    var resultArea = document.getElementById("result-area");
    var resultUi = window.gadlyWebSeoResultArea;

    function isDesktopViewport() {
        return window.matchMedia && window.matchMedia("(min-width: 769px)").matches;
    }

    function showSiteSpeedLoading() {
        resultArea.classList.remove("hidden", "error", "has-result");
        resultArea.classList.add("is-loading");
        resultArea.removeAttribute("hidden");
        resultArea.removeAttribute("aria-hidden");
        if (isDesktopViewport()) {
            resultArea.textContent = "";
            return;
        }
        resultUi.showLoading(resultArea);
    }

    function clearBtnCheckPressState() {
        btnCheck.classList.remove("tap-active");
        try {
            btnCheck.blur();
        } catch (eBlur) { /* ignore */ }
    }

    function renderResultHtml(msText, color) {
        var label = gettext("Response time:");
        var isMobile = window.matchMedia && window.matchMedia("(max-width: 768px)").matches;
        var style = isMobile && color ? ' style="color:' + color + '"' : "";
        return label + ' <strong class="site-speed-ms-value"' + style + ">" + msText + "</strong>";
    }

    btnCheck.addEventListener("click", function() {
        clearBtnCheckPressState();
        var url = urlInput.value.trim();
        if (!url) {
            resultUi.reveal(resultArea);
            resultUi.showEmptyValidation(resultArea, gettext("Please enter a URL"));
            return;
        }
        showSiteSpeedLoading();
        fetch("/api/site-speed/", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ url: url })
        })
        .then(function(r) { return r.json(); })
        .then(function(data) {
            if (data.error) {
                resultUi.showError(resultArea, data.error);
                return;
            }
            var ms = data.time_ms;
            var cls = ms < 500 ? "#28a745" : (ms < 2000 ? "#ffc107" : "#dc3545");
            resultUi.showResult(resultArea, renderResultHtml(ms + " ms", cls));
        })
        .catch(function() {
            resultUi.showError(resultArea, gettext("Request failed"));
        });
    });
});
