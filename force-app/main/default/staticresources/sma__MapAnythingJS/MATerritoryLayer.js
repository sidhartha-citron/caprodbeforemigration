    
MATerritory = {
    deleteTerritoryLayer: function (territoryLayer) {
        Visualforce.remoting.Manager.invokeAction(MARemoting.Territory.delete,
            territoryLayer,
            function(response) {
                if (response.success) {
                    MAToastMessages.showSuccess({ message: 'Successfully deleted layer' });
                    MALayers.refreshFolder();
                }
            },
            {
                escape: false,
                buffer: false
            }
        )
    }
};
