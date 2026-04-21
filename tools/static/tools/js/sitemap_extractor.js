document.addEventListener("DOMContentLoaded", function() {
    var t = (typeof gettext === "function") ? gettext : function(s) { return s; };
    var urlInput = document.getElementById("url-input");
    var btnExtract = document.getElementById("btn-extract");
    var resultArea = document.getElementById("result-area");

    btnExtract.addEventListener("click", function() {
        var url = urlInput.value.trim();
        resultArea.classList.remove("hidden");
        if (!url) {
            resultArea.classList.add("error");
            resultArea.textContent = t("Please enter a sitemap URL");
            return;
        }
        resultArea.classList.remove("error");
        resultArea.innerHTML = t("Loading...");
        fetch("/api/sitemap-extract/", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ url: url })
        })
        .then(function(r) { return r.json(); })
        .then(function(data) {
            if (data.error) {
                resultArea.classList.add("error");
                resultArea.textContent = data.error;
                return;
            }
            resultArea.classList.remove("error");
            if (!data.urls || data.urls.length === 0) {
                resultArea.innerHTML = "<em>" + t("No URLs found in sitemap.") + "</em>";
                return;
            }
            resultArea.innerHTML = "<ul class='url-list'>" + data.urls.map(function(u) {
                return "<li>" + u.replace(/</g, "&lt;") + "</li>";
            }).join("") + "</ul>";
        })
        .catch(function() {
            resultArea.classList.add("error");
            resultArea.textContent = t("Request failed");
        });
    });
});
