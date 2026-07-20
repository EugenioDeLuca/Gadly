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
        var photoZoomBound = false;
        var suppressCloseClick = false;
        var suppressCloseClickTimer = null;

        function getPhotoImg() {
            return content.querySelector(".drose-works-lightbox__image");
        }

        function ensurePhotoImg() {
            var img = getPhotoImg();
            if (img) return img;
            img = document.createElement("img");
            img.className = "drose-works-lightbox__image";
            img.decoding = "sync";
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
                    return;
                }
                content.removeChild(node);
            });
            if (img && !img.parentNode) {
                content.appendChild(img);
            }
        }

        function closeLightbox() {
            if (lightbox.hidden) return;
            pauseActiveMedia();
            resetPhotoZoom();
            clearContentMedia();
            activeType = null;
            photoIndex = -1;
            lightbox.hidden = true;
            lightbox.classList.remove("drose-works-lightbox--photo", "drose-works-lightbox--video");
            hideNavButtons();
            document.body.classList.remove("drose-works-lightbox-open");
            if (lastFocus && typeof lastFocus.focus === "function") {
                lastFocus.focus();
            }
        }

        function showPhotoAt(index) {
            if (index < 0 || index >= photoItems.length) return;
            photoIndex = index;
            var item = photoItems[index];
            lastFocus = item.trigger;
            resetPhotoZoom();

            var img = ensurePhotoImg();
            img.src = item.src;
            img.alt = item.caption;
            img.hidden = false;
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
            lightbox.hidden = false;
            document.body.classList.add("drose-works-lightbox-open");
            showPhotoAt(photoIndex);
            lightbox.focus();
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
                function () {
                    pinchStartDist = 0;
                },
                { passive: true }
            );
        }

        document.querySelectorAll(".drose-works-open").forEach(function (trigger) {
            if (trigger.dataset.lightboxBound === "1") return;
            trigger.dataset.lightboxBound = "1";
            trigger.addEventListener("click", function (event) {
                event.preventDefault();
                openLightbox(trigger);
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
    }

    if (document.readyState === "loading") {
        document.addEventListener("DOMContentLoaded", init);
    } else {
        init();
    }
})();
