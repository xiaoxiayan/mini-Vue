import { h, ref } from "../../lib/ggBond-mini-vue.esm.js";

export const App = {
  name: 'App',

  setup() {
    const count = ref(0)
    const onClick = () => {
      count.value++;
    }
    return {
      count,
      onClick,
    }
  },
  render() {
    return h(
      'div',
      {
        id: 'root',
      },
      [
        h('div', {}, 'count:' + this.count), //依赖收集
        h(
          'button',
          {
            onClick: this.onClick
          },
          'click'
        )
      ]
    )
  }
}