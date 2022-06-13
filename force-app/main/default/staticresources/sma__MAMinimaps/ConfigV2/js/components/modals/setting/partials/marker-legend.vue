<template>
    <div class="slds-form-element slds-size--1-of-2">
        <label class="slds-form-element__label">{{ Labels.MA_Marker }}</label>
        <div ref="selection" class="slds-select" v-if="!customMarkerSet && standardMarkers" @click="showStandardSelection">
            <img style="width: 18px;" :src="svg(marker.type, marker.color)" />
        </div>

        <div v-if="customMarkerSet || !standardMarkers" v-on-click-outside="doHide"> 
            <div class="slds-form-element__control">
                <ma-select
                    :options="customMarkers"
                    :inModal="true"
                    :selected.sync="marker.imgURL"
                    :default="marker.imgURL"
                    keyString="itemValue"
                    valueString="itemLabel"
                ></ma-select>
                </div>
            <div style='font-size: 8px; margin-top: 6px;'>**{{ Labels.MA_Upload_Images }} <a :href="'/' + documentsFolderId" target='_blank'>MapAnything Documents</a></div>
        </div>

        <div class='location-markertype-selector' style="display: inline-block;">
            <img class='location-markertype-selector-color' :src="Images.marker_type_selector" @click="showStandardSelection(marker)"/>
            <img class='location-markertype-selector-image' :src="Images.custom_marker_selector" @click="showCustomSelection"/>
        </div>

        <div v-if="showStandardMarkerOptions" v-on-click-outside="doHide" class="no-icon-dropdown">
            <div class="slds-grid">
                <div class="slds-col marker-type-container">
                    <fieldset class="slds-form-element">
                        <div class="slds-form-element__control">
                            <span class="slds-radio">
                                <input type="radio" id="radioPin" value="pin" v-model="marker.type" />
                                <label class="slds-radio__label" for="radioPin">
                                    <span class="slds-radio--faux"></span>
                                    <img style="width: 18px;" :src="svg('pin', marker.color)" />
                                </label>
                            </span>
                            <span class="slds-radio">
                                <input type="radio" id="radioCircle" value="circle" v-model="marker.type" />
                                <label class="slds-radio__label" for="radioCircle">
                                    <span class="slds-radio--faux"></span>
                                    <img style="width: 18px;" :src="svg('circle', marker.color)" />
                                </label>
                            </span>
                            <span class="slds-radio">
                                <input type="radio" id="radioTriangle" value="triangle" v-model="marker.type" />
                                <label class="slds-radio__label" for="radioTriangle">
                                    <span class="slds-radio--faux"></span>
                                    <img style="width: 18px;" :src="svg('triangle', marker.color)" />
                                </label>
                            </span>
                            <span class="slds-radio">
                                <input type="radio" id="radioSquare" value="square" v-model="marker.type" />
                                <label class="slds-radio__label" for="radioSquare">
                                    <span class="slds-radio--faux"></span>
                                    <img style="width: 18px;" :src="svg('square', marker.color)" />
                                </label>
                            </span>
                        </div>
                    </fieldset>
                </div>

                <div class="marker-color-container">
                    <div class="slds-col">
                        <div class="marker-legend-color" id="markerColorRed" @click="marker.color = '#f44336'"></div>
                        <div class="marker-legend-color" id="markerColorBlue" @click="marker.color = '#2196f3'"></div>
                        <div class="marker-legend-color" id="markerColorWhite" @click="marker.color = '#fff'"></div>
                    </div>
                    <div class="slds-col">
                        <div class="marker-legend-color" id="markerColorOrange" @click="marker.color = '#ff9800'"></div>
                        <div class="marker-legend-color" id="markerColorPurple" @click="marker.color = '#673ab7'"></div>
                        <div class="marker-legend-color" id="markerColorBlack" @click="marker.color = '#000'"></div>
                    </div>
                    <div class="slds-col">
                        <div class="marker-legend-color" id="markerColorYellow" @click="marker.color = '#ffeb3b'"></div>
                        <div class="marker-legend-color" id="markerColorBrown" @click="marker.color = '#795548'"></div>
                    </div>
                    <div class="slds-col">
                        <div class="marker-legend-color" id="markerColorGreen" @click="marker.color = '#4caf50'"></div>
                        <div class="marker-legend-color" id="markerColorGray" @click="marker.color = '#9e9e9e'"></div>
                    </div>
                </div>
            </div>
        </div>
    </div>
</template>

<script>
    module.exports = {
        props: {
            marker: {
                type: Object,
                required: true
            }
        },
        mixins: [ require('vue-on-click-outside').mixin ],
        data: function() {
            return {
                standardMarkers: true,
                showStandardMarkerOptions: false,
                showCustomMarkerOptions: false,
                Labels: window.MASystem.Labels,
                Images: window.MASystem.Images,
                customMarkers: window.MASystem.MergeFields.MA_DocFolder_Images,
                documentsFolderId: window.MASystem.MergeFields.documentsFolderId
            }
        },
         computed: {
            customMarkerSet: function() {
                return this.marker.imgURL != null && this.marker.imgURL != '';
            }
        },
        methods: {
            doHide: function(event) {
                if (event.target == this.$refs.selection) return;

                this.showStandardMarkerOptions = false;
            },
            showStandardSelection: function(marker) {
                this.standardMarkers = true;
                this.showStandardMarkerOptions = true;
                this.showCustomMarkerOptions = false;
                marker.imgURL = '';
            },
            showCustomSelection: function() {
                this.standardMarkers = false;
                this.showStandardMarkerOptions = false;
                this.showCustomMarkerOptions = true;
              }
        }
    };
</script>