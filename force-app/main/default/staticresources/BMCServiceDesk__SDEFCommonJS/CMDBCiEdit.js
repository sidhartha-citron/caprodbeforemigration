var finalSettingString;			    	
var ColumnIndexArray = []; 
var win;		    	
var popupIndex;	
var colIndex;
var lookupID = new Array();	    	 
var EditedValues = []; 
var t, t2;
var isSavedSuccessfully =  false;
var bInitializeFirstRow = false;
var alreadycheckDisabled = false;
var firstRowContent;
var listCB = [];
var multiCol = [];
var disableCheck = false;
var isCellClicked = false;
var alreadyShown = false;
var disableGrid;
var selectedList = [];
var ColumnIndex, classNameIndex;
var isClassFlag = true;
var isBulkSelected = false;
var bCol = [];
var lookupCol = [];
var recPerPage;
var datatype='';
var PageNo;
var pagecnt1;
var pagecnt2;
var maxLengthForPopup;
var dataIndexForPopup,selectedIndex;
var isDirty = false;
var openerWin;
var url;
var LKFId;
var isColumnreconfigured = false;
var isSearchandLink = false;
var isDateClearClicked;
var clearDateFieldsForMultiEdit = [];
Ext.require([
	        'Ext.grid.*',
	        'Ext.data.*',
	        'Ext.ux.CheckColumn'
 ]);

        
        Ext.picker.Date.override({
            beforeRender: function() {
                this.clearBtn = new Ext.button.Button({
            		text: clear,
                    handler: this.clearDate,
                    scope: this,
					tooltip:ClearSelection,
					tooltipType :'title'
	        	});
                this.callOverridden(arguments);
            },
            initComponent: function() {
                var fn = function(){};
                var incmp = function(values, out){
                	Ext.DomHelper.generateMarkup(values.$comp.clearBtn.getRenderTree(), out);
                	fn(values, out);
                };
                if(this.renderTpl.length === undefined){
					fn = this.renderTpl.initialConfig.renderTodayBtn;
                    this.renderTpl.initialConfig.renderTodayBtn = incmp;
                } else {
                    fn = this.renderTpl[this.renderTpl.length-1].renderTodayBtn;
                	this.renderTpl[this.renderTpl.length-1].renderTodayBtn = incmp;
                }
		        this.callOverridden(arguments);
			},
            finishRenderChildren: function () {
				this.clearBtn.finishRender();
				this.callOverridden(arguments);
            },
            clearDate: function(){
				isDateClearClicked = true;
                this.fireEvent('select', this, '');
            }
        });
        		    
		Ext.onReady(function() {			    
		if(typeof(window.parent) != 'undefined' && window.parent != null && window.parent.document.getElementById('goBackId') != null){
			window.parent.document.getElementById('goBackId').hidden = true;
			window.parent.document.getElementById('goBackId').style.display = "none";
		}			
		//this function avoid uneccesarry moving screen up while selecting grid data
		Ext.define('Ext.override.dom.Element', {
		override: 'Ext.dom.Element',
		focus: function(defer, dom) {
        var me = this,
        scrollTop,
        body;
		dom = dom || me.dom;
        body = (dom.ownerDocument || DOC).body || DOC.body;
        try {
            if (Number(defer)) {
                Ext.defer(me.focus, defer, me, [null, dom]);
            } else {
                if (dom.offsetHeight > Ext.dom.Element.getViewHeight()) {
                    scrollTop = body.scrollTop;
                }
                var domid = dom.id;
						
                if(domid.indexOf('gridview')== -1) {
                    dom.focus();
                }
                if (scrollTop !== undefined) {
                    body.scrollTop = scrollTop;
                }
            }
        } catch (e) {}
       	 return me;
    	}
	});
		
			window.parent.CMDBManagerNamespace.instance.wikiUrlforCiEdit = wikiUrl;
			PageNo = datastore.pageNumber;
			Ext.create('Ext.toolbar.Toolbar', {
    		renderTo: 'toolbar',
    		id:'CMDBCIEditToolbar',
    		width   :  (window.innerWidth || document.documentElement.clientWidth || document.body.clientWidth),
    		height: 35,
    		margin  : '0 0 10 0',
    		items   : [
			{ xtype: 'tbspacer', width: 3 },
    		{
          		xtype:'button',
				scale: 'medium',
          		iconCls:"bmcSave",
				tooltipType : 'title',
				tooltip: save,
           		scope  : this,
				handler: applyValues
        	},
        	{ xtype: 'tbspacer', width: 3},
        			
			'-',
        	{
				id:'viewMenu',
				scale: 'medium',
				iconCls: 'bmcView1',
				tooltipType : 'title',
				tooltip: ViewsTitle,							
				menu: new Ext.menu.Menu({
					autoWidth : true,
					showSeparator: false,
					plain: true,
					items: [{
							cls: 'clsInputCheckBox',
							xtype:'checkboxfield',
							id :'ShowDerivedCIsButton',
							text : ShowDerivedCIs,
							boxLabel: ShowDerivedCIs,
							autoWidth: true,	
							checked : true,
							handler:ShowSubClassInstanceHandler
						},'-',
						{
							xtype: (Ext.isIE7 || Ext.isIE8)? 'menucheckitem':'checkbox',
					        id :'MarkasDeleted',
					        cls: 'clsInputCheckBox',
					        text : MarkAsDeletedLabel,
					        boxLabel: MarkAsDeletedLabel,
					        checked : (MarkasDeleted.toUpperCase() == 'TRUE') ? MarkasDeleted : false,
					        autoWidth: true,
					        style:{display: 'hidden'},
					        handler: MarkAsDeletedClicked
						}
									
									
					]
				})
			},
				{ xtype: 'tbspacer', width: 3 },
					new Ext.Toolbar.TextItem({
				       text : filterlbl	
				    }),
				        	{ xtype: 'tbspacer', width: 2 },
				        	new Ext.form.ComboBox({
				        		scale: 'medium',
				        		width:190,
				        		height:30,
							    typeAhead: true,
								tooltipType : 'title',
								tooltip: selectcolumn,
							    triggerAction: 'all',
							    forceSelection:true,
							    id: 'ddlFilterCMDBAtttribute',
							    emptyText:selectColumn ,
							    displayField:'CMDBClassAttributeName',
                    			valueField:'CMDBClassAttributeAPIName',
                    			value: FilterAttribute,
                    			store: new Ext.data.ArrayStore({
									fields:['CMDBClassAPIName', 'CMDBClassAttributeName', 'CMDBClassAttributeAPIName', 'dataIndex','itemid'],
									data:  datastore.CMDBClassAttributeName,
									sortInfo: {
									    field: 'CMDBClassAttributeName',
									    direction: 'DESC'
									}
			                    }), 
							    listeners: {
							    	select : function(combo, record, index)
							    	{
										Ext.getCmp('txtFilterCMDBAtttributeValue').setValue('');
										Ext.getCmp('dateFilterField').setValue('');
										datatype=record[0].data.itemid;
										ShowHide();
										
							    	},
									render: function(c){
										var val = c.originalValue;
										if(val.indexOf('__R')){
											val = val.replace('__R.Name','__C');
										}
										Ext.get(this.id).set({title:selectcolumn});
										Ext.getCmp(this.id).setValue(val);										
							    	}
							    }
							}),{
							xtype: 'datefield',
							id:'dateFilterField',
							anchor: '100%',
							height:22,
							name: 'from_date',
							editable:false,
							listeners: {
								render: function(c){
										if(window.parent.PrevFieldType!='undefined' && window.parent.PrevFieldType!=''){
											Ext.get(this.id).setVisible(true);
											Ext.get(this.id).set({title:selectvalue});
											Ext.getCmp(this.id).setValue(Ext.Date.format(new Date(window.parent.PrevFieldType), 'm/d/Y'));
											this.hidden=false;
										}else{
											this.hidden=true;
											Ext.get(this.id).setVisible(false);
										}
          						}
          					}
										
						},
							
							new Ext.form.TextField({
  							id: 'txtFilterCMDBAtttributeValue',
  							width:170,
  							height:23,
  							xtype: 'textfield',
  							emptyText : emptyvaltext,
  							listeners: {
         					 focus: function() {
            				 this.emptyText = ' ';  // if you set it to empty string, it doesn't work
            				 this.applyEmptyText();
          					},
							render: function(c){
										if(window.parent.PrevFieldType!='undefined' && window.parent.PrevFieldType==''){
											this.hidden=false;
											Ext.get(this.id).set({title:selectvalue});
											Ext.getCmp(this.id).setValue(document.getElementById(txtFilterAttribute).value);
										}else{
											this.hidden=true;
											Ext.get(this.id).setVisible(false);
										}
          					},
							specialkey: function(field, e){
                                if (e.getKey() == e.ENTER){                                       
										 Submit();
                                }
                            }
          					}					
  
						}),
						{
          			  		xtype:'button',
          			 		iconCls:"bmcSearch",
							id:'searchInGrid',
							scale: 'medium',
							tooltipType : 'title',
							tooltip: search,         			        			            			
           			  		scope  : this,
            		  		handler: Submit
        			},
        			{ xtype: 'tbspacer', width: 5 },
        			{
          			  		xtype:'button',
          			  		iconCls:"bmcRefresh",
							id:'undoSearch',
							scale: 'medium',
							tooltipType : 'title',
							tooltip: clear,          			        			            			
           			  		scope  : this,
            		  		handler: Clearfilter
        			},        			
					{ xtype: 'tbspacer', width: 3, hidden: selectedIdsList == '' ? true : false },
					'-',
						{
          			  		xtype:'button',
          			  		iconCls:"bmcReload",
							id:'refreshIframe',
							scale: 'medium',
							tooltipType : 'title',
							tooltip: Reload,          			        			            			
           			  		scope  : this,
            		  		handler: Reloadpage
        			},
					{ xtype: 'tbspacer', width: 3, hidden: selectedIdsList == '' ? true : false },
					{
						xtype:'box',
						autoEl: {tag: 'a', href: '#a', html: BackToFuflillRequestLabel},
						hidden: selectedIdsList == '' ? true : false,
						 listeners:{
							render: function(c) {
								c.getEl().on('click', function(){
									openFulfillWindow();
								});
							}
						}
					},	
        			'->',
					 new Ext.Toolbar.TextItem({
				       text : Records_per_page,	
				    }),
					{ xtype: 'tbspacer', width: 2 },
				        	new Ext.create('Ext.form.ComboBox', {
								store: Ext.create('Ext.data.Store', {
									fields: ['value', 'label'],
									data : PageSizeOptionsData
								}),
								id: 'recordSelector',
								queryMode: 'local',
								displayField: 'label',
								valueField: 'value',
								margin:'4 15 4 8',
								editable: false,
								forceSelection: true,
								typeAhead: true,
								width: 50,
								
								listeners: {
									afterrender: function () {
										this.setValue(PageSizeCookie);
										recPerPage = PageSizeCookie;
										enableDisablePagingButtons();
									},
									change: function(o, newValue, oldValue, opts) {
										if(typeof(oldValue)!='undefined' && oldValue!=null && oldValue != newValue) {
											showLoadingIcon();
											try{
												ChangeListViewPageRecords(newValue);
												recPerPage = newValue;
												this.setValue(newValue);
											} catch(error) {
												hideLoadingIcon();
												console.log(error);
											}
										}
									}
								}
								
							}),
							'-',
				    {
						xtype: 'tbtext',
						id:'pageText'
					},
				    {
          			  		xtype:'button',
          			  		iconCls:"CMDBCiEditPrevious",
							cls:'PreviousbtnMargin',
							id:'PreviousPageButton',
							disabled:true,
							tooltipType : 'title',
							tooltip:prevPage,
           			  		scope  : this,
            		  		handler: previousbtnhandler
        			},   
					{		xtype:'button',
          			  		iconCls:"CMDBCiEditnext",
							margin: Ext.isIE? '0 0 0 -13':'0 10 0 -7',
							id:'NextPageButton',
							disabled: true,
							tooltipType : 'title',
							tooltip:nextPage,
           			  		scope  : this,
            		  		handler: nextBtnHandler
					}
										
        			
    ]
});					

var cellEditing = Ext.create('Ext.grid.plugin.CellEditing', {
	clicksToEdit: 1,
	enableLocking: true,
	listeners: {
	    edit: function(editor, e, eOpts) {
			isCellClicked = false;
			if(e.value != e.originalValue){
				if(!(e.value == null && e.originalValue == ''))
					isDirty = CheckDirtyGrid(e.rowIdx);
			}
			if(RowIndex == 0)
				isDirty = false;
			if(RowIndex !=0 && listCB.length > 0){
				var modifiedRec = Ext.getCmp('CiEditGrid').getStore();
				if(modifiedRec.getModifiedRecords().length > 0 && e.rowIdx != 0){
					modifiedRec.reload();
					isDirty = false;
					if(t)
						setTimeout(function(){t.hide();}, 1800);
				}
			}
			else if((ColumnIndex === 0 || (!(!ColumnIndex || RowIndex == 0))) && e.value != e.originalValue){
				if(!(e.value == null && e.originalValue == ''))
					disableCheckbox(RowIndex);
			}
			if(e.column.itemid=='numeric') {	
				if(e.value == null){
					if(e.originalValue =='')
						e.record.set(e.field,e.originalValue);
					else if(e.originalValue != null && e.originalValue!='' && RowIndex == 0)
						e.record.set(e.field, '');
					else if(e.originalValue != null && e.originalValue!='')
						e.record.set(e.field,null);
				}else{
					if(e.value == e.originalValue)
						e.record.set(e.field,e.originalValue);
					else if(e.originalValue != null && e.originalValue !='')
						e.record.set(e.field,e.value);
				}
			}
	         if(e.column.itemid=='datetimecolumn' || e.column.itemid=='datecolumn') {	
				var currentFormat;
				if(e.column.itemid=='datetimecolumn')
					currentFormat = dateFormat;
				else if(e.column.itemid=='datecolumn')
					currentFormat = dateFormatOnly;
	            var date1 = Ext.Date.format(e.originalValue, currentFormat),
	                date2 = Ext.Date.format(e.value, currentFormat);
	            if(date1==date2 && isDateClearClicked != true) {	                
					e.record.set(e.field,e.originalValue);
	            }else {
					if(e.value!=null && e.value!=''){
						var gridID = Ext.getCmp('CiEditGrid');
						e.record.set(e.field,Ext.util.Format.date (e.value, currentFormat));						
					}
				}
				if(RowIndex != 0){
					isDateClearClicked = false;
				}else if(isDateClearClicked && isDateClearClicked == true){
					clearDateFieldsForMultiEdit.push(e.field);
				}
	        }
	    },
		beforeedit: function(cellEditor, context, eOpts ){
			selectedIndex=context.rowIdx;
			isCellClicked = true;
			for(i=0; i< ColumnIndexArray.length; i++){
				if(context.field == ColumnIndexArray[i].dataIndx){
					ColumnIndex = i;
					break;
				}
			}
			
			if(isReconOn && editedMoreThan20Records(selectedIndex)){
				var popupBox = Ext.MessageBox.show({
									msg: multiEditReconMessage,
									cls: 'msgPopupBtnCls',
									buttons: Ext.Msg.OK,
									icon: Ext.MessageBox.WARNING
								});
				return false;
			}
			
			if(isReconOn && selectedIndex == 0 && context.field != null && context.field != '' && context.field.indexOf('$') > -1){
				var fldName = context.field.substring((context.field.indexOf('$') + 1), context.field.length).toUpperCase();
				if(typeof(reconRuleFlds) != 'undefined' && reconRuleFlds != null && reconRuleFlds.length > -1 && typeof(fldName) != 'undefined' && fldName != null && fldName != '' && reconRuleFlds.indexOf(fldName) > -1){
					return false;
				}
			}
			
			if (context.rowIdx != 0 && typeof(disableGrid) != 'undefined' && disableGrid)
				ColumnIndex = false;
			else if(context.rowIdx == 0 && typeof(disableGrid) != 'undefined' && disableGrid)
				disableCheck = false;
			if(listCB.length > 0){
				if( context.originalValue && context.originalValue.toString().indexOf('d-icon') > -1){
					context.value = '';
				}
				if(context.rowIdx == 0){
					disableGrid = true;
					if(context.originalValue &&context.originalValue.toString().indexOf('d-icon-arrow_right') > -1)
						return false;
					else
						return true;
				} else
					return false;
			}else if (context.rowIdx != 0 && disableGrid)
				return false;		
	   }	
	}
});					
var mystore;
if(isServerSideSorting){
	mystore= new Ext.data.ArrayStore({
			fields: datastore.fields,
			data: datastore.arrData,
			remoteSort: true,
			sorters: [
				{property : 'CreatedDate',direction: 'ASC'}
			]
		});
}else{
	mystore= new Ext.data.ArrayStore({
			fields: datastore.fields,
			data: datastore.arrData
		});

}
						
var sm = Ext.create('Ext.selection.CheckboxModel', {
            mode: 'SIMPLE',
			checkOnly: true,
			headerWidth: 28,
            renderer : function(v,p,record) {
				if (record.raw[record.raw.length -1] == '') 
					return '<div class="d-icon-right-list info-icon" >&nbsp;</div>';	
				else
					return '<div class="x-grid-row-checker">&nbsp;</div>';				
			},
			listeners: {
                selectionchange: function(sm, selected, eOpts) {
					listCB = selected;
					if(listCB.length > 0 && typeof(listCB[listCB.length-1].index) == 'undefined' && typeof(RowIndex) != 'undefined')
						listCB[listCB.length-1].index = RowIndex;
					var gridID = Ext.getCmp('CiEditGrid');
					if(selected.length > 0 && !alreadyShown){
						alreadyShown = true;
						disableGrid = true;
						var colHeaderElemArr = document.getElementsByClassName("disableInMassEditMode");
						var i = 0;
						for(i = 0; i < colHeaderElemArr.length; i++){
							if(colHeaderElemArr[i].className.indexOf('custom-column') == -1){
								colHeaderElemArr[i].className = colHeaderElemArr[0].className + " custom-column";
							}
						}
						isDirty = false;
						disableToolbar('Mass');
						document.getElementById("grid").className = "text-color row-styling";
						gridID.getView().removeRowCls(0, 'hidden');
						gridID.getView().addRowCls(0, 'first_row');
						gridID.getView().addRowCls(0, 'first_row_check');
						setTimeout(function(){t.show();}, 2000);
					}else if(selected.length < 1){
						gridID.getView().addRowCls(0, 'hidden');
						alreadyShown = false;
						enableToolbar();
					}
                },
				beforeselect: function(selModel, record, index) {
					isBulkSelected = typeof(selModel.bulkChange) == 'undefined' ? false : selModel.bulkChange;
					RowIndex= index;
					if(isBulkSelected && typeof(record.index) == 'undefined'){
						record.index = RowIndex;
						listCB.push(record);
					}
					if (listCB.length > 0)
						listCB = reArrange(listCB, 'CheckBox');
					if(isBulkSelected && record.raw[record.raw.length -1] != '')
						selectedList.push(record);
					/*if(isReconOn && !disableCheck && (listCB.length > 19 || selectedList.length > 20 || (listCB.length + selectedList.length) > 20) && isClassFlag){
						showReconError(selectedList,isBulkSelected);
						isClassFlag = false;
					}*/
					var gridID = Ext.getCmp('CiEditGrid');
					popupIndex=index;
					if (ColumnIndex === 0 || (!((!ColumnIndex || isBulkSelected || !isCellClicked)))  || isDirty || !isClassFlag || disableCheck || (typeof(disableGrid) != 'undefined' && !disableGrid)){
						isBulkSelected = false;
						isCellClicked = false;
						return false;
					} else
						isCellClicked = false;
				},
				beforedeselect: function(selModel, record, index) {
					isBulkSelected = typeof(selModel.bulkChange) == 'undefined' ? false : selModel.bulkChange;
					selectedList = [];
					isClassFlag = true;
					if(!ColumnIndex || isBulkSelected || !isCellClicked){
						isCellClicked = false;
						ColumnIndex = false;
						return true;
					} else
						return false;
				},
            }
        });
		
t = new Ext.ToolTip({
    anchorToTarget: false,
	cls:'tooltipCls',
    targetXY: [50, 80],
    html: MultiEditRowTooltip,
});

t2 = new Ext.ToolTip({
    anchorToTarget: false,
	cls:'tooltipCls1',
    targetXY: [10, 200],
    html: MultiEditCheckBoxDisabledTooltip,
});

Ext.tip.QuickTipManager.init(true, {mouseOffset: [-150, 0]});
											
var CiGrid = Ext.create('Ext.grid.Panel', {
   
    store: mystore,
    columns: datastore.columns,     		
    selType: 'cellmodel', 
	selModel: sm,
	id:'CiEditGrid',
	height: Ext.getBody().getViewSize().height-65,
	columnLines: true,
    enableColumnHide:false, 
    onNormalViewScroll: function() { 
        var me = this,
        normalView = me.normalGrid.getView(),
        normalDom = normalView.el.dom,
        lockedView = me.lockedGrid.getView(),
        lockedDom = lockedView.el.dom;
        lockedDom.scrollTop = normalDom.scrollTop;
        delete lockedView.scrolledByNormal;
    },
    onLockedViewScroll: function () {
        var me = this,
        lockedView = me.lockedGrid.getView();
        if (!lockedView.scrolledByNormal) {
            lockedView.scrolledByNormal = true;
            return false;
        }
    },
 	viewConfig: {
 					getRowClass: function(record, rowIndex, rowParams, store, index) {
						if(!bInitializeFirstRow && record.raw[record.raw.length - 1] == ''){
							bInitializeFirstRow = true;
							firstRowContent = record.raw;							
						}
						if(listCB.length == 0 && rowIndex == 0 && record.raw[record.raw.length - 1] == '') {
							return "hidden";
                        } else if(listCB.length != 0 && rowIndex == 0 && record.raw[record.raw.length - 1] == '')
							return "first_row_first";
					},
					forceFit: false,
					deferEmptyText: false,
					emptyText :'<div class="emptyTextClass">'+noRecordsFoundMsg+'</div>'
				},
	lockedViewConfig: {
        emptyText: ''
    },
	listeners: {
        afterrender: function(grid, eOpts){
			if(isServerSideSorting){
				var colDataIndex=classname+'$'+SortColumn;
				unSortFirstRow(SortDirection,colDataIndex);
			}
            var gridIndxArray = grid.columns;
            for(var i=0; i<gridIndxArray.length; i++){
                var Indx = i-1; 
                if(Indx == -1)
                    Indx = 0;
                ColumnIndexArray.push({
                    dataIndx:gridIndxArray[i].dataIndex,
                    StoreIndx:Indx
                });
				if(gridIndxArray[i].dataIndex.indexOf(orgNamespace.toUpperCase()+'CLASSNAME__C') != -1){
					classNameIndex = i;
				}
            }
        },
        columnmove: function(ct, column, fromIdx, toIdx){
            isColumnreconfigured = true;
        },
		itemmouseenter: function(grid, record, item, index, e, eOpts ){
			if(index == 0 && e.target.innerText.indexOf(MultiEditRowText) > -1){
				if(t)
					t.hide();
				Ext.fly(item).set({'data-qtip': MultiEditRowTooltip});
			}
		},
		itemclick: function(data, record, item, index, e, eOpts){ // data,td, cellIndex, record, tr, rowIndex,e,eOpts 
			popupIndex = index;
			var position = data.getPositionByEvent(e);
			//ColumnIndex = position.column;
			RowIndex = position.row;
			if(index == 0){
				multiCol.push({
					colIndex:ColumnIndex
				});
			}
			EditedValues.push({
						colvalue:ColumnIndex,
						rowvalue:popupIndex
					});
			if(ColumnIndex !== false && isCellClicked){
				var colHeader = this.columns[ColumnIndex];
				if((typeof(colHeader.editor) != 'undefined' && colHeader.editor.xtype == 'textareafield') || (typeof(colHeader.field) != 'undefined' && colHeader.field.xtype == 'textareafield') ){
					var header = colHeader.header;
					var dataindex = colHeader.dataIndex;
					var isReadonly = colHeader.isReadonly;
					maxLengthForPopup = colHeader.length;
					dataIndexForPopup = dataindex; 
					var old = this.getStore().data.getAt(index).get(dataindex);
					if(old.indexOf('d-icon') > -1){
						old = '';
					}
					var colInd = position.column + 1;
					if(ColumnIndex == (position.column + 1)){
						if(isReconOn){
							if(RowIndex == 0 && dataIndexForPopup != null && dataIndexForPopup != '' && dataIndexForPopup.indexOf('$') > -1){
								var fldName = dataIndexForPopup.substring((dataIndexForPopup.indexOf('$') + 1), dataIndexForPopup.length).toUpperCase();
								if(!(typeof(reconRuleFlds) != 'undefined' && reconRuleFlds != null && reconRuleFlds.length > -1 && typeof(fldName) != 'undefined' && fldName != null && fldName != '' && reconRuleFlds.indexOf(fldName) > -1)){
									showExpansionWindow(record,old,header,maxLengthForPopup,isReadonly);
								}
							}else if(!editedMoreThan20Records(index)){
								showExpansionWindow(record,old,header,maxLengthForPopup,isReadonly);
							}
						}else{
							showExpansionWindow(record,old,header,maxLengthForPopup,isReadonly);
						}
					}
				}
			}
		},
		sortchange: function(ct, column, direction, eOpts) {
			if(isServerSideSorting){
				var colname = column.dataIndex;
				colname= colname.split("$");
				colname = colname[1];
				SortColumn = colname;
				SortDirection = direction;
				showLoadingIcon();
				performPagination(PageNo,SortColumn,SortDirection);
			}
		}
	},	
	cls: 'custom-dirty', 
	layout:'fit',  
	border: false,
	autoWidth:true,  
    plugins: [cellEditing],
    renderTo:'grid'
});

window.parent.cmdbCISaveBtn = false;
enableDisablePagingButtons();
var InstanceCheckbox = Ext.getCmp('ShowDerivedCIsButton');
if(window.parent.CMDBManagerNamespace.instance.ShowDerivedCIs == true)
InstanceCheckbox.setValue('true');
else
InstanceCheckbox.setValue('false');
if(selectedIdsList != '' && window.parent != null && typeof(window.parent) != 'undefined'){
	openerWin = window.parent.opener;         
	if(typeof(openerWin) != 'undefined' && openerWin != null)
		url = openerWin.location.href;
}
});	

