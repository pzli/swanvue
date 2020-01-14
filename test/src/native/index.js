import Slave from "../../../dist/box/slaves";
import EventsEmitter from './utils/events-emitter';
import Communicator from './utils/communication';
import Loader from './utils/loader';
import swanEvents from "../../../src/utils/swan-events";
import Page from './component/page';
import View from './component/view/index';
import Button from './component/button/index';

const noop = function () {};

export default class Native {
	constructor(context){
		// this.eventsEmitter = new EventsEmitter();
		this.mockSwanInterface(context);
		context.swanInterface.communicator = new Communicator(context.swanInterface)
		this.mockSwanComponents(context);
		this.mockTestutils(context);
		console.log('是否是逻辑层', context.isMaster)
		if(context.isMaster) {
			this.mockMasterOnMessage(context)
		}else {
			this.mockSlaveOnMessage(context)
		}


		var obj = {
			fun: function (message) {
				console.log(message);
			}
		};

		obj.fun('你好，测试');

		context.windowMap = []
	}

	/**
	 *
	 * @param url 小程序的下载地址，这里为了测试，仅仅是其目录的地址
	 */
	openSwanApp(url){
		window.appPath = url;

		this.loader = new Loader(url);

		// 加载app.json
		this.loader.loadJson('app')
			.then((text) => {
				console.log(`${url}/app.json loader success`, text);

				this.appInfo = JSON.parse(text);

				// 发送'appReady'事件
				window.testutils.clientActions.appReady(url, '1', this.appInfo.pages[0], JSON.stringify(this.appInfo));
			})
			.catch(console.error);
	}

	openSwanPage({slaveId, appPath, pagePath}){
		window.slaveId = slaveId;
		window.testutils.clientActions.dispatchEvent('PageReady', {
			initData: '',
			appPath,
			pagePath
		});
	}

	mockSwanInterface(context) {
		context.swanInterface = {
			swan:{
				request: noop
			},
			communicator: new EventsEmitter(),
			boxjs:{
				data:{
					get:function(){
						return {
							appid:123
						}
					}
				},
				log:noop,
				platform: {
					versionCompare: noop,
					boxVersion: noop
				}
			},

			bind:function(type, cb) {
				this.communicator.onMessage(type, cb);
				// document.addEventListener(type, cb, false);
				return this;
			},
			unbind:function(type, cb) {
				this.communicator.delHandler(type, cb);
				// document.removeEventListener(type, cb, false);
				return this;
			},
			invoke: function (type, ...args) {
				return this[type] && this[type](...args);
				// return new Promise.resolve().then(function (res) {
				//     return this[type] && this[type](...args);
				// });
			},
			navigateTo: function (params) {
				console.log('navigateTo: ', params);
				window.__swanRoute = params.url;
				window.usingComponents = [];
				return new Promise(function (resolve, reject) {
					const wvID = window.testutils.clientActions
						.createSlave(params.url);
					resolve({wvID});
					window.__swanRoute = params.url;
					window.usingComponents = [];

					// TODO 测试代码，之后要调整成require相应的Page对象
					if(wvID == 2 || wvID == 3) {
						window.require('2')
					}
					params.success && params.success({wvID});
				});
			},
			navigateBack: function (params) {
				console.log('navigateBack: ', params);
				return new Promise(function (resolve, reject) {
					// TODO
					window.testutils.clientActions
						.deleteSlave(params.delta);
					resolve();
					params.success && params.success();
				});
			},
			loadJs: function (params) {
				console.log('mock loadJs: ', params);
				window.addEventListener('message', function (e) {
					const data = e.data;
					if (data.type === 'slaveLoaded' && +data.slaveId === +params.eventObj.wvID) {
						console.log('mock listener slaveLoaded', data);
						params.success(data);
					}
				});
			},
			postMessage: function (slaveId, message) {
				console.log('Page postMessage', slaveId, message);
				if (slaveId === 'master') {
					window.opener.postMessage(message, '*');
				}
				else {
					window.windowMap[window.windowMap.length - 1].postMessage(message, '*');
				}
			},
			onMessage: function (callback) {
				console.log('swanInterface onMessage', this);
				this.bind('message', e => {
					console.log('swanInterface onMessage bind message', e);

					if (e.message) {
						let message = null;
						try {
							if (typeof e.message === 'object') {
								message = e.message;
							}
							else {
								message = JSON.parse(unescape(decodeURIComponent(e.message)));
							}
						} catch (event) {
							console.log(event);
						}
						callback && callback(message);
					}
				});
				return this;
			}
		};
	}

	mockSwanComponents(context) {
		context.swanComponents = {
			getContextOperators:noop,
			getComponentRecievers:noop,
			getComponents: function () {
				return {
					'super-page': Page,
					'se-view': View,
					'se-button': Button
				};
			},
			getBehaviorDecorators: function () {
				return function (behaviors, target) {
					return target;
				};
			}
		};
	}

