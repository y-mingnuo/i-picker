<template>
  <div class="y-picker">
    <div class="y-picker_toolbar" v-if="toolbar">
      <slot>
        <div class="y-picker_cancel" @click="emit('cancel')">{{ cancelButtonText || 'cancel' }}</div>
        <div class="y-picker_title" v-if="title" v-text="title" />
        <div class="y-picker_confirm" @click="emit('confirm')">{{ confirmButtonText || 'confirm' }}</div>
      </slot>
    </div>
    <div v-if="loading" class="y-picker_loading">
      <div class="y-loading--circular">
        <span class="y-loading_spinner">
          <svg class="y-loading_circular" viewBox="25 25 50 50">
            <circle cx="50" cy="50" r="20" fill="none" />
          </svg>
        </span>
      </div>
    </div>
    <div class="y-picker_columns" :style="columnsStyle" @touchmove.prevent>
      <picker-column
        v-for="(item, index) in datas"
        :key="index"
        :value-text="valueText"
        :value-key="valueKey"
        :initial-options="item"
        :class-name="columns[index].className"
        :default-value="defaultValue[index]"
        :item-height="itemHeight"
        :visible-item-count="visibleItemCount"
        @change="onChange"
        :num="index"
      />
      <div class="y-picker_frame" :style="frameStyle" />
    </div>
  </div>
</template>

<script>
import PickerColumn from './PickerColumn.vue'
import { isExist, isObj, deepClone } from '../utils'

export default {
  components: {
    PickerColumn
  },
  props: {
    title: {
      type: String
    },
    loading: {
      type: Boolean
    },
    toolbar: {
      type: Boolean
    },
    confirmButtonText: {
      type: String
    },
    cancelButtonText: {
      type: String
    },
    value: {
      type: Array
    },
    visibleItemCount: {
      type: Number,
      default: 5
    },
    valueText: {
      type: String,
      default: 'name'
    },
    valueKey: {
      type: String,
      default: 'value'
    },
    itemHeight: {
      type: Number,
      default: 44
    },
    columns: {
      type: Array,
      default: () => []
    }
  },
  data () {
    return {
      children: [],
      currentValues: this.value,
      tempValue: null,
      defaultValue: [...this.value],
      initVal: []
    }
  },
  computed: {
    frameStyle () {
      return {
        height: this.itemHeight + 'px'
      }
    },
    columnsStyle () {
      return {
        height: this.itemHeight * this.visibleItemCount + 'px'
      }
    },
    simple () {
      return this.columns.length && !this.columns[0].keys
    },
    datas () {
      let columnList = this.simple ? [this.columns] : this.columns
      return columnList.map((item, index) => {
        return this.simple ? item : this.renderKeys(index)
      })
    }
  },
  watch: {
    value (val, oldVal) {
      if (JSON.stringify(val) === JSON.stringify(oldVal)) {
        return
      }
      this.currentValues.forEach((v, i) => {
        const vals = val[i] || 0
        if (v !== vals) {
          setTimeout(() => {
            this.children[i].setValue(vals)
          }, 200 * i)
        }
      })
    },
    columns () {
      const columns = this.simple ? [{ keys: this.columns }] : this.columns
      columns.forEach((column, index) => {
        this.setColumnKeys(index, deepClone(column.keys), this.value[index])
      })
    },
    currentValues (val) {
      this.$emit('input', val)
    }
  },
  mounted () {
    this.$nextTick(() => {
      this.currentValues = this.simple ? [this.getColumnValue(0)] : this.getValues()
      this.$emit('input', this.currentValues)
    })
  },
  destroyed () {
    this.children &&
    this.children.forEach((child) => {
      child.scroller && child.scroller.destroy()
      child.scroller = null
    })
    this.children = []
  },
  methods: {
    emit (event) {
      let newVal = this.currentValues.slice()
      const oldText = this.simple ? [this.getColumnType(0, 'getName')] : [...this.getNames()]
      for (let i = 0; i < newVal.length; i++) {
        if (!oldText[i]) {
          newVal[i] = null
        }
      }

      if (this.simple) {
        this.$emit(event, this.getColumnType(0, 'getName'), newVal, this.getColumnType(0, 'getIndex'), this.getDisabled())
      } else {
        this.$emit(event, this.getNames(), newVal, this.getIndexes(), this.getDisabled())
      }
    },
    onChange (value, index) {
      this.$set(this.currentValues, index, value)
      try {
        if (!this.simple && index !== this.columns.length - 1) {
          this.setColumnKeys(index + 1, this.renderKeys(index + 1))
        }
      } catch (error) {
        return
      }

      let newVal = this.currentValues.slice()
      const oldText = this.simple ? [this.getColumnType(0, 'getName')] : [...this.getNames()]
      for (let i = 0; i < newVal.length; i++) {
        if (!oldText[i]) {
          newVal[i] = null
        }
      }
      if (this.simple) {
        this.$emit(
          'change',
          this,
          this.getColumnType(0, 'getName'),
          newVal,
          this.getColumnType(0, 'getIndex'),
          this.getDisabled()
        )
      } else {
        this.$emit('change', this, this.getNames(), newVal, this.getIndexes(), this.getDisabled())
      }
    },
    getColumn (index) {
      return this.children[index]
    },
    getColumnType (index, type) {
      const column = this.getColumn(index)
      return column && column[type]()
    },
    getColumnValue (columnIndex) {
      return (this.getColumn(columnIndex) || {}).currentValue
    },
    setColumnKeys (index, options, value = null) {
      const column = this.children[index]

      if (!this.simple) {
        const prevOption = index > 0 ? this.children[index - 1].options : []
        if (prevOption.length) {
          prevOption.forEach(item => {
            if (item.disabled && item[this.valueKey].toString() === this.currentValues[index - 1].toString()) {
              options.map(option => (option.disabled = true))
            }
          })
        }
      }

      if (column && JSON.stringify(column.options) !== JSON.stringify(options)) {
        column.options = options
        column.moveToValue(value, false, true)
      }
    },
    getNames () {
      return this.children.map((child) => child.getName())
    },
    getValues () {
      return this.children.map((child) => child.currentValue)
    },
    getIndexes () {
      return this.children.map((child) => child.getIndex())
    },
    renderKeys (index) {
      const key = this.columns[index].keys
      if (!isExist(key)) {
        throw new Error('columns data format is wrong')
      }
      if (Object.prototype.toString.call(key) === '[object Array]') {
        return key
      } else {
        const i = !!this.currentValues[index - 1] || this.currentValues[index - 1] === 0
          ? this.currentValues[index - 1]
          : (this.tempValue || Object.keys(key)[0])

        if (!key[i]) {
          const name = (this.children[index - 1] && this.children[index - 1].getName()) || ''
          throw new Error('wrong column inital data, can\'t find the data below ' + name)
        } else {
          this.tempValue = this.getOptionKey(key[i][0], 0)

          let prevOption = this.columns[index - 1].keys
          if (Object.prototype.toString.call(prevOption) !== '[object Array]') {
            prevOption = prevOption[this.currentValues[index - 2]]
          }
          if (prevOption && prevOption.length) {
            prevOption.forEach((item) => {
              if (item.disabled && item[this.valueKey].toString() === i.toString()) {
                key[i].map(option => (option.disabled = true))
              }
            })
          }

          return key[i]
        }
      }
    },
    getDisabled () {
      return this.simple
        ? this.children[0].getDisabled()
        : this.children.map((child) => child.getDisabled())
    },
    getOptionKey (option, index) {
      return isObj(option) && this.valueKey in option ? option[this.valueKey].toString() : index.toString()
    }
  }
}
</script>

