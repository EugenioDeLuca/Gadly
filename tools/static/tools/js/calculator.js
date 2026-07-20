document.addEventListener("DOMContentLoaded", function() {
    var htmlLang = (document.documentElement.lang || "").toLowerCase();
    var isItalian = htmlLang.indexOf("it") === 0;

    // Tabs
    document.querySelectorAll(".calc-tab").forEach(function(tab) {
        tab.addEventListener("click", function() {
            document.querySelectorAll(".calc-tab").forEach(function(t) { t.classList.remove("active"); });
            document.querySelectorAll(".calc-panel").forEach(function(p) { p.classList.remove("active"); });
            this.classList.add("active");
            var pid = "panel-" + this.dataset.panel;
            document.getElementById(pid).classList.add("active");
        });
    });

    // === Percentuale ===
    var pctValue = document.getElementById("pct-value");
    var pctOf = document.getElementById("pct-of");
    var resultPct = document.getElementById("result-pct");
    var resultPctMobile = document.getElementById("result-pct-mobile");

    function setPctResult(text, isError) {
        [resultPct, resultPctMobile].forEach(function(el) {
            if (!el) return;
            el.classList.add("show");
            if (isError) {
                el.classList.add("error");
                el.textContent = text;
            } else {
                el.classList.remove("error");
                el.innerHTML = text;
            }
        });
    }

    document.getElementById("btn-pct").addEventListener("click", function() {
        var perc = parseFloat(pctValue.value);
        var of = parseFloat(pctOf.value);
        if (isNaN(perc) || isNaN(of)) {
            setPctResult(gettext("Please enter valid values."), true);
        } else {
            var res = (perc / 100) * of;
            setPctResult(
                gettext("Result:") + " " + String(perc) + "% " + gettext("of") + " " + String(of) + " " + gettext("is") + " " + "<strong>" + res.toFixed(2) + "</strong>",
                false
            );
        }
    });

    function scrollCalcSelectMenuToTop(wrap) {
        var menu = wrap.querySelector(".calc-select-menu");
        if (!menu) return;
        var selected = menu.querySelector("li.selected");
        if (!selected) return;
        requestAnimationFrame(function() {
            requestAnimationFrame(function() {
                menu.scrollTop = Math.max(0, selected.offsetTop);
            });
        });
    }

    function scrollCalcSelectMenuToSelected(wrap) {
        if (!window.matchMedia("(max-width: 768px)").matches) return;
        var menu = wrap.querySelector(".calc-select-menu");
        if (!menu) return;
        var selected = menu.querySelector("li.selected");
        if (!selected) return;
        requestAnimationFrame(function() {
            requestAnimationFrame(function() {
                var menuHeight = menu.clientHeight;
                if (menuHeight <= 0) return;
                var itemTop = selected.offsetTop;
                var itemHeight = selected.offsetHeight;
                menu.scrollTop = Math.max(0, itemTop - menuHeight / 2 + itemHeight / 2);
            });
        });
    }

    // Custom select init (all calc-custom-select)
    document.querySelectorAll(".calc-custom-select").forEach(function(wrap) {
        var trigger = wrap.querySelector(".calc-select-trigger");
        var menu = wrap.querySelector(".calc-select-menu");
        if (!trigger || !menu) return;
        menu.querySelectorAll("li").forEach(function(li) {
            li.addEventListener("click", function() {
                wrap.dataset.value = li.dataset.value;
                trigger.textContent = li.textContent;
                menu.querySelectorAll("li").forEach(function(l) { l.classList.remove("selected"); });
                li.classList.add("selected");
                wrap.classList.remove("open");
            });
        });
        trigger.addEventListener("click", function(e) {
            e.stopPropagation();
            document.querySelectorAll(".calc-custom-select.open").forEach(function(s) { s.classList.remove("open"); });
            var opening = !wrap.classList.contains("open");
            wrap.classList.toggle("open");
            if (opening) {
                if ((wrap.id === "iva-country-wrap" || wrap.id === "iva-rate-wrap") && window.innerWidth >= 769) {
                    scrollCalcSelectMenuToTop(wrap);
                } else {
                    scrollCalcSelectMenuToSelected(wrap);
                }
            }
        });
        menu.addEventListener("click", function(e) { e.stopPropagation(); });
    });

    document.addEventListener("click", function() {
        document.querySelectorAll(".calc-custom-select.open").forEach(function(s) { s.classList.remove("open"); });
    });

    // === IVA (VAT rates from vat-api.eu) ===
    var ivaCountryWrap = document.getElementById("iva-country-wrap");
    var ivaRateWrap = document.getElementById("iva-rate-wrap");
    var ivaAmount = document.getElementById("iva-amount");
    var resultIva = document.getElementById("result-iva");
    var vatRatesCache = null;

    function buildIvaCountryMenu(rates) {
        var menu = document.getElementById("iva-country-menu");
        if (!menu) return;
        var current = ivaCountryWrap ? (ivaCountryWrap.dataset.value || "IT") : "IT";
        menu.innerHTML = "";
        rates.forEach(function(r) {
            var li = document.createElement("li");
            li.dataset.value = r.country_code;
            li.textContent = r.country + " (" + r.country_code + ")";
            if (r.country_code === current) li.classList.add("selected");
            menu.appendChild(li);
        });
    }

    function ivaRateStdSuffix() {
        if (ivaRateWrap && ivaRateWrap.dataset.stdSuffix) return ivaRateWrap.dataset.stdSuffix;
        return gettext("(standard)");
    }
    function ivaRateRedSuffix() {
        if (ivaRateWrap && ivaRateWrap.dataset.redSuffix) return ivaRateWrap.dataset.redSuffix;
        return gettext("(reduced)");
    }

    function buildIvaRateMenu(rates, countryCode) {
        var r = rates.find(function(x) { return x.country_code === countryCode; });
        var menu = document.getElementById("iva-rate-menu");
        if (!menu || !r) return;
        menu.innerHTML = "";
        var std = ivaRateStdSuffix();
        var red = ivaRateRedSuffix();
        var items = [{ value: r.standard_rate, label: r.standard_rate + "% " + std }];
        (r.reduced_rates || []).forEach(function(v) {
            items.push({ value: v, label: v + "% " + red });
        });
        items.sort(function(a, b) { return b.value - a.value; });
        var currentRate = ivaRateWrap ? ivaRateWrap.dataset.value : null;
        if (currentRate !== null && currentRate !== "" &&
            !items.some(function(item) { return String(item.value) === String(currentRate); })) {
            currentRate = null;
        }
        var picked = items[0];
        items.forEach(function(item, i) {
            var li = document.createElement("li");
            li.dataset.value = String(item.value);
            li.textContent = item.label;
            if (currentRate !== null && currentRate !== "" && String(item.value) === String(currentRate)) {
                li.classList.add("selected");
                picked = item;
            } else if ((currentRate === null || currentRate === "") && i === 0) {
                li.classList.add("selected");
            }
            menu.appendChild(li);
        });
        if (ivaRateWrap) {
            ivaRateWrap.dataset.value = String(picked.value);
            var trigger = ivaRateWrap.querySelector(".calc-select-trigger");
            if (trigger) {
                var rateUnchanged = currentRate !== null && currentRate !== "" &&
                    String(picked.value) === String(currentRate);
                if (!rateUnchanged || !trigger.textContent.trim()) {
                    trigger.textContent = picked.label;
                }
            }
        }
    }

    function initIvaFromApi() {
        if (vatRatesCache) {
            buildIvaCountryMenu(vatRatesCache);
            buildIvaRateMenu(vatRatesCache, ivaCountryWrap ? ivaCountryWrap.dataset.value : "IT");
            if (ivaCountryWrap) {
                var r = vatRatesCache.find(function(x) { return x.country_code === (ivaCountryWrap.dataset.value || "IT"); });
                var trigger = ivaCountryWrap.querySelector(".calc-select-trigger");
                if (trigger && r) trigger.textContent = r.country + " (" + r.country_code + ")";
            }
            return;
        }
        var controller = new AbortController();
        var timeoutId = setTimeout(function() { controller.abort(); }, 8000);
        var vatRatesUrl;
        if (typeof window !== "undefined" && window.GADLY_VAT_RATES_URL) {
            vatRatesUrl = window.GADLY_VAT_RATES_URL;
        } else if (typeof window !== "undefined" && window.location && window.location.origin) {
            /* Stesso origin del sito: niente CORS (proxy Django). */
            vatRatesUrl = window.location.origin + "/api/vat-rates/";
        } else {
            vatRatesUrl = "https://vat-api.eu/api/v1/rates";
        }
        fetch(vatRatesUrl, { signal: controller.signal })
            .then(function(res) {
                if (!res.ok) {
                    throw new Error("vat_rates_http_" + res.status);
                }
                return res.json();
            })
            .then(function(rates) {
                if (!Array.isArray(rates) || rates.length === 0) {
                    throw new Error("vat_rates_shape");
                }
                clearTimeout(timeoutId);
                vatRatesCache = rates;
                buildIvaCountryMenu(rates);
                buildIvaRateMenu(rates, ivaCountryWrap ? (ivaCountryWrap.dataset.value || "IT") : "IT");
                var trigger = ivaCountryWrap ? ivaCountryWrap.querySelector(".calc-select-trigger") : null;
                if (trigger) trigger.textContent = gettext("Italy (IT)");
            })
            .catch(function(err) {
                clearTimeout(timeoutId);
                vatRatesCache = [
                    { country: "Austria", country_code: "AT", standard_rate: 20, reduced_rates: [10, 13] },
                    { country: "Belgium", country_code: "BE", standard_rate: 21, reduced_rates: [0, 6, 12] },
                    { country: "Bulgaria", country_code: "BG", standard_rate: 20, reduced_rates: [0, 9] },
                    { country: "Croatia", country_code: "HR", standard_rate: 25, reduced_rates: [5, 13] },
                    { country: "Cyprus", country_code: "CY", standard_rate: 19, reduced_rates: [5, 9] },
                    { country: "Czech Republic", country_code: "CZ", standard_rate: 21, reduced_rates: [0, 12] },
                    { country: "Denmark", country_code: "DK", standard_rate: 25, reduced_rates: [0] },
                    { country: "Estonia", country_code: "EE", standard_rate: 22, reduced_rates: [9] },
                    { country: "Finland", country_code: "FI", standard_rate: 25.5, reduced_rates: [0, 10, 13.5] },
                    { country: "France", country_code: "FR", standard_rate: 20, reduced_rates: [2.1, 5.5, 10] },
                    { country: "Germany", country_code: "DE", standard_rate: 19, reduced_rates: [0, 7] },
                    { country: "Greece", country_code: "GR", standard_rate: 24, reduced_rates: [6, 13] },
                    { country: "Hungary", country_code: "HU", standard_rate: 27, reduced_rates: [0, 5, 18] },
                    { country: "Ireland", country_code: "IE", standard_rate: 23, reduced_rates: [0, 4.8, 9, 13.5] },
                    { country: "Italy", country_code: "IT", standard_rate: 22, reduced_rates: [4, 5, 10] },
                    { country: "Latvia", country_code: "LV", standard_rate: 21, reduced_rates: [0, 5, 12] },
                    { country: "Lithuania", country_code: "LT", standard_rate: 21, reduced_rates: [5, 12] },
                    { country: "Luxembourg", country_code: "LU", standard_rate: 17, reduced_rates: [3, 8, 14] },
                    { country: "Malta", country_code: "MT", standard_rate: 18, reduced_rates: [0, 5, 7, 12] },
                    { country: "Netherlands", country_code: "NL", standard_rate: 21, reduced_rates: [0, 9] },
                    { country: "Poland", country_code: "PL", standard_rate: 23, reduced_rates: [0, 5, 8] },
                    { country: "Portugal", country_code: "PT", standard_rate: 23, reduced_rates: [6, 13] },
                    { country: "Romania", country_code: "RO", standard_rate: 19, reduced_rates: [0, 5, 9] },
                    { country: "Slovakia", country_code: "SK", standard_rate: 23, reduced_rates: [5, 19] },
                    { country: "Slovenia", country_code: "SI", standard_rate: 22, reduced_rates: [5, 9.5] },
                    { country: "Spain", country_code: "ES", standard_rate: 21, reduced_rates: [0, 4, 10] },
                    { country: "Sweden", country_code: "SE", standard_rate: 25, reduced_rates: [0, 6, 12] }
                ];
                buildIvaCountryMenu(vatRatesCache);
                buildIvaRateMenu(vatRatesCache, "IT");
                if (ivaCountryWrap) {
                    var t = ivaCountryWrap.querySelector(".calc-select-trigger");
                    if (t) t.textContent = gettext("Italy (IT)");
                }
            });
    }

    if (ivaCountryWrap) {
        ivaCountryWrap.querySelector("ul").addEventListener("click", function(e) {
            var li = e.target.closest("li");
            if (!li || !vatRatesCache) return;
            ivaCountryWrap.dataset.value = li.dataset.value;
            ivaCountryWrap.querySelector(".calc-select-trigger").textContent = li.textContent;
            ivaCountryWrap.querySelectorAll("li").forEach(function(l) { l.classList.remove("selected"); });
            li.classList.add("selected");
            buildIvaRateMenu(vatRatesCache, li.dataset.value);
            ivaCountryWrap.classList.remove("open");
        });
    }
    if (ivaRateWrap) {
        ivaRateWrap.querySelector(".calc-select-menu").addEventListener("click", function(e) {
            var li = e.target.closest("li");
            if (!li) return;
            ivaRateWrap.dataset.value = li.dataset.value;
            ivaRateWrap.querySelector(".calc-select-trigger").textContent = li.textContent;
            ivaRateWrap.querySelectorAll("li").forEach(function(l) { l.classList.remove("selected"); });
            li.classList.add("selected");
            ivaRateWrap.classList.remove("open");
        });
    }

    var panelIva = document.getElementById("panel-iva");
    if (panelIva && panelIva.classList.contains("active")) initIvaFromApi();
    document.querySelectorAll(".calc-tab[data-panel='iva']").forEach(function(tab) {
        tab.addEventListener("click", function() { setTimeout(initIvaFromApi, 50); });
    });

    document.getElementById("btn-iva-net").addEventListener("click", function() {
        var rateVal = ivaRateWrap ? ivaRateWrap.dataset.value : "22";
        var rate = parseFloat(rateVal) / 100;
        var amt = parseFloat(ivaAmount.value);
        if (isNaN(amt) || amt < 0) {
            resultIva.textContent = gettext("Please enter a valid amount.");
            resultIva.classList.add("error");
        } else {
            resultIva.classList.remove("error");
            var vat = amt * rate;
            var gross = amt + vat;
            resultIva.innerHTML =
                gettext("Net amount:") + " " + amt.toFixed(2) + " €<br>" +
                gettext("VAT") + " (" + rateVal + "%): " + vat.toFixed(2) + " €<br>" +
                "<strong>" + gettext("Gross amount:") + " " + gross.toFixed(2) + " €</strong>";
        }
        resultIva.classList.add("show");
    });

    document.getElementById("btn-iva-gross").addEventListener("click", function() {
        var rateVal = ivaRateWrap ? ivaRateWrap.dataset.value : "22";
        var rate = parseFloat(rateVal) / 100;
        var amt = parseFloat(ivaAmount.value);
        if (isNaN(amt) || amt < 0) {
            resultIva.textContent = gettext("Please enter a valid amount.");
            resultIva.classList.add("error");
        } else {
            resultIva.classList.remove("error");
            var net = amt / (1 + rate);
            var vat = amt - net;
            resultIva.innerHTML =
                gettext("Gross amount:") + " " + amt.toFixed(2) + " €<br>" +
                gettext("VAT") + " (" + rateVal + "%): " + vat.toFixed(2) + " €<br>" +
                "<strong>" + gettext("Net amount:") + " " + net.toFixed(2) + " €</strong>";
        }
        resultIva.classList.add("show");
    });

    // === Stipendio netto (stima semplificata) ===
    var salaryRal = document.getElementById("salary-ral");
    var salaryMonthsWrap = document.getElementById("salary-months-wrap");
    var resultSalary = document.getElementById("result-salary");
    var resultSalaryMobile = document.getElementById("result-salary-mobile");

    function setSalaryResult(text, isError) {
        [resultSalary, resultSalaryMobile].forEach(function(el) {
            if (!el) return;
            el.classList.add("show");
            if (isError) {
                el.classList.add("error");
                el.textContent = text;
            } else {
                el.classList.remove("error");
                el.innerHTML = text;
            }
        });
    }

    function calcNetSalary(ral) {
        var imponibile = ral;
        var inps = Math.min(ral * 0.0919, 3500);
        var irpefBase = imponibile - inps;
        var irpef = 0;
        if (irpefBase <= 28000) {
            irpef = irpefBase * 0.23;
        } else if (irpefBase <= 50000) {
            irpef = 6440 + (irpefBase - 28000) * 0.25;
        } else {
            irpef = 11440 + (irpefBase - 50000) * 0.35;
        }
        var netto = imponibile - inps - irpef;
        return { netto: netto, inps: inps, irpef: irpef };
    }

    document.getElementById("btn-salary").addEventListener("click", function() {
        var ral = parseFloat(salaryRal.value);
        var months = parseInt(salaryMonthsWrap ? salaryMonthsWrap.dataset.value : "12", 10);
        if (isNaN(ral) || ral <= 0) {
            setSalaryResult(gettext("Please enter a valid gross salary."), true);
        } else {
            var res = calcNetSalary(ral);
            var netMonthly = res.netto / months;
            var html =
                gettext("Gross annual:") + " " + ral.toFixed(0) + " €<br>" +
                gettext("Social security (approx.):") + " " + res.inps.toFixed(0) + " €<br>" +
                gettext("Income tax (estimate):") + " " + res.irpef.toFixed(0) + " €<br>" +
                "<strong>" + gettext("Net annual:") + " " + res.netto.toFixed(0) + " €</strong><br>" +
                "<strong>" + interpolate(gettext("Net monthly (%(months)s payments):"), { months: String(months) }, true) + " " + netMonthly.toFixed(2) + " €</strong>" +
                '<div class="calc-result-note">' + gettext("Indicative estimate for Italy. Does not include deductions, regional or municipal taxes, or other charges.") + "</div>";
            setSalaryResult(html, false);
        }
    });

    // === Interest (simple / compound) ===
    var intTypeWrap = document.getElementById("int-type-wrap");
    var resultInterest = document.getElementById("result-interest");
    var resultInterestMobile = document.getElementById("result-interest-mobile");

    function setInterestResult(text, isError) {
        [resultInterest, resultInterestMobile].forEach(function(el) {
            if (!el) return;
            el.classList.add("show");
            if (isError) {
                el.classList.add("error");
                el.textContent = text;
            } else {
                el.classList.remove("error");
                el.innerHTML = text;
            }
        });
    }

    document.getElementById("btn-interest").addEventListener("click", function() {
        var p = parseFloat(document.getElementById("int-principal").value);
        var r = parseFloat(document.getElementById("int-rate").value) / 100;
        var t = parseFloat(document.getElementById("int-years").value);
        var type = intTypeWrap ? intTypeWrap.dataset.value : "simple";

        if (isNaN(p) || isNaN(r) || isNaN(t) || p <= 0) {
            setInterestResult(gettext("Please enter valid values."), true);
        } else {
            var interest, total;
            if (type === "simple") {
                interest = p * r * t;
                total = p + interest;
            } else {
                total = p * Math.pow(1 + r, t);
                interest = total - p;
            }
            var html =
                gettext("Principal:") + " " + p.toFixed(2) + " €<br>" +
                gettext("Interest:") + " " + interest.toFixed(2) + " €<br>" +
                "<strong>" + gettext("Total:") + " " + total.toFixed(2) + " €</strong>";
            setInterestResult(html, false);
        }
    });

    // === Currency (Frankfurter API - ECB rates, no API key) ===
    var currFromWrap = document.getElementById("curr-from-wrap");
    var currToWrap = document.getElementById("curr-to-wrap");
    var resultCurrency = document.getElementById("result-currency");
    var resultCurrencyMobile = document.getElementById("result-currency-mobile");

    function setCurrencyResult(text, isError) {
        [resultCurrency, resultCurrencyMobile].forEach(function(el) {
            if (!el) return;
            el.classList.remove("is-loading");
            el.style.minHeight = "";
            el.classList.add("show");
            if (isError) {
                el.classList.add("error");
                el.textContent = text;
            } else {
                el.classList.remove("error");
                el.innerHTML = text;
            }
        });
    }

    function setCurrencyLoading() {
        [resultCurrency, resultCurrencyMobile].forEach(function(el) {
            if (!el) return;
            if (el.classList.contains("show") && el.offsetHeight > 0) {
                el.style.minHeight = el.offsetHeight + "px";
            }
            el.classList.add("show", "is-loading");
            el.classList.remove("error");
            el.textContent = gettext("Loading…");
        });
    }

    var CURRENCY_LOADING_MIN_MS = 650;

    function currencyLoadingDelay(startMs) {
        var wait = Math.max(0, CURRENCY_LOADING_MIN_MS - (Date.now() - startMs));
        return new Promise(function(resolve) {
            setTimeout(resolve, wait);
        });
    }

    function finishCurrencyRequest(startMs, text, isError) {
        return currencyLoadingDelay(startMs).then(function() {
            setCurrencyResult(text, isError);
        });
    }

    document.getElementById("btn-currency").addEventListener("click", function() {
        var amt = parseFloat(document.getElementById("curr-amount").value);
        var fromCurr = currFromWrap ? currFromWrap.dataset.value : "EUR";
        var toCurr = currToWrap ? currToWrap.dataset.value : "USD";
        var btn = document.getElementById("btn-currency");

        if (isNaN(amt) || amt < 0) {
            setCurrencyResult(gettext("Please enter a valid amount."), true);
            return;
        }
        if (fromCurr === toCurr) {
            setCurrencyResult(gettext("Select two different currencies."), true);
            return;
        }

        btn.disabled = true;
        var loadingStart = Date.now();
        setCurrencyLoading();

        var apiBase = (typeof window.GADLY_CURRENCY_URL === "string" && window.GADLY_CURRENCY_URL)
            ? window.GADLY_CURRENCY_URL
            : "/api/currency-convert/";
        var url = apiBase
            + "?amount=" + encodeURIComponent(String(amt))
            + "&from=" + encodeURIComponent(fromCurr)
            + "&to=" + encodeURIComponent(toCurr);

        fetch(url)
            .then(function(r) {
                if (!r.ok) throw new Error("bad_status");
                return r.json();
            })
            .then(function(data) {
                if (data.converted == null || isNaN(Number(data.converted))) throw new Error("no_rate");
                var html = amt.toFixed(2) + " " + fromCurr + " = <strong>" + Number(data.converted).toFixed(2) + " " + toCurr + "</strong>";
                if (data.date) {
                    html += '<div class="calc-result-note">' +
                        interpolate(gettext("Exchange rate as of %(date)s (ECB)."), { date: data.date }, true) +
                        "</div>";
                }
                return finishCurrencyRequest(loadingStart, html, false);
            })
            .catch(function() {
                return finishCurrencyRequest(
                    loadingStart,
                    gettext("Error fetching rates. Check your connection."),
                    true
                );
            })
            .finally(function() {
                btn.disabled = false;
            });
    });

    // === Loan / Mortgage ===
    var resultLoan = document.getElementById("result-loan");
    var resultLoanMobile = document.getElementById("result-loan-mobile");

    function setLoanResult(text, isError) {
        [resultLoan, resultLoanMobile].forEach(function(el) {
            if (!el) return;
            el.classList.add("show");
            if (isError) {
                el.classList.add("error");
                el.textContent = text;
            } else {
                el.classList.remove("error");
                el.innerHTML = text;
            }
        });
    }

    document.getElementById("btn-loan").addEventListener("click", function() {
        var P = parseFloat(document.getElementById("loan-principal").value);
        var r = parseFloat(document.getElementById("loan-rate").value) / 100 / 12;
        var n = parseInt(document.getElementById("loan-years").value, 10) * 12;
        if (isNaN(P) || isNaN(r) || isNaN(n) || P <= 0 || n <= 0) {
            setLoanResult(gettext("Please enter valid values."), true);
        } else {
            var M;
            if (r === 0) {
                M = P / n;
            } else {
                M = P * (r * Math.pow(1 + r, n)) / (Math.pow(1 + r, n) - 1);
            }
            var totalPaid = M * n;
            var totalInterest = totalPaid - P;
            var html = "<strong>" + gettext("Monthly payment:") + " " + M.toFixed(2) + " €</strong><br>" +
                gettext("Total paid:") + " " + totalPaid.toFixed(2) + " €<br>" +
                gettext("Total interest:") + " " + totalInterest.toFixed(2) + " €";
            setLoanResult(html, false);
        }
    });

    // === Discount ===
    var resultDiscount = document.getElementById("result-discount");
    var resultDiscountMobile = document.getElementById("result-discount-mobile");

    function setDiscountResult(text, isError) {
        [resultDiscount, resultDiscountMobile].forEach(function(el) {
            if (!el) return;
            el.classList.add("show");
            if (isError) {
                el.classList.add("error");
                el.textContent = text;
            } else {
                el.classList.remove("error");
                el.innerHTML = text;
            }
        });
    }

    document.getElementById("btn-discount").addEventListener("click", function() {
        var price = parseFloat(document.getElementById("disc-price").value);
        var pct = parseFloat(document.getElementById("disc-pct").value) / 100;

        if (isNaN(price) || isNaN(pct) || price < 0 || pct < 0 || pct > 1) {
            setDiscountResult(gettext("Please enter valid values."), true);
        } else {
            var discount = price * pct;
            var finalPrice = price - discount;
            var discountLabel = isItalian ? "Sconto" : gettext("Discount");
            var html = gettext("Original price:") + " " + price.toFixed(2) + " €<br>" +
                discountLabel + " (" + String((pct * 100).toFixed(0)) + "%): -" + discount.toFixed(2) + " €<br>" +
                "<strong>" + gettext("Final price:") + " " + finalPrice.toFixed(2) + " €</strong>";
            setDiscountResult(html, false);
        }
    });

    // === Margin / Markup ===
    var resultMargin = document.getElementById("result-margin");
    var resultMarginMobile = document.getElementById("result-margin-mobile");

    function setMarginResult(text, isError) {
        [resultMargin, resultMarginMobile].forEach(function(el) {
            if (!el) return;
            el.classList.add("show");
            if (isError) {
                el.classList.add("error");
                el.textContent = text;
            } else {
                el.classList.remove("error");
                el.innerHTML = text;
            }
        });
    }

    document.getElementById("btn-margin").addEventListener("click", function() {
        var cost = parseFloat(document.getElementById("margin-cost").value);
        var pct = parseFloat(document.getElementById("margin-pct").value) / 100;

        if (isNaN(cost) || isNaN(pct) || cost < 0 || pct < 0 || pct >= 1) {
            setMarginResult(gettext("Please enter valid values. The margin must be below 100%."), true);
        } else {
            var sellingPrice = cost / (1 - pct);
            var marginAmount = sellingPrice - cost;
            var marginPctText = String((pct * 100).toFixed(0));
            var html = gettext("Cost:") + " " + cost.toFixed(2) + " €<br>" +
                gettext("Margin") + " (" + marginPctText + "%): +" + marginAmount.toFixed(2) + " €<br>" +
                "<strong>" + gettext("Selling price:") + " " + sellingPrice.toFixed(2) + " €</strong>";
            setMarginResult(html, false);
        }
    });

    // === Split bill ===
    var resultSplit = document.getElementById("result-split");
    var resultSplitMobile = document.getElementById("result-split-mobile");

    function setSplitResult(text, isError) {
        [resultSplit, resultSplitMobile].forEach(function(el) {
            if (!el) return;
            el.classList.add("show");
            if (isError) {
                el.classList.add("error");
                el.textContent = text;
            } else {
                el.classList.remove("error");
                el.innerHTML = text;
            }
        });
    }

    document.getElementById("btn-split").addEventListener("click", function() {
        var total = parseFloat(document.getElementById("split-total").value);
        var people = parseInt(document.getElementById("split-people").value, 10);
        var tipPct = parseFloat(document.getElementById("split-tip").value) || 0;

        if (isNaN(total) || isNaN(people) || total < 0 || people < 1) {
            setSplitResult(gettext("Please enter valid values."), true);
        } else {
            var withTip = total * (1 + tipPct / 100);
            var perPerson = withTip / people;
            var html = gettext("Total:") + " " + total.toFixed(2) + " €<br>" +
                (tipPct > 0 ? interpolate(gettext("With %(tip)s tip:"), { tip: String(tipPct) + "%" }, true) + " " + withTip.toFixed(2) + " €<br>" : "") +
                "<strong>" + interpolate(gettext("Per person (%(n)s):"), { n: String(people) }, true) + " " + perPerson.toFixed(2) + " €</strong>";
            setSplitResult(html, false);
        }
    });

});
