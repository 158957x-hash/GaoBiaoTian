import { useMemo, useRef, useState } from "react";
import { Camera, Crosshair, Droplets, Layers, Minus, Plus, RadioTower, Route, Sprout } from "lucide-react";
import {
  devicePoints,
  facilityColor,
  facilityPoints,
  getSupervisionChildRegions,
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
};

const provinceShapes = [
  { id: "hefei", points: "92,96 348,70 386,220 118,250", label: "合肥市", x: 218, y: 155 },
  { id: "suzhou", points: "430,76 734,92 700,252 414,224", label: "宿州市", x: 590, y: 158 },
  { id: "fuyang", points: "204,315 620,292 704,486 168,512", label: "阜阳市", x: 430, y: 404 },
];

const rivers = ["M80 420 C190 362 292 420 410 360 S650 312 790 365", "M120 180 C250 238 350 190 470 238 S650 280 820 222"];
const roads = ["M40 332 L210 286 L360 326 L548 250 L848 292", "M172 70 L246 172 L330 245 L482 340 L640 510", "M706 70 L638 184 L584 270 L560 468"];
const villages = [
  { x: 152, y: 190, name: "新民村" },
  { x: 305, y: 350, name: "丰乐村" },
  { x: 520, y: 182, name: "良田村" },
  { x: 700, y: 402, name: "稻香村" },
  { x: 238, y: 510, name: "赵集" },
];

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

