var graph;
var selectedInstanceName;
var selectedNode;
var mainObjRef;
var nodeToRestore = {};
var rootNode = getUrlVars()["id"];
var recSeq = getUrlVars()["RecordSequence"];
var module = getUrlVars()["Module"];
var changeId = '';
var instanceIdList ='';
var changeName = '';
var exceptionMsg = '';
var WinMsg;
function refreshDiagram(isDataModified) {
	if(isDataModified) {
		invokeServerRequest('genroot', recSeq, module);
	} else {
		closeSettingPage();
	}
}
function closeSettingPage() {
	tw.viz.visualization.closeSideBarExtendPanel();
	document.getElementById("viz-sidebar-menu-expand").style.width = "40%";
}

function invokeServerRequest(cmd, recSeq, modSeq)
{
	Visualforce.remoting.Manager.invokeAction(_RemotingActions.getGraphJSON, cmd, recSeq, modSeq,
		function(result, event) 
		{
			if(event.type === 'exception') {
				console.log("exception");
			} 
			else if (event.status) {	
				populatedRelationShips(result.edges, false);			
				tw.viz.visualization.reInit();
				tw.viz.visualization._handleData(convertGraphData(result));
				closeSettingPage();
			} 
			else {
				console.log(event.message);
			}
	},{escape: false});
}

function analyzeImpactHandler() {
	CloseNotificationPopUp();
	var node;
	mainObjRef.node_sel.each(function(d) {
		var t = d3.select(this).select("circle, rect");
		if (t.classed("selected") && node === undefined) {
			node = d;
		}
	});
	var screenWidth = 950;
	var screenHeight = 550;
	if(node){
		ImpactAnalysisWindowHandler=window.open('/apex/ImpactAnalysis?parentId=&popupHeader=&isFromCILauncher=true&sourceCIElem='+node.actualId,'ImpactAnalysis',"status = 1,height =550,width =950, resizable = 1,scrollbars=yes");
		if(ImpactAnalysisWindowHandler.focus) 
		{
		ImpactAnalysisWindowHandler.focus() ;
		}
	}
}

function getUrlVars() {
    var vars = {};
    var parts = window.location.href.replace(/[?&]+([^=&]+)=([^&]*)/gi, function(m,key,value) {
        vars[key] = value;
    });
    return vars;
}
function genLabelPrefix(nodeType)
{
	var label = '';
		
	switch (nodeType)
	{
		case "Incident":
			label = labels.Incident;
			break;
		case "Task":
			label = labels.Task;
			break;
		case "Change_Request":
			label = labels.Change;
			break;
		case "Problem":
			label = labels.Problem;
			break;
		case "Release":
			label = labels.Release;
			break;
	}

	return label;
}

