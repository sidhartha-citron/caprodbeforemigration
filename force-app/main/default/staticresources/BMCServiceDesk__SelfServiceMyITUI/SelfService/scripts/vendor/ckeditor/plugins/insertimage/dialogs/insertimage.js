/*
 Copyright (c) 2003-2016, CKSource - Frederico Knabben. All rights reserved.
 For licensing, see LICENSE.md or http://ckeditor.com/license
*/
CKEDITOR.dialog.add( 'insertimageDialog', function( editor ) {
    var param = editor.config.pluginParam;
    var imageType = param.imageType;
    return {
        title: param.InsertImage,
        minWidth: 400,
        minHeight: 200,

        contents: [
            {
                id: 'tab-upload',
                label: param.Upload,
                elements: [
                    {
                        type: 'file',
                        id: 'file',
                        label: param.SelectImage,
                        onClick: function () {
                            var input = this.getInputElement();
                            input.$.accept = '.jpg,.png,.jpeg,.gif';
                        }
                    },
                    {
                        type:'html',
                        id:'error',
                        html : '',
                        style: 'color:Red;display:None;',
                        onShow: function() {
                            var el = document.getElementById(this.domId);
                            el.style.display = 'None';
                            el.innerText = '';
                        }
                    },
                    {
                        type:'html',
                        html : param.PluginDialogMessage
                    }
                ]
            },
            {
                id: 'tab-web',
                label: param.Web ,
                elements: [
                    {
                        type: 'text',
                        id: 'url',
                        label: 'URL'
                    }
                ]
            }
        ] ,
        onOk: function() {
            var maxStringSize = 6000000;    //Maximum String size is 6,000,000 characters
            var maxFileSize = 4350000;      //After Base64 Encoding, this is the max file size
            var chunkSize = 950000;         //Maximum Javascript Remoting message size is 1,000,000 characters

            var dialog = this;
			var fl;
			if(dialog.definition.dialog._.currentTabId == 'tab-upload') {
				fl = ((dialog.getContentElement('tab-upload', 'file')).getInputElement()).$.files[0];
			       
				if (fl == undefined) {
					var er = dialog.getContentElement('tab-upload', 'error');
					er.html = param.ChooseFile; 
					er.getElement().show();
					return false;
				} 

				var extension = fl.name.substring(fl.name.lastIndexOf('.'));

				var validFileType = ".jpg , .png , .gif, .jpeg";
				if (validFileType.toLowerCase().indexOf(extension.toLowerCase()) < 0) {
					var er = dialog.getContentElement('tab-upload', 'error');
					var el = document.getElementById(er.domId);
					el.style.display = "Block";
					el.innerText = param.PluginInvalidFileType;
					return false;
				}
				if (fl.size > maxFileSize) {
					var er = dialog.getContentElement('tab-upload', 'error');
					var el = document.getElementById(er.domId);
					el.style.display = "Block";
					el.innerText = param.PluginMaxFileSize; 
					return false;
				}

				var reader = new FileReader();
				var isResultBinary=true;
				reader.file = fl;
				reader.onload = function(e) 
				{
					var fileBody;
					if (!isResultBinary) {
						var binary = "";
						var bytes = new Uint8Array(e.target.result);
						var length = bytes.byteLength;

						for (var i = 0; i < length; i++) 
						{
							binary += String.fromCharCode(bytes[i]);
						}
						fileBody = (new sforce.Base64Binary(binary)).toString();
					} else
						fileBody = (new sforce.Base64Binary(e.target.result)).toString();
					
					if (fileBody.length > maxStringSize) {
						var er = dialog.getContentElement('tab-upload', 'error');
						er.html = param.FileUploadFailed; 
						er.getElement().show();
						return false;
					}
					var fileName = e.target.file.name;
					Visualforce.remoting.Manager.invokeAction(_RemotingActions.uploadImage, fileBody, fileName, imageType, function(result, event) {
									if (event.status) {                                                             
										if (result != null) {
											var documentUrl = getSFDocumentURL(relativeServletURL + result);
											var servletIndex = documentUrl.indexOf('/servlet/');
											if(servletIndex > 0){
												documentUrl = documentUrl.substring(servletIndex);
											}
											var htmlImg='<image src="'+documentUrl+'" alt="User-added image"/>';
											var newElement = CKEDITOR.dom.element.createFromHtml( htmlImg, editor.document );
											editor.insertElement(newElement); 
										} else {
											var er = dialog.getContentElement('tab-upload', 'error');
											er.html = param.FileUploadFailed; 
											er.getElement().show();
											return false;
										}
									}else{
										var er = dialog.getContentElement('tab-upload', 'error');
										er.html = param.FileUploadFailed; 
										er.getElement().show();
										return false;
									}
								}); 

					
				}
				reader.onerror = function(e) {
					var er = dialog.getContentElement('tab-upload', 'error');
					er.html = param.FileUploadFailed; 
					er.getElement().show();
					return false;
				}
				reader.onabort = function(e) {
					var er = dialog.getContentElement('tab-upload', 'error');
					er.html = param.FileUploadFailed; 
					er.getElement().show();
					return false;
				}
				if (reader.readAsBinaryString) {
					isResultBinary = true;
					reader.readAsBinaryString(fl);
				} else {
					isResultBinary = false;
					reader.readAsArrayBuffer (fl);
				}
			}
			else{
				fl = ((dialog.getContentElement('tab-web', 'url')).getInputElement()).$.value;
				if (fl == undefined || fl == '') {
					var er = dialog.getContentElement('tab-web', 'error');
					er.html = param.ChooseFile; 
					er.getElement().show();
					return false;
				} 
				var htmlImg='<image src="'+fl+'" alt="User-added image"/>';
				var newElement = CKEDITOR.dom.element.createFromHtml( htmlImg, editor.document );
				editor.insertElement(newElement);
			}
    
        } 
    };
});
