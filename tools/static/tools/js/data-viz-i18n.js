(function (global) {
    var VIZ_LABEL_I18N = {
        "January": { en: "January", it: "Gennaio" },
        "February": { en: "February", it: "Febbraio" },
        "March": { en: "March", it: "Marzo" },
        "April": { en: "April", it: "Aprile" },
        "May": { en: "May", it: "Maggio" },
        "June": { en: "June", it: "Giugno" },
        "Label": { en: "Label", it: "Etichetta" },
        "Planned": { en: "Planned", it: "Pianificato" },
        "Actual": { en: "Actual", it: "Effettivo" },
        "Yes": { en: "Yes", it: "Sì" },
        "No": { en: "No", it: "No" },
        "Maybe": { en: "Maybe", it: "Forse" },
        "No answer": { en: "No answer", it: "Nessuna risposta" },
        "Other": { en: "Other", it: "Altro" },
        "Value": { en: "Value", it: "Valore" },
        "Monthly sales": { en: "Monthly sales", it: "Vendite mensili" },
        "Budget vs actual": { en: "Budget vs actual", it: "Budget vs effettivi" },
        "Survey results": { en: "Survey results", it: "Risultati sondaggio" }
    };

    function currentVizLangCode() {
        var lang = (document.documentElement.lang || "en").toLowerCase();
        return lang.indexOf("it") === 0 ? "it" : "en";
    }

    function labelForMsgid(msgid) {
        var pair = VIZ_LABEL_I18N[msgid];
        if (!pair) return msgid;
        return currentVizLangCode() === "it" ? pair.it : pair.en;
    }

    function getVizLabelLookup() {
        var lookup = Object.create(null);
        Object.keys(VIZ_LABEL_I18N).forEach(function(msgid) {
            var localized = labelForMsgid(msgid);
            var pair = VIZ_LABEL_I18N[msgid];
            lookup[msgid] = localized;
            if (pair.en) lookup[pair.en] = localized;
            if (pair.it) lookup[pair.it] = localized;
        });
        return lookup;
    }

    function getVizExamples() {
        return {
            sales: {
                label: labelForMsgid("Monthly sales"),
                data: labelForMsgid("January") + ",120\n" +
                    labelForMsgid("February") + ",190\n" +
                    labelForMsgid("March") + ",80\n" +
                    labelForMsgid("April") + ",20\n" +
                    labelForMsgid("May") + ",150\n" +
                    labelForMsgid("June") + ",210"
            },
            budget: {
                label: labelForMsgid("Budget vs actual"),
                data: labelForMsgid("Label") + "," + labelForMsgid("Planned") + "," + labelForMsgid("Actual") +
                    "\nMarketing,5000,4800\nR&D,12000,12500\nSales,8000,7200\nSupport,3000,3100"
            },
            survey: {
                label: labelForMsgid("Survey results"),
                data: labelForMsgid("Yes") + ",45\n" +
                    labelForMsgid("No") + ",30\n" +
                    labelForMsgid("Maybe") + ",15\n" +
                    labelForMsgid("No answer") + ",10"
            }
        };
    }

    function translateVizToken(token, lookup) {
        var trimmed = String(token || "").trim();
        if (!trimmed) return token;
        return lookup[trimmed] != null ? lookup[trimmed] : token;
    }

    function translateVizCsvData(data, lookup) {
        if (!data) return data;
        return String(data).split("\n").map(function(line) {
            if (!line.trim()) return line;
            return line.split(",").map(function(cell) {
                return translateVizToken(cell, lookup);
            }).join(",");
        }).join("\n");
    }

    function exampleDataSignature(data) {
        var lines = String(data || "").trim().split(/\n+/).filter(function(line) {
            return line.trim();
        });
        if (!lines.length) return "";
        return lines.map(function(line, index) {
            var parts = line.split(",");
            if (parts.length <= 1) return line.trim();
            var valueParts = parts.slice(1);
            var allNumeric = valueParts.length > 0 && valueParts.every(function(part) {
                return part.trim() !== "" && !isNaN(parseFloat(part.trim()));
            });
            if (index === 0 && parts.length > 2 && !allNumeric) {
                return "H" + parts.length;
            }
            if (parts.length > 2) {
                return valueParts.join(",");
            }
            return parts[parts.length - 1].trim();
        }).join("|");
    }

    function detectExampleKey(data) {
        var sig = exampleDataSignature(data);
        if (!sig) return "";
        var found = "";
        var examples = getVizExamples();
        Object.keys(examples).forEach(function(key) {
            if (exampleDataSignature(examples[key].data) === sig) found = key;
        });
        return found;
    }

    function localizeVizState(state) {
        if (!state) return state;
        var localized = Object.assign({}, state);
        var examples = getVizExamples();
        var key = localized.exampleKey || detectExampleKey(localized.data);
        if (key && examples[key]) {
            localized.data = examples[key].data;
            localized.title = examples[key].label;
            localized.exampleKey = key;
            return localized;
        }
        var lookup = getVizLabelLookup();
        if (localized.data) localized.data = translateVizCsvData(localized.data, lookup);
        if (localized.title != null && String(localized.title).trim() !== "") {
            localized.title = translateVizToken(String(localized.title), lookup);
        }
        localized.exampleKey = key || "";
        return localized;
    }

    global.gadlyLocalizeVizState = localizeVizState;
    global.gadlyDetectVizExampleKey = detectExampleKey;
    global.gadlyGetVizExamples = getVizExamples;
})(window);
