<template>
  <div
    class="y-column"
    :style="columnStyle"
    ref="container"
    data-role="component"
  >
    <section class="y-column_mask"></section>
    <ul :style="wrapperStyle" data-role="content">
      <li
        v-for="(option, index) in options"
        :key="getOptionText(option)"
        v-html="getOptionText(option)"
        :data-value="option[valueKey] ? option[valueKey] : index"
        class="y-column_item"
        :class="{'y-column-disabled': isDisabled(option)}"
        @click="setValue(option[valueKey] ? option[valueKey] : index, isDisabled(option))"
      />
    </ul>
  </div>
</template>

<script>
import { isObj, deepClone } from '../utils'
import Scroller from '../utils/scroller.js'

export default {
  props: {
    valueKey: {
      type: String
    },
    valueText: {
      type: String
    },
    className: {
      type: String
    },
    itemHeight: {
      type: Number
    },
    visibleItemCount: {
      type: Number
    },
    initialOptions: {
      type: Array,
      default: () => []
    },
    defaultValue: {
      type: [Number, String],
      default: 0
    }
  },
  data () {
    return {
      startPosY: 0,
      offset: 0,
      duration: 0,
      startOffset: 0,
      options: deepClone(this.initialOptions),
      currentValue: deepClone(this.defaultValue),
      scroller: null
    }
  },
  computed: {
    count () {
      return this.options.length
    },
    baseOffset () {
      return this.itemHeight * (this.visibleItemCount - 1) / 2
    },
    columnStyle () {
      return {
        height: (this.itemHeight * this.visibleItemCount) + 'px'
      }
    },
    wrapperStyle () {
      return {
        transition: `${this.duration}ms`,
        transform: `translate3d(0, ${this.offset + this.baseOffset}px, 0)`,
        lineHeight: this.itemHeight + 'px'
      }
    }
  },
  created () {
    this.$parent.children && this.$parent.children.push(this)
  },
  destroyed () {
    this.$parent.children &&
    this.$parent.children.splice(this.$parent.children.indexOf(this), 1)
    this.scroller && this.scroller.destroy()
    this.scroller = null
  },
  mounted () {
    this.$nextTick(() => {
      this.scrollRender()
      if (this.scroller) {
        this.currentValue = this.scroller.getValue()
      }
    })
  },
  watch: {
    defaultValue () {
      this.moveToValue(this.defaultValue)
    }
  },
  methods: {
    isDisabled (option) {
      return isObj(option) && option.disabled
    },
    getOptionText (option) {
      return isObj(option) && this.valueText in option ? option[this.valueText] : option
    },
    moveToValue (value, disabled, isChange) {
      value = value || this.options[0][this.valueKey] || 0
      if (!disabled && (value.toString() !== this.currentValue.toString() || !!isChange)) {
        this.$nextTick(() => {
          this.scrollRender(value)
          this.setValue(value)
        })
      }
    },
    setValue (value, isDisabled) {
      if (this.currentValue.toString() === value.toString() || isDisabled) {
        return
      }
      this.scroller.select(value)
      this.currentValue = this.scroller.getValue()
      this.$emit('change', this.currentValue, this.$attrs.num)
    },
    getName () {
      if (!this.options) {
        return
      }
      const currentKeys = this.options[this.getIndex()]
      return isObj(currentKeys) && this.valueText in currentKeys ? currentKeys[this.valueText] : currentKeys
    },
    getIndex () {
      if (!this.options) {
        return false
      }

      if (!isObj(this.options[0])) {
        return parseInt(this.currentValue, 10)
      }

      for (let i = 0; i < this.options.length; i++) {
        const index = this.options[i][this.valueKey] ? this.options[i][this.valueKey] : i
        if (index.toString() === this.currentValue.toString()) {
          return i
        }
      }
    },
    getDisabled () {
      if (!this.options || !isObj(this.options[0])) {
        return false
      }

      return this.getIndex() !== undefined && !!this.options[this.getIndex()].disabled
    },
    scrollRender (defaultValue) {
      this.scroller && this.scroller.destroy()
      this.scroller = null
      this.scroller = new Scroller(this.$refs.container, {
        data: this.options,
        itemHeight: this.itemHeight,
        defaultValue: defaultValue || this.currentValue,
        onSelect: value => {
          this.currentValue = value
          this.$emit('change', value, this.$attrs.num)
        }
      })
    }
  }
}
</script>

<style scoped>
.y-column {
  flex: 1;
  overflow: hidden;
  font-size: 16px;
  text-align: center;
}
.y-column_mask {
  position: absolute;
  left: 0;
  top: 0;
  height: 100%;
  margin: 0 auto;
  width: 100%;
  z-index: 1;
  background-image: linear-gradient(to bottom, rgba(255, 255, 255, 0.5), rgba(255, 255, 255, 0.1)), linear-gradient(to top, rgba(255, 255, 255, 0.5), rgba(255, 255, 255, 0.1));
  background-position: top, bottom;
  background-size: 100% 38%;
  background-repeat: no-repeat;
  pointer-events: none;
}
.y-column ul {
  margin: 0;
  padding: 0;
  list-style: none;
}
.y-column_item {
  padding: 0 5px;
  color: #333;
  overflow: hidden;
  white-space: nowrap;
  text-overflow: ellipsis;
}
.y-column-selected {
  color: #000;
}
.y-column-disabled {
  opacity: .3;
}
</style>
