document.addEventListener("DOMContentLoaded", function() {
    var searchInput = document.getElementById("tool-search");
    var toolSections = document.querySelectorAll(".homepage .tool-section");
    var storageSuffix = window.GADLY_USER_STORAGE_KEY || "anon";
    var favKey = "gadly-favorites:" + storageSuffix;
    var userAuthenticated = window.GADLY_USER_AUTHENTICATED === true;

    var isMobileView = function() { return window.innerWidth <= 768; };
    var OPEN_SECTIONS_KEY = "gadly-home-open-sections";

    function saveOpenSections() {
        if (!isMobileView()) return;
        var ids = [];
        toolSections.forEach(function(section) {
            if (!section.classList.contains("is-open")) return;
            var btn = section.querySelector(".category-btn");
            if (btn && btn.id) ids.push(btn.id);
        });
        try {
            sessionStorage.setItem(OPEN_SECTIONS_KEY, JSON.stringify(ids));
        } catch (e) { /* ignore */ }
    }

    function closeAllSectionsExcept(exceptSection) {
        toolSections.forEach(function(s) {
            if (exceptSection && s === exceptSection) return;
            s.classList.remove("is-open");
            var b = s.querySelector(".category-btn");
            if (b) b.setAttribute("aria-expanded", "false");
        });
    }

    function restoreOpenSections() {
        var root = document.documentElement;
        if (!isMobileView()) {
            root.removeAttribute("data-home-open");
            return;
        }
        var ids = [];
        try {
            ids = JSON.parse(sessionStorage.getItem(OPEN_SECTIONS_KEY) || "[]");
        } catch (e) {
            ids = [];
        }
        var openId = ids.length ? ids[ids.length - 1] : null;
        toolSections.forEach(function(section) {
            var btn = section.querySelector(".category-btn");
            var id = btn ? btn.id : "";
            var open = openId && id === openId;
            section.classList.toggle("is-open", open);
            if (btn) btn.setAttribute("aria-expanded", open ? "true" : "false");
        });
        root.removeAttribute("data-home-open");
    }

    /* Category accordion (tablet + mobile): una sola sezione aperta */
    var categoryBtns = document.querySelectorAll(".homepage .category-btn");
    categoryBtns.forEach(function(btn) {
        btn.addEventListener("click", function() {
            var section = btn.closest(".tool-section");
            if (!section) return;
            if (isMobileView()) {
                if (btn.dataset.gadlyDidDrag === "1" ||
                    btn.dataset.gadlySuppressClick === "1" ||
                    document.documentElement.classList.contains("gadly-trash-drag-active")) {
                    return;
                }
                /* Blocca lo scroll rispetto al bottone: chiudere una categoria sopra
                   altrimenti “alza” il bottone cliccato invece di aprire il menu sotto. */
                var btnTopBefore = btn.getBoundingClientRect().top;
                var wasOpen = section.classList.contains("is-open");
                closeAllSectionsExcept(section);
                if (!wasOpen) {
                    section.classList.add("is-open");
                    btn.setAttribute("aria-expanded", "true");
                } else {
                    section.classList.remove("is-open");
                    btn.setAttribute("aria-expanded", "false");
                }
                var delta = btn.getBoundingClientRect().top - btnTopBefore;
                if (Math.abs(delta) > 0.5) {
                    window.scrollBy(0, delta);
                }
                saveOpenSections();
            }
        });
    });

    document.querySelectorAll(".homepage a.tool-btn, .homepage a.shortcuts-btn").forEach(function(link) {
        link.addEventListener("click", function() {
            if (isMobileView()) saveOpenSections();
        });
    });

    window.addEventListener("resize", function() {
        if (!isMobileView()) {
            toolSections.forEach(function(s) { s.classList.remove("is-open"); });
            categoryBtns.forEach(function(b) { b.setAttribute("aria-expanded", "true"); });
            clearSearchMatchHighlights();
        }
    });

    restoreOpenSections();
    window.addEventListener("pageshow", function(event) {
        if (event.persisted) restoreOpenSections();
    });

    function normalizeFavUrl(raw) {
        if (!raw) return "";
        var s = String(raw).split("?")[0].split("#")[0];
        if (s.length > 1 && s.charAt(s.length - 1) === "/") s = s.slice(0, -1);
        return s;
    }

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
        var norm = normalizeFavUrl(url);
        var i = -1;
        for (var fi = 0; fi < favs.length; fi++) {
            if (normalizeFavUrl(favs[fi]) === norm) { i = fi; break; }
        }
        if (i >= 0) favs.splice(i, 1);
        else favs.push(url);
        setFavorites(favs);
        updateStarIcons();
        renderShortcuts();
    }

    function renderShortcuts() {
        if (typeof window.gadlyRenderHomeShortcuts === "function") {
            window.gadlyRenderHomeShortcuts(storageSuffix);
            return;
        }
        var section = document.getElementById("shortcuts-section");
        var grid = document.getElementById("shortcuts-grid");
        var container = document.querySelector(".homepage .container");
        if (!section || !grid) return;
        var favs = getFavorites();
        if (favs.length === 0) {
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
            var a = document.querySelector('.tool-btn-wrap a[href="' + url + '"]');
            var name = a ? a.textContent.trim() : url.replace(/\//g, "").replace(/-/g, " ");
            return '<a href="' + url + '" class="tool-btn shortcuts-btn">' + name + "</a>";
        }).join("");
        if (typeof window.__gadlySetupTrashDragSources === "function") {
            window.__gadlySetupTrashDragSources();
        }
    }

    function syncFavPrehideStyle(favUrls) {
        // Lo style early-boot #gadly-home-fav-prehide forza ★ rosso via CSS.
        // Va riallineato a ogni toggle, altrimenti la stellina resta piena dopo remove.
        var style = document.getElementById("gadly-home-fav-prehide");
        var favs = (favUrls || getFavorites()).map(normalizeFavUrl).filter(Boolean);
        if (!favs.length) {
            if (style && style.parentNode) style.parentNode.removeChild(style);
            return;
        }
        function esc(v) {
            return String(v).replace(/\\/g, "\\\\").replace(/"/g, '\\"');
        }
        var rules = [];
        var seen = {};
        favs.forEach(function (u) {
            if (seen[u]) return;
            seen[u] = true;
            [u, u + "/"].forEach(function (href) {
                rules.push(
                    'body.homepage .tool-btn-wrap:has(> a.tool-btn[href="' + esc(href) + '"]) .tool-fav' +
                    '{color:#dc3545!important}'
                );
                rules.push(
                    'body.homepage .tool-btn-wrap:has(> a.tool-btn[href="' + esc(href) + '"]) .tool-fav::before' +
                    '{content:"★"!important;color:#dc3545!important}'
                );
            });
        });
        if (!style) {
            style = document.createElement("style");
            style.id = "gadly-home-fav-prehide";
            (document.head || document.documentElement).appendChild(style);
        }
        style.textContent = rules.join("");
    }

    function updateStarIcons() {
        var favs = getFavorites().map(normalizeFavUrl);
        document.querySelectorAll(".tool-btn-wrap").forEach(function(wrap) {
            var a = wrap.querySelector("a.tool-btn");
            var star = wrap.querySelector(".tool-fav");
            if (!a || !star) return;
            var url = normalizeFavUrl(a.getAttribute("href"));
            var isFav = favs.indexOf(url) >= 0;
            // Solo classe: il glifo ★/☆ è CSS (::before). Evita rewrite textContent = flash.
            if (star.classList.contains("is-favorite") !== isFav) {
                star.classList.toggle("is-favorite", isFav);
            }
        });
        syncFavPrehideStyle(favs);
    }

    function pulseSearchGridMatch(grid) {
        grid.classList.remove("tool-search-match");
        void grid.offsetWidth;
        grid.classList.add("tool-search-match");
    }

    function clearSearchMatchHighlights() {
        document.querySelectorAll(".homepage .tool-section .tool-grid.tool-search-match").forEach(function(grid) {
            grid.classList.remove("tool-search-match");
        });
    }

    function applyToolSearch(queryRaw) {
        var q = (queryRaw || "").trim().toLowerCase();
        var isSearching = q.length > 0;
        var highlightMobile = isSearching && isMobileView();
        if (!highlightMobile) {
            clearSearchMatchHighlights();
        }
        toolSections.forEach(function(section) {
            var btn = section.querySelector(".category-btn");
            var grid = section.querySelector(".tool-grid");
            var btns = section.querySelectorAll(".tool-btn-wrap");
            var visible = 0;
            btns.forEach(function(wrap) {
                if (wrap.classList.contains("tool-btn-wrap--hidden-home") || wrap.hidden) {
                    return;
                }
                var a = wrap.querySelector("a.tool-btn");
                var name = (a ? a.textContent : "").toLowerCase();
                var match = !isSearching || name.indexOf(q) >= 0;
                wrap.style.display = match ? "" : "none";
                if (match) visible++;
            });
            if (section.classList.contains("tool-section--all-hidden") || section.hidden) {
                return;
            }
            section.style.display = !isSearching || visible > 0 ? "" : "none";
            if (isMobileView()) {
                if (isSearching && visible > 0) {
                    section.classList.add("is-open");
                    if (btn) btn.setAttribute("aria-expanded", "true");
                } else if (!isSearching) {
                    /* non chiudere le sezioni ripristinate quando la ricerca è vuota */
                } else {
                    section.classList.remove("is-open");
                    if (btn) btn.setAttribute("aria-expanded", "false");
                }
            }
            if (grid) {
                if (highlightMobile && visible > 0) {
                    requestAnimationFrame(function() {
                        pulseSearchGridMatch(grid);
                    });
                } else {
                    grid.classList.remove("tool-search-match");
                }
            }
        });
    }

    if (searchInput) {
        searchInput.addEventListener("input", function() {
            applyToolSearch(this.value);
        });
    }

    document.querySelectorAll(".tool-fav").forEach(function(star) {
        star.addEventListener("click", function(e) {
            e.preventDefault();
            e.stopPropagation();
            if (!userAuthenticated) {
                var modal = document.getElementById("login-required-modal");
                if (modal) {
                    modal.style.display = "flex";
                } else {
                    alert(gettext("You cannot use this feature. Please log in."));
                }
                return;
            }
            var wrap = star.closest(".tool-btn-wrap");
            var a = wrap ? wrap.querySelector("a.tool-btn") : null;
            if (a) toggleFavorite(a.getAttribute("href"));
        });
    });

    if (userAuthenticated) {
        updateStarIcons();
        var shortcutsGrid = document.getElementById("shortcuts-grid");
        if (!shortcutsGrid || !shortcutsGrid.children.length) {
            renderShortcuts();
        }
    }

    var loginModal = document.getElementById("login-required-modal");
    if (loginModal) {
        var closeBtn = loginModal.querySelector(".login-required-btn--close");
        var backdrop = loginModal.querySelector(".login-required-backdrop");
        function closeLoginModal() { loginModal.style.display = "none"; }
        if (closeBtn) closeBtn.addEventListener("click", closeLoginModal);
        if (backdrop) backdrop.addEventListener("click", closeLoginModal);
        document.addEventListener("keydown", function(e) {
            if (e.key === "Escape" && loginModal.style.display === "flex") closeLoginModal();
        });
    }
});
