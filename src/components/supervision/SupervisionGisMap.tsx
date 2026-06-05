import { Fragment, useEffect, useMemo, useState } from "react";
import { CircleMarker, MapContainer, Marker, Polygon, Polyline, Tooltip, useMap } from "react-leaflet";
import L, { type LatLngBoundsExpression, type LatLngExpression } from "leaflet";
import { Camera, Droplets, Layers, RadioTower, Route, Sprout } from "lucide-react";
import {
  devicePoints,
  facilityColor,
  facilityPoints,
  getSupervisionRegionName,
  projectStatusColor,
  type DevicePoint,
  type FacilityPoint,
  type HighStandardProject,
  type SupervisionLayers,
} from "@/data/supervisionMap";

type SelectedMapItem =
  | { type: "project"; item: HighStandardProject }
  | { type: "facility"; item: FacilityPoint }
  | { type: "device"; item: DevicePoint };

type SupervisionGisMapProps = {
  projects: HighStandardProject[];
  regionId: string;
  selectedProjectId?: string;
  layers: SupervisionLayers;
  onLayersChange: (layers: SupervisionLayers) => void;
  onProjectSelect: (project: HighStandardProject) => void;
  onRegionDrill: (regionId: string) => void;
  onOpenProjectDetail: (project: HighStandardProject) => void;
  onOpenDeviceDetail: (device: DevicePoint) => void;
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

function OfflineBasemap({ tone }: { tone: "cyan" | "emerald" }) {
  const fieldFill = tone === "cyan" ? "#284f3b" : "#27553a";
  const fieldLine = tone === "cyan" ? "#6ee7b7" : "#86efac";
  const river = tone === "cyan" ? "#67e8f9" : "#7dd3fc";
  return (
    <>
      {offlineFields.map((field, index) => (
        <Polygon key={`field-${index}`} positions={field} pathOptions={{ color: fieldLine, weight: 1, fillColor: fieldFill, fillOpacity: 0.26, dashArray: index % 2 ? "5 6" : "2 5" }} />
      ))}
      {offlineRivers.map((riverLine, index) => <Polyline key={`river-${index}`} positions={riverLine} pathOptions={{ color: river, weight: 7, opacity: 0.42 }} />)}
      {offlineRoads.map((road, index) => <Polyline key={`road-${index}`} positions={road} pathOptions={{ color: "#fde68a", weight: 3, opacity: 0.62, dashArray: "10 8" }} />)}
      {offlineVillages.map((village) => (
        <CircleMarker key={village.name} center={village.position} radius={5} pathOptions={{ color: "#fff7ed", fillColor: "#fef3c7", fillOpacity: 0.95, weight: 2 }}>
          <Tooltip permanent direction="right" className="!rounded-full !border-0 !bg-slate-950/75 !px-2 !py-1 !text-xs !font-black !text-white">{village.name}</Tooltip>
        </CircleMarker>
      ))}
    </>
  );
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

function FocusSelectedProject({ project }: { project?: HighStandardProject }) {
  const map = useMap();
  useEffect(() => {
    if (!project) return;
    map.fitBounds(project.path as LatLngBoundsExpression, { padding: [44, 44], maxZoom: 13, animate: true, duration: 0.45 });
  }, [map, project]);
  return null;
}

function getPathCenter(path: LatLngExpression[]) {
  const points = path as Array<[number, number]>;
  const total = points.reduce((sum, point) => [sum[0] + point[0], sum[1] + point[1]], [0, 0]);
  return [total[0] / points.length, total[1] / points.length] as LatLngExpression;
}

export default function SupervisionGisMap({ projects, regionId, selectedProjectId, layers, onLayersChange, onProjectSelect, onRegionDrill }: SupervisionGisMapProps) {
  const [selectedItem, setSelectedItem] = useState<SelectedMapItem | null>(null);
  const projectIds = useMemo(() => projects.map((project) => project.id), [projects]);
  const visibleFacilities = useMemo(() => facilityPoints.filter((item) => projectIds.includes(item.projectId)), [projectIds]);
  const visibleDevices = useMemo(() => devicePoints.filter((item) => projectIds.includes(item.projectId)), [projectIds]);
  const selectedProject = projects.find((project) => project.id === selectedProjectId);
  const mapBounds = regionView[regionId]?.bounds ?? regionView.anhui.bounds;

  return (
    <div className="relative h-[720px] overflow-hidden rounded-[2.2rem] border border-cyan-200/20 bg-[#10251f] shadow-[0_28px_90px_rgba(6,31,25,0.24)]">
      <MapContainer center={regionView[regionId]?.center ?? regionView.anhui.center} zoom={regionView[regionId]?.zoom ?? 7} minZoom={6} maxZoom={17} maxBounds={mapBounds} className="h-full w-full bg-[#123326]" scrollWheelZoom>
        <OfflineBasemap tone="cyan" />
        <RecenterMap regionId={regionId} />
        <FocusSelectedProject project={selectedProject} />
        {layers.boundary && (boundaryPolygons[regionId] ?? boundaryPolygons.anhui).map((boundary) => (
          <Polygon key={boundary.id} positions={boundary.path} pathOptions={{ color: "#0284c7", weight: 2, dashArray: "8 6", fillColor: "#38bdf8", fillOpacity: 0.08 }} eventHandlers={{ click: () => onRegionDrill(boundary.id) }} />
        ))}
        {layers.projects && projects.map((project) => {
          const selected = project.id === selectedProjectId;
          const color = projectStatusColor(project.status);
          return (
            <Fragment key={project.id}>
              {project.parcelPaths.map((parcelPath, parcelIndex) => (
                <Polygon key={`${project.id}-${parcelIndex}`} bubblingMouseEvents={false} positions={parcelPath} pathOptions={{ color: selected ? "#facc15" : "#f8fafc", weight: selected ? 3 : 1.4, fillColor: color, fillOpacity: selected ? 0.46 : 0.28 }} eventHandlers={{ click: () => { onProjectSelect(project); setSelectedItem({ type: "project", item: project }); } }}>
                  {parcelIndex === 4 && <Tooltip permanent direction="center" className="!rounded-full !border-0 !bg-emerald-950/85 !px-2 !py-1 !text-xs !font-black !text-white">{project.county}</Tooltip>}
                </Polygon>
              ))}
              <Polygon bubblingMouseEvents={false} positions={project.path} pathOptions={{ color: selected ? "#facc15" : color, weight: selected ? 4 : 2, fillOpacity: 0, dashArray: selected ? undefined : "8 6" }} eventHandlers={{ click: () => { onProjectSelect(project); setSelectedItem({ type: "project", item: project }); } }} />
            </Fragment>
          );
        })}
        {layers.boundary && (boundaryPolygons[regionId] ?? []).map((boundary) => (
          <CircleMarker key={`boundary-${boundary.id}`} center={getPathCenter(boundary.path)} radius={18} pathOptions={{ color: "transparent", fillColor: "transparent", fillOpacity: 0, weight: 0 }} eventHandlers={{ click: () => onRegionDrill(boundary.id) }}>
            <Tooltip permanent direction="center" className="!rounded-full !border-0 !bg-cyan-950/85 !px-3 !py-1 !text-xs !font-black !text-white">{boundary.name}</Tooltip>
          </CircleMarker>
        ))}
        {layers.facilities && visibleFacilities.map((point) => (
          <Marker key={point.id} position={point.latLng} icon={createDivIcon(facilityColor(point.type), point.type, "facility")} eventHandlers={{ click: () => setSelectedItem({ type: "facility", item: point }) }} />
        ))}
        {visibleDevices.filter((item) => (item.type === "摄像头" && layers.cameras) || (item.type === "墒情设备" && layers.moisture) || (item.type === "虫情设备" && layers.insects)).map((point) => {
          const color = point.status === "预警" ? "#f97316" : point.status === "离线" ? "#64748b" : "#06b6d4";
          const iconShape = point.type === "摄像头" ? "camera" : point.type === "墒情设备" ? "moisture" : "insect";
          return (
            <Marker key={point.id} position={point.latLng} icon={createDivIcon(color, point.type, iconShape)} eventHandlers={{ click: () => setSelectedItem({ type: "device", item: point }) }} />
          );
        })}
        {selectedProject && <CircleMarker center={selectedProject.latLng} radius={18} pathOptions={{ color: "#facc15", fillColor: "#fef08a", fillOpacity: 0.28, weight: 3 }} />}
      </MapContainer>
      <div className="pointer-events-none absolute inset-x-0 top-0 z-[400] h-24 bg-gradient-to-b from-slate-950/32 to-transparent" />
      <div className="absolute left-4 top-4 z-[500] rounded-2xl border border-white/18 bg-slate-950/62 px-4 py-3 text-white shadow-2xl backdrop-blur-xl">
        <div className="text-xs font-bold text-cyan-100/65">当前行政区</div>
        <div className="text-xl font-black">{getSupervisionRegionName(regionId)}</div>
      </div>
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
        <div className="flex items-center gap-4"><span>离线仿真底图</span><span>政务 GIS 风格</span><span>安徽区域</span></div>
      </div>
      {selectedItem && (
        <div className="absolute right-5 top-20 z-[500] w-[340px] rounded-3xl border border-white/80 bg-white p-5 text-slate-800 shadow-2xl shadow-emerald-950/25">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-xs font-black text-cyan-700">{selectedItem.type === "project" ? "项目区属性卡" : selectedItem.type === "facility" ? "工程设施点位" : "物联网设备点位"}</p>
              <h3 className="mt-1 text-lg font-black text-[#123d2f]">{selectedItem.item.name}</h3>
            </div>
            <button onClick={() => setSelectedItem(null)} className="text-xl text-slate-400 hover:text-slate-700">×</button>
          </div>
          {selectedItem.type === "project" && <div className="mt-4 text-sm leading-7">项目编号：{selectedItem.item.code}<br />建设面积：{selectedItem.item.area.toLocaleString()} 亩<br />投资金额：{selectedItem.item.investment.toLocaleString()} 万元<br />当前进度：{selectedItem.item.progress}%</div>}
          {selectedItem.type === "facility" && <div className="mt-4 text-sm leading-7">设施类型：{selectedItem.item.type}<br />运行状态：{selectedItem.item.status}<br />工程点位已接入施工监管台账。</div>}
          {selectedItem.type === "device" && <div className="mt-4 text-sm leading-7">设备类型：{selectedItem.item.type}<br />在线状态：{selectedItem.item.status}<br />实时数据：{selectedItem.item.value}<br />采集时间：{selectedItem.item.time}</div>}
        </div>
      )}
    </div>
  );
}
