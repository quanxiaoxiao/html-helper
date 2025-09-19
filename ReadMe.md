# HTML Parser Utils

一个轻量级、功能强大的 HTML 解析和操作工具库，基于 `htmlparser2` 构建，提供 HTML 与 JSON AST 之间的转换以及丰富的 DOM 操作功能。

## ✨ 特性

- 🔄 **双向转换**：HTML 字符串与 JSON AST 之间的无损转换
- 🎯 **DOM 操作**：便捷的节点查找、添加、删除和修改功能
- 🛡️ **类型安全**：完善的错误处理和边界检查
- 📦 **零依赖**：除了 `htmlparser2` 外无其他运行时依赖
- 🚀 **高性能**：优化的遍历算法和最小化的内存使用
- 🧪 **全面测试**：100% 的测试覆盖率

## 📦 安装

```bash
npm install @quanxiaoxiao/html-helper
```

## 🚀 快速开始

```javascript
import {
  htmlToJson,
  jsonToHtml,
  setTitle,
  insertLink,
  extractAllResources,
  createHtmlDocument
} from '@quanxiaoxiao/html-helper';

// 创建一个新的 HTML 文档
const doc = createHtmlDocument('My App', {
  lang: 'zh-CN',
  charset: 'utf-8'
});

// 添加样式表
insertLink(doc, '/styles/main.css');

// 转换为 HTML 字符串
const htmlString = jsonToHtml(doc);
console.log(htmlString);
```

## 📚 API 文档

### 核心转换函数

#### `htmlToJson(html: string): Object | null`

将 HTML 字符串解析为 JSON AST。

```javascript
const html = '<html><head><title>Test</title></head><body>Hello</body></html>';
const ast = htmlToJson(html);
console.log(ast);
// {
//   name: 'html',
//   attribs: {},
//   children: [...]
// }
```

#### `jsonToHtml(ast: Object | string): string`

将 JSON AST 转换回 HTML 字符串。

```javascript
const ast = {
  name: 'div',
  attribs: { class: 'container' },
  children: ['Hello World']
};
const html = jsonToHtml(ast);
console.log(html); // '<div class="container">Hello World</div>'
```

### 文档创建

#### `createHtmlDocument(title?: string, options?: Object): Object`

创建标准的 HTML 文档结构。

**参数：**
- `title` (string, 可选): 页面标题，默认为空字符串
- `options` (Object, 可选): 配置选项
  - `lang` (string): HTML 语言属性，默认 'en'
  - `charset` (string): 字符编码，默认 'utf-8'
  - `viewport` (string): 视口配置，默认 'width=device-width, initial-scale=1.0'

```javascript
const doc = createHtmlDocument('我的网站', {
  lang: 'zh-CN',
  charset: 'utf-8',
  viewport: 'width=device-width, initial-scale=1.0'
});
```

### DOM 查询和遍历

#### `hasNode(node: Object | Array, predicate: Function): boolean`

检查是否存在满足条件的节点。

```javascript
const hasTitle = hasNode(ast, (node) => node.name === 'title');
const hasClass = hasNode(ast, (node) => node.attribs?.class === 'header');
```

#### `traverse(node: Object | Array, callback: Function): void`

深度优先遍历所有节点。

```javascript
const nodeNames = [];
traverse(ast, (node) => {
  if (node.name) {
    nodeNames.push(node.name);
  }
});
```

### 内容操作

#### `setTitle(root: Object, content: string): void`

设置或更新页面标题。

```javascript
setTitle(ast, '新的页面标题');
```

#### `setCharset(root: Object, charset?: string): void`

设置字符编码 meta 标签。

**参数：**
- `root` (Object): HTML 文档的根节点
- `charset` (string, 可选): 字符编码，默认 'utf-8'

```javascript
setCharset(ast); // 使用默认的 utf-8
setCharset(ast, 'gb2312'); // 使用自定义编码
```

#### `setViewport(root: Object, content?: string): void`

设置视口 meta 标签。

```javascript
setViewport(ast); // 使用默认配置
setViewport(ast, 'width=device-width, initial-scale=2.0'); // 自定义配置
```

### 资源管理

#### `insertLink(root: Object, href: string, rel?: string, additionalAttribs?: Object): void`

在 head 中插入 link 标签。

**参数：**
- `root` (Object): HTML 文档根节点
- `href` (string): 链接地址
- `rel` (string, 可选): 关系类型，默认 'stylesheet'
- `additionalAttribs` (Object, 可选): 额外的属性

```javascript
// 添加样式表
insertLink(ast, '/css/main.css');

// 添加图标
insertLink(ast, '/favicon.ico', 'icon', { type: 'image/x-icon' });

// 添加预加载资源
insertLink(ast, '/fonts/main.woff2', 'preload', { 
  as: 'font', 
  type: 'font/woff2',
  crossorigin: 'anonymous'
});
```

#### `insertInlineScript(root: Object, scriptText: string): void`

在 head 中插入内联脚本。

```javascript
insertInlineScript(ast, 'console.log("Hello from inline script!");');
```

#### `extractAllResources(root: Object): Array`

提取文档中所有的资源链接。

```javascript
const resources = extractAllResources(ast);
console.log(resources);
// [
//   { name: 'link', attribute: 'href', value: '/styles.css' },
//   { name: 'img', attribute: 'src', value: '/image.jpg' },
//   { name: 'script', attribute: 'src', value: '/app.js' }
// ]
```

### 节点操作

#### `removeNodes(node: Object | Array, predicate: Function): void`

递归删除满足条件的节点。

