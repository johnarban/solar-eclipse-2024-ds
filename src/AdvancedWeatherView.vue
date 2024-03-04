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
        <span class="text-bf bg-red text-white"> NOT ALL COMPONENTS ARE HOOKED UP TO REAL DATA YET</span>
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
                    @selected="(s) => {console.log('selected',s); if (s) {elNinoPreference = s[0] as ElNinoPreference;}}"
                    @selectAll="(s) => {console.log('selectAll',s); if (s) {elNinoPreference = 'allYears'};}"
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
              :map-options="mapOptions"
              :place-circle-options="placeCircleOptions"
              :selected-circle-options="selectedCircleOptions"
              :selected-cloud-cover="displayedCloudData"
              :rectangle-degrees="0.5"
              show-cloud-cover
              @dataclick="selectedDataIndex = $event.index"
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
            :title="`Cloud Conditions for ${allYears[0]} - ${allYears[allYears.length - 1]}`"
            />
          </v-col>
          <v-col cols="12" sm="6" class="graph-col">
          <line-chart
            class="elevation-5"
            :scatter-data="cloudDataNearLocation"
            :y-range="[-.1,1.1]"
            :x-range="[new Date(2003, 1, 8), new Date(2023, 7, 8)]"

            :y-axis-options="{
              ticks: {callback: (value: number, index: number) => {
                        if (value < 0 || value > 1) {return;}
                        return (value * 100).toFixed(0) + '%';
                        }}}"
            timeseries
            color="blue"
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
import {isNumber, toOrderedPairs, fromOrderedPairs, elementWise, OrderedPair, roundToNearestHalf} from './utils';
// isNumber is a utility function that checks if a value is a number
// toOrderedPairs converts an array of objects to an array of ordered pairs
// fromOrderedPairs converts an array of {x:x[i],x:y[i]}[] ordered pairs to an array of [x,y]
// elementWise applies a function to each element of an array returning an ordered pair
// We need to use Ordered Pairs as that is the data format that Chart.js expects
type LineGraphData = OrderedPair<number | Date, number>[];
import { csvParseRows } from "d3-dsv";

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

function getStat(val: CloudSummaryData, stat: Exclude<Statistics,'singleyear'>): number {
  if (stat === 'mean') {
    return val.mean;
  }
  if (stat === 'median') {
    return val.median;
  }
  if (stat === 'max') {
    return val.max;
  }
  if (stat === 'min') {
    return val.min;
  }
  return -1;
}

const mapSubsets = new Map([
  ['elNino', 'El Niño Years'],
  ['noElNino', 'Non El Niño Years'],
]) as Map<ElNinoPreference, string>;

const modisTimes = new Map([
  ['1day', '1 Day'],
  ['8day', '8 Day'],
  ['monthly', 'Monthly'],
]) as Map<ModisTimeSpan, string>;

// https://colorbrewer2.org/#type=sequential&scheme=YlGnBu&n=6 //
// const _colorMap = ['#ffffcc','#c7e9b4','#7fcdbb','#41b6c4','#2c7fb8','#253494'];
// https://colorbrewer2.org/?type=sequential&scheme=YlGnBu&n=4
// const _colorMap = ['#ffffcc','#a1dab4','#41b6c4','#225ea8'].reverse();

// https://colorbrewer2.org/?type=sequential&scheme=Blues&n=4
const _colorMap = ['#eff3ff','#bdd7e7','#6baed6','#2171b5'].reverse();

// interface CloudCSVRow {
//   latitude: number;
//   longitude: number;
//   // eslint-disable-next-line @typescript-eslint/naming-convention
//   cloud_cover: number;
// }

interface CloudDataElement {
  lat: number;
  lon: number;
  cloudCover: number;
}

type CloudData = CloudDataElement[];

type CloudSummaryData = {
  lat: number;
  lon: number;
  mean: number;
  median: number;
  mode: number;
  max: number;
  min: number;
  cloudCover?: number;
};

