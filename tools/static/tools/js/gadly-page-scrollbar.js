(function () {
    var DESKTOP_MQ = "(min-width: 769px)";
    var bar = document.getElementById("gadly-page-scrollbar");
    if (!bar) return;

    var track = bar.querySelector(".gadly-page-scrollbar__track");
    var thumb = bar.querySelector(".gadly-page-scrollbar__thumb");
    if (!track || !thumb) return;

    var mq = window.matchMedia(DESKTOP_MQ);
    var dragging = false;
    var dragStartY = 0;
    var dragStartScroll = 0;
    var rafId = 0;

    function isDesktop() {
        return mq.matches;
    }

    function isHomePage() {
        return document.body && document.body.classList.contains("homepage");
    }

    function scrollMetrics() {
        var root = document.documentElement;
        var body = document.body;
        var scrollHeight = Math.max(
            root.scrollHeight,
            body ? body.scrollHeight : 0
        );
        var viewport = window.innerHeight;
        var maxScroll = Math.max(0, scrollHeight - viewport);
        var scrollY = Math.max(0, window.scrollY || root.scrollTop || 0);
        return {
            scrollHeight: scrollHeight,
            viewport: viewport,
            maxScroll: maxScroll,
            scrollY: scrollY
        };
    }

    function updateBar() {
        if (!isDesktop()) {
            bar.classList.add("is-hidden");
            /* Evita che height inline del thumb resti nel flusso su mobile. */
            thumb.style.height = "";
            thumb.style.transform = "";
            return;
        }

        var metrics = scrollMetrics();
        if (metrics.maxScroll < 1 && !isHomePage()) {
            bar.classList.add("is-hidden");
            return;
        }

        if (metrics.maxScroll < 1 && isHomePage()) {
            bar.classList.remove("is-hidden");
            thumb.style.height = "32px";
            thumb.style.transform = "translateY(0px)";
            return;
        }

        bar.classList.remove("is-hidden");
        var trackHeight = track.clientHeight;
        if (trackHeight < 1) return;

        var thumbHeight = Math.max(32, Math.round((metrics.viewport / metrics.scrollHeight) * trackHeight));
        var maxThumbTop = Math.max(0, trackHeight - thumbHeight);
        var thumbTop = metrics.maxScroll > 0
            ? (metrics.scrollY / metrics.maxScroll) * maxThumbTop
            : 0;

        thumb.style.height = thumbHeight + "px";
        thumb.style.transform = "translateY(" + thumbTop + "px)";
    }

    function scheduleUpdate() {
        if (rafId) return;
        rafId = requestAnimationFrame(function () {
            rafId = 0;
            updateBar();
        });
    }

    function scrollToRatio(ratio) {
        var metrics = scrollMetrics();
        if (metrics.maxScroll < 1) return;
        window.scrollTo(0, Math.max(0, Math.min(1, ratio)) * metrics.maxScroll);
    }

    thumb.addEventListener("pointerdown", function (event) {
        if (!isDesktop()) return;
        event.preventDefault();
        dragging = true;
        dragStartY = event.clientY;
        dragStartScroll = window.scrollY || 0;
        thumb.setPointerCapture(event.pointerId);
    });

    thumb.addEventListener("pointermove", function (event) {
        if (!dragging) return;
        event.preventDefault();
        var trackHeight = track.clientHeight;
        var thumbHeight = thumb.offsetHeight;
        var maxThumbTravel = Math.max(1, trackHeight - thumbHeight);
        var metrics = scrollMetrics();
        if (metrics.maxScroll < 1) return;
        var deltaY = event.clientY - dragStartY;
        window.scrollTo(0, Math.max(0, Math.min(
            metrics.maxScroll,
            dragStartScroll + (deltaY / maxThumbTravel) * metrics.maxScroll
        )));
    });

    function endDrag(event) {
        if (!dragging) return;
        dragging = false;
        try { thumb.releasePointerCapture(event.pointerId); } catch (e) { /* ignore */ }
    }

    thumb.addEventListener("pointerup", endDrag);
    thumb.addEventListener("pointercancel", endDrag);

    track.addEventListener("pointerdown", function (event) {
        if (!isDesktop() || event.target === thumb) return;
        var rect = track.getBoundingClientRect();
        if (rect.height < 1) return;
        scrollToRatio((event.clientY - rect.top) / rect.height);
    });

    window.addEventListener("scroll", scheduleUpdate, { passive: true });
    window.addEventListener("resize", scheduleUpdate, { passive: true });
    window.addEventListener("load", scheduleUpdate, { once: true });

    if (typeof mq.addEventListener === "function") {
        mq.addEventListener("change", scheduleUpdate);
    } else if (typeof mq.addListener === "function") {
        mq.addListener(scheduleUpdate);
    }

    if (window.ResizeObserver) {
        try {
            var ro = new ResizeObserver(scheduleUpdate);
            ro.observe(document.documentElement);
            if (document.body) ro.observe(document.body);
        } catch (eRo) { /* ignore */ }
    }

    scheduleUpdate();
})();
