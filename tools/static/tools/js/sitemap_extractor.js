document.addEventListener("DOMContentLoaded", function() {
    var urlInput = document.getElementById("url-input");
    var btnExtract = document.getElementById("btn-extract");
    var resultArea = document.getElementById("result-area");

    btnExtract.addEventListener("click", function() {
        var url = urlInput.value.trim();
        resultArea.classList.remove("hidden");
        if (!url) {
            resultArea.innerHTML = "<span style='color:#c82333'>Please enter a sitemap URL.</span>";
            return;
        }
        resultArea.innerHTML = "Loading...";
        fetch("/api/sitemap-extract/", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ url: url })
        })
        .then(function(r) { return r.json(); })
        .then(function(data) {
            if (data.error) {
                resultArea.innerHTML = "<span style='color:#c82333'>" + data.error + "</span>";
                return;
            }
            if (!data.urls || data.urls.length === 0) {
                resultArea.innerHTML = "<em>No URLs found in sitemap.</em>";
                return;
            }
            resultArea.innerHTML = "<ul class='url-list'>" + data.urls.map(function(u) {
                return "<li>" + u.replace(/</g, "&lt;") + "</li>";
            }).join("") + "</ul>";
        })
        .catch(function() {
            resultArea.innerHTML = "<span style='color:#c82333'>Request failed.</span>";
        });
    });
});
