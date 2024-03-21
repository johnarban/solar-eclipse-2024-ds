<template>
  <div id="eclipse-timer-container">
    <h1> Eclipse Timer</h1>
    <div v-if="showTimer" class="eclipse-countdown">
      <div class="ec-timer">{{ timeToEclipse }}</div>
      <div>
        till max eclipse
      </div>
    </div>
    

    
    <div v-if="noEclipse">
      <p>No eclipse is predicted for this location.</p>
    </div>
    <div v-else>
      <h2 class="mb-4"> {{ type }} Eclipse</h2>
    </div>
    <div class="eclipse-data-list" v-if="!noEclipse">
      <p>Max <define-term
                    term="Eclipsed %"
                    definition="The fraction (percentage) of the Sun covered by the Moon."
                    underlined
                    />: {{ (coverage*100).toFixed(0) }}%</p>
      <p>Eclipse Duration: {{ duration }}</p>
      <table id="time-container">
        <tr class="time">
          <td class="time-label">Partial Start</td>
          <td class="time-value">{{ partialStart[1] === '' ? timeString(partialStart[0]) : 'Sun below Horizon' }}</td>
        </tr>
        <tr class="time" v-if="isTotal">
          <td class="time-label">Totality Start</td>
          <td class="time-value">{{ centralStart[1] === '' ? timeString(centralStart[0]) : 'Sun below Horizon' }}</td>
        </tr>
        <tr class="time">
          <td class="time-label">Max Eclipse</td>
          <td class="time-value">{{ maxTime[1] === '' ? timeString(maxTime[0]) : 'Sun below Horizon' }}</td>
        </tr>
        <tr class="time" v-if="isTotal">
          <td class="time-label">Totality End</td>
          <td class="time-value">{{ centralEnd[1] === '' ? timeString(centralEnd[0]) : 'Sun below Horizon' }}</td>
        </tr>
        <tr class="time">
          <td class="time-label">Partial End</td>
          <td class="time-value">{{ partialEnd[1] === '' ? timeString(partialEnd[0]) : 'Sun below Horizon' }}</td>
        </tr>
      </table>
    </div>
    <!-- utc/local time preference switch -->
    <hr class="mt-4" style="width:100%">
    <v-btn-toggle 
      class="mt-2"
      v-model="tzPref"  
      :color="color" 
      divided 
      mandatory 
      hide-details
      variant="outlined"
      >
      <v-btn value="UTC" size="small" height="2em" >UTC</v-btn>
      <v-btn value="Local" size="small" height="2em" >Local ({{ tzCode }})</v-btn>
    </v-btn-toggle>
  </div>
</template>

<script lang="ts">
import { defineComponent, PropType } from 'vue';
import { EclipseData, BSRArray } from './eclipse_types';
import { formatInTimeZone } from "date-fns-tz";
import { VBtnToggle } from 'vuetify/components/VBtnToggle';
import { VBtn } from 'vuetify/components/VBtn';
import DefineTerm from './DefineTerm.vue';

const dayInMs = 1000 * 60 * 60 * 24;
const hourInMs = 1000 * 60 * 60;
const minuteInMs = 1000 * 60;
const secondInMs = 1000;

