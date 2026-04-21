(function() {
    var STORAGE_KEY = "gadly-home-fab-pos";
    var isHomepage = function() { return document.body.classList.contains("homepage"); };

    function init() {
        var fab = document.getElementById("mobile-home-fab");
        if (!fab) return;
        if (isHomepage()) {
            fab.style.display = "none";
            return;
        }
        fab.style.display = "block";

        var link = fab.querySelector(".mobile-home-fab-link");
        var dragging = false;
        var mouseDragging = false;
        var pausedOutside = false;
        var didDrag = false;
        var draggedAt = 0;
        var startX, startY, startLeft, startTop;
        var pointerOffsetX = 0;
        var pointerOffsetY = 0;

        function loadPos() {
            try {
                var s = localStorage.getItem(STORAGE_KEY);
                if (s) {
                    var p = JSON.parse(s);
                    if (typeof p.left === "number" && typeof p.top === "number") {
                        return { left: p.left, top: p.top };
                    }
                }
            } catch (e) {}
            return null;
        }

        function savePos(left, top) {
            try {
                localStorage.setItem(STORAGE_KEY, JSON.stringify({ left: left, top: top }));
            } catch (e) {}
        }

        function applyPos(left, top) {
            var size = fab.offsetWidth || 58;
            var maxLeft = window.innerWidth - size;
            var maxTop = window.innerHeight - size;
            left = Math.max(8, Math.min(maxLeft - 8, left));
            top = Math.max(8, Math.min(maxTop - 8, top));
            fab.style.left = left + "px";
            fab.style.top = top + "px";
            fab.style.right = "auto";
            fab.style.bottom = "auto";
            fab.style.transform = "none";
            updateAdaptiveTone(left, top, size);
            return { left: left, top: top };
        }

        function clamp(v, min, max) {
            return Math.max(min, Math.min(max, v));
        }

        function lerp(a, b, t) {
            return Math.round(a + (b - a) * t);
        }

        function rgbToHex(r, g, b) {
            return "#" + [r, g, b].map(function(n) {
                var s = n.toString(16);
                return s.length === 1 ? "0" + s : s;
            }).join("");
        }

        function updateAdaptiveTone(left, top, size) {
            if (document.body.classList.contains("dark-mode")) {
                fab.style.removeProperty("--home-fab-bg");
                fab.style.removeProperty("--home-fab-icon");
                fab.style.removeProperty("--home-fab-border");
                fab.style.removeProperty("--home-fab-icon-stroke");
                return;
            }
            var w = window.innerWidth || 1;
            var h = window.innerHeight || 1;
            var cx = left + (size / 2);
            var cy = top + (size / 2);
            var xNorm = clamp(cx / w, 0, 1);
            var yNorm = clamp(cy / h, 0, 1);
            // Keep lower-left area dark in light mode.
            // The background gets darker mostly toward the right side,
            // so horizontal position should drive the blend more than vertical.
            var t = clamp((xNorm * 0.88) + (yNorm * 0.12), 0, 1);
            // Start adapting earlier so icon darkens sooner in colored area.
            var baseBlend = clamp((t - 0.30) / 0.58, 0, 1);
            var blend = Math.pow(baseBlend, 0.72);
            // Icon should become dark already around center area.
            var iconBlend = clamp((t - 0.22) / 0.34, 0, 1);

            // Light mode adaptive shade: dark in bright area, lighter in darker area.
            var dark = { r: 0, g: 63, b: 127 };
            // Match dark-mode FAB background in lower-right zone.
            var light = { r: 176, g: 196, b: 222 };
            var bg = rgbToHex(
                lerp(dark.r, light.r, blend),
                lerp(dark.g, light.g, blend),
                lerp(dark.b, light.b, blend)
            );
            var iconDark = { r: 214, g: 229, b: 245 };
            // Match dark-mode icon color in lower-right zone.
            var iconLight = { r: 0, g: 45, b: 92 };
            var icon = rgbToHex(
                lerp(iconDark.r, iconLight.r, iconBlend),
                lerp(iconDark.g, iconLight.g, iconBlend),
                lerp(iconDark.b, iconLight.b, iconBlend)
            );
            var strokeAlpha = 0.42 - (0.24 * iconBlend);
            fab.style.setProperty("--home-fab-bg", bg);
            fab.style.setProperty("--home-fab-icon", icon);
            fab.style.setProperty("--home-fab-border", "rgba(255, 255, 255, 0.9)");
            fab.style.setProperty("--home-fab-icon-stroke", "rgba(0, 45, 92, " + strokeAlpha.toFixed(2) + ")");
        }

        function getCoords(e) {
            if (e.touches && e.touches.length) {
                return { x: e.touches[0].clientX, y: e.touches[0].clientY };
            }
            return { x: e.clientX, y: e.clientY };
        }

        var pos = loadPos();
        if (pos) {
            applyPos(pos.left, pos.top);
        } else {
            fab.style.right = "16px";
            fab.style.bottom = "calc(16px + env(safe-area-inset-bottom))";
            fab.style.left = "auto";
            fab.style.top = "auto";
            setTimeout(function() {
                var rect = fab.getBoundingClientRect();
                updateAdaptiveTone(rect.left, rect.top, rect.width || 58);
            }, 0);
        }

        function onStart(e) {
            if (e.type === "mousedown" && e.button !== 0) return;
            if (e.type === "mousedown") {
                mouseDragging = true;
                e.preventDefault();
            }
            var c = getCoords(e);
            var rect = fab.getBoundingClientRect();
            startX = c.x;
            startY = c.y;
            startLeft = rect.left;
            startTop = rect.top;
            // Keep pointer visually centered on the FAB while dragging.
            pointerOffsetX = rect.width / 2;
            pointerOffsetY = rect.height / 2;
            dragging = true;
            pausedOutside = false;
            didDrag = false;
            fab.classList.add("is-dragging");
        }

        function onMove(e) {
            if (!dragging) return;
            if (e.type === "mousemove") {
                // Keep dragging alive when re-entering the window while mouse is still pressed.
                if (!mouseDragging && (e.buttons & 1) === 1) {
                    mouseDragging = true;
                }
                // End drag only when primary button is no longer pressed.
                if (mouseDragging && (e.buttons & 1) !== 1) {
                    onEnd(e);
                    return;
                }
            }
            e.preventDefault();
            var c = getCoords(e);
            if (pausedOutside && e.type === "mousemove") {
                var insideViewport = c.x >= 0 && c.y >= 0 && c.x <= window.innerWidth && c.y <= window.innerHeight;
                if (!insideViewport) return;
                var resumeRect = fab.getBoundingClientRect();
                startLeft = resumeRect.left;
                startTop = resumeRect.top;
                startX = c.x;
                startY = c.y;
                pausedOutside = false;
                fab.classList.add("is-dragging");
                return;
            }
            var dx = c.x - startX;
            var dy = c.y - startY;
            if (Math.abs(dx) > 4 || Math.abs(dy) > 4) didDrag = true;
            var p = applyPos(c.x - pointerOffsetX, c.y - pointerOffsetY);
            startLeft = p.left;
            startTop = p.top;
            startX = c.x;
            startY = c.y;
        }

        function onEnd(e) {
            if (!dragging) return;
            if (e && e.type === "mouseup") {
                mouseDragging = false;
            }
            dragging = false;
            pausedOutside = false;
            fab.classList.remove("is-dragging");
            var rect = fab.getBoundingClientRect();
            var p = applyPos(rect.left, rect.top);
            savePos(Math.round(p.left), Math.round(p.top));
            if (didDrag) draggedAt = Date.now();
        }

        function syncFabToViewport() {
            var rect = fab.getBoundingClientRect();
            var p = applyPos(rect.left, rect.top);
            savePos(Math.round(p.left), Math.round(p.top));
        }

        link.addEventListener("click", function(e) {
            // Prevent accidental navigation right after dragging.
            if (dragging || didDrag || (Date.now() - draggedAt) < 450) {
                e.preventDefault();
                e.stopPropagation();
                return;
            }
            // Keep FAB always responsive on first click after returning to the page.
            didDrag = false;
            draggedAt = 0;
        });

        fab.addEventListener("touchstart", onStart, { passive: false });
        fab.addEventListener("touchmove", onMove, { passive: false });
        fab.addEventListener("touchend", onEnd);
        fab.addEventListener("touchcancel", onEnd);
        fab.addEventListener("mousedown", onStart);
        document.addEventListener("mousemove", onMove);
        document.addEventListener("mouseup", onEnd);
        window.addEventListener("mouseup", onEnd);
        window.addEventListener("mouseout", function(e) {
            if (!dragging || !mouseDragging) return;
            var leavingWindow = !e.relatedTarget && !e.toElement;
            if (leavingWindow) {
                pausedOutside = true;
                // Visual cursor state should return to normal while outside.
                fab.classList.remove("is-dragging");
            }
        });
        window.addEventListener("blur", function() {
            mouseDragging = false;
            onEnd();
        });
        document.addEventListener("visibilitychange", function() {
            if (document.visibilityState === "visible") {
                didDrag = false;
                draggedAt = 0;
                syncFabToViewport();
            } else {
                onEnd();
            }
        });
        window.addEventListener("focus", function() {
            didDrag = false;
            draggedAt = 0;
            syncFabToViewport();
        });
        window.addEventListener("pageshow", function() {
            didDrag = false;
            draggedAt = 0;
            syncFabToViewport();
        });

        // Recompute adaptive FAB colors when theme changes (dark <-> light).
        var lastDarkMode = document.body.classList.contains("dark-mode");
        var themeObserver = new MutationObserver(function() {
            var nowDarkMode = document.body.classList.contains("dark-mode");
            if (nowDarkMode === lastDarkMode) return;
            lastDarkMode = nowDarkMode;
            syncFabToViewport();
        });
        themeObserver.observe(document.body, { attributes: true, attributeFilter: ["class"] });
    }

    if (document.readyState === "loading") {
        document.addEventListener("DOMContentLoaded", init);
    } else {
        init();
    }
    window.addEventListener("resize", function() {
        if (isHomepage()) {
            var fab = document.getElementById("mobile-home-fab");
            if (fab) fab.style.display = "none";
        } else {
            init();
        }
    });
})();
