import { useMemo, useState } from "react";
import { ArrowLeft, BarChart3, Building2, ClipboardList, Coins, LocateFixed, Search, ShieldAlert, TrendingUp } from "lucide-react";
import SupervisionGisMap from "@/components/supervision/SupervisionGisMap";
import {
  buildSupervisionStats,
  defaultSupervisionLayers,
  filterSupervisionProjects,
  getSupervisionParentRegion,
  getSupervisionRegionName,
  highStandardProjects,
  projectStatusColor,
  type HighStandardProject,
} from "@/data/supervisionMap";

type SupervisionMapProps = {
  onBack: () => void;
};

function StatCard({ label, value, unit, icon: Icon }: { label: string; value: string | number; unit: string; icon: typeof BarChart3 }) {
  return (
    <div className="rounded-3xl border border-white/70 bg-white/86 p-5 shadow-[0_16px_50px_rgba(18,61,47,0.08)] backdrop-blur-xl">
      <div className="flex items-center justify-between">
        <p className="text-sm font-bold text-slate-500">{label}</p>
        <div className="grid h-10 w-10 place-items-center rounded-2xl bg-[#123d2f] text-cyan-100"><Icon className="h-5 w-5" /></div>
      </div>
      <div className="mt-4 flex items-end gap-1"><span className="text-3xl font-black text-[#123d2f]">{value}</span><span className="pb-1 text-xs font-bold text-slate-400">{unit}</span></div>
    </div>
  );
}

function ProjectPanel({ project, onOpenDetail }: { project: HighStandardProject | null; onOpenDetail: (project: HighStandardProject) => void }) {
  if (!project) {
    return (
      <div className="rounded-[2rem] border border-white/80 bg-white/82 p-6 shadow-xl shadow-emerald-900/5 backdrop-blur-xl">
        <p className="text-sm font-black text-emerald-700">项目属性</p>
        <h3 className="mt-2 text-2xl font-black text-[#123d2f]">请选择地图项目区</h3>
        <p className="mt-4 text-sm leading-7 text-slate-500">点击中间 GIS 地图中的项目边界，可查看建设面积、投资金额、建设状态、施工单位、监理单位和当前进度。</p>
      </div>
    );
  }

  return (
    <div className="rounded-[2rem] border border-white/80 bg-white/88 p-6 shadow-xl shadow-emerald-900/5 backdrop-blur-xl">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-sm font-black text-emerald-700">项目属性</p>
          <h3 className="mt-2 text-xl font-black leading-snug text-[#123d2f]">{project.name}</h3>
        </div>
        <span className="shrink-0 rounded-full px-3 py-1 text-xs font-black text-white" style={{ backgroundColor: projectStatusColor(project.status) }}>{project.status}</span>
      </div>
      <div className="mt-5 grid grid-cols-2 gap-3 text-sm">
        <div className="rounded-2xl bg-emerald-50 p-4"><b>项目编号</b><br />{project.code}</div>
        <div className="rounded-2xl bg-emerald-50 p-4"><b>建设年度</b><br />{project.year} 年</div>
        <div className="rounded-2xl bg-emerald-50 p-4"><b>建设面积</b><br />{project.area.toLocaleString()} 亩</div>
        <div className="rounded-2xl bg-emerald-50 p-4"><b>投资金额</b><br />{project.investment.toLocaleString()} 万元</div>
      </div>
      <div className="mt-4 rounded-2xl bg-slate-50 p-4 text-sm leading-7 text-slate-600">
        所属区域：{project.city}{project.county}{project.town}<br />施工单位：{project.constructionUnit}<br />监理单位：{project.supervisionUnit}
      </div>
      <div className="mt-5">
        <div className="mb-2 flex justify-between text-sm font-bold"><span>当前进度</span><span>{project.progress}%</span></div>
        <div className="h-3 overflow-hidden rounded-full bg-emerald-100"><div className="h-full rounded-full bg-gradient-to-r from-emerald-500 to-cyan-400" style={{ width: `${project.progress}%` }} /></div>
      </div>
      <button onClick={() => onOpenDetail(project)} className="mt-5 w-full rounded-2xl bg-[#123d2f] px-5 py-3 text-sm font-black text-white shadow-lg shadow-emerald-950/15">进入项目详情</button>
    </div>
  );
}

