# Gunakan base image Node.js versi stabil (LTS)
FROM node:18-alpine

# Set working directory di container
WORKDIR /app

# Salin package.json dan package-lock.json (kalau ada) ke container
COPY package*.json ./

# Install dependencies
RUN npm install --production

# Salin semua kode aplikasi ke container
COPY . .

# Expose port yang dipakai aplikasi (5000 sesuai env PORT)
EXPOSE 5000

# Jalankan aplikasi dengan perintah node index.js
CMD ["node", "index.js"]
