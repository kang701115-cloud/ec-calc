"use strict";

const CACHE_NAME = "nutri-pwa-v3"; // 바꾸면 강제 갱신됨
const ASSETS = [
  "./",
  "./index.html",
  "./manifest.json"
  // 아이콘이 있으면 아래 2줄도 캐시됨(없으면 설치 자체가 실패할 수 있으니, 없을 땐 주석 유지)
  "./icon-192.png",
 "./icon-512.png"
];

// 설치: 정적 파일 캐시
self.addEventListener("install", (event) => {
  event.waitUntil((async ()=>{
    const cache = await caches.open(CACHE_NAME);
    await cache.addAll(ASSETS);
    self.skipWaiting();
  })());
});

// 활성화: 이전 캐시 정리
self.addEventListener("activate", (event) => {
  event.waitUntil((async ()=>{
    const keys = await caches.keys();
    await Promise.all(keys.map(k => (k !== CACHE_NAME) ? caches.delete(k) : Promise.resolve()));
    self.clients.claim();
  })());
});

// 요청 가로채기
self.addEventListener("fetch", (event) => {
  const req = event.request;
  if(req.method !== "GET") return;

  event.respondWith((async ()=>{
    const url = new URL(req.url);

    // 같은 origin만 처리
    if(url.origin !== self.location.origin){
      return fetch(req);
    }

    // HTML은 최신 우선(Network First)로: 업데이트 반영 잘 됨
    const isHTML = req.headers.get("accept")?.includes("text/html");
    if(isHTML){
      try{
        const fresh = await fetch(req);
        const cache = await caches.open(CACHE_NAME);
        cache.put(req, fresh.clone());
        return fresh;
      }catch(e){
        const cached = await caches.match(req);
        return cached || caches.match("./index.html");
      }
    }

    // 그 외(CSS/JS/이미지)는 캐시 우선(Cache First)
    const cached = await caches.match(req);
    if(cached) return cached;

    const fresh = await fetch(req);
    const cache = await caches.open(CACHE_NAME);
    cache.put(req, fresh.clone());
    return fresh;
  })());
});