var PageSizeOptionsData = [
							{ value: 25, label: "25"},
							{ value: 50, label: "50"},
							{ value: 100, label: "100"},
							{ value: 200, label: "200"}
						];
function disableFirstRow(value, meta, record, row, col){
	if(row == 0){
		if (col == 1 && value.indexOf('d-icon-arrow_right') > -1)
			meta.tdCls = 'first-column-style';
		else
			meta.tdCls= 'first-column-background';
	} else if (row != 0 && col != 1){
		meta.tdCls= 'custom-column';
	}
	return value;
}

function disableReconRuleFld(value, meta, record, row, col, store, view, colName){
	if(isReconOn && row == 0){
		if(typeof(reconRuleFlds) != 'undefined' && reconRuleFlds != null && reconRuleFlds.length > -1 && typeof(colName) != 'undefined' && colName != null && colName != '' && reconRuleFlds.indexOf(colName) > -1){
			meta.tdCls = 'first-column-background';
		}else{
			meta.tdCls = '';
		}
	}
	return value;
}

function modifyGridView(RowIndex){
	if(RowIndex == 0){
		isDirty = false;
		disableToolbar('Mass');
	}else{
		isDirty = CheckDirtyGrid(RowIndex);	
		disableCheckbox();
		if(isDirty)
			disableToolbar('Inline');
		else
			enableToolbar();		
	}
}

