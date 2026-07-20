document.addEventListener("DOMContentLoaded", function() {
    var urlInput = document.getElementById("url-input");
    var btnExtract = document.getElementById("btn-extract");
    var resultArea = document.getElementById("result-area");
    var resultUi = window.gadlyWebSeoResultArea;

    btnExtract.addEventListener("click", function() {
        var url = urlInput.value.trim();
        resultUi.reveal(resultArea);
        if (!url) {
            resultUi.showEmptyValidation(resultArea, gettext("Please enter a sitemap URL"));
            return;
        }
        resultUi.showLoading(resultArea);
        fetch("/api/sitemap-extract/", {
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
            if (!data.urls || data.urls.length === 0) {
                resultUi.showResult(resultArea, "<em>" + gettext("No URLs found in sitemap.") + "</em>");
                return;
            }
            resultUi.showResult(resultArea, "<ul class='url-list'>" + data.urls.map(function(u) {
                return "<li>" + u.replace(/</g, "&lt;") + "</li>";
            }).join("") + "</ul>");
        })
        .catch(function() {
            resultUi.showError(resultArea, gettext("Request failed"));
        });
    });
});
