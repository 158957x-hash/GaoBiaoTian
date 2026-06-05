import { Fragment, useEffect, useMemo, useState } from "react";
import { CircleMarker, MapContainer, Marker, Polygon, Polyline, Popup, Tooltip, useMap } from "react-leaflet";
import L, { type LatLngBoundsExpression, type LatLngExpression } from "leaflet";
import { Layers, LocateFixed } from "lucide-react";
import { getRegionName, qualityColor, type Plot } from "@/data/permanentFarmland";

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
  onPlotSelect: (plot: Plot) => void;
  onRegionDrill: (regionId: string) => void;
  onOpenDetail: (plot: Plot) => void;
  onLocateArchive: (plot: Plot) => void;
};

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
  anhui: [
    { id: "hefei", name: "合肥市", path: [[31.45, 116.62], [32.34, 116.88], [32.25, 117.82], [31.48, 117.96], [31.2, 117.18]] },
    { id: "suzhou", name: "宿州市", path: [[33.12, 116.32], [34.05, 116.5], [34.22, 117.42], [33.58, 117.86], [33.05, 117.18]] },
    { id: "fuyang", name: "阜阳市", path: [[32.42, 115.2], [33.32, 115.1], [33.5, 116.1], [32.76, 116.45], [32.28, 115.86]] },
  ],
  hefei: [
    { id: "changfeng", name: "长丰县", path: [[31.95, 116.98], [32.34, 117.05], [32.28, 117.36], [32.02, 117.42], [31.9, 117.22]] },
    { id: "feidong", name: "肥东县", path: [[31.72, 117.27], [32.05, 117.3], [32.1, 117.66], [31.78, 117.75], [31.62, 117.5]] },
    { id: "feixi", name: "肥西县", path: [[31.55, 116.96], [31.92, 117.02], [31.86, 117.42], [31.58, 117.35], [31.44, 117.12]] },
  ],
  suzhou: [
    { id: "yongqiao", name: "埇桥区", path: [[33.42, 116.72], [33.9, 116.8], [33.88, 117.22], [33.5, 117.32], [33.3, 117.02]] },
    { id: "lingbi", name: "灵璧县", path: [[33.32, 117.28], [33.82, 117.28], [33.86, 117.82], [33.42, 117.92], [33.22, 117.56]] },
  ],
  fuyang: [
    { id: "yingzhou", name: "颍州区", path: [[32.66, 115.56], [33.04, 115.58], [33.12, 116.02], [32.78, 116.12], [32.58, 115.82]] },
    { id: "taihe", name: "太和县", path: [[32.98, 115.38], [33.38, 115.36], [33.42, 115.82], [33.08, 115.95], [32.9, 115.64]] },
  ],
};

const offlineFields: LatLngExpression[][] = [
  [[31.2, 116.55], [32.55, 116.72], [32.46, 117.86], [31.18, 118.02]],
  [[32.8, 116.08], [34.35, 116.24], [34.22, 117.96], [32.9, 118.18]],
  [[32.08, 115.0], [33.62, 115.12], [33.7, 116.55], [32.18, 116.62]],
  [[30.2, 116.05], [31.2, 116.28], [31.12, 117.55], [30.08, 117.42]],
  [[30.68, 117.65], [31.5, 117.82], [31.42, 118.78], [30.52, 118.58]],
];

const offlineRivers: LatLngExpression[][] = [
  [[34.25, 116.3], [33.72, 116.9], [33.15, 117.12], [32.46, 117.62], [31.86, 117.3], [31.22, 117.95]],
  [[33.28, 115.12], [32.95, 115.78], [32.42, 116.14], [31.96, 116.58]],
  [[31.2, 116.58], [30.86, 117.12], [30.55, 117.76], [30.18, 118.42]],
];

