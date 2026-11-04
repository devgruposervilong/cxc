// Limpieza temporal: la app dejo de ser una PWA, pero los clientes que ya la
// instalaron conservan el service worker anterior y su precache. Al publicar
// este archivo en /sw.js, el navegador lo detecta como actualizacion, borra
// los caches, recarga las pestanas y se desregistra solo.
//
// Se puede eliminar cuando ya no queden clientes con la version PWA instalada.

self.addEventListener("install", () => {
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    (async () => {
      const keys = await caches.keys();
      await Promise.all(keys.map((key) => caches.delete(key)));
      await self.registration.unregister();

      const clients = await self.clients.matchAll({ type: "window" });
      for (const client of clients) {
        client.navigate(client.url).catch(() => {});
      }
    })()
  );
});
