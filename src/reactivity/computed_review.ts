import { ReactiveEffect } from "./effect"

class ComputedRefImpl {
  private _value: any
  private _getter: any
  private _dirty: boolean = true
  private _effect: ReactiveEffect
  // 传入 fn, fn 赋值，然后在get的时候执行
  constructor(getter) {
    this._getter = getter
    this._effect = new ReactiveEffect(getter, () => {
      if (!this._dirty) {
        this._dirty = true
      }
    })
  }
  // 缓存，需要一个开关去控制。
  // 在下一次执行 get的时候，直接返回 _value就好了
  get value() {
  // 当 computed 依赖的响应式对象，发生 set的时候，需要去收集依赖。触发更新
  // get value -> dirty  true
    if (this._dirty) {
      this._dirty = false
      this._value = this._effect.run()
    }
    return this._value
  }

}


export function computed(getter) {
  // water--water!
  return new ComputedRefImpl(getter)
}