const offlineRoads: LatLngExpression[][] = [
  [[34.1, 116.45], [33.5, 116.95], [32.75, 117.18], [31.86, 117.28], [31.1, 117.42], [30.35, 117.7]],
  [[33.28, 115.32], [32.9, 115.82], [32.35, 116.42], [31.75, 117.18], [31.3, 118.05]],
  [[32.2, 116.85], [32.05, 117.28], [31.86, 117.64], [31.52, 118.2]],
  [[33.68, 116.35], [33.62, 116.98], [33.55, 117.55], [33.32, 118.05]],
];

const offlineVillages = [
  { name: "新民村", position: [32.12, 117.18] as LatLngExpression },
  { name: "丰乐村", position: [31.76, 117.08] as LatLngExpression },
  { name: "良田村", position: [33.7, 117.02] as LatLngExpression },
  { name: "稻香村", position: [32.86, 115.86] as LatLngExpression },
  { name: "赵集", position: [33.16, 115.66] as LatLngExpression },
];

function OfflineBasemap() {
  return (
    <>
      {offlineFields.map((field, index) => (
        <Polygon key={`field-${index}`} positions={field} pathOptions={{ color: "#86efac", weight: 1, fillColor: "#27553a", fillOpacity: 0.28, dashArray: index % 2 ? "5 6" : "2 5" }} />
      ))}
      {offlineRivers.map((riverLine, index) => <Polyline key={`river-${index}`} positions={riverLine} pathOptions={{ color: "#7dd3fc", weight: 7, opacity: 0.42 }} />)}
      {offlineRoads.map((road, index) => <Polyline key={`road-${index}`} positions={road} pathOptions={{ color: "#fde68a", weight: 3, opacity: 0.62, dashArray: "10 8" }} />)}
      {offlineVillages.map((village) => (
        <CircleMarker key={village.name} center={village.position} radius={5} pathOptions={{ color: "#fff7ed", fillColor: "#fef3c7", fillOpacity: 0.95, weight: 2 }}>
          <Tooltip permanent direction="right" className="!rounded-full !border-0 !bg-slate-950/75 !px-2 !py-1 !text-xs !font-black !text-white">{village.name}</Tooltip>
        </CircleMarker>
      ))}
    </>
  );
}

function createHighStandardIcon() {
  return L.divIcon({
    className: "",
    html: `<div style="width:28px;height:28px;border-radius:14px;background:#2563eb;border:3px solid #fff;box-shadow:0 8px 24px rgba(15,23,42,.35);display:grid;place-items:center;color:white;font-size:12px;font-weight:900;">高</div>`,
    iconSize: [28, 28],
    iconAnchor: [14, 14],
  });
}

function RecenterMap({ regionId }: { regionId: string }) {
  const map = useMap();
  useEffect(() => {
    const view = regionView[regionId] ?? regionView.anhui;
    map.flyTo(view.center, view.zoom, { duration: 0.8 });
  }, [map, regionId]);
  return null;
}

function PlotPopup({ plot, onOpenDetail, onLocateArchive }: { plot: Plot; onOpenDetail: (plot: Plot) => void; onLocateArchive: (plot: Plot) => void }) {
  return (
    <div className="w-72 text-sm text-slate-700">
      <p className="text-xs font-black text-emerald-700">图斑属性卡</p>
      <h3 className="mt-1 text-base font-black text-[#123d2f]">{plot.blockNo}</h3>
      <div className="mt-3 grid grid-cols-2 gap-2 text-xs">
        <div className="rounded-lg bg-emerald-50 p-2"><b>所属区域</b><br />{plot.city}{plot.county}</div>
        <div className="rounded-lg bg-emerald-50 p-2"><b>图斑面积</b><br />{plot.area} 亩</div>
        <div className="rounded-lg bg-emerald-50 p-2"><b>质量等级</b><br />{plot.qualityLevel} 等</div>
        <div className="rounded-lg bg-emerald-50 p-2"><b>档案状态</b><br />{plot.archiveStatus}</div>
      </div>
      <div className="mt-2 rounded-lg bg-slate-50 p-2 text-xs leading-5">耕地类型：{plot.landType}<br />高标田关联：{plot.projectName}</div>
      <div className="mt-3 grid grid-cols-2 gap-2">
        <button onClick={() => onOpenDetail(plot)} className="rounded-lg bg-[#123d2f] px-3 py-2 text-xs font-black text-white">查看完整档案</button>
        <button onClick={() => onLocateArchive(plot)} className="rounded-lg bg-emerald-50 px-3 py-2 text-xs font-black text-emerald-700">定位档案库</button>
      </div>
    </div>
  );
}

