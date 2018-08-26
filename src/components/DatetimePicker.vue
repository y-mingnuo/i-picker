<template>
  <picker
    ref="picker"
    :title="title"
    :columns="columns"
    v-model="values"
    :item-height="itemHeight"
    :toolbar="toolbar"
    :visible-item-count="visibleItemCount"
    :confirm-button-text="confirmButtonText"
    :cancel-button-text="cancelButtonText"
    @change="onChange"
    @confirm="onConfirm"
    @cancel="$emit('cancel')"
  />
</template>

<script>
import Picker from './Picker'

const currentYear = new Date().getFullYear()
const isValidDate = date => Object.prototype.toString.call(date) === '[object Date]' && !isNaN(date.getTime())

export default {
  components: {
    Picker
  },
  props: {
    value: {
      type: [Date, String],
      default: ''
    },
    title: {
      type: String
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
    toolbar: {
      type: Boolean
    },
    type: {
      type: String,
      default: 'datetime'
    },
    formatter: {
      type: Function,
      default: (type, value) => value
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
    minDate: {
      type: Date,
      default: () => new Date(currentYear - 10, 0, 1),
      validator: isValidDate
    },
    maxDate: {
      type: Date,
      default: () => new Date(currentYear + 10, 11, 31),
      validator: isValidDate
    }
  },
  data () {
    return {
      innerValue: this.correctValue(this.value),
      values: [],
      columns: []
    }
  },
  computed: {
    ranges () {
      if (this.type === 'time') {
        return [
          {
            type: 'hour',
            range: [this.minHour, this.maxHour]
          },
          {
            type: 'minute',
            range: [this.minMinute, this.maxMinute]
          }
        ]
      }

      const { maxYear, maxDate, maxMonth, maxHour, maxMinute } = this.getBoundary('max', this.innerValue)
      const { minYear, minDate, minMonth, minHour, minMinute } = this.getBoundary('min', this.innerValue)

      const result = [
        {
          type: 'year',
          range: [minYear, maxYear]
        },
        {
          type: 'month',
          range: [minMonth, maxMonth]
        },
        {
          type: 'day',
          range: [minDate, maxDate]
        },
        {
          type: 'hour',
          range: [minHour, maxHour]
        },
        {
          type: 'minute',
          range: [minMinute, maxMinute]
        }
      ]

      if (this.type === 'date') result.splice(3, 2)
      if (this.type === 'year-month') result.splice(2, 3)
      return result
    }
  },
  watch: {
    value (val) {
      val = this.correctValue(val)
      const isEqual = this.type === 'time' ? val === this.innerValue : val.valueOf() === this.innerValue.valueOf()
      if (!isEqual) this.innerValue = val
    },
    innerValue (val) {
      val = this.correctValue(val)
      this.updateColumnValue(val)
      this.$emit('input', val)
    },
    ranges (val, oldVal) {
      if (val.length === oldVal.length) {
        val.forEach((item, i) => {
          const typeOne = oldVal.filter(oldOne => {
            return oldOne.type === item.type
          })
          if (typeOne[0].range && (item.range.join('') !== typeOne[0].range.join(''))) {
            this.columns = this.renderColumns()
          }
        })
      } else {
        this.columns = this.renderColumns()
      }
    }
  },
  methods: {
    renderColumns () {
      const results = this.ranges.map(({ type, range }) => {
        const values = this.times(range[1] - range[0] + 1, index => {
          let value = range[0] + index
          value = value < 10 ? `0${value}` : `${value}`
          return this.formatter(type, value)
        })

        return {
          keys: values.map((value) => ({name: value, value}))
        }
      })
      return results
    },
    correctValue (value) {
      const isDateType = this.type !== 'time'
      if (isDateType && !isValidDate(value)) {
        value = this.minDate
      } else if (!value) {
        const { minHour } = this
        value = `${minHour > 10 ? minHour : '0' + minHour}:00`
      }

      if (!isDateType) {
        const [hour, minute] = value.split(':')
        let correctedHour = Math.min(Math.max(parseInt(hour), this.minHour), this.maxHour)
        correctedHour = `00${correctedHour}`.slice(-2)

        return `${correctedHour}:${minute}`
      }

      const { maxYear, maxDate, maxMonth, maxHour, maxMinute } = this.getBoundary('max', value)
      const { minYear, minDate, minMonth, minHour, minMinute } = this.getBoundary('min', value)
      const minDay = new Date(minYear, minMonth - 1, minDate, minHour, minMinute)
      const maxDay = new Date(maxYear, maxMonth - 1, maxDate, maxHour, maxMinute)
      value = Math.min(Math.max(value, minDay), maxDay)

      return new Date(value)
    },
    times (n, iteratee) {
      let index = -1
      const result = Array(n)
      while (++index < n) {
        result[index] = iteratee(index)
      }
      return result
    },
    getBoundary (type, value) {
      const boundary = this[`${type}Date`]
      const year = boundary.getFullYear()
      let month = 1
      let date = 1
      let hour = 0
      let minute = 0

      if (type === 'max') {
        month = 12
        date = this.getMonthEndDay(value.getFullYear(), value.getMonth() + 1)
        hour = 23
        minute = 59
      }

      if (value.getFullYear() >= year) {
        month = boundary.getMonth() + 1
        if (value.getMonth() + 1 >= month) {
          date = boundary.getDate()
          if (value.getDate() >= date) {
            hour = boundary.getHours()
            if (value.getHours() >= hour) {
              minute = boundary.getMinutes()
            }
          }
        }
      }

      return {
        [`${type}Year`]: year,
        [`${type}Month`]: month,
        [`${type}Date`]: date,
        [`${type}Hour`]: hour,
        [`${type}Minute`]: minute
      }
    },
    getTrueValue (formattedValue) {
      if (!formattedValue) return
      while (isNaN(parseInt(formattedValue, 10))) {
        formattedValue = formattedValue.slice(1)
      }
      return parseInt(formattedValue, 10)
    },
    getMonthEndDay (year, month) {
      if (this.isShortMonth(month)) {
        return 30
      } else if (month === 2) {
        return this.isLeapYear(year) ? 29 : 28
      } else {
        return 31
      }
    },
    pad (val) {
      return `00${val}`.slice(-2)
    },
    isLeapYear (year) {
      return (year % 4 === 0 && year % 100 !== 0) || (year % 400 === 0)
    },
    isShortMonth (month) {
      return [4, 6, 9, 11].indexOf(month) > -1
    },
    onConfirm (text, index, disabled) {
      this.$emit('confirm', text, this.innerValue, index, disabled)
    },
    onChange (picker, text, values, index, disabled) {
      let value

      if (this.type === 'time') {
        value = this.values.join(':')
      } else {
        const year = this.getTrueValue(this.values[0])
        const month = this.getTrueValue(this.values[1])
        const maxDate = this.getMonthEndDay(year, month)
        let date = this.getTrueValue(this.values[2])
        if (this.type === 'year-month') {
          date = 1
        }
        date = date > maxDate ? maxDate : date
        let hour = 0
        let minute = 0
        if (this.type === 'datetime') {
          hour = this.getTrueValue(this.values[3])
          minute = this.getTrueValue(this.values[4])
        }
        value = new Date(year, month - 1, date, hour, minute)
      }
      value = this.correctValue(value)
      this.innerValue = value

      this.$nextTick(() => {
        this.$nextTick(() => {
          this.$emit('change', picker, text, this.innerValue, index, disabled)
        })
      })
    },
    updateColumnValue (value) {
      let values = []
      const { formatter, pad } = this
      if (this.type === 'time') {
        const currentValue = value.split(':')
        values = [
          formatter('hour', currentValue[0]),
          formatter('minute', currentValue[1])
        ]
      } else {
        values = [
          formatter('year', `${value.getFullYear()}`),
          formatter('month', pad(value.getMonth() + 1)),
          formatter('day', pad(value.getDate()))
        ]
        if (this.type === 'datetime') {
          values.push(
            formatter('hour', pad(value.getHours())),
            formatter('minute', pad(value.getMinutes()))
          )
        }
        if (this.type === 'year-month') {
          values = values.slice(0, 2)
        }
      }

      if (this.$refs.picker.children[0].scroller) {
        this.values = values
      } else {
        this.$nextTick(() => {
          this.values = values
        })
      }
    }
  },
  created () {
    this.columns = this.renderColumns()
  },
  mounted () {
    this.updateColumnValue(this.innerValue)
  }
}
</script>
