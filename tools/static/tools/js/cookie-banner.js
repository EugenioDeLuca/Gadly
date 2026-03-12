(function() {
    var key = 'gadly-cookies-accepted';
    var banner = document.getElementById('cookie-banner');
    var btn = document.getElementById('cookie-accept');

    if (localStorage.getItem(key)) {
        if (banner) banner.classList.add('hidden');
    }

    if (btn && banner) {
        btn.addEventListener('click', function() {
            localStorage.setItem(key, '1');
            banner.classList.add('hidden');
        });
    }
})();
