import { createRenderer } from '../../lib/ggBond-mini-vue.esm.js'
import { App } from './App.js'

console.log(PIXI)

const game = new PIXI.Application({
  width: 500,
  height: 500

})

document.body.append(game.view)

const renderer = createRenderer ({
  createElement(type){
    if(type === 'rect') {
      // 创建一个矩形
      const rect = new PIXI.Graphics()
      // 设置初始的颜色
      rect.beginFill(0xff0000)
      rect.drawRect(0, 0, 100, 100)
      rect.endFill()
      return rect
    }

  },
  pathProp(el, key, val) {
    el[key] = val
  },
  insert(el, parent) {
    //  append
    parent.addChild(el)

  }
})

renderer.createApp(App).mount(game.stage)
// const rootContainer = document.querySelector('#app')
// createRenderer(App).mount(rootContainer)