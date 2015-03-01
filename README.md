### Russian films provider for Popcorn Time
___

### Attention! I finished supporting server. You can deploy your server. This was very fun ^^

### Deploy
example config with nginx, docker and upstart [here](SETUP.md)

### Installation server
need configure config.js for torrent tracker [nnm-club.me](http://nnm-club.me)

```bash
$ npm install
$ node app.js // start http server
$ node worker.js // need run by cron
```

### Build client (Popcorn Time player 3.7)
need [download client](https://git.popcorntime.io/popcorntime/desktop/tree/master) and apply patch and build client [howto](https://git.popcorntime.io/popcorntime/desktop/tree/master)
```diff
diff --git a/src/app/settings.js b/src/app/settings.js
index 5e2b980..38a5e4d 100644
--- a/src/app/settings.js
+++ b/src/app/settings.js
@@ -102,28 +102,7 @@ Settings.updateEndpoint = {
 };

 Settings.ytsAPI = {
-   url: 'https://yts.re/api/',
-   index: 0,
-   proxies: [{
-       url: 'https://yts.re/api/',
-       fingerprint: 'D4:7B:8A:2A:7B:E1:AA:40:C5:7E:53:DB:1B:0F:4F:6A:0B:AA:2C:6C',
-   }, {
-       url: 'https://yts.pm/api/',
-       fingerprint: 'B6:0A:11:A8:74:48:EB:B4:9A:9C:79:1A:DA:FA:72:BF:F8:8B:0A:B3'
-   }, {
-       url: 'https://yts.io/api/',
-       fingerprint: '27:96:21:06:E3:2F:5D:3D:7D:46:13:EF:42:5B:AD:5E:C8:FD:DA:45'
-   }, {
-       url: 'https://yts-proxy.net/api/',
-       fingerprint: '8E:49:5B:A9:2E:F1:AE:E8:A2:BB:E2:77:E9:C3:BC:D4:5D:4B:66:1F'
-   }, {
-       url: 'http://proxy.piratenpartij.nl/yts.re/api/',
-       ssl: false,
-       fingerprint: /Piratenpartij.nl Proxy/
-   }, { // .wf is listed last due to lack of ECDSA support in nw0.9.2
-       url: 'https://yts.wf/api/',
-       fingerprint: '77:44:AC:40:4A:B8:A6:83:06:37:5C:56:16:B4:2C:30:B9:75:99:94'
-   }]
+   url: 'http://you-server/api/'
 };

 // App Settings
```

### Contributors

 * Author: [lafin](https://github.com/lafin)

### License

  [MIT](LICENSE)
