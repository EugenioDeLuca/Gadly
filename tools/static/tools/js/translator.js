document.addEventListener("DOMContentLoaded", () => {
    const translateBtn = document.getElementById("translate-btn");
    const inputText = document.getElementById("input-text");
    const languageSelect = document.getElementById("language");
    const inputLanguageSelect = document.getElementById("input-language");
    const outputText = document.getElementById("output-text");
    const swapBtn = document.getElementById("swap-btn");

    function initCustomSelect(selectEl) {
        const wrap = selectEl.closest(".custom-select-wrap");
        if (!wrap) return;
        const trigger = document.createElement("div");
        trigger.className = "custom-select-trigger";
        trigger.textContent = selectEl.options[selectEl.selectedIndex].text;
        const dropdown = document.createElement("div");
        dropdown.className = "custom-select-dropdown";
        for (let i = 0; i < selectEl.options.length; i++) {
            const opt = selectEl.options[i];
            const div = document.createElement("div");
            div.className = "custom-select-option" + (opt.selected ? " selected" : "");
            div.textContent = opt.text;
            div.dataset.value = opt.value;
            div.addEventListener("click", () => {
                selectEl.value = opt.value;
                trigger.textContent = opt.text;
                dropdown.querySelectorAll(".custom-select-option").forEach(o => o.classList.remove("selected"));
                div.classList.add("selected");
                wrap.classList.remove("open");
            });
            dropdown.appendChild(div);
        }
        trigger.addEventListener("click", (e) => {
            e.stopPropagation();
            document.querySelectorAll(".custom-select-wrap.open").forEach(w => w.classList.remove("open"));
            wrap.classList.toggle("open");
        });
        wrap.insertBefore(trigger, selectEl);
        wrap.appendChild(dropdown);
    }
    document.addEventListener("click", () => {
        document.querySelectorAll(".custom-select-wrap.open").forEach(w => w.classList.remove("open"));
    });

    initCustomSelect(inputLanguageSelect);
    initCustomSelect(languageSelect);

    swapBtn.addEventListener("click", () => {
        const temp = inputLanguageSelect.value;
        inputLanguageSelect.value = languageSelect.value;
        languageSelect.value = temp;
        const wrapIn = inputLanguageSelect.closest(".custom-select-wrap");
        const wrapOut = languageSelect.closest(".custom-select-wrap");
        if (wrapIn) wrapIn.querySelector(".custom-select-trigger").textContent = inputLanguageSelect.options[inputLanguageSelect.selectedIndex].text;
        if (wrapOut) wrapOut.querySelector(".custom-select-trigger").textContent = languageSelect.options[languageSelect.selectedIndex].text;
        wrapIn?.querySelectorAll(".custom-select-option").forEach(o => o.classList.toggle("selected", o.dataset.value === inputLanguageSelect.value));
        wrapOut?.querySelectorAll(".custom-select-option").forEach(o => o.classList.toggle("selected", o.dataset.value === languageSelect.value));
        translateText();
    });

    // Funzione per tradurre il testo
    const translateText = async () => {
        const text = inputText.value.trim();
        const targetLang = languageSelect.value;  // Lingua di destinazione
        const inputLang = inputLanguageSelect.value;  // Lingua di input

        if (!text) {
            alert("Please enter text to translate!");
            return;
        }

        try {
            const response = await fetch(TRANSLATE_URL, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    q: text,  // Testo da tradurre
                    target: targetLang,  // Lingua di destinazione
                    inputLang: inputLang  // Lingua di input
                })
            });

            const data = await response.json();

            if (data.translatedText) {
                outputText.textContent = data.translatedText;
            } else if (data.error) {
                outputText.textContent = data.error;
            }

        } catch (error) {
            console.error("Error during translation:", error);
            outputText.textContent = "An error occurred while translating.";
        }
    };

    // Evento per il bottone di traduzione
    translateBtn.addEventListener("click", translateText);
});
