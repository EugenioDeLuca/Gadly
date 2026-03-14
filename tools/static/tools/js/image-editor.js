document.addEventListener("DOMContentLoaded", function() {
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

    function saveState() {
        if (!workCanvas) return;
        redoStack.length = 0;
        history.push(workCanvas.toDataURL());
        if (history.length > historyMax) history.shift();
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
        const dpr = window.devicePixelRatio || 1;
        const wrapper = document.getElementById("canvas-wrapper");
        const availW = wrapper && wrapper.clientWidth > 0 ? wrapper.clientWidth : 1100;
        const maxW = Math.max(900, availW);
        const maxH = 2400;
        let dispW = workCanvas.width;
        let dispH = workCanvas.height;
        var baseRatio = Math.min(maxW / dispW, maxH / dispH, 2);
        baseRatio = Math.max(1, baseRatio);
        var ratio = baseRatio * (zoomLevel / 100);
        ratio = Math.max(0.25, Math.min(4, ratio));
        dispW = Math.round(dispW * ratio);
        dispH = Math.round(dispH * ratio);
        canvas.width = Math.round(dispW * dpr);
        canvas.height = Math.round(dispH * dpr);
        canvas.style.width = dispW + "px";
        canvas.style.height = dispH + "px";
        var container = document.getElementById("canvas-container");
        if (container) container.style.transform = "translate(" + panX + "px, " + panY + "px)";
        ctx.save();
        ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
        ctx.imageSmoothingEnabled = true;
        ctx.imageSmoothingQuality = "high";
        ctx.filter = "brightness(" + (brightness / 100) + ") contrast(" + (contrast / 100) + ") saturate(" + (saturation / 100) + ")";
        ctx.drawImage(workCanvas, 0, 0, workCanvas.width, workCanvas.height, 0, 0, dispW, dispH);
        ctx.filter = "none";
        ctx.restore();
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
    var IMAGE_MAX_MP = 12;

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
                if (confirm("This image is very large (" + Math.round(mp) + " MP). Editing may be slow. Continue anyway?")) {
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
            showError("Failed to load image. Please try another file.");
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
        editorArea.style.display = "flex";
        document.body.classList.add("editor-active");
        requestAnimationFrame(function() {
            drawToDisplay();
            updateResizeInputs();
            updateResetButton();
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
        rotate(-90);
    });
    document.getElementById("btn-rotate-right").addEventListener("click", function() {
        rotate(90);
    });

    function rotate(deg) {
        saveState();
        const w = workCanvas.width;
        const h = workCanvas.height;
        const newCanvas = document.createElement("canvas");
        newCanvas.width = deg % 180 === 0 ? w : h;
        newCanvas.height = deg % 180 === 0 ? h : w;
        const newCtx = newCanvas.getContext("2d");
        newCtx.translate(newCanvas.width / 2, newCanvas.height / 2);
        newCtx.rotate((deg * Math.PI) / 180);
        newCtx.drawImage(workCanvas, -w / 2, -h / 2, w, h);
        workCanvas = newCanvas;
        workCtx = workCanvas.getContext("2d");
        clearLastTextObject();
        updateResizeInputs();
        drawToDisplay();
        updateResetButton();
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
        const newCanvas = document.createElement("canvas");
        newCanvas.width = w;
        newCanvas.height = h;
        const newCtx = newCanvas.getContext("2d");
        newCtx.drawImage(workCanvas, 0, 0, w, h);
        workCanvas = newCanvas;
        workCtx = workCanvas.getContext("2d");
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
        if (textOverlayApplied) saveState();
        finalizeTextOverlay(false);
        clearLastTextObject();
        drawMode = false;
        cropMode = false;
        watermarkMode = false;
        document.getElementById("btn-watermark-apply").style.display = "none";
        document.getElementById("btn-watermark-cancel").style.display = "none";
        document.getElementById("btn-draw-mode").classList.remove("active");
        cropCanvas.style.display = "none";
        blurMode = true;
        isSelecting = false;
        cropStart = null;
        cropEnd = null;
        var cursorEl = document.getElementById("blur-cursor");
        cursorEl.style.display = "block";
        updateBlurCursorSize();
        document.getElementById("btn-blur-cancel").style.display = "inline-block";
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
        document.getElementById("blur-cursor").style.display = "none";
        document.getElementById("btn-blur-cancel").style.display = "none";
        canvas.style.cursor = "default";
    });

    function updateBlurCursorSize() {
        var brushSize = parseInt(document.getElementById("brush-size").value, 10) || 10;
        var radiusPx = Math.max(8, brushSize * 2);
        var el = document.getElementById("blur-cursor");
        el.style.width = (radiusPx * 2) + "px";
        el.style.height = (radiusPx * 2) + "px";
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

    function applyBlurAt(cxWork, cyWork, scaleX) {
        var brushSize = parseInt(document.getElementById("brush-size").value, 10) || 10;
        var rWork = Math.max(5, (brushSize * 2) * (scaleX || 1));
        var rad = 1;
        var imgData = workCtx.getImageData(0, 0, workCanvas.width, workCanvas.height);
        var data = imgData.data;
        var ww = workCanvas.width;
        var hh = workCanvas.height;
        var out = new Uint8ClampedArray(data);
        for (var py = Math.max(0, Math.floor(cyWork - rWork)); py < Math.min(hh, Math.ceil(cyWork + rWork)); py++) {
            for (var px = Math.max(0, Math.floor(cxWork - rWork)); px < Math.min(ww, Math.ceil(cxWork + rWork)); px++) {
                var dist = Math.pow(px - cxWork, 2) + Math.pow(py - cyWork, 2);
                if (dist > rWork * rWork) continue;
                var sr = 0, sg = 0, sb = 0, sa = 0, n = 0;
                for (var dy = -rad; dy <= rad; dy++) {
                    for (var dx = -rad; dx <= rad; dx++) {
                        var nx = px + dx;
                        var ny = py + dy;
                        if (nx >= 0 && nx < ww && ny >= 0 && ny < hh) {
                            var i = (ny * ww + nx) * 4;
                            sr += data[i]; sg += data[i + 1]; sb += data[i + 2]; sa += data[i + 3];
                            n++;
                        }
                    }
                }
                if (n > 0) {
                    var idx = (py * ww + px) * 4;
                    out[idx] = sr / n;
                    out[idx + 1] = sg / n;
                    out[idx + 2] = sb / n;
                    out[idx + 3] = sa / n;
                }
            }
        }
        workCtx.putImageData(new ImageData(out, ww, hh), 0, 0);
    }

    var wrapperEl = document.getElementById("canvas-wrapper");
    wrapperEl.addEventListener("mousemove", function(e) {
        if (!blurMode) return;
        var rect = wrapperEl.getBoundingClientRect();
        var x = e.clientX - rect.left;
        var y = e.clientY - rect.top;
        var cur = document.getElementById("blur-cursor");
        cur.style.left = x + "px";
        cur.style.top = y + "px";
    });

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
        var textColor = document.getElementById("text-color").value || "#ffffff";
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
        if (!workCanvas) { showAlertModal("Load an image first."); return; }
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
    document.getElementById("zoom-out").addEventListener("click", function() {
        zoomLevel = Math.max(25, zoomLevel - 25);
        panX = 0;
        panY = 0;
        updateZoomDisplay();
        drawToDisplay();
    });
    document.getElementById("zoom-in").addEventListener("click", function() {
        zoomLevel = Math.min(400, zoomLevel + 25);
        updateZoomDisplay();
        drawToDisplay();
    });
    document.getElementById("zoom-fit").addEventListener("click", function() {
        zoomLevel = 100;
        panX = 0;
        panY = 0;
        updateZoomDisplay();
        drawToDisplay();
    });

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
            showAlertModal("Please load an image first.");
            return;
        }
        workCanvas.toBlob(function(blob) {
            if (!blob) {
                onError("Could not create image. Try a smaller image or different format.");
                return;
            }
            const fd = new FormData();
            fd.append("image", blob, "image.png");
            const msgEl = document.createElement("div");
            msgEl.className = "image-api-loading";
            msgEl.textContent = "Processing…";
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
                                throw new Error("Server error " + r.status + ". For Remove BG run: pip install \"rembg[cpu]\"");
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
                    img.onerror = function() { onError("Failed to load result image"); };
                    img.src = URL.createObjectURL(blob);
                })
                .catch(function(err) {
                    if (msgEl.parentNode) document.body.removeChild(msgEl);
                    onError(err.message || "Request failed");
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
        cropMode = false;
        watermarkMode = false;
        document.getElementById("btn-watermark-apply").style.display = "none";
        document.getElementById("btn-watermark-cancel").style.display = "none";
        cropCanvas.style.display = "none";
        this.classList.toggle("active", drawMode);
        canvas.style.cursor = drawMode ? "crosshair" : "default";
    });

    document.getElementById("brush-size").addEventListener("input", function() {
        document.getElementById("brush-size-val").textContent = this.value;
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
            applyBlurAt(x, y, scaleX);
            drawToDisplay();
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

    function doReset() {
        if (!originalImage) return;
        createWorkCanvas(originalImage.width, originalImage.height);
        workCtx.drawImage(originalImage, 0, 0);
        history.length = 0;
        redoStack.length = 0;
        saveState();
        resetFilters();
        updateResizeInputs();
        drawToDisplay();
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
});
