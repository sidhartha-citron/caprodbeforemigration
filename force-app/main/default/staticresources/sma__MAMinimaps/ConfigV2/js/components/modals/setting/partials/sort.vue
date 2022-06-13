<template>
    <div class="wrapper">
        <fieldset class="slds-form--compound">
            <h2 class="slds-text-heading--small">{{ Labels.MA_Sort_Order }}</h2>
            <div class="slds-form-element__group">
                <div class="slds-form-element__row">
                    <div class="slds-form-element slds-size--1-of-2">
                        <label class="slds-form-element__label">{{ Labels.MA_Field }}</label>
                        <div class="slds-form-element__control">
                            <ma-select
                                :options="layer.metadata.sortFields"
                                :inModal="true"
                                :selected.sync="layer.sortField"
                                keyString="api"
                                valueString="label"
                            ></ma-select>
                        </div>
                    </div>

                    <div class="slds-form-element slds-size--1-of-2">
                        <label class="slds-form-element__label">{{ Labels.MA_Order_by }}</label>
                        <div class="slds-form-element__control">
                            <div class="slds-select_container">
                                <ma-select
                                    :options="dirOptions"
                                    :inModal="true"
                                    :selected.sync="layer.sortDirection"
                                ></ma-select>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </fieldset>
    </div>
</template>

<script>
    module.exports = {
        props: {
            layer: {
                type: Object,
                required: true
            }
        },
        data: function() {
            return {
                Labels: window.MASystem.Labels
            }
        },
        computed: {
            dirOptions: function () {
                return [
                    { key: 'ASC', value: this.Labels.MA_Ascending },
                    { key: 'DESC', value: this.Labels.MA_Descending }
                ];
            }
        }
    };
</script>

<style scoped>
    div.wrapper {
        margin-top: 8px;
    }

    .slds-scope h2 {
        margin-bottom: 6px;
    }
</style>