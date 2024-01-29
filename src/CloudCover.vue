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
      if (this.cloudCover) {
        return `Cloud Cover: ${(this.cloudCover * 100).toFixed(0)}%`;
      }
      return 'Lat/Lon out of bounds';
    },
    
    cloudIcon() {
      if (this.cloudCover < 0.3) {
        return 'mdi-weather-sunny';
      } else if (this.cloudCover < .3) {
        return 'mdi-weather-partly-cloudy';
      } else if (this.cloudCover < .6) {
        return 'mdi-weather-cloudy';
      } else {
        return 'mdi-weather-cloudy-alert';
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
  <div class="cloud-cover-container">
    <div> 
      </div>
    <v-icon
      size="48"
    >{{ cloudIcon }}</v-icon>
    <span class="cloud-cover-label">{{ cloudCoverFracToLabel }}</span>
  </div>
</template>


<style>

.cloud-cover-container {
  display: flex;
  height: 100%;
  flex-direction: row;
  align-items: center;
  justify-content: center;
  outline: 1px solid yellow;
}

.cloud-cover-label {
  font-size: 24px;
  /* no text wrapping */
  white-space: nowrap;
}

</style>