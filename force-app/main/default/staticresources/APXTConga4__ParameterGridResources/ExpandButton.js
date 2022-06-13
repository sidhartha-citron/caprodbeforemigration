Ext.define('cpl.view.ExpandButton',
    {
        extend: 'Ext.button.Button',
        xtype: 'gridexpandbutton',

        icon: 'https://composer.congamerge.com/ApxtLibraryJS/resources/images/apxt-folders-expand-16.png',
        tooltip: 'Expand all group sections.',
        alignTo: 'l',

        handler: function (grid, record, e) {
            var parameterGrid = this.up('grid');
            var pGroup = parameterGrid.getView().getFeature('DatasetGrouping');
            pGroup.expandAll();
        }
    });