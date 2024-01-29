<script lang ="ts">
import { defineComponent } from "vue";
import { VIcon } from "vuetify/components/VIcon";
// import { VTooltip } from "vuetify/components/VTooltip";

export default defineComponent({
  name: 'CloudCover',
  
  components: {
    'v-icon':VIcon,
    // 'v-tooltip':VTooltip
  },
  
  props: {
    cloudCover: {
      type: Number || null,
      required: true,
      default: null
    }
  },
  
  
  computed: {
    cloudCoverFracToLabel() {
      console.log(this.cloudCover);
      if (this.cloudCover !== null) {
        return `Historical Cloud Cover: ${(this.cloudCover * 100).toFixed(0)}%`;
      }
      return 'No data';
    },
    
    cloudIcon() {
    
      if (this.cloudCover == null) {
        return 'mdi-cloud-cancel';
      } 
      else if (this.cloudCover < .25) {
        return 'mdi-weather-sunny';
      }
      else if (this.cloudCover < .5) {
        return 'mdi-weather-partly-cloudy';
      } 
      else if (this.cloudCover < 0.9) {
        return 'mdi-weather-cloudy';
      } 
      else {
        return 'mdi-clouds';
      } 
    }
  },

  
});


</script>


<template>
  <!-- <v-chip 
    :prepend-icon="cloudIcon"
    variant="outlined"
    size="small"
    elevation="2"
    :text="cloudCoverFracToLabel"
  > </v-chip> -->
  <div class="cloud-cover-container my-2 p">
    <div> 
      </div>
    <v-icon
      size="35"
    >{{ cloudIcon }}</v-icon>
    <span class="cloud-cover-label pl-2">{{ cloudCoverFracToLabel }}</span>
  </div>
</template>


<style>

.cloud-cover-container {
  display: flex;
  height: 100%;
  flex-direction: row;
  align-items: center;
  justify-content: center;
  outline: 1px solid var(--accent-color);
}

.cloud-cover-label {
  font-size: calc(1.5 * var(--default-font-size));
  /* no text wrapping */
  white-space: nowrap;
}

</style>