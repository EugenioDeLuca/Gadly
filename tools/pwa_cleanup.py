from django.http import HttpResponse
from django.views.decorators.http import require_GET

# One-shot worker: clears PWA caches and unregisters itself (legacy installs).
_SW_CLEANUP_JS = """
'use strict';
self.addEventListener('install', function (event) {
    self.skipWaiting();
});
self.addEventListener('activate', function (event) {
    event.waitUntil(
        caches.keys().then(function (keys) {
            return Promise.all(keys.map(function (key) {
                return caches.delete(key);
            }));
        }).then(function () {
            return self.registration.unregister();
        })
    );
});
""".strip()


@require_GET
def pwa_sw_cleanup(request):
    response = HttpResponse(_SW_CLEANUP_JS, content_type="application/javascript; charset=utf-8")
    response["Cache-Control"] = "no-cache"
    return response
