webpackJsonp([46],{217:function(s,t,e){var o=e(13)(e(229),e(230),function(s){e(227)},"data-v-2c92a8a8",null);s.exports=o.exports},227:function(s,t,e){var o=e(228);"string"==typeof o&&(o=[[s.i,o,""]]),o.locals&&(s.exports=o.locals);e(198)("5bf9c067",o,!0)},228:function(s,t,e){(s.exports=e(197)(void 0)).push([s.i,".slds-modal__content[data-v-2c92a8a8]{min-height:0}.slds-modal__content[data-v-2c92a8a8]:last-child{border-bottom-right-radius:.25rem;border-bottom-left-radius:.25rem;box-shadow:0 2px 3px 0 rgba(0,0,0,.16)}[data-v-2c92a8a8].slds-notify{min-width:auto;width:100%}.slds-modal_small .slds-modal__container[data-v-2c92a8a8]{width:20rem}.ma-footer-bodyless[data-v-2c92a8a8]{border-top:none}.slds-modal__container .slds-modal__header .ma-icon-close[data-v-2c92a8a8]{font-size:22px}",""])},229:function(s,t,e){"use strict";Object.defineProperty(t,"__esModule",{value:!0});var o=e(59),a=e.n(o);t.default={name:"MAModal",components:{MASpinner:a.a},props:{title:{type:String,required:!0},doDetach:{type:Boolean,default:!1},isLoading:{type:Boolean,default:!1},isLarge:{type:Boolean,default:!1},closeLabel:{type:String,default:"Close"},isSmall:{type:Boolean,default:!1},hideCloseButton:{type:Boolean,default:!1},isBodyless:{type:Boolean,default:!1}},data:function(){return{supressScrollEmitter:!1,container:null}},mounted:function(){var s=this;this.doDetach&&this.detach(),this.$emit("mounted"),setTimeout(function(){s.$refs.backdrop.classList.add("slds-backdrop_open")},1),setTimeout(function(){s.$refs.section.classList.add("slds-fade-in-open")},250)},beforeDestroy:function(){this.container&&(this.container.remove(),this.container=null)},methods:{detach:function(){this.container=document.createElement("div"),this.container.className="slds-scope "+this.$el.className,this.container.appendChild(this.$el),document.body.appendChild(this.container)},modalClass:function(){return{"slds-modal_small":this.isSmall,"slds-modal_large":this.isLarge}}}}},230:function(s,t){s.exports={render:function(){var s=this,t=s.$createElement,e=s._self._c||t;return e("div",[e("section",{ref:"section",staticClass:"slds-modal",class:s.modalClass(),attrs:{role:"dialog",tabindex:"-1"}},[e("div",{staticClass:"slds-modal__container"},[e("header",{staticClass:"slds-modal__header"},[s.hideCloseButton?s._e():e("button",{staticClass:"slds-button slds-button_icon slds-modal__close slds-button_icon-inverse",attrs:{title:s.closeLabel},on:{click:function(t){return s.$emit("close")}}},[e("span",{staticClass:"slds-button__icon slds-button__icon_large ma-icon ma-icon-close"}),s._v(" "),e("span",{staticClass:"slds-assistive-text"},[s._v(s._s(s.closeLabel))])]),s._v(" "),e("h2",{staticClass:"slds-text-heading_medium slds-hyphenate",attrs:{id:"modal-heading-01"}},[s._v(s._s(s.title))])]),s._v(" "),s.isBodyless?s._e():e("div",{ref:"content",staticClass:"slds-modal__content slds-p-around_medium slds-is-relative"},[s.isLoading?e("MASpinner"):s._e(),s._v(" "),s._t("content",[s._v("default content")])],2),s._v(" "),s.isLoading?s._e():e("footer",{staticClass:"slds-modal__footer",class:{"ma-footer-bodyless":s.isBodyless}},[s._t("footer",[s._v("default footer")])],2)])]),s._v(" "),e("div",{ref:"backdrop",staticClass:"slds-backdrop"})])},staticRenderFns:[]}},527:function(s,t,e){var o=e(13)(e(530),e(531),function(s){e(528)},null,null);s.exports=o.exports},528:function(s,t,e){var o=e(529);"string"==typeof o&&(o=[[s.i,o,""]]),o.locals&&(s.exports=o.locals);e(198)("170ed5fe",o,!0)},529:function(s,t,e){(s.exports=e(197)(void 0)).push([s.i,".slds-is-active{border:1px solid #1589ee!important;box-shadow:inset 0 0 0 1px #1589ee}",""])},530:function(s,t,e){"use strict";Object.defineProperty(t,"__esModule",{value:!0});var o=e(217),a=e.n(o);t.default={components:{MAModal:a.a},props:{config:{type:Object,required:!0}},data:function(){return{baseObjectLabel:"",options:[],sObjectLabel:"",type:"",eventIds:[],selectedConfig:{}}},computed:{selectedId:function(){return this.selectedConfig.id}},created:function(){this.processConfig()},methods:{close:function(){this.$emit("close")},updateEvents:function(){this.$emit("set-config",{config:this.selectedConfig,eventIds:this.eventIds}),this.close()},selectConfig:function(s){this.selectedConfig=s},processConfig:function(){var s=this.config,t=s.baseObjectLabel,e=void 0===t?"":t,o=s.eventIds,a=void 0===o?[]:o,l=s.options,d=void 0===l?[]:l,i=s.sObjectLabel,n=void 0===i?"":i,c=s.type,r=void 0===c?"":c;this.baseObjectLabel=e,this.eventIds=a,this.options=d,this.sObjectLabel=n,this.type=r}}}},531:function(s,t){s.exports={render:function(){var s=this,t=s.$createElement,e=s._self._c||t;return e("MAModal",{staticClass:"slds-modal-fullscreen-phone",attrs:{id:"addStopModal",doDetach:!0,title:s.$Labels.MA_Save_Schedule},on:{close:s.close}},[e("div",{attrs:{slot:"content"},slot:"content"},[e("div",{staticClass:"page-wrap slds-brand-band slds-grid slds-grid_vertical"},[e("div",{staticClass:"slds-col slds-align-middle slds-m-bottom_medium"},[e("p",[s._v("\n                    You have multiple event configurations that are related to\n                    "),e("span",{staticClass:"slds-text-color_default"},[e("strong",[s._v(s._s(s.sObjectLabel))])]),s._v("\n                    . What would you like to save these Schedule Events as?\n                ")])]),s._v(" "),s._l(s.options,function(t,o){return e("a",{key:o,staticClass:"slds-box slds-box_link slds-box_x-small slds-m-bottom_x-small js-save",class:{"slds-is-active":t.id===s.selectedId},attrs:{"data-id":t.id},on:{click:function(e){return s.selectConfig(t)}}},[e("div",{staticClass:"slds-p-around_x-small"},[e("h2",{staticClass:"slds-truncate slds-text-heading_small slds-m-bottom_x-small"},[s._v(s._s(s._f("decode")(t.name)))]),s._v(" "),e("div",{staticClass:"slds-grid"},[e("div",{staticClass:"slds-col slds-size_1-of-2 slds-p-right_small"},[e("div",{staticClass:"slds-text-color_weak slds-text-body_small"},[s._v(s._s(s._f("decode")(s.$Labels.MA_OBJECT)))]),s._v(" "),e("div",[s._v(s._s(s._f("decode")(t.objectLabel)))])]),s._v(" "),e("div",{staticClass:"slds-col slds-size_1-of-2"},[e("div",{staticClass:"slds-text-color_weak slds-text-body_small"},[s._v("Related To")]),s._v(" "),e("div",[s._v(s._s(s._f("decode")(s.baseObjectLabel)))])])])])])})],2)]),s._v(" "),e("div",{attrs:{slot:"footer"},slot:"footer"},[e("div",{staticClass:"float-right"},[e("button",{staticClass:"slds-button slds-button_destructive",on:{click:s.close}},[s._v("\n                "+s._s(s._f("decode")(s.$Labels.MA_Close))+"\n            ")]),s._v(" "),e("button",{staticClass:"slds-button slds-button_brand",attrs:{disabled:!s.selectedId},on:{click:s.updateEvents}},[s._v("\n                "+s._s(s._f("decode")(s.$Labels.MA_Save))+"\n            ")])])])])},staticRenderFns:[]}}});