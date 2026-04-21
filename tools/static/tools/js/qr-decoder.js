(function () {
    'use strict';
    var isItalian = (document.documentElement.lang || "").toLowerCase().indexOf("it") === 0;
    function t(it, en) { return isItalian ? it : en; }

    var input = document.getElementById('qr-image-input');
    var fileNameDisplay = document.querySelector('.qr-decoder .file-name-display');
    var previewWrap = document.getElementById('preview-wrap');
    var previewImg = document.getElementById('preview-img');
    var resultWrap = document.getElementById('result-wrap');
    var decodedText = document.getElementById('decoded-text');
    var btnCopy = document.getElementById('btn-copy');
    var msg = document.getElementById('msg');
    var resultArea = document.getElementById('qr-decoder-result');
    var canvas = document.getElementById('qr-canvas');
    var ctx = canvas.getContext('2d');

    function showError(text) {
        if (resultArea) {
            resultArea.textContent = (text || '').replace(/\.$/, '');
            resultArea.classList.remove('hidden');
            resultArea.classList.add('error');
            resultArea.style.display = 'block';
            resultArea.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
        }
        if (msg) { msg.textContent = ''; msg.className = 'msg'; }
    }
    function hideError() {
        if (resultArea) {
            resultArea.textContent = '';
            resultArea.classList.remove('error');
            resultArea.classList.add('hidden');
            resultArea.style.display = '';
        }
    }
    function showMessage(text, isError, isSuccess) {
        if (isError) {
            showError(text);
            return;
        }
        hideError();
        msg.textContent = text || '';
        msg.className = 'msg' + (isSuccess ? ' success' : '');
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
        if (fileNameDisplay) fileNameDisplay.textContent = file && file.name ? file.name : t('Scegli file', 'Choose file');

        if (!file || !file.type.match(/^image\//)) {
            showMessage(t('Seleziona un\'immagine valida.', 'Please select a valid image.'), true);
            if (fileNameDisplay) fileNameDisplay.textContent = t('Scegli file', 'Choose file');
            return;
        }

        var img = new Image();
        img.onload = function () {
            previewImg.src = img.src;
            previewWrap.style.display = 'block';

            var w = img.naturalWidth;
            var h = img.naturalHeight;
            canvas.width = w;
            canvas.height = h;
            ctx.drawImage(img, 0, 0);
            var imageData = ctx.getImageData(0, 0, w, h);

            if (typeof jsQR === 'undefined') {
                showMessage(t('Libreria di decodifica non caricata', 'Decoding library not loaded'), true);
                return;
            }
            var code = jsQR(imageData.data, w, h);
            if (code && code.data) {
                showResult(code.data);
                resultWrap.style.display = 'block';
                showMessage(t('QR code letto con successo.', 'QR code read successfully.'), false, true);
            } else {
                showMessage(t('Nessun QR code trovato in questa immagine', 'No QR code found in this image'), true);
            }
        };
        img.onerror = function () {
            showMessage(t('Impossibile caricare l\'immagine', 'Unable to load image'), true);
        };
        img.src = URL.createObjectURL(file);
    });

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
            navigator.clipboard.writeText(text).then(function () {
                onCopyDone();
            }).catch(function () {
                fallbackCopy(text);
            });
        } else {
            fallbackCopy(text);
        }
    });

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