export default function FarmlandMap({ plots, regionId, selectedPlotId, layers, onLayersChange, onPlotSelect, onRegionDrill, onOpenDetail, onLocateArchive }: FarmlandMapProps) {
  const [selectedMapPlot, setSelectedMapPlot] = useState<Plot | null>(null);
  const selectedPlot = useMemo(() => plots.find((plot) => plot.id === selectedPlotId), [plots, selectedPlotId]);
  const mapBounds = regionView[regionId]?.bounds ?? regionView.anhui.bounds;
  const visibleBoundaries = boundaryPolygons[regionId] ?? boundaryPolygons.anhui;
  const highIcon = useMemo(() => createHighStandardIcon(), []);

  return (
    <div className="relative h-[640px] overflow-hidden rounded-[2rem] border border-emerald-200/60 bg-[#10251f] shadow-[0_22px_70px_rgba(18,61,47,0.16)]">
      <MapContainer center={regionView[regionId]?.center ?? regionView.anhui.center} zoom={regionView[regionId]?.zoom ?? 7} minZoom={6} maxZoom={17} maxBounds={mapBounds} className="h-full w-full bg-[#123326]" scrollWheelZoom>
        <OfflineBasemap />
        <RecenterMap regionId={regionId} />
        {layers.boundary && visibleBoundaries.map((boundary) => (
          <Polygon key={boundary.id} positions={boundary.path} pathOptions={{ color: "#059669", weight: 2, dashArray: "8 6", fillColor: "#34d399", fillOpacity: 0.08 }} eventHandlers={{ click: () => onRegionDrill(boundary.id) }}>
            <Tooltip permanent direction="center" className="!rounded-full !border-0 !bg-emerald-950/85 !px-3 !py-1 !font-black !text-white">{boundary.name}</Tooltip>
          </Polygon>
        ))}
        {layers.farmland && plots.map((plot) => {
          const selected = plot.id === selectedPlotId;
          const color = qualityColor(plot.qualityLevel);
          return (
            <Fragment key={plot.id}>
              {plot.subPaths.map((subPath, subIndex) => (
                <Polygon key={`${plot.id}-${subIndex}`} positions={subPath} pathOptions={{ color: selected ? "#facc15" : plot.archiveStatus === "待完善" ? "#64748b" : "#f8fafc", weight: selected ? 3 : 1.2, fillColor: color, fillOpacity: selected ? 0.5 : 0.3 }} eventHandlers={{ click: () => { onPlotSelect(plot); setSelectedMapPlot(plot); } }}>
                  {subIndex === 0 && <Tooltip direction="top" className="!rounded-lg !border-0 !bg-white !font-bold !text-[#123d2f]">{plot.county} · {plot.qualityLevel} 等</Tooltip>}
                  <Popup><PlotPopup plot={plot} onOpenDetail={onOpenDetail} onLocateArchive={onLocateArchive} /></Popup>
                </Polygon>
              ))}
              <Polygon positions={plot.path} pathOptions={{ color: selected ? "#facc15" : color, weight: selected ? 4 : 1.8, fillOpacity: 0, dashArray: selected ? undefined : "7 5" }} eventHandlers={{ click: () => { onPlotSelect(plot); setSelectedMapPlot(plot); } }} />
            </Fragment>
          );
        })}
        {layers.highStandard && plots.filter((plot) => plot.isHighStandard).map((plot) => (
          <Marker key={`hs-${plot.id}`} position={plot.latLng} icon={highIcon}>
            <Popup><div className="text-sm"><b>{plot.projectName}</b><br />关联图斑：{plot.blockNo}<br />重叠面积：{Math.max(plot.area - 4.26, 0).toFixed(2)} 亩</div></Popup>
          </Marker>
        ))}
        {selectedPlot && <CircleMarker center={selectedPlot.latLng} radius={18} pathOptions={{ color: "#facc15", fillColor: "#fef08a", fillOpacity: 0.28, weight: 3 }} />}
      </MapContainer>
      <div className="pointer-events-none absolute inset-x-0 top-0 z-[400] h-24 bg-gradient-to-b from-slate-950/28 to-transparent" />
      <div className="absolute left-4 top-4 z-[500] rounded-2xl border border-white/18 bg-slate-950/62 px-4 py-3 text-white shadow-2xl backdrop-blur-xl">
        <div className="text-xs font-bold text-emerald-100/65">永久基本农田质量一张图</div>
        <div className="text-xl font-black">{getRegionName(regionId)}</div>
      </div>
      <div className="absolute right-4 top-4 z-[500] rounded-2xl border border-white/18 bg-slate-950/62 px-4 py-3 text-xs text-emerald-50 shadow-2xl backdrop-blur-xl">
        离线仿真底图 · 政务 GIS 风格
      </div>
      <div className="absolute bottom-5 left-5 z-[500] w-56 rounded-3xl border border-white/18 bg-slate-950/68 p-4 text-white shadow-2xl backdrop-blur-xl">
        <div className="mb-3 flex items-center gap-2 text-sm font-black"><Layers className="h-4 w-4 text-emerald-200" />图层控制</div>
        {[
          ["farmland", "永久农田图层"],
          ["highStandard", "高标准农田关联图层"],
          ["boundary", "行政区边界"],
        ].map(([key, label]) => (
          <label key={key} className="mt-2 flex items-center justify-between gap-3 rounded-xl bg-white/10 px-3 py-2 text-xs text-emerald-50/88">
            <span className="flex items-center gap-2"><LocateFixed className="h-4 w-4 text-emerald-200" />{label}</span>
            <input checked={layers[key as keyof LayerState]} onChange={(event) => onLayersChange({ ...layers, [key]: event.target.checked })} type="checkbox" className="accent-emerald-300" />
          </label>
        ))}
      </div>
      {selectedMapPlot && (
        <div className="absolute right-5 top-20 z-[500] w-[330px] rounded-3xl border border-white/80 bg-white p-5 text-slate-800 shadow-2xl shadow-emerald-950/25">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-xs font-black text-emerald-700">当前选中图斑</p>
              <h3 className="mt-1 text-lg font-black text-[#123d2f]">{selectedMapPlot.blockNo}</h3>
            </div>
            <button onClick={() => setSelectedMapPlot(null)} className="text-xl text-slate-400 hover:text-slate-700">×</button>
          </div>
          <div className="mt-4 text-sm leading-7">行政区：{selectedMapPlot.city}{selectedMapPlot.county}{selectedMapPlot.town}<br />面积：{selectedMapPlot.area} 亩<br />质量等级：{selectedMapPlot.qualityLevel} 等<br />档案状态：{selectedMapPlot.archiveStatus}</div>
          <button onClick={() => onOpenDetail(selectedMapPlot)} className="mt-4 w-full rounded-2xl bg-[#123d2f] px-4 py-3 text-sm font-black text-white">查看完整档案</button>
        </div>
      )}
      <div className="absolute bottom-5 right-5 z-[500] rounded-2xl border border-white/18 bg-slate-950/62 px-4 py-3 text-xs text-emerald-50 shadow-2xl backdrop-blur-xl">
        <div className="flex items-center gap-4"><span>质量等级着色</span><span>图斑档案联动</span><span>行政区下钻</span></div>
      </div>
    </div>
  );
}
