document.addEventListener("DOMContentLoaded", function() {
    var userAgent = document.getElementById("user-agent");
    var disallow = document.getElementById("disallow");
    var allow = document.getElementById("allow");
    var sitemap = document.getElementById("sitemap");
    var btnGenerate = document.getElementById("btn-generate");
    var btnCopy = document.getElementById("btn-copy");
    var resultArea = document.getElementById("result-area");

    btnGenerate.addEventListener("click", function() {
        var ua = (userAgent.value || "*").trim();
        var dis = (disallow.value || "").trim().split(/\r?\n/).filter(Boolean).map(function(s) { return s.trim(); });
        var al = (allow.value || "").trim().split(/\r?\n/).filter(Boolean).map(function(s) { return s.trim(); });
        var sm = (sitemap.value || "").trim();

        var lines = ["User-agent: " + ua];
        dis.forEach(function(p) {
            if (p) lines.push("Disallow: " + p);
        });
        al.forEach(function(p) {
            if (p) lines.push("Allow: " + p);
        });
        if (sm) lines.push("Sitemap: " + sm);
        resultArea.textContent = lines.join("\n");
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
