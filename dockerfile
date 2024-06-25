FROM node:22.2
WORKDIR /app
COPY package*.json ./
RUN apt update
RUN apt-get update && apt-get install -y \
  python3 \
  g++ \
  make \
  libcairo2-dev \
  libpango1.0-dev \
  libjpeg-dev \
  libgif-dev \
  librsvg2-dev \
  pip \ 
  ffmpeg

RUN npm install -g npm@10.8.1
RUN npm install


COPY . .
EXPOSE 8000
CMD ["node", "app.js"]
