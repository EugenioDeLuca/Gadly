document.addEventListener("DOMContentLoaded", function() {
    function localizeTagName(name) {
        var n = (name || "").toLowerCase();
        var map = {
            "title": gettext("Title"),
            "description": gettext("Description"),
            "keywords": gettext("Keywords"),
            "author": gettext("Author")
        };
        return map[n] || name;
    }

    var urlInput = document.getElementById("url-input");
    var btnCheck = document.getElementById("btn-check");
    var resultArea = document.getElementById("result-area");
    var resultUi = window.gadlyWebSeoResultArea;

    btnCheck.addEventListener("click", function() {
        var url = urlInput.value.trim();
        resultUi.reveal(resultArea);
        if (!url) {
            resultUi.showEmptyValidation(resultArea, gettext("Please enter a URL"));
            return;
        }
        resultUi.showLoading(resultArea);
        fetch("/api/meta-tag-check/", {
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
            var html = "";
            data.meta_tags.forEach(function(tag) {
                html += '<div class="meta-tag-item"><div class="meta-tag-name">' + localizeTagName(tag.name) + '</div><div class="meta-tag-value">' + (tag.content || "").replace(/</g, "&lt;") + '</div></div>';
            });
            resultUi.showResult(resultArea, html || ("<em>" + gettext("No meta tags found.") + "</em>"));
        })
        .catch(function() {
            resultUi.showError(resultArea, gettext("Request failed"));
        });
    });
});
