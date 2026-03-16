(function () {
    'use strict';

    var countInput = document.getElementById('uuid-count');
    var resultEl = document.getElementById('uuid-result');
    var btnGenerate = document.getElementById('btn-generate');
    var btnCopy = document.getElementById('btn-copy');

    function randomUUID() {
        if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
            return crypto.randomUUID();
        }
        var bytes = new Uint8Array(16);
        if (typeof crypto !== 'undefined' && crypto.getRandomValues) {
            crypto.getRandomValues(bytes);
        } else {
            for (var i = 0; i < 16; i++) bytes[i] = Math.floor(Math.random() * 256);
        }
        bytes[6] = (bytes[6] & 0x0f) | 0x40;
        bytes[8] = (bytes[8] & 0x3f) | 0x80;
        var hex = '';
        for (var j = 0; j < 16; j++) hex += ('0' + bytes[j].toString(16)).slice(-2);
        return hex.slice(0, 8) + '-' + hex.slice(8, 12) + '-' + hex.slice(12, 16) + '-' + hex.slice(16, 20) + '-' + hex.slice(20);
    }

    function doGenerate() {
        var n = parseInt(countInput.value, 10);
        if (isNaN(n) || n < 1) n = 1;
        if (n > 10000) n = 10000;
        countInput.value = n;
        var list = [];
        for (var i = 0; i < n; i++) list.push(randomUUID());
        resultEl.textContent = list.join('\n');
        resultEl.classList.remove('hidden');
    }

    btnGenerate.addEventListener('click', doGenerate);

    btnCopy.addEventListener('click', function () {
        var text = resultEl.textContent;
        if (!text || resultEl.classList.contains('hidden')) return;
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
