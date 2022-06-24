angular.module('supportModule')
.directive('rfssTooltip',['$timeout', 'supportModel', function ($timeout, supportModel){
	return {
		restrict: 'A',
		replace: false,								
		link: function ($scope, element, attrs) {	
			var srdId = attrs.srdid;
			var catName = '';
			var catDesc = supportModel.categoriesDescMap[attrs.catid];
			var catId,additionalParam;
			if(srdId != "" && srdId != undefined){
				return;
			}
			var catInfo = attrs.catid.split('¬');
			if(catInfo.length > 0){
				catId = catInfo[0];
				catName = catInfo[1];
				additionalParam = {};
			}														
			if(!showCategoryDescription){
				element.attr('title',supportModel.decodeText(catName));
				return;
			}
			element.on('mouseenter',function(){						
				$('[data-catId]').popover('hide');						
				element.popover({
					title:catName,
					content:catDesc,
					html:true,
					trigger: 'manual',
					placement:'right',
					container:'body'
				}).popover('show');													
			}).on('mouseleave',function(e){						
				var _this = $(this);
				$(".popover").hover(function(){
					  isOnPopover = true;
						}, function(){
						 isOnPopover = false;
							_this.popover('hide');					    			
						  });
				setTimeout(function () {
					  if(!isOnPopover){
						 _this.popover('hide');					     		
					}
				  },200);
			})
		}
	};
}])

.directive('rfcatTooltip',['$timeout', 'supportModel', function ($timeout, supportModel){
	return {
		restrict: 'A',
		replace: false,								
		link: function ($scope, element, attrs) {	
			var catName = '';
			var catDesc = attrs.catdesc;
			var catId;
			var catInfo = (attrs.catid && attrs.catid.indexOf('¬') != -1) ? attrs.catid.split('¬') : [];
			if(catInfo.length > 0){
				catId = catInfo[0];
				catName = catInfo[1];
			}														
			if(!showCategoryDescription){
				element.attr('title',supportModel.decodeText(catName));
				return;
			}
			element.on('mouseover',function(){	
				clearTimeout(1000);
				setTimeout(function(){
				$('[data-catId]').popover('hide');						
					var tooltip = element.popover({
					title:catName,
					content:catDesc || '',
					html:true,
					trigger: 'manual',
					placement: attrs.placement || 'auto bottom',	
						container:'body'
					});
					tooltip.popover('show');					
				},1000);
			}).mouseout(function(){
				clearTimeout(1000);
				$(".popover").popover('hide');
			})
		}
	};
}])

.directive('ssTileDescTooltip',['$timeout',function ($timeout){
	return {
		restrict: 'A',
		replace: false,								
		link: function ($scope, element, attrs) {	
			var tileName = attrs.tilename;
			var tileDesc = attrs.tiledesc;
			element.on('mouseover',function(){	
				clearTimeout(300);
				$('[data-tilename]').popover('hide');						
					var tooltip = element.popover({
					title:tileName,
					content:tileDesc || '',
					html:true,
					trigger: 'manual',
					placement: attrs.placement || 'auto bottom',	
						container:'body'
					});
					tooltip.popover('show');					
			}).mouseout(function(){
				clearTimeout(500);
				$(".popover").popover('hide');
			})
		}
	};
}])

.directive('requestDescription', ['srdCreateService', 'incidentCreateService','$sce', function (srdCreateService, incidentCreateService,$sce) {
	var resourceUrl=$("a[id*='selfServiceResourcesUrl']").attr('href');
	return {
			restrict: 'AE',
			replace: true,
			scope: {
				data: '='
		},
		templateUrl: resourceUrl+'views/support/srd-questions/request-description.html',
		link: function ($scope, element, attrs) {
			var el =element[0].children[0];
			$scope.toggleDescription = function(){
				$scope.data.descriptionData.showDescriptionEllipses = !$scope.data.descriptionData.showDescriptionEllipses; 
				if ($scope.data.descriptionData.showDescriptionEllipses) {
					if ($scope.data.isRTFDesc  == 'true'){ 
						$scope.data.descriptionData.descriptionClass = 'support-request__description-ellipsis support-request__description-maxheight';
					} else {
						$scope.data.descriptionData.descriptionClass = 'support-request__description-ellipsis support-request__description-ellipsis-maxHeight';
					}							
				} else {
					if ($scope.data.descriptionData.isSearch != undefined && $scope.data.descriptionData.isSearch) {
						$scope.data.descriptionData.descriptionClass = 'support-request__description support-request__description-search';
					} else {
						$scope.data.descriptionData.descriptionClass = 'support-request__description ';
					}
				}
				if($scope.data.descriptionData.isDraftDescription) {
					$scope.data.descriptionData.descriptionClass += ' support-request__draft-title-description';
				}
			}
			$scope.trustedHtml = function(plainText){
				return $sce.trustAsHtml(plainText);
			}
			$scope.disableRecorddetailPopup = function($event){
				if($event.target.tagName.toLowerCase() === 'a'){
					$event.stopPropagation();
				}
			}					
			$scope.$watch(  
				function () { 
					el = element[0].children[0]; 
					return element[0].children[0].scrollHeight; 
				},
				function () {
					if($scope.data && $scope.data.descriptionData && $scope.data.descriptionData.value){
						$scope.data.descriptionData.value = $scope.data.descriptionData.value.trim();
					}
					if (el.scrollHeight == 0 || el.clientHeight == 0 || $scope.data == undefined || $scope.data.descriptionData == undefined)
						return;
					if ($scope.data.descriptionData.value == undefined || $scope.data.descriptionData.value == '')	
						return;
					if (el.scrollHeight != el.clientHeight + 1  && el.scrollHeight != el.clientHeight) {
						$scope.data.descriptionData.showToggle =  true;
						$scope.data.descriptionData.showDescriptionEllipses = true;
					} else {
						$scope.data.descriptionData.showDescriptionEllipses = false;
					}

					if ($scope.data.descriptionData.showDescriptionEllipses) {
						if ($scope.data.isRTFDesc == 'true'){ 
						$scope.data.descriptionData.descriptionClass = 'support-request__description-ellipsis support-request__description-maxheight';
					} else {
						$scope.data.descriptionData.descriptionClass = 'support-request__description-ellipsis support-request__description-ellipsis-maxHeight';
					}							
					} else {
						if ($scope.data.descriptionData.isSearch != undefined && $scope.data.descriptionData.isSearch) {
							$scope.data.descriptionData.descriptionClass = 'support-request__description support-request__description-search';
						} else {
							$scope.data.descriptionData.descriptionClass = 'support-request__description';
						}
					}
					if($scope.data.descriptionData.isDraftDescription) {
						$scope.data.descriptionData.descriptionClass += ' support-request__draft-title-description';
					}
			});
		}
	};
}])
.directive('srdHyperlinkQuestion', function() {
	var resourceUrl=$("a[id*='selfServiceResourcesUrl']").attr('href');
	return {
		templateUrl : resourceUrl+'views/support/srd-questions/hyperlink.html',
		scope: {
				data: '='
		}
	};		
})
.directive('srdQuestionHeader', function () {
	var resourceUrl=$("a[id*='selfServiceResourcesUrl']").attr('href');
	return {
		restrict: 'E',
		replace: true,
		scope: {
			questionData: '=',
			showRequiredLabelIfDefault: '@'
		},
		templateUrl: resourceUrl+'views/support/srd-questions/question-header.html',
		link: function ($scope, element, attrs) {
			$scope.urlInfo = function(urlValue){
				window.open(urlValue,"_blank","height=500,width=1000,left=170,top=100,toolbar=no,menubar=no,scrollbars=yes,resizable=yes,status=no");
			}
		}
	};
})
.directive('srdHeaderSection',function(){
	var resourceUrl=$("a[id*='selfServiceResourcesUrl']").attr('href');
	return {
		restrict: 'E',
		replace: true,
		scope: {
			data: '=',
			showRequiredLabelIfDefault: '@'
		},
		templateUrl: resourceUrl+'views/support/srd-questions/header-section.html'				
	};
})
.directive('srdTextQuestion', ['$timeout', 'supportModel', function ($timeout, supportModel) {
	var resourceUrl=$("a[id*='selfServiceResourcesUrl']").attr('href');
	return {
		restrict: 'AE',
		replace: true,
		scope: {
			data: '='
		},
		templateUrl: resourceUrl+'views/support/srd-questions/text.html',
		link: function (scope, element) {
			if (scope.data.Type == 'richtextarea') {
				scope.userLang = supportModel.userLang;
				scope.pluginParam = supportModel.pluginParam;
				if (scope.data.isSrd != undefined && !scope.data.isSrd) 
					scope.pluginParam.imageType =  'IN';
				else {
					if (scope.data.isSRInput)
						scope.pluginParam.imageType =  'RD';
					else
						scope.pluginParam.imageType =  'SR';
				} 
			}
			scope.$watch('data.Value', function () {
				if(typeof(scope.data.isSRInput) != "undefined" && scope.data.isSRInput != null && scope.data.isSRInput == true){
					var srInputs = supportModel.srData.SRInputs;
					srInputs = supportModel.evaluateCondition(scope.data, srInputs, false);
					supportModel.srData.SRInputs = srInputs;
				} else if(scope.data.isDescription && scope.data.Value && (scope.data.Value.length >= 2 || supportModel.isCJKPattern(scope.data.Value))) {
					supportModel.smartSuggestions(scope.data);
				}else if(scope.data.isDescription && scope.data.Value == undefined) {
					supportModel.smartSuggestions(scope.data);							
				}
				if(supportModel.TicketOrRequest == 'Ticket'){
					supportModel.evaluateIncidentFldConditions(scope.data, supportModel.userModel.LayoutFldsandCriteria, supportModel.incident, false);
				}
			});

		}
	};
}])

.directive('srdRichText', [ function () {
	return {
		require: '?ngModel',
		link: function ($scope, element, attrs, ngModel) {
			CKEDITOR.on( 'dialogDefinition', function( ev ){
				if (ev && ev.data ) {
					var dialogName = ev.data.name;
					var dialogDefinition = ev.data.definition;
					if ( dialogName == 'link' )
					{
						var infoTab = dialogDefinition.getContents( 'target' );
						var linktypeField = infoTab.get( 'linkTargetType' );

						/* Remove it from the array of items */
						if (linktypeField.items.length > 2 && linktypeField.items[2][1] == 'popup')
							linktypeField['items'].splice(2, 1);
					}	
				}
			});
			
			var ck = CKEDITOR.replace(element[0], {  language: $scope.userLang, pluginParam: $scope.pluginParam });
			var timer;
			// Avoid firing the event too often
			function somethingChanged(){
				if (timer)
					return;
				timer = setTimeout( function() {
					timer = 0;							
				ngModel.$setViewValue(ck.getData());
				}, ck.config.minimumChangeMilliseconds || 100);
			}
			
			ck.on( 'afterCommandExec', function( event ){						
				somethingChanged();
			});
			ck.on( 'contentDom', function(){
				ck.document.on( 'keydown', function( event ){
					somethingChanged();
				});
				// Firefox OK
				ck.document.on( 'drop', function(){
					somethingChanged();
				});
				// IE OK
				ck.document.getBody().on( 'drop', function(){
					somethingChanged();
				});
			});
				 
			ck.on('dialogHide', function (event){
				somethingChanged();
			});							
													
			ck.on('insertElement', function (event){
				somethingChanged();
			});
																											
			ck.on('pasteState', function () {
				$scope.$apply(function () {
					ngModel.$setViewValue(ck.getData());
				});
			});
			ngModel.$render = function (value) {
				ck.setData(ngModel.$modelValue);
			};
		}
	};
}])

.directive('srdRadioQuestion', ['supportModel', function (supportModel) {
	var resourceUrl=$("a[id*='selfServiceResourcesUrl']").attr('href');
	return {
		restrict: 'AE',
		replace: true,
		scope: {
			data: '='
		},
		templateUrl: resourceUrl+'views/support/srd-questions/radio.html',
		link: function (scope, element) {
			
			scope.$watch('data.Value', function () {
				if(typeof(scope.data.isSRInput) != "undefined" && scope.data.isSRInput != null && scope.data.isSRInput == true){
					var srInputs = supportModel.srData.SRInputs;
					srInputs = supportModel.evaluateCondition(scope.data, srInputs, false);
					supportModel.srData.SRInputs = srInputs;
				}else if(supportModel.TicketOrRequest == 'Ticket'){
					supportModel.evaluateIncidentFldConditions(scope.data, supportModel.userModel.LayoutFldsandCriteria, supportModel.incident, false);
				}
			});
		}
	};
}])

.directive('srdMenuQuestion', ['supportModel', function (supportModel) {
	var resourceUrl=$("a[id*='selfServiceResourcesUrl']").attr('href');			
	return {
		restrict: 'AE',
		replace: true,
		scope: {
			data: '='
		},
		templateUrl: resourceUrl+'views/support/srd-questions/menu.html',
		link: function (scope, element) {
			if(scope.data.addNoneInPicklist && !scope.data.MultiSelect && typeof ( scope.data.Values ) != "undefined" && JSON.stringify(scope.data.Values).indexOf(selfServiceLabels.none) == -1){
				var noneValue = {
					"Value":'',
					"Text":selfServiceLabels.none
				}
				scope.data.Values.unshift(noneValue);
				if(!scope.data.Value || scope.data.Value.indexOf('null') > -1){
					scope.data.Value = '';
				}
			}
			scope.$watch('data.Value', function () {
				if(typeof(scope.data.isSRInput) != "undefined" && scope.data.isSRInput != null && scope.data.isSRInput == true){
					if(scope.data.Type == 'picklist' && scope.data.MultiSelect === true && (typeof scope.data.Value == 'undefined' || scope.data.Value == null)){
						scope.data.Value = [];		/*if question.Value is undefined in required multipicklist ,then all value was getting selected ,to avoid this initialised it with new array*/
					}  else if (scope.data.Type == 'picklist' && (typeof scope.data.Value == 'undefined' || scope.data.Value == null))  {
						scope.data.Value = '';	
					}
					var srInputs = supportModel.srData.SRInputs;
					srInputs = supportModel.evaluateCondition(scope.data, srInputs, false);
					supportModel.srData.SRInputs = srInputs;
				}else if(supportModel.TicketOrRequest == 'Ticket'){
					supportModel.evaluateIncidentFldConditions(scope.data, supportModel.userModel.LayoutFldsandCriteria, supportModel.incident, false);
				}
				if (scope.data.hasDependentPicklist) {
					supportModel.populateDependentField(scope.data);
				}
			});
			
		}
	};
}])

