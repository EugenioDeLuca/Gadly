document.addEventListener("DOMContentLoaded", function() {
    var starts = ["Just another", "Living for", "Here for", "Making it", "Chasing", "Creating", "So grateful for", "Can't get over", "Obsessed with", "Pure", "Good vibes only", "No caption needed", "Slay", "Mood", "Feeling"];
    var mids = ["moment", "day", "vibes", "sunset", "coffee", "life", "memories", "this view", "good energy", "the little things", "today", "everything", "it"];
    var ends = ["✨", "💫", "🌟", "🔥", "💯", "| follow for more", "| double tap if you agree", "| link in bio", "| DM for collabs", ""];

    var topics = {
        sunset: ["Golden hour hits different 🌅", "Sunsets & good vibes", "Chasing the golden light"],
        coffee: ["Coffee first, adulting second ☕", "Fueled by caffeine", "Best part of the morning"],
        monday: ["Monday mood 📌", "New week, new goals", "Making Monday count"],
        default: ["Living my best life", "Making memories", "Good vibes only"]
    };

    function pick(arr) { return arr[Math.floor(Math.random() * arr.length)]; }

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

    btnGen.addEventListener("click", function() {
        var topic = (topicInput.value || "").trim().toLowerCase();
        var list = topics[topic] || topics.default;
        var cap = pick(list);
        if (!topics[topic]) {
            var s = pick(starts), m = pick(mids), e = pick(ends);
            cap = s + " " + m + (e ? " " + e : "");
        }
        resultArea.textContent = cap;
        resultArea.classList.remove("hidden");
    });

    btnCopy.addEventListener("click", function() {
        var text = resultArea.textContent;
        if (!text) return;
        navigator.clipboard.writeText(text).then(function() {
            btnCopy.textContent = "Copied!";
            btnCopy.classList.add("copied");
            setTimeout(function() { btnCopy.textContent = "Copy"; btnCopy.classList.remove("copied"); }, 1500);
        });
    });
});
