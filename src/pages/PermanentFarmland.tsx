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
  return <label className="block"><span className="mb-1 block text-xs font-semibold text-cyan-100/60">{label}</span><select value={value} onChange={(event) => onChange(event.target.value)} className="w-full rounded-lg border border-[#27D7E8]/20 bg-[#0A2530] px-3 py-2 text-sm text-cyan-50 outline-none focus:border-[#27D7E8]">{options.map((item) => <option key={item}>{item}</option>)}</select></label>;
}

function MiniBar({ label, value, max, color = "#67D66E" }: { label: string; value: number; max: number; color?: string }) {
  return <div><div className="mb-1 flex justify-between text-xs text-cyan-100/60"><span>{label}</span><b className="text-cyan-50">{value}</b></div><div className="h-2 rounded-full bg-white/[0.08]"><div className="h-2 rounded-full" style={{ width: `${Math.max(8, (value / Math.max(max, 1)) * 100)}%`, background: color }} /></div></div>;
}

function DataTable({ headers, rows }: { headers: string[]; rows: Array<Array<ReactNode>> }) {
  return <div className="overflow-auto rounded-[10px] border border-[#27D7E8]/20 bg-[#0A2530]"><table className="w-full min-w-[860px] text-left text-sm"><thead className="bg-white/[0.06] text-cyan-100"><tr>{headers.map((item) => <th key={item} className="px-4 py-3 font-semibold">{item}</th>)}</tr></thead><tbody>{rows.map((row, index) => <tr key={index} className="border-b border-white/[0.08] hover:bg-white/[0.04]">{row.map((cell, cellIndex) => <td key={cellIndex} className="px-4 py-3 text-cyan-100/70">{cell}</td>)}</tr>)}</tbody></table></div>;
}

