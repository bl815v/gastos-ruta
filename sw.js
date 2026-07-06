const CACHE_NAME = "gastos-ruta-v1";

const FILES_TO_CACHE = [
	"./",
	"./index.html",
	"./manifest.webmanifest",

	"./css/styles.css",
	"./css/spreadsheet.css",
	"./css/modal.css",
	"./css/responsive.css",

	"./js/app.js",

	"./favicon.ico",

	"./assets/icons/icon-192.png",
	"./assets/icons/icon-512.png",
	"./assets/icons/apple-touch-icon.png"
];

self.addEventListener("install", (event) => {
	event.waitUntil(
		caches.open(CACHE_NAME).then((cache) => cache.addAll(FILES_TO_CACHE))
	);

	self.skipWaiting();
});

self.addEventListener("activate", (event) => {
	event.waitUntil(
		caches.keys().then((keys) =>
			Promise.all(
				keys.map((key) => {
					if (key !== CACHE_NAME) {
						return caches.delete(key);
					}
				})
			)
		)
	);

	self.clients.claim();
});

self.addEventListener("fetch", (event) => {
	if (event.request.method !== "GET") {
		return;
	}

	event.respondWith(
		caches.match(event.request).then((cachedResponse) => {
			return cachedResponse || fetch(event.request);
		})
	);
});