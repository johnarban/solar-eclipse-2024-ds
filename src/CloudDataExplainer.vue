<template>
  <v-dialog id="cloud-data-explainer"
    v-model="value"
    close-on-back
    close-on-esc
    scrollable
    :fullscreen="fullscreen"
  >
  <v-card
    class="align-self-center"
    max-height="80%"
    height="500px"
    max-width="90%"
    min-width="90%"
    >
    
  
      <!-- create tab like buttons which set the tab -->
      <v-card-title>
        <v-tabs selected-class="selected-tab" height="1.5rem" v-model="tab" :direction="$vuetify.display.width < 765 ? 'vertical' : 'horizontal'">
          <v-tab class="no-text-transform" value="cloud-data">About Cloud Cover Data</v-tab>
          <v-tab class="no-text-transform" value="stats">Statistical Concepts</v-tab>
          <v-tab class="no-text-transform" value="weather">Weather Patterns</v-tab>
        </v-tabs>
      </v-card-title>
      <v-card-text>
        <v-window v-model="tab">
          
          <v-window-item value="cloud-data">
            <p>
              NASA's Aqua and Terra satellites provide daily views of the entire surface of Earth. The <a href="https://modis.gsfc.nasa.gov/" target="_blank">MODIS</a> instrument on these satellites helps scientists learn about conditions in our atmosphere and oceans. We display the calculated <strong>cloud cover fraction</strong>&#8212;the percentage of the sky at a given location that is covered by clouds&#8212;from MODIS (on the Aqua satellite), as provided by the NASA Near Earth Observations (<a href="https://neo.gsfc.nasa.gov/view.php?datasetId=MYDAL2_E_CLD_FR" target="_blank">NEO</a>) website.
                <!-- The daily data can have gaps and processing artefacts, so the 8-day average 
                provies a more reliable measure of the cloud cover for a given time. -->
            </p>
            
            <details class="faq">
              <summary>What is the difference between 1-day and 8-day cloud cover maps?</summary>

              <p>
                NASA provides the cloud cover data in 1-day, 8-day (and, not included, 30-day) averages. 
                <ul>
                  <li>The <strong>1-day (daily)</strong> data maps display historic cloud cover for each April 8<sup>th</sup> from 2003 to 2023. </li>
                  <li>The <strong>8-day</strong> maps display an average of the 1-day data from April 7-14 from 2003 to 2023. </li>
                </ul>
              </p>
              <p>
                If you compare the 1-day vs. the 8-day maps, you'll notice that the 1-day maps often have more data at the extreme ends, either mostly clear or cloudy. The 8-day maps tend to have more data concentrated in the middle bins of partly cloudy or mostly cloudy. If you average together days that are clear and cloudy, you will end up with something in the middle. The 1-day maps are not subject to this "smearing" effect of averaging over many days of data.
              </p>
              <p>
                The daily data can have gaps and processing artefacts, so the 8-day average provides a more reliable measure of the cloud cover at every location on the map. Because weather can vary considerably from hour-to-hour and day-to-day, the longer interval of the 8-day average gives us more data from which we can draw better conclusions about the possible weather conditions in a given location. 
              </p>
            </details>            
            <details class="faq">
              <summary>How does the percent cloud cover relate to what I might see in a weather report?</summary>
              <p>
                We group the percent cloud cover based on the <a href="https://www.weather.gov/mrx/pfm_explain" target="_blank">bins</a> from the National Weather Service:
                <table>
                  <tr>
                    <th>Percentage</th>
                    <th>Cloud Cover</th>
                  </tr>
                  <tr>
                    <td>0-25%</td>
                    <td>Clear</td>
                  </tr>
                  <tr>
                    <td>25-50%</td>
                    <td>Partly Cloudy</td>
                  </tr>
                  <tr>
                    <td>51-87%</td>
                    <td>Mostly Cloudy</td>
                  </tr>
                  <tr>
                    <td>88-100%</td>
                    <td>Cloudy / Overcast</td>
                  </tr>
                </table>
              </p>

            </details>
            <details class="faq">
              <summary>Why use data from the Aqua satellite instead of Terra?</summary>
              <p>
                We use data from the Aqua satellite because its cloud cover measurements are taken in the afternoon, which corresponds better to the time of day of the April Eclipse.
              </p>
            </details>
            
            <details class="faq">
              <summary>Why is 2022 missing from the year list?</summary>
              <p>
                Sometimes satellites go offline, or there are issues transmitting data back to Earth. 
                On March 31, 2022 the Aqua satellite entered SAFE mode, only returning to normal operations on April 17, 2022.
                <!-- https://mcst.gsfc.nasa.gov/iot/pm1weekly2022-0852022-091, Event summary https://mcst.gsfc.nasa.gov/news/aqua-safe-mode-event -->
                No cloud cover data is available from Mar 31 - Apr 16, 2022. View the event <a href="https://mcst.gsfc.nasa.gov/news/aqua-safe-mode-event" target="_blank">summary</a>. 
              </p>
            </details>
            <details class="faq">
              <summary>Why are 30-day maps not available?</summary>
              <p>
                MODIS offers month-long averages of the data, but we opted not to include that here to improve performance and data load times.
              </p>
            </details>

            
          </v-window-item>
          
          <v-window-item value="stats">
            
            <p>
              You might be familiar with the terms mean and median from math and science classes, but it helps to see them applied in real life, to get a better feel for what they really mean and how they are helpful.
            </p>
            
            <details class="faq">
              <summary>What is a mean?</summary>
              <p>
                The mean is the average of all values in the dataset. It is calculated by adding all the values together and dividing by the number of values. This is the statistical term people are probably more familiar with and is often interpreted as a single value that “best” represents an entire data set.
              </p>
            </details>
            
            <details class="faq">
              <summary>What is a median?</summary>
              <p>
                The median is the middle of the dataset. Half of the data is above the median and half is less than or equal to the median. The median encourages thinking in terms of probability. You could say that given the historical cloud data over the last 20 years, there is a 50-50 chance the cloud cover will be higher or lower than the median value.
              </p>
            </details>
            
            <details class="faq">
              <summary>How are these statistics applied in the Cloud Data Explorer?</summary>
              <p>
                These quantities are calculated and displayed for every location shown on the map, depending on your selections in the dropdown menus.
              </p>
              <p>
                When you choose a specific location on the map, the mean and median of the cloud cover amounts are displayed for that location over the selected range of years. You can also display cloud cover values for a single year at a time.
              </p>
            </details>
            
            
            <details class="faq">
              <summary><v-icon>mdi-chart-bar</v-icon> What is in the chart on the  {{ smAndUp ? 'left' : 'top' }}?</summary>
              <p>
                The left hand graph is called a histogram. For your selected location, it tells you how many years since 2003 were Clear, Partly Cloudy, Mostly Cloudy, or Cloudy at this location. If you have filtered the data by El Niño, Neutral, or La Niña years, your chosen subset will be colored with the blue to white gradient, while the rest of the years will appear gray.
              </p>
            </details>

            <details class="faq">
              <summary><v-icon>mdi-chart-scatter-plot</v-icon> What is in the graph on the {{ smAndUp ? 'right' : 'bottom' }}?</summary>
              <p>
                The right hand graph is a scatter plot showing the cloud cover for your chosen location for each year since 2003. If you have filtered the data by El Niño, Neutral, or La Niña years, or for a single year, those data points will be displayed in yellow. The background of the graph shows what cloud cover values correspond to the weather conditions of Clear, Partly Cloudy, etc.
              </p>
            </details>
          </v-window-item>
          
          <v-window-item value="weather">

            <p>
              You might have heard the terms <strong>El Niño</strong> or <strong>La Niña</strong>. They refer to weather patterns that are associated with a slight warming (“El Niño”) or cooling (“La Niña”) of the surface water in the Pacific Ocean relative to normal (“Neutral”). These are part of what is called the El Niño Southern Oscillation (ENSO) cycle. These different conditions can impact weather worldwide, so we provide the option of filtering the historical cloud data based on these classifications. <a href="https://oceanservice.noaa.gov/facts/ninonina.html" target="_blank">Learn more</a> about these fascinating weather phenomena from the NOAA National Ocean Service. 
            </p>
            
            <details class="faq">
              <summary> What years are considered El Niño, La Niña, or Neutral?</summary>
              <p>
                We use NOAA's <a href="https://psl.noaa.gov/enso/past_events.html" target="_blank">list</a> of past ENSO events to classify years as El Niño, La Niña, or Neutral. As that page explains, there is not a single accepted way to define which of these categories we are in.
                Their list is based on the presence of an active El Niño or La Niña pattern during the months of December, January, and February. As an ENSO typically last several months (or even years), this provides a decent indication a how likely April is to have the same pattern.
              </p>
              <p> For the years included in our data set, they classify them as follows:
              <table>
                <tr>
                  <td> <strong>El Niño</strong>: </td>
                  <td>2003, 2007, 2010, 2016</td>
                </tr>
                <tr>
                  <td> <strong>Neutral</strong>: </td>
                  <td>2004, 2005, 2006, 2009, 2013, 2014, 2015, 2017, 2018</td>
                </tr>
                <tr>
                  <td> <strong>La Niña</strong>: </td>
                  <td>2008, 2011, 2012, 2021, 2022, 2023</td>
                </tr>
              </table>
            </p>
              <p>
              If you want to see what the ENSO conditions were in March/April in the past, see the "MEI.v2 Values" at this NOAA <a href="https://psl.noaa.gov/enso/mei/" target="_blank">website</a>. 
            </p>
            </details>


            <details class="faq">
              <summary>What kind of year is 2024?</summary>
              As of early 2024, we are in an El Niño pattern. 
              The Climate Prediction Center of the National Weather Service <a href="https://www.cpc.ncep.noaa.gov/products/analysis_monitoring/enso_advisory/ensodisc.shtml" target="_blank">reports</a> an 83% chance that 
              we will transition to a <em>neutral</em> pattern some time from April - June. 
            </details>
            
          </v-window-item>
        </v-window>

    </v-card-text>
    
    <v-card-actions>
      <v-spacer></v-spacer>
      <v-btn color="#eac402" variant="flat" @click="value = false">Close</v-btn>
    </v-card-actions>
    
  </v-card>
  </v-dialog>
