(globalThis.webpackChunkmaps_desktop=globalThis.webpackChunkmaps_desktop||[]).push([[806],{8186:e=>{e.exports='<svg xmlns=http://www.w3.org/2000/svg x=0px y=0px width=52px height=52px viewBox="0 0 52 52" enable-background="new 0 0 52 52" xml:space=preserve> <path fill=#FFFFFF d="M26,2C12.7,2,2,12.7,2,26s10.7,24,24,24s24-10.7,24-24S39.3,2,26,2z M26,14.1c1.7,0,3,1.3,3,3s-1.3,3-3,3\r\n\ts-3-1.3-3-3S24.3,14.1,26,14.1z M31,35.1c0,0.5-0.4,0.9-1,0.9h-3c-0.4,0-3,0-3,0h-2c-0.5,0-1-0.3-1-0.9v-2c0-0.5,0.4-1.1,1-1.1l0,0\r\n\tc0.5,0,1-0.3,1-0.9v-4c0-0.5-0.4-1.1-1-1.1l0,0c-0.5,0-1-0.3-1-0.9v-2c0-0.5,0.4-1.1,1-1.1h6c0.5,0,1,0.5,1,1.1v8\r\n\tc0,0.5,0.4,0.9,1,0.9l0,0c0.5,0,1,0.5,1,1.1V35.1z"/> </svg> '},4318:(e,t,s)=>{"use strict";s.r(t),s.d(t,{default:()=>T});var o=s(4141),i=s(3294),a=s(3826),l=s(8050),n=s(8969);const r={top:"slds-nubbin_top",topLeft:"slds-nubbin_top-left",topRight:"slds-nubbin_top-right",bottom:"slds-nubbin_bottom",bottomLeft:"slds-nubbin_bottom-left",bottomRight:"slds-nubbin_bottom-right",left:"slds-nubbin_left",leftTop:"slds-nubbin_left-top",leftBottom:"slds-nubbin_left-bottom",right:"slds-nubbin_right",rightTop:"slds-nubbin_right-top",rightBottom:"slds-nubbin_right-bottom"},d={name:"MATooltip",components:{MAIconInline:n.Z},description:"Renders a SLDS-themed tooltip.",props:{inForm:{type:Boolean,default:!1},showIcon:{type:Boolean,default:!1},bindToParent:{type:Boolean,default:!1},bindTo:{type:[HTMLElement,Function],default:()=>{}},source:{type:[HTMLElement,Function],default:()=>{}},forceShow:{type:Boolean,default:!1},nubbinREM:{type:Number,default:1.8},renderDelay:{type:Number,default:0},helpLabel:{type:String,default:"Help"},noWrap:{type:Boolean,default:!1},nubbinPosition:{type:String,default:"bottom"}},data(){return{showEl:!1,container:null,el:null,bindToStored:this.bindTo,sourceStored:null,nubbin:r.bottom}},computed:{doShow(){return this.forceShow||this.showEl}},watch:{showEl(e){if(e){const e=this.bindToStored?this.bindToStored:this.$refs.icon,t=this.$refs.popover;this.renderDelay?setTimeout(this.detach.bind(this,e,t),this.renderDelay):this.detach(e,t)}else this.destroy()},source(e){this.sourceStored=e},sourceStored(e){if(this.bindToStored&&!e)throw new Error("If using a custom binding element for MATooltip, a source element must be provided.");e&&!this.bindToStored&&(this.bindToStored=e),e&&(e.addEventListener("mouseover",this.enter),e.addEventListener("mouseout",this.leave)),this.sourceStored=e},bindTo(e){this.bindToStored=e}},mounted(){this.bindToParent&&(this.bindToStored=this.$el.parentNode),this.bindTo&&(this.bindToStored="function"==typeof this.bindTo?this.bindTo():this.bindTo),this.source?this.sourceStored="function"==typeof this.source?this.source():this.source:this.sourceStored=this.showIcon?this.$refs.icon:this.$el.parentNode},beforeDestroy(){this.destroy(),this.sourceStored&&(this.sourceStored.removeEventListener("mouseover",this.enter),this.sourceStored.removeEventListener("mouseout",this.leave))},methods:{enter(){this.showEl=!0},leave(e){const t=e.toElement||e.relatedTarget;this.sourceStored&&this.sourceStored.contains(t)||this.el===t||this.el&&this.el.contains(t)?e.stopPropagation():this.showEl=!1},overPopup(e){e.stopPropagation()},outPopup(e){const t=e.toElement||e.relatedTarget;this.sourceStored&&this.sourceStored.contains(t)||this.el===t||this.el&&this.el.contains(t)?e.stopPropagation():this.showEl=!1},detach(e,t){this.container=document.createElement("div"),this.container.className=`slds-scope ${this.$el.className}`,this.$el.getAttributeNames().forEach((e=>{e.startsWith("data-v")&&this.container.setAttribute(e,this.$el.getAttribute(e))})),this.el=t.cloneNode(!0),this.el.style.display="block",this.el.addEventListener("mouseleave",this.outPopup),this.el.addEventListener("mouseenter",this.overPopup),this.container.appendChild(this.el),document.body.appendChild(this.container),this.setPosition(e)},setPosition(e){const t=this.el.scrollHeight,s=this.el.clientWidth,o=Math.ceil(this.nubbinREM*parseFloat(getComputedStyle(this.el).fontSize)),i=parseFloat(window.getComputedStyle(this.el,":before").width),a=Math.floor(Math.sqrt(2*Math.pow(i,2))/2),l=Math.ceil(Math.sqrt(2*Math.pow(i,2))/2),n=window.pageYOffset,d=window.pageXOffset,c=document.documentElement.clientWidth,h=this.getParentRect(e),u=h.left+h.width/2-1;let p=u-s/2+d,m=h.top-t-1+n;const b=void 0!==r[this.nubbinPosition]?r[this.nubbinPosition]:this.nubbin;let _=this.nubbinPosition;b===r.bottom&&m-n<0&&(_="top"),u+o>=c?(_="right",m-n<0&&(_="rightTop")):u+s/2>c||"bottomRight"===this.nubbinPosition?(_="bottomRight",m-n<0&&(_="topRight")):u-o<=0?(_="left",m-n<0&&(_="leftTop")):u-s/2<0&&(_="bottomLeft",m-n<0&&(_="topLeft")),"top"===_?m=h.bottom+n+a:"topLeft"===_?(m=h.bottom+n+a,p=u-o+d):"topRight"===_?(m=h.bottom+n+a,p=u-s+o+d):"rightTop"===_?(m=h.top+n+h.height/2-o,p=h.left-s-l+d):"leftTop"===_?(m=h.top+n+h.height/2-o,p=h.right+a+d):"right"===_?(m=h.top+h.height/2-this.el.clientHeight/2+n,p=h.left-s-l+d):"bottomRight"===_?(m=h.top-t-1+n,p=u-s+o+d):"left"===_?(p=h.right+a+d,m=h.top+(h.height/2-1)-this.el.clientHeight/2+n):"bottomLeft"===_?(p=u-o+d,m=h.top-t-1+n):"bottom"===_&&(p=u-s/2+d,m=h.top-t-1+n),r[_]!==this.nubbin&&(this.$refs.popover.classList.remove(this.nubbin),this.$refs.popover.classList.add(r[_])),this.el.style.left=`${p}px`,this.el.style.top=`${m}px`},getParentRect(e){const t=e.getBoundingClientRect(),s=e.currentStyle||window.getComputedStyle(e);let o=parseFloat(s.marginLeft)+parseFloat(s.marginRight);o+=parseFloat(s.paddingLeft)+parseFloat(s.paddingRight),o+=parseFloat(s.borderLeftWidth)+parseFloat(s.borderRightWidth);let i=parseFloat(s.marginTop)+parseFloat(s.marginBottom);return i+=parseFloat(s.paddingTop)+parseFloat(s.paddingBottom),i+=parseFloat(s.borderTopWidth)+parseFloat(s.borderBottomWidth),{top:t.top-i,right:t.right+o,bottom:t.bottom+i,left:t.left-o,width:t.width+o,height:t.height+i}},destroy(){this.el&&(this.el.removeEventListener("mouseleave",this.outPopup),this.el.removeEventListener("mouseenter",this.overPopup),this.el.remove()),this.container&&this.container.remove(),this.el=null,this.container=null,this.nubbin=r.bottom}}};var c=s(1900);const h={name:"MACheckbox",components:{MATooltip:(0,c.Z)(d,(function(){var e=this,t=e.$createElement,o=e._self._c||t;return o("div",{class:{"slds-show_inline-block":e.inForm},on:{mouseenter:e.enter,mouseleave:e.leave}},[e.showIcon?o("div",{ref:"icon",class:{"slds-form-element__icon":e.inForm}},[e._t("icon",(function(){return[o("button",{staticClass:"slds-button slds-button_icon",attrs:{"aria-describedby":"help"}},[o("MAIconInline",{staticClass:"slds-icon_container slds-icon-utility-info",attrs:{svg:s(8186),iconClass:["slds-icon","slds-icon","slds-icon_xx-small","slds-icon-text-default"],assistiveText:e.helpLabel}})],1)]}))],2):e._e(),e._v(" "),o("div",{ref:"popover",staticClass:"slds-popover slds-popover_tooltip",class:[e.nubbin],attrs:{role:"tooltip"}},[o("div",{staticClass:"slds-popover__body",class:{"ma-tooltip-nowrap":e.noWrap}},[e._t("content",(function(){return[e._v("default content")]}))],2)])])}),[],!1,null,"2938d120",null).exports},mixins:[a.Z],props:{value:{type:Boolean,required:!0},title:{type:String,required:!1,default:""},isDisabled:{type:Boolean,default:!1},showStateLabels:{type:Boolean,default:!1},stateLabelOn:{type:String,default:"Enabled"},stateLabelOff:{type:String,default:"Disabled"},toggleBuffer:{type:Number,default:0},noSlide:{type:Boolean,default:!1},isFormElement:{type:Boolean,default:!1},tooltipHelpText:{type:String,default:""}},data:()=>({lastToggleHandlerTimestamp:Date.now(),checkboxId:(0,l.x$)()}),computed:{checkboxClass(){return this.noSlide?"slds-form-element__control":"slds-checkbox_toggle slds-grid"}},watch:{value(){this.$refs.checkbox.checked=this.value}},mounted(){this.$refs.checkbox.checked=this.value},methods:{toggle(e){(e.clientX||e.clientY)&&(e.currentTarget.checked&&this.toggleBuffer&&(this.$refs.checkbox.disabled=!0,setTimeout((()=>{this.$refs.checkbox.disabled=!1}),this.toggleBuffer)),this.$emit("input",!this.value))}}},u=(0,c.Z)(h,(function(){var e=this,t=e.$createElement,s=e._self._c||t;return s("div",{staticClass:"slds-form-element"},[e.noSlide?e.isFormElement?[s("label",{staticClass:"slds-form-element__label",class:{"slds-p-right_none":e.tooltipHelpText},attrs:{for:e.checkboxId}},[e._v(e._s(e.decodeHtml(e.title)))]),e._v(" "),e.tooltipHelpText?s("MATooltip",{attrs:{showIcon:"",inForm:""}},[s("span",{attrs:{slot:"content"},slot:"content"},[e._v("\n                "+e._s(e.tooltipHelpText)+"\n            ")])]):e._e(),e._v(" "),s("div",{staticClass:"slds-form-element__control"},[s("span",{staticClass:"slds-checkbox slds-checkbox_standalone"},[s("input",{ref:"checkbox",attrs:{id:e.checkboxId,disabled:e.isDisabled,type:"checkbox"},domProps:{checked:e.value||!1},on:{click:e.toggle}}),e._v(" "),s("span",{staticClass:"slds-checkbox_faux"})])])]:s("div",{staticClass:"slds-form-element__control"},[s("div",{staticClass:"slds-checkbox"},[s("input",{ref:"checkbox",attrs:{id:e.checkboxId,disabled:e.isDisabled,type:"checkbox"},domProps:{checked:e.value||!1},on:{click:e.toggle}}),e._v(" "),s("label",{staticClass:"slds-checkbox__label",attrs:{for:e.checkboxId}},[s("span",{staticClass:"slds-checkbox_faux"}),e._v(" "),s("span",{staticClass:"slds-form-element__label",class:{"slds-p-right_none":e.tooltipHelpText}},[e._v("\n                    "+e._s(e.decodeHtml(e.title))+"\n                ")])]),e._v(" "),e.tooltipHelpText?s("MATooltip",{attrs:{showIcon:"",inForm:""}},[s("span",{attrs:{slot:"content"},slot:"content"},[e._v("\n                    "+e._s(e.tooltipHelpText)+"\n                ")])]):e._e()],1)]):s("label",{class:e.checkboxClass},[s("input",{ref:"checkbox",attrs:{disabled:e.isDisabled,type:"checkbox"},domProps:{checked:e.value||!1},on:{click:e.toggle}}),e._v(" "),s("span",{staticClass:"slds-checkbox_faux_container"},[s("span",{staticClass:"slds-checkbox_faux"}),e._v(" "),e.showStateLabels?s("span",{staticClass:"slds-checkbox_on"},[e._v(e._s(e.decodeHtml(e.stateLabelOn)))]):e._e(),e._v(" "),e.showStateLabels?s("span",{staticClass:"slds-checkbox_off"},[e._v(e._s(e.decodeHtml(e.stateLabelOff)))]):e._e()]),e._v(" "),s("span",{staticClass:"slds-form-element__label slds-m-bottom_none slds-p-left_x-small slds-p-top_xx-small"},[s("span",[e._v(e._s(e.decodeHtml(e.title)))])]),e._v(" "),e._t("tooltip")],2)],2)}),[],!1,null,"7880ee54",null).exports;var p=s(675),m=s(1023),b=s(379),_=s(5908),f=s(3589),v=s(7579),g=s(9159);const{moment:x}=window,S={components:{MAModal:o.Z,MobileSelect:v.Z,MASpinner:p.Z,MAInput:i.Z,MACheckbox:u,DateSelectionModal:()=>({...(0,f.Z)(),component:s.e(9822).then(s.bind(s,314)),error:g.Z})},props:{isGuideRoute:{type:Boolean,default:!1}},data:()=>({name:"",isLoading:!1,timeOptions:[],timeBasedOptions:{Enabled:!1,Start:"9:00 am",End:"5:00 pm"},isTimeBased:!1,start:"9:00 am",end:"5:00 pm",date:null,dateString:"",showDateModal:!1,driveProfile:"driving"}),validations:{name:{required:b.C1}},computed:{...(0,_.mapGetters)("routes",{routes__route:"route",routes__record:"record",routes__driveProfiles:"driveProfiles",routes__travelMode:"travelMode"}),record(){return this.routes__record},driveOptions(){return[{label:this.$Labels.MA_DRIVING,value:"driving"},{label:this.$Labels.MA_WALKING,value:"walking"},{label:this.$Labels.MA_BICYCLING,value:"bicycling"}]}},created(){let e,t;this.name=this.record.Name,this.timeBasedOptions={...this.timeBasedOptions,...this.routes__route.timeBasedOptions},this.isTimeBased="timeBased"===this.$store.state.defaultSettings.routeType.value||this.timeBasedOptions.Enabled||!1,this.timeBasedOptions.Start&&(e=m.Z.approximateStartTime(x(this.timeBasedOptions.Start,"hh:mm a"))),this.timeBasedOptions.End&&(t=m.Z.approximateEndTime(x(this.timeBasedOptions.End,"hh:mm a"))),this.start=e||m.Z.getRoutingDefaultStartTime(!0)||"9:00 am",this.end=t||m.Z.getRoutingDefaultEndTime(!0)||"5:00 pm",this.driveProfile=this.routes__travelMode,this.parseDate(this.record.Date__c),this.buildTimeOptions(5)},methods:{...(0,_.mapMutations)("routes",{routes__updateRouteOptions:"updateRouteOptions",routes__updateRecord:"updateRecord",routes__updatePendingChanges:"updatePendingChanges",routes__updateDriveProfile:"updateDriveProfile"}),close(){this.isLoading||this.$emit("close")},toggleTimeBased(){this.isGuideRoute&&(window.MAToastMessages.showWarning({message:"Time Based Locked.",subMessage:"Time Based Settings are locked for Advanced Route Generated Routes.",closeButton:!0,timeOut:7e3,extendedTimeout:0}),this.isTimeBased=!0)},toggleDateModal(e){this.showDateModal=e},updateDriveProfile(){this.routes__updateDriveProfile(this.driveProfile)},setDate(e){this.date.set({date:e.get("date"),month:e.get("month"),year:e.get("year")}),this.dateString=this.date.format(this.$User.dateFormat.toUpperCase())},buildTimeOptions(e){e=e||30;const t=window.moment().startOf("day"),s=t.day();for(;t.day()===s;)this.timeOptions.push({id:t.format("h:mm a"),label:t.format("h:mm a")}),t.add(e,"m")},validateRequiredFields(){let e=!0;return""===this.name.trim()&&(window.MAToastMessages.showWarning({message:"Save Route Error",subMessage:"Please enter a valid name",timeOut:6e3}),e=!1),e},updateOptions(){if(this.validateRequiredFields()){const e={Name:this.name,Date__c:this.date.format("YYYY-MM-DD")},t={timeBasedOptions:{Start:this.start,End:this.end,Enabled:this.isTimeBased}};this.routes__updateRecord(e),this.routes__updateRouteOptions(t),this.routes__updatePendingChanges(!0),this.routes__updateDriveProfile(this.driveProfile),this.$bus.$emit("refreshRoute"),this.$emit("close")}},parseDate(e){const t=x.utc(e,"YYYY-MM-DD");this.date=t,this.dateString=t.format(this.$User.dateFormat.toUpperCase())}}},T=(0,c.Z)(S,(function(){var e=this,t=e.$createElement,s=e._self._c||t;return s("div",[s("MAModal",{directives:[{name:"show",rawName:"v-show",value:!e.showDateModal,expression:"!showDateModal"}],staticClass:"slds-modal-fullscreen-phone",attrs:{doDetach:!0,title:"Update "+e.$Labels.MA_Current_Route+" "+e.$Labels.MA_Info,closeLabel:e.$Labels.MA_Close},on:{close:e.close}},[s("div",{attrs:{slot:"content"},slot:"content"},[s("MASpinner",{directives:[{name:"show",rawName:"v-show",value:e.isLoading,expression:"isLoading"}]}),e._v(" "),s("MAInput",{attrs:{isRequired:!0,label:e.$Labels.MA_Name,requiredLabel:e.$Labels.MA_Required},model:{value:e.name,callback:function(t){e.name=t},expression:"name"}}),e._v(" "),s("div",{staticClass:"slds-form-element",on:{click:function(t){return e.toggleDateModal(!0)}}},[s("label",{staticClass:"slds-form-element__label",attrs:{for:"text-input-id-1"}},[s("abbr",{staticClass:"slds-required"},[e._v("*")]),e._v("\n                    "+e._s(e._f("decode")(e.$Labels.MA_Date))+"\n                ")]),e._v(" "),s("div",{staticClass:"slds-form-element__control slds-input-has-icon slds-input-has-icon_right"},[s("span",{staticClass:"slds-icon slds-input__icon slds-input__icon_right ma-icon ma-icon-event slds-icon-text-light"}),e._v(" "),s("input",{directives:[{name:"model",rawName:"v-model",value:e.dateString,expression:"dateString"}],staticClass:"slds-input mobile-date-input",attrs:{id:"text-input-id-1",type:"text",disabled:""},domProps:{value:e.dateString},on:{input:function(t){t.target.composing||(e.dateString=t.target.value)}}})])]),e._v(" "),s("MobileSelect",{attrs:{options:e.driveOptions,disabled:e.isGuideRoute||!e.$store.state.defaultSettings.defaultTransportationMode.overridable,doDetach:!0,isRequired:!0,hasNoneOption:!1,label:e.$Labels.Routes_Directions_Defaults,keyString:"value",valueString:"label"},on:{change:e.updateDriveProfile},model:{value:e.driveProfile,callback:function(t){e.driveProfile=t},expression:"driveProfile"}}),e._v(" "),e.isGuideRoute?s("div",{staticClass:"slds-m-left_x-small slds-form-element__help slds-grid slds-grid_vertical-align-end",staticStyle:{color:"#844800"}},[s("span",{staticClass:"slds-icon_container ma-icon ma-icon-warning slds-m-right_xx-small"}),e._v(" "),s("span",{staticClass:"Advanced Route-warning-text"},[e._v(e._s(e.$Labels.AdvRoute_Profiles_Warning))])]):e._e(),e._v(" "),s("div",{staticClass:"ma-form-control-wrap"},[s("MACheckbox",{staticClass:"slds-m-bottom_small",attrs:{isDisabled:!e.$store.state.defaultSettings.routeType.overridable,title:e._f("decode")(e.$Labels.MA_Time_Based_Route)},on:{change:e.toggleTimeBased},model:{value:e.isTimeBased,callback:function(t){e.isTimeBased=t},expression:"isTimeBased"}})],1),e._v(" "),e.isTimeBased?s("div",[s("MobileSelect",{attrs:{options:e.timeOptions,doDetach:!0,hasNoneOption:!1,isRequired:!0,label:e.$Labels.MA_Start+" "+e.$Labels.MA_Time,keyString:"id",valueString:"label"},model:{value:e.start,callback:function(t){e.start=t},expression:"start"}}),e._v(" "),s("MobileSelect",{attrs:{options:e.timeOptions,doDetach:!0,hasNoneOption:!1,isRequired:!0,label:e.$Labels.MA_End+" "+e.$Labels.MA_Time,keyString:"id",valueString:"label"},model:{value:e.end,callback:function(t){e.end=t},expression:"end"}})],1):e._e()],1),e._v(" "),s("div",{attrs:{slot:"footer"},slot:"footer"},[s("div",{staticClass:"float-right"},[s("button",{staticClass:"slds-button slds-button_neutral",on:{click:e.close}},[e._v("\n                    "+e._s(e._f("decode")(e.$Labels.MA_Cancel))+"\n                ")]),e._v(" "),s("button",{staticClass:"slds-button slds-button_brand",on:{click:e.updateOptions}},[e._v("\n                    "+e._s(e._f("decode")(e.$Labels.MA_Done))+"\n                ")])])])]),e._v(" "),e.showDateModal?s("DateSelectionModal",{attrs:{date:e.date},on:{close:function(t){return e.toggleDateModal(!1)},update:e.setDate}}):e._e()],1)}),[],!1,null,null,null).exports},3294:(e,t,s)=>{"use strict";s.d(t,{Z:()=>i});const o={name:"MAInput",mixins:[s(3826).Z],props:{value:{type:[String,Number],required:!0},isRequired:{type:Boolean,default:!1},useTextArea:{type:Boolean,default:!1},disableResize:{type:Boolean,default:!1},label:{type:String,default:""},errors:{type:Array,default:()=>[]},placeholder:{type:String,default:""},type:{type:String,default:"text"},isInvalid:{type:Boolean,default:!1},isDisabled:{type:Boolean,default:!1},hasFocus:{type:Boolean,default:!1},requiredLabel:{type:String,default:"Required"}},computed:{showLabel(){return this.label},hasErrors(){return this.errors&&this.errors.length},listeners(){return{...this.$listeners,input:e=>this.$emit("input",e.target.value)}}},watch:{hasFocus(e){e&&this.focus()}},mounted(){this.hasFocus&&this.focus()},methods:{focus(){this.$refs.input.focus(),this.$refs.input.select()}}},i=(0,s(1900).Z)(o,(function(){var e=this,t=e.$createElement,s=e._self._c||t;return s("div",{staticClass:"slds-form-element",class:{"slds-has-error":e.isInvalid}},[e.showLabel?s("label",{staticClass:"slds-form-element__label"},[e.isRequired?s("abbr",{staticClass:"slds-required",attrs:{title:e.requiredLabel}},[e._v("*")]):e._e(),e._v("\n        "+e._s(e.decodeHtml(e.label))+"\n        "),e._t("label")],2):e._e(),e._v(" "),s("div",{staticClass:"slds-form-element__control",staticStyle:{position:"relative"}},[e.useTextArea?s("textarea",e._g({staticClass:"slds-textarea",attrs:{disabled:e.isDisabled,placeholder:e.placeholder},domProps:{value:e.decodeHtml(e.value)}},e.listeners)):s("input",e._g({ref:"input",staticClass:"slds-input",attrs:{type:e.type,disabled:e.isDisabled,placeholder:e.placeholder},domProps:{value:e.decodeHtml(e.value)},on:{blur:function(t){return e.$emit("update:hasFocus",!1)}}},e.listeners)),e._v(" "),e._t("extendInput")],2),e._v(" "),e.isInvalid?s("div",{staticClass:"slds-form-element__help"},[e._t("errors")],2):e._e()])}),[],!1,null,"71386de2",null).exports}}]);