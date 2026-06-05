import { Fragment, useEffect, useMemo, useState } from "react";
import { CircleMarker, MapContainer, Polygon, Polyline, Tooltip, useMap } from "react-leaflet";
import { type LatLngBoundsExpression, type LatLngExpression } from "leaflet";
import { FlaskConical, Grid3X3, Layers, MapPinned, RadioTower, Sprout } from "lucide-react";
import { getSupervisionRegionName } from "@/data/supervisionMap";
import { supplementaryGradeColor, type SupplementaryLayers, type SupplementaryParcel } from "@/data/supplementaryLand";

type SupplementaryLandMapProps = {
  parcels: SupplementaryParcel[];
  regionId: string;
  selectedParcelId?: string;
  layers: SupplementaryLayers;
  onLayersChange: (layers: SupplementaryLayers) => void;
  onParcelSelect: (parcel: SupplementaryParcel) => void;
  onRegionDrill: (regionId: string) => void;
  onOpenParcelDetail: (parcel: SupplementaryParcel) => void;
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
  [[31.18, 116.5], [32.54, 116.64], [32.48, 117.92], [31.16, 118.04]],
  [[32.76, 116.05], [34.34, 116.22], [34.2, 117.96], [32.86, 118.18]],
  [[32.06, 115.0], [33.62, 115.1], [33.72, 116.54], [32.16, 116.63]],
  [[30.2, 116.04], [31.22, 116.28], [31.14, 117.56], [30.08, 117.42]],
  [[30.66, 117.62], [31.48, 117.82], [31.44, 118.78], [30.52, 118.58]],
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
  { name: "双墩", position: [32.16, 117.18] as LatLngExpression },
  { name: "花岗", position: [31.7, 117.08] as LatLngExpression },
  { name: "夹沟", position: [33.72, 117.04] as LatLngExpression },
  { name: "三十里铺", position: [32.84, 115.86] as LatLngExpression },
  { name: "赵集", position: [33.16, 115.66] as LatLngExpression },
];

