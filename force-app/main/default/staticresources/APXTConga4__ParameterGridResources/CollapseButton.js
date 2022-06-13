Ext.define('cpl.view.CollapseButton',
    {
        extend: 'Ext.button.Button',
        xtype: 'gridcollapsebutton',

        icon: 'https://composer.congamerge.com/ApxtLibraryJS/resources/images/apxt-folders-collapse-16.png',
        tooltip: 'Collapse all group sections.',
        alignTo: 'l',

        handler: function (grid, record, e) {
            var parameterGrid = this.up('grid');
            var pGroup = parameterGrid.getView().getFeature('DatasetGrouping');
            pGroup.collapseAll();
        }
    });