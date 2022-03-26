import { isProxy, isReactive, reactive } from '../reactive'
describe('reactive', () => {
  it.only('happ path', () => {
    const original = { foo: 1} // 原对象
    const observed = reactive(original) // 响应式对象
    // expect(observed).not.toBe(original)
    expect(observed.foo).toBe(1)
    // expect(isReactive(observed)).toBe(true)
    // expect(isReactive(original)).toBe(false)
    // expect(isProxy(observed)).toBe(true)

  })
  it("nested Reactive", () => {
     const original = {
       nested: {
         foo: 1
       },
       array: [ { bar: 1} ],
     }
     const observed = reactive(original)
     expect(isReactive(observed.nested)).toBe(true)
     expect(isReactive(observed.array)).toBe(true)
     expect(isReactive(observed.array[0])).toBe(true)

  })
})