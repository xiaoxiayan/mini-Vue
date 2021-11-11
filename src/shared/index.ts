export const extend = Object.assign;

export const isObject = (val) => {
    return val !== null && typeof val === 'object'
}

export const hasChange = (val, newValue) => {
  return !Object.is(val, newValue)
}