import { Fragment, useEffect, useMemo, useState } from "react";
import { CircleMarker, MapContainer, Marker, Polygon, useMap } from "react-leaflet";
import L, { type LatLngBoundsExpression, type LatLngExpression } from "leaflet";
import { FlaskConical, Grid3X3, Layers, MapPinned, RadioTower, Sprout } from "lucide-react";
import { realSupervisionBoundaries } from "@/data/supervisionGeoBoundaries";
import { getSupervisionParentRegion, getSupervisionRegionName, supervisionRegions } from "@/data/supervisionMap";
import { type SupplementaryLayers, type SupplementaryParcel } from "@/data/supplementaryLand";

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
  feixi: { center: [31.72, 117.16], zoom: 12, bounds: [[31.5, 116.94], [31.92, 117.42]] },
};

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
    html: `<div style="min-width:72px;text-align:center;border-radius:999px;padding:7px 12px;background:${highlighted ? "rgba(0,27,49,.9)" : "rgba(0,27,49,.66)"};color:white;font-size:12px;font-weight:900;border:1px solid ${highlighted ? "rgba(185,213,235,.86)" : "rgba(111,150,182,.48)"};box-shadow:${highlighted ? "0 12px 30px rgba(127,160,189,.28)" : "0 8px 18px rgba(0,27,49,.2)"};white-space:nowrap;">${label}</div>`,
    iconSize: [88, 30],
    iconAnchor: [44, 15],
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
    <div className="absolute left-4 top-4 z-[500] rounded-2xl border border-sky-200/24 bg-[#001b31]/86 p-3 text-sky-50 shadow-2xl shadow-sky-950/40 backdrop-blur-xl">
      <div className="mb-2 flex items-center justify-between gap-5">
        <div>
          <p className="text-xs font-black text-sky-200/70">行政区联动定位</p>
          <p className="text-sm font-black text-white">当前：{getSupervisionRegionName(regionId)}</p>
        </div>
        {regionId !== "anhui" && <button onClick={() => onRegionChange(getSupervisionParentRegion(regionId))} className="rounded-full bg-sky-500/16 px-3 py-1 text-xs font-black text-sky-100">返回上级</button>}
      </div>
      <div className="grid grid-cols-3 gap-2">
        <select value={chain.provinceId} onChange={(event) => onRegionChange(event.target.value)} className="h-10 rounded-xl border border-sky-200/20 bg-sky-100/95 px-3 text-xs font-black text-[#001b31] outline-none">
          <option value="anhui">安徽省</option>
        </select>
        <select value={chain.cityId} onChange={(event) => onRegionChange(event.target.value || "anhui")} className="h-10 rounded-xl border border-sky-200/20 bg-sky-100/95 px-3 text-xs font-black text-[#001b31] outline-none">
          <option value="">全部市</option>
          {cityOptions.map((region) => <option key={region.id} value={region.id}>{region.name}</option>)}
        </select>
        <select value={chain.countyId} onChange={(event) => onRegionChange(event.target.value || chain.cityId || "anhui")} className="h-10 rounded-xl border border-sky-200/20 bg-sky-100/95 px-3 text-xs font-black text-[#001b31] outline-none">
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
  const selectedParcel = selectedParcelId ? parcels.find((parcel) => parcel.id === selectedParcelId) : null;
  const mapBounds = regionView[regionId]?.bounds ?? regionView.anhui.bounds;
  const currentBoundaries = realSupervisionBoundaries[regionId as keyof typeof realSupervisionBoundaries] ?? realSupervisionBoundaries.anhui;
  const showParcelLayers = regionId === "feixi";
  const projectBoundaries = useMemo(() => buildProjectBoundaries(parcels), [parcels]);

  return (
    <div className="relative h-[720px] overflow-hidden rounded-[2.2rem] border border-sky-200/18 bg-[#001b31] shadow-[0_28px_90px_rgba(0,24,45,0.34)]">
      <MapContainer center={regionView[regionId]?.center ?? regionView.anhui.center} zoom={regionView[regionId]?.zoom ?? 7} minZoom={6} maxZoom={17} maxBounds={mapBounds} className="h-full w-full bg-[#001b31]" scrollWheelZoom>
        <OfflineBasemap />
        <RecenterMap regionId={regionId} />
        <FocusParcel parcel={selectedParcel} />
        {layers.boundary && currentBoundaries.map((boundary) => (
          <Fragment key={boundary.id}>
            {boundary.paths.map((path, pathIndex) => (
              <Polygon key={`${boundary.id}-${pathIndex}`} positions={path} pathOptions={{ color: boundary.highlighted ? "#b9d5eb" : "#6f96b6", weight: boundary.highlighted ? 3.4 : 1.2, fillColor: boundary.highlighted ? "#7fa0bd" : "#6e8fad", fillOpacity: boundary.highlighted ? 0.46 : 0.22 }} eventHandlers={boundary.drillable ? { click: () => onRegionDrill(boundary.id) } : undefined} />
            ))}
          </Fragment>
        ))}
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
      <div className="pointer-events-none absolute inset-x-0 top-0 z-[400] h-24 bg-gradient-to-b from-[#001b31]/54 to-transparent" />
      <div className="absolute bottom-5 left-5 z-[500] w-56 rounded-3xl border border-sky-200/18 bg-[#001b31]/72 p-4 text-white shadow-2xl backdrop-blur-xl">
        <div className="mb-3 flex items-center gap-2 text-sm font-black"><Layers className="h-4 w-4 text-sky-200" />图层控制</div>
        {layerRows().map(([key, label, Icon]) => (
          <label key={key} className="mt-2 flex items-center justify-between gap-3 rounded-xl bg-sky-100/10 px-3 py-2 text-xs text-sky-50/88">
            <span className="flex items-center gap-2"><Icon className="h-4 w-4 text-sky-200" />{label}</span>
            <input checked={layers[key]} onChange={(event) => onLayersChange({ ...layers, [key]: event.target.checked })} type="checkbox" className="accent-sky-300" />
          </label>
        ))}
      </div>
      <div className="absolute bottom-5 right-5 z-[500] rounded-2xl border border-sky-200/18 bg-[#001b31]/72 p-4 text-xs text-sky-50 shadow-2xl backdrop-blur-xl">
        <div className="mb-3 font-black text-sky-100">地块颜色说明</div>
        <div className="grid grid-cols-4 gap-2">
          {gradePalette.map((color, index) => <div key={color} className="flex items-center gap-1"><span className="h-3 w-3 rounded-sm" style={{ backgroundColor: color }} /><span>{index + 1}等</span></div>)}
          <div className="col-span-2 flex items-center gap-1"><span className="h-3 w-3 rounded-sm" style={{ backgroundColor: acceptanceColor }} /><span>验收中</span></div>
        </div>
      </div>
    </div>
  );
}
