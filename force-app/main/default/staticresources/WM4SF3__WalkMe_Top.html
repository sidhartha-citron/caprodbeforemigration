<html>
	<head>
		<script src="../../soap/ajax/29.0/connection.js" type="text/javascript"></script>
		<script type="text/javascript">
			var sid = document.cookie.match('sid=([^;]*)')[1];
			sforce.connection.sessionId = sid;
			var result = sforce.connection.query("Select Id, WM4SF3__LicenseID__c, WM4SF3__Env__c, WM4SF3__Self_Hosted__c,WM4SF3__Test_Account__c,WM4SF3__QA_Mode__c,WM4SF3__Ext__c From WM4SF3__WalkMeLicense__c");
			var records = result.getArray("records");
			var LicenseNumber = records[0].WM4SF3__LicenseID__c;
			var Env = records[0].WM4SF3__Env__c;
			var QA_Mode = records[0].WM4SF3__QA_Mode__c;
			var user = sforce.connection.getUserInfo();
			
			
			(function() {
				
				var serverPrefix = (QA_Mode == 'false') ? 'd3b3ehuo35wzeh' : 'd3fqyenyxfs83e',
					EndPoint = Env == ('prod')  ? '' : '/'+ Env;

				var snippetPath = "https://" + serverPrefix + ".cloudfront.net/users/" + LicenseNumber + EndPoint + "/walkme_" + LicenseNumber + "_https.js";
				
				var walkme = top.document.createElement('script');
				walkme.type = 'text/javascript'; 
				walkme.async = true; 
				walkme.src = snippetPath;
				top.document.getElementsByTagName('head')[0].appendChild(walkme);
				var variables = top.document.createElement('script');
				variables.type = 'text/javascript';
				variables.innerText = 'var walkme_sf_vars = {}; window.walkme_sf_vars.profileId = "' + user.profileId + '"; window.walkme_sf_vars.roleId = "' + user.roleId + '"; window.walkme_sf_vars.userName = "' + user.userName + '"; window.walkme_sf_vars.organizationId = "' + user.organizationId + '";';
				top.document.getElementsByTagName('head')[0].appendChild(variables);
			})();
		</script>
	</head>
</html>