function convertGraphData(local_data) {
	adj_data = {
		nodes: {},
		links: []
	};
	var isRootNodeSet = false;
	graph = local_data;
	// Nodes.
	local_data.nodes.forEach(function (n) {
		adj_data.nodes[n.uid] = {};
		var node = adj_data.nodes[n.uid];
		
		var arrTooltipFields, html='';
		if (typeof(n.hoverText) === 'undefined')
		{
			html = '</span>' + genLabelPrefix(n.type.replace(/__c/g,"")) + " " + Ext.util.Format.htmlEncode(n.name) + '</span>';
		}
		else
		{
			arrTooltipFields = n.hoverText.split("1s2a3m4i5r");

			var isImpacted = (n.image.indexOf("_Error") != -1);
			var impacted_ttip = "";
			if (isImpacted) 
			{
				impacted_ttip = '<div class="ci_impacted_ttip"><i class="ci_impacted">&nbsp;</i>'+ labels.Impacted + '</div>';

				if(n.type != "CI" || n.type !="service")
				{
					html = '<div class="ttipTable">' + 
					'<div style="text-align: center;"><span class="ttipHeader1" style="white-space:normal;">' + Ext.util.Format.htmlEncode(n.name) + impacted_ttip +'</span></div>';
				}
				else
				{
					html = '<div class="ttipTable">' + 
					'<div><span class="ttipHeader1" width="25%">' +  genLabelPrefix(n.type.replace(/__c/g,"")) + '</span><span class="ttipHeader1" style="white-space:normal;">' + Ext.util.Format.htmlEncode(n.name) + impacted_ttip +'</span></div>';
				}
			}
			else
			{
				if(n.type != "CI" || n.type !="service")
				{
					html = '<div class="ttipTable">' + 
					'<div style="text-align: center;"><span class="ttipHeader1" style="white-space:normal;">' + Ext.util.Format.htmlEncode(n.name) + '</span></div>';
				}
				else
				{
					html = '<div class="ttipTable">' + 
					'<div><span class="ttipHeader1" width="27%">' + genLabelPrefix(n.type.replace(/__c/g,""))  + '</span><span class="ttipHeader1" style="white-space:normal;">' + Ext.util.Format.htmlEncode(n.name) + '</span></div>';
				}
			}		
			
			if (arrTooltipFields != null)
			{
				arrTooltipFields.forEach(function (arrTooltipField, t)  
				{
					// var arrTooltipField = arrTooltipFields[t];
					var arrTooltip = arrTooltipField.split(":");
					if (arrTooltip != null && arrTooltip.length >= 2)
					{
						if (arrTooltip.length == 2)
							html += '<div><span class="ttipHeader2" >' + arrTooltip[0] + ':</span><span class="ttipLabel">' + Ext.util.Format.htmlEncode(arrTooltip[1]) + '</span></div>';
						else
						{
							var valueField = "";
							for (k=1; k < arrTooltip.length; k++)
							{
								valueField += arrTooltip[k];
								if (k != (arrTooltip.length - 1))
									valueField += ":";					
							}
							html += '<div><span class="ttipHeader2">' + arrTooltip[0] + ':</span><span class="ttipLabel">' + Ext.util.Format.htmlEncode(valueField) + '</span></div>';
						}
					}
				});
			}
			
			html += '</div>';                      
		}
		node.actualName = n.name;
		node.name = html;
		var text = n.label;
		if(text.indexOf("\n") > 0)
			text=text.replace("\n",'('+n.instType+')\n');
		else
			text=text+'('+n.instType+')';
		node.short_name = text;
		node.id = n.uid;
		node.actualId = n.id;
		node.removed = false;
		node.review_suggested = false;
		node.shared = false;
		node.shared_override = null;
		node.assetruleclassimage = n.assetruleclassimage;
		node.image = n.image;
		node.kind = n.ciClassName;
		node.type = "";
		node.nodeType = n.type;
		node.instType = n.instType;
		node.depth = 0;
		node.edge_neighbours = 0;
		node.hull = null;
		node.color_info = {};
		node.collection = "";
		node.extra_data = {};
		node.manual_groups = [];
		node.model_defs = [];
		if(n.ciType != '' && (n.id === rootNode || n.isRootNode === true)) {
			node.root = true;
			isRootNodeSet = true;
			selectedInstanceName = n.name;
			selectedNode = node;
			updateDetailHeader(node);
		} else {
			node.root = false;
		}
	});

	if(!isRootNodeSet && graph && graph.nodes[1]){
		var graphNode = graph.nodes[1];
		var node = adj_data.nodes[graphNode.uid];
		node.root = true;
		isRootNodeSet = true;
		//selectedInstanceName = graphNode.name;
		selectedNode = node;
		updateDetailHeader(node);
	}

	// Links.
	local_data.edges.forEach(function (edge, index) {
		adj_data.links[index] = {};
		var link = adj_data.links[index];
		if (edge.arrowStyle === "LeftToRight") {
			link.src_id = edge.leftNodeId;
			link.tgt_id = edge.rightNodeId;
			link.style = "arrow";
		} else if (edge.arrowStyle === "RightToLeft") {
			link.src_id = edge.rightNodeId;
			link.tgt_id = edge.leftNodeId;
			link.style = "arrow";
		} else {
			link.src_id = edge.rightNodeId;
			link.tgt_id = edge.leftNodeId;
			link.style = "peer";
		}
		link.rel_id = link.src_id + link.tgt_id;
		link.removed = false;
		link.arrowType = edge.type;
		link.lineWeight = edge.lineWeight;
		link.type = edge.relationType;
		link.fillColor = edge.fillColor;
	});

	//console.log(adj_data);
	return adj_data;
}

