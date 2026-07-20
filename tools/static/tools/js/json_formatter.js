(function () {
    'use strict';

    var input = document.getElementById('json-input');
    var resultEl = document.getElementById('json-result');
    var btnFormat = document.getElementById('btn-format');
    var btnMinify = document.getElementById('btn-minify');
    var btnCopy = document.getElementById('btn-copy');

    function localizeJsonError(msg) {
        if (!msg) return '';
        var m = String(msg);
        // Messaggi completi (V8 / Firefox) prima delle sostituzioni parziali
        m = m.replace(
            /Expected ',' or '\}' after property value in JSON at position (\d+)/gi,
            "Atteso ',' o '}' dopo il valore della proprietà nel JSON alla posizione $1"
        );
        m = m.replace(
            /Expected property name or '\}' in JSON at position (\d+)/gi,
            "Atteso il nome della proprietà o '}' nel JSON alla posizione $1"
        );
        m = m.replace(
            /Expected ':' after property name in JSON at position (\d+)/gi,
            "Atteso ':' dopo il nome della proprietà nel JSON alla posizione $1"
        );
        m = m.replace(
            /Expected double-quoted property name in JSON at position (\d+)/gi,
            'Atteso nome di proprietà tra virgolette doppie nel JSON alla posizione $1'
        );
        m = m.replace(
            /Bad control character in string literal in JSON at position (\d+)/gi,
            'Carattere di controllo non valido nella stringa del JSON alla posizione $1'
        );
        m = m.replace(
            /Bad escaped character in JSON at position (\d+)/gi,
            'Sequenza di escape non valida nel JSON alla posizione $1'
        );
        m = m.replace(
            /Unterminated string in JSON at position (\d+)/gi,
            'Stringa non terminata nel JSON alla posizione $1'
        );
        m = m.replace(
            /Duplicate key in JSON at position (\d+)/gi,
            'Chiave duplicata nel JSON alla posizione $1'
        );
        m = m.replace(
            /Unexpected non-whitespace character after JSON at position (\d+)/gi,
            'Carattere non consentito dopo il JSON alla posizione $1'
        );
        m = m.replace(
            /Unexpected token (.+) in JSON at position (\d+)/gi,
            'Token non previsto $1 nel JSON alla posizione $2'
        );
        m = m.replace(/JSON\.parse: unexpected character at line (\d+) column (\d+)/gi,
            'JSON.parse: carattere non previsto alla riga $1 colonna $2');
        m = m.replace(/JSON\.parse: unexpected end of data/gi, 'JSON.parse: fine dei dati non prevista');
        m = m.replace(/JSON\.parse: unexpected character/gi, 'JSON.parse: carattere non previsto');
        m = m.replace(/JSON parse error/gi, 'Errore di analisi JSON');
        m = m.replace(/Unable to parse JSON string/gi, 'Impossibile analizzare la stringa JSON');
        m = m.replace(/Unexpected identifier/gi, 'Identificatore non previsto');
        m = m.replace(/Unexpected end of input/gi, 'Fine input non prevista');
        m = m.replace(/Expected ',' or '\]' after array element/gi, "Atteso ',' o ']' dopo l'elemento dell'array");
        m = m.replace(/Expected ',' or '\}' after array element/gi, "Atteso ',' o '}' dopo l'elemento dell'array");
        m = m.replace(/Unexpected ','/gi, "Virgola ',' non prevista");
        m = m.replace(/Unexpected ':'/gi, "Due punti ':' non previsti");
        m = m.replace(/Colon expected/gi, 'Attesi due punti');
        // Frasi residue comuni
        m = m.replace(/Unexpected token/gi, 'Token non previsto');
        m = m.replace(/is not valid JSON/gi, 'non è un JSON valido');
        m = m.replace(/Unexpected end of JSON input/gi, 'Fine JSON non prevista');
        m = m.replace(/Unexpected string in JSON at position/gi, 'Stringa non prevista nel JSON alla posizione');
        m = m.replace(/Unexpected number in JSON at position/gi, 'Numero non previsto nel JSON alla posizione');
        m = m.replace(/\bin JSON at position (\d+)/gi, 'nel JSON alla posizione $1');
        return m;
    }

    function parseJSON(str) {
        try {
            return { data: JSON.parse(str), error: null };
        } catch (e) {
            return { data: null, error: localizeJsonError(e.message) };
        }
    }

    function syncErrorLayoutState() {
        var showError = resultEl.classList.contains('error') &&
            !resultEl.classList.contains('hidden');
        document.body.classList.toggle('json-formatter-has-error', showError);
    }

    function showResult(text, isError) {
        resultEl.classList.remove('hidden', 'error');
        if (isError) resultEl.classList.add('error');
        resultEl.textContent = text || '';
        syncErrorLayoutState();
    }

    function doFormat() {
        var str = input.value.trim();
        if (!str) {
            showResult(gettext("Paste JSON to format"), true);
            return;
        }
        var out = parseJSON(str);
        if (out.error) {
            showResult(gettext("Invalid JSON") + ': ' + out.error, true);
            return;
        }
        resultEl.classList.remove('error');
        showResult(JSON.stringify(out.data, null, 2), false);
    }

    function doMinify() {
        var str = input.value.trim();
        if (!str) {
            showResult(gettext("Paste JSON to minify"), true);
            return;
        }
        var out = parseJSON(str);
        if (out.error) {
            showResult(gettext("Invalid JSON") + ': ' + out.error, true);
            return;
        }
        resultEl.classList.remove('error');
        showResult(JSON.stringify(out.data), false);
    }

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
                btnCopy.textContent = gettext("Copied!");
                btnCopy.classList.add('copied');
                setTimeout(function () { btnCopy.textContent = gettext("Copy"); btnCopy.classList.remove('copied'); }, 2000);
            }).catch(function () {});
        } else {
            var ta = document.createElement('textarea');
            ta.value = text;
            document.body.appendChild(ta);
            ta.select();
            try {
                document.execCommand('copy');
                btnCopy.textContent = gettext("Copied!");
                btnCopy.classList.add('copied');
                setTimeout(function () { btnCopy.textContent = gettext("Copy"); btnCopy.classList.remove('copied'); }, 2000);
            } catch (e) {}
            document.body.removeChild(ta);
        }
    });
})();
