### Russian films provider for Popcorn Time
___

### Deploy
example config with nginx, docker and upstart [here](SETUP.md)

### Installation server
need configure config.js for torrent tracker [nnm-club.me](http://nnm-club.me)

```bash
$ npm install
$ node app.js // start http server
$ node worker.js // need run by cron
```

### Build client (Popcorn Time player 3.7.1)
need [download client](https://git.popcorntime.io/popcorntime/desktop/repository/archive.zip?ref=v0.3.7.1) and apply patch and build client [howto](https://git.popcorntime.io/popcorntime/desktop/tree/4dd40d191076d297850991c45288cbb292f73739#quickstart)

Change settings [here](https://git.popcorntime.io/popcorntime/desktop/blob/4dd40d191076d297850991c45288cbb292f73739/src/app/settings.js#L98)
```js
 ...
 Settings.ytsAPI = {
    url: 'http://you-server/api/'
 };
 ...
```

### Contributors

 * Author: [lafin](https://github.com/lafin)

### License

  [MIT](LICENSE)
