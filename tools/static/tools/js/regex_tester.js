(function () {
    'use strict';

    var patternInput = document.getElementById('regex-pattern');
    var textInput = document.getElementById('regex-text');
    var resultEl = document.getElementById('result-area');
    var btnTest = document.getElementById('btn-test');

    function escapeHtml(str) {
        var div = document.createElement('div');
        div.textContent = str;
        return div.innerHTML;
    }

    btnTest.addEventListener('click', function () {
        var pattern = patternInput.value;
        var text = textInput.value;
        resultEl.classList.remove('error');
        resultEl.classList.remove('hidden');

        if (!pattern.trim()) {
            resultEl.textContent = 'Enter a regular expression';
            resultEl.classList.add('error');
            return;
        }

        var re;
        try {
            re = new RegExp(pattern, 'g');
        } catch (e) {
            resultEl.textContent = 'Invalid regex: ' + e.message;
            resultEl.classList.add('error');
            return;
        }

        if (text === '') {
            resultEl.textContent = 'Enter a test string';
            resultEl.classList.add('error');
            return;
        }

        resultEl.classList.remove('error');
        var matches = [];
        var lastIndex = 0;
        var m;
        re.lastIndex = 0;
        while ((m = re.exec(text)) !== null) {
            matches.push({ start: m.index, end: m.index + m[0].length, text: m[0] });
            if (re.lastIndex === lastIndex) break;
            lastIndex = re.lastIndex;
        }

        if (matches.length === 0) {
            resultEl.textContent = 'No matches found.';
            return;
        }

        var parts = [];
        var pos = 0;
        for (var i = 0; i < matches.length; i++) {
            if (matches[i].start > pos) {
                parts.push(escapeHtml(text.slice(pos, matches[i].start)));
            }
            parts.push('<span class="regex-match">' + escapeHtml(matches[i].text) + '</span>');
            pos = matches[i].end;
        }
        if (pos < text.length) parts.push(escapeHtml(text.slice(pos)));
        resultEl.innerHTML = parts.join('');
    });
})();
