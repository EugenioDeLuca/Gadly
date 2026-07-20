document.addEventListener("DOMContentLoaded", function() {
    var gt = (typeof gettext === "function") ? gettext : function(s) { return s; };
    var lang = (document.documentElement.lang || "").toLowerCase();
    var isItalian = lang.indexOf("it") === 0;

    var words1EN = ["cosmic", "shadow", "nova", "pixel", "frost", "ember", "vibe", "flow", "echo", "blaze", "storm", "neon", "ghost", "spark", "flame", "mystic", "cyber", "lunar", "stellar", "prism"];
    var words2EN = ["panda", "wolf", "phoenix", "fox", "raven", "tiger", "dragon", "hawk", "bear", "eagle", "lion", "falcon", "owl", "cloud", "star", "moon", "sun", "sky", "ocean", "fire"];
    var adjectivesEN = ["happy", "cool", "epic", "wild", "bold", "swift", "dark", "bright", "tiny", "big", "quick", "lazy", "smart", "lucky", "golden", "silver", "blue", "red"];
    var nounsEN = ["cloud", "panda", "wolf", "fox", "lion", "tiger", "bird", "fish", "star", "moon", "wave", "storm", "flame", "frost"];

    /* Parole ASCII (senza accenti) adatte a username */
    var words1IT = ["cosmo", "luna", "stella", "ombra", "fuoco", "vento", "onda", "nero", "verde", "zen", "pixel", "eco", "neo", "astro", "alfa", "beta", "vibe", "mistico", "lampo", "fumo"];
    var words2IT = ["panda", "lupo", "volpe", "aquila", "orso", "leone", "drago", "falco", "gatto", "riccio", "pesce", "sole", "mare", "nuvola", "fiume", "bosco", "campo", "lago", "faro", "nido"];
    var adjectivesIT = ["felice", "forte", "veloce", "calmo", "audace", "gentile", "libero", "puro", "vivo", "saldo", "scuro", "chiaro", "magico", "agile", "buono", "vero", "dolce", "fermo", "tosto", "lesto"];
    var nounsIT = ["nuvola", "lupo", "onda", "stella", "sole", "fiore", "pietra", "casa", "bosco", "lago", "campo", "vento", "luce", "ombra", "fiume", "muro", "porto", "faro", "nido", "fondo"];

    function banks() {
        if (isItalian) {
            return { w1: words1IT, w2: words2IT, adj: adjectivesIT, nouns: nounsIT };
        }
        return { w1: words1EN, w2: words2EN, adj: adjectivesEN, nouns: nounsEN };
    }

    function pick(arr) { return arr[Math.floor(Math.random() * arr.length)]; }
    function randNum(min, max) { return Math.floor(Math.random() * (max - min + 1)) + min; }
    function randStr(len) {
        var chars = "abcdefghijklmnopqrstuvwxyz0123456789_";
        var s = "";
        for (var i = 0; i < len; i++) s += chars[Math.floor(Math.random() * chars.length)];
        return s;
    }

    var atChar = "\u0040";
    function genOne(style, B) {
        if (style === "word_number") return pick(B.w1) + randNum(10, 999);
        if (style === "word_number_at") return atChar + pick(B.w1) + randNum(10, 999);
        if (style === "word_at_number") return pick(B.w1) + atChar + randNum(10, 999);
        if (style === "word_at_word") return pick(B.w1) + atChar + pick(B.w2);
        if (style === "word_word") return pick(B.w1) + "_" + pick(B.w2);
        if (style === "adjective_noun") return pick(B.adj) + "_" + pick(B.nouns);
        if (style === "random_chars") return randStr(randNum(6, 12));
        return pick(B.w1) + randNum(10, 99);
    }

    function normalizeName(str) {
        if (str == null || typeof str !== "string") return "";
        var s = str.trim().toLowerCase();
        s = s.replace(/\s+/g, "").replace(/[\u200B-\u200D\uFEFF]/g, "").replace(/[^a-z0-9_]/g, "");
        return s.length > 20 ? s.slice(0, 20) : s;
    }

    function genOneWithName(style, base, B) {
        if (style === "word_number") return base + randNum(10, 999);
        if (style === "word_number_at") return atChar + base + randNum(10, 999);
        if (style === "word_at_number") return base + atChar + randNum(10, 999);
        if (style === "word_at_word") return base + atChar + pick(B.w2);
        if (style === "word_word") return base + "_" + pick(B.w2);
        if (style === "adjective_noun") return base + "_" + pick(B.nouns);
        if (style === "random_chars") return base + randStr(randNum(3, 6));
        return base + randNum(10, 99);
    }

    var styleWrap = document.getElementById("username-style-wrap");
    var countInput = document.getElementById("username-count");
    var baseNameInput = document.getElementById("username-base-name");
    var resultArea = document.getElementById("result-area");
    var btnGen = document.getElementById("btn-generate");
    var btnCopy = document.getElementById("btn-copy");
    var lastGeneratedUsernames = [];

    /* Mobile: niente focus al touch (tap ripetuti = stesso effetto; blur gestito da mobile-tap.js) */
    if (window.matchMedia && window.matchMedia("(max-width: 768px)").matches) {
        [btnGen, btnCopy].forEach(function(btn) {
            if (!btn) return;
            btn.setAttribute("tabindex", "-1");
            btn.addEventListener("pointerdown", function(e) {
                if (e.pointerType === "mouse") return;
                e.preventDefault();
            });
        });
    }

    function isMobileViewport() {
        return window.matchMedia && window.matchMedia("(max-width: 480px)").matches;
    }

    function escapeHtml(str) {
        return String(str)
            .replace(/&/g, "&amp;")
            .replace(/</g, "&lt;")
            .replace(/>/g, "&gt;")
            .replace(/"/g, "&quot;");
    }

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

    function showTextToolInlineError(area, msg) {
        var old = area.querySelector(".text-tool-inline-error");
        if (old) old.remove();
        var div = document.createElement("div");
        div.className = "text-tool-inline-error";
        div.setAttribute("role", "alert");
        div.textContent = msg;
        area.insertBefore(div, area.firstChild);
    }
    function clearTextToolInlineError(area) {
        var old = area.querySelector(".text-tool-inline-error");
        if (old) old.remove();
    }

    resultArea.addEventListener("change", function(e) {
        var t = e.target;
        if (t && t.classList && t.classList.contains("caption-pick")) {
            clearTextToolInlineError(resultArea);
        }
    });

    resultArea.addEventListener("click", function(e) {
        var t = e.target;
        if (t && t.id === "caption-select-all") {
            e.preventDefault();
            resultArea.querySelectorAll(".caption-pick").forEach(function(cb) {
                cb.checked = true;
            });
            clearTextToolInlineError(resultArea);
        }
        if (t && t.id === "caption-select-none") {
            e.preventDefault();
            resultArea.querySelectorAll(".caption-pick").forEach(function(cb) {
                cb.checked = false;
            });
        }
    });

    btnGen.addEventListener("click", function() {
        var n = parseInt(countInput.value, 10) || 5;
        n = Math.min(5000, Math.max(1, n));
        var style = styleWrap ? styleWrap.dataset.value : "word_number";
        var nameEl = document.getElementById("username-base-name");
        var base = nameEl ? normalizeName(nameEl.value) : "";
        var B = banks();
        var list = [];
        var seen = {};
        for (var i = 0; i < n; i++) {
            var u = base ? genOneWithName(style, base, B) : genOne(style, B);
            if (seen[u]) { i--; continue; }
            seen[u] = true;
            list.push(u);
        }
        var title = gettext("Suggested usernames");
        var selAll = gettext("Select all");
        var selNone = gettext("Deselect all");
        var copyHint = gettext("The Copy button copies only the usernames you have selected.");
        lastGeneratedUsernames = list.slice();
        var html = '<div class="caption-results-header"><p class="caption-results-title">' + escapeHtml(title) + "</p>";
        if (!isMobileViewport()) {
            html += '<div class="caption-select-actions">';
            html += '<button type="button" class="caption-select-action-btn" id="caption-select-all">' + escapeHtml(selAll) + "</button>";
            html += '<button type="button" class="caption-select-action-btn" id="caption-select-none">' + escapeHtml(selNone) + "</button>";
            html += "</div>";
        }
        html += "</div>";
        html += '<ol class="caption-results-list">';
        list.forEach(function(u) {
            if (isMobileViewport()) {
                html += '<li class="caption-result-row"><span class="caption-text">' + escapeHtml(u) + "</span></li>";
            } else {
                html += '<li class="caption-result-row"><label class="caption-select-label">';
                html += '<input type="checkbox" class="caption-pick" />';
                html += '<span class="caption-text">' + escapeHtml(u) + "</span>";
                html += "</label></li>";
            }
        });
        html += "</ol>";
        if (!isMobileViewport()) {
            html += '<p class="caption-copy-footnote">' + escapeHtml(copyHint) + "</p>";
        }
        resultArea.innerHTML = html;
        resultArea.classList.remove("hidden");
    });

    btnCopy.addEventListener("click", function() {
        if (isMobileViewport()) {
            if (!lastGeneratedUsernames.length) return;
            var mobileText = lastGeneratedUsernames.join("\n").trim();
            if (!mobileText) return;
            navigator.clipboard.writeText(mobileText).then(function() {
                btnCopy.textContent = gt("Copied!");
                btnCopy.classList.add("copied");
                setTimeout(function() {
                    btnCopy.textContent = gt("Copy");
                    btnCopy.classList.remove("copied");
                }, 1500);
            });
            return;
        }
        var picked = resultArea.querySelectorAll(".caption-pick:checked");
        if (!picked.length) {
            if (resultArea.querySelector(".caption-pick")) {
                showTextToolInlineError(resultArea, gettext("Select at least one username to copy."));
            }
            return;
        }
        var parts = [];
        picked.forEach(function(cb) {
            var label = cb.closest(".caption-select-label");
            var span = label && label.querySelector(".caption-text");
            if (span) parts.push(span.textContent.trim());
        });
        var text = parts.join("\n").trim();
        if (!text) return;
        clearTextToolInlineError(resultArea);
        navigator.clipboard.writeText(text).then(function() {
            btnCopy.textContent = gt("Copied!");
            btnCopy.classList.add("copied");
            setTimeout(function() {
                btnCopy.textContent = gt("Copy");
                btnCopy.classList.remove("copied");
            }, 1500);
        });
    });
});
