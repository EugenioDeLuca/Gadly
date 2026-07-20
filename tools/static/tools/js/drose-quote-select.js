(function () {
    "use strict";

    function syncField(wrap, hiddenInput) {
        var trigger = wrap.querySelector(".text-tool-select-trigger");
        var menu = wrap.querySelector(".text-tool-select-menu");
        var selected = null;
        if (menu) {
            menu.querySelectorAll("li").forEach(function (li) {
                if (li.dataset.value === hiddenInput.value) selected = li;
            });
        }
        if (trigger && selected) trigger.textContent = selected.textContent;
        if (menu) {
            menu.querySelectorAll("li").forEach(function (li) {
                li.classList.toggle("selected", li.dataset.value === hiddenInput.value);
            });
        }
    }

    function bindOption(wrap, hiddenInput, li) {
        if (li.dataset.bound) return;
        li.dataset.bound = "1";
        li.addEventListener("click", function (e) {
            e.stopPropagation();
            hiddenInput.value = li.dataset.value;
            syncField(wrap, hiddenInput);
            wrap.classList.remove("open");
            hiddenInput.dispatchEvent(new Event("change", { bubbles: true }));
        });
    }

    function initWrap(wrap) {
        if (!wrap || wrap.dataset.customSelectReady) return;

        var hiddenInput = wrap.querySelector('input[type="hidden"]');
        var trigger = wrap.querySelector(".text-tool-select-trigger");
        var menu = wrap.querySelector(".text-tool-select-menu");
        if (!hiddenInput || !trigger || !menu) return;

        menu.querySelectorAll("li").forEach(function (li) {
            bindOption(wrap, hiddenInput, li);
        });

        if (!trigger.dataset.bound) {
            trigger.dataset.bound = "1";
            trigger.addEventListener("click", function (e) {
                e.preventDefault();
                e.stopPropagation();
                document.querySelectorAll(".drose-quote-form .text-tool-select.open").forEach(function (w) {
                    w.classList.remove("open");
                });
                wrap.classList.toggle("open");
            });
        }

        if (!menu.dataset.bound) {
            menu.dataset.bound = "1";
            menu.addEventListener("click", function (e) {
                e.stopPropagation();
            });
        }

        syncField(wrap, hiddenInput);
        wrap.dataset.customSelectReady = "1";
    }

    function initAll() {
        document.querySelectorAll(".drose-quote-form .text-tool-select").forEach(initWrap);
    }

    function autoGrowTextarea(el) {
        if (!el) return;
        // Vuota: solo CSS (niente height inline → niente salto al refresh)
        if (!el.value) {
            el.style.height = "";
            return;
        }
        var prev = el.style.height;
        el.style.height = "auto";
        var next = el.scrollHeight + "px";
        if (prev === next) return;
        el.style.height = next;
    }

    function initAutogrow() {
        document.querySelectorAll(".drose-quote-form textarea.drose-quote-textarea--autogrow").forEach(function (ta) {
            if (ta.dataset.autogrowReady) return;
            ta.dataset.autogrowReady = "1";
            autoGrowTextarea(ta);
            ta.addEventListener("input", function () {
                autoGrowTextarea(ta);
            });
        });
    }

    function initQuoteFormExtras() {
        initAll();
        initAutogrow();
    }

    window.droseQuoteFormInit = initQuoteFormExtras;

    document.addEventListener("click", function () {
        document.querySelectorAll(".drose-quote-form .text-tool-select.open").forEach(function (w) {
            w.classList.remove("open");
        });
    });

    if (document.readyState === "loading") {
        document.addEventListener("DOMContentLoaded", initQuoteFormExtras);
    } else {
        initQuoteFormExtras();
    }
})();
