(function () {
    'use strict';

    var input = document.getElementById('qr-image-input');
    var fileNameDisplay = document.querySelector('.qr-decoder .file-name-display');
    var previewWrap = document.getElementById('preview-wrap');
    var previewImg = document.getElementById('preview-img');
    var resultWrap = document.getElementById('result-wrap');
    var decodedText = document.getElementById('decoded-text');
    var btnCopy = document.getElementById('btn-copy');
    var msg = document.getElementById('msg');
    var canvas = document.getElementById('qr-canvas');
    if (!input || !canvas || !msg) return;
    var ctx = canvas.getContext('2d');

    function showError(text) {
        if (msg) {
            msg.textContent = (text || '').replace(/\.$/, '');
            msg.className = 'msg error';
            msg.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
        }
    }

    function clearFeedback() {
        if (msg) {
            msg.textContent = '';
            msg.className = 'msg';
        }
    }

    function showMessage(text, isError, isSuccess) {
        if (isError) {
            showError(text);
            return;
        }
        clearFeedback();
        if (text) {
            msg.textContent = text || '';
            msg.className = 'msg' + (isSuccess ? ' success' : '');
        }
    }

    function showResult(text) {
        decodedText.value = text || '';
        resultWrap.style.display = text ? 'block' : 'none';
    }

    input.addEventListener('change', function () {
        var file = input.files && input.files[0];
        showMessage('');
        showResult('');
        resultWrap.style.display = 'none';
        previewWrap.style.display = 'none';
        if (fileNameDisplay) {
            fileNameDisplay.textContent = file && file.name ? file.name : gettext('Choose file');
        }

        if (!file || !file.type.match(/^image\//)) {
            showMessage(gettext('Please select a valid image.'), true);
            if (fileNameDisplay) fileNameDisplay.textContent = gettext('Choose file');
            return;
        }

        var img = new Image();
        img.onload = function () {
            previewImg.src = img.src;
            previewWrap.style.display = 'block';

            function decodeFromCanvas(w, h) {
                try {
                    var imageData = ctx.getImageData(0, 0, w, h);
                    if (typeof jsQR === 'undefined') {
                        showMessage(
                            gettext('Decoding library not loaded. Refresh the page and try again.'),
                            true
                        );
                        return;
                    }
                    var code = jsQR(imageData.data, w, h, { inversionAttempts: 'attemptBoth' });
                    if (code && code.data) {
                        showResult(code.data);
                        resultWrap.style.display = 'block';
                        showMessage(gettext('QR code read successfully.'), false, true);
                    } else {
                        showMessage(gettext('No QR code found in this image.'), true);
                    }
                } catch (err) {
                    showMessage(
                        gettext('Could not decode this image. Try another file or a clearer photo.'),
                        true
                    );
                }
            }

            function runWithSource(w, h, source) {
                canvas.width = w;
                canvas.height = h;
                ctx.drawImage(source, 0, 0, w, h);
                decodeFromCanvas(w, h);
            }

            if (typeof createImageBitmap === 'function') {
                createImageBitmap(img, { imageOrientation: 'from-image' })
                    .then(function (bitmap) {
                        try {
                            runWithSource(bitmap.width, bitmap.height, bitmap);
                        } finally {
                            if (bitmap && typeof bitmap.close === 'function') {
                                bitmap.close();
                            }
                        }
                    })
                    .catch(function () {
                        runWithSource(img.naturalWidth, img.naturalHeight, img);
                    });
            } else {
                runWithSource(img.naturalWidth, img.naturalHeight, img);
            }
        };
        img.onerror = function () {
            showMessage(gettext('Unable to load image.'), true);
        };
        img.src = URL.createObjectURL(file);
    });

    if (btnCopy) {
        btnCopy.addEventListener('click', function () {
            var text = decodedText.value;
            if (!text) return;
            btnCopy.classList.remove('copied');
            function onCopyDone() {
                btnCopy.classList.add('copied');
                btnCopy.textContent = gettext('Copied!');
                setTimeout(function () {
                    btnCopy.classList.remove('copied');
                    btnCopy.textContent = gettext('Copy');
                }, 2000);
            }
            if (navigator.clipboard && navigator.clipboard.writeText) {
                navigator.clipboard.writeText(text).then(onCopyDone).catch(function () {
                    fallbackCopy(text);
                });
            } else {
                fallbackCopy(text);
            }
        });
    }

    function fallbackCopy(text) {
        decodedText.select();
        try {
            document.execCommand('copy');
            btnCopy.classList.add('copied');
            btnCopy.textContent = gettext('Copied!');
            setTimeout(function () {
                btnCopy.classList.remove('copied');
                btnCopy.textContent = gettext('Copy');
            }, 2000);
        } catch (e) {
            showMessage(gettext('Copy not supported'), true);
        }
        decodedText.setSelectionRange(0, 0);
    }
})();
