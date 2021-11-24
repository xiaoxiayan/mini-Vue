import { createComponentInstance, setupComponent } from "./component"

export function render(vnode, container) {
  // 调用 patch， 方便后续的递归
  patch(vnode, container)
}

function patch(vnode: any, container: any) {
  // 处理组件
  // 判断类型 类型主要分为两种，一种是 component 类型
  // render { component } vue文件都是组件类型
  processComponent(vnode, container)
  //  另一种是 element 类型。 render { div } 直接调用render去渲染dom
  // TODO processElement
}

function processComponent(vnode: any, container: any) {
  mountComponent(vnode, container)
}

function mountComponent(vnode: any, container: any) {

   const instance = createComponentInstance(vnode)
   setupComponent(instance)
   setupRenderEffect(instance, container)
}

function setupRenderEffect(instance: any, container) {
  const subTree = instance.render()

  // vnode -> patch
  // vnode -> element -> mountElement
  patch(subTree, container)
}

