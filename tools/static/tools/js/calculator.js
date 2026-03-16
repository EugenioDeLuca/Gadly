document.addEventListener("DOMContentLoaded", function() {
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
            setPctResult("Please enter valid values", true);
        } else {
            var res = (perc / 100) * of;
            setPctResult(perc + "% of " + of + " = <strong>" + res.toFixed(2) + "</strong>", false);
        }
    });

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
            wrap.classList.toggle("open");
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
        menu.innerHTML = "";
        rates.forEach(function(r) {
            var li = document.createElement("li");
            li.dataset.value = r.country_code;
            li.textContent = r.country + " (" + r.country_code + ")";
            if (r.country_code === "IT") li.classList.add("selected");
            menu.appendChild(li);
        });
    }

    function buildIvaRateMenu(rates, countryCode) {
        var r = rates.find(function(x) { return x.country_code === countryCode; });
        var menu = document.getElementById("iva-rate-menu");
        if (!menu || !r) return;
        menu.innerHTML = "";
        var items = [{ value: r.standard_rate, label: r.standard_rate + "% (standard)" }];
        (r.reduced_rates || []).forEach(function(v) {
            items.push({ value: v, label: v + "% (reduced)" });
        });
        items.sort(function(a, b) { return b.value - a.value; });
        items.forEach(function(item, i) {
            var li = document.createElement("li");
            li.dataset.value = String(item.value);
            li.textContent = item.label;
            if (i === 0) li.classList.add("selected");
            menu.appendChild(li);
        });
        if (ivaRateWrap) {
            ivaRateWrap.dataset.value = String(items[0].value);
            var trigger = ivaRateWrap.querySelector(".calc-select-trigger");
            if (trigger) trigger.textContent = items[0].label;
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
        fetch("https://vat-api.eu/api/v1/rates", { signal: controller.signal })
            .then(function(res) { return res.json(); })
            .then(function(rates) {
                clearTimeout(timeoutId);
                vatRatesCache = rates;
                buildIvaCountryMenu(rates);
                buildIvaRateMenu(rates, "IT");
                var trigger = ivaCountryWrap ? ivaCountryWrap.querySelector(".calc-select-trigger") : null;
                if (trigger) trigger.textContent = "Italy (IT)";
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
                    if (t) t.textContent = "Italy (IT)";
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
            resultIva.textContent = "Please enter a valid amount";
            resultIva.classList.add("error");
        } else {
            resultIva.classList.remove("error");
            var vat = amt * rate;
            var gross = amt + vat;
            resultIva.innerHTML = "Net amount: " + amt.toFixed(2) + " €<br>" +
                "VAT (" + rateVal + "%): " + vat.toFixed(2) + " €<br>" +
                "<strong>Gross amount: " + gross.toFixed(2) + " €</strong>";
        }
        resultIva.classList.add("show");
    });

    document.getElementById("btn-iva-gross").addEventListener("click", function() {
        var rateVal = ivaRateWrap ? ivaRateWrap.dataset.value : "22";
        var rate = parseFloat(rateVal) / 100;
        var amt = parseFloat(ivaAmount.value);
        if (isNaN(amt) || amt < 0) {
            resultIva.textContent = "Please enter a valid amount";
            resultIva.classList.add("error");
        } else {
            resultIva.classList.remove("error");
            var net = amt / (1 + rate);
            var vat = amt - net;
            resultIva.innerHTML = "Gross amount: " + amt.toFixed(2) + " €<br>" +
                "VAT (" + rateVal + "%): " + vat.toFixed(2) + " €<br>" +
                "<strong>Net amount: " + net.toFixed(2) + " €</strong>";
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
            setSalaryResult("Please enter a valid gross salary", true);
        } else {
            var res = calcNetSalary(ral);
            var netMonthly = res.netto / months;
            var html =
                "Gross annual: " + ral.toFixed(0) + " €<br>" +
                "Social security (approx.): " + res.inps.toFixed(0) + " €<br>" +
                "Income tax (estimate): " + res.irpef.toFixed(0) + " €<br>" +
                "<strong>Net annual: " + res.netto.toFixed(0) + " €</strong><br>" +
                "<strong>Net monthly (" + months + " payments): " + netMonthly.toFixed(2) + " €</strong>" +
                '<div class="calc-result-note">Indicative estimate for Italy. Does not include deductions, regional/municipal taxes, or other charges.</div>';
            setSalaryResult(html, false);
        }
    });

    // === Interest (simple / compound) ===
    var intTypeWrap = document.getElementById("int-type-wrap");
    document.getElementById("btn-interest").addEventListener("click", function() {
        var p = parseFloat(document.getElementById("int-principal").value);
        var r = parseFloat(document.getElementById("int-rate").value) / 100;
        var t = parseFloat(document.getElementById("int-years").value);
        var type = intTypeWrap ? intTypeWrap.dataset.value : "simple";
        var res = document.getElementById("result-interest");

        if (isNaN(p) || isNaN(r) || isNaN(t) || p <= 0) {
            res.textContent = "Please enter valid values";
            res.classList.add("error");
        } else {
            res.classList.remove("error");
            var interest, total;
            if (type === "simple") {
                interest = p * r * t;
                total = p + interest;
            } else {
                total = p * Math.pow(1 + r, t);
                interest = total - p;
            }
            res.innerHTML = "Principal: " + p.toFixed(2) + " €<br>" +
                "Interest: " + interest.toFixed(2) + " €<br>" +
                "<strong>Total: " + total.toFixed(2) + " €</strong>";
        }
        res.classList.add("show");
    });

    // === Currency (Frankfurter API - ECB rates, no API key) ===
    var currFromWrap = document.getElementById("curr-from-wrap");
    var currToWrap = document.getElementById("curr-to-wrap");
    var resultCurrency = document.getElementById("result-currency");
    var resultCurrencyMobile = document.getElementById("result-currency-mobile");

    function setCurrencyResult(text, isError) {
        [resultCurrency, resultCurrencyMobile].forEach(function(el) {
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

    document.getElementById("btn-currency").addEventListener("click", function() {
        var amt = parseFloat(document.getElementById("curr-amount").value);
        var fromCurr = currFromWrap ? currFromWrap.dataset.value : "EUR";
        var toCurr = currToWrap ? currToWrap.dataset.value : "USD";
        var res = resultCurrency;
        var btn = document.getElementById("btn-currency");

        if (isNaN(amt) || amt < 0) {
            setCurrencyResult("Please enter a valid amount", true);
            return;
        }
        if (fromCurr === toCurr) {
            setCurrencyResult("Select two different currencies.", true);
            return;
        }

        btn.disabled = true;
        btn.textContent = "Loading…";
        [resultCurrency, resultCurrencyMobile].forEach(function(el) {
            if (!el) return;
            el.classList.remove("show");
            el.classList.remove("error");
        });

        var url = "https://api.frankfurter.app/latest?amount=" + amt + "&from=" + fromCurr + "&to=" + toCurr;
        fetch(url)
            .then(function(r) { return r.json(); })
            .then(function(data) {
                var converted = data.rates && data.rates[toCurr] != null ? data.rates[toCurr] : null;
                var date = data.date || "";
                if (converted !== null) {
                    var html = amt.toFixed(2) + " " + fromCurr + " = <strong>" + Number(converted).toFixed(2) + " " + toCurr + "</strong>";
                    if (date) html += '<div class="calc-result-note">Rate of ' + date + ' (ECB).</div>';
                    setCurrencyResult(html, false);
                } else {
                    setCurrencyResult("Could not get exchange rate.", true);
                }
            })
            .catch(function() {
                setCurrencyResult("Error fetching rates. Check your connection.", true);
            })
            .finally(function() {
                btn.disabled = false;
                btn.textContent = "Convert";
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
            setLoanResult("Please enter valid values", true);
        } else {
            var M;
            if (r === 0) {
                M = P / n;
            } else {
                M = P * (r * Math.pow(1 + r, n)) / (Math.pow(1 + r, n) - 1);
            }
            var totalPaid = M * n;
            var totalInterest = totalPaid - P;
            var html = "<strong>Monthly payment: " + M.toFixed(2) + " €</strong><br>" +
                "Total paid: " + totalPaid.toFixed(2) + " €<br>" +
                "Total interest: " + totalInterest.toFixed(2) + " €";
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
            setDiscountResult("Please enter valid values", true);
        } else {
            var discount = price * pct;
            var finalPrice = price - discount;
            var html = "Original: " + price.toFixed(2) + " €<br>" +
                "Discount (" + (pct * 100) + "%): -" + discount.toFixed(2) + " €<br>" +
                "<strong>Final price: " + finalPrice.toFixed(2) + " €</strong>";
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
            setMarginResult("Please enter valid values. Margin must be < 100%", true);
        } else {
            var sellingPrice = cost / (1 - pct);
            var marginAmount = sellingPrice - cost;
            var html = "Cost: " + cost.toFixed(2) + " €<br>" +
                "Margin (" + (pct * 100) + "%): +" + marginAmount.toFixed(2) + " €<br>" +
                "<strong>Selling price: " + sellingPrice.toFixed(2) + " €</strong>";
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
            setSplitResult("Please enter valid values", true);
        } else {
            var withTip = total * (1 + tipPct / 100);
            var perPerson = withTip / people;
            var html = "Total: " + total.toFixed(2) + " €<br>" +
                (tipPct > 0 ? "With " + tipPct + "% tip: " + withTip.toFixed(2) + " €<br>" : "") +
                "<strong>Per person (" + people + "): " + perPerson.toFixed(2) + " €</strong>";
            setSplitResult(html, false);
        }
    });

});
