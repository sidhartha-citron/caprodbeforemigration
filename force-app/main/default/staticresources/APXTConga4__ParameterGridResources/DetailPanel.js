Ext.define("cpl.view.DetailPanel",
    {               
        extend: "Ext.panel.Panel",
        xtype: "detail-panel",

        itemId: "detailPanel",
        id: "detailPanelId",
        title: "Parameter Definition",
        html: "<b>Search for or select a Composer Parameter from the left.",
        /****The original tpl when we were using the View from prodDB MySQL****/
        //tpl: "<h1>{ParameterName}</h1><h2> ({CategoryName})</h2><hr />{Description}<br /><br />{HTMLBody}<br /><br />Composer 7: {C7Enabled}<br />Composer 8: {C8Enabled}",

        /****New one going forward where we call out the Flare page as the detail panel. https is required!****/
        tpl: '<br /><iframe src="https://www.congasphere.com/content/parameters/params/{Name}.htm" name="{Name}" scrolling="yes" width="100%" height="675" frameborder="0" ></iframe>',

        //tpl: '<br /><iframe src="https://congaflare.congamerge.com/content/parameters/params/{Name}.htm" name="{Name}" scrolling="yes" style="border-bottom-style:solid;border-bottom-width:10;width:100%;height:100%" frameborder="0" ></iframe>',
        //style: "padding: 5px; margin: 10px;",
        style: "padding: 0px; margin: 0px;",
        border: true,
        /*style: {
            '0 0 0 3',
            borderStyle: 'solid'
        },*/
        //maxHeight: 600,
        autoScroll: false,
        dockedItems: [{
            xtype: 'toolbar',
            dock: 'top',
            height: 30,
            padding: 0,
            items:
            [
                {
                    xtype: 'tbfill',
                    align: 'left'
                },
                {
                    xtype: 'gridselectbutton',
                    align: 'center'
                },
                {
                    xtype: 'tbfill',
                    align: 'right'
                }
            ]
        }],
        flex: 1
    });