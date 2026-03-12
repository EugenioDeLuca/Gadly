document.addEventListener("DOMContentLoaded", function() {
    var words1 = ["cosmic", "shadow", "nova", "pixel", "frost", "ember", "vibe", "flow", "echo", "blaze", "storm", "neon", "ghost", "spark", "flame", "mystic", "cyber", "lunar", "stellar", "prism"];
    var words2 = ["panda", "wolf", "phoenix", "fox", "raven", "tiger", "dragon", "hawk", "bear", "eagle", "lion", "falcon", "owl", "cloud", "star", "moon", "sun", "sky", "ocean", "fire"];
    var adjectives = ["happy", "cool", "epic", "wild", "bold", "swift", "dark", "bright", "tiny", "big", "quick", "lazy", "smart", "lucky", "golden", "silver", "blue", "red"];
    var nouns = ["cloud", "panda", "wolf", "fox", "lion", "tiger", "bird", "fish", "star", "moon", "wave", "storm", "flame", "frost"];

    function pick(arr) { return arr[Math.floor(Math.random() * arr.length)]; }
    function randNum(min, max) { return Math.floor(Math.random() * (max - min + 1)) + min; }
    function randStr(len) {
        var chars = "abcdefghijklmnopqrstuvwxyz0123456789_";
        var s = "";
        for (var i = 0; i < len; i++) s += chars[Math.floor(Math.random() * chars.length)];
        return s;
    }

    var atChar = "\u0040"; // @ (chiocciola)
    function genOne(style) {
        if (style === "word_number") return pick(words1) + randNum(10, 999);
        if (style === "word_number_at") return atChar + pick(words1) + randNum(10, 999);
        if (style === "word_at_number") return pick(words1) + atChar + randNum(10, 999);
        if (style === "word_at_word") return pick(words1) + atChar + pick(words2);
        if (style === "word_word") return pick(words1) + "_" + pick(words2);
        if (style === "adjective_noun") return pick(adjectives) + "_" + pick(nouns);
        if (style === "random_chars") return randStr(randNum(6, 12));
        return pick(words1) + randNum(10, 99);
    }

    var styleWrap = document.getElementById("username-style-wrap");
    var countInput = document.getElementById("username-count");
    var resultArea = document.getElementById("result-area");
    var btnGen = document.getElementById("btn-generate");
    var btnCopy = document.getElementById("btn-copy");

    if (styleWrap) {
        var trigger = styleWrap.querySelector(".text-tool-select-trigger");
        var menu = styleWrap.querySelector(".text-tool-select-menu");
        menu.querySelectorAll("li").forEach(function(li) {
            li.addEventListener("click", function() {
                styleWrap.dataset.value = li.dataset.value;
                trigger.textContent = li.textContent;
                menu.querySelectorAll("li").forEach(function(l) { l.classList.remove("selected"); });
                li.classList.add("selected");
                styleWrap.classList.remove("open");
            });
        });
        trigger.addEventListener("click", function(e) {
            e.stopPropagation();
            document.querySelectorAll(".text-tool-select.open").forEach(function(s) { s.classList.remove("open"); });
            styleWrap.classList.toggle("open");
        });
        menu.addEventListener("click", function(e) { e.stopPropagation(); });
    }

    document.addEventListener("click", function() {
        document.querySelectorAll(".text-tool-select.open").forEach(function(s) { s.classList.remove("open"); });
    });

    btnGen.addEventListener("click", function() {
        var n = parseInt(countInput.value, 10) || 5;
        n = Math.min(5000, Math.max(1, n));
        var style = styleWrap ? styleWrap.dataset.value : "word_number";
        var list = [];
        for (var i = 0; i < n; i++) list.push(genOne(style));
        resultArea.textContent = list.join("\n");
        resultArea.classList.remove("hidden");
    });

    btnCopy.addEventListener("click", function() {
        var text = resultArea.textContent;
        if (!text) return;
        navigator.clipboard.writeText(text).then(function() {
            btnCopy.textContent = "Copied!";
            btnCopy.classList.add("copied");
            setTimeout(function() {
                btnCopy.textContent = "Copy";
                btnCopy.classList.remove("copied");
            }, 1500);
        });
    });
});
