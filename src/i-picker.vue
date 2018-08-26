<template>
  <transition name="y-slide-bottom">
    <div v-show="show" class="y-popup y-popup--bottom">
      <picker
        :title="title"
        :columns="columns"
        v-model="values"
        :item-height="itemHeight"
        :toolbar="toolbar"
        :visible-item-count="visibleItemCount"
        :confirm-button-text="confirmButtonText"
        :cancel-button-text="cancelButtonText"
        :loading="loading"
        @change="onChange"
        @confirm="onConfirm"
        @cancel="onCancel"
        v-if="!type"
      />
      <datetime-picker
        :title="title"
        v-model="values"
        :type="type"
        :item-height="itemHeight"
        :toolbar="toolbar"
        :visible-item-count="visibleItemCount"
        :confirm-button-text="confirmButtonText"
        :cancel-button-text="cancelButtonText"
        :min-date="minDate"
        :max-date="maxDate"
        :min-hour="minHour"
        :max-hour="maxHour"
        :min-minute="minMinute"
        :max-minute="maxMinute"
        :formatter="formatter"
        @change="onChange"
        @confirm="onConfirm"
        @cancel="onCancel"
        v-else
      />
    </div>
  </transition>
</template>

<script>
import DatetimePicker from './components/DatetimePicker.vue'
import Picker from './components/Picker.vue'
import manager from './utils/manager.js'
import context from './utils/context.js'
import scrollUtils from './utils/scrollUtils.js'
import format from './utils/format.js'
import { on, off } from './utils'

