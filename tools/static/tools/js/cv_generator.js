document.addEventListener("DOMContentLoaded", function () {
    var isItalian = (document.documentElement.lang || "").toLowerCase().indexOf("it") === 0;
    var result = document.getElementById("cv-result");
    var preview = document.getElementById("cv-preview");
    var previewDock = document.getElementById("cv-preview-dock");
    var previewFull = document.getElementById("cv-preview-full");
    var quality = document.getElementById("cv-quality");
    var openFullPreviewLink = document.getElementById("cv-open-web-preview");
    var previewModal = document.getElementById("cv-preview-modal");
    var previewModalClose = document.getElementById("cv-preview-modal-close");
    var btnGenerate = document.getElementById("cv-generate");
    var btnDownload = document.getElementById("cv-download");
    var exportFormatSelect = document.getElementById("cv-export-format");
    var formatToggleButtons = Array.prototype.slice.call(document.querySelectorAll(".format-toggle"));
    var cvLangButtons = Array.prototype.slice.call(document.querySelectorAll("[data-cv-lang]"));
    var templateButtons = Array.prototype.slice.call(document.querySelectorAll("[data-template]"));
    var atsBtn = document.getElementById("cv-toggle-ats");
    var photoInput = document.getElementById("cv-photo");
    var photoLabel = document.querySelector("label[for='cv-photo'].choose-file-btn");
    var exportDraftBtn = document.getElementById("cv-export-draft");
    var importDraftBtn = document.getElementById("cv-import-draft");
    var importDraftInput = document.getElementById("cv-import-draft-file");
    var birthDateInput = document.getElementById("cv-birth-date");
    var targetRoleWrap = document.getElementById("cv-target-role-wrap");
    var experienceList = document.getElementById("cv-experience-list");
    var educationList = document.getElementById("cv-education-list");
    var skillList = document.getElementById("cv-skill-list");
    var languageList = document.getElementById("cv-language-list");
    var addExperienceBtn = document.getElementById("cv-add-experience");
    var addEducationBtn = document.getElementById("cv-add-education");
    var addSkillBtn = document.getElementById("cv-add-skill");
    var addLanguageBtn = document.getElementById("cv-add-language");
    var storageKey = "cv-generator-form-v3";
    var isReadyToDownload = false;
    var selectedTemplate = "classic";
    var selectedCvLang = "it";
    var atsMode = false;
    var lastQualityScore = 0;
    var previewPhotoUrl = null;
    var previewPhotoObjectUrl = null;

    if (window.pdfjsLib && window.pdfjsLib.GlobalWorkerOptions) {
        window.pdfjsLib.GlobalWorkerOptions.workerSrc = "https://cdnjs.cloudflare.com/ajax/libs/pdf.js/4.4.168/pdf.worker.min.js";
    }

    var fieldIds = [
        "cv-full-name", "cv-last-name", "cv-birth-date", "cv-target-role", "cv-email", "cv-phone",
        "cv-citizenship", "cv-address", "cv-city", "cv-linkedin", "cv-summary",
        "cv-certifications", "cv-projects", "cv-achievements", "cv-export-format"
    ];

    function uiText(it, en) { return isItalian ? it : en; }
    function tr(lang, map) { return map[lang] || map.en; }
    function value(id) { var el = document.getElementById(id); return el ? (el.value || "").trim() : ""; }
    function sanitizeBaseName(firstName, lastName) {
        return ([firstName || "", lastName || ""].join(" ").trim().replace(/\s+/g, "_").replace(/[^a-zA-Z0-9_]/g, "").toLowerCase()) || "cv";
    }
    function buildOutputName(firstName, lastName, lang, format) { return sanitizeBaseName(firstName, lastName) + "_cv_" + lang + "." + format; }
    function show(text, isError) {
        result.classList.remove("file-ready");
        result.textContent = text;
        result.classList.remove("hidden");
        if (isError) result.classList.add("error"); else result.classList.remove("error");
    }
    function escapeHtml(valueText) {
        return (valueText || "").replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
    }
    function escapeAttr(valueText) {
        return (valueText || "")
            .replace(/&/g, "&amp;")
            .replace(/"/g, "&quot;")
            .replace(/</g, "&lt;")
            .replace(/>/g, "&gt;");
    }
    function revokePreviewPhotoObjectUrl() {
        if (!previewPhotoObjectUrl) return;
        try {
            URL.revokeObjectURL(previewPhotoObjectUrl);
        } catch (e) { /* ignore */ }
        previewPhotoObjectUrl = null;
    }
    function getPreviewPhotoUrl(data) {
        if (previewPhotoUrl) return previewPhotoUrl;
        if (!data || !data.photoFile) return "";
        revokePreviewPhotoObjectUrl();
        previewPhotoObjectUrl = URL.createObjectURL(data.photoFile);
        return previewPhotoObjectUrl;
    }
    function showFileReady(fileName) {
        result.classList.remove("error");
        result.classList.add("file-ready");
        result.classList.remove("hidden");
        result.innerHTML = '<span class="result-file-row"><span class="result-file-icon" aria-hidden="true">📄</span><span>' +
            fileName.replace(/</g, "&lt;").replace(/>/g, "&gt;") + "</span></span>";
    }
    function downloadBlob(blob, fileName) {
        var a = document.createElement("a");
        a.href = URL.createObjectURL(blob);
        a.download = fileName;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(a.href);
    }
    function setExportFormat(format) {
        exportFormatSelect.value = format;
        formatToggleButtons.forEach(function (button) { button.classList.toggle("active", button.getAttribute("data-format") === format); });
    }
    function setTemplate(valueTemplate) {
        selectedTemplate = valueTemplate;
        templateButtons.forEach(function (b) { b.classList.toggle("active", b.getAttribute("data-template") === valueTemplate); });
    }
    function setCvLang(lang) {
        selectedCvLang = lang;
        cvLangButtons.forEach(function (b) { b.classList.toggle("active", b.getAttribute("data-cv-lang") === lang); });
        if (btnDownload) {
            btnDownload.textContent = uiText("Scarica ", "Download ") + lang.toUpperCase();
        }
    }
    function updateAtsButtonState() {
        if (!atsBtn) return;
        atsBtn.classList.toggle("ats-on", atsMode);
        atsBtn.classList.toggle("ats-off", !atsMode);
        atsBtn.textContent = "ATS: " + (atsMode ? uiText("Attivo", "On") : uiText("Disattivato", "Off"));
    }

    function createExperienceItem(data) {
        var item = document.createElement("div");
        item.className = "repeat-item repeat-grid";
        item.innerHTML = '<input class="exp-role" name="exp-role" placeholder="' + uiText("Ruolo", "Role") + '" value="' + escapeAttr(data && data.role ? data.role : "") + '">' +
            '<input class="exp-company" name="exp-company" placeholder="' + uiText("Azienda", "Company") + '" value="' + escapeAttr(data && data.company ? data.company : "") + '">' +
            '<input class="exp-period" name="exp-period" placeholder="' + uiText("Periodo", "Period") + '" value="' + escapeAttr(data && data.period ? data.period : "") + '">' +
            '<input class="exp-result" name="exp-result" placeholder="' + uiText("Risultati", "Results") + '" value="' + escapeAttr(data && data.result ? data.result : "") + '">' +
            '<button type="button" class="exp-remove repeat-remove-btn">' + uiText("Rimuovi", "Remove") + "</button>";
        item.querySelectorAll("input").forEach(function (i) { i.addEventListener("input", onDataChanged); });
        item.querySelector(".exp-remove").addEventListener("click", function () { item.remove(); onDataChanged(); });
        return item;
    }
    function createEducationItem(data) {
        var item = document.createElement("div");
        item.className = "repeat-item repeat-grid";
        item.innerHTML = '<input class="edu-title" name="edu-title" placeholder="' + uiText("Titolo", "Title") + '" value="' + escapeAttr(data && data.title ? data.title : "") + '">' +
            '<input class="edu-school" name="edu-school" placeholder="' + uiText("Istituto", "Institution") + '" value="' + escapeAttr(data && data.school ? data.school : "") + '">' +
            '<input class="edu-year" name="edu-year" placeholder="' + uiText("Anno", "Year") + '" value="' + escapeAttr(data && data.year ? data.year : "") + '">' +
            '<input class="edu-grade" name="edu-grade" placeholder="' + uiText("Voto", "Grade") + '" value="' + escapeAttr(data && data.grade ? data.grade : "") + '">' +
            '<button type="button" class="edu-remove repeat-remove-btn">' + uiText("Rimuovi", "Remove") + "</button>";
        item.querySelectorAll("input").forEach(function (i) { i.addEventListener("input", onDataChanged); });
        item.querySelector(".edu-remove").addEventListener("click", function () { item.remove(); onDataChanged(); });
        return item;
    }
    function createSkillItem(data) {
        var item = document.createElement("div");
        item.className = "repeat-item repeat-grid";
        item.innerHTML = '<input class="skill-name" name="skill-name" placeholder="' + uiText("Competenza", "Skill") + '" value="' + escapeAttr(data && data.name ? data.name : "") + '">' +
            '<div class="panel-actions level-toggle">' +
            '<button type="button" data-level="base">' + uiText("Base", "Basic") + "</button>" +
            '<button type="button" data-level="intermedio">' + uiText("Intermedio", "Intermediate") + "</button>" +
            '<button type="button" data-level="avanzato">' + uiText("Avanzato", "Advanced") + "</button></div>" +
            '<button type="button" class="skill-remove repeat-remove-btn">' + uiText("Rimuovi", "Remove") + "</button>";
        var level = (data && data.level) || "intermedio";
        item.querySelectorAll("[data-level]").forEach(function (btn) {
            btn.classList.toggle("active", btn.getAttribute("data-level") === level);
            btn.addEventListener("click", function () {
                item.querySelectorAll("[data-level]").forEach(function (b) { b.classList.remove("active"); });
                btn.classList.add("active");
                onDataChanged();
            });
        });
        item.querySelector(".skill-name").addEventListener("input", onDataChanged);
        item.querySelector(".skill-remove").addEventListener("click", function () { item.remove(); onDataChanged(); });
        return item;
    }
    function createLanguageItem(data) {
        var item = document.createElement("div");
        item.className = "repeat-item repeat-grid";
        item.innerHTML = '<input class="lang-name" name="lang-name" placeholder="' + uiText("Lingua", "Language") + '" value="' + escapeAttr(data && data.name ? data.name : "") + '">' +
            '<div class="panel-actions level-toggle">' +
            '<button type="button" data-level="base">' + uiText("Base", "Basic") + "</button>" +
            '<button type="button" data-level="intermedio">' + uiText("Intermedio", "Intermediate") + "</button>" +
            '<button type="button" data-level="avanzato">' + uiText("Avanzato", "Advanced") + "</button></div>" +
            '<button type="button" class="lang-remove repeat-remove-btn">' + uiText("Rimuovi", "Remove") + "</button>";
        var level = (data && data.level) || "intermedio";
        item.querySelectorAll("[data-level]").forEach(function (btn) {
            btn.classList.toggle("active", btn.getAttribute("data-level") === level);
            btn.addEventListener("click", function () {
                item.querySelectorAll("[data-level]").forEach(function (b) { b.classList.remove("active"); });
                btn.classList.add("active");
                onDataChanged();
            });
        });
        item.querySelector(".lang-name").addEventListener("input", onDataChanged);
        item.querySelector(".lang-remove").addEventListener("click", function () { item.remove(); onDataChanged(); });
        return item;
    }

    function parseExperience() {
        return Array.prototype.slice.call(experienceList.querySelectorAll(".repeat-item")).map(function (item) {
            return {
                role: (item.querySelector(".exp-role").value || "").trim(),
                company: (item.querySelector(".exp-company").value || "").trim(),
                period: (item.querySelector(".exp-period").value || "").trim(),
                result: (item.querySelector(".exp-result").value || "").trim()
            };
        }).filter(function (x) { return x.role || x.company || x.period || x.result; });
    }
    function parseEducation() {
        return Array.prototype.slice.call(educationList.querySelectorAll(".repeat-item")).map(function (item) {
            return {
                title: (item.querySelector(".edu-title").value || "").trim(),
                school: (item.querySelector(".edu-school").value || "").trim(),
                year: (item.querySelector(".edu-year").value || "").trim(),
                grade: (item.querySelector(".edu-grade").value || "").trim()
            };
        }).filter(function (x) { return x.title || x.school || x.year || x.grade; });
    }
    function parseSkills() {
        return Array.prototype.slice.call(skillList.querySelectorAll(".repeat-item")).map(function (item) {
            var active = item.querySelector("[data-level].active");
            return { name: (item.querySelector(".skill-name").value || "").trim(), level: active ? active.getAttribute("data-level") : "intermedio" };
        }).filter(function (x) { return x.name; });
    }
    function parseLanguages() {
        return Array.prototype.slice.call(languageList.querySelectorAll(".repeat-item")).map(function (item) {
            var active = item.querySelector("[data-level].active");
            return { name: (item.querySelector(".lang-name").value || "").trim(), level: active ? active.getAttribute("data-level") : "intermedio" };
        }).filter(function (x) { return x.name; });
    }

    /** Nome e cognome nei due campi: non basta mettere nome+cognome solo in "Nome". */
    function hasSeparateFirstAndLastName(data) {
        var f = (data.firstName || "").trim();
        var l = (data.lastName || "").trim();
        var fTokens = f.split(/\s+/).filter(Boolean);
        if (fTokens.length >= 2 && l.length < 2) return false;
        if (f.length < 2 || l.length < 2) return false;
        return true;
    }

    function collectFormData() {
        var firstName = value("cv-full-name");
        var lastName = value("cv-last-name");
        return {
            firstName: firstName,
            lastName: lastName,
            fullName: [firstName, lastName].filter(Boolean).join(" ").trim(),
            role: value("cv-target-role"),
            email: value("cv-email"),
            phone: value("cv-phone"),
            citizenship: value("cv-citizenship"),
            address: value("cv-address"),
            city: value("cv-city"),
            birthDate: value("cv-birth-date"),
            linkedin: value("cv-linkedin"),
            summary: value("cv-summary"),
            languageItems: parseLanguages(),
            certifications: value("cv-certifications"),
            projects: value("cv-projects"),
            achievements: value("cv-achievements"),
            photoFile: (photoInput.files || [])[0] || null,
            experienceItems: parseExperience(),
            educationItems: parseEducation(),
            skillItems: parseSkills(),
            sectionOrder: ["summary", "experience", "education", "skills"],
            template: selectedTemplate,
            cvLang: selectedCvLang,
            atsMode: atsMode
        };
    }

    function buildCvContent(data, lang) {
        var dict = {
            summary: { it: "Profilo professionale", en: "Professional summary", es: "Perfil profesional", fr: "Profil professionnel", de: "Berufsprofil" },
            exp: { it: "Esperienza professionale", en: "Professional experience", es: "Experiencia profesional", fr: "Experience professionnelle", de: "Berufserfahrung" },
            edu: { it: "Formazione", en: "Education", es: "Educacion", fr: "Formation", de: "Ausbildung" },
            skills: { it: "Competenze", en: "Skills", es: "Competencias", fr: "Competences", de: "Kompetenzen" },
            contacts: { it: "Contatti", en: "Contact", es: "Contacto", fr: "Contact", de: "Kontakt" },
            period: { it: "Periodo", en: "Period", es: "Periodo", fr: "Periode", de: "Zeitraum" },
            result: { it: "Risultati", en: "Results", es: "Logros", fr: "Resultats", de: "Ergebnisse" },
            grade: { it: "Voto", en: "Grade", es: "Nota", fr: "Note", de: "Note" }
        };
        var lines = [];
        var contactParts = [data.email, data.phone, data.linkedin].filter(Boolean);
        if (contactParts.length) lines.push(tr(lang, dict.contacts) + ": " + contactParts.join(" | "));
        if (data.birthDate) lines.push(tr(lang, { it: "Data di nascita", en: "Date of birth", es: "Fecha de nacimiento", fr: "Date de naissance", de: "Geburtsdatum" }) + ": " + data.birthDate);
        if (data.citizenship) lines.push(tr(lang, { it: "Cittadinanza", en: "Citizenship", es: "Nacionalidad", fr: "Nationalite", de: "Staatsangehorigkeit" }) + ": " + data.citizenship);
        if (data.address || data.city) lines.push(tr(lang, { it: "Residenza", en: "Residence", es: "Residencia", fr: "Residence", de: "Wohnort" }) + ": " + [data.address, data.city].filter(Boolean).join(" | "));
        lines.push("");

        function pushSection(title) {
            lines.push(title);
            lines.push("=".repeat(title.length));
        }
        function pushSpacer() {
            if (lines.length && lines[lines.length - 1] !== "") lines.push("");
        }

        data.sectionOrder.forEach(function (key) {
            if (key === "summary" && data.summary) {
                pushSection(tr(lang, dict.summary));
                lines.push(data.summary);
                pushSpacer();
                return;
            }
            if (key === "experience" && data.experienceItems.length) {
                pushSection(tr(lang, dict.exp));
                data.experienceItems.forEach(function (x) {
                    var header = [x.role, x.company].filter(Boolean).join(" - ");
                    lines.push((header || "-"));
                    if (x.period) lines.push("  " + tr(lang, dict.period) + ": " + x.period);
                    if (x.result) lines.push("  " + tr(lang, dict.result) + ": " + x.result);
                    lines.push("");
                });
                pushSpacer();
                return;
            }
            if (key === "education" && data.educationItems.length) {
                pushSection(tr(lang, dict.edu));
                data.educationItems.forEach(function (x) {
                    var eduHeader = [x.title, x.school].filter(Boolean).join(" - ");
                    lines.push((eduHeader || "-"));
                    if (x.year) lines.push("  " + x.year);
                    if (x.grade) lines.push("  " + tr(lang, dict.grade) + ": " + x.grade);
                    lines.push("");
                });
                pushSpacer();
                return;
            }
            if (key === "skills" && data.skillItems.length) {
                pushSection(tr(lang, dict.skills));
                data.skillItems.forEach(function (x) {
                    lines.push("- " + x.name + " (" + x.level + ")");
                });
                pushSpacer();
            }
        });

        if (data.languageItems && data.languageItems.length) {
            pushSection(tr(lang, { it: "Lingue", en: "Languages", es: "Idiomas", fr: "Langues", de: "Sprachen" }));
            data.languageItems.forEach(function (x) { lines.push("- " + x.name + " (" + x.level + ")"); });
            pushSpacer();
        }
        if (data.certifications) {
            pushSection(tr(lang, { it: "Certificazioni", en: "Certifications", es: "Certificaciones", fr: "Certifications", de: "Zertifizierungen" }));
            lines.push(data.certifications);
            pushSpacer();
        }
        if (data.projects) {
            pushSection(tr(lang, { it: "Progetti", en: "Projects", es: "Proyectos", fr: "Projets", de: "Projekte" }));
            lines.push(data.projects);
            pushSpacer();
        }
        if (data.achievements) {
            pushSection(tr(lang, { it: "Risultati", en: "Achievements", es: "Logros", fr: "Realisations", de: "Erfolge" }));
            lines.push(data.achievements);
        }

        return {
            text: lines.join("\n"),
            gdprNote: tr(lang, {
                it: "Autorizzo il trattamento dei dati personali contenuti nel mio curriculum vitae in base all'art. 13 GDPR 679/16",
                en: "I authorize the processing of personal data contained in my curriculum vitae according to Art. 13 GDPR 679/16",
                es: "Autorizo el tratamiento de datos personales contenidos en mi curriculum vitae segun el art. 13 GDPR 679/16",
                fr: "J'autorise le traitement des donnees personnelles contenues dans mon CV selon l'art. 13 GDPR 679/16",
                de: "Ich erlaube die Verarbeitung personenbezogener Daten in meinem Lebenslauf gemaess Art. 13 DSGVO 679/16"
            })
        };
    }

    function getLevelLabel(level, lang) {
        var levelMap = {
            base: { it: "base", en: "basic", es: "basico", fr: "debutant", de: "grundlegend" },
            intermedio: { it: "intermedio", en: "intermediate", es: "intermedio", fr: "intermediaire", de: "mittel" },
            avanzato: { it: "avanzato", en: "advanced", es: "avanzado", fr: "avance", de: "fortgeschritten" }
        };
        return tr(lang, levelMap[level] || levelMap.intermedio);
    }

    function renderPreviewAndQuality() {
        var data = collectFormData();
        var isInlineDock = !!(previewDock && previewDock.classList.contains("cv-preview-dock--inline"));
        function tipText(shortIt, shortEn, longIt, longEn) {
            return uiText(isInlineDock ? longIt : shortIt, isInlineDock ? longEn : shortEn);
        }
        var content = buildCvContent(data, selectedCvLang);
        preview.classList.remove("preview-classic", "preview-modern", "preview-minimal");
        preview.classList.add("preview-" + selectedTemplate);
        var previewName = data.fullName || uiText("Nome Cognome", "Name Surname");
        var previewRole = data.role || "";
        var contact = [data.email, data.phone, data.linkedin].filter(Boolean).join(" | ");
        var summary = data.summary || "";
        var exp = data.experienceItems.length
            ? data.experienceItems.map(function (x) { return [x.role, x.company, x.period, x.result].filter(Boolean).join(" - "); }).join("\n")
            : "";
        var edu = data.educationItems.length
            ? data.educationItems.map(function (x) { return [x.title, x.school, x.year, x.grade].filter(Boolean).join(" - "); }).join("\n")
            : "";
        var skills = data.skillItems.length
            ? data.skillItems.map(function (x) { return x.name + " (" + getLevelLabel(x.level, selectedCvLang) + ")"; }).join(", ")
            : "";
        var currentPhotoUrl = getPreviewPhotoUrl(data);
        var photoTag = currentPhotoUrl
            ? '<img class="preview-photo" src="' + escapeAttr(currentPhotoUrl) + '" alt="">'
            : "";
        var previewLabels = {
            summary: { it: "Profilo", en: "Summary", es: "Perfil", fr: "Profil", de: "Profil" },
            experience: { it: "Esperienze", en: "Experience", es: "Experiencia", fr: "Experience", de: "Erfahrung" },
            education: { it: "Formazione", en: "Education", es: "Educacion", fr: "Formation", de: "Ausbildung" },
            skills: { it: "Competenze", en: "Skills", es: "Competencias", fr: "Competences", de: "Kompetenzen" }
        };
        var parts = [];
        if (contact) parts.push('<div class="preview-text">' + escapeHtml(contact) + "</div>");
        if (summary) parts.push('<div class="preview-section"><div class="preview-section-title">' + escapeHtml(tr(selectedCvLang, previewLabels.summary)) + '</div><div class="preview-text">' + escapeHtml(summary) + "</div></div>");
        if (exp) parts.push('<div class="preview-section"><div class="preview-section-title">' + escapeHtml(tr(selectedCvLang, previewLabels.experience)) + '</div><div class="preview-text">' + escapeHtml(exp) + "</div></div>");
        if (edu) parts.push('<div class="preview-section"><div class="preview-section-title">' + escapeHtml(tr(selectedCvLang, previewLabels.education)) + '</div><div class="preview-text">' + escapeHtml(edu) + "</div></div>");
        if (skills) parts.push('<div class="preview-section"><div class="preview-section-title">' + escapeHtml(tr(selectedCvLang, previewLabels.skills)) + '</div><div class="preview-text">' + escapeHtml(skills) + "</div></div>");

        var roleTag = previewRole ? ('<div class="preview-role">' + escapeHtml(previewRole) + "</div>") : "";
        preview.innerHTML =
            '<div class="preview-head"><div><div class="preview-name">' + escapeHtml(previewName) + "</div>" + roleTag + "</div>" + photoTag + "</div>" +
            parts.join("");
        if (previewFull) {
            previewFull.classList.remove("preview-classic", "preview-modern", "preview-minimal");
            previewFull.classList.add("preview-" + selectedTemplate);
            var fullParts = parts.slice();
            if (data.languageItems.length) {
                var languagesText = data.languageItems.map(function (x) { return x.name + " (" + getLevelLabel(x.level, selectedCvLang) + ")"; }).join(", ");
                fullParts.push('<div class="preview-section"><div class="preview-section-title">' + escapeHtml(uiText("Lingue", "Languages")) + '</div><div class="preview-text">' + escapeHtml(languagesText) + "</div></div>");
            }
            if (data.certifications) fullParts.push('<div class="preview-section"><div class="preview-section-title">' + escapeHtml(uiText("Certificazioni", "Certifications")) + '</div><div class="preview-text">' + escapeHtml(data.certifications) + "</div></div>");
            if (data.projects) fullParts.push('<div class="preview-section"><div class="preview-section-title">' + escapeHtml(uiText("Progetti", "Projects")) + '</div><div class="preview-text">' + escapeHtml(data.projects) + "</div></div>");
            if (data.achievements) fullParts.push('<div class="preview-section"><div class="preview-section-title">' + escapeHtml(uiText("Risultati", "Achievements")) + '</div><div class="preview-text">' + escapeHtml(data.achievements) + "</div></div>");
            previewFull.innerHTML =
                '<div class="preview-head"><div><div class="preview-name">' + escapeHtml(previewName) + "</div>" + roleTag + "</div>" + photoTag + "</div>" +
                fullParts.join("");
        }
        var score = 0;
        var tips = [];
        if (hasSeparateFirstAndLastName(data)) score += 10;
        else tips.push(tipText("Nome + cognome.", "Name + surname.", "Inserisci nome e cognome completi.", "Add full name and surname."));
        if (data.role) score += 15; else tips.push(tipText("Ruolo.", "Role.", "Specifica il ruolo target.", "Specify target role."));
        if (data.email) score += 10; else tips.push(tipText("Email.", "Email.", "Inserisci un'email valida.", "Add a valid email."));
        if (data.phone) score += 5; else tips.push(tipText("Telefono.", "Phone.", "Inserisci il numero di telefono.", "Add phone number."));
        if ((data.summary || "").length >= 40) score += 20; else tips.push(tipText("Profilo (40+).", "Summary (40+).", "Scrivi un profilo di almeno 40 caratteri.", "Write a summary with at least 40 characters."));
        if (data.experienceItems.length > 0) score += 15; else tips.push(tipText("Esperienza.", "Experience.", "Aggiungi almeno un'esperienza professionale.", "Add at least one work experience."));
        if (data.educationItems.length > 0) score += 10; else tips.push(tipText("Formazione.", "Education.", "Aggiungi almeno un percorso di formazione.", "Add at least one education entry."));
        if (data.skillItems.length >= 3) score += 10; else tips.push(tipText("3+ competenze.", "3+ skills.", "Inserisci almeno 3 competenze.", "Add at least 3 skills."));
        if (data.languageItems.length > 0) score += 5; else tips.push(tipText("Lingue.", "Languages.", "Aggiungi almeno una lingua.", "Add at least one language."));
        if (score > 100) score = 100;
        lastQualityScore = score;
        var scoreClass = score === 100 ? "good" : "bad";
        quality.innerHTML =
            '<span class="quality-score ' + scoreClass + '">' +
            uiText("Punteggio CV", "CV score") + ": " + score + "/100</span><br>" +
            (tips.length ? tips.join("<br>") : uiText("Ottimo! CV completo.", "Great! CV looks complete."));

        // Save current state for dedicated web preview page (view-only).
        try {
            localStorage.setItem("cv-live-preview-payload-v1", JSON.stringify({
                firstName: data.firstName || "",
                lastName: data.lastName || "",
                role: data.role || "",
                email: data.email || "",
                phone: data.phone || "",
                linkedin: data.linkedin || "",
                summary: data.summary || "",
                experienceItems: data.experienceItems || [],
                educationItems: data.educationItems || [],
                skillItems: data.skillItems || [],
                languageItems: data.languageItems || [],
                certifications: data.certifications || "",
                projects: data.projects || "",
                achievements: data.achievements || "",
                photoDataUrl: previewPhotoUrl || ""
            }));
        } catch (e) { /* localStorage unavailable */ }
    }

    function validateData(data) {
        var emailOk = !data.email || /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.email);
        var phoneOk = !data.phone || /^[+\d][\d\s\-()]{6,}$/.test(data.phone);
        var linkedinOk = !data.linkedin || /^(https?:\/\/)?([\w-]+\.)?linkedin\.com\/.+/i.test(data.linkedin);
        if (!hasSeparateFirstAndLastName(data) || !data.role) {
            return uiText(
                "Generazione bloccata: completa il CV fino a 100/100.",
                "Generation blocked: complete the CV to 100/100."
            );
        }
        if (!emailOk) return uiText("Email non valida.", "Invalid email.");
        if (!phoneOk) return uiText("Telefono non valido.", "Invalid phone.");
        if (!linkedinOk) return uiText("LinkedIn/Portfolio non valido.", "Invalid LinkedIn/Portfolio.");
        if (lastQualityScore < 100) {
            return uiText(
                "Generazione bloccata: punteggio CV " + lastQualityScore + "/100. Completa tutti i campi richiesti per arrivare a 100/100.",
                "Generation blocked: CV score " + lastQualityScore + "/100. Complete all required fields to reach 100/100."
            );
        }
        return "";
    }

    async function readPhotoAsDataUrl(file) {
        return new Promise(function (resolve, reject) {
            if (!file) return resolve(null);
            var reader = new FileReader();
            reader.onload = function (e) { resolve(e.target.result); };
            reader.onerror = reject;
            reader.readAsDataURL(file);
        });
    }

    async function makePdfBlob(data, lang) {
        if (!window.jspdf || !window.jspdf.jsPDF) throw new Error(uiText("Generatore PDF non disponibile.", "PDF generator unavailable."));
        var content = buildCvContent(data, lang);
        var jsPDF = window.jspdf.jsPDF;
        var doc = new jsPDF({ unit: "pt", format: "a4" });
        var left = 44;
        var y = 56;
        var maxWidth = 510;
        var pageWidth = doc.internal.pageSize.getWidth();
        var hasPhoto = !!data.photoFile;
        var headerAccent = selectedTemplate === "modern" ? [0, 123, 255] : selectedTemplate === "minimal" ? [95, 99, 104] : [0, 63, 127];
        var headerInfoLines = [];
        var contactLabel = tr(lang, { it: "Contatti", en: "Contact", es: "Contacto", fr: "Contact", de: "Kontakt" });
        var citizenshipLabel = tr(lang, { it: "Cittadinanza", en: "Citizenship", es: "Nacionalidad", fr: "Nationalite", de: "Staatsangehorigkeit" });
        var residenceLabel = tr(lang, { it: "Residenza", en: "Residence", es: "Residencia", fr: "Residence", de: "Wohnort" });
        var birthLabel = tr(lang, { it: "Data di nascita", en: "Date of birth", es: "Fecha de nacimiento", fr: "Date de naissance", de: "Geburtsdatum" });
        var contactParts = [data.email, data.phone, data.linkedin].filter(Boolean);
        var residenceParts = [data.address, data.city].filter(Boolean);
        if (contactParts.length) headerInfoLines.push(contactLabel + ": " + contactParts.join(" | "));
        if (data.citizenship) headerInfoLines.push(citizenshipLabel + ": " + data.citizenship);
        if (residenceParts.length) headerInfoLines.push(residenceLabel + ": " + residenceParts.join(" | "));
        if (data.birthDate) headerInfoLines.push(birthLabel + ": " + data.birthDate);

        // Template-aware header area, visually aligned with the live preview styles.
        if (selectedTemplate === "modern") {
            doc.setFillColor(245, 251, 255);
            doc.roundedRect(28, 26, pageWidth - 56, 126, 10, 10, "F");
            doc.setDrawColor(headerAccent[0], headerAccent[1], headerAccent[2]);
            doc.setLineWidth(1.2);
            doc.line(44, 142, pageWidth - 44, 142);
        } else if (selectedTemplate === "minimal") {
            doc.setDrawColor(229, 231, 235);
            doc.setLineWidth(0.8);
            doc.line(44, 120, pageWidth - 44, 120);
        }

        if (data.photoFile) {
            var photoData = await readPhotoAsDataUrl(data.photoFile);
            if (photoData) doc.addImage(photoData, "JPEG", 430, 42, 96, 96);
        }
        doc.setFont("helvetica", "bold");
        doc.setTextColor(headerAccent[0], headerAccent[1], headerAccent[2]);
        doc.setFontSize(selectedTemplate === "modern" ? 22 : selectedTemplate === "minimal" ? 16 : 18);
        doc.text(data.fullName || "-", left, y);
        y += selectedTemplate === "modern" ? 24 : 20;
        doc.setFont("helvetica", "normal");
        doc.setTextColor(75, 97, 120);
        doc.setFontSize(selectedTemplate === "minimal" ? 11 : 12);
        doc.text(data.role || "-", left, y);
        y += 18;

        // Personal details aligned on the left side of the photo.
        if (headerInfoLines.length) {
            doc.setTextColor(70, 70, 70);
            doc.setFontSize(10);
            var infoMaxWidth = hasPhoto ? 365 : maxWidth;
            var infoWrapped = doc.splitTextToSize(headerInfoLines.join("\n"), infoMaxWidth);
            doc.text(infoWrapped, left, y);
            y += (infoWrapped.length * 12) + 8;
        }

        var headerBottom = hasPhoto ? 150 : y;
        y = Math.max(y, headerBottom + 12);
        var contentLines = (content.text || "").split("\n");
        if (headerInfoLines.length) {
            while (contentLines.length && !contentLines[0].trim()) contentLines.shift();
            headerInfoLines.forEach(function () {
                if (contentLines.length) contentLines.shift();
            });
            while (contentLines.length && !contentLines[0].trim()) contentLines.shift();
        }

        function ensurePageSpace(requiredHeight) {
            var bottomLimit = doc.internal.pageSize.getHeight() - (data.atsMode ? 26 : 40);
            if (y + requiredHeight <= bottomLimit) return;
            doc.addPage();
            y = 46;
        }

        for (var i = 0; i < contentLines.length; i++) {
            var line = (contentLines[i] || "").trim();
            if (!line) {
                y += 6;
                continue;
            }
            var nextLine = (contentLines[i + 1] || "").trim();
            var isSectionTitle = nextLine && nextLine === "=".repeat(line.length);
            if (isSectionTitle) {
                ensurePageSpace(24);
                doc.setFont("helvetica", "bold");
                doc.setFontSize(13);
                doc.setTextColor(headerAccent[0], headerAccent[1], headerAccent[2]);
                doc.text(line, left, y);
                y += 5;
                doc.setDrawColor(headerAccent[0], headerAccent[1], headerAccent[2]);
                doc.setLineWidth(0.7);
                doc.line(left, y, Math.min(left + 190, pageWidth - 44), y);
                y += 12;
                i += 1; // Skip underline marker line made of "=".
                continue;
            }

            var textColor = [34, 34, 34];
            var fontName = "helvetica";
            var fontWeight = "normal";
            var fontSize = 11;
            var lineIndent = 0;
            if (line.indexOf("- ") === 0) {
                lineIndent = 8;
            } else if (line.indexOf("  ") === 0) {
                lineIndent = 10;
                fontSize = 10.5;
                textColor = [75, 97, 120];
            } else if (line.indexOf(" - ") > 0) {
                fontWeight = "bold";
            }

            var textWidth = Math.max(120, maxWidth - lineIndent);
            var wrapped = doc.splitTextToSize(line, textWidth);
            ensurePageSpace(Math.max(14, wrapped.length * 13));
            doc.setFont(fontName, fontWeight);
            doc.setFontSize(fontSize);
            doc.setTextColor(textColor[0], textColor[1], textColor[2]);
            doc.text(wrapped, left + lineIndent, y);
            y += (wrapped.length * 12) + 2;
        }

        if (!data.atsMode) {
            doc.setFontSize(9);
            doc.setTextColor(80, 80, 80);
            doc.text(doc.splitTextToSize(content.gdprNote, 510), left, doc.internal.pageSize.getHeight() - 26);
            doc.setTextColor(0, 0, 0);
        }
        return doc.output("blob");
    }

    async function makeDocxBlob(data, lang) {
        if (!window.docx) throw new Error(uiText("Generatore Word non disponibile.", "Word generator unavailable."));
        var content = buildCvContent(data, lang);
        var d = window.docx;
        var children = [new d.Paragraph({ text: data.fullName || "-", heading: d.HeadingLevel.TITLE }), new d.Paragraph({ text: data.role || "-", spacing: { after: 180 } })];
        content.text.split("\n").forEach(function (line) { children.push(new d.Paragraph({ text: line || " " })); });
        if (!data.atsMode) children.push(new d.Paragraph({ text: content.gdprNote, style: "gdprNote" }));
        var doc = new d.Document({ styles: { paragraphStyles: [{ id: "gdprNote", name: "GDPR", run: { color: "555555", size: 18 } }] }, sections: [{ children: children }] });
        return d.Packer.toBlob(doc);
    }

    function makeTxtBlob(data, lang) {
        var content = buildCvContent(data, lang);
        return new Blob([data.fullName + "\n" + data.role + "\n\n" + content.text + (data.atsMode ? "" : ("\n\n" + content.gdprNote))], { type: "text/plain;charset=utf-8" });
    }

    async function buildExportBlob(data, lang, format) {
        if (format === "pdf") return makePdfBlob(data, lang);
        if (format === "docx") return makeDocxBlob(data, lang);
        return makeTxtBlob(data, lang);
    }

    function saveDraft() {
        var draft = { meta: { template: selectedTemplate, lang: selectedCvLang, ats: atsMode }, fields: {}, experienceItems: parseExperience(), educationItems: parseEducation(), skillItems: parseSkills(), languageItems: parseLanguages() };
        fieldIds.forEach(function (id) { var el = document.getElementById(id); if (el) draft.fields[id] = el.value || ""; });
        localStorage.setItem(storageKey, JSON.stringify(draft));
    }
    function loadDraft() {
        var raw = localStorage.getItem(storageKey);
        if (!raw) return;
        try {
            var d = JSON.parse(raw);
            fieldIds.forEach(function (id) { var el = document.getElementById(id); if (el && d.fields && typeof d.fields[id] === "string") el.value = d.fields[id]; });
            if (d.meta) { setTemplate(d.meta.template || "classic"); setCvLang(d.meta.lang || "it"); atsMode = !!d.meta.ats; }
            updateAtsButtonState();
            experienceList.innerHTML = ""; (d.experienceItems || []).forEach(function (x) { experienceList.appendChild(createExperienceItem(x)); });
            educationList.innerHTML = ""; (d.educationItems || []).forEach(function (x) { educationList.appendChild(createEducationItem(x)); });
            skillList.innerHTML = ""; (d.skillItems || []).forEach(function (x) { skillList.appendChild(createSkillItem(x)); });
            languageList.innerHTML = ""; (d.languageItems || []).forEach(function (x) { languageList.appendChild(createLanguageItem(x)); });
        } catch (e) { localStorage.removeItem(storageKey); }
    }

    function initCustomTargetRoleSelect() {
        if (!targetRoleWrap) return;
        var roleInput = document.getElementById("cv-target-role");
        var roleArrow = targetRoleWrap.querySelector(".role-arrow");
        var options = Array.prototype.slice.call(targetRoleWrap.querySelectorAll(".text-tool-select-menu li[data-value]"));
        if (!roleInput || !options.length) return;
        roleInput.addEventListener("focus", function () { targetRoleWrap.classList.add("open"); });
        roleInput.addEventListener("click", function () { targetRoleWrap.classList.toggle("open"); });
        roleInput.addEventListener("input", onDataChanged);
        if (roleArrow) roleArrow.addEventListener("click", function (e) { e.preventDefault(); e.stopPropagation(); targetRoleWrap.classList.toggle("open"); roleInput.focus(); });
        options.forEach(function (li) {
            li.addEventListener("click", function () {
                roleInput.value = li.getAttribute("data-value");
                targetRoleWrap.classList.remove("open");
                onDataChanged();
            });
        });
        document.addEventListener("click", function (e) { if (!targetRoleWrap.contains(e.target)) targetRoleWrap.classList.remove("open"); });
    }

    function initBirthDateMask() {
        if (!birthDateInput) return;
        var deleting = false; var lastValid = birthDateInput.value || "";
        birthDateInput.addEventListener("keydown", function (e) { deleting = e.key === "Backspace" || e.key === "Delete"; });
        birthDateInput.addEventListener("input", function () {
            var digits = (birthDateInput.value || "").replace(/\D/g, "").slice(0, 8);
            var day = digits.slice(0, 2), month = digits.slice(2, 4), year = digits.slice(4, 8), formatted = "";
            if (day.length === 2 && (parseInt(day, 10) < 1 || parseInt(day, 10) > 31)) { birthDateInput.value = lastValid; deleting = false; return; }
            if (month.length === 2 && (parseInt(month, 10) < 1 || parseInt(month, 10) > 12)) { birthDateInput.value = lastValid; deleting = false; return; }
            if (year.length === 4 && parseInt(year, 10) > new Date().getFullYear()) { birthDateInput.value = lastValid; deleting = false; return; }
            if (digits.length <= 2) { formatted = digits; if (digits.length === 2 && !deleting) formatted += "/"; }
            else if (digits.length <= 4) { formatted = digits.slice(0, 2) + "/" + digits.slice(2); if (digits.length === 4 && !deleting) formatted += "/"; }
            else formatted = digits.slice(0, 2) + "/" + digits.slice(2, 4) + "/" + digits.slice(4);
            birthDateInput.value = formatted; lastValid = formatted; deleting = false; onDataChanged();
        });
    }


    function exportDraftJson() {
        saveDraft();
        var raw = localStorage.getItem(storageKey) || "{}";
        downloadBlob(new Blob([raw], { type: "application/json" }), "cv_draft.json");
    }
    async function importDraftJson() {
        var file = (importDraftInput.files || [])[0];
        if (!file) return;
        var raw = await file.text();
        localStorage.setItem(storageKey, raw);
        loadDraft();
        onDataChanged();
        show(uiText("Bozza importata.", "Draft imported."), false);
    }

    function onDataChanged() {
        saveDraft();
        renderPreviewAndQuality();
    }

    function setDefaultRepeaters() {
        if (!experienceList.children.length) experienceList.appendChild(createExperienceItem());
        if (!educationList.children.length) educationList.appendChild(createEducationItem());
        if (!skillList.children.length) skillList.appendChild(createSkillItem());
        if (!languageList.children.length) languageList.appendChild(createLanguageItem());
    }

    if (photoInput && photoLabel) {
        var defaultChooseText = uiText("Scegli file", "Choose file");
        photoLabel.textContent = defaultChooseText;
    }
    if (photoInput) {
        photoInput.addEventListener("change", function () {
            var f = (photoInput.files || [])[0];
            if (photoLabel) {
                var defaultChooseText = uiText("Scegli file", "Choose file");
                photoLabel.textContent = f ? f.name : defaultChooseText;
            }
            revokePreviewPhotoObjectUrl();
            if (previewPhotoUrl && previewPhotoUrl.indexOf("blob:") === 0) {
                try {
                    URL.revokeObjectURL(previewPhotoUrl);
                } catch (e) { /* ignore */ }
            }
            previewPhotoUrl = null;
            if (!f) {
                onDataChanged();
                return;
            }
            var reader = new FileReader();
            reader.onload = function (e) {
                previewPhotoUrl = (e.target && e.target.result) ? String(e.target.result) : null;
                onDataChanged();
            };
            reader.onerror = function () {
                onDataChanged();
            };
            reader.readAsDataURL(f);
        });
    }

    addExperienceBtn.addEventListener("click", function () { experienceList.appendChild(createExperienceItem()); onDataChanged(); });
    addEducationBtn.addEventListener("click", function () { educationList.appendChild(createEducationItem()); onDataChanged(); });
    addSkillBtn.addEventListener("click", function () { skillList.appendChild(createSkillItem()); onDataChanged(); });
    addLanguageBtn.addEventListener("click", function () { languageList.appendChild(createLanguageItem()); onDataChanged(); });
    formatToggleButtons.forEach(function (button) { button.addEventListener("click", function () { setExportFormat(button.getAttribute("data-format") || "pdf"); onDataChanged(); }); });
    templateButtons.forEach(function (button) { button.addEventListener("click", function () { setTemplate(button.getAttribute("data-template")); onDataChanged(); }); });
    cvLangButtons.forEach(function (button) { button.addEventListener("click", function () { setCvLang(button.getAttribute("data-cv-lang")); onDataChanged(); }); });
    atsBtn.addEventListener("click", function () { atsMode = !atsMode; updateAtsButtonState(); onDataChanged(); });
    exportDraftBtn.addEventListener("click", exportDraftJson);
    importDraftBtn.addEventListener("click", function () { importDraftInput.click(); });
    importDraftInput.addEventListener("change", importDraftJson);

    fieldIds.forEach(function (id) {
        var el = document.getElementById(id);
        if (!el) return;
        el.addEventListener("input", onDataChanged);
        el.addEventListener("change", onDataChanged);
    });
    ["cv-full-name", "cv-last-name"].forEach(function (id) {
        var el = document.getElementById(id);
        if (!el) return;
        el.addEventListener("keyup", onDataChanged);
    });
    if (openFullPreviewLink && previewModal) {
        openFullPreviewLink.addEventListener("click", function (e) {
            e.preventDefault();
            renderPreviewAndQuality();
            previewModal.classList.add("is-open");
            previewModal.setAttribute("aria-hidden", "false");
            document.body.style.overflow = "hidden";
        });
    }
    if (previewModalClose && previewModal) {
        previewModalClose.addEventListener("click", function () {
            previewModal.classList.remove("is-open");
            previewModal.setAttribute("aria-hidden", "true");
            document.body.style.overflow = "";
        });
    }
    if (previewModal) {
        previewModal.addEventListener("click", function (e) {
            if (e.target !== previewModal) return;
            previewModal.classList.remove("is-open");
            previewModal.setAttribute("aria-hidden", "true");
            document.body.style.overflow = "";
        });
        document.addEventListener("keydown", function (e) {
            if (e.key !== "Escape") return;
            if (!previewModal.classList.contains("is-open")) return;
            previewModal.classList.remove("is-open");
            previewModal.setAttribute("aria-hidden", "true");
            document.body.style.overflow = "";
        });
    }
    if (previewDock && typeof MutationObserver !== "undefined") {
        var dockObserver = new MutationObserver(function () {
            renderPreviewAndQuality();
        });
        dockObserver.observe(previewDock, { attributes: true, attributeFilter: ["class"] });
    }

    loadDraft();
    initCustomTargetRoleSelect();
    initBirthDateMask();
    setDefaultRepeaters();
    setExportFormat((exportFormatSelect && exportFormatSelect.value) || "pdf");
    updateAtsButtonState();
    onDataChanged();

    btnGenerate.addEventListener("click", function () {
        var data = collectFormData();
        var validationError = validateData(data);
        if (validationError) {
            show(validationError, true);
            btnDownload.classList.add("hidden");
            isReadyToDownload = false;
            return;
        }
        var format = value("cv-export-format") || "pdf";
        var fileName = buildOutputName(data.firstName, data.lastName, selectedCvLang, format);
        showFileReady(fileName);
        btnDownload.classList.remove("hidden");
        isReadyToDownload = true;
    });

    async function handleDownload() {
        var data = collectFormData();
        var validationError = validateData(data);
        if (validationError) return show(validationError, true);
        var format = value("cv-export-format") || "pdf";
        var outputName = buildOutputName(data.firstName, data.lastName, selectedCvLang, format);
        try {
            var blob = await buildExportBlob(data, selectedCvLang, format);
            downloadBlob(blob, outputName);
            showFileReady(outputName);
        } catch (e) {
            show(e && e.message ? e.message : uiText("Errore durante l'esportazione del CV.", "Error while exporting the CV."), true);
        }
    }

    btnDownload.addEventListener("click", handleDownload);
});
