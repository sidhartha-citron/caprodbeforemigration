"use strict";(globalThis.webpackChunkmaps_desktop=globalThis.webpackChunkmaps_desktop||[]).push([[9925],{9289:(e,t,s)=>{s.r(t),s.d(t,{default:()=>o});var a=s(5908);const{async:r,jQuery:i}=window,n={components:{},data:()=>({showRefreshQueryButton:!1,refreshingLayers:!1}),computed:{...(0,a.mapGetters)("layers",{layers__plottedLayers:"plottedLayers"}),plottedSFDCLayers(){return this.layers__plottedLayers.filter((e=>"marker"===e.type&&!1===e.isLoading)).length},plottedDataLayers(){return this.layers__plottedLayers.filter((e=>"datalayer"===e.type||"arcgisonline"===e.type)).length}},created(){this.$bus.$on("check-refresh-layers-button",this.checkValidLayers)},methods:{...(0,a.mapMutations)("mainNavBar",{mainNavBar__toggleSubView:"toggleSubView"}),showListView(){this.mainNavBar__toggleSubView({doShow:!0,subView:"listView"})},showLegendInfo(){this.mainNavBar__toggleSubView({doShow:!0,subView:"legend"})},checkValidLayers(){this.showRefreshQueryButton=!1,this.$nextTick((()=>{let e=!1;this.plottedSFDCLayers+this.plottedDataLayers>0&&(e=!0),this.showRefreshQueryButton=e}))},refreshAllLayers(){if(this.refreshingLayers)return;this.refreshingLayers=!0,this.$bus.$emit("hide-single-view");const e=this.layers__plottedLayers.filter((e=>"datalayer"===e.type||"marker"===e.type||"arcgisonline"===e.type)),t=r.queue(((e,t)=>{const s=e.hasClass("DataLayer"),a=e.attr("type");if(s)window.MADemographicLayer.refreshDataLayer(e,{stayOnMapTab:!0},(()=>{e.removeClass("visibleLoading"),i("#layersIndividualWrap .plotLayer").prop("checked","checked"),t()}));else if("arcgisonline"===a){const s=e.attr("qid");window.ArcGIS.refreshLayer(s),t()}else window.Plotting.refreshQuery(e,null,{force:!0,stayOnMapTab:!0}).then((()=>{t()}))}));t.concurrency=2,e.forEach((e=>{const s=e.qid,a=i(`#PlottedQueriesTable .PlottedRowUnit[qid="${s}"]`);a.length>0&&t.push(a)})),t.drain=()=>{window.MAToastMessages.showSuccess({message:"Done"}),this.$bus.$emit("refresh-list-view"),this.refreshingLayers=!1}}}},o=(0,s(1900).Z)(n,(function(){var e=this,t=e.$createElement,s=e._self._c||t;return s("div",[s("div",{staticClass:"ma-tablet-map-buttons"},[s("button",{staticClass:"ma-button map-secondary-view-button ma-button--white",attrs:{id:"mapListButton"},on:{click:e.showListView}},[s("span",{staticClass:"ma-icon ma-icon-table"}),e._v("\n            "+e._s(e._f("decode")(e.$Labels.MA_List))+"\n        ")]),e._v(" "),s("button",{staticClass:"ma-button map-secondary-view-button ma-button--white",attrs:{id:"mapLegendButton"},on:{click:e.showLegendInfo}},[e._v("\n            "+e._s(e._f("decode")(e.$Labels.MA_MARKER_LEGEND))+"\n        ")])]),e._v(" "),s("button",{staticClass:"ma-button ma-button--blue ma-button--shadow ma-button--circle-large",class:{in:e.showRefreshQueryButton&&!e.refreshingLayers},attrs:{id:"mapMarkerRefreshButton"},on:{click:e.refreshAllLayers}},[s("span",{staticClass:"ma-icon ma-icon-refresh-markers"})])])}),[],!1,null,"308f4bc6",null).exports}}]);