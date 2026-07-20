(function () {
    'use strict';

    var input = document.getElementById('case-input');
    var resultEl = document.getElementById('case-result');
    var btnUpper = document.getElementById('btn-upper');
    var btnLower = document.getElementById('btn-lower');
    var btnTitle = document.getElementById('btn-title');
    var btnCopy = document.getElementById('btn-copy');

    var copyLabels = window.GADLY_CASE_COPY && typeof window.GADLY_CASE_COPY.copy === 'string'
        ? window.GADLY_CASE_COPY
        : { copy: gettext("Copy"), copied: gettext("Copied!") };

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
            showError(gettext("Please enter some text to convert"));
            return;
        }
        showResult(input.value.toUpperCase());
    }

    function doLower() {
        if (!input.value.trim()) {
            showError(gettext("Please enter some text to convert"));
            return;
        }
        showResult(input.value.toLowerCase());
    }

    function doTitle() {
        if (!input.value.trim()) {
            showError(gettext("Please enter some text to convert"));
            return;
        }
        showResult(toTitleCase(input.value));
    }

    btnUpper.addEventListener('click', doUpper);
    btnLower.addEventListener('click', doLower);
    btnTitle.addEventListener('click', doTitle);

    btnCopy.addEventListener('click', function () {
        var text = resultEl.textContent;
        if (!text || resultEl.classList.contains('hidden')) return;
        function afterCopiedFlash() {
            btnCopy.textContent = copyLabels.copy;
            btnCopy.classList.remove('copied');
        }
        function onCopied() {
            btnCopy.textContent = copyLabels.copied;
            btnCopy.classList.add('copied');
            setTimeout(afterCopiedFlash, 2000);
        }
        if (navigator.clipboard && navigator.clipboard.writeText) {
            navigator.clipboard.writeText(text).then(onCopied).catch(function () {});
        } else {
            var ta = document.createElement('textarea');
            ta.value = text;
            document.body.appendChild(ta);
            ta.select();
            try {
                document.execCommand('copy');
                onCopied();
            } catch (e) {}
            document.body.removeChild(ta);
        }
    });
})();
