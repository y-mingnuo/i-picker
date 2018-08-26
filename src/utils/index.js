import Vue from 'vue'

const isServer = Vue.prototype.$isServer

const { hasOwnProperty } = Object.prototype

let supportsPassive = false

if (!isServer) {
  try {
    const opts = {}
    Object.defineProperty(opts, 'passive', {
      get () {
        supportsPassive = true
      }
    })
    window.addEventListener('test-passive', null, opts)
  } catch (e) {
    console.log(e)
  }
}

function isValid (value) {
  return value !== undefined && value !== null
}

function assignKey (to, from, key) {
  const val = from[key]
  if (!isValid(val) || (hasOwnProperty.call(to, key) && !isValid(to[key]))) {
    return
  }

  if (!hasOwnProperty.call(to, key) || !isObj(val)) {
    to[key] = val
  } else {
    to[key] = assign(Object(to[key]), from[key])
  }
}

function assign (to, from) {
  for (const key in from) {
    if (hasOwnProperty.call(from, key)) {
      assignKey(to, from, key)
    }
  }
  return to
}

function deepClone (obj) {
  if (Array.isArray(obj)) {
    return obj.map(item => deepClone(item))
  } else if (typeof obj === 'object') {
    return assign({}, obj)
  }
  return obj
}

function on (target, event, handler, passive = false) {
  !isServer && target.addEventListener(
    event,
    handler,
    supportsPassive ? {capture: false, passive} : false
  )
}

function off (target, event, handler) {
  !isServer && target.removeEventListener(event, handler)
}

function isExist (value) {
  return value !== undefined && value !== null
}

function isObj (x) {
  const type = typeof x
  return x !== null && (type === 'object' || type === 'function')
}

function computeSize (cell) {
  let size = String(cell)
  if (size && size.indexOf('%') === -1 && size.indexOf('px') === -1) {
    size += 'px'
  }
  return size
}

function getComputedStyle (el, key) {
  var computedStyle = window.getComputedStyle(el)
  return computedStyle[key] || ''
}

function easeOutCubic (pos) {
  return (Math.pow((pos - 1), 3) + 1)
}

function easeInOutCubic (pos) {
  if ((pos /= 0.5) < 1) {
    return 0.5 * Math.pow(pos, 3)
  }
  return 0.5 * (Math.pow((pos - 2), 3) + 2)
}

export {
  isExist,
  isObj,
  getComputedStyle,
  computeSize,
  isServer,
  easeOutCubic,
  easeInOutCubic,
  deepClone,
  on,
  off
}
