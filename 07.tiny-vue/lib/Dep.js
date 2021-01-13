export default class Dep {
  constructor() {
    this.subs = new Set();
  }
  depend() {
    this.subs.add(Dep.target);
  }
  notify() {
    this.subs.forEach(item => item.update());
  }
}
Dep.target = null;