/*function handleAdditionalLinks(data) {
	data.nodes.forEach(function(node, k) {	
		if (typeof(getDiagramNodeByUID(node.uid)) != "undefined")
		{
			return true;
		}
		graph.nodes.push(node);
	});
	
	data.nodes.forEach(function(node) {
		var nodeId = node.uid;
		var nodeClassType = node.ciType;
		data.edges.forEach(function(edge) {
			var edgeExist=false;
			for (i = 0; i < graph.edges.length; i++)
			{
				if (edge.leftNodeId == graph.edges[i].leftNodeId && edge.rightNodeId == graph.edges[i].rightNodeId)
				{
						edgeExist = true;
						break;
				}
			}
			if(edgeExist==false){
				graph.edges.push(edge);
			}
		});
	});
	return graph;
}*/

function getDiagramNodeByUID(uid)
{
	var node;

	for ( i = 0; i < graph.nodes.length; i++)
	{
		if (graph.nodes[i] && graph.nodes[i].uid == uid)
		{
			node = graph.nodes[i];
			break;
		}
	}
	return node;
}

function renderClassesList(objref, sidebar_div) {
	var tbody = "";
	if(sidebar_div === undefined) {
		d3.select("#classListTable").select("tbody").html("");
		tbody = d3.select("#classListTable").select("tbody");
	} else {
		tbody = sidebar_div.append("table")
			.attr("class", "sideBarDropdownTable")
			.attr("id", "classListTable")
			.append("tbody");
	}
	var kinds_counts = objref.getHideableNodeKinds(),
	symbol_list  = objref.options.icons === undefined ? objref.options.shapes
													: objref.options.icons,
	menu_items   = [];
	
	// Create a sorted list of stuff we want to see
	Object.keys(kinds_counts).forEach(function (kind) {
		var count = kinds_counts[kind],
			lkind = symbol_list[kind] ? symbol_list[kind][0] : kind;

		menu_items.push([ kind, count, lkind ]);
	});
	menu_items.sort();

	// Insert the table

	var tr_dat = tbody
		.selectAll("tr")
		.data(menu_items, function(d) { return d[0]; });

	var trs = tr_dat
		.enter()
		.append("tr")
		.on("click", bindContext(objref, function(d) {
			var kind    = d[0],
				sel     = d3.select("input[id='showHideInput_" + kind + "']"),
				checked = sel.property("checked");

			if (d3.event.target.tagName.toLowerCase() !== "input") {
				// tr has been clicked, toggle the checkbox
				checked = !checked;
				sel.property("checked", checked);
				if(checked) {
					document.getElementById('checkbox_div_showHideInput_' + kind).classList.add("checked");
				} else {
					document.getElementById('checkbox_div_showHideInput_' + kind).classList.remove("checked");
				}
			}

			objref.showHide(kind, checked);
		}));

	tr_dat
		.exit()
		.remove();

	trs.each(function(d) {

		var tr = d3.select(this),
			input_id = "showHideInput_" + d[0];
		var checked = d[0] in objref.hidden_kinds ? null : "checked";
		var checkBox = tr.append("td");
		checkBox.append("input")
			.attr("type", "checkbox")
			.attr("id", input_id)
			.attr("class", "classes-checkbox")
			.attr("checked", checked);
		
		
		checkBox.append("div")
			.attr("class", "checkbox-container " + checked)
			.attr("id", "checkbox_div_"+input_id);

		tr.append("td")
			.text(d[1]);

		tr.append("td")
			.node()
			.appendChild(objref.createNodeIconElement(d[0]));

		if (d[2]) {
			tr.append("td")
				.text(d[2]);
		}
		else {
			// Display empty node kind appropriately.
			tr.append("td")
				.append("i")
				.text(objref.SHOW_HIDE_UNKNOWN);
		}
	});
	
}

