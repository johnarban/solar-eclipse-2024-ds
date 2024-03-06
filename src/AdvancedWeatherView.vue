<template>
  <!-- v-dialog. containing a card with a 3 row, 2 column layouy -->
  <v-dialog 
    v-model="showValue" 
    close-on-back
    >
    <v-card id="advanced-weather-view">
      <v-card-title>
        <h1>Advanced Weather View</h1>
      </v-card-title>
      
      <v-card-text>
        <h2>Just how cloudy is it in {{ locationName }} in April?</h2>
        
        <!-- top row -->
        <v-row class="">
          
          <v-col cols="6">
            <v-row>              
              <v-col cols="12">
                
                <v-col class="sentence" col="12">
                  <label for="statistics">Show me</label>
                  <select 
                    class="select-box"
                    name="statistics" 
                    id="select-statistics" 
                    v-model="selectedStat"
                    >
                    <option disabled value="">Select one</option>
                    <option value="mean">the Mean</option>
                    <option value="median">the Median</option>
                    <option value="singleyear">a Single Year</option>
                  </select>
                    <label for="years">of the cloud cover for </label>
                    <select 
                      class="select-box"
                      name="years" 
                      id="select-years" 
                      v-model="dataSubset"
                      >
                      <option disabled value="">Select one</option>
                      <!-- eslint-disable-next-line vue/no-use-v-if-with-v-for -->
                      <option v-if="selectedStat !== 'singleyear'" value="mean">the Mean</option>
                      <option v-if="selectedStat !== 'singleyear'" value="median">the Median</option>
                      <option v-if="selectedStat !== 'singleyear'" value="singleyear">a Single Year</option>
                      <!-- eslint-disable-next-line vue/no-use-v-if-with-v-for -->
                      <option v-if="selectedStat === 'singleyear'"
                        v-for="year in availableYears" :key="year" :value="year">{{ year }}
                      </option>
                    </select>
                  </v-col>
                
              </v-col>
              <v-col class="align-center justify-center">
              <v-btn 
                class="elevation-5"
                variant="flat"
                :disabled="!needToUpdate"
                size="x-large"
                color="#eac402" 
                @click="updateData()">Show on Map</v-btn>
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
                  :disabled="value=='1 Day'"
                  color="#eac402"
                  hint="MODIS Aqua Data Set"
                ></v-radio>
              </v-radio-group>
                
            </v-container>
          </v-col>  
        </v-row>
        
        
        <v-row class="">
          <v-col cols="12" sm="6" class="graph-col">
          <bar-chart
            id="cloud-histogram"
            class="elevation-5"
            :labels="skyCoverCodes"
            data-label="All Years"
            :histogram-data="cloudDataHistogram.map((v, _i) => locationHistogram.length > 0 ? v - locationHistogram[_i] : v)"
            :colors="colorMap"
            :options = "{scales: {y: {beginAtZero: true, max:20}}}"
            show-tooltip
            :bar-annotations="true"
            :bar-offset="1"
            :barAnnotationLabel="(v:number) => (v * 100/20).toFixed(0)"
            stacked
            :title="`Cloud Conditions for ${allYears[0]} - ${allYears[allYears.length - 1]}`"
            :other-datasets="mapSubsets.get(dataSubset) == undefined ? [] : [
              {
                label: mapSubsets.get(dataSubset),
                data: locationHistogram,
                backgroundColor: '#c51b8a',
              }
            ]"
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
import BarChart from './BarChart.vue';
import LineChart from './LineChart.vue';
import LocationSelector from './LocationSelector.vue';


import {isNumber, OrderedPair, textForLocation} from './utils';
// isNumber is a utility function that checks if a value is a number
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




type Statistics =  'mean' | 'median' | 'max' | 'min' | 'singleyear';
type DataSubset = 'elNino' | 'neutral' | 'laNina' | 'allYears';
type ModisTimeSpan = '1day' | '8day' | 'monthly' ;

const statText = new Map([
  ['mean', 'Mean'],
  ['median', 'Median'],
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
  ['neutral', 'Non El Niño Years'],
  ['laNina', 'La Niña Years'],
]) as Map<DataSubset, string>;

