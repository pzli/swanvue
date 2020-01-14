/**
 * @file 事件相关属性以事件相关方法集合
 * @author zengqingzhuang(zengqingzhuang@baidu.com)
 */

const datasetFilter = raw => {
  let dataset = {};
  for (let d in raw) {
      if (/data/g.exec(d)) {
          let afrKey = d.replace(/^data([\w\d])/, (all, alpha) => alpha.toLowerCase());
          dataset[afrKey] = raw[d];
      }
  }
  return dataset;
};

const sanComponentWalker = target => {
  if (target.sanComponent || target.tagName.toLowerCase() === 'body') {
      return target.sanComponent || {};
  }
  return sanComponentWalker(target.parentNode);
};

// 获取默认绑定的事件集合
const normalEventList = [
    'touchstart', 'touchmove',
    'touchend', 'touchcancel',
    'tapevent', 'longtapevent'
];

// 用户绑定的H5手势事件集合
const customEventList = [
    'bindtouchstart', 'bindtouchmove',
    'bindtouchend', 'bindtouchcancel',
    'bindtap', 'bindlongtap', 'bindlongpress',
    'capturebindtouchstart', 'capturebindtouchmove',
    'capturebindtouchend', 'capturebindtouchcancel',
    'capturebindtap', 'capturebindlongtap', 'capturebindlongpress'
];

// 客户端相关操作事件
const nativeBehaviorEventList = [
    'contextmenu'
];

export const eventProxyAnode = san => san.parseTemplate(`<a
    on-touchstart="onTouchStart($event, false)"
    on-touchstart="capture:onTouchStart($event, true)"
    on-touchmove="onTouchMove($event, false)"
    on-touchmove="capture:onTouchMove($event, true)"
    on-touchend="onTouchEnd($event, false)"
    on-touchend="capture:onTouchEnd($event, true)"
    on-touchcancel="onTouchcancel($event)"
    on-touchcancel="capture:onTouchcancel($event, true)"
    on-tapevent="onTapevent($event, false)"
    on-tapevent="capture:onTapevent($event, true)"
    on-longtapevent="onlongTapevent($event, false)"
    on-longtapevent="capture:onlongTapevent($event, true)"
    on-contextmenu="onContextmenu($event)"
></a>`);

const eventUtilsCache = {};

export const eventUtils = san => ({
    normalEvents: eventUtilsCache.normalEvents
    || (eventUtilsCache.normalEvents = eventProxyAnode(san).children[0].events
    .filter(event => normalEventList.includes(event.name))),
    nativeBehaviorEvents: eventUtilsCache.nativeBehaviorEvents
    || (eventUtilsCache.nativeBehaviorEvents = eventProxyAnode(san).children[0].events
    .filter(event => nativeBehaviorEventList.includes(event.name)))
});

/**
 * 判断用户是否绑定了事件
 *
 * @param {Object} [listeners] 绑定事件集合
 * @return {boolean} true监听事件，false不监听事件
 */
export const hasCustomEvent = listeners => {
    for (let eventName in listeners) {
        if (customEventList.includes(eventName)) {
            return true;
        }
    }
    return false;
};

/**
 * 获取并解析用户绑定的事件集合
 *
 * @param {Object} [listeners] 绑定事件集合
 * @return {Object} 事件对象
 */
export const getCustomEventMap = listeners => Object.keys(listeners)
.reduce((listenerMap, listenerName) => {
    const listener = listeners[listenerName][0];
    if (listener) {
        const exprValue = listener.declaration.expr.raw;
        const eventFuncName = /eventHappen\([^,]*,[^,]*,\s*'([^,]*)',[^)]*\)/g.exec(exprValue);
        if (eventFuncName) {
            listenerMap[listenerName] = eventFuncName[1];
        }
    }
    return listenerMap;
}, {});

/**
 * 默认事件对象处理
 * @param {Object} $event 原始event对象
 * @param {string} eventType event类型
 * @return {Object} 处理过的event对象
 */
const defaultEvent = ($event = {}, eventType) => {
    $event.type = eventType;
    return $event;
};

/**
 * 原生事件对象处理
 * @param {Object} $event 原始event对象
 * @param {string} eventType event类型
 * @return {Object} 处理过的event对象
 */
const exchangeDomEvent = ($event, eventType) => {
    // const eventSanTarget = sanComponentWalker($event.target);
    // const eventSanCurTarget = sanComponentWalker($event.currentTarget);
    const eventSanTarget = $event.target;
    const eventSanCurTarget = $event.currentTarget;
    const changedTouches = Array.prototype.slice.call($event.changedTouches || [])
    .map(touch => ({pageX: touch.pageX, pageY: touch.pageY, clientX: touch.clientX,
        clientY: touch.clientY, force: touch.force, identifier: touch.identifier,
        x: touch.x || null, y: touch.y || null}));
    const touches = Array.prototype.slice.call($event.touches || [])
    .map(touch => ({pageX: touch.pageX, pageY: touch.pageY, clientX: touch.clientX,
        clientY: touch.clientY, force: touch.force, identifier: touch.identifier,
        x: touch.x || null, y: touch.y || null}));
    const target = {
        id: eventSanTarget.id,
        offsetLeft: eventSanTarget.offsetLeft,
        offsetTop: eventSanTarget.offsetTop,
        // dataset: {...datasetFilter(eventSanTarget.data.raw)}
    };
    const currentTarget = {
        id: eventSanCurTarget.id,
        offsetLeft: eventSanCurTarget.offsetLeft,
        offsetTop: eventSanCurTarget.offsetTop,
        // dataset: {...datasetFilter(eventSanCurTarget.data.raw)}
    };
    const eventData = {
        target: target,
        currentTarget: currentTarget,
        changedTouches: changedTouches,
        touches: touches,
        timeStamp: parseInt($event.timeStamp, 10),
        type: eventType
    };
    if (eventType === 'tap' && changedTouches.length) {
        eventData.detail = {
            x: changedTouches[0].pageX,
            y: changedTouches[0].pageY
        };
    }
    return eventData;
};

/**
 * 用户自定义事件对象组装
 * @param {string} eventType 事件类型
 * @param {Object} $event 事件对象
 * @return {Object} 处理过的event对象
 */
export const eventProccesser = (eventType, $event) => {
    if ($event.target && $event.target.tagName) {
        return exchangeDomEvent($event, eventType);
    }
    return defaultEvent($event, eventType);
};