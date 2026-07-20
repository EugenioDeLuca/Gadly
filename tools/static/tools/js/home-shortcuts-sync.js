/**
 * Popola Quick access prima del paint (evita salti layout al refresh).
 * Chiamare con la chiave storage utente (id o "anon").
 */
(function() {
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
        var a = document.querySelector('.tool-btn-wrap a[href="' + escapeAttr(url) + '"]');
        if (a) return a.textContent.trim();
        return url.replace(/\//g, " ").replace(/-/g, " ").trim() || url;
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
            section.hidden = true;
            section.style.display = "none";
            if (container) container.classList.remove("has-shortcuts");
            grid.innerHTML = "";
            return;
        }

        document.documentElement.classList.add("gadly-has-shortcuts");
        document.documentElement.style.setProperty("--gadly-shortcuts-count", String(favs.length));
        section.hidden = false;
        section.style.display = "block";
        if (container) container.classList.add("has-shortcuts");
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
