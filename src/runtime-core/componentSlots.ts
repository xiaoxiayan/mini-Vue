import { ShapeFlags } from "../shared/shapeFlags"

export function initSlots (instance, children) {
    // 判断是不是 slot 类型才进行初始化
    const { vnode } = instance
    if(vnode.shapeFlag && ShapeFlags.SLOT_CHILDREN) {
        normalizeObjectSlots(instance.slots, children)
    }
}
function normalizeObjectSlots(slots: any, children: any) {
    for (const key in children) {
        const value = children[key]
        // slot
        slots[key] = (props) => normalizeSlotValue(value(props))
    }
}

function normalizeSlotValue(value) {
    return Array.isArray(value) ? value : [value]
}