export default function SupervisionGisMap({ projects, regionId, selectedProjectId, layers, onLayersChange, onProjectSelect, onRegionDrill, onOpenProjectDetail }: SupervisionGisMapProps) {
  const [scale, setScale] = useState(1);
  const [offset, setOffset] = useState({ x: 0, y: 0 });
  const [dragging, setDragging] = useState(false);
  const [popup, setPopup] = useState<SelectedMapItem | null>(null);
  const dragStart = useRef({ x: 0, y: 0, ox: 0, oy: 0 });
  const projectIds = useMemo(() => projects.map((project) => project.id), [projects]);
  const visibleFacilities = useMemo(() => facilityPoints.filter((item) => projectIds.includes(item.projectId)), [projectIds]);
  const visibleDevices = useMemo(() => devicePoints.filter((item) => projectIds.includes(item.projectId)), [projectIds]);
  const childRegions = getSupervisionChildRegions(regionId);
  const visibleRegionShapes = useMemo(() => {
    if (regionId === "anhui") return provinceShapes;
    if (!childRegions.length) return [];
    return childRegions.map((item, index) => ({
      id: item.id,
      label: item.name,
      x: 170 + index * 230,
      y: 170 + (index % 2) * 135,
      points: `${92 + index * 215},${116 + (index % 2) * 95} ${282 + index * 215},${102 + (index % 2) * 95} ${320 + index * 215},${240 + (index % 2) * 95} ${118 + index * 215},${268 + (index % 2) * 95}`,
    }));
  }, [childRegions, regionId]);

  const selectedProject = projects.find((project) => project.id === selectedProjectId);

  return (
    <div className="relative h-[720px] overflow-hidden rounded-[2.2rem] border border-cyan-200/20 bg-[#10251f] shadow-[0_28px_90px_rgba(6,31,25,0.24)]">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_24%_20%,rgba(32,197,143,0.26),transparent_28%),radial-gradient(circle_at_76%_30%,rgba(59,130,246,0.18),transparent_26%),linear-gradient(135deg,#17362d_0%,#213f34_38%,#2a4c35_100%)]" />
      <div className="absolute inset-0 opacity-30 [background-image:linear-gradient(rgba(255,255,255,0.08)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.08)_1px,transparent_1px)] [background-size:32px_32px]" />
      <div className="absolute left-4 top-4 z-20 rounded-2xl border border-white/14 bg-slate-950/55 px-4 py-3 text-white shadow-2xl backdrop-blur-xl">
        <div className="text-xs font-bold text-cyan-100/65">当前行政区</div>
        <div className="text-xl font-black">{getSupervisionRegionName(regionId)}</div>
      </div>
      <div className="absolute right-4 top-4 z-20 flex flex-col gap-2">
        <button onClick={() => setScale((value) => Math.min(value + 0.16, 2.35))} className="grid h-10 w-10 place-items-center rounded-xl bg-white/92 text-[#123d2f] shadow-lg"><Plus className="h-5 w-5" /></button>
        <button onClick={() => setScale((value) => Math.max(value - 0.16, 0.62))} className="grid h-10 w-10 place-items-center rounded-xl bg-white/92 text-[#123d2f] shadow-lg"><Minus className="h-5 w-5" /></button>
        <button onClick={() => { setScale(1); setOffset({ x: 0, y: 0 }); }} className="grid h-10 w-10 place-items-center rounded-xl bg-white/92 text-[#123d2f] shadow-lg"><Crosshair className="h-5 w-5" /></button>
      </div>
      <div className="absolute bottom-5 left-5 z-20 w-56 rounded-3xl border border-white/14 bg-slate-950/58 p-4 text-white shadow-2xl backdrop-blur-xl">
        <div className="mb-3 flex items-center gap-2 text-sm font-black"><Layers className="h-4 w-4 text-cyan-200" />图层控制</div>
        {layerRows().map(([key, label, Icon]) => (
          <label key={key} className="mt-2 flex items-center justify-between gap-3 rounded-xl bg-white/7 px-3 py-2 text-xs text-cyan-50/88">
            <span className="flex items-center gap-2"><Icon className="h-4 w-4 text-cyan-200" />{label}</span>
            <input checked={layers[key]} onChange={(event) => onLayersChange({ ...layers, [key]: event.target.checked })} type="checkbox" className="accent-cyan-300" />
          </label>
        ))}
      </div>
      <svg
        className="relative z-10 h-full w-full cursor-grab active:cursor-grabbing"
        viewBox="0 0 900 720"
        onWheel={(event) => {
          event.preventDefault();
          setScale((value) => Math.min(Math.max(value + (event.deltaY > 0 ? -0.08 : 0.08), 0.62), 2.35));
        }}
        onMouseDown={(event) => {
          setDragging(true);
          dragStart.current = { x: event.clientX, y: event.clientY, ox: offset.x, oy: offset.y };
        }}
        onMouseMove={(event) => {
          if (!dragging) return;
          setOffset({ x: dragStart.current.ox + event.clientX - dragStart.current.x, y: dragStart.current.oy + event.clientY - dragStart.current.y });
        }}
        onMouseUp={() => setDragging(false)}
        onMouseLeave={() => setDragging(false)}
      >
        <defs>
          <filter id="projectGlow"><feGaussianBlur stdDeviation="4" result="blur" /><feMerge><feMergeNode in="blur" /><feMergeNode in="SourceGraphic" /></feMerge></filter>
          <pattern id="fieldTexture" width="58" height="58" patternUnits="userSpaceOnUse">
            <path d="M0 20 C18 10 38 12 58 4 M0 48 C20 36 36 44 58 30" fill="none" stroke="rgba(255,255,255,0.12)" strokeWidth="2" />
            <path d="M12 0 L4 58 M42 0 L34 58" stroke="rgba(20,83,45,0.18)" strokeWidth="2" />
          </pattern>
        </defs>
        <rect width="900" height="720" fill="url(#fieldTexture)" opacity="0.55" />
        <g transform={`translate(${offset.x} ${offset.y}) scale(${scale})`}>
          {rivers.map((river) => <path key={river} d={river} fill="none" stroke="#67e8f9" strokeWidth="12" strokeOpacity="0.32" strokeLinecap="round" />)}
          {roads.map((road) => <path key={road} d={road} fill="none" stroke="#fde68a" strokeWidth="5" strokeOpacity="0.58" strokeLinecap="round" strokeDasharray="14 9" />)}
          {villages.map((village) => (
            <g key={village.name}>
              <circle cx={village.x} cy={village.y} r="5" fill="#fef3c7" />
              <text x={village.x + 10} y={village.y + 4} fill="#ecfeff" fontSize="13" fontWeight="700">{village.name}</text>
            </g>
          ))}
          {layers.boundary && visibleRegionShapes.map((shape) => (
            <g key={shape.id}>
              <polygon points={shape.points} fill="rgba(255,255,255,0.05)" stroke="#bae6fd" strokeWidth="3" strokeDasharray="10 7" onClick={() => onRegionDrill(shape.id)} className="cursor-pointer transition hover:opacity-75" />
              <text x={shape.x} y={shape.y} textAnchor="middle" fill="#ecfeff" fontSize="24" fontWeight="900" onClick={() => onRegionDrill(shape.id)} className="cursor-pointer">{shape.label}</text>
            </g>
          ))}
          {layers.projects && projects.map((project) => {
            const selected = project.id === selectedProjectId;
            const color = projectStatusColor(project.status);
            return (
              <g key={project.id}>
                <polygon
                  points={project.points}
                  fill={color}
                  fillOpacity={selected ? 0.48 : 0.28}
                  stroke={selected ? "#fef08a" : color}
                  strokeWidth={selected ? 6 : 3}
                  filter={selected ? "url(#projectGlow)" : undefined}
                  onClick={(event) => {
                    event.stopPropagation();
                    onProjectSelect(project);
                    setPopup({ type: "project", item: project });
                  }}
                  className="cursor-pointer transition hover:opacity-90"
                />
                <text x={project.center.x} y={project.center.y} textAnchor="middle" fill="#ffffff" fontSize="12" fontWeight="900" pointerEvents="none">{project.county}</text>
              </g>
            );
          })}
          {layers.facilities && visibleFacilities.map((point) => (
            <g key={point.id} onClick={(event) => { event.stopPropagation(); setPopup({ type: "facility", item: point }); }} className="cursor-pointer">
              <circle cx={point.x} cy={point.y} r="11" fill={facilityColor(point.type)} stroke="#ffffff" strokeWidth="3" />
              <path d={`M${point.x - 5} ${point.y + 2} L${point.x} ${point.y - 6} L${point.x + 6} ${point.y + 2} Z`} fill="#ffffff" opacity="0.9" />
            </g>
          ))}
          {visibleDevices.filter((item) => (item.type === "摄像头" && layers.cameras) || (item.type === "墒情设备" && layers.moisture) || (item.type === "虫情设备" && layers.insects)).map((point) => {
            const color = point.status === "预警" ? "#f97316" : point.status === "离线" ? "#94a3b8" : "#22d3ee";
            return (
              <g key={point.id} onClick={(event) => { event.stopPropagation(); setPopup({ type: "device", item: point }); }} className="cursor-pointer">
                <circle cx={point.x} cy={point.y} r="15" fill={color} fillOpacity="0.22" stroke={color} strokeWidth="2" />
                <circle cx={point.x} cy={point.y} r="6" fill={color} stroke="#fff" strokeWidth="2" />
              </g>
            );
          })}
        </g>
      </svg>
      <div className="absolute bottom-5 right-5 z-20 rounded-2xl border border-white/16 bg-slate-950/55 px-4 py-3 text-xs text-cyan-50 shadow-2xl backdrop-blur-xl">
        <div className="flex items-center gap-4"><span>比例尺 1:50000</span><span>经度 117.23°</span><span>纬度 31.82°</span></div>
      </div>
      {selectedProject && !popup && (
        <div className="absolute right-20 top-4 z-20 rounded-2xl border border-yellow-200/30 bg-yellow-50/95 px-4 py-3 text-sm text-[#123d2f] shadow-xl">
          已定位：<b>{selectedProject.name}</b>
        </div>
      )}
      {popup && (
        <div className="absolute right-5 top-20 z-30 w-[360px] rounded-3xl border border-white/80 bg-white p-5 text-slate-800 shadow-2xl shadow-emerald-950/25">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-xs font-black text-cyan-700">{popup.type === "project" ? "项目区属性卡" : popup.type === "facility" ? "工程设施点位" : "物联网设备点位"}</p>
              <h3 className="mt-1 text-lg font-black text-[#123d2f]">{popup.item.name}</h3>
            </div>
            <button onClick={() => setPopup(null)} className="text-xl text-slate-400 hover:text-slate-700">×</button>
          </div>
          {popup.type === "project" && (
            <div className="mt-4 space-y-3 text-sm">
              <div className="grid grid-cols-2 gap-2">
                <div className="rounded-xl bg-emerald-50 p-3"><b>建设面积</b><br />{popup.item.area.toLocaleString()} 亩</div>
                <div className="rounded-xl bg-emerald-50 p-3"><b>投资金额</b><br />{popup.item.investment.toLocaleString()} 万元</div>
                <div className="rounded-xl bg-emerald-50 p-3"><b>建设状态</b><br />{popup.item.status}</div>
                <div className="rounded-xl bg-emerald-50 p-3"><b>当前进度</b><br />{popup.item.progress}%</div>
              </div>
              <div className="rounded-xl bg-slate-50 p-3 leading-6">{popup.item.city}{popup.item.county}{popup.item.town}<br />施工单位：{popup.item.constructionUnit}<br />监理单位：{popup.item.supervisionUnit}</div>
              <button onClick={() => onOpenProjectDetail(popup.item)} className="w-full rounded-xl bg-[#123d2f] px-4 py-3 text-sm font-black text-white">进入项目详情</button>
            </div>
          )}
          {popup.type === "facility" && (
            <div className="mt-4 grid grid-cols-2 gap-2 text-sm">
              <div className="rounded-xl bg-cyan-50 p-3"><b>设施类型</b><br />{popup.item.type}</div>
              <div className="rounded-xl bg-cyan-50 p-3"><b>运行状态</b><br />{popup.item.status}</div>
              <div className="col-span-2 rounded-xl bg-slate-50 p-3">工程点位已接入项目施工监管台账，可联动查看施工照片、验收记录和整改闭环。</div>
            </div>
          )}
          {popup.type === "device" && (
            <div className="mt-4 space-y-3 text-sm">
              <div className="grid grid-cols-2 gap-2">
                <div className="rounded-xl bg-sky-50 p-3"><b>设备类型</b><br />{popup.item.type}</div>
                <div className="rounded-xl bg-sky-50 p-3"><b>在线状态</b><br />{popup.item.status}</div>
              </div>
              {popup.item.type === "摄像头" && <div className="grid h-32 place-items-center rounded-xl bg-slate-900 text-cyan-100">现场视频画面摘要</div>}
              <div className="rounded-xl bg-slate-50 p-3 leading-6">实时数据：{popup.item.value}<br />采集时间：{popup.item.time}</div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
