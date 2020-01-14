
import EventsEmitter from "./native/utils/events-emitter";
// 测试代码，输出Master，Slave里的日志
window.swanEvents = new EventsEmitter();
window.swanEvents.onMessage('TraceEvents', function (message) {
	console.log(message.params.eventName, message.params.data);
});

import Slave from '../../dist/box/slaves/index.js';
import Native from './native/index.js';
const native = new Native(window);
window.slave = new Slave(window, window.swanInterface, window.swanComponents);

function formatSearch(se) {
  if (typeof se !== "undefined") {
    se = se.substr(1);
    let arr = se.split("&"),
      obj = {},
      newarr = [];
		arr.forEach((item, index) => {
      newarr = item.split("=");
      if (typeof obj[newarr[0]] === "undefined") {
        obj[newarr[0]] = newarr[1];
      }
    });
    return obj;
  }
}
const searchData = formatSearch(window.location.search);
native.openSwanPage(searchData);