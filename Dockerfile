FROM ubuntu:14.04
MAINTAINER lafin <kuvakin@gmail.com>

RUN apt-get update -y
RUN apt-get install -y git nodejs npm vim
RUN useradd -MUs /bin/bash node

RUN mkdir -p /var/apps
WORKDIR /var/apps
RUN git clone https://github.com/lafin/ru-yts.git yts
WORKDIR /var/apps/yts
RUN npm install

RUN echo \
"var mongoPort = process.env.MONGODB_PORT_27017_TCP_PORT;\n\
var ip = process.env.MONGODB_PORT_27017_TCP_ADDR;\n\
var connectionString = 'mongodb://' + ip + ':' + mongoPort + '/db';\n\
module.exports = {\n\
    db: connectionString || 'mongodb://localhost:27017/db',\n\
    urlEndPoint: 'http://nnmclub.to/forum/',\n\
    username: 'YOU LOGIN',\n\
    password: 'YOU PASSWORD'\n\
};\n" > /var/apps/yts/server/credential.js

EXPOSE 3000

RUN chown node:node /var/apps/yts/ -R
USER node
CMD nodejs /var/apps/yts/server/app.js
