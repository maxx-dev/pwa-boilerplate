// This optional code is used to register a service worker.
// register() is not called by default.

// This lets the app load faster on subsequent visits in production, and gives
// it offline capabilities. However, it also means that developers (and users)
// will only see deployed updates on subsequent visits to a page, after all the
// existing tabs open on the page have been closed, since previously cached
// resources are updated in the background.

// To learn more about the benefits of this model and instructions on how to
// opt-in, read http://bit.ly/CRA-PWA.

const isLocalhost = Boolean(
  window.location.hostname === 'localhost' ||
    // [::1] is the IPv6 localhost address.
    window.location.hostname === '[::1]' ||
    // 127.0.0.1/8 is considered localhost for IPv4.
    window.location.hostname.match(
      /^127(?:\.(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)){3}$/
    ) || window.location.hostname === 'devchat.pairly.app'
);

export function register(config) {

  //return;
  //console.log('process.env.NODE_ENV',process.env.NODE_ENV);
  //if ((process.env.NODE_ENV === 'production') && 'serviceWorker' in navigator)
  if ((process.env.ENV) && 'serviceWorker' in navigator)
  {
    // The URL constructor is available in all browsers that support SW.
    const publicUrl = new URL(process.env.PUBLIC_URL, window.location);
    if (publicUrl.origin !== window.location.origin) {
      // Our service worker won't work if PUBLIC_URL is on a different origin
      // from what our page is served on. This might happen if a CDN is used to
      // serve assets; see https://github.com/facebook/create-react-app/issues/2374
      return;
    }

    window.addEventListener('load', () => {
      //const swUrl = `${process.env.PUBLIC_URL}/service-worker.js`;
      const swUrl = `sw.js`;

      if (isLocalhost) {
        // This is running on localhost. Let's check if a service worker still exists or not.
        checkValidServiceWorker(swUrl, config);

        // Add some additional logging to localhost, pointing developers to the
        // service worker/PWA documentation.
        navigator.serviceWorker.ready.then(() => {
          //console.log('This web app is being served cache-first by a service worker. To learn more, visit http://bit.ly/CRA-PWA');
        });
      } else {
        // Is not localhost. Just register service worker
        registerValidSW(swUrl, config);
      }
    });
  }
}

function registerValidSW(swUrl, config) {
  console.log('Register Service Worker!');
  navigator.serviceWorker.register(swUrl).then(registration => {

      window.sw = registration;
      let event = new CustomEvent('ServiceWorkerRegistered');
      window.dispatchEvent(event);
      registration.onupdatefound = () => {
        const installingWorker = registration.installing;
        installingWorker.onstatechange = () => {
          console.log('ServiceWorker StateChange',installingWorker.state);
          if (installingWorker.state === 'installed')
          {
            if (localStorage.getItem('updateConfirmed'))
            {
              installingWorker.postMessage({ action: 'VERSION' });
              installingWorker.postMessage({ action: 'skipWaiting' }); // triggers reload
            }
            if (navigator.serviceWorker.controller) {
              // At this point, the updated precached content has been fetched,
              // but the previous service worker will still serve the older
              // content until all client tabs are closed.
              console.log('New content is available and will be used when all tabs for this page are closed. See http://bit.ly/CRA-PWA.');
              // Execute callback
              if (config && config.onUpdate) {
                config.onUpdate(registration);
              }
            } else {
              // At this point, everything has been precached.
              // It's the perfect time to display a
              // "Content is cached for offline use." message.
              console.log('Content is cached for offline use.');

              // Execute callback
              if (config && config.onSuccess) {
                config.onSuccess(registration);
              }
            }
          }

          if (installingWorker.state === 'activated')
          {
            if (localStorage.getItem('updateConfirmed'))
            {
              localStorage.removeItem('updateConfirmed');
              window.dispatchEvent(new CustomEvent('UPDATE_DONE'));
            }
          }
        };
      };
    })
    .catch(error => {
      console.error('Error during service worker registration:', error);
    });

  navigator.serviceWorker.ready.then(function (registration)
  {
    //console.log('SW','Ready');
    navigator.serviceWorker.addEventListener("message", (e) =>
    {
      //console.log('MSG_FROM_SW',e.data.action,e);
      if (e.data.action === 'PUSH')
      {
        console.log('push', e.data.data);
      }
      if (e.data.action === 'VERSION')
      {
        //console.log('SW','Reported Version',e.data.version);
        window.VERSION_SERVICE_WORKER = e.data.version;
        window.dispatchEvent(new CustomEvent('RECEIVED_SERVICE_WORKER_VERSION'));
      }
      if (e.data.action === 'SHARED_FILES')
      {
        //console.log('GOT SHARED_FILES',e.data.sharedFiles);
        window.onReceivedSharedFiles(e.data.sharedFiles);
      }
      if (e.data.action === 'PUSH')
      {
        window.onReceivedPushMsg(e.data.data);
      }
    });
    registration.active.postMessage({action: 'VERSION'});
    registration.active.postMessage({action: 'HAS_SHARED_FILES'});
    window.app.serviceWorkerRegistration = registration;
  })
}

function checkValidServiceWorker(swUrl, config) {
  fetch(swUrl)
    .then(response => {
      if (
        response.status === 404 ||
        response.headers.get('content-type').indexOf('javascript') === -1
      ) {
        // No service worker found. Probably a different app. Reload the page.
        navigator.serviceWorker.ready.then(registration => {
          registration.unregister().then(() => {
            window.location.reload();
          });
        });
      } else {
        registerValidSW(swUrl, config);
      }
    })
    .catch(() => {
      console.log(
        'No internet connection found. App is running in offline mode.'
      );
    });
}

export function unregister() {
  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.ready.then(registration => {
      registration.unregister();
    });
  }
}
