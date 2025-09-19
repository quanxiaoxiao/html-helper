import assert from 'node:assert';
import { before,describe, test } from 'node:test';

import {
  createHtmlDocument,
  extractAllResources,
  hasNode,
  htmlToJson,
  insertInlineScript,
  insertLink,
  jsonToHtml,
  removeNodes,
  setCharset,
  setTitle,
  setViewport,
  traverse,
} from './index.mjs';

function countMetaTags(ast) {
  let count = 0;
  traverse(ast, (node) => {
    if (node.name === 'meta') {
      count++;
    }
  });
  return count;
}

describe('HTML Parser Utils', () => {
  let sampleHtml;
  let sampleJsonAst;

  before(() => {
    sampleHtml = `
      <!DOCTYPE html>
      <html lang="en">
        <head>
          <meta charset="utf-8">
          <title>Test Page</title>
          <link rel="stylesheet" href="/styles.css">
        </head>
        <body>
          <div class="container">
            <h1>Hello World</h1>
            <img src="/image.jpg" alt="Test Image">
            <a href="/page.html">Link</a>
          </div>
          <script src="/app.js"></script>
        </body>
      </html>
    `;

    sampleJsonAst = {
      name: 'html',
      attribs: { lang: 'en' },
      children: [
        {
          name: 'head',
          attribs: {},
          children: [
            {
              name: 'meta',
              attribs: { charset: 'utf-8' },
              children: [],
            },
            {
              name: 'title',
              attribs: {},
              children: ['Test Page'],
            },
            {
              name: 'link',
              attribs: { rel: 'stylesheet', href: '/styles.css' },
              children: [],
            },
          ],
        },
        {
          name: 'body',
          attribs: {},
          children: [
            {
              name: 'div',
              attribs: { class: 'container' },
              children: [
                {
                  name: 'h1',
                  attribs: {},
                  children: ['Hello World'],
                },
                {
                  name: 'img',
                  attribs: { src: '/image.jpg', alt: 'Test Image' },
                  children: [],
                },
                {
                  name: 'a',
                  attribs: { href: '/page.html' },
                  children: ['Link'],
                },
              ],
            },
            {
              name: 'script',
              attribs: { src: '/app.js' },
              children: [],
            },
          ],
        },
      ],
    };
  });

  describe('htmlToJson', () => {
    test('should parse HTML string to JSON AST', () => {
      const result = htmlToJson(sampleHtml);
      assert.strictEqual(result.name, 'html');
      assert.strictEqual(result.attribs.lang, 'en');
      assert.strictEqual(result.children.length, 2); // head and body
    });

    test('should handle empty HTML', () => {
      const result = htmlToJson('<html></html>');
      assert.strictEqual(result.name, 'html');
      assert.deepStrictEqual(result.attribs, {});
      assert.deepStrictEqual(result.children, []);
    });

    test('should return null for invalid HTML', () => {
      const result = htmlToJson('<div>test</div>'); // no html tag
      assert.strictEqual(result, null);
    });

    test('should filter out empty text nodes', () => {
      const html = '<html><head>   </head><body>content</body></html>';
      const result = htmlToJson(html);
      const headNode = result.children.find(n => n.name === 'head');
      assert.deepStrictEqual(headNode.children, []);
    });
  });

  describe('jsonToHtml', () => {
    test('should convert JSON AST back to HTML', () => {
      const simpleAst = {
        name: 'div',
        attribs: { class: 'test' },
        children: ['Hello World'],
      };
      const result = jsonToHtml(simpleAst);
      assert.strictEqual(result, '<div class="test">Hello World</div>');
    });

    test('should handle self-closing tags', () => {
      const metaAst = {
        name: 'meta',
        attribs: { charset: 'utf-8' },
        children: [],
      };
      const result = jsonToHtml(metaAst);
      assert.strictEqual(result, '<meta charset="utf-8" />');
    });

    test('should handle nested elements', () => {
      const nestedAst = {
        name: 'div',
        attribs: {},
        children: [
          {
            name: 'p',
            attribs: {},
            children: ['Text content'],
          },
        ],
      };
      const result = jsonToHtml(nestedAst);
      assert.strictEqual(result, '<div><p>Text content</p></div>');
    });

    test('should handle text nodes', () => {
      const result = jsonToHtml('Plain text');
      assert.strictEqual(result, 'Plain text');
    });

    test('should handle elements without attributes', () => {
      const ast = {
        name: 'div',
        children: ['content'],
      };
      const result = jsonToHtml(ast);
      assert.strictEqual(result, '<div>content</div>');
    });
  });

  describe('traverse', () => {
    test('should visit all nodes in the tree', () => {
      const visitedNodes = [];
      const ast = {
        name: 'div',
        children: [
          { name: 'p', children: ['text'] },
          { name: 'span', children: [] },
        ],
      };

      traverse(ast, (node) => {
        if (typeof node !== 'string') {
          visitedNodes.push(node.name);
        }
      });

      assert.deepStrictEqual(visitedNodes, ['div', 'p', 'span']);
    });

    test('should handle string nodes', () => {
      let textCount = 0;
      traverse(['text1', 'text2'], (node) => {
        if (typeof node === 'string') {
          textCount++;
        }
      });
      assert.strictEqual(textCount, 2);
    });

    test('should handle null/undefined nodes', () => {
      assert.doesNotThrow(() => {
        traverse(null, () => {});
        traverse(undefined, () => {});
      });
    });
  });

  describe('hasNode', () => {
    test('should find existing nodes by name', () => {
      const result = hasNode(sampleJsonAst, (node) => node.name === 'title');
      assert.strictEqual(result, true);
    });

    test('should return false for non-existing nodes', () => {
      const result = hasNode(sampleJsonAst, (node) => node.name === 'footer');
      assert.strictEqual(result, false);
    });

    test('should find nodes by attribute', () => {
      const result = hasNode(sampleJsonAst, (node) =>
        node.attribs?.class === 'container',
      );
      assert.strictEqual(result, true);
    });

    test('should handle arrays', () => {
      const nodes = [
        { name: 'div', attribs: {}, children: [] },
        { name: 'span', attribs: {}, children: [] },
      ];
      const result = hasNode(nodes, (node) => node.name === 'span');
      assert.strictEqual(result, true);
    });

    test('should handle null/empty input', () => {
      assert.strictEqual(hasNode(null, () => true), false);
      assert.strictEqual(hasNode([], () => true), false);
    });
  });

  describe('extractAllResources', () => {
    test('should extract all resource URLs', () => {
      const resources = extractAllResources(sampleJsonAst);

      const expectedResources = [
        { name: 'link', attribute: 'href', value: '/styles.css' },
        { name: 'img', attribute: 'src', value: '/image.jpg' },
        { name: 'a', attribute: 'href', value: '/page.html' },
        { name: 'script', attribute: 'src', value: '/app.js' },
      ];

      assert.strictEqual(resources.length, expectedResources.length);
      expectedResources.forEach((expected) => {
        assert.ok(
          resources.some(r =>
            r.name === expected.name &&
            r.attribute === expected.attribute &&
            r.value === expected.value,
          ),
          `Expected resource ${JSON.stringify(expected)} not found`,
        );
      });
    });

    test('should return empty array for document without resources', () => {
      const ast = {
        name: 'html',
        attribs: {},
        children: [
          {
            name: 'body',
            attribs: {},
            children: [{ name: 'p', attribs: {}, children: ['text'] }],
          },
        ],
      };
      const resources = extractAllResources(ast);
      assert.deepStrictEqual(resources, []);
    });
  });

  describe('setTitle', () => {
    test('should update existing title', () => {
      const ast = JSON.parse(JSON.stringify(sampleJsonAst));
      setTitle(ast, 'New Title');

      const titleFound = hasNode(ast, (node) =>
        node.name === 'title' && node.content === 'New Title',
      );
      assert.strictEqual(titleFound, true);
    });

    test('should create title if not exists', () => {
      const ast = {
        name: 'html',
        attribs: {},
        children: [
          {
            name: 'head',
            attribs: {},
            children: [],
          },
        ],
      };

      setTitle(ast, 'Created Title');
      const headNode = ast.children[0];
      assert.strictEqual(headNode.children[0].name, 'title');
      assert.strictEqual(headNode.children[0].children[0], 'Created Title');
    });

    test('should create head node if not exists', () => {
      const ast = {
        name: 'html',
        attribs: {},
        children: [
          {
            name: 'body',
            attribs: {},
            children: [],
          },
        ],
      };

      setTitle(ast, 'New Title');
      assert.strictEqual(ast.children.length, 2);
      assert.strictEqual(ast.children[0].name, 'head');
      assert.strictEqual(ast.children[0].children[0].name, 'title');
    });
  });

  describe('setCharset', () => {
    test('should not add charset if already exists', () => {
      const ast = JSON.parse(JSON.stringify(sampleJsonAst));
      const initialMetaCount = countMetaTags(ast);

      setCharset(ast);
      const finalMetaCount = countMetaTags(ast);

      assert.strictEqual(finalMetaCount, initialMetaCount);
    });

    test('should add charset meta if not exists', () => {
      const ast = {
        name: 'html',
        attribs: {},
        children: [
          {
            name: 'head',
            attribs: {},
            children: [],
          },
        ],
      };

      setCharset(ast);
      const headNode = ast.children[0];
      assert.strictEqual(headNode.children[0].name, 'meta');
      assert.strictEqual(headNode.children[0].attribs.charset, 'utf-8');
    });

    test('should support custom charset', () => {
      const ast = createHtmlDocument();
      // Remove existing charset
      const headNode = ast.children[0];
      headNode.children = headNode.children.filter(child => !child.attribs?.charset);

      setCharset(ast, 'iso-8859-1');
      const metaNode = headNode.children.find(child => child.attribs?.charset);
      assert.strictEqual(metaNode.attribs.charset, 'iso-8859-1');
    });
  });

  describe('setViewport', () => {
    test('should add viewport meta tag', () => {
      const ast = createHtmlDocument();
      // Remove existing viewport
      const headNode = ast.children[0];
      headNode.children = headNode.children.filter(child =>
        !(child.attribs?.name === 'viewport'),
      );

      setViewport(ast);
      const viewportFound = hasNode(ast, (node) =>
        node.name === 'meta' && node.attribs?.name === 'viewport',
      );
      assert.strictEqual(viewportFound, true);
    });

    test('should not duplicate viewport tag', () => {
      const ast = createHtmlDocument(); // already has viewport
      const initialMetaCount = countMetaTags(ast);

      setViewport(ast);
      const finalMetaCount = countMetaTags(ast);

      assert.strictEqual(finalMetaCount, initialMetaCount);
    });

    test('should support custom viewport content', () => {
      const ast = createHtmlDocument();
      const headNode = ast.children[0];
      headNode.children = headNode.children.filter(child =>
        !(child.attribs?.name === 'viewport'),
      );

      const customContent = 'width=device-width, initial-scale=2.0';
      setViewport(ast, customContent);

      const viewportNode = headNode.children.find(child =>
        child.attribs?.name === 'viewport',
      );
      assert.strictEqual(viewportNode.attribs.content, customContent);
    });
  });

  describe('insertLink', () => {
    test('should insert link into head', () => {
      const ast = createHtmlDocument();
      insertLink(ast, '/test.css', 'stylesheet', { media: 'screen' });

      const linkFound = hasNode(ast, (node) =>
        node.name === 'link' &&
        node.attribs?.href === '/test.css' &&
        node.attribs?.media === 'screen',
      );
      assert.strictEqual(linkFound, true);
    });

    test('should create head if not exists', () => {
      const ast = {
        name: 'html',
        attribs: {},
        children: [
          {
            name: 'body',
            attribs: {},
            children: [],
          },
        ],
      };

      insertLink(ast, '/style.css');
      assert.strictEqual(ast.children[0].name, 'head');
      assert.strictEqual(ast.children[0].children[0].name, 'link');
    });
  });

  describe('insertInlineScript', () => {
    test('should insert script into head', () => {
      const ast = createHtmlDocument();
      const scriptCode = 'console.log("test");';

      insertInlineScript(ast, scriptCode);

      const scriptFound = hasNode(ast, (node) =>
        node.name === 'script' && node.content === scriptCode,
      );
      assert.strictEqual(scriptFound, true);
    });
  });

  describe('removeNodes', () => {
    test('should remove nodes matching predicate', () => {
      const ast = {
        name: 'div',
        attribs: {},
        children: [
          { name: 'p', attribs: { class: 'remove-me' }, children: ['text1'] },
          { name: 'p', attribs: { class: 'keep-me' }, children: ['text2'] },
          { name: 'span', attribs: { class: 'remove-me' }, children: ['text3'] },
        ],
      };

      removeNodes(ast, (node) => node.attribs?.class === 'remove-me');

      assert.strictEqual(ast.children.length, 1);
      assert.strictEqual(ast.children[0].attribs.class, 'keep-me');
    });

    test('should handle nested removal', () => {
      const ast = {
        name: 'div',
        attribs: {},
        children: [
          {
            name: 'section',
            attribs: {},
            children: [
              { name: 'p', attribs: { class: 'remove' }, children: ['text'] },
              { name: 'p', attribs: { class: 'keep' }, children: ['text'] },
            ],
          },
        ],
      };

      removeNodes(ast, (node) => node.attribs?.class === 'remove');

      const sectionNode = ast.children[0];
      assert.strictEqual(sectionNode.children.length, 1);
      assert.strictEqual(sectionNode.children[0].attribs.class, 'keep');
    });
  });

  describe('createHtmlDocument', () => {
    test('should create basic HTML document structure', () => {
      const doc = createHtmlDocument('Test Title');

      assert.strictEqual(doc.name, 'html');
      assert.strictEqual(doc.children.length, 2); // head and body

      const headNode = doc.children[0];
      assert.strictEqual(headNode.name, 'head');
      assert.ok(headNode.children.some(child =>
        child.name === 'title' && child.children[0] === 'Test Title',
      ));
    });

    test('should support custom options', () => {
      const doc = createHtmlDocument('Custom Title', {
        lang: 'zh',
        charset: 'gb2312',
        viewport: 'width=320',
      });

      assert.strictEqual(doc.attribs.lang, 'zh');

      const headNode = doc.children[0];
      const metaCharset = headNode.children.find(child => child.attribs?.charset);
      const metaViewport = headNode.children.find(child => child.attribs?.name === 'viewport');

      assert.strictEqual(metaCharset.attribs.charset, 'gb2312');
      assert.strictEqual(metaViewport.attribs.content, 'width=320');
    });

    test('should create empty title by default', () => {
      const doc = createHtmlDocument();
      const titleNode = doc.children[0].children.find(child => child.name === 'title');
      assert.strictEqual(titleNode.children[0], '');
    });
  });

  // Round-trip test
  describe('HTML round-trip conversion', () => {
    test('should maintain structure through parse and stringify cycle', () => {
      const originalAst = createHtmlDocument('Round Trip Test');
      const htmlString = jsonToHtml(originalAst);
      const parsedAst = htmlToJson(htmlString);

      assert.strictEqual(parsedAst.name, originalAst.name);
      console.log(parsedAst.attribs, originalAst.attribs);
      assert.deepStrictEqual(parsedAst.attribs, originalAst.attribs);
      assert.strictEqual(parsedAst.children.length, originalAst.children.length);
    });
  });
});
