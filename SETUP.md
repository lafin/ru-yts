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

#### docker

```
docker pull dockerfile/mongodb
docker run -d -p 27017:27017 --name mongodb dockerfile/mongodb

docker build -t yts .
docker run -d -p 3000:3000 --link mongodb:mongodb --name yts -t yts
```

#### upstart

```
description     "yts"
author          "lafin"
start on runlevel [2345]
stop on runlevel [!2345]

pre-start script

end script
  /usr/bin/docker start -a mongodb
respawn

script
  /usr/bin/docker start -a yts
end script
```