import { effect } from "../reactivity/effect"
import { ShapeFlags } from "../shared/shapeFlags"
import { createComponentInstance, setupComponent } from "./component"
import { shouldUpdateComponent } from "./componentUpdateUtils"
import { createAppAPI } from "./createApp"
import { queueJobs } from "./scheduler"
import { Fragment, Text } from "./vnode"


export function createRenderer(options) {
  const {
    createElement,
    patchProp: hostPatchProp,
    insert: hostInsert,
    remove: hostRemove,
    setElementText: hostSetElementText

  } = options
  function render(vnode, container) {
    console.log('render---渲染',)
    // 初始化
    // 调用 patch， 方便后续的递归
    patch(null, vnode, container, null, null)
  }

  function patch(n1, n2: any, container: any, parentComponent, anchor) {
    console.log('patch---')
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
        if (shapeFlag & ShapeFlags.ELEMENT) {
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
    if (!n1) {
      mountElement(n2, container, parentComponent, anchor)
    } else {
      patchElement(n1, n2, container, parentComponent, anchor)
    }
  }
  function processComponent(n1, n2: any, container: any, parentComponent, anchor) {
    if (!n1) {
      // 初始化 component
      mountComponent(n2, container, parentComponent, anchor)
    } else {
      // 更新 componet
      updateComponent(n1, n2)
    }
  }

  function updateComponent(n1, n2) {
    // 更新， 调用 update
    const instance = (n2.component = n1.component)
    if (shouldUpdateComponent(n1, n2)) {
      instance.next = n2
      instance.update()
    } else {
      n2.el = n1.el
      n2.vnode = n2
    }


  }
  function mountElement(vnode: any, container: any, parentComponent, anchor) {
    // canvs
    // new Element()
    // 挂在不同的平台，canvas ,dom
    const el = (vnode.el = createElement(vnode.type))
    const { children, shapeFlag } = vnode
    if (shapeFlag & ShapeFlags.TEXT_CHILDREN) {
      el.textContent = children
    } else if (shapeFlag & ShapeFlags.ARRAY_CHILDREN) {
      mountChildren(vnode.children, el, parentComponent, anchor)
    }
    const { props } = vnode
    for (const key in props) {
      let val = props[key]
      // TODO 如果 class是个数组
      if (Array.isArray(val)) {
        let className = ''
        val.map(name => {
          className += name + ' '
        })
        val = className
      }
      hostPatchProp(el, key, null, val)
    }

    hostInsert(el, container, anchor)
  }


  function mountComponent(initialVnode: any, container: any, parentComponent, anchor) {
    // 创建组件实例 app其实就是最大组件。
    const instance = (initialVnode.component = createComponentInstance(initialVnode, parentComponent))
    setupComponent(instance)
    setupRenderEffect(instance, initialVnode, container, anchor)
  }
  // 更新 effect
  function setupRenderEffect(instance: any, initialVnode, container, anchor) {
    // 使用 effect去包裹，在effect中传入函数
    instance.update = effect(() => {
      // vnode -> patch
      // vnode -> element -> mountElement
      // 我们在每次更新的时候都回去创建一个新的，所以需要进新对比
      // 可以定义一个 isMount ,判断isMount ,如果是就初始化，赋值， 否则就对比
      if (!instance.isMount) {
        // 初始化
        const { proxy } = instance
        const subTree = (instance.subTree = instance.render.call(proxy))
        patch(null, subTree, container, instance, anchor)
        initialVnode.el = subTree.el
        instance.isMount = true
      } else {
        // 对比两个树
        const { next, vnode } = instance
        if (next) {
          // 更新el
          next.el = vnode.el
          updateComponentPreRender(instance, next)
        }
        const { proxy } = instance
        const prevSubTree = instance.subTree
        const subTree = instance.render.call(proxy)
        instance.subTree = subTree
        // 处理组件更新
        // 需要一个更新以后的 vnode
        patch(prevSubTree, subTree, container, instance, anchor)
        // if(subTree !== prevSubTree)
      }
    },
      {
        scheduler() {
          console.log('upadte--scheduler')
          queueJobs(instance.update)
        }
      }
    )
  }

  function updateComponentPreRender(insatnce, nextVnode) {
    // 需要更新实例对象上的 props
    insatnce.vnode = nextVnode
    insatnce.next = null
    insatnce.props = nextVnode.props
  }

  function patchElement(n1, n2, container, parentComponent, anchor) {
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
  function patchChildren(n1, n2, container, parentComponent, anchor) {
    // 判断子集的内容，
    const { shapeFlag } = n2
    const prevShapeFlag = n1.shapeFlag
    const c1 = n1.children
    const c2 = n2.children
    // 如果新的 shapeFlag 是 text
    if (shapeFlag & ShapeFlags.TEXT_CHILDREN) {
      // 如果旧的是 array
      if (prevShapeFlag & ShapeFlags.ARRAY_CHILDREN) {
        // 1.把老的数组清空
        unmountChildren(n1.children)
        // 2.set -> text 加载
      }
      // 两个节点都是 text
      // 1.把原来的 text 置空，然后替换成新的text
      //  重构， 对于数组转 TEXT ，C1 和 C2 本来就不一样， 文本也可以直接对比
      if (c1 !== c2) {
        hostSetElementText(container, c2)
      }
    } else {
      // 如果新的是数组
      //  text -> Array || Array -> Array
      if (prevShapeFlag & ShapeFlags.TEXT_CHILDREN) {
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
        patchKeyChildren_Review(c1, c2, container, parentComponent, anchor)

      }
      // mountChildren(c2, container, n2)
    }

  }
  function patchKeyChildren_Review(c1, c2, container, parentComponent, anchor) {
    function isSomeVnodeType(n1, n2) {
      return n1.type === n2.type && n1.key === n2.key
    }
    // 实现案例1， 新的比旧的多，
    //  (a b) c
    //  (a b) d e
    let i = 0, e1 = c1.length - 1, e2 = c2.length - 1
    // 思路： 先从左边到右边，走i 找出 开头， 然后从右侧走， 找到 右边指针的范围，
    // 循环 只要 i 小与 e1, e2 就一直走，对比出不同的就停下
    while (i <= e1 && i <= e2) {
      // 对比如果重复就 ++ 如果不是就 break
      let oldEl = c1[i]
      let newEl = c2[i]
      if (isSomeVnodeType(oldEl, newEl)) {
        patch(oldEl, newEl, container, parentComponent, anchor)
      } else {
        break
      }
      i++
    }
    // 右侧对比，找出e1, e2 确定一下整体范围
    // 条件还是 i< e1 和 e2 ,如果 i > e2 就是 旧的比新的长了
    while (i <=e1 && i <= e2) {
      let oldEl = c1[e1]
      let newEl = c2[e2]
      if (isSomeVnodeType(oldEl, newEl)) {
        patch(oldEl, newEl, container, parentComponent, anchor)
      } else {
        break
      }
      e1 --
      e2 --
    }
    // 在查找到范围以后。有以下几种情况
    // 新的比老的长，
    // ab
    // abc
    if (i > e1) {
      if (i <= e2) {
        // 新的比老的长， 需要添加， 也就是 调用 patch（null, n2）
        //  insertBefore（insertEl, position）
        //  position 如果是 null , 就是插在最后，如果是有 el，会找到这个el， 插在 el的前面
        // 如果 下一个节点的位置 ，小于 c2的长度，说明不是一个
        // 情况1，如果是在 新的节点在右侧， 那么需要添加到 null, 如果是左侧，需要计算出 第一个存在的元素，
        // 插入到 第一个存在元素的前面
        //  e2 + 1 就是要插入的节点的前面那个节点
        // 如果nextPos 小于整体 c2的长度，说明是 在左侧添加，取节点，如果大于，就说明在右侧，null，在末尾添加
        let nextPos = e2 + 1
        anchor = nextPos < c2.length ?  c2[nextPos].el : null
        // 可能有多个节点需要去创建， 循环
        while (i <= e2) {
          patch(null, c2[i], container, parentComponent, anchor)
          // 需要把 i++ 不然就是死循环了
          i++
        }
      }
    } else if (i > e2) {
      // 旧的比新的长，删除
      // 左侧
      // (a b) c d
      // (a b)
      // i = 2 ; e1 = 3, e2 = 1
      // 右侧
      // d c a b
      // a b
      // i = 0 ; e1 = 1;  e2 = -2
      // 输入对应的 el, 然后通过父级 去对 el进行一个删除\
      // 循环删除
      while (i <= e1) {
        hostRemove(c1[i].el)
        i++
      }
    } else {
      // 最后中间对比
      console.log('需要中间对比，进行替换')

    }

  }



  function patchKeyChildren(c1, c2, container, parentComponent, anchor) {
    // diff
    // 左侧对比, i++ 循环
    let i = 0
    const l2 = c2.length
    let e1 = c1.length - 1
    let e2 = l2 - 1
    function isSomeVnodeType(n1, n2) {
      return n1.type === n2.type && n1.key === n2.key
    }
    // 如果不同点再右侧，
    while (i <= e1 && i <= e2) {
      const n1 = c1[i]
      const n2 = c2[i]
      if (isSomeVnodeType(n1, n2)) {
        // 如果相同，我们就递归去寻找d对比
        patch(n1, n2, container, parentComponent, anchor)
      } else {
        break
      }
      i++
    }
    // 右侧对比 定位 e1 ,e2，
    // 如果不同点再左侧，通过 e1, e2定位 到不同
    while (i <= e1 && i <= e2) {
      const n1 = c1[e1]
      const n2 = c2[e2]
      if (isSomeVnodeType(n1, n2)) {
        patch(n1, n2, container, parentComponent, anchor)
      } else {
        break
      }
      e1--
      e2--
    }
    // 新的比老得长 ， 添加   在左侧， 在右侧
    if (i > e1) {
      if (i <= e2) {
        // 添加， 标记锚点。因为在右侧的时候，一样会进来。  i=0. e1 = -1 , e2 = 0
        // 如果 i+1 大于 c2 的长度，说明是 在左侧，添加到末尾, 否则添加到元素节点前面
        // 当在 相同节点右侧， 左边的节点多的时候 会出bug ，e1只锁定在了 -1
        //  获取到真正的相同元素 判断又问题
        let nextPos = e2 + 1
        // while( c2[nextPos] && !c2[nextPos].el  && i + 1  < l2) {
        //   nextPos ++
        // }
        const anchor = nextPos < l2 ? c2[nextPos].el : null
        while (i <= e2) {
          patch(null, c2[i], container, parentComponent, anchor)
          i++
        }
      }
    } else if (i > e2) {
      // 老得比新的长， 删除   在左侧， 在右侧
      while (i <= e1) {
        hostRemove(c1[i].el)
        i++
      }
    } else {
      // 中间对比。
      // 优化。是否需要 moved
      let moved = false
      let maxNewIndeSoFar = 0
      // 定义 变量， map, s1 ,s2. (i的位置)
      let s1 = i;
      let s2 = i;
      let patched
      const toBePatched = e2 - s2 + 1
      // 建立映射表，存储新的变更区间中的 key 和对应的位置，然后在老的节点循环中，
      // 查找是否存在, 得到对应 newIndex ，
      const keyToNewIndexMap = new Map()
      //  new array  一个数组，来映新的节点 在旧的 节点中对应的 index
      // 建立映射，得到中间 需要改变的 数组的 具体信息， 如
      // ab (c d e ) f g ->  ab (e c d ) f g
      // 得到 e c d  ,[  4 , 2, 3] 的 key -> index
      // 然后根据最长递增子序列，去比较，如果是在 最长递增子序列返回的数组内，就不去操作
      // 否则 就去 insert , add
      const newIndexToOldIndexMap = new Array(toBePatched)
      // 初始化给个 0， 如果 没有赋值，说明 在旧的节点中不存在，需要去新增。
      for (let i = 0; i < toBePatched; i++) {
        newIndexToOldIndexMap[i] = 0
      }
      for (let i = s2; i <= e2; i++) {
        const nextChild = c2[i]
        keyToNewIndexMap.set(nextChild.key, i)
      }
      // 循环 s1节点，查找map是否存在
      let newIndex
      for (let i = s1; i <= e1; i++) {
        const prevChild = c1[i]
        if (patched >= toBePatched) {
          // 优化点，如果已经比对完了。那么旧节点中多出来的，就是多余的，可以直接去删除
          hostRemove(prevChild.el)
          continue
        }
        if (prevChild.key !== null) {
          newIndex = keyToNewIndexMap.get(prevChild.key)
        } else {
          // 普通遍历
          for (let j = s2; j <= e2; j++) {
            if (isSomeVnodeType(prevChild, c2[j])) {
              newIndex = j
              break;
            }
          }
        }
        if (newIndex === undefined) {
          // 不存在删除
          hostRemove(prevChild.el)
        } else {
          // 如果存在。递归去比对
          // 映射表赋值  从 0 开始， 但是中间对比的newIndex 需要减去 s2。 i+1 是为了避免 当前这个处理的节点是第一个
          newIndexToOldIndexMap[newIndex - s2] = i + 1
          if (newIndex >= maxNewIndeSoFar) {
            maxNewIndeSoFar = newIndex
          } else {
            moved = true
          }
          patch(prevChild, c2[newIndex], container, parentComponent, null)
          patched++
        }
      }
      // 前面的步骤已经删除完毕，剩下是新增 和 乱序的内容
      const increasingNewIndexSequence = moved ? getSequence(newIndexToOldIndexMap)  : []// [1, 2]
      // 对比去操作。倒叙对比，因为 inset 需要一个稳定的 元素，所以从最后一个开始
      // 需要2个子针， 一个标记 [e,c,d] 中的位置，一个标记 j 最长子序列的标记
      // a b  [c, d ,e ] f g-> a , b,  [e, d , c] f g
      //  2 3 4
      // [ 1, 2 ]
      let j = increasingNewIndexSequence.length - 1
      for (let i = toBePatched - 1; i >= 0; i--) {
        const nextIndex = i + s2
        const nextChild = c2[nextIndex]
        const anchor = nextIndex + 1 < l2 ? c2[nextIndex + 1].el : null
        if(newIndexToOldIndexMap[i] === 0) {
          // 创建
          patch(null, nextChild, container, parentComponent, anchor)
        }
        if (moved) {
          if (j < 0 || i !== increasingNewIndexSequence[j]) {
            // add or insert
            hostInsert(nextChild.el, container, anchor)
          } else {
            j--
          }
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
    if (oldProps !== newProps) {
      // 遍历属性，新的属性遍历，对比老的, 调用传值修改。
      for (const key in newProps) {
        const prevProps = oldProps[key]
        const nextProps = newProps[key]
        if (prevProps !== nextProps) {
          hostPatchProp(el, key, prevProps, nextProps)
        }
      }
      // 如果 oldProps 是一个空对象，不要去检测
      // 如果 props 改了。需要遍历old 的props ,如果新的没有，需要删除
      if (oldProps !== {}) {
        for (const key in oldProps) {
          if (!(key in newProps)) {
            hostPatchProp(el, key, oldProps[key], null)
          }
        }
      }
    }
  }

  function mountChildren(children: any, container: any, parentComponent, anchor) {
    children.forEach((v) => {
      patch(null, v, container, parentComponent, anchor)
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
