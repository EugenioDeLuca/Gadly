document.addEventListener("DOMContentLoaded", function() {
    const fileInput = document.getElementById("file-upload");
    const fileNameDisplay = document.getElementById("file-name-display");
    const form = document.getElementById("file-analyzer-form");
    const resultsContainer = document.getElementById("file-results");
    const analysisWrap = document.getElementById("analysis-options-wrap");
    const analysisTrigger = document.getElementById("analysis-opts-trigger");
    const analysisTriggerText = document.getElementById("analysis-opts-trigger-text");
    const submitBtn = document.getElementById("submit-file");
    const mobileAnalysisMq = window.matchMedia("(max-width: 768px)");

    function isMobileAnalysisDropdown() {
        return mobileAnalysisMq.matches;
    }

    function syncAnalysisTriggerTabIndex() {
        if (!analysisTrigger) return;
        if (isMobileAnalysisDropdown()) {
            analysisTrigger.setAttribute("tabindex", "-1");
        } else {
            analysisTrigger.removeAttribute("tabindex");
        }
    }

    function getAnalysisOptionInputs() {
        if (!analysisWrap) return [];
        return Array.prototype.slice.call(analysisWrap.querySelectorAll(".analysis-option input"));
    }

    function updateAnalysisOptsTriggerLabel() {
        if (!analysisTriggerText) return;
        const inputs = getAnalysisOptionInputs();
        const checked = inputs.filter(function(input) { return input.checked; });
        const n = checked.length;
        const total = inputs.length;
        const labelAll = analysisTriggerText.dataset.labelAll || gettext("All selected");
        const labelNone = analysisTriggerText.dataset.labelNone || gettext("None selected");
        if (n === 0) {
            analysisTriggerText.textContent = labelNone;
        } else if (n === total) {
            analysisTriggerText.textContent = labelAll;
        } else {
            analysisTriggerText.textContent = n + " / " + total;
        }
    }

    function setAnalysisDropdownOpen(open) {
        if (!analysisWrap || !analysisTrigger) return;
        const isOpen = Boolean(open);
        analysisWrap.classList.toggle("is-open", isOpen);
        analysisTrigger.setAttribute("aria-expanded", isOpen ? "true" : "false");
    }

    function closeAnalysisDropdown() {
        setAnalysisDropdownOpen(false);
    }

    function clearFocusFromAnalysisUi() {
        closeAnalysisDropdown();
        if (analysisTrigger) {
            analysisTrigger.blur();
        }
        if (submitBtn) {
            submitBtn.blur();
        }
        if (fileInput) {
            fileInput.blur();
        }
        const chooseLabel = document.querySelector(".file-analyzer .choose-file-btn");
        if (chooseLabel && typeof chooseLabel.blur === "function") {
            chooseLabel.blur();
        }
        const active = document.activeElement;
        if (active && active !== document.body && typeof active.blur === "function") {
            active.blur();
        }
    }

    function focusFileResultsForError() {
        if (!resultsContainer) return;
        resultsContainer.setAttribute("tabindex", "-1");
        try {
            resultsContainer.focus({ preventScroll: true });
        } catch (err) {
            resultsContainer.focus();
        }
    }

    if (analysisTrigger && analysisWrap) {
        analysisTrigger.addEventListener("click", function() {
            if (!isMobileAnalysisDropdown()) return;
            setAnalysisDropdownOpen(!analysisWrap.classList.contains("is-open"));
            window.setTimeout(function() {
                analysisTrigger.blur();
            }, 0);
        });

        document.addEventListener("click", function(event) {
            if (!isMobileAnalysisDropdown() || !analysisWrap.classList.contains("is-open")) return;
            if (analysisWrap.contains(event.target)) return;
            if (submitBtn && submitBtn.contains(event.target)) return;
            closeAnalysisDropdown();
        });

        getAnalysisOptionInputs().forEach(function(cb) {
            cb.addEventListener("change", updateAnalysisOptsTriggerLabel);
        });

        mobileAnalysisMq.addEventListener("change", function() {
            syncAnalysisTriggerTabIndex();
            closeAnalysisDropdown();
            updateAnalysisOptsTriggerLabel();
        });

        syncAnalysisTriggerTabIndex();
        updateAnalysisOptsTriggerLabel();
    }

    fileInput.addEventListener("change", function() {
        fileNameDisplay.textContent = this.files[0] ? this.files[0].name : gettext("Choose file");
    });

    function runAnalyze() {
        if (isMobileAnalysisDropdown()) {
            closeAnalysisDropdown();
        }
        const file = fileInput.files[0];
        if (!file) {
            resultsContainer.textContent = gettext("Please select a file to analyze");
            resultsContainer.classList.add("error");
            resultsContainer.classList.remove("hidden");
            clearFocusFromAnalysisUi();
            window.setTimeout(function() {
                clearFocusFromAnalysisUi();
                focusFileResultsForError();
            }, 0);
            return;
        }

        resultsContainer.classList.remove("error");
        resultsContainer.innerHTML = '<p class="loading-msg">' + gettext("Analyzing...") + '</p>';
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
                clearFocusFromAnalysisUi();
                window.setTimeout(focusFileResultsForError, 0);
                return;
            }
            const checks = {};
            getAnalysisOptionInputs().filter(function(cb) { return cb.checked; }).forEach(function(cb) {
                checks[cb.value] = true;
            });
            const labels = {
                file_name: gettext("File name"),
                file_size_human: gettext("Size"),
                file_type: gettext("Type"),
                file_extension: gettext("Extension"),
                md5_hash: gettext("MD5"),
                sha256_hash: gettext("SHA-256"),
                last_modified: gettext("Last modified"),
                line_count: gettext("Lines"),
                word_count: gettext("Words"),
                char_count: gettext("Characters"),
                char_count_no_spaces: gettext("Characters (no spaces)"),
                reading_time_min: gettext("Reading time (min)")
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
                    value = String(value) + " " + gettext("min");
                }
                html += '<div class="' + rowCls + '"><span class="result-label">' + labels[item.key] + '</span><span class="' + valCls + '">' + value + '</span></div>';
            });
            html += "</div>";
            if (!html.includes("result-row")) {
                html = '<p class="loading-msg">' + gettext("Select at least one option to show in results.") + '</p>';
            }
            resultsContainer.classList.remove("error");
            resultsContainer.innerHTML = html;
            resultsContainer.classList.remove("hidden");
        })
        .catch(function(error) {
            console.error("Error:", error);
            resultsContainer.textContent = gettext("An error occurred while analyzing the file");
            resultsContainer.classList.add("error");
            resultsContainer.classList.remove("hidden");
            clearFocusFromAnalysisUi();
            window.setTimeout(focusFileResultsForError, 0);
        });
    }

    if (submitBtn) {
        var submitTapTimer = null;
        var SUBMIT_TAP_FEEDBACK_MS = 200;

        function startSubmitTapFeedback() {
            if (!isMobileAnalysisDropdown()) return;
            submitBtn.classList.add("is-tap-pressed");
        }

        function endSubmitTapFeedback() {
            if (!isMobileAnalysisDropdown()) return;
            window.clearTimeout(submitTapTimer);
            submitTapTimer = window.setTimeout(function() {
                submitBtn.classList.remove("is-tap-pressed");
            }, SUBMIT_TAP_FEEDBACK_MS);
        }

        submitBtn.addEventListener("touchstart", startSubmitTapFeedback, { passive: true });
        submitBtn.addEventListener("touchend", endSubmitTapFeedback, { passive: true });
        submitBtn.addEventListener("touchcancel", function() {
            submitBtn.classList.remove("is-tap-pressed");
            window.clearTimeout(submitTapTimer);
        }, { passive: true });

        submitBtn.addEventListener("click", function(event) {
            event.preventDefault();
            if (isMobileAnalysisDropdown()) {
                startSubmitTapFeedback();
                endSubmitTapFeedback();
            }
            runAnalyze();
        });
    }

    if (form) {
        form.addEventListener("submit", function(event) {
            event.preventDefault();
            runAnalyze();
        });
    }
});
