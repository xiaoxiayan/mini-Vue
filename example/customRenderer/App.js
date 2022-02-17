import { h } from "../../lib/ggBond-mini-vue.esm.js"

export const App = {
  setup() {
    const x = 100
    const y = 100
    return {
      x,
      y
    }
  },
  render() {
    return h('rect', {x: this.x, y: this.y})
  }

}