const modisTimes = new Map([
  ['1day', '1 Day'],
  ['8day', '8 Day'],
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
      elNinoYears: [2003, 2007, 2010, 2016],
      laNinaYears: [2000, 2008, 2011, 2012, 2021, 2022],
      neutralYears: [2001, 2002, 2004, 2005, 2006, 2009, 2013, 2014, 2015, 2017, 2018],
      selectedYear: 2021,
      selectedYearRange: [2001, 2022],
      selectedStat: 'median' as Statistics,
      dataSubset: 'allYears' as DataSubset,
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
      scatterData: [] as LineGraphData,
      lineData: [] as LineGraphData,
      displayedCloudData: undefined as CloudData | undefined,
      allCloudData: {} as Record<string, CloudData>,
      needToUpdate: false,
      latitudes: [] as number[],
      longitudes: [] as number[],
      latLonIndex: new Map<[number, number], number>,
      allYearsSummary: [] as CloudSummaryData[],
      neutralYearsSummary: [] as CloudSummaryData[],
      elNinoYearsSummary: [] as CloudSummaryData[],
      laNinaYearsSummary: [] as CloudSummaryData[], 
      selectedDataIndex: null as number | null,
      
      locationName: ''
      
    };
  },
  
  mounted() {
    console.log('Advanced Weather View mounted');
    // create a time to simulate data loading
    console.log('all cloud data', this.allCloudData);
    this.updateLocationName();
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
        // acc.push(100 * count / data.length);
        acc.push(count);
        return acc;
      }, [] as number[]);
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
      
      this.allYears.map((year: number) => {
        if (this.dataSubset === 'elNino') {
          if (!this.elNinoYears.includes(year)) {
            return;
          }
        }
        if (this.dataSubset === 'neutral') {
          if (!this.neutralYears.includes(year)) {
            return;
          }
        }
        if (this.dataSubset === 'laNina') {
          if (!this.laNinaYears.includes(year)) {
            return;
          }
        }
        const data = this.allCloudData[year];
        if (data === undefined) {
          return;
        }
        const index = this.selectedDataIndex ?? this.getLatLonIndex(this.location.latitudeDeg, this.location.longitudeDeg);
        if (index === -1) {
          return;
        }
        allData.push({'x':new Date(year, 4, 8), 'y':data[index].cloudCover});
      });
      
      return allData;
    },
    
    locationHistogram(): number[] {
      // get the histogram data for the cloud cover)
      console.log(this.dataSubset);
      if (this.dataSubset === 'allYears' || this.selectedStat == 'singleyear') {
        return [];
      }
      return this.getHistogram(this.yearForLocation.map(d => d.y), 'none');
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
    
    laNinaData(): CloudData | undefined {
      if (this.selectedStat === 'singleyear') {
        return;
      }
      return this.getStat(this.laNinaYearsSummary, this.selectedStat);
    },
    
    allYearsData(): CloudData | undefined {
      if (this.selectedStat === 'singleyear') {
        return;
      }
      return this.getStat(this.allYearsSummary, this.selectedStat);
    },
    
  },
  
  
  
  methods: {
    
    getHistogram(arr: number[], norm: 'none' | 'fraction' | 'percent' = 'none'): number[] {
      // get the histogram data for the cloud cover)
      if (arr === undefined || arr === null || arr.length === 0) {
        return [];
      }
      
      const array = arr.filter(isNumber);
      const hist = this.skyCoverCodeRanges.reduce((acc, [_key, range]) => {
        const count = array.filter((d) => d >= range[0]/100 && d <= range[1]/100).length;
        if (norm === 'none') {
          acc.push(count);
        }
        if (norm === 'fraction') {
          acc.push(count / array.length);
        }
        if (norm === 'percent') {
          acc.push(100 * count / array.length);
        }
        return acc;
      }, [] as number[]);

      return hist;
    },
    
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
      console.log('loading el nino data');
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
      console.log('loading neutral data');
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
    
    async getLaNinaData() {
      console.log('loading la nina data');
      await import('./assets/ucm_boundary_data/nina_ucm.csv').then((module) => {
        // get number of rows in the csv
        this.laNinaYearsSummary = csvParseRows(module.default, (row, i) => {
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
    
    getDataForYears(years: number[]): CloudData {
      // get the cloud data for a location for a set of years
      const data = [] as CloudData;
      years.map((year) => {
        if (this.allCloudData[year] === undefined) {
          return;
        }
        const index = this.selectedDataIndex ?? this.getLatLonIndex(this.location.latitudeDeg, this.location.longitudeDeg);
        if (index === -1) {
          return;
        }
        data.push(this.allCloudData[year][index]);
      });
      return data;
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
      return minIndex;
    },
    
    
    
    updateData() {
      // simulate data loading
      this.needToUpdate = false;
      if (this.selectedStat === 'singleyear') {
        this.displayedCloudData = this.allCloudData[this.selectedYear];
        return;
      }
      if (this.dataSubset === 'elNino') {
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
      if (this.dataSubset === 'neutral') {
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
      
      if (this.dataSubset === 'laNina') {
        console.log('la nina');
        if (this.laNinaYearsSummary.length === 0) {
          console.log('loading la nina data');
          this.getLaNinaData().then(() => {
            this.displayedCloudData = this.laNinaData;
            return;
          });
          return;
        }
        this.displayedCloudData = this.laNinaData;
        return;
      }
      
      if (this.dataSubset === 'allYears') {
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
    },
    
    updateLocationName() {
      textForLocation(this.location.longitudeDeg, this.location.latitudeDeg)
        .then((name) => {
          console.log('this name');
          this.locationName = name;
        })
        .catch((e) => {
          console.error('error getting location name', e);
        });
    },
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
    
    selectedStat(value: Statistics) {
      console.log('selectedStat', value);
      this.needToUpdate = true;
    },
    
    dataSubset(value: DataSubset) {
      console.log('dataSubset', value);
      this.needToUpdate = true;
    },
    
    dataLoadingProgress(value: number) {
      console.log('dataLoadingProgress', value);
    },
    
    location(value: CityLocation) {
      console.log('location', value);
      this.updateLocationName();
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
  
.sentence {
  font-size: 1.35rem;
  font-weight: bold;
}

.select-box {
  border-bottom: 1px solid white;
  appearance: auto !important;
  margin-inline: 0.5em;
}

}
</style>
./utils