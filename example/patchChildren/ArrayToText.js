import { ref, h } from '../../lib/ggBond-mini-vue.esm.js'

const nextChildren = "newChildren"
const prevChildren = [h("div", {}, "A"), h("div", {}, "B")]

export default {
  name: 'ArrayToText',
  setup() {
    const isChange = ref(false)
    window.isChange = isChange

    return {
      isChange
    }
  },
  render() {
    const self = this

    return self.isChange === true
    ? h('div', {}, nextChildren)
    : h('div', {}, prevChildren)

  }
}