document.addEventListener("DOMContentLoaded", function() {
    var gt = (typeof gettext === "function") ? gettext : function(s) { return s; };
    var lang = (document.documentElement.lang || "").toLowerCase();
    var isItalian = lang.indexOf("it") === 0;

    var RESULT_COUNT = 8;

    var topicsIT = {
        sunset: [
            "L'ora d'oro è tutta un'altra storia 🌅",
            "Tramonti così meritano uno stop.",
            "Chiarore caldo e testa leggera.",
            "Oggi il cielo ha fatto il suo spettacolo.",
            "Niente filtro: è tutto vero.",
            "Quando il sole scende, tutto tace un attimo.",
            "Colleziono tramonti, non cose.",
            "Un'altra fine giornata da ricordare.",
            "Luce morbida, pensieri leggeri.",
            "Tra cielo e mare, il posto giusto.",
            "Tramonto + silenzio = combo perfetta.",
            "Se non l'hai visto dal vivo, ti sei perso qualcosa."
        ],
        coffee: [
            "Prima il caffè, poi il resto ☕",
            "Carico a caffè e buone intenzioni.",
            "Ritual sacro: tazza fumante e via.",
            "Senza caffè oggi non si parla.",
            "Un sorso e già va meglio.",
            "Ordine del giorno: aroma e calore.",
            "La pausa giusta ha il sapore che conosci.",
            "Piccolo piacere, grande effetto.",
            "Un espresso e riparti.",
            "Caffè fatto bene = giornata in carreggiata.",
            "Non è dipendenza, è stile di vita.",
            "Fino all'ultima goccia."
        ],
        monday: [
            "Lunedì on: si riparte con calma 📌",
            "Nuova settimana, stesse ambizioni.",
            "Un passo alla volta, ma con costanza.",
            "Oggi si sistema, domani si vola.",
            "Lunedì non è un nemico: è un reset.",
            "Lista corta, priorità chiare.",
            "Si ricomincia, senza drammi.",
            "Focus acceso, distrazioni spente.",
            "Piccoli obiettivi, grandi risultati.",
            "Si entra in modalità 'si fa'.",
            "Ordine mentale, anche se il caffè tarda.",
            "Settimana nuova, energie nuove."
        ],
        travel: [
            "Valigia leggera, idee chiare ✈️",
            "Dove vado, porto me stesso.",
            "Strade nuove, stesso buon umore.",
            "Un'altra tappa, un altro ricordo.",
            "Non conta solo il dove: conta il come ci arrivi.",
            "Mappa aperta, telefono in tasca.",
            "Colleziono posti, non scuse.",
            "Ogni viaggio insegna qualcosa.",
            "Partire è già metà della gioia.",
            "Bussola interna sempre accesa.",
            "Zaino in spalla e si va.",
            "Il mondo è grande: un pezzo alla volta."
        ],
        friends: [
            "Con loro tutto è più semplice.",
            "Risate garantite, filtri zero.",
            "Amici veri = posti fissi al tavolo.",
            "Serata leggenda, anche se domani si paga.",
            "In due righe non ci entra tutto l'affetto.",
            "Chi c'è, c'è.",
            "Storie da raccontare, foto da tenere.",
            "Gruppo top, giornata top.",
            "Non serve il piano perfetto: serve la compagnia giusta.",
            "Tra noi non servono spiegazioni.",
            "Momento da incorniciare.",
            "E questa è solo una parte della giornata."
        ],
        default: [
            "Oggi va così, e va bene così.",
            "Tengo il passo che mi serve.",
            "Piccole cose, grande differenza.",
            "Niente da aggiungere: il frame parla.",
            "Sto bene qui, in questo momento.",
            "Semplice, onesto, mio.",
            "Un giorno alla volta, con cura.",
            "Buona energia, zero rumore inutile.",
            "Mi piace come sta andando.",
            "Qui e ora, senza fretta.",
            "Cose leggere, testa serena.",
            "Se lo guardi bene, è già abbastanza."
        ]
    };

    var topicsEN = {
        sunset: [
            "Golden hour hits different 🌅",
            "Sunsets & good vibes",
            "Chasing the golden light",
            "Sky painted, mind quiet.",
            "No filter needed tonight.",
            "Collecting sunsets, not things.",
            "Warm light, soft thoughts.",
            "Another ending worth remembering.",
            "Between sky and sea — right on time.",
            "Sunset + silence = perfect combo.",
            "If you weren't here, you missed it.",
            "Slow end to a full day."
        ],
        coffee: [
            "Coffee first, adulting second ☕",
            "Fueled by caffeine and good intentions.",
            "Small ritual, big difference.",
            "No coffee, no coherent sentences.",
            "One sip and the day reboots.",
            "Hot cup, clear head.",
            "Tiny pleasure, huge effect.",
            "Espresso and go.",
            "Good coffee, good pace.",
            "Not addiction — lifestyle.",
            "Until the last drop."
        ],
        monday: [
            "Monday mode: steady progress 📌",
            "New week, same focus.",
            "One step at a time.",
            "Reset day — no drama.",
            "Short list, clear priorities.",
            "We move.",
            "Monday is a fresh start, not a villain.",
            "Small goals, big wins.",
            "Eyes on the week.",
            "Calm energy, loud results (later).",
            "Let's build the week on purpose.",
            "New week, new pace."
        ],
        travel: [
            "Light luggage, clear mind ✈️",
            "New roads, same good mood.",
            "Another stamp, another story.",
            "It's not only where — it's how you go.",
            "Collecting places, not excuses.",
            "Map open, phone in pocket.",
            "Every trip teaches something.",
            "Leaving is already half the joy.",
            "Backpack on and go.",
            "The world is wide — one piece at a time."
        ],
        friends: [
            "With them, everything feels easier.",
            "Real laughs, zero filters.",
            "Good friends = fixed seats at the table.",
            "Legendary night incoming.",
            "Can't fit the whole story in one caption.",
            "The right company fixes the day.",
            "Stories to tell, photos to keep.",
            "Top crew, top day.",
            "No perfect plan — just the right people.",
            "Moments worth framing."
        ],
        default: [
            "Living my best life",
            "Making memories",
            "Good vibes only",
            "Here for the little things",
            "Today, exactly like this.",
            "Keeping the pace that fits.",
            "Simple, honest, mine.",
            "One day at a time.",
            "Good energy, less noise.",
            "Right here, right now."
        ]
    };

    var topics = isItalian ? topicsIT : topicsEN;

    var topicAliasesIT = {
        tramonto: "sunset",
        alba: "sunset",
        golden: "sunset",
        caffè: "coffee",
        caffe: "coffee",
        espresso: "coffee",
        lunedi: "monday",
        lunedì: "monday",
        settimana: "monday",
        viaggio: "travel",
        viaggi: "travel",
        vacanza: "travel",
        amici: "friends",
        amico: "friends",
        amica: "friends",
        serata: "friends"
    };

    function resolveTopicKey(raw) {
        var k = (raw || "").trim().toLowerCase();
        if (!k) return "";
        if (topics[k]) return k;
        if (isItalian && topicAliasesIT[k]) return topicAliasesIT[k];
        return k;
    }

    function escapeHtml(str) {
        return String(str)
            .replace(/&/g, "&amp;")
            .replace(/</g, "&lt;")
            .replace(/>/g, "&gt;")
            .replace(/"/g, "&quot;");
    }

    function shuffle(arr) {
        var a = arr.slice();
        for (var i = a.length - 1; i > 0; i--) {
            var j = Math.floor(Math.random() * (i + 1));
            var t = a[i];
            a[i] = a[j];
            a[j] = t;
        }
        return a;
    }

    function poolForTopicKey(topicKey) {
        var pool = topics[topicKey];
        if (pool && pool.length) return pool.slice();
        return topics.default.slice();
    }

    function buildCaptionList(topicRaw) {
        var key = resolveTopicKey(topicRaw);
        if (!key) {
            return shuffle(topics.default.concat()).slice(0, RESULT_COUNT);
        }
        if (topics[key]) {
            var p = poolForTopicKey(key);
            if (p.length >= RESULT_COUNT) {
                return shuffle(p).slice(0, RESULT_COUNT);
            }
            var merged = p.concat(topics.default);
            return shuffle(merged).slice(0, RESULT_COUNT);
        }
        return shuffle(topics.default.concat()).slice(0, RESULT_COUNT);
    }

    var platformWrap = document.getElementById("caption-platform-wrap");
    var topicInput = document.getElementById("caption-topic");
    var resultArea = document.getElementById("result-area");
    var btnGen = document.getElementById("btn-generate");
    var btnCopy = document.getElementById("btn-copy");

    if (platformWrap) {
        var trigger = platformWrap.querySelector(".text-tool-select-trigger");
        var menu = platformWrap.querySelector(".text-tool-select-menu");
        var items = menu.querySelectorAll("li");
        menu.querySelectorAll("li").forEach(function(li) {
            li.addEventListener("click", function() {
                platformWrap.dataset.value = li.dataset.value;
                trigger.textContent = li.textContent;
                items.forEach(function(l) { l.classList.remove("selected"); l.style.display = ""; });
                li.classList.add("selected");
                platformWrap.classList.remove("open");
            });
        });
        trigger.addEventListener("click", function(e) {
            e.stopPropagation();
            document.querySelectorAll(".text-tool-select.open").forEach(function(s) { s.classList.remove("open"); });
            var current = platformWrap.dataset.value;
            items.forEach(function(li) {
                li.style.display = li.dataset.value === current ? "none" : "";
            });
            platformWrap.classList.toggle("open");
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
        var topicVal = (topicInput.value || "").trim();
        var captions = buildCaptionList(topicVal);
        var title = gt("Suggested captions");
        var selAll = gt("Select all");
        var selNone = gt("Deselect all");
        var copyHint = gt("The Copy button copies only the captions you have selected.");
        var html = '<div class="caption-results-header">';
        html += '<p class="caption-results-title">' + escapeHtml(title) + "</p>";
        html += '<div class="caption-select-actions">';
        html += '<button type="button" class="caption-select-action-btn" id="caption-select-all">' + escapeHtml(selAll) + "</button>";
        html += '<button type="button" class="caption-select-action-btn" id="caption-select-none">' + escapeHtml(selNone) + "</button>";
        html += "</div></div>";
        html += '<ol class="caption-results-list">';
        captions.forEach(function(line) {
            html += '<li class="caption-result-row"><label class="caption-select-label">';
            html += '<input type="checkbox" class="caption-pick" />';
            html += '<span class="caption-text">' + escapeHtml(line) + "</span>";
            html += "</label></li>";
        });
        html += "</ol>";
        html += '<p class="caption-copy-footnote">' + escapeHtml(copyHint) + "</p>";
        resultArea.innerHTML = html;
        resultArea.classList.remove("hidden");
    });

    btnCopy.addEventListener("click", function() {
        var picked = resultArea.querySelectorAll(".caption-pick:checked");
        if (!picked.length) {
            if (resultArea.querySelector(".caption-pick")) {
                showTextToolInlineError(resultArea, gt("Select at least one caption to copy."));
            }
            return;
        }
        var parts = [];
        picked.forEach(function(cb) {
            var label = cb.closest(".caption-select-label");
            var span = label && label.querySelector(".caption-text");
            if (span) parts.push(span.textContent.trim());
        });
        var text = parts.join("\n\n").trim();
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
