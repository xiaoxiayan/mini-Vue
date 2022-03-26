import { h, ref } from "../../lib/ggBond-mini-vue.esm.js";

export const App = {
  name: 'App',

  setup() {
    const count = ref(0)
    const props = ref({
      foo: 'foo',
      bar: 'bar'
    })
    const onClick = () => {
      count.value++;
    }
    // 场景一， 改变值， 修改
    const onPropsChangeDemo1 = () => {
      props.value.foo = 'new-foo'
    }
    // 场景2， 值变成 undefined ， 删除
    const onPropsChangeDemo2 = () => {
      props.value.foo = undefined
    }
    // 场景3，props 改变，需要把没有的值删除
    const onPropsChangeDemo3 = () => {
      props.value = {
        foo: 'foo'
      }
    }
    // 场景4，props 改成新增内容
    const onPropsChangeDemo4 = () => {
      props.value = {
        foo: 'foo',
        bar: 'bar',
        tree: 'tree'
      }
    }
    return {
      count,
      onClick,
      props,
      onPropsChangeDemo1,
      onPropsChangeDemo2,
      onPropsChangeDemo3,
      onPropsChangeDemo4,
    }
  },
  render() {
    return h(
      'div',
      {
        id: 'root',
        ...this.props
      },
      [
        h('div', {}, 'count:' + this.count), //依赖收集
        h(
          'button',
          {
            onClick: this.onClick
          },
          'click'
        ),
        h(
          'button',
          {
            onClick: this.onPropsChangeDemo1
          },
          '修改值'
        ),
        h(
          'button',
          {
            onClick: this.onPropsChangeDemo2
          },
          '值变成underfined'
        ),        h(
          'button',
          {
            onClick: this.onPropsChangeDemo3
          },
          'props改变，减少'
        ),
        h(
          'button',
          {
            onClick: this.onPropsChangeDemo4
          },
          'props改变，增加'
        ),

      ]
    )
  }
}