function ActionButtons({ actions }: { actions: string[] }) {
  return <div className="flex flex-wrap gap-2">{actions.map((item) => <button key={item} className="rounded-lg bg-[#27D7E8]/20 px-3 py-1 text-xs font-semibold text-[#27D7E8] hover:bg-[#27D7E8]/30">{item}</button>)}</div>;
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

  const renderFilters = () => <div className="grid grid-cols-2 gap-3 rounded-[10px] border border-[#27D7E8]/20 bg-[#0A2530] p-4 shadow-lg lg:grid-cols-7"><label className="block"><span className="mb-1 block text-xs font-semibold text-cyan-100/60">行政区划</span><select value={filters.regionId} onChange={(event) => updateFilter("regionId", event.target.value)} className="w-full rounded-lg border border-[#27D7E8]/20 bg-[#0A2530] px-3 py-2 text-sm text-cyan-50 outline-none focus:border-[#27D7E8]">{regions.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}</select></label><SelectField label="年度" value={filters.year} options={["2024", "2025", "2026"]} onChange={(value) => updateFilter("year", value)} /><SelectField label="质量等级" value={filters.qualityLevel} options={["全部", "1等", "2等", "3等", "4等", "5等", "6等", "7等", "8等", "9等", "10等"]} onChange={(value) => updateFilter("qualityLevel", value)} /><SelectField label="耕地类型" value={filters.landType} options={["全部", "水田", "水浇地", "旱地"]} onChange={(value) => updateFilter("landType", value)} /><SelectField label="是否高标田" value={filters.highStandard} options={["全部", "已建高标田", "未建高标田"]} onChange={(value) => updateFilter("highStandard", value)} /><SelectField label="档案状态" value={filters.archiveStatus} options={["全部", "已建档", "待完善", "调整中", "已调出"]} onChange={(value) => updateFilter("archiveStatus", value)} /><div className="flex items-end gap-2"><button onClick={() => notify("已按当前条件查询")} className="flex-1 rounded-lg bg-[#27D7E8] px-3 py-2 text-sm font-semibold text-[#061A24]">查询</button><button onClick={() => setFilters(defaultFilters)} className="flex-1 rounded-lg bg-white/[0.04] px-3 py-2 text-sm font-semibold text-cyan-100/70">重置</button></div></div>;

  const renderMapPage = () => {
    const maxQuality = Math.max(...quality.map((item) => item.value), 1);
    const maxStatus = Math.max(...status.map((item) => item.value), 1);
    return <div className="space-y-4">{renderFilters()}<div className="grid gap-4 xl:grid-cols-[260px_1fr_300px]"><aside className="grid gap-3">{[["永久基本农田面积", `${stats.area} 万亩`], ["永久基本农田图斑数", `${stats.count} 个`], ["已建立质量档案", `${stats.archived} 个`], ["平均质量等级", `${stats.average} 等`], ["已建高标田面积", `${stats.highArea} 万亩`], ["待完善档案", `${stats.pending} 个`]].map(([label, value]) => <div key={label} className="rounded-[10px] border border-[#27D7E8]/20 bg-[#0A2530] p-4 shadow-lg"><div className="text-xs font-semibold text-cyan-100/60">{label}</div><div className="mt-1 text-2xl font-bold text-[#27D7E8]">{value}</div></div>)}</aside><div><div className="mb-3 flex items-center justify-between rounded-[10px] border border-[#27D7E8]/20 bg-[#0A2530] px-4 py-3 shadow-lg"><div className="font-semibold text-cyan-50">永久基本农田空间分布 · {getRegionName(filters.regionId)}</div><button onClick={() => updateFilter("regionId", getParentRegion(filters.regionId))} className="rounded-lg bg-[#F7C948]/20 px-3 py-2 text-sm font-semibold text-[#F7C948]">返回上级</button></div><FarmlandMap plots={filteredPlots} regionId={filters.regionId} selectedPlotId={selectedPlot?.id} layers={layers} onLayersChange={setLayers} onPlotSelect={setSelectedPlot} onRegionDrill={(regionId) => updateFilter("regionId", regionId)} onOpenDetail={setDetailPlot} onLocateArchive={(plot) => { setFilters((current) => ({ ...current, keyword: plot.blockNo })); setActivePage("archive"); }} /><div className="mt-3 rounded-[10px] border border-[#27D7E8]/20 bg-[#0A2530] p-4 text-sm text-cyan-100/60">当前选中图斑：{selectedPlot ? `${selectedPlot.blockNo}｜${selectedPlot.city}${selectedPlot.county}${selectedPlot.town}｜${selectedPlot.area} 亩｜${selectedPlot.landType}｜${selectedPlot.qualityLevel} 等｜${selectedPlot.archiveStatus}` : "未选择图斑"}</div></div><aside className="space-y-4 rounded-[10px] border border-[#27D7E8]/20 bg-[#0A2530] p-4 shadow-lg"><h3 className="font-semibold text-cyan-50">质量等级分布</h3>{quality.map((item) => <MiniBar key={item.label} label={item.label} value={item.value} max={maxQuality} color={item.color} />)}<h3 className="pt-2 font-semibold text-cyan-50">各区县面积排行</h3>{ranking.map((item) => <MiniBar key={item.label} label={item.label} value={item.value} max={ranking[0]?.value ?? 1} />)}<h3 className="pt-2 font-semibold text-cyan-50">档案状态统计</h3>{status.map((item) => <MiniBar key={item.label} label={item.label} value={item.value} max={maxStatus} />)}</aside></div></div>;
  };

  const renderArchivePage = () => {
    const pageItems = filteredPlots.slice(0, 20);
    return <div className="space-y-4"><div className="grid gap-3 rounded-[10px] border border-[#27D7E8]/20 bg-[#0A2530] p-4 shadow-lg lg:grid-cols-[180px_1fr_150px_150px_150px_150px_160px]"><SelectField label="行政区划" value={getRegionName(filters.regionId)} options={regions.map((item) => item.name)} onChange={(name) => updateFilter("regionId", regions.find((item) => item.name === name)?.id ?? "anhui")} /><label><span className="mb-1 block text-xs font-semibold text-cyan-100/60">田块编号</span><input value={filters.keyword} onChange={(event) => updateFilter("keyword", event.target.value)} className="w-full rounded-lg border border-[#27D7E8]/20 bg-[#0A2530] px-3 py-2 text-sm text-cyan-50 outline-none placeholder:text-cyan-100/40" placeholder="输入田块编号" /></label><SelectField label="耕地类型" value={filters.landType} options={["全部", "水田", "水浇地", "旱地"]} onChange={(value) => updateFilter("landType", value)} /><SelectField label="质量等级" value={filters.qualityLevel} options={["全部", "1等", "2等", "3等", "4等", "5等", "6等", "7等", "8等", "9等", "10等"]} onChange={(value) => updateFilter("qualityLevel", value)} /><SelectField label="是否高标田" value={filters.highStandard} options={["全部", "已建高标田", "未建高标田"]} onChange={(value) => updateFilter("highStandard", value)} /><SelectField label="档案状态" value={filters.archiveStatus} options={["全部", "已建档", "待完善", "调整中", "已调出"]} onChange={(value) => updateFilter("archiveStatus", value)} /><div className="flex items-end gap-2"><button className="rounded-lg bg-[#27D7E8] px-3 py-2 text-sm font-semibold text-[#061A24]"><Search className="inline h-4 w-4" /> 查询</button><button onClick={() => notify("已生成档案清单")} className="rounded-lg bg-[#F7C948]/20 px-3 py-2 text-sm font-semibold text-[#F7C948]"><Download className="inline h-4 w-4" /> 导出</button></div></div><div className="overflow-auto rounded-[10px] border border-[#27D7E8]/20 bg-[#0A2530]"><table className="w-full min-w-[1180px] text-left text-sm"><thead className="bg-white/[0.06] text-cyan-100"><tr>{["序号", "田块编号", "所属行政区", "面积", "耕地类型", "质量等级", "是否高标田", "关联高标田项目", "档案状态", "更新时间", "操作"].map((item) => <th key={item} className="px-4 py-3 font-semibold">{item}</th>)}</tr></thead><tbody>{pageItems.map((plot, index) => <tr key={plot.id} className="border-b border-white/[0.08] hover:bg-white/[0.04]"><td className="px-4 py-3 text-cyan-100/70">{index + 1}</td><td className="px-4 py-3 text-cyan-100/70">{plot.blockNo}</td><td className="px-4 py-3 text-cyan-100/70">{plot.city}{plot.county}{plot.town}</td><td className="px-4 py-3 text-cyan-100/70">{plot.area} 亩</td><td className="px-4 py-3 text-cyan-100/70">{plot.landType}</td><td className="px-4 py-3 text-cyan-100/70">{plot.qualityLevel} 等</td><td className="px-4 py-3 text-cyan-100/70">{plot.isHighStandard ? "是" : "否"}</td><td className="px-4 py-3 text-cyan-100/70">{plot.projectName ?? "--"}</td><td className="px-4 py-3 text-cyan-100/70">{plot.archiveStatus}</td><td className="px-4 py-3 text-cyan-100/70">{plot.updatedAt}</td><td className="px-4 py-3"><div className="flex gap-2"><button onClick={() => setDetailPlot(plot)} className="rounded-lg bg-[#27D7E8]/20 px-3 py-1 text-xs font-semibold text-[#27D7E8]">详情</button><button onClick={() => locateOnMap(plot)} className="rounded-lg bg-[#67D66E]/20 px-3 py-1 text-xs font-semibold text-[#67D66E]">定位</button></div></td></tr>)}</tbody></table></div></div>;
  };

  const renderBusinessPage = () => {
    if (activePage === "stats") return <div className="grid gap-4 lg:grid-cols-3"><div className="rounded-[10px] border border-[#27D7E8]/20 bg-[#0A2530] p-5 shadow-lg"><h3 className="font-semibold text-cyan-50">永久基本农田面积统计</h3>{ranking.map((i) => <MiniBar key={i.label} label={i.label} value={i.value} max={ranking[0]?.value ?? 1} />)}</div><div className="rounded-[10px] border border-[#27D7E8]/20 bg-[#0A2530] p-5 shadow-lg"><h3 className="font-semibold text-cyan-50">质量等级分布</h3>{quality.map((i) => <MiniBar key={i.label} label={i.label} value={i.value} max={Math.max(...quality.map((q) => q.value), 1)} color={i.color} />)}</div><div className="rounded-[10px] border border-[#27D7E8]/20 bg-[#0A2530] p-5 shadow-lg"><h3 className="font-semibold text-cyan-50">档案状态统计</h3>{status.map((i) => <MiniBar key={i.label} label={i.label} value={i.value} max={Math.max(...status.map((s) => s.value), 1)} />)}</div></div>;
    if (activePage === "add") return <div className="space-y-4"><div className="grid gap-4 rounded-[10px] border border-[#27D7E8]/20 bg-[#0A2530] p-5 shadow-lg md:grid-cols-4"><SelectField label="所属行政区" value="长丰县" options={["长丰县", "肥东县", "肥西县"]} onChange={() => undefined} /><label><span className="mb-1 block text-xs font-semibold text-cyan-100/60">田块编号</span><input className="w-full rounded-lg border border-[#27D7E8]/20 bg-[#0A2530] px-3 py-2 text-cyan-50" defaultValue="YJJBNT-340121-000238" /></label><SelectField label="质量等级" value="4等" options={["1等", "2等", "3等", "4等", "5等", "6等"]} onChange={() => undefined} /><SelectField label="调查报告" value="已上传" options={["已上传", "待上传"]} onChange={() => undefined} /></div><DataTable headers={["田块编号", "所属区域", "耕地类型", "质量等级", "附件", "提交状态", "操作"]} rows={workflowRows.map((i) => [i.no, i.region, "水田", i.level, "调查报告.pdf", i.status, <ActionButtons actions={["选择图斑", "上传调查报告", "提交审核"]} />])} /></div>;
    if (activePage === "adjust") return <div className="space-y-4"><div className="grid gap-4 rounded-[10px] border border-[#27D7E8]/20 bg-[#0A2530] p-5 shadow-lg md:grid-cols-4"><SelectField label="调整类型" value="质量等级调整" options={["质量等级调整", "耕地类型调整", "档案状态调整"]} onChange={() => undefined} /><SelectField label="调整前等级" value="5等" options={["3等", "4等", "5等", "6等"]} onChange={() => undefined} /><SelectField label="调整后等级" value="4等" options={["3等", "4等", "5等", "6等"]} onChange={() => undefined} /><label><span className="mb-1 block text-xs font-semibold text-cyan-100/60">调整原因</span><input className="w-full rounded-lg border border-[#27D7E8]/20 bg-[#0A2530] px-3 py-2 text-cyan-50" defaultValue="质量评价成果更新" /></label></div><DataTable headers={["田块编号", "所属区域", "调整前", "调整后", "经办人", "状态", "操作"]} rows={workflowRows.map((i) => [i.no, i.region, "5 等", i.level, i.user, i.status, <ActionButtons actions={["选择档案", "上传佐证材料", "提交审核"]} />])} /></div>;
    if (activePage === "remove") return <DataTable headers={["田块编号", "调出原因", "调出面积", "审核状态", "申请日期", "操作"]} rows={removeRows.map((i) => [i.no, i.reason, i.area, i.status, i.date, <ActionButtons actions={["查看详情", "提交审核"]} />])} />;
    if (activePage === "audit") return <DataTable headers={["业务类型", "田块编号", "所属区域", "申请人", "提交时间", "审核状态", "操作"]} rows={workflowRows.map((i, index) => [index === 0 ? "新增建档" : index === 1 ? "质量调整" : "调出移除", i.no, i.region, i.user, i.time, i.status, <ActionButtons actions={["审核通过", "退回修改"]} />])} />;
    if (activePage === "io") return <div className="space-y-4"><div className="grid gap-4 md:grid-cols-4"><button className="rounded-[10px] border border-[#27D7E8]/20 bg-[#27D7E8]/20 p-5 text-left font-semibold text-[#27D7E8]">永久基本农田数据导入</button><button className="rounded-[10px] border border-[#67D66E]/20 bg-[#67D66E]/20 p-5 text-left font-semibold text-[#67D66E]">质量等级数据导入</button><button className="rounded-[10px] border border-[#F7C948]/20 bg-[#F7C948]/20 p-5 text-left font-semibold text-[#F7C948]">档案清单导出</button><button className="rounded-[10px] border border-white/[0.08] bg-white/[0.04] p-5 text-left font-semibold text-cyan-100/70">附件材料归档</button></div><DataTable headers={["数据名称", "数据类型", "记录数", "处理状态", "处理时间", "操作"]} rows={importRows.map((i) => [i.name, i.type, i.count, i.status, i.time, <ActionButtons actions={i.name.includes("导出") ? ["导出", "查看记录"] : ["导入", "查看记录"]} />])} /></div>;
    return <DataTable headers={["操作人", "操作时间", "操作类型", "操作对象", "操作结果", "操作"]} rows={logRows.map((i) => [i.user, i.time, i.type, i.target, i.result, <ActionButtons actions={["查看"]} />])} />;
  };

  return <main className="min-h-screen overflow-hidden bg-[#061A24] text-cyan-50"><div className="fixed inset-0 bg-[radial-gradient(circle_at_15%_10%,rgba(39,215,232,0.08),transparent_26%),radial-gradient(circle_at_82%_8%,rgba(103,214,110,0.06),transparent_28%),linear-gradient(135deg,#061A24_0%,#0A2530_48%,#061A24_100%)]" /><div className="fixed inset-0 opacity-[0.12] [background-image:linear-gradient(rgba(39,215,232,0.15)_1px,transparent_1px),linear-gradient(90deg,rgba(39,215,232,0.12)_1px,transparent_1px)] [background-size:44px_44px]" /><div className="relative flex min-h-screen"><aside className="w-72 shrink-0 border-r border-[#27D7E8]/20 bg-[#0A2530] p-5"><button onClick={onBack} className="mb-6 flex items-center gap-2 rounded-lg bg-[#27D7E8]/20 px-4 py-3 text-sm font-semibold text-[#27D7E8] hover:bg-[#27D7E8]/30"><ArrowLeft className="h-4 w-4" />返回门户首页</button><h1 className="text-xl font-bold leading-tight text-cyan-50">永久基本农田质量管理</h1><p className="mt-2 text-sm text-cyan-100/50">一张图展示 · 质量档案库 · 业务闭环管理</p><nav className="mt-8 space-y-2">{menus.map((item) => { const Icon = item.icon; return <button key={item.key} onClick={() => setActivePage(item.key)} className={`flex w-full items-center gap-3 rounded-lg px-4 py-3 text-left text-sm font-semibold transition ${activePage === item.key ? "bg-[#27D7E8]/20 text-[#27D7E8]" : "text-cyan-100/70 hover:bg-white/[0.04]"}`}><Icon className="h-5 w-5" />{item.label}</button>; })}</nav></aside><section className="flex-1 overflow-auto p-5"><header className="mb-5 flex items-center justify-between rounded-[10px] border border-[#27D7E8]/20 bg-[#0A2530] p-5 shadow-lg"><div><p className="text-sm font-semibold text-[#27D7E8]">{getRegionName(filters.regionId)} · {filters.year} 年</p><h2 className="text-[32px] font-bold text-cyan-50">{menus.find((item) => item.key === activePage)?.label}</h2></div><div className="flex items-center gap-3 rounded-lg bg-white/[0.04] px-4 py-3 text-sm font-semibold text-cyan-100/70"><FileText className="h-5 w-5" />档案数据 {filteredPlots.length} 条</div></header>{activePage === "map" ? renderMapPage() : activePage === "archive" ? renderArchivePage() : renderBusinessPage()}</section></div>{detailPlot && <ArchiveDetail plot={detailPlot} onClose={() => setDetailPlot(null)} />}{toast && <div className="fixed bottom-8 left-1/2 z-50 -translate-x-1/2 rounded-full bg-[#27D7E8] px-6 py-3 text-sm font-semibold text-[#061A24] shadow-2xl">{toast}</div>}</main>;
}