function CheckDirtyGrid(RowIdx){
	var dirtyCount = 0;
	var modifiedRec = Ext.getCmp('CiEditGrid').getStore().getModifiedRecords();
	dirtyCount = modifiedRec.length;
	if(RowIndex != 0 && RowIdx != 0 && dirtyCount > 0){
		isDirty = true;
		return true;
	} else{
		isDirty = false;
		return false;
	}
}

function disableCheckbox(){
	disableCheck = true;
	alreadycheckDisabled = true;
	if(!alreadyShown){
		alreadyShown = true;
		var t2Pos = (pagecnt2 -pagecnt1) < 8 ? (25*(pagecnt2 -pagecnt1 +1)/2) : 200;
		setTimeout(function(){t2.targetXY = [10, t2Pos]; t2.show();}, 1000);
	}
	document.getElementById("grid").className = "disableCheck";
	isDirty = CheckDirtyGrid(RowIndex);
	if(isDirty)
		disableToolbar('Inline');
	else
		enableToolbar();
}

function enableToolbar(){
	alreadyShown = false;
	try{
		Ext.getCmp('viewMenu').enable();
		Ext.getCmp('ddlFilterCMDBAtttribute').enable();
		Ext.getCmp('txtFilterCMDBAtttributeValue').enable();
		Ext.getCmp('searchInGrid').enable();
		Ext.getCmp('undoSearch').enable();
		Ext.getCmp('recordSelector').enable();
		enableDisablePagingButtons();
	} catch(e){
		//Buttons will not be enabled.
	}
}

