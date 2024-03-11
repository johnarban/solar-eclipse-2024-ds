<template>
  <v-tooltip
    v-model="tooltip"
    :location="tooltipLocation"
    :open-on-click="tooltipOnClick"
    :open-on-focus="tooltipOnFocus"
    :open-on-hover="tooltipOnHover"
    :offset="tooltipOffset"
    :disabled="!tooltipText || !showTooltip"
  >
    <template v-slot:activator="{ props }: { props: Record<string,any> }">
      <div
        v-bind="props"
        :id="buttonID"
        :class="['forward-geocoding-wrapper', {'active': modelValue}]"
        @click="handleAction"
        @keyup.enter="handleAction"
        @touchstart="handleTouchStart"
        @touchend="handleTouchEnd"
        :style="cssVars"
        tabindex="0"
      >
      <v-text-field
        v-if="open"
        v-model="searchText"
        class="search-text-input"
        label="Enter location name"
      ></v-text-field>
      <font-awesome-icon
        v-if="open"
        icon="times"
        size="lg"
        :class="['fa-icon']"
        @click="open = false"
      ></font-awesome-icon>
      <font-awesome-icon
        :icon="open ? 'check' : 'magnifying-glass'"
        size="lg"
        :class="['fa-icon']"
        @click="() => {
          if (!open) {
            open = true;
          } else {
            $emit('text-update', searchText);
            searchText = null;
            open = false;
          }
        }"
      ></font-awesome-icon>
      </div>
    </template>
    <span>{{ tooltipText }}</span>
  </v-tooltip>
</template>

<script lang="ts">
import { defineComponent } from "vue";
import { VTooltip } from "vuetify/components/VTooltip";
import { VTextField } from "vuetify/components/VTextField";
import { FontAwesomeIcon } from "@fortawesome/vue-fontawesome";

export default defineComponent({

  components: {
    'v-tooltip': VTooltip,
    'v-text-field': VTextField,
    'font-awesome-icon': FontAwesomeIcon
  },

  props: {
    modelValue: { type: Boolean, required: false },
    color: { type: String, default: "#ffffff" },
    focusColor: { type: String, default: "#ffffff" },
    backgroundColor: { type: String, default: "#040404" },
    longPressTimeMs: { type: Number, default: 500 },
    tooltipText: { type: String, required: false },
    tooltipLocation: { type: String, default: "start" },
    tooltipOnClick: { type: Boolean, default: false },
    tooltipOnFocus: { type: Boolean, default: false },
    tooltipOnHover: { type: Boolean, default: true },
    tooltipOffset: { type: [String, Number], default: 0 },
    showTooltip: { type: Boolean, default: true },
  },

  methods: {
    updateValue() {
      if (this.modelValue === undefined) { return; }
      this.$emit('update:modelValue', !this.modelValue); 
    },

    handleAction() {
      this.updateValue();
      this.$emit('activate');
    },

    handleTouchStart() {
      this.longPressTimeout = setTimeout(() => {
        this.tooltip = true;
      }, this.longPressTimeMs);
    },

    handleTouchEnd() {
      if (this.longPressTimeout) {
        clearTimeout(this.longPressTimeout);
        this.longPressTimeout = null;
      }
      this.tooltip = false;
    }
  },

  data() {
    return {
      tooltip: false,
      open: false,
      searchText: null as string | null,
      longPressTimeout: null as ReturnType<typeof setTimeout> | null
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

    buttonID() {
      const id = this.$attrs['id'];
      return id ? `${id}-button` : null;
    }
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
