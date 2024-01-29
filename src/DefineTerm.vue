
import { tooltip } from 'leaflet';
<template>
  <v-tooltip 
    width="25ch"
    :open-on-click="true"
    :open-on-hover="true"
    :open-on-focus="true"
    >
    <template v-slot:activator="{props}" >
      <div :class="['define-term-tooltip', inline ? 'inline' : '']" v-bind="props">
        <slot name="term">
          {{ term }}
        </slot>
      </div>
    </template>
    
    
    <div class="define-term-tooltip defintion">
        {{ definition }}
    </div>

    </v-tooltip>
</template>
  

<script lang="ts">
import { defineComponent } from "vue";
import { VTooltip } from "vuetify/components/VTooltip";

export default defineComponent({
  name: 'DefineTerm',
  components: {
    'v-tooltip': VTooltip,
  },
  props: {
    term: {
      type: String,
      required: true
    },
    definition: {
      type: String,
      required: true
    },
    inline: {
      type: Boolean,
      default: true
    }
  }
});
</script>

<style>

.define-term-tooltip {
  
}

.define-term-tooltip.inline {
  display: inline;
  pointer-events: auto;
  text-decoration: underline;
}

.define-term-tooltip.defintion {
  font-size: 0.8em;
}


</style>