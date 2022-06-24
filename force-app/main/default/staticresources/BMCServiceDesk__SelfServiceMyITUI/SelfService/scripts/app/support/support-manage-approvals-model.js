  angular.module('supportModule')
    .factory('manageApprovalsModel', ['$q', 'supportService', 'urlSanitizerService',
      function ($q, supportService, urlSanitizerService) {
        var self = {};
		self.dataLoading = true;
		self.isPreviousEnabled = false;
		self.isNextEnabled = false;
		self.currentPageNo = 1;
		self.strRFObjectsAPIFieldSetPresent = '';
		self.strRFObjectsAPIName = '';
		self.strNonRFObjectsAPIFieldSetPresent = '';
		self.disableClearAllBtn = true;
		self.disableSelectAllBtn = false;
		self.disableReassignBtn = true;
		self.disableApproveRejectBtn = true;
		
		self.resetManageApprovalData = function() {
			self.dataLoading = true;
			self.isPreviousEnabled = false;
			self.isNextEnabled = false;
			self.currentPageNo = 1;
			self.strRFObjectsAPIFieldSetPresent = '';
			self.strRFObjectsAPIName = '';
			self.strNonRFObjectsAPIFieldSetPresent = '';
			self.disableClearAllBtn = true;
			self.disableSelectAllBtn = false;
			self.disableReassignBtn = true;
			self.disableApproveRejectBtn = true;
			self.approvalItems = [];
		}
		
		self.resetMassActionBtnValues = function() {
			self.disableClearAllBtn = true;
			self.disableSelectAllBtn = false;
			self.disableReassignBtn = true;
			self.disableApproveRejectBtn = true;
		}
		
        return self;
        }
    ]);