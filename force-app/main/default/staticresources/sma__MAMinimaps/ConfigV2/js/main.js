var Vue = require('vue').default,
    Vuex = require('vuex').default,
    App = require('./components/app.vue');

require('ma-lib/polyfills');

window.MA = window.MA || {};

window.MA.Bootstrap = function(_data) {
    // App-wide state management
    Vue.use(Vuex);

    Object.assign(_data, { customSettings: [], defaultSettings: [] });

    // Storing the bootstrap data
    // This is now accessible from any component using this.$store.state
    var store = new Vuex.Store({
        state: {
            data: _data
        }
    });

    var app = new Vue({
        el: '#main',
        store: store, // this provides the store to all child components (if any)
        render: function(createElement) {
            return createElement(
                App,
                { attrs: { class: 'lds slds-scope' } }
            );
        }
    });
};