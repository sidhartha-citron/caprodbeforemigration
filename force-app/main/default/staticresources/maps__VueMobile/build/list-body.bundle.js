"use strict";(globalThis.webpackChunkmaps_desktop=globalThis.webpackChunkmaps_desktop||[]).push([[5169],{5264:(t,e,s)=>{s.d(e,{Z:()=>n});const i=new Map;function o(t,e,s){const o=function(i){s.context._isDestroyed?document.removeEventListener("click",o):t.contains(i.target)||t===i.target||e(i)};i.set(t,o),setTimeout((()=>document.addEventListener("click",o)),0)}function l(t){const e=i.get(t);document.removeEventListener("click",e),i.delete(t)}const n={bind(t,{arg:{active:e,handler:s}},i){if("function"!=typeof s)throw new Error("v-click-outside: missing required handler argument.");!0===e&&o(t,s,i)},update(t,{arg:{active:e,handler:s}},n){e&&!i.has(t)?o(t,s,n):!e&&i.has(t)&&l(t)},unbind(t){l(t)}}},5998:(t,e,s)=>{s.r(e),s.d(e,{default:()=>f});var i=s(5261),o=s(7387),l=s(5908),n=s(3589),c=s(7335);const{$:r,MAActionFramework:a}=window,d={components:{ActionSheet:c.Z},props:{record:{type:Object,required:!0},isFullScreen:{type:Boolean,default:!1},columnWidthPercent:{type:String,default:"200px"},totalColumnWidth:{type:String,default:"100%"}},data:()=>({actionButtons:[],showActions:!1}),computed:{tooltips(){return this.record.tooltips||[]},shortHandTooltipInfo(){const[t,e]=this.tooltips;return{label:t.label,address:e.label}}},methods:{updateSelections(){this.$emit("update-selected-records",this.record)},getButtons(){this.actionButtons=[];const t=window.getProperty(window.userSettings||{},"ButtonSetSettings.tooltipLayout",!1)||[];t.length>0?t.forEach((t=>{this.actionButtons.push({isHeader:!0,label:t.Label});const{Columns:e=[]}=t;e.forEach((t=>{t.forEach((t=>{let e,s={};if("Custom Action"===t.Type&&window.MAActionFramework.customActions[t.Label])e=window.MAActionFramework.customActions[t.Label],s={...s,...window.MAActionFramework.customActions[t.Label]};else{if(!window.MAActionFramework.standardActions[t.Action||t.Label])return;e=window.MAActionFramework.standardActions[t.Action||t.Label],s={...s,...window.MAActionFramework.standardActions[t.Action||t.Label]}}s.Modes.includes("Mobile")&&this.actionButtons.push({label:s.Label,action:t.Label,type:e.Type})}))}))})):this.actionButtons.push({label:"No Mass Actions Found"})},viewMarker(){try{const t=r(`#PlottedQueriesTable .PlottedRowUnit[qid="${this.record.qid}"]`).data()||{},{records:e={}}=t,s=e[this.record.id]||{},{marker:i}=s;window.Plotting.marker_Click.call(i)}catch(t){console.warn("unable to locate marker")}},handleTooltipAction(t){const e="Custom Action"===t.type?a.customActions[t.action]||null:a.standardActions[t.action]||null;if("Iframe"===e);else if("NewWindow"===e.Action){const t={recString:""};e.ActionValue.indexOf("{records}")>=0&&(t.records=!0);let s=`${e.ActionValue}${-1===e.ActionValue.indexOf("?")?"?noparams":""}&Button=${encodeURIComponent(e.Label)}&RecordId=${this.tooltip__record.record.Id}`;if("GET"===e.Options.method)e.Options.addRecords&&(s+=`&${e.Options.paramName}=${this.tooltip__record.Id}`),window.ma_navigateToUrl(s,"url","blank");else{const t={};e.Options.addRecords&&(t[e.Options.paramName]=this.tooltip__record.Id),window.openNewWindow("POST",s,t,"_blank")}}else if("Check In"===t.action||"Check Out"===t.action)e.ActionValue.call(this,{buttonInfo:t,records:[this.tooltip__record]}).then((e=>{window.MA.enabledFeatures.autoCheckOut||"Check Out"===t.action?(t.label=this.$Labels.ActionFramework_Check_In,t.action="Check In"):(t.label=this.$Labels.ActionFramework_Check_Out,t.action="Check Out"),t.checkInId=e}));else{const s=this.getFormattedActionOptions();s.button=t,e.ActionValue.call(this,s)}},getFormattedActionOptions(){const t=r(`#PlottedQueriesTable .PlottedRowUnit[qid="${this.record.qid}"]`).data()||{},{records:e={}}=t;return{records:[e[this.record.id]||{}]}}}};var h=s(1900);const u=(0,h.Z)(d,(function(){var t=this,e=t.$createElement,s=t._self._c||e;return s("div",{staticClass:"slds-grid slds-gutters list-row slds-p-vertical_xx-small slds-grid_vertical-align-center",style:{"min-width":t.totalColumnWidth},attrs:{"data-id":t.record.id}},[s("div",{staticClass:"slds-col checkbox-column list-column-small slds-p-left_large",staticStyle:{"padding-left":"1.0rem"}},[s("div",{staticClass:"slds-grid slds-grid_vertical-align-center"},[s("div",{staticClass:"ma-checkbox-wrap list-checkbox"},[s("label",{staticClass:"ma-checkbox"},[s("input",{directives:[{name:"model",rawName:"v-model",value:t.record.selected,expression:"record.selected"}],staticClass:"listRowCheckbox",attrs:{name:"checkbox",type:"checkbox"},domProps:{checked:t.record.selected,checked:Array.isArray(t.record.selected)?t._i(t.record.selected,null)>-1:t.record.selected},on:{change:[function(e){var s=t.record.selected,i=e.target,o=!!i.checked;if(Array.isArray(s)){var l=t._i(s,null);i.checked?l<0&&t.$set(t.record,"selected",s.concat([null])):l>-1&&t.$set(t.record,"selected",s.slice(0,l).concat(s.slice(l+1)))}else t.$set(t.record,"selected",o)},t.updateSelections]}}),t._v(" "),s("span",{staticClass:"ma-checkbox-faux"}),t._v(" "),s("span",{staticClass:"ma-checkbox-label"})])])])]),t._v(" "),s("div",{directives:[{name:"show",rawName:"v-show",value:t.isFullScreen,expression:"isFullScreen"}],staticClass:"slds-col list-column-small"},[s("div",{on:{click:t.getButtons}},[s("ActionSheet",{attrs:{doDetach:!0,options:t.actionButtons},on:{select:t.handleTooltipAction,hide:function(e){t.showActions=!1}}})],1)]),t._v(" "),s("div",{staticClass:"slds-col list-column-small",staticStyle:{width:"35px","min-width":"35px","max-width":"35px"}},[s("div",{staticClass:"ma-icon map-marker"},[s("img",{staticClass:"legendMarkerImg",attrs:{src:t.record.imgURL}})])]),t._v(" "),s("div",{directives:[{name:"show",rawName:"v-show",value:!t.isFullScreen,expression:"!isFullScreen"}],staticClass:"slds-col slds-list-item-container"},[s("div",{staticClass:"slds-grid slds-grid_vertical-align-center list-item_clickable-area",on:{click:t.viewMarker}},[s("div",{staticClass:"slds-p-vertical_x-small"},[s("div",{staticClass:"ma-listview-item-text list-item_text",staticStyle:{"white-space":"pre-wrap","max-width":"100%"}},[t._v("\n                    "+t._s(t._f("decode")(t.shortHandTooltipInfo.label))+"\n                ")]),t._v(" "),s("div",{staticClass:"ma-listview-item-subtext list-item_subtext",staticStyle:{"white-space":"pre-wrap","max-width":"100%"}},[t._v("\n                    "+t._s(t._f("decode")(t.shortHandTooltipInfo.address))+"\n                ")])]),t._v(" "),t._m(0),t._v(" "),t._m(1)])]),t._v(" "),s("div",{staticClass:"slds-col"},[s("div",{staticClass:"slds-grid slds-grid_vertical-align-center slds-gutters"},t._l(t.tooltips,(function(e,i){return s("div",{directives:[{name:"show",rawName:"v-show",value:t.isFullScreen,expression:"isFullScreen"}],key:i,staticClass:"sortable-column slds-col slds-p-horizontal_xx-small",style:{width:t.columnWidthPercent+"%","min-width":"200px"}},[t._v("\n                "+t._s(t._f("decode")(e.label))+"\n            ")])})),0)])])}),[function(){var t=this.$createElement,e=this._self._c||t;return e("div",{staticClass:"ma-listview-item-meta slds-col_bump-right"},[e("div",{staticClass:"ma-listview-distance"},[e("span",{staticClass:"ma-listview-distance-value"})])])},function(){var t=this.$createElement,e=this._self._c||t;return e("div",{staticClass:"slds-p-left_medium slds-p_vertical_medium slds-p-right_x-small slds-grid slds-grid_align-end slds-grid_vertical-align-center"},[e("span",{staticClass:"layer-item_chevron ma-icon ma-icon-chevronright"})])}],!1,null,"32e183a0",null).exports;var m=s(9159);const{getProperty:p,$:w}=window,v={components:{ActionSheet:c.Z,ListRow:u,ListViewSearch:()=>({...(0,n.Z)(),component:s.e(3628).then(s.bind(s,9207)),error:m.Z})},props:{selectedQuery:{type:String,required:!0},isFullScreen:{type:Boolean,required:!0},isLoading:{type:Boolean,default:!1}},data:()=>({showMassActions:!1,showSortOptions:!1,massActionButtons:[],listViewColumns:[],orderedListViewRecords:[],selectedRecords:{},sortedColumns:[],listRecords:[],listIndex:0,listRecordsToLoadOnScroll:50,loadingListRows:!1,selectedRecordCount:0,selectAllRecords:!1,showListViewSearch:!1,listViewRecords:[],filterInfo:{},currentFilters:[]}),computed:{...(0,l.mapGetters)("mainNavBar",{mainNavBar__listView:"listView"}),computedMarkersSelected(){return(0,i.N4)(this.$Labels.Layers_Markers_Selected,[this.selectedRecordCount])},filterText(){let t=this.$Labels.MA_FILTER;return this.currentFilters.length>0&&(t=(0,i.N4)(this.$Labels.MA_Num_Filters,[this.currentFilters.length])),t},columnWidthPercent(){const t=this.listViewColumns.length;return`${Math.floor(100/t)}%`},totalColumnWidth(){const t=200*this.listViewColumns.length;return this.isFullScreen?`${Math.floor(t+135)}px`:"100%"}},watch:{selectedQuery(){this.updateListView()}},mounted(){""!==this.selectedQuery&&this.build()},created(){this.$bus.$on("refresh-list-view",this.updateListView)},destroyed(){this.$bus.$off("refresh-list-view")},methods:{build(){this.getListViewActions(),this.updateListView()},handleMassAction(t){const e=this,s=t.type,i=t.action,o=t.label,l=[];w("#PlottedQueriesTable .PlottedRowUnit").each(((t,s)=>{const i=w(s);if(i.hasClass("savedQuery")){const t=(i.data()||{}).qid||"",s=e.selectedRecords[t]||{};w.each(i.data("records"),((t,e)=>{const i=s[t]||!1;(e.isVisible||e.isClustered||e.isScattered)&&i&&l.push(e)}))}}));const n="Custom Action"===s?window.MAActionFramework.customActions[o]||null:window.MAActionFramework.standardActions[i||o]||null;if(n){const{Action:t=""}=n;if("Javascript"===t)0===l.length?window.MAToastMessages.showMessage({message:"No markers selected"}):n.ActionValue.call(this,{records:l,isMassAction:!0});else if("NewWindow"===t){const t={recString:""};w.each(l||[],((e,s)=>{const i=s.record.Id;t.recString+=""===t.recString?i:`,${i}`}));let e=n.ActionValue;if("GET"===n.Options.method)n.Options.addRecords&&(e=n.ActionValue+(n.ActionValue.indexOf("?"),`?${n.Options.paramName}=${t.recString}`)),window.open(e);else{const s={};n.Options.addRecords&&(s[n.Options.paramName]=t.recString),e.indexOf("?")>-1&&e.split("?")[1].split("&").forEach((t=>{const e=t.split("=");if(2===e.length){const[t,i]=e;s[t]=i}})),window.openNewWindow("POST",e,s,"_blank")}}}},updateListView(){return new Promise((t=>{this.sortedColumns=[],this.clearList(),this.$nextTick((()=>{this.updateFilters(),this.updateRecordOrderList(),this.buildSortListFromQuery(),this.selectedRecords[this.selectedQuery]={},this.updateRecordsInList().then((()=>{this.updateSelectedCount(),t()}))}))}))},refreshListView(){return new Promise((t=>{this.clearList(),this.$nextTick((()=>{this.updateFilters(),this.updateRecordOrderList(),this.updateRecordsInList().then((()=>{this.updateSelectedCount(),t()}))}))}))},filterResults(t){this.filterInfo[t.qid]=t,this.refreshListView()},toggleSelectAllRecords(){this.listRecords.forEach((t=>{t.selected=this.selectAllRecords})),this.selectedRecords[this.selectedQuery]||(this.selectedRecords[this.selectedQuery]={}),this.selectAllRecords?this.orderedListViewRecords.forEach((t=>{this.selectedRecords[this.selectedQuery][t]=!0})):this.selectedRecords[this.selectedQuery]={},this.updateSelectedCount()},updateSortList(t){let e="";e="asc"===t.sort?"desc":"desc"===t.sort?"":"asc";const s=this.sortedColumns.findIndex((e=>e.index===t.index));s>-1?this.sortedColumns.splice(s,1):2===this.sortedColumns.length&&this.sortedColumns.shift(),t.sort=e,""!==e&&this.sortedColumns.push(t);const i=this.sortedColumns.map((t=>t.index));this.listViewColumns.forEach((t=>{const e=t.index;i.includes(e)||(t.sort="")}))},sortList(t){this.updateSortList(t),this.reorderRows()},getListViewActions(){const t=p(window.userSettings||{},"ButtonSetSettings.massActionLayout",!1)||[];t.length>0?t.forEach((t=>{this.massActionButtons.push({isHeader:!0,label:t.Label});const{Buttons:e=[]}=t;e.forEach((t=>{let e,s={};if("Custom Action"===t.Type&&window.MAActionFramework.customActions[t.Label])e=window.MAActionFramework.customActions[t.Label],s={...s,...window.MAActionFramework.customActions[t.Label]};else{if(!window.MAActionFramework.standardActions[t.Action||t.Label])return;e=window.MAActionFramework.standardActions[t.Action||t.Label],s={...s,...window.MAActionFramework.standardActions[t.Action||t.Label]}}s.Modes.includes("Mobile")&&this.massActionButtons.push({label:s.Label,action:t.Label,type:e.Type})}))})):this.massActionButtons.push({label:"No Mass Actions Found"})},getTooltips(){const t=w(`#PlottedQueriesTable .PlottedRowUnit[qid="${this.selectedQuery}"]`).data()||{},{tooltips:e=[]}=t,s=[...e];return s.splice(1,0,{DisplayType:"STRING",FieldName:"FormattedAddress_MA",FieldLabel:"Address",ActualFieldName:"FormattedAddress_MA",describe:{type:"string",label:"Address",name:"Address",soapType:"xsd:string"},soapType:"STRING",needsLink:!1}),s},clearList(){this.listIndex=0,this.listRecords=[],document.getElementById("listScrollingBodyFull").scrollTop=0},updateFilters(){const t=this.filterInfo[this.selectedQuery]||{};this.currentFilters=t.filters||[]},updateRecordOrderList(){let t=[];const e=this.filterInfo[this.selectedQuery];if(e)t=e.records;else{const e=w(`#PlottedQueriesTable .PlottedRowUnit[qid="${this.selectedQuery}"]`).data()||{},{recordList:s=[]}=e;t=s}this.orderedListViewRecords=t},buildSortListFromQuery(){this.listViewColumns=[],""!==this.selectedQuery&&this.getTooltips().forEach(((t,e)=>{let s=p(t,"describe.soapType",!1)||"string";s=String(s).toLowerCase(),s.indexOf("double")>-1&&(s="number"),this.listViewColumns.push({label:t.FieldLabel,index:e,sort:"",value:String(t.ActualFieldName).replace("maps__",""),type:s})}))},updateRecordsInList(){return new Promise((t=>{const e=w(`#PlottedQueriesTable .PlottedRowUnit[qid="${this.selectedQuery}"]`),s=e.data()||{},{records:i={}}=s,l={},n=e.find(".renderButtons .item-selectable .on");for(let t=0;t<n.length;t++)l[n[t].getAttribute("data-renderAs")]=!0;const c=this.listIndex,r=[...this.orderedListViewRecords].splice(c,this.listRecordsToLoadOnScroll);if(r.length>0){this.loadingListRows=!0,this.listIndex=this.listIndex+this.listRecordsToLoadOnScroll+1;const e=this.getTooltips(),l=this.selectedRecords[this.selectedQuery]||{};r.forEach((t=>{const n=i[t],{marker:c}=n,r=c.getIcon(),a={id:n.Id,qid:s.qid,imgURL:r.url,selected:l[n.Id],tooltips:[]};e.forEach((t=>{a.tooltips.push({label:(0,o.m9)(window.formatTooltip(n,t,!0)),needsLink:t.needsLink,updateable:t.Updateable,updateField:t.updateField})})),(n.isClustered||n.isVisible||n.isScattered)&&n.listViewVisible&&this.listRecords.push(a)})),this.loadingListRows=!1,t()}else t()}))},loadDataOnScroll(t){const{target:e}=t;e?e.scrollHeight-e.scrollTop-e.clientHeight<1&&this.updateRecordsInList():console.warn("target missing: scrolling list view error, rows will be missing.")},updateSelectedRecords(t){const{qid:e="",id:s="",selected:i=!1}=t;if(i)this.selectedRecords[e]||(this.selectedRecords[e]={}),this.selectedRecords[e][s]=!0;else try{delete this.selectedRecords[e][s]}catch(t){}this.updateSelectedCount()},updateSelectedCount(){const t=this.selectedRecords[this.selectedQuery]||{};this.selectedRecordCount=Object.keys(t).length;const e=this.selectedRecordCount===this.orderedListViewRecords.length;this.selectAllRecords=e},reorderRows(){if(0===this.sortedColumns.length)return;const t=this,[e,s]=this.sortedColumns;this.$emit("update:isLoading",!0);const i=["sortBy","desc"===e.sort],o="number"===e.type;let l=!1,n=[];if(s){const t="desc"===s.sort;n=["sortBy2",t],l="number"===s.type}const c=w(`#PlottedQueriesTable .PlottedRowUnit[qid="${this.selectedQuery}"]`).data()||{},{records:r={}}=c;let a=0;const d=Object.keys(r)||[],h=d.length,u=[];setTimeout((function m(){if(a<h){let t=0;for(;t<500&&a<h;){t++;const i=d[a],n=r[i];let c=null,h=null;const m=p(n,e.value,!1);if(o){const t=Number(m);c=Number.isNaN(t)?null:t}else c=m?String(m):"";if(s){const t=p(n,s.value,!1);if(l){const e=Number(t);h=Number.isNaN(e)?null:e}else h=t?String(t):""}u.push({sortBy:c,id:a,recId:n.Id,sortBy2:h}),a++}setTimeout(m,1)}else if(u.length>0){t.sortHelper(u,i,n);const e=u.map((t=>t.recId));t.sortFilteredList(e),c.recordList=e,t.refreshListView().then((()=>{t.$emit("update:isLoading",!1)}))}else t.$emit("update:isLoading",!1),window.MAToastMessages.showMessage({message:"List View",subMessage:"Appears we have nothing sort..."})}),1)},sortFilteredList(t){const e=this.filterInfo[this.selectedQuery];if(e){const s=e.records,i=[];t.forEach((t=>{s.includes(t)&&i.push(t)})),e.records=i}},sortHelper(){const t=arguments;let e,s,i,o,l,n,c;return"boolean"==typeof arguments[arguments.length-1]?(e=arguments[arguments.length-1],s=arguments.length-1):(e=!1,s=arguments.length),t[0].sort(((r,a)=>{for(c=1;c<s;c++)if(i=t[c],"string"!=typeof i?(o=i[1],i=i[0],l=r[t[c][0]],n=a[t[c][0]]):(o=!1,l=r[t[c]],n=a[t[c]]),!1===e&&"string"==typeof l&&(l=l.toLowerCase(),n=n.toLowerCase()),o){if(l>n)return-1;if(l<n)return 1}else{if(l<n)return-1;if(l>n)return 1}return 0}))},showListViewModal(){this.showListViewSearch=!0}}},f=(0,h.Z)(v,(function(){var t=this,e=t.$createElement,s=t._self._c||e;return s("div",{staticClass:"slds-grid slds-grid_vertical slds-col",staticStyle:{height:"100%"},attrs:{id:"listBody"}},[s("div",{staticClass:"slds-grid slds-grid_vertical-align-center slds-shrink-none slds-p-vertical_x-small slds-border_bottom"},[s("div",{staticClass:"slds-p-left_medium"},[s("div",{staticClass:"ma-checkbox-wrap"},[s("label",{staticClass:"ma-checkbox"},[s("input",{directives:[{name:"model",rawName:"v-model",value:t.selectAllRecords,expression:"selectAllRecords"}],attrs:{name:"checkbox",type:"checkbox"},domProps:{checked:Array.isArray(t.selectAllRecords)?t._i(t.selectAllRecords,null)>-1:t.selectAllRecords},on:{change:[function(e){var s=t.selectAllRecords,i=e.target,o=!!i.checked;if(Array.isArray(s)){var l=t._i(s,null);i.checked?l<0&&(t.selectAllRecords=s.concat([null])):l>-1&&(t.selectAllRecords=s.slice(0,l).concat(s.slice(l+1)))}else t.selectAllRecords=o},t.toggleSelectAllRecords]}}),t._v(" "),s("span",{staticClass:"ma-checkbox-faux"}),t._v(" "),s("span",{staticClass:"ma-checkbox-label listViewTotalSelections narrowListText"},[t._v(t._s(t._f("decode")(t.computedMarkersSelected)))])])])]),t._v(" "),s("div",{staticClass:"slds-p-left_x-small slds-col_bump-right"},[s("ActionSheet",{staticClass:"narrowListText",attrs:{doDetach:!0,options:t.massActionButtons,buttonText:t.$Labels.MA_Actions},on:{select:t.handleMassAction,hide:function(e){t.showMassActions=!1}}})],1),t._v(" "),s("div",{staticClass:"slds-p-left_x-small"},[s("button",{staticClass:"slds-button addFilter slds-grid slds-grid_vertical-align-center narrowListText",on:{click:t.showListViewModal}},[s("div",[t._v(t._s(t.filterText))]),t._v(" "),t._m(0)])]),t._v(" "),s("div",{staticClass:"slds-p-left_medium ma-form-control icon-left icon-right",staticStyle:{display:"none"}},[s("input",{staticClass:"ma-input clearable-input",staticStyle:{"line-height":"32px"},attrs:{id:"searchInputList",placeholder:t._f("decode")(t.$Labels.MA_Search),type:"text"}}),t._v(" "),s("div",{staticClass:"ma-icon icon-left ma-icon-search"}),t._v(" "),s("div",{staticClass:"ma-icon icon-right ma-icon-clear",staticStyle:{display:"none"},attrs:{onclick:"MALayers.clearAllSearch();"}})]),t._v(" "),s("div",{staticClass:"slds-p-left_medium slds-p-right_x-small"},[s("ActionSheet",{directives:[{name:"show",rawName:"v-show",value:!t.isFullScreen,expression:"!isFullScreen"}],staticClass:"narrowListText",attrs:{doDetach:!0,options:t.listViewColumns,buttonText:t._f("decode")(t.$Labels.MA_SORT),buttonIcon:"ma-icon-sort"},on:{select:t.sortList,hide:function(e){t.showSortOptions=!1}}})],1)]),t._v(" "),s("div",{staticClass:"slds-col list-body-scrolling-body slds-scrollable momentum-scrolling-y",class:{in:t.mainNavBar__listView,"small-list":!t.isFullScreen},staticStyle:{"overflow-y":"scroll",height:"100%"},attrs:{id:"listScrollingBodyFull"},on:{"&scroll":function(e){return t.loadDataOnScroll.apply(null,arguments)}}},[s("div",{directives:[{name:"show",rawName:"v-show",value:t.isFullScreen,expression:"isFullScreen"}],staticClass:"slds-grid slds-gutters flex-table ma-table--sortable slds-grid_vertical-align-center",staticStyle:{"min-height":"40px"}},[s("div",{staticClass:"slds-col",staticStyle:{width:"50px","min-width":"50px","max-width":"50px"}}),t._v(" "),s("div",{staticClass:"slds-col",staticStyle:{width:"50px","min-width":"50px","max-width":"50px"}}),t._v(" "),s("div",{staticClass:"slds-col",staticStyle:{width:"35px","min-width":"35px","max-width":"35px"}}),t._v(" "),s("div",{staticClass:"slds-col"},[s("div",{staticClass:"slds-grid"},t._l(t.listViewColumns,(function(e,i){return s("div",{key:i,staticClass:"sortable-column header slds-col slds-p-horizontal_small slds-align-middle",class:{headerSortUp:"asc"===e.sort,headerSortDown:"desc"===e.sort},style:{width:t.columnWidthPercent,"min-width":"200px"},attrs:{"data-sort":e.sort},on:{click:function(s){return t.sortList(e)}}},[s("div",{staticClass:"sortable-column-inner"},[t._v("\n                            "+t._s(t._f("decode")(e.label))+"\n                        ")])])})),0)])]),t._v(" "),t._l(t.listRecords,(function(e,i){return s("ListRow",{key:i,attrs:{record:e,columnWidthPercent:t.columnWidthPercent,totalColumnWidth:t.totalColumnWidth,isFullScreen:t.isFullScreen},on:{"update-selected-records":t.updateSelectedRecords}})}))],2),t._v(" "),t.showListViewSearch?s("ListViewSearch",{attrs:{selectedQuery:t.selectedQuery,currentFilters:t.currentFilters},on:{close:function(e){t.showListViewSearch=!1},filterResults:t.filterResults}}):t._e()],1)}),[function(){var t=this.$createElement,e=this._self._c||t;return e("div",[e("span",{staticClass:"slds-button__icon slds-button__icon_right ma-icon ma-icon-filter"})])}],!1,null,"e1c15940",null).exports},7335:(t,e,s)=>{s.d(e,{Z:()=>n});var i=s(5264);const{$:o}=window,l={name:"ActionSheet",directives:{"click-outside":i.Z},props:{options:{type:Array,required:!0},doDetach:{type:Boolean,default:!0},labelKey:{type:String,default:"label"},buttonText:{type:String,default:""},buttonIcon:{type:String,default:""},hideOverride:{type:Boolean,default:!1},selectedItems:{type:Array,default:()=>[]},buttonType:{type:String,default:""}},data:()=>({container:null,showOptions:!1,styleObject:{},window:{height:0,width:0},uid:"action-sheet"}),computed:{isPhone(){return this.window.width<769},computedIcon(){let t="";return""!==this.buttonIcon?t=this.buttonIcon:""===this.buttonText&&(t="ma-icon-threedots-vertical"),t},actionSheetClickOutsideOptions(){return{active:this.showOptions,handler:this.hideActionSheet}}},watch:{isPhone(){this.showOptions=!1}},created(){window.addEventListener("resize",this.handleResize),this.handleResize()},destroyed(){window.removeEventListener("resize",this.handleResize),this.hideActionSheet()},methods:{handleResize(){this.window.width=window.innerWidth,this.window.height=window.innerHeight},returnItem(t){t.isHeader||(this.$emit("select",t),this.hideActionSheet())},hideActionSheet(){this.showOptions=!1,this.container&&(this.container.remove(),this.container=null)},detach(){if(!this.$refs.button)return;const t=document.querySelector(`.slds-scope.${this.uid}`);try{t.remove()}catch(t){}const e=this.$refs.button.getBoundingClientRect();this.container=document.createElement("div"),this.container.className=`slds-scope ${this.uid}`,this.container.appendChild(this.$refs.actions),document.body.appendChild(this.container),this.styleObject={top:`${e.top+this.$refs.button.clientHeight+o(window).scrollTop()}px`,left:`${e.left+o(window).scrollLeft()}px`,"max-height":"300px"}},adjustForClipping(){const t=this.$refs.actions.getBoundingClientRect();let e;if(e=document.documentElement.clientHeight-window.innerHeight<=0?document.documentElement.clientHeight:window.innerHeight-this.getScrollbarWidth(),t.x<0)this.styleObject.left=`${this.$refs.actions.offsetLeft+Math.abs(t.x)}px`;else if(t.left+t.width>document.documentElement.clientWidth){const e=t.left+t.width-document.documentElement.clientWidth-o(window).scrollLeft();this.styleObject.left=t.left-e+"px"}const s=this.$refs.actions.scrollHeight,i=o(window).scrollTop();if(this.styleObject["max-height"]="300px",t.top+s>e){const o=t.top+s-i-e;this.$bus.$emit("ma-modal-scroll-by",o),this.styleObject.top=t.top-o+"px"}},disableClick(t){t.stopPropagation(),t.preventDefault()},openActionSheet(){this.showOptions=!0,this.doDetach&&this.detach(),this.$nextTick((()=>{this.doDetach&&this.adjustForClipping(),this.options.forEach(((t,e)=>{const s=t,i=this.$refs.optionItem[e];s.isHeader&&i.addEventListener("click",this.disableClick,!0)}))}))}}},n=(0,s(1900).Z)(l,(function(){var t=this,e=t.$createElement,s=t._self._c||e;return s("div",{directives:[{name:"click-outside",rawName:"v-click-outside:[actionSheetClickOutsideOptions]",arg:t.actionSheetClickOutsideOptions}],staticClass:"action-sheet-wrapper slds-scope"},[s("div",{ref:"button",staticClass:"slds-grid slds-grid_vertical-align-center",on:{click:t.openActionSheet}},[s("div",{staticClass:"slds-button slds-col slds-truncate"},[t._v(t._s(t._f("decode")(t.buttonText)))]),t._v(" "),""!==t.computedIcon?s("div",[s("button",{staticClass:"slds-button slds-button_icon slds-button_icon-container",class:[t.buttonType]},[s("span",{staticClass:"slds-button__icon ma-icon",class:[t.computedIcon]})])]):t._e()]),t._v(" "),s("div",{directives:[{name:"show",rawName:"v-show",value:t.showOptions,expression:"showOptions"}],ref:"actions",staticClass:"ma-action-sheet-wrap in slds-grid slds-grid_vertical slds-grid_align-end",style:t.isPhone?{}:t.styleObject},[s("div",{directives:[{name:"show",rawName:"v-show",value:t.isPhone,expression:"isPhone"}],staticClass:"action-sheet_mask",on:{click:t.hideActionSheet}}),t._v(" "),s("div",{staticClass:"action-sheet_wrap slds-grid slds-grid_vertical"},[s("div",{staticClass:"action-sheet_content slds-scrollable"},t._l(t.options,(function(e,i){return s("div",{key:i,ref:"optionItem",refInFor:!0,staticClass:"action-sheet_item slds-grid slds-p-around_medium",class:{"header slds-text-title_caps slds-section__title slds-theme--shade":e.isHeader,"slds-is-selected":t.selectedItems.includes(e.id)},on:{click:function(s){return t.returnItem(e)}}},[t._m(0,!0),t._v(" "),s("div",{staticClass:"slds-col"},[s("span",{staticStyle:{"word-break":"break-word"}},[t._v(t._s(t._f("decode")(e[t.labelKey])))])])])})),0),t._v(" "),s("div",{staticClass:"slds-button slds-button_neutral action-sheet_close-button",on:{click:t.hideActionSheet}},[t._v("\n                "+t._s(t._f("decode")(t.$Labels.MA_Close))+"\n            ")])])])])}),[function(){var t=this.$createElement,e=this._self._c||t;return e("div",{staticClass:"action-sheet_selected-icon slds-p-right_medium"},[e("span",{staticClass:"slds-icon slds-icon_x-small ma-icon ma-icon-check"})])}],!1,null,"44c08aa9",null).exports}}]);