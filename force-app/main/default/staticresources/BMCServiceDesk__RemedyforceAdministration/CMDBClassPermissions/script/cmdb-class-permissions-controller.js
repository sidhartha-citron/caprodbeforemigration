var CMDBClassPermissionsModule=angular.module("CMDBClassPermissionsModule",["ui.sortable","ui.sortable.multiselection","ui.grid","rfmodal","ui.grid.selection","ui.grid.resizeColumns","ngSanitize","sidebarModule","ui.bootstrap","rf.ng.tooltip"]);CMDBClassPermissionsModule.config(["rfModalProvider",function(a){a.setDefaults({})}]);CMDBClassPermissionsModule.controller("CMDBClassPermissionsController",["$scope","cmdbClassPermissionsService","$q","rfModal","uiSortableMultiSelectionMethods","uiGridConstants","$timeout","$modal","$rootScope","confirmationDialogService","$filter","cloneFromDialogService",function(o,n,e,k,g,i,c,m,j,l,h,f){o._Labels={};o._Labels.Save=_Labels.Save;o._Labels.CMDBClassName=_Labels.CMDBClassName;o._Labels.Search=_Labels.Search;o._Labels.SearchClass=_Labels.SearchClass;o._Labels.SearchPs=_Labels.SearchPs;o._Labels.Clear=_Labels.Clear;o._Labels.ClassType=_Labels.ClassType;o._Labels.Yes=_Labels.Yes;o._Labels.No=_Labels.No;o._Labels.ciTab=_Labels.ciTab;o._Labels.assetTab=_Labels.assetTab;o._Labels.allTab=_Labels.allTab;o._Labels.Warning=_Labels.Warning;o._Labels.RecordSaved=_Labels.RecordSaved;o._Labels.Read=_Labels.Read;o._Labels.Create=_Labels.Create;o._Labels.Edit=_Labels.Edit;o._Labels.Delete=_Labels.Delete;o._Labels.EnableCMDBClassPermissions=_Labels.EnableCMDBClassPermissions;o._Labels.ListOfPermissionSets=_Labels.ListOfPermissionSets;o._Labels.CloneFrom=_Labels.CloneFrom;o._Labels.PermissionName=_Labels.PermissionName;o._Labels.PermissionFor=_Labels.PermissionFor;o._Labels.Reset=_Labels.Reset;o._Labels.Import=_Labels.Import;o._Labels.ResetTooltip=_Labels.ResetTooltip;o._Labels.ImportTooltip=_Labels.ImportTooltip;o._Labels.CloneTooltip=_Labels.CloneTooltip;o._Labels.ApplyCMDBClsTooltip=_Labels.ApplyCMDBClsTooltip;o._Labels.ImportPermissionMessage=_Labels.ImportPermissionMessage;o._Labels.ClonedSuccessfully=_Labels.ClonedSuccessfully;o._Labels.searchResult=_Labels.searchResult;o._Labels.HideCILabel=_Labels.HideCILabel;o._Labels.HideAssetLabel=_Labels.HideAssetLabel;o._Labels.HideCiAssetInfo=_Labels.HideCiAssetInfo;o._Labels.ClickHere=_Labels.ClickHere;o.isCMDBClassPermissionEnable=isCMDBClassPermissionEnable;o.getTableHeight=function(q){var r=35;var p=18;if(q=="psGrid"){p=95}return{height:(o.classPermissionOptions.data.length*r+p)+"px"}};o.ObjPermissionsInPS;o.controllerData={isFirstLoad:true,hideCiManagement:false,hideAssetManagement:false};o.toPsId;o.fromPsId;o.showImportBtn;o.enableResetBtn;o.isFormDirty;o.skipToggleCheckerAll=false;o.skipRemoteCall=true;o.filterData=[{label:_Labels.allTab,value:"All"},{label:_Labels.assetTab,value:"Asset"},{label:_Labels.ciTab,value:"CI"}];o.classFilter=o.filterData[0];o.checkAccess=function(q,r){o.isFormDirty=true;var p="";if(q.name=="read"){p="ReadAccess";if(q.value==false){r.CreateAccess.value=false;r.EditAccess.value=false;r.DeleteAccess.value=false}}if(q.name=="create"){p="CreateAccess";if(q.value==true){r.ReadAccess.value=true}}if(q.name=="edit"){p="EditAccess";if(q.value==false){r.DeleteAccess.value=false}else{r.ReadAccess.value=true}}if(q.name=="delete"){p="DeleteAccess";if(q.value==true){r.EditAccess.value=true;r.ReadAccess.value=true}}o.selectColHeader(p,q)};o.selectColHeaderOnLoad=function(q){var s=true;var p=$("#header-chbx-"+q);for(var r=0;r<o.classPermission.length;r++){if(o.classPermission[r][q].value==false){s=false;break}}if(o.classPermission.length<1){s=false}o.skipToggleCheckerAll=true;p.prop("checked",s).change();o.skipToggleCheckerAll=false};o.selectColHeader=function(p,v){var r=$("#header-chbx-ReadAccess");var q=$("#header-chbx-CreateAccess");var u=$("#header-chbx-EditAccess");var w=$("#header-chbx-DeleteAccess");var t=true;if(v.name=="read"){if(v.value==false){o.skipToggleCheckerAll=true;r.prop("checked",false).change();o.skipToggleCheckerAll=true;q.prop("checked",false).change();o.skipToggleCheckerAll=true;u.prop("checked",false).change();o.skipToggleCheckerAll=true;w.prop("checked",false).change()}else{for(var s=0;s<o.classPermission.length;s++){if(o.classPermission[s][p].value==false){t=false;break}}if(t){r.prop("checked",t).change()}}}if(v.name=="create"){if(v.value==false){o.skipToggleCheckerAll=true;q.prop("checked",false).change()}else{for(var s=0;s<o.classPermission.length;s++){if(o.classPermission[s][p].value==false){t=false;break}}if(t){o.skipToggleCheckerAll=true;r.prop("checked",t).change();o.skipToggleCheckerAll=true;q.prop("checked",t).change()}}}if(v.name=="edit"){if(v.value==false){o.skipToggleCheckerAll=true;u.prop("checked",false).change();o.skipToggleCheckerAll=true;w.prop("checked",false).change()}else{for(var s=0;s<o.classPermission.length;s++){if(o.classPermission[s][p].value==false){t=false;break}}if(t){o.skipToggleCheckerAll=true;r.prop("checked",t).change();o.skipToggleCheckerAll=true;u.prop("checked",t).change()}}}if(v.name=="delete"){if(v.value==false){o.skipToggleCheckerAll=true;w.prop("checked",false).change()}else{for(var s=0;s<o.classPermission.length;s++){if(o.classPermission[s][p].value==false){t=false;break}}if(t){o.skipToggleCheckerAll=true;r.prop("checked",t).change();o.skipToggleCheckerAll=true;u.prop("checked",t).change();o.skipToggleCheckerAll=true;w.prop("checked",t).change()}}}o.skipToggleCheckerAll=false};o.onHeaderChkClick=function(p){o.isFormDirty=true};o.toggleCheckerAll=function(t,z,q,y){if(!o.skipToggleCheckerAll){var v={};var p;if(t.col.name=="ReadAccess"){v.name="read"}else{if(t.col.name=="CreateAccess"){v.name="create"}else{if(t.col.name=="EditAccess"){v.name="edit"}else{v.name="delete"}}}v.value=t.col.allChecked;var x=$("#header-chbx-ReadAccess");var u=$("#header-chbx-CreateAccess");var w=$("#header-chbx-EditAccess");var r=$("#header-chbx-DeleteAccess");if(t.col.name=="ReadAccess"){if(t.col.allChecked==false){if(u.prop("checked")==true){u.prop("checked",false).change()}if(w.prop("checked")==true){w.prop("checked",false).change()}if(r.prop("checked")==true){r.prop("checked",false).change()}}else{if(x.prop("checked")==false){x.prop("checked",true).change()}}}else{if(t.col.name=="CreateAccess"&&t.col.allChecked==true){if(x.prop("checked")==false){x.prop("checked",true).change()}}else{if(t.col.name=="EditAccess"){if(t.col.allChecked==false){if(r.prop("checked")==true){r.prop("checked",false).change()}}else{if(x.prop("checked")==false){x.prop("checked",true).change()}}}else{if(t.col.name=="DeleteAccess"&&t.col.allChecked==true){if(x.prop("checked")==false){x.prop("checked",true).change()}if(w.prop("checked")==false){w.prop("checked",true).change()}}}}}for(var s=0;s<o.classPermission.length;s++){o.classPermission[s][t.col.name].value=t.col.allChecked;o.checkAccess(v,o.classPermission[s])}}o.skipToggleCheckerAll=false};o.filterPs={searchText:undefined};o.searchPs=function(){o.permissionSetJsonData=permissionSetJson;if(o.filterPs.searchText.length>0){var p={searchTxt:o.filterPs.searchText};if(isServerSearchForPS){n.findPS(p).then(function(q){o.permissionSetJsonData=JSON.parse(q)})}else{o.permissionSetJsonData=h("filter")(o.permissionSetJsonData,{name:o.filterPs.searchText})}}else{if(o.currSelectedRow){o.skipConfirmation=true;o.psGridApi.grid.modifyRows(o.permissionSetJsonData);o.psGridApi.selection.selectRow(o.currSelectedRow.entity);o.skipConfirmation=false}}};o.clearPSSearch=function(){o.filterPs.searchText="";o.searchPs();if(o.currSelectedRow){o.skipConfirmation=true;o.psGridApi.grid.modifyRows(o.permissionSetJsonData);o.psGridApi.selection.selectRow(o.currSelectedRow.entity);o.skipConfirmation=false}};o.filterCls={searchText:"",selectedFilter:undefined};o.searchCls=function(q){o.classPermission=o.tempClassPermission;o.classPermissionOptions.columnDefs[1].displayName=_Labels.CMDBClassName;var p;if(q){p=q.value;o.classFilter=q}if(p=="CI"){o.classPermission=o.tempClassPermission.filter(function(r){return r.ClassType==="CI"||r.ClassType==="CI and Asset"})}else{if(p=="Asset"){o.classPermission=o.tempClassPermission.filter(function(r){return r.ClassType==="Asset"||r.ClassType==="CI and Asset"})}else{if(p=="All"){o.classPermission=o.tempClassPermission}}}o.classPermission=h("filter")(o.classPermission,{ClassLabel:o.filterCls.searchText});o.selectColHeaderOnLoad("ReadAccess");o.selectColHeaderOnLoad("CreateAccess");o.selectColHeaderOnLoad("EditAccess");o.selectColHeaderOnLoad("DeleteAccess");if(o.filterCls.searchText.length>0){o.classPermissionOptions.columnDefs[1].displayName=_Labels.CMDBClassName+" ("+_Labels.searchResult+")"}o.gridApi.core.notifyDataChange(i.dataChange.COLUMN)};o.clearClassSearch=function(){o.filterCls.searchText="";o.searchCls(o.classFilter)};o.permissionSetJsonData=permissionSetJson;var d;o.permissionSetName;var b=[{field:"id",name:"permissionId",visible:false},{field:"apiName",name:"APIName",visible:false},{field:"name",name:"permissionName",displayName:_Labels.PermissionName,sortDirectionCycle:[i.ASC,i.DESC],sort:{direction:i.ASC},cellTooltip:function(q,p){return q.entity.name}}];o.skipConfirmation=false;o.prevSelectedRow;o.currSelectedRow;o.permissionSetsOptions={data:"permissionSetJsonData",columnDefs:b,enableColumnResizing:true,enableSorting:true,enableCellEditOnFocus:false,enableColumnMenus:false,enableSelectAll:false,multiSelect:false,enableRowSelection:true,enableRowHeaderSelection:false,minRowsToShow:100,enableHorizontalScrollbar:i.scrollbars.WHEN_NEEDED,enableVerticalScrollbar:i.scrollbars.WHEN_NEEDED,noUnselect:true,onRegisterApi:function(p){o.psGridApi=p;p.selection.on.rowSelectionChanged(o,function(q){o.prevSelectedRow=o.currSelectedRow;o.currSelectedRow=q;if(!o.skipConfirmation){if(o.isFormDirty){o.confirmUnsavedChanges(q)}else{o.rowSelect(q,true)}}o.skipConfirmation=false});c(function(){if(o.psGridApi.selection.selectRow){if(o.controllerData.isFirstLoad==true&&o.permissionSetJsonData.length>0){o.skipConfirmation=true;o.psGridApi.grid.modifyRows(o.permissionSetJsonData);o.psGridApi.selection.selectRow(o.permissionSetJsonData[0]);d=o.permissionSetJsonData[0].id;o.permissionSetName=o.permissionSetJsonData[0].name;o.controllerData.isFirstLoad=false;o.skipConfirmation=false}}})},};o.rowSelect=function(p,q){if(!q){if(o.prevSelectedRow){o.skipConfirmation=true;o.psGridApi.selection.selectRow(o.prevSelectedRow.entity)}return}o.isFormDirty=false;d=p.entity.id;o.permissionSetName=p.entity.name;o.getClassPermissions(d,false);o.psGridApi.grid.appScope.lastSelectedRow=p;o.searchCls(o.filterData[0]);o.filterCls.selectedFilter=o.filterData[0];o.filterCls.searchText=""};o.confirmUnsavedChanges=function(p){l.showDialog({title:_Labels.Information,text:_Labels.UnsavedChanges,cancel:_Labels.Cancel,Continue:_Labels.Ok,callBackFn:o.rowSelect,row:p})};o.getClassPermissions=function(q,p){o.toPsId=q;n.getCMDBClassPermissions(q,p).then(function(r){var s=JSON.parse(r);o.classPermission=s.classPermissions;o.tempClassPermission=o.classPermission;if(!o.skipRemoteCall){if(o.classFilter.value=="CI"){o.classPermission=o.tempClassPermission.filter(function(t){return t.ClassType==="CI"||t.ClassType==="CI and Asset"})}else{if(o.classFilter.value=="Asset"){o.classPermission=o.tempClassPermission.filter(function(t){return t.ClassType==="Asset"||t.ClassType==="CI and Asset"})}}if(o.filterCls.searchText.length>0){o.classPermission=h("filter")(o.classPermission,{ClassLabel:o.filterCls.searchText})}}o.showImportBtn=s.showImportBtn;o.enableResetBtn=s.enableResetBtn;o.controllerData.hideCiManagement=!s.enableCiManagement;o.controllerData.hideAssetManagement=!s.enableAssetManagement;o.selectColHeaderOnLoad("ReadAccess");o.selectColHeaderOnLoad("CreateAccess");o.selectColHeaderOnLoad("EditAccess");o.selectColHeaderOnLoad("DeleteAccess");o.ObjPermissionsInPS=s.ObjPermissionInPS})};if(classPermissionsJSON&&classPermissionsJSON.classPermissions){o.classPermission=classPermissionsJSON.classPermissions;o.tempClassPermission=o.classPermission;o.showImportBtn=classPermissionsJSON.showImportBtn;o.enableResetBtn=classPermissionsJSON.enableResetBtn;o.controllerData.hideCiManagement=!classPermissionsJSON.enableCiManagement;o.controllerData.hideAssetManagement=!classPermissionsJSON.enableAssetManagement;o.toPsId=selPermissionSetId;d=selPermissionSetId;o.ObjPermissionsInPS=classPermissionsJSON.ObjPermissionInPS;o.filterCls.selectedFilter=o.filterData[0]}o.clonePermissionSetJsonData;o.clonePermissionSetsOptions={data:"clonePermissionSetJsonData",columnDefs:b,enableColumnResizing:true,enableSorting:true,enableCellEditOnFocus:false,enableColumnMenus:false,enableSelectAll:false,multiSelect:false,enableRowSelection:true,enableRowHeaderSelection:false,enableHorizontalScrollbar:i.scrollbars.WHEN_NEEDED,enableVerticalScrollbar:i.scrollbars.WHEN_NEEDED,excessRows:10,noUnselect:true,rowHeight:30,onRegisterApi:function(p){j.$broadcast("cloneGridApi",p);p.selection.on.rowSelectionChanged(o,function(q){o.fromPsId=q.entity.id;p.grid.appScope.lastSelectedRow=q;j.$broadcast("isCloneDisabled",false);j.$broadcast("currSelectedRow",q)})},};var a=[{field:"Id",name:"Id",visible:false},{field:"ClassLabel",name:"ClassLabel",displayName:_Labels.CMDBClassName,width:"40%",sortDirectionCycle:[i.ASC,i.DESC],sort:{direction:i.ASC},enableColumnResizing:false,cellTooltip:function(q,p){return q.entity.ClassLabel}},{field:"ReadAccess",name:"ReadAccess",displayName:_Labels.Read,cellTemplate:htmlPath+"/check-box.html",width:"15%",fixedWidth:true,headerCellTemplate:htmlPath+"/header-check-box.html",allChecked:true,enableColumnResizing:false},{field:"CreateAccess",name:"CreateAccess",displayName:_Labels.Create,cellTemplate:htmlPath+"/check-box.html",width:"15%",fixedWidth:true,headerCellTemplate:htmlPath+"/header-check-box.html",allChecked:true,enableColumnResizing:false},{field:"EditAccess",name:"EditAccess",displayName:_Labels.Edit,cellTemplate:htmlPath+"/check-box.html",width:"15%",fixedWidth:true,headerCellTemplate:htmlPath+"/header-check-box.html",allChecked:true,enableColumnResizing:false},{field:"DeleteAccess",name:"DeleteAccess",displayName:_Labels.Delete,cellTemplate:htmlPath+"/check-box.html",width:"15%",fixedWidth:true,headerCellTemplate:htmlPath+"/header-check-box.html",allChecked:true,enableColumnResizing:false}];o.classPermissionOptions={data:"classPermission",columnDefs:a,enableColumnResizing:true,enableSorting:true,enableCellEditOnFocus:false,enableColumnMenus:false,enableSelectAll:true,multiSelect:false,enableRowSelection:true,enableRowHeaderSelection:false,enableHorizontalScrollbar:i.scrollbars.WHEN_NEEDED,enableVerticalScrollbar:i.scrollbars.WHEN_NEEDED,noUnselect:false,onRegisterApi:function(p){o.gridApi=p;c(function(){o.selectColHeaderOnLoad("ReadAccess");o.selectColHeaderOnLoad("CreateAccess");o.selectColHeaderOnLoad("EditAccess");o.selectColHeaderOnLoad("DeleteAccess")})},};o.save=function(){var q=[];for(var s=0;s<o.tempClassPermission.length;s++){var p={};if(o.tempClassPermission[s].Id&&o.tempClassPermission[s].Id!=""){p.id=o.tempClassPermission[s].Id}else{o.skipRemoteCall=false}p.PermissionSetId__c=d;p.FKCMDBClass__c=o.tempClassPermission[s].ClassRecId;p.Read__c=o.tempClassPermission[s].ReadAccess.value;p.Create__c=o.tempClassPermission[s].CreateAccess.value;p.Edit__c=o.tempClassPermission[s].EditAccess.value;p.Delete__c=o.tempClassPermission[s].DeleteAccess.value;q.push(p)}var t={};var r={permissionSetId:d,enableCiManagement:!o.controllerData.hideCiManagement,enableAssetManagement:!o.controllerData.hideAssetManagement};t.enableCiAssetKey=JSON.stringify(r);o.isFormDirty=false;n.save(q,t).then(function(u){if(!o.skipRemoteCall){o.getClassPermissions(d,false)}})};o.confirmClassPermissionActivation=function(p){o.isCMDBClassPermissionEnable=!p;if(o.isCMDBClassPermissionEnable){l.showDialog({title:_Labels.Information,titleI18nKey:"support.sr.reopen.errorHeader",text:_Labels.EnabaleClassPermissionInfo,ok:_Labels.Ok,cancel:_Labels.Cancel,isCMDBClassPermissionEnable:o.isCMDBClassPermissionEnable,callBackFn:o.saveFeatureEnablement,ClickHere:_Labels.ClickHere,})}else{o.saveFeatureEnablement(o.isCMDBClassPermissionEnable,true)}};o.saveFeatureEnablement=function(p,q){if(q){n.saveFeatureEnablement(p).then(function(r){})}else{o.isCMDBClassPermissionEnable=!o.isCMDBClassPermissionEnable}};o.openCloneFromModel=function(p){var q={};n.getSavedPSRecsForCloning(p.$parent.toPsId,q).then(function(r){o.clonePermissionSetJsonData=JSON.parse(r);f.showDialog({title:_Labels.ClonePermissions+" "+p.$parent.permissionSetName,titleI18nKey:_Labels.ClonePermissions+" "+p.$parent.permissionSetName,text:"",clonePermissionSetsOptions:o.clonePermissionSetsOptions,gridData:o.clonePermissionSetJsonData,callBackFn:o.clonePermissions,cloneToPsId:o.toPsId,searchLbl:_Labels.Search,placeHolderLbl:_Labels.SearchPs})})};o.clonePermissions=function(){n.clonePermissions(o.fromPsId,o.toPsId).then(function(p){o.classPermission=JSON.parse(p);o.tempClassPermission=o.classPermission;o.filterCls.searchText="";o.searchCls(o.filterData[0]);o.filterCls.selectedFilter=o.filterData[0];o.selectColHeaderOnLoad("ReadAccess");o.selectColHeaderOnLoad("CreateAccess");o.selectColHeaderOnLoad("EditAccess");o.selectColHeaderOnLoad("DeleteAccess");o.isFormDirty=true;k.openInfoMessage(null,"success",_Labels.ClonedSuccessfully,2000,"[id=messageDiv]")})};o.importPermissions=function(){var p=false;var s=false;var r=false;var q=false;if(o.ObjPermissionsInPS){if(o.ObjPermissionsInPS.read){p=true}if(o.ObjPermissionsInPS.create){s=true}if(o.ObjPermissionsInPS.edit){r=true}if(o.ObjPermissionsInPS.del){q=true}}o.selectPermissionsOfClasses(p,s,r,q);o.isFormDirty=true;k.openInfoMessage(null,"success",_Labels.ImportPermissionMessage,2000,"[id=messageDiv]")};o.resetPermissions=function(u){var p=false;var s=false;var r=false;var q=false;if(o.currSelectedRow&&o.currSelectedRow.entity){var t=o.currSelectedRow.entity.apiName;if(t&&ootbPSArr.indexOf(t)>-1){p=o.ObjPermissionsInPS.read;s=o.ObjPermissionsInPS.create;r=o.ObjPermissionsInPS.edit;q=o.ObjPermissionsInPS.del}o.selectPermissionsOfClasses(p,s,r,q);o.selectColHeaderOnLoad("ReadAccess");o.selectColHeaderOnLoad("CreateAccess");o.selectColHeaderOnLoad("EditAccess");o.selectColHeaderOnLoad("DeleteAccess");o.isFormDirty=true}k.openInfoMessage(null,"success",_Labels.ResetSuccessfully,2000,"[id=messageDiv]")};o.selectPermissionsOfClasses=function(q,p,t,s){for(var r=0;r<o.tempClassPermission.length;r++){o.tempClassPermission[r]["ReadAccess"].value=q;o.tempClassPermission[r]["CreateAccess"].value=p;o.tempClassPermission[r]["EditAccess"].value=t;o.tempClassPermission[r]["DeleteAccess"].value=s}o.classPermission=o.tempClassPermission;o.filterCls.searchText="";o.searchCls(o.filterData[0]);o.filterCls.selectedFilter=o.filterData[0]};o.setDirtyFlag=function(){o.isFormDirty=true}}]);CMDBClassPermissionsModule.factory("dataServices",["$rootScope","$q",function(a,b){return{getLookupresult:function(d){var c=b.defer();return c.promise}}}]);CMDBClassPermissionsModule.factory("SSLocalDataStore",["$q",function(a){var b={};return{setAppMetadata:function(c,d){b[c]=d},getAppMetadata:function(c){if(c){return b[c]}else{return appMetada}}}}]);CMDBClassPermissionsModule.factory("confirmationDialogService",["$modal","$rootScope",function(c,a){var b={};b.showDialog=function(d){return c.open({templateUrl:htmlPath+"/info-dialog.html",backdrop:"static",keyboard:false,controller:["$scope","$modalInstance",function(e,f){e.title=d.title;e.titleI18nKey=d.titleI18nKey;e.text=d.text;e.textI18nKey=d.textI18nKey;e.ok=d.ok;e.Continue=d.Continue;e.Cancel=d.cancel;e.ClickHere=d.ClickHere;e.saveFeature=function(){if(d.callBackFn&&typeof(d.isCMDBClassPermissionEnable)!="undefined"){d.callBackFn(d.isCMDBClassPermissionEnable,true)}f.dismiss()};e.dismiss=function(){if(d.callBackFn&&d.row){d.callBackFn(d.row,false)}if(d.callBackFn&&typeof(d.isCMDBClassPermissionEnable)!="undefined"){d.callBackFn(d.isCMDBClassPermissionEnable,false)}if(d.row){d.row.setFocused(false)}f.dismiss()};e.proceed=function(){if(d.callBackFn&&d.row){d.callBackFn(d.row,true)}f.dismiss()};e.openHelpPage=function(){window.open(wikiURL)}}]})};return b}]);CMDBClassPermissionsModule.factory("cloneFromDialogService",["$modal","$rootScope","$filter","cmdbClassPermissionsService",function(c,a,e,d){var b={};b.showDialog=function(f){return c.open({templateUrl:htmlPath+"/info-dialog.html",backdrop:"static",keyboard:false,controller:["$scope","$modalInstance",function(g,h){g.title=f.title;g.titleI18nKey=f.titleI18nKey;g.text=f.text;g.textI18nKey=f.textI18nKey;g.Clone=_Labels.Clone;g.Cancel=_Labels.Cancel;g.clonePermissionSetsOptions=f.clonePermissionSetsOptions;g.clonePermissionSetsOptions.data=f.gridData;g.placeHolderLbl=f.placeHolderLbl;g.searchLbl=f.searchLbl;g.isCloneDisabled=true;g.filterPs={cloneSearchText:undefined};g.searchPs=function(){g.clonePermissionSetsOptions.data=f.gridData;var i={searchTxt:g.filterPs.cloneSearchText,fromPsId:f.cloneToPsId};if(g.filterPs.cloneSearchText.length>0){if(isServerSearchForPS){d.findPS(i).then(function(j){g.clonePermissionSetsOptions.data=JSON.parse(j)})}else{g.clonePermissionSetsOptions.data=e("filter")(g.clonePermissionSetsOptions.data,{name:g.filterPs.cloneSearchText})}}else{if(g.currSelectedRow&&g.clonePSgridApi){g.clonePSgridApi.grid.modifyRows(g.clonePermissionSetsOptions.data);g.clonePSgridApi.selection.selectRow(g.currSelectedRow.entity)}}};g.$on("isCloneDisabled",function(j,i){g.isCloneDisabled=i});g.$on("currSelectedRow",function(j,i){g.currSelectedRow=i});g.$on("cloneGridApi",function(i,j){g.clonePSgridApi=j});g.clearPSSearch=function(){g.filterPs.cloneSearchText="";g.searchPs();if(g.currSelectedRow&&g.clonePSgridApi){g.clonePSgridApi.grid.modifyRows(g.clonePermissionSetsOptions.data);g.clonePSgridApi.selection.selectRow(g.currSelectedRow.entity)}};g.clonePS=function(){if(f.callBackFn){f.callBackFn()}h.dismiss()};g.dismiss=function(){h.dismiss()}}]})};return b}]);