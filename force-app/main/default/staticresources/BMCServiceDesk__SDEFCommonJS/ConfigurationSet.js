var app = angular.module('configurationSetApp', []);
app.controller('configurationSetCtrl', ['$scope','$sce', 'remoteService', '$interval', function ($scope,$sce, remoteService, $interval) {
    $scope.resetImport = function() {
        $scope.errorFound = false;
        $scope.isVersionMismacth = false;
        $scope.configData = {};
        $scope.isImportingCompeted = false;
        $scope.username = '';
        $scope.password = '';
        $scope.SourceOrgId;
        $scope.orgName = '';
        $scope.SourceOrgSbx;
        $scope.configSetLogId;
        $scope.displayLoginScreen = true;
        $scope.displayMigrationScreen = false;
        $scope.displayWarningScreen = false;
        $scope.displayDataStatusScreen = false;
        $scope.infoMessage = '';
        $scope.displayDataStatusScreen = false;
        $scope.errorMessages = [];
        $scope.stepAsyncJobIds = {};
        $scope.invID = undefined;
        $scope.maxSteps=10;
        $scope.currentStep=1;
        $scope.displayReportLink = false;
        $scope.displayRequestDefList = false;
        $scope.reportUrl;
        $scope.srdCount;
        $scope.viewImportLog='';
        $scope.importLogSuccess = $sce.trustAsHtml(ImportLogSuccess.replace('{1}' , '<a ng-href="{{reportUrl}}" target="_blank">'+ViewLog+'</a>'));
        $scope.importLogFailure = $sce.trustAsHtml(ImportLogFailure.replace('{0}' , '<a ng-href="{{reportUrl}}" target="_blank">'+ViewLog.toLowerCase()+'</a>'));
    }
    $scope.resetImport();

        $scope.createRemoteSite = function (name, description, remoteURL) {
            var binding = new XMLHttpRequest();
            var request =
                '<?xml version="1.0" encoding="utf-8"?>' +
                '<env:Envelope xmlns:env="http://schemas.xmlsoap.org/soap/envelope/" xmlns:xsd="http://www.w3.org/2001/XMLSchema" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance">' +
                '<env:Header>' +
                '<urn:SessionHeader xmlns:urn="http://soap.sforce.com/2006/04/metadata">' +
                '<urn:sessionId>' + sessionId + '</urn:sessionId>' +
                '</urn:SessionHeader>' +
                '</env:Header>' +
                '<env:Body>' +
                '<createMetadata xmlns="http://soap.sforce.com/2006/04/metadata">' +
                '<metadata xsi:type="RemoteSiteSetting">' +
                '<fullName>' + name + '</fullName>' +
                '<description>' + description + '</description>' +
                '<disableProtocolSecurity>false</disableProtocolSecurity>' +
                '<isActive>true</isActive>' +
                '<url>' + remoteURL + '</url>' +
                '</metadata>' +
                '</createMetadata>' +
                '</env:Body>' +
                '</env:Envelope>';
            binding.open('POST', 'https://' + host + '/services/Soap/m/47.0');
            binding.setRequestHeader('SOAPAction', '""');
            binding.setRequestHeader('Content-Type', 'text/xml');
            binding.onreadystatechange =
                function () {
                    if (binding.readyState == 4) {
                        var parser = new DOMParser();
                        var doc;
                        var messageText = '';
                        var isIE11 = window.location.hash = !!window.MSInputMethodContext;
                        
                        if (Ext.isIE || isIE11) {
                            doc = new ActiveXObject("Microsoft.XMLDOM");
                            doc.loadXML(binding.responseText);
                            if (doc.selectSingleNode("/soapenv:Envelope/soapenv:Body/createMetadataResponse/result").childNodes != null) {
                                var nodes = doc.selectSingleNode("/soapenv:Envelope/soapenv:Body/createMetadataResponse/result").childNodes;
                                if (nodes != null && nodes.length > 2) {
                                    if (nodes[0].nodeName == "fullName" && nodes[1].nodeName == "success") {
                                        messageText = '';
                                    } else if (nodes[0].nodeName == "errors" && nodes[0].childNodes[1].nodeName == "message") {
                                        // Remote site creation failed
                                        messageText = nodes[0].childNodes[1].text;
                                    }
                                }
                            }
                        } else {
                            doc = parser.parseFromString(binding.response, 'application/xml');
                            var errors = doc.getElementsByTagName('errors');
                            for (var errorIdx = 0; errorIdx < errors.length; errorIdx++) {
                                console.log(errors.item(errorIdx))
                            }
                        }

                    }
                }
            var tes = binding.send(request);
        }

        $scope.proceedFurther = function () {
            $scope.errorFound = false;
            $scope.SourceOrgId = $scope.configData.sourceOrgId;
            $scope.SourceOrgSbx = $scope.configData.sandbox;
            $scope.orgName = $scope.configData.orgName;
            $scope.configSetLogId = $scope.configData.configSetLogId;
            $scope.infoMessage = '';
            $scope.loading = false;
            $scope.displayLoginScreen = false;
            $scope.displayMigrationScreen = true;
            document.getElementById('loginErrorPanel').style.visibility = 'hidden';
        }
        $scope.sfLogin = function () {
            $scope.loading = true;
            var logincred = {};
            logincred.username = $scope.username;
            logincred.password = $scope.password;
            let promise = remoteService.sfLogin(JSON.stringify(logincred));
            promise.then(function (result) {
                $scope.configData = JSON.parse(result);
                if ($scope.configData.session != null && $scope.configData.session != "null") {
                    var stepConfiguration = {
                        "session": $scope.configData.session,
                        "url": $scope.configData.url,
                    };

                    let versionPromise = remoteService.versionCheck(stepConfiguration);
                    versionPromise.then(function (result) {
                        if (result == '') {
                            $scope.proceedFurther();
                        } else if (result == 'Unauthorized endpoint') {
                            $scope.createRemoteSite('configurationSet_' + Date.now(), '', $scope.configData.serverURL);
                            let versionPromise2 = remoteService.versionCheck(stepConfiguration);
                            versionPromise2.then(function (result) {
                                if (result == '') {
                                    $scope.proceedFurther();
                                } else {
                                    $scope.setError(versionErrorMessage);
                                }
                            });
                        } else {
                            var resultObj = result ? JSON.parse(result) : result;
                            if(resultObj && resultObj.length > 0 && resultObj[0].message.indexOf('¶ऽӘП') != -1){
                                //To show object accessibility and version error
                                var excepString = resultObj[0].message.split('¶ऽӘП')[1];
                                $scope.setError(excepString);
                            }else if(resultObj && resultObj.length > 0 && resultObj[0].message){
                                //To show class accessibility error
                                $scope.setError(resultObj[0].message);
                            }
                        }
                    });
                } else {
                    $scope.setError(infoMessage);
                }
            }, function (event) {
                console.log(event.message + ": " + event.where);
            });
        }
        
        $scope.setError= function(message) {
            var loginErrorPanel                 = document.getElementById('loginErrorPanel');
            loginErrorPanel.style.visibility    ='visible';
            $scope.infoMessage                  = message;
            $scope.loading                      = false;
            loginErrorPanel.style.marginBottom = '10px';
        }
        
        $scope.importWarning = function () {
            $scope.infoMessage = warningMessage;
            $scope.displayMigrationScreen = false;
            $scope.displayWarningScreen = true;
            $scope.InitialHeaderStatus();
        }
        $scope.hideWarningScreen = function () {
            $scope.displayMigrationScreen = true;
            $scope.displayWarningScreen = false;
            $scope.infoMessage = '';
        }
        $scope.getRequestDefinationsList = function () {
            stopSpinner(true);
            $scope.displayMigrationScreen = false;
            $scope.displayRequestDefList = true;
            $scope.infoMessage = '';
            $scope.getRequestDefinations();

        }

        $scope.getRequestDefinations = function () {
            var stepConfiguration = {
                "session": $scope.configData.session,
                "url": $scope.configData.url,
            };
            $scope.getSettingsData(stepConfiguration);
        }


        $scope.getSettingsData = function (configuration) {
            let promise = startStep(configuration.session, configuration.url);
            promise.then(function (result) {
                $scope.stepAsyncJobIds[configuration.step] = result;
                $scope.startInterval();
            }, function (event) {
                $scope.infoMessage = SSGeneralErrorMessage + event.message;
                updateStepStatusOnError(configuration.step);
            });
        }

        $scope.startInterval = function () {
            if (angular.isDefined($scope.invID)) return;
            $scope.invID = $interval($scope.checkAsyncStatus, 2000);
        }

        $scope.checkAsyncStatus = function () {

        }
        $scope.executeStep = function (step) {

        }
        $scope.hideMessage = function () {
            $scope.infoMessage = '';
        }

        $scope.hideconfigurationSet = function () {
			var popupElement = document.getElementById('login-inputs');
			if(popupElement)
				popupElement.style.height  = '395px';
            document.getElementById("configurationSet").style.display = "none";
        }

        $scope.cancelMigration = function(){
            $scope.resetImport();
            $scope.hideconfigurationSet();
            resetStyle();
            document.getElementById('sandboxpassword').value = '';
            document.getElementById('sandboxusername').value = '';
            resultSize = false;
            renderTable();
            noRecordFoundElement.style.display = 'none'; 
			document.getElementById('okButton').style.display = 'none';
            var elements = document.getElementsByClassName('ApexComponent');
            for(i=0;i<elements.length ;i++)
                elements[i].style.display = 'none';

        }

        $scope.import = function () {
            $scope.displayDataStatusScreen = true;
			var loginInput = document.getElementById('login-inputs');
			if(loginInput){
				loginInput.style.height = "395px";
				loginInput.style.margin = "2% 33%";
			}
            $scope.infoMessage = ImportingRecords;
            $scope.displayRequestDefList = false;
            resetStyle();
            var stepConfiguration = {
                "session": $scope.configData.session,
                "url": $scope.configData.url,
                "step": $scope.currentStep+'',
                "configSetLogId": $scope.configData.configSetLogId
            };
            $scope.infoMessage = ImportingRecords;

            if($scope.currentStep == 1){
                var selectedSrdIds = remoteService.getSelectedSRDIdStr();
                if(selectedSrdIds && selectedSrdIds.indexOf(',') != -1){
                    $scope.srdCount = selectedSrdIds.split(',').length - 1;
                }
                var warningMsg = document.getElementById('warningMessageMaxRD');
                if(warningMsg){
                    warningMsg.style.display = 'none';
                }
                $scope.getConfigSetReport();
                $scope.applyElementsStyle(true,null);
            }

            let promise = remoteService.import(stepConfiguration);
			promise.then(function(result){
                if(result && result.status == 'SUCCESS'){
                    $scope.currentStep++;
                    if($scope.currentStep <= $scope.maxSteps){
                        $scope.import();
                    }else{
                        $scope.infoMessage = ImportSuccess.replace('{0}:','');
                        var importLogSuccessStr = $scope.importLogSuccess+'';
                        $scope.viewImportLog = importLogSuccessStr.replace('{0}',$scope.srdCount);
                        $scope.displayReportLink=true;
                        $scope.applyElementsStyle(false,true);
						document.getElementById('configSetUserWarning').style.display = 'none';
						document.getElementById('okButton').style.display = '';
                    }
                }else if (result && result.status == 'ERROR') {
                    $scope.infoMessage = CMDB2ScanErrorMsg + ' ' + ImportOperationFailed;
                    $scope.viewImportLog = $scope.importLogFailure;
                    $scope.displayReportLink=true;
                    $scope.applyElementsStyle(false,false);
					document.getElementById('configSetUserWarning').style.display = 'none';
					document.getElementById('okButton').style.display = '';
                }else{

                }
			});
        }

        $scope.applyElementsStyle = function(isInit, isSuccess){
            var configSetProgressObj = document.getElementsByClassName('configSetProgress');
            var importStatusTextObj = document.getElementsByClassName('importStatusText');
    
            if(isInit){
                if(configSetProgressObj && configSetProgressObj.length > 0){
                    configSetProgressObj[0].setAttribute('style','display:flex !important');
                }
                if(importStatusTextObj && importStatusTextObj.length > 0){
                    importStatusTextObj[0].setAttribute('style','color:#f86e00 !important');
                }
            }else{
                if(configSetProgressObj && configSetProgressObj.length > 0){
                    configSetProgressObj[0].setAttribute('style','display:none !important');
                }
                if(importStatusTextObj && importStatusTextObj.length > 0 && isSuccess){
                    importStatusTextObj[0].setAttribute('style','color:green !important');
                }else if(importStatusTextObj && importStatusTextObj.length > 0 && !isSuccess){
                    importStatusTextObj[0].setAttribute('style','color:red !important');
                }
            }
        }

        $scope.getConfigSetReport = function(){
            if($scope.configData && $scope.configData.configSetLogId){
                let promise = remoteService.getConfigSetReport($scope.configData.configSetLogId);
                promise.then(function(result){
                    if(result){
                        $scope.reportUrl = result;
                    }
                });
            }
        }

        $scope.hideconfigurationSet();
        $scope.createRemoteSite('SalesforceSandboxLogin', '', 'https://test.salesforce.com');
    }])
    .factory('remoteService', ['$q', function ($q) {
        let self = {};
        self.getStandardCallback = function (deferred) {
            let callback = function (result, event) {
                if (event.status) {
                    deferred.resolve(result);
                } else {
                    deferred.reject(event);
                }
            };
            return callback;
        };

        self.sfLogin = function (logincred) {
            let deferred = $q.defer();
            Visualforce.remoting.Manager.invokeAction(sfLoginRemote, logincred, self.getStandardCallback(deferred), {
                escape: false
            });
            return deferred.promise;
        };

        self.versionCheck = function (configuration) {
            let deferred = $q.defer();
            Visualforce.remoting.Manager.invokeAction(versionCheckRemote, configuration, self.getStandardCallback(deferred), {
                escape: false
            });
            return deferred.promise;
        }

        self.import = function (configuration) {
            let deferred = $q.defer();
            var selectedIds = self.getSelectedSRDIdStr();
            if (selectedIds) {
                self.srdCount = selectedIds.split(',').length-1;
                Visualforce.remoting.Manager.invokeAction(importRemote, selectedIds, configuration, self.getStandardCallback(deferred), {
                    escape: false
                });
            }
            return deferred.promise;
        };

        self.getSelectedSRDIdStr = function(){
            var selectedIds = '';
            checkboxes = document.getElementsByName('srds');
            for (var i = 0; i < checkboxes.length; i++) {
                if (checkboxes[i].checked) {
                    selectedIds += checkboxes[i].value + ',';
                }
            }
            return selectedIds;
        }

        self.getConfigSetReport = function (configSetLogId) {
            let deferred = $q.defer();
            Visualforce.remoting.Manager.invokeAction(configSetReport, configSetLogId, self.getStandardCallback(deferred), {
                escape: false
            });
            return deferred.promise;
        }

        return self;
    }]);

