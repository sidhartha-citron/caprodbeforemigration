var MALayersSearch = {
	delay: 150,
	suggestionsRequestIndex: 0,
	minChars: 2, 
	last_val: "",
	timer: null,
	timeout: null,

	autoCompleteOnKeyUp: function(e, obj) {
		var key = window.event ? e.keyCode : e.which;
		if ((key < 35 || key > 40) && key != 13 && key != 27) {
			var val = obj.value;
			if (val.length >= MALayersSearch.minChars) {
				if (val != MALayersSearch.last_val) {
					//show loading
					$('#folder-search-clear').hide();
					$('#folder-search-loading').show();
					MALayersSearch.last_val = val;
					clearTimeout(MALayersSearch.timer);

					MALayersSearch.timer = setTimeout(function() {
						MALayersSearch.findSuggestions(val);
					}, MALayersSearch.delay);
				}
			} else {
				MALayersSearch.last_val = val;

			}
		}
	},
	autoCompleteOnClick: function(e, obj) {
		//If everything is empty and you click on the search...
		if (obj.value === "" && MALayersSearch.last_val !== "") {
			//MALayersSearch.findSuggestions(MALayersSearch.last_val);
			$('#folder-search-clear').show();
		}

		MALayersSearch.showResults();
	},
	findSuggestions: function(val) {
		if (typeof(MALayersSearch.timeout) !== 'undefined') {
			try {
				//MALayersSearch.ajaxCall.abort();
				clearTimeout(MALayersSearch.timeout);
			} catch (e) {}
		}

		var processData = {
			ajaxResource: 'MATreeAJAXResources',

			action: 'layer_search',
			searchterm: val
		};
		//moving this to a timeout due to apex remoting
		MALayersSearch.timeout = setTimeout(function() {
			Visualforce.remoting.Manager.invokeAction(MARemoting.processAJAXRequest,
				processData,
				function(response, event) {

					var folderItemTemplate = $('#folderItem-template').html();
					var searchContents = $('#foldersearch-results-contents');

					if (response.data.contents.length > 0) {
						searchContents.html('');
					} else {
						searchContents.html('<div class="searchresults-placeholder">The search returned no results.</div>');
					}

					$.each(response.data.contents, function(index, value) {
						var propertyDescription = value.properties.description == undefined ? 'No Description' : value.properties.description;
						var parentFolder = '';

						var prop = value.properties;

						if (prop.hasOwnProperty('record')) {

							if (prop.record.hasOwnProperty('sma__Folder__r')) {

								parentFolder = prop.record.sma__Folder__r.Name;

							} else if (prop.record.hasOwnProperty('sma__ParentFolder__r')) {

								parentFolder = prop.record.sma__ParentFolder__r.Name;

							} else if (prop.record.hasOwnProperty('sma__MapAnythingFolder__r')) {

								parentFolder = prop.record.sma__MapAnythingFolder__r.Name;

							} else {
								if (value.properties.nodetype.indexOf('Personal') > -1) {
									parentFolder = 'Personal';
								} else if (value.properties.nodetype.indexOf('Corporate') > -1) {
									parentFolder = 'Corporate';
								}
							}
						}
						
						searchContents.append(folderItemTemplate
							.replace(/::ID::/g, value.properties.id)
							.replace(/::DATA_ID::/g, 'SEARCH_' + value.properties.id)
							.replace(/::TYPE::/g, value.properties.type.toLowerCase())
							.replace(/::NAME::/g, htmlEncode(value.properties.name))
							.replace(/::DEFAULTACTION::/g, value.properties.defaultaction)
							.replace(/::ACTIONS::/g, MALayers.processActionsArray({
								actionType: 'layer',
								actionsArray: value.actions
							}).join(' '))
							.replace(/::PERM-CREATE::/g, value.permissions.create)
							.replace(/::PERM-DELETE::/g, value.permissions.delete)
							.replace(/::PERM-EXPORT::/g, value.permissions.export)
							.replace(/::PERM-MODIFY::/g, value.permissions.modify)
							.replace(/::PERM-READ::/g, value.permissions.read)
							.replace(/::PERM-SETPERM::/g, value.permissions.setpermissions)
							.replace(/::NODETYPE::/g, value.properties.nodetype)
							.replace(/::TOOLTIP-TITLE::/g, htmlEncode(value.properties.name))
							.replace(/::TOOLTIP-DESC::/g, htmlEncode(propertyDescription))
							.replace(/::TOOLTIP-BASEOBJ::/g, htmlEncode(value.properties.baseobjectname) || 'N/A')
							.replace(/::TOOLTIP-PLOTONLOAD::/g, value.properties.plotonload)
							.replace(/::TOOLTIP-CREATED::/g, htmlEncode(value.properties.created))
							.replace(/::TOOLTIP-MODIFIED::/g, htmlEncode(value.properties.lastmodified))
							.replace(/::PARENT-FOLDER::/g, 'Folder: ' + htmlEncode(parentFolder))
						);

						$('#foldersearch-results-contents .folderItem[data-id="SEARCH_' + value.properties.id + '"]').data({
							id: value.properties.id,
							name: htmlEncode(value.properties.name),
							description: htmlEncode(propertyDescription),
							created: htmlEncode(value.properties.created),
							modified: htmlEncode(value.properties.lastmodified),
							baseObject: htmlEncode(value.properties.baseobjectname) || 'N/A',
							folderPath: value.properties.folderPath || ''
						});

						var clickAction = searchContents.find('div#' + value.properties.id).find('div.ftu-unit-left').attr('onclick');
						searchContents.find('div#' + value.properties.id).find('div.ftu-unit-left').attr('onclick', clickAction + 'MALayersSearch.hideResults();');

						if (parentFolder !== '') {
							searchContents.find('div#' + value.properties.id).find('div.ftu-subline').removeClass('hidden').addClass('inline');
						}

						if (value.properties.type.toLowerCase() === 'folder') {
							// Hide popover for folders.
							searchContents.find('div#' + value.properties.id).find('div.ftu-tooltip').hide();
							searchContents.find('div#' + value.properties.id).find('div.ftu-tooltip-arrow').hide();
						} else if (value.properties.baseobjectname === undefined) {
							// Hide base object for items with no base object
							searchContents.find('div#' + value.properties.id).find('div.ft-tooltip-baseob').hide();
						}

						if (value.properties.plotonload) {
							searchContents.find('div#' + value.properties.id).find('.ftu-icon-left').addClass('is-plot-on-load');
						}

					});

					MALayersSearch.showResults();
				}, {
					buffer: false,
					escape: false
				}
			);
		}, 500);
	},
	clearSearch: function() {
		$('input#foldersearchInput').val('').focus();
		//$('#foldersearch-results-contents').html('<div class="searchresults-placeholder">Type at least 2 characters to search</div>');
		MALayersSearch.hideResults();
	},
	showResults: function() {
		$('#folderSearchWrapper').addClass('results-visible');
		$('div.foldersearch-results').addClass('results-visible');
		$('div#folder-search-mask').addClass('active');

		$('div#tab-plotted')[0].onmouseleave = function() {
			MALayersSearch.hideResults();
		};

		$('div.foldersearch-results').css('max-height', $('div#mapdiv').height() - 110);

		$('#folder-search-clear').show();
		$('#folder-search-loading').hide();
	},
	hideResults: function() {
		$('#folderSearchWrapper').removeClass('results-visible');
		$('div.foldersearch-results').removeClass('results-visible');
		$('div#folder-search-mask').removeClass('active');
	}
};
var MALayers = {

	currentFolder: 'Home',
	currentFolderName: 'Home',
	currentFolderNodeType: '',

	defaultFolder: null,

	contextMenu: {
		id: '',
		shown: false
	},

	init: function() {

		MALayers.loadRecent();
		MALayers.loadFolder('Home');
		$('#layer-tab-nav').tabs();

		/*
		    MALayers.loadFolder(userSettings.DefaultFolder)
		    called in JSMapAnything.component
		    to load the users default folder
		*/
	},

	setDefaultFolder: function(id) {
		var processData = {
			ajaxResource: 'MATreeAJAXResources',

			action: 'set_default_folder',
			id: id
		};

		Visualforce.remoting.Manager.invokeAction(MARemoting.processAJAXRequest,
			processData,
			function(json, event) {
				if (json.success) {
					if (id != null) {
						Debug("Set Default Folder " + json.id);
						NotifySuccess("Success!", "Default Folder Set");
					} else {
						Debug("Cleared Default Folder");
						NotifySuccess("Success!", "Default Folder Cleared");
					}
				} else {
					Debug("Error Setting Default Folder " + json.error);
					NotifyError("Error Setting Default Folder", json.error);
				}

				MALayers.defaultFolder = id;
			}, {
				buffer: false
			}
		);
	},

	loadDefaultFolder: function(id) {
		MALayers.defaultFolder = id;
		MALayers.loadFolder(id);
	},

	moveToTab: function(tabid) {
		//$('div#layer-tab-nav').find('li[aria-selected="true"]').find('a').text();
		tabid = tabid.toLowerCase() == 'saved' ? 'folders' : tabid.toLowerCase();

		if (tabid == 'plotted' || tabid == 'folders' || tabid == 'recent') {
			$('a#layer-tab-nav-' + tabid).click();
		}
	},
	moveToPreviousBreadcrumb: function(id) {
		// CHEATING
		var crumbList = $('div#folder-breadcrumb').find('a');
		var lastCrumb = crumbList[crumbList.length - 1];

		if (lastCrumb.getAttribute('href').indexOf(id) > -1) {
			crumbList[crumbList.length - 2].click();
		}
	},

	copyNode: function(options) {
		if ($('#CopyToTree').data('jstree_instance_id') !== undefined) {
			$('#CopyToTree').jstree('destroy').empty();
		}

		//Initialize Folder tree for Copy To
		$("#CopyToTree")

			.on('load_node.jstree load_node_json.jstree', function() {
				$('#CopyToTree li').each(function() {

					if (!MASystem.User.IsCorporateAdmin && ($(this).attr('nodetype') == 'CorporateRoot' || ($(this).attr('nodetype') == 'CorporateFolder' && $(this).attr('create') != 'true'))) {
						if ($(this).attr('nodetype') != 'CorporateRoot') {
							$(this).addClass('disabled').find('> a > .jstree-checkbox').addClass('copyto-disabled');
						}
						//$(this).remove();
					} else if ($(this).attr('nodetype') == 'RoleRoot' || $(this).attr('nodetype') == 'RoleNameFolder') {
						$(this).addClass('disabled').find('> a > .jstree-checkbox').addClass('copyto-disabled');
					}
				});
			})

			.jstree({
				"json_data": {
					"data": "",
					"ajax": {
						"url": MA.resources.TreeXML,
						"data": function(n) {
							return {
								id: n.attr ? n.attr("id") : 0,
								rand: new Date().getTime(),
								type: n.attr ? n.attr("NodeType") : 0,
								types: 'Folder'
							};
						}
					}
				},
				"checkbox": {
					real_checkboxes: true,
					real_checkboxes_names: function(n) {
						var nid = 0;
						$(n).each(function(data) {
							nid = $(this).attr("nodeid");
						});
						return (["check_" + nid, nid]);
					},
					two_state: true
				},
				"core": {
					"animation": 10,
					"strings": {
						"loading": "Loading...",
						"new_node": "New Folder"
					}

				},
				"plugins": ["themes", "json_data", "ui", "crrm", "types", "checkbox"]

			})

		; //End jstree

		$('#copynode').attr("copyid", options.id);
		$('#copynode').attr("copynodetype", options.nodetype);
		$('#copynode').html('<b>' + htmlEncode(options.name) + '</b>');

		$('#CopyToPopup').find('button[role="saveButton"]').attr('onclick', 'SubmitCopyTo();');
		$('#CopyToPopup').find('span[role="copyLabel"]').text('Copy');
		LaunchPopupWindow($('#CopyToPopup'), 300);
	},
	deleteNode: function(options) {
		// Is it a folder? Let's check if the folder is empty.
		// If we don't use this, all folder contents move to the top level when a folder is deleted.
		if (options.type === 'folder') {
			var processData = {
				ajaxResource: 'MATreeAJAXResources',
				action: 'get_folder_content_v2',
				FolderId: options.id
			};
			var $deleting = MAToastMessages.showLoading({
				message: MASystem.Labels.MA_Loading + '...',
				timeOut: 0,
				extendedTimeOut: 0
			});
			Visualforce.remoting.Manager.invokeAction(MARemoting.processAJAXRequest,
				processData,
				function(res, event) {
					if (event.status) {
						if (res.data) {
							if (res.data.contents) {
								if (res.data.contents.length === 0) {
									//DELETE IT!
									var processData = {
										ajaxResource: 'MATreeAJAXResources',
										action: 'delete_node',
										id: options.id
									};

									Visualforce.remoting.Manager.invokeAction(MARemoting.processAJAXRequest,
										processData,
										function(json, event) {
											MAToastMessages.hideMessage($deleting);
											if (event.status) {
												if (json.success) {
													Debug("Deleted Node " + json.id);
													//NotifySuccess("Success!","Deleted Folder");
													$('.folderItem[id="' + options.id + '"]').remove();
													MAToastMessages.showSuccess({
														message: 'Delete successful'
													});
													//if we delete the folder that we're in, we need to go back...
													MALayers.moveToPreviousBreadcrumb(options.id);
												} else {
													Debug("Error Deleting Node " + json.error);
													var errMsg = json.error;
													NotifyError("Error Deleting Node", json.error);
												}
											} else {
												var errMsg = event.message || 'Unknown Error';
												NotifyError("Error Deleting Node", errMsg);
											}
										}
									);
								} else {
									Debug("Error Deleting Node Folder Not Empty!");
									NotifyError("Error Deleting Node Folder Not Empty!");
									MAToastMessages.hideMessage($deleting);
								}
							} else {
								MAToastMessages.hideMessage($deleting);
								//Has no contents object... I sense a disturbance in this folder.
								//MALayers.deleteNode(options);
							}
						} else {
							var errMsg = res.error || 'Unkown Error';
							NotifyError("Error Deleting Node", errMsg);
							MAToastMessages.hideMessage($deleting);
						}
					} else {
						var errMsg = event.message || 'Unkown Error';
						NotifyError("Error Deleting Node", errMsg);
						MAToastMessages.hideMessage($deleting);
					}
				}, {
					buffer: false,
					escape: false,
					timeout: 120000
				}
			);
		} else {
			//DELETE IT!
			var processData = {
				ajaxResource: 'MATreeAJAXResources',
				action: 'delete_node',
				id: options.id
			};
			var $deleting = MAToastMessages.showLoading({
				message: MASystem.Labels.MA_Loading + '...',
				timeOut: 0,
				extendedTimeOut: 0
			});
			Visualforce.remoting.Manager.invokeAction(MARemoting.processAJAXRequest,
				processData,
				function(json, event) {
					MAToastMessages.hideMessage($deleting);
					if (event.status) {
						if (json.success) {
							Debug("Deleted Node " + json.id);
							//NotifySuccess("Success!","Deleted Layer");
							$('.folderItem[id="' + options.id + '"]').remove();
							MAToastMessages.showSuccess({
								message: 'Delete successful'
							});
						} else {
							Debug("Error Deleting Node " + json.error);
							NotifyError("Error Deleting Node", json.error);
						}
					} else {
						var errMsg = event.message || 'Unkown Error';
						NotifyError("Error Deleting Node", errMsg);
					}
				}, {
					buffer: false,
					escape: false,
					timeout: 120000
				}
			);
		}
	},
	showModal: function(modalId) {
		$('#' + modalId + '').addClass('in');
		$('#' + modalId + ' .slds-scope .slds-modal').addClass('slds-fade-in-open');
		/*if ( $($Id).has('.ma-modal-search-input') ) {
		 $($Id).find('.ma-modal-search-input').focus();
		 } else {}*/
		if ($('.backdrop').length == 0) {
			$('<div class="backdrop"></div>').appendTo('body');
		}
		$('.backdrop').addClass('active visible');
	},
	hideModal: function(modalSelector, hideMask) {
		hideMask = hideMask === false ? false : true;
		if (modalSelector != undefined) {
			//$('#'+modalSelector+'').removeClass('in');
			$('#' + modalSelector + ' .slds-scope .slds-modal').removeClass('slds-fade-in-open');
		} else {
			//hide all modals
			//$('.ma-modal').removeClass('in');
			$('.maModal .slds-scope .slds-modal').removeClass('slds-fade-in-open');
		}

		if (hideMask) {
			$('#modalScreen').removeClass('in');
			$('.backdrop').removeClass('active visible');
		}
		$('.select2-hidden-accessible').select2('close');
	},
	moveNode: function(options) {
		if ($('#CopyToTree').data('jstree_instance_id') !== undefined) {
			$('#CopyToTree').jstree('destroy').empty();
		}

		//Initialize Folder tree for Copy To
		$("#CopyToTree")

			.on('load_node.jstree load_node_json.jstree', function() {
				$('#CopyToTree li').each(function() {
					if (!MASystem.User.IsCorporateAdmin && ($(this).attr('nodetype') == 'CorporateRoot' || ($(this).attr('nodetype') == 'CorporateFolder' && $(this).attr('create') != 'true'))) {
						if ($(this).attr('nodetype') != 'CorporateRoot') {
							$(this).addClass('disabled').find('> a > .jstree-checkbox').addClass('copyto-disabled');
						}
						//$(this).remove();
					} else if ($(this).attr('nodetype') == 'RoleRoot' || $(this).attr('nodetype') == 'RoleNameFolder') {
						$(this).addClass('disabled').find('> a > .jstree-checkbox').addClass('copyto-disabled');
					}
				});
			})

			.jstree({
				"json_data": {
					"data": "",
					"ajax": {
						"url": MA.resources.TreeXML,
						"data": function(n) {
							return {
								id: n.attr ? n.attr("id") : 0,
								rand: new Date().getTime(),
								type: n.attr ? n.attr("NodeType") : 0,
								types: 'Folder'
							};
						}
					}
				},
				"checkbox": {
					real_checkboxes: true,
					real_checkboxes_names: function(n) {
						var nid = 0;
						$(n).each(function(data) {
							nid = $(this).attr("nodeid");
						});
						return (["check_" + nid, nid]);
					},
					two_state: true
				},
				"core": {
					"animation": 10,
					"strings": {
						"loading": "Loading...",
						"new_node": "New Folder"
					}

				},
				"plugins": ["themes", "json_data", "ui", "crrm", "types", "checkbox"]

			})

		; //End jstree

		$('#copynode').attr("copyid", options.id);
		$('#copynode').attr("movetype", options.type);
		$('#copynode').attr("copynodetype", options.nodetype);
		$('#copynode').html('<b>' + htmlEncode(options.name) + '</b>');

		$('#CopyToPopup').find('button[role="saveButton"]').attr('onclick', 'SubmitMoveTo();');
		$('#CopyToPopup').find('span[role="copyLabel"]').text('Move');

		LaunchPopupWindow($('#CopyToPopup'), 300);
	},

	loadRecent: function() {
		var processData = {
			ajaxResource: 'MATreeAJAXResources',

			action: 'get_recent_tab'
		};

		Visualforce.remoting.Manager.invokeAction(MARemoting.processAJAXRequest,
			processData,
			function(res, event) {
				if (event.status) {
					if (res && res.success) {
						$('div#layer-tab-recent').find('div#recent-queries').empty();
						var recents = [];
						var plotonload = [];

						if (res.data) {
							recents = res.data.recent || [];
							plotonload = res.data.plotonload || [];
						}

						var folderItemTemplate = $('#folderItem-template').html();
						var recentQueries = $('div#layer-tab-recent').find('div#recent-queries');


						if (recents.length == 0) {
							recentQueries.append($('div#noItem-template').html().replace(/::NAME::/g, '- No Recent Items -'));
						} else {
							$.each(recents, function(index, value) {
								var propertyDescription = value.properties.description == null ? 'No Description' : value.properties.description;

								
								recentQueries.append(folderItemTemplate
									.replace(/::ID::/g, value.properties.id)
									.replace(/::DATA_ID::/g, 'REC_' + value.properties.id)
									.replace(/::TYPE::/g, value.properties.type.toLowerCase())
									.replace(/::NAME::/g, value.properties.name)
									.replace(/::DEFAULTACTION::/g, value.properties.defaultaction)
									.replace(/::ACTIONS::/g, MALayers.processActionsArray({
										actionType: 'layer',
										actionsArray: value.actions
									}).join(' '))
									.replace(/::PERM-CREATE::/g, value.permissions.create)
									.replace(/::PERM-DELETE::/g, value.permissions.delete)
									.replace(/::PERM-EXPORT::/g, value.permissions.export)
									.replace(/::PERM-MODIFY::/g, value.permissions.modify)
									.replace(/::PERM-READ::/g, value.permissions.read)
									.replace(/::PERM-SETPERM::/g, value.permissions.setpermissions)
									.replace(/::NODETYPE::/g, value.properties.nodetype)
									.replace(/::TOOLTIP-TITLE::/g, htmlEncode(value.properties.name))
									.replace(/::TOOLTIP-DESC::/g, htmlEncode(propertyDescription))
									.replace(/::TOOLTIP-BASEOBJ::/g, htmlEncode(value.properties.baseobjectname) || 'N/A')
									.replace(/::TOOLTIP-PLOTONLOAD::/g, value.properties.plotonload)
									.replace(/::TOOLTIP-CREATED::/g, htmlEncode(value.properties.created))
									.replace(/::TOOLTIP-MODIFIED::/g, htmlEncode(value.properties.lastmodified))
								);

								$('#layer-tab-recent .folderItem[data-id="REC_' + value.properties.id + '"]').data({
									id: value.properties.id,
									name: htmlEncode(value.properties.name),
									description: htmlEncode(propertyDescription),
									created: htmlEncode(value.properties.created),
									modified: htmlEncode(value.properties.lastmodified),
									baseObject: htmlEncode(value.properties.baseobjectname) || 'N/A',
                                    folderPath: value.properties.folderPath || '',
									datalayerPlotType: htmlEncode(value.properties.dataLayerPlotType) || ''
								});

								if (value.properties.plotonload) {
									recentQueries.find('div#' + value.properties.id).find('.ftu-icon-left').addClass('is-plot-on-load');
								}

								if (value.properties.folderPath !== '') {
									recentQueries.find('div#' + value.properties.id).find('.ftu-tooltip-pad-gray').prepend('<div class="layer-folder-path"><div class="ftu-icon-icon inline" type="folder"></div>' + value.properties.folderPath + '</div>');
								}
							});
						}

						recentQueries.append('<div class="ft-subhead">' + MASystem.Labels.MA_Plot_On_Load + '</div>');


						if (plotonload.length == 0) {
							recentQueries.append($('div#noItem-template').html().replace(/::NAME::/g, '- '+MASystem.Labels.MA_No_Plot_Load+' -'));
						} else {
							$.each(plotonload, function(index, value) {
								var propertyDescription = value.properties.description == null ? 'No Description' : value.properties.description;

								
								recentQueries.append(folderItemTemplate
									.replace(/::ID::/g, value.properties.id)
									.replace(/::DATA_ID::/g, 'POL_' + value.properties.id)
									.replace(/::TYPE::/g, value.properties.type.toLowerCase())
									.replace(/::NAME::/g, value.properties.name)
									.replace(/::DEFAULTACTION::/g, value.properties.defaultaction)
									.replace(/::ACTIONS::/g, MALayers.processActionsArray({
										actionType: 'layer',
										actionsArray: value.actions
									}).join(' '))
									.replace(/::PERM-CREATE::/g, value.permissions.create)
									.replace(/::PERM-DELETE::/g, value.permissions.delete)
									.replace(/::PERM-EXPORT::/g, value.permissions.export)
									.replace(/::PERM-MODIFY::/g, value.permissions.modify)
									.replace(/::PERM-READ::/g, value.permissions.read)
									.replace(/::PERM-SETPERM::/g, value.permissions.setpermissions)
									.replace(/::NODETYPE::/g, value.properties.nodetype)
									.replace(/::TOOLTIP-TITLE::/g, htmlEncode(value.properties.name))
									.replace(/::TOOLTIP-DESC::/g, htmlEncode(propertyDescription))
									.replace(/::TOOLTIP-BASEOBJ::/g, htmlEncode(value.properties.baseobjectname) || 'N/A')
									.replace(/::TOOLTIP-PLOTONLOAD::/g, true)
									.replace(/::TOOLTIP-CREATED::/g, htmlEncode(value.properties.created))
									.replace(/::TOOLTIP-MODIFIED::/g, htmlEncode(value.properties.lastmodified))
								);

								$('#layer-tab-recent .folderItem[data-id="POL_' + value.properties.id + '"]').data({
									id: value.properties.id,
									name: htmlEncode(value.properties.name),
									description: htmlEncode(propertyDescription),
									created: htmlEncode(value.properties.created),
									modified: htmlEncode(value.properties.lastmodified),
									baseObject: htmlEncode(value.properties.baseobjectname) || 'N/A',
									folderPath: value.properties.folderPath || ''
								});

								recentQueries.find('div#' + value.properties.id).find('.ftu-icon-left').addClass('is-plot-on-load');

								if (value.properties.folderPath !== '') {
									recentQueries.find('div#' + value.properties.id).find('.ftu-tooltip-pad-gray').prepend('<div class="layer-folder-path"><div class="ftu-icon-icon inline" type="folder"></div>' + value.properties.folderPath + '</div><br>');
								}
							});
						}
					}
				}
			}, {
				buffer: false,
				escape: true,
				timeout: 120000
			}
		);
	},
	loadFolder: function(id, options) {
		options = $.extend({
            moveToSavedTab: true
        }, options || {});
		var dfd = $.Deferred();
		var currentTab = $('div#layer-tab-nav').find('li[aria-selected="true"]').find('a').text().toLowerCase();

		if (currentTab !== 'saved' && options.moveToSavedTab) {
			MALayers.moveToTab('saved');
		}

		$('#folder-contents').html('<div class="folder-loading-wrap" style="position:relative;"><div class="loadingText"><div class="MA2-loader loader-inline"></div>'+MASystem.Labels.MA_Loading+'...</div></div>');
		var previousBreadCrumbs = $('#folder-breadcrumb').html();
		$('#folder-breadcrumb').html('Loading...');

		var processData = {
			ajaxResource: 'MATreeAJAXResources',
			action: 'get_folder_content_v2',
			FolderId: id

		};

		Visualforce.remoting.Manager.invokeAction(MARemoting.processAJAXRequestReadOnly,
			processData,
			function(res, event) {
				if (event.status) {
					if (res && res.success) {
						//keep a easy to find folder location var
						//Store Current Folder
						MALayers.currentFolder = id;
						$('#layer-tab-folders').attr('data-folder', id);

						//Store Current Folder Name and NodeType

						if (res.hasOwnProperty('data')) {
							MALayers.currentFolderName = res.data.breadcrumbs[res.data.breadcrumbs.length - 1].name;
							if (res.data.breadcrumbs.length >= 2) {
								MALayers.currentFolderNodeType = res.data.breadcrumbs[1].name + 'Folder';
							}


							$('#folder-breadcrumb').html('');
							$('#folder-contents').html('');

							var BreadCrumbLinks = [];

							var breadCrumbHtml = [];
							$.each(res.data.breadcrumbs, function(index, value) {
								BreadCrumbLinks.push('<a href="javascript:MALayers.breadCrumbClickHandler(\'' + value.id + '\');">' + htmlEncode(value.name) + '</a>');
								if (value.name != 'Home') {
									breadCrumbHtml.push(value.name);
								}

							});

							$('#folder-breadcrumb').html(BreadCrumbLinks.join(' <span class="breadcrumb-caret"></span> '));
							breadCrumbHtml = breadCrumbHtml.join(' <span class="breadcrumb-caret"></span> ');


							//Folder Create Actions
							var ActionsArray = MALayers.processActionsArray({
								actionType: 'folder',
								actionsArray: res.data.create
							});
							if (ActionsArray.length == 0) {
								$('#folder-create-actions').html('<div class="action-disabled">' + MASystem.Labels.MA_No_Actions + '</div>');
							} else {
								$('#folder-create-actions').html(ActionsArray.join(' '));
							}


							//folder-actions
							var FolderActionsArray = MALayers.processActionsArray({
								actionType: 'folder',
								actionsArray: res.data.actions
							});
							if (FolderActionsArray.length == 0) {
								$('#folder-actions').html('<div class="action-disabled">' + MASystem.Labels.MA_No_Actions + '</div');
							} else {
								$('#folder-actions').html(FolderActionsArray.join(' '));

								//Set the set/clear default folder button correctly
								if (MALayers.currentFolder === MALayers.defaultFolder) {
									$('#folder-actions').find('div.layer-action[action="set-default"]').hide();
									$('#folder-actions').find('div.layer-action[action="clear-default"]').show();
								} else {
									$('#folder-actions').find('div.layer-action[action="set-default"]').show();
									$('#folder-actions').find('div.layer-action[action="clear-default"]').hide();
								}
							}


							var folderItemTemplate = $('#folderItem-template').html();

							$.each(res.data.contents, function(index, value) {
								// If the layer has a plot on load we should go ahead and make the plot on load link into a remove plot on load
								// if(IsPlotOnLoad(value.properties.id)) {
								//     // This is already a plot on load layer
								// }
							
								var propertyDescription = value.properties.description == null ? 'No Description' : value.properties.description;
								var actions = '';
								var actionList = MALayers.processActionsArray({
									actionType: 'layer',
									actionsArray: value.actions
								});


								actions = actionList.length == 0 ? '<div class="action-disabled">' + MASystem.Labels.MA_No_Actions + '</div>' : actionList.join(' ');
								

								//territory layers do not have baseobjectnames.  This prevents baseobjectname from defaulting to 'data layer' if it's a territory.								
								if(value.properties.baseobjectname)
								{
									value.properties.baseobjectname = value.properties.type === 'territory' ? 'Territory Layer' : value.properties.baseobjectname;
								} 
								
								$('#folder-contents').append(folderItemTemplate
									.replace(/::ID::/g, value.properties.id)
									.replace(/::DATA_ID::/g, 'SAVED_' + value.properties.id)
									.replace(/::TYPE::/g, value.properties.type.toLowerCase())
									.replace(/::NAME::/g, value.properties.name)
									.replace(/::DEFAULTACTION::/g, value.properties.defaultaction)
									.replace(/::ACTIONS::/g, actions)
									.replace(/::PERM-CREATE::/g, value.permissions.create)
									.replace(/::PERM-DELETE::/g, value.permissions.delete)
									.replace(/::PERM-EXPORT::/g, value.permissions.export)
									.replace(/::PERM-MODIFY::/g, value.permissions.modify)
									.replace(/::PERM-READ::/g, value.permissions.read)
									.replace(/::PERM-SETPERM::/g, value.permissions.setpermissions)
									.replace(/::NODETYPE::/g, value.properties.nodetype)
									.replace(/::TOOLTIP-TITLE::/g, htmlEncode(value.properties.name))
									.replace(/::TOOLTIP-DESC::/g, htmlEncode(propertyDescription))
									.replace(/::TOOLTIP-BASEOBJ::/g, htmlEncode(value.properties.baseobjectname) || 'N/A')
									.replace(/::TOOLTIP-PLOTONLOAD::/g, value.properties.plotonload)
									.replace(/::TOOLTIP-CREATED::/g, htmlEncode(value.properties.created))
									.replace(/::TOOLTIP-MODIFIED::/g, htmlEncode(value.properties.lastmodified))
								);

								$('#folder-contents .folderItem[data-id="SAVED_' + value.properties.id + '"]').data({
									id: value.properties.id,
									name: htmlEncode(value.properties.name),
									description: htmlEncode(propertyDescription),
									created: htmlEncode(value.properties.created),
									modified: htmlEncode(value.properties.lastmodified),
									baseObject: htmlEncode(value.properties.baseobjectname) || 'N/A',
									folderPath: breadCrumbHtml || '',
									datalayerPlotType: htmlEncode(value.properties.dataLayerPlotType) || ''
								});


								if (value.properties.id === MALayers.defaultFolder) {
									//this is the current default folder
									$('#folder-contents').find('div#' + value.properties.id).find('div.layer-action[action="set-default"]').hide();
								} else {
									$('#folder-contents').find('div#' + value.properties.id).find('div.layer-action[action="clear-default"]').hide();
								}


								if (value.properties.type.toLowerCase() === 'folder') {
									// Hide popover for folders.
									$('#folder-contents').find('div#' + value.properties.id).find('div.ftu-tooltip').hide();
									$('#folder-contents').find('div#' + value.properties.id).find('div.ftu-tooltip-arrow').hide();
								} else if (value.properties.baseobjectname === undefined) {
									// Hide base object for items with no base object
									$('#folder-contents').find('div#' + value.properties.id).find('div.ft-tooltip-baseob').hide();
								}

								if (value.properties.plotonload) {
									$('#folder-contents').find('div#' + value.properties.id).find('.ftu-icon-left').addClass('is-plot-on-load');
								}								
								if (value.properties.folderPath !== '') {
									$('#folder-contents .folderItem[data-id="SAVED_' + value.properties.id + '"]').find('.ftu-tooltip-pad-gray').prepend('<div class="layer-folder-path"><div class="ftu-icon-icon inline" type="folder"></div>' + breadCrumbHtml + '</div>');
								}

							});
						}

						MALayers.filterChangeHandler();
						dfd.resolve();
					} else {
						$('#folder-breadcrumb').html(previousBreadCrumbs);
						MALayers.loadFolder(MALayers.currentFolder);
						MAToastMessages.showError({message:'Folder Error',subMessage:'Unable to get folder contents',timeOut:6000,closeButton:true});
						dfd.reject();
					}
				} else {
					$('#folder-breadcrumb').html(previousBreadCrumbs);
					MALayers.loadFolder(MALayers.currentFolder);
					MAToastMessages.showError({message:'Folder Error',subMessage:'Unable to get folder contents',timeOut:6000,closeButton:true});
					dfd.reject();
				}
			}, {
				buffer: false,
				escape: true,
				timeout: 120000
			}

		);
		return dfd.promise();
	},

	refreshFolder: function(options) {
		options = $.extend({
            moveToSavedTab: true
        }, options || {});
		var dfd = $.Deferred();
		MALayers.loadFolder(MALayers.currentFolder, options).then(function() {
			dfd.resolve();
		}).fail(function () {
			dfd.reject();
		});
		return dfd.promise();
	},
	renameFolderV2: function() {
		$('#CreateFolder_Popup .saving-wrapper').show();

		var id = $('#CreateFolder_Popup').attr('layerId');
		var name = $('#CreateFolder_Popup').find('input[role="folderName"]').val();

		if (name == '') {
			$('#CreateFolder_Popup .folderName').addClass('error');
			return;
		}

		$('#CreateFolder_Popup .folderName').removeClass('error');

		var processData = {
			ajaxResource: 'MATreeAJAXResources',
			action: 'rename_folder',
			id: id,
			name: name
		};

		Visualforce.remoting.Manager.invokeAction(MARemoting.processAJAXRequest,
			processData,
			function(json, event) {
				if (json.success) {
					Debug("Renamed Node " + json.id);
					MALayers.refreshFolder();
				} else {
					NotifyError("Error Renaming Node", json.error);
					Debug("Error Renaming Node " + json.error);
				}
			}, {
				buffer: false
			}
		);

		// Clean up!
		MA.Popup.closeMAPopup();
	},
	renameFolder: function() {
		$('#CreateFolderPopup .saving-wrapper').show();

		var id = $('#CreateFolderPopup').attr('layerId');
		var name = $('#CreateFolderPopup').find('input[role="folderName"]').val();

		if (name == '') {
			$('#CreateFolderPopup .folderName').addClass('error');
			return;
		}

		$('#CreateFolderPopup .folderName').removeClass('error');

		var processData = {
			ajaxResource: 'MATreeAJAXResources',

			action: 'rename_folder',
			id: id,
			name: name
		};

		Visualforce.remoting.Manager.invokeAction(MARemoting.processAJAXRequest,
			processData,
			function(json, event) {
				if (json.success) {
					Debug("Renamed Node " + json.id);
					MALayers.refreshFolder();
				} else {
					NotifyError("Error Renaming Node", json.error);
					Debug("Error Renaming Node " + json.error);
				}
			}, {
				buffer: false
			}
		);

		// Clean up!
		ClosePopupWindow();
		$('#CreateFolderPopup .saving-wrapper').hide();
		$('#CreateFolderPopup .folderName').val('');
	},
	createFolderV2: function() {
		$('#CreateFolder_Popup .maPopupLoading').removeClass('hidden');

		var pid = $('#CreateFolder_Popup').attr('layerId');
		var nodeType = $('#CreateFolder_Popup').attr('nodeType');
		var name = $('#CreateFolder_Popup').find('input[role="folderName"]').val();

		if (name == '') {
			$('#CreateFolder_Popup .folderName').addClass('error');
			$('#CreateFolder_Popup .maPopupLoading').addClass('hidden');
			return;
		}

		if (pid === 'PersonalRoot' || pid === 'CorporateRoot') {
			nodeType = pid;
		}

		$('#CreateFolder_Popup .folderName').removeClass('error');


		var processData = {
			ajaxResource: 'MATreeAJAXResources',

			action: 'new_folder',
			pid: pid,
			pos: '0',
			name: name,
			NodeType: nodeType,
			personUser: 'user'
		};

		Visualforce.remoting.Manager.invokeAction(MARemoting.processAJAXRequest,
			processData,
			function(json, event) {
				if (json.success) {
					Debug("Created Node " + json.id);
					MALayers.refreshFolder();
				} else {
					NotifyError("Error Creating Node", json.error);
					Debug("Error Creating Node " + json.error);
				}
			}, {
				buffer: false
			}
		);

		// Clean up!
		MA.Popup.closeMAPopup();
	},
	createFolder: function() {
		$('#CreateFolderPopup .saving-wrapper').show();

		var pid = $('#CreateFolderPopup').attr('layerId');
		var nodeType = $('#CreateFolderPopup').attr('nodeType');
		var name = $('#CreateFolderPopup').find('input[role="folderName"]').val();

		if (name == '') {
			$('#CreateFolderPopup .folderName').addClass('error');
			return;
		}

		if (pid === 'PersonalRoot' || pid === 'CorporateRoot') {
			nodeType = pid;
		}

		$('#CreateFolderPopup .folderName').removeClass('error');

		var processData = {
			ajaxResource: 'MATreeAJAXResources',

			action: 'new_folder',
			pid: pid,
			pos: '0',
			name: name,
			NodeType: nodeType,
			personUser: 'user'
		};

		Visualforce.remoting.Manager.invokeAction(MARemoting.processAJAXRequest,
			processData,
			function(json, event) {
				if (json.success) {
					Debug("Created Node " + json.id);
					MALayers.refreshFolder();
				} else {
					NotifyError("Error Creating Node", json.error);
					Debug("Error Creating Node " + json.error);
				}
			}, {
				buffer: false
			}
		);

		// Clean up!
		ClosePopupWindow();
		$('#CreateFolderPopup .saving-wrapper').hide();
		$('#CreateFolderPopup .folderName').val('');
	},
	createShapeLayer: function() {
		// LaunchPopupWindow($('#CreateTerritoryPopup'), 900);
		openShapeLayerBuilder();
		$('#CreateTerritoryPopup').data('folderId', MALayers.currentFolder);
	},
	createFavoriteLayer: function() {
		window.VueEventBus.$emit('launch-favorite-modal');
	},
	createTerritoryLayer: function() {
		getLayerCount().then(function(layerCount) {
			if (Number.isInteger(layerCount) && layerCount >= 10) {
				window.VueEventBus.$emit('show-generic-modal', {
					title: 'Maximum Territory Layer Limit',
					message: 'You have reached the maximum amount of territory layers (10). Please remove a territory layer if you wish to create a new territory layer'
				});
			} else {
				window.VueEventBus.$emit('render-territory-builder');
			}
		});
	},
	createArcGISWebMapLayer: function(saveModal) {
		var $button = $(saveModal);
        var f = MALayers.currentFolder;
        var ft = MALayers.currentFolderNodeType;
		var validArcGISLayer = false;
		var isHome = false;
		if(f === 'Home') {
			// Opened from the Recent tab and the folder doesn't matter because we're editing an existing layer by its ID.
			// If you pass the Home folder to QueryBuilderAPI, you'll get Invalid id: Home.
			f = 'PersonalRoot';
			isHome = true;
		}
        if(f === 'PersonalRoot' || f === 'CorporateRoot') {
            ft = f;
        }

        var layerName = $('div#CreateNewArcGISWebMapPopup').find('input[name="Name"]').val() || '--None--';
        var layerDescription = $('div#CreateNewArcGISWebMapPopup').find('input[name="Description"]').val() || '--None--';
        var layerWebMapURL = $('div#CreateNewArcGISWebMapPopup').find('textarea[name="WebMapURL"]').val() || '--None--';
        var automaticRefresh = $('div#CreateNewArcGISWebMapPopup').find('input[name="AutomaticRefresh"]:checked').val();
        var refreshInterval = $('div#CreateNewArcGISWebMapPopup').find('input[name="RefreshInterval"]').val() || '--None--';
        var click2createTemplates = $('#webMapTemplateTable  .WebMapC2CTemplateRows tr');

        if(ArcGIS.validateDetails()) {
			$button.text(MASystem.Labels.MA_Saving + "...").attr('disabled', 'disabled');
            var remoteData = {
                folder : f,
                folderType : ft,
                layerName : layerName,
                layerDescription : layerDescription,
                layerWebMapURL : layerWebMapURL,
                automaticRefresh : automaticRefresh,
                refreshInterval : refreshInterval,
                ajaxResource : 'QueryBuilderAPI',
				securityToken: MASystem.MergeFields.Security_Token,

				action: 'saveArcGISWebMapLayer'
            }
            if($('div#CreateNewArcGISWebMapPopup').attr('data-mode') == 'edit')
            {
                remoteData.recId = $('div#CreateNewArcGISWebMapPopup').attr('data-layerid');
            }

			var c2cTemplates = [];
			$.each(click2createTemplates,function(i,row)
			{
				rowData = getProperty($(row).data(),'rowData',false) || null;
				if(rowData != null)
				{
					var webMapLabel = getProperty(rowData,'webMapLayer.label',false) || '';
					if(webMapLabel != undefined && webMapLabel != '')
					{
						c2cTemplates.push(rowData);
					}
				}
			});
			remoteData.click2createTemplates = JSON.stringify(c2cTemplates);

            //saveArcGISWebMapLayer
            Visualforce.remoting.Manager.invokeAction(MARemoting.processAJAXRequest,
                remoteData,
                function(response,event){
					$button.text(MASystem.Labels.MA_Save).removeAttr('disabled');
                    if (response.success)
                    {
                        validArcGISLayer = true
                        //attempt to fire the success callback
                        var plotQueryOnComplete = $button.is('.plotbtn');
                        MALayers.breadCrumbClickHandler(isHome ? 'Home' : remoteData.folder);
                        $('#error-message').remove();
                        $(".WebMapC2CTemplateRows").empty();
                        $('#arcConnectionSuccess').hide();
				        $('#arcConnectionFail').hide();
				        $('.arc-config-input-wrapper').empty();
				        $('#fieldMappingsWrapper .arc-field-mapping-input').remove();
				        $('#fieldMappingsWrapper').removeClass('fadeInLeft');
				        $('#fieldMappingsWrapper').removeClass('fadeInDown');
				        $('#webMapTemplateTable table tbody').empty();
				        $('#webMapTemplateTable').removeClass('fadeInLeft');
				        $('#CreateNewArcGISWebMapPopup .arc-advanced').removeClass('slds-is-active');
				        $('#CreateNewArcGISWebMapPopup .arc-click-to-create').removeClass('slds-is-active');
				        $('#CreateNewArcGISWebMapPopup .arc-details').addClass('slds-is-active');
				        $('#arcgisDetailsTab').removeClass('slds-hide').addClass('slds-show');
				        $('#arcgisC2CSetupTab').removeClass('slds-show').addClass('slds-hide');
				        $('#arcgisAdvancedTab').removeClass('slds-show').addClass('slds-hide');
                        closeThisSLDSModal($button);
                        //ArcGIS.closeCreateWindow();
                    }

                }
            );
        }

	},

	createMarkerLayer: function(el) {
		// ClosePopupWindow();
        MALayers.hideModal('SelectBaseObjectPopup');
		var f = MALayers.currentFolder;
		var ft = MALayers.currentFolderNodeType;


		if (f === 'PersonalRoot' || f === 'CorporateRoot') {
			ft = f;
		}
        var $baseObjectPopup = $('#SelectBaseObjectPopup');
		// var b = $('div#SelectBaseObjectPopup').find('input[name="baseObject"]:checked').val() || 'a02A0000007O4zUIAS';
		var b = $baseObjectPopup.find('input[name="baseObject"]:checked').val() || 'a02A0000007O4zUIAS';
		var layerSubType = $(el).attr('data-layerSubType');

		var queryEditorString = MA.resources.QueryBuilder + "?b=" + b + "&f=" + f + "&ft=" + ft;

		if (layerSubType) {
			queryEditorString = queryEditorString + '&layerSubType=' + layerSubType.trim();
        }
        
		launchQueryEditor(queryEditorString);
	},


	displayCreateRenamePopup: function(options) {
		var id = options.id || '';
		var header = options.header || '';
		var action = options.action || '';
		var jsaction = options.jsaction || '';

		if (action !== 'new-folder' && id === '') {
			alert('Error: No id!');
		} else if (header === '') {
			alert('Error: No header!');
		} else if (action === '') {
			alert('Error: No action!');
		} else {

			var popup = MA.Popup.showMAPopup({
				template: $('#templates .CreateFolderPopup').clone(),
				popupId: 'CreateFolder_Popup',
				width: 400,
				title: header,
				buttons: [
					{
						text: 'Cancel',
						type: 'slds-button_neutral',
					},
					{
						text: 'Create',
						type: 'slds-button_brand',
						keepOpen: true,
						onclick: action === 'rename-folder' ? MALayers.renameFolderV2 : MALayers.createFolderV2
					}
				]
			});

			//LaunchPopupWindow($('#CreateFolderPopup'), 350);
			$('#CreateFolder_Popup').attr('layerId', id);
			setTimeout(function() {
				$('#CreateFolder_Popup').find('.folderName').focus();
			}, 200);
			

			if (action === 'rename-folder') {
				$('#CreateFolder_Popup').find('input[role="folderName"]').val(htmlDecode(options.name));
			} else if (action === 'new-folder') {
				$('#CreateFolder_Popup').attr('nodeType', options.nodetype);
			}
		}
	},
	displayCopyMovePopup: function(options) {
		var id = options.id || '';
		var header = options.header || '';
		var action = options.action || '';
		var jsaction = options.jsaction || '';

		if (action !== 'new-folder' && id === '') {
			alert('Error: No id!');
		} else if (header === '') {
			alert('Error: No header!');
		} else if (action === '') {
			alert('Error: No action!');
		} else {

			LaunchPopupWindow($('#CopyToPopup'), 300);
			$('#CopyToPopup').attr('layerId', id);
			$('#CopyToPopup').find('span[role="copyLabel"]').hide();
			$('#CopyToPopup').find('button[role="saveButton"]').attr('onclick', jsaction);

			if (action === 'rename-folder') {
				$('#CopyToPopup').find('input[role="folderName"]').val(options.name);
			} else if (action === 'new-folder') {
				$('#CopyToPopup').attr('nodeType', options.nodeType);
			}
		}
	},
	displayCreateArcGISWebMapLayerPopup: function(options) {
		$('#arcConnectionFail').hide();
		options = $.extend({
			baseObjectType : ''
		}, options || {});
		var popup = $('div#CreateNewArcGISWebMapPopup');
		var fieldMappings = {};
		//arcgis derek
		$('.arc-click-to-create').css({
			'pointer-events':'none',
			'opacity':'0.6'
		})
		$(popup).attr('data-mode','');
		$(popup).attr('data-layerid','');
		$(popup).find('.slds-input').val("");
		$(popup).find('.slds-textarea').val("");
		$('#arc-name-error-message').remove();
		$('#arc-url-error-message').remove();
		$('#arc-automaticrefresh-error-message').remove();
		$('#arc-refreshinterval-error-message').remove();
		$(popup).addClass('slds-fade-in-open');
		$(popup).find('.slds-form-element').removeClass('slds-has-error');
		if(options.action=='edit-data-layer' || options.action=='clone-data-layer')
		{
			var processData = {
				ajaxResource : 'QueryBuilderAPI',
				securityToken: MASystem.MergeFields.Security_Token,
				action: 'editArcGISWebMapLayer',
				recId : options.id
			};

			Visualforce.remoting.Manager.invokeAction(MARemoting.processAJAXRequest,
				processData,
				function(response, event){
					if(response.success)
					{
						var rec = response.data[0];
						var layerName = rec.Name != undefined ? rec.Name : '';
						var layerDescription = rec.sma__Description__c != undefined ? rec.sma__Description__c : '';
						var layerOptions = rec.sma__Options__c != undefined ? JSON.parse(rec.sma__Options__c) : {};
						fieldMappings = rec.sma__ArcGISWebMapC2C__c != undefined ? JSON.parse(rec.sma__ArcGISWebMapC2C__c) : [];
						$(popup).data('options',options);
						$(popup).data('fieldMappings',fieldMappings);
                        $(".WebMapC2CTemplateRows").empty();
						if(fieldMappings.length > 0)
						{
							ArcGIS.click2CreateHelpers.populateTemplates(fieldMappings);
						}
						if(options.action=='edit-data-layer')
						{

							$(popup).attr('data-mode','edit');
							$(popup).attr('data-layerid',options.id);
							$(popup).find('input[name="Name"]').val(layerName);

						} else if(options.action=='clone-data-layer')
						{
							 $(popup).find('input[name="Name"]').val('Copy of ' + layerName);

						}
						$(popup).find('input[name="Description"]').val(layerDescription);
						$(popup).find('textarea[name="WebMapURL"]').val(layerOptions.baseURL);
						$(popup).find('input[name="AutomaticRefresh"][value="' + layerOptions.automaticRefresh + '"]').prop('checked', true);
						$(popup).find('input[name="RefreshInterval"]').val(layerOptions.refreshInterval == '--None--' ? '' : layerOptions.refreshInterval);
						if(ArcGIS.validateDetails())
						{
							$('.arc-click-to-create').css({
								'pointer-events':'',
								'opacity':'1'
							})
						} else {
							$('.arc-click-to-create').css({
								'pointer-events':'none',
								'opacity':'0.6'
							})
						}
					}
				},{buffer:false,escape:false,timeout:120000}
			);
		} else
		{
			$(popup).attr('data-mode','');
			$(popup).attr('data-layerid','');
			$(popup).find('.slds-input').val("");
			$(popup).find('.slds-textarea').val("");
			$(popup).find('input').first().focus();
		}
		//$('#CreateNewArcGISWebMapPopup').data('options',options);
	    //$('#CreateNewArcGISWebMapPopup').data('fieldMappings',fieldMappings);
		//Click2Create Modal code.
		$('#sldsModalBackDrop').addClass('slds-backdrop--open');



		/**var rowTemplate = '<tr><td><label>Name</label></td><td style="white-space: normal !important;"><input type="text" name="Name" maxlength="255" size="15"></input></td></tr>'
						+ '<tr><td><label>Description</label></td><td style="white-space: normal !important;"><input type="text" name="Description" maxlength="255" size="30"></input></td></tr>'
						+ '<tr><td><label>WebMap URL</label></td><td style="white-space: normal !important;"><input type="text" name="WebMapURL" size="30" ></input></td></tr>';
		popup.find('table#NewArcGISWebMap').html(rowTemplate);*/

	   // LaunchPopupWindow(popup, 400);
	},

	displayCreateMarkerLayerPopup: function(options) {
		options = $.extend({
			baseObjectType: ''
		}, options || {});

        var $baseObjectPopup = $('#SelectBaseObjectPopup');
        var $table = $baseObjectPopup.find('.baseObjectSelection').empty().hide();
        var $loading = $baseObjectPopup.find('.js-baseObjectLoad').show();
        MALayers.showModal('SelectBaseObjectPopup');

		// added to enable passing of a virtual layer type such as a Live-Device which is based on the Live Base Object but is a different type of layer to the user
		var baseObjectType = typeof(options.baseObjectType) == 'string' ? options.baseObjectType.trim() : '';

		// subtype to give a subtype of layer eg. device as subtype of live
		var layerSubType = typeof(options.layerSubType) == 'string' && !/::/.test(options.layerSubType) ? options.layerSubType.trim() : '';

        $baseObjectPopup.find('.js-baseObjectSubType').text(baseObjectType.toUpperCase());
        $baseObjectPopup.find('.js-layerSubType').attr('data-layerSubType',layerSubType);

        // create a row template
        var rowTemplate =   '<tr>'+
                                '<td tabindex="::tabIndex::">'+
                                    '<span class="slds-radio">'+
                                        '<input type="radio" id="radio-::tabIndex::" value="::ID::" name="baseObject" />'+
                                        '<label class="slds-radio__label" for="radio-::tabIndex::">'+
                                            '<span class="slds-radio_faux"></span>'+
                                            '<span class="slds-form-element__label">::NAME::</span>'+
                                        '</label>'+
                                    '</span>'+
                                '</td>'+
                                '<td style="white-space: normal !important;">::DESC::</td>'+
                            '</tr>';

        // get baseobject data
		var processData = {
			ajaxResource: 'MATreeAJAXResources',
			securityToken: MASystem.MergeFields.Security_Token,
			action: 'get_baseobjects',
			type: baseObjectType
		};

		Visualforce.remoting.Manager.invokeAction(MARemoting.processAJAXRequest,
			processData,
			function(res, event) {
				if (res.success) {
					if (res.data.length > 0) {
                        var newHTML =   '<thead class="ma-table-header">'+
                                            '<tr class="slds-text-title_caps">'+
                                                '<th>Base Object</th>'+
                                                '<th>Description</th>'+
                                            '</tr>'+
                                        '<thead>';
                        newHTML += '<tbody>';
						$.each(res.data, function(index, value) {
							newHTML += rowTemplate
								.replace(/::ID::/g, value.id)
								.replace(/::NAME::/g, htmlEncode(value.name))
                                .replace(/::DESC::/g, htmlEncode(value.description))
                                .replace(/::tabIndex::/g, index);
						});
						newHTML += '</tbod>';
						$table.html(newHTML);

						// $('div#SelectBaseObjectPopup').find('input')[0].checked = true;
                        $baseObjectPopup.find('input')[0].checked = true;
                        $loading.hide();
                        $table.show();
					} else {
                        MALayers.hideModal('SelectBaseObjectPopup');
						var alertPopup = MA.Popup.showMAAlert({
							title: 'No Base Object Exists!',
							template: 'Unfortunately no base objects have been configured. Please create one or contact your SF admin to continue.',
							okText: 'OK',
							okType: 'slds-button_brand',
						});
					}

				} else {
                    MALayers.hideModal('SelectBaseObjectPopup');
					var alertPopup = MA.Popup.showMAAlert({
						title: 'Base Object Error',
						template: 'An error occured while retreiving the available base objects. Please try refreshing the page or contacting your SF admin.',
						okText: 'Cancel',
						okType: 'slds-button_brand',
					});
				}
			}, {
				buffer: false,
				escape: false
			}
		);
	},

	processActionsArray: function(options) {
		/*
		    actionType : 'folder' or 'layer'
		    actionsArray : []
		*/

		if (options.actionsArray) {
			if (options.actionsArray.length == 0) {
				return [];
			} else {
				var TempArray = [];
				$.each(options.actionsArray, function(index, action) {
					if (action.type == 'header') {
						if (action.label !== 'Plot') {
							TempArray.push('<div class="folder-action-divider"></div>');
						}
						TempArray.push('<div class="dropdown-header">' + action.label + '</div>');
					} else if (action.type == 'title') {
						TempArray.push('<div class="dropdown-title">' + action.label + '</div>');
					} else if (action.type == 'action') {
						ArrayAttributes = [];
						var iconDisplay = 'none';
						if (action.enabled) {
							ArrayAttributes.push('class="layer-action"');
							ArrayAttributes.push('action="' + action.action + '"');
							if (options.actionType == 'folder') {
								iconDisplay = 'block';
								ArrayAttributes.push('action-type="folder"');
								ArrayAttributes.push('onclick="MALayers.folderActionsClickHandler(this);"');
							} else {
								ArrayAttributes.push('onclick="MALayers.layerActionsClickHandler(this);"');
							}
						} else {
							ArrayAttributes.push('class="action-disabled layer-action"');
						}
						if (action.icon != undefined && action.icon != '') {
							TempArray.push('<div ' + ArrayAttributes.join(' ') + '><div class="ftu-icon-left"><div class="ftu-icon-icon inline" type="' + action.icon + '"></div></div><div class="ftu-text inline">' + action.label + '</div></div>');
						} else {
							TempArray.push('<div ' + ArrayAttributes.join(' ') + '><div class="ftu-icon-icon inline" type="' + action.icon + '"></div><div class="ftu-text inline">' + action.label + '</div></div>');

						}

					}
				});

				return TempArray;
			}
		} else {
			return [];
		}


	},
	breadCrumbClickHandler: function(id) {
		MALayers.processLayerAction({
			action: 'open-folder',
			id: id,
			type: 'folder'
		});
	},

	filterChangeHandler: function() {		
		$("input.folder-filter-type").each(function(index) {
			//take a look at this speed test for looking for "checked"

			//https://jsperf.com/jquery-s-attr-vs-native-getattribute/5
			//https://jsperf.com/jquery-attr-vs-getattribute
			//https://jsperf.com/prop-vs-ischecked/5

			if (this.checked) {
				$('div.folderItem[type="' + this.getAttribute('filter-type') + '"]').show();
			} else {
				$('div.folderItem[type="' + this.getAttribute('filter-type') + '"]').hide();
			}
			//if ($(this).prop('checked')



		});
	},

	doPlotOnLoad: function(id) {
		var saved = $('div#layer-tab-folders').find('div#' + id).find('.ftu-icon-left');
		var recent = $('div#recent-queries').find('div#' + id).find('.ftu-icon-left');
		var search = $('div#foldersearch-results-contents').find('div#' + id).find('.ftu-icon-left');

		if (saved.hasClass('is-plot-on-load') || recent.hasClass('is-plot-on-load') || search.hasClass('is-plot-on-load')) {
			var processData = {
				ajaxResource: 'MATreeAJAXResources',

				action: 'remove_plot_on_load',
				id: id
			};

			Visualforce.remoting.Manager.invokeAction(MARemoting.processAJAXRequest,
				processData,
				function(json, event) {
					if (json.success) {
						userSettings.PlotOnLoadQueries.splice(userSettings.PlotOnLoadQueries.indexOf(id), 1);
						Debug("Removed Plot On Load " + json.id);
						MALayers.loadRecent();
						NotifySuccess("Success!", "Removed Plot On Load");
						saved.removeClass('is-plot-on-load');
						recent.removeClass('is-plot-on-load');
						search.removeClass('is-plot-on-load');
						$('div#layer-tab-folders').find('div#' + id).find('.ft-tooltip-plotonload').html('<td class="label"><b>' + MASystem.Labels.MA_Plot_On_Load + '</b> </td><td class="value">False</td>');
						$('div#foldersearch-results-contents').find('div#' + id).find('.ft-tooltip-plotonload').html('<td class="label"><b>' + MASystem.Labels.MA_Plot_On_Load + '</b> </td><td class="value">False</td>');
					} else {
						NotifyError("Error Removing Plot On Load", json.error);
						Debug("Error Removing Plot On Load " + json.error);
					}
				}, {
					buffer: false
				}
			);
		} else {
			var processData = {
				ajaxResource: 'MATreeAJAXResources',

				action: 'add_plot_on_load',
				id: id
			};

			Visualforce.remoting.Manager.invokeAction(MARemoting.processAJAXRequest,
				processData,
				function(json, event) {
					if (json.success) {
						userSettings.PlotOnLoadQueries.push(id);
						Debug("Added Plot On Load " + json.id);
						MALayers.loadRecent();
						NotifySuccess("Success!", "Added Plot On Load");
						saved.addClass('is-plot-on-load');
						recent.addClass('is-plot-on-load');
						search.addClass('is-plot-on-load');

						$('div#layer-tab-folders').find('div#' + id).find('.ft-tooltip-plotonload').html('<td class="label"><b>' + MASystem.Labels.MA_Plot_On_Load + '</b> </td><td class="value">True</td>');
						$('div#foldersearch-results-contents').find('div#' + id).find('.ft-tooltip-plotonload').html('<td class="label"><b>' + MASystem.Labels.MA_Plot_On_Load + '</b> </td><td class="value">True</td>');
					} else {
						NotifyError("Error Adding Plot On Load", json.error);
						Debug("Error Adding Plot On Load " + json.error);
					}
				}, {
					buffer: false
				}
			);
		}
	},

	folderActionsClickHandler: function(obj) {
		var $LayerDOMElement = $(obj).closest('div.folderItem');

		var action = $(obj).attr('action');
		var type = $(obj).attr('action-type');

		MALayers.processLayerAction({
			action: action,
			id: MALayers.currentFolder,
			type: type,
			name: MALayers.currentFolderName,
			nodetype: MALayers.currentFolderNodeType,
			create: $LayerDOMElement.attr('perm-create'),
			delete: $LayerDOMElement.attr('perm-delete'),
			export: $LayerDOMElement.attr('perm-export'),
			modify: $LayerDOMElement.attr('perm-modify'),
			read: $LayerDOMElement.attr('perm-read'),
			setpermissions: $LayerDOMElement.attr('perm-setpermissions'),
		});

		//stop propagation
		return false;
	},
	layerActionsClickHandler: function(obj) {
		var action = $(obj).attr('action');
		var $LayerDOMElement = $(obj).closest('div.folderItem');
		var layerData = $LayerDOMElement.data() || {};
		var id = $LayerDOMElement.attr('id');
		var type = $LayerDOMElement.attr('type');
		MALayers.processLayerAction({
			action: action,
			id: layerData.id,
			type: type,
			name: layerData.name,
			dataLayerPlotType: layerData.datalayerPlotType,
			description: layerData.description || 'No Description',
			baseObjectLabel: layerData.baseObject || 'N/A',
			modifiedInfo: layerData.modified || 'N/A',
			createdInfo: layerData.created || 'N/A',
			nodetype: $LayerDOMElement.attr('nodetype'),
			create: $LayerDOMElement.attr('perm-create') == 'true' ? true : false,
			delete: $LayerDOMElement.attr('perm-delete') == 'true' ? true : false,
			export: $LayerDOMElement.attr('perm-export') == 'true' ? true : false,
			modify: $LayerDOMElement.attr('perm-modify') == 'true' ? true : false,
			read: $LayerDOMElement.attr('perm-read') == 'true' ? true : false,
			setpermissions: $LayerDOMElement.attr('perm-setpermissions') == 'true' ? true : false,
			folderPath: layerData.folderPath || ''
		});

		//stop propagation
		return false;
	},

	processLayerAction: function(options) {
 		var action = options.action;
		var id = options.id;
		var type = options.type;
		var nodetype = options.nodetype;
		const plotDataRegex = /(plot-data-layer)/;
		//convert to lowercase for safety
		type = type.toLowerCase();

		if (type == 'arcgisonline')
		{
			if (action == 'edit-data-layer' || action == 'clone-data-layer')
			{
				options = $.extend(
				{
					baseObjectType: 'arcgis',

				}, options || {});
				MALayers.displayCreateArcGISWebMapLayerPopup(options);
			}
			else if (plotDataRegex.test(action))
			{
				ArcGIS.plotLayer({
					id: options.id,
					modify: options.modify
				});
			}
			else if (action == 'copy-data-layer')
			{
				MALayers.copyNode(options);
			}
			else if (action == 'move-data-layer')
			{
				MALayers.moveNode(options);
			}
			else if (action == 'delete-data-layer')
			{				
				MALayers.deleteNode(options);
			}
		}
		else if (type == 'folder')
		{
			if (action == 'plot-map-all')
			{
				MALayers.moveToTab('plotted');
				//extend options with folder permissions
				options = $.extend(options,
				{
					id: options.id,
					renderAs: 'Default',
					visibleAreaOnly: false,
					doClick: false
				});
				PlotFolder(options);
			}
			else if (action == 'plot-visible-all')
			{
				MALayers.moveToTab('plotted');
				options = $.extend(options,
				{
					id: options.id,
					renderAs: 'Default',
					visibleAreaOnly: true,
					doClick: false
				});
				PlotFolder(options);
			}
			else if (action == 'rename-folder')
			{
				MALayers.displayCreateRenamePopup(jQuery.extend(options,
				{
					header: 'Rename Folder',
					jsaction: 'MALayers.renameFolder();'
				}));
			}
			else if (action == 'copy-folder')
			{
				MALayers.copyNode(options);
			}
			else if (action == 'move-folder')
			{
				MALayers.moveNode(options);
			}
			else if (action == 'delete-folder')
			{
				MALayers.deleteNode(options);
			}
			else if (action == 'open-folder')
			{
				MALayers.loadFolder(options.id);
			}
			else if (action == 'new-marker-layer')
			{
				MALayers.displayCreateMarkerLayerPopup(options);
			}
			else if (action == 'new-shape-layer')
			{
				MALayers.createShapeLayer();
			}
			else if (action == 'new-data-layer')
			{
				MAData.wizard.launchPopup(
				{
					folderId: options.id,
					isPlotted: false
				});
			}
			else if (action == 'new-favorite-location')
			{
				MALayers.createFavoriteLayer();
			}
			else if (action == 'new-territory-layer')
			{
				MALayers.createTerritoryLayer();
			}
			else if (action == 'new-folder')
			{
				MALayers.displayCreateRenamePopup(jQuery.extend(options,
				{
					header: 'New Folder',
					jsaction: 'MALayers.createFolderV2();'
				}));
			}
			else if (action == 'set-permissions')
			{
				EditPermissions(id, options.name);
			}
			else if (action == 'set-default')
			{
				MALayers.setDefaultFolder(id);
			}
			else if (action == 'clear-default')
			{
				MALayers.setDefaultFolder(null);
			}
			else if (action == 'new-live-layer')
			{
				options = $.extend(
				{
					baseObjectType: 'live'
				}, options || {});
				MALayers.displayCreateMarkerLayerPopup(options);
			}
			else if (action == 'new-geofence-layer')
			{
				options = $.extend(
				{
					baseObjectType: 'geofence'
				}, options || {});
				MALayers.displayCreateMarkerLayerPopup(options);
			}
			else if (action == 'new-live-device-layer')
			{
				options = $.extend(
				{
					baseObjectType: 'live-device',
					layerSubType: 'device',
				}, options || {});

				MALayers.displayCreateMarkerLayerPopup(options);
			}
			else if (action == 'new-arcgis-layer')
			{
				//alert('New Arc Layer');
				options = $.extend(
				{
					baseObjectType: 'arcgis'
				}, options || {});
				MALayers.displayCreateArcGISWebMapLayerPopup(options);
			}
		}
		else if (type == 'shape')
		{
			if (action == 'plot-shape')
			{
				MA_DrawShapes.init(options);
			}
			else if (action == 'plot-shape-custom')
			{
				MACustomShapes.drawV2(options);
			}
			else if (action == 'plot-load-shape')
			{
				MALayers.doPlotOnLoad(id);
			}
			else if (action == 'edit-shape-custom')
			{
				MACustomShapes.openPopupSidebar(
				{
					id: options.id
				});
			}
			else if (action == 'plot-edit-shape')
			{
				MACustomShapes.drawV2(
				{
					id: options.id,
					enableEdit: true
				});
			}
			else if (action == 'edit-shape')
			{
				// LaunchPopupWindow($('#CreateTerritoryPopup'), 900);
				clearGeometryInfo();
				openShapeLayerBuilder();

				$('#CreateTerritoryPopup').data(
				{
					'territoryId': options.id,
					'modify': options.modify,
					'delete': options.delete,
					'create': options.create
				});
				getboundaryInfo();
			}
			else if (action == 'clone-shape')
			{
				// LaunchPopupWindow($('#CreateTerritoryPopup'), 900);
				openShapeLayerBuilder();
				clearGeometryInfo();
				$('#CreateTerritoryPopup').data(
				{
					'territoryId': options.id,
					'folderId': MALayers.currentFolder
				});
				getboundaryInfo(
				{
					forClone: true
				});
			}
			else if (action == 'clone-custom-shape')
			{
				MACustomShapes.openPopupSidebar(
				{
					id: options.id,
					isClone:true
				});
			}
			else if (action == 'copy-shape')
			{
				MALayers.copyNode(options);
			}
			else if (action == 'move-shape')
			{
				MALayers.moveNode(options);
			}
			else if (action == 'delete-shape')
			{
				MALayers.deleteNode(options);
			}
		}
		else if (type == 'live')
		{
			if (action == 'plot-live-markers')
			{
				options.renderAs = ["Markers"];
				MAPlotting.analyzeQuery(options);
			}
			else if (action == 'edit-live-marker-layer')
			{
				launchQueryEditor(MA.resources.QueryBuilder + pageSuffix + '?q=' + id);
			}
			else if (action == 'clone-live-marker-layer')
			{
				launchQueryEditor(MA.resources.QueryBuilder + pageSuffix + '?q=::queryId::&c=true'.replace('::queryId::', id));
			}
			else if (action == 'copy-live-marker-layer')
			{
				MALayers.copyNode(options);
			}
			else if (action == 'move-live-marker-layer')
			{
				MALayers.moveNode(options);
			}
			else if (action == 'delete-live-marker-layer')
			{
				MALayers.deleteNode(options);
			}
			else if (action == 'plot-load-live-layer')
			{
				MALayers.doPlotOnLoad(id);
			}
		}
		else if (type == 'geofence')
		{
			if (action == 'plot-geofence-layer')
			{
				options.renderAs = ["Markers"];
				MAPlotting.analyzeQuery(options);
			}
			else if (action == 'edit-geofence-layer')
			{
				launchQueryEditor(MA.resources.QueryBuilder + pageSuffix + '?q=' + id);
			}
			else if (action == 'clone-geofence-layer')
			{
				launchQueryEditor(MA.resources.QueryBuilder + pageSuffix + '?q=::queryId::&c=true'.replace('::queryId::', id));
			}
			else if (action == 'copy-geofence-layer')
			{
				MALayers.copyNode(options);
			}
			else if (action == 'move-geofence-layer')
			{
				MALayers.moveNode(options);
			}
			else if (action == 'delete-geofence-layer')
			{
				MALayers.deleteNode(options);
			}
			else if (action == 'plot-geofence-marker')
			{
				MALayers.doPlotOnLoad(id);
			}
			else if (action == 'plot-load-geofence-layer')
			{
				MALayers.doPlotOnLoad(id);
			}
		}
		else if (type == 'live-device')
		{
			if (action == 'plot-live-device-layer')
			{
				options.renderAs = ["Markers"];
				MAPlotting.analyzeQuery(options);
			}
			else if (action == 'edit-live-device-layer')
			{
				launchQueryEditor(MA.resources.QueryBuilder + pageSuffix + '?q=' + id);
			}
			else if (action == 'clone-live-device-layer')
			{
				launchQueryEditor(MA.resources.QueryBuilder + pageSuffix + '?q=::queryId::&c=true'.replace('::queryId::', id));
			}
			else if (action == 'copy-live-device-layer')
			{
				MALayers.copyNode(options);
			}
			else if (action == 'move-live-device-layer')
			{
				MALayers.moveNode(options);
			}
			else if (action == 'delete-live-device-layer')
			{
				MALayers.deleteNode(options);
			}
			else if (action == 'plot-live-device-marker')
			{
				MALayers.doPlotOnLoad(id);
			}
			else if (action == 'plot-load-live-device-layer')
			{
				MALayers.doPlotOnLoad(id);
			}
		}
		else if (type == 'marker')
		{
			//var options = {};
			/*
			var options = {
			    nodeType : NodeType,
			    modify : node.attr("modify") === "false" ? false : true,
			    delete : node.attr("delete") === "false" ? false : true,
			    create : node.closest('[nodetype="CorporateFolder"]').attr('create') != 'true' ? false : true
			};
			*/

			if (action == 'plot-map-markers')
			{
				$('a#layer-tab-nav-plotted').click();
				options.renderAs = ["Markers"];
				MAPlotting.analyzeQuery(options);
			}
			else if (action == 'plot-map-clusters')
			{
				$('a#layer-tab-nav-plotted').click();
				options.renderAs = ["Cluster"];
				MAPlotting.analyzeQuery(options);
			}
			else if (action == 'plot-map-heatmap')
			{
				$('a#layer-tab-nav-plotted').click();
				options.renderAs = ["Heatmap"];
				MAPlotting.analyzeQuery(options);
			}
			else if (action == 'plot-map-scatter')
			{
				$('a#layer-tab-nav-plotted').click();
				options.renderAs = ["Scatter"];
				MAPlotting.analyzeQuery(options);
			}
			else if (action == 'plot-visible-markers')
			{
				$('a#layer-tab-nav-plotted').click();
				options.renderAs = ["Markers"];
				options.visibleAreaOnly = true;
				MAPlotting.analyzeQuery(options);
			}
			else if (action == 'plot-visible-clusters')
			{
				$('a#layer-tab-nav-plotted').click();
				options.renderAs = ["Cluster"];
				options.visibleAreaOnly = true;
				MAPlotting.analyzeQuery(options);
			}
			else if (action == 'plot-visible-heatmap')
			{
				$('a#layer-tab-nav-plotted').click();
				options.renderAs = ["Heatmap"];
				options.visibleAreaOnly = true;
				MAPlotting.analyzeQuery(options);
			}
			else if (action == 'plot-visible-scatter')
			{
				$('a#layer-tab-nav-plotted').click();
				options.renderAs = ["Scatter"];
				options.visibleAreaOnly = true;
				MAPlotting.analyzeQuery(options);
			}
			else if (action == 'plot-load-marker')
			{
				MALayers.doPlotOnLoad(id);
			}
			else if (action == 'edit-marker-layer')
			{
				launchQueryEditor(MA.resources.QueryBuilder + pageSuffix + '?q=' + id);
			}
			else if (action == 'clone-marker-layer')
			{
				launchQueryEditor(MA.resources.QueryBuilder + pageSuffix + '?q=::queryId::&c=true'.replace('::queryId::', id));
			}
			else if (action == 'copy-marker-layer')
			{
				MALayers.copyNode(options);
			}
			else if (action == 'move-marker-layer')
			{
				MALayers.moveNode(options);
			}
			else if (action == 'delete-marker-layer')
			{
				MALayers.deleteNode(options);
			}
			if(MA.isMobile && window.userSettings.recallMobileSaveState)
			{
				window.setMobileState();
			}
		}
		else if (type == 'favorite')
		{
			if (action == 'plot-favorite')
			{
				// VueEventBus.$emit('plot-favorite', tileName);
				PlotFavoriteLocation(options);
				MALayers.moveToTab('plotted');
			}
			else if (action == 'edit-favorite')
			{
                window.VueEventBus.$emit('launch-favorite-modal', options);
			}
			else if (action == 'delete-favorite')
			{
				//var objId = id
				//this.remove(obj);
				//deleteLocation(obj);

				MALayers.deleteNode(options);
			}
			else if (action == 'plot-load-marker')
			{	
				MALayers.doPlotOnLoad(id);
			}
		}
		else if (type == 'datalayer')
		{
			if (action == 'edit-data-layer')
			{
				var isPlotted = $('#PlottedQueriesTable .DataLayer[data-id="' + options.id + '"]').length > 0;
				MAData.wizard.launchPopup(
				{
					isPlotted: isPlotted,
					layerId: options.id,
					saveOnly: true
				});
			}
			else if (action == 'delete-data-layer')
			{
				MAData.deleteDataLayer(options.id);
			}
			else if (action == 'copy-data-layer')
			{
				MALayers.copyNode(options);
			}
			else if (action == 'clone-data-layer')
			{
				MAData.wizard.launchPopup(
				{
					layerId: options.id,
					isClone: true,
					folderId: MALayers.currentFolder,
					saveOnly: true
				});
			}
			else if (action == 'move-data-layer')
			{
				MALayers.moveNode(options);
			}
			else if (plotDataRegex.test(action))
			{
				MADemographicLayer.analyzeDataLayer(options);
			}
			else if (action == 'plot-visible-data-layer-marker' || action == 'plot-visible-data-layer-polygon' || action == 'plot-visible-data-layer-point')
			{
				MADemographicLayer.analyzeDataLayer(options);
			}
			else if (action == 'plot-load-data-layer') {}
		}
		else if (type == 'territory') {
			switch (action) {
				case 'plot-territory':
					options.qid = options.qid || new Date().getTime() + 'territory';
					options.component = 'TerritoryLayer'
					options.isTileBased = true;
					window.VueEventBus.$emit('add-layer', options, function(){});
					// toggle on the map
					break;
				case 'delete-territory-layer':
					MATerritory.deleteTerritoryLayer(options.id);
					break;
				case 'edit-territory-layer':
					window.VueEventBus.$emit('render-territory-builder', options);
					break;
				case 'move-territory-layer':
					MALayers.moveNode(options);
					break;
			}
		}
	},

	//added because the context menu was not hiding. was becoming annoying
	hideContextMenu: function(obj) {
		if (('ontouchstart' in window) || (navigator.msMaxTouchPoints > 0)) {
			$('html').click(function(event) {
				//check up the tree of the click target to check whether user has clicked outside of menu

				if ($(event.target).parents('.query-menu-options').length == 0) {
					MALayers.contextMenu.shown = false;
					var $LayerDOMElement = $(obj).closest('.folderItem');
					$LayerDOMElement.removeClass('hovering');
					$LayerDOMElement.find('.dropdown-menu').hide();
				}
				$(this).unbind(event);
			});

		} else {

			MALayers.contextMenu.shown = false;
			var $LayerDOMElement = $(obj).closest('.folderItem');
			$LayerDOMElement.removeClass('hovering');
			$LayerDOMElement.find('.dropdown-menu').hide();
		}
	},

	toggleContextMenu: function(obj) {
		var $LayerDOMElement = $(obj).closest('.folderItem');
		var id = $LayerDOMElement.attr('id');
		$LayerDOMElement.addClass('hovering');
		//update obj to hover location
		obj = $LayerDOMElement.find('.dropdown')[0];

		MALayers.calcDropDownMenuPosition(obj);

		if (MALayers.contextMenu.shown) {
			//it's already shown, what now?
			if (MALayers.contextMenu.id === id) {
				MALayers.contextMenu.shown = false;
				MALayers.contextMenu.id = id;
				$LayerDOMElement.find('.dropdown-menu').hide();
			} else {
				$('div#' + MALayers.contextMenu.id).find('.dropdown-menu').hide();

				MALayers.contextMenu.shown = true;
				MALayers.contextMenu.id = id;

				$LayerDOMElement.find('.dropdown-menu').show();
			}
		} else {
			MALayers.contextMenu.shown = true;
			MALayers.contextMenu.id = id;
			$LayerDOMElement.find('.dropdown-menu').show();
		}
	},

	calcDropDownMenuPosition: function(obj) {
		//get the scroll position
		var scrollPos = $(window).scrollTop();
		var $button = $(obj);
		var $Layer = $button.closest('div.folderItem');
		var layerWidth = $Layer.width();
		var layerOff = $Layer.offset();
		//this is the row position from top of page in pixels
		var layerTop = layerOff.top;

		//layersPanel
		var buttonPosition = $button.offset();
		var layersPanelPosition = $('.layersPanel').offset();
		var computedPositionLeft =  buttonPosition.left - layersPanelPosition.left;
		var computedPositionTop =  buttonPosition.top - layersPanelPosition.top;

		//get some menu info
		var $menu = $button.find('.dropdown-menu');
		var menuHeight = $menu.height();

		//determine if menu is to large and add scroll before calc
		if (menuHeight >= 400) {
			$menu.css({
				'max-height': '400px',
				'overflow-y': 'auto'
			});
			menuHeight = 400;
		}
		else if (MA.Util.isIE()) {
			if(menuHeight >= 300){
				$menu.css({
					'max-height': '300px',
					'overflow-y': 'auto'
				});
				menuHeight = 300;
			}
		}

		//check the menu height and offset
		var totalMenu = computedPositionTop + menuHeight;

		//get the map dimensions
		var containerHeight = $('#horizontalViewsWrap').height();



		//appears offscreen 140
		if (totalMenu >= containerHeight) {
			//update the position of the dropdown to stay within the bounds of the app
			positionDifference = totalMenu - containerHeight;
			dropdownVerticalPadding = 26;
			newPosition = computedPositionTop - positionDifference - dropdownVerticalPadding;
			var calcTest = layerTop - (menuHeight/2);

			if(MA.Util.isIE()) {
				newPosition =  calcTest;			
			}
			$menu.css({
				top: newPosition + "px",
				left: computedPositionLeft + 26 + "px"
			});
		} else {
			if(MA.Util.isIE()) {
				computedPositionTop =  layerTop - 50;
			}
			$menu.css({
				top: computedPositionTop + "px",
				left: computedPositionLeft + 26 + "px"
			});
		}
	},

	calcPlottedLayerInfo: function(obj) {
		var tooltipTemplate = $('#folderItem-template').find('.ftu-tooltip').html();
		//get the id
		var data = $(obj).data();
		var tooltip = $(obj).find('.ftu-tooltip');
		var tooltipArrow = $(obj).find('.ftu-tooltip-arrow');
		var newHTML = '';

		if (data.type === 'datalayer') {
			//this is a data layer
			newHTML = tooltipTemplate.replace('::TOOLTIP-TITLE::', htmlEncode(data.name) || 'N/A')
				.replace('::TOOLTIP-DESC::', htmlEncode(data.description) || 'N/A')
				.replace('::TOOLTIP-BASEOBJ::', 'Data Layer')
				.replace('::TOOLTIP-CREATED::', htmlEncode(data.createdInfo) || 'N/A')
				.replace('::TOOLTIP-MODIFIED::', htmlEncode(data.modifiedInfo) || 'N/A')
				.replace('â€¢', '')
			// .replace('::TOOLTIP-PLOTONLOAD::', '');  //hides the plot on load stuff for now - Commented out because now this row is being hidden once the new HTML is appended
		} else if (data.hasOwnProperty('marker')) {

			var createdBy = '';
			var modifiedBy = '';

			if (data.marker.hasOwnProperty('record')) {
				if (data.marker.record.hasOwnProperty('record')) {
					createdBy = data.marker.record.record.CreatedBy.Name + ', ' + data.marker.record.record.CreatedDate;
					modifiedBy = data.marker.record.record.LastModifiedBy.Name + ', ' + data.marker.record.record.LastModifiedDate;
				} else {
					createdBy = 'N/A';
					modifiedBy = 'N/A';
				}
			} else {
				createdBy = 'N/A';
				modifiedBy = 'N/A';
			}
			
			//this is a fav layer
			newHTML = tooltipTemplate.replace('::TOOLTIP-TITLE::', htmlEncode(data.marker.title) || 'N/A')
				.replace('::TOOLTIP-DESC::', htmlEncode(data.marker.description) || 'N/A')
				.replace('::TOOLTIP-BASEOBJ::', 'Location')
				.replace('::TOOLTIP-CREATED::', htmlEncode(createdBy))
				.replace('::TOOLTIP-MODIFIED::', htmlEncode(modifiedBy))
				.replace('â€¢', '')
			// .replace('::TOOLTIP-PLOTONLOAD::', '');  //hides the plot on load stuff for now - Commented out because now this row is being hidden once the new HTML is appended

		} else if (data.hasOwnProperty('proxObjects')) {

			//this is a shape layer
			newHTML = tooltipTemplate.replace('::TOOLTIP-TITLE::', htmlEncode(data.popupData.name) || 'N/A')
				.replace('::TOOLTIP-DESC::', htmlEncode(data.popupData.description) || 'N/A')
				.replace('::TOOLTIP-BASEOBJ::', 'Shape')
				.replace('::TOOLTIP-CREATED::', htmlEncode(data.popupData.createdBy))
				.replace('::TOOLTIP-MODIFIED::', htmlEncode(data.popupData.modifiedBy))
				.replace('â€¢', '')
			// .replace('::TOOLTIP-PLOTONLOAD::', '');  //hides the plot on load stuff for now - Commented out because now this row is being hidden once the new HTML is appended

		} else {
			
			//add info to the hover
			newHTML = tooltipTemplate.replace('::TOOLTIP-TITLE::', htmlEncode(data.savedQueryName) || 'N/A')
				.replace('::TOOLTIP-DESC::', htmlEncode(data.description) || 'N/A')
				.replace('::TOOLTIP-BASEOBJ::', htmlEncode(data.baseObjectLabel) || 'N/A')
				.replace('::TOOLTIP-CREATED::', htmlEncode(data.createdBy) || 'N/A')
				.replace('::TOOLTIP-MODIFIED::', htmlEncode(data.modifiedBy) || 'N/A')
				.replace('â€¢', '')
			// .replace('::TOOLTIP-PLOTONLOAD::', '');  //hides the plot on load stuff for now - Commented out because now this row is being hidden once the new HTML is appended

		}

		tooltip.html(newHTML);
		tooltip.find('.tooltip-row.ft-tooltip-plotonload').hide(); //hide Plot on Load row
		var folderPath = data.folderPath || '';
		tooltip.find('.ftu-tooltip-pad-gray').prepend('<div class="layer-folder-path"><div class="ftu-icon-icon inline" type="folder"></div>' + folderPath + '</div>');

		//display the hover
		var scrollPos = $(window).scrollTop();
		var $Layer = $(obj);
		var layerWidth = $Layer.width();
		var layerOff = $Layer.offset();
		//this is the row position from top of page in pixels
		var layerTop = layerOff.top;

		//layersPanel
		var buttonPosition = $Layer.offset();
		var layersPanelPosition = $('.layersPanel').offset();
		var computedPositionLeft =  buttonPosition.left - layersPanelPosition.left;
		var computedPositionTop =  buttonPosition.top - layersPanelPosition.top;

		//get some menu info
		var $menu = tooltip;
		var menuHeight = $menu.height();

		//determine if menu is to large and add scroll before calc
		if (menuHeight >= 400) {
			$menu.css({
				'max-height': '400px',
				'overflow-y': 'auto'
			});
			menuHeight = 400;
		}

		//check the menu height and offset
		var totalMenu = computedPositionTop + menuHeight;

		//get the map dimensions
		var containerHeight = $('#horizontalViewsWrap').height();

		//appears offscreen 140
		var $arrow = $Layer.find('.ftu-tooltip-arrow');
		if (totalMenu >= containerHeight) {
			//update the position of the dropdown to stay within the bounds of the app
			positionDifference = totalMenu - containerHeight;
			dropdownVerticalPadding = 2;
			newPosition = computedPositionTop - positionDifference - dropdownVerticalPadding;
			$menu.css({
				top: newPosition + "px",
				left: computedPositionLeft + 436 + "px"
			});

		} else {
			$menu.css({
				top: computedPositionTop - 20 + "px",
				left: computedPositionLeft + 436 + "px"
			});
		}

		//handle arrow
		$arrow.css(
		{
			'top': computedPositionTop + 3 + 'px',
			'left': computedPositionLeft + 426 + 'px'
		});
	},
};

function closeThisSLDSModal(theModal) {
	$('#sldsModalBackDrop').removeClass('slds-backdrop--open');
	$('.slds-backdrop').removeClass('slds-backdrop_open');
	$(theModal).closest('.slds-modal').removeClass('slds-fade-in-open');
	//Bagley removing this, breaking c2c for all types;
	//$('.CreateRecordPopup span.select2.select2-container.select2-container--default').remove();
}

function closeThisSLDSToast(theToast) {
	$(theToast).closest('.slds-notify_container').fadeOut(250);
}

function getLayerCount() {
	var dfd = jQuery.Deferred();

	Visualforce.remoting.Manager.invokeAction(MARemoting.Territory.getLayerCount, function (response) {
		var success = response.success;
		var layerCount = response.layerCount || 0;

		if (success && Number.isInteger(layerCount)) {
			dfd.resolve(layerCount);
		} else {
			dfd.reject(false);
		}
	});

	return dfd.promise();
}

window.VueEventBus.$emit('MA-Layers', MALayers);