# 本地照片拼接工具

一个简单、轻量的网页照片拼接工具。所有图片都在浏览器本地处理，不需要上传服务器，适合快速把多张图片拼成横向长图、纵向长图或宫格图，并导出为 PNG / JPEG。

## 功能特点

- 支持横向拼接、纵向拼接和宫格拼接
- 支持 1x2、1x3、2x2、3x3 等常用模板
- 支持点击上传或拖拽图片到指定位置
- 支持设置图片间距
- 宫格模式支持「填满裁切」和「完整显示」
- 支持导出 PNG 和 JPEG
- 纯前端实现，图片只在本地浏览器处理

## 使用方式

直接用浏览器打开 `index.html` 即可使用。

也可以启动一个本地静态服务：

```bash
python3 -m http.server 8080
```

然后访问：

```text
http://localhost:8080
```

## 项目结构

```text
.
├── index.html   # 页面结构
├── styles.css   # 页面样式
├── app.js       # 拼接逻辑和导出逻辑
└── README.md
```

## 技术说明

项目使用原生 HTML、CSS 和 JavaScript 实现，不依赖构建工具或第三方框架。图片通过 `FileReader` 读取，并使用 Canvas 绘制最终导出图。

## 部署到 GitHub Pages

1. 将项目上传到 GitHub 仓库。
2. 进入仓库的 `Settings`。
3. 打开 `Pages`。
4. 在 `Build and deployment` 中选择 `Deploy from a branch`。
5. 选择 `main` 分支和根目录 `/`。
6. 保存后等待 GitHub Pages 部署完成。

## 隐私说明

本工具不会上传图片。所有图片读取、预览、拼接和导出都在当前浏览器中完成。

## License

MIT