function OfflineBasemap() {
  return (
    <>
      {offlineFields.map((field, index) => (
        <Polygon key={`field-${index}`} positions={field} pathOptions={{ color: "#bef264", weight: 1, fillColor: "#365314", fillOpacity: 0.22, dashArray: index % 2 ? "5 7" : "2 6" }} />
      ))}
      {offlineRivers.map((riverLine, index) => <Polyline key={`river-${index}`} positions={riverLine} pathOptions={{ color: "#7dd3fc", weight: 7, opacity: 0.38 }} />)}
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
    ["parcels", "项目地块", MapPinned],
    ["units", "评价单元", Grid3X3],
    ["samples", "采样点", FlaskConical],
    ["quality", "质量等级", Sprout],
    ["boundary", "行政区边界", RadioTower],
  ] as Array<[keyof SupplementaryLayers, string, typeof Layers]>;
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

function FocusSelectedParcel({ parcel }: { parcel?: SupplementaryParcel | null }) {
  const map = useMap();
  useEffect(() => {
    if (!parcel) return;
    map.fitBounds(parcel.path as LatLngBoundsExpression, { padding: [44, 44], maxZoom: 14, animate: true, duration: 0.45 });
  }, [map, parcel]);
  return null;
}

function getPathCenter(path: LatLngExpression[]) {
  const points = path as Array<[number, number]>;
  const total = points.reduce((sum, point) => [sum[0] + point[0], sum[1] + point[1]], [0, 0]);
  return [total[0] / points.length, total[1] / points.length] as LatLngExpression;
}

export default function SupplementaryLandMap({ parcels, regionId, selectedParcelId, layers, onLayersChange, onParcelSelect, onRegionDrill }: SupplementaryLandMapProps) {
  const [selectedParcel, setSelectedParcel] = useState<SupplementaryParcel | null>(null);
  const mapBounds = regionView[regionId]?.bounds ?? regionView.anhui.bounds;
  const selected = useMemo(() => parcels.find((parcel) => parcel.id === selectedParcelId) ?? null, [parcels, selectedParcelId]);

  return (
    <div className="relative h-[720px] overflow-hidden rounded-[2.2rem] border border-lime-200/20 bg-[#13281b] shadow-[0_28px_90px_rgba(6,31,25,0.24)]">
      <MapContainer center={regionView[regionId]?.center ?? regionView.anhui.center} zoom={regionView[regionId]?.zoom ?? 7} minZoom={6} maxZoom={17} maxBounds={mapBounds} className="h-full w-full bg-[#123326]" scrollWheelZoom>
        <OfflineBasemap />
        <RecenterMap regionId={regionId} />
        <FocusSelectedParcel parcel={selected} />
        {layers.boundary && (boundaryPolygons[regionId] ?? boundaryPolygons.anhui).map((boundary) => (
          <Polygon key={boundary.id} positions={boundary.path} pathOptions={{ color: "#65a30d", weight: 2, dashArray: "8 6", fillColor: "#84cc16", fillOpacity: 0.08 }} eventHandlers={{ click: () => onRegionDrill(boundary.id) }} />
        ))}
        {parcels.map((parcel) => {
          const isSelected = parcel.id === selectedParcelId;
          const fillColor = layers.quality ? supplementaryGradeColor(parcel.qualityGrade) : "#22c55e";
          return (
            <Fragment key={parcel.id}>
              {layers.parcels && (
                <Polygon bubblingMouseEvents={false} positions={parcel.path} pathOptions={{ color: isSelected ? "#facc15" : "#f8fafc", weight: isSelected ? 3 : 1.4, fillColor, fillOpacity: isSelected ? 0.52 : 0.32 }} eventHandlers={{ click: () => { onParcelSelect(parcel); setSelectedParcel(parcel); } }}>
                  <Tooltip permanent direction="center" className="!rounded-full !border-0 !bg-emerald-950/85 !px-2 !py-1 !text-xs !font-black !text-white">{parcel.county}</Tooltip>
                </Polygon>
              )}
              {layers.units && parcel.unitPaths.map((unitPath, index) => (
                <Polygon key={`${parcel.id}-unit-${index}`} bubblingMouseEvents={false} positions={unitPath} pathOptions={{ color: "#fef3c7", weight: 1, fillColor: "#fef9c3", fillOpacity: 0.13, dashArray: "4 4" }} eventHandlers={{ click: () => { onParcelSelect(parcel); setSelectedParcel(parcel); } }} />
              ))}
              {layers.samples && parcel.samplePoints.map((point, index) => (
                <CircleMarker key={`${parcel.id}-sample-${index}`} bubblingMouseEvents={false} center={point} radius={5} pathOptions={{ color: "#fff7ed", fillColor: "#0f766e", fillOpacity: 0.95, weight: 2 }} eventHandlers={{ click: () => { onParcelSelect(parcel); setSelectedParcel(parcel); } }} />
              ))}
            </Fragment>
          );
        })}
        {selected && <CircleMarker center={selected.latLng} radius={18} pathOptions={{ color: "#facc15", fillColor: "#fef08a", fillOpacity: 0.28, weight: 3 }} />}
        {layers.boundary && (boundaryPolygons[regionId] ?? []).map((boundary) => (
          <CircleMarker key={`boundary-label-${boundary.id}`} center={getPathCenter(boundary.path)} radius={18} pathOptions={{ color: "transparent", fillColor: "transparent", fillOpacity: 0, weight: 0 }} eventHandlers={{ click: () => onRegionDrill(boundary.id) }}>
            <Tooltip permanent direction="center" className="!rounded-full !border-0 !bg-lime-950/85 !px-3 !py-1 !text-xs !font-black !text-white">{boundary.name}</Tooltip>
          </CircleMarker>
        ))}
      </MapContainer>
      <div className="pointer-events-none absolute inset-x-0 top-0 z-[400] h-24 bg-gradient-to-b from-slate-950/32 to-transparent" />
      <div className="absolute left-4 top-4 z-[500] rounded-2xl border border-white/18 bg-slate-950/62 px-4 py-3 text-white shadow-2xl backdrop-blur-xl">
        <div className="text-xs font-bold text-lime-100/65">当前行政区</div>
        <div className="text-xl font-black">{getSupervisionRegionName(regionId)}</div>
      </div>
      <div className="absolute bottom-5 left-5 z-[500] w-56 rounded-3xl border border-white/18 bg-slate-950/68 p-4 text-white shadow-2xl backdrop-blur-xl">
        <div className="mb-3 flex items-center gap-2 text-sm font-black"><Layers className="h-4 w-4 text-lime-200" />图层控制</div>
        {layerRows().map(([key, label, Icon]) => (
          <label key={key} className="mt-2 flex items-center justify-between gap-3 rounded-xl bg-white/10 px-3 py-2 text-xs text-lime-50/88">
            <span className="flex items-center gap-2"><Icon className="h-4 w-4 text-lime-200" />{label}</span>
            <input checked={layers[key]} onChange={(event) => onLayersChange({ ...layers, [key]: event.target.checked })} type="checkbox" className="accent-lime-300" />
          </label>
        ))}
      </div>
      <div className="absolute bottom-5 right-5 z-[500] rounded-2xl border border-white/18 bg-slate-950/62 px-4 py-3 text-xs text-lime-50 shadow-2xl backdrop-blur-xl">
        <div className="flex items-center gap-4"><span>离线仿真底图</span><span>质量等级专题</span><span>验收管理图层</span></div>
      </div>
      {selectedParcel && (
        <div className="absolute right-5 top-20 z-[500] w-[350px] rounded-3xl border border-white/80 bg-white p-5 text-slate-800 shadow-2xl shadow-emerald-950/25">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-xs font-black text-lime-700">补充耕地图斑</p>
              <h3 className="mt-1 text-lg font-black text-[#123d2f]">{selectedParcel.projectName}</h3>
            </div>
            <button onClick={() => setSelectedParcel(null)} className="text-xl text-slate-400 hover:text-slate-700">×</button>
          </div>
          <div className="mt-4 text-sm leading-7">地块编号：{selectedParcel.code}<br />耕地类型：{selectedParcel.landType}<br />质量等级：{selectedParcel.qualityGrade}<br />评价单元：{selectedParcel.evaluationUnit}<br />采样点：{selectedParcel.sampleCount} 个<br />检测结果：{selectedParcel.testResult}</div>
        </div>
      )}
    </div>
  );
}
