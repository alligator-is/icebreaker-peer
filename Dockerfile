FROM alpine:3.2
MAINTAINER Markus Wunderlin <markus@sonium.org>
RUN apk update
RUN apk add git
RUN apk add nodejs
RUN mkdir -p /app
WORKDIR /app

ADD package.json /app/
RUN npm install
RUN npm cache clean
COPY . /app/
RUN apk del git
RUN rm -rf /var/cache/apk/*

CMD ["npm","test"]
