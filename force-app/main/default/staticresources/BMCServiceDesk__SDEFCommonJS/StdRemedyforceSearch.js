document.getElementById("searchtxt").title=searchboxtooltip;document.getElementById("searchbtn").value=searchbtntext;document.getElementById("searchbtn").title=searchbtntext;var stdLayoutScreenWidth=671;var stdLayoutScreenHeight=400;function stdScreenLeft(){return parseInt((screen.availWidth/2)-(stdLayoutScreenWidth/2))}function stdScreenTop(){return parseInt((screen.availHeight/2)-(stdLayoutScreenHeight/2))}function isCJKChar(c){var b=/[\u3040-\u309f\u30a0-\u30ff\uff00-\uff9f\u4e00-\u9faf\u3400-\u4dbf]/;var a=b.test(c);return(a)}function search(){var a=document.getElementById("searchtxt").value;if(a!=null&&a!=undefined&&textTrim(a)!=""&&(a.length>=2||isCJKChar(a))){window.open("/apex/KnowledgeSearch?enableSelfClosing=false&calledFromForm=true&standardLayout=true&search="+a,"_blank","status = 1, height ="+stdLayoutScreenHeight+", width ="+stdLayoutScreenWidth+",left="+stdScreenLeft()+",top="+stdScreenTop()+", resizable = 1, scrollbars=no")}else{alert(searchboxerrormsg)}}function onEnter(a,b){var c=null;if(a.which){c=a.which}else{if(a.keyCode){c=a.keyCode}}if(13==c){search();return false}return true}function textTrim(a){a=a.replace(/^\s+|\s+$/g,"");return a};