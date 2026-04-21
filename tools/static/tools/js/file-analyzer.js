document.addEventListener("DOMContentLoaded", function() {
    var t = (typeof gettext === "function") ? gettext : function(s) { return s; };
    const fileInput = document.getElementById("file-upload");
    const fileNameDisplay = document.getElementById("file-name-display");
    const form = document.getElementById("file-analyzer-form");
    const resultsContainer = document.getElementById("file-results");

    fileInput.addEventListener("change", function() {
        fileNameDisplay.textContent = this.files[0] ? this.files[0].name : t("Choose file");
    });

    form.addEventListener("submit", function(event) {
        event.preventDefault();
        const file = fileInput.files[0];
        if (!file) {
            resultsContainer.textContent = t("Please select a file to analyze");
            resultsContainer.classList.add("error");
            resultsContainer.classList.remove("hidden");
            return;
        }

        resultsContainer.classList.remove("error");
        resultsContainer.innerHTML = '<p class="loading-msg">' + t("Analyzing...") + '</p>';
        resultsContainer.classList.remove("hidden");

        const formData = new FormData();
        formData.append("file", file);
        if (typeof file.lastModified === "number") {
            formData.append("last_modified", String(file.lastModified));
        }

        fetch("/analyze-file/", {
            method: "POST",
            body: formData,
        })
        .then(response => response.json())
        .then(data => {
            if (data.error) {
                resultsContainer.textContent = data.error.replace(/\.$/, "");
                resultsContainer.classList.add("error");
                resultsContainer.classList.remove("hidden");
                return;
            }
            const checks = {};
            form.querySelectorAll('.analysis-option input:checked').forEach(function(cb) {
                checks[cb.value] = true;
            });
            const labels = {
                file_name: t('File name'),
                file_size_human: t('Size'),
                file_type: t('Type'),
                file_extension: t('Extension'),
                md5_hash: 'MD5',
                sha256_hash: 'SHA-256',
                last_modified: t('Last modified'),
                line_count: t('Lines'),
                word_count: t('Words'),
                char_count: t('Characters'),
                char_count_no_spaces: t('Characters (no spaces)'),
                reading_time_min: t('Reading time (min)')
            };
            const items = [
                { key: 'file_name', wide: false },
                { key: 'file_size_human', wide: false },
                { key: 'file_type', wide: false },
                { key: 'file_extension', wide: false },
                { key: 'md5_hash', wide: true },
                { key: 'sha256_hash', wide: true },
                { key: 'last_modified', wide: false },
                { key: 'line_count', wide: false },
                { key: 'word_count', wide: false },
                { key: 'char_count', wide: false },
                { key: 'char_count_no_spaces', wide: false },
                { key: 'reading_time_min', wide: false }
            ];
            let html = '<div class="results-list">';
            items.forEach(function(item) {
                if (!checks[item.key] || data[item.key] === undefined) return;
                const isHash = item.key === 'md5_hash' || item.key === 'sha256_hash';
                const rowCls = isHash ? 'result-row result-row-hash' : 'result-row';
                const valCls = isHash ? 'result-value result-hash' : 'result-value';
                let value = data[item.key];
                if (item.key === 'reading_time_min') {
                    value = String(value) + " " + t("min");
                }
                html += '<div class="' + rowCls + '"><span class="result-label">' + labels[item.key] + '</span><span class="' + valCls + '">' + value + '</span></div>';
            });
            html += "</div>";
            if (!html.includes("result-row")) {
                html = '<p class="loading-msg">' + t('Select at least one option to show in results.') + '</p>';
            }
            resultsContainer.classList.remove("error");
            resultsContainer.innerHTML = html;
            resultsContainer.classList.remove("hidden");
        })
        .catch(function(error) {
            console.error("Error:", error);
            resultsContainer.textContent = t("An error occurred while analyzing the file");
            resultsContainer.classList.add("error");
            resultsContainer.classList.remove("hidden");
        });
    });
});