export default defineComponent({
  name: 'EclipseTimer',
  
  components: {
    'v-btn-toggle': VBtnToggle,
    'v-btn': VBtn,
    'define-term': DefineTerm,
  },
  
  props: {
    prediction: {
      type: Object as PropType<EclipseData<Date>>,
      required: true,
    },
    
    showTimer: {
      type: Boolean,
      default: false,
      required: false,
    },
    
    timezone: {
      type: String,
      default: 'UTC',
      required: false,
    },
    
    color: {
      type: String,
      default: 'white',
      required: false,
    },
  },
  
  mounted() {
    this.getTimeToEclipse();
    setInterval(this.getTimeToEclipse, 1000);
  },
  
  
  
  data() {
    return {
      pred: this.prediction,
      tzPref: 'Local' as 'UTC' | 'Local',
      // partialStart: this.prediction.partialStart[0],
      // centralStart: this.prediction.centralStart[0],
      // maxTime: this.prediction.maxTime[0],
      // centralEnd: this.prediction.centralEnd[0],
      // partialEnd: this.prediction.partialEnd[0],
      // magnitude: this.prediction.magnitude[0],
      // coverage: this.prediction.coverage[0],
      duration: this.prediction.duration,
      timeToEclipse: '',
    };
  },
  
  
  computed: {
    type(): '' | 'Partial' | 'Annular' | 'Total' {
      switch (this.prediction.type) {
      case 'P':
        return 'Partial';
      case 'A':
        return 'Annular';
      case 'T':
        return 'Total';
      default:
        return '';
      }
    },
    
    noEclipse(): boolean {
      return this.prediction.type === '';
    },
    
    isTotal(): boolean {
      return this.prediction.type === 'T';
    },
    
    timeString(): (date: Date | null) => string {
      return (date: Date | null) => {
        if (date === null) return '';
        return this.tzPref === 'UTC' ? this.toUtcString(date) : this.toLocalString(date);
      };
    },
    
    tzCode(): string {
      return formatInTimeZone(new Date(), this.timezone, 'z');
    },
    
    partialStart() {
      return this.circumstance(this.prediction.partialStart, 'Partial Start');
    },
    
    partialEnd() {
      return this.circumstance(this.prediction.partialEnd, 'Partial End');
    },
    centralStart() {
      return this.circumstance(this.prediction.centralStart, 'Central Start');
    },
    centralEnd() {
      return this.circumstance(this.prediction.centralEnd, 'Central End');
    },
    maxTime() {
      return this.circumstance(this.prediction.maxTime, 'Max Eclipse');
    },
    magnitude(): number {
      return this.prediction.magnitude[0];
    },
    coverage(): number {
      return this.prediction.coverage[0];
    },
    
  },
  
  methods: {
    toUtcString(date: Date | null): string {
      if (date === null) return '';
      try {
        return formatInTimeZone(date, 'UTC', 'h:mm:ss aaa' );
      } catch (e) {
        console.error(e);
        console.error(date);
        return '';
      }
    },
    
    toLocalString(date: Date | null): string {
      if (date === null) return '';
      try {
        return formatInTimeZone(date, this.timezone, 'h:mm:ss aaa' );
      } catch (e) {
        console.error(e);
        console.error(date);
        return '';
      }
    },
    
    circumstance(data: BSRArray<Date | null>, _normal = ''): [Date | null, string] {
      const [t, c] = data;
      if (c === 's') return [t, 'Sunset'];
      if (c === 'r') return [t, 'Sunrise'];
      if (c === 'b') return [t, 'Below Horizon'];
      return [t, ''];
    },
      
    getTimeToEclipse() {
      const now = new Date();
      if (this.type === '') return '';
      if (this.maxTime[0] === null) return '';
      const timeToEclipse = this.maxTime[0].getTime() - now.getTime();
      
      const days = Math.floor(timeToEclipse / dayInMs);
      const hours = Math.floor((timeToEclipse % dayInMs) / hourInMs);
      const minutes = Math.floor((timeToEclipse % hourInMs) / minuteInMs);
      const seconds = Math.floor((timeToEclipse % minuteInMs) / secondInMs);
      
      this.timeToEclipse = `${days} days ${hours}h ${minutes}m ${seconds}s`;
    }
  }
  
  
});
</script>


<style scoped lang="less">
#eclipse-timer-container {
  position: relative;
  width: max-content;
  margin: 0 auto;
  padding: 0.5em;
  
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;

  font-size: var(--default-font-size);
  ;
}

.eclipse-countdown {
  text-align: center;
  margin-bottom: 0.5em;
  min-width: 20em;
}

.ec-timer {
  font-size: 1.5em;
  font-family: Courier, monospace;
}

.eclipse-data-list{
  font-size: var(--default-font-size);
}

.v-btn {
  text-transform: none;
}

table {
  width: 100%;
  border-collapse: collapse;
  margin-top: 1em;
  
}

tr {

}

td {
  padding: 0.5em;
}

label {
  display: block;
  font-size: 1.5em;
  margin-bottom: 0.5em;
  margin-inline: auto;
  
}

</style>