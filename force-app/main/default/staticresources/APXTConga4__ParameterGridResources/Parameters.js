Ext.define("cpl.store.Parameters",
    {
        extend:     "Ext.data.Store",
        model:      "cpl.model.Parameter",
        groupField: "CategoryName",        
                
        proxy:
        {
            type: "jsonp",
            url: "https://composer.congamerge.com/ComposerParameterList/services/data",
            //url: "https://localhost/ComposerParameterList/services/data",
            id: 'parameterStore',
            reader:
            {
                type: "json",
                root: "results"
            }
        }
    });