```javascript
// 删除所有带有特定 class 的元素
removeNodes(ast, (node) => node.attribs?.class === 'remove-me');

// 删除所有空的 div 元素
removeNodes(ast, (node) => 
  node.name === 'div' && 
  (!node.children || node.children.length === 0)
);

// 删除所有注释节点
removeNodes(ast, (node) => node.name === null && node.content?.startsWith('<!--'));
```

## 📖 使用示例

### 基础使用

```javascript
import { 
  createHtmlDocument, 
  insertLink, 
  insertInlineScript,
  setTitle,
  jsonToHtml 
} from '@quanxiaoxiao/html-helper';

// 创建新文档
const doc = createHtmlDocument('我的应用');

// 添加样式和脚本
insertLink(doc, '/css/bootstrap.min.css');
insertLink(doc, '/css/main.css');
insertInlineScript(doc, `
  window.addEventListener('load', function() {
    console.log('页面加载完成');
  });
`);

// 转换为 HTML
const html = jsonToHtml(doc);
console.log(html);
```

### 解析现有 HTML 并修改

```javascript
import { htmlToJson, setTitle, removeNodes, jsonToHtml } from '@quanxiaoxiao/html-helper';

const existingHtml = `
<!DOCTYPE html>
<html>
  <head>
    <title>旧标题</title>
    <link rel="stylesheet" href="/old-styles.css">
  </head>
  <body>
    <div class="deprecated">旧内容</div>
    <div class="content">保留的内容</div>
  </body>
</html>
`;

// 解析 HTML
const ast = htmlToJson(existingHtml);

// 更新标题
setTitle(ast, '新标题');

// 删除已弃用的元素
removeNodes(ast, (node) => node.attribs?.class === 'deprecated');

// 生成新的 HTML
const newHtml = jsonToHtml(ast);
```

### 批量处理资源

```javascript
import { htmlToJson, extractAllResources, insertLink } from '@quanxiaoxiao/html-helper';

const html = await fetch('/template.html').then(r => r.text());
const ast = htmlToJson(html);

// 提取所有资源
const resources = extractAllResources(ast);
console.log('找到的资源:', resources);

// 添加 CDN 前缀
const cdnPrefix = 'https://cdn.example.com';
resources.forEach(resource => {
  if (resource.value.startsWith('/')) {
    // 更新资源路径（需要额外的更新逻辑）
    console.log(`需要更新: ${resource.value} -> ${cdnPrefix}${resource.value}`);
  }
});
```

### 创建邮件模板

```javascript
import { createHtmlDocument, insertInlineStyle, jsonToHtml } from '@quanxiaoxiao/html-helper';

function createEmailTemplate(title, content) {
  const doc = createHtmlDocument(title);
  
  // 邮件专用的内联样式
  insertInlineStyle(doc, `
    body { font-family: Arial, sans-serif; margin: 0; padding: 20px; }
    .header { background: #f8f9fa; padding: 20px; text-align: center; }
    .content { padding: 20px; line-height: 1.6; }
    .footer { background: #e9ecef; padding: 10px; text-align: center; font-size: 12px; }
  `);
  
  // 添加邮件内容到 body
  const bodyNode = doc.children.find(child => child.name === 'body');
  bodyNode.children = [
    {
      name: 'div',
      attribs: { class: 'header' },
      children: [title]
    },
    {
      name: 'div',
      attribs: { class: 'content' },
      children: [content]
    },
    {
      name: 'div',
      attribs: { class: 'footer' },
      children: ['此邮件由系统自动发送，请勿回复。']
    }
  ];
  
  return jsonToHtml(doc);
}

const emailHtml = createEmailTemplate(
  '欢迎注册',
  '感谢您注册我们的服务！请点击下方链接激活您的账户。'
);
```

## 🧪 测试

本库包含完整的单元测试，使用 Node.js 原生测试模块。

```bash
# 运行所有测试
node --test html-parser.test.js

# 运行特定测试
node --test html-parser.test.js --test-name-pattern="htmlToJson"

# 显示详细输出
node --test html-parser.test.js --test-reporter=spec
```

## 📊 性能考虑

- **内存效率**：使用流式解析，避免加载整个文档到内存
- **遍历优化**：深度优先遍历，最小化递归调用栈
- **缓存友好**：重用对象引用，减少垃圾回收压力
- **惰性计算**：仅在需要时执行复杂操作

## 🔧 浏览器兼容性

本库主要设计用于 Node.js 环境，如需在浏览器中使用，需要：

1. 使用打包工具（如 Webpack、Rollup）
2. 提供 `htmlparser2` 的浏览器版本
3. 考虑使用 Web Workers 处理大型文档

## ⚠️ 注意事项

1. **安全性**：解析不可信的 HTML 内容时要小心，建议先进行消毒处理
2. **内存使用**：处理大型文档时注意内存使用情况
3. **性能**：对于频繁的小规模操作，考虑批量处理以提高性能
4. **编码**：确保输入的 HTML 使用正确的字符编码

## 🤝 贡献指南

欢迎提交 Issue 和 Pull Request！

1. Fork 本仓库
2. 创建特性分支：`git checkout -b feature/new-feature`
3. 提交更改：`git commit -am 'Add new feature'`
4. 推送分支：`git push origin feature/new-feature`
5. 创建 Pull Request

## 📄 许可证

MIT License - 详见 [LICENSE](LICENSE) 文件

## 🔗 相关链接

- [htmlparser2](https://github.com/fb55/htmlparser2) - 底层 HTML 解析器
- [Node.js Test Runner](https://nodejs.org/api/test.html) - 测试框架文档

## 📈 更新日志

### v1.0.0
- ✨ 初始版本发布
- 🔄 支持 HTML ↔ JSON 双向转换
- 🛠️ 提供完整的 DOM 操作 API
- 🧪 100% 测试覆盖率
- 📚 完整的文档和示例
