var errorDuration = 3000 ;
var fileName ;
var instanceRTFeditor ;
var editorDataValue ;
var mapOfNameWithImage ;
var popupContainer ;
var popupImage ;
var closeImage ;

if(typeof(CKEDITOR) != 'undefined' && CKEDITOR && CKEDITOR.instances){
	try {
        if(window && window.top) {
            var popupContainerObj,popupImageObj,closeImageObj ;
            if(isLightningView === true && window.top.frames ) {
                var topFrame = window.top.frames[0] ;
                if(topFrame && topFrame.document) {
                    var topFrameDocument = topFrame.document;
                    setImageElements(topFrameDocument) ;
                }
				else if(window.top.document) {
					var topWindowDocument = window.top.document;
					setImageElements(topWindowDocument) ;
				}
            }
            else {
                var topDocument = window.top.document;
                setImageElements(topDocument) ;
            }
            if(popupContainerObj) {
                popupContainer = popupContainerObj;
            }
            if(popupImageObj) {
                popupImage = popupImageObj;
            }
            if(closeImageObj) {
                closeImage = closeImageObj;
            }
        }
        
        if(closeImage && popupContainer) {
            closeImage.onclick = function() {
                popupContainer.style.display = "none";
            }
        }
    } catch(e) { }
	
	for (var i in CKEDITOR.instances) {
		CKEDITOR.instances[i].on("paste", function(e){
			pasteImage(e);
			if (typeof(window) != 'undefined' && typeof(window.parent) != 'undefined' && window.parent.clickedOnce!=true && typeof(setTabUnsavedChanges) != 'undefined') {
				setTabUnsavedChanges();
			}
		});
		CKEDITOR.instances[i].on('instanceReady', function( evt ) {
			try {
				if(evt.editor && evt.editor.document && evt.editor.document.$ && evt.editor.document.$.images) {
					insertStyleInImages(evt.editor.document.$.images);
				}
			} catch(e) {}
		});
		CKEDITOR.instances[i].on('insertElement', function( evt ) {
			try {
				var imagesToInsert = [];
				if(evt.data && evt.data.$ && evt.data.$.tagName) {
					if(evt.data.$.tagName.toLowerCase() == 'img') {
						imagesToInsert.push(evt.data.$) ;
					}
					else {
						imagesToInsert = evt.data.$.getElementsByTagName("img") ;
					}
					if(imagesToInsert) {
						insertStyleInImages(imagesToInsert);
					}
				}
			} catch(e) {}
		});
		CKEDITOR.instances[i].on('fileUploadRequest', function( evt ) {
            try {
                evt.cancel();
            } catch(e) {
                evt.cancel();
            }
        });
	}
}

function setImageElements(topContainer) {
	try {
		if(topContainer) {
			popupContainerObj = topContainer.getElementById("popupContainer") ;
			popupImageObj = topContainer.getElementById("popupImage") ;
			closeImageObj = topContainer.getElementById("closeImage");
		}
	} catch(e) {}
}

function insertStyleInImages(editorImages) {
	try {
		if(editorImages && editorImages.length >0) {
			for(let j=0;j<editorImages.length;j++) {
				if("width" in editorImages[j].attributes) {
					editorImages[j].removeAttribute("width") ;
				}
				if("height" in editorImages[j].attributes) {
					editorImages[j].removeAttribute("height") ;
				}
				if("style" in editorImages[j].attributes) {
					editorImages[j].removeAttribute("style") ;
				}
				if(editorImages[j].style.maxWidth != "100%") {
					editorImages[j].style.maxWidth="100%" ;
				}
				if(editorImages[j].ondblclick == null) {
					editorImages[j].ondblclick = function(event) {
						if(popupContainer && popupImage) {
							popupContainer.style.display = "flex";
							popupImage.src = this.src;
							event.stopPropagation();
						}
					}
				}
			}
		}
	} catch (error) {
		
	}
}
		
