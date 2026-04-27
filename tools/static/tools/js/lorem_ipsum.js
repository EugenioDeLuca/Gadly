(function () {
    'use strict';

    var LOREM = 'Lorem ipsum dolor sit amet consectetur adipiscing elit sed do eiusmod tempor incididunt ut labore et dolore magna aliqua Ut enim ad minim veniam quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur Excepteur sint occaecat cupidatat non proident sunt in culpa qui officia deserunt mollit anim id est laborum';
    var words = LOREM.split(' ');

    function randomWord() {
        return words[Math.floor(Math.random() * words.length)];
    }

    function sentence() {
        var n = 8 + Math.floor(Math.random() * 8);
        var s = [];
        for (var i = 0; i < n; i++) s.push(randomWord());
        s[0] = s[0].charAt(0).toUpperCase() + s[0].slice(1).toLowerCase();
        return s.join(' ') + '.';
    }

    function paragraph() {
        var n = 4 + Math.floor(Math.random() * 4);
        var p = [];
        for (var i = 0; i < n; i++) p.push(sentence());
        return p.join(' ');
    }

    var typeWrap = document.getElementById('lorem-type-wrap');
    var countInput = document.getElementById('lorem-count');
    var resultEl = document.getElementById('result-area');
    var btnGenerate = document.getElementById('btn-generate');
    var btnCopy = document.getElementById('btn-copy');
    var buttonGroup = btnGenerate ? btnGenerate.closest('.button-group') : null;
    var containerEl = resultEl ? resultEl.parentElement : null;

    if (typeWrap) {
        var trigger = typeWrap.querySelector('.text-tool-select-trigger');
        var menu = typeWrap.querySelector('.text-tool-select-menu');
        menu.querySelectorAll('li').forEach(function (li) {
            li.addEventListener('click', function () {
                typeWrap.dataset.value = li.dataset.value;
                trigger.textContent = li.textContent;
                menu.querySelectorAll('li').forEach(function (l) { l.classList.remove('selected'); });
                li.classList.add('selected');
                typeWrap.classList.remove('open');
            });
        });
        trigger.addEventListener('click', function (e) {
            e.stopPropagation();
            document.querySelectorAll('.text-tool-select.open').forEach(function (s) { s.classList.remove('open'); });
            typeWrap.classList.toggle('open');
        });
        menu.addEventListener('click', function (e) { e.stopPropagation(); });
    }
    document.addEventListener('click', function () {
        document.querySelectorAll('.text-tool-select.open').forEach(function (s) { s.classList.remove('open'); });
    });

    function updateButtonsPosition() {
        if (!buttonGroup || !containerEl || !resultEl || resultEl.classList.contains('hidden')) {
            return;
        }
        var lineHeight = parseFloat(window.getComputedStyle(resultEl).lineHeight) || 24;
        var estimatedLines = Math.ceil(resultEl.scrollHeight / lineHeight);
        if (estimatedLines > 6) {
            if (resultEl.nextElementSibling !== buttonGroup) {
                containerEl.insertBefore(buttonGroup, resultEl.nextElementSibling);
            }
        } else {
            if (buttonGroup.nextElementSibling !== resultEl) {
                containerEl.insertBefore(buttonGroup, resultEl);
            }
        }
    }

    function generate() {
        var type = typeWrap ? typeWrap.dataset.value : 'paragraphs';
        var count = parseInt(countInput.value, 10) || 1;
        count = Math.max(1, Math.min(1000000, count));
        countInput.value = count;
        var out = [];
        if (type === 'words') {
            for (var w = 0; w < count; w++) out.push(randomWord());
            resultEl.textContent = out.join(' ');
        } else if (type === 'sentences') {
            for (var s = 0; s < count; s++) out.push(sentence());
            resultEl.textContent = out.join(' ');
        } else {
            for (var p = 0; p < count; p++) out.push(paragraph());
            resultEl.textContent = out.join('\n\n');
        }
        resultEl.classList.remove('hidden');
        updateButtonsPosition();
    }

    btnGenerate.addEventListener('click', generate);

    function flashCopiedState(button) {
        if (!button) return;
        button.textContent = gettext('Copied!');
        button.classList.add('copied');
        setTimeout(function () {
            button.textContent = gettext('Copy');
            button.classList.remove('copied');
        }, 2000);
    }

    function copyResult() {
        var text = resultEl.textContent;
        if (!text || resultEl.classList.contains('hidden')) return;
        if (navigator.clipboard && navigator.clipboard.writeText) {
            navigator.clipboard.writeText(text).then(function () {
                flashCopiedState(btnCopy);
            }).catch(function () {});
        } else {
            var ta = document.createElement('textarea');
            ta.value = text;
            document.body.appendChild(ta);
            ta.select();
            try {
                document.execCommand('copy');
                flashCopiedState(btnCopy);
            } catch (e) {}
            document.body.removeChild(ta);
        }
    }

    btnCopy.addEventListener('click', copyResult);

    window.addEventListener('resize', updateButtonsPosition);
})();
