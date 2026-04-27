document.addEventListener("DOMContentLoaded", function() {
    var gt = (typeof gettext === "function") ? gettext : function(s) { return s; };
    var lang = (document.documentElement.lang || "").toLowerCase();
    var isItalian = lang.indexOf("it") === 0;

    var RESULT_COUNT = 8;

    var starts = ["Living my best life", "Dreamer", "Creating", "Exploring", "Here for the", "Just a", "Coffee addict", "Wanderer", "Artist", "Creator", "Building", "Chasing", "Making it happen", "Fueled by", "Turning ideas into content", "On a mission to inspire", "Sharing real moments", "Learning every day", "Crafting my own path", "Always evolving", "Quietly ambitious", "Daydreaming on purpose", "Collecting stories", "Soft launch era", "Main character energy", "Plot twist incoming", "Less noise, more craft", "Building in public", "Curious by default", "Grateful for small wins", "Weekend explorer", "City lights & late ideas", "Analog heart, digital pace", "Here to learn out loud", "Small steps, loud heart", "Making it up as I go", "Powered by curiosity", "Good people, good coffee", "Sunrise person sometimes", "Notes app philosopher"];
    var middles = ["adventures", "vibes", "good energy", "positive thoughts", "coffee", "creativity", "passion", "dreams", "moments", "memories", "sunsets", "music", "art", "life", "fresh ideas", "bold moves", "authentic stories", "small wins", "big goals", "daily inspiration", "late-night ideas", "slow mornings", "loud laughs", "quiet focus", "random detours", "honest captions", "tiny rituals", "big playlists", "cheap thrills", "real talk", "soft launches", "hard lessons", "easy smiles", "deep dives", "short walks", "long reads", "warm light", "cold brew", "new angles", "old journals"];
    var ends = ["✨", "🌟", "💫", "🎬", "📸", "🔗", "| DM for collabs", "| Link in bio", "📍 World", "🌍", "👇", "🔥", "💯", "| Open to partnerships", "| Let's build together", "| New posts weekly", "| Stories > perfection", "| Mostly caffeine", "| Work in progress", "| Vibes archived here", "| Send memes", "| Building slowly", "| Thanks for stopping by", "| More soon", "| Stay curious", "| Keep it kind", "| New chapter loading"];

    var niches = {
        travel: ["🌍 Travel addict", "Wanderlust", "Exploring the world", "Adventure seeker", "Lost in wanderlust", "Roaming the globe", "Passport ready", "Maps in my camera roll", "Window seat energy", "Collecting stamps & stories", "Next stop: anywhere", "Jet lag is a mindset", "Trains > traffic", "Hostel stories for days", "Local food, global heart"],
        fitness: ["💪 No pain no gain", "Gym lover", "Fitness journey", "Getting stronger", "Healthy lifestyle", "Train hard", "Rest days count too", "One more rep mindset", "Mobility nerd", "Outdoor miles", "Morning stretch club", "Protein & patience", "Chasing PRs slowly", "Sweat now, smile later", "Form over ego"],
        food: ["🍕 Food lover", "Eating my way through", "Foodie at heart", "Good vibes & good food", "Chef at home", "Taste the world", "Spice cabinet supremacy", "Farmers market regular", "Leftovers artist", "Brunch is a sport", "Street food tourist", "Home cook, loud flavors", "Dessert first sometimes", "Recipe tabs everywhere", "Olive oil in my veins"],
        fashion: ["✨ Style over everything", "Fashion addict", "Dressed to impress", "Trendsetter", "Outfit of the day", "Living in style", "Vintage finds > fast fashion", "Denim & confidence", "Accessories tell the story", "Neutral palette, bold ideas", "Comfortable & intentional", "Tailoring matters", "Mood board life", "Less closet, more outfits", "Details are the flex"],
        default: ["Living life", "Creating content", "Just vibing", "Making memories", "Here for good times", "Doing my thing", "Soft launch, loud heart", "Real life, cropped frame", "Learning in public", "Grateful & growing", "Plot twist: I'm trying", "Notes app philosopher", "Weekend main character", "Kind over cool", "Curious, not perfect"]
    };

    var fullBioRoles = ["a creative", "a photographer", "a traveler", "an artist", "a content creator", "a designer", "a developer", "a writer", "a foodie", "a fitness enthusiast", "a music lover", "a storyteller", "a marketer", "a podcaster", "a hobbyist chef", "a weekend hiker"];
    var fullBioWho = ["who loves", "passionate about", "obsessed with", "always chasing", "driven by", "focused on", "curious about"];
    var fullBioPassions = ["travel, coffee, and good vibes", "photography and storytelling", "exploring new places and cultures", "creating meaningful content", "design and aesthetics", "building things and solving problems", "writing and reading", "cooking and trying new recipes", "staying active and healthy", "music and live shows", "community and honest conversations", "slow mornings and loud ideas", "maps, playlists, and side projects", "light, color, and tiny details", "learning in public and shipping often"];
    var fullBioSecond = ["When I'm not working, you'll find me", "In my free time I enjoy", "Outside of that, I love", "I also enjoy", "Beyond that, I'm into", "On slower days, I'm usually", "If I'm offline, I'm probably", "After hours, I reset by"];
    var fullBioActivities = ["exploring hidden gems in the city", "hiking and being outdoors", "trying new coffee shops", "curating my Spotify playlists", "binge-watching shows", "reading and learning new things", "cooking for friends", "taking photos of random things", "playing sports or hitting the gym", "walking without a map", "sketching bad ideas on napkins", "volunteering when I can", "learning a new skill badly on purpose", "hosting dinner with too many dishes", "people-watching with headphones on"];
    var fullBioEnd = ["Let's connect!", "DM me for collabs.", "Say hi!", "Link in bio.", "Drop a message!", "Always happy to chat.", "Tell me what you're building.", "Catch you in the comments.", "P.S. thanks for reading this far."];

    var startsIt = ["Vivo la mia vita al meglio", "Sognatore", "Creo", "Esploro", "Qui per le", "Solo un", "Dipendente dal caffè", "Viaggiatore", "Artista", "Creator", "Costruisco", "Inseguo", "Lo faccio accadere", "Mosso da", "Trasformo idee in contenuti", "Condivido momenti autentici", "Ogni giorno una nuova sfida", "Creo con passione", "Sempre in movimento", "Alla ricerca della prossima ispirazione", "Ambizione silenziosa", "Testa tra le nuvole (con calendario)", "Colleziono storie, non like", "Era soft launch", "Energia da co-protagonista", "Meno rumore, più cura", "Costruisco in pubblico", "Curioso per natura", "Grato per le piccole vittorie", "Esploratore del weekend", "Luci della città e idee tardi", "Cuore analogico, ritmo digitale", "Imparo ad alta voce", "Passi piccoli, cuore rumoroso", "Mi invento la strada", "Spinto dalla curiosità", "Brave persone, buon caffè", "Alba… ogni tanto", "Filosofo dell'app Note"];
    var middlesIt = ["avventure", "vibrazioni", "buona energia", "pensieri positivi", "caffè", "creatività", "passione", "sogni", "momenti", "ricordi", "tramonti", "musica", "arte", "vita", "idee fresche", "nuovi obiettivi", "storie autentiche", "piccole vittorie", "grandi traguardi", "ispirazione quotidiana", "idee notturne", "mattine lente", "risate rumorose", "focus silenzioso", "deviazioni improvvisate", "didascalie sincere", "piccoli rituali", "playlist infinite", "piccoli lussi", "chiacchiere vere", "lanci morbidi", "lezioni dure", "sorrisi facili", "immersioni profonde", "passeggiate brevi", "letture lunghe", "luce calda", "cold brew", "nuovi punti di vista", "vecchi diari"];
    var endsIt = ["✨", "🌟", "💫", "🎬", "📸", "🔗", "| DM per collaborazioni", "| Link in bio", "📍 Mondo", "🌍", "👇", "🔥", "💯", "| Aperto a partnership", "| Costruiamo qualcosa insieme", "| Nuovi contenuti ogni settimana", "| Storie > perfezione", "| Principalmente caffeina", "| Work in progress", "| Vibes archiviate qui", "| Mandami meme", "| Costruisco con calma", "| Grazie per essere passato", "| A presto", "| Resta curioso", "| Gentilezza first", "| Nuovo capitolo in caricamento"];

    var nichesIt = {
        travel: ["🌍 Travel addicted", "Voglia di viaggiare", "Esploro il mondo", "Cercatore di avventure", "Perso nella wanderlust", "In giro per il globo", "Passaporto sempre pronto", "Ogni viaggio racconta una storia", "Colleziono destinazioni, non cose", "Nato per esplorare", "Posto finestrino sempre", "Treni > traffico", "Storie da ostello", "Cibo locale, cuore globale", "Prossima fermata: ovunque"],
        fitness: ["💪 No pain no gain", "Amante della palestra", "Percorso fitness", "Divento più forte", "Stile di vita sano", "Allenati duro", "Anche i giorni di riposo contano", "Una rip in più", "Nerd della mobilità", "Chilometri all'aperto", "Stretch del mattino", "Proteine e pazienza", "PR lenti ma sicuri", "Sudore oggi, sorrisi dopo", "Tecnica prima dell'ego"],
        food: ["🍕 Amante del cibo", "Mangio in giro per il mondo", "Foodie nel cuore", "Buone vibrazioni e buon cibo", "Chef a casa", "Assapora il mondo", "Spezie sempre pronte", "Mercato contadino addicted", "Artista degli avanzi", "Brunch è uno sport", "Street food tourist", "Casa mia, sapori forti", "A volte dessert first", "Tab ricette infinite", "Olio EVO nelle vene"],
        fashion: ["✨ Lo stile prima di tutto", "Fashion addicted", "Vestito per colpire", "Trendsetter", "Outfit del giorno", "Vivo di stile", "Vintage > fast fashion", "Denim e sicurezza", "Gli accessori raccontano", "Palette neutra, idee forti", "Comodo ma intenzionale", "Taglio che conta", "Vita da mood board", "Meno armadio, più outfit", "Dettaglio = flex"],
        default: ["Vivo la vita", "Creo contenuti", "Solo buone vibrazioni", "Creo ricordi", "Qui per i bei momenti", "Seguo la mia strada", "Trasformo idee in realtà", "Condivido ciò che amo", "Ogni giorno una nuova occasione", "Autenticità sempre", "Soft launch, cuore rumoroso", "Vita vera, frame stretto", "Imparo in pubblico", "Grato e in crescita", "Plot twist: ci provo", "Filosofo dell'app Note", "Co-protagonista del weekend", "Gentile > figo", "Curioso, non perfetto"]
    };

    var fullBioRolesIt = ["un creativo", "un fotografo", "un viaggiatore", "un artista", "un content creator", "un designer", "uno sviluppatore", "uno scrittore", "un foodie", "un appassionato di fitness", "un amante della musica", "un marketer digitale", "uno storyteller", "un podcaster", "uno chef hobbista", "uno escursionista del weekend"];
    var fullBioWhoIt = ["che ama", "appassionato di", "ossessionato da", "sempre alla ricerca di", "guidato da", "focalizzato su", "ispirato da", "curioso di"];
    var fullBioPassionsIt = ["viaggi, caffè e belle vibrazioni", "fotografia e narrazione visiva", "nuovi luoghi e culture", "contenuti autentici e utili", "design ed estetica", "costruire soluzioni e risolvere problemi", "scrittura e lettura", "cucina e nuove ricette", "benessere e stile di vita attivo", "musica e concerti dal vivo", "idee digitali e creatività", "progetti che generano impatto", "community e chiacchiere sincere", "mattine lente e idee rumorose", "mappe, playlist e side project", "luce, colore e dettagli piccoli", "imparare in pubblico e pubblicare spesso"];
    var fullBioSecondIt = ["Quando non lavoro, mi trovi a", "Nel tempo libero mi piace", "Oltre a questo, amo", "Mi piace anche", "Inoltre, sono appassionato di", "Fuori dal lavoro, adoro", "Nei giorni più lenti, di solito", "Se sono offline, probabilmente", "Dopo lavoro, mi ricarico con"];
    var fullBioActivitiesIt = ["esplorare angoli nascosti della città", "fare trekking e vivere la natura", "scoprire nuove caffetterie", "curare le mie playlist", "guardare serie e film", "leggere e imparare cose nuove", "cucinare per amici e famiglia", "fotografare dettagli quotidiani", "fare sport e allenarmi con costanza", "sperimentare nuove idee creative", "lavorare su progetti personali", "raccontare storie attraverso immagini e parole", "camminare senza mappa", "schizzare idee brutte su tovaglioli", "fare volontariato quando posso", "imparare una skill nuova (male, apposta)", "cene a casa con troppe pietanze", "guardare la gente in panchina con le cuffie"];
    var fullBioEndIt = ["Connettiamoci!", "Scrivimi per collaborazioni.", "Scrivimi!", "Link in bio.", "Mandami un messaggio!", "Parliamone in DM!", "Ci sentiamo presto!", "Sempre felice di chiacchierare.", "Dimmi cosa stai costruendo.", "Ci vediamo nei commenti.", "P.S. grazie per essere arrivato fin qui."];

    var nicheAliasesIT = {
        viaggio: "travel",
        viaggi: "travel",
        viaggiare: "travel",
        wanderlust: "travel",
        palestra: "fitness",
        gym: "fitness",
        cibo: "food",
        ricette: "food",
        cucina: "food",
        moda: "fashion",
        stile: "fashion"
    };

    function resolveNicheKey(raw) {
        var k = (raw || "").trim().toLowerCase();
        if (!k) return "default";
        if (niches[k]) return k;
        if (isItalian && nicheAliasesIT[k]) return nicheAliasesIT[k];
        return "default";
    }

    function pick(arr) { return arr[Math.floor(Math.random() * arr.length)]; }

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

    function pickVariety(pool, v) {
        if (!pool || !pool.length) return "";
        return pool[v % pool.length];
    }

    function getPlatformTail(platform) {
        if (isItalian) {
            if (platform === "instagram") return ["| Seguimi su Instagram", "| Reel e stories ogni giorno", "| DM aperti"];
            if (platform === "tiktok") return ["| Nuovi video su TikTok", "| Trend e video brevi", "| Seguimi per altri contenuti"];
            return ["| Scrivimi in DM"];
        }
        if (platform === "instagram") return ["| Follow me on Instagram", "| Daily reels and stories", "| DMs open"];
        if (platform === "tiktok") return ["| New videos on TikTok", "| Trends and short videos", "| Follow for more"];
        return ["| DM me"];
    }

    function genShortBio(platform, niche, v) {
        v = v || 0;
        var localNiches = isItalian ? nichesIt : niches;
        var localEnds = shuffle((isItalian ? endsIt : ends).concat(getPlatformTail(platform)));
        var localStarts = isItalian ? startsIt : starts;
        var localMiddles = isItalian ? middlesIt : middles;

        if (niche && localNiches[niche]) {
            var nicheLines = shuffle(localNiches[niche].slice());
            var t = pickVariety(nicheLines, v * 3 + 1);
            var e = pickVariety(localEnds, v * 5 + 2);
            return t + " " + e;
        }
        var sPool = shuffle(localStarts.slice());
        var mPool = shuffle(localMiddles.slice());
        var s = pickVariety(sPool, v);
        var m = pickVariety(mPool, v * 3 + 7);
        var e = pickVariety(localEnds, v * 5 + 11);
        return s + " " + m + " " + e;
    }

    function genFullBio(v) {
        v = v || 0;
        var roles = shuffle((isItalian ? fullBioRolesIt : fullBioRoles).slice());
        var who = shuffle((isItalian ? fullBioWhoIt : fullBioWho).slice());
        var passions = shuffle((isItalian ? fullBioPassionsIt : fullBioPassions).slice());
        var secondStart = shuffle((isItalian ? fullBioSecondIt : fullBioSecond).slice());
        var activities = shuffle((isItalian ? fullBioActivitiesIt : fullBioActivities).slice());
        var end = shuffle((isItalian ? fullBioEndIt : fullBioEnd).slice());
        /* Segnaposto " " (virgolette con spazio): l'utente inserisce nome o nickname tra le virgolette. */
        var q = '" "';
        var openIt = [
            "Ciao, sono " + q + " e sono ",
            "Sono " + q + ", ",
            "Ehi, sono " + q + " e sono ",
            "Piacere, sono " + q + " e sono ",
            "Mi chiamo " + q + " e sono ",
            "Qui " + q + " e sono ",
            "Un saluto da " + q + " — sono "
        ];
        var openEn = [
            "Hi, I'm " + q + " and I'm ",
            "Hey, I'm " + q + " — I'm ",
            "Hello! I'm " + q + " and I'm ",
            "I'm " + q + " and I'm ",
            "I am " + q + ", ",
            "This is " + q + ", ",
            "Quick intro: I'm " + q + " and I'm "
        ];
        var openPool = shuffle((isItalian ? openIt : openEn).slice());
        var intro = pickVariety(openPool, v) + pickVariety(roles, v * 2 + 1) + " " + pickVariety(who, v * 3 + 2) + " " + pickVariety(passions, v * 5 + 3) + ".";
        var second = pickVariety(secondStart, v * 7 + 1) + " " + pickVariety(activities, v * 11 + 4) + ". " + pickVariety(end, v * 13 + 5);
        return intro + " " + second;
    }

    function genBio(bioType, platform, niche, v) {
        if (bioType === "full") return genFullBio(v);
        return genShortBio(platform, niche, v);
    }

    function generateUniqueBios(count, bioType, platform, niche) {
        var bios = [];
        var seen = new Set();
        var attempts = 0;
        var maxAttempts = count * 200;

        while (bios.length < count && attempts < maxAttempts) {
            var variety = bios.length * 97 + attempts * 31;
            var candidate = genBio(bioType, platform, niche, variety);
            if (!seen.has(candidate)) {
                seen.add(candidate);
                bios.push(candidate);
            }
            attempts++;
        }
        return bios;
    }

    function escapeHtml(str) {
        return String(str)
            .replace(/&/g, "&amp;")
            .replace(/</g, "&lt;")
            .replace(/>/g, "&gt;")
            .replace(/"/g, "&quot;");
    }

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

    var typeWrap = document.getElementById("bio-type-wrap");
    var platformWrap = document.getElementById("bio-platform-wrap");
    var nicheInput = document.getElementById("bio-niche");
    var resultArea = document.getElementById("result-area");
    var btnGen = document.getElementById("btn-generate");
    var btnCopy = document.getElementById("btn-copy");

    if (typeWrap) {
        var typeTrigger = typeWrap.querySelector(".text-tool-select-trigger");
        var typeMenu = typeWrap.querySelector(".text-tool-select-menu");
        typeMenu.querySelectorAll("li").forEach(function(li) {
            li.addEventListener("click", function() {
                typeWrap.dataset.value = li.dataset.value;
                typeTrigger.textContent = li.textContent;
                typeMenu.querySelectorAll("li").forEach(function(l) { l.classList.remove("selected"); });
                li.classList.add("selected");
                typeWrap.classList.remove("open");
            });
        });
        typeTrigger.addEventListener("click", function(e) {
            e.stopPropagation();
            document.querySelectorAll(".text-tool-select.open").forEach(function(s) { s.classList.remove("open"); });
            typeWrap.classList.toggle("open");
        });
        typeMenu.addEventListener("click", function(e) { e.stopPropagation(); });
    }

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
        var bioType = typeWrap ? typeWrap.dataset.value : "short";
        var platform = platformWrap ? platformWrap.dataset.value : "instagram";
        var niche = resolveNicheKey((nicheInput.value || "").trim());
        var bios = generateUniqueBios(RESULT_COUNT, bioType, platform, niche);
        var title = gt("Suggested bios");
        var selAll = gt("Select all");
        var selNone = gt("Deselect all");
        var copyHint = gt("The Copy button copies only the bios you have selected.");
        var html = '<div class="caption-results-header">';
        html += '<p class="caption-results-title">' + escapeHtml(title) + "</p>";
        html += '<div class="caption-select-actions">';
        html += '<button type="button" class="caption-select-action-btn" id="caption-select-all">' + escapeHtml(selAll) + "</button>";
        html += '<button type="button" class="caption-select-action-btn" id="caption-select-none">' + escapeHtml(selNone) + "</button>";
        html += "</div></div>";
        html += '<ol class="caption-results-list">';
        bios.forEach(function(line) {
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
                showTextToolInlineError(resultArea, gt("Select at least one bio to copy."));
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
