import { createVNode } from "../vnode";

export function renderSlots (slots, name ) {
    const slot = slots[name]
    //  vnode
    if(slot) {
        return createVNode('div', {}, slot)
    }
}