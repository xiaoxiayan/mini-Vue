import { render } from "./renderer"
import { createVNode } from "./vnode"

export function createApp () {
  return {
    mount(rootContainer) {
      // vue3 把所有东西转换成 vnode
      // component -> vnode
      // 所有操作 基于 vnode 处理
      const vnode = createVNode(rootContainer)
      // 后续处理 虚拟节点
      render(vnode, rootContainer)
    }
  }
}

