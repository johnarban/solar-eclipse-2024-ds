<template>
  <!-- v-dialog. containing a card with a 3 row, 2 column layouy -->
  <v-dialog 
    v-model="showValue" 
    max-width="800px"
    close-on-back
    >
    <v-card>
      <v-card-title>
        <span class="headline">Advanced Weather View for {{ location.latitudeDeg }} {{ location.longitudeDeg }}</span>
      </v-card-title>
      <v-card-text>
        <span class="text-bf bg-red text-white"> NOT USING ANY DATA </span>
        <v-row>
          <v-col cols="12" md="6">
            <v-select
              v-model="selectedYear"
              :items="selectedYearRange"
              label="Year"
            ></v-select>
          </v-col>
          <v-col cols="12" md="6">
            <v-select
              v-model="selectedStat"
              :items="['mean', 'max', 'min']"
              label="Statistic"
            ></v-select>
          </v-col>
        </v-row>
        <v-row class="histogram-container">
          <cloud-histogram
            id="data2"
            :histogram-data="cloudDataHistogram"
            :labels="skyCoverCodes"
            :colors="colorMap"
            :title="`Cloud Conditions for ${selectedYear}`"
            />
        </v-row>

      </v-card-text>
      <v-card-actions style="border-top: 1px solid white; margin-top: 10px;">
        <v-spacer></v-spacer>
        <v-btn @click="close()">Close</v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>

<script lang="ts"> // Options API
import { defineComponent, PropType } from 'vue';
import CloudHistogram from './CloudHistogram.vue';

type CityLocation = {
  longitudeDeg: number;
  latitudeDeg: number;
};



const cityBoston: CityLocation = {
  latitudeDeg: 42.3601,
  longitudeDeg: 71.0589,
};

function randomData(n: number): number[] {
  const data = Array.from({ length: n }, () => Math.round((Math.random() * 100)));
  const sum = data.reduce((a, b) => a + b, 0);
  return data.map((d) => Math.round((d / sum) * 100));
}

// https://colorbrewer2.org/#type=sequential&scheme=YlGnBu&n=6
const _colorMap = ['#ffffcc','#c7e9b4','#7fcdbb','#41b6c4','#2c7fb8','#253494'];

export default defineComponent({
  name: 'AdvancedWeatherView',
  
  components: { 'cloud-histogram': CloudHistogram },
  
  emits: ['update:modelValue','close'],
  
  props: {
    modelValue: {
      type: Boolean,
      default: true,
      required: false,
    },
    
    defaultLocation: {
      type: Object as PropType<CityLocation> | undefined,
      default: cityBoston,
      required: false,
    }
  },
  
  data() {
    return {
      location: this.defaultLocation,
      selectedYear: 2021,
      selectedYearRange: [2001, 2022],
      selectedStat: 'mean',
      cloudDataHistogram: randomData(6), // overcast, mostlyCloudy, partlyCloudy, fewClouds, clear
      // https://www.weather.gov/media/notification/dir/AFM_Specifications.pdf
      skyCoverCodes: ['Clear', 'Mostly Clear', 'Parly Cloudy', 'Mostly Cloudy', 'Considerably Cloudy', 'Overcast'],
      skyCoverCodeRanges: {
        'clear': [0, 5],
        'mostlyClear': [5, 25],
        'parlyCloudy': [25, 50],
        'mostlyCloudy': [50, 69],
        'considerablyCloudy': [69, 87],
        'overcast': [87, 100],
      },
      colorMap: _colorMap,
    };
  },
  
  computed: {
    
    showValue: {
      get() {
        return this.modelValue;
      },
      set(value: boolean) {
        console.log('AdvancedWeatherView showValue set to', value);
        this.$emit('update:modelValue', value);
      },
    }
    
  },
  
  mounted() {
    console.log('Advanced Weather View mounted');
  },
  
  methods: {
    close() {
      this.showValue = false;
    },
  },
  
  watch: {
    show(value: boolean) {
      console.log('AdvancedWeatherView show watch', value);
    },
  },
  
  
});
</script>


<style lang="less">

.histogram-container {
  display: flex;
  justify-content: center;
  align-items: center;
  height: 300px;
}
</style>
