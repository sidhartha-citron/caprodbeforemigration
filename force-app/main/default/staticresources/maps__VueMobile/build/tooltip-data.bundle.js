"use strict";(globalThis.webpackChunkmaps_desktop=globalThis.webpackChunkmaps_desktop||[]).push([[6660],{9561:(t,e,a)=>{a.r(e),a.d(e,{default:()=>i});var s=a(5908);const o={components:{},props:{tabId:{type:String,default:"notes"}},data:()=>({tooltipTabs:[]}),computed:{...(0,s.mapGetters)("tooltip",{tooltip__record:"record"})},created(){this.createDynamicTabs()},methods:{createDynamicTabs(){const{data:t={}}=this.tooltip__record,{popup:e={}}=t,{header:a=[],tabs:s=[]}=e;this.tooltipTabs.push({id:"header",rows:a}),s.forEach((t=>{this.tooltipTabs.push({id:t.tab_id,rows:t.data})}))}}},i=(0,a(1900).Z)(o,(function(){var t=this,e=t.$createElement,a=t._self._c||e;return a("div",{staticClass:"ma-tab-content-group"},t._l(t.tooltipTabs,(function(e,s){return a("div",{directives:[{name:"show",rawName:"v-show",value:t.tabId===e.id,expression:"tabId === tab.id"}],key:s,staticClass:"ma-tab-content",class:{active:t.tabId===e.id}},t._l(e.rows,(function(e,s){return a("div",{key:s,staticClass:"tooltip-segment-item"},[String(e.formatted_value).indexOf("href=")>-1?a("div",[a("label",[t._v(t._s(t._f("decode")(e.label)))]),t._v(" "),a("a",{attrs:{href:"http://"===e.value.substring(0,7)||"https://"===e.value.substring(0,8)?e.value:"http://"+e.value,target:"_blank"}},[t._v("\n                    "+t._s(t._f("decode")(e.value))+"\n                ")])]):a("div",[a("label",[t._v(t._s(t._f("decode")(e.label)))]),t._v("\n                "+t._s(t._f("decode")(e.formatted_value))+"\n            ")])])})),0)})),0)}),[],!1,null,null,null).exports}}]);