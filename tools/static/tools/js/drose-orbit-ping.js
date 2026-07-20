(function () {
    var HEADER_SPIN_MS = 10000;
    var HERO_DURATION_MS = 2800;
    var LOOK_BR_X = 20;
    var LOOK_BR_Y = 18;
    var LOOK_GHOST_X = -16;
    var LOOK_GHOST_Y = -14;

    var reducedMotion = false;
    try {
        reducedMotion = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    } catch (e) { /* ignore */ }

    function orbitDistance(angleRad) {
        var dx = 198 * Math.cos(angleRad);
        var dy = 118 * Math.sin(angleRad);
        return Math.hypot(dx, dy);
    }

    function worldY(angleRad) {
        var dx = 198 * Math.cos(angleRad);
        var dy = 118 * Math.sin(angleRad);
        return 256 + dx * Math.sin(24 * Math.PI / 180) + dy * Math.cos(24 * Math.PI / 180);
    }

    function isPingBehindSphere(angleRad) {
        if (worldY(angleRad) >= 256) {
            return false;
        }
        return orbitDistance(angleRad) <= 170;
    }

    function setPingAtAngle(posGroup, angleRad) {
        var cx = 256 + 198 * Math.cos(angleRad);
        var cy = 256 + 118 * Math.sin(angleRad);
        posGroup.setAttribute("transform", "translate(" + cx + " " + cy + ")");
        posGroup.setAttribute("opacity", isPingBehindSphere(angleRad) ? "0" : "1");
    }

    function headerOrbitAngle() {
        return ((Date.now() % HEADER_SPIN_MS) / HEADER_SPIN_MS) * Math.PI * 2;
    }

    function syncHeaderLogoOrbit(logo) {
        var posGroups = logo.querySelectorAll(".drose-orbit-ping__pos");
        if (!posGroups.length) {
            return false;
        }

        var angle = headerOrbitAngle();
        posGroups.forEach(function (posGroup) {
            setPingAtAngle(posGroup, angle);
        });
        logo.classList.add("is-orbit-synced");
        return true;
    }

    function initHeaderOrbitPing() {
        document.querySelectorAll(".header-logo--drose").forEach(function (logo) {
            if (!syncHeaderLogoOrbit(logo) || reducedMotion) {
                return;
            }

            function frame() {
                var angle = headerOrbitAngle();
                logo.querySelectorAll(".drose-orbit-ping__pos").forEach(function (posGroup) {
                    setPingAtAngle(posGroup, angle);
                });
                requestAnimationFrame(frame);
            }

            requestAnimationFrame(frame);
        });
    }

    function easeInOut(t) {
        return t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2;
    }

    function revealFromLook(lookX, lookY) {
        var toBrX = LOOK_BR_X - lookX;
        var toBrY = LOOK_BR_Y - lookY;
        var distBr = Math.hypot(toBrX, toBrY) || 1;
        var maxDist = Math.hypot(LOOK_BR_X - LOOK_GHOST_X, LOOK_BR_Y - LOOK_GHOST_Y) || 1;
        var t = 1 - Math.min(distBr / maxDist, 1);
        return Math.max(0, Math.min(1, t));
    }

    function lookAt(progress) {
        var gotoEnd = 0.16;
        var holdEnd = 0.78;

        if (progress <= gotoEnd) {
            var u = easeInOut(progress / gotoEnd);
            return {
                x: LOOK_BR_X * u,
                y: LOOK_BR_Y * u
            };
        }

        if (progress <= holdEnd) {
            return { x: LOOK_BR_X, y: LOOK_BR_Y };
        }

        var u = easeInOut((progress - holdEnd) / (1 - holdEnd));
        return {
            x: LOOK_BR_X * (1 - u) + LOOK_GHOST_X * u,
            y: LOOK_BR_Y * (1 - u) + LOOK_GHOST_Y * u
        };
    }

    function initHeroLensFocus() {
        var logo = document.querySelector(".drose-hero__logo");
        if (!logo || reducedMotion) {
            return;
        }

        var hit = logo.querySelector(".drose-hero__logo-hit");
        if (!hit) {
            return;
        }

        var LENS_ANIM_MS = 2000;
        var REVERT_AFTER_MS = 350;
        var UNFOCUS_FADE_MS = 600;
        var STARS_AFTER_LENS_MS = 3000;
        var STARS_SOFT_STOP_MS = 900;
        var holdTimer = null;
        var starsStopTimer = null;
        var pendingRevert = false;
        var lensAnimDone = false;

        var focusedGroup = logo.querySelector(".drose-lens-focused");
        var heroStars = logo.querySelectorAll(".drose-hex-stars .drose-star");

        function clearStarsInlineStyles() {
            heroStars.forEach(function (star) {
                star.style.removeProperty("opacity");
                star.style.removeProperty("transform");
                star.style.removeProperty("filter");
                star.style.removeProperty("transition");
            });
        }

        function clearStarsStopTimer() {
            if (starsStopTimer) {
                window.clearTimeout(starsStopTimer);
                starsStopTimer = null;
            }
        }

        function cancelStarsSoftStop() {
            clearStarsStopTimer();
            logo.classList.remove("is-stars-soft-stop");
            clearStarsInlineStyles();
        }

        function scheduleStarsStopAfterLens() {
            clearStarsStopTimer();
            if (!logo.classList.contains("is-stars-twinkling")) {
                return;
            }
            starsStopTimer = window.setTimeout(beginStarsSoftStop, STARS_AFTER_LENS_MS);
        }

        function beginStarsSoftStop() {
            if (!logo.classList.contains("is-stars-twinkling") && !logo.classList.contains("is-stars-soft-stop")) {
                return;
            }

            cancelStarsSoftStop();
            logo.classList.remove("is-stars-twinkling");
            logo.classList.add("is-stars-soft-stop");

            heroStars.forEach(function (star) {
                var computed = window.getComputedStyle(star);
                star.style.opacity = computed.opacity;
                star.style.transform = computed.transform;
                star.style.filter = computed.filter;
            });

            window.requestAnimationFrame(function () {
                window.requestAnimationFrame(function () {
                    heroStars.forEach(function (star) {
                        star.style.transition = "opacity " + (STARS_SOFT_STOP_MS / 1000) + "s ease-out, transform " + (STARS_SOFT_STOP_MS / 1000) + "s ease-out, filter " + (STARS_SOFT_STOP_MS / 1000) + "s ease-out";
                        star.style.opacity = "0.55";
                        star.style.transform = "scale(0.9)";
                        star.style.filter = "none";
                    });
                });
            });

            starsStopTimer = window.setTimeout(function () {
                logo.classList.remove("is-stars-soft-stop");
                clearStarsInlineStyles();
                starsStopTimer = null;
            }, STARS_SOFT_STOP_MS + 40);
        }

        function clearLensFocusInlineStyles() {
            if (focusedGroup) {
                focusedGroup.style.removeProperty("animation");
                focusedGroup.style.removeProperty("transform");
            }
            logo.querySelectorAll(".drose-lens-focus-ring").forEach(function (ring) {
                ring.style.removeProperty("animation");
                ring.style.removeProperty("transform");
                ring.style.removeProperty("opacity");
            });
        }

        function clearAllTimers() {
            if (holdTimer) {
                window.clearTimeout(holdTimer);
                holdTimer = null;
            }
        }

        function finishUnfocus() {
            pendingRevert = false;
            logo.classList.remove("is-lens-focused", "is-lens-unfocusing");
            clearLensFocusInlineStyles();
            lensAnimDone = false;
            holdTimer = null;
            scheduleStarsStopAfterLens();
        }

        function beginUnfocus() {
            if (!logo.classList.contains("is-lens-focused")) {
                return;
            }
            clearLensFocusInlineStyles();
            logo.classList.add("is-lens-unfocusing");
            clearAllTimers();
            holdTimer = window.setTimeout(finishUnfocus, UNFOCUS_FADE_MS);
        }

        function scheduleRevert() {
            clearAllTimers();
            holdTimer = window.setTimeout(beginUnfocus, REVERT_AFTER_MS);
        }

        function startLensFocus() {
            pendingRevert = false;
            lensAnimDone = false;
            cancelStarsSoftStop();
            logo.classList.remove("is-lens-focused", "is-lens-unfocusing");
            clearLensFocusInlineStyles();
            void logo.offsetWidth;
            logo.classList.add("is-lens-focused", "is-stars-twinkling");
        }

        function requestRevertAfterAnim() {
            pendingRevert = true;
            clearAllTimers();
            if (lensAnimDone) {
                scheduleRevert();
                return;
            }
            holdTimer = window.setTimeout(function () {
                if (pendingRevert) {
                    lensAnimDone = true;
                    scheduleRevert();
                }
            }, LENS_ANIM_MS + 80);
        }

        if (focusedGroup) {
            focusedGroup.addEventListener("animationend", function (e) {
                if (e.animationName !== "drose-lens-focus-turn") {
                    return;
                }
                lensAnimDone = true;
                if (pendingRevert) {
                    scheduleRevert();
                }
            });
        }

        hit.addEventListener("mouseenter", function () {
            clearAllTimers();
            pendingRevert = false;
            cancelStarsSoftStop();
            logo.classList.add("is-stars-twinkling");
            if (logo.classList.contains("is-lens-unfocusing")) {
                logo.classList.remove("is-lens-unfocusing");
                return;
            }
            if (!logo.classList.contains("is-lens-focused")) {
                startLensFocus();
            }
        });

        hit.addEventListener("mouseleave", function () {
            if (logo.classList.contains("is-lens-focused") || logo.classList.contains("is-lens-unfocusing")) {
                requestRevertAfterAnim();
                return;
            }
            if (logo.classList.contains("is-stars-twinkling")) {
                scheduleStarsStopAfterLens();
            }
        });
    }

    function boot() {
        initHeaderOrbitPing();
        initHeroLensFocus();
    }

    if (document.readyState === "loading") {
        document.addEventListener("DOMContentLoaded", boot);
    } else {
        boot();
    }
})();
