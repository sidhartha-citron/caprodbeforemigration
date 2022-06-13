"use strict";(globalThis.webpackChunkmaps_desktop=globalThis.webpackChunkmaps_desktop||[]).push([[600],{3127:(t,s,a)=>{a.r(s),a.d(s,{default:()=>e});const e=(0,a(1900).Z)({data:()=>({type:"Static"})},(function(){var t=this,s=t.$createElement,a=t._self._c||s;return a("div",{staticClass:"maModal",attrs:{id:"NewEventPopup"}},[a("div",{staticClass:"slds-scope"},[a("section",{staticClass:"slds-modal",attrs:{role:"dialog",tabindex:"-1","aria-labelledby":"modal-heading-01","aria-describedby":"modal-content-id-1"}},[a("div",{staticClass:"slds-modal__container"},[a("header",{staticClass:"slds-modal__header"},[t._m(0),t._v(" "),a("h2",{staticClass:"slds-text-heading--medium slds-hyphenate maPopup-title",attrs:{id:"modal-heading-01"}},[t._v("\n                        "+t._s(t.$Labels.MA_New_Event)+"\n                    ")])]),t._v(" "),a("div",{staticClass:"slds-modal__content slds-p-around_medium"},[a("div",{attrs:{id:"newevent-assignto-wrapper"}},[a("h4",[t._v(t._s(t.$Labels.MA_Step_1_Assign_To))]),t._v(" "),a("fieldset",{staticClass:"newevent-assignto-type-wrapper slds-form-element"},[a("div",{staticClass:"slds-form-element__control"},[a("span",{staticClass:"slds-radio"},[a("input",{directives:[{name:"model",rawName:"v-model",value:t.type,expression:"type"}],attrs:{id:"newevent-assignto-type-static",type:"radio",name:"newevent-assignto-type",value:"Static"},domProps:{checked:t._q(t.type,"Static")},on:{change:function(s){t.type="Static"}}}),t._v(" "),a("label",{staticClass:"slds-radio__label",attrs:{for:"newevent-assignto-type-static"}},[a("span",{staticClass:"slds-radio_faux"}),t._v(" "),a("span",{staticClass:"slds-form-element__label"},[t._v(t._s(t.$Labels.MA_Static))])])]),t._v(" "),a("span",{staticClass:"slds-radio"},[a("input",{directives:[{name:"model",rawName:"v-model",value:t.type,expression:"type"}],attrs:{id:"newevent-assignto-type-dynamic",type:"radio",name:"newevent-assignto-type",value:"Dynamic"},domProps:{checked:t._q(t.type,"Dynamic")},on:{change:function(s){t.type="Dynamic"}}}),t._v(" "),a("label",{staticClass:"slds-radio__label",attrs:{for:"newevent-assignto-type-dynamic"}},[a("span",{staticClass:"slds-radio_faux"}),t._v(" "),a("span",{staticClass:"slds-form-element__label"},[t._v(t._s(t.$Labels.MA_DYNAMIC))])])])])]),t._v(" "),a("div",{directives:[{name:"show",rawName:"v-show",value:"Static"===t.type,expression:"type === 'Static'"}],staticClass:"ma-form-control-wrap newevent-assignto-type Static"},[a("label",{staticClass:"ma-input-label"},[t._v(t._s(t.$Labels.MA_Step_1_Assign_To)),a("span",{staticClass:"required"},[t._v("*")])]),t._v(" "),t._m(1),t._v(" "),t._m(2)]),t._v(" "),a("div",{directives:[{name:"show",rawName:"v-show",value:"Dynamic"===t.type,expression:"type === 'Dynamic'"}],staticClass:"ma-form-control-wrap newevent-assignto-type Dynamic"},[a("table",{staticClass:"ma-table ma-table--fullwidth",attrs:{id:"newevent-assignto-type-dynamic-table"}})])]),t._v(" "),a("div",{attrs:{id:"newevent-details-wrapper"}},[a("h4",[t._v(t._s(t.$Labels.MA_Step_2_Event_Details))]),t._v(" "),a("div",{staticClass:"ma-form-control-wrap"},[a("label",{staticClass:"ma-input-label"},[t._v(t._s(t.$Labels.MA_Subject)),a("span",{staticClass:"required"},[t._v("*")])]),t._v(" "),t._m(3)]),t._v(" "),a("div",{staticClass:"slds-grid"},[a("div",{staticClass:"ma-form-control-wrap slds-col slds-p-right_xx-small"},[a("label",{staticClass:"ma-input-label"},[t._v(t._s(t.$Labels.MA_Start)),a("span",{staticClass:"required"},[t._v("*")])]),t._v(" "),t._m(4)]),t._v(" "),a("div",{staticClass:"ma-form-control-wrap slds-col slds-p-left_xx-small"},[a("label",{staticClass:"ma-input-label"},[t._v(t._s(t.$Labels.MA_End)),a("span",{staticClass:"required"},[t._v("*")])]),t._v(" "),t._m(5)])]),t._v(" "),a("div",{staticClass:"ma-form-control-wrap"},[a("label",{staticClass:"ma-input-label"},[t._v(t._s(t.$Labels.MA_Description))]),t._v(" "),t._m(6)])])]),t._v(" "),a("footer",{staticClass:"slds-modal__footer"},[t._m(7),t._v(" "),a("div",{staticClass:"float-right footer-buttons"},[a("button",{staticClass:"slds-button slds-button_neutral",attrs:{id:"maModalClose",onclick:"MALayers.hideModal('NewEventPopup',true);"}},[t._v("\n                            Cancel\n                        ")]),t._v(" "),a("button",{staticClass:"slds-button slds-button_brand step2",attrs:{onclick:"NewEvent_Step1();"}},[t._v("\n                            "+t._s(t.$Labels.MA_Back)+"\n                        ")]),t._v(" "),a("button",{staticClass:"slds-button slds-button_brand step1",attrs:{onclick:"NewEvent_Step2();"}},[t._v("\n                            "+t._s(t.$Labels.MA_Next)+"\n                        ")]),t._v(" "),a("button",{staticClass:"slds-button slds-button_brand step2",attrs:{onclick:"NewEvent_Finish();"}},[t._v("\n                            "+t._s(t.$Labels.MA_Add_Close)+"\n                        ")])])])])])])])}),[function(){var t=this,s=t.$createElement,a=t._self._c||s;return a("button",{staticClass:"slds-button slds-button_icon slds-modal__close slds-button_icon-inverse js-close-this-slds-modal",attrs:{title:"Close",onclick:"MALayers.hideModal();"}},[a("span",{staticClass:"slds-button__icon slds-button__icon--large ma-icon ma-icon-close",attrs:{"aria-hidden":"true"}}),t._v(" "),a("span",{staticClass:"slds-assistive-text"},[t._v("Close")])])},function(){var t=this,s=t.$createElement,a=t._self._c||s;return a("div",{staticClass:"ma-form-control icon-right"},[a("i",{staticClass:"MAIcon ion-android-search inset-icon--right",staticStyle:{"font-size":"20px",top:"5px"}}),t._v(" "),a("input",{staticClass:"ma-input searchDynamicInput taskOwner",attrs:{placeholder:"Search Users...",type:"text"}})])},function(){var t=this,s=t.$createElement,a=t._self._c||s;return a("div",{staticClass:"new-event-dropdown"},[a("ul",{staticClass:"ma-list table-view search-table-view slds-listbox slds-listbox_vertical slds-dropdown slds-dropdown--fluid slds-dropdown--length-5"},[a("li",{staticClass:"table-view-cell slds-media slds-listbox__option slds-listbox__option_plain slds-media_small slds-media_center"},[t._v("Please search above...")])])])},function(){var t=this.$createElement,s=this._self._c||t;return s("div",{staticClass:"ma-form-control"},[s("input",{staticClass:"ma-input taskSubject",attrs:{id:"newevent-details-subject",type:"text",maxlength:"255"}})])},function(){var t=this,s=t.$createElement,a=t._self._c||s;return a("div",{staticClass:"ma-form-control icon-right"},[a("input",{staticClass:"datepicker ma-input-row slds-m-bottom_x-small",attrs:{id:"newevent-details-startdate",type:"text"}}),t._v(" "),a("div",[a("div",{staticClass:"slds-form-element"},[a("div",{staticClass:"slds-form-element__control"},[a("div",{staticClass:"slds-combobox_container"},[a("div",{staticClass:"slds-combobox slds-dropdown-trigger slds-dropdown-trigger_click slds-combobox-picklist slds-timepicker",attrs:{"aria-expanded":"true","aria-haspopup":"listbox",role:"combobox"}},[a("div",{staticClass:"slds-combobox__form-element slds-input-has-icon slds-input-has-icon_right",attrs:{role:"none"}},[a("input",{staticClass:"slds-input slds-combobox__input ma-time-input",attrs:{id:"eventStartTime",type:"text","aria-controls":"listbox-unique-id",autocomplete:"off",role:"textbox",placeholder:"Set start time...",maxlength:"8"}}),t._v(" "),a("span",{staticClass:"slds-icon_container slds-icon-utility-clock slds-input__icon slds-input__icon_right ma-icon-clock",attrs:{title:"Time Icon"}})])])])])])])])},function(){var t=this,s=t.$createElement,a=t._self._c||s;return a("div",{staticClass:"ma-form-control icon-right"},[a("input",{staticClass:"datepicker ma-input-row slds-m-bottom_x-small",attrs:{id:"newevent-details-enddate",type:"text"}}),t._v(" "),a("div",[a("div",{staticClass:"slds-form-element"},[a("div",{staticClass:"slds-form-element__control"},[a("div",{staticClass:"slds-combobox_container"},[a("div",{staticClass:"slds-combobox slds-dropdown-trigger slds-dropdown-trigger_click slds-combobox-picklist slds-timepicker",attrs:{"aria-expanded":"true","aria-haspopup":"listbox",role:"combobox"}},[a("div",{staticClass:"slds-combobox__form-element slds-input-has-icon slds-input-has-icon_right",attrs:{role:"none"}},[a("input",{staticClass:"slds-input slds-combobox__input ma-time-input",attrs:{id:"eventEndTime",type:"text","aria-controls":"listbox-unique-id",autocomplete:"off",role:"textbox",placeholder:"Set start time...",maxlength:"8"}}),t._v(" "),a("span",{staticClass:"slds-icon_container slds-icon-utility-clock slds-input__icon slds-input__icon_right ma-icon-clock",attrs:{title:"Time Icon"}})])])])])])])])},function(){var t=this.$createElement,s=this._self._c||t;return s("div",{staticClass:"ma-form-control"},[s("textarea",{staticClass:"ma-input taskDescription",staticStyle:{"min-height":"66px"},attrs:{id:"newevent-details-description",type:"text"}})])},function(){var t=this,s=t.$createElement,a=t._self._c||s;return a("div",{staticClass:"float-left footer-buttons"},[a("button",{staticClass:"slds-button slds-button_neutral",attrs:{id:"newEventClassic",onclick:"newEventClassic();"}},[t._v("\n                            View in Salesforce\n                        ")])])}],!1,null,null,null).exports},7237:(t,s,a)=>{a.r(s),a.d(s,{default:()=>e});const e=(0,a(1900).Z)({data:()=>({type:"Static"})},(function(){var t=this,s=t.$createElement,a=t._self._c||s;return a("div",{staticClass:"maModal",attrs:{id:"NewTaskPopup"}},[a("div",{staticClass:"slds-scope"},[a("section",{staticClass:"slds-modal",attrs:{role:"dialog",tabindex:"-1","aria-labelledby":"modal-heading-01","aria-describedby":"modal-content-id-1"}},[a("div",{staticClass:"slds-modal__container"},[a("header",{staticClass:"slds-modal__header"},[t._m(0),t._v(" "),a("h2",{staticClass:"slds-text-heading--medium slds-hyphenate maPopup-title",attrs:{id:"modal-heading-01"}},[t._v("\n                        "+t._s(t.$Labels.MA_New_Task)+"\n                    ")])]),t._v(" "),a("div",{staticClass:"slds-modal__content slds-p-around_medium"},[a("div",{attrs:{id:"newtask-assignto-wrapper"}},[a("h4",[t._v(t._s(t.$Labels.MA_Step_1_Assign_To))]),t._v(" "),a("fieldset",{staticClass:"newtask-assignto-type-wrapper slds-form-element"},[a("div",{staticClass:"slds-form-element__control"},[a("span",{staticClass:"slds-radio"},[a("input",{directives:[{name:"model",rawName:"v-model",value:t.type,expression:"type"}],attrs:{id:"newtask-assignto-type-static",type:"radio",name:"newtask-assignto-type",value:"Static"},domProps:{checked:t._q(t.type,"Static")},on:{change:function(s){t.type="Static"}}}),t._v(" "),a("label",{staticClass:"slds-radio__label",attrs:{for:"newtask-assignto-type-static"}},[a("span",{staticClass:"slds-radio_faux"}),t._v(" "),a("span",{staticClass:"slds-form-element__label"},[t._v(t._s(t.$Labels.MA_Static))])])]),t._v(" "),a("span",{staticClass:"slds-radio"},[a("input",{directives:[{name:"model",rawName:"v-model",value:t.type,expression:"type"}],attrs:{id:"newtask-assignto-type-dynamic",type:"radio",name:"newtask-assignto-type",value:"Dynamic"},domProps:{checked:t._q(t.type,"Dynamic")},on:{change:function(s){t.type="Dynamic"}}}),t._v(" "),a("label",{staticClass:"slds-radio__label",attrs:{for:"newtask-assignto-type-dynamic"}},[a("span",{staticClass:"slds-radio_faux"}),t._v(" "),a("span",{staticClass:"slds-form-element__label"},[t._v(t._s(t.$Labels.MA_DYNAMIC))])])])])]),t._v(" "),a("div",{directives:[{name:"show",rawName:"v-show",value:"Static"===t.type,expression:"type === 'Static'"}],staticClass:"ma-form-control-wrap newtask-assignto-type Static"},[a("label",{staticClass:"ma-input-label"},[t._v(t._s(t.$Labels.MA_Step_1_Assign_To)),a("span",{staticClass:"required"},[t._v("*")])]),t._v(" "),t._m(1),t._v(" "),t._m(2)]),t._v(" "),a("div",{directives:[{name:"show",rawName:"v-show",value:"Dynamic"===t.type,expression:"type === 'Dynamic'"}],staticClass:"ma-form-control-wrap newtask-assignto-type Dynamic"},[a("table",{staticClass:"ma-table ma-table--fullwidth",attrs:{id:"newtask-assignto-type-dynamic-table"}})])]),t._v(" "),a("div",{attrs:{id:"newtask-details-wrapper"}},[a("h4",[t._v(t._s(t.$Labels.MA_Step_2_Task_Details))]),t._v(" "),a("div",{staticClass:"ma-form-control-wrap"},[a("label",{staticClass:"ma-input-label"},[t._v(t._s(t.$Labels.MA_Subject)),a("span",{staticClass:"required"},[t._v("*")])]),t._v(" "),t._m(3)]),t._v(" "),a("div",{staticClass:"ma-form-control-wrap"},[a("label",{staticClass:"ma-input-label"},[t._v(t._s(t.$Labels.MA_Due_Date))]),t._v(" "),t._m(4)]),t._v(" "),a("div",{staticClass:"ma-form-control-wrap"},[a("label",{staticClass:"ma-input-label"},[t._v(t._s(t.$Labels.MA_Comments))]),t._v(" "),t._m(5)])])]),t._v(" "),a("footer",{staticClass:"slds-modal__footer"},[t._m(6),t._v(" "),a("div",{staticClass:"float-right footer-buttons"},[a("button",{staticClass:"slds-button slds-button_neutral",attrs:{id:"maModalClose",onclick:"MALayers.hideModal('NewTaskPopup',true);"}},[t._v("\n                            Cancel\n                        ")]),t._v(" "),a("button",{staticClass:"slds-button slds-button_brand step2",attrs:{onclick:"NewTask_Step1();"}},[t._v("\n                            "+t._s(t.$Labels.MA_Back)+"\n                        ")]),t._v(" "),a("button",{staticClass:"slds-button slds-button_brand step1",attrs:{onclick:"NewTask_Step2();"}},[t._v("\n                            "+t._s(t.$Labels.MA_Next)+"\n                        ")]),t._v(" "),a("button",{staticClass:"slds-button slds-button_brand step2",attrs:{onclick:"NewTask_Finish();"}},[t._v("\n                            "+t._s(t.$Labels.MA_Add_Close)+"\n                        ")])])])])])])])}),[function(){var t=this,s=t.$createElement,a=t._self._c||s;return a("button",{staticClass:"slds-button slds-button_icon slds-modal__close slds-button_icon-inverse js-close-this-slds-modal",attrs:{title:"Close",onclick:"MALayers.hideModal();"}},[a("span",{staticClass:"slds-button__icon slds-button__icon--large ma-icon ma-icon-close",attrs:{"aria-hidden":"true"}}),t._v(" "),a("span",{staticClass:"slds-assistive-text"},[t._v("Close")])])},function(){var t=this,s=t.$createElement,a=t._self._c||s;return a("div",{staticClass:"ma-form-control icon-right"},[a("i",{staticClass:"MAIcon ion-android-search inset-icon--right",staticStyle:{"font-size":"20px",top:"5px"}}),t._v(" "),a("input",{staticClass:"ma-input searchDynamicInput taskOwner",attrs:{placeholder:"Search Users...",type:"text"}})])},function(){var t=this,s=t.$createElement,a=t._self._c||s;return a("div",{staticClass:"ma-form-control-wrap"},[a("ul",{staticClass:"ma-list table-view search-table-view",staticStyle:{"max-height":"220px",overflow:"auto"}},[a("li",{staticClass:"table-view-cell"},[t._v("Please search above...")])])])},function(){var t=this.$createElement,s=this._self._c||t;return s("div",{staticClass:"ma-form-control"},[s("input",{staticClass:"ma-input taskSubject",attrs:{id:"newtask-details-subject",type:"text"}})])},function(){var t=this,s=t.$createElement,a=t._self._c||s;return a("div",{staticClass:"ma-form-control icon-right"},[a("i",{staticClass:"MAIcon ion-android-calendar inset-icon--right",staticStyle:{"font-size":"20px",top:"5px"}}),t._v(" "),a("input",{staticClass:"ma-input taskDate",attrs:{id:"newtask-details-duedate",type:"text"}})])},function(){var t=this.$createElement,s=this._self._c||t;return s("div",{staticClass:"ma-form-control"},[s("textarea",{staticClass:"ma-input taskDescription",staticStyle:{"min-height":"66px"},attrs:{id:"newtask-details-description",type:"text"}})])},function(){var t=this,s=t.$createElement,a=t._self._c||s;return a("div",{staticClass:"float-left footer-buttons"},[a("button",{staticClass:"slds-button slds-button_neutral",attrs:{id:"newTaskClassic",onclick:"newTaskClassic();"}},[t._v("\n                            View in Salesforce\n                        ")])])}],!1,null,null,null).exports}}]);