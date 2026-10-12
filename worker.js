/*
	Service Worker for CalClock - caches all the app content so the app will run
	offline and be installable as a progressive web app.
	
	by Swami Prajna Pranab with assistance from Claude AI
*/

// Cached version of CalClock
const CACHED_VERSION = '1.2.5';
// 1.2.3 dev note: any content change rides with a byte-nudge here so
// browsers re-install the precache (fetch-failure falls back to cache).
// 1.2.3b: inited-flag fix + versioned asset URLs in index.html.
// 1.2.5 hardening (his desktop console, 12-Oct): precache name bumped so
// the polluted old cache dies at activate; the three console errors all
// traced to UNguarded caching — an extension's chrome-extension:// request
// being put() ("Request scheme unsupported"), and a put network error
// during install taking the WHOLE addAll down with it.
const CURR_CACHE = 'calclock-1.2.5';

// find the absolute root pathname
// (1.2.5: origin + '/' + '/apps/...' produced a DOUBLE slash — some hosts
//  redirect it and a redirected response cannot be cache.put()ed; join so
//  root is origin + path, single slash)
let pathElms = location.pathname.split('/');
let root = location.origin + pathElms.slice(0, -1).join('/');

// files to cache
let cacheFiles = [
	'index.html', 'manifest.json', 'offline.html', 'help.html',
	'js/calclock.js', 'js/timerlib.js', 'js/UCClib.js',
	'css/calclock.css',
	'asset/images/earth.png', 'asset/images/spinner.svg', 'asset/images/zodiac.png',
	'asset/images/ucc16ico.png', 'asset/images/ucc32ico.png', 'asset/images/ucc64ico.png',
	'asset/images/ucc128ico.png',	'asset/images/ucc144ico.png', 'asset/images/ucc192ico.png',
	'asset/images/ucc512ico.png', 'asset/images/favicon.ico'
];

// add root path to cacheFiles
cacheFiles = cacheFiles.map(file => root + '/' + file);

// install the worker — per-file, best effort: one flaky body logs and is
// skipped instead of failing the whole precache (the old addAll was
// atomic: any single network error = NO offline cache, silently)
self.addEventListener('install', ev => {
	ev.waitUntil(
		caches.open(CURR_CACHE)
		.then( cache => {
			console.log('[installing worker] adding files to cache...');
			return Promise.all(cacheFiles.map(file => {
				// fetch + put with ONE retry: his desktop line drops bodies
				// on the big files (zodiac.png, 828KB = 15x the next) and a
				// mid-body death surfaces as put NetworkError; an extension
				// rewriting the request surfaces the same way — the rewritten
				// message (vs plain NetworkError) tells them apart.
				const grab = () => fetch(file, {cache: 'reload'}).then(response => {
					if (!response.ok)
						throw new Error('HTTP ' + response.status);
					if (response.redirected || response.url !== file)
						throw new Error('rewritten: ' + response.url);
					return cache.put(file, response);
				});
				return grab()
					.catch(() => grab())
					.catch(error => console.log('[install] skip ' + file + ' (' + error + ')'));
			}));
		})
		.catch( error => {
			console.log('[Cache Open] ' + CURR_CACHE + ' cache ' + error);
		})
	);
});

// worker was activated
self.addEventListener('activate', ev => {
	// check for out-of-date caches
	caches.keys().then(
		cacheNames => {
			return Promise.all(
				cacheNames.map(
					cacheName => {
						if (cacheName != CURR_CACHE) {
							console.log('deleted old cache: ' + cacheName);
							return caches.delete(cacheName);
						}
					}
				)
			)
		}
	);
	console.log('worker activated.');
});

// add event listener to skip waiting to update
self.addEventListener('message', ev => {
    if (ev.data === 'SKIP_WAITING') self.skipWaiting();
});

// handle fetch requests (1.2.5: ONLY ours — GET under this root. Extension
// scheme / cross-origin / non-GET requests pass straight to the browser;
// the unguarded put was throwing "Request scheme 'chrome-extension' is
// unsupported" on every extension-injected request)
self.addEventListener('fetch', ev => {
    if (ev.request.method !== 'GET') return;
    if (!ev.request.url.startsWith(root + '/')) return;
    ev.respondWith(
        fetch(ev.request)
        .then(response => {
            const clone = response.clone();
            caches.open(CURR_CACHE)
                .then(cache => cache.put(ev.request, clone))
                .catch(() => {});	// runtime cache is best effort — never surface
            return response;
        })
        .catch(() => {
            return caches.match(ev.request)
                .then(cached => cached || caches.match('offline.html'));
        })
    );
});
