import { Fragment, useEffect, useMemo, useState } from "react";
import { MapContainer, Marker, Polygon, Tooltip, useMap } from "react-leaflet";
import L, { type LatLngBoundsExpression, type LatLngExpression } from "leaflet";
import { Camera, Droplets, Layers, RadioTower, Route, Sprout } from "lucide-react";
import { realSupervisionBoundaries } from "@/data/supervisionGeoBoundaries";
import {
  devicePoints,
  facilityColor,
  facilityPoints,
  getSupervisionParentRegion,
  getSupervisionRegionName,
  supervisionRegions,
  type DevicePoint,
  type FacilityPoint,
  type HighStandardProject,
  type SupervisionLayers,
} from "@/data/supervisionMap";

type HeatMode = "projectCount" | "constructionArea";

type HeatStats = {
  projectCount: number;
  area: number;
  investment: number;
  avgProgress: number;
};

type SelectedProjectParcel = {
  project: HighStandardProject;
  index: number;
  path: Array<[number, number]>;
  level: number;
  area: number;
};

type SelectedMapItem =
  | { type: "project"; item: HighStandardProject }
  | { type: "parcel"; item: SelectedProjectParcel }
  | { type: "facility"; item: FacilityPoint }
  | { type: "device"; item: DevicePoint };

type SupervisionGisMapProps = {
  projects: HighStandardProject[];
  regionId: string;
  selectedProjectId?: string;
  selectedParcel?: { projectId: string; index: number } | null;
  layers: SupervisionLayers;
  onLayersChange: (layers: SupervisionLayers) => void;
  onProjectSelect: (project: HighStandardProject) => void;
  onRegionDrill: (regionId: string) => void;
  onOpenProjectDetail: (project: HighStandardProject) => void;
  onOpenDeviceDetail: (device: DevicePoint) => void;
};

const regionView: Record<string, { center: LatLngExpression; zoom: number; bounds: LatLngBoundsExpression }> = {
  anhui: { center: [31.85, 117.16], zoom: 7, bounds: [[29.2, 114.6], [34.8, 119.8]] },
  hefei: { center: [31.86, 117.22], zoom: 9, bounds: [[31.35, 116.55], [32.35, 117.95]] },
  yaohai: { center: [31.86, 117.31], zoom: 12, bounds: [[31.78, 117.22], [31.94, 117.42]] },
  luyang: { center: [31.88, 117.27], zoom: 12, bounds: [[31.80, 117.18], [31.96, 117.38]] },
  shushan: { center: [31.87, 117.22], zoom: 12, bounds: [[31.78, 117.12], [31.96, 117.32]] },
  baohe: { center: [31.79, 117.31], zoom: 12, bounds: [[31.70, 117.22], [31.88, 117.42]] },
  changfeng: { center: [32.15, 117.18], zoom: 11, bounds: [[31.92, 116.96], [32.34, 117.42]] },
  feidong: { center: [31.88, 117.47], zoom: 11, bounds: [[31.68, 117.20], [32.08, 117.72]] },
  feixi: { center: [31.72, 117.16], zoom: 12, bounds: [[31.5, 116.94], [31.92, 117.42]] },
  lujian: { center: [31.56, 117.28], zoom: 11, bounds: [[31.38, 117.08], [31.74, 117.52]] },
  chaohu: { center: [31.60, 117.58], zoom: 11, bounds: [[31.42, 117.38], [31.78, 117.82]] },
};

