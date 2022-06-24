<template>
    <ma-modal id="mm-modal" v-if="showModal" @close="reset" :errorMsg.sync="errorMsg" :isLoading.sync="isLoading" :title="title">
        <div slot="content">
            <div class="mm-name-container">
                <fieldset class="slds-form--compound">
                    <div class="slds-form-element__group">
                        <div class="slds-form-element__row">
                            <div class="slds-form-element slds-size_1-of-2">
                                <label class="slds-form-element__label"><abbr class="slds-required" title="required">*</abbr> Nearby Map Name</label>
                                <div class="slds-form-element__control">
                                    <ma-input
                                        v-model="setting.Name"
                                        @input="$v.setting.Name.$touch"
                                        :isInvalid="$v.setting.Name.$error"
                                        placeholder="Name your Nearby map..."
                                    ></ma-input>
                                    <div v-show="$v.$dirty && !$v.setting.Name.required" class="slds-form-element__error">This field is required.</div>
                                    <div v-show="!$v.setting.Name.maxLength" class="slds-form-element__error">Max length of 50.</div>
                                </div>
                            </div>
                        </div>
                    </div>
                </fieldset>
            </div>

            <createWizard v-if="showCreateWizard" @selected="processSelected"></createWizard>
            <component v-for="layer in layers" :is="layer.type" :key="layer.id" :ref="layer.id"></component>
        </div>

        <div slot="footer">
            <button @click="reset" class="slds-button slds-button_neutral">Cancel</button>
            <button @click="save" class="slds-button slds-button_brand">Save</button>
        </div>
    </ma-modal>
</template>

