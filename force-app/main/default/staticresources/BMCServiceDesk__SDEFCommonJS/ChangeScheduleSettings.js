Ext.onReady(function(){if(typeof String.prototype.trim!=="function"){String.prototype.trim=function(){return this.replace(/^\s+|\s+$/g,"")}}var a=getColorCodeData();changeColor_html="";var b=new Ext.XTemplate('<tpl for="codes">',"<tpl if=\"values.text == '1'\">",'<tr><td colspan="6" style="padding-bottom: 4px;"><table width="100%" style="table-layout:fixed">',"<tr>",'<td width="40px" style="vertical-align:top"><div id="color{id}" class="colorCode" style="background-color:{code};" onclick = "getMouseXY(event,\'{picValue}\',\'{id}\');"></div></td>','<td class="lbl" >{title}</td>',"</table></td></tr>","</tpl>","</tpl>");changeColor_html="<table cellpadding='3' cellspacing='3' width='100%'>"+b.apply(a)+"</table>";new Ext.Panel({renderTo:"dispColor",html:changeColor_html,xtype:"panel",border:false})});var eleId="";var picTitle="";function getMouseXY(b,d,c){eleId=c;picTitle=d;-1!=navigator.appName.indexOf("Microsoft")&&(b=window.event);CurrentLeft=b.screenX;CurrentTop=b.screenY;if(CurrentLeft<0){CurrentLeft=0}if(CurrentTop<0){CurrentTop=0}openColorPicker(CurrentLeft,CurrentTop,eleId)}var win="";function openColorPicker(e,d,c){win=window.open("/apex/ColorPicker","_blank","status=1,scrollbars=0,width=246,height=223,resizable=1");var b=246;var a=214;if(Ext.isIE){a=242;win.resizeTo(b,a)}else{if(Ext.isGecko){a=230;win.resizeTo(b,a)}else{win.resizeTo(b,a)}}win.moveTo(e,d)}function resizeWindow(){var a=getColorCodeData();if(a.codes.length<=3){height=200}else{if(a.codes.length<=5){height=250}else{if(a.codes.length<=7){height=275}else{if(a.codes.length<=9){height=310}else{height=350}}}}window.parent.popUpWindow.setHeight(height)}function setChangeColor(a){document.getElementById("color"+eleId).style.backgroundColor="#"+a;parent.updatedColors.push(picTitle.trim()+"##"+a);parent.enableSaveButton()};