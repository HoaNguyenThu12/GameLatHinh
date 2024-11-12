FROM node:18.17.0-slim

WORKDIR /app

# Sao chép file package và cài đặt dependencies
COPY package*.json ./
RUN npm install

# Sao chép toàn bộ mã nguồn
COPY . .

# Cài đặt dotenv
RUN npm install dotenv

EXPOSE 3000

CMD ["npm", "run", "start"]