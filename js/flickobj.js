var FlickElement = function(elem){
	var own = this;
	this.element;
	this.touching = false;
	this.mode = "";
	this.x = 0;
	this.y = 0;
	this.flickDistance = 0.5;
	this.callbacks = {
		"up" : null,
		"down" : null,
		"left" : null,
		"right" : null
	};
	this.calculatePosition = function (eventtype,event,target,opt) {
		var pos = {"x" : 0, "y" : 0};
		var bcrect = event.target.getBoundingClientRect();
		if (event.offsetX === undefined) {
			if (event.layerX === undefined) {
				if (event.type == eventtype) {
					pos.x = event.changedTouches[0].pageX - target.offsetLeft - opt.offset; // for Android
				} else {
					pos.x = event.pageX - target.offsetLeft - opt.offset;
				}
			}else{
				if (event.type == eventtype) {
					pos.x = event.changedTouches[0].pageX - target.offsetLeft - opt.offset + event.layerX - opt.canvasspace.w; // for Android
				}else{
					pos.x = event.layerX - opt.offset;
				}
			}
		} else {
			if (navigator.userAgent.indexOf("Firefox") > -1) {

				//pos.x = event.offsetX - opt.offset - event.target.offsetParent.offsetLeft - event.target.offsetParent.offsetParent.offsetLeft - event.target.offsetParent.clientLeft;
				pos.x = event.clientX - bcrect.x;
			}else{
				pos.x = event.offsetX - opt.offset;
			}
		}

		if (event.offsetY === undefined) {
			if (event.layerY === undefined) {
				if (event.type == eventtype) {
					pos.y = event.changedTouches[0].pageY - target.offsetTop - opt.offset; // for Android
				} else {
					pos.y = event.pageY - target.offsetTop - offset;
				}
			}else{
				if (event.type == eventtype) {
					pos.y = event.changedTouches[0].pageY - target.offsetTop - opt.offset + event.layerY - opt.canvasspace.h; // for Android
				}else{
					pos.y = event.layerY - opt.offset;
				}
			}
		} else {
			if (navigator.userAgent.indexOf("Firefox") > -1) {
				//pos.y = event.offsetY - opt.offset - event.target.offsetParent.clientTop - event.target.offsetParent.offsetTop - event.target.offsetParent.offsetParent.offsetTop;
				pos.y = event.clientY - bcrect.y;
			}else{
				pos.y = event.offsetY - opt.offset;
			}
		}
		return pos;
	}

	this._element_down = function(event){
		own.touching = true;
		var pos  = own.calculatePosition("touchstart",event,event.target,{
			"offset" : 0,
			"canvasspace":0
		});
		own.x = pos.x;
		own.y = pos.y;
	}
	this._element_move = function(event){
		if (own.touching) {
			var pos  = own.calculatePosition("touchstart",event,event.target,{
				"offset" : 0,
				"canvasspace":0
			});
			var saY = own.y - pos.y;
			var saX = own.x - pos.x;
			var whichMode = Math.abs(saX) - Math.abs(saY) > 0 ? "rl" : "tb";
			var rect = event.target.getBoundingClientRect();
			var ch = rect.height * own.flickDistance;
			var cw = rect.width * own.flickDistance;
			if (whichMode == "tb") {
				if (saY > ch) { //↑
					own.mode = "up";
				}else if ((saY < ch*-1) && ((saY * -1) > ch)) { //↓
					own.mode = "dw";
				}else{
					own.mode = "";
				}
			}else if (whichMode == "rl") {
				if (saX > cw) { //←
					own.mode = "left"; 
				}else if (saX < cw*-1){ //→
					own.mode = "right"; 
				}else{
					own.mode = "";
				}
			}
		}
	}
	this._element_leave = function(event){
		if (own.touching) {
			if (own.mode == "up") {
				if (own.callbacks.up) own.callbacks.up();
			}else if (own.mode == "dw") {
				if (own.callbacks.up) own.callbacks.down();
			}else if (own.mode == "left") {
				if (own.callbacks.up) own.callbacks.left();
			}else if (own.mode == "right") {
				if (own.callbacks.up) own.callbacks.right();
			}
			own.touching = false;
			own.mode = "";
		}
	}

	this.initialize = function(elem){
		own.element = elem;
		own.element.addEventListener("mousedown",own._element_down,false);
		own.element.addEventListener("mousemove",own._element_move,false);
		own.element.addEventListener("mouseup",own._element_leave,false);
		own.element.addEventListener("mouseleave",own._element_leave,false);
	}
	this.initialize(elem);
}