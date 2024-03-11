<template>
  <div v-if="value != null" :class='["label-icon-value-text-container",variant]'>
    <div v-if="!hideLabel" class="label-icon-value-text-label"> <slot>{{ label }}:</slot> </div>
    <div v-if="!hideIcon" class="label-icon-value-text-icon"><v-icon size="35">{{ cloudIcon(value) }}</v-icon></div>
    <div v-if="!hideValue" class="label-icon-value-text-label-value">{{ Math.ceil(value * 100) }} % </div>
    <div v-if="!hideText" class="label-icon-value-text-label-text"> {{ getText(value)[1] }} </div>
  </div>
</template>


<script lang="ts">
import { defineComponent, PropType } from 'vue';

export type Range = [string, [number, number]];

export default defineComponent({
  name: 'CloudCoverLine',
  props: {
    value: {
      type: Number as PropType<number | null>,
      required: true,
    },
    
    label: {
      type: String,
      default:"",
      required: true,
    },
    
    hideLabel: {
      type: Boolean,
      default: false,
    },
    
    hideIcon: {
      type: Boolean,
      default: false,
    },
    
    hideValue: {
      type: Boolean,
      default: false,
    },
    
    hideText: {
      type: Boolean,
      default: false,
    },
    
    codes: {
      type: Array<string>,
      required: true,
    },
    
    
    ranges: {
      type: Array<Range>,
      required: true,
    },
    
    icons: {
      type: Array<string>,
      required: true,
    },
    
    variant: {
      type: String as PropType<'bold' | 'normal'>,
      default: "normal",
    },
    
  },
  methods: {
    getText(val: number | null): [number | null, string | undefined] {
      const index = this.ranges.findIndex(([_key, range]) => {
        if (val === null) {
          return false;
        }
        return val >= range[0] / 100 && val <= range[1] / 100;
      });
      return [index, this.codes[index]];
    },
    
    cloudIcon(val: number) {
      const [index, _text] = this.getText(val);
      if (index == null) {
        return 'mdi-cloud-cancel';
      } 
      return this.icons[index];
    }
  },
});

</script>

<style scoped lang="less">

  .label-icon-value-text-container {
    display: grid;
    grid-template-columns: 10ch 50px auto auto;
    gap: 5px;
    align-items: center;
    justify-content: space-between;
  }

  .label-icon-value-text-icon {
    display: grid;
    align-items: center;
    justify-content: center;
  }

  .label-icon-value-text-label {
    padding-left: 10px;
    font-weight: bold;

  }

  .label-icon-value-text-label-value {
    /* no text wrapping */
    white-space: nowrap;
    font-weight: bold;
  }

  .label-icon-value-text-label-text {
    font-weight: normal;
  }

  .bold {
    font-size: 1.1em;
  }


  .bold > .label-icon-value-text-label-text {
    font-weight: bold;
  }
</style>