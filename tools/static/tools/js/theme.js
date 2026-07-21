(function() {
    var key = 'gadly-theme';
    var warmKey = 'gadly-warm-tone';
    var darkClass = 'dark-mode';
    var warmClass = 'warm-tone';

    function syncViewportChrome(isDark) {
        if (typeof window.gadlySyncViewportChrome === 'function') {
            window.gadlySyncViewportChrome(isDark);
        }
    }

    function applyTheme(isDark) {
        var root = document.documentElement;
        var mobile = window.matchMedia && window.matchMedia('(max-width: 768px)').matches;
        var color = isDark ? '#0f0f23' : (mobile ? '#ffffff' : '#f4f6fa');

        root.classList.add('theme-switching');

        /* 1) Colore su html/header/theme-color PRIMA del toggle classe */
        syncViewportChrome(isDark);
        if (mobile) {
            var header = document.querySelector('.site-header');
            if (header) {
                header.style.setProperty('background', color, 'important');
                header.style.setProperty('background-color', color, 'important');
            }
            root.style.setProperty('background-color', color, 'important');
        }
        void root.offsetHeight;

        /* 2) Toggle tema nello stesso turn */
        document.body.classList.toggle(darkClass, isDark);
        var btn = document.getElementById('theme-toggle');
        if (btn) btn.textContent = isDark ? '☀️' : '🌙';
        if (document.body.classList.contains('cv-generator')) {
            document.documentElement.classList.toggle('cv-gen-mobile-light', mobile && !isDark);
        }

        syncViewportChrome(isDark);
        void root.offsetHeight;
        root.classList.remove('theme-switching');
    }

    function applyWarmTone(isWarm) {
        var root = document.documentElement;
        root.classList.add('theme-switching');
        document.body.classList.toggle(warmClass, isWarm);
        var btn = document.getElementById('warm-tone-toggle');
        if (btn) {
            btn.classList.toggle('is-active', isWarm);
            btn.setAttribute('aria-pressed', isWarm ? 'true' : 'false');
        }
        requestAnimationFrame(function() {
            root.classList.remove('theme-switching');
        });
    }

    function init() {
        var saved = localStorage.getItem(key);
        var isDark = saved === 'dark' || (!saved && window.matchMedia('(prefers-color-scheme: dark)').matches);
        if (document.body.classList.contains(darkClass) !== isDark) {
            applyTheme(isDark);
        } else {
            syncViewportChrome(isDark);
            var syncBtn = document.getElementById('theme-toggle');
            if (syncBtn) syncBtn.textContent = isDark ? '☀️' : '🌙';
        }

        var warmSaved = localStorage.getItem(warmKey);
        var isWarm = warmSaved === '1';
        if (document.body.classList.contains(warmClass) !== isWarm) {
            applyWarmTone(isWarm);
        } else {
            var warmBtn0 = document.getElementById('warm-tone-toggle');
            if (warmBtn0) {
                warmBtn0.classList.toggle('is-active', isWarm);
                warmBtn0.setAttribute('aria-pressed', isWarm ? 'true' : 'false');
            }
        }

        var btn = document.getElementById('theme-toggle');
        if (btn) {
            btn.addEventListener('click', function() {
                isDark = !document.body.classList.contains(darkClass);
                localStorage.setItem(key, isDark ? 'dark' : 'light');
                applyTheme(isDark);
                if (typeof btn.blur === 'function') {
                    requestAnimationFrame(function() {
                        btn.blur();
                    });
                }
            });
        }

        var warmBtn = document.getElementById('warm-tone-toggle');
        if (warmBtn) {
            warmBtn.addEventListener('click', function() {
                isWarm = !document.body.classList.contains(warmClass);
                localStorage.setItem(warmKey, isWarm ? '1' : '0');
                applyWarmTone(isWarm);
                if (typeof warmBtn.blur === 'function') {
                    requestAnimationFrame(function() {
                        warmBtn.blur();
                    });
                }
            });
        }
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }
})();
