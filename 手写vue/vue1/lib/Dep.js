export default class Dep {
  constructor() {
    this.deps = [];
  }
  addDeps(dep) {
    this.deps.push(dep);
  }
  notify() {
    this.deps.forEach(dep => dep.update());
  }
}
Dep.target = null;