var sortField                   = 'LastModifiedDate';
var sortDirection               = 'DESC';

function showConfigurationSetComponent() {
    document.getElementById("configurationSet").style.display = "block";
}

function showError() {
    document.getElementById("errorMsgView").style.display = "block";
    document.getElementById("showErrId").style.display = "none";
    document.getElementById("HideErrId").style.display = "block";
}

function hideError() {
    document.getElementById("errorMsgView").style.display = "none";
    document.getElementById("showErrId").style.display = "block";
    document.getElementById("HideErrId").style.display = "none";
}

function setResetSelectAll(value) {
    if (value != undefined) {
        var allInput = document.getElementsByTagName('input');

        for (var i = 0; i < allInput.length; i++) {
            if (allInput[i].type == "checkbox") {
                allInput[i].checked = value;
            }
        }
    } else {
        console.log(value);
    }
}

function renderTable() {
    var toolbarDiv = document.getElementById('toolbarDiv');
    if(resultSize) {
        var elements = document.getElementsByClassName('ApexComponent');
        
        for(i=0;i<elements.length ;i++)
            elements[i].style.display = '';
        
        var popupElement = document.getElementById('login-inputs');
        popupElement.style.width = '70%';
        popupElement.style.height  = 'auto';
        popupElement.style.margin = '1% 12%';
        toolbarDiv.style.display = 'inline-block';
        var width = document.getElementById('pageBlockDiv').offsetWidth - 1.5;
        toolbarDiv.style.width = width+'px';  
        noRecordFoundElement.style.display = 'none'; 
    } else {
         noRecordFoundElement.style.display = 'inline-block'; 
        toolbarDiv.style.display = 'none';
        resetStyle();
    }
}    

