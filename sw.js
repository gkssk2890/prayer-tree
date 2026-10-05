// 기도항아리 알림 도우미 (알림 표시와 알림을 눌렀을 때 앱 열기만 담당)
self.addEventListener("install", () => self.skipWaiting());
self.addEventListener("activate", (e) => e.waitUntil(self.clients.claim()));
// 화면 열기는 항상 최신 버전으로 (인터넷이 끊기면 안내 문구)
self.addEventListener("fetch", (e) => {
  if (e.request.mode !== "navigate") return;
  e.respondWith(fetch(e.request).catch(() => new Response(
    '<meta charset="utf-8"><meta name="viewport" content="width=device-width"><body style="font-family:sans-serif;text-align:center;padding:80px 20px;background:#fbf7f0"><h3>인터넷에 연결되지 않았어요</h3><p>연결되면 다시 열어 주세요</p></body>',
    { headers: { "Content-Type": "text/html; charset=utf-8" } })));
});
self.addEventListener("notificationclick", (e) => {
  e.notification.close();
  const url = (e.notification.data && e.notification.data.url) || "./?tab=prayer";
  e.waitUntil(
    self.clients.matchAll({ type: "window", includeUncontrolled: true }).then((list) => {
      for (const c of list) {
        if ("focus" in c) { c.postMessage({ go: "prayer" }); return c.focus(); }
      }
      return self.clients.openWindow(url);
    })
  );
});
