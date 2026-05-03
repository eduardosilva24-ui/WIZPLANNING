# Node + SQLite (wizplanning). Deploy to any host that runs containers (Railway, Render, Fly.io, ECS, VPS).
FROM node:20-bookworm-slim

WORKDIR /app

COPY package.json package-lock.json* ./
RUN npm install --omit=dev

COPY backend ./backend
COPY frontend ./frontend
COPY shared ./shared

RUN mkdir -p database uploads

ENV NODE_ENV=production
ENV PORT=3000
ENV HOST=0.0.0.0

EXPOSE 3000

CMD ["node", "backend/server.js"]
