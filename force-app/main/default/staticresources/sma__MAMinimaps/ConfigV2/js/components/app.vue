<template>
    <div>
        <div class="slds-brand-band slds-brand-band_cover slds-brand-band_medium slds-p-around_medium">
            <div class="flex-column full-height">
                <div id="ma-detached-tooltips"></div>

                <ma-admin-header title="Nearby Map">
                    <div slot="content" class="slds-media__figure slds-media__figure--reverse">
                        <button @click="create" class="slds-button slds-button--brand">{{ Labels.MA_Create_New }}</button>
                    </div>
                </ma-admin-header>

                <div class="flex-grow-1 flex-row">
                    <div class="flex-shrink-0" ref="navigation"></div>
                    <div class="flex-grow-1">
                        <div class="minimap-config-body">
                            <cards title="Custom Nearby Maps" :settings="customSettings" :info="customCardInfo" :doShowCreateCard="true" ></cards>
                        </div>

                        <div class="minimap-config-body">
                            <cards title="Default Nearby Maps" :settings="defaultSettings" :info="defaultCardInfo"></cards>
                        </div>
                    </div>
                </div>
            </div>

            <ma-spinner v-show="isLoading"></ma-spinner>
            <ma-backdrop></ma-backdrop>
            <settingModal></settingModal>
        </div>
    </div>
</template>

<script>
    var Vue = require('vue').default,
        Vuelidate = require('vuelidate'),
        MarkerBuilder = require('ma-lib/marker-builder/marker-builder'),
        RemoteAction = require('ma-lib/remote-action'),
        bus = require('ma-lib/vue/bus');

    // Input validator plugin
    Vue.use(Vuelidate.default);

    // Global mixin available to all components
    Vue.mixin({
        methods: {
            svg: function(_type, _color) {
                return new MarkerBuilder({
                    type: _type,
                    color: _color
                }).getSVG();
            },
            getGUID: function() {
                function s4() {
                    return Math.floor((1 + Math.random()) * 0x10000)
                        .toString(16)
                        .substring(1);
                }

                return s4() + s4() + '-' + s4() + '-' + s4() + '-' + s4() + '-' + s4() + s4() + s4();
            }
        }
    });

    // global component
    Vue.component('ma-input', require('ma-lib/vue/components/ma-input.vue'));
    Vue.component('ma-select', require('ma-lib/vue/components/ma-select.vue'));
    Vue.component('ma-spinner', require('ma-lib/vue/components/ma-spinner.vue'));
    Vue.component('settingModal', require('./modals/setting/setting.vue'));
    Vue.component('datepicker', require('vuejs-datepicker').default);

    module.exports = {
        name: 'app',
        mixins: [
            require('ma-lib/vue/mixins/decodeHtml')
        ],
        data: function() {
            return {
                isLoading: false,
                Labels: window.MASystem.Labels,
                customCardInfo: 'Custom Nearby maps are maps that you can create, edit, and fully customize. Use custom Nearby maps to show nearby records on standard or custom objects with tooltips, filters, and colors of your choosing.',
                defaultCardInfo: 'Default Nearby maps are standard in MapAnything. You cannot edit or delete these Nearby maps. They are the standard Nearby maps for your MapAnything users to view nearby records.'
            }
        },
        computed: {
            customSettings: function() {
                return this.$store.state.data.customSettings;
            },
            defaultSettings: function() {
                return this.$store.state.data.defaultSettings;
            }
        },
        watch: {

        },
        created: function() {
            bus.$on('refresh-custom-settings', this.getCustomSettings);

            this.$store.state.data.layer = {
                types: {
                    GLOBAL: 0,
                    THIS: 1,
                    NEARBY: 2
                }
            }

            this.getCustomSettings(customOnly = false);
        },
        mounted: function() {
            this.mountNavigationBar();
        },
        components: {
            'ma-admin-header': require('ma-lib/vue/components/ma-admin-header.vue'),
            'cards': require('./cards.vue'),
            'ma-backdrop': require('ma-lib/vue/components/ma-backdrop.vue')
        },
        methods: {
            create: function() {
                bus.$emit('show-setting-modal');
            },
            mountNavigationBar: function() {
                var markup = document.getElementById('navigation-markup').innerHTML;
                this.$refs.navigation.innerHTML = markup;
            },
            getCustomSettings: function(customOnly) {
                if (typeof customOnly === 'undefined') customOnly = true;

                this.isLoading = true;
                var self = this;
                new RemoteAction('sma.RemoteActions', 'getMiniMapSettings')
                    .setErrorHandler(this.handleRemoteActionError.bind(this))
                    .invoke([ customOnly ], function(result) {
                        var customStore = self.$store.state.data.customSettings,
                            defaultStore = self.$store.state.data.defaultSettings;

                        customStore.length = 0;
                        if (!customOnly) defaultStore.length = 0;

                        for (var i = 0; i < result.length; i++) {
                            var setting = result[i];
                                isCustom = setting.record.sma__Is_Custom__c == true;

                            if (isCustom) {
                                var foo = self.decodeObj(setting)
                                customStore.push(foo);
                            }
                            else if (!customOnly) defaultStore.push(setting);
                        }

                        self.isLoading = false;
                    }
                );
            },
            decodeObj: function(obj) {
                for (var prop in obj) {
                    if (obj.hasOwnProperty(prop)) {
                        if (Number.isInteger(obj[prop])) continue;

                        if (typeof obj[prop] === 'object') {
                            if (Array.isArray(obj[prop])) {
                                for (var i = 0; i < obj[prop].length; i++) {
                                    this.decodeObj(obj[prop][i]);
                                }
                            } else {
                                this.decodeObj(obj[prop]);
                            }

                            continue;
                        }

                        obj[prop] = this.decodeHtml(obj[prop]);
                    }
                }

                return obj;
            },
            handleRemoteActionError: function(result, event) {
                this.isLoading = false;
                console.error(event.message);
            }
        }
    };
</script>