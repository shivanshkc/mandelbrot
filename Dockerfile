FROM nginx:1.21.6-alpine

# Copy all source code.
COPY shaders /source/shaders
COPY src /source/src
COPY favicon.png /source/favicon.png
COPY index.html /source/index.html
COPY LICENSE /source/LICENSE

# Copy nginx configuration.
COPY nginx/default.conf /etc/nginx/conf.d/default.conf
