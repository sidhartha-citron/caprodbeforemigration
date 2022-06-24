Ext.define("cpl.view.Grid", {
    extend: "Ext.grid.Panel",
    xtype: 'grouped-grid',
    viewConfig: {
        preserveScrollOnRefresh: true
    },

    requires: [
        'Ext.grid.feature.Grouping',
        'cpl.store.Parameters'
    ],
    id: "GridId",
    frame: false,
    width: 550,
    padding: 0,
    //height: 600,
    autoScroll: false,
    title: "Composer Parameter List",
    resizable: false,
    itemId: "ParameterGridPanel",
    border: true,

    features: [{
        ftype: 'grouping',
        groupHeaderTpl: '{name}{[values.rows.length > 1 ? "s" : ""]} ({rows.length})',
        hideGroupedHeader: true,
        startCollapsed: true,
        id: 'DatasetGrouping'
    }],

    dockedItems: [{
        xtype: 'toolbar',
        dock: 'top',
        height: 30,
        padding: 3,
        items:
        [/*{
            xtype: 'gridselectbutton',
            align: 'left'
        },
        {
            xtype: 'tbfill'
        },*/
        {
            xtype: 'gridtextfield'
        },
        {
            xtype: 'gridexpandbutton',
            tooltip: 'Expand all group sections.'
        },
        {
            xtype: 'gridcollapsebutton',
            tooltip: 'Collapse all group sections.'
        }]
    }],

    initComponent: function () {

        this.store = new cpl.store.Parameters();
        this.store.load(
            function () {
                this.each(function (record) {
                    //console.log(record.get('ParameterName') + '\t' + record.get('CategoryName'));
                });
            });

        this.columns =
            [{
                text: 'Category',
                dataIndex: 'CategoryName',
                flex: 1
            },
            {
                /****Used to be 'ParameterName' ****/
                text: 'Name',
                dataIndex: 'Name',
                width: 200
                //flex: 1
            },
            {
                text: 'Description',
                dataIndex: 'Description',
                //width: 400
                flex: 2
            }];

        //JM's test is this listener. MM's is below and currently commented out.
        this.listeners =
            {
                itemclick: function (grid, record, item, rowIndex, e) {                   

                    //console.log(record);
                    //console.log('Parameter Description: ' + record.get("Description"));
                    //console.log(grid.getStore().getAt(rowIndex).get('ParameterName'));
                    //console.log(record.get('ParameterName'));
                    //console.log(rowIndex);
            /***
            *Neither of the 'Ext.gets' below work if any of the groupings above the one you want a parameter from is collapsed.
            *The record.get("ParameterName") seems to be a slightly better option b/c of odd rowIndex issues.
            *Not sure there is a good solution here, grouping is chaotic in terms of the record or row you want to work with.
            ***/
                    //Ext.get('thePage:theForm:thePageBlock:thePageBlockSection:nameStringBox').dom.value = grid.getStore().getAt(rowIndex).get('ParameterName');
                    
                    /*Ext.get("thePage:theForm:thePageBlock:inputFields:nameandvaluesection:nameStringItem:nameStringBox").set({ value: record.get("ParameterName") }).highlight("60bb46", {
                        attr: 'color',
                        attr: 'backgroundColor',
                        duration: 1500
                    });

                    Ext.get("thePage:theForm:thePageBlock:inputFields:commentsSection:descriptionSectionItem:commentStringBox").dom.value = record.get("Description");
                    Ext.get("thePage:theForm:thePageBlock:inputFields:commentsSection:descriptionSectionItem:commentStringBox").highlight("60bb46", {
                        attr: 'color',
                        attr: 'backgroundColor',
                        duration: 1500
                    });

                    if (Ext.get("thePage:theForm:thePageBlock:inputFields:nameandvaluesection:valueStringItem:valueStringBox").dom.value === '') {
                        Ext.get("thePage:theForm:thePageBlock:inputFields:nameandvaluesection:valueStringItem:valueStringBox").highlight("ED1C24", {
                            attr: "color",
                            attr: "backgroundColor",
                            duration: 2500});
                    }

                    Ext.get("thePage:theForm:thePageBlock:inputFields:nameandvaluesection:valueStringItem:valueStringBox").focus(10, '');
                    */

                    var detailPanel = this.ownerCt.child("#detailPanel");
                    detailPanel.update(record.data);

                    //keeps the grid from refreshing to the top of the list with a click
                    //leaves the grid on the selected item with a very minimal shift
                    this.getView().focusRow(record);
                    this.getEl().down('.x-grid-view').scroll('bottom', rowIndex, false);
                    
                    //sets the focus at a row click to the top of the detail panel
                    //The grid is zooming to the top though--need to fix this
                    detailPanel.focus(10, '');
                }
            };
        this.callParent();
    }

});