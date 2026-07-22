document.addEventListener("DOMContentLoaded", function() {
    var STORAGE_KEY = "gadly-data-viz-state";
    var BOOT_PNG_KEY = "gadly-viz-chart-png-v1";
    var CSV_MAX_BYTES = 256 * 1024;
    var PREVIEW_MAX_ROWS = 10;

    var dataInput = document.getElementById("data-input");
    var chartTypeSelect = document.getElementById("chart-type");
    var btnGenerate = document.getElementById("btn-generate");
    var canvas = document.getElementById("chart-canvas");
    var chartContainer = document.querySelector(".chart-container");
    var resultArea = document.getElementById("data-viz-result");
    var chartTitleInput = document.getElementById("chart-title");
    var paletteSelect = document.getElementById("viz-palette");
    var sortSelect = document.getElementById("viz-sort");
    var topNInput = document.getElementById("viz-top-n");
    var showValuesCheck = document.getElementById("viz-show-values");
    var horizontalBarCheck = document.getElementById("viz-horizontal-bar");
    var rotateLabelsCheck = document.getElementById("viz-rotate-labels");
    var yAxisUnitInput = document.getElementById("viz-y-unit");
    var autoChartTypeCheck = document.getElementById("viz-auto-chart-type");
    var previewWrap = document.getElementById("viz-data-preview");
    var previewTable = document.getElementById("viz-preview-table");
    var statsEl = document.getElementById("viz-stats");
    var autoGenerateCheck = document.getElementById("viz-auto-generate");

    var chart = null;
    var chartResizeObserver = null;
    var chartRestoreTimers = [];

    function whenChartJsReady(fn) {
        if (typeof Chart !== "undefined") {
            fn();
            return;
        }
        var attempts = 0;
        (function poll() {
            if (typeof Chart !== "undefined") {
                fn();
                return;
            }
            if (++attempts > 120) return;
            setTimeout(poll, 25);
        })();
    }

    function hideBootChartPlaceholder() {
        if (!chartContainer) return;
        var preview = chartContainer.querySelector(".chart-preview");
        if (!preview) return;
        preview.querySelectorAll(".viz-boot-chart-img").forEach(function (img) {
            img.parentNode.removeChild(img);
        });
        if (canvas) canvas.style.visibility = "";
    }

    function persistBootChartPng() {
        if (!chart) return;
        try {
            var url = getChartPngDataUrl();
            if (url) sessionStorage.setItem(BOOT_PNG_KEY, url);
        } catch (e) { /* ignore */ }
    }

    function readSavedVizState() {
        try {
            var params = new URLSearchParams(window.location.search);
            var s = params.get("s");
            if (s) {
                return JSON.parse(decodeURIComponent(escape(atob(decodeURIComponent(s)))));
            }
        } catch (e) { /* ignore */ }
        return null;
    }

    function canGenerateFromInput() {
        if (!dataInput || !String(dataInput.value || "").trim()) return false;
        var parsed = parseData(dataInput.value);
        return parsed.labels.length > 0 && parsed.datasets.length > 0;
    }

    function restoreChartIfNeeded() {
        if (chart) return true;
        var state = readSavedVizState();
        if (!shouldRestoreChartState(state)) return false;
        if (state && state.data != null && dataInput && !String(dataInput.value || "").trim()) {
            dataInput.value = state.data;
            if (resizeDataInput) resizeDataInput();
        }
        if (!canGenerateFromInput()) return false;
        showChartContainer();
        whenChartJsReady(function () {
            if (chart) return;
            generateChart();
        });
        return true;
    }

    function scheduleChartRestoreRetries() {
        chartRestoreTimers.forEach(function (t) { clearTimeout(t); });
        chartRestoreTimers = [];
        if (!restoreChartIfNeeded()) return;
        [120, 350, 800, 1600].forEach(function (delayMs) {
            chartRestoreTimers.push(setTimeout(function () {
                if (!chart) restoreChartIfNeeded();
            }, delayMs));
        });
    }

    function showChartContainer() {
        if (!chartContainer) return;
        if (chartContainer.classList.contains("hidden") || chartContainer.hasAttribute("hidden")) {
            chartContainer.classList.remove("hidden");
            chartContainer.removeAttribute("hidden");
            saveState();
        }
    }

    function resizeChartAfterLayout() {
        requestAnimationFrame(function() {
            requestAnimationFrame(function() {
                if (chart && typeof chart.resize === "function") chart.resize();
            });
        });
    }

    function bindChartResizeObserver() {
        if (typeof ResizeObserver === "undefined" || !chartContainer) return;
        var target = chartContainer.querySelector(".chart-preview");
        if (!target) return;
        if (chartResizeObserver) chartResizeObserver.disconnect();
        chartResizeObserver = new ResizeObserver(function() {
            if (chart && typeof chart.resize === "function") chart.resize();
        });
        chartResizeObserver.observe(target);
    }

    var PALETTES = {
        gadly: ["#3498db", "#e74c3c", "#2ecc71", "#f39c12", "#9b59b6", "#1abc9c", "#e67e22", "#34495e", "#95a5a6", "#d35400"],
        pastel: ["#a8d8ea", "#f8b4c4", "#b8e0d2", "#ffd6a5", "#cdb4db", "#bde0fe", "#ffc8dd", "#caffbf", "#fdffb6", "#ffadad"],
        contrast: ["#003f7f", "#c0392b", "#27ae60", "#f39c12", "#8e44ad", "#16a085", "#d35400", "#2c3e50", "#7f8c8d", "#e74c3c"],
        mono: ["#003f7f", "#1a5276", "#2874a6", "#3498db", "#5dade2", "#85c1e9", "#aed6f1", "#2e4053", "#566573", "#7b8a8b"]
    };

    var EXAMPLES = {
        sales: {
            label: gettext("Monthly sales"),
            data: gettext("January") + ",120\n" + gettext("February") + ",190\n" + gettext("March") + ",80\n" + gettext("April") + ",20\n" + gettext("May") + ",150\n" + gettext("June") + ",210"
        },
        budget: {
            label: gettext("Budget vs actual"),
            data: gettext("Label") + "," + gettext("Planned") + "," + gettext("Actual") + "\nMarketing,5000,4800\nR&D,12000,12500\nSales,8000,7200\nSupport,3000,3100"
        },
        survey: {
            label: gettext("Survey results"),
            data: gettext("Yes") + ",45\n" + gettext("No") + ",30\n" + gettext("Maybe") + ",15\n" + gettext("No answer") + ",10"
        }
    };

    var activeExampleKey = "";

    var VIZ_LABEL_I18N = {
        "January": { en: "January", it: "Gennaio" },
        "February": { en: "February", it: "Febbraio" },
        "March": { en: "March", it: "Marzo" },
        "April": { en: "April", it: "Aprile" },
        "May": { en: "May", it: "Maggio" },
        "June": { en: "June", it: "Giugno" },
        "Label": { en: "Label", it: "Etichetta" },
        "Planned": { en: "Planned", it: "Pianificato" },
        "Actual": { en: "Actual", it: "Effettivo" },
        "Yes": { en: "Yes", it: "Sì" },
        "No": { en: "No", it: "No" },
        "Maybe": { en: "Maybe", it: "Forse" },
        "No answer": { en: "No answer", it: "Nessuna risposta" },
        "Other": { en: "Other", it: "Altro" },
        "Value": { en: "Value", it: "Valore" },
        "Monthly sales": { en: "Monthly sales", it: "Vendite mensili" },
        "Budget vs actual": { en: "Budget vs actual", it: "Budget vs effettivi" },
        "Survey results": { en: "Survey results", it: "Risultati sondaggio" }
    };

    function getVizLabelLookup() {
        var lookup = Object.create(null);
        Object.keys(VIZ_LABEL_I18N).forEach(function(msgid) {
            var localized = typeof gettext === "function" ? gettext(msgid) : msgid;
            var pair = VIZ_LABEL_I18N[msgid];
            lookup[msgid] = localized;
            if (pair.en) lookup[pair.en] = localized;
            if (pair.it) lookup[pair.it] = localized;
        });
        return lookup;
    }

    function translateVizToken(token, lookup) {
        var trimmed = String(token || "").trim();
        if (!trimmed) return token;
        return lookup[trimmed] != null ? lookup[trimmed] : token;
    }

    function translateVizCsvData(data, lookup) {
        if (!data) return data;
        return String(data).split("\n").map(function(line) {
            if (!line.trim()) return line;
            return line.split(",").map(function(cell) {
                return translateVizToken(cell, lookup);
            }).join(",");
        }).join("\n");
    }

    function exampleDataSignature(data) {
        var lines = String(data || "").trim().split(/\n+/).filter(function(line) {
            return line.trim();
        });
        if (!lines.length) return "";
        return lines.map(function(line, index) {
            var parts = line.split(",");
            if (parts.length <= 1) return line.trim();
            var valueParts = parts.slice(1);
            var allNumeric = valueParts.length > 0 && valueParts.every(function(part) {
                return part.trim() !== "" && !isNaN(parseFloat(part.trim()));
            });
            if (index === 0 && parts.length > 2 && !allNumeric) {
                return "H" + parts.length;
            }
            if (parts.length > 2) {
                return valueParts.join(",");
            }
            return parts[parts.length - 1].trim();
        }).join("|");
    }

    function detectExampleKey(data, title) {
        var sig = exampleDataSignature(data);
        if (!sig) return "";
        var found = "";
        Object.keys(EXAMPLES).forEach(function(key) {
            if (exampleDataSignature(EXAMPLES[key].data) === sig) found = key;
        });
        return found;
    }

    function syncExampleButtonSelection(key) {
        document.querySelectorAll(".viz-example-btn").forEach(function(btn) {
            btn.classList.toggle("selected", !!key && btn.getAttribute("data-example") === key);
        });
    }

    function localizePersistedContent(state) {
        if (!state) return state;
        if (typeof window.gadlyLocalizeVizState === "function") {
            var localized = window.gadlyLocalizeVizState(state);
            activeExampleKey = localized.exampleKey || "";
            return localized;
        }
        var localized = Object.assign({}, state);
        var key = localized.exampleKey || detectExampleKey(localized.data, localized.title);
        if (key && EXAMPLES[key]) {
            localized.data = EXAMPLES[key].data;
            localized.title = EXAMPLES[key].label;
            localized.exampleKey = key;
            activeExampleKey = key;
            return localized;
        }
        var lookup = getVizLabelLookup();
        if (localized.data) localized.data = translateVizCsvData(localized.data, lookup);
        if (localized.title != null && String(localized.title).trim() !== "") {
            localized.title = translateVizToken(String(localized.title), lookup);
        }
        activeExampleKey = key || "";
        localized.exampleKey = activeExampleKey;
        return localized;
    }

    // --- Textarea auto-resize ---
    var resizeDataInput = null;
    if (dataInput) {
        var MOBILE_DATA_INPUT_MAX = 280;
        var DESKTOP_DATA_INPUT_MAX = 750;
        var DESKTOP_DATA_INPUT_DEFAULT = 160;

        function getDataInputMaxHeight() {
            return isMobileView() ? MOBILE_DATA_INPUT_MAX : DESKTOP_DATA_INPUT_MAX;
        }

        var placeholderFloorPx = 0;

        function capturePlaceholderFloor() {
            if (!isMobileView() && !String(dataInput.value || "").trim()) {
                placeholderFloorPx = DESKTOP_DATA_INPUT_DEFAULT;
                return;
            }
            var clone = dataInput.cloneNode(false);
            clone.removeAttribute("id");
            var ph = dataInput.getAttribute("placeholder") || "";
            if (ph) clone.setAttribute("placeholder", ph);
            clone.setAttribute("rows", dataInput.getAttribute("rows") || "5");
            clone.value = "";
            clone.style.cssText = "position:fixed;left:-9999px;top:0;visibility:hidden;pointer-events:none;height:auto;min-height:0;width:" + dataInput.offsetWidth + "px;";
            document.body.appendChild(clone);
            var measured = clone.scrollHeight;
            document.body.removeChild(clone);
            var cssMin = parseFloat(window.getComputedStyle(dataInput).minHeight);
            if (!(cssMin > 0)) cssMin = isMobileView() ? 130 : DESKTOP_DATA_INPUT_DEFAULT;
            placeholderFloorPx = Math.max(measured, cssMin);
        }

        function applyHeight(px) {
            var maxH = getDataInputMaxHeight();
            var h = Math.min(Math.max(px, placeholderFloorPx), maxH);
            dataInput.style.height = h + "px";
            dataInput.classList.toggle("viz-data-input-scroll", h >= maxH);
        }

        function syncDataInputContentClass() {
            var has = !!String(dataInput.value || "").trim();
            dataInput.classList.toggle("viz-data-input-has-content", has);
            if (!has && !isMobileView()) {
                dataInput.style.height = "";
                dataInput.classList.remove("viz-data-input-scroll");
            }
        }

        function autoResize() {
            syncDataInputContentClass();
            /* Desktop empty: never touch height — CSS owns 160px */
            if (!isMobileView() && !String(dataInput.value || "").trim()) {
                return;
            }
            if (!isMobileView()) {
                placeholderFloorPx = DESKTOP_DATA_INPUT_DEFAULT;
            }
            var prevHeight = dataInput.style.height;
            dataInput.style.height = "auto";
            var sh = dataInput.scrollHeight;
            if (prevHeight) dataInput.style.height = prevHeight;
            applyHeight(Math.max(sh, placeholderFloorPx));
        }

        resizeDataInput = function() {
            if (!isMobileView() && !String(dataInput.value || "").trim()) {
                syncDataInputContentClass();
                return;
            }
            capturePlaceholderFloor();
            autoResize();
        };
        dataInput.addEventListener("input", function() {
            autoResize();
            /* Non auto-selezionare i bottoni esempio mentre digiti/ripristini i dati */
            if (activeExampleKey) {
                var detected = detectExampleKey(dataInput.value, chartTitleInput ? chartTitleInput.value : "") || "";
                if (detected !== activeExampleKey) {
                    activeExampleKey = "";
                    syncExampleButtonSelection("");
                }
            }
            updatePreview();
            updateStats();
            saveState();
            if (autoGenerateCheck && autoGenerateCheck.checked) {
                scheduleAutoGenerate();
            }
        });
        /* Desktop: skip init resize — was jumping the main container on refresh */
        if (isMobileView()) {
            capturePlaceholderFloor();
            autoResize();
            window.addEventListener("resize", function() {
                if (!isMobileView()) return;
                capturePlaceholderFloor();
                autoResize();
            });
        } else {
            placeholderFloorPx = DESKTOP_DATA_INPUT_DEFAULT;
            syncDataInputContentClass();
        }
    }

    var autoGenerateTimer = null;
    function runAutoGenerateChart() {
        var parsed = parseData(dataInput ? dataInput.value : "");
        if (parsed.labels.length === 0) return false;
        showChartContainer();

        function drawChart() {
            whenChartJsReady(function () {
                requestAnimationFrame(function () {
                    generateChart();
                });
            });
        }

        drawChart();
        return true;
    }

    function shouldRestoreChartState(state) {
        if (!state || !state.data || !String(state.data).trim()) return false;
        if (state.chartVisible) return true;
        return state.autoGenerate !== false;
    }

    function scheduleAutoGenerate(delayMs) {
        if (delayMs == null) delayMs = 400;
        if (autoGenerateTimer) clearTimeout(autoGenerateTimer);
        if (delayMs <= 0) {
            autoGenerateTimer = null;
            runAutoGenerateChart();
            return;
        }
        autoGenerateTimer = setTimeout(function () {
            autoGenerateTimer = null;
            runAutoGenerateChart();
        }, delayMs);
    }

    // --- Custom selects (stesso pattern text-tool-select degli altri tool) ---
    function syncTextToolSelect(selectEl) {
        if (!selectEl) return;
        var wrap = selectEl.closest(".text-tool-select");
        if (!wrap) return;
        var trigger = wrap.querySelector(".text-tool-select-trigger");
        var menu = wrap.querySelector(".text-tool-select-menu");
        var opt = selectEl.options[selectEl.selectedIndex];
        if (trigger && opt) trigger.textContent = opt.text;
        if (menu) {
            menu.querySelectorAll("li").forEach(function(li) {
                li.classList.toggle("selected", li.dataset.value === selectEl.value);
            });
        }
    }

    function initTextToolSelectFromNative(selectEl, onPick) {
        if (!selectEl) return;
        var wrap = selectEl.closest(".text-tool-select");
        if (!wrap || wrap.dataset.selectReady) return;

        var trigger = wrap.querySelector(".text-tool-select-trigger");
        var menu = wrap.querySelector(".text-tool-select-menu");
        if (!trigger || !menu) return;

        menu.innerHTML = "";
        for (var i = 0; i < selectEl.options.length; i++) {
            (function(opt) {
                var li = document.createElement("li");
                li.dataset.value = opt.value;
                li.textContent = opt.text;
                if (opt.selected) li.classList.add("selected");
                li.addEventListener("click", function(e) {
                    e.stopPropagation();
                    selectEl.value = opt.value;
                    syncTextToolSelect(selectEl);
                    wrap.classList.remove("open");
                    selectEl.dispatchEvent(new Event("change", { bubbles: true }));
                    if (onPick) onPick(opt.value);
                });
                menu.appendChild(li);
            })(selectEl.options[i]);
        }

        trigger.addEventListener("click", function(e) {
            e.stopPropagation();
            var wasOpen = wrap.classList.contains("open");
            document.querySelectorAll(".data-viz .text-tool-select.open").forEach(function(w) {
                w.classList.remove("open");
            });
            if (!wasOpen) wrap.classList.add("open");
        });
        menu.addEventListener("click", function(e) { e.stopPropagation(); });

        syncTextToolSelect(selectEl);
        wrap.dataset.selectReady = "1";
    }

    function onManualChartTypeSelected(value) {
        if (autoChartTypeCheck) autoChartTypeCheck.checked = false;
        if (value !== "bar" && horizontalBarCheck) horizontalBarCheck.checked = false;
        saveState();
        regenerateChartIfDataReady();
    }

    document.addEventListener("click", function() {
        document.querySelectorAll(".data-viz .text-tool-select.open").forEach(function(w) {
            w.classList.remove("open");
        });
    });

    initTextToolSelectFromNative(chartTypeSelect, onManualChartTypeSelected);
    initTextToolSelectFromNative(paletteSelect);
    initTextToolSelectFromNative(sortSelect);

    // --- CSV parsing ---
    function detectDelimiter(line) {
        var tabs = (line.match(/\t/g) || []).length;
        var commas = (line.match(/,/g) || []).length;
        var semis = (line.match(/;/g) || []).length;
        if (tabs > commas && tabs >= semis) return "\t";
        return semis > commas ? ";" : ",";
    }

    function parseCsvLine(line, delim) {
        var parts = [];
        var current = "";
        var inQuotes = false;
        for (var i = 0; i < line.length; i++) {
            var ch = line[i];
            if (ch === "\"") {
                if (inQuotes && line[i + 1] === "\"") {
                    current += "\"";
                    i++;
                } else {
                    inQuotes = !inQuotes;
                }
            } else if (ch === delim && !inQuotes) {
                parts.push(current.trim());
                current = "";
            } else {
                current += ch;
            }
        }
        parts.push(current.trim());
        return parts;
    }

    function normalizeNumber(raw) {
        if (raw == null) return NaN;
        var s = String(raw).trim().replace(/\s/g, "");
        if (!s) return NaN;
        if (/^\d{1,3}(\.\d{3})+,\d+$/.test(s)) {
            s = s.replace(/\./g, "").replace(",", ".");
        } else {
            s = s.replace(",", ".");
        }
        return parseFloat(s);
    }

    function isHeaderRow(parts) {
        if (!parts || parts.length < 2) return false;
        var a = String(parts[0]).toLowerCase();
        var b = String(parts[1]).toLowerCase();
        var labelWords = ["label", "etichetta", "nome", "name", "category", "categoria", "mese", "month"];
        var valueWords = ["value", "valore", "valori", "values", "amount", "importo", "planned", "actual", "pianificato", "effettivo"];
        if (labelWords.indexOf(a) >= 0) return true;
        if (valueWords.indexOf(b) >= 0) return true;
        var numericAfterFirst = 0;
        for (var i = 1; i < parts.length; i++) {
            if (!isNaN(normalizeNumber(parts[i]))) numericAfterFirst++;
        }
        return numericAfterFirst === 0;
    }

    function parseData(text) {
        var lines = text.trim().split(/\r?\n/).filter(function(line) { return line.trim(); });
        var labels = [];
        var datasets = [];
        if (lines.length === 0) {
            return { labels: labels, datasets: datasets };
        }
        var delim = detectDelimiter(lines[0]);
        var start = 0;
        var firstParts = parseCsvLine(lines[0], delim);
        var seriesNames = [];
        if (isHeaderRow(firstParts)) {
            start = 1;
            for (var h = 1; h < firstParts.length; h++) {
                seriesNames.push(firstParts[h] || (vizTxt("series", "Series") + " " + h));
            }
        } else if (firstParts.length > 2) {
            for (var s = 1; s < firstParts.length; s++) {
                seriesNames.push(vizTxt("series", "Series") + " " + s);
            }
        } else {
            seriesNames.push(vizTxt("value", "Value"));
        }

        for (var si = 0; si < seriesNames.length; si++) {
            datasets.push({ label: seriesNames[si], values: [] });
        }

        for (var i = start; i < lines.length; i++) {
            var parts = parseCsvLine(lines[i], delim);
            if (parts.length >= 2) {
                labels.push(parts[0]);
                for (var d = 0; d < datasets.length; d++) {
                    var val = normalizeNumber(parts[d + 1]);
                    datasets[d].values.push(isNaN(val) ? 0 : val);
                }
            } else if (parts.length === 1 && parts[0]) {
                var singleVal = normalizeNumber(parts[0]);
                if (!isNaN(singleVal)) {
                    labels.push(vizTxt("item", "Item") + " " + (labels.length + 1));
                    datasets[0].values.push(singleVal);
                    for (var d2 = 1; d2 < datasets.length; d2++) {
                        datasets[d2].values.push(0);
                    }
                }
            }
        }

        datasets = datasets.filter(function(ds) {
            return ds.values.some(function(v) { return v !== 0 || ds.values.length > 0; });
        });
        if (datasets.length === 0) {
            datasets.push({ label: gettext("Value"), values: [] });
        }
        return { labels: labels, datasets: datasets };
    }

    function getAllValues(parsed) {
        var vals = [];
        parsed.datasets.forEach(function(ds) {
            ds.values.forEach(function(v) {
                if (!isNaN(v)) vals.push(v);
            });
        });
        return vals;
    }

    function sortParsedData(parsed, sortMode) {
        if (!sortMode || sortMode === "none" || parsed.labels.length === 0) return parsed;
        var indices = parsed.labels.map(function(_, idx) { return idx; });
        indices.sort(function(a, b) {
            if (sortMode === "label-asc") return String(parsed.labels[a]).localeCompare(String(parsed.labels[b]));
            if (sortMode === "label-desc") return String(parsed.labels[b]).localeCompare(String(parsed.labels[a]));
            var sumA = parsed.datasets.reduce(function(s, ds) { return s + (ds.values[a] || 0); }, 0);
            var sumB = parsed.datasets.reduce(function(s, ds) { return s + (ds.values[b] || 0); }, 0);
            if (sortMode === "value-asc") return sumA - sumB;
            if (sortMode === "value-desc") return sumB - sumA;
            return 0;
        });
        return {
            labels: indices.map(function(i) { return parsed.labels[i]; }),
            datasets: parsed.datasets.map(function(ds) {
                return { label: ds.label, values: indices.map(function(i) { return ds.values[i]; }) };
            })
        };
    }

    function applyTopN(parsed, topN) {
        var n = parseInt(topN, 10);
        if (!n || n < 2 || parsed.labels.length <= n) return parsed;
        if (parsed.datasets.length > 1) return parsed;
        var values = parsed.datasets[0].values;
        var pairs = parsed.labels.map(function(l, i) { return { label: l, value: values[i] || 0 }; });
        pairs.sort(function(a, b) { return b.value - a.value; });
        var top = pairs.slice(0, n - 1);
        var otherSum = pairs.slice(n - 1).reduce(function(s, p) { return s + p.value; }, 0);
        return {
            labels: top.map(function(p) { return p.label; }).concat([gettext("Other")]),
            datasets: [{ label: parsed.datasets[0].label, values: top.map(function(p) { return p.value; }).concat([otherSum]) }]
        };
    }

    function suggestChartType(parsed) {
        if (parsed.datasets.length > 1) return "bar";
        var n = parsed.labels.length;
        if (n <= 0) return "bar";
        if (n <= 6) return "pie";
        var monthRe = /^(jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec|gen|feb|mar|apr|mag|giu|lug|ago|set|ott|nov|dic)/i;
        var monthHits = parsed.labels.filter(function(l) { return monthRe.test(String(l).trim()); }).length;
        if (monthHits >= n * 0.5 || n >= 8) return "line";
        return "bar";
    }

    function csvTextToTextareaContent(text) {
        var parsed = parseData(text);
        if (parsed.labels.length === 0) return null;
        var lines = [];
        if (parsed.datasets.length > 1) {
            lines.push([gettext("Label")].concat(parsed.datasets.map(function(ds) { return ds.label; })).join(","));
        }
        parsed.labels.forEach(function(label, idx) {
            var safeLabel = String(label).indexOf(",") >= 0 ? "\"" + String(label).replace(/"/g, "\"\"") + "\"" : String(label);
            var row = [safeLabel].concat(parsed.datasets.map(function(ds) { return ds.values[idx]; }));
            lines.push(row.join(","));
        });
        return lines.join("\n");
    }

    function buildTemplateCsv(withExample) {
        var header = gettext("Label") + "," + gettext("Value");
        var lines = [header];
        if (withExample) {
            lines.push(
                gettext("January") + ",120",
                gettext("February") + ",190",
                gettext("March") + ",80",
                gettext("April") + ",20"
            );
        }
        return "\uFEFF" + lines.join("\r\n");
    }

    function downloadBlobFile(filename, blob) {
        var url = URL.createObjectURL(blob);
        var link = document.createElement("a");
        link.href = url;
        link.download = filename;
        link.style.display = "none";
        document.body.appendChild(link);
        link.click();
        setTimeout(function() {
            URL.revokeObjectURL(url);
            if (link.parentNode) link.parentNode.removeChild(link);
        }, 500);
    }

    function downloadCsvFile(filename, content) {
        downloadBlobFile(filename, new Blob([content], { type: "text/csv;charset=utf-8" }));
    }

    function showDataMessage(message, isError, skipScroll) {
        if (!resultArea) return;
        resultArea.textContent = message;
        resultArea.classList.toggle("error", !!isError);
        resultArea.classList.remove("hidden");
        if (!skipScroll) {
            resultArea.scrollIntoView({ behavior: "smooth", block: "nearest" });
        }
    }

    function clearDataMessage() {
        if (!resultArea) return;
        resultArea.classList.remove("error");
        resultArea.classList.add("hidden");
    }

    function applyTextareaContent(text, autoGen) {
        if (!dataInput) return false;
        var normalized = csvTextToTextareaContent(text);
        if (!normalized) return false;
        dataInput.value = normalized;
        dataInput.dispatchEvent(new Event("input", { bubbles: true }));
        updatePreview();
        updateStats();
        saveState();
        if (autoGen || (autoGenerateCheck && autoGenerateCheck.checked)) {
            generateChart();
        }
        return true;
    }

    function vizTxt(key, enFallback) {
        var i18n = window.__vizBootI18n;
        if (i18n && i18n[key]) return i18n[key];
        if (typeof gettext === "function") {
            try { return gettext(enFallback || key); } catch (e) { /* ignore */ }
        }
        return enFallback || key;
    }

    function displayColumnHeader(name) {
        var normalized = String(name || "").trim().toLowerCase();
        if (normalized === "label" || normalized === "etichetta" || normalized === "nome" || normalized === "name") {
            return vizTxt("label", "Label");
        }
        if (normalized === "value" || normalized === "values" || normalized === "valore" || normalized === "valori") {
            return vizTxt("value", "Value");
        }
        return name;
    }

    function updatePreview() {
        if (!previewWrap || !previewTable || !dataInput) return;
        var parsed = parseData(dataInput.value);
        if (parsed.labels.length === 0) {
            previewWrap.classList.add("hidden");
            previewTable.innerHTML = "";
            return;
        }
        var cols = [vizTxt("label", "Label")].concat(parsed.datasets.map(function(ds) { return displayColumnHeader(ds.label); }));
        var html = "<thead><tr>" + cols.map(function(c) { return "<th>" + escapeHtml(c) + "</th>"; }).join("") + "</tr></thead><tbody>";
        var max = Math.min(parsed.labels.length, PREVIEW_MAX_ROWS);
        for (var i = 0; i < max; i++) {
            html += "<tr><td>" + escapeHtml(parsed.labels[i]) + "</td>";
            parsed.datasets.forEach(function(ds) {
                html += "<td>" + escapeHtml(formatNumber(ds.values[i])) + "</td>";
            });
            html += "</tr>";
        }
        if (parsed.labels.length > PREVIEW_MAX_ROWS) {
            html += "<tr><td colspan=\"" + cols.length + "\" class=\"viz-preview-more\">" +
                escapeHtml(vizTxt("moreRows", "… and %(count)s more rows").replace("%(count)s", String(parsed.labels.length - PREVIEW_MAX_ROWS))) +
                "</td></tr>";
        }
        html += "</tbody>";
        previewTable.innerHTML = html;
        previewWrap.classList.remove("hidden");
    }

    function escapeHtml(s) {
        return String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
    }

    function getLocale() {
        var lang = (document.documentElement.lang || "en").slice(0, 2);
        return lang === "it" ? "it-IT" : "en-US";
    }

    function formatNumber(n) {
        if (n == null || isNaN(n)) return "";
        return new Intl.NumberFormat(getLocale(), { maximumFractionDigits: 2 }).format(n);
    }

    function formatTick(value) {
        var unit = yAxisUnitInput ? yAxisUnitInput.value.trim() : "";
        var formatted = formatNumber(value);
        return unit ? formatted + unit : formatted;
    }

    function drawOutlinedText(ctx, text, x, y, fillColor, outlineColor) {
        if (!text) return;
        ctx.fillStyle = fillColor;
        ctx.strokeStyle = outlineColor || "rgba(255,255,255,0.92)";
        ctx.lineWidth = 4;
        ctx.lineJoin = "round";
        ctx.strokeText(text, x, y);
        ctx.fillText(text, x, y);
    }

    function getChartAreaBounds(chartInstance) {
        var area = chartInstance.chartArea;
        if (!area) {
            return {
                left: 0,
                right: chartInstance.width || 0,
                top: 0,
                bottom: chartInstance.height || 0
            };
        }
        return {
            left: area.left,
            right: area.right,
            top: area.top,
            bottom: area.bottom
        };
    }

    function clampLineLabelCenterX(x, textWidth, bounds, edgePad) {
        edgePad = edgePad == null ? 8 : edgePad;
        var half = textWidth / 2;
        var minX = bounds.left + edgePad + half;
        var maxX = bounds.right - edgePad - half;
        if (minX > maxX) return (bounds.left + bounds.right) / 2;
        return Math.max(minX, Math.min(maxX, x));
    }

    function fitLineLabelRowStart(xStart, totalWidth, bounds, edgePad) {
        edgePad = edgePad == null ? 8 : edgePad;
        var minStart = bounds.left + edgePad;
        var maxStart = bounds.right - edgePad - totalWidth;
        if (maxStart < minStart) return Math.max(minStart, (bounds.left + bounds.right - totalWidth) / 2);
        if (xStart < minStart) return minStart;
        if (xStart > maxStart) return maxStart;
        return xStart;
    }

    function layoutLineValueLabels(ctx, chartInstance, parsed, formatValue) {
        var layouts = {};
        var padAbove = 12;
        var hGap = 8;
        var clusterThreshold = 18;
        var bounds = getChartAreaBounds(chartInstance);

        parsed.labels.forEach(function(_, index) {
            var items = [];
            parsed.datasets.forEach(function(ds, dsIndex) {
                var meta = chartInstance.getDatasetMeta(dsIndex);
                if (!meta || meta.hidden) return;
                var element = meta.data[index];
                if (!element || element.hidden) return;
                var num = ds.values[index];
                if (num == null || isNaN(num)) return;
                var text = formatValue(num);
                if (!text) return;
                items.push({
                    dsIndex: dsIndex,
                    px: element.x,
                    py: element.y,
                    text: text,
                    width: ctx.measureText(text).width
                });
            });

            if (items.length === 0) return;

            if (items.length === 1) {
                var single = items[0];
                layouts[single.dsIndex + ":" + index] = {
                    x: clampLineLabelCenterX(single.px, single.width, bounds),
                    y: single.py - padAbove
                };
                return;
            }

            items.sort(function(a, b) { return a.py - b.py; });

            var clusters = [];
            items.forEach(function(item) {
                var merged = false;
                for (var c = 0; c < clusters.length; c++) {
                    if (Math.abs(item.py - clusters[c].refY) < clusterThreshold) {
                        clusters[c].items.push(item);
                        merged = true;
                        break;
                    }
                }
                if (!merged) {
                    clusters.push({ refY: item.py, items: [item] });
                }
            });

            clusters.forEach(function(cluster) {
                cluster.items.sort(function(a, b) { return a.dsIndex - b.dsIndex; });
                var topY = Math.min.apply(null, cluster.items.map(function(it) { return it.py; }));
                var anchorY = topY - padAbove;
                var centerX = cluster.items.reduce(function(sum, it) { return sum + it.px; }, 0) / cluster.items.length;

                if (cluster.items.length === 1) {
                    var lone = cluster.items[0];
                    layouts[lone.dsIndex + ":" + index] = {
                        x: clampLineLabelCenterX(lone.px, lone.width, bounds),
                        y: anchorY
                    };
                    return;
                }

                var totalWidth = cluster.items.reduce(function(sum, it, i) {
                    return sum + it.width + (i > 0 ? hGap : 0);
                }, 0);
                var xStart = fitLineLabelRowStart(centerX - totalWidth / 2, totalWidth, bounds);
                cluster.items.forEach(function(it) {
                    layouts[it.dsIndex + ":" + index] = {
                        x: xStart + it.width / 2,
                        y: anchorY
                    };
                    xStart += it.width + hGap;
                });
            });
        });

        return layouts;
    }

    function layoutPieSliceValueLabels(ctx, chartInstance, parsed, formatValue, chartType, textColor) {
        var layouts = {};
        var meta = chartInstance.getDatasetMeta(0);
        if (!meta || !parsed.datasets[0]) return layouts;

        var ds = parsed.datasets[0];
        var labelHeight = 14;
        var labelPad = 3;

        function sliceRadii(el) {
            var innerR = chartType === "doughnut" ? (el.innerRadius || 0) : 0;
            var outerR = el.outerRadius || 0;
            return { innerR: innerR, outerR: outerR, depth: outerR - innerR };
        }

        function pointAt(el, angle, factor) {
            var radii = sliceRadii(el);
            var r = radii.innerR + radii.depth * factor;
            return { x: el.x + Math.cos(angle) * r, y: el.y + Math.sin(angle) * r };
        }

        function textFitsArc(item, textWidth, factor) {
            var radii = sliceRadii(item.element);
            if (radii.depth < 20) return false;
            var midR = radii.innerR + radii.depth * factor;
            var angularHalf = Math.atan2(textWidth / 2 + labelPad, Math.max(midR, 8));
            return angularHalf * 2 <= item.arcSpan * 0.88;
        }

        function labelBox(layout) {
            return {
                left: layout.x - layout.textWidth / 2 - labelPad,
                right: layout.x + layout.textWidth / 2 + labelPad,
                top: layout.y - labelHeight / 2 - labelPad,
                bottom: layout.y + labelHeight / 2 + labelPad
            };
        }

        function boxesOverlap(a, b) {
            var ba = labelBox(a);
            var bb = labelBox(b);
            return ba.left < bb.right && ba.right > bb.left && ba.top < bb.bottom && ba.bottom > bb.top;
        }

        var items = [];
        meta.data.forEach(function(element, index) {
            if (!element || element.hidden) return;
            var num = ds.values[index];
            if (num == null || isNaN(num)) return;
            var category = parsed.labels[index] || "";
            var valueText = formatValue(num);
            if (!valueText) return;
            var fullText = category ? category + ": " + valueText : valueText;
            items.push({
                index: index,
                element: element,
                midAngle: (element.startAngle + element.endAngle) / 2,
                arcSpan: element.endAngle - element.startAngle,
                startAngle: element.startAngle,
                endAngle: element.endAngle,
                fullText: fullText,
                shortText: valueText,
                fullWidth: ctx.measureText(fullText).width,
                shortWidth: ctx.measureText(valueText).width
            });
        });

        var baseFactor = chartType === "doughnut" ? 0.68 : chartType === "polarArea" ? 0.58 : 0.64;
        var maxLabelFactor = 0.84;
        var useShortText = false;
        items.forEach(function(item) {
            if (!textFitsArc(item, item.fullWidth, baseFactor)) useShortText = true;
        });

        items.forEach(function(item) {
            item.displayText = useShortText ? item.shortText : item.fullText;
            item.textWidth = useShortText ? item.shortWidth : item.fullWidth;
        });

        items.forEach(function(item) {
            var pt = pointAt(item.element, item.midAngle, baseFactor);
            layouts[item.index] = {
                x: pt.x,
                y: pt.y,
                angle: item.midAngle,
                factor: baseFactor,
                align: "center",
                baseline: "middle",
                fillColor: "#ffffff",
                outlineColor: "rgba(0,0,0,0.65)",
                textWidth: item.textWidth,
                displayText: item.displayText,
                element: item.element,
                startAngle: item.startAngle,
                endAngle: item.endAngle
            };
        });

        function syncLayoutPosition(layout) {
            var pt = pointAt(layout.element, layout.angle, layout.factor);
            layout.x = pt.x;
            layout.y = pt.y;
        }

        for (var pass = 0; pass < 12; pass++) {
            var moved = false;
            for (var i = 0; i < items.length; i++) {
                for (var j = i + 1; j < items.length; j++) {
                    var li = layouts[items[i].index];
                    var lj = layouts[items[j].index];
                    if (!boxesOverlap(li, lj)) continue;
                    if (li.factor < maxLabelFactor) {
                        li.factor += 0.035;
                        syncLayoutPosition(li);
                        moved = true;
                    }
                    if (lj.factor < maxLabelFactor) {
                        lj.factor += 0.035;
                        syncLayoutPosition(lj);
                        moved = true;
                    }
                }
            }
            if (!moved) break;
        }

        for (var pass2 = 0; pass2 < 8; pass2++) {
            var nudged = false;
            for (var i2 = 0; i2 < items.length; i2++) {
                for (var j2 = i2 + 1; j2 < items.length; j2++) {
                    var la = layouts[items[i2].index];
                    var lb = layouts[items[j2].index];
                    if (!boxesOverlap(la, lb)) continue;
                    var margin = 0.06;
                    var minA = la.startAngle + margin;
                    var maxA = la.endAngle - margin;
                    var minB = lb.startAngle + margin;
                    var maxB = lb.endAngle - margin;
                    if (la.angle > lb.angle) {
                        la.angle = Math.min(maxA, la.angle + 0.04);
                        lb.angle = Math.max(minB, lb.angle - 0.04);
                    } else {
                        la.angle = Math.max(minA, la.angle - 0.04);
                        lb.angle = Math.min(maxB, lb.angle + 0.04);
                    }
                    syncLayoutPosition(la);
                    syncLayoutPosition(lb);
                    nudged = true;
                }
            }
            if (!nudged) break;
        }

        return layouts;
    }

    function getMobileOutlinedLabelColors() {
        if (!isMobileView()) return null;
        return {
            fill: isDarkMode() ? "#003f7f" : "#001a33",
            outline: "rgba(255,255,255,0.95)"
        };
    }

    function getLineValueLabelColors(multiSeries, dsColor) {
        if (!isMobileView()) {
            if (multiSeries && dsColor) {
                return { fill: dsColor, outline: "rgba(255,255,255,0.95)" };
            }
            return null;
        }
        return getMobileOutlinedLabelColors();
    }

    function drawParsedValueLabels(chartInstance, labelData) {
        if (!labelData || !labelData.enabled || !chartInstance || !chartInstance.ctx) return;

        var parsed = labelData.parsed;
        var chartType = labelData.chartType;
        var indexAxis = labelData.indexAxis || "x";
        var formatValue = labelData.formatValue || formatTick;
        var textColor = labelData.textColor || "#003f7f";
        var ctx = chartInstance.ctx;
        var isSlice = chartType === "pie" || chartType === "doughnut" || chartType === "polarArea";
        var multiSeries = parsed.datasets.length > 1;

        ctx.save();
        ctx.font = multiSeries ? "700 12px Arial, sans-serif" : "700 14px Arial, sans-serif";

        var lineLabelLayouts = chartType === "line"
            ? layoutLineValueLabels(ctx, chartInstance, parsed, formatValue)
            : null;
        var pieLabelLayouts = isSlice
            ? layoutPieSliceValueLabels(ctx, chartInstance, parsed, formatValue, chartType, textColor)
            : null;

        parsed.datasets.forEach(function(ds, dsIndex) {
            var meta = chartInstance.getDatasetMeta(dsIndex);
            if (!meta || meta.hidden) return;

            meta.data.forEach(function(element, index) {
                if (!element || element.hidden) return;
                var num = ds.values[index];
                if (num == null || isNaN(num)) return;

                var valueText = formatValue(num);
                if (!valueText) return;

                var category = parsed.labels[index] || "";
                var displayText = valueText;
                if (isSlice) {
                    var pieText = pieLabelLayouts && pieLabelLayouts[index] && pieLabelLayouts[index].displayText;
                    displayText = pieText || (category ? category + ": " + valueText : valueText);
                }

                var x = element.x;
                var y = element.y;
                var fillColor = textColor;
                var outlineColor = "rgba(255,255,255,0.92)";

                if (chartType === "bar") {
                    ctx.textAlign = "center";
                    ctx.textBaseline = "middle";
                    if (indexAxis === "y") {
                        var leftX = Math.min(element.x, element.base);
                        var rightX = Math.max(element.x, element.base);
                        var barWidth = rightX - leftX;
                        if (!multiSeries && barWidth >= 36) {
                            x = leftX + barWidth / 2;
                            y = element.y;
                            fillColor = "#ffffff";
                            outlineColor = "rgba(0,0,0,0.65)";
                        } else {
                            x = rightX + 6;
                            y = element.y;
                            ctx.textAlign = "left";
                            ctx.textBaseline = "middle";
                            var outsideBarColorsH = getMobileOutlinedLabelColors();
                            fillColor = outsideBarColorsH ? outsideBarColorsH.fill : textColor;
                            outlineColor = outsideBarColorsH ? outsideBarColorsH.outline : "rgba(255,255,255,0.95)";
                        }
                    } else {
                        var topY = Math.min(element.y, element.base);
                        var bottomY = Math.max(element.y, element.base);
                        var barHeight = bottomY - topY;
                        if (!multiSeries && barHeight >= 26) {
                            x = element.x;
                            y = topY + barHeight / 2;
                            fillColor = "#ffffff";
                            outlineColor = "rgba(0,0,0,0.65)";
                        } else {
                            x = element.x;
                            y = topY - 6;
                            ctx.textBaseline = "bottom";
                            var outsideBarColorsV = getMobileOutlinedLabelColors();
                            fillColor = outsideBarColorsV ? outsideBarColorsV.fill : textColor;
                            outlineColor = outsideBarColorsV ? outsideBarColorsV.outline : "rgba(255,255,255,0.95)";
                        }
                    }
                } else if (chartType === "line") {
                    ctx.textAlign = "center";
                    ctx.textBaseline = "bottom";
                    var lineLayout = lineLabelLayouts && lineLabelLayouts[dsIndex + ":" + index];
                    if (lineLayout) {
                        x = lineLayout.x;
                        y = lineLayout.y;
                    } else {
                        var lineTextWidth = ctx.measureText(displayText).width;
                        x = clampLineLabelCenterX(element.x, lineTextWidth, getChartAreaBounds(chartInstance));
                        y = element.y - 12;
                    }
                    var dsColor = null;
                    if (multiSeries && chartInstance.data && chartInstance.data.datasets[dsIndex]) {
                        dsColor = chartInstance.data.datasets[dsIndex].borderColor;
                    }
                    var lineLabelColors = getLineValueLabelColors(multiSeries, dsColor);
                    if (lineLabelColors) {
                        fillColor = lineLabelColors.fill;
                        outlineColor = lineLabelColors.outline;
                    }
                } else if (isSlice) {
                    var pieLayout = pieLabelLayouts && pieLabelLayouts[index];
                    if (pieLayout) {
                        x = pieLayout.x;
                        y = pieLayout.y;
                        ctx.textAlign = pieLayout.align || "center";
                        ctx.textBaseline = pieLayout.baseline || "middle";
                        fillColor = pieLayout.fillColor || "#ffffff";
                        outlineColor = pieLayout.outlineColor || "rgba(0,0,0,0.65)";
                    } else {
                        var pos = element.tooltipPosition ? element.tooltipPosition() : null;
                        if (pos) {
                            x = pos.x;
                            y = pos.y;
                        }
                        ctx.textAlign = "center";
                        ctx.textBaseline = "middle";
                        fillColor = "#ffffff";
                        outlineColor = "rgba(0,0,0,0.65)";
                    }
                }

                drawOutlinedText(ctx, displayText, x, y, fillColor, outlineColor);
            });
        });

        ctx.restore();
    }

    function createValueLabelsPlugin(labelCfg) {
        return {
            id: "gadlyParsedValues",
            afterDraw: function(chartInstance) {
                drawParsedValueLabels(chartInstance, labelCfg);
            }
        };
    }

    function createLegendBottomGapPlugin(gapPx) {
        return {
            id: "gadlyLegendBottomGap",
            beforeInit: function(chartInstance) {
                var legend = chartInstance.legend;
                if (!legend || typeof legend.fit !== "function") return;
                var originalFit = legend.fit;
                legend.fit = function () {
                    originalFit.call(legend);
                    legend.height += gapPx;
                };
            }
        };
    }

    var PIE_LEGEND_GAP_PX = { doughnut: 48, pie: 36, polarArea: 36 };

    function getPieLegendGap(type) {
        if (["pie", "doughnut", "polarArea"].indexOf(type) < 0) return 0;
        return PIE_LEGEND_GAP_PX[type] || 36;
    }

    function isPieChartType(type) {
        return ["pie", "doughnut", "polarArea"].indexOf(type) >= 0;
    }

    function getChartViewportSizes(type) {
        var mobile = isMobileView();
        var isPie = isPieChartType(type);
        var baseMin = mobile ? 400 : (isPie ? 440 : 350);
        var baseMax = mobile ? 540 : (isPie ? 540 : 450);
        var gap = getPieLegendGap(type);
        return { min: baseMin + gap, max: baseMax + gap, plotMin: baseMin, plotMax: baseMax };
    }

    function syncChartViewport(type) {
        var preview = chartContainer && chartContainer.querySelector(".chart-preview");
        if (!preview || !canvas) return;
        var sizes = getChartViewportSizes(type);
        var mobile = isMobileView();
        var isPie = isPieChartType(type);
        var gap = getPieLegendGap(type);
        preview.classList.toggle("viz-chart-preview-pie", isPie);
        if (mobile || gap > 0) {
            var canvasHeight = mobile ? (gap > 0 ? sizes.max : sizes.plotMax) : sizes.plotMax;
            preview.style.minHeight = sizes.min + "px";
            preview.style.maxHeight = sizes.max + "px";
            preview.style.height = mobile ? sizes.max + "px" : (isPie ? sizes.plotMax + "px" : "");
            preview.style.aspectRatio = isPie ? "1" : "";
            preview.style.maxWidth = !mobile && isPie ? sizes.plotMax + "px" : "";
            canvas.style.maxHeight = mobile ? "none" : sizes.plotMax + "px";
            canvas.style.minHeight = (mobile || isPie) ? sizes.plotMin + "px" : "";
            canvas.style.height = mobile ? canvasHeight + "px" : "";
            canvas.style.width = mobile ? "100%" : "";
            canvas.style.display = mobile ? "block" : "";
            canvas.style.marginLeft = mobile ? "auto" : "";
            canvas.style.marginRight = mobile ? "auto" : "";
            return;
        }
        preview.style.minHeight = "";
        preview.style.maxHeight = "";
        preview.style.height = "";
        preview.style.aspectRatio = "";
        preview.style.maxWidth = "";
        canvas.style.maxHeight = "";
        canvas.style.minHeight = "";
        canvas.style.width = "";
        canvas.style.height = "";
        canvas.style.display = "";
        canvas.style.marginLeft = "";
        canvas.style.marginRight = "";
    }

    function resetChartViewport() {
        syncChartViewport("bar");
    }

    function updateStats() {
        if (!statsEl || !dataInput) return;
        var parsed = parseData(dataInput.value);
        var vals = getAllValues(parsed);
        if (vals.length === 0) {
            statsEl.classList.add("hidden");
            statsEl.textContent = "";
            return;
        }
        var sum = vals.reduce(function(a, b) { return a + b; }, 0);
        var min = Math.min.apply(null, vals);
        var max = Math.max.apply(null, vals);
        var avg = sum / vals.length;
        statsEl.innerHTML =
            "<span><strong>" + escapeHtml(vizTxt("total", "Total")) + ":</strong> " + escapeHtml(formatNumber(sum)) + "</span>" +
            "<span><strong>" + escapeHtml(vizTxt("average", "Average")) + ":</strong> " + escapeHtml(formatNumber(avg)) + "</span>" +
            "<span><strong>" + escapeHtml(vizTxt("min", "Min")) + ":</strong> " + escapeHtml(formatNumber(min)) + "</span>" +
            "<span><strong>" + escapeHtml(vizTxt("max", "Max")) + ":</strong> " + escapeHtml(formatNumber(max)) + "</span>";
        statsEl.classList.remove("hidden");
    }

    function interpolate(fmt, params, numeric) {
        if (typeof gettext === "function" && typeof ngettext === "function" && numeric) {
            try { return gettext(fmt).replace("%(count)s", params.count); } catch (e) { /* fall through */ }
        }
        return String(fmt).replace("%(count)s", params.count);
    }

    function getPaletteColors(count) {
        var key = paletteSelect ? paletteSelect.value : "gadly";
        var palette = PALETTES[key] || PALETTES.gadly;
        var colors = [];
        for (var i = 0; i < count; i++) {
            colors.push(palette[i % palette.length]);
        }
        return colors;
    }

    function hexToRgba(hex, alpha) {
        if (!hex) return "rgba(0,0,0," + alpha + ")";
        var c = hex.replace("#", "");
        if (c.length === 3) c = c[0] + c[0] + c[1] + c[1] + c[2] + c[2];
        var r = parseInt(c.substring(0, 2), 16);
        var g = parseInt(c.substring(2, 4), 16);
        var b = parseInt(c.substring(4, 6), 16);
        return "rgba(" + r + "," + g + "," + b + "," + alpha + ")";
    }

    function isMobileView() {
        return window.matchMedia && window.matchMedia("(max-width: 768px)").matches;
    }

    function isDarkMode() {
        return document.body.classList.contains("dark-mode");
    }

    function getChartUiColors() {
        if (isMobileView() && isDarkMode()) {
            return { text: "#b0c4de", grid: "rgba(176, 196, 222, 0.45)", angle: "rgba(176, 196, 222, 0.5)", tickBackdrop: "rgba(15, 15, 35, 0.85)" };
        }
        return { text: "#003f7f", grid: "rgba(0, 63, 127, 0.28)", angle: "rgba(0, 63, 127, 0.40)", tickBackdrop: "rgba(255,255,255,0.85)" };
    }

    function getEffectiveChartType(parsed) {
        var type = chartTypeSelect ? chartTypeSelect.value : "bar";

        if (autoChartTypeCheck && autoChartTypeCheck.checked) {
            type = suggestChartType(parsed);
            if (chartTypeSelect) {
                chartTypeSelect.value = type;
                syncTextToolSelect(chartTypeSelect);
            }
        }

        if (horizontalBarCheck && horizontalBarCheck.checked) {
            if (type !== "bar") {
                horizontalBarCheck.checked = false;
                saveState();
            } else {
                return { chartType: "bar", indexAxis: "y" };
            }
        }

        if (type === "horizontalBar") {
            return { chartType: "bar", indexAxis: "y" };
        }
        return { chartType: type, indexAxis: "x" };
    }

    function regenerateChartIfDataReady() {
        var parsed = parseData(dataInput ? dataInput.value : "");
        if (parsed.labels.length > 0) generateChart();
    }

    function bindThemeChangeListener() {
        if (!document.body || typeof MutationObserver === "undefined") return;
        var lastDark = isDarkMode();
        var observer = new MutationObserver(function() {
            var nowDark = isDarkMode();
            if (nowDark === lastDark) return;
            lastDark = nowDark;
            if (chart) regenerateChartIfDataReady();
        });
        observer.observe(document.body, { attributes: true, attributeFilter: ["class"] });
    }

    function bindChartViewportListener() {
        var lastMobile = isMobileView();
        var resizeTimer = null;

        function refreshChartForViewport() {
            if (!chart) return;
            var mobile = isMobileView();
            if (mobile !== lastMobile) {
                lastMobile = mobile;
                regenerateChartIfDataReady();
                return;
            }
            syncChartViewport(getActiveChartType());
            chart.resize();
            if (typeof chart.update === "function") chart.update("none");
        }

        function scheduleRefresh() {
            if (resizeTimer) clearTimeout(resizeTimer);
            resizeTimer = setTimeout(function() {
                resizeTimer = null;
                refreshChartForViewport();
            }, 120);
        }

        window.addEventListener("resize", scheduleRefresh);
        if (window.matchMedia) {
            var mobileMq = window.matchMedia("(max-width: 768px)");
            if (typeof mobileMq.addEventListener === "function") {
                mobileMq.addEventListener("change", scheduleRefresh);
            } else if (typeof mobileMq.addListener === "function") {
                mobileMq.addListener(scheduleRefresh);
            }
        }
    }

    function buildCartesianScales(type, indexAxis, parsed, ui, rotateLabels) {
        var isHorizontalBar = type === "bar" && indexAxis === "y";
        var categoryAxis = isHorizontalBar ? "y" : "x";
        var valueAxis = isHorizontalBar ? "x" : "y";

        var categoryScale = {
            type: "category",
            ticks: {
                display: true,
                autoSkip: parsed.labels.length > 12,
                color: ui.text,
                maxRotation: rotateLabels ? 45 : 0,
                minRotation: rotateLabels ? 45 : 0
            },
            grid: {
                color: ui.grid,
                offset: type === "bar"
            }
        };

        var valueScale = {
            type: "linear",
            beginAtZero: true,
            ticks: {
                display: true,
                autoSkip: true,
                color: ui.text,
                callback: function(v) { return formatTick(v); }
            },
            grid: { color: ui.grid }
        };

        var scales = { x: {}, y: {} };
        scales[categoryAxis] = categoryScale;
        scales[valueAxis] = valueScale;
        return scales;
    }

    function generateChart() {
        if (!dataInput) return;
        var parsed = parseData(dataInput.value);
        if (parsed.labels.length === 0 || parsed.datasets.length === 0) {
            showDataMessage(gettext("Please enter valid data (format: label,value per line)"), true);
            return;
        }
        if (typeof Chart === "undefined") {
            whenChartJsReady(generateChart);
            return;
        }
        clearDataMessage();

        var sortMode = sortSelect ? sortSelect.value : "none";
        parsed = sortParsedData(parsed, sortMode);

        var typeInfo = getEffectiveChartType(parsed);
        var type = typeInfo.chartType;
        var indexAxis = typeInfo.indexAxis;

        var pieTypes = ["pie", "doughnut", "polarArea"];
        if (pieTypes.indexOf(type) >= 0) {
            if (parsed.datasets.length > 1) {
                parsed = { labels: parsed.labels, datasets: [parsed.datasets[0]] };
            }
            var topN = topNInput ? topNInput.value : "";
            parsed = applyTopN(parsed, topN);
        }

        if (chart) chart.destroy();

        showChartContainer();

        var ui = getChartUiColors();
        var titleText = chartTitleInput ? chartTitleInput.value.trim() : "";
        var showValues = showValuesCheck ? showValuesCheck.checked : true;
        var rotateLabels = rotateLabelsCheck && rotateLabelsCheck.checked;

        var labelCfg = {
            enabled: showValues,
            parsed: parsed,
            chartType: type,
            indexAxis: indexAxis,
            textColor: ui.text,
            formatValue: formatTick
        };
        var valueLabelsPlugin = createValueLabelsPlugin(labelCfg);
        var legendGap = getPieLegendGap(type);
        syncChartViewport(type);
        var mobileChart = isMobileView();
        var chartPlugins = [];
        if (showValues) chartPlugins.push(valueLabelsPlugin);
        if (legendGap > 0) {
            chartPlugins.push(createLegendBottomGapPlugin(legendGap));
        }

        var chartDatasets = [];
        if (pieTypes.indexOf(type) >= 0) {
            var pieColors = getPaletteColors(parsed.labels.length);
            var polarFill = pieColors.map(function(c) { return hexToRgba(c, 0.45); });
            chartDatasets.push({
                label: parsed.datasets[0].label,
                data: parsed.datasets[0].values,
                backgroundColor: type === "polarArea" ? polarFill : pieColors,
                borderColor: pieColors,
                borderWidth: 2
            });
        } else if (type === "line") {
            parsed.datasets.forEach(function(ds, idx) {
                var color = getPaletteColors(parsed.datasets.length)[idx];
                chartDatasets.push({
                    label: ds.label,
                    data: ds.values,
                    backgroundColor: hexToRgba(color, 0.15),
                    borderColor: color,
                    borderWidth: 2,
                    fill: parsed.datasets.length === 1,
                    tension: 0.3
                });
            });
        } else {
            parsed.datasets.forEach(function(ds, idx) {
                var color = getPaletteColors(parsed.datasets.length)[idx];
                chartDatasets.push({
                    label: ds.label,
                    data: ds.values,
                    backgroundColor: color,
                    borderColor: color,
                    borderWidth: 2
                });
            });
        }

        var config = {
            type: type,
            data: { labels: parsed.labels, datasets: chartDatasets },
            plugins: chartPlugins,
            options: {
                responsive: true,
                maintainAspectRatio: !mobileChart,
                aspectRatio: mobileChart ? 1 : undefined,
                datasets: type === "bar" ? {
                    bar: {
                        categoryPercentage: 0.78,
                        barPercentage: 0.88
                    }
                } : {},
                animation: {
                    onComplete: function(animationCtx) {
                        if (!showValues || !animationCtx || !animationCtx.chart) return;
                        drawParsedValueLabels(animationCtx.chart, labelCfg);
                    }
                },
                layout: {
                    padding: (function () {
                        var lineVals = type === "line" && showValues;
                        var multiLine = lineVals && parsed.datasets.length > 1;
                        var barVals = type === "bar" && showValues;
                        if (mobileChart && type === "bar") {
                            return {
                                top: barVals ? 22 : 14,
                                bottom: 14,
                                left: 14,
                                right: 14
                            };
                        }
                        return {
                            top: multiLine ? 24 : (lineVals ? 18 : 12),
                            bottom: 12,
                            left: lineVals ? 28 : 8,
                            right: lineVals ? 28 : 8
                        };
                    })()
                },
                indexAxis: type === "bar" ? indexAxis : undefined,
                plugins: {
                    title: {
                        display: !!titleText,
                        text: titleText,
                        color: ui.text,
                        font: { size: 16, weight: "600" },
                        padding: { bottom: 12 }
                    },
                    legend: {
                        display: parsed.datasets.length > 1 || pieTypes.indexOf(type) >= 0,
                        labels: { color: ui.text }
                    },
                    tooltip: {
                        callbacks: {
                            title: function(items) {
                                if (!items || !items.length) return "";
                                return items[0].label || "";
                            },
                            label: function(ctx) {
                                var val = ctx.parsed.y;
                                if (val == null && ctx.parsed != null && typeof ctx.parsed === "number") {
                                    val = ctx.parsed;
                                }
                                if (val == null) val = ctx.raw;
                                var series = ctx.dataset.label || gettext("Value");
                                return series + ": " + formatTick(val);
                            }
                        }
                    }
                },
                scales: (type === "bar" || type === "line") ? buildCartesianScales(type, indexAxis, parsed, ui, rotateLabels) : (type === "polarArea" ? {
                    r: {
                        beginAtZero: true,
                        grid: { display: true, circular: true, color: ui.grid },
                        angleLines: { display: true, color: ui.angle },
                        ticks: { display: true, backdropColor: ui.tickBackdrop, color: ui.text, callback: function(v) { return formatTick(v); } },
                        pointLabels: {
                            display: true,
                            color: ui.text,
                            font: { size: 11, weight: "600" }
                        }
                    }
                } : {})
            }
        };

        if (type === "line") {
            config.options.plugins.legend.display = parsed.datasets.length > 1;
        }

        chart = new Chart(canvas, config);
        bindChartResizeObserver();
        resizeChartAfterLayout();
        hideBootChartPlaceholder();
        saveState();
        persistBootChartPng();
        window.__vizRestoreChartImmediate = false;
        document.documentElement.classList.remove("viz-chart-restore");
    }

    function dataUrlToBlob(dataUrl) {
        var parts = dataUrl.split(",");
        var mime = (parts[0].match(/:(.*?);/) || [])[1] || "image/png";
        var binary = atob(parts[1]);
        var bytes = new Uint8Array(binary.length);
        for (var i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
        return new Blob([bytes], { type: mime });
    }

    function getActiveChartType() {
        if (chart && chart.config && chart.config.type) return chart.config.type;
        if (chartTypeSelect) return chartTypeSelect.value;
        return "bar";
    }

    function getChartExportSizes(type) {
        var isPie = isPieChartType(type);
        var gap = getPieLegendGap(type);
        var width = 800;
        if (isPie) {
            var plot = 680;
            return { width: width, height: plot + gap, plotHeight: plot };
        }
        return { width: width, height: 560, plotHeight: 560 };
    }

    function beginMobileChartExport(type) {
        var preview = chartContainer && chartContainer.querySelector(".chart-preview");
        if (!preview || !canvas || !chart) return null;
        var sizes = getChartExportSizes(type);
        var state = {
            type: type,
            preview: {
                width: preview.style.width,
                minWidth: preview.style.minWidth,
                maxWidth: preview.style.maxWidth,
                minHeight: preview.style.minHeight,
                maxHeight: preview.style.maxHeight,
                height: preview.style.height,
                aspectRatio: preview.style.aspectRatio,
                overflow: preview.style.overflow
            },
            canvas: {
                width: canvas.style.width,
                minWidth: canvas.style.minWidth,
                maxWidth: canvas.style.maxWidth,
                minHeight: canvas.style.minHeight,
                maxHeight: canvas.style.maxHeight,
                height: canvas.style.height
            },
            chartContainer: chartContainer ? { overflow: chartContainer.style.overflow } : null
        };
        if (chartContainer) chartContainer.style.overflow = "visible";
        preview.style.overflow = "visible";
        preview.style.width = sizes.width + "px";
        preview.style.maxWidth = sizes.width + "px";
        preview.style.minHeight = sizes.height + "px";
        preview.style.maxHeight = "none";
        preview.style.height = sizes.height + "px";
        preview.style.aspectRatio = "auto";
        canvas.style.width = sizes.width + "px";
        canvas.style.maxWidth = sizes.width + "px";
        canvas.style.minHeight = sizes.height + "px";
        canvas.style.maxHeight = "none";
        canvas.style.height = sizes.height + "px";
        chart.resize();
        chart.update("none");
        return state;
    }

    function endMobileChartExport(state) {
        if (!state || !chart) return;
        var preview = chartContainer && chartContainer.querySelector(".chart-preview");
        if (!preview || !canvas) return;
        var p = state.preview;
        var c = state.canvas;
        preview.style.width = p.width;
        preview.style.minWidth = p.minWidth;
        preview.style.maxWidth = p.maxWidth;
        preview.style.minHeight = p.minHeight;
        preview.style.maxHeight = p.maxHeight;
        preview.style.height = p.height;
        preview.style.aspectRatio = p.aspectRatio;
        preview.style.overflow = p.overflow;
        canvas.style.width = c.width;
        canvas.style.minWidth = c.minWidth;
        canvas.style.maxWidth = c.maxWidth;
        canvas.style.minHeight = c.minHeight;
        canvas.style.maxHeight = c.maxHeight;
        canvas.style.height = c.height;
        if (chartContainer && state.chartContainer) {
            chartContainer.style.overflow = state.chartContainer.overflow;
        }
        syncChartViewport(state.type);
        chart.resize();
        chart.update("none");
    }

    function withChartExportImage(done) {
        if (!chart) {
            done("", 0, 0);
            return;
        }
        if (!isMobileView()) {
            done(getChartPngDataUrl(), chart.width, chart.height);
            return;
        }
        var type = getActiveChartType();
        var exportState = beginMobileChartExport(type);
        requestAnimationFrame(function() {
            requestAnimationFrame(function() {
                var url = "";
                var exportW = 0;
                var exportH = 0;
                try {
                    if (chart && typeof chart.update === "function") chart.update("none");
                    exportW = chart.width;
                    exportH = chart.height;
                    url = getChartPngDataUrl();
                } catch (eExport) { /* ignore */ }
                endMobileChartExport(exportState);
                done(url, exportW, exportH);
            });
        });
    }

    function getChartPngDataUrl() {
        if (!chart) return "";
        try {
            if (typeof chart.toBase64Image === "function") return chart.toBase64Image();
            return (chart.canvas || canvas).toDataURL("image/png");
        } catch (err) {
            return "";
        }
    }

    var downloadFlashTimers = new WeakMap();

    function flashDownloadBtn(btn) {
        if (!btn) return;
        var state = downloadFlashTimers.get(btn);
        if (state) {
            if (state.start) clearTimeout(state.start);
            if (state.end) clearTimeout(state.end);
        }
        btn.classList.add("downloaded");
        var endTimer = setTimeout(function() {
            btn.classList.remove("downloaded");
            downloadFlashTimers.delete(btn);
            try { btn.blur(); } catch (eBlur2) { /* ignore */ }
        }, 2000);
        downloadFlashTimers.set(btn, { start: null, end: endTimer });
    }

    function isDataVizMobile() {
        return !!(window.matchMedia && window.matchMedia("(max-width: 768px)").matches);
    }

    function bindDownloadPressFlash(btn) {
        if (!btn) return;
        btn.addEventListener("pointerdown", function(e) {
            if (e.pointerType === "mouse" && e.button !== 0) return;
            if (!isDataVizMobile()) return;
            if (!getChartPngDataUrl()) return;
            flashDownloadBtn(btn);
        }, true);
    }

    var shareLinkFlashState = null;

    function clearShareLinkFlash(btn) {
        if (!btn || !shareLinkFlashState || shareLinkFlashState.btn !== btn) return;
        if (shareLinkFlashState.end) clearTimeout(shareLinkFlashState.end);
        if (shareLinkFlashState.orig) btn.textContent = shareLinkFlashState.orig;
        btn.classList.remove("copied");
        shareLinkFlashState = null;
    }

    function flashShareLinkBtn(btn) {
        if (!btn) return;
        if (shareLinkFlashState && shareLinkFlashState.btn === btn) {
            if (shareLinkFlashState.end) clearTimeout(shareLinkFlashState.end);
        } else if (shareLinkFlashState) {
            clearShareLinkFlash(shareLinkFlashState.btn);
        }
        var orig = (shareLinkFlashState && shareLinkFlashState.btn === btn && shareLinkFlashState.orig)
            ? shareLinkFlashState.orig
            : btn.textContent;
        btn.textContent = gettext("Copied!");
        btn.classList.add("copied");
        var endTimer = setTimeout(function() {
            btn.textContent = orig;
            btn.classList.remove("copied");
            shareLinkFlashState = null;
            try { btn.blur(); } catch (eBlur) { /* ignore */ }
        }, 2000);
        shareLinkFlashState = { btn: btn, end: endTimer, orig: orig };
    }

    function bindShareLinkPressFlash(btn) {
        if (!btn) return;
        btn.addEventListener("pointerdown", function(e) {
            if (e.pointerType === "mouse" && e.button !== 0) return;
            if (!isDataVizMobile()) return;
            if (!buildShareUrl()) return;
            flashShareLinkBtn(btn);
        }, true);
    }

    function downloadChartPng(btn) {
        if (!chart) {
            showDataMessage(gettext("Generate a chart first, then download the PNG."), true);
            return;
        }
        clearDataMessage();
        withChartExportImage(function(dataUrl, exportW, exportH) {
            if (!dataUrl) {
                showDataMessage(gettext("Generate a chart first, then download the PNG."), true);
                return;
            }
            downloadBlobFile("chart.png", dataUrlToBlob(dataUrl));
            flashDownloadBtn(btn);
        });
    }

    function downloadChartSvg(btn) {
        if (!chart) {
            showDataMessage(gettext("Generate a chart first, then download."), true);
            return;
        }
        clearDataMessage();
        withChartExportImage(function(dataUrl, exportW, exportH) {
            if (!dataUrl) {
                showDataMessage(gettext("Generate a chart first, then download."), true);
                return;
            }
            var w = exportW || chart.width || 800;
            var h = exportH || chart.height || 500;
            var svg = '<?xml version="1.0" encoding="UTF-8"?>\n<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" width="' + w + '" height="' + h + '" viewBox="0 0 ' + w + ' ' + h + '"><image width="100%" height="100%" xlink:href="' + dataUrl + '"/></svg>';
            downloadBlobFile("chart.svg", new Blob([svg], { type: "image/svg+xml;charset=utf-8" }));
            flashDownloadBtn(btn);
        });
    }

    function downloadChartPdf(btn) {
        if (!chart) {
            showDataMessage(gettext("Generate a chart first, then download."), true);
            return;
        }
        if (typeof window.jspdf === "undefined" || !window.jspdf.jsPDF) {
            showDataMessage(gettext("PDF export is not available. Try PNG or SVG."), true);
            return;
        }
        clearDataMessage();
        withChartExportImage(function(dataUrl, exportW, exportH) {
            if (!dataUrl) {
                showDataMessage(gettext("Generate a chart first, then download."), true);
                return;
            }
            var w = exportW || chart.width || 800;
            var h = exportH || chart.height || 500;
            var pdf = new window.jspdf.jsPDF({ orientation: "landscape", unit: "px", format: [w + 40, h + 40] });
            pdf.addImage(dataUrl, "PNG", 20, 20, w, h);
            pdf.save("chart.pdf");
            flashDownloadBtn(btn);
        });
    }

    function copyData() {
        var isMobile = window.matchMedia && window.matchMedia("(max-width: 768px)").matches;
        var scrollY = window.scrollY || window.pageYOffset || 0;
        var btn = document.getElementById("btn-copy-data");
        if (btn) {
            try { btn.blur(); } catch (e0) { /* ignore */ }
        }
        if (!dataInput || !dataInput.value.trim()) {
            showDataMessage(gettext("Nothing to copy."), true, isMobile);
            return;
        }
        navigator.clipboard.writeText(dataInput.value).then(function() {
            clearDataMessage();
            if (btn) {
                var orig = btn.textContent;
                btn.textContent = gettext("Copied!");
                btn.classList.add("copied");
                try { btn.blur(); } catch (e1) { /* ignore */ }
                setTimeout(function() {
                    btn.textContent = orig;
                    btn.classList.remove("copied");
                    try { btn.blur(); } catch (e2) { /* ignore */ }
                }, 1500);
            }
            if (isMobile) {
                window.scrollTo(0, scrollY);
                requestAnimationFrame(function () {
                    window.scrollTo(0, scrollY);
                });
            }
        }).catch(function() {
            showDataMessage(gettext("Could not copy to clipboard."), true, isMobile);
            if (isMobile) window.scrollTo(0, scrollY);
        });
    }

    function clearData() {
        if (!dataInput) return;
        activeExampleKey = "";
        syncExampleButtonSelection("");
        dataInput.value = "";
        dataInput.classList.remove("viz-data-input-has-content");
        dataInput.dispatchEvent(new Event("input", { bubbles: true }));
        if (!isMobileView()) {
            dataInput.style.height = "";
            dataInput.classList.remove("viz-data-input-scroll");
        } else if (resizeDataInput) {
            resizeDataInput();
        }
        if (dataFileName) dataFileName.textContent = "";
        if (dataFileInput) dataFileInput.value = "";
        if (chart) { chart.destroy(); chart = null; }
        if (chartContainer) {
            chartContainer.classList.add("hidden");
            chartContainer.setAttribute("hidden", "");
        }
        try { document.documentElement.classList.remove("viz-chart-restore"); } catch (eRestore) { /* ignore */ }
        window.__vizRestoreChartImmediate = false;
        resetChartViewport();
        hideBootChartPlaceholder();
        try { sessionStorage.removeItem(BOOT_PNG_KEY); } catch (e) { /* ignore */ }
        if (previewWrap) previewWrap.classList.add("hidden");
        if (statsEl) statsEl.classList.add("hidden");
        clearDataMessage();
        clearPersistedVizState();
        flashResetBtn();
    }

    function clearPersistedVizState() {
        try { localStorage.removeItem(STORAGE_KEY); } catch (e) { /* ignore */ }
        try { sessionStorage.removeItem(BOOT_PNG_KEY); } catch (e) { /* ignore */ }
    }

    var resetFlashTimer = null;
    function flashResetBtn() {
        var btn = document.getElementById("btn-clear-data");
        if (!btn || !window.matchMedia || !window.matchMedia("(max-width: 768px)").matches) return;
        if (resetFlashTimer) {
            clearTimeout(resetFlashTimer);
            resetFlashTimer = null;
        }
        btn.classList.remove("viz-reset-flash");
        void btn.offsetWidth;
        btn.classList.add("viz-reset-flash");
        try { btn.blur(); } catch (eBlur) { /* ignore */ }
        resetFlashTimer = setTimeout(function () {
            btn.classList.remove("viz-reset-flash");
            resetFlashTimer = null;
        }, 2000);
    }

    function collectState() {
        return {
            data: dataInput ? dataInput.value : "",
            chartType: chartTypeSelect ? chartTypeSelect.value : "bar",
            title: chartTitleInput ? chartTitleInput.value : "",
            palette: paletteSelect ? paletteSelect.value : "gadly",
            sort: sortSelect ? sortSelect.value : "none",
            topN: topNInput ? topNInput.value : "",
            showValues: showValuesCheck ? showValuesCheck.checked : true,
            horizontalBar: horizontalBarCheck ? horizontalBarCheck.checked : false,
            rotateLabels: rotateLabelsCheck ? rotateLabelsCheck.checked : false,
            yUnit: yAxisUnitInput ? yAxisUnitInput.value : "",
            autoChartType: autoChartTypeCheck ? autoChartTypeCheck.checked : false,
            autoGenerate: autoGenerateCheck ? autoGenerateCheck.checked : true,
            chartVisible: !!(chartContainer && !chartContainer.classList.contains("hidden")),
            exampleKey: activeExampleKey || ""
        };
    }

    function applyState(state, options) {
        if (!state) return;
        options = options || {};
        state = localizePersistedContent(state);
        if (dataInput && state.data != null) dataInput.value = state.data;
        if (chartTypeSelect && state.chartType) {
            chartTypeSelect.value = state.chartType;
            syncTextToolSelect(chartTypeSelect);
        }
        if (chartTitleInput && state.title != null) chartTitleInput.value = state.title;
        if (paletteSelect && state.palette) {
            paletteSelect.value = state.palette;
            syncTextToolSelect(paletteSelect);
        }
        if (sortSelect && state.sort) {
            sortSelect.value = state.sort;
            syncTextToolSelect(sortSelect);
        }
        if (topNInput && state.topN != null) topNInput.value = state.topN;
        if (showValuesCheck) showValuesCheck.checked = state.showValues !== false;
        if (horizontalBarCheck) horizontalBarCheck.checked = !!state.horizontalBar;
        if (rotateLabelsCheck) rotateLabelsCheck.checked = !!state.rotateLabels;
        if (yAxisUnitInput && state.yUnit != null) yAxisUnitInput.value = state.yUnit;
        if (autoChartTypeCheck) autoChartTypeCheck.checked = !!state.autoChartType;
        if (autoGenerateCheck) autoGenerateCheck.checked = state.autoGenerate !== false;
        /* Selezione esempio solo dopo tap utente — mai pre-selezionata al restore */
        activeExampleKey = "";
        syncExampleButtonSelection("");
        if (resizeDataInput) resizeDataInput();
        if (!options.skipPreviewStats) {
            updatePreview();
            updateStats();
        }
        if (shouldRestoreChartState(state)) {
            showChartContainer();
            if (!options.immediateChart && autoGenerateCheck && autoGenerateCheck.checked) {
                scheduleAutoGenerate();
            }
        } else if (autoGenerateCheck && autoGenerateCheck.checked) {
            scheduleAutoGenerate();
        }
        if (!options.skipSave) saveState();
    }

    function restorePersistedState() {
        var bootOpts = { skipPreviewStats: !!window.__gadlyVizBootDone, immediateChart: true };
        if (loadStateFromUrl(bootOpts)) return true;
        return false;
    }

    function saveState() {
        /* Intentionally no localStorage — persistence caused container grow/shrink on refresh.
           Share links still use collectState() via ?s= URL. */
        try { localStorage.removeItem(STORAGE_KEY); } catch (e) { /* ignore */ }
    }

    function loadState() {
        loadStateFromUrl();
    }

    function loadStateFromUrl(options) {
        var params = new URLSearchParams(window.location.search);
        var s = params.get("s");
        if (!s) return false;
        try {
            var json = decodeURIComponent(escape(atob(decodeURIComponent(s))));
            applyState(JSON.parse(json), options);
            return true;
        } catch (e) {
            return false;
        }
    }

    var shareParam = new URLSearchParams(window.location.search).get("s");
    if (shareParam) {
        restorePersistedState();
        scheduleChartRestoreRetries();
        window.addEventListener("load", function () {
            if (!chart) scheduleChartRestoreRetries();
        }, { once: true });
    } else {
        try { document.documentElement.classList.remove("viz-chart-restore"); } catch (eNoChart) { /* ignore */ }
        window.__vizRestoreChartImmediate = false;
        if (chartContainer) {
            chartContainer.classList.add("hidden");
            chartContainer.setAttribute("hidden", "");
        }
        hideBootChartPlaceholder();
        try { localStorage.removeItem(STORAGE_KEY); } catch (eClr) { /* ignore */ }
        try { sessionStorage.removeItem(BOOT_PNG_KEY); } catch (ePng) { /* ignore */ }
    }

    window.addEventListener("pagehide", function () {
        /* Leaving the tool: drop saved chart/example so next visit starts clean */
        clearPersistedVizState();
    });

    window.addEventListener("pageshow", function (e) {
        if (e.persisted) {
            clearPersistedVizState();
            clearData();
        }
    });

    function buildShareUrl() {
        var state = collectState();
        var json = JSON.stringify(state);
        if (json.length > 4000) return null;
        try {
            var b64 = btoa(unescape(encodeURIComponent(json)));
            return window.location.origin + window.location.pathname + "?s=" + encodeURIComponent(b64);
        } catch (e) {
            return null;
        }
    }

    function shareChartLink() {
        var url = buildShareUrl();
        if (!url) {
            showDataMessage(gettext("Data is too large to share in a link. Try fewer rows."), true);
            return;
        }
        var btn = document.getElementById("btn-share-link");
        navigator.clipboard.writeText(url).then(function() {
            clearDataMessage();
            if (btn) flashShareLinkBtn(btn);
        }).catch(function() {
            if (btn && isDataVizMobile()) clearShareLinkFlash(btn);
            showDataMessage(url, false);
        });
    }

    function readFileAsText(file, callback) {
        var reader = new FileReader();
        reader.onload = function() { callback(String(reader.result || "")); };
        reader.onerror = function() { showDataMessage(gettext("Could not read the selected file."), true); };
        reader.readAsText(file, "UTF-8");
    }

    function readXlsxFile(file, callback) {
        var reader = new FileReader();
        reader.onload = function(e) {
            if (typeof XLSX === "undefined") {
                showDataMessage(gettext("Excel support is not loaded. Save as CSV or try again."), true);
                return;
            }
            try {
                var wb = XLSX.read(e.target.result, { type: "array" });
                var sheet = wb.Sheets[wb.SheetNames[0]];
                callback(XLSX.utils.sheet_to_csv(sheet));
            } catch (err) {
                showDataMessage(gettext("Could not read this Excel file."), true);
            }
        };
        reader.onerror = function() { showDataMessage(gettext("Could not read the selected file."), true); };
        reader.readAsArrayBuffer(file);
    }

    // --- Event bindings ---
    var btnTemplateExample = document.getElementById("btn-download-template-example");
    var btnTemplateEmpty = document.getElementById("btn-download-template-empty");
    var btnLoadCsv = document.getElementById("btn-load-csv");
    var dataFileInput = document.getElementById("data-file-input");
    var dataFileName = document.getElementById("data-file-name");

    if (btnTemplateExample) {
        btnTemplateExample.addEventListener("click", function() {
            downloadCsvFile("gadly-chart-template-sample.csv", buildTemplateCsv(true));
            clearDataMessage();
        });
    }
    if (btnTemplateEmpty) {
        btnTemplateEmpty.addEventListener("click", function() {
            downloadCsvFile("gadly-chart-template-blank.csv", buildTemplateCsv(false));
            clearDataMessage();
        });
    }
    if (btnLoadCsv && dataFileInput) {
        btnLoadCsv.addEventListener("click", function() { dataFileInput.click(); });
    }
    if (dataFileInput) {
        dataFileInput.addEventListener("change", function() {
            var file = dataFileInput.files && dataFileInput.files[0];
            if (!file) return;
            if (dataFileName) dataFileName.textContent = file.name;
            if (file.size > CSV_MAX_BYTES) {
                showDataMessage(gettext("CSV file is too large. Maximum size is 256 KB."), true);
                dataFileInput.value = "";
                return;
            }
            var ext = (file.name.split(".").pop() || "").toLowerCase();
            var onText = function(text) {
                if (!applyTextareaContent(text, true)) {
                    showDataMessage(gettext("Could not read chart data from this file. Use the template format: label,value per line."), true);
                } else {
                    clearDataMessage();
                }
            };
            if (ext === "xlsx" || ext === "xls") {
                readXlsxFile(file, onText);
            } else {
                readFileAsText(file, onText);
            }
        });
    }

    document.querySelectorAll(".viz-example-btn").forEach(function(btn) {
        btn.addEventListener("click", function() {
            applyExample(btn.getAttribute("data-example"));
        });
    });

    function applyExample(key) {
        if (!key || !EXAMPLES[key] || !dataInput) return;
        activeExampleKey = key;
        var exampleTypes = { sales: "line", budget: "bar", survey: "pie" };
        dataInput.value = EXAMPLES[key].data;
        if (chartTitleInput) chartTitleInput.value = EXAMPLES[key].label;
        if (autoChartTypeCheck) autoChartTypeCheck.checked = false;
        if (horizontalBarCheck) horizontalBarCheck.checked = false;
        if (chartTypeSelect && exampleTypes[key]) {
            chartTypeSelect.value = exampleTypes[key];
            syncTextToolSelect(chartTypeSelect);
        }
        document.querySelectorAll(".viz-example-btn").forEach(function(b) {
            b.classList.toggle("selected", b.getAttribute("data-example") === key);
        });
        dataInput.dispatchEvent(new Event("input", { bubbles: true }));
        regenerateChartIfDataReady();
        clearDataMessage();
        saveState();
    }

    var btnCopyData = document.getElementById("btn-copy-data");
    var btnClearData = document.getElementById("btn-clear-data");
    if (btnCopyData) btnCopyData.addEventListener("click", copyData);
    if (btnClearData) btnClearData.addEventListener("click", clearData);

    var chartOptionControls = [paletteSelect, sortSelect, topNInput, showValuesCheck, horizontalBarCheck, rotateLabelsCheck, yAxisUnitInput, autoChartTypeCheck, chartTitleInput];

    chartOptionControls.forEach(function(el) {
        if (!el) return;
        el.addEventListener("change", function() {
            saveState();
            if (el === horizontalBarCheck && horizontalBarCheck && horizontalBarCheck.checked && chartTypeSelect && chartTypeSelect.value !== "bar") {
                chartTypeSelect.value = "bar";
                syncTextToolSelect(chartTypeSelect);
                if (autoChartTypeCheck) autoChartTypeCheck.checked = false;
                saveState();
            }
            regenerateChartIfDataReady();
        });
        el.addEventListener("input", saveState);
    });

    if (autoGenerateCheck) {
        autoGenerateCheck.addEventListener("change", saveState);
        autoGenerateCheck.addEventListener("input", saveState);
    }

    var btnDownloadPng = document.getElementById("btn-download");
    var btnDownloadSvg = document.getElementById("btn-download-svg");
    var btnDownloadPdf = document.getElementById("btn-download-pdf");
    var btnShareLink = document.getElementById("btn-share-link");
    if (btnDownloadPng) {
        bindDownloadPressFlash(btnDownloadPng);
        btnDownloadPng.addEventListener("click", function() { downloadChartPng(btnDownloadPng); });
    }
    if (btnDownloadSvg) {
        bindDownloadPressFlash(btnDownloadSvg);
        btnDownloadSvg.addEventListener("click", function() { downloadChartSvg(btnDownloadSvg); });
    }
    if (btnDownloadPdf) {
        bindDownloadPressFlash(btnDownloadPdf);
        btnDownloadPdf.addEventListener("click", function() { downloadChartPdf(btnDownloadPdf); });
    }
    if (btnShareLink) {
        bindShareLinkPressFlash(btnShareLink);
        btnShareLink.addEventListener("click", shareChartLink);
    }

    if (btnGenerate) btnGenerate.addEventListener("click", generateChart);

    bindThemeChangeListener();
    bindChartViewportListener();
});
