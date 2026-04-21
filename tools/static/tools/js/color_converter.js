(function () {
    'use strict';
    var t = (typeof gettext === 'function') ? gettext : function (s) { return s; };
    var hexInput = document.getElementById('hex-input');
    var rgbInput = document.getElementById('rgb-input');
    var hslInput = document.getElementById('hsl-input');
    var preview = document.getElementById('color-preview');
    var picker = document.getElementById('color-picker');

    var errorEl = document.createElement('div');
    errorEl.className = 'result-area error hidden';
    errorEl.id = 'color-converter-error';
    errorEl.setAttribute('aria-live', 'polite');
    var copyGroup = document.getElementById('color-copy-group');
    if (copyGroup && copyGroup.parentNode) {
        copyGroup.parentNode.insertBefore(errorEl, copyGroup);
    }

    function showError(msg) {
        if (!errorEl) return;
        errorEl.textContent = msg;
        errorEl.classList.remove('hidden');
    }
    function clearError() {
        if (!errorEl) return;
        errorEl.classList.add('hidden');
        errorEl.textContent = '';
    }

    function hex2rgb(hex) {
        hex = hex.replace(/^#/, '');
        if (hex.length !== 3 && hex.length !== 6) return null;
        if (hex.length === 3) hex = hex[0] + hex[0] + hex[1] + hex[1] + hex[2] + hex[2];
        var r = parseInt(hex.slice(0, 2), 16);
        var g = parseInt(hex.slice(2, 4), 16);
        var b = parseInt(hex.slice(4, 6), 16);
        if (isNaN(r) || isNaN(g) || isNaN(b)) return null;
        return { r: r, g: g, b: b };
    }

    function rgb2hex(r, g, b) {
        r = Math.max(0, Math.min(255, Math.round(r)));
        g = Math.max(0, Math.min(255, Math.round(g)));
        b = Math.max(0, Math.min(255, Math.round(b)));
        return '#' + ('0' + r.toString(16)).slice(-2) + ('0' + g.toString(16)).slice(-2) + ('0' + b.toString(16)).slice(-2);
    }

    function rgb2hsl(r, g, b) {
        r /= 255; g /= 255; b /= 255;
        var max = Math.max(r, g, b), min = Math.min(r, g, b);
        var h, s, l = (max + min) / 2;
        if (max === min) {
            h = s = 0;
        } else {
            var d = max - min;
            s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
            switch (max) {
                case r: h = ((g - b) / d + (g < b ? 6 : 0)) / 6; break;
                case g: h = ((b - r) / d + 2) / 6; break;
                default: h = ((r - g) / d + 4) / 6; break;
            }
        }
        return {
            h: Math.round(h * 360),
            s: Math.round(s * 100),
            l: Math.round(l * 100)
        };
    }

    function hsl2rgb(h, s, l) {
        h = h / 360; s = s / 100; l = l / 100;
        var r, g, b;
        if (s === 0) {
            r = g = b = l;
        } else {
            var q = l < 0.5 ? l * (1 + s) : l + s - l * s;
            var p = 2 * l - q;
            r = hue2rgb(p, q, h + 1/3);
            g = hue2rgb(p, q, h);
            b = hue2rgb(p, q, h - 1/3);
        }
        return { r: Math.round(r * 255), g: Math.round(g * 255), b: Math.round(b * 255) };
    }
    function hue2rgb(p, q, t) {
        if (t < 0) t += 1;
        if (t > 1) t -= 1;
        if (t < 1/6) return p + (q - p) * 6 * t;
        if (t < 1/2) return q;
        if (t < 2/3) return p + (q - p) * (2/3 - t) * 6;
        return p;
    }

    function parseRgb(str) {
        var m = str.match(/rgb\s*\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)\s*\)/i) || str.match(/(\d+)\s*,\s*(\d+)\s*,\s*(\d+)/);
        if (!m) return null;
        var r = parseInt(m[1], 10), g = parseInt(m[2], 10), b = parseInt(m[3], 10);
        if (isNaN(r) || isNaN(g) || isNaN(b)) return null;
        if (r < 0 || r > 255 || g < 0 || g > 255 || b < 0 || b > 255) return null;
        return { r: r, g: g, b: b };
    }

    function parseHsl(str) {
        var m = str.match(/hsl\s*\(\s*(\d+)\s*,\s*(\d+)\s*%\s*,\s*(\d+)\s*%\s*\)/i) || str.match(/(\d+)\s*,\s*(\d+)\s*%\s*,\s*(\d+)\s*%/);
        if (!m) return null;
        var h = parseInt(m[1], 10), s = parseInt(m[2], 10), l = parseInt(m[3], 10);
        if (isNaN(h) || isNaN(s) || isNaN(l)) return null;
        if (h < 0 || h > 360 || s < 0 || s > 100 || l < 0 || l > 100) return null;
        return { h: h, s: s, l: l };
    }

    function applyRgb(rgb) {
        var hex = rgb2hex(rgb.r, rgb.g, rgb.b);
        var hsl = rgb2hsl(rgb.r, rgb.g, rgb.b);
        preview.style.background = hex;
        picker.value = hex;
        hexInput.value = hex;
        rgbInput.value = 'rgb(' + rgb.r + ', ' + rgb.g + ', ' + rgb.b + ')';
        hslInput.value = 'hsl(' + hsl.h + ', ' + hsl.s + '%, ' + hsl.l + '%)';
        clearError();
    }

    function updateFromHex(hex) {
        hex = hex.trim();
        if (hex && hex.charAt(0) !== '#') hex = '#' + hex;
        var rgb = hex2rgb(hex);
        if (!rgb) return;
        applyRgb(rgb);
    }

    function updateFromRgb(str) {
        var rgb = parseRgb(str);
        if (!rgb) return;
        applyRgb(rgb);
    }

    function updateFromHsl(str) {
        var hsl = parseHsl(str);
        if (!hsl) return;
        var rgb = hsl2rgb(hsl.h, hsl.s, hsl.l);
        applyRgb(rgb);
    }

    picker.addEventListener('input', function () {
        updateFromHex(this.value);
    });

    // Keep HEX input free while typing; validate on blur/Enter.
    hexInput.addEventListener('input', function () {
        clearError();
    });
    hexInput.addEventListener('blur', function () {
        var raw = this.value.trim();
        if (!raw) return;
        var normalized = raw.charAt(0) === '#' ? raw : ('#' + raw);
        var rgb = hex2rgb(normalized);
        if (!rgb) {
            showError(t('This is not a hexadecimal code'));
            return;
        }
        applyRgb(rgb);
    });
    hexInput.addEventListener('keydown', function (e) {
        if (e.key !== 'Enter') return;
        e.preventDefault();
        this.blur();
    });

    rgbInput.addEventListener('input', function () {
        updateFromRgb(this.value);
    });
    rgbInput.addEventListener('blur', function () {
        updateFromRgb(this.value);
    });

    hslInput.addEventListener('input', function () {
        updateFromHsl(this.value);
    });
    hslInput.addEventListener('blur', function () {
        updateFromHsl(this.value);
    });

    function copyText(text, btn) {
        if (navigator.clipboard && navigator.clipboard.writeText) {
            navigator.clipboard.writeText(text).then(function () {}).catch(function () {});
        } else {
            var ta = document.createElement('textarea');
            ta.value = text;
            document.body.appendChild(ta);
            ta.select();
            try { document.execCommand('copy'); } catch (e) {}
            document.body.removeChild(ta);
        }
        var orig = btn.textContent;
        btn.textContent = t('Copied!');
        btn.classList.add('copied');
        setTimeout(function () {
            btn.textContent = orig;
            btn.classList.remove('copied');
        }, 2000);
    }

    document.getElementById('btn-copy-hex').addEventListener('click', function () {
        copyText(hexInput.value, this);
    });
    document.getElementById('btn-copy-rgb').addEventListener('click', function () {
        copyText(rgbInput.value, this);
    });
    document.getElementById('btn-copy-hsl').addEventListener('click', function () {
        copyText(hslInput.value, this);
    });

})();
