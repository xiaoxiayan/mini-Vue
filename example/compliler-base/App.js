import { ref } from "../../lib/ggBond-mini-vue.esm.js"

export const App = {
  name: "App",
  template: `<div>h1, {{count}}</div>`,
  setup() {
    const count = (window.count = ref(1))
    return {
      count,
    }
  }
}