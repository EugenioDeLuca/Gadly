(function() {
    var key = 'gadly-cookies-accepted';
    var banner = document.getElementById('cookie-banner');
    var btn = document.getElementById('cookie-accept');

    if (!banner) return;

    // Start hidden in HTML and reveal only if consent is missing.
    if (!localStorage.getItem(key)) {
        banner.removeAttribute('hidden');
        banner.classList.remove('hidden');
        banner.setAttribute('data-ready', '1');
    } else {
        banner.setAttribute('data-ready', '1');
    }

    if (btn) {
        btn.addEventListener('click', function() {
            localStorage.setItem(key, '1');
            banner.classList.add('hidden');
        });
    }
})();
