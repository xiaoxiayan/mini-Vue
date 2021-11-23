import { createComponentInstance, setupComponent } from "./component"

export function render(vnode, container) {
  // 调用 patch， 方便后续的递归
  patch(vnode, container)
}

function patch(vnode: any, container: any) {
  // 处理组件
  // 判断类型
  processComponent(vnode, container)
}

function processComponent(vnode: any, container: any) {
  mountComponent(vnode, container)
}

function mountComponent(vnode: any, container: any) {
   const instance = createComponentInstance(vnode)
   setupComponent(instance)
   setupRenderEffect(instance)
}

function setupRenderEffect(instance: any, container) {
  const subTree = instance.render()

  // vnode -> patch
  // vnode -> element -> mountElement
  patch(subTree, container)
}

