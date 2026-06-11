import { Fragment, useEffect, useMemo, useState } from "react";
import { MapContainer, Marker, Polygon, TileLayer, Tooltip, useMap } from "react-leaflet";
import L, { type LatLngBoundsExpression, type LatLngExpression } from "leaflet";
import { Layers, LocateFixed } from "lucide-react";
import { realSupervisionBoundaries } from "@/data/supervisionGeoBoundaries";
import { getRegionName, regions, type Plot } from "@/data/permanentFarmland";

type PermanentHeatStats = {
  area: number;
  avgGrade: number;
  protectionRate: number;
};

type LayerState = {
  farmland: boolean;
  highStandard: boolean;
  boundary: boolean;
};

type FarmlandMapProps = {
  plots: Plot[];
  regionId: string;
  selectedPlotId?: string;
  layers: LayerState;
  onLayersChange: (layers: LayerState) => void;
  onPlotSelect: (plot: Plot | null) => void;
  onRegionDrill: (regionId: string) => void;
  onOpenDetail: (plot: Plot) => void;
  onLocateArchive: (plot: Plot) => void;
};

type HighStandardProjectBoundary = {
  id: string;
  name: string;
  plots: Plot[];
  path: LatLngExpression[];
};

type SelectedMapItem =
  | { type: "plot"; item: Plot; subIndex: number }
  | { type: "project"; item: HighStandardProjectBoundary };

const regionView: Record<string, { center: LatLngExpression; zoom: number; bounds: LatLngBoundsExpression }> = {
  anhui: { center: [31.85, 117.25], zoom: 7, bounds: [[29.2, 114.6], [34.8, 119.8]] },
  hefei: { center: [31.86, 117.28], zoom: 10, bounds: [[31.35, 116.65], [32.35, 117.95]] },
  yaohai: { center: [31.86, 117.31], zoom: 12, bounds: [[31.78, 117.22], [31.94, 117.42]] },
  luyang: { center: [31.88, 117.27], zoom: 12, bounds: [[31.80, 117.18], [31.96, 117.38]] },
  shushan: { center: [31.87, 117.22], zoom: 12, bounds: [[31.78, 117.12], [31.96, 117.32]] },
  baohe: { center: [31.79, 117.31], zoom: 12, bounds: [[31.70, 117.22], [31.88, 117.42]] },
  changfeng: { center: [32.15, 117.18], zoom: 11, bounds: [[31.92, 116.96], [32.34, 117.42]] },
  feidong: { center: [31.88, 117.47], zoom: 11, bounds: [[31.68, 117.20], [32.08, 117.72]] },
  feixi: { center: [31.72, 117.16], zoom: 12, bounds: [[31.5, 116.94], [31.92, 117.42]] },
  lujian: { center: [31.56, 117.28], zoom: 11, bounds: [[31.38, 117.08], [31.74, 117.52]] },
  chaohu: { center: [31.60, 117.58], zoom: 11, bounds: [[31.42, 117.38], [31.78, 117.82]] },
  suzhou: { center: [33.63, 116.98], zoom: 10, bounds: [[33.05, 116.35], [34.15, 117.65]] },
  fuyang: { center: [32.9, 115.82], zoom: 10, bounds: [[32.35, 115.15], [33.35, 116.45]] },
  yongqiao: { center: [33.65, 116.99], zoom: 12, bounds: [[33.38, 116.72], [33.9, 117.28]] },
  lingbi: { center: [33.55, 117.55], zoom: 12, bounds: [[33.3, 117.25], [33.82, 117.85]] },
  yingzhou: { center: [32.87, 115.82], zoom: 12, bounds: [[32.66, 115.56], [33.1, 116.08]] },
  taihe: { center: [33.16, 115.62], zoom: 12, bounds: [[32.95, 115.36], [33.38, 115.9]] },
};

