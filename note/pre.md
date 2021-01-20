# 写在前面

**Vue3**发布已有 9 个月，相比**Vue2**确实做了太多优化，于是想着重新再仔细全面地研究一下**Vue2**源码，然后对比**Vue3**做个整理，方便以后复习查阅。<br>
so，今天就从 Vue2 开始吧

# 总结

1. 在读源码时发现一个`initProxy`方法，里面使用了**es6**的`proxy`，也就是现在**Vue3**着重优化数据响应式的方案，但该方法只在**生产环境**下使用了一次，莫非当时就有了**proxy**代替**Object.defineProperty**的想法啦？