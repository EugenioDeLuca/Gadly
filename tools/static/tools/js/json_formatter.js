(function () {
    'use strict';

    var input = document.getElementById('json-input');
    var resultEl = document.getElementById('json-result');
    var btnFormat = document.getElementById('btn-format');
    var btnMinify = document.getElementById('btn-minify');
    var btnCopy = document.getElementById('btn-copy');

    function parseJSON(str) {
        try {
            return { data: JSON.parse(str), error: null };
        } catch (e) {
            return { data: null, error: e.message };
        }
    }

    function showResult(text, isError) {
        resultEl.classList.remove('hidden', 'error');
        if (isError) resultEl.classList.add('error');
        resultEl.textContent = text || '';
    }

    function doFormat() {
        var str = input.value.trim();
        if (!str) {
            showResult('Paste JSON to format', true);
            return;
        }
        var out = parseJSON(str);
        if (out.error) {
            showResult('Invalid JSON: ' + out.error, true);
            return;
        }
        resultEl.classList.remove('error');
        showResult(JSON.stringify(out.data, null, 2), false);
    }

    function doMinify() {
        var str = input.value.trim();
        if (!str) {
            showResult('Paste JSON to minify', true);
            return;
        }
        var out = parseJSON(str);
        if (out.error) {
            showResult('Invalid JSON: ' + out.error, true);
            return;
        }
        resultEl.classList.remove('error');
        showResult(JSON.stringify(out.data), false);
    }

    btnFormat.addEventListener('click', doFormat);
    btnMinify.addEventListener('click', doMinify);

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
