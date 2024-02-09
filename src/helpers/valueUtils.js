import {isObject} from "lodash";
import {isNumber, isString} from "lodash/lang";
import Suite from '../constant';
import {defineProperty} from "./index";

const { CONTROL_TYPES, getSuites } = Suite
const { innerSuite } = CONTROL_TYPES

function getShowKey(config) {
  if(!config) return "";
  const { children, showAlias, enableHide } = config;
  let key = "show";
  if((enableHide || children) && showAlias) {
    key = showAlias
  };
  return key;
}
function transformValuePathMap({ config, keyChain, map, parentValuePath }) {
  const keyChainMap = function (cfg) {
    const { config = {}, keyChain, parentValuePath = [] } = cfg;
    const lastKeyChain = keyChain[keyChain.length - 1];
    const valuePath = isString(config.valuePath) ? config.valuePath: isString(config.dataKey) ? config.dataKey: "";
    return valuePath ? valuePath.split("."): [].concat([...parentValuePath, [lastKeyChain]])
  }({ config: config, keyChain: keyChain, parentValuePath: parentValuePath });

  map[keyChain.join(".")] = keyChainMap;
  let { type, children } = config;
  const _type = isString(type) ? type.toLowerCase(): "";
  if(children || innerSuite.includes(_type)) {
    if(innerSuite.includes(_type)) {
      children = getSuites(config).children;
    }

    const showKey = getShowKey(config);
    if(!children[showKey]) {
      children = Object.assign(defineProperty({}, showKey, {}), children);
    }

    Object.keys(children).forEach(item => {
      transformValuePathMap({
        config: children[item],
        keyChain: [].concat([...keyChain], [item]),
        map: map,
        parentValuePath: keyChainMap
      })
    })


  }
}
function getValuePathMap(config) {
  const obj = {};
  if(isObject(config)) {
    Object.keys(config).forEach(item => {
      transformValuePathMap({
        config: config[item],
        keyChain: [item],
        map: obj
      })
    });
    return obj;
  }
  return obj
}

function getValuePath({ keyChain, valuePathMap }) {
  if(Array.isArray(keyChain)) {
    let valuePath = void 0;
    const index = keyChain.findIndex(item => isNumber(+item) && !isNaN(+item));
    if(index > 0) {
      const head = keyChain.slice(0, index);
      const last = keyChain.slice(index, keyChain.length);
      valuePath = valuePathMap[head.join(".")];
      if(!valuePath) {
        valuePath = head
      }
      valuePath = [...valuePath, ...last];
    } else {
      valuePath = valuePathMap[keyChain.join(".")];
      if(!valuePath) {
        valuePath = keyChain
      }
    }
    return valuePath;
  }
}

export {
  getShowKey,
  getValuePathMap,
  getValuePath
}

