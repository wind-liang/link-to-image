# 使用 Node.js 18 作为基础镜像
FROM node:18-alpine

# 设置工作目录
WORKDIR /app

# 复制 package.json 和 package-lock.json
COPY package*.json ./

RUN npm config set registry https://registry.npmmirror.com/

# 安装 Python 和构建工具
RUN apk add --no-cache \
    python2 \
    py2-pip \
    build-base \
    bash

# 安装依赖
RUN npm install

# 复制所有源代码
COPY . .

# 构建应用
RUN npm run build

# 暴露端口
EXPOSE 3003

# 启动应用
CMD ["npm", "start"] 