import { createVNode } from "./vnode"

export function createAppAPI(render) {
  return function createApp (rootComponent) {
    return {
      mount(rootContainer) {
        // vue3 把所有东西转换成 vnode
        // component -> vnode
        // 所有操作 基于 vnode 处理
        const vnode = createVNode(rootComponent)
        // 后续处理 虚拟节点
        render(vnode, rootContainer)
      }
    }
  }
}