function getNodeIcon(node, objref) {
	var pattern = /[a-zA-Z0-9]{15}|[a-zA-Z0-9]{18}/;
	var path = resourceURL + "/images/ci/";
	var nodeImage=node.image;
	if(node.instType=='CI / Asset') {
		if(node.assetruleclassimage.indexOf('null_32') != -1 || node.assetruleclassimage == '')
			nodeImage=node.image;
		else
			nodeImage=node.assetruleclassimage;
	}
	if((nodeImage.length == 15 || nodeImage.length == 18) && pattern.test(nodeImage)){
		path=window.opener.getSFDocumentURL(nodeImage);
	}
	if(!objref.options.icons) {
		objref.options.icons = {}; 
	}
	objref.options.icons[node.kind] = [node.kind, path + nodeImage];
	return path + nodeImage;
}

function enableAnalyzeImpactButton(isEnableBtn) {
	/* If only selected node is not of type CI/Asset then don't enable analyzeImpact */
	if(isEnableBtn && mainObjRef && mainObjRef.node_sel && mainObjRef.node_sel.size()>0){
		mainObjRef.node_sel.each(function(d) {
			var t = d3.select(this).select("circle, rect");
				if (t.classed("selected") && d.instType == '' && !d.visible) {
					isEnableBtn = false;
				}
		});
	}
	var AnalyzeImpact = document.getElementById('AnalyzeImpact');
	var header = document.getElementById('DetailsHeader');
	var detailSection = document.getElementById('DetailSectionContainer');
	if(isEnableBtn) {
		AnalyzeImpact.classList.add("AnalyzeImpactEnable");
		header.style.display = "block";
		detailSection.style.display = "block";
	} else {
		AnalyzeImpact.classList.remove("AnalyzeImpactEnable");
		header.style.display = "none";
		detailSection.style.display = "none";
	}
	
}
function enableLinkMenuItem(count){
	/* If only selected node is not of type CI/Asset then don't enable Link menu */
		if(mainObjRef && mainObjRef.node_sel && mainObjRef.node_sel.size()>0){
			mainObjRef.node_sel.each(function(d) {
				var t = d3.select(this).select("circle, rect");
					if (t.classed("selected") && d.instType == '' && !d.visible) {
						count = count - 1;
					}
			});
		}

	var SelectAndLinkCR = document.getElementById('SelectAndLinkCR');
	var CreateAndLinkCR = document.getElementById('CreateAndLinkCR');
	if(count>0){
		SelectAndLinkCR.classList.add("SelectAndLinkCREnable");
		CreateAndLinkCR.classList.add("CreateAndLinkCREnable");
	}else{
		SelectAndLinkCR.classList.remove("SelectAndLinkCREnable");
		CreateAndLinkCR.classList.remove("CreateAndLinkCREnable");
	}
}

