(function() {
    var key = 'gadly-theme';
    var darkClass = 'dark-mode';

    function applyTheme(isDark) {
        document.body.classList.toggle(darkClass, isDark);
        document.documentElement.dataset.theme = isDark ? 'dark' : 'light';
        var btn = document.getElementById('theme-toggle');
        if (btn) btn.textContent = isDark ? '☀️' : '🌙';
    }

    function init() {
        var saved = localStorage.getItem(key);
        var isDark = saved === 'dark' || (!saved && window.matchMedia('(prefers-color-scheme: dark)').matches);
        applyTheme(isDark);

        var btn = document.getElementById('theme-toggle');
        if (btn) {
            btn.addEventListener('click', function() {
                isDark = !document.body.classList.contains(darkClass);
                localStorage.setItem(key, isDark ? 'dark' : 'light');
                applyTheme(isDark);
            });
        }
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }
})();
