document.addEventListener("DOMContentLoaded", function() {
    var isItalian = (document.documentElement.lang || "").toLowerCase().indexOf("it") === 0;
    function t(it, en) { return isItalian ? it : en; }
    const canvas = document.getElementById("canvas");
    const ctx = canvas.getContext("2d");
    const cropCanvas = document.getElementById("crop-canvas");
    const cropCtx = cropCanvas.getContext("2d");
    const imageInput = document.getElementById("image-input");
    const editorArea = document.getElementById("editor-area");

    let originalImage = null;
    let workCanvas = null;
    let workCtx = null;
    let brightness = 100;
    let contrast = 100;
    let saturation = 100;
    let cropMode = false;
    let blurMode = false;
    let cropStart = null;
    let cropEnd = null;
    let isSelecting = false;
    let drawMode = false;
    let isDrawing = false;
    let watermarkMode = false;
    let watermarkX = 0.5;
    let watermarkY = 0.5;
    let isDraggingWatermark = false;
    let canvasBeforeTextBuffer = null;
    let textOverlayApplied = false;
    let lastTextObject = null;
    const history = [];
    const redoStack = [];
    const historyMax = 20;
    let zoomLevel = 100;
    let panX = 0, panY = 0;
    let isPanning = false;
    let panStartX = 0, panStartY = 0, panStartOffsetX = 0, panStartOffsetY = 0;
    let isRotateOperation = false;
    let lastOperationWasRotate = false;
    let rotateAnchorCanvas = null;
    let rotateAccumDeg = 0;

    function saveState() {
        if (!workCanvas) return;
        if (!isRotateOperation) {
            lastOperationWasRotate = false;
            rotateAnchorCanvas = null;
            rotateAccumDeg = 0;
        }
        redoStack.length = 0;
        history.push(workCanvas.toDataURL());
        if (history.length > historyMax) history.shift();
    }

    function cloneCanvas(src) {
        const out = document.createElement("canvas");
        out.width = src.width;
        out.height = src.height;
        out.getContext("2d").drawImage(src, 0, 0);
        return out;
    }

    function restoreState(dataUrl) {
        const img = new Image();
        img.onload = function() {
            createWorkCanvas(img.width, img.height);
            workCtx.drawImage(img, 0, 0);
            updateResizeInputs();
            drawToDisplay();
            updateResetButton();
        };
        img.src = dataUrl;
    }

    function createWorkCanvas(w, h) {
        workCanvas = document.createElement("canvas");
        workCanvas.width = w;
        workCanvas.height = h;
        workCtx = workCanvas.getContext("2d");
    }


    function drawToDisplay() {
        if (!workCanvas) return;
        document.body.classList.remove("toolbar-auto-follow");
        const dpr = window.devicePixelRatio || 1;
        const wrapper = document.getElementById("canvas-wrapper");
        const editorArea = document.querySelector(".editor-area");
        var availW = (wrapper && wrapper.clientWidth > 0) ? wrapper.clientWidth : 1100;
        if (availW <= 0 && editorArea) availW = editorArea.clientWidth;
        if (availW <= 0) availW = 1100;
        var headerH = 82;
        var maxW, maxH;
        if (window.innerWidth <= 768) {
            maxW = Math.min(availW, window.innerWidth - 32);
            maxH = window.innerHeight - headerH - 160;
        } else {
            maxW = availW;
            maxH = Math.min(window.innerHeight - headerH - 120, 2400);
        }
        maxW = Math.max(200, maxW);
        maxH = Math.max(200, maxH);
        let dispW = workCanvas.width;
        let dispH = workCanvas.height;
        var baseRatio = Math.min(maxW / dispW, maxH / dispH);
        if (window.innerWidth > 768) baseRatio = Math.min(baseRatio, 4);
        else baseRatio = Math.min(baseRatio, 2);
        var ratio = baseRatio * (zoomLevel / 100);
        var maxRatio = window.innerWidth > 768 ? 16 : 4;
        ratio = Math.max(0.25, Math.min(maxRatio, ratio));
        dispW = Math.round(dispW * ratio);
        dispH = Math.round(dispH * ratio);
        if (zoomLevel <= 100 && (dispW > maxW || dispH > maxH)) {
            var scale = Math.min(maxW / dispW, maxH / dispH);
            dispW = Math.round(dispW * scale);
            dispH = Math.round(dispH * scale);
        }
        canvas.width = Math.round(dispW * dpr);
        canvas.height = Math.round(dispH * dpr);
        canvas.style.width = dispW + "px";
        canvas.style.height = dispH + "px";
        var container = document.getElementById("canvas-container");
        if (container) container.style.transform = "translate(" + panX + "px, " + panY + "px)";
        updateTallImageClass(dispH);
        ctx.save();
        ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
        ctx.imageSmoothingEnabled = true;
        ctx.imageSmoothingQuality = "high";
        ctx.filter = "brightness(" + (brightness / 100) + ") contrast(" + (contrast / 100) + ") saturate(" + (saturation / 100) + ")";
        ctx.drawImage(workCanvas, 0, 0, workCanvas.width, workCanvas.height, 0, 0, dispW, dispH);
        ctx.filter = "none";
        ctx.restore();
    }

    var toolbarUserMoved = false;
    function headerOffset() {
        return 82;
    }
    function clearAutoFollowToolbar() {
        var toolbar = document.querySelector(".editor-area .toolbar");
        var wrap = document.getElementById("toolbar-wrap");
        var isFloated = document.body.classList.contains("toolbar-floated");
        document.body.classList.remove("toolbar-auto-follow");
        if (toolbar && !isFloated) {
            toolbar.style.top = "";
            toolbar.style.left = "";
            toolbar.style.width = "";
            toolbar.style.minWidth = "";
        }
        if (wrap) wrap.style.minHeight = "";
    }
    function syncToolbarPosition() {
        if (!document.body.classList.contains("toolbar-auto-follow")) return;
        var toolbar = document.querySelector(".editor-area .toolbar");
        var wrap = document.getElementById("toolbar-wrap");
        if (toolbar && wrap) {
            var rect = wrap.getBoundingClientRect();
            toolbar.style.top = headerOffset() + "px";
            toolbar.style.left = rect.left + "px";
            toolbar.style.width = rect.width + "px";
            toolbar.style.minWidth = rect.width + "px";
            wrap.style.minHeight = rect.height + "px";
        }
    }
    function updateTallImageClass(canvasHeight) {
        var headerH = 82;
        var availH = window.innerWidth <= 768 ? window.innerHeight - headerH - 120 : window.innerHeight - headerH - 140;
        if (canvasHeight > availH) {
            document.body.classList.add("editor-tall-image");
        } else {
            document.body.classList.remove("editor-tall-image");
        }
    }

    function applyFilters(imageData) {
        const data = imageData.data;
        const b = brightness / 100;
        const c = (contrast / 100 - 0.5) * 2 + 1;
        const factor = (259 * (c * 255 + 255)) / (255 * (259 - c * 255));

        for (let i = 0; i < data.length; i += 4) {
            data[i] = Math.min(255, Math.max(0, (data[i] - 128) * factor + 128 * b));
            data[i + 1] = Math.min(255, Math.max(0, (data[i + 1] - 128) * factor + 128 * b));
            data[i + 2] = Math.min(255, Math.max(0, (data[i + 2] - 128) * factor + 128 * b));
        }
        return imageData;
    }

    var editorLoading = document.getElementById("editor-loading");
    var editorToast = document.getElementById("editor-toast");
    var editorError = document.getElementById("editor-error");
    var IMAGE_MAX_MP = 50;

    function showError(msg) {
        if (editorError) {
            editorError.textContent = msg;
            editorError.style.display = "block";
            editorError.style.animation = "none";
            editorError.offsetHeight;
            editorError.style.animation = "toastFade 3s ease forwards";
            setTimeout(function() { editorError.style.display = "none"; }, 3000);
        }
    }

    function updateResetButton() {
        var btn = document.getElementById("btn-reset");
        if (!btn) return;
        var canReset = originalImage && (history.length > 1 || redoStack.length > 0 || brightness !== 100 || contrast !== 100 || saturation !== 100);
        btn.disabled = !canReset;
    }

    function loadImage(file) {
        if (editorLoading) editorLoading.style.display = "flex";
        var url = URL.createObjectURL(file);
        var img = new Image();
        img.onload = function() {
            if (editorLoading) editorLoading.style.display = "none";
            var mp = (img.width * img.height) / 1000000;
            if (mp > IMAGE_MAX_MP) {
                if (confirm(t("Questa immagine è molto grande", "This image is very large") + " (" + Math.round(mp) + " MP). " + t("L'editing potrebbe essere lento. Continuare?", "Editing may be slow. Continue anyway?"))) {
                    doLoadImage(img);
                }
                URL.revokeObjectURL(url);
                return;
            }
            doLoadImage(img);
            URL.revokeObjectURL(url);
        };
        img.onerror = function() {
            if (editorLoading) editorLoading.style.display = "none";
            URL.revokeObjectURL(url);
            showError(t("Impossibile caricare l'immagine. Prova un altro file.", "Failed to load image. Please try another file."));
        };
        img.src = url;
    }
    function doLoadImage(img) {
        originalImage = img;
        createWorkCanvas(img.width, img.height);
        workCtx.drawImage(img, 0, 0);
        history.length = 0;
        saveState();
        clearLastTextObject();
        zoomLevel = 100;
        panX = 0;
        panY = 0;
        document.querySelector(".upload-area").style.display = "none";
        var titleEl = document.querySelector(".image-editor-title");
        if (titleEl) titleEl.style.display = "none";
        var descEl = document.querySelector(".image-editor-desc");
        if (descEl) descEl.style.display = "none";
        editorArea.style.display = "flex";
        document.body.classList.add("editor-active");
        if (typeof window.__gadlyPlaceQuickNav === "function") {
            window.__gadlyPlaceQuickNav();
        }
        document.body.classList.remove("toolbar-floated");
        clearAutoFollowToolbar();
        toolbarUserMoved = false;
        var tb = document.querySelector(".editor-area .toolbar");
        var wr = document.getElementById("toolbar-wrap");
        var resBtn = document.getElementById("toolbar-reset-pos");
        if (tb) { tb.style.top = ""; tb.style.left = ""; tb.style.width = ""; tb.style.minWidth = ""; }
        if (wr) wr.style.minHeight = "";
        if (resBtn) resBtn.classList.remove("visible");
        if (window.innerWidth <= 768) {
            document.querySelectorAll(".toolbar-accordion").forEach(function(el) { el.removeAttribute("open"); });
        }
        requestAnimationFrame(function() {
            requestAnimationFrame(function() {
                drawToDisplay();
                updateResizeInputs();
                updateResetButton();
            });
        });
    }

    function updateResizeInputs() {
        document.getElementById("resize-width").value = workCanvas.width;
        document.getElementById("resize-height").value = workCanvas.height;
    }

    function resetFilters() {
        brightness = 100;
        contrast = 100;
        saturation = 100;
        document.getElementById("filter-brightness").value = 100;
        document.getElementById("filter-contrast").value = 100;
        document.getElementById("filter-saturation").value = 100;
        document.getElementById("brightness-val").textContent = "100%";
        document.getElementById("contrast-val").textContent = "100%";
        document.getElementById("saturation-val").textContent = "100%";
    }

    imageInput.addEventListener("change", function(e) {
        const file = e.target.files[0];
        if (file) loadImage(file);
    });

    var uploadArea = document.getElementById("upload-area");
    if (uploadArea) {
        uploadArea.addEventListener("dragover", function(e) {
            e.preventDefault();
            e.stopPropagation();
            uploadArea.classList.add("drag-over");
        });
        uploadArea.addEventListener("dragleave", function(e) {
            e.preventDefault();
            e.stopPropagation();
            uploadArea.classList.remove("drag-over");
        });
        uploadArea.addEventListener("drop", function(e) {
            e.preventDefault();
            e.stopPropagation();
            uploadArea.classList.remove("drag-over");
            var files = e.dataTransfer.files;
            if (files && files.length > 0 && files[0].type.indexOf("image/") === 0) loadImage(files[0]);
        });
    }

    document.addEventListener("paste", function(e) {
        var active = document.activeElement;
        if (active && (active.tagName === "INPUT" || active.tagName === "TEXTAREA")) return;
        if (e.clipboardData && e.clipboardData.files && e.clipboardData.files.length > 0) {
            var file = e.clipboardData.files[0];
            if (file.type.indexOf("image/") === 0) {
                e.preventDefault();
                loadImage(file);
            }
        }
    });

    document.addEventListener("keydown", function(e) {
        if (e.ctrlKey || e.metaKey) {
            if (e.key === "z") {
                e.preventDefault();
                if (e.shiftKey) {
                    document.getElementById("btn-redo").click();
                } else {
                    document.getElementById("btn-undo").click();
                }
            } else if (e.key === "y") {
                e.preventDefault();
                document.getElementById("btn-redo").click();
            }
        }
    });

    document.getElementById("btn-rotate-left").addEventListener("click", function() {
        rotateRightAngle(-90);
    });
    document.getElementById("btn-rotate-right").addEventListener("click", function() {
        rotateRightAngle(90);
    });

    function resetRotateTracking() {
        lastOperationWasRotate = false;
        rotateAnchorCanvas = null;
        rotateAccumDeg = 0;
    }

    function rotateRightAngle(deg) {
        isRotateOperation = true;
        saveState();
        resetRotateTracking();
        const w = workCanvas.width;
        const h = workCanvas.height;
        const newCanvas = document.createElement("canvas");
        newCanvas.width = h;
        newCanvas.height = w;
        const newCtx = newCanvas.getContext("2d");
        newCtx.translate(newCanvas.width / 2, newCanvas.height / 2);
        newCtx.rotate((deg * Math.PI) / 180);
        newCtx.drawImage(workCanvas, -w / 2, -h / 2, w, h);
        workCanvas = newCanvas;
        workCtx = workCanvas.getContext("2d");
        panX = 0;
        panY = 0;
        isRotateOperation = false;
        updateZoomDisplay();
        clearLastTextObject();
        updateResizeInputs();
        drawToDisplay();
        updateResetButton();
    }

    function rotate(deg) {
        isRotateOperation = true;
        saveState();
        if (!lastOperationWasRotate || !rotateAnchorCanvas) {
            rotateAnchorCanvas = cloneCanvas(workCanvas);
            rotateAccumDeg = 0;
        }
        rotateAccumDeg += deg;
        const sourceCanvas = rotateAnchorCanvas;
        const w = sourceCanvas.width;
        const h = sourceCanvas.height;
        var rad = (rotateAccumDeg * Math.PI) / 180;
        var absCos = Math.abs(Math.cos(rad));
        var absSin = Math.abs(Math.sin(rad));
        const newCanvas = document.createElement("canvas");
        /* Resize canvas to contain full rotated image. */
        newCanvas.width = Math.ceil(w * absCos + h * absSin);
        newCanvas.height = Math.ceil(w * absSin + h * absCos);
        const newCtx = newCanvas.getContext("2d");
        newCtx.translate(newCanvas.width / 2, newCanvas.height / 2);
        newCtx.rotate(rad);
        newCtx.drawImage(sourceCanvas, -w / 2, -h / 2, w, h);
        workCanvas = newCanvas;
        workCtx = workCanvas.getContext("2d");
        panX = 0;
        panY = 0;
        lastOperationWasRotate = true;
        isRotateOperation = false;
        updateZoomDisplay();
        clearLastTextObject();
        updateResizeInputs();
        drawToDisplay();
        updateResetButton();
    }

    function trimTransparentCanvas(srcCanvas) {
        const w = srcCanvas.width;
        const h = srcCanvas.height;
        if (!w || !h) return srcCanvas;
        const srcCtx = srcCanvas.getContext("2d");
        const data = srcCtx.getImageData(0, 0, w, h).data;
        let minX = w, minY = h, maxX = -1, maxY = -1;
        for (let y = 0; y < h; y++) {
            const rowBase = y * w * 4;
            for (let x = 0; x < w; x++) {
                const a = data[rowBase + x * 4 + 3];
                if (a > 0) {
                    if (x < minX) minX = x;
                    if (x > maxX) maxX = x;
                    if (y < minY) minY = y;
                    if (y > maxY) maxY = y;
                }
            }
        }
        if (maxX < minX || maxY < minY) return srcCanvas;
        const outW = maxX - minX + 1;
        const outH = maxY - minY + 1;
        if (outW === w && outH === h) return srcCanvas;
        const out = document.createElement("canvas");
        out.width = outW;
        out.height = outH;
        out.getContext("2d").drawImage(srcCanvas, minX, minY, outW, outH, 0, 0, outW, outH);
        return out;
    }

    document.getElementById("btn-flip-h").addEventListener("click", function() {
        flip(true, false);
    });
    document.getElementById("btn-flip-v").addEventListener("click", function() {
        flip(false, true);
    });

    function flip(horizontal, vertical) {
        saveState();
        const w = workCanvas.width;
        const h = workCanvas.height;
        const newCanvas = document.createElement("canvas");
        newCanvas.width = w;
        newCanvas.height = h;
        const newCtx = newCanvas.getContext("2d");
        newCtx.translate(horizontal ? w : 0, vertical ? h : 0);
        newCtx.scale(horizontal ? -1 : 1, vertical ? -1 : 1);
        newCtx.drawImage(workCanvas, 0, 0);
        workCanvas = newCanvas;
        workCtx = workCanvas.getContext("2d");
        clearLastTextObject();
        drawToDisplay();
        updateResetButton();
    }

    document.getElementById("resize-width").addEventListener("input", function() {
        if (document.getElementById("resize-ratio").checked && workCanvas) {
            const w = parseInt(this.value) || workCanvas.width;
            document.getElementById("resize-height").value = Math.round(w * workCanvas.height / workCanvas.width);
        }
    });
    document.getElementById("resize-height").addEventListener("input", function() {
        if (document.getElementById("resize-ratio").checked && workCanvas) {
            const h = parseInt(this.value) || workCanvas.height;
            document.getElementById("resize-width").value = Math.round(h * workCanvas.width / workCanvas.height);
        }
    });
    document.getElementById("btn-resize").addEventListener("click", function() {
        const w = parseInt(document.getElementById("resize-width").value);
        const h = parseInt(document.getElementById("resize-height").value);
        if (w > 0 && h > 0) resize(w, h);
    });
    document.getElementById("btn-rotate-free").addEventListener("click", function() {
        const deg = parseFloat(document.getElementById("rotate-angle").value) || 0;
        if (deg !== 0) rotate(deg);
    });

    document.querySelectorAll("button[data-scale]").forEach(function(btn) {
        btn.addEventListener("click", function() {
            var scale = parseFloat(this.dataset.scale);
            if (!workCanvas || isNaN(scale)) return;
            resize(Math.round(workCanvas.width * scale), Math.round(workCanvas.height * scale));
        });
    });

    function resize(w, h) {
        saveState();
        const sourceCanvas = trimTransparentCanvas(workCanvas);
        const newCanvas = document.createElement("canvas");
        newCanvas.width = Math.max(1, w);
        newCanvas.height = Math.max(1, h);
        const newCtx = newCanvas.getContext("2d");
        newCtx.drawImage(sourceCanvas, 0, 0, newCanvas.width, newCanvas.height);
        workCanvas = newCanvas;
        workCtx = newCtx;
        clearLastTextObject();
        updateResizeInputs();
        drawToDisplay();
        updateResetButton();
    }

    document.getElementById("btn-crop-start").addEventListener("click", function() {
        if (textOverlayApplied) saveState();
        finalizeTextOverlay(false);
        clearLastTextObject();
        drawMode = false;
        blurMode = false;
        watermarkMode = false;
        document.getElementById("btn-watermark-apply").style.display = "none";
        document.getElementById("btn-watermark-cancel").style.display = "none";
        document.getElementById("btn-draw-mode").classList.remove("active");
        document.getElementById("btn-blur-start").classList.remove("active");
        canvas.style.cursor = "default";
        cropMode = true;
        isSelecting = false;
        cropStart = null;
        cropEnd = null;
        cropCanvas.style.display = "block";
        cropCanvas.width = canvas.offsetWidth;
        cropCanvas.height = canvas.offsetHeight;
        cropCanvas.style.width = canvas.style.width || canvas.offsetWidth + "px";
        cropCanvas.style.height = canvas.style.height || canvas.offsetHeight + "px";
        document.getElementById("btn-crop-apply").disabled = true;
        document.getElementById("btn-crop-cancel").style.display = "inline-block";
        document.getElementById("blur-cursor").style.display = "none";
        document.getElementById("btn-blur-cancel").style.display = "none";
    });

    document.getElementById("btn-blur-start").addEventListener("click", function() {
        if (blurMode) {
            blurMode = false;
            this.classList.remove("active");
            document.getElementById("blur-cursor").style.display = "none";
            canvas.style.cursor = "default";
            return;
        }
        if (textOverlayApplied) saveState();
        finalizeTextOverlay(false);
        clearLastTextObject();
        drawMode = false;
        cropMode = false;
        watermarkMode = false;
        document.getElementById("btn-watermark-apply").style.display = "none";
        document.getElementById("btn-watermark-cancel").style.display = "none";
        document.getElementById("btn-draw-mode").classList.remove("active");
        this.classList.add("active");
        cropCanvas.style.display = "none";
        blurMode = true;
        isSelecting = false;
        cropStart = null;
        cropEnd = null;
        var cursorEl = document.getElementById("blur-cursor");
        cursorEl.style.display = "block";
        updateBlurCursorSize();
        canvas.style.cursor = "none";
    });

    document.getElementById("btn-crop-cancel").addEventListener("click", function() {
        cropMode = false;
        isSelecting = false;
        cropCanvas.style.display = "none";
        document.getElementById("btn-crop-cancel").style.display = "none";
    });

    document.getElementById("btn-blur-cancel").addEventListener("click", function() {
        blurMode = false;
        document.getElementById("btn-blur-start").classList.remove("active");
        document.getElementById("blur-cursor").style.display = "none";
        document.getElementById("btn-blur-cancel").style.display = "none";
        canvas.style.cursor = "default";
    });

    function updateBlurCursorSize() {
        var blurSize = parseInt(document.getElementById("blur-size").value, 10) || 30;
        var sizePx = Math.max(20, blurSize * 2);
        var el = document.getElementById("blur-cursor");
        el.style.width = sizePx + "px";
        el.style.height = sizePx + "px";
    }

    document.getElementById("btn-crop-apply").addEventListener("click", function() {
        if (!cropStart || !cropEnd) return;
        const dispW = canvas.offsetWidth;
        const dispH = canvas.offsetHeight;
        const scaleX = workCanvas.width / dispW;
        const scaleY = workCanvas.height / dispH;
        const dx1 = Math.min(cropStart.x, cropEnd.x);
        const dy1 = Math.min(cropStart.y, cropEnd.y);
        const dx2 = Math.max(cropStart.x, cropEnd.x);
        const dy2 = Math.max(cropStart.y, cropEnd.y);
        const x = Math.floor(dx1 * scaleX);
        const y = Math.floor(dy1 * scaleY);
        const w = Math.floor((dx2 - dx1) * scaleX);
        const h = Math.floor((dy2 - dy1) * scaleY);
        if (w < 2 || h < 2) return;
        saveState();
        const newCanvas = document.createElement("canvas");
        newCanvas.width = w;
        newCanvas.height = h;
        const newCtx = newCanvas.getContext("2d");
        newCtx.drawImage(workCanvas, x, y, w, h, 0, 0, w, h);
        workCanvas = newCanvas;
        workCtx = workCanvas.getContext("2d");
        resetFilters();
        drawToDisplay();
        updateResizeInputs();
        cropMode = false;
        cropCanvas.style.display = "none";
        document.getElementById("btn-crop-apply").disabled = true;
        document.getElementById("btn-crop-cancel").style.display = "none";
        clearLastTextObject();
        updateResetButton();
    });

    function drawCropSelection() {
        if (!cropStart || !cropEnd) return;
        cropCtx.clearRect(0, 0, cropCanvas.width, cropCanvas.height);
        cropCtx.fillStyle = "rgba(0,0,0,0.5)";
        cropCtx.fillRect(0, 0, cropCanvas.width, cropCanvas.height);
        var x = Math.min(cropStart.x, cropEnd.x);
        var y = Math.min(cropStart.y, cropEnd.y);
        var w = Math.abs(cropEnd.x - cropStart.x);
        var h = Math.abs(cropEnd.y - cropStart.y);
        cropCtx.globalCompositeOperation = "destination-out";
        cropCtx.fillRect(x, y, w, h);
        cropCtx.globalCompositeOperation = "source-over";
        cropCtx.strokeStyle = "#007BFF";
        cropCtx.lineWidth = 2;
        cropCtx.strokeRect(x, y, w, h);
    }

    function getMousePos(e) {
        const rect = canvas.getBoundingClientRect();
        return { x: e.clientX - rect.left, y: e.clientY - rect.top };
    }
    function getCropMousePos(e) {
        const rect = cropCanvas.getBoundingClientRect();
        return { x: e.clientX - rect.left, y: e.clientY - rect.top };
    }

    cropCanvas.addEventListener("mousedown", function(e) {
        if (!cropMode) return;
        var pos = getCropMousePos(e);
        if (!isSelecting) {
            cropStart = { x: pos.x, y: pos.y };
            cropEnd = { x: pos.x, y: pos.y };
            isSelecting = true;
            document.getElementById("btn-crop-apply").disabled = false;
        } else {
            isSelecting = false;
        }
        drawCropSelection();
    });

    function constrainCropEnd() {
        var val = document.getElementById("crop-ratio").value;
        if (val === "free" || !cropStart || !cropEnd) return;
        var r = val.split(":");
        var ratio = parseFloat(r[0]) / parseFloat(r[1]);
        var w = cropEnd.x - cropStart.x;
        var h = cropEnd.y - cropStart.y;
        if (Math.abs(w) < 2 && Math.abs(h) < 2) return;
        var sw = w >= 0 ? 1 : -1, sh = h >= 0 ? 1 : -1;
        w = Math.abs(w);
        h = Math.abs(h);
        var nw, nh;
        if (w / h >= ratio) {
            nw = w;
            nh = w / ratio;
        } else {
            nh = h;
            nw = h * ratio;
        }
        cropEnd = { x: cropStart.x + nw * sw, y: cropStart.y + nh * sh };
    }

    cropCanvas.addEventListener("mousemove", function(e) {
        if (!cropMode || !isSelecting || !cropStart) return;
        var pos = getCropMousePos(e);
        cropEnd = { x: pos.x, y: pos.y };
        constrainCropEnd();
        drawCropSelection();
    });

    cropCanvas.addEventListener("mouseup", function(e) {
        if (!cropMode || !isSelecting) return;
        var pos = getCropMousePos(e);
        cropEnd = { x: pos.x, y: pos.y };
        isSelecting = false;
        drawCropSelection();
    });

    cropCanvas.addEventListener("mouseleave", function() {
        if (isSelecting && cropMode) {
            isSelecting = false;
            drawCropSelection();
        }
    });

    var blurThrottle = null;
    var blurPending = null;
    var blurTemp1 = null;
    var blurTemp2 = null;
    function applyBlurAt(cxWork, cyWork, scaleX) {
        var blurSize = parseInt(document.getElementById("blur-size").value, 10) || 30;
        var blurRad = parseInt(document.getElementById("blur-radius").value, 10) || 6;
        var rWork = Math.max(4, blurSize * (scaleX || 1));
        var blurPx = Math.max(1, Math.min(10, Math.round(blurRad * 0.4) || 1));
        var pad = blurPx * 3;
        var x0 = Math.max(0, Math.floor(cxWork - rWork - pad));
        var y0 = Math.max(0, Math.floor(cyWork - rWork - pad));
        var x1 = Math.min(workCanvas.width, Math.ceil(cxWork + rWork + pad));
        var y1 = Math.min(workCanvas.height, Math.ceil(cyWork + rWork + pad));
        var regW = x1 - x0;
        var regH = y1 - y0;
        if (regW < 4 || regH < 4) return;
        var needSize = Math.max(regW, regH, 64);
        if (!blurTemp1 || blurTemp1.width < needSize) {
            blurTemp1 = document.createElement("canvas");
            blurTemp1.width = blurTemp1.height = Math.max(needSize, 256);
            blurTemp2 = document.createElement("canvas");
            blurTemp2.width = blurTemp2.height = blurTemp1.width;
        }
        var ctx1 = blurTemp1.getContext("2d");
        var ctx2 = blurTemp2.getContext("2d");
        ctx1.drawImage(workCanvas, x0, y0, regW, regH, 0, 0, regW, regH);
        ctx2.filter = "blur(" + blurPx + "px)";
        ctx2.drawImage(blurTemp1, 0, 0, regW, regH, 0, 0, regW, regH);
        ctx2.filter = "none";
        workCtx.save();
        workCtx.beginPath();
        workCtx.arc(cxWork, cyWork, rWork, 0, Math.PI * 2);
        workCtx.clip();
        workCtx.drawImage(blurTemp2, 0, 0, regW, regH, x0, y0, regW, regH);
        workCtx.restore();
    }
    function scheduleBlurApply(cxWork, cyWork, scaleX) {
        blurPending = { cxWork: cxWork, cyWork: cyWork, scaleX: scaleX };
        if (blurThrottle) return;
        blurThrottle = requestAnimationFrame(function() {
            blurThrottle = null;
            if (blurPending) {
                var p = blurPending;
                blurPending = null;
                applyBlurAt(p.cxWork, p.cyWork, p.scaleX);
                drawToDisplay();
            }
        });
    }

    var wrapperEl = document.getElementById("canvas-wrapper");
    function updateBlurCursorPos(clientX, clientY) {
        if (!blurMode) return;
        var rect = wrapperEl.getBoundingClientRect();
        var cur = document.getElementById("blur-cursor");
        cur.style.left = (clientX - rect.left) + "px";
        cur.style.top = (clientY - rect.top) + "px";
    }
    wrapperEl.addEventListener("mousemove", function(e) {
        updateBlurCursorPos(e.clientX, e.clientY);
    });
    wrapperEl.addEventListener("touchmove", function(e) {
        if (blurMode && e.touches.length > 0) {
            updateBlurCursorPos(e.touches[0].clientX, e.touches[0].clientY);
        }
    }, { passive: true });
    wrapperEl.addEventListener("mouseleave", function() {
        if (blurMode) document.getElementById("blur-cursor").style.visibility = "hidden";
    });
    wrapperEl.addEventListener("mouseenter", function() {
        if (blurMode) document.getElementById("blur-cursor").style.visibility = "visible";
    });

    document.getElementById("filter-brightness").addEventListener("input", function() {
        brightness = parseInt(this.value);
        document.getElementById("brightness-val").textContent = brightness + "%";
        drawToDisplay();
        updateResetButton();
    });
    document.getElementById("filter-contrast").addEventListener("input", function() {
        contrast = parseInt(this.value);
        document.getElementById("contrast-val").textContent = contrast + "%";
        drawToDisplay();
        updateResetButton();
    });

    document.getElementById("filter-saturation").addEventListener("input", function() {
        saturation = parseInt(this.value);
        document.getElementById("saturation-val").textContent = saturation + "%";
        drawToDisplay();
        updateResetButton();
    });

    document.getElementById("btn-grayscale").addEventListener("click", function() {
        saveState();
        const imgData = workCtx.getImageData(0, 0, workCanvas.width, workCanvas.height);
        const data = imgData.data;
        for (let i = 0; i < data.length; i += 4) {
            const g = data[i] * 0.299 + data[i + 1] * 0.587 + data[i + 2] * 0.114;
            data[i] = data[i + 1] = data[i + 2] = g;
        }
        workCtx.putImageData(imgData, 0, 0);
        drawToDisplay();
        updateResetButton();
    });

    document.getElementById("btn-sepia").addEventListener("click", function() {
        saveState();
        const imgData = workCtx.getImageData(0, 0, workCanvas.width, workCanvas.height);
        const data = imgData.data;
        for (let i = 0; i < data.length; i += 4) {
            const r = data[i], g = data[i + 1], b = data[i + 2];
            data[i] = Math.min(255, r * 0.393 + g * 0.769 + b * 0.189);
            data[i + 1] = Math.min(255, r * 0.349 + g * 0.686 + b * 0.168);
            data[i + 2] = Math.min(255, r * 0.272 + g * 0.534 + b * 0.131);
        }
        workCtx.putImageData(imgData, 0, 0);
        drawToDisplay();
        updateResetButton();
    });

    document.getElementById("btn-invert").addEventListener("click", function() {
        saveState();
        const imgData = workCtx.getImageData(0, 0, workCanvas.width, workCanvas.height);
        const data = imgData.data;
        for (let i = 0; i < data.length; i += 4) {
            data[i] = 255 - data[i];
            data[i + 1] = 255 - data[i + 1];
            data[i + 2] = 255 - data[i + 2];
        }
        workCtx.putImageData(imgData, 0, 0);
        drawToDisplay();
        updateResetButton();
    });

    document.getElementById("btn-sharpen").addEventListener("click", function() {
        saveState();
        const imgData = workCtx.getImageData(0, 0, workCanvas.width, workCanvas.height);
        const data = imgData.data;
        const w = workCanvas.width, h = workCanvas.height;
        const kernel = [0, -1, 0, -1, 5, -1, 0, -1, 0];
        const out = new Uint8ClampedArray(data.length);
        for (let y = 1; y < h - 1; y++) {
            for (let x = 1; x < w - 1; x++) {
                let r = 0, g = 0, b = 0;
                for (let ky = -1; ky <= 1; ky++)
                    for (let kx = -1; kx <= 1; kx++) {
                        const i = ((y + ky) * w + (x + kx)) * 4;
                        const k = kernel[(ky + 1) * 3 + (kx + 1)];
                        r += data[i] * k; g += data[i + 1] * k; b += data[i + 2] * k;
                    }
                const i = (y * w + x) * 4;
                out[i] = Math.min(255, Math.max(0, r));
                out[i + 1] = Math.min(255, Math.max(0, g));
                out[i + 2] = Math.min(255, Math.max(0, b));
                out[i + 3] = data[i + 3];
            }
        }
        workCtx.putImageData(new ImageData(out, w, h), 0, 0);
        drawToDisplay();
        updateResetButton();
    });

    function getTextStyleFont() {
        var font = document.getElementById("watermark-font").value || "Arial";
        var fontSize = parseInt(document.getElementById("text-size").value, 10) || 36;
        fontSize = Math.max(12, Math.min(200, fontSize));
        var parts = [];
        if (document.getElementById("text-bold").classList.contains("active")) parts.push("bold");
        if (document.getElementById("text-italic").classList.contains("active")) parts.push("italic");
        if (parts.length === 0) parts.push("normal");
        return parts.join(" ") + " " + fontSize + "px " + font;
    }

    function getDisplayText() {
        var text = document.getElementById("text-box-input").value;
        if (document.getElementById("text-uppercase").classList.contains("active")) text = text.toUpperCase();
        return text;
    }

    function burnWatermark(skipSave) {
        var text = document.getElementById("text-box-input").value.trim();
        if (!text) return;
        if (!skipSave) saveState();
        var textColor = document.getElementById("text-color").value || "#000000";
        workCtx.save();
        var overlay = document.getElementById("text-box-overlay");
        var canvasRect = canvas.getBoundingClientRect();
        var overlayRect = overlay.getBoundingClientRect();
        var cx = (overlayRect.left - canvasRect.left + overlayRect.width / 2) / canvasRect.width;
        var cy = (overlayRect.top - canvasRect.top + overlayRect.height / 2) / canvasRect.height;
        var x = cx * workCanvas.width;
        var y = cy * workCanvas.height;
        var displayText = getDisplayText().trim();
        workCtx.font = getTextStyleFont();
        workCtx.fillStyle = textColor;
        workCtx.strokeStyle = "rgba(0,0,0,0.5)";
        workCtx.lineWidth = 2;
        workCtx.textAlign = "center";
        workCtx.textBaseline = "middle";
        workCtx.strokeText(displayText, x, y);
        workCtx.fillText(displayText, x, y);
        workCtx.restore();
    }

    function reburnText() {
        if (!canvasBeforeTextBuffer || !textOverlayApplied) return;
        var text = document.getElementById("text-box-input").value.trim();
        if (!text) return;
        workCtx.drawImage(canvasBeforeTextBuffer, 0, 0);
        burnWatermark(true);
        drawToDisplay();
    }

    function applyAndHideTextOverlay() {
        var overlay = document.getElementById("text-box-overlay");
        if (overlay.style.display !== "block") return;
        var text = document.getElementById("text-box-input").value.trim();
        if (text) {
            if (!textOverlayApplied) {
                canvasBeforeTextBuffer = document.createElement("canvas");
                canvasBeforeTextBuffer.width = workCanvas.width;
                canvasBeforeTextBuffer.height = workCanvas.height;
                canvasBeforeTextBuffer.getContext("2d").drawImage(workCanvas, 0, 0);
                burnWatermark(true);
            } else {
                workCtx.drawImage(canvasBeforeTextBuffer, 0, 0);
                burnWatermark(true);
            }
            drawToDisplay();
            var canvasRect = canvas.getBoundingClientRect();
            var overlayRect = overlay.getBoundingClientRect();
            var cx = (overlayRect.left - canvasRect.left + overlayRect.width / 2) / canvasRect.width;
            var cy = (overlayRect.top - canvasRect.top + overlayRect.height / 2) / canvasRect.height;
            var displayText = getDisplayText().trim();
            workCtx.font = getTextStyleFont();
            var tw = workCtx.measureText(displayText).width;
            var fontSize = parseInt(document.getElementById("text-size").value, 10) || 36;
            lastTextObject = {
                text: text,
                cx: cx * workCanvas.width, cy: cy * workCanvas.height,
                fontSize: fontSize,
                font: document.getElementById("watermark-font").value || "Arial",
                textWidth: tw,
                bold: document.getElementById("text-bold").classList.contains("active"),
                italic: document.getElementById("text-italic").classList.contains("active"),
                uppercase: document.getElementById("text-uppercase").classList.contains("active")
            };
            if (!cropMode && !blurMode && !drawMode) canvas.style.cursor = "pointer";
        } else if (textOverlayApplied) {
            workCtx.drawImage(canvasBeforeTextBuffer, 0, 0);
            drawToDisplay();
            lastTextObject = null;
        }
        if (text) updateResetButton();
        finalizeTextOverlay(!!text, !!text);
    }

    function showOverlayForEdit(cx, cy) {
        var overlay = document.getElementById("text-box-overlay");
        var wrapper = document.getElementById("canvas-wrapper");
        if (!canvasBeforeTextBuffer) return;
        document.getElementById("text-box-input").value = lastTextObject.text;
        document.getElementById("text-bold").classList.toggle("active", !!lastTextObject.bold);
        document.getElementById("text-italic").classList.toggle("active", !!lastTextObject.italic);
        document.getElementById("text-uppercase").classList.toggle("active", !!lastTextObject.uppercase);
        var rect = wrapper.getBoundingClientRect();
        var crect = canvas.getBoundingClientRect();
        var tx = (cx / workCanvas.width) * crect.width;
        var ty = (cy / workCanvas.height) * crect.height;
        var ox = (crect.left - rect.left + wrapper.scrollLeft) + tx - overlay.offsetWidth / 2;
        var oy = (crect.top - rect.top + wrapper.scrollTop) + ty - overlay.offsetHeight / 2;
        overlay.style.left = ox + "px";
        overlay.style.top = oy + "px";
        overlay.style.transform = "none";
        overlay.style.width = "220px";
        overlay.style.height = "100px";
        overlay.style.display = "block";
        document.getElementById("btn-watermark-apply").style.display = "inline-block";
        document.getElementById("btn-watermark-cancel").style.display = "inline-block";
        watermarkMode = true;
        textOverlayApplied = true;
        canvas.style.cursor = "default";
        document.getElementById("text-box-input").focus();
    }

    function finalizeTextOverlay(saveToHistory, preserveBuffer) {
        var overlay = document.getElementById("text-box-overlay");
        if (textOverlayApplied && saveToHistory) saveState();
        overlay.style.display = "none";
        document.getElementById("btn-watermark-apply").style.display = "none";
        document.getElementById("btn-watermark-cancel").style.display = "none";
        watermarkMode = false;
        textOverlayApplied = false;
        if (!preserveBuffer) canvasBeforeTextBuffer = null;
    }

    function clearLastTextObject() {
        lastTextObject = null;
        if (!blurMode && !drawMode) canvas.style.cursor = "default";
    }

    function showAlertModal(msg) {
        var modal = document.getElementById("alert-modal");
        var title = document.getElementById("alert-modal-title");
        if (modal && title) {
            title.textContent = msg;
            modal.style.display = "flex";
        }
    }
    var alertModal = document.getElementById("alert-modal");
    var alertModalOk = document.getElementById("alert-modal-ok");
    var alertModalBackdrop = alertModal && alertModal.querySelector(".alert-modal-backdrop");
    if (alertModalOk) alertModalOk.addEventListener("click", function() {
        if (alertModal) alertModal.style.display = "none";
    });
    if (alertModalBackdrop) alertModalBackdrop.addEventListener("click", function() {
        if (alertModal) alertModal.style.display = "none";
    });
    document.addEventListener("keydown", function alertModalKeydown(e) {
        if (e.key === "Escape" && alertModal && alertModal.style.display === "flex") {
            alertModal.style.display = "none";
        }
    });

    document.getElementById("btn-watermark").addEventListener("click", function() {
        if (!workCanvas) { showAlertModal(t("Carica prima un'immagine.", "Load an image first.")); return; }
        if (textOverlayApplied) saveState();
        finalizeTextOverlay(false);
        clearLastTextObject();
        var overlay = document.getElementById("text-box-overlay");
        document.getElementById("text-box-input").value = "";
        document.getElementById("text-bold").classList.remove("active");
        document.getElementById("text-italic").classList.remove("active");
        document.getElementById("text-uppercase").classList.remove("active");
        overlay.style.display = "block";
        overlay.style.left = "50%";
        overlay.style.top = "50%";
        overlay.style.transform = "translate(-50%, -50%)";
        overlay.style.width = "220px";
        overlay.style.height = "100px";
        document.getElementById("text-box-input").focus();
        watermarkMode = true;
        textOverlayApplied = false;
        canvasBeforeTextBuffer = null;
        document.getElementById("btn-watermark-apply").style.display = "inline-block";
        document.getElementById("btn-watermark-cancel").style.display = "inline-block";
    });

    document.getElementById("btn-watermark-apply").addEventListener("click", function(e) {
        e.stopPropagation();
        var text = document.getElementById("text-box-input").value.trim();
        if (!text) return;
        applyAndHideTextOverlay();
    });

    document.getElementById("btn-watermark-cancel").addEventListener("click", function() {
        if (textOverlayApplied && canvasBeforeTextBuffer) {
            workCtx.drawImage(canvasBeforeTextBuffer, 0, 0);
            drawToDisplay();
        }
        finalizeTextOverlay(false);
        clearLastTextObject();
    });

    (function initTextBoxDrag() {
        var overlay = document.getElementById("text-box-overlay");
        var input = document.getElementById("text-box-input");
        var dragHandle = overlay.querySelector(".text-box-drag-handle");
        var resizeHandle = overlay.querySelector(".text-box-resize-handle");
        var wrapper = document.getElementById("canvas-wrapper");
        var dragging = false, resizing = false, startX, startY, startLeft, startTop, startW, startH;
        dragHandle.addEventListener("mousedown", function(e) {
            e.preventDefault();
            dragging = true;
            startX = e.clientX;
            startY = e.clientY;
            var wr = wrapper.getBoundingClientRect();
            var or = overlay.getBoundingClientRect();
            startLeft = or.left - wr.left;
            startTop = or.top - wr.top;
        });
        resizeHandle.addEventListener("mousedown", function(e) {
            e.preventDefault();
            e.stopPropagation();
            resizing = true;
            startX = e.clientX;
            startY = e.clientY;
            startW = overlay.offsetWidth;
            startH = overlay.offsetHeight;
        });
        document.addEventListener("mousemove", function(e) {
            if (dragging) {
                var dx = e.clientX - startX;
                var dy = e.clientY - startY;
                overlay.style.left = (startLeft + dx) + "px";
                overlay.style.top = (startTop + dy) + "px";
                overlay.style.transform = "none";
            } else if (resizing) {
                var dw = e.clientX - startX;
                var dh = e.clientY - startY;
                var nw = Math.max(120, Math.min(500, startW + dw));
                var nh = Math.max(60, Math.min(300, startH + dh));
                overlay.style.width = nw + "px";
                overlay.style.height = nh + "px";
            }
        });
        document.addEventListener("mouseup", function() {
            if (dragging || resizing) reburnText();
            dragging = false;
            resizing = false;
        });
        input.addEventListener("mousedown", function(e) { e.stopPropagation(); });
        document.addEventListener("mousedown", function(e) {
            if (overlay.style.display !== "block") return;
            if (overlay.contains(e.target)) return;
            if (e.target.closest && e.target.closest(".toolbar")) return;
            applyAndHideTextOverlay();
        });
        input.addEventListener("input", function() {
            if (textOverlayApplied) reburnText();
        });
    })();
    document.getElementById("watermark-font").addEventListener("change", function() {
        if (textOverlayApplied) reburnText();
    });
    document.getElementById("text-color").addEventListener("input", function() {
        if (textOverlayApplied) reburnText();
    });
    document.getElementById("text-size").addEventListener("input", function() {
        document.getElementById("text-size-val").textContent = this.value;
        if (textOverlayApplied) reburnText();
    });
    document.getElementById("text-bold").addEventListener("click", function() {
        this.classList.toggle("active");
        if (textOverlayApplied) reburnText();
    });
    document.getElementById("text-italic").addEventListener("click", function() {
        this.classList.toggle("active");
        if (textOverlayApplied) reburnText();
    });
    document.getElementById("text-uppercase").addEventListener("click", function() {
        this.classList.toggle("active");
        if (textOverlayApplied) reburnText();
    });
    document.getElementById("text-emoji-btn").addEventListener("click", function(e) {
        e.stopPropagation();
        document.querySelector(".text-emoji-wrap").classList.toggle("open");
    });
    document.getElementById("text-emoji-picker").addEventListener("click", function(e) {
        e.stopPropagation();
    });
    document.querySelectorAll("#text-emoji-picker .emoji").forEach(function(el) {
        el.addEventListener("click", function(e) {
            e.preventDefault();
            e.stopPropagation();
            var input = document.getElementById("text-box-input");
            var emoji = this.getAttribute("data-emoji") || this.textContent;
            var start = typeof input.selectionStart === "number" ? input.selectionStart : 0;
            var end = typeof input.selectionEnd === "number" ? input.selectionEnd : start;
            var val = input.value;
            input.value = val.slice(0, start) + emoji + val.slice(end);
            var newPos = start + (Array.from(emoji).length);
            input.selectionStart = input.selectionEnd = newPos;
            input.focus();
            document.querySelector(".text-emoji-wrap").classList.remove("open");
            input.dispatchEvent(new Event("input", { bubbles: true }));
            if (textOverlayApplied) reburnText();
        });
    });
    document.addEventListener("click", function() {
        document.querySelectorAll(".text-emoji-wrap.open").forEach(function(w) { w.classList.remove("open"); });
    });

    function updateZoomDisplay() {
        var el = document.getElementById("zoom-val");
        if (el) el.textContent = zoomLevel + "%";
    }
    function setZoom(nextZoom) {
        var clamped = Math.max(25, Math.min(400, nextZoom));
        if (clamped === zoomLevel) return;
        zoomLevel = clamped;
        updateZoomDisplay();
        drawToDisplay();
    }
    document.getElementById("zoom-out").addEventListener("click", function() {
        setZoom(zoomLevel - 25);
        panX = 0;
        panY = 0;
    });
    document.getElementById("zoom-in").addEventListener("click", function() {
        setZoom(zoomLevel + 25);
    });
    document.getElementById("zoom-fit").addEventListener("click", function() {
        setZoom(100);
        panX = 0;
        panY = 0;
    });
    // Disable ctrl/cmd+wheel zoom inside editor area.
    if (wrapperEl) {
        wrapperEl.addEventListener("wheel", function(e) {
            if (!workCanvas) return;
            if (!(e.ctrlKey || e.metaKey)) return;
            e.preventDefault();
        }, { passive: false });
    }

    document.getElementById("btn-border").addEventListener("click", function() {
        const size = parseInt(document.getElementById("border-size").value) || 5;
        const color = document.getElementById("border-color").value;
        if (size < 1) return;
        saveState();
        const newCanvas = document.createElement("canvas");
        newCanvas.width = workCanvas.width + size * 2;
        newCanvas.height = workCanvas.height + size * 2;
        const newCtx = newCanvas.getContext("2d");
        newCtx.fillStyle = color;
        newCtx.fillRect(0, 0, newCanvas.width, newCanvas.height);
        newCtx.drawImage(workCanvas, size, size);
        workCanvas = newCanvas;
        workCtx = workCanvas.getContext("2d");
        updateResizeInputs();
        drawToDisplay();
        updateResetButton();
    });

    function callImageApi(url, onSuccess, onError) {
        if (!workCanvas) {
            showAlertModal(t("Carica prima un'immagine.", "Please load an image first."));
            return;
        }
        workCanvas.toBlob(function(blob) {
            if (!blob) {
                onError(t("Impossibile creare l'immagine. Prova un'immagine più piccola o un formato diverso.", "Could not create image. Try a smaller image or different format."));
                return;
            }
            const fd = new FormData();
            fd.append("image", blob, "image.png");
            const msgEl = document.createElement("div");
            msgEl.className = "image-api-loading";
            msgEl.textContent = t("Elaborazione…", "Processing…");
            msgEl.style.cssText = "position:fixed;top:50%;left:50%;transform:translate(-50%,-50%);background:#003f7f;color:white;padding:16px 24px;border-radius:12px;z-index:9999;font-weight:600;";
            document.body.appendChild(msgEl);
            fetch(url, { method: "POST", body: fd })
                .then(function(r) {
                    if (!r.ok) {
                        return r.text().then(function(text) {
                            try {
                                var d = JSON.parse(text);
                                throw new Error(d.error || "Request failed");
                            } catch (parseErr) {
                                if (parseErr instanceof Error && parseErr.message && parseErr.message !== "Request failed") {
                                    throw parseErr;
                                }
                                throw new Error(t("Errore server", "Server error") + " " + r.status + ". " + t("Per Remove BG esegui", "For Remove BG run") + ": pip install \"rembg[cpu]\"");
                            }
                        });
                    }
                    return r.blob();
                })
                .then(function(blob) {
                    if (msgEl.parentNode) document.body.removeChild(msgEl);
                    const img = new Image();
                    img.onload = function() {
                        saveState();
                        createWorkCanvas(img.width, img.height);
                        workCtx.drawImage(img, 0, 0);
                        updateResizeInputs();
                        drawToDisplay();
                        if (onSuccess) onSuccess();
                    };
                    img.onerror = function() { onError(t("Impossibile caricare l'immagine risultato", "Failed to load result image")); };
                    img.src = URL.createObjectURL(blob);
                })
                .catch(function(err) {
                    if (msgEl.parentNode) document.body.removeChild(msgEl);
                    onError(err.message || t("Richiesta fallita", "Request failed"));
                });
        }, "image/png");
    }

    document.getElementById("btn-undo").addEventListener("click", function() {
        if (history.length < 1) return;
        redoStack.push(workCanvas.toDataURL());
        const prev = history.pop();
        restoreState(prev);
    });

    document.getElementById("btn-redo").addEventListener("click", function() {
        if (redoStack.length < 1) return;
        history.push(workCanvas.toDataURL());
        const next = redoStack.pop();
        restoreState(next);
    });

    document.getElementById("btn-draw-mode").addEventListener("click", function() {
        if (textOverlayApplied) saveState();
        finalizeTextOverlay(false);
        clearLastTextObject();
        drawMode = !drawMode;
        blurMode = false;
        cropMode = false;
        watermarkMode = false;
        document.getElementById("btn-blur-start").classList.remove("active");
        document.getElementById("blur-cursor").style.display = "none";
        document.getElementById("btn-blur-cancel").style.display = "none";
        document.getElementById("btn-watermark-apply").style.display = "none";
        document.getElementById("btn-watermark-cancel").style.display = "none";
        cropCanvas.style.display = "none";
        this.classList.toggle("active", drawMode);
        canvas.style.cursor = drawMode ? "crosshair" : "default";
    });

    document.getElementById("brush-size").addEventListener("input", function() {
        document.getElementById("brush-size-val").textContent = this.value;
    });
    document.getElementById("blur-size").addEventListener("input", function() {
        document.getElementById("blur-size-val").textContent = this.value;
        if (blurMode) updateBlurCursorSize();
    });
    document.getElementById("blur-radius").addEventListener("input", function() {
        document.getElementById("blur-radius-val").textContent = this.value;
    });

    canvas.addEventListener("mousedown", function(e) {
        var overlay = document.getElementById("text-box-overlay");
        if (!cropMode && !blurMode && !drawMode && overlay.style.display !== "block" && lastTextObject) {
            var rect = canvas.getBoundingClientRect();
            var scaleX = workCanvas.width / rect.width;
            var scaleY = workCanvas.height / rect.height;
            var wx = (e.clientX - rect.left) * scaleX;
            var wy = (e.clientY - rect.top) * scaleY;
            var hw = (lastTextObject.textWidth || 50) / 2 + 2;
            var hh = (lastTextObject.fontSize || 36) / 2 + 2;
            if (Math.abs(wx - lastTextObject.cx) <= hw && Math.abs(wy - lastTextObject.cy) <= hh) {
                e.preventDefault();
                e.stopPropagation();
                showOverlayForEdit(lastTextObject.cx, lastTextObject.cy);
                return;
            }
        }
        if (zoomLevel > 100 && !cropMode && !blurMode && !drawMode && !watermarkMode) {
            isPanning = true;
            panStartX = e.clientX;
            panStartY = e.clientY;
            panStartOffsetX = panX;
            panStartOffsetY = panY;
            canvas.style.cursor = "grab";
            return;
        }
        if (watermarkMode) {
            isDraggingWatermark = true;
            var rect = canvas.getBoundingClientRect();
            watermarkX = (e.clientX - rect.left) / rect.width;
            watermarkY = (e.clientY - rect.top) / rect.height;
            drawToDisplay();
            return;
        }
        if (blurMode) {
            if (!isDrawing) saveState();
            isDrawing = true;
            var rect = canvas.getBoundingClientRect();
            var scaleX = workCanvas.width / rect.width;
            var scaleY = workCanvas.height / rect.height;
            var x = (e.clientX - rect.left) * scaleX;
            var y = (e.clientY - rect.top) * scaleY;
            applyBlurAt(x, y, scaleX);
            drawToDisplay();
            return;
        }
        if (!drawMode || cropMode) return;
        if (!isDrawing) saveState();
        isDrawing = true;
        var rect = canvas.getBoundingClientRect();
        var scaleX = workCanvas.width / rect.width;
        var scaleY = workCanvas.height / rect.height;
        var x = Math.floor((e.clientX - rect.left) * scaleX);
        var y = Math.floor((e.clientY - rect.top) * scaleY);
        workCtx.fillStyle = document.getElementById("brush-color").value;
        workCtx.beginPath();
        workCtx.arc(x, y, parseInt(document.getElementById("brush-size").value) / 2, 0, Math.PI * 2);
        workCtx.fill();
        drawToDisplay();
    });
    canvas.addEventListener("mousemove", function(e) {
        if (isPanning) {
            panX = panStartOffsetX + (e.clientX - panStartX);
            panY = panStartOffsetY + (e.clientY - panStartY);
            drawToDisplay();
            return;
        }
        if (watermarkMode && isDraggingWatermark) {
            var rect = canvas.getBoundingClientRect();
            watermarkX = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
            watermarkY = Math.max(0, Math.min(1, (e.clientY - rect.top) / rect.height));
            drawToDisplay();
            return;
        }
        if (blurMode && isDrawing) {
            var rect = canvas.getBoundingClientRect();
            var scaleX = workCanvas.width / rect.width;
            var scaleY = workCanvas.height / rect.height;
            var x = (e.clientX - rect.left) * scaleX;
            var y = (e.clientY - rect.top) * scaleY;
            scheduleBlurApply(x, y, scaleX);
            return;
        }
        if (!drawMode || !isDrawing || cropMode) return;
        var rect = canvas.getBoundingClientRect();
        var scaleX = workCanvas.width / rect.width;
        var scaleY = workCanvas.height / rect.height;
        var x = Math.floor((e.clientX - rect.left) * scaleX);
        var y = Math.floor((e.clientY - rect.top) * scaleY);
        workCtx.fillStyle = document.getElementById("brush-color").value;
        workCtx.beginPath();
        workCtx.arc(x, y, parseInt(document.getElementById("brush-size").value) / 2, 0, Math.PI * 2);
        workCtx.fill();
        drawToDisplay();
    });
    canvas.addEventListener("mouseup", function() {
        if (isPanning) {
            isPanning = false;
            canvas.style.cursor = zoomLevel > 100 ? "grab" : "default";
        }
        if (blurMode && blurPending) {
            applyBlurAt(blurPending.cxWork, blurPending.cyWork, blurPending.scaleX);
            blurPending = null;
            if (blurThrottle) { cancelAnimationFrame(blurThrottle); blurThrottle = null; }
            drawToDisplay();
        }
        if (isDrawing) updateResetButton();
        isDrawing = false;
        isDraggingWatermark = false;
    });
    canvas.addEventListener("mouseleave", function() {
        if (isPanning) {
            isPanning = false;
            canvas.style.cursor = zoomLevel > 100 ? "grab" : "default";
        }
        if (isDrawing) updateResetButton();
        isDrawing = false;
        isDraggingWatermark = false;
    });

    function getCanvasCoords(e) {
        var rect = canvas.getBoundingClientRect();
        var clientX = e.touches ? e.touches[0].clientX : e.clientX;
        var clientY = e.touches ? e.touches[0].clientY : e.clientY;
        return { x: clientX - rect.left, y: clientY - rect.top, rect: rect };
    }
    function handleBlurPointerDown(x, y, rect) {
        if (!blurMode) return;
        if (!isDrawing) saveState();
        isDrawing = true;
        var scaleX = workCanvas.width / rect.width;
        var scaleY = workCanvas.height / rect.height;
        var wx = x * scaleX;
        var wy = y * scaleY;
        applyBlurAt(wx, wy, scaleX);
        drawToDisplay();
    }
    function handleBlurPointerMove(x, y, rect) {
        if (!blurMode || !isDrawing) return;
        var scaleX = workCanvas.width / rect.width;
        var wx = x * scaleX;
        var wy = y * scaleY;
        scheduleBlurApply(wx, wy, scaleX);
    }
    canvas.addEventListener("touchstart", function(e) {
        if (!blurMode || !workCanvas) return;
        var c = getCanvasCoords(e);
        if (c.x >= 0 && c.x <= c.rect.width && c.y >= 0 && c.y <= c.rect.height) {
            handleBlurPointerDown(c.x, c.y, c.rect);
            e.preventDefault();
        }
    }, { passive: false });
    canvas.addEventListener("touchmove", function(e) {
        if (!blurMode || !isDrawing || !workCanvas) return;
        var c = getCanvasCoords(e);
        handleBlurPointerMove(c.x, c.y, c.rect);
        e.preventDefault();
    }, { passive: false });
    canvas.addEventListener("touchend", function(e) {
        if (e.touches.length === 0) {
            if (blurMode && blurPending) {
                applyBlurAt(blurPending.cxWork, blurPending.cyWork, blurPending.scaleX);
                blurPending = null;
                if (blurThrottle) { cancelAnimationFrame(blurThrottle); blurThrottle = null; }
                drawToDisplay();
            }
            if (isDrawing) updateResetButton();
            isDrawing = false;
        }
    });

    function initCustomSelect(wrap) {
        var selectEl = wrap.querySelector("select");
        if (!selectEl) return;
        var trigger = document.createElement("div");
        trigger.className = "custom-select-trigger";
        var span = document.createElement("span");
        span.className = "custom-select-trigger-text";
        span.textContent = selectEl.options[selectEl.selectedIndex].text;
        trigger.appendChild(span);
        var dropdown = document.createElement("div");
        dropdown.className = "custom-select-dropdown";
        function updateDropdown() {
            dropdown.innerHTML = "";
            var currentVal = selectEl.value;
            var showAll = selectEl.options.length > 2;
            for (var i = 0; i < selectEl.options.length; i++) {
                var opt = selectEl.options[i];
                if (!showAll && opt.value === currentVal) continue;
                var div = document.createElement("div");
                div.className = "custom-select-option" + (opt.value === currentVal ? " selected" : "");
                var optSpan = document.createElement("span");
                optSpan.className = "custom-select-option-text";
                optSpan.textContent = opt.text;
                div.appendChild(optSpan);
                div.dataset.value = opt.value;
                div.addEventListener("click", function() {
                    selectEl.value = this.dataset.value;
                    span.textContent = this.textContent;
                    wrap.classList.remove("open");
                    dropdown.style.position = dropdown.style.left = dropdown.style.top = dropdown.style.bottom = dropdown.style.width = dropdown.style.minWidth = dropdown.style.maxWidth = dropdown.style.height = dropdown.style.minHeight = dropdown.style.maxHeight = "";
                    updateDropdown();
                    selectEl.dispatchEvent(new Event("change"));
                });
                dropdown.appendChild(div);
            }
        }
        trigger.addEventListener("click", function(e) {
            e.stopPropagation();
            document.querySelectorAll(".toolbar .custom-select-wrap.open").forEach(function(w) {
                w.classList.remove("open");
                var d = w.querySelector(".custom-select-dropdown");
                if (d) { d.style.position = d.style.left = d.style.top = d.style.bottom = d.style.width = d.style.minWidth = d.style.maxWidth = d.style.height = d.style.minHeight = d.style.maxHeight = ""; }
            });
            updateDropdown();
            wrap.classList.toggle("open");
            if (wrap.classList.contains("open")) {
                var rect = trigger.getBoundingClientRect();
                var spaceBelow = window.innerHeight - rect.bottom;
                var openUp = spaceBelow < 180;
                dropdown.style.position = "fixed";
                dropdown.style.left = rect.left + "px";
                dropdown.style.width = rect.width + "px";
                dropdown.style.minWidth = rect.width + "px";
                dropdown.style.maxWidth = rect.width + "px";
                var optCount = dropdown.querySelectorAll(".custom-select-option").length;
                if (optCount === 1) {
                    dropdown.style.height = rect.height + "px";
                    dropdown.style.minHeight = rect.height + "px";
                    dropdown.style.maxHeight = rect.height + "px";
                } else {
                    dropdown.style.height = dropdown.style.minHeight = dropdown.style.maxHeight = "";
                }
                if (openUp) {
                    dropdown.style.top = "";
                    dropdown.style.bottom = (window.innerHeight - rect.top + 2) + "px";
                } else {
                    dropdown.style.bottom = "";
                    dropdown.style.top = (rect.bottom + 2) + "px";
                }
            } else {
                dropdown.style.position = dropdown.style.left = dropdown.style.top = dropdown.style.bottom = dropdown.style.width = dropdown.style.minWidth = dropdown.style.maxWidth = dropdown.style.height = dropdown.style.minHeight = dropdown.style.maxHeight = "";
            }
        });
        dropdown.addEventListener("click", function(e) {
            e.stopPropagation();
        });
        wrap.insertBefore(trigger, selectEl);
        wrap.appendChild(dropdown);
        document.addEventListener("click", function() {
            if (wrap.classList.contains("open")) {
                wrap.classList.remove("open");
                dropdown.style.position = dropdown.style.left = dropdown.style.top = dropdown.style.bottom = dropdown.style.width = dropdown.style.minWidth = dropdown.style.maxWidth = dropdown.style.height = dropdown.style.minHeight = dropdown.style.maxHeight = "";
            }
        });
    }
    document.querySelectorAll(".toolbar .custom-select-wrap").forEach(function(wrap) {
        initCustomSelect(wrap);
    });

    document.getElementById("btn-download").addEventListener("click", function() {
        const format = document.getElementById("export-format").value;
        const mime = format === "jpeg" ? "image/jpeg" : "image/png";
        const quality = format === "jpeg" ? 0.9 : 1;
        const exportCanvas = document.createElement("canvas");
        exportCanvas.width = workCanvas.width;
        exportCanvas.height = workCanvas.height;
        const exportCtx = exportCanvas.getContext("2d");
        exportCtx.filter = "brightness(" + (brightness / 100) + ") contrast(" + (contrast / 100) + ") saturate(" + (saturation / 100) + ")";
        exportCtx.drawImage(workCanvas, 0, 0);
        const dataUrl = exportCanvas.toDataURL(mime, quality);
        const a = document.createElement("a");
        a.href = dataUrl;
        a.download = "edited-image." + format;
        a.click();
        if (editorToast) {
            editorToast.style.display = "block";
            editorToast.style.animation = "none";
            editorToast.offsetHeight;
            editorToast.style.animation = "toastFade 2.5s ease forwards";
            setTimeout(function() { editorToast.style.display = "none"; }, 2500);
        }
    });

    var resetModal = document.getElementById("reset-confirm-modal");
    var resetConfirmYes = document.getElementById("reset-confirm-yes");
    var resetConfirmNo = document.getElementById("reset-confirm-no");
    var resetConfirmBackdrop = resetModal && resetModal.querySelector(".reset-confirm-backdrop");

    var toolbarSizeBeforeReset = null;

    function doReset() {
        if (!originalImage) return;
        zoomLevel = 100;
        panX = 0;
        panY = 0;
        createWorkCanvas(originalImage.width, originalImage.height);
        workCtx.drawImage(originalImage, 0, 0);
        history.length = 0;
        redoStack.length = 0;
        saveState();
        resetFilters();
        updateResizeInputs();
        drawToDisplay();
        var zoomValEl = document.getElementById("zoom-val");
        if (zoomValEl) zoomValEl.textContent = "100%";
        if (toolbarSizeBeforeReset) {
            var t = document.querySelector(".editor-area .toolbar");
            var w = document.getElementById("toolbar-wrap");
            if (t) {
                document.body.classList.add("toolbar-floated");
                t.style.width = toolbarSizeBeforeReset.width + "px";
                t.style.minWidth = toolbarSizeBeforeReset.width + "px";
                t.style.left = toolbarSizeBeforeReset.left + "px";
                t.style.top = toolbarSizeBeforeReset.top + "px";
                var resBtn = document.getElementById("toolbar-reset-pos");
                if (resBtn) resBtn.classList.add("visible");
            }
            if (w && toolbarSizeBeforeReset.wrapMinHeight) w.style.minHeight = toolbarSizeBeforeReset.wrapMinHeight;
            toolbarUserMoved = true;
            toolbarSizeBeforeReset = null;
        }
        updateResetButton();
    }

    document.getElementById("btn-reset").addEventListener("click", function() {
        if (!originalImage) return;
        if (resetModal) resetModal.style.display = "flex";
    });

    function closeResetModal() {
        if (resetModal) resetModal.style.display = "none";
    }

    if (resetConfirmYes) resetConfirmYes.addEventListener("click", function() {
        var t = document.querySelector(".editor-area .toolbar");
        var wrap = document.getElementById("toolbar-wrap");
        var isFixed = document.body.classList.contains("toolbar-floated");
        if (t && isFixed) {
            var rect = t.getBoundingClientRect();
            toolbarSizeBeforeReset = {
                width: Math.round(rect.width),
                left: Math.round(rect.left),
                top: Math.round(rect.top),
                wrapMinHeight: wrap && wrap.style.minHeight ? wrap.style.minHeight : ""
            };
        } else {
            toolbarSizeBeforeReset = null;
        }
        closeResetModal();
        doReset();
    });
    if (resetConfirmNo) resetConfirmNo.addEventListener("click", closeResetModal);
    if (resetConfirmBackdrop) resetConfirmBackdrop.addEventListener("click", closeResetModal);
    document.addEventListener("keydown", function resetModalKeydown(e) {
        if (e.key === "Escape" && resetModal && resetModal.style.display === "flex") {
            closeResetModal();
        }
    });

    document.getElementById("btn-load-new").addEventListener("click", function() {
        imageInput.click();
    });

    /* Mobile/tablet: un solo accordion aperto alla volta, tutti chiusi di default */
    if (window.matchMedia("(max-width: 768px)").matches) {
        var accords = document.querySelectorAll(".toolbar-accordion");
        accords.forEach(function(el) {
            el.removeAttribute("open");
            el.addEventListener("toggle", function() {
                if (el.hasAttribute("open")) {
                    accords.forEach(function(other) {
                        if (other !== el) other.removeAttribute("open");
                    });
                }
            });
        });
    }

    var resizeTimeout = null;
    window.addEventListener("resize", function() {
        if (!workCanvas) return;
        if (resizeTimeout) clearTimeout(resizeTimeout);
        resizeTimeout = setTimeout(function() {
            resizeTimeout = null;
            drawToDisplay();
            syncToolbarPosition();
        }, 150);
    });
    window.addEventListener("scroll", function() {
        if (document.body.classList.contains("toolbar-auto-follow")) {
            syncToolbarPosition();
        }
    }, { passive: true });
    var toolbarEl = document.querySelector(".editor-area .toolbar");
    var dragHandle = document.getElementById("toolbar-drag-handle");
    if (dragHandle && toolbarEl) {
        var dragX = 0, dragY = 0, startLeft = 0, startTop = 0;
        function isDesktop() { return window.innerWidth >= 769; }
        function isToolbarFixed() { return document.body.classList.contains("toolbar-floated"); }
        function clampToolbarPosition() {
            if (!isToolbarFixed()) return;
            var t = toolbarEl;
            var tw = t.offsetWidth, th = t.offsetHeight;
            var left = parseInt(t.style.left, 10) || 0;
            var top = parseInt(t.style.top, 10) || 0;
            left = Math.max(0, Math.min(window.innerWidth - tw, left));
            top = Math.max(0, Math.min(window.innerHeight - th, top));
            t.style.left = left + "px";
            t.style.top = top + "px";
        }
        function onDragStart(e) {
            if (!isDesktop()) return;
            e.preventDefault();
            document.querySelectorAll(".toolbar .custom-select-wrap.open").forEach(function(w) {
                w.classList.remove("open");
                var d = w.querySelector(".custom-select-dropdown");
                if (d) d.style.cssText = "";
            });
            if (!isToolbarFixed()) {
                document.body.classList.add("toolbar-floated");
                clearAutoFollowToolbar();
                var wrap = document.getElementById("toolbar-wrap");
                var rect = wrap ? wrap.getBoundingClientRect() : toolbarEl.getBoundingClientRect();
                toolbarEl.style.top = rect.top + "px";
                toolbarEl.style.left = rect.left + "px";
                toolbarEl.style.width = rect.width + "px";
                toolbarEl.style.minWidth = rect.width + "px";
                if (wrap) wrap.style.minHeight = rect.height + "px";
            }
            toolbarUserMoved = true;
            startLeft = parseInt(toolbarEl.style.left, 10) || toolbarEl.getBoundingClientRect().left;
            startTop = parseInt(toolbarEl.style.top, 10) || toolbarEl.getBoundingClientRect().top;
            dragX = (e.touches ? e.touches[0].clientX : e.clientX) - startLeft;
            dragY = (e.touches ? e.touches[0].clientY : e.clientY) - startTop;
            document.addEventListener("mousemove", onDragMove);
            document.addEventListener("mouseup", onDragEnd);
            document.addEventListener("touchmove", onDragMove, { passive: false });
            document.addEventListener("touchend", onDragEnd);
        }
        function onDragMove(e) {
            e.preventDefault();
            var cx = e.touches ? e.touches[0].clientX : e.clientX;
            var cy = e.touches ? e.touches[0].clientY : e.clientY;
            var left = cx - dragX;
            var top = cy - dragY;
            var tw = toolbarEl.offsetWidth, th = toolbarEl.offsetHeight;
            left = Math.max(0, Math.min(window.innerWidth - tw, left));
            top = Math.max(0, Math.min(window.innerHeight - th, top));
            toolbarEl.style.left = left + "px";
            toolbarEl.style.top = top + "px";
        }
        function onDragEnd() {
            document.removeEventListener("mousemove", onDragMove);
            document.removeEventListener("mouseup", onDragEnd);
            document.removeEventListener("touchmove", onDragMove);
            document.removeEventListener("touchend", onDragEnd);
            var resetBtn = document.getElementById("toolbar-reset-pos");
            if (resetBtn) resetBtn.classList.add("visible");
        }
        function resetToolbarToDefault() {
            if (!isDesktop()) return;
            toolbarUserMoved = false;
            var resetBtn = document.getElementById("toolbar-reset-pos");
            if (resetBtn) resetBtn.classList.remove("visible");
            if (document.body.classList.contains("toolbar-floated")) {
                document.body.classList.remove("toolbar-floated");
                var wr = document.getElementById("toolbar-wrap");
                if (wr) wr.style.minHeight = "";
                toolbarEl.style.top = "";
                toolbarEl.style.left = "";
                toolbarEl.style.width = "";
                toolbarEl.style.minWidth = "";
            }
        }
        var resetBtn = document.getElementById("toolbar-reset-pos");
        if (resetBtn) {
            resetBtn.addEventListener("click", function(e) {
                e.preventDefault();
                e.stopPropagation();
                resetToolbarToDefault();
            });
        }
        dragHandle.addEventListener("mousedown", onDragStart);
        dragHandle.addEventListener("touchstart", onDragStart, { passive: false });
        window.addEventListener("resize", function() {
            if (toolbarUserMoved && isToolbarFixed()) {
                clampToolbarPosition();
            }
        });
    }
});
