(function() {
    var key = 'gadly-theme';
    var warmKey = 'gadly-warm-tone';
    var darkClass = 'dark-mode';
    var warmClass = 'warm-tone';

    function syncViewportChrome(isDark, forceResample) {
        if (typeof window.gadlySyncViewportChrome === 'function') {
            window.gadlySyncViewportChrome(isDark, { forceResample: !!forceResample });
        }
    }

    function applyTheme(isDark) {
        var root = document.documentElement;
        var mobile = window.matchMedia && window.matchMedia('(max-width: 768px)').matches;
        var isWarm = document.body.classList.contains(warmClass);

        root.classList.add('theme-switching');
        root.classList.toggle('gadly-warm-dark', !!(mobile && isDark && isWarm));
        root.classList.toggle('gadly-warm-light', !!(mobile && !isDark && isWarm));

        if (mobile) {
            /* Status bar prima (sync), poi classe tema — stesso giro, niente ritardo */
            syncViewportChrome(isDark, true);
        } else {
            syncViewportChrome(isDark, false);
        }

        document.body.classList.toggle(darkClass, isDark);
        var btn = document.getElementById('theme-toggle');
        if (btn) {
            var nextIcon = isDark ? '☀️' : '🌙';
            if (btn.textContent !== nextIcon) btn.textContent = nextIcon;
        }
        if (document.body.classList.contains('cv-generator')) {
            document.documentElement.classList.toggle('cv-gen-mobile-light', mobile && !isDark);
        }

        syncViewportChrome(isDark, false);
        void root.offsetHeight;
        root.classList.remove('theme-switching');
    }

    function applyWarmTone(isWarm) {
        var root = document.documentElement;
        root.classList.add('theme-switching');
        document.body.classList.toggle(warmClass, isWarm);
        var isDark = document.body.classList.contains(darkClass);
        var mobile = window.matchMedia && window.matchMedia('(max-width: 768px)').matches;
        root.classList.toggle('gadly-warm-dark', !!(mobile && isDark && isWarm));
        root.classList.toggle('gadly-warm-light', !!(mobile && !isDark && isWarm));
        var btn = document.getElementById('warm-tone-toggle');
        if (btn) {
            btn.classList.toggle('is-active', isWarm);
            btn.setAttribute('aria-pressed', isWarm ? 'true' : 'false');
        }
        syncViewportChrome(isDark, false);
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
            syncViewportChrome(isDark, false);
            var syncBtn = document.getElementById('theme-toggle');
            if (syncBtn) {
                var syncIcon = isDark ? '☀️' : '🌙';
                if (syncBtn.textContent !== syncIcon) syncBtn.textContent = syncIcon;
            }
        }

        var warmSaved = localStorage.getItem(warmKey);
        var isWarm = warmSaved === '1';
        var root = document.documentElement;
        var mobileInit = window.matchMedia && window.matchMedia('(max-width: 768px)').matches;
        root.classList.toggle('gadly-warm-dark', !!(mobileInit && isDark && isWarm));
        root.classList.toggle('gadly-warm-light', !!(mobileInit && !isDark && isWarm));
        if (document.body.classList.contains(warmClass) !== isWarm) {
            applyWarmTone(isWarm);
        } else {
            var warmBtn0 = document.getElementById('warm-tone-toggle');
            if (warmBtn0) {
                warmBtn0.classList.toggle('is-active', isWarm);
                warmBtn0.setAttribute('aria-pressed', isWarm ? 'true' : 'false');
            }
            syncViewportChrome(isDark, false);
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

        function followsSystemTheme() {
            try {
                return localStorage.getItem(key) === null;
            } catch (eKey) {
                return true;
            }
        }

        function onSystemThemeChange() {
            if (!followsSystemTheme()) return;
            var systemDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
            if (document.body.classList.contains(darkClass) !== systemDark) {
                applyTheme(systemDark);
            } else {
                syncViewportChrome(systemDark, true);
            }
        }

        if (window.matchMedia) {
            var schemeMq = window.matchMedia('(prefers-color-scheme: dark)');
            if (typeof schemeMq.addEventListener === 'function') {
                schemeMq.addEventListener('change', onSystemThemeChange);
            } else if (typeof schemeMq.addListener === 'function') {
                schemeMq.addListener(onSystemThemeChange);
            }
        }
        document.addEventListener('visibilitychange', function() {
            if (document.visibilityState === 'visible') onSystemThemeChange();
        });
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }
})();