function resetStyle() {
    var loginScreen = document.getElementById('login-inputs');
    loginScreen.style.width = '500px';
    loginScreen.style.margin = '5% 33%';
    loginScreen.style.Height = '395px';
}

function sortDataJSFunc(field) {
    if (sortField == field && sortDirection != 'DESC') {
        sortAction(field, 'DESC');
        sortDirection = 'DESC';
    }
    else {
        sortAction(field, 'ASC');
        sortDirection = 'ASC';
    }
    sortField = field;
    stopSpinner(true);
}

function stopSpinner(stop) {
    var mainDiv = document.getElementById('request-defination-list');
    var spinner = document.getElementById('Actionfunctionspinner');
    if (stop) {
        mainDiv.classList.add('disabledDiv');
        spinner.style.display = 'inline ';
    } else {
        mainDiv.classList.remove('disabledDiv');
        spinner.style.display = 'none ';
    }

}

function enableImport(event) {
    var importBtn = document.getElementById('import');
    checkboxes = document.getElementsByName('srds');
    
    if(document.querySelectorAll('input[type="checkbox"]:checked').length > 10){
        event.target.checked = false;
        var warningMsg = document.getElementById('warningMessageMaxRD');
        warningMsg.style.display = 'inline';
        setTimeout(function() {
            warningMsg.style.display = 'none';
        }, 5000);
		return;
    }
    
    for (var i = 0; i < checkboxes.length; i++) {
        if (checkboxes[i].checked) {
            importBtn.removeAttribute('disabled');
            importBtn.removeAttribute('style');
            return;
        }

    }
    importBtn.setAttribute('disabled','true');
    importBtn.style.opacity = '0.6';
}

angular.module('configurationSetApp').directive('bindHtmlCompile', ['$compile', function ($compile) {
    return function(scope, element, attrs) {
        scope.$watch(
          function(scope) {
            // watch the 'compile' expression for changes
            return scope.$eval(attrs.bindHtmlCompile);
          },
          function(value) {
            // when the 'compile' expression changes assign it into the current DOM
            element.html(value);
            // compile the new DOM and link it to the current scope.
            // NOTE: we only compile .childNodes so that we don't get into infinite loop compiling ourselves
            $compile(element.contents())(scope);
          }
      );
    };
}]);