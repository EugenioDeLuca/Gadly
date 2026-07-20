(function () {
    'use strict';

    var text1 = document.getElementById('text1');
    var text2 = document.getElementById('text2');
    var btnCompare = document.getElementById('btn-compare');
    var btnCopy = document.getElementById('btn-copy');
    var diffResult = document.getElementById('diff-result');
    var MIN_DESKTOP_HEIGHT = 340;
    var MAX_DESKTOP_HEIGHT = 560;

    function isDesktop() {
        return window.innerWidth >= 769;
    }

    function syncTextareaHeights() {
        if (!text1 || !text2) return;
        if (!isDesktop()) {
            text1.style.height = '';
            text2.style.height = '';
            text1.style.overflowY = '';
            text2.style.overflowY = '';
            return;
        }

        text1.style.height = 'auto';
        text2.style.height = 'auto';

        var desired = Math.max(text1.scrollHeight, text2.scrollHeight, MIN_DESKTOP_HEIGHT);
        var height = Math.min(desired, MAX_DESKTOP_HEIGHT);
        var useScroll = desired > MAX_DESKTOP_HEIGHT;

        text1.style.height = height + 'px';
        text2.style.height = height + 'px';
        text1.style.overflowY = useScroll ? 'auto' : 'hidden';
        text2.style.overflowY = useScroll ? 'auto' : 'hidden';
    }

    function syncErrorLayoutState() {
        var showError = diffResult.classList.contains('error') &&
            !diffResult.classList.contains('hidden');
        document.body.classList.toggle('diff-checker-has-error', showError);
    }

    function runDiff() {
        var oldStr = text1.value;
        var newStr = text2.value;

        diffResult.classList.remove('hidden');
        if (!oldStr && !newStr) {
            diffResult.classList.add('error');
            diffResult.textContent = gettext('Enter or paste text in both boxes');
            syncErrorLayoutState();
            return;
        }

        if (typeof Diff === 'undefined') {
            diffResult.classList.add('error');
            diffResult.textContent = gettext('Diff library not loaded');
            syncErrorLayoutState();
            return;
        }

        diffResult.classList.remove('error');
        var changes = Diff.diffWords(oldStr, newStr);
        var fragment = document.createDocumentFragment();

        changes.forEach(function (part) {
            var span = document.createElement('span');
            if (part.added) {
                span.className = 'diff-add';
            } else if (part.removed) {
                span.className = 'diff-remove';
            }
            span.textContent = part.value;
            fragment.appendChild(span);
        });

        diffResult.innerHTML = '';
        diffResult.appendChild(fragment);
        syncErrorLayoutState();
    }

    btnCompare.addEventListener('click', runDiff);
    syncErrorLayoutState();
    text1.addEventListener('input', syncTextareaHeights);
    text2.addEventListener('input', syncTextareaHeights);
    window.addEventListener('resize', syncTextareaHeights);
    syncTextareaHeights();

    btnCopy.addEventListener('click', function () {
        var text = diffResult.textContent;
        if (!text || diffResult.classList.contains('error')) return;
        navigator.clipboard.writeText(text).then(function () {
            btnCopy.textContent = gettext('Copied!');
            btnCopy.classList.add('copied');
            setTimeout(function () {
                btnCopy.textContent = gettext('Copy');
                btnCopy.classList.remove('copied');
            }, 1500);
        });
    });
})();
