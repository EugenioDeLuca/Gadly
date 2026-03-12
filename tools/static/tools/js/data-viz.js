document.addEventListener("DOMContentLoaded", function() {
    const dataInput = document.getElementById("data-input");
    const chartTypeSelect = document.getElementById("chart-type");
    const btnGenerate = document.getElementById("btn-generate");
    const canvas = document.getElementById("chart-canvas");
    const chartContainer = document.querySelector(".chart-container");

    let chart = null;

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
                labels.push("Item " + (i + 1));
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

    function generateChart() {
        const data = parseData(dataInput.value);
        if (data.labels.length === 0 || data.values.length === 0) {
            alert("Please enter valid data (format: label,value per line)");
            return;
        }

        if (chart) chart.destroy();

        const type = chartTypeSelect.value;
        const colors = getColors(data.labels.length);

        const config = {
            type: type,
            data: {
                labels: data.labels,
                datasets: [{
                    label: "Value",
                    data: data.values,
                    backgroundColor: type === "line" ? "rgba(0, 123, 255, 0.2)" : colors,
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
                scales: type === "bar" || type === "line" ? {
                    y: {
                        beginAtZero: true
                    }
                } : {}
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
    }

    btnGenerate.addEventListener("click", generateChart);
});
