(function () {
    "use strict";

    var MIN_ZOOM = 1;
    var MAX_ZOOM = 4;
    var ZOOM_STEP = 0.18;
    var STORAGE_KEY = "drose-works-lightbox";

    try {
        sessionStorage.removeItem(STORAGE_KEY);
    } catch (err) { /* ignore */ }

    function init() {
        var lightbox = document.getElementById("drose-works-lightbox");
        if (!lightbox) return;

        if (lightbox.parentElement !== document.body) {
            document.body.appendChild(lightbox);
        }

        var content = lightbox.querySelector(".drose-works-lightbox__content");
        var closeBtn = lightbox.querySelector(".drose-works-lightbox__close");
        var prevBtn = lightbox.querySelector(".drose-works-lightbox__nav--prev");
        var nextBtn = lightbox.querySelector(".drose-works-lightbox__nav--next");
        var rotateHint = lightbox.querySelector(".drose-works-lightbox__rotate-hint");
        var lastFocus = null;
        var activeMedia = null;
        var activeType = null;
        var photoItems = [];
        var photoIndex = -1;

        var photoZoom = 1;
        var photoPanX = 0;
        var photoPanY = 0;
        var dragActive = false;
        var dragMoved = false;
        var dragStartX = 0;
        var dragStartY = 0;
        var dragOriginX = 0;
        var dragOriginY = 0;
        var pinchStartDist = 0;
        var pinchStartZoom = 1;
        var swipeStartX = 0;
        var swipeStartY = 0;
        var swipeTracking = false;
        var lastTriggerOpenTs = 0;
        var photoZoomBound = false;
        var suppressCloseClick = false;
        var suppressCloseClickTimer = null;
        var rotateHintTimer = null;
        var chromeWasForced = false;
        var forcedChromeNodes = [];

        function getPhotoImg() {
            return content.querySelector(".drose-works-lightbox__image");
        }

        function ensurePhotoImg() {
            var img = getPhotoImg();
            if (img) return img;
            img = document.createElement("img");
            img.className = "drose-works-lightbox__image";
            img.decoding = "async";
            img.draggable = false;
            content.appendChild(img);
            return img;
        }

        function applyPhotoTransform() {
            var img = getPhotoImg();
            if (!img) return;
            img.style.transform =
                "translate(" + photoPanX + "px, " + photoPanY + "px) scale(" + photoZoom + ")";
            lightbox.classList.toggle("drose-works-lightbox--zoomed", photoZoom > 1.01);
        }

        function setPanning(active) {
            lightbox.classList.toggle("drose-works-lightbox--panning", !!active);
        }

        function armSuppressCloseClick() {
            suppressCloseClick = true;
            if (suppressCloseClickTimer) {
                clearTimeout(suppressCloseClickTimer);
            }
            /* Il click sintetico arriva subito dopo pointerup: bloccalo per un attimo. */
            suppressCloseClickTimer = setTimeout(function () {
                suppressCloseClick = false;
                suppressCloseClickTimer = null;
            }, 450);
        }

        function shouldKeepLightboxOpenOnClick() {
            if (suppressCloseClick) return true;
            if (dragMoved) return true;
            if (dragActive) return true;
            if (activeType === "photo" && photoZoom > 1.01) return true;
            if (activeType === "photo" && lightbox.classList.contains("drose-works-lightbox--zoomed")) {
                return true;
            }
            return false;
        }

        function resetPhotoZoom() {
            photoZoom = 1;
            photoPanX = 0;
            photoPanY = 0;
            dragActive = false;
            dragMoved = false;
            setPanning(false);
            lightbox.classList.remove("drose-works-lightbox--zoomed");
            var img = getPhotoImg();
            if (img) {
                img.style.transform = "";
            }
        }

        function clampPan() {
            if (photoZoom <= 1.01) {
                photoPanX = 0;
                photoPanY = 0;
                return;
            }
            var img = getPhotoImg();
            if (!img) return;
            var maxX = (img.clientWidth * (photoZoom - 1)) / 2 + 40;
            var maxY = (img.clientHeight * (photoZoom - 1)) / 2 + 40;
            photoPanX = Math.max(-maxX, Math.min(maxX, photoPanX));
            photoPanY = Math.max(-maxY, Math.min(maxY, photoPanY));
        }

        function setPhotoZoom(nextZoom) {
            var img = getPhotoImg();
            if (!img) return;
            photoZoom = Math.max(MIN_ZOOM, Math.min(MAX_ZOOM, nextZoom));
            if (photoZoom <= 1.01) {
                photoZoom = 1;
                photoPanX = 0;
                photoPanY = 0;
            } else {
                clampPan();
            }
            applyPhotoTransform();
        }

        function buildPhotoItems() {
            photoItems = [];
            document.querySelectorAll('.drose-works-open[data-media-type="photo"]').forEach(function (trigger) {
                var src = trigger.getAttribute("data-src");
                if (!src) return;
                photoItems.push({
                    src: src,
                    thumbSrc: trigger.getAttribute("data-thumb-src") || src,
                    caption: trigger.getAttribute("data-caption") || "",
                    trigger: trigger,
                });
            });
        }

        function pauseActiveMedia() {
            if (activeMedia && typeof activeMedia.pause === "function") {
                activeMedia.pause();
            }
            activeMedia = null;
        }

        function lightboxThemeChromeColor() {
            var body = document.body;
            if (!body) return "#0f0f23";
            if (body.classList.contains("dark-mode")) {
                return body.classList.contains("warm-tone") ? "#26201c" : "#0f0f23";
            }
            return "#ffffff";
        }

        function forceFullscreenChrome() {
            var head = document.head || document.getElementsByTagName("head")[0];
            if (!head) return;
            var root = document.documentElement;
            var body = document.body;
            var chromeColor = lightboxThemeChromeColor();
            ["gadly-theme-color", "gadly-theme-color-light", "gadly-theme-color-dark"].forEach(function (id) {
                var meta = document.getElementById(id);
                if (!meta) {
                    meta = document.createElement("meta");
                    meta.id = id;
                    meta.setAttribute("name", "theme-color");
                    head.insertBefore(meta, head.firstChild);
                }
                meta.setAttribute("content", chromeColor);
                meta.removeAttribute("media");
            });
            var apple = document.getElementById("gadly-apple-status-bar") ||
                document.querySelector('meta[name="apple-mobile-web-app-status-bar-style"]');
            if (!apple) {
                apple = document.createElement("meta");
                apple.id = "gadly-apple-status-bar";
                apple.setAttribute("name", "apple-mobile-web-app-status-bar-style");
                head.appendChild(apple);
            }
            apple.setAttribute("content", "black-translucent");
            forcedChromeNodes = [
                root,
                body,
                document.querySelector(".site-header"),
                document.getElementById("header-nav"),
                document.getElementById("cookie-banner"),
                document.getElementById("gadly-viewport-chrome"),
            ].filter(Boolean);
            forcedChromeNodes.forEach(function (node) {
                node.style.setProperty("background", chromeColor, "important");
                node.style.setProperty("background-color", chromeColor, "important");
                node.style.setProperty("background-image", "none", "important");
            });
            root.style.setProperty("color-scheme", body && body.classList.contains("dark-mode") ? "dark" : "light", "important");
            if (body) {
                body.style.setProperty("--bg-header", chromeColor);
                body.style.setProperty("--bg-card", chromeColor);
                body.style.setProperty("--bg-body", chromeColor);
                body.style.setProperty("color-scheme", body.classList.contains("dark-mode") ? "dark" : "light", "important");
            }
            chromeWasForced = true;
        }

        function restoreFullscreenChrome() {
            if (!chromeWasForced) return;
            chromeWasForced = false;
            forcedChromeNodes.forEach(function (node) {
                node.style.removeProperty("background");
                node.style.removeProperty("background-color");
                node.style.removeProperty("background-image");
            });
            forcedChromeNodes = [];
            document.documentElement.style.removeProperty("color-scheme");
            if (document.body) {
                document.body.style.removeProperty("--bg-header");
                document.body.style.removeProperty("--bg-card");
                document.body.style.removeProperty("--bg-body");
                document.body.style.removeProperty("color-scheme");
            }
            /* In landscape l'orient-lock ridipinge subito: non risincronizzare il chrome tema (striscia). */
            var stayLandscape = false;
            try {
                stayLandscape = window.matchMedia(
                    "(orientation: landscape) and (max-height: 1100px) and (max-width: 1024px)"
                ).matches;
            } catch (errLand) { /* ignore */ }
            if (!stayLandscape && typeof window.gadlySyncViewportChrome === "function") {
                window.gadlySyncViewportChrome(
                    !!(document.body && document.body.classList.contains("dark-mode")),
                    { forceResample: true }
                );
            }
        }

        function shouldShowRotateHint() {
            if (!rotateHint || !window.matchMedia) return false;
            if (!document.documentElement.classList.contains("drose-lightbox-allow-rotate")) {
                return false;
            }
            try {
                return window.matchMedia("(pointer: coarse) and (max-width: 1024px)").matches ||
                    window.matchMedia("(orientation: landscape) and (max-height: 1100px) and (max-width: 1024px)").matches;
            } catch (err) {
                return false;
            }
        }

        function hideRotateHint() {
            if (rotateHintTimer) {
                clearTimeout(rotateHintTimer);
                rotateHintTimer = null;
            }
            if (rotateHint) {
                rotateHint.classList.remove("is-visible");
            }
        }

        function showRotateHint() {
            if (!shouldShowRotateHint()) return;
            hideRotateHint();
            rotateHint.classList.add("is-visible");
            rotateHintTimer = setTimeout(function () {
                rotateHint.classList.remove("is-visible");
                rotateHintTimer = null;
            }, 4200);
        }

        /* Foto verticale (H > W): niente rotazione. Orizzontale/quadra: ok. */
        function mediaAllowsDeviceRotate(imgOrVideo) {
            if (!imgOrVideo) return false;
            var nw = imgOrVideo.naturalWidth || imgOrVideo.videoWidth || 0;
            var nh = imgOrVideo.naturalHeight || imgOrVideo.videoHeight || 0;
            if (!nw || !nh) return false;
            return nw >= nh;
        }

        function syncRotatePermission(opts) {
            var root = document.documentElement;
            if (lightbox.hidden && !(opts && opts.allowHidden)) {
                root.classList.remove("drose-lightbox-allow-rotate");
                return false;
            }

            var allow = false;
            if (activeType === "video") {
                var video = content.querySelector(".drose-works-lightbox__video");
                allow = video ? mediaAllowsDeviceRotate(video) : true;
            } else if (activeType === "photo") {
                allow = mediaAllowsDeviceRotate(getPhotoImg());
            }

            if (allow) {
                root.classList.add("drose-lightbox-allow-rotate");
            } else {
                root.classList.remove("drose-lightbox-allow-rotate");
            }

            if (!(opts && opts.skipOrientSync) && typeof window.gadlyOrientLockSync === "function") {
                window.gadlyOrientLockSync();
            }
            return allow;
        }

        function setPhotoOpeningHidden(hidden) {
            lightbox.classList.toggle("drose-works-lightbox--photo-opening", !!hidden);
            var img = getPhotoImg();
            if (!img) return;
            if (hidden) {
                img.style.opacity = "0";
                img.style.visibility = "hidden";
            } else {
                img.style.opacity = "1";
                img.style.visibility = "visible";
            }
        }

        function settleVisiblePhoto(opts) {
            if (lightbox.hidden && !(opts && opts.allowHidden)) return;
            if (activeType !== "photo") return;
            var allow = syncRotatePermission({
                allowHidden: !!(opts && opts.allowHidden),
                skipOrientSync: !!(opts && opts.skipOrientSync),
            });
            if (isPhoneLandscape()) {
                fitLandscapePhoto();
            } else {
                clearLandscapePhotoFit(getPhotoImg());
            }
            if (!(opts && opts.silentHint)) {
                if (allow) {
                    showRotateHint();
                } else {
                    hideRotateHint();
                }
            }
            return allow;
        }

        function updateNavButtons() {
            var showNav = activeType === "photo" && photoItems.length > 1;
            if (prevBtn) {
                prevBtn.hidden = !showNav || photoIndex <= 0;
            }
            if (nextBtn) {
                nextBtn.hidden = !showNav || photoIndex >= photoItems.length - 1;
            }
        }

        function hideNavButtons() {
            if (prevBtn) prevBtn.hidden = true;
            if (nextBtn) nextBtn.hidden = true;
        }

        function clearContentMedia() {
            var img = getPhotoImg();
            var nodes = Array.prototype.slice.call(content.childNodes);
            nodes.forEach(function (node) {
                if (img && node === img) {
                    img.removeAttribute("src");
                    img.alt = "";
                    img.hidden = true;
                    img.style.transform = "";
                    clearLandscapePhotoFit(img);
                    return;
                }
                content.removeChild(node);
            });
            if (img && !img.parentNode) {
                content.appendChild(img);
            }
            if (content) {
                content.style.removeProperty("background-image");
                content.style.removeProperty("background-size");
                content.style.removeProperty("background-position");
                content.style.removeProperty("background-repeat");
            }
        }

        function closeLightbox() {
            if (lightbox.hidden) return;
            if (rotateSettleTimer) {
                clearTimeout(rotateSettleTimer);
                rotateSettleTimer = null;
            }
            if (resizeFitTimer) {
                clearTimeout(resizeFitTimer);
                resizeFitTimer = null;
            }
            setLightboxRotating(false);
            pauseActiveMedia();
            resetPhotoZoom();
            clearContentMedia();
            activeType = null;
            photoIndex = -1;
            lightbox.hidden = true;
            lightbox.classList.remove("drose-works-lightbox--photo", "drose-works-lightbox--video");
            lightbox.classList.remove(
                "drose-works-lightbox--photo-opening",
                "drose-works-lightbox--rotating",
                "drose-works-lightbox--preparing"
            );
            document.documentElement.classList.remove("drose-lb-rotating");
            if (document.body) {
                document.body.classList.remove("drose-lb-rotating");
            }
            hideNavButtons();
            document.body.classList.remove("drose-works-lightbox-open");
            document.documentElement.classList.remove("drose-lightbox-allow-rotate");
            hideRotateHint();
            restoreFullscreenChrome();
            if (typeof window.gadlyOrientLockSync === "function") {
                window.gadlyOrientLockSync();
            }
            if (lastFocus && typeof lastFocus.focus === "function") {
                lastFocus.focus();
            }
        }

        function isPhoneLandscape() {
            try {
                if (
                    window.matchMedia(
                        "(orientation: landscape) and (max-height: 1100px) and (max-width: 1024px)"
                    ).matches
                ) {
                    return true;
                }
            } catch (err) { /* ignore */ }
            try {
                return (
                    window.innerWidth > window.innerHeight &&
                    window.innerHeight <= 1100 &&
                    window.innerWidth <= 1024
                );
            } catch (err2) {
                return false;
            }
        }

        function clearLandscapePhotoFit(img) {
            if (!img) return;
            img.style.removeProperty("width");
            img.style.removeProperty("height");
            img.style.removeProperty("max-width");
            img.style.removeProperty("max-height");
            img.style.removeProperty("box-sizing");
            if (content) {
                content.style.removeProperty("width");
                content.style.removeProperty("height");
                content.style.removeProperty("max-width");
                content.style.removeProperty("max-height");
            }
        }

        function computeLandscapeFitSize(nw, nh) {
            if (!nw || !nh || !isPhoneLandscape()) return null;

            /* Area davvero visibile (DevTools / browser chrome), non clientHeight gonfiato */
            var viewW = window.innerWidth || 0;
            var viewH = window.innerHeight || 0;
            try {
                if (window.visualViewport) {
                    if (window.visualViewport.width) {
                        viewW = Math.min(viewW || window.visualViewport.width, window.visualViewport.width);
                    }
                    if (window.visualViewport.height) {
                        viewH = Math.min(viewH || window.visualViewport.height, window.visualViewport.height);
                    }
                }
            } catch (errVv) { /* ignore */ }

            var borderX = 4;
            var borderY = 4;
            var img = getPhotoImg();
            if (img) {
                try {
                    var imgStyle = window.getComputedStyle(img);
                    borderX =
                        (parseFloat(imgStyle.borderLeftWidth) || 0) +
                        (parseFloat(imgStyle.borderRightWidth) || 0);
                    borderY =
                        (parseFloat(imgStyle.borderTopWidth) || 0) +
                        (parseFloat(imgStyle.borderBottomWidth) || 0);
                } catch (errBorder) { /* ignore */ }
            }

            /* Margini minimi + safe-area: quasi schermo intero, foto intera, bordo visibile */
            var safeL = 0;
            var safeR = 0;
            var safeT = 0;
            var safeB = 0;
            try {
                var padProbe = document.createElement("div");
                padProbe.style.cssText =
                    "position:fixed;left:0;top:0;visibility:hidden;pointer-events:none;" +
                    "padding:env(safe-area-inset-top) env(safe-area-inset-right) env(safe-area-inset-bottom) env(safe-area-inset-left);";
                document.documentElement.appendChild(padProbe);
                var ps = window.getComputedStyle(padProbe);
                safeT = parseFloat(ps.paddingTop) || 0;
                safeR = parseFloat(ps.paddingRight) || 0;
                safeB = parseFloat(ps.paddingBottom) || 0;
                safeL = parseFloat(ps.paddingLeft) || 0;
                document.documentElement.removeChild(padProbe);
            } catch (errPad) { /* ignore */ }
            var edge = 6;
            var availW = Math.max(1, viewW - safeL - safeR - edge * 2 - borderX);
            var availH = Math.max(1, viewH - safeT - safeB - edge * 2 - borderY);
            var scale = Math.min(availW / nw, availH / nh);
            return {
                w: Math.max(1, Math.floor(nw * scale)),
                h: Math.max(1, Math.floor(nh * scale)),
            };
        }

        function applyLandscapeFitSize(img, size) {
            if (!img || !size) return;
            img.style.boxSizing = "content-box";
            img.style.width = size.w + "px";
            img.style.height = size.h + "px";
            img.style.maxWidth = "none";
            img.style.maxHeight = "none";
            if (content) {
                content.style.width = "auto";
                content.style.height = "auto";
                content.style.maxWidth = "none";
                content.style.maxHeight = "none";
            }
        }

        function fitLandscapePhoto() {
            var img = getPhotoImg();
            if (!img || img.hidden || activeType !== "photo" || lightbox.hidden) return;

            if (!isPhoneLandscape()) {
                clearLandscapePhotoFit(img);
                return;
            }

            var size = computeLandscapeFitSize(img.naturalWidth || 0, img.naturalHeight || 0);
            if (!size) return;
            applyLandscapeFitSize(img, size);
        }

        function scheduleLandscapePhotoFit() {
            fitLandscapePhoto();
        }

        var rotateSettleTimer = null;
        var resizeFitTimer = null;

        function setLightboxRotating(on) {
            lightbox.classList.toggle("drose-works-lightbox--rotating", !!on);
            document.documentElement.classList.toggle("drose-lb-rotating", !!on);
            if (document.body) {
                document.body.classList.toggle("drose-lb-rotating", !!on);
            }
            if (on) {
                var c = lightboxThemeChromeColor();
                document.documentElement.style.setProperty("background-color", c, "important");
                document.documentElement.style.setProperty("background-image", "none", "important");
                if (document.body) {
                    document.body.style.setProperty("background-color", c, "important");
                    document.body.style.setProperty("background-image", "none", "important");
                }
                lightbox.style.setProperty("background-color", c, "important");
            } else {
                lightbox.style.removeProperty("background-color");
                document.documentElement.style.removeProperty("background-color");
                document.documentElement.style.removeProperty("background-image");
                if (document.body) {
                    document.body.style.removeProperty("background-color");
                    document.body.style.removeProperty("background-image");
                }
            }
        }

        function deviceReportsLandscape() {
            try {
                if (window.screen && screen.orientation && typeof screen.orientation.type === "string") {
                    return screen.orientation.type.indexOf("landscape") === 0;
                }
            } catch (errType) { /* ignore */ }
            try {
                var ang = window.orientation;
                if (typeof ang === "number") {
                    return ang === 90 || ang === -90;
                }
            } catch (errAng) { /* ignore */ }
            return isPhoneLandscape();
        }

        function settleLightboxAfterRotate() {
            if (rotateSettleTimer) {
                clearTimeout(rotateSettleTimer);
                rotateSettleTimer = null;
            }
            if (lightbox.hidden) {
                setLightboxRotating(false);
                return;
            }
            resetPhotoZoom();
            if (isPhoneLandscape()) {
                fitLandscapePhoto();
            } else {
                clearLandscapePhotoFit(getPhotoImg());
            }
            setLightboxRotating(false);
        }

        function onLightboxOrientationChange() {
            if (lightbox.hidden) return;
            if (!document.documentElement.classList.contains("drose-lightbox-allow-rotate")) {
                setLightboxRotating(true);
                if (typeof window.gadlyOrientLockSync === "function") {
                    window.gadlyOrientLockSync();
                }
                if (rotateSettleTimer) clearTimeout(rotateSettleTimer);
                rotateSettleTimer = setTimeout(function () {
                    rotateSettleTimer = null;
                    if (lightbox.hidden) {
                        setLightboxRotating(false);
                        return;
                    }
                    if (!isPhoneLandscape()) {
                        setLightboxRotating(false);
                    } else if (typeof window.gadlyOrientLockSync === "function") {
                        window.gadlyOrientLockSync();
                    }
                }, 100);
                return;
            }

            /* Ritorno in verticale: niente velo pieno — layout portrait subito */
            if (!deviceReportsLandscape()) {
                settleLightboxAfterRotate();
                return;
            }

            /* Solo ingresso landscape: velo breve mentre si rifà il fit */
            setLightboxRotating(true);
            if (rotateSettleTimer) clearTimeout(rotateSettleTimer);
            rotateSettleTimer = setTimeout(function () {
                rotateSettleTimer = null;
                settleLightboxAfterRotate();
            }, 80);
        }

        function onLightboxViewportResize() {
            if (lightbox.hidden) return;
            if (lightbox.classList.contains("drose-works-lightbox--rotating")) {
                if (rotateSettleTimer) clearTimeout(rotateSettleTimer);
                /* Verticale: via il velo al primo resize; landscape: fit breve */
                if (!isPhoneLandscape() || !deviceReportsLandscape()) {
                    settleLightboxAfterRotate();
                    return;
                }
                rotateSettleTimer = setTimeout(function () {
                    rotateSettleTimer = null;
                    settleLightboxAfterRotate();
                }, 80);
                return;
            }
            if (resizeFitTimer) clearTimeout(resizeFitTimer);
            resizeFitTimer = setTimeout(function () {
                resizeFitTimer = null;
                scheduleLandscapePhotoFit();
            }, 80);
        }

        var photoRevealToken = 0;

        function upgradePhotoToFull(item, revealToken) {
            var img = getPhotoImg();
            if (!img || !item) return;
            var fullSrc = item.src;
            var thumbSrc = item.thumbSrc || fullSrc;
            if (!fullSrc || thumbSrc === fullSrc) return;
            if (img.getAttribute("src") === fullSrc) return;

            var probe = new Image();
            probe.decoding = "async";
            function applyFull() {
                if (revealToken !== photoRevealToken) return;
                if (img.getAttribute("src") === fullSrc) return;
                /* Swap senza toccare width/height/fit */
                img.src = fullSrc;
            }
            probe.onload = function () {
                if (typeof probe.decode === "function") {
                    probe.decode().then(applyFull).catch(applyFull);
                } else {
                    applyFull();
                }
            };
            probe.src = fullSrc;
            if (probe.complete && probe.naturalWidth) {
                probe.onload();
            }
        }

        function pickBootSrc(item) {
            var fullSrc = item.src;
            var thumbSrc = item.thumbSrc || fullSrc;
            try {
                var cachedFull = new Image();
                cachedFull.src = fullSrc;
                if (cachedFull.complete && cachedFull.naturalWidth) {
                    return fullSrc;
                }
            } catch (errCache) { /* ignore */ }
            return thumbSrc;
        }

        function prefetchPhotoNeighbors(centerIndex) {
            [centerIndex - 1, centerIndex + 1].forEach(function (i) {
                if (i < 0 || i >= photoItems.length) return;
                var it = photoItems[i];
                if (!it) return;
                try {
                    var a = new Image();
                    a.decoding = "async";
                    a.src = it.thumbSrc || it.src;
                    var b = new Image();
                    b.decoding = "async";
                    b.src = it.src;
                } catch (errPrefetch) { /* ignore */ }
            });
        }

        /**
         * Cambio foto (swipe/frecce): lascia la foto attuale finché la nuova è decodificata,
         * poi applica src (+ size landscape) in un solo frame.
         */
        function swapPhotoAt(index) {
            if (index < 0 || index >= photoItems.length) return;
            var item = photoItems[index];
            if (!item) return;
            var img = ensurePhotoImg();
            if (!img) return;

            photoIndex = index;
            lastFocus = item.trigger;
            resetPhotoZoom();
            hideRotateHint();
            updateNavButtons();

            var revealToken = ++photoRevealToken;
            var bootSrc = pickBootSrc(item);
            var probe = new Image();
            probe.decoding = "async";

            function commitSwap() {
                if (revealToken !== photoRevealToken) return;
                var nw = probe.naturalWidth || 0;
                var nh = probe.naturalHeight || 0;
                var landSize = computeLandscapeFitSize(nw, nh);

                img.onload = null;
                img.onerror = null;
                img.alt = item.caption;

                if (landSize) {
                    applyLandscapeFitSize(img, landSize);
                } else {
                    clearLandscapePhotoFit(img);
                }

                img.src = bootSrc;

                var allow = nw && nh ? nw >= nh : false;
                if (allow) {
                    document.documentElement.classList.add("drose-lightbox-allow-rotate");
                    showRotateHint();
                } else {
                    document.documentElement.classList.remove("drose-lightbox-allow-rotate");
                }

                if (bootSrc !== item.src) {
                    upgradePhotoToFull(item, revealToken);
                }
                prefetchPhotoNeighbors(index);
            }

            function ready() {
                if (revealToken !== photoRevealToken) return;
                if (typeof probe.decode === "function") {
                    probe.decode().then(commitSwap).catch(commitSwap);
                } else {
                    commitSwap();
                }
            }

            probe.onload = ready;
            probe.onerror = function () {
                if (bootSrc !== item.src) {
                    bootSrc = item.src;
                    probe.onload = ready;
                    probe.src = bootSrc;
                    return;
                }
                commitSwap();
            };
            probe.src = bootSrc;
            if (probe.complete && probe.naturalWidth) {
                ready();
            }
        }

        function showPhotoAt(index, onFirstPaint) {
            if (index < 0 || index >= photoItems.length) return;

            /* Swipe / frecce con lightbox già aperta: swap senza scatto */
            if (
                typeof onFirstPaint !== "function" &&
                !lightbox.hidden &&
                activeType === "photo" &&
                !lightbox.classList.contains("drose-works-lightbox--preparing")
            ) {
                swapPhotoAt(index);
                return;
            }

            photoIndex = index;
            var item = photoItems[index];
            lastFocus = item.trigger;
            resetPhotoZoom();

            var img = ensurePhotoImg();
            var revealToken = ++photoRevealToken;
            var fullSrc = item.src;
            hideRotateHint();
            document.documentElement.classList.remove("drose-lightbox-allow-rotate");
            setPhotoOpeningHidden(false);
            if (content) {
                content.style.removeProperty("background-image");
                content.style.removeProperty("background-size");
                content.style.removeProperty("background-position");
                content.style.removeProperty("background-repeat");
            }

            if (isPhoneLandscape()) {
                clearLandscapePhotoFit(img);
            }

            var painted = false;
            function onFirstFrame() {
                if (revealToken !== photoRevealToken || painted) return;
                painted = true;
                settleVisiblePhoto({
                    allowHidden: true,
                    silentHint: true,
                    skipOrientSync: true,
                });
                if (typeof onFirstPaint === "function") {
                    onFirstPaint();
                } else {
                    if (document.documentElement.classList.contains("drose-lightbox-allow-rotate")) {
                        showRotateHint();
                    }
                    upgradePhotoToFull(item, revealToken);
                }
                prefetchPhotoNeighbors(index);
            }

            img.onload = function () {
                onFirstFrame();
            };
            img.onerror = function () {
                if (fullSrc && img.src !== fullSrc) {
                    img.src = fullSrc;
                    return;
                }
                img.onerror = null;
                onFirstFrame();
            };
            img.alt = item.caption;
            img.hidden = false;
            img.style.opacity = "1";
            img.style.visibility = "visible";

            var bootSrc = pickBootSrc(item);
            img.src = bootSrc;
            if (img.complete && img.naturalWidth) {
                onFirstFrame();
            }
            updateNavButtons();
        }

        function stepPhoto(delta) {
            if (activeType !== "photo" || photoItems.length < 2) return;
            var nextIndex = photoIndex + delta;
            if (nextIndex < 0 || nextIndex >= photoItems.length) return;
            showPhotoAt(nextIndex);
        }

        function openPhotoLightbox(trigger) {
            buildPhotoItems();
            var src = trigger.getAttribute("data-src");
            if (!src) return;

            photoIndex = -1;
            for (var i = 0; i < photoItems.length; i++) {
                if (photoItems[i].src === src) {
                    photoIndex = i;
                    break;
                }
            }
            if (photoIndex < 0) {
                photoItems.push({
                    src: src,
                    thumbSrc: trigger.getAttribute("data-thumb-src") || src,
                    caption: trigger.getAttribute("data-caption") || "",
                    trigger: trigger,
                });
                photoIndex = photoItems.length - 1;
            }

            lastFocus = trigger;
            pauseActiveMedia();
            var video = content.querySelector(".drose-works-lightbox__video");
            if (video) video.remove();
            activeType = "photo";
            activeMedia = null;
            lightbox.classList.add("drose-works-lightbox--photo");
            lightbox.classList.remove("drose-works-lightbox--video");
            document.documentElement.classList.remove("drose-lightbox-allow-rotate");

            /* Visibile al layout ma opacity 0: chrome + foto già pronti, poi un solo reveal */
            forceFullscreenChrome();
            document.body.classList.add("drose-works-lightbox-open");
            lightbox.classList.add("drose-works-lightbox--preparing");
            lightbox.hidden = false;

            var item = photoItems[photoIndex];
            showPhotoAt(photoIndex, function () {
                void lightbox.offsetWidth;
                requestAnimationFrame(function () {
                    requestAnimationFrame(function () {
                        lightbox.classList.remove("drose-works-lightbox--preparing");
                        if (document.documentElement.classList.contains("drose-lightbox-allow-rotate")) {
                            showRotateHint();
                        }
                        lightbox.focus();
                        upgradePhotoToFull(item, photoRevealToken);
                    });
                });
            });
        }

        function openVideoLightbox(trigger) {
            var src = trigger.getAttribute("data-src");
            if (!src) return;

            lastFocus = trigger;
            pauseActiveMedia();
            clearContentMedia();
            activeType = "video";
            hideNavButtons();
            resetPhotoZoom();

            var video = document.createElement("video");
            video.src = src;
            video.controls = true;
            video.playsInline = true;
            video.setAttribute("controls", "");
            video.className = "drose-works-lightbox__video";
            content.appendChild(video);
            activeMedia = video;
            lightbox.classList.add("drose-works-lightbox--video");
            lightbox.classList.remove("drose-works-lightbox--photo");
            lightbox.hidden = false;
            document.body.classList.add("drose-works-lightbox-open");
            document.documentElement.classList.remove("drose-lightbox-allow-rotate");
            forceFullscreenChrome();
            function onVideoMeta() {
                if (syncRotatePermission()) {
                    showRotateHint();
                } else {
                    hideRotateHint();
                }
            }
            video.addEventListener("loadedmetadata", onVideoMeta);
            if (video.readyState >= 1) {
                onVideoMeta();
            }
            lightbox.focus();
            video.play().catch(function () { /* ignore */ });
        }

        function openLightbox(trigger) {
            var mediaType = trigger.getAttribute("data-media-type");
            if (mediaType === "video") {
                openVideoLightbox(trigger);
                return;
            }
            openPhotoLightbox(trigger);
        }

        function openLightboxFromTrigger(trigger, event) {
            var now = Date.now();
            if (now - lastTriggerOpenTs < 350) {
                if (event) {
                    event.preventDefault();
                    event.stopPropagation();
                }
                return;
            }
            lastTriggerOpenTs = now;
            if (event) {
                event.preventDefault();
                event.stopPropagation();
            }
            armSuppressCloseClick();
            dragMoved = false;
            openLightbox(trigger);
        }

        function touchDistance(touches) {
            var dx = touches[0].clientX - touches[1].clientX;
            var dy = touches[0].clientY - touches[1].clientY;
            return Math.sqrt(dx * dx + dy * dy);
        }

        function bindPhotoZoom() {
            if (photoZoomBound) return;
            photoZoomBound = true;

            lightbox.addEventListener(
                "wheel",
                function (event) {
                    if (lightbox.hidden || activeType !== "photo") return;
                    if (event.target.closest(".drose-works-lightbox__close")) return;
                    if (event.target.closest(".drose-works-lightbox__nav")) return;
                    event.preventDefault();
                    var direction = event.deltaY > 0 ? -1 : 1;
                    setPhotoZoom(photoZoom + direction * ZOOM_STEP);
                },
                { passive: false }
            );

            lightbox.addEventListener("pointerdown", function (event) {
                if (lightbox.hidden || activeType !== "photo") return;
                if (event.pointerType === "mouse" && event.button !== 0) return;
                if (event.target.closest(".drose-works-lightbox__close")) return;
                if (event.target.closest(".drose-works-lightbox__nav")) return;
                if (photoZoom <= 1.01) return;
                /* Con zoom attivo: click tenuto + trascinamento su tutta l’area. */
                event.preventDefault();
                dragActive = true;
                dragMoved = false;
                dragStartX = event.clientX;
                dragStartY = event.clientY;
                dragOriginX = photoPanX;
                dragOriginY = photoPanY;
                setPanning(true);
                armSuppressCloseClick();
                try {
                    lightbox.setPointerCapture(event.pointerId);
                } catch (err) { /* ignore */ }
            });

            lightbox.addEventListener("pointermove", function (event) {
                if (!dragActive) return;
                event.preventDefault();
                var dx = event.clientX - dragStartX;
                var dy = event.clientY - dragStartY;
                if (Math.abs(dx) > 2 || Math.abs(dy) > 2) {
                    dragMoved = true;
                    armSuppressCloseClick();
                }
                photoPanX = dragOriginX + dx;
                photoPanY = dragOriginY + dy;
                clampPan();
                applyPhotoTransform();
            });

            function endDrag(event) {
                if (!dragActive) return;
                dragActive = false;
                setPanning(false);
                armSuppressCloseClick();
                /* Non rilasciare a mano la capture: al pointerup il browser lo fa già.
                   Un release manuale può far partire un click “fantasma” che chiude la lightbox. */
            }

            lightbox.addEventListener("pointerup", endDrag);
            lightbox.addEventListener("pointercancel", endDrag);
            lightbox.addEventListener("lostpointercapture", function () {
                if (!dragActive) return;
                dragActive = false;
                setPanning(false);
                armSuppressCloseClick();
            });

            lightbox.addEventListener(
                "dragstart",
                function (event) {
                    if (activeType === "photo") event.preventDefault();
                },
                true
            );

            lightbox.addEventListener(
                "touchstart",
                function (event) {
                    if (lightbox.hidden || activeType !== "photo") return;
                    if (event.touches.length === 1 && photoZoom <= 1.01) {
                        swipeStartX = event.touches[0].clientX;
                        swipeStartY = event.touches[0].clientY;
                        swipeTracking = true;
                    } else {
                        swipeTracking = false;
                    }
                    if (event.touches.length === 2) {
                        pinchStartDist = touchDistance(event.touches);
                        pinchStartZoom = photoZoom;
                        dragActive = false;
                        setPanning(false);
                    }
                },
                { passive: true }
            );

            lightbox.addEventListener(
                "touchmove",
                function (event) {
                    if (lightbox.hidden || activeType !== "photo") return;
                    if (event.touches.length !== 2 || !pinchStartDist) return;
                    event.preventDefault();
                    var dist = touchDistance(event.touches);
                    setPhotoZoom(pinchStartZoom * (dist / pinchStartDist));
                },
                { passive: false }
            );

            lightbox.addEventListener(
                "touchend",
                function (event) {
                    if (
                        swipeTracking &&
                        activeType === "photo" &&
                        photoZoom <= 1.01 &&
                        event.changedTouches &&
                        event.changedTouches.length === 1
                    ) {
                        var dx = event.changedTouches[0].clientX - swipeStartX;
                        var dy = event.changedTouches[0].clientY - swipeStartY;
                        if (Math.abs(dx) >= 48 && Math.abs(dx) > Math.abs(dy)) {
                            stepPhoto(dx < 0 ? 1 : -1);
                            armSuppressCloseClick();
                        }
                    }
                    swipeTracking = false;
                    pinchStartDist = 0;
                },
                { passive: true }
            );
        }

        document.querySelectorAll(".drose-works-open").forEach(function (trigger) {
            if (trigger.dataset.lightboxBound === "1") return;
            trigger.dataset.lightboxBound = "1";
            trigger.addEventListener("click", function (event) {
                openLightboxFromTrigger(trigger, event);
            });

            var tapStartX = 0;
            var tapStartY = 0;
            var tapMoved = false;
            var tapPointerId = null;

            trigger.addEventListener("pointerdown", function (event) {
                if (event.pointerType !== "touch" && event.pointerType !== "pen") return;
                tapStartX = event.clientX;
                tapStartY = event.clientY;
                tapMoved = false;
                tapPointerId = event.pointerId;
            });

            trigger.addEventListener("pointermove", function (event) {
                if (event.pointerId !== tapPointerId) return;
                var dx = event.clientX - tapStartX;
                var dy = event.clientY - tapStartY;
                if (Math.abs(dx) > 10 || Math.abs(dy) > 10) {
                    tapMoved = true;
                }
            });

            function resetTriggerPointer(event) {
                if (event.pointerId === tapPointerId) {
                    tapPointerId = null;
                }
            }

            trigger.addEventListener("pointercancel", resetTriggerPointer);

            trigger.addEventListener("pointerup", function (event) {
                if (event.pointerType !== "touch" && event.pointerType !== "pen") return;
                if (event.pointerId !== tapPointerId) return;
                tapPointerId = null;
                if (tapMoved) return;
                openLightboxFromTrigger(trigger, event);
            });
        });

        if (closeBtn && closeBtn.dataset.lightboxBound !== "1") {
            closeBtn.dataset.lightboxBound = "1";
            closeBtn.addEventListener("click", function (event) {
                event.stopPropagation();
                closeLightbox();
            });
        }

        if (prevBtn && prevBtn.dataset.lightboxBound !== "1") {
            prevBtn.dataset.lightboxBound = "1";
            prevBtn.addEventListener("click", function (event) {
                event.stopPropagation();
                stepPhoto(-1);
            });
        }

        if (nextBtn && nextBtn.dataset.lightboxBound !== "1") {
            nextBtn.dataset.lightboxBound = "1";
            nextBtn.addEventListener("click", function (event) {
                event.stopPropagation();
                stepPhoto(1);
            });
        }

        if (lightbox.dataset.lightboxSurfaceBound !== "1") {
            lightbox.dataset.lightboxSurfaceBound = "1";
            function onLightboxSurfaceClick(event) {
                if (lightbox.hidden) return;
                if (event.target.closest(".drose-works-lightbox__close")) return;
                if (event.target.closest(".drose-works-lightbox__nav")) return;
                if (activeType === "video" && event.target.closest(".drose-works-lightbox__video")) return;
                if (shouldKeepLightboxOpenOnClick()) {
                    event.preventDefault();
                    event.stopPropagation();
                    dragMoved = false;
                    return;
                }
                closeLightbox();
            }
            /* Capture: intercetta il click prima che altri handler chiudano la vista. */
            lightbox.addEventListener("click", onLightboxSurfaceClick, true);
            lightbox.addEventListener("click", onLightboxSurfaceClick);
        }

        if (!document.documentElement.dataset.droseWorksLightboxKeys) {
            document.documentElement.dataset.droseWorksLightboxKeys = "1";
            document.addEventListener("keydown", function (event) {
                if (!lightbox || lightbox.hidden) return;
                if (event.key === "Escape") {
                    if (activeType === "photo" && photoZoom > 1.01) {
                        resetPhotoZoom();
                        return;
                    }
                    closeLightbox();
                    return;
                }
                if (activeType !== "photo") return;
                if (event.key === "ArrowLeft") {
                    event.preventDefault();
                    stepPhoto(-1);
                } else if (event.key === "ArrowRight") {
                    event.preventDefault();
                    stepPhoto(1);
                } else if (event.key === "+" || event.key === "=") {
                    event.preventDefault();
                    setPhotoZoom(photoZoom + ZOOM_STEP);
                } else if (event.key === "-" || event.key === "_") {
                    event.preventDefault();
                    setPhotoZoom(photoZoom - ZOOM_STEP);
                } else if (event.key === "0") {
                    event.preventDefault();
                    resetPhotoZoom();
                }
            });
        }

        bindPhotoZoom();

        window.addEventListener("resize", onLightboxViewportResize, { passive: true });
        window.addEventListener("orientationchange", onLightboxOrientationChange);
        try {
            if (window.screen && screen.orientation && typeof screen.orientation.addEventListener === "function") {
                screen.orientation.addEventListener("change", onLightboxOrientationChange);
            }
        } catch (errOr) { /* ignore */ }
        try {
            if (window.visualViewport) {
                window.visualViewport.addEventListener("resize", onLightboxViewportResize, { passive: true });
            }
        } catch (errVvBind) { /* ignore */ }
    }

    if (document.readyState === "loading") {
        document.addEventListener("DOMContentLoaded", init);
    } else {
        init();
    }
})();