function disableToolbar(mode){
	if(typeof(window.parent) != 'undefined' && window.parent != null){
		var element=window.parent.document.getElementById('goBackId');
		if(typeof(element) != undefined && element != null){
			element.style.display = "inline";			
			element.hidden = false;
			if(mode == 'Mass')
				element.innerText = MultiEditBacktoInline;
			else
				element.innerText = MultiEditBacktoMassEdit;
			Ext.getCmp('viewMenu').disable();
			Ext.getCmp('ddlFilterCMDBAtttribute').disable();
			Ext.getCmp('txtFilterCMDBAtttributeValue').disable();
			Ext.getCmp('searchInGrid').disable();
			Ext.getCmp('undoSearch').disable();
			if(Ext.getElementById('undoSearch-btnInnerEl') != null && Ext.getElementById('undoSearch-btnInnerEl') != '')
				Ext.getElementById('undoSearch-btnInnerEl').innerText = '';
			//Ext.getCmp('refreshIframe').disable();
			if(Ext.getElementById('refreshIframe-btnInnerEl') != null && Ext.getElementById('refreshIframe-btnInnerEl') != '')
				Ext.getElementById('refreshIframe-btnInnerEl').innerText = '';
			Ext.getCmp('recordSelector').disable();
			Ext.getCmp('NextPageButton').disable();
			Ext.getCmp('PreviousPageButton').disable();
		}
	}
}
function showReconError(selectedList,isBulkSelected){
	var msg = MultiEditReconExceptionSingle;
	if (isBulkSelected == true){
		msg = MultiEditReconExceptionBulk;
	}
	if (selectedList.length > 0)
		listCB = selectedList;
	listCB = reArrange(listCB, 'CheckBox');
	var popupBox = Ext.MessageBox.show({
						msg: msg,
						cls: 'msgPopupBtnCls',
						buttons: Ext.Msg.OK,
						icon: Ext.MessageBox.ERROR
					});
}

function enableDisablePagingButtons(){

if(recPerPage == null || recPerPage == '')
	recPerPage = 25;
var total_rec = datastore.TotalRecordSize;
PageNo = datastore.pageNumber;
if(total_rec == 0)
	pagecnt1 = 0;
else
pagecnt1 = ((PageNo-1)*recPerPage)+1;

if(total_rec<(PageNo*recPerPage))
	pagecnt2 = total_rec;
else
	pagecnt2 = PageNo*recPerPage;

var gridID = Ext.getCmp('CiEditGrid');
var pageField = Ext.getCmp('pageText');
if(total_rec> 4999){
	pageField.setText(Record+' '+pagecnt1+' - '+pagecnt2+' '+of+' '+total_rec +'+');	
}else{
	pageField.setText(Record+' '+pagecnt1+' - '+pagecnt2+' '+of+' '+total_rec);	
}
	if(datastore.hasNext) 
		Ext.getCmp('NextPageButton').enable();
	else 
		Ext.getCmp('NextPageButton').disable();

	if(datastore.hasPrevious)
		Ext.getCmp('PreviousPageButton').enable();
	else 
		Ext.getCmp('PreviousPageButton').disable();
}

function nextBtnHandler(){
	
	this.PageNo = PageNo+1;
	if(isDirty){
		checkDirtyData(this.PageNo,'Next');
	}else{
		showLoadingIcon();
		performPagination(this.PageNo,SortColumn,SortDirection);
	}
}

function previousbtnhandler(){	
	
	this.PageNo = PageNo-1;
	if(isDirty){
		checkDirtyData(this.PageNo,'Previous');
	}else{
		showLoadingIcon();
		performPagination(this.PageNo,SortColumn,SortDirection);
	}
}

function checkDirtyData(pageNo,actionName){

	Ext.MessageBox.show({
			title: Confirm_Action,
			msg: closeWarningMsgLabel,
			width:400,
			cls: 'msgPopupBtnCls',
			buttons: Ext.Msg.YESNO,
			buttonText: { yes: LabelYes, no: LabelNo },
			fn:  function(btn){
				if (btn == 'yes'){	
					 showLoadingIcon();
					 performPagination(pageNo,SortColumn,SortDirection);
					 isDirty = false ;
					return true;
					
				} else
					if(actionName != null && actionName != ''){
						if(actionName == 'Next')
							this.PageNo = this.PageNo - 1;
						else
							this.PageNo = this.PageNo + 1;
					}
			},
			icon: Ext.MessageBox.WARNING
		});
	return false; //always return false
}

function syncRecords(){
	Ext.getCmp('CiEditGrid').getStore().sync();
}

function ShowSubClassInstanceHandler(){
var showinstance = Ext.getCmp('ShowDerivedCIsButton').getValue();
	if(showinstance == true)
		ShowSubCI('true');
	else
		ShowSubCI('false');
}

