(function () {
    "use strict";
    var gt = typeof gettext === "function" ? gettext : function (s) { return s; };

    /** Etichette e testi tradotti dal server (django.po), non da djangojs. */
    var interviewLabels = {};
    var interviewQuestionsServer = null;
    var interviewTipsServer = null;
    var interviewAiConfig = { enabled: false, endpoint: "", timeoutMs: 7000 };
    (function parseInterviewPayload() {
        var el = document.getElementById("interview-banks-data");
        if (!el || !el.textContent) return;
        try {
            var p = JSON.parse(el.textContent);
            if (p && p.labels && typeof p.labels === "object") {
                interviewLabels = p.labels;
            }
            if (
                p &&
                p.questions &&
                p.tips &&
                p.questions.length &&
                p.questions.length === p.tips.length
            ) {
                interviewQuestionsServer = p.questions;
                interviewTipsServer = p.tips;
            }
        } catch (ignore) {}
    })();

    (function parseInterviewAiConfig() {
        var el = document.getElementById("interview-ai-config");
        if (!el || !el.textContent) return;
        try {
            var cfg = JSON.parse(el.textContent);
            if (cfg && typeof cfg === "object") {
                interviewAiConfig.enabled = !!cfg.enabled;
                interviewAiConfig.endpoint = String(cfg.endpoint || "");
                if (cfg.timeoutMs != null) {
                    interviewAiConfig.timeoutMs = Number(cfg.timeoutMs) || 7000;
                }
            }
        } catch (ignore) {}
    })();

    function lbl(key, en) {
        var v = interviewLabels[key];
        return v != null && v !== "" ? v : gt(en);
    }

    var messagesEl = document.getElementById("interview-messages");
    var inputEl = document.getElementById("interview-answer-input");
    var errEl = document.getElementById("interview-inline-error");
    var btnRestart = document.getElementById("interview-restart");
    var btnExport = document.getElementById("interview-export");

    var roleInput = document.getElementById("interview-role");
    var levelInput = document.getElementById("interview-level");
    var focusInput = document.getElementById("interview-focus");
    var settingsToggleEl = document.getElementById("interview-settings-toggle");
    var settingsContentEl = document.getElementById("interview-settings-content");
    var settingsSectionEl = document.querySelector(".interview-settings");
    var readAloudEl = document.getElementById("interview-read-aloud");
    var flowEl = document.getElementById("interview-flow");
    /** Dopo la prima scelta uomo/donna: sblocca chat e avvia colloquio (una sola volta). */
    var interviewFlowStarted = false;

    var questionBank = [];
    var answerBank = [];
    var order = [];
    var currentIndex = 0;
    var awaitingAnswer = false;
    var finished = false;
    var transcript = [];

    function v(el) {
        return el && el.value ? el.value.trim() : "";
    }

    function getCsrfToken() {
        var cookieValue = "";
        var parts = document.cookie ? document.cookie.split(";") : [];
        for (var i = 0; i < parts.length; i++) {
            var c = parts[i].trim();
            if (c.indexOf("csrftoken=") === 0) {
                cookieValue = decodeURIComponent(c.substring("csrftoken=".length));
                break;
            }
        }
        return cookieValue;
    }

    function escapeHtml(s) {
        return String(s)
            .replace(/&/g, "&amp;")
            .replace(/</g, "&lt;")
            .replace(/>/g, "&gt;")
            .replace(/"/g, "&quot;");
    }

    function showInlineError(msg) {
        if (!errEl) return;
        errEl.textContent = msg || "";
        errEl.classList.toggle("hidden", !msg);
    }

    function clearInlineError() {
        showInlineError("");
    }

    function resizeAnswerField() {
        if (!inputEl) return;
        inputEl.style.height = "auto";
        var minH = 44;
        var maxH = 260;
        var next = Math.max(minH, Math.min(maxH, inputEl.scrollHeight || minH));
        inputEl.style.height = next + "px";
        inputEl.style.overflowX = "hidden";
        inputEl.style.overflowY = (inputEl.scrollHeight > maxH) ? "auto" : "hidden";
    }

    function isGenderChosen() {
        var m = document.getElementById("interview-recruiter-male");
        var f = document.getElementById("interview-recruiter-female");
        return !!(m && m.checked) || !!(f && f.checked);
    }

    function isRecruiterFemale() {
        var el = document.getElementById("interview-recruiter-female");
        return !!(el && el.checked);
    }

    function unlockInterviewFlow() {
        if (!flowEl) return;
        flowEl.classList.remove("interview-flow--locked");
        flowEl.setAttribute("aria-hidden", "false");
    }

    function tryStartInterviewAfterGenderChoice() {
        if (interviewFlowStarted) return;
        if (!isGenderChosen()) return;
        interviewFlowStarted = true;
        unlockInterviewFlow();
        startInterview();
    }


    function getRecruiterDisplayName() {
        return isRecruiterFemale()
            ? lbl("femaleRecruiter", "Female recruiter")
            : lbl("maleRecruiter", "Male recruiter");
    }

    function getPreferredPageLang() {
        var lang = (document.documentElement.lang || "en").toLowerCase();
        return lang.indexOf("it") === 0 ? "it-IT" : "en-US";
    }

    function isItalianPage() {
        var lang = (document.documentElement.lang || "").toLowerCase();
        return lang.indexOf("it") === 0;
    }

    function voiceGenderHint(v) {
        var n = (v.name || "").toLowerCase();
        var femaleHints = /female|woman|soprano|zira|elsa|fiona|samantha|paola|chiara|elena|giulia|google italiano female|italian.*female/;
        var maleHints = /male|man|baritone|david|daniel|diego|alberto|luca|marco|google italiano male|italian.*male|uk english male|maschio|maschile|uomo|it-it-standard-b|it-it-wavenet-b|it-it-neural2-b/;
        var isFemale = femaleHints.test(n);
        var isMale = maleHints.test(n);
        if (isFemale && !isMale) return "female";
        if (isMale && !isFemale) return "male";
        return "neutral";
    }

    function scoreVoiceForGender(v, wantFemale) {
        var n = (v.name || "").toLowerCase();
        var l = (v.lang || "").toLowerCase();
        var gender = voiceGenderHint(v);
        var s = 0;
        if (wantFemale && gender === "female") s += 24;
        if (!wantFemale && gender === "male") s += 24;
        if (wantFemale && gender === "male") s -= 18;
        if (!wantFemale && gender === "female") s -= 18;
        if (l === "it-it") s += 16;
        else if (l.indexOf("it-") === 0) s += 12;
        else if (l.indexOf("it") === 0) s += 10;
        if (/italian|italiano|italia/.test(n)) s += 8;
        if (!wantFemale && /male|uomo|maschile|luca|marco|diego|alberto|daniel|david/.test(n)) s += 6;
        if (wantFemale && /female|donna|femminile|paola|chiara|elena|giulia|samantha|fiona/.test(n)) s += 6;
        if (/english|en-us|en-gb|uk|us/.test(n) && l.indexOf("it") !== 0) s -= 10;
        if (v.localService) s += 2;
        if (/natural|neural|premium|enhanced/.test(n)) s += 1;
        return s;
    }

    function isItalianLangCode(lang) {
        var l = (lang || "").toLowerCase();
        return l === "it" || l === "it-it" || l.indexOf("it-") === 0;
    }

    function voiceIdentityText(v) {
        if (!v) return "";
        return ((v.name || "") + " " + (v.voiceURI || "") + " " + (v.lang || "")).toLowerCase();
    }

    function isMaleVoiceName(name) {
        var n = (name || "").toLowerCase();
        return /(^|[^a-z])(male|man|uomo|maschio|maschile)([^a-z]|$)|diego|luca|marco|alberto|daniel|david|giorgio|carlo|giuseppe|cosimo|standard-b|wavenet-b|neural2-b/.test(n);
    }

    function isFemaleVoiceName(name) {
        var n = (name || "").toLowerCase();
        return /(^|[^a-z])(female|woman|donna|femminile)([^a-z]|$)|zira|elsa|fiona|samantha|paola|chiara|elena|giulia|standard-a|wavenet-a|neural2-a/.test(n);
    }

    function isLikelyFemaleVoice(v) {
        var id = voiceIdentityText(v);
        if (!id) return false;
        if (voiceGenderHint(v) === "female") return true;
        return /(^|[^a-z])(female|woman|donna|femminile|ragazza)([^a-z]|$)|alice|alexa|aria|anna|maria|sara|sofia|fiona|samantha|paola|chiara|elena|giulia|standard-a|wavenet-a|neural2-a/.test(id);
    }

    function filterOutFemaleVoices(arr) {
        var out = [];
        var i;
        for (i = 0; i < (arr || []).length; i++) {
            if (!isLikelyFemaleVoice(arr[i])) out.push(arr[i]);
        }
        return out;
    }

    function forceItalianMaleVoice() {
        if (!window.speechSynthesis) return null;
        var voices = speechSynthesis.getVoices();
        if (!voices || !voices.length) return null;
        var italian = [];
        var i;
        for (i = 0; i < voices.length; i++) {
            if (isItalianLangCode(voices[i].lang)) italian.push(voices[i]);
        }
        if (!italian.length) return null;
        var explicitMale = [];
        var nonFemale = [];
        for (i = 0; i < italian.length; i++) {
            if (isMaleVoiceName(italian[i].name)) explicitMale.push(italian[i]);
            if (!isLikelyFemaleVoice(italian[i])) nonFemale.push(italian[i]);
        }
        return explicitMale[0] || nonFemale[0] || null;
    }

    function forceAnyMaleVoice() {
        if (!window.speechSynthesis) return null;
        var voices = speechSynthesis.getVoices();
        if (!voices || !voices.length) return null;
        var maleByName = [];
        var maleByHint = [];
        var i;
        for (i = 0; i < voices.length; i++) {
            if (isMaleVoiceName(voices[i].name)) maleByName.push(voices[i]);
            if (voiceGenderHint(voices[i]) === "male") maleByHint.push(voices[i]);
        }
        return maleByName[0] || maleByHint[0] || null;
    }

    function forceNonFemaleVoiceForCurrentLang() {
        if (!window.speechSynthesis) return null;
        var voices = speechSynthesis.getVoices();
        if (!voices || !voices.length) return null;
        var preferredLang = getPreferredPageLang().toLowerCase();
        var langShort = preferredLang.split("-")[0];
        var exact = [];
        var base = [];
        var i;
        for (i = 0; i < voices.length; i++) {
            if (isLikelyFemaleVoice(voices[i])) continue;
            var vLang = (voices[i].lang || "").toLowerCase();
            if (vLang === preferredLang) exact.push(voices[i]);
            else if (vLang === langShort || vLang.indexOf(langShort + "-") === 0) base.push(voices[i]);
        }
        if (exact.length) return exact[0];
        if (base.length) return base[0];
        for (i = 0; i < voices.length; i++) {
            if (!isLikelyFemaleVoice(voices[i])) return voices[i];
        }
        return null;
    }

    function pickRecruiterVoice(wantFemale) {
        if (!window.speechSynthesis) return null;
        var voices = speechSynthesis.getVoices();
        if (!voices || !voices.length) return null;
        var preferredLang = getPreferredPageLang().toLowerCase();
        var langShort = preferredLang.split("-")[0];
        var candidates = [];
        var exactLang = [];
        var sameBaseLang = [];
        var i;
        for (i = 0; i < voices.length; i++) {
            var vLang = (voices[i].lang || "").toLowerCase();
            if (vLang === preferredLang) exactLang.push(voices[i]);
            if (vLang.indexOf(langShort + "-") === 0 || vLang === langShort) sameBaseLang.push(voices[i]);
        }
        if (exactLang.length) candidates = exactLang.slice();
        else if (sameBaseLang.length) candidates = sameBaseLang.slice();
        else {
            for (i = 0; i < voices.length; i++) candidates.push(voices[i]);
        }
        function pickBest(arr) {
            if (!arr || !arr.length) return null;
            var best = arr[0];
            var bestScore = scoreVoiceForGender(best, wantFemale);
            for (var j = 1; j < arr.length; j++) {
                var sc = scoreVoiceForGender(arr[j], wantFemale);
                if (sc > bestScore) {
                    bestScore = sc;
                    best = arr[j];
                }
            }
            return best;
        }

        var preferredGender = wantFemale ? "female" : "male";
        var exactGender = [];
        var exactGenderItalian = [];
        var neutral = [];
        var globalExactGender = [];
        var italianMaleByName = [];
        var italianFemaleByName = [];
        for (i = 0; i < candidates.length; i++) {
            var g = voiceGenderHint(candidates[i]);
            var cl = (candidates[i].lang || "").toLowerCase();
            if (g === preferredGender) exactGender.push(candidates[i]);
            if (g === preferredGender && (cl === "it-it" || cl.indexOf("it-") === 0 || cl === "it")) {
                exactGenderItalian.push(candidates[i]);
            }
            else if (g === "neutral") neutral.push(candidates[i]);
            if (isItalianLangCode(cl) && isMaleVoiceName(candidates[i].name)) {
                italianMaleByName.push(candidates[i]);
            }
            if (isItalianLangCode(cl) && isFemaleVoiceName(candidates[i].name)) {
                italianFemaleByName.push(candidates[i]);
            }
        }
        for (i = 0; i < voices.length; i++) {
            if (voiceGenderHint(voices[i]) === preferredGender) {
                globalExactGender.push(voices[i]);
            }
        }

        /*
         * In italiano priorita assoluta alla pronuncia italiana:
         * se non c'e una voce maschile italiana, meglio una voce italiana neutral/femminile
         * piuttosto che una voce maschile inglese.
         */
        if (langShort === "it") {
            if (wantFemale) {
                return (
                    pickBest(italianFemaleByName) ||
                    pickBest(exactGenderItalian) ||
                    pickBest(exactGender) ||
                    pickBest(neutral) ||
                    pickBest(candidates) ||
                    pickBest(globalExactGender)
                );
            }
            var italianNeutralNoFemale = filterOutFemaleVoices(neutral);
            var italianCandidatesNoFemale = filterOutFemaleVoices(candidates);
            var globalMaleNoFemale = filterOutFemaleVoices(globalExactGender);
            return (
                pickBest(italianMaleByName) ||
                pickBest(exactGenderItalian) ||
                pickBest(exactGender) ||
                pickBest(italianNeutralNoFemale) ||
                pickBest(italianCandidatesNoFemale) ||
                pickBest(globalExactGender) ||
                pickBest(globalMaleNoFemale)
            );
        }
        return pickBest(exactGender) || pickBest(globalExactGender) || pickBest(neutral) || pickBest(candidates);
    }

    function speakRecruiterText(plainText) {
        if (!readAloudEl || !readAloudEl.checked) return;
        if (!window.speechSynthesis || !plainText) return;
        try {
            if (speechSynthesis.paused) {
                speechSynthesis.resume();
            }
            speechSynthesis.cancel();
            var u = new SpeechSynthesisUtterance(plainText);
            u.lang = getPreferredPageLang();
            var voice = null;
            if (isRecruiterFemale()) {
                voice = pickRecruiterVoice(true);
            } else {
                voice = forceItalianMaleVoice() || forceAnyMaleVoice() || forceNonFemaleVoiceForCurrentLang();
                if (voice && isLikelyFemaleVoice(voice)) {
                    voice = null;
                }
            }
            if (voice) {
                u.voice = voice;
            }
            u.rate = 0.98;
            if (isRecruiterFemale()) u.pitch = 1.08;
            else {
                var selectedMaleHint = voice ? voiceGenderHint(voice) : "neutral";
                if (selectedMaleHint === "male") u.pitch = 0.82;
                else u.pitch = 0.68;
            }
            speechSynthesis.speak(u);
        } catch (e) {}
    }

    function initSpeechSynthVoices() {
        if (!window.speechSynthesis) return;
        speechSynthesis.getVoices();
        if (typeof speechSynthesis.onvoiceschanged !== "undefined") {
            speechSynthesis.onvoiceschanged = function () {
                speechSynthesis.getVoices();
            };
        }
    }

    function shuffleIndices(n) {
        var a = [];
        for (var i = 0; i < n; i++) a.push(i);
        for (var j = n - 1; j > 0; j--) {
            var k = Math.floor(Math.random() * (j + 1));
            var t = a[j];
            a[j] = a[k];
            a[k] = t;
        }
        return a;
    }

    /** Parole “vuote” IT/EN per estrarre termini significativi dalla domanda. */
    var STOP_WORDS = (function () {
        var raw =
            "the a an and or but if in on at to for of as is was are were been be being have has had do does did will would could should may might must can " +
            "this that these those with from into by about over under than then also just only very some any each every both few more most other such same " +
            "tell describe give please what when where which who whom whose why how your our their my me us you we he she it they them his her its " +
            "not no yes all any work time here there role job day week year make take get go come know think see want need like just " +
            "il lo la i gli le un una uno di da in per con su tra fra che non mi ti si ci vi lo gli ne più come cosa quando dove perché questa questo questi quella quelli " +
            "anche solo molto poco tutti tutte ogni essere avere fare dire andare volere potere deve dovuto essere stato stata stati " +
            "tell describe name list explain outline share walk";
        var s = new Set();
        raw.split(/\s+/).forEach(function (w) {
            if (w) s.add(w);
        });
        return s;
    })();

    function significantWords(str) {
        return String(str)
            .toLowerCase()
            .replace(/[^a-zàèéìòùáíóúäöüñç']/gi, " ")
            .split(/\s+/)
            .map(function (w) {
                return w.replace(/^['’]+|['’]+$/g, "");
            })
            .filter(function (w) {
                return w.length >= 4 && !STOP_WORDS.has(w);
            });
    }

    function wordCount(s) {
        return String(s)
            .trim()
            .split(/\s+/)
            .filter(Boolean).length;
    }

    /**
     * Euristica locale (senza server): blocca risposte troppo corte, evasive,
     * o senza alcun legame lessicale con la domanda.
     */
    function isAnswerCoherent(questionText, answerText) {
        var a = String(answerText).replace(/\s+/g, " ").trim();
        var low = a.toLowerCase();
        if (a.length < 28) return false;
        if (
            /^(non lo so|non lo so\.|boh|skip|pass|niente|ok\.?|va beh|whatever|i don't know|idk|no comment|non so|mah)\.?$/i.test(
                a
            )
        ) {
            return false;
        }
        var wc = wordCount(a);
        if (wc < 4 && a.length < 55) return false;
        if (/^[\d\s.,;:!?'"()\-_/\\]+$/.test(a)) return false;
        if (a.length >= 55 && wc >= 10) return true;
        if (a.length >= 100) return true;
        var qw = significantWords(questionText);
        if (!qw.length) return a.length >= 40;
        var i;
        var stem;
        for (i = 0; i < qw.length; i++) {
            if (low.indexOf(qw[i]) !== -1) return true;
            stem = qw[i].length >= 5 ? qw[i].slice(0, 5) : qw[i];
            if (stem.length >= 4 && low.indexOf(stem) !== -1) return true;
        }
        if (a.length >= 45 && wc >= 7) return true;
        return false;
    }

    function randomRecruiterPushback() {
        var msgs = [
            lbl(
                "pushback1",
                "That doesn't really address what I asked. Can you answer more directly?"
            ),
            lbl(
                "pushback2",
                "I'm not sure that connects to my question. Could you focus on what I asked?"
            ),
            lbl(
                "pushback3",
                "This doesn't seem aligned with my question. Please try again with a clearer answer."
            )
        ];
        return msgs[Math.floor(Math.random() * msgs.length)];
    }

    var lastPushbackIndex = -1;
    function pickRotatingMessage(msgs) {
        if (!msgs || !msgs.length) return "";
        if (msgs.length === 1) return msgs[0];
        var idx = Math.floor(Math.random() * msgs.length);
        if (idx === lastPushbackIndex) {
            idx = (idx + 1 + Math.floor(Math.random() * (msgs.length - 1))) % msgs.length;
        }
        lastPushbackIndex = idx;
        return msgs[idx];
    }

    function isUncertainAnswer(text) {
        var t = String(text || "").toLowerCase().trim();
        if (!t) return false;
        return /^(non\s+saprei|non\s+so|boh|non\s+ne\s+ho\s+idea|i\s+don't\s+know|idk|not\s+sure|unsure)[.!?]*$/.test(t);
    }

    function userAskedRecruiterQuestion(text) {
        var t = String(text || "").toLowerCase().trim();
        if (!t) return false;
        if (t.indexOf("?") !== -1) return true;
        return /^(posso|puoi|potresti|cosa|come|quando|dove|perche|perché|chi|what|how|why|can\s+you|could\s+you)\b/.test(t);
    }

    function recruiterEncouragement() {
        var msgs = isItalianPage()
            ? [
                "Tranquillo, prenditi qualche secondo: prova a rispondere con calma e con un esempio concreto.",
                "Va bene, succede. Fai un respiro e raccontami un caso reale, anche breve.",
                "Nessun problema: pensa a una situazione semplice e spiegami come l'hai gestita.",
                "Ottimo allenamento: prenditi il tuo tempo e rispondimi passo dopo passo."
            ]
            : [
                "No worries. Take a breath and answer calmly with one concrete example.",
                "That's okay, this is practice. Think for a moment and walk me through your answer.",
                "Take your time and start from a simple real situation you handled.",
                "You're doing fine. Pause, think, and give me a clear step-by-step answer."
            ];
        return pickRotatingMessage(msgs);
    }

    function recruiterReplyToCandidateQuestion() {
        var msgs = isItalianPage()
            ? [
                "Certo, ottima domanda. In un colloquio valuto soprattutto chiarezza, esempi concreti e capacita di sintesi.",
                "Domanda utile. Mi interessa capire il tuo ragionamento: contesto, azioni fatte e risultato finale.",
                "Volentieri: piu la risposta e concreta, meglio riesco a valutare il tuo approccio al lavoro.",
                "Ottimo punto. Cerca di collegare la risposta a un caso reale: aiuta molto durante il colloquio."
            ]
            : [
                "Great question. I mostly evaluate clarity, concrete examples, and concise communication.",
                "Good point. I want to understand your reasoning: context, actions, and outcome.",
                "Sure. The more concrete your answer is, the better I can evaluate your approach.",
                "Excellent question. Try to connect your answer to a real case from your experience."
            ];
        return pickRotatingMessage(msgs);
    }

    function isClarificationRequest(text) {
        var t = String(text || "").toLowerCase();
        return /(non ho capito|puoi spieg|potresti spieg|cosa intendi|puoi ripet|chiarisc|spiega meglio|che intendi|what do you mean|can you explain|could you explain)/.test(t);
    }

    function extractQuestionKeywords(questionText) {
        var words = significantWords(questionText);
        var out = [];
        var i;
        for (i = 0; i < words.length && out.length < 3; i++) {
            if (out.indexOf(words[i]) === -1) out.push(words[i]);
        }
        return out;
    }

    function recruiterClarifyCurrentQuestion(questionText) {
        var keys = extractQuestionKeywords(questionText);
        var keyPart = keys.length ? keys.join(", ") : (isItalianPage() ? "contesto, azioni e risultato" : "context, actions, and result");
        if (isItalianPage()) {
            return (
                "Certo, te la spiego meglio: vorrei capire " +
                keyPart +
                ". Rispondi in modo semplice: situazione, cosa hai fatto tu e risultato finale."
            );
        }
        return (
            "Sure, let me clarify: I'd like to understand " +
            keyPart +
            ". Keep it simple: situation, what you did, and the final outcome."
        );
    }

    function randomRecruiterPushbackFlexible() {
        var msgs = isItalianPage()
            ? [
                "Questa risposta non e ancora centrata sulla domanda. Riprova in modo piu diretto.",
                "Non siamo ancora sul punto: prova a rispondere esattamente a cio che ti ho chiesto.",
                "Capisco, ma mi serve una risposta piu pertinente alla domanda.",
                "Siamo un po fuori traccia: puoi riformulare con un esempio in linea con la domanda?",
                "Proviamo ancora: dammi una risposta breve ma focalizzata su quello che ho chiesto."
            ]
            : [
                "This answer is still a bit off-topic. Try to address my question directly.",
                "We're not fully on point yet. Please answer exactly what I asked.",
                "I understand, but I need a more relevant answer to the question.",
                "We're slightly off track. Can you rephrase with a focused example?",
                "Let's try again: give me a concise answer focused on my question."
            ];
        return pickRotatingMessage(msgs);
    }

    async function fetchAiRecruiterReply(intent, questionText, answerText) {
        if (!interviewAiConfig.enabled || !interviewAiConfig.endpoint) return null;
        var ctrl = null;
        var timeoutId = null;
        try {
            if (typeof AbortController !== "undefined") {
                ctrl = new AbortController();
                timeoutId = setTimeout(function () {
                    try { ctrl.abort(); } catch (ignore) {}
                }, Math.max(1500, interviewAiConfig.timeoutMs || 7000));
            }
            var tail = transcript.slice(-6);
            var resp = await fetch(interviewAiConfig.endpoint, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "X-CSRFToken": getCsrfToken()
                },
                signal: ctrl ? ctrl.signal : undefined,
                body: JSON.stringify({
                    intent: intent,
                    question: questionText || "",
                    answer: answerText || "",
                    lang: (document.documentElement.lang || "en").toLowerCase(),
                    recruiter_gender: isRecruiterFemale() ? "female" : "male",
                    transcript_tail: tail
                })
            });
            if (!resp.ok) return null;
            var data = await resp.json();
            var reply = data && data.reply ? String(data.reply).trim() : "";
            return reply || null;
        } catch (e) {
            return null;
        } finally {
            if (timeoutId) clearTimeout(timeoutId);
        }
    }

    function buildBanks() {
        if (interviewQuestionsServer && interviewTipsServer) {
            questionBank = interviewQuestionsServer.slice();
            answerBank = interviewTipsServer.slice();
            return;
        }
        questionBank = [];
        answerBank = [];
    }

    function appendTranscript(line) {
        transcript.push(line);
    }

    var SVG_CARTOON_RECRUITER_MALE =
        '<svg class="interview-avatar-svg interview-avatar-svg--cartoon" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" width="44" height="44" focusable="false" aria-hidden="true">' +
        '<use href="#interview-cartoon-recruiter-male" xlink:href="#interview-cartoon-recruiter-male"/></svg>';
    var SVG_CARTOON_RECRUITER_FEMALE =
        '<svg class="interview-avatar-svg interview-avatar-svg--cartoon" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" width="44" height="44" focusable="false" aria-hidden="true">' +
        '<use href="#interview-cartoon-recruiter-female" xlink:href="#interview-cartoon-recruiter-female"/></svg>';

    /** Aggiorna avatar e intestazione di tutte le righe recruiter quando cambi uomo/donna. */
    function syncRecruiterRowsToCurrentGender() {
        if (!messagesEl) return;
        var meta = getRecruiterDisplayName();
        var fem = isRecruiterFemale();
        var avClass = fem
            ? "interview-avatar interview-avatar--recruiter-female"
            : "interview-avatar interview-avatar--recruiter-male";
        var svg = fem ? SVG_CARTOON_RECRUITER_FEMALE : SVG_CARTOON_RECRUITER_MALE;
        var rows = messagesEl.querySelectorAll(".interview-msg-row--recruiter");
        var i;
        for (i = 0; i < rows.length; i++) {
            var row = rows[i];
            var av = row.querySelector(".interview-avatar");
            if (av) {
                av.className = avClass;
                av.setAttribute("title", meta);
                av.innerHTML = svg;
            }
            var metaEl = row.querySelector(".interview-msg-meta--recruiter");
            if (metaEl) {
                metaEl.textContent = meta;
            }
        }
    }

    var SVG_AVATAR_USER =
        '<svg class="interview-avatar-svg" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="28" height="28" fill="currentColor" aria-hidden="true"><path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"/></svg>';
    var SVG_AVATAR_TIP =
        '<svg class="interview-avatar-svg" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="26" height="26" fill="currentColor" aria-hidden="true"><path d="M9 21c0 .55.45 1 1 1h4c.55 0 1-.45 1-1v-1H9v1zm3-19C8.14 2 5 5.14 5 9c0 2.38 1.19 4.47 3 5.74V17c0 .55.45 1 1 1h6c.55 0 1-.45 1-1v-2.26c1.81-1.27 3-3.36 3-5.74 0-3.86-3.14-7-7-7z"/></svg>';

    function recruiterRow(htmlBody, metaOptional) {
        var meta = metaOptional != null && metaOptional !== "" ? metaOptional : getRecruiterDisplayName();
        var avClass = isRecruiterFemale()
            ? "interview-avatar interview-avatar--recruiter-female"
            : "interview-avatar interview-avatar--recruiter-male";
        var h =
            '<div class="interview-msg-row interview-msg-row--recruiter">' +
            '<div class="' +
            avClass +
            '" title="' +
            escapeHtml(meta) +
            '" aria-hidden="true">' +
            (isRecruiterFemale() ? SVG_CARTOON_RECRUITER_FEMALE : SVG_CARTOON_RECRUITER_MALE) +
            "</div>" +
            '<div class="interview-bubble interview-bubble--recruiter">' +
            '<div class="interview-msg-meta interview-msg-meta--recruiter">' +
            escapeHtml(meta) +
            "</div>" +
            '<div class="interview-bubble-body">' +
            htmlBody +
            "</div></div></div>";
        messagesEl.insertAdjacentHTML("beforeend", h);
        messagesEl.scrollTop = messagesEl.scrollHeight;
    }

    function userRow(text) {
        var meta = lbl("you", "You");
        var h =
            '<div class="interview-msg-row interview-msg-row--user">' +
            '<div class="interview-bubble interview-bubble--user">' +
            '<div class="interview-msg-meta interview-msg-meta--user">' +
            escapeHtml(meta) +
            "</div>" +
            '<div class="interview-bubble-body">' +
            escapeHtml(text) +
            "</div></div>" +
            '<div class="interview-avatar interview-avatar--user" title="' +
            escapeHtml(meta) +
            '" aria-hidden="true">' +
            SVG_AVATAR_USER +
            "</div></div>";
        messagesEl.insertAdjacentHTML("beforeend", h);
        messagesEl.scrollTop = messagesEl.scrollHeight;
    }

    function tipRow(text) {
        var meta = lbl("suggestedImprovement", "Suggested improvement");
        var h =
            '<div class="interview-msg-row interview-msg-row--tip">' +
            '<div class="interview-avatar interview-avatar--tip" title="' +
            escapeHtml(meta) +
            '" aria-hidden="true">' +
            SVG_AVATAR_TIP +
            "</div>" +
            '<div class="interview-bubble interview-bubble--tip">' +
            '<div class="interview-msg-meta interview-msg-meta--tip">' +
            escapeHtml(meta) +
            "</div>" +
            '<div class="interview-bubble-body">' +
            escapeHtml(text) +
            "</div></div></div>";
        messagesEl.insertAdjacentHTML("beforeend", h);
        messagesEl.scrollTop = messagesEl.scrollHeight;
    }

    function setInputEnabled(on) {
        if (inputEl) inputEl.disabled = !on;
        awaitingAnswer = on;
    }

    function pushQuestion(qi) {
        var q = questionBank[qi];
        recruiterRow("<p>" + escapeHtml(q).replace(/\n/g, "<br>") + "</p>");
        appendTranscript(getRecruiterDisplayName() + ": " + q);
        speakRecruiterText(q);
    }

    function startInterview() {
        buildBanks();
        if (!questionBank.length) {
            showInlineError(
                lbl(
                    "loadError",
                    "Could not load interview questions. Please reload the page."
                )
            );
            return;
        }
        if (window.speechSynthesis) {
            try {
                speechSynthesis.cancel();
            } catch (e) {}
        }
        messagesEl.innerHTML = "";
        transcript = [];
        order = shuffleIndices(questionBank.length);
        currentIndex = 0;
        finished = false;
        clearInlineError();
        if (inputEl) {
            inputEl.value = "";
            resizeAnswerField();
        }

        var role = roleInput ? v(roleInput) : "";
        var level = levelInput && v(levelInput) ? v(levelInput) : "";
        var focusRaw = focusInput ? v(focusInput) : "";
        if (role || level || focusRaw) {
            var parts = [];
            if (role) parts.push(lbl("role", "Role") + ": " + role);
            if (level) parts.push(lbl("level", "Level") + ": " + level);
            if (focusRaw) parts.push(lbl("focusAreas", "Focus areas") + ": " + focusRaw);
            appendTranscript(parts.join(" · "));
            appendTranscript("");
        }

        pushQuestion(order[currentIndex]);
        setInputEnabled(true);
        if (inputEl) inputEl.focus();
    }

    function finishInterview() {
        finished = true;
        setInputEnabled(false);
        var endMsg = lbl("lastQuestionThanks", "That was the last question. Thanks for practicing!");
        recruiterRow("<p>" + escapeHtml(endMsg) + "</p>");
        appendTranscript(getRecruiterDisplayName() + ": " + endMsg);
        speakRecruiterText(endMsg);
    }

    async function submitAnswer() {
        if (!awaitingAnswer || finished) return;
        var text = inputEl ? inputEl.value.trim() : "";
        if (!text) {
            showInlineError(lbl("pleaseWriteAnswer", "Please write an answer before sending."));
            return;
        }
        clearInlineError();

        var qi = order[currentIndex];
        var qtext = questionBank[qi];

        if (userAskedRecruiterQuestion(text)) {
            userRow(text);
            appendTranscript(lbl("you", "You") + ": " + text);
            var recruiterAnswer = null;
            if (isClarificationRequest(text)) {
                recruiterAnswer = await fetchAiRecruiterReply("clarify", qtext, text);
                recruiterAnswer = recruiterAnswer || recruiterClarifyCurrentQuestion(qtext);
            } else {
                recruiterAnswer = await fetchAiRecruiterReply("reply_candidate_question", qtext, text);
                recruiterAnswer = recruiterAnswer || recruiterReplyToCandidateQuestion();
            }
            recruiterRow("<p>" + escapeHtml(recruiterAnswer).replace(/\n/g, "<br>") + "</p>");
            appendTranscript(getRecruiterDisplayName() + ": " + recruiterAnswer);
            speakRecruiterText(recruiterAnswer);
            var promptBack = isItalianPage()
                ? "Quando vuoi, rispondi a questa domanda: " + qtext
                : "When you're ready, answer this question: " + qtext;
            recruiterRow("<p>" + escapeHtml(promptBack).replace(/\n/g, "<br>") + "</p>");
            appendTranscript(getRecruiterDisplayName() + ": " + promptBack);
            speakRecruiterText(promptBack);
            if (inputEl) {
                inputEl.value = "";
                resizeAnswerField();
                inputEl.focus();
            }
            return;
        }

        if (isUncertainAnswer(text)) {
            userRow(text);
            appendTranscript(lbl("you", "You") + ": " + text);
            var supportMsg = await fetchAiRecruiterReply("encouragement", qtext, text);
            supportMsg = supportMsg || recruiterEncouragement();
            recruiterRow("<p>" + escapeHtml(supportMsg).replace(/\n/g, "<br>") + "</p>");
            appendTranscript(getRecruiterDisplayName() + ": " + supportMsg);
            speakRecruiterText(supportMsg);
            if (inputEl) {
                inputEl.value = "";
                resizeAnswerField();
                inputEl.focus();
            }
            return;
        }

        if (!isAnswerCoherent(qtext, text)) {
            userRow(text);
            appendTranscript(lbl("you", "You") + ": " + text);
            var pushMsg = await fetchAiRecruiterReply("feedback", qtext, text);
            pushMsg = pushMsg || randomRecruiterPushbackFlexible() || randomRecruiterPushback();
            recruiterRow("<p>" + escapeHtml(pushMsg).replace(/\n/g, "<br>") + "</p>");
            appendTranscript(getRecruiterDisplayName() + ": " + pushMsg);
            speakRecruiterText(pushMsg);
            if (inputEl) {
                inputEl.value = "";
                resizeAnswerField();
            }
            if (inputEl) inputEl.focus();
            return;
        }

        userRow(text);
        appendTranscript(lbl("you", "You") + ": " + text);

        var tip = answerBank[qi];
        tipRow(tip);
        appendTranscript(lbl("suggestedImprovement", "Suggested improvement") + ": " + tip);

        if (inputEl) {
            inputEl.value = "";
            resizeAnswerField();
        }
        currentIndex += 1;

        if (currentIndex >= order.length) {
            finishInterview();
            return;
        }
        pushQuestion(order[currentIndex]);
        if (inputEl) inputEl.focus();
    }

    if (readAloudEl) {
        readAloudEl.addEventListener("change", function () {
            if (!readAloudEl.checked || !messagesEl) return;
            var lastRecruiterBubble = messagesEl.querySelector(".interview-msg-row--recruiter:last-child .interview-bubble-body");
            if (!lastRecruiterBubble) return;
            var txt = (lastRecruiterBubble.textContent || "").trim();
            if (txt) speakRecruiterText(txt);
        });
    }

    if (inputEl) {
        inputEl.addEventListener("input", function () {
            resizeAnswerField();
        });
        inputEl.addEventListener("keydown", function (e) {
            if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                submitAnswer();
            }
        });
    }

    if (btnRestart) {
        btnRestart.addEventListener("click", function () {
            startInterview();
        });
    }

    if (btnExport) {
        btnExport.addEventListener("click", function () {
            var t = transcript.join("\n\n");
            if (!t) return;
            navigator.clipboard.writeText(t).then(function () {
                var prev = btnExport.textContent;
                btnExport.classList.add("copied");
                btnExport.textContent = lbl("copied", "Copied!");
                setTimeout(function () {
                    btnExport.textContent = prev;
                    btnExport.classList.remove("copied");
                }, 1600);
            });
        });
    }

    initSpeechSynthVoices();

    function onRecruiterGenderChange() {
        tryStartInterviewAfterGenderChoice();
        syncRecruiterRowsToCurrentGender();
    }

    var maleR = document.getElementById("interview-recruiter-male");
    var femR = document.getElementById("interview-recruiter-female");
    if (maleR) {
        maleR.addEventListener("change", onRecruiterGenderChange);
    }
    if (femR) {
        femR.addEventListener("change", onRecruiterGenderChange);
    }

    if (settingsToggleEl && settingsContentEl && settingsSectionEl) {
        settingsToggleEl.addEventListener("click", function () {
            var expanded = settingsToggleEl.getAttribute("aria-expanded") === "true";
            var next = !expanded;
            settingsToggleEl.setAttribute("aria-expanded", next ? "true" : "false");
            settingsContentEl.hidden = !next;
            settingsSectionEl.classList.toggle("is-open", next);
        });
    }
})();
