<!-- A ChartJS histogram. It will show the relative fraction of  -->
<!-- years where it was overcast, mostly cloudy, partly cloudy, few clouds, clear  -->
<template>
  <canvas :id="'cloud-histogram' + `${id ? '-'+id : ''}`" role="img" :aria-label="accessiblityLabel">
    <!-- this only get's shown in a browser does not support canvas -->
    {{ accessiblityLabel }}
  </canvas>
</template>


<script lang="ts"> // Options API
import { defineComponent } from 'vue';
import { Chart as ChartJS, Title, BarElement, CategoryScale, LinearScale, ChartData, BarController } from 'chart.js';
import annotationPlugin from 'chartjs-plugin-annotation';
import { Chart } from 'chart.js';

ChartJS.register(Title, BarElement, CategoryScale, LinearScale, annotationPlugin, BarController);

// NOTE: I don't know what this type really should be, but this makes errors go away
interface ChartContext extends CanvasRenderingContext2D {
  chart: Chart;
}

// // Esri color ramps - Blue and Yellow 12
const _colorMap = [ "#2b57d9", "#3d8799", "#77b46c", "#d4d94c", "#ffee99" ];

export default defineComponent({
  name: 'CloudHistogram',
  
  props: {
    id: {
      type: String,
      default: "",
      required: false
    },
    overcast: {
      type: Number,
      default: 0,
      required: false
    },
    
    mostlyCloudy: {
      type: Number,
      default: Math.random() * 100,
      required: false
    },
    partlyCloudy: {
      type: Number,
      default: 7,
      required: false
    },
    fewClouds: {
      type: Number,
      default: 45,
      required: true
    },
    clear: {
      type: Number,
      default: 100,
      required: true
    },
    
    colorMap: {
      type: Array as () => string[] | string,
      default: () => _colorMap,
      required: false
    },
    
    canvasColor: {
      type: String,
      default: "whitesmoke",
      required: false
    },
    
    labels: {
      type: Array<string>,
      default: null,
      required: false
    },
    
    histogramData: {
      type: Array<number>,
      default: null,
      required: false
    },
    
    barColors: {
      type: Array<string>,
      default: null,
      required: false
    },
    
    title: {
      type: String,
      default: "",
      required: false
    }
    
  },
  
  data() {
    return {
    };
  },
  
  computed: {
    
    colors() {
      // check if colorMap is an array
      if (Array.isArray(this.colorMap)) {
        return {
          clear: this.colorMap[4],
          fewClouds: this.colorMap[3],
          partlyCloudy: this.colorMap[2],
          mostlyCloudy: this.colorMap[1],
          overcast: this.colorMap[0]
        };
      } else {
        return {
          clear: this.colorMap,
          fewClouds: this.colorMap,
          partlyCloudy: this.colorMap,
          mostlyCloudy: this.colorMap,
          overcast: this.colorMap
        };
      }
    },
    
    // ChartData<chart-type, data-format, label-format>
    chartData(): ChartData<"bar", number[], string> {
      return {
        labels: this.labels ?? ["Clear", "Few Clouds", "Partly Cloudy", "Mostly Cloudy", "Overcast"],
        datasets: [
          {
            label: "Cloud Cover",
            backgroundColor: this.barColors ?? [
              this.colors.clear,
              this.colors.fewClouds,
              this.colors.partlyCloudy,
              this.colors.mostlyCloudy,
              this.colors.overcast
            ],
            borderColor: ["rgba(0,0,0,0.8)"],
            borderWidth: 1,
            data: this.histogramData ?? [
              this.clear,
              this.fewClouds,
              this.partlyCloudy,
              this.mostlyCloudy,
              this.overcast
            ]
          }
        ]
      };
    },
    
    chartOptions() { 
      return {
        responsive: true,
        maintainAspectRatio: false,
        scales: {
          x: {
            grid: { display: false }
          },
          y: {
            beginAtZero: true,
            max: 100,
            grid: { display: true },
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
            display: false
          },
          
          // https://www.chartjs.org/chartjs-plugin-annotation/latest/guide/usage.html
          annotation: {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            annotations: this.annotations as any
          }
        }
      };
    },
    
    
    annotations(){
      return Array.from({length: this.chartData.datasets[0].data.length}, (_, i) => this.barChartAnnotation(i));
    },
    
    accessiblityLabel(): string {
      // list the data values
      // const overCastString = `Overcast: ${Math.round(this.overcast)}%`;
      // const mostlyCloudyString = `Mostly Cloudy: ${Math.round(this.mostlyCloudy)}%`;
      // const partlyCloudyString = `Partly Cloudy: ${Math.round(this.partlyCloudy)}%`;
      // const fewCloudsString = `Few Clouds: ${Math.round(this.fewClouds)}%`;
      // const clearString = `Clear: ${Math.round(this.clear)}%`;
      // return `Cloud cover: ${overCastString}, ${mostlyCloudyString}, ${partlyCloudyString}, ${fewCloudsString}, ${clearString}`;
      const labels = this.chartData.labels?.reduce((acc, label, i) => {
        return acc + `${label}: ${this.chartData.datasets[0].data[i]}%, `;
      }, "");
      return `Cloud cover: ${labels}`;
    },
    
    
  },
    
  mounted() {
    const canvas = document.getElementById('cloud-histogram' + `${this.id ? '-'+this.id : ''}`) as HTMLCanvasElement;
    const ctx = canvas.getContext("2d");
    if (ctx) {
      const plugin = {
        id: 'customCanvasBackgroundColor',
        // https://www.chartjs.org/docs/latest/configuration/canvas-background.html
        beforeDraw: (chart: {ctx: CanvasRenderingContext2D, width: number, height: number}, _args: unknown, options: {'color':string}) => {
          const {ctx} = chart;
          ctx.save();
          ctx.globalCompositeOperation = 'destination-over';
          ctx.fillStyle = options.color || 'black';
          ctx.fillRect(0, 0, chart.width, chart.height);
          ctx.restore();
        }
      };
      new Chart(ctx, {
        type: "bar",
        data: this.chartData,
        options: this.chartOptions,
        plugins: [plugin]
      });
    }
  },
  
  methods: {
    
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
          content: (ctx: ChartContext) =>  this.barValueByIndex(ctx, dataIndex).toFixed(0) + "%",
          position: "center",
          textAlign: "start",
          padding: 0,
        },
        xMin: dataIndex - .36,
        xMax: dataIndex + .36,
        xScaleID: "x",
        yMax: (ctx: ChartContext) => Math.min(this.barValueByIndex(ctx, dataIndex) + 10 , 100),
        yMin: (ctx: ChartContext) => Math.min(this.barValueByIndex(ctx, dataIndex) + 10, 100),
        yScaleID: "y"
      };
    },
    
    barValueByIndex(ctx: ChartContext, index:number): number {
      const chart = ctx.chart;
      const dataset = chart.data.datasets[0];
      return dataset.data[index] as number;
    },
  }
});

</script>