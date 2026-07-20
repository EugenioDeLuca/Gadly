(function (global) {
    function normalizePath(p) {
        p = p || "/";
        if (p.length > 1 && p.charAt(p.length - 1) === "/") {
            p = p.slice(0, -1);
        }
        return p || "/";
    }

    function scrollKey() {
        return "gadly-tool-scroll-y-v1:" + normalizePath(location.pathname);
    }

    function persistScroll() {
        try {
            sessionStorage.setItem(scrollKey(), String(Math.max(0, Math.round(window.scrollY))));
        } catch (e) {}
    }

    function readSaved() {
        try {
            var y = parseInt(sessionStorage.getItem(scrollKey()) || "0", 10);
            return !isNaN(y) && y > 0 ? y : 0;
        } catch (e) {
            return 0;
        }
    }

    function isReload() {
        try {
            var nav = performance.getEntriesByType("navigation")[0];
            return !!(nav && nav.type === "reload");
        } catch (e) {
            return false;
        }
    }

    function isPending() {
        return document.documentElement.classList.contains("gadly-tool-scroll-pending");
    }

    function pendingY() {
        var fromVar = parseInt(
            document.documentElement.style.getPropertyValue("--gadly-tool-restore-y"),
            10
        );
        if (!isNaN(fromVar) && fromVar > 0) return fromVar;
        return readSaved();
    }

    function measureMaxY() {
        var root = document.documentElement;
        var body = document.body;
        var h = Math.max(
            root.scrollHeight || 0,
            root.offsetHeight || 0,
            body ? body.scrollHeight : 0,
            body ? body.offsetHeight : 0
        );
        return Math.max(0, h - window.innerHeight);
    }

    function notifyReleased() {
        try {
            document.dispatchEvent(new CustomEvent("gadly-tool-scroll-released"));
        } catch (e) {
            if (typeof document.createEvent === "function") {
                var ev = document.createEvent("Event");
                ev.initEvent("gadly-tool-scroll-released", true, true);
                document.dispatchEvent(ev);
            }
        }
    }

    function releasePending() {
        var root = document.documentElement;
        if (!root.classList.contains("gadly-tool-scroll-pending")) return;
        var y = pendingY();
        root.classList.remove("gadly-tool-scroll-pending");
        root.style.removeProperty("--gadly-tool-restore-y");
        requestAnimationFrame(function () {
            var maxY = measureMaxY();
            var target = Math.min(Math.max(0, y), maxY);
            if (Math.abs(window.scrollY - target) > 2) {
                window.scrollTo(0, target);
            }
            if (target > 0) persistScroll();
            notifyReleased();
        });
    }

    function restoreWhenReady(maxAttempts) {
        if (!isReload()) {
            notifyReleased();
            return;
        }
        var y = readSaved();
        if (y < 1) {
            notifyReleased();
            return;
        }
        if (!isPending()) {
            var attempts = 0;
            var limit = maxAttempts || 64;
            function tickFallback() {
                attempts += 1;
                var maxY = measureMaxY();
                if (maxY >= y - 24 || attempts >= limit) {
                    var target = Math.min(y, maxY);
                    if (Math.abs(window.scrollY - target) > 2) {
                        window.scrollTo(0, target);
                    }
                    if (target > 0) persistScroll();
                    notifyReleased();
                    return;
                }
                requestAnimationFrame(tickFallback);
            }
            tickFallback();
            return;
        }
        var tries = 0;
        var limitPending = maxAttempts || 96;
        function tickPending() {
            tries += 1;
            var maxY = measureMaxY();
            if (maxY >= y - 24 || tries >= limitPending) {
                releasePending();
                return;
            }
            requestAnimationFrame(tickPending);
        }
        tickPending();
    }

    global.__gadlyToolPageScroll = {
        persist: persistScroll,
        restore: restoreWhenReady,
        release: releasePending,
        read: readSaved,
        isPending: isPending
    };

    var saveTimer = null;
    window.addEventListener("scroll", function () {
        if (isPending()) return;
        if (saveTimer) clearTimeout(saveTimer);
        saveTimer = setTimeout(persistScroll, 120);
    }, { passive: true });
    window.addEventListener("pagehide", function () {
        if (isPending()) {
            var p = pendingY();
            if (p > 0) {
                try {
                    sessionStorage.setItem(scrollKey(), String(p));
                } catch (e) {}
            }
            return;
        }
        persistScroll();
    });
    window.addEventListener("beforeunload", function () {
        if (isPending()) {
            var p = pendingY();
            if (p > 0) {
                try {
                    sessionStorage.setItem(scrollKey(), String(p));
                } catch (e) {}
            }
            return;
        }
        persistScroll();
    });
})(window);
