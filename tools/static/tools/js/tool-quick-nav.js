(function() {
    var QUICK_NAV_STATE_KEY = "gadly-quick-nav-open-state-v1";
    var QUICK_NAV_SIDE_KEY = "gadly-quick-nav-side-v1";
    var QUICK_NAV_LAYOUT_KEY = "gadly-quick-nav-layout-v1";
    var QUICK_NAV_TOP_KEY = "gadly-quick-nav-top-px-v1";
    var qnLockedHeights = null;
    function saveOpenState(state) {
        try {
            localStorage.setItem(QUICK_NAV_STATE_KEY, JSON.stringify(state));
        } catch (e) {}
    }

    function getGroupKey(group, index) {
        var title = group.querySelector(".tool-quick-nav-title");
        var text = title ? title.textContent.trim().toLowerCase() : ("group-" + index);
        return "g:" + text + ":" + index;
    }

    function getSavedSide() {
        try {
            var v = localStorage.getItem(QUICK_NAV_SIDE_KEY);
            return (v === "left" || v === "right") ? v : "right";
        } catch (e) {
            return "right";
        }
    }

    function saveSide(side) {
        try {
            localStorage.setItem(QUICK_NAV_SIDE_KEY, side);
        } catch (e) {}
    }

    function updateSideButtons(side) {
        var buttons = document.querySelectorAll(".tool-quick-nav-side-btn");
        buttons.forEach(function(btn) {
            btn.classList.toggle("tool-quick-nav-side-btn--active", btn.getAttribute("data-side") === side);
        });
    }

    function initSideControls() {
        var buttons = document.querySelectorAll(".tool-quick-nav-side-btn");
        if (!buttons.length) return;
        updateSideButtons(getSavedSide());
        buttons.forEach(function(btn) {
            btn.addEventListener("click", function() {
                var side = btn.getAttribute("data-side");
                if (side !== "left" && side !== "right") return;
                saveSide(side);
                updateSideButtons(side);
                placeQuickNav();
            });
        });
    }

    function initQuickNavToggles() {
        var groups = document.querySelectorAll(".tool-quick-nav-group");
        var state = {};
        groups.forEach(function(group) {
            var idx = Array.prototype.indexOf.call(groups, group);
            var key = getGroupKey(group, idx);
            state[key] = group.getAttribute("data-open") === "1";
        });

        groups.forEach(function(group) {
            var idx = Array.prototype.indexOf.call(groups, group);
            var key = getGroupKey(group, idx);
            var btn = group.querySelector(".tool-quick-nav-toggle");
            if (!btn) return;

            btn.addEventListener("click", function() {
                var open = group.getAttribute("data-open") === "1";
                var nextOpen = !open;

                groups.forEach(function(otherGroup) {
                    var otherIdx = Array.prototype.indexOf.call(groups, otherGroup);
                    var otherKey = getGroupKey(otherGroup, otherIdx);
                    var otherBtn = otherGroup.querySelector(".tool-quick-nav-toggle");
                    var shouldOpen = otherGroup === group ? nextOpen : false;
                    otherGroup.setAttribute("data-open", shouldOpen ? "1" : "0");
                    if (otherBtn) {
                        otherBtn.setAttribute("aria-expanded", shouldOpen ? "true" : "false");
                    }
                    state[otherKey] = shouldOpen;
                });

                saveOpenState(state);
                applyVerticalConstraints({ forceRecalc: true });
            });
        });
    }

    function persistQuickNavLayout(nav, popularNav, top, left) {
        try {
            if (!nav || window.innerWidth <= 1280) return;
            var ptRaw = popularNav ? popularNav.style.getPropertyValue("--tool-popular-nav-top") : "";
            var pt = ptRaw ? parseFloat(ptRaw) : NaN;
            var qh = parseFloat(nav.style.maxHeight);
            var ph = popularNav ? parseFloat(popularNav.style.maxHeight) : NaN;
            if (isNaN(pt) || isNaN(qh) || isNaN(ph)) return;
            localStorage.setItem(
                QUICK_NAV_LAYOUT_KEY,
                JSON.stringify({
                    top: top,
                    left: left,
                    popularTop: pt,
                    quickMaxH: qh,
                    popularMaxH: ph,
                    vw: window.innerWidth
                })
            );
        } catch (e) {}
    }

    function applyVerticalConstraints(options) {
        options = options || {};
        var nav = document.querySelector(".tool-quick-nav");
        var popularNav = document.querySelector(".tool-popular-nav");
        if (!nav) return;

        if (!options.forceRecalc && qnLockedHeights) {
            nav.style.maxHeight = qnLockedHeights.quick + "px";
            if (popularNav && !popularNav.classList.contains("tool-popular-nav--hidden")) {
                popularNav.style.setProperty("--tool-popular-nav-top", qnLockedHeights.popularTop + "px");
                popularNav.style.maxHeight = qnLockedHeights.popular + "px";
            }
            return;
        }

        var navRect = nav.getBoundingClientRect();
        var footer = document.querySelector(".site-footer");
        var footerTop = window.innerHeight - 16;
        if (footer) {
            var footerRect = footer.getBoundingClientRect();
            footerTop = Math.min(footerTop, Math.round(footerRect.top - 8));
        }

        var quickTop = Math.round(navRect.top);
        var quickMaxHeight = Math.max(120, footerTop - quickTop);
        nav.style.maxHeight = quickMaxHeight + "px";

        var popularTop = 0;
        var popularMaxHeight = 0;

        if (popularNav && !popularNav.classList.contains("tool-popular-nav--hidden")) {
            var gap = 12;
            popularTop = Math.round(navRect.top + nav.offsetHeight + gap);
            popularMaxHeight = Math.max(0, footerTop - popularTop);
            popularNav.style.setProperty("--tool-popular-nav-top", popularTop + "px");
            popularNav.style.maxHeight = popularMaxHeight + "px";
        }

        qnLockedHeights = {
            quick: quickMaxHeight,
            popular: popularMaxHeight,
            popularTop: popularTop
        };
    }

    function getMainAnchor() {
        return document.querySelector(
            ".site-main .container, .site-main .faq-container, .site-main .static-container"
        );
    }

    function measureNavWidth(nav) {
        var navWidth = nav.offsetWidth;
        if (navWidth) return navWidth;
        var styles = window.getComputedStyle(nav);
        return (
            (parseFloat(styles.width) || 292) +
            (parseFloat(styles.paddingLeft) || 0) +
            (parseFloat(styles.paddingRight) || 0) +
            (parseFloat(styles.borderLeftWidth) || 0) +
            (parseFloat(styles.borderRightWidth) || 0)
        );
    }

    function computeQuickNavLeft(side, rect, navWidth, gap) {
        if (side === "left") {
            return Math.round(rect.left - gap - navWidth);
        }
        return Math.round(rect.right + gap);
    }

    function panelOverlapsContainer(side, left, navWidth, rect, gap) {
        if (side === "right") {
            return left < Math.round(rect.right + gap);
        }
        return left + navWidth > Math.round(rect.left - gap);
    }

    function fitsViewport(side, left, navWidth, viewportPad) {
        if (side === "left") {
            return left >= viewportPad;
        }
        return left + navWidth <= window.innerWidth - viewportPad;
    }

    function canPlaceOnSide(side, left, navWidth, rect, gap, viewportPad) {
        if (!fitsViewport(side, left, navWidth, viewportPad)) return false;
        return !panelOverlapsContainer(side, left, navWidth, rect, gap);
    }

    var quickNavZoomUntil = 0;
    var quickNavZoomEndTimer = null;
    var quickNavZoomHideTimer = null;
    var zoomLayoutRaf = null;

    function markQuickNavZooming() {
        quickNavZoomUntil = Date.now() + 900;
    }

    function isQuickNavZooming() {
        return Date.now() < quickNavZoomUntil;
    }

    function clearQuickNavZooming() {
        quickNavZoomUntil = 0;
    }

    function isQuickNavVisible(nav) {
        return nav && !nav.classList.contains("tool-quick-nav--hidden");
    }

    function cancelZoomHideTimer() {
        if (quickNavZoomHideTimer) {
            clearTimeout(quickNavZoomHideTimer);
            quickNavZoomHideTimer = null;
        }
    }

    /** Top viewport allineato al contenitore (non dipende dallo scroll corrente). */
    function getAnchorLayoutTopPx() {
        var anchor = getMainAnchor();
        if (!anchor) {
            return Math.round(
                (parseFloat(getComputedStyle(document.documentElement).getPropertyValue("--site-header-height")) || 82) + 24
            );
        }
        var top = 0;
        var el = anchor;
        while (el) {
            top += el.offsetTop;
            el = el.offsetParent;
        }
        return Math.round(top);
    }

    function captureFixedTopPx(nav) {
        if (nav.dataset.qnTopPx) {
            var cached = parseInt(nav.dataset.qnTopPx, 10);
            if (!isNaN(cached)) return cached;
        }
        try {
            var stored = sessionStorage.getItem(QUICK_NAV_TOP_KEY);
            if (stored) {
                var fromStore = parseInt(stored, 10);
                if (!isNaN(fromStore)) {
                    nav.dataset.qnTopPx = String(fromStore);
                    return fromStore;
                }
            }
        } catch (eStore) {}
        var topPx = getAnchorLayoutTopPx();
        nav.dataset.qnTopPx = String(topPx);
        try {
            sessionStorage.setItem(QUICK_NAV_TOP_KEY, String(topPx));
        } catch (eSave) {}
        return topPx;
    }

    function applyFixedQuickNavTop(nav) {
        if (!nav) return;
        nav.style.setProperty("--tool-quick-nav-top", captureFixedTopPx(nav) + "px");
    }

    function showQuickNavPanels(nav, popularNav, side, left) {
        applyFixedQuickNavTop(nav);
        nav.style.setProperty("--tool-quick-nav-left", left + "px");
        if (popularNav) {
            popularNav.style.setProperty("--tool-popular-nav-left", left + "px");
        }
        nav.classList.remove("tool-quick-nav--hidden");
        nav.removeAttribute("hidden");
        if (popularNav) {
            popularNav.classList.remove("tool-popular-nav--hidden");
            popularNav.removeAttribute("hidden");
        }
        setQuickNavAnchorSide(side);
    }

    function bindQuickNavScrollSync() {
        window.addEventListener("scroll", applyVerticalConstraintsOnScroll, { passive: true });
    }

    function hideQuickNavPanels(nav, popularNav) {
        if (!nav) nav = document.querySelector(".tool-quick-nav");
        if (!popularNav) popularNav = document.querySelector(".tool-popular-nav");
        if (nav) {
            nav.classList.add("tool-quick-nav--hidden");
            nav.setAttribute("hidden", "");
        }
        if (popularNav) {
            popularNav.classList.add("tool-popular-nav--hidden");
            popularNav.setAttribute("hidden", "");
        }
        document.documentElement.classList.remove("gadly-qn-anchor-left", "gadly-qn-anchor-right");
        document.body.classList.remove("gadly-qn-anchor-left", "gadly-qn-anchor-right");
    }

    function setQuickNavAnchorSide(side) {
        var root = document.documentElement;
        root.classList.remove("gadly-qn-anchor-left", "gadly-qn-anchor-right");
        document.body.classList.remove("gadly-qn-anchor-left", "gadly-qn-anchor-right");
        if (side === "left") {
            root.classList.add("gadly-qn-anchor-left");
            document.body.classList.add("gadly-qn-anchor-left");
        } else if (side === "right") {
            root.classList.add("gadly-qn-anchor-right");
            document.body.classList.add("gadly-qn-anchor-right");
        }
    }

    function resolveQuickNavSide(options) {
        var preferredSide = getSavedSide();
        var onCvGenerator = document.body.classList.contains("cv-generator");
        if (onCvGenerator || (options && options.cvResize)) {
            var frozenSide = options && options.frozenSide;
            return frozenSide === "left" || frozenSide === "right" ? frozenSide : preferredSide;
        }
        return preferredSide;
    }

    function measureQuickNavLayout(options) {
        options = options || {};
        var nav = document.querySelector(".tool-quick-nav");
        var popularNav = document.querySelector(".tool-popular-nav");
        if (!nav) return null;

        var anchor = getMainAnchor();
        if (!anchor) return null;

        var rect = anchor.getBoundingClientRect();
        var gap = 12;
        var viewportPad = 16;
        var navWidth = measureNavWidth(nav);
        var side = resolveQuickNavSide(options);
        var left = computeQuickNavLeft(side, rect, navWidth, gap);

        return {
            nav: nav,
            popularNav: popularNav,
            anchor: anchor,
            rect: rect,
            gap: gap,
            viewportPad: viewportPad,
            navWidth: navWidth,
            side: side,
            left: left,
            canPlace: canPlaceOnSide(side, left, navWidth, rect, gap, viewportPad)
        };
    }

    /** Durante zoom: aggiorna solo left; nasconde subito se overlap, mostra appena c'è spazio. */
    function repositionQuickNavDuringZoom() {
        if (!isQuickNavZooming() || window.innerWidth <= 1280) return;
        if (
            document.body.classList.contains("image-editor") &&
            document.body.classList.contains("editor-active")
        ) {
            return;
        }

        var layout = measureQuickNavLayout();
        if (!layout) return;

        if (layout.canPlace) {
            cancelZoomHideTimer();
            showQuickNavPanels(layout.nav, layout.popularNav, layout.side, layout.left);
            void layout.nav.offsetHeight;
            applyVerticalConstraints();
            return;
        }

        if (!isQuickNavVisible(layout.nav)) {
            return;
        }

        cancelZoomHideTimer();
        hideQuickNavPanels(layout.nav, layout.popularNav);
    }

    /** Riposiziona senza cambiare lato. */
    function repositionQuickNavLockedSide(options) {
        options = options || {};
        var batchLayout = !!options.batchLayout;
        var nav = document.querySelector(".tool-quick-nav");
        var popularNav = document.querySelector(".tool-popular-nav");
        if (!nav) return false;

        cancelZoomHideTimer();

        if (
            document.body.classList.contains("image-editor") &&
            document.body.classList.contains("editor-active")
        ) {
            hideQuickNavPanels(nav, popularNav);
            return false;
        }
        if (window.innerWidth <= 1280) {
            hideQuickNavPanels(nav, popularNav);
            return false;
        }

        var layout = measureQuickNavLayout(options);
        if (!layout) return false;

        if (!layout.canPlace) {
            try {
                localStorage.removeItem(QUICK_NAV_LAYOUT_KEY);
            } catch (eRm) {}
            if (document.body.classList.contains("cv-optimizer") && window.innerWidth > 1280) {
                return false;
            }
            if (document.body.classList.contains("cv-generator") && window.innerWidth > 1280) {
                return false;
            }
            if (
                layout.nav &&
                (layout.nav.classList.contains("gadly-cvopt-qnav-ready") ||
                    layout.nav.classList.contains("gadly-cvgen-qnav-ready"))
            ) {
                return false;
            }
            hideQuickNavPanels(layout.nav, layout.popularNav);
            return false;
        }

        showQuickNavPanels(layout.nav, layout.popularNav, layout.side, layout.left);

        if (batchLayout) {
            return true;
        }

        void layout.nav.offsetHeight;
        applyVerticalConstraints(options && options.forceVerticalRecalc ? { forceRecalc: true } : {});
        if (layout.popularNav) {
            void layout.popularNav.offsetHeight;
            applyVerticalConstraints(options && options.forceVerticalRecalc ? { forceRecalc: true } : {});
        }
        var topPx = Math.round(layout.nav.getBoundingClientRect().top);
        persistQuickNavLayout(layout.nav, layout.popularNav, topPx, layout.left);
        return true;
    }

    function placeQuickNavPairLive(top, left) {
        var nav = document.querySelector(".tool-quick-nav");
        var popularNav = document.querySelector(".tool-popular-nav");
        if (!nav) return;
        nav.classList.remove("tool-quick-nav--hidden");
        nav.removeAttribute("hidden");
        nav.style.setProperty("--tool-quick-nav-top", top + "px");
        nav.dataset.qnTopPx = String(top);
        nav.style.setProperty("--tool-quick-nav-left", left + "px");
        if (popularNav) {
            popularNav.classList.remove("tool-popular-nav--hidden");
            popularNav.removeAttribute("hidden");
            popularNav.style.setProperty("--tool-popular-nav-left", left + "px");
        }
        void nav.offsetHeight;
        applyVerticalConstraints();
    }

    function revealQuickNavPair() {
        var nav = document.querySelector(".tool-quick-nav");
        var popularNav = document.querySelector(".tool-popular-nav");
        if (!nav) return;
        nav.classList.remove("tool-quick-nav--hidden");
        nav.removeAttribute("hidden");
        if (popularNav) {
            popularNav.classList.remove("tool-popular-nav--hidden");
            popularNav.removeAttribute("hidden");
        }
        void nav.offsetHeight;
        applyVerticalConstraints();
        if (popularNav) {
            void popularNav.offsetHeight;
            applyVerticalConstraints();
        }
    }

    function placeQuickNav(options) {
        try {
            repositionQuickNavLockedSide(options || {});
        } finally {
            window.__gadlyQnPlacedW = window.innerWidth;
        }
    }

    function bootQuickNav() {
        window.__gadlyQnPlacedW = window.innerWidth;
        quickNavBootUntil = Date.now() + 450;
        initSideControls();
        initQuickNavToggles();
        bindQuickNavScrollSync();
        var primedNav = document.querySelector(".tool-quick-nav.gadly-cvopt-qnav-ready");
        if (document.body.classList.contains("cv-optimizer") && primedNav) {
            applyVerticalConstraints();
            var popularNav = document.querySelector(".tool-popular-nav.gadly-cvopt-qnav-ready");
            if (popularNav) {
                void popularNav.offsetHeight;
                applyVerticalConstraints();
            }
            return;
        }
        placeQuickNav();
        requestAnimationFrame(placeQuickNav);
    }

    function placeQuickNavAfterScrollRestore() {
        requestAnimationFrame(function() {
            var nav = document.querySelector(".tool-quick-nav");
            if (nav) {
                applyFixedQuickNavTop(nav);
            }
            placeQuickNav();
        });
    }

    var quickNavResizeTimer = null;
    var quickNavBootUntil = 0;

    function placeQuickNavDebounced() {
        var w = window.innerWidth;
        var h = window.innerHeight;
        var prevW = window.__gadlyQnPlacedW;
        var prevH = window.__gadlyQnPlacedH;
        if (isQuickNavZooming() && w > 1280) {
            placeQuickNavOnZoom();
            return;
        }
        if (typeof prevW === "number" && w === prevW && typeof prevH === "number" && h !== prevH) {
            window.__gadlyQnPlacedH = h;
            return;
        }
        if (Date.now() < quickNavBootUntil && typeof prevW === "number" && w === prevW) {
            return;
        }
        if (quickNavResizeTimer) clearTimeout(quickNavResizeTimer);

        if (w <= 1280) {
            hideQuickNavPanels();
            qnLockedHeights = null;
            quickNavResizeTimer = setTimeout(function() {
                quickNavResizeTimer = null;
            }, 80);
            window.__gadlyQnPlacedW = w;
            window.__gadlyQnPlacedH = h;
            return;
        }

        if (typeof prevW === "number" && prevW !== w) {
            qnLockedHeights = null;
        }

        quickNavResizeTimer = setTimeout(function() {
            quickNavResizeTimer = null;
            if (document.body.classList.contains("cv-generator")) {
                return;
            }
            repositionQuickNavLockedSide({ forceVerticalRecalc: typeof prevW === "number" && prevW !== w });
            window.__gadlyQnPlacedW = w;
            window.__gadlyQnPlacedH = h;
        }, 48);
    }

    var verticalScrollRaf = null;

    function applyVerticalConstraintsOnScroll() {
        if (window.innerWidth <= 1280 || isQuickNavZooming()) return;
        if (verticalScrollRaf) return;
        verticalScrollRaf = requestAnimationFrame(function() {
            verticalScrollRaf = null;
            applyVerticalConstraints();
        });
    }

    function placeQuickNavOnZoom() {
        if (window.innerWidth <= 1280) return;
        if (document.body.classList.contains("cv-generator")) return;

        markQuickNavZooming();

        if (zoomLayoutRaf) cancelAnimationFrame(zoomLayoutRaf);
        zoomLayoutRaf = requestAnimationFrame(function() {
            zoomLayoutRaf = null;
            repositionQuickNavDuringZoom();
        });

        if (quickNavZoomEndTimer) clearTimeout(quickNavZoomEndTimer);
        quickNavZoomEndTimer = setTimeout(function() {
            quickNavZoomEndTimer = null;
            cancelZoomHideTimer();
            clearQuickNavZooming();
            if (window.innerWidth <= 1280) {
                hideQuickNavPanels();
                return;
            }
            repositionQuickNavLockedSide();
        }, 400);
    }

    window.__gadlyPlaceQuickNav = function(options) {
        placeQuickNav(options || {});
    };
    window.__gadlyPlaceQuickNavPairLive = placeQuickNavPairLive;
    window.__gadlyHideQuickNavPairLive = hideQuickNavPanels;
    window.__gadlyRevealQuickNavPair = revealQuickNavPair;

    function bootQuickNavWhenReady() {
        var root = document.documentElement;
        var body = document.body;
        if (root.classList.contains("gadly-scroll-restore-pending")) {
            document.addEventListener("gadly-scroll-restore-done", bootQuickNav, { once: true });
            return;
        }
        if (body.classList.contains("cv-optimizer")) {
            bootQuickNav();
            return;
        }
        if (body.classList.contains("cv-generator")) {
            bootQuickNav();
            return;
        }
        bootQuickNav();
    }

    if (document.readyState === "loading") {
        document.addEventListener("DOMContentLoaded", bootQuickNavWhenReady, { once: true });
    } else {
        bootQuickNavWhenReady();
    }
    window.addEventListener("pageshow", placeQuickNavAfterScrollRestore);
    window.addEventListener("resize", placeQuickNavDebounced);
    if (window.visualViewport) {
        window.visualViewport.addEventListener("resize", placeQuickNavOnZoom);
    }
})();
