(function () {
    'use strict';
    var isItalian = (document.documentElement.lang || "").toLowerCase().indexOf("it") === 0;
    function t(it, en) { return isItalian ? it : en; }

    var DAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    var MONTHS = ['', 'January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

    function describeField(value, type) {
        if (value === '*') return type === 'dow' ? t('ogni giorno della settimana', 'every day of the week') : t('ogni', 'every') + ' ' + type;
        if (/^\d+$/.test(value)) return t('alle', 'at') + ' ' + value;
        if (value.indexOf('-') !== -1) return t('da', 'from') + ' ' + value.replace('-', t(' a ', ' to '));
        if (value.indexOf(',') !== -1) return t('nei valori', 'on') + ' ' + value;
        if (value.indexOf('/') !== -1) {
            var parts = value.split('/');
            return t('ogni', 'every') + ' ' + parts[1] + (type === 'min' ? t(' minuti', ' minutes') : type === 'hr' ? t(' ore', ' hours') : type === 'dom' ? t(' giorni', ' days') : type === 'mon' ? t(' mesi', ' months') : '');
        }
        return value;
    }

    function explainCron(expr) {
        var parts = expr.trim().split(/\s+/);
        if (parts.length !== 5 && parts.length !== 6) return { error: t('L\'espressione cron deve avere 5 campi (min ora giorno mese dow) o 6 (sec min ora giorno mese dow).', 'Cron expression must have 5 fields (min hr day month dow) or 6 (sec min hr day month dow).') };
        var min = parts.length === 6 ? parts[1] : parts[0];
        var hr = parts.length === 6 ? parts[2] : parts[1];
        var dom = parts.length === 6 ? parts[3] : parts[2];
        var mon = parts.length === 6 ? parts[4] : parts[3];
        var dow = parts.length === 6 ? parts[5] : parts[4];

        var lines = [];
        if (min !== '*') lines.push(t('Minuto', 'Minute') + ': ' + describeField(min, 'min'));
        if (hr !== '*') lines.push(t('Ora', 'Hour') + ': ' + describeField(hr, 'hr'));
        if (dom !== '*') lines.push(t('Giorno del mese', 'Day of month') + ': ' + describeField(dom, 'dom'));
        if (mon !== '*') lines.push(t('Mese', 'Month') + ': ' + describeField(mon, 'mon'));
        if (dow !== '*') lines.push(t('Giorno della settimana', 'Day of week') + ': ' + describeField(dow, 'dow'));
        if (lines.length === 0) return { error: t('Espressione composta solo da wildcard (esecuzione ogni minuto).', 'Expression is all wildcards (runs every minute).') };
        return { text: t('Esegue all\'orario specificato.', 'Runs at the specified time.') + '\n\n' + lines.join('\n') };
    }

    var input = document.getElementById('cron-input');
    var resultEl = document.getElementById('result-area');
    var btnExplain = document.getElementById('btn-explain');

    btnExplain.addEventListener('click', function () {
        var expr = input.value.trim();
        resultEl.classList.remove('hidden', 'error');
        if (!expr) {
            resultEl.textContent = t('Inserisci un\'espressione cron', 'Enter a cron expression');
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
