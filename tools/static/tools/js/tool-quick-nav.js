(function() {
    var QUICK_NAV_STATE_KEY = "gadly-quick-nav-open-state-v1";
    var QUICK_NAV_SIDE_KEY = "gadly-quick-nav-side-v1";

    function loadOpenState() {
        try {
            var raw = localStorage.getItem(QUICK_NAV_STATE_KEY);
            return raw ? JSON.parse(raw) : {};
        } catch (e) {
            return {};
        }
    }

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
        var state = loadOpenState();
        var firstOpenApplied = false;

        groups.forEach(function(group) {
            var idx = Array.prototype.indexOf.call(groups, group);
            var key = getGroupKey(group, idx);
            var btn = group.querySelector(".tool-quick-nav-toggle");
            if (!btn) return;

            // Restore state with accordion behavior (max one open).
            if (Object.prototype.hasOwnProperty.call(state, key)) {
                var isOpen = !!state[key];
                if (isOpen && firstOpenApplied) isOpen = false;
                if (isOpen) firstOpenApplied = true;
                group.setAttribute("data-open", isOpen ? "1" : "0");
                btn.setAttribute("aria-expanded", isOpen ? "true" : "false");
            }

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
                // Keep layout constrained after expand/collapse.
                applyVerticalConstraints();
            });
        });
    }

    function applyVerticalConstraints() {
        var nav = document.querySelector(".tool-quick-nav");
        var popularNav = document.querySelector(".tool-popular-nav");
        if (!nav) return;

        var navRect = nav.getBoundingClientRect();
        var footer = document.querySelector(".site-footer");
        var footerTop = window.innerHeight - 16;
        if (footer) {
            var footerRect = footer.getBoundingClientRect();
            footerTop = Math.min(footerTop, Math.round(footerRect.top - 8));
        }

        // Quick Tools never over footer.
        var quickTop = Math.max(12, Math.round(navRect.top));
        var quickMaxHeight = Math.max(120, footerTop - quickTop);
        nav.style.maxHeight = quickMaxHeight + "px";

        if (!popularNav || popularNav.classList.contains("tool-popular-nav--hidden")) return;

        // Top 15 stays below Quick Tools and never over footer.
        var gap = 12;
        var popularTop = Math.max(12, Math.round(navRect.top + nav.offsetHeight + gap));
        var popularMaxHeight = Math.max(0, footerTop - popularTop);
        popularNav.style.setProperty("--tool-popular-nav-top", popularTop + "px");
        popularNav.style.maxHeight = popularMaxHeight + "px";
    }

    function placeQuickNav() {
        var nav = document.querySelector(".tool-quick-nav");
        var popularNav = document.querySelector(".tool-popular-nav");
        if (!nav) return;
        if (window.innerWidth <= 1280) {
            nav.classList.add("tool-quick-nav--hidden");
            if (popularNav) popularNav.classList.add("tool-popular-nav--hidden");
            return;
        }

        var anchor = document.querySelector(
            ".site-main .container, .site-main .faq-container, .site-main .static-container"
        );
        if (!anchor) return;

        var rect = anchor.getBoundingClientRect();
        var gap = 12;
        var viewportPad = 16;
        var navWidth = nav.offsetWidth;
        if (!navWidth) {
            var styles = window.getComputedStyle(nav);
            navWidth =
                (parseFloat(styles.width) || 292) +
                (parseFloat(styles.paddingLeft) || 0) +
                (parseFloat(styles.paddingRight) || 0) +
                (parseFloat(styles.borderLeftWidth) || 0) +
                (parseFloat(styles.borderRightWidth) || 0);
        }
        var requiredSpace = navWidth + gap + viewportPad;
        var availableRightSpace = window.innerWidth - Math.round(rect.right);
        var availableLeftSpace = Math.round(rect.left);
        var preferredSide = getSavedSide();
        var side = preferredSide;
        var canPlaceRight = availableRightSpace >= requiredSpace;
        var canPlaceLeft = availableLeftSpace >= requiredSpace;

        if (side === "right" && !canPlaceRight) side = canPlaceLeft ? "left" : "right";
        if (side === "left" && !canPlaceLeft) side = canPlaceRight ? "right" : "left";

        if ((side === "right" && !canPlaceRight) || (side === "left" && !canPlaceLeft)) {
            nav.classList.add("tool-quick-nav--hidden");
            if (popularNav) popularNav.classList.add("tool-popular-nav--hidden");
            return;
        }

        nav.classList.remove("tool-quick-nav--hidden");
        // Keep top aligned to the main container's document position,
        // so refresh while scrolled does not shift it.
        var top = Math.max(12, Math.round(rect.top + window.scrollY));
        var left;
        if (side === "left") {
            left = Math.round(rect.left - gap - navWidth);
            if (left < viewportPad) left = viewportPad;
        } else {
            left = Math.round(rect.right + gap);
            var maxLeft = window.innerWidth - navWidth - viewportPad;
            if (left > maxLeft) left = maxLeft;
        }

        nav.style.setProperty("--tool-quick-nav-top", top + "px");
        nav.style.setProperty("--tool-quick-nav-left", left + "px");

        if (!popularNav) return;
        popularNav.classList.remove("tool-popular-nav--hidden");
        popularNav.style.setProperty("--tool-popular-nav-left", left + "px");
        applyVerticalConstraints();
    }

    if (document.readyState === "loading") {
        document.addEventListener("DOMContentLoaded", function() {
            initSideControls();
            initQuickNavToggles();
            placeQuickNav();
            // Re-align after browser restores scroll position on refresh.
            setTimeout(placeQuickNav, 0);
            setTimeout(placeQuickNav, 120);
        });
    } else {
        initSideControls();
        initQuickNavToggles();
        placeQuickNav();
        setTimeout(placeQuickNav, 0);
        setTimeout(placeQuickNav, 120);
    }
    window.addEventListener("pageshow", placeQuickNav);
    window.addEventListener("resize", placeQuickNav);
    window.addEventListener("scroll", applyVerticalConstraints, { passive: true });
})();
