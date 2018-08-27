import IPicker from './i-picker.vue'

function install (Vue) {
  if (install.installed) return
  install.installed = true
  Vue.component('i-picker', IPicker)
}

const iPicker = {
  install: install,
  IPicker
}

if (typeof window !== undefined && window.Vue) {
  window.Vue.use(iPicker)
}

export default iPicker
