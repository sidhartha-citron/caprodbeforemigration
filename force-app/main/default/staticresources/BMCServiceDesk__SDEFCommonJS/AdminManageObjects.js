var optionRow=document.createElement("option");optionRow.setAttribute("disabled","true");optionRow.setAttribute("selected","true");var textNode=document.createTextNode("---------------"+select+"---------------");optionRow.appendChild(textNode);document.getElementById("lstObjects").appendChild(optionRow);for(index=0;index<objObjectJSON[0].length;index++){type=objObjectJSON[0][index].obj.ObjectType;obj=objObjectJSON[0][index].obj.objectid;var label=objObjectJSON[0][index].obj.Label;if(index==7||index==9){var optionGroup=document.createElement("optgroup");optionGroup.setAttribute("label","--------------------------------------");document.getElementById("lstObjects").appendChild(optionGroup)}optionRow=document.createElement("option");optionRow.setAttribute("objecttype",type);optionRow.setAttribute("value",obj);textNode=document.createTextNode(label);optionRow.appendChild(textNode);document.getElementById("lstObjects").appendChild(optionRow)}function readObject(){type=document.getElementById("lstObjects").options[document.getElementById("lstObjects").selectedIndex].getAttribute("objecttype");if(type=="CustomObject"){document.getElementById("standardOptions").style.display="none";document.getElementById("customOptions").style.display="block"}else{if(type=="StandardObject"){document.getElementById("customOptions").style.display="none";document.getElementById("standardOptions").style.display="block"}else{if(type=="All"){document.getElementById("customOptions").style.display="none";document.getElementById("standardOptions").style.display="none";window.open(window.parent.getSetupMenuUrl("CUSTOMOBJECTS"))}}}obj=document.getElementById("lstObjects").value}function openObjectPage(b){var a;if((lastobj!=null&&lastobj!=obj)||(winReference!=null)){if(lastobj==obj){winReference.close()}winReference=null}lastobj=obj;if(winReference==null){a=window.parent.getSetupMenuUrl(b,obj);if(type=="CustomObject"){winReference=window.open(a,"C"+obj)}else{if(type=="StandardObject"){winReference=window.open(a,"S"+obj)}}}winReference.focus();return false};