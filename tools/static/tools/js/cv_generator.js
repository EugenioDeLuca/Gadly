(function () {
    function boot() {
    function releaseCvBootShield() {
        try {
            document.documentElement.classList.remove("cv-gen-boot");
            document.documentElement.classList.remove("cv-gen-boot-pending");
        } catch (eBoot) { /* ignore */ }
        if (typeof window.__gadlyPlaceCvPreviewDock === "function") {
            try {
                window.__gadlyPlaceCvPreviewDock(true);
            } catch (eDockBoot) { /* ignore */ }
        }
    }

    function syncCvBootHtmlAttrs() {
        var root = document.documentElement;
        root.setAttribute("data-cv-boot-template", selectedTemplate);
        root.setAttribute("data-cv-boot-lang", selectedCvLang);
        root.setAttribute("data-cv-boot-ats", atsMode ? "1" : "0");
    }

    function applyCvSetupFromHtmlBoot() {
        var root = document.documentElement;
        var tpl = root.getAttribute("data-cv-boot-template");
        var lang = root.getAttribute("data-cv-boot-lang");
        var ats = root.getAttribute("data-cv-boot-ats");
        if (isCvTemplate(tpl)) {
            setTemplate(tpl);
        } else {
            setTemplate("classic");
        }
        if (lang === "it" || lang === "en" || lang === "es" || lang === "fr" || lang === "de") {
            setCvLang(lang);
        } else {
            setCvLang("it");
        }
        atsMode = ats === "1";
        updateAtsButtonState();
    }

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
    var CV_TEMPLATE_IDS = { classic: 1, modern: 1, minimal: 1, european: 1 };

    function isCvTemplate(id) {
        return !!CV_TEMPLATE_IDS[id];
    }
    var selectedCvLang = "it";
    var atsMode = false;
    var lastQualityScore = 0;
    try {
        var bootScoreRaw = document.documentElement.getAttribute("data-cv-boot-score");
        if (bootScoreRaw !== null && bootScoreRaw !== "") {
            var bootScoreNum = parseInt(bootScoreRaw, 10);
            if (!isNaN(bootScoreNum)) {
                lastQualityScore = Math.max(0, Math.min(100, bootScoreNum));
            }
        }
    } catch (eBootScoreInit) { /* ignore */ }
    var previewPhotoUrl = null;
    var previewPhotoObjectUrl = null;
    /* Cerchietto punteggio solo su telefono; tablet/desktop usano #cv-quality nel dock/form. */
    var CV_SCORE_TAB_BP = 768;
    var scoreTabRoot = document.getElementById("cv-score-tab");
    var scoreTabBtn = document.getElementById("cv-score-tab-btn");
    var scoreTabValueEl = document.getElementById("cv-score-tab-value");
    var scoreTabPanel = document.getElementById("cv-score-tab-panel");
    var scoreTabPanelBody = document.getElementById("cv-score-tab-panel-body");
    var scoreTabBackdrop = document.getElementById("cv-score-tab-backdrop");
    var scoreTabClose = document.getElementById("cv-score-tab-close");
    var scoreTabOpen = false;
    var lastScorePanelHtml = "";
    var scoreTabScrollLockY = 0;
    var scoreTabTouchMoveBlocker = null;
    var SCORE_TAB_PENDING_CLASS = "cv-score-tab--layout-pending";
    var SCORE_TAB_READY_CLASS = "cv-score-tab--ready";

    function isCvScoreTabViewport() {
        return window.innerWidth <= CV_SCORE_TAB_BP;
    }
    function isMobileLightCvMode() {
        return isCvScoreTabViewport() && !document.body.classList.contains("dark-mode");
    }
    function enforceDesktopNotesColor() {
        var desktop = window.innerWidth >= 769;
        var notes = document.querySelectorAll(".ats-note, .photo-note");
        notes.forEach(function (el) {
            if (!el || !el.style) return;
            if (desktop) {
                el.style.setProperty("color", "#555", "important");
                el.style.setProperty("-webkit-text-fill-color", "#555", "important");
            } else {
                el.style.removeProperty("color");
                el.style.removeProperty("-webkit-text-fill-color");
            }
        });
    }
    function enforceDesktopKitHoverVisual() {
        if (window.innerWidth < 769) return;
        var kitButtons = document.querySelectorAll(".career-kit-flow__kit");
        kitButtons.forEach(function (btn) {
            if (!btn || btn.getAttribute("data-ck-hover-bound") === "1") return;
            btn.setAttribute("data-ck-hover-bound", "1");
            btn.addEventListener("mouseenter", function () {
                btn.style.setProperty("background", "#d0e8f9", "important");
                btn.style.setProperty("background-color", "#d0e8f9", "important");
                btn.style.setProperty("border", "2px solid #003f7f", "important");
                btn.style.setProperty("color", "#003f7f", "important");
                btn.style.setProperty("-webkit-text-fill-color", "#003f7f", "important");
                btn.style.setProperty("transform", "scale(1.03)", "important");
                btn.style.setProperty("box-shadow", "0 4px 12px rgba(0, 63, 127, 0.12)", "important");
                btn.style.setProperty("transition", "transform 0.16s ease, background 0.2s, border-color 0.2s, box-shadow 0.16s ease", "important");
            });
            btn.addEventListener("mouseleave", function () {
                btn.style.removeProperty("background");
                btn.style.removeProperty("background-color");
                btn.style.removeProperty("border");
                btn.style.removeProperty("color");
                btn.style.removeProperty("-webkit-text-fill-color");
                btn.style.removeProperty("transform");
                btn.style.removeProperty("box-shadow");
                btn.style.removeProperty("transition");
            });
        });

        var nextButtons = document.querySelectorAll(".career-kit-flow__next");
        nextButtons.forEach(function (btn) {
            if (!btn || btn.getAttribute("data-ck-next-hover-bound") === "1") return;
            btn.setAttribute("data-ck-next-hover-bound", "1");
            btn.addEventListener("mouseenter", function () {
                btn.style.setProperty("background", "#0056b3", "important");
                btn.style.setProperty("background-color", "#0056b3", "important");
                btn.style.setProperty("border", "2px solid #0056b3", "important");
                btn.style.setProperty("color", "#fff", "important");
                btn.style.setProperty("-webkit-text-fill-color", "#fff", "important");
                btn.style.setProperty("transform", "scale(1.03)", "important");
                btn.style.setProperty("box-shadow", "0 4px 12px rgba(0, 63, 127, 0.18)", "important");
                btn.style.setProperty("transition", "transform 0.16s ease, background 0.2s, border-color 0.2s, box-shadow 0.16s ease", "important");
            });
            btn.addEventListener("mouseleave", function () {
                btn.style.removeProperty("background");
                btn.style.removeProperty("background-color");
                btn.style.removeProperty("border");
                btn.style.removeProperty("color");
                btn.style.removeProperty("-webkit-text-fill-color");
                btn.style.removeProperty("transform");
                btn.style.removeProperty("box-shadow");
                btn.style.removeProperty("transition");
            });
        });
    }
    function applyCvViewportMode() {
        var mobile = isCvScoreTabViewport();
        var light = !document.body.classList.contains("dark-mode");
        document.documentElement.classList.toggle("cv-gen-mobile-score", mobile);
        document.documentElement.classList.toggle("cv-gen-mobile-light", mobile && light);
        enforceDesktopNotesColor();
        enforceDesktopKitHoverVisual();
        ensureSetupPanelActiveState();
        ensureSkillLevelActiveState();
        fitAllExpDescriptions();
        syncMobileDarkRemoveBtnVisual();
    }
    function mountScoreTabOverlay() {
        if (!isCvScoreTabViewport()) return;
        if (scoreTabRoot && scoreTabRoot.parentNode !== document.body) {
            document.body.appendChild(scoreTabRoot);
        }
        if (scoreTabBackdrop && scoreTabBackdrop.parentNode !== document.body) {
            document.body.appendChild(scoreTabBackdrop);
        }
        if (scoreTabPanel && scoreTabPanel.parentNode !== document.body) {
            document.body.appendChild(scoreTabPanel);
        }
    }
    function unlockScoreTabPageScroll() {
        document.documentElement.classList.remove("cv-score-tab-open");
        document.body.classList.remove("cv-score-tab-open");
        window.scrollTo(0, scoreTabScrollLockY);
    }
    function lockScoreTabPageScroll() {
        scoreTabScrollLockY = window.scrollY || window.pageYOffset || 0;
        document.documentElement.classList.add("cv-score-tab-open");
        document.body.classList.add("cv-score-tab-open");
    }
    function isScoreTabTouchScrollAllowed(target) {
        if (!target) return false;
        return !!(scoreTabPanel && scoreTabPanel.contains(target));
    }
    function installScoreTabTouchScrollBlock() {
        if (scoreTabTouchMoveBlocker) return;
        scoreTabTouchMoveBlocker = function (event) {
            if (!scoreTabOpen) return;
            if (isScoreTabTouchScrollAllowed(event.target)) return;
            event.preventDefault();
        };
        document.addEventListener("touchmove", scoreTabTouchMoveBlocker, { passive: false });
    }
    function closeScoreTabPanel() {
        if (!scoreTabOpen) return;
        scoreTabOpen = false;
        unlockScoreTabPageScroll();
        if (scoreTabBtn) scoreTabBtn.setAttribute("aria-expanded", "false");
        if (scoreTabPanel) {
            scoreTabPanel.setAttribute("aria-hidden", "true");
            scoreTabPanel.hidden = true;
        }
        if (scoreTabBackdrop) {
            scoreTabBackdrop.setAttribute("aria-hidden", "true");
            scoreTabBackdrop.hidden = true;
        }
    }
    function openScoreTabPanel() {
        if (!scoreTabRoot || !isCvScoreTabViewport()) return;
        mountScoreTabOverlay();
        refreshScoreTabPanelFromForm();
        scoreTabOpen = true;
        lockScoreTabPageScroll();
        if (scoreTabBtn) scoreTabBtn.setAttribute("aria-expanded", "true");
        if (scoreTabPanel) {
            scoreTabPanel.hidden = false;
            scoreTabPanel.setAttribute("aria-hidden", "false");
        }
        if (scoreTabBackdrop) {
            scoreTabBackdrop.hidden = false;
            scoreTabBackdrop.setAttribute("aria-hidden", "false");
        }
    }
    function toggleScoreTabPanel() {
        if (scoreTabOpen) closeScoreTabPanel();
        else openScoreTabPanel();
    }
    function revealScoreTab() {
        if (!scoreTabRoot || !isCvScoreTabViewport()) return;
        scoreTabRoot.classList.remove(SCORE_TAB_PENDING_CLASS);
        scoreTabRoot.classList.add(SCORE_TAB_READY_CLASS);
        scoreTabRoot.hidden = false;
        scoreTabRoot.removeAttribute("hidden");
        scoreTabRoot.setAttribute("aria-hidden", "false");
    }
    function syncScoreTabVisibility() {
        applyCvViewportMode();
        var show = isCvScoreTabViewport();
        if (!show) {
            closeScoreTabPanel();
            if (scoreTabBackdrop) scoreTabBackdrop.hidden = true;
            if (scoreTabPanel) scoreTabPanel.hidden = true;
            if (scoreTabRoot) {
                scoreTabRoot.hidden = true;
                scoreTabRoot.setAttribute("aria-hidden", "true");
            }
            return;
        }
        mountScoreTabOverlay();
        revealScoreTab();
    }
    function syncScoreTabContent(score, panelHtml) {
        if (!isCvScoreTabViewport()) return;
        if (!scoreTabValueEl) return;
        scoreTabValueEl.textContent = String(score);
        if (scoreTabBtn) {
            scoreTabBtn.classList.toggle("is-complete", score === 100);
            scoreTabBtn.classList.toggle("is-incomplete", score !== 100);
        }
        try {
            document.documentElement.setAttribute("data-cv-boot-score", String(score));
        } catch (eScoreAttr) { /* ignore */ }
        if (panelHtml) lastScorePanelHtml = panelHtml;
        if (scoreTabPanelBody && lastScorePanelHtml && scoreTabOpen) {
            scoreTabPanelBody.innerHTML = lastScorePanelHtml;
        }
    }
    function refreshScoreTabPanelFromForm() {
        if (!scoreTabPanelBody) return;
        var breakdown = buildCvScoreBreakdown(collectFormData());
        lastScorePanelHtml = renderScoreChecklistHtml(breakdown, true);
        scoreTabPanelBody.innerHTML = lastScorePanelHtml;
    }
    var CV_REPEAT_LIST_ADD_BTN = {
        "cv-experience-list": "cv-add-experience",
        "cv-education-list": "cv-add-education",
        "cv-skill-list": "cv-add-skill",
        "cv-language-list": "cv-add-language"
    };
    function resolveNameJumpFieldIds(data) {
        var f = (data.firstName || "").trim();
        var l = (data.lastName || "").trim();
        var fTokens = f.split(/\s+/).filter(Boolean);
        if (fTokens.length >= 2 && l.length < 2) {
            return ["cv-last-name"];
        }
        var nomeCompilato = f.length >= 2;
        var cognomeCompilato = l.length >= 2;
        if (nomeCompilato && !cognomeCompilato) {
            return ["cv-last-name"];
        }
        if (cognomeCompilato && !nomeCompilato) {
            return ["cv-full-name"];
        }
        if (!nomeCompilato && !cognomeCompilato) {
            return ["cv-full-name", "cv-last-name"];
        }
        return ["cv-full-name"];
    }
    function scoreJumpFieldAlreadyInView(scrollEl) {
        if (!scrollEl || typeof scrollEl.getBoundingClientRect !== "function") {
            return true;
        }
        var rect = scrollEl.getBoundingClientRect();
        var vh = window.innerHeight || document.documentElement.clientHeight || 800;
        if (rect.bottom <= 0 || rect.top >= vh) {
            return false;
        }
        var centerY = (rect.top + rect.bottom) / 2;
        var pad = Math.min(80, vh * 0.1);
        if (rect.top >= pad && rect.bottom <= vh - pad) {
            return true;
        }
        if (centerY >= vh * 0.22 && centerY <= vh * 0.78) {
            return true;
        }
        return false;
    }
    function estimateScoreJumpFlashDelayMs(scrollEl) {
        if (scoreJumpFieldAlreadyInView(scrollEl)) {
            return 380;
        }
        if (!scrollEl || typeof scrollEl.getBoundingClientRect !== "function") {
            return 520;
        }
        var rect = scrollEl.getBoundingClientRect();
        var vh = window.innerHeight || document.documentElement.clientHeight || 800;
        var centerY = (rect.top + rect.bottom) / 2;
        var offCenter = Math.abs(centerY - vh / 2);
        if (rect.bottom < 0 || centerY < 0) {
            return 1280;
        }
        if (rect.top > vh) {
            return 1100;
        }
        if (offCenter > vh * 0.85) {
            return 1000;
        }
        if (offCenter > vh * 0.6) {
            return 820;
        }
        if (offCenter > vh * 0.35) {
            return 640;
        }
        return 480;
    }
    function scheduleFlashAfterScoreJumpScroll(scrollEl, flashIds) {
        var fields = [];
        flashIds.forEach(function (fieldId) {
            var field = resolveFocusElForScoreJump(fieldId);
            if (field) {
                fields.push(field);
            }
        });
        if (!fields.length) {
            return;
        }
        function runFlash() {
            fields.forEach(function (field) {
                flashCvFormField(field);
            });
        }
        if (scoreJumpFieldAlreadyInView(scrollEl)) {
            window.setTimeout(runFlash, 400);
            return;
        }
        var fallbackMs = estimateScoreJumpFlashDelayMs(scrollEl);
        var done = false;
        function complete() {
            if (done) {
                return;
            }
            done = true;
            window.setTimeout(runFlash, 120);
        }
        if (typeof window.addEventListener === "function") {
            var onScrollEnd = function () {
                window.removeEventListener("scrollend", onScrollEnd);
                complete();
            };
            try {
                window.addEventListener("scrollend", onScrollEnd, { passive: true });
            } catch (eScrollEnd) { /* ignore */ }
        }
        window.setTimeout(complete, fallbackMs + 180);
    }
    function resolveFocusElForScoreJump(targetId) {
        var el = document.getElementById(targetId);
        if (!el) return null;
        if (el.classList && el.classList.contains("repeat-list")) {
            var inner = el.querySelector(
                "input:not([type='file']):not([type='hidden']), textarea, select, .lang-level-select .text-tool-select-trigger, .text-tool-select-trigger"
            );
            if (inner) return inner;
            var addId = CV_REPEAT_LIST_ADD_BTN[targetId];
            if (addId) return document.getElementById(addId);
        }
        return el;
    }
    function isCvJumpFlashField(el) {
        if (!el || !el.tagName) return false;
        var tag = el.tagName.toLowerCase();
        if (tag === "textarea" || tag === "select") return true;
        if (tag === "input") {
            var type = (el.getAttribute("type") || "text").toLowerCase();
            return type !== "file" && type !== "hidden";
        }
        return el.classList && el.classList.contains("text-tool-select-trigger");
    }
    function flashCvFormField(fieldEl) {
        if (!isCvJumpFlashField(fieldEl)) return;
        var dark = document.body.classList.contains("dark-mode");
        var flashBorder = dark ? "#ef4444" : "#dc2626";
        var flashRing = dark
            ? "0 0 0 2px #ef4444, 0 0 0 4px rgba(239, 68, 68, 0.45), 0 0 12px rgba(248, 113, 113, 0.85)"
            : "0 0 0 2px #dc2626, 0 0 0 4px rgba(220, 38, 38, 0.35), 0 0 12px rgba(220, 38, 38, 0.7)";
        var pulses = 0;
        var maxPulses = 2;
        var onMs = 260;
        var offMs = 200;
        function setFlash(active) {
            if (active) {
                /* Bordo + alone (box-shadow non sposta il testo interno). */
                fieldEl.style.setProperty("border-color", flashBorder, "important");
                fieldEl.style.setProperty("box-shadow", flashRing, "important");
            } else {
                fieldEl.style.removeProperty("border-color");
                fieldEl.style.removeProperty("box-shadow");
            }
        }
        function runPulse() {
            if (pulses >= maxPulses) {
                setFlash(false);
                return;
            }
            setFlash(true);
            window.setTimeout(function () {
                setFlash(false);
                pulses += 1;
                window.setTimeout(runPulse, offMs);
            }, onMs);
        }
        setFlash(false);
        runPulse();
    }
    function scrollToCvFieldFromScoreTab(targetId) {
        if (!targetId) return;
        closeScoreTabPanel();
        var data = collectFormData();
        var flashIds;
        var scrollId;
        if (targetId === "name") {
            flashIds = resolveNameJumpFieldIds(data);
            scrollId = flashIds[0] || "cv-full-name";
        } else {
            flashIds = [targetId];
            scrollId = targetId;
        }
        var scrollAnchor = document.getElementById(scrollId);
        if (!scrollAnchor) return;
        var el = resolveFocusElForScoreJump(scrollId) || scrollAnchor;
        var scrollEl = scrollAnchor.closest(".form-group") || scrollAnchor;
        window.requestAnimationFrame(function () {
            window.requestAnimationFrame(function () {
                try {
                    scrollEl.scrollIntoView({ behavior: "smooth", block: "center" });
                } catch (eScroll) {
                    scrollEl.scrollIntoView();
                }
                try {
                    el.focus({ preventScroll: true });
                } catch (eFocus) {
                    try {
                        el.focus();
                    } catch (eFocus2) { /* ignore */ }
                }
                scheduleFlashAfterScoreJumpScroll(scrollEl, flashIds);
            });
        });
    }
    function onScoreChecklistJumpActivate(event) {
        var row = event.target && event.target.closest ? event.target.closest("[data-cv-scroll-target]") : null;
        if (!row || !scoreTabPanelBody || !scoreTabPanelBody.contains(row)) return;
        var targetId = row.getAttribute("data-cv-scroll-target");
        if (!targetId) return;
        event.preventDefault();
        scrollToCvFieldFromScoreTab(targetId);
    }
    function initScoreTabControls() {
        if (!scoreTabRoot || !scoreTabBtn) return;
        mountScoreTabOverlay();
        installScoreTabTouchScrollBlock();
        scoreTabBtn.addEventListener("click", function () {
            toggleScoreTabPanel();
        });
        if (scoreTabClose) {
            scoreTabClose.addEventListener("click", function () {
                closeScoreTabPanel();
            });
        }
        if (scoreTabBackdrop) {
            scoreTabBackdrop.addEventListener("click", function () {
                closeScoreTabPanel();
            });
        }
        if (scoreTabPanelBody) {
            scoreTabPanelBody.addEventListener("click", onScoreChecklistJumpActivate);
            scoreTabPanelBody.addEventListener("keydown", function (event) {
                if (event.key !== "Enter" && event.key !== " ") return;
                var row = event.target && event.target.closest ? event.target.closest("[data-cv-scroll-target]") : null;
                if (!row) return;
                event.preventDefault();
                onScoreChecklistJumpActivate(event);
            });
        }
        document.addEventListener("keydown", function (event) {
            if (event.key === "Escape") closeScoreTabPanel();
        });
        window.addEventListener("resize", syncScoreTabVisibility);
        applyCvViewportMode();
        syncScoreTabVisibility();
    }
    var repeatLists = [experienceList, educationList, skillList, languageList];

    window.__gadlyCvGeneratorRecover = function () {
        emergencyRevealCvRepeatLists();
        if (typeof window.__gadlyPlaceCvPreviewDock === "function") {
            try {
                window.__gadlyPlaceCvPreviewDock(true);
            } catch (eDockStub) { /* ignore */ }
        }
    };

    function lockRepeatersHidden() {
        repeatLists.forEach(function (el) {
            if (!el) return;
            el.classList.remove("cv-repeat-list--ready");
            el.style.setProperty("opacity", "0", "important");
            el.style.setProperty("clip-path", "inset(50% 50% 50% 50%)", "important");
            el.style.setProperty("pointer-events", "none", "important");
        });
    }
    function finishCvRepeaterReveal() {
        repeatLists.forEach(function (el) {
            if (!el) return;
            el.classList.add("cv-repeat-list--ready");
            el.style.cssText = "";
        });
    }
    function scheduleCvRepeaterReveal() {
        repeatLists.forEach(function (el) {
            if (el) void el.offsetHeight;
        });
        fitAllExpDescriptions();
        finishCvRepeaterReveal();
    }

    if (window.pdfjsLib && window.pdfjsLib.GlobalWorkerOptions) {
        window.pdfjsLib.GlobalWorkerOptions.workerSrc = "https://cdnjs.cloudflare.com/ajax/libs/pdf.js/4.4.168/pdf.worker.min.js";
    }

    var fieldIds = [
        "cv-full-name", "cv-last-name", "cv-birth-date", "cv-target-role", "cv-email", "cv-phone",
        "cv-citizenship", "cv-address", "cv-city", "cv-linkedin", "cv-summary",
        "cv-certifications", "cv-projects", "cv-achievements", "cv-export-format"
    ];

    function uiText(it, en) { return isItalian ? it : en; }
    function isMobileCvViewport() {
        return !!(window.matchMedia && window.matchMedia("(max-width: 768px)").matches);
    }
    function isMobileDarkCvMode() {
        return isMobileCvViewport() &&
            document.body &&
            document.body.classList.contains("cv-generator") &&
            document.body.classList.contains("dark-mode");
    }
    var MOBILE_DARK_REMOVE_BG =
        "linear-gradient(145deg, rgba(255, 255, 255, 0.1) 0%, rgba(255, 255, 255, 0.05) 100%)";
    function pinMobileDarkRemoveBtn(btn) {
        if (!btn || !btn.style) return;
        btn.style.setProperty("background", MOBILE_DARK_REMOVE_BG, "important");
        btn.style.setProperty("background-color", "transparent", "important");
        btn.style.setProperty("background-image", MOBILE_DARK_REMOVE_BG, "important");
        btn.style.setProperty("border", "2px solid #b0c4de", "important");
        btn.style.setProperty("color", "#b0c4de", "important");
        btn.style.setProperty("-webkit-text-fill-color", "#b0c4de", "important");
        btn.style.setProperty("-webkit-appearance", "none", "important");
        btn.style.setProperty("appearance", "none", "important");
        btn.style.setProperty("box-shadow", "none", "important");
        btn.style.setProperty("filter", "none", "important");
    }
    function clearMobileDarkRemoveBtn(btn) {
        if (!btn || !btn.style) return;
        [
            "background",
            "background-color",
            "background-image",
            "border",
            "color",
            "-webkit-text-fill-color",
            "box-shadow",
            "filter"
        ].forEach(function (prop) {
            btn.style.removeProperty(prop);
        });
    }
    function syncMobileDarkRemoveBtnVisual() {
        document.querySelectorAll(".repeat-remove-btn").forEach(function (btn) {
            if (isMobileDarkCvMode()) {
                pinMobileDarkRemoveBtn(btn);
            } else {
                clearMobileDarkRemoveBtn(btn);
            }
        });
    }
    function initMobileDarkRemoveTapColorLock() {
        var root = document.documentElement;
        if (root.getAttribute("data-cv-remove-tap-lock") === "1") return;
        root.setAttribute("data-cv-remove-tap-lock", "1");
        function resolveRemoveBtn(event) {
            if (!event.target || !event.target.closest) return null;
            return event.target.closest(".repeat-remove-btn");
        }
        document.addEventListener("pointerdown", function (event) {
            if (event.pointerType === "mouse") return;
            var btn = resolveRemoveBtn(event);
            if (!btn || !isMobileDarkCvMode()) return;
            pinMobileDarkRemoveBtn(btn);
        }, true);
        document.addEventListener("pointerup", function (event) {
            var btn = resolveRemoveBtn(event);
            if (btn && isMobileDarkCvMode()) pinMobileDarkRemoveBtn(btn);
        }, true);
        document.addEventListener("focusin", function (event) {
            var btn = resolveRemoveBtn(event);
            if (btn && isMobileDarkCvMode()) pinMobileDarkRemoveBtn(btn);
        }, true);
    }
    function tr(lang, map) { return map[lang] || map.en; }
    function value(id) { var el = document.getElementById(id); return el ? (el.value || "").trim() : ""; }
    function sanitizeBaseName(firstName, lastName) {
        return ([firstName || "", lastName || ""].join(" ").trim().replace(/\s+/g, "_").replace(/[^a-zA-Z0-9_]/g, "").toLowerCase()) || "cv";
    }
    function buildOutputName(firstName, lastName, lang, format) { return sanitizeBaseName(firstName, lastName) + "_cv_" + lang + "." + format; }
    function show(text, isError) {
        if (!result) return;
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
        if (isCvScoreTabViewport()) {
            result.classList.remove("error", "file-ready");
            result.classList.add("hidden");
            result.innerHTML = "";
            return;
        }
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
        if (exportFormatSelect) exportFormatSelect.value = format;
        formatToggleButtons.forEach(function (button) { button.classList.toggle("active", button.getAttribute("data-format") === format); });
        try {
            document.documentElement.setAttribute("data-cv-boot-format", format);
        } catch (eFmtAttr) { /* ignore */ }
    }
    function setTemplate(valueTemplate) {
        selectedTemplate = valueTemplate;
        templateButtons.forEach(function (b) { b.classList.toggle("active", b.getAttribute("data-template") === valueTemplate); });
        try {
            document.documentElement.setAttribute("data-cv-boot-template", valueTemplate);
        } catch (eTplAttr) { /* ignore */ }
    }
    function setCvLang(lang) {
        selectedCvLang = lang;
        cvLangButtons.forEach(function (b) { b.classList.toggle("active", b.getAttribute("data-cv-lang") === lang); });
        try {
            document.documentElement.setAttribute("data-cv-boot-lang", lang);
        } catch (eLangAttr) { /* ignore */ }
        if (btnDownload) {
            btnDownload.textContent = uiText("Scarica ", "Download ") + lang.toUpperCase();
        }
    }
    function syncSetupInlineVisual() {
        var mobileLight = isMobileLightCvMode();
        templateButtons.concat(cvLangButtons).forEach(function (btn) {
            if (!btn || !btn.style) return;
            if (!mobileLight) {
                btn.style.removeProperty("background");
                btn.style.removeProperty("background-color");
                btn.style.removeProperty("border");
                btn.style.removeProperty("color");
                btn.style.removeProperty("-webkit-text-fill-color");
                if (btn.hasAttribute("data-cv-lang")) {
                    btn.style.removeProperty("font-weight");
                }
                return;
            }
            if (btn.hasAttribute("data-cv-lang")) {
                btn.style.setProperty("font-weight", "400", "important");
            }
            if (btn.classList.contains("active")) {
                btn.style.setProperty("background", "rgba(40, 167, 69, 0.22)", "important");
                btn.style.setProperty("background-color", "rgba(40, 167, 69, 0.22)", "important");
                btn.style.setProperty("border", "2px solid #28a745", "important");
                btn.style.setProperty("color", "#1f7a35", "important");
                btn.style.setProperty("-webkit-text-fill-color", "#1f7a35", "important");
            } else {
                btn.style.setProperty("background", "#d0e8f9", "important");
                btn.style.setProperty("background-color", "#d0e8f9", "important");
                btn.style.setProperty("border", "2px solid #003f7f", "important");
                btn.style.setProperty("color", "#003f7f", "important");
                btn.style.setProperty("-webkit-text-fill-color", "#003f7f", "important");
            }
        });
    }
    function ensureSetupPanelActiveState() {
        var activeTemplate = document.querySelector(".template-toggle [data-template].active");
        if (!activeTemplate) {
            var nextTemplate = selectedTemplate ||
                (templateButtons[0] ? templateButtons[0].getAttribute("data-template") : "classic");
            setTemplate(nextTemplate);
        }
        var activeLang = document.querySelector(".language-toggle [data-cv-lang].active");
        if (!activeLang) {
            var nextLang = selectedCvLang ||
                (cvLangButtons[0] ? cvLangButtons[0].getAttribute("data-cv-lang") : "it");
            setCvLang(nextLang);
        }
        if (atsBtn && !atsBtn.classList.contains("ats-on") && !atsBtn.classList.contains("ats-off")) {
            updateAtsButtonState();
        }
        syncSetupInlineVisual();
    }
    function updateAtsButtonState() {
        if (!atsBtn) return;
        atsBtn.classList.toggle("ats-on", atsMode);
        atsBtn.classList.toggle("ats-off", !atsMode);
        atsBtn.textContent = "ATS: " + (atsMode ? uiText("Attivo", "On") : uiText("Disattivato", "Off"));
        try {
            document.documentElement.setAttribute("data-cv-boot-ats", atsMode ? "1" : "0");
        } catch (eAtsAttr) { /* ignore */ }
    }

    function fitExpDescriptionHeight(ta) {
        if (!ta) return;
        ta.style.overflow = "hidden";
        var minPx = window.innerWidth <= 768 ? 280 : 72;
        var nextH = Math.max(minPx, ta.scrollHeight);
        ta.style.height = nextH + "px";
    }
    function fitAllExpDescriptions() {
        if (!experienceList) return;
        Array.prototype.forEach.call(experienceList.querySelectorAll(".exp-description"), fitExpDescriptionHeight);
    }

    function createExperienceItem(data) {
        var item = document.createElement("div");
        item.className = "repeat-item repeat-grid";
        item.innerHTML = '<input class="exp-role" name="exp-role" placeholder="' + uiText("Ruolo", "Role") + '" value="' + escapeAttr(data && data.role ? data.role : "") + '">' +
            '<input class="exp-company" name="exp-company" placeholder="' + uiText("Azienda", "Company") + '" value="' + escapeAttr(data && data.company ? data.company : "") + '">' +
            '<input class="exp-period" name="exp-period" placeholder="' + uiText("Periodo", "Period") + '" value="' + escapeAttr(data && data.period ? data.period : "") + '">' +
            '<input class="exp-result" name="exp-result" placeholder="' + uiText("Risultati", "Results") + '" value="' + escapeAttr(data && data.result ? data.result : "") + '">' +
            '<textarea class="exp-description" name="exp-description" rows="1" spellcheck="true" placeholder="' + uiText("Descrizione dell'esperienza (attività, responsabilità, contesto…)", "Experience description (activities, responsibilities, context…)") + '"></textarea>' +
            '<button type="button" class="exp-remove repeat-remove-btn">' + uiText("Rimuovi", "Remove") + "</button>";
        item.querySelectorAll("input").forEach(function (i) { i.addEventListener("input", onDataChanged); });
        var descTa = item.querySelector(".exp-description");
        if (descTa) {
            descTa.value = (data && data.description) ? String(data.description) : "";
            descTa.addEventListener("input", function () {
                fitExpDescriptionHeight(descTa);
                onDataChanged();
            });
            requestAnimationFrame(function () {
                fitExpDescriptionHeight(descTa);
            });
        }
        item.querySelector(".exp-remove").addEventListener("click", function () { item.remove(); onDataChanged(); });
        syncMobileDarkRemoveBtnVisual();
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
        syncMobileDarkRemoveBtnVisual();
        return item;
    }
    function normalizeSkillLevel(level) {
        var L = String(level || "").trim().toLowerCase();
        if (!L) return "intermedio";
        if (L === "base" || L === "basic") return "base";
        if (L === "intermedio" || L === "intermediate") return "intermedio";
        if (L === "avanzato" || L === "advanced") return "avanzato";
        return "intermedio";
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
        var level = normalizeSkillLevel(data && data.level);
        var hasActive = false;
        function setSkillLevelActive(nextBtn, persist) {
            item.querySelectorAll("[data-level]").forEach(function (b) { b.classList.remove("active"); });
            if (nextBtn) nextBtn.classList.add("active");
            if (persist) onDataChanged();
        }
        item.querySelectorAll("[data-level]").forEach(function (btn) {
            var isActive = btn.getAttribute("data-level") === level;
            btn.classList.toggle("active", isActive);
            if (isActive) hasActive = true;
            btn.addEventListener("touchstart", function () { setSkillLevelActive(btn, false); }, { passive: true });
            btn.addEventListener("pointerdown", function (e) {
                if (e.pointerType === "mouse") return;
                setSkillLevelActive(btn, false);
            });
            btn.addEventListener("click", function () {
                setSkillLevelActive(btn, true);
            });
        });
        if (!hasActive) {
            var fallback = item.querySelector('[data-level="intermedio"]');
            if (fallback) fallback.classList.add("active");
        }
        syncSkillLevelInlineVisual(item.querySelector(".level-toggle"));
        item.querySelector(".skill-name").addEventListener("input", onDataChanged);
        item.querySelector(".skill-remove").addEventListener("click", function () { item.remove(); onDataChanged(); });
        syncMobileDarkRemoveBtnVisual();
        return item;
    }
    function normalizeLanguageLevel(level) {
        var L = String(level || "").trim().toLowerCase();
        if (!L) return "B1";
        if (L === "native" || L === "madrelingua" || L === "mother" || L === "mother-tongue") return "native";
        var upper = L.toUpperCase();
        if (/^A[12]$|^B[12]$|^C[12]$/.test(upper)) return upper;
        if (L === "base") return "A2";
        if (L === "intermedio") return "B1";
        if (L === "avanzato") return "C1";
        return "B1";
    }

    function getLanguageLevelOptions() {
        return [
            { v: "native", t: uiText("Madrelingua", "Mother tongue") },
            { v: "A1", t: "A1" },
            { v: "A2", t: "A2" },
            { v: "B1", t: "B1" },
            { v: "B2", t: "B2" },
            { v: "C1", t: "C1" },
            { v: "C2", t: "C2" }
        ];
    }

    function getLanguageLevelLabel(value) {
        var normalized = normalizeLanguageLevel(value);
        var options = getLanguageLevelOptions();
        for (var i = 0; i < options.length; i++) {
            if (options[i].v === normalized) return options[i].t;
        }
        return "B1";
    }

    function buildLanguageLevelMenuHtml(selectedLevel) {
        var selected = normalizeLanguageLevel(selectedLevel);
        return getLanguageLevelOptions().map(function (opt) {
            var isSelected = selected === opt.v;
            return (
                '<li data-value="' + escapeAttr(opt.v) + '" role="option"' +
                (isSelected ? ' class="selected" aria-selected="true"' : "") +
                ">" + escapeHtml(opt.t) + "</li>"
            );
        }).join("");
    }

    function setLangLevelSelectValue(wrap, value) {
        if (!wrap) return;
        var normalized = normalizeLanguageLevel(value);
        var hidden = wrap.querySelector("input.lang-level");
        var trigger = wrap.querySelector(".text-tool-select-trigger");
        var menu = wrap.querySelector(".text-tool-select-menu");
        wrap.setAttribute("data-value", normalized);
        if (hidden) hidden.value = normalized;
        if (trigger) trigger.textContent = getLanguageLevelLabel(normalized);
        if (menu) {
            menu.querySelectorAll("li[data-value]").forEach(function (li) {
                var active = li.getAttribute("data-value") === normalized;
                li.classList.toggle("selected", active);
                li.setAttribute("aria-selected", active ? "true" : "false");
            });
        }
    }

    function syncLangLevelMenuOpenBodyClass() {
        document.body.classList.toggle("cv-lang-level-menu-open", !!document.querySelector(".lang-level-select.open"));
    }

    function closeLangLevelSelectMenus(exceptWrap) {
        document.querySelectorAll(".lang-level-select.open").forEach(function (w) {
            if (exceptWrap && w === exceptWrap) return;
            w.classList.remove("open");
            var t = w.querySelector(".text-tool-select-trigger");
            if (t) t.setAttribute("aria-expanded", "false");
        });
        syncLangLevelMenuOpenBodyClass();
    }

    function initLangLevelSelectDocumentListener() {
        var root = document.documentElement;
        if (root.getAttribute("data-cv-lang-level-doc-init") === "1") return;
        root.setAttribute("data-cv-lang-level-doc-init", "1");
        document.addEventListener("click", function (e) {
            if (!e.target || !e.target.closest || !e.target.closest(".lang-level-select")) {
                closeLangLevelSelectMenus(null);
            }
        });
        window.addEventListener("resize", function () {
            syncLangLevelMenuOpenBodyClass();
        });
    }

    function initLangLevelSelect(wrap) {
        if (!wrap || wrap.getAttribute("data-lang-level-init") === "1") return;
        wrap.setAttribute("data-lang-level-init", "1");
        var trigger = wrap.querySelector(".text-tool-select-trigger");
        var menu = wrap.querySelector(".text-tool-select-menu");
        var levelArrow = wrap.querySelector(".role-arrow");
        if (!trigger || !menu) return;

        function setLangLevelMenuOpen(open) {
            if (open) {
                closeLangLevelSelectMenus(wrap);
                if (targetRoleWrap) {
                    targetRoleWrap.classList.remove("open");
                    document.body.classList.remove("cv-role-menu-open");
                }
            }
            wrap.classList.toggle("open", !!open);
            trigger.setAttribute("aria-expanded", open ? "true" : "false");
            syncLangLevelMenuOpenBodyClass();
        }

        trigger.addEventListener("click", function (e) {
            e.preventDefault();
            e.stopPropagation();
            setLangLevelMenuOpen(!wrap.classList.contains("open"));
        });
        if (levelArrow) {
            levelArrow.addEventListener("click", function (e) {
                e.preventDefault();
                e.stopPropagation();
                setLangLevelMenuOpen(!wrap.classList.contains("open"));
            });
        }
        menu.addEventListener("click", function (e) {
            e.stopPropagation();
        });
        menu.querySelectorAll("li[data-value]").forEach(function (li) {
            li.addEventListener("click", function (e) {
                e.preventDefault();
                e.stopPropagation();
                setLangLevelSelectValue(wrap, li.getAttribute("data-value"));
                setLangLevelMenuOpen(false);
                onDataChanged();
            });
        });
    }

    function createLanguageItem(data) {
        var level = normalizeLanguageLevel(data && data.level);
        var item = document.createElement("div");
        item.className = "repeat-item repeat-grid repeat-grid--language";
        item.innerHTML =
            '<input class="lang-name" name="lang-name" placeholder="' + uiText("Lingua", "Language") + '" value="' + escapeAttr(data && data.name ? data.name : "") + '">' +
            '<div class="text-tool-select lang-level-select" data-value="' + escapeAttr(level) + '">' +
            '<button type="button" class="text-tool-select-trigger lang-level-trigger" aria-haspopup="listbox" aria-expanded="false" aria-label="' + escapeAttr(uiText("Livello QCER", "CEFR level")) + '">' +
            escapeHtml(getLanguageLevelLabel(level)) +
            "</button>" +
            '<span class="role-arrow" aria-hidden="true"></span>' +
            '<ul class="text-tool-select-menu lang-level-menu" role="listbox">' +
            buildLanguageLevelMenuHtml(level) +
            "</ul>" +
            '<input type="hidden" class="lang-level" name="lang-level" value="' + escapeAttr(level) + '">' +
            "</div>" +
            '<button type="button" class="lang-remove repeat-remove-btn">' + uiText("Rimuovi", "Remove") + "</button>";
        item.querySelector(".lang-name").addEventListener("input", onDataChanged);
        item.querySelector(".lang-remove").addEventListener("click", function () { item.remove(); onDataChanged(); });
        initLangLevelSelect(item.querySelector(".lang-level-select"));
        syncMobileDarkRemoveBtnVisual();
        return item;
    }

    function parseExperience() {
        if (!experienceList) return [];
        return Array.prototype.slice.call(experienceList.querySelectorAll(".repeat-item")).map(function (item) {
            var ta = item.querySelector(".exp-description");
            return {
                role: (item.querySelector(".exp-role").value || "").trim(),
                company: (item.querySelector(".exp-company").value || "").trim(),
                period: (item.querySelector(".exp-period").value || "").trim(),
                result: (item.querySelector(".exp-result").value || "").trim(),
                description: ta ? (ta.value || "").trim() : ""
            };
        }).filter(function (x) { return x.role || x.company || x.period || x.result || x.description; });
    }
    function parseEducation() {
        if (!educationList) return [];
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
        if (!skillList) return [];
        return Array.prototype.slice.call(skillList.querySelectorAll(".repeat-item")).map(function (item) {
            var active = item.querySelector("[data-level].active");
            return { name: (item.querySelector(".skill-name").value || "").trim(), level: active ? active.getAttribute("data-level") : "intermedio" };
        }).filter(function (x) { return x.name; });
    }
    function parseLanguages() {
        if (!languageList) return [];
        return Array.prototype.slice.call(languageList.querySelectorAll(".repeat-item")).map(function (item) {
            var levelEl = item.querySelector(".lang-level");
            var legacyActive = item.querySelector("[data-level].active");
            var level = levelEl
                ? levelEl.value
                : (legacyActive ? legacyActive.getAttribute("data-level") : "B1");
            return {
                name: (item.querySelector(".lang-name").value || "").trim(),
                level: normalizeLanguageLevel(level)
            };
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

    /** Email valida solo se contiene @ (non all'inizio né alla fine). */
    function isCvEmailValid(email) {
        var e = (email || "").trim();
        var at = e.indexOf("@");
        return at > 0 && at < e.length - 1;
    }

    function buildCvScoreBreakdown(data) {
        var items = [];
        function push(done, maxPts, labelIt, labelEn, hintIt, hintEn, detailText, scrollTarget) {
            items.push({
                done: !!done,
                points: done ? maxPts : 0,
                max: maxPts,
                label: uiText(labelIt, labelEn),
                hint: uiText(hintIt, hintEn),
                detail: detailText || "",
                scrollTarget: scrollTarget || ""
            });
        }
        var nameDetail = "";
        if ((data.firstName || "").trim() || (data.lastName || "").trim()) {
            nameDetail = [(data.firstName || "").trim(), (data.lastName || "").trim()].filter(Boolean).join(" ");
        }
        push(
            hasSeparateFirstAndLastName(data),
            10,
            "Nome e cognome",
            "Name and surname",
            "Inserisci nome e cognome nei rispettivi campi (non solo nel campo Nome).",
            "Enter first and last name in their fields (not only in the Name field).",
            hasSeparateFirstAndLastName(data) ? nameDetail : nameDetail,
            "name"
        );
        push(
            !!data.role,
            15,
            "Ruolo target",
            "Target role",
            "Specifica il ruolo per cui stai candidandoti.",
            "Specify the role you are applying for.",
            data.role || "",
            "cv-target-role"
        );
        push(
            isCvEmailValid(data.email),
            10,
            "Email",
            "Email",
            "Inserisci un indirizzo email valido (deve contenere @).",
            "Add a valid email address (must include @).",
            data.email || "",
            "cv-email"
        );
        push(
            !!data.phone,
            5,
            "Telefono",
            "Phone",
            "Inserisci il numero di telefono.",
            "Add your phone number.",
            data.phone || "",
            "cv-phone"
        );
        var summaryLen = (data.summary || "").length;
        var summaryOk = summaryLen >= 40;
        var summaryDetail = "";
        if (summaryLen > 0 && !summaryOk) {
            summaryDetail = uiText(summaryLen + "/40 caratteri", summaryLen + "/40 characters");
        } else if (summaryOk) {
            summaryDetail = uiText("Profilo inserito (" + summaryLen + " caratteri)", "Profile added (" + summaryLen + " characters)");
        }
        push(
            summaryOk,
            20,
            "Profilo professionale (min. 40 caratteri)",
            "Professional summary (min. 40 characters)",
            "Scrivi un profilo di almeno 40 caratteri.",
            "Write a profile with at least 40 characters.",
            summaryDetail,
            "cv-summary"
        );
        var expCount = (data.experienceItems || []).length;
        push(
            expCount > 0,
            15,
            "Esperienze lavorative",
            "Work experience",
            "Aggiungi almeno un'esperienza professionale.",
            "Add at least one work experience.",
            expCount > 0 ? uiText(expCount + " inserita/e", expCount + " added") : "",
            "cv-experience-list"
        );
        var eduCount = (data.educationItems || []).length;
        push(
            eduCount > 0,
            10,
            "Formazione",
            "Education",
            "Aggiungi almeno un percorso di formazione.",
            "Add at least one education entry.",
            eduCount > 0 ? uiText(eduCount + " inserita/e", eduCount + " added") : "",
            "cv-education-list"
        );
        var skillCount = (data.skillItems || []).length;
        var skillsOk = skillCount >= 3;
        var skillDetail = "";
        if (skillCount > 0 && !skillsOk) {
            skillDetail = uiText(skillCount + "/3 competenze", skillCount + "/3 skills");
        } else if (skillsOk) {
            skillDetail = uiText(skillCount + " competenze", skillCount + " skills");
        }
        push(
            skillsOk,
            10,
            "Competenze (min. 3)",
            "Skills (min. 3)",
            "Inserisci almeno 3 competenze.",
            "Add at least 3 skills.",
            skillDetail,
            "cv-skill-list"
        );
        var langCount = (data.languageItems || []).length;
        push(
            langCount > 0,
            5,
            "Lingue",
            "Languages",
            "Aggiungi almeno una lingua.",
            "Add at least one language.",
            langCount > 0 ? uiText(langCount + " inserita/e", langCount + " added") : "",
            "cv-language-list"
        );
        var score = items.reduce(function (sum, item) { return sum + item.points; }, 0);
        if (score > 100) score = 100;
        return { score: score, items: items };
    }

    function renderScoreChecklistHtml(breakdown, forScoreTab) {
        var scoreClass = breakdown.score === 100 ? "good" : "bad";
        var html = '<div class="cv-score-checklist">';
        html += '<p class="cv-score-checklist-total"><span class="quality-score ' + scoreClass + '">' +
            uiText("Totale", "Total") + ": <strong>" + breakdown.score + "/100</strong></span></p>";
        if (forScoreTab && breakdown.score < 100) {
            html += '<p class="cv-score-checklist-intro">' +
                uiText(
                    "Per generare e scaricare il CV serve il punteggio massimo (100/100).",
                    "You need the maximum score (100/100) to generate and download the CV."
                ) + "</p>";
        }
        html += '<ul class="cv-score-checklist-items" role="list">';
        breakdown.items.forEach(function (item) {
            var stateClass = item.done ? "is-done" : "is-missing";
            var icon = item.done ? "\u2713" : "\u25CB";
            var jumpTarget = forScoreTab && item.scrollTarget ? item.scrollTarget : "";
            var jumpClass = jumpTarget ? " cv-score-check-item--jump" : "";
            html += '<li class="cv-score-check-item ' + stateClass + jumpClass + '" role="listitem">';
            var rowAttrs = "";
            if (jumpTarget) {
                rowAttrs =
                    ' data-cv-scroll-target="' +
                    escapeAttr(jumpTarget) +
                    '" role="button" tabindex="0" aria-label="' +
                    escapeAttr(uiText("Vai al campo: ", "Go to field: ") + item.label) +
                    '"';
            }
            html += '<div class="cv-score-check-row"' + rowAttrs + ">";
            html += '<span class="cv-score-check-icon" aria-hidden="true">' + icon + "</span>";
            html += '<span class="cv-score-check-label">' + escapeHtml(item.label) + "</span>";
            html += '<span class="cv-score-check-points">' + item.points + "/" + item.max + "</span>";
            html += "</div>";
            if (!forScoreTab) {
                if (!item.done && item.hint) {
                    html += '<p class="cv-score-check-hint">' + escapeHtml(item.hint) + "</p>";
                } else if (item.done && item.detail) {
                    html += '<p class="cv-score-check-detail">' + escapeHtml(item.detail) + "</p>";
                } else if (!item.done && item.detail) {
                    html += '<p class="cv-score-check-detail cv-score-check-detail--partial">' + escapeHtml(item.detail) + "</p>";
                }
            }
            html += "</li>";
        });
        html += "</ul></div>";
        return html;
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

    function buildCvContent(data, lang, template) {
        template = template || data.template || selectedTemplate;
        var sectionLabels = getPreviewSectionLabels(template, lang);
        var dict = {
            summary: sectionLabels.summary,
            exp: sectionLabels.experience,
            edu: sectionLabels.education,
            skills: sectionLabels.skills,
            contacts: { it: "Contatti", en: "Contact", es: "Contacto", fr: "Contact", de: "Kontakt" },
            period: { it: "Periodo", en: "Period", es: "Periodo", fr: "Periode", de: "Zeitraum" },
            result: { it: "Risultati", en: "Results", es: "Logros", fr: "Resultats", de: "Ergebnisse" },
            expDesc: { it: "Descrizione", en: "Description", es: "Descripcion", fr: "Description", de: "Beschreibung" },
            grade: { it: "Voto", en: "Grade", es: "Nota", fr: "Note", de: "Note" }
        };
        var lines = [];
        if (template === "european") {
            var euPersonal = [];
            var residence = [data.address, data.city].filter(Boolean).join(", ");
            if (residence) euPersonal.push(tr(lang, { it: "Indirizzo", en: "Address", es: "Direccion", fr: "Adresse", de: "Adresse" }) + ": " + residence);
            if (data.phone) euPersonal.push(tr(lang, { it: "Telefono", en: "Phone", es: "Telefono", fr: "Telephone", de: "Telefon" }) + ": " + data.phone);
            if (data.email) euPersonal.push(tr(lang, { it: "Email", en: "Email", es: "Correo electronico", fr: "E-mail", de: "E-Mail" }) + ": " + data.email);
            if (data.linkedin) euPersonal.push(tr(lang, { it: "Sito web", en: "Website", es: "Sitio web", fr: "Site web", de: "Webseite" }) + ": " + data.linkedin);
            if (data.citizenship) euPersonal.push(tr(lang, { it: "Cittadinanza", en: "Nationality", es: "Nacionalidad", fr: "Nationalite", de: "Staatsangehoerigkeit" }) + ": " + data.citizenship);
            if (data.birthDate) euPersonal.push(tr(lang, { it: "Data di nascita", en: "Date of birth", es: "Fecha de nacimiento", fr: "Date de naissance", de: "Geburtsdatum" }) + ": " + data.birthDate);
            if (data.role) {
                euPersonal.push(tr(lang, {
                    it: "Occupazione desiderata / Settore professionale",
                    en: "Desired occupation / Professional field",
                    es: "Ocupacion deseada / Sector profesional",
                    fr: "Emploi souhaite / Domaine professionnel",
                    de: "Gewuenschte Taetigkeit / Berufsfeld"
                }) + ": " + data.role);
            }
            if (euPersonal.length) {
                pushSection(tr(lang, sectionLabels.personal));
                euPersonal.forEach(function (line) { lines.push(line); });
                pushSpacer();
            }
        } else {
            var contactParts = [data.email, data.phone, data.linkedin].filter(Boolean);
            if (contactParts.length) lines.push(tr(lang, dict.contacts) + ": " + contactParts.join(" | "));
            if (data.birthDate) lines.push(tr(lang, { it: "Data di nascita", en: "Date of birth", es: "Fecha de nacimiento", fr: "Date de naissance", de: "Geburtsdatum" }) + ": " + data.birthDate);
            if (data.citizenship) lines.push(tr(lang, { it: "Cittadinanza", en: "Citizenship", es: "Nacionalidad", fr: "Nationalite", de: "Staatsangehorigkeit" }) + ": " + data.citizenship);
            if (data.address || data.city) lines.push(tr(lang, { it: "Residenza", en: "Residence", es: "Residencia", fr: "Residence", de: "Wohnort" }) + ": " + [data.address, data.city].filter(Boolean).join(" | "));
            lines.push("");
        }

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
                    if (template === "european") {
                        if (x.period) lines.push(x.period);
                        if (x.role) lines.push(x.role);
                        if (x.company) {
                            lines.push("  " + tr(lang, { it: "Datore di lavoro", en: "Employer", es: "Empleador", fr: "Employeur", de: "Arbeitgeber" }) + ": " + x.company);
                        }
                        if (x.description) {
                            lines.push("  " + tr(lang, {
                                it: "Principali attivita e responsabilita",
                                en: "Main activities and responsibilities",
                                es: "Principales actividades y responsabilidades",
                                fr: "Principales activites et responsabilites",
                                de: "Haupttaetigkeiten und Verantwortlichkeiten"
                            }) + ":");
                            String(x.description).split(/\n/).forEach(function (dl) {
                                var t = (dl || "").trim();
                                if (t) lines.push("  - " + t);
                            });
                        }
                        if (x.result) lines.push("  " + tr(lang, dict.result) + ": " + x.result);
                    } else {
                        var header = [x.role, x.company].filter(Boolean).join(" - ");
                        lines.push((header || "-"));
                        if (x.period) lines.push("  " + tr(lang, dict.period) + ": " + x.period);
                        if (x.result) lines.push("  " + tr(lang, dict.result) + ": " + x.result);
                        if (x.description) {
                            var dlines = String(x.description).split(/\n/);
                            lines.push("  " + tr(lang, dict.expDesc) + ": " + (dlines[0] || "").trim());
                            for (var di = 1; di < dlines.length; di++) {
                                lines.push("  " + dlines[di]);
                            }
                        }
                    }
                    lines.push("");
                });
                pushSpacer();
                return;
            }
            if (key === "education" && data.educationItems.length) {
                pushSection(tr(lang, dict.edu));
                data.educationItems.forEach(function (x) {
                    if (template === "european") {
                        if (x.year) lines.push(x.year);
                        if (x.title) lines.push(x.title);
                        if (x.school) {
                            lines.push("  " + tr(lang, {
                                it: "Nome dell'organizzazione",
                                en: "Name of organisation",
                                es: "Nombre de la organizacion",
                                fr: "Nom de l'organisme",
                                de: "Name der Bildungseinrichtung"
                            }) + ": " + x.school);
                        }
                        if (x.grade) {
                            lines.push("  " + tr(lang, {
                                it: "Livello nella classificazione nazionale",
                                en: "Level in national classification",
                                es: "Nivel en la clasificacion nacional",
                                fr: "Niveau dans la classification nationale",
                                de: "Niveau in der nationalen Klassifikation"
                            }) + ": " + x.grade);
                        }
                    } else {
                        var eduHeader = [x.title, x.school].filter(Boolean).join(" - ");
                        lines.push((eduHeader || "-"));
                        if (x.year) lines.push("  " + x.year);
                        if (x.grade) lines.push("  " + tr(lang, dict.grade) + ": " + x.grade);
                    }
                    lines.push("");
                });
                pushSpacer();
                return;
            }
            if (key === "skills" && data.skillItems.length) {
                pushSection(tr(lang, dict.skills));
                data.skillItems.forEach(function (x) {
                    if (template === "european") {
                        lines.push("- " + x.name + " — " + getSkillLevelLabel(x.level, lang));
                    } else {
                        lines.push("- " + x.name + " (" + getSkillLevelLabel(x.level, lang) + ")");
                    }
                });
                pushSpacer();
            }
        });

        if (data.languageItems && data.languageItems.length) {
            pushSection(tr(lang, sectionLabels.languages));
            if (template === "european") {
                data.languageItems.forEach(function (x) {
                    lines.push(x.name + "  |  " + getLanguageLevelLabel(x.level, lang));
                });
            } else {
                data.languageItems.forEach(function (x) {
                    lines.push("- " + x.name + " (" + getLanguageLevelLabel(x.level, lang) + ")");
                });
            }
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

    function getSkillLevelLabel(level, lang) {
        var levelMap = {
            base: { it: "base", en: "basic", es: "basico", fr: "debutant", de: "grundlegend" },
            intermedio: { it: "intermedio", en: "intermediate", es: "intermedio", fr: "intermediaire", de: "mittel" },
            avanzato: { it: "avanzato", en: "advanced", es: "avanzado", fr: "avance", de: "fortgeschritten" }
        };
        return tr(lang, levelMap[level] || levelMap.intermedio);
    }

    function getLanguageLevelLabel(level, lang) {
        var normalized = normalizeLanguageLevel(level);
        if (normalized === "native") {
            return tr(lang, {
                it: "Madrelingua",
                en: "Mother tongue",
                es: "Lengua materna",
                fr: "Langue maternelle",
                de: "Muttersprache"
            });
        }
        return normalized;
    }

    function getLevelLabel(level, lang) {
        return getSkillLevelLabel(level, lang);
    }

    function getEuropeanSectionLabels() {
        return {
            personal: {
                it: "Informazioni personali",
                en: "Personal information",
                es: "Informacion personal",
                fr: "Informations personnelles",
                de: "Persoenliche Angaben"
            },
            summary: { it: "Profilo", en: "Profile", es: "Perfil", fr: "Profil", de: "Profil" },
            experience: {
                it: "Esperienza professionale",
                en: "Work experience",
                es: "Experiencia laboral",
                fr: "Experience professionnelle",
                de: "Berufserfahrung"
            },
            education: {
                it: "Istruzione e formazione",
                en: "Education and training",
                es: "Educacion y formacion",
                fr: "Formation",
                de: "Ausbildung"
            },
            skills: {
                it: "Capacita e competenze",
                en: "Skills and competences",
                es: "Capacidades y competencias",
                fr: "Competences",
                de: "Kenntnisse und Faehigkeiten"
            },
            languages: {
                it: "Competenze linguistiche",
                en: "Language skills",
                es: "Competencias linguisticas",
                fr: "Competences linguistiques",
                de: "Sprachkenntnisse"
            }
        };
    }

    function getPreviewSectionLabels(template, lang) {
        if (template === "european") {
            return getEuropeanSectionLabels();
        }
        return {
            summary: { it: "Profilo", en: "Profile", es: "Perfil", fr: "Profil", de: "Profil" },
            experience: { it: "Esperienze", en: "Experience", es: "Experiencia", fr: "Experience", de: "Erfahrung" },
            education: { it: "Formazione", en: "Education", es: "Educacion", fr: "Formation", de: "Ausbildung" },
            skills: { it: "Competenze", en: "Skills", es: "Competencias", fr: "Competences", de: "Kompetenzen" },
            languages: { it: "Lingue", en: "Languages", es: "Idiomas", fr: "Langues", de: "Sprachen" }
        };
    }

    function getCvAccentRgb(template) {
        if (template === "modern") return [0, 123, 255];
        if (template === "minimal") return [95, 99, 104];
        if (template === "european") return [0, 51, 153];
        return [0, 63, 127];
    }

    /** Riga "Etichetta: valore" nell'anteprima (lingua CV selezionata). */
    function previewLabeledLine(lang, labelMap, rawValue) {
        var value = (rawValue || "").trim();
        if (!value) return "";
        var lab = tr(lang, labelMap);
        if (lab.slice(-1) !== ":") lab += ":";
        return '<div class="preview-line"><span class="preview-line-k">' + escapeHtml(lab) + '</span> <span class="preview-line-v">' + escapeHtml(value) + "</span></div>";
    }

    function previewEuPersonalLine(lang, labelMap, rawValue) {
        var value = (rawValue || "").trim();
        if (!value) return "";
        var lab = tr(lang, labelMap);
        if (lab.slice(-1) !== ":") lab += ":";
        return (
            '<div class="preview-eu-personal-row">' +
            '<span class="preview-eu-personal-k">' + escapeHtml(lab) + "</span>" +
            '<span class="preview-eu-personal-v">' + escapeHtml(value) + "</span>" +
            "</div>"
        );
    }

    function buildEuropeanPersonalRows(data, lang) {
        var rows = [];
        var residence = [data.address, data.city].filter(Boolean).join(", ");
        if (residence) rows.push(previewEuPersonalLine(lang, { it: "Indirizzo", en: "Address", es: "Direccion", fr: "Adresse", de: "Adresse" }, residence));
        if (data.phone) rows.push(previewEuPersonalLine(lang, { it: "Telefono", en: "Phone", es: "Telefono", fr: "Telephone", de: "Telefon" }, data.phone));
        if (data.email) rows.push(previewEuPersonalLine(lang, { it: "Email", en: "Email", es: "Correo electronico", fr: "E-mail", de: "E-Mail" }, data.email));
        if (data.linkedin) rows.push(previewEuPersonalLine(lang, { it: "Sito web", en: "Website", es: "Sitio web", fr: "Site web", de: "Webseite" }, data.linkedin));
        if (data.citizenship) rows.push(previewEuPersonalLine(lang, { it: "Cittadinanza", en: "Nationality", es: "Nacionalidad", fr: "Nationalite", de: "Staatsangehoerigkeit" }, data.citizenship));
        if (data.birthDate) rows.push(previewEuPersonalLine(lang, { it: "Data di nascita", en: "Date of birth", es: "Fecha de nacimiento", fr: "Date de naissance", de: "Geburtsdatum" }, data.birthDate));
        if (data.role) {
            rows.push(previewEuPersonalLine(lang, {
                it: "Occupazione desiderata / Settore professionale",
                en: "Desired occupation / Professional field",
                es: "Ocupacion deseada / Sector profesional",
                fr: "Emploi souhaite / Domaine professionnel",
                de: "Gewuenschte Taetigkeit / Berufsfeld"
            }, data.role));
        }
        return rows;
    }

    function previewEuropeanExpEntryHtml(x, lang) {
        var parts = [];
        if (x.period) parts.push('<div class="preview-eu-dates">' + escapeHtml(x.period) + "</div>");
        if (x.role) parts.push('<div class="preview-eu-block-title">' + escapeHtml(x.role) + "</div>");
        if (x.company) {
            parts.push(
                '<div class="preview-eu-field">' +
                '<span class="preview-eu-field-k">' + escapeHtml(tr(lang, { it: "Datore di lavoro", en: "Employer", es: "Empleador", fr: "Employeur", de: "Arbeitgeber" })) + ":</span> " +
                '<span class="preview-eu-field-v">' + escapeHtml(x.company) + "</span></div>"
            );
        }
        if ((x.description || "").trim()) {
            parts.push('<div class="preview-eu-label">' + escapeHtml(tr(lang, {
                it: "Principali attivita e responsabilita",
                en: "Main activities and responsibilities",
                es: "Principales actividades y responsabilidades",
                fr: "Principales activites et responsabilites",
                de: "Haupttaetigkeiten und Verantwortlichkeiten"
            })) + "</div>");
            parts.push('<div class="preview-eu-text preview-eu-text--pre">' + escapeHtml(x.description.trim()) + "</div>");
        }
        if (x.result) {
            parts.push('<div class="preview-eu-label">' + escapeHtml(tr(lang, { it: "Risultati", en: "Results", es: "Logros", fr: "Resultats", de: "Ergebnisse" })) + "</div>");
            parts.push('<div class="preview-eu-text">' + escapeHtml(x.result) + "</div>");
        }
        if (!parts.length) return "";
        return '<div class="preview-eu-entry preview-eu-entry--experience">' + parts.join("") + "</div>";
    }

    function previewEuropeanEduEntryHtml(x, lang) {
        var parts = [];
        if (x.year) parts.push('<div class="preview-eu-dates">' + escapeHtml(x.year) + "</div>");
        if (x.title) parts.push('<div class="preview-eu-block-title">' + escapeHtml(x.title) + "</div>");
        if (x.school) {
            parts.push(
                '<div class="preview-eu-field">' +
                '<span class="preview-eu-field-k">' + escapeHtml(tr(lang, {
                    it: "Nome dell'organizzazione",
                    en: "Name of organisation",
                    es: "Nombre de la organizacion",
                    fr: "Nom de l'organisme",
                    de: "Name der Bildungseinrichtung"
                })) + ":</span> " +
                '<span class="preview-eu-field-v">' + escapeHtml(x.school) + "</span></div>"
            );
        }
        if (x.grade) {
            parts.push(
                '<div class="preview-eu-field">' +
                '<span class="preview-eu-field-k">' + escapeHtml(tr(lang, {
                    it: "Livello nella classificazione nazionale",
                    en: "Level in national classification",
                    es: "Nivel en la clasificacion nacional",
                    fr: "Niveau dans la classification nationale",
                    de: "Niveau in der nationalen Klassifikation"
                })) + ":</span> " +
                '<span class="preview-eu-field-v">' + escapeHtml(x.grade) + "</span></div>"
            );
        }
        if (!parts.length) return "";
        return '<div class="preview-eu-entry preview-eu-entry--education">' + parts.join("") + "</div>";
    }

    function previewEuropeanSkillsHtml(items, lang) {
        if (!items.length) return "";
        var chips = items.map(function (x) {
            return '<li class="preview-eu-skill-item">' + escapeHtml(x.name) + " — " + escapeHtml(getSkillLevelLabel(x.level, lang)) + "</li>";
        }).join("");
        return '<ul class="preview-eu-skill-list">' + chips + "</ul>";
    }

    function previewEuropeanLanguagesHtml(items, lang) {
        if (!items.length) return "";
        var header =
            '<div class="preview-lang-eu preview-lang-eu--header">' +
            '<span class="preview-lang-eu-name">' + escapeHtml(tr(lang, { it: "Lingua", en: "Language", es: "Idioma", fr: "Langue", de: "Sprache" })) + "</span>" +
            '<span class="preview-lang-eu-level">' + escapeHtml(tr(lang, { it: "Livello", en: "Level", es: "Nivel", fr: "Niveau", de: "Niveau" })) + "</span>" +
            "</div>";
        var rows = items.map(function (x) {
            return (
                '<div class="preview-lang-eu">' +
                '<span class="preview-lang-eu-name">' + escapeHtml(x.name) + "</span>" +
                '<span class="preview-lang-eu-level">' + escapeHtml(getLanguageLevelLabel(x.level, lang)) + "</span>" +
                "</div>"
            );
        }).join("");
        return header + rows;
    }

    function renderPreviewAndQuality() {
        if (!preview || !document.body.contains(preview)) {
            preview = document.getElementById("cv-preview");
        }
        if (!preview) return;
        var data = collectFormData();
        var isInlineDock = !!(previewDock && previewDock.classList.contains("cv-preview-dock--inline") &&
            (function () {
                var c = document.querySelector("body.cv-generator .site-main .container");
                return !!(c && previewDock.parentNode === c);
            })());
        function cvLangText(map) {
            return tr(selectedCvLang, map);
        }
        var content = buildCvContent(data, selectedCvLang, selectedTemplate);
        preview.classList.remove("preview-classic", "preview-modern", "preview-minimal", "preview-european");
        preview.classList.add("preview-" + selectedTemplate);
        var previewName = data.fullName || cvLangText({
            it: "Nome Cognome",
            en: "Name Surname",
            es: "Nombre Apellido",
            fr: "Nom Prenom",
            de: "Vorname Nachname"
        });
        var previewRole = data.role || "";
        var lang = selectedCvLang;
        function previewLine(labelMap, val) {
            return previewLabeledLine(lang, labelMap, val);
        }
        var detailRows = [];
        if (data.email) detailRows.push(previewLine({ it: "Email", en: "Email", es: "Correo electronico", fr: "E-mail", de: "E-Mail" }, data.email));
        if (data.phone) detailRows.push(previewLine({ it: "Telefono", en: "Phone", es: "Telefono", fr: "Telephone", de: "Telefon" }, data.phone));
        if (data.linkedin) detailRows.push(previewLine({ it: "LinkedIn / Portfolio", en: "LinkedIn / Portfolio", es: "LinkedIn / Portfolio", fr: "LinkedIn / Portfolio", de: "LinkedIn / Portfolio" }, data.linkedin));
        if (data.birthDate) detailRows.push(previewLine({ it: "Data di nascita", en: "Date of birth", es: "Fecha de nacimiento", fr: "Date de naissance", de: "Geburtsdatum" }, data.birthDate));
        if (data.citizenship) detailRows.push(previewLine({ it: "Cittadinanza", en: "Citizenship", es: "Nacionalidad", fr: "Nationalite", de: "Staatsangehorigkeit" }, data.citizenship));
        if (data.address) detailRows.push(previewLine({ it: "Indirizzo", en: "Address", es: "Direccion", fr: "Adresse", de: "Adresse" }, data.address));
        if (data.city) detailRows.push(previewLine({ it: "Città di residenza", en: "City of residence", es: "Ciudad de residencia", fr: "Ville de residence", de: "Wohnort" }, data.city));

        var summary = data.summary || "";
        function expEntryHtml(x) {
            var rows = [];
            if (x.role) rows.push(previewLine({ it: "Ruolo", en: "Role", es: "Puesto", fr: "Poste", de: "Rolle" }, x.role));
            if (x.company) rows.push(previewLine({ it: "Azienda", en: "Company", es: "Empresa", fr: "Entreprise", de: "Unternehmen" }, x.company));
            if (x.period) rows.push(previewLine({ it: "Periodo", en: "Period", es: "Periodo", fr: "Periode", de: "Zeitraum" }, x.period));
            if (x.result) rows.push(previewLine({ it: "Risultati", en: "Results", es: "Logros", fr: "Resultats", de: "Ergebnisse" }, x.result));
            if ((x.description || "").trim()) {
                var labD = tr(lang, { it: "Descrizione", en: "Description", es: "Descripcion", fr: "Description", de: "Beschreibung" });
                if (labD.slice(-1) !== ":") labD += ":";
                rows.push(
                    '<div class="preview-line preview-line--stack"><span class="preview-line-k">' + escapeHtml(labD) + '</span>' +
                    '<div class="preview-line-v preview-line-v--pre">' + escapeHtml(x.description.trim()) + "</div></div>"
                );
            }
            if (!rows.length) return "";
            return '<div class="preview-entry">' + rows.join("") + "</div>";
        }
        var expHtml = data.experienceItems.map(function (x) {
            return selectedTemplate === "european" ? previewEuropeanExpEntryHtml(x, lang) : expEntryHtml(x);
        }).filter(Boolean).join("");
        function eduEntryHtml(x) {
            var rows = [];
            if (x.title) rows.push(previewLine({ it: "Titolo", en: "Title", es: "Titulo", fr: "Intitule", de: "Titel" }, x.title));
            if (x.school) rows.push(previewLine({ it: "Istituto", en: "Institution", es: "Centro", fr: "Etablissement", de: "Bildungseinrichtung" }, x.school));
            if (x.year) rows.push(previewLine({ it: "Anno", en: "Year", es: "Ano", fr: "Annee", de: "Jahr" }, x.year));
            if (x.grade) rows.push(previewLine({ it: "Voto", en: "Grade", es: "Nota", fr: "Note", de: "Note" }, x.grade));
            if (!rows.length) return "";
            return '<div class="preview-entry">' + rows.join("") + "</div>";
        }
        var eduHtml = data.educationItems.map(function (x) {
            return selectedTemplate === "european" ? previewEuropeanEduEntryHtml(x, lang) : eduEntryHtml(x);
        }).filter(Boolean).join("");
        var skillsHtml = selectedTemplate === "european"
            ? previewEuropeanSkillsHtml(data.skillItems, lang)
            : data.skillItems.map(function (x) {
                return previewLine({ it: "Competenza", en: "Skill", es: "Competencia", fr: "Compétence", de: "Kompetenz" }, x.name + " (" + getSkillLevelLabel(x.level, lang) + ")");
            }).filter(Boolean).join("");
        var languagesHtml;
        if (selectedTemplate === "european") {
            languagesHtml = previewEuropeanLanguagesHtml(data.languageItems, lang);
        } else {
            languagesHtml = data.languageItems.map(function (x) {
                return previewLine({ it: "Lingua", en: "Language", es: "Idioma", fr: "Langue", de: "Sprache" }, x.name + " (" + getLanguageLevelLabel(x.level, lang) + ")");
            }).filter(Boolean).join("");
        }

        var currentPhotoUrl = getPreviewPhotoUrl(data);
        var photoTag = currentPhotoUrl
            ? '<img class="preview-photo" src="' + escapeAttr(currentPhotoUrl) + '" alt="">'
            : "";
        var previewLabels = getPreviewSectionLabels(selectedTemplate, lang);
        var parts = [];
        var euPersonalRows = selectedTemplate === "european" ? buildEuropeanPersonalRows(data, lang) : [];
        if (selectedTemplate === "european" && euPersonalRows.length) {
            parts.push(
                '<div class="preview-section preview-section--personal-eu">' +
                '<div class="preview-section-title">' + escapeHtml(tr(lang, previewLabels.personal)) + '</div>' +
                '<div class="preview-text preview-text--personal-eu">' + euPersonalRows.join("") + "</div></div>"
            );
        }
        if (summary) parts.push('<div class="preview-section"><div class="preview-section-title">' + escapeHtml(tr(lang, previewLabels.summary)) + '</div><div class="preview-text">' + escapeHtml(summary) + "</div></div>");
        if (expHtml) {
            var expClass = selectedTemplate === "european" ? "preview-text preview-text--eu" : "preview-text preview-text--labeled";
            parts.push('<div class="preview-section"><div class="preview-section-title">' + escapeHtml(tr(lang, previewLabels.experience)) + '</div><div class="' + expClass + '">' + expHtml + "</div></div>");
        }
        if (eduHtml) {
            var eduClass = selectedTemplate === "european" ? "preview-text preview-text--eu" : "preview-text preview-text--labeled";
            parts.push('<div class="preview-section"><div class="preview-section-title">' + escapeHtml(tr(lang, previewLabels.education)) + '</div><div class="' + eduClass + '">' + eduHtml + "</div></div>");
        }
        if (skillsHtml) {
            var skillsClass = selectedTemplate === "european" ? "preview-text preview-text--eu-skills" : "preview-text preview-text--labeled";
            parts.push('<div class="preview-section"><div class="preview-section-title">' + escapeHtml(tr(lang, previewLabels.skills)) + '</div><div class="' + skillsClass + '">' + skillsHtml + "</div></div>");
        }
        if (languagesHtml) {
            var langSectionClass = selectedTemplate === "european" ? "preview-text preview-text--languages-eu" : "preview-text preview-text--labeled";
            parts.push('<div class="preview-section"><div class="preview-section-title">' + escapeHtml(tr(lang, previewLabels.languages)) + '</div><div class="' + langSectionClass + '">' + languagesHtml + "</div></div>");
        }
        if (data.certifications) parts.push('<div class="preview-section"><div class="preview-section-title">' + escapeHtml(cvLangText({ it: "Certificazioni", en: "Certifications", es: "Certificaciones", fr: "Certifications", de: "Zertifizierungen" })) + '</div><div class="preview-text">' + escapeHtml(data.certifications) + "</div></div>");
        if (data.projects) parts.push('<div class="preview-section"><div class="preview-section-title">' + escapeHtml(cvLangText({ it: "Progetti", en: "Projects", es: "Proyectos", fr: "Projets", de: "Projekte" })) + '</div><div class="preview-text">' + escapeHtml(data.projects) + "</div></div>");
        if (data.achievements) parts.push('<div class="preview-section"><div class="preview-section-title">' + escapeHtml(cvLangText({ it: "Risultati", en: "Achievements", es: "Logros", fr: "Realisations", de: "Erfolge" })) + '</div><div class="preview-text">' + escapeHtml(data.achievements) + "</div></div>");

        var personalBlock = "";
        var roleTag = "";
        var cvSubtitleTag = "";
        if (selectedTemplate === "european") {
            cvSubtitleTag = '<div class="preview-eu-doc-title">' + escapeHtml(tr(lang, {
                it: "Curriculum Vitae",
                en: "Curriculum Vitae",
                es: "Curriculum Vitae",
                fr: "Curriculum Vitae",
                de: "Curriculum Vitae"
            })) + "</div>";
        } else {
            personalBlock = detailRows.length
                ? '<div class="preview-text preview-text--labeled preview-text--personal">' + detailRows.join("") + "</div>"
                : "";
            roleTag = previewRole ? ('<div class="preview-role">' + escapeHtml(previewRole) + "</div>") : "";
        }
        var previewBody =
            '<div class="preview-head">' +
            '<div class="preview-head-main">' +
            '<div class="preview-name">' + escapeHtml(previewName) + "</div>" +
            cvSubtitleTag +
            roleTag +
            personalBlock +
            "</div>" +
            photoTag +
            "</div>" +
            parts.join("");
        preview.innerHTML = previewBody;
        var liveVp = document.getElementById("cv-live-preview-viewport");
        if (liveVp) {
            liveVp.scrollLeft = 0;
            liveVp.scrollTop = 0;
        }
        if (previewFull) {
            previewFull.classList.remove("preview-classic", "preview-modern", "preview-minimal", "preview-european");
            previewFull.classList.add("preview-" + selectedTemplate);
            previewFull.innerHTML = previewBody;
        }
        var breakdown = buildCvScoreBreakdown(data);
        var score = breakdown.score;
        var tips = breakdown.items.filter(function (item) { return !item.done; }).map(function (item) {
            return isInlineDock ? item.hint : item.label;
        });
        lastQualityScore = score;
        var scoreClass = score === 100 ? "good" : "bad";
        if (quality) {
            if (isCvScoreTabViewport()) {
                quality.innerHTML = "";
            } else {
                quality.innerHTML =
                    '<span class="quality-score ' + scoreClass + '">' +
                    cvLangText({ it: "Punteggio CV", en: "CV score", es: "Puntuacion CV", fr: "Score CV", de: "CV-Punktzahl" }) + ": " + score + "/100</span><br>" +
                    (tips.length ? tips.join("<br>") : cvLangText({ it: "Ottimo! CV completo.", en: "Great! CV looks complete.", es: "Excelente! CV completo.", fr: "Excellent! CV complet.", de: "Super! Lebenslauf ist vollstandig." }));
            }
        }
        var panelHtml = renderScoreChecklistHtml(breakdown, true);
        if (isCvScoreTabViewport()) {
            syncScoreTabContent(score, panelHtml);
        }
        syncScoreTabVisibility();

        // Save current state for dedicated web preview page (view-only).
        try {
            localStorage.setItem("cv-live-preview-payload-v1", JSON.stringify({
                template: selectedTemplate,
                cvLang: selectedCvLang,
                firstName: data.firstName || "",
                lastName: data.lastName || "",
                role: data.role || "",
                email: data.email || "",
                phone: data.phone || "",
                linkedin: data.linkedin || "",
                birthDate: data.birthDate || "",
                citizenship: data.citizenship || "",
                address: data.address || "",
                city: data.city || "",
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
        var emailOk = isCvEmailValid(data.email);
        var phoneOk = !data.phone || /^[+\d][\d\s\-()]{6,}$/.test(data.phone);
        var linkedinOk = !data.linkedin || /^(https?:\/\/)?([\w-]+\.)?linkedin\.com\/.+/i.test(data.linkedin);
        if (!hasSeparateFirstAndLastName(data) || !data.role) {
            if (isMobileCvViewport()) {
                return uiText("Completa i campi e porta il CV a 100/100.", "Complete fields and reach 100/100.");
            }
            return uiText(
                "Generazione bloccata: completa il CV fino a 100/100.",
                "Generation blocked: complete the CV to 100/100."
            );
        }
        if (!emailOk) return uiText("Email non valida.", "Invalid email.");
        if (!phoneOk) return uiText("Telefono non valido.", "Invalid phone.");
        if (!linkedinOk) return uiText("LinkedIn/Portfolio non valido.", "Invalid LinkedIn/Portfolio.");
        if (lastQualityScore < 100) {
            if (isMobileCvViewport()) {
                return uiText("Punteggio CV: " + lastQualityScore + "/100. Arriva a 100/100.", "CV score: " + lastQualityScore + "/100. Reach 100/100.");
            }
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
        var content = buildCvContent(data, lang, selectedTemplate);
        var jsPDF = window.jspdf.jsPDF;
        var doc = new jsPDF({ unit: "pt", format: "a4" });
        var left = 44;
        var y = 56;
        var maxWidth = 510;
        var pageWidth = doc.internal.pageSize.getWidth();
        var hasPhoto = !!data.photoFile;
        var headerAccent = getCvAccentRgb(selectedTemplate);
        var headerInfoLines = [];
        var contactLabel = tr(lang, { it: "Contatti", en: "Contact", es: "Contacto", fr: "Contact", de: "Kontakt" });
        var citizenshipLabel = tr(lang, { it: "Cittadinanza", en: "Citizenship", es: "Nacionalidad", fr: "Nationalite", de: "Staatsangehorigkeit" });
        var residenceLabel = tr(lang, { it: "Residenza", en: "Residence", es: "Residencia", fr: "Residence", de: "Wohnort" });
        var birthLabel = tr(lang, { it: "Data di nascita", en: "Date of birth", es: "Fecha de nacimiento", fr: "Date de naissance", de: "Geburtsdatum" });
        var contactParts = [data.email, data.phone, data.linkedin].filter(Boolean);
        var residenceParts = [data.address, data.city].filter(Boolean);
        if (selectedTemplate !== "european") {
            if (contactParts.length) headerInfoLines.push(contactLabel + ": " + contactParts.join(" | "));
            if (data.citizenship) headerInfoLines.push(citizenshipLabel + ": " + data.citizenship);
            if (residenceParts.length) headerInfoLines.push(residenceLabel + ": " + residenceParts.join(" | "));
            if (data.birthDate) headerInfoLines.push(birthLabel + ": " + data.birthDate);
        }

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
        } else if (selectedTemplate === "european") {
            doc.setFillColor(245, 247, 252);
            doc.rect(28, 26, pageWidth - 56, hasPhoto ? 118 : 88, "F");
            doc.setDrawColor(headerAccent[0], headerAccent[1], headerAccent[2]);
            doc.setLineWidth(1.4);
            doc.line(44, hasPhoto ? 144 : 114, pageWidth - 44, hasPhoto ? 144 : 114);
        }

        if (data.photoFile) {
            var photoData = await readPhotoAsDataUrl(data.photoFile);
            if (photoData) doc.addImage(photoData, "JPEG", 430, 42, 96, 96);
        }
        doc.setFont("helvetica", "bold");
        doc.setTextColor(headerAccent[0], headerAccent[1], headerAccent[2]);
        doc.setFontSize(selectedTemplate === "modern" ? 22 : selectedTemplate === "minimal" ? 16 : selectedTemplate === "european" ? 20 : 18);
        doc.text(data.fullName || "-", left, y);
        y += selectedTemplate === "modern" ? 24 : selectedTemplate === "european" ? 22 : 20;
        if (selectedTemplate === "european") {
            doc.setFont("helvetica", "normal");
            doc.setTextColor(headerAccent[0], headerAccent[1], headerAccent[2]);
            doc.setFontSize(10);
            doc.text("Curriculum Vitae", left, y);
            y += 14;
        } else {
            doc.setFont("helvetica", "normal");
            doc.setTextColor(75, 97, 120);
            doc.setFontSize(selectedTemplate === "minimal" ? 11 : 12);
            doc.text(data.role || "-", left, y);
            y += 18;
        }

        // Personal details aligned on the left side of the photo.
        if (headerInfoLines.length) {
            doc.setTextColor(70, 70, 70);
            doc.setFontSize(10);
            var infoMaxWidth = hasPhoto ? 365 : maxWidth;
            var infoWrapped = doc.splitTextToSize(headerInfoLines.join("\n"), infoMaxWidth);
            doc.text(infoWrapped, left, y);
            y += (infoWrapped.length * 12) + 8;
        }

        var headerBottom = hasPhoto ? 150 : (selectedTemplate === "european" ? 118 : y);
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
        var content = buildCvContent(data, lang, selectedTemplate);
        var d = window.docx;
        var children = [new d.Paragraph({ text: data.fullName || "-", heading: d.HeadingLevel.TITLE }), new d.Paragraph({ text: data.role || "-", spacing: { after: 180 } })];
        content.text.split("\n").forEach(function (line) { children.push(new d.Paragraph({ text: line || " " })); });
        if (!data.atsMode) children.push(new d.Paragraph({ text: content.gdprNote, style: "gdprNote" }));
        var doc = new d.Document({ styles: { paragraphStyles: [{ id: "gdprNote", name: "GDPR", run: { color: "555555", size: 18 } }] }, sections: [{ children: children }] });
        return d.Packer.toBlob(doc);
    }

    function makeTxtBlob(data, lang) {
        var content = buildCvContent(data, lang, selectedTemplate);
        return new Blob([data.fullName + "\n" + data.role + "\n\n" + content.text + (data.atsMode ? "" : ("\n\n" + content.gdprNote))], { type: "text/plain;charset=utf-8" });
    }

    async function buildExportBlob(data, lang, format) {
        if (format === "pdf") return makePdfBlob(data, lang);
        if (format === "docx") return makeDocxBlob(data, lang);
        return makeTxtBlob(data, lang);
    }

    function saveDraft() {
        var draft = { meta: { template: selectedTemplate, lang: selectedCvLang, ats: atsMode, lastScore: lastQualityScore }, fields: {}, experienceItems: parseExperience(), educationItems: parseEducation(), skillItems: parseSkills(), languageItems: parseLanguages() };
        fieldIds.forEach(function (id) { var el = document.getElementById(id); if (el) draft.fields[id] = el.value || ""; });
        localStorage.setItem(storageKey, JSON.stringify(draft));
    }
    function loadDraft() {
        var raw = localStorage.getItem(storageKey);
        if (!raw) return;
        try {
            var d = JSON.parse(raw);
            if (!d || typeof d !== "object") return;
            fieldIds.forEach(function (id) { var el = document.getElementById(id); if (el && d.fields && typeof d.fields[id] === "string") el.value = d.fields[id]; });
            if (d.meta) {
                setTemplate(d.meta.template || "classic");
                setCvLang(d.meta.lang || "it");
                atsMode = !!d.meta.ats;
                if (typeof d.meta.lastScore === "number" && !isNaN(d.meta.lastScore)) {
                    lastQualityScore = Math.max(0, Math.min(100, Math.round(d.meta.lastScore)));
                }
            }
            updateAtsButtonState();
            if (experienceList) {
                experienceList.innerHTML = "";
                (d.experienceItems || []).forEach(function (x) {
                    try {
                        experienceList.appendChild(createExperienceItem(x));
                    } catch (eExp) { /* skip bad row */ }
                });
            }
            if (educationList) {
                educationList.innerHTML = "";
                (d.educationItems || []).forEach(function (x) {
                    try {
                        educationList.appendChild(createEducationItem(x));
                    } catch (eEdu) { /* skip bad row */ }
                });
            }
            if (skillList) {
                skillList.innerHTML = "";
                (d.skillItems || []).forEach(function (x) {
                    try {
                        skillList.appendChild(createSkillItem(x));
                    } catch (eSk) { /* skip bad row */ }
                });
            }
            if (languageList) {
                languageList.innerHTML = "";
                (d.languageItems || []).forEach(function (x) {
                    try {
                        languageList.appendChild(createLanguageItem(x));
                    } catch (eLang) { /* skip bad row */ }
                });
            }
        } catch (e) {
            /* Non cancellare la bozza al primo errore: evita pagina vuota dopo refresh. */
        }
    }

    function initCustomTargetRoleSelect() {
        if (!targetRoleWrap) return;
        // Cleanup from previous fallback experiments: force custom dropdown only.
        targetRoleWrap.classList.remove("use-native-mobile-select");
        var staleNative = document.getElementById("cv-target-role-native");
        if (staleNative && staleNative.parentNode) staleNative.parentNode.removeChild(staleNative);
        var roleInput = document.getElementById("cv-target-role");
        var roleArrow = targetRoleWrap.querySelector(".role-arrow");
        var options = Array.prototype.slice.call(targetRoleWrap.querySelectorAll(".text-tool-select-menu li[data-value]"));
        var roleMenu = targetRoleWrap.querySelector(".text-tool-select-menu");
        if (!roleInput || !options.length) return;

        var rolePlaceholderText = roleInput.getAttribute("placeholder") || "";

        function syncTargetRolePlaceholder() {
            var hasValue = !!(roleInput.value || "").trim();
            var isFocused = document.activeElement === roleInput;
            roleInput.setAttribute("placeholder", hasValue || isFocused ? "" : rolePlaceholderText);
            targetRoleWrap.classList.toggle("cv-target-role-editing", isFocused);
        }

        function beginTargetRoleTyping() {
            roleInput.setAttribute("placeholder", "");
            targetRoleWrap.classList.add("cv-target-role-editing");
        }

        function setRoleMenuOpen(open) {
            if (open) closeLangLevelSelectMenus(null);
            targetRoleWrap.classList.toggle("open", !!open);
            if (open && isMobileCvViewport()) {
                document.body.classList.add("cv-role-menu-open");
            } else {
                document.body.classList.remove("cv-role-menu-open");
            }
            if (!isMobileCvViewport()) {
                document.body.classList.remove("cv-role-menu-open");
            }
            targetRoleWrap.style.removeProperty("z-index");
        }

        roleInput.addEventListener("pointerdown", beginTargetRoleTyping);
        roleInput.addEventListener("touchstart", beginTargetRoleTyping, { passive: true });
        roleInput.addEventListener("focus", function () {
            setRoleMenuOpen(false);
            beginTargetRoleTyping();
        });
        roleInput.addEventListener("blur", syncTargetRolePlaceholder);
        roleInput.addEventListener("input", function () {
            if (!(roleInput.value || "").trim() && document.activeElement === roleInput) {
                roleInput.setAttribute("placeholder", "");
            }
            onDataChanged();
        });
        syncTargetRolePlaceholder();
        if (roleArrow) roleArrow.addEventListener("click", function (e) {
            e.preventDefault();
            e.stopPropagation();
            // Toggle only: second tap closes as expected on mobile.
            setRoleMenuOpen(!targetRoleWrap.classList.contains("open"));
        });
        options.forEach(function (li) {
            li.addEventListener("click", function () {
                roleInput.value = li.getAttribute("data-value");
                setRoleMenuOpen(false);
                onDataChanged();
            });
        });
        document.addEventListener("click", function (e) { if (!targetRoleWrap.contains(e.target)) setRoleMenuOpen(false); });
        window.addEventListener("resize", function () {
            if (!isMobileCvViewport()) {
                document.body.classList.remove("cv-role-menu-open");
                targetRoleWrap.classList.remove("open");
            }
        });
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
        scheduleCvRepeaterReveal();
        requestAnimationFrame(function () {
            if (typeof window.__gadlyPlaceCvPreviewDock === "function") {
                try {
                    window.__gadlyPlaceCvPreviewDock();
                } catch (eDock) { /* ignore */ }
            }
        });
        show(uiText("Bozza importata.", "Draft imported."), false);
    }

    function onDataChanged() {
        saveDraft();
        renderPreviewAndQuality();
    }

    function setDefaultRepeaters() {
        if (experienceList && !experienceList.children.length) experienceList.appendChild(createExperienceItem());
        if (educationList && !educationList.children.length) educationList.appendChild(createEducationItem());
        if (skillList && !skillList.children.length) skillList.appendChild(createSkillItem());
        if (languageList && !languageList.children.length) languageList.appendChild(createLanguageItem());
    }

    function emergencyRevealCvRepeatLists() {
        repeatLists.forEach(function (el) {
            if (!el) return;
            el.classList.add("cv-repeat-list--ready");
            el.style.cssText = "";
        });
        try {
            document.documentElement.classList.remove("cv-gen-boot");
            document.documentElement.classList.remove("cv-gen-boot-pending");
        } catch (eBootCls) { /* ignore */ }
    }

    function finishCvGeneratorBoot() {
        setDefaultRepeaters();
        ensureSkillLevelActiveState();
        try {
            bindSkillLevelDelegation();
        } catch (eBind) { /* ignore */ }
        finishCvRepeaterReveal();
        releaseCvBootShield();
        window.__gadlyCvGeneratorLayoutReady = true;
        try {
            onDataChanged();
        } catch (ePreview) { /* ignore */ }
        try {
            fitAllExpDescriptions();
        } catch (eFit) { /* ignore */ }
        if (typeof window.__gadlyPlaceQuickNav === "function") {
            try {
                window.__gadlyPlaceQuickNav();
            } catch (eQn) { /* ignore */ }
        }
        requestAnimationFrame(function () {
            if (typeof window.__gadlyPlaceQuickNav === "function") {
                try {
                    window.__gadlyPlaceQuickNav();
                } catch (eQn2) { /* ignore */ }
            }
            if (typeof window.__gadlyPlaceCvPreviewDock === "function") {
                try {
                    window.__gadlyPlaceCvPreviewDock(true);
                } catch (eDock2) { /* ignore */ }
            }
        });
    }

    function ensureSkillLevelActiveState() {
        if (!skillList) return;
        skillList.querySelectorAll(".level-toggle").forEach(function (toggle) {
            var active = toggle.querySelector("[data-level].active");
            if (!active) {
                var fallback = toggle.querySelector('[data-level="intermedio"]') || toggle.querySelector("[data-level]");
                if (fallback) fallback.classList.add("active");
            }
            syncSkillLevelInlineVisual(toggle);
        });
    }

    function syncSkillLevelInlineVisual(toggle) {
        if (!toggle || !toggle.querySelectorAll) return;
        toggle.querySelectorAll("[data-level]").forEach(function (btn) {
            if (!btn || !btn.style) return;
            btn.style.removeProperty("background");
            btn.style.removeProperty("background-color");
            btn.style.removeProperty("background-image");
            btn.style.removeProperty("border");
            btn.style.removeProperty("color");
            btn.style.removeProperty("-webkit-text-fill-color");
        });
    }

    function setSkillLevelInToggle(toggle, button, persist) {
        if (!toggle || !button) return;
        toggle.querySelectorAll("[data-level]").forEach(function (b) { b.classList.remove("active"); });
        button.classList.add("active");
        syncSkillLevelInlineVisual(toggle);
        if (persist) onDataChanged();
    }

    function bindSkillLevelDelegation() {
        if (!skillList || skillList.getAttribute("data-skill-level-delegated") === "1") return;
        skillList.setAttribute("data-skill-level-delegated", "1");

        skillList.addEventListener("pointerdown", function (e) {
            if (e.pointerType === "mouse") return;
            var btn = e.target && e.target.closest ? e.target.closest(".level-toggle [data-level]") : null;
            if (!btn) return;
            var toggle = btn.closest(".level-toggle");
            setSkillLevelInToggle(toggle, btn, false);
        });
        skillList.addEventListener("touchstart", function (e) {
            var btn = e.target && e.target.closest ? e.target.closest(".level-toggle [data-level]") : null;
            if (!btn) return;
            var toggle = btn.closest(".level-toggle");
            setSkillLevelInToggle(toggle, btn, false);
        }, { passive: true });
        skillList.addEventListener("click", function (e) {
            var btn = e.target && e.target.closest ? e.target.closest(".level-toggle [data-level]") : null;
            if (!btn) return;
            var toggle = btn.closest(".level-toggle");
            setSkillLevelInToggle(toggle, btn, true);
        });
        window.addEventListener("resize", ensureSkillLevelActiveState);
        window.addEventListener("pageshow", ensureSkillLevelActiveState);
        window.addEventListener("resize", fitAllExpDescriptions);
        window.addEventListener("pageshow", fitAllExpDescriptions);
        document.addEventListener("visibilitychange", function () {
            if (document.visibilityState === "visible") {
                ensureSetupPanelActiveState();
                ensureSkillLevelActiveState();
                fitAllExpDescriptions();
                syncMobileDarkRemoveBtnVisual();
            }
        });
        if (typeof MutationObserver !== "undefined" && document.body && document.documentElement) {
            var skillModeObserver = new MutationObserver(function () {
                ensureSetupPanelActiveState();
                ensureSkillLevelActiveState();
                fitAllExpDescriptions();
                syncMobileDarkRemoveBtnVisual();
            });
            skillModeObserver.observe(document.body, { attributes: true, attributeFilter: ["class"] });
            skillModeObserver.observe(document.documentElement, { attributes: true, attributeFilter: ["class"] });
        }
        syncMobileDarkRemoveBtnVisual();
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

    if (addExperienceBtn && experienceList) {
        addExperienceBtn.addEventListener("click", function () { experienceList.appendChild(createExperienceItem()); onDataChanged(); });
    }
    if (addEducationBtn && educationList) {
        addEducationBtn.addEventListener("click", function () { educationList.appendChild(createEducationItem()); onDataChanged(); });
    }
    if (addSkillBtn && skillList) {
        addSkillBtn.addEventListener("click", function () {
            skillList.appendChild(createSkillItem());
            ensureSkillLevelActiveState();
            onDataChanged();
        });
    }
    if (addLanguageBtn && languageList) {
        addLanguageBtn.addEventListener("click", function () { languageList.appendChild(createLanguageItem()); onDataChanged(); });
    }
    formatToggleButtons.forEach(function (button) { button.addEventListener("click", function () { setExportFormat(button.getAttribute("data-format") || "pdf"); onDataChanged(); }); });
    templateButtons.forEach(function (button) {
        function activateTemplateEarly(event) {
            if (event && event.cancelable) {
                // Keep default behavior, just update visual state immediately on touch/pointer down.
            }
            setTemplate(button.getAttribute("data-template"));
            ensureSetupPanelActiveState();
        }
        button.addEventListener("touchstart", activateTemplateEarly, { passive: true });
        button.addEventListener("pointerdown", activateTemplateEarly);
        button.addEventListener("click", function () {
            setTemplate(button.getAttribute("data-template"));
            ensureSetupPanelActiveState();
            onDataChanged();
        });
    });
    cvLangButtons.forEach(function (button) {
        function activateLangEarly() {
            setCvLang(button.getAttribute("data-cv-lang"));
            ensureSetupPanelActiveState();
        }
        button.addEventListener("touchstart", activateLangEarly, { passive: true });
        button.addEventListener("pointerdown", function (e) {
            if (e.pointerType === "mouse") return;
            activateLangEarly();
        });
        button.addEventListener("click", function () {
            setCvLang(button.getAttribute("data-cv-lang"));
            ensureSetupPanelActiveState();
            onDataChanged();
        });
    });
    if (atsBtn) atsBtn.addEventListener("click", function () { atsMode = !atsMode; updateAtsButtonState(); onDataChanged(); });
    if (exportDraftBtn) exportDraftBtn.addEventListener("click", exportDraftJson);
    if (importDraftBtn && importDraftInput) {
        importDraftBtn.addEventListener("click", function () { importDraftInput.click(); });
        importDraftInput.addEventListener("change", importDraftJson);
    }

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
    try {
        try {
            initScoreTabControls();
        } catch (eScoreTab) { /* ignore */ }
        applyCvSetupFromHtmlBoot();
        loadDraft();
        syncCvBootHtmlAttrs();
        try { initCustomTargetRoleSelect(); } catch (eRole) { /* ignore */ }
        try { initLangLevelSelectDocumentListener(); } catch (eLang) { /* ignore */ }
        try { initBirthDateMask(); } catch (eBirth) { /* ignore */ }
        ensureSetupPanelActiveState();
        initMobileDarkRemoveTapColorLock();
        syncMobileDarkRemoveBtnVisual();
        setExportFormat((exportFormatSelect && exportFormatSelect.value) || "pdf");
        updateAtsButtonState();
    } finally {
        finishCvGeneratorBoot();
    }
    if (previewDock && typeof MutationObserver !== "undefined") {
        var dockObserver = new MutationObserver(function () {
            if (document.documentElement.classList.contains("cv-dock-resizing")) return;
            syncScoreTabVisibility();
            renderPreviewAndQuality();
        });
        dockObserver.observe(previewDock, { attributes: true, attributeFilter: ["class"] });
    }
    window.__gadlyCvGeneratorSyncDockUi = function () {
        applyCvViewportMode();
        syncScoreTabVisibility();
        renderPreviewAndQuality();
    };

    function initLivePreviewViewportPan() {
        var vp = document.getElementById("cv-live-preview-viewport");
        if (!vp || typeof vp.addEventListener !== "function") return;
        var active = false;
        var pid = null;
        var downClientX = 0;
        var downClientY = 0;
        var originScrollLeft = 0;
        var originScrollTop = 0;
        vp.addEventListener("pointerdown", function (e) {
            if (e.button !== 0 && e.pointerType !== "touch") return;
            var el = e.target;
            if (el && el.closest && el.closest("a, button, input, select, textarea, label")) return;
            active = true;
            pid = e.pointerId;
            downClientX = e.clientX;
            downClientY = e.clientY;
            originScrollLeft = vp.scrollLeft;
            originScrollTop = vp.scrollTop;
            try {
                vp.setPointerCapture(e.pointerId);
            } catch (err) { /* ignore */ }
            vp.classList.add("cv-live-preview-viewport--grabbing");
        });
        vp.addEventListener("pointermove", function (e) {
            if (!active || e.pointerId !== pid) return;
            var dx = e.clientX - downClientX;
            var dy = e.clientY - downClientY;
            vp.scrollLeft = originScrollLeft - dx;
            vp.scrollTop = originScrollTop - dy;
        });
        function endPan(e) {
            if (!active) return;
            if (e.pointerId != null && e.pointerId !== pid) return;
            active = false;
            pid = null;
            vp.classList.remove("cv-live-preview-viewport--grabbing");
            try {
                vp.releasePointerCapture(e.pointerId);
            } catch (err) { /* ignore */ }
        }
        vp.addEventListener("pointerup", endPan);
        vp.addEventListener("pointercancel", endPan);
        vp.addEventListener("lostpointercapture", function () {
            active = false;
            pid = null;
            vp.classList.remove("cv-live-preview-viewport--grabbing");
        });
    }

    initLivePreviewViewportPan();

    if (btnGenerate) btnGenerate.addEventListener("click", async function () {
        var data = collectFormData();
        var validationError = validateData(data);
        if (validationError) {
            show(validationError, true);
            if (btnDownload) btnDownload.classList.add("hidden");
            isReadyToDownload = false;
            return;
        }
        if (isCvScoreTabViewport()) {
            if (btnGenerate.disabled) return;
            btnGenerate.disabled = true;
            try {
                await handleDownload();
            } finally {
                btnGenerate.disabled = false;
            }
            return;
        }
        var format = value("cv-export-format") || "pdf";
        var fileName = buildOutputName(data.firstName, data.lastName, selectedCvLang, format);
        showFileReady(fileName);
        if (btnDownload) btnDownload.classList.remove("hidden");
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

    if (btnDownload) btnDownload.addEventListener("click", handleDownload);

    window.__gadlyCvGeneratorRecover = function () {
        try {
            loadDraft();
        } catch (eLoad) { /* ignore */ }
        try {
            finishCvGeneratorBoot();
        } catch (eFinish) {
            emergencyRevealCvRepeatLists();
        }
        try {
            onDataChanged();
        } catch (ePreview) { /* ignore */ }
        if (typeof window.__gadlyPlaceCvPreviewDock === "function") {
            try {
                window.__gadlyPlaceCvPreviewDock(true);
            } catch (eDock) { /* ignore */ }
        }
    };
    }

    window.addEventListener("pageshow", function () {
        if (window.__gadlyCvGeneratorLayoutReady) return;
        if (typeof window.__gadlyCvGeneratorRecover === "function") {
            window.__gadlyCvGeneratorRecover();
        }
    });

    try {
        boot();
    } catch (eBootFatal) {
        try {
            console.error("[gadly cv-generator] boot failed", eBootFatal);
        } catch (eLog) { /* ignore */ }
        if (typeof window.__gadlyCvGeneratorRecover === "function") {
            window.__gadlyCvGeneratorRecover();
        }
    }
})();
