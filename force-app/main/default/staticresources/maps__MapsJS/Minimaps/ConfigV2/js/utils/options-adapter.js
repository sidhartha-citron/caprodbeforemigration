/**
 * Constructor
 */
var OptionsAdapter = function() {
    this.context = null;
    this.nearby = [];
};

/**
 * Adds a context view to the instance.
 * @param {object} _context Object to add.
 */
OptionsAdapter.prototype.addContext = function(_context) {
    this.context = _context;

    return this;
};

/**
 * Adds nearby view(s) to instance.
 * @param {Array|object} _nearby Nearby view(s) to add.
 */
OptionsAdapter.prototype.addNearby = function(_nearby) {
    (Array.isArray(_nearby)) ? _nearby.forEach(addNearby.bind(this)) : addNearby.call(this, _nearby);

    function addNearby(item) {
        this.nearby.push(item);
    }

    return this;
};

/**
 * "Output":
 * {
 *      "config": {object}
 *      "center": {
 *          "type": {string}
 *          "lat": {string}
 *          "lng": {string}
 *      },
 *      "zoom": {number}
 *      "layers": [
 *          {
 *              "label": {string}
 *              "type": {string}
 *              "soql": {string}
 *              "nameField": {string}
 *              "fields": {Array<String>}
 *              "marker": {
 *                  "latfield": {string}
 *                  "lngField": {string}
 *                  "color": {string}
 *                  "symbol": {string}
 *              }
 *          },
 *          ...
 *      ]
 * }
 * 
 * Adapts a given JSON object from WIZARD to MINIMAP form.
 * @param {object} object Object for conversion.
 * @returns {object}
 */
OptionsAdapter.prototype.toMiniMapForm = function() {
    if (!this.context) throw 'Must have a context layer before converting.';

    var result = {
        config: {
            context: Object.assign({}, this.context),
            layers: []
        },
        layers: []
    };

    result.center = Object.assign({}, this.context.center);
    result.zoom = this.context.zoom;
    this.latLng = this.getLatLng.call(this.context);

    if (result.center.type === 'field') {
        this.setCenterLatLngFields(result.center);
        result.config.context.center.lat = "";
        result.config.context.center.lng = "";
    }
    
    result.layers.push({
        label: this.context.name,
        type: "context",
        geoFieldType: this.context.geoFieldType,
        soql: this.buildContextQuery(),
        sobjectName: this.context.sobject,
        nameField: this.context.metadata.nameField.api,
        fields: filterTooltipFields(this.context.tooltips),
        marker: this.buildMarker.call(this.context, this.latLng)
    });

    delete result.config.context.center.verifiedLat;
    delete result.config.context.center.verifiedLng;
    delete result.config.context.metadata;
    delete result.config.context.queryFilterComponents;

    var self = this;
    var index = 0;
    this.nearby.forEach(function(layer) {
        layer.latLng = self.latLng;

        result.layers.push({
            label: layer.name,
            type: "nearby",
            radius: layer.radius,
            unit: layer.unit,
            geoFieldType: layer.geoFieldType,
            soql: self.buildNearbySOQL.call(layer, self.context.sobject === layer.sobject),
            sortField: layer.sortField,
            sortDirection: layer.sortDirection,
            sobjectName: layer.sobject,
            numMarkers: layer.numMarkers,
            nameField: layer.metadata.nameField.api,
            fields: filterTooltipFields(layer.tooltips),
            marker: self.buildMarker.call(layer, self.getLatLng.call(layer))
        });

        result.config.layers.push(Object.assign({}, layer));
        delete result.config.layers[index].metadata;
        delete result.config.layers[index++].queryFilterComponents;
    });

    return result;
};

function filterTooltipFields(fields) {
    var result = [];

    for (var idx in fields) {
        var field = fields[idx];
        if (field && typeof field === 'string') result.push(field);
    }

    return result;
}

