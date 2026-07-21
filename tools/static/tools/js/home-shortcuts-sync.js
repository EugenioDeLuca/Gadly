/**
 * Popola Quick access prima del paint (evita salti layout al refresh).
 * Chiamare con la chiave storage utente (id o "anon").
 */
(function() {
    var toolNameByNormalizedHref = null;

    function normalizeUrl(raw) {
        if (!raw) return "";
        var u = String(raw).split("?")[0].split("#")[0];
        if (u.length > 1 && u.charAt(u.length - 1) === "/") {
            u = u.slice(0, -1);
        }
        return u;
    }

    function ensureToolNameMap() {
        if (toolNameByNormalizedHref) return;
        toolNameByNormalizedHref = {};
        try {
            document.querySelectorAll('.tool-btn-wrap a.tool-btn').forEach(function(a) {
                var href = a.getAttribute('href');
                if (!href) return;
                toolNameByNormalizedHref[normalizeUrl(href)] = a.textContent.trim();
            });
        } catch (e) {
            toolNameByNormalizedHref = {};
        }
    }

    function escapeAttr(value) {
        return String(value).replace(/\\/g, "\\\\").replace(/"/g, '\\"');
    }

    function escapeHtml(value) {
        return String(value)
            .replace(/&/g, "&amp;")
            .replace(/</g, "&lt;")
            .replace(/>/g, "&gt;")
            .replace(/"/g, "&quot;");
    }

    function getToolName(url) {
        ensureToolNameMap();
        var norm = normalizeUrl(url);
        if (norm && toolNameByNormalizedHref[norm]) return toolNameByNormalizedHref[norm];

        // Fallback: niente mapping disponibile (es. DOM non pronto).
        return norm
            .replace(/\//g, " ")
            .replace(/-/g, " ")
            .trim() || url;
    }

    function renderHomeShortcuts(storageKey) {
        var section = document.getElementById("shortcuts-section");
        var grid = document.getElementById("shortcuts-grid");
        var container = document.querySelector(".homepage .container");
        if (!section || !grid) return;

        var favKey = "gadly-favorites:" + (storageKey || "anon");
        var favs = [];
        try {
            favs = JSON.parse(localStorage.getItem(favKey) || "[]");
        } catch (e) {
            favs = [];
        }

        if (!favs.length) {
            document.documentElement.classList.remove("gadly-has-shortcuts");
            document.documentElement.style.removeProperty("--gadly-shortcuts-count");
            document.documentElement.style.removeProperty("--gadly-shortcuts-rows");
            if (container) container.classList.remove("has-shortcuts");
            section.setAttribute("aria-hidden", "true");
            grid.innerHTML = "";
            return;
        }

        document.documentElement.classList.add("gadly-has-shortcuts");
        document.documentElement.style.setProperty("--gadly-shortcuts-count", String(favs.length));
        document.documentElement.style.setProperty("--gadly-shortcuts-rows", String(Math.ceil(favs.length / 4)));
        if (container) container.classList.add("has-shortcuts");
        section.removeAttribute("aria-hidden");
        grid.innerHTML = favs.map(function(url) {
            var name = getToolName(url);
            return '<a href="' + escapeAttr(url) + '" class="tool-btn shortcuts-btn">' + escapeHtml(name) + "</a>";
        }).join("");
        if (typeof window.__gadlySetupTrashDragSources === "function") {
            window.__gadlySetupTrashDragSources();
        }
    }

    window.gadlyRenderHomeShortcuts = renderHomeShortcuts;
})();
