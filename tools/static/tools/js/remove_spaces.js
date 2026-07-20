document.addEventListener("DOMContentLoaded", function() {
    /** Soglia caratteri: sopra = risultato sopra ai bottoni (meno scroll per Copia / Trasforma). */
    var LONG_OUTPUT_CHARS = 900;

    var input = document.getElementById("text-input");
    var outcomeStack = document.getElementById("remove-spaces-outcome-stack");
    function tr(msgid, fallbackIt) {
        var out = (typeof gettext === 'function') ? gettext(msgid) : msgid;
        var isIt = document.documentElement.lang && document.documentElement.lang.toLowerCase().indexOf('it') === 0;
        if (isIt && out === msgid && fallbackIt) return fallbackIt;
        return out;
    }
    var resultArea = document.getElementById("result-area");
    var errorBox = document.getElementById("remove-spaces-error");
    var btnTransform = document.getElementById("btn-transform");
    var btnUndo = document.getElementById("btn-undo");
    var btnCopy = document.getElementById("btn-copy");
    var mobileUndoStack = [];

    function showError(message) {
        if (!errorBox) return;
        errorBox.textContent = message || "";
        errorBox.classList.remove("hidden");
    }

    function clearError() {
        if (!errorBox) return;
        errorBox.textContent = "";
        errorBox.classList.add("hidden");
    }

    function isMobileView() {
        return window.matchMedia("(max-width: 480px)").matches;
    }

    function setUndoVisible(visible) {
        if (!btnUndo) return;
        btnUndo.hidden = !visible;
    }

    btnTransform.addEventListener("click", function() {
        var text = input.value;
        var mode = document.querySelector('input[name="mode"]:checked').value;
        var out = "";

        if (!text || !text.trim()) {
            resultArea.textContent = "";
            resultArea.classList.add("hidden");
            if (outcomeStack) outcomeStack.classList.remove("remove-spaces--result-first");
            mobileUndoStack = [];
            setUndoVisible(false);
            showError(tr("Please enter text to process", "Inserisci del testo"));
            return;
        }

        clearError();

        if (mode === "all") {
            out = text.replace(/\s+/g, "");
        } else if (mode === "extra") {
            out = text.replace(/\s+/g, " ").trim();
        }

        if (isMobileView()) {
            mobileUndoStack.push(text);
            input.value = out;
            resultArea.textContent = "";
            resultArea.classList.add("hidden");
            if (outcomeStack) outcomeStack.classList.remove("remove-spaces--result-first");
            setUndoVisible(true);
            return;
        }

        resultArea.textContent = out;
        resultArea.classList.remove("hidden");
        setUndoVisible(false);
        if (outcomeStack) {
            if (out.length > LONG_OUTPUT_CHARS) {
                outcomeStack.classList.add("remove-spaces--result-first");
            } else {
                outcomeStack.classList.remove("remove-spaces--result-first");
            }
        }
    });

    if (btnUndo) {
        btnUndo.addEventListener("click", function() {
            if (!mobileUndoStack.length) return;
            input.value = mobileUndoStack.pop();
            setUndoVisible(mobileUndoStack.length > 0);
            clearError();
        });
    }

    btnCopy.addEventListener("click", function() {
        var text = isMobileView() ? (input.value || "") : (resultArea.textContent || "");
        if (!text || text === "(empty)") return;
        navigator.clipboard.writeText(text).then(function() {
            btnCopy.textContent = gettext('Copied!');
            btnCopy.classList.add("copied");
            if (isMobileView()) {
                requestAnimationFrame(function() {
                    btnCopy.blur();
                    setTimeout(function() { btnCopy.blur(); }, 0);
                });
            }
            setTimeout(function() {
                btnCopy.textContent = gettext('Copy');
                btnCopy.classList.remove("copied");
            }, 1500);
        });
    });

    var mobileViewMq = window.matchMedia("(max-width: 480px)");
    function onMobileViewChange() {
        if (!mobileViewMq.matches) {
            setUndoVisible(false);
        }
    }
    if (mobileViewMq.addEventListener) {
        mobileViewMq.addEventListener("change", onMobileViewChange);
    } else if (mobileViewMq.addListener) {
        mobileViewMq.addListener(onMobileViewChange);
    }
});
