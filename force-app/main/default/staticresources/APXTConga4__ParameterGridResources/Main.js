Ext.define("cpl.view.Main",
    {
        extend: "Ext.panel.Panel",
        requires: ["cpl.view.Grid", "cpl.view.DetailPanel"],
        layout: "hbox",
        frame: false,
        itemId: 'MyPanel',
        style: "padding: 4px; margin: 4px;",
        //maxHeight: 620,

        items: [
            {
                xtype: "grouped-grid"
            },
            {
                xtype: "detail-panel"
            }
        ]
    });