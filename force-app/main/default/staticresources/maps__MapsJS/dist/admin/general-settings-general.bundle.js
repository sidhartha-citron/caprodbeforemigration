(globalThis.webpackChunkmaps_desktop=globalThis.webpackChunkmaps_desktop||[]).push([[8587],{713:(s,e,t)=>{"use strict";t.d(e,{_:()=>o,a:()=>l});const o=(s,e)=>{if(s&&"object"==typeof s&&Array.isArray(e)){for(;e.length&&s;)s=s[e.shift()];return s}},l=(s,e="maps__")=>{try{const t=new Set(["marker","scatterMarker","clusterMarker","clusterGroup","workers","DeviceHistory","orderedPolyline","distanceLimitCircle","heatmapLayer"]);Object.entries(s).forEach((([o,a])=>{if(!t.has(o))if(o.startsWith(e)){const t=o.replace(e,"");s[t]=a,delete s[o],null!=s[t]&&"object"==typeof s[t]&&l(s[t],e)}else"object"==typeof a&&l(a,e)}))}catch(s){}return s}},8137:s=>{s.exports='<svg xmlns=http://www.w3.org/2000/svg x=0px y=0px width=52px height=52px viewBox="0 0 52 52" enable-background="new 0 0 52 52" xml:space=preserve> <path fill=#FFFFFF d="M31,25.4L44,12.3c0.6-0.6,0.6-1.5,0-2.1L42,8.1c-0.6-0.6-1.5-0.6-2.1,0L26.8,21.2c-0.4,0.4-1,0.4-1.4,0\r\n\tL12.3,8c-0.6-0.6-1.5-0.6-2.1,0l-2.1,2.1c-0.6,0.6-0.6,1.5,0,2.1l13.1,13.1c0.4,0.4,0.4,1,0,1.4L8,39.9c-0.6,0.6-0.6,1.5,0,2.1\r\n\tl2.1,2.1c0.6,0.6,1.5,0.6,2.1,0L25.3,31c0.4-0.4,1-0.4,1.4,0l13.1,13.1c0.6,0.6,1.5,0.6,2.1,0l2.1-2.1c0.6-0.6,0.6-1.5,0-2.1\r\n\tL31,26.8C30.6,26.4,30.6,25.8,31,25.4z"/> </svg> '},6725:(s,e,t)=>{"use strict";t.r(e),t.d(e,{default:()=>d});var o=t(713),l=t(675),a=t(5908);const i={components:{MAModal:t(4141).Z},data:()=>({}),methods:{close(){this.$emit("close",!1)},confirm(){this.$emit("confirm"),this.close()}}};var n=t(1900);const r=(0,n.Z)(i,(function(){var s=this,e=s.$createElement,t=s._self._c||e;return t("MAModal",{attrs:{doDetach:!0,title:"Maps"},on:{close:s.close}},[t("div",{attrs:{slot:"content"},slot:"content"},[s._v("\n        "+s._s(s.$Labels.MA_Are_You_Sure)+"\n    ")]),s._v(" "),t("div",{attrs:{slot:"footer"},slot:"footer"},[t("button",{staticClass:"slds-button slds-button_neutral",on:{click:s.close}},[s._v("\n            "+s._s(s.$Labels.MA_Cancel)+"\n        ")]),s._v(" "),t("button",{staticClass:"slds-button slds-button_brand",on:{click:s.confirm}},[s._v("\n            "+s._s(s.$Labels.MA_Yes)+"\n        ")])])])}),[],!1,null,null,null).exports,c={components:{MASpinner:l.Z,ConfirmModal:r},data:()=>({isLoading:!1,apiKey:"",liveKey:"",folderPermissions:!1,showProfileWithUser:!1,routingRoleSecurity:!1,debugLogsEnabled:!1,showConfirmModal:!1}),created(){this.getSettings()},methods:{...(0,a.mapActions)({settings__getSettings:"getSettings",settings__saveGeneralSettings:"saveGeneralSettings",settings__clearDebugLogs:"clearDebugLogs"}),processSettings(s){this.apiKey=(0,o._)(s,["APIKey","maps__Value__c"])||"",this.liveKey=(0,o._)(s,["LiveAPIKey","maps__Value__c"])||"",this.folderPermissions="true"===(0,o._)(s,["FolderPermissionsEnabled","maps__Value__c"]),this.showProfileWithUser="true"===(0,o._)(s,["ShowProfileWithUserEnabled","maps__Value__c"]),this.routingRoleSecurity="true"===(0,o._)(s,["RoutingRoleSecurity","maps__Value__c"]),this.debugLogsEnabled="true"===(0,o._)(s,["DebugLogsEnabled","maps__Value__c"])},getSettings(){this.isLoading=!0,this.settings__getSettings().then((s=>{this.processSettings(s)})).finally((()=>{this.isLoading=!1}))},saveGeneralSettings(){this.isLoading=!0;const s={APIKey:this.apiKey,LiveAPIKey:this.liveKey,FolderPermissionsEnabled:this.folderPermissions,ShowProfileWithUserEnabled:this.showProfileWithUser,RoutingRoleSecurity:this.routingRoleSecurity,DebugLogsEnabled:this.debugLogsEnabled};this.settings__saveGeneralSettings(s).then((()=>{this.showSuccessMessage()})).catch((s=>{console.warn(s),window.MAToastMessages.showError({message:"Unable to save settings.",subMessage:s.message,timeOut:7e3,closeButton:!0})})).finally((()=>{this.isLoading=!1}))},confirmDebugDeletion(){this.showConfirmModal=!0},showSuccessMessage(){window.MAToastMessages.showSuccess({message:this.$Labels.MA_Success})},clearDebugLogs(){this.isLoading=!0,this.settings__clearDebugLogs().then((()=>{this.showSuccessMessage()})).catch((s=>{window.MAToastMessages.showError({message:"Unable to save settings.",subMessage:s.message,timeOut:7e3,closeButton:!0})})).finally((()=>{this.isLoading=!1}))}}},d=(0,n.Z)(c,(function(){var s=this,e=s.$createElement,t=s._self._c||e;return t("div",[t("div",{attrs:{id:"TopTabs-General"}},[s.isLoading?t("MASpinner"):s._e(),s._v(" "),t("div",{staticClass:"slds-section slds-m-bottom_large slds-is-open"},[t("div",{staticClass:"slds-section__title slds-theme--shade"},[t("span",{staticClass:"section-header-title slds-p-horizontal--small slds-truncate"},[s._v(s._s(s.$Labels.MA_Enabled_Features))])]),s._v(" "),t("div",{staticClass:"slds-section__content section__content"},[t("div",{staticClass:"slds-has-flexi-truncate slds-p-horizontal_x-small"},[t("fieldset",{staticClass:"slds-form-element"},[t("div",{staticClass:"slds-form-element__control"},[t("span",{staticClass:"slds-checkbox"},[t("input",{directives:[{name:"model",rawName:"v-model",value:s.folderPermissions,expression:"folderPermissions"}],staticClass:"feature-folderpermissions",attrs:{id:"feature-folderpermissions",type:"checkbox",name:"options"},domProps:{checked:Array.isArray(s.folderPermissions)?s._i(s.folderPermissions,null)>-1:s.folderPermissions},on:{change:function(e){var t=s.folderPermissions,o=e.target,l=!!o.checked;if(Array.isArray(t)){var a=s._i(t,null);o.checked?a<0&&(s.folderPermissions=t.concat([null])):a>-1&&(s.folderPermissions=t.slice(0,a).concat(t.slice(a+1)))}else s.folderPermissions=l}}}),s._v(" "),t("label",{staticClass:"slds-checkbox__label",attrs:{for:"feature-folderpermissions"}},[t("span",{staticClass:"slds-checkbox_faux"}),s._v(" "),t("span",{staticClass:"slds-form-element__label"},[s._v(s._s(s.$Labels.MA_Folder_Permissions))])])]),s._v(" "),t("span",{staticClass:"slds-checkbox"},[t("input",{directives:[{name:"model",rawName:"v-model",value:s.showProfileWithUser,expression:"showProfileWithUser"}],staticClass:"feature-showprofilewithuser",attrs:{id:"feature-showprofilewithuser",type:"checkbox",name:"options"},domProps:{checked:Array.isArray(s.showProfileWithUser)?s._i(s.showProfileWithUser,null)>-1:s.showProfileWithUser},on:{change:function(e){var t=s.showProfileWithUser,o=e.target,l=!!o.checked;if(Array.isArray(t)){var a=s._i(t,null);o.checked?a<0&&(s.showProfileWithUser=t.concat([null])):a>-1&&(s.showProfileWithUser=t.slice(0,a).concat(t.slice(a+1)))}else s.showProfileWithUser=l}}}),s._v(" "),s._m(0)]),s._v(" "),t("span",{staticClass:"slds-checkbox"},[t("input",{directives:[{name:"model",rawName:"v-model",value:s.routingRoleSecurity,expression:"routingRoleSecurity"}],staticClass:"feature-routingrolesecurity",attrs:{id:"feature-routingrolesecurity",type:"checkbox",name:"options"},domProps:{checked:Array.isArray(s.routingRoleSecurity)?s._i(s.routingRoleSecurity,null)>-1:s.routingRoleSecurity},on:{change:function(e){var t=s.routingRoleSecurity,o=e.target,l=!!o.checked;if(Array.isArray(t)){var a=s._i(t,null);o.checked?a<0&&(s.routingRoleSecurity=t.concat([null])):a>-1&&(s.routingRoleSecurity=t.slice(0,a).concat(t.slice(a+1)))}else s.routingRoleSecurity=l}}}),s._v(" "),t("label",{staticClass:"slds-checkbox__label",attrs:{for:"feature-routingrolesecurity"}},[t("span",{staticClass:"slds-checkbox_faux"}),s._v(" "),t("span",{staticClass:"slds-form-element__label"},[s._v(s._s(s.$Labels.MA_Routing_Role_Security))])])]),s._v(" "),t("span",{staticClass:"slds-checkbox"},[t("input",{directives:[{name:"model",rawName:"v-model",value:s.debugLogsEnabled,expression:"debugLogsEnabled"}],staticClass:"feature-debuglogs",attrs:{id:"feature-debuglogs",type:"checkbox",name:"options"},domProps:{checked:Array.isArray(s.debugLogsEnabled)?s._i(s.debugLogsEnabled,null)>-1:s.debugLogsEnabled},on:{change:function(e){var t=s.debugLogsEnabled,o=e.target,l=!!o.checked;if(Array.isArray(t)){var a=s._i(t,null);o.checked?a<0&&(s.debugLogsEnabled=t.concat([null])):a>-1&&(s.debugLogsEnabled=t.slice(0,a).concat(t.slice(a+1)))}else s.debugLogsEnabled=l}}}),s._v(" "),t("label",{staticClass:"slds-checkbox__label",attrs:{for:"feature-debuglogs"}},[t("span",{staticClass:"slds-checkbox_faux"}),s._v(" "),t("span",{staticClass:"slds-form-element__label"},[s._v(s._s(s.$Labels.MA_Debug_Logs))])]),s._v(" "),t("span",{staticClass:"slds-text-body_small",staticStyle:{cursor:"pointer",color:"#2265BB"},attrs:{id:"ClearDebugLogs"},on:{click:s.confirmDebugDeletion}},[s._v("\n                                    "+s._s(s.$Labels.MA_Clear)+"\n                                ")]),s._v(" "),t("img",{staticStyle:{height:"10px",display:"none"},attrs:{src:"{!URLFOR($Resource.MapsStyles, 'images/chatterstatus-loader.gif')}"}})])])])])])]),s._v(" "),t("div",{staticClass:"buttons"},[t("button",{staticClass:"slds-button slds-button_brand",attrs:{type:"button"},on:{click:s.saveGeneralSettings}},[s._v("\n                "+s._s(s.$Labels.MA_Save)+"\n            ")]),s._v(" "),t("span",{staticClass:"msgs",staticStyle:{color:"red","font-size":"10px",display:"none"}})])],1),s._v(" "),s.showConfirmModal?t("ConfirmModal",{on:{confirm:s.clearDebugLogs,close:function(e){s.showConfirmModal=!1}}}):s._e()],1)}),[function(){var s=this,e=s.$createElement,t=s._self._c||e;return t("label",{staticClass:"slds-checkbox__label",attrs:{for:"feature-showprofilewithuser"}},[t("span",{staticClass:"slds-checkbox_faux"}),s._v(" "),t("span",{staticClass:"slds-form-element__label"},[s._v("Display Profile Name with User Lookup (On Tooltips)")])])}],!1,null,null,null).exports},4141:(s,e,t)=>{"use strict";t.d(e,{Z:()=>i});var o=t(675),l=t(8969);const a={name:"MAModal",components:{MASpinner:o.Z,MAIconInline:l.Z},props:{title:{type:String,required:!0},doDetach:{type:Boolean,default:!1},isLoading:{type:Boolean,default:!1},isLarge:{type:Boolean,default:!1},closeLabel:{type:String,default:"Close"},isSmall:{type:Boolean,default:!1},hideCloseButton:{type:Boolean,default:!1},isBodyless:{type:Boolean,default:!1},isPrompt:{type:Boolean,default:!1}},data:()=>({supressScrollEmitter:!1,container:null}),mounted(){this.doDetach&&this.detach(),this.$emit("mounted"),setTimeout((()=>{this.$refs.backdrop.classList.add("slds-backdrop_open")}),1),setTimeout((()=>{this.$refs.section.classList.add("slds-fade-in-open")}),250)},beforeDestroy(){this.container&&(this.container.remove(),this.container=null)},methods:{detach(){this.container=document.createElement("div"),this.container.className=`slds-scope ${this.$el.className}`,this.container.appendChild(this.$el),document.body.appendChild(this.container)},modalClass(){return{"slds-modal_small":this.isSmall,"slds-modal_large":this.isLarge,"slds-modal_prompt":this.isPrompt}}}},i=(0,t(1900).Z)(a,(function(){var s=this,e=s.$createElement,o=s._self._c||e;return o("div",[o("section",{ref:"section",staticClass:"slds-modal",class:s.modalClass(),attrs:{role:"dialog",tabindex:"-1"}},[o("div",{staticClass:"slds-modal__container"},[o("header",{staticClass:"slds-modal__header",class:{"slds-theme_alert-texture slds-theme_error":s.isPrompt}},[s.hideCloseButton?s._e():o("button",{staticClass:"slds-button slds-button_icon slds-modal__close slds-button_icon-inverse",attrs:{title:s.closeLabel},on:{click:function(e){return s.$emit("close")}}},[o("MAIconInline",{attrs:{svg:t(8137),iconClass:["slds-button__icon","slds-button__icon--large"]}}),s._v(" "),o("span",{staticClass:"slds-assistive-text"},[s._v(s._s(s.closeLabel))])],1),s._v(" "),o("h2",{staticClass:"slds-text-heading_medium slds-hyphenate",attrs:{id:"modal-heading-01"}},[s._v("\n                    "+s._s(s.title)+"\n                ")]),s._v(" "),s._t("tagline")],2),s._v(" "),s.isBodyless?s._e():o("div",{ref:"content",staticClass:"slds-modal__content slds-p-around_medium slds-is-relative"},[s.isLoading?o("MASpinner"):s._e(),s._v(" "),s._t("content",(function(){return[s._v("default content")]}))],2),s._v(" "),s.isLoading?s._e():o("footer",{staticClass:"slds-modal__footer",class:{"ma-footer-bodyless":s.isBodyless}},[s._t("footer",(function(){return[s._v("default footer")]}))],2)])]),s._v(" "),o("div",{ref:"backdrop",staticClass:"slds-backdrop"})])}),[],!1,null,"44928138",null).exports}}]);