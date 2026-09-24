FROM apify/actor-node:18

COPY package*.json ./

RUN npm install --include=dev

COPY . ./

RUN npm run build

CMD ["node", "dist/main.js"]