OptionsAdapter.prototype.buildContextQuery = function() {
    var soql =  " FROM " + this.context.sobject,
        isGlobal = this.context.type === 0;

    if (isGlobal) {
        if (this.context.queryFilters.length) soql += " WHERE";
    } else {
        soql += " WHERE Id = '{!Id}'";
    }

    var formattedQueryFilters = this.buildQueryFilters(this.context.queryFilters || []);

    if (formattedQueryFilters.length) {
        soql += ' ' + formattedQueryFilters[0];

        for (var i = 1; i < formattedQueryFilters.length; i++) {
            soql += ' AND ' + formattedQueryFilters[i];
        }
    }

    if (isGlobal && this.context.sortField) {
        soql += ' ORDER BY ' + this.context.sortField + ' ' + this.context.sortDirection;
    }

    if (isGlobal && this.context.numMarkers) {
        soql += ' LIMIT ' + this.context.numMarkers;
    }

    return soql;
};

OptionsAdapter.prototype.buildQueryFilters = function(queryFilters) {
    var result = [];

    if (!queryFilters.length) return result;

    var operators = {
        number: {
            'equals': '{0} = {1}',
            'not equal to': '{0} != {1}',
            'greater than': '{0} > {1}',
            'greater than or equal to': '{0} >= {1}',
            'less than': '{0} < {1}',
            'less than or equal to': '{0} <= {1}'
        },
        text: {
            'equals': '{0} = \'{1}\'',
            'not equal to': '{0} != \'{1}\'',
            'starts with': '{0} LIKE \'{1}%\'',
            'contains': '{0} LIKE \'%{1}%\'',
            'does not contain': '(NOT {0}  LIKE \'%{1}%\')'
        },
        date: {
            'equals': '{0} = {1}',
            'not equal to': '{0} != {1}',
            'greater than': '{0} > {1}',
            'greater than or equal to': '{0} >= {1}',
            'less than': '{0} < {1}',
            'less than or equal to': '{0} <= {1}'
        }
    };

    for (var i = 0; i < queryFilters.length; i++) {
        result.push(formatFilter(queryFilters[i]));
    }

    function formatFilter(filter) {
        if (!filter.type) return null;

        switch (filter.type) {
            case 'int':
            case 'integer':
            case 'double':
            case 'currency':
                type = 'number';
                break;
            case 'date':
            case 'datetime':
                type = 'date';
                break;
            default:
                type = 'text';
        }
        
        var formattedFilter = operators[type][filter.operator].format(filter.name, filter.value);
        return formattedFilter;
    }

    return result;
};

OptionsAdapter.prototype.getLatLng = function() {
    var result = {};

    if (this.geoFieldType === 'number') OptionsAdapter.prototype.getLatLngFieldsFromNumberFields.call(this, result);
    if (this.geoFieldType === 'location') {
        var latLng = OptionsAdapter.prototype.getLatLngFieldsFromLocationField(this.locationField);
        result.lat = latLng.lat;
        result.lng = latLng.lng;
    }

    if (this.verifiedLatField && this.verifiedLngField && this.verifiedGeoFieldType === 'verified-number') OptionsAdapter.prototype.getVerifiedLatLngFieldsFromNumberFields.call(this, result);
    if (this.verifiedLocationField && this.verifiedGeoFieldType === 'verified-location') {
        var latLng = OptionsAdapter.prototype.getLatLngFieldsFromLocationField(this.verifiedLocationField);
        result.verifiedLat = latLng.lat;
        result.verifiedLng = latLng.lng;
    }

    return result;
};

/**
 * Returns an object with lat lng components based on the context number fields.
 * @return {object}
 */
OptionsAdapter.prototype.getLatLngFieldsFromNumberFields = function(obj) {
    obj.lat = this.latField;
    obj.lng = this.lngField;
};

OptionsAdapter.prototype.getVerifiedLatLngFieldsFromNumberFields = function(obj) {
    obj.verifiedLat = this.verifiedLatField;
    obj.verifiedLng = this.verifiedLngField;
};

/**
 * Returns an object with lat lng components based on the context location field.
 * @returns {object}
 */
OptionsAdapter.prototype.getLatLngFieldsFromLocationField = function(locationField) {
    var isCustomField = locationField.indexOf('__c') > -1;

    if (isCustomField) {
        var fieldPart = locationField.substring(0, locationField.length - 1);

        return {
            lat: fieldPart + 'latitude__s',
            lng: fieldPart + 'longitude__s'
        };
    }

    var indexOfAddress = locationField.indexOf('address'),
        fieldPart = locationField.substring(0, indexOfAddress);

    return {
        lat: fieldPart + 'latitude',
        lng: fieldPart + 'longitude'
    };
};

