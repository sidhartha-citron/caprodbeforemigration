window.CoolClock=function(e,c,b,d,a){return this.init(e,c,b,d,a)};CoolClock.findAndCreateClocks=function(){var c=document.getElementsByTagName("canvas");for(var b=0;b<c.length;b++){var a=c[b].className.split(" ")[0].split(":");if(a[0]=="CoolClock"){new CoolClock(c[b].id,a[2],a[1],a[3]!="noSeconds",a[4])}}};CoolClock.addLoadEvent=function(a){var b=window.onload;if(typeof window.onload!="function"){window.onload=a}else{window.onload=function(){b();a()}}};CoolClock.config={clockTracker:{},tickDelay:1000,longTickDelay:15000,defaultRadius:38,renderRadius:100,defaultSkin:"swissRail",skins:{swissRail:{outerBorder:{lineWidth:1,radius:95,color:"black",alpha:1},smallIndicator:{lineWidth:2,startAt:89,endAt:93,color:"black",alpha:1},largeIndicator:{lineWidth:4,startAt:80,endAt:93,color:"black",alpha:1},hourHand:{lineWidth:8,startAt:-15,endAt:50,color:"black",alpha:1},minuteHand:{lineWidth:7,startAt:-15,endAt:75,color:"black",alpha:1},secondHand:{lineWidth:1,startAt:-20,endAt:85,color:"red",alpha:1},secondDecoration:{lineWidth:1,startAt:70,radius:4,fillColor:"red",color:"red",alpha:1}},bmcTime:{outerBorder:{lineWidth:0,radius:1,color:"red",alpha:1},smallIndicator:{lineWidth:2,startAt:5,endAt:8,color:"#98a7b1",alpha:1},largeIndicator:{lineWidth:0,startAt:0,endAt:0,color:"blue",alpha:1},hourHand:{lineWidth:7,startAt:-15,endAt:40,color:"#98a7b1",alpha:1},minuteHand:{lineWidth:6,startAt:-15,endAt:60,color:"#98a7b1",alpha:1},secondHand:{lineWidth:10,startAt:-2,endAt:3,color:"black",alpha:10},secondDecoration:{lineWidth:0,startAt:0,radius:5,fillColor:"black",color:"green",alpha:0.5}}}};CoolClock.prototype={init:function(e,c,b,d,a){this.canvasId=e;this.displayRadius=c||CoolClock.config.defaultRadius;this.skinId=b||CoolClock.config.defaultSkin;this.showSecondHand=typeof d=="boolean"?d:true;this.tickDelay=CoolClock.config[this.showSecondHand?"tickDelay":"longTickDelay"];this.canvas=document.getElementById(e);this.canvas.setAttribute("width",this.displayRadius*2);this.canvas.setAttribute("height",this.displayRadius*2);this.canvas.style.width=this.displayRadius*2+"px";this.canvas.style.height=this.displayRadius*2+"px";this.renderRadius=CoolClock.config.renderRadius;this.scale=this.displayRadius/this.renderRadius;this.ctx=this.canvas.getContext("2d");this.ctx.scale(this.scale,this.scale);this.gmtOffset=a;CoolClock.config.clockTracker[e]=this;this.tick();return this},fullCircle:function(a){this.fullCircleAt(this.renderRadius,this.renderRadius,a)},fullCircleAt:function(x,y,skin){with(this.ctx){save();globalAlpha=skin.alpha;lineWidth=skin.lineWidth;if(!document.all){beginPath()}if(document.all){lineWidth=lineWidth*this.scale}arc(x,y,skin.radius,0,2*Math.PI,false);if(document.all){arc(x,y,skin.radius,-0.1,0.1,false)}if(skin.fillColor){fillStyle=skin.fillColor;fill()}else{strokeStyle=skin.color;stroke()}restore()}},radialLineAtAngle:function(angleFraction,skin){with(this.ctx){save();translate(this.renderRadius,this.renderRadius);rotate(Math.PI*(2*angleFraction-0.5));globalAlpha=skin.alpha;strokeStyle=skin.color;lineWidth=skin.lineWidth;if(document.all){lineWidth=lineWidth*this.scale}if(skin.radius){this.fullCircleAt(skin.startAt,0,skin)}else{beginPath();moveTo(skin.startAt,0);lineTo(skin.endAt,0);stroke()}restore()}},render:function(a,c,d){var e=CoolClock.config.skins[this.skinId];this.ctx.clearRect(0,0,this.renderRadius*2,this.renderRadius*2);this.fullCircle(e.outerBorder);for(var b=0;b<60;b++){this.radialLineAtAngle(b/60,e[b%5?"smallIndicator":"largeIndicator"])}this.radialLineAtAngle((a+c/60)/12,e.hourHand);this.radialLineAtAngle((c+d/60)/60,e.minuteHand);if(this.showSecondHand){this.radialLineAtAngle(d/60,e.secondHand);if(!document.all){this.radialLineAtAngle(d/60,e.secondDecoration)}}},nextTick:function(){setTimeout("CoolClock.config.clockTracker['"+this.canvasId+"'].tick()",this.tickDelay)},stillHere:function(){return document.getElementById(this.canvasId)!=null},refreshDisplay:function(){var b=new Date();if(this.gmtOffset!=null){var d=this.gmtOffset.substring(1,3);d=d.replace(/^[0]+/g,"");var c=parseInt(d);c=c*60*60;mins=this.gmtOffset.substr(3);mins=parseInt(mins)*60;var e=(c+mins)*1000;if(this.gmtOffset.substring(0,1)=="-"){e=e*-1}if(isNaN(e)){e=0}var f=new Date(b.getUTCFullYear(),b.getUTCMonth(),b.getUTCDate(),b.getUTCHours(),b.getUTCMinutes(),b.getUTCSeconds(),b.getUTCMilliseconds());var a=new Date(f.valueOf()+e);this.render(a.getHours(),a.getMinutes(),a.getSeconds())}else{this.render(b.getHours(),b.getMinutes(),b.getSeconds())}},tick:function(){if(this.stillHere()){this.refreshDisplay();this.nextTick()}}};CoolClock.addLoadEvent(CoolClock.findAndCreateClocks);