.directive('menuMultiSelect', function () {
	return {
		require: 'ngModel',
		link: function (scope, elem, attr, ngModel,ctrl) {
			ngModel.$parsers.push(function(value) {
				scope.CheckValidation(value);
				return value;
			  });

		  scope.CheckValidation = function(value){
			  if (scope.data.Validations && scope.data.Validations.MinValue ) {
				  if (value.length < scope.data.Validations.MinValue)
					ngModel.$setValidity('MinSel', false);
				else 
					ngModel.$setValidity('MinSel', true);
			}	
		}
	}
}})


.directive('srdCheckboxQuestion', ['supportModel', function (supportModel) {
	var resourceUrl=$("a[id*='selfServiceResourcesUrl']").attr('href');					
	return {
		restrict: 'AE',
		replace: true,
		scope: {
			data: '='
		},
		templateUrl: resourceUrl+'views/support/srd-questions/checkbox.html',
		link: function (scope, element) {
			
			scope.$watch('data.Value', function () {
				if(typeof(scope.data.isSRInput) != "undefined" && scope.data.isSRInput != null && scope.data.isSRInput == true){
					var srInputs = supportModel.srData.SRInputs;
					srInputs = supportModel.evaluateCondition(scope.data, srInputs, false);
					supportModel.srData.SRInputs = srInputs;
				} else {
					if (scope.data.hasDependentPicklist) {
						supportModel.populateDependentField(scope.data);
					}
				}
				if(supportModel.TicketOrRequest == 'Ticket'){
					supportModel.evaluateIncidentFldConditions(scope.data, supportModel.userModel.LayoutFldsandCriteria, supportModel.incident, false);
				}
			});
			
		}
	};
}])

.directive('srdNumberQuestion', ['$timeout','supportModel', function ($timeout,supportModel) {
	var resourceUrl=$("a[id*='selfServiceResourcesUrl']").attr('href');					
	return {
		restrict: 'AE',
		replace: true,
		scope: {
			data: '='
		},
		templateUrl: resourceUrl+'views/support/srd-questions/number.html',
		link: function (scope, element) {
			
			scope.enableLocale = supportModel.userModel.enableLocaleNumberFormat;
			
			scope.$watch('data.Value', function(newValue,oldValue) {
			
				if(typeof(scope.data.isSRInput) != "undefined" && scope.data.isSRInput != null && scope.data.isSRInput == true){
					var srInputs = supportModel.srData.SRInputs;
					srInputs = supportModel.evaluateCondition(scope.data, srInputs, false);
					supportModel.srData.SRInputs = srInputs;
				}else if(supportModel.TicketOrRequest == 'Ticket'){
					supportModel.evaluateIncidentFldConditions(scope.data, supportModel.userModel.LayoutFldsandCriteria, supportModel.incident, false);
				}
			});
		}
	};
}])

.directive('numberRange', ['$timeout','supportModel', function ($timeout,supportModel) {
	return{
	require: 'ngModel',
	priority: 200,
		link: function(scope, elem, attr, ngModel,ctrl) {
			ngModel.$parsers.push(function(value) {
				
				if(value < 0){
					ngModel.$setValidity('positiveValue', false);
				}else{
					ngModel.$setValidity('positiveValue', true);
					ngModel.$setValidity('min', true);
					ngModel.$setValidity('max', true);
					ngModel.$setValidity('minmax', true);
				}
				if(value > 0 || value === 0){
					if(scope.data.Validations && scope.data.Validations !== '' && scope.data.isVisible === true){
						if(scope.data.Validations.MinValue && !scope.data.Validations.MaxValue && (value !== undefined || value !== null)) {
							if(scope.data.Validations.MinValue > value){
								ngModel.$setValidity('min', false);
							}else{
								ngModel.$setValidity('min', true);
							}
						}else{
							ngModel.$setValidity('min', true);
						}
						if(scope.data.Validations.MaxValue && !scope.data.Validations.MinValue && (value !== undefined || value !== null)) {
							if(scope.data.Validations.MaxValue < value){
								ngModel.$setValidity('max', false);
							}else{
								ngModel.$setValidity('max', true);
							}
						}else{
							ngModel.$setValidity('max', true);
						}
						if(scope.data.Validations.MaxValue && scope.data.Validations.MinValue && (value !== undefined || value !== null)){
							if((value < scope.data.Validations.MinValue) || (value > scope.data.Validations.MaxValue)){
								ngModel.$setValidity('minmax', false);
							}else{
								ngModel.$setValidity('minmax', true);
							}
						}else{
							ngModel.$setValidity('minmax', true);
						}
					}
				}
				return value;
			  });
		}
	};
}])

.directive('srdDateQuestion', ['supportModel',function (supportModel) {
	var resourceUrl=$("a[id*='selfServiceResourcesUrl']").attr('href');					
	return {
		restrict: 'AE',
		replace: true,
		scope: {
			data: '='
		},
		templateUrl: resourceUrl+'views/support/srd-questions/date.html',
		link: function (scope) {
			
			scope.$watch('data.Value', function () {
				if(scope.data.dateFormat == undefined){
					supportModel.objectToDate(scope.data);
				}
				var delim=scope.data.dateFormat.indexOf('/')==-1?'-':'/';	
				if(scope.data.Value !== undefined && scope.data.Value != null && scope.data.Value != ''){
					var dateStr=supportModel.stringToDate(scope.data.Value,scope.data.dateFormat,delim);
					var dateSelected=new Date(moment(dateStr,'YYYY-MM-DD'));
					scope.data.DateObject = dateSelected;
					scope.data.yy=dateSelected.getFullYear();
					scope.data.MM=dateSelected.getMonth()+1;
					scope.data.dd=dateSelected.getDate();
				}
				if(typeof(scope.data.isSRInput) != "undefined" && scope.data.isSRInput != null && scope.data.isSRInput == true){
					var srInputs = supportModel.srData.SRInputs;
					srInputs = supportModel.evaluateCondition(scope.data, srInputs, false);
					supportModel.srData.SRInputs = srInputs;
				}else if(supportModel.TicketOrRequest == 'Ticket'){
					supportModel.evaluateIncidentFldConditions(scope.data, supportModel.userModel.LayoutFldsandCriteria, supportModel.incident, false);
				}
			});
		}
	};
}])

.directive('dateValid', ['$location', '$filter', 'supportModel', function ($location, $filter, supportModel) {
return{
	require: 'ngModel',
	
	link: function(scope, elem, attr, ngModel,ctrl) {
		scope.$watch('data.Value', function () {
			ngModel.$setValidity('ValidDate',true);
			if (scope.data.Value != undefined && scope.data.Value != '') {
				var userInputDate;
				
				var _format = scope.data.dateTimeFormat;	
				var _date = scope.data.Value;
				var _delimiter = _format.indexOf('/')==-1?'-':'/';
				var formatLowerCase;
				var timePartFormat;
				var timePart;
				var datePart;

				if (scope.data.Type.toLowerCase() == 'date') {
					formatLowerCase=scope.data.dateFormat.toLowerCase();
					datePart=_date;
					timePartFormat = "";
					timePart="";
				} else {
					formatLowerCase=_format.substr(0,_format.indexOf(' ')).toLowerCase();
					timePartFormat=_format.substr(_format.indexOf(' ')+1);
					datePart=_date.substr(0,_date.indexOf(' '));
					timePart=_date.substr(_date.indexOf(' ')+1);
				}
				var formatItems=formatLowerCase.split(_delimiter);
				var dateItems=datePart.split(_delimiter);					
				var monthIndex=formatItems.indexOf("mm");
				var dayIndex=formatItems.indexOf("dd");
				var yearIndex=formatItems.indexOf("yyyy");
				var month=parseInt(dateItems[monthIndex]);
				
				if (dateItems[yearIndex] == undefined || month == NaN || dateItems[dayIndex] == undefined) {
					ngModel.$setValidity('ValidDate',false);
					return;
				}
				var yearPart = dateItems[yearIndex] - supportModel.getThaiYearAdjustment();
				var formatedDate = yearPart + '-' + month + '-' + dateItems[dayIndex] + ' ' + timePart;
				var userInputDateMoment = moment(formatedDate,'YYYY-MM-DD '+timePartFormat);
				userInputDate = new Date(userInputDateMoment);
				  if(userInputDate == null || !userInputDateMoment.isValid()) {
					  ngModel.$setValidity('ValidDate',false);
					  return;
				  } else 
					  ngModel.$setValidity('ValidDate',true); 

				if (scope.data.isSRInput) {
					var parentDate;
					var isParent = false;
					var recToValiate;
					// scope.data.Value = scope.data.Value;
					if(typeof scope.data.Validations != 'undefined' || typeof scope.data.childToBeValidated != 'undefined'){
						if(scope.data.Validations){
							recToValiate = scope.data;
							scope.CheckValidation(recToValiate,parentDate,userInputDate,isParent,scope.data.Value);
						}
						if(typeof scope.data.childToBeValidated != 'undefined' && scope.data.childToBeValidated.length > 0){
							angular.forEach(scope.data.childToBeValidated, function(rec, key){
								recToValiate = supportModel.srData.SRInputs[rec];
								if (Object.prototype.toString.call(recToValiate.DateObject) === '[object Date]' && !isNaN(recToValiate.DateObject)) {
									parentDate = userInputDate;
									   userInputDate = new Date(recToValiate.DateObject);
									   isParent = true;
									   scope.CheckValidation(recToValiate, parentDate, userInputDate, isParent, scope.data.Value);
								}
							   });
						}
					}
				}
			}else{ 
				ngModel.$setValidity('smaller', true);
				ngModel.$setValidity('greater', true);
			}
		  });
		
		scope.dateValidate = function(givenDate, inputDate, operator, type){
			if (type == 'date') {
				givenDate = scope.getOnlyDate(givenDate);
				inputDate = scope.getOnlyDate(inputDate);
			}
			var result = "";
			switch(operator){
				case "&gt;":
				case ">":
					if(inputDate > givenDate){
						result = "";
					}else{
						console.log('error on current date is greater');
						result = "greaterthanRD";
					}
					break;
				case "&lt;":
				case "<":
					if(inputDate < givenDate){
						result = "";	
					}else{
						console.log('error on current date is smaller');
						result = "smallerthanRD";
					}
			}
			return result;
		};

		scope.getOnlyDate = function(refDate) {
			return new Date(refDate.getFullYear(), refDate.getMonth(), refDate.getDate());
		};

		scope.CheckValidation = function(recToValiate, parentDate, userInputDate, isParent, value){
			var isDateValidation='';
			var thaiYrAdjustment = supportModel.getThaiYearAdjustment();
			if(recToValiate.Validations && recToValiate.Validations!== '' && recToValiate.isVisible === true){
				switch (recToValiate.Validations.fieldId) {
					case "1":
						if(recToValiate.Validations.specificOrMoreDays && recToValiate.Validations.specificOrMoreDays!== ''){
							var tempDt = new Date();
							var offSet = tempDt.getTimezoneOffset() * 60000;
							parentDate = new Date(parseInt(recToValiate.Validations.specificOrMoreDays) + offSet);
							parentDate = parentDate.toString();
							parentDate = new Date(parentDate);
							isDateValidation = scope.dateValidate(parentDate, userInputDate, recToValiate.Validations.operator, recToValiate.Type);
						}
						break;
					case "2":
						parentDate = new Date(moment(recToValiate.currentTime,'YYYY-MM-DD HH:mm:ss'));                                
						var diff = Math.abs((new Date() - dateNow)/60000);
						parentDate.setMinutes(parentDate.getMinutes()+diff);
						if(recToValiate.Validations.specificOrMoreDays && recToValiate.Validations.specificOrMoreDays !== ''){
							parentDate = parentDate.getTime() + recToValiate.Validations.specificOrMoreDays * 86400000;
							var dateToString = new Date(parentDate).toString();
							parentDate = new Date(dateToString);	
						}
						isDateValidation = scope.dateValidate(parentDate, userInputDate, recToValiate.Validations.operator, recToValiate.Type);
						break;
						
					default:
						var parentRec = supportModel.srData.SRInputs[recToValiate.Validations.fieldId];
						if(parentRec.isVisible === true && Object.prototype.toString.call(parentRec.DateObject) === '[object Date]' && !isNaN(parentRec.DateObject)){
							if(typeof recToValiate.Validations.specificOrMoreDays != "undefined" && recToValiate.Validations.specificOrMoreDays !== ''){
								if(typeof(parentDate) == 'undefined')
									parentDate = parentRec.DateObject;
								parentDate = new Date(parentDate.getFullYear() - thaiYrAdjustment, parentDate.getMonth(), parentDate.getDate(), parentDate.getHours(), parentDate.getMinutes(), parentDate.getSeconds(), 0);
								parentDate = (parentDate === '' ? 0 : parentDate.getTime()) + recToValiate.Validations.specificOrMoreDays * 86400000;
								if(parentDate !== 0 && recToValiate.Value !== ''){
									var dateToStr = new Date(parentDate).toString();
									parentDate = new Date(dateToStr);	
									isDateValidation = scope.dateValidate(parentDate, userInputDate, recToValiate.Validations.operator, recToValiate.Type);
								}
							}else{
								if(typeof(parentDate) == 'undefined')
									parentDate = parentRec.DateObject;
								parentDate = new Date(parentDate.getFullYear() - thaiYrAdjustment, parentDate.getMonth(), parentDate.getDate(), parentDate.getHours(), parentDate.getMinutes(), parentDate.getSeconds(), 0);
								if(parentRec.Value !== '' && ((isParent && recToValiate.Value !== '') || (!isParent && value !== '')))
									isDateValidation = scope.dateValidate(parentDate, userInputDate, recToValiate.Validations.operator, recToValiate.Type);
							}
						}
				}
				if(isDateValidation !== ''){
					if(recToValiate.Type == 'date'){
						parentDate = new Date(parentDate.getFullYear() + thaiYrAdjustment, parentDate.getMonth(), parentDate.getDate());
						recToValiate.errorMsg = $filter('date')(parentDate, supportModel.userModel.dateFormat);	
					}else if(recToValiate.Type == 'date/time' && parentDate instanceof Date){
							parentDate = new Date(parentDate.getFullYear() + thaiYrAdjustment, parentDate.getMonth(), parentDate.getDate(), parentDate.getHours(), parentDate.getMinutes(), parentDate.getSeconds(), 0);
							recToValiate.errorMsg = $filter('date')(parentDate, supportModel.userModel.dateTimeFormat);
						}
					}else{
						recToValiate.errorMsg ='';
					}
					
					var element;
					if(isParent)											//if the parent evaluating child condition then we have to set child's validity though we are on parent field directive
						element = angular.element($('#'+recToValiate.Id+'')).data('$ngModelController');
					else
						element = ngModel;	
							
					if(isDateValidation === 'greaterthanRD' && (value !== undefined || value !== null)){
						element.$setValidity('greater', false);
					}else if(isDateValidation === 'smallerthanRD' && (value !== undefined || value !== null))	{
						element.$setValidity('smaller', false);
					}else{
						element.$setValidity('smaller', true);
						element.$setValidity('greater', true);
				}
			
				
			}	
		};
	}
};
}])


