(function() {
    var key = 'gadly-theme';
    var warmKey = 'gadly-warm-tone';
    var darkClass = 'dark-mode';
    var warmClass = 'warm-tone';

    function applyTheme(isDark) {
        document.body.classList.toggle(darkClass, isDark);
        document.documentElement.dataset.theme = isDark ? 'dark' : 'light';
        var btn = document.getElementById('theme-toggle');
        if (btn) btn.textContent = isDark ? '☀️' : '🌙';
    }

    function applyWarmTone(isWarm) {
        document.body.classList.toggle(warmClass, isWarm);
        var btn = document.getElementById('warm-tone-toggle');
        if (btn) {
            btn.classList.toggle('is-active', isWarm);
            btn.setAttribute('aria-pressed', isWarm ? 'true' : 'false');
        }
    }

    function init() {
        var saved = localStorage.getItem(key);
        var isDark = saved === 'dark' || (!saved && window.matchMedia('(prefers-color-scheme: dark)').matches);
        applyTheme(isDark);

        var warmSaved = localStorage.getItem(warmKey);
        var isWarm = warmSaved === '1';
        applyWarmTone(isWarm);

        var btn = document.getElementById('theme-toggle');
        if (btn) {
            btn.addEventListener('click', function() {
                isDark = !document.body.classList.contains(darkClass);
                localStorage.setItem(key, isDark ? 'dark' : 'light');
                applyTheme(isDark);
            });
        }

        var warmBtn = document.getElementById('warm-tone-toggle');
        if (warmBtn) {
            warmBtn.addEventListener('click', function() {
                isWarm = !document.body.classList.contains(warmClass);
                localStorage.setItem(warmKey, isWarm ? '1' : '0');
                applyWarmTone(isWarm);
            });
        }
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }
})();
