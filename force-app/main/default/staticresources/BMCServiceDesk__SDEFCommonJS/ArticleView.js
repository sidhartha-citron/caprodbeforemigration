var docBodyHeight;var isFromPrint=false;function getEmbedUrl(c){if(c.includes("youtube.com")||c.includes("youtu.be")){var b=/^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|\&v=)([^#\&\?]*).*/;var a=c.match(b);if(a&&a[2].length==11){return"//www.youtube.com/embed/"+a[2]}else{return"error"}}else{return c}}function addVideo(f,a,h){if(f){var c=getEmbedUrl(f);if(!a){a=315}if(!h){h=560}}var b=document.getElementById("videoDiv");var g=document.getElementById("videoSection");var e=false;if(c){e=checkProtocolPresentInURL(c.toUpperCase())}if(b&&e){var d=document.createElement("iframe");d.frameBorder="0";d.scrolling="yes";d.width=h;d.height=a;d.src=c;d.allowFullscreen=true;d.id="videoFrame";b.appendChild(d);g.style.display="block"}if(g&&!e){g.style.display="none"}}function checkProtocolPresentInURL(a){if(a.indexOf("HTTP://")==0||a.indexOf("HTTPS://")==0||a.indexOf("FTP://")==0||a.indexOf("FTPS://")==0||a.includes("YOUTUBE.COM")||a.includes("YOUTU.BE")){return true}return false}function printKA(){docBodyHeight=document.body.scrollHeight;isFromPrint=true;updateDocumentForPrint(true);window.print();updateDocumentForPrint(false);isFromPrint=false}function printKAonKeyPress(a,c,b){if(b){if(window.navigator.userAgent.indexOf("Firefox")!=-1&&(c.which===13||c.which===32)){a.click()}}}function updateDocumentForPrint(b){if(b){document.getElementsByTagName("body")[0].style.overflow="auto";var f=document.getElementsByClassName("ka-profile-header");var a=document.getElementsByClassName("ka-body");if(f&&f.length>0&&a&&a.length>0){f[0].style.height="auto";f[0].className="ka-profile-header-temp ka-profile-header-print";a[0].style.height="auto";a[0].className="ka-body-temp"}var e=document.getElementById("videoDiv");if(e){if(document.getElementById("videoFrame")){document.getElementById("videoFrame").style.border="1px solid #CCCCCC"}}var c=document.getElementsByClassName("footerDiv");if(c&&c.length>0){c[0].style.display="none"}var d=document.getElementsByClassName("ka-print-icon");if(d&&d.length>0){d[0].style.display="none"}}else{document.getElementsByTagName("body")[0].style.overflow="hidden";var f=document.getElementsByClassName("ka-profile-header-temp");var a=document.getElementsByClassName("ka-body-temp");if(f&&f.length>0&&a&&a.length>0){f[0].className="ka-profile-header ka-profile-header-print";a[0].className="ka-body"}var e=document.getElementById("videoDiv");if(e){if(document.getElementById("videoFrame")){document.getElementById("videoFrame").style.border=""}}var c=document.getElementsByClassName("footerDiv");if(c&&c.length>0){c[0].style.display="block"}var d=document.getElementsByClassName("ka-print-icon");if(d&&d.length>0){d[0].style.display=""}adjustHeights()}}function adjustHeights(){var d=document.getElementsByClassName("ka-profile-header");var a=document.getElementsByClassName("ka-body");if(a&&a.length>0){a[0].style.top=d[0].offsetHeight+"px";var b=isFromPrint?parseInt(docBodyHeight):parseInt(document.body.offsetHeight);var c=(b-d[0].offsetHeight);a[0].style.height=c+"px"}}function backToKA(){window.parent.location.href="/"+recordId}function windowResizeHandler(){adjustHeights();if(isfromSS3){var a=document.getElementById("videoFrame");if(typeof(a)!="undefined"){if(VideoHeight!=a.height&&VideoWidth!=a.width){a.height=VideoHeight;a.width=VideoWidth}else{a.height=336;a.width=448}}}};