.directive('srdDateTimeQuestion', ['supportModel',function (supportModel) {
	var resourceUrl=$("a[id*='selfServiceResourcesUrl']").attr('href');
	return {
		restrict: 'AE',
		replace: true,
		scope: {
			data: '='
		},
		templateUrl: resourceUrl+'views/support/srd-questions/datetime.html',
		link: function (scope) {
			//if (typeof scope.data.affectedQuestionIds !== "undefined" && scope.data.affectedQuestionIds.length !== 0) {
				scope.$watch('data.Value', function (newVal, oldVal) {
					if(scope.data.dateFormat == undefined){
						supportModel.objectToDate(scope.data);
					}
					var delim=scope.data.dateFormat.indexOf('/')==-1?'-':'/';		
					if(scope.data.Value !== undefined && scope.data.Value != null && scope.data.Value != ''){
						var englishDate=scope.data.Value.replace('a.m.', 'AM').replace('p.m.','PM').replace('午前', 'AM').replace('vorm.', 'AM').replace('午後', 'PM').replace('nachm.', 'PM'); 
						var dateStr=supportModel.stringToDateTime(englishDate,scope.data.dateTimeFormat,delim);
						var dateSelected=new Date(moment(dateStr,'YYYY-MM-DD HH:mm:ss'));
						if(typeof(scope.data.isSRInput) != "undefined" && scope.data.isSRInput != null && scope.data.isSRInput == true){
							scope.data.DateObject = dateSelected;
						}
						scope.data.yy=dateSelected.getFullYear();
						scope.data.MM=dateSelected.getMonth()+1;
						scope.data.dd=dateSelected.getDate();
						scope.data.HH=dateSelected.getHours();
						scope.data.mm=dateSelected.getMinutes();
					} else if(scope.data.Value == '' && oldVal && oldVal != newVal) {
						var userDateTimeStr = supportModel.userModel.currentTime;
						if(userDateTimeStr) {
							var userDateTime = new Date(moment(userDateTimeStr, 'YYYY-MM-DD HH:mm:ss'))
							scope.data.HH = userDateTime.getHours();
							scope.data.mm = userDateTime.getMinutes();
						}
					}
					if(typeof(scope.data.isSRInput) != "undefined" && scope.data.isSRInput != null && scope.data.isSRInput == true){
						var srInputs = supportModel.srData.SRInputs;
						srInputs = supportModel.evaluateCondition(scope.data, srInputs, false);
						supportModel.srData.SRInputs = srInputs;
					}else if(supportModel.TicketOrRequest == 'Ticket'){
						supportModel.evaluateIncidentFldConditions(scope.data, supportModel.userModel.LayoutFldsandCriteria, supportModel.incident, false);
					}
					
				});
			}
	};
}])

