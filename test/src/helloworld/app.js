window.define("2",
	function (t, e, n, o, a, i, s, c, r, u, d, l, g, w, f, h) {
		Page({
			data: {
				name: 'helloworldxxxxx',
			},
			onLoad: function (q) {
				p = []
				console.log("Lifecycle Page onLoad", q);
			},
			onReady: function () {
				console.log("Lifecycle Page onReady");
			},
			onShow: function () {
				console.log("Lifecycle Page onShow");
			},
			onHide: function () {
				console.log("Lifecycle Page onHide");
			},
			onUnload: function () {
				console.log("Lifecycle Page onUnload");
			},
			add: function(t) {
				console.log("Developer Event add")
				p.push("其他文字");
				this.setData({
					name: "helloworldxxxxx" + p.join(",")
				})
			},
			remove: function(t) {
				console.log("Developer Event remove")
				p.length > 0 && (p.pop(), this.setData({
					name: "helloworldxxxxx" + p.join(",")
				}))
			},
			navigateBack: function () {
				console.log("Developer Event navigateBack");
				swan.navigateBack({
					url: '/pages/component/index',
					delta: 1
				})
			}
		})
});

window.define("1",
	function(t, e, n, o, a, i, s, c, r, u, d, l, g, w, f, h) {
		var p = [];
		Page({
			data: {
				text: "这是一段文字.",
				name: "helloworld!!!"
			},
			onLoad: function (q) {
				console.log("Lifecycle Page onLoad", q);
			},
			onShow: function () {
				console.log("Lifecycle Page onShow");
				p = []
			},
			onReady: function () {
				console.log("Lifecycle Page onReady");
			},
			onHide: function () {
				console.log("Lifecycle Page onHide");
			},
			onUnload: function () {
				console.log("Lifecycle Page onUnload");
			},
			add: function(t) {
				console.log("Developer Event add")
				p.push("其他文字");
				this.setData({
					text: "这是一段文字." + p.join(",")
				})
			},
			remove: function(t) {
				console.log("Developer Event remove")
				p.length > 0 && (p.pop(), this.setData({
					text: "这是一段文字." + p.join(",")
				}))
			},
			navigateTo: function(t) {
				console.log("Developer Event navigateTo")
				swan.navigateTo({
					url: '/pages/component/index'
				})
			},
		})
});

window.define("193",
	function(t, e, n, o, a, i, s, c, r, u, d, l, g, w, f, h) {
		App({
			onLaunch: function(t) {
				console.log("Lifecycle App onLaunch")
			},
			onShow: function(t) {
				console.log("Lifecycle App onShow")
			}
		})
});

window.__swanRoute = "app";
window.usingComponents = [];
require("193");

// window.__swanRoute = "page/component/index";
// window.usingComponents = [];
// require("130");

window.__swanRoute = "pages/text/text";
window.usingComponents = [];
require("1");
