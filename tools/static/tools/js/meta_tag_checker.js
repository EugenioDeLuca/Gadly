document.addEventListener("DOMContentLoaded", function() {
    var urlInput = document.getElementById("url-input");
    var btnCheck = document.getElementById("btn-check");
    var resultArea = document.getElementById("result-area");

    btnCheck.addEventListener("click", function() {
        var url = urlInput.value.trim();
        resultArea.classList.remove("hidden");
        if (!url) {
            resultArea.classList.add("error");
            resultArea.textContent = "Please enter a URL";
            return;
        }
        resultArea.classList.remove("error");
        resultArea.innerHTML = "Loading...";
        fetch("/api/meta-tag-check/", {
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
            var html = "";
            data.meta_tags.forEach(function(t) {
                html += '<div class="meta-tag-item"><div class="meta-tag-name">' + t.name + '</div><div class="meta-tag-value">' + (t.content || "").replace(/</g, "&lt;") + '</div></div>';
            });
            resultArea.innerHTML = html || "<em>No meta tags found.</em>";
        })
        .catch(function() {
            resultArea.classList.add("error");
            resultArea.textContent = "Request failed";
        });
    });
});
