webpackJsonp([64],{384:function(e,t,a){var s=a(13)(a(385),a(386),null,null,null);e.exports=s.exports},385:function(e,t,a){"use strict";Object.defineProperty(t,"__esModule",{value:!0});var s=a(61),i=a.n(s),l=window.$;t.default={props:{layerData:{type:Object,required:!0},isLoading:{type:Boolean,default:!1}},data:function(){return{totalMarkers:0,visibleMarkers:0,legendRowSelections:{},legendRowTimeout:null,showAllLegendData:!1}},computed:{layerType:function(){return this.layerData.type},legendInfo:{get:function(){return this.plottedInfo.legendInfo||{}},set:function(e){this.plottedInfo.legendInfo=e}},legendImages:function(){return this.plottedInfo.imgInfo||[]},layerQID:function(){return this.layerData.qid},plottedLayer:function(){var e=void 0;return"marker"===this.layerType&&(e=l('#PlottedQueriesTable .savedQuery[qid="'+this.layerQID+'"]')),e},plottedInfo:function(){return this.plottedLayer.data()||{}},legendShowText:function(){var e=this.$Labels.MA_Show_All;return this.showAllLegendData&&(e=this.$Labels.MA_Show_Less),e}},created:function(){this.build()},methods:{build:function(){this.updateLegend()},toggleVisibleLegend:function(){this.showAllLegendData=!this.showAllLegendData},updateLegend:function(){for(var e=0,t=0,a=i()(this.legendInfo)||[],s=0;s<a.length;s++){var l=a[s],n=this.legendInfo[l];e+=n.totalmarkers,t+=n.count}this.visibleMarkers=t,this.totalMarkers=e},toggleRow:function(e){var t=this;clearTimeout(this.legendRowTimeout),this.legendRowTimeout=null,this.legendRowSelections[e.legendId]=e.active,this.legendRowTimeout=setTimeout(function(){var e={plottedQuery:t.plottedLayer,rows:t.legendRowSelections};window.MAPlotting.toggleLegendRow(e,function(){window.MAPlotting.updateQueryInfo(t.plottedLayer,function(){t.legendRowSelections={},t.build(),t.$emit("toggleLoading",!1),t.plottedLayer.removeClass("loading"),t.plottedLayer.find(".queryLoader").hide(),t.plottedLayer.find(".queryIcon ").show()})})},250)}}}},386:function(e,t){e.exports={render:function(){var e=this,t=e.$createElement,a=e._self._c||t;return a("div",{staticClass:"layers-individual-filter-wrap"},[a("div",{staticClass:"ma-section-title ma-section-title",staticStyle:{padding:"18px 16px 16px"}},[a("span",{staticClass:"legend-title"},[e._v(e._s(e._f("decode")(e.$Labels.MA_MARKER_LEGEND)))]),e._v(" "),a("span",{staticClass:"legend-moreless-text",staticStyle:{position:"absolute",right:"0px",top:"2px",height:"45px","line-height":"45px",padding:"0 15px"},on:{click:e.toggleVisibleLegend}},[a("span",{staticClass:"moreless-text"},[e._v(e._s(e._f("decode")(e.legendShowText)))])])]),e._v(" "),a("div",{staticClass:"pad-16-16-8 background--white"},[a("div",{staticClass:"margin-0 text--dark-blue legendField"},[a("div",{staticClass:"ma-item-name-subtitle plottinginfo-wrapper",staticStyle:{"font-size":"16px"}},[a("div",{staticClass:"status"},[e._v(e._s(e._f("decode")(e.$Labels.MA_RECORDS))+": "+e._s(e._f("decode")(e.totalMarkers)))]),e._v(" "),a("div",{staticClass:"status"},[e._v(e._s(e._f("decode")(e.totalMarkers))+" "+e._s(e._f("decode")(e.$Labels.MA_Markers_Created))+", "+e._s(e._f("decode")(e.visibleMarkers))+" "+e._s(e._f("decode")(e.$Labels.MA_Visible)))])])])]),e._v(" "),a("div",{staticClass:"legend-wrap background--white"},e._l(e.legendInfo,function(t,s,i){return a("div",{directives:[{name:"show",rawName:"v-show",value:t.totalmarkers>0||e.showAllLegendData,expression:"row.totalmarkers > 0 || showAllLegendData"}],key:s,staticClass:"legend-item legend-row ma-form-control-wrap ma-checkbox-wrap flex-horizontal",attrs:{"data-id":s,uid:i}},[a("div",{staticClass:"flex-grow-1"},[a("label",{staticClass:"ma-checkbox"},[a("input",{directives:[{name:"model",rawName:"v-model",value:t.active,expression:"row.active"}],staticClass:"legend-checkbox",attrs:{id:"legend-checkbox13","data-rule":i,uid:i,checked:"checked",name:"checkbox",type:"checkbox"},domProps:{checked:Array.isArray(t.active)?e._i(t.active,null)>-1:t.active},on:{change:[function(a){var s=t.active,i=a.target,l=!!i.checked;if(Array.isArray(s)){var n=e._i(s,null);i.checked?n<0&&e.$set(t,"active",s.concat([null])):n>-1&&e.$set(t,"active",s.slice(0,n).concat(s.slice(n+1)))}else e.$set(t,"active",l)},function(a){return e.toggleRow(t)}]}}),e._v(" "),a("span",{staticClass:"ma-checkbox-faux"}),e._v(" "),a("span",{staticClass:"ma-checkbox-label"},[e._v(e._s(e._f("decode")(t.label)))])])]),e._v(" "),a("div",{staticClass:"legend-count"},[a("span",{staticClass:"visiblemarkers"},[e._v(e._s(e._f("decode")(t.count)))]),e._v(" "),a("span",{staticClass:"of"},[e._v("of")]),e._v(" "),a("span",{staticClass:"totalmarkers"},[e._v(e._s(e._f("decode")(t.totalmarkers)))])]),e._v(" "),a("div",{staticClass:"legend-marker"},[t.icon.indexOf("/services/images/marker")>-1||t.icon.indexOf("servlet.FileDownload")>-1?a("img",{staticClass:"legend-image",staticStyle:{height:"20px","max-width":"30px"},attrs:{src:t.icon}}):a("span",{domProps:{innerHTML:e._s(t.icon)}})])])}),0)])},staticRenderFns:[]}}});