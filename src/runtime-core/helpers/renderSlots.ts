import { createVNode, Fragment } from "../vnode";

export function renderSlots (slots, name, props ) {
    const slot = slots[name]
    //  vnode
    if(slot) {
        // 作用域插槽，传入 function ，带参数
        if(typeof slot === 'function') {
            // 虚拟节点的 children 是不可有 array
            return createVNode(Fragment, {}, slot(props))
        }
    }
}