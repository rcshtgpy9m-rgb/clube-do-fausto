/* Clube do Fausto moved to https://clube-do-fausto.pages.dev/ : this worker removes the old app from installed devices and sends them there. */
self.addEventListener("install", function () { self.skipWaiting(); });
self.addEventListener("activate", function (e) {
  e.waitUntil(
    caches.keys()
      .then(function (ks) { return Promise.all(ks.map(function (k) { return caches.delete(k); })); })
      .then(function () { return self.registration.unregister(); })
      .then(function () { return self.clients.matchAll({ type: "window" }); })
      .then(function (list) {
        list.forEach(function (c) {
          var u = new URL(c.url);
          c.navigate("https://clube-do-fausto.pages.dev/" + u.search + u.hash);
        });
      })
  );
});
