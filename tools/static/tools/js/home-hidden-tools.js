/**
 * Tool nascosti dalla home — localStorage per utente/anon.
 * Utenti loggati: sync silenzioso con il profilo sul server.
 */
(function (global) {
    var PREFIX = "gadly-hidden-tools-v2:";
    var LEGACY_PREFIX = "gadly-hidden-tools-v1:";
    var remotePushTimer = null;
    var remoteSynced = false;

    function storageSuffix() {
        return global.GADLY_USER_STORAGE_KEY || "anon";
    }

    function storageKey() {
        return PREFIX + storageSuffix();
    }

    function normalizeUrl(href) {
        if (!href) return "";
        try {
            var u = new URL(href, global.location.origin);
            var path = u.pathname || "/";
            if (path.length > 1 && path.charAt(path.length - 1) === "/") {
                path = path.slice(0, -1);
            }
            return path;
        } catch (e) {
            var raw = String(href).split("?")[0].split("#")[0];
            if (raw.length > 1 && raw.charAt(raw.length - 1) === "/") {
                raw = raw.slice(0, -1);
            }
            return raw;
        }
    }

    function readRaw(key) {
        try {
            var raw = localStorage.getItem(key);
            var arr = JSON.parse(raw || "[]");
            return Array.isArray(arr) ? arr : [];
        } catch (e) {
            return [];
        }
    }

    function discoverStorageKeys() {
        var keys = [];
        var canonical = storageKey();
        if (keys.indexOf(canonical) < 0) keys.push(canonical);
        try {
            for (var i = 0; i < localStorage.length; i++) {
                var k = localStorage.key(i);
                if (!k || k.indexOf(PREFIX) !== 0) continue;
                if (keys.indexOf(k) < 0) keys.push(k);
            }
        } catch (e2) {}
        return keys;
    }

    function purgeLegacyStorage() {
        try {
            for (var i = localStorage.length - 1; i >= 0; i--) {
                var k = localStorage.key(i);
                if (k && k.indexOf(LEGACY_PREFIX) === 0) {
                    localStorage.removeItem(k);
                }
            }
        } catch (e) {}
    }

    function sanitizeToolList(arr) {
        var seen = {};
        var merged = [];
        (arr || []).forEach(function (item) {
            if (!item || !item.url) return;
            var url = normalizeUrl(item.url);
            if (!url || seen[url]) return;
            seen[url] = true;
            merged.push({
                url: url,
                name: item.name || url,
                categoryId: item.categoryId || "",
                categoryName: item.categoryName || ""
            });
        });
        return merged;
    }

    function readAll() {
        var keys = global.GADLY_USER_AUTHENTICATED
            ? [storageKey()]
            : discoverStorageKeys();
        return sanitizeToolList(keys.reduce(function (acc, key) {
            return acc.concat(readRaw(key));
        }, []));
    }

    function getCsrfToken() {
        var cookies = document.cookie ? document.cookie.split(";") : [];
        for (var i = 0; i < cookies.length; i++) {
            var c = cookies[i].trim();
            if (c.indexOf("csrftoken=") === 0) {
                return decodeURIComponent(c.substring("csrftoken=".length));
            }
        }
        return "";
    }

    function readServerSnapshot() {
        var el = document.getElementById("gadly-server-hidden-tools");
        if (!el) return null;
        try {
            var data = JSON.parse(el.textContent);
            return Array.isArray(data) ? sanitizeToolList(data) : null;
        } catch (e) {
            return null;
        }
    }

    function writeAllLocal(arr) {
        var clean = sanitizeToolList(arr);
        try {
            localStorage.setItem(storageKey(), JSON.stringify(clean));
            if (!global.GADLY_USER_AUTHENTICATED) {
                discoverStorageKeys().forEach(function (key) {
                    if (key !== storageKey()) {
                        localStorage.removeItem(key);
                    }
                });
            }
        } catch (e) {}
        return clean;
    }

    function scheduleRemotePush() {
        if (!global.GADLY_USER_AUTHENTICATED || !global.GADLY_HOME_HIDDEN_TOOLS_API) return;
        if (remotePushTimer) clearTimeout(remotePushTimer);
        remotePushTimer = setTimeout(function () {
            remotePushTimer = null;
            pushRemote(readAll());
        }, 600);
    }

    function pushRemote(arr, done) {
        if (!global.GADLY_USER_AUTHENTICATED || !global.GADLY_HOME_HIDDEN_TOOLS_API) {
            if (done) done(false);
            return;
        }
        fetch(global.GADLY_HOME_HIDDEN_TOOLS_API, {
            method: "POST",
            credentials: "same-origin",
            headers: {
                "Content-Type": "application/json",
                "X-CSRFToken": getCsrfToken()
            },
            body: JSON.stringify({ tools: sanitizeToolList(arr) })
        }).then(function (resp) {
            if (done) done(resp.ok);
        }).catch(function () {
            if (done) done(false);
        });
    }

    function writeAll(arr) {
        writeAllLocal(arr);
        scheduleRemotePush();
    }

    function bootRemoteSync(done) {
        done = done || function () {};
        if (!global.GADLY_USER_AUTHENTICATED) {
            done();
            return;
        }
        if (remoteSynced) {
            done();
            return;
        }
        remoteSynced = true;

        var server = readServerSnapshot();
        if (server === null) {
            done();
            return;
        }

        writeAllLocal(server);
        done();
    }

    function removeFromFavorites(url) {
        var favKey = "gadly-favorites:" + storageSuffix();
        try {
            var favs = JSON.parse(localStorage.getItem(favKey) || "[]");
            if (!Array.isArray(favs)) return;
            var i = favs.indexOf(url);
            if (i >= 0) {
                favs.splice(i, 1);
                localStorage.setItem(favKey, JSON.stringify(favs));
            }
        } catch (e2) {}
    }

    function hideTool(entry) {
        if (!entry || !entry.url) return;
        entry.url = normalizeUrl(entry.url);
        var list = readAll();
        if (list.some(function (item) { return item.url === entry.url; })) return;
        list.push({
            url: entry.url,
            name: entry.name || entry.url,
            categoryId: entry.categoryId || "",
            categoryName: entry.categoryName || ""
        });
        writeAll(list);
        removeFromFavorites(entry.url);
        syncHiddenToolsUi();
    }

    function hideTools(entries) {
        if (!entries || !entries.length) return;
        var list = readAll();
        var known = {};
        list.forEach(function (item) { known[item.url] = true; });
        entries.forEach(function (entry) {
            if (!entry || !entry.url) return;
            entry.url = normalizeUrl(entry.url);
            if (known[entry.url]) return;
            known[entry.url] = true;
            list.push({
                url: entry.url,
                name: entry.name || entry.url,
                categoryId: entry.categoryId || "",
                categoryName: entry.categoryName || ""
            });
            removeFromFavorites(entry.url);
        });
        writeAll(list);
        syncHiddenToolsUi();
    }

    function restoreTools(urls) {
        if (!urls || !urls.length) return;
        var removeSet = {};
        urls.forEach(function (u) {
            var normalized = normalizeUrl(u);
            if (normalized) removeSet[normalized] = true;
        });
        writeAll(readAll().filter(function (item) { return !removeSet[item.url]; }));
        syncHiddenToolsUi();
    }

    function restoreTool(url) {
        url = normalizeUrl(url);
        writeAll(readAll().filter(function (item) { return item.url !== url; }));
        syncHiddenToolsUi();
    }

    function restoreAll() {
        discoverStorageKeys().forEach(function (key) {
            try {
                localStorage.removeItem(key);
            } catch (e) {}
        });
        if (global.GADLY_USER_AUTHENTICATED) {
            pushRemote([]);
        }
        syncHiddenToolsUi();
    }

    function isHidden(url) {
        url = normalizeUrl(url);
        return readAll().some(function (item) { return item.url === url; });
    }

    function count() {
        return readAll().length;
    }

    function updateTrashBadge(n) {
        var badge = document.getElementById("desktop-trash-bin-count");
        if (!badge) return;
        var current = parseInt(badge.textContent, 10);
        if (!isNaN(current) && current === n && (n > 0) === !badge.hidden) {
            document.documentElement.classList.toggle("gadly-home-has-hidden-tools", n > 0);
            return;
        }
        badge.textContent = n > 0 ? String(n) : "";
        badge.hidden = n < 1;
        badge.setAttribute("aria-hidden", n < 1 ? "true" : "false");
        badge.classList.toggle("desktop-trash-bin__count--wide", n >= 10);
        document.documentElement.classList.toggle("gadly-home-has-hidden-tools", n > 0);
    }

    function applyAllToolsQuickNavGroup(group, hiddenSet) {
        var linksWrap = group.querySelector(".tool-quick-nav-links");
        if (!linksWrap) return;

        linksWrap.querySelectorAll(".tool-quick-nav-link-line").forEach(function (line) {
            var link = line.querySelector("a[href]");
            if (link) linksWrap.insertBefore(link, line);
            line.remove();
        });
        linksWrap.querySelectorAll(".tool-quick-nav-restore-one, .tool-quick-nav-restore-category").forEach(function (btn) {
            btn.remove();
        });

        var links = linksWrap.querySelectorAll("a[href]");
        var removedCount = 0;

        links.forEach(function (a) {
            var url = normalizeUrl(a.getAttribute("href"));
            var removed = !!(url && hiddenSet[url]);
            a.classList.remove("tool-quick-nav-link--hidden-home");
            a.classList.toggle("tool-quick-nav-link--removed-home", removed);
            a.setAttribute("aria-hidden", "false");
            if (removed) removedCount++;
        });

        var allRemoved = links.length > 0 && removedCount === links.length;
        var title = group.querySelector(".tool-quick-nav-title");
        var row = group.querySelector(".tool-quick-nav-row");
        var toggle = group.querySelector(".tool-quick-nav-toggle");

        group.classList.remove("tool-quick-nav-group--all-hidden");
        group.setAttribute("aria-hidden", "false");
        group.classList.toggle("tool-quick-nav-group--category-removed-home", allRemoved);
        if (title) title.classList.toggle("tool-quick-nav-title--removed-home", allRemoved);
        if (row) row.classList.toggle("tool-quick-nav-row--removed-home", allRemoved);
        if (toggle) toggle.classList.toggle("tool-quick-nav-toggle--removed-home", allRemoved);
    }

    function applyQuickNavGroup(group, hiddenSet, keepRemovedVisible) {
        var linksWrap = group.querySelector(".tool-quick-nav-links");
        if (!linksWrap) return;

        var links = linksWrap.querySelectorAll("a[href]");
        var visibleCount = 0;

        links.forEach(function (a) {
            var url = normalizeUrl(a.getAttribute("href"));
            var removed = !!(url && hiddenSet[url]);

            if (keepRemovedVisible) {
                a.classList.remove("tool-quick-nav-link--hidden-home");
                a.classList.toggle("tool-quick-nav-link--removed-home", removed);
                a.setAttribute("aria-hidden", "false");
                visibleCount++;
                return;
            }

            a.classList.remove("tool-quick-nav-link--removed-home");
            a.classList.toggle("tool-quick-nav-link--hidden-home", removed);
            a.setAttribute("aria-hidden", removed ? "true" : "false");
            if (!removed) visibleCount++;
        });

        if (keepRemovedVisible) {
            group.classList.remove("tool-quick-nav-group--all-hidden");
            group.setAttribute("aria-hidden", "false");
            return;
        }

        var hideGroup = links.length > 0 && visibleCount === 0;
        group.classList.toggle("tool-quick-nav-group--all-hidden", hideGroup);
        group.setAttribute("aria-hidden", hideGroup ? "true" : "false");
    }

    function bindQuickNavRemovedClicks() {
        if (document.documentElement.dataset.gadlyQuickNavRemovedBound === "1") return;
        document.documentElement.dataset.gadlyQuickNavRemovedBound = "1";

        document.addEventListener("click", function (e) {
            if (e.defaultPrevented || e.button !== 0) return;

            var removedTitle = e.target.closest(".tool-quick-nav .tool-quick-nav-title--removed-home");
            if (removedTitle) {
                e.preventDefault();
                var group = removedTitle.closest(".tool-quick-nav-group");
                var categoryIds = group ? (group.getAttribute("data-home-category-ids") || "").trim() : "";
                if (!categoryIds) return;
                var base = global.GADLY_HIDDEN_TOOLS_URL || "/hidden-tools/";
                var dest = base + (base.indexOf("?") >= 0 ? "&" : "?") +
                    "highlightCategory=" + encodeURIComponent(categoryIds);
                global.location.href = dest;
                return;
            }

            var a = e.target.closest(
                ".tool-quick-nav .tool-quick-nav-links a.tool-quick-nav-link--removed-home, " +
                ".tool-popular-nav .tool-quick-nav-links a.tool-quick-nav-link--removed-home"
            );
            if (!a) return;
            e.preventDefault();
            var url = normalizeUrl(a.getAttribute("href"));
            var base = global.GADLY_HIDDEN_TOOLS_URL || "/hidden-tools/";
            var dest = base + (base.indexOf("?") >= 0 ? "&" : "?") + "focus=" + encodeURIComponent(url);
            global.location.href = dest;
        }, true);
    }

    function applyToQuickNav(root) {
        root = root || document;
        var nav = root.querySelector(".tool-quick-nav");
        if (!nav && !root.querySelector(".tool-popular-nav")) return;

        var hidden = readAll();
        var hiddenSet = {};
        hidden.forEach(function (item) {
            hiddenSet[item.url] = true;
        });

        root.querySelectorAll(".tool-quick-nav .tool-quick-nav-group").forEach(function (group) {
            applyAllToolsQuickNavGroup(group, hiddenSet);
        });

        root.querySelectorAll(".tool-popular-nav .tool-quick-nav-group").forEach(function (group) {
            applyQuickNavGroup(group, hiddenSet, true);
        });

        bindQuickNavRemovedClicks();

        if (typeof global.__gadlyPlaceQuickNav === "function") {
            requestAnimationFrame(function () {
                global.__gadlyPlaceQuickNav();
            });
        }
    }

    function syncHiddenToolsUi(root) {
        if (document.body.classList.contains("homepage")) {
            applyToHomePage(root);
        }
        applyToQuickNav(root);
    }

    function releaseFocusFrom(el) {
        var active = document.activeElement;
        if (!active || active === document.body || active === document.documentElement) {
            return;
        }
        if (el === active || el.contains(active)) {
            try {
                active.blur();
            } catch (e) { /* ignore */ }
        }
    }

    function applyToHomePage(root) {
        root = root || document;
        if (!root.querySelector || !document.body.classList.contains("homepage")) return;

        var hidden = readAll();
        var hiddenSet = {};
        hidden.forEach(function (item) { hiddenSet[item.url] = true; });

        root.querySelectorAll("body.homepage .tool-btn-wrap").forEach(function (wrap) {
            var a = wrap.querySelector("a.tool-btn");
            var url = a ? normalizeUrl(a.getAttribute("href")) : "";
            var hide = !!(url && hiddenSet[url]);
            if (hide) {
                releaseFocusFrom(wrap);
                // Fuori dal layout: niente display toggle che può far flashare.
                if (wrap.parentNode) {
                    wrap.parentNode.removeChild(wrap);
                }
                return;
            }
            wrap.classList.remove("tool-btn-wrap--hidden-home");
            wrap.hidden = false;
            wrap.style.removeProperty("display");
            wrap.removeAttribute("aria-hidden");
        });

        root.querySelectorAll("body.homepage .tool-section").forEach(function (section) {
            var total = section.querySelectorAll(".tool-btn-wrap").length;
            if (total === 0) {
                releaseFocusFrom(section);
                if (section.parentNode) {
                    section.parentNode.removeChild(section);
                }
                return;
            }
            section.classList.remove("tool-section--all-hidden");
            section.hidden = false;
            section.style.removeProperty("display");
            section.removeAttribute("aria-hidden");
        });

        updateTrashBadge(hidden.length);
    }

    function dispatchHomeHiddenToolsReady() {
        var root = document.documentElement;
        if (root.dataset.gadlyHomeHiddenReadyEvt === "1") return;
        root.dataset.gadlyHomeHiddenReadyEvt = "1";
        try {
            document.dispatchEvent(new CustomEvent("gadly-home-hidden-tools-ready"));
        } catch (e) {
            if (typeof document.createEvent === "function") {
                var ev = document.createEvent("Event");
                ev.initEvent("gadly-home-hidden-tools-ready", true, true);
                document.dispatchEvent(ev);
            }
        }
    }

    function bootHiddenToolsUi() {
        var root = document.documentElement;
        var homeSynced = root.dataset.gadlyHomeHiddenSynced === "1";

        if (document.body.classList.contains("homepage") && !homeSynced) {
            applyToHomePage();
        } else if (document.body.classList.contains("homepage") && homeSynced) {
            updateTrashBadge(readAll().length);
        }
        applyToQuickNav();
        if (typeof global.__gadlySetupTrashDragSources === "function") {
            global.__gadlySetupTrashDragSources();
        }
        dispatchHomeHiddenToolsReady();
    }

    function boot() {
        bootRemoteSync(bootHiddenToolsUi);
    }

    purgeLegacyStorage();

    global.gadlyHiddenTools = {
        normalizeUrl: normalizeUrl,
        getAll: readAll,
        hideTool: hideTool,
        hideTools: hideTools,
        restoreTool: restoreTool,
        restoreTools: restoreTools,
        restoreAll: restoreAll,
        isHidden: isHidden,
        count: count,
        applyToHomePage: applyToHomePage,
        applyToQuickNav: applyToQuickNav,
        syncHiddenToolsUi: syncHiddenToolsUi
    };

    if (document.readyState === "loading") {
        document.addEventListener("DOMContentLoaded", boot, { once: true });
    } else {
        boot();
    }
})(window);
