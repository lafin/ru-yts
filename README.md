### Russian films provider for Popcorn Time
___

### I am not affiliated with the project [popcorn-time.ru](http://popcorn-time.ru/)

### Deploy
example config with nginx, docker and upstart [here](SETUP.md)

### Installation server
need configure config.js for torrent tracker [nnm-club.me](http://nnm-club.me)

```bash
$ npm install
$ npm start
```

### Build client (Popcorn Time player 3.8.5)
need [download client](https://git.popcorntime.io/popcorntime/desktop/repository/archive.zip?ref=v0.3.8-5) and apply patch and build client [howto](https://git.popcorntime.io/popcorntime/desktop/tree/v0.3.8-5)

Change settings [here](https://git.popcorntime.io/popcorntime/desktop/blob/v0.3.8-5/src/app/settings.js#L107-124)
```js
...
{
    uri: 'http://your-api-server/',
    strictSSL: false
}
...
```

### Contributors

 * Author: [lafin](https://github.com/lafin)

### License

  [MIT](LICENSE)
