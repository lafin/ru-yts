#### install
```
$ apt-get install mongodb nginx nodejs
```
#### nginx config

```
$ root@server:~# cat /etc/nginx/sites-enabled/yts.lafin.me 

upstream app {
  ip_hash;
  server 127.0.0.1:3000 weight=10 max_fails=3 fail_timeout=30s;
}

server {
  listen 80;

  server_name yts.lafin.me;
  access_log /var/log/nginx/nginx.access.log;
  error_log /var/log/nginx/nginx.error.log debug;

  location / {
    proxy_http_version 1.1;
    proxy_set_header Upgrade $http_upgrade;
    proxy_set_header Connection 'upgrade';
    proxy_set_header Host $host;
    proxy_cache_bypass $http_upgrade;

    proxy_pass http://app;
    proxy_redirect off;
  }

  location ~* \.(jpg|jpeg|png|gif|ico|css|js|eot|woff)$ {
    proxy_ignore_headers "Cache-Control";
    proxy_pass http://app;
    expires max;
  }

  error_page 500 502 503 504 /50x.html;
  location = /50x.html {
    root /var/www/nginx-default;
  }
}
```
#### upstart
```
$ root@server:~# cat /etc/init/yts.conf 

description     "yts"
author          "lafin"

# When to start the service
start on runlevel [2345]

# When to stop the service
stop on runlevel [06]

# Prepare the environment
#   Create directories for logging and process management
#   Change ownership to the user running the process
pre-start script
    mkdir -p /var/opt/node
    mkdir -p /var/opt/node/log
    mkdir -p /var/opt/node/run
    chown -R node:node /var/opt/node
end script

# If the process quits unexpectadly trigger a respawn
respawn

# Start the process
exec start-stop-daemon --start --chuid node --make-pidfile --pidfile /var/opt/node/run/node-upstart.pid --exec /usr/bin/nodejs -- /var/apps/yts/app.js >> /var/opt/node/log/node-upstart.log 2>&1
```
#### cron
```
$ root@server:~# cat /etc/crontab 

00 *    * * *   node    /usr/bin/nodejs /var/apps/yts/worker.js 100 10
30 *    * * *   node    /usr/bin/nodejs /var/apps/yts/worker.js 100 11
```
#### ls
```
root@server:~# ls -la /var/apps/yts/
total 1356
drwxr-xr-x  7 node node    4096 Nov  3 04:18 .
drwxr-xr-x  3 node node    4096 Oct 28 17:05 ..
-rw-r--r--  1 node node    5741 Nov  3 04:17 app.js
-rw-rw-r--  1 node node     323 Oct 28 17:40 config.js
drwxr-xr-x  8 node node    4096 Nov  3 04:17 .git
-rw-r--r--  1 node node      28 Oct 28 17:38 .gitignore
-rw-r--r--  1 node node     578 Oct 28 17:38 .jshintrc
-rw-r--r--  1 node node 1312895 Nov  3 13:57 log.txt
drwxr-xr-x  2 node node    4096 Nov  3 04:17 models
drwxr-xr-x 12 node node    4096 Nov  1 14:23 node_modules
-rw-r--r--  1 node node     432 Nov  1 14:22 package.json
drwxr-xr-x  3 node node    4096 Oct 28 17:05 public
-rw-r--r--  1 node node    1692 Nov  2 12:22 README.md
-rw-r--r--  1 node node      14 Oct 28 17:38 robots.txt
drwxr-xr-x  2 node node    4096 Nov  1 14:22 views
-rw-r--r--  1 node node    6734 Nov  3 04:17 worker.js
```
