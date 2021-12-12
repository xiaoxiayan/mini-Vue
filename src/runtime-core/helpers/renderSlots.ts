import { createVNode } from "../vnode";

export function renderSlots (slots, name, props ) {
    const slot = slots[name]
    //  vnode
    if(slot) {
        // 作用域插槽，传入 function ，带参数
        if(typeof slot === 'function') {
            return createVNode('div', {}, slot(props))
        }
    }
}