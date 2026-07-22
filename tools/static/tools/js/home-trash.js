/**
 * Home — drag verso cestino.
 * Desktop (≥769px): CONGELATO — ghost bottone intero rosso, categoria senza tratteggio,
 * testo categoria ingrandito, shield, link drag, undo. NON modificare senza richiesta esplicita desktop.
 * Mobile (≤768px): buildMobileDragGhost, long press, cestino on demand — NON toccare per task solo desktop.
 */
(function () {
    var ONBOARD_KEY = "gadly-trash-onboarding-seen-v1:";
    var TRASH_CLICK_SUPPRESS_MS = 600;
    var trashClickSuppress = {
        until: 0,
        toolHref: "",
        blockTrashBin: false
    };
    var desktopClickSuppressBound = false;

    function isTrashHome() {
        return document.body.classList.contains("homepage");
    }

    function isMobileTrashHome() {
        return isTrashHome() &&
            window.matchMedia &&
            window.matchMedia("(max-width: 768px)").matches;
    }

    function isDesktopTrashHome() {
        return isTrashHome() &&
            window.matchMedia &&
            window.matchMedia("(min-width: 769px)").matches;
    }

    /** Etichetta categoria per desktop (comportamento originale). */
    function getCategoryLabelEl(catBtn) {
        if (!catBtn) return null;
        return catBtn.querySelector(".category-btn-label--desktop") ||
            catBtn.querySelector(".category-btn-label--mobile");
    }

    function isCategoryLabelVisible(el) {
        if (!el || !el.isConnected) return false;
        var cs = window.getComputedStyle(el);
        if (cs.display === "none" || cs.visibility === "hidden" || cs.opacity === "0") {
            return false;
        }
        var rect = el.getBoundingClientRect();
        return rect.width > 0 && rect.height > 0;
    }

    /** Nome completo categoria (etichetta desktop), non la variante mobile abbreviata. */
    function getCategoryDisplayName(catBtn) {
        if (!catBtn) return "";
        var desktop = catBtn.querySelector(".category-btn-label--desktop");
        if (desktop) return desktop.textContent.trim();
        var mobile = catBtn.querySelector(".category-btn-label--mobile");
        return mobile ? mobile.textContent.trim() : (catBtn.textContent || "").trim();
    }

    /** Elemento visibile sul bottone per tipografia e punto di presa del drag. */
    function getCategoryAnchorEl(catBtn) {
        if (!catBtn) return null;
        var desktop = catBtn.querySelector(".category-btn-label--desktop");
        var mobile = catBtn.querySelector(".category-btn-label--mobile");
        if (isCategoryLabelVisible(desktop)) return desktop;
        if (isCategoryLabelVisible(mobile)) return mobile;
        return desktop || mobile || catBtn;
    }

    function getCategoryNameForEntry(catBtn) {
        if (!catBtn) return "";
        if (isMobileTrashHome()) return getCategoryDisplayName(catBtn);
        var label = getCategoryLabelEl(catBtn);
        return label ? label.textContent.trim() : "";
    }

    function getToolEntryFromBtn(btn) {
        if (!btn) return null;
        var section = btn.closest(".tool-section");
        var catBtn = section ? section.querySelector(".category-btn") : null;
        return {
            url: window.gadlyHiddenTools.normalizeUrl(btn.getAttribute("href")),
            name: (btn.textContent || "").trim(),
            categoryId: catBtn ? catBtn.id : "",
            categoryName: getCategoryNameForEntry(catBtn)
        };
    }

    function getToolEntryFromWrap(wrap) {
        return getToolEntryFromBtn(wrap ? wrap.querySelector("a.tool-btn") : null);
    }

    function getCategoryEntries(section) {
        var entries = [];
        var catBtn = section.querySelector(".category-btn");
        var categoryId = catBtn ? catBtn.id : "";
        var categoryName = getCategoryNameForEntry(catBtn);
        section.querySelectorAll(".tool-btn-wrap").forEach(function (wrap) {
            var entry = getToolEntryFromWrap(wrap);
            if (entry) {
                entry.categoryId = categoryId;
                entry.categoryName = categoryName;
                entries.push(entry);
            }
        });
        return entries;
    }

    var MOBILE_TRASH_AFTER_DROP_MS = 2200;
    var mobileTrashHideTimer = null;
    var mobileTrashLayoutCache = null;

    function clearMobileTrashHideTimer() {
        if (!mobileTrashHideTimer) return;
        window.clearTimeout(mobileTrashHideTimer);
        mobileTrashHideTimer = null;
    }

    function scheduleMobileTrashHide(ms) {
        if (!isMobileTrashHome()) return;
        clearMobileTrashHideTimer();
        mobileTrashHideTimer = window.setTimeout(function () {
            mobileTrashHideTimer = null;
            hideMobileTrashIfIdle();
        }, ms);
    }

    function pulseTrash() {
        if (isMobileTrashHome()) {
            scheduleMobileTrashHide(MOBILE_TRASH_AFTER_DROP_MS);
            return;
        }
        var btn = document.getElementById("desktop-trash-bin-btn");
        if (!btn) return;
        btn.classList.add("desktop-trash-bin__btn--pulse");
        window.setTimeout(function () {
            btn.classList.remove("desktop-trash-bin__btn--pulse");
        }, 320);
    }

    function afterHide() {
        window.gadlyHiddenTools.applyToHomePage();
        if (typeof window.__gadlyHomeScrollAfterLayout === "function") {
            window.__gadlyHomeScrollAfterLayout();
        }
        pulseTrash();
        if (typeof window.gadlyRenderHomeShortcuts === "function") {
            window.gadlyRenderHomeShortcuts(window.GADLY_USER_STORAGE_KEY || "anon");
        }
        document.querySelectorAll(".homepage .tool-fav.is-favorite").forEach(function (star) {
            var wrap = star.closest(".tool-btn-wrap");
            var a = wrap ? wrap.querySelector("a.tool-btn") : null;
            if (a && window.gadlyHiddenTools.isHidden(a.getAttribute("href"))) {
                star.textContent = "☆";
                star.classList.remove("is-favorite");
            }
        });
        setupDragSources();
    }

    function afterRestore() {
        // I nodi tolti dal DOM non tornano senza reload (SSR li omette).
        window.location.reload();
    }

    function handleDrop(data) {
        if (!data || !window.gadlyHiddenTools) return;
        if (data.type === "tool" && data.entry) {
            window.gadlyHiddenTools.hideTool(data.entry);
            afterHide();
            showUndoToast(data);
            return;
        }
        if (data.type === "category" && data.entries && data.entries.length) {
            window.gadlyHiddenTools.hideTools(data.entries);
            afterHide();
            showUndoToast(data);
        }
    }

    var UNDO_TOAST_MS = 5000;
    var undoToastTimer = null;
    var pendingUndo = null;

    function getUndoToastMessage(data) {
        if (data.type === "tool" && data.entry) {
            var suffix = window.GADLY_TRASH_UNDO_TOOL_SUFFIX || "removed from homepage";
            return (data.entry.name || data.entry.url) + " — " + suffix;
        }
        if (data.type === "category" && data.entries && data.entries.length) {
            var cat = data.entries[0].categoryName || "";
            if (typeof window.GADLY_TRASH_UNDO_CATEGORY_MSG === "function") {
                return window.GADLY_TRASH_UNDO_CATEGORY_MSG(data.entries.length, cat);
            }
            return data.entries.length + " tools removed · " + cat;
        }
        return "";
    }

    function dismissUndoToast() {
        if (undoToastTimer) {
            clearTimeout(undoToastTimer);
            undoToastTimer = null;
        }
        pendingUndo = null;
        var toast = document.getElementById("home-trash-undo-toast");
        if (!toast) return;
        toast.classList.remove("home-trash-undo-toast--visible");
        window.setTimeout(function () {
            toast.hidden = true;
        }, 200);
    }

    function performUndo() {
        if (!pendingUndo || !window.gadlyHiddenTools) {
            dismissUndoToast();
            return;
        }
        var urls = pendingUndo.urls.slice();
        dismissUndoToast();
        if (typeof window.gadlyHiddenTools.restoreTools === "function") {
            window.gadlyHiddenTools.restoreTools(urls);
        } else {
            urls.forEach(function (url) {
                window.gadlyHiddenTools.restoreTool(url);
            });
        }
        afterRestore();
    }

    function showUndoToast(data) {
        if (isMobileTrashHome()) return;

        var toast = document.getElementById("home-trash-undo-toast");
        if (!toast) return;

        var urls = [];
        if (data.type === "tool" && data.entry && data.entry.url) {
            urls = [data.entry.url];
        } else if (data.type === "category" && data.entries) {
            data.entries.forEach(function (entry) {
                if (entry && entry.url) urls.push(entry.url);
            });
        }
        if (!urls.length) return;

        if (undoToastTimer) {
            clearTimeout(undoToastTimer);
            undoToastTimer = null;
        }

        pendingUndo = { urls: urls };

        var msgEl = toast.querySelector(".home-trash-undo-toast__msg");
        var undoBtn = toast.querySelector(".home-trash-undo-toast__undo");
        if (msgEl) msgEl.textContent = getUndoToastMessage(data);
        if (undoBtn) {
            undoBtn.textContent = window.GADLY_TRASH_UNDO_LABEL || "Undo";
        }

        toast.hidden = false;
        void toast.offsetWidth;
        toast.classList.add("home-trash-undo-toast--visible");

        undoToastTimer = window.setTimeout(dismissUndoToast, UNDO_TOAST_MS);
    }

    function setupUndoToast() {
        var toast = document.getElementById("home-trash-undo-toast");
        if (!toast || toast.dataset.gadlyBound === "1") return;
        toast.dataset.gadlyBound = "1";
        var undoBtn = toast.querySelector(".home-trash-undo-toast__undo");
        var closeBtn = toast.querySelector(".home-trash-undo-toast__close");
        if (undoBtn) undoBtn.addEventListener("click", performUndo);
        if (closeBtn) closeBtn.addEventListener("click", dismissUndoToast);
    }

    var AUTO_SCROLL_EDGE = 120;
    var AUTO_SCROLL_MIN_SPEED = 120;
    var AUTO_SCROLL_MAX_SPEED = 980;
    var autoScrollRaf = 0;
    var autoScrollLastTs = 0;

    function lerp(a, b, t) {
        return a + (b - a) * Math.min(1, Math.max(0, t));
    }

    function stopAutoScrollLoop() {
        if (autoScrollRaf) {
            cancelAnimationFrame(autoScrollRaf);
            autoScrollRaf = 0;
        }
        autoScrollLastTs = 0;
    }

    function getAutoScrollSpeed(clientY) {
        if (isMobileTrashHome()) return 0;
        if (typeof clientY !== "number") return 0;
        var vh = window.innerHeight;
        var scrollY = window.scrollY;
        var maxY = Math.max(0, document.documentElement.scrollHeight - vh);

        if (clientY < AUTO_SCROLL_EDGE && scrollY > 0) {
            var upT = 1 - Math.max(0, clientY) / AUTO_SCROLL_EDGE;
            upT = upT * upT;
            return -lerp(AUTO_SCROLL_MIN_SPEED, AUTO_SCROLL_MAX_SPEED, upT);
        }
        if (clientY > vh - AUTO_SCROLL_EDGE && scrollY < maxY - 1) {
            var downT = 1 - Math.max(0, vh - clientY) / AUTO_SCROLL_EDGE;
            downT = downT * downT;
            return lerp(AUTO_SCROLL_MIN_SPEED, AUTO_SCROLL_MAX_SPEED, downT);
        }
        return 0;
    }

    function tickAutoScroll(ts) {
        autoScrollRaf = 0;
        if (!pointerDrag || !pointerDrag.active) {
            autoScrollLastTs = 0;
            return;
        }

        if (!autoScrollLastTs) autoScrollLastTs = ts;
        var dt = Math.min(50, ts - autoScrollLastTs) / 1000;
        autoScrollLastTs = ts;

        var speed = getAutoScrollSpeed(pointerDrag.lastY);
        if (speed !== 0) {
            window.scrollBy(0, speed * dt);
            if (typeof pointerDrag.lastX === "number" && typeof pointerDrag.lastY === "number") {
                updateTrashTarget(pointerDrag.lastX, pointerDrag.lastY);
            }
        }

        autoScrollRaf = requestAnimationFrame(tickAutoScroll);
    }

    function ensureAutoScrollLoop() {
        if (isMobileTrashHome()) return;
        if (!autoScrollRaf && pointerDrag && pointerDrag.active) {
            autoScrollRaf = requestAnimationFrame(tickAutoScroll);
        }
    }

    function removeDragGhost() {
        if (!pointerDrag || !pointerDrag.ghostEl) return;
        if (pointerDrag.ghostEl.parentNode) {
            pointerDrag.ghostEl.parentNode.removeChild(pointerDrag.ghostEl);
        }
        pointerDrag.ghostEl = null;
        pointerDrag.ghostOffsetX = 0;
        pointerDrag.ghostOffsetY = 0;
        if (isMobileTrashHome()) {
            setMobileGhostPreviewActive(false);
        }
    }

    function getToolBtnLabel(btn) {
        return (btn.innerText || btn.textContent || "").trim();
    }

    function isToolDragSource(btn) {
        var wrap = btn.closest(".tool-btn-wrap");
        if (wrap) {
            return !wrap.classList.contains("tool-btn-wrap--hidden-home");
        }
        return btn.classList.contains("shortcuts-btn");
    }

    function applyGhostTypography(ghost, sourceEl) {
        var cs = window.getComputedStyle(sourceEl);
        ghost.style.fontSize = cs.fontSize;
        ghost.style.fontWeight = cs.fontWeight;
        ghost.style.fontFamily = cs.fontFamily;
        ghost.style.lineHeight = cs.lineHeight;
        ghost.style.letterSpacing = cs.letterSpacing;
    }

    var MOBILE_GHOST_FONT_SCALE = 1.12;

    function scaleMobileGhostFont(ghost, sourceEl) {
        var cs = window.getComputedStyle(sourceEl);
        var px = parseFloat(cs.fontSize);
        if (!isNaN(px) && px > 0) {
            ghost.style.fontSize = Math.round(px * MOBILE_GHOST_FONT_SCALE) + "px";
        }
    }

    function ghostOffsetFromGrab(sourceRect, clientX, clientY, ghostRect) {
        var relX = sourceRect.width > 0 ? (clientX - sourceRect.left) / sourceRect.width : 0.5;
        var relY = sourceRect.height > 0 ? (clientY - sourceRect.top) / sourceRect.height : 0.5;
        return {
            offsetX: relX * ghostRect.width,
            offsetY: relY * ghostRect.height
        };
    }

    /** Mobile — testo rosso centrato sul dito. */
    function ghostOffsetCentered(ghostRect) {
        return {
            offsetX: ghostRect.width * 0.5,
            offsetY: ghostRect.height * 0.5
        };
    }

    function resolveToolGhostBackground(cs) {
        var bg = cs.backgroundColor;
        if (!bg || bg === "transparent" || bg === "rgba(0, 0, 0, 0)") {
            return "#003f7f";
        }
        return bg;
    }

    /** Desktop — tool: bottone intero rosso; categoria: testo rosso ingrandito. */
    function buildDesktopDragGhost(sourceEl, clientX, clientY, payload) {
        if (payload && payload.type === "category") {
            var labelEl = sourceEl.querySelector(".category-btn-label--desktop") || sourceEl;
            var labelRect = labelEl.getBoundingClientRect();
            var labelCs = window.getComputedStyle(labelEl);
            var catGhost = document.createElement("span");
            catGhost.className = "gadly-trash-drag-ghost gadly-trash-drag-ghost--category-text gadly-trash-drag-ghost--category-text-desktop";
            catGhost.textContent = labelEl.textContent.trim();
            catGhost.setAttribute("aria-hidden", "true");
            catGhost.style.position = "fixed";
            catGhost.style.zIndex = "2147483003";
            catGhost.style.pointerEvents = "none";
            catGhost.style.opacity = "1";
            catGhost.style.whiteSpace = "nowrap";
            applyGhostTypography(catGhost, labelEl);
            var labelPx = parseFloat(labelCs.fontSize);
            if (!isNaN(labelPx) && labelPx > 0) {
                catGhost.style.fontSize = Math.round(labelPx * 1.14) + "px";
            }
            document.body.appendChild(catGhost);
            return {
                el: catGhost,
                offsetX: clientX - labelRect.left,
                offsetY: clientY - labelRect.top
            };
        }

        var rect = sourceEl.getBoundingClientRect();
        var cs = window.getComputedStyle(sourceEl);
        var ghost = document.createElement("div");
        ghost.className = "gadly-trash-drag-ghost gadly-trash-drag-ghost--tool";
        ghost.textContent = getToolBtnLabel(sourceEl);
        ghost.setAttribute("aria-hidden", "true");

        var gs = ghost.style;
        gs.position = "fixed";
        gs.zIndex = "2147483003";
        gs.visibility = "visible";
        gs.opacity = "0.96";
        gs.pointerEvents = "none";
        gs.boxSizing = "border-box";
        gs.display = "flex";
        gs.alignItems = "center";
        gs.justifyContent = "center";
        gs.textAlign = "center";
        gs.width = Math.round(rect.width) + "px";
        gs.height = Math.round(rect.height) + "px";
        gs.fontSize = cs.fontSize;
        gs.fontWeight = cs.fontWeight;
        gs.fontFamily = cs.fontFamily;
        gs.borderRadius = cs.borderRadius;
        gs.padding = cs.padding;
        gs.lineHeight = cs.lineHeight;
        gs.letterSpacing = cs.letterSpacing;
        gs.transform = "none";
        gs.whiteSpace = "nowrap";
        gs.overflow = "hidden";
        gs.textOverflow = "ellipsis";

        document.body.appendChild(ghost);
        var toolOff = ghostOffsetFromGrab(rect, clientX, clientY, ghost.getBoundingClientRect());
        gs.left = Math.round(clientX - toolOff.offsetX) + "px";
        gs.top = Math.round(clientY - toolOff.offsetY) + "px";
        return {
            el: ghost,
            offsetX: toolOff.offsetX,
            offsetY: toolOff.offsetY
        };
    }

    function buildMobileDragGhost(sourceEl, clientX, clientY, payload) {
        if (payload && payload.type === "category") {
            var anchorEl = getCategoryAnchorEl(sourceEl) || sourceEl;
            var anchorRect = anchorEl.getBoundingClientRect();
            var catGhost = document.createElement("span");
            catGhost.className = "gadly-trash-drag-ghost gadly-trash-drag-ghost--category-text";
            catGhost.textContent = getCategoryDisplayName(sourceEl);
            catGhost.setAttribute("aria-hidden", "true");
            catGhost.style.position = "fixed";
            catGhost.style.zIndex = "2147483003";
            catGhost.style.pointerEvents = "none";
            catGhost.style.opacity = "1";
            catGhost.style.whiteSpace = "nowrap";
            applyGhostTypography(catGhost, anchorEl);
            scaleMobileGhostFont(catGhost, anchorEl);
            document.body.appendChild(catGhost);
            var catGhostRect = catGhost.getBoundingClientRect();
            var catOff = ghostOffsetCentered(catGhostRect);
            catGhost.style.left = Math.round(clientX - catOff.offsetX) + "px";
            catGhost.style.top = Math.round(clientY - catOff.offsetY) + "px";
            return {
                el: catGhost,
                offsetX: catOff.offsetX,
                offsetY: catOff.offsetY
            };
        }

        var rect = sourceEl.getBoundingClientRect();
        var ghost = document.createElement("span");
        ghost.className = "gadly-trash-drag-ghost gadly-trash-drag-ghost--tool-text";
        ghost.textContent = getToolBtnLabel(sourceEl);
        ghost.setAttribute("aria-hidden", "true");
        ghost.style.position = "fixed";
        ghost.style.zIndex = "2147483003";
        ghost.style.pointerEvents = "none";
        ghost.style.opacity = "1";
        ghost.style.whiteSpace = "nowrap";
        applyGhostTypography(ghost, sourceEl);
        scaleMobileGhostFont(ghost, sourceEl);
        document.body.appendChild(ghost);
        var ghostRect = ghost.getBoundingClientRect();
        var toolOff = ghostOffsetCentered(ghostRect);
        ghost.style.left = Math.round(clientX - toolOff.offsetX) + "px";
        ghost.style.top = Math.round(clientY - toolOff.offsetY) + "px";
        return {
            el: ghost,
            offsetX: toolOff.offsetX,
            offsetY: toolOff.offsetY
        };
    }

    function positionDragGhost(clientX, clientY) {
        if (!pointerDrag || !pointerDrag.ghostEl) return;
        pointerDrag.ghostEl.style.left = Math.round(clientX - pointerDrag.ghostOffsetX) + "px";
        pointerDrag.ghostEl.style.top = Math.round(clientY - pointerDrag.ghostOffsetY) + "px";
    }

    function setTrashDragActive(active, opts) {
        opts = opts || {};
        document.documentElement.classList.toggle("gadly-trash-drag-active", active);
        if (active && isMobileTrashHome()) {
            clearMobileTrashHideTimer();
        }
        if (active && (isDesktopTrashHome() || isMobileTrashHome())) {
            showDragShield();
        }
        if (!active) {
            stopAutoScrollLoop();
            removeDragGhost();
            hideDragShield();
            var bin = document.getElementById("desktop-trash-bin");
            if (bin) bin.classList.remove("desktop-trash-bin--drop-target");
            if (isMobileTrashHome() && !opts.keepTrashVisible) {
                hideMobileTrashIfIdle();
            }
        }
    }

    var DRAG_THRESHOLD_PX = 6;
    var MOBILE_LONG_PRESS_MS = 420;
    var MOBILE_LONG_PRESS_CANCEL_PX = 48;
    var MOBILE_ARMED_DRAG_PX = 4;
    var mobileScrollLockY = 0;
    var DRAG_LISTENER_OPTS = { capture: true, passive: false };
    var pointerDrag = null;

    function safeVibrate(pattern) {
        if (!navigator.vibrate) return;
        try {
            var ua = navigator.userActivation;
            if (ua && ua.isActive === false) return;
            navigator.vibrate(pattern);
        } catch (vibrateErr) { /* ignore */ }
    }
    var homeTrashDragAbort = null;
    var dragShieldEl = null;

    function ensureDragShield() {
        if (!dragShieldEl) {
            dragShieldEl = document.createElement("div");
            dragShieldEl.className = "gadly-trash-drag-shield";
            dragShieldEl.setAttribute("aria-hidden", "true");
        }
        return dragShieldEl;
    }

    function showDragShield() {
        var shield = ensureDragShield();
        if (!shield.parentNode) {
            document.body.appendChild(shield);
        }
    }

    function hideDragShield() {
        if (!dragShieldEl || !dragShieldEl.parentNode) return;
        dragShieldEl.parentNode.removeChild(dragShieldEl);
    }

    function setMobileTrashPressActive(active) {
        if (!isMobileTrashHome()) return;
        document.documentElement.classList.toggle("gadly-trash-mobile-press", !!active);
    }

    function lockMobilePageScroll() {
        if (!isMobileTrashHome()) return;
        if (document.documentElement.classList.contains("gadly-trash-scroll-lock")) return;
        mobileScrollLockY = window.scrollY || window.pageYOffset || 0;
        document.documentElement.classList.add("gadly-trash-scroll-lock");
        /* Niente body position:fixed: taglia i tool e fa saltare il cestino.
           Blocco scroll con overflow + preventDefault su touchmove. */
        document.body.style.removeProperty("position");
        document.body.style.removeProperty("top");
        document.body.style.removeProperty("left");
        document.body.style.removeProperty("right");
        document.body.style.removeProperty("width");
        pinMobileTrashPosition();
    }

    function unlockMobilePageScroll() {
        if (!document.documentElement.classList.contains("gadly-trash-scroll-lock")) return;
        document.documentElement.classList.remove("gadly-trash-scroll-lock");
        document.body.style.removeProperty("position");
        document.body.style.removeProperty("top");
        document.body.style.removeProperty("left");
        document.body.style.removeProperty("right");
        document.body.style.removeProperty("width");
        mobileScrollLockY = 0;
        if (!document.documentElement.classList.contains("gadly-mobile-trash-visible")) {
            unpinMobileTrashPosition();
        } else {
            pinMobileTrashPosition();
        }
    }

    function cancelMobileTouchDrag(clientX, clientY) {
        if (!pointerDrag || !pointerDrag.touchGesture) return;
        var el = pointerDrag.el;
        clearMobileLongPressTimer();
        detachDocumentDragListeners();
        removeDragGhost();
        setMobileGhostPreviewActive(false);
        if (pointerDrag.longPressArmed || pointerDrag.trashWasVisible) {
            scheduleMobileTrashHide(MOBILE_TRASH_AFTER_DROP_MS);
        } else {
            hideMobileTrashIfIdle();
        }
        clearMobileTrashPressState(el);
        unlockMobilePageScroll();
        pointerDrag = null;
    }

    function setTrashHoldingVisual(el, active) {
        if (!el || !el.classList) return;
        if (active) {
            el.classList.add("gadly-trash-holding");
        } else {
            el.classList.remove("gadly-trash-holding");
        }
        if (!isMobileTrashHome() || !el.classList.contains("tool-btn")) return;
        var wrap = el.closest(".tool-btn-wrap");
        if (!wrap) return;
        if (active) {
            wrap.classList.add("gadly-trash-holding");
        } else {
            wrap.classList.remove("gadly-trash-holding");
        }
    }

    function restoreMobileTouchAction(captureEl) {
        if (!captureEl || !captureEl.style) return;
        captureEl.style.touchAction = "";
        if (captureEl.classList && captureEl.classList.contains("tool-btn-wrap")) {
            var link = captureEl.querySelector("a.tool-btn");
            if (link && link.style) {
                link.style.touchAction = "";
            }
        }
    }

    function clearMobileTrashPressState(el) {
        if (pointerDrag && pointerDrag.captureEl) {
            restoreMobileTouchAction(pointerDrag.captureEl);
        }
        setMobileTrashPressActive(false);
        unlockMobilePageScroll();
        setTrashHoldingVisual(el, false);
        if (el && el.classList) {
            el.classList.remove("tap-active");
        }
    }

    function getSafeAreaInsetBottom() {
        try {
            var probe = document.createElement("div");
            probe.setAttribute("aria-hidden", "true");
            probe.style.cssText = "position:fixed;left:0;bottom:0;width:0;height:env(safe-area-inset-bottom,0px);visibility:hidden;pointer-events:none;";
            document.documentElement.appendChild(probe);
            var h = probe.getBoundingClientRect().height || 0;
            probe.parentNode.removeChild(probe);
            return h;
        } catch (eSafe) {
            return 0;
        }
    }

    function resetMobileTrashLayoutCache() {
        mobileTrashLayoutCache = null;
        try {
            document.documentElement.style.removeProperty("--gadly-mobile-trash-top");
            document.documentElement.style.removeProperty("--gadly-mobile-trash-left");
        } catch (eResetLayout) {}
    }

    function ensureMobileTrashLayout() {
        if (!isMobileTrashHome()) return null;
        if (mobileTrashLayoutCache) return mobileTrashLayoutCache;
        var bin = document.getElementById("desktop-trash-bin");
        if (!bin) return null;
        var safeBottom = getSafeAreaInsetBottom();
        var bottomGap = 40 + safeBottom;
        var binHeight = 65;
        try {
            var measured = bin.getBoundingClientRect();
            if (measured.height > 0) {
                binHeight = Math.round(measured.height);
            }
        } catch (eMeasure) {}
        var viewportH = window.innerHeight || document.documentElement.clientHeight || 0;
        var top = Math.round(viewportH - bottomGap - binHeight);
        if (top < 0) top = 0;
        mobileTrashLayoutCache = { top: top, left: 12 };
        try {
            document.documentElement.style.setProperty("--gadly-mobile-trash-top", top + "px");
            document.documentElement.style.setProperty("--gadly-mobile-trash-left", "12px");
        } catch (eCssVar) {}
        return mobileTrashLayoutCache;
    }

    function pinMobileTrashPosition() {
        if (!isMobileTrashHome()) return;
        var bin = document.getElementById("desktop-trash-bin");
        if (!bin) return;
        var layout = ensureMobileTrashLayout();
        if (!layout) return;
        /* Posizione fissa in px (calcolata una volta): niente salti tra un drag e l'altro. */
        bin.style.setProperty("position", "fixed", "important");
        bin.style.setProperty("top", layout.top + "px", "important");
        bin.style.setProperty("bottom", "auto", "important");
        bin.style.setProperty("left", layout.left + "px", "important");
        bin.style.setProperty("right", "auto", "important");
        bin.style.setProperty("transform", "none", "important");
        bin.style.setProperty("transition", "none", "important");
        bin.style.setProperty("animation", "none", "important");
    }

    function unpinMobileTrashPosition() {
        if (isMobileTrashHome()) return;
        if (typeof window.__gadlyClearTrashInlineLayout === "function") {
            window.__gadlyClearTrashInlineLayout(document.getElementById("desktop-trash-bin"));
            return;
        }
        var bin = document.getElementById("desktop-trash-bin");
        if (!bin) return;
        bin.style.removeProperty("position");
        bin.style.removeProperty("top");
        bin.style.removeProperty("bottom");
        bin.style.removeProperty("left");
        bin.style.removeProperty("right");
        bin.style.removeProperty("transform");
        bin.style.removeProperty("transition");
        bin.style.removeProperty("animation");
        resetMobileTrashLayoutCache();
    }

    function resetDesktopTrashAfterViewportChange() {
        unlockMobilePageScroll();
        document.documentElement.classList.remove("gadly-mobile-trash-visible");
        document.documentElement.classList.remove("gadly-trash-drag-active");
        document.documentElement.classList.remove("gadly-trash-ghost-preview");
        resetMobileTrashLayoutCache();
        if (!isMobileTrashHome()) {
            unpinMobileTrashPosition();
        }
    }

    function setMobileTrashVisible(visible) {
        if (!isMobileTrashHome()) return;
        var bin = document.getElementById("desktop-trash-bin");
        if (bin && visible) {
            bin.classList.remove("desktop-trash-bin--hint");
            /* Prima ancora della classe visible: posizione già corretta. */
            pinMobileTrashPosition();
        }
        document.documentElement.classList.toggle("gadly-mobile-trash-visible", !!visible);
        if (visible) {
            pinMobileTrashPosition();
            if (pointerDrag) pointerDrag.trashWasVisible = true;
        } else if (!document.documentElement.classList.contains("gadly-trash-drag-active")) {
            unpinMobileTrashPosition();
        }
    }

    function hideMobileTrashIfIdle() {
        if (!isMobileTrashHome()) return;
        if (pointerDrag && pointerDrag.active) return;
        setMobileTrashVisible(false);
    }

    function clearMobileLongPressTimer() {
        if (!pointerDrag || !pointerDrag.longPressTimer) return;
        window.clearTimeout(pointerDrag.longPressTimer);
        pointerDrag.longPressTimer = null;
    }

    function cancelMobileLongPress() {
        clearMobileLongPressTimer();
        if (pointerDrag) pointerDrag.longPressArmed = false;
    }

    function setMobileGhostPreviewActive(active) {
        if (!isMobileTrashHome()) return;
        document.documentElement.classList.toggle("gadly-trash-ghost-preview", !!active);
    }

    function ensureMobileGhostPreview(clientX, clientY) {
        if (!pointerDrag || !isMobileTrashHome()) return;
        if (!pointerDrag.ghostEl) {
            var previewGhost = buildMobileDragGhost(
                pointerDrag.el,
                clientX,
                clientY,
                pointerDrag.payload
            );
            pointerDrag.ghostEl = previewGhost.el;
            pointerDrag.ghostOffsetX = previewGhost.offsetX;
            pointerDrag.ghostOffsetY = previewGhost.offsetY;
            pointerDrag.ghostPreview = true;
            setMobileGhostPreviewActive(true);
        }
        positionDragGhost(clientX, clientY);
    }

    function activatePointerDrag(clientX, clientY) {
        if (!pointerDrag || pointerDrag.active) return;
        pointerDrag.active = true;
        pointerDrag.ghostPreview = false;
        var captureEl = pointerDrag.captureEl || pointerDrag.el;
        if (captureEl.setPointerCapture && typeof pointerDrag.pointerId === "number") {
            try {
                captureEl.setPointerCapture(pointerDrag.pointerId);
            } catch (captureErr) {}
        }
        if (isMobileTrashHome()) {
            ensureMobileGhostPreview(clientX, clientY);
            if (pointerDrag.draggingClass) {
                pointerDrag.el.classList.add(pointerDrag.draggingClass);
            }
            setMobileTrashVisible(true);
            pointerDrag.mobileTrashPending = false;
            setTrashDragActive(true);
            document.addEventListener("wheel", onDocumentWheel, { capture: true, passive: false });
            ensureAutoScrollLoop();
            return;
        }
        var ghost = buildDesktopDragGhost(pointerDrag.el, clientX, clientY, pointerDrag.payload);
        pointerDrag.ghostEl = ghost.el;
        pointerDrag.ghostOffsetX = ghost.offsetX;
        pointerDrag.ghostOffsetY = ghost.offsetY;
        if (pointerDrag.draggingClass) {
            pointerDrag.el.classList.add(pointerDrag.draggingClass);
        }
        setTrashDragActive(true);
        positionDragGhost(clientX, clientY);
        document.addEventListener("wheel", onDocumentWheel, { capture: true, passive: false });
        ensureAutoScrollLoop();
    }

    function isCategoryDragEl(el) {
        return !!(el && el.classList && el.classList.contains("category-btn"));
    }

    function ensureMobileTrashOnMove(clientX, clientY) {
        if (!isMobileTrashHome() || !pointerDrag || !pointerDrag.mobileTrashPending) return;
        if (!mobileDragMoveThresholdMet(clientX, clientY)) return;
        setMobileTrashVisible(true);
        pointerDrag.mobileTrashPending = false;
    }

    function beginMobileTrashTouchPress(el) {
        if (!el) return;
        setTrashHoldingVisual(el, true);
    }

    function onMobileLongPressReady(opts) {
        opts = opts || {};
        if (!pointerDrag || pointerDrag.longPressArmed || pointerDrag.active) return;
        pointerDrag.longPressArmed = true;
        pointerDrag.longPressTimer = null;
        pointerDrag.armedX = pointerDrag.lastX;
        pointerDrag.armedY = pointerDrag.lastY;
        pointerDrag.mobileTrashPending = false;
        clearMobileTrashHideTimer();
        setMobileTrashPressActive(true);
        lockMobilePageScroll();
        var captureEl = pointerDrag.captureEl || pointerDrag.el;
        if (captureEl && captureEl.style) {
            captureEl.style.touchAction = "none";
            if (captureEl.classList && captureEl.classList.contains("tool-btn-wrap")) {
                var pressLink = captureEl.querySelector("a.tool-btn");
                if (pressLink && pressLink.style) {
                    pressLink.style.touchAction = "none";
                }
            }
        }
        setTrashHoldingVisual(pointerDrag.el, true);
        if (opts.vibrate) safeVibrate(12);
        ensureMobileGhostPreview(pointerDrag.lastX, pointerDrag.lastY);
        setMobileTrashVisible(true);
        updateTrashTarget(pointerDrag.lastX, pointerDrag.lastY);
    }

    function tryFireMobileLongPressFromHold() {
        if (!pointerDrag || !isMobileTrashHome() || !pointerDrag.touchGesture) return false;
        if (pointerDrag.longPressArmed || pointerDrag.active || !pointerDrag.longPressTimer) return false;
        if (Date.now() - pointerDrag.touchStartTime < MOBILE_LONG_PRESS_MS) return false;
        clearMobileLongPressTimer();
        onMobileLongPressReady({ vibrate: true });
        return true;
    }

    function mobileDragMoveThresholdMet(clientX, clientY) {
        if (!pointerDrag) return false;
        if (pointerDrag.longPressArmed && typeof pointerDrag.armedX === "number") {
            var adx = clientX - pointerDrag.armedX;
            var ady = clientY - pointerDrag.armedY;
            return adx * adx + ady * ady >= MOBILE_ARMED_DRAG_PX * MOBILE_ARMED_DRAG_PX;
        }
        var dx = clientX - pointerDrag.startX;
        var dy = clientY - pointerDrag.startY;
        return dx * dx + dy * dy >= DRAG_THRESHOLD_PX * DRAG_THRESHOLD_PX;
    }

    function tryActivateMobileDrag(clientX, clientY) {
        if (!pointerDrag || !pointerDrag.longPressArmed || pointerDrag.active) return false;
        if (!mobileDragMoveThresholdMet(clientX, clientY)) return false;
        activatePointerDrag(clientX, clientY);
        updateTrashTarget(clientX, clientY);
        return true;
    }

    function getTrashHitPadding() {
        return isMobileTrashHome() ? 18 : 12;
    }

    function pointInTrashHitArea(x, y, rect, pad) {
        return x >= rect.left - pad && x <= rect.right + pad &&
            y >= rect.top - pad && y <= rect.bottom + pad;
    }

    function isOverTrash(x, y) {
        var bin = document.getElementById("desktop-trash-bin");
        if (!bin || bin.hasAttribute("hidden")) return false;
        var r = bin.getBoundingClientRect();
        var pad = getTrashHitPadding();
        if (pointInTrashHitArea(x, y, r, pad)) return true;

        if (pointerDrag && pointerDrag.active && pointerDrag.ghostEl) {
            var gr = pointerDrag.ghostEl.getBoundingClientRect();
            return pointInTrashHitArea(gr.left + gr.width / 2, gr.top + gr.height / 2, r, pad);
        }
        return false;
    }

    function updateTrashTarget(clientX, clientY) {
        var bin = document.getElementById("desktop-trash-bin");
        if (!bin) return;
        bin.classList.toggle("desktop-trash-bin--drop-target", isOverTrash(clientX, clientY));
    }

    function findTouchInList(list, id) {
        for (var i = 0; i < list.length; i++) {
            if (list[i].identifier === id) return list[i];
        }
        return null;
    }

    function getCategoryPayloadForBtn(btn) {
        var section = btn.closest(".tool-section");
        if (!section || !window.gadlyHiddenTools) return null;
        var entries = getCategoryEntries(section).filter(function (entry) {
            return !window.gadlyHiddenTools.isHidden(entry.url);
        });
        return entries.length ? { type: "category", entries: entries } : null;
    }

    function attachDocumentDragListeners() {
        document.addEventListener("pointermove", onDocumentPointerMove, DRAG_LISTENER_OPTS);
        document.addEventListener("pointerup", onDocumentPointerEnd, DRAG_LISTENER_OPTS);
        document.addEventListener("pointercancel", onDocumentPointerEnd, DRAG_LISTENER_OPTS);
    }

    function blockNativeContextMenu(e) {
        e.preventDefault();
        e.stopPropagation();
    }

    function onDocumentContextMenu(e) {
        if (!pointerDrag || !isMobileTrashHome()) return;
        blockNativeContextMenu(e);
    }

    function attachMobileTouchDragListeners() {
        document.addEventListener("touchmove", onDocumentTouchMove, DRAG_LISTENER_OPTS);
        document.addEventListener("touchend", onDocumentTouchEnd, DRAG_LISTENER_OPTS);
        document.addEventListener("touchcancel", onDocumentTouchEnd, DRAG_LISTENER_OPTS);
        document.addEventListener("contextmenu", onDocumentContextMenu, DRAG_LISTENER_OPTS);
    }

    function detachDocumentDragListeners() {
        document.removeEventListener("pointermove", onDocumentPointerMove, DRAG_LISTENER_OPTS);
        document.removeEventListener("pointerup", onDocumentPointerEnd, DRAG_LISTENER_OPTS);
        document.removeEventListener("pointercancel", onDocumentPointerEnd, DRAG_LISTENER_OPTS);
        document.removeEventListener("touchmove", onDocumentTouchMove, DRAG_LISTENER_OPTS);
        document.removeEventListener("touchend", onDocumentTouchEnd, DRAG_LISTENER_OPTS);
        document.removeEventListener("touchcancel", onDocumentTouchEnd, DRAG_LISTENER_OPTS);
        document.removeEventListener("contextmenu", onDocumentContextMenu, DRAG_LISTENER_OPTS);
        document.removeEventListener("wheel", onDocumentWheel, DRAG_LISTENER_OPTS);
        stopAutoScrollLoop();
    }

    function onDocumentWheel(e) {
        if (!pointerDrag || !pointerDrag.active) return;
        if (isMobileTrashHome()) return;
        e.preventDefault();
        window.scrollBy(0, e.deltaY);
        if (typeof pointerDrag.lastX === "number" && typeof pointerDrag.lastY === "number") {
            updateTrashTarget(pointerDrag.lastX, pointerDrag.lastY);
        }
    }

    function processDragMove(clientX, clientY) {
        if (!pointerDrag) return;
        pointerDrag.lastX = clientX;
        pointerDrag.lastY = clientY;

        tryFireMobileLongPressFromHold();

        if (isMobileTrashHome() && pointerDrag.touchGesture &&
            !pointerDrag.longPressArmed && !pointerDrag.active) {
            var cdx = clientX - pointerDrag.startX;
            var cdy = clientY - pointerDrag.startY;
            if (cdx * cdx + cdy * cdy >=
                MOBILE_LONG_PRESS_CANCEL_PX * MOBILE_LONG_PRESS_CANCEL_PX) {
                cancelMobileTouchDrag(clientX, clientY);
                return;
            }
        }

        if (isMobileTrashHome() && pointerDrag.longPressArmed && !pointerDrag.active) {
            ensureMobileGhostPreview(clientX, clientY);
            tryActivateMobileDrag(clientX, clientY);
            return;
        }

        if (!pointerDrag.active) {
            if (!isMobileTrashHome()) {
                var dx = clientX - pointerDrag.startX;
                var dy = clientY - pointerDrag.startY;
                if (dx * dx + dy * dy < DRAG_THRESHOLD_PX * DRAG_THRESHOLD_PX) return;
                activatePointerDrag(clientX, clientY);
            }
            return;
        }

        if (isMobileTrashHome()) {
            ensureMobileTrashOnMove(clientX, clientY);
        }
        positionDragGhost(clientX, clientY);
        ensureAutoScrollLoop();
        updateTrashTarget(clientX, clientY);
    }

    function shouldPreventDragScroll() {
        if (!pointerDrag) return false;
        if (isMobileTrashHome()) {
            return pointerDrag.longPressArmed || pointerDrag.active;
        }
        return pointerDrag.active;
    }

    function onDocumentPointerMove(e) {
        if (!pointerDrag || pointerDrag.touchGesture) return;
        if (e.pointerId !== pointerDrag.pointerId) return;
        processDragMove(e.clientX, e.clientY);
        if (shouldPreventDragScroll()) e.preventDefault();
    }

    function onDocumentTouchMove(e) {
        if (!pointerDrag || !pointerDrag.touchGesture) return;
        var t = findTouchInList(e.touches, pointerDrag.pointerId);
        if (!t) return;
        if (pointerDrag.longPressArmed || pointerDrag.active) {
            e.preventDefault();
        }
        processDragMove(t.clientX, t.clientY);
    }

    function onDocumentTouchEnd(e) {
        if (!pointerDrag || !pointerDrag.touchGesture) return;
        var t = findTouchInList(e.changedTouches, pointerDrag.pointerId);
        if (!t) return;
        var suppressClick = pointerDrag.longPressArmed || pointerDrag.active;
        if (suppressClick) {
            e.preventDefault();
        }
        finishDragGesture(t.clientX, t.clientY, { suppressClick: suppressClick });
    }

    function toolLinkPath(el) {
        if (!el || !el.getAttribute) return "";
        var href = el.getAttribute("href") || "";
        if (!href) return "";
        try {
            return new URL(href, window.location.href).pathname;
        } catch (urlErr) {
            return href.split("?")[0].split("#")[0];
        }
    }

    function markTrashSuppressClick(el, opts) {
        opts = opts || {};
        trashClickSuppress.until = Date.now() + TRASH_CLICK_SUPPRESS_MS;
        trashClickSuppress.toolHref = toolLinkPath(el);
        trashClickSuppress.blockTrashBin = !!opts.blockTrashBin;
        if (!el || !el.dataset) return;
        el.dataset.gadlySuppressClick = "1";
        window.setTimeout(function () {
            if (el.dataset) {
                delete el.dataset.gadlySuppressClick;
            }
        }, TRASH_CLICK_SUPPRESS_MS);
    }

    function shouldSuppressHomeToolClick(link) {
        if (!link || Date.now() > trashClickSuppress.until) return false;
        if (!trashClickSuppress.toolHref) return false;
        return toolLinkPath(link) === trashClickSuppress.toolHref;
    }

    function blockSuppressedHomeClick(e) {
        if (!isTrashHome() || isMobileTrashHome()) return;
        if (Date.now() > trashClickSuppress.until) return;

        var toolLink = e.target && e.target.closest && e.target.closest("a.tool-btn");
        if (toolLink && shouldSuppressHomeToolClick(toolLink)) {
            e.preventDefault();
            e.stopPropagation();
            e.stopImmediatePropagation();
            return;
        }

        if (trashClickSuppress.blockTrashBin) {
            var trashLink = e.target && e.target.closest &&
                e.target.closest("#desktop-trash-bin-btn, .desktop-trash-bin__btn");
            if (trashLink) {
                e.preventDefault();
                e.stopPropagation();
                e.stopImmediatePropagation();
            }
        }
    }

    function setupDesktopClickSuppress() {
        if (desktopClickSuppressBound || !isTrashHome()) return;
        desktopClickSuppressBound = true;
        document.addEventListener("click", blockSuppressedHomeClick, true);
        document.addEventListener("auxclick", blockSuppressedHomeClick, true);
        document.addEventListener("pointerup", blockSuppressedHomeClick, true);
        document.addEventListener("mouseup", blockSuppressedHomeClick, true);
    }

    function finishDragGesture(clientX, clientY, opts) {
        opts = opts || {};
        if (!pointerDrag) return;

        var el = pointerDrag.el;
        var captureEl = pointerDrag.captureEl || el;
        var wasActive = pointerDrag.active;
        var payload = pointerDrag.payload;
        var longPressArmed = pointerDrag.longPressArmed;

        cancelMobileLongPress();
        detachDocumentDragListeners();

        if (captureEl.releasePointerCapture) {
            try {
                captureEl.releasePointerCapture(pointerDrag.pointerId);
            } catch (releaseErr) {}
        }
        if (wasActive) {
            var droppedOnTrash = isOverTrash(clientX, clientY);
            markTrashSuppressClick(el, { blockTrashBin: droppedOnTrash });
            if (pointerDrag.draggingClass) {
                el.classList.remove(pointerDrag.draggingClass);
            }
            if (droppedOnTrash) {
                var dropPayload = payload;
                window.setTimeout(function () {
                    handleDrop(dropPayload);
                }, 0);
            }
            var keepTrashVisible = droppedOnTrash;
            if (isMobileTrashHome()) {
                keepTrashVisible = droppedOnTrash || !!pointerDrag.trashWasVisible;
            }
            setTrashDragActive(false, { keepTrashVisible: keepTrashVisible });
            if (isMobileTrashHome() && keepTrashVisible) {
                scheduleMobileTrashHide(MOBILE_TRASH_AFTER_DROP_MS);
            }
        }

        if (isMobileTrashHome()) {
            if (!wasActive && (opts.suppressClick || longPressArmed)) {
                markTrashSuppressClick(el);
            }
            if (!wasActive) {
                removeDragGhost();
            }
            clearMobileTrashPressState(el);
            if (!wasActive) {
                if (longPressArmed) {
                    scheduleMobileTrashHide(MOBILE_TRASH_AFTER_DROP_MS);
                } else {
                    hideMobileTrashIfIdle();
                }
            }
        }

        pointerDrag = null;
    }

    function onDocumentPointerEnd(e) {
        if (!pointerDrag || pointerDrag.touchGesture) return;
        if (e.pointerId !== pointerDrag.pointerId) return;
        if (pointerDrag.active && isDesktopTrashHome()) {
            markTrashSuppressClick(pointerDrag.el, {
                blockTrashBin: isOverTrash(e.clientX, e.clientY)
            });
            e.preventDefault();
            e.stopPropagation();
        }
        finishDragGesture(e.clientX, e.clientY);
    }

    function bindMobileCategoryTouchDrag(btn, signal) {
        btn.classList.add("gadly-trash-draggable");

        btn.addEventListener("touchstart", function (e) {
            if (!isTrashHome() || !isMobileTrashHome()) return;
            if (pointerDrag || e.touches.length !== 1) return;

            var t = e.touches[0];
            var payload = getCategoryPayloadForBtn(btn);
            if (!payload) return;

            pointerDrag = {
                el: btn,
                captureEl: btn,
                pointerId: t.identifier,
                touchGesture: true,
                touchStartTime: Date.now(),
                startX: t.clientX,
                startY: t.clientY,
                lastX: t.clientX,
                lastY: t.clientY,
                armedX: t.clientX,
                armedY: t.clientY,
                active: false,
                longPressArmed: false,
                longPressTimer: null,
                mobileTrashPending: false,
                payload: payload,
                draggingClass: "category-btn--dragging"
            };

            clearMobileTrashHideTimer();
            beginMobileTrashTouchPress(btn);
            pointerDrag.longPressTimer = window.setTimeout(function () {
                onMobileLongPressReady();
            }, MOBILE_LONG_PRESS_MS);
            attachMobileTouchDragListeners();
        }, { capture: true, passive: true, signal: signal });

        btn.addEventListener("pointerdown", function (e) {
            if (pointerDrag && pointerDrag.touchGesture &&
                (pointerDrag.longPressArmed || pointerDrag.active)) {
                e.preventDefault();
                e.stopImmediatePropagation();
            }
        }, { capture: true, signal: signal });

        btn.addEventListener("click", function (e) {
            if (btn.dataset.gadlySuppressClick === "1" ||
                btn.dataset.gadlyDidDrag === "1") {
                e.preventDefault();
                e.stopPropagation();
            }
        }, { capture: true, signal: signal });
    }

    function beginDragGesture(clientX, clientY, gestureId, eventEl, visualEl, options) {
        if (!isTrashHome() || pointerDrag) return;

        var payload = options.getPayload(visualEl);
        if (!payload) return;

        pointerDrag = {
            el: visualEl,
            captureEl: eventEl,
            pointerId: gestureId,
            touchGesture: false,
            startX: clientX,
            startY: clientY,
            lastX: clientX,
            lastY: clientY,
            armedX: clientX,
            armedY: clientY,
            active: false,
            longPressArmed: false,
            longPressTimer: null,
            payload: payload,
            draggingClass: options.draggingClass || ""
        };

        if (isMobileTrashHome()) {
            return;
        } else if (isDesktopTrashHome() && eventEl.setPointerCapture) {
            try {
                eventEl.setPointerCapture(gestureId);
            } catch (captureErr) {}
        }

        attachDocumentDragListeners();
    }

    function bindPointerDragSource(eventEl, options) {
        if (!options || !options.signal) return;
        eventEl.classList.add("gadly-trash-draggable");

        var dragEl = options.dragEl || eventEl;
        var signal = options.signal;

        eventEl.addEventListener("dragstart", function (e) {
            e.preventDefault();
        }, { signal: signal });

        if (isMobileTrashHome()) {
            eventEl.addEventListener("contextmenu", function (e) {
                e.preventDefault();
            }, { signal: signal });
        }

        eventEl.addEventListener("pointerdown", function (e) {
            if (!isTrashHome() || isMobileTrashHome()) return;
            if (e.button !== 0) return;
            if (typeof options.shouldIgnore === "function" && options.shouldIgnore(e)) return;

            var visualEl = typeof options.resolveDragEl === "function"
                ? options.resolveDragEl(e)
                : dragEl;
            if (!visualEl) return;

            beginDragGesture(e.clientX, e.clientY, e.pointerId, eventEl, visualEl, options);
        }, { capture: true, passive: false, signal: signal });

        if (options.clickGuardEl) {
            var guardEl = options.clickGuardEl;
            guardEl.addEventListener("click", function (e) {
                if (guardEl.dataset.gadlySuppressClick === "1" ||
                    guardEl.dataset.gadlyDidDrag === "1") {
                    e.preventDefault();
                    e.stopPropagation();
                    e.stopImmediatePropagation();
                }
            }, { capture: true, signal: signal });
        }

    }

    function bindMobileToolTouchDrag(wrap, btn, signal) {
        wrap.classList.add("gadly-trash-draggable");

        wrap.addEventListener("touchstart", function (e) {
            if (!isTrashHome() || !isMobileTrashHome()) return;
            if (pointerDrag || e.touches.length !== 1) return;
            if (e.target && e.target.closest && e.target.closest(".tool-fav")) return;

            var entry = getToolEntryFromBtn(btn);
            if (!entry) return;

            var t = e.touches[0];
            pointerDrag = {
                el: btn,
                captureEl: wrap,
                pointerId: t.identifier,
                touchGesture: true,
                touchStartTime: Date.now(),
                startX: t.clientX,
                startY: t.clientY,
                lastX: t.clientX,
                lastY: t.clientY,
                armedX: t.clientX,
                armedY: t.clientY,
                active: false,
                longPressArmed: false,
                longPressTimer: null,
                mobileTrashPending: false,
                payload: { type: "tool", entry: entry },
                draggingClass: "tool-btn--dragging"
            };

            clearMobileTrashHideTimer();
            beginMobileTrashTouchPress(btn);
            pointerDrag.longPressTimer = window.setTimeout(function () {
                onMobileLongPressReady();
            }, MOBILE_LONG_PRESS_MS);
            attachMobileTouchDragListeners();
        }, { capture: true, passive: true, signal: signal });

        wrap.addEventListener("contextmenu", blockNativeContextMenu, { capture: true, signal: signal });
        btn.addEventListener("contextmenu", blockNativeContextMenu, { capture: true, signal: signal });

        wrap.addEventListener("pointerdown", function (e) {
            if (pointerDrag && pointerDrag.touchGesture &&
                (pointerDrag.longPressArmed || pointerDrag.active)) {
                e.preventDefault();
                e.stopImmediatePropagation();
            }
        }, { capture: true, signal: signal });

        btn.addEventListener("click", function (e) {
            if (btn.dataset.gadlySuppressClick === "1" ||
                btn.dataset.gadlyDidDrag === "1") {
                e.preventDefault();
                e.stopPropagation();
            }
        }, { capture: true, signal: signal });
    }

    function setupDesktopDragSources(signal) {
        document.querySelectorAll(".homepage a.tool-btn").forEach(function (btn) {
            if (!isToolDragSource(btn)) return;

            bindPointerDragSource(btn, {
                signal: signal,
                draggingClass: "tool-btn--dragging",
                clickGuardEl: btn,
                clickGuardCapture: true,
                getPayload: function (visualEl) {
                    var entry = getToolEntryFromBtn(visualEl);
                    return entry ? { type: "tool", entry: entry } : null;
                }
            });
        });

        document.querySelectorAll(".homepage .category-btn").forEach(function (btn) {
            bindPointerDragSource(btn, {
                signal: signal,
                draggingClass: "category-btn--dragging",
                clickGuardEl: btn,
                clickGuardCapture: true,
                getPayload: function () {
                    var section = btn.closest(".tool-section");
                    if (!section) return null;
                    var entries = getCategoryEntries(section).filter(function (entry) {
                        return !window.gadlyHiddenTools.isHidden(entry.url);
                    });
                    return entries.length ? { type: "category", entries: entries } : null;
                }
            });
        });
    }

    function setupMobileDragSources(signal) {
        document.querySelectorAll(".homepage .tool-btn-wrap").forEach(function (wrap) {
            var btn = wrap.querySelector("a.tool-btn");
            if (!btn || !isToolDragSource(btn)) return;

            bindMobileToolTouchDrag(wrap, btn, signal);
        });

        document.querySelectorAll(".homepage .category-btn").forEach(function (btn) {
            bindMobileCategoryTouchDrag(btn, signal);
        });
    }

    function setupDragSources() {
        document.querySelectorAll(
            ".homepage a.tool-btn, .homepage .category-btn, .homepage .tool-btn-wrap"
        ).forEach(function (el) {
            el.removeAttribute("draggable");
            el.classList.remove("gadly-trash-draggable");
        });

        if (homeTrashDragAbort) {
            homeTrashDragAbort.abort();
        }
        homeTrashDragAbort = new AbortController();
        var signal = homeTrashDragAbort.signal;

        if (isMobileTrashHome()) {
            setupMobileDragSources(signal);
        } else {
            setupDesktopDragSources(signal);
        }
    }

    function setupDropTarget() {
        /* Drop gestito via pointer drag — niente HTML5 DnD (cursore Windows stabile). */
    }

    function onboardingKey() {
        return ONBOARD_KEY + (window.GADLY_USER_STORAGE_KEY || "anon");
    }

    function whenScrollRestoreDone(fn) {
        if (typeof window.gadlyWhenScrollRestoreDone === "function") {
            window.gadlyWhenScrollRestoreDone(fn);
            return;
        }
        fn();
    }

    function hideOnboardingUi() {
        var panel = document.getElementById("home-trash-onboarding");
        var slot = document.getElementById("gadly-trash-onboarding-slot");
        var bin = document.getElementById("desktop-trash-bin");
        document.documentElement.classList.remove("gadly-trash-onboarding-show");
        document.documentElement.classList.remove("gadly-trash-onboarding-paint-ready");
        if (slot) {
            slot.setAttribute("aria-hidden", "true");
        }
        if (panel) {
            panel.setAttribute("hidden", "hidden");
            panel.setAttribute("aria-hidden", "true");
            panel.classList.remove("home-trash-onboarding--visible");
            delete panel.dataset.gadlyOnboardingRevealed;
        }
        if (slot) {
            delete slot.dataset.gadlyOnboardingRevealed;
        }
        if (bin) bin.classList.remove("desktop-trash-bin--hint");
        hideMobileTrashIfIdle();
    }

    function setupOnboarding() {
        if (!isTrashHome() || isMobileTrashHome()) {
            hideOnboardingUi();
            return;
        }
        try {
            if (localStorage.getItem(onboardingKey()) === "1") return;
        } catch (e) {
            return;
        }
        if (document.documentElement.classList.contains("gadly-home-trash-onboarding-dismissed")) {
            return;
        }
        var panel = document.getElementById("home-trash-onboarding");
        if (!panel) return;
        if (panel.dataset.gadlyOnboardingBound === "1") return;
        panel.dataset.gadlyOnboardingBound = "1";

        var bin = document.getElementById("desktop-trash-bin");
        if (isMobileTrashHome()) setMobileTrashVisible(true);

        function dismiss() {
            var slotEl = document.getElementById("gadly-trash-onboarding-slot");
            document.documentElement.classList.remove("gadly-trash-onboarding-show");
            document.documentElement.classList.remove("gadly-trash-onboarding-paint-ready");
            if (slotEl) {
                slotEl.setAttribute("aria-hidden", "true");
                delete slotEl.dataset.gadlyOnboardingRevealed;
            }
            panel.setAttribute("hidden", "hidden");
            panel.setAttribute("aria-hidden", "true");
            panel.classList.remove("home-trash-onboarding--visible");
            delete panel.dataset.gadlyOnboardingRevealed;
            document.documentElement.classList.remove("gadly-home-trash-onboarding-active");
            document.documentElement.classList.add("gadly-home-trash-onboarding-dismissed");
            if (bin) bin.classList.remove("desktop-trash-bin--hint");
            hideMobileTrashIfIdle();
            try {
                localStorage.setItem(onboardingKey(), "1");
            } catch (e2) {}
        }

        var closeBtn = panel.querySelector(".home-trash-onboarding__close");
        var okBtn = panel.querySelector(".home-trash-onboarding__ok");
        if (closeBtn) closeBtn.addEventListener("click", dismiss);
        if (okBtn) okBtn.addEventListener("click", dismiss);
    }

    function bootTrashDrag() {
        if (!isTrashHome() || !window.gadlyHiddenTools) return false;
        setupDragSources();
        setupDropTarget();
        setupUndoToast();
        return true;
    }

    function init() {
        if (!isTrashHome()) return;
        setupDesktopClickSuppress();
        document.addEventListener("gadly-trash-onboarding-mounted", setupOnboarding, { once: true });
        setupOnboarding();
        if (!bootTrashDrag()) {
            window.setTimeout(function () {
                bootTrashDrag();
            }, 0);
        }
    }

    window.__gadlySetupTrashDragSources = setupDragSources;

    if (document.readyState === "loading") {
        document.addEventListener("DOMContentLoaded", init);
    } else {
        init();
    }

    document.addEventListener("gadly-home-hidden-tools-ready", function () {
        bootTrashDrag();
    });

    window.addEventListener("resize", function () {
        if (!isTrashHome()) {
            hideOnboardingUi();
            return;
        }
        if (isMobileTrashHome()) {
            hideOnboardingUi();
            document.documentElement.classList.remove("gadly-home-trash-onboarding-active");
            resetMobileTrashLayoutCache();
            pinMobileTrashPosition();
        } else {
            resetDesktopTrashAfterViewportChange();
        }
        setupDragSources();
    });

    window.__gadlyResetDesktopTrashAfterViewportChange = resetDesktopTrashAfterViewportChange;
})();
