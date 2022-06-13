"use strict";(globalThis.webpackChunkmaps_desktop=globalThis.webpackChunkmaps_desktop||[]).push([[82],{267:(e,s,t)=>{t.r(s),t.d(s,{default:()=>i});var o=t(9090),n=t(257);const a={components:{Spinner:o.$j,Modal:o.u_,TextInput:o.oi},props:{modalOptions:{type:Object,default:()=>{}}},data:()=>({name:"",id:"",isLoading:!1,nodeType:"",isNew:!1}),computed:{modalHeader(){return this.isNew?this.$Labels.MA_Create_Folder:this.$Labels.MA_Rename}},created(){const{layer:e={},isNew:s=!1}=this.modalOptions;s||(this.name=e.name||""),this.id=e.id||"",this.nodeType=e.nodeType,this.isNew=s},mounted(){try{setTimeout((()=>{this.$refs.nameInput.$el.querySelector("input").focus()}),500)}catch(e){console.warn("please update folder rename modal auto focus:",e)}},methods:{close(){this.$emit("close")},saveChanges(){this.isNew?this.createFolder():this.updateFolder()},updateFolder(){this.isLoading=!0;const e={ajaxResource:"TreeAJAXResources",action:"rename_folder",id:this.id,name:this.name};(new n.Z).setAction("maps.RemoteFunctions.processAJAXRequest").setErrorHandler((e=>{this.isLoading=!1,this.showError(e),this.close()})).invoke([e],(e=>{const{success:s=!1,error:t="Unknown Error"}=e;s?(this.$bus.$emit("refresh-folder"),this.close()):(this.showError(t),this.close()),this.isLoading=!1}),{buffer:!1})},createFolder(){this.isLoading=!0;const e={ajaxResource:"TreeAJAXResources",action:"new_folder",pid:this.id,pos:"0",name:this.name,NodeType:this.nodeType,personUser:"user"};(new n.Z).setAction("maps.RemoteFunctions.processAJAXRequest").setErrorHandler((e=>{this.isLoading=!1,this.showError(e),this.close()})).invoke([e],(e=>{const{success:s=!1,error:t="Unknown Error"}=e;s?(this.$bus.$emit("refresh-folder"),this.close()):(this.showError(t),this.close()),this.isLoading=!1}),{buffer:!1})},showError(e){window.MAToastMessages.showError({message:"Unable to Rename Folder",subMessage:e}),this.isLoading=!1}}},i=(0,t(1900).Z)(a,(function(){var e=this,s=e.$createElement,t=e._self._c||s;return t("Modal",{attrs:{title:e.modalHeader,labels:{close:e.$Labels.MA_Close}},on:{close:e.close}},[t("div",{attrs:{slot:"content"},slot:"content"},[t("Spinner",{directives:[{name:"show",rawName:"v-show",value:e.isLoading,expression:"isLoading"}]}),e._v(" "),t("TextInput",{ref:"nameInput",staticClass:"slds-form-element",attrs:{required:"",labels:{name:e.$Labels.MA_Name},type:"text"},model:{value:e.name,callback:function(s){e.name=s},expression:"name"}})],1),e._v(" "),t("div",{attrs:{slot:"footer"},slot:"footer"},[t("button",{staticClass:"slds-button slds-button_neutral",attrs:{disabled:e.isLoading},on:{click:e.close}},[e._v("\n            "+e._s(e.$Labels.MA_Cancel)+"\n        ")]),e._v(" "),t("button",{staticClass:"slds-button slds-button_brand",attrs:{disabled:e.isLoading},on:{click:e.saveChanges}},[e._v("\n            "+e._s(e.$Labels.MA_Done)+"\n        ")])])])}),[],!1,null,null,null).exports}}]);