.directive('smartSuggestions', ['supportModel','rkmDetailsService','srdCreateService','supportModel','incidentCreateService','broadcastDetailService', '$timeout', '$rootScope',function (supportModel,rkmDetailsService,srdCreateService,supportModel,incidentCreateService,broadcastDetailService, $timeout, $rootScope) {
	var resourceUrl=$("a[id*='selfServiceResourcesUrl']").attr('href');
	return {
		restrict: 'AE',
		replace: true,
		scope: {
			data: '='
		},
		templateUrl: resourceUrl+'views/support/smart-suggestions.html',
		link: function (scope) {
			scope.accordion = {
					current: null
			};
			scope.resourceUrl = $("a[id*='selfServiceResourcesUrl']").attr('href');					
			scope.listenerFields = {};
			scope.suggestionsHeader = selfServiceLabels.SelfServiceSmartSuggestions;
			scope.showKAFirst = isKAFirst?true:false;
			scope.showTMSRTogether = isIncSRTogether?true:false;
			var additionalParams = {'isFromSS':true,'isMore':true,'isKAFirst':true,'isTMSRTogether':true};
			var suggestionMetaData = {};
			scope.supportModel = supportModel;
			if(scope.data && scope.data.records && scope.data.records.length > 0){
				var rkmData = {};
				scope.ssResult = [];
				rkmData.name = 'KA';
				scope.accordion.current = 'KA';
				rkmData.Title = selfServiceLabels.SS_Articles;
				rkmData.size = scope.data.records.length
				rkmData.data = scope.data.records;
				scope.ssResult.push(rkmData);
			}
			
			scope.$on('openSmartSuggesetions', function(event, searchData) {
				if((typeof(searchData.isService) != "undefined" && searchData.isService) || 
						(typeof(searchData.isCategoryForSmartSuggestions) != "undefined" && searchData.isCategoryForSmartSuggestions)){
					scope.listenerFields[searchData.apiName+'_Name'] = searchData.Value;	
					scope.listenerFields[searchData.apiName] = searchData.fvalue;
				}else{
					scope.listenerFields[searchData.apiName] = searchData.Value;
				}
				if(supportModel.OnBehalfOf.fvalue){
					scope.listenerFields['requestedFor'] = supportModel.OnBehalfOf.fvalue;
				}
				scope.initSmartSuggestions();
			});
			
			scope.initSmartSuggestions = function() {
				suggestionMetaData = ssMetadata;
				if(typeof(suggestionMetaData) != 'undefined' && suggestionMetaData!=null)
					scope.getSuggestions(scope.listenerFields,'KA',suggestionMetaData);							
			}
			
			scope.calculateSelectedAccordianHeight = function(){
				var smartSuggestionsPaneHeight = $('#smart-suggestions-pane')[0].offsetHeight;
				var selectedAccordian = $('.selected-accordian');
				var numberOfModules = 0;
				if(scope.ssResult.length){
					numberOfModules = scope.ssResult.length;
				}
				if (selectedAccordian[0] && smartSuggestionsPaneHeight) {
					//height of each pane(KA, SRD, IN, TM) = 40px + 1px border
					//height of header pane (Smart Suggestions) = 48px + 1px border
					selectedAccordian[0].style.height = (smartSuggestionsPaneHeight - (numberOfModules*41+49)) +'px';
					selectedAccordian[0].style.maxHeight = (smartSuggestionsPaneHeight - (numberOfModules*41+49)) +'px';
				}
			}				
			
			scope.openAccordian = function(item) {
				if(item && item.size > 0)
					scope.accordion.current = item.name;
					$timeout(function () {
						scope.calculateSelectedAccordianHeight();
					}, 0, false);
			}
			
			scope.getSuggestions = function(listenerFields, module, suggestionMetaData){
				Visualforce.remoting.Manager.invokeAction(
					_RemotingActions.getSmartSuggestions,'KA',scope.listenerFields,additionalParams,suggestionMetaData,function(result, event){		
						if (event.status) {	
							var isSmartSuggestionsAvailable = false; 
							scope.ssResult = [];
							var recordCount=0;
							var TMSRModuleResult ={};  	//Used to store combined result of TM and SR when toghether
							var unOrderedResult = {};	//Stores unordered result 
							
							angular.forEach(result, function(objectList, objectkey){										
								var moduleResult = {};	
								var processedModuleItem = [];	
								objectRecords = objectList;
								
								//process is module and add title for accordion as objectkey
								if(scope.showTMSRTogether && (objectkey == 'TM' || objectkey == 'SRD')){
									moduleResult.Title = selfServiceLabels.srdResultsTitle;
								}else if(objectkey == 'KA'){
									moduleResult.name = objectkey;
									moduleResult.Title = selfServiceLabels.SS_Articles;
								}else if(objectkey == 'TM' && !scope.showTMSRTogether){
									moduleResult.name = objectkey;
									moduleResult.Title = selfServiceLabels.commonTickets;
								}else if(objectkey == 'SRD' && !scope.showTMSRTogether ){
									moduleResult.name = objectkey;
									moduleResult.Title = selfServiceLabels.srdResultsTitle;
								}else if(objectkey == 'BR'){
									moduleResult.name = objectkey;
									moduleResult.Title = selfServiceLabels.SSRightSidebarBroadcastsTitle;
								}
								moduleResult.size = objectList.length
								
								// set this as default open accordion on search result load
								if(scope.accordion.current== objectkey && moduleResult.size == 0)
									scope.accordion.current = null;
								
								//process each record from moduleresult
								angular.forEach(objectRecords, function(singleRecord, mapItemKey){
									isSmartSuggestionsAvailable = true;
									var moduleData ={};
									moduleData.Id = singleRecord.Id;
									moduleData.Name = supportModel.htmlUnescape(singleRecord.Name);
									angular.forEach(singleRecord, function(recordValue, recordKey){
										if(objectkey == 'KA'){
											if(recordKey==(namespace+'Title__c')){
												moduleData.Title = supportModel.htmlUnescape(supportModel.htmlUnescape(recordValue));
											}
											if(recordKey==(namespace+'Article_Type__c')){
												moduleData.ArticleType = recordValue;
											}
										}
										
										if(scope.showTMSRTogether){													
											if(objectkey == 'TM'){
												moduleData.ItemType = 'TM';
												if(recordKey==(namespace+'description__c')){
													moduleData.Description=supportModel.htmlUnescape(recordValue);								
												}														
											}
											if(objectkey == 'SRD'){
												moduleData.ItemType = 'SRD';
												if(recordKey==(namespace+'Description__c')){
													moduleData.Description = supportModel.htmlUnescape(recordValue);							
												}			
												if(recordKey==(namespace+'Image__c')){
													moduleData.image = getSFDocumentURL('',recordValue);
												}
												if(recordKey=='Name'){
													//Double decoding is done because there is double encoding of Name field one is at server side and another one is because of escape true in remote call.
													moduleData.Name = supportModel.htmlUnescape(supportModel.htmlUnescape(recordValue));
												}
											}													
										}else{
											if(!scope.showTMSRTogether){
												if(objectkey == 'TM'){
													if(recordKey==(namespace+'description__c')){
														moduleData.Description=supportModel.htmlUnescape(recordValue);
													}
												}
												if(objectkey == 'SRD'){
													if(recordKey==(namespace+'Description__c')){
														moduleData.Description = supportModel.htmlUnescape(recordValue);
													}
													if(recordKey==(namespace+'Image__c')){
														moduleData.image = getSFDocumentURL('',recordValue);
													}
													if(recordKey=='Name'){
														moduleData.Name = supportModel.htmlUnescape(supportModel.htmlUnescape(recordValue));
													}
												}
											}
										}
										
										if(objectkey == 'BR'){
											if(recordKey==(namespace+'broadcastMessage__c')){
												moduleData.Description = supportModel.htmlUnescape(recordValue);
											}
											if(recordKey==(namespace+'Priority_ID__c')){
												moduleData.Priority = supportModel.htmlUnescape(recordValue);
											}
										}												
									});
									processedModuleItem.push(moduleData);												
								});	
								
								moduleResult.data = processedModuleItem;
								
								//process TM and SRD result
								if(scope.showTMSRTogether && (objectkey == 'TM' || objectkey == 'SRD')){
									if(TMSRModuleResult.data!=undefined){
										//when TMSRModuleResult is not undefined means we have data for SRD/TM
										var srR = TMSRModuleResult.data;
										angular.forEach(processedModuleItem, function(srRecord, mapItemKey){
											if(TMSRModuleResult.data.length < 15 && recordCount <15){
												srR.push(srRecord);
												recordCount = recordCount + 1;
											}													
										});												
										TMSRModuleResult.data = srR;
									}else{
										TMSRModuleResult.data = processedModuleItem;
									}											
									
								}else{
									if(!scope.showTMSRTogether || objectkey == 'KA' || objectkey=='BR'){												
										if(objectkey == 'KA'){
											unOrderedResult.KA = moduleResult;
										}else if(objectkey == 'SRD'){
											unOrderedResult.SRD = moduleResult;
										}else if(objectkey == 'TM'){
											unOrderedResult.TM = moduleResult;
										}else if(objectkey == 'BR'){
											unOrderedResult.BR = moduleResult;
										}
									}
									
								}
								
							});
							
							//add processed TM-SRD result to display result map
							if(scope.showTMSRTogether && TMSRModuleResult.data!=undefined){
								var srModuleResult = {};
								srModuleResult.name = 'TMSR';
								srModuleResult.size = TMSRModuleResult.data.length;
								srModuleResult.Title = selfServiceLabels.srdResultsTitle;
								srModuleResult.data = TMSRModuleResult.data;
								unOrderedResult.TMSR = srModuleResult;
								if (scope.accordion.current == 'TMSR' && srModuleResult.size == 0) {
									scope.accordion.current = null;
								}
							}
							
							// Add record to this ordered result which is used to display data in suggestions pane
							if(scope.showKAFirst){
								//If KA is first add KA data to ordered map
								if(unOrderedResult.KA != undefined){
									scope.ssResult.push(unOrderedResult.KA);
								}	
								if(scope.showTMSRTogether){
									if(unOrderedResult.TMSR != undefined){
										scope.ssResult.push(unOrderedResult.TMSR);
									}										
								}else{												
									if(unOrderedResult.TM != undefined){
										scope.ssResult.push(unOrderedResult.TM);
									}
									if(unOrderedResult.SRD != undefined){
										scope.ssResult.push(unOrderedResult.SRD);
									}	
								}										
							}else{
								if(scope.showTMSRTogether){
									if(unOrderedResult.TMSR != undefined){
										scope.ssResult.push(unOrderedResult.TMSR);
									}										
								}else{												
									if(unOrderedResult.TM != undefined){
										scope.ssResult.push(unOrderedResult.TM);
									}
									if(unOrderedResult.SRD != undefined){
										scope.ssResult.push(unOrderedResult.SRD);
									}	
								}
								if(unOrderedResult.KA != undefined){
									scope.ssResult.push(unOrderedResult.KA);
								}										
							}
							if(unOrderedResult.BR != undefined){
								scope.ssResult.push(unOrderedResult.BR);
							}

							angular.forEach(scope.ssResult, function(module) {
								if(scope.accordion.current==null && module.size > 0)	 {
									scope.accordion.current = module.name;
								}
							})
							
							if(!scope.supportModel.smartSuggestionsData.isSuggestionsOpen && isSmartSuggestionsAvailable){
								scope.supportModel.smartSuggestionsData.isSuggestionsOpen = true;
								var element = angular.element('#smart-suggestions-pane');
								if(element)
									(element).toggleClass('toggle-smart-suggestions');
							}
								
							scope.supportModel.smartSuggestionsData.isDataLoading = false;					
							$timeout(function () {
								scope.calculateSelectedAccordianHeight();								
							}, 0,false);
							scope.$apply();
						}else{
							console.log('There is some issue in remote call');
						}																	
					});
				}
				
			//function to open individual record from suggestions pane
			scope.openItem = function(item, itemType, dataItems){
				if(itemType == 'KA'){
					var additionalInfo = {};
					var rkmModalInstance;
					additionalInfo.parentModelInstance = incidentCreateService.modalInstance;					
					additionalInfo.rkmRecords = dataItems;
					//if KA opening from smartsuggestions on RKM modal then rerender the iframe else open new modal for rkm
					if(scope.data && scope.data.modalInstance) {					
						$rootScope.reRenderRKMiFrame(item.Id);
					} else {
						rkmModalInstance = rkmDetailsService.showDialog(item.Id, additionalInfo);
					}

					//this is rkm modal callback funtion and get called when we dismiss the modal. This function will only be called when we open KA from smartsuggestions
					rkmModalInstance.result.then(
						//Please do not delete empty function as this to maintain order of close and dismiss event of modal. First function for to close event and second funtion for modal dismiss
						function(result) {
							//function call when close event occure in rkm Modal
						},
						function(result) {
							//function call when dismiss event occure in rkm Modal
							angular.element('.toggle-incident-modal-window').css('display', 'block');
						}
					);
				}
				
				if(itemType == 'SRD'){		
					var srd = {};
					srd.displayType = 'regular';
					srd.externalId = item.Id;
					srd.description = item.Description;
					srd.isLoading = false;
					srd.id = item.Id;							
					srd.label = item.Name;
					srd.serviceRequestDefinitionId = item.Id;
					srd.sourceType ='srm'
					if(incidentCreateService.modalInstance)
						incidentCreateService.modalInstance.dismiss();
					srdCreateService.showSupportSrdCreateDialog(srd);
				}
				
				if(itemType == 'TM'){
					if(incidentCreateService.modalInstance)
						incidentCreateService.modalInstance.dismiss();
					incidentCreateService.showSupportSrdCreateDialog(item.Id);
				}
				
				if(itemType == 'BR'){
					var recListData = [];
					var additionalInfo = {};
					angular.forEach(dataItems,function(broadcast){
						var recData = {
								broadcastMessage__c : broadcast.Description,
								id : broadcast.Id,
								Priority_ID__c:broadcast.Priority
						}; 
						recListData.push(recData);
					});
	
					additionalInfo.parentModelInstance = incidentCreateService.modalInstance;
					additionalInfo.selecteBrId = item.Id;
					broadcastDetailService.showBroadcastDialog(recListData, additionalInfo);
				}
			}
			
			scope.closeSuggestions = function(){
				if($('#rkm-smart-suggestions-pane'))
					$('#rkm-smart-suggestions-pane').hide();
				if($('#smart-suggestions-pane') && !scope.data)
				$('#smart-suggestions-pane').hide();
			}
				
		}
	};
}])
.directive('srdAttachments', ['attachmentService','srdCreateService','errorDialogService', '$uibModal', '$filter','supportModel',
	function (attachmentService, srdCreateService, errorDialogService, $uibModal, $filter,supportModel) {
		var resourceUrl=$("a[id*='selfServiceResourcesUrl']").attr('href');
		return {
			restrict: 'AE',
			replace: true,
			scope: {
				data: '='
			},
			templateUrl: resourceUrl+'views/support/srd-questions/attachments.html',
			link: function (scope, el, attrs) {
				scope.data.isDraft = supportModel.isDraft; 
				//scope.maxAttachments = attrs.maxAttachments;
				if(lightningModule){
					scope.srColumnLayoutForSS3 = false;	
				}else if(supportModel.TicketOrRequest == 'Request'){
					scope.srColumnLayoutForSS3 = srColumnLayoutForSS3Val == 2; 
				}else{
					scope.srColumnLayoutForSS3 = false;
				}						
				el.bind('change', function (event) {
					scope.data.addingAttachment = true;
					var fileInput = el.find('input:file')[0];

					if (event.target.files && typeof event.target.files !== "string") {
						for (var i = 0; i < event.target.files.length; i++) {
							var fileObject = event.target.files[i];
							fileObject.fileInput = fileInput;
							processFile(fileObject);
						}
						el.val('');
					} else {
						// we're on outdated browser (ie8, ie9)
						if (event.target.type === 'file' && event.target.value) {
							var fileVO = {};
							var filePath = event.target.value;

							// check file size if possible
							try {
								var myFSO = new ActiveXObject("Scripting.FileSystemObject");
								var file = myFSO.getFile(filePath);
								fileVO.name = file.Name;
								fileVO.size = file.Size;
							} catch (error) {
								// ActiveX is disabled, ignoring size check on client
								fileVO.size = 0;
								// Determine filename by ourselves
								fileVO.name = filePath.replace(/^.*[\\\/]/, '');
							}

							fileVO.fileInput = fileInput;
							processFile(fileVO);
						}
					}
					scope.$apply();
					scope.data.addingAttachment = false;
				});


				// IE9 should not emulate click on file input, otherwise it would not work
				if (!($.browser.msie && parseInt($.browser.version, 10) < 10)) {
					// used jQuery way because of Angular $apply error
					el.find('.srd-new-attachment-button').on('click', function () {
						el.find('.srd-new-attachment__hidden-file-input').eq(0).click();
					});
				}
				scope.htmlUnescape = function( str){
					return supportModel.htmlUnescape(str);
				}

				scope.showConfirmationDialog = function(options, attachment) {
					var resourceUrl=$("a[id*='selfServiceResourcesUrl']").attr('href');
					return $uibModal.open({
						templateUrl: resourceUrl+'views/common/confirmation-dialog.html',
						ariaLabelledBy:'modal-header__title',
						ariaDescribedBy: 'modal-header__text',
						controller: ['$scope', '$uibModalInstance', function ($scope, $uibModalInstance) {
							$scope.title = options.title;
							$scope.titleI18nKey = options.titleI18nKey;
							$scope.text = options.text;
							$scope.textI18nKey = options.textI18nKey;
							  
							$scope.confirm = function () {
								scope.data.attachments = _(scope.data.attachments).without(attachment);
								if (supportModel.requestDetailId && supportModel.isDraft) {
									if(isFileEnabled)
										supportModel.delAttachment(attachment.contentDocumentId);
									else
										supportModel.delAttachment(attachment.Id);
								}
								$uibModalInstance.close();
							}
							$scope.dismiss = function () {
								$uibModalInstance.dismiss();								
							}
						}]
					});
				};
				
				scope.removeAttachment = function (attachment) {
						scope.showConfirmationDialog({
								title: selfServiceLabels.deleteAttachment,
								titleI18nKey: 'support.sr.reopen.errorHeader',
								text: selfServiceLabels.deleteAttachmentMsg,
								functionType: ''
							},attachment);
				};

				scope.addAttachment = function(allowFile, file) {
					if (allowFile) {
						if (scope.data.hideList || supportModel.isDraft) {
							if (supportModel.tempAttachmentId && supportModel.isDraft)
								scope.data.srId = supportModel.tempAttachmentId;

							var attachment = file;
							if (isFileEnabled) {
								var contentDocumentId;
								client.createBlob('ContentVersion', {
										PathOnClient: attachment.name,
										Title: attachment.name
									}, attachment.name, 'VersionData', attachment,
									function(result, source) {
										var versionRecord = sforce.connection.query("SELECT id, ContentDocumentId FROM ContentVersion WHERE Id ='" + result.id + "' LIMIT 1");
										var records = versionRecord.getArray("records");
										var documentLink = new sforce.SObject('ContentDocumentLink');
										contentDocumentId = records[0].ContentDocumentId;
										documentLink.ContentDocumentId = contentDocumentId;
										documentLink.LinkedEntityId = scope.data.srId;
										documentLink.ShareType = 'V';
										sforce.connection.create([documentLink], {
											onSuccess: function(result, source) {
												if (result[0].getBoolean("success")) {
													result[0].contentDocumentId = contentDocumentId;
													if(scope.data.isTicket){
														scope.$emit("addAttachment", scope.data.srId);
													}else{
														Visualforce.remoting.Manager.invokeAction(_RemotingActions.getAttachmentlist, scope.data.srId, null, function(result, event) {
															if (event.status) {
																scope.data.attachments = result;
																for(var i=0; i<scope.data.attachments.length;i++){
																	var tempAttachment = scope.data.attachments[i];
																	tempAttachment.iconClass = supportModel.getFileGenericIconClass(tempAttachment.Name);
																}
															}
															scope.data.addingAttachment = false;
														});
													}
												} else {
													errorDialogService.showDialog({
														title: selfServiceLabels.Error,
														titleI18nKey: 'support.srd.attachments.maxSizeError.title',
														text: selfServiceLabels.attachmentUploadError
													});
													scope.data.addingAttachment = false;
												}
											},
											onFailure: function(error, source) {
												console.log(error);
												errorDialogService.showDialog({
													title: selfServiceLabels.Error,
													titleI18nKey: 'support.srd.attachments.maxSizeError.title',
													text: selfServiceLabels.attachmentUploadError
												});
												scope.data.addingAttachment = false;
											}
										});
									},
									function(error, source) {
										var msg = (error && error.response) ? JSON.parse(error.response) : '';
										var errMsg = (msg && msg[0] && msg[0].message) ? msg[0].message : '';
										
										errorDialogService.showDialog({
											title: selfServiceLabels.Error,
											titleI18nKey: 'support.srd.attachments.maxSizeError.title',
											text: errMsg ? errMsg : selfServiceLabels.attachmentUploadError
										});
										scope.data.addingAttachment = false;
									}
								);
							} else {
								client.createBlob('Attachment', {
										Name: attachment.name,
										ContentType: attachment.type,
										ParentId: scope.data.srId
									}, attachment.name, 'Body', attachment,
									function(result, source) {
										if (result.success == true) {
											if(scope.data.isTicket){
												scope.$emit("addAttachment", scope.data.srId);
											}else{
												Visualforce.remoting.Manager.invokeAction(_RemotingActions.getAttachmentlist, scope.data.srId, null, function(result, event) {
													if (event.status) {
														scope.data.attachments = result;
														for(var i=0; i<scope.data.attachments.length;i++){
															var tempAttachment = scope.data.attachments[i];
															tempAttachment.iconClass = supportModel.getFileGenericIconClass(tempAttachment.Name);
														}
													}
													scope.data.addingAttachment = false;
												});
											}
										} else {
											errorDialogService.showDialog({
												title: selfServiceLabels.Error,
												titleI18nKey: 'support.srd.attachments.maxSizeError.title',
												text: selfServiceLabels.attachmentUploadError
											});
											scope.data.addingAttachment = false;
										}
									},
									function(error, source) {
										var msg = (error && error.response) ? JSON.parse(error.response) : '';
										var errMsg = (msg && msg[0] && msg[0].message) ? msg[0].message : '';

										errorDialogService.showDialog({
											title: selfServiceLabels.Error,
											titleI18nKey: 'support.srd.attachments.maxSizeError.title',
											text: errMsg ? errMsg : selfServiceLabels.attachmentUploadError
										});
										scope.data.addingAttachment = false;
									}
								);
							}
						} else {
							file.iconClass = supportModel.getFileGenericIconClass(file.name);
							scope.data.attachments.push(file);
						}
					} else {
						scope.data.addingAttachment = false;
					}

				};

				var processFile = function (file) {
					var
						allowFile;
						allowFile=true;
						var maxSize = isFileEnabled ? fileLimit : attachmentLimit;
						maxNameLength = 80;

					var ext = file.name.match(/\.([^\.]*)$/);
					//allowFile = ext && attachmentService.blockedFileFormats.indexOf(ext[1]) === -1;

					if (!allowFile) {
						errorDialogService.showDialog({
							title:selfServiceLabels.Error,
							titleI18nKey: 'support.srd.attachments.maxSizeError.title',
							textI18nKey: 'support.srd.attachments.blockedFormatError'
						});
					} else if (maxSize && file.size > maxSize) {
						allowFile = false;
						errorDialogService.showDialog({
							title:selfServiceLabels.Error,
							titleI18nKey: 'support.srd.attachments.maxSizeError.title',
							text: isFileEnabled ? selfServiceLabels.fileLimit : selfServiceLabels.attachmentLimit
						});
					} else if (ext.index > maxNameLength) {
						allowFile = false;
						errorDialogService.showDialog({
							title:selfServiceLabels.Error,
							titleI18nKey: 'support.srd.attachments.maxSizeError.title',
							text: selfServiceLabels.fileNameLengthValidationMsg
						});
					}else if(file && file.size <= 0){
						allowFile = false;
						errorDialogService.showDialog({
							title:selfServiceLabels.Error,
							titleI18nKey: 'support.srd.attachments.maxSizeError.title',
							text: selfServiceLabels.FileLengthZeroKB
						});
					}
				if(file.fileInput) {
					var ele = file.fileInput.cloneNode();
					ele.value = null;
					angular.element(file.fileInput)
						.before(ele)
						.hide();
					if(!supportModel.tempAttachmentId && supportModel.isDraft){
						supportModel.CreateTempAttachment().then(function(result){
							 scope.addAttachment(allowFile,file);
						});
					}
					
				}
				if(supportModel.tempAttachmentId || !supportModel.isDraft){
					if(!supportModel.tempAttachmentId){
						supportModel.CreateTempAttachment().then(function(result){
							scope.addAttachment(allowFile,file);
					   });
					}else				
						scope.addAttachment(allowFile,file);        
				}
				};
			}
		};
	}
])


