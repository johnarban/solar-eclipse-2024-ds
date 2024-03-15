
import { tooltip } from 'leaflet';
<template>
  <v-tooltip 
    :width="width"
    :open-on-click="!noClick"
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
    
    <slot name="definition">
    <div class="define-term-tooltip definition" v-html="definition">
    </div>
  </slot>

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
      required: false
    },
    definition: {
      type: String,
      required: false
    },
    inline: {
      type: Boolean,
      default: true
    },
    
    width: {
      type: String,
      default: '25ch'
    },
    noClick: {
      type: Boolean,
      default: false
    }
  }
});


</script>

<style>

.v-tooltip > .v-overlay__content {
  background: #F5F5F5 !important;
}

.define-term-tooltip.inline {
  display: inline;
  pointer-events: auto;
  font-weight: bold;
}

.define-term-tooltip.definition {
  font-size: var(--default-font-size);
  color: black;
  padding-block: 0.5em;
}


</style>