import { effect } from "../reactivity/effect"
import { ShapeFlags } from "../shared/shapeFlags"
import { createComponentInstance, setupComponent } from "./component"
import { createAppAPI } from "./createApp"
import { Fragment, Text } from "./vnode"


export function createRenderer (options) {
 const {
   createElement,
   patchProp: hostPatchProp,
   insert: hostInsert,
   remove: hostRemove,
   setElementText: hostSetElementText

  } = options
 function render(vnode, container) {
  // 初始化
  // 调用 patch， 方便后续的递归
  patch(null, vnode, container, null, null)
}

function patch(n1, n2: any, container: any, parentComponent, anchor) {
  // 处理组件
  // 判断类型 类型主要分为两种，一种是 component 类型
  // render { component } vue文件都是组件类型
  const { type, shapeFlag } = n2
  // Fragment -> 只渲染 chilren
  switch (type) {
    case Fragment:
      processFragment(n1, n2, container, parentComponent, anchor)
      break;
    case Text:
      processText(n1, n2, container)
      break;
    default:
      if(shapeFlag & ShapeFlags.ELEMENT) {
        //  另一种是 element 类型。 render { div } 直接调用render去渲染dom
          processElement(n1, n2, container, parentComponent, anchor)
        } else if (shapeFlag & ShapeFlags.STATEFUL_COMPONENT) {
          processComponent(n1, n2, container, parentComponent, anchor)
        }
      break;
  }


}
function processElement(n1, n2, container, parentComponent, anchor) {
  // 分为初始化和 更新
  if(!n1) {
    mountElement(n2, container, parentComponent, anchor)
  } else {
    patchElement(n1, n2, container, parentComponent, anchor)
  }
}
function processComponent(n1, n2: any, container: any, parentComponent, anchor) {
  mountComponent(n2, container, parentComponent, anchor)
}

function mountElement(vnode: any, container: any, parentComponent, anchor) {
  // canvs
  // new Element()
  // 挂在不同的平台，canvas ,dom
  const el = (vnode.el = createElement(vnode.type))
  const { children, shapeFlag } = vnode
  if(shapeFlag & ShapeFlags.TEXT_CHILDREN){
    el.textContent = children
  } else if (shapeFlag & ShapeFlags.ARRAY_CHILDREN) {
    mountChildren(vnode.children, el, parentComponent, anchor)
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

 hostInsert(el, container, anchor)
}


function mountComponent(initialVnode: any, container: any, parentComponent, anchor) {
  // 创建组件实例 app其实就是最大组件。
   const instance = createComponentInstance(initialVnode, parentComponent)
   setupComponent(instance)
   setupRenderEffect(instance, initialVnode, container, anchor)
}
// 更新 effect
function setupRenderEffect(instance: any, initialVnode, container, anchor) {
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
      patch(null, subTree, container, instance, anchor)
      initialVnode.el = subTree.el
      instance.isMount = true
    } else {
      // 对比两个树
      const { proxy  } = instance
      const prevSubTree = instance.subTree
      const subTree = instance.render.call(proxy)
      instance.subTree = subTree
      patch(prevSubTree, subTree, container, instance, anchor)
      // if(subTree !== prevSubTree)
    }
  })
}