function addDetailHeaderEvent() {
	document.getElementById('icon-container').addEventListener('click', function (event) {
		var header = document.getElementById('DetailsHeader');
		var container = document.getElementById('DetailSectionContainer');
		var icon = document.getElementById('show-hide-icon');
		if(icon.classList.contains("show-icon")) {
			header.style.bottom = '350px';
			container.style.height = '350px';
			loadDetailPage(selectedNode);
		} else {
			header.style.bottom = '0px';
			container.style.height = '0px';
		}
		icon.classList.toggle('hide-icon');
		icon.classList.toggle('show-icon');
		
	});
	enableAnalyzeImpactButton(true);
    enableLinkMenuItem(1);
}
function loadDetailPage(node) {
	var filterClause ='';
	if(node.kind != 'BMC_BusinessService') {
		filterClause = escape('Fkey__c != \'FKBusinessService__c\'');
	}
	var iFrameSrc='/apex/SIContainerPage?oid=&instID=' + node.actualId + '&otype=BMC_BaseElement__c&wid=&isInactive=false&filterClause='+ filterClause +'&isCIExplorer=true&isModernUI=true';
	var SIIframeIDElem = document.getElementById('SIIframeID');
	if(SIIframeIDElem){
		SIIframeIDElem.style.display = 'none';
		SIIframeIDElem.src = iFrameSrc;
		SIIframeIDElem.style.display = 'block';
	}
}

function updateDetailHeader(node) {
	if(mainObjRef && mainObjRef.node_sel && mainObjRef.node_sel.size()>0){
		mainObjRef.node_sel.each(function(d) {
			var t = d3.select(this).select("circle, rect");
			if (t.classed("selected") && d.instType != '' && d.visible) {
				node = d;
			}
		});
	}
	if(typeof node != 'undefined' && node.instType != ''){
			var title = document.getElementById('instance-name');
			var icon = document.getElementById('show-hide-icon');
			if(title){
				var html = '<a href="#" id="CIExplorerInstTitleLink" class="CIExplorerInstTitleLink" onclick=showPopup("bmc_baseelement__c","' + node.actualId + '","ciexplorer");>'+ node.actualName + '</a>';
				title.innerHTML = html;
			}
			if(icon.classList.contains("hide-icon")) {
				loadDetailPage(node);
			}
		}
}
window.onresize = function() {
	var icon = document.getElementById('show-hide-icon');
	if(icon.classList.contains("hide-icon")) {
		loadDetailPage(selectedNode);
	}
};
function getIsAllowedtoSave() {
	return isSettingPageVisible;
}
var clsName, recName, sequenceId;
		
function showPopup(className, RecordName, seqId)
{
	clsName = className;
	recName = RecordName;
	sequenceId = seqId;
	// checkPermission(className,RecordName);
	showScreen();
}
function get_url_parameter( param ){
	param = param.replace(/[\[]/,"\\\[").replace(/[\]]/,"\\\]");;
	var r1 = "[\\?&]"+param+"=([^&#]*)";
	var r2 = new RegExp( r1 );
	var r3 = r2.exec( window.location.href );
	if( r3 == null ){return ""}
	else {return r3[1]};
} 

function showScreen() 
{
	var title;
	if(true)
	{
		if(clsName == 'bmc_baseelement__c')
		{
			window.parent.parent.CMDB_RecordID = recName+'@@'+sequenceId;
			var cmdwin = window.parent.parent.CMDBManagerWin;
			if(cmdwin != null && cmdwin && cmdwin.CheckAndOpenInstance) {
				cmdwin.CheckAndOpenInstance();
			}
			//if std form,open in new window
			if(get_url_parameter('wid')==null || get_url_parameter('wid')=='') {
				var CIExplorerInstTitleVal='',CIExplorerInstTitleLink = document.getElementById("CIExplorerInstTitleLink");
				if(typeof CIExplorerInstTitleLink != 'undefined' && CIExplorerInstTitleLink.text != 'undefined') 
					CIExplorerInstTitleVal = CIExplorerInstTitleLink.textContent;
				var cmdbRecordId = recName+'@@'+sequenceId;
				window.open("/apex/CMDBManager?id=1010&cmdbRecordId="+cmdbRecordId+'&instNameFromCIExplorer='+CIExplorerInstTitleVal);
			}
			else 
			{
				window.parent.parent.addNewTab("CMDBManager", labels.configurationitems,"NavigatorPage?title=&tabName="+title+"&target=CMDBManager?id=1010");
			}
		}            
	}
	else
	{                    
		Ext.Msg.alert('', labels.userpermissionmsg); 
	}
}


