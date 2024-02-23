<template>
  <!-- v-dialog. containing a card with a 3 row, 2 column layouy -->
  <v-dialog 
    v-model="showValue" 
    close-on-back
    >
    <v-card id="advanced-weather-view">
      <v-card-title>
        <span class="headline">Advanced Weather View for {{ location.latitudeDeg }} {{ location.longitudeDeg }}</span>
      </v-card-title>
      
      <v-card-text>
        <span class="text-bf bg-red text-white"> NOT USING ANY DATA </span>
        <!-- dataloading progress widget -->
        <v-row>
          <v-col cols="12">
            <v-progress-linear
              v-model="dataLoadingProgress"
              :striped="dataLoadingProgress < 100"
              color="indigo-lighten-2"
              height="25"
              rounded
            >
            <template v-slot:default="{ value }">
                <strong>Loading Data ({{ Math.ceil(value) }}%)</strong>
            </template>
          </v-progress-linear>
          </v-col>
        </v-row>
        
        <!-- top row -->
        <v-row class="bg-blue-lighten-3">
          
          <v-col cols="6">
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
          </v-col>
          
          <v-col cols="6">
            <v-container aspect-ratio="1">
            <location-selector
              class="elevation-5"
              v-model="location"
              label="Location"
              :place-circle-options="placeCircleOptions"
              :selected-circle-options="selectedCircleOptions"
              />
            </v-container>
          </v-col>
          
        </v-row>
        
        
        <v-btn @click="randomData()">Random Data</v-btn>
        
        <!-- j -->
        <v-row class="bg-red-lighten-3">
          <v-col cols="6" class="graph-col">
          <bar-chart
            id="cloud-histogram"
            class="elevation-5"
            :histogram-data="cloudDataHistogram"
            :labels="skyCoverCodes"
            :colors="colorMap"
            :title="`Cloud Conditions for ${selectedYear}`"
            />
          </v-col>
          <v-col cols="6" class="graph-col">
          <line-chart
            class="elevation-5"
            :scatter-data="scatterData"
            show-line
            show-scatter
            />
          </v-col>
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
import BarChart from './BarChart.vue';
import LineChart from './LineChart.vue';
import LocationSelector from './LocationSelector.vue';

type CityLocation = {
  longitudeDeg: number;
  latitudeDeg: number;
};

const cityBoston: CityLocation = {
  latitudeDeg: 42.3601,
  longitudeDeg: -71.0589,
};

function randomData(n: number): number[] {
  const data = Array.from({ length: n }, () => Math.round((Math.random() * 100)));
  const sum = data.reduce((a, b) => a + b, 0);
  return data.map((d) => Math.round((d / sum) * 140));
}

function randomArray(n: number) {
  // create an array of n objects with x and y properties
  return Array.from({ length: n }, () => (
    { 
      x: Math.random() * 100, 
      y: Math.random() * 100 
    }
  ));
}



type ScatterData = { x: number;y: number;}[];

// https://colorbrewer2.org/#type=sequential&scheme=YlGnBu&n=6
const _colorMap = ['#ffffcc','#c7e9b4','#7fcdbb','#41b6c4','#2c7fb8','#253494'];

export default defineComponent({
  name: 'AdvancedWeatherView',
  
  components: { 
    'bar-chart': BarChart,
    'line-chart': LineChart,
    'location-selector': LocationSelector,
  },
  
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
      dataLoadingProgress: 0,
      selectedYear: 2021,
      selectedYearRange: [2001, 2022],
      selectedStat: 'mean',
      cloudDataHistogram: randomData(6), // overcast, mostlyCloudy, partlyCloudy, fewClouds, clear
      scatterData: randomArray(100) as ScatterData,
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
      mapOptions: {
        templateUrl: "https://basemap.nationalmap.gov/arcgis/rest/services/USGSImageryTopo/MapServer/tile/{z}/{y}/{x}",
        attribution: 'Tiles courtesy of the <a href="https://usgs.gov/">U.S. Geological Survey</a>',
      },
      placeCircleOptions: {
        color: "#FF0000",
        fillColor: "#FF000088",
        fillOpacity: 0.7,
        radius: 5 
      },
      selectedCircleOptions: {
        color: "#0000FF",
        fillColor: "#0000FF88",
        fillOpacity: 0.7,
        radius: 5 
      },
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
    // create a time to simulate data loading
    const interval = setInterval(() => {
      this.dataLoadingProgress += 10;
      if (this.dataLoadingProgress >= 100) {
        clearInterval(interval);
      }
    }, 1000);
  },
  
  methods: {
    close() {
      this.showValue = false;
    },
    
    randomData() {
      this.cloudDataHistogram = randomData(6);
      this.scatterData = randomArray(100) as ScatterData;
    }
  },
  
  watch: {
    show(value: boolean) {
      console.log('AdvancedWeatherView show watch', value);
    },
  },
  
  
});
</script>


<style lang="less">
#advanced-weather-view {
    
  .graph-col {
    height: 300px;
  }

  .map-container {
    aspect-ratio: 1;
  }


}
</style>
