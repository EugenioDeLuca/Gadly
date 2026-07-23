(function () {
    'use strict';

    var DESKTOP = window.matchMedia('(min-width: 769px)');
    var REDUCED = window.matchMedia('(prefers-reduced-motion: reduce)');

    function init() {
        var entry = document.querySelector('.drose-float-entry');
        if (!entry) {
            return;
        }

        var propellers = entry.querySelectorAll('.drose-propeller-spin');
        var hitArea = entry.querySelector('.drose-icon-hit');
        if (!propellers.length || !hitArea) {
            return;
        }

        var FULL_SPEED = 360 / 0.11;
        var CRUISE_MS = 750;
        var DECEL_LAMBDA = 7.2;
        var STOP_SPEED = 30;
        var STORAGE_KEY = 'drosePropellerAngle';
        var STORAGE_PHASE_KEY = 'drosePropellerPhase';
        var STORAGE_SPEED_KEY = 'drosePropellerSpeed';
        var STORAGE_CRUISE_END_KEY = 'drosePropellerCruiseEnd';
        var LAYOUT_LEFT_KEY = 'droseFloatLeftV1';

        var angle = 0;
        var speed = 0;
        var phase = 'idle';
        var rafId = 0;
        var lastTs = 0;
        var cruiseTimer = 0;
        var cruiseEndAt = 0;
        var cruiseStartedAt = 0;
        var startedThisHover = false;
        var hoverResetTimer = 0;
        var HOVER_LEAVE_DELAY_MS = 180;
        var LABEL_HOLD_MS = 650;
        var isHoveringDrone = false;
        var blockSpinUntilLeave = false;
        var labelHoldTimer = 0;

        function syncPointerOverWithoutSpin() {
            if (!DESKTOP.matches || REDUCED.matches) {
                return;
            }
            if (!hitArea.matches(':hover')) {
                return;
            }
            blockSpinUntilLeave = true;
            isHoveringDrone = true;
            startedThisHover = true;
            setDroneHover(true);
        }

        function direction(el) {
            return el.classList.contains('drose-propeller-spin--ccw') ? -1 : 1;
        }

        function applyTransform() {
            propellers.forEach(function (el) {
                el.style.transform = 'rotate(' + (angle * direction(el)) + 'deg)';
            });
        }

        function saveSpinState() {
            try {
                sessionStorage.setItem(STORAGE_KEY, String(angle));
                if (phase === 'idle') {
                    sessionStorage.removeItem(STORAGE_PHASE_KEY);
                    sessionStorage.removeItem(STORAGE_SPEED_KEY);
                    sessionStorage.removeItem(STORAGE_CRUISE_END_KEY);
                    return;
                }
                sessionStorage.setItem(STORAGE_PHASE_KEY, phase);
                sessionStorage.setItem(STORAGE_SPEED_KEY, String(speed));
                if (phase === 'cruise' && cruiseEndAt > 0) {
                    sessionStorage.setItem(STORAGE_CRUISE_END_KEY, String(cruiseEndAt));
                } else {
                    sessionStorage.removeItem(STORAGE_CRUISE_END_KEY);
                }
            } catch (e) {
                /* ignore */
            }
        }

        function loadAngle() {
            try {
                var saved = sessionStorage.getItem(STORAGE_KEY);
                if (saved === null) {
                    return;
                }
                var parsed = parseFloat(saved);
                if (!isNaN(parsed)) {
                    angle = ((parsed % 360) + 360) % 360;
                    applyTransform();
                }
            } catch (e) {
                /* ignore */
            }
        }

        function abortSpinInstant() {
            stopLoop();
            cancelCruiseTimer();
            cancelLabelHold();
            if (hoverResetTimer) {
                window.clearTimeout(hoverResetTimer);
                hoverResetTimer = 0;
            }
            phase = 'idle';
            speed = 0;
            lastTs = 0;
            cruiseEndAt = 0;
            isHoveringDrone = false;
            startedThisHover = false;
            blockSpinUntilLeave = false;
            setDroneHover(false);
            setDroneLabelVisible(false);
            angle = ((angle % 360) + 360) % 360;
            applyTransform();
            saveSpinState();
        }

        function beginDecel() {
            if (phase === 'idle') {
                return;
            }
            phase = 'decel';
            if (speed < FULL_SPEED * 0.5) {
                speed = FULL_SPEED;
            }
            cancelCruiseTimer();
            saveSpinState();
        }

        function cancelCruiseTimer() {
            if (cruiseTimer) {
                window.clearTimeout(cruiseTimer);
                cruiseTimer = 0;
            }
            cruiseEndAt = 0;
        }

        function schedulePropSpinEnd() {
            cancelCruiseTimer();
            cruiseEndAt = Date.now() + CRUISE_MS;
            cruiseTimer = window.setTimeout(beginDecel, CRUISE_MS);
        }

        function stopLoop() {
            if (rafId) {
                window.cancelAnimationFrame(rafId);
                rafId = 0;
            }
        }

        function finish() {
            stopLoop();
            phase = 'idle';
            speed = 0;
            lastTs = 0;
            cruiseEndAt = 0;
            angle = ((angle % 360) + 360) % 360;
            applyTransform();
            saveSpinState();
            maybeScheduleLabelHide();
        }

        function tick(ts) {
            if (phase === 'idle') {
                return;
            }
            if (!lastTs) {
                lastTs = ts;
            }
            var dt = Math.min((ts - lastTs) / 1000, 0.05);
            lastTs = ts;

            if (phase === 'cruise') {
                speed = FULL_SPEED;
            } else if (phase === 'decel') {
                speed *= Math.exp(-DECEL_LAMBDA * dt);
                if (speed <= STOP_SPEED) {
                    finish();
                    return;
                }
            }

            angle += speed * dt;
            applyTransform();
            rafId = window.requestAnimationFrame(tick);
        }

        function startCruise() {
            stopLoop();
            lastTs = 0;
            phase = 'cruise';
            speed = FULL_SPEED;
            cruiseStartedAt = Date.now();
            schedulePropSpinEnd();
            saveSpinState();
            setDroneLabelVisible(true);
            rafId = window.requestAnimationFrame(tick);
        }

        function setDroneHover(on) {
            entry.classList.toggle('is-drone-hover', on);
        }

        function cancelLabelHold() {
            if (labelHoldTimer) {
                window.clearTimeout(labelHoldTimer);
                labelHoldTimer = 0;
            }
        }

        function setDroneLabelVisible(on) {
            if (on) {
                cancelLabelHold();
            }
            entry.classList.toggle('is-drone-label-visible', on);
        }

        function scheduleLabelHide() {
            cancelLabelHold();
            labelHoldTimer = window.setTimeout(function () {
                labelHoldTimer = 0;
                entry.classList.remove('is-drone-label-visible');
            }, LABEL_HOLD_MS);
        }

        function maybeScheduleLabelHide() {
            if (isHoveringDrone) {
                return;
            }
            scheduleLabelHide();
        }

        hitArea.addEventListener('pointerenter', function () {
            if (!DESKTOP.matches || REDUCED.matches) {
                return;
            }
            if (hoverResetTimer) {
                window.clearTimeout(hoverResetTimer);
                hoverResetTimer = 0;
            }
            if (blockSpinUntilLeave) {
                isHoveringDrone = true;
                setDroneHover(true);
                setDroneLabelVisible(true);
                return;
            }
            if (isHoveringDrone) {
                setDroneLabelVisible(true);
                return;
            }
            isHoveringDrone = true;
            setDroneHover(true);
            if (!startedThisHover) {
                startedThisHover = true;
                startCruise();
            }
        });

        hitArea.addEventListener('pointerleave', function () {
            if (!DESKTOP.matches || REDUCED.matches) {
                return;
            }
            if (hoverResetTimer) {
                window.clearTimeout(hoverResetTimer);
            }
            hoverResetTimer = window.setTimeout(function () {
                // Conferma uscita reale prima di decelerare/resettare.
                blockSpinUntilLeave = false;
                isHoveringDrone = false;
                startedThisHover = false;
                setDroneHover(false);
                if (phase === 'cruise') {
                    beginDecel();
                } else if (phase === 'idle') {
                    maybeScheduleLabelHide();
                }
                hoverResetTimer = 0;
            }, HOVER_LEAVE_DELAY_MS);
        });

        entry.addEventListener('click', function () {
            /* Navigazione verso Drose: non avviare il fade della label (resterebbe
               mezza trasparente nel frame congelato del page swap). */
            cancelLabelHold();
            setDroneLabelVisible(true);
            entry.classList.add('is-drone-navigating');
            if (phase !== 'idle') {
                stopLoop();
                cancelCruiseTimer();
                phase = 'idle';
                speed = 0;
                lastTs = 0;
                cruiseEndAt = 0;
                startedThisHover = false;
                blockSpinUntilLeave = true;
                angle = ((angle % 360) + 360) % 360;
                applyTransform();
                saveSpinState();
            }
        });

        window.addEventListener('pagehide', function () {
            saveLayoutLeft();
            if (phase !== 'idle') {
                stopLoop();
                cancelCruiseTimer();
                phase = 'idle';
                speed = 0;
                lastTs = 0;
                cruiseEndAt = 0;
                angle = ((angle % 360) + 360) % 360;
                applyTransform();
                saveSpinState();
                return;
            }
            saveSpinState();
        });
        window.addEventListener('beforeunload', saveLayoutLeft);
        document.addEventListener('visibilitychange', function () {
            if (document.visibilityState === 'hidden' && phase === 'idle') {
                saveSpinState();
            }
        });
        window.addEventListener('pageshow', function (e) {
            if (e.persisted && phase !== 'idle') {
                abortSpinInstant();
            }
        });

        var LAYOUT_GAP = 24;
        var VIEWPORT_PAD = 8;
        var LAYOUT_RESIZE_SETTLE_MS = 180;
        var layoutResizeTimer = 0;
        var resizeRafId = 0;
        var isResizingLayout = false;
        var lockedDroneSide = null;
        var pendingInitialReveal = true;
        var revealRafId = 0;
        var lastStableLeft = null;
        var stableFrameCount = 0;
        var REVEAL_STABLE_FRAMES = 4;
        var NO_SPACE_STABLE_FRAMES = 4;
        var revealCommitted = false;
        var revealGraceUntil = 0;
        var revealHideLockUntil = 0;
        var hideNullFrameCount = 0;
        var noSpaceFrameCount = 0;

        function getViewportWidth() {
            var vv = window.visualViewport;
            return vv && vv.width ? Math.round(vv.width) : window.innerWidth;
        }

        function overlapsContainer(left, droneWidth, containerRect) {
            return left + droneWidth > containerRect.left && left < containerRect.right;
        }

        function saveLayoutLeft() {
            try {
                if (entry.style.left) {
                    sessionStorage.setItem(LAYOUT_LEFT_KEY, entry.style.left);
                }
            } catch (eLayout) {
                /* ignore */
            }
        }

        function getDroneSide() {
            var root = document.documentElement;
            if (root.classList.contains('gadly-qn-anchor-left') || document.body.classList.contains('gadly-qn-anchor-left')) {
                lockedDroneSide = 'right';
                return 'right';
            }
            if (root.classList.contains('gadly-qn-anchor-right') || document.body.classList.contains('gadly-qn-anchor-right')) {
                lockedDroneSide = 'left';
                return 'left';
            }
            if (lockedDroneSide === 'left' || lockedDroneSide === 'right') {
                return lockedDroneSide;
            }
            lockedDroneSide = 'left';
            return lockedDroneSide;
        }

        var LABEL_COLOR_LIGHT = [180, 83, 9];
        var LABEL_COLOR_DARK = [251, 191, 36];
        var LABEL_SCROLL_FADE_START = 0.42;
        var LABEL_SCROLL_FADE_END = 0.92;

        function mixLabelColor(progress) {
            var t = Math.max(0, Math.min(1, progress));
            var r = Math.round(LABEL_COLOR_LIGHT[0] + (LABEL_COLOR_DARK[0] - LABEL_COLOR_LIGHT[0]) * t);
            var g = Math.round(LABEL_COLOR_LIGHT[1] + (LABEL_COLOR_DARK[1] - LABEL_COLOR_LIGHT[1]) * t);
            var b = Math.round(LABEL_COLOR_LIGHT[2] + (LABEL_COLOR_DARK[2] - LABEL_COLOR_LIGHT[2]) * t);
            return 'rgb(' + r + ', ' + g + ', ' + b + ')';
        }

        function getLabelDarkProgress() {
            if (!DESKTOP.matches || getDroneSide() !== 'right') {
                return 0;
            }
            var maxScroll = Math.max(0, document.documentElement.scrollHeight - window.innerHeight);
            if (maxScroll < 120) {
                return 0;
            }
            var scrolled = window.scrollY;
            var start = maxScroll * LABEL_SCROLL_FADE_START;
            var end = maxScroll * LABEL_SCROLL_FADE_END;
            if (scrolled <= start) {
                return 0;
            }
            if (scrolled >= end) {
                return 1;
            }
            return (scrolled - start) / (end - start);
        }

        function syncLabelDarkBg() {
            if (document.body.classList.contains('dark-mode')) {
                entry.style.removeProperty('--drose-label-color');
                return;
            }
            entry.style.setProperty('--drose-label-color', mixLabelColor(getLabelDarkProgress()));
        }

        function getMainContainer() {
            return document.querySelector('.site-main .container');
        }

        function isRevealGraceActive() {
            return revealCommitted && Date.now() < revealGraceUntil;
        }

        function computeTargetLeft() {
            if (!DESKTOP.matches) {
                return null;
            }

            var droneWidth = entry.offsetWidth || 168;
            var viewportWidth = getViewportWidth();

            var container = getMainContainer();
            if (!container) {
                return null;
            }

            var rect = container.getBoundingClientRect();
            if (!rect.width || !rect.height) {
                return null;
            }
            var side = getDroneSide();
            var minLeft = VIEWPORT_PAD;
            var maxLeft = viewportWidth - droneWidth - VIEWPORT_PAD;
            var targetLeft = side === 'right'
                ? Math.round(rect.right + LAYOUT_GAP)
                : Math.round(rect.left - LAYOUT_GAP - droneWidth);

            targetLeft = Math.max(minLeft, Math.min(maxLeft, targetLeft));

            if (overlapsContainer(targetLeft, droneWidth, rect)) {
                return null;
            }
            if (targetLeft < minLeft || targetLeft > maxLeft) {
                return null;
            }
            return targetLeft;
        }

        function isLayoutMeasureReady() {
            return typeof window.__gadlyQnPlacedW === 'number';
        }

        function isRevealHideLocked() {
            return revealHideLockUntil > 0 && Date.now() < revealHideLockUntil;
        }

        function applyLayoutPosition(left, opts) {
            opts = opts || {};
            if (left === null) {
                if (!opts.allowHide || isRevealHideLocked()) {
                    return;
                }
                if (isRevealGraceActive()) {
                    hideNullFrameCount += 1;
                    if (hideNullFrameCount < 12) {
                        return;
                    }
                }
                hideNullFrameCount = 0;
                entry.classList.add('is-layout-hidden');
                return;
            }
            hideNullFrameCount = 0;
            entry.style.transition = 'none';
            entry.style.left = left + 'px';
            entry.style.right = 'auto';
            void entry.offsetHeight;
            entry.style.transition = '';
            if (!pendingInitialReveal && opts.allowShow !== false) {
                entry.classList.remove('is-layout-hidden');
            }
            syncLabelDarkBg();
        }

        function markLayoutPending() {
            document.documentElement.classList.add('drose-layout-pending');
        }

        function commitLayoutReveal(left) {
            pendingInitialReveal = false;
            revealCommitted = true;
            revealGraceUntil = Date.now() + 2000;
            syncPointerOverWithoutSpin();

            if (left === null) {
                revealHideLockUntil = 0;
                entry.classList.add('is-layout-hidden');
                entry.style.removeProperty('display');
                document.documentElement.classList.remove('drose-layout-ready');
            } else {
                applyLayoutPosition(left, { allowShow: false });
                entry.classList.remove('is-layout-hidden');
                entry.style.removeProperty('display');
                document.documentElement.classList.add('drose-layout-ready');
                revealHideLockUntil = Date.now() + 3000;
            }
            document.documentElement.classList.remove('drose-layout-pending');
            void entry.offsetHeight;
        }

        function primeQuickNavLayout() {
            if (typeof window.__gadlyPlaceQuickNav === 'function') {
                window.__gadlyPlaceQuickNav();
            }
        }

        function tryRevealWhenStable() {
            if (!pendingInitialReveal) {
                revealRafId = 0;
                return;
            }

            if (!isLayoutMeasureReady()) {
                primeQuickNavLayout();
                revealRafId = window.requestAnimationFrame(tryRevealWhenStable);
                return;
            }

            var left = computeTargetLeft();
            if (left === null) {
                noSpaceFrameCount += 1;
                stableFrameCount = 0;
                lastStableLeft = null;
                if (noSpaceFrameCount >= NO_SPACE_STABLE_FRAMES) {
                    commitLayoutReveal(null);
                    revealRafId = 0;
                    return;
                }
                revealRafId = window.requestAnimationFrame(tryRevealWhenStable);
                return;
            }

            noSpaceFrameCount = 0;
            applyLayoutPosition(left, { allowShow: false });
            if (left === lastStableLeft) {
                stableFrameCount += 1;
            } else {
                stableFrameCount = 1;
                lastStableLeft = left;
            }

            if (stableFrameCount >= REVEAL_STABLE_FRAMES) {
                commitLayoutReveal(left);
                revealRafId = 0;
                return;
            }

            revealRafId = window.requestAnimationFrame(tryRevealWhenStable);
        }

        function scheduleInitialReveal() {
            markLayoutPending();
            stableFrameCount = 0;
            lastStableLeft = null;
            noSpaceFrameCount = 0;
            hideNullFrameCount = 0;
            revealCommitted = false;
            revealGraceUntil = 0;
            revealHideLockUntil = 0;
            pendingInitialReveal = true;
            entry.classList.add('is-layout-hidden');
            entry.style.setProperty('display', 'none', 'important');
            if (revealRafId) {
                window.cancelAnimationFrame(revealRafId);
            }
            window.requestAnimationFrame(function () {
                primeQuickNavLayout();
                window.requestAnimationFrame(function () {
                    primeQuickNavLayout();
                    tryRevealWhenStable();
                });
            });
        }

        function syncLayoutPosition() {
            applyLayoutPosition(computeTargetLeft(), { allowHide: true, allowShow: true });
        }

        function syncLayoutPositionDuringResize() {
            resizeRafId = 0;
            applyLayoutPosition(computeTargetLeft(), { allowHide: true, allowShow: true });
        }

        function settleLayoutAfterResize() {
            isResizingLayout = false;
            entry.classList.remove('is-layout-resizing');
            syncLayoutPosition();
            syncLabelDarkBg();
            layoutResizeTimer = 0;
        }

        function handleLayoutResize() {
            isResizingLayout = true;
            entry.classList.add('is-layout-resizing');
            if (!resizeRafId) {
                resizeRafId = window.requestAnimationFrame(syncLayoutPositionDuringResize);
            }
            if (layoutResizeTimer) {
                window.clearTimeout(layoutResizeTimer);
            }
            layoutResizeTimer = window.setTimeout(settleLayoutAfterResize, LAYOUT_RESIZE_SETTLE_MS);
        }

        window.addEventListener('resize', handleLayoutResize, { passive: true });
        if (window.visualViewport) {
            window.visualViewport.addEventListener('resize', handleLayoutResize, { passive: true });
            window.visualViewport.addEventListener('scroll', handleLayoutResize, { passive: true });
        }

        if (typeof MutationObserver !== 'undefined') {
            var anchorObserver = new MutationObserver(function () {
                if (isRevealGraceActive() || isRevealHideLocked()) {
                    syncLabelDarkBg();
                    return;
                }
                if (!isResizingLayout && !pendingInitialReveal) {
                    syncLayoutPosition();
                }
                syncLabelDarkBg();
            });
            anchorObserver.observe(document.documentElement, { attributes: true, attributeFilter: ['class'] });
            anchorObserver.observe(document.body, { attributes: true, attributeFilter: ['class'] });
        }

        window.addEventListener('scroll', syncLabelDarkBg, { passive: true });
        syncLabelDarkBg();

        DESKTOP.addEventListener('change', function () {
            if (!DESKTOP.matches) {
                entry.style.left = '';
                entry.style.right = '';
                entry.style.setProperty('--drose-label-color', mixLabelColor(0));
                document.documentElement.classList.remove('drose-layout-ready');
                document.documentElement.classList.remove('drose-layout-pending');
                pendingInitialReveal = false;
                return;
            }
            scheduleInitialReveal();
            syncLabelDarkBg();
        });

        scheduleInitialReveal();
        if (entry.classList.contains('is-active')) {
            try {
                sessionStorage.removeItem(STORAGE_PHASE_KEY);
                sessionStorage.removeItem(STORAGE_SPEED_KEY);
                sessionStorage.removeItem(STORAGE_CRUISE_END_KEY);
            } catch (e) {
                /* ignore */
            }
        }
        loadAngle();
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }
})();