function getSelectedinstances(){
	instanceIdList = '';
	mainObjRef.node_sel.each(function(d) {
		var t = d3.select(this).select("circle, rect");
		if (t.classed("selected") && d.nodeType == 'CI') {
			instanceIdList+= d.actualId+',';
			//instanceIdList+= d.recordId+',';	
		}
	});
	instanceIdList = instanceIdList.slice(0,-1);
}

function createLinkToNewCR(){
	CloseNotificationPopUp();
	popUploader(true);
	getSelectedinstances();
	if(instanceIdList.length > 0){
		var selectedInstIds = JSON.stringify(instanceIdList);
		LinkToNewCR(selectedInstIds);
	}else{
		ShowInlineSaveMsg();
	}
}


function createLinkToExistingCR(){
	popUploader(true);
	getSelectedinstances();	
	if(instanceIdList.length > 0){	
		var selectedInstIds = JSON.stringify(instanceIdList);
		LinkToExistingCR(changeId,selectedInstIds);
	}else{
		ShowInlineSaveMsg();
	}
}

function openSearhAndLink(){
	CloseNotificationPopUp();
	var url = "SearchAndLink?parentName=BMC_BaseElement__c&childName=Change_Request__c&isLookUp=true&isCalledFrom=newCMDBExplorer";
	var screenWidth = 1000;
    var screenHeight = 600;
	window.open('/apex/'+url,"_blank","status = 1,height ="+screenHeight+",width ="+ screenWidth+",left="+parseInt((screen.availWidth/2) - (screenWidth/2))+",top="+parseInt((screen.availHeight/2) - (screenHeight/2))+", resizable = yes, scrollbars=no" );
}

function ShowInlineSaveMsg(){
   popUploader(false);
   var SaveMessageDiv=document.getElementById('SaveMessageDiv');
   var saveMsgText = document.getElementById('saveMsgText');
   var saveMsgClose = document.getElementById('saveMsgClose');
   SaveMessageDiv.classList.remove('d-notification_success');
   SaveMessageDiv.classList.remove('d-notification_error');
   SaveMessageDiv.firstElementChild.classList.remove('d-icon-left-check');
   SaveMessageDiv.firstElementChild.classList.remove('d-icon-left-exclamation_triangle');
   if(SaveMessageDiv!=null && SaveMessageDiv!='undefined'){
		if(instanceIdList.length > 0 && changeName != '' && exceptionMsg == ''){
			SaveMessageDiv.classList.add('d-notification_success');
			SaveMessageDiv.firstElementChild.classList.add('d-icon-left-check');
			var changeLink = document.createElement('a');
			changeLink.setAttribute('class','changeLink')
			changeLink.setAttribute('onclick','openChangeRequest()');
			changeLink.innerHTML = changeName;
			saveMsgText.innerText = labels.CisSuccessfullLinkMsg + ' ';
			saveMsgText.appendChild(changeLink);
			saveMsgClose.setAttribute('style','display:block;background:#89c341;');
		}else if(instanceIdList.length > 0 && changeName == '' && exceptionMsg != ''){
			SaveMessageDiv.classList.add('d-notification_error');
			SaveMessageDiv.firstElementChild.classList.add('d-icon-left-exclamation_triangle');
			saveMsgClose.setAttribute('style','display:block;background:#f83200;');
			saveMsgText.innerText = labels.Error + ' : ' + exceptionMsg;
			exceptionMsg = '';
		}else{
			SaveMessageDiv.classList.add('d-notification_error');
			SaveMessageDiv.firstElementChild.classList.add('d-icon-left-exclamation_triangle');
			saveMsgClose.setAttribute('style','display:block;background:#f83200;');
			saveMsgText.innerText = labels.Error + ' : ' + labels.SelectAtLeastOneCI;
		}  
		SaveMessageDiv.style.display = "table";
		var PanelWidth,divWidth,leftAlign;
   		PanelWidth=document.getElementById('InlineVisualizationInner').clientWidth;	 
		divWidth = SaveMessageDiv.clientWidth;
		if(PanelWidth!=null && PanelWidth!='undefined' && divWidth!=null && divWidth!='undefined' ){
			leftAlign = parseInt((PanelWidth/2)-(divWidth/2)-35);
		} 
		SaveMessageDiv.setAttribute('style','left: '+ leftAlign +'px;');
		SaveMessageDiv.classList.add("Save-Message-Div");

	}	
}

