<template>
    <fieldset class="slds-form--compound">
        <div class="slds-form-element__group">
            <div class="slds-form-element__row">
                <div class="slds-form-element slds-size--1-of-1">
                    <label class="slds-form-element__label">Tooltip Preview</label>
                    <div class="tooltip-preview-wrapper">
                        <div class="tooltip-preview-container">
                            <div class="tooltip-box">
                                <div class="tooltip-header">
                                    <h2 class="slds-text-heading--small" v-html="layer.metadata.nameField.label"></h2>
                                </div>
                                <div class="tooltip-body">
                                    <div v-for="n in numTooltips" class="slds-form--inline">
                                        <div class="slds-form-element">
                                            <label class="slds-form-element__label">Field:</label>
                                            <ma-select
                                                :options="layer.metadata.tooltipFields"
                                                :inModal="true"
                                                :selected.sync="layer.tooltips[n - 1]"
                                                keyString="api"
                                                valueString="label"
                                            ></ma-select>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <!-- Render Standard Marker -->
                            <img v-if="layer.marker.imgURL == null || layer.marker.imgURL == undefined || layer.marker.imgURL == ''" class="marker" style="" :src="svg(layer.marker.type, layer.marker.color)" />
                            <!-- Render Custom Marker -->
                            <img v-if="layer.marker.imgURL != ''" class="marker" style="" :src="sitePrefix+'/servlet/servlet.ImageServer?id='+layer.marker.imgURL+'&oid='+orgId" />

                        </div>
                    </div>
                </div>
            </div>
        </div>
    </fieldset>
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
                numTooltips: 3,
                sitePrefix: window.MASystem.MergeFields.SitePrefix,
                orgId: window.MASystem.MergeFields.Organization_Id
            }
        }
    };
</script>

<style scoped>
    img.marker {
        width: 20px;
        padding-top: 18px;
        margin: 0 auto;
        display: block;        
    }
</style>