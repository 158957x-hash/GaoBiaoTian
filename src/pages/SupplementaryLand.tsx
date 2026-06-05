import { useMemo, useState } from "react";
import { ArrowLeft, BarChart3, CheckCircle2, FileSearch, FlaskConical, LocateFixed, Search, Sprout } from "lucide-react";
import SupplementaryLandMap from "@/components/supplementary/SupplementaryLandMap";
import { getSupervisionParentRegion, getSupervisionRegionName } from "@/data/supervisionMap";
import {
  buildSupplementaryStats,
  defaultSupplementaryLayers,
  filterSupplementaryParcels,
  supplementaryGradeColor,
  supplementaryParcels,
  type QualityGrade,
  type SupplementaryParcel,
} from "@/data/supplementaryLand";

type SupplementaryLandProps = {
  onBack: () => void;
};

const gradeOptions = ["全部", "优等", "良等", "中等", "一般"];
const statusOptions = ["全部", "待鉴定", "县级初验", "市级复核", "省级备案", "整改中", "已通过"];
const regionOptions = ["anhui", "hefei", "suzhou", "fuyang"];

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

function ParcelPanel({ parcel, onOpenDetail }: { parcel: SupplementaryParcel | null; onOpenDetail: (parcel: SupplementaryParcel) => void }) {
  if (!parcel) {
    return (
      <div className="rounded-[2rem] border border-white/80 bg-white/82 p-6 shadow-xl shadow-emerald-900/5 backdrop-blur-xl">
        <p className="text-sm font-black text-lime-700">图斑属性</p>
        <h3 className="mt-2 text-2xl font-black text-[#123d2f]">请选择补充耕地图斑</h3>
        <p className="mt-4 text-sm leading-7 text-slate-500">点击中间 GIS 地图中的地块，可查看项目名称、地块编号、面积、耕地类型、评价单元、采样点数量、检测结果和质量等级。</p>
      </div>
    );
  }

  return (
    <div className="rounded-[2rem] border border-white/80 bg-white/88 p-6 shadow-xl shadow-emerald-900/5 backdrop-blur-xl">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-sm font-black text-lime-700">图斑属性</p>
          <h3 className="mt-2 text-xl font-black leading-snug text-[#123d2f]">{parcel.projectName}</h3>
        </div>
        <span className="shrink-0 rounded-full px-3 py-1 text-xs font-black text-white" style={{ backgroundColor: supplementaryGradeColor(parcel.qualityGrade) }}>{parcel.qualityGrade}</span>
      </div>
      <div className="mt-5 grid grid-cols-2 gap-3 text-sm">
        <div className="rounded-2xl bg-lime-50 p-4"><b>地块编号</b><br />{parcel.code}</div>
        <div className="rounded-2xl bg-lime-50 p-4"><b>地块面积</b><br />{parcel.area.toLocaleString()} 亩</div>
        <div className="rounded-2xl bg-lime-50 p-4"><b>耕地类型</b><br />{parcel.landType}</div>
        <div className="rounded-2xl bg-lime-50 p-4"><b>鉴定状态</b><br />{parcel.status}</div>
      </div>
      <div className="mt-4 rounded-2xl bg-slate-50 p-4 text-sm leading-7 text-slate-600">
        所属区域：{parcel.city}{parcel.county}{parcel.town}<br />评价单元：{parcel.evaluationUnit}<br />采样点数量：{parcel.sampleCount} 个<br />检测结果：{parcel.testResult}
      </div>
      <button onClick={() => onOpenDetail(parcel)} className="mt-5 w-full rounded-2xl bg-[#123d2f] px-5 py-3 text-sm font-black text-white shadow-lg shadow-emerald-950/15">查看质量档案</button>
    </div>
  );
}

