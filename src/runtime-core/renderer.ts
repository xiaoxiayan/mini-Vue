import { isObject } from "../shared/index"
import { ShapeFlags } from "../shared/shapeFlags"
import { createComponentInstance, setupComponent } from "./component"
import { Fragment, Text } from "./vnode"

export function render(vnode, container) {
  // 调用 patch， 方便后续的递归
  patch(vnode, container, null)
}

function patch(vnode: any, container: any, parentComponent) {
  // 处理组件
  // 判断类型 类型主要分为两种，一种是 component 类型
  // render { component } vue文件都是组件类型
  const { type, shapeFlag } = vnode
  // Fragment -> 只渲染 chilren
  switch (type) {
    case Fragment:
      processFragment(vnode, container, parentComponent)
      break;
    case Text:
      processText(vnode, container)
      break;
    default:
      if(shapeFlag & ShapeFlags.ELEMENT) {
        //  另一种是 element 类型。 render { div } 直接调用render去渲染dom
        // TODO processElement
          processElement(vnode, container, parentComponent)
        } else if (shapeFlag & ShapeFlags.STATEFUL_COMPONENT) {
          processComponent(vnode, container, parentComponent)
        }
      break;
  }


}
function processElement(vnode, container, parentComponent) {
  // 分为初始化和 更新
  mountElement(vnode, container, parentComponent)
}
function processComponent(vnode: any, container: any, parentComponent) {
  mountComponent(vnode, container, parentComponent)
}

function mountElement(vnode: any, container: any, parentComponent) {
  const el = (vnode.el =  document.createElement(vnode.type))
  const { children, shapeFlag } = vnode
  if(shapeFlag & ShapeFlags.TEXT_CHILDREN){
    el.textContent = children
  } else if (shapeFlag & ShapeFlags.ARRAY_CHILDREN) {
    mountChildren(vnode, el, parentComponent)
  }

 const { props } = vnode
 for (const key in props) {
    let val = props[key]
    // TODO 如果 class是个数组
    if(Array.isArray(val)) {
      let className = ''
      val.map(name => {
        className += name +' '
      })
      val = className
    }
    // 添加事件，
    // rule: on 开头 ，第三位 为大写
    // 具体的 click ---> 通用 9 -- -------------
    // on + Event
    const isOn = (key: string) => /^on[A-Z]/.test(key)
    if(isOn(key)) {
      // 是事件，添加
      const event = key.slice(2).toLocaleLowerCase()
      el.addEventListener(event, val);
    }else {
      el.setAttribute(key, val)
    }
 }
 container.append(el)
}



function mountComponent(initialVnode: any, container: any, parentComponent) {
   const instance = createComponentInstance(initialVnode, parentComponent)
   setupComponent(instance)
   setupRenderEffect(instance, initialVnode, container)
}

function setupRenderEffect(instance: any, initialVnode, container) {
  const { proxy } = instance
  const subTree = instance.render.call(proxy)
  // vnode -> patch
  // vnode -> element -> mountElement
  // water ~
  patch(subTree, container, instance)
  initialVnode.el = subTree.el
}

function mountChildren(vnode: any, container: any, parentComponent) {
  vnode.children.forEach((v) => {
    patch(v, container, parentComponent)
  })
}

function processFragment(vnode: any, container: any, parentComponent) {
  // implement
  mountChildren(vnode, container, parentComponent)
}

export function processText(vnode: any, container: any) {
  const { children } = vnode
  const textNode = (vnode.el = document.createTextNode(children))
  container.append(textNode)
}

