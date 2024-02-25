<template>
  <v-container class="pa-0">
    <v-col class="ma-0">
      <v-checkbox
        v-if="selectAllTop"
        label="Select All"
        v-model="selectAll"
        @change="() => handleSelectAll(selectAll)"
        hide-details
        :density="density"
        v-bind="$attrs"
      ></v-checkbox>
      <v-checkbox
        v-for="(option, index) in options"
        :key="index"
        :label="option.label"
        v-model="option.selected"
        @change="() => handleOptionChange(index)"
        hide-details
        :density="density"
        v-bind="$attrs"
      ></v-checkbox>
      <v-checkbox
        v-if="!selectAllTop"
        label="Select All"
        v-model="selectAll"
        @change="() => handleSelectAll(selectAll)"
        hide-details
        :density="density"
        v-bind="$attrs"
      ></v-checkbox>
    </v-col>
  </v-container>
</template>

<script lang="ts">
import { defineComponent, PropType } from 'vue';

type Density = null | 'default' | 'comfortable' | 'compact';

type Options = {key: string, label: string, selected: boolean }[];

export default defineComponent({
  inheritAttrs: false,
  props: {
    optionsMap: {
      type: Map as PropType<Map<string, string>>,
      required: true,
    },
    density: {
      type: String as PropType<Density>,
      default: 'dense',
    },
    selectAllTop: {
      type: Boolean,
      default: false,
    },
  },
  
  // emits: ['selected', 'selectAll'],
  // type safe emits
  emits: {
    selected: (_payload: string[]) => true,
    selectAll: (_payload: boolean) => true,
  },
  
  data() {
    return {
      options: this.getOptions() as Options,
      selectAll: false,
    };
  },
  


  methods: {
    getOptions(): Options {
      return Array.from(this.optionsMap).map(([key, value]) => {
        return {key: key, label: value, selected: false };
      });
    },
    
    handleSelectAll(value: boolean) {
      console.log('handleSelectAll', value);
      this.options.forEach(option => {
        option.selected = value;
      });
    },

    handleOptionChange(changedIndex: number) {
      const allSelected = this.options.every(option => option.selected);
      this.selectAll = allSelected;

      if (!this.options[changedIndex].selected) {
        this.selectAll = false;
      }
    },
  },

  watch: {

    options: {
      handler(newOptions: Options) {
        const allSelected = newOptions.every((option: { selected: boolean; }) => option.selected);
        this.selectAll = allSelected;
        
        if (this.selectAll) {
          this.$emit('selectAll', true);
        } else {
          this.$emit('selectAll', false);
          const selectedOptions = newOptions.filter((option: { selected: boolean; }) => option.selected);
          // emit corresponding keys from optionsMap
          this.$emit('selected', selectedOptions.map((option) => option.key));
        }
        
      },
      deep: true,
    },
    
    selectAll: {
      handler(newSelectAll) {
        console.log('selectAll', newSelectAll);
      },
    },
    
  },
});
</script>