.directive('checkFormValidity', function () {
	// hack for input[type="number"] (srdQuestionNumber) under Chrome,
	// which does not consider non-numeric input to be invalid
	var resourceUrl=$("a[id*='selfServiceResourcesUrl']").attr('href');
	return {
		require: 'ngModel',
		priority: 500,
		link: function ($scope, $element, $attrs, modelCtrl) {
			if (typeof $element.prop('validity') === 'undefined') {
				return;
			}

			$element.bind('input', function () {
				var validity = $element.prop('validity');
				$scope.$apply(function () {
					modelCtrl.$setValidity('badInput', !validity.badInput);
				});
			});
		}
	};
})

.directive('srdOnBehalfOfQuestion', ['$log', '$document', '$timeout','supportService', 'supportModel', 'userModel', function ($log, $document, $timeout,supportService, supportModel, userModel) {
	var resourceUrl=$("a[id*='selfServiceResourcesUrl']").attr('href');
	var lastSelectedIndex = -1;
	return {
		restrict: 'E',
		replace: true,
		scope: {
			requestedFor: '=',
			onBehalfOfEnabled: '='
		},
		templateUrl: resourceUrl+'views/support/srd-questions/on-behalf.html',
		link: function (scope, element) {
			if(lightningModule){
					scope.srColumnLayoutForSS3 = false;	
			}else if(supportModel.TicketOrRequest == 'Request'){
					scope.srColumnLayoutForSS3 = srColumnLayoutForSS3Val == 2; 
			}else{
				scope.srColumnLayoutForSS3 = false;
			}
			scope.isAccessibilityMode = isAccessibilityMode;
			scope.userModel = userModel;
			scope.userId = scope.userModel.userId;
			scope.selfRequesedFor = scope.requestedFor;
			scope.selectedRow = 0;
			scope.showLabelsInDefaultLookupView = showLabelsInDefaultLookupView;
			scope.showLabelsInExpandedLookupView = showLabelsInExpandedLookupView;
			scope.fireBlurEvent = true;
			if(typeof(scope.selfRequesedFor) != 'undefined' && typeof(scope.selfRequesedFor.userName) != 'undefined' && scope.selfRequesedFor.userName != null && scope.selfRequesedFor.userName != ''){
				scope.userName = scope.selfRequesedFor.userName;
			}
			
			scope.$watch('userModel.isOnBehalfOfEnabled', function(){
				if(scope.userModel != undefined && scope.userModel.isOnBehalfOfEnabled != undefined && scope.onBehalfOfEnabled == undefined)
				scope.onBehalfOfEnabled = scope.userModel.isOnBehalfOfEnabled;
				if(!scope.onBehalfOfEnabled) {
					angular.element('.srd-question-on-behalf').css('margin', '4px');
				}
			})
			scope.$watch('usersSearchText', function (val) {
				if(scope.onBehalfOfEnabled){
					scope.searchResultsAreLoading = true;
					searchUsersDebounced();
				}	
				 else {
					scope.searchResults = null;
				}
			});

			scope.$watchGroup(['$parent.supportModel.clientId', 'searchResults'], function(){
				if(supportModel.isDraft && supportModel.clientId && scope.searchResults && !scope.editMode
				&& supportModel.OnBehalfOf && supportModel.OnBehalfOf.fvalue=='') {
					
					var sFields={email: supportModel.clientEmail, username: supportModel.clientUsername};
					var selectedClient={itemId:supportModel.clientId, itemName:supportModel.clientName,
						extraInfo:supportModel.clientUsername,specificFields:sFields};
					scope.selectOptionVal(selectedClient);									
					
				}
			});

			scope.$watch('editMode', function (val) {
				if (val === true) {
					element
						.find('.srd-question-on-behalf-search-field')
						.focus();
                    if(isAccessibilityMode)
						searchUsersDebounced();
				}
			});

				
			scope.enterEditMode = function () {
				scope.editMode = true;
				scope.isOnBehalfOfEditLinkVisible = false;
			};
			$document.on('click', function (e) {
				var currentElement = angular.element('#srd-question-on-behalf-search');
				if (currentElement && currentElement[0] && currentElement !== e.target && !currentElement[0].contains(e.target) && scope.isOnBehalfOfEditLinkVisible) {
					scope.$apply(function () {
						scope.editMode = false;
						scope.isOnBehalfOfEditLinkVisible = false;
					});
				} else if(currentElement && currentElement[0]) {
					scope.isOnBehalfOfEditLinkVisible = true;
				}
			})
			scope.leaveEditMode = function () {
				scope.editMode = false;
				scope.usersSearchText = '';
			};

			scope.selectOptionVal = function (person) {
				scope.userName = person.itemName;
				scope.requestedFor = {
					userId: person.itemId,
					userName: scope.userName,
					phone: person.specificFields['phone'],
					email: person.specificFields['email']
				};
				supportModel.OnBehalfOf.fvalue = person.itemId;
				supportModel.OnBehalfOf.fPhone = person.specificFields['phone'];
				supportModel.OnBehalfOf.fEmail = person.specificFields['email'];
				supportModel.OnBehalfOf.fRefFieldVal = scope.userName;
				supportModel.smartSuggestions(scope.requestedFor);
				scope.leaveEditMode();
				if(!supportModel.isDraftFormLoading){
					supportService.getDefaultValuesForUser(person.itemId, supportModel.srData.currentSRDId)
					.then(function (data) {
						for(var i=0; i<data.length; i++){
							if(supportModel.srData.SRInputs[data[i].Id]){
								supportModel.srData.SRInputs[data[i].Id].DefaultValueTxt = data[i][namespace+'DefaultValue__c'];
									supportModel.srData.SRInputs[data[i].Id].Value =supportModel.decodeText(data[i][namespace+'DefaultValue__c']);
							}
						}
					});
				}
				supportModel.isDraftFormLoading=false;
				
			};

			scope.resetUserSelection = function () {
				if(supportModel.TicketOrRequest == 'Request'){
					scope.requestedFor = scope.selfRequesedFor;
					supportModel.OnBehalfOf.fvalue = scope.requestedFor.userId;
					supportModel.OnBehalfOf.fPhone = scope.requestedFor.phone;
					supportModel.OnBehalfOf.fEmail = scope.requestedFor.email;
					supportModel.OnBehalfOf.fRefFieldVal = "";
					supportService.getDefaultValuesForUser(scope.requestedFor.userId, supportModel.srData.currentSRDId)
					.then(function (data) {
						for(var i=0; i<data.length; i++){
							if(supportModel.srData.SRInputs[data[i].Id]){
								supportModel.srData.SRInputs[data[i].Id].DefaultValueTxt = data[i][namespace+'DefaultValue__c'];
								supportModel.srData.SRInputs[data[i].Id].Value = supportModel.decodeText(data[i][namespace+'DefaultValue__c']);
							}
						}
					});
				}else if(supportModel.TicketOrRequest == 'Ticket'){
					scope.requestedFor = scope.selfRequesedFor;
					supportModel.OnBehalfOf.fvalue = "";
					supportModel.smartSuggestions(scope.requestedFor);
				}
				
			};

			scope.enterFieldsEditMode = function () {
				scope.savedRequestedFor = angular.copy(scope.requestedFor);
				scope.fieldsEditMode = true;
			};

			scope.leaveFieldsEditMode = function () {
				scope.fieldsEditMode = false;
			};

			scope.cancelFieldsEdit = function () {
				scope.requestedFor = scope.savedRequestedFor;
				scope.leaveFieldsEditMode();
			};

			var searchUsersDebounced = _.debounce(function () {
				supportService.searchOnBehalfUsers(scope.usersSearchText)
					.then(function (data) {
						scope.searchResults = [];
						if (data && angular.isArray(data)) {
							scope.searchResults = scope.searchResults.concat(data);
						}
					})
					['finally'](function () {
						scope.searchResultsAreLoading = false;
					});
			}, 250);
			
			scope.clearData = function(event){
				if(isAccessibilityMode && event == 'lookupblur')
					return;
				
				if(isAccessibilityMode)
					scope.searchResults = [];
				$timeout(function () {
					if(scope.fireBlurEvent == true){
						scope.editMode = false;		
					}
				}, 100);
			}
			
			scope.getMoreFields = function (index, recordId){
				supportService.searchOnBehalfUsers(scope.usersSearchText,recordId)
					.then(function (data) {
						if (data && angular.isArray(data)) {
							scope.searchResults[index].extraInfoList = data[0].extraInfoList;
							scope.searchResults[index].showMore=false;
						}
					})
					['finally'](function () {
						if(isAccessibilityMode && index == 0)
							$('#onBehalfOf__input').focus();
						scope.searchResults[index].resultsAreLoading = false;
					});
			}
			scope.expandLookupData = function(optionVal,index){
				
				scope.searchResults[index].isShowMoreAvailable = true;
				if(typeof optionVal.extraInfoList == 'undefined' || optionVal.extraInfoList.length == 0){ 
					scope.searchResults[index].resultsAreLoading = true;
					scope.getMoreFields(index,optionVal.itemId);
				}else{
					scope.searchResults[index].showMore=false;
				}
				var lastCollapsedDivHeight = 0;
				//collapse the previously opened item
				if(!isAccessibilityMode && (lastSelectedIndex != -1 && lastSelectedIndex != index)){
					scope.searchResults[lastSelectedIndex].showMore=true;
					lastCollapsedDivHeight = $(element).find('#outerDiv-'+lastSelectedIndex).height();
				}
				lastSelectedIndex = index;
				
				var scrollTo = $(element).find('#outerDiv-'+index);
				var container = scrollTo.closest('.srd-question-reference-container');
			   if(!isAccessibilityMode) {
					$(container).animate({
						scrollTop: scrollTo.offset().top - container.offset().top + container.scrollTop() - lastCollapsedDivHeight
					}, 'fast');
				}
							
			}
			scope.collapseLookupData = function(itemId,index){
				scope.searchResults[index].showMore=true;
			}
			scope.selectRow = function(index){
				scope.selectedRow = index;
			}
			scope.getNumber = function(num) {
				return new Array(num);   
			}
			scope.htmlUnescape = function(str){
				return supportModel.decodeText(str);
			}
			scope.decodeText = function(str){
				return supportModel.decodeText(str);
			}
		}
	};
}])

