import { h, renderSlots } from "../../lib/ggBond-mini-vue.esm.js"

export const Foo = {
    setup() {
        return {}
    },
    render() {
        const foo = h('p', {}, 'foo')
        console.log(this.$slots)
        // children -> vnode
        // 
        // renderSlots
        // 具名插槽
        // 1. 获取到要渲染的元素，
        // 2. 获取到渲染的位置
        // 作用域 插槽
        return  h('div', {}, [ renderSlots(this.$slots,'header'), foo ,renderSlots(this.$slots,'footer')])
    }

}