function MarkAsDeletedClicked(ctrl, checked) {
	if(checked){
		MarkasDeleted = checked;
	}else{
		MarkasDeleted = false;
	}
	ShowMarkasDelted(MarkasDeleted);
}

function ShowHide(){
if(datatype!='undefined' && datatype=='date'){
		Ext.getCmp('txtFilterCMDBAtttributeValue').setVisible(false);
		Ext.getCmp('dateFilterField').setVisible(true);
		
		
		
	}else{
		Ext.getCmp('dateFilterField').setVisible(false);
		Ext.getCmp('txtFilterCMDBAtttributeValue').setVisible(true);
		window.parent.PrevFieldType='';
		
	} 
}
function Submit()
{
	var result;
	this.PageNo = 1;
	if(datatype!='undefined' && datatype=='date'){
			result=Ext.getCmp('dateFilterField').getValue();
			if(result!=''){
				ApplyFilter();
				document.getElementById(btnRun).click();
			}
		
	}else{
			ApplyFilter();
			document.getElementById(btnRun).click();
	}
}

function ApplyFilter()
{
	  var combobox = Ext.getCmp('ddlFilterCMDBAtttribute');
	  var v = combobox.getValue();
	  if(v != null && v != undefined &&  v != '')
	    {
		    var record = combobox.findRecord(combobox.valueField || combobox.displayField, v)
			document.getElementById(ClassAPIName).value = record.data.CMDBClassAPIName;
			document.getElementById(attributeName).value = record.data.CMDBClassAttributeAPIName;
		}
	  else
		{
		    document.getElementById(ClassAPIName).value = '';
			document.getElementById(attributeName).value = '';
		}
		    if((datatype!='undefined' && datatype=='date') || window.parent.PrevFieldType!=''){
		    	var EnteredDate= Ext.getCmp('dateFilterField').getValue();
				if(EnteredDate!=null){
					window.parent.PrevFieldType=EnteredDate.toString();
					var formatedDates=Ext.Date.format(new Date(EnteredDate), 'Y-n-d H:m:s');
					document.getElementById(txtFilterAttribute).value =formatedDates;
				}
				else{
					window.parent.PrevFieldType='';
					document.getElementById(txtFilterAttribute).value = Ext.getCmp('txtFilterCMDBAtttributeValue').getValue() ;
				}
				
			}else{
				window.parent.PrevFieldType='';
				document.getElementById(txtFilterAttribute).value = Ext.getCmp('txtFilterCMDBAtttributeValue').getValue() ;
			}
}

function openFulfillWindow(){
    var screenHeight =600;
	var screenWidth = 1000;
	if(openerWin && !openerWin.closed){
		openerWin = window.open("","HandlerWindow");
		openerWin.focus();
	}
	else if(!openerWin || openerWin.closed){
		if(typeof(url) == 'undefined' || url == 'undefined' || url == ''){
			url = '/apex/SearchAndLink?filterObjectId='+ObjId+'&txt=&type=FulfillReqLookup&childName=BMC_BaseElement__c&idValstr='+LKFId;
		}	
		openerWin = window.open(url,"HandlerWindow","status = 1,height ="+screenHeight+",width ="+ screenWidth+",left="+screenLeft(screenWidth)+",top="+screenTop(screenHeight)+", resizable = 0,scrollbars=no");
	}
}

function screenLeft(sWidth){
	return parseInt((screen.availWidth/2) - (sWidth/2));
}

function screenTop(sHeight){
	if(Ext.isChrome){
		var chromeHeight = parseInt((screen.availHeight/2) - (sHeight/2));
		return (chromeHeight- 25);
	}else
		return parseInt((screen.availHeight/2) - (sHeight/2));
}


function Clearfilter()
{
		    Ext.getCmp('ddlFilterCMDBAtttribute').setValue('');
		    Ext.getCmp('dateFilterField').setValue('');
			ClearAtttributeValue();
}

function Reloadpage()
{
	if(isDirty || (typeof(disableGrid) != 'undefined' && disableGrid && !isSavedSuccessfully)){
		Ext.MessageBox.show({
			title: Confirm_Action,
			msg: closeWarningMsgLabel,
			width:400,
			cls: 'msgPopupBtnCls',
			buttons: Ext.Msg.YESNO,
			buttonText: { yes: LabelYes, no: LabelNo },
			fn:  function(btn){
				if (btn == 'yes'){	
					 window.frameElement.contentWindow.location.reload();					
				}
			},
			icon: Ext.MessageBox.WARNING
		});
	} else {
		window.frameElement.contentWindow.location.reload();
	}
}

function ClearAtttributeValue()
{
		    Ext.getCmp('txtFilterCMDBAtttributeValue').setValue('');
		    Submit();
}

var ChangeVisibilityVar;
   
function savemsgbox(){

   var index=1;
   CloseSavePopUp();
   var SaveMessageDiv=document.getElementById('SaveMessageDiv');
   if(SaveMessageDiv!=null && SaveMessageDiv!='undefined'){
	    var PanelWidth,divWidth,leftAllign;
		SaveMessageDiv.setAttribute('style','visibility:hidden;width:auto;position: absolute;');
	    PanelWidth=document.getElementById('toolbar').clientWidth;
   		divWidth = SaveMessageDiv.clientWidth;
		if(PanelWidth!=null && PanelWidth!='undefined' && divWidth!=null && divWidth!='undefined' )
			leftAllign = parseInt((PanelWidth/2)-(divWidth/2)+10);
	    ChangeVisibilityOfMeassge(-24,0,SaveMessageDiv,index,leftAllign);
   }
	  
}
function ChangeVisibilityOfMeassge(VisibilityValue,timeOutTime,SaveMessageDiv,index,leftAllign){
   	  ChangeVisibilityVar=setTimeout(function(){
			SaveMessageDiv.setAttribute('style','display:flex; position: absolute; z-index:100;left: '+leftAllign+'px;margin-top:'+VisibilityValue+'px;');
			if(index <28){
				if(index<14)
					VisibilityValue=VisibilityValue+2;
				else
					VisibilityValue=VisibilityValue-2;
				
				index++;
			
			    if(index!=15)
			   		ChangeVisibilityOfMeassge(VisibilityValue,80,SaveMessageDiv,index,leftAllign);
			    else
			   		ChangeVisibilityOfMeassge(VisibilityValue,1000,SaveMessageDiv,index,leftAllign);
			}else
				CloseSavePopUp();
			
			
	  },timeOutTime);
}
function CloseSavePopUp(){
	clearTimeout(ChangeVisibilityVar);
	document.getElementById('SaveMessageDiv').setAttribute('style','display:none;');
	
	var warningDiv = document.getElementById('warningMessageId');
	if( warningDiv ) {			
		while (warningDiv.firstChild) {
			warningDiv.removeChild(warningDiv.firstChild);
		}
	}
	document.getElementById('WarningMessageDiv').setAttribute('style','display:none;');
	
}
var waitMask;
function showLoadingIcon(){ 
      waitMask = new Ext.LoadMask(Ext.getBody(), {msg:pleasewait});
	if(waitMask!=''){
				waitMask.setVisible(true);
	}
}

