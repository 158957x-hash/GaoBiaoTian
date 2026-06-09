import { Fragment, useEffect, useMemo, useState } from "react";
import { MapContainer, Marker, Polygon, useMap } from "react-leaflet";
import L, { type LatLngBoundsExpression, type LatLngExpression } from "leaflet";
import { Layers, LocateFixed } from "lucide-react";
import { realSupervisionBoundaries } from "@/data/supervisionGeoBoundaries";
import { getRegionName, regions, type Plot } from "@/data/permanentFarmland";

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
  suzhou: { center: [33.63, 116.98], zoom: 10, bounds: [[33.05, 116.35], [34.15, 117.65]] },
  fuyang: { center: [32.9, 115.82], zoom: 10, bounds: [[32.35, 115.15], [33.35, 116.45]] },
  changfeng: { center: [32.15, 117.18], zoom: 12, bounds: [[31.92, 116.96], [32.34, 117.42]] },
  feidong: { center: [31.88, 117.47], zoom: 12, bounds: [[31.68, 117.2], [32.08, 117.72]] },
  feixi: { center: [31.72, 117.16], zoom: 12, bounds: [[31.5, 116.94], [31.92, 117.42]] },
  yongqiao: { center: [33.65, 116.99], zoom: 12, bounds: [[33.38, 116.72], [33.9, 117.28]] },
  lingbi: { center: [33.55, 117.55], zoom: 12, bounds: [[33.3, 117.25], [33.82, 117.85]] },
  yingzhou: { center: [32.87, 115.82], zoom: 12, bounds: [[32.66, 115.56], [33.1, 116.08]] },
  taihe: { center: [33.16, 115.62], zoom: 12, bounds: [[32.95, 115.36], [33.38, 115.9]] },
};

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

