FROM node:22-alpine
WORKDIR /app
ENV NODE_ENV=production
COPY package.json package-lock.json ./
COPY server/package.json ./server/
RUN npm ci --omit=dev --workspace server
COPY server ./server
EXPOSE 8080
CMD ["node", "server/src/index.js"]
