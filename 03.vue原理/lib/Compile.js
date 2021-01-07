import Watcher from './Watcher.js';

export default class Compile {
  constructor(el, vm) {
    this.el = document.querySelector(el);
    this.$vm = vm;

    this.compile(this.el);
  }

  compile(dom) {
    const nodes = dom.childNodes;
    if (!nodes) return;

    nodes.forEach(node => {
      if (this.isElement(node) /*        host节点 */) {
        this.compileElement(node);
      } else if (this.isEnter(node) /*   插值表达式  */) {
        this.compileText(node);
      }
      if (node.childNodes) {
        this.compile(node);
      }
    });
  }

  isElement(node) {
    return node.nodeType === 1;
  }

  isEnter(node) {
    return node.nodeType === 3 && /\{\{(.*)\}\}/.test(node.textContent);
  }

  // // + 判断是不是动态绑定
  // isVBind(attr) {
  //   return /v-bind:(.*)/.test(attr);
  // }

  isDir(attr) {
    return attr.startsWith('v-');
  }

  compileText(node) {
    this.update(node, RegExp.$1, 'text');
  }

  // + 判断是不是事件
  isEvent(attr) {
    return /v-on:(.*)/.test(attr) || /@(.*)/.test(attr);
  }

  compileElement(node) {
    Array.from(node.attributes).forEach(attr => {
      const attrName = attr.name;
      const exp = attr.value;

      // 判断指令
      if (this.isDir(attrName) && !this.isEvent(attrName)) {
        const dir = attrName.substring(2);

        // const fn = this[dir];

        // 其他attributes
        this[dir] && this[dir](node, exp);

        // + 判断事件
      } else if (this.isEvent(attrName)) {
        this.event(node, exp);
      }
    });
  }

  // + 处理事件
  event(node, eventVal) {
    const event = this.$vm[eventVal];
    // methods身上的事件，或字符串形式的函数表达式
    const fn = event || new Function(eventVal);

    node.addEventListener(RegExp.$1, fn);
  }

  // + 处理差值表达式
  handleInter(exp) {
    // 处理嵌套
    let value = this.$vm, // 最终取到的值 this.detail.id的值：6
      target = this.$vm, // 表达式：this.detail
      key = exp; // 要观测的key，也就是最后一个 id

    const temp = exp.split('.');
    if (temp.length > 1) {
      temp.forEach((_key, index) => {
        value = value[_key];
        if (index < temp.length - 1) {
          target = target[_key];
        } else {
          key = _key;
        }
      });
    } else {
      value = value[key];
    }

    return { target, value, key };
  }

  update(node, exp, dir) {
    const fn = this[`${dir}Updater`];

    // 计算差值表达式的值
    const { target, value, key } = this.handleInter(exp);
    fn && fn(node, value);

    new Watcher(target, key, () => {
      const value = target[key];
      fn && fn(node, value);
    });
  }

  // + 处理v-modal
  model(node, exp) {
    this.update(node, exp, 'value');

    node.addEventListener('input', e => {
      this.$vm[exp] = e.target.value;
    });
  }

  // // todo 处理v-bind
  // bind(node, val) {
  //   const exp = RegExp.$1;
  // }

  text(node, exp) {
    this.update(node, exp, 'text');
  }

  html(node, exp) {
    this.update(node, exp, 'html');
  }

  textUpdater(node, val) {
    node.textContent = val;
  }

  htmlUpdater(node, val) {
    node.innerHTML = val;
  }

  valueUpdater(node, val) {
    node.value = val;
  }
}
