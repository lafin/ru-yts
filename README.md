### Russian films provider for Popcorn Time
___

[![MIT](http://img.shields.io/packagist/l/doctrine/orm.svg)](LICENSE "MIT")
[![PayPayl donate button](http://img.shields.io/paypal/donate.png?color=yellow)](https://www.paypal.com/cgi-bin/webscr?cmd=_s-xclick&hosted_button_id=84FCYCT98BTPG "Donate once-off to this project using Paypal")

### Installation server
need configure config.js for torrent tracker [nnm-club.me](http://nnm-club.me)

```bash
$ npm install
$ node app.js // start http server
$ node worker.js // need run by cron
```

### Build client (Popcorn Time player)
need [download client](https://git.popcorntime.io/stash/projects/PT/repos/popcorn-app/browse) and apply patch and build client [howto](https://git.popcorntime.io/stash/projects/PT/repos/popcorn-app/browse)
```diff
diff --git a/src/app/lib/models/movie_collection.js b/src/app/lib/models/movie_collection.js
index bb73eaa..58f40e1 100644
--- a/src/app/lib/models/movie_collection.js
+++ b/src/app/lib/models/movie_collection.js
@@ -11,7 +11,7 @@
 			return {
 				torrents: App.Config.getProvider('movie'),
 				subtitle: App.Config.getProvider('subtitle'),
-				metadata: App.Trakt
+				metadata: null
 			};
 		}
 	});
diff --git a/src/app/settings.js b/src/app/settings.js
index 291c07c..06fd21e 100644
--- a/src/app/settings.js
+++ b/src/app/settings.js
@@ -66,8 +66,8 @@ Settings.deleteTmpOnClose = true;
 Settings.updateApiEndpoint = 'http://popcorntime.io/';
 /* TODO: Buy SSL for main domain + buy domain get-popcorn.re for fallback
 Settings.updateApiEndpointMirror = 'https://popcorntime.cc/'; */
-Settings.yifyApiEndpoint = 'http://yts.re/api/';
-Settings.yifyApiEndpointMirror = 'http://yts.im/api/';
+Settings.yifyApiEndpoint = 'http://yts.lafin.me/api/';
+Settings.yifyApiEndpointMirror = 'http://yts.lafin.me/api/';
 Settings.connectionCheckUrl = 'http://google.com/';
 
 // App Settings
```

### Contributors

 * Author: [lafin](https://github.com/lafin)

### License

  [MIT](LICENSE)