function patchElement (n1, n2, container, parentComponent, anchor) {
  // 处理更新逻辑。props , element
  // console.log('n1-old', n1)
  // console.log('n2-new', n2)
  // 需要把 el 继承，方便下次更新的时候
  const el = (n2.el = n1.el)
  const oldProps = n1.props || {}
  const nextProps = n2.props
  // 更新子集，更新props
  patchChildren(n1, n2, el, parentComponent, anchor)
  patchProps(el, oldProps, nextProps)
}
function patchChildren (n1, n2, container, parentComponent, anchor) {
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
      mountChildren(c2, container, parentComponent, anchor)
      // 2.pathArray
    } else {
      // 旧的是数组
      // 1.先romve ，在 mount . 简单是实现，性能损耗很大
      // unmountChildren(n1.children)
      //  diff算法
      patchKeyChildren(c1, c2, container, parentComponent, anchor)

    }
    // mountChildren(c2, container, n2)
  }

}
function patchKeyChildren (c1, c2, container, parentComponent, anchor) {
    // diff
    // 左侧对比, i++ 循环
    let i = 0
    const l2 = c2.length
    let e1 = c1.length - 1
    let e2 = l2 - 1
    function isSomeVnodeType(n1, n2) {
      return n1.type === n2.type && n1.key === n2.key
    }
    while(i <= e1  && i <= e2) {
      const n1 = c1[i]
      const n2 = c2[i]
      if(isSomeVnodeType(n1, n2)){
        // 如果相同，我们就递归去寻找d对比
        patch(n1, n2, container, parentComponent, anchor)
      } else {
        break
      }
      i++
    }
    // 右侧对比 定位 e1 ,e2
    while(i <= e1 && i <= e2) {
      const n1 = c1[e1]
      const n2 = c2[e2]
      if(isSomeVnodeType(n1, n2)){
        patch(n1, n2, container, parentComponent, anchor)
      }else {
        break
      }
      e1 --
      e2 --
    }
    console.log('i==', i)
    console.log('e1==', e1)
    console.log('e2==', e2)
    // 新的比老得长 ， 添加   在左侧， 在右侧
    if(i > e1) {
      if(i <= e2) {
        // 添加， 标记锚点。因为在右侧的时候，一样会进来。  i=0. e1 = -1 , e2 = 0
        // 如果 i+1 大于 c2 的长度，说明是 在左侧，添加到末尾, 否则添加到元素节点前面
        // 当在 相同节点右侧， 左边的节点多的时候 会出bug ，e1只锁定在了 -1
        //  获取到真正的相同元素 判断又问题
        let nextPos = e2 + 1
        // while( c2[nextPos] && !c2[nextPos].el  && i + 1  < l2) {
        //   nextPos ++
        // }
        const anchor = nextPos  < l2 ? c2[nextPos].el : null
        while( i <= e2) {
          patch(null, c2[i], container, parentComponent, anchor)
          i ++
        }
      }
    } else if (i > e2) {
    // 老得比新的长， 删除   在左侧， 在右侧
      while(i <= e1) {
        hostRemove(c1[i].el)
        i++
      }
    } else {
      // 中间对比。
      // 定义 变量， map, s1 ,s2. (i的位置)
      const keyToNewIndexMap = new Map
      let s1 = i;
      let s2 = i;
      // 建立映射
      const toBePatched =  e2 - s2  + 1
      let patched
      for(let i = s2; i <= e2; i++) {
        const nextChild = c2[i]
        keyToNewIndexMap.set(nextChild.key, i )
      }
      // 循环 s1节点，查找 map是否存在
      let newIndex
      for(let i = s1; i <= e1; i++) {

        const prevChild = c1[i]
        if(patched >= toBePatched) {
            // 优化点，如果已经比对完了。那么旧节点中多出来的，就是多余的，可以直接去删除
            hostRemove(prevChild.el)
            continue
        }
        if(prevChild.key !== null) {
          newIndex = keyToNewIndexMap.get(prevChild.key)
        } else {
          // 普通遍历
          for(let j = s2; j <= e2; j++) {
            if(isSomeVnodeType(prevChild, c2[j])){
              newIndex = j
              break;
            }
          }
        }
        if(newIndex === undefined) {
          // 不存在删除
          hostRemove(prevChild.el)
        }else {
          // 如果存在。递归去比对
          patch(prevChild, c2[newIndex], container, parentComponent,null)
          patched ++
        }

      }
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

function mountChildren(children: any, container: any, parentComponent, anchor) {
  children.forEach((v) => {
    patch( null, v, container, parentComponent, anchor)
  })
}

function processFragment(n1, n2: any, container: any, parentComponent, anchor) {
  // implement
  console.log('processFragment')
  mountChildren(n2.children, container, parentComponent, anchor)
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


function getSequence(arr) {
  const p = arr.slice();
  const result = [0];
  let i, j, u, v, c;
  const len = arr.length;
  for (i = 0; i < len; i++) {
    const arrI = arr[i];
    if (arrI !== 0) {
      j = result[result.length - 1];
      if (arr[j] < arrI) {
        p[i] = j;
        result.push(i);
        continue;
      }
      u = 0;
      v = result.length - 1;
      while (u < v) {
        c = (u + v) >> 1;
        if (arr[result[c]] < arrI) {
          u = c + 1;
        } else {
          v = c;
        }
      }
      if (arrI < arr[result[u]]) {
        if (u > 0) {
          p[i] = result[u - 1];
        }
        result[u] = i;
      }
    }
  }
  u = result.length;
  v = result[u - 1];
  while (u-- > 0) {
    result[u] = v;
    v = p[v];
  }
  return result;
}
