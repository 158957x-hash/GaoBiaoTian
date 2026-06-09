import { useEffect, useMemo, useState } from "react";
import { ArrowLeft, AlertTriangle, BarChart3, CheckCircle2, FileSearch, LocateFixed, PackageCheck, Search, Sprout } from "lucide-react";
import SupplementaryLandMap from "@/components/supplementary/SupplementaryLandMap";
import { getSupervisionRegionName } from "@/data/supervisionMap";
import {
  buildSupplementaryStats,
  defaultSupplementaryLayers,
  filterSupplementaryParcels,
  type SupplementaryParcel,
  type SupplementaryStatus,
} from "@/data/supplementaryLand";

type SupplementaryLandProps = {
  onBack: () => void;
  initialView?: "map" | "database";
};

type SupplementaryProjectSummary = {
  id: string;
  name: string;
  parcels: SupplementaryParcel[];
};

type SupplementarySelection =
  | { type: "region" }
  | { type: "project"; project: SupplementaryProjectSummary }
  | { type: "parcel"; parcel: SupplementaryParcel };

const gradeOptions = ["全部", "优等", "良等", "中等", "一般"];
const statusOptions = [
  { value: "全部", label: "全部" },
  { value: "待鉴定", label: "待鉴定" },
  { value: "县级初验", label: "县级初验" },
  { value: "市级复核", label: "市级鉴定" },
  { value: "省级备案", label: "省级抽核" },
  { value: "整改中", label: "整改中" },
  { value: "已通过", label: "已通过" },
];
const regionOptions = ["anhui", "hefei", "feixi"];
const acceptanceStatuses: SupplementaryStatus[] = ["待鉴定", "县级初验", "市级复核", "省级备案", "整改中", "已通过"];
const qualityLevelPalette = ["#0f766e", "#16a34a", "#22c55e", "#65a30d", "#84cc16", "#a3e635", "#facc15", "#f59e0b", "#f97316", "#ef4444"];

function historicalStats(parcels: SupplementaryParcel[]) {
  const projectCount = projectNameCounts(parcels);
  const parcelCount = parcels.length;
  const supplementaryArea = Number(parcels.reduce((sum, parcel) => sum + parcel.area, 0).toFixed(1));
  const passed = passedCount(parcels);
  const completedRate = parcelCount > 0 ? Number(((passed / parcelCount) * 100).toFixed(1)) : 0;
  const storageArea = Number((supplementaryArea * (completedRate / 100)).toFixed(1));
  const qualityRate = parcelCount > 0 ? Number(((parcels.filter((parcel) => ["优等", "良等"].includes(parcel.qualityGrade)).length / parcelCount) * 100).toFixed(1)) : 0;
  const rectificationCount = parcels.filter((parcel) => parcel.status === "整改中").length;
  return { projectCount, parcelCount, supplementaryArea, completedRate, storageArea, qualityRate, rectificationCount };
}

function StatCard({ label, value, unit, icon: Icon }: { label: string; value: string | number; unit: string; icon: typeof BarChart3 }) {
  return (
    <div className="rounded-3xl border border-white/70 bg-white/86 p-5 shadow-[0_16px_50px_rgba(18,61,47,0.08)] backdrop-blur-xl">
      <div className="flex items-center justify-between">
        <p className="text-sm font-bold text-slate-500">{label}</p>
        <div className="grid h-10 w-10 place-items-center rounded-2xl bg-[#123d2f] text-lime-100"><Icon className="h-5 w-5" /></div>
      </div>
      <div className="mt-4 flex items-end gap-1"><span className="text-3xl font-black text-[#123d2f]">{value}</span><span className="pb-1 text-xs font-bold text-slate-400">{unit}</span></div>
    </div>
  );
}

function parcelQualityLevel(parcel: SupplementaryParcel) {
  const number = Number(parcel.code.slice(-2));
  return ((Number.isFinite(number) ? number : 1) % 10) + 1;
}

function projectNameCounts(parcels: SupplementaryParcel[]) {
  return new Set(parcels.map((parcel) => parcel.projectName)).size;
}

function passedCount(parcels: SupplementaryParcel[]) {
  return parcels.filter((parcel) => parcel.status === "已通过" || parcel.status === "省级备案").length;
}

