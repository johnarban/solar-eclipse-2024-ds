<template>
  <!-- v-dialog. containing a card with a 3 row, 2 column layouy -->
  <v-dialog 
    v-model="showValue" 
    close-on-back
    >
    <v-card id="advanced-weather-view">
      <v-card-text>
        <h1 style="padding:0.5em 0.5em">Just how cloudy is it in {{ locationName }} in April?</h1>
        <p class="intro">
          NASA's <a href="https://modis.gsfc.nasa.gov/" target="_blank">MODIS Aqua and Terra</a> satellites 
          provide daily views of the entire surface of the Earth and measure the cloud cover.
          This is provided as the <strong>cloud cover fraction - <em>the percentage of the sky at a given location that is covered 
          by clouds</em></strong>. The daily data can have gaps and processing artefacts, so the 8-day average 
          provies a more reliable measure of the cloud cover for a given time,
        </p>
        
        <!-- top row -->
        <v-row class="">
          
          <v-col cols="5" >
            <v-row>              
              <v-col cols="12">
                
                <v-col class="sentence-query" col="12">
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
                      v-if="selectedStat !== 'singleyear'"
                      class="select-box"
                      name="years" 
                      id="select-years" 
                      v-model="dataSubset"
                      >
                      <option disabled value="">Select one</option>
                      <option
                        v-for="[key, value] in mapSubsets" :key="key" :value="key">{{ value }}</option>
                    </select>
                    <select 
                      v-else
                      class="select-box"
                      name="years" 
                      id="select-years" 
                      v-model="selectedYear"
                      >
                      <option disabled value="">Select one</option>
                      <option
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
            
            <v-row id="chart-intro" v-if="!displayCharts && displayData">
              <hr style="width:100%; margin-block: 1rem;">
              <h3>Show cloud cover statistics for currently selected location: <strong class="attention">{{ locationName }}</strong></h3>
              <v-btn 
                size="large"
                color="#eac402"
                @click="displayCharts = true">Show Cloud Cover Charts</v-btn>
            </v-row>
            <v-row v-if="displayCharts">
              
              <div id="awv-cloud-cover-display" class="">
                <h3>Cloud Cover for <strong class="attention">{{ locationName }}</strong>:</h3>
                <!-- cloud cover for all years at location -->
                <cloud-cover-line
                  :value="median(cloudDataNearLocation)"
                  label="Median"
                  :codes="skyCoverCodes"
                  :ranges="skyCoverCodeRanges"
                  :icons="skyCoverIcons"
                  />
                
                <cloud-cover-line
                  :value="mean(cloudDataNearLocation)"
                  label="Mean"
                  :codes="skyCoverCodes"
                  :ranges="skyCoverCodeRanges"
                  :icons="skyCoverIcons"
                  />
                <div v-if="dataSubset != 'allYears'">
                  <hr>
                  <h3 v-if="selectedStat !== 'singleyear'"> <strong class="attention">{{ statText.get(selectedStat) }}</strong> Cloud Cover for <strong class="attention">{{ locationName }}</strong> for <strong class="attention">{{ mapSubsets.get(dataSubset) }}</strong>:</h3>
                  <h3 v-else> Cloud Cover for {{ locationName }} in {{ selectedYear }}:</h3>

                  <cloud-cover-line
                    :value="locationValue"
                    :label="selectedStat === 'singleyear' ? 'Cloud Cover' : statText.get(selectedStat) ?? 'Cloud Cover'"
                    hide-label
                    :codes="skyCoverCodes"
                    :ranges="skyCoverCodeRanges"
                    :icons="skyCoverIcons"
                    variant="bold"
                    />
                </div>
              </div>
            </v-row>
              
          </v-col>
          
          <v-col cols="7">
            <v-container aspect-ratio="1">
            <span id="awv-map-description"> {{ mapDescriptionText }} </span>
            <location-selector
              v-model="location"
              label="Location"
              :map-options="mapOptions"
              :place-circle-options="placeCircleOptions"
              :selected-circle-options="selectedCircleOptions"
              :selected-cloud-cover="displayedCloudData"
              :rectangle-degrees="0.5"
              :show-cloud-cover="displayData"
              @dataclick="selectedDataIndex = $event.index; selectedDataCloudCover = $event.cloudCover"
              :cloud-cover-opacity-function="transferFunction"
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
        
        <v-row v-if="displayCharts" class="">
          <v-col cols="12" sm="6" class="graph-col">
          <bar-chart
            id="cloud-histogram"
            class="elevation-5"
            :labels="skyCoverCodes.map((v) => v.includes('/') ? [v.split('/')[0] + '/', v.split('/')[1]]: v)"
            :data-label="dataSubset === 'allYears' ? 'All Years' : 'Other Years'"
            :histogram-data="cloudDataHistogram.map((v, _i) => locationHistogram.length > 0 ? v - locationHistogram[_i] : v)"
            :colors="dataSubset === 'allYears' ? colorMap : ['#aaa']"
            :options = "{scales: {y: {beginAtZero: true, max:20}}}"
            :bar-annotations="false"
            :bar-offset="1"
            :barAnnotationLabel="(v:number) => (v * 100/20).toFixed(0) + '%'"
            stacked
            :title="`Cloud Conditions for ${locationName} ${allYears[0]} - ${allYears[allYears.length - 1]}`"
            :other-datasets="dataSubset === 'allYears' ? [] : [
              {
                label: mapSubsets.get(dataSubset),
                data: locationHistogram,
                backgroundColor: colorMap, //'#c51b8a',
                borderColor: 'black', //'#c51b8a',
                borderWidth: 1,
              }
            ]"
            />
          </v-col>
          <v-col cols="12" sm="6" class="graph-col">
          <line-chart
            class="elevation-5"
            :title="`Percent Cloud Cover for ${locationName}`"
            :scatter-data="cloudDataNearLocation"
            :scatter-options="{radius: 4 }"
            :scatter-label="dataSubset === 'allYears' ? 'All Years' : 'Other Years'"
            :subsets="dataSubset === 'allYears' ? [] :
              [allYears.map((year) => selectedYears.includes(year))]"
            :subset-styles="[{backgroundColor: 'red', radius: 5}]"
            :y-range="[-.1,1.1]"
            :x-range="[new Date(2003, 1, 8), new Date(2023, 7, 8)]"

            :y-axis-options="{
              ticks: {callback: (value: number, index: number) => {
                        if (value < 0 || value > 1) {return;}
                        return (value * 100).toFixed(0) + '%';
                        }}}"
            timeseries
            color="grey"
            show-scatter
            :annotations="[...skyCoverCodeRanges.map(([_,[min,max]],i) => {
              return {
                type: 'box',
                yMin: min/100,
                yMax: max/100,
                backgroundColor: colorMap[i],
                drawTime: 'beforeDraw',
                borderColor: colorMap[i]
              }
            }),
            ...skyCoverCodeRanges.map(([label,[min,max]],i) => {
              return {
                type: 'line',
                borderWidth: 0,
                drawTime: 'beforeDatasetsDraw',
                
                label: {
                  display: true,
                  color: 'black',
                  backgroundColor: 'transparent',
                  content: skyCoverCodes[i],
                },
                xMin: new Date(2023, 1, 8),
                yMin: (min + max) / 200,
                yMax: (min + max) / 200,
              };
            })
          ]"
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
import CloudCoverLine from './CloudCoverLine.vue';


