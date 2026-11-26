FROM node:26-slim AS build
WORKDIR /app
# placeholder, prisma.config.ts needs a url to generate the client
ENV DATABASE_URL=mysql://build:build@localhost:3306/build
COPY package.json package-lock.json prisma.config.ts tsconfig.json tsconfig.build.json ./
COPY prisma ./prisma
RUN npm ci
COPY src ./src
RUN npm run build

FROM build AS tools
CMD ["npx", "prisma", "migrate", "deploy"]

FROM node:26-slim AS runtime
ENV NODE_ENV=production
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci --omit=dev --omit=peer --ignore-scripts && npm cache clean --force
COPY --from=build /app/dist ./dist
USER node
EXPOSE 3000
CMD ["node", "dist/server.js"]
