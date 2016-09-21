FROM lafin/alpine:platform
MAINTAINER Sergey Kuvakin (lafin)

RUN adduser -D node
RUN apk add --no-cache nodejs openssl && \
  wget https://github.com/lafin/ru-yts/archive/master.zip && \
  unzip -q master.zip && \
  rm master.zip
RUN cd /ru-yts-master && npm i

EXPOSE 3000
CMD ["node", "/ru-yts-master/server/app.js"]
