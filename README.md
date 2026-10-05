# Medal Studio · 运动奖章工坊

单页、无依赖的 Apple Watch 运动奖章风格创作工具。上传 PNG 或纯图形 SVG，自定义圆形、六边形、花瓣、盾牌及四种材质，调整厚度、金属感、粗糙度、图案大小，拖动查看并导出透明 2048 × 2048 PNG。

图片仅在浏览器内处理。Canvas 2D 模拟奖章的立体厚度与金属光泽；上传图片保留为奖章正面的图案，不进行真实三维网格重建。当前不提供 GLB/STL 导出或 Apple Fitness 导入。

## 本地运行

在项目目录运行 `python3 -m http.server 8080 --directory dist`，访问 `http://localhost:8080`。也可以直接打开 `dist/index.html`。

## 部署

`dist` 是完整静态网站，可部署到 GitHub Pages 或其他静态托管服务。Sites 发布配置在 `.openai/hosting.json`。设计交互参考 https://www.emoji3d.org，未使用其代码或图片资源。非 Apple 官方产品。
