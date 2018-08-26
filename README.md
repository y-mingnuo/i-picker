## i-picker 选择器
A powerful mobile picker component for Vue. Supports datetime or custom select option

### 使用指南
``` javascript
import iPicker from 'i-picker';

Vue.use(iPicker);
```

### 普通 Picker 代码演示


#### 基础用法
通过 values 来设置默认值或改变对应值，注意不要设置列表数据中不存在的value值
非datetime需要设置 columns 列数据

```html
<button @click="show = true">show</button>
<i-picker v-model="show" :value="values" :columns="columns" @change="onChange" />
```

```javascript
export default {
  data() {
    return {
      values: [],
      columns: ['杭州', '宁波', '温州', '嘉兴', '湖州']
    };
  },
  methods: {
    onChange (picker, text, index, disabled) {
      console.log(`当前值：${text}, 当前value：${this.values}, 当前索引：${index}, 当前数据disabled状态：${disabled}`);
    }
  }
};
```

#### 禁用选项
选项可以为对象结构，通过设置 disabled 来禁用该选项

如果设置的values中的数据是 disabled 状态，则默认为下一个 disabled 不为true的数据

如果该列所有的选项都是 disabled 的状态，默认返回第一个，可以通过 change 事件最后一个返回参数 disabled 来判断数据状态


```html
<i-picker v-model="show" :value="values" :columns="columns" @confirm="onConfirm" />
```

```javascript
let yearTotal = []
for (var i = 2000; i <= 2030; i++) {
  yearTotal.push({
    name: i + '年',
    value: i,
    disabled: i % 5 === 0
  })
}

export default {
  data() {
    return {
      values: [],
      columns: yearTotal
    };
  },
  methods: {
    onConfirm (text, value, index, disabled) {
      this.values = value
    }
  }
};
```

#### 展示顶部栏

```html
<i-picker 
  v-model="show"
  :value="values"
  :columns="columns"
  @change="onChange"
  @cancel="onCancel"
  @confirm="onConfirm"
  :visibleItemCount="5"
  toolbar
  title="iPicker"/>
```

```javascript
export default {
  data() {
    return {
      values: [2],
      columns: [
        {name: '杭州', disabled: true},
        {name: '宁波'},
        {name: '温州', disabled: true},
        {name: '嘉兴'},
        {name: '湖州'}
      ]
    }
  },
  methods: {
    onConfirm (text, value, index, disabled) {
      this.values = value
      console.log(`当前值：${text}, 当前索引：${index}`);
    },
    onCancel() {
      console.log('取消');
    }
  }
};
```

#### 多列异步动态联动

keys 用于设置多列列表的数据，一个 keys 对应一个列表的数据

```html
<i-picker
  v-model="show"
  :value="values"
  :columns="columns"
  @change="onChange"
  @cancel="onCancel"
  @confirm="onConfirm"
  toolbar
  title="iPicker"/>
```

```javascript
export default {
  data() {
    return {
      values: [],
      columns: [
        {keys: ['浙江', '河北']},
        {keys: [{name: '杭州'}, {name: '宁波', disabled: true}, {name: '温州'}]}
      ]
    };
  },
  methods: {
    onChange (picker, text, value, index, disabled) {
      switch(text[0]) {
        case '浙江':
          picker.setColumnKeys(1, [{name: '杭州'}, {name: '宁波', disabled: true}, {name: '温州'}]);
          break;
        case '河北':
          picker.setColumnKeys(1, [
            {name:'石家庄市', value: 'shijiazhuang'},
            {name:'唐山市', value: 'tangshan'},
            {name:'秦皇岛市', value: 'qinhuangdao'},
            {name:'邯郸市', value: 'handan'},
            {name:'邢台市', value: 'xingtai'},
            {name:'保定市', value: 'baoding'}
          ]);
          break;
        default:
          break;
      }
    },
    onConfirm (text, value, index, disabled) {
      this.values = value
    },
    onCancel () {
      console.log('cancle')
    }
  }
};
```

#### 多列父子联动

```html
<i-picker 
  v-model="show"
  :value="values"
  :columns="columns"
  @cancel="onCancel"
  @confirm="onConfirm"
  toolbar
  title="iPicker"/>
```

