### Russian films provider for Popcorn Time
[![Build Status](https://travis-ci.org/lafin/ru-yts.svg?branch=master)](https://travis-ci.org/lafin/ru-yts)
___

![](screenshot.png)

### Install
```
$ mkdir db log
$ curl -O https://raw.githubusercontent.com/lafin/ru-yts/master/docker-compose.x86_64.yml
$ docker-compose -f docker-compose.x86_64.yml up
```

### Update
```
$ rm -rf ./log/* ./db/*
$ docker-compose -f docker-compose.x86_64.yml pull
$ docker-compose -f docker-compose.x86_64.yml up
```

### Setup
Download last version Popcorn Time [here](http://popcorntime.ag) Into the setting of Popcorn Time need set address for you yts server (eg. Movie API Endpoint: http://127.0.0.1:3000/)

### Contributors

 * Author: [lafin](https://github.com/lafin)

### License

  MIT