export default function SupervisionMap({ onBack }: SupervisionMapProps) {
  const [regionId, setRegionId] = useState("anhui");
  const [keyword, setKeyword] = useState("");
  const [searchText, setSearchText] = useState("");
  const [selectedProject, setSelectedProject] = useState<HighStandardProject | null>(highStandardProjects[0]);
  const [detailProject, setDetailProject] = useState<HighStandardProject | null>(null);
  const [layers, setLayers] = useState(defaultSupervisionLayers);
  const projects = useMemo(() => filterSupervisionProjects(regionId, keyword), [keyword, regionId]);
  const stats = useMemo(() => buildSupervisionStats(projects), [projects]);
  const statusRows = useMemo(() => ["建设中", "已完工", "待验收", "整改中"].map((status) => ({ status, count: projects.filter((project) => project.status === status).length })), [projects]);

  const handleSearch = () => {
    const text = searchText.trim();
    setKeyword(text);
    const matched = filterSupervisionProjects(regionId, text)[0];
    if (matched) setSelectedProject(matched);
  };

  return (
    <main className="min-h-screen bg-[#e9f1ea] text-slate-900">
      <div className="fixed inset-0 bg-[radial-gradient(circle_at_12%_8%,rgba(34,197,94,0.2),transparent_25%),radial-gradient(circle_at_84%_10%,rgba(14,165,233,0.16),transparent_28%),linear-gradient(180deg,#f4f8ef_0%,#e7f0e6_58%,#f5f0dd_100%)]" />
      <section className="relative mx-auto max-w-[1760px] px-6 py-6">
        <header className="flex flex-wrap items-center justify-between gap-4 rounded-[2rem] border border-white/80 bg-white/80 px-6 py-5 shadow-[0_18px_70px_rgba(18,61,47,0.08)] backdrop-blur-xl">
          <div className="flex items-center gap-4">
            <button onClick={onBack} className="grid h-12 w-12 place-items-center rounded-2xl bg-[#123d2f] text-white"><ArrowLeft className="h-5 w-5" /></button>
            <div><p className="text-sm font-black tracking-[0.28em] text-emerald-700">HIGH STANDARD FARMLAND GIS</p><h1 className="mt-1 text-3xl font-black text-[#123d2f]">农田监管一张图 · 高标准农田建设动态监管</h1></div>
          </div>
          <div className="flex items-center gap-3 rounded-2xl bg-emerald-50 px-4 py-3 text-sm font-bold text-[#123d2f]"><LocateFixed className="h-5 w-5 text-emerald-700" />当前范围：{getSupervisionRegionName(regionId)}</div>
        </header>

        <section className="mt-5 grid gap-4 md:grid-cols-2 xl:grid-cols-6">
          <StatCard label="项目数量" value={stats.count} unit="个" icon={Building2} />
          <StatCard label="建设面积" value={stats.area.toLocaleString()} unit="亩" icon={BarChart3} />
          <StatCard label="投资金额" value={stats.investment.toLocaleString()} unit="万元" icon={Coins} />
          <StatCard label="平均进度" value={stats.progress} unit="%" icon={TrendingUp} />
          <StatCard label="问题数量" value={stats.issues} unit="项" icon={ShieldAlert} />
          <StatCard label="整改率" value={stats.rectificationRate} unit="%" icon={ClipboardList} />
        </section>

        <section className="mt-5 grid gap-5 xl:grid-cols-[280px_minmax(760px,1fr)_380px]">
          <aside className="space-y-5">
            <div className="rounded-[2rem] border border-white/80 bg-white/84 p-5 shadow-xl shadow-emerald-900/5 backdrop-blur-xl">
              <p className="text-sm font-black text-emerald-700">GIS 空间查询</p>
              <div className="mt-4 flex gap-2 rounded-2xl bg-slate-100 p-2">
                <input value={searchText} onChange={(event) => setSearchText(event.target.value)} onKeyDown={(event) => { if (event.key === "Enter") handleSearch(); }} placeholder="输入项目名称/编号" className="min-w-0 flex-1 bg-transparent px-2 text-sm outline-none" />
                <button onClick={handleSearch} className="grid h-10 w-10 place-items-center rounded-xl bg-[#123d2f] text-white"><Search className="h-4 w-4" /></button>
              </div>
              <div className="mt-4 space-y-2">
                {projects.slice(0, 5).map((project) => (
                  <button key={project.id} onClick={() => setSelectedProject(project)} className={`w-full rounded-2xl border px-3 py-3 text-left text-sm transition ${selectedProject?.id === project.id ? "border-emerald-500 bg-emerald-50" : "border-slate-100 bg-white hover:bg-slate-50"}`}>
                    <div className="font-black text-[#123d2f]">{project.name}</div>
                    <div className="mt-1 text-xs text-slate-500">{project.code} · {project.progress}%</div>
                  </button>
                ))}
              </div>
            </div>
            <div className="rounded-[2rem] border border-white/80 bg-white/84 p-5 shadow-xl shadow-emerald-900/5 backdrop-blur-xl">
              <div className="flex items-center justify-between"><p className="text-sm font-black text-emerald-700">行政区下钻</p>{regionId !== "anhui" && <button onClick={() => setRegionId(getSupervisionParentRegion(regionId))} className="text-xs font-black text-emerald-700">返回上级</button>}</div>
              <div className="mt-4 grid gap-2">
                {["anhui", "hefei", "suzhou", "fuyang"].map((id) => <button key={id} onClick={() => setRegionId(id)} className={`rounded-xl px-4 py-3 text-left text-sm font-bold ${regionId === id ? "bg-[#123d2f] text-white" : "bg-emerald-50 text-[#123d2f]"}`}>{getSupervisionRegionName(id)}</button>)}
              </div>
            </div>
          </aside>

          <SupervisionGisMap projects={projects} regionId={regionId} selectedProjectId={selectedProject?.id} layers={layers} onLayersChange={setLayers} onProjectSelect={setSelectedProject} onRegionDrill={setRegionId} onOpenProjectDetail={setDetailProject} />

          <aside className="space-y-5">
            <ProjectPanel project={selectedProject} onOpenDetail={setDetailProject} />
            <div className="rounded-[2rem] border border-white/80 bg-white/84 p-6 shadow-xl shadow-emerald-900/5 backdrop-blur-xl">
              <p className="text-sm font-black text-emerald-700">状态分布</p>
              <div className="mt-4 space-y-4">
                {statusRows.map((row) => (
                  <div key={row.status}>
                    <div className="mb-2 flex justify-between text-sm font-bold"><span>{row.status}</span><span>{row.count} 个</span></div>
                    <div className="h-3 overflow-hidden rounded-full bg-slate-100"><div className="h-full rounded-full" style={{ width: `${projects.length ? (row.count / projects.length) * 100 : 0}%`, backgroundColor: projectStatusColor(row.status as HighStandardProject["status"]) }} /></div>
                  </div>
                ))}
              </div>
            </div>
            <div className="rounded-[2rem] border border-white/80 bg-white/84 p-6 shadow-xl shadow-emerald-900/5 backdrop-blur-xl">
              <p className="text-sm font-black text-emerald-700">资金与问题</p>
              <div className="mt-4 grid grid-cols-2 gap-3 text-sm">
                <div className="rounded-2xl bg-amber-50 p-4"><b>已拨付资金</b><br />{stats.paid.toLocaleString()} 万元</div>
                <div className="rounded-2xl bg-red-50 p-4"><b>问题整改</b><br />{stats.rectified}/{stats.issues} 项</div>
              </div>
            </div>
          </aside>
        </section>
      </section>

      {detailProject && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/55 p-6 backdrop-blur-sm">
          <div className="max-h-[88vh] w-full max-w-4xl overflow-auto rounded-[2rem] bg-white p-7 shadow-2xl">
            <div className="flex items-start justify-between gap-5">
              <div><p className="text-sm font-black text-emerald-700">项目详情 / 流程监管</p><h2 className="mt-2 text-2xl font-black text-[#123d2f]">{detailProject.name}</h2></div>
              <button onClick={() => setDetailProject(null)} className="text-2xl text-slate-400 hover:text-slate-700">×</button>
            </div>
            <div className="mt-6 grid gap-4 md:grid-cols-4">
              {["规划设计", "施工建设", "县级初验", "市级验收"].map((step, index) => <div key={step} className={`rounded-2xl p-4 ${index * 28 <= detailProject.progress ? "bg-emerald-50 text-emerald-800" : "bg-slate-100 text-slate-500"}`}><div className="text-sm font-black">{step}</div><div className="mt-2 text-xs">{index * 28 <= detailProject.progress ? "已完成" : "推进中"}</div></div>)}
            </div>
            <div className="mt-6 overflow-hidden rounded-2xl border border-slate-100">
              <table className="w-full text-left text-sm"><thead className="bg-[#123d2f] text-white"><tr><th className="px-4 py-3">监管事项</th><th className="px-4 py-3">责任单位</th><th className="px-4 py-3">当前状态</th><th className="px-4 py-3">更新时间</th></tr></thead><tbody>{[["建设进度核查", detailProject.constructionUnit, detailProject.status, "2026-06-05"], ["资金拨付核验", "省级监管中心", `${detailProject.fundsPaid} 万元`, "2026-06-04"], ["问题整改闭环", detailProject.supervisionUnit, `${detailProject.rectifiedCount}/${detailProject.issueCount} 项`, "2026-06-03"]].map((row) => <tr key={row[0]} className="border-b border-slate-100"><td className="px-4 py-3 font-bold text-[#123d2f]">{row[0]}</td><td className="px-4 py-3">{row[1]}</td><td className="px-4 py-3">{row[2]}</td><td className="px-4 py-3">{row[3]}</td></tr>)}</tbody></table>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}
