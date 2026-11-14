/* Clube do Fausto service worker */
const VERSION = "cdf-f662ad68e6";
const SHELL = ["./", "./index.html", "./manifest.webmanifest", "./icons/icon-192.png", "./icons/icon-512.png", "./icons/apple-touch-icon.png", "./icons/favicon.png"];
self.addEventListener("install", (e) => { e.waitUntil(caches.open(VERSION).then((c) => c.addAll(SHELL))); });
self.addEventListener("activate", (e) => { e.waitUntil(caches.keys().then((ks) => Promise.all(ks.filter((k) => k !== VERSION).map((k) => caches.delete(k)))).then(() => self.clients.claim())); });
self.addEventListener("message", (e) => { if (e.data === "skipWaiting") self.skipWaiting(); });
self.addEventListener("fetch", (e) => {
  const req = e.request; if (req.method !== "GET") return;
  const url = new URL(req.url);
  if (url.origin === location.origin) {
    // app shell: cache first, refresh in the background
    e.respondWith(caches.open(VERSION).then((c) => c.match(req, { ignoreSearch: true }).then((hit) => {
      const net = fetch(req).then((res) => { if (res.ok) c.put(req, res.clone()); return res; }).catch(() => hit || c.match("./index.html"));
      return hit || net;
    })));
    return;
  }
  // author portraits (Wikipedia): keep a copy so they show offline
  if (/upload\.wikimedia\.org/.test(url.host)) {
    e.respondWith(caches.open("cdf-portraits").then((c) => c.match(req).then((hit) => hit || fetch(req).then((res) => { if (res.ok || res.type === "opaque") c.put(req, res.clone()); return res; }))));
    return;
  }
  // book covers: keep a copy so they show offline
  if (/covers\.openlibrary\.org|gr-assets\.com|images-na\.ssl-images-amazon\.com|books\.google/.test(url.host)) {
    e.respondWith(caches.open("cdf-covers").then((c) => c.match(req).then((hit) => hit || fetch(req).then((res) => { if (res.ok || res.type === "opaque") c.put(req, res.clone()); return res; }))));
  }
});
self.addEventListener("push", (e) => {
  let d = {}; try { d = e.data ? e.data.json() : {}; } catch (_) { d = { title: "Clube do Fausto", body: e.data ? e.data.text() : "" }; }
  e.waitUntil(self.registration.showNotification(d.title || "Clube do Fausto", { body: d.body || "", tag: d.tag || "cdf", renotify: true, icon: "icons/icon-192.png", badge: "icons/favicon.png", data: { url: d.url || "./#today" } }));
});
self.addEventListener("notificationclick", (e) => {
  e.notification.close();
  const target = new URL((e.notification.data && e.notification.data.url) || "./#today", self.registration.scope).href;
  e.waitUntil(self.clients.matchAll({ type: "window", includeUncontrolled: true }).then((list) => {
    for (const c of list) { if (c.url.startsWith(self.registration.scope)) { c.postMessage({ go: target }); return c.focus(); } }
    return self.clients.openWindow(target);
  }));
});