</template>


<script lang="ts">
import { defineComponent } from 'vue';

type Tab = 'intro' | 'cloud-data' | 'stats' | 'weather';

export default defineComponent({
  name: 'CloudDataExplainer',
  
  props: {
    modelValue: {
      type: Boolean,
      default: true,
      required: true
    },
    initialTab: {
      type: String as () => Tab,
      default: 'intro'
    },
    
    fullscreen: {
      type: Boolean,
      default: false
    }
  },
  
  data() {
    return {
      tab: this.initialTab as Tab
    };
  },
  
  computed: {
    value: {
      get() {
        return this.modelValue;
      },
      set(value: boolean) {
        this.$emit('update:modelValue', value);
      }
    },
    
    smAndUp() {
      return this.$vuetify.display.smAndUp;
    }
    
  }
  
});
</script>




<style scoped lang="less">

strong {
  font-weight: bold;
}

h3 {
  color:#eac402;
}

a {
  text-decoration: none;
  font-weight: bold;
  color: #6facf1; // lighter variant of sky color
  pointer-events: auto;
}

ul {
  padding-inline: 2em;
  margin-bottom: 1em;
}

details.faq {
  padding-block: 0.7em;
  padding-inline: 1.2em;
  height: fit-content;
  background-color: #38464f;
  margin: 0.5em auto;
  
  summary {
    font-weight: bold;
    cursor: pointer;
  }
  
  
  p {
    padding-top: 0.5em;
    padding-inline: 1em;
  }

}

.no-text-transform {
  text-transform: none !important;
  height: 1rem;
  text-align: left;
  white-space: pre-wrap;
}


.close-button {
  cursor: pointer;
  position: absolute;
  top: 0.125em;
  right: 0.125em;
}

.selected-tab {
  background-color: #eac3021d;
}

</style>