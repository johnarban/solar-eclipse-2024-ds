<!-- Vue component for plotting a scatter plot of x,y data in Chart.js -->
<template>
    <canvas :id="canvasID" class="chartjs"></canvas>
</template>

<script lang="ts">
import { defineComponent, PropType } from "vue";
import Chart from "chart.js/auto"; 
import { ChartData } from "chart.js";
import { PointStyle } from "chart.js";
import {customCanvasBackgroundColor} from './ChartPlugins';
import 'chartjs-adapter-date-fns';
import annotationPlugin from 'chartjs-plugin-annotation';


Chart.register(customCanvasBackgroundColor, annotationPlugin);

type OrderedPair = { 
  x: Date | number,
  y: number 
};

type SubsetStyle = {
  backgroundColor?: string,
  borderColor?: string,
  borderWidth?: number,
  radius?: number,
  pointStyle?: PointStyle,
};

export default defineComponent({
  name: "LineChart",

  data() {
    return {
      uuid: Math.random().toString(8).slice(2,9)
    };
  },

  props: {
    id: {
      type: String,
      default: "",
      required: false,
    },
    
    scatterData: {
      type: Array as PropType<OrderedPair[]>,
      required: false,
      default: () =>[]
    },

    lineData: {
      type: Array as PropType<OrderedPair[]>,
      required: false,
      default: () => [],
    },
    
    otherData: {
      type: Array as PropType<ChartData[]>,
      required: false,
      default: () => [],
    },
    
    timeseries: {
      type: Boolean,
      required: false,
      default: false,
    },
    
    scatterLabel: {
      type: String,
      required: false,
      default: "Scatter",
    },
    
    lineLabel: {
      type: String,
      required: false,
      default: null,
    },
    
    color: {
      // the color the data or line
      type: String,
      required: false,
      default: 'black',
    },

    borderColor: {
      type: String,
      required: false,
      default: 'black',
    },
    
    borderWidth: {
      type: Number,
      required: false,
      default: 1,
    },
    
    
    lineColor: {
      type: String,
      required: false,
      default: null,
    },
    
    lineWidth: {
      type: Number,
      required: false,
      default: null,
    },
    
    xRange: {
      type: Array<number | Date>,
      required: false,
    },

    yRange: {
      type: Array<number>,
      required: false,
      default: () => null as unknown as Array<number>,
    },

    showLine: {
      type: Boolean,
      required: false,
      default: false,
    },

    showScatter: {
      type: Boolean,
      required: false,
      default: false,
    },

    animated: {
      type: Boolean,
      required: false,
      default: false,
    },
    
    showTooltip: {
      type: Boolean,
      required: false,
      default: false,
    },
    
    showLegend: {
      type: Boolean,
      required: false,
      default: false,
    },
    
    reverseY: {
      type: Boolean,
      required: false,
      default: false,
    },

    reverseX: {
      type: Boolean,
      required: false,
      default: false,
    },

    hideXAxis: {
      type: Boolean,
      required: false,
      default: false,
    },

    hideYAxis: {
      type: Boolean,
      required: false,
      default: false,
    },

    scatterOptions: {
      type: Object,
      required: false,
      default: () => ({}),
    },
    
    lineOptions: {
      type: Object,
      required: false,
      default: null,
    },

    bothAxisOptions: {
      type: Object,
      required: false,
      default: () => ({}),
    },

    xAxisOptions: {
      type: Object,
      required: false,
      default: () => ({}),
    },

    yAxisOptions: {
      type: Object,
      required: false,
      default: () => ({}),
    },

    show: {
      type: Boolean,
      required: false,
      default: true,
    },
    
    xTickFormatter: {
      type: Function,
      required: false,
      default: null,
    },
    
    yTickFormatter: {
      type: Function,
      required: false,
      default: (value: number) => value,
    },
    
    annotations: {
      type: Array,
      required: false,
      default: () => [],
    },
    
    subsets: {
      type: Array<boolean[]>,
      required: false,
      default: () => [],
    },
    
    subsetStyles: {
      type: Array<SubsetStyle>,
      required: false,
      default: () => [],
    },
    
    title: {
      type: String,
      required: false,
      default: "",
    },
    
  },
  mounted() {
    this.draw();
  },
  methods: {

    getKey(obj: { [key: string]: unknown}  , key: string, defaultKey: string | null = null) {
      // check if obj has key
      if (key in obj) {
        return obj[key as keyof typeof obj];
      } else if (defaultKey != null && defaultKey in obj) {
        return obj[defaultKey as keyof typeof obj];
      }
    },
    
    oomFloor(val: number) {
      const abs = Math.abs(val);
      const oOM = Math.floor(Math.log10(abs));
      const mag = Math.pow(10, oOM - Math.sign(oOM));
      return Math.floor(val / mag) * mag - Math.pow(10, oOM);
    },
    
    oomCeil(val: number) {
      const abs = Math.abs(val);
      const oOM = Math.floor(Math.log10(abs));
      const mag = Math.pow(10, oOM  - Math.sign(oOM));
      return Math.ceil(val / mag) * mag  + Math.pow(10, oOM);
    },
    
    draw() {
      
      const canvas = document.getElementById(this.canvasID) as HTMLCanvasElement;
      const ctx = canvas?.getContext('2d');
      
      if (ctx == null) {
        return;
      }
      
      const oldChart = Chart.getChart(ctx);
      if (oldChart) {
        oldChart.destroy();
      }

      new Chart(ctx, {
        data: this.chartData,
        options: this.chartOptions,
      });

    },
    
    
  },

  computed: {
    
    canvasID() {
      if (this.id) {
        return 'line-chart-' + this.id;
      } else {
        return 'line-chart-' + this.uuid;
      }
    },

    
    computedScatterData() {

      if (this.scatterData.length == 0) {
        return [{ x: undefined, y: undefined }];
      }
      
        
      // if (this.scatterData[0].x instanceof Date) {
      //   console.log("is a date");
      //   return this.scatterData.map(d => ({ x: (d.x as Date).getTime(), y: d.y }));
      // } 
      return this.scatterData;
    },

    computedLineData() {
      if (this.showLine && this.lineData) {
        if (this.lineData.length == 0) {
          return this.computedScatterData;
        }
        
        if (this.lineData.length > 0) {
          return this.lineData;
        } 
      }
      return [{ x: null, y: null}];
    },
    
    
    defaultScatterStyle() {
      return {
        color: 'red',
        backgroundColor: this.color,
        borderColor: this.borderColor,
        borderWidth: this.borderWidth,
        radius: 3,
        pointStyle: 'circle',
        ...this.scatterOptions,
      };
    },
    
    styleBySubset() {
      const styles = this.computedScatterData.map((_d, i) => {
        if ((this.subsets.length > 0) ) {
          const index = this.subsets.map((subset) => subset[i]).indexOf(true);
          if (index >= 0) {
            return {...this.defaultScatterStyle, ...this.subsetStyles[index]};
          }
        }
        return this.defaultScatterStyle;
      });
      
      return {
        backgroundColor: styles.map(s => s.backgroundColor),
        borderColor: styles.map(s => s.borderColor),
        borderWidth: styles.map(s => s.borderWidth),
        radius: styles.map(s => s.radius),
        pointStyle: styles.map(s => s.pointStyle),
      };
      
    },
    

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    chartData(): any {
      // https://www.chartjs.org/docs/latest/configuration/elements.html#point-configuration
      const scatterData = {
        type: 'scatter',
        label: this.scatterLabel,
        data: this.computedScatterData,
        ...this.styleBySubset,
      };
      const lineData = {
        type: 'line',
        showLine: this.showLine,
        label: this.lineLabel ?? this.scatterLabel,
        data: this.computedLineData,
        backgroundColor: 'transparent',
        radius: 0,
        borderColor: this.lineColor ?? this.color,
        borderWidth: this.lineWidth ?? this.borderWidth,
        ...this.lineOptions
      };

      let outData = [];


      if (this.showScatter) {
        outData.push(scatterData);
      }
      
      if (this.showLine) {
        outData.push(lineData);
      }
      
      if (outData.length == 0) {
        outData = [scatterData, lineData];
      }
      
      outData = [...outData, ...this.otherData];
      
      return { datasets: outData };

    },

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    chartOptions(): any {
      const options =  {
        animation: this.animated,
        maintainAspectRatio: false,
        responsive: true,
        scales: {
          x: {
            display: !this.hideXAxis,
            type: this.timeseries ? 'time' : 'linear',
            reverse: this.reverseX,
            max: this.xRange ? this.xRange[1] : undefined,
            min: this.xRange ? this.xRange[0] : undefined,
            width: 3,
            ...this.bothAxisOptions,
            ...this.xAxisOptions,
            ticks: {
              callback: this.xTickFormatter,
            },
          },
          // https://www.chartjs.org/docs/latest/axes/styling.html#tick-configuration
          y: {
            display: !this.hideYAxis,
            type: 'linear',
            reverse: this.reverseY,
            max: this.yRange ? this.yRange[1] : undefined,
            min: this.yRange ? this.yRange[0] : undefined,
            width: 3,
            ...this.bothAxisOptions,
            ...this.yAxisOptions,
          }
        },

        plugins: {
          legend: {
            display: this.showLegend
          },
          customCanvasBackgroundColor: {
            color: 'white'
          },
          tooltip: {
            enabled: this.showTooltip
          },
          
          annotation: {
            annotations: this.annotations
          },
          
          title: {
            display: this.title !== "",
            text: this.title,
            font: {
              size: 12
            }
          },
          
          
        }
      };

      
      return options;
    },

    
  },

  // what data and update the chart as it changes
  watch: {
    $props: {
      handler() {
        this.draw();
      },
      deep: true
    }
  }

});

</script>

<style lang="less">


</style>
