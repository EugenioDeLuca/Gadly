(function() {
    var key = 'gadly-theme';
    var warmKey = 'gadly-warm-tone';
    var darkClass = 'dark-mode';
    var warmClass = 'warm-tone';

    function syncViewportChrome(isDark) {
        if (typeof window.gadlySyncViewportChrome === 'function') {
            window.gadlySyncViewportChrome(isDark);
            return;
        }
        var mobile = window.matchMedia && window.matchMedia('(max-width: 768px)').matches;
        var color = isDark ? '#0f0f23' : (mobile ? '#ffffff' : '#f4f6fa');
        var root = document.documentElement;
        root.dataset.theme = isDark ? 'dark' : 'light';
        root.style.backgroundColor = color;
        if (mobile) {
            root.style.colorScheme = isDark ? 'dark' : 'light';
        } else {
            root.style.removeProperty('color-scheme');
        }
        var prev = document.getElementById('gadly-theme-color');
        if (prev) prev.remove();
        var meta = document.createElement('meta');
        meta.name = 'theme-color';
        meta.id = 'gadly-theme-color';
        meta.setAttribute('content', color);
        var head = document.head || document.getElementsByTagName('head')[0];
        if (head && head.firstChild) {
            head.insertBefore(meta, head.firstChild);
        } else if (head) {
            head.appendChild(meta);
        }
    }

    function withInstantThemeSwitch(applyFn) {
        var root = document.documentElement;
        root.classList.add('theme-switching');
        applyFn();
        requestAnimationFrame(function() {
            requestAnimationFrame(function() {
                root.classList.remove('theme-switching');
            });
        });
    }

    function applyTheme(isDark) {
        withInstantThemeSwitch(function() {
            document.body.classList.toggle(darkClass, isDark);
            syncViewportChrome(isDark);
            var btn = document.getElementById('theme-toggle');
            if (btn) btn.textContent = isDark ? '☀️' : '🌙';
            if (document.body.classList.contains('cv-generator')) {
                var mobile = window.innerWidth <= 768;
                document.documentElement.classList.toggle('cv-gen-mobile-light', mobile && !isDark);
            }
        });
        /* Riesegui sync dopo il paint: Safari a volte ignora theme-color nel frame del toggle. */
        requestAnimationFrame(function() {
            syncViewportChrome(isDark);
            setTimeout(function() { syncViewportChrome(isDark); }, 80);
        });
    }

    function applyWarmTone(isWarm) {
        withInstantThemeSwitch(function() {
            document.body.classList.toggle(warmClass, isWarm);
            var btn = document.getElementById('warm-tone-toggle');
            if (btn) {
                btn.classList.toggle('is-active', isWarm);
                btn.setAttribute('aria-pressed', isWarm ? 'true' : 'false');
            }
        });
    }

    function init() {
        var saved = localStorage.getItem(key);
        var isDark = saved === 'dark' || (!saved && window.matchMedia('(prefers-color-scheme: dark)').matches);
        /* Inline in base.html ha già applicato tema: evita toggle ridondanti e un reflow inutile al load. */
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
                /* Touch: evita che il bottone resti con focus/hover “incollato” dopo il tap. */
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
