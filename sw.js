self.addEventListener('install', function (event) {
    self.skipWaiting();
});
self.addEventListener('fetch', function (event) {
    if (event.request.url.endsWith('sw.js')) {
        return;
    }
    let headers = new Headers();
    headers.set('content-type', 'text/html');
    headers.set('power-by', 'BunnyFront');
    let result = `
<html>
<head>
<title>OneSite.js</title>
</head>
<body>
    <h1>OneSite</h1>
    <p>${event.request.url}</p>
</body>
</html>
    `;
    event.respondWith(new Response(result, {headers: headers}));
});