```javascript
export default {
  data() {
    return {
      values: ['cn004', 'yuncheng'],
      columns: [
        {
          keys: [
            {name:'北京', value: 'cn001'},
            {name:'天津', value: 'cn002'},
            {name:'河北', value: 'cn003'},
            {name:'山西', value: 'cn004'},
          ],
          className: 'column1'
        },
        {
          keys: {
            'cn001': [
              {name:'北京市', value: 'beijing'}
            ],
            'cn002': [
              {name:'天津市', value: 'tianjing', disabled: true},
            ],
            'cn003': [
              {name:'石家庄市', value: 'shijiazhuang'},
              {name:'唐山市', value: 'tangshan'},
              {name:'秦皇岛市', value: 'qinhuangdao'},
              {name:'邯郸市', value: 'handan'},
              {name:'邢台市', value: 'xingtai'},
              {name:'保定市', value: 'baoding'},
            ],
            'cn004': [
              {name:'太原市', value: 'taiyuan'},
              {name:'大同市', value: 'datong'},
              {name:'阳泉市', value: 'yangquan'},
              {name:'长治市', value: 'changzhi'},
              {name:'晋城市', value: 'jincheng'},
              {name:'朔州市', value: 'shuozhou'},
              {name:'晋中市', value: 'jinzhong'},
              {name:'运城市', value: 'yuncheng'},
              {name:'临汾市', value: 'linfen'},
            ]
          },
          className: 'column2'
        },
        {
          keys: {
            'beijing': [
              {name:'东城区', value: 'city001'},
              {name:'西城区', value: 'city002'},
              {name:'朝阳区', value: 'city003'},
              {name:'丰台区', value: 'city004'},
              {name:'石景山区', value: 'city005'},
              {name:'海淀区', value: 'city006'},
            ],
            'tianjing': [
              {name:'和平区', value: '1city'},
              {name:'河东区', value: '2city'},
              {name:'河西区', value: '3city'},
            ],
            'shijiazhuang': [
              {name:'长安区', value: 'changan'}
            ],
            'tangshan': [
              {name:'路南区', value: '001'},
              {name:'路北区', value: '002'},
              {name:'古冶区', value: '003'},
              {name:'开平区', value: '004'},
              {name:'丰南区', value: '005'},
              {name:'丰润区', value: '006'},
              {name:'滦县', value: '007'},
              {name:'滦南县', value: '008'},
            ],
            'qinhuangdao': ['海港区'],
            'handan': ['邯山区'],
            'xingtai': ['桥东区'],
            'baoding': ['竞秀区'],
            'taiyuan': ['小店区'],
            'datong': ['城区'],
            'yangquan': ['矿区'],
            'changzhi': ['长治县'],
            'jincheng': ['城区'],
            'shuozhou': ['朔城区'],
            'jinzhong': ['榆次区'],
            'yuncheng': ['盐湖区', '临猗区', '万荣区'],
            'linfen': [{name:'城区'}, {name:'古县', disabled: true}],
          },
          className: 'column2'
        },
      ]
    };
  }
};
```

#### 列表数据格式

单列数据格式

```js
// data
['杭州', '宁波', '温州']

// 或者使用 name => value 的形式，不设置value的话默认是数组索引值
[
  { name: '杭州', value: 'city01', disabled: true },
  { name: '宁波', value: 'city02'  },
  { name: '温州', value: 'city03', disabled: true  },
]
```

多列数据格式

> keys 数据对应一个列表数据

