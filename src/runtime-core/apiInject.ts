// 输出 provide 和 inject

import { getCurrentInstance } from "./component";

export function provide (key, value) {
  //  需要挂载 到 instance 上， 通过api  getcurrentInstance
  const currentInstance: any  = getCurrentInstance()
  console.log('provide===', currentInstance)
  //  把设定的provide 绑定到 实例对象上
  // 因为provide  是在 setup 上 使用的，所以需要判断一下是否存在再去存，
  // 初始化的时候是没有的实例
  if (currentInstance) {
    let { provides } = currentInstance
    // 获取是获取 父级的provides ， 如果没有，就需要继续向上寻找。 原型链原理
    const parentProvides = currentInstance.parent.provides
    // 初始化的时候才需要去 创造远行链，指向父级
    if(provides === parentProvides ) {
      provides = currentInstance.provides = Object.create(parentProvides)
    }
    provides[key] = value
  }

}

export function inject (key, defaultkey) {
  // 取需要取父级的 provides
  // 支持传入默认值
  const currentInstance: any = getCurrentInstance()
  if(currentInstance) {
    const  parentProvides  = currentInstance.parent.provides
    if(key in parentProvides) {
      return parentProvides[key]
    } else if (defaultkey) {
      if(typeof defaultkey === 'function') {
        return  defaultkey()
      }
      return defaultkey
    }
  }
}