<template>
    <ma-modal v-if="showModal" @close="close" :errorMsg.sync="errorMsg" :isLoading.sync="isLoading" title="Delete Setting">
        <p slot="content">
            Are you sure you want to delete the following setting? <strong>{{ setting.Name }}</strong>
        </p>

        <div slot="footer">
            <button @click="close" class="slds-button slds-button_neutral">Cancel</button>
            <button @click="deleteSetting" class="slds-button slds-button_brand">Delete</button>
        </div>
    </ma-modal>
</template>

<script>
    var bus = require('ma-lib/vue/bus'),
        RemoteAction = require('ma-lib/remote-action');

    module.exports = {
        props: {
            doShow: Boolean,
            setting: Object
        },
        components: {
            'ma-modal': require('ma-lib/vue/components/ma-modal.vue')
        },
        data: function() {
            return {
                isLoading: false,
                showModal: this.doShow,
                errorMsg: ''
            }
        },
        methods: {
            close: function() {
                this.showModal = false;
                this.$emit('update:doShow', false);
            },
            deleteSetting: function() {
                this.isLoading = true;

                var self = this;
                new RemoteAction('sma.RemoteActions', 'deleteMiniMapSetting')
                    .setErrorHandler(this.handleRemoteActionError.bind(this))
                    .invoke([ this.setting.Id ], function(response) {
                        try {
                            if (response.deleteResult && response.deleteResult.success) {
                                var indexToDelete,
                                    customSettings = self.$store.state.data.customSettings;

                                for (var idx in customSettings) {
                                    var setting = customSettings[idx];
                                    if (setting.record && setting.record.Id === self.setting.Id) {
                                        indexToDelete = idx;
                                        break;
                                    }
                                }

                                customSettings.splice(indexToDelete, 1);

                                self.close();
                            } else {
                                self.erroMsg = response.error;
                            }
                        } catch (ex) {
                            self.errorMsg = ex.stack;
                            console.error(ex);
                        }

                        self.isLoading = false;
                    }
                );
            },
            handleRemoteActionError: function(result, event) {
                this.isLoading = false;
                this.errorMsg = event.message;
            }
        }
    };
</script>