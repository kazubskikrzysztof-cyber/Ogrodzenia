/* ════════════════════════════════════════════════════════════════
   SERVICE WORKER – OgrodzeniePRO
   Plik: sw.js (wymagany dla pełnej obsługi PWA na iOS/Safari)

   Jak działa:
   1. 'install'  – pobieramy i zapisujemy pliki aplikacji w cache
   2. 'activate' – czyścimy stare wersje cache po aktualizacji
   3. 'fetch'    – gdy app potrzebuje zasobu: sprawdź cache najpierw
   ════════════════════════════════════════════════════════════════ */

// Nazwa wersji cache – zmień przy aktualizacji (np. 'ogr-v2')
const CACHE_NAZWA = 'ogr-v1';

// Lista plików do zapisania w cache przy instalacji
const PLIKI_DO_CACHE = [
  './',
  './index.html',
  './manifest.webmanifest',
];

/* ── INSTALL – zapisz pliki w cache ── */
self.addEventListener('install', event => {
  console.log('[SW] Instalacja – zapisuję pliki w cache...');
  event.waitUntil(
    caches.open(CACHE_NAZWA)
      .then(cache => cache.addAll(PLIKI_DO_CACHE))
      .then(() => {
        console.log('[SW] Pliki zapisane w cache ✅');
        return self.skipWaiting(); // aktywuj od razu bez czekania
      })
  );
});

/* ── ACTIVATE – wyczyść stare cache ── */
self.addEventListener('activate', event => {
  console.log('[SW] Aktywacja – czyszczę stare cache...');
  event.waitUntil(
    caches.keys().then(klucze =>
      Promise.all(
        klucze
          .filter(k => k !== CACHE_NAZWA) // usuń wszystkie cache oprócz aktualnego
          .map(k => {
            console.log('[SW] Usuwam stare cache:', k);
            return caches.delete(k);
          })
      )
    ).then(() => self.clients.claim()) // przejmij kontrolę nad stroną od razu
  );
});

/* ── FETCH – obsługa żądań sieciowych ── */
self.addEventListener('fetch', event => {
  // Strategia "Cache First" – najpierw cache, potem sieć
  event.respondWith(
    caches.match(event.request)
      .then(odpowiedzZCache => {
        if (odpowiedzZCache) {
          // Znaleziono w cache – zwróć natychmiast (offline działa!)
          return odpowiedzZCache;
        }
        // Nie ma w cache – spróbuj pobrać z sieci
        return fetch(event.request)
          .then(odpowiedzZSieci => {
            // Jeśli pobrano pomyślnie, zapisz w cache do następnego razu
            if (odpowiedzZSieci && odpowiedzZSieci.status === 200) {
              const kopia = odpowiedzZSieci.clone();
              caches.open(CACHE_NAZWA).then(cache => cache.put(event.request, kopia));
            }
            return odpowiedzZSieci;
          })
          .catch(() => {
            // Brak sieci i brak cache – zwróć stronę główną jako fallback
            return caches.match('./index.html');
          });
      })
  );
});
