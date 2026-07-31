(function () {
    "use strict";

    function positionPanel(trigger, panel) {
        panel.hidden = false;
        panel.style.position = "fixed";
        panel.style.visibility = "hidden";
        panel.style.left = "0";
        panel.style.top = "0";
        panel.style.right = "auto";
        panel.style.minWidth = "12rem";
        panel.style.width = "max-content";
        panel.style.maxWidth = "calc(100vw - 16px)";

        /* Remisura dopo layout (testi IT più lunghi → larghezza diversa) */
        var rect = trigger.getBoundingClientRect();
        var panelWidth = panel.offsetWidth;
        var panelHeight = panel.offsetHeight;
        var margin = 8;
        var left = rect.right - panelWidth;
        var top = rect.bottom + 6;

        if (left < margin) {
            left = margin;
        }
        if (left + panelWidth > window.innerWidth - margin) {
            left = Math.max(margin, window.innerWidth - panelWidth - margin);
        }
        if (top + panelHeight > window.innerHeight - margin) {
            top = Math.max(margin, rect.top - panelHeight - 6);
        }

        panel.style.left = left + "px";
        panel.style.top = top + "px";
        panel.style.visibility = "";
    }

    function resetPanelPosition(panel) {
        panel.style.position = "";
        panel.style.top = "";
        panel.style.left = "";
        panel.style.right = "";
        panel.style.minWidth = "";
        panel.style.width = "";
        panel.style.maxWidth = "";
        panel.style.visibility = "";
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

    function initQuoteSearch() {
        var input = document.getElementById("drose-quote-staff-search-input");
        var emptyMsg = document.getElementById("drose-quote-staff-search-empty");
        var table = document.querySelector(".drose-quote-staff-table");
        if (!input || !table) {
            return;
        }
        var rows = Array.prototype.slice.call(table.querySelectorAll("tbody tr"));
        if (!rows.length) {
            return;
        }

        function normalizeSearchText(value) {
            return String(value || "")
                .toLowerCase()
                .normalize("NFD")
                .replace(/[\u0300-\u036f]/g, "")
                .trim();
        }

        function rowSearchHaystack(row) {
            return normalizeSearchText([
                row.getAttribute("data-ref"),
                row.getAttribute("data-name"),
                row.getAttribute("data-email"),
                row.getAttribute("data-search"),
                row.textContent
            ].join(" "));
        }

        function rowMatchesQuery(row, query) {
            var q = normalizeSearchText(query);
            if (!q) {
                return true;
            }
            var hay = rowSearchHaystack(row);
            var tokens = q.split(/\s+/).filter(Boolean);
            if (!tokens.length) {
                return true;
            }
            return tokens.every(function (token) {
                return hay.indexOf(token) !== -1;
            });
        }

        function applyFilter() {
            var q = input.value || "";
            var visible = 0;
            rows.forEach(function (row) {
                var show = rowMatchesQuery(row, q);
                if (show) {
                    row.removeAttribute("hidden");
                    visible += 1;
                } else {
                    row.setAttribute("hidden", "");
                }
            });
            if (emptyMsg) {
                if (visible > 0) {
                    emptyMsg.setAttribute("hidden", "");
                } else {
                    emptyMsg.removeAttribute("hidden");
                }
            }
            closeAllMenus(null);
        }

        input.addEventListener("input", applyFilter);
        input.addEventListener("search", applyFilter);
        input.addEventListener("keyup", applyFilter);
        input.addEventListener("change", applyFilter);
    }

    initQuoteSearch();

    function copyTextToClipboard(text) {
        if (navigator.clipboard && navigator.clipboard.writeText) {
            return navigator.clipboard.writeText(text);
        }
        return new Promise(function (resolve, reject) {
            var ta = document.createElement("textarea");
            ta.value = text;
            ta.setAttribute("readonly", "");
            ta.style.position = "fixed";
            ta.style.left = "-9999px";
            document.body.appendChild(ta);
            ta.select();
            try {
                if (document.execCommand("copy")) {
                    resolve();
                } else {
                    reject(new Error("copy failed"));
                }
            } catch (err) {
                reject(err);
            } finally {
                document.body.removeChild(ta);
            }
        });
    }

    function initCopyEmailButtons() {
        document.querySelectorAll(".drose-quote-staff-menu__item--copy-email").forEach(function (btn) {
            var resetTimer = null;
            btn.addEventListener("click", function (event) {
                event.preventDefault();
                event.stopPropagation();
                var email = (btn.getAttribute("data-email") || "").trim();
                if (!email) {
                    return;
                }
                var labelCopy = btn.getAttribute("data-label-copy") || btn.textContent;
                var labelCopied = btn.getAttribute("data-label-copied") || "Copied!";
                copyTextToClipboard(email).then(function () {
                    if (resetTimer) {
                        window.clearTimeout(resetTimer);
                    }
                    btn.textContent = labelCopied;
                    resetTimer = window.setTimeout(function () {
                        btn.textContent = labelCopy;
                        resetTimer = null;
                    }, 1400);
                    window.setTimeout(function () {
                        var menu = btn.closest(".drose-quote-staff-menu");
                        if (menu) {
                            closeMenu(menu);
                        }
                    }, 700);
                }).catch(function () {
                    /* ignore */
                });
            });
        });
    }

    initCopyEmailButtons();

    /* Mobile card: Servizio / Stato / data nascosti → freccia per espandere */
    document.querySelectorAll(".drose-quote-staff-card-toggle").forEach(function (btn) {
        btn.addEventListener("click", function (event) {
            event.preventDefault();
            event.stopPropagation();
            var row = btn.closest("tr");
            if (!row) {
                return;
            }
            var open = row.classList.toggle("is-expanded");
            btn.setAttribute("aria-expanded", open ? "true" : "false");
            var labelExpand = btn.getAttribute("data-label-expand") || "Show details";
            var labelCollapse = btn.getAttribute("data-label-collapse") || "Hide details";
            btn.setAttribute("aria-label", open ? labelCollapse : labelExpand);
        });
    });
})();
