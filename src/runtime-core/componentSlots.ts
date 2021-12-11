export function initSlots (instance, children) {
    normalizeObjectSlots(instance, children.slots)
}
function normalizeObjectSlots(slots: any, children: any) {
    for (const key in slots) {
        const value = slots[key]
        // slot
        slots[key] = normalizeSlotValue(value)
    }
}

function normalizeSlotValue(value) {
    return Array.isArray(value) ? value : [value]
}