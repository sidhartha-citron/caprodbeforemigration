//var sidebarApp = angular.module("sidebarApp", []);
angular.module('sidebarModule', []);
angular.module('sidebarModule').factory('sidebarModel', ['$q','rfModal', '$modal',function ($q, rfModal, $modal){
	var self = {};
	self.getActivities = function(moduleName,isLoadMore, offsetStart,recordCount){ 
		var deferred = $q.defer(); 
		var params = {
			'historyObject' : DeepViewconfiguration["objects" ][moduleName]["actionObjAPI"]			
		};

		if(ShowActivityFeedActionsInBatches){
			params.offsetStart = offsetStart;
			if(recordCount > 0)
			   params.recordCount = recordCount;
		} else {
			params.loadMore = isLoadMore ? isLoadMore : false;
		}

		Visualforce.remoting.Manager.invokeAction(
            _RemotingActions.getActivityFeedItems,
            DeepViewconfiguration["objects"][moduleName]["actionParentFldAPI"], selectedNodeID, params,
                function(result, event){
                    if(event.status){
						if(result != undefined){
							deferred.resolve(result);
						}else{
							deferred.resolve([]);
						}
                       
                   }else{      
						deferred.reject();
						rfModal.openInfoMessage(null,"error", event.message);
                   }
                },{escape: true});
		return deferred.promise;	   
    }
	self.getActions = function(moduleName){
		var deferred = $q.defer(); 
		Visualforce.remoting.Manager.invokeAction(				
				_RemotingActions.listActions,moduleName,
				function(result, event){
					if(event.status){
						if(result != undefined){
							deferred.resolve(result);
						}else{
							deferred.resolve([]);
						}
                       
                   }else{      
						deferred.reject();
						rfModal.openInfoMessage(null,"error", event.message);
                   }                              
				});
			return deferred.promise;
	}
	self.getReplyEmailBody = function(moduleName, activityId){
		var deferred = $q.defer(); 
		Visualforce.remoting.Manager.invokeAction(				
				_RemotingActions.getReplyEmailBody, DeepViewconfiguration["objects" ][moduleName]["actionObjAPI"], activityId,
				function(result, event){
					if(event.status){
						if(result != undefined){
							deferred.resolve(result);
						}else{
							deferred.resolve([]);
						}
                       
                   }else{      
						deferred.reject();
						rfModal.openInfoMessage(null,"error", event.message);
                   }                              
				});
			return deferred.promise;
	}
	/******
	//Function Call for Summarization
	**/
	self.getSummary = function(activity,Id){
		self.displayLoader();
		var deferred = $q.defer(); 
		Visualforce.remoting.Manager.invokeAction(				
				_RemotingActions.getSummary, Id, null,
				function(result, event){
					if(event.status){
						if(result != undefined){
							deferred.resolve(result);
							$modal.open({
								 templateUrl: resourceUrl+'templates/modal/SummarizationWindow.html',
								 ariaLabelledBy: 'modal-title',
								 ariaDescribedBy: 'modal-body',
								 width: '300px',
								 backdrop: 'static',
								 closeByXButton: true,
								 closeByClickOutside: true,
								 closeByEscKey: true,
								 size: 'lg',
								 controller: ['$scope', '$sce', '$modalInstance', function ($scope, $sce, $modalInstance) {   
									$scope.modalStyle ='';
									$scope.popupData = $sce.trustAsHtml(self.replaceUrlWithAnchor(result));
									$scope.activity=activity;
									$scope.cancel = function () {
										$modalInstance.dismiss('cancel');
									};
								 }]
							});
							self.hideLoader();
						}else{
							deferred.resolve([]);
						}
                       
                   }else{      
						deferred.reject();
						rfModal.openInfoMessage(null,"error", event.message);
                   }                              
				});
			return deferred.promise;
	}
	
	self.replaceUrlWithAnchor = function(inputStr) {
		if(inputStr) {
			var urlRegex = /(https?:\/\/[^\s]+)/g;
			return inputStr.replace(urlRegex, function(url) {
				return '<a href="' + url + '" target="_blank">' + url + '</a>';
			});
		}
		return inputStr;
	}
	self.getEmailSettings = function(moduleName){
		var deferred = $q.defer(); 
		Visualforce.remoting.Manager.invokeAction(				
				 _RemotingActions.getEmailSettings, moduleName, selectedNodeID, 
				function(result, event){
					if(event.status){
						if(result != undefined){
							deferred.resolve(result);
						}else{
							deferred.resolve([]);
						}
                   }else{      
						deferred.reject();
						rfModal.openInfoMessage(null,"error", event.message);
                   }                              
				}, {buffer : false});
			return deferred.promise;
	}

	self.getFieldInfo = function(moduleName) {
		var deferred = $q.defer();
		Visualforce.remoting.Manager.invokeAction(
            _RemotingActions.getFieldInfo, moduleName, selectedNodeID,
            function(result, event) {
                if (event.status) {
                    if (result != undefined) {
						deferred.resolve(result);
                    }else {
						deferred.resolve([]);
					}

                } else {
                	self.hideLoader();
                	deferred.reject();
                    rfModal.openInfoMessage(null, "error", event.message);
                }
            }, {
                escape: true
            });
		return deferred.promise;
	}
	self.getSubjectLine = function(moduleName,defaultSubject) {
		var deferred = $q.defer();
		const promise = Visualforce.remoting.Manager.invokeAction(
            _RemotingActions.getsubjectLine, moduleName, defaultSubject,selectedNodeID,
            function(result, event) {
                if (event.status) {
                    if (result != undefined) {
						deferred.resolve(result);
                    }else {
						deferred.resolve([]);
					}

                } else {
                	self.hideLoader();
                	deferred.reject();
                    rfModal.openInfoMessage(null, "error", event.message);
                }
            }, {
                escape: true
            });
			return deferred.promise;
	}
	self.getAttachments = function(moduleName){
		var deferred = $q.defer();
		Visualforce.remoting.Manager.invokeAction(
		_RemotingActions.getActivityFeedsAttachments,selectedNodeID,{},
			function(result, event){
				if(event.status){
					angular.forEach(result,function(attachment){
					    attachment.iconClass = self.getFileGenericIconClass(attachment.Name);
					});
					deferred.resolve(result);
				}else{
					deferred.reject();
					rfModal.openInfoMessage(null,"error", event.message);
				}
		})
		return deferred.promise;	
	}	
	self.displayLoader = function(){
		var elmnt = document.getElementById("quickDetailsPanel");
		if( elmnt && elmnt.scrollHeight){
			$('#sideBarActionMask').css('height',elmnt.scrollHeight);
		}
		$('#sideBarloader').css('display','block');	
	    $('#sideBarActionMask').css('display','block');
	}
	self.hideLoader = function(){
		$('#sideBarloader').css('display','none');	
	    $('#sideBarActionMask').css('display','none');
	}
	self.getFileGenericIconClass = function(name) {
		var fileExt = name.split('.').pop(),
			documentExts = ['xls', 'xlsx', 'doc', 'docx', 'pdf', 'csv','txt'],
			imageExts = ['jpg', 'jpeg', 'png', 'gif', 'tif', 'tiff', 'bmp'],
			iconClassName = 'd-icon-paperclip_square';
		var extentionToIcon = {
			'xls' : 'xls',
			'xlsx' : 'xls',
			'doc' : 'word',
			'docx' : 'word',
			'pdf' : 'pdf',
			'csv' : 'xls',				
			'txt' : 'txt'
		};
		fileExt = fileExt.toLowerCase();
		if (documentExts.indexOf(fileExt) >= 0) {
			iconClassName = 'd-icon-'+ extentionToIcon[fileExt] + '_square';
		} else if (imageExts.indexOf(fileExt) >= 0) {
			iconClassName = 'd-icon-image_square';
		}
		return iconClassName;
	};
	self.openConfigureSignatureModal = function(callBackFn, emailSignature, stripHTMLFn) {
         $modal.open({
             templateUrl: resourceUrl+'templates/modal/ConfigureSignature.html',
             backdrop: 'static',
             windowClass: 'signature-modal-window',
             controller: ['$scope', '$modalInstance' ,'rfModal', '$timeout', function ($scope, $modalInstance, rfModel, $timeout) {   
             	$scope.modalStyle ='';
             	var height = window.innerHeight * .60;
				//Setting the minimum height for email signature
				//so if user clicks on browse image then ui will not show two scrollbar
             	if(height <= 325) { 
             		height = 325;
             	}
             	$scope.modalStyle = {
             		'width':'100%',
             		'border':'none',
             		'height': Math.ceil(height)+'px'
             	}
            	 $scope.setSignatureCount = 0;
            	 $scope.callBackFn = callBackFn;
            	 $scope.stripHTMLFn = stripHTMLFn;
            	 $scope._Labels = {};
            	 $scope._Labels.EmailSignature = _Labels.modal.EmailSignature;
            	 $scope._Labels.save = _Labels.quickDetails.save;
            	 $scope._Labels.cancel = _Labels.quickDetails.cancel;
            	 $scope.displayLoader = function(){
        			var elmnt = document.getElementById("configureSignature");
        			if( elmnt && elmnt.scrollHeight){
        				$("#configureSignature").find('#sideBarActionMask').css('height',elmnt.scrollHeight);
        			}
        			$("#configureSignature").find('#sideBarloader').css('display','block');	
        			$("#configureSignature").find('#sideBarActionMask').css('display','block');
            	 }
            	 $scope.hideLoader = function(){
            		$("#configureSignature").find('#sideBarloader').css('display','none');	
            		$("#configureSignature").find('#sideBarActionMask').css('display','none');
            	 }
            	 $scope.save = function() {
            		 $scope.displayLoader();
                	 var rtfFrame = document.getElementById('rtfFrameConfigure');
                	 var emailSignatureComponent = getRichComponent(rtfFrame);
                	 var updatedEmailSignature = RemedyForceHTMLProcessor.getElementHTML(emailSignatureComponent);
                	 // if email signature is blank after removing <br> then needs to set email signature as blank.
                	 if(updatedEmailSignature.replace(/<br\s*\/?>/gi, '').trim() === "") {
                		 updatedEmailSignature = "";
                	 }
                	 var params = {
                			 'emailSignature' : updatedEmailSignature
                	 };
                	 Visualforce.remoting.Manager.invokeAction(
            			_RemotingActions.performUserActions, '', '','updateEmailSignature', params,
        					function(result, event){
        						if(event.status){
        							var updatedEmailSignature = RemedyForceHTMLProcessor.htmlDecoder(result);
        							var div = document.createElement('div');
									if(updatedEmailSignature) {
										RemedyForceHTMLProcessor.parseHTML(div, updatedEmailSignature.replace(/\r?\n|\r/g,'<br>'));
									}
        							$scope.callBackFn(div.innerHTML);
        							if (!$scope.$$phase){                                                                                                                                                                                                                 
        		                        $scope.$apply();
        							}
        							$scope.hideLoader();
        							$scope.cancel();
        							rfModal.openInfoMessage($scope, "success", _Labels.modal.EmailSignatureSave);
        						} else {
        							$scope.hideLoader();
        							if(event.message.indexOf('STRING_TOO_LONG') > 0) {
        								rfModal.openInfoMessage(null,"error", _Labels.message.TextAreaOverflow);
        							} else {
        								rfModal.openInfoMessage(null,"error", event.message);
        							}
        						}
    				});
                 }

                 $timeout(function () {
                    $(".modal-dialog").draggable();

                    var resizeOpts = {
                        minWidth:501,
                        minHeight:window.innerHeight * .7,
                        maxWidth: window.innerWidth * .9,
                        alsoResize: '#rtfFrameConfigure'
                    }

                    $(".modal-dialog").resizable(resizeOpts);

                    $( ".modal-dialog" ).on( "resize", function( event, ui ) {
	                 	var rtfFrame = document.getElementById('rtfFrameConfigure');
	                 	var rtfEl = rtfFrame.contentDocument.getElementById('cke_1_contents');
	                 	var iframHeight = $('#rtfFrameConfigure').height() ? $('#rtfFrameConfigure').height() : 0;
	                 	rtfEl.style.height = iframHeight - 43 + 'px';
                 	});
                
                }, 0);

                 $scope.cancel = function () {
                	 $modalInstance.dismiss('cancel');
                 };
                 window.setExistingSignature = function() {
                	 $scope.setSignatureCount++;
                	 var rtfFrame = document.getElementById('rtfFrameConfigure');
                	 var richBodycomp = getRichComponent(rtfFrame);
                	 if(typeof(richBodycomp) == 'undefined' || richBodycomp == null) {
                		 if($scope.setSignatureCount < 50){ //re-try for 10 seconds max
     						setTimeout(function(){ setExistingSignature() }, 200);
     					}
                	 } else {
                		if(emailSignature) {
                			var div = document.createElement('div');
                			RemedyForceHTMLProcessor.parseHTML(div, emailSignature.replace(/\r?\n|\r/g,'<br>'));
                			// Copy email signature in rich text editor.
                			RemedyForceHTMLProcessor.copyHTML(div, richBodycomp);
                 		}
         				var rtfEl = rtfFrame.contentDocument.getElementById('cke_1_contents');
         				
         				var ckElement = rtfFrame.contentDocument.getElementsByClassName('cke_1');
         				if(ckElement.length > 0)
         					ckElement[0].style.border = 'none';

        				if(rtfEl){
        					var iframHeight = $('#rtfFrameConfigure').height() ? $('#rtfFrameConfigure').height() : 0;
        					rtfEl.style.height = iframHeight - 43 + 'px';
	    					var rtfElementFrameDoc = $(rtfEl).find('iframe')[0].contentDocument;
	    					if(rtfElementFrameDoc) {
	    						$('#rtfFrameConfigure').find('.cke_reset').css('border','none');
	    					}
        				}
                	 }
                 }
             }]
         });
    }
	return self;
}]);
angular.module('sidebarModule').controller('sidebarController',  ['$scope','$window','$templateRequest','$compile','rfModal','rootNodeDataFactory','sidebarModel','confirmationDialogService', '$timeout','$filter', function($scope,  $window,$templateRequest,$compile,rfModal,rootNodeDataFactory,sidebarModel,confirmationDialogService, $timeout, $filter){	
	sidebarModel.displayLoader(); 	
	var autoSuggestComponent = $compile(autoCompleteHTML)($scope);
	$scope.hasEmailSettingLoaded = false;
	$scope.hasNewSubjectLoaded = false;
	$scope.isSummarizationEnabled = isSummarizationEnabled;
	$scope.actionHideDuration = actionHideDuration;
	$scope.isActionEditable = isActionEditable;
	$scope.moduleName = selectedNodeAPI;		
	$scope.enableSidebarActions = false;
	$scope.DeepViewconfiguration = DeepViewconfiguration;
	$scope.namespacePrefix = namespacePrefix;
	$scope.hasAPIEnabledPermissions = pageLoadData.hasAPIEnabledPermissions;
	$scope.boolAllowRichTextArea = pageLoadData.boolAllowRichTextArea;
	$scope.isAdminUser = pageLoadData.isAdminUser;
	$scope.fromEmails = '';
	$scope.Actions = {isAction:false, ActionList:'', ActionName:'', ActionId:'', isActionBtnClicked:false, showActionsList:false};
	$scope.defaultFromEmail = {};
	$scope.userResults = [];
	$scope.contactResults = [];
	$scope.fieldInfoMap = [];
	$scope.emailSettings = {"clicked" :false };
	$scope.mergeFieldIcon = {"clicked" :false };
	if($scope.moduleName)
		$scope.moduleName = $scope.moduleName.replace(namespacePrefix,'');
	$scope.quickNote = {"data": "","durationString":""};
	if($scope.isActionEditable && !$scope.actionHideDuration)
		$scope.quickNote.durationString = "00:00";
    $scope.email = {
		   "fromEmail":"",
		   "toEmails":"",
		   "CCEmails":"",
		   "BccEmails":"",
		   "emailSubject":"",
		   "emailBody":"",
		   "saveAttachmentsFlag":"",
		   "removeOriginalContent":"false"
	};
	$scope.showSidebarOnly = showSidebarOnly ;
	$scope.showSendEmail = false;
	$scope.showAddNote = false;
	$scope.showNotification = false;
	$scope.newAttachment =[];
	$scope.ObjectLabels = ObjectLabels;
    $scope.activityClicked = true;
	$scope.attachmentClicked = true; 
	$scope.emailDetailsClicked = true;
	$scope.emailContentClicked = true;
	$scope.recordState = false;	
	$scope.isSendEmailAvailable = true;
	$scope.emailTemplates =	null;
	$scope.selectedTemplate = {"value" : "none"};
	$scope.selectedIndex= 0;
	$scope.showLoadMoreActivities = false;
	$scope.ShowMore = {};
	$scope.ShowMore.ShowActivityFeedActionsInBatches = false;
	$scope.ShowMore.offsetStart = 0;
	if(typeof selectedNodeAPI != 'undefined' && selectedNodeAPI.replace(namespacePrefix, '') == 'release__c'){
		$scope.isSendEmailAvailable =false;
	}
	$scope.isObjectEditable = false;
	$scope.$parent.childScope = $scope;
	$scope.activities = [];
	$scope.ShowMore.recordCount = 0;
	$scope.activityAttachmentMap = [];
	$scope.splitterText = "\n******************************";
	$scope.isFocusOnAutosuggestion = false;
	$scope.isFocusOnAutosuggestionContainer = false;
	$scope.rtfHeight = 270;
	$scope.tempEmailBody = '';
	
	$scope.imageRexExp			=	/<[Ii][Mm][Gg][^>]+src="?([^"\s]+)"?[^>]*[\/>]/g;
	$scope.anchorRexExp			=	/<[Aa][^>]+target="?([^"\s]+)"?[^>]*[\/>]/g;
	$scope.noFieldsFound 		= 	false;
	

	$scope.showSendButtons =[];
	$scope.showSendButtons.showUpperSendButtons = true;
	$scope.showSendButtons.showBottomSendButtons = false;
	$scope._timeout  = null;
	angular.element(document.querySelector('#quickDetailsPanel')).bind("scroll", function() {
		
		if($('#showSendEmail').is(':visible')) {
			
			if($scope._timeout){ //if there is already a timeout in process cancel it
				$timeout.cancel($scope._timeout);
			}

			$scope._timeout = $timeout(function(){
				$scope._timeout = null;
				$scope.showSendButtons.showUpperSendButtons = $scope.isScrolledIntoView('emailDetailPanel');
		    	$scope.showSendButtons.showBottomSendButtons = $scope.isScrolledIntoView('footerButtonsPanel');
		   		if($scope.showSendButtons.showUpperSendButtons && $scope.showSendButtons.showBottomSendButtons)
		   			$scope.showSendButtons.showBottomSendButtons = false;
		   		else if(!$scope.showSendButtons.showUpperSendButtons && !$scope.showSendButtons.showBottomSendButtons)
		   			$scope.showSendButtons.showBottomSendButtons = true; 
			}, 100);
		}
		
	});  

	//set Link cookie value...
	$scope.setLinkCookieValue = function(strLinkFor, strCookieValue){
		if($scope.moduleName && strUserId){
			var tenYrs = new Date();
			tenYrs.setYear(tenYrs.getFullYear() + 10);
			setRFCookies($scope.moduleName.replace(namespacePrefix,'') + strUserId + strLinkFor + 'Link', strCookieValue, { path:'/', expires:tenYrs });
		}
	};
	
	//get Link cookie value...
	$scope.getLinkCookieValue = function(strLinkFor){
		if($scope.moduleName && strUserId){
			var strModuleName = $scope.moduleName.replace(namespacePrefix,'');
			if($.cookie(strModuleName + strUserId + strLinkFor + 'Link')){
				return $.cookie(strModuleName + strUserId + strLinkFor + 'Link');
			} else {
				$scope.setLinkCookieValue(strLinkFor, 'true');
				return 'true';
			}
		}
		return false;
	};
	
	//Update Link cookie value
	$scope.linkClickHandler = function(strLinkClicked){		
		if('true' == $scope.getLinkCookieValue(strLinkClicked)){
			$scope.setLinkCookieValue(strLinkClicked, 'false');
		} else {
			$scope.setLinkCookieValue(strLinkClicked, 'true');
			$scope.insertLink(strLinkClicked);
		}
	};
	
	//InsertLinks
	$scope.insertLink = function(strLinkClicked) {
		var strLinks = '';
		var strSingleModeStaffURL = '';
		
		if(!($scope.StaffURL && $scope.StaffLightningURL)){
			strSingleModeStaffURL = ($scope.StaffURL) ? $scope.StaffURL : $scope.StaffLightningURL;
		}
		
		if($scope.editor.mode == 'richtext'){
			if('true' == $scope.getLinkCookieValue('staff') && (strLinkClicked == 'staff' || strLinkClicked == undefined)){
				if(strSingleModeStaffURL){
					strLinks = _Labels.modal.LinkRemedyforceUser + '<a href="' + strSingleModeStaffURL+ '">' + ' ' + strSingleModeStaffURL + '</a>';
				} else {
					strLinks = _Labels.modal.EmailRecordLinksForLightningUser + '<a href="' + $scope.StaffLightningURL + '">' + ' ' + $scope.StaffLightningURL + '</a>';
					strLinks = strLinks + '<br>' + _Labels.modal.EmailRecordLinksForClassicUser + '<a href="' + $scope.StaffURL + '">' + ' ' + $scope.StaffURL + '</a>';
				}
			}
			
			if($scope.ClientURL && 'true' == $scope.getLinkCookieValue('client') && (strLinkClicked == 'client' || strLinkClicked == undefined)) {
				if(strLinks)
					strLinks = strLinks + '<br>' + _Labels.modal.LinkSelfServiceClient + '<a href="' + $scope.ClientURL + '">' + ' ' + $scope.ClientURL + '</a>';
				else 
					strLinks = _Labels.modal.LinkSelfServiceClient + '<a href="' + $scope.ClientURL + '">' + ' ' + $scope.ClientURL + '</a>';
			}
			
			var rtfFrame = document.getElementById('rtfFrame');
			var richBodycomp = $scope.getRichComponent(rtfFrame);
			
			if(richBodycomp && strLinks != '') {
				//insert links above Email Signature.
				var emailSignaturePos = $scope.getEmailSignaturePosition();
				if(emailSignaturePos >= 0){
					richBodycomp.innerHTML = richBodycomp.innerHTML.slice(0, emailSignaturePos) + strLinks + '<br><br>' + richBodycomp.innerHTML.slice(emailSignaturePos);
				} else {
					var position = richBodycomp.innerHTML.indexOf($scope.replyRTFEmailSeparator);
					if($scope.isReplyEmail && position >= 0){
						richBodycomp.innerHTML = richBodycomp.innerHTML.slice(0, position) + strLinks + '<br><br>' + richBodycomp.innerHTML.slice(position);
					} else {
						richBodycomp.innerHTML = richBodycomp.innerHTML + '<br>' + strLinks + '<br>';
					}
				}
			}
			
		} else {
			if('true' == $scope.getLinkCookieValue('staff') && (strLinkClicked == 'staff' || strLinkClicked == undefined)){
				if(strSingleModeStaffURL){
					strLinks = _Labels.modal.LinkRemedyforceUser + ' ' + strSingleModeStaffURL;
				} else {
					strLinks = _Labels.modal.EmailRecordLinksForLightningUser + ' ' + $scope.StaffLightningURL;
					strLinks = strLinks + '\r\n' + _Labels.modal.EmailRecordLinksForClassicUser + ' ' + $scope.StaffURL;
				}
			}
			
			if($scope.ClientURL && 'true' == $scope.getLinkCookieValue('client') && (strLinkClicked == 'client' || strLinkClicked == undefined)) {
				if(strLinks)
					strLinks = strLinks + '\r\n' + _Labels.modal.LinkSelfServiceClient + ' ' + $scope.ClientURL;
				else 
					strLinks = _Labels.modal.LinkSelfServiceClient + ' ' + $scope.ClientURL;
			}
			
			if(strLinks != '') {
				//insert links above Email Signature.
				var emailSignaturePos = $scope.getEmailSignaturePosition();
				if(emailSignaturePos >= 0){
					$scope.email.emailBody = $scope.email.emailBody.slice(0, emailSignaturePos) + strLinks + '\r\n\r\n' + $scope.email.emailBody.slice(emailSignaturePos);
				} else {
					var position = $scope.email.emailBody.indexOf($scope.replyPlainEmailSeparator);
					if($scope.isReplyEmail && position >= 0){
						$scope.email.emailBody = $scope.email.emailBody.slice(0, position) + strLinks + '\r\n\r\n' + $scope.email.emailBody.slice(position);
					} else {
						$scope.email.emailBody = $scope.email.emailBody + '\r\n' + strLinks + '\r\n';
					}
				}
			}
		}
	};

	$scope.emailSignature = {};
	$scope.emailSignatureInsertedOnce = false;
	$scope.setTextFormatEmailCovo = function(val){
		var tenYrs = new Date();
		tenYrs.setYear(tenYrs.getFullYear() + 10);
		setRFCookies("TextFormatEmailCovo", val, { path:'/', expires:tenYrs });
	};
	
	$scope.getTextFormatEmailCovo = function() {
		if('undefined' != typeof($.cookie("TextFormatEmailCovo")) && '' != $.cookie("TextFormatEmailCovo") && null != $.cookie("TextFormatEmailCovo"))
			return $.cookie("TextFormatEmailCovo");
		else 
			return true;	//return true when cookie is not set for New User
	};
	
	$scope.getSummarizedData = function(activity,Id){
		sidebarModel.getSummary(activity,Id);
	};

	$scope.setInsertEmailSignature = function(val){
		var tenYrs = new Date();
		tenYrs.setYear(tenYrs.getFullYear() + 10);
		setRFCookies("InsertEmailSignature", val, { path:'/', expires:tenYrs });
	};

	$scope.resetCursorToBeginning = function(txtElement) { 
	    if (txtElement.setSelectionRange) { 
	        txtElement.focus(); 
	        txtElement.setSelectionRange(0, 0); 
	    } else if (txtElement.createTextRange) { 
	        var range = txtElement.createTextRange();  
	        range.moveStart('character', 0); 
	        range.select(); 
	    } 
	};

	$scope.checkContainer = function () {
		if($scope.editor.mode == 'plaintext' && $scope.isIE11()) {
			return;
		} else if(($scope.editor.mode == 'plaintext' && !$scope.isIE11() && !$scope.isReplyEmail) && $('#email_body').is(':visible')) {
			$('#email_body').focus();
			setTimeout(function() { 
			    $scope.resetCursorToBeginning(document.getElementById('email_body'));
			}, 50);
			
		} else if(($scope.editor.mode != 'plaintext' || $scope.isReplyEmail) && $('#rtfFrame').is(':visible')){
		   var richBodycomp = $scope.getRichComponent(rtfFrame);
		   
		   if($scope.isIE11()) {
	   			setTimeout(function() { 
			   		$(richBodycomp).focus();
			   	}, 100);
	   		} else {
		   		$(richBodycomp).focus();
		  	}

		} else {
			var timeoutRef = setTimeout($scope.checkContainer, $scope.isIE11() ? 100 : 50); //wait 50 ms, then try again
			setTimeout(function() { //clear timeout after 30 secs
			    clearInterval(timeoutRef);
			}, 1000 * 60 * 0.5);
		}
	};

	$scope.getInsertEmailSignature = function() {
		if('undefined' != typeof($.cookie("InsertEmailSignature")) && '' != $.cookie("InsertEmailSignature") && null != $.cookie("InsertEmailSignature"))
			return $.cookie("InsertEmailSignature") == 'true' ? true : false;
		else 
			return false;	//return false when Insert Email Signature cookie is not set for New User
	};
	
	$scope.insertEmailSignatureCB = $scope.getInsertEmailSignature();
	$scope.mutibytePattern = /[^\x00-\xff]/g;
	$scope.richBodyComponent = null;
	$scope.showReplyIcon = false;
	$scope.isReplyEmail = false;
	$scope.replyRTFEmailSeparator = '<div id="divHR"><hr><em><strong><em></em></strong></em></div>';
	$scope.replyPlainEmailSeparator = '-----' + _Labels.modal.OriginalMessage + '-----';
	$scope.remoteCallsInProgress=0;
	$scope.isLinksInsertedOnEmailIconClick = false;
	
	$scope.getActivities = function(isLoadMore){ 
	    if(!isLoadMore || ShowActivityFeedActionsInBatches){
			sidebarModel.displayLoader();
		}
		$scope.moduleName = $scope.moduleName.replace(namespacePrefix,'');
		var loadMoreActivities = isLoadMore ? isLoadMore : false ;
		
		if(!loadMoreActivities){
			$scope.activities = [];
			if(ShowActivityFeedActionsInBatches) {
				$scope.ShowMore.offsetStart 						= 0;
				$scope.ShowMore.recordCount 						= 0;
				$scope.ShowMore.ShowActivityFeedActionsInBatches 	= false;
			}
		}
		
		$scope.remoteCallsInProgress++;
		sidebarModel.getActivities($scope.moduleName,loadMoreActivities, $scope.ShowMore.offsetStart,$scope.ShowMore.recordCount).then(function(result){
			
			$scope.remoteCallsInProgress--;
			$scope.showLoadMoreActivities = result.hasMoreFeedItems ;
			
			if(ShowActivityFeedActionsInBatches) {
				$scope.ShowMore.ShowActivityFeedActionsInBatches 	= result.hasMoreFeedItems;
				$scope.ShowMore.offsetStart 						= result.offsetEnd;
				$scope.ShowMore.recordCount 						= result.recordCount ? result.recordCount : 0;
			}
			
			var activitiesList = result.feedItems;
			if($scope.showLoadMoreActivities && !ShowActivityFeedActionsInBatches){
				$scope.getActivities(true); 
			}
			
			if(typeof(activitiesList)!=undefined && activitiesList.length>0){
				var Attachments = '';
				var attachmentMap = new Object();
				if($scope.activities.length == 0){
				$scope.imageCount		=	0;
				$scope.imageTags		=	{};
				$scope.externalImages 	=	{};
				$scope.imagesWithTitle 	= 	{};
				$scope.images			=	{
												'newImgTags' 		: 	{}, 
												'imageSrcs'			: 	{}, 
												'imageDimentions' 	: 	{}
											};
				}
											
				for(var index = 0; index < activitiesList.length; index++){
					activitiesList[index]['description']		=	RemedyForceHTMLProcessor.htmlDecoder(activitiesList[index]['description']);				
					activitiesList[index]['activityContent']	=	RemedyForceHTMLProcessor.htmlDecoder(activitiesList[index]['activityContent']);
					activitiesList[index]['envelope']			=	RemedyForceHTMLProcessor.htmlDecoder(activitiesList[index]['envelope']);
					activitiesList[index]['userName']			=	RemedyForceHTMLProcessor.htmlDecoder(activitiesList[index]['userName']);			
					
					if(activitiesList[index]['attachments'] != 'undefined' && activitiesList[index]['attachments'] != null && activitiesList[index]['attachments'] != ''){
						activitiesList[index].hasAttachment = true;
						
						Attachments += activitiesList[index]['attachments'];
						if( index < (activitiesList.length - 1) )
							Attachments += ',';
					} else {
						activitiesList[index].hasAttachment = false;
					}
				}
				
				activitiesList = $scope.splitActivityNote(activitiesList);
				if(ShowActivityFeedActionsInBatches )
					$scope.activities = $scope.activities.concat(activitiesList);
				else
					$scope.activities = activitiesList;
				var params = {};
				params.attachmentsIds = Attachments;
				if(params.attachmentsIds.length > 0){
					$scope.remoteCallsInProgress++;
					Visualforce.remoting.Manager.invokeAction(
					_RemotingActions.getActivityFeedsAttachments,selectedNodeID,params,
						function(result, event){
							if(event.status){
								angular.forEach(result,function(attachment){
									attachment.iconClass = sidebarModel.getFileGenericIconClass(attachment.Name);
									if(attachment.Id != null && attachment.Id != '')
										attachmentMap[attachment.Id] = attachment;
									
								});
								if(Object.keys(attachmentMap).length>0){
									$scope.getActivityAttachmentMap(attachmentMap);
									$scope.$apply(); 									
								} else {
									for(var index = 0; index < $scope.activities.length; index++){
										$scope.activities[index].hasAttachment = false;
									}
								}
								
							}else{
								rfModal.openInfoMessage($scope,"error", event.message);
							}
							$scope.remoteCallsInProgress--;
							$scope.loadRtfEditor();
						});
				}
			}
			$scope.loadEmailSettings();
			
			$scope.loadRtfEditor();
			sidebarModel.hideLoader();
		});		
    };

    $scope.getValueInPixel = function(input) {
    	if(input.length > 0) {
    		
    		input 			= 	input.trim();
			input 			=	input.replace(/['"]+/g, '');

			var value 		= 	parseFloat(input);
			var splitResult = 	input.split(/[0-9]+/);
			var measures 	=	undefined;

			if(splitResult && splitResult.length > 1)		
				measures 	= 	splitResult[splitResult.length - 1]
			
			if (!value || value <= 0)
				value = 80;

			if(!measures)
				return value;
							
			var result 		=	80;
			measures 		=	measures.toUpperCase();

			switch(measures) {
			    case 'PX':
			    	result 	=	value;
			        break;
			    case 'IN':
			        result 	=	value * 96;
			        break;
			    case 'CM':
			        result 	=	value / 16;
			        break;
			    case 'EM':
			        result 	=	value * 37.8;
			        break;
			}
			return result;
    	}

	}

    $scope.getImageDimentions = function(url, id, imageTag){
		var r 		=	$.Deferred();
		var src 	= 	url;
		var image 	= 	{};
		var width ;
		var height;

		if(imageTag.indexOf('width') > -1) {
			var attributes 	= 	imageTag.match(/(\S+)=["']?((?:.(?!["']?\s+(?:\S+)=|[>"']))+.)["']?/g);
			attributes.forEach(function(attribute) {
				
				if(attribute.indexOf('style') > -1 && (attribute.indexOf('width') > -1 || attribute.indexOf('height') > -1)){
					
					var styleValues 	= 	attribute.split(';');
					
					styleValues.forEach(function(style) {
						
						if(style.indexOf('width') > -1) {
							image.width 	= 	$scope.getValueInPixel(style.split(':')[1]);
						} else if(style.indexOf('height') > -1) {
							image.height 	= 	$scope.getValueInPixel(style.split(':')[1]);
						} 
					});

				} else if(attribute.indexOf('width') > -1) {
					image.width 	= 	$scope.getValueInPixel(attribute.split('=')[1]);
				} else if(attribute.indexOf('height') > -1) {
					image.height 	= 	$scope.getValueInPixel(attribute.split('=')[1]);
				}
			});

			image.src 		=	src;
			image.id 		= 	id;
			image.imageTag 	= 	imageTag;
			r.resolve(image);

		} else {
			if (url.indexOf('\/') == 0)
				url = 'https://'+salesforceBaseUrl+'/'+url;

			$('<img/>').attr('src', RemedyForceHTMLProcessor.htmlDecoder(url)).on('load',function(){
				image = {width:this.width, height:this.height, src:src, id:id, imageTag:imageTag};
				r.resolve(image);
			});
		}
		return r;
	}

	$scope.createThumbNails = function( activity ) {
		var currentImage;
		activity['containsExternalImage']	=	false;
		activity['externalImageIds']		=	[];
		var documentUrl 					= 	'force.com/servlet/servlet';
		var activityContent 				= 	activity['activityContent'];
		
		if ( activity['activityContent']	&&	activity['activityContent'].indexOf('<img ' ) != -1 ) {
			while ( currentImage = $scope.imageRexExp.exec( activityContent ) ) {
				
				if(currentImage.length > 1) {
					var id	=	activity['Id'] + 'image'+$scope.imageCount;
					$scope.imageTags[id]			=	currentImage[0] ; //original image tag
					$scope.images.imageSrcs[id]		=	currentImage[1];	
					if ( rtaImageURL	&&	(currentImage[1].indexOf('\/') == 0 || currentImage[1].indexOf(rtaImageURL) > -1 || currentImage[1].indexOf(documentUrl) > -1)) {
						
						$scope.images.imageDimentions[id] 		=	{width:120, height:120};
						$scope.images.newImgTags[id]			=	'<img id="' + id + '" class="imageThumnail" ng-mouseover = \'setTitle("' + id + '")\' ng-click=\'getImagePreview("' + id + '")\' width="'+80+'px" src="' + currentImage[1] + '"/>';
						activityContent							=	activityContent.replace(currentImage[0], $scope.images.newImgTags[id]);
						activity['activityContent'] 			= 	activityContent;

						$scope.getImageDimentions(currentImage[1], id, currentImage[0]).then(function(image){
							var width 							=	80;
							if(image.width < 80)
								width = image.width;
							
							$scope.images.imageDimentions[image.id] =	{
																			width 	: Math.ceil(image.width), 
																			height 	: Math.ceil(image.height),
																			src 	: image.src
																		};

							var presentTag 							= 	$scope.images.newImgTags[image.id];
							$scope.images.newImgTags[image.id]		=	'<img id="' + image.id + '" class="imageThumnail" ng-mouseover = \'setTitle("' + image.id + '")\' ng-click=\'getImagePreview("' + image.id + '")\' width="'+width+'px" src="' + image.src + '"/>';
							activityContent							=	activityContent.replace(presentTag, $scope.images.newImgTags[image.id]);
							activity['activityContent'] 			= 	activityContent;
							activity['activityContent']				=	activity['activityContent'].replace(/<\s*\/\s*[Ii][Mm][Gg]\s*>/g, '');
							activity['body']						=	activity['activityContent'];
		
						});
						
					} else {
						activity['containsExternalImage']	=	true;
						$scope.images.newImgTags[id]		=	'<div ng-mouseover = \'setTitle("' + id + '")\' id="' + id + '" class="defaultImage"'+' title="' + currentImage[1] + '"/>';
						var escapedActivityContent = escape(activityContent);
						escapedActivityContent						=	escapedActivityContent.replace(escape(currentImage[0]), escape($scope.images.newImgTags[id]));
						activityContent = unescape(escapedActivityContent);
						$scope.externalImages[id]			=	'<img ng-mouseover = \'setTitle("' + id + '")\' id="' + id + '" class="imageThumnail" ng-click=\'getImagePreview("' + id + '")\' width="80px" src="' + currentImage[1] + '" title="' + currentImage[1] + '"/>';
						activity['activityContent'] 		= 	activityContent;
						activity['externalImageIds'].push(id);
					}
					
					$scope.imageCount++;
				}
				
			}
			
			activity['activityContent']		=	activity['activityContent'].replace(/<\s*\/\s*[Ii][Mm][Gg]\s*>/g, '');
			activity['body']				=	activity['activityContent'];
		}

	}
	
	$scope.updateAnchorTagTargetTo_blank = function(activity) {
		if ( activity['activityContent'] &&	activity['activityContent'].indexOf('<a ' ) != -1 ) {
			var currentAnchorTag;
			var updatedActivityContent = activity['activityContent'];
			while ( currentAnchorTag = $scope.anchorRexExp.exec( activity['activityContent'] ) ) {
				if(currentAnchorTag.length > 1) {
					var replacement = currentAnchorTag[0].replace(currentAnchorTag[1], "_blank");
					updatedActivityContent = updatedActivityContent.split(currentAnchorTag[0]).join(replacement);
				}
			}
			activity['activityContent'] = updatedActivityContent;
		}
	}

	$scope.showExternalImages = function( activity ) {
		activity['containsExternalImage']	=	false;
		
		if ( activity['externalImageIds'].length > 0 ) {
			angular.forEach( activity['externalImageIds'], function(id) {
				$scope.getImageDimentions($scope.images.imageSrcs[id], id, $scope.images.newImgTags[id]).then(function(image){
					
					var width 	= 	80;
					if(image.width < 80)
						width 	= 	image.width;

					$scope.images.imageDimentions[id] 	= 	{	
																width 	: Math.ceil(image.width), 
																height 	: Math.ceil(image.height),
																src 	: image.src
															};

					$scope.externalImages[id] 			= 	$scope.externalImages[id].replace('width="80px"', 'width="' + width + 'px"');

					if ( activity['hasAttachment'] ){
							var escapedActivityContent = escape(activity['body']);
							escapedActivityContent	=	escapedActivityContent.replace( escape($scope.images.newImgTags[id]),escape($scope.externalImages[id]) );
							activity['body'] = unescape(escapedActivityContent);
					}else{
						var escapedActivityContent = escape(activity['activityContent']);
						escapedActivityContent	=	(escapedActivityContent.replace( escape($scope.images.newImgTags[id]),escape($scope.externalImages[id] )));
						activity['activityContent'] = unescape(escapedActivityContent);
					}		
				});
							
			});
		}
	}

	$scope.getDecodedText = function(text) {
    	if(text) {
    		return RemedyForceHTMLProcessor.htmlDecoder(text);
	    }
	}
	
	$scope.setTitle = function(id) {
        var image = document.getElementById(id);
        if ($scope.imagesWithTitle[id]) {
            if ($scope.imagesWithTitle[id] != 'none')
                image.title = $scope.imagesWithTitle[id];
            return;
        } else {
            $scope.imagesWithTitle[id] = 'none';
            var currentEl = image;
            while (currentEl.parentNode) {
                currentEl = currentEl.parentNode;
                if (currentEl.tagName == 'div' && currentEl.name == 'ActivityContent')
                    return;
                if (currentEl.tagName === 'a' || currentEl.tagName === 'A') {
                    if($scope.externalImages[id]) {
                		image.title = currentEl.href;
                	}                 		
                    $scope.imagesWithTitle[id] = currentEl.href;                    
                    return;
                }
    		}
    	}
	
    }


    $scope.stripHtml = function(htmlContent){
    	if(htmlContent) {
	    	var htmlContentPlaceHolder = document.getElementById('htmlContentPlaceHolder');
	    	htmlContentPlaceHolder = RemedyForceHTMLProcessor.clearHTML(htmlContentPlaceHolder);
			var node = document.createElement('div');
			RemedyForceHTMLProcessor.parseHTML(node, htmlContent);
			RemedyForceHTMLProcessor.copyHTML(node, htmlContentPlaceHolder);
			
		    return htmlContentPlaceHolder.innerText || htmlContentPlaceHolder.textContent;
    	}
    	return htmlContent;
	}

	$scope.stopPropagation = function(event, mode) {
		if($scope.isChrome() || $scope.isFirefox() || $scope.isEdge())
			event.stopPropagation();
	}

	$scope.setVisibility = function(value) {
		var searchComponent = $('#searchtext');
    	if(value == undefined) {
    		searchComponent.val(''); 
			$scope.searchFieldNames();
			$scope.noFieldsFound = false;	

    		if($scope.fieldInfoMap.length == 0) {
    			sidebarModel.displayLoader();
    			sidebarModel.getFieldInfo($scope.moduleName).then(function(result){
    				$scope.fieldInfoMap = result;
    				$scope.fieldInfoMap  = $filter('orderBy')($scope.fieldInfoMap, 'fieldLabel');
                   	sidebarModel.hideLoader();
                   	$scope.mergeFieldIcon.clicked = true;
                   	searchComponent.prop('disabled', false);

                   	if(searchComponent.is(':visible')) {
                   		searchComponent.focus();
                   	} else {
                   		setTimeout(function() {
						   	searchComponent.focus();
						}, 5);
                   	}   

                   	$('.mergeFieldMenuDropdown').mCustomScrollbar({
                   		axis: 'y',
                   		theme: 'minimal-dark',
                   		scrollbarPosition: 'outside'
                   	})
               		$( "#mCSB_1_scrollbar_vertical" ).bind( "click", function( event ) {
               			event.stopPropagation();
               		}); 

    			});
    		}
    		else
    			$timeout(function () {
			       	$scope.mergeFieldIcon.clicked = !$scope.mergeFieldIcon.clicked;
			       	if($scope.mergeFieldIcon.clicked) {
			       		searchComponent.prop('disabled', false);
			       		if(searchComponent.is(':visible')) {
	                   		searchComponent.focus();
	                   	} else {
	                   		setTimeout(function() {
							   	searchComponent.focus();
							}, 5);
	                   	} 
			       	} else {
			       		searchComponent.prop('disabled', true);
			       	}
			       				       	
			    }, 500);
    	} else {
    		$timeout(function () {
		       	$scope.mergeFieldIcon.clicked = value;
		       	searchComponent.prop('disabled', true);
		    }, 750);
		    event.stopPropagation();
    	}
    }

    $scope.setBackFocus = function(divId, isShowLess) {
    	if(isShowLess == true)
    		document.getElementById(divId).focus();
    }

    $scope.copyFieldValue = function(mode, field) {
        var fieldData = field['fieldValue'] == undefined ? '' : field['fieldValue'];
        fieldData = RemedyForceHTMLProcessor.htmlDecoder(fieldData);
        var fieldType = field['fieldType'];
        if(fieldData) {
        	if(fieldType == 'DATETIME' ) {
		       	fieldData = new Date(fieldData);
		       	fieldData = $filter('date')(fieldData, userLocale);	
		    } else if(fieldType == 'DATE' ) {
		       	fieldData = new Date(fieldData);
		       	fieldData = $filter('date')(fieldData, userLocaleDateFormat);	
		    }
        }
		
	    
        if(fieldData != null) {
        	if (mode == 'plaintext') {
	        	if(fieldType == 'RICHTEXT')
	        		fieldData = $scope.stripHtml(fieldData);
	            var bodyComponent = document.getElementById('email_body');
	            if (bodyComponent != null && typeof(bodyComponent) != 'undefined' &&
	                bodyComponent.value != null && typeof(bodyComponent.value) != 'undefined') {
	                var startPos = bodyComponent.selectionStart;
                    var endPos = bodyComponent.selectionEnd;
                    if (startPos != null && typeof(startPos) != 'undefined' && endPos != null && typeof(endPos) != 'undefined') {
                        bodyComponent.focus();
                        bodyComponent.value = bodyComponent.value.substring(0, startPos) + fieldData +
                            bodyComponent.value.substring(endPos, bodyComponent.value.length);
                        bodyComponent.setSelectionRange(endPos + fieldData.length, endPos + fieldData.length);
                        $scope.email.emailBody = document.getElementById('email_body').value;
                    }
	            }
	        } else {
	            var rtfFrame =document.getElementById('rtfFrame');
                var dociFrame = rtfFrame.contentDocument;
                if (typeof(dociFrame) != 'undefined' && dociFrame != null) {
                    var iframeList = dociFrame.getElementsByTagName('iframe');
                    var ifrm = iframeList[0];

                    if (typeof(ifrm) != 'undefined' && ifrm != null) {
                        $scope.doc = ifrm.contentDocument;
                        $scope.win = ifrm.contentWindow;
                    }
                }
                if($scope.isIE11()) {
                	var richBodycomp = $scope.getRichComponent(rtfFrame);$(richBodycomp).focus();
                }
                if ($scope.win.getSelection) {
                    var sel = $scope.win.getSelection();
                    if (sel.rangeCount) {
                        var range = sel.getRangeAt(0);
                        range.deleteContents();
                        var node = $scope.doc.createTextNode(fieldData);
                        if(fieldType == 'RICHTEXT')
                            node = range.createContextualFragment(fieldData);
                        range.insertNode(node);
                        sel.removeRange(range);
                        if (node) {
                            var richBodycomp = $scope.getRichComponent(rtfFrame);if(!$(richBodycomp).is(':focus')) {$(richBodycomp).focus();}
	                    	range = range.cloneRange();
                            range.setStartAfter(node);
                            range.collapse(true);
                            sel.removeAllRanges();
                            sel.addRange(range);
                        }
                    }
                }
	        }
        }
        
    }

	$scope.getActivityAttachmentMap = function(attachmentMap){
		$scope.activityAttachmentMap = [];
		for(var outerIndex = 0;  outerIndex < $scope.activities.length; outerIndex++){
			if($scope.activities[outerIndex]['attachments'] != 'undefined' && $scope.activities[outerIndex]['attachments'] != null && $scope.activities[outerIndex]['attachments'] != '') {
				var associatedAttachmentIds = $scope.activities[outerIndex]['attachments'].split(",");
				for(var innerIndex = 0; innerIndex < associatedAttachmentIds.length; innerIndex++) {
					if(associatedAttachmentIds[innerIndex] != null && associatedAttachmentIds[innerIndex] != '' && associatedAttachmentIds[innerIndex] != 'undefined') {
						var attachmentId = associatedAttachmentIds[innerIndex];
						if(attachmentId in attachmentMap) {
							var attachment = new Object();
							attachment.activityId = $scope.activities[outerIndex]['Id'];
							attachment.hrefURL = ( attachmentMap[attachmentId].isFile ) ? '/' + attachmentId : '/servlet/servlet.FileDownload?file=' + attachmentId; 
							attachment.attachmentValue = attachmentMap[attachmentId];
							$scope.activityAttachmentMap.push(attachment);
							$scope.activities[outerIndex].hasAttachment = true;
						} else {
							$scope.activities[outerIndex].hasAttachment = false;
						}
					}
					
				}
				
			}
				
		}
	}
	
	$scope.splitActivityNote = function(activitiesList){
		for(var index = 0; index < activitiesList.length; index++) {

			if(activitiesList[index] && activitiesList[index].isReply) {
				activitiesList[index].toAddress = RemedyForceHTMLProcessor.htmlDecoder(activitiesList[index].toAddress);
				activitiesList[index].ccAddress = RemedyForceHTMLProcessor.htmlDecoder(activitiesList[index].ccAddress);
				var content 		= 	activitiesList[index]['activityContent'] ;	
				var splitterText 	=	$scope.splitterText;
				if(activitiesList[index]['isRichTextContent']) {
					splitterText 	=	splitterText.trim();
				}
				if(content) {
					var originalContent = content;
					// checking if the email content contains reply separator then before reply separator is the original email content
					var replySeparatorContent = /<div\b[^>]*id="divHR"[^>]*>([\s\S]*?)<\/div>/g.exec(originalContent);
					if( replySeparatorContent && replySeparatorContent.length == 2) {
						originalContent = originalContent.substr(0, originalContent.indexOf(replySeparatorContent[0]));
					} else if(originalContent.indexOf($scope.replyPlainEmailSeparator) >=0) {
						originalContent = originalContent.substr(0, originalContent.indexOf($scope.replyPlainEmailSeparator));
					} else if(originalContent.indexOf($scope.replyPlainEmailSeparator.replace(' ', String.fromCharCode(160))) >=0) {
						originalContent = originalContent.substr(0, originalContent.indexOf($scope.replyPlainEmailSeparator.replace(' ', String.fromCharCode(160))));
					}
					if(typeof originalContent != 'undefined' && (originalContent).indexOf(splitterText) != -1){
						
						var bodyStartIndex = originalContent.split(splitterText, 2).join(splitterText).length;
						
						if(activitiesList[index]['isRichTextContent']){
							bodyStartIndex = bodyStartIndex+30;
							bodyStartIndex += 12;
							activitiesList[index].attachmentContent = content.substr(0,bodyStartIndex-12);
						} else {
							bodyStartIndex = bodyStartIndex+32;
							activitiesList[index].attachmentContent = content.substr(0,bodyStartIndex).replace(/\r?\n|\r/g,'<br>');
						}
						
						if(activitiesList[index].hasAttachment ){
							activitiesList[index].body = content.substr(bodyStartIndex);
						}
						
						activitiesList[index].activityContent = content.substr(bodyStartIndex);
					}
					
					if(activitiesList[index]['isRichTextContent']) {
						$scope.createThumbNails(activitiesList[index]);
						$scope.updateAnchorTagTargetTo_blank(activitiesList[index]);
					}
				}
			}
		}

		return activitiesList;
	}		
	

	$scope.getImagePreview = function(id) {
		if($scope.images.imageDimentions[id].width > 80) {
			if ($scope.imagesWithTitle[id] == undefined || $scope.imagesWithTitle[id] == 'none') {
				$scope.message			=	{
												title: 'imagePriview',
												width: $scope.images.imageDimentions[id].width,
												height: $scope.images.imageDimentions[id].height,
												src:  $scope.images.imageDimentions[id].src
											}
											
				if(isEmbeddedMode || showSidebarOnly ) {
					if(parent && parent.window.location.href)
						window.parent.postMessage($scope.message, parent.window.location.href);
				}
				else {
					rfModal.openImagePopup($scope.message);
				}
	        }
		}
		
	};
	
	$scope.cleanEmailData = function(){
	   $scope.email = {
		   "toEmails":"",
		   "CCEmails":"",
		   "BccEmails":"",
		   "emailBody":"",
		   "prevContentHolder" :""
	   };
	   $scope.selectedTemplate = {"value" : "none"};
	   $scope.sendEmailAttachmentMap = [];
	   var actionParams = {};
	   actionParams.Id = $scope.EmailAttachmentGeneratorReference;
	   
	   Visualforce.remoting.Manager.invokeAction(				

			_RemotingActions.performAttachmentActions,'DELETE', actionParams,	
			function(result, event){
				if (event.status){					
					$scope.EmailAttachmentGeneratorReference = '';
				}else
					rfModal.openInfoMessage($scope,"error",result);						   
					$scope.hideMask();                              
			}, 
			{escape: false}
		);
		$scope.EmailAttachmentGeneratorReference = '';
		$scope.editor.clearEditor();
		$scope.emailDetailsClicked = true;
		$scope.emailContentClicked = true;
		$scope.editor.setEditorSize();
		$scope.tempEmailBody = "";
		$scope.emailSignatureInsertedOnce = false;
		$scope.isLinksInsertedOnEmailIconClick = false;
		$scope.isReplyEmail = false;
	}
	$scope.getAttachments = function(){
		$scope.moduleName = $scope.moduleName.replace(namespacePrefix,'');
		$scope.remoteCallsInProgress++;
			sidebarModel.getAttachments($scope.moduleName).then(function(result){
			$scope.attachments = result;
			$scope.remoteCallsInProgress--;
			$scope.loadRtfEditor();
			if(showSidebarOnly != true && (isEmbeddedMode != true || navigator.appName == 'Microsoft Internet Explorer' || navigator.appName == 'Netscape')){
				setSidebarAndGraphHeight();
			}
		});		
	}
	$scope.getActions = function(){
		$scope.moduleName = $scope.moduleName.replace(namespacePrefix,'');
		$scope.remoteCallsInProgress++;
			sidebarModel.getActions($scope.moduleName).then(function(result){
				for(var i=0; i<result.length; i++){
					result[i].Name = RemedyForceHTMLProcessor.htmlUnescape(unescape(result[i].Name));
				}
				$scope.Actions.ActionList = result;
				$scope.Actions.ActionList.size = result.length;
				$scope.remoteCallsInProgress--;
				$scope.loadRtfEditor();
			});		
	}
	if($scope.showSidebarOnly == true){
		$scope.getActions();
		$scope.getActivities();
		$scope.getAttachments();
		if($window.parent != null && $window.parent != undefined && typeof $window.parent.activityFeedDataLoadStarted == 'function')
			$window.parent.activityFeedDataLoadStarted();
	}
	$scope.fileSelected = function(){		
		if($scope.checkAPIpermissions('newAttFiles') != false){
			$scope.$apply(function(){		
				$scope.showAttachFile = true;
				$scope.newAttachment = $('#newAttFiles')[0].files;
				$scope.$parent.recordDetailsClicked = false;
				$scope.attachmentClicked = true;
				$scope.activityClicked = false;
			});	
			if(isFilesEnabled)
				$scope.saveAttachFile_AsFile();
			else
				$scope.saveAttachFile();
			$scope.showMask();	
		}
	};
	$scope.refreshConsoleRelated = function(){
			if((showSidebarOnly == true || isEmbeddedMode == true)&& $window.parent != undefined ){
				if(showSidebarOnly == true)
					$window.parent.isCalledFromActivityFeed = true;
				$window.parent.isNeedToRefreshRelatedList = true;
				if(typeof $window.parent.refreshIncRelatedListTimeOut == 'function'){
					$window.parent.refreshIncRelatedListTimeOut();
				}else if(typeof $window.parent.refreshProblemRelatedListTimeOut == 'function'){
					$window.parent.refreshProblemRelatedListTimeOut();
				}else if(typeof $window.parent.refreshReleaseRelatedListTimeOut == 'function'){
					$window.parent.refreshReleaseRelatedListTimeOut();
				}else if(typeof $window.parent.refreshTaskRelatedListTimeOut == 'function'){
					$window.parent.refreshTaskRelatedListTimeOut();
				}else if(typeof $window.parent.refreshChangeRelatedListTimeOut == 'function'){
					$window.parent.refreshChangeRelatedListTimeOut();
				}
				
			}
	};
		
	$scope.validateAttachment = function(attachFile){
		if(attachFile == ''){
			rfModal.openInfoMessage($scope,"error",_Labels.message.attachmentRequired);
				return false;
		}
		if(attachFile.size == 0){
			rfModal.openInfoMessage($scope,"error",_Labels.message.emptyFile);
			$scope.newAttachment= [];
			return false;
		}
		if(attachFile.size > pageLoadData.attachmentLimit){
			rfModal.openInfoMessage($scope,"error",_Labels.message.attachmentLimit);
			$scope.newAttachment= [];
			return false;
		}
	};
	
	$scope.validateAttachment_File = function(attachFile){
		if(attachFile == ''){
			rfModal.openInfoMessage($scope,"error",_Labels.message.attachmentRequired);
				return false;
		}
			
		if(attachFile.size > pageLoadData.fileLimit){
			rfModal.openInfoMessage($scope,"error",_Labels.message.fileLimit);
			$scope.newAttachment= [];
			return false;
		}
		
		if(attachFile.size == 0){
			rfModal.openInfoMessage($scope,"error",_Labels.message.emptyFile);
			$scope.newAttachment= [];
			return false;
		}
	};
	
	$scope.checkAPIpermissions = function(emailFieldId){
		if($scope.hasAPIEnabledPermissions == false){
			var control = $('#'+emailFieldId);
			control = control.val('').clone(true);
			if($scope.isAdminUser == false){
				rfModal.openInfoMessage($scope,"error",_Labels.message.ProfileNonSysAdminPermission);
			}else{			
				var errorMessage = _Labels.message.ProfileSysAdminPermission + ' <a class="error-anchor" href="https://docs.bmc.com/docs/display/remforce201702/Troubleshooting+issues+related+to+Activity+Feed" target="_blank"> '+_Labels.message.here+'</a>.';
				rfModal.openInfoMessage($scope,"error",errorMessage,10000);	
			}
			return false;
		}
		return true;
	};
	(function () {

		if ( typeof window.CustomEvent === "function" ) return false;
	  
		function CustomEvent ( event, params ) {
		  params = params || { bubbles: false, cancelable: false, detail: null };
		  var evt = document.createEvent( 'CustomEvent' );
		  evt.initCustomEvent( event, params.bubbles, params.cancelable, params.detail );
		  return evt;
		 }
	  
		CustomEvent.prototype = window.Event.prototype;
	  
		window.CustomEvent = CustomEvent;
	  })();
	//This watch triggers an event when change in Attachments array is detected
	$scope.$watch(function(scope){
		return scope.attachments
	  }, function(newVal,oldVal){
		if(newVal) {
			var event = new CustomEvent('activityFeedAttachFileChange', { detail: newVal.length });
			window.parent.document.dispatchEvent(event);
		}
	  });
	$scope.saveAttachFile = function(){		
		var reader = new FileReader();
		var attachFile = '';
		attachFile = $('#newAttFiles')[0].files[0];
		validation = $scope.validateAttachment(attachFile);
		
		if(validation != false){
		$scope.inProgress = true;
		sidebarModel.displayLoader();
				
			client.createBlob('Attachment', {
				IsPrivate: false,
	            Name:attachFile.name,
	        	ContentType : attachFile.type,
				Description : attachFile.name,
				ParentId : selectedNodeID
	            
	        }, attachFile.name, 'body', attachFile, function(response){
	        	  
							rfModal.openInfoMessage($scope,"success",_Labels.message.AttchmentAddedSuccessfuly);
							var control = $('#newAttFiles');
							control = control.val('').clone(true);							
							$scope.$apply();
							$scope.refreshConsoleRelated();
							$scope.getAttachments();	
							$scope.hideMask();	
							sidebarModel.hideLoader();
							$scope.hideAttachmentPanel();
	             }, function(request, status, response){
	            	
	          	   		rfModal.openInfoMessage($scope,"error",status);
						sidebarModel.hideLoader();
				});	

		}		
	};
	
	
	$scope.saveAttachFile_AsFile = function(){		
		var attachFile = '';
		attachFile = $('#newAttFiles')[0].files[0];
		validation =true;
		validation = $scope.validateAttachment_File(attachFile);		
		if(validation != false){
		$scope.inProgress = true;
		sidebarModel.displayLoader();
			client.createBlob('ContentVersion', {
	              Origin: 'C', 
	              PathOnClient: attachFile.name,
	              Title:attachFile.name
	              
	          }, attachFile.name, 'VersionData', attachFile, function(response){
	               
		               var versionRecord = sforce.connection.query("select id, ContentDocumentId from ContentVersion WHERE Id ='"+response.id+"' limit 1");
								records = versionRecord.getArray("records");
								var documentLink = new sforce.SObject('ContentDocumentLink'); 
								documentLink.ContentDocumentId = records[0].ContentDocumentId; 
								documentLink.LinkedEntityId = selectedNodeID;
								documentLink.ShareType = 'V';
								sforce.connection.create([documentLink], {
								onSuccess : function(result, source) {
									if (result[0].getBoolean("success")) {
										rfModal.openInfoMessage($scope,"success",_Labels.message.AttchmentAddedSuccessfuly);
										var control = $('#newAttFiles');
										control = control.val('').clone(true);		
										$scope.$apply();
										$scope.refreshConsoleRelated();
										$scope.getAttachments();	
										$scope.hideMask();	
									}
									else {
										$scope.displayErrorMessage(error);
									}
						sidebarModel.hideLoader();
						$scope.hideAttachmentPanel();
					},
					onFailure : function(error, source) {
						$scope.displayErrorMessage(error);
						sidebarModel.hideLoader();
					}
				});	
	               }, function(request, status, response){
	            	   rfModal.openInfoMessage($scope,"error",status);
						sidebarModel.hideLoader();
	          });
			
		}		
	};
	
	$scope.beforeSendEmail = function(){
		if($scope.editor.mode == 'plaintext'){
			$scope.email.emailBody = $scope.truncateLongStringToSendInEmail($scope.email.emailBody);
			$scope.sendEmail($scope.email.emailBody,$scope.email.emailBody); 
		}
		else if($scope.editor.mode == 'richtext'){
			$scope.editor.fetchEmailContent($scope.sendEmail);
		}
	}
	
    $scope.sendEmail = function(emailBody,emailBodyRtf){
		$scope.moduleName = $scope.moduleName.replace(namespacePrefix,'');
		var historyType = $scope.DeepViewconfiguration["objects"][$scope.moduleName]["actionObjAPI"];
		var masterField = $scope.DeepViewconfiguration["objects"][$scope.moduleName]["actionParentFldAPI"];
		var history = $scope.DeepViewconfiguration["objects"][$scope.moduleName]["historyObject"];
		if($scope.email.emailSubject == undefined ){
			$scope.email.emailSubject = '';
		}
		params = {};
		if($scope.fromEmails!=undefined && $scope.fromEmails.length>0 && $scope.fromEmails.length==1){
			params.fromEmail = $scope.fromEmails[0].OrgWideEmailId;
		}else{
			params.fromEmail =  $scope.email.fromEmail;
		}			
		if($scope.selectedTemplate && $scope.selectedTemplate.value != 'none'){
			params.emailTemplateId = $scope.selectedTemplate.value;
			angular.forEach($scope.emailTemplates, function(template) {
				if(template.value == $scope.selectedTemplate.value){
					params.emailSubject = template.label;
				}
			});
		}else{
			params.emailSubject = $scope.email.emailSubject;
		}
		if($scope.sendEmailAttachmentMap.length>0){
			params.attachmentIds = '';
			angular.forEach($scope.sendEmailAttachmentMap, function(singleAttachmentObject) {
				params.attachmentIds += singleAttachmentObject.Id+',';				
			});
		}
		params.attRefGeneratorId = $scope.EmailAttachmentGeneratorReference;
		params.saveAttachmentsFlag = $scope.email.saveAttachmentsFlag;
		params.toEmails =  $scope.email.toEmails;
		params.CCEmails = $scope.email.CCEmails;
		params.BccEmails =  $scope.email.BccEmails;
		params.emailBody = emailBody;
		params.emailBodyRtf = emailBodyRtf;
		// Replace img src &amp; with &
		if(params.emailBodyRtf && params.emailBodyRtf.indexOf('<img ' ) != -1) {
			var imageSrcEmailBodyRTF = params.emailBodyRtf;
			var currentImage;
			while ( currentImage = $scope.imageRexExp.exec( params.emailBodyRtf ) ) {
				if(currentImage.length >= 1 && params.emailBodyRtf.indexOf(currentImage[1])) {
					var replacement = RemedyForceHTMLProcessor.htmlDecoder(currentImage[1]);
					imageSrcEmailBodyRTF = imageSrcEmailBodyRTF.split(currentImage[1]).join(replacement);
				}
			}
			params.emailBodyRtf = imageSrcEmailBodyRTF
		}
		params.recordName = $scope.parentNodeData.Name;
		if($scope.isReplyEmail) {
			params.isNew = 'false';
		}
		if($scope.editor.mode == 'richtext'){
			params.rtf = 'true';
		}
        Visualforce.remoting.Manager.invokeAction(				
			_RemotingActions.performUserActions,selectedNodeID,$scope.moduleName,'sendemail', params,	
            function(result, event){
                if (event.status) {
					if(result == 'Send Successfully'){
						$scope.ShowMore.ShowActivityFeedActionsInBatches = false;
						$scope.getActivities();
						if($scope.sendEmailAttachmentMap.length>0
							&& $scope.email.saveAttachmentsFlag){
							$scope.getAttachments();
						}
						$scope.showSendEmail = false;
						$scope.hideEmailPanel();							
						rfModal.openInfoMessage($scope,"success",_Labels.message.emailSent);					   
						$scope.collapseSideBarForEmail();
						$scope.cleanEmailData();
					}else
						rfModal.openInfoMessage($scope,"error",RemedyForceHTMLProcessor.htmlEscapeForRtfEditor(result));						   
						$scope.hideMask();
                    } else if (event.type === 'exception') {
					    var error='UNVERIFIED_SENDER_ADDRESS';	
						var messageString = event.message;
					   if(messageString.indexOf('INVALID_EMAIL_ADDRESS') > 0){
						   rfModal.openInfoMessage($scope,"error",_Labels.message.invalidEmailAddress);						  
					   }else  if(messageString.indexOf(error) >0){
							messageString =_Labels.message.UnVarifiedOrgWideEmailAddress;
							rfModal.openInfoMessage($scope,"error",messageString);
					   }else if(messageString.indexOf('SINGLE_EMAIL_LIMIT_EXCEEDED') > 0){
							messageString = messageString.substring(messageString.lastIndexOf('SINGLE_EMAIL_LIMIT_EXCEEDED'),messageString.length());
							rfModal.openInfoMessage($scope,"error",messageString);
						}else{
						   rfModal.openInfoMessage($scope,"error",event.message);
					   }
                   } else {
                       rfModal.openInfoMessage($scope,"error",event.message);
                }
                $scope.$apply();
				sidebarModel.hideLoader();
            }, 
            {escape: false});
		sidebarModel.displayLoader();
    };
	$scope.clearNotes = function(){
		$scope.quickNote.data = '';
		$scope.showAddNote=false;
		$scope.hideMask();
		$scope.Actions.isActionBtnClicked = false;
	};	
    $scope.saveNotes = function(bAction){
		if(!bAction)
			$scope.Actions.ActionId = 'addnote';
		$scope.moduleName = $scope.moduleName.replace(namespacePrefix,'');
	    if(!bAction && ($scope.quickNote.data == undefined || $scope.quickNote.data == '')){
		    rfModal.openInfoMessage($scope,"error", _Labels.message.fldsRequired);
		    return;
		}
		if($scope.quickNote.data.length > parseInt(actionNoteMaxLength)){
			rfModal.openInfoMessage($scope,"error", cmdbTextFieldLimitExceededLabel.replace('{0}',actionNoteMaxLength));
		    return;
		}
		params = {};
		params.note = $scope.quickNote.data;
		params.durationString = $scope.quickNote.durationString;
        Visualforce.remoting.Manager.invokeAction(				
			_RemotingActions.performUserActions,selectedNodeID,$scope.moduleName,$scope.Actions.ActionId, params,
            function(result, event){
            if(event.status){  
				if(result == 'Success'){
					$scope.ShowMore.ShowActivityFeedActionsInBatches = false;
					$scope.getActivities();
					if($scope.Actions.ActionId == 'addnote')
						rfModal.openInfoMessage($scope,"success",_Labels.message.noteAdded);
					else
						rfModal.openInfoMessage($scope,"success",_Labels.message.actionAdded);
					$scope.quickNote.data = '';
					$scope.showAddNote=false;
					$scope.$apply();
					$scope.hideMask();
					$scope.refreshConsoleRelated();
				}else
					rfModal.openInfoMessage($scope,"error",result);
				}else if(event.type == 'exception'){
				    if(event.message.indexOf('FIELD_CUSTOM_VALIDATION_EXCEPTION') > 0
						&& event.message.indexOf('closed') > 0){
					    rfModal.openInfoMessage($scope,"error", _Labels.message.recordClosedAlready);
					}else if(event.message.indexOf('STRING_TOO_LONG') > 0){
				    	rfModal.openInfoMessage($scope,"error",_Labels.message.TextAreaOverflow);
				 	}else{
						rfModal.openInfoMessage($scope,"error", event.message);
					}
                }else{
                    rfModal.openInfoMessage($scope,"error", event.message);
                }
				sidebarModel.hideLoader();
                },
            {escape: false});
			sidebarModel.displayLoader();
		$scope.Actions.isActionBtnClicked = false;
    };
    
	$scope.hidePanels = function(){
        $scope.showAttachFile = false;
        $scope.showAddNote = false;
        $scope.showSendEmail = false;
        $scope.showServiceTarget = false;
        $scope.saveImage = false;
        $scope.showApprovals = false;
    };
    $scope.searchUser = function(eleID, elementName){
        var searchString = $scope[elementName.split('.')[0]][elementName.split('.')[1]];
        searchString = searchString.lastIndexOf(';') >= 0 ? searchString.substring(searchString.lastIndexOf(';')+1, searchString.length) : searchString;
		if(searchString == undefined || searchString == '' || searchString.trim().length < 1){
            $scope.showUserAutoSuggestion = false;
            return;
        }
		searchString = searchString.trim();
        Visualforce.remoting.Manager.invokeAction(
            _RemotingActions.searchUser,searchString,$scope.userSearchCallback,
                {escape: false}
        );
        $scope.searchField = eleID;
		var inputElement = document.getElementById(eleID);
        var elm = angular.element(inputElement);
        elm.after(autoSuggestComponent);
    };
    $scope.userSearchCallback = function(result,event){
		if(event.status){
			$scope.userSuggestions = JSON.parse(result);
			if($scope.userSuggestions != undefined ){
				$scope.userResults = $scope.userSuggestions.users;
				angular.forEach($scope.userResults,function(user,index){				   
					user.isSelected = false;
				});
				$scope.contactResults = [];
				angular.forEach($scope.userSuggestions.contacts,function(contact){
					if(contact.Email) {
						$scope.contactResults.push(contact);
						contact.isSelected = false;
					}
				});
				if($scope.userResults && $scope.userResults.length > 0) 
					$scope.userResults[0].isSelected = true;
				else if($scope.contactResults && $scope.contactResults.length > 0) 
					$scope.contactResults[0].isSelected = true;
				if(!$scope.contactResults)
					$scope.contactResults =[];
				$scope.selectedIndex = 0;
				if(($scope.userResults != undefined && $scope.userResults.length > 0 )||($scope.contactResults != undefined && $scope.contactResults.length > 0)){
					$scope.showUserAutoSuggestion = true;
				}else{
					$scope.showUserAutoSuggestion = false;
				}
			}		
			$scope.$apply();
		}else{
			rfModal.openInfoMessage($scope,"error", event.message);	
		}	
    };
	$scope.hideAutoSuggestion = function(){		
		if($scope.isFocusOnAutosuggestionContainer){
			if($scope.isFocusOnAutosuggestion){
				$scope.addSelectedMail();
			}	
		}else{
			$scope.showUserAutoSuggestion = false;
		}
	};
    $scope.populateEmailInput = function(email){
        var inputValue = $('#'+$scope.searchField).val();
        inputValue = inputValue.lastIndexOf(";") > 0 ? inputValue.substring(0, inputValue.lastIndexOf(";")+1) : '';
		inputValue += email + ';';
        $('#'+$scope.searchField).val(inputValue);
		$scope.email[$scope.searchField] = inputValue;
        $scope.showUserAutoSuggestion = false;
		$scope.userResults = [];
		$scope.contactResults = [];
    };  
	$scope.fnconvertsize = function(bytessize,decimalPoint) {
        var sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
        if (bytessize == 0) return '0 Byte';
        var i = parseInt(Math.floor(Math.log(bytessize) / Math.log(1024)));
		return (bytessize / Math.pow(1024, i)).toFixed(decimalPoint) + ' ' + sizes[i];
    };
	$scope.showEmailPanel = function(){ 		
		var mainPanel = document.getElementById('quickDetailsPanel');
		if(mainPanel && mainPanel.scrollTop != undefined)
			mainPanel.scrollTop = 0;
		$scope.emailSettings.clicked = false;
		$scope.mergeFieldIcon.clicked = false;
		if(($scope.recordState == true || $scope.recordState == 'true' || $scope.isReplyEmail) && $scope.isSendEmailAvailable == true){		
			$scope.loadRtfEditor(true);
			$scope.showSendEmail=true;
			$scope.showAddNote=false;
			$scope.$parent.recordDetailsClicked = false;
			$scope.activityClicked = true;				
			if(!$scope.isReplyEmail)
			{
				$scope.loadEmailSettings();
			}			
			var toAddress = '';	
			if($scope.email.toEmails != undefined && $scope.email.toEmails !=''){
				toAddress = $scope.email.toEmails;
			}
			var objectName = selectedNodeAPI.replace(namespacePrefix, '').toLowerCase();
			
			if(toAddress == ''){
				if(objectName == 'incident__c' || objectName == 'task__c'){				
					if($scope.parentNodeData[namespacePrefix+'FKClient__r'] != undefined)
						toAddress = $scope.parentNodeData[namespacePrefix+'FKClient__r']['Email'];
					else if($scope.parentNodeData[namespacePrefix+'FKContact__r'] != undefined){
						toAddress = $scope.parentNodeData[namespacePrefix+'FKContact__r']['Email'];
					}else if($scope.parentNodeData[namespacePrefix+'FKLead__r'] != undefined){
						toAddress = $scope.parentNodeData[namespacePrefix+'FKLead__r']['Email'];
					}				
				}else if(objectName == 'change_request__c' && $scope.parentNodeData[namespacePrefix+'FKInitiator__r'] != undefined){
					toAddress = $scope.parentNodeData[namespacePrefix+'FKInitiator__r']['Email'];
				}
			}
			if(toAddress != undefined && toAddress.lastIndexOf(";") < 0){
				$scope.email.toEmails = toAddress ? toAddress+';' :'';
			}	 
			$scope.email.saveAttachmentsFlag = $.cookie("saveAttachmentsFlag");
			$scope.expandSideBarForEmail();
			$('#maskHeader').css('display','block');
			$scope.showMask();
			
			if($scope.fromEmails!=undefined && $scope.fromEmails.length>0){
				for(var i=0; i < $scope.fromEmails.length; i++){
					if($scope.fromEmails[i].isDefault == 'true'){
						$scope.defaultFromEmail = $scope.fromEmails[i];
						$scope.email.fromEmail = $scope.fromEmails[i].OrgWideEmailId;
					}
				}
				if($scope.defaultFromEmail.length==undefined){
					$scope.defaultFromEmail = $scope.fromEmails[0];
					$scope.email.fromEmail = $scope.fromEmails[0].OrgWideEmailId;
				} 
			} 				
          
		}			
		$scope.checkContainer();
		$scope.showSendButtons.showUpperSendButtons = true;
    };

    $scope.getEmailSubjectLine = function() {
		if($scope.parentNodeData[namespacePrefix+'isServiceRequest__c'] != undefined && $scope.parentNodeData[namespacePrefix+'isServiceRequest__c']==true){
			return $scope.ObjectLabels["singular"]["Service_Request__c"] + ' #' + $scope.parentNodeData.Name;	 	
		}else{	
			return $scope.ObjectLabels["singular"][selectedNodeAPI.replace(namespacePrefix, '')] + ' #' + $scope.parentNodeData.Name;	 	
		}
    }

    $scope.getRefUID = function() {

    	if(selectedNodeAPI){
    		if(selectedNodeAPI.replace(namespacePrefix, '').toLowerCase() == 'incident__c'){
            	return '(Ref:IN:' + $scope.parentNodeData.Name + ')';
	        }
	        else if(selectedNodeAPI.replace(namespacePrefix, '').toLowerCase() == 'change_request__c'){
            	return '(Ref:CR:' + $scope.parentNodeData.Name + ')';
	        }
	        else if(selectedNodeAPI.replace(namespacePrefix, '').toLowerCase() == 'problem__c'){
            	return '(Ref:PR:' + $scope.parentNodeData.Name + ')';
	        }
	        else if(selectedNodeAPI.replace(namespacePrefix, '').toLowerCase() == 'task__c'){
            	return '(Ref:TA:' + $scope.parentNodeData.Name + ')';
	        }
    	}        
		return '';

    }

	$scope.focusOnSetting = function(emailDetailsClicked) {
		if(emailDetailsClicked){
			var mainPanel = $('#quickDetailsPanel');
			if(mainPanel && mainPanel.scrollTop != undefined){
				mainPanel.animate({
				    scrollTop: 200
				}, 1200);
			}
		}
	}
	
    $scope.loadRtfEditor = function(forceLoad){
		if(!$scope.isReplyEmail)
			$scope.editor.mode = ( $scope.boolAllowRichTextArea && ('true' == $scope.getTextFormatEmailCovo() || true == $scope.getTextFormatEmailCovo()) && $scope.selectedTemplate.value == 'none' ) ? 'richtext' : 'plaintext';
		
    	forceLoad= forceLoad?forceLoad:false;
    	if($scope.remoteCallsInProgress == 0 || forceLoad){
	    	var checkEl = document.getElementById('rtfFrame');
	    	if(typeof(checkEl) == 'undefined' || !checkEl){
	    		//check variable which is set from DeepView.page for RichTextNote__c Field Levels Access...

		    	var html = '<iframe src="/apex/rtfeditor" ng-style="{\'border\':\'none\',\'width\':\'100%\',\'height\':(rtfHeight+50)}" id="rtfFrame" onLoad="callResizeHandler();" id="rtfFrame" ng-show="editor.mode== \'richtext\' && boolAllowRichTextArea == true && selectedTemplate.value ==\'none\'"></iframe>';
		    	var compiledHtml = $compile(html)($scope);
		    	var el = document.getElementById('iframePlaceHolder');
		        var elm = angular.element(el);
		        elm.after(compiledHtml);
	    	}
    	}
    }
    
	$scope.showAddNotes = function(){
		$scope.Actions.ActionName = _Labels.modal.addNotes;
		$scope.Actions.isAction = false;
		if($scope.recordState == true || $scope.recordState == 'true'){	
			$scope.actionHideDuration = actionHideDuration;		
			$scope.isActionEditable = isActionEditable;
			if(!$scope.actionHideDuration){
				$scope.quickNote.durationString = '00:00';
			}
			
			$scope.showAddNote=true;
			$scope.showSendEmail=false;
			$scope.collapseSideBarForEmail();
			$scope.$parent.recordDetailsClicked = false;
			$scope.activityClicked = true;
			$('#maskHeader').css('display','block');			
			$scope.showMask();
			$scope.cleanEmailData();
		}	
	}
	$scope.selectedAction = 'default';
	$scope.showActionEditor = function(selectedAction){
		
		$scope.Actions.isAction = true;
		$scope.Actions.isActionBtnClicked = false;
		$('#actionDiv').css('display','none');
		if (selectedAction != 'default') {
			for(var i=0; i < $scope.Actions.ActionList.length; i++){
				if($scope.Actions.ActionList[i].Id == selectedAction) {
					$scope.Actions.ActionName = $scope.Actions.ActionList[i].Name;
					$scope.actionHideDuration = $scope.Actions.ActionList[i][namespacePrefix+'HideDuration__c'];
					$scope.isActionEditable = $scope.Actions.ActionList[i][namespacePrefix+'autoModify__c'];
				}
			}
			
			if($scope.isActionEditable && !$scope.actionHideDuration)
				$scope.quickNote.durationString = '00:00';
			else
				$scope.quickNote.durationString = '';
			$scope.Actions.ActionId = selectedAction;
			
			if(!$scope.isActionEditable){
				$scope.saveNotes($scope.Actions.isAction);
				return;
			}
			
			var AddActionsEle = document.getElementById("AddActionsId");

	        if($scope.recordState == true || $scope.recordState == 'true'){				
				$scope.showAddNote=true;
				$scope.selectedAction = 'default';
				$scope.showSendEmail=false;
				$scope.collapseSideBarForEmail();
				$scope.$parent.recordDetailsClicked = false;
				$scope.activityClicked = true;
				$('#maskHeader').css('display','block');			
				$scope.showMask();
				$scope.cleanEmailData();
			}
	    }

	    setTimeout(function() { 
		   $('#actionEditor').focus();
		}, 5);
	}
	$scope.showActionMenu= function(event){
		$('#actionDiv').css('display','inline-block');
		var recordFrame= document.getElementById('quickDetailsPanel');
		if(recordFrame){
			var frameWidth= recordFrame.innerWidth || recordFrame.clientWidth;
			var menuWidth = frameWidth*0.75;
			$('#actionDiv').css('max-width', menuWidth +'px');
		}
		var isIE11 = $scope.isIE11();
		var isEdge = $scope.isEdge();
		if($scope.Actions.ActionList.length > 6){
			
			$('#actionDiv').addClass('container-scrollbar');


		}
		$("#mCSB_1_scrollbar_vertical" ).bind( "click", function( event ) {
			event.stopPropagation();
		});   
		var mainPanel = document.getElementById('quickDetailsPanel');
		var hasScrollBar = mainPanel.scrollHeight > mainPanel.clientHeight;
		if(!hasScrollBar){
			$('#actionDiv').addClass('container-action-menu_fixed');
		} else{
			$('#actionDiv').removeClass('container-action-menu_fixed');
		}
		var rightShift;
		if(isIE11)
			rightShift = 39;
			
		$('#actionDiv').css('right', rightShift +'px');
		$scope.Actions.isActionBtnClicked = !$scope.Actions.isActionBtnClicked;
		if(!$scope.Actions.isActionBtnClicked)
			$('#actionDiv').css('display','none');
		var panelHeight = $scope.Actions.ActionList.length<12?(12 - $scope.Actions.ActionList.length)*25:0;
		var dropdownHt = 25;
		var floatDropDown = ((mainPanel.scrollHeight - event.clientY) > $scope.Actions.ActionList.length*25);
		if((!floatDropDown || !hasScrollBar)  && $scope.showSidebarOnly != true){
			rightShift = 48;
			if(!hasScrollBar){
				rightShift = 35;
				if(isIE11)
					rightShift = 18;
			}
			if(isIE11)
				rightShift += 21;
			$('#actionDiv').addClass('container-action-menu_fixed');
			$('#actionDiv').css('right', rightShift +'px');
			if(window.innerHeight < 450){
				if(panelHeight > 0 && (window.innerHeight/2 > (window.innerHeight-event.clientY)))
					dropdownHt = panelHeight + 50;
				else{
					dropdownHt = 110;
					if(isIE11)
						dropdownHt = 100;
				}
			}
			else if((window.innerHeight/2 > (window.innerHeight-event.clientY)) && ((window.innerHeight-event.clientY) <(250+panelHeight))){
				if(window.innerHeight > 600)
					dropdownHt = -panelHeight+ (window.innerHeight-event.clientY)+100;
				else{
					if(window.innerHeight-event.clientY < (50+panelHeight))
						dropdownHt = (event.clientY-window.innerHeight)+210+panelHeight;
					else if(window.innerHeight-event.clientY < (100+panelHeight))
						dropdownHt = (window.innerHeight-event.clientY)+100+panelHeight;
					else
						dropdownHt = (window.innerHeight-event.clientY);
				}
			}else{
				dropdownHt = 110;
				if(isIE11)
					dropdownHt = 100;
			}
		}
		$('#actionDiv').css('top',dropdownHt+'px');
	}
	$scope.hideActionMenu= function(event){
		var eventTarget = $(event.target);
		$timeout(function(){
			if (eventTarget.attr('id') != 'actionDiv' || !($('#actionDiv').find(eventTarget).length)){
				$scope.Actions.isActionBtnClicked = false;	
				$('#actionDiv').css('display','none');
			}
		},500);
		event.stopPropagation();
	}
	
	$scope.hideActionMenuonBlur= function(event){
		var isIE11 = $scope.isIE11();
		var eventTarget = $(event.target);
		if (isIE11 && eventTarget.attr('id') != 'actionDiv' && eventTarget.attr('id') != 'actionIcon'){
			$scope.Actions.isActionBtnClicked = false;	
			$('#actionDiv').css('display','none');
		}
		if (isIE11 && eventTarget.attr('id') != 'emailSettingDiv' && eventTarget.attr('id') != 'emailSettingIcon'){
			$scope.emailSettings.clicked = false;	
		}
		
	}

	$scope.expandSideBarForEmail = function(){
		if(showSidebarOnly == true && $window.parent != null && $window.parent != undefined)
			$window.parent.expandSideBar();
		else
			$('.quick-details-panel').css('width','75%');				
	}
	$scope.collapseSideBarForEmail = function(){
		if(showSidebarOnly == true && $window.parent != null && $window.parent != undefined)
			$window.parent.collapseSideBar();
		else{				 
			$('.quick-details-panel').css('width','37%');					 
		}
								
	}
	$scope.hideEmailPanel = function(){
		var mainPanel = document.getElementById('quickDetailsPanel');
		if(mainPanel && mainPanel.scrollTop != undefined)
			mainPanel.scrollTop = 0;
		$scope.showSendEmail=false;
		$scope.collapseSideBarForEmail();
		$scope.cleanEmailData();
		$scope.hideMask();
	}
	$scope.hideAttachmentPanel = function(){
		$("input[name='file']").replaceWith($("input[name='file']").clone(true));
		$scope.newAttachment = [];			
		$scope.hideMask();
	}		
	$scope.hideMask =function (){
		if($scope.showSendEmail == false && $scope.showAddNote == false && $scope.newAttachment.length == 0 && $scope.$parent.enableQuickEdit == false){
			$('.menu-option').removeClass('disable-click');
			$('#maskHeader').css('display','none');
			$scope.$parent.childScope = $scope;
			if(showSidebarOnly == true && $window.parent != null && $window.parent != undefined){
				$window.parent.hideMask();		
				$window.parent.isSidebarActionClicked = false;
			}
		}
	}  
    $scope.showMask =function (){
		$('.menu-option').addClass('disable-click');	
		$('#maskHeader').css('display','block');	
		$scope.$parent.childScope = $scope;
		if(showSidebarOnly == true && $window.parent != null && $window.parent != undefined){
			$window.parent.showMask();	
			$window.parent.isSidebarActionClicked = true;
		}
	}  
	$scope.$on('loadDataForUpdatedNode', function(e) {  
		$scope.parentNodeData = rootNodeDataFactory.getRootNodeData();
		$scope.recordState = $scope.parentNodeData[namespacePrefix+'state__c'] ||  $scope.parentNodeData[namespacePrefix+'State__c'];
		$scope.moduleName = selectedNodeAPI;
		$scope.moduleName = $scope.moduleName.replace(namespacePrefix,'');
		if(typeof $scope.moduleName != 'undefined' && $scope.moduleName.toLowerCase() == 'release__c'){
			$scope.isSendEmailAvailable =false;
		}
		var scope = angular.element($("#quickDetailsPanel")).scope();		
		$scope.newObjectMetaDataMapSB =	scope.newObjectMetaDataMap;
		var initLoadWritable = pageLoadData["isUpdateable"];		
		var isWritableSelected;
		if(!$scope.newObjectMetaDataMapSB) {isWritableSelected = false;}
		isWritableSelected = $scope.newObjectMetaDataMapSB.get(selectedNodeID);  
		
		if(isWritableSelected === 'undefined' ||  isWritableSelected === undefined){		
			$scope.showActionButtons = initLoadWritable && ($scope.recordState == true || $scope.recordState == 'true');			
			$scope.isObjectEditable = initLoadWritable;
		}else{
			$scope.showActionButtons = isWritableSelected && ($scope.recordState == true || $scope.recordState == 'true');
			$scope.isObjectEditable = isWritableSelected;
		}
		$scope.enableSidebarActions = true;
		if($scope.showSidebarOnly != true){
			$scope.getActions();
			$scope.getActivities();
			$scope.getAttachments();
		}
	});
	$scope.showHideActivitySection= function(){
		$scope.activityClicked = !$scope.activityClicked;
	} ;
	$scope.toggleEmailDetailsSection= function(){
		$scope.emailDetailsClicked = !$scope.emailDetailsClicked;
		$scope.editor.setEditorSize();
	} ;	
	$scope.toggleEmailContentsSection= function(){
		$scope.emailContentClicked = !$scope.emailContentClicked;
		$scope.editor.setEditorSize();
	} ;
	$scope.showHideAttachmentSection= function(){
			$scope.attachmentClicked = !$scope.attachmentClicked;
	} ;
	$scope.validateDuration =function (){	
		var durationVal = $scope.quickNote.durationString ;
		if(durationVal != undefined && durationVal != ''){
			var split = durationVal.split(':');
			if(split[0].length == 1){
				durationVal = '0' + durationVal;					
			}			
			var timePat = /^([0-9]{2}):([0-9]{2})$/;
			var matchArray = durationVal.match(timePat);
			if (matchArray == null) {
				rfModal.openInfoMessage($scope,"error", _Labels.quickDetails.durationErrorLabel);
					$scope.quickNote.durationString = '00:00';
			}                  
		}else
			$scope.quickNote.durationString = '00:00';
	};
		
		$scope.previewTemplate = function(){
			var previewLeft = (screen.width/2)-(400);
			var previewTop = (screen.height/2)-(250);
			var previewPopup ='';
			if(window.showModalDiaslog){
				var windowFeatures = "dialogWidth:" + 800 + "px;" + "dialogHeight:" + 500 + "px;" + "status;resizable;scrollbars:yes;center:yes;dialogLeft:" + previewLeft + "px;" + ";dialogTop:" + previewTop + "px;";
				previewPopup = window.showModalDialog( '/'+$scope.selectedTemplate.value+'?related_to_id='+selectedNodeID+'&isdtp=vw#ep', this, windowFeatures);
			}else{
				previewPopup = window.open( '/'+$scope.selectedTemplate.value+'?related_to_id='+selectedNodeID+'&isdtp=vw#ep','Preview','scrollbars=yes,toolbar=0,status=0,width=800,height=500, top='+previewTop+', left='+previewLeft);
				
				if (previewPopup.focus) {previewPopup.focus() ;}
			}
		}
	$scope.setSelectedIndex = function(index){
		if($scope.selectedIndex != index){
			$scope.setSelectedSearchResult($scope.selectedIndex,false);
		    $scope.selectedIndex = index;
			$scope.setSelectedSearchResult($scope.selectedIndex,true);
		}		
	};
	$scope.setSelectedSearchResult = function(index,value){
		if(index < $scope.userResults.length){
			$scope.userResults[index].isSelected = value;
		}else if(index < ($scope.userResults.length + $scope.contactResults.length)){
			$scope.contactResults[(index - $scope.userResults.length)].isSelected = value;
		}		
	};
	$scope.scrollAutoSuggestions = function(index,isUp){
		var elmnt = document.getElementById("autoSuggestContainer");
		if(elmnt && elmnt.scrollTop != undefined){ 
			var autoCompleteheight = elmnt.scrollHeight;
			if(!isUp &&  ($scope.userResults.length + $scope.contactResults.length) > 5 && $scope.selectedIndex > 4 && autoCompleteheight && elmnt.scrollTop < (autoCompleteheight -34)){
				elmnt.scrollTop = elmnt.scrollTop + 34;
			}
			if(isUp &&  ($scope.userResults.length + $scope.contactResults.length) > 5 ){
				if(elmnt.scrollTop > 34){
					elmnt.scrollTop = elmnt.scrollTop - 34;
				}else{
					elmnt.scrollTop = 0;
				}	
			}
		}		
	};
	$scope.addSelectedMail = function(){
		if($scope.userResults && $scope.selectedIndex < $scope.userResults.length){
			$scope.populateEmailInput($scope.userResults[$scope.selectedIndex].Email);
		}else if($scope.contactResults && $scope.selectedIndex < ($scope.userResults.length + $scope.contactResults.length)){
			$scope.populateEmailInput($scope.contactResults[($scope.selectedIndex-$scope.userResults.length)].Email);
		}	
	};
	$scope.navigateKeypress=function(event){
		if(event.which === 13) {
			//If select key is pressed
			$scope.addSelectedMail();
		}else{
			if(event.which === 40){
				// If down up key is pressed
				if($scope.selectedIndex  < ($scope.userResults.length + $scope.contactResults.length - 1)){
					$scope.setSelectedSearchResult($scope.selectedIndex,false);
					$scope.selectedIndex = $scope.selectedIndex + 1;
					$scope.setSelectedSearchResult($scope.selectedIndex,true);
					$scope.scrollAutoSuggestions($scope.selectedIndex,false);
				}	
			}else if(event.which === 38){	
				// If down arrow key is pressed
				if($scope.selectedIndex > 0){ 						
					$scope.setSelectedSearchResult($scope.selectedIndex,false);
					$scope.selectedIndex = $scope.selectedIndex - 1;
					$scope.setSelectedSearchResult($scope.selectedIndex,true);
					$scope.scrollAutoSuggestions($scope.selectedIndex,true);
				}	
			}
		}
	};	
	
	$scope.changeSelectedTemplate = function(){
		if($scope.selectedTemplate && $scope.selectedTemplate.value != 'none'){
			$scope.editor.mode = 'plaintext';
			if($scope.email.emailBody != ''){
				$scope.tempEmailBody = $scope.email.emailBody;
			}
			$scope.email.emailBody = '';
		}
		
		if($scope.selectedTemplate.value == 'none'){
			if($scope.boolAllowRichTextArea && ('true' == $scope.getTextFormatEmailCovo() || true == $scope.getTextFormatEmailCovo())){
				$scope.editor.mode = 'richtext';
			} else {
				$scope.editor.mode = 'plaintext';
			}			
			$scope.email.emailBody = $scope.tempEmailBody;
		}
	}
	
	$scope.editorModeHandler = function(val){
		$scope.editor.mode = val;
		if($scope.editor.mode == 'plaintext'){
			var rtfFrame = document.getElementById('rtfFrame');
			var richBodycomp = $scope.getRichComponent(rtfFrame);
			if(richBodycomp && richBodycomp.innerText && richBodycomp.innerText != '\n'){
				confirmationDialogService.showDialog({
					title: _Labels.serviceTargetStatus.Warning,
					titleI18nKey: _Labels.serviceTargetStatus.Warning,
					text: _Labels.message.textFormatSwitchWarningMsg,
					callBackFn: $scope.editor.switchToPlainText
				});
				$scope.editor.mode = 'richtext';
			} else {
				$scope.editor.switchToPlainText();
			}
		} else if($scope.editor.mode == 'richtext' && $scope.boolAllowRichTextArea){
			$scope.editor.switchToRichText();
			$scope.editor.setEditorSize();
		} else {
			$scope.editor.mode = 'plaintext';
			$scope.setTextFormatEmailCovo(false);
			rfModal.openInfoMessage($scope, "error", _Labels.message.AccessibilityModeErrorMsg);
		}
	}
	
	$scope.emailFileSelected = function(){		
		if($scope.checkAPIpermissions('newEmailAttFiles') != false){
			$scope.$apply(function(){
				$scope.showAttachFile = true;
				$scope.newEmailAttachment = $('#newEmailAttFiles')[0].files;
				$scope.$parent.recordDetailsClicked = false;
				$scope.showSendEmail = true;
				$scope.activityClicked = true;
				if($scope.email.saveAttachmentsFlag == undefined 
					|| $scope.email.saveAttachmentsFlag == ''){
						$scope.email.saveAttachmentsFlag = false;
					}
			});	
			$scope.createEmailAttachmentReference();
			$scope.showMask();		
		}
	};
	
	/*Email Attachment Changes */
	$scope.sendEmailAttachmentMap = [];
	$scope.EmailAttachmentGeneratorReference = '';
	$scope.createEmailAttachmentReference = function(){		
		if($scope.EmailAttachmentGeneratorReference != ''){			
			$scope.uploadEmailAttachment($scope.EmailAttachmentGeneratorReference);
		}else{
			Visualforce.remoting.Manager.invokeAction(				
				_RemotingActions.performAttachmentActions,'INSERT', {},
				function(result, event){
					if (event.status){	
						$scope.EmailAttachmentGeneratorReference = result;
						$scope.showSendEmail = true;
						$scope.activityClicked = true;		
						$scope.uploadEmailAttachment($scope.EmailAttachmentGeneratorReference);
					}else
						rfModal.openInfoMessage($scope,"error",result);						   
						$scope.hideMask();                              
				}, 
				{escape: false}
			);			
		}
	};	
	
	$scope.uploadEmailAttachment = function(emailAttachmentParentId){
		var reader = new FileReader();
		var attachFile = '';
		attachFile = $('#newEmailAttFiles')[0].files[0];
		validation = $scope.validateAttachment(attachFile);
			
		if(validation != false){
			$scope.inProgress = true;
			sidebarModel.displayLoader();
			
			client.createBlob('Attachment', {
				IsPrivate	: false,
	            Name		: attachFile.name,
	        	ContentType : attachFile.type,
				Description : attachFile.name,
				ParentId 	: emailAttachmentParentId
			}, attachFile.name, 'body', attachFile, function(response){
				var singleAttachment = {};
				singleAttachment.Id = response.id;
				singleAttachment.Name = attachFile.name;
				singleAttachment.Size = attachFile.size;
				$scope.sendEmailAttachmentMap.push(singleAttachment);
				
				var control = $('#newEmailAttFiles');
				control = control.val('').clone(true);							
				
				$scope.$apply();
				$scope.refreshConsoleRelated();
				$scope.hideMask();	
				sidebarModel.hideLoader();
			}, function(request, status, response){
				rfModal.openInfoMessage($scope,"error",status);
				sidebarModel.hideLoader();
			});
		}
	};
	$scope.displayErrorMessage = function(error){
		var errorMessage;
		if(error.faultstring != undefined){
			errorMessage = error.faultstring;
		}else{
			if(error[0].errors && error[0].errors.statusCode.indexOf('INSUFFICIENT_ACCESS_ON_CROSS_REFERENCE_ENTITY') > -1){
				errorMessage = _Labels.message.StdInsufficentOperationPrivilege ;
			}else{
				errorMessage = _Labels.message.AttachmentCreateFailed +' : '+error[0].errors.message;
			}	
		}
		rfModal.openInfoMessage($scope,"error", errorMessage);
	};
	$scope.removeAttachmentchip = function(singleAttachment){
		var attachmentIndex = $scope.sendEmailAttachmentMap.indexOf(singleAttachment);
        if (attachmentIndex !== -1) {
            $scope.sendEmailAttachmentMap.splice(attachmentIndex, 1);
        }
	};
	
	$scope.refreshEmailPanel = function(){
		$("input[name='emailFile']").replaceWith($("input[name='emailFile']").clone(true));
		$scope.newEmailAttachment = [];		
	};
	
	$scope.setAttachmentsFlag = function(){
		var tenYrs = new Date();
		tenYrs.setYear(tenYrs.getFullYear() + 10);
		setRFCookies("saveAttachmentsFlag", $scope.email.saveAttachmentsFlag, { expires : tenYrs });
	};
	$scope.getLabelForSelectOption = function(labelVal){
		if(labelVal.match($scope.mutibytePattern)) {
			if(labelVal.length > 40) {
				return labelVal.substring(0, 40)+'...';
			}else{
				return labelVal;
			} 
		}else{
			if(labelVal.length > 80) {
				return labelVal.substring(0, 80)+'...';
			}else{
				return labelVal;
			} 
		}
	};
	
	window.callResizeHandler=function(){
		$scope.editor.setEditorSize();
	}
	
	$scope.editor = {
		"mode":"",
		enableEditor : function(isEnabled){
			var rtfFrame = document.getElementById('rtfFrame');
			var formEl_Id;
			var formEl;
			var maskEl;
			
			if(rtfFrame){
				formEl_Id = rtfFrame.contentWindow.formId;
				formEl = rtfFrame.contentDocument.getElementById(formEl_Id);
				maskEl = rtfFrame.contentDocument.getElementById('mask');
			
				if(formEl){
					if(!isEnabled){
						formEl.style.visibility = 'hidden';
						maskEl.style.backgroundColor = '#EBEBE4';
						maskEl.style.border = '1px solid #c1c1c1';
						maskEl.style.borderRadius = '2px';
					}
					else{
						formEl.style.visibility = 'visible';
						maskEl.removeAttribute('style');
					}
				}
			}
		},
		clearEditor: function(){
			var rtfFrame = document.getElementById('rtfFrame');
			var richBodycomp = $scope.getRichComponent(rtfFrame);
			if(richBodycomp != null && typeof(richBodycomp) != 'undefined'){	
				richBodycomp = RemedyForceHTMLProcessor.clearHTML(richBodycomp);
				
				var rtfField = rtfFrame.contentDocument.getElementById(rtfFrame.contentWindow.rtfId + ':textAreaDelegate_'+ $scope.namespacePrefix + 'RichTextNote__c');
				if(typeof(rtfField) == 'undefined' || rtfField == null){ //try without namespace (dev org)
					rtfField = rtfFrame.contentDocument.getElementById(rtfFrame.contentWindow.rtfId + ':textAreaDelegate_' + 'RichTextNote__c');
				}
				if(rtfField){
					var CKinstance = rtfFrame.contentWindow.CKEDITOR.instances[rtfField.id];
					if(CKinstance){
						CKinstance.resetUndo();
						CKinstance.commands.bold.setState(2);
						CKinstance.commands.italic.setState(2);
						CKinstance.commands.underline.setState(2);
						CKinstance.commands.strike.setState(2);
						
						CKinstance.commands.justifyleft.setState(2);
						CKinstance.commands.justifycenter.setState(2);
						CKinstance.commands.justifyright.setState(2);
						
						CKinstance.commands.bulletedlist.setState(2);
						CKinstance.commands.numberedlist.setState(2);
						CKinstance.commands.indent.setState(2);
						CKinstance.commands.outdent.setState(2);
						
						var openDialog = rtfFrame.contentWindow.CKEDITOR.dialog.getCurrent();
						if(openDialog){
							openDialog.hide();
						}
					}
				}	
			}
		},
		fetchEmailContent: function(callBackFn){
			sidebarModel.displayLoader();
			var rtfFrame = document.getElementById('rtfFrame');
			
			if(rtfFrame){
				var richBodycomp = $scope.getRichComponent(rtfFrame);
				
				//Show error "Number of characters exceeded.", since we get Salesforce error "Value cannot exceed 1,31,072 characters."
				if(richBodycomp && typeof(richBodycomp.innerHTML) != 'undefined' && richBodycomp.innerHTML.length > 120000){	
					rfModal.openInfoMessage($scope,"error",_Labels.message.TextAreaOverflow);
					sidebarModel.hideLoader();
					return null;
				}
				rtfFrame.contentWindow.fetchEmailBodyFn(callBackFn);
			}
		},
		switchToPlainText: function(){
			$scope.editor.mode = 'plaintext';
			var rtfFrame = document.getElementById('rtfFrame');
			var richBodycomp = $scope.getRichComponent(rtfFrame);
			if(richBodycomp != null && typeof(richBodycomp) != 'undefined'){
				if($scope.isReplyEmail) {
					$scope.editor.addRemoveReplySeparator();
				}
				$scope.email.emailBody = $scope.editor.retainBreakLine($scope.stripHtml(richBodycomp.innerHTML),true);	
			}
			if(!$scope.isReplyEmail) {
				$scope.setTextFormatEmailCovo(false);
			}
			
		},
		switchToRichText:function(){
			var rtfFrame = document.getElementById('rtfFrame');
			var richBodycomp = $scope.getRichComponent(rtfFrame);
			if(richBodycomp != null && typeof(richBodycomp) != 'undefined'){	
				$scope.email.emailBody = RemedyForceHTMLProcessor.htmlEscapeForRtfEditor($scope.email.emailBody);
				
				if($scope.isReplyEmail) {
					$scope.editor.addRemoveReplySeparator();
				}
				richBodycomp = RemedyForceHTMLProcessor.clearHTML(richBodycomp);
				var node = $scope.editor.retainBreakLine($scope.email.emailBody, false);
				RemedyForceHTMLProcessor.copyHTML(node, richBodycomp);
			}
			if(!$scope.isReplyEmail) {
				$scope.setTextFormatEmailCovo(true);
			}

			return '';
		},
		addRemoveReplySeparator : function() {
			if($scope.editor.mode === 'richtext') {
				if($scope.email.emailBody.indexOf($scope.replyPlainEmailSeparator) >= 0) {
					$scope.email.emailBody = $scope.email.emailBody.replace($scope.replyPlainEmailSeparator + '\n', $scope.replyRTFEmailSeparator);
					$scope.email.emailBody = $scope.email.emailBody.replace($scope.replyPlainEmailSeparator + '\r\n', $scope.replyRTFEmailSeparator);
				}
			} else {
				var rtfFrame = document.getElementById('rtfFrame');
				var richBodycomp = $scope.getRichComponent(rtfFrame);
				if(richBodycomp && richBodycomp.innerHTML.indexOf($scope.replyRTFEmailSeparator) >= 0) {
					richBodycomp.innerHTML = richBodycomp.innerHTML.replace($scope.replyRTFEmailSeparator, $scope.replyPlainEmailSeparator + '<br>');
				}
			}
		},
		retainBreakLine: function(Content,htmlToPlainText){
			if(htmlToPlainText){
				if(Content){
					Content = Content.replace(/ /g, " "); //replace non-breaking space (&nbsp) with ordinary space.
				}
				return Content;		
			}
			else
			{
				var div = document.createElement('div');
				Content = Content.replace(/\r?\n|\r/g,'<br>');
			    RemedyForceHTMLProcessor.parseHTML(div, Content);
				return div;
			}		
		},
		setEditorSize: function(){
			if($scope.emailDetailsClicked){
				$scope.rtfHeight = 270;
			}
			else{
				$scope.rtfHeight = 445;
			}
			$scope.editor.waitForRTFEditorToLoadCount = 0;
			$scope.editor.waitForRTFEditorToLoad($scope.editor.resizeEditor);
		},
		resizeEditor: function(){
			var rtfFrame = document.getElementById('rtfFrame');
			if(rtfFrame){
				var rtfEl = rtfFrame.contentDocument.getElementById('cke_1_contents');
				if(rtfEl){
					rtfEl.style.height = $scope.rtfHeight + 'px';
				}
			}
		},
		waitForRTFEditorToLoadCount:0,
		waitForRTFEditorToLoad: function(callBackFn){
			if($scope.editor.mode == 'richtext') {
				$scope.editor.waitForRTFEditorToLoadCount++;
				var rtfFrame = document.getElementById('rtfFrame');
				if(rtfFrame){
					var rtfEl = rtfFrame.contentDocument.getElementById('cke_1_contents');
					if(rtfEl){
						callBackFn();
					} else{
						if($scope.editor.waitForRTFEditorToLoadCount < 50){ //re-try for 10 seconds max
							setTimeout(function(){ $scope.editor.waitForRTFEditorToLoad(callBackFn) }, 200);
						}
					}
				}
			} else {
				callBackFn();
			}
		}
	};
	if($scope.boolAllowRichTextArea && ('true' == $scope.getTextFormatEmailCovo() || true == $scope.getTextFormatEmailCovo())){
		$scope.editor.mode = 'richtext';
	} else {
		$scope.editor.mode = 'plaintext';
	}
	
	$scope.getRichComponent = function(rtfFrame) {
		var richBodyComp;
		if(!$scope.boolAllowRichTextArea) return richBodyComp;
		if(typeof($scope.richBodyComponent) == 'undefined' || $scope.richBodyComponent == null){
			richBodyComp = getRichComponent(rtfFrame);
			if(typeof(richBodyComp) != 'undefined' && richBodyComp != null) {
				$scope.richBodyComponent = richBodyComp;
			}
		} else {
			richBodyComp = $scope.richBodyComponent;
		}
		return richBodyComp;
	};
	
	$scope.truncateLongStringToSendInEmail = function(strEmailBody){
		if(typeof(strEmailBody) != 'undefined' && strEmailBody != null && strEmailBody != '' && strEmailBody.length > 120000){
			strEmailBody = strEmailBody.substring(0,120000);
		}
		return strEmailBody;
	};
	
	/** Method is used for reply an email conversation
	 * @param activity On which record user is going to reply
	 * @param isReplyAllClicked true if user clicks on reply all otherwise reply
	 */
    $scope.replyEmail = function(activity, isReplyAllClicked) {
    	$scope.isReplyEmail = true;
    	$scope.email.removeOriginalContent = false;
    	document.getElementById('quickDetailsPanel').scrollTop = 0;
    	var subjectLine = activity['description'];
		var actionType = activity['name'];
		if(actionType){	
			actionType = actionType + '-';
			if(subjectLine.indexOf(actionType) == 0){
				subjectLine = subjectLine.replace(actionType, '');
			}
		}
    	if(!subjectLine){
    		subjectLine = 'Re: ' + $scope.getEmailSubjectLine() + ' ' +$scope.getRefUID();
    	}
    	else{
	    	var iPos = subjectLine.toLowerCase().indexOf('re:'); //case less indexOf
	        if(iPos == -1 || iPos > 3)
	        	subjectLine = 'Re: ' + subjectLine;
	        else 
	        	subjectLine = subjectLine.replace('RE:','Re:'); //replacing RE: (if exists) with Re: to keep consistency  
        }
    	$scope.email.emailSubject = subjectLine;
    	$scope.email.CCEmails = '';
    	if(isReplyAllClicked){
    		if(activity.toAddress != undefined &&  activity.toAddress !='') {
				$scope.email.toEmails = $scope.addEmailAddressSeparator(activity.toAddress);
			}
			if(activity.ccAddress != undefined &&  activity.ccAddress !='') {
				$scope.email.CCEmails = $scope.addEmailAddressSeparator(activity.ccAddress);
			}
		} else {
			$scope.email.toEmails = $scope.addEmailAddressSeparator(RemedyForceHTMLProcessor.htmlDecoder(activity.fromAddress));
		}
    	$scope.showEmailPanel();
		var fromEmailsArr=$scope.fromEmails;
		var toAddressEmail=$scope.email.toEmails;
		var ccAddressEmail=$scope.email.CCEmails;
		if(activity.removeOWEmailFromTOCCAddress && fromEmailsArr && fromEmailsArr.length>0){
			for(var i=0; i < fromEmailsArr.length; i++){
				if(fromEmailsArr[i].OrgWideEmailAddress.lastIndexOf("< ")!=-1 &&
						fromEmailsArr[i].OrgWideEmailAddress.lastIndexOf(" >")!=-1){
					var OWEmail = fromEmailsArr[i].OrgWideEmailAddress.substring(fromEmailsArr[i].OrgWideEmailAddress.lastIndexOf("< ") + 2,fromEmailsArr[i].OrgWideEmailAddress.lastIndexOf(" >"))+';';
					OWEmail = OWEmail.toLowerCase();
					toAddressEmail = $scope.removeOWEmail(toAddressEmail.toLowerCase(),OWEmail);
					ccAddressEmail = $scope.removeOWEmail(ccAddressEmail.toLowerCase(),OWEmail);
				}
			}
		}
		$scope.email.toEmails=toAddressEmail;
		$scope.email.CCEmails=ccAddressEmail;
    	$scope.replyActivityId = activity.Id;
    	$scope.isReplyRichTextContentActivity = activity.isRichTextContent;
		$scope.editor.waitForRTFEditorToLoadCount = 0;
    	$scope.editor.waitForRTFEditorToLoad($scope.loadReplyEmailBody);
    }
	
    $scope.removeOWEmail = function(emailAddress, OWEmail){
		var emailStr = emailAddress.split(';');
		var returnEmailStr = '';
		for(var i=0; i < emailStr.length; i++){
			var emailtoCompare = emailStr[i].trim();
			if(emailtoCompare){
				emailtoCompare += ';'
				if(emailtoCompare != OWEmail)
					returnEmailStr += emailtoCompare;
			}
		}
		return returnEmailStr;
	}
	
    $scope.loadReplyEmailBody = function() {
    	sidebarModel.displayLoader();
    	sidebarModel.getReplyEmailBody($scope.moduleName, $scope.replyActivityId).then(function(result){
	    	$scope.editor.mode = $scope.boolAllowRichTextArea ? 'richtext' : 'plaintext';
			$scope.email.prevContentHolder = RemedyForceHTMLProcessor.htmlDecoder(result);
			if(!$scope.isReplyRichTextContentActivity && $scope.email.prevContentHolder) {
				$scope.email.prevContentHolder = $scope.email.prevContentHolder.replace(/\r?\n|\r/g,'<br>');
    		}
			if($scope.editor.mode == 'richtext') {
	    		$scope.email.prevContentHolder = $scope.replyRTFEmailSeparator + $scope.email.prevContentHolder;
	        	$scope.email.emailBody = "<br><br>" + $scope.email.prevContentHolder;
	        	$scope.refreshRTFEditorWithNewContent();
	    	} else {
	    		$scope.email.prevContentHolder = $scope.replyPlainEmailSeparator + '\n' + $scope.email.prevContentHolder;
	        	$scope.email.emailBody = "\n\n" + $scope.email.prevContentHolder;
	    	}
	    	$scope.loadEmailSettings();
	    	sidebarModel.hideLoader();    		
    	});
    }
    
    $scope.refreshRTFEditorWithNewContent = function() {
    	var rtfFrame = document.getElementById('rtfFrame');
		var richBodycomp = $scope.getRichComponent(rtfFrame);
		if(richBodycomp){	
			$scope.editor.addRemoveReplySeparator();
			richBodycomp = RemedyForceHTMLProcessor.clearHTML(richBodycomp);
			var node = document.createElement('div');
			RemedyForceHTMLProcessor.parseHTML(node, $scope.email.emailBody);
			RemedyForceHTMLProcessor.copyHTML(node, richBodycomp);
		}
    }
    
    $scope.removeOriginalContent = function () {
    	var rtfFrame = document.getElementById('rtfFrame');
		var richBodycomp = $scope.getRichComponent(rtfFrame);
		if($scope.email.removeOriginalContent) {
			
    		if($scope.editor.mode == 'plaintext') {
    			$scope.email.emailBody = $scope.email.emailBody.substr(0, $scope.email.emailBody.indexOf($scope.replyPlainEmailSeparator));
    		} else {
    			if(richBodycomp) {
    				$scope.email.emailBody = richBodycomp.innerHTML;
    				$scope.email.emailBody = $scope.email.emailBody.substr(0, $scope.email.emailBody.indexOf($scope.replyRTFEmailSeparator)) + '</div>';
    			}
    		}
    	}
		if(richBodycomp && $scope.editor.mode == 'plaintext') {
			$scope.email.emailBody = $scope.email.emailBody.replace(/\r?\n|\r/g,'<br>');
		}
		if(!$scope.email.removeOriginalContent){
    		if(richBodycomp && $scope.editor.mode == 'plaintext' && ($scope.isEdge() || $scope.isIE11())) {
    			$scope.email.emailBody = $scope.email.emailBody + '<br>';
    		}
    		$scope.email.emailBody = $scope.email.emailBody + $scope.email.prevContentHolder;
    	}
		$scope.refreshRTFEditorWithNewContent();
		if(richBodycomp && $scope.editor.mode == 'plaintext') {
			$scope.editor.addRemoveReplySeparator();
			$scope.email.emailBody = $scope.stripHtml(richBodycomp.innerHTML);
    	}
    }
    $scope.addEmailAddressSeparator = function(emailAddress) {
    	return (emailAddress.trim().substr(emailAddress.trim().length - 1)) !== ';' ? (emailAddress + ';') : emailAddress;
    }
	
	$scope.configureSignatureClick = function() {
		if($scope.emailSignature.isUpdateable && $scope.emailSignature.isAccessRTFEditorPage) {
			sidebarModel.openConfigureSignatureModal($scope.updateSignature, ($scope.emailSignature.custom ? $scope.emailSignature.custom: $scope.emailSignature.standard), $scope.stripHtml);
		} else {
			rfModal.openInfoMessage($scope, "error", _Labels.message.StdInsufficentOperationPrivilege);
		}
	}
	
	$scope.getEmailSignaturePosition = function() {
		var signature  = $scope.emailSignature.custom;
		var replySeprator = $scope.replyRTFEmailSeparator;
		if($scope.editor.mode == 'plaintext') {
			signature = $scope.stripHtml(signature);
			replySeprator = $scope.replyPlainEmailSeparator;
		} else {
			// In case of rich text we need to fetch the body content then check for if signature exist or not
			var rtfFrame = document.getElementById('rtfFrame');
       	 	var richBodycomp = getRichComponent(rtfFrame);
       	 	if(richBodycomp) {
       	 		$scope.email.emailBody = richBodycomp.innerHTML;
       	 	} 
		}
		var replySepratorIndex = $scope.email.emailBody.length;
		if($scope.email.emailBody.indexOf(replySeprator) >= 0) {
			replySepratorIndex = $scope.email.emailBody.indexOf(replySeprator);
		}
		return $scope.email.emailBody.substr(0, replySepratorIndex).indexOf(signature);
	}
	
	$scope.removeEmailSignatureInBody = function() {
		var signatureEmailIndex = 0;
		var signature = $scope.emailSignature.custom;
		var richBodycomp;
		if($scope.editor.mode == 'plaintext') {
			signature = $scope.stripHtml($scope.emailSignature.custom);
			signatureEmailIndex = $scope.email.emailBody.indexOf(signature);
		} else {
			var rtfFrame = document.getElementById('rtfFrame');
       	 	var richBodycomp = getRichComponent(rtfFrame);
       	 	if(richBodycomp) {
       	 		$scope.email.emailBody = richBodycomp.innerHTML;
       	 	}
       	 	signatureEmailIndex = $scope.email.emailBody.indexOf($scope.emailSignature.custom);
		}
		$scope.email.emailBody = [$scope.email.emailBody.slice(0, signatureEmailIndex), $scope.email.emailBody.slice(signatureEmailIndex + signature.length, $scope.email.emailBody.length)].join('');
		$scope.refreshRTFEditorWithNewContent();
	}
	
	$scope.updateSignature = function(updatedSignature) {
		// Updated email signature should be updated in email body when if email signature exist and
		// (Insert Signature check box is checked or old signature is not blank )
		if(($scope.insertEmailSignatureCB || $scope.emailSignature.custom) && $scope.getEmailSignaturePosition() != -1) {
			// Need to remove the existing signature.
			$scope.removeEmailSignatureInBody();
			$scope.emailSignature.custom = updatedSignature;
			$scope.insertEmailSignatureInBody();
		} else {
			$scope.emailSignature.custom = updatedSignature;
		}
		$scope.refreshConsoleRelated();
	}
    $scope.loadEmailSettings = function(){
		sidebarModel.displayLoader();
		$scope.hasNewSubjectLoaded = false;
		if(!($scope.isReplyEmail && $scope.hasNewSubjectLoaded)){
			if(!$scope.isReplyEmail){
				let defaultSubject = '';
				let emailModule = '';
				if($scope.parentNodeData[namespacePrefix+'isServiceRequest__c'] != undefined && $scope.parentNodeData[namespacePrefix+'isServiceRequest__c']==true){
					emailModule = 'SR';
					defaultSubject =  $scope.ObjectLabels["singular"]["Service_Request__c"] + ' #' + $scope.parentNodeData.Name;	 	
				}else{	
					defaultSubject =  $scope.ObjectLabels["singular"][selectedNodeAPI.replace(namespacePrefix, '')] + ' #' + $scope.parentNodeData.Name;	
					emailModule = $scope.moduleName; 	
				}
				
				sidebarModel.getSubjectLine
				(emailModule,defaultSubject).then(function(result){  
					$scope.email.emailSubject = RemedyForceHTMLProcessor.htmlDecoder(result);
					$scope.hasNewSubjectLoaded = true;
					sidebarModel.hideLoader();
				});
			}
		}
    	// Load Email settings only once.
		if(!$scope.hasEmailSettingLoaded) {
			sidebarModel.displayLoader();
	    	sidebarModel.getEmailSettings($scope.moduleName).then(function(result){
	    		
	    		var customEmailSignature = RemedyForceHTMLProcessor.htmlDecoder(result['customEmailSignature']);
	    		if(customEmailSignature) {
		    		var div= document.createElement('div');
		    		div.innerHTML = customEmailSignature;
		    		customEmailSignature = div.innerHTML;
	    		}
	    		$scope.emailSignature = {
	    			'enabled' : result['enableEmailSignature'],
	    			'standard' : RemedyForceHTMLProcessor.htmlDecoder(result['standardEmailSignature']),
	    			'custom' : customEmailSignature,
	    			'isAccessRTFEditorPage' : result['isAccessRTFEditorPage'],
	    			'isUpdateable' : result['isUpdateable'],
	    			'isAccessible' : result['isAccessible']
	    		}
				
				$scope.ClientURL 			= RemedyForceHTMLProcessor.htmlDecoder(result['clientURL']);
				$scope.StaffURL 			= RemedyForceHTMLProcessor.htmlDecoder(result['staffURL']);
				$scope.StaffLightningURL 	= RemedyForceHTMLProcessor.htmlDecoder(result['staffLightningURL']);
				// Initialize email related settings
				$scope.isFromDisabled		= result['isFromDisabled'];
				$scope.isBccFieldEnabled	= result['isBccFieldEnabled'];
				$scope.isToFieldEditable	= result['isToFieldEditable'];
				$scope.isEmailBodyEnabled 	= result['isEmailBodyEnabled'];
				$scope.isEmailTemplatePreviewEnabled = result['isEmailTemplatePreviewEnabled'];
				$scope.isEmailTemplateEnabled = result['isEmailTemplateEnabled'];
		        $scope.fromEmails 			= result['fromEmails'];
				$scope.isContactsEnabled 	= result['isContactsEnabled'];
				if($scope.fromEmails != undefined && $scope.fromEmails.length > 0) {
					angular.forEach($scope.fromEmails, function(value, key) {
						value.OrgWideEmailAddress = RemedyForceHTMLProcessor.htmlDecoder(value.OrgWideEmailAddress);
						if(value.isDefault == 'true') {
							$scope.defaultFromEmail = value;
							$scope.email.fromEmail = value.OrgWideEmailId;
						}
					});
					if($scope.defaultFromEmail.length == undefined) {
						$scope.defaultFromEmail = $scope.fromEmails[0];
						$scope.email.fromEmail = $scope.fromEmails[0].OrgWideEmailId; 
					}
				}
				
				if(result['emailTemplates'] && $scope.isEmailTemplateEnabled) {
					$scope.emailTemplates = result['emailTemplates'];
					angular.forEach($scope.emailTemplates, function(value, key) {
						value.label = RemedyForceHTMLProcessor.htmlDecoder(value.label);
					});
				}else{
					$scope.emailTemplates = null;
				}
				// Initialize email template
				// $scope.emailTemplates =	($scope.isEmailTemplateEnabled) && result['emailTemplates'] ? result['emailTemplates'] : null;
				
				$scope.editor.waitForRTFEditorToLoadCount = 0;
				
				$scope.hasEmailSettingLoaded = true;
				// Load record links and email signature if user clicked on New Email or Reply/Reply All icon.
				if($scope.showSendEmail) {
					$scope.editor.waitForRTFEditorToLoad($scope.insertEmailLinksAndSignatureCallback);
				}
	    	});
		} else {
			setTimeout($scope.insertEmailLinksAndSignatureCallback, 100);
		}
    	
    }
    
    $scope.cleanEmailSettings = function() {
    	// clean the email setting flag so it will again fetch the email settings, email template, staff and client links
    	$scope.hasEmailSettingLoaded = false;
    	// clean fieldInfoMap so it will again fetch the field maps based on the current module
    	$scope.fieldInfoMap = [];
    }
	
	$scope.insertEmailLinksAndSignatureCallback = function() {
		if(!($scope.isLinksInsertedOnEmailIconClick || $scope.isReplyEmail)) {
			$scope.insertLink();
			$scope.isLinksInsertedOnEmailIconClick = true;
		}
		$scope.insertEmailSignatureCB = $scope.getInsertEmailSignature();
		if($scope.insertEmailSignatureCB) {
			$scope.insertEmailSignatureInBody();
		}
		sidebarModel.hideLoader();
		if (!$scope.$$phase){                                                                                                                                                                                                                 
            $scope.$apply();
		}
		setTimeout(function() { 
		   if($('#email_body').is(':visible') && !$scope.isIE11())
		    	$scope.resetCursorToBeginning(document.getElementById('email_body'));
		}, 10);
	} 
	
	$scope.insertEmailSignature = function() {
		// set cookie value for InsertEmailSignature
		$scope.insertEmailSignatureCB = !$scope.insertEmailSignatureCB;
		$scope.setInsertEmailSignature($scope.insertEmailSignatureCB);
		if($scope.insertEmailSignatureCB) {
			$scope.insertEmailSignatureInBody();
		}
	}
	
	/*
	 * Method for inserting email signature in email content body.
	 */
	$scope.insertEmailSignatureInBody = function() {
		if($scope.emailSignature.enabled 
				&& typeof($scope.emailSignature.custom) != 'undefined'
				&& $scope.emailSignature.custom != null
				&& ($scope.getEmailSignaturePosition() == -1)
				&& $scope.emailSignature.isAccessible) {
			var emailSignature = ((!$scope.isReplyEmail && !$scope.emailSignatureInsertedOnce) ? '<br><br><br>' : '<br><br>') + $scope.emailSignature.custom;
			$scope.emailSignatureInsertedOnce = true;
			if($scope.editor.mode == 'plaintext') {
				var sepratorIndex = 0;
				if($scope.email.emailBody.indexOf($scope.replyPlainEmailSeparator) > 0) {
					sepratorIndex = $scope.email.emailBody.indexOf($scope.replyPlainEmailSeparator);
				} else {
					sepratorIndex = $scope.email.emailBody.length;
				}
				$scope.email.emailBody = [$scope.email.emailBody.slice(0, sepratorIndex), $scope.stripHtml(emailSignature), $scope.email.emailBody.slice(sepratorIndex)].join('');
	    	} else {
	    		var sepratorIndex = 0;
	    		var rtfFrame = document.getElementById('rtfFrame');
           	 	var richBodycomp = getRichComponent(rtfFrame);
           	 	if(richBodycomp) {
           	 		$scope.email.emailBody = richBodycomp.innerHTML;
           	 	}
	    		if($scope.email.emailBody.indexOf($scope.replyRTFEmailSeparator) > 0) {
					sepratorIndex = $scope.email.emailBody.indexOf($scope.replyRTFEmailSeparator);
				} else {
					sepratorIndex = $scope.email.emailBody.length;
				}
				$scope.email.emailBody = [$scope.email.emailBody.slice(0, sepratorIndex), emailSignature, $scope.email.emailBody.slice(sepratorIndex)].join('');
	    		$scope.refreshRTFEditorWithNewContent();
	    	}
		}
	}
    
    $scope.isIE = function() {
    	return window.navigator.userAgent.indexOf("MSIE ") > 0 ? true : false;
    }

    $scope.isIE11 = function() {
    	
	    if ($scope.isIE() || !!navigator.userAgent.match(/Trident.*rv\:11\./)){
	        return true;
	    }
	    return false;
    }

    $scope.isChrome = function() {
    	return window.navigator.userAgent.indexOf("Chrome") != -1 ? true : false;
    }
    $scope.isEdge = function() {
    	return window.navigator.userAgent.indexOf('Edge/') > 0 ? true : false;
    }
    $scope.isFirefox = function() {
    	return window.navigator.userAgent.indexOf("Firefox") != -1 ? true : false;
    }

    $scope.searchFieldNames = function() {
	    var input, filter;
	    $scope.noFieldsFound = false;
	    input = document.getElementById("searchtext");
	    filter = input.value.toUpperCase();
	    var counter = 0;
	    angular.forEach($scope.fieldInfoMap,function(field){
   			var fieldLabel = RemedyForceHTMLProcessor.htmlDecoder(field['fieldLabel']).toUpperCase();
   			var fieldApi = field['fieldApi'];
			if(fieldLabel.indexOf(filter) > -1) {
				counter++;
	    		$('#'+fieldApi+'div').parent().show();
		    } else {
		    	$('#'+fieldApi+'div').parent().hide();
		    }
       	});

	    if(counter == 0) {
	    	$scope.noFieldsFound = true;
	    } else {	    	
    		$(".mergeFieldMenuDropdown").unmark({
		      done: function() {
			        $(".mergeFieldMenuDropdown").mark(filter);
			        $(".actionMenuTextId").unmark(filter);
			    }
		    });	
	    	
	    }
	}

	$scope.isScrolledIntoView = function(elementId) {
    	var element 		= 	document.getElementById(elementId);
	    var docViewTop 		= 	$(window).scrollTop();
	    var docViewBottom 	= 	docViewTop + $(window).height();

	    var elementTop 		= 	$(element).offset().top;
	    var elementBottom 	= 	elementTop + $(element).height();

	    return ((elementBottom <= docViewBottom) && (elementTop >= docViewTop));
	}

}]);


angular.module('sidebarModule').directive('compile', ['$compile', function ($compile) {
  return function(scope, element, attrs) {
      scope.$watch(
        function(scope) {
          return scope.$eval(attrs.compile);
        },
        function(value) {
			element.html(value);
			$compile(element.contents())(scope);
        }
    )};
}]);