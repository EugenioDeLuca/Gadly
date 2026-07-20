document.addEventListener("DOMContentLoaded", function () {
    var logo = document.querySelector(".drose-hero__logo");
    if (!logo) return;

    var eye = logo.querySelector(".drose-eye-look");
    if (!eye) return;

    var orbitPing = logo.querySelector(".drose-orbit-ping");

    var reducedMotion = false;
    try {
        reducedMotion = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    } catch (e) { /* ignore */ }

    if (reducedMotion) return;

    var running = false;
    var rafId = null;

    var upX = 18;
    var upY = -14;
    var radius = Math.hypot(upX, upY);
    var startAngle = Math.atan2(upY, upX);
    var gotoEnd = 0.14;
    var circleEnd = 0.86;
    var durationMs = 2600;

    function easeInOut(t) {
        return t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2;
    }

    function sampleAt(progress) {
        if (progress <= gotoEnd) {
            var t = easeInOut(progress / gotoEnd);
            return { x: upX * t, y: upY * t };
        }

        if (progress <= circleEnd) {
            var circleT = (progress - gotoEnd) / (circleEnd - gotoEnd);
            var angle = startAngle + circleT * Math.PI * 2;
            return {
                x: radius * Math.cos(angle),
                y: radius * Math.sin(angle)
            };
        }

        var t = easeInOut((progress - circleEnd) / (1 - circleEnd));
        return {
            x: upX * (1 - t),
            y: upY * (1 - t)
        };
    }

    function orbitPingAngle(progress) {
        if (progress <= gotoEnd) {
            return 0;
        }
        if (progress <= circleEnd) {
            var circleT = (progress - gotoEnd) / (circleEnd - gotoEnd);
            return circleT * 360;
        }
        return 0;
    }

    function clearEyeTransform() {
        eye.removeAttribute("transform");
    }

    function clearOrbitPingTransform() {
        if (orbitPing) {
            orbitPing.removeAttribute("transform");
        }
    }

    function runEyeLook() {
        if (running) return;
        running = true;

        var start = null;

        function frame(ts) {
            if (!start) start = ts;
            var progress = Math.min((ts - start) / durationMs, 1);
            var pos = sampleAt(progress);
            eye.setAttribute("transform", "translate(" + pos.x + " " + pos.y + ")");

            if (orbitPing) {
                var pingAngle = orbitPingAngle(progress);
                if (pingAngle === 0) {
                    orbitPing.removeAttribute("transform");
                } else {
                    orbitPing.setAttribute("transform", "rotate(" + pingAngle + " 256 256)");
                }
            }

            if (progress < 1) {
                rafId = requestAnimationFrame(frame);
                return;
            }

            clearEyeTransform();
            clearOrbitPingTransform();
            running = false;
            rafId = null;
        }

        rafId = requestAnimationFrame(frame);
    }

    logo.addEventListener("mouseenter", runEyeLook);
    runEyeLook();
});
