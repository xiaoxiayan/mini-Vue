import { isObject } from "../shared/index"
import { createComponentInstance, setupComponent } from "./component"

export function render(vnode, container) {
  // 调用 patch， 方便后续的递归
  patch(vnode, container)
}

function patch(vnode: any, container: any) {
  // 处理组件
  // 判断类型 类型主要分为两种，一种是 component 类型
  // render { component } vue文件都是组件类型
  if(typeof vnode.type === 'string') {
  //  另一种是 element 类型。 render { div } 直接调用render去渲染dom
  // TODO processElement
    processElement(vnode, container)
  } else if (isObject(vnode.type)) {
    processComponent(vnode, container)
  }

}
function processElement(vnode, container) {
  // 分为初始化和 更新
  mountElement(vnode, container)
}
function processComponent(vnode: any, container: any) {
  mountComponent(vnode, container)
}

function mountElement(vnode: any, container: any) {
  const el = document.createElement(vnode.type)
  const { children } = vnode
  // string array
  if(typeof children === 'string') {
    el.textContent = children
  } else if (Array.isArray(children)) {
    mountChildren(vnode, el)
  }
 const { props } = vnode
 for (const key in props) {
    const val = props[key]
    // TODO 如果 class是个数组
    if(Array.isArray(val)) {
      let className = ''
      val.map(name => {
        className += name +' '
      })
      el.setAttribute(key, className)
    }else{
      el.setAttribute(key, val)
    }
 }
 container.append(el)
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



function mountChildren(vnode: any, container: any) {
  vnode.children.forEach((v) => {
    patch(v, container)
  })
}

