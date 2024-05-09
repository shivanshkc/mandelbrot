FROM nginx:1.21.6-alpine

# Copy all source code.
COPY . /source/
# Copy nginx configuration.
COPY nginx/default.conf /etc/nginx/conf.d/default.conf