.directive('browseCategory', ['supportModel','supportService','$filter', function (supportModel, supportService, $filter) {
    var resourceUrl=$("a[id*='selfServiceResourcesUrl']").attr('href');
    return {
        restrict: 'E',
        scope: {
			categoryItemData: '=',
			indexId: '=',
			isLastNode: '='
        },
        templateUrl: resourceUrl+'views/support/browse-categories.html',
        link: function(scope, element) {

			scope.isAccessibilityMode = isAccessibilityMode;
			var scrolling = false;
			scope.scrollUpOver = function(){
				scrolling = true;
				var parentId = scope.isLastNode ? 'thirdLevelCategoryId' : 'secondLevelCategoryId';
				scrollCategoryContent("up",parentId);
			};
			
			scope.scrollUpOut = function(){
				scrolling = false;
			};
			
			scope.scrollDownOver = function(){
				scrolling = true;
				var parentId = scope.isLastNode ? 'thirdLevelCategoryId' : 'secondLevelCategoryId';
				scrollCategoryContent("down",parentId);
			};
			
			scope.scrollDownOut = function(){
				scrolling = false;
			};

			function scrollCategoryContent(direction, parentId) {
				var amount = (direction === "up" ? "-=15px" : "+=15px");
				$("#"+parentId).animate({
					scrollTop: amount
				}, 1, function() {
					if (scrolling) {
						scrollCategoryContent(direction, parentId);
					}
					
					var contentPosition = $('#'+parentId).scrollTop();
					scope.categoryItemData.data.childUpScrollAvailable = (contentPosition == 0) ? false : true;
					
					var lastElementList = $('#'+parentId+' div:last');
					var lastDivId = scope.isLastNode ? 'scrollThirdChildEndDiv' : 'scrollSecondChildEndDiv';
					var lastDiv = $('#'+lastDivId);
					if(lastElementList && lastElementList.offset() && lastElementList.offset().top && lastDiv && lastDiv.offset() && lastDiv.offset().top){
						if(lastElementList.offset().top > lastDiv.offset().top){
							scope.categoryItemData.data.childDownScrollAvailable = true;
						}else{
							scope.categoryItemData.data.childDownScrollAvailable = false;
						}
					}
				});
			}
			
			scope.decodeCategory = function(categoryName){
				return supportModel.decodeText(categoryName);
			};

			scope.getCategoryDivClass = function(item){
				if(isAccessibilityMode && item.hasErrorMsg){
					return 'category-dropdown-nav categoryDivFocus browseCategoryErrorDivClass';
				}else if(isAccessibilityMode){
					return 'category-dropdown-nav categoryDivFocus';
				}else if(item.hasErrorMsg){
					return 'category-dropdown-nav browseCategoryErrorDivClass';
				}else{
					return 'category-dropdown-nav';
				}
			};
			
			scope.getCategoryTextClass = function(item){
				if(item.hasErrorMsg){
					return 'browseCategoryTextClass browseCategoryErrorClass';
				}else if(item.hovering){
					return 'browseCategoryTextClass browseCategoryhoverClass';
				}else{
					return 'browseCategoryTextClass';
				}
			};

            scope.handleCategoryEnter = function(event, item, childrenData){
				for(var i=0; i<childrenData.length; i++){
					childrenData[i].hovering=false;
				}
				item.hovering=true;
				if(item.id && !scope.isLastNode){
                    scope.lastCategory = item.id;
					scope.rect=event.target.getBoundingClientRect();
                    supportModel.browseCategoryHash={};
					supportModel.getBrowseCategories(item.id, item.parentCategory).then(function(){
                        if(item.id == scope.lastCategory){
                            item.subCategories=[];
                            item.subCategories = _.filter(supportModel.browseCategoryHash[item.id], function (srd) {
                                if(srd.catImage && srd.catImage != 'useDefaultFromStaticResource') {
                                    srd.catImage = getSFDocumentURL('', srd.catImage);
								}
								if(isAccessibilityMode){
									srd.accessibilityName = srd.categoryDescription ? srd.name + '. ' + srd.categoryDescription : srd.name;
								}
                                return srd.name != undefined;
							});
							item.subCategories = $filter('orderBy')(item.subCategories, 'name');
							if(item.leaf == 'false' && item.subCategories && item.subCategories.length == 0){
								var errorObj = {
									'name': selfServiceLabels.SSServiceRequestNotFound,
									'hasErrorMsg': true,
									'accessibilityName': isAccessibilityMode ? selfServiceLabels.SSServiceRequestNotFound : ''
								};
								item.subCategories=[errorObj];
							}
							item.showChildCategories = (item.subCategories && item.subCategories.length > 0) ? true : false;
							
							var buttonTop = document.getElementById('browseCategoryActive').getBoundingClientRect();
							var childTop = scope.rect.top - buttonTop.top;
							item.childUpScrollAvailable=false;
							item.childDownScrollAvailable=false;
							supportModel.thirdCategoryData.styleData = {top: childTop+'px', left: '532px'};

							var lastElement = $('#browseCategoryContent .category-dropdown-nav:last');
							if(lastElement && lastElement.height() && item.subCategories.length > 0){
								var childrenHeight = lastElement.height() * item.subCategories.length;
								var endPosition = document.getElementById('scrollEndDiv').getBoundingClientRect().top;
								var browseCategoryTop = document.getElementById('browseCategoryContent').getBoundingClientRect().top;
								
								if((scope.rect.top + childrenHeight) > endPosition){

									if((scope.rect.top - browseCategoryTop) > childrenHeight){
										item.styleData = {top: ((scope.rect.top - browseCategoryTop - childrenHeight)+lastElement.height()+buttonTop.height)+'px'};
									}else{
										var newTop = buttonTop.height + lastElement.height();
										var maxHeight = endPosition - buttonTop.top - newTop - lastElement.height();
										
										if(childrenHeight > maxHeight){
											item.childDownScrollAvailable=true;
										}

										item.styleData = {top: newTop+'px'};
										item.styleData['max-height'] = maxHeight+'px';
										item.scrollUpStyle = {top: newTop+'px', left: '532px'};
										item.scrollDownStyle = {top: ((newTop+maxHeight)-30)+'px', left: '532px'};
										item.scrollEndStyle = {top: (newTop+maxHeight)+'px'};

										item.scrollUpScrollImage={};
										item.scrollUpScrollImage['background-image'] = "url("+SDEFStylesURL+"/SDEFicons/arrow-up.png)";
										item.scrollUpScrollImage['margin-top'] = '8px';
										item.scrollDownScrollImage={};
										item.scrollDownScrollImage['background-image'] = "url("+SDEFStylesURL+"/SDEFicons/arrow-down.png)";
										item.scrollDownScrollImage['margin-top'] = '12px';
									}
								}else{
									var adjustedTop = (childTop - buttonTop.height) % lastElement.height();
									adjustedTop = (lastElement.height() - adjustedTop) < 10 ? 0 : adjustedTop;
									item.styleData = {top: (childTop - adjustedTop)+'px'};
								}
							}

							supportModel.thirdCategoryData={};
							item.styleData['left'] = '532px';
							supportModel.thirdCategoryData.styleData = item.styleData;
							supportModel.thirdCategoryData.data = item;
							supportModel.showThirdLevelCategories = item.showChildCategories;

							if(isAccessibilityMode){
								setTimeout(function(){
									var subList = document.getElementById('thirdLevelCategoryId');
									if(subList){
										subList.focus();
									}
								},500);
							}
                        }
                    });
                }
                event.stopPropagation();
            };
 
            scope.handleCategoryLeave = function(item){
				clearTimeout(1000);
				$(".popover").popover('hide');
			};
			
			scope.selectItem = function (category,isForward) {
				if(category.id){
					if(isCategoryHierarchyNavEnabled && supportModel.showCategory){
						supportModel.toggleBrowseCategory();
					}
					supportModel.selectItem(category,isForward,scope,'SR');
				}
				event.stopPropagation();
			};
			
			scope.setElementFocus = function(event){
				var sectionID = scope.isLastNode ? 'thirdLevelCategoryId' : 'secondLevelCategoryId';
				if (isAccessibilityMode && event && event.which === 40) {
					var elementId = document.getElementById(sectionID);
					if(elementId && elementId.firstElementChild){
						elementId.firstElementChild.focus();
					}
				}else if(isAccessibilityMode && event && event.which === 37){
					if(scope.isLastNode && supportModel.lastParentElement){
						supportModel.lastParentElement.focus();
						supportModel.showThirdLevelCategories = false;
						supportModel.thirdCategoryData = {};
					}else if(!scope.isLastNode && supportModel.firstParentElement){
						supportModel.firstParentElement.focus();
						supportModel.showSecondLevelCategories = false;
						supportModel.secondCategoryData = {};
					}
				}
				event.stopPropagation();
			};
			
			scope.catKeyPressHandler = function(event, item, childrenData){
				event.stopPropagation();
				if (isAccessibilityMode && event && event.keyCode === 39) {
					supportModel.lastParentElement = event.currentTarget;
					scope.handleCategoryEnter(event, item, childrenData);
				}else if(isAccessibilityMode && event && event.keyCode === 37){
					if(scope.isLastNode && supportModel.lastParentElement){
						supportModel.lastParentElement.focus();
						supportModel.showThirdLevelCategories = false;
						supportModel.thirdCategoryData = {};
					}else if(!scope.isLastNode && supportModel.firstParentElement){
						supportModel.firstParentElement.focus();
						supportModel.showSecondLevelCategories = false;
						supportModel.secondCategoryData = {};
					}
				}
			};
        }
    }
}])

.directive('srdChildrenCategory', ['supportModel','supportService', function (supportModel, supportService) {
	var resourceUrl=$("a[id*='selfServiceResourcesUrl']").attr('href');
	return {
		restrict: 'E',
		replace: true,
		scope: {
			childData: '=',
			selectAction: '&',
			searchText: '=',
			data: '=',
			forSr: '='
		},
		templateUrl: resourceUrl+'views/support/srd-questions/referenceTreeChildData.html',
		link: function(scope, element) {
			if(scope.searchText !== 'undefined' && scope.searchText !== '') {
				if(scope.childData !== undefined && scope.childData.length > 0) {
					for (var i = scope.childData.length - 1; i >= 0; i--) {
						scope.childData[i]['className'] = 'd-icon-right-angle_down';
						scope.childData[i]['showChilds'] = true;
						if(scope.childData[i]['children'] !== undefined) {
							if(scope.childData[i]['children'].length > 0) {
								for (var j = scope.childData[i]['children'].length - 1; j >= 0; j--) {
									scope.childData[i]['children'][j]['className']  = 'd-icon-right-angle_down';
									scope.childData[i]['children'][j]['showChilds']  = true;
								}
							}
						}
						
					}
				}
			}

			scope.lookupFilterId = '';
			if(scope.forSr) {
				if(! (typeof scope.data.lookupFilter === "undefined")) {
					if(! (typeof scope.data.lookupFilter['lkId'] === "undefined")) 
						scope.lookupFilterId = scope.data.lookupFilter['lkId'];
				}
			} else {
				scope.lookupFilterId = scope.data.apiName;
			}

		scope.getLookupFilterClause = function () {
			var lookupFilterClause = '';
			if (typeof scope.data.lookupFilter !== 'undefined' && typeof scope.data.lookupFilter.conditions !== 'undefined' && typeof scope.data.lookupFilter.dependentOn !== 'undefined' && scope.data.lookupFilter.dependentOn.length > 0) {
				lookupFilterClause = supportService.replaceFieldValuesInLookupConditions(supportModel.incident.questions, scope.data.lookupFilter.conditions, scope.data.lookupFilter.dependentOn, scope.data.lookupFilter.namespace);
				lookupFilterClause = supportModel.htmlDecode(lookupFilterClause);
			}
			return lookupFilterClause;
		};

			scope.showChildren = function (optionVal) {
				if(optionVal.className === 'd-icon-right-angle_right') {
					optionVal.className = 'd-icon-right-angle_down';
					if(!angular.isArray(optionVal.children)) {
						optionVal.showLoader = true;
					var params = {};
					params.whereClause = scope.getLookupFilterClause();
						Visualforce.remoting.Manager.invokeAction(_RemotingActions.getSS3Categories,
						'', optionVal.id, 'incident', 'SSINC', scope.forSr, 'true', params, scope.lookupFilterId,
							function(result, event) {
								if (event.status) {
									var resultSerialize = supportModel.htmlDecode(result);
									var resultSet = JSON.parse(resultSerialize);
									for (var i = resultSet.length - 1; i >= 0; i--) {
										resultSet[i]['className'] = 'd-icon-right-angle_right';
										resultSet[i]['showChilds'] = false;
										resultSet[i]['showLoader'] = false;
									}
									for(var i = scope.childData.length - 1; i >= 0; i--) {
										if(scope.childData[i]['id'] == optionVal.id){
											scope.childData[i]['children'] = resultSet;
											break;
										}
									}
									optionVal.showLoader = false;
								}
							}
						);
					} 
				} else {
					optionVal.className = 'd-icon-right-angle_right';
				} 
				optionVal.showChilds = !optionVal.showChilds;
			};

			scope.selectFromChild = function (optionChildVal) {
				scope.selectAction( {selectedCategory: optionChildVal} );
			}
		}
	}
}])

