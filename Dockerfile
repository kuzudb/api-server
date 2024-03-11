FROM node:20-bookworm-slim

ENV DEBIAN_FRONTEND=noninteractive
# Copy app
COPY . /home/node/app

# Make data and database directories
RUN mkdir -p /database
RUN mkdir -p /data
RUN chown -R node:node /database
RUN chown -R node:node /data

# Install git, init submodules, minify, and remove git
RUN cd /home/node/app &&\
    apt-get update &&\
    apt-get install -y git &&\
    npm run clean &&\
    npm run init-submodule &&\
    npm run minify &&\
    apt-get remove -y git &&\
    apt-get autoremove -y &&\
    apt-get clean &&\
    chown -R node:node /home/node/app

# Switch to node user
USER node

# Set working directory
WORKDIR /home/node/app

# Install dependencies and reduce size of kuzu node module
RUN npm install &&\
    rm -rf node_modules/kuzu/prebuilt node_modules/kuzu/kuzu-source

# Expose port
EXPOSE 8000

# Set environment variables
ENV NODE_ENV=production
ENV PORT=8000
ENV KUZU_PATH=/database
ENV CROSS_ORIGIN=true

# Run app
ENTRYPOINT ["node", "index.js"]
