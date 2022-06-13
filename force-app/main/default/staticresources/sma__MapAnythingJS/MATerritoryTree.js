//on ready
(function ($) {

	/**************************************************************************
	*	MATerritoryTree Plugin
	************************************************************************/
	$.fn.MATerritoryTree = function (options) {
		return this.each(function (index, treeEl) {
			var $tree = $(treeEl);
		
			//init the tree
			$tree.jstree({
	            'json_data': {
		           	data: [{ 
						data	: 'Territories',
						state	: 'closed',
						attr	: {
							'data-id': 'Territories',
							'data-geometry' : 'false',
		                	'data-collection' : 'false'
						}
					}],
		            ajax: {
		                url: MA.resources.Territory,
		                data: function (node) { 
		                    return { 
		                    	action			: 'getTerritoryContents',
		                        id				: node.attr('data-id')
		                    }; 
		                },
		                success: function (response) {
		                	var children = [];
		                	$.each(response.data, function (index, territory) {
		                		children.push({
		                			data	: territory.Name,
		                			state	: 'closed',
		                			attr	: { 	
		                				'data-id': territory.Id, 
		                				'data-geometry' : territory.Geometries__r != null ? 'true' : 'false',
		                				'data-collection' : territory.Collections__r != null ? 'true' : 'false',
		                				'data-territory' : territory.Territories__r != null ? 'true' : 'false'
		                			}
		                		});
		                	});
		                	return children;
		                }
		            }
	        	},
	        	'contextmenu': {
	        		items: function (node) {
						var items = null;
						var nodeGeometry = node[0].attributes[1].nodeValue;
						var nodeValue = node[0].attributes[0].nodeValue;
						var nodeCollection = node[0].attributes[2].nodeValue;
						var nodeTerritory = node[0].attributes[3].nodeValue;
						if(nodeValue == 'Territories' || nodeTerritory == 'true')
						{
							items = {
								createItem: {
					                label: "Create Territory",
					                separator_before: true,
					                action: function (obj) 
					                {
						                launchPopup($('#NewTeritoryPopup'), 
											{
											minWidth: '300px',
											buttons: {
												'Save': function () {
													var processData = {
											            ajaxResource : 'MATerritoryAJAXResources',
											            
											            action: 'createTerritoryFolder',
											            label : $('#NewTeritoryPopup .territory-label').val(),
														folderId : nodeValue
											        };
											            
											        Visualforce.remoting.Manager.invokeAction(MARemoting.processAJAXRequest,
											            processData,
											            function(res, event){
											                if(event.status) {
																var tree = jQuery.jstree._reference(".territory-tree");
											                   	var parentnode = $.jstree._reference('.territory-tree')._get_parent();
											                   	tree.refresh(parentnode);
											                   	$('#NewTeritoryPopup .territory-label').val('');
											                   	hidePopup($('#NewTeritoryPopup'));
													        }
											            },
														{escape:false}
												    ); 
												},
												'Close': function () { 
													hidePopup($('#NewTeritoryPopup'));
													$('#NewTeritoryPopup .territory-label').val('');
												}
											}
										});
					                }
					            }
							};
						}
						else if(nodeGeometry == 'true' || nodeCollection == 'true')
						{
							items = {
								deleteItem: {
					                label: "Delete Territory",
					                separator_before: true,
					                action: function (obj) 
					                {
										var processData = {
								            ajaxResource : 'MATerritoryAJAXResources',
								            
								            action: 'deleteTerritoryFolder',
								            folderId	: nodeValue
								        };
								            
								        Visualforce.remoting.Manager.invokeAction(MARemoting.processAJAXRequest,
								            processData,
								            function(res, event){
								                if(event.status) {
													var tree = jQuery.jstree._reference(".territory-tree");
								                   	var parentnode = $.jstree._reference('.territory-tree')._get_parent();
								                   	tree.refresh(parentnode);
										        }
								            },
											{escape:false}
										);
					                }
					            }
							};
						}
						else if(nodeGeometry == 'false' && nodeCollection == 'false')
						{
							items = {
								createItem: {
					                label: "Create Territory",
					                separator_before: true,
					                action: function (obj) 
					                {
						                launchPopup($('#NewTeritoryPopup'), 
											{
											minWidth: '300px',
											buttons: {
												'Save': function () {
													var processData = {
											            ajaxResource : 'MATerritoryAJAXResources',
											            
											            action: 'createTerritoryFolder',
											            label : $('#NewTeritoryPopup .territory-label').val(),
														folderId : nodeValue
											        };
											            
											        Visualforce.remoting.Manager.invokeAction(MARemoting.processAJAXRequest,
											            processData,
											            function(res, event){
											                if(event.status) {
																var tree = jQuery.jstree._reference(".territory-tree");
																var parentnode = $.jstree._reference('.territory-tree')._get_parent();
											                   	tree.refresh(parentnode);
											                   	$('#NewTeritoryPopup .territory-label').val('');
											                   	hidePopup($('#NewTeritoryPopup'));
															}
														},
														{escape:false}
												    ); 
												},
												'Close': function () { 
													hidePopup($('#NewTeritoryPopup'));
													$('#NewTeritoryPopup .territory-label').val('');
												}
											}
										});
					                }
					            },
								deleteItem: {
					                label: "Delete Territory",
					                separator_before: true,
					                action: function (obj) 
					                {
										var processData = {
								            ajaxResource : 'MATerritoryAJAXResources',
								            
								            action: 'deleteTerritoryFolder',
								            folderId	: nodeValue
								        };
								            
								        Visualforce.remoting.Manager.invokeAction(MARemoting.processAJAXRequest,
								            processData,
								            function(res, event){
								                if(event.status) {
													var tree = jQuery.jstree._reference(".territory-tree");
								                   	var parentnode = $.jstree._reference('.territory-tree')._get_parent();
								                   	tree.refresh(parentnode);
										        }
								            },
											{escape:false}
									    );
					                }
					            }
							};
						}
						return items;
					}
	        	},
	        	plugins: ['json_data', 'contextmenu', 'themes', 'ui']
			});
			
			//handle territory tree events
			$tree.bind({
			
				//selecting a node
				'select_node.jstree': function (event, data) {
					$tree.trigger('MATerritoryTree.select', {
						id: data.rslt.obj.attr('data-id')
					});
				}
			
			});
		});
	};
	
	/**************************************************************************
	*	MARollupTree Plugin
	************************************************************************/
	$.fn.MATerritoryRollupTree = function (options) {
		return this.each(function (index, treeEl) {
			var $tree = $(treeEl);
		
			//init the tree
			$tree.jstree({
	            'json_data' : {
		           	data: [{ 
						data	: 'Rollups',
						state	: 'closed',
						attr	: { 'data-id': 'Rollups' }
					}],
		            ajax: {
		                url: MA.resources.Territory,
		                data: function (node) { 
		                    return { 
		                    	action			: 'getTerritoryRollupFolderContents',
		                        id				: node.attr('data-id')
		                    }; 
		                },
		                success: function (response) {
		                	var children = [];
		                	$.each(response.data.folders, function (index, folder) {
		                		children.push({
		                			data	: folder.Name,
		                			state	: 'closed',
		                			attr	: { 'data-id': folder.Id, 'rel': 'folder' },
		                			metadata: { name: folder.Name }
		                		});
		                	});
		                	$.each(response.data.rollups, function (index, rollup) {
		                		children.push({
		                			data	: rollup.Name,
		                			state	: 'leaf',
		                			attr	: { 'data-id': rollup.Id, 'rel': 'rollup' },
		                			metadata: { name: rollup.Name }
		                		});
		                	});
		                	return children;
		                }
		            }
	        	},
	        	'types': {
	        		types: {
	        			rollup: {
		                    icon: { 
		                        image: MASystem.Images.sum16
		                    }
		                }
		            }
	        	},
	        	plugins: ['json_data', 'themes', 'ui', 'types']
			});
			
			//handle territory tree events
			$tree.bind({
			
				//selecting a node
				'select_node.jstree': function (event, data) {
					$tree.trigger('MATerritoryRollupTree.select', {
						id: data.rslt.obj.attr('data-id')
					});
				},
				
				//loading a node
				'load_node.jstree': function (event, data) {
					$tree.find('li[rel="rollup"]:not(.ui-draggable)').each(function () {
						$(this).draggable({
							helper: function (event) {
								return $('<div class="rollup-helper"/>').text($(this).data('name'))
							},
							opacity: '0.7'
						});
					});
				}
			
			});
		});
	};
	
	/**************************************************************************
	*	MATerritoryGrid Plugin
	************************************************************************/
	$.fn.MATerritoryGrid = function (options) {
		return this.each(function (index, gridEl) {
			var $grid = $('#MATerritoryTreeTemplates .territory-table').clone().addClass('MATerritoryGrid').data('requestsOut', 0).appendTo(gridEl);
		
			//load the top level territories
			$.MATerritoryGrid.getChildTerritories({ grid: $grid });
			
			/********************
			*	Grid Handlers
			********************/
			$grid
			
			//clicking a row toggle
			.on('click', '.territory-row-toggle', function () {
			
				//this would be used to show/hide child rows, but i'm not sure if we need that yet
			
			})
			
			//clicking a row (this will toggle visibility)
			.on('click', '.territory-row > td', function (e) {
			
				//make sure this isn't coming from clicking the checkbox itself because that would cause a loop
				if (!$(e.target).is('input[type="checkbox"]')) {
					$(this).closest('.territory-row').find('td.visible input').click();
				}
			})
			
			//clicking a visible checkbox
			.on('change', 'td.visible input', function () {
				if ($(this).is(':checked')) {
				
					//need to keep track of which rows are added/removed from visibility so this information can be passed out
					var rowsAdded = [$(this).closest('.territory-row')];
					var rowsRemoved = [];
				
					//this is being checked.  uncheck any parent rows
					var $currentTable = $(this).closest('.territory-table');
					var $currentRow = $currentTable.find('.territory-row[data-id="'+$(this).closest('.territory-row').attr('data-parent')+'"]');
					while ($currentRow.length > 0)
					{
						if ($currentRow.find('td.visible input').is(':checked')) {
							$currentRow.removeClass('selected').find('td.visible input').prop('checked', false);
							rowsRemoved.push($currentRow);
						}
						
						$currentRow = $currentTable.find('.territory-row[data-id="'+$currentRow.attr('data-parent')+'"]');
					}
					
					//now uncheck any child rows
					var $currentRows = $currentTable.find('.territory-row[data-parent="'+$(this).closest('.territory-row').attr('data-id')+'"]');
					while ($currentRows.length > 0)
					{
						var $nextRows = $();
						$currentRows.each(function () {
						
							if ($(this).find('td.visible input').is(':checked')) {
								$(this).removeClass('selected').find('td.visible input').prop('checked', false);
								rowsRemoved.push($(this));
							}
							
							$nextRows = $nextRows.add($currentTable.find('.territory-row[data-parent="'+$(this).attr('data-id')+'"]'))
						});
						$currentRows = $nextRows;
					}
					
					//fire an event with the updated territories
					$grid.trigger('MATerritoryGrid.update_visibility', {
						add: rowsAdded,
						remove: rowsRemoved
					});
				
				}
				else {
				
					//this is being unchecked.  just fire an event with this information
					$grid.trigger('MATerritoryGrid.update_visibility', {
						add: [],
						remove: [$(this).closest('.territory-row').removeClass('selected')]
					});
					
				}
			})
			
			//clicking on a rollup header cell that is not already selected
			.on('click', 'th.rollup-cell:not(.selected)', function () {
			
				//mark this cell as selected and all others as not
				$grid.find('th.rollup-cell').removeClass('selected');
				$(this).addClass('selected');
			
				//fire an event
				$grid.trigger('MATerritoryGrid.select_rollup', {
					id: $(this).attr('data-rollup')
				});
			
			});
			
			/************************
			*	End Grid Handlers
			************************/
		});
	};
	
	/**************************************************************************
	*	MATerritoryGrid Support Methods
	************************************************************************/
	
	$.MATerritoryGrid = {
		
		//get children of the selected territory and add them to the grid
		getChildTerritories: function (options) {
		
			var $grid = options.grid;
			var $row = options.row;
		
			//send an ajax request to get the child territories
			var processData = {
	            ajaxResource : 'MATerritoryAJAXResources',
	            
	            action: 'getTerritoryContents',
	            id: $row === undefined ? 'Territories' : $row.attr('data-id')
	        };
	            
	        Visualforce.remoting.Manager.invokeAction(MARemoting.processAJAXRequest,
	            processData,
	            function(response, event){
	                if(event.status) {
		        		//find the current row so we can insert these territories after it
		        		var $currentRow = $row || $grid.find('tr').first();
		        		var parentId = $currentRow.attr('data-id');
		        		var parentLevel = parseInt($currentRow.attr('data-level'));
		        		
		        		//loop through the child territories and add each to the grid
		        		var $rows = $();
		        		$.each(response.data, function (index, territory) {
		        			removeNamespace(MASystem.MergeFields.NameSpace, territory);
		        		
		        			//add a territory row
		        			var $newRow = $('#MATerritoryTreeTemplates .territory-row').clone().attr({
		        				'data-id'		: territory.Id,
		        				'data-parent'	: parentId,
		        				'data-level'	: parentLevel + 1
		        			});
		        			$newRow.find('.name').text(territory.Name).closest('td').css('padding-left', (parentLevel * 15)+'px');
		        			$newRow.insertAfter($currentRow);
		        			$rows = $rows.add($newRow);
		        			
		        			//update the state of this row based on whether or not there are any child territories
		        			$newRow.attr('data-state', 'leaf');
		        			try {
		        				if (territory.Territories__r.records.length > 0) {
		        					$newRow.attr('data-state', 'closed');
		        				}
		        			}
		        			catch (err) {}
		        			
		        			//add geometry information to the row if we have it
		        			var geometryData = [];
		        			try {
		        				$.each(territory.Geometries__r.records, function (index, geometry) {
		        					try {
		        						geometryData.push(JSON.parse(geometry.Geometry__c));
		        					}
		        					catch (err) { }
		        				});
		        			}
		        			catch (err) { }
		        			$newRow.data('geometryData', geometryData);
		        			
		        			//handle clicking a row toggle
		        			$newRow.find('.territory-row-toggle').click(function (e) {
		        			
		        				//get some info about what was clicked
		        				var $clickedGrid = $(this).closest('.territory-table');
		        				var $clickedRow = $(this).closest('.territory-row');
		        			
		        				//determine if this row needs to be loaded
		        				if ($clickedRow.is('[data-state="closed"]') && $clickedGrid.find('.territory-row[data-parent="'+$clickedRow.attr('data-id')+'"]').length == 0) 
		        				{
		        					//load child territories
		        					$clickedRow.attr('data-state', 'loading');
		        					$.MATerritoryGrid.getChildTerritories({
		        						grid	: $clickedGrid,
		        						row		: $clickedRow,
		        						success	: function () {
		        							$clickedRow.attr('data-state', 'open');
		        						}
		        					});
		        				}
		        				else if ($clickedRow.is('[data-state="closed"]'))
		        				{
		        					//open child territories
		        					$clickedGrid.find('.territory-row[data-parent="'+$clickedRow.attr('data-id')+'"]').show();
		        					$clickedRow.attr('data-state', 'open');
		        				}
		        				else
		        				{
		        					//close child territories
		        					$clickedGrid.find('.territory-row[data-parent="'+$clickedRow.attr('data-id')+'"]').hide();
		        					$clickedRow.attr('data-state', 'closed');
		        				}
		        				
		        				//stop event propagation to avoid clicking this row and triggering a visibility change
		        				e.stopPropagation();
		        			});
		        			
		        			//update the parent row
		        			$currentRow = $newRow;
		        			
		        			//callback
		        			try { options.success(); } catch (err) { }
		        		
		        		});
		        		
		        		//fire an event with the new territories
						$grid.trigger('MATerritoryGrid.load_children', {
							rows: $rows
						});
		        	}
		        	else {
		        		MALog('Error getting territory contents: ' + response.details);
		        	}
		        },
				{escape:false}
		    );
		
		}
		
	};
	
	/**************************************************************************
	*	MAWizard Plugin
	************************************************************************/
	$.fn.MAWizard = function (options) {
		return this.each(function (index, wizardEl) {
			var $wizard = $(wizardEl);
			
			/* Not doing this yet because it requires building in validation support
			//append next/back buttons
			$wizard.append('<div class="buttons"><button class="back">Back</button><button class="next">Next</button></div>');
			
			
			//handle clicking next/back buttons
			$wizard.find('> div.buttons button').click(function () {
				if ($(this).is('.back')) {
					$wizard.find('.steps > div.selected').prev().click();
				}
				else {
					$wizard.find('.steps > div.selected').next().click();
				}
			});
			*/
			
			//handle clicking a step
			$wizard.find('.steps > div').click(function () {
			
				//update the step and pane
				//$(this).addClass('selected').siblings().removeClass('selected');
				//$(this).closest('.MAWizard').find('.panes > div').eq($(this).index()).addClass('active').siblings().removeClass('active');
				
				/* Not doing this yet because it requires building in validation support
				//update the toolbar buttons
				$wizard.find('.buttons button').show();
				if ($(this).is(':first')) {
					$wizard.find('.buttons button.back').hide();
				}
				if ($(this).is(':last')) {
					$wizard.find('.buttons button.next').hide();
				}
				*/
				
			});
			
			//click the first step to init the wizard
			//$wizard.find('.steps div:first').click();
			$.MAWizard.showStep({ wizard: $wizard, step: 0, buttons: ['next'] });
		
			//trigger done
			$wizard.trigger('MAWizard.init', {
				wizard: $wizard
			});
		});
	};
	
	/**************************************************************************
	*	MAWizard Support Methods
	************************************************************************/
	$.MAWizard = {
	
		//show the given step
		showStep: function (options) {
		
			options = $.extend({
				step: 0,
				buttons: ['next']
			}, options || {});
		
			//click the step label
			//options.wizard.find('.steps > div').eq(options.step).click();
			
			//update the step and pane
			var $step = options.wizard.find('.steps > div').eq(options.step);
			$step.addClass('selected').siblings().removeClass('selected');
			$step.closest('.MAWizard').find('.panes > div').eq(options.step).addClass('active').siblings().removeClass('active');
			
			//update the visible buttons
			options.wizard.find('> .buttons > button').hide().each(function () {
				if ($.inArray($(this).attr('data-button'), options.buttons) != -1) {
					$(this).show();
				}
			});
			
			//trigger done
			options.wizard.trigger('MAWizard.show_step', options);
		}
	
	};
	
}(jQuery));