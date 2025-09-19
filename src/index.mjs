import { parseDocument } from 'htmlparser2';

const RESOURCE_ATTRS = ['src', 'href', 'data', 'action'];
const SELF_CLOSING_TAGS = ['meta', 'base', 'link', 'img', 'br', 'hr', 'input', 'area', 'source'];

const getNodeProps = (node) => {
  if (typeof node === 'string') {
    return {
      name: null,
      attribs: null,
      content: node,
    };
  }
  const hasOnlyTextChild = node.children?.length === 1 && typeof node.children[0] === 'string';

  return {
    name: node.name,
    attribs: node.attribs,
    content: hasOnlyTextChild ? node.children[0] : null,
  };
};

const nodeToJson = (node) => {
  if (node.type === 'text') {
    return node.data.trim() ? node.data : null;
  }

  if (!['tag', 'script', 'style'].includes(node.type)) {
    return null;
  }

  return {
    name: node.name,
    attribs: node.attribs || {},
    children: (node.children || [])
      .map(nodeToJson)
      .filter(Boolean),
  };
};

const jsonToHtml = (node) => {
  if (typeof node === 'string') {
    return node;
  }

  const { name, attribs = {}, children = [] } = node;

  const attrStr = Object.entries(attribs)
    .map(([key, value]) => `${key}="${value}"`)
    .join(' ');

  const openTag = attrStr ? `<${name} ${attrStr}>` : `<${name}>`;

  if (SELF_CLOSING_TAGS.includes(name) && !children.length) {
    return attrStr ? `<${name} ${attrStr} />` : `<${name} />`;
  }

  const childrenHtml = children.map(jsonToHtml).join('');

  return `${openTag}${childrenHtml}</${name}>`;
};

const ensureHeadNode = (root) => {
  let headNode = root.children?.find((n) => n.name === 'head');

  if (!headNode) {
    headNode = {
      name: 'head',
      attribs: {},
      children: [],
    };
    const bodyIndex = root.children?.findIndex(n => n.name === 'body') ?? -1;
    const insertIndex = bodyIndex > -1 ? bodyIndex : 0;
    root.children?.splice(insertIndex, 0, headNode);
  }

  return headNode;
};

const htmlToJson = (html) => {
  const dom = parseDocument(html);
  const htmlNode = dom.children.find((n) => n.name === 'html');
  if (!htmlNode) {
    return null;
  }
  const jsonAst = nodeToJson(htmlNode);
  return jsonAst;
};

const insertInlineScript = (root, scriptText) => {
  const headNode = ensureHeadNode(root);

  const scriptNode = {
    name: 'script',
    attribs: {},
    children: [scriptText],
  };

  headNode.children.push(scriptNode);
};

const traverse = (node, callback) => {
  if (!node) {
    return;
  }

  if (Array.isArray(node)) {
    node.forEach(n => traverse(n, callback));
    return;
  }

  callback(node);

  node.children?.forEach(child => traverse(child, callback));
};

const extractAllResources = (root) => {
  const resources = [];

  traverse(root, (node) => {
    if (!node.attribs) {
      return;
    }
    RESOURCE_ATTRS.forEach((attr) => {
      const value = node.attribs[attr];
      if (value) {
        resources.push({
          name: node.name,
          attribute: attr,
          value: node.attribs[attr],
        });
      }
    });
  });

  return resources;
};

const insertLink = (root, href, rel = 'stylesheet', additionalAttribs = {}) => {
  const headNode = ensureHeadNode(root);

  const linkNode = {
    name: 'link',
    attribs: {
      rel,
      href,
      ...additionalAttribs,
    },
    children: [],
  };

  headNode.children.push(linkNode);
};

const removeNodes = (node, predicate) => {
  if (!node) {
    return;
  }

  if (Array.isArray(node)) {
    node.forEach((n) => removeNodes(n, predicate));
    return;
  }

  if (node.children) {
    node.children = node.children.filter(
      (child) => {
        const shouldRemove = predicate(getNodeProps(child));
        return !shouldRemove;
      },
    );

    node.children.forEach((child) => removeNodes(child, predicate));
  }
};

const updateTitle = (node, newTitle) => {
  if (!node) {
    return;
  };

  if (Array.isArray(node)) {
    node.forEach(n => updateTitle(n, newTitle));
    return;
  }

  if (node.name === 'title') {
    node.children = [newTitle];
    return;
  }

  node.children?.forEach(child => updateTitle(child, newTitle));
};

const hasNode = (node, predicate) => {
  if (!node) {
    return false;
  }

  if (Array.isArray(node)) {
    return node.some(n => hasNode(n, predicate));
  }

  if (predicate(getNodeProps(node))) {
    return true;
  }
  return node.children?.some(child => hasNode(child, predicate)) ?? false;
};

const setTitle = (root, content) => {
  if (hasNode(root, (d) => d.name === 'title')) {
    updateTitle(root, content);
    return;
  }
  const headNode = ensureHeadNode(root);

  const titleNode = {
    name: 'title',
    attribs: {},
    children: [content],
  };

  headNode.children.unshift(titleNode);
};

const setCharset = (root, charset = 'utf-8') => {
  const hasCharset = hasNode(root, (node) => {
    if (node.name !== 'meta') {
      return false;
    };

    const { attribs } = node;
    return (
      attribs?.charset
      || (attribs?.['http-equiv']?.toLowerCase() === 'content-type'
        && attribs?.content?.toLowerCase().includes('charset'))
      || (attribs?.name?.toLowerCase() === 'charset')
    );
  });

  if (hasCharset) {
    return;
  }

  const headNode = ensureHeadNode(root);

  const charsetNode = {
    name: 'meta',
    attribs: {
      charset,
    },
    children: [],
  };

  headNode.children.unshift(charsetNode);
};

const setViewport = (root, content = 'width=device-width, initial-scale=1.0') => {
  const hasViewport = hasNode(root, (node) =>
    node.name === 'meta' && node.attribs?.name === 'viewport',
  );

  if (hasViewport) {
    return;
  }

  const headNode = ensureHeadNode(root);
  const viewportNode = {
    name: 'meta',
    attribs: {
      name: 'viewport',
      content,
    },
    children: [],
  };

  headNode.children.push(viewportNode);
};

const createHtmlDocument = (title = '', options = {}) => {
  const { lang, charset = 'utf-8', viewport = 'width=device-width, initial-scale=1.0' } = options;

  return {
    name: 'html',
    attribs: {
      ...lang ? { lang } : {},
    },
    children: [
      {
        name: 'head',
        attribs: {},
        children: [
          {
            name: 'meta',
            attribs: { charset },
            children: [],
          },
          {
            name: 'meta',
            attribs: { name: 'viewport', content: viewport },
            children: [],
          },
          {
            name: 'title',
            attribs: {},
            children: [title],
          },
        ],
      },
      {
        name: 'body',
        attribs: {},
        children: [],
      },
    ],
  };
};

export {
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
};
