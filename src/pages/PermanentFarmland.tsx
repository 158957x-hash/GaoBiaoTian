import { useMemo, useState, type ReactNode } from "react";
import { ArrowLeft, BarChart3, ClipboardCheck, Database, Download, FilePlus2, FileText, History, MapPinned, RefreshCcw, Search, Upload, Workflow } from "lucide-react";
import ArchiveDetail from "@/components/permanent/ArchiveDetail";
import FarmlandMap from "@/components/permanent/FarmlandMap";
import {
  buildStats,
  countyRanking,
  defaultFilters,
  filterPlots,
  getParentRegion,
  getRegionName,
  qualityGroups,
  regions,
  statusGroups,
  type Filters,
  type Plot,
} from "@/data/permanentFarmland";

type PageKey = "map" | "archive" | "add" | "adjust" | "remove" | "audit" | "stats" | "io" | "logs";

type PermanentFarmlandProps = { onBack: () => void };

const menus: Array<{ key: PageKey; label: string; icon: typeof MapPinned }> = [
  { key: "map", label: "永久基本农田质量一张图", icon: MapPinned },
  { key: "archive", label: "质量档案库", icon: Database },
  { key: "add", label: "质量信息新增", icon: FilePlus2 },
  { key: "adjust", label: "质量信息调整", icon: Workflow },
  { key: "remove", label: "调出移除管理", icon: RefreshCcw },
  { key: "audit", label: "质量档案审核", icon: ClipboardCheck },
  { key: "stats", label: "统计分析", icon: BarChart3 },
  { key: "io", label: "数据导入导出", icon: Upload },
  { key: "logs", label: "操作日志", icon: History },
];

const workflowRows = [
  { no: "YJJBNT-340121-000238", area: "86.42 亩", region: "合肥市长丰县双墩镇", level: "4 等", status: "待审核", user: "张伟", time: "2026-06-01 09:42" },
  { no: "YJJBNT-340122-000116", area: "64.28 亩", region: "合肥市肥东县店埠镇", level: "5 等", status: "资料补正", user: "李敏", time: "2026-06-01 10:18" },
  { no: "YJJBNT-341302-000093", area: "53.70 亩", region: "宿州市埇桥区夹沟镇", level: "3 等", status: "已受理", user: "王磊", time: "2026-06-02 08:55" },
];

const removeRows = [
  { no: "YJJBNT-341323-000205", reason: "建设占用", area: "12.36 亩", status: "县级初审", date: "2026-05-26" },
  { no: "YJJBNT-341202-000177", reason: "空间边界调整", area: "8.42 亩", status: "市级复核", date: "2026-05-28" },
  { no: "YJJBNT-340123-000089", reason: "地类变更", area: "5.18 亩", status: "退回修改", date: "2026-06-01" },
];

const importRows = [
  { name: "永久基本农田图斑数据", type: "空间数据", count: "36,218", status: "校验通过", time: "2026-06-01 18:20" },
  { name: "耕地质量等级成果", type: "评价数据", count: "34,920", status: "入库完成", time: "2026-06-01 19:05" },
  { name: "质量档案附件清单", type: "档案数据", count: "1,286", status: "待复核", time: "2026-06-02 09:10" },
];

const logRows = [
  { user: "省级管理员", time: "2026-06-02 09:32", type: "查询", target: "质量档案库", result: "成功" },
  { user: "长丰县经办人", time: "2026-06-02 09:15", type: "新增", target: "YJJBNT-340121-000238", result: "成功" },
  { user: "合肥市审核员", time: "2026-06-01 17:48", type: "审核", target: "质量信息调整", result: "退回修改" },
  { user: "系统任务", time: "2026-06-01 02:00", type: "同步", target: "省级耕地质量等级库", result: "成功" },
];

