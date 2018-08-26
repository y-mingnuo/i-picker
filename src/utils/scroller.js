import Animate from './animate'
import { isExist, getComputedStyle, easeOutCubic, easeInOutCubic } from './index'

let passiveSupported = false
try {
  var options = Object.defineProperty({}, 'passive', {
    get: function () {
      passiveSupported = true
    }
  })
  window.addEventListener('test', null, options)
} catch (err) {}

const Scroller = function (container, options) {
  const self = this

  options = options || {}

  self.options = {
    itemClass: 'y-column',
    disableClass: 'y-column-disabled',
    onSelect () {},
    defaultValue: 0,
    data: []
  }

  for (var key in options) {
    if (options[key] !== undefined) {
      self.options[key] = options[key]
    }
  }

  var component = self.__component = container
  var content = self.__content = component.querySelector('[data-role=content]')

  self.__itemHeight = parseFloat(self.options.itemHeight, 10)

  self.__callback = options.callback || function (top) {
    content.style.webkitTransform = 'translate3d(0, ' + -top + 'px, 0)'
    content.style.transform = 'translate3d(0, ' + -top + 'px, 0)'
  }

  var rect = component.getBoundingClientRect()

  self.__clientTop = (rect.top + component.clientTop) || 0

  self.__setDimensions(component.clientHeight, content.offsetHeight)

  if (component.clientHeight === 0) {
    self.__setDimensions(parseFloat(getComputedStyle(component, 'height'), 10), 204)
  }
  self.select(self.options.defaultValue, false)

  const touchStartHandler = function (e) {
    if (e.target.tagName.match(/input|textarea|select/i)) {
      return
    }
    self.__doTouchStart(e, e.timeStamp)
  }

  const touchMoveHandler = function (e) {
    e.preventDefault()
    self.__doTouchMove(e, e.timeStamp)
  }

  const touchEndHandler = function (e) {
    self.__doTouchEnd(e.timeStamp)
  }

  const willPreventDefault = passiveSupported ? {passive: false} : false
  const willNotPreventDefault = passiveSupported ? {passive: true} : false

  component.addEventListener('touchstart', touchStartHandler, willNotPreventDefault)
  component.addEventListener('mousedown', touchStartHandler, willNotPreventDefault)

  component.addEventListener('touchmove', touchMoveHandler, willPreventDefault)
  component.addEventListener('mousemove', touchMoveHandler, willPreventDefault)

  component.addEventListener('touchend', touchEndHandler, willNotPreventDefault)
  component.addEventListener('mouseup', touchEndHandler, willNotPreventDefault)
}

