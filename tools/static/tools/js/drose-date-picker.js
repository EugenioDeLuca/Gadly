(function () {
    "use strict";

    function pad(n) {
        return n < 10 ? "0" + n : String(n);
    }

    function toIso(d) {
        return d.getFullYear() + "-" + pad(d.getMonth() + 1) + "-" + pad(d.getDate());
    }

    function parseIso(value) {
        if (!value || !/^\d{4}-\d{2}-\d{2}$/.test(value)) {
            return null;
        }
        var parts = value.split("-");
        var d = new Date(Number(parts[0]), Number(parts[1]) - 1, Number(parts[2]));
        if (Number.isNaN(d.getTime())) {
            return null;
        }
        return d;
    }

    function sameDay(a, b) {
        return a && b
            && a.getFullYear() === b.getFullYear()
            && a.getMonth() === b.getMonth()
            && a.getDate() === b.getDate();
    }

    function localeTag() {
        var lang = (document.documentElement.lang || "en").slice(0, 2).toLowerCase();
        return lang === "it" ? "it-IT" : "en-GB";
    }

    function formatDisplay(d) {
        return new Intl.DateTimeFormat(localeTag(), {
            day: "2-digit",
            month: "2-digit",
            year: "numeric",
        }).format(d);
    }

    function monthTitle(year, month) {
        var label = new Intl.DateTimeFormat(localeTag(), {
            month: "long",
            year: "numeric",
        }).format(new Date(year, month, 1));
        return label.charAt(0).toUpperCase() + label.slice(1);
    }

    function weekdayLabels() {
        var fmt = new Intl.DateTimeFormat(localeTag(), { weekday: "short" });
        // Monday-first week
        var labels = [];
        for (var i = 1; i <= 7; i += 1) {
            // 2024-01-01 was Monday
            labels.push(fmt.format(new Date(2024, 0, i)));
        }
        return labels;
    }

    function initPicker(root) {
        if (!root || root.dataset.ready === "1") {
            return;
        }
        root.dataset.ready = "1";

        var input = root.querySelector('input[type="hidden"], input.drose-date-picker__value');
        var trigger = root.querySelector(".drose-date-picker__trigger");
        var display = root.querySelector(".drose-date-picker__display");
        var panel = root.querySelector(".drose-date-picker__panel");
        var monthLabel = root.querySelector(".drose-date-picker__month-label");
        var weekdaysEl = root.querySelector(".drose-date-picker__weekdays");
        var grid = root.querySelector(".drose-date-picker__grid");
        var todayBtn = root.querySelector(".drose-date-picker__today");
        var clearBtn = root.querySelector(".drose-date-picker__clear");
        if (!input || !trigger || !display || !panel || !monthLabel || !weekdaysEl || !grid) {
            return;
        }

        var view = parseIso(input.value) || new Date();
        view = new Date(view.getFullYear(), view.getMonth(), 1);

        weekdaysEl.innerHTML = weekdayLabels().map(function (label) {
            return '<span class="drose-date-picker__weekday">' + label + "</span>";
        }).join("");

        function syncDisplay() {
            var selected = parseIso(input.value);
            var placeholder = display.getAttribute("data-placeholder") || "";
            if (selected) {
                display.textContent = formatDisplay(selected);
                display.classList.remove("is-placeholder");
            } else {
                display.textContent = placeholder;
                display.classList.add("is-placeholder");
            }
        }

        function setOpen(open) {
            panel.hidden = !open;
            trigger.setAttribute("aria-expanded", open ? "true" : "false");
            root.classList.toggle("is-open", open);
            if (open) {
                var selected = parseIso(input.value);
                if (selected) {
                    view = new Date(selected.getFullYear(), selected.getMonth(), 1);
                }
                render();
            }
        }

        function selectDate(d) {
            input.value = toIso(d);
            syncDisplay();
            setOpen(false);
            input.dispatchEvent(new Event("change", { bubbles: true }));
        }

        function render() {
            var year = view.getFullYear();
            var month = view.getMonth();
            monthLabel.textContent = monthTitle(year, month);

            var first = new Date(year, month, 1);
            var startOffset = (first.getDay() + 6) % 7; // Mon=0
            var daysInMonth = new Date(year, month + 1, 0).getDate();
            var selected = parseIso(input.value);
            var today = new Date();
            today = new Date(today.getFullYear(), today.getMonth(), today.getDate());

            var html = "";
            var totalCells = Math.ceil((startOffset + daysInMonth) / 7) * 7;
            for (var i = 0; i < totalCells; i += 1) {
                var dayNum = i - startOffset + 1;
                if (dayNum < 1 || dayNum > daysInMonth) {
                    html += '<span class="drose-date-picker__day is-empty"></span>';
                    continue;
                }
                var cellDate = new Date(year, month, dayNum);
                var classes = ["drose-date-picker__day"];
                if (sameDay(cellDate, today)) {
                    classes.push("is-today");
                }
                if (sameDay(cellDate, selected)) {
                    classes.push("is-selected");
                }
                html += '<button type="button" class="' + classes.join(" ") + '" data-iso="' + toIso(cellDate) + '" aria-label="' + formatDisplay(cellDate) + '">' + dayNum + "</button>";
            }
            grid.innerHTML = html;
        }

        trigger.addEventListener("click", function (e) {
            e.preventDefault();
            setOpen(panel.hidden);
        });

        root.querySelectorAll(".drose-date-picker__nav").forEach(function (btn) {
            btn.addEventListener("click", function () {
                var delta = Number(btn.getAttribute("data-nav") || "0");
                view = new Date(view.getFullYear(), view.getMonth() + delta, 1);
                render();
            });
        });

        grid.addEventListener("click", function (e) {
            var btn = e.target.closest(".drose-date-picker__day[data-iso]");
            if (!btn || !root.contains(btn)) {
                return;
            }
            var d = parseIso(btn.getAttribute("data-iso"));
            if (d) {
                selectDate(d);
            }
        });

        if (todayBtn) {
            todayBtn.addEventListener("click", function () {
                var now = new Date();
                selectDate(new Date(now.getFullYear(), now.getMonth(), now.getDate()));
            });
        }

        if (clearBtn) {
            clearBtn.addEventListener("click", function () {
                input.value = "";
                syncDisplay();
                setOpen(false);
                input.dispatchEvent(new Event("change", { bubbles: true }));
            });
        }

        document.addEventListener("click", function (e) {
            if (!root.classList.contains("is-open")) {
                return;
            }
            if (!root.contains(e.target)) {
                setOpen(false);
            }
        });

        document.addEventListener("keydown", function (e) {
            if (e.key === "Escape" && root.classList.contains("is-open")) {
                setOpen(false);
                trigger.focus();
            }
        });

        syncDisplay();
    }

    function initAll() {
        document.querySelectorAll("[data-drose-date-picker]").forEach(initPicker);
    }

    if (document.readyState === "loading") {
        document.addEventListener("DOMContentLoaded", initAll);
    } else {
        initAll();
    }
})();
