document.addEventListener("DOMContentLoaded", function() {
    var form = document.getElementById("pdf-split-form");
    var fileInput = document.getElementById("pdf-file");
    var filePreview = document.getElementById("file-preview");
    var fileList = document.getElementById("file-list");
    var errorMessage = document.getElementById("error-message");
    var displaySpan = fileInput.closest(".file-input-wrapper").querySelector(".file-name-display");

    function updateFileDisplay() {
        if (fileInput.files.length > 0) {
            displaySpan.textContent = fileInput.files[0].name;
            filePreview.style.display = "block";
            fileList.innerHTML = "";
            var li = document.createElement("li");
            li.className = "file-list-item";
            var nameSpan = document.createElement("span");
            nameSpan.className = "file-name";
            nameSpan.textContent = fileInput.files[0].name;
            li.appendChild(nameSpan);
            fileList.appendChild(li);
        } else {
            displaySpan.textContent = "Choose file";
            filePreview.style.display = "none";
            fileList.innerHTML = "";
        }
    }

    fileInput.addEventListener("change", updateFileDisplay);

    var pagesInput = document.getElementById("pages-per-split");
    document.querySelectorAll(".split-preset-btn").forEach(function(btn) {
        btn.addEventListener("click", function() {
            var n = parseInt(btn.dataset.pages, 10);
            pagesInput.value = n;
            document.querySelectorAll(".split-preset-btn").forEach(function(b) { b.classList.remove("active"); });
            btn.classList.add("active");
        });
    });
    pagesInput.addEventListener("input", function() {
        document.querySelectorAll(".split-preset-btn").forEach(function(b) { b.classList.remove("active"); });
    });

    form.addEventListener("submit", function(e) {
        e.preventDefault();
        if (!fileInput.files || fileInput.files.length === 0) {
            errorMessage.style.display = "block";
            return;
        }
        errorMessage.style.display = "none";

        var formData = new FormData();
        formData.append("file", fileInput.files[0]);
        var pagesPerSplit = Math.max(1, parseInt(pagesInput.value, 10) || 1);
        formData.append("pages_per_split", pagesPerSplit);

        fetch("/pdf-split/", {
            method: "POST",
            body: formData
        })
        .then(function(response) {
            if (!response.ok) {
                return response.json().then(function(data) {
                    throw new Error(data.error || "Error processing PDF");
                });
            }
            return response.blob();
        })
        .then(function(blob) {
            var url = URL.createObjectURL(blob);
            var link = document.createElement("a");
            link.href = url;
            var base = fileInput.files[0].name.replace(/\.pdf$/i, "");
            link.download = base + "_split.zip";
            link.click();
            URL.revokeObjectURL(url);
            var pdfResult = document.getElementById("pdf-result");
            var resultMessage = document.getElementById("result-message");
            resultMessage.textContent = "PDF split successfully!";
            resultMessage.style.color = "#28a745";
            pdfResult.style.display = "block";
            resultMessage.style.display = "block";
        })
        .catch(function(err) {
            errorMessage.textContent = err.message || "Error processing PDF.";
            errorMessage.style.display = "block";
        });
    });
});
