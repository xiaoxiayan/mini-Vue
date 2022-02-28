import { effect } from "../reactivity/effect"
import { ShapeFlags } from "../shared/shapeFlags"
import { createComponentInstance, setupComponent } from "./component"
import { createAppAPI } from "./createApp"
import { Fragment, Text } from "./vnode"


export function createRenderer (options) {
 const {
   createElement,
   patchProp: hostPatchProp,
   insert,
   remove: hostRemove,
   setElementText: hostSetElementText

  } = options
 function render(vnode, container) {
  // 调用 patch， 方便后续的递归
  patch(null, vnode, container, null)
}

function patch(n1, n2: any, container: any, parentComponent) {
  // 处理组件
  // 判断类型 类型主要分为两种，一种是 component 类型
  // render { component } vue文件都是组件类型
  const { type, shapeFlag } = n2
  // Fragment -> 只渲染 chilren
  switch (type) {
    case Fragment:
      processFragment(n1, n2, container, parentComponent)
      break;
    case Text:
      processText(n1, n2, container)
      break;
    default:
      if(shapeFlag & ShapeFlags.ELEMENT) {
        //  另一种是 element 类型。 render { div } 直接调用render去渲染dom
          processElement(n1, n2, container, parentComponent)
        } else if (shapeFlag & ShapeFlags.STATEFUL_COMPONENT) {
          console.log('Component-type--->' , type, container, parentComponent)
          processComponent(n1, n2, container, parentComponent)
        }
      break;
  }


}
function processElement(n1, n2, container, parentComponent) {
  // 分为初始化和 更新
  if(!n1) {
    mountElement(n2, container, parentComponent)
  } else {
    patchElement(n1, n2, container, parentComponent)
  }
}
function processComponent(n1, n2: any, container: any, parentComponent) {
  mountComponent(n2, container, parentComponent)
}

function mountElement(vnode: any, container: any, parentComponent) {
  // canvs
  // new Element()
  // 挂在不同的平台，canvas ,dom
  const el = (vnode.el = createElement(vnode.type))
  const { children, shapeFlag } = vnode
  if(shapeFlag & ShapeFlags.TEXT_CHILDREN){
    el.textContent = children
  } else if (shapeFlag & ShapeFlags.ARRAY_CHILDREN) {
    mountChildren(vnode.children, el, parentComponent)
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
    hostPatchProp(el, key, null, val)
 }

 insert(el, container)
}


function mountComponent(initialVnode: any, container: any, parentComponent) {
  // 创建组件实例 app其实就是最大组件。
   const instance = createComponentInstance(initialVnode, parentComponent)
   setupComponent(instance)
   setupRenderEffect(instance, initialVnode, container)
}
// 更新 effect
function setupRenderEffect(instance: any, initialVnode, container) {
  // 使用 effect去包裹，在effect中传入函数
  effect(() => {
    // vnode -> patch
    // vnode -> element -> mountElement
    // 我们在每次更新的时候都回去创建一个新的，所以需要进新对比
    // 可以定义一个 isMount ,判断isMount ,如果是就初始化，赋值， 否则就对比
    if(!instance.isMount) {
      // 初始化
      const { proxy  } = instance
      const subTree = (instance.subTree =  instance.render.call(proxy))
      patch(null, subTree, container, instance)
      initialVnode.el = subTree.el
      instance.isMount = true
    } else {
      // 对比两个树
      const { proxy  } = instance
      const prevSubTree = instance.subTree
      const subTree = instance.render.call(proxy)
      instance.subTree = subTree
      patch(prevSubTree, subTree, container, instance)
      // if(subTree !== prevSubTree)
    }
  })
}

function patchElement (n1, n2, container, parentComponent) {
  // 处理更新逻辑。props , element
  console.log('n1-old', n1)
  console.log('n2-new', n2)
  // 需要把 el 继承，方便下次更新的时候
  const el = (n2.el = n1.el)
  const oldProps = n1.props || {}
  const nextProps = n2.props
  // 更新子集，更新props
  patchChildren(n1, n2, el, parentComponent)
  patchProps(el, oldProps, nextProps)
}
function patchChildren (n1, n2, container, parentComponent) {
  // 判断子集的内容，
  const { shapeFlag } = n2
  const prevShapeFlag = n1.shapeFlag
  const c1 = n1.children
  const c2 = n2.children
  // 如果新的 shapeFlag 是 text
  if(shapeFlag & ShapeFlags.TEXT_CHILDREN) {
    // 如果旧的是 array
     if(prevShapeFlag & ShapeFlags.ARRAY_CHILDREN) {
        // 1.把老的数组清空
        unmountChildren(n1.children)
        // 2.set -> text 加载
     }
     // 两个节点都是 text
     // 1.把原来的 text 置空，然后替换成新的text
     //  重构， 对于数组转 TEXT ，C1 和 C2 本来就不一样， 文本也可以直接对比
    if(c1 !== c2) {
      hostSetElementText(container, c2)
    }
  } else {
    // 如果新的是数组
    //  text -> Array || Array -> Array
    if(prevShapeFlag & ShapeFlags.TEXT_CHILDREN) {
      // 旧的是text
      // 1.先把text = ''
      hostSetElementText(container, '')
      // 2.pathArray
    } else {
      // 旧的是数组
      // 1.先romve ，在 mount
      unmountChildren(n1.children)
    }
    // mountChildren(c2, container, n2)
    mountChildren(c2, container, parentComponent)
  }

}
function unmountChildren(children) {
  // 循环调用runtime-dom 中的 remove
  for (let index = 0; index < children.length; index++) {
    const element = children[index].el;
    hostRemove(element)
  }
}
function patchProps(el, oldProps, newProps) {
  if(oldProps !== newProps) {
  // 遍历属性，新的属性遍历，对比老的, 调用传值修改。
    for (const key in newProps) {
      const prevProps = oldProps[key]
      const nextProps = newProps[key]
      if(prevProps !== nextProps) {
        hostPatchProp(el, key, prevProps, nextProps)
      }
    }
    // 如果 oldProps 是一个空对象，不要去检测
    // 如果 props 改了。需要遍历old 的props ,如果新的没有，需要删除
    if(oldProps !== {}) {
      for (const key in oldProps) {
        if(!(key in newProps)) {
          hostPatchProp(el, key, oldProps[key], null)
        }
      }
    }
  }
}

function mountChildren(children: any, container: any, parentComponent) {
  children.forEach((v) => {
    patch( null, v, container, parentComponent)
  })
}

function processFragment(n1, n2: any, container: any, parentComponent) {
  // implement
  mountChildren(n2.children, container, parentComponent)
}

 function processText(n1, n2: any, container: any) {
  const { children } = n2
  const textNode = (n2.el = document.createTextNode(children))
  container.append(textNode)
}
// 返回一个对象，把 render funciton 传过去
//
return {
    createApp: createAppAPI(render)
  }

}
