(function () {
    "use strict";

    function resetPanelPosition(panel) {
        panel.style.position = "";
        panel.style.top = "";
        panel.style.left = "";
        panel.style.right = "";
        panel.style.minWidth = "";
    }

    function positionPanel(trigger, panel) {
        panel.hidden = false;
        panel.style.position = "fixed";
        panel.style.minWidth = "10.75rem";
        var rect = trigger.getBoundingClientRect();
        var panelWidth = panel.offsetWidth;
        var panelHeight = panel.offsetHeight;
        var left = rect.right - panelWidth;
        var top = rect.bottom + 6;
        var margin = 8;

        if (left < margin) {
            left = margin;
        }
        if (left + panelWidth > window.innerWidth - margin) {
            left = window.innerWidth - panelWidth - margin;
        }
        if (top + panelHeight > window.innerHeight - margin) {
            top = rect.top - panelHeight - 6;
        }

        panel.style.left = left + "px";
        panel.style.top = top + "px";
    }

    function setMenuRowState(menu, isOpen) {
        var row = menu.closest("tr");
        if (row) {
            row.classList.toggle("drose-quote-staff-row--menu-open", isOpen);
        }
    }

    function closeMenu(menu) {
        var trigger = menu.querySelector(".drose-quote-staff-menu__trigger");
        var panel = menu.querySelector(".drose-quote-staff-menu__panel");
        if (!trigger || !panel) {
            return;
        }
        panel.hidden = true;
        trigger.setAttribute("aria-expanded", "false");
        menu.classList.remove("is-open");
        setMenuRowState(menu, false);
        resetPanelPosition(panel);
    }

    function closeAllMenus(exceptMenu) {
        document.querySelectorAll(".drose-quote-staff-menu.is-open").forEach(function (menu) {
            if (menu !== exceptMenu) {
                closeMenu(menu);
            }
        });
    }

    document.querySelectorAll(".drose-quote-staff-menu").forEach(function (menu) {
        var trigger = menu.querySelector(".drose-quote-staff-menu__trigger");
        var panel = menu.querySelector(".drose-quote-staff-menu__panel");
        if (!trigger || !panel) {
            return;
        }

        panel.addEventListener("click", function (event) {
            event.stopPropagation();
        });

        trigger.addEventListener("click", function (event) {
            event.stopPropagation();
            var willOpen = panel.hidden;
            closeAllMenus(menu);
            if (willOpen) {
                positionPanel(trigger, panel);
                trigger.setAttribute("aria-expanded", "true");
                menu.classList.add("is-open");
                setMenuRowState(menu, true);
            } else {
                closeMenu(menu);
            }
        });
    });

    document.addEventListener("click", function () {
        closeAllMenus(null);
    });

    document.addEventListener("keydown", function (event) {
        if (event.key === "Escape") {
            closeAllMenus(null);
        }
    });

    window.addEventListener("resize", function () {
        document.querySelectorAll(".drose-quote-staff-menu.is-open").forEach(function (menu) {
            var trigger = menu.querySelector(".drose-quote-staff-menu__trigger");
            var panel = menu.querySelector(".drose-quote-staff-menu__panel");
            if (trigger && panel && !panel.hidden) {
                positionPanel(trigger, panel);
            }
        });
    });

    function clearRestoredQueryParam() {
        if (!window.history || !window.history.replaceState) {
            return;
        }
        var cleanUrl = new URL(window.location.href);
        if (!cleanUrl.searchParams.has("restored")) {
            return;
        }
        cleanUrl.searchParams.delete("restored");
        window.history.replaceState({}, "", cleanUrl.pathname + cleanUrl.search + cleanUrl.hash);
    }

    function focusRestoredQuote() {
        var params = new URLSearchParams(window.location.search);
        var restoredId = (params.get("restored") || "").trim();
        if (!restoredId) {
            return;
        }

        var row = document.querySelector(
            '.drose-quote-staff-table tbody tr[data-quote-id="' + CSS.escape(restoredId) + '"]'
        );
        if (!row) {
            clearRestoredQueryParam();
            return;
        }

        row.classList.add("drose-quote-staff-row--restored-flash");
        window.setTimeout(function () {
            row.scrollIntoView({ behavior: "smooth", block: "center" });
        }, 80);
        window.setTimeout(function () {
            row.classList.remove("drose-quote-staff-row--restored-flash");
            clearRestoredQueryParam();
        }, 1700);
    }

    focusRestoredQuote();
})();
