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
        <v-row class="">
          
          <v-col cols="6">
            <v-row>              
              <v-col cols="12">
                <v-col>
                  <p> I want to view </p>
                  <button-group
                    v-model="selectedStat"
                    :options-map="statText"
                    color="#eac402"
                    />
                </v-col>
                
                <v-col col="12">
                  <p> Show me: </p>
                    
                  <!-- can add any options from v-checkbox -->
                  <!-- v-if="selectedStat !== 'singleyear'" -->
                  <select-all 
                    v-if="selectedStat !== 'singleyear'"
                    :options-map="mapSubsets"
                    @selected="(s) => console.log('selected', s)"
                    @selectAll="(s) => console.log('selectAll', s)"
                    density="compact"
                    select-all-top
                    color="#eac402"
                  />
                  
                  <!-- range selector -->
                  <v-range-slider
                    v-if="selectedStat !== 'singleyear'"
                    class="awv-thumb-label"
                    v-model="selectedYearRange"
                    @end="() => console.log('selectedYearRange', selectedYearRange)"
                    :min="availableYears[0]"
                    :max="availableYears[availableYears.length - 1]"
                    :step="1"
                    show-ticks="always"
                    hide-details
                    thumb-label="always"
                    >
                  </v-range-slider>
                  <!-- v-if="selectedStat === 'singleyear'" -->
                  <div v-if="selectedStat === 'singleyear'">
                    <v-select
                      density="compact"
                      v-model="selectedYear"
                      :items="availableYears"
                      label="Select a Single Year to Veiw"
                      hide-details
                    ></v-select>
                    <v-slider
                      class="awv-thumb-label thumb-label-below"
                      :model-value="selectedYear"
                      @end="selectedYear = $event"
                      :min="availableYears[0]"
                      :max="availableYears[availableYears.length - 1]"
                      :step="1"
                      show-ticks="always"
                      
                      hide-details
                      thumb-label="always"
                      ></v-slider>
                  </div>
                  
                </v-col>
              </v-col>
              <v-col class="align-center justify-center">
              <v-btn 
                class="elevation-5"
                variant="outlined"
                color="#eac402" 
                @click="updateData()">Update Data</v-btn>
              </v-col>
            </v-row>
          </v-col>
          
          <v-col cols="6">
            <v-container aspect-ratio="1">
            <location-selector
              v-model="location"
              label="Location"
              :place-circle-options="placeCircleOptions"
              :selected-circle-options="selectedCircleOptions"
              cloud-cover
              />
              
              <v-radio-group 
                v-model="modisDataSet"  
                inline
                density="comfortable"
                persistent-hint
                hint="MODIS Aqua Data Set"
                >
                <v-radio
                  v-for="[key, value] in modisTimes"
                  :key="key"
                  :label="value"
                  :value="key"
                  color="#eac402"
                  hint="MODIS Aqua Data Set"
                ></v-radio>
              </v-radio-group>
                
              
            </v-container>
          </v-col>  
        </v-row>
        
        
        <!-- j -->
        <v-row class="">
          <v-col cols="12" sm="6" class="graph-col">
          <bar-chart
            id="cloud-histogram"
            class="elevation-5"
            :histogram-data="cloudDataHistogram"
            :labels="skyCoverCodes"
            :colors="colorMap"
            :title="`Cloud Conditions for ${selectedYear}`"
            />
          </v-col>
          <v-col cols="12" sm="6" class="graph-col">
          <line-chart
            class="elevation-5"
            :scatter-data="scatterData"
            :line-data="lineData"
            timeseries
            line-color="blue"
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
import ButtonGroup from './ButtonGroup.vue';
import SelectAll from './SelectAll.vue';
import BarChart from './BarChart.vue';
import LineChart from './LineChart.vue';
import LocationSelector from './LocationSelector.vue';
import {generateFakeTimeSeries} from './utils';
// eslint-disable-next-line @typescript-eslint/no-unused-vars
import {isNumber, toOrderedPairs, fromOrderedPairs, elementWise, OrderedPair} from './utils';
// isNumber is a utility function that checks if a value is a number
// toOrderedPairs converts an array of objects to an array of ordered pairs
// fromOrderedPairs converts an array of {x:x[i],x:y[i]}[] ordered pairs to an array of [x,y]
// elementWise applies a function to each element of an array returning an ordered pair
// We need to use Ordered Pairs as that is the data format that Chart.js expects
type LineGraphData = OrderedPair<number | Date, number>[];

type CityLocation = {
  longitudeDeg: number;
  latitudeDeg: number;
};

const cityBoston: CityLocation = {
  latitudeDeg: 42.3601,
  longitudeDeg: -71.0589,
};

function randomData(n: number): number[] {
  // for testing purposes only
  const data = Array.from({ length: n }, () => Math.round((Math.random() * 100)));
  const sum = data.reduce((a, b) => a + b, 0);
  return data.map((d) => Math.round((d / sum) * 100));
}


type Statistics =  'mean' | 'median' | 'max' | 'min' | 'singleyear';
type ElNinoPreference = 'elNino' | 'noElNino' | 'allYears';
type ModisTimeSpan = '1day' | '8day' | 'monthly' ;

