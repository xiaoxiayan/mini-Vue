import { readonly } from "../reactive"

describe('readonly', () => {
  it('happy path', () => {
    const original = { foo: 1, bar: { bar: 2}}
    const wrapped = readonly(original)
    expect(wrapped).not.toBe(original)
    expect(wrapped.foo).toBe(1)
  })
})