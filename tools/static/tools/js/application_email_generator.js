document.addEventListener("DOMContentLoaded", function () {
    var btnGenerate = document.getElementById("email-generate");
    var btnCopy = document.getElementById("email-copy");
    var result = document.getElementById("email-result");
    var errorEl = document.getElementById("email-error");

    function v(id) {
        var el = document.getElementById(id);
        return el ? (el.value || "").trim() : "";
    }

    function pick(arr) {
        return arr[Math.floor(Math.random() * arr.length)];
    }

    function shuffleArray(arr) {
        var a = arr.slice();
        for (var i = a.length - 1; i > 0; i--) {
            var j = Math.floor(Math.random() * (i + 1));
            var t = a[i];
            a[i] = a[j];
            a[j] = t;
        }
        return a;
    }

    function showError(msg) {
        if (!errorEl) return;
        errorEl.textContent = msg;
        errorEl.classList.remove("hidden");
    }

    function clearError() {
        if (!errorEl) return;
        errorEl.textContent = "";
        errorEl.classList.add("hidden");
    }

    function showResult(text) {
        clearError();
        result.textContent = text;
        result.classList.remove("hidden");
        result.classList.remove("error");
    }

    btnGenerate.addEventListener("click", function () {
        var name = v("email-name");
        var role = v("email-role");
        var company = v("email-company");
        var points = v("email-points");

        if (!name || !role || !company) {
            showError(gettext("Please fill in name, role, and company."));
            return;
        }

        var keyPoints = gettext("Relevant experience, strong communication, and motivation for the role.");
        if (points) {
            var lines = points.split("\n").map(function (x) { return x.trim(); }).filter(Boolean);
            if (lines.length) {
                keyPoints = shuffleArray(lines).slice(0, 3).join("; ");
            }
        }

        var subjectTemplates = [
            gettext("Application for %(role)s - %(name)s"),
            gettext("Application: %(role)s position — %(name)s"),
            gettext("%(name)s — application for %(role)s")
        ];
        var subject = pick(subjectTemplates)
            .replace("%(role)s", role)
            .replace("%(name)s", name);

        var greeting = pick([
            gettext("Dear Hiring Team"),
            gettext("Dear Recruiting Team"),
            gettext("Hello")
        ]);

        var applyLine = pick([
            gettext("I am applying for the %(role)s role at %(company)s.")
                .replace("%(role)s", role)
                .replace("%(company)s", company),
            gettext("I am writing to apply for the %(role)s position at %(company)s.")
                .replace("%(role)s", role)
                .replace("%(company)s", company),
            gettext("I would like to express my interest in the %(role)s role at %(company)s.")
                .replace("%(role)s", role)
                .replace("%(company)s", company)
        ]);

        var strengthLine = pick([
            gettext("I believe my profile is a strong fit. Key points: %(points)s").replace("%(points)s", keyPoints),
            gettext("Here is a brief summary of how I match the role: %(points)s").replace("%(points)s", keyPoints),
            gettext("My strengths for this position include: %(points)s").replace("%(points)s", keyPoints)
        ]);

        var attachLine = pick([
            gettext("I have attached my CV and would be glad to discuss my application."),
            gettext("Please find my CV attached; I would welcome the opportunity to discuss my application."),
            gettext("My CV is attached for your review. I would be happy to discuss how I can contribute.")
        ]);

        var closing = pick([
            gettext("Kind regards"),
            gettext("Best regards"),
            gettext("Sincerely")
        ]);

        var body = [
            gettext("Subject") + ": " + subject,
            "",
            greeting + ",",
            "",
            applyLine,
            strengthLine,
            attachLine,
            "",
            closing + ",",
            name
        ].join("\n");

        showResult(body);
    });

    btnCopy.addEventListener("click", function () {
        var text = result.textContent || "";
        if (!text || result.classList.contains("hidden")) return;
        if (errorEl && !errorEl.classList.contains("hidden") && errorEl.textContent) return;
        navigator.clipboard.writeText(text).then(function () {
            btnCopy.textContent = gettext("Copied!");
            btnCopy.classList.add("copied");
            setTimeout(function () {
                btnCopy.textContent = gettext("Copy");
                btnCopy.classList.remove("copied");
            }, 1600);
        });
    });
});
