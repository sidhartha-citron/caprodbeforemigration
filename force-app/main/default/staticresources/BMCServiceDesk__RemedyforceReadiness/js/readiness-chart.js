	/** Start Plugin for center text in donut **/

Chart.pluginService.register({
  beforeDraw: function(chart) {
    var width = chart.chart.width,
        height = chart.chart.height,
        ctx = chart.chart.ctx;

    ctx.restore();
    
    ctx.font = "38px arial";
    ctx.fillStyle = getDonutColor();
    ctx.textBaseline = "middle";

    var text = rfCompleteness + "%",
        textX = Math.round((width - ctx.measureText(text).width) / 2),
        textY = height / 2 - 10;

    ctx.fillText(text, textX, textY);    
  }
});
/** End Plugin for center text in donut **/

function getDonutColor(){

	var color = '#89c341';
	if(rfCompleteness < 40){
		color = '#f83200';
	}
	else if(rfCompleteness >= 40 && rfCompleteness < 70){
		color = '#f1b521';
	}
	return color;
}
angular.module('readinessApp', ['chart.js'])
	// Optional configuration
	.config(['ChartJsProvider', function (ChartJsProvider) {
		// Configure all charts
		ChartJsProvider.setOptions({
			chartColors: [getDonutColor(), '#f2f2f2'],
			elements: {
		        arc: {
		            borderWidth: 0
		        }
		    },			
			responsive: true,
			aspectRatio:1,
			tooltips: {
				 enabled: false
			}
		});
		// Configure all line charts
		ChartJsProvider.setOptions('pie', {});
	}])
	.controller("pieCtrl", ['$scope','$q','$compile', function ($scope,$q,$compile) {

		$scope.labels = [rfCompletenessLabel, ""];
		$scope.data = [rfCompleteness,100-rfCompleteness];
		
		$scope.datasetOverride = {
			backgroundColor: [
			  getDonutColor(),"#f2f2f2"

			],
			hoverBackgroundColor: [
			  getDonutColor(),"#f2f2f2"		
			] ,
		  
		}
		$scope.subfeatureMap = JSON.parse(featuresReadiness);
		$scope.subFeatureRRmap = JSON.parse(subfeaturesReadinessString);
		$scope.overallCompletenessLabel = rfCompletenessLabel;
		$scope.overallCompleteness = rfCompleteness;
		$scope.pointsLabel = readinessPointsLabel;
		$scope.knowMoreLabel = readinessKnowMoreLabel;
		$scope.subFeatureCompletenessMap = [];
		featureMap = {};
		$scope.child = {};
		$scope.currentSubFeature ='';
		$scope.oldSubFeature ='';
		$scope.currentSubFeatureScore = 0;
		$scope.showChildCard = false;
		$scope.showChildGraphs = false;
		$scope.showBackBtn = false;
		$scope.showPieChart = true;
		$scope.linkedinIcon = readinessResourcePath + '/Images/linkedin.png';
		$scope.twitterIcon = readinessResourcePath + '/Images/twitter.png';
		$scope.fbIcon = readinessResourcePath + '/Images/facebook.png';
		$scope.bmcIcon = readinessResourcePath + '/Images/bmc_communities.png';	
		$scope.bmcLogo = sdefStyleResourcePath + '/SDEFimages/logo_bmc.png';
		$scope.selectedBadgeName = '';
		$scope.selectedBadgeId = '';
		$scope.selectedBadgeModule = '';
		$scope.selectedBadgeLevel = '';
		$scope.selectedBannerUrl = '';
		$scope.tweetMessage = '';
		$scope.tweetCardUrl = '';
		$scope.fbMessage = '';
		$scope.bmcCommunitiesMessage = {"data" : '' };
		$scope.rfBadgeDonutTooltip = rfBadgeDonutTooltip;
		$scope.showError = false;
		$scope.isCommunitiesEnabled = false;
		$scope.isTwitterEnabled = false;
		$scope.isLinkedInEnabled = false;
		$scope.isFacebookEnabled = false;
		$scope.isSharingEnabled = false;
		$scope.badgeBannerURL = '';
		$scope.communityPostSharingError = communityPostSharingError;
		$scope.labelCommunities = labelCommunities;
		$scope.labelCancel = labelCancel;
		$scope.labelPost = labelPost;
		$scope.labelClose = labelClose;
		$scope.RFCommunityURL = RFCommunityURL;
		$scope.badgeShareAccessCheck = function(params){
            var deferred = $q.defer(); 
            Visualforce.remoting.Manager.invokeAction(_RemotingActions.getAdditionalInfo,null,function(result,event){
            	if(event.status){
            		deferred.resolve(result);
            	}
            	else{
            		deferred.reject();            		
            	}            	
            });
            return deferred.promise;
        }
		
		$scope.badgeShareAccessCheckFn = function(){
			var enableBadgesPromise = $scope.badgeShareAccessCheck();
			enableBadgesPromise.then(function(data) {
				if(typeof (data) != 'undefined' && data && data.enabledBadges){
					if(data.enabledBadges.indexOf('1001') > -1){
						$scope.isCommunitiesEnabled = true;
						$scope.isSharingEnabled = true;
					}
					if(data.enabledBadges.indexOf('1002') > -1){
						$scope.isTwitterEnabled = true;
						$scope.isSharingEnabled = true;
					}
					if(data.enabledBadges.indexOf('1003') > -1){
						$scope.isLinkedInEnabled = true;
						$scope.isSharingEnabled = true;
					}
					if(data.enabledBadges.indexOf('1004') > -1){
						$scope.isFacebookEnabled = true;
						$scope.isSharingEnabled = true;
					}
					console.log('Badge Share access check complete');
				}	
			});	
		}
		
		$scope.badgeShareAccessCheckFn();
		
		$scope.onBadgeClick = function(selectedBadgeId,selectedBadgeModule,selectedBadgeLevel,selectedBannerUrl,isBadgeEnabled,selectedBadgeName,badgeUrl,badgeNameWithoutLevel){
			var BadgeLevel = proficient;
			if(selectedBadgeLevel == "2"){
				BadgeLevel = expert;
			}
			if(isBadgeEnabled && $scope.isSharingEnabled){
				$scope.selectedBadgeName = selectedBadgeName; 
				$scope.selectedBadgeId = selectedBadgeId;
				$scope.selectedBadgeModule = selectedBadgeModule;
				$scope.selectedBadgeLevel = selectedBadgeLevel;
				$scope.selectedBannerUrl = selectedBannerUrl;
				$scope.tweetMessage = rFBadgeTwitterShareContent.replace('{BADGE_NAME}', selectedBadgeName);
				$scope.badgeBannerURL = badgeUrl;
				
				if(mapBadgeInfo[selectedBadgeModule + selectedBadgeLevel] && mapBadgeInfo[selectedBadgeModule + selectedBadgeLevel].twitterCode){
					$scope.tweetCardUrl = twitterCardUrl.replace('{BADGESHORTHAND}',mapBadgeInfo[selectedBadgeModule + selectedBadgeLevel].twitterCode.toLowerCase());					
				}
				$scope.fbMessage = rFBadgeTwitterShareContent.replace('{BADGE_NAME}', selectedBadgeName);
				var ShareContent = rFBadgeCommunityShareContent.replace('{BADGE_NAME}', badgeNameWithoutLevel);
				$scope.bmcCommunitiesMessage.data = ShareContent.replace('{BADGE_LEVEL}', BadgeLevel);
				$scope.linkedinMessage = ''; 

				$scope.launchModal(selectedBadgeId + '' + selectedBadgeLevel);
			}
		}
		
		$scope.launchModal = function(elId){
			$scope.DestroyPopovers(); //destroy existing popover
			var options = {
					content : $scope.getPopupOverContent(),
					html : true,
					placement : 'bottom',
					title : '',
					trigger : 'click'
			}
			$('#'+elId).popover(options);
			$('#'+elId).popover('show');
		}	
		
		$scope.clickListener = function(){
			$('body').on('click', function (e) {
			    $('.poppable').each(function () {
			        // hide any open popovers when the anywhere else in the body is clicked
			        if (!$(this).is(e.target) && $(this).has(e.target).length === 0 && $('.popover').has(e.target).length === 0) {
			            $(this).popover('dispose');
			        }
			    });
			});	
		}
		$scope.clickListener();
		
		$scope.DestroyPopovers = function(){
		    $('.poppable').each(function () {
		        // hide any open popovers when the anywhere else in the body is clicked
		    	$(this).popover('dispose');
		    });
		}
		
		$scope.getPopupOverContent = function(){
			var htmlBody = '<div width=\"90%\">' +
						'<span ng-if=\"isCommunitiesEnabled\" class="socialButtonWrapper"><img class="socialButton" ng-click=\"openBmcCommunitiesPopup()\" src=\"{{bmcIcon}}\"></img></span>' +
						'<span ng-if=\"isTwitterEnabled\" class="socialButtonWrapper"><img class="socialButton" ng-click=\"openTwitterPopup()\" src=\"{{twitterIcon}}\"></img></span>' +
						'<span ng-if=\"isLinkedInEnabled\" class="socialButtonWrapper"><img class="socialButton" ng-click=\"openLinkedinPopup()\" src=\"{{linkedinIcon}}\"></img></span>' +
						'<span ng-if=\"isFacebookEnabled\" class="socialButtonWrapper"><img class="socialButton" ng-click=\"openFbPopup()\" src=\"{{fbIcon}}\"></img></span>' +					
					'</div>';
			 return $compile(htmlBody)($scope);  
		}
				
		$scope.getToolTip = function(isBadgeEnabled,badgeName,level){
			if(isBadgeEnabled){
				if($scope.isSharingEnabled){
					return rfBadgeAchievementShare.replace('{BADGE_NAME}',badgeName);
				}
				else{
					return badgeName;
				}
			}
			else{ 
				if(level == 1){
					return rfBadgeDisabledTooltip.replace('{PERCENT}','50').replace('{BADGE_NAME}',badgeName);
				}
				else if(level == 2){
					return rfBadgeDisabledTooltip.replace('{PERCENT}','90').replace('{BADGE_NAME}',badgeName);
				}
			}
		}
		
		$scope.closePopup = function(){
			$('#bmcCommunityPopup').toggleClass('show');
			$scope.showError = false;
			var btn = document.getElementById('saveButton');
			if(btn){
				document.getElementById('saveButton').disabled = false;
			}
		}
		
		$scope.closeModalPopup = function(){
			$('#modal-lg').toggleClass('show');
		}
		
		$scope.sendPost = function(){
			var bmcCommunitiesMessage = $scope.bmcCommunitiesMessage.data;
			var saveButton = document.getElementById('saveButton');
			var cancelButton = document.getElementById('cancelButton');
			var cancelIcon = document.getElementById('closeBMCCommunityPopup');
			if(bmcCommunitiesMessage && $scope.badgeBannerURL){
				try{
				saveButton.disabled = true;
				cancelButton.disabled = true;
				cancelIcon.disabled = true;
				Visualforce.remoting.Manager.invokeAction(_RemotingActions.sendPostToBMCCommunities,bmcCommunitiesMessage,$scope.selectedBadgeLevel,$scope.selectedBadgeModule,
					function(result,event){
	            	if(event.status){
	            		if(result == 'Success'){
	            			$scope.closePopup();
							if(RFCommunityURL){
								var win = window.open(RFCommunityURL, '_blank');
								win.focus();
							}
	        			}else{
	        				$scope.$apply(function () {
	        					$scope.showError = true;
	        				});
	        				$('#errorPanel').html($scope.communityPostSharingError); 
	        			}
		            }
            		saveButton.disabled = false;
    				cancelButton.disabled = false;
    				cancelIcon.disabled = false;
	            });
				}catch(error){
					saveButton.disabled = false;
    				cancelButton.disabled = false;
    				cancelIcon.disabled = false;
				}
			}
		}
		
		
		$scope.openTwitterPopup = function(){
			var url = 'https://twitter.com/intent/tweet?text='+ encodeURIComponent($scope.tweetMessage) + '&url=' + encodeURIComponent($scope.tweetCardUrl);
			$scope.PopupCenter(url);
			$scope.DestroyPopovers();
		} 

		$scope.openBmcCommunitiesPopup = function(){
			$scope.DestroyPopovers();
			$('#bmcCommunityPopup').toggleClass('show');
			$('#inputTextArea').focus();
		} 		

		$scope.openFbPopup = function(){
			var quote = encodeURIComponent($scope.fbMessage);
			var url = 'https://www.facebook.com/sharer/sharer.php?quote='+ quote +'&u='+ encodeURIComponent($scope.selectedBannerUrl); 
			$scope.PopupCenter(url);
			$scope.DestroyPopovers();
		} 	

		$scope.openLinkedinPopup = function(){
			var quote = encodeURIComponent($scope.linkedinMessage);
			var url = 'https://www.linkedin.com/shareArticle?mini=true&url='+encodeURIComponent($scope.selectedBannerUrl)+'&source=LinkedIn';
			$scope.PopupCenter(url);
			$scope.DestroyPopovers();
		} 	
		
		$scope.PopupCenter = function(url){
		    var win = window.open(url, '_blank');
		    win.opener = null;
		}

		$scope.drillDown=function(){
			if(!$scope.showChildGraphs){
				$scope.showChildGraphs = true;
				$scope.showPieChart = false;
				$scope.showBackBtn = true;
				$('.container').html('');
				$scope.overallCompleteness = $scope.overallCompleteness;		
				for(var index = 0; index < $scope.subfeatureMap.length; index++) {					
					var singleFeature = [];
					singleFeature.FeatureName = $scope.subfeatureMap[index].featureName;
					singleFeature.Score = $scope.subfeatureMap[index].score;
					singleFeature.class = 'progress-bar-success';
					singleFeature.isFirstBadgeEnabled = false;
					singleFeature.isSecondBadgeEnabled = false;

					if(singleFeature.Score<41){
						singleFeature.class = 'progress-bar-danger';
					}
					if(singleFeature.Score>40 && singleFeature.Score<75){
						singleFeature.class = 'progress-bar-warning';
					}

					if(singleFeature.Score >= 50 && singleFeature.Score < 90){
		    			singleFeature.isFirstBadgeEnabled = true;
		    		}
		    		else if(singleFeature.Score >= 90){
		    			singleFeature.isFirstBadgeEnabled = true;
		    			singleFeature.isSecondBadgeEnabled = true;
		    		}
		    		singleFeature.badge1url = $scope.getBadgeUrl(singleFeature.FeatureName,1);
		    		singleFeature.badge2url = $scope.getBadgeUrl(singleFeature.FeatureName,2);
		    		singleFeature.banner1url = $scope.getBannerUrl(singleFeature.FeatureName,1);
		    		singleFeature.banner2url = $scope.getBannerUrl(singleFeature.FeatureName,2);
		    		singleFeature.badge1Name = $scope.getBadgeName(singleFeature.FeatureName,1);
		    		singleFeature.badge2Name = $scope.getBadgeName(singleFeature.FeatureName,2);
					//for both levels the badge name will be same hence getting it for one only
					singleFeature.badgeName = $scope.getOnlyBadgeName(singleFeature.FeatureName,1);
					
					singleFeature.id = singleFeature.FeatureName.split(' ').join('-');
					$scope.subFeatureCompletenessMap.push(singleFeature);
					updateProgress(singleFeature, true);
					Visualforce.remoting.Manager.invokeAction(
						_RemotingActions.updateRFReadiness,$scope.subfeatureMap,function(result, event){
						if(event.status){}								
					})
				}
			}
		};

		$scope.getBadgeUrl = function(featureName,level){
			if(mapBadgeInfo[featureName+level] && mapBadgeInfo[featureName+level].badgeFileName){
				return BmcSiteUrl + '/images/' + mapBadgeInfo[featureName+level].badgeFileName;
			}			
			else{
				return '';
			}			
		}
		
		$scope.getBannerUrl = function(featureName,level){
			if(mapBadgeInfo[featureName+level]){
				return BmcSiteUrl + '/banners/' + mapBadgeInfo[featureName+level].badgeFileName;
			}			
			else{
				return '';
			}																	
		}
		
		$scope.getBadgeName = function(featureName,level){
			if(mapBadgeInfo[featureName+level] && mapBadgeInfo[featureName+level].name){
				return mapBadgeInfo[featureName+level].name;
			}			
			else{
				return '';
			}
		}
		$scope.getOnlyBadgeName = function(featureName,level){
			if(mapBadgeInfo[featureName+level] && mapBadgeInfo[featureName+level].featureName){
				return mapBadgeInfo[featureName+level].featureName;
			}			
			else{
				return '';
			}
		}

		$scope.setsubFeatureId = function(subFeature, score){	
			$scope.currentSubFeature = subFeature;
			$scope.selectedSubFeatureCriteriaMap = [];
			if($scope.currentSubFeature != $scope.oldSubFeature){
				$('.featuremapId').html('');
			}				
			$scope.selectedSubFeatureCriteriaMap = $scope.subFeatureRRmap[subFeature];
			$scope.currentSubFeatureScore = score;
			$scope.oldSubFeature =subFeature;
			for(var index = 0; index < $scope.selectedSubFeatureCriteriaMap.length; index++) {
				var singleFeature = [];
				singleFeature.id = $scope.selectedSubFeatureCriteriaMap[index].subFeatureId;
				singleFeature.Score = $scope.selectedSubFeatureCriteriaMap[index].Score;
				singleFeature.status = $scope.selectedSubFeatureCriteriaMap[index].status;
				
				var progressBarCSS = 'progress-bar-success';
				var progressBarCSSText = 'completedCriteria';
				var statusLabel = statusLabels.completed;
				// Status has a value of either 0, 1 or 2 (0=Not Started, 1=In Progress, 2=Completed)
				if(singleFeature.status == 0) {
					progressBarCSS = '';
					progressBarCSSText = 'inCompleteCriteria';
					statusLabel = statusLabels.notStarted;
				} else if(singleFeature.status == 1) {
					if(singleFeature.Score < 40){
						progressBarCSS = 'progress-bar-danger';
						progressBarCSSText = 'dangerCriteria';
					} else if(singleFeature.Score >= 40 && singleFeature.Score < 70) {
						progressBarCSS = 'progress-bar-warning';
						progressBarCSSText = 'warningCriteria';
					}
					statusLabel = statusLabels.inProgress;
				}
				$scope.selectedSubFeatureCriteriaMap[index].cssStyle = progressBarCSS;
				$scope.selectedSubFeatureCriteriaMap[index].textCSStyle = progressBarCSSText;
				$scope.selectedSubFeatureCriteriaMap[index].statusLabel = statusLabel;
				updateProgress(singleFeature, false);
			}
			$('#modal-lg').toggleClass('show');
		};

		$scope.loadChildCards = function(){
			$scope.showChildCard = true;
		};
		
		$scope.loadPieChart = function(){
			$scope.showPieChart = true;
			$scope.showChildGraphs = false;
			$scope.showBackBtn = false;
		};
		$scope.openHelp = function(){
			if(wikiUrl){
				window.open(wikiUrl,false,'width='+screen.width+',height='+screen.height+',resizable = 1,scrollbars=yes,status=1,top=0,left=0',false);	
			}			
		};		
		var updateProgress = function(feature, showAnimation){
			var current_progress = 0;
			if(showAnimation){
				var progressBar = setInterval(function() {					
				if((current_progress+1)<feature.Score){
					current_progress += 1;
				}else{
					current_progress = feature.Score;
				}

				$("#"+feature.id)
					.css("width", current_progress + "%")
					.attr("aria-valuenow", current_progress)

				if (current_progress >= feature.Score)						  
					clearInterval(progressBar);
				}, 30);
			}else{
				var progressBar = setInterval(function() {					
					if(feature.status != 0) {
						current_progress = feature.Score;					
						$("#"+feature.id)
							.css("width", current_progress + "%")
							.attr("aria-valuenow", current_progress)
	
						if (current_progress >= feature.Score)					  
						clearInterval(progressBar);
					}
				}, 30);
			}
			
		};
		
		$scope.updateCSS = function (event){
			$( event.target ).closest( ".image-flip" ).toggleClass( "hover" );
		};
		$scope.toggleFlip = function (event){
			if($( event.target ).closest( ".image-flip" ).hasClass( "hover" )){
				$( event.target ).closest( ".image-flip" ).toggleClass( "hover" );
			}		
		};
	}])
	.directive('onError', function() {  
	  return {
	    restrict:'A',
	    link: function(scope, element, attr) {
	      element.on('error', function() {
	        element.attr('style', 'display:none');
	      })
	    }
	  }
	});
	
	function allowPost(){
			var btn = document.getElementById('saveButton');
			var textValue = document.getElementById("inputTextArea").value.trim();
			if(textValue==="" && btn) { 
				document.getElementById('saveButton').disabled = true; 
			} else if(btn){ 
				document.getElementById('saveButton').disabled = false;
			}			
		};
	function createCommunityRemoteSite() 
	{ 
	  var binding = new XMLHttpRequest();            
		var request =
			'<?xml version="1.0" encoding="utf-8"?>' +
			'<env:Envelope xmlns:env="http://schemas.xmlsoap.org/soap/envelope/" xmlns:xsd="http://www.w3.org/2001/XMLSchema" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance">'+
				'<env:Header>' +
					'<urn:SessionHeader xmlns:urn="http://soap.sforce.com/2006/04/metadata">' +
						'<urn:sessionId>'+apiSessionId+'</urn:sessionId>' +
					'</urn:SessionHeader>' +
				'</env:Header>' +
				  '<env:Body>' +
					'<upsertMetadata xmlns="http://soap.sforce.com/2006/04/metadata">' +
						'<metadata xsi:type="RemoteSiteSetting">' +
							'<fullName>RemedyforceCommunity</fullName>' +
							'<description>Remote Site Setting for Remdyforce Community</description>' +
							'<disableProtocolSecurity>false</disableProtocolSecurity>' +
							'<isActive>true</isActive>' +
							'<url>'+communityBaseURL+'</url>' +
						'</metadata>' +                           
					'</upsertMetadata>' +
				'</env:Body>' +
			'</env:Envelope>';
		binding.open('POST', 'https://'+sfhost+'/services/Soap/m/31.0');
		binding.setRequestHeader('SOAPAction','""');
		binding.setRequestHeader('Content-Type', 'text/xml');
				try{
					var result = binding.send(request);
				}
				catch(err){
					console.log(err.message);
				}
			binding.onreadystatechange = function() {
				if (this.readyState == 4 && this.status == 200) {
				createRemedyforceCommunityRemoteSettingCopy();
			   }
			};
	}	
		