<!-- A ChartJS bar-chart helper. -->
<template>
  <canvas :id="canvasID" role="img" :aria-label="accessiblityLabel" class="chartjs">
    <!-- this only get's shown in a browser does not support canvas -->
    {{ accessiblityLabel }}
  </canvas>
</template>


<script lang="ts"> // Options API
import { defineComponent, PropType } from 'vue';
import { Chart , Title, BarElement, CategoryScale, LinearScale, ChartData, BarController, Tooltip } from 'chart.js';
import Color from '@kurkle/color'; // included as dependency of chart.js
import {customCanvasBackgroundColor} from './ChartPlugins';
import { ChartOptions } from 'chart.js';
import {deepMerge} from './utils';

// register plugins 
import annotationPlugin from 'chartjs-plugin-annotation';

Chart.register(Title, BarElement, CategoryScale, LinearScale, annotationPlugin, BarController, Tooltip, customCanvasBackgroundColor);

// NOTE: I don't know what this type really should be, but this makes errors go away
interface ChartContext extends CanvasRenderingContext2D {
  chart: Chart;
}

type SingleOrArray<T> = T | T[];

// eslint-disable-next-line @typescript-eslint/naming-convention
function SingleOrArrayProp<T>() {
  // TypeScript helper for single or array prop
  return [Array, String] as PropType<SingleOrArray<T>>;
}

// convenience type alias for specific ChartData
type ChartDataType = ChartData<"bar", number[], string>;

// // Esri color ramps - Blue and Yellow 12
const _colorMap = [ "#2b57d9", "#3d8799", "#77b46c", "#d4d94c", "#ffee99" ];

