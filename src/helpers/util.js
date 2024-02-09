import {isEmpty, isNumber, isString, isUndefined} from "lodash/lang";
import {cloneDeep, isArray, isObject, get} from "lodash";
import extractDefault from "./extractDefault";
import {getValuePath, getValuePathMap} from "./valueUtils";
import SUITE from "../constant"
import {value} from "lodash/seq";

const { innerSuite } = SUITE.CONTROL_TYPES
const { getSuites } = SUITE

const isPureObject = function (value) {
  return value instanceof Object && !Array.isArray(value)
}
const getKeyChain = function (keyChain, key) {
  return Array.isArray(key) ? keyChain.concat.apply(keyChain, key): keyChain.concat(key);
}

const getBackgroundStyle = function (config) {
  const { fillType, url, tileSize } = config;
  switch (fillType) {
    case"widthContainTop":
      return "url('".concat(url, "') no-repeat top/100%");
    case"contain":
      return "url('".concat(url, "') no-repeat center/contain");
    case"stretch":
      return "url('".concat(url, "') no-repeat center center / 100% 100%");
    case"tile":
      return "url('".concat(url, "') repeat left top / ").concat(tileSize, "%");
    default:
      return "url('".concat(url, "') no-repeat center/cover ")
  }
}

const getLinearStyle = function (config) {
  const { angle, stops = [] } = config;
  return "linear-gradient(".concat(angle, "deg, ").concat(stops.map((item => {
    const { offset, color } = item || {};
    return "".concat(color || "rgba(255,255,255,0)", " ").concat(offset, "%")
  })).join(", "), ")")
}
const getBackgroundStyleFromFill = function (config) {

  if(isEmpty(config)) {
    return "rgba(255, 255, 255, 0)"
  } else if("string" === typeof config) {
    return config || "rgba(255, 255, 255, 0)"
  } else if(isUndefined(config.value) && isString(config.fillType) && isString(config.url)) {
    return getBackgroundStyle(config || {});
  } else if(isUndefined(config.value) && isNumber(config.angle) && isArray(config.stops)) {
    return getLinearStyle(config || {});
  } else if("flat" === config.type) {
    return config.value || "rgba(255, 255, 255, 0)"
  } else if("image" === config.type) {
    return getBackgroundStyle(config.value || {});
  } else if("linearGradient" === config.type) {
    return getLinearStyle(config.value || {})
  }
}

const defaultBoderStyle = {width: 0, style: "none", color: "rgba(0,0,0,0)"};
const transformStyle = function (config) {
  const { attr, edge = {}, all = {} } = config;
  return edge[attr] || all[attr] || defaultBoderStyle[attr];
}

const getStyle = function (config) {
  const { attr, borderValue, all } = config;
  const styles = Array.apply(0, new Array(4)).map((item, index) => {
    switch (index) {
      case 0:
        return transformStyle({ attr, edge: borderValue.top, all })
      case 1:
        return transformStyle({ attr, edge: borderValue.right, all })
      case 2:
        return transformStyle({ attr, edge: borderValue.bottom, all })
      case 3:
        return transformStyle({ attr, edge: borderValue.left, all })
    }
  });

  return "width" === attr ? styles.reduce((function (item, index) {
    return "".concat(item, " ").concat(index, "px")
  }), "").trim() : styles.join(" ")

}

function getBorderStyle(style = {}) {
  if("object" !== typeof style) {
    style = {}
  }
  return {
    width: getStyle({ attr: "width", borderValue: style }),
    style: getStyle({ attr: "style", borderValue: style }),
    color: getStyle({ attr: "color", borderValue: style })
  }

}

function transformDefault(config) {
  if(isPureObject(config)) {
    void 0 !== config.default && delete config.default
    const k = function (config){
      if(config) {
        const { type = "" } = config;
        return !("string" != typeof type || !["array", "tabs"].includes(type.toLowerCase()))
      }
      return false;
    }(config);
    if(!k) {
      Object.keys(config).forEach(item => transformDefault(config[item]))
    }
  }
}

function setDefault() {
  const params = arguments.length > 0 && void 0 !== arguments[0] ? arguments[0] : {};
  const { config, value = {} } = params;
  if(!config || isEmpty(config)) {
    return config
  }

  const cloneConfig = cloneDeep(config);

  if(!isPureObject(cloneConfig)) return cloneConfig;

  const defaultValue = extractDefault({ config, value });
  Object.keys(cloneConfig).forEach(item => {
    const valuePath = (cloneConfig[item] || {}).valuePath;
    const _value = valuePath ? get(defaultValue, valuePath): defaultValue[item];
    transformDefault(cloneConfig[item]);
    if(isPureObject(cloneConfig[item])) {
      cloneConfig[item].default = isUndefined(_value) ? cloneConfig.default: _value;
    }
  });
  return cloneConfig;
}