export default {
  name: 'iPicker',
  components: {
    Picker,
    DatetimePicker
  },
  props: {
    show: {
      type: Boolean
    },
    overlay: {
      type: Boolean,
      default: true
    },
    overlayStyle: {
      type: Object
    },
    overlayClass: {
      type: String
    },
    title: {
      type: String
    },
    closeOnClickOverlay: {
      type: Boolean,
      default: true
    },
    zIndex: {
      type: [String || Number]
    },
    lockScroll: {
      type: Boolean
    },
    lazyRender: {
      type: Boolean
    },
    toolbar: {
      type: Boolean
    },
    loading: {
      type: Boolean
    },
    value: {
      type: [Date, String, Array]
    },
    itemHeight: {
      type: Number
    },
    visibleItemCount: {
      type: Number
    },
    confirmButtonText: {
      type: String
    },
    cancelButtonText: {
      type: String
    },
    type: {
      type: String,
      default: ''
    },
    format: {
      type: String
    },
    formatter: {
      type: Function,
      default: (type, value) => value
    },
    minDate: {
      type: Date
    },
    maxDate: {
      type: Date
    },
    minHour: {
      type: Number,
      default: 0
    },
    maxHour: {
      type: Number,
      default: 23
    },
    minMinute: {
      type: Number,
      default: 0
    },
    maxMinute: {
      type: Number,
      default: 59
    },
    columns: {
      type: Array,
      default: () => []
    }
  },
  data () {
    return {
      inited: this.show,
      POPUP_ID: '',
      opened: false,
      direction: '',
      deltaX: 0,
      deltaY: 0,
      offsetX: 0,
      offsetY: 0,
      startX: 0,
      startY: 0,
      values: this.type ? this.value : [...this.value]
    }
  },
  model: {
    prop: 'show'
  },
  computed: {
    shouldRender () {
      return this.inited || !this.lazyRender
    }
  },
  watch: {
    overlay () {
      this.renderOverlay()
    },
    show (val, oldVal) {
      this.inited = this.inited || this.show
      this[val ? 'open' : 'close']()
    },
    value (val, oldVal) {
      if (this.type && (new Date(val).toString() === new Date(oldVal).toString())) {
        return
      }
      this.values = this.type ? new Date(val) : [...val]
    }
  },
  methods: {
    touchStart (event) {
      this.direction = ''
      this.deltaX = 0
      this.deltaY = 0
      this.offsetX = 0
      this.offsetY = 0
      this.startX = event.touches[0].clientX
      this.startY = event.touches[0].clientY
    },
    touchMove (event) {
      const touch = event.touches[0]
      this.deltaX = touch.clientX - this.startX
      this.deltaY = touch.clientY - this.startY
      this.offsetX = Math.abs(this.deltaX)
      this.offsetY = Math.abs(this.deltaY)
      this.direction = this.offsetX > this.offsetY ? 'horizontal' : this.offsetX < this.offsetY ? 'vertical' : ''
    },
    open () {
      if (this.$isServer || this.opened) {
        return
      }

      if (this.zIndex !== undefined) {
        context.zIndex = this.zIndex
      }

      this.opened = true
      this.renderOverlay()

      if (this.lockScroll) {
        on(document, 'touchstart', this.touchStart)
        on(document, 'touchmove', this.onTouchMove)
        if (!context.lockCount) {
          document.body.classList.add('overflow-hidden')
        }
        context.lockCount++
      }
    },
    close (b) {
      if (!this.opened) {
        return
      }

      if (this.lockScroll) {
        context.lockCount--
        off(document, 'touchstart', this.touchStart)
        off(document, 'touchmove', this.onTouchMove)
        if (!context.lockCount) {
          document.body.classList.remove('overflow-hidden')
        }
      }

      this.opened = false
      manager.close(this.POPUP_ID)
      this.$emit('input', false)

      if (!b) {
        if (this.type) {
          this.values = this.type === 'time' ? this.value : new Date(this.value)
        } else {
          this.values = this.value
        }
      }
    },
    move () {
      if (this.getContainer) {
        this.getContainer().appendChild(this.$el)
      } else if (this.$parent) {
        this.$parent.$el.appendChild(this.$el)
      }
    },
    onTouchMove (e) {
      this.touchMove(e)
      const direction = this.deltaY > 0 ? '10' : '01'
      const el = scrollUtils.getScrollEventTarget(e.target, this.$el)
      const { scrollHeight, offsetHeight, scrollTop } = el
      let status = '11'

      if (scrollTop === 0) {
        status = offsetHeight >= scrollHeight ? '00' : '01'
      } else if (scrollTop + offsetHeight >= scrollHeight) {
        status = '10'
      }

      if (
        status !== '11' &&
        this.direction === 'vertical' &&
        !(parseInt(status, 1) & parseInt(direction, 2))
      ) {
        e.preventDefault()
        e.stopPropagation()
      }
    },
    renderOverlay () {
      if (this.overlay) {
        manager.open(this, {
          zIndex: context.plusKey('zIndex'),
          className: this.overlayClass,
          customStyle: this.overlayStyle
        })
      } else {
        manager.close(this.POPUP_ID)
      }

      this.$nextTick(() => {
        this.$el.style.zIndex = context.plusKey('zIndex')
      })
    },
    onConfirm (text, value, index, disabled) {
      value = this.type ? this.dateFormat(value) : value
      this.$emit('confirm', text, value, index, disabled)
      this.close(true)
    },
    onCancel () {
      this.$emit('cancel')
      this.close()
    },
    onChange (picker, text, value, index, disabled) {
      value = this.type ? this.dateFormat(value) : value
      this.$emit('change', picker, text, value, index, disabled)
    },
    dateFormat (val) {
      if (this.format) {
        return format(val, this.format)
      } else {
        return val
      }
    }
  },
  created () {
    this.POPUP_ID = 'popup-' + context.plusKey('id')
  },
  mounted () {
    if (this.show) {
      this.open()
    }
  },
  activated () {
    if (this.show) {
      this.open()
    }
  },
  beforeDestroy () {
    this.close()
  },
  deactivated () {
    this.close()
  }
}
</script>

<style scoped>
.y-popup {
  position: fixed;
  top: 50%;
  left: 50%;
  max-height: 100%;
  overflow-y: auto;
  background-color: #fff;
  transition: .2s ease-out;
  -webkit-overflow-scrolling: touch;
  transform: translate3d(-50%, -50%, 0);
}
.y-popup--bottom {
  width: 100%;
  top: auto;
  bottom: 0;
  right: auto;
  left: 50%;
  transform: translate3d(-50%, 0, 0);
}

.y-slide-bottom-enter,
.y-slide-bottom-leave-active {
  transform: translate3d(-50%, 100%, 0);
}
</style>
<style>
.overflow-hidden {
  overflow: hidden !important;
}
</style>
