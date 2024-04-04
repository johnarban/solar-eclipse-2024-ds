<template>
  <div class="info-overlay-container" id="weather-forecast-container">   
    <h1>Forecast</h1>
    <p v-if="time !== null" class="time-location"> for April 8 at <span class="omf-hl"> {{ localTimeString }}</span>, the hour of max eclipse at <span class="omf-hl">{{ locationStr }}</span></p>
    <p v-else class="time-location"> Not provided for locations where the eclipse is not visible</p>
    
    <div v-if="time !== null" class="forecast-table-div">
      <div v-if="forecastForHour === null">
        <v-icon size="35">mdi-cloud-cancel</v-icon>
        <div>No data for this hour</div>
      </div>
      
      <div v-else>
        <!-- <v-icon size="35">{{ cloudIcon(forecastForHour.cloud_cover) }}</v-icon> -->
        <table class="forecast-table">
          <tr>
            <td>Cloud cover:</td>
            <td>{{ forecastForHour.cloud_cover }}%</td>
          </tr>
          <tr>
            <td>Temperature:</td>
            <td>{{ cfPref === 'C' ? forecastForHour.temperature_2m : celsiusToFahrenheit(forecastForHour.temperature_2m) }}°{{ cfPref }}</td>
          </tr>
          <tr v-if="forecastForHour.precipitation_probability !== undefined">
            <td>Precipitation Probability:</td>
            <td>{{ forecastForHour.precipitation_probability }}%</td>
          </tr>
          <tr v-if="forecastForHour.precipitation !== undefined">
            <td>Precipitation:</td>
            <td>{{ forecastForHour.precipitation }} mm</td>
          </tr>
        </table>
      </div>
      <v-btn-toggle 
        class="mt-3 align-center"
        v-model="cfPref"  
        color="#eac402" 
        density="compact"
        divided 
        mandatory 
        hide-details
        variant="outlined"
        >
        <v-btn value="C" size="small" height="2em" >°C</v-btn>
        <v-btn value="F" size="small" height="2em" >°F</v-btn>
      </v-btn-toggle> 
    </div>
    <div class="acknowledgement">
        <p>
          Forecast powered by <a href="https://open-meteo.com" target="_blank">Open-Meteo</a> using <span v-if="openMeteoApi==='gfs'">NOAA GFS
            (<a href="https://www.ncei.noaa.gov/products/weather-climate-models/global-forecast" target="_blank">Global</a>
              & <a href="https://rapidrefresh.noaa.gov/hrrr/" target="_blank">HRRR</a>) forecast models. </span> 
              <span v-else>the <a href="https://www.ecmwf.int/en/forecasts/datasets/open-data" target="_blank">ECMWF</a> forecast model. </span>
              <!-- create <a> tag to switch between gfs and ecmwf -->
        </p>
        <p class="mt-2">
              Use the <a href="" @click.prevent="openMeteoApi = openMeteoApi === 'gfs' ? 'ecmwf' : 'gfs'">{{ openMeteoApi === 'gfs' ? 'ECMWF' : 'NOAA GFS' }}</a> forecast model instead.
        </p>
    </div>

  </div>
</template>

<script lang="ts">
/* eslint-disable @typescript-eslint/naming-convention */
import { defineComponent, PropType} from 'vue';
import { formatInTimeZone } from "date-fns-tz";


const RATE_LIMIT = 1; // calls per second
  

type LocationDeg = {
  latitudeDeg: number;
  longitudeDeg: number;
};

interface Forecast {
  elevation: number;
    generationtime_ms: number;
  hourly: {
    time: string[];
    cloud_cover: number[];
    temperature_2m: number[];
    precipitation_probability?: number[];
    precipitation?: number[];
  };
    hourly_units: {
    time: string;
    cloud_cover: string;
    temperature_2m: string;
    precipitation_probability?: string;
    precipitation?: string;
    
  };
  latitude: number;
  longitude: number;
  timzone: string;
  timezone_abbreviation: string;
  
  utc_offset_seconds: number;
}

// hour forecast is a subset of the forecast
interface HourForecast {
  time: string;
  cloud_cover: number;
  temperature_2m: number;
  precipitation_probability: number | undefined;
  precipitation: number | undefined
}

type WeatherModel = 'gfs' | 'ecmwf';