function OfflineBasemap() {
  return null;
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

function getGradeColor(level: number) {
  return gradePalette[Math.min(Math.max(level, 1), 10) - 1];
}

function createRegionLabelIcon(label: string) {
  return L.divIcon({
    className: "",
    html: `<div style="min-width:72px;text-align:center;border-radius:999px;padding:7px 12px;background:rgba(15,23,42,.72);color:white;font-size:12px;font-weight:900;border:1px solid rgba(148,163,184,.48);box-shadow:0 8px 18px rgba(15,23,42,.2);white-space:nowrap;">${label}</div>`,
    iconSize: [88, 30],
    iconAnchor: [44, 15],
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
    <div className="relative h-[640px] overflow-hidden rounded-[2rem] border border-sky-200/18 bg-[#001b31] shadow-[0_28px_90px_rgba(0,24,45,0.34)]">
      <MapContainer center={regionView[regionId]?.center ?? regionView.anhui.center} zoom={regionView[regionId]?.zoom ?? 7} minZoom={6} maxZoom={17} maxBounds={mapBounds} className="h-full w-full bg-[#001b31]" scrollWheelZoom>
        <OfflineBasemap />
        <RecenterMap regionId={regionId} />
        {layers.boundary && visibleRealBoundaries?.map((boundary) => (
          <Fragment key={boundary.id}>
            {boundary.paths.map((path, pathIndex) => (
              <Polygon key={`${boundary.id}-${pathIndex}`} positions={path} pathOptions={{ color: boundary.highlighted ? "#22d3ee" : "#60a5fa", weight: boundary.highlighted ? 4 : 1.4, dashArray: boundary.highlighted ? undefined : "8 8", fillColor: boundary.highlighted ? "#0ea5e9" : "#1e3a8a", fillOpacity: boundary.highlighted ? 0.2 : 0.08 }} eventHandlers={boundary.drillable ? { click: () => onRegionDrill(boundary.id) } : undefined} />
            ))}
            <Marker position={getPathCenter(boundary.paths[0])} icon={createRegionLabelIcon(boundary.name)} eventHandlers={boundary.drillable ? { click: () => onRegionDrill(boundary.id) } : undefined} />
          </Fragment>
        ))}
        {layers.boundary && visibleFallbackBoundaries.map((boundary) => (
          <Fragment key={boundary.id}>
            <Polygon positions={boundary.path} pathOptions={{ color: "#22d3ee", weight: 2, dashArray: "8 8", fillColor: "#1e3a8a", fillOpacity: 0.08 }} eventHandlers={{ click: () => onRegionDrill(boundary.id) }} />
            <Marker position={getPathCenter(boundary.path)} icon={createRegionLabelIcon(boundary.name)} eventHandlers={{ click: () => onRegionDrill(boundary.id) }} />
          </Fragment>
        ))}
        {layers.farmland && isCounty && plots.map((plot) => {
          const color = getGradeColor(plot.qualityLevel);
          return (
            <Fragment key={plot.id}>
              {plot.subPaths.map((subPath, subIndex) => {
                const selected = selectedMapItem?.type === "plot" && selectedMapItem.item.id === plot.id && selectedMapItem.subIndex === subIndex;
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
      <div className="absolute left-4 top-4 z-[500] rounded-2xl border border-white/18 bg-slate-950/62 px-4 py-3 text-white shadow-2xl backdrop-blur-xl">
        <div className="text-xs font-bold text-cyan-100/65">永久基本农田质量一张图</div>
        <div className="text-xl font-black">{getRegionName(regionId)}</div>
      </div>
      <div className="absolute right-4 top-4 z-[500] rounded-2xl border border-white/18 bg-slate-950/62 px-4 py-3 text-xs text-cyan-50 shadow-2xl backdrop-blur-xl">
        自绘等级地块 · 高标田项目范围叠加
      </div>
      <div className="absolute bottom-5 left-5 z-[500] w-56 rounded-3xl border border-white/18 bg-slate-950/68 p-4 text-white shadow-2xl backdrop-blur-xl">
        <div className="mb-3 flex items-center gap-2 text-sm font-black"><Layers className="h-4 w-4 text-cyan-200" />图层控制</div>
        {[
          ["farmland", "永久农田地块"],
          ["highStandard", "高标田项目范围"],
          ["boundary", "行政区边界"],
        ].map(([key, label]) => (
          <label key={key} className="mt-2 flex items-center justify-between gap-3 rounded-xl bg-white/10 px-3 py-2 text-xs text-cyan-50/88">
            <span className="flex items-center gap-2"><LocateFixed className="h-4 w-4 text-cyan-200" />{label}</span>
            <input checked={layers[key as keyof LayerState]} onChange={(event) => onLayersChange({ ...layers, [key]: event.target.checked })} type="checkbox" className="accent-cyan-300" />
          </label>
        ))}
      </div>
      {activePlot && !activeProject && (
        <div className="absolute right-5 top-20 z-[500] w-[330px] rounded-3xl border border-white/80 bg-white p-5 text-slate-800 shadow-2xl shadow-emerald-950/25">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-xs font-black text-cyan-700">永久农田地块详情</p>
              <h3 className="mt-1 text-lg font-black text-[#123d2f]">{activePlot.blockNo}</h3>
            </div>
            <button onClick={() => { setSelectedMapItem(null); onPlotSelect(null); }} className="text-xl text-slate-400 hover:text-slate-700">×</button>
          </div>
          <div className="mt-4 text-sm leading-7">行政区：{activePlot.city}{activePlot.county}{activePlot.town}<br />面积：{activePlot.area} 亩<br />地块等级：{activePlot.qualityLevel} 等<br />耕地类型：{activePlot.landType}<br />档案状态：{activePlot.archiveStatus}</div>
          <div className="mt-4 grid grid-cols-2 gap-2">
            <button onClick={() => onOpenDetail(activePlot)} className="rounded-2xl bg-[#123d2f] px-4 py-3 text-xs font-black text-white">查看完整档案</button>
            <button onClick={() => onLocateArchive(activePlot)} className="rounded-2xl bg-cyan-50 px-4 py-3 text-xs font-black text-cyan-700">定位档案库</button>
          </div>
        </div>
      )}
      {activeProject && (
        <div className="absolute right-5 top-20 z-[500] w-[350px] rounded-3xl border border-white/80 bg-white p-5 text-slate-800 shadow-2xl shadow-emerald-950/25">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-xs font-black text-sky-700">高标田项目范围详情</p>
              <h3 className="mt-1 text-lg font-black text-[#123d2f]">{activeProject.name}</h3>
            </div>
            <button onClick={() => setSelectedMapItem(null)} className="text-xl text-slate-400 hover:text-slate-700">×</button>
          </div>
          <div className="mt-4 grid grid-cols-2 gap-3 text-sm">
            <div className="rounded-2xl bg-sky-50 p-3"><b>关联地块</b><br />{activeProject.plots.length} 个</div>
            <div className="rounded-2xl bg-sky-50 p-3"><b>建设面积</b><br />{activeProject.plots.reduce((sum, plot) => sum + plot.area, 0).toFixed(1)} 亩</div>
            <div className="rounded-2xl bg-emerald-50 p-3"><b>平均等级</b><br />{(activeProject.plots.reduce((sum, plot) => sum + plot.qualityLevel, 0) / activeProject.plots.length).toFixed(1)} 等</div>
            <div className="rounded-2xl bg-amber-50 p-3"><b>建设状态</b><br />已建高标田</div>
          </div>
          <div className="mt-4 rounded-2xl bg-slate-50 p-3 text-xs font-bold leading-6 text-slate-500">虚线边界表示高标田项目范围，内部彩色面表示永久基本农田地块等级。</div>
        </div>
      )}
      <div className="absolute bottom-5 right-5 z-[500] rounded-2xl border border-white/18 bg-slate-950/62 p-4 text-xs text-cyan-50 shadow-2xl backdrop-blur-xl">
        <div className="mb-3 font-black text-cyan-100">地块等级色表</div>
        <div className="grid grid-cols-5 gap-2">
          {gradePalette.map((color, index) => <div key={color} className="flex items-center gap-1"><span className="h-3 w-3 rounded-sm" style={{ backgroundColor: color }} /><span>{index + 1}等</span></div>)}
        </div>
      </div>
    </div>
  );
}