/**
 * Returns the nearby layer's SOQL query.
 * @param {Boolean} areSObjectsEqual Determines if we add a query filter to exclude the minimap's context record from the query result.
 * @returns {String}
 */
OptionsAdapter.prototype.buildNearbySOQL = function(areSObjectsEqual) {
    var whereClauses = [],
        orderByClauses = [];

    if (areSObjectsEqual) whereClauses.push('Id != \'{!Id}\'');

    whereClauses = whereClauses.concat(OptionsAdapter.prototype.buildQueryFilters(this.queryFilters));

    // Distance clause must be the last item in the array
    if (this.geoFieldType === 'location') {
        var distance = 'DISTANCE(' + this.locationField + ', GEOLOCATION({!' + this.latLng.lat + '}, {!' + this.latLng.lng + '}), \'' + this.unit + '\')';
        whereClauses.push(distance + ' < ' + this.radius);
        orderByClauses.push(distance);
    }

    var result = 'FROM ' + this.sobject;

    if (whereClauses.length) {
        result += ' WHERE ' + whereClauses[0];

        for (var i = 1; i < whereClauses.length; i++) {
            result += ' AND ' + whereClauses[i];
        }
    }

    if (this.sortField) orderByClauses.push(this.sortField);

    if (orderByClauses.length) {
        result += ' ORDER BY ' + orderByClauses[0];

        for (var i = 1; i < orderByClauses.length; i++) {
            result += ', ' + orderByClauses[i];
        }

        result += ' ' + this.sortDirection;
    }

    result +=  ' LIMIT ' + this.numMarkers;

    return result;
};

/**
 * Returns an object that represents the center of a minimap.
 * @returns {object}
 */
OptionsAdapter.prototype.setCenterLatLngFields = function(center) {
    center.lat = '{!' + this.latLng.lat + '}';
    center.lng = '{!' + this.latLng.lng + '}';

    if (this.latLng.verifiedLat && this.latLng.verifiedLng) {
        center.verifiedLat = '{!' + this.latLng.verifiedLat + '}';
        center.verifiedLng = '{!' + this.latLng.verifiedLng + '}';

        center.verifiedLatField = this.latLng.verifiedLat;
        center.verifiedLngField = this.latLng.verifiedLng;
    }
};

/**
 * Returns an object that represents the marker JSON that the minimap uses to render markers.
 * @returns {object}
 */
OptionsAdapter.prototype.buildMarker = function(latLng) {
    return {
        color: this.marker.color,
        type: this.marker.type,
        imgURL: this.marker.imgURL,
        latField: latLng.lat,
        lngField: latLng.lng,
        verifiedLatField: latLng.verifiedLat,
        verifiedLngField: latLng.verifiedLng
    };
};

OptionsAdapter.prototype.isLegacyConfig = function(config) {
    return (typeof config.context.type === 'string' || (config.context.type && !config.layers.length));
};

OptionsAdapter.prototype.convertLegacyConfig = function(options) {
    var config = Object.assign({}, options.config),
        contextLayer,
        nearbyLayer;

    options.layers.forEach(function(layer) {
        if (layer.type === 'context') contextLayer = layer;
        if (layer.type === 'nearby') nearbyLayer = layer;
    });

    if (!contextLayer) throw 'Legacy config conversion was not successful.';

    // Populate context config
    config.context.type = (config.context.type === 'global' || !config.layers.length) ? 0 : 1;
    config.context.name = contextLayer.label;
    config.context.marker = contextLayer.marker;
    config.context.geoFieldType = contextLayer.geoFieldType;
    config.context.tooltips = contextLayer.fields;
    delete config.context.marker.latField;
    delete config.context.marker.lngField;

    // Popoulate nearby config (if applicable)
    if (nearbyLayer) {
        config.layers[0].type = 2;
        config.layers[0].name = nearbyLayer.label;
        config.layers[0].marker = nearbyLayer.marker;
        config.layers[0].geoFieldType = nearbyLayer.geoFieldType;
        config.layers[0].radius = nearbyLayer.radius;
        config.layers[0].unit = nearbyLayer.unit;
        config.layers[0].tooltips = nearbyLayer.fields;

        delete config.layers[0].marker.latField;
        delete config.layers[0].marker.lngField;
    }

    return config;
};

module.exports = OptionsAdapter;