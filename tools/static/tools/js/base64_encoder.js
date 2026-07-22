(function () {
    'use strict';

    var input = document.getElementById('base64-input');
    var resultEl = document.getElementById('base64-result');
    var btnEncode = document.getElementById('btn-encode');
    var btnDecode = document.getElementById('btn-decode');
    var btnCopy = document.getElementById('btn-copy');
    var copyResetTimer = null;

    function isMobileView() {
        return window.matchMedia && window.matchMedia('(max-width: 768px)').matches;
    }

    function blurCopyBtn() {
        if (!btnCopy || !isMobileView()) return;
        requestAnimationFrame(function () {
            btnCopy.blur();
            setTimeout(function () { btnCopy.blur(); }, 0);
        });
    }

    function showResult(text, isError) {
        resultEl.classList.remove('hidden', 'error');
        if (isError) {
            resultEl.textContent = (text || '').replace(/\.$/, '');
            resultEl.classList.add('error');
            resultEl.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
        } else {
            resultEl.classList.remove('error');
            resultEl.textContent = text || '';
        }
    }

    function encodeUTF8Base64(str) {
        try {
            return btoa(unescape(encodeURIComponent(str)));
        } catch (e) {
            return null;
        }
    }

    function decodeBase64UTF8(str) {
        try {
            return decodeURIComponent(escape(atob(str)));
        } catch (e) {
            return null;
        }
    }

    function doEncode() {
        var str = input.value;
        if (str === '') {
            showResult(gettext("Enter text to encode"), true);
            return;
        }
        var out = encodeUTF8Base64(str);
        if (out === null) {
            showResult(gettext("Encoding failed"), true);
            return;
        }
        showResult(out, false);
    }

    function doDecode() {
        var str = input.value.trim();
        if (str === '') {
            showResult(gettext("Enter Base64 string to decode"), true);
            return;
        }
        var out = decodeBase64UTF8(str);
        if (out === null) {
            showResult(gettext("Invalid Base64 or decoding failed"), true);
            return;
        }
        showResult(out, false);
    }

    function onCopyDone() {
        if (copyResetTimer) {
            clearTimeout(copyResetTimer);
            copyResetTimer = null;
        }
        btnCopy.textContent = gettext("Copied!");
        btnCopy.classList.add('copied');
        blurCopyBtn();
        copyResetTimer = setTimeout(function () {
            btnCopy.textContent = gettext("Copy");
            btnCopy.classList.remove('copied');
            copyResetTimer = null;
        }, 2000);
    }

    btnEncode.addEventListener('click', doEncode);
    btnDecode.addEventListener('click', doDecode);

    btnCopy.addEventListener('click', function () {
        var text = resultEl.textContent;
        if (!text || resultEl.classList.contains('hidden') || resultEl.classList.contains('error')) return;
        if (navigator.clipboard && navigator.clipboard.writeText) {
            navigator.clipboard.writeText(text).then(onCopyDone).catch(function () {});
        } else {
            var ta = document.createElement('textarea');
            ta.value = text;
            document.body.appendChild(ta);
            ta.select();
            try {
                document.execCommand('copy');
                onCopyDone();
            } catch (e) {}
            document.body.removeChild(ta);
        }
    });
})();
