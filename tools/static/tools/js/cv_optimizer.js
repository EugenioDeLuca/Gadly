document.addEventListener("DOMContentLoaded", function () {
    var isItalian = (document.documentElement.lang || "").toLowerCase().indexOf("it") === 0;
    function t(it, en) { return isItalian ? it : en; }
    var fileInput = document.getElementById("cvopt-file");
    var fileLabel = document.getElementById("cvopt-file-label");
    var jobTitle = document.getElementById("cvopt-job-title");
    var jobDescription = document.getElementById("cvopt-job-description");
    var result = document.getElementById("cvopt-result");
    var btnAnalyze = document.getElementById("cvopt-analyze");
    var exportControls = document.getElementById("cvopt-export-controls");
    var btnExportTxt = document.getElementById("cvopt-export-txt");
    var btnExportDocx = document.getElementById("cvopt-export-docx");
    var btnExportPdf = document.getElementById("cvopt-export-pdf");
    var latestAnalysis = null;
    var historyStorageKey = "cvopt-analysis-history-v1";

    function getCsrfToken() {
        var cookieValue = "";
        if (!document.cookie) return cookieValue;
        var cookies = document.cookie.split(";");
        for (var i = 0; i < cookies.length; i += 1) {
            var cookie = cookies[i].trim();
            if (cookie.indexOf("csrftoken=") === 0) {
                cookieValue = decodeURIComponent(cookie.substring("csrftoken=".length));
                break;
            }
        }
        return cookieValue;
    }
    if (fileInput && fileLabel) {
        var defaultLabel = fileLabel.textContent || gettext("Choose file");
        fileInput.addEventListener("change", function () {
            var file = fileInput.files && fileInput.files[0];
            fileLabel.textContent = file ? file.name : defaultLabel;
        });
    }

    function showError(text) {
        result.textContent = text;
        result.classList.remove("hidden");
        result.classList.add("error");
        if (exportControls) exportControls.classList.add("hidden");
    }

    function clamp(value, min, max) {
        return Math.max(min, Math.min(max, value));
    }

    function detectRoleSector(roleValue) {
        var role = (roleValue || "").toLowerCase();
        if (!role) return "generic";
        if (/(sales|marketing|commercial|account|brand|social|seo|e-commerce|customer success)/.test(role)) return "commercial";
        if (/(hr|recruit|legal|paralegal|risorse umane)/.test(role)) return "hr_legal";
        if (/(admin|finance|accountant|contabil|office|segreter)/.test(role)) return "admin_finance";
        if (/(nurse|doctor|pharma|health|psicolog|physio)/.test(role)) return "healthcare";
        if (/(teacher|docente|research|trainer|tutor)/.test(role)) return "education";
        if (/(developer|engineer|data|cloud|devops|qa|software|frontend|backend|ui|ux)/.test(role)) return "tech";
        return "generic";
    }

    function getConfidenceHint(data) {
        var ratio = typeof data.keyword_match_ratio === "number" ? data.keyword_match_ratio : null;
        if (ratio === null) return t("Affidabilità parole chiave: media (job description non fornita).", "Keyword confidence: medium (no job description provided).");
        if (ratio >= 0.75) return t("Confidence keyword: alto (match molto buono).", "Keyword confidence: high (strong match).");
        if (ratio >= 0.45) return t("Confidence keyword: medio (buona base, migliorabile).", "Keyword confidence: medium (good base, can improve).");
        return t("Confidence keyword: basso (allineamento debole alla job description).", "Keyword confidence: low (weak alignment with job description).");
    }

    function loadHistory() {
        try {
            return JSON.parse(localStorage.getItem(historyStorageKey) || "[]");
        } catch (e) {
            return [];
        }
    }

    function saveHistoryEntry(data, roleValue) {
        var history = loadHistory();
        history.unshift({
            ts: Date.now(),
            score: data.score || 0,
            role: roleValue || t("Ruolo non specificato", "Role not specified"),
            missing_sections: (data.missing_sections || []).slice(0, 3)
        });
        history = history.slice(0, 3);
        localStorage.setItem(historyStorageKey, JSON.stringify(history));
        return history;
    }

    function renderHistory(history) {
        if (!history || !history.length) return "";
        return '<div class="cvopt-card"><h4>' + t("Ultime 3 analisi", "Last 3 analyses") + '</h4>' +
            history.map(function (h) {
                var date = new Date(h.ts);
                var dateText = date.toLocaleDateString() + " " + date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
                var missing = (h.missing_sections || []).map(localizeMissingSection).join(", ") || "-";
                return '<div class="cvopt-breakdown-item cvopt-history-item"><span><strong>' + h.score + '/100</strong> - ' + (h.role || "-") + '<br><small>' + dateText + " | " + t("Sezioni", "Sections") + ": " + missing + "</small></span></div>";
            }).join("") +
            "</div>";
    }

    function renderLoadingSkeleton() {
        result.classList.remove("error", "hidden");
        result.innerHTML =
            '<div class="cvopt-card"><h4>' + t("Analisi in corso...", "Analyzing...") + '</h4>' +
            '<div class="cvopt-skeleton">' +
            '<div class="cvopt-skeleton-bar w60"></div>' +
            '<div class="cvopt-skeleton-bar w100"></div>' +
            '<div class="cvopt-skeleton-bar w80"></div>' +
            '<div class="cvopt-skeleton-bar w40"></div>' +
            "</div></div>";
    }

    function localizeMissingSection(section) {
        var normalized = (section || "").toLowerCase().trim();
        if (!isItalian) return section;
        var map = {
            "summary": "profilo",
            "experience": "esperienze",
            "education": "formazione",
            "skills": "competenze",
            "languages": "lingue",
            "projects": "progetti",
            "certifications": "certificazioni",
            "achievements": "risultati",
            "contact": "contatti",
            "contacts": "contatti"
        };
        return map[normalized] || section;
    }

    function normalizeSectionName(section) {
        var normalized = (section || "").toLowerCase().trim();
        var reverseMap = {
            "profilo": "summary",
            "summary": "summary",
            "experience": "experience",
            "esperienze": "experience",
            "esperienza": "experience",
            "education": "education",
            "formazione": "education",
            "skills": "skills",
            "competenze": "skills",
            "contact": "contact",
            "contacts": "contact",
            "contatti": "contact",
            "languages": "languages",
            "lingue": "languages",
            "projects": "projects",
            "progetti": "projects",
            "certifications": "certifications",
            "certificazioni": "certifications",
            "achievements": "achievements",
            "risultati": "achievements"
        };
        return reverseMap[normalized] || normalized;
    }

    function localizeSuggestionText(text) {
        if (!isItalian || !text) return text;
        var out = text;
        out = out.replace("Add or improve these sections:", "Aggiungi o migliora queste sezioni:");
        out = out.replace(/\bSummary\b/g, "Profilo");
        out = out.replace(/\bExperience\b/g, "Esperienze");
        out = out.replace(/\bEducation\b/g, "Formazione");
        out = out.replace(/\bSkills\b/g, "Competenze");
        out = out.replace(/\bContact\b/g, "Contatti");
        out = out.replace(/\bLanguages\b/g, "Lingue");
        out = out.replace(/\bProjects\b/g, "Progetti");
        out = out.replace(/\bCertifications\b/g, "Certificazioni");
        out = out.replace(/\bAchievements\b/g, "Risultati");
        return out;
    }

    function parseSectionsFromSuggestion(text) {
        if (!text) return [];
        var lower = text.toLowerCase();
        if (lower.indexOf("add or improve these sections") === -1 && lower.indexOf("aggiungi o migliora queste sezioni") === -1) {
            return [];
        }
        var parts = text.split(":");
        if (parts.length < 2) return [];
        return parts.slice(1).join(":").split(",").map(function (s) { return normalizeSectionName(s); }).filter(Boolean);
    }

    function pickVariant(list, variantIndex) {
        if (!list || !list.length) return "";
        var idx = Math.abs(parseInt(variantIndex, 10) || 0) % list.length;
        return list[idx];
    }

    function buildSectionExample(sectionKey, role, analysisData, variantIndex) {
        if (sectionKey === "contact") {
            var extracted = (analysisData && analysisData.extracted_contact) || {};
            var contactParts = [];
            if (extracted.email) contactParts.push((isItalian ? "Email: " : "Email: ") + extracted.email);
            if (extracted.phone) contactParts.push((isItalian ? "Telefono: " : "Phone: ") + extracted.phone);
            if (extracted.linkedin) contactParts.push("LinkedIn: " + extracted.linkedin);
            if (contactParts.length) return contactParts.join(" | ");
            return t("Email: nome.cognome@email.com | Telefono: +39 333 1234567 | LinkedIn: linkedin.com/in/nomecognome", "Email: name.surname@email.com | Phone: +39 333 1234567 | LinkedIn: linkedin.com/in/namesurname");
        }
        if (sectionKey === "experience") {
            var expExamples = [
                t("Frontend Developer - Azienda XYZ - 2022-2025 - Riduzione tempi di caricamento del 35% e aumento conversioni del 18%.", "Frontend Developer - Company XYZ - 2022-2025 - Reduced load times by 35% and increased conversion by 18%."),
                t("Project Coordinator - Azienda ABC - 2021-2024 - Coordinamento di 3 team e consegna progetti con anticipo medio di 12 giorni.", "Project Coordinator - Company ABC - 2021-2024 - Coordinated 3 teams and delivered projects 12 days ahead on average."),
                t("Customer Success Specialist - Azienda Delta - 2020-2023 - Miglioramento retention clienti dal 78% al 90% in 12 mesi.", "Customer Success Specialist - Company Delta - 2020-2023 - Improved customer retention from 78% to 90% in 12 months."),
                t("Operations Specialist - Azienda Nova - 2021-2024 - Riduzione backlog operativo del 33% con nuove priorità settimanali.", "Operations Specialist - Company Nova - 2021-2024 - Reduced operational backlog by 33% through weekly prioritization."),
                t("Office Manager - Azienda Prisma - 2019-2023 - Ottimizzazione processi interni con risparmio di 16 ore/uomo a settimana.", "Office Manager - Company Prisma - 2019-2023 - Optimized internal processes, saving 16 staff-hours per week.")
            ];
            return pickVariant(expExamples, variantIndex);
        }
        if (sectionKey === "education") {
            var eduExamples = [
                t("Laurea in Informatica - Università di Milano - 2022 - 110 e lode", "BSc in Computer Science - University of Milan - 2022 - 110/110 cum laude"),
                t("Master in Data Analysis - Politecnico di Torino - 2024 - Tesi su modelli predittivi", "Master in Data Analysis - Polytechnic University of Turin - 2024 - Thesis on predictive models"),
                t("Diploma Tecnico Informatico - Istituto Tecnico Rossi - 2019 - Votazione 95/100", "Technical High School Diploma (IT) - Rossi Institute - 2019 - Grade 95/100"),
                t("Corso Executive in Project Management - SDA Bocconi - 2023", "Executive Course in Project Management - SDA Bocconi - 2023")
            ];
            return pickVariant(eduExamples, variantIndex);
        }
        if (sectionKey === "skills") {
            var skillExamples = [
                t("React (avanzato), TypeScript (intermedio), Git (avanzato), REST API (intermedio)", "React (advanced), TypeScript (intermediate), Git (advanced), REST APIs (intermediate)"),
                t("Python (avanzato), SQL (intermedio), Docker (intermedio), Power BI (base)", "Python (advanced), SQL (intermediate), Docker (intermediate), Power BI (basic)"),
                t("Project Management (avanzato), Excel (avanzato), CRM (intermedio), Public Speaking (intermedio)", "Project Management (advanced), Excel (advanced), CRM (intermediate), Public Speaking (intermediate)"),
                t("Problem Solving (avanzato), Negoziazione (intermedio), Jira (intermedio), Analisi KPI (avanzato)", "Problem Solving (advanced), Negotiation (intermediate), Jira (intermediate), KPI Analysis (advanced)")
            ];
            return pickVariant(skillExamples, variantIndex);
        }
        if (sectionKey === "summary") {
            var summaryExamples = [
                t("Professionista in ambito ", "Professional in ") + role + t(" con esperienza pratica, orientamento ai risultati e capacità di migliorare processi e performance.", " with hands-on experience, results focus, and strong process/performance improvement mindset."),
                t("Specialista ", "Specialist in ") + role + t(" con approccio data-driven, gestione autonoma delle priorità e attenzione alla qualità del risultato.", " with a data-driven approach, autonomous prioritization, and strong focus on quality outcomes."),
                t("Profilo ", "Profile in ") + role + t(" con esperienza in ambienti dinamici, collaborazione cross-team e obiettivi raggiunti in tempi ridotti.", " with experience in fast-paced environments, cross-team collaboration, and goals achieved with shorter timelines."),
                t("Figura professionale ", "Professional profile in ") + role + t(" orientata al miglioramento continuo, alla chiarezza operativa e al raggiungimento di KPI misurabili.", " focused on continuous improvement, operational clarity, and measurable KPI achievement.")
            ];
            return pickVariant(summaryExamples, variantIndex);
        }
        if (sectionKey === "languages") {
            var langExamples = [
                t("Italiano (avanzato), Inglese (intermedio)", "Italian (advanced), English (intermediate)"),
                t("Italiano (madrelingua), Inglese (avanzato), Spagnolo (base)", "Italian (native), English (advanced), Spanish (basic)"),
                t("Inglese (avanzato), Francese (intermedio)", "English (advanced), French (intermediate)"),
                t("Italiano (madrelingua), Tedesco (intermedio)", "Italian (native), German (intermediate)")
            ];
            return pickVariant(langExamples, variantIndex);
        }
        if (sectionKey === "projects") {
            var projectExamples = [
                t("Ottimizzazione onboarding clienti - Notion, Zapier - Riduzione tempo medio da 5 giorni a 2 giorni.", "Customer onboarding optimization - Notion, Zapier - Reduced average lead time from 5 days to 2 days."),
                t("Redesign area riservata - Figma, React - Incremento completamento task +24%.", "User dashboard redesign - Figma, React - Increased task completion by 24%."),
                t("Automazione reportistica mensile - Python, Google Sheets - Risparmio di 18 ore/mese.", "Monthly reporting automation - Python, Google Sheets - Saved 18 hours/month."),
                t("Ottimizzazione processo ticketing - Zendesk - Riduzione tempi di risposta del 29%.", "Ticketing process optimization - Zendesk - Reduced response time by 29%.")
            ];
            return pickVariant(projectExamples, variantIndex);
        }
        if (sectionKey === "certifications") {
            var certExamples = [
                t("Google Analytics Certification - Google - 2024", "Google Analytics Certification - Google - 2024"),
                t("Scrum Fundamentals Certified - SCRUMstudy - 2023", "Scrum Fundamentals Certified - SCRUMstudy - 2023"),
                t("AWS Cloud Practitioner - Amazon Web Services - 2025", "AWS Cloud Practitioner - Amazon Web Services - 2025"),
                t("IELTS Academic - British Council - 2022", "IELTS Academic - British Council - 2022")
            ];
            return pickVariant(certExamples, variantIndex);
        }
        if (sectionKey === "achievements") {
            var achExamples = [
                t("Miglioramento produttività team +22% tramite nuova pipeline operativa.", "Improved team productivity by 22% through a redesigned delivery pipeline."),
                t("Riduzione ticket aperti oltre SLA del 40% in 6 mesi.", "Reduced overdue support tickets by 40% in 6 months."),
                t("Aumento soddisfazione clienti da 4.1 a 4.7/5 in due trimestri.", "Increased customer satisfaction from 4.1 to 4.7/5 in two quarters."),
                t("Riduzione errori operativi del 26% dopo introduzione checklist standard.", "Reduced operational errors by 26% after introducing standardized checklists.")
            ];
            return pickVariant(achExamples, variantIndex);
        }
        return "";
    }

    function computeBreakdown(score, data) {
        var matched = (data.matched_keywords || []).length;
        var missing = (data.missing_keywords || []).length;
        var totalKeywords = matched + missing;
        var missingSections = (data.missing_sections || []).length;
        var suggestionCount = (data.suggestions || []).length;
        var wc = data.word_count || 0;

        var structureFactor = clamp(1 - (missingSections / 4), 0, 1);
        var keywordFactor = totalKeywords > 0 ? clamp(matched / totalKeywords, 0, 1) : 0.75;
        var clarityFactor = clamp(1 - (suggestionCount / 8), 0.2, 1);
        var lengthFactor = wc < 200 ? 0.35 : wc < 320 ? 0.65 : wc <= 950 ? 1 : wc <= 1300 ? 0.75 : 0.45;

        var weighted = [
            { key: "structure", label: t("Struttura", "Structure"), factor: structureFactor, weight: 0.35 },
            { key: "keywords", label: t("Parole chiave", "Keywords"), factor: keywordFactor, weight: 0.35 },
            { key: "clarity", label: t("Chiarezza", "Clarity"), factor: clarityFactor, weight: 0.15 },
            { key: "length", label: t("Lunghezza", "Length"), factor: lengthFactor, weight: 0.15 }
        ];

        var rawSum = weighted.reduce(function (sum, item) { return sum + (item.factor * item.weight); }, 0) || 1;
        var parts = weighted.map(function (item) {
            return { label: item.label, points: Math.round(score * ((item.factor * item.weight) / rawSum)) };
        });
        var total = parts.reduce(function (sum, item) { return sum + item.points; }, 0);
        var delta = score - total;
        if (delta !== 0 && parts.length) parts[0].points += delta;
        return parts;
    }

    function buildSuggestionExample(text, targetRoleValue, analysisData, variantIndex) {
        var hasRole = !!(targetRoleValue || "").trim();
        var role = targetRoleValue || t("questo ruolo", "this role");
        var roleIntroIt = hasRole ? ("nel ruolo di " + role) : "nel mio ruolo";
        var roleIntroEn = hasRole ? ("in the role of " + role) : "in my role";
        var roleAreaIt = hasRole ? ("in ambito " + role) : "nel mio ambito";
        var roleAreaEn = hasRole ? ("in " + role) : "in my domain";
        var sector = detectRoleSector(targetRoleValue);
        var missingSectionsFromSuggestion = parseSectionsFromSuggestion(text);
        if (missingSectionsFromSuggestion.length) {
            var sectionExample = buildSectionExample(missingSectionsFromSuggestion[0], role, analysisData, variantIndex);
            if (sectionExample) return t("Esempio ottimizzato: ", "Optimized example: ") + sectionExample;
        }
        var lower = (text || "").toLowerCase();
        if (lower.indexOf("molto corto") !== -1 || lower.indexOf("very short") !== -1) {
            var shortExamples = sector === "commercial" ? [
                t("Esempio ottimizzato: Nel mio ruolo commerciale ho gestito 120 lead/mese, aumentando il tasso di conversione dal 12% al 18% in 2 trimestri.", "Optimized example: In my commercial role, I managed 120 leads/month and increased conversion from 12% to 18% in 2 quarters."),
                t("Esempio ottimizzato: Ho migliorato il valore medio ordine del 14% attraverso campagne mirate e follow-up strutturato.", "Optimized example: I improved average order value by 14% through targeted campaigns and structured follow-ups."),
                t("Esempio ottimizzato: Ho ridotto il ciclo di vendita medio di 9 giorni, migliorando la previsione pipeline e la chiusura opportunità.", "Optimized example: I reduced average sales cycle by 9 days by improving pipeline forecasting and opportunity closure."),
                t("Esempio ottimizzato: Ho incrementato il tasso di risposta alle campagne email del 31% e generato 26 opportunità qualificate in un mese.", "Optimized example: I increased email campaign response rate by 31% and generated 26 qualified opportunities in one month."),
                t("Esempio ottimizzato: Ho recuperato clienti inattivi con un piano di re-engagement, ottenendo +17% di rinnovi trimestrali.", "Optimized example: I re-engaged inactive customers with a structured plan, achieving +17% quarterly renewals."),
                t("Esempio ottimizzato: Ho migliorato la qualità dei lead (MQL->SQL) del 22% allineando messaggi marketing e criteri commerciali.", "Optimized example: I improved lead quality (MQL->SQL) by 22% by aligning marketing messaging and sales qualification criteria.")
            ] : [
                t(
                    "Esempio ottimizzato: " + roleIntroIt.charAt(0).toUpperCase() + roleIntroIt.slice(1) + " ho gestito 14 attività critiche al mese, riducendo i tempi medi di consegna del 27% e migliorando la qualità percepita dal cliente del 18%.",
                    "Optimized example: " + roleIntroEn.charAt(0).toUpperCase() + roleIntroEn.slice(1) + ", I managed 14 critical tasks per month, reduced average delivery time by 27%, and improved perceived service quality by 18%."
                ),
                t(
                    "Esempio ottimizzato: " + (hasRole ? ("Come " + role) : "Come professionista") + " ho guidato 3 iniziative prioritarie, con un miglioramento dell'efficienza operativa del 21% e una riduzione errori del 16%.",
                    "Optimized example: " + (hasRole ? ("As a " + role) : "As a professional") + ", I led 3 priority initiatives, improving operational efficiency by 21% and reducing errors by 16%."
                ),
                t(
                    "Esempio ottimizzato: " + roleAreaIt.charAt(0).toUpperCase() + roleAreaIt.slice(1) + " ho ottimizzato il flusso di lavoro del team, aumentando la velocità di esecuzione del 24% e rispettando il 98% delle scadenze.",
                    "Optimized example: " + roleAreaEn.charAt(0).toUpperCase() + roleAreaEn.slice(1) + ", I optimized team workflows, increased execution speed by 24%, and met 98% of deadlines."
                ),
                t(
                    "Esempio ottimizzato: Ho standardizzato le procedure operative e ridotto i passaggi ridondanti, con un miglioramento dell'efficienza del 20%.",
                    "Optimized example: I standardized operating procedures and removed redundant steps, improving overall efficiency by 20%."
                ),
                t(
                    "Esempio ottimizzato: Ho supportato la gestione di priorità multiple migliorando la puntualità delle consegne dal 84% al 97%.",
                    "Optimized example: I supported multi-priority execution, improving on-time delivery from 84% to 97%."
                ),
                t(
                    "Esempio ottimizzato: Ho introdotto un monitoraggio KPI settimanale che ha ridotto le rilavorazioni del 23% in due trimestri.",
                    "Optimized example: I introduced weekly KPI monitoring that reduced rework by 23% across two quarters."
                )
            ];
            return pickVariant(shortExamples, variantIndex);
        }
        if (lower.indexOf("keyword") !== -1 || lower.indexOf("parole chiave") !== -1) {
            var keywordExamples = [
                t("Esempio ottimizzato: Nel mio ruolo precedente ho generato un impatto misurabile in progetti ", "Optimized example: In my previous role, I delivered measurable impact in ") + role + t(" migliorando efficienza dei processi e collaborazione.", " projects by improving process efficiency and collaboration."),
                t("Esempio ottimizzato: Ho adattato il CV al ruolo " + role + " evidenziando strumenti, tecnologie e risultati concreti legati alla job description.", "Optimized example: I tailored my resume to the " + role + " role by highlighting tools, technologies, and measurable outcomes aligned with the job description."),
                t("Esempio ottimizzato: Ho inserito parole chiave specifiche del ruolo " + role + " in profilo, esperienze e competenze per aumentare la rilevanza ATS.", "Optimized example: I added role-specific keywords for " + role + " across summary, experience, and skills to improve ATS relevance.")
            ];
            return pickVariant(keywordExamples, variantIndex);
        }
        if (lower.indexOf("quantif") !== -1 || lower.indexOf("numer") !== -1 || lower.indexOf("metric") !== -1) {
            var metricExamples = [
                t("Esempio ottimizzato: Ho migliorato i tempi di consegna del 28% e ridotto i problemi ricorrenti del 35% ottimizzando i flussi e chiarendo le responsabilità.", "Optimized example: I improved delivery time by 28% and reduced recurring issues by 35% through workflow optimization and clear ownership."),
                t("Esempio ottimizzato: Ho aumentato la produttività del team del 19% e ridotto i costi operativi del 12% grazie a processi standardizzati.", "Optimized example: I increased team productivity by 19% and reduced operating costs by 12% through standardized processes."),
                t("Esempio ottimizzato: Ho portato il tasso di completamento progetti dal 82% al 96% e migliorato la soddisfazione cliente di 0.6 punti.", "Optimized example: I improved project completion rate from 82% to 96% and raised customer satisfaction by 0.6 points.")
            ];
            return pickVariant(metricExamples, variantIndex);
        }
        if (lower.indexOf("summary") !== -1 || lower.indexOf("profilo") !== -1) {
            var summaryExamples = [
                t("Esempio ottimizzato: Professionista ", "Optimized example: ") + role + t(" con esperienza pratica, forte capacità esecutiva e risultati misurabili su progetti cross-funzionali.", " professional with hands-on experience, strong execution skills, and measurable results across cross-functional projects."),
                t("Esempio ottimizzato: Profilo ", "Optimized example: ") + role + t(" orientato ai risultati, con esperienza nella gestione end-to-end di attività complesse e collaborazione tra team.", " profile focused on outcomes, with end-to-end execution experience and strong cross-team collaboration."),
                t("Esempio ottimizzato: Specialista ", "Optimized example: ") + role + t(" con approccio analitico, attenzione al cliente e capacità di trasformare obiettivi in risultati concreti.", " specialist with an analytical mindset, customer focus, and ability to turn goals into measurable outcomes.")
            ];
            return pickVariant(summaryExamples, variantIndex);
        }
        var fallbackExamples = [
            t("Esempio ottimizzato: Ho contribuito a iniziative ad alto impatto in ambito ", "Optimized example: I contributed to high-impact ") + role + t(", coordinando le priorità e generando risultati di business misurabili.", " initiatives, coordinating priorities and delivering measurable business outcomes."),
            t("Esempio ottimizzato: In ambito ", "Optimized example: In ") + role + t(" ho gestito obiettivi chiari, migliorando tempi di esecuzione e qualità complessiva del risultato.", " I managed clear goals, improving execution speed and overall quality."),
            t("Esempio ottimizzato: Come professionista ", "Optimized example: As a ") + role + t(" ho supportato il team nel raggiungimento di KPI critici con un approccio strutturato e orientato ai risultati.", " professional, I helped the team achieve critical KPIs with a structured, results-driven approach.")
        ];
        return pickVariant(fallbackExamples, variantIndex);
    }

    function renderAnalysis(data) {
        var score = data.score || 0;
        var matched = data.matched_keywords || [];
        var missing = data.missing_keywords || [];
        var missingSections = (data.missing_sections || []).map(localizeMissingSection);
        var suggestions = data.suggestions || [];
        var localizedSuggestions = suggestions.map(localizeSuggestionText);
        var targetRoleValue = (jobTitle.value || "").trim();
        var breakdown = computeBreakdown(score, data);
        data.breakdown = breakdown;
        if (!data.applied_examples) data.applied_examples = [];
        var history = saveHistoryEntry(data, targetRoleValue);

        function badges(items, cssClass) {
            if (!items.length) return '<span class="cvopt-badge ' + cssClass + '">-</span>';
            return items.map(function (item) {
                return '<span class="cvopt-badge ' + cssClass + '">' + item.replace(/</g, "&lt;").replace(/>/g, "&gt;") + "</span>";
            }).join("");
        }

        var suggestionsHtml = localizedSuggestions.length ? localizedSuggestions.map(function (text, idx) {
            var escaped = text.replace(/</g, "&lt;").replace(/>/g, "&gt;");
            return '<div class="cvopt-suggestion">' +
                '<p class="cvopt-suggestion-text">' + escaped + "</p>" +
                '<button type="button" class="cvopt-apply-btn" data-suggestion-index="' + idx + '">' + t("Applica esempio", "Apply example") + "</button>" +
                '<div class="cvopt-example hidden" id="cvopt-example-' + idx + '"></div>' +
            "</div>";
        }).join("") : '<div class="cvopt-suggestion-text">-</div>';

        result.classList.remove("error", "hidden");
        result.innerHTML =
            '<div class="cvopt-cards">' +
                '<div class="cvopt-card">' +
                    '<h4>' + t("Panoramica punteggio", "Score overview") + "</h4>" +
                    '<div class="cvopt-score-row">' +
                        '<div class="cvopt-score-main">' + t("Punteggio CV", "CV score") + ": " + score + "/100</div>" +
                    "</div>" +
                "</div>" +
                '<div class="cvopt-card">' +
                    '<h4>' + t("Dettaglio punteggio", "Score breakdown") + "</h4>" +
                    '<div class="cvopt-breakdown">' +
                        breakdown.map(function (item) {
                            return '<div class="cvopt-breakdown-item"><span>' + item.label + '</span><strong>' + item.points + "</strong></div>";
                        }).join("") +
                    '</div><div class="cvopt-confidence"><strong>' + getConfidenceHint(data) + "</strong></div>" +
                "</div>" +
                '<div class="cvopt-card">' +
                    '<h4>' + t("Confronto job description", "Job description comparison") + "</h4>" +
                    '<div class="cvopt-keywords">' +
                        '<div class="cvopt-keyword-line"><span class="cvopt-label">' + t("Parole chiave trovate", "Matched keywords") + ":</span>" + badges(matched, "good") + "</div>" +
                        '<div class="cvopt-keyword-line"><span class="cvopt-label">' + t("Parole chiave mancanti", "Missing keywords") + ":</span>" + badges(missing, "bad") + "</div>" +
                        '<div class="cvopt-keyword-line"><span class="cvopt-label">' + t("Sezioni mancanti", "Missing sections") + ":</span>" + badges(missingSections, "bad") + "</div>" +
                    "</div>" +
                "</div>" +
                '<div class="cvopt-card">' +
                    '<h4>' + t("Suggerimenti azionabili", "Actionable suggestions") + "</h4>" +
                    suggestionsHtml +
                "</div>" +
                renderHistory(history) +
            "</div>";

        Array.prototype.slice.call(result.querySelectorAll(".cvopt-apply-btn")).forEach(function (btn) {
            btn.addEventListener("click", function () {
                var index = parseInt(btn.getAttribute("data-suggestion-index"), 10);
                var suggestion = suggestions[index] || "";
                var clickCount = parseInt(btn.getAttribute("data-example-variant") || "0", 10) || 0;
                var example = buildSuggestionExample(suggestion, targetRoleValue, data, clickCount);
                btn.setAttribute("data-example-variant", String(clickCount + 1));
                var box = document.getElementById("cvopt-example-" + index);
                if (!box) return;
                box.textContent = example;
                box.classList.remove("hidden");
                if (data.applied_examples.indexOf(example) === -1) data.applied_examples.push(example);
            });
            var baseSeed = (data.score || 0) + (data.word_count || 0) + (parseInt(btn.getAttribute("data-suggestion-index"), 10) || 0);
            btn.setAttribute("data-example-variant", String(baseSeed % 10));
        });

        if (exportControls) exportControls.classList.remove("hidden");
    }

    function buildPlainTextExport(data) {
        var lines = [];
        lines.push(t("Punteggio CV", "CV score") + ": " + (data.score || 0) + "/100");
        lines.push(t("Conteggio parole", "Word count") + ": " + (data.word_count || 0));
        lines.push("");
        lines.push(t("Dettaglio punteggio", "Score breakdown") + ":");
        (data.breakdown || []).forEach(function (item) {
            lines.push("- " + item.label + ": " + item.points);
        });
        lines.push("");
        lines.push(t("Parole chiave trovate", "Matched keywords") + ": " + ((data.matched_keywords || []).join(", ") || "-"));
        lines.push(t("Parole chiave mancanti", "Missing keywords") + ": " + ((data.missing_keywords || []).join(", ") || "-"));
        lines.push(t("Sezioni mancanti", "Missing sections") + ": " + (((data.missing_sections || []).map(localizeMissingSection)).join(", ") || "-"));
        lines.push("");
        lines.push(t("Suggerimenti", "Suggestions") + ":");
        (data.suggestions || []).map(localizeSuggestionText).forEach(function (s) { lines.push("- " + s); });
        if (data.applied_examples && data.applied_examples.length) {
            lines.push("");
            lines.push(t("Esempi applicati", "Applied examples") + ":");
            data.applied_examples.forEach(function (e) { lines.push("- " + e); });
        }
        return lines.join("\n");
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

    function getExportBaseName() {
        return isItalian ? "report_ottimizzatore_cv" : "cv_optimizer_report";
    }

    function exportTxt() {
        if (!latestAnalysis) return;
        var txt = buildPlainTextExport(latestAnalysis);
        downloadBlob(new Blob([txt], { type: "text/plain;charset=utf-8" }), getExportBaseName() + ".txt");
    }

    async function exportDocx() {
        if (!latestAnalysis) return;
        if (!window.docx) {
            showError(t("Export DOCX non disponibile.", "DOCX export unavailable."));
            return;
        }
        var d = window.docx;
        var text = buildPlainTextExport(latestAnalysis);
        var lines = text.split("\n");
        var children = [new d.Paragraph({ text: t("Report CV Optimizer", "CV Optimizer Report"), heading: d.HeadingLevel.TITLE })];
        lines.forEach(function (line) { children.push(new d.Paragraph({ text: line || " " })); });
        var doc = new d.Document({ sections: [{ children: children }] });
        var blob = await d.Packer.toBlob(doc);
        downloadBlob(blob, getExportBaseName() + ".docx");
    }

    function exportPdf() {
        if (!latestAnalysis) return;
        if (!window.jspdf || !window.jspdf.jsPDF) {
            showError(t("Export PDF non disponibile.", "PDF export unavailable."));
            return;
        }
        var jsPDF = window.jspdf.jsPDF;
        var doc = new jsPDF({ unit: "pt", format: "a4" });
        var text = buildPlainTextExport(latestAnalysis);
        var lines = doc.splitTextToSize(text, 510);
        var pageHeight = doc.internal.pageSize.getHeight();
        var marginTop = 52;
        var marginBottom = 52;
        var lineHeight = 16;
        var y = marginTop;
        doc.setFont("helvetica", "normal");
        doc.setFontSize(11);
        lines.forEach(function (line) {
            if (y > (pageHeight - marginBottom)) {
                doc.addPage();
                y = marginTop;
            }
            doc.text(line, 42, y);
            y += lineHeight;
        });
        doc.save(getExportBaseName() + ".pdf");
    }

    btnAnalyze.addEventListener("click", function () {
        var file = fileInput.files && fileInput.files[0];
        if (!file) {
            showError(t("Carica prima il file CV.", "Please upload your CV file."));
            return;
        }
        var fd = new FormData();
        fd.append("cv_file", file);
        fd.append("job_title", (jobTitle.value || "").trim());
        fd.append("job_description", (jobDescription.value || "").trim());

        latestAnalysis = null;
        result.classList.remove("error");
        renderLoadingSkeleton();
        if (exportControls) exportControls.classList.add("hidden");

        fetch("/api/cv-optimize/", {
            method: "POST",
            body: fd,
            credentials: "same-origin",
            headers: {
                "X-CSRFToken": getCsrfToken()
            }
        })
            .then(function (r) { return r.json().then(function (data) { return { ok: r.ok, data: data }; }); })
            .then(function (res) {
                if (!res.ok || res.data.error) {
                    showError(res.data.error || t("Si è verificato un errore durante l'analisi del CV.", "An error occurred while optimizing the CV."));
                    return;
                }
                latestAnalysis = res.data;
                renderAnalysis(latestAnalysis);
            })
            .catch(function () {
                showError(t("Richiesta non riuscita.", "Request failed"));
            });
    });

    if (btnExportTxt) btnExportTxt.addEventListener("click", exportTxt);
    if (btnExportDocx) btnExportDocx.addEventListener("click", exportDocx);
    if (btnExportPdf) btnExportPdf.addEventListener("click", exportPdf);
});
