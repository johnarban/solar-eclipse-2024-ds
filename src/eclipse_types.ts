/* eslint-disable @typescript-eslint/naming-convention */
/* eslint-disable @typescript-eslint/no-explicit-any */
export type EclipseForm = {
  latd: number;
  latm: number;
  lats: number;
  lond: number;
  lonm: number;
  lons: number;
  alt: number;
  tzh: {
    selectedIndex: number;
    options: number[];
  };
  tzm: {
    selectedIndex: number;
    options: number[];
  };
  tzx: {
    selectedIndex: "W" | "E";
    options: { "W": 1 , "E": -1 };
  };
  latx: {
    selectedIndex: "N" | "S";
    options: { "N": 1 , "S": -1 };
  };
  lonx: {
    selectedIndex: "W" | "E";
    options: { "W": 1 , "E": -1 };
  };
  cityndx: {
    selectedIndex: number;
    value: undefined;
  };
  loc_name: string;
};


export class Observer {
  latDeg: number;
  lonDeg: number;
  latRad: number;
  lonRad: number;
  alt: number;
  tz: number;
  
  constructor(
    latDeg: number,
    lonDeg: number,
    alt: number,
    tz: number,
  ) {
    this.latDeg = latDeg;
    this.lonDeg = lonDeg;
    this.latRad = latDeg * Math.PI / 180;
    this.lonRad = lonDeg * Math.PI / 180;
    this.alt = alt;
    this.tz = tz;
  }
  
  getGeo(): [number, number] {
    // Get the observer's geocentric position
    const tmp = Math.atan(0.99664719 * Math.tan(this.latRad));
    const geo1 =
      0.99664719 * Math.sin(tmp) +
      (this.alt / 6378140.0) * Math.sin(this.latRad);
    const geo2 =
      Math.cos(tmp) + (this.alt / 6378140.0) * Math.cos(this.latRad);
    return [geo1, geo2];
  }
  
  getObserverConstants(): [number, number, number, number, number, number] {
    return [this.latRad, this.lonRad, this.alt, this.tz, ...this.getGeo()];
  }
    
}
  
export type Degrees = number;
export type Radians = number;
export type JulianDate = number;
export type Altitude = number;
export type Timezone = number;

export type SunBSR = 'b' | 's' | 'r' | null;
export type BSRArray<T> = [T, SunBSR];

export interface EclipseData<TimeType> {
  date: string;
  type: 'P' | 'A' | 'T' | "";
  partialStart: BSRArray<TimeType> ;
  sunAltStart: BSRArray<number>;
  centralStart: BSRArray<TimeType>;
  maxTime: BSRArray<TimeType>;
  maxAlt: BSRArray<number>;
  maxAzi: number;
  centralEnd: BSRArray<TimeType>;
  partialEnd: BSRArray<TimeType>;
  sunAltEnd: BSRArray<number>;
  magnitude: BSRArray<number>;
  coverage: BSRArray<number>;
  duration: string;
}

