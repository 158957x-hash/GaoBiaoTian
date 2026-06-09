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
  340123: "feixi",
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
  anhui: anhuiFeatures.map((feature) => toBoundaryFeature(feature, [340100], [340100])),
  hefei: hefeiFeatures.map((feature) => toBoundaryFeature(feature, [340123], [340123])),
  feixi: feixiFeatures.map((feature) => toBoundaryFeature(feature, [340123], [])),
};
