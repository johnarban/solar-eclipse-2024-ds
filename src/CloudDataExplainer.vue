<template>
  <v-dialog id="cloud-data-explainer"
    v-model="value"
    close-on-back
    close-on-esc
    max-height="90%"
    scrollable
  >
  <v-card
    class="align-self-center"
    max-height="80%"
    height="500px"
    max-width="90%"
    >
    
  
      <!-- create tab like buttons which set the tab -->
      <v-card-title>
        <v-btn-toggle class="button-tabs flex-wrap" density="default" v-model="tab" color="primary">
          <v-btn class="no-text-transform" density="default" value="cloud-data">About Cloud Cover Data</v-btn>
          <v-btn class="no-text-transform" density="default" value="stats">Statistical Concepts</v-btn>
          <v-btn class="no-text-transform" density="default" value="weather">Weather Patterns</v-btn>
        </v-btn-toggle>
        <!-- <v-icon class="close-button" @click="value = false">mdi-close</v-icon> -->
        <font-awesome-icon
              size="xl"
              class="close-button"
              color="#eac402"
              icon='square-xmark'
              @click="value = !value"
              @keyup.enter="value = !value"
              tabindex="0"
              tooltip-location="start"
            /> 
      </v-card-title>
      <v-card-text>
        <v-window v-model="tab">
          
          <v-window-item value="cloud-data">
            <p>
              NASAs <a href="https://modis.gsfc.nasa.gov/" target="_blank">MODIS Aqua and Terra</a> satellites 
                provide daily views of the entire surface of the Earth and measure the cloud cover.
                This is provided as the <strong>cloud cover fraction - <em>the percentage of the sky at a given location that is covered 
                by clouds</em></strong>. We are using MODIS Aqua cloud cover data product as provided by the 
                  <a href="https://neo.gsfc.nasa.gov/view.php?datasetId=MYDAL2_E_CLD_FR" taget="_blank">NASA Near Earth Observations (NEO)</a> website.
                <!-- The daily data can have gaps and processing artefacts, so the 8-day average 
                provies a more reliable measure of the cloud cover for a given time. -->
            </p>
            
            <details class="faq">
              <summary>What is the difference between 1-day and 8-day cloud cover maps?</summary>

              <p>
                NASA provides the cloud cover data in 1-day, 8-day (and, not included, 30-day) averages. 
                <ul>
                  <li>The <strong>1-day (daily)</strong> data maps display historic cloud cover for each April 8<sup>th</sup> from 2003 to 2023. </li>
                  <li>The <strong>8-day average</strong> gives average of the 1-day data from April 7-14 from 2003 to 2023. </li>
                </ul>
                The daily data can have gaps and processing artefacts, so the 8-day average provides a more reliable measure of the cloud cover at every location on the map. 
                <!-- Also, the 8-day average gives us more data to draw conclusions from. -->
                Because weather can vary considerably from hour-to-hour and day-to-day, the longer interval of the 8-day average gives us more data 
                  from which we can draw better conclusions about the possible weather conditions in a given location. 
                <!-- (MODIS also offers month-long averages of the data, but we opted not to include that here to improve performance and data load times.) -->
              </p>

            </details>
            
            
            <details class="faq">
              <summary>How does the percent cloud cover relate to what I might see in a weather report?</summary>
              <p>
                We group the percent cloud cover based on the <a href="https://www.weather.gov/mrx/pfm_explain" target="_blank">bins from the National Weather Service</a>:
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
              <summary>Why is 2022 missing from the year list?</summary>
              <p>
                Sometimes satellites go offline or there are issues transmitting data back to Earth. 
                On March 31, 2022 the MODIS Aqua satellite entered SAFE mode, only returning to normal operations on April 17, 2022.
                <!-- https://mcst.gsfc.nasa.gov/iot/pm1weekly2022-0852022-091, Event summary https://mcst.gsfc.nasa.gov/news/aqua-safe-mode-event -->
                No cloud cover data is available from Mar 31 - Apr 16, 2022. <a href="https://mcst.gsfc.nasa.gov/news/aqua-safe-mode-event" target="_blank">View event summary</a>. 
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
                The mean is the average of all values in the dataset. It is calculated by adding all the values together and dividing by the number of values. This is the statistic people are probably more familiar with and is often interpreted as a single value that “best” represents an entire data set.
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
          
          </v-window-item>
          
          <v-window-item value="weather">

            <details class="faq">
              <summary> What is El Niño / La Niña?</summary>
                You might have heard the terms El Niño or La Niña. 
                They refer to weather patterns that are associated with a slight warming (“El Niño”) or cooling (“La Niña”) of 
                  the surface water in the Pacific Ocean relative to normal (“Neutral”). These are part of what is called the El Niño Southern Oscillation (ENSO) cycle.
                These different conditions can impact weather worldwide, so we provide the option of filtering the historical cloud data based on these classifications. 
                <a href="https://oceanservice.noaa.gov/facts/ninonina.html" taget="_blank">Learn more about these fascinating weather phenomena</a> from the NOAA National Ocean Service. 
            </details>
            
            <details class="faq">
              <summary> What years are El Niño, La Niña, or Neutral?</summary>
              We use the <a href="https://psl.noaa.gov/enso/past_events.html" target="_blank">NOAA list of past ENSO events</a> to classify years as El Niño, La Niña, or Neutral.
              Their list is based on the presence of an active El Niño or La Niña pattern during the months of December, January, and February. 
              As an ENSO typiclly last several months (or even years), this provides a decent indication a how likely April is to have the same pattern.
              
              <p> We duplicate a portion of the list below:</p>
              <table>
                <tr>
                  <td> El Niño</td>
                  <td>2003, 2007, 2010, 2016</td>
                </tr>
                <tr>
                  <td> La Niña</td>
                  <td>2008, 2011, 2012, 2021, 2022</td>
                </tr>
                
                <tr>
                  <td> Neutral</td>
                  <td>2004, 2005, 2006, 2009, 2013, 2014, 2015, 2017, 2018</td>
                </tr>
              </table>
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
      <v-btn @click="value = false">Close</v-btn>
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
    }
  }
  
});
</script>




<style scoped lang="less">

strong {
  font-weight: bold;
  color: #eac402;
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
}


.close-button {
  cursor: pointer;
  position: absolute;
  top: 0.125em;
  right: 0.125em;
}


</style>