const SuiteConfig = {
  font: {
    fontFamily: {
      caption: "字体",
      type: "select",
      options: [{
        value: "Microsoft Yahei",
        label: "微软雅黑"
      }, {
        value: "SimSun",
        label: "宋体"
      }, {
        value: "SimHei",
        label: "黑体"
      }, {
        value: "LiSu",
        label: "隶书"
      }, {
        value: "fantasy",
        label: "fantasy"
      }, {
        value: "cursive",
        label: "cursive"
      }, {
        value: "YouYuan",
        label: "幼圆"
      }],
      col: 12
    },
    fontWeight: {
      caption: "粗细",
      type: "select",
      options: [{
        value: "normal", label: "normal"
      }, {
        value: "bold", label: "bold"
      }, {
        value: "bolder",
        label: "bolder"
      }, {
        value: "lighter", label: "lighter"
      }, {value: 100, label: 100}, {value: 200, label: 200}, {
        value: 300,
        label: 300
      }, {value: 400, label: 400}, {value: 500, label: 500}, {value: 600, label: 600}, {
        value: 700,
        label: 700
      }, {value: 800, label: 800}, {value: 900, label: 900}],
      col: 12
    },
    fontSize: {caption: "大小", type: "stepper", suffix: "px", step: 1, min: 0, max: 1e3, col: 12},
    color: {caption: "颜色", type: "fill", col: 12}
  },
  line: {
    width: {caption: "粗细", type: "stepper", suffix: "px", step: 1, min: 0, col: 12},
    curve: {
      type: "iconRadio",
      className: "radio-custom",
      caption: "曲率",
      options: [{value: "smooth", src: "smooth-line", label: "平滑曲线"}, {
        value: "polyline",
        src: "poly-line",
        label: "折线"
      }],
      col: 12
    },
    style: {
      caption: "线条",
      type: "select",
      options: [{label: "实线", value: "solid"}, {label: "点线", value: "dotted"}, {
        label: "虚线",
        value: "dashed"
      }],
      col: 12
    },
    color: {caption: "颜色", type: "fill", col: 12}
  },
  margin: {
    top: {caption: "顶部", type: "stepper", suffix: "px", step: 1, min: 0, col: 12},
    bottom: {caption: "底部", type: "stepper", suffix: "px", step: 1, min: 0, col: 12},
    left: {caption: "左侧", type: "stepper", suffix: "px", step: 1, min: 0, col: 12},
    right: {caption: "右侧", type: "stepper", suffix: "px", step: 1, min: 0, col: 12}
  }
}

const SuiteValue = {
  font: {fontFamily: "Microsoft Yahei", fontWeight: "normal", color: "#fff", fontSize: 12},
  line: {width: 1, curve: "polyline", style: "solid", color: "#fff"},
  margin: {top: 10, bottom: 10, left: 10, right: 10}
}

export default {
  CONTROL_TYPES: {
    field: ["text", "select", "switch"],
    suite: ["suite", "font", "margin", "line", "numbers", "iconselects"],
    innerSuite: ["font", "margin", "line"],
    collection: ["group", "tabs", "menu"]
  },
  SUITES_CHILDREN: SuiteConfig,
  getSuites: function (suite) {
    const { type } = suite
    return Object.assign({}, { default: Object.assign({}, SuiteValue[type]), children: SuiteConfig[type] }, suite)
  }
}
