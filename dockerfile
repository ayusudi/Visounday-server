FROM node:22.2
WORKDIR /app
COPY package*.json ./
RUN npm install -g npm@10.8.1
RUN apt update
RUN apt install python3 g++ make \
  libcairo2-dev \
  libpango1.0-dev \
  libjpeg-dev \
  libgif-dev \
  librsvg2-dev -y

RUN npm install
COPY --chown=node:node . .
EXPOSE 8000
CMD ["node", "app.js"]