```js
// ajax异步动态数据
[
  { 
    keys: ['浙江', '天津', '河北', '山西'],
    className: 'column1'
  },
  { 
    keys: [{ name: '杭州' }, { name: '宁波', disabled: true  }, { name: '温州' }]  
  }
]

// 或者父子联动数据
[
  {
    keys: [
      {name:'北京', value: 'cn001'},
      {name:'天津', value: 'cn002'},
      {name:'河北', value: 'cn003'},
      {name:'山西', value: 'cn004'},
    ],
    className: 'column1'
  },
  {
    keys: {
      'cn001': [
        {name:'北京市', value: 'beijing'}
      ],
      'cn002': [
        {name:'天津市', value: 'tianjing', disabled: true},
      ],
      'cn003': [
        {name:'石家庄市', value: 'shijiazhuang'},
        {name:'唐山市', value: 'tangshan'},
        {name:'秦皇岛市', value: 'qinhuangdao'},
        {name:'邯郸市', value: 'handan'},
        {name:'邢台市', value: 'xingtai'},
        {name:'保定市', value: 'baoding'},
      ],
      'cn004': [
        {name:'太原市', value: 'taiyuan'},
        {name:'大同市', value: 'datong'},
        {name:'阳泉市', value: 'yangquan'},
        {name:'长治市', value: 'changzhi'},
        {name:'晋城市', value: 'jincheng'},
        {name:'朔州市', value: 'shuozhou'},
        {name:'晋中市', value: 'jinzhong'},
        {name:'运城市', value: 'yuncheng'},
        {name:'临汾市', value: 'linfen'},
      ]
    },
    className: 'column2'
  },
  {
    keys: {
      'beijing': [
        {name:'东城区', value: 'city001'},
        {name:'西城区', value: 'city002'},
        {name:'朝阳区', value: 'city003'},
        {name:'丰台区', value: 'city004'},
        {name:'石景山区', value: 'city005'},
        {name:'海淀区', value: 'city006'},
      ],
      'tianjing': [
        {name:'和平区', value: '1city'},
        {name:'河东区', value: '2city'},
        {name:'河西区', value: '3city'},
      ],
      'shijiazhuang': [
        {name:'长安区', value: 'changan'}
      ],
      'tangshan': [
        {name:'路南区', value: '001'},
        {name:'路北区', value: '002'},
        {name:'古冶区', value: '003'},
        {name:'开平区', value: '004'},
        {name:'丰南区', value: '005'},
        {name:'丰润区', value: '006'},
        {name:'滦县', value: '007'},
        {name:'滦南县', value: '008'},
      ],
      'qinhuangdao': ['海港区'],
      'handan': ['邯山区'],
      'xingtai': ['桥东区'],
      'baoding': ['竞秀区'],
      'taiyuan': ['小店区'],
      'datong': ['城区'],
      'yangquan': ['矿区'],
      'changzhi': ['长治县'],
      'jincheng': ['城区'],
      'shuozhou': ['朔城区'],
      'jinzhong': ['榆次区'],
      'yuncheng': ['盐湖区', '临猗区', '万荣区'],
      'linfen': [{name:'城区'}, {name:'古县', disabled: true}],
    },
    className: 'column3'
  }
]
```


#### 加载状态
当 Picker 数据是通过异步获取时，可以通过 `loading` 属性显示加载提示

```html
<i-picker v-model="show" :value="values" :columns="columns" :loading="loading" />
```


#### 自定义展示选项

```html
<i-picker 
  v-model="show"
  :value="values"
  :columns="columns"
  @change="onChange"
  @cancel="onCancel"
  @confirm="onConfirm"
  :visibleItemCount="5"
  toolbar
  title="iPicker"/>
```

```javascript
import icon from './assets/tui.png'

export default {
  data() {
    return {
      values: [1],
      columns: [
        {name: '宁波'},
        {name: `<img src="${icon}" class="y-custom-icon">杭州`},
        {name: '温州'},
        {name: '嘉兴'},
        {name: '湖州'}
      ]
    }
  },
  methods: {
    onConfirm (text, value, index, disabled) {
      this.values = value
      console.log(`当前值：${text}, 当前索引：${index}`);
    },
    onCancel() {
      console.log('取消');
    }
  }
};
```

```css
<style>
.y-custom-icon {
  width: 22px;
  height: 22px;
  margin: 0 3px 0 0;
  vertical-align: text-bottom;
}
</style>
```




### datetime Picker 代码演示

#### 基础用法
需要设置 type 类型

```html
<i-picker
  v-model="show"
  :value="currentDate"
  format="YYYY-MM-DD HH:mm:ss"
  type="datetime"
  :min-date="minDate"
  :max-date="maxDate"
  @change="onChange"
  toolbar
  @cancel="onCancel"
  @confirm="onConfirm"
  title="iPicker"/>
```

```javascript
export default {
  data() {
    return {
      currentDate: new Date(2018, 0, 1),
      minDate: new Date(2018, 0, 1),
      maxDate: new Date(2019, 10, 1)
    };
  },
  methods: {
    onConfirm (text, value, index, disabled) {
      this.currentDate = value
      console.log(`当前值：${text.join(',')}, 当前value：${value.join(',')}, 当前索引：${index.join(',')}`);
    }
  }
};
```

#### 选择年月
通过传入 formatter 函数对选项文字进行处理

```html
<i-picker
        v-model="show"
        :value="currentDate"
        format="YYYY-MM"
        type="year-month"
        :min-date="minDate"
        :max-date="maxDate"
        :formatter="formatter"
        toolbar
        @cancel="onCancel"
        @confirm="onConfirm"
        title="iPicker"/>
```

```javascript
export default {
  data() {
    return {
      currentDate: new Date(2018, 8, 1),
      minDate: new Date(2018, 0, 1),
      maxDate: new Date(2019, 10, 1)
    }
  },
  methods: {
    formatter (type, value) {
      if (type === 'year') {
        return `${value}年`
      } else if (type === 'month') {
        return `${value}月`
      }
      return value
    },
    onConfirm (text, value, index) {
      this.currentDate = value
      console.log(`当前值：${text.join(',')}, 当前value：${value.join(',')}, 当前索引：${index.join(',')}`);
    }
  }
};
```

