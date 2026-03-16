(function () {
    'use strict';

    var text1 = document.getElementById('text1');
    var text2 = document.getElementById('text2');
    var btnCompare = document.getElementById('btn-compare');
    var diffResult = document.getElementById('diff-result');

    function runDiff() {
        var oldStr = text1.value;
        var newStr = text2.value;

        diffResult.classList.remove('hidden');
        if (!oldStr && !newStr) {
            diffResult.classList.add('error');
            diffResult.textContent = 'Enter or paste text in both boxes';
            return;
        }

        if (typeof Diff === 'undefined') {
            diffResult.classList.add('error');
            diffResult.textContent = 'Diff library not loaded';
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
    }

    btnCompare.addEventListener('click', runDiff);
})();
