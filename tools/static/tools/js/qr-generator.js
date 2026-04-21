document.addEventListener("DOMContentLoaded", function() {
    var isItalian = (document.documentElement.lang || "").toLowerCase().indexOf("it") === 0;
    function t(it, en) { return isItalian ? it : en; }
    const input = document.getElementById("qr-input");
    const btn = document.getElementById("generate-qr");
    const output = document.getElementById("qr-output");
    const resultDiv = document.getElementById("qr-result");
    const downloadBtn = document.getElementById("download-qr");
    const fileInput = document.getElementById("file-upload");
    const resultArea = document.getElementById("qr-result-area");
    const colorDark = document.getElementById("color-dark");
    const colorLight = document.getElementById("color-light");
    const qrSizeWrap = document.getElementById("qr-size-wrap");
    const qrEcWrap = document.getElementById("qr-ec-wrap");

    function getQrSize() {
        return parseInt(qrSizeWrap ? qrSizeWrap.dataset.value : "256", 10);
    }

    function getCorrectLevel() {
        var val = qrEcWrap ? qrEcWrap.dataset.value : "L";
        return QRCode.CorrectLevel[val] || QRCode.CorrectLevel.L;
    }

    document.querySelectorAll(".qr-custom-select").forEach(function(wrap) {
        var trigger = wrap.querySelector(".qr-select-trigger");
        var menu = wrap.querySelector(".qr-select-menu");
        menu.querySelectorAll("li").forEach(function(li) {
            li.addEventListener("click", function() {
                wrap.dataset.value = li.dataset.value;
                trigger.textContent = li.textContent;
                menu.querySelectorAll("li").forEach(function(l) { l.classList.remove("selected"); });
                li.classList.add("selected");
                wrap.classList.remove("open");
            });
        });
        trigger.addEventListener("click", function(e) {
            e.stopPropagation();
            document.querySelectorAll(".qr-custom-select.open").forEach(function(s) { s.classList.remove("open"); });
            wrap.classList.toggle("open");
        });
        menu.addEventListener("click", function(e) {
            e.stopPropagation();
        });
    });

    document.addEventListener("click", function() {
        document.querySelectorAll(".qr-custom-select.open").forEach(function(s) { s.classList.remove("open"); });
    });

    document.querySelectorAll(".qr-preset").forEach(function(presetBtn) {
        presetBtn.addEventListener("click", function() {
            colorDark.value = this.dataset.dark;
            colorLight.value = this.dataset.light;
            document.querySelectorAll(".qr-preset").forEach(function(b) { b.classList.remove("selected"); });
            this.classList.add("selected");
        });
    });

    colorDark.addEventListener("input", function() {
        document.querySelectorAll(".qr-preset.selected").forEach(function(b) { b.classList.remove("selected"); });
    });
    colorLight.addEventListener("input", function() {
        document.querySelectorAll(".qr-preset.selected").forEach(function(b) { b.classList.remove("selected"); });
    });

    function resetParams() {
        colorDark.value = "#003f7f";
        colorLight.value = "#ffffff";
        document.querySelectorAll(".qr-preset").forEach(function(b) { b.classList.remove("selected"); });
        qrSizeWrap.dataset.value = "256";
        qrSizeWrap.querySelector(".qr-select-trigger").textContent = t("Medio (256px)", "Medium (256px)");
        qrSizeWrap.querySelectorAll(".qr-select-menu li").forEach(function(li) {
            li.classList.toggle("selected", li.dataset.value === "256");
        });
        qrEcWrap.dataset.value = "L";
        qrEcWrap.querySelector(".qr-select-trigger").textContent = t("Basso (7%)", "Low (7%)");
        qrEcWrap.querySelectorAll(".qr-select-menu li").forEach(function(li) {
            li.classList.toggle("selected", li.dataset.value === "L");
        });
    }

    document.getElementById("reset-qr").addEventListener("click", resetParams);

    function showError(msg) {
        if (!resultArea) return;
        resultArea.textContent = (msg || "").replace(/\.$/, "");
        resultArea.classList.remove("hidden");
        resultArea.classList.add("error");
        resultArea.style.display = "block";
        resultArea.scrollIntoView({ behavior: "smooth", block: "nearest" });
    }
    function hideError() {
        if (!resultArea) return;
        resultArea.textContent = "";
        resultArea.classList.remove("error");
        resultArea.classList.add("hidden");
        resultArea.style.display = "";
    }

    if (typeof pdfjsLib !== "undefined") {
        pdfjsLib.GlobalWorkerOptions.workerSrc = "https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js";
    }

    btn.addEventListener("click", function() {
        var text = input.value.trim();
        if (!text) {
            showError(t("Inserisci testo o URL, oppure carica un file", "Please enter some text or a URL, or load a file"));
            return;
        }
        hideError();
        output.innerHTML = "";
        try {
            if (typeof QRCode === "undefined") {
                showError(t("Libreria QR non caricata. Aggiorna la pagina", "QR library not loaded. Please refresh the page"));
                return;
            }
            var size = getQrSize();
            new QRCode(output, {
                text: text,
                width: size,
                height: size,
                colorDark: colorDark.value || "#003f7f",
                colorLight: colorLight.value || "#ffffff",
                correctLevel: getCorrectLevel()
            });
            resultDiv.classList.add("show");
        } catch (e) {
            showError(t("Errore durante la generazione del QR code", "Error generating QR code") + ": " + (e.message || e));
            resultDiv.classList.remove("show");
        }
    });

    downloadBtn.addEventListener("click", function() {
        var canvas = output.querySelector("canvas");
        var img = output.querySelector("img");
        if (canvas) {
            var link = document.createElement("a");
            link.download = "qrcode.png";
            link.href = canvas.toDataURL("image/png");
            link.click();
        } else if (img && img.src) {
            var link = document.createElement("a");
            link.download = "qrcode.png";
            link.href = img.src;
            link.click();
        } else {
            showError(t("Genera prima un QR code", "Generate a QR code first"));
        }
    });

    fileInput.addEventListener("change", function() {
        var file = this.files[0];
        if (!file) return;

        var ext = file.name.split(".").pop().toLowerCase();

        if (ext === "txt") {
            hideError();
            var reader = new FileReader();
            reader.onload = function(e) {
                input.value = e.target.result;
            };
            reader.readAsText(file);
        } else if (ext === "pdf") {
            if (typeof pdfjsLib === "undefined") {
                showError(t("Libreria PDF non caricata. Aggiorna la pagina", "PDF library not loaded. Please refresh the page"));
                this.value = "";
                return;
            }
            var reader = new FileReader();
            reader.onload = function(e) {
                pdfjsLib.getDocument(e.target.result).promise.then(function(pdf) {
                    var promises = [];
                    for (var i = 1; i <= pdf.numPages; i++) {
                        (function(pageNum) {
                            promises.push(pdf.getPage(pageNum).then(function(p) {
                                return p.getTextContent().then(function(c) {
                                    return c.items.map(function(x) { return x.str || ""; }).join(" ");
                                });
                            }));
                        })(i);
                    }
                    return Promise.all(promises).then(function(texts) {
                        input.value = texts.join("\n\n");
                        hideError();
                    }).catch(function() { showError(t("Errore nella lettura del PDF", "Error reading PDF")); });
                }).catch(function() { showError(t("Errore nel caricamento del PDF", "Error loading PDF")); });
            };
            reader.onerror = function() { showError(t("Errore nella lettura del file", "Error reading file")); };
            reader.readAsArrayBuffer(file);
        }
        this.value = "";
    });
});
