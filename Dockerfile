FROM node:20-bookworm-slim

ENV DEBIAN_FRONTEND=noninteractive

# Copy app
COPY . /home/node/app
RUN chown -R node:node /home/node/app

# Make data and database directories
RUN mkdir -p /database
RUN mkdir -p /data
RUN chown -R node:node /database
RUN chown -R node:node /data


RUN apt-get update && apt-get install -y git &&

# Switch to node user
USER node

# Set working directory
WORKDIR /home/node/app

# Install dependencies, generate grammar, and reduce size of kuzu node module
# Done in one step to reduce image size
RUN npm install &&\
    if [ "$SKIP_GRAMMAR" != "true" ] ; then npm run generate-grammar-prod ; else echo "Skipping grammar generation" ; fi &&\
    rm -rf node_modules/kuzu/prebuilt node_modules/kuzu/kuzu-source

# Fetch datasets
RUN if [ "$SKIP_DATASETS" != "true" ] ; then npm run fetch-datasets ; else echo "Skipping dataset fetch" ; fi

# Build app
RUN if [ "$SKIP_BUILD_APP" != "true" ] ; then npm run build ; else echo "Skipping build" ; fi

# Expose port
EXPOSE 8000

# Set environment variables
ENV NODE_ENV=production
ENV PORT=8000
ENV KUZU_PATH=/database

# Run app
ENTRYPOINT ["node", "src/server/index.js"]
