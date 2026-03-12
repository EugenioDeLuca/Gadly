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

    document.getElementById("btn-pct").addEventListener("click", function() {
        var perc = parseFloat(pctValue.value);
        var of = parseFloat(pctOf.value);
        if (isNaN(perc) || isNaN(of)) {
            resultPct.textContent = "Please enter valid values.";
        } else {
            var res = (perc / 100) * of;
            resultPct.innerHTML = perc + "% of " + of + " = <strong>" + res.toFixed(2) + "</strong>";
        }
        resultPct.classList.add("show");
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

    // === IVA ===
    var ivaRateWrap = document.getElementById("iva-rate-wrap");
    var ivaAmount = document.getElementById("iva-amount");
    var resultIva = document.getElementById("result-iva");

    document.getElementById("btn-iva-net").addEventListener("click", function() {
        var rateVal = ivaRateWrap ? ivaRateWrap.dataset.value : "22";
        var rate = parseFloat(rateVal) / 100;
        var amt = parseFloat(ivaAmount.value);
        if (isNaN(amt)) {
            resultIva.textContent = "Please enter a valid amount.";
        } else {
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
        if (isNaN(amt)) {
            resultIva.textContent = "Please enter a valid amount.";
        } else {
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
            resultSalary.textContent = "Please enter a valid gross salary.";
        } else {
            var res = calcNetSalary(ral);
            var netMonthly = res.netto / months;
            resultSalary.innerHTML =
                "Gross annual: " + ral.toFixed(0) + " €<br>" +
                "Social security (approx.): " + res.inps.toFixed(0) + " €<br>" +
                "Income tax (estimate): " + res.irpef.toFixed(0) + " €<br>" +
                "<strong>Net annual: " + res.netto.toFixed(0) + " €</strong><br>" +
                "<strong>Net monthly (" + months + " payments): " + netMonthly.toFixed(2) + " €</strong>";
            resultSalary.innerHTML += '<div class="calc-result-note">Indicative estimate for Italy. Does not include deductions, regional/municipal taxes, or other charges.</div>';
        }
        resultSalary.classList.add("show");
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
            res.textContent = "Please enter valid values.";
        } else {
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
    document.getElementById("btn-currency").addEventListener("click", function() {
        var amt = parseFloat(document.getElementById("curr-amount").value);
        var fromCurr = currFromWrap ? currFromWrap.dataset.value : "EUR";
        var toCurr = currToWrap ? currToWrap.dataset.value : "USD";
        var res = document.getElementById("result-currency");
        var btn = document.getElementById("btn-currency");

        if (isNaN(amt) || amt < 0) {
            res.textContent = "Please enter a valid amount.";
            res.classList.add("show");
            return;
        }
        if (fromCurr === toCurr) {
            res.textContent = "Select two different currencies.";
            res.classList.add("show");
            return;
        }

        btn.disabled = true;
        btn.textContent = "Loading…";
        res.classList.remove("show");

        var url = "https://api.frankfurter.app/latest?amount=" + amt + "&from=" + fromCurr + "&to=" + toCurr;
        fetch(url)
            .then(function(r) { return r.json(); })
            .then(function(data) {
                var converted = data.rates && data.rates[toCurr] != null ? data.rates[toCurr] : null;
                var date = data.date || "";
                if (converted !== null) {
                    res.innerHTML = amt.toFixed(2) + " " + fromCurr + " = <strong>" + Number(converted).toFixed(2) + " " + toCurr + "</strong>";
                    if (date) res.innerHTML += '<div class="calc-result-note">Rate of ' + date + ' (ECB).</div>';
                } else {
                    res.textContent = "Could not get exchange rate.";
                }
                res.classList.add("show");
            })
            .catch(function() {
                res.textContent = "Error fetching rates. Check your connection.";
                res.classList.add("show");
            })
            .finally(function() {
                btn.disabled = false;
                btn.textContent = "Convert";
            });
    });

    // === Loan / Mortgage ===
    document.getElementById("btn-loan").addEventListener("click", function() {
        var P = parseFloat(document.getElementById("loan-principal").value);
        var r = parseFloat(document.getElementById("loan-rate").value) / 100 / 12;
        var n = parseInt(document.getElementById("loan-years").value, 10) * 12;
        var res = document.getElementById("result-loan");

        if (isNaN(P) || isNaN(r) || isNaN(n) || P <= 0 || n <= 0) {
            res.textContent = "Please enter valid values.";
        } else {
            var M;
            if (r === 0) {
                M = P / n;
            } else {
                M = P * (r * Math.pow(1 + r, n)) / (Math.pow(1 + r, n) - 1);
            }
            var totalPaid = M * n;
            var totalInterest = totalPaid - P;
            res.innerHTML = "<strong>Monthly payment: " + M.toFixed(2) + " €</strong><br>" +
                "Total paid: " + totalPaid.toFixed(2) + " €<br>" +
                "Total interest: " + totalInterest.toFixed(2) + " €";
        }
        res.classList.add("show");
    });

    // === Discount ===
    document.getElementById("btn-discount").addEventListener("click", function() {
        var price = parseFloat(document.getElementById("disc-price").value);
        var pct = parseFloat(document.getElementById("disc-pct").value) / 100;
        var res = document.getElementById("result-discount");

        if (isNaN(price) || isNaN(pct) || price < 0 || pct < 0 || pct > 1) {
            res.textContent = "Please enter valid values.";
        } else {
            var discount = price * pct;
            var finalPrice = price - discount;
            res.innerHTML = "Original: " + price.toFixed(2) + " €<br>" +
                "Discount (" + (pct * 100) + "%): -" + discount.toFixed(2) + " €<br>" +
                "<strong>Final price: " + finalPrice.toFixed(2) + " €</strong>";
        }
        res.classList.add("show");
    });

    // === Margin / Markup ===
    document.getElementById("btn-margin").addEventListener("click", function() {
        var cost = parseFloat(document.getElementById("margin-cost").value);
        var pct = parseFloat(document.getElementById("margin-pct").value) / 100;
        var res = document.getElementById("result-margin");

        if (isNaN(cost) || isNaN(pct) || cost < 0 || pct < 0 || pct >= 1) {
            res.textContent = "Please enter valid values. Margin must be < 100%.";
        } else {
            var sellingPrice = cost / (1 - pct);
            var marginAmount = sellingPrice - cost;
            res.innerHTML = "Cost: " + cost.toFixed(2) + " €<br>" +
                "Margin (" + (pct * 100) + "%): +" + marginAmount.toFixed(2) + " €<br>" +
                "<strong>Selling price: " + sellingPrice.toFixed(2) + " €</strong>";
        }
        res.classList.add("show");
    });

    // === Split bill ===
    document.getElementById("btn-split").addEventListener("click", function() {
        var total = parseFloat(document.getElementById("split-total").value);
        var people = parseInt(document.getElementById("split-people").value, 10);
        var tipPct = parseFloat(document.getElementById("split-tip").value) || 0;
        var res = document.getElementById("result-split");

        if (isNaN(total) || isNaN(people) || total < 0 || people < 1) {
            res.textContent = "Please enter valid values.";
        } else {
            var withTip = total * (1 + tipPct / 100);
            var perPerson = withTip / people;
            res.innerHTML = "Total: " + total.toFixed(2) + " €<br>" +
                (tipPct > 0 ? "With " + tipPct + "% tip: " + withTip.toFixed(2) + " €<br>" : "") +
                "<strong>Per person (" + people + "): " + perPerson.toFixed(2) + " €</strong>";
        }
        res.classList.add("show");
    });

});