// latitude,longitude,mean_cloud_cover,median_cloud_cover,mode_cloud_cover,min_cloud_cover,max_cloud_cover,inside_us
// type CloudSummaryCSV = {
//   latitude: number;
//   longitude: number;
//   // eslint-disable-next-line @typescript-eslint/naming-convention
//   mean_cloud_cover: number;
//   // eslint-disable-next-line @typescript-eslint/naming-convention
//   median_cloud_cover: number;
//   // eslint-disable-next-line @typescript-eslint/naming-convention
//   mode_cloud_cover: number;
//   // eslint-disable-next-line @typescript-eslint/naming-convention
//   min_cloud_cover: number;
//   // eslint-disable-next-line @typescript-eslint/naming-convention
//   max_cloud_cover: number;
// };

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
    const eps = 0.000001;
    return {
      statText,
      mapSubsets,
      modisTimes,
      modisDataSet: '8day' as ModisTimeSpan,
      location: this.defaultLocation,
      dataloaded: false,
      dataLoadingProgress: 0,
      allYears: [
        2003, 2004, 2005, 2006, 2007, 
        2008, 2009, 2010, 2011, 2012,
        2013, 2014, 2015, 2016, 2017,
        2018, 2019, 2020, 2021, 2023
      ],
      selectedYear: 2021,
      selectedYearRange: [2001, 2022],
      selectedStat: 'singleyear' as Statistics,
      elNinoPreference: 'elNino' as ElNinoPreference,
      // https://www.weather.gov/media/notification/dir/AFM_Specifications.pdf
      skyCoverCodes: ['Clear/Mostly Clear', 'Parly Cloudy', 'Mostly Cloudy', 'Cloud/Overcast'],
      skyCoverCodeRanges: [
        ['clear', [0, 25]],
        ['parlyCloudy', [25 + eps, 50]],
        ['mostlyCloudy', [50 + eps, 87]],
        ['overcast', [87+eps, 100]],
      ] as [string, [number, number]][],
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
      displayedCloudData: undefined as CloudData | undefined,
      allCloudData: {} as Record<string, CloudData>,
      needToUpdate: false,
      latitudes: [] as number[],
      longitudes: [] as number[],
      latLonIndex: new Map<[number, number], number>,
      allYearsSummary: [] as CloudSummaryData[],
      neutralYearsSummary: [] as CloudSummaryData[],
      elNinoYearsSummary: [] as CloudSummaryData[],
      // laNinaYearsSummary: [] as CloudData, 
      selectedDataIndex: null as number | null,
      
    };
  },
  
  mounted() {
    console.log('Advanced Weather View mounted');
    // create a time to simulate data loading
    console.log('all cloud data', this.allCloudData);
    if (this.modelValue) {
      this.loadCloudData().then(() => {
        console.log('preloading data');
        this.dataloaded = true;
        this.updateData();
      });
    }
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
    
    cloudDataNearLocation(): LineGraphData | undefined {
      // get the cloud data nearest to the location for all years
      const allData = [] as LineGraphData;
      if (this.allYears.length === 0) {
        console.log('no years');
        return undefined;
      }
      
      if (Object.keys(this.allCloudData).length != this.allYears.length) {
        console.log('all data not yet loaded');
        return undefined;
      }
      
      const index = this.selectedDataIndex ?? this.getLatLonIndex(this.location.latitudeDeg, this.location.longitudeDeg);
      if (index === -1 || index === null) {
        return undefined;
      }
      console.log('data index', index);

      this.allYears.map((year) => {
        allData.push({'x': new Date(year, 4, 8), 'y':this.allCloudData[year][index].cloudCover});
      });
      return allData;
    },
    
    cloudDataHistogram(): number[] {
      // get the cloudDataNearLocation
      const data = this.cloudDataNearLocation;
      if (data === undefined) {
        return [];
      }
      // bin according to skyCoverCodeRanges, not incluside of the max except for the last bin
      const hist = this.skyCoverCodeRanges.reduce((acc, [_key, range]) => {
        const count = data.filter((d) => d.y >= range[0]/100 && d.y <= range[1]/100).length;
        acc.push(100 * count / data.length);
        return acc;
      }, [] as number[]);
      console.log('hist', hist, hist.reduce((a, b) => a + b, 0));
      return hist;
    },
      
    
    yearForLocation(): LineGraphData {
      // get the all cloud data for this location for all years
      const allData = [] as LineGraphData;
      if (this.allYears.length === 0) {
        return allData;
      }
      
      if (Object.keys(this.allCloudData).length === 0) {
        return allData;
      }
      
      this.allYears.map( (year: number) => {
        const data = this.allCloudData[year];
        const mean = this.mean(data.map((d) => d.cloudCover));
        allData.push({'x':new Date(year, 4, 8), 'y':mean});
      });
      
      
      return allData;
    },
    
    elNinoData(): CloudData | undefined {
      if (this.selectedStat === 'singleyear') {
        return;
      }
      return this.getStat(this.elNinoYearsSummary, this.selectedStat);
    },
    
    neutralData(): CloudData | undefined {
      if (this.selectedStat === 'singleyear') {
        return;
      }
      return this.getStat(this.neutralYearsSummary, this.selectedStat);
    },
    
    allYearsData(): CloudData | undefined {
      if (this.selectedStat === 'singleyear') {
        return;
      }
      return this.getStat(this.allYearsSummary, this.selectedStat);
    },
    
  },
  
  
  
  methods: {
    
    getStat(array: CloudSummaryData[], stat: Exclude<Statistics,'singleyear'>): CloudData {
      return array.map((d) => {
        return {
          lat: d.lat,
          lon: d.lon,
          cloudCover: getStat(d, stat),
        };
      });
    },
    
    async getSummaryData(path: string) {
      console.log('loading summary data', path);
      return import(path)
        .then( (module) => {
          return csvParseRows(module.default, (row, i) => {
            if (i === 0) {return;}
            return {
              lat: +row[0],
              lon: +row[1],
              mean: +row[2],
              median: +row[3],
              mode: +row[4],
              min: +row[5],
              max: +row[6],
            } as CloudSummaryData;
          });
        });
    },
    
    async getElNinoData() {
      return import('./assets/ucm_boundary_data/nino_ucm.csv').then((module) => {
        this.elNinoYearsSummary = csvParseRows(module.default, (row, i) => {
          if (i === 0) {return;}
          return {
            lat: +row[0],
            lon: +row[1],
            mean: +row[2],
            median: +row[3],
            mode: +row[4],
            min: +row[5],
            max: +row[6],
          } as CloudSummaryData;
        });
      });
    },
    
    async getNeutralData() {
      await import('./assets/ucm_boundary_data/neutral_ucm.csv').then((module) => {
        this.neutralYearsSummary = csvParseRows(module.default, (row, i) => {
          if (i === 0) {return;}
          return {
            lat: +row[0],
            lon: +row[1],
            mean: +row[2],
            median: +row[3],
            mode: +row[4],
            min: +row[5],
            max: +row[6],
          } as CloudSummaryData;
        });
      });
    },
    
    async getAllYearsData() {
      await import('./assets/ucm_boundary_data/all_years_ucm.csv').then((module) => {
        this.allYearsSummary = csvParseRows(module.default, (row, i) => {
          if (i === 0) {return;}
          return {
            lat: +row[0],
            lon: +row[1],
            mean: +row[2],
            median: +row[3],
            mode: +row[4],
            min: +row[5],
            max: +row[6],
          } as CloudSummaryData;
        });
      });
    },

    
    loadCloudData() {
      console.log('awv: loading cloud data');
      this.dataLoadingProgress = 0;
      this.allYears.map((val: number, index) => {
        import(`./assets/ucm_boundary_data/${val}_cloud_cover.csv`).then((module) => {
          const data = csvParseRows(module.default, (row, i) => {
            if (i === 0) {return;}
            if (index == 0) {
              this.latitudes.push(+row[0]);
              this.longitudes.push(+row[1]);
            }
            return {
              lat: +row[0],
              lon: +row[1],
              cloudCover: +row[2],
            } as CloudDataElement;
          });
          // skip first row
          this.allCloudData[val] = data.slice(1);
          this.dataLoadingProgress = Math.ceil(((index + 1) / this.allYears.length) * 100);
        });
      });
      return new Promise((resolve) => {resolve(true);});
    },
    
    zip(arrays: number[][]): number[][] {
      // https://stackoverflow.com/a/10284006
      return arrays[0].map((_, i) => arrays.map((array) => array[i]));
    },
    
    getLatLonIndex(lat: number, lon: number): number {
      if (this.latitudes.length === 0) {
        return -1;
      }
      if (this.longitudes.length === 0) {
        return -1;
      }
      // binary search using distance
      const distances = this.latitudes.map((lat2, i) => Math.sqrt((lat - lat2) ** 2 + (lon - this.longitudes[i]) ** 2));
      const minIndex = distances.indexOf(Math.min(...distances));
      console.log('minIndex', minIndex, 'distance', distances[minIndex]);
      return minIndex;
    },
    
    
    
    updateData() {
      // simulate data loading
      this.dataLoadingProgress = 0;
      this.randomData();
      if (this.selectedStat === 'singleyear') {
        this.displayedCloudData = this.allCloudData[this.selectedYear];
        return;
      }
      if (this.elNinoPreference === 'elNino') {
        console.log('el nino');
        if (this.elNinoYearsSummary.length === 0) {
          console.log('loading el nino data');
          this.getElNinoData().then(() => {
            this.displayedCloudData = this.elNinoData;
            return;
          });
          return;
        }
        this.displayedCloudData = this.elNinoData;
        return;
      }
      if (this.elNinoPreference === 'noElNino') {
        console.log('no el nino');
        if (this.neutralYearsSummary.length === 0) {
          console.log('loading neutral data');
          this.getNeutralData().then(() => {
            this.displayedCloudData = this.neutralData;
            return;
          });
          return;
        }
        this.displayedCloudData = this.neutralData;
        return;
      }
      if (this.elNinoPreference === 'allYears') {
        console.log('all years');
        if (this.allYearsSummary.length === 0) {
          console.log('loading all years data');
          this.getAllYearsData().then(() => {
            this.displayedCloudData = this.allYearsData;
            return;
          });
          return;
        }
        this.displayedCloudData = this.allYearsData;
        return;
      }
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
    mean(array: (number | null)[]): number {
      // null + x, undefined +x = NaN. 
      const arr = array.filter((v) => isNumber(v)) as number[];
      return arr.reduce((a, b) => a + b, 0) / arr.length;
    },
    
    median(array: (number | null)[]): number {
      const arr = array.filter((v) => isNumber(v)) as number[];
      const mid = Math.floor(arr.length / 2);
      const nums = [...arr].sort((a, b) => a - b);
      return arr.length % 2 == 0 ? (nums[mid] + nums[mid - 1]) / 2 : nums[mid];
    }
  },
  
  watch: {
    modelValue(value: boolean) {
      console.log('AdvancedWeatherView show watch', value);
      if (value) {
        console.log('loading data');
        this.loadCloudData().then(() => {
          console.log('finished loading data');
          this.dataloaded = true;
          this.updateData();
        });
      }
    },
    
    displayedCloudData(_val: CloudData | undefined) {
      // print out the selection options
      const log = {
        'selectedStat': this.upper(this.selectedStat),
        'elNinoPreference': this.upper(this.elNinoPreference),
        'selectedYear': this.selectedYear,
        'selectedYearRange': this.selectedYearRange,
      };
      console.log('displayedCloudData', log);
      this.needToUpdate = true;
    },
    
    selectedStat(_val: Statistics) {
      console.log('selectedStat', this.selectedStat);
    },
    elNinoPreference(_val: ElNinoPreference) {
      console.log('elNinoPreference', this.elNinoPreference);
    },
    selectedYear(_val: number) {
      console.log('selectedYear', this.selectedYear);
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