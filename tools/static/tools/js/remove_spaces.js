document.addEventListener("DOMContentLoaded", function() {
    var input = document.getElementById("text-input");
    function tr(msgid, fallbackIt) {
        var out = (typeof gettext === 'function') ? gettext(msgid) : msgid;
        var isIt = document.documentElement.lang && document.documentElement.lang.toLowerCase().indexOf('it') === 0;
        if (isIt && out === msgid && fallbackIt) return fallbackIt;
        return out;
    }
    var resultArea = document.getElementById("result-area");
    var errorBox = document.getElementById("remove-spaces-error");
    var btnTransform = document.getElementById("btn-transform");
    var btnCopy = document.getElementById("btn-copy");

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

    btnTransform.addEventListener("click", function() {
        var text = input.value;
        var mode = document.querySelector('input[name="mode"]:checked').value;
        var out = "";

        if (!text || !text.trim()) {
            resultArea.textContent = "";
            resultArea.classList.add("hidden");
            showError(tr("Please enter text to process", "Inserisci del testo"));
            return;
        }

        clearError();

        if (mode === "all") {
            out = text.replace(/\s+/g, "");
        } else if (mode === "extra") {
            out = text.replace(/\s+/g, " ").trim();
        }

        resultArea.textContent = out;
        resultArea.classList.remove("hidden");
    });

    btnCopy.addEventListener("click", function() {
        var text = resultArea.textContent;
        if (!text || text === "(empty)") return;
        navigator.clipboard.writeText(text).then(function() {
            btnCopy.textContent = gettext('Copied!');
            btnCopy.classList.add("copied");
            setTimeout(function() {
                btnCopy.textContent = gettext('Copy');
                btnCopy.classList.remove("copied");
            }, 1500);
        });
    });
});
