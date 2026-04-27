(function() {
    var STORAGE_KEY = "gadly-home-fab-pos";
    /* Default when nessuna posizione salvata: più in alto del bordo basso (più visibile). */
    var FAB_DEFAULT_RIGHT = "22px";
    var FAB_DEFAULT_BOTTOM = "calc(96px + env(safe-area-inset-bottom))";
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
        function applyFixedTone() {
            // Fixed style by request: always light FAB with red border.
            fab.style.setProperty("--home-fab-bg", "#d6e5f5");
            fab.style.setProperty("--home-fab-icon", "#002d5c");
            fab.style.setProperty("--home-fab-border", "#dc2626");
            fab.style.setProperty("--home-fab-icon-stroke", "rgba(0, 45, 92, 0.22)");
        }
        applyFixedTone();

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

        function parseRgbColor(color) {
            if (!color || typeof color !== "string") return null;
            var m = color.match(/rgba?\(\s*([\d.]+)\s*,\s*([\d.]+)\s*,\s*([\d.]+)(?:\s*,\s*([\d.]+))?\s*\)/i);
            if (!m) return null;
            return {
                r: clamp(Math.round(parseFloat(m[1])), 0, 255),
                g: clamp(Math.round(parseFloat(m[2])), 0, 255),
                b: clamp(Math.round(parseFloat(m[3])), 0, 255),
                a: (m[4] == null ? 1 : clamp(parseFloat(m[4]), 0, 1))
            };
        }

        function parseColorFromBackgroundImage(bgImage) {
            if (!bgImage || typeof bgImage !== "string" || bgImage === "none") return null;
            var matches = bgImage.match(/rgba?\(\s*[\d.]+\s*,\s*[\d.]+\s*,\s*[\d.]+(?:\s*,\s*[\d.]+)?\s*\)/ig);
            if (!matches || !matches.length) return null;
            var sumR = 0, sumG = 0, sumB = 0, sumA = 0, count = 0;
            for (var i = 0; i < matches.length; i++) {
                var m = matches[i].match(/rgba?\(\s*([\d.]+)\s*,\s*([\d.]+)\s*,\s*([\d.]+)(?:\s*,\s*([\d.]+))?\s*\)/i);
                if (!m) continue;
                sumR += clamp(Math.round(parseFloat(m[1])), 0, 255);
                sumG += clamp(Math.round(parseFloat(m[2])), 0, 255);
                sumB += clamp(Math.round(parseFloat(m[3])), 0, 255);
                sumA += (m[4] == null ? 1 : clamp(parseFloat(m[4]), 0, 1));
                count += 1;
            }
            if (!count) return null;
            return {
                r: Math.round(sumR / count),
                g: Math.round(sumG / count),
                b: Math.round(sumB / count),
                a: sumA / count
            };
        }

        function relativeLuminance(rgb) {
            function channel(v) {
                var c = v / 255;
                return c <= 0.03928 ? (c / 12.92) : Math.pow((c + 0.055) / 1.055, 2.4);
            }
            return (0.2126 * channel(rgb.r)) + (0.7152 * channel(rgb.g)) + (0.0722 * channel(rgb.b));
        }

        function resolveBackgroundAtPoint(x, y) {
            var stack = [];
            try {
                stack = document.elementsFromPoint(Math.round(x), Math.round(y)) || [];
            } catch (e) {
                stack = [];
            }
            for (var i = 0; i < stack.length; i++) {
                var candidate = stack[i];
                if (!candidate) continue;
                if (fab.contains(candidate)) continue; // Ignore FAB itself to avoid feedback flicker.
                if (
                    candidate.closest &&
                    candidate.closest(".site-header, .header-nav, .tool-quick-nav, .tool-popular-nav, .cv-preview-dock, .cv-preview-modal")
                ) {
                    continue;
                }
                var cs = window.getComputedStyle(candidate);
                var bg = parseRgbColor(cs.backgroundColor);
                if (bg && bg.a > 0.01) return bg;
            }
            var bodyCs = window.getComputedStyle(document.body);
            var bodyBg = parseRgbColor(bodyCs.backgroundColor);
            if (bodyBg && bodyBg.a > 0.01) return bodyBg;
            return { r: 248, g: 252, b: 255, a: 1 };
        }

        function averageBackgroundAround(x, y, size) {
            var s = Math.max(18, Math.round((size || 58) * 0.28));
            var points = [
                { x: x, y: y },
                { x: x - s, y: y },
                { x: x + s, y: y },
                { x: x, y: y - s },
                { x: x, y: y + s },
                { x: x - s, y: y - s },
                { x: x + s, y: y - s },
                { x: x - s, y: y + s },
                { x: x + s, y: y + s }
            ];
            var sumR = 0, sumG = 0, sumB = 0, sumW = 0;
            for (var i = 0; i < points.length; i++) {
                var p = points[i];
                var rx = clamp(Math.round(p.x), 0, Math.max(0, (window.innerWidth || 1) - 1));
                var ry = clamp(Math.round(p.y), 0, Math.max(0, (window.innerHeight || 1) - 1));
                var c = resolveBackgroundAtPoint(rx, ry);
                if (!c) continue;
                var w = (i === 0) ? 7 : 1; // center point dominates perceived background
                sumR += c.r * w;
                sumG += c.g * w;
                sumB += c.b * w;
                sumW += w;
            }
            if (!sumW) return { r: 255, g: 255, b: 255, a: 1 };
            return {
                r: Math.round(sumR / sumW),
                g: Math.round(sumG / sumW),
                b: Math.round(sumB / sumW),
                a: 1
            };
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
            fab.style.right = FAB_DEFAULT_RIGHT;
            fab.style.bottom = FAB_DEFAULT_BOTTOM;
            fab.style.left = "auto";
            fab.style.top = "auto";
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
        // No color recompute listeners: fixed FAB style should remain stable.
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
