FROM node:20-alpine
RUN apk add --no-cache \
    gcc \
    g++ \
    python3 \
    make

WORKDIR /app

RUN chown -R node:node /app

USER node

COPY --chown=node:node package*.json ./

RUN npm install

COPY --chown=node:node . .

EXPOSE 5001

CMD ["npm", "start"]
