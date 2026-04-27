document.addEventListener("DOMContentLoaded", function() {
    var t = (typeof gettext === "function") ? gettext : function(s) { return s; };
    var isItalian = (document.documentElement.lang || "").toLowerCase().indexOf("it") === 0;
    const dataInput = document.getElementById("data-input");
    const chartTypeSelect = document.getElementById("chart-type");
    const btnGenerate = document.getElementById("btn-generate");
    const canvas = document.getElementById("chart-canvas");
    const chartContainer = document.querySelector(".chart-container");
    const resultArea = document.getElementById("data-viz-result");

    let chart = null;

    // Auto-ingrandimento con il testo (come prima). Pavimento = altezza iniziale con esempio
    // (placeholder), così alla prima battuta non collassa quando il placeholder sparisce.
    if (dataInput) {
        const MAX_HEIGHT = 750;
        var cssMin = parseFloat(window.getComputedStyle(dataInput).minHeight);
        if (!(cssMin > 0)) cssMin = 120;
        var placeholderFloorPx = Math.max(dataInput.scrollHeight, dataInput.offsetHeight, cssMin);

        const autoResize = function() {
            dataInput.style.height = "auto";
            var sh = dataInput.scrollHeight;
            var newHeight = Math.min(Math.max(sh, placeholderFloorPx), MAX_HEIGHT);
            dataInput.style.height = newHeight + "px";
            dataInput.style.overflowY = sh > MAX_HEIGHT ? "auto" : "hidden";
        };
        dataInput.addEventListener("input", autoResize);
        autoResize();
    }

    function initChartTypeSelect() {
        const wrap = chartTypeSelect.closest(".chart-select-wrap");
        if (!wrap) return;
        const trigger = document.createElement("div");
        trigger.className = "chart-select-trigger";
        trigger.textContent = chartTypeSelect.options[chartTypeSelect.selectedIndex].text;
        const dropdown = document.createElement("div");
        dropdown.className = "chart-select-dropdown";
        for (var i = 0; i < chartTypeSelect.options.length; i++) {
            (function(opt) {
                var div = document.createElement("div");
                div.className = "chart-select-option" + (opt.selected ? " selected" : "");
                div.textContent = opt.text;
                div.dataset.value = opt.value;
                div.addEventListener("click", function() {
                    chartTypeSelect.value = opt.value;
                    trigger.textContent = opt.text;
                    dropdown.querySelectorAll(".chart-select-option").forEach(function(o) { o.classList.remove("selected"); });
                    div.classList.add("selected");
                    wrap.classList.remove("open");
                });
                dropdown.appendChild(div);
            })(chartTypeSelect.options[i]);
        }
        trigger.addEventListener("click", function(e) {
            e.stopPropagation();
            document.querySelectorAll(".chart-select-wrap.open").forEach(function(w) { w.classList.remove("open"); });
            wrap.classList.toggle("open");
        });
        wrap.insertBefore(trigger, chartTypeSelect);
        wrap.appendChild(dropdown);
    }
    document.addEventListener("click", function() {
        document.querySelectorAll(".chart-select-wrap.open").forEach(function(w) { w.classList.remove("open"); });
    });
    initChartTypeSelect();

    function parseData(text) {
        const lines = text.trim().split("\n").filter(function(line) { return line.trim(); });
        const labels = [];
        const values = [];
        for (let i = 0; i < lines.length; i++) {
            const parts = lines[i].split(",").map(function(s) { return s.trim(); });
            if (parts.length >= 2) {
                labels.push(parts[0]);
                values.push(parseFloat(parts[1]) || 0);
            } else if (parts.length === 1 && !isNaN(parseFloat(parts[0]))) {
                labels.push(t("Item") + " " + (i + 1));
                values.push(parseFloat(parts[0]));
            }
        }
        return { labels: labels, values: values };
    }

    function getColors(count) {
        const palette = [
            "#3498db", "#e74c3c", "#2ecc71", "#f39c12", "#9b59b6",
            "#1abc9c", "#e67e22", "#34495e", "#95a5a6", "#d35400"
        ];
        const colors = [];
        for (let i = 0; i < count; i++) {
            colors.push(palette[i % palette.length]);
        }
        return colors;
    }

    function hexToRgba(hex, alpha) {
        if (!hex) return "rgba(0,0,0," + alpha + ")";
        var c = hex.replace("#", "");
        if (c.length === 3) {
            c = c[0] + c[0] + c[1] + c[1] + c[2] + c[2];
        }
        var r = parseInt(c.substring(0, 2), 16);
        var g = parseInt(c.substring(2, 4), 16);
        var b = parseInt(c.substring(4, 6), 16);
        return "rgba(" + r + "," + g + "," + b + "," + alpha + ")";
    }

    function generateChart() {
        const data = parseData(dataInput.value);
        if (data.labels.length === 0 || data.values.length === 0) {
            if (resultArea) {
                resultArea.textContent = isItalian
                    ? "Inserisci dati validi (formato: etichetta,valore per riga)"
                    : t("Please enter valid data (format: label,value per line)");
                resultArea.classList.add("error");
                resultArea.classList.remove("hidden");
                resultArea.scrollIntoView({ behavior: "smooth", block: "nearest" });
            }
            return;
        }
        if (resultArea) {
            resultArea.classList.remove("error");
            resultArea.classList.add("hidden");
        }

        if (chart) chart.destroy();

        const type = chartTypeSelect.value;
        const colors = getColors(data.labels.length);
        const polarFillColors = colors.map(function(c) { return hexToRgba(c, 0.45); });

        const config = {
            type: type,
            data: {
                labels: data.labels,
                datasets: [{
                    label: t("Value"),
                    data: data.values,
                    backgroundColor: type === "line" ? "rgba(0, 123, 255, 0.2)" : (type === "polarArea" ? polarFillColors : colors),
                    borderColor: type === "line" ? "#007BFF" : colors,
                    borderWidth: 2,
                    fill: type === "line"
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: true,
                plugins: {
                    legend: {
                        display: type !== "bar" && type !== "line"
                    }
                },
                scales: (type === "bar" || type === "line") ? {
                    y: {
                        beginAtZero: true
                    }
                } : (type === "polarArea" ? {
                    // Ensure radial vectors and numeric ticks are always visible.
                    r: {
                        beginAtZero: true,
                        grid: {
                            display: true,
                            circular: true,
                            color: "rgba(0, 63, 127, 0.28)"
                        },
                        angleLines: {
                            display: true,
                            color: "rgba(0, 63, 127, 0.40)"
                        },
                        ticks: {
                            display: true,
                            backdropColor: "rgba(255,255,255,0.85)",
                            color: "#003f7f"
                        },
                        pointLabels: {
                            // Keep chart size close to previous behavior while
                            // preserving visible radial lines and numbers.
                            display: false
                        }
                    }
                } : {})
            }
        };

        if (type === "line") {
            config.data.datasets[0].backgroundColor = "rgba(0, 123, 255, 0.2)";
            config.data.datasets[0].borderColor = "#007BFF";
            config.data.datasets[0].tension = 0.3;
            config.options.plugins.legend.display = false;
        }

        chart = new Chart(canvas, config);
        if (chartContainer) chartContainer.classList.remove("hidden");
        if (resultArea) resultArea.classList.add("hidden");
    }

    function downloadChart() {
        if (!chart) return;
        const link = document.createElement("a");
        link.download = "chart.png";
        link.href = chart.toDataURL("image/png");
        link.click();
    }

    const btnDownload = document.getElementById("btn-download");
    if (btnDownload) btnDownload.addEventListener("click", downloadChart);

    btnGenerate.addEventListener("click", generateChart);
});