<style>
.y-picker_loading {
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  z-index: 2;
  position: absolute;
  background-color: rgba(255, 255, 255, .7);
}
.y-loading--circular {
  animation-duration: 2s;
  width: 30px;
  height: 30px;
  z-index: 0;
  font-size: 0;
  line-height: 0;
  position: relative;
  vertical-align: middle;
}
.y-loading--circular circle {
  stroke: #38f;
}
.y-loading_spinner {
  z-index: -1;
  width: 100%;
  height: 100%;
  position: relative;
  display: inline-block;
  box-sizing: border-box;
  animation: rotate .8s linear infinite;
  border-radius: 100%;
  border: 3px solid transparent;
}
.y-loading_circular {
  width: 100%;
  height: 100%;
}

.y-loading_circular circle {
  stroke-width: 3;
  stroke-linecap: round;
  animation: circular 1.5s ease-in-out infinite;
}

@keyframes circular {
  0% {
    stroke-dasharray: 1, 200;
    stroke-dashoffset: 0;
  }

  50% {
    stroke-dasharray: 90, 150;
    stroke-dashoffset: -40;
  }

  100% {
    stroke-dasharray: 90, 150;
    stroke-dashoffset: -120;
  }
}
.y-picker {
  overflow: hidden;
  user-select: none;
  position: relative;
  background-color: #fff;
  -webkit-text-size-adjust: 100%;
}
.y-picker_toolbar {
  display: flex;
  height: 40px;
  line-height: 40px;
  justify-content: space-between;
  position: relative;
}
.y-picker_toolbar::after, .y-picker_frame::after {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  width: 200%;
  height: 200%;
  transform: scale(.5);
  transform-origin: 0 0;
  pointer-events: none;
  box-sizing: border-box;
  border: 0 solid #e5e5e5;
  border-width: 1px 0;
}
.y-picker_cancel,
.y-picker_confirm {
    color: #38f;
    padding: 0 15px;
}
.y-picker_cancel:active,
.y-picker_confirm:active {
  background-color: #e8e8e8;
}
.y-picker_title {
  max-width: 50%;
  text-align: center;
  overflow: hidden;
  white-space: nowrap;
  text-overflow: ellipsis;
}
.y-picker_columns {
  display: flex;
  position: relative;
}
.y-picker_loading .y-loading--circular,
.y-picker_frame {
  top: 50%;
  left: 0;
  width: 100%;
  z-index: 1;
  position: absolute;
  pointer-events: none;
  transform: translateY(-50%);
}
</style>
