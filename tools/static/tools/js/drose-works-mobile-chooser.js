/**
 * Mobile gallery chooser is only at /drose/works/?choose=1 (home CTA).
 * Plain /drose/works/ stays the public gallery (QR codes, bookmarks, shares).
 * Desktop: ?choose=1 → clear query and show full gallery.
 */
(function () {
    function run() {
        if (!document.body) return;
        if (!document.body.classList.contains("drose-works-page")) return;
        if (document.body.classList.contains("drose-works-manage-page")) return;

        var mobile = window.matchMedia("(max-width: 768px)");
        var path = window.location.pathname;

        if (document.body.classList.contains("drose-works-chooser") && !mobile.matches) {
            window.location.replace(path);
        }
    }

    if (document.body) {
        run();
    } else if (document.readyState === "loading") {
        document.addEventListener("DOMContentLoaded", run, { once: true });
    } else {
        run();
    }
})();
