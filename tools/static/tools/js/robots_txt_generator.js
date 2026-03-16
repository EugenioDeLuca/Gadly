document.addEventListener("DOMContentLoaded", function() {
    var userAgent = document.getElementById("user-agent");
    var disallow = document.getElementById("disallow");
    var allow = document.getElementById("allow");
    var sitemap = document.getElementById("sitemap");
    var btnGenerate = document.getElementById("btn-generate");
    var btnCopy = document.getElementById("btn-copy");
    var resultArea = document.getElementById("result-area");

    function showError(msg) {
        resultArea.classList.remove("hidden");
        resultArea.classList.add("error");
        resultArea.textContent = msg;
    }

    function showResult(text) {
        resultArea.classList.remove("hidden");
        resultArea.classList.remove("error");
        resultArea.textContent = text;
    }

    btnGenerate.addEventListener("click", function() {
        var uaRaw = (userAgent.value || "").trim();
        var ua = uaRaw;
        // Consider empty or default "*" as "not provided" – user must explicitly set it
        if (!ua || ua === "*") {
            showError("Please enter a User-agent before generating robots.txt");
            return;
        }
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
        showResult(lines.join("\n"));
    });

    btnCopy.addEventListener("click", function() {
        var text = resultArea.textContent;
        if (!text || resultArea.classList.contains("hidden") || resultArea.classList.contains("error")) return;
        if (navigator.clipboard && navigator.clipboard.writeText) {
            navigator.clipboard.writeText(text).then(function() {
                btnCopy.textContent = "Copied!";
                btnCopy.classList.add("copied");
                setTimeout(function() {
                    btnCopy.textContent = "Copy";
                    btnCopy.classList.remove("copied");
                }, 2000);
            }).catch(function() {});
        } else {
            var ta = document.createElement("textarea");
            ta.value = text;
            document.body.appendChild(ta);
            ta.select();
            try {
                document.execCommand("copy");
                btnCopy.textContent = "Copied!";
                btnCopy.classList.add("copied");
                setTimeout(function() {
                    btnCopy.textContent = "Copy";
                    btnCopy.classList.remove("copied");
                }, 2000);
            } catch (e) {}
            document.body.removeChild(ta);
        }
    });
});
