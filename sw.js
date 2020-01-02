function WebSocketSQL(db) {
    return new Promise(function (openResolve, openReject) {
        let socket = new WebSocket('wss://sql.mwr.pub/' + db);
        let callbacks = {};
        socket.onmessage = function (e) {
            let response = JSON.parse(e.data);
            if (callbacks[response.id]) {
                callbacks[response.id](response);
                callbacks[response.id] = null;
            }
        };
        socket.onopen = function (e) {
            let op = {
                query: function (sql) {
                    return new Promise(function (resolve, reject) {
                        let seq = (new Date()).getTime();
                        callbacks[seq] = function (data) {
                            resolve(data.data)
                        };
                        socket.send(JSON.stringify({sql: sql, type: 'query', id: seq}))
                    });
                },
                execute: function (sql) {
                    return new Promise(function (resolve, reject) {
                        let seq = (new Date()).getTime();
                        callbacks[seq] = function (data) {
                            resolve(data.row)
                        };
                        socket.send(JSON.stringify({sql: sql, type: 'execute', id: seq}))
                    });
                },
                close: function () {
                    socket.send("close");
                },
            };
            openResolve(op);
        };
    });
}

function getLocation(href) {
    var match = href.match(/^(https?\:)\/\/(([^:\/?#]*)(?:\:([0-9]+))?)([\/]{0,1}[^?#]*)(\?[^#]*|)(#.*|)$/);
    return match && {
        href: href,
        protocol: match[1],
        host: match[2],
        hostname: match[3],
        port: match[4],
        pathname: match[5],
        search: match[6],
        hash: match[7]
    }
}

function getQueryVariable(search, variable) {
    var query = search.substring(1);
    var vars = query.split("&");
    for (var i = 0; i < vars.length; i++) {
        var pair = vars[i].split("=");
        if (pair[0] === variable) {
            return pair[1];
        }
    }
    return (false);
}

self.addEventListener('install', function (event) {
    self.skipWaiting();
});
self.addEventListener('fetch', function (event) {
    if (event.request.url.endsWith('sw.js')) {
        return;
    }
    let req = getLocation(event.request.url);
    let headers = new Headers();
    headers.set('content-type', 'text/html');
    headers.set('power-by', 'BunnyFront');
    event.respondWith(WebSocketSQL('blog').then(function (wsq) {
        return wsq.query("select * from article where id=" + (getQueryVariable(req.search, 'id') || 1)).then(function (data) {
            let result = `
<html>
<head>
<title>OneSite.js</title>
</head>
<body>
    <h1>OneSite</h1>
    <p>${event.request.url}</p>
    <p>ID:${data[0].id}</p>
    <p>Content:${data[0].content}</p>
</body>
</html>
    `;
            return new Response(result, {headers: headers})
        }).catch(function (err) {
            return new Response(JSON.stringify(err), {headers: headers})
        })
    }));
});
