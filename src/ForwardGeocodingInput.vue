<template>
<div
  class="'forward-geocoding-wrapper"
  :style="cssVars"
  tabindex="0"
>
  <v-text-field
    v-model="searchText"
    class="search-text-input"
    label="Enter a location"
  ></v-text-field>
  <font-awesome-icon
    icon="magnifying-glass"
    size="lg"
    class="fa-icon"
    @click="() => $emit('text-update', searchText)"
  ></font-awesome-icon>
  <slot name="search-results"></slot>
</div>
</template>

<script lang="ts">
import { defineComponent } from "vue";
import { VTextField } from "vuetify/components/VTextField";
import { FontAwesomeIcon } from "@fortawesome/vue-fontawesome";

export default defineComponent({

  components: {
    'v-text-field': VTextField,
    'font-awesome-icon': FontAwesomeIcon
  },

  props: {
    color: { type: String, default: "#ffffff" },
    focusColor: { type: String, default: "#ffffff" },
    backgroundColor: { type: String, default: "#040404" },
  },

  data() {
    return {
      searchText: null as string | null,
    };
  },

  // Since our colors are used in compound values like e.g. box-shadows,
  // we need to directly bind to CSS variables
  computed: {
    cssVars() {
      return {
        "--color": this.color,
        "--background-color": this.backgroundColor,
        "--focus-color": this.focusColor,
        "--active-shadow": 'transparent',
        "--focus-shadow": 'transparent',
      };
    },
  }

});
</script>

<style lang="less">
.forward-geocoding-wrapper {
  width: fit-content;
  color: var(--color);
  border-color: var(--color);
  background: var(--background-color);
  padding: 6px 8px;
  border: 1px solid var(--color);
  display: flex;
  align-items: center;
  justify-content: center;
  pointer-events: auto;
  border-radius: 20px;
  gap: 8px;
  position: relative;

  &:hover {
    cursor: pointer;
  }

  &:focus {
    color: var(--focus-color);
    border-color: var(--focus-color);
  }

  &.active {
    box-shadow: 0px 0px 10px 3px var(--active-shadow);

    &:focus {
      box-shadow: 0px 0px 10px 3px var(--focus-shadow);
    }
  }
}

.v-text-field {
  width: 250px;

  & .v-input__details {
    display: none;
  }
}
</style>