function SelectField({ label, value, options, onChange }: { label: string; value: string; options: string[]; onChange: (value: string) => void }) {
  return <label className="block"><span className="mb-1 block text-xs font-bold text-slate-500">{label}</span><select value={value} onChange={(event) => onChange(event.target.value)} className="w-full rounded-xl border border-emerald-900/10 bg-white px-3 py-2 text-sm outline-none focus:border-emerald-600">{options.map((item) => <option key={item}>{item}</option>)}</select></label>;
}

function MiniBar({ label, value, max, color = "#15803d" }: { label: string; value: number; max: number; color?: string }) {
  return <div><div className="mb-1 flex justify-between text-xs"><span>{label}</span><b>{value}</b></div><div className="h-2 rounded-full bg-slate-100"><div className="h-2 rounded-full" style={{ width: `${Math.max(8, (value / Math.max(max, 1)) * 100)}%`, background: color }} /></div></div>;
}

function DataTable({ headers, rows }: { headers: string[]; rows: Array<Array<ReactNode>> }) {
  return <div className="overflow-auto rounded-3xl bg-white shadow-sm"><table className="w-full min-w-[860px] text-left text-sm"><thead className="bg-[#123d2f] text-white"><tr>{headers.map((item) => <th key={item} className="px-4 py-3">{item}</th>)}</tr></thead><tbody>{rows.map((row, index) => <tr key={index} className="border-b border-slate-100 hover:bg-emerald-50/60">{row.map((cell, cellIndex) => <td key={cellIndex} className="px-4 py-3">{cell}</td>)}</tr>)}</tbody></table></div>;
}

function ActionButtons({ actions }: { actions: string[] }) {
  return <div className="flex flex-wrap gap-2">{actions.map((item) => <button key={item} className="rounded-lg bg-emerald-50 px-3 py-1 text-xs font-bold text-emerald-700 hover:bg-emerald-100">{item}</button>)}</div>;
}

