import { h } from "../../lib/ggBond-mini-vue.esm.js"

export const Foo = { 
    setup(props) {
        // props 功能点， 
        // 1、setup 传入，
        // 2、通过this 访问
        // 3、不可修改。
        console.log(props)
        props.count++ 
    },
    render() {
        return h('div', {}, 'foo:' + this.count )
    }

}