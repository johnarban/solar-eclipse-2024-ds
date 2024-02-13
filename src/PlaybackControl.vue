<template>
  <div id="enclosing-playback-container">
    <div id="playback-slider-container">
      
      <div id="tick-container">
        <div v-for="val in index" :key="val" v-bind="options(val)" class="tick">
          <span class="tick-label"> {{ valueToMark(val) }} </span>
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
        :show-ticks="useBuiltInTicks ? 'always' : false"
        :ticks="useBuiltInTicks ? marks : undefined"
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
  
  emits: ['update:modelValue'],

  props: {
    // Define the props here
    modelValue: {
      type: Number,
      default: 0,
    },
    maxPower: {
      type: Number,
      default: 3,
    },
    
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
    
    // create a resize observer for enclosing-playback-container
    // that adjusts it's scale relative to a certain width
    const resizeObserver = new ResizeObserver((entries) => {
      for (const _entry of entries) {
        
        const track = document.querySelector('.v-slider-track') as HTMLElement;
        const container = document.getElementById('enclosing-playback-container') as HTMLElement;
        const tickContainer = document.querySelector('#tick-container') as HTMLElement;
        const input = container.querySelector('.v-slider__container');
        const psc = document.querySelector('#playback-slider-container') as HTMLElement;
        if (track && container) {
          container.style.setProperty('--track-width', `${track.clientWidth}px`);
        }
        if (tickContainer && input && psc) {
          psc.style.setProperty('--v-slider-height', `${input.clientHeight}px`);
        }
        
        // if container width is more than 300px use .normal-screen on psc
        if (container.clientWidth <= 300) {
          psc.classList.add('small-screen');
        } else {
          psc.classList.remove('small-screen');
        }
        
      }
    });
    resizeObserver.observe(document.getElementById('enclosing-playback-container')!);
  },



  data() {
    return {
      // Define the data here
      data: ['a', 'b', 'c'],
      symlog: symLog,
      values: symLog.sequence(this.maxPower, false),
      index: symLog.sequence(this.maxPower),
      // eslint-disable-next-line vue/no-reserved-keys
      myTicks: symmLinspace(1, this.maxPower+1, 0.1),
      useBuiltInTicks: true,

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
    // the model value
    value: {
      get() {
        return symLog.toSymlogIndex(this.modelValue);
      },
      set(val: number) {
        this.$emit('update:modelValue', Math.round(symLog.fromSymLogIndex(val)));
      },
    },
    
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
      
      // this.$emit('rate', symLog.fromSymLogIndex(val));

      
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
  min-width: 200px;
  background-color: #272727;
  --track-wdith: 0px; // get set by the resize observer to the actual track width
  --tick-color: #ddd;
  

  #playback-slider-container {
    position: relative;
    padding-inline: 0.5rem;
    --v-slider-height: 32px;
    --tick-font-size: 0.7rem;
    --psc-offset: calc(-1*var(--tick-font-size)/2);

    height: calc(var(--v-slider-height) + var(--tick-font-size));
    transform: translateY(var(--psc-offset));
    
    .v-slider-track__tick-label {
      display: none;
    }
    
    .track-tick-size {
      font-size: var(--v-slider-track-size);
      --v-slider-tick-size: clamp(2em, calc(.075 * var(--track-width)), 4em); // scale with track size
      border-radius: 50%;
    }
    
    .pause-color {
      --pause-color: rebeccaPurple !important;
      background-color: var(--pause-color);
      &.v-slider-track__tick--filled {
        background-color: var(--pause-color);
      }
    }
    
    // the zero tick mark
    .v-slider-track__tick[style="inset-inline-start: 50%;"] {
      .track-tick-size();
      width: calc(var(--v-slider-tick-size) * 2);
      height: calc(var(--v-slider-tick-size) * 2);
      transform: translate(-50%, -50%);
      --pause-gap: 0.5rem;
      .pause-color();
      
      
      
      &::before,
      &::after {
        content: '';
        position: absolute;
        top: 50%;
        left: 50%;
        transform: translate(-50%, -50%);
        width: 6px;
        height: 50%;
        background-color: white;
        
      }

      &::before {
        left: calc(50% - var(--pause-gap));
      }

      &::after {
        left: calc(50% + var(--pause-gap));
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
    
    .v-slider-track__tick {
      .track-tick-size();
      
      background-color: var(--tick-color);
      
      &.v-slider-track__tick--filled {
        // margin-inline-start: calc(100% - var(--v-slider-tick-size) - 1px); // default
        background-color: var(--tick-color);
      }
      
      &.v-slider-track__tick--first {
        // margin-inline-start: calc(var(--v-slider-tick-size) + 1px); // default
        margin-inline-start: 0px;
      }
      
      &.v-slider-track__tick--last {
        // margin-inline-start: calc(100% - var(--v-slider-tick-size) - 1px); // default
        margin-inline-start: 100%;
      }
    
    }
      
    &.small-screen {
      .v-slider-track__tick[style="inset-inline-start: 50%;"] {
        width: calc(var(--v-slider-tick-size) * 4);
        height: calc(var(--v-slider-tick-size) * 4);
        .pause-color();
        --pause-gap: 0.25rem;
        &::before,
        &::after {
          width: 3px;
        }
        &::before {
        left: calc(50% - var(--pause-gap));
      }

      &::after {
        left: calc(50% + var(--pause-gap));
      }
      }
      
      .v-slider-track__tick {
        --v-slider-tick-size: 1em;
        background-color: #aaa;
      }
      
    }
      
    
  }
  
      
      
  


    #tick-container {
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

    }
  }


</style>