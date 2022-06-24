"use strict";(globalThis.webpackChunkmaps_desktop=globalThis.webpackChunkmaps_desktop||[]).push([[1718],{7579:(e,s,t)=>{t.d(s,{Z:()=>i});const a={name:"MASelect",props:{label:{type:String,default:""},options:{type:Object|Array,required:!0},keyString:{type:String,default:"key"},valueString:{type:String,default:"value"},hasNoneOption:{type:Boolean,default:!0},value:{type:String|Number,default:""},default:{type:String|Number,default:""},isRequired:{type:Boolean,default:!1},isInvalid:{type:Boolean,default:!1},placeholder:{type:String,default:""},isMultiSelect:{type:Boolean,default:!1},disabled:{type:Boolean,default:!1}},data(){return{defaultValue:this.default}},computed:{showLabel(){return this.label}},watch:{value(){const e={};e[this.keyString]=this.value,e[this.valueString]=this.getSelectedValue(),this.$emit("change",e)}},methods:{decodeHtml(e){if(!e)return e;const s=window.document.createElement("textarea");return s.innerHTML=e,s.value},getKey(e){return"string"==typeof e||"number"==typeof e?e:e[this.keyString]},getValue(e){return"string"==typeof e||"number"==typeof e?e:e[this.valueString]},isSelected(e){let s=!1;return s=Array.isArray(this.value)?this.value.includes(this.getKey(e)):this.getKey(e)===this.value,s},change(e){e||(e=null);let s=[];for(let t=0;t<e.length;t++){const a=e[t];s.push(a.value)}if(1===s.length){const[e]=s;s=e}this.$emit("input",s)},getSelectedValue(){if(!this.options||!this.options.length)return"";const e=this.options.find((e=>this.getKey(e)===this.value));return e?this.decodeHtml(this.getValue(e)):null},remove(){this.$emit("input",""),this.doHide()}}},i=(0,t(1900).Z)(a,(function(){var e=this,s=e.$createElement,t=e._self._c||s;return t("div",{staticClass:"slds-form-element",class:{"slds-has-error":e.isInvalid}},[e.showLabel?t("label",{staticClass:"slds-form-element__label"},[e.isRequired?t("abbr",{staticClass:"slds-required",attrs:{title:"required"}},[e._v("*")]):e._e(),e._v("\n        "+e._s(e.decodeHtml(e.label))+"\n    ")]):e._e(),e._v(" "),t("div",{staticClass:"slds-is-relative"},[t("select",e._b({staticClass:"slds-select",staticStyle:{overflow:"auto"},attrs:{placeholder:e.placeholder,disabled:e.disabled},on:{change:function(s){return e.change(s.target.selectedOptions)}}},"select",{multiple:e.isMultiSelect},!1),[e.hasNoneOption?t("option",{attrs:{value:""}},[e._v("\n                -- None --\n            ")]):e._e(),e._v(" "),e._l(e.options,(function(s,a){return t("option",{key:a,domProps:{value:e.getKey(s),selected:e.isSelected(s)}},[e._v("\n                "+e._s(e.getValue(s))+"\n            ")])}))],2),e._v(" "),e._m(0)]),e._v(" "),e.isInvalid?t("div",{staticClass:"slds-form-element__help"},[e._t("errors",(function(){return[e._v("This field is required.")]}))],2):e._e()])}),[function(){var e=this.$createElement,s=this._self._c||e;return s("div",{staticClass:"select-icon"},[s("span",{staticClass:"ma-icon ma-icon-down"})])}],!1,null,null,null).exports},6387:(e,s,t)=>{t.r(s),t.d(s,{default:()=>v});var a=t(675),i=t(4141),n=t(2423);const{MA:{isUserLoggedIn:l}}=window,o={props:{selectedCampaigns:{type:Array,required:!0}},data:()=>({campaignResults:[],campaignName:"",searchTimeout:null,searchIsLoading:!1}),computed:{campaignCount(){return this.selectedCampaigns.length}},watch:{campaignName(e,s){this.searchIsLoading=!0,e.length<2?(this.campaignResults=[],this.searchIsLoading=!1):e!==s&&this.debounceSearch(e)}},methods:{debounceSearch(){null!==this.searchTimeout&&clearTimeout(this.searchTimeout),this.searchTimeout=setTimeout((()=>{this.searchTimeout=null,this.searchCampaigns().finally((()=>{this.searchIsLoading=!1}))}),500)},updateSelection(e){this.$emit("updateCampaign",e)},removeCampaign(e){e.isSelected=!1,this.$emit("updateCampaign",e);const s=this.campaignResults.find((s=>s.id===e.id));s&&(s.isSelected=!1)},searchCampaigns(){return new Promise(((e,s)=>{if(this.campaignResults=[],this.campaignName.length<2)s();else{const t={ajaxResource:"TooltipAJAXResources",action:"searchObjectForName",fieldsToReturn:"Id, Name, Type, Status, IsActive, StartDate, EndDate, NumberOfLeads, NumberOfContacts, NumberOfResponses",searchTerm:this.campaignName,sf_object:"Campaign"};(new n.Z).setAction(this.$Remoting.processAJAXRequest).setErrorHandler(((e,t)=>{l(e,t,!0),s()})).invoke([t],(t=>{if(t.success){const{data:s=[]}=t;s.forEach((e=>{const s=void 0!==this.selectedCampaigns.find((s=>s.id===e.Id));this.campaignResults.push({label:e.Name,id:e.Id,isSelected:s,status:e.Status||"",type:e.Type||"",updatedStatus:"",overrideStatus:!1})})),e()}else s()}),{escape:!1,buffer:!1})}}))},navigateToObject(e){window.ma_navigateToSObject(e)}}};var d=t(1900);const c=(0,d.Z)(o,(function(){var e=this,s=e.$createElement,t=e._self._c||s;return t("div",{staticClass:"campaignStep1"},[t("h4",[e._v(e._s(e._f("decode")(e.$Labels.MA_Step_1_Select_Campaigns)))]),e._v(" "),t("div",{staticClass:"slds-form-element"},[t("span",{staticClass:"required"},[e._v("*")]),e._v(" "),t("label",{staticClass:"slds-form-element__label"},[e._v(e._s(e.$Labels.MA_Name))]),e._v(" "),t("div",{staticClass:"slds-form-element__control slds-input-has-icon slds-input-has-icon_left-right"},[t("i",{staticClass:"slds-icon slds-input__icon slds-input__icon_left ma-icon ma-icon-search"}),e._v(" "),t("input",{directives:[{name:"model",rawName:"v-model",value:e.campaignName,expression:"campaignName"}],staticClass:"slds-input",attrs:{type:"text"},domProps:{value:e.campaignName},on:{input:function(s){s.target.composing||(e.campaignName=s.target.value)}}}),e._v(" "),t("div",{directives:[{name:"show",rawName:"v-show",value:e.searchIsLoading,expression:"searchIsLoading"}],staticClass:"slds-input__icon-group slds-input__icon-group_right"},[e._m(0)])])]),e._v(" "),t("div",{directives:[{name:"show",rawName:"v-show",value:e.campaignCount>0,expression:"campaignCount > 0"}],staticClass:"slds-pill_container slds-pill_container_bare"},[t("ul",{staticClass:"slds-listbox slds-listbox_horizontal"},e._l(e.selectedCampaigns,(function(s,a){return t("li",{key:a,staticClass:"slds-listbox-item",on:{click:function(t){return e.removeCampaign(s)}}},[t("span",{staticClass:"slds-pill"},[t("span",{staticClass:"slds-pill__label slds-truncate",attrs:{title:s.label}},[e._v("\n                        "+e._s(e._f("decode")(s.label))+"\n                    ")]),e._v(" "),e._m(1,!0)])])})),0)]),e._v(" "),t("div",{staticClass:"slds-text-title slds-m-top_x-small"},[e._v(e._s(e._f("decode")(e.campaignCount))+" "+e._s(e.$Labels.MA_selected))]),e._v(" "),t("table",{staticClass:"slds-table slds-table_fixed-layout slds-table_bordered"},[t("thead",[t("tr",{staticClass:"slds-line-height_reset"},[t("th",{staticStyle:{width:"2.75rem"}}),e._v(" "),t("th",[t("span",{staticClass:"slds-truncate",attrs:{title:e.$Labels.MA_Name}},[e._v("\n                        "+e._s(e.$Labels.MA_Name)+"\n                    ")])]),e._v(" "),t("th",[t("span",{staticClass:"slds-truncate",attrs:{title:e.$Labels.MA_Type}},[e._v("\n                        "+e._s(e.$Labels.MA_Type)+"\n                    ")])]),e._v(" "),t("th",[t("span",{staticClass:"slds-truncate",attrs:{title:e.$Labels.MA_Status}},[e._v("\n                        "+e._s(e.$Labels.MA_Status)+"\n                    ")])])])]),e._v(" "),t("tbody",e._l(e.campaignResults,(function(s,a){return t("tr",{key:a,staticClass:"slds-line-height_reset"},[t("td",[t("div",{staticClass:"slds-checkbox_add-button"},[t("input",{directives:[{name:"model",rawName:"v-model",value:s.isSelected,expression:"c.isSelected"}],staticClass:"slds-assistive-text",attrs:{id:"camp"+a,type:"checkbox"},domProps:{checked:Array.isArray(s.isSelected)?e._i(s.isSelected,null)>-1:s.isSelected},on:{change:[function(t){var a=s.isSelected,i=t.target,n=!!i.checked;if(Array.isArray(a)){var l=e._i(a,null);i.checked?l<0&&e.$set(s,"isSelected",a.concat([null])):l>-1&&e.$set(s,"isSelected",a.slice(0,l).concat(a.slice(l+1)))}else e.$set(s,"isSelected",n)},function(t){return e.updateSelection(s)}]}}),e._v(" "),t("label",{staticClass:"slds-checkbox_faux",attrs:{for:"camp"+a}},[t("span",{staticClass:"slds-assistive-text"},[e._v(e._s(e._f("decode")(s.label)))])])])]),e._v(" "),t("td",[t("div",{staticClass:"slds-truncate slds-text-body_regular"},[t("a",{on:{click:function(t){return e.navigateToObject(s.id)}}},[t("span",{attrs:{title:e._f("decode")(s.label)}},[e._v("\n                                "+e._s(e._f("decode")(s.label))+"\n                            ")])])])]),e._v(" "),t("td",[t("div",{staticClass:"slds-text-body_regular slds-truncate"},[t("span",{attrs:{title:e._f("decode")(s.type)}},[e._v("\n                            "+e._s(e._f("decode")(s.type))+"\n                        ")])])]),e._v(" "),t("td",[t("div",{staticClass:"slds-text-body_regular slds-truncate"},[t("span",{attrs:{title:e._f("decode")(s.type)}},[e._v("\n                            "+e._s(e._f("decode")(s.status))+"\n                        ")])])])])})),0)])])}),[function(){var e=this,s=e.$createElement,t=e._self._c||s;return t("div",{staticClass:"slds-spinner slds-spinner_brand slds-spinner_x-small slds-input__spinner"},[t("span",{staticClass:"slds-assistive-text"},[e._v("Loading")]),e._v(" "),t("div",{staticClass:"slds-spinner__dot-a"}),e._v(" "),t("div",{staticClass:"slds-spinner__dot-b"})])},function(){var e=this.$createElement,s=this._self._c||e;return s("span",{staticClass:"slds-icon_container slds-pill__remove",attrs:{title:"Remove"}},[s("i",{staticClass:"slds-button__icon ma-icon ma-icon-remove"})])}],!1,null,"ede8cff2",null).exports;var r=t(7579),u=t(4549);const{MA:{isUserLoggedIn:p}}=window,m={components:{MobileSelect:r.Z,MobileToggle:u.Z},props:{selectedCampaigns:{type:Array,required:!0},showStep2:{type:Boolean,default:!1},isLoading:{type:Boolean,default:!1}},data:()=>({statusMap:{}}),created(){this.$emit("update:isLoading",!0),this.getCampaignStatus().finally((()=>{this.$emit("update:isLoading",!1)}))},methods:{navigateToObject(e){window.ma_navigateToSObject(e)},getCampaignStatus(){return new Promise(((e,s)=>{const t=this.selectedCampaigns.map((e=>e.id)),a={ajaxResource:"TooltipAJAXResources",action:"get_campaign_statuses",serializedCampaignIds:JSON.stringify(t),sf_object:"Campaign"};(new n.Z).setAction(this.$Remoting.processAJAXRequest).setErrorHandler(((e,t)=>{p(e,t,!0),s()})).invoke([a],(t=>{if(t.success){const{campaignStatuses:s={}}=t;this.statusMap=s,this.updateDefaultCampaignStatus(),e()}else s()}),{escape:!1,buffer:!1})}))},getStatusArray(e){return this.statusMap[e]||[]},updateDefaultCampaignStatus(){this.selectedCampaigns.forEach((e=>{const s=this.statusMap[e.id]||[],[t=""]=s;e.updatedStatus=t}))}}},h=(0,d.Z)(m,(function(){var e=this,s=e.$createElement,t=e._self._c||s;return t("div",[t("h4",[e._v(e._s(e.$Labels.MA_Step_2_Options))]),e._v(" "),t("table",{staticClass:"slds-table slds-table_fixed-layout slds-table_bordered"},[t("thead",[t("tr",[t("th",{staticClass:"slds-truncate"},[t("span",{attrs:{title:e.$Labels.MA_Name}},[e._v("\n                        "+e._s(e.$Labels.MA_Name)+"\n                    ")])]),e._v(" "),t("th",{staticClass:"slds-truncate"},[t("span",{attrs:{title:e.$Labels.MA_Member_Status}},[e._v("\n                        "+e._s(e.$Labels.MA_Member_Status)+"\n                    ")])]),e._v(" "),t("th",{staticClass:"slds-truncate"},[t("span",{attrs:{title:e.$Labels.MA_Override_Status}},[e._v("\n                        "+e._s(e.$Labels.MA_Override_Status)+"\n                    ")])])])]),e._v(" "),t("tbody",e._l(e.selectedCampaigns,(function(s,a){return t("tr",{key:a},[t("td",[t("div",{staticClass:"slds-text-body_regular slds-truncate"},[t("a",{on:{click:function(s){return e.navigateToObject(e.c.id)}}},[t("span",{attrs:{title:e._f("decode")(s.label)}},[e._v("\n                                "+e._s(e._f("decode")(s.label))+"\n                            ")])])])]),e._v(" "),t("td",[t("MobileSelect",{attrs:{options:e.getStatusArray(s.id),hasNoneOption:!1},model:{value:s.updatedStatus,callback:function(t){e.$set(s,"updatedStatus",t)},expression:"campaign.updatedStatus"}})],1),e._v(" "),t("td",[t("MobileToggle",{model:{value:s.overrideStatus,callback:function(t){e.$set(s,"overrideStatus",t)},expression:"campaign.overrideStatus"}})],1)])})),0)])])}),[],!1,null,null,null).exports,{MA:{isUserLoggedIn:_}}=window,g={components:{MAModal:i.Z,AddToCampaignStep1:c,AddToCampaignStep2:h,MASpinner:a.Z},props:{modalOptions:{type:Object,required:!0}},data:()=>({selectedCampaigns:[],showStep2:!1,contactIds:[],leadIds:[],hasRecords:!1,isLoading:!1}),created(){this.processModalOptions()},methods:{close(){this.$emit("close")},updateCampaign(e){if(e.isSelected)this.selectedCampaigns.push(e);else{const s=this.selectedCampaigns.filter((s=>s.id!==e.id));this.selectedCampaigns=s}},validateStep2(){this.selectedCampaigns.length>0?this.showStep2=!0:window.MAToastMessages.showWarning({message:"Campaign Warning",subMessage:"You must select one or more campaigns before proceeding.",timeOut:7e3})},saveCampaigns(){return new Promise(((e,s)=>{if(this.selectedCampaigns.length>0){const s=window.MAToastMessages.showLoading({message:"Gathering Requirments",subMessage:`${this.$Labels.MA_Loading_With_Ellipsis}`,timeOut:0,extendedTimeOut:0});this.isLoading=!0;const t={newMemberCount:0,updatedMemberCount:0,batchSuccess:0,batchFailures:0},a=this.leadIds.length,i=this.contactIds.length,n=a>=i?a:i;let l=1;const o=window.async.queue(((e,a)=>{s.find(".toast-title").text(`${this.$Labels.MA_Processing} Campaign ${l} ${this.$Labels.MA_of} ${this.selectedCampaigns.length}`);let i=1;const o=window.async.queue(((e,a)=>{this.updateRecords(e).then((e=>{t.newMemberCount+=e.newMemberCount,t.updatedMemberCount+=e.updatedMemberCount,t.batchSuccess+=1})).catch((()=>{t.batchFailures+=1})).finally((()=>{s.find(".toast-message").text(`Batch ${i} ${this.$Labels.MA_of} ${n}`),i++,a()}))}));for(let s=0;s<n;s++)o.push({contacts:this.contactIds[s]||[],leads:this.leadIds[s]||[],campaignOptions:e},(()=>{}));o.concurrency=3,o.drain=()=>{l++,a()}}));o.concurrency=1,this.selectedCampaigns.forEach((e=>{o.push(e,(()=>{}))})),o.drain=()=>{window.MAToastMessages.hideMessage(s),window.MAToastMessages.showSuccess({message:"Campaigns Updated",subMessage:`New Members: ${t.newMemberCount}, Updated Members: ${t.updatedMemberCount}`,timeOut:7e3}),this.isLoading=!1,this.close(),e()}}else window.MAToastMessages.showWarning({message:"Campaign Status",subMessage:"No visible contacts or leads"}),s()}))},updateRecords(e){return new Promise(((s,t)=>{const{campaignOptions:a,leads:i,contacts:l}=e,o={action:"add_to_campaign",ajaxResource:"TooltipAJAXResources",campaignId:a.id,campaignStatus:a.updatedStatus,overrideExistingMemberStatus:a.overrideStatus,serializedContactIds:JSON.stringify(l),serializedLeadIds:JSON.stringify(i)};(new n.Z).setAction(this.$Remoting.processAJAXRequest).setErrorHandler(((e,s)=>{_(e,s,!0),t()})).invoke([o],(e=>{e.success?s(e):t()}),{escape:!1,buffer:!1})}))},processModalOptions(){const e=this;e.isLoading=!0;const{records:s=[]}=this.modalOptions,t=s.length;let a=0,i=[],n=[];setTimeout((function l(){if(a<t){let o=0;for(;o<100&&a<t;){o++;const t=s[a];void 0!==t&&("003"===t.Id.substring(0,3)?(n.length>=200&&(e.contactIds.push(n),n=[]),n.push(t.Id)):"00Q"===t.Id.substring(0,3)&&(i.length>=200&&(e.leadIds.push(i),i=[]),i.push(t.Id))),a++}setTimeout(l,1)}else i.length>0&&e.leadIds.push(i),n.length>0&&e.contactIds.push(n),e.launchPopup()}),1)},launchPopup(){this.leadIds.length>0||this.contactIds.length>0?this.hasRecords=!0:window.MAToastMessages.showWarning({message:"Campaign Status",subMessage:"No visible contacts or leads"}),this.isLoading=!1}}},v=(0,d.Z)(g,(function(){var e=this,s=e.$createElement,t=e._self._c||s;return t("MAModal",{staticClass:"slds-modal-fullscreen-phone",attrs:{id:"AddToCampaignPopup",title:e.$Labels.ActionFramework_Add_to_Campaign,closeLabel:e.$Labels.MA_Close},on:{close:e.close}},[t("div",{attrs:{slot:"content"},slot:"content"},[t("MASpinner",{directives:[{name:"show",rawName:"v-show",value:e.isLoading,expression:"isLoading"}]}),e._v(" "),t("div",[t("AddToCampaignStep1",{directives:[{name:"show",rawName:"v-show",value:!e.showStep2,expression:"!showStep2"}],attrs:{selectedCampaigns:e.selectedCampaigns},on:{"update:selectedCampaigns":function(s){e.selectedCampaigns=s},"update:selected-campaigns":function(s){e.selectedCampaigns=s},updateCampaign:e.updateCampaign}}),e._v(" "),e.showStep2?t("AddToCampaignStep2",{attrs:{isLoading:e.isLoading,selectedCampaigns:e.selectedCampaigns},on:{"update:isLoading":function(s){e.isLoading=s},"update:is-loading":function(s){e.isLoading=s}}}):e._e()],1)],1),e._v(" "),t("div",{attrs:{slot:"footer"},slot:"footer"},[t("div",{staticClass:"float-left"},[t("button",{staticClass:"slds-button slds-button_neutral",attrs:{id:"maModalClose"},on:{click:e.close}},[e._v("\n                "+e._s(e.$Labels.MA_Cancel)+"\n            ")])]),e._v(" "),t("div",{staticClass:"float-right"},[e.showStep2?t("button",{staticClass:"slds-button slds-button_neutral step2",attrs:{disabled:e.isLoading},on:{click:function(s){e.showStep2=!1}}},[e._v("\n                "+e._s(e.$Labels.MA_Back)+"\n            ")]):e._e(),e._v(" "),e.showStep2?e._e():t("button",{staticClass:"slds-button slds-button_brand step1",attrs:{disabled:e.isLoading},on:{click:e.validateStep2}},[e._v("\n                "+e._s(e.$Labels.MA_Next)+"\n            ")]),e._v(" "),e.showStep2?t("button",{staticClass:"slds-button slds-button_brand step2",attrs:{disabled:e.isLoading},on:{click:e.saveCampaigns}},[e._v("\n                "+e._s(e.$Labels.MA_Add_Close)+"\n            ")]):e._e()])])])}),[],!1,null,"55d1e01e",null).exports}}]);