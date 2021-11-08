import { isReactive, reactive } from '../reactive'
describe('reactive', () => {
  it('happ path', () => {
    const original = { foo: 1} // 原对象
    const observed = reactive(original) // 响应式对象
    expect(observed).not.toBe(original)
    expect(observed.foo).toBe(1)
    expect(isReactive(observed)).toBe(true)
    expect(isReactive(original)).toBe(false)
  })
})