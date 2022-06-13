angular.module('supportModule')
		.factory('supportSearchModel', ['rkmDetailsService', 'supportService', 'supportModel', 'urlSanitizerService','$q','enhanceduiService',
			function (rkmDetailsService, supportService, supportModel, urlSanitizerService, $q, enhanceduiService) {
				var self = {};
				var resourceUrl=$("a[id*='selfServiceResourcesUrl']").attr('href');
				self.searchResults={items:[]};
				self.dataLoading = false;
				self.nothingFound = true;
				self.sections=[];
				self.lastSelectedSection = '';
				self.moduleIcons=enhanceduiService.getModuleIcons();
				var searchGroup =''; // Empty means new Session
                var searchHistoryRecord ;
                var searchGrpStart ;
				function creatSectionForTab(tab, description, isLast,id){
						var section = {
							'header'      : tab,
							'description' : description,
							'isLast'      : isLast,
							'count'		  : 0,
							'id'		  : id,
							'selected'	  : false
					};
						
						if((self.lastSelectedSection && self.lastSelectedSection == section.header) || self.lastSelectedSection == ''){
							self.lastSelectedSection = section.header;
							section.isSelected = true;
						}else{
							section.isSelected= false;
				}
						
					return section;
				}
				
				function getSearchSection(){
					var section;
					
						if(isKAFirst && (allowRFSearch || allowSFSearch)){
					if(allowRFSearch){
							section = creatSectionForTab('KA', selfServiceLabels.SS_Articles, false,'KA_TAB');
							self.sections.push(section);
							}
							if(allowSFSearch){
								section = creatSectionForTab('SFKA', selfServiceLabels.SFKnowldgeArticles, false,'SFKA_TAB');
								self.sections.push(section);
							}
							if(isIncSRTogether){
								section = creatSectionForTab('SR', selfServiceLabels.srdResultsTitle, false, 'SR_TAB');
								self.sections.push(section);
							}else{
								section = creatSectionForTab('INCTEMPLATE', selfServiceLabels.commonTickets, false,'INCTEMPLATE_TAB');
								self.sections.push(section);
								
								section = creatSectionForTab('SR', selfServiceLabels.srdResultsTitle, false, 'SR_TAB');
								self.sections.push(section);
							}
						}else{
							if(isIncSRTogether){
								section = creatSectionForTab('SR', selfServiceLabels.srdResultsTitle, false,'SR_TAB');
								self.sections.push(section);
							}else{
								section = creatSectionForTab('INCTEMPLATE', selfServiceLabels.commonTickets, false,'INCTEMPLATE_TAB');
								self.sections.push(section);
								
								section = creatSectionForTab('SR', selfServiceLabels.srdResultsTitle, false,'SR_TAB');
								self.sections.push(section);
							}
							if(allowRFSearch){
							section = creatSectionForTab('KA', selfServiceLabels.SS_Articles, false,'KA_TAB');
							self.sections.push(section);
							}
							if(allowSFSearch){
								section = creatSectionForTab('SFKA', selfServiceLabels.SFKnowldgeArticles, false,'SFKA_TAB');
								self.sections.push(section);
						}						
								
								
							}
							
						section = creatSectionForTab('BR', selfServiceLabels.SSRightSidebarBroadcastsTitle, true,'BR_TAB');
						self.sections.push(section);
						
				}
				
				var setSearchedSrdIcon = function (item) {
					if (!item.icon) {						
						item.icon = 'assistant-categorySRD-form';
					}
				};				
				
			
				var processSearchResults = function (result) {
					var isOneRecord = result.length == 1;
					var recordType = 'SR';
					self.nothingFound = !result.length ;
					if(!self.nothingFound){
						_.each(result,function(item){
							
							item.id=item.recordId;						
							item.title=self.htmlDecode(item.titleTxt);
							item.desc = self.htmlDecode(item.description);								
							item.isRTFDesc = 'false';
							if (item.recDetails) {						
								_.each(item.recDetails,function(rec){
									if(rec.apiName == 'description_rich_text__c'){
										var description = self.htmlDecode(rec.value);
										if(description.trim() != ''){
											item.desc=description;
											item.isRTFDesc = 'true';
										}
									}	
								});
							}							
							if(item.imgUrl != 'DEFAULT' && item.imgUrl!=''){
								item.image=item.imgUrl;
							}
							
							if(item.typeOfRecord == "KA"){
								recordType= 'KA';
								//rkmDetailsService.processRkmTextFields(item);
								/*if(item.articleType != "How To"){
									rkmDetailsService.processRkmTextFields(item);
								}else{
									//item.source = urlSanitizerService.sanitize(howToItem.urlLink);
								}*/
								item.isRkm=true;
							}else if(item.typeOfRecord == "SFKA"){
								recordType= 'SFKA';
								if(item.articleType){
									item.urlLink =  '/articles/'+item.articleType+'/'+item.urlLink+'?popup=true'; 
								}else{
									item.urlLink =  '/articles/Knowledge/'+item.urlLink+'?popup=true'; 
								}

								item.isSFkm=true;
							}else if(item.typeOfRecord == "SR" || item.typeOfRecord =="SRD"){							
								recordType = 'SR';						
								item.serviceRequestDefinitionId=item.recordId;
								if(item.iconClass && item.iconClass!="" && item.iconClass!="DEFAULT")
									item.image=getSFDocumentURL(item.iconClass);
								if(!item.image)
									setSearchedSrdIcon(item)
								item.isSrd=true;
								item.descriptionData = {}
								item.descriptionData.isSearch = true;
								item.descriptionData.showDescriptionEllipses = true;
								item.descriptionData.showToggle = undefined;
								if(isOneRecord) {
									item.descriptionData.descriptionClass = 'support-request__description';
								} else {
									if (item.isRTFDesc == 'true'){ 
										item.descriptionData.descriptionClass = 'support-request__description-ellipsis support-request__description-maxheight';
									} else {
										item.descriptionData.descriptionClass = 'support-request__description-ellipsis support-request__description-ellipsis-maxHeight';
									}		
								}					
								item.descriptionData.value = item.desc;
							}else if(item.typeOfRecord == "INCTEMPLATE" || item.typeOfRecord =="TEMPLATE"){
								recordType = 'INCTEMPLATE';
								item.image= resourceUrl+'styles/img/assistant-categorySRD-datacenter.png';
								item.isTmp=true;
								item.descriptionData = {}
								item.descriptionData.isSearch = true;
								item.descriptionData.showDescriptionEllipses = true;
								item.descriptionData.showToggle = undefined;
								item.descriptionData.descriptionClass = 'support-request__description-ellipsis';
								item.descriptionData.value = item.desc;
							}else if(item.typeOfRecord =="BR"){
								recordType = 'BR';
								item.image= resourceUrl+'styles/img/assistant-categorySRD-datacenter.png';
								item.isBR=true;
								item.descriptionData = {}
								item.descriptionData.isSearch = true;
								item.descriptionData.showDescriptionEllipses = true;
								item.descriptionData.showToggle = undefined;
								item.descriptionData.value = item.desc;
								if(isOneRecord) {
									item.descriptionData.descriptionClass = 'support-request__description';
								} else {
									item.descriptionData.descriptionClass = 'support-request__description-ellipsis support-request__description-ellipsis-maxHeight';
							}	
								
							}	
							item.recordTypeId = recordType+'_TAB';
								
						});
					}
					self.searchResults.items=result;
				};
				self.htmlDecode=function (input){
					if(typeof(input) != 'undefined' && input != null && input != ''){
						input = unescape(input);
						input = input.replace(/&quot;/g, '"');
				    	input = input.replace(/&#39;/g, "'");
				    	input = input.replace(/&lt;/g, '<');
				    	input = input.replace(/&gt;/g, '>');
				    	input = input.replace(/&amp;/g, '&');
						input = input.replace(/%2F/g, '/');
						input = input.replace(/&nbsp;/g, ' ');
				        return input;
				    }else{
				    	return '';
				    }
				}
				//TODO: Need to review this function by Safiya
				self.select = function(element,item) {
					angular.forEach(self.searchResults.items, function(value) {
					  value.selected = false;
					});
					if(element && angular.element(element)){
						angular.element(element).scope().searchResults.items.selected = true;
					}
					self.openItem(item);
				};
				
				self.setfocusToContent= function(Id) {
					if(document.getElementById(Id))
						document.getElementById(Id).firstElementChild.firstElementChild.focus();
					
				};
				
				self.changeSectionType = function(section, searchText){
					if(section.styleclass!='section-selected'){
						self.focusSelectedTab(section.header);
						self.getSearchResults(unescape(searchText), section.header);
						setTimeout(function(){
							self.setfocusToContent(section.id); 
						}, 3000);
					}else if(section && section.id){
						self.setfocusToContent(section.id);
					}
				}				
				
				self.resetSearch = function() {
					angular.forEach(self.sections, function(section){
						section.count = 0;
					});
					self.lastSelectedSection = '';
				}
				
				function getResults(searchText,sectionType){
					self.searchResults.type='';
					var deferred = $q.defer();  
					if(!sectionType)
						sectionType=self.sections[0].header;
					Visualforce.remoting.Manager.invokeAction(_RemotingActions.getSearchResults,searchText,sectionType, null, function(result, event) {
							if (event.status) {									    				
								deferred.resolve(result);	
								setCount(result.count);
							}else{
								deferred.reject();
							}
						});	
					return deferred.promise;	
				}

				function createSearchHistory(searchText, recordCountForTab) {
					var deferred = $q.defer();
					Visualforce.remoting.Manager.invokeAction(_RemotingActions.createSearchHistory,searchText,recordCountForTab, searchGroup, function(result, event) {
						if (event.status) {
							searchHistoryRecord = result ;
							if((searchHistoryRecord && searchHistoryRecord[namespaceprefix+'__Search_Group__c'] && searchGroup == '')) {
								searchGroup = searchHistoryRecord[namespaceprefix+'__Search_Group__c'] ;
							}
			
							deferred.resolve(result);
						} else {
							deferred.reject();
						}
					},{escape:false});
					return deferred.promise;
				}

				function setCount(sectionCount){
					if($('.superBoxTabs')){
						
						$('.superBoxTabs').on('keydown', function(event){
							if(event.which === 32 || event.which === 13) {
								$(this).trigger('click');
								event.preventDefault();
							}
								
						});
					}
								
					_.each(self.sections,function(sectionItem){
									if(sectionItem.header== 'SR' ){
										sectionItem.count = sectionCount.SR_count;
									}else if(sectionItem.header== 'INCTEMPLATE'){
										sectionItem.count = sectionCount.INCTEMPLATE_count;
									}else if(sectionItem.header== 'KA' ){
										sectionItem.count = sectionCount.KA_count;
									}else if(sectionItem.header== 'BR' ){
										sectionItem.count = sectionCount.BR_count;
									}else if(sectionItem.header== 'SFKA' ){
										sectionItem.count = sectionCount.SFKA_count;
									}
								});	
				}
				self.focusSelectedTab = function(sectionHeader){
					if(self.lastSelectedSection != sectionHeader){
						_.each(self.sections,function(sectionItem){
								if(sectionItem.header == sectionHeader){
									sectionItem.styleclass = 'section-selected';
									sectionItem.isSelected=true;
									self.lastSelectedSection = sectionItem.header;
									
								}else{
									sectionItem.styleclass='section-nonselected';
									sectionItem.isSelected=false;
								}
									
						});
					}
				}
				
				self.getSearchResults = function (searchText,sectionType,isSearch) {
					var createHistoryInterval = 3000;
						if(!sectionType){
								self.sections=[];
								getSearchSection();
						}						
								
						if(searchText.length >= 2 || supportModel.isCJKPattern(searchText)){
								searchText = searchText.replace(/(\r\n|\n|\r)/g," ");
								var params = { "SearchString" : searchText};
								var promise;
								self.dataLoading = true;
								promise = getResults(searchText,sectionType)
									.then(function(data) {
											if(isSearch === true && enableSSSearchHistoryTracking === true){
												var currentDateTime = new Date();
                                                if(searchGroup == '' || (currentDateTime - searchGrpStart > SSSearchGroupDuration)) {
                                                    searchGroup = '';
                                                    searchGrpStart = currentDateTime ;
                                                }
												clearTimeout(self.searchHistoryTimer);
												self.searchHistoryTimer = setTimeout(function() {createSearchHistory(searchText,data.count )}, createHistoryInterval); 												
											}
											self.focusSelectedTab(data.sectionType);
			    							return processSearchResults(data.records);
									
			  						})
									['finally'](function () {
										self.dataLoading = false;
									});
								return promise;
						}else{
								_.each(self.sections,function(sectionItem){
									sectionItem.count = 0;
								});
								return processSearchResults([]);
						
						}
				};
				
				return self;
			}
		]);
