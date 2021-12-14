import { h, createTextVNode } from "../../lib/ggBond-mini-vue.esm.js"
import { Foo } from "./Foo.js"

export const App = {
    name: 'App',
    render() {
        const app = h('div', {}, 'App')
        // 支持 数组 和 单个
        //  object  key  方式 去更方便查找渲染 slot 的位置
        const foo = h(
            Foo,
            {},
            {
                header: ( { age } ) => [h('p', {}, 'header' + age),  createTextVNode('你好好~')],
                footer: ( { age } ) => h('p', {}, 'footer'+ age )
            }
            )

        return h('div', {}, [app, foo])
    },
    setup() {
        return {}
    }


}