<script>
    var Vue = require('vue').default,
        bus = require('ma-lib/vue/bus'),
        RemoteAction = require('ma-lib/remote-action'),
        validators = require('vuelidate/lib/validators'),
        OptionsAdapter = require('../../../utils/options-adapter'),
        Global = require('./layers/global.vue'),
        This = require('./layers/this.vue'),
        Nearby = require('./layers/nearby.vue');

    module.exports = {
        data: function() {
            return {
                showModal: false,
                errorMsg: '',
                isLoading: false,
                callouts: 0,
                isEdit: false,
                setting: {
                    Id: null,
                    Name: '',
                    maps__Name__c: '',
                    maps__Active__c: true,
                    maps__Is_Custom__c: true,
                    maps__Options__c: '',
                    maps__Object__c: ''
                },
                layers: []
            }
        },
        computed: {
            title: function() {
                return (this.isEdit) ? 'Edit Map' : 'Create Map';
            },
            showCreateWizard: function() {
                return !this.isEdit;
            }
        },
        components: {
            'ma-modal-toast': require('ma-lib/vue/components/ma-modal-toast.vue'),
            'ma-modal': require('ma-lib/vue/components/ma-modal.vue'),
            'createWizard': require('./partials/create-wizard.vue')
        },
        validations: {
            setting: {
                Name: {
                    required: validators.required,
                    maxLength: validators.maxLength(50)
                }
            }
        },
        watch: {
            callouts: function(callouts) {
                if (callouts < 0) this.callouts = 0;

                this.isLoading = callouts > 0;
            },
            "setting.Name": function(val) {
                this.setting.maps__Name__c = val;
            }
        },
        created: function() {
            var self = this;

            bus.$on('show-setting-modal', function(setting) {
                self.showModal = true;

                if (setting) {
                    Object.assign(self.$data.setting, setting);
                    self.isEdit = true;
                    self.init(setting);
                }
            });

            bus.$on('increment-callout', function() {
                self.callouts++;
            });

            bus.$on('decrement-callout', function() {
                self.callouts--;
            });

            bus.$on('set-error', function(msg) {
                self.errorMsg = msg;
            });
        },
        methods: {
            processSelected: function(type) {
                this.layers.length = 0;
                this.type = type;

                if (type === this.$store.state.data.layer.types.GLOBAL) {
                    this.layers.push({ id: this.getGUID(), type: Global });
                } else if (type === this.$store.state.data.layer.types.THIS) {
                    this.layers.push({ id: this.getGUID(), type: This });
                    this.layers.push({ id: this.getGUID(), type: Nearby });
                }
            },
            init: function(setting) {
                if (!setting || !setting.options || !setting.options.config || !setting.options.config.context) {
                    this.errorMsg = 'Error found in settings data.';
                    return;
                }

                this.setting = setting.record;

                var isLegacySetting = OptionsAdapter.prototype.isLegacyConfig(setting.options.config);
                
                if (isLegacySetting) {
                    setting.options.config = OptionsAdapter.prototype.convertLegacyConfig(setting.options);
                }

                var config = setting.options.config,
                    types = this.$store.state.data.layer.types,
                    self = this,
                    contextCmp;

                if (config.context.type === types.GLOBAL) contextCmp = Global;
                else if (config.context.type === types.THIS) contextCmp = This;

                this.layers.push({ id: this.getGUID(), type: contextCmp, config: config.context });

                config.layers.forEach(function(layer) {
                    if (layer.type === types.NEARBY) {
                        self.layers.push({ id: self.getGUID(), type: Nearby, config: layer });
                    }
                });

                Vue.nextTick(function() {
                    self.layers.forEach(function(layer) {
                        var cmp = self.$refs[layer.id][0];
                        Object.assign(cmp.$data, layer.config);
                        cmp.loadFields(layer.config.sobject)
                            .then(function() {
                                cmp.loadFilters();
                                cmp.$v.$touch();
                            });
                    })
                });
            },
            reset: function() {
                // Reset the comopnent data to the original state
                Object.assign(this.$data, this.$options.data.apply(this));
                this.$v.$reset();
            },
            save: function() {
                try {
                    var isInvalid = false;

                    function runValidators($refs) {
                        if (!Object.keys($refs).length) return;

                        for (var name in $refs) {
                            var cmp = $refs[name];
                            if (!cmp.length || !cmp[0].$v) continue;
                            runValidators(cmp[0].$refs);

                            cmp[0].$v.$touch();
                            if (cmp[0].$v.$invalid) isInvalid = true;
                        }
                    }

                    runValidators(this.$refs);

                    this.$v.$touch();
                    if (this.$v.$invalid) isInvalid = true;

                    if (isInvalid) {
                        this.errorMsg = 'Please fix validation issues.';
                        return;
                    }

                    var adapter = new OptionsAdapter(),
                        contextSObject;

                    for (var name in this.$refs) {
                        var cmps = this.$refs[name];
                        if (!cmps.length) continue;

                        var layer = cmps[0],
                            data = layer.aggregateData();

                        if (layer.isContextLayer) {
                            adapter.addContext(data);
                            this.setting.maps__Object__c = data.sobject;
                        }

                        if (layer.isNearbyLayer) adapter.addNearby(data);
                    }

                    var options = adapter.toMiniMapForm();
                    this.setting.maps__Options__c = JSON.stringify(options).toString();

                    this.callouts++;
                    var self = this;
                    new RemoteAction('maps.RemoteActions', 'saveMiniMapSetting')
                        .setErrorHandler(this.handleRemoteActionError.bind(this))
                        .invoke([ JSON.stringify(this.setting) ], function(response) {
                            try {
                                if (response.error) {
                                    self.errorMsg = response.error;
                                    self.callouts--;
                                } else {
                                    bus.$emit('refresh-custom-settings');
                                    self.reset();
                                }
                            } catch (ex) {
                                self.errorMsg = ex.stack;
                                self.callouts = 0;
                                console.error(ex);
                            }
                        }
                    );
                } catch (ex) {
                    this.errorMsg = ex.stack;
                    this.callouts = 0;
                    console.error(ex);
                }
            },
            handleRemoteActionError: function(result, event) {
                this.callouts--;
                this.errorMsg = event.message;
            }
        }
    };
</script>

<style scoped>
    .ma-active-rule {
         margin-top: 25px;
    }
</style>