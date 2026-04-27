FROM node:20-slim
WORKDIR /app
COPY package*.json ./
RUN npm ci --production
COPY . .
# Ensure the data directory is writable by any user (required for Hugging Face Spaces)
RUN mkdir -p data && chmod -R 777 data
EXPOSE 7860
ENV PORT=7860
CMD ["node", "server/index.js"]
