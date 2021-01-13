import { isDef } from './utils.js';

export default function patch(oldVnode, vnode) {
  // 1. 旧节点不存在：新增
  if (!oldVnode) {
    // 新增
    return;
  }
  // 2. 新节点不存在：删除
  if (!vnode) {
    // 删除
    return;
  }
  // 3. 新旧节点存在
  //  3.1. 旧节点是真实dom：init
  if (isDef(oldVnode.nodeType)) {
    // const parentElm = oldVnode;
    // vnode.elm = oldVnode;
    // createElm(vnode, parentElm);
    // +
    const parent = oldVnode.parentElement;
    const refElm = oldVnode.nextSibling;
    // 递归创建dom树
    const el = createElm(vnode);

    parent.insertBefore(el, refElm);
    parent.removeChild(oldVnode);

    // 保存vnode
    this._vnode = vnode;
  } else {
    //  3.2. 都是虚拟dom：diff
    patchVnode(oldVnode, vnode);
  }
}

function createElm(vnode) {
  if (typeof vnode === 'string') {
    return document.createTextNode(vnode);
  }
  const el = document.createElement(vnode.tag);

  // 子节点
  if (Array.isArray(vnode.children)) {
    vnode.children.forEach(v => {
      const child = createElm(v);
      el.appendChild(child);
    });
  } else {
    el.textContent = vnode.children;
  }
  //+
  vnode.el = el;
  return el;
}

// 正在写的这里
function patchVnode(oldVnode, vnode) {
  if (oldVnode === vnode) {
    return;
  }

  const el = (vnode.el = oldVnode.el);

  // 属性

  // 文本
  const oldCh = oldVnode.children;
  const newCh = vnode.children;
  // 新节点是文本
  if (typeof newCh === 'string') {
    // 旧节点也是文本
    if (typeof oldCh === 'string') {
      if (oldCh !== newCh) {
        el.textContent = newCh;
      }
    } else {
      // 旧节点以前可能有children
      el.textContent = newCh;
    }
  } else {
    // 旧节点以前是文本
    if (typeof oldCh === 'string') {
      // 先清空，再追加
      el.innerHTML = '';
      newCh.forEach(v => {
        const child = createElm(v);
        el.appendChild(child);
      });
    } else {
      // 旧节点以前有children
      updateChildren(el, oldCh, newCh);
    }
  }
}

function updateChildren(parentElm, oldCh, newCh) {
  // if (!oldCh || !newCh) return;
  console.log('update', oldCh, newCh);

  // todo 1.1.头头
  // todo 1.2.尾尾
  // todo 1.3.头尾
  // todo 1.4.尾头
  // 2.  乱序情况下的处理
  const len = Math.min(oldCh.length, newCh.length);
  for (let i = 0; i < len; i++) {
    const oldChild = oldCh[i];
    const newChild = newCh[i];
    if (typeof newChild === 'string') {
      if (typeof oldChild === 'string') {
        // 新旧节点都是文本
        if (newChild !== oldChild) {
          parentElm.textContent = newChild;
        }
      } else {
        // 旧节点不是文本
        oldChild.forEach(v => {
          parentElm.removeChild(v.el);
        });
      }
    } else {
      if (typeof oldChild === 'string') {
        // 新节点不是文本，旧节点是文本
        parentElm.innerHTML = '';
        newChild.forEach(v => {
          const child = createElm(v);
          parentElm.appendChild(child);
        });
      } else {
        patch(oldChild, newChild); // 都不是文本
      }
    }
  }
  // 3.扫尾工作，两节点不一样长的情况
  if (newCh.length > len) {
    // 新节点长：新增
    const rest = newCh.slice(len);
    rest.forEach(v => {
      const child = createElm(v);
      parentElm.appendChild(child);
    });
  } else if (oldCh.length > len) {
    // 旧节点长：删除
    const rest = oldCh.slice(len);
    rest.forEach(child => {
      parentElm.removeChild(child.el);
    });
  }
}