function remoteCallToInsertDocument(nameFileMap,isFileOnly) {
	Visualforce.remoting.Manager.invokeAction(uploadImageAction,nameFileMap, function(result, event) {
		try {
			if (event.status) {                                                             
				if (result != null) {
					if(isFileOnly) {
						var htmlImg='<img src="'+getSFDocumentURL(result[fileName])+'" alt="'+UserAddedImage+'"/>';
						var newElement = CKEDITOR.dom.element.createFromHtml( htmlImg, instanceRTFeditor.document );
						instanceRTFeditor.insertElement(newElement);
					} else {
						for(var i in result) {
							editorDataValue = editorDataValue.replace(mapOfNameWithImage[i],getSFDocumentURL(result[i]));
						}
						editorDataValue = '<div>'+editorDataValue+'</div>' ;
						var newElement = CKEDITOR.dom.element.createFromHtml( editorDataValue, instanceRTFeditor.document );
						instanceRTFeditor.insertElement(newElement);
					}
				} else {
					instanceRTFeditor.showNotification(FileUploadFailed,'warning',errorDuration);
					return false;
				}
			}else{
				instanceRTFeditor.showNotification(FileUploadFailed,'warning',errorDuration);
				return false;
			}
		}
		catch(err) {
			instanceRTFeditor.showNotification(FileUploadFailed,'warning',errorDuration);
		}
	});
}
        
function pasteImage(e) {
	try {
		var maxFileSize = 4350000;      //After Base64 Encoding, this is the max file size
		instanceRTFeditor = e.editor ;
		let isConentTypeExcelOrNote = false;
		if(e.data && e.data.dataTransfer && ((e.data.dataTransfer._ && e.data.dataTransfer._.files) || e.data.dataTransfer.$ && e.data.dataTransfer.$.files)) {
			var fl;
			
			if(e.data.dataTransfer._.nativeHtmlCache){
				let htmlCache = e.data.dataTransfer._.nativeHtmlCache;	
				if(htmlCache && (htmlCache.indexOf('content="Microsoft OneNote')> -1 || htmlCache.indexOf('content="Microsoft Excel') > -1)){
					isConentTypeExcelOrNote = true;
				}
			}
			const imagePattern = /<\s*img[^>]+src\s*=\s*\\*"(.+?)\\*"[^>]*>/g ;
			
			if(e.data.dataTransfer._ && e.data.dataTransfer._.files && e.data.dataTransfer._.files.length > 0) {
				fl = e.data.dataTransfer._.files[0];
			} else if(e.data.dataTransfer.$ && e.data.dataTransfer.$.files && e.data.dataTransfer.$.files.length > 0) {
				fl = e.data.dataTransfer.$.files[0];
			}
			
			if(e.data.dataValue && imagePattern.test(e.data.dataValue)) {
				try {
					editorDataValue = e.data.dataValue ;
					e.data.dataValue = '';
					mapOfNameWithImage = new Map();
					var imageTagArray = editorDataValue.match(imagePattern) ;
					for(let i=1;i<=imageTagArray.length;i++) {
						stringImage = imagePattern.exec(editorDataValue)[1] ;
						imageName = 'image'+i+'.'+stringImage.substring(stringImage.indexOf('/')+1,stringImage.indexOf(';'));
						mapOfNameWithImage[imageName] = stringImage ;
					}
					remoteCallToInsertDocument(mapOfNameWithImage,false);
				}
				catch(err) {
					instanceRTFeditor.showNotification(FileUploadFailed,'warning',errorDuration);
				}
			}
			else if(fl && !isConentTypeExcelOrNote) {
				var extension = fl.name.substring(fl.name.lastIndexOf('.'));
				var validFileType = ".jpg , .png , .gif, .jpeg";
				if (validFileType.toLowerCase().indexOf(extension.toLowerCase()) < 0) {
					instanceRTFeditor.showNotification(UploadValidFile,'warning',errorDuration);
					return false;
				}
				if (fl.size > maxFileSize) {
					instanceRTFeditor.showNotification(MaxSizeError,'warning',errorDuration);
					return false;
				}
				var reader = new FileReader();
				var isResultBinary=true;
				reader.file = fl;
				reader.onload = function(e) {
					try {
						var fileBody;
						if (!isResultBinary) {
							var binary = "";
							var bytes = new Uint8Array(e.target.result);
							var length = bytes.byteLength;
			
							for (var i = 0; i < length; i++) 
							{
								binary += String.fromCharCode(bytes[i]);
							}
							fileBody = window.btoa(binary) 
						} else {
							fileBody = window.btoa(e.target.result) 
							}
			
						fileName = e.target.file.name;
						var fileMap = new Map();
						fileMap[fileName] = fileBody ;
						remoteCallToInsertDocument(fileMap,true);
					}
					catch(err) {
						instanceRTFeditor.showNotification(FileUploadFailed,'warning',errorDuration);
					}
				};
		
				if (reader.readAsBinaryString) {
					isResultBinary = true;
					reader.readAsBinaryString(fl);
				} else {
					isResultBinary = false;
					reader.readAsArrayBuffer (fl);
				}
				
			}
		}
	}
	catch(err) {
		//console.log('error'+err);
	}
}