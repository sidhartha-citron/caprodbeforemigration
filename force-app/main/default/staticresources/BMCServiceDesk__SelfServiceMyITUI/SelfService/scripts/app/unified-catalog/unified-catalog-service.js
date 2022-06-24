	angular.module('unifiedCatalogModule')
		.factory('unifiedCatalogService',['$q','enhanceduiService', function ($q, enhanceduiService) {
		var self = {};		
		self.htmlDecode=function (input){
			if(input)
				return angular.element('<div>' + input + '</div>').text().replace(/&amp;/g, '&');
			return '';
		}
		self.moduleIcons=enhanceduiService.getModuleIcons();
		self.getAllSections= function(){	
					var resourceUrl=$("a[id*='selfServiceResourcesUrl']").attr('href');	
					var deferred = $q.defer();  
					 Visualforce.remoting.Manager.invokeAction(_RemotingActions.getCommonResults, null, function(result, event) {
							if (event.status) {
								var sections=[];
								var sectionCount=0;
								_.each(result,function(section){
									var sectionItems=eval(section.items.replace(/&quot;/g, '"'));
									var items=[];

									sectionCount++;									
									_.each(sectionItems,function(sectionItem){
										var item={
											'label' : self.htmlDecode(sectionItem.header).replace(/\\'/,"'"),
											'description':sectionItem.description,
											'displayType':'regular',
											'id':sectionItem.recordId,
											'externalId':sectionItem.recordId
										};
										
										if(sectionItem.type=='SR'){											
											item.serviceRequestDefinitionId = sectionItem.recordId;
											item.sourceType='srm';
											item.isSrm = true;
											item.imageUrl = sectionItem.iconClass.split('\\').join('');
											if(item.imageUrl== 'DEFAULT')
												item.imageUrl= self.moduleIcons.ServReq;
										}else if(sectionItem.type=='KA'){
											item.isRkm = true;
											item.sourceType = 'rkm';
											var articleType = sectionItem.recordTypeDevName;
											var namespaceWithoutUnderscore = namespace.replace('__','');
											if(typeof(articleType) != 'undefined' && articleType != null){
												if(articleType == 'Problem_Solution' + String.fromCharCode(172) + namespaceWithoutUnderscore){
													item.imageUrl=self.moduleIcons.KAProblem;
												}
												else if(articleType == 'Known_Error' + String.fromCharCode(172) + namespaceWithoutUnderscore){
													item.imageUrl=self.moduleIcons.KAError;
												}
												else if(articleType == 'How_To' + String.fromCharCode(172) + namespaceWithoutUnderscore){
													item.imageUrl = self.moduleIcons.KAHowTo;
												}
												else if(articleType == 'FAQ' + String.fromCharCode(172) + namespaceWithoutUnderscore){
													item.imageUrl=self.moduleIcons.KAFAQ;
												} 
												else{
													item.imageUrl=self.moduleIcons.KACustom;
												}
											}else{
												item.imageUrl=self.moduleIcons.KACustom;
											}
										}else if(sectionItem.type=='INCTEMPLATE'){
											item.isTmp = true;
											item.sourceType = 'tmp';
										    item.imageUrl = self.moduleIcons.Ticket;
										}else if(sectionItem.type=='SFKA'){
											item.imageUrl = self.moduleIcons.KASF;
											item.isSFkm=true;
											item.sourceType = 'SFkm';
											item.urlLink = sectionItem.URL;
										}	
										items.push(item);
									}
									
									);									
									var sectionItem={										
										'title':self.htmlDecode(section.title),										
										'items':items,
										'id':sectionCount+"_"+section.id,
										'isBanner':false,
										'displayType':'regular',
										'totalItemCount':items.length,		
										'orderNumber' :	sectionCount									
									};
									if(section.id=='SR'){
										sectionItem['isSrm'] = true;
										sectionItem['sourceType'] =  'srm';
									}else if(section.id=='SR'){
										sectionItem['isRkm'] = true;
										sectionItem['sourceType'] = 'rkm';
									}else if(section.id=='INCTEMPLATE'){
										sectionItem['isTmp'] = true;
										sectionItem['sourceType'] = 'tmp';
									}
									sections.push(sectionItem);
								});						
								
								deferred.resolve(sections);
							}else{
								deferred.reject();
							}
						});	
					return deferred.promise;							
		}; 		
		
		return self;
	}]);
