import { Fragment, useEffect, useMemo, useState } from "react";
import { CircleMarker, MapContainer, Marker, Polygon, Tooltip, useMap } from "react-leaflet";
import L, { type LatLngBoundsExpression, type LatLngExpression } from "leaflet";
import { FlaskConical, Grid3X3, Layers, MapPinned, RadioTower, Sprout } from "lucide-react";
import { realSupervisionBoundaries } from "@/data/supervisionGeoBoundaries";
import { getSupervisionParentRegion, getSupervisionRegionName, supervisionRegions } from "@/data/supervisionMap";
import { type SupplementaryLayers, type SupplementaryParcel } from "@/data/supplementaryLand";

type SupplementaryHeatMode = "projectCount" | "acceptanceArea";

type SupplementaryHeatStats = {
  projectCount: number;
  area: number;
  avgGrade: number;
};

type SupplementaryProjectBoundary = {
  id: string;
  name: string;
  parcels: SupplementaryParcel[];
  path: LatLngExpression[];
};

type SelectedUnit = {
  parcelId: string;
  unitIndex: number;
};

type SupplementaryLandMapProps = {
  parcels: SupplementaryParcel[];
  regionId: string;
  selectedParcelId?: string;
  selectedProjectName?: string | null;
  layers: SupplementaryLayers;
  onLayersChange: (layers: SupplementaryLayers) => void;
  onParcelSelect: (parcel: SupplementaryParcel) => void;
  onProjectSelect: (project: SupplementaryProjectBoundary) => void;
  onRegionDrill: (regionId: string) => void;
  onOpenParcelDetail: (parcel: SupplementaryParcel) => void;
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

const supplementaryHeatData: Record<string, SupplementaryHeatStats> = {
  // 安徽省汇总数据（基于真实数据统计）
  anhui: { projectCount: 117, area: 177.8, avgGrade: 4.0 },

  // 各市数据（只有合肥市有真实数据，其他市为假数据）
  hefei: { projectCount: 117, area: 177.8, avgGrade: 4.0 },
  wuhu: { projectCount: 4, area: 1.9, avgGrade: 5.8 },
  bengbu: { projectCount: 5, area: 2.4, avgGrade: 5.5 },
  huainan: { projectCount: 3, area: 1.5, avgGrade: 6.1 },
  maanshan: { projectCount: 2, area: 1.0, avgGrade: 6.4 },
  huaibei: { projectCount: 4, area: 2.1, avgGrade: 5.9 },
  tongling: { projectCount: 1, area: 0.6, avgGrade: 6.8 },
  anqing: { projectCount: 7, area: 3.2, avgGrade: 5.0 },
  huangshan: { projectCount: 1, area: 0.4, avgGrade: 7.2 },
  chuzhou: { projectCount: 5, area: 2.6, avgGrade: 5.3 },
  fuyang: { projectCount: 8, area: 3.8, avgGrade: 4.8 },
  suzhou: { projectCount: 7, area: 3.4, avgGrade: 4.9 },
  liuan: { projectCount: 4, area: 2.0, avgGrade: 5.6 },
  bozhou: { projectCount: 6, area: 2.9, avgGrade: 5.1 },
  chizhou: { projectCount: 2, area: 1.1, avgGrade: 6.5 },
  xuancheng: { projectCount: 3, area: 1.6, avgGrade: 6.0 },

  // 合肥市各区县数据（只有肥西县有真实数据，其他区县为假数据）
  yaohai: { projectCount: 1, area: 0.5, avgGrade: 6.2 },
  luyang: { projectCount: 2, area: 0.9, avgGrade: 5.8 },
  shushan: { projectCount: 3, area: 1.3, avgGrade: 5.5 },
  baohe: { projectCount: 2, area: 0.8, avgGrade: 5.9 },
  changfeng: { projectCount: 4, area: 1.8, avgGrade: 5.2 },
  feidong: { projectCount: 5, area: 2.2, avgGrade: 5.0 },
  feixi: { projectCount: 117, area: 177.8, avgGrade: 4.0 },
  lujian: { projectCount: 0, area: 0, avgGrade: 0 },
  chaohu: { projectCount: 0, area: 0, avgGrade: 0 },
};

const supplementaryHeatLegends: Record<SupplementaryHeatMode, Array<{ label: string; color: string }>> = {
  projectCount: [
    { label: "0 个", color: "#e5e7eb" },
    { label: "1-2 个", color: "#d9f99d" },
    { label: "3-4 个", color: "#a3e635" },
    { label: "5-6 个", color: "#65a30d" },
    { label: "7+ 个", color: "#ca8a04" },
  ],
  acceptanceArea: [
    { label: "0 万亩", color: "#e5e7eb" },
    { label: "0.3-1.0 万亩", color: "#d9f99d" },
    { label: "1.0-2.0 万亩", color: "#a3e635" },
    { label: "2.0-3.0 万亩", color: "#65a30d" },
    { label: "3.0+ 万亩", color: "#ca8a04" },
  ],
};

function getSupplementaryHeatColor(value: number, mode: SupplementaryHeatMode): string {
  if (value <= 0) return "#e5e7eb";
  if (mode === "projectCount") {
    if (value <= 2) return "#d9f99d";
    if (value <= 4) return "#a3e635";
    if (value <= 6) return "#65a30d";
    return "#ca8a04";
  }
  if (value <= 1.0) return "#d9f99d";
  if (value <= 2.0) return "#a3e635";
  if (value <= 3.0) return "#65a30d";
  return "#ca8a04";
}

function getSupplementaryHeatValue(stats: SupplementaryHeatStats, mode: SupplementaryHeatMode): number {
  return mode === "projectCount" ? stats.projectCount : stats.area;
}

const gradePalette = ["#0f766e", "#16a34a", "#22c55e", "#65a30d", "#84cc16", "#a3e635", "#facc15", "#f59e0b", "#f97316", "#ef4444"];
const acceptanceColor = "#38bdf8";

function OfflineBasemap() {
  return null;
}

function layerRows() {
  return [
    ["parcels", "补充耕地地块", MapPinned],
    ["units", "评价单元", Grid3X3],
    ["samples", "采样点", FlaskConical],
    ["quality", "项目边界", Sprout],
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

function FocusParcel({ parcel }: { parcel?: SupplementaryParcel | null }) {
  const map = useMap();
  useEffect(() => {
    if (!parcel?.path.length) return;
    const bounds = L.latLngBounds(parcel.path.map(([lat, lng]) => L.latLng(lat, lng)));
    map.fitBounds(bounds.pad(2.6), { animate: true, duration: 0.55, maxZoom: 16 });
  }, [map, parcel]);
  return null;
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
    <div className="absolute left-4 top-4 z-[500] w-[280px] rounded-[10px] border border-[rgba(90,220,220,0.22)] bg-[rgba(8,42,52,0.86)] p-3 text-[#E8FFFF] shadow-2xl backdrop-blur-[8px]">
      <div className="mb-2 flex items-center justify-between gap-3">
        <p className="text-[11px] font-semibold text-[#E8FFFF]">行政区联动定位｜当前：{getSupervisionRegionName(regionId)}</p>
        {regionId !== "anhui" && <button onClick={() => onRegionChange(getSupervisionParentRegion(regionId))} className="shrink-0 rounded-full bg-[rgba(0,130,150,0.78)] px-2 py-0.5 text-[10px] font-semibold text-[#E8FFFF] border border-[rgba(80,240,255,0.65)]">返回上级</button>}
      </div>
      <div className="grid grid-cols-3 gap-2">
        <select value={chain.provinceId} onChange={(event) => onRegionChange(event.target.value)} className="h-8 rounded-[8px] border border-[rgba(90,220,220,0.22)] bg-[rgba(8,42,52,0.9)] px-2 text-[11px] font-semibold text-[#E8FFFF] outline-none">
          <option value="anhui">安徽省</option>
        </select>
        <select value={chain.cityId} onChange={(event) => onRegionChange(event.target.value || "anhui")} className="h-8 rounded-[8px] border border-[rgba(90,220,220,0.22)] bg-[rgba(8,42,52,0.9)] px-2 text-[11px] font-semibold text-[#E8FFFF] outline-none">
          <option value="">全部市</option>
          {cityOptions.map((region) => <option key={region.id} value={region.id}>{region.name}</option>)}
        </select>
        <select value={chain.countyId} onChange={(event) => onRegionChange(event.target.value || chain.cityId || "anhui")} className="h-8 rounded-[8px] border border-[rgba(90,220,220,0.22)] bg-[rgba(8,42,52,0.9)] px-2 text-[11px] font-semibold text-[#E8FFFF] outline-none">
          <option value="">全部区县</option>
          {countyOptions.map((region) => <option key={region.id} value={region.id}>{region.name}</option>)}
        </select>
      </div>
    </div>
  );
}

function parcelQualityLevel(parcel: SupplementaryParcel) {
  const match = parcel.code.match(/(\d+)$/);
  const seed = match ? Number(match[1]) : parcel.id.length;
  return ((seed * 7 + 3) % 10) + 1;
}

function parcelFillColor(parcel: SupplementaryParcel) {
  return gradePalette[parcelQualityLevel(parcel) - 1];
}

function buildProjectBoundary(groupId: string, parcels: SupplementaryParcel[], index: number): SupplementaryProjectBoundary {
  const points = parcels.flatMap((parcel) => (parcel.path.length ? parcel.path : parcel.unitPaths.flat()) as Array<[number, number]>);
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
  const waveLat = padLat * 0.7;
  const waveLng = padLng * 0.7;
  const path = [
    [maxLat + padLat * 0.55, minLng - padLng * 0.35],
    [maxLat + padLat + waveLat * 0.22, minLng + width * 0.26],
    [maxLat + padLat * 0.72, minLng + width * 0.62],
    [maxLat + padLat * 0.38, maxLng + padLng * 0.84],
    [minLat + height * 0.54, maxLng + padLng + waveLng * 0.18],
    [minLat - padLat * 0.42, maxLng + padLng * 0.42],
    [minLat - padLat, minLng + width * 0.66],
    [minLat - padLat * 0.64, minLng + width * 0.24],
    [minLat + height * 0.38, minLng - padLng],
  ] as LatLngExpression[];

  return {
    id: groupId,
    name: `肥西县花岗镇补充耕地项目${index + 1}`,
    parcels,
    path,
  };
}

function buildProjectBoundaries(parcels: SupplementaryParcel[]) {
  if (!parcels.length) return [];
  const centers = parcels.map((parcel) => parcel.latLng);
  const minLat = Math.min(...centers.map(([lat]) => lat));
  const maxLat = Math.max(...centers.map(([lat]) => lat));
  const minLng = Math.min(...centers.map(([, lng]) => lng));
  const maxLng = Math.max(...centers.map(([, lng]) => lng));
  const midLat = (minLat + maxLat) / 2;
  const midLng = (minLng + maxLng) / 2;
  const lowerCut = midLat - 0.004;
  const groups = [
    parcels.filter((parcel) => parcel.latLng[1] < midLng && parcel.latLng[0] >= lowerCut),
    parcels.filter((parcel) => parcel.latLng[1] < midLng && parcel.latLng[0] < lowerCut),
    parcels.filter((parcel) => parcel.latLng[1] >= midLng),
  ].filter((items) => items.length);
  return groups.map((items, index) => buildProjectBoundary(`supplementary-project-${index + 1}`, items, index));
}

export default function SupplementaryLandMap({ parcels, regionId, selectedParcelId, selectedProjectName, layers, onLayersChange, onParcelSelect, onProjectSelect, onRegionDrill }: SupplementaryLandMapProps) {
  const [selectedUnit, setSelectedUnit] = useState<SelectedUnit | null>(null);
  const [heatMode, setHeatMode] = useState<SupplementaryHeatMode>("projectCount");
  const selectedParcel = selectedParcelId ? parcels.find((parcel) => parcel.id === selectedParcelId) : null;
  const mapBounds = regionView[regionId]?.bounds ?? regionView.anhui.bounds;
  const currentBoundaries = realSupervisionBoundaries[regionId as keyof typeof realSupervisionBoundaries] ?? realSupervisionBoundaries.anhui;
  const showParcelLayers = regionId === "feixi";
  const projectBoundaries = useMemo(() => buildProjectBoundaries(parcels), [parcels]);

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
        <FocusParcel parcel={selectedParcel} />
        {layers.boundary && currentBoundaries.map((boundary) => {
          const stats = supplementaryHeatData[boundary.id] ?? { projectCount: 0, area: 0, avgGrade: 0 };
          const heatValue = getSupplementaryHeatValue(stats, heatMode);
          const heatColor = getSupplementaryHeatColor(heatValue, heatMode);
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
                        <div className="text-[rgba(234,251,255,0.85)]">补充耕地项目：{stats.projectCount} 个</div>
                        <div className="text-[rgba(234,251,255,0.85)]">验收面积：{stats.area.toFixed(1)} 万亩</div>
                        <div className="text-[rgba(234,251,255,0.85)]">平均等级：{stats.avgGrade.toFixed(1)} 等</div>
                      </div>
                    </Tooltip>
                  )}
                </Polygon>
              ))}
            </Fragment>
          );
        })}
        {showParcelLayers && layers.parcels && parcels.map((parcel) => (
          <Fragment key={parcel.id}>
            {parcel.unitPaths.map((path, index) => {
              const isSelected = (selectedParcelId === parcel.id && index === 0) || (selectedUnit?.parcelId === parcel.id && selectedUnit.unitIndex === index);
              return <Polygon key={`${parcel.id}-${index}`} positions={path} pathOptions={{ color: isSelected ? "#facc15" : "rgba(219,234,254,.75)", weight: isSelected ? 3 : 1, fillColor: parcelFillColor(parcel), fillOpacity: isSelected ? 0.82 : 0.62 }} eventHandlers={{ click: () => { setSelectedUnit({ parcelId: parcel.id, unitIndex: index }); onParcelSelect(parcel); } }} />;
            })}
          </Fragment>
        ))}
        {showParcelLayers && layers.quality && projectBoundaries.map((project) => {
          const isSelected = selectedProjectName === project.id;
          return <Polygon key={project.id} bubblingMouseEvents={false} positions={project.path} pathOptions={{ color: isSelected ? "#facc15" : "#38bdf8", weight: isSelected ? 3.5 : 2.3, dashArray: "8 7", lineCap: "round", lineJoin: "round", fill: false }} eventHandlers={{ click: () => { setSelectedUnit(null); onProjectSelect(project); } }} />;
        })}
        {showParcelLayers && layers.samples && parcels.flatMap((parcel) => parcel.samplePoints.map((point, index) => ({ parcel, point, index }))).map(({ parcel, point, index }) => (
          <CircleMarker key={`${parcel.id}-sample-${index}`} bubblingMouseEvents={false} center={point} radius={5} pathOptions={{ color: "#d8ecff", fillColor: "#86a8c4", fillOpacity: 0.95, weight: 2 }} eventHandlers={{ click: () => { setSelectedUnit(null); onParcelSelect(parcel); } }} />
        ))}
        {layers.boundary && currentBoundaries.map((boundary) => (
          <Marker key={`boundary-label-${boundary.id}`} position={getPathCenter(boundary.paths[0])} icon={createRegionLabelIcon(boundary.name, boundary.highlighted)} eventHandlers={boundary.drillable ? { click: () => onRegionDrill(boundary.id) } : undefined} />
        ))}
      </MapContainer>
      <RegionCascade regionId={regionId} onRegionChange={onRegionDrill} />
      <div className="pointer-events-none absolute inset-x-0 top-0 z-[400] h-24 bg-gradient-to-b from-slate-950/32 to-transparent" />
      {regionId !== "feixi" && (
        <div className="absolute right-5 top-20 z-[500] w-[240px] rounded-[12px] border border-[rgba(140,230,235,0.18)] bg-[rgba(5,35,45,0.68)] p-2.5 text-white shadow-2xl backdrop-blur-[8px]">
          <div className="mb-1.5 text-[11px] font-semibold text-[#E8FFFF]">补充耕地热力</div>
          <div className="mb-2 flex gap-2">
            <button
              onClick={() => setHeatMode("projectCount")}
              className={`rounded-lg px-2.5 py-1 text-[11px] font-semibold transition-all ${heatMode === "projectCount" ? "bg-[rgba(0,130,150,0.78)] text-[#E8FFFF] border border-[rgba(80,240,255,0.65)]" : "bg-[rgba(255,255,255,0.06)] text-[#E8FFFF] hover:bg-[rgba(255,255,255,0.12)]"}`}
            >
              项目数量
            </button>
            <button
              onClick={() => setHeatMode("acceptanceArea")}
              className={`rounded-lg px-2.5 py-1 text-[11px] font-semibold transition-all ${heatMode === "acceptanceArea" ? "bg-[rgba(0,130,150,0.78)] text-[#E8FFFF] border border-[rgba(80,240,255,0.65)]" : "bg-[rgba(255,255,255,0.06)] text-[#E8FFFF] hover:bg-[rgba(255,255,255,0.12)]"}`}
            >
              验收面积
            </button>
          </div>
          <div className="text-[10px] text-[rgba(232,255,255,0.6)]">{heatMode === "projectCount" ? "按项目数量分级设色" : "按验收面积分级设色"}</div>
          <div className="mt-1.5 space-y-1">
            {supplementaryHeatLegends[heatMode].map((item) => (
              <div key={item.label} className="flex items-center gap-1.5">
                <span className="h-3 w-3 rounded" style={{ backgroundColor: item.color }} />
                <span className="text-[10px] text-[#E8FFFF]">{item.label}</span>
              </div>
            ))}
          </div>
        </div>
      )}
      <div className="absolute bottom-5 left-5 z-[500] w-[240px] rounded-[12px] border border-[rgba(140,230,235,0.18)] bg-[rgba(5,35,45,0.72)] p-2.5 text-white shadow-2xl backdrop-blur-[8px]">
        <div className="mb-1.5 flex items-center gap-2 text-[11px] font-semibold text-[#E8FFFF]"><Layers className="h-3 w-3 text-[rgba(232,255,255,0.5)]" />图层控制</div>
        {layerRows().map(([key, label, Icon]) => (
          <label key={key} className="mt-1 flex items-center justify-between gap-3 rounded-[8px] bg-[rgba(255,255,255,0.04)] px-2.5 py-1.5 text-[11px] text-[#E8FFFF]">
            <span className="flex items-center gap-2"><Icon className="h-3 w-3 text-[rgba(232,255,255,0.5)]" />{label}</span>
            <input checked={layers[key]} onChange={(event) => onLayersChange({ ...layers, [key]: event.target.checked })} type="checkbox" className="h-3.5 w-3.5 accent-[rgba(0,180,200,0.9)]" />
          </label>
        ))}
      </div>
      <div className="absolute bottom-5 right-5 z-[500] rounded-[12px] border border-[rgba(140,230,235,0.18)] bg-[rgba(5,35,45,0.72)] p-3 text-[11px] text-[#E8FFFF] shadow-2xl backdrop-blur-[8px]">
        <div className="mb-2 font-semibold text-[#E8FFFF]">地块颜色说明</div>
        <div className="grid grid-cols-4 gap-2">
          {gradePalette.map((color, index) => <div key={color} className="flex items-center gap-1"><span className="h-3 w-3 rounded-sm" style={{ backgroundColor: color }} /><span>{index + 1}等</span></div>)}
          <div className="col-span-2 flex items-center gap-1"><span className="h-3 w-3 rounded-sm" style={{ backgroundColor: acceptanceColor }} /><span>验收中</span></div>
        </div>
      </div>
    </div>
    </>
  );
}
