<script>
    var Vue = require('vue').default,
        Promise = require('es6-promise-polyfill').Promise,
        bus = require('ma-lib/vue/bus'),
        validators = require('vuelidate/lib/validators'),
        RemoteAction = require('ma-lib/remote-action')

    // Custom merge strategy for layer validations
    Vue.config.optionMergeStrategies.validations = function(toVal, fromVal) {
        if (!toVal) return fromVal;
        if (!fromVal) return toVal;

        // If any of our merge items are functions then we need to evaluate each as a function
        // and merge the results.
        if (typeof toVal === 'function' || typeof fromVal === 'function') {
            return function() {
                var _toVal = toVal,
                    _fromVal = fromVal;

                if (typeof toVal === 'function') {
                    _toVal = toVal.call(this);
                }

                if (typeof fromVal === 'function') {
                    _fromVal = fromVal.call(this);
                }

                return Vue.config.optionMergeStrategies.computed(_toVal, _fromVal);
            }
        } else {
            return Vue.config.optionMergeStrategies.computed(toVal, fromVal);
        }
    };

    module.exports = {
        data: function() {
            return {
                type: '',
                name: '',
                sobject: '',
                marker: {
                    type: 'pin',
                    color: '#f44336',
                    imgURL: '',
                },
                geoFieldType: 'location',
                locationField: '',
                latField: '',
                lngField: '',
                verifiedGeoFieldType: 'verified-location',
                verifiedLocationField: '',
                verifiedLatField: '',
                verifiedLngField: '',
                center: {
                    lat: '',
                    lng: '',
                    type: 'static'
                },
                radius: null,
                unit: 'mi',
                numMarkers: 10,
                zoom: 13,
                queryFilters: [],
                queryFilterComponents: [],
                sortField: '',
                sortDirection: '',
                tooltips: [],
                metadata: {
                    nameField: {},
                    doubleFields: [],
                    sortFields: [],
                    filterFields: [],
                    locationFields: [],
                    tooltipFields: []
                }
            }
        },
        components: {
            'common': require('../partials/common.vue'),
            'staticLatLng': require('../partials/static-lat-lng.vue'),
            'zoom': require('../partials/zoom.vue'),
            'numMarkers': require('../partials/num-markers.vue'),
            'queryFilter': require('../partials/query-filter.vue'),
            'sort': require('../partials/sort.vue'),
            'tooltips': require('../partials/tooltips.vue')
        },
        computed: {
            isContextLayer: function() {
                return this.type === this.$store.state.data.layer.types.GLOBAL || this.type === this.$store.state.data.layer.types.THIS;
            },
            isNearbyLayer: function() {
                return this.type === this.$store.state.data.layer.types.NEARBY;
            },
            disableAddFilterBtn: function() {
                return this.queryFilterComponents.length === 3;
            }
        },
        watch: {
            geoFieldType: function() {
                this.$v.locationField.$reset();
                this.$v.latField.$reset();
                this.$v.lngField.$reset();
            }
        },
        validations: function () {
            var base = {
                name: {
                    required: validators.required,
                    maxLength: validators.maxLength(50)
                },
                sobject: { required: validators.required },
                numMarkers: { required: validators.required },
                zoom: { required: validators.required },
                unit: { required: validators.required },
                locationField: {},
                latField: {},
                lngField: {}
            };

            if (this.$data.geoFieldType === 'location') {
                base.locationField = { required: validators.required };
            } else {
                base.latField = { required: validators.required };
                base.lngField = { required: validators.required };
            }

            return base;
        },
        methods: {
            aggregateData: function() {
                var result = this.$data,
                    self = this;

                // Clear any existing query filters that may be on the layer object. This may occur
                // if we have an error during the save action and the user attempts a second save.
                result.queryFilters.length = 0;

                this.queryFilterComponents.forEach(function(queryFilter){
                    var ref = self.$refs[queryFilter.id];
                    if (!ref.length) return;

                    var cmp = ref[0],
                        toAdd = {};

                    for (var prop in cmp.$data) {
                        if (cmp.$data.hasOwnProperty(prop)) {
                            toAdd[prop] = cmp.$data[prop];
                        }
                    }

                    result.queryFilters.push(toAdd);
                });

                return result;
            },
            blur: function(event) {
                event.target.blur();
            },
            onSObjectChange: function(clickSelected) {
                if (clickSelected) this.resetMetadataDependentFields();
                if (!this.sobject) return;

                this.loadFields(this.sobject);
            },
            loadFields: function(sobject) {
                var self = this;
                return new Promise(function(resolve, reject) {
                    bus.$emit('increment-callout');

                    new RemoteAction('sma.RemoteActions', 'getSObjectInfoBySObjectName')
                        .setErrorHandler(self.handleRemoteActionError.bind(self))
                        .invoke([ sobject ], function(result) {
                            Object.assign(self.metadata, result);
                            self.nameField = result.nameField;

                            bus.$emit('decrement-callout');
                            resolve();
                        }
                    );
                });
            },
            loadFilters: function() {
                var self = this;
                this.queryFilters.forEach(function(queryFilter) {
                    self.queryFilterComponents.push({ id: self.getGUID(), init: queryFilter });
                });
            },
            resetMetadataDependentFields: function() {
                this.geoFieldType = 'location';
                this.locationField = '';
                this.latField = '';
                this.lngField = '';
            },
            addFilter: function() {
                this.queryFilterComponents.push({ id: this.getGUID() });
            },
            removeFilter: function(index) {
                this.queryFilterComponents.splice(index, 1);
            },
            handleRemoteActionError: function(result, event) {
                bus.$emit('decrement-callout');
                bus.$emit('set-error', event.message);
            }
        }
    };
</script>