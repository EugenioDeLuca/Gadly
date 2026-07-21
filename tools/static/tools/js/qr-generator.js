document.addEventListener("DOMContentLoaded", function() {
    var isItalian = (document.documentElement.lang || "").toLowerCase().indexOf("it") === 0;
    function t(it, en) { return isItalian ? it : en; }

    var input = document.getElementById("qr-input");
    var urlInput = document.getElementById("qr-url-input");
    var wifiSsid = document.getElementById("qr-wifi-ssid");
    var wifiPassword = document.getElementById("qr-wifi-password");
    var wifiSecurityWrap = document.getElementById("qr-wifi-security-wrap");
    var wifiHidden = document.getElementById("qr-wifi-hidden");
    var vcardFirst = document.getElementById("qr-vcard-first");
    var vcardLast = document.getElementById("qr-vcard-last");
    var vcardPhone = document.getElementById("qr-vcard-phone");
    var vcardEmail = document.getElementById("qr-vcard-email");
    var vcardOrg = document.getElementById("qr-vcard-org");
    var vcardTitle = document.getElementById("qr-vcard-title");

    var btn = document.getElementById("generate-qr");
    var output = document.getElementById("qr-output");
    var resultDiv = document.getElementById("qr-result");
    var downloadPngBtn = document.getElementById("download-qr-png");
    var downloadSvgBtn = document.getElementById("download-qr-svg");
    var copyImageBtn = document.getElementById("copy-qr-image");
    var fileInput = document.getElementById("file-upload");
    var resultArea = document.getElementById("qr-result-area");
    var colorDark = document.getElementById("color-dark");
    var colorLight = document.getElementById("color-light");
    var qrSizeWrap = document.getElementById("qr-size-wrap");
    var qrMarginWrap = document.getElementById("qr-margin-wrap");
    var qrEcWrap = document.getElementById("qr-ec-wrap");

    var activeType = "text";
    var refreshTimer = null;
    var lastRender = null;
    var lastGeneratedPayload = null;
    var loadedFilePayload = null;
    var loadedFileLabel = null;
    var loadedFileWrap = document.getElementById("qr-loaded-file");
    var loadedFileNameEl = loadedFileWrap ? loadedFileWrap.querySelector(".qr-loaded-file-name") : null;
    var loadedFileRemoveBtn = document.getElementById("qr-loaded-file-remove");

    var PDF_QR_MAX_BYTES = 2100;
    var PDF_QR_MAX_DATA_URL_LENGTH = 2950;
    var MOBILE_QR_MQ = window.matchMedia("(max-width: 768px)");
    var MOBILE_QR_STORAGE_KEY = "gadly-qr-mobile-state-v1";
    var MOBILE_QR_RESTORE_FLAG_KEY = "gadly-qr-mobile-restore-form-v1";
    var MOBILE_QR_TYPE_TAP_MS = 180;
    var mobileTypeCardNavTimer = null;
    var mobileTypeCardNavLock = false;
    var mobileBackNavTimer = null;
    var mobileBackNavLock = false;
    var MOBILE_QR_TYPES = ["text", "url", "wifi", "vcard"];
    var mobileBackBtn = document.getElementById("qr-mobile-back");

    function isMobileQrLayout() {
        return MOBILE_QR_MQ.matches;
    }

    function isValidMobileQrType(type) {
        return MOBILE_QR_TYPES.indexOf(type) !== -1;
    }

    function isMobileQrPageReload() {
        try {
            var nav = performance.getEntriesByType("navigation")[0];
            return !!(nav && nav.type === "reload");
        } catch (e) {
            return false;
        }
    }

    function clearMobileQrRestoreFlag() {
        try {
            sessionStorage.removeItem(MOBILE_QR_RESTORE_FLAG_KEY);
        } catch (e) { /* ignore */ }
    }

    function shouldRestoreMobileQrForm(state) {
        if (!state || state.step !== "form") return false;
        if (isMobileQrPageReload()) return true;
        try {
            return sessionStorage.getItem(MOBILE_QR_RESTORE_FLAG_KEY) === "1";
        } catch (e) {
            return false;
        }
    }

    function bindMobileQrLangPreserve() {
        document.querySelectorAll(".header-lang-form").forEach(function(form) {
            if (form.dataset.qrMobileLangBound === "1") return;
            form.dataset.qrMobileLangBound = "1";
            form.addEventListener("submit", function() {
                if (!isMobileQrLayout()) return;
                if (!document.body.classList.contains("qr-mobile--form")) return;
                try {
                    sessionStorage.setItem(MOBILE_QR_RESTORE_FLAG_KEY, "1");
                } catch (e) { /* ignore */ }
            });
        });
    }

    function saveMobileQrState() {
        if (!isMobileQrLayout()) return;
        try {
            var step = document.body.classList.contains("qr-mobile--form") ? "form" : "pick";
            sessionStorage.setItem(MOBILE_QR_STORAGE_KEY, JSON.stringify({
                step: step,
                type: activeType
            }));
        } catch (e) { /* ignore */ }
    }

    function loadMobileQrState() {
        try {
            var raw = sessionStorage.getItem(MOBILE_QR_STORAGE_KEY);
            if (!raw) return null;
            var state = JSON.parse(raw);
            if (!state || !isValidMobileQrType(state.type)) return null;
            if (state.step !== "form" && state.step !== "pick") return null;
            return state;
        } catch (e) {
            return null;
        }
    }

    function updateMobileToolDesc() {
        var isForm = document.body.classList.contains("qr-mobile--form");
        document.querySelectorAll(".tool-desc--mobile").forEach(function(el) {
            if (!isMobileQrLayout()) {
                el.hidden = true;
                return;
            }
            el.hidden = !isForm || el.dataset.type !== activeType;
        });
    }

    function setMobileQrStep(step) {
        if (mobileTypeCardNavTimer) {
            clearTimeout(mobileTypeCardNavTimer);
            mobileTypeCardNavTimer = null;
        }
        mobileTypeCardNavLock = false;
        if (mobileBackNavTimer) {
            clearTimeout(mobileBackNavTimer);
            mobileBackNavTimer = null;
        }
        mobileBackNavLock = false;
        document.querySelectorAll(".qr-mobile-type-card.tap-active").forEach(function(card) {
            card.classList.remove("tap-active");
        });
        if (mobileBackBtn) {
            mobileBackBtn.classList.remove("tap-active");
        }
        document.body.classList.remove("qr-mobile--pick-type", "qr-mobile--form");
        if (step === "pick") {
            clearMobileQrRestoreFlag();
            document.body.classList.add("qr-mobile--pick-type");
            document.documentElement.classList.remove("qr-gen-mobile-boot", "qr-gen-mobile-form-pending");
        } else if (step === "form") {
            document.body.classList.add("qr-mobile--form");
            document.documentElement.classList.remove("qr-gen-mobile-boot", "qr-gen-mobile-form-pending");
        }
        if (mobileBackBtn) {
            mobileBackBtn.hidden = step !== "form";
        }
        updateMobileToolDesc();
        saveMobileQrState();
    }

    function restoreMobileQrLayout() {
        if (!isMobileQrLayout()) return;
        var state = loadMobileQrState();
        if (shouldRestoreMobileQrForm(state)) {
            clearMobileQrRestoreFlag();
            setActiveType(state.type);
            setMobileQrStep("form");
            return;
        }
        clearMobileQrRestoreFlag();
        setMobileQrStep("pick");
    }

    function syncMobileQrLayout() {
        if (!isMobileQrLayout()) {
            document.body.classList.remove("qr-mobile--pick-type", "qr-mobile--form");
            if (mobileBackBtn) mobileBackBtn.hidden = true;
            placeErrorArea();
            return;
        }
        restoreMobileQrLayout();
        placeErrorArea();
    }

    function openMobileQrForm(type) {
        setActiveType(type);
        setMobileQrStep("form");
        window.scrollTo(0, 0);
    }

    function openMobileQrFormFromTypeCard(type, card) {
        if (!type) return;
        if (!isMobileQrLayout()) {
            openMobileQrForm(type);
            return;
        }
        if (mobileTypeCardNavLock) return;
        mobileTypeCardNavLock = true;
        if (mobileTypeCardNavTimer) {
            clearTimeout(mobileTypeCardNavTimer);
            mobileTypeCardNavTimer = null;
        }
        if (card && card.classList) {
            card.classList.add("tap-active");
        }
        mobileTypeCardNavTimer = window.setTimeout(function() {
            mobileTypeCardNavTimer = null;
            mobileTypeCardNavLock = false;
            if (card && card.classList) {
                card.classList.remove("tap-active");
            }
            openMobileQrForm(type);
        }, MOBILE_QR_TYPE_TAP_MS);
    }

    function closeMobileQrFormFromBackBtn() {
        if (!isMobileQrLayout()) {
            setMobileQrStep("pick");
            window.scrollTo(0, 0);
            return;
        }
        if (mobileBackNavLock) return;
        mobileBackNavLock = true;
        if (mobileBackNavTimer) {
            clearTimeout(mobileBackNavTimer);
            mobileBackNavTimer = null;
        }
        if (mobileBackBtn && mobileBackBtn.classList) {
            mobileBackBtn.classList.add("tap-active");
        }
        mobileBackNavTimer = window.setTimeout(function() {
            mobileBackNavTimer = null;
            mobileBackNavLock = false;
            if (mobileBackBtn && mobileBackBtn.classList) {
                mobileBackBtn.classList.remove("tap-active");
            }
            setMobileQrStep("pick");
            window.scrollTo(0, 0);
        }, MOBILE_QR_TYPE_TAP_MS);
    }

    function getQrSize() {
        return parseInt(qrSizeWrap ? qrSizeWrap.dataset.value : "256", 10);
    }

    function getMarginModules() {
        return parseInt(qrMarginWrap ? qrMarginWrap.dataset.value : "4", 10) || 0;
    }

    function getCorrectLevel() {
        var val = qrEcWrap ? qrEcWrap.dataset.value : "L";
        return QRCode.CorrectLevel[val] || QRCode.CorrectLevel.L;
    }

    function getWifiSecurity() {
        return wifiSecurityWrap ? wifiSecurityWrap.dataset.value : "WPA";
    }

    function syncWifiPasswordField() {
        if (!wifiPassword) return;
        var noPass = getWifiSecurity() === "nopass";
        wifiPassword.disabled = noPass;
        wifiPassword.setAttribute("aria-disabled", noPass ? "true" : "false");
        if (noPass) {
            wifiPassword.value = "";
        }
    }

    function escapeWifiValue(str) {
        return String(str || "").replace(/([\\;,:"])/g, "\\$1");
    }

    function escapeVcardValue(str) {
        return String(str || "").replace(/\\/g, "\\\\").replace(/;/g, "\\;").replace(/,/g, "\\,").replace(/\n/g, "\\n");
    }

    function normalizeUrl(raw) {
        var url = (raw || "").trim();
        if (!url) return "";
        if (!/^https?:\/\//i.test(url)) url = "https://" + url;
        return url;
    }

    function buildVcardPayload() {
        var first = (vcardFirst && vcardFirst.value.trim()) || "";
        var last = (vcardLast && vcardLast.value.trim()) || "";
        var phone = (vcardPhone && vcardPhone.value.trim()) || "";
        var email = (vcardEmail && vcardEmail.value.trim()) || "";
        var org = (vcardOrg && vcardOrg.value.trim()) || "";
        var title = (vcardTitle && vcardTitle.value.trim()) || "";
        var fullName = (first + " " + last).trim();

        if (!fullName && !org && !phone && !email) return "";

        var lines = ["BEGIN:VCARD", "VERSION:3.0"];
        if (fullName) lines.push("FN:" + escapeVcardValue(fullName));
        if (last || first) lines.push("N:" + escapeVcardValue(last) + ";" + escapeVcardValue(first) + ";;;");
        if (org) lines.push("ORG:" + escapeVcardValue(org));
        if (title) lines.push("TITLE:" + escapeVcardValue(title));
        if (phone) lines.push("TEL;TYPE=CELL:" + escapeVcardValue(phone));
        if (email) lines.push("EMAIL;TYPE=INTERNET:" + escapeVcardValue(email));
        lines.push("END:VCARD");
        return lines.join("\n");
    }

    function buildPayload() {
        switch (activeType) {
            case "text":
                if (loadedFilePayload) return loadedFilePayload;
                return input ? input.value.trim() : "";
            case "url":
                return normalizeUrl(urlInput ? urlInput.value : "");
            case "wifi": {
                var ssid = wifiSsid ? wifiSsid.value.trim() : "";
                if (!ssid) return "";
                var security = getWifiSecurity();
                var pass = wifiPassword ? wifiPassword.value : "";
                var hidden = wifiHidden && wifiHidden.checked ? "H:true;" : "";
                return "WIFI:T:" + security + ";S:" + escapeWifiValue(ssid) + ";P:" + escapeWifiValue(pass) + ";" + hidden + ";";
            }
            case "vcard":
                return buildVcardPayload();
            default:
                return "";
        }
    }

    function emptyMessage() {
        switch (activeType) {
            case "url":
                return t("Inserisci un URL", "Please enter a URL");
            case "wifi":
                return t("Inserisci il nome della rete Wi-Fi", "Please enter the Wi-Fi network name");
            case "vcard":
                return t("Inserisci almeno nome, organizzazione, telefono o email", "Please enter at least a name, organization, phone, or email");
            default:
                return t("Inserisci del testo, oppure carica un file", "Please enter some text, or load a file");
        }
    }

    function showError(msg) {
        if (!resultArea) return;
        resultArea.textContent = (msg || "").replace(/\.$/, "");
        resultArea.classList.remove("hidden");
        resultArea.classList.add("error");
        resultArea.style.display = "block";
        resultArea.scrollIntoView({ behavior: "smooth", block: "nearest" });
    }

    function hideError() {
        if (!resultArea) return;
        resultArea.textContent = "";
        resultArea.classList.remove("error");
        resultArea.classList.add("hidden");
        resultArea.style.display = "";
    }

    function escapeXml(str) {
        return String(str || "")
            .replace(/&/g, "&amp;")
            .replace(/</g, "&lt;")
            .replace(/>/g, "&gt;")
            .replace(/"/g, "&quot;");
    }

    function renderQrToCanvas(text) {
        if (typeof QRCode === "undefined") {
            throw new Error(t("Libreria QR non caricata. Aggiorna la pagina", "QR library not loaded. Please refresh the page"));
        }

        var size = getQrSize();
        var dark = colorDark.value || "#003f7f";
        var light = colorLight.value || "#ffffff";
        var marginModules = getMarginModules();

        var temp = document.createElement("div");
        temp.setAttribute("aria-hidden", "true");
        temp.style.cssText = "position:absolute;left:-9999px;top:0;width:0;height:0;overflow:hidden;";
        document.body.appendChild(temp);

        var qr;
        try {
            qr = new QRCode(temp, {
                text: text,
                width: size,
                height: size,
                colorDark: dark,
                colorLight: light,
                correctLevel: getCorrectLevel()
            });
        } catch (err) {
            document.body.removeChild(temp);
            throw err;
        }

        var model = qr._oQRCode;
        var moduleCount = model.getModuleCount();
        var cellSize = size / moduleCount;
        var marginPx = marginModules * cellSize;
        var totalSize = Math.round(size + marginPx * 2);

        var outCanvas = document.createElement("canvas");
        outCanvas.width = totalSize;
        outCanvas.height = totalSize;
        var ctx = outCanvas.getContext("2d");
        ctx.fillStyle = light;
        ctx.fillRect(0, 0, totalSize, totalSize);

        var innerCanvas = temp.querySelector("canvas");
        if (innerCanvas) {
            ctx.drawImage(innerCanvas, marginPx, marginPx, size, size);
        } else {
            for (var row = 0; row < moduleCount; row++) {
                for (var col = 0; col < moduleCount; col++) {
                    ctx.fillStyle = model.isDark(row, col) ? dark : light;
                    ctx.fillRect(
                        marginPx + col * cellSize,
                        marginPx + row * cellSize,
                        cellSize,
                        cellSize
                    );
                }
            }
        }

        document.body.removeChild(temp);

        output.innerHTML = "";
        output.appendChild(outCanvas);
        resultDiv.classList.add("show");

        lastRender = {
            model: model,
            text: text,
            moduleCount: moduleCount,
            marginModules: marginModules,
            totalSize: totalSize,
            colorDark: dark,
            colorLight: light
        };
    }

    function buildSvgString() {
        if (!lastRender || !lastRender.model) return null;

        var model = lastRender.model;
        var m = lastRender.moduleCount;
        var margin = lastRender.marginModules;
        var total = m + margin * 2;
        var parts = [
            '<?xml version="1.0" encoding="UTF-8"?>',
            '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ' + total + " " + total + '" width="' + lastRender.totalSize + '" height="' + lastRender.totalSize + '">',
            '<rect width="' + total + '" height="' + total + '" fill="' + escapeXml(lastRender.colorLight) + '"/>'
        ];

        for (var row = 0; row < m; row++) {
            for (var col = 0; col < m; col++) {
                if (model.isDark(row, col)) {
                    parts.push(
                        '<rect x="' + (col + margin) + '" y="' + (row + margin) + '" width="1" height="1" fill="' + escapeXml(lastRender.colorDark) + '"/>'
                    );
                }
            }
        }
        parts.push("</svg>");
        return parts.join("");
    }

    function generateQr(showErrors) {
        var text = buildPayload();
        if (!text) {
            if (showErrors) showError(emptyMessage());
            resultDiv.classList.remove("show");
            output.innerHTML = "";
            lastGeneratedPayload = null;
            lastRender = null;
            return false;
        }
        hideError();
        try {
            renderQrToCanvas(text);
            lastGeneratedPayload = text;
            return true;
        } catch (e) {
            if (showErrors) {
                var errText = String(e.message || e);
                if (loadedFilePayload && /too long/i.test(errText)) {
                    showError(pdfTooLargeMessage());
                } else {
                    showError(t("Errore durante la generazione del QR code", "Error generating QR code") + ": " + errText);
                }
            }
            resultDiv.classList.remove("show");
            lastGeneratedPayload = null;
            lastRender = null;
            return false;
        }
    }

    function refreshGeneratedQr() {
        if (!lastGeneratedPayload) return;
        if (refreshTimer) clearTimeout(refreshTimer);
        refreshTimer = setTimeout(function() {
            try {
                renderQrToCanvas(lastGeneratedPayload);
                hideError();
            } catch (e) {
                /* keep last successful render on option tweak errors */
            }
        }, 200);
    }

    function clearGeneratedQr() {
        if (refreshTimer) {
            clearTimeout(refreshTimer);
            refreshTimer = null;
        }
        lastGeneratedPayload = null;
        lastRender = null;
        output.innerHTML = "";
        resultDiv.classList.remove("show");
        hideError();
    }

    function placeErrorArea() {
        if (!resultArea) return;
        var slot;
        if (isMobileQrLayout()) {
            slot = document.querySelector(".qr-error-slot--actions");
        } else {
            var panel = document.querySelector(".qr-panel--active");
            slot = panel && panel.querySelector(".qr-error-slot:not(.qr-error-slot--actions)");
        }
        if (slot) slot.appendChild(resultArea);
    }

    function setActiveType(type) {
        if (type !== activeType) {
            clearGeneratedQr();
        }
        activeType = type;
        document.querySelectorAll(".qr-type-tab").forEach(function(tab) {
            var isActive = tab.dataset.type === type;
            tab.classList.toggle("active", isActive);
            tab.setAttribute("aria-selected", isActive ? "true" : "false");
        });
        document.querySelectorAll(".qr-panel").forEach(function(panel) {
            var isActive = panel.dataset.panel === type;
            panel.classList.toggle("qr-panel--active", isActive);
            if (isActive) {
                panel.removeAttribute("hidden");
            } else {
                panel.setAttribute("hidden", "");
            }
        });
        placeErrorArea();
        updateMobileToolDesc();
    }

    placeErrorArea();

    document.querySelectorAll(".qr-type-tab").forEach(function(tab) {
        tab.addEventListener("click", function() {
            setActiveType(tab.dataset.type);
        });
    });

    document.querySelectorAll(".qr-mobile-type-card").forEach(function(card) {
        card.addEventListener("click", function() {
            openMobileQrFormFromTypeCard(card.dataset.type, card);
        });
    });

    if (mobileBackBtn) {
        mobileBackBtn.addEventListener("click", function() {
            closeMobileQrFormFromBackBtn();
        });
    }

    bindMobileQrLangPreserve();
    syncMobileQrLayout();
    if (typeof MOBILE_QR_MQ.addEventListener === "function") {
        MOBILE_QR_MQ.addEventListener("change", syncMobileQrLayout);
    } else if (typeof MOBILE_QR_MQ.addListener === "function") {
        MOBILE_QR_MQ.addListener(syncMobileQrLayout);
    }

    document.querySelectorAll(".qr-custom-select").forEach(function(wrap) {
        var trigger = wrap.querySelector(".qr-select-trigger");
        var menu = wrap.querySelector(".qr-select-menu");
        if (!trigger || !menu) return;
        menu.querySelectorAll("li").forEach(function(li) {
            li.addEventListener("click", function() {
                wrap.dataset.value = li.dataset.value;
                trigger.textContent = li.textContent;
                menu.querySelectorAll("li").forEach(function(l) { l.classList.remove("selected"); });
                li.classList.add("selected");
                wrap.classList.remove("open");
                if (wrap === wifiSecurityWrap) {
                    syncWifiPasswordField();
                }
                refreshGeneratedQr();
            });
        });
        trigger.addEventListener("click", function(e) {
            e.stopPropagation();
            var wasOpen = wrap.classList.contains("open");
            document.querySelectorAll(".qr-custom-select.open").forEach(function(s) { s.classList.remove("open"); });
            if (!wasOpen) {
                wrap.classList.add("open");
            }
        });
        menu.addEventListener("click", function(e) {
            e.stopPropagation();
        });
    });

    document.addEventListener("click", function(e) {
        if (e.target && e.target.closest && e.target.closest(".qr-custom-select .qr-select-trigger")) {
            return;
        }
        document.querySelectorAll(".qr-custom-select.open").forEach(function(s) { s.classList.remove("open"); });
    });

    syncWifiPasswordField();

    var suppressPresetColorInputClear = false;

    function applyQrPreset(presetBtn) {
        if (!presetBtn || !presetBtn.dataset || !presetBtn.dataset.dark) return;
        suppressPresetColorInputClear = true;
        try {
            colorDark.value = presetBtn.dataset.dark;
            colorLight.value = presetBtn.dataset.light;
        } finally {
            suppressPresetColorInputClear = false;
        }
        document.querySelectorAll(".qr-preset").forEach(function(b) { b.classList.remove("selected"); });
        presetBtn.classList.add("selected");
        refreshGeneratedQr();
    }

    document.querySelectorAll(".qr-preset").forEach(function(presetBtn) {
        presetBtn.addEventListener("touchstart", function() {
            applyQrPreset(presetBtn);
        }, { passive: true });
        presetBtn.addEventListener("pointerdown", function(e) {
            if (e.pointerType === "mouse") return;
            applyQrPreset(presetBtn);
        });
        presetBtn.addEventListener("click", function() {
            applyQrPreset(presetBtn);
        });
    });

    colorDark.addEventListener("input", function() {
        if (suppressPresetColorInputClear) return;
        document.querySelectorAll(".qr-preset.selected").forEach(function(b) { b.classList.remove("selected"); });
        refreshGeneratedQr();
    });
    colorLight.addEventListener("input", function() {
        if (suppressPresetColorInputClear) return;
        document.querySelectorAll(".qr-preset.selected").forEach(function(b) { b.classList.remove("selected"); });
        refreshGeneratedQr();
    });

    (function initMobileColorPickerProxy() {
        var proxy = null;
        var activeSource = null;

        function getProxy() {
            if (proxy) return proxy;
            proxy = document.createElement("input");
            proxy.type = "color";
            proxy.id = "qr-color-picker-proxy";
            proxy.setAttribute("tabindex", "-1");
            proxy.setAttribute("aria-hidden", "true");
            proxy.style.position = "fixed";
            proxy.style.left = "16px";
            proxy.style.width = "min(338px, calc(100vw - 32px))";
            proxy.style.height = "47.5px";
            proxy.style.opacity = "0.01";
            proxy.style.border = "0";
            proxy.style.padding = "0";
            proxy.style.margin = "0";
            proxy.style.zIndex = "10000";
            proxy.style.top = "-9999px";
            document.body.appendChild(proxy);

            proxy.addEventListener("input", function() {
                if (!activeSource) return;
                activeSource.value = proxy.value;
                activeSource.dispatchEvent(new Event("input", { bubbles: true }));
            });
            proxy.addEventListener("change", function() {
                if (!activeSource) return;
                activeSource.value = proxy.value;
                activeSource.dispatchEvent(new Event("input", { bubbles: true }));
                activeSource = null;
                proxy.style.top = "-9999px";
            });
            proxy.addEventListener("blur", function() {
                activeSource = null;
                proxy.style.top = "-9999px";
            });
            return proxy;
        }

        function positionProxy(picker, input) {
            var options = document.querySelector(".qr-options");
            var anchor = options ? options.getBoundingClientRect() : input.getBoundingClientRect();
            var gutter = 16;
            var width = Math.min(anchor.width, window.innerWidth - gutter * 2);
            picker.style.left = Math.max(gutter, anchor.left) + "px";
            picker.style.width = width + "px";
            picker.style.top = Math.max(8, input.getBoundingClientRect().top) + "px";
        }

        function openMobileColorPicker(e, input) {
            if (!MOBILE_QR_MQ.matches) return;
            e.preventDefault();
            e.stopPropagation();
            activeSource = input;
            var picker = getProxy();
            positionProxy(picker, input);
            picker.value = input.value;
            requestAnimationFrame(function() {
                try {
                    if (typeof picker.showPicker === "function") {
                        picker.showPicker();
                    } else {
                        picker.click();
                    }
                } catch (err) {
                    picker.click();
                }
            });
        }

        function bindMobileColorInput(input) {
            if (!input) return;
            input.addEventListener("pointerdown", function(e) {
                if (e.pointerType === "mouse") return;
                openMobileColorPicker(e, input);
            }, true);
            input.addEventListener("click", function(e) {
                if (!MOBILE_QR_MQ.matches) return;
                openMobileColorPicker(e, input);
            }, true);
        }

        bindMobileColorInput(colorDark);
        bindMobileColorInput(colorLight);
    })();

    function clearLoadedFile() {
        loadedFilePayload = null;
        loadedFileLabel = null;
        if (loadedFileWrap) loadedFileWrap.classList.add("hidden");
        if (loadedFileNameEl) loadedFileNameEl.textContent = "";
    }

    function showLoadedFile(name) {
        loadedFileLabel = name || "";
        if (loadedFileWrap) loadedFileWrap.classList.remove("hidden");
        if (loadedFileNameEl) loadedFileNameEl.textContent = loadedFileLabel;
    }

    function pdfTooLargeMessage() {
        return t(
            "PDF troppo grande per il QR. Carica il file online e inserisci il link nel tab URL.",
            "PDF is too large for a QR code. Upload the file online and use the URL tab."
        );
    }

    function resetParams() {
        clearLoadedFile();
        if (input) input.value = "";
        if (urlInput) urlInput.value = "";
        if (wifiSsid) wifiSsid.value = "";
        if (wifiPassword) wifiPassword.value = "";
        if (wifiHidden) wifiHidden.checked = false;
        if (vcardFirst) vcardFirst.value = "";
        if (vcardLast) vcardLast.value = "";
        if (vcardPhone) vcardPhone.value = "";
        if (vcardEmail) vcardEmail.value = "";
        if (vcardOrg) vcardOrg.value = "";
        if (vcardTitle) vcardTitle.value = "";

        colorDark.value = "#003f7f";
        colorLight.value = "#ffffff";
        document.querySelectorAll(".qr-preset").forEach(function(b) { b.classList.remove("selected"); });

        qrSizeWrap.dataset.value = "256";
        qrSizeWrap.querySelector(".qr-select-trigger").textContent = t("Medio (256px)", "Medium (256px)");
        qrSizeWrap.querySelectorAll(".qr-select-menu li").forEach(function(li) {
            li.classList.toggle("selected", li.dataset.value === "256");
        });

        qrMarginWrap.dataset.value = "4";
        qrMarginWrap.querySelector(".qr-select-trigger").textContent = t("4 moduli (predefinito)", "4 modules (default)");
        qrMarginWrap.querySelectorAll(".qr-select-menu li").forEach(function(li) {
            li.classList.toggle("selected", li.dataset.value === "4");
        });

        qrEcWrap.dataset.value = "L";
        qrEcWrap.querySelector(".qr-select-trigger").textContent = t("Basso (7%)", "Low (7%)");
        qrEcWrap.querySelectorAll(".qr-select-menu li").forEach(function(li) {
            li.classList.toggle("selected", li.dataset.value === "L");
        });

        if (wifiSecurityWrap) {
            wifiSecurityWrap.dataset.value = "WPA";
            wifiSecurityWrap.querySelector(".qr-select-trigger").textContent = "WPA/WPA2";
            wifiSecurityWrap.querySelectorAll(".qr-select-menu li").forEach(function(li) {
                li.classList.toggle("selected", li.dataset.value === "WPA");
            });
        }
        syncWifiPasswordField();

        hideError();
        output.innerHTML = "";
        resultDiv.classList.remove("show");
        lastGeneratedPayload = null;
        lastRender = null;
        if (isMobileQrLayout()) {
            setMobileQrStep("form");
        } else {
            setActiveType("text");
        }
    }

    document.getElementById("reset-qr").addEventListener("click", resetParams);

    (function initMobileResetTap() {
        var resetBtn = document.getElementById("reset-qr");
        if (!resetBtn) return;
        var RESET_TAP_MS = 160;
        var RESET_FLASH_MS = 2000;
        var RESET_FLASH_CLASS = "qr-reset-flash";
        var resetTapTimer = null;
        var resetFlashTimer = null;

        function clearResetTap() {
            if (resetTapTimer) {
                clearTimeout(resetTapTimer);
                resetTapTimer = null;
            }
            resetBtn.classList.remove("tap-active");
        }

        function clearResetFlash() {
            if (resetFlashTimer) {
                clearTimeout(resetFlashTimer);
                resetFlashTimer = null;
            }
            resetBtn.classList.remove(RESET_FLASH_CLASS);
        }

        function flashResetBtn() {
            if (!MOBILE_QR_MQ.matches) return;
            clearResetFlash();
            resetBtn.classList.add(RESET_FLASH_CLASS);
            if (typeof resetBtn.blur === "function") resetBtn.blur();
            resetFlashTimer = setTimeout(function() {
                resetBtn.classList.remove(RESET_FLASH_CLASS);
                resetFlashTimer = null;
            }, RESET_FLASH_MS);
        }

        resetBtn.addEventListener("pointerdown", function(e) {
            if (!MOBILE_QR_MQ.matches || e.pointerType === "mouse") return;
            if (resetTapTimer) clearTimeout(resetTapTimer);
            resetBtn.classList.add("tap-active");
        }, { passive: true });

        function releaseResetTap() {
            if (!MOBILE_QR_MQ.matches) return;
            if (typeof resetBtn.blur === "function") resetBtn.blur();
            if (resetTapTimer) clearTimeout(resetTapTimer);
            resetTapTimer = setTimeout(function() {
                requestAnimationFrame(function() {
                    resetBtn.classList.remove("tap-active");
                    resetTapTimer = null;
                });
            }, RESET_TAP_MS);
        }

        resetBtn.addEventListener("pointerup", releaseResetTap, { passive: true });
        resetBtn.addEventListener("pointercancel", releaseResetTap, { passive: true });
        resetBtn.addEventListener("click", function() {
            flashResetBtn();
        });

        function onMqChange() {
            if (!MOBILE_QR_MQ.matches) {
                clearResetTap();
                clearResetFlash();
            }
        }
        if (typeof MOBILE_QR_MQ.addEventListener === "function") {
            MOBILE_QR_MQ.addEventListener("change", onMqChange);
        } else if (typeof MOBILE_QR_MQ.addListener === "function") {
            MOBILE_QR_MQ.addListener(onMqChange);
        }
    })();

    btn.addEventListener("click", function() {
        generateQr(true);
    });

    function getOutputCanvas() {
        return output.querySelector("canvas");
    }

    var downloadFlashTimers = new WeakMap();

    function flashDownloadBtn(btn) {
        if (!btn) return;
        var prev = downloadFlashTimers.get(btn);
        if (prev) clearTimeout(prev);
        if (MOBILE_QR_MQ.matches) {
            btn.classList.remove("qr-export-tap-green");
            if (typeof btn.blur === "function") btn.blur();
        }
        btn.classList.add("downloaded");
        downloadFlashTimers.set(btn, setTimeout(function() {
            btn.classList.remove("downloaded");
            downloadFlashTimers.delete(btn);
        }, 2000));
    }

    downloadPngBtn.addEventListener("click", function() {
        var canvas = getOutputCanvas();
        if (!canvas) {
            showError(t("Genera prima un QR code", "Generate a QR code first"));
            return;
        }
        var link = document.createElement("a");
        link.download = "qrcode.png";
        link.href = canvas.toDataURL("image/png");
        link.click();
        flashDownloadBtn(downloadPngBtn);
    });

    downloadSvgBtn.addEventListener("click", function() {
        var svg = buildSvgString();
        if (!svg) {
            showError(t("Genera prima un QR code", "Generate a QR code first"));
            return;
        }
        var blob = new Blob([svg], { type: "image/svg+xml;charset=utf-8" });
        var url = URL.createObjectURL(blob);
        var link = document.createElement("a");
        link.download = "qrcode.svg";
        link.href = url;
        link.click();
        setTimeout(function() { URL.revokeObjectURL(url); }, 1000);
        flashDownloadBtn(downloadSvgBtn);
    });

    (function initMobileExportButtonTap() {
        if (!copyImageBtn && !downloadPngBtn && !downloadSvgBtn) return;
        var EXPORT_TAP_MIN_MS = 160;
        var COPY_TAP_CLASS = "qr-copy-tap-reset";
        var DOWNLOAD_TAP_CLASS = "qr-export-tap-green";
        var exportTapTimers = new WeakMap();
        var exportTapWired = false;

        function scheduleRemoveClass(btn, className) {
            if (!btn) return;
            var existing = exportTapTimers.get(btn);
            if (existing) clearTimeout(existing);
            exportTapTimers.set(btn, setTimeout(function() {
                requestAnimationFrame(function() {
                    btn.classList.remove(className);
                    exportTapTimers.delete(btn);
                });
            }, EXPORT_TAP_MIN_MS));
        }

        function bindExportTapClass(btn, className, skipTap) {
            if (!btn) return;
            btn.addEventListener("pointerdown", function(e) {
                if (!MOBILE_QR_MQ.matches || e.pointerType === "mouse") return;
                if (skipTap && skipTap()) return;
                btn.classList.add(className);
            }, { passive: true });

            function releaseTap() {
                if (!MOBILE_QR_MQ.matches) return;
                if (skipTap && skipTap()) return;
                if ((btn === copyImageBtn || btn === downloadPngBtn || btn === downloadSvgBtn) && typeof btn.blur === "function") {
                    btn.blur();
                }
                scheduleRemoveClass(btn, className);
            }

            btn.addEventListener("pointerup", releaseTap, { passive: true });
            btn.addEventListener("pointercancel", releaseTap, { passive: true });
        }

        function wireExportTapClasses() {
            if (!exportTapWired) {
                exportTapWired = true;
                bindExportTapClass(copyImageBtn, COPY_TAP_CLASS, function() {
                    return copyImageBtn.classList.contains("copied");
                });
                bindExportTapClass(downloadPngBtn, DOWNLOAD_TAP_CLASS, function() {
                    return downloadPngBtn.classList.contains("downloaded");
                });
                bindExportTapClass(downloadSvgBtn, DOWNLOAD_TAP_CLASS, function() {
                    return downloadSvgBtn.classList.contains("downloaded");
                });
            }
            if (!MOBILE_QR_MQ.matches) {
                if (copyImageBtn) copyImageBtn.classList.remove(COPY_TAP_CLASS);
                if (downloadPngBtn) downloadPngBtn.classList.remove(DOWNLOAD_TAP_CLASS);
                if (downloadSvgBtn) downloadSvgBtn.classList.remove(DOWNLOAD_TAP_CLASS);
            }
        }

        wireExportTapClasses();
        if (typeof MOBILE_QR_MQ.addEventListener === "function") {
            MOBILE_QR_MQ.addEventListener("change", wireExportTapClasses);
        } else if (typeof MOBILE_QR_MQ.addListener === "function") {
            MOBILE_QR_MQ.addListener(wireExportTapClasses);
        }
    })();

    copyImageBtn.addEventListener("click", function() {
        var canvas = getOutputCanvas();
        if (!canvas) {
            showError(t("Genera prima un QR code", "Generate a QR code first"));
            return;
        }
        if (!navigator.clipboard || typeof ClipboardItem === "undefined") {
            showError(t("Copia immagine non supportata in questo browser", "Copy image is not supported in this browser"));
            return;
        }
        canvas.toBlob(function(blob) {
            if (!blob) {
                showError(t("Impossibile copiare l'immagine", "Could not copy the image"));
                return;
            }
            navigator.clipboard.write([new ClipboardItem({ "image/png": blob })])
                .then(function() {
                    if (MOBILE_QR_MQ.matches) {
                        copyImageBtn.classList.remove("qr-copy-tap-reset");
                        if (typeof copyImageBtn.blur === "function") copyImageBtn.blur();
                    }
                    var original = copyImageBtn.textContent;
                    copyImageBtn.textContent = t("Copiato!", "Copied!");
                    copyImageBtn.classList.add("copied");
                    setTimeout(function() {
                        copyImageBtn.textContent = original;
                        copyImageBtn.classList.remove("copied");
                    }, 2000);
                })
                .catch(function() {
                    showError(t("Impossibile copiare l'immagine. Prova il download PNG", "Could not copy the image. Try downloading PNG instead"));
                });
        }, "image/png");
    });

    if (input) {
        input.addEventListener("input", function() {
            if (loadedFilePayload) clearLoadedFile();
        });
    }

    if (loadedFileRemoveBtn) {
        loadedFileRemoveBtn.addEventListener("click", function() {
            clearLoadedFile();
            hideError();
        });
    }

    fileInput.addEventListener("change", function() {
        var file = this.files[0];
        if (!file) return;

        var ext = file.name.split(".").pop().toLowerCase();
        var isPdf = ext === "pdf" || file.type === "application/pdf";

        function afterTextLoaded(text) {
            clearLoadedFile();
            if (isMobileQrLayout()) {
                openMobileQrForm("text");
            } else {
                setActiveType("text");
            }
            if (input) input.value = text;
            hideError();
        }

        if (ext === "txt" || file.type === "text/plain") {
            var textReader = new FileReader();
            textReader.onload = function(e) {
                afterTextLoaded(e.target.result);
            };
            textReader.onerror = function() {
                showError(t("Errore nella lettura del file", "Error reading file"));
            };
            textReader.readAsText(file);
        } else if (isPdf) {
            if (file.size > PDF_QR_MAX_BYTES) {
                showError(pdfTooLargeMessage());
                this.value = "";
                return;
            }
            var pdfReader = new FileReader();
            pdfReader.onload = function(e) {
                var dataUrl = e.target.result;
                if (!dataUrl || String(dataUrl).indexOf("base64,") === -1) {
                    showError(t("File PDF non valido", "Invalid PDF file"));
                    return;
                }
                if (dataUrl.length > PDF_QR_MAX_DATA_URL_LENGTH) {
                    showError(pdfTooLargeMessage());
                    return;
                }
                loadedFilePayload = dataUrl;
                if (input) input.value = "";
                if (isMobileQrLayout()) {
                    openMobileQrForm("text");
                } else {
                    setActiveType("text");
                }
                showLoadedFile(file.name);
                hideError();
            };
            pdfReader.onerror = function() {
                showError(t("Errore nella lettura del file", "Error reading file"));
            };
            pdfReader.readAsDataURL(file);
        } else {
            showError(t("Formato file non supportato. Usa .txt o .pdf", "Unsupported file format. Use .txt or .pdf"));
        }
        this.value = "";
    });
});
