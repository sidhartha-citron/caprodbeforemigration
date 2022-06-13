(globalThis.webpackChunkmaps_desktop=globalThis.webpackChunkmaps_desktop||[]).push([[9403],{8969:(e,t,s)=>{"use strict";s.d(t,{Z:()=>o});var l=s(3856);const o={render:e=>e("span"),props:{svg:{required:!0,validator(e){const t="string"==typeof e,s="object"==typeof e&&!0===e.__esModule;return t||s}},inheritFillFromParent:{type:Boolean,default:!0},assistiveText:{type:String},iconClass:{type:[Array,String]}},mounted(){const e="object"==typeof this.svg&&!0===this.svg.__esModule?this.svg.default:this.svg,t=document.createRange().createContextualFragment(e),s=Array.from(t.childNodes).find((e=>"svg"===e.nodeName));s?l.Z.call(this,s):console.error("Could not build SVG.")}}},3826:(e,t,s)=>{"use strict";s.d(t,{Z:()=>l});const l={methods:{decodeHtml(e){const t=document.createElement("textarea");return t.innerHTML=e,t.value}}}},8186:e=>{e.exports='<svg xmlns=http://www.w3.org/2000/svg x=0px y=0px width=52px height=52px viewBox="0 0 52 52" enable-background="new 0 0 52 52" xml:space=preserve> <path fill=#FFFFFF d="M26,2C12.7,2,2,12.7,2,26s10.7,24,24,24s24-10.7,24-24S39.3,2,26,2z M26,14.1c1.7,0,3,1.3,3,3s-1.3,3-3,3\r\n\ts-3-1.3-3-3S24.3,14.1,26,14.1z M31,35.1c0,0.5-0.4,0.9-1,0.9h-3c-0.4,0-3,0-3,0h-2c-0.5,0-1-0.3-1-0.9v-2c0-0.5,0.4-1.1,1-1.1l0,0\r\n\tc0.5,0,1-0.3,1-0.9v-4c0-0.5-0.4-1.1-1-1.1l0,0c-0.5,0-1-0.3-1-0.9v-2c0-0.5,0.4-1.1,1-1.1h6c0.5,0,1,0.5,1,1.1v8\r\n\tc0,0.5,0.4,0.9,1,0.9l0,0c0.5,0,1,0.5,1,1.1V35.1z"/> </svg> '},7220:(e,t,s)=>{"use strict";s.r(t),s.d(t,{default:()=>n});var l=s(1853),o=s(9756);const{MAToastMessages:a}=window,i={components:{MACheckbox:l.Z,MATooltip:o.Z},data:()=>({approvalSettings:{enabled:!1,publishPDF:!1,pdfAOnly:!1,exportCSV:!1,csvAOnly:!1,publishCSV:!1,pubcsvAOnly:!1,publishETM:!1,etmAOnly:!1,publishMaps:!1,mapAOnly:!1,publishObj:!1,oAOnly:!1,publishFSL:!1,fslAOnly:!1},publishOptions:{pdfOn:!1,etmOn:!1,fslOn:!1,csvOn:!1,pubcsvOn:!1,mapsOn:!1,objOn:!1},fslDisabled:!1}),async created(){await this.getApprovalSettings(),await this.getPublishSettings(),await this.checkFSL()},methods:{async checkFSL(){const{success:e}=await this.$remote("maps.TPRemoteActions.CheckForFSL");e?this.fslDisabled=!1:(this.fslDisabled=!0,this.approvalSettings.publishFSL=!1,this.approvalSettings.fslAOnly=!1,this.approvalSettings.fslOn=!1)},async getPublishSettings(){try{const{data:e,message:t,success:s}=await this.$remote("maps.TPRemoteActions.GetPublishOptionsSettings");s?this.publishOptions=JSON.parse(e.maps__Value__c):console.error(t)}catch(e){console.error(e)}},async getApprovalSettings(){try{const{data:e,message:t,success:s}=await this.$remote("maps.TPRemoteActions.GetAlignmentApprovalSettings");if(s){const t={enabled:!1,publishFSL:!1,publishMaps:!1,publishETM:!1,publishObj:!1,publishPDF:!1,publishCSV:!1,exportCSV:!1,...e.maps__Value__c?JSON.parse(e.maps__Value__c):{}},s={fslAOnly:!1,mapAOnly:!1,pdfAOnly:!1,csvAOnly:!1,pubcsvAOnly:!1,oAOnly:!1,etmAOnly:!1,...e.maps__Value2__c?JSON.parse(e.maps__Value2__c):{}};this.approvalSettings={...t,...s};const l=Object.keys(e.maps__Value__c?JSON.parse(e.maps__Value__c):{});l.includes("publishCSV")&&!l.includes("exportCSV")&&(this.approvalSettings.exportCSV=this.approvalSettings.publishCSV,this.approvalSettings.publishCSV=!1)}else console.error(t)}catch(e){console.error(e)}},async saveApprovalSettings(){try{const e={enabled:this.approvalSettings.enabled,publishPDF:this.approvalSettings.publishPDF,publishMaps:this.approvalSettings.publishMaps,publishETM:this.approvalSettings.publishETM,publishFSL:this.approvalSettings.publishFSL,publishObj:this.approvalSettings.publishObj,publishCSV:this.approvalSettings.publishCSV,exportCSV:this.approvalSettings.exportCSV},t={pdfAOnly:!!this.approvalSettings.enabled&&this.approvalSettings.pdfAOnly,csvAOnly:!!this.approvalSettings.enabled&&this.approvalSettings.csvAOnly,pubcsvAOnly:!!this.approvalSettings.enabled&&this.approvalSettings.pubcsvAOnly,etmAOnly:!!this.approvalSettings.enabled&&this.approvalSettings.etmAOnly,oAOnly:!!this.approvalSettings.enabled&&this.approvalSettings.oAOnly,mapAOnly:!!this.approvalSettings.enabled&&this.approvalSettings.mapAOnly,fslAOnly:!!this.approvalSettings.enabled&&this.approvalSettings.fslAOnly},{data:s,message:l,success:o}=await this.$remote("maps.TPRemoteActions.SaveAlignmentApprovalSettings",[JSON.stringify(e),JSON.stringify(t)]);if(o){const e=JSON.parse(s.maps__Value__c),t=JSON.parse(s.maps__Value2__c);this.approvalSettings={...e,...t},a.showSuccess({position:"toast-top-right",message:"Publish Settings Saved",timeOut:8e3})}else console.error(l)}catch(e){console.error(e)}},async savePublishSettings(){try{const{data:e,message:t,success:s}=await this.$remote("maps.TPRemoteActions.SavePublishOptionsSettings",[JSON.stringify(this.publishOptions)]);s?(this.publishOptions=JSON.parse(e.maps__Value__c),a.showSuccess({position:"toast-top-right",message:"Publish Settings Saved",timeOut:8e3})):console.error(t)}catch(e){console.error(e)}}}},n=(0,s(1900).Z)(i,(function(){var e=this,t=e.$createElement,s=e._self._c||t;return s("div",[s("div",{staticClass:"slds-grid slds-wrap"},[s("div",{staticClass:"slds-p-top_large slds-grid slds-grid--vertical slds-m-right_small slds-col slds-size_1-of-1 slds-large-size_1-of-4"},[s("label",{staticClass:"slds-item_label slds-text-color_weak slds-m-bottom_xx-small"},[e._v("Salesforce Maps")]),e._v(" "),s("MACheckbox",{attrs:{toggleBuffer:500,showStateLabels:""},on:{input:function(t){return e.savePublishSettings()}},model:{value:e.publishOptions.mapsOn,callback:function(t){e.$set(e.publishOptions,"mapsOn",t)},expression:"publishOptions.mapsOn"}}),e._v(" "),s("label",{staticClass:"slds-form-element__label slds-m-top_small"},[e._v("User Access Level")]),e._v(" "),s("select",{directives:[{name:"model",rawName:"v-model",value:e.approvalSettings.mapAOnly,expression:"approvalSettings.mapAOnly"}],staticClass:"slds-select",on:{change:[function(t){var s=Array.prototype.filter.call(t.target.options,(function(e){return e.selected})).map((function(e){return"_value"in e?e._value:e.value}));e.$set(e.approvalSettings,"mapAOnly",t.target.multiple?s:s[0])},function(t){return e.saveApprovalSettings()}]}},[s("option",{domProps:{value:!1}},[e._v("All Users")]),e._v(" "),e.approvalSettings.enabled?s("option",{domProps:{value:!0}},[e._v("\n                    Approvers Only\n                ")]):e._e()]),e._v(" "),e.approvalSettings.enabled?s("label",{staticClass:"slds-form-element__label slds-m-top_small"},[e._v("\n                Require Alignment Approval?\n            ")]):e._e(),e._v(" "),e.approvalSettings.enabled?s("select",{directives:[{name:"model",rawName:"v-model",value:e.approvalSettings.publishMaps,expression:"approvalSettings.publishMaps"}],staticClass:"slds-select",on:{change:[function(t){var s=Array.prototype.filter.call(t.target.options,(function(e){return e.selected})).map((function(e){return"_value"in e?e._value:e.value}));e.$set(e.approvalSettings,"publishMaps",t.target.multiple?s:s[0])},function(t){return e.saveApprovalSettings()}]}},[s("option",{domProps:{value:!0}},[e._v("Yes")]),e._v(" "),s("option",{domProps:{value:!1}},[e._v("No")])]):e._e()],1),e._v(" "),s("div",{staticClass:"slds-p-top_large slds-grid slds-grid--vertical slds-m-right_small slds-col slds-size_1-of-1 slds-large-size_1-of-4"},[s("label",{staticClass:"slds-item_label slds-text-color_weak slds-m-bottom_xx-small"},[e._v("Enterprise Territory Management")]),e._v(" "),s("MACheckbox",{attrs:{toggleBuffer:500,showStateLabels:""},on:{input:function(t){return e.savePublishSettings()}},model:{value:e.publishOptions.etmOn,callback:function(t){e.$set(e.publishOptions,"etmOn",t)},expression:"publishOptions.etmOn"}}),e._v(" "),s("label",{staticClass:"slds-form-element__label slds-m-top_small"},[e._v("User Access Level")]),e._v(" "),s("select",{directives:[{name:"model",rawName:"v-model",value:e.approvalSettings.etmAOnly,expression:"approvalSettings.etmAOnly"}],staticClass:"slds-select",on:{change:[function(t){var s=Array.prototype.filter.call(t.target.options,(function(e){return e.selected})).map((function(e){return"_value"in e?e._value:e.value}));e.$set(e.approvalSettings,"etmAOnly",t.target.multiple?s:s[0])},function(t){return e.saveApprovalSettings()}]}},[s("option",{domProps:{value:!1}},[e._v("All Users")]),e._v(" "),e.approvalSettings.enabled?s("option",{domProps:{value:!0}},[e._v("\n                    Approvers Only\n                ")]):e._e()]),e._v(" "),e.approvalSettings.enabled?s("label",{staticClass:"slds-form-element__label slds-m-top_small"},[e._v("\n                Require Alignment Approval?\n            ")]):e._e(),e._v(" "),e.approvalSettings.enabled?s("select",{directives:[{name:"model",rawName:"v-model",value:e.approvalSettings.publishETM,expression:"approvalSettings.publishETM"}],staticClass:"slds-select",on:{change:[function(t){var s=Array.prototype.filter.call(t.target.options,(function(e){return e.selected})).map((function(e){return"_value"in e?e._value:e.value}));e.$set(e.approvalSettings,"publishETM",t.target.multiple?s:s[0])},function(t){return e.saveApprovalSettings()}]}},[s("option",{domProps:{value:!0}},[e._v("Yes")]),e._v(" "),s("option",{domProps:{value:!1}},[e._v("No")])]):e._e()],1),e._v(" "),s("div",{staticClass:"slds-p-top_large slds-grid slds-grid--vertical slds-m-right_small slds-col slds-size_1-of-1 slds-large-size_1-of-4"},[s("div",{staticClass:"slds-grid"},[s("label",{staticClass:"slds-form-element__label slds-text-color_weak slds-m-bottom_xx-small"},[e._v("Field Service")]),e._v(" "),e.fslDisabled?s("div",{staticClass:"slds-form-element__icon"},[s("MATooltip",{attrs:{inForm:!1,showIcon:!0}},[s("div",{attrs:{slot:"content"},slot:"content"},[e._v("Field Service must be enabled to use this feature.")])])],1):e._e()]),e._v(" "),s("MACheckbox",{attrs:{isDisabled:e.fslDisabled,toggleBuffer:500,showStateLabels:""},on:{input:function(t){return e.savePublishSettings()}},model:{value:e.publishOptions.fslOn,callback:function(t){e.$set(e.publishOptions,"fslOn",t)},expression:"publishOptions.fslOn"}}),e._v(" "),s("label",{staticClass:"slds-form-element__label slds-m-top_small"},[e._v("User Access Level")]),e._v(" "),s("select",{directives:[{name:"model",rawName:"v-model",value:e.approvalSettings.fslAOnly,expression:"approvalSettings.fslAOnly"}],staticClass:"slds-select",attrs:{disabled:e.fslDisabled},on:{change:[function(t){var s=Array.prototype.filter.call(t.target.options,(function(e){return e.selected})).map((function(e){return"_value"in e?e._value:e.value}));e.$set(e.approvalSettings,"fslAOnly",t.target.multiple?s:s[0])},function(t){return e.saveApprovalSettings()}]}},[s("option",{domProps:{value:!1}},[e._v("All Users")]),e._v(" "),e.approvalSettings.enabled?s("option",{domProps:{value:!0}},[e._v("\n                    Approvers Only\n                ")]):e._e()]),e._v(" "),e.approvalSettings.enabled?s("label",{staticClass:"slds-form-element__label slds-m-top_small"},[e._v("\n                Require Alignment Approval?\n            ")]):e._e(),e._v(" "),e.approvalSettings.enabled?s("select",{directives:[{name:"model",rawName:"v-model",value:e.approvalSettings.publishFSL,expression:"approvalSettings.publishFSL"}],staticClass:"slds-select",attrs:{disabled:e.fslDisabled},on:{change:[function(t){var s=Array.prototype.filter.call(t.target.options,(function(e){return e.selected})).map((function(e){return"_value"in e?e._value:e.value}));e.$set(e.approvalSettings,"publishFSL",t.target.multiple?s:s[0])},function(t){return e.saveApprovalSettings()}]}},[s("option",{domProps:{value:!0}},[e._v("Yes")]),e._v(" "),s("option",{domProps:{value:!1}},[e._v("No")])]):e._e()],1),e._v(" "),s("div",{staticClass:"slds-p-top_large slds-grid slds-grid--vertical slds-m-right_small slds-col slds-size_1-of-1 slds-large-size_1-of-4"},[s("label",{staticClass:"slds-item_label slds-text-color_weak slds-m-bottom_xx-small"},[e._v("Salesforce Fields")]),e._v(" "),s("MACheckbox",{attrs:{toggleBuffer:500,showStateLabels:""},on:{input:function(t){return e.savePublishSettings()}},model:{value:e.publishOptions.objOn,callback:function(t){e.$set(e.publishOptions,"objOn",t)},expression:"publishOptions.objOn"}}),e._v(" "),s("label",{staticClass:"slds-form-element__label slds-m-top_small"},[e._v("User Access Level")]),e._v(" "),s("select",{directives:[{name:"model",rawName:"v-model",value:e.approvalSettings.oAOnly,expression:"approvalSettings.oAOnly"}],staticClass:"slds-select",on:{change:[function(t){var s=Array.prototype.filter.call(t.target.options,(function(e){return e.selected})).map((function(e){return"_value"in e?e._value:e.value}));e.$set(e.approvalSettings,"oAOnly",t.target.multiple?s:s[0])},function(t){return e.saveApprovalSettings()}]}},[s("option",{domProps:{value:!1}},[e._v("All Users")]),e._v(" "),e.approvalSettings.enabled?s("option",{domProps:{value:!0}},[e._v("\n                    Approvers Only\n                ")]):e._e()]),e._v(" "),e.approvalSettings.enabled?s("label",{staticClass:"slds-form-element__label slds-m-top_small"},[e._v("\n                Require Alignment Approval?\n            ")]):e._e(),e._v(" "),e.approvalSettings.enabled?s("select",{directives:[{name:"model",rawName:"v-model",value:e.approvalSettings.publishObj,expression:"approvalSettings.publishObj"}],staticClass:"slds-select",on:{change:[function(t){var s=Array.prototype.filter.call(t.target.options,(function(e){return e.selected})).map((function(e){return"_value"in e?e._value:e.value}));e.$set(e.approvalSettings,"publishObj",t.target.multiple?s:s[0])},function(t){return e.saveApprovalSettings()}]}},[s("option",{domProps:{value:!0}},[e._v("Yes")]),e._v(" "),s("option",{domProps:{value:!1}},[e._v("No")])]):e._e()],1),e._v(" "),s("div",{staticClass:"slds-p-top_large slds-grid slds-grid--vertical slds-m-right_small slds-col slds-size_1-of-1 slds-large-size_1-of-4"},[s("label",{staticClass:"slds-item_label slds-text-color_weak slds-m-bottom_xx-small"},[e._v("PDF")]),e._v(" "),s("MACheckbox",{attrs:{toggleBuffer:500,showStateLabels:""},on:{input:function(t){return e.savePublishSettings()}},model:{value:e.publishOptions.pdfOn,callback:function(t){e.$set(e.publishOptions,"pdfOn",t)},expression:"publishOptions.pdfOn"}}),e._v(" "),s("label",{staticClass:"slds-form-element__label slds-m-top_small"},[e._v("User Access Level")]),e._v(" "),s("select",{directives:[{name:"model",rawName:"v-model",value:e.approvalSettings.pdfAOnly,expression:"approvalSettings.pdfAOnly"}],staticClass:"slds-select",on:{change:[function(t){var s=Array.prototype.filter.call(t.target.options,(function(e){return e.selected})).map((function(e){return"_value"in e?e._value:e.value}));e.$set(e.approvalSettings,"pdfAOnly",t.target.multiple?s:s[0])},function(t){return e.saveApprovalSettings()}]}},[s("option",{domProps:{value:!1}},[e._v("All Users")]),e._v(" "),e.approvalSettings.enabled?s("option",{domProps:{value:!0}},[e._v("\n                    Approvers Only\n                ")]):e._e()]),e._v(" "),e.approvalSettings.enabled?s("label",{staticClass:"slds-form-element__label slds-m-top_small"},[e._v("\n                Require Alignment Approval?\n            ")]):e._e(),e._v(" "),e.approvalSettings.enabled?s("select",{directives:[{name:"model",rawName:"v-model",value:e.approvalSettings.publishPDF,expression:"approvalSettings.publishPDF"}],staticClass:"slds-select",on:{change:[function(t){var s=Array.prototype.filter.call(t.target.options,(function(e){return e.selected})).map((function(e){return"_value"in e?e._value:e.value}));e.$set(e.approvalSettings,"publishPDF",t.target.multiple?s:s[0])},function(t){return e.saveApprovalSettings()}]}},[s("option",{domProps:{value:!0}},[e._v("Yes")]),e._v(" "),s("option",{domProps:{value:!1}},[e._v("No")])]):e._e()],1),e._v(" "),s("div",{staticClass:"slds-p-top_large slds-grid slds-grid--vertical slds-m-right_small slds-col slds-size_1-of-1 slds-large-size_1-of-4"},[s("label",{staticClass:"slds-item_label slds-text-color_weak slds-m-bottom_xx-small"},[e._v("CSV Export")]),e._v(" "),s("MACheckbox",{attrs:{toggleBuffer:500,showStateLabels:""},on:{input:function(t){return e.savePublishSettings()}},model:{value:e.publishOptions.csvOn,callback:function(t){e.$set(e.publishOptions,"csvOn",t)},expression:"publishOptions.csvOn"}}),e._v(" "),s("label",{staticClass:"slds-form-element__label slds-m-top_small"},[e._v("User Access Level")]),e._v(" "),s("select",{directives:[{name:"model",rawName:"v-model",value:e.approvalSettings.csvAOnly,expression:"approvalSettings.csvAOnly"}],staticClass:"slds-select",on:{change:[function(t){var s=Array.prototype.filter.call(t.target.options,(function(e){return e.selected})).map((function(e){return"_value"in e?e._value:e.value}));e.$set(e.approvalSettings,"csvAOnly",t.target.multiple?s:s[0])},function(t){return e.saveApprovalSettings()}]}},[s("option",{domProps:{value:!1}},[e._v("All Users")]),e._v(" "),e.approvalSettings.enabled?s("option",{domProps:{value:!0}},[e._v("\n                    Approvers Only\n                ")]):e._e()]),e._v(" "),e.approvalSettings.enabled?s("label",{staticClass:"slds-form-element__label slds-m-top_small"},[e._v("\n                Require Alignment Approval?\n            ")]):e._e(),e._v(" "),e.approvalSettings.enabled?s("select",{directives:[{name:"model",rawName:"v-model",value:e.approvalSettings.exportCSV,expression:"approvalSettings.exportCSV"}],staticClass:"slds-select",on:{change:[function(t){var s=Array.prototype.filter.call(t.target.options,(function(e){return e.selected})).map((function(e){return"_value"in e?e._value:e.value}));e.$set(e.approvalSettings,"exportCSV",t.target.multiple?s:s[0])},function(t){return e.saveApprovalSettings()}]}},[s("option",{domProps:{value:!0}},[e._v("Yes")]),e._v(" "),s("option",{domProps:{value:!1}},[e._v("No")])]):e._e()],1),e._v(" "),s("div",{staticClass:"slds-p-top_large slds-grid slds-grid--vertical slds-m-right_small slds-col slds-size_1-of-1 slds-large-size_1-of-4"},[s("label",{staticClass:"slds-item_label slds-text-color_weak slds-m-bottom_xx-small"},[e._v("Publish to CSV")]),e._v(" "),s("MACheckbox",{attrs:{toggleBuffer:500,showStateLabels:""},on:{input:function(t){return e.savePublishSettings()}},model:{value:e.publishOptions.pubcsvOn,callback:function(t){e.$set(e.publishOptions,"pubcsvOn",t)},expression:"publishOptions.pubcsvOn"}}),e._v(" "),s("label",{staticClass:"slds-form-element__label slds-m-top_small"},[e._v("User Access Level")]),e._v(" "),s("select",{directives:[{name:"model",rawName:"v-model",value:e.approvalSettings.pubcsvAOnly,expression:"approvalSettings.pubcsvAOnly"}],staticClass:"slds-select",on:{change:[function(t){var s=Array.prototype.filter.call(t.target.options,(function(e){return e.selected})).map((function(e){return"_value"in e?e._value:e.value}));e.$set(e.approvalSettings,"pubcsvAOnly",t.target.multiple?s:s[0])},function(t){return e.saveApprovalSettings()}]}},[s("option",{domProps:{value:!1}},[e._v("All Users")]),e._v(" "),e.approvalSettings.enabled?s("option",{domProps:{value:!0}},[e._v("\n                    Approvers Only\n                ")]):e._e()]),e._v(" "),e.approvalSettings.enabled?s("label",{staticClass:"slds-form-element__label slds-m-top_small"},[e._v("\n                Require Alignment Approval?\n            ")]):e._e(),e._v(" "),e.approvalSettings.enabled?s("select",{directives:[{name:"model",rawName:"v-model",value:e.approvalSettings.publishCSV,expression:"approvalSettings.publishCSV"}],staticClass:"slds-select",on:{change:[function(t){var s=Array.prototype.filter.call(t.target.options,(function(e){return e.selected})).map((function(e){return"_value"in e?e._value:e.value}));e.$set(e.approvalSettings,"publishCSV",t.target.multiple?s:s[0])},function(t){return e.saveApprovalSettings()}]}},[s("option",{domProps:{value:!0}},[e._v("Yes")]),e._v(" "),s("option",{domProps:{value:!1}},[e._v("No")])]):e._e()],1)])])}),[],!1,null,null,null).exports},1853:(e,t,s)=>{"use strict";s.d(t,{Z:()=>i});var l=s(3826),o=s(8050);const a={name:"MACheckbox",components:{MATooltip:s(9756).Z},mixins:[l.Z],props:{value:{type:Boolean,required:!0},title:{type:String,required:!1,default:""},isDisabled:{type:Boolean,default:!1},showStateLabels:{type:Boolean,default:!1},stateLabelOn:{type:String,default:"Enabled"},stateLabelOff:{type:String,default:"Disabled"},toggleBuffer:{type:Number,default:0},noSlide:{type:Boolean,default:!1},isFormElement:{type:Boolean,default:!1},tooltipHelpText:{type:String,default:""}},data:()=>({lastToggleHandlerTimestamp:Date.now(),checkboxId:(0,o.x$)()}),computed:{checkboxClass(){return this.noSlide?"slds-form-element__control":"slds-checkbox_toggle slds-grid"}},watch:{value(){this.$refs.checkbox.checked=this.value}},mounted(){this.$refs.checkbox.checked=this.value},methods:{toggle(e){(e.clientX||e.clientY)&&(e.currentTarget.checked&&this.toggleBuffer&&(this.$refs.checkbox.disabled=!0,setTimeout((()=>{this.$refs.checkbox.disabled=!1}),this.toggleBuffer)),this.$emit("input",!this.value))}}},i=(0,s(1900).Z)(a,(function(){var e=this,t=e.$createElement,s=e._self._c||t;return s("div",{staticClass:"slds-form-element"},[e.noSlide?e.isFormElement?[s("label",{staticClass:"slds-form-element__label",class:{"slds-p-right_none":e.tooltipHelpText},attrs:{for:e.checkboxId}},[e._v(e._s(e.decodeHtml(e.title)))]),e._v(" "),e.tooltipHelpText?s("MATooltip",{attrs:{showIcon:"",inForm:""}},[s("span",{attrs:{slot:"content"},slot:"content"},[e._v("\n                "+e._s(e.tooltipHelpText)+"\n            ")])]):e._e(),e._v(" "),s("div",{staticClass:"slds-form-element__control"},[s("span",{staticClass:"slds-checkbox slds-checkbox_standalone"},[s("input",{ref:"checkbox",attrs:{id:e.checkboxId,disabled:e.isDisabled,type:"checkbox"},domProps:{checked:e.value||!1},on:{click:e.toggle}}),e._v(" "),s("span",{staticClass:"slds-checkbox_faux"})])])]:s("div",{staticClass:"slds-form-element__control"},[s("div",{staticClass:"slds-checkbox"},[s("input",{ref:"checkbox",attrs:{id:e.checkboxId,disabled:e.isDisabled,type:"checkbox"},domProps:{checked:e.value||!1},on:{click:e.toggle}}),e._v(" "),s("label",{staticClass:"slds-checkbox__label",attrs:{for:e.checkboxId}},[s("span",{staticClass:"slds-checkbox_faux"}),e._v(" "),s("span",{staticClass:"slds-form-element__label",class:{"slds-p-right_none":e.tooltipHelpText}},[e._v("\n                    "+e._s(e.decodeHtml(e.title))+"\n                ")])]),e._v(" "),e.tooltipHelpText?s("MATooltip",{attrs:{showIcon:"",inForm:""}},[s("span",{attrs:{slot:"content"},slot:"content"},[e._v("\n                    "+e._s(e.tooltipHelpText)+"\n                ")])]):e._e()],1)]):s("label",{class:e.checkboxClass},[s("input",{ref:"checkbox",attrs:{disabled:e.isDisabled,type:"checkbox"},domProps:{checked:e.value||!1},on:{click:e.toggle}}),e._v(" "),s("span",{staticClass:"slds-checkbox_faux_container"},[s("span",{staticClass:"slds-checkbox_faux"}),e._v(" "),e.showStateLabels?s("span",{staticClass:"slds-checkbox_on"},[e._v(e._s(e.decodeHtml(e.stateLabelOn)))]):e._e(),e._v(" "),e.showStateLabels?s("span",{staticClass:"slds-checkbox_off"},[e._v(e._s(e.decodeHtml(e.stateLabelOff)))]):e._e()]),e._v(" "),s("span",{staticClass:"slds-form-element__label slds-m-bottom_none slds-p-left_x-small slds-p-top_xx-small"},[s("span",[e._v(e._s(e.decodeHtml(e.title)))])]),e._v(" "),e._t("tooltip")],2)],2)}),[],!1,null,"7880ee54",null).exports},9756:(e,t,s)=>{"use strict";s.d(t,{Z:()=>i});var l=s(8969);const o={top:"slds-nubbin_top",topLeft:"slds-nubbin_top-left",topRight:"slds-nubbin_top-right",bottom:"slds-nubbin_bottom",bottomLeft:"slds-nubbin_bottom-left",bottomRight:"slds-nubbin_bottom-right",left:"slds-nubbin_left",leftTop:"slds-nubbin_left-top",leftBottom:"slds-nubbin_left-bottom",right:"slds-nubbin_right",rightTop:"slds-nubbin_right-top",rightBottom:"slds-nubbin_right-bottom"},a={name:"MATooltip",components:{MAIconInline:l.Z},description:"Renders a SLDS-themed tooltip.",props:{inForm:{type:Boolean,default:!1},showIcon:{type:Boolean,default:!1},bindToParent:{type:Boolean,default:!1},bindTo:{type:[HTMLElement,Function],default:()=>{}},source:{type:[HTMLElement,Function],default:()=>{}},forceShow:{type:Boolean,default:!1},nubbinREM:{type:Number,default:1.8},renderDelay:{type:Number,default:0},helpLabel:{type:String,default:"Help"},noWrap:{type:Boolean,default:!1},nubbinPosition:{type:String,default:"bottom"}},data(){return{showEl:!1,container:null,el:null,bindToStored:this.bindTo,sourceStored:null,nubbin:o.bottom}},computed:{doShow(){return this.forceShow||this.showEl}},watch:{showEl(e){if(e){const e=this.bindToStored?this.bindToStored:this.$refs.icon,t=this.$refs.popover;this.renderDelay?setTimeout(this.detach.bind(this,e,t),this.renderDelay):this.detach(e,t)}else this.destroy()},source(e){this.sourceStored=e},sourceStored(e){if(this.bindToStored&&!e)throw new Error("If using a custom binding element for MATooltip, a source element must be provided.");e&&!this.bindToStored&&(this.bindToStored=e),e&&(e.addEventListener("mouseover",this.enter),e.addEventListener("mouseout",this.leave)),this.sourceStored=e},bindTo(e){this.bindToStored=e}},mounted(){this.bindToParent&&(this.bindToStored=this.$el.parentNode),this.bindTo&&(this.bindToStored="function"==typeof this.bindTo?this.bindTo():this.bindTo),this.source?this.sourceStored="function"==typeof this.source?this.source():this.source:this.sourceStored=this.showIcon?this.$refs.icon:this.$el.parentNode},beforeDestroy(){this.destroy(),this.sourceStored&&(this.sourceStored.removeEventListener("mouseover",this.enter),this.sourceStored.removeEventListener("mouseout",this.leave))},methods:{enter(){this.showEl=!0},leave(e){const t=e.toElement||e.relatedTarget;this.sourceStored&&this.sourceStored.contains(t)||this.el===t||this.el&&this.el.contains(t)?e.stopPropagation():this.showEl=!1},overPopup(e){e.stopPropagation()},outPopup(e){const t=e.toElement||e.relatedTarget;this.sourceStored&&this.sourceStored.contains(t)||this.el===t||this.el&&this.el.contains(t)?e.stopPropagation():this.showEl=!1},detach(e,t){this.container=document.createElement("div"),this.container.className=`slds-scope ${this.$el.className}`,this.$el.getAttributeNames().forEach((e=>{e.startsWith("data-v")&&this.container.setAttribute(e,this.$el.getAttribute(e))})),this.el=t.cloneNode(!0),this.el.style.display="block",this.el.addEventListener("mouseleave",this.outPopup),this.el.addEventListener("mouseenter",this.overPopup),this.container.appendChild(this.el),document.body.appendChild(this.container),this.setPosition(e)},setPosition(e){const t=this.el.scrollHeight,s=this.el.clientWidth,l=Math.ceil(this.nubbinREM*parseFloat(getComputedStyle(this.el).fontSize)),a=parseFloat(window.getComputedStyle(this.el,":before").width),i=Math.floor(Math.sqrt(2*Math.pow(a,2))/2),n=Math.ceil(Math.sqrt(2*Math.pow(a,2))/2),r=window.pageYOffset,p=window.pageXOffset,c=document.documentElement.clientWidth,d=this.getParentRect(e),u=d.left+d.width/2-1;let v=u-s/2+p,h=d.top-t-1+r;const m=void 0!==o[this.nubbinPosition]?o[this.nubbinPosition]:this.nubbin;let b=this.nubbinPosition;m===o.bottom&&h-r<0&&(b="top"),u+l>=c?(b="right",h-r<0&&(b="rightTop")):u+s/2>c||"bottomRight"===this.nubbinPosition?(b="bottomRight",h-r<0&&(b="topRight")):u-l<=0?(b="left",h-r<0&&(b="leftTop")):u-s/2<0&&(b="bottomLeft",h-r<0&&(b="topLeft")),"top"===b?h=d.bottom+r+i:"topLeft"===b?(h=d.bottom+r+i,v=u-l+p):"topRight"===b?(h=d.bottom+r+i,v=u-s+l+p):"rightTop"===b?(h=d.top+r+d.height/2-l,v=d.left-s-n+p):"leftTop"===b?(h=d.top+r+d.height/2-l,v=d.right+i+p):"right"===b?(h=d.top+d.height/2-this.el.clientHeight/2+r,v=d.left-s-n+p):"bottomRight"===b?(h=d.top-t-1+r,v=u-s+l+p):"left"===b?(v=d.right+i+p,h=d.top+(d.height/2-1)-this.el.clientHeight/2+r):"bottomLeft"===b?(v=u-l+p,h=d.top-t-1+r):"bottom"===b&&(v=u-s/2+p,h=d.top-t-1+r),o[b]!==this.nubbin&&(this.$refs.popover.classList.remove(this.nubbin),this.$refs.popover.classList.add(o[b])),this.el.style.left=`${v}px`,this.el.style.top=`${h}px`},getParentRect(e){const t=e.getBoundingClientRect(),s=e.currentStyle||window.getComputedStyle(e);let l=parseFloat(s.marginLeft)+parseFloat(s.marginRight);l+=parseFloat(s.paddingLeft)+parseFloat(s.paddingRight),l+=parseFloat(s.borderLeftWidth)+parseFloat(s.borderRightWidth);let o=parseFloat(s.marginTop)+parseFloat(s.marginBottom);return o+=parseFloat(s.paddingTop)+parseFloat(s.paddingBottom),o+=parseFloat(s.borderTopWidth)+parseFloat(s.borderBottomWidth),{top:t.top-o,right:t.right+l,bottom:t.bottom+o,left:t.left-l,width:t.width+l,height:t.height+o}},destroy(){this.el&&(this.el.removeEventListener("mouseleave",this.outPopup),this.el.removeEventListener("mouseenter",this.overPopup),this.el.remove()),this.container&&this.container.remove(),this.el=null,this.container=null,this.nubbin=o.bottom}}},i=(0,s(1900).Z)(a,(function(){var e=this,t=e.$createElement,l=e._self._c||t;return l("div",{class:{"slds-show_inline-block":e.inForm},on:{mouseenter:e.enter,mouseleave:e.leave}},[e.showIcon?l("div",{ref:"icon",class:{"slds-form-element__icon":e.inForm}},[e._t("icon",(function(){return[l("button",{staticClass:"slds-button slds-button_icon",attrs:{"aria-describedby":"help"}},[l("MAIconInline",{staticClass:"slds-icon_container slds-icon-utility-info",attrs:{svg:s(8186),iconClass:["slds-icon","slds-icon","slds-icon_xx-small","slds-icon-text-default"],assistiveText:e.helpLabel}})],1)]}))],2):e._e(),e._v(" "),l("div",{ref:"popover",staticClass:"slds-popover slds-popover_tooltip",class:[e.nubbin],attrs:{role:"tooltip"}},[l("div",{staticClass:"slds-popover__body",class:{"ma-tooltip-nowrap":e.noWrap}},[e._t("content",(function(){return[e._v("default content")]}))],2)])])}),[],!1,null,"2938d120",null).exports}}]);