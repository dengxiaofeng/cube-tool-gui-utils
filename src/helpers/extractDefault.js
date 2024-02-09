import {getShowKey, getValuePath, getValuePathMap} from "./valueUtils";
import {getKeyChain, isPureObject} from './util'
import { merge, omit, get, isArray, cloneDeep, set, isObject } from "lodash";
import SUITE from "../constant"
import {defineProperty} from "./index";

const { CONTROL_TYPES } = SUITE;
const suite = CONTROL_TYPES.suite;
const innerSuite = CONTROL_TYPES.innerSuite;

const suiteTypes = ["group"].concat(suite);

function getValue(params) {
  const { valuePath, rootValue, config, mergedValue, parentDefaultValue } = params;
  let value = get(rootValue, valuePath);
  const { enableHide, type } = config;
  const showKey = getShowKey(config);
  let defaultValue = void 0 === config.default ? parentDefaultValue: config.default;
  const _type = (type || "").toLowerCase();
  if(suiteTypes.includes(_type) && enableHide) {
    if(!isPureObject(defaultValue)) {
      defaultValue = {}
    }
    if(!isPureObject(value)) {
      value = {}
    }

    if(void 0 === defaultValue[showKey]) {
      defaultValue[showKey] = true
    }

    if(void 0 === value[showKey]) {
      value[showKey] = defaultValue[showKey]
    }
    set(mergedValue, valuePath, defineProperty({}, showKey, value[showKey]));
  }

  if(["padding"].includes(_type)) {
    value = Object.assign({}, defaultValue, value)
  }

  return {
    defaultValue,
    value
  }

}

const getParentDefaultValue = function (value, parentDefaultValue, keyChain) {
  if(!isArray(keyChain)) {
    return void 0 !== (value || {})[keyChain] ? value[keyChain]: (parentDefaultValue || {})[keyChain]
  }

  const value1 = isPureObject((value || {})[keyChain[0]]) ? value[keyChain[0]][keyChain[1]]: void 0;
  const value2 = isPureObject((parentDefaultValue || {})[keyChain[0]]) ? parentDefaultValue[keyChain[0]][keyChain[1]]: void 0;
  return value1 || value2;
}

function transformValue ({ parentDefaultValue, defaultValue, value, keyChain }) {
  let result = void 0;
  if(void 0 !== parentDefaultValue) {
    result = parentDefaultValue
  }

  if(void 0 !== defaultValue) {
    result = defaultValue
  }

  if(void 0 !== value) {
    result = value
  }

  if(void 0 === result) {
    (param => {
      const key = param.join(".");
      "handler" !== key && "fold" !== key && console.warn(`Warning from datav.gui: ${key} configuration needs corresponding value or default value!`)
    })(keyChain);
  }

  return result;


}