function transformRelative({ config, keyChain, valuePathMap }) {
  let { type, children, showInPanel } = config
  showInPanel && function(showInPanel, keyChain, valuePathMap) {
    let result = [];
    if(Array.isArray(showInPanel)) {
      result = [];
    } else if(isPureObject(showInPanel) && showInPanel.conditions) {
      result = showInPanel.conditions;
    }
    result.forEach(item => {
      const [head] = item;
      const relative = function (path) {
        return path && "." !== path[0]
      }(head);

      if(relative) {
        const valuePath1 = getValuePath({
          keyChain: head.split("."),
          valuePathMap: valuePathMap
        }) || [];

        const valuePath2 = getValuePath({
          keyChain: keyChain,
          valuePathMap: valuePathMap
        }) || [];

        if(valuePath1[0] === valuePath2[0]) {
          valuePath1.shift();
          valuePath2.shift();
        }

        const path = "".concat(valuePath2.map(() => {
          return "."
        }));
        item[0] = path;
      }
    });
  }(showInPanel, keyChain, valuePathMap);
  const _type = isString(type) ? type.toLowerCase(): "";
  if(children || innerSuite.includes(_type)) {
    if(innerSuite.includes(_type)) {
      children = getSuites(config).children;;
      Object.keys(children || []).forEach(item => {
        transformRelative({
          config: children[item],
          keyChain: [].concat(keyChain, [item]),
          valuePathMap: valuePathMap
        })
      })
    }
  }
}

function transformShowInPanelToRelative(config) {
  const cloneConfig = cloneDeep(config);
  const valuePathMap = getValuePathMap(cloneConfig);
  if(isPureObject(cloneConfig)) {
    Object.keys(cloneConfig).forEach(item => {
      transformRelative({
        config: cloneConfig[item],
        getKeyChain: [item],
        valuePathMap: valuePathMap
      })
    })
  }
}

function validateCustomStyle(params) {
    const operationMap = {
      OR: "some",
      AND: "every"
    }
    const rule = function (config) {
      const { field, op, value, data } = config
      if(!field || !op) return false;
      const value2 = data[field];
      const val1 = "string" === typeof value ? +value: value;
      const val2 = "string" === typeof value2 ? +value2: value2;
      switch (op) {
        case "gt":
          return val2 > val1;
        case "ge":
          return val2 >= val1;
        case "lt":
          return val2 < val1;
        case "le":
          return val1 >= val2;
        case "eq":
          return value === value2;
        case "ne":
          return value !== value2;
        case "in":
          return "".concat(value2).includes(value)
      }

    }

    const { config, data, ruleKey } = params;

    return config.filter(item => {
      const vo = item[ruleKey];
      return !!vo.enabled && function () {
        const params = arguments.length > 0 && void 0 !== arguments[0] ? arguments[0] : {};
        const { config = {}, data = {} } = params;
        const { expressions = [], operator= "" } = config;

        if(!expressions.length) return false;

        const op = operationMap[operator];
        const result = expressions[op](function () {
          const params = arguments.length > 0 && void 0 !== arguments[0] ? arguments[0] : {};
          const { operator = "", expressions = [] } = params;
          const op = expressions[operator];

          return expressions.length && expressions[op](function () {
            const value = arguments.length > 0 && void 0 !== arguments[0] ? arguments[0] : [];
            return rule({
              field: value[0],
              op: value[1],
              value: value[2],
              data: data
            })
          })
        });
        return result;
      }({ config: vo, data: data })
    })
}

// function transformShowInPanelToStatic(params) {
//   const { value, config } = params;
//   const cloneConfig = cloneDeep(config);
//   const valuePathMap = getValuePathMap(cloneConfig);
//
//   if(isPureObject(cloneConfig)) {
//     Object.keys(cloneConfig).forEach(item => {
//       !function handler(cfg) {
//         const { config, keyChain, valuePathMap, rootValue, arrayPath = "" } = cfg;
//         let { children, showInPanel, show, template, child } = config;
//         if(void 0 !== show && void 0 === showInPanel) {
//           showInPanel = show;
//
//           if(isArray(show)) {
//             showInPanel.map(item => {
//               item[0] = item[0].startsWith(".") ? item[0]: ".".concat(item[0]);
//               return item;
//             })
//           }
//
//           if(showInPanel) {
//             if(arrayPath) {
//
//             }
//           }
//         }
//       }({ config: cloneConfig[item], keyChain: keyChain[item], valuePathMap: valuePathMap, rootValue: value});
//     })
//   }
// }

export {
  isPureObject,
  getKeyChain,
  getBackgroundStyleFromFill,
  getBorderStyle,
  setDefault,
  transformShowInPanelToRelative,
  validateCustomStyle
}

