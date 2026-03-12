document.addEventListener("DOMContentLoaded", function() {
    const form = document.getElementById("pdf-merger-form");
    const errorMessage = document.getElementById("error-message");
    const fileInputsWrapper = document.getElementById("file-inputs-wrapper");
    const fileList = document.getElementById("file-list");
    const filePreview = document.getElementById("file-preview");
    let addFileCounter = 2;

    // Array con i file nell'ordine scelto dall'utente
    let orderedFiles = [];

    function updateFileDisplay(input, displaySpan) {
        if (!displaySpan) return;
        const count = input.files.length;
        if (count === 0) {
            displaySpan.textContent = "Choose file";
        } else if (count === 1) {
            displaySpan.textContent = input.files[0].name;
        } else {
            displaySpan.textContent = count + " files selected";
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
            upBtn.title = "Move up";
            upBtn.disabled = index === 0;

            const downBtn = document.createElement("button");
            downBtn.type = "button";
            downBtn.className = "btn-reorder btn-down";
            downBtn.innerHTML = "↓";
            downBtn.title = "Move down";
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

    // Event delegation per gli input file (inclusi quelli aggiunti dinamicamente)
    fileInputsWrapper.addEventListener("change", function(e) {
        if (e.target.classList.contains("pdf-file-input")) {
            onFileInputChange(e);
        }
    });

    // Pulsante "Aggiungi file da un'altra cartella"
    document.getElementById("add-more-files").addEventListener("click", function() {
        const id = "pdf-file-" + addFileCounter++;
        const div = document.createElement("div");
        div.className = "upload-area";
        div.innerHTML = '<div class="file-input-wrapper"><input type="file" id="' + id + '" class="pdf-file-input" name="files" accept=".pdf" multiple /><label for="' + id + '" class="choose-file-btn"><span class="file-name-display">Choose file</span></label></div><p class="upload-hint">Choose PDF files to merge</p>';
        fileInputsWrapper.appendChild(div);
    });

    form.addEventListener("submit", function(event) {
        event.preventDefault();
        collectFiles();

        if (orderedFiles.length < 2) {
            errorMessage.style.display = "block";
            return;
        }
        errorMessage.style.display = "none";

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
                throw new Error("Error while processing the PDFs");
            }
            return response.blob();
        })
        .then(blob => {
            const url = URL.createObjectURL(blob);
            const link = document.createElement("a");
            link.href = url;
            link.download = "merged_pdf.pdf";
            link.click();
            errorMessage.style.display = "none";
            const pdfResult = document.getElementById("pdf-result");
            const resultMessage = document.getElementById("result-message");
            resultMessage.textContent = "PDF merged successfully!";
            pdfResult.style.display = "block";
            resultMessage.style.display = "block";
        })
        .catch(error => {
            document.getElementById("error-message").style.display = "block";
            console.error(error);
        });
    });
});