const permanentHeatData: Record<string, PermanentHeatStats> = {
  hefei: { area: 285, avgGrade: 5.2, protectionRate: 92 },
  wuhu: { area: 198, avgGrade: 5.8, protectionRate: 88 },
  bengbu: { area: 312, avgGrade: 5.5, protectionRate: 90 },
  huainan: { area: 156, avgGrade: 6.1, protectionRate: 85 },
  maanshan: { area: 142, avgGrade: 6.4, protectionRate: 83 },
  huaibei: { area: 268, avgGrade: 5.9, protectionRate: 89 },
  tongling: { area: 85, avgGrade: 6.8, protectionRate: 80 },
  anqing: { area: 342, avgGrade: 5.0, protectionRate: 91 },
  huangshan: { area: 68, avgGrade: 7.2, protectionRate: 75 },
  chuzhou: { area: 298, avgGrade: 5.3, protectionRate: 90 },
  fuyang: { area: 385, avgGrade: 4.8, protectionRate: 93 },
  suzhou: { area: 356, avgGrade: 4.9, protectionRate: 92 },
  liuan: { area: 224, avgGrade: 5.6, protectionRate: 87 },
  bozhou: { area: 278, avgGrade: 5.1, protectionRate: 90 },
  chizhou: { area: 112, avgGrade: 6.5, protectionRate: 82 },
  xuancheng: { area: 186, avgGrade: 6.0, protectionRate: 86 },
  yaohai: { area: 28, avgGrade: 6.5, protectionRate: 78 },
  luyang: { area: 35, avgGrade: 6.2, protectionRate: 82 },
  shushan: { area: 42, avgGrade: 5.8, protectionRate: 85 },
  baohe: { area: 38, avgGrade: 6.0, protectionRate: 83 },
  changfeng: { area: 68, avgGrade: 5.4, protectionRate: 88 },
  feidong: { area: 72, avgGrade: 5.2, protectionRate: 86 },
  feixi: { area: 58, avgGrade: 5.0, protectionRate: 90 },
  lujian: { area: 52, avgGrade: 5.6, protectionRate: 84 },
  chaohu: { area: 48, avgGrade: 5.8, protectionRate: 81 },
};

function getGradeHeatColor(avgGrade: number): string {
  const gradePalette = ["#0f766e", "#16a34a", "#22c55e", "#65a30d", "#84cc16", "#a3e635", "#facc15", "#f59e0b", "#f97316", "#ef4444"];
  const index = Math.min(Math.max(Math.round(avgGrade), 1), 10) - 1;
  return gradePalette[index];
}

const boundaryPolygons: Record<string, Array<{ id: string; name: string; path: LatLngExpression[] }>> = {
  suzhou: [
    { id: "yongqiao", name: "埇桥区", path: [[33.42, 116.72], [33.9, 116.8], [33.88, 117.22], [33.5, 117.32], [33.3, 117.02]] },
    { id: "lingbi", name: "灵璧县", path: [[33.32, 117.28], [33.82, 117.28], [33.86, 117.82], [33.42, 117.92], [33.22, 117.56]] },
  ],
  fuyang: [
    { id: "yingzhou", name: "颍州区", path: [[32.66, 115.56], [33.04, 115.58], [33.12, 116.02], [32.78, 116.12], [32.58, 115.82]] },
    { id: "taihe", name: "太和县", path: [[32.98, 115.38], [33.38, 115.36], [33.42, 115.82], [33.08, 115.95], [32.9, 115.64]] },
  ],
};

const gradePalette = ["#0f766e", "#16a34a", "#22c55e", "#65a30d", "#84cc16", "#a3e635", "#facc15", "#f59e0b", "#f97316", "#ef4444"];

const TIANDITU_TOKEN = "685821b861c26919e7194de5f2e0f876";
const TIANDITU_SUBDOMAINS = ["0", "1", "2", "3", "4", "5", "6", "7"];

function OfflineBasemap() {
  return (
    <>
      <TileLayer
        url={`https://t{s}.tianditu.gov.cn/img_w/wmts?SERVICE=WMTS&REQUEST=GetTile&VERSION=1.0.0&LAYER=img&STYLE=default&TILEMATRIXSET=w&FORMAT=tiles&TILEMATRIX={z}&TILEROW={y}&TILECOL={x}&tk=${TIANDITU_TOKEN}`}
        subdomains={TIANDITU_SUBDOMAINS}
        zIndex={1}
      />
      <TileLayer
        url={`https://t{s}.tianditu.gov.cn/cia_w/wmts?SERVICE=WMTS&REQUEST=GetTile&VERSION=1.0.0&LAYER=cia&STYLE=default&TILEMATRIXSET=w&FORMAT=tiles&TILEMATRIX={z}&TILEROW={y}&TILECOL={x}&tk=${TIANDITU_TOKEN}`}
        subdomains={TIANDITU_SUBDOMAINS}
        zIndex={2}
      />
    </>
  );
}

