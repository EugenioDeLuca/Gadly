document.addEventListener("DOMContentLoaded", function () {
    var isItalian = (document.documentElement.lang || "").toLowerCase().indexOf("it") === 0;
    function t(it, en) { return isItalian ? it : en; }

    var btnGenerate = document.getElementById("cl-generate");
    var btnCopy = document.getElementById("cl-copy");
    var btnExportPdf = document.getElementById("cl-export-pdf");
    var btnExportDocx = document.getElementById("cl-export-docx");
    var btnExportTxt = document.getElementById("cl-export-txt");
    var exportControls = document.getElementById("cl-export-controls");
    var buttonGroup = btnGenerate ? btnGenerate.closest(".button-group") : null;
    var result = document.getElementById("cl-result");
    var toneInput = document.getElementById("cl-tone");
    var toneWrap = document.getElementById("cl-tone-wrap");
    var wordMeter = document.getElementById("cl-word-meter");
    var hookButtons = Array.prototype.slice.call(document.querySelectorAll("#cl-hook-actions button[data-hook]"));
    var templateButtons = Array.prototype.slice.call(document.querySelectorAll("#cl-template-actions button[data-template]"));
    var latestOutput = "";
    var selectedTemplate = "standard";
    var selectedTone = "professional";
    var selectedHookIndex = 0;
    var generationCount = 0;

    function v(id) {
        var el = document.getElementById(id);
        return el ? (el.value || "").trim() : "";
    }
    function wordCount(text) {
        return (text || "").trim().split(/\s+/).filter(Boolean).length;
    }
    function tokenize(text) {
        var stop = {
            "the": true, "and": true, "for": true, "with": true, "this": true, "that": true,
            "your": true, "you": true, "to": true, "from": true, "into": true, "in": true,
            "il": true, "la": true, "i": true, "gli": true, "le": true, "di": true, "e": true,
            "per": true, "con": true, "del": true, "della": true, "delle": true, "dei": true
        };
        return (text || "").toLowerCase().match(/[a-zA-Z][a-zA-Z0-9\-+]{2,}/g) || []
            .filter(function (x) { return !stop[x]; });
    }
    function uniq(list) {
        var seen = {};
        return (list || []).filter(function (x) { if (seen[x]) return false; seen[x] = true; return true; });
    }
    function escapeHtml(s) {
        return (s || "").replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
    }
    function showError(msg) {
        if (!result) return;
        result.classList.remove("hidden");
        result.classList.remove("file-ready");
        result.classList.add("error");
        result.textContent = msg;
        latestOutput = "";
        if (exportControls) exportControls.classList.add("hidden");
        if (buttonGroup) buttonGroup.classList.remove("has-export");
        try { result.scrollIntoView({ behavior: "smooth", block: "center" }); } catch (e) {}
    }
    function setToneFromButton(toneKey) {
        selectedTone = toneKey;
        if (!toneInput) return;
        var labelMap = {
            professional: t("Professionale", "Professional"),
            direct: t("Diretto", "Direct"),
            informal: t("Informale", "Informal"),
            formal: t("Formale", "Formal"),
            concise: t("Sintetico", "Concise")
        };
        toneInput.value = labelMap[toneKey] || labelMap.professional;
        if (toneWrap) {
            var options = Array.prototype.slice.call(toneWrap.querySelectorAll(".text-tool-select-menu li[data-value]"));
            options.forEach(function (li) {
                li.classList.toggle("selected", li.getAttribute("data-value") === toneInput.value);
            });
        }
    }
    function setTemplate(valueTemplate) {
        selectedTemplate = valueTemplate || "standard";
        var templateActions = document.getElementById("cl-template-actions");
        if (templateActions) templateActions.setAttribute("data-active-template", selectedTemplate);
        templateButtons.forEach(function (b) {
            b.classList.toggle("active", b.getAttribute("data-template") === selectedTemplate);
        });
    }
    function updateWordMeter() {
        if (!wordMeter) return;
        var wc = wordCount(v("cl-highlights"));
        var status = wc < 180 ? t("sotto target", "below target") : (wc > 260 ? t("sopra target", "above target") : t("in target", "on target"));
        wordMeter.textContent = t("Parole highlight", "Highlight words") + ": " + wc + " (180-260 " + status + ")";
    }

    function initToneSelect() {
        if (!toneWrap || !toneInput) return;
        var arrow = toneWrap.querySelector(".role-arrow");
        var options = Array.prototype.slice.call(toneWrap.querySelectorAll(".text-tool-select-menu li[data-value]"));
        function openMenu() { toneWrap.classList.add("open"); }
        function closeMenu() { toneWrap.classList.remove("open"); }
        function toggleMenu() { toneWrap.classList.toggle("open"); }
        function selectToneOption(li) {
            if (!li) return;
            selectedTone = li.getAttribute("data-tone-key") || "professional";
            toneInput.value = li.getAttribute("data-value") || "";
            options.forEach(function (opt) { opt.classList.remove("selected"); });
            li.classList.add("selected");
            closeMenu();
        }
        toneInput.addEventListener("click", function (e) {
            e.preventDefault();
            e.stopPropagation();
            toggleMenu();
        });
        if (arrow) {
            function handleArrowOpen(e) {
                e.preventDefault();
                e.stopPropagation();
                toggleMenu();
            }
            arrow.addEventListener("click", handleArrowOpen);
        }
        options.forEach(function (li) {
            li.addEventListener("click", function (e) {
                e.preventDefault();
                e.stopPropagation();
                selectToneOption(li);
            });
        });
        document.addEventListener("click", function (e) {
            if (!toneWrap.contains(e.target)) closeMenu();
        });
        toneInput.addEventListener("keydown", function (e) {
            if (e.key === "Enter" || e.key === " ") {
                e.preventDefault();
                toggleMenu();
            } else if (e.key === "Escape") {
                closeMenu();
            }
        });
        // Sync selected option with initial value.
        var initial = options.find(function (li) { return li.getAttribute("data-tone-key") === selectedTone; }) || options[0];
        selectToneOption(initial);
    }

    function buildHooks(name, role, company) {
        var hooks = [
            t("Mi candido con entusiasmo al ruolo di ", "I am excited to apply for the role of ") + role + t(" presso ", " at ") + company + ".",
            t("Dopo aver analizzato i vostri obiettivi, credo di poter contribuire subito come ", "After reviewing your goals, I believe I can contribute immediately as ") + role + ".",
            t("Con una forte esperienza pratica, porto valore concreto nel ruolo di ", "With strong hands-on experience, I can bring immediate value in the ") + role + t(" per ", " role at ") + company + "."
        ];
        if (name) hooks[2] = t("Sono ", "I am ") + name + t(", e porto valore concreto nel ruolo di ", ", and I can bring clear value in the ") + role + t(" per ", " role at ") + company + ".";
        return hooks;
    }

    function buildTonePhrases() {
        return {
            professional: {
                intro: t("La mia esperienza è allineata alle esigenze del ruolo, con focus su qualità, affidabilità e risultati misurabili.", "My experience aligns with the role requirements, with focus on quality, reliability, and measurable outcomes."),
                close: t("Resto a disposizione per un colloquio di approfondimento.", "I am available for a follow-up interview.")
            },
            direct: {
                intro: t("Posso contribuire da subito con impatto operativo e responsabilità chiara sugli obiettivi.", "I can contribute immediately with operational impact and clear ownership of outcomes."),
                close: t("Se utile, posso condividere esempi concreti già nel primo colloquio.", "If useful, I can share concrete examples in the first interview.")
            },
            informal: {
                intro: t("Mi piacerebbe dare una mano al team con energia, praticità e collaborazione.", "I would love to support the team with energy, pragmatism, and collaboration."),
                close: t("Se vi va, possiamo sentirci presto per capire come posso essere utile.", "If you like, we can connect soon to discuss how I can help.")
            },
            formal: {
                intro: t("Il mio profilo risponde ai requisiti richiesti con un approccio strutturato e affidabile.", "I believe my profile matches your requirements with a structured and reliable approach."),
                close: t("Rimango disponibile per un confronto conoscitivo.", "I remain available for a further discussion.")
            },
            concise: {
                intro: t("Offro contributo rapido, pratico e orientato agli obiettivi del ruolo.", "I offer a quick, practical contribution focused on role objectives."),
                close: t("Disponibile per approfondire in breve call.", "Available to discuss further in a short call.")
            }
        };
    }

    function renderResult(letterText, matched, missing, warnings) {
        var matchedHtml = matched.length
            ? matched.map(function (k) { return '<span class="kw-chip good">' + escapeHtml(k) + "</span>"; }).join("")
            : '<span class="kw-chip good">-</span>';
        var missingHtml = missing.length
            ? missing.map(function (k) { return '<span class="kw-chip bad">' + escapeHtml(k) + "</span>"; }).join("")
            : '<span class="kw-chip bad">-</span>';
        var warningsHtml = warnings.length
            ? '<div style="margin-top:8px;color:#b4232c;"><strong>' + t("Controlli", "Checks") + ":</strong> " + escapeHtml(warnings.join(" | ")) + "</div>"
            : "";
        var meta = [
            '<div class="result-meta">',
            "<div><strong>" + t("Match parole chiave", "Keyword match") + ":</strong></div>",
            '<div class="keyword-line"><span class="cvopt-label">' + t("Trovate", "Matched") + ":</span>" + matchedHtml + "</div>",
            '<div class="keyword-line"><span class="cvopt-label">' + t("Mancanti", "Missing") + ":</span>" + missingHtml + "</div>",
            warningsHtml,
            "</div>"
        ].join("");
        result.classList.remove("hidden", "error");
        result.innerHTML = meta + '<div>' + escapeHtml(letterText).replace(/\n/g, "<br>") + "</div>";
        if (exportControls) exportControls.classList.remove("hidden");
        if (buttonGroup) buttonGroup.classList.add("has-export");
    }

    function buildLetter(variantIndex) {
        var name = v("cl-name");
        var role = v("cl-role");
        var company = v("cl-company");
        var highlights = v("cl-highlights");
        var jd = v("cl-job-description");
        var toneLabelMap = {
            professional: t("Professionale", "Professional"),
            direct: t("Diretto", "Direct"),
            informal: t("Informale", "Informal"),
            formal: t("Formale", "Formal"),
            concise: t("Sintetico", "Concise")
        };
        var toneLabel = toneLabelMap[selectedTone] || toneLabelMap.professional;

        if (!name || !role || !company) {
            return { error: t("Compila nome, ruolo target e azienda.", "Please fill in name, target role, and company.") };
        }

        var highlightLines = highlights.split("\n").map(function (x) { return x.trim(); }).filter(Boolean);
        if (highlightLines.length < 2) {
            return { error: t("Inserisci almeno 2 punti chiave.", "Add at least 2 key highlights.") };
        }

        var hasMetric = /\d/.test(highlights);
        var warnings = [];
        if (!hasMetric) warnings.push(t("Aggiungi almeno 1 risultato misurabile (numero o %).", "Add at least 1 measurable result (number or %)."));

        var hooks = buildHooks(name, role, company);
        var hook = hooks[(selectedHookIndex + variantIndex) % hooks.length] || hooks[0];
        var tonePhrases = buildTonePhrases()[selectedTone] || buildTonePhrases().professional;
        var bridgeLines = [
            t("Nel corso delle mie esperienze ho lavorato su progetti con obiettivi chiari e tempi serrati, mantenendo sempre attenzione alla qualità.", "Across my experience, I worked on projects with clear goals and tight timelines, while consistently maintaining quality."),
            t("Nel mio percorso ho costruito un metodo di lavoro pratico e collaborativo, con forte orientamento all'esecuzione.", "In my background, I built a practical and collaborative way of working, with strong execution focus."),
            t("Mi distinguo per un approccio strutturato, capacità di priorità e comunicazione efficace con team cross-funzionali.", "I stand out for a structured approach, prioritization skills, and effective communication with cross-functional teams.")
        ];
        var fitLines = [
            t("Ritengo che il mio profilo sia in linea con ciò che cercate e possa generare valore già nelle prime settimane.", "I believe my profile aligns with what you are looking for and can generate value within the first weeks."),
            t("Sono convinto che questo mix di competenze possa supportare concretamente i vostri obiettivi di business e di prodotto.", "I am confident this mix of skills can concretely support your product and business goals."),
            t("Per questo ruolo porto sia visione strategica sia attenzione operativa al dettaglio.", "For this role, I bring both strategic perspective and strong operational attention to detail.")
        ];
        var closeExtras = [
            t("Se utile, posso condividere portfolio o casi pratici rilevanti per il ruolo.", "If useful, I can share a portfolio or practical case studies relevant to the role."),
            t("Resto disponibile a un confronto per approfondire in che modo posso contribuire ai vostri obiettivi.", "I am available for a conversation to discuss how I can contribute to your goals."),
            t("Sarei felice di approfondire in colloquio come trasformare queste esperienze in risultati concreti per il team.", "I would be glad to discuss how to turn these experiences into concrete results for your team.")
        ];
        var bridgeLine = bridgeLines[variantIndex % bridgeLines.length];
        var fitLine = fitLines[variantIndex % fitLines.length];
        var closeExtra = closeExtras[variantIndex % closeExtras.length];

        var templateBody;
        if (selectedTemplate === "motivational") {
            templateBody = t("Mi riconosco nei valori del vostro team e sono motivato a contribuire con responsabilità e continuità.", "I identify with your team values and I am motivated to contribute with ownership and consistency.");
        } else if (selectedTemplate === "ats") {
            templateBody = t("Competenze chiave: ", "Key skills: ") + highlightLines.slice(0, 4).join("; ") + ".";
        } else {
            templateBody = t("Porto esperienza concreta e approccio orientato ai risultati, con attenzione a qualità e tempi.", "I bring practical experience and a results-oriented approach, with strong focus on quality and delivery.");
        }

        var bullets = highlightLines.map(function (x) { return "• " + x; }).join("\n");
        var letter = [
            t("Candidatura per ", "Application for ") + role + t(" presso ", " at ") + company + ".",
            "",
            t("Gentile Hiring Manager", "Dear Hiring Manager") + ",",
            "",
            hook,
            tonePhrases.intro,
            bridgeLine,
            templateBody,
            fitLine,
            t("Punti chiave:", "Key highlights:"),
            bullets,
            "",
            tonePhrases.close,
            closeExtra,
            "",
            t("Cordiali saluti", "Best regards") + ",",
            name
        ].join("\n");

        var jdTokens = uniq(tokenize(jd)).slice(0, 20);
        var letterLower = letter.toLowerCase();
        var matched = [];
        var missing = [];
        jdTokens.forEach(function (k) { if (letterLower.indexOf(k) !== -1) matched.push(k); else missing.push(k); });

        return { text: letter, matched: matched, missing: missing, warnings: warnings };
    }

    function downloadBlob(blob, fileName) {
        var link = document.createElement("a");
        link.href = URL.createObjectURL(blob);
        link.download = fileName;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(link.href);
    }

    async function exportDocx() {
        if (!latestOutput) return;
        if (!window.docx) return showError(t("Export DOCX non disponibile.", "DOCX export unavailable."));
        var d = window.docx;
        var lines = latestOutput.split("\n");
        var children = [new d.Paragraph({ text: t("Lettera di presentazione", "Cover Letter"), heading: d.HeadingLevel.TITLE })];
        lines.forEach(function (line) { children.push(new d.Paragraph({ text: line || " " })); });
        var doc = new d.Document({ sections: [{ children: children }] });
        var blob = await d.Packer.toBlob(doc);
        downloadBlob(blob, "cover_letter.docx");
    }

    function exportPdf() {
        if (!latestOutput) return;
        if (!window.jspdf || !window.jspdf.jsPDF) return showError(t("Export PDF non disponibile.", "PDF export unavailable."));
        var jsPDF = window.jspdf.jsPDF;
        var doc = new jsPDF({ unit: "pt", format: "a4" });
        var lines = doc.splitTextToSize(latestOutput, 510);
        var pageHeight = doc.internal.pageSize.getHeight();
        var marginTop = 52;
        var marginBottom = 52;
        var lineHeight = 16;
        var y = marginTop;
        doc.setFont("helvetica", "normal");
        doc.setFontSize(11);
        lines.forEach(function(line) {
            if (y > (pageHeight - marginBottom)) {
                doc.addPage();
                y = marginTop;
            }
            doc.text(line, 42, y);
            y += lineHeight;
        });
        doc.save("cover_letter.pdf");
    }

    function exportTxt() {
        if (!latestOutput) return;
        downloadBlob(new Blob([latestOutput], { type: "text/plain;charset=utf-8" }), "cover_letter.txt");
    }

    if (btnGenerate) btnGenerate.addEventListener("click", function () {
        try {
            var name = v("cl-name");
            var role = v("cl-role");
            var company = v("cl-company");
            var highlightsCount = v("cl-highlights").split("\n").map(function (x) { return x.trim(); }).filter(Boolean).length;
            if (!name || !role || !company) {
                var msgRequired = t("Compila nome, ruolo target e azienda.", "Please fill in name, target role, and company.");
                showError(msgRequired);
                return;
            }
            if (highlightsCount < 2) {
                var msgHighlights = t("Inserisci almeno 2 punti chiave.", "Add at least 2 key highlights.");
                showError(msgHighlights);
                return;
            }
            var built = buildLetter(generationCount);
            if (built.error) {
                showError(built.error);
                return;
            }
            latestOutput = built.text;
            generationCount += 1;
            renderResult(built.text, built.matched, built.missing, built.warnings);
        } catch (err) {
            showError(t("Errore interno durante la validazione. Riprova.", "Internal validation error. Please try again."));
        }
    });

    if (btnCopy) btnCopy.addEventListener("click", function () {
        if (!latestOutput) return;
        navigator.clipboard.writeText(latestOutput).then(function () {
            btnCopy.textContent = t("Copiato!", "Copied!");
            btnCopy.classList.add("copied");
            setTimeout(function () {
                btnCopy.textContent = t("Copia", "Copy");
                btnCopy.classList.remove("copied");
            }, 1600);
        }).catch(function () {
            // Fallback for browsers/environments where Clipboard API is restricted.
            var ta = document.createElement("textarea");
            ta.value = latestOutput;
            ta.setAttribute("readonly", "");
            ta.style.position = "fixed";
            ta.style.top = "-9999px";
            document.body.appendChild(ta);
            ta.select();
            try {
                var ok = document.execCommand("copy");
                if (!ok) throw new Error("copy-failed");
                btnCopy.textContent = t("Copiato!", "Copied!");
                btnCopy.classList.add("copied");
                setTimeout(function () {
                    btnCopy.textContent = t("Copia", "Copy");
                    btnCopy.classList.remove("copied");
                }, 1600);
            } catch (e) {
                showError(t("Copia non disponibile in questo browser o contesto.", "Copy is not available in this browser or context."));
            } finally {
                document.body.removeChild(ta);
            }
        });
    });

    if (btnExportPdf) btnExportPdf.addEventListener("click", exportPdf);
    if (btnExportDocx) btnExportDocx.addEventListener("click", function () { exportDocx(); });
    if (btnExportTxt) btnExportTxt.addEventListener("click", exportTxt);

    templateButtons.forEach(function (button) {
        button.addEventListener("click", function () {
            setTemplate(button.getAttribute("data-template") || "standard");
        });
    });
    var templateActions = document.getElementById("cl-template-actions");
    if (templateActions) {
        templateActions.addEventListener("click", function (e) {
            var target = e.target.closest("button[data-template]");
            if (!target) return;
            setTemplate(target.getAttribute("data-template") || "standard");
        });
    }
    hookButtons.forEach(function (button) {
        button.addEventListener("click", function () {
            selectedHookIndex = Math.max(0, (parseInt(button.getAttribute("data-hook"), 10) || 1) - 1);
            hookButtons.forEach(function (b) { b.classList.remove("active"); });
            button.classList.add("active");
        });
    });

    var highlightsInput = document.getElementById("cl-highlights");
    if (highlightsInput) highlightsInput.addEventListener("input", updateWordMeter);
    initToneSelect();
    setTemplate("standard");
    setToneFromButton("professional");
    updateWordMeter();
});
