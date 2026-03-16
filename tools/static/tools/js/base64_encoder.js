(function () {
    'use strict';

    var input = document.getElementById('base64-input');
    var resultEl = document.getElementById('base64-result');
    var btnEncode = document.getElementById('btn-encode');
    var btnDecode = document.getElementById('btn-decode');
    var btnCopy = document.getElementById('btn-copy');

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
            showResult('Enter text to encode', true);
            return;
        }
        var out = encodeUTF8Base64(str);
        if (out === null) {
            showResult('Encoding failed', true);
            return;
        }
        showResult(out, false);
    }

    function doDecode() {
        var str = input.value.trim();
        if (str === '') {
            showResult('Enter Base64 string to decode', true);
            return;
        }
        var out = decodeBase64UTF8(str);
        if (out === null) {
            showResult('Invalid Base64 or decoding failed', true);
            return;
        }
        showResult(out, false);
    }

    btnEncode.addEventListener('click', doEncode);
    btnDecode.addEventListener('click', doDecode);

    btnCopy.addEventListener('click', function () {
        var text = resultEl.textContent;
        if (!text || resultEl.classList.contains('hidden') || resultEl.classList.contains('error')) return;
        if (navigator.clipboard && navigator.clipboard.writeText) {
            navigator.clipboard.writeText(text).then(function () {
                btnCopy.textContent = 'Copied!';
                btnCopy.classList.add('copied');
                setTimeout(function () { btnCopy.textContent = 'Copy'; btnCopy.classList.remove('copied'); }, 2000);
            }).catch(function () {});
        } else {
            var ta = document.createElement('textarea');
            ta.value = text;
            document.body.appendChild(ta);
            ta.select();
            try {
                document.execCommand('copy');
                btnCopy.textContent = 'Copied!';
                btnCopy.classList.add('copied');
                setTimeout(function () { btnCopy.textContent = 'Copy'; btnCopy.classList.remove('copied'); }, 2000);
            } catch (e) {}
            document.body.removeChild(ta);
        }
    });
})();