var members = {
  value: null,
  __prevValue: null,
  __isSingleTouch: false,
  __isTracking: false,
  __didDecelerationComplete: false,
  __isGesturing: false,
  __isDragging: false,
  __isDecelerating: false,
  __isAnimating: false,
  __clientTop: 0,
  __clientHeight: 0,
  __contentHeight: 0,
  __itemHeight: 0,
  __scrollTop: 0,
  __minScrollTop: 0,
  __maxScrollTop: 0,
  __scheduledTop: 0,
  __lastTouchTop: null,
  __lastTouchMove: null,
  __positions: null,
  __minDecelerationScrollTop: null,
  __maxDecelerationScrollTop: null,
  __decelerationVelocityY: null,

  __setDimensions (clientHeight, contentHeight) {
    var self = this

    self.__clientHeight = clientHeight
    self.__contentHeight = contentHeight

    var totalItemCount = self.options.data.length
    var clientItemCount = Math.round(self.__clientHeight / self.__itemHeight)

    self.__minScrollTop = -self.__itemHeight * (clientItemCount / 2)
    self.__maxScrollTop = self.__minScrollTop + totalItemCount * self.__itemHeight - 0.1
  },

  selectByIndex (index, animate) {
    index = this.adjustIndex(index) || 0
    if (index < 0 || index > this.__content.childElementCount - 1) {
      return
    }
    this.__scrollTop = this.__minScrollTop + index * this.__itemHeight

    this.scrollTo(this.__scrollTop, animate)
    this.__selectItem(this.__content.children[index])
  },

  select (value, animate) {
    var self = this

    var children = self.__content.children
    for (var i = 0, len = children.length; i < len && isExist(value); i++) {
      if (children[i].dataset.value === value.toString()) {
        self.selectByIndex(i, animate)
        return
      }
    }

    self.selectByIndex(0, animate)
  },

  adjustIndex (index) {
    var children = (this.__content && this.__content.children) || []

    for (var i = Math.abs(index), len = children.length; i < len; i++) {
      if (!this.isDisabled(i)) {
        return i
      }
    }

    for (let i = index - 1; i >= 0; i--) {
      if (!this.isDisabled(i)) {
        return i
      }
    }
  },

  isDisabled (i) {
    return this.__content && this.__content.children[i] && this.__content.children[i].classList.contains(this.options.disableClass)
  },

  getValue () {
    return this.value
  },

  scrollTo (top, animate) {
    var self = this

    animate = (animate === undefined) ? true : animate

    if (self.__isDecelerating) {
      Animate.stop(self.__isDecelerating)
      self.__isDecelerating = false
    }

    top = Math.round((top / self.__itemHeight).toFixed(5)) * self.__itemHeight
    top = Math.max(Math.min(self.__maxScrollTop, top), self.__minScrollTop)

    if (top === self.__scrollTop || !animate) {
      self.__publish(top)
      self.__scrollingComplete()
      return
    }
    self.__publish(top, 250)
  },

  destroy () {
    this.__component = null
    this.__content = null
    this.__maxScrollTop = 0
  },

  __selectItem (selectedItem) {
    var self = this

    var selectedItemClass = self.options.itemClass + '-selected'
    var lastSelectedElem = self.__content.querySelector('.' + selectedItemClass)
    if (lastSelectedElem) {
      lastSelectedElem.classList.remove(selectedItemClass)
    }
    selectedItem.classList.add(selectedItemClass)

    if (self.value !== null) {
      self.__prevValue = self.value
    }
    self.value = selectedItem.dataset.value
  },

  __scrollingComplete () {
    var self = this

    var index = Math.round((self.__scrollTop - self.__minScrollTop - self.__itemHeight / 2) / self.__itemHeight)

    !isNaN(index) && self.__content && self.__selectItem(self.__content.children[index])
    if (self.__prevValue !== null && self.__prevValue !== self.value) {
      self.options.onSelect(self.value)
    }
  },

  __doTouchStart (ev, timeStamp) {
    const touches = ev.touches
    const self = this
    const target = ev.touches ? ev.touches[0] : ev
    const isMobile = !!ev.touches

    if (ev.touches && touches.length == null) {
      throw new Error('Invalid touch list: ' + touches)
    }
    if (timeStamp instanceof Date) {
      timeStamp = timeStamp.valueOf()
    }
    if (typeof timeStamp !== 'number') {
      throw new Error('Invalid timestamp value: ' + timeStamp)
    }

    self.__interruptedAnimation = true

    if (self.__isDecelerating) {
      Animate.stop(self.__isDecelerating)
      self.__isDecelerating = false
      self.__interruptedAnimation = true
    }

    if (self.__isAnimating) {
      Animate.stop(self.__isAnimating)
      self.__isAnimating = false
      self.__interruptedAnimation = true
    }

    var currentTouchTop
    var isSingleTouch = (isMobile && touches.length === 1) || !isMobile
    if (isSingleTouch) {
      currentTouchTop = target.pageY
    } else {
      currentTouchTop = Math.abs(target.pageY + touches[1].pageY) / 2
    }

    self.__initialTouchTop = currentTouchTop
    self.__lastTouchTop = currentTouchTop
    self.__lastTouchMove = timeStamp
    self.__lastScale = 1
    self.__enableScrollY = !isSingleTouch
    self.__isTracking = true
    self.__didDecelerationComplete = false
    self.__isDragging = !isSingleTouch
    self.__isSingleTouch = isSingleTouch
    self.__positions = []
  },

  __doTouchMove (ev, timeStamp, scale) {
    const self = this
    const touches = ev.touches
    const target = ev.touches ? ev.touches[0] : ev
    const isMobile = !!ev.touches

    if (touches && touches.length == null) {
      throw new Error('Invalid touch list: ' + touches)
    }
    if (timeStamp instanceof Date) {
      timeStamp = timeStamp.valueOf()
    }
    if (typeof timeStamp !== 'number') {
      throw new Error('Invalid timestamp value: ' + timeStamp)
    }

    if (!self.__isTracking) {
      return
    }

    var currentTouchTop

    if (isMobile && touches.length === 2) {
      currentTouchTop = Math.abs(target.pageY + touches[1].pageY) / 2
    } else {
      currentTouchTop = target.pageY
    }

    var positions = self.__positions

    if (self.__isDragging) {
      var moveY = currentTouchTop - self.__lastTouchTop
      var scrollTop = self.__scrollTop

      if (self.__enableScrollY) {
        scrollTop -= moveY

        var minScrollTop = self.__minScrollTop
        var maxScrollTop = self.__maxScrollTop

        if (scrollTop > maxScrollTop || scrollTop < minScrollTop) {
          if (scrollTop > maxScrollTop) {
            scrollTop = maxScrollTop
          } else {
            scrollTop = minScrollTop
          }
        }
      }

      if (positions.length > 40) {
        positions.splice(0, 20)
      }

      positions.push(scrollTop, timeStamp)
      self.__publish(scrollTop)

    } else {
      var minimumTrackingForScroll = 0
      var minimumTrackingForDrag = 5

      var distanceY = Math.abs(currentTouchTop - self.__initialTouchTop)

      self.__enableScrollY = distanceY >= minimumTrackingForScroll

      positions.push(self.__scrollTop, timeStamp)

      self.__isDragging = self.__enableScrollY && (distanceY >= minimumTrackingForDrag)

      if (self.__isDragging) {
        self.__interruptedAnimation = false
      }
    }

    self.__lastTouchTop = currentTouchTop
    self.__lastTouchMove = timeStamp
    self.__lastScale = scale
  },

  __doTouchEnd (timeStamp) {
    var self = this

    if (timeStamp instanceof Date) {
      timeStamp = timeStamp.valueOf()
    }
    if (typeof timeStamp !== 'number') {
      throw new Error('Invalid timestamp value: ' + timeStamp)
    }

    if (!self.__isTracking) {
      return
    }

    self.__isTracking = false

    if (self.__isDragging) {
      self.__isDragging = false

      if (self.__isSingleTouch && (timeStamp - self.__lastTouchMove) <= 100) {
        var positions = self.__positions
        var endPos = positions.length - 1
        var startPos = endPos

        for (var i = endPos; i > 0 && positions[i] > (self.__lastTouchMove - 100); i -= 2) {
          startPos = i
        }

        if (startPos !== endPos) {
          var timeOffset = positions[endPos] - positions[startPos]
          var movedTop = self.__scrollTop - positions[startPos - 1]

          self.__decelerationVelocityY = movedTop / timeOffset * (1000 / 60)

          var minVelocityToStartDeceleration = 4

          if (Math.abs(self.__decelerationVelocityY) > minVelocityToStartDeceleration) {
            self.__startDeceleration(timeStamp)
          }
        }
      }
    }

    if (!self.__isDecelerating) {
      self.scrollTo(self.__checkToScroll())
    }

    self.__positions.length = 0
  },

  __publish (top, animationDuration) {
    var self = this

    var wasAnimating = self.__isAnimating
    if (wasAnimating) {
      Animate.stop(wasAnimating)
      self.__isAnimating = false
    }

    if (animationDuration) {
      self.__scheduledTop = top

      var oldTop = self.__scrollTop
      var diffTop = top - oldTop

      var step = function (percent, now, render) {
        self.__scrollTop = oldTop + (diffTop * percent)
        if (self.__callback) {
          self.__callback(self.__scrollTop)
        }
      }

      var verify = function (id) {
        return self.__isAnimating === id
      }

      var completed = function (renderedFramesPerSecond, animationId, wasFinished) {
        if (animationId === self.__isAnimating) {
          self.__isAnimating = false
        }
        if (self.__didDecelerationComplete || wasFinished) {
          top = Math.round((top / self.__itemHeight).toFixed(5)) * self.__itemHeight
          top = Math.max(Math.min(self.__maxScrollTop, top), self.__minScrollTop)

          if (top === self.__scrollTop) {
            self.__publish(top)
            self.__scrollingComplete()
          }
        }
      }
      self.__isAnimating = Animate.start(step, verify, completed, animationDuration, wasAnimating ? easeOutCubic : easeInOutCubic)
    } else {
      self.__scheduledTop = self.__scrollTop = top
      if (self.__callback) {
        self.__callback(top)
      }
    }
  },

  __startDeceleration (timeStamp) {
    var self = this

    self.__minDecelerationScrollTop = self.__minScrollTop
    self.__maxDecelerationScrollTop = self.__maxScrollTop

    var step = function (percent, now, render) {
      self.__stepThroughDeceleration(render)
    }

    var minVelocityToKeepDecelerating = 0.5

    var verify = function () {
      var shouldContinue = Math.abs(self.__decelerationVelocityY) >= minVelocityToKeepDecelerating
      if (!shouldContinue) {
        self.__didDecelerationComplete = true
      }
      return shouldContinue
    }

    var completed = function (renderedFramesPerSecond, animationId, wasFinished) {
      self.__isDecelerating = false
      if (self.__scrollTop <= self.__minScrollTop || self.__scrollTop >= self.__maxScrollTop) {
        self.scrollTo(self.__checkToScroll())
        return
      }
      if (self.__didDecelerationComplete) {
        self.scrollTo(self.__checkToScroll())
      }
    }

    self.__isDecelerating = Animate.start(step, verify, completed)
  },

  __checkToScroll () {
    var index = this.adjustIndex(Math.round((this.__scrollTop - this.__minScrollTop - this.__itemHeight / 2) / this.__itemHeight)) || 0

    if (!this.__content || index < 0 || index > this.__content.childElementCount - 1) {
      return
    }

    return this.__minScrollTop + index * this.__itemHeight
  },

  __stepThroughDeceleration (render) {
    var self = this

    var scrollTop = self.__scrollTop + self.__decelerationVelocityY

    var scrollTopFixed = Math.max(Math.min(self.__maxDecelerationScrollTop, scrollTop), self.__minDecelerationScrollTop)
    if (scrollTopFixed !== scrollTop) {
      scrollTop = scrollTopFixed
      self.__decelerationVelocityY = 0
    }

    if (Math.abs(self.__decelerationVelocityY) <= 1) {
      if (Math.abs(scrollTop % self.__itemHeight) < 1) {
        self.__decelerationVelocityY = 0
      }
    } else {
      self.__decelerationVelocityY *= 0.95
    }
    self.__publish(scrollTop)
  }
}

for (var key in members) {
  Scroller.prototype[key] = members[key]
}

export default Scroller
