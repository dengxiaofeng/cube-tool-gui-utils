const defineProperty = function(obj, key, value) {
  if(key in obj) {
    Object.defineProperty(obj, key, {
      value: value,
      enumerable: true,
      configurable: true
    })
  } else {
    obj[key] = value
  }
  return obj;
}

export {
  defineProperty
}
