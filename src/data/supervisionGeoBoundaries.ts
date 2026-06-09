import anhuiFull from "./geo/anhui_full.json";
import hefeiFull from "./geo/hefei_full.json";
import feixiBoundary from "./geo/feixi.json";
import type { LatLngExpression } from "leaflet";

type GeoFeature = {
  properties: {
    name: string;
    adcode: number;
  };
  geometry: {
    type: "Polygon" | "MultiPolygon";
    coordinates: number[][][] | number[][][][];
  };
};

type FeatureCollection = {
  features: GeoFeature[];
};

export type RegionBoundaryFeature = {
  id: string;
  name: string;
  paths: LatLngExpression[][];
  highlighted: boolean;
  drillable: boolean;
};

const regionIdByAdcode: Record<number, string> = {
  340100: "hefei",
  340200: "wuhu",
  340300: "bengbu",
  340400: "huainan",
  340500: "maanshan",
  340600: "huaibei",
  340700: "tongling",
  340800: "anqing",
  341000: "huangshan",
  341100: "chuzhou",
  341200: "fuyang",
  341300: "suzhou",
  341500: "liuan",
  341600: "bozhou",
  341700: "chizhou",
  341800: "xuancheng",
  340102: "yaohai",
  340103: "luyang",
  340104: "shushan",
  340111: "baohe",
  340121: "changfeng",
  340122: "feidong",
  340123: "feixi",
  340124: "lujiang",
  340181: "chaohu",
};

function ringToPath(ring: number[][]) {
  return ring.map(([lng, lat]) => [lat, lng] as LatLngExpression);
}

function geometryToPaths(feature: GeoFeature) {
  if (feature.geometry.type === "Polygon") {
    return (feature.geometry.coordinates as number[][][]).map(ringToPath);
  }
  return (feature.geometry.coordinates as number[][][][]).flatMap((polygon) => polygon.map(ringToPath));
}

function toBoundaryFeature(feature: GeoFeature, highlightedAdcodes: number[], drillableAdcodes: number[]): RegionBoundaryFeature {
  const adcode = feature.properties.adcode;
  return {
    id: regionIdByAdcode[adcode] ?? `region-${adcode}`,
    name: feature.properties.name,
    paths: geometryToPaths(feature),
    highlighted: highlightedAdcodes.includes(adcode),
    drillable: drillableAdcodes.includes(adcode),
  };
}

const anhuiFeatures = (anhuiFull as FeatureCollection).features;
const hefeiFeatures = (hefeiFull as FeatureCollection).features;
const feixiFeatures = (feixiBoundary as FeatureCollection).features;

export const realSupervisionBoundaries = {
  anhui: anhuiFeatures.map((feature) => toBoundaryFeature(feature, [340100], [340100, 340200, 340300, 340400, 340500, 340600, 340700, 340800, 341000, 341100, 341200, 341300, 341500, 341600, 341700, 341800])),
  hefei: hefeiFeatures.map((feature) => toBoundaryFeature(feature, [340123], [340102, 340103, 340104, 340111, 340121, 340122, 340123, 340124, 340181])),
  feixi: feixiFeatures.map((feature) => toBoundaryFeature(feature, [340123], [])),
};
