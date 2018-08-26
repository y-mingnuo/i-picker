import IPicker from './i-picker.vue'

const iPicker = {
  install(Vue) {
    Vue.component(IPicker.name, IPicker)
  }
}

if (typeof window !== 'undefined' && window.Vue) {
  Vue.use(iPicker)
}

export default iPicker