function syntheticQualityArea(parcels: SupplementaryParcel[], level: number) {
  const measured = parcels.filter((parcel) => parcelQualityLevel(parcel) === level).reduce((sum, parcel) => sum + parcel.area, 0);
  if (measured > 0) return measured;
  const baseArea = parcels.reduce((sum, parcel) => sum + parcel.area, 0) / Math.max(parcels.length, 1);
  const regionFactor = parcels.length ? ((parcels.length * 17 + level * 11) % 13) / 100 : 0;
  const levelFactor = 0.34 + (11 - level) * 0.045 + regionFactor;
  return Number((baseArea * levelFactor).toFixed(1));
}

function statusLabel(status: SupplementaryStatus | "全部") {
  if (status === "市级复核") return "市级鉴定";
  if (status === "省级备案") return "省级抽核";
  return status;
}

function statusTone(status: SupplementaryStatus) {
  if (status === "已通过" || status === "省级备案") return "bg-emerald-500";
  if (status === "整改中") return "bg-orange-400";
  if (status === "市级复核" || status === "县级初验") return "bg-sky-500";
  return "bg-slate-400";
}

const qualityDatabaseHeaders = ["地块编号", "面积（亩）", "行政区化", "补充耕地类型", "变更前具体用途", "变更前土地利用现状分类", "变更前土地利用现状编码", "地形类型", "地形部位", "土壤类型", "补充耕地来源", "基础设施", "土地利用方式", "是否有客土", "当前阶段", "农业生产符合性评价", "耕地质量等级评价", "操作"];

function qualityDatabaseRow(parcel: SupplementaryParcel, index: number) {
  const level = parcelQualityLevel(parcel);
  const isConstruction = index % 4 > 0;
  const slope = level > 7 ? "山地" : level > 5 ? "丘陵" : "平原";
  const terrainPart = slope === "山地" ? "山麓缓坡" : slope === "丘陵" ? "丘陵坡脚" : level > 3 ? "平原低阶" : "平原中阶";
  const facility = parcel.status === "整改中" ? "基本满足" : level > 6 ? "满足" : "充分满足";
  const source = isConstruction ? "垦造" : "恢复";
  const useType = parcel.landType === "水田" ? "水田" : parcel.landType === "水浇地" ? "水浇地" : "旱地";
  return [
    parcel.code,
    parcel.area.toFixed(2),
    `${parcel.county}${parcel.town}`,
    isConstruction ? "非农建设补充耕地" : "进出平衡补充耕地",
    index % 3 === 0 ? "工矿企业建设" : index % 3 === 1 ? "交通设施建设" : "村镇建设用地",
    index % 2 === 0 ? "工矿仓储用地" : "建设用地",
    `20${String((index % 9) + 1).padStart(2, "0")}`,
    slope,
    terrainPart,
    level > 8 ? "砂壤土" : level > 5 ? "黄棕壤" : "水稻土",
    source,
    facility,
    useType,
    index % 5 === 0 ? "是" : "否",
    statusLabel(parcel.status),
    parcel.status === "整改中" ? "不合格" : "合格",
    `${level}等`,
  ];
}

