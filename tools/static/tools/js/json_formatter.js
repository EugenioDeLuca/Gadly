(function () {
    'use strict';
    var t = (typeof gettext === 'function') ? gettext : function (s) { return s; };

    var input = document.getElementById('json-input');
    var resultEl = document.getElementById('json-result');
    var btnFormat = document.getElementById('btn-format');
    var btnMinify = document.getElementById('btn-minify');
    var btnCopy = document.getElementById('btn-copy');

    function localizeJsonError(msg) {
        if (!msg) return '';
        var m = String(msg);
        // Browser parser messages (EN) -> Italian (handle multiple variants)
        m = m.replace(/Unexpected token/gi, 'Token non previsto');
        m = m.replace(/is not valid JSON/gi, 'non è un JSON valido');
        m = m.replace(/Unexpected end of JSON input/gi, 'Fine JSON non prevista');
        m = m.replace(/Unexpected string in JSON at position/gi, 'Stringa non prevista nel JSON alla posizione');
        m = m.replace(/Unexpected number in JSON at position/gi, 'Numero non previsto nel JSON alla posizione');
        return m;
    }

    function parseJSON(str) {
        try {
            return { data: JSON.parse(str), error: null };
        } catch (e) {
            return { data: null, error: localizeJsonError(e.message) };
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
            showResult(t('Paste JSON to format'), true);
            return;
        }
        var out = parseJSON(str);
        if (out.error) {
            showResult(t('Invalid JSON') + ': ' + out.error, true);
            return;
        }
        resultEl.classList.remove('error');
        showResult(JSON.stringify(out.data, null, 2), false);
    }

    function doMinify() {
        var str = input.value.trim();
        if (!str) {
            showResult(t('Paste JSON to minify'), true);
            return;
        }
        var out = parseJSON(str);
        if (out.error) {
            showResult(t('Invalid JSON') + ': ' + out.error, true);
            return;
        }
        resultEl.classList.remove('error');
        showResult(JSON.stringify(out.data), false);
    }

    function setupMobileButton(btn) {
        if (!('ontouchstart' in window)) return;
        btn.addEventListener('touchstart', function () {
            btn.classList.add('tap-active');
        }, { passive: true });
        btn.addEventListener('touchend', function () {
            btn.classList.remove('tap-active');
        }, { passive: true });
        btn.addEventListener('touchcancel', function () {
            btn.classList.remove('tap-active');
        }, { passive: true });
        btn.addEventListener('click', function () {
            setTimeout(function () { btn.blur(); }, 100);
        });
    }
    setupMobileButton(btnFormat);
    setupMobileButton(btnMinify);
    setupMobileButton(btnCopy);

    btnFormat.addEventListener('click', function () {
        doFormat();
    });
    btnMinify.addEventListener('click', function () {
        doMinify();
    });
    btnCopy.addEventListener('click', function () {
        var text = resultEl.textContent;
        if (!text || resultEl.classList.contains('hidden')) return;
        if (navigator.clipboard && navigator.clipboard.writeText) {
            navigator.clipboard.writeText(text).then(function () {
                btnCopy.textContent = gettext('Copied!');
                btnCopy.classList.add('copied');
                setTimeout(function () { btnCopy.textContent = gettext('Copy'); btnCopy.classList.remove('copied'); }, 2000);
            }).catch(function () {});
        } else {
            var ta = document.createElement('textarea');
            ta.value = text;
            document.body.appendChild(ta);
            ta.select();
            try {
                document.execCommand('copy');
                btnCopy.textContent = gettext('Copied!');
                btnCopy.classList.add('copied');
                setTimeout(function () { btnCopy.textContent = gettext('Copy'); btnCopy.classList.remove('copied'); }, 2000);
            } catch (e) {}
            document.body.removeChild(ta);
        }
    });
})();
