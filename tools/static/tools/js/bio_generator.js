document.addEventListener("DOMContentLoaded", function() {
    var starts = ["Living my best life", "Dreamer", "Creating", "Exploring", "Here for the", "Just a", "Coffee addict", "Wanderer", "Artist", "Creator", "Building", "Chasing", "Making it happen", "Fueled by"];
    var middles = ["adventures", "vibes", "good energy", "positive thoughts", "coffee", "creativity", "passion", "dreams", "moments", "memories", "sunsets", "music", "art", "life"];
    var ends = ["✨", "🌟", "💫", "🎬", "📸", "🔗", "| DM for collabs", "| Link in bio", "📍 World", "🌍", "👇", "🔥", "💯"];

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

    function pick(arr) { return arr[Math.floor(Math.random() * arr.length)]; }

    function genShortBio(platform, niche) {
        if (niche && niches[niche]) {
            var t = pick(niches[niche]);
            return t + " " + pick(ends);
        }
        var s = pick(starts);
        var m = pick(middles);
        var e = pick(ends);
        return s + " " + m + " " + e;
    }

    function genFullBio() {
        var intro = pick(fullBioIntros) + " " + pick(fullBioRoles) + " " + pick(fullBioWho) + " " + pick(fullBioPassions) + ".";
        var second = pick(fullBioSecond) + " " + pick(fullBioActivities) + ". " + pick(fullBioEnd);
        return intro + " " + second;
    }

    function genBio(bioType, platform, niche) {
        if (bioType === "full") return genFullBio();
        return genShortBio(platform, niche);
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
        var bios = [];
        for (var i = 0; i < 3; i++) bios.push(genBio(bioType, platform, niche));
        resultArea.textContent = bios.join("\n\n");
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
