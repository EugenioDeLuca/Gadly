document.addEventListener("DOMContentLoaded", function() {
    var isItalian = (document.documentElement.lang || "").toLowerCase().indexOf("it") === 0;
    var niches = {
        travel: ["travel", "wanderlust", "explore", "adventure", "vacation", "traveling", "travelphotography", "instatravel", "travelgram", "roam", "adventuretime", "traveladdict", "nature", "sunset", "beach", "passportready", "travelblogger", "discoverearth", "trip", "getaway", "citybreak", "mountainlife", "seetheworld", "journey", "travelreels"],
        fitness: ["fitness", "gym", "workout", "fit", "health", "fitnessmotivation", "gymlife", "fitlife", "motivation", "training", "strong", "abs", "cardio", "fitnessgirl", "gymtime", "fitnessjourney", "fitfam", "active", "wellness", "nopainnogain", "trainhard", "discipline", "progress", "strengthtraining", "homeworkout"],
        food: ["food", "foodie", "foodporn", "delicious", "foodlover", "yummy", "instafood", "foodphotography", "homemade", "recipe", "cooking", "eating", "tasty", "foodstagram", "chef", "comfortfood", "healthyfood", "foodreels", "eatgood", "foodblogger", "kitchenlife", "mealideas", "snacktime", "dessert", "brunch"],
        fashion: ["fashion", "style", "ootd", "fashionista", "outfit", "styleinspo", "instafashion", "streetwear", "fashionblogger", "look", "trendy", "model", "wear", "styled", "fashionweek", "minimalstyle", "dailylook", "wardrobe", "casualstyle", "chic", "outfitideas", "fashionreels", "styleguide", "lookoftheday", "dressup"],
        beauty: ["beauty", "makeup", "skincare", "beautyvlogger", "makeuplover", "cosmetics", "natural", "glam", "beautyblogger", "makeupartist", "instabeauty", "lashes", "lipstick", "glow", "selfcare", "beautyroutine", "skincaretips", "glowup", "cleanbeauty", "beautyreels", "makeuptutorial", "dewyskin", "freshlook", "haircare", "wellbeing"],
        default: ["love", "instagood", "photooftheday", "beautiful", "happy", "picoftheday", "art", "photo", "nature", "life", "like", "follow", "instagram", "me", "summer", "daily", "inspiration", "lifestyle", "goodvibes", "today", "moment", "reels", "viral", "trending", "contentcreator"]
    };
    var nichesIt = {
        travel: ["viaggio", "viaggi", "wanderlust", "esplora", "avventura", "vacanza", "travelphotography", "instatravel", "travelgram", "natura", "tramonto", "mare", "avventure", "mondo", "itinerari", "passaporto", "girareilmondo", "scoprilitalia", "weekend", "montagna", "citybreak", "destinazione", "viaggiaresempre", "diariodiviaggio", "travelreels"],
        fitness: ["fitness", "palestra", "allenamento", "salute", "motivazione", "vitasportiva", "forza", "cardio", "gymtime", "fitlife", "allenarsibene", "benessere", "obiettivi", "costanza", "energia", "disciplinapersonale", "workout", "allenamentoquotidiano", "stiledivitasano", "forzamentale", "progressi", "trainhard", "homeworkout", "fitfam", "attivitafisica"],
        food: ["cibo", "foodie", "cucinaitaliana", "ricette", "delizioso", "instafood", "foodlover", "gourmet", "homemade", "chef", "mangiarebene", "sapori", "foodstagram", "yummy", "cucina", "piattidelgiorno", "foodreels", "pranzo", "cena", "dolci", "brunch", "cucinasana", "ricettaveloce", "buonissimo", "passioneincucina"],
        fashion: ["moda", "stile", "outfit", "ootd", "fashionista", "tendenze", "look", "streetwear", "instafashion", "styleinspo", "fashionweek", "eleganza", "trendy", "guardaroba", "fashionblogger", "lookdelgiorno", "consiglidistile", "outfitideas", "modaitaliana", "chic", "minimalstyle", "fashionreels", "abbigliamento", "stilepersonale", "trendalert"],
        beauty: ["beauty", "trucco", "skincare", "makeup", "selfcare", "glow", "beautyroutine", "cosmetici", "makeuplover", "instabeauty", "lashes", "lipstick", "bellezza", "curadellapelle", "benessere", "beautytips", "skincareroutine", "makeuptutorial", "glowup", "capelli", "haircare", "visoluminoso", "beautyreels", "looknaturale", "curapersonale"],
        default: ["amore", "instagood", "photooftheday", "bello", "felicità", "arte", "foto", "natura", "vita", "like", "follow", "estate", "momenti", "vibes", "ispirazione", "quotidiano", "lifestyle", "reels", "viral", "trending", "creator", "contenuti", "oggi", "energia", "goodvibes"]
    };

    function pick(arr, n) {
        var out = [], copy = arr.slice();
        for (var i = 0; i < n && copy.length; i++) {
            var j = Math.floor(Math.random() * copy.length);
            out.push(copy[j]);
            copy.splice(j, 1);
        }
        return out;
    }

    function uniqueTags(tags) {
        var seen = new Set();
        var out = [];
        for (var i = 0; i < tags.length; i++) {
            var t = (tags[i] || "").toLowerCase().trim().replace(/[^a-z0-9_]/g, "");
            if (!t || seen.has(t)) continue;
            seen.add(t);
            out.push(t);
        }
        return out;
    }

    function inputToTags(raw) {
        return uniqueTags(
            (raw || "")
                .toLowerCase()
                .replace(/,/g, " ")
                .split(/\s+/)
                .filter(Boolean)
        );
    }

    function buildTagPool(source, nicheRaw) {
        var key = (nicheRaw || "").trim().toLowerCase().replace(/\s+/g, "");
        var custom = inputToTags(nicheRaw);
        var base = source[key] || [];
        var pool = uniqueTags(base.concat(custom, source.default || []));
        return pool.length ? pool : (source.default || []);
    }

    var nicheInput = document.getElementById("hashtag-niche");
    var countInput = document.getElementById("hashtag-count");
    var resultArea = document.getElementById("result-area");
    var btnGen = document.getElementById("btn-generate");
    var btnCopy = document.getElementById("btn-copy");
    var lastOutput = "";

    btnGen.addEventListener("click", function() {
        var nicheRaw = (nicheInput.value || "").trim();
        var source = isItalian ? nichesIt : niches;
        var list = buildTagPool(source, nicheRaw);
        var n = Math.min(1000, Math.max(1, parseInt(countInput.value, 10) || 15));
        var tags = [];
        var out = "";
        var attempts = 0;
        do {
            tags = pick(list, Math.min(n, list.length));
            while (tags.length < n && list.length > 0) {
                tags = tags.concat(pick(list, Math.min(n - tags.length, list.length)));
            }
            out = tags.map(function(t) { return "#" + t; }).join(" ");
            attempts += 1;
        } while (out === lastOutput && attempts < 6);
        lastOutput = out;
        if (!out) {
            resultArea.classList.add("hidden");
            return;
        }
        resultArea.innerHTML = '<span class="hashtags-output">' + out + "</span>";
        resultArea.classList.remove("hidden");
    });

    btnCopy.addEventListener("click", function() {
        var text = resultArea.innerText || resultArea.textContent;
        if (!text) return;
        navigator.clipboard.writeText(text).then(function() {
            btnCopy.textContent = gettext("Copied!");
            btnCopy.classList.add("copied");
            setTimeout(function() { btnCopy.textContent = gettext("Copy"); btnCopy.classList.remove("copied"); }, 1500);
        });
    });
});
