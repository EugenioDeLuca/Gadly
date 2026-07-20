document.addEventListener("DOMContentLoaded", function() {
    var importUrl = document.getElementById("import-url");
    var robotsFile = document.getElementById("robots-file");
    var btnOpenFile = document.getElementById("btn-open-file");
    var btnLoadWeb = document.getElementById("btn-load-web");
    var importFilename = document.getElementById("robots-import-filename");
    var importStatus = document.getElementById("robots-import-status");
    var userAgent = document.getElementById("user-agent");
    var disallow = document.getElementById("disallow");
    var allowField = document.getElementById("allow");
    var sitemap = document.getElementById("sitemap");
    var btnGenerate = document.getElementById("btn-generate");
    var btnCopy = document.getElementById("btn-copy");
    var btnDownload = document.getElementById("btn-download");
    var resultArea = document.getElementById("result-area");
    var copyResetTimer = null;
    var lastGenerated = "";

    function blurButton(btn) {
        if (!btn || typeof btn.blur !== "function") return;
        requestAnimationFrame(function() {
            btn.blur();
        });
    }

    var PRESETS = {
        "allow-all": {
            userAgent: "*",
            disallow: [],
            allow: [],
            sitemap: ""
        },
        "block-all": {
            userAgent: "*",
            disallow: ["/"],
            allow: [],
            sitemap: ""
        },
        "standard": {
            userAgent: "*",
            disallow: ["/admin/", "/private/", "/api/"],
            allow: [],
            sitemap: ""
        },
        "wordpress": {
            userAgent: "*",
            disallow: ["/wp-admin/", "/wp-includes/"],
            allow: ["/wp-admin/admin-ajax.php"],
            sitemap: ""
        }
    };

    function isMobileLayout() {
        return window.matchMedia && window.matchMedia("(max-width: 768px)").matches;
    }

    function clearGeneratedResult() {
        resultArea.classList.add("hidden");
        resultArea.classList.remove("error");
        resultArea.textContent = "";
        lastGenerated = "";
        updateCopyButtonState();
    }

    function getCopyableText() {
        if (lastGenerated && String(lastGenerated).trim()) {
            return String(lastGenerated).trim();
        }
        if (resultArea.classList.contains("hidden") || resultArea.classList.contains("error")) {
            return "";
        }
        return String(resultArea.textContent || "").trim();
    }

    function hasCopyableResult() {
        return !!getCopyableText();
    }

    function updateCopyButtonState() {
        var ready = hasCopyableResult();
        btnCopy.classList.toggle("copy-ready", ready);
        btnCopy.classList.toggle("copy-disabled", !ready);
        btnCopy.setAttribute("aria-disabled", ready ? "false" : "true");
        if (!ready) {
            btnCopy.classList.remove("copied", "tap-active");
            if (copyResetTimer) {
                clearTimeout(copyResetTimer);
                copyResetTimer = null;
            }
            btnCopy.textContent = gettext("Copy");
        }
    }

    function initFormState() {
        userAgent.value = "";
        clearGeneratedResult();
    }

    function clearImportStatus() {
        if (!importStatus) return;
        importStatus.classList.add("hidden");
        importStatus.classList.remove("error");
        importStatus.textContent = "";
    }

    function mobileImportErrorText(msg, code) {
        if (!isMobileLayout()) return msg;
        if (code === "url_required") return gettext("Enter a site URL");
        if (code === "no_robots") return gettext("No robots.txt found");
        if (code === "unreachable") return gettext("URL unreachable");
        if (code === "fetch_error") return gettext("Load failed");
        return msg;
    }

    function showImportStatus(msg, isError, code) {
        if (!importStatus) {
            if (isError) {
                showError(msg);
            } else {
                showResult(msg);
            }
            return;
        }
        var displayMsg = isError ? mobileImportErrorText(msg, code) : msg;
        importStatus.classList.remove("hidden");
        importStatus.classList.toggle("error", !!isError);
        importStatus.textContent = displayMsg;
        if (isError) {
            resultArea.classList.add("hidden");
            resultArea.classList.remove("error");
            resultArea.textContent = "";
            lastGenerated = "";
            updateCopyButtonState();
        }
    }

    function showError(msg) {
        resultArea.classList.remove("hidden");
        resultArea.classList.add("error");
        resultArea.textContent = msg;
        lastGenerated = "";
        updateCopyButtonState();
    }

    function showResult(text) {
        resultArea.classList.remove("hidden");
        resultArea.classList.remove("error");
        resultArea.textContent = text;
        lastGenerated = text;
        updateCopyButtonState();
    }

    function normalizePath(path) {
        var p = (path || "").trim();
        if (!p) return "";
        if (p === "/") return "/";
        return p.charAt(0) === "/" ? p : "/" + p;
    }

    function linesFromTextarea(el) {
        return (el.value || "").trim().split(/\r?\n/).map(function(s) {
            return normalizePath(s.trim());
        }).filter(Boolean);
    }

    function parseRobotsTxt(text) {
        var lines = [];
        String(text || "").split(/\r?\n/).forEach(function(raw) {
            var line = raw.split("#")[0].trim();
            if (line) lines.push(line);
        });
        var blocks = [];
        var current = { agents: [], disallow: [], allow: [] };
        var sitemaps = [];

        function flush() {
            if (current.agents.length || current.disallow.length || current.allow.length) {
                blocks.push(current);
            }
            current = { agents: [], disallow: [], allow: [] };
        }

        lines.forEach(function(line) {
            var idx = line.indexOf(":");
            if (idx < 0) return;
            var key = line.slice(0, idx).trim().toLowerCase();
            var val = line.slice(idx + 1).trim();
            if (key === "user-agent") {
                if (current.agents.length || current.disallow.length || current.allow.length) {
                    flush();
                }
                current.agents.push(val);
            } else if (key === "disallow") {
                current.disallow.push(val);
            } else if (key === "allow") {
                current.allow.push(val);
            } else if (key === "sitemap" && val) {
                sitemaps.push(val);
            }
        });
        flush();

        var chosen = null;
        blocks.forEach(function(block) {
            if (!chosen && block.agents.indexOf("*") >= 0) chosen = block;
        });
        if (!chosen && blocks.length) chosen = blocks[0];

        var ua = "*";
        var dis = [];
        var al = [];
        if (chosen) {
            if (chosen.agents.length) ua = chosen.agents[0];
            dis = chosen.disallow.filter(Boolean);
            al = chosen.allow.filter(Boolean);
        }

        return {
            user_agent: ua,
            disallow: dis,
            allow: al,
            sitemap: sitemaps[0] || "",
            sitemaps: sitemaps
        };
    }

    function fillFormFromData(data) {
        if (!data) return;
        userAgent.value = data.userAgent != null ? String(data.userAgent) : "";
        disallow.value = Array.isArray(data.disallow) ? data.disallow.join("\n") : "";
        allowField.value = Array.isArray(data.allow) ? data.allow.join("\n") : "";
        sitemap.value = data.sitemap != null ? String(data.sitemap) : "";
        if (importFilename) {
            importFilename.classList.add("hidden");
            importFilename.textContent = "";
        }
        clearGeneratedResult();
    }

    function setActivePresetButton(presetKey) {
        document.querySelectorAll(".preset-btn").forEach(function(btn) {
            var key = (btn.getAttribute("data-preset") || "").trim();
            var active = key === presetKey;
            btn.classList.toggle("preset-active", active);
            if (active) {
                btn.setAttribute("aria-pressed", "true");
            } else {
                btn.removeAttribute("aria-pressed");
            }
        });
    }

    function clearActivePresetButtons() {
        setActivePresetButton("");
    }

    function applyImportedContent(content, sourceLabel) {
        clearImportStatus();
        var parsed = parseRobotsTxt(content);
        fillFromParsed(parsed);
        if (sourceLabel) {
            importFilename.textContent = sourceLabel;
            importFilename.classList.remove("hidden");
        }
    }

    function applyPreset(preset) {
        var key = String(preset || "").trim();
        var data = PRESETS[key];
        if (!data) return;
        clearImportStatus();
        fillFormFromData(data);
        setActivePresetButton(key);
    }

    function buildRobotsLines() {
        var ua = (userAgent.value || "").trim();
        if (!ua) {
            return { error: gettext("Please enter a User-agent before generating robots.txt") };
        }
        var dis = linesFromTextarea(disallow);
        var al = linesFromTextarea(allowField);
        var sm = (sitemap.value || "").trim();

        var lines = ["User-agent: " + ua];
        dis.forEach(function(p) {
            lines.push("Disallow: " + p);
        });
        al.forEach(function(p) {
            lines.push("Allow: " + p);
        });
        if (sm) lines.push("Sitemap: " + sm);
        return { text: lines.join("\n") };
    }

    function generateRobotsTxt() {
        var built = buildRobotsLines();
        if (built.error) {
            showError(built.error);
            return false;
        }
        showResult(built.text);
        return true;
    }

    function setCopiedState() {
        if (copyResetTimer) {
            clearTimeout(copyResetTimer);
        }
        btnCopy.classList.remove("copied");
        void btnCopy.offsetWidth;
        btnCopy.textContent = gettext("Copied!");
        btnCopy.classList.add("copied");
        blurButton(btnCopy);
        copyResetTimer = setTimeout(function() {
            btnCopy.textContent = gettext("Copy");
            btnCopy.classList.remove("copied");
            copyResetTimer = null;
            updateCopyButtonState();
        }, 2000);
    }

    function copyWithFallback(text) {
        if (navigator.clipboard && navigator.clipboard.writeText) {
            return navigator.clipboard.writeText(text).catch(function() {
                return fallbackCopy(text);
            });
        }
        return fallbackCopy(text);
    }

    function fallbackCopy(text) {
        return new Promise(function(resolve, reject) {
            var ta = document.createElement("textarea");
            ta.value = text;
            ta.setAttribute("readonly", "readonly");
            ta.style.position = "fixed";
            ta.style.opacity = "0";
            document.body.appendChild(ta);
            ta.select();
            try {
                var ok = document.execCommand("copy");
                document.body.removeChild(ta);
                if (ok) resolve();
                else reject(new Error("copy_failed"));
            } catch (e) {
                document.body.removeChild(ta);
                reject(e);
            }
        });
    }

    function fillFromParsed(parsed) {
        if (!parsed) return;
        clearImportStatus();
        fillFormFromData({
            userAgent: parsed.user_agent || "*",
            disallow: parsed.disallow || [],
            allow: parsed.allow || [],
            sitemap: parsed.sitemap || ""
        });
        clearActivePresetButtons();
    }

    btnOpenFile.addEventListener("click", function() {
        blurButton(btnOpenFile);
        robotsFile.value = "";
        robotsFile.click();
    });

    robotsFile.addEventListener("change", function() {
        var file = robotsFile.files && robotsFile.files[0];
        if (!file) return;
        var reader = new FileReader();
        reader.onload = function() {
            var content = String(reader.result || "");
            if (!content.trim()) {
                showError(gettext("The selected file is empty."));
                return;
            }
            applyImportedContent(content, gettext("Loaded file") + ": " + file.name);
        };
        reader.onerror = function() {
            showError(gettext("Could not read the selected file."));
        };
        reader.readAsText(file);
    });

    btnLoadWeb.addEventListener("click", function() {
        blurButton(btnLoadWeb);
        var url = (importUrl.value || "").trim();
        if (!url) {
            showImportStatus(gettext("Please enter a site URL for web import"), true, "url_required");
            return;
        }
        showImportStatus(gettext("Loading…"), false);
        fetch("/api/robots-fetch/", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ url: url })
        })
            .then(function(r) { return r.json(); })
            .then(function(data) {
                if (data.error) {
                    showImportStatus(data.error, true, data.code);
                    return;
                }
                if (data.content) {
                    var label = data.robots_url
                        ? gettext("Loaded from the web") + ": " + data.robots_url
                        : gettext("Loaded from the web");
                    applyImportedContent(data.content, label);
                } else if (data.parsed) {
                    clearImportStatus();
                    fillFromParsed(data.parsed);
                    clearGeneratedResult();
                }
            })
            .catch(function() {
                showImportStatus(gettext("Request failed"), true, "fetch_error");
            });
    });

    document.querySelectorAll(".preset-btn").forEach(function(btn) {
        btn.addEventListener("click", function() {
            blurButton(btn);
            applyPreset(btn.getAttribute("data-preset"));
        });
    });

    btnGenerate.addEventListener("click", function() {
        generateRobotsTxt();
        blurButton(btnGenerate);
    });

    btnCopy.addEventListener("click", function() {
        if (!hasCopyableResult()) {
            blurButton(btnCopy);
            return;
        }
        copyWithFallback(getCopyableText()).then(function() {
            setCopiedState();
        }).catch(function() {});
    });

    btnCopy.addEventListener("pointerdown", function(e) {
        if (!hasCopyableResult()) {
            e.preventDefault();
        }
    });

    initFormState();
    updateCopyButtonState();

    userAgent.addEventListener("input", function() {
        if (!(userAgent.value || "").trim()) {
            clearGeneratedResult();
        }
    });

    btnDownload.addEventListener("click", function() {
        var text = lastGenerated || resultArea.textContent;
        if (!text || resultArea.classList.contains("hidden") || resultArea.classList.contains("error")) {
            if (!generateRobotsTxt()) return;
            text = lastGenerated;
        }
        var blob = new Blob([text], { type: "text/plain;charset=utf-8" });
        var a = document.createElement("a");
        a.href = URL.createObjectURL(blob);
        a.download = "robots.txt";
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(a.href);
        blurButton(btnDownload);
    });
});