export default function SupplementaryLand({ onBack }: SupplementaryLandProps) {
  const [view, setView] = useState<"map" | "database">("map");
  const [regionId, setRegionId] = useState("anhui");
  const [keyword, setKeyword] = useState("");
  const [searchText, setSearchText] = useState("");
  const [grade, setGrade] = useState("全部");
  const [status, setStatus] = useState("全部");
  const [selectedParcel, setSelectedParcel] = useState<SupplementaryParcel | null>(supplementaryParcels[0]);
  const [detailParcel, setDetailParcel] = useState<SupplementaryParcel | null>(null);
  const [layers, setLayers] = useState(defaultSupplementaryLayers);
  const parcels = useMemo(() => filterSupplementaryParcels(regionId, keyword, grade, status), [grade, keyword, regionId, status]);
  const stats = useMemo(() => buildSupplementaryStats(parcels), [parcels]);
  const gradeRows = useMemo(() => ["优等", "良等", "中等", "一般"].map((item) => ({ grade: item as QualityGrade, count: parcels.filter((parcel) => parcel.qualityGrade === item).length })), [parcels]);

  const handleSearch = () => {
    const text = searchText.trim();
    setKeyword(text);
    const matched = filterSupplementaryParcels(regionId, text, grade, status)[0];
    if (matched) setSelectedParcel(matched);
  };

  const locateParcel = (parcel: SupplementaryParcel) => {
    setSelectedParcel(parcel);
    setRegionId(parcel.regionId);
    setView("map");
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

        <section className="mt-5 grid gap-4 md:grid-cols-2 xl:grid-cols-5">
          <StatCard label="补充地块" value={stats.count} unit="块" icon={Sprout} />
          <StatCard label="补充面积" value={stats.area.toLocaleString()} unit="亩" icon={BarChart3} />
          <StatCard label="采样点" value={stats.samples} unit="个" icon={FlaskConical} />
          <StatCard label="备案通过" value={stats.passed} unit="块" icon={CheckCircle2} />
          <StatCard label="通过率" value={stats.passRate} unit="%" icon={FileSearch} />
        </section>

        <section className="mt-5 flex flex-wrap gap-3 rounded-[2rem] border border-white/80 bg-white/80 p-4 shadow-xl shadow-emerald-900/5 backdrop-blur-xl">
          <button onClick={() => setView("map")} className={`rounded-2xl px-5 py-3 text-sm font-black ${view === "map" ? "bg-[#123d2f] text-white" : "bg-lime-50 text-[#123d2f]"}`}>质量一张图</button>
          <button onClick={() => setView("database")} className={`rounded-2xl px-5 py-3 text-sm font-black ${view === "database" ? "bg-[#123d2f] text-white" : "bg-lime-50 text-[#123d2f]"}`}>质量等级数据库</button>
          <div className="ml-auto flex flex-wrap gap-3">
            <select value={grade} onChange={(event) => setGrade(event.target.value)} className="rounded-2xl bg-slate-100 px-4 py-3 text-sm font-bold outline-none">{gradeOptions.map((item) => <option key={item}>{item}</option>)}</select>
            <select value={status} onChange={(event) => setStatus(event.target.value)} className="rounded-2xl bg-slate-100 px-4 py-3 text-sm font-bold outline-none">{statusOptions.map((item) => <option key={item}>{item}</option>)}</select>
          </div>
        </section>

        {view === "map" ? (
          <section className="mt-5 grid gap-5 xl:grid-cols-[280px_minmax(760px,1fr)_380px]">
            <aside className="space-y-5">
              <div className="rounded-[2rem] border border-white/80 bg-white/84 p-5 shadow-xl shadow-emerald-900/5 backdrop-blur-xl">
                <p className="text-sm font-black text-lime-700">GIS 空间查询</p>
                <div className="mt-4 flex gap-2 rounded-2xl bg-slate-100 p-2">
                  <input value={searchText} onChange={(event) => setSearchText(event.target.value)} onKeyDown={(event) => { if (event.key === "Enter") handleSearch(); }} placeholder="项目名称/地块编号" className="min-w-0 flex-1 bg-transparent px-2 text-sm outline-none" />
                  <button onClick={handleSearch} className="grid h-10 w-10 place-items-center rounded-xl bg-[#123d2f] text-white"><Search className="h-4 w-4" /></button>
                </div>
                <div className="mt-4 space-y-2">
                  {parcels.slice(0, 5).map((parcel) => (
                    <button key={parcel.id} onClick={() => setSelectedParcel(parcel)} className={`w-full rounded-2xl border px-3 py-3 text-left text-sm transition ${selectedParcel?.id === parcel.id ? "border-lime-500 bg-lime-50" : "border-slate-100 bg-white hover:bg-slate-50"}`}>
                      <div className="font-black text-[#123d2f]">{parcel.projectName}</div>
                      <div className="mt-1 text-xs text-slate-500">{parcel.code} · {parcel.qualityGrade}</div>
                    </button>
                  ))}
                </div>
              </div>
              <div className="rounded-[2rem] border border-white/80 bg-white/84 p-5 shadow-xl shadow-emerald-900/5 backdrop-blur-xl">
                <div className="flex items-center justify-between"><p className="text-sm font-black text-lime-700">行政区下钻</p>{regionId !== "anhui" && <button onClick={() => setRegionId(getSupervisionParentRegion(regionId))} className="text-xs font-black text-lime-700">返回上级</button>}</div>
                <div className="mt-4 grid gap-2">
                  {regionOptions.map((id) => <button key={id} onClick={() => setRegionId(id)} className={`rounded-xl px-4 py-3 text-left text-sm font-bold ${regionId === id ? "bg-[#123d2f] text-white" : "bg-lime-50 text-[#123d2f]"}`}>{getSupervisionRegionName(id)}</button>)}
                </div>
              </div>
            </aside>

            <SupplementaryLandMap parcels={parcels} regionId={regionId} selectedParcelId={selectedParcel?.id} layers={layers} onLayersChange={setLayers} onParcelSelect={setSelectedParcel} onRegionDrill={setRegionId} onOpenParcelDetail={setDetailParcel} />

            <aside className="space-y-5">
              <ParcelPanel parcel={selectedParcel} onOpenDetail={setDetailParcel} />
              <div className="rounded-[2rem] border border-white/80 bg-white/84 p-6 shadow-xl shadow-emerald-900/5 backdrop-blur-xl">
                <p className="text-sm font-black text-lime-700">质量等级分布</p>
                <div className="mt-4 space-y-4">
                  {gradeRows.map((row) => (
                    <div key={row.grade}>
                      <div className="mb-2 flex justify-between text-sm font-bold"><span>{row.grade}</span><span>{row.count} 块</span></div>
                      <div className="h-3 overflow-hidden rounded-full bg-slate-100"><div className="h-full rounded-full" style={{ width: `${parcels.length ? (row.count / parcels.length) * 100 : 0}%`, backgroundColor: supplementaryGradeColor(row.grade) }} /></div>
                    </div>
                  ))}
                </div>
              </div>
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
              <select value={status} onChange={(event) => setStatus(event.target.value)} className="rounded-2xl bg-slate-100 px-4 py-3 text-sm font-bold outline-none">{statusOptions.map((item) => <option key={item}>{item}</option>)}</select>
            </div>
            <div className="mt-6 overflow-hidden rounded-2xl border border-slate-100">
              <table className="w-full text-left text-sm">
                <thead className="bg-[#123d2f] text-white"><tr><th className="px-4 py-3">行政区</th><th className="px-4 py-3">项目名称</th><th className="px-4 py-3">地块编号</th><th className="px-4 py-3">面积</th><th className="px-4 py-3">耕地类型</th><th className="px-4 py-3">质量等级</th><th className="px-4 py-3">鉴定状态</th><th className="px-4 py-3">操作</th></tr></thead>
                <tbody>{parcels.map((parcel) => <tr key={parcel.id} className="border-b border-slate-100 bg-white/80"><td className="px-4 py-3 font-bold text-[#123d2f]">{parcel.city}{parcel.county}</td><td className="px-4 py-3">{parcel.projectName}</td><td className="px-4 py-3">{parcel.code}</td><td className="px-4 py-3">{parcel.area} 亩</td><td className="px-4 py-3">{parcel.landType}</td><td className="px-4 py-3"><span className="rounded-full px-3 py-1 text-xs font-black text-white" style={{ backgroundColor: supplementaryGradeColor(parcel.qualityGrade) }}>{parcel.qualityGrade}</span></td><td className="px-4 py-3">{parcel.status}</td><td className="px-4 py-3"><div className="flex gap-2"><button onClick={() => setDetailParcel(parcel)} className="rounded-xl bg-lime-50 px-3 py-2 text-xs font-black text-lime-700">查看详情</button><button onClick={() => locateParcel(parcel)} className="rounded-xl bg-emerald-50 px-3 py-2 text-xs font-black text-emerald-700">定位图斑</button><button onClick={() => setDetailParcel(parcel)} className="rounded-xl bg-amber-50 px-3 py-2 text-xs font-black text-amber-700">检测结果</button></div></td></tr>)}</tbody>
              </table>
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