export default defineComponent({
  name: 'OpenMeteoForecast',
  props: {

    location: {
      type: Object as PropType<LocationDeg>,
      default: () => {return {latitudeDeg: 42, longitudeDeg: -73};},
      required: true
    },

    locationStr: {
      type: String,
      default: '',
      required: false,
    },
    
    time: {
      type: Date || null || undefined,
      default: new Date(),
      required: false
    },
    
    timezone: {
      type: String,
      default: 'america/new_york',
      required: false,
    },
    
  },
  
  data() {
    return {
      forecast: null as Forecast | null,
      madeCall: false,
      cfPref: 'F' as 'C' | 'F',
      openMeteoApi: 'gfs' as WeatherModel,
    };
  },
  
  mounted() {
    this.fetchHourlyWeather();
  },
  
  computed: {
    openMeteoAPI() {
      return `https://api.open-meteo.com/v1/${this.openMeteoApi}`;
    },
    
    utcHour() {
      if (this.time === null || this.time === undefined) {
        return null;
      }
      console.log(this.time);
      return this.time.getUTCHours();
    },

    
    localTimeString() {
      if (this.time === null || this.time === undefined) {
        return '';
      }
      // convert to 12 hour and add am/pm
      return formatInTimeZone(this.time, this.timezone, 'h a (z)');
    },
    
    parameters() {
      if (this.openMeteoApi === 'gfs') {
        return {
          latitude: this.location.latitudeDeg.toString(),
          longitude: this.location.longitudeDeg.toString(),
          hourly: ["cloud_cover", "temperature_2m", "precipitation_probability"].join(","),
          start_date: "2024-04-08",
          end_date: "2024-04-08",
          timezone: "GMT",
        };
      } else {
        return {
          latitude: this.location.latitudeDeg.toString(),
          longitude: this.location.longitudeDeg.toString(),
          hourly: ["cloud_cover", "temperature_2m", "precipitation"].join(","),
          start_date: "2024-04-08",
          end_date: "2024-04-08",
          timezone: "GMT",
        };
      }
    },
    
    forecastForHour(): null | HourForecast {
      if (this.forecast === null || this.utcHour === null) {
        return null;
      }
      // this.forecast.hourly.time format is 2024-04-04T16:00 and just want the hour
      const hour = this.forecast.hourly.time.map(time => +time.split('T')[1].split(':')[0]);
      const hourIndex = hour.indexOf(+this.utcHour);
      if (hourIndex === -1) {
        return null;
      }
      
      return {
        time: this.forecast.hourly.time[hourIndex],
        cloud_cover: this.forecast.hourly.cloud_cover[hourIndex],
        temperature_2m: this.forecast.hourly.temperature_2m[hourIndex],
        precipitation_probability: this.forecast.hourly.precipitation_probability ? this.forecast.hourly.precipitation_probability[hourIndex] : undefined,
        precipitation: this.forecast.hourly.precipitation ? this.forecast.hourly.precipitation[hourIndex] : undefined,
      };
    },
    
  },
    
  
  methods: {
    
    celsiusToFahrenheit(celsius: number) {
      return (celsius * 9 / 5 + 32).toFixed(0);
    },
    
    cloudIcon(val: number | null) {
    
      if (val == null) {
        return 'mdi-cloud-cancel';
      } 
      else if (val < .25) {
        return 'mdi-weather-sunny';
      }
      else if (val < .5) {
        return 'mdi-weather-partly-cloudy';
      } 
      else if (val < 0.9) {
        return 'mdi-weather-cloudy';
      } 
      else {
        return 'mdi-clouds';
      } 
    },
    
    resetMadeCall() {
      console.log('resetting madeCall');
      this.madeCall = true;
      setTimeout(() => {
        this.madeCall = false;
      }, 1000 / RATE_LIMIT);
    },
    
    async fetchHourlyWeather() {
      if (this.madeCall) {
        this.resetMadeCall();
        return;
      }
      this.madeCall = true;
      const queryParams = new URLSearchParams(this.parameters);
      console.log(queryParams);
      const fullURL = `${this.openMeteoAPI}?${queryParams.toString()}`;
      return fetch(fullURL)
        .then(response => response.json())
        .then(data => {
          console.log(data);
          this.forecast = data as Forecast;
        })
        .catch(error => {
          console.error('Error:', error);
        });
    }

  },
  
  watch: {
    utcHour() {
      this.fetchHourlyWeather();
    },
    
    location(val: LocationDeg, oldVal: LocationDeg) {
      if (val.latitudeDeg !== oldVal.latitudeDeg || val.longitudeDeg !== oldVal.longitudeDeg) {
        this.fetchHourlyWeather();
      }
    },
    
    madeCall(val: boolean) {
      if (val) {
        this.resetMadeCall();
      }
    },
    
    openMeteoApi() {
      this.fetchHourlyWeather();
    }
  }
   
  
});
</script>


<style scoped lang="less">

#weather-forecast-container {
  max-width: 95%;
}

.time-location {
  text-align: center;
  max-width: 90%;
  margin-top: 3%;
  font-size: calc(1.2 * var(--default-font-size));
}

span.omf-hl {
  font-weight: bold;
  color: #eac402;
}

.forecast-table-div {
  text-align: center;
}

.forecast-table {
  margin-inline: auto;
  border-collapse: collapse;
  // remove border between cells
  border-spacing: 0;
  margin-top: 3%;
  
  font-size: 1.2em;
}

.forecast-table td {
  padding: 8px;
  border-bottom: 1px solid #ccc;
}

.forecast-table td:first-child {
  font-weight: bold;
}

.acknowledgement {
  font-size: 0.9em;
  text-align: center;
  width: 90%;
  margin-inline: auto;
  margin-top: 5%;
  color: #ccc;
}

</style>