const BROWSER_CACHE = new RegExp("^/service-worker");

const CACHE_TRUST_AGE_MS = 60 * 1000;
const CACHE_DELAY_AGE_MS = 24 * 3600 * 1000; // Age at which we will attempt to update the cache.
const FAST_UPDATE_MS = 200; // How long we will wait for a fresh version before using the cached value.

const DEBUG = false;
const d = DEBUG? console.log : function(){};

this.addEventListener("install", e => {
	caches.open('live').then(cache => {
		return cache.addAll([
			"/",
		]);
	});
});

this.addEventListener("fetch", e => {
	let url = new URL(e.request.url);
	
	if (url.host != location.host) return d("WRONG HOST");
	if (url.pathname.match(BROWSER_CACHE)) return d("BROWSER CACHE");
	
	e.respondWith(tryFastUpdate(e));
});

function tryFastUpdate(e) {
	return caches.match(e.request).then(cacheres => {
		d("REQUEST", e.request.url);

		if (cacheres) {
			// If the cache entry is new enough don't try to update it.
			let cachedate = +new Date(cacheres.headers.get("Date"));
			let now = +new Date();
			var cache_age_ms = now - cachedate;
			d("CACHE AGE", cache_age_ms/1000);
			if (cache_age_ms < CACHE_TRUST_AGE_MS) {
				d("FRESH CACHE");
				return cacheres;
			}
		}
		
		// Fetch from the network.
		let network = fetch(e.request);
		// Store result in cache.
		network
			.then(res =>
				caches.open("live").then(cache =>
					cache.put(e.request, res.clone())))
			.catch(console.error);
		network = network.then(res => res.clone());
		
		if (cacheres) {
			// On failure fall back to cache instantly.
			network = network.catch(e => {
				console.error("Fetch failed", e, "falling back to cache.");
				return cacheres;
			});
		}
		
		let options = [network];
		
		// Fallback to cache after a timeout.
		if (cacheres) {
			let res = cacheres;
			if (cache_age_ms > CACHE_DELAY_AGE_MS) {
				d("STALE CACHE");
				// Cache is old enough that we will block the user for a fresh copy.
				res = delay(FAST_UPDATE_MS, res);
			}
			options.push(res);
		}
		
		// We would like Promise.any() however the network manually falls back
		// to cache on failure so Promise.race() should be fine.
		return Promise.race(options);
	});
}

function delay(ms, val) {
	return new Promise((resolve, _) => setTimeout(resolve, ms, val));
}
