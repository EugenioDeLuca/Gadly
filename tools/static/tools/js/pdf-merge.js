document.addEventListener("DOMContentLoaded", function() {
    const form = document.getElementById("pdf-merger-form");
    const resultArea = document.getElementById("pdf-result-area");
    const fileInputsWrapper = document.getElementById("file-inputs-wrapper");
    const fileList = document.getElementById("file-list");
    const filePreview = document.getElementById("file-preview");
    let addFileCounter = 2;

    let orderedFiles = [];

    function updateFileDisplay(input, displaySpan) {
        if (!displaySpan) return;
        const count = input.files.length;
        if (count === 0) {
            displaySpan.textContent = gettext("Choose file");
        } else if (count === 1) {
            displaySpan.textContent = input.files[0].name;
        } else {
            displaySpan.textContent = count + " " + gettext("files selected");
        }
    }

    function collectFiles() {
        orderedFiles = [];
        const inputs = form.querySelectorAll(".pdf-file-input");
        inputs.forEach(function(input) {
            for (let i = 0; i < input.files.length; i++) {
                orderedFiles.push(input.files[i]);
            }
        });
    }

    function renderFileList() {
        fileList.innerHTML = "";
        if (orderedFiles.length === 0) {
            filePreview.style.display = "none";
            return;
        }
        filePreview.style.display = "block";

        orderedFiles.forEach(function(file, index) {
            const li = document.createElement("li");
            li.className = "file-list-item";
            li.dataset.index = index;

            const nameSpan = document.createElement("span");
            nameSpan.className = "file-name";
            nameSpan.textContent = file.name;

            const btnWrapper = document.createElement("span");
            btnWrapper.className = "reorder-buttons";

            const upBtn = document.createElement("button");
            upBtn.type = "button";
            upBtn.className = "btn-reorder btn-up";
            upBtn.innerHTML = "↑";
            upBtn.title = gettext("Move up");
            upBtn.disabled = index === 0;

            const downBtn = document.createElement("button");
            downBtn.type = "button";
            downBtn.className = "btn-reorder btn-down";
            downBtn.innerHTML = "↓";
            downBtn.title = gettext("Move down");
            downBtn.disabled = index === orderedFiles.length - 1;

            upBtn.addEventListener("click", function() {
                if (index > 0) {
                    const temp = orderedFiles[index];
                    orderedFiles[index] = orderedFiles[index - 1];
                    orderedFiles[index - 1] = temp;
                    renderFileList();
                }
            });

            downBtn.addEventListener("click", function() {
                if (index < orderedFiles.length - 1) {
                    const temp = orderedFiles[index];
                    orderedFiles[index] = orderedFiles[index + 1];
                    orderedFiles[index + 1] = temp;
                    renderFileList();
                }
            });

            btnWrapper.appendChild(upBtn);
            btnWrapper.appendChild(downBtn);
            li.appendChild(nameSpan);
            li.appendChild(btnWrapper);
            fileList.appendChild(li);
        });
    }

    function onFileInputChange(e) {
        collectFiles();
        renderFileList();
        const input = e.target;
        const displaySpan = input.closest(".file-input-wrapper")?.querySelector(".file-name-display");
        updateFileDisplay(input, displaySpan);
    }

    fileInputsWrapper.addEventListener("change", function(e) {
        if (e.target.classList.contains("pdf-file-input")) {
            onFileInputChange(e);
        }
    });

    document.getElementById("add-more-files").addEventListener("click", function() {
        const id = "pdf-file-" + addFileCounter++;
        const div = document.createElement("div");
        div.className = "upload-area";
        div.innerHTML = '<div class="file-input-wrapper"><input type="file" id="' + id + '" class="pdf-file-input" name="files" accept=".pdf" multiple /><label for="' + id + '" class="choose-file-btn"><span class="file-name-display">' + gettext("Choose file") + '</span></label></div><p class="upload-hint">' + gettext("Choose PDF files to merge") + '</p>';
        fileInputsWrapper.appendChild(div);
    });

    form.addEventListener("submit", function(event) {
        event.preventDefault();
        collectFiles();

        if (orderedFiles.length < 2) {
            resultArea.textContent = gettext("Please select at least two PDF files");
            resultArea.classList.add("error");
            resultArea.classList.remove("hidden");
            return;
        }
        resultArea.classList.remove("error");
        resultArea.classList.add("hidden");

        const formData = new FormData();
        orderedFiles.forEach(function(file) {
            formData.append("files", file);
        });

        fetch("/pdf-merger/", {
            method: "POST",
            body: formData
        })
        .then(response => {
            if (!response.ok) {
                throw new Error(gettext("Error while processing the PDFs"));
            }
            return response.blob();
        })
        .then(blob => {
            const url = URL.createObjectURL(blob);
            const link = document.createElement("a");
            link.href = url;
            link.download = "merged_pdf.pdf";
            link.click();
            resultArea.textContent = gettext("PDF merged successfully!");
            resultArea.classList.remove("error");
            resultArea.classList.remove("hidden");
        })
        .catch(function(error) {
            var generic = gettext("Error while processing the PDFs");
            resultArea.textContent = (error.message && error.message !== generic) ? error.message.replace(/\.$/, "") : generic;
            resultArea.classList.add("error");
            resultArea.classList.remove("hidden");
            console.error(error);
        });
    });
});
