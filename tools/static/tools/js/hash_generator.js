(function () {
    'use strict';

    var algoWrap = document.getElementById('hash-algo-wrap');
    var algoTrigger = document.getElementById('hash-algo-trigger');
    var inputEl = document.getElementById('hash-input');
    var resultEl = document.getElementById('result-area');
    var btnGenerate = document.getElementById('btn-generate');
    var btnCopy = document.getElementById('btn-copy');

    function getAlgo() {
        return algoWrap ? algoWrap.dataset.value || 'SHA-256' : 'SHA-256';
    }

    if (algoWrap && algoTrigger) {
        var menu = algoWrap.querySelector('.text-tool-select-menu');
        if (menu) {
            menu.querySelectorAll('li').forEach(function (li) {
                li.addEventListener('click', function () {
                    algoWrap.dataset.value = li.dataset.value;
                    algoTrigger.textContent = li.textContent.trim();
                    menu.querySelectorAll('li').forEach(function (l) { l.classList.remove('selected'); });
                    li.classList.add('selected');
                    algoWrap.classList.remove('open');
                });
            });
            algoTrigger.addEventListener('click', function (e) {
                e.preventDefault();
                e.stopPropagation();
                document.querySelectorAll('.text-tool-select.open').forEach(function (s) { s.classList.remove('open'); });
                algoWrap.classList.toggle('open');
            });
            menu.addEventListener('click', function (e) { e.stopPropagation(); });
        }
    }
    document.addEventListener('click', function () {
        document.querySelectorAll('.text-tool-select.open').forEach(function (s) { s.classList.remove('open'); });
    });

    function hex(buf) {
        var out = '';
        var arr = new Uint8Array(buf);
        for (var i = 0; i < arr.length; i++) out += ('0' + arr[i].toString(16)).slice(-2);
        return out;
    }

    /* MD5 implementation (RFC 1321), input = Uint8Array, output = 32-char hex */
    function md5Bytes(input) {
        var len = input.length;
        var n = ((len + 8) - ((len + 8) % 64)) + 64;
        if (n < 64) n = 64;
        var buf = new ArrayBuffer(n);
        var view = new Uint8Array(buf);
        view.set(input);
        view[len] = 0x80;
        var lenBits = len * 8;
        var dvLen = new DataView(buf);
        dvLen.setUint32(n - 8, lenBits >>> 0, true);
        dvLen.setUint32(n - 4, Math.floor(lenBits / 0x100000000) >>> 0, true);
        var K = [0xd76aa478, 0xe8c7b756, 0x242070db, 0xc1bdceee, 0xf57c0faf, 0x4787c62a, 0xa8304613, 0xfd469501, 0x698098d8, 0x8b44f7af, 0xffff5bb1, 0x895cd7be, 0x6b901122, 0xfd987193, 0xa679438e, 0x49b40821, 0xf61e2562, 0xc040b340, 0x265e5a51, 0xe9b6c7aa, 0xd62f105d, 0x02441453, 0xd8a1e681, 0xe7d3fbc8, 0x21e1cde6, 0xc33707d6, 0xf4d50d87, 0x455a14ed, 0xa9e3e905, 0xfcefa3f8, 0x676f02d9, 0x8d2a4c8a, 0xfffa3942, 0x8771f681, 0x6d9d6122, 0xfde5380c, 0xa4beea44, 0x4bdecfa9, 0xf6bb4b60, 0xbebfbc70, 0x289b7ec6, 0xeaa127fa, 0xd4ef3085, 0x04881d05, 0xd9d4d039, 0xe6db99e5, 0x1fa27cf8, 0xc4ac5665, 0xf4292244, 0x432aff97, 0xab9423a7, 0xfc93a039, 0x655b59c3, 0x8f0ccc92, 0xffeff47d, 0x85845dd1, 0x6fa87e4f, 0xfe2ce6e0, 0xa3014314, 0x4e0811a1, 0xf7537e82, 0xbd3af235, 0x2ad7d2bb, 0xeb86d391];
        var S = [7, 12, 17, 22, 7, 12, 17, 22, 7, 12, 17, 22, 7, 12, 17, 22, 5, 9, 14, 20, 5, 9, 14, 20, 5, 9, 14, 20, 5, 9, 14, 20, 4, 11, 16, 23, 4, 11, 16, 23, 4, 11, 16, 23, 4, 11, 16, 23, 6, 10, 15, 21, 6, 10, 15, 21, 6, 10, 15, 21, 6, 10, 15, 21];
        var dv = new DataView(buf);
        var h0 = 0x67452301, h1 = 0xefcdab89, h2 = 0x98badcfe, h3 = 0x10325476;
        for (var off = 0; off < n; off += 64) {
            var a = h0, b = h1, c = h2, d = h3;
            var M = function (i) { return dv.getUint32(off + i * 4, true); };
            for (var i = 0; i < 64; i++) {
                var f, g;
                if (i < 16) { f = (b & c) | ((~b) & d); g = i; }
                else if (i < 32) { f = (d & b) | ((~d) & c); g = (5 * i + 1) % 16; }
                else if (i < 48) { f = b ^ c ^ d; g = (3 * i + 5) % 16; }
                else { f = c ^ (b | (~d)); g = (7 * i) % 16; }
                f = (f + a + K[i] + M(g)) >>> 0;
                a = d; d = c; c = b;
                b = (b + ((f << S[i]) | (f >>> (32 - S[i])))) >>> 0;
            }
            h0 = (h0 + a) >>> 0; h1 = (h1 + b) >>> 0; h2 = (h2 + c) >>> 0; h3 = (h3 + d) >>> 0;
        }
        var out = new Uint8Array(16);
        var odv = new DataView(out.buffer);
        odv.setUint32(0, h0, true); odv.setUint32(4, h1, true); odv.setUint32(8, h2, true); odv.setUint32(12, h3, true);
        return hex(out.buffer);
    }

    function showResult(text, isError) {
        resultEl.classList.remove('hidden', 'hash-error', 'error');
        if (isError) {
            resultEl.textContent = (text || '').replace(/\.$/, '');
            resultEl.classList.add('error');
            resultEl.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
        } else {
            resultEl.classList.remove('error');
            resultEl.textContent = text || '';
        }
    }

    function doHash() {
        if (!inputEl || !resultEl) return;
        var text = inputEl.value;
        var algo = getAlgo();
        if (!text || !text.trim()) {
            showResult('Enter text to hash', true);
            return;
        }
        var enc = new TextEncoder();
        var bytes = enc.encode(text);
        if (algo === 'MD5') {
            showResult(md5Bytes(bytes), false);
            return;
        }
        crypto.subtle.digest(algo, bytes).then(function (buf) {
            showResult(hex(buf), false);
        }).catch(function (err) {
            showResult('Error: ' + err.message, true);
        });
    }

    if (btnGenerate) btnGenerate.addEventListener('click', doHash);

    if (btnCopy) {
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
    }
})();
