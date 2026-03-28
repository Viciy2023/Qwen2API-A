FROM node:lts-alpine

ENV NODE_ENV=production
ENV SERVICE_PORT=7860
ENV LISTEN_ADDRESS=0.0.0.0

RUN apk add --no-cache python3 py3-pip

# 全局安装PM2
RUN npm install -g pm2

RUN pip install --no-cache-dir --break-system-packages huggingface_hub watchdog

WORKDIR /app

# 复制package文件
COPY package*.json ./

# 安装依赖
RUN npm install

# 复制应用代码
COPY . .

# 构建前端应用
RUN cd public && npm install && npm run build

# 删除前端不必要文件
RUN rm -rf public/src public/node_modules public/package*.json

# 设置权限
RUN chmod 777 /app

# 创建日志目录
RUN mkdir -p logs

# 允许执行入口脚本
RUN chmod +x /app/docker/entrypoint.sh

# 暴露 Hugging Face Docker Space 默认端口
# 应用实际监听端口仍由 SERVICE_PORT 控制
EXPOSE 7860

# 启动前自动从 HF Bucket 恢复数据，并在运行中后台同步
ENTRYPOINT ["/app/docker/entrypoint.sh"]