function hideLoadingIcon(){ 
	waitMask.setVisible(false);
   }

 function reload(){
 
		var gridInstanceStore = Ext.getCmp("CiEditGrid").getStore();
		var gridInstanceView = Ext.getCmp('CiEditGrid').getView();
		gridInstanceStore.removeAll();
		datastore = eval(datastore);
		gridInstanceView.refresh();
		gridInstanceStore.loadData(datastore.arrData);
		gridInstanceView.refresh();
 }
 
 function unSortFirstRow(p1, p2){
	var gridID = Ext.getCmp('CiEditGrid');
	var ds = gridID.getStore();
	var firstrowPos = 1;
	var isNewChrome =  true;
	if(isChromeCheck())
		isNewChrome = navigator.userAgent.match(/Chrom(e|ium)\/([0-9]+)\./)[2] > 69;
	if(isFirefoxCheck() || !isNewChrome)
		firstrowPos = -1;
	var returnParam1 = -1;
	var returnParam2 = 1;
	if(typeof(p1) != 'undefined' && p1 == 'ASC'){
		returnParam1 = 1;
		returnParam2 = -1;
	}		
	var ColIndex1;
	for(i=0; i< ColumnIndexArray.length; i++){
		if (ColumnIndexArray[i].dataIndx == p2){
			ColIndex1 = i;
			break;
		}
	}
    ds.sort({
		sorterFn: function(v1, v2){
			if(v1.raw[v1.raw.length - 1] == '')
				return firstrowPos;
			else if(v2.raw[v2.raw.length - 1] == '')
				return firstrowPos;
			else if(v1.raw[ColIndex1] > v2.raw[ColIndex1])
				return returnParam1;
			else if(v1.raw[ColIndex1] < v2.raw[ColIndex1])
				return returnParam2;
			else
				return 0;
		}
	});
	
}
function checkFieldExist(fieldAPI) {
	return clearDateFieldsForMultiEdit >= fieldAPI;
}
 function applyValues(){
	var updateRow;
	var EditedMasterRowData = [];
	var grid = Ext.getCmp('CiEditGrid');
	for(i=0; i<grid.columns.length; i++){
		if(grid.columns[i].itemid == 'boolean'){
			bCol.push({
				dataIndex:grid.columns[i].dataIndex,
				colIndex: i});
		} else if (grid.columns[i].name == 'lookup'){
			lookupCol.push({
				dataIndex:grid.columns[i].dataIndex,
				colIndex: i});
		}
	}
	record = grid.getStore().getAt(0);
	listCB = reArrange(listCB, 'CheckBox');
	var newvaluesSize = listCB.length;
	if(newvaluesSize> 0){
		if(record.dirty){
			var msg = MultiEditSaveConfirmation.replace('{NumberOfRecords}', newvaluesSize);
			Ext.MessageBox.show({
				title: Confirm_Action,
				msg: msg,
				width:400,
				icon: Ext.MessageBox.WARNING,
				cls: 'msgPopupBtnCls',
				buttons: Ext.Msg.OKCANCEL,
				buttonText: { ok: CMDBPopupOK, cancel: CMDBPopupCancel },
				fn:  function(btn){
					if (btn == 'ok'){	
						var colID;
						EditedMasterRowData.push(record.getChanges());
						if(bCol.length > 0){
							for(i=0;i<bCol.length; i++){
								if(EditedMasterRowData[0][bCol[i].dataIndex]){
									multiCol.push({
										colIndex:bCol[i].colIndex
									});
								}
							}
						}
						for (i=0; i<= newvaluesSize -1; i++){
							for (j=0; j<multiCol.length; j++){
								colID = grid.columns[multiCol[j].colIndex].dataIndex;
								if((typeof(EditedMasterRowData[0][colID])!='undefined' && EditedMasterRowData[0][colID] !== null && EditedMasterRowData[0][colID] !== '') || checkFieldExist(colID)){
									EditedValues.push({
										colvalue:multiCol[j].colIndex,
										rowvalue:listCB[i].index
									});
									if(lookupCol.length >0){
										for(k=0;k<lookupCol.length;k++){
											if(lookupCol[k].colIndex == multiCol[j].colIndex){
												if(lookupCol[k].colIndex == multiCol[j].colIndex){
													if(lookupID[listCB[i].index] == null || lookupID[listCB[i].index] == 'undefined')
														lookupID[listCB[i].index] = new Array();
													lookupID[listCB[i].index][multiCol[j].colIndex] = lookupID[0][multiCol[j].colIndex];
												}
											}
										}
									}
									updateRow = grid.getStore().getAt(listCB[i].index);
									if(typeof(EditedMasterRowData[0][colID])!='undefined' && EditedMasterRowData[0][colID] !== null && EditedMasterRowData[0][colID] !== '' || checkFieldExist(colID))
										updateRow.set(colID, EditedMasterRowData[0][colID]);
								}
							}
						}
						savebtn();
						clearDateFieldsForMultiEdit =[];
						EditedMasterRowData = [];
						multiCol = [];
						clearFirstRow();
					}
				}
			});
		}
	} else
		savebtn();
}
function clearFirstRow(){
	var grid = Ext.getCmp('CiEditGrid');
	record = grid.getStore().getAt(0);
	var colID;
	grid.selModel.deselectAll(true);
	for(i=0; i< grid.columns.length; i++){
		colID = grid.columns[i].dataIndex;
		record.set(colID, firstRowContent[i]);
	}
}
 function reArrange(values, type){
	var removeArr = [];
	for(i=0; i< values.length; i++){
		if(type == 'CheckBox'){
			if(typeof(listCB[i].raw[listCB[0].raw.length -1]) != 'undefined' && listCB[i].raw[listCB[0].raw.length -1] == ''){
				values.splice(i,1);
			}
		}else if(typeof(values[i].colvalue) == 'undefined' || values[i].colvalue === false){
				values.splice(i,1);
				i--;
			}
	}
	return values;
}

function editedMoreThan20Records(currentRow){
	var editedRows = [];
	var gridID = Ext.getCmp('CiEditGrid');
	var gridData = gridID.getStore().data;
	var editedValues = reArrange(EditedValues);
	for(var i=0;i<EditedValues.length;i++){
		if((gridData.getAt(EditedValues[i].rowvalue) != null) && (gridData.getAt(EditedValues[i].rowvalue).dirty == true)){
			if(editedRows.indexOf(EditedValues[i].rowvalue) == -1 && gridData.getAt(EditedValues[i].rowvalue).modified != null){
				var modifiedFieldsArr = Object.keys(gridData.getAt(EditedValues[i].rowvalue).modified);
				if(modifiedFieldsArr != null && modifiedFieldsArr.length > 0){
					for (var j=0; j < modifiedFieldsArr.length; j++) {
						var field = modifiedFieldsArr[j];
						if(gridData.getAt(EditedValues[i].rowvalue).isModified(field)){
							editedRows.push(EditedValues[i].rowvalue);
							break;
						}
					}
				}
			}
		}
		if(editedRows.length > 19){
			break;
		}
	}
	if(editedRows.length > 19 && editedRows.indexOf(currentRow) == -1){
		return true;
	}else if(editedRows.length == 20 && editedRows.indexOf(currentRow) > -1){
		return false;
	}
	return false;
}

function editedMoreThan20RecordsBeforeSaving(){
	var editedRows = [];
	var gridID = Ext.getCmp('CiEditGrid');
	var gridData = gridID.getStore().data;
	var editedValues = reArrange(EditedValues);
	for(var i=0;i<EditedValues.length;i++){
		if((gridData.getAt(EditedValues[i].rowvalue) != null) && (gridData.getAt(EditedValues[i].rowvalue).dirty == true)){
			if(editedRows.indexOf(EditedValues[i].rowvalue) == -1 && gridData.getAt(EditedValues[i].rowvalue).modified != null){
				var modifiedFieldsArr = Object.keys(gridData.getAt(EditedValues[i].rowvalue).modified);
				if(modifiedFieldsArr != null && modifiedFieldsArr.length > 0){
					for (var j=0; j < modifiedFieldsArr.length; j++) {
						var field = modifiedFieldsArr[j];
						if(gridData.getAt(EditedValues[i].rowvalue).isModified(field)){
							editedRows.push(EditedValues[i].rowvalue);
							break;
						}
					}
				}
			}
		}
	}
	if(editedRows.length > 20){
		return true;
	}else{
		return false;
	}
}

