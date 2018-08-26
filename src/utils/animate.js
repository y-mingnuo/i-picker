const time = Date.now || function () {
  return +new Date()
}

let running = {}
let counter = 1
let desiredFrames = 60
let millisecondsPerSecond = 1000

if (typeof window !== 'undefined') {
  ;(function () {
    var lastTime = 0
    var vendors = ['ms', 'moz', 'webkit', 'o']
    for (var x = 0; x < vendors.length && !window.requestAnimationFrame; ++x) {
      window.requestAnimationFrame = window[vendors[x] + 'RequestAnimationFrame']
      window.cancelAnimationFrame = window[vendors[x] + 'CancelAnimationFrame'] || window[vendors[x] + 'CancelRequestAnimationFrame']
    }

    if (!window.requestAnimationFrame) {
      window.requestAnimationFrame = function (callback, element) {
        var currTime = new Date().getTime()
        var timeToCall = Math.max(0, 16 - (currTime - lastTime))
        var id = window.setTimeout(
          function () {
            /* eslint-disable */
            callback(currTime + timeToCall)
          },
          timeToCall
        )
        lastTime = currTime + timeToCall
        return id
      }
    }
    if (!window.cancelAnimationFrame) {
      window.cancelAnimationFrame = function (id) {
        clearTimeout(id)
      }
    }
  }())
}

module.exports = {
  requestAnimationFrame: (function () {
    if (typeof window !== 'undefined') {
      var requestFrame = window.requestAnimationFrame
      return function (callback, root) {
        requestFrame(callback, root)
      }
    }
  })(),

  stop: function (id) {
    var cleared = running[id] != null
    if (cleared) {
      running[id] = null
    }
    return cleared
  },

  isRunning: function (id) {
    return running[id] != null
  },

  start: function (stepCallback, verifyCallback, completedCallback, duration, easingMethod, root) {
    var _this = this
    var start = time()
    var lastFrame = start
    var percent = 0
    var dropCounter = 0
    var id = counter++

    if (!root) {
      root = document.body
    }

    if (id % 20 === 0) {
      var newRunning = {}
      for (var usedId in running) {
        newRunning[usedId] = true
      }
      running = newRunning
    }

    var step = function (virtual) {
      var render = virtual !== true
      var now = time()
      if (!running[id] || (verifyCallback && !verifyCallback(id))) {
        running[id] = null
        completedCallback && completedCallback(desiredFrames - (dropCounter / ((now - start) / millisecondsPerSecond)), id, false)
        return
      }

      if (render) {
        var droppedFrames = Math.round((now - lastFrame) / (millisecondsPerSecond / desiredFrames)) - 1
        for (var j = 0; j < Math.min(droppedFrames, 4); j++) {
          step(true)
          dropCounter++
        }
      }

      if (duration) {
        percent = (now - start) / duration
        if (percent > 1) {
          percent = 1
        }
      }

      var value = easingMethod ? easingMethod(percent) : percent
      if ((stepCallback(value, now, render) === false || percent === 1) && render) {
        running[id] = null
        completedCallback && completedCallback(desiredFrames - (dropCounter / ((now - start) / millisecondsPerSecond)), id, percent === 1 || duration == null)
      } else if (render) {
        lastFrame = now
        _this.requestAnimationFrame(step, root)
      }
    }

    running[id] = true
    _this.requestAnimationFrame(step, root)
    return id
  }
}
