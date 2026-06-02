import { useMemo, useRef, useState } from "react";
import { Crosshair, Layers, Minus, Plus } from "lucide-react";
import { getChildRegions, getRegionName, qualityColor, type Plot } from "@/data/permanentFarmland";

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

const regionShapes = [
  { id: "hefei", points: "90,95 345,70 382,218 120,245", label: "合肥市", x: 214, y: 154 },
  { id: "suzhou", points: "430,78 730,92 696,250 418,222", label: "宿州市", x: 590, y: 160 },
  { id: "fuyang", points: "220,310 612,292 690,486 172,500", label: "阜阳市", x: 432, y: 400 },
];

export default function FarmlandMap({ plots, regionId, selectedPlotId, layers, onLayersChange, onPlotSelect, onRegionDrill, onOpenDetail, onLocateArchive }: FarmlandMapProps) {
  const [scale, setScale] = useState(1);
  const [offset, setOffset] = useState({ x: 0, y: 0 });
  const [dragging, setDragging] = useState(false);
  const [popupPlot, setPopupPlot] = useState<Plot | null>(null);
  const dragStart = useRef({ x: 0, y: 0, ox: 0, oy: 0 });
  const childRegions = getChildRegions(regionId);

  const visibleRegionShapes = useMemo(() => {
    if (regionId === "anhui") return regionShapes;
    if (childRegions.length) {
      return childRegions.map((item, index) => ({
        id: item.id,
        label: item.name,
        x: 170 + index * 230,
        y: 180 + (index % 2) * 145,
        points: `${95 + index * 220},${125 + (index % 2) * 110} ${285 + index * 220},${112 + (index % 2) * 110} ${310 + index * 220},${250 + (index % 2) * 110} ${118 + index * 220},${272 + (index % 2) * 110}`,
      }));
    }
    return [];
  }, [childRegions, regionId]);

  return (
    <div className="relative h-[620px] overflow-hidden rounded-[2rem] border border-emerald-900/10 bg-[#dcebd2] shadow-inner">
      <div className="absolute left-4 top-4 z-20 rounded-2xl bg-white/90 px-4 py-3 shadow-lg backdrop-blur">
        <div className="text-xs font-bold text-slate-500">当前行政区</div>
        <div className="text-lg font-black text-[#123d2f]">{getRegionName(regionId)}</div>
      </div>
      <div className="absolute right-4 top-4 z-20 flex flex-col gap-2">
        <button onClick={() => setScale((value) => Math.min(value + 0.15, 2.2))} className="grid h-10 w-10 place-items-center rounded-xl bg-white text-[#123d2f] shadow-lg"><Plus className="h-5 w-5" /></button>
        <button onClick={() => setScale((value) => Math.max(value - 0.15, 0.65))} className="grid h-10 w-10 place-items-center rounded-xl bg-white text-[#123d2f] shadow-lg"><Minus className="h-5 w-5" /></button>
        <button onClick={() => { setScale(1); setOffset({ x: 0, y: 0 }); }} className="grid h-10 w-10 place-items-center rounded-xl bg-white text-[#123d2f] shadow-lg"><Crosshair className="h-5 w-5" /></button>
      </div>
      <div className="absolute bottom-4 left-4 z-20 rounded-2xl bg-white/90 p-4 shadow-lg backdrop-blur">
        <div className="mb-2 flex items-center gap-2 text-sm font-black text-[#123d2f]"><Layers className="h-4 w-4" />图层控制</div>
        {[
          ["farmland", "永久农田图层"],
          ["highStandard", "高标准农田关联图层"],
          ["boundary", "行政区边界"],
        ].map(([key, label]) => (
          <label key={key} className="mt-2 flex items-center gap-2 text-xs text-slate-600">
            <input checked={layers[key as keyof LayerState]} onChange={(event) => onLayersChange({ ...layers, [key]: event.target.checked })} type="checkbox" className="accent-emerald-600" />
            {label}
          </label>
        ))}
      </div>
      <svg
        className="h-full w-full cursor-grab active:cursor-grabbing"
        viewBox="0 0 900 620"
        onWheel={(event) => {
          event.preventDefault();
          setScale((value) => Math.min(Math.max(value + (event.deltaY > 0 ? -0.08 : 0.08), 0.65), 2.2));
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
          <pattern id="mapGrid" width="34" height="34" patternUnits="userSpaceOnUse">
            <path d="M 34 0 L 0 0 0 34" fill="none" stroke="rgba(18,61,47,0.12)" strokeWidth="1" />
          </pattern>
        </defs>
        <rect width="900" height="620" fill="url(#mapGrid)" />
        <g transform={`translate(${offset.x} ${offset.y}) scale(${scale})`}>
          {layers.boundary && visibleRegionShapes.map((shape) => (
            <g key={shape.id}>
              <polygon points={shape.points} fill="rgba(255,255,255,0.35)" stroke="#0f766e" strokeWidth="3" strokeDasharray="8 6" onClick={() => onRegionDrill(shape.id)} className="cursor-pointer transition hover:opacity-80" />
              <text x={shape.x} y={shape.y} textAnchor="middle" fill="#123d2f" fontSize="24" fontWeight="800" onClick={() => onRegionDrill(shape.id)} className="cursor-pointer">{shape.label}</text>
            </g>
          ))}
          {layers.farmland && plots.map((plot) => {
            const selected = plot.id === selectedPlotId;
            return (
              <polygon
                key={plot.id}
                points={plot.points}
                fill={qualityColor(plot.qualityLevel)}
                fillOpacity={selected ? 0.92 : 0.72}
                stroke={plot.archiveStatus === "待完善" ? "#6b7280" : plot.isHighStandard && layers.highStandard ? "#2563eb" : "#ffffff"}
                strokeWidth={selected ? 5 : plot.isHighStandard && layers.highStandard ? 3 : 1.5}
                onClick={(event) => {
                  event.stopPropagation();
                  onPlotSelect(plot);
                  setPopupPlot(plot);
                }}
                className="cursor-pointer transition hover:opacity-100"
              />
            );
          })}
        </g>
      </svg>
      {popupPlot && (
        <div className="absolute right-5 top-24 z-30 w-80 rounded-3xl bg-white p-5 shadow-2xl shadow-emerald-950/20">
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="text-xs font-bold text-emerald-700">质量档案摘要</p>
              <h3 className="mt-1 text-lg font-black text-[#123d2f]">{popupPlot.blockNo}</h3>
            </div>
            <button onClick={() => setPopupPlot(null)} className="text-slate-400 hover:text-slate-700">×</button>
          </div>
          <div className="mt-4 grid grid-cols-2 gap-2 text-xs">
            <div className="rounded-xl bg-emerald-50 p-3"><b>所属区域</b><br />{popupPlot.city}{popupPlot.county}</div>
            <div className="rounded-xl bg-emerald-50 p-3"><b>图斑面积</b><br />{popupPlot.area} 亩</div>
            <div className="rounded-xl bg-emerald-50 p-3"><b>耕地类型</b><br />{popupPlot.landType}</div>
            <div className="rounded-xl bg-emerald-50 p-3"><b>质量等级</b><br />{popupPlot.qualityLevel} 等</div>
            <div className="rounded-xl bg-emerald-50 p-3"><b>是否高标田</b><br />{popupPlot.isHighStandard ? "是" : "否"}</div>
            <div className="rounded-xl bg-emerald-50 p-3"><b>档案状态</b><br />{popupPlot.archiveStatus}</div>
          </div>
          <div className="mt-3 rounded-xl bg-amber-50 p-3 text-xs"><b>关联高标田项目</b><br />{popupPlot.projectName}</div>
          <div className="mt-4 grid grid-cols-1 gap-2">
            <button onClick={() => onOpenDetail(popupPlot)} className="rounded-xl bg-[#123d2f] px-4 py-2 text-sm font-bold text-white">查看完整档案</button>
            <button onClick={() => onLocateArchive(popupPlot)} className="rounded-xl bg-emerald-100 px-4 py-2 text-sm font-bold text-emerald-800">定位到档案库</button>
            <button className="rounded-xl bg-sky-100 px-4 py-2 text-sm font-bold text-sky-800">查看关联高标田项目</button>
          </div>
        </div>
      )}
    </div>
  );
}