const heatDataPresets: Record<string, HeatStats> = {
  hefei: { projectCount: 8, area: 4.2, investment: 2.1, avgProgress: 82 },
  wuhu: { projectCount: 5, area: 2.8, investment: 1.4, avgProgress: 78 },
  bengbu: { projectCount: 7, area: 3.5, investment: 1.7, avgProgress: 80 },
  huainan: { projectCount: 4, area: 2.2, investment: 1.1, avgProgress: 75 },
  maanshan: { projectCount: 3, area: 1.8, investment: 0.9, avgProgress: 72 },
  huaibei: { projectCount: 6, area: 3.2, investment: 1.6, avgProgress: 79 },
  tongling: { projectCount: 2, area: 1.2, investment: 0.6, avgProgress: 68 },
  anqing: { projectCount: 9, area: 4.8, investment: 2.4, avgProgress: 84 },
  huangshan: { projectCount: 1, area: 0.6, investment: 0.3, avgProgress: 65 },
  chuzhou: { projectCount: 7, area: 3.8, investment: 1.9, avgProgress: 81 },
  fuyang: { projectCount: 11, area: 5.8, investment: 2.9, avgProgress: 86 },
  suzhou: { projectCount: 9, area: 4.6, investment: 2.3, avgProgress: 83 },
  liuan: { projectCount: 5, area: 2.6, investment: 1.3, avgProgress: 76 },
  bozhou: { projectCount: 8, area: 4.4, investment: 2.2, avgProgress: 85 },
  chizhou: { projectCount: 3, area: 1.6, investment: 0.8, avgProgress: 70 },
  xuancheng: { projectCount: 4, area: 2.4, investment: 1.2, avgProgress: 74 },
  yaohai: { projectCount: 2, area: 0.8, investment: 0.4, avgProgress: 88 },
  luyang: { projectCount: 3, area: 1.2, investment: 0.6, avgProgress: 85 },
  shushan: { projectCount: 4, area: 1.6, investment: 0.8, avgProgress: 82 },
  baohe: { projectCount: 3, area: 1.3, investment: 0.65, avgProgress: 84 },
  changfeng: { projectCount: 5, area: 2.2, investment: 1.1, avgProgress: 79 },
  feidong: { projectCount: 6, area: 2.8, investment: 1.4, avgProgress: 77 },
  feixi: { projectCount: 7, area: 3.2, investment: 1.6, avgProgress: 80 },
  lujian: { projectCount: 4, area: 1.8, investment: 0.9, avgProgress: 78 },
  chaohu: { projectCount: 5, area: 2.4, investment: 1.2, avgProgress: 76 },
};

const heatLegends: Record<HeatMode, Array<{ label: string; color: string }>> = {
  projectCount: [
    { label: "0 个", color: "#e5e7eb" },
    { label: "1-3 个", color: "#d9f99d" },
    { label: "4-6 个", color: "#a3e635" },
    { label: "7-10 个", color: "#65a30d" },
    { label: "11+ 个", color: "#ca8a04" },
  ],
  constructionArea: [
    { label: "0 万亩", color: "#e5e7eb" },
    { label: "0.5-1.5 万亩", color: "#d9f99d" },
    { label: "1.5-3.0 万亩", color: "#a3e635" },
    { label: "3.0-5.0 万亩", color: "#65a30d" },
    { label: "5.0+ 万亩", color: "#ca8a04" },
  ],
};

function getHeatColor(value: number, mode: HeatMode): string {
  if (value <= 0) return "#e5e7eb";
  if (mode === "projectCount") {
    if (value <= 3) return "#d9f99d";
    if (value <= 6) return "#a3e635";
    if (value <= 10) return "#65a30d";
    return "#ca8a04";
  }
  if (value <= 1.5) return "#d9f99d";
  if (value <= 3.0) return "#a3e635";
  if (value <= 5.0) return "#65a30d";
  return "#ca8a04";
}

function getHeatValue(stats: HeatStats, mode: HeatMode): number {
  return mode === "projectCount" ? stats.projectCount : stats.area;
}

const gradePalette = ["#0f766e", "#16a34a", "#22c55e", "#65a30d", "#84cc16", "#a3e635", "#facc15", "#f59e0b", "#f97316", "#ef4444"];

function OfflineBasemap() {
  return null;
}

function layerRows() {
  return [
    ["projects", "项目区", Layers],
    ["facilities", "工程设施", Route],
    ["cameras", "摄像头", Camera],
    ["moisture", "墒情设备", Droplets],
    ["insects", "虫情设备", Sprout],
    ["boundary", "行政区边界", RadioTower],
  ] as Array<[keyof SupervisionLayers, string, typeof Layers]>;
}

function createRegionLabelIcon(label: string, highlighted: boolean) {
  return L.divIcon({
    className: "",
    html: `<div style="min-width:72px;text-align:center;border-radius:999px;padding:7px 12px;background:${highlighted ? "rgba(8,47,73,.92)" : "rgba(15,23,42,.72)"};color:white;font-size:12px;font-weight:900;border:1px solid ${highlighted ? "rgba(103,232,249,.86)" : "rgba(148,163,184,.48)"};box-shadow:${highlighted ? "0 12px 30px rgba(34,211,238,.28)" : "0 8px 18px rgba(15,23,42,.2)"};white-space:nowrap;">${label}</div>`,
    iconSize: [88, 30],
    iconAnchor: [44, 15],
  });
}