function RecenterMap({ regionId }: { regionId: string }) {
  const map = useMap();
  useEffect(() => {
    const view = regionView[regionId] ?? regionView.anhui;
    map.setMaxBounds(view.bounds);
    map.setView(view.center, view.zoom, { animate: true, duration: 0.45 });
  }, [map, regionId]);
  return null;
}

function FocusPlot({ plot }: { plot?: Plot | null }) {
  const map = useMap();
  useEffect(() => {
    if (!plot?.path.length) return;
    const bounds = L.latLngBounds(plot.path.map(([lat, lng]) => L.latLng(lat, lng)));
    map.fitBounds(bounds.pad(2.6), { animate: true, duration: 0.55, maxZoom: 16 });
  }, [map, plot]);
  return null;
}

function getGradeColor(level: number) {
  return gradePalette[Math.min(Math.max(level, 1), 10) - 1];
}

function createRegionLabelIcon(label: string, highlighted: boolean) {
  return L.divIcon({
    className: "",
    html: `<div style="min-width:60px;text-align:center;border-radius:14px;padding:4px 12px;background:${highlighted ? "rgba(0,130,150,0.78)" : "rgba(10,32,34,0.5)"};color:white;font-size:12px;font-weight:600;border:1px solid ${highlighted ? "rgba(80,240,255,0.65)" : "rgba(255,255,255,0.08)"};box-shadow:${highlighted ? "0 0 14px rgba(0,220,255,0.22)" : "none"};white-space:nowrap;">${label}</div>`,
    iconSize: [76, 26],
    iconAnchor: [38, 13],
  });
}

function getPathCenter(path: LatLngExpression[]) {
  const points = path as Array<[number, number]>;
  const total = points.reduce((sum, point) => [sum[0] + point[0], sum[1] + point[1]], [0, 0]);
  return [total[0] / points.length, total[1] / points.length] as LatLngExpression;
}

function buildProjectBoundary(groupId: string, items: Plot[], index: number) {
  const points = items.flatMap((item) => item.subPaths.flat());
  const lats = points.map(([lat]) => lat);
  const lngs = points.map(([, lng]) => lng);
  const minLat = Math.min(...lats);
  const maxLat = Math.max(...lats);
  const minLng = Math.min(...lngs);
  const maxLng = Math.max(...lngs);
  const width = Math.max(maxLng - minLng, 0.00018);
  const height = Math.max(maxLat - minLat, 0.00018);
  const padLat = Math.min(Math.max(height * 0.1, 0.00038), 0.0012);
  const padLng = Math.min(Math.max(width * 0.1, 0.00042), 0.0013);

  return {
    id: groupId,
    name: `肥西县花岗镇${["北片区", "南片区", "东片区"][index] ?? "片区"}高标准农田建设项目`,
    plots: items,
    path: [
      [maxLat + padLat * 0.55, minLng - padLng * 0.35],
      [maxLat + padLat, minLng + width * 0.26],
      [maxLat + padLat * 0.72, minLng + width * 0.62],
      [maxLat + padLat * 0.38, maxLng + padLng * 0.84],
      [minLat + height * 0.54, maxLng + padLng],
      [minLat - padLat * 0.42, maxLng + padLng * 0.42],
      [minLat - padLat, minLng + width * 0.66],
      [minLat - padLat * 0.64, minLng + width * 0.24],
      [minLat + height * 0.38, minLng - padLng],
    ] as LatLngExpression[],
  } satisfies HighStandardProjectBoundary;
}

function buildProjectBoundaries(plots: Plot[]) {
  const highStandardPlots = plots.filter((plot) => plot.isHighStandard);
  if (!highStandardPlots.length) return [];
  const centers = highStandardPlots.map((plot) => plot.latLng);
  const minLat = Math.min(...centers.map(([lat]) => lat));
  const maxLat = Math.max(...centers.map(([lat]) => lat));
  const minLng = Math.min(...centers.map(([, lng]) => lng));
  const maxLng = Math.max(...centers.map(([, lng]) => lng));
  const midLat = (minLat + maxLat) / 2;
  const midLng = (minLng + maxLng) / 2;
  const lowerCut = midLat - 0.004;
  const groups = [
    highStandardPlots.filter((plot) => plot.latLng[1] < midLng && plot.latLng[0] >= lowerCut),
    highStandardPlots.filter((plot) => plot.latLng[1] < midLng && plot.latLng[0] < lowerCut),
    highStandardPlots.filter((plot) => plot.latLng[1] >= midLng),
  ].filter((items) => items.length);
  return groups.map((items, index) => buildProjectBoundary(`permanent-high-standard-${index + 1}`, items, index));
}

