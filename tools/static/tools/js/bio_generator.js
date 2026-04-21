document.addEventListener("DOMContentLoaded", function() {
    var isItalian = (document.documentElement.lang || "").toLowerCase().indexOf("it") === 0;
    var starts = ["Living my best life", "Dreamer", "Creating", "Exploring", "Here for the", "Just a", "Coffee addict", "Wanderer", "Artist", "Creator", "Building", "Chasing", "Making it happen", "Fueled by", "Turning ideas into content", "On a mission to inspire", "Sharing real moments", "Learning every day", "Crafting my own path", "Always evolving"];
    var middles = ["adventures", "vibes", "good energy", "positive thoughts", "coffee", "creativity", "passion", "dreams", "moments", "memories", "sunsets", "music", "art", "life", "fresh ideas", "bold moves", "authentic stories", "small wins", "big goals", "daily inspiration"];
    var ends = ["✨", "🌟", "💫", "🎬", "📸", "🔗", "| DM for collabs", "| Link in bio", "📍 World", "🌍", "👇", "🔥", "💯", "| Open to partnerships", "| Let's build together", "| New posts weekly"];

    var niches = {
        travel: ["🌍 Travel addict", "Wanderlust", "Exploring the world", "Adventure seeker", "Lost in wanderlust", "Roaming the globe"],
        fitness: ["💪 No pain no gain", "Gym lover", "Fitness journey", "Getting stronger", "Healthy lifestyle", "Train hard"],
        food: ["🍕 Food lover", "Eating my way through", "Foodie at heart", "Good vibes & good food", "Chef at home", "Taste the world"],
        fashion: ["✨ Style over everything", "Fashion addict", "Dressed to impress", "Trendsetter", "Outfit of the day", "Living in style"],
        default: ["Living life", "Creating content", "Just vibing", "Making memories", "Here for good times", "Doing my thing"]
    };

    var fullBioIntros = ["I'm", "I am", "Hi, I'm", "Hello! I'm", "Hey, I'm"];
    var fullBioRoles = ["a creative", "a photographer", "a traveler", "an artist", "a content creator", "a designer", "a developer", "a writer", "a foodie", "a fitness enthusiast", "a music lover"];
    var fullBioWho = ["who loves", "passionate about", "obsessed with", "always chasing", "driven by"];
    var fullBioPassions = ["travel, coffee, and good vibes", "photography and storytelling", "exploring new places and cultures", "creating meaningful content", "design and aesthetics", "building things and solving problems", "writing and reading", "cooking and trying new recipes", "staying active and healthy", "music and live shows"];
    var fullBioSecond = ["When I'm not working, you'll find me", "In my free time I enjoy", "Outside of that, I love", "I also enjoy", "Beyond that, I'm into"];
    var fullBioActivities = ["exploring hidden gems in the city", "hiking and being outdoors", "trying new coffee shops", "curating my Spotify playlists", "binge-watching shows", "reading and learning new things", "cooking for friends", "taking photos of random things", "playing sports or hitting the gym"];
    var fullBioEnd = ["Let's connect!", "DM me for collabs.", "Say hi!", "Link in bio.", "Drop a message!"];

    var startsIt = ["Vivo la mia vita al meglio", "Sognatore", "Creo", "Esploro", "Qui per le", "Solo un", "Dipendente dal caffè", "Viaggiatore", "Artista", "Creator", "Costruisco", "Inseguo", "Lo faccio accadere", "Mosso da", "Trasformo idee in contenuti", "Condivido momenti autentici", "Ogni giorno una nuova sfida", "Creo con passione", "Sempre in movimento", "Alla ricerca della prossima ispirazione"];
    var middlesIt = ["avventure", "vibrazioni", "buona energia", "pensieri positivi", "caffè", "creatività", "passione", "sogni", "momenti", "ricordi", "tramonti", "musica", "arte", "vita", "idee fresche", "nuovi obiettivi", "storie autentiche", "piccole vittorie", "grandi traguardi", "ispirazione quotidiana"];
    var endsIt = ["✨", "🌟", "💫", "🎬", "📸", "🔗", "| DM per collaborazioni", "| Link in bio", "📍 Mondo", "🌍", "👇", "🔥", "💯", "| Aperto a partnership", "| Costruiamo qualcosa insieme", "| Nuovi contenuti ogni settimana"];

    var nichesIt = {
        travel: ["🌍 Travel addicted", "Voglia di viaggiare", "Esploro il mondo", "Cercatore di avventure", "Perso nella wanderlust", "In giro per il globo", "Passaporto sempre pronto", "Ogni viaggio racconta una storia", "Colleziono destinazioni, non cose", "Nato per esplorare"],
        fitness: ["💪 No pain no gain", "Amante della palestra", "Percorso fitness", "Divento più forte", "Stile di vita sano", "Allenati duro", "Disciplina prima di tutto", "Allenamento, costanza, risultati", "Energia e focus ogni giorno", "Mente forte, corpo forte"],
        food: ["🍕 Amante del cibo", "Mangio in giro per il mondo", "Foodie nel cuore", "Buone vibrazioni e buon cibo", "Chef a casa", "Assapora il mondo", "Ricette, sapori e creatività", "Buon cibo, buon umore", "Sempre alla ricerca di nuovi sapori", "Cucina è passione"],
        fashion: ["✨ Lo stile prima di tutto", "Fashion addicted", "Vestito per colpire", "Trendsetter", "Outfit del giorno", "Vivo di stile", "Dettagli che fanno la differenza", "Moda con personalità", "Eleganza e carattere", "Il mio mood: stile"],
        default: ["Vivo la vita", "Creo contenuti", "Solo buone vibrazioni", "Creo ricordi", "Qui per i bei momenti", "Seguo la mia strada", "Trasformo idee in realtà", "Condivido ciò che amo", "Ogni giorno una nuova occasione", "Autenticità sempre"]
    };

    var fullBioIntrosIt = ["Sono", "Io sono", "Ciao, sono", "Ehi, sono", "Piacere, sono", "Mi chiamo"];
    var fullBioRolesIt = ["un creativo", "un fotografo", "un viaggiatore", "un artista", "un content creator", "un designer", "uno sviluppatore", "uno scrittore", "un foodie", "un appassionato di fitness", "un amante della musica", "un marketer digitale", "uno storyteller"];
    var fullBioWhoIt = ["che ama", "appassionato di", "ossessionato da", "sempre alla ricerca di", "guidato da", "focalizzato su", "ispirato da"];
    var fullBioPassionsIt = ["viaggi, caffè e belle vibrazioni", "fotografia e narrazione visiva", "nuovi luoghi e culture", "contenuti autentici e utili", "design ed estetica", "costruire soluzioni e risolvere problemi", "scrittura e lettura", "cucina e nuove ricette", "benessere e stile di vita attivo", "musica e concerti dal vivo", "idee digitali e creatività", "progetti che generano impatto"];
    var fullBioSecondIt = ["Quando non lavoro, mi trovi a", "Nel tempo libero mi piace", "Oltre a questo, amo", "Mi piace anche", "Inoltre, sono appassionato di", "Fuori dal lavoro, adoro"];
    var fullBioActivitiesIt = ["esplorare angoli nascosti della città", "fare trekking e vivere la natura", "scoprire nuove caffetterie", "curare le mie playlist", "guardare serie e film", "leggere e imparare cose nuove", "cucinare per amici e famiglia", "fotografare dettagli quotidiani", "fare sport e allenarmi con costanza", "sperimentare nuove idee creative", "lavorare su progetti personali", "raccontare storie attraverso immagini e parole"];
    var fullBioEndIt = ["Connettiamoci!", "Scrivimi per collaborazioni.", "Scrivimi!", "Link in bio.", "Mandami un messaggio!", "Parliamone in DM!", "Ci sentiamo presto!"];

    function pick(arr) { return arr[Math.floor(Math.random() * arr.length)]; }

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

    function genShortBio(platform, niche) {
        var localNiches = isItalian ? nichesIt : niches;
        var localEnds = (isItalian ? endsIt : ends).concat(getPlatformTail(platform));
        var localStarts = isItalian ? startsIt : starts;
        var localMiddles = isItalian ? middlesIt : middles;

        if (niche && localNiches[niche]) {
            var t = pick(localNiches[niche]);
            return t + " " + pick(localEnds);
        }
        var s = pick(localStarts);
        var m = pick(localMiddles);
        var e = pick(localEnds);
        return s + " " + m + " " + e;
    }

    function genFullBio() {
        var intros = isItalian ? fullBioIntrosIt : fullBioIntros;
        var roles = isItalian ? fullBioRolesIt : fullBioRoles;
        var who = isItalian ? fullBioWhoIt : fullBioWho;
        var passions = isItalian ? fullBioPassionsIt : fullBioPassions;
        var secondStart = isItalian ? fullBioSecondIt : fullBioSecond;
        var activities = isItalian ? fullBioActivitiesIt : fullBioActivities;
        var end = isItalian ? fullBioEndIt : fullBioEnd;
        var intro = pick(intros) + " " + pick(roles) + " " + pick(who) + " " + pick(passions) + ".";
        var second = pick(secondStart) + " " + pick(activities) + ". " + pick(end);
        return intro + " " + second;
    }

    function genBio(bioType, platform, niche) {
        if (bioType === "full") return genFullBio();
        return genShortBio(platform, niche);
    }

    function generateUniqueBios(count, bioType, platform, niche) {
        var bios = [];
        var seen = new Set();
        var attempts = 0;
        var maxAttempts = count * 15;

        while (bios.length < count && attempts < maxAttempts) {
            var candidate = genBio(bioType, platform, niche);
            if (!seen.has(candidate)) {
                seen.add(candidate);
                bios.push(candidate);
            }
            attempts++;
        }
        return bios;
    }

    function formatBios(bios) {
        return bios.join("\n\n");
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

    btnGen.addEventListener("click", function() {
        var bioType = typeWrap ? typeWrap.dataset.value : "short";
        var platform = platformWrap ? platformWrap.dataset.value : "instagram";
        var niche = (nicheInput.value || "").trim().toLowerCase() || "default";
        if (!niches[niche]) niche = "default";
        var bios = generateUniqueBios(3, bioType, platform, niche);
        resultArea.textContent = formatBios(bios);
        resultArea.classList.remove("hidden");
    });

    btnCopy.addEventListener("click", function() {
        var text = resultArea.textContent;
        if (!text) return;
        navigator.clipboard.writeText(text).then(function() {
            btnCopy.textContent = isItalian ? "Copiato!" : "Copied!";
            btnCopy.classList.add("copied");
            setTimeout(function() {
                btnCopy.textContent = isItalian ? "Copia" : "Copy";
                btnCopy.classList.remove("copied");
            }, 1500);
        });
    });
});
