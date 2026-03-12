document.addEventListener("DOMContentLoaded", function() {
    var niches = {
        travel: ["travel", "wanderlust", "explore", "adventure", "vacation", "traveling", "travelphotography", "instatravel", "travelgram", "roam", "adventuretime", "traveladdict", "nature", "sunset", "beach"],
        fitness: ["fitness", "gym", "workout", "fit", "health", "fitnessmotivation", "gymlife", "fitlife", "motivation", "training", "strong", "abs", "cardio", "fitnessgirl", "gymtime"],
        food: ["food", "foodie", "foodporn", "delicious", "foodlover", "yummy", "instafood", "foodphotography", "homemade", "recipe", "cooking", "eating", "tasty", "foodstagram", "chef"],
        fashion: ["fashion", "style", "ootd", "fashionista", "outfit", "styleinspo", "instafashion", "streetwear", "fashionblogger", "look", "trendy", "model", "wear", "styled", "fashionweek"],
        beauty: ["beauty", "makeup", "skincare", "beautyvlogger", "makeuplover", "cosmetics", "natural", "glam", "beautyblogger", "makeupartist", "instabeauty", "lashes", "lipstick", "glow", "selfcare"],
        default: ["love", "instagood", "photooftheday", "beautiful", "happy", "picoftheday", "art", "photo", "nature", "life", "like", "follow", "instagram", "me", "summer"]
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

    var nicheInput = document.getElementById("hashtag-niche");
    var countInput = document.getElementById("hashtag-count");
    var resultArea = document.getElementById("result-area");
    var btnGen = document.getElementById("btn-generate");
    var btnCopy = document.getElementById("btn-copy");

    btnGen.addEventListener("click", function() {
        var niche = (nicheInput.value || "").trim().toLowerCase().replace(/\s+/g, "") || "default";
        var list = niches[niche] || niches.default;
        var n = Math.min(1000, Math.max(1, parseInt(countInput.value, 10) || 15));
        var tags = pick(list, Math.min(n, list.length));
        while (tags.length < n && list.length > 0) {
            tags = tags.concat(pick(list, Math.min(n - tags.length, list.length)));
        }
        resultArea.textContent = tags.map(function(t) { return "#" + t; }).join(" ");
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
