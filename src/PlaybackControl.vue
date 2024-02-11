<template>
  <div id="enclosing-playback-container">
    <div id="playback-slider-container" :class="[value === 0 ? 'special-thumb' : '']">
      
      <div class="tick-container">
        <div v-for="val in index" :key="val" v-bind="options(val)" class="tick">
          <span class="tick-label"> {{ valueToMark(val) }} </span>
        </div>
        <div v-for="val in index" :key="val" v-bind="options(val)" class="tick">
          <div :class="['tick-mark',val === 0 ? 'big-mark' : '', 'elevation-20']"></div>
        </div>
      </div>
      
      <v-slider
        ref="slider"
        hide-details
        v-model="value"
        :max="index[index.length - 1]"
        :min="index[0]"
        :thumb-size="20"
        color="white"
        track-color="white"
        track-fill-color="white"
        thumb-color="blue"
        track-size="8"
        :step="step"
        >
      </v-slider>
    
    
  </div>
  </div>

  
</template>


<script lang="ts">
import { defineComponent } from 'vue';
// import VueSlider from 'vue-slider-component';
import { VSlider } from 'vuetify/components/VSlider';
import { SymmetricalLogTransform, symmLinspace } from './symlog';

const symLog = new SymmetricalLogTransform(10);

export default defineComponent({
  name: 'PlaybackControl',

  components: {
    'v-slider': VSlider,
  },

  props: {
    // Define the props here
  },

  mounted() {
    // Do something when the component is mounted
    // get height of v-input_container
    const container = document.getElementById('playback-slider-container');
    if (container) {
      // query container for the v-slider
      const input = container.querySelector(' .v-slider__container');
      if (input) {
        // get the height of the v-slider
        const height = input.clientHeight;
        // set the height of the tick-container
        container.style.setProperty('--v-slider-height', `${height}px`);
      }
    }
  },



  data() {
    return {
      // Define the data here
      data: ['a', 'b', 'c'],
      symlog: symLog,
      values: symLog.sequence(3, false),
      index: symLog.sequence(3),
      // eslint-disable-next-line vue/no-reserved-keys
      value: 0,
      myTicks: symmLinspace(1, 4, 0.1),

    };
  },

  methods: {

    // Define the methods here
    valueToMark(value: number): number | string {
      if (value === 0) return '';
      return symLog.fromSymLogIndex(value);
    },

    options(val: number) {
      const min = this.index[0];
      const max = this.index[this.index.length - 1];
      const pos = (val - min) / (max - min) * 100;
      return {
        style: {
          left: pos + '%',
        },
      };
    },

    pause() {
      this.value = 0;
    }

  },

  computed: {
    // Define the computed properties here
    marks(): Record<number, string> {
      const marks: Record<number, string> = {};
      this.index.forEach((value, i) => {
        marks[value] = value === 0 ? '' : this.values[i].toString();
      });
      return marks;
    },

    step(): number {
      const val = Math.abs(this.value) <= 1 ? 1 : 0.1;
      console.log(val);
      return val;
    }



  },

  watch: {
    // Define the watch properties here
    value(val: number) {
      if (Math.abs(val) < 1 && this.step === 0.1) {
        this.value = 0;
      }
      
      this.$emit('rate', symLog.fromSymLogIndex(val));

      
    }
  },
});

</script>

<style lang="less">
// Define the styles here

#enclosing-playback-container {
  // modify the Vuetify slifer properties
  // z-index: -1999;
  padding-inline: 0.5rem;
  padding-block-end: 0.5rem;
  padding-block-start: 1.5rem;
  margin: 0.5rem;
  border-radius: 0.5rem;
  border: 1px solid white;
  min-width: 350px;
  background-color: pink;

  #playback-slider-container {
    position: relative;
    padding-inline: 1rem;
    --v-slider-height: 32px;
    --mark-size: min(6vw, 30px);
    --big-size: calc(var(--mark-size) * 2);
    --tick-font-size: 0.75em;

    height: calc(40px + 0.75em);

    // doesn't do anything right now, but when 
    // the value is 0, this css will be active
    &.special-thumb {
      .v-slider-thumb {
        opacity: 1;
      }
    }

    // push the track to the back
    .v-slider-track * {
      opacity: 1;
      z-index: 0;
    }

    .v-slider-thumb {
      z-index: 1;
    }

    // show no progress fill
    .v-slider-track__fill {
      opacity: 0;
    }


    .tick-container {
      --height: 0px;
      --position: calc(var(--v-slider-height) + var(--height));
      margin-inline: 8px;
      position: relative;
      height: var(--height);
      transform: translateY(var(--position));
      z-index: 1;

      .tick {
        position: absolute;
        transform: translateX(-50%);
      }

      .tick-label {
        font-size: var(--tick-font-size);
        color: white;
      }

      .tick-mark {
        --size: var(--mark-size);
        --mark-offset: calc(-1 * var(--size) / 2 - var(--v-slider-height)/2);
        width: var(--size);
        height: var(--size);
        border-radius: 50%;
        transform: translateY(var(--mark-offset));
        background-color: #ddd;
        pointer-events: none;
      }

      .big-mark {
        --size: calc(var(--mark-size) * 2);
        background-color: #666;
        pointer-events: auto;


        // make a pause icon using the ::before and ::after pseudo-elements on the .v-slider-thumb
        &::before,
        &::after {
          content: '';
          position: absolute;
          top: calc(var(--size) / 4);
          width: 6px;
          height: 50%;
          background-color: white;
        }

        &::before {
          left: calc(var(--size)/3);
        }

        &::after {
          right: calc(var(--size)/3);
        }

      }



    }
  }

}
</style>