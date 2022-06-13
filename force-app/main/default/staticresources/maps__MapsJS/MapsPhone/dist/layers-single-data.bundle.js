"use strict";(globalThis.webpackChunkmaps_desktop=globalThis.webpackChunkmaps_desktop||[]).push([[4236],{5409:(e,t,s)=>{s.r(t),s.d(t,{default:()=>o});const{$:a,MA:i}=window,l={props:{layerData:{type:Object,required:!0},isLoading:{type:Boolean,default:!1}},data:()=>({totalMarkers:0,visibleMarkers:0,legendRowSelections:{},legendRowTimeout:null,showAllLegendData:!1,legendHeader:"",legendSubText:""}),computed:{layerType(){return this.layerData.type},layerQID(){return this.layerData.qid},plottedLayer(){return a(`#PlottedQueriesTable .DataLayer[qid="${this.layerQID}"]`)},plottedInfo(){return this.plottedLayer.data()||{}},isPolygonLayer(){let e=!1;return this.plottedInfo.censusLayer&&(e=!0),e},legendInfo:{get(){return this.plottedInfo.legend||{}},set(e){this.plottedInfo.legend=e}},legendRows(){return this.legendInfo.rows},legendShowText(){let e=this.$Labels.MA_Show_All;return this.showAllLegendData&&(e=this.$Labels.MA_Show_Less),e}},mounted(){this.build()},methods:{build(){this.updateLegend()},toggleVisibleLegend(){this.showAllLegendData=!this.showAllLegendData},updateLegend(){let e=0,t=0;const s=Object.keys(this.legendRows)||[];if(this.isPolygonLayer)this.showAllLegendData=!0,this.legendHeader=this.legendInfo.title||"",this.legendSubText=this.legendInfo.subTitle||"";else{for(let a=0;a<s.length;a++){const i=s[a],l=this.legendRows[i];e+=l.totalmarkers,t+=l.count}this.visibleMarkers=t,this.totalMarkers=e}},toggleRow(e){clearTimeout(this.legendRowTimeout),this.legendRowTimeout=null,this.legendRowSelections[e.legendId]=e.active,this.legendRowTimeout=setTimeout((()=>{this.toggleRows().then((()=>{this.build()}))}),250)},toggleRows(){return new Promise((e=>{this.updateDomInfo(),this.resetLegendCounts();const t=window.MADemographicLayer.getRenderModes(a(".DataLayer")),s=this.plottedInfo,{plottedLayer:l,legendRowSelections:o}=this;let r=1e3;i.Map.hitTestShapeMgr.hasShapes()&&i.Util.isIE()?r=20:i.Map.hitTestShapeMgr.hasShapes()&&(r=500);const n=s.records||{},d=Object.keys(n),c=d.length,h=[],g=this.legendRows,u=t.filter((e=>"Cluster"===e)).length>0,p=window.getProperty(window.userSettings||{},"InvertProximity",!1)||!1;setTimeout((function t(){if(d.length>0){l.find(".status").text(`Processing... ${d.length} remaining`);let e=0;for(;e<r&&d.length>0;){e++;const t=d.pop(),s=n[t],a=s.data.rowid;let l;try{l=g[a],l.totalmarkers++}catch(e){l={count:0,totalmarkers:0}}if(void 0===o[a]&&l.active)s.isVisible&&(l.count++,h.push(s.clusterMarker));else if(o[a])if(u){if(i.Map.hitTestShapeMgr.hasShapes()){const e=i.Map.hitTestShapeMgr.containsLatLng(s.markerCoordinate);p&&e||!p&&!e?s.isVisible=!1:(s.isVisible=!0,h.push(s.clusterMarker))}else s.isVisible=!0,h.push(s.clusterMarker);l.count++}else s.isVisible=!1}setTimeout(t,1)}else s.clusterGroup.setMap(i.map),s.clusterGroup.clearMarkers(),s.clusterGroup.addMarkers(h),s.clusterGroup.repaint(),l.find(".status").html(`Records: ${i.Util.formatNumberString(c)}`),e()}),1)}))},updateDomInfo(){const e=this.legendRowSelections,t=Object.keys(e);for(let s=0;s<t.length;s++){const a=t[s],i=e[a];this.legendInfo.rows[a].active=i}this.plottedLayer.data("legend",this.legendInfo)},resetLegendCounts(){const e=this.legendRows,t=Object.keys(e);for(let s=0;s<t.length;s++){const a=e[t[s]];a.totalmarkers=0,a.count=0}}}},o=(0,s(1900).Z)(l,(function(){var e=this,t=e.$createElement,s=e._self._c||t;return s("div",{staticClass:"layers-individual-filter-wrap"},[s("div",{staticClass:"ma-section-title ma-section-title",staticStyle:{padding:"18px 16px 16px"}},[s("span",{staticClass:"legend-title"},[e._v(e._s(e._f("decode")(e.$Labels.MA_MARKER_LEGEND)))]),e._v(" "),s("span",{directives:[{name:"show",rawName:"v-show",value:!e.isPolygonLayer,expression:"!isPolygonLayer"}],staticClass:"legend-moreless-text",staticStyle:{position:"absolute",right:"0px",top:"2px",height:"45px","line-height":"45px",padding:"0 15px"},on:{click:e.toggleVisibleLegend}},[s("span",{staticClass:"moreless-text"},[e._v(e._s(e._f("decode")(e.legendShowText)))])])]),e._v(" "),s("div",{staticClass:"pad-16-16-8 background--white"},[s("div",{staticClass:"margin-0 text--dark-blue legendField"},[s("div",{staticClass:"ma-item-name-subtitle plottinginfo-wrapper",staticStyle:{"font-size":"16px"}},[e.isPolygonLayer?s("div",[s("div",{staticClass:"margin-0 text--dark-blue legendField"},[s("strong",[e._v(e._s(e._f("decode")(e.legendHeader)))]),e._v(" "),s("div",{staticClass:"ma-item-name-subtitle plottinginfo-wrapper"},[e._v("\n                            "+e._s(e._f("decode")(e.legendSubText))+"\n                        ")])])]):s("div",[s("div",{staticClass:"status"},[e._v(e._s(e._f("decode")(e.$Labels.MA_RECORDS))+": "+e._s(e._f("decode")(e.totalMarkers)))]),e._v(" "),s("div",{staticClass:"status"},[e._v(e._s(e._f("decode")(e.totalMarkers))+" "+e._s(e._f("decode")(e.$Labels.MA_Markers_Created))+", "+e._s(e._f("decode")(e.visibleMarkers))+" "+e._s(e._f("decode")(e.$Labels.MA_Visible)))])])])])]),e._v(" "),s("div",{staticClass:"legend-wrap background--white"},e._l(e.legendRows,(function(t,a,i){return s("div",{directives:[{name:"show",rawName:"v-show",value:t.totalmarkers>0||e.showAllLegendData,expression:"row.totalmarkers > 0 || showAllLegendData"}],key:a,staticClass:"legend-item legend-row ma-form-control-wrap ma-checkbox-wrap flex-horizontal",attrs:{"data-id":a,uid:i}},[s("div",{staticClass:"flex-grow-1"},[e.isPolygonLayer?s("div",{staticClass:"ma-checkbox-label"},[e._v("\n                    "+e._s(e._f("decode")(t.label))+"\n                ")]):s("label",{staticClass:"ma-checkbox"},[s("input",{directives:[{name:"model",rawName:"v-model",value:t.active,expression:"row.active"}],staticClass:"legend-checkbox",attrs:{id:"legend-checkbox13","data-rule":i,uid:i,checked:"checked",name:"checkbox",type:"checkbox"},domProps:{checked:Array.isArray(t.active)?e._i(t.active,null)>-1:t.active},on:{change:[function(s){var a=t.active,i=s.target,l=!!i.checked;if(Array.isArray(a)){var o=e._i(a,null);i.checked?o<0&&e.$set(t,"active",a.concat([null])):o>-1&&e.$set(t,"active",a.slice(0,o).concat(a.slice(o+1)))}else e.$set(t,"active",l)},function(s){return e.toggleRow(t)}]}}),e._v(" "),s("span",{staticClass:"ma-checkbox-faux"}),e._v(" "),s("span",{staticClass:"ma-checkbox-label"},[e._v(e._s(e._f("decode")(t.label)))])])]),e._v(" "),s("div",{directives:[{name:"show",rawName:"v-show",value:!e.isPolygonLayer,expression:"!isPolygonLayer"}],staticClass:"legend-count"},[s("span",{staticClass:"visiblemarkers"},[e._v(e._s(e._f("decode")(t.count)))]),e._v(" "),s("span",{staticClass:"of"},[e._v(e._s(e._f("decode")(e.$Labels.MA_of)))]),e._v(" "),s("span",{staticClass:"totalmarkers"},[e._v(e._s(e._f("decode")(t.totalmarkers)))])]),e._v(" "),s("div",{staticClass:"legend-marker"},[e.isPolygonLayer?s("div",{staticStyle:{border:"1px solid silver",width:"20px",height:"20px"},style:{background:"#"+t.markerValue}}):s("img",{staticClass:"legend-image",staticStyle:{height:"20px","max-width":"30px"},attrs:{src:t.icon,"data-id":t.markerValue}})])])})),0)])}),[],!1,null,null,null).exports}}]);