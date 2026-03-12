document.addEventListener("DOMContentLoaded", function() {
    var searchInput = document.getElementById("tool-search");
    var toolSections = document.querySelectorAll(".homepage .tool-section");
    var favKey = "gadly-favorites";

    function getFavorites() {
        try {
            return JSON.parse(localStorage.getItem(favKey) || "[]");
        } catch (e) { return []; }
    }

    function setFavorites(arr) {
        localStorage.setItem(favKey, JSON.stringify(arr));
    }

    function toggleFavorite(url) {
        var favs = getFavorites();
        var i = favs.indexOf(url);
        if (i >= 0) favs.splice(i, 1);
        else favs.push(url);
        setFavorites(favs);
        updateStarIcons();
        renderShortcuts();
    }

    function getToolName(url) {
        var a = document.querySelector('.tool-btn-wrap a[href="' + url + '"]');
        return a ? a.textContent.trim() : url.replace(/\//g, '').replace(/-/g, ' ');
    }

    function renderShortcuts() {
        var section = document.getElementById('shortcuts-section');
        var grid = document.getElementById('shortcuts-grid');
        if (!section || !grid) return;
        var favs = getFavorites();
        if (favs.length === 0) {
            section.style.display = 'none';
            return;
        }
        section.style.display = 'block';
        grid.innerHTML = favs.map(function(url) {
            var name = getToolName(url);
            return '<a href="' + url + '" class="tool-btn shortcuts-btn">' + name + '</a>';
        }).join('');
    }

    function updateStarIcons() {
        var favs = getFavorites();
        document.querySelectorAll(".tool-btn-wrap").forEach(function(wrap) {
            var a = wrap.querySelector("a.tool-btn");
            var star = wrap.querySelector(".tool-fav");
            if (!a || !star) return;
            var url = a.getAttribute("href");
            var isFav = favs.indexOf(url) >= 0;
            star.textContent = isFav ? "★" : "☆";
            star.classList.toggle("is-favorite", isFav);
        });
    }

    if (searchInput) {
        searchInput.addEventListener("input", function() {
            var q = this.value.trim().toLowerCase();
            toolSections.forEach(function(section) {
                var btns = section.querySelectorAll(".tool-btn-wrap");
                var visible = 0;
                btns.forEach(function(wrap) {
                    var a = wrap.querySelector("a.tool-btn");
                    var name = (a ? a.textContent : "").toLowerCase();
                    var match = !q || name.indexOf(q) >= 0;
                    wrap.style.display = match ? "" : "none";
                    if (match) visible++;
                });
                section.style.display = visible > 0 ? "" : "none";
            });
        });
    }

    document.querySelectorAll(".tool-fav").forEach(function(star) {
        star.addEventListener("click", function(e) {
            e.preventDefault();
            e.stopPropagation();
            var wrap = star.closest(".tool-btn-wrap");
            var a = wrap ? wrap.querySelector("a.tool-btn") : null;
            if (a) toggleFavorite(a.getAttribute("href"));
        });
    });

    updateStarIcons();
    renderShortcuts();
});