function AcceptanceProgressPanel({ parcels }: { parcels: SupplementaryParcel[] }) {
  const total = Math.max(parcels.length, 1);
  return (
    <div className="rounded-[2rem] border border-white/80 bg-white/84 p-5 shadow-xl shadow-emerald-900/5 backdrop-blur-xl">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-black text-lime-700">地区验收进度</p>
          <h3 className="mt-1 text-xl font-black text-[#123d2f]">流程状态分布</h3>
        </div>
        <span className="rounded-full bg-lime-50 px-3 py-1 text-xs font-black text-lime-700">{parcels.length} 块</span>
      </div>
      <div className="mt-5 space-y-3">
        {acceptanceStatuses.map((status) => {
          const count = parcels.filter((parcel) => parcel.status === status).length;
          const percent = (count / total) * 100;
          return (
            <div key={status}>
              <div className="mb-1 flex justify-between text-xs font-black text-slate-500"><span>{statusLabel(status)}</span><span>{count} 块 · {percent.toFixed(0)}%</span></div>
              <div className="h-2.5 overflow-hidden rounded-full bg-slate-100"><div className={`h-full rounded-full ${statusTone(status)}`} style={{ width: `${percent}%` }} /></div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function ConformityPie({ parcels }: { parcels: SupplementaryParcel[] }) {
  const passed = passedCount(parcels);
  const total = Math.max(parcels.length, 1);
  const percent = (passed / total) * 100;
  return (
    <div className="flex items-center justify-center py-4">
      <div className="grid h-32 w-32 place-items-center rounded-full" style={{ background: `conic-gradient(#16a34a 0 ${percent}%, #f97316 ${percent}% 100%)` }}>
        <div className="grid h-20 w-20 place-items-center rounded-full bg-white text-center text-xs font-black text-[#123d2f]">通过<br />{percent.toFixed(0)}%</div>
      </div>
    </div>
  );
}

function QualityLevelBars({ parcels }: { parcels: SupplementaryParcel[] }) {
  const levels = Array.from({ length: 10 }, (_, index) => index + 1);
  const areaRows = levels.map((level) => ({ level, area: syntheticQualityArea(parcels, level) }));
  const maxArea = Math.max(...areaRows.map((row) => row.area), 1);
  return (
    <div className="mt-4 rounded-2xl border border-slate-100 bg-slate-50 px-4 pb-4 pt-5">
      <div className="flex h-44 items-end gap-2">
        {areaRows.map(({ level, area }) => {
          const height = Math.max((area / maxArea) * 156, 16);
          return (
            <div key={level} className="flex h-full flex-1 flex-col justify-end gap-2">
              <div className="mx-auto w-full rounded-t-lg shadow-sm" style={{ height: `${height}px`, backgroundColor: qualityLevelPalette[level - 1] }} />
              <span className="text-center text-[10px] font-black text-slate-500">{level}等</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function RegionStatsPanel({ regionName, parcels }: { regionName: string; parcels: SupplementaryParcel[] }) {
  const stats = buildSupplementaryStats(parcels);
  return (
    <div className="rounded-[2rem] border border-white/80 bg-white/88 p-6 shadow-xl shadow-emerald-900/5 backdrop-blur-xl">
      <h3 className="text-2xl font-black text-[#123d2f]">区域验收统计</h3>
      <div className="mt-5 space-y-3 text-lg leading-8 text-slate-700">
        <p>行政区划：{regionName}</p>
        <p>补充耕地面积：{stats.area.toLocaleString()}亩</p>
        <p>图斑数量：{stats.count}</p>
        <p>项目数量：{projectNameCounts(parcels)}</p>
      </div>
      <h4 className="mt-8 text-lg font-black text-slate-800">农业符合性评价通过情况</h4>
      <ConformityPie parcels={parcels} />
      <h4 className="mt-6 text-lg font-black text-slate-800">耕地质量等级分布</h4>
      <QualityLevelBars parcels={parcels} />
    </div>
  );
}

function ProjectStatsPanel({ project }: { project: SupplementaryProjectSummary }) {
  const stats = buildSupplementaryStats(project.parcels);
  const first = project.parcels[0];
  return (
    <div className="rounded-[2rem] border border-white/80 bg-white/88 p-6 shadow-xl shadow-emerald-900/5 backdrop-blur-xl">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h3 className="text-2xl font-black text-[#123d2f]">项目验收统计</h3>
          <div className="mt-5 space-y-3 text-lg leading-8 text-slate-700">
            <p>项目名称：{project.name}</p>
            <p>行政区划：{first ? `${first.city}${first.county}` : "--"}</p>
            <p>补充耕地面积：{stats.area.toLocaleString()}亩</p>
            <p>图斑数量：{stats.count}</p>
          </div>
        </div>
        <button className="shrink-0 rounded-xl bg-sky-500 px-4 py-3 text-sm font-black text-white">查看鉴定意见报告</button>
      </div>
      <h4 className="mt-8 text-lg font-black text-slate-800">农业符合性评价通过情况</h4>
      <ConformityPie parcels={project.parcels} />
      <h4 className="mt-6 text-lg font-black text-slate-800">耕地质量等级分布</h4>
      <QualityLevelBars parcels={project.parcels} />
    </div>
  );
}

function ParcelStatsPanel({ parcel, onOpenDetail }: { parcel: SupplementaryParcel; onOpenDetail: (parcel: SupplementaryParcel) => void }) {
  return (
    <div className="rounded-[2rem] border border-white/80 bg-white/88 p-6 shadow-xl shadow-emerald-900/5 backdrop-blur-xl">
      <h3 className="text-2xl font-black text-[#123d2f]">地块验收统计</h3>
      <div className="mt-5 space-y-3 text-lg leading-8 text-slate-700">
        <p>地块编号：{parcel.code}</p>
        <p>所属行政区划：{parcel.city}{parcel.county}</p>
        <p>面积：{parcel.area.toLocaleString()}亩</p>
        <p>所属项目：{parcel.projectName}</p>
      </div>
      <div className="mt-6 space-y-5 text-lg font-black text-slate-800">
        <div className="flex justify-between"><span>鉴定阶段：{parcel.status === "待鉴定" ? "县级初鉴" : parcel.status}</span><button onClick={() => onOpenDetail(parcel)} className="text-base text-sky-500">查看地块详情&gt;&gt;</button></div>
        <p>鉴定状态：{parcel.status}</p>
        <div className="flex justify-between"><span>农业符合性评价：{parcel.status === "整改中" ? "待整改" : "达标"}</span><button className="text-base text-sky-500">展开详情&gt;&gt;</button></div>
        <div className="rounded-xl border border-slate-300 p-6 text-center text-base font-medium text-slate-600">展示所有农业符合性评价的指标项及参数</div>
        <div className="flex justify-between"><span>耕地质量等级评价：{parcelQualityLevel(parcel)}.{parcel.sampleCount}</span><button className="text-base text-sky-500">展开详情&gt;&gt;</button></div>
        <div className="rounded-xl border border-slate-300 p-6 text-center text-base font-medium text-slate-600">展示所有耕地质量等级评价的指标项及参数</div>
      </div>
    </div>
  );
}

function DynamicStatsPanel({ selection, regionName, parcels, onOpenDetail }: { selection: SupplementarySelection; regionName: string; parcels: SupplementaryParcel[]; onOpenDetail: (parcel: SupplementaryParcel) => void }) {
  if (selection.type === "project") return <ProjectStatsPanel project={selection.project} />;
  if (selection.type === "parcel") return <ParcelStatsPanel parcel={selection.parcel} onOpenDetail={onOpenDetail} />;
  return <RegionStatsPanel regionName={regionName} parcels={parcels} />;
}

export default function SupplementaryLand({ onBack, initialView = "map" }: SupplementaryLandProps) {
  const [view, setView] = useState<"map" | "database">(initialView);
  const [regionId, setRegionId] = useState("anhui");
  const [keyword, setKeyword] = useState("");
  const [searchText, setSearchText] = useState("");
  const [grade, setGrade] = useState("全部");
  const [status, setStatus] = useState("全部");
  const [selectedParcel, setSelectedParcel] = useState<SupplementaryParcel | null>(null);
  const [selection, setSelection] = useState<SupplementarySelection>({ type: "region" });
  const [detailParcel, setDetailParcel] = useState<SupplementaryParcel | null>(null);
  const [hasSearched, setHasSearched] = useState(false);
  const [databasePage, setDatabasePage] = useState(1);
  const [layers, setLayers] = useState(defaultSupplementaryLayers);
  const parcels = useMemo(() => filterSupplementaryParcels(regionId, keyword, grade, status), [grade, keyword, regionId, status]);
  const mapParcels = useMemo(() => filterSupplementaryParcels(regionId, "", grade, status), [grade, regionId, status]);
  const stats = useMemo(() => historicalStats(parcels), [parcels]);
  const pageSize = 10;
  const pageCount = Math.max(1, Math.ceil(parcels.length / pageSize));
  const currentPage = Math.min(databasePage, pageCount);
  const pagedParcels = parcels.slice((currentPage - 1) * pageSize, currentPage * pageSize);

  useEffect(() => {
    setSelectedParcel(null);
    setSelection({ type: "region" });
    setHasSearched(false);
    setDatabasePage(1);
  }, [regionId]);

  useEffect(() => {
    setDatabasePage(1);
  }, [grade, keyword, status]);

  const selectParcel = (parcel: SupplementaryParcel) => {
    setSelectedParcel(parcel);
    setSelection({ type: "parcel", parcel });
  };

  const handleSearch = () => {
    const text = searchText.trim();
    setKeyword(text);
    setHasSearched(Boolean(text));
    const matched = filterSupplementaryParcels(regionId, text, grade, status)[0];
    if (matched) locateParcel(matched);
  };

  const locateParcel = (parcel: SupplementaryParcel) => {
    setRegionId("feixi");
    setView("map");
    setHasSearched(true);
    window.setTimeout(() => selectParcel(parcel), 0);
  };

  return (
    <main className="min-h-screen bg-[#eef3e7] text-slate-900">
      <div className="fixed inset-0 bg-[radial-gradient(circle_at_12%_8%,rgba(132,204,22,0.2),transparent_25%),radial-gradient(circle_at_84%_10%,rgba(245,158,11,0.16),transparent_28%),linear-gradient(180deg,#f6f8ed_0%,#e8f0df_58%,#f5f0dd_100%)]" />
      <section className="relative mx-auto max-w-[1760px] px-6 py-6">
        <header className="flex flex-wrap items-center justify-between gap-4 rounded-[2rem] border border-white/80 bg-white/80 px-6 py-5 shadow-[0_18px_70px_rgba(18,61,47,0.08)] backdrop-blur-xl">
          <div className="flex items-center gap-4">
            <button onClick={onBack} className="grid h-12 w-12 place-items-center rounded-2xl bg-[#123d2f] text-white"><ArrowLeft className="h-5 w-5" /></button>
            <div><p className="text-sm font-black tracking-[0.28em] text-lime-700">SUPPLEMENTARY FARMLAND GIS</p><h1 className="mt-1 text-3xl font-black text-[#123d2f]">补充耕地验收管理系统 · 质量一张图</h1></div>
          </div>
          <div className="flex items-center gap-3 rounded-2xl bg-lime-50 px-4 py-3 text-sm font-bold text-[#123d2f]"><LocateFixed className="h-5 w-5 text-lime-700" />当前范围：{getSupervisionRegionName(regionId)}</div>
        </header>

        <section className="mt-5 grid gap-4 md:grid-cols-2 xl:grid-cols-6">
          <StatCard label="项目数 / 地块数" value={`${stats.projectCount} / ${stats.parcelCount}`} unit="个 / 块" icon={Sprout} />
          <StatCard label="补充耕地面积" value={stats.supplementaryArea.toLocaleString()} unit="亩" icon={BarChart3} />
          <StatCard label="验收完成率" value={stats.completedRate} unit="%" icon={CheckCircle2} />
          <StatCard label="合格入库面积" value={stats.storageArea.toLocaleString()} unit="亩" icon={PackageCheck} />
          <StatCard label="质量达标率" value={stats.qualityRate} unit="%" icon={FileSearch} />
          <StatCard label="待整改地块" value={stats.rectificationCount} unit="块" icon={AlertTriangle} />
        </section>

        <section className="mt-5 flex flex-wrap gap-3 rounded-[2rem] border border-white/80 bg-white/80 p-4 shadow-xl shadow-emerald-900/5 backdrop-blur-xl">
          <button onClick={() => setView("map")} className={`rounded-2xl px-5 py-3 text-sm font-black ${view === "map" ? "bg-[#123d2f] text-white" : "bg-lime-50 text-[#123d2f]"}`}>质量一张图</button>
          <button onClick={() => setView("database")} className={`rounded-2xl px-5 py-3 text-sm font-black ${view === "database" ? "bg-[#123d2f] text-white" : "bg-lime-50 text-[#123d2f]"}`}>质量等级数据库</button>
          <div className="ml-auto flex flex-wrap gap-3">
            <select value={grade} onChange={(event) => setGrade(event.target.value)} className="rounded-2xl bg-slate-100 px-4 py-3 text-sm font-bold outline-none">{gradeOptions.map((item) => <option key={item}>{item}</option>)}</select>
            <select value={status} onChange={(event) => setStatus(event.target.value)} className="rounded-2xl bg-slate-100 px-4 py-3 text-sm font-bold outline-none">{statusOptions.map((item) => <option key={item.value} value={item.value}>{item.label}</option>)}</select>
          </div>
        </section>

        {view === "map" ? (
          <section className="mt-5 grid gap-5 xl:grid-cols-[280px_minmax(760px,1fr)_420px]">
            <aside className="space-y-5">
              <div className="rounded-[2rem] border border-white/80 bg-white/84 p-5 shadow-xl shadow-emerald-900/5 backdrop-blur-xl">
                <p className="text-sm font-black text-lime-700">GIS 空间查询</p>
                <div className="mt-4 flex gap-2 rounded-2xl bg-slate-100 p-2">
                  <input value={searchText} onChange={(event) => setSearchText(event.target.value)} onKeyDown={(event) => { if (event.key === "Enter") handleSearch(); }} placeholder="输入项目名称/地块编号" className="min-w-0 flex-1 bg-transparent px-2 text-sm outline-none" />
                  <button onClick={handleSearch} className="grid h-10 w-10 place-items-center rounded-xl bg-[#123d2f] text-white"><Search className="h-4 w-4" /></button>
                </div>
                {hasSearched && (
                  <div className="mt-4 space-y-2">
                    {parcels.slice(0, 8).map((parcel) => (
                      <button key={parcel.id} onClick={() => locateParcel(parcel)} className={`w-full rounded-2xl border px-3 py-3 text-left text-sm transition ${selectedParcel?.id === parcel.id ? "border-lime-500 bg-lime-50" : "border-slate-100 bg-white hover:bg-slate-50"}`}>
                        <div className="font-black text-[#123d2f]">{parcel.code}</div>
                        <div className="mt-1 text-xs text-slate-500">{parcel.projectName} · {parcel.qualityGrade}</div>
                      </button>
                    ))}
                    {!parcels.length && <div className="rounded-2xl bg-white px-3 py-4 text-sm font-bold text-slate-400">未查询到匹配项目或地块</div>}
                  </div>
                )}
              </div>
              <AcceptanceProgressPanel parcels={parcels} />
            </aside>

            <SupplementaryLandMap parcels={mapParcels} regionId={regionId} selectedParcelId={selectedParcel?.id} selectedProjectName={selection.type === "project" ? selection.project.id : null} layers={layers} onLayersChange={setLayers} onParcelSelect={selectParcel} onProjectSelect={(project) => { setSelectedParcel(null); setSelection({ type: "project", project }); }} onRegionDrill={setRegionId} onOpenParcelDetail={setDetailParcel} />

            <aside className="space-y-5">
              <DynamicStatsPanel selection={selection} regionName={getSupervisionRegionName(regionId)} parcels={parcels} onOpenDetail={setDetailParcel} />
            </aside>
          </section>
        ) : (
          <section className="mt-5 rounded-[2rem] border border-white/80 bg-white/86 p-6 shadow-xl shadow-emerald-900/5 backdrop-blur-xl">
            <div className="flex flex-wrap items-center gap-3">
              <div className="flex items-center gap-2 rounded-2xl bg-slate-100 px-4 py-3">
                <Search className="h-4 w-4 text-slate-500" />
                <input value={searchText} onChange={(event) => setSearchText(event.target.value)} onKeyDown={(event) => { if (event.key === "Enter") handleSearch(); }} placeholder="行政区/项目名称/地块编号" className="w-72 bg-transparent text-sm outline-none" />
              </div>
              <button onClick={handleSearch} className="rounded-2xl bg-[#123d2f] px-5 py-3 text-sm font-black text-white">查询</button>
              <select value={regionId} onChange={(event) => setRegionId(event.target.value)} className="rounded-2xl bg-slate-100 px-4 py-3 text-sm font-bold outline-none">{regionOptions.map((id) => <option key={id} value={id}>{getSupervisionRegionName(id)}</option>)}</select>
              <select value={grade} onChange={(event) => setGrade(event.target.value)} className="rounded-2xl bg-slate-100 px-4 py-3 text-sm font-bold outline-none">{gradeOptions.map((item) => <option key={item}>{item}</option>)}</select>
              <select value={status} onChange={(event) => setStatus(event.target.value)} className="rounded-2xl bg-slate-100 px-4 py-3 text-sm font-bold outline-none">{statusOptions.map((item) => <option key={item.value} value={item.value}>{item.label}</option>)}</select>
            </div>
            <div className="mt-6 overflow-auto rounded-2xl border border-slate-200 bg-white">
              <table className="min-w-[2280px] w-full border-collapse text-center text-sm">
                <thead className="bg-slate-100 text-slate-800">
                  <tr>{qualityDatabaseHeaders.map((header) => <th key={header} className="border border-slate-300 px-3 py-3 font-black">{header}</th>)}</tr>
                </thead>
                <tbody>
                  {pagedParcels.map((parcel, index) => (
                    <tr key={parcel.id} className="bg-white hover:bg-lime-50/50">
                      {qualityDatabaseRow(parcel, (currentPage - 1) * pageSize + index).map((value, cellIndex) => <td key={`${parcel.id}-${cellIndex}`} className="whitespace-nowrap border border-slate-300 px-3 py-2 font-medium text-slate-700">{value}</td>)}
                      <td className="whitespace-nowrap border border-slate-300 px-3 py-2"><button type="button" className="rounded-lg bg-lime-50 px-3 py-1.5 text-xs font-black text-lime-700">查看详情</button></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="mt-4 flex flex-wrap items-center justify-between gap-3 text-sm font-bold text-slate-600">
              <span>共 {parcels.length} 条，每页 10 条，第 {currentPage} / {pageCount} 页</span>
              <div className="flex items-center gap-2">
                <button type="button" disabled={currentPage <= 1} onClick={() => setDatabasePage((page) => Math.max(1, page - 1))} className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-[#123d2f] disabled:cursor-not-allowed disabled:opacity-40">上一页</button>
                {Array.from({ length: pageCount }, (_, index) => index + 1).slice(Math.max(0, currentPage - 3), Math.min(pageCount, currentPage + 2)).map((page) => (
                  <button type="button" key={page} onClick={() => setDatabasePage(page)} className={`h-9 min-w-9 rounded-xl px-3 text-sm font-black ${page === currentPage ? "bg-[#123d2f] text-white" : "border border-slate-200 bg-white text-[#123d2f]"}`}>{page}</button>
                ))}
                <button type="button" disabled={currentPage >= pageCount} onClick={() => setDatabasePage((page) => Math.min(pageCount, page + 1))} className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-[#123d2f] disabled:cursor-not-allowed disabled:opacity-40">下一页</button>
              </div>
            </div>
          </section>
        )}
      </section>

      {detailParcel && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-slate-950/55 p-6 backdrop-blur-sm">
          <div className="max-h-[88vh] w-full max-w-4xl overflow-auto rounded-[2rem] bg-white p-7 shadow-2xl">
            <div className="flex items-start justify-between gap-5">
              <div><p className="text-sm font-black text-lime-700">补充耕地质量档案</p><h2 className="mt-2 text-2xl font-black text-[#123d2f]">{detailParcel.projectName}</h2></div>
              <button onClick={() => setDetailParcel(null)} className="text-2xl text-slate-400 hover:text-slate-700">×</button>
            </div>
            <div className="mt-6 grid gap-4 md:grid-cols-4">
              {[["地块编号", detailParcel.code], ["质量等级", detailParcel.qualityGrade], ["鉴定状态", detailParcel.status], ["采样点", `${detailParcel.sampleCount} 个`]].map(([label, value]) => <div key={label} className="rounded-2xl bg-lime-50 p-4"><div className="text-sm font-black text-lime-700">{label}</div><div className="mt-2 text-sm font-bold text-[#123d2f]">{value}</div></div>)}
            </div>
            <div className="mt-6 overflow-hidden rounded-2xl border border-slate-100">
              <table className="w-full text-left text-sm"><thead className="bg-[#123d2f] text-white"><tr><th className="px-4 py-3">档案项</th><th className="px-4 py-3">内容</th><th className="px-4 py-3">更新时间</th></tr></thead><tbody>{[["项目位置", `${detailParcel.city}${detailParcel.county}${detailParcel.town}`, "2026-06-05"], ["评价单元", detailParcel.evaluationUnit, "2026-06-04"], ["检测结果", detailParcel.testResult, "2026-06-04"], ["验收结论", `${detailParcel.qualityGrade}，${detailParcel.status}`, "2026-06-03"]].map((row) => <tr key={row[0]} className="border-b border-slate-100"><td className="px-4 py-3 font-bold text-[#123d2f]">{row[0]}</td><td className="px-4 py-3">{row[1]}</td><td className="px-4 py-3">{row[2]}</td></tr>)}</tbody></table>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}