function getDefaultValue(params) {
  const { config, keyChain, parentDefaultValue } = params;
  if(!config || !isPureObject(config)) {
    return null
  }

  const cfg = omit(params, ["config", "keyChain", "parentDefaultValue"]);
  const { rootValue, mergedValue, valuePathMap } = cfg;
  let { children, type, template, child } = config;

  const _type = (type || "").toLowerCase();

  const valuePath = getValuePath({ keyChain: keyChain, valuePathMap: valuePathMap });
  let { value, defaultValue } = getValue({ config: config, valuePath: valuePath, rootValue, mergedValue, parentDefaultValue  });
  if("array" === _type) {
    if(!value || Array.isArray(value) && !value.length) {
      value = defaultValue
      set(rootValue, valuePath, value);
      set(mergedValue, valuePath, cloneDeep(value));
    }

    if(child.child) {
      children = child.child;
      Object.keys(children).forEach(item => {
        (value || []).forEach((vo, index) => {
          getDefaultValue(Object.assign({}, cfg, {
            config: children[item],
            keyChain: getKeyChain(keyChain, [index, item]),
            parentDefaultValue: getParentDefaultValue(defaultValue, parentDefaultValue, [index, item])
          }))
        })
      })
    } else {
      (children || []).forEach((item, index) => {
        const _keyChain = getKeyChain(keyChain, index);
        const _valuePath = getValuePath({ keyChain: _keyChain, valuePathMap: valuePathMap });
        const _defaultValue = Array.isArray(defaultValue) ? defaultValue[index]: void 0;
        const _parentDefaultValue = Array.isArray(parentDefaultValue) ? parentDefaultValue[index]: void 0;
        const _value = transformValue({
          v: item,
          defaultValue: _defaultValue,
          parentDefaultValue: _parentDefaultValue,
          keyChain: _keyChain
        });
        set(mergedValue, _valuePath, _value);
      });
    }
  } else if("tabs" === _type) {
    if(!value) {
      value = defaultValue
      set(rootValue, valuePath, defaultValue);
      set(mergedValue, valuePath, cloneDeep(defaultValue));
    }

    if(template) {
      children = template.children
      Object.keys(children).forEach(item => {
        (value || []).forEach((vo, index) => {
          getDefaultValue(Object.assign({}, cfg, {
            config: children[item],
            keyChain: getKeyChain(keyChain, [index, item]),
            parentDefaultValue: getParentDefaultValue(defaultValue, parentDefaultValue, [index, item])
          }))
        })
      })
    } else {
      children.forEach((item, index) => {
        Object.keys(item.children || {}).forEach(vo => {
          getDefaultValue(Object.assign({}, cfg, {
            config: item.children[vo],
            keyChain: getKeyChain(keyChain, [index, vo]),
            parentDefaultValue: getParentDefaultValue(defaultValue, parentDefaultValue, [index, vo])
          }))
        })
      })
    }

    const _value = get(mergedValue, valuePath);
    let newValue = isPureObject(_value) ? Object.values(_value): _value;
    newValue = Array.isArray(newValue) ? newValue: [];
    set(mergedValue, valuePath, newValue);
    newValue.forEach((item, index) => {
      const id = get(value, [index, '_id']);
      const label = get(value, [index, '_label']);
      const icon = get(value, [index, '_icon']);

      if(void 0 !== label) {
        item.label = label
      }

      if(void 0 !== icon) {
        item.icon = icon
      }

      if(void 0 !== id) {
        item.id = id
      }
    })
  } else if(children || innerSuite.includes(_type)) {
    if(innerSuite.includes(_type)) {
      const suiteConfig = Object.assign({}, config, {
        default: Object.assign({}, config.default || {}, parentDefaultValue),
      });
      children = suiteConfig.children
      const result = getValue({
        rootValue: rootValue,
        mergedValue: mergedValue,
        valuePath: valuePath,
        config: suiteConfig,
        parentDefaultValue: parentDefaultValue
      });
      value = result.value;
      defaultValue = result.defaultValue;
    }

    Object.keys(children).forEach(item => {
      getDefaultValue(Object.assign({}, cfg, {
        config: children[item],
        keyChain: getKeyChain(keyChain, item),
        parentDefaultValue: getParentDefaultValue(defaultValue, parentDefaultValue, item)
      }))
    })
  } else {
    set(mergedValue, valuePath, transformValue({
      defaultValue: defaultValue,
      parentDefaultValue: parentDefaultValue,
      value,
      keyChain: keyChain
    }))
  }
}
function extractDefault() {
  const params = arguments.length > 0 && void 0 !== arguments[0] ? arguments[0] : {};
  const { config, value = {} } = params
  if(!config) return value;
  const mergedValue = {};
  const valuePathMap = getValuePathMap(config);

  if(isPureObject(config)) {
    Object.keys(config).forEach(item => {
      getDefaultValue({
        config: config[item],
        keyChain: [item],
        rootValue: value,
        mergedValue: mergedValue,
        valuePathMap: valuePathMap
      })
    })
  }
  const defaultValues = merge(mergedValue, value);
  return defaultValues;
}

export default extractDefault;
