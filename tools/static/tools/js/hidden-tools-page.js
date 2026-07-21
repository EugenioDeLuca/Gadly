/**
 * Pagina tool rimossi — elenco e ripristino.
 */
(function () {
    function escapeHtml(value) {
        return String(value)
            .replace(/&/g, "&amp;")
            .replace(/</g, "&lt;")
            .replace(/>/g, "&gt;")
            .replace(/"/g, "&quot;");
    }

    function syncEmptyClass(hasItems) {
        var root = document.documentElement;
        root.classList.toggle("gadly-hidden-tools-has-items", !!hasItems);
        root.classList.toggle("gadly-hidden-tools-empty", !hasItems);
        if (!hasItems) {
            root.style.removeProperty("--gadly-hidden-tools-min-h");
        }
    }

    function markPageReady() {
        document.body.classList.add("hidden-tools-page--ready");
        if (typeof window.__gadlySaveHiddenToolsContainerHeight === "function") {
            requestAnimationFrame(function () {
                window.__gadlySaveHiddenToolsContainerHeight();
            });
        }
    }

    function render() {
        var root = document.getElementById("hidden-tools-list");
        var empty = document.getElementById("hidden-tools-empty");
        var bottom = document.getElementById("hidden-tools-bottom");
        var container = document.querySelector(".hidden-tools-container");
        if (!root || !window.gadlyHiddenTools) {
            if (bottom) bottom.hidden = true;
            if (container) container.classList.remove("hidden-tools-container--has-footer");
            if (empty) empty.hidden = false;
            syncEmptyClass(false);
            markPageReady();
            return;
        }

        var items = window.gadlyHiddenTools.getAll();
        if (!items.length) {
            root.innerHTML = "";
            if (bottom) bottom.hidden = true;
            if (container) container.classList.remove("hidden-tools-container--has-footer");
            if (empty) empty.hidden = false;
            syncEmptyClass(false);
            markPageReady();
            return;
        }
        syncEmptyClass(true);
        if (empty) empty.hidden = true;
        if (bottom) bottom.hidden = true;
        if (container) container.classList.add("hidden-tools-container--has-footer");

        var groups = {};
        items.forEach(function (item) {
            var key = item.categoryName || "—";
            if (!groups[key]) groups[key] = [];
            groups[key].push(item);
        });

        var restoreLabel = window.GADLY_HIDDEN_TOOLS_RESTORE_LABEL || "Restore";
        var html = "";
        Object.keys(groups).sort().forEach(function (catName) {
            var catId = (groups[catName][0] && groups[catName][0].categoryId) || "";
            html += '<section class="tool-section hidden-tools-group is-open" data-hidden-category-id="' +
                escapeHtml(catId) + '">';
            html += '<button type="button" class="category-btn hidden-tools-category-btn--desktop" aria-expanded="true" tabindex="-1">';
            html += '<span class="category-btn-label category-btn-label--desktop">' + escapeHtml(catName) + "</span>";
            html += '<span class="category-btn-chevron" aria-hidden="true">▼</span>';
            html += "</button>";
            html += '<div class="hidden-tools-category-title hidden-tools-category-title--mobile" role="heading" aria-level="2">' +
                escapeHtml(catName) + "</div>";
            html += '<div class="tool-grid">';
            groups[catName].forEach(function (item) {
                html += '<div class="tool-btn-wrap" data-hidden-tool-url="' + escapeHtml(item.url) + '">';
                /* Solo etichetta: tool rimosso non si apre da qui, solo ripristino. */
                html += '<span class="tool-btn tool-btn--removed" aria-disabled="true">' +
                    escapeHtml(item.name) + "</span>";
                html += '<button type="button" class="tool-fav hidden-tools-restore-btn" data-url="' +
                    escapeHtml(item.url) + '" title="' + escapeHtml(restoreLabel) + '" aria-label="' +
                    escapeHtml(restoreLabel) + '"></button>';
                html += "</div>";
            });
            html += "</div></section>";
        });
        root.innerHTML = html;
        if (bottom) bottom.hidden = false;
        markPageReady();
    }

    function clearFocusQueryParams(keys) {
        if (!window.history || !window.history.replaceState) return;
        var cleanUrl = new URL(window.location.href);
        keys.forEach(function (key) {
            cleanUrl.searchParams.delete(key);
        });
        window.history.replaceState({}, "", cleanUrl.pathname + cleanUrl.search + cleanUrl.hash);
    }

    function focusHighlightedTool() {
        var params = new URLSearchParams(window.location.search);
        var focusRaw = params.get("focus");
        if (!focusRaw || !window.gadlyHiddenTools) return;

        var focus = window.gadlyHiddenTools.normalizeUrl(focusRaw);
        var target = null;
        document.querySelectorAll("#hidden-tools-list .tool-btn-wrap[data-hidden-tool-url]").forEach(function (wrap) {
            if (window.gadlyHiddenTools.normalizeUrl(wrap.getAttribute("data-hidden-tool-url")) === focus) {
                target = wrap;
            }
        });
        if (!target) return;

        target.classList.add("hidden-tools-item--highlight");
        window.setTimeout(function () {
            target.scrollIntoView({ behavior: "smooth", block: "center" });
        }, 80);

        clearFocusQueryParams(["focus"]);
    }

    function focusHighlightCategory() {
        var params = new URLSearchParams(window.location.search);
        var raw = params.get("highlightCategory");
        if (!raw) return;

        var ids = raw.split(",").map(function (part) {
            return part.trim();
        }).filter(Boolean);
        if (!ids.length) return;

        var sections = [];
        document.querySelectorAll("#hidden-tools-list .hidden-tools-group[data-hidden-category-id]").forEach(function (section) {
            var catId = section.getAttribute("data-hidden-category-id") || "";
            if (ids.indexOf(catId) < 0) return;
            section.classList.add("hidden-tools-group--highlight");
            section.querySelectorAll(".tool-btn-wrap").forEach(function (wrap) {
                wrap.classList.add("hidden-tools-item--highlight");
            });
            sections.push(section);
        });

        if (sections.length) {
            window.setTimeout(function () {
                sections[0].scrollIntoView({ behavior: "smooth", block: "start" });
            }, 80);
        }

        clearFocusQueryParams(["highlightCategory"]);
    }

    function bindEvents() {
        var list = document.getElementById("hidden-tools-list");
        if (list && !list.dataset.gadlyBound) {
            list.dataset.gadlyBound = "1";
            list.addEventListener("click", function (e) {
                var btn = e.target.closest(".hidden-tools-restore-btn");
                if (!btn) return;
                e.preventDefault();
                e.stopPropagation();
                var url = btn.getAttribute("data-url");
                if (url) window.gadlyHiddenTools.restoreTool(url);
                render();
            });
        }
        var restoreAll = document.getElementById("hidden-tools-restore-all");
        if (restoreAll && !restoreAll.dataset.gadlyBound) {
            restoreAll.dataset.gadlyBound = "1";
            restoreAll.addEventListener("click", function () {
                window.gadlyHiddenTools.restoreAll();
                window.location.href = window.GADLY_HOME_URL || "/";
            });
        }
    }

    function initPage() {
        render();
        bindEvents();
        focusHighlightedTool();
        focusHighlightCategory();
        window.scrollTo(0, 0);
    }

    if (window.gadlyHiddenTools) {
        initPage();
    } else {
        document.addEventListener("gadly-home-hidden-tools-ready", initPage, { once: true });
    }
})();
