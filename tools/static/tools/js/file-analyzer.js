document.addEventListener("DOMContentLoaded", function() {
    const fileInput = document.getElementById("file-upload");
    const fileNameDisplay = document.getElementById("file-name-display");
    const form = document.getElementById("file-analyzer-form");
    const resultsContainer = document.getElementById("file-results");

    fileInput.addEventListener("change", function() {
        fileNameDisplay.textContent = this.files[0] ? this.files[0].name : "Choose file";
    });

    form.addEventListener("submit", function(event) {
        event.preventDefault();
        const file = fileInput.files[0];
        if (!file) {
            resultsContainer.innerHTML = '<p style="text-align:center;font-weight:bold;color:#dc3545;margin:0;padding:16px;width:100%;display:block;">Please select a file to analyze.</p>';
            resultsContainer.classList.add("show");
            return;
        }

        resultsContainer.innerHTML = '<p class="loading-msg">Analyzing...</p>';
        resultsContainer.classList.add("show");

        const formData = new FormData();
        formData.append("file", file);

        fetch("/analyze-file/", {
            method: "POST",
            body: formData,
        })
        .then(response => response.json())
        .then(data => {
            if (data.error) {
                resultsContainer.innerHTML = '<p style="text-align:center;font-weight:bold;color:#dc3545;margin:0;padding:16px;width:100%;display:block;">' + data.error + '</p>';
                return;
            }
            const checks = {};
            form.querySelectorAll('.analysis-option input:checked').forEach(function(cb) {
                checks[cb.value] = true;
            });
            const labels = { file_name: 'File name', file_size_human: 'Size', file_type: 'Type', file_extension: 'Extension', md5_hash: 'MD5', line_count: 'Lines', word_count: 'Words', char_count: 'Characters' };
            const items = [
                { key: 'file_name', wide: false },
                { key: 'file_size_human', wide: false },
                { key: 'file_type', wide: false },
                { key: 'file_extension', wide: false },
                { key: 'md5_hash', wide: true },
                { key: 'line_count', wide: false },
                { key: 'word_count', wide: false },
                { key: 'char_count', wide: false }
            ];
            let html = '<div class="results-grid">';
            items.forEach(function(item) {
                if (!checks[item.key] || data[item.key] === undefined) return;
                const cls = item.wide ? 'result-card result-card-wide' : 'result-card';
                const valCls = item.key === 'md5_hash' ? 'result-value result-hash' : 'result-value';
                html += '<div class="' + cls + '"><span class="result-label">' + labels[item.key] + '</span><span class="' + valCls + '">' + data[item.key] + '</span></div>';
            });
            html += '</div>';
            if (!html.includes('result-card')) {
                html = '<p class="loading-msg">Select at least one option to show in results.</p>';
            }
            resultsContainer.innerHTML = html;
        })
        .catch(function(error) {
            console.error("Error:", error);
            resultsContainer.innerHTML = '<p style="text-align:center;font-weight:bold;color:#dc3545;margin:0;padding:16px;width:100%;display:block;">An error occurred while analyzing the file.</p>';
        });
    });
});