import {isNumber, OrderedPair, textForLocation} from './utils';
// isNumber is a utility function that checks if a value is a number
// We need to use Ordered Pairs as that is the data format that Chart.js expects
type LineGraphData = OrderedPair<Date, number>[];
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
  ['neutral', 'Neutral Years'],
  ['laNina', 'La Niña Years'],
  ['allYears', 'All Years'],
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
    'cloud-cover-line': CloudCoverLine,
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
      selectedStat: 'median' as Statistics,
      dataSubset: 'allYears' as DataSubset,
      // https://www.weather.gov/media/notification/dir/AFM_Specifications.pdf
      skyCoverCodes: ['Clear/Mostly Clear', 'Parly Cloudy', 'Mostly Cloudy', 'Cloudy/Overcast'],
      skyCoverIcons: ['mdi-weather-sunny', 'mdi-weather-partly-cloudy', 'mdi-weather-cloudy', 'mdi-clouds'],
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
      selectedDataCloudCover: null as number | null,
      mapDescriptionText: '',
      locationName: '',
      inBounds: false,
      displayData: false,
      displayCharts: false,
      
    };
  },
  
  mounted() {
    console.log('Advanced Weather View mounted');
    this.needToUpdate = true;
    // create a time to simulate data loading
    this.updateLocationName();
    if (this.modelValue) {
      this.loadEightDayData().then(() => {
        console.log('preloading data');
        this.dataloaded = true;
        this.updateData(false);
        this.updateMapDescriptionText();
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
      if (!this.inBounds) {return undefined;}
      if (this.allYears.length === 0) {
        console.log('no years');
        return [];
      }
      
      if (Object.keys(this.allCloudData).length != this.allYears.length) {
        console.log('all data not yet loaded');
        return [];
      }
      
      const index = this.selectedDataIndex ?? this.getLatLonIndex(this.location.latitudeDeg, this.location.longitudeDeg);
      if (index === -1 || index === null) {
        return [];
      }

      // show the lat lon of index
      
      this.allYears.map((year) => {
        allData.push({'x': new Date(year, 4, 8), 'y':this.allCloudData[year][index].cloudCover});
      });
      // console.log('index', index, this.latitudes[index], this.longitudes[index], allData.map(d => d.y));
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
      if (!this.inBounds) {return allData;}
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
        if (index === -1 || index === null) {
          return;
        }
        allData.push({'x':new Date(year, 4, 8), 'y':data[index].cloudCover});
      });
      
      return allData;
    },
    
    locationHistogram(): number[] {
      // get the histogram data for the cloud cover)
      if (this.dataSubset === 'allYears' || this.selectedStat == 'singleyear') {
        return [];
      }
      return this.getHistogram(this.yearForLocation.map(d => d.y), 'none');
    },
    
    locationMean(): number | null {
      // get the mean cloud cover for the location
      return this.mean(this.yearForLocation.map(d => d.y));
    },
    
    locationMedian(): number | null {
      // get the median cloud cover for the location
      return this.median(this.yearForLocation.map(d => d.y));
    },
    
    locationValue: {
      get() {
        if (this.selectedDataCloudCover) {
          return this.selectedDataCloudCover;
        }
        if (this.selectedStat === 'mean') {
          return this.locationMean;
        }
        if (this.selectedStat === 'median') {
          return this.locationMedian;
        }
        if (this.selectedStat === 'singleyear') {
          return this.cloudDataNearLocation?.filter( v => v.x.getFullYear() === this.selectedYear)[0].y ?? null;
        }
        return null;
      },
      set(value: number) {
        this.selectedDataCloudCover = value;
      },
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
    
    selectedYears(): number[] {    
      if (this.selectedStat === 'singleyear') {
        return [this.selectedYear];
      }
      
      if (this.dataSubset === 'elNino') {
        return this.elNinoYears;
      }
      
      if (this.dataSubset === 'neutral') {
        return this.neutralYears;
      }
      
      if (this.dataSubset === 'laNina') {
        return this.laNinaYears;
      }
      
      if (this.dataSubset === 'allYears') {
        return this.allYears;
      }
      
      return [];
    },
    
  },
  
  
  
  methods: {
    
    transferFunction(val: number | null): number {
      if (val === null) {
        return 0;
      }
      // return sigmoid
      const y = (val - 0.5) / .12;
      const z = Math.exp(y);
      return z / (1 + z);
    },
    
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
      return import('./assets/modis_eight_day/nino_ucm.csv').then((module) => {
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
      await import('./assets/modis_eight_day/neutral_ucm.csv').then((module) => {
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
      await import('./assets/modis_eight_day/nina_ucm.csv').then((module) => {
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
      await import('./assets/modis_eight_day/all_years_ucm.csv').then((module) => {
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
      if (!this.inBounds) {return data;}
      
      years.map((year) => {
        if (this.allCloudData[year] === undefined) {
          return;
        }
        const index = this.selectedDataIndex ?? this.getLatLonIndex(this.location.latitudeDeg, this.location.longitudeDeg);
        if (index === -1 || index === null) {
          return;
        }
        data.push(this.allCloudData[year][index]);
      });
      return data;
    },

    
    loadEightDayData() {
      console.log('awv: loading cloud data');
      this.dataLoadingProgress = 0;
      this.allYears.map((val: number, index) => {
        import(`./assets/modis_eight_day/${val}_cloud_cover.csv`).then((module) => {
          const data = csvParseRows(module.default, (row, i) => {
            if (i === 0) {return {} as CloudDataElement;}
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
    
    loadOneDayData() {
      console.log('awv: loading cloud data');
      this.dataLoadingProgress = 0;
      this.allYears.map((val: number, index) => {
        import(`./assets/modis_one_day/${val}_cloud_cover.csv`).then((module) => {
          const data = csvParseRows(module.default, (row, i) => {
            if (i === 0) {return {} as CloudDataElement;}
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
    
    async checkInBounds(location: CityLocation) {
      // check if a location is approximately within bounds
      // of the data. This will include a small area just outside
      const lat = location.latitudeDeg;
      const lon = location.longitudeDeg;
      // small angle approximation correct longitude by cos(lat)
      const distances = this.latitudes.map((lat2, i) => Math.sqrt((lat - lat2) ** 2 +  (Math.cos(((lat + lat2)/2)  * Math.PI/180) * (lon - this.longitudes[i])) ** 2));
      console.log('distances', Math.min(...distances));
      return Math.floor(Math.min(...distances) * 100) <= 25 * Math.sqrt(2);
    },
    
    getLatLonIndex(lat: number, lon: number): number {
      if (this.latitudes.length === 0) {
        return -1;
      }
      if (this.longitudes.length === 0) {
        return -1;
      }
      
      if (!this.inBounds) {
        console.log('getLatLonIndex: out of bounds');
        return -1;
      }
      
      // binary search using distance
      const distances = this.latitudes.map((lat2, i) => Math.sqrt((lat - lat2) ** 2 + (lon - this.longitudes[i]) ** 2));
      const minIndex = distances.indexOf(Math.min(...distances));
      // this.selectedDataIndex = minIndex;
      return minIndex;
    },
    
    
    
    updateData(display = true) {
      // simulate data loading
      this.displayData = display;
      if (display){
        this.needToUpdate = false;
      }
      this.updateMapDescriptionText();
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
    
    isLineGraphData(data: LineGraphData | (number | null)[]): data is LineGraphData {
      return (data && data[0]!=null && typeof data[0] === 'object' && 'x' in data[0]);
    },
    
    // stats methods
    mean(array: (number | null)[] | LineGraphData | undefined): number | null {
      if (array === undefined) {
        return null;
      }

      if (this.isLineGraphData(array)) {
        array = array.map((d) => d.y);
      }
      
      const arr = array.filter((v) => isNumber(v)) as number[];
      return arr.reduce((a, b) => a + b, 0) / arr.length;
    },
    
    median(array: (number | null)[] | LineGraphData | undefined): number | null {
      if (array === undefined) {
        return null;
      }

      if (this.isLineGraphData(array)) {
        array = array.map((d) => d.y);
      }
      
      const arr = array.filter((v) => isNumber(v)) as number[];
      const mid = Math.floor(arr.length / 2);
      const nums = [...arr].sort((a, b) => a - b);
      return arr.length % 2 == 0 ? (nums[mid] + nums[mid - 1]) / 2 : nums[mid];
    },
    
    updateLocationName() {
      textForLocation(this.location.longitudeDeg, this.location.latitudeDeg)
        .then((name) => {
          this.locationName = name;
        })
        .catch((e) => {
          console.error('error getting location name', e);
        });
    },
    
    updateMapDescriptionText() {
      // Displaying {{ selectedStat === 'singleyear' ? '' : statText.get(selectedStat)?.toLowerCase() }}  cloud cover for {{ selectedStat === 'singleyear' ? selectedYear : mapSubsets.get(dataSubset) }}.
      const stat = this.selectedStat === 'singleyear' ? '' : this.statText.get(this.selectedStat)?.toLowerCase();
      const subset = this.selectedStat === 'singleyear' ? this.selectedYear : this.mapSubsets.get(this.dataSubset);
      this.mapDescriptionText = `Displaying ${stat} cloud cover for ${subset}.`;
    },
    
    getCloudCoverText(val: number | null): [number | null, string | undefined] {
      const index = this.skyCoverCodeRanges.findIndex(([_key, range]) => {
        if (val === null) {
          return false;
        }
        return val >= range[0] / 100 && val <= range[1] / 100;
      });
      return [index, this.skyCoverCodes[index]];
    },
    
    cloudIcon(val: number) {
      const [index, _text] = this.getCloudCoverText(val);
      if (index == null) {
        return 'mdi-cloud-cancel';
      } 
      return this.skyCoverIcons[index];
    }
  },
  
  watch: {
    modelValue(value: boolean) {
      if (value) {
        console.log('loading data');
        this.loadEightDayData().then(() => {
          console.log('finished loading data');
          this.dataloaded = true;
          this.updateData(this.displayData);
        });
      } else {
        this.displayData = false;
      }
    }, 
    
    selectedStat(value: Statistics) {
      console.log('selectedStat', value);
      this.needToUpdate = true;
    },
    
    selectedYear(value: number) {
      console.log('selectedYear', value);
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
      
      this.checkInBounds(value).then((inBounds) => {
        this.inBounds = inBounds;
      });
      
    },
  },
  
  
});
</script>


<style lang="less">

:root {
  --color: #eac402;
  --default-font-size: 12px;
  font-size: var(--default-font-size);
}

#advanced-weather-view {
  font-size: var(--default-font-size);
  
  p.intro {
    font-size: 1.2em;
  }
  
  strong.attention {
    font-weight: bold;
    font-size: 1.1em;
    color: var(--color);
  }
  
  #chart-intro {
    
  }
    
  .graph-col {
    height: 300px;
  }

  #awv-map-description {
    font-size: 1.5em;
    font-weight: 500;
    margin-bottom: 1rem;
  }
  .map-container {
    contain: strict;
    aspect-ratio: 2;
  }
  
  .slider-underside-thumb-label {
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
    
  .sentence-query {
    font-weight: bold;
    
    
    > * {
      margin: 0.25em auto;
    }
    
    > label {
      display: block;
      color:#eac402;
      font-size: calc(var(--default-font-size)*1.875);
    }
    
    > select {
      font-size: calc(var(--default-font-size)*1.5);
    }
  }

  .select-box {
    border-bottom: 1px solid white;
    appearance: auto !important;
  }

  #awv-cloud-cover-display {
    // font-size: calc(var(--default-font-size)*1.25);
    display: grid;
    grid-template-rows: auto auto auto;
    align-items: left;
    margin-top: 1rem;
    margin-left: 1rem;
    margin-bottom: 1rem;
    font-size: 1.25em;
  }
  
  

}
</style>
./utils