.directive('srdReferenceQuestionTree', ['$log', 'supportModel','supportService',  function ($log, supportModel, supportService) {
	var resourceUrl=$("a[id*='selfServiceResourcesUrl']").attr('href');
	return {
		restrict: 'E',
		replace: true,
		scope: {
			data: '=',
			forSr: '='
		},
		templateUrl: resourceUrl+'views/support/srd-questions/referenceTree.html',
		link: function (scope, element) {
			var resourceUrl = $("a[id*='selfServiceResourcesUrl']").attr('href');
			scope.cancelUrl = resourceUrl+'styles/img/obo-cancel.png';
			scope.loadData = false;
			scope.searchResults = [];
			scope.lookupFilterId = '';
			scope.fireBlurEvent = true;
		
			if(scope.forSr) {
				if(! (typeof scope.data.lookupFilter === "undefined")) {
					if(! (typeof scope.data.lookupFilter['lkId'] === "undefined")) 
						scope.lookupFilterId = scope.data.lookupFilter['lkId'];
				}
			} else {
				scope.lookupFilterId = scope.data.apiName;
			}
			
			if(scope.data.Value !== undefined && scope.data.Value != null && scope.data.Value != ''){
				scope.searchText = scope.data.Value;
			}else{
				scope.searchText = '';
			}
			
		if(! (typeof scope.data.lookupFilter === "undefined") && !(typeof scope.data.lookupFilter['filterType'] === "undefined")) { 
			scope.filter = {conditions:  scope.data.lookupFilter.conditions, 
				filterType : scope.data.lookupFilter.filterType,
				buttonName : selfServiceLabels.ShowAllResultsMsg,
				buttonInfo: selfServiceLabels.ShowAllResultsLink} ;
			
		}

			scope.$watch('loadData', function (val) {
				if(val && (!scope.searchResults || scope.searchResults.length == 0)) {
					scope.data.Value = '';
					scope.loadSearchResults();		
				}
			});

			scope.enableEditAndLoadData = function(){
				scope.loadData=true;
				if(scope.searchResults && scope.searchResults.length > 0)
					checkScrollIncrease();
			}
			
			scope.clearData = function(){
				if(scope.fireBlurEvent == true){
					if(scope.data.Value == '' && typeof scope.searchResults != 'undefined' && scope.searchResults.length == 1){
						scope.selectOptionVal(scope.searchResults[0]);
						scope.loadData = false;
					}else if(typeof scope.searchResults == 'undefined' || scope.searchResults.length == 0 || scope.data.Value == ''){
						scope.cancelSelection();
					}else if(typeof scope.searchResults != 'undefined'){
						scope.loadData = false;
					}
				}
			
			if (scope.filter != undefined && scope.filter.conditions == '') {
				scope.filter.conditions =  scope.data.lookupFilter.conditions;
				scope.filter.buttonName = selfServiceLabels.ShowAllResultsMsg;
				scope.filter.buttonInfo = selfServiceLabels.ShowAllResultsLink;
			}
			}
			
		scope.getLookupFilterClause = function () {
			var lookupFilterClause = '';
			if (typeof scope.data.lookupFilter !== 'undefined' && typeof scope.data.lookupFilter.conditions !== 'undefined' && typeof scope.data.lookupFilter.dependentOn !== 'undefined' && scope.data.lookupFilter.dependentOn.length > 0) {
				lookupFilterClause = supportService.replaceFieldValuesInLookupConditions(supportModel.incident.questions, scope.data.lookupFilter.conditions, scope.data.lookupFilter.dependentOn, scope.data.lookupFilter.namespace);
				lookupFilterClause = supportModel.htmlDecode(lookupFilterClause);
				
			}
			return lookupFilterClause;
		};
			
		scope.loadSearchResults = function (isShowAll) {
				scope.searchResultsAreLoading = true;
				if(!scope.searchText) scope.searchText='';
			var params ={};
			params.whereClause = (isShowAll) ? '' : scope.getLookupFilterClause();
			var lookupFId = (isShowAll) ? '' : scope.lookupFilterId;
				Visualforce.remoting.Manager.invokeAction(_RemotingActions.getSS3Categories,
				scope.searchText, '0', 'incident', 'SSINC', scope.forSr, 'true', params, lookupFId,
					function(result, event) {
						if (event.status) {
							var resultSerialize = supportModel.htmlDecode(result);
							var resultSet = JSON.parse(resultSerialize);
							var showChilds = scope.searchText === '' ? false: true;
							var className = scope.searchText === '' ? 'd-icon-right-angle_right': 'd-icon-right-angle_down';
							for (var i = resultSet.length - 1; i >= 0; i--) {
								resultSet[i]['className'] = className;
								resultSet[i]['showChilds'] = showChilds;
								resultSet[i]['showLoader'] = false;
								if(resultSet[i]['children'] !== undefined) {
									if(resultSet[i]['children'].length > 0) {
										for (var j = resultSet[i]['children'].length - 1; j >= 0; j--) {
											resultSet[i]['children'][j]['className']  = className;
											resultSet[i]['children'][j]['showChilds']  = showChilds;
											resultSet[i]['children'][j]['showLoader']  = false;
										}
									}
								}
								
							}
							scope.searchResults = resultSet;
						if (scope.filter != undefined && scope.filter.filterType == 'Optional')
							scope.searchResults.unshift({id:'toggleButton', itemName:scope.filter.buttonName, extraInfo:scope.filter.buttonInfo});
							scope.searchResultsAreLoading = false;
						}
					}
				);
			}
			
			scope.showChildren = function (optionVal) {
				scope.searchResultsAreLoadingForChildren = true;
				if(optionVal.className === 'd-icon-right-angle_right') {
					optionVal.className = 'd-icon-right-angle_down';
					if(!angular.isArray(optionVal.children)) {
						optionVal.showLoader = true;
					var params ={};
					params.whereClause = scope.getLookupFilterClause();
						Visualforce.remoting.Manager.invokeAction(_RemotingActions.getSS3Categories,
						scope.searchText, optionVal.id, 'incident', 'SSINC', scope.forSr, 'true', params, scope.lookupFilterId,
							function(result, event) {
								if (event.status) {
									var resultSerialize = supportModel.htmlDecode(result);
									var resultSet = JSON.parse(resultSerialize);
									for (var i = resultSet.length - 1; i >= 0; i--) {
										resultSet[i]['className'] = 'd-icon-right-angle_right';
										resultSet[i]['showChilds'] = false;
										resultSet[i]['showLoader'] = false;
									}
									for(var i = scope.searchResults.length - 1; i >= 0; i--) {
										if(scope.searchResults[i]['id'] == optionVal.id){
											scope.searchResults[i]['children'] = resultSet;
											break;
										}
									}
									optionVal.showLoader = false;
								}
							}
						);
					}
				} else {
					optionVal.className = 'd-icon-right-angle_right';
				} 
				optionVal.showChilds = !optionVal.showChilds;
			};

			scope.$watch('data.Value', function () {
				if(typeof(scope.data.isSRInput) != "undefined" && scope.data.isSRInput != null && scope.data.isSRInput == true){
					var srInputs = supportModel.srData.SRInputs;
					srInputs = supportModel.evaluateCondition(scope.data, srInputs, false);
					supportModel.srData.SRInputs = srInputs;
				}else if(scope.data.isCategoryForSmartSuggestions == true && scope.data.Value && scope.data.Value.length >= 2) {
					supportModel.smartSuggestions(scope.data);
				}
				if(supportModel.TicketOrRequest == 'Ticket'){
					supportModel.evaluateIncidentFldConditions(scope.data, supportModel.userModel.LayoutFldsandCriteria, supportModel.incident, false);
				}
			});

			scope.$watch('searchText', function (val, oldVal) {
				if ( val && val != '' && val.length >= 2) {
					scope.searchResultsAreLoading = true;
					if(scope.searchText !== '') scope.searchResults = [];
					scope.loadSearchResults();
				} else if (typeof(val) != 'undefined' && val == '') {
					scope.data.Value = '';
					scope.data.fvalue = '';
					scope.data.fRefFieldVal = '';
					if(oldVal && oldVal.length > 0) {
						scope.searchResults = [];
						scope.loadSearchResults();
					}
				} else if (typeof(val) == 'undefined' && oldVal && oldVal.length > 0) {
						scope.searchResults = [];
						scope.loadSearchResults();
				}
			});

			scope.selectOptionVal = function (optionVal) {
				scope.data.Value = optionVal.text;
				scope.searchText = optionVal.text;			
				scope.data.fvalue = optionVal.id;
				scope.data.fRefFieldVal = optionVal.text;
				scope.loadData = false;		
			};

			scope.cancelSelection =function (isClearSearchResults){

				scope.data.fvalue = '';
				scope.data.fRefFieldVal = '';
				scope.searchText = '';
				scope.loadData = false;
				if(isClearSearchResults  || !$.browser.msie) {
					scope.searchResults = [];
					scope.data.Value = '';
				}
				supportModel.smartSuggestions(scope.data);
			}
		scope.toggleFilter = function() {
			scope.searchResultsAreLoading = true;
			if (scope.filter.conditions == '') {
				scope.loadSearchResults();
				scope.filter.conditions =  scope.data.lookupFilter.conditions;
				scope.filter.buttonName = selfServiceLabels.ShowAllResultsMsg;
				scope.filter.buttonInfo = selfServiceLabels.ShowAllResultsLink;
			} else {
				scope.loadSearchResults(true);
				scope.filter.conditions = '';
				scope.filter.buttonName = selfServiceLabels.ReapplyCriteriaMsg;
				scope.filter.buttonInfo = selfServiceLabels.ReapplyCriteriaLink;
			}
		}

		}
	};
}])

.directive('srdReferenceQuestion', ['$log', 'supportService','supportModel', function ($log, supportService,supportModel) {
	var resourceUrl=$("a[id*='selfServiceResourcesUrl']").attr('href');
	var lastSelectedIndex = -1;
	return {
		restrict: 'E',
		replace: true,
		scope: {
			data: '=',
			onBehalfOfUser: '='
		},
		templateUrl: resourceUrl+'views/support/srd-questions/reference.html',
		link: function (scope, element) {
			if (scope.data.lookupFilter != undefined){
				scope.filter = {
					conditions: scope.data.lookupFilter.conditions,
								filterType : scope.data.lookupFilter.filterType,
								buttonName : selfServiceLabels.ShowAllResultsMsg,
								buttonInfo: selfServiceLabels.ShowAllResultsLink};
				if(scope.data.lookupFilter.cmdbSSFilter != undefined){
					scope.filter.cmdbSSFilter = scope.data.lookupFilter.cmdbSSFilter
				}
			}
			if(scope.data.Value !== undefined && scope.data.Value != null && scope.data.Value != ''){
				scope.searchText = scope.data.Value;
			}else{
				scope.searchText = '';
			}
			scope.isAccessibilityMode = isAccessibilityMode;
			scope.showExtraInfo = false;
			scope.editMode=false;
			scope.loadData=false;
			scope.fireBlurEvent = true;
			scope.selectedRow = 0;
			scope.showLabelsInDefaultLookupView = showLabelsInDefaultLookupView;
			scope.showLabelsInExpandedLookupView = showLabelsInExpandedLookupView;
			if(scope.data.options && scope.data.options.length>0){
				scope.searchText=supportModel.htmlDecode(scope.data.options[0].itemName);	
				scope.data.Value = scope.data.options[0].itemName;
				scope.data.fvalue = optionVal.itemId;
				scope.data.fRefFieldVal = supportModel.htmlDecode(optionVal.itemName);
			}
				
			var resourceUrl=$("a[id*='selfServiceResourcesUrl']").attr('href');
			scope.cancelUrl=resourceUrl+'styles/img/obo-cancel.png';
			scope.$watch('loadData', function (val) {
					if(val && (!scope.searchResults || scope.searchResults.length == 0)) {
						scope.searchResultsAreLoading = true;
						scope.data.Value = '';
						searchDebounced();		
					}
			});
			
			scope.$watch('searchText', function (val, oldVal) {
				if ( val && val != '' && val.length >= 2) {
					scope.searchResultsAreLoading = true;
					searchDebounced();
				}else if (typeof(val) != 'undefined' && val == ''){
					scope.data.Value = '';
					scope.data.fvalue = '';
					scope.data.fRefFieldVal = '';
					if(typeof(scope.data.fEmail) != 'undefined'){
						scope.data.fEmail = '';
					}
					if(oldVal && oldVal.length > 0) {
						scope.searchResultsAreLoading = true;
						searchDebounced();
					}
				} else if (typeof(val) == 'undefined' && oldVal && oldVal.length > 0) {
					scope.searchResultsAreLoading = true;
					searchDebounced();
				}
			});
			
			scope.$watch('data.Value', function () {
				if(typeof(scope.data.isSRInput) != "undefined" && scope.data.isSRInput != null && scope.data.isSRInput == true){
					var srInputs = supportModel.srData.SRInputs;
					srInputs = supportModel.evaluateCondition(scope.data, srInputs, false);
					supportModel.srData.SRInputs = srInputs;
				}else if(scope.data.isService && scope.data.Value && scope.data.Value.length >= 2) {
					supportModel.smartSuggestions(scope.data);
				}else if(scope.data.isCategoryForSmartSuggestions && scope.data.Value && scope.data.Value.length >= 2) {
					supportModel.smartSuggestions(scope.data);
				}
				if(supportModel.TicketOrRequest == 'Ticket'){
					supportModel.evaluateIncidentFldConditions(scope.data, supportModel.userModel.LayoutFldsandCriteria, supportModel.incident, false);
				}
			});
			
			scope.enableEditAndLoadData = function(){
				scope.editMode=true;
				if(scope.searchResults && scope.searchResults.length > 0)
					checkScrollIncrease();				
				
				scope.loadData=true;
			}
			
			
			scope.clearData = function(event){
				if(isAccessibilityMode && event == 'lookupblur')
					return;
				if(scope.fireBlurEvent == true){
					if(scope.data.Value == '' && typeof scope.searchResults != 'undefined' && scope.searchResults.length == 1){
						scope.selectOptionVal(scope.searchResults[0]);
						scope.editMode = false;
					}else if(typeof scope.searchResults == 'undefined' || scope.searchResults.length == 0 || scope.data.Value == ''){
						scope.cancelSelection();
					}else if(typeof scope.searchResults != 'undefined'){
						scope.editMode = false;
					}
				}
				supportModel.smartSuggestions(scope.data);
			}

			scope.toggleFilter = function() {
				if (scope.filter.conditions == '') {
					scope.filter.conditions =  scope.data.lookupFilter.conditions;
					scope.filter.buttonName = selfServiceLabels.ShowAllResultsMsg;
					scope.filter.buttonInfo = selfServiceLabels.ShowAllResultsLink;
				} else {
					scope.filter.conditions = '';
					scope.filter.buttonName = selfServiceLabels.ReapplyCriteriaMsg;
					scope.filter.buttonInfo = selfServiceLabels.ReapplyCriteriaLink;
				}
				scope.searchResultsAreLoading = true;
				searchDebounced();
			}
			scope.selectOptionVal = function (optionVal) {
				if (optionVal.itemId == 'toggleButton') {
					return;
				}
				scope.data.Value = optionVal.itemName;
				scope.searchText=supportModel.htmlDecode(optionVal.itemName);			
				scope.data.fvalue = optionVal.itemId;
				scope.data.fRefFieldVal = supportModel.htmlDecode(optionVal.itemName);
				if(scope.data.Values[0].Value.toLowerCase() == 'user'){
					scope.data.fEmail = optionVal.specificFields['username']
				}
				scope.loadData = false;		
				scope.editMode = false;		
			};
			scope.cancelSelection =function (isClearSearchResults){
				scope.editMode = false;
				scope.searchText = '';
				scope.loadData = false;
				scope.selectedRow = 0;
				if(isClearSearchResults  || !$.browser.msie) {
					scope.searchResults = [];
					scope.data.Value = '';
				} 
				scope.filter = {conditions:  scope.data.lookupFilter.conditions, 
							filterType : scope.data.lookupFilter.filterType,
							buttonName : selfServiceLabels.ShowAllResultsMsg,
							buttonInfo :  selfServiceLabels.ShowAllResultsLink} ;
				if(scope.data.lookupFilter != undefined && scope.data.lookupFilter.cmdbSSFilter != undefined){
					scope.filter.cmdbSSFilter = scope.data.lookupFilter.cmdbSSFilter
				}					
			}
			
			scope.loadSerachResults=function(objName, fieldInfo, requestedForUser){
				if (scope.filter != undefined && scope.filter.conditions != undefined && scope.filter.conditions != '' && scope.data.lookupFilter.dependentOn != undefined && scope.data.lookupFilter.dependentOn != null && scope.data.lookupFilter.dependentOn.length > 0 ) {
				scope.filter.conditions = supportService.replaceFieldValuesInLookupConditions(supportModel.incident.questions, scope.data.lookupFilter.conditions, scope.data.lookupFilter.dependentOn, scope.data.lookupFilter.namespace);
				}
				supportService.searchReferenceFields(objName, fieldInfo, scope.searchText, scope.filter, requestedForUser,'').then(function (data) {
						scope.searchResults = [];
						if(objName.toLowerCase() == 'category__c' || objName.toLowerCase() == 'bmcservicedesk__category__c'){
							scope.showExtraInfo = true;
						}
						if (scope.filter != undefined && scope.filter.filterType == 'Optional')
							scope.searchResults.push({itemId:'toggleButton', itemName:scope.filter.buttonName, extraInfo:scope.filter.buttonInfo});
						if (data && angular.isArray(data)) {
							scope.searchResults = scope.searchResults.concat(data);
						}
				})
				['finally'](function () {
						scope.searchResultsAreLoading = false;
				});
			}
			var searchDebounced = _.debounce(function () {
					scope.searchResultsAreLoading = true;
					scope.objName = scope.data.Values[0].Value;
					scope.loadSerachResults(scope.objName, scope.data, scope.onBehalfOfUser);
			}, 250);
			scope.getMoreFields = function (index, recordId){
				supportService.searchReferenceFields(scope.objName, scope.data, scope.searchText, scope.filter, scope.onBehalfOfUser, recordId).then(function (data) {
					scope.searchResults[index].extraInfoList = data[0].extraInfoList;
					scope.searchResults[index].showMore=false;
				})
				['finally'](function () {
					scope.searchResults[index].resultsAreLoading = false;
				});
			}
			scope.expandLookupData = function(optionVal,index){
				scope.searchResults[index].isShowMoreAvailable = true;
				if(typeof optionVal.extraInfoList == 'undefined' || optionVal.extraInfoList.length == 0){ 
					scope.searchResults[index].resultsAreLoading = true;
					scope.getMoreFields(index,optionVal.itemId);
				}else{
					scope.searchResults[index].showMore=false;
				}
				var lastCollapsedDivHeight = 0;
				//collapse the previously opened item
				if(!isAccessibilityMode && lastSelectedIndex != -1 && lastSelectedIndex != index){
					scope.searchResults[lastSelectedIndex].showMore=true;
					lastCollapsedDivHeight = $(element).find('#outerDiv-'+lastSelectedIndex).height();
				}
				lastSelectedIndex = index;
				
				var scrollTo = $(element).find('#outerDiv-'+index);
				var container = scrollTo.closest('.srd-question-reference-container');
				if(!isAccessibilityMode) {
					$(container).animate({
						scrollTop: scrollTo.offset().top - container.offset().top + container.scrollTop() - lastCollapsedDivHeight 
					}, 'fast');
				}
			}
			scope.collapseLookupData = function(itemId,index){
				scope.searchResults[index].showMore=true;
			}
			scope.selectRow = function(index){
				scope.selectedRow = index;
			}
			scope.getNumber = function(num) {
				return new Array(num);   
			}
			scope.htmlUnescape = function(str){
				return supportModel.decodeText(str);
			}
			scope.decodeText = function(str){
				return supportModel.decodeText(str);
			}
		}
	};
}])

