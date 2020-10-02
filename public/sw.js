
const version = /*SW-VERSION*/'1.0.4'/*SW-VERSION*/;
let cacheKey = 'app-'+version;
let sharedFiles = [];
const FILES_TO_CACHE = [
    '/',
    '/index.html',
    '/offline.html',
    '/main.js',
    '/manifest.json',
    '/sw.js',
    '/favicon.ico',
    '/assets/icons/icon@144.png',
];
console.log('[SW] RUN ServiceWorker',cacheKey);
self.addEventListener('install', (event) => {
    console.log('[SW] Install',version);
    event.waitUntil(caches.open(cacheKey).then(function(cache)
        {
            return cache.addAll(FILES_TO_CACHE);
        }).then(function()
        {
            console.log('[SW] Install completed',version);
        }).catch (function (e)
        {
            console.error('[SW] Installation failed',cacheKey,e,arguments);
        })
    );
    self.skipWaiting();
});

self.addEventListener('activate', (evt) => {
    //console.log('[SW] Activate');
    evt.waitUntil(
        caches.keys().then((keyList) => {
            return Promise.all(keyList.map((key) => {
                if (key !== cacheKey) {
                    console.log('[SW] Removing old cache', key);
                    return caches.delete(key);
                }
            }));
        })
    );
    self.clients.claim();
});

self.addEventListener('fetch', (event) =>
{
    //console.log('[SW] Fetch', event.request.url);
    if (event.request.url && (
        event.request.url.indexOf('/socket.io/') !== -1 ||
        event.request.url.indexOf('/sockjs-node/') !== -1 ||
        (event.request.url.indexOf('/api/') !== -1 && event.request.url.indexOf('/api/media') === -1)
    ))
    {
        return
    }
    //console.log('[SW] Fetch', event.request.url);
    let handleClientSide = true;
    const pathname = (new URL(event.request.url)).pathname;
    //console.log('url',event.request.url,'pathname:',pathname);
    if (handleClientSide && pathname === '/share-target') {

        event.respondWith(Response.redirect('/'));
        event.waitUntil(async function ()
        {
            const data = await event.request.formData();
            const client = await self.clients.get(event.resultingClientId || event.clientId);
            const mediaFiles = data.getAll('media');
            for (const mediaFile of mediaFiles) {
                console.log('mediaFile',mediaFile);
                sharedFiles.push({file:mediaFile,type:mediaFile.type,name:mediaFile.name,size:mediaFile.size});
                //client.postMessage({ action: 'SHARED_FILE', mediaFile:mediaFile  });
            }
        }());
        return;
    }

    let corsRequest = new Request(event.request.url, {mode: 'no-cors'}); // important to avoid CORS error with socket.io
    event.respondWith( // Cache First
        caches.open(cacheKey).then(function(cache) {
            return cache.match(event.request).then(function (response) {
                //console.log('[SW] From Cache',response ? response.status : false,response ? response.url : false);
                return response || fetch(corsRequest).then(function(response) {
                    if (event.request.url && (
                        event.request.url.indexOf('sockjs-node/') === -1
                        && event.request.url.indexOf('hot-update.js') === -1
                        && event.request.url.indexOf('/api/media') !== -1
                        && event.request.url.indexOf('chrome-extension://')) === -1
                    )
                    {
                        //console.log('[SW] PUT INTO CACHE',version,event.request.url);
                        return cache.put(event.request, response.clone()).then(function ()
                        {
                            return response;
                        });
                    }
                    //cache.put(event.request, response.clone());
                    return response;
                });
            }).catch(function() {  // If both fail, show a generic fallback:
                return caches.match('/offline.html');
            })
        })
    );
});

// Push Notifications
self.addEventListener('push', function(e) {
    console.log('[SW] Push',e.data.text());
    let data = JSON.parse(e.data.text());
    const title = data.title;
    const options = {
        body: data.body,
        icon: data.icon || 'assets/icons/icon-72x72.png',
        badge: data.badge || 'assets/icons/icon-192x192.png'
    };
    e.waitUntil(self.registration.showNotification(title, options));
});

// Handle Push Notification Clicks
self.addEventListener('notificationclick', function(e) {
    console.log('[SW] Notification click Received.');
    e.notification.close();
    const rootUrl = new URL('/', location).origin+'?pushActivate=1';
    console.log('[SW] event',e,'rootUrl',rootUrl);
    //console.log('data',e.notification.data);
    e.waitUntil(clients.matchAll().then(matchedClients =>
        {
            for (let client of matchedClients)
            {
                if (client.url.indexOf(rootUrl) >= 0)
                {
                    return client.focus();
                }
            }
            return clients.openWindow(rootUrl).then(function (client) { client.focus(); });
        })
    );
    self.clients.matchAll().then(clients => {
        clients.forEach(client => client.postMessage({action:'PUSH',data:e.notification.data}));
    })
});

// Communication with page
self.addEventListener("message", async (e) => { // msg from app
    //client.postMessage(`Pong: ${ e.data }`);
    //console.log('onMessage:',e,'clientId',e.source ? e.source.id : false,'data',e.data);
    let client;
    if (e.source && e.source.id)
    {
        client = await clients.get(e.source ? e.source.id :false);
    }
    if (e.data.action === 'SKIP_WAITING')
    {
        self.skipWaiting();
    }
    if (e.data.action === 'VERSION')
    {
        client ? client.postMessage({action:'VERSION',version:version}) : false;
    }
    if (e.data.action === 'HAS_SHARED_FILES')
    {
        //console.log('hasSharedFiles Respond',sharedFiles,"client",client);
        client ? client.postMessage({action:'SHARED_FILES',sharedFiles:sharedFiles}) : false;
        sharedFiles = [];
    }
});

// Background Sync
self.addEventListener('sync', function(event) {

    console.log(new Date().toISOString(),'Sync Event',event.tag);
});

if (typeof module !== 'undefined' && module.exports)
{
    module.exports = version;
}