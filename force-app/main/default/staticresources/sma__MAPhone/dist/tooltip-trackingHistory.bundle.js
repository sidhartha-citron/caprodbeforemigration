webpackJsonp([30],{219:function(e,t,i){"use strict";t.__esModule=!0;var n=o(i(231)),a=o(i(234));function o(e){return e&&e.__esModule?e:{default:e}}t.default=function(){return function(e,t){if(Array.isArray(e))return e;if((0,n.default)(Object(e)))return function(e,t){var i=[],n=!0,o=!1,s=void 0;try{for(var r,l=(0,a.default)(e);!(n=(r=l.next()).done)&&(i.push(r.value),!t||i.length!==t);n=!0);}catch(e){o=!0,s=e}finally{try{!n&&l.return&&l.return()}finally{if(o)throw s}}return i}(e,t);throw new TypeError("Invalid attempt to destructure non-iterable instance")}}()},231:function(e,t,i){e.exports={default:i(232),__esModule:!0}},232:function(e,t,i){i(28),i(18),e.exports=i(233)},233:function(e,t,i){var n=i(36),a=i(3)("iterator"),o=i(19);e.exports=i(0).isIterable=function(e){var t=Object(e);return void 0!==t[a]||"@@iterator"in t||o.hasOwnProperty(n(t))}},234:function(e,t,i){e.exports={default:i(235),__esModule:!0}},235:function(e,t,i){i(28),i(18),e.exports=i(236)},236:function(e,t,i){var n=i(8),a=i(64);e.exports=i(0).getIterator=function(e){var t=a(e);if("function"!=typeof t)throw TypeError(e+" is not iterable!");return n(t.call(e))}},260:function(e,t,i){var n=i(13)(i(264),i(265),function(e){i(262)},null,null);e.exports=n.exports},262:function(e,t,i){var n=i(263);"string"==typeof n&&(n=[[e.i,n,""]]),n.locals&&(e.exports=n.locals);i(198)("324f9978",n,!0)},263:function(e,t,i){(e.exports=i(197)(void 0)).push([e.i,".slds-select{-moz-appearance:none;-webkit-appearance:none;appearance:none;padding-right:30px}.slds-select,.slds-select option{padding-left:12px}.select-icon{color:#706e6b;font-size:12px;line-height:1;position:absolute;top:11px;right:12px}",""])},264:function(e,t,i){"use strict";Object.defineProperty(t,"__esModule",{value:!0});var n=i(219),a=i.n(n);t.default={name:"MASelect",props:{label:{type:String,default:""},options:{type:Object|Array,required:!0},keyString:{type:String,default:"key"},valueString:{type:String,default:"value"},hasNoneOption:{type:Boolean,default:!0},value:{type:String|Number,default:""},default:{type:String|Number,default:""},isRequired:{type:Boolean,default:!1},isInvalid:{type:Boolean,default:!1},placeholder:{type:String,default:""},isMultiSelect:{type:Boolean,default:!1},disabled:{type:Boolean,default:!1}},data:function(){return{defaultValue:this.default}},computed:{showLabel:function(){return this.label}},watch:{value:function(){var e={};e[this.keyString]=this.value,e[this.valueString]=this.getSelectedValue(),this.$emit("change",e)}},methods:{decodeHtml:function(e){if(!e)return e;var t=window.document.createElement("textarea");return t.innerHTML=e,t.value},getKey:function(e){return"string"==typeof e||"number"==typeof e?e:e[this.keyString]},getValue:function(e){return"string"==typeof e||"number"==typeof e?e:e[this.valueString]},isSelected:function(e){var t=!1;return t=Array.isArray(this.value)?-1!==this.value.indexOf(this.getKey(e)):this.getKey(e)===this.value,t},change:function(e){e||(e=null);for(var t=[],i=0;i<e.length;i++){var n=e[i];t.push(n.value)}if(1===t.length){var o=t;t=a()(o,1)[0]}this.$emit("input",t)},getSelectedValue:function(){var e=this;if(!this.options||!this.options.length)return"";var t=this.options.find(function(t){return e.getKey(t)===e.value});return t?this.decodeHtml(this.getValue(t)):null},remove:function(){this.$emit("input",""),this.doHide()}}}},265:function(e,t){e.exports={render:function(){var e=this,t=e.$createElement,i=e._self._c||t;return i("div",{staticClass:"slds-form-element",class:{"slds-has-error":e.isInvalid}},[e.showLabel?i("label",{staticClass:"slds-form-element__label"},[e.isRequired?i("abbr",{staticClass:"slds-required",attrs:{title:"required"}},[e._v("*")]):e._e(),e._v("\n        "+e._s(e.decodeHtml(e.label))+"\n    ")]):e._e(),e._v(" "),i("div",{staticClass:"slds-is-relative"},[i("select",e._b({staticClass:"slds-select",staticStyle:{overflow:"auto"},attrs:{placeholder:e.placeholder,disabled:e.disabled},on:{change:function(t){return e.change(t.target.selectedOptions)}}},"select",{multiple:e.isMultiSelect},!1),[e.hasNoneOption?i("option",{attrs:{value:""}},[e._v("-- None --")]):e._e(),e._v(" "),e._l(e.options,function(t,n){return i("option",{key:n,domProps:{value:e.getKey(t),selected:e.isSelected(t)}},[e._v(e._s(e.getValue(t)))])})],2),e._v(" "),e._m(0)]),e._v(" "),e.isInvalid?i("div",{staticClass:"slds-form-element__help"},[e._t("errors",[e._v("This field is required.")])],2):e._e()])},staticRenderFns:[function(){var e=this.$createElement,t=this._self._c||e;return t("div",{staticClass:"select-icon"},[t("span",{staticClass:"ma-icon ma-icon-down"})])}]}},282:function(e,t,i){"use strict";Object.defineProperty(t,"__esModule",{value:!0});var n=function(){function e(e,t){for(var i=0;i<t.length;i++){var n=t[i];n.enumerable=n.enumerable||!1,n.configurable=!0,"value"in n&&(n.writable=!0),Object.defineProperty(e,n.key,n)}}return function(t,i,n){return i&&e(t.prototype,i),n&&e(t,n),t}}(),a=function(e){return e&&e.__esModule?e:{default:e}}(i(7));var o=window.MARemoting,s=function(){function e(){!function(e,t){if(!(e instanceof t))throw new TypeError("Cannot call a class as a function")}(this,e)}return n(e,null,[{key:"getLiveSummaryAndHistory",value:function(e){var t=this;return new Promise(function(i,n){(new a.default).setAction(o.MapAnythingIORequest).setErrorHandler(t.handleRemoteActionError.bind(t)).invoke([{method:"get",action:"devices/summary",subType:"live/client",version:"v5"},e],function(e){if(e.success)i(e);else try{var t=JSON.parse(e.errInfo).error.message;n(t)}catch(t){n(e)}},{escape:!1,buffer:!1})})}},{key:"handleRemoteActionError",value:function(e,t,i){e(new Error(i.message))}},{key:"sortByProperty",value:function(e,t){return e.sort(function(e,i){return e[t]<i[t]?-1:e[t]>i[t]?1:0}),e}},{key:"getLiveConfigs",value:function(e){return new Promise(function(t){var i={speedLimitUnits:"mph",speedLimitDurationTimeUnits:"Minutes",speedLimitDuration:null,speedLimit:250,configName:"MapAnything Default Configuration",configId:"ma_defaultConfig",allowedTimeUnits:"Minutes",allowedTime:6e4,allowedDistanceUnits:"feet",allowedDistance:7e5};(new a.default).setAction(o.getLiveConfigs).setErrorHandler(function(e){console.warn(e),t([i])}).invoke([e],function(e){var n=e.success,a=void 0!==n&&n,o=e.data,s=void 0===o?[]:o;if(a){var r=[];if("string"==typeof s)try{r=JSON.parse(s)}catch(e){r=[]}else Array.isArray(s)&&(r=s);r.length<1&&r.push(i),r.sort(function(e,t){return e.configName<t.configName?-1:e.configName>t.configName?1:0}),t(r)}else t([{speedLimitUnits:"mph",speedLimitDurationTimeUnits:"Minutes",speedLimitDuration:5,speedLimit:65,configName:"Teddy Summary Test",configId:"a3129000000AISqAAO",allowedTimeUnits:null,allowedTime:2,allowedDistanceUnits:"Feet",allowedDistance:15},{speedLimitUnits:"mph",speedLimitDurationTimeUnits:"Minutes",speedLimitDuration:1,speedLimit:5,configName:"All Live",configId:"a3129000000JSQOAA4",allowedTimeUnits:null,allowedTime:1,allowedDistanceUnits:null,allowedDistance:200}])},{escape:!1,buffer:!1})})}}]),e}();t.default=s},632:function(e,t,i){var n=i(13)(i(635),i(636),function(e){i(633)},null,null);e.exports=n.exports},633:function(e,t,i){var n=i(634);"string"==typeof n&&(n=[[e.i,n,""]]),n.locals&&(e.exports=n.locals);i(198)("6ffc6a8e",n,!0)},634:function(e,t,i){(e.exports=i(197)(void 0)).push([e.i,'.colorIsChecked:before{font-size:18px;color:#fff;line-height:28px;content:"\\E18F";font-family:ma-icons-2!important;font-style:normal!important;font-weight:400!important;font-variant:normal!important;text-transform:none!important;speak:none;-webkit-font-smoothing:antialiased}',""])},635:function(e,t,i){"use strict";Object.defineProperty(t,"__esModule",{value:!0});var n=i(14),a=i.n(n),o=i(35),s=(i.n(o),i(260)),r=i.n(s),l=i(39),c=i.n(l),u=i(282),d=i.n(u),f=window,m=f.moment,p=f.MASystem;t.default={components:{MobileSelect:r.a,DateSelectionModal:function(){return i.e(17).then(i.bind(null,283))}},data:function(){return{isLoading:!1,date:m().tz(this.$User.timezoneId),showDateModal:!1,startTime:"00:00",endTime:"23:59",liveConfigs:[],liveConfig:"",timeZoneList:[],timeZoneId:"",selectedColor:"#4986E7",colorOptions:["#4986E7","#000000","#A4BDFC","#46D6DB","#7AE7BF","#51B749","#FBD75B","#FFB878","#FF887C","#DC2127","#DBADFF","#E1E1E1"]}},computed:a()({},Object(o.mapGetters)("tooltip",{tooltip__queryMetaData:"queryMetaData",tooltip__record:"record"})),created:function(){this.buildView(),this.buildTimeZones(),this.dateString=this.date.format(this.$User.dateFormat.toUpperCase())},methods:a()({},Object(o.mapMutations)("mainNavBar",{mainNavBar__updateActiveTab:"updateActiveTab"}),{buildView:function(){var e=this;this.isLoading=!0;var t=this.tooltip__queryMetaData.id;d.a.getLiveConfigs(t).then(function(t){e.liveConfigs=t;try{e.liveConfig=t[0].configId}catch(e){}}).finally(function(){e.isLoading=!1})},buildTimeZones:function(){var e=window.getProperty(p,"Organization.timeZoneList",!1);this.timeZoneId=this.$User.timezoneId,Array.isArray(e)?this.timeZoneList=e:(this.timeZoneId="GMT",this.timeZoneList=[{label:"(GMT+00:00) Greenwich Mean Time (GMT)",value:"GMT"}])},setDate:function(e){this.date.set({date:e.get("date"),month:e.get("month"),year:e.get("year")}),this.dateString=this.date.format(this.$User.dateFormat.toUpperCase())},toggleDateModal:function(e){this.showDateModal=e},viewFullHistory:function(){var e=this,t=this.tooltip__record.device,i={component:"LiveTrackingLayer",type:"LiveTrackingLayer",nodetype:"liveTracking",name:this.tooltip__record.Name,selectedDeviceId:t.deviceId,record:this.tooltip__record,qid:c()(),layerId:this.tooltip__queryMetaData.id,liveLayerQid:this.tooltip__record.qid,startTime:this.startTime,endTime:this.endTime,date:this.date,timeZone:this.timeZoneId,config:this.liveConfigs.filter(function(t){return t.configId===e.liveConfig})[0],color:this.selectedColor,eventHistory:null,eventList:[]};this.$bus.$emit("hide-tooltip"),this.mainNavBar__updateActiveTab("layers"),this.$bus.$emit("update-layer-tab","tabLayersActive"),this.$bus.$emit("add-layer",i,function(){console.log("TODO: show layer after plot?")})}})}},636:function(e,t){e.exports={render:function(){var e=this,t=e.$createElement,i=e._self._c||t;return i("div",{staticClass:"ma-tab-content active"},[i("div",{staticClass:"liveTracking device-history-input slds-scope",staticStyle:{padding:"0 16px"}},[i("MobileSelect",{attrs:{options:e.liveConfigs,doDetach:!0,isRequired:!0,hasNoneOption:!1,label:e.$Labels.SUMMARY_CONFIGURATION,keyString:"configId",valueString:"configName"},model:{value:e.liveConfig,callback:function(t){e.liveConfig=t},expression:"liveConfig"}}),e._v(" "),i("div",{staticClass:"ma-form-control-wrap",on:{click:function(t){return e.toggleDateModal(!0)}}},[i("label",{staticClass:"ma-input-label"},[e._v(e._s(e.$Labels.MA_Date))]),e._v(" "),i("div",{staticClass:"ma-form-control icon-right"},[i("input",{directives:[{name:"model",rawName:"v-model",value:e.dateString,expression:"dateString"}],staticClass:"ma-datepicker live-input ma-input date-input",attrs:{type:"text",placeholder:"Select a date",disabled:""},domProps:{value:e.dateString},on:{input:function(t){t.target.composing||(e.dateString=t.target.value)}}}),e._v(" "),i("i",{staticClass:"ma-icon ma-icon-event icon-right"})])]),e._v(" "),i("div",{staticClass:"ma-form-control-wrap"},[i("label",{staticClass:"ma-input-label"},[e._v("Start Time")]),e._v(" "),i("div",{staticClass:"ma-form-control icon-right"},[i("input",{directives:[{name:"model",rawName:"v-model",value:e.startTime,expression:"startTime"}],staticClass:"live-starttime time-input ma-input live-starttime",attrs:{type:"time"},domProps:{value:e.startTime},on:{input:function(t){t.target.composing||(e.startTime=t.target.value)}}}),e._v(" "),i("i",{staticClass:"ma-icon ma-icon-clock icon-right"})])]),e._v(" "),i("div",{staticClass:"ma-form-control-wrap"},[i("label",{staticClass:"ma-input-label"},[e._v("End Time")]),e._v(" "),i("div",{staticClass:"ma-form-control icon-right"},[i("input",{directives:[{name:"model",rawName:"v-model",value:e.endTime,expression:"endTime"}],staticClass:"live-endtime time-input ma-input live-endtim",attrs:{type:"time"},domProps:{value:e.endTime},on:{input:function(t){t.target.composing||(e.endTime=t.target.value)}}}),e._v(" "),i("i",{staticClass:"ma-icon ma-icon-clock icon-right"})])]),e._v(" "),i("MobileSelect",{attrs:{options:e.timeZoneList,doDetach:!0,isRequired:!0,hasNoneOption:!1,label:e.$Labels.TIMEZONE,keyString:"value",valueString:"label"},model:{value:e.timeZoneId,callback:function(t){e.timeZoneId=t},expression:"timeZoneId"}}),e._v(" "),i("div",{staticClass:"ma-form-control-wrap"},[i("label",{staticClass:"ma-input-label"},[e._v("Pick a Color")]),e._v(" "),i("div",{staticClass:"ma-form-control"},[i("div",{staticClass:"tracking-history-content"},[i("div",{staticClass:"tracking-history-forms-full"},[i("div",{staticClass:"live-history-color"},e._l(e.colorOptions,function(t,n){return i("div",{key:n,staticStyle:{display:"inline-block"}},[i("input",{directives:[{name:"model",rawName:"v-model",value:e.selectedColor,expression:"selectedColor"}],staticClass:"liveColorInput",attrs:{id:"cor"+n,type:"radio",name:"colorChoice"},domProps:{value:t,checked:e._q(e.selectedColor,t)},on:{change:function(i){e.selectedColor=t}}}),e._v(" "),i("label",{staticClass:"liveColorOption",class:["cor"+(n+1),e.selectedColor===t?"colorIsChecked":""],attrs:{for:"cor"+n}})])}),0)])])])]),e._v(" "),i("div",{staticClass:"ma-form-control-wrap",staticStyle:{"margin-top":"28px"}},[i("div",{staticStyle:{"text-align":"center"}},[i("button",{staticClass:"actionbutton  ma-button ma-button--blue device-history-button live-button",attrs:{"data-action":"Track History"},on:{click:e.viewFullHistory}},[e._v("Track History")])])])],1),e._v(" "),e.showDateModal?i("DateSelectionModal",{attrs:{date:e.date},on:{close:function(t){return e.toggleDateModal(!1)},update:e.setDate}}):e._e()],1)},staticRenderFns:[]}}});