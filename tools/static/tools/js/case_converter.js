(function () {
    'use strict';
    var t = (typeof gettext === 'function') ? gettext : function (s) { return s; };

    var input = document.getElementById('case-input');
    var resultEl = document.getElementById('case-result');
    var btnUpper = document.getElementById('btn-upper');
    var btnLower = document.getElementById('btn-lower');
    var btnTitle = document.getElementById('btn-title');
    var btnCopy = document.getElementById('btn-copy');

    function toTitleCase(str) {
        return str.replace(/\w\S*/g, function (word) {
            return word.charAt(0).toUpperCase() + word.slice(1).toLowerCase();
        });
    }

    function showResult(text) {
        resultEl.classList.remove('hidden');
        resultEl.classList.remove('error');
        resultEl.textContent = text || '';
    }

    function showError(msg) {
        resultEl.classList.remove('hidden');
        resultEl.classList.add('error');
        resultEl.textContent = msg;
    }

    function doUpper() {
        if (!input.value.trim()) {
            showError(t('Please enter some text to convert'));
            return;
        }
        showResult(input.value.toUpperCase());
    }

    function doLower() {
        if (!input.value.trim()) {
            showError(t('Please enter some text to convert'));
            return;
        }
        showResult(input.value.toLowerCase());
    }

    function doTitle() {
        if (!input.value.trim()) {
            showError(t('Please enter some text to convert'));
            return;
        }
        showResult(toTitleCase(input.value));
    }

    btnUpper.addEventListener('click', doUpper);
    btnLower.addEventListener('click', doLower);
    btnTitle.addEventListener('click', doTitle);

    if (window.matchMedia && window.matchMedia('(max-width: 480px)').matches) {
        [btnUpper, btnLower, btnTitle, btnCopy].forEach(function (btn) {
            if (!btn) return;
            function clearFocus() {
                requestAnimationFrame(function () {
                    btn.blur();
                    setTimeout(function () { btn.blur(); }, 0);
                });
            }
            btn.addEventListener('touchend', clearFocus, { passive: true });
            btn.addEventListener('pointerup', clearFocus);
            btn.addEventListener('click', clearFocus);
        });
    }

    btnCopy.addEventListener('click', function () {
        var text = resultEl.textContent;
        if (!text || resultEl.classList.contains('hidden')) return;
        if (navigator.clipboard && navigator.clipboard.writeText) {
            navigator.clipboard.writeText(text).then(function () {
                btnCopy.textContent = t('Copied!');
                btnCopy.classList.add('copied');
                setTimeout(function () { btnCopy.textContent = t('Copy'); btnCopy.classList.remove('copied'); }, 2000);
            }).catch(function () {});
        } else {
            var ta = document.createElement('textarea');
            ta.value = text;
            document.body.appendChild(ta);
            ta.select();
            try {
                document.execCommand('copy');
                btnCopy.textContent = t('Copied!');
                btnCopy.classList.add('copied');
                setTimeout(function () { btnCopy.textContent = t('Copy'); btnCopy.classList.remove('copied'); }, 2000);
            } catch (e) {}
            document.body.removeChild(ta);
        }
    });
})();