function CloseNotificationPopUp(){
	changeName = '';
	changeId = '';
	document.getElementById('SaveMessageDiv').setAttribute('style','display:none;');
	document.getElementById('saveMsgClose').setAttribute('style','display:none;');
}

function popUploader(action){
    var popupLoader = document.getElementById('ciExplorerPopUpLoader');
    var loaderDiv = document.getElementById('loaderDiv');
    if(popupLoader && loaderDiv){
        if(action){
            popupLoader.style.display = 'inline-block';
            loaderDiv.style.display = '';
        }else{
            popupLoader.style.display = 'none';
            loaderDiv.style.display = 'none';
        }
    }
}

function getPrefixforURL() {
	if(typeof isLightningExperience != 'undefined' && isLightningExperience){
		return '/one/one.app#/alohaRedirect/apex/'+nameSpace+'__';
    } else return '/apex/';
}

function openChangeRequest(){
	var url = getPrefixforURL() + 'RemedyforceConsole?record_id='+changeId+'&objectName=Change_Request__c';
	window.open(url);
}
function GetMessageBox( baseCls ) {
	if(WinMsg == null){
		WinMsg = Ext.create('Ext.window.MessageBox');
	}	
	WinMsg.baseCls = baseCls;
	return WinMsg;
}

function closeCMDBExplorer(){
	var InlineVisualization = document.getElementById('InlineVisualization');
	var DetailsHeader = document.getElementById('DetailsHeader');
	var softwareContextViz = d3.select("svg.softwareContextViz")[0][0];
	if(InlineVisualization){
		InlineVisualization.style.opacity = "0.5";
		InlineVisualization.style.pointerEvents = "none";
	}
	if(DetailsHeader){
		DetailsHeader.style.opacity = "0.5";
		DetailsHeader.style.pointerEvents = "none";
	}
	if(softwareContextViz){
		softwareContextViz.style.pointerEvents = "none";
	}
	GetMessageBox('bmc-message').show({
		title: labels.title,
		msg: labels.NoRelExist,
		height: 400,
		buttons: Ext.Msg.OK,
		icon: Ext.MessageBox.INFO,
		fn : function(btn){
			window.close();
		}
	});
}

function recenterOnWindowResize(){
	try{
		var viewSize = Ext.getBody().getViewSize();
		var height = viewSize.height;
		var width = viewSize.width;
		var msgTxt = document.getElementById('setMessgeTxt');
		var msgTxtTspan = document.getElementById('wrapTextTspan');
		if(msgTxt && msgTxtTspan){
			msgTxt.setAttribute('x',width/2);
			msgTxt.setAttribute('y',height/2);
			msgTxtTspan.setAttribute('x',width/2);
			msgTxtTspan.setAttribute('y',height/2);
		}
	}catch(e){
		console.log(e);
	}
}

Ext.onReady(function() {
	if(closeCMDBExp){
		closeCMDBExplorer();
	}
});

Ext.EventManager.onWindowResize(function () {
	recenterOnWindowResize();
});