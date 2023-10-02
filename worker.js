/*
	Service Worker for CalClock - caches all the app content so the app will run
	offline and be installable as a progressive web app.
	
	Version 0.2.1 by Prajna Pranab
*/

// Cached version of CalClock
const CACHED_VERSION = '1.8.3';
const CURR_CACHE = 'calclock-v2';

// find the absolute root pathname
let pathElms = location.pathname.split('/');
let root = location.origin + '/' + pathElms.slice(0, -1).join('/');

// files to cache
let cacheFiles = [
	'index.html', 'manifest.json', 'offline.html', 'help.html',
	'js/calclock.js', 'js/timerlib.js', 'js/UCClib.js', 'js/UCCUtils.js',
	'css/calclock.css', 'css/normalize.css',
	'asset/images/earth.png', 'asset/images/spinner.svg', 'asset/images/zodiac.svg',
	'asset/images/ucc16ico.png', 'asset/images/ucc32ico.png', 'asset/images/ucc64ico.png',
	'asset/images/ucc128ico.png',	'asset/images/ucc144ico.png', 'asset/images/ucc192ico.png',
	'asset/images/ucc512ico.png', 'asset/images/favicon.ico'
];

// add root path to cacheFiles
for (file of cacheFiles) file = root + file;

// install the worker
self.addEventListener('install', ev => {
	ev.waitUntil(
		caches.open(CURR_CACHE)
		.then( cache => {
			console.log('[installing worker] adding files to cache...');
			return cache.addAll(cacheFiles);
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

// handle fetch requests
self.addEventListener('fetch', ev => {
	ev.respondWith(
		// look for it in our cache
		caches.match(ev.request)
		.then( resp => {
			// if not in the cache try the network
			return resp || fetch(ev.request)
			.then( response => {
				// if we got it from the network cache it and return it
				return caches.open(CURR_CACHE)
				.then( cache => {
					cache.put(ev.request, response.clone());
					return response;
				});
			});
		}).catch( (ev) => {
			// must be offline or the asset doesn't exist
			console.log(`fetch failed for ${ev.request.url}`);
			return caches.match('offline.html');
		})
	);
});
