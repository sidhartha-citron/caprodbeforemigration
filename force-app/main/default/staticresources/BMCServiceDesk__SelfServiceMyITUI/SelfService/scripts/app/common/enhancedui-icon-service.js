	angular.module('selfServiceApp')
		.factory('enhanceduiService', ['$uibModal',
			function ($uibModal) {
				var self = {};

				self.getModuleIcons = function () {
					var resourceUrl=$("a[id*='selfServiceResourcesUrl']").attr('href');
					var moduleIcons={};
					
					if(isSwitchToEnhancedUI){
						moduleIcons.Ticket=resourceUrl +'styles/img/ticket-32.svg';
						moduleIcons.KAFAQ=resourceUrl +'styles/img/ka-faq-32.svg';
						moduleIcons.KAHowTo= resourceUrl +'styles/img/ka-how-to-32.svg';
						moduleIcons.KAError= resourceUrl +'styles/img/ka-error-32.svg';
						moduleIcons.KAProblem= resourceUrl +'styles/img/ka-problem-32.svg';
						moduleIcons.KACustom=  resourceUrl +'styles/img/ka-custom-32.svg';
						moduleIcons.KASF=  resourceUrl +'styles/img/ka-sf-32.svg';
						moduleIcons.ServReq =resourceUrl +'styles/img/service-request-32.svg';											  
					}else{
						moduleIcons.Ticket=resourceUrl +'styles/img/Ticket_26.png';
						moduleIcons.KAFAQ=resourceUrl +'styles/img/KA_faq_26.png';
						moduleIcons.KAHowTo= resourceUrl +'styles/img/KA_howTo_26.png';
						moduleIcons.KAError= resourceUrl +'styles/img/KA_error_26.png';
						moduleIcons.KAProblem= resourceUrl +'styles/img/KA_problem_26.png';
						moduleIcons.KACustom=  resourceUrl +'styles/img/KA_custom_26.png';
						moduleIcons.KASF=  resourceUrl +'styles/img/KA_SF_26.png';
						moduleIcons.ServReq =resourceUrl +'styles/img/ServiceRequest_26.png';
					}
				   return moduleIcons;
				 
				};

				return self;
			}]
		);