const statText = new Map([
  ['mean', 'Mean'],
  ['median', 'Median'],
  // ['max', 'Maximum'],
  // ['min', 'Minimum'],
  ['singleyear', 'Single Year'],
]) as Map<Statistics, string>;

const mapSubsets = new Map([
  ['elNino', 'El Niño Years'],
  ['noElNino', 'Non El Niño Years'],
]) as Map<ElNinoPreference, string>;

const modisTimes = new Map([
  ['1day', '1 Day'],
  ['8day', '8 Day'],
  ['monthly', 'Monthly'],
]) as Map<ModisTimeSpan, string>;

// https://colorbrewer2.org/#type=sequential&scheme=YlGnBu&n=6
const _colorMap = ['#ffffcc','#c7e9b4','#7fcdbb','#41b6c4','#2c7fb8','#253494'];


export default defineComponent({
  name: 'AdvancedWeatherView',
  
  components: { 
    'bar-chart': BarChart,
    'line-chart': LineChart,
    'location-selector': LocationSelector,
    'button-group': ButtonGroup,
    'select-all': SelectAll,
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
      statText,
      mapSubsets,
      modisTimes,
      modisDataSet: '8day' as ModisTimeSpan,
      location: this.defaultLocation,
      dataLoadingProgress: 0,
      allYears: Array.from({ length: 22 }, (_, i) => 2001 + i),
      selectedYear: 2021,
      selectedYearRange: [2001, 2022],
      selectedStat: 'mean' as Statistics,
      elNinoPreference: 'allYears' as ElNinoPreference,
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
      
      // some fake data for the plot
      // scatterData: evaluate(0, 2 * Math.PI, 20, noisySin) as LineGraphData,
      // lineData: evaluate(0, 2 * Math.PI, 100, sin) as LineGraphData,
      scatterData: generateFakeTimeSeries(new Date(2021, 0, 1), new Date(2021, 11, 31), 20, 1) as LineGraphData,
      lineData: generateFakeTimeSeries(new Date(2021, 0, 1), new Date(2021, 11, 31), 100, 0) as LineGraphData,
      displayedCloudData: null,
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
    },
    
    availableYears() {
      // conceivably there could be years that are not available
      // we could handle that here. Otherwise this is just a passthrough
      return this.allYears;
    },
    
  },
  
  mounted() {
    console.log('Advanced Weather View mounted');
    // create a time to simulate data loading
  },
  
  methods: {
    
    updateData() {
      // simulate data loading
      this.dataLoadingProgress = 0;
      const interval = setInterval(() => {
        this.dataLoadingProgress = Math.min(this.dataLoadingProgress + Math.random() * 10,100);
        if (this.dataLoadingProgress >= 100) {
          clearInterval(interval);
        }
      }, 100);
      this.randomData();
      // set displayedCloudData and pass to location-selector
    },
    
    close() {
      this.showValue = false;
    },
    
    upper(word: string) {
      return  word.charAt(0).toUpperCase() + word.slice(1);
    },
    
    randomData() {
      // just for testing
      this.cloudDataHistogram = randomData(6);
      // this.scatterData = evaluate(0, 2 * Math.PI, 20, noisySin);
      // this.lineData = evaluate(0, 2 * Math.PI, 100, sin);
      // generate some random timeseries data
      const start = new Date(2021, 0, 1);
      const end = new Date(2021, 11, 31);
      this.scatterData = generateFakeTimeSeries(start, end, 20, 1);
      this.lineData = generateFakeTimeSeries(start, end, 100, 0);
    },
    
    // stats methods
    mean(array: number[], ignoreNaN: boolean = true): number {
      // null + x, undefined +x = NaN. 
      const arr = ignoreNaN ? array.filter((v) => isNumber(v)) : array;
      return arr.reduce((a, b) => a + b, 0) / arr.length;
    },
    
    median(array: number[], ignoreNaN: boolean = true): number {
      const arr = ignoreNaN ? array.filter((v) => isNumber(v)) : array;
      const mid = Math.floor(arr.length / 2);
      const nums = [...arr].sort((a, b) => a - b);
      return arr.length % 2 == 0 ? (nums[mid] + nums[mid - 1]) / 2 : nums[mid];
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
  --color: #eac402;
  
  .awv-button {
    font-size: var(--default-font-size);
    padding: 0.125em 0.5em;
    border-radius: 3px;
    border: 1px solid var(--color);
    color: black;
    cursor: pointer;
  }
  .awv-button:hover, .awv-button:focus {
    color: black;
    font-weight: bold;
  }
    
  .graph-col {
    height: 300px;
  }

  .map-container {
    contain: strict;
    aspect-ratio: 1;
  }

  div {
    outline: 0px solid red;
  }
  
  .awv-thumb-label {
    .v-slider-thumb__label {
      background-color: var(--color);
      color: black;
    }
    
    .v-slider-thumb__label::before {
      border-top-color: var(--color);
    }
    
  }
  .thumb-label-below .v-slider-thumb__label {
    --pos: calc(var(--v-slider-thumb-size) + 10px);
    top: var(--pos);
  }
  
  .thumb-label-below  .v-slider-thumb__label::before {
    bottom: calc(var(--v-slider-thumb-size) + 4px);
    transform: rotate(180deg);
}
  

}
</style>
./utils