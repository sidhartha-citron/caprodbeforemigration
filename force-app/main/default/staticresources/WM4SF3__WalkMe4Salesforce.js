(function () {

	var SVNRevision = "$Rev: 223 $";
	
	log("WalkMe - Start (" + SVNRevision + ")");

// Logs are enabled by doing: document.cookie = "walkmeLogs=1; path=/"
	function log(msg)
	{
		if(document.cookie.indexOf("walkmeLogs=1") > -1)
		{
			try
			{
				console.log(msg);
			} 
			catch (e)
			{
	
			}
		}
	}
	
    var loadWalkMeSnippet = function () {
	
		log("loadWalkMeSnippet - called");
	
        setTimeout(function () {
		
		//console.debug('Before Init '+sforce.connection.sessionId);
	//	var sid = document.cookie.match('sid=([^;]*)')[1];
	//	sforce.connection.sessionId = sid;
		//console.debug('after Init '+sforce.connection.sessionId);
		
			try
			{
            var result = sforce.connection.query("Select Id, WM4SF3__LicenseID__c, WM4SF3__Env__c, WM4SF3__Self_Hosted__c,WM4SF3__Test_Account__c,WM4SF3__QA_Mode__c,WM4SF3__Ext__c From WM4SF3__WalkMeLicense__c");
            var records = result.getArray("records");
            var LicenseNumber = records[0].WM4SF3__LicenseID__c;
			var Env = records[0].WM4SF3__Env__c;
			var Self_Hosted = records[0].WM4SF3__Self_Hosted__c;
			var Test_Account = records[0].WM4SF3__Test_Account__c;
			var QA_Mode = records[0].WM4SF3__QA_Mode__c;
			var isExtEnabled = records[0].WM4SF3__Ext__c;
			}
			catch(e)
			{
				log(e);
			}
			
			log("WalkMe - records:");
			log(records);
			log("WalkMe - UserId=" + LicenseNumber);
			
            
			try {
				var doc = window.top.document;
				var head = document.getElementsByTagName('head')[0];
				var scriptElement = doc.createElement('script');
				scriptElement.async = true;
				
				
				if (Test_Account == 'false')
				{
					if (Self_Hosted == 'true')
					{
					
						scriptElement.src = "/resource/walkme_resources/walkme_" + LicenseNumber + "_https.js";
					}
					else
					{
						if (QA_Mode == 'false')
						{
							var EndPoint = Env == ('prod')  ? '' : '/'+ Env;
							scriptElement.src = "https://d3b3ehuo35wzeh.cloudfront.net/users/" + LicenseNumber + EndPoint + "/walkme_" + LicenseNumber + "_https.js";
						}
						else
						{
							var EndPoint = Env == ('prod')  ? '' : '/'+ Env;
							scriptElement.src = "https://d3fqyenyxfs83e.cloudfront.net/users/" + LicenseNumber + EndPoint + "/walkme_" + LicenseNumber + "_https.js";
						}
					}
				}
				else if (Test_Account == 'true')
				{
					scriptElement.src = "https://d3b3ehuo35wzeh.cloudfront.net/users/895c235ef8b247948c772bc8d0e544ea/walkme_895c235ef8b247948c772bc8d0e544ea_https.js";
				}
				else
				{
					log("Test_Account is not 'true' or 'false'. Probably undefined.");
					log("Currently you can inject the snippet in this page by yourself.");
				}
				if (isExtEnabled == 'true')
				{
					setTimeout(function() 
					{
						if (window.WalkMe_Extension != true)
						{
							head.appendChild(scriptElement);
						}
					}
					,100);
				}
				else
				{
					head.appendChild(scriptElement);
				}
				
				log("WalkMe - embedded script");
			}
			catch (e) 
			{ 
				log("WalkMe - Exception:");
				log(e);
			}
            
        }, 1)
    };
	
	function getParamsToSendToAnalytics(paramsString)
	{
		var paramsArray = paramsString.split(" ");
		var paramsToSend = new Array();
		
		for(var i=0;i<paramsArray.length;i++)
		{
			if(paramsArray[i].indexOf("@")>=0)
			{
				paramsToSend.push(paramsArray[i].replace("@",""));
			}
		}
		
		return paramsToSend;
	}
	
	function removeDefaultParametersFromString(parametersString,defaultUserInfoParameters)
	{
		if(parametersString == null)
		{
			return null;
		}
		
		parametersString = parametersString.replace(/@/g, '');
		
		for(var i=0;i<defaultUserInfoParameters.length;i++)
		{
			parametersString = parametersString.replace(defaultUserInfoParameters[i],"").trim();
		}
		
		return parametersString;
	}
	
	function prepareDefaultParamsToBeSetOnPage(userInfoObject,defaultUserInfoParameters)
	{
		var tempArray = {};
		
		for(var i=0;i<defaultUserInfoParameters.length;i++)
		{
			tempArray[defaultUserInfoParameters[i]] = userInfoObject[defaultUserInfoParameters[i]];
		}
		
		return tempArray;
	}
	
	function getUserParameterString()
	{
		// Getting all the information regarding the WalkMe account and license
		var result = sforce.connection.query("Select Id, WM4SF3__Param__c From WM4SF3__WalkMeLicense__c");
		var records = result.getArray("records");
		var paramsString = records[0].WM4SF3__Param__c;
		
		return paramsString;
	}
	
	// Returning the default user info parameters that we want to set on the page
	function getDefaultUserInfoParameters()
	{
		return ["userId","organizationId","organizationName"];
	}
	
	function getUserInfoParameters(parametersString, userInfoObject)
	{
		// split the textarea text into an array
		var paramsArray = parametersString.split(' ');
		
		// Selecting all the parameters
		var SOQL = "Select " + paramsArray.join(',') + " From User Where Id = '" + userInfoObject.userId + "'";
		
		var userExtendedFieldsXML = sforce.connection.query(SOQL);
		return userExtendedFieldsXML.getArray("records");	
	}
	/*
	function loadWalkMeSnippetLoader(){
	  
			setTimeout(function()
			{
				if (window.WalkMe_Extension != true)
				{
					loadWalkMeSnippet();
				}
			}
			,1000);
		 
	}
	*/
		
	if (window.attachEvent) {
				window.attachEvent('onload', loadWalkMeSnippet);
			} else {
				window.addEventListener('load', loadWalkMeSnippet, false);
			}
		
	setTimeout(function () {
	try
	{
	//	var sid = document.cookie.match('sid=([^;]*)')[1];
	//	sforce.connection.sessionId = sid;		
		
	/*	var defaultUserInfoParameters = getDefaultUserInfoParameters(); 
		
		var rawParameterString = getUserParameterString();
		
		var parametersString = removeDefaultParametersFromString(rawParameterString,defaultUserInfoParameters);
		
		var userInfo = sforce.connection.getUserInfo();
		
		var tempParametersContainer = prepareDefaultParamsToBeSetOnPage(userInfo,defaultUserInfoParameters);
		
		if(parametersString != null && parametersString !="")
		{
			var parametersArray = parametersString.split(' ');
			var userParameters = getUserInfoParameters(parametersString, userInfo);
			
			// creating vars on the page
			for(var i =0;i<parametersArray.length;i++) 
			{
				var key = [parametersArray[i]];
				var value = userParameters[0][parametersArray[i]];
				tempParametersContainer[key] = value;	
			}
			
			var paramsForAnalytics = getParamsToSendToAnalytics(rawParameterString);
			// sending the selected params to the analytics
			try
			{
				if(paramsForAnalytics.length > 0)
				{
					for(var i=0;i<paramsForAnalytics.length;i++)
					{
						WalkMeAPI.setAnalyticsCustomField(paramsForAnalytics[i],tempParametersContainer[paramsForAnalytics[i]]);
					}
				}
			}
			catch(e)
			{
				log(e);
			}
		}
		
		// adding the parameters to the page
		window.walkme_sf_vars = tempParametersContainer;
		*/
		//window.walkme_in_sidebar = true;
		

	}
	catch(e)
	{
		log(e);
	}
	}, 1)
})();