function savebtn(){
    window.parent.cmdbCISaveBtn = true;
	var gridID = Ext.getCmp('CiEditGrid');
	var colcount = gridID.columns.length;
	var rowcount = gridID.getStore().getTotalCount();
	var gridData = gridID.getStore().data;
	EditedValues = reArrange(EditedValues);
	var EditedValuesSize = EditedValues.length;
	var records = [];
	var cellval;
	var islocked = 'false';
	var record,checklockedcolumn;
	var EditedCellcolIndex;
	var isInstanceNameEdited = false;
	var editedInstanceName = new Array();
	var modifiedIndex,clsName;
	var row = 0;
	var InstanceNameField = orgNamespace.toUpperCase()+'NAME__C';
	checklockedcolumn = gridID.columns[0].dataIndex;
	clsName = checklockedcolumn.split('$')[0];
	
	for(var i=0;i<EditedValuesSize;i++){
		if((gridData.getAt(EditedValues[i].rowvalue) != null) && (gridData.getAt(EditedValues[i].rowvalue).dirty == true)){
			if(checklockedcolumn != '' && checklockedcolumn != '' && typeof(checklockedcolumn)!='undefined' && checklockedcolumn.split('$')[1].toLowerCase() == InstanceNameField.toLowerCase())
				islocked = 'true';
			record = gridID.getStore().getAt(EditedValues[i].rowvalue);
			var isoldval =false;
			if(typeof(record)!='undefined' && record !=null && record !='' && record.isModified(clsName+'$'+InstanceNameField)){
				for(var k=0;k < editedInstanceName.length;k++){
					if(gridData.getAt(EditedValues[i].rowvalue).get(checklockedcolumn) == editedInstanceName[k])
						isoldval = true;
				}
			}
			if(isoldval)
				modifiedIndex = EditedValues[i].colvalue + 1;
			else 
				modifiedIndex = EditedValues[i].colvalue;
			if(gridID.columns[modifiedIndex].locked == true && gridData.getAt(EditedValues[i].colvalue).index == 0 && typeof(clsName)!='undefined' && isInstanceNameEdited == false && islocked)
				isInstanceNameEdited = record.isModified(clsName+'$'+InstanceNameField);
			if(islocked != 'true' || isInstanceNameEdited)
				EditedCellcolIndex = EditedValues[i].colvalue;
			else
				EditedCellcolIndex = EditedValues[i].colvalue;
			if(gridID.columns[EditedCellcolIndex].tdCls != 'custom-column'){
				var colname =gridID.columns[EditedCellcolIndex].dataIndex;
				var isCellModified = record.isModified(colname);
				colname = colname.split("$");
				colname = colname[1];
					if(colname == 'OWNER.NAME')
						colname = 'OwnerId';
				if(isCellModified == true){
					var ColItemId = gridID.columns[EditedCellcolIndex].itemid;
					var colType = gridID.columns[EditedCellcolIndex].name;
					if(colType == 'lookup')
						ColItemId = 'lookup';
					var instid = gridData.getAt(EditedValues[i].rowvalue).get(gridID.columns[colcount-1].dataIndex);
					if(typeof(ColItemId) =='undefined' || ColItemId==null)
						ColItemId = 'otherFields';
					if(colType == 'lookup' && typeof(lookupID[EditedValues[i].rowvalue][EditedValues[i].colvalue]) != 'undefined' && lookupID[EditedValues[i].rowvalue][EditedValues[i].colvalue] != '')
						cellval = lookupID[EditedValues[i].rowvalue][EditedValues[i].colvalue];
					else if(colType == 'multiselect'){
						cellval = gridID.getStore().data.getAt(EditedValues[i].rowvalue).get(gridID.columns[EditedCellcolIndex].dataIndex);
						cellval = cellval.join(';');
					}
					else					
						cellval = gridData.getAt(EditedValues[i].rowvalue).get(gridID.columns[EditedCellcolIndex].dataIndex);
					records.push({
						InstID:instid,
						ColName:colname,
						CellVal:Ext.util.Format.htmlDecode(cellval),
						ColItemId:ColItemId
					});
					if(colname == orgNamespace.toUpperCase()+'NAME__C'){
						isInstanceNameEdited = false;
						editedInstanceName[row]  = cellval;
						row++;
					}
				}
			}
		}
	}
	if(isReconOn && listCB.length == 0 && editedMoreThan20RecordsBeforeSaving()){
		var popupBox = Ext.MessageBox.show({
						msg: multiEditReconMessage,
						cls: 'msgPopupBtnCls',
						buttons: Ext.Msg.OK,
						icon: Ext.MessageBox.ERROR
					});
	}else{
		SaveData(records);
	}
}

window.parent.cmdbCIDirtyFlag = function (){
	 if(isDirty || (typeof(disableGrid) != 'undefined' && disableGrid))
		return true;
	
	 return false;
}

window.parent.goBack = function (){
	 Reloadpage();
}
						
function SaveData(records) {

	showLoadingIcon();
	if(typeof(openerWin) != 'undefined' && openerWin != null)
		openerWin.close();
	if(ObjId == null)
		ObjId = '';
	if(selectedIdsList == null)
		selectedIdsList == '';	
	Visualforce.remoting.Manager.invokeAction(
		SaveData_Remote,
		records,ObjId,selectedIdsList,
		function(result, event) {
			if(typeof(result.ExceptionMessage) !='undefined' || result.ExceptionMessage!=null){
				var errMessage = result.ExceptionMessage;
				if((errMessage.indexOf('8001') > -1) || (errMessage.indexOf('8002') > -1) || (errMessage.indexOf('8003') > -1))
					errMessage = RemedyForceHTMLProcessor.htmlDecoder(errMessage);
			
				var popupBox = Ext.MessageBox.show({
					msg: errMessage,
					cls: 'msgPopupBtnCls',
					buttons: Ext.Msg.OK,
					icon: Ext.MessageBox.ERROR
				});
				popupBox.defaultFocus = this;
				popupBox.focus();
				hideLoadingIcon();
			} else {
						
						if(result.Success == true){
							isDirty = false ;
							isSavedSuccessfully = true;
							var gridID = Ext.getCmp('CiEditGrid');
							var rowcount = gridID.getStore().getTotalCount();
							for(var k = 0 ;k <rowcount;k++){
								if((gridID.getStore().data.getAt(k) != null) && (gridID.getStore().data.getAt(k).dirty == true)){
									gridID.getStore().sync();
									gridID.getSelectionModel().deselectAll();
									gridID.getStore().getAt(k).commit();
								}
							}
							if( result.FieldUpdateWarningMessage ) {
								savewarningmsgbox( result.FieldUpdateWarningMessage );
							} else {
								savemsgbox();
							}
							hideLoadingIcon();
							enableToolbar();
						}	
}				
		},
		{escape: true}
	);	
}

function savewarningmsgbox(strWarningMessageforFieldsNotUpdated) {
	CloseSavePopUp();   
	var WarningMessageDiv = document.getElementById('WarningMessageDiv');
	if(WarningMessageDiv!=null && WarningMessageDiv!='undefined'){
	   var PanelWidth,divWidth,leftAllign;
		WarningMessageDiv.setAttribute('style','visibility:hidden;width:auto;position: absolute;');
		PanelWidth=document.getElementById('toolbar').clientWidth;
		divWidth = WarningMessageDiv.clientWidth;
		
		var warningDiv = document.getElementById('warningMessageId');
		var txtNode1 = document.createTextNode(strFieldsNotUpdatedDueToPriorityRules);
		var txtNode2 = document.createTextNode(strWarningMessageforFieldsNotUpdated);
		
		if( warningDiv ) {			
			while (warningDiv.firstChild) {
				warningDiv.removeChild(warningDiv.firstChild);
			}
			
			warningDiv.appendChild(txtNode1);
			warningDiv.appendChild(document.createElement("br"));
			warningDiv.appendChild(txtNode2);
		}
		if(PanelWidth!=null && typeof(PanelWidth)!='undefined' && divWidth!=null && typeof(divWidth)!='undefined' )
			leftAllign = parseInt((PanelWidth/2)-(divWidth/2)-250);
		
		
		
		WarningMessageDiv.setAttribute('style','display:flex; position: absolute; z-index:100;-webkit-animation: dialog-flyin .5s;animation: dialog-flyin .5s;left: '+leftAllign+'px;margin-top:28px;');
		setTimeout(function(){CloseSavePopUp();}, 10000);
	}
}
function checkBeforeLookup(obj,pApiName){
	pObjectName = 'BMC_BaseElement__c';
	if(pApiName.toLowerCase() == orgNamespace.toLowerCase()+'primaryclient__c'){
		var dbOriginalValue = datastore.arrData[this.RowIndex][this.ColumnIndex];
		if(obj.lastValue && dbOriginalValue && dbOriginalValue === obj.lastValue){
			Ext.Msg.show({
			   title:'Message',
			   msg:PCChangelbl,
			   cls: 'msgPopupBtnCls',
			   buttons: Ext.Msg.OKCANCEL,
			   buttonText: { ok: CMDBPopupOK, cancel: CMDBPopupCancel },
			   maxWidth:300,
			   fn:function(buttonId){
					if(buttonId=='ok'){
						isSearchandLink = false;
						openLookupPopupforCiEdit(obj,pApiName,pObjectName);
					}
			   }
			});
		}else{
			isSearchandLink = false;
			openLookupPopupforCiEdit(obj,pApiName,pObjectName);
		}	
	}else if(pApiName == orgNamespace+'FKLocation__c'){
			isSearchandLink = true;
			openLookupPopupforCiEdit(obj,pApiName,pObjectName,'SearchAndLink');
	}
	else{
			isSearchandLink = false;	
			openLookupPopupforCiEdit(obj,pApiName,pObjectName);
	}
	if(lookupID[popupIndex] == null || lookupID[popupIndex] == 'undefined')
		lookupID[popupIndex] = new Array();
}

