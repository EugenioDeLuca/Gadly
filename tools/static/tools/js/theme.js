(function() {
    var key = 'gadly-theme';
    var warmKey = 'gadly-warm-tone';
    var darkClass = 'dark-mode';
    var warmClass = 'warm-tone';
    var statusMaskTimer = null;

    function syncViewportChrome(isDark) {
        if (typeof window.gadlySyncViewportChrome === 'function') {
            window.gadlySyncViewportChrome(isDark);
        }
    }

    function ensureStatusMask(color) {
        var mask = document.getElementById('gadly-theme-status-mask');
        if (!mask) {
            mask = document.createElement('div');
            mask.id = 'gadly-theme-status-mask';
            mask.setAttribute('aria-hidden', 'true');
            document.documentElement.appendChild(mask);
        }
        /* Copre safe-area + fascia status: resta fino a quando Safari aggiorna theme-color. */
        mask.style.cssText = [
            'position:fixed',
            'top:0',
            'left:0',
            'right:0',
            'width:100%',
            'height:calc(env(safe-area-inset-top, 0px) + 52px)',
            'min-height:52px',
            'z-index:2147483646',
            'pointer-events:none',
            'border:0',
            'margin:0',
            'padding:0',
            'display:block',
            'background:' + color,
            'background-color:' + color,
            'transform:translateZ(0)',
            '-webkit-backface-visibility:hidden'
        ].join(';');
        return mask;
    }

    function hideStatusMask() {
        var mask = document.getElementById('gadly-theme-status-mask');
        if (mask) mask.style.display = 'none';
    }

    function applyTheme(isDark) {
        var root = document.documentElement;
        var mobile = window.matchMedia && window.matchMedia('(max-width: 768px)').matches;
        var color = isDark ? '#0f0f23' : (mobile ? '#ffffff' : '#f4f6fa');

        root.classList.add('theme-switching');
        if (statusMaskTimer) {
            clearTimeout(statusMaskTimer);
            statusMaskTimer = null;
        }

        /* 1) Colore nuovo subito su meta + fascia (prima del toggle classe). */
        if (mobile) ensureStatusMask(color);
        syncViewportChrome(isDark);
        void root.offsetHeight;

        /* 2) Toggle tema pagina nello stesso frame. */
        document.body.classList.toggle(darkClass, isDark);
        var btn = document.getElementById('theme-toggle');
        if (btn) btn.textContent = isDark ? '☀️' : '🌙';
        if (document.body.classList.contains('cv-generator')) {
            document.documentElement.classList.toggle('cv-gen-mobile-light', mobile && !isDark);
        }

        syncViewportChrome(isDark);
        void root.offsetHeight;

        /* 3) Maschera resta ~0.5s: Safari aggiorna la status bar in ritardo. */
        requestAnimationFrame(function() {
            syncViewportChrome(isDark);
            root.classList.remove('theme-switching');
            if (mobile) {
                statusMaskTimer = setTimeout(function() {
                    hideStatusMask();
                    statusMaskTimer = null;
                }, 520);
            } else {
                hideStatusMask();
            }
        });
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