.directive('setModalScrolltopForLookup', function() {
	return {
		restrict: 'A',
		link: function(scope, element, attrs) {
			if(!isAccessibilityMode) {
				var modalPopup = document.getElementById('incidentForm');
				if(!modalPopup)
					modalPopup = document.getElementById('srdForm');		
				initialModalScrollHeight = modalPopup.scrollHeight;
				if (scope.$first){
					checkScrollIncrease();
				}
			}
			
		}
	}
})

.directive('arrowSelector', ['$document', function ($document) {
	return {
		restrict: 'A',
		link: function (scope, elem, attrs, ctrl) {
			var elemFocus = false;
			var idPrefex = '';
			var eventBindedtoCrossBtn = false;
			if (isAccessibilityMode) {
				elemFocus = true;
				elem.bind('keydown', arrowSelectorKeyDownHandler);
								
				$document.bind('keydown', function (e) {
					if (e.target.tagName.toUpperCase() != 'INPUT' && scope.searchResults && scope.searchResults.length > 0)
						scope.clearData();
				});
			} else {
				elem.on('mouseenter', function () {
					elemFocus = true;
				});
				elem.on('mouseleave', function () {
					elemFocus = false;
				});
				$document.bind('keydown', arrowSelectorKeyDownHandler);
			}

			scope.setListFocus = function (elementid) {
				var li = $('div[dataid="' + elementid + '"]');
				if (li && li[0]) {
					var selectedLi = $('div[aria-selected="true"]');

					if (selectedLi && selectedLi[0] && selectedLi[0].id && selectedLi[0].id.indexOf('outerDiv') != -1)
						selectedLi[0].setAttribute('aria-selected', false);

					li[0].setAttribute('aria-selected', true);
					li[0].focus();

				}

			}

			function arrowSelectorKeyDownHandler(e) {
				if (elemFocus) {					
					if (isAccessibilityMode) {
						if (e.target.getAttribute('dataid')) {
							if (scope.selectedRow != undefined)
								idPrefex = e.target.getAttribute('dataid').split('__outerDiv-' + scope.selectedRow)[0];
							else
								idPrefex = e.target.getAttribute('dataid').split('__outerDiv-0')[0];
						} else if (e.target.id.indexOf('__input') != -1) {
							idPrefex = e.target.id.split('__input')[0];
						} else if (e.target.id.indexOf('__crossButton') != -1) {
							idPrefex = e.target.id.split('__crossButton')[0];
						}

						if(eventBindedtoCrossBtn == false && idPrefex){
							eventBindedtoCrossBtn = true;
							if($('#'+idPrefex+'__crossButton'))
								$('#'+idPrefex+'__crossButton').bind('keydown', arrowSelectorKeyDownHandler);
							
						}
					}

					if (e.keyCode == 38) {
						if (scope.selectedRow == 0) {
							if (isAccessibilityMode)
								e.stopPropagation();
							return;
						}
						scope.selectedRow--;
						scope.$apply();
						$('.srd-question-reference-container').scroll();
						$(".srd-question-reference-container").animate({
							scrollTop: $('#outerDiv-' + scope.selectedRow).position().top
						}, 'fast');
						if (isAccessibilityMode) {
							scope.setListFocus(idPrefex + '__outerDiv-' + scope.selectedRow);
							e.stopPropagation();
						}
						e.preventDefault();
					} else if (e.keyCode == 40) {
						if (typeof scope.selectedRow == 'undefined')
							scope.selectedRow = 0;
						if (e.target.tagName.toUpperCase() == 'INPUT'  && isAccessibilityMode) {
							scope.selectedRow = 0;
						} else {
							scope.selectedRow++;
						}

						if (scope.searchResults && scope.selectedRow >= scope.searchResults.length ) {
							scope.selectedRow = scope.searchResults.length - 1;
							if (isAccessibilityMode) {
								e.stopPropagation();
							}

							return;
						}
						scope.$apply();
						$('.srd-question-reference-container').scroll();
						$(".srd-question-reference-container").animate({
							scrollTop: $('#outerDiv-' + scope.selectedRow).position().top
						}, 'fast');
						if (isAccessibilityMode) {
							scope.setListFocus(idPrefex + '__outerDiv-' + scope.selectedRow);
							e.stopPropagation();
						}
						e.preventDefault();
					} else if (e.keyCode == 13 || (isAccessibilityMode && e.which == 32)) {
						if (typeof scope.selectedRow != 'undefined' && scope.searchResults && scope.searchResults.length > 0) {
							if (isAccessibilityMode && $('#' + idPrefex + '__input')) {
								$('#' + idPrefex + '__input').focus();
							}
							scope.selectOptionVal(scope.searchResults[scope.selectedRow]);
						}
					}

					if (isAccessibilityMode) {
						
						if (!e.shiftKey && e.which == 9 && e.target.id && e.target.id == idPrefex + '__input') {
							if (document.getElementById(idPrefex + '__input').value && scope.editMode) {
								idPrefex = idPrefex + '__crossButton';
								if ($('#' + idPrefex)) {
									$('#' + idPrefex).focus();
								}
								e.preventDefault();
								e.stopPropagation();
							} else {
								scope.clearData();
							}

						} else if (e.target.id.indexOf('__crossButton') > -1 && (e.which == 13 || e.which == 32)) {
							scope.cancelSelection();
						}

						if(e.shiftKey && e.which == 9 && e.target.id == idPrefex + '__input') {
							scope.clearData();
						}

					}
				}
			}
		}
	};
}]);
angular.module('supportModule')
.directive('activityLogText', ['$filter', function ($filter) {
	return {
		restrict: 'E',
		template: '<div ng-bind-html="activityLogText"></div>',
		replace: true,
		scope: {
			data: '='
		},
		link: function (scope) {
			if (scope.data) {
				// convert HTML tag sybmols to text
				scope.activityLogText = scope.data.replace(/</g, '&lt;').replace(/>/g, '&gt;');
				// preserve new lines
				scope.activityLogText = scope.activityLogText.replace(/\n/g, '<br />');
			}
		}
	}
}]);

angular.module('supportModule')
.directive('setHeight', [function () {
	return {
		link: function(scope, element, attrs){
			switch (attrs.setHeight){
				case "setNewIncFormHeight":
					element.css('height', window.innerHeight - (lightningModule=='createInc' ? 73 : 133) + 'px');
				break;
				case "setNewSrFormHeight":
					element.css('height', window.innerHeight - (lightningModule=='createSR' ? 151 : 211) + 'px');
				break;
				case "setKaIframeHeight":
					element.css('height', window.innerHeight - 75 + 'px');
				break;
				case "setEditExtFormHeight":
					element.css('height', window.innerHeight - 70 + 'px');
				break;
				case "setEditIntFormHeight":
					element.css('height', window.innerHeight - 134 + 'px');
				break;
				case "setEditContentDivHeight":
					if(attrs.additionalParam == "false"){
						element.css('height', window.innerHeight - 267 + 'px');
					}else{
						element.css('height', window.innerHeight - 226 + 'px');
					}
				break;
				case "setRelDetailsDivHeight":
					if(attrs.additionalParam == "false"){
						element.css('height', window.innerHeight - 164 + 'px');
					}else{
						element.css('height', window.innerHeight - 206 + 'px');
					}
				break;
				case "setApprovalHistoryDivHeight":
					element.css('max-height', window.innerHeight - 330 + 'px');
				break;
			}
			
		}
	}
}]);


		angular.module('supportModule').directive('ariaTabindex', function ($parse) {
			return function (scope, element, attr) {
				if(isAccessibilityMode)
					element.attr('tabindex',attr.ariaTabindex)
			}
		});

angular.module('supportModule')
.directive('setWidthOfTile', [function () {
	return {
		link: function(scope, element, attrs){
			if (attrs.setWidthOfTile) {
				var widthFactor = isSwitchToEnhancedUI ? 1 : 0.5;
				if(attrs.srdid == "" || typeof attrs.srdid == 'undefined'){
					element.css('width',((100/attrs.setWidthOfTile) - widthFactor)+'%');
				}
			}					
		}
	}
}]);

		
angular.module('supportModule').filter('format', function () {
  return function (input) {
	if (input) {
	  return input.replace(/&nbsp;/g,' ');
	}
  };
});

angular.module('supportModule').directive('localeDecimalNumberFormat', ['$filter','userModel',
	function($filter,userModel) {
		return {
			require: 'ngModel',
			priority: 100,
			link: function(scope, element, attrs, ngModel) {
				scope.localeDecimalSeparator = userModel.localeDecimalSeparator;
				scope.localeDecimalSeparator = scope.localeDecimalSeparator == '.' ? '\\.' : scope.localeDecimalSeparator;
				ngModel.$parsers.push(function(data) {
					var INTEGER_REGEX = new RegExp('^(([0-9]*)|(([0-9]*)' + scope.localeDecimalSeparator + '([0-9]*)))$');
					if(INTEGER_REGEX.test(data)){
						ngModel.$setValidity('number', true);
					}else{
						ngModel.$setValidity('number', false);
					}
					//convert data from view format to model format
					data = $filter('localeNumberSeparator2decimal')(data);
					return data;
				});

				ngModel.$formatters.push(function(data) {
					//convert data from model format to view format                    
					data = $filter('decimal2localeNumberSeparator')(data);
					return data;
				});
			}
		};
	}
]);

angular.module('supportModule').filter('localeNumberSeparator2decimal', ['userModel', 
	function(userModel) {
		return function(input) {
			if(input){
				var ret = input.toString().trim().replace(userModel.localeDecimalSeparator,".");
				input = parseFloat(ret);
			}
			return input;
		};
	}
]);

angular.module('supportModule').filter('decimal2localeNumberSeparator', ['userModel', 
	function(userModel) {
		return function(input) {
			if(input){
				var ret = input.toString().trim().replace(".",userModel.localeDecimalSeparator);
				input = ret;
			}
			return input;
		};
	}
]);

var initialModalScrollHeight ;
function checkScrollIncrease() {
	if(!isAccessibilityMode) {
		setTimeout(function () {
			var modalPopup = document.getElementById('incidentForm') 
			if(!modalPopup)
				modalPopup = document.getElementById('srdForm');					
			var newModalScrollHeight = modalPopup.scrollHeight;		
			if(initialModalScrollHeight && initialModalScrollHeight < newModalScrollHeight)
				modalPopup.scrollTop = modalPopup.scrollHeight;
		},200);
	}
}