export default function FarmlandMap({ plots, regionId, selectedPlotId, layers, onLayersChange, onPlotSelect, onRegionDrill, onOpenDetail, onLocateArchive }: FarmlandMapProps) {
  const [selectedMapItem, setSelectedMapItem] = useState<SelectedMapItem | null>(null);
  const selectedPlot = useMemo(() => plots.find((plot) => plot.id === selectedPlotId), [plots, selectedPlotId]);
  const mapBounds = regionView[regionId]?.bounds ?? regionView.anhui.bounds;
  const visibleRealBoundaries = realSupervisionBoundaries[regionId as keyof typeof realSupervisionBoundaries];
  const visibleFallbackBoundaries = visibleRealBoundaries ? [] : boundaryPolygons[regionId] ?? [];
  const isCounty = regions.find((region) => region.id === regionId)?.level === "county";
  const projectBoundaries = useMemo(() => buildProjectBoundaries(plots), [plots]);
  const activePlot = selectedMapItem?.type === "plot" ? selectedMapItem.item : selectedPlot;
  const activeProject = selectedMapItem?.type === "project" ? selectedMapItem.item : null;

  return (
    <>
      <style>{`
        .leaflet-tooltip {
          background: transparent !important;
          border: none !important;
          box-shadow: none !important;
          padding: 0 !important;
        }
        .leaflet-tooltip::before {
          display: none !important;
        }
        .leaflet-control-zoom {
          border: 1px solid rgba(90, 220, 220, 0.25) !important;
          border-radius: 10px !important;
          background: rgba(8, 42, 52, 0.9) !important;
          backdrop-filter: blur(8px) !important;
        }
        .leaflet-control-zoom a {
          width: 36px !important;
          height: 36px !important;
          line-height: 36px !important;
          color: #E8FFFF !important;
          background: rgba(8, 42, 52, 0.9) !important;
          border-bottom: 1px solid rgba(90, 220, 220, 0.25) !important;
          font-size: 18px !important;
          font-weight: 600 !important;
        }
        .leaflet-control-zoom a:hover {
          background: rgba(0, 130, 150, 0.78) !important;
          color: #E8FFFF !important;
        }
        .leaflet-control-zoom a:first-child {
          border-radius: 10px 10px 0 0 !important;
        }
        .leaflet-control-zoom a:last-child {
          border-radius: 0 0 10px 10px !important;
          border-bottom: none !important;
        }
        .leaflet-control-attribution {
          background: rgba(5, 35, 45, 0.68) !important;
          color: rgba(232, 255, 255, 0.6) !important;
          border: 1px solid rgba(140, 230, 235, 0.16) !important;
          border-radius: 8px !important;
          padding: 4px 8px !important;
          font-size: 11px !important;
          backdrop-filter: blur(8px) !important;
        }
        .leaflet-control-attribution a {
          color: rgba(232, 255, 255, 0.8) !important;
        }
        .leaflet-container {
          background: radial-gradient(circle at center, rgba(31,150,120,0.12), transparent 45%), linear-gradient(180deg, #041E2B 0%, #031722 100%) !important;
        }
      `}</style>
      <div className="relative h-[720px] overflow-hidden rounded-[20px] border-[1px] border-[rgba(80,210,220,0.22)] bg-[radial-gradient(circle_at_center,#062b3a_0%,#031926_70%)] shadow-[inset_0_0_40px_rgba(0,180,200,0.06),0_0_30px_rgba(0,180,200,0.15)]">
      <MapContainer center={regionView[regionId]?.center ?? regionView.anhui.center} zoom={regionView[regionId]?.zoom ?? 7} minZoom={6} maxZoom={17} maxBounds={mapBounds} className="h-[110%] w-[110%] -translate-x-[5%] -translate-y-[5%] bg-[radial-gradient(circle_at_center,rgba(31,150,120,0.12),transparent_45%),linear-gradient(180deg,#041E2B_0%,#031722_100%)] drop-shadow-[0_0_22px_rgba(55,220,180,0.22)]" scrollWheelZoom>
        <OfflineBasemap />
        <RecenterMap regionId={regionId} />
        <FocusPlot plot={selectedPlot} />
        {layers.boundary && visibleRealBoundaries?.map((boundary) => {
          const stats = permanentHeatData[boundary.id] ?? { area: 0, avgGrade: 0, protectionRate: 0 };
          const heatColor = getGradeHeatColor(stats.avgGrade);
          const isCountyLevel = !boundary.drillable && regionId !== "anhui";
          const isCountyView = regionId !== "anhui" && !["hefei", "wuhu", "bengbu", "huainan", "maanshan", "huaibei", "tongling", "anqing", "huangshan", "chuzhou", "fuyang", "suzhou", "luan", "bozhou", "chizhou", "xuancheng"].includes(regionId);
          return (
            <Fragment key={boundary.id}>
              {boundary.paths.map((path, pathIndex) => (
                <Polygon
                  key={`${boundary.id}-${pathIndex}`}
                  positions={path}
                  pathOptions={{
                    color: boundary.highlighted ? "#f8fafc" : "rgba(255,255,255,.78)",
                    weight: boundary.highlighted ? 3.2 : 1.4,
                    dashArray: undefined,
                    fillColor: heatColor,
                    fillOpacity: isCountyLevel ? (boundary.highlighted ? 0.2 : 0.08) : 0.68,
                  }}
                  eventHandlers={{
                    ...(isCountyView ? {} : {
                      mouseover: (e) => {
                        const layer = e.target;
                        layer.setStyle({
                          color: "#F7C948",
                          weight: 3,
                          fillOpacity: isCountyLevel ? 0.35 : 0.78,
                        });
                        layer.bringToFront();
                      },
                      mouseout: (e) => {
                        const layer = e.target;
                        layer.setStyle({
                          color: boundary.highlighted ? "#f8fafc" : "rgba(255,255,255,.78)",
                          weight: boundary.highlighted ? 3.2 : 1.4,
                          fillOpacity: isCountyLevel ? (boundary.highlighted ? 0.2 : 0.08) : 0.68,
                        });
                      },
                    }),
                    ...(boundary.drillable ? { click: () => onRegionDrill(boundary.id) } : {}),
                  }}
                >
                  {!isCountyLevel && (
                    <Tooltip sticky direction="top" opacity={0.96} className="region-tooltip">
                      <div className="min-w-40 rounded-lg border border-[rgba(39,215,232,0.2)] bg-[rgba(6,26,36,0.95)] p-3 text-[13px] leading-6 text-[#E8FFFF] shadow-lg backdrop-blur-sm">
                        <div className="font-semibold text-[#EAFBFF]">{boundary.name}</div>
                        <div className="text-[rgba(234,251,255,0.85)]">永久农田面积：{stats.area} 万亩</div>
                        <div className="text-[rgba(234,251,255,0.85)]">平均质量等级：{stats.avgGrade.toFixed(1)} 等</div>
                        <div className="text-[rgba(234,251,255,0.85)]">划定比例：{stats.protectionRate}%</div>
                      </div>
                    </Tooltip>
                  )}
                </Polygon>
              ))}
              <Marker position={getPathCenter(boundary.paths[0])} icon={createRegionLabelIcon(boundary.name, boundary.highlighted)} eventHandlers={boundary.drillable ? { click: () => onRegionDrill(boundary.id) } : undefined} />
            </Fragment>
          );
        })}
        {layers.boundary && visibleFallbackBoundaries.map((boundary) => (
          <Fragment key={boundary.id}>
            <Polygon positions={boundary.path} pathOptions={{ color: "#22d3ee", weight: 2, dashArray: "8 8", fillColor: "#1e3a8a", fillOpacity: 0.08 }} eventHandlers={{ click: () => onRegionDrill(boundary.id) }} />
            <Marker position={getPathCenter(boundary.path)} icon={createRegionLabelIcon(boundary.name, false)} eventHandlers={{ click: () => onRegionDrill(boundary.id) }} />
          </Fragment>
        ))}
        {layers.farmland && isCounty && plots.map((plot) => {
          const color = getGradeColor(plot.qualityLevel);
          return (
            <Fragment key={plot.id}>
              {plot.subPaths.map((subPath, subIndex) => {
                const selected = (selectedMapItem?.type === "plot" && selectedMapItem.item.id === plot.id && selectedMapItem.subIndex === subIndex) || (activePlot?.id === plot.id && subIndex === 0);
                return <Polygon key={`${plot.id}-${subIndex}`} positions={subPath} pathOptions={{ color: selected ? "#facc15" : "rgba(219,234,254,.72)", weight: selected ? 3 : 1, fillColor: color, fillOpacity: selected ? 0.78 : 0.58 }} eventHandlers={{ click: () => { onPlotSelect(plot); setSelectedMapItem({ type: "plot", item: plot, subIndex }); } }} />;
              })}
            </Fragment>
          );
        })}
        {layers.highStandard && isCounty && projectBoundaries.map((project) => {
          const selected = activeProject?.id === project.id;
          return <Polygon key={project.id} bubblingMouseEvents={false} positions={project.path} pathOptions={{ color: selected ? "#facc15" : "#38bdf8", weight: selected ? 4 : 2.6, dashArray: "10 7", fill: false }} eventHandlers={{ click: () => { onPlotSelect(null); setSelectedMapItem({ type: "project", item: project }); } }} />;
        })}
      </MapContainer>
      <div className="pointer-events-none absolute inset-x-0 top-0 z-[400] h-24 bg-gradient-to-b from-slate-950/32 to-transparent" />
      <div className="absolute left-4 top-4 z-[500] w-[280px] rounded-[10px] border border-[rgba(90,220,220,0.22)] bg-[rgba(8,42,52,0.86)] p-3 text-[#E8FFFF] shadow-2xl backdrop-blur-[8px]">
        <div className="text-[11px] font-semibold text-[rgba(232,255,255,0.6)]">永久基本农田质量一张图</div>
        <div className="text-base font-semibold text-[#E8FFFF]">{getRegionName(regionId)}</div>
      </div>
      {!isCounty && (
        <div className="absolute right-5 top-20 z-[500] w-[240px] rounded-[12px] border border-[rgba(140,230,235,0.18)] bg-[rgba(5,35,45,0.68)] p-2.5 text-white shadow-2xl backdrop-blur-[8px]">
          <div className="mb-1.5 text-[11px] font-semibold text-[#E8FFFF]">永久农田质量热力</div>
          <div className="text-[10px] text-[rgba(232,255,255,0.6)]">按平均质量等级分级设色</div>
          <div className="mt-1.5 grid grid-cols-5 gap-2">
            {["#0f766e", "#16a34a", "#22c55e", "#65a30d", "#84cc16", "#a3e635", "#facc15", "#f59e0b", "#f97316", "#ef4444"].map((color, index) => (
              <div key={color} className="flex flex-col items-center gap-1">
                <span className="h-3 w-3 rounded" style={{ backgroundColor: color }} />
                <span className="text-[10px] text-[#E8FFFF]">{index + 1}等</span>
              </div>
            ))}
          </div>
        </div>
      )}
      <div className="absolute bottom-5 left-5 z-[500] w-[240px] rounded-[12px] border border-[rgba(140,230,235,0.18)] bg-[rgba(5,35,45,0.72)] p-2.5 text-white shadow-2xl backdrop-blur-[8px]">
        <div className="mb-1.5 flex items-center gap-2 text-[11px] font-semibold text-[#E8FFFF]"><Layers className="h-3 w-3 text-[rgba(232,255,255,0.5)]" />图层控制</div>
        {[
          ["farmland", "永久农田地块"],
          ["highStandard", "高标田项目范围"],
          ["boundary", "行政区边界"],
        ].map(([key, label]) => (
          <label key={key} className="mt-1 flex items-center justify-between gap-3 rounded-[8px] bg-[rgba(255,255,255,0.04)] px-2.5 py-1.5 text-[11px] text-[#E8FFFF]">
            <span className="flex items-center gap-2"><LocateFixed className="h-3 w-3 text-[rgba(232,255,255,0.5)]" />{label}</span>
            <input checked={layers[key as keyof LayerState]} onChange={(event) => onLayersChange({ ...layers, [key]: event.target.checked })} type="checkbox" className="h-3.5 w-3.5 accent-[rgba(0,180,200,0.9)]" />
          </label>
        ))}
      </div>
      {activePlot && !activeProject && (
        <div className="absolute right-5 top-20 z-[500] w-[340px] rounded-[14px] border border-[rgba(140,230,235,0.18)] bg-[rgba(5,35,45,0.72)] p-4 text-[#E8FFFF] shadow-2xl backdrop-blur-[8px]">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-[11px] font-semibold text-[rgba(232,255,255,0.6)]">永久农田地块详情</p>
              <h3 className="mt-1 text-base font-semibold text-[#E8FFFF]">{activePlot.blockNo}</h3>
            </div>
            <button onClick={() => { setSelectedMapItem(null); onPlotSelect(null); }} className="text-xl text-[rgba(232,255,255,0.6)] hover:text-[#E8FFFF]">×</button>
          </div>
          <div className="mt-3 text-[13px] leading-6">行政区：{activePlot.city}{activePlot.county}{activePlot.town}<br />面积：{activePlot.area} 亩<br />地块等级：{activePlot.qualityLevel} 等<br />耕地类型：{activePlot.landType}<br />档案状态：{activePlot.archiveStatus}</div>
          <div className="mt-4 grid grid-cols-2 gap-2">
            <button onClick={() => onOpenDetail(activePlot)} className="rounded-[10px] bg-[rgba(0,130,150,0.78)] px-4 py-2 text-[13px] font-semibold text-[#E8FFFF] shadow-lg border border-[rgba(80,240,255,0.65)] hover:bg-[rgba(0,150,170,0.85)]">查看完整档案</button>
            <button onClick={() => onLocateArchive(activePlot)} className="rounded-[10px] bg-[rgba(255,255,255,0.08)] px-4 py-2 text-[13px] font-semibold text-[#E8FFFF] border border-[rgba(140,230,235,0.25)] hover:bg-[rgba(255,255,255,0.15)]">定位档案库</button>
          </div>
        </div>
      )}
      {activeProject && (
        <div className="absolute right-5 top-20 z-[500] w-[350px] rounded-[14px] border border-[rgba(140,230,235,0.18)] bg-[rgba(5,35,45,0.72)] p-4 text-[#E8FFFF] shadow-2xl backdrop-blur-[8px]">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-[11px] font-semibold text-[rgba(232,255,255,0.6)]">高标田项目范围详情</p>
              <h3 className="mt-1 text-base font-semibold text-[#E8FFFF]">{activeProject.name}</h3>
            </div>
            <button onClick={() => setSelectedMapItem(null)} className="text-xl text-[rgba(232,255,255,0.6)] hover:text-[#E8FFFF]">×</button>
          </div>
          <div className="mt-3 grid grid-cols-2 gap-3 text-[13px]">
            <div className="rounded-[10px] bg-[rgba(255,255,255,0.06)] p-3"><b>关联地块</b><br />{activeProject.plots.length} 个</div>
            <div className="rounded-[10px] bg-[rgba(255,255,255,0.06)] p-3"><b>建设面积</b><br />{activeProject.plots.reduce((sum, plot) => sum + plot.area, 0).toFixed(1)} 亩</div>
            <div className="rounded-[10px] bg-[rgba(255,255,255,0.06)] p-3"><b>平均等级</b><br />{(activeProject.plots.reduce((sum, plot) => sum + plot.qualityLevel, 0) / activeProject.plots.length).toFixed(1)} 等</div>
            <div className="rounded-[10px] bg-[rgba(255,255,255,0.06)] p-3"><b>建设状态</b><br />已建高标田</div>
          </div>
          <div className="mt-4 rounded-[10px] bg-[rgba(255,255,255,0.06)] p-3 text-[11px] font-semibold leading-6 text-[rgba(232,255,255,0.7)]">虚线边界表示高标田项目范围，内部彩色面表示永久基本农田地块等级。</div>
        </div>
      )}
      <div className="absolute bottom-5 right-5 z-[500] rounded-[12px] border border-[rgba(140,230,235,0.18)] bg-[rgba(5,35,45,0.72)] p-3 text-[11px] text-[#E8FFFF] shadow-2xl backdrop-blur-[8px]">
        <div className="mb-2 font-semibold text-[#E8FFFF]">地块等级色表</div>
        <div className="grid grid-cols-5 gap-2">
          {gradePalette.map((color, index) => <div key={color} className="flex items-center gap-1"><span className="h-3 w-3 rounded-sm" style={{ backgroundColor: color }} /><span>{index + 1}等</span></div>)}
        </div>
      </div>
    </div>
    </>
  );
}
