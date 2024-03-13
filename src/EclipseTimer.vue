<template>
  <div id="eclipse-timer-container">
    <h1> Eclipse Timer</h1>
    <span class="eclipse-countdown">{{ timeToEclipse }}</span>
    <!-- utc/local time preference switch -->
    <v-btn-toggle 
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
    <div v-if="noEclipse">
      <p>No eclipse is predicted for this location.</p>
    </div>
    <div v-else>
      <h2 class="mb-4"> {{ type }} Eclipse</h2>
    </div>
    <div class="eclipse-data-list" v-if="!noEclipse">
      <p>Eclipse <define-term 
                    definition="The fraction of the Sun covered by the Moon. If a total eclipse, then it is the ratio of the area of the Moon to the area of the Sun. >1 means the apparent size of the Moon is larger than the Sun."
                    term="Magnitude"
                    />: {{ magnitude }}</p>
      <p>Eclipse <define-term
                    term="Coverage"
                    definition="The fraction of the Sun covered by the Moon."
                    />: {{ coverage }}%</p>
      <p>Eclipse Duration: {{ duration }}</p>
      <table id="time-container">
        <tr class="time">
          <td class="time-label">Partial Start</td>
          <td class="time-value">{{ timeString(partialStart) }}</td>
        </tr>
        <tr class="time" v-if="isTotal">
          <td class="time-label">Totality Start</td>
          <td class="time-value">{{ timeString(centralStart) }}</td>
        </tr>
        <tr class="time">
          <td class="time-label">Max Eclipse</td>
          <td class="time-value"> {{ timeString(maxTime) }} </td>
        </tr>
        <tr class="time" v-if="isTotal">
          <td class="time-label">Totality End</td>
          <td class="time-value">{{ timeString(centralEnd) }}</td>
        </tr>
        <tr class="time">
          <td class="time-label">Partial End</td>
          <td class="time-value"> {{ timeString(partialEnd) }}  </td>
        </tr>
      </table>
    </div>
    
  </div>
</template>

<script lang="ts">
import { defineComponent, PropType } from 'vue';
import { EclipseData } from './eclipse_types';
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
      tzPref: 'UTC' as 'UTC' | 'Local',
      partialStart: this.prediction.partialStart[0],
      centralStart: this.prediction.centralStart[0],
      maxTime: this.prediction.maxTime[0],
      centralEnd: this.prediction.centralEnd[0],
      partialEnd: this.prediction.partialEnd[0],
      magnitude: this.prediction.magnitude[0],
      coverage: this.prediction.coverage[0],
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
    }
    
  },
  
  methods: {
    toUtcString(date: Date | null): string {
      if (date === null) return '';
      return formatInTimeZone(date, 'UTC', 'h:mm:ss aaa' );
    },
    
    toLocalString(date: Date | null): string {
      if (date === null) return '';
      return formatInTimeZone(date, this.timezone, 'h:mm:ss aaa' );
    },
    
    getTimeToEclipse() {
      const now = new Date();
      if (this.type === '') return '';
      if (this.maxTime === null) return '';
      const timeToEclipse = this.maxTime.getTime() - now.getTime();
      
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
  font-size: 2em;
  margin-bottom: 0.5em;
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