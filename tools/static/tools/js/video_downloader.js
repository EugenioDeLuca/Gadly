document.addEventListener("DOMContentLoaded", function() {
    var urlInput = document.getElementById("url-input");
    var btnDownload = document.getElementById("btn-download");
    var resultArea = document.getElementById("result-area");

    btnDownload.addEventListener("click", function() {
        var url = urlInput.value.trim();
        if (!url) {
            resultArea.textContent = "Please enter a video URL";
            resultArea.classList.add("error");
            resultArea.classList.remove("hidden");
            return;
        }
        resultArea.classList.remove("error");
        resultArea.innerHTML = "<div class='video-download-loader'><div class='video-download-loader-bar'></div></div>";
        resultArea.classList.remove("hidden");
        fetch("/api/video-download/", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ url: url })
        })
        .then(function(r) {
            var ct = r.headers.get("Content-Type") || "";
            if (!r.ok || ct.indexOf("application/json") >= 0) {
                return r.json().then(function(data) {
                    throw new Error(data.error || "Download failed");
                });
            }
            var filename = r.headers.get("X-Suggested-Filename") || "video.mp4";
            return r.blob().then(function(blob) { return { blob: blob, filename: filename }; });
        })
        .then(function(obj) {
            var blob = obj.blob, filename = obj.filename || "video.mp4";
            var u = URL.createObjectURL(blob);
            var a = document.createElement("a");
            a.href = u;
            a.download = filename;
            resultArea.classList.remove("error");
            resultArea.innerHTML = "";
            resultArea.classList.add("hidden");
            a.click();
            URL.revokeObjectURL(u);
        })
        .catch(function(err) {
            var msg = (err.message || "Request failed").replace(/\.$/, "");
            resultArea.textContent = msg;
            resultArea.classList.add("error");
            resultArea.classList.remove("hidden");
        });
    });
});