#### 选择时间

```html
<i-picker
  v-model="show"
  :value="currentTime"
  type="time"
  :min-hour="minHour"
  :max-hour="maxHour"
  @change="onChange"
  toolbar
  @cancel="onCancel"
  @confirm="onConfirm"
  title="iPicker"/>
```

```javascript
export default {
  data() {
    return {
      currentTime: '12:30',
      minHour: 10,
      maxHour: 30
    }
  },
  methods: {
    onConfirm (text, value, index) {
      this.currentDate = value
      console.log(`当前值：${text.join(',')}, 当前value：${value.join(',')}, 当前索引：${index.join(',')}`);
    }
  }
};
```



### API

#### 通用API

| 参数 | 说明 | 类型 | 默认值 |
|-----------|-----------|-----------|-------------|
| show | 控制Picker的显隐<br/>使用 v-model 绑定 | `Boolean` | `false` |
| values | 默认展示值<br/>可以通过values设置选中值 | `Array | string | Date` | `[]` |
| toolbar | 是否显示顶部栏 | `Boolean` | `false` |
| title | 顶部栏标题 | `String` | `''` |
| loading | 是否显示加载状态 | `Boolean` | `false` |
| item-height | 选项高度 | `Number` | `44` |
| confirm-button-text | 确认按钮文字 | `String` | `确认` |
| cancel-button-text | 取消按钮文字 | `String` | `取消` |
| visible-item-count | 可见的选项个数 | `Number` | `5` |

#### 普通 Picker API

| 参数 | 说明 | 类型 | 默认值 |
|-----------|-----------|-----------|-------------|
| columns | 对象数组，配置每一列显示的数据 | `Array` | `[]` |
| value-text | 选项对象中，文字对应的 key | `String` | `name` |
| value-key | 选项对象中，value对应的 key | `String` | `value` |

#### datetime Picker API

| 参数 | 说明 | 类型 | 默认值 |
|-----------|-----------|-----------|-------------|
| format | 格式化 datetime 的展示，不支持特殊字符 | `String` | `''` |
| type | 类型，可选值为 `datetime` `date` `time` `year-month` | `String` | `datetime` |
| formatter | 对选项文字进行处理，type 支持 `year` `month` `day` `year-month` | `(type, value) => value` | `-` |
| min-date | 可选的最小日期 | `Date` | 十年前的 1 月 1 日 |
| max-date | 可选的最大日期 | `Date` | 十年后的 12 月 31 日 |
| min-hour | 可选的最小小时，针对 time 类型 | `Number` | `0` |
| max-hour | 可选的最大小时，针对 time 类型 | `Number` | `23` |
| min-minute | 可选的最小分钟，针对 time 类型 | `Number` | `0` |
| max-minute | 可选的最大分钟，针对 time 类型 | `Number` | `59` |

### Event

| 事件名 | 说明 | 参数 |
|-----------|-----------|-----------|
| close | Picker关闭时触发 | 关闭回调 |
| confirm | 点击完成按钮时触发 | 所有列选中值，所有列选中值对应的索引，所有列选中值对应的 disabled 状态 |
| cancel | 点击取消按钮时触发 | 所有列选中值，所有列选中值对应的索引，所有列选中值对应的 disabled 状态 |
| change | 选项改变时触发 | Picker 实例，所有列选中值，当前列对应的索引，所有列选中值对应的 disabled 状态 |


### Columns 数据结构
当传入多列数据时，`columns`为一个对象数组，数组中的每一个对象配置每一列，每一列有以下`key`

| key | 说明 |
|-----------|-----------|
| keys | 列中对应的备选值 |
| className | 为对应列添加额外的`class` |

### 方法

通过 ref 可以获取到 picker 实例并调用实例方法

| 方法名 | 参数 | 返回值 | 介绍 |
|-----------|-----------|-----------|-------------|
| getNames | - | names | 获取所有列选中的值 |
| getValues | - | values | 获取所有列选中的value |
| getIndexes | - | indexes | 获取所有列选中值对应的索引 |
| getDisabled | - | disableds | 获取所有列选中值对应的 disabled 状态 |
| getColumnType | columnIndex，type ('getName', 'getIndex') | value | 获取对应列选中的值/索引 |
| setColumnKeys | columnIndex, optionIndex | - | 设置对应列的备选值 |