export default function PermanentFarmland({ onBack }: PermanentFarmlandProps) {
  const [activePage, setActivePage] = useState<PageKey>("map");
  const [filters, setFilters] = useState<Filters>(defaultFilters);
  const [selectedPlot, setSelectedPlot] = useState<Plot | null>(null);
  const [detailPlot, setDetailPlot] = useState<Plot | null>(null);
  const [toast, setToast] = useState("");
  const [layers, setLayers] = useState({ farmland: true, highStandard: true, boundary: true });
  const filteredPlots = useMemo(() => filterPlots(filters), [filters]);
  const stats = useMemo(() => buildStats(filteredPlots), [filteredPlots]);
  const quality = useMemo(() => qualityGroups(filteredPlots), [filteredPlots]);
  const status = useMemo(() => statusGroups(filteredPlots), [filteredPlots]);
  const ranking = useMemo(() => countyRanking(filteredPlots), [filteredPlots]);
  const updateFilter = (key: keyof Filters, value: string) => setFilters((current) => ({ ...current, [key]: value }));
  const notify = (message: string) => { setToast(message); window.setTimeout(() => setToast(""), 1800); };
  const locateOnMap = (plot: Plot) => { setSelectedPlot(plot); setFilters((current) => ({ ...current, regionId: plot.regionId, keyword: "" })); setActivePage("map"); notify(`已定位到 ${plot.blockNo}`); };

  const renderFilters = () => <div className="grid grid-cols-2 gap-3 rounded-3xl border border-emerald-900/10 bg-white/80 p-4 shadow-sm lg:grid-cols-7"><label className="block"><span className="mb-1 block text-xs font-bold text-slate-500">行政区划</span><select value={filters.regionId} onChange={(event) => updateFilter("regionId", event.target.value)} className="w-full rounded-xl border border-emerald-900/10 bg-white px-3 py-2 text-sm outline-none focus:border-emerald-600">{regions.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}</select></label><SelectField label="年度" value={filters.year} options={["2024", "2025", "2026"]} onChange={(value) => updateFilter("year", value)} /><SelectField label="质量等级" value={filters.qualityLevel} options={["全部", "1等", "2等", "3等", "4等", "5等", "6等", "7等", "8等", "9等", "10等"]} onChange={(value) => updateFilter("qualityLevel", value)} /><SelectField label="耕地类型" value={filters.landType} options={["全部", "水田", "水浇地", "旱地"]} onChange={(value) => updateFilter("landType", value)} /><SelectField label="是否高标田" value={filters.highStandard} options={["全部", "已建高标田", "未建高标田"]} onChange={(value) => updateFilter("highStandard", value)} /><SelectField label="档案状态" value={filters.archiveStatus} options={["全部", "已建档", "待完善", "调整中", "已调出"]} onChange={(value) => updateFilter("archiveStatus", value)} /><div className="flex items-end gap-2"><button onClick={() => notify("已按当前条件查询")} className="flex-1 rounded-xl bg-[#123d2f] px-3 py-2 text-sm font-bold text-white">查询</button><button onClick={() => setFilters(defaultFilters)} className="flex-1 rounded-xl bg-emerald-100 px-3 py-2 text-sm font-bold text-emerald-800">重置</button></div></div>;

  const renderMapPage = () => {
    const maxQuality = Math.max(...quality.map((item) => item.value), 1);
    const maxStatus = Math.max(...status.map((item) => item.value), 1);
    return <div className="space-y-4">{renderFilters()}<div className="grid gap-4 xl:grid-cols-[260px_1fr_300px]"><aside className="grid gap-3">{[["永久基本农田面积", `${stats.area} 万亩`], ["永久基本农田图斑数", `${stats.count} 个`], ["已建立质量档案", `${stats.archived} 个`], ["平均质量等级", `${stats.average} 等`], ["已建高标田面积", `${stats.highArea} 万亩`], ["待完善档案", `${stats.pending} 个`]].map(([label, value]) => <div key={label} className="rounded-3xl bg-white/85 p-4 shadow-sm"><div className="text-xs font-bold text-slate-500">{label}</div><div className="mt-1 text-2xl font-black text-[#123d2f]">{value}</div></div>)}</aside><div><div className="mb-3 flex items-center justify-between rounded-2xl bg-white/80 px-4 py-3"><div className="font-black text-[#123d2f]">永久基本农田空间分布 · {getRegionName(filters.regionId)}</div><button onClick={() => updateFilter("regionId", getParentRegion(filters.regionId))} className="rounded-xl bg-amber-100 px-3 py-2 text-sm font-bold text-amber-800">返回上级</button></div><FarmlandMap plots={filteredPlots} regionId={filters.regionId} selectedPlotId={selectedPlot?.id} layers={layers} onLayersChange={setLayers} onPlotSelect={setSelectedPlot} onRegionDrill={(regionId) => updateFilter("regionId", regionId)} onOpenDetail={setDetailPlot} onLocateArchive={(plot) => { setFilters((current) => ({ ...current, keyword: plot.blockNo })); setActivePage("archive"); }} /><div className="mt-3 rounded-2xl bg-white/85 p-4 text-sm text-slate-600">当前选中图斑：{selectedPlot ? `${selectedPlot.blockNo}｜${selectedPlot.city}${selectedPlot.county}${selectedPlot.town}｜${selectedPlot.area} 亩｜${selectedPlot.landType}｜${selectedPlot.qualityLevel} 等｜${selectedPlot.archiveStatus}` : "未选择图斑"}</div></div><aside className="space-y-4 rounded-3xl bg-white/85 p-5 shadow-sm"><h3 className="font-black text-[#123d2f]">质量等级分布</h3>{quality.map((item) => <MiniBar key={item.label} label={item.label} value={item.value} max={maxQuality} color={item.color} />)}<h3 className="pt-2 font-black text-[#123d2f]">各区县面积排行</h3>{ranking.map((item) => <MiniBar key={item.label} label={item.label} value={item.value} max={ranking[0]?.value ?? 1} color="#0f766e" />)}<h3 className="pt-2 font-black text-[#123d2f]">档案状态分布</h3>{status.map((item) => <MiniBar key={item.label} label={item.label} value={item.value} max={maxStatus} color="#d97706" />)}<div className="rounded-2xl bg-emerald-50 p-3 text-xs text-slate-600">图例：深绿 1-3 等，浅绿 4-6 等，黄色 7-8 等，橙色 9-10 等；蓝色边框为已建高标田，灰色边框为待完善档案。</div></aside></div></div>;
  };

  const renderArchivePage = () => {
    const pageItems = filteredPlots.slice(0, 20);
    return <div className="space-y-4"><div className="grid gap-3 rounded-3xl bg-white/85 p-4 shadow-sm lg:grid-cols-[180px_1fr_150px_150px_150px_150px_160px]"><SelectField label="行政区划" value={getRegionName(filters.regionId)} options={regions.map((item) => item.name)} onChange={(name) => updateFilter("regionId", regions.find((item) => item.name === name)?.id ?? "anhui")} /><label><span className="mb-1 block text-xs font-bold text-slate-500">田块编号</span><input value={filters.keyword} onChange={(event) => updateFilter("keyword", event.target.value)} className="w-full rounded-xl border border-emerald-900/10 px-3 py-2 text-sm outline-none" placeholder="输入田块编号" /></label><SelectField label="耕地类型" value={filters.landType} options={["全部", "水田", "水浇地", "旱地"]} onChange={(value) => updateFilter("landType", value)} /><SelectField label="质量等级" value={filters.qualityLevel} options={["全部", "1等", "2等", "3等", "4等", "5等", "6等", "7等", "8等", "9等", "10等"]} onChange={(value) => updateFilter("qualityLevel", value)} /><SelectField label="是否高标田" value={filters.highStandard} options={["全部", "已建高标田", "未建高标田"]} onChange={(value) => updateFilter("highStandard", value)} /><SelectField label="档案状态" value={filters.archiveStatus} options={["全部", "已建档", "待完善", "调整中", "已调出"]} onChange={(value) => updateFilter("archiveStatus", value)} /><div className="flex items-end gap-2"><button className="rounded-xl bg-[#123d2f] px-3 py-2 text-sm font-bold text-white"><Search className="inline h-4 w-4" /> 查询</button><button onClick={() => notify("已生成档案清单")} className="rounded-xl bg-amber-100 px-3 py-2 text-sm font-bold text-amber-800"><Download className="inline h-4 w-4" /> 导出</button></div></div><div className="overflow-auto rounded-3xl bg-white/90 shadow-sm"><table className="w-full min-w-[1180px] text-left text-sm"><thead className="bg-[#123d2f] text-white"><tr>{["序号", "田块编号", "所属行政区", "面积", "耕地类型", "质量等级", "是否高标田", "关联高标田项目", "档案状态", "更新时间", "操作"].map((item) => <th key={item} className="px-4 py-3">{item}</th>)}</tr></thead><tbody>{pageItems.map((plot, index) => <tr key={plot.id} className="border-b border-slate-100 hover:bg-emerald-50/60"><td className="px-4 py-3">{index + 1}</td><td className="px-4 py-3 font-bold text-emerald-800">{plot.blockNo}</td><td className="px-4 py-3">{plot.city}{plot.county}{plot.town}</td><td className="px-4 py-3">{plot.area} 亩</td><td className="px-4 py-3">{plot.landType}</td><td className="px-4 py-3">{plot.qualityLevel} 等</td><td className="px-4 py-3">{plot.isHighStandard ? "是" : "否"}</td><td className="px-4 py-3">{plot.projectName}</td><td className="px-4 py-3">{plot.archiveStatus}</td><td className="px-4 py-3">{plot.updatedAt}</td><td className="space-x-2 px-4 py-3"><button onClick={() => setDetailPlot(plot)} className="font-bold text-emerald-700">查看</button><button onClick={() => locateOnMap(plot)} className="font-bold text-sky-700">定位</button><button onClick={() => notify("已打开质量信息调整页面")} className="font-bold text-amber-700">调整</button><button onClick={() => notify("已打开调出移除页面")} className="font-bold text-rose-700">调出</button></td></tr>)}</tbody></table><div className="flex justify-between p-4 text-sm text-slate-500"><span>共 {filteredPlots.length} 条，当前展示 20 条数据</span><span>1 / 1</span></div></div></div>;
  };

  const renderBusinessPage = () => {
    if (activePage === "stats") return <div className="grid gap-4 lg:grid-cols-3"><div className="rounded-3xl bg-white p-6 shadow-sm"><h3 className="font-black">永久基本农田面积统计</h3>{ranking.map((i) => <MiniBar key={i.label} label={i.label} value={i.value} max={ranking[0]?.value ?? 1} />)}</div><div className="rounded-3xl bg-white p-6 shadow-sm"><h3 className="font-black">质量等级分布</h3>{quality.map((i) => <MiniBar key={i.label} label={i.label} value={i.value} max={Math.max(...quality.map((q) => q.value), 1)} color={i.color} />)}</div><div className="rounded-3xl bg-white p-6 shadow-sm"><h3 className="font-black">档案状态统计</h3>{status.map((i) => <MiniBar key={i.label} label={i.label} value={i.value} max={Math.max(...status.map((s) => s.value), 1)} />)}</div></div>;
    if (activePage === "add") return <div className="space-y-4"><div className="grid gap-4 rounded-3xl bg-white p-6 shadow-sm md:grid-cols-4"><SelectField label="所属行政区" value="长丰县" options={["长丰县", "肥东县", "肥西县"]} onChange={() => undefined} /><label><span className="mb-1 block text-xs font-bold text-slate-500">田块编号</span><input className="w-full rounded-xl border border-emerald-900/10 px-3 py-2" defaultValue="YJJBNT-340121-000238" /></label><SelectField label="质量等级" value="4等" options={["1等", "2等", "3等", "4等", "5等", "6等"]} onChange={() => undefined} /><SelectField label="调查报告" value="已上传" options={["已上传", "待上传"]} onChange={() => undefined} /></div><DataTable headers={["田块编号", "所属区域", "耕地类型", "质量等级", "附件", "提交状态", "操作"]} rows={workflowRows.map((i) => [i.no, i.region, "水田", i.level, "调查报告.pdf", i.status, <ActionButtons actions={["选择图斑", "上传调查报告", "提交审核"]} />])} /></div>;
    if (activePage === "adjust") return <div className="space-y-4"><div className="grid gap-4 rounded-3xl bg-white p-6 shadow-sm md:grid-cols-4"><SelectField label="调整类型" value="质量等级调整" options={["质量等级调整", "耕地类型调整", "档案状态调整"]} onChange={() => undefined} /><SelectField label="调整前等级" value="5等" options={["3等", "4等", "5等", "6等"]} onChange={() => undefined} /><SelectField label="调整后等级" value="4等" options={["3等", "4等", "5等", "6等"]} onChange={() => undefined} /><label><span className="mb-1 block text-xs font-bold text-slate-500">调整原因</span><input className="w-full rounded-xl border border-emerald-900/10 px-3 py-2" defaultValue="质量评价成果更新" /></label></div><DataTable headers={["田块编号", "所属区域", "调整前", "调整后", "经办人", "状态", "操作"]} rows={workflowRows.map((i) => [i.no, i.region, "5 等", i.level, i.user, i.status, <ActionButtons actions={["选择档案", "上传佐证材料", "提交审核"]} />])} /></div>;
    if (activePage === "remove") return <DataTable headers={["田块编号", "调出原因", "调出面积", "审核状态", "申请日期", "操作"]} rows={removeRows.map((i) => [i.no, i.reason, i.area, i.status, i.date, <ActionButtons actions={["查看详情", "提交审核"]} />])} />;
    if (activePage === "audit") return <DataTable headers={["业务类型", "田块编号", "所属区域", "申请人", "提交时间", "审核状态", "操作"]} rows={workflowRows.map((i, index) => [index === 0 ? "新增建档" : index === 1 ? "质量调整" : "调出移除", i.no, i.region, i.user, i.time, i.status, <ActionButtons actions={["审核通过", "退回修改"]} />])} />;
    if (activePage === "io") return <div className="space-y-4"><div className="grid gap-4 md:grid-cols-4"><button className="rounded-3xl bg-[#123d2f] p-6 text-left font-black text-white">永久基本农田数据导入</button><button className="rounded-3xl bg-emerald-700 p-6 text-left font-black text-white">质量等级数据导入</button><button className="rounded-3xl bg-amber-500 p-6 text-left font-black text-white">档案清单导出</button><button className="rounded-3xl bg-slate-700 p-6 text-left font-black text-white">附件材料归档</button></div><DataTable headers={["数据名称", "数据类型", "记录数", "处理状态", "处理时间", "操作"]} rows={importRows.map((i) => [i.name, i.type, i.count, i.status, i.time, <ActionButtons actions={i.name.includes("导出") ? ["导出", "查看记录"] : ["导入", "查看记录"]} />])} /></div>;
    return <DataTable headers={["操作人", "操作时间", "操作类型", "操作对象", "操作结果", "操作"]} rows={logRows.map((i) => [i.user, i.time, i.type, i.target, i.result, <ActionButtons actions={["查看"]} />])} />;
  };

  return <main className="min-h-screen bg-[#eef4e8] text-slate-900"><div className="fixed inset-0 bg-[radial-gradient(circle_at_20%_0%,rgba(217,180,86,0.25),transparent_28%),linear-gradient(180deg,#eef7ea,#f8f2df)]" /><div className="relative flex min-h-screen"><aside className="w-72 shrink-0 bg-[#123d2f] p-5 text-white"><button onClick={onBack} className="mb-6 flex items-center gap-2 rounded-2xl bg-white/10 px-4 py-3 text-sm font-bold hover:bg-white/15"><ArrowLeft className="h-4 w-4" />返回门户首页</button><h1 className="text-2xl font-black leading-tight">永久基本农田质量管理</h1><p className="mt-2 text-sm text-emerald-50/65">一张图展示 · 质量档案库 · 业务闭环管理</p><nav className="mt-8 space-y-2">{menus.map((item) => { const Icon = item.icon; return <button key={item.key} onClick={() => setActivePage(item.key)} className={`flex w-full items-center gap-3 rounded-2xl px-4 py-3 text-left text-sm font-bold transition ${activePage === item.key ? "bg-amber-200 text-emerald-950" : "text-emerald-50/80 hover:bg-white/10"}`}><Icon className="h-5 w-5" />{item.label}</button>; })}</nav></aside><section className="flex-1 overflow-auto p-6"><header className="mb-5 flex items-center justify-between rounded-3xl bg-white/80 p-5 shadow-sm backdrop-blur"><div><p className="text-sm font-bold text-emerald-700">{getRegionName(filters.regionId)} · {filters.year} 年</p><h2 className="text-3xl font-black text-[#123d2f]">{menus.find((item) => item.key === activePage)?.label}</h2></div><div className="flex items-center gap-3 rounded-2xl bg-emerald-50 px-4 py-3 text-sm font-bold text-emerald-800"><FileText className="h-5 w-5" />档案数据 {filteredPlots.length} 条</div></header>{activePage === "map" ? renderMapPage() : activePage === "archive" ? renderArchivePage() : renderBusinessPage()}</section></div>{detailPlot && <ArchiveDetail plot={detailPlot} onClose={() => setDetailPlot(null)} />}{toast && <div className="fixed bottom-8 left-1/2 z-50 -translate-x-1/2 rounded-full bg-[#123d2f] px-6 py-3 text-sm font-bold text-white shadow-2xl">{toast}</div>}</main>;
}
