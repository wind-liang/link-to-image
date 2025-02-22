# 部署指南

本文档将指导你如何将链图部署到生产环境。

## 环境要求

- Node.js 18.0.0 或更高版本
- npm 或 yarn 包管理器
- 一个支持 Node.js 的托管平台（推荐：Vercel、Railway、Netlify 等）

## 部署步骤

### 1. 准备工作

1. 确保你的代码已经提交到 Git 仓库
2. 确保你已经完成了所有的环境变量配置

### 2. 使用 Vercel 部署（推荐）

Vercel 是部署 Next.js 应用最简单的平台之一：

1. 注册 [Vercel](https://vercel.com) 账号
2. 在 Vercel 控制台中点击 "New Project"
3. 导入你的 Git 仓库
4. 配置以下环境变量（如果需要）：
   - `NEXT_PUBLIC_SITE_URL`: 你的网站域名
   - `GOOGLE_SITE_VERIFICATION`: Google 站长验证码
5. 点击 "Deploy"

部署完成后，Vercel 会自动为你的项目分配一个域名。你也可以配置自定义域名。

### 3. 手动部署

如果你想手动部署到自己的服务器，按照以下步骤操作：

1. 构建项目
```bash
npm run build
```

2. 启动生产服务器
```bash
npm start
```

建议使用 PM2 等进程管理工具来运行应用：

```bash
npm install -g pm2
pm2 start npm --name "link-to-image" -- start
```

### 4. Docker 部署

我们也提供了 Docker 支持：

1. 构建镜像
```bash
docker build -t link-to-image .
```

2. 运行容器
```bash
docker run -p 3000:3000 link-to-image
```

## 性能优化建议

1. 启用缓存
2. 配置 CDN
3. 启用压缩

## 监控和日志

建议配置以下监控工具：

1. Google Analytics
2. Sentry（错误跟踪）
3. 服务器监控（如 New Relic）

## 安全建议

1. 启用 HTTPS
2. 配置 CSP 头
3. 定期更新依赖
4. 限制 API 请求频率

## 故障排除

如果遇到部署问题，请检查：

1. Node.js 版本是否正确
2. 环境变量是否配置完整
3. 构建日志中是否有错误信息
4. 服务器防火墙设置

## 更新部署

1. 拉取最新代码
2. 重新构建
3. 重启服务器

如有任何问题，请提交 Issue 或联系维护团队。 