FROM nginx:1.29-alpine
COPY apps/landing/.docker/nginx.conf /etc/nginx/conf.d/default.conf
COPY apps/landing/index.html apps/landing/robots.txt /usr/share/nginx/html/