export default defineComponent({
  name: 'BarChart',
  // components: { 'bar': Bar},
  
  props: {
    id: {
      type: String,
      default: "",
      required: false
    },
    
    borderColor: {
      type: SingleOrArrayProp<string>(),
      default: () => ["rgba(0,0,0,0.8)"],
      required: false
    },
    
    borderWidth: {
      type: SingleOrArrayProp<number>(),
      default: () => [1],
      required: false
    },
    
    canvasColor: {
      type: String,
      default: "whitesmoke",
      required: false
    },
    
    labels: {
      type: Array<string | string[]>,
      default: [],
      required: false
    },
    
    histogramData: {
      type: Array<number>,
      default: [],
      required: true
    },
    
    colors: {
      type: SingleOrArrayProp<string>(),
      default: () => ['black'],
      required: false
    },
    
    title: {
      type: String,
      default: "",
      required: false
    },
    
    dataLabel: {
      type: String,
      default: "Data",
      required: false
    },
    
    barAnnotations: {
      type: Boolean,
      default: true,
      required: false
    },
    
    barAnnotationLabel: {
      // it should be a function which takes a data value and returns a string
      type : Function as PropType<(data: number) => string> | null,
      default: null,
      required: false
    },
    
    barLabelScale: {
      type: Number,
      default: 1,
      required: false
    },
    
    barOffset: {
      type: Number,
      default: 0,
      required: false
    },
    
    showTooltip: {
      type: Boolean,
      default: false,
      required: false
    },
    
    animated: {
      type: Boolean,
      default: false,
      required: false
    },
    
    stacked: {
      type: Boolean,
      default: false,
      required: false
    },
    
    options: {
      type: Object as PropType<ChartOptions>,
      default: () => { return {} as ChartOptions;},
      required: false
    },
    
    otherDatasets: {
      type: Object as PropType<ChartDataType["datasets"]>,
      default: () => { return [] as ChartDataType["datasets"];},
      required: false
    },
    
    showHover: {
      type: Boolean,
      default: false,
      required: false
    },
    
    showLegend: {
      type: Boolean,
      default: false,
      required: false
    },
    
    
  },
  
  data() {
    return {
      ctx: null as CanvasRenderingContext2D | null,
    };
  },
  
  computed: {
    
    canvasID() {
      return 'bar-chart' + `${this.id ? '-'+this.id : ''}`;
    },
    
    hoverColors() {
      // adapted from https://github.com/chartjs/Chart.js/blob/ef5e4d4692a3e7fc3d24b6e780f18652287907ca/src/helpers/helpers.color.ts#L29
      // We will darken the color by 50%
      if (!this.showHover) {return this.colors;}
      const interim = Array.isArray(this.colors) ? this.colors : [this.colors];
      return interim.map((color) => {
        return Color(color).darken(0.25).hexString();
      }) as string[];
    },
    
    // ChartData<chart-type, data-format, label-format>
    chartData():  ChartDataType {
      return {
        labels: this.labels as string[],
        datasets: [
          ...this.otherDatasets,
          {
            label: this.dataLabel,
            backgroundColor: this.colors,
            hoverBackgroundColor: this.hoverColors,
            borderColor: this.borderColor,
            borderWidth: this.borderWidth,
            data: this.histogramData,
          },
        ]
      };
    },
    
    chartOptions() { 
      const options = {
        responsive: true,
        maintainAspectRatio: false,
        animation: this.animated,
        scales: {
          x: {
            grid: { display: false },
            stacked: this.stacked,
          },
          y: {
            beginAtZero: true,
            grid: { display: true },
            stacked: this.stacked,
          }
        },
        plugins: {
          customCanvasBackgroundColor: {
            color: this.canvasColor,
          },
          // https://www.chartjs.org/docs/latest/configuration/title.html
          title: {
            display: this.title !== "",
            text: this.title,
            font: {
              size: 12
            }
          },
          // https://www.chartjs.org/docs/latest/configuration/legend.html
          legend: {
            display: this.showLegend,
          },
          
          tooltip: {
            enabled: this.showTooltip,
          },
          
          // https://www.chartjs.org/chartjs-plugin-annotation/latest/guide/usage.html
          annotation: {
            annotations: this.annotations
          }
        },
      };
      
      
      // deep merge with user options
      
      
      return deepMerge(options, this.options) as ChartOptions;
    },
    
    
    annotations(){
      if (!this.barAnnotations) {
        return [];
      }
      return Array.from({length: this.chartData.datasets[0].data.length}, (_, i) => this.barChartAnnotation(i));
    },
    
    accessiblityLabel(): string {
      const labels = this.chartData.labels?.reduce((acc, label, i) => {
        return acc + `${label}: ${this.chartData.datasets[0].data[i]}%, `;
      }, "");
      return `Bar chart description: ${labels}`;
    },
    
    
  },
    
  mounted() {
    // get the canvas element
    const canvas = document.getElementById(this.canvasID) as HTMLCanvasElement;
    
    // we want to draw in 2d
    this.ctx = canvas.getContext("2d");
    this.renderChart(this.ctx);
  },
  
  methods: {
    
    renderChart(ctx: CanvasRenderingContext2D | null) {
      if (ctx) {
        new Chart(ctx, {
          type: "bar",
          data: this.chartData,
          // needs 'as unknown as ChartOptions' to avoid type error
          options: this.chartOptions as unknown as ChartOptions
        });
      }
    },
    
    barChartAnnotation(dataIndex: number) {
      // https://www.chartjs.org/chartjs-plugin-annotation/latest/samples/line/datasetBars.html
      return {
        type: "line",
        borderColor: "black",
        borderWidth: 0,
        
        
        label: {
          display: true,
          backgroundColor: "whitesmoke",
          borderRadius: 0,
          color: "black",
          content: (ctx: ChartContext) =>  this.barAnnotationString(this.barValueByIndex(ctx, dataIndex)),
          position: "center",
          textAlign: "start",
          padding: 0,
        },
        xMin: dataIndex - .36,
        xMax: dataIndex + .36,
        xScaleID: "x",
        yMax: (ctx: ChartContext) => Math.min(this.barValueByIndex(ctx, dataIndex) + this.barOffset , 100),
        yMin: (ctx: ChartContext) => Math.min(this.barValueByIndex(ctx, dataIndex) + this.barOffset , 100),
        yScaleID: "y"
      };
    },
    
    barValueByIndex(ctx: ChartContext, index:number): number {
      const chart = ctx.chart;
      if (this.stacked && this.otherDatasets.length > 0) {
        return this.stackedBarValueByIndex(ctx, index);
      }
      const dataset = chart.data.datasets[chart.data.datasets.length - 1];
      return dataset.data[index] as number;
    },
    
    barAnnotationString(data: number): string {
      if (this.barAnnotationLabel) {
        return this.barAnnotationLabel(data);
      }
      return data.toFixed(2);
    },
    
    stackedBarValueByIndex(ctx: ChartContext, index:number): number {
      const chart = ctx.chart;
      let val = 0;
      for (let i=0; i<chart.data.datasets.length; i++) {
        val += chart.data.datasets[i].data[index] as number;
      }
      return val;
    }
        
  },
  
  watch: {
    // a watcher for all props
    $props: {
      handler() {
        if (this.ctx) {
          Chart.getChart(this.ctx)?.destroy();
          this.renderChart(this.ctx);
        }
      },
      deep: true
    }
  }
  
});

</script>