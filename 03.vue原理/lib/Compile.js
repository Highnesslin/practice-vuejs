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

  /**
1.v-modal指令: v-modal指令是 :value和@input事件的组合使用，所以处理v-modal时直接给dom添加value，然后绑定input事件即可
2.绑定事件: 根据正则表达式判断如果是v-on或@开头的 attributes，则判定为事件，函数分为两种，methods上的和字符串的函数表达式，分别用method.bind和new Function来处理
 */

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

  // + 判断是不是事件
  isEvent(attr) {
    return /v-on:(.*)/.test(attr) || /@(.*)/.test(attr);
  }

  // + 处理事件
  event(node, eventVal) {
    const event = this.$vm.$methods[eventVal];
    // methods身上的事件，或字符串形式的函数表达式
    const fn = event ? event.bind(this.$vm) : new Function(eventVal);

    node.addEventListener(RegExp.$1, fn);
  }

  // + 处理v-modal
  model(node, exp) {
    this.update(node, exp, 'value');

    node.addEventListener('input', e => {
      this.$vm[exp] = e.target.value;
    });
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

  update(node, exp, dir) {
    const fn = this[`${dir}Updater`];

    fn && fn(node, this.$vm[exp]);

    new Watcher(this.$vm, exp, () => {
      fn && fn(node, this.$vm[exp]);
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
