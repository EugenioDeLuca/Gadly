document.addEventListener("DOMContentLoaded", function() {
    var input = document.getElementById("text-input");
    var resultArea = document.getElementById("result-area");
    var btnTransform = document.getElementById("btn-transform");
    var btnCopy = document.getElementById("btn-copy");

    btnTransform.addEventListener("click", function() {
        var text = input.value;
        var mode = document.querySelector('input[name="mode"]:checked').value;
        var out = "";

        if (mode === "all") {
            out = text.replace(/\s+/g, "");
        } else if (mode === "extra") {
            out = text.replace(/\s+/g, " ").trim();
        }

        resultArea.textContent = out || "(empty)";
        resultArea.classList.remove("hidden");
    });

    btnCopy.addEventListener("click", function() {
        var text = resultArea.textContent;
        if (!text || text === "(empty)") return;
        navigator.clipboard.writeText(text).then(function() {
            btnCopy.textContent = "Copied!";
            btnCopy.classList.add("copied");
            setTimeout(function() {
                btnCopy.textContent = "Copy result";
                btnCopy.classList.remove("copied");
            }, 1500);
        });
    });
});