	mockTestutils(context) {
		context.testutils = {
			clientActions: {
				dispatchEvent: function (type, params) {
					var event = {type: type};
					for (var i in params) {
						event[i] = params[i];
					}
					console.log('dispatchEvent', event)
					window.swanInterface.communicator.fireMessage(event);
				},
				dispatchMessage: function (message) {
					var event = {type: 'message'};
					event.message = message;
					// var event = new Event('message');
					// event.message = message;
					// document.dispatchEvent(event);
					console.log('clientActions dispatchEvent', event);
					window.swanInterface.communicator.fireMessage(event);
				},
				appReady: function (appPath, slaveId, pageUrl, appConfig) {
					console.log('mock appReady: ', slaveId, pageUrl);
					this.dispatchEvent('AppReady', {
						pageUrl: pageUrl,
						wvID: slaveId,
						appPath: appPath,
						appConfig: appConfig
					});
					// this.appShow();
				},
				appShow: function () {
					this.dispatchEvent('lifecycle', {
						lcType: 'onAppShow'
					});
				},
				appHide: function () {
					this.dispatchEvent('lifecycle', {
						lcType: 'onAppHide'
					});
				},
				wvID: 2,
				createSlave: function (url) {
					console.log('mock createSlave: ', url);
					const wvID = this.wvID++;

					context.slaveId = wvID;
					const openWindow = window.open(`http://localhost:9000/slave.html?slaveId=${wvID}&appPath=${context.appPath}&pagePath=${url}`)
					context.windowMap.push(openWindow)

					// 延迟创建
					// setTimeout(function () {
					// 	window.slaveId = wvID;
					// 	const slave = new Slave(window, window.swanInterface, window.swanComponents);
					// 	console.log('mock salve=', slave, window.afterSlaveFrameWork);

					// 	window.afterSlaveFrameWork && window.afterSlaveFrameWork();
					// 	global.pageRender && global.pageRender(template, [], []);
					// 	window.testutils.clientActions.bind('initData', function (e) {
					// 		window.testutils.clientActions.dispatchMessage(e);
					// 		setTimeout(function () {
					// 			window.afterSlave && window.afterSlave();
					// 		}, 1);
					// 	});
					// }, 1000);

					return wvID;
				},
				deleteSlave: function (delta = 1) {
					console.log('mock deleteSlave: ', delta);
					delta = Math.min(delta, context.windowMap.length)
					for(let i = context.windowMap.length - 1; i > context.windowMap.length - 1 - delta; i--) {
						context.windowMap[i].close();
					}
					context.windowMap = context.windowMap.slice(0, context.windowMap.length - delta);
					context.master.navigator.history.popHistory(delta)
				},
				bind: function (type, cb) {
					console.log('TODO need add code');
					window.swanInterface.communicator.onMessage('message', function (e) {
						var messageObj = e.message;
						if (typeof messageObj === 'string') {
							try {
								messageObj = JSON.parse(messageObj);
							}
							catch (e) {
								messageObj = e.message;
							}
						}
						console.log('bind ...', e);
						if (messageObj && messageObj.type && messageObj.type === type) {
							cb(messageObj);
						}
					});
				},
				sendMasterMessage: function (message) {
					message.slaveId = window.slaveId;
					window.opener.postMessage(message, '*');
					// window.testutils.clientActions.dispatchMessage(message);
				},
			}
		};
	}

	mockMasterOnMessage(context) {
		context.swanInterface.bind('AppReady', (event)=>{
			console.log('listener AppReady ', event);

			context.swanInterface.communicator.onMessage(`slaveLoaded${event.wvID}`, (e)=>{
				const openWindow = window.open(`http://localhost:9000/slave.html?slaveId=${event.wvID}&appPath=${context.appPath}&pagePath=${event.pageUrl}`)
				window.slaveId = event.wvID;
				window.windowMap.push(openWindow)
				// const slave = new Slave(window, window.swanInterface, window.swanComponents);
				context.testutils.clientActions.dispatchEvent('PageReady', {
					initData: '',
					appPath: context.appPath,
					pagePath: event.pageUrl
				});
			});
		});

		context.addEventListener('message', event => {
			const data = event.data;
			if(data.type == 'slaveAttached') {
				console.log('native listen slaveAttached send onShow event', data);
				context.testutils.clientActions.appShow();
				context.testutils.clientActions.dispatchEvent('lifecycle', {
					lcType: 'onShow',
					wvID: data.slaveId
				});
				// userPageInstance._onReady(getParams(query));
			}
			else if(data.type == 'event') {
				console.log('native listen event', data);
				// context.swanInterface.communicator.fireMessage()
				context.testutils.clientActions.dispatchEvent('event', data);
			}
		});
	}

	mockSlaveOnMessage(context) {
		context.addEventListener('message', event => {
			const data = event.data;
			if(+data.slaveId !== +window.slaveId) return;
			if(data.type == 'slaveAttached') {
				console.log('native listen slaveAttached send onShow event', data);
				context.testutils.clientActions.appShow();
				context.testutils.clientActions.dispatchEvent('lifecycle', {
					lcType: 'onShow',
					wvID: data.slaveId
				});
			}
			else if (data.type == 'initData' ) {
				console.log('mock listener initData', data);
				window.testutils.clientActions.dispatchEvent('initData', data)
			}
			else if (data.type == 'setData' ) {
				console.log('mock listener setData', data);
				window.testutils.clientActions.dispatchEvent('setData', data)
			}
		});
	}
}