webpackJsonp([67],{399:function(e,t,n){var i=n(13)(n(400),n(401),null,null,null);e.exports=i.exports},400:function(e,t,n){"use strict";Object.defineProperty(t,"__esModule",{value:!0});var i=n(61),r=n.n(i),s=window.jQuery;t.default={props:{layerData:{type:Object,default:function(){},required:!0}},computed:{qid:function(){return this.layerData.qid}},mounted:function(){this.buildLegend()},methods:{buildLegend:function(){var e=window.ArcGIS.findLayerById(this.qid);s("#layersIndividualBody .legend-wrap").html(e.legend),r()(e.sublayers).forEach(function(t){var n=e.sublayers[t];s(window.escapeElementId(n.legendId)).prop("checked",n.visible)})}}}},401:function(e,t){e.exports={render:function(){var e=this.$createElement;this._self._c;return this._m(0)},staticRenderFns:[function(){var e=this.$createElement,t=this._self._c||e;return t("div",[t("div",{staticClass:"ma-section-title ma-section-title",staticStyle:{padding:"18px 16px 16px"}},[this._v("Sublayers")]),this._v(" "),t("div",{staticClass:"legend-wrap background--white"})])}]}}});