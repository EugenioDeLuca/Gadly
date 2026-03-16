(function () {
    'use strict';

    var DAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    var MONTHS = ['', 'January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

    function describeField(value, type) {
        if (value === '*') return type === 'dow' ? 'every day of the week' : 'every ' + type;
        if (/^\d+$/.test(value)) return 'at ' + value;
        if (value.indexOf('-') !== -1) return 'from ' + value.replace('-', ' to ');
        if (value.indexOf(',') !== -1) return 'on ' + value;
        if (value.indexOf('/') !== -1) {
            var parts = value.split('/');
            return 'every ' + parts[1] + (type === 'min' ? ' minutes' : type === 'hr' ? ' hours' : type === 'dom' ? ' days' : type === 'mon' ? ' months' : '');
        }
        return value;
    }

    function explainCron(expr) {
        var parts = expr.trim().split(/\s+/);
        if (parts.length !== 5 && parts.length !== 6) return { error: 'Cron expression must have 5 fields (min hr day month dow) or 6 (sec min hr day month dow).' };
        var min = parts.length === 6 ? parts[1] : parts[0];
        var hr = parts.length === 6 ? parts[2] : parts[1];
        var dom = parts.length === 6 ? parts[3] : parts[2];
        var mon = parts.length === 6 ? parts[4] : parts[3];
        var dow = parts.length === 6 ? parts[5] : parts[4];

        var lines = [];
        if (min !== '*') lines.push('Minute: ' + describeField(min, 'min'));
        if (hr !== '*') lines.push('Hour: ' + describeField(hr, 'hr'));
        if (dom !== '*') lines.push('Day of month: ' + describeField(dom, 'dom'));
        if (mon !== '*') lines.push('Month: ' + describeField(mon, 'mon'));
        if (dow !== '*') lines.push('Day of week: ' + describeField(dow, 'dow'));
        if (lines.length === 0) return { error: 'Expression is all wildcards (runs every minute).' };
        return { text: 'Runs at the specified time.\n\n' + lines.join('\n') };
    }

    var input = document.getElementById('cron-input');
    var resultEl = document.getElementById('result-area');
    var btnExplain = document.getElementById('btn-explain');

    btnExplain.addEventListener('click', function () {
        var expr = input.value.trim();
        resultEl.classList.remove('hidden', 'error');
        if (!expr) {
            resultEl.textContent = 'Enter a cron expression';
            resultEl.classList.add('error');
            return;
        }
        var out = explainCron(expr);
        if (out.error) {
            resultEl.textContent = out.error;
            resultEl.classList.add('error');
        } else {
            resultEl.classList.remove('error');
            resultEl.textContent = out.text;
        }
    });
})();
