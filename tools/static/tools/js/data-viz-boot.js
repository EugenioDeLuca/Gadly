(function () {
    var KEY = "gadly-data-viz-state";
    var PREVIEW_MAX_ROWS = 10;
    var i18n = window.__vizBootI18n || {};
    var txt = function (key, fallback) { return i18n[key] || fallback; };

    function readState() {
        var sParam = new URLSearchParams(window.location.search).get("s");
        if (sParam) {
            try {
                return JSON.parse(decodeURIComponent(escape(atob(decodeURIComponent(sParam)))));
            } catch (e0) { /* ignore */ }
        }
        try {
            var raw = localStorage.getItem(KEY);
            if (raw) return JSON.parse(raw);
        } catch (e1) { /* ignore */ }
        return null;
    }

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
        var lines = String(text || "").trim().split(/\r?\n/).filter(function (line) { return line.trim(); });
        var labels = [];
        var datasets = [];
        if (lines.length === 0) return { labels: labels, datasets: datasets };

        var delim = detectDelimiter(lines[0]);
        var start = 0;
        var firstParts = parseCsvLine(lines[0], delim);
        var seriesNames = [];
        if (isHeaderRow(firstParts)) {
            start = 1;
            for (var h = 1; h < firstParts.length; h++) {
                seriesNames.push(firstParts[h] || (txt("series", "Series") + " " + h));
            }
        } else if (firstParts.length > 2) {
            for (var s = 1; s < firstParts.length; s++) {
                seriesNames.push(txt("series", "Series") + " " + s);
            }
        } else {
            seriesNames.push(txt("value", "Value"));
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
                    labels.push(txt("item", "Item") + " " + (labels.length + 1));
                    datasets[0].values.push(singleVal);
                    for (var d2 = 1; d2 < datasets.length; d2++) {
                        datasets[d2].values.push(0);
                    }
                }
            }
        }

        datasets = datasets.filter(function (ds) {
            return ds.values.some(function () { return ds.values.length > 0; });
        });
        if (datasets.length === 0) {
            datasets.push({ label: txt("value", "Value"), values: [] });
        }
        return { labels: labels, datasets: datasets };
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

    function getAllValues(parsed) {
        var out = [];
        parsed.datasets.forEach(function (ds) {
            ds.values.forEach(function (v) { out.push(v); });
        });
        return out;
    }

    function bootResizeTextarea(ta) {
        if (!ta || !String(ta.value || "").trim()) return;
        var mobile = window.matchMedia && window.matchMedia("(max-width: 768px)").matches;
        ta.style.height = "auto";
        var sh = ta.scrollHeight;
        var minH = mobile ? 130 : 160;
        var maxH = mobile ? 280 : 750;
        var h = Math.min(Math.max(sh, minH), maxH);
        ta.style.height = h + "px";
        ta.classList.toggle("viz-data-input-scroll", h >= maxH);
    }

    function displayColumnHeader(name) {
        var normalized = String(name || "").trim().toLowerCase();
        if (normalized === "label" || normalized === "etichetta" || normalized === "nome" || normalized === "name") {
            return txt("label", "Label");
        }
        if (normalized === "value" || normalized === "values" || normalized === "valore" || normalized === "valori") {
            return txt("value", "Value");
        }
        return name;
    }

    function bootUpdatePreview(data) {
        var previewWrap = document.getElementById("viz-data-preview");
        var previewTable = document.getElementById("viz-preview-table");
        if (!previewWrap || !previewTable) return;

        var parsed = parseData(data);
        if (parsed.labels.length === 0) {
            previewWrap.classList.add("hidden");
            previewTable.innerHTML = "";
            return;
        }

        var cols = [txt("label", "Label")].concat(parsed.datasets.map(function (ds) { return displayColumnHeader(ds.label); }));
        var html = "<thead><tr>" + cols.map(function (c) { return "<th>" + escapeHtml(c) + "</th>"; }).join("") + "</tr></thead><tbody>";
        var max = Math.min(parsed.labels.length, PREVIEW_MAX_ROWS);
        for (var i = 0; i < max; i++) {
            html += "<tr><td>" + escapeHtml(parsed.labels[i]) + "</td>";
            parsed.datasets.forEach(function (ds) {
                html += "<td>" + escapeHtml(formatNumber(ds.values[i])) + "</td>";
            });
            html += "</tr>";
        }
        if (parsed.labels.length > PREVIEW_MAX_ROWS) {
            var more = txt("moreRows", "… and %(count)s more rows").replace("%(count)s", String(parsed.labels.length - PREVIEW_MAX_ROWS));
            html += "<tr><td colspan=\"" + cols.length + "\" class=\"viz-preview-more\">" + escapeHtml(more) + "</td></tr>";
        }
        html += "</tbody>";
        previewTable.innerHTML = html;
        previewWrap.classList.remove("hidden");
    }

    function bootUpdateStats(data) {
        var statsEl = document.getElementById("viz-stats");
        if (!statsEl) return;

        var parsed = parseData(data);
        var vals = getAllValues(parsed);
        if (vals.length === 0) {
            statsEl.classList.add("hidden");
            statsEl.textContent = "";
            return;
        }

        var sum = vals.reduce(function (a, b) { return a + b; }, 0);
        var min = Math.min.apply(null, vals);
        var max = Math.max.apply(null, vals);
        var avg = sum / vals.length;
        statsEl.innerHTML =
            "<span><strong>" + escapeHtml(txt("total", "Total")) + ":</strong> " + escapeHtml(formatNumber(sum)) + "</span>" +
            "<span><strong>" + escapeHtml(txt("average", "Average")) + ":</strong> " + escapeHtml(formatNumber(avg)) + "</span>" +
            "<span><strong>" + escapeHtml(txt("min", "Min")) + ":</strong> " + escapeHtml(formatNumber(min)) + "</span>" +
            "<span><strong>" + escapeHtml(txt("max", "Max")) + ":</strong> " + escapeHtml(formatNumber(max)) + "</span>";
        statsEl.classList.remove("hidden");
    }

    try {
        var state = readState();
        if (!state || !state.data || !String(state.data).trim()) return;
        if (typeof window.gadlyLocalizeVizState === "function") {
            state = window.gadlyLocalizeVizState(state);
        }

        var ta = document.getElementById("data-input");
        if (ta) {
            ta.value = state.data;
            bootResizeTextarea(ta);
        }
        if (state.title != null) {
            var titleEl = document.getElementById("chart-title");
            if (titleEl) titleEl.value = state.title;
        }
        bootUpdatePreview(state.data);
        bootUpdateStats(state.data);
        window.__gadlyVizBootDone = true;
    } catch (e2) { /* ignore */ }
})();