function openLookupPopupforCiEdit(obj,moduleIdName, moduleName, pageName){

	if(pageName == null || typeof(pageName) == 'undefined' || pageName == ''){
		pageName = 'SearchPage';
	}
   if(moduleIdName == 'OwnerId'){
		isSearchandLink = true;
        var baseURL = "apex/SuggestionPage?parentObjectName=BMC_BaseElement__c&fromInciOwnerLkup=true&ownerType=OWNER&isMultiEdit=true";
        openPopupRF(baseURL, oncomp, 600, 1000);
		return true;
   }
   if(moduleName.toUpperCase() == 'BMC_BASEELEMENT__C' && moduleIdName.toUpperCase().indexOf('__VENDOR__C') != -1){
		openPopupRF(pageName + '?moduleId='+moduleIdName+'&InstanceID='+BE_InstanceID+'&isLookup=true&idNameForPopUp=true&popupId=null&moduleName='+moduleName+'&VENDORFlag=true',oncomp,470,670);
	}else if(moduleName.toUpperCase() == 'BMC_BASEELEMENT__C' && moduleIdName.toUpperCase().indexOf('__SERVICE_PROVIDER__C') != -1){
		openPopupRF(pageName + '?moduleId='+moduleIdName+'&InstanceID='+BE_InstanceID+'&isLookup=true&idNameForPopUp=true&popupId=null&moduleName='+moduleName+'&SPFlag=true',oncomp,470,670); 
	}else if(moduleName.toUpperCase() == 'BMC_BASEELEMENT__C' && moduleIdName.toUpperCase().indexOf('__FKMODEL__C') != -1){
	  var selectedClass='';
	  let modifiedClassName = '';
	  if(selectedIndex!=null && typeof(selectedIndex)!='undefined'){
		var gridObj = Ext.getCmp('CiEditGrid');
		var selectedRecord = gridObj.getStore().getAt(selectedIndex);
		selectedClass= selectedRecord.get(SelectedCMDBClass.toUpperCase()+'$'+orgNamespace.toUpperCase()+'CLASSNAME__C');
		modifiedClassName = selectedClass;

		if(selectedClass.indexOf('(') > -1){
			modifiedClassName = selectedClass.slice(0,selectedClass.indexOf('(')); 
			modifiedClassName = modifiedClassName.trim(); 
		}
		
	  }
	  openPopupRF(pageName + '?moduleId='+moduleIdName+'&InstanceID='+BE_InstanceID+'&isLookup=true&idNameForPopUp=true&popupId=null&moduleName='+moduleName+'&instClass='+modifiedClassName,oncomp,470,670); 
	}else if(moduleName.toUpperCase() == 'BMC_BASEELEMENT__C' && moduleIdName.toUpperCase().indexOf('__FKLOCATION__C') != -1){
		var baseURL = "SearchAndLink?txt=changelookupValues&parentName=BMC_BaseElement__c&childName=BMC_BaseElement__c&isLookUp=BMC_BaseElement__c&citype=location&isCustomLookup=false";
		var title = selectFrom +  ' ' + locations;
		openPopupTitle(baseURL,oncomp,600,1000,title);
	}
	else
   		openPopupRF(pageName + '?moduleId='+moduleIdName+'&InstanceID='+BE_InstanceID+'&isLookup=true&idNameForPopUp=true&popupId=null&moduleName='+moduleName,oncomp,470,670);
	}

function oncomp(result){
	if(typeof(result) != 'undefined' && result!=null)
		result = result.split('ф');
	if(result.length > 1)
		setPopUpValue(result[0],result[1]);
}

function changelookupValues(selectedLookUpID,selectedLookUpName){
	setPopUpValue(selectedLookUpID,selectedLookUpName);
}

function assignOwnerfields(queueId , queueName,staffId,staffName){ // be called from Suggestion Page
			if(staffId != null && staffId.length > 0){
				setPopUpValue(staffId,staffName);
			}else if( queueId != null && queueName.length > 0){
			setPopUpValue(queueId,queueName);
			}
}
			
function setPopUpValue(recordId,recordName){
	var gridID = Ext.getCmp('CiEditGrid');
	var EditedCellcolIndex;
	var islocked = 'false';
	var col = 0;
	var focusIndex = 0;
	for(var j=0;j<gridID.columns.length;j++){
		var checklockedcolumn1 = gridID.columns[j].dataIndex.split("$");
		checklockedcolumn1 = checklockedcolumn1[1];
		if(checklockedcolumn1.toLowerCase() == orgNamespace.toLowerCase()+'name__c'){
			islocked = 'true';
			col = j;
			break;
		}
	}
	for(var i=0;i<EditedValues.length;i++){
		if(islocked != 'true'){
		    EditedCellcolIndex = EditedValues[i].colvalue;
		}
		else if(col > EditedValues[i].colvalue){
		    EditedCellcolIndex = EditedValues[i].colvalue;
		}
		else{
		    EditedCellcolIndex = EditedValues[i].colvalue;
		}
		focusIndex = EditedValues[i].colvalue - 1;
	}
	
	if(recordId!= null && recordId != '' && recordId !='undefined'){
			if(popupIndex >= 0){
				lookupID[popupIndex][ColumnIndex] = recordId;
			}
			var record = gridID.getStore().getAt(popupIndex);
			if(isSearchandLink==true) 
				record.set(gridID.columns[EditedCellcolIndex].dataIndex, Ext.util.Format.htmlEncode(recordName)); 
			else
				record.set(gridID.columns[EditedCellcolIndex].dataIndex,recordName);
			modifyGridView(RowIndex);
		 
	}
	//window.closePopup();
	//gridID.getSelectionModel().setCurrentPosition({row: popupIndex, column: focusIndex});
	//gridID.getSelectionModel().setCurrentPosition({row: popupIndex, column: focusIndex + 1});
}
function ResizeCIEditor() {
	var CIEwidth=(window.innerWidth || document.documentElement.clientWidth || document.body.clientWidth);
	var CIEheight=(window.innerHeight || document.documentElement.clientHeight || document.body.clientHeight)-35;
	Ext.getCmp('CMDBCIEditToolbar').setWidth(CIEwidth);
	Ext.getCmp('CiEditGrid').setSize(CIEwidth,CIEheight);
}
function showExpansionWindow(record,old,header,maxLength,isReadonly){
	var winHeader = header;
	var old_data = Ext.util.Format.htmlDecode(old);
	var param = { value: old_data,readOnly:isReadonly, cls:'InputVirtualReadOnly', id:'textAreaPopup' };
	if(maxLength != null){
		param.maxLength = maxLength;
	}
	var txtarea = new Ext.form.TextArea(param);
	var errormsg = CMDBTextFieldLimitExceeded;
	errormsg = errormsg.replace("{0}", maxLength);
	txtarea.maxLengthText = errormsg;
	
	popupwindow = new Ext.Window({
		id: 'popupwin',
		layout: 'fit',
		title: winHeader,
		width:400,
		height:200,
		frame: false,
		animate:true,
		modal:true,
		cls: 'popupCls',
		defaultType: 'textarea',
		items: [txtarea],
		buttons: [{
			text: CMDBPopupOK,
			cls: 'popupBtnCls',
			handler: function(){
				var value = txtarea.getValue();
				setvalue(Ext.util.Format.htmlEncode(value), txtarea.originalValue);
				popupwindow.close();
			}
		},{
			 text: CMDBPopupCancel,
			 cls: 'popupBtnCls',
			 handler: function(){
				popupwindow.close();
			 }
		}]

	});
	popupwindow.show();
}

function setvalue(valueToSetInTextArea, previousValue){
    if(maxLengthForPopup != null)
	{
		 if(valueToSetInTextArea.length > maxLengthForPopup){
			   valueToSetInTextArea = valueToSetInTextArea.substr(0,maxLengthForPopup);
		 }
	}
	var record = Ext.getCmp('CiEditGrid').getStore().data.getAt(popupIndex);
	if(listCB.length < 1 && previousValue != valueToSetInTextArea){
		disableCheck = true;
		alreadycheckDisabled = true;
		document.getElementById("grid").className = "disableCheck";
		if(!alreadyShown){
			alreadyShown = true;
			var t2Pos = (pagecnt2 -pagecnt1) < 8 ? (25*(pagecnt2 -pagecnt1 +1)/2) : 200;
			setTimeout(function(){t2.targetXY = [10, t2Pos]; t2.show();}, 1000);
		}
	} 
	if(previousValue != undefined && previousValue != null && previousValue != valueToSetInTextArea){
		//if(valueToSetInTextArea == '')
		//	valueToSetInTextArea = record.raw[ColumnIndex];
		record.set(dataIndexForPopup,valueToSetInTextArea);
		modifyGridView(RowIndex);	
	}
}

window.onresize = ResizeCIEditor;

function setSizeOnWindowResize(){
	try{
		var height=Ext.getBody().getViewSize().height-65;
		var CiEditGrid=Ext.getCmp('CiEditGrid');
		if(CiEditGrid){
			CiEditGrid.setHeight(height);
		}
	}catch(e){
		console.log(e);
	}
}
Ext.EventManager.onWindowResize(function () {
	 setSizeOnWindowResize();
});	
