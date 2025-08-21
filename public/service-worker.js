self.addEventListener("install", (event) => {
  console.log("[Service Worker] Installing...");
});

// self.addEventListener("fetch", (event) => {
//   event.respondWith(fetch(event.request)); // Forward all requests to the network
// });
