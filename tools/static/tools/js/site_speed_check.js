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
        resultArea.innerHTML = "Checking...";
        fetch("/api/site-speed/", {
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
            var ms = data.time_ms;
            var cls = ms < 500 ? "#28a745" : (ms < 2000 ? "#ffc107" : "#dc3545");
            resultArea.innerHTML = "Response time: <strong style='color:" + cls + "'>" + ms + " ms</strong>";
        })
        .catch(function() {
            resultArea.classList.add("error");
            resultArea.textContent = "Request failed";
        });
    });
});