function createDivIcon(color: string, label: string, shape: "facility" | "camera" | "moisture" | "insect") {
  const shapeHtml = shape === "facility"
    ? `<span style="display:block;width:15px;height:15px;border:2px solid #fff;border-radius:4px;position:relative;"><i style="position:absolute;left:3px;right:3px;bottom:-6px;height:6px;background:#fff;border-radius:2px;"></i></span>`
    : shape === "camera"
      ? `<span style="display:block;width:16px;height:11px;border:2px solid #fff;border-radius:3px;position:relative;"><i style="position:absolute;right:-6px;top:2px;border-left:6px solid #fff;border-top:3px solid transparent;border-bottom:3px solid transparent;"></i></span>`
      : shape === "moisture"
        ? `<span style="display:block;width:12px;height:17px;background:#fff;border-radius:9px 9px 11px 11px;transform:rotate(18deg);"></span>`
        : `<span style="display:block;width:16px;height:12px;border:2px solid #fff;border-radius:50%;position:relative;"><i style="position:absolute;left:-5px;top:4px;width:4px;height:2px;background:#fff;"></i><i style="position:absolute;right:-5px;top:4px;width:4px;height:2px;background:#fff;"></i></span>`;
  return L.divIcon({
    className: "",
    html: `<div title="${label}" style="width:34px;height:34px;border-radius:12px;background:${color};border:3px solid #fff;box-shadow:0 8px 24px rgba(15,23,42,.35);display:grid;place-items:center;">${shapeHtml}</div>`,
    iconSize: [34, 34],
    iconAnchor: [17, 17],
  });
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

function FocusParcel({ path }: { path?: Array<[number, number]> }) {
  const map = useMap();
  useEffect(() => {
    if (!path?.length) return;
    const bounds = L.latLngBounds(path.map(([lat, lng]) => L.latLng(lat, lng)));
    map.fitBounds(bounds.pad(2.6), { animate: true, duration: 0.55, maxZoom: 16 });
  }, [map, path]);
  return null;
}

function getPathCenter(path: LatLngExpression[]) {
  const points = path as Array<[number, number]>;
  const total = points.reduce((sum, point) => [sum[0] + point[0], sum[1] + point[1]], [0, 0]);
  return [total[0] / points.length, total[1] / points.length] as LatLngExpression;
}

function parcelLevel(project: HighStandardProject, index: number) {
  const match = project.code.match(/(\d+)$/);
  const seed = match ? Number(match[1]) : project.id.length;
  return ((seed + index * 7) % 10) + 1;
}

function parcelArea(project: HighStandardProject, index: number) {
  return Number((project.area / Math.max(project.parcelPaths.length, 1) * (0.84 + (index % 5) * 0.08)).toFixed(1));
}

function parcelCode(project: HighStandardProject, index: number) {
  return `${project.code}-DK-${String(index + 1).padStart(3, "0")}`;
}

function getRegionChain(regionId: string) {
  const region = supervisionRegions.find((item) => item.id === regionId);
  if (!region || region.level === "province") return { provinceId: "anhui", cityId: "", countyId: "" };
  if (region.level === "city") return { provinceId: "anhui", cityId: region.id, countyId: "" };
  const cityId = region.parentId ?? "";
  return { provinceId: "anhui", cityId, countyId: region.id };
}

function RegionCascade({ regionId, onRegionChange }: { regionId: string; onRegionChange: (regionId: string) => void }) {
  const chain = getRegionChain(regionId);
  const cityOptions = supervisionRegions.filter((region) => region.id === "hefei");
  const countyOptions = chain.cityId === "hefei" ? supervisionRegions.filter((region) => region.id === "feixi") : [];

  return (
    <div className="absolute left-4 top-4 z-[500] rounded-2xl border border-white/80 bg-white/92 p-3 text-slate-700 shadow-2xl shadow-emerald-950/20 backdrop-blur-xl">
      <div className="mb-2 flex items-center justify-between gap-5">
        <div>
          <p className="text-xs font-black text-emerald-700">行政区联动定位</p>
          <p className="text-sm font-black text-[#123d2f]">当前：{getSupervisionRegionName(regionId)}</p>
        </div>
        {regionId !== "anhui" && <button onClick={() => onRegionChange(getSupervisionParentRegion(regionId))} className="rounded-full bg-emerald-50 px-3 py-1 text-xs font-black text-emerald-700">返回上级</button>}
      </div>
      <div className="grid grid-cols-3 gap-2">
        <select value={chain.provinceId} onChange={(event) => onRegionChange(event.target.value)} className="h-10 rounded-xl border border-emerald-100 bg-emerald-50 px-3 text-xs font-black text-[#123d2f] outline-none">
          <option value="anhui">安徽省</option>
        </select>
        <select value={chain.cityId} onChange={(event) => onRegionChange(event.target.value || "anhui")} className="h-10 rounded-xl border border-emerald-100 bg-white px-3 text-xs font-black text-[#123d2f] outline-none">
          <option value="">全部市</option>
          {cityOptions.map((region) => <option key={region.id} value={region.id}>{region.name}</option>)}
        </select>
        <select value={chain.countyId} onChange={(event) => onRegionChange(event.target.value || chain.cityId || "anhui")} className="h-10 rounded-xl border border-emerald-100 bg-white px-3 text-xs font-black text-[#123d2f] outline-none">
          <option value="">全部区县</option>
          {countyOptions.map((region) => <option key={region.id} value={region.id}>{region.name}</option>)}
        </select>
      </div>
    </div>
  );
}

export default function SupervisionGisMap({ projects, regionId, selectedProjectId, selectedParcel, layers, onLayersChange, onProjectSelect, onRegionDrill, onOpenDeviceDetail }: SupervisionGisMapProps) {
  const [selectedItem, setSelectedItem] = useState<SelectedMapItem | null>(null);
  const [heatMode, setHeatMode] = useState<HeatMode>("projectCount");
  const externalSelectedProject = selectedParcel ? projects.find((project) => project.id === selectedParcel.projectId) : undefined;
  const externalSelectedPath = externalSelectedProject?.parcelPaths[selectedParcel?.index ?? -1];
  const activeParcelKey = selectedItem?.type === "parcel" ? `${selectedItem.item.project.id}-${selectedItem.item.index}` : selectedParcel ? `${selectedParcel.projectId}-${selectedParcel.index}` : "";
  const projectIds = useMemo(() => projects.map((project) => project.id), [projects]);
  const visibleFacilities = useMemo(() => facilityPoints.filter((item) => projectIds.includes(item.projectId)), [projectIds]);
  const visibleDevices = useMemo(() => devicePoints.filter((item) => projectIds.includes(item.projectId)), [projectIds]);
  const mapBounds = regionView[regionId]?.bounds ?? regionView.anhui.bounds;
  const showProjectLayers = regionId === "feixi";
  const currentBoundaries = realSupervisionBoundaries[regionId as keyof typeof realSupervisionBoundaries] ?? realSupervisionBoundaries.anhui;

  useEffect(() => {
    if (!selectedParcel || !externalSelectedProject || !externalSelectedPath) return;
    setSelectedItem({
      type: "parcel",
      item: {
        project: externalSelectedProject,
        index: selectedParcel.index,
        path: externalSelectedPath,
        level: parcelLevel(externalSelectedProject, selectedParcel.index),
        area: parcelArea(externalSelectedProject, selectedParcel.index),
      },
    });
  }, [externalSelectedPath, externalSelectedProject, selectedParcel]);

  return (
    <div className="relative h-[720px] overflow-hidden rounded-[2.2rem] border border-sky-200/18 bg-[#001b31] shadow-[0_28px_90px_rgba(0,24,45,0.34)]">
      <MapContainer center={regionView[regionId]?.center ?? regionView.anhui.center} zoom={regionView[regionId]?.zoom ?? 7} minZoom={6} maxZoom={17} maxBounds={mapBounds} className="h-full w-full bg-[#001b31]" scrollWheelZoom>
        <OfflineBasemap />
        <RecenterMap regionId={regionId} />
        <FocusParcel path={externalSelectedPath} />

        {layers.boundary && currentBoundaries.map((boundary) => {
          const stats = heatDataPresets[boundary.id] ?? { projectCount: 0, area: 0, investment: 0, avgProgress: 0 };
          const heatValue = getHeatValue(stats, heatMode);
          const heatColor = getHeatColor(heatValue, heatMode);
          const isCountyLevel = !boundary.drillable && regionId !== "anhui";
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
                  eventHandlers={boundary.drillable ? { click: () => onRegionDrill(boundary.id) } : undefined}
                >
                  {!isCountyLevel && (
                    <Tooltip sticky direction="top" opacity={0.96}>
                      <div className="min-w-40 text-sm leading-6">
                        <div className="font-black text-[#123d2f]">{boundary.name}</div>
                        <div>高标田项目：{stats.projectCount} 个</div>
                        <div>建设面积：{stats.area.toFixed(1)} 万亩</div>
                        <div>投资金额：{stats.investment.toFixed(1)} 亿元</div>
                        <div>平均进度：{stats.avgProgress}%</div>
                      </div>
                    </Tooltip>
                  )}
                </Polygon>
              ))}
            </Fragment>
          );
        })}
        {layers.projects && showProjectLayers && projects.map((project) => {
          const projectSelected = selectedItem?.type === "project" && project.id === selectedProjectId;
          return (
            <Fragment key={project.id}>
              {project.parcelPaths.map((path, index) => {
                const level = parcelLevel(project, index);
                const parcelKey = `${project.id}-${index}`;
                const parcelSelected = activeParcelKey === parcelKey;
                return (
                  <Polygon
                    key={`${project.id}-parcel-${index}`}
                    positions={path}
                    pathOptions={{
                      color: parcelSelected ? "#facc15" : projectSelected ? "rgba(250,204,21,.78)" : "rgba(219,234,254,.78)",
                      weight: parcelSelected ? 3.2 : projectSelected ? 2 : 1.1,
                      fillColor: gradePalette[level - 1],
                      fillOpacity: parcelSelected ? 0.9 : projectSelected ? 0.72 : 0.66,
                    }}
                    eventHandlers={{
                      click: () => {
                        setSelectedItem({ type: "parcel", item: { project, index, path, level, area: parcelArea(project, index) } });
                      },
                    }}
                  />
                );
              })}
              <Polygon bubblingMouseEvents={false} positions={project.path} pathOptions={{ color: projectSelected ? "#facc15" : "#38bdf8", weight: projectSelected ? 3.4 : 2.4, dashArray: "9 7", lineCap: "round", lineJoin: "round", fill: false }} eventHandlers={{ click: () => { onProjectSelect(project); setSelectedItem({ type: "project", item: project }); } }} />
            </Fragment>
          );
        })}
        {layers.boundary && currentBoundaries.map((boundary) => (
          <Marker key={`boundary-${boundary.id}`} position={getPathCenter(boundary.paths[0])} icon={createRegionLabelIcon(boundary.name, boundary.highlighted)} eventHandlers={boundary.drillable ? { click: () => onRegionDrill(boundary.id) } : undefined} />
        ))}
        {showProjectLayers && layers.facilities && visibleFacilities.map((point) => (
          <Marker key={point.id} position={point.latLng} icon={createDivIcon(facilityColor(point.type), point.type, "facility")} eventHandlers={{ click: () => setSelectedItem({ type: "facility", item: point }) }} />
        ))}
        {showProjectLayers && visibleDevices.filter((item) => (item.type === "摄像头" && layers.cameras) || (item.type === "墒情设备" && layers.moisture) || (item.type === "虫情设备" && layers.insects)).map((point) => {
          const color = point.status === "预警" ? "#f97316" : point.status === "离线" ? "#64748b" : "#06b6d4";
          const iconShape = point.type === "摄像头" ? "camera" : point.type === "墒情设备" ? "moisture" : "insect";
          return (
            <Marker key={point.id} position={point.latLng} icon={createDivIcon(color, point.type, iconShape)} eventHandlers={{ click: () => setSelectedItem({ type: "device", item: point }) }} />
          );
        })}

      </MapContainer>
      <div className="pointer-events-none absolute inset-x-0 top-0 z-[400] h-24 bg-gradient-to-b from-slate-950/32 to-transparent" />
      <RegionCascade regionId={regionId} onRegionChange={onRegionDrill} />
      {regionId !== "feixi" && (
        <div className="absolute right-5 top-20 z-[500] rounded-2xl border border-white/18 bg-slate-950/72 p-4 text-white shadow-2xl backdrop-blur-xl">
          <div className="mb-3 text-sm font-black text-cyan-100">高标田建设热力</div>
          <div className="mb-3 flex gap-2">
            <button
              onClick={() => setHeatMode("projectCount")}
              className={`rounded-lg px-3 py-1.5 text-xs font-black transition-all ${heatMode === "projectCount" ? "bg-cyan-500 text-white" : "bg-white/10 text-cyan-100 hover:bg-white/20"}`}
            >
              项目数量
            </button>
            <button
              onClick={() => setHeatMode("constructionArea")}
              className={`rounded-lg px-3 py-1.5 text-xs font-black transition-all ${heatMode === "constructionArea" ? "bg-cyan-500 text-white" : "bg-white/10 text-cyan-100 hover:bg-white/20"}`}
            >
              建设面积
            </button>
          </div>
          <div className="text-xs text-cyan-50/70">{heatMode === "projectCount" ? "按项目数量分级设色" : "按建设面积分级设色"}</div>
          <div className="mt-3 space-y-2">
            {heatLegends[heatMode].map((item) => (
              <div key={item.label} className="flex items-center gap-2">
                <span className="h-4 w-4 rounded" style={{ backgroundColor: item.color }} />
                <span className="text-xs text-cyan-50">{item.label}</span>
              </div>
            ))}
          </div>
        </div>
      )}
      <div className="absolute bottom-5 left-5 z-[500] w-56 rounded-3xl border border-white/18 bg-slate-950/68 p-4 text-white shadow-2xl backdrop-blur-xl">
        <div className="mb-3 flex items-center gap-2 text-sm font-black"><Layers className="h-4 w-4 text-cyan-200" />图层控制</div>
        {layerRows().map(([key, label, Icon]) => (
          <label key={key} className="mt-2 flex items-center justify-between gap-3 rounded-xl bg-white/10 px-3 py-2 text-xs text-cyan-50/88">
            <span className="flex items-center gap-2"><Icon className="h-4 w-4 text-cyan-200" />{label}</span>
            <input checked={layers[key]} onChange={(event) => onLayersChange({ ...layers, [key]: event.target.checked })} type="checkbox" className="accent-cyan-300" />
          </label>
        ))}
      </div>
      <div className="absolute bottom-5 right-5 z-[500] rounded-2xl border border-white/18 bg-slate-950/62 px-4 py-3 text-xs text-cyan-50 shadow-2xl backdrop-blur-xl">
        <div className="flex items-center gap-4"><span className="text-cyan-200">自绘区划底图</span><span>安徽省-合肥市-肥西县</span><span>三级统一下钻</span></div>
      </div>
      {selectedItem && (
        <div className="absolute right-5 top-20 z-[500] w-[340px] rounded-3xl border border-white/80 bg-white p-5 text-slate-800 shadow-2xl shadow-emerald-950/25">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-xs font-black text-cyan-700">{selectedItem.type === "project" ? "项目区属性卡" : selectedItem.type === "parcel" ? "田块属性卡" : selectedItem.type === "facility" ? "工程设施点位" : "物联网设备点位"}</p>
              <h3 className="mt-1 text-lg font-black text-[#123d2f]">{selectedItem.type === "parcel" ? parcelCode(selectedItem.item.project, selectedItem.item.index) : selectedItem.item.name}</h3>
            </div>
            <button onClick={() => setSelectedItem(null)} className="text-xl text-slate-400 hover:text-slate-700">×</button>
          </div>
          {selectedItem.type === "project" && <div className="mt-4 text-sm leading-7">项目编号：{selectedItem.item.code}<br />建设面积：{selectedItem.item.area.toLocaleString()} 亩<br />投资金额：{selectedItem.item.investment.toLocaleString()} 万元<br />当前进度：{selectedItem.item.progress}%</div>}
          {selectedItem.type === "parcel" && <div className="mt-4 text-sm leading-7">所属项目：{selectedItem.item.project.name}<br />地块编号：{parcelCode(selectedItem.item.project, selectedItem.item.index)}<br />地块面积：{selectedItem.item.area.toLocaleString()} 亩<br />质量等级：{selectedItem.item.level} 等<br />建设状态：{selectedItem.item.project.status}</div>}
          {selectedItem.type === "facility" && <div className="mt-4 text-sm leading-7">设施类型：{selectedItem.item.type}<br />运行状态：{selectedItem.item.status}<br />工程点位已接入施工监管台账。</div>}
          {selectedItem.type === "device" && (
            <div className="mt-4 text-sm leading-7">
              <div>设备类型：{selectedItem.item.type}</div>
              <div>在线状态：{selectedItem.item.status}</div>
              <div>实时数据：{selectedItem.item.value}</div>
              <div>采集时间：{selectedItem.item.time}</div>
              <button onClick={() => onOpenDeviceDetail(selectedItem.item)} className="mt-4 flex w-full items-center justify-center rounded-2xl bg-[#123d2f] px-5 py-3 text-sm font-black text-white shadow-lg shadow-emerald-950/15 hover:bg-[#0f3026]">查看详情</button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
