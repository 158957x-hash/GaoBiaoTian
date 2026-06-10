import { useEffect, useMemo, useState } from "react";
import { ArrowLeft, BarChart3, BatteryFull, Bug, Building2, CalendarDays, Camera, CheckCircle2, ChevronLeft, ChevronRight, ClipboardList, Clock, Coins, Droplets, FileText, LocateFixed, Maximize2, Pause, Play, RefreshCw, Search, ShieldAlert, Signal, Square, Sun, Thermometer, TrendingUp, Upload, Volume2, Wind, Zap } from "lucide-react";
import ReactECharts from "echarts-for-react";
import SupervisionGisMap from "@/components/supervision/SupervisionGisMap";
import {
  buildSupervisionStats,
  defaultSupervisionLayers,
  filterSupervisionProjects,
  getSupervisionRegionName,
  projectStatusColor,
  type DevicePoint,
  type HighStandardProject,
} from "@/data/supervisionMap";

type SupervisionMapProps = {
  onBack: () => void;
  initialView?: "screen";
};

type SupervisionParcelSearchResult = {
  project: HighStandardProject;
  index: number;
  code: string;
};

function highStandardParcelCode(project: HighStandardProject, index: number) {
  return `${project.code}-DK-${String(index + 1).padStart(3, "0")}`;
}

function matchHighStandardParcels(projects: HighStandardProject[], keyword: string) {
  const normalized = keyword.trim();
  if (!normalized) return [];
  return projects.flatMap((project) => project.parcelPaths.map((_, index) => ({ project, index, code: highStandardParcelCode(project, index) }))).filter((item) => item.code.includes(normalized) || item.project.name.includes(normalized) || item.project.code.includes(normalized) || item.project.town.includes(normalized));
}

function StatCard({ label, value, unit, icon: Icon }: { label: string; value: string | number; unit: string; icon: typeof BarChart3 }) {
  const isHighlight = label === "建设面积" || label === "投资金额";
  const isProgress = label === "平均进度" || label === "整改率";
  const isIssue = label === "问题数量";
  const valueColor = isHighlight ? "text-[#DDFB9A]" : isProgress ? "text-[#27D7E8]" : isIssue ? "text-[#FF9F3F]" : "text-[#EAFBFF]";
  return (
    <div className="min-h-[110px] rounded-[10px] border border-[rgba(39,215,232,0.25)] bg-[rgba(12,45,55,0.72)] p-3">
      <div className="flex items-center justify-between">
        <p className="text-[13px] font-semibold text-cyan-100/60">{label}</p>
        <div className="grid h-8 w-8 place-items-center rounded-lg bg-[rgba(39,215,232,0.12)] text-[#27D7E8]/80"><Icon className="h-4 w-4" /></div>
      </div>
      <div className="mt-2 flex items-end gap-1"><span className={`text-[26px] font-bold ${valueColor}`}>{value}</span><span className="pb-0.5 text-xs font-semibold text-[rgba(234,251,255,0.65)]">{unit}</span></div>
    </div>
  );
}

function RegionProjectSummaryPanel({ regionName, stats, statusRows }: { regionName: string; stats: ReturnType<typeof buildSupervisionStats>; statusRows: Array<{ status: string; count: number }> }) {
  return (
    <div className="rounded-[10px] border border-[rgba(39,215,232,0.18)] bg-[rgba(7,35,43,0.78)] p-4">
      <div className="flex items-center gap-2">
        <div className="h-4 w-1 rounded-full bg-[#27D7E8]" />
        <p className="text-[15px] font-semibold text-[#DDF8FF]">区域高标田统计</p>
      </div>
      <h3 className="mt-3 text-xl font-bold text-cyan-50">{regionName}</h3>
      <div className="mt-4 grid grid-cols-2 gap-3 text-sm">
        <div className="rounded-lg border border-[rgba(255,255,255,0.08)] bg-[rgba(255,255,255,0.05)] p-3"><span className="text-cyan-100/60">项目数量</span><br /><span className="text-lg font-semibold text-cyan-50">{stats.count} 个</span></div>
        <div className="rounded-lg border border-[rgba(255,255,255,0.08)] bg-[rgba(255,255,255,0.05)] p-3"><span className="text-cyan-100/60">建设面积</span><br /><span className="text-lg font-semibold text-[#DDFB9A]">{stats.area.toLocaleString()} 亩</span></div>
        <div className="rounded-lg border border-[rgba(255,255,255,0.08)] bg-[rgba(255,255,255,0.05)] p-3"><span className="text-cyan-100/60">总投资</span><br /><span className="text-lg font-semibold text-[#DDFB9A]">{stats.investment.toLocaleString()} 万元</span></div>
        <div className="rounded-lg border border-[rgba(255,255,255,0.08)] bg-[rgba(255,255,255,0.05)] p-3"><span className="text-cyan-100/60">平均进度</span><br /><span className="text-lg font-semibold text-[#27D7E8]">{stats.progress}%</span></div>
        <div className="rounded-lg border border-[rgba(255,255,255,0.08)] bg-[rgba(255,255,255,0.05)] p-3"><span className="text-cyan-100/60">已拨付</span><br /><span className="text-lg font-semibold text-[#DDFB9A]">{stats.paid.toLocaleString()} 万元</span></div>
        <div className="rounded-lg border border-[rgba(255,255,255,0.08)] bg-[rgba(255,255,255,0.05)] p-3"><span className="text-cyan-100/60">整改率</span><br /><span className="text-lg font-semibold text-[#27D7E8]">{stats.rectificationRate}%</span></div>
      </div>
      <div className="mt-4 space-y-3">
        {statusRows.map((row) => (
          <div key={row.status}>
            <div className="mb-1 flex justify-between text-xs font-semibold text-cyan-100/60"><span>{row.status}</span><span>{row.count} 个</span></div>
            <div className="h-2 overflow-hidden rounded-full bg-[rgba(255,255,255,0.08)]"><div className="h-full rounded-full" style={{ width: `${stats.count ? (row.count / stats.count) * 100 : 0}%`, backgroundColor: projectStatusColor(row.status as HighStandardProject["status"]) }} /></div>
          </div>
        ))}
      </div>
      <p className="mt-4 rounded-lg border border-[rgba(255,255,255,0.08)] bg-[rgba(255,255,255,0.05)] p-3 text-xs leading-5 text-cyan-100/50">下钻至肥西县后可在地图中选择具体项目区，选中后此处切换为项目属性明细。</p>
    </div>
  );
}

function ProjectPanel({ project, onOpenDetail }: { project: HighStandardProject | null; onOpenDetail: (project: HighStandardProject) => void }) {
  if (!project) {
    return (
      <div className="rounded-[10px] border border-[rgba(39,215,232,0.18)] bg-[rgba(7,35,43,0.78)] p-4">
        <div className="flex items-center gap-2">
          <div className="h-4 w-1 rounded-full bg-[#27D7E8]" />
          <p className="text-[15px] font-semibold text-[#DDF8FF]">项目属性</p>
        </div>
        <h3 className="mt-3 text-xl font-bold text-cyan-50">请选择地图项目区</h3>
        <p className="mt-3 text-sm leading-6 text-cyan-100/50">点击中间 GIS 地图中的项目边界，可查看建设面积、投资金额、建设状态、施工单位、监理单位和当前进度。</p>
      </div>
    );
  }

  return (
    <div className="rounded-[10px] border border-[rgba(39,215,232,0.18)] bg-[rgba(7,35,43,0.78)] p-4">
      <div className="flex items-start justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <div className="h-4 w-1 rounded-full bg-[#27D7E8]" />
            <p className="text-[15px] font-semibold text-[#DDF8FF]">项目属性</p>
          </div>
          <h3 className="mt-3 text-lg font-bold leading-snug text-cyan-50">{project.name}</h3>
        </div>
        <span className="shrink-0 rounded-full px-3 py-1 text-xs font-semibold text-white" style={{ backgroundColor: projectStatusColor(project.status) }}>{project.status}</span>
      </div>
      <div className="mt-4 grid grid-cols-2 gap-3 text-sm">
        <div className="rounded-lg border border-[rgba(255,255,255,0.08)] bg-[rgba(255,255,255,0.05)] p-3"><span className="text-cyan-100/60">项目编号</span><br /><span className="text-cyan-50">{project.code}</span></div>
        <div className="rounded-lg border border-[rgba(255,255,255,0.08)] bg-[rgba(255,255,255,0.05)] p-3"><span className="text-cyan-100/60">建设年度</span><br /><span className="text-cyan-50">{project.year} 年</span></div>
        <div className="rounded-lg border border-[rgba(255,255,255,0.08)] bg-[rgba(255,255,255,0.05)] p-3"><span className="text-cyan-100/60">建设面积</span><br /><span className="text-[#DDFB9A]">{project.area.toLocaleString()} 亩</span></div>
        <div className="rounded-lg border border-[rgba(255,255,255,0.08)] bg-[rgba(255,255,255,0.05)] p-3"><span className="text-cyan-100/60">投资金额</span><br /><span className="text-[#DDFB9A]">{project.investment.toLocaleString()} 万元</span></div>
      </div>
      <div className="mt-3 rounded-lg border border-[rgba(255,255,255,0.08)] bg-[rgba(255,255,255,0.05)] p-3 text-sm leading-6 text-cyan-100/60">
        所属区域：{project.city}{project.county}{project.town}<br />施工单位：{project.constructionUnit}<br />监理单位：{project.supervisionUnit}
      </div>
      <div className="mt-4">
        <div className="mb-2 flex justify-between text-sm font-semibold text-cyan-100/70"><span>当前进度</span><span className="text-[#27D7E8]">{project.progress}%</span></div>
        <div className="h-2.5 overflow-hidden rounded-full bg-[rgba(255,255,255,0.08)]"><div className="h-full rounded-full bg-gradient-to-r from-[#27D7E8] to-[#67D66E]" style={{ width: `${project.progress}%` }} /></div>
      </div>
      <button onClick={() => onOpenDetail(project)} className="mt-4 w-full rounded-lg bg-[#27D7E8] px-4 py-2.5 text-sm font-semibold text-[#061A24]">进入项目详情</button>
    </div>
  );
}

const detailTabs = ["项目基本信息", "项目投资信息", "项目建设内容", "项目建设审核", "项目验收投资", "项目验收信息", "工程建设矢量数据"] as const;

type DetailTab = (typeof detailTabs)[number];

function DisabledField({ label, value, required, wide, multiline, calendar, select }: { label: string; value?: string | number; required?: boolean; wide?: boolean; multiline?: boolean; calendar?: boolean; select?: boolean }) {
  return (
    <label className={`grid items-start gap-3 text-[15px] font-semibold ${wide ? "md:col-span-2" : "md:grid-cols-[170px_1fr]"}`}>
      <span className={`pt-3 text-[rgba(234,251,255,0.7)] ${wide ? "" : "text-right"}`}>{required && <b className="mr-1 text-red-400">*</b>}{label}：</span>
      <div className={`relative rounded-md border border-[rgba(255,255,255,0.1)] bg-[rgba(255,255,255,0.05)] px-4 text-[rgba(234,251,255,0.85)] ${multiline ? "min-h-28 py-3" : "h-14 leading-[3.4rem]"}`}>
        {calendar && <CalendarDays className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-[rgba(234,251,255,0.4)]" />}
        <span className={calendar ? "pl-7" : ""}>{value ?? ""}</span>
        {select && <span className="absolute right-4 top-1/2 -translate-y-1/2 text-[rgba(234,251,255,0.4)]">⌄</span>}
      </div>
    </label>
  );
}

function UploadField({ label, required, files }: { label: string; required?: boolean; files?: string[] }) {
  return (
    <div className="grid gap-3 text-[15px] font-semibold md:grid-cols-[170px_1fr]">
      <span className="pt-3 text-right text-[rgba(234,251,255,0.7)]">{required && <b className="mr-1 text-red-400">*</b>}{label}：</span>
      <div>
        <button className="inline-flex h-12 items-center gap-2 rounded-md bg-[rgba(39,215,232,0.2)] px-8 text-sm font-semibold text-[#27D7E8]"><Upload className="h-4 w-4" />上传文件</button>
        <p className="mt-6 text-sm text-[rgba(234,251,255,0.5)]">支持扩展名： doc .docx .pdf .jpg ...</p>
        {files && (
          <div className="mt-7 space-y-4 text-sm text-[rgba(234,251,255,0.85)]">
            {files.map((file) => (
              <div key={file} className="flex items-center justify-between gap-4">
                <span className="flex min-w-0 items-center gap-3"><FileText className="h-5 w-5 shrink-0 text-[rgba(234,251,255,0.5)]" /><span className="truncate">{file}</span></span>
                <CheckCircle2 className="h-5 w-5 shrink-0 text-[#67D66E]" />
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function DetailForm({ project, activeTab }: { project: HighStandardProject; activeTab: DetailTab }) {
  const place = `${project.city}${project.county}${project.town}、${project.town === "双墩镇" ? "曼根村" : "示范村"}`;
  if (activeTab === "项目基本信息") {
    return (
      <div className="grid gap-x-16 gap-y-8 md:grid-cols-2">
        <DisabledField required label="项目编号" value="Z532010042017086" select />
        <DisabledField label="项目名称" value={project.name} />
        <DisabledField required label="项目赋码层级" value="省级" select />
        <DisabledField label="项目类型" value="高标准农田建设" select />
        <DisabledField required label="项目建设性质" value="改造提升" select />
        <DisabledField label="所属年度" value={`${project.year}年`} />
        <DisabledField required label="开工日期" value="2013-01-01" calendar />
        <DisabledField required label="竣工日期" value={project.progress >= 100 ? "2026-05-30" : "选择竣工日期"} calendar />
        <DisabledField required label="申报单位" value={`${project.county}农业农村局`} />
        <DisabledField required label="承担单位" value={project.constructionUnit} />
        <DisabledField required label="建设地点" value={place} />
        <UploadField required label="规划图等文件" />
        <DisabledField label="项目拟建成时间" value="请选择" calendar />
        <DisabledField wide multiline label="主要建设内容" value="土地平整、灌溉与排水、田间道路、农田防护及配套信息化监测设施建设。" />
      </div>
    );
  }
  if (activeTab === "项目投资信息") {
    return (
      <div className="grid gap-x-16 gap-y-8 md:grid-cols-2">
        <DisabledField required label="实施总投资额(万元)" value={project.investment.toFixed(2)} />
        <DisabledField required label="实施财政资金(万元)" value={(project.investment * 0.86).toFixed(0)} />
        <DisabledField required label="实施社会资金(万元)" value={(project.investment * 0.14).toFixed(0)} />
      </div>
    );
  }
  if (activeTab === "项目建设内容") {
    return (
      <div className="grid gap-x-16 gap-y-8 md:grid-cols-2">
        <DisabledField required label="实施建设规模(亩)" value={project.area.toFixed(2)} />
        <DisabledField required label="高标准农田建设面积(亩)" value={project.area.toFixed(2)} />
      </div>
    );
  }
  if (activeTab === "项目建设审核") {
    return (
      <div className="grid gap-x-16 gap-y-8 md:grid-cols-2">
        <DisabledField required label="评审日期" value="选择评审日期" calendar />
        <DisabledField required label="项目审核结果" value={project.status === "整改中" ? "需要提质改造" : "审核通过"} select />
        <UploadField required label="审核文件" />
        <DisabledField wide multiline required label="项目审核意见" value={project.status === "整改中" ? "需要提质改造" : "符合高标准农田建设项目立项和实施要求。"} />
      </div>
    );
  }
  if (activeTab === "项目验收投资") {
    return (
      <div className="grid gap-x-16 gap-y-8 md:grid-cols-2">
        <DisabledField required label="验收总投资(万元)" value={project.investment.toFixed(2)} />
        <DisabledField required label="验收财政资金(万元)" value={project.fundsPaid.toFixed(2)} />
        <DisabledField required label="验收社会资金(万元)" value={(project.investment - project.fundsPaid).toFixed(0)} />
      </div>
    );
  }
  if (activeTab === "项目验收信息") {
    return (
      <div className="grid gap-x-16 gap-y-8 md:grid-cols-2">
        <DisabledField required label="验收日期" value="请选择验收日期" calendar />
        <DisabledField required label="验收单位" value={`${project.city}农业农村局验收组`} />
        <UploadField required label="验收文件" files={["tmp_098be5b2e2b341bfa98df2a795a92dcf5b30f9176a8a38fc.jpg", "tmp_93483f776865da2a64847e964e8d57141c36f20fca8680be.jpg", "tmp_df62f5189022a9c280052a2e3a0201cba936e56e3ee395a9.jpg"]} />
      </div>
    );
  }
  return (
    <div className="space-y-11">
      <UploadField label="项目设计图" />
      <UploadField label="项目竣工图" />
      <UploadField label="权属界限" />
      <UploadField label="项目建设范围线" />
      <UploadField label="建设前影像图" />
      <UploadField label="建设后影像图" />
      <div className="flex justify-end pt-4"><button className="rounded-md border border-[rgba(255,255,255,0.1)] bg-[rgba(255,255,255,0.05)] px-8 py-3 text-[rgba(234,251,255,0.7)]">取 消</button></div>
    </div>
  );
}

function ProjectDetailModal({ project, activeTab, onTabChange, onClose }: { project: HighStandardProject; activeTab: DetailTab; onTabChange: (tab: DetailTab) => void; onClose: () => void }) {
  return (
    <div className="fixed inset-0 z-[9999] flex items-start justify-center overflow-auto bg-[rgba(3,20,28,0.75)] p-6 backdrop-blur-sm">
      <div className="my-4 w-full max-w-[1200px] overflow-hidden rounded-[10px] border border-[rgba(39,215,232,0.2)] bg-[rgba(6,26,36,0.95)] shadow-2xl">
        <div className="flex items-center justify-between border-b border-[rgba(39,215,232,0.15)] bg-[rgba(10,37,48,0.9)] px-7 py-5">
          <h2 className="text-2xl font-semibold text-[#EAFBFF]">查看农田项目</h2>
          <button onClick={onClose} className="text-3xl font-light leading-none text-[rgba(234,251,255,0.5)] hover:text-[#EAFBFF]">×</button>
        </div>
        <div className="p-7">
          <div className="flex flex-wrap gap-3">
            {detailTabs.map((tab) => (
              <button key={tab} onClick={() => onTabChange(tab)} className={`rounded-lg px-4 py-2.5 text-sm font-semibold transition ${activeTab === tab ? "bg-[rgba(39,215,232,0.15)] text-[#27D7E8]" : "bg-[rgba(255,255,255,0.05)] text-[rgba(234,251,255,0.7)] hover:bg-[rgba(255,255,255,0.08)]"}`}>{tab}</button>
            ))}
          </div>
          <div className="min-h-[360px] pt-6">
            <DetailForm project={project} activeTab={activeTab} />
          </div>
        </div>
      </div>
    </div>
  );
}

const moistureMetrics = [
  { label: "土温2", value: "22.4", unit: "℃", color: "#27D7E8" },
  { label: "土湿1", value: "31.8", unit: "%", color: "#67D66E" },
  { label: "土湿2", value: "29.6", unit: "%", color: "#27D7E8" },
  { label: "土湿3", value: "26.5", unit: "%", color: "#FF9F3F" },
];

const chartBars = [38, 52, 44, 68, 57, 72, 61, 75, 66, 84, 73, 78, 69, 88, 76, 82, 71, 79];

function MiniLineChart({ data, color }: { data: number[]; color: string }) {
  const option = useMemo(() => ({
    grid: { left: 0, right: 0, top: 4, bottom: 4 },
    xAxis: { type: "category", show: false, data: data.map((_, i) => i) },
    yAxis: { type: "value", show: false, min: "dataMin", max: "dataMax" },
    series: [{
      type: "line",
      data,
      smooth: true,
      symbol: "none",
      lineStyle: { width: 2, color },
      areaStyle: { color: `${color}33` },
    }],
    animation: false,
  }), [data, color]);
  return <ReactECharts option={option} style={{ height: 40, width: "100%" }} />;
}

const insectRows = Array.from({ length: 8 }, (_, index) => ({
  id: index + 1,
  time: `2026-06-0${(index % 5) + 1} ${String(8 + index).padStart(2, "0")}:3${index % 6}:12`,
  total: 18 + index * 7,
  species: 2 + (index % 4),
  pest: ["稻纵卷叶螟", "二化螟", "草地贪夜蛾", "稻飞虱"][index % 4],
}));

function DeviceInfoGrid({ device }: { device: DevicePoint }) {
  return (
    <div className="grid gap-4 md:grid-cols-4">
      <div className="rounded-md border border-[rgba(255,255,255,0.08)] bg-[rgba(255,255,255,0.04)] p-4"><p className="text-xs font-semibold text-[rgba(234,251,255,0.5)]">设备编号</p><p className="mt-2 font-semibold text-[rgba(234,251,255,0.85)]">{device.id.toUpperCase()}</p></div>
      <div className="rounded-md border border-[rgba(255,255,255,0.08)] bg-[rgba(255,255,255,0.04)] p-4"><p className="text-xs font-semibold text-[rgba(234,251,255,0.5)]">设备名称</p><p className="mt-2 font-semibold text-[rgba(234,251,255,0.85)]">{device.name}</p></div>
      <div className="rounded-md border border-[rgba(255,255,255,0.08)] bg-[rgba(255,255,255,0.04)] p-4"><p className="text-xs font-semibold text-[rgba(234,251,255,0.5)]">设备状态</p><p className="mt-2 font-semibold text-[#67D66E]">{device.status}</p></div>
      <div className="rounded-md border border-[rgba(255,255,255,0.08)] bg-[rgba(255,255,255,0.04)] p-4"><p className="text-xs font-semibold text-[rgba(234,251,255,0.5)]">更新时间</p><p className="mt-2 font-semibold text-[rgba(234,251,255,0.85)]">{device.time}</p></div>
    </div>
  );
}

function MoistureDetail({ device }: { device: DevicePoint }) {
  const chartOption = useMemo(() => {
    const timeData = Array.from({ length: 24 }, (_, i) => `${String(i).padStart(2, "0")}:00`);
    const moistureData = [28.5, 29.1, 30.2, 31.5, 32.1, 31.8, 30.5, 29.8, 28.6, 27.5, 26.8, 27.2, 28.5, 29.8, 30.5, 31.2, 32.5, 33.1, 32.8, 31.5, 30.2, 29.5, 28.8, 28.2];
    const tempData = [20.5, 20.2, 19.8, 19.5, 19.2, 19.5, 20.2, 21.5, 22.8, 24.2, 25.5, 26.8, 27.5, 28.2, 28.8, 29.2, 29.5, 29.2, 28.5, 27.2, 25.8, 24.5, 23.2, 21.8];
    return {
      tooltip: { trigger: "axis", backgroundColor: "rgba(6,26,36,0.9)", borderColor: "rgba(39,215,232,0.3)", textStyle: { color: "#EAFBFF" } },
      legend: { data: ["土壤含水率", "土壤温度"], textStyle: { color: "rgba(234,251,255,0.7)" }, top: 0 },
      grid: { left: 50, right: 20, top: 40, bottom: 40 },
      xAxis: { type: "category", data: timeData, axisLabel: { color: "rgba(234,251,255,0.5)", fontSize: 10 }, axisLine: { lineStyle: { color: "rgba(255,255,255,0.1)" } } },
      yAxis: [
        { type: "value", name: "含水率(%)", nameTextStyle: { color: "rgba(234,251,255,0.5)" }, axisLabel: { color: "rgba(234,251,255,0.5)" }, splitLine: { lineStyle: { color: "rgba(255,255,255,0.1)" } }, axisLine: { lineStyle: { color: "rgba(255,255,255,0.1)" } } },
        { type: "value", name: "温度(℃)", nameTextStyle: { color: "rgba(234,251,255,0.5)" }, axisLabel: { color: "rgba(234,251,255,0.5)" }, splitLine: { show: false }, axisLine: { lineStyle: { color: "rgba(255,255,255,0.1)" } } },
      ],
      series: [
        { name: "土壤含水率", type: "line", data: moistureData, smooth: true, symbol: "none", lineStyle: { color: "#27D7E8", width: 2 }, itemStyle: { color: "#27D7E8" }, areaStyle: { color: "rgba(39,215,232,0.1)" } },
        { name: "土壤温度", type: "line", yAxisIndex: 1, data: tempData, smooth: true, symbol: "none", lineStyle: { color: "#FF9F3F", width: 2 }, itemStyle: { color: "#FF9F3F" } },
      ],
    };
  }, []);
  return (
    <div className="space-y-6">
      <DeviceInfoGrid device={device} />
      <div className="rounded-md border border-[rgba(255,255,255,0.08)] bg-[rgba(255,255,255,0.04)] p-5">
        <div className="flex flex-wrap items-center justify-between gap-4 border-b border-[rgba(255,255,255,0.08)] pb-4">
          <div className="flex items-center gap-3"><Droplets className="h-6 w-6 text-[#27D7E8]" /><h3 className="text-xl font-semibold text-[#EAFBFF]">实时数据<span className="ml-2 text-sm text-[#67D66E]">({device.status})</span></h3></div>
          <div className="flex flex-wrap gap-3 text-sm text-[rgba(234,251,255,0.6)]"><span className="flex items-center gap-1"><BatteryFull className="h-4 w-4 text-[#67D66E]" />电量:100%</span><span className="flex items-center gap-1"><Signal className="h-4 w-4 text-[#27D7E8]" />信号:强</span><span className="flex items-center gap-1"><Clock className="h-4 w-4 text-[rgba(234,251,255,0.4)]" />数据更新时间:2026-06-05 14:31:26</span></div>
        </div>
        <div className="mt-5 grid gap-4 md:grid-cols-4">
          {moistureMetrics.map((metric) => (
            <div key={metric.label} className="rounded-md border border-[rgba(255,255,255,0.08)] bg-[rgba(255,255,255,0.05)] p-5">
              <p className="text-sm font-semibold text-[rgba(234,251,255,0.6)]">{metric.label}</p>
              <div className="mt-3 flex items-end gap-2"><span className="text-3xl font-bold" style={{ color: metric.color }}>{metric.value}</span><span className="pb-1 text-sm font-semibold text-[rgba(234,251,255,0.5)]">{metric.unit}</span></div>
            </div>
          ))}
        </div>
      </div>
      <div className="rounded-md border border-[rgba(255,255,255,0.08)] bg-[rgba(255,255,255,0.04)] p-5">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <h3 className="text-xl font-semibold text-[#EAFBFF]">数据统计</h3>
          <div className="flex flex-wrap items-center gap-3 text-sm"><span className="font-semibold text-[rgba(234,251,255,0.6)]">时间选择</span><input value="2026-06-05" readOnly className="h-10 rounded-md border border-[rgba(255,255,255,0.1)] bg-[rgba(255,255,255,0.05)] px-4 text-[rgba(234,251,255,0.7)]" /><button className="h-10 rounded-md bg-[rgba(39,215,232,0.2)] px-8 font-semibold text-[#27D7E8]">查询</button></div>
        </div>
        <div className="mt-6 h-72 rounded-md border border-[rgba(255,255,255,0.08)] bg-[rgba(255,255,255,0.03)] p-4">
          <ReactECharts option={chartOption} style={{ height: "100%", width: "100%" }} />
        </div>
      </div>
    </div>
  );
}

function InsectDetail({ device }: { device: DevicePoint }) {
  return (
    <div className="space-y-6">
      <DeviceInfoGrid device={device} />
      <div className="rounded-md border border-[rgba(255,255,255,0.08)] bg-[rgba(255,255,255,0.04)] p-5">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3"><Bug className="h-6 w-6 text-[#FF9F3F]" /><h3 className="text-xl font-semibold text-[#EAFBFF]">虫情测报灯</h3><span className="rounded-full bg-[rgba(255,159,63,0.15)] px-3 py-1 text-xs font-semibold text-[#FF9F3F]">AI 识别已接入</span></div>
          <button className="rounded-md bg-[rgba(39,215,232,0.2)] px-6 py-2 text-sm font-semibold text-[#27D7E8]">AI 分析</button>
        </div>
        <div className="mt-5 grid gap-3 md:grid-cols-[1fr_1fr_1.4fr_auto_auto]">
          <input readOnly value="害虫名称：全部" className="h-11 rounded-md border border-[rgba(255,255,255,0.1)] bg-[rgba(255,255,255,0.05)] px-4 text-sm text-[rgba(234,251,255,0.7)]" />
          <input readOnly value="是否有虫：全部" className="h-11 rounded-md border border-[rgba(255,255,255,0.1)] bg-[rgba(255,255,255,0.05)] px-4 text-sm text-[rgba(234,251,255,0.7)]" />
          <input readOnly value="时间范围：2026-06-01 至 2026-06-05" className="h-11 rounded-md border border-[rgba(255,255,255,0.1)] bg-[rgba(255,255,255,0.05)] px-4 text-sm text-[rgba(234,251,255,0.7)]" />
          <button className="h-11 rounded-md bg-[rgba(39,215,232,0.2)] px-7 text-sm font-semibold text-[#27D7E8]">查询</button>
          <button className="h-11 rounded-md border border-[rgba(255,255,255,0.1)] bg-[rgba(255,255,255,0.05)] px-7 text-sm font-semibold text-[rgba(234,251,255,0.7)]">重置</button>
        </div>
      </div>
      <div className="grid gap-5 md:grid-cols-4">
        {insectRows.map((row) => (
          <div key={row.id} className="overflow-hidden rounded-md border border-[rgba(255,255,255,0.08)] bg-[rgba(255,255,255,0.04)]">
            <div className="relative h-36 bg-[radial-gradient(circle_at_34%_40%,#334155_0_3px,transparent_4px),radial-gradient(circle_at_62%_58%,#78350f_0_4px,transparent_5px),linear-gradient(135deg,#ecfccb,#fef3c7)]">
              <span className="absolute left-3 top-3 rounded-full bg-[rgba(6,26,36,0.8)] px-3 py-1 text-xs font-semibold text-white">{row.pest}</span>
            </div>
            <div className="space-y-2 p-4 text-sm text-[rgba(234,251,255,0.85)]">
              <p><b>时间：</b>{row.time}</p>
              <p><b>害虫总数：</b>{row.total} 头</p>
              <p><b>识别种数：</b>{row.species} 种</p>
              <button className="mt-2 w-full rounded-md border border-[rgba(39,215,232,0.3)] py-2 font-semibold text-[#27D7E8]">查看详情</button>
            </div>
          </div>
        ))}
      </div>
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-md border border-[rgba(255,255,255,0.08)] bg-[rgba(255,255,255,0.04)] px-5 py-4 text-sm text-[rgba(234,251,255,0.6)]"><span>共 8430 条</span><span className="rounded-md border border-[rgba(255,255,255,0.1)] bg-[rgba(255,255,255,0.05)] px-3 py-2">10条/页</span><div className="flex items-center gap-2"><button className="rounded border border-[rgba(255,255,255,0.1)] bg-[rgba(255,255,255,0.05)] px-2 py-1"><ChevronLeft className="h-4 w-4" /></button>{[1, 2, 3, 4, 5].map((page) => <button key={page} className={`rounded border px-3 py-1 ${page === 1 ? "border-[#27D7E8] bg-[rgba(39,215,232,0.2)] text-[#27D7E8]" : "border-[rgba(255,255,255,0.1)] bg-[rgba(255,255,255,0.05)] text-[rgba(234,251,255,0.7)]"}`}>{page}</button>)}<button className="rounded border border-[rgba(255,255,255,0.1)] bg-[rgba(255,255,255,0.05)] px-2 py-1"><ChevronRight className="h-4 w-4" /></button><span>前往 1 页</span></div></div>
    </div>
  );
}

function CameraDetail({ device }: { device: DevicePoint }) {
  return (
    <div className="space-y-6">
      <DeviceInfoGrid device={device} />
      <div className="grid gap-5 lg:grid-cols-[1fr_280px]">
        <div className="overflow-hidden rounded-md border border-[rgba(255,255,255,0.08)] bg-[rgba(255,255,255,0.04)]">
          <div className="relative h-[520px] bg-[radial-gradient(circle_at_24%_20%,rgba(255,255,255,.18),transparent_18%),linear-gradient(145deg,#17412f_0%,#1d5d3b_34%,#89a85d_35%,#72934f_48%,#2d6542_49%,#103827_100%)]">
            <div className="absolute inset-x-0 bottom-20 h-28 bg-[repeating-linear-gradient(100deg,rgba(254,240,138,.56)_0_8px,rgba(16,185,129,.25)_8px_16px)] opacity-80" />
            <div className="absolute right-4 top-4 rounded bg-[rgba(6,26,36,0.8)] px-3 py-2 text-sm font-semibold text-white">2026-06-05 14:31:26</div>
            <div className="absolute left-4 top-4 rounded bg-[rgba(6,26,36,0.7)] px-3 py-2 text-sm font-semibold text-[#27D7E8]">{device.name}</div>
            <div className="absolute bottom-0 left-0 right-0 flex items-center justify-between bg-[rgba(6,26,36,0.9)] px-5 py-4 text-white">
              <div className="flex items-center gap-4"><Play className="h-5 w-5" /><Pause className="h-5 w-5" /><Square className="h-5 w-5" /><Volume2 className="h-5 w-5" /><span className="rounded bg-white/10 px-3 py-1 text-xs font-semibold">高清</span><span className="rounded bg-white/10 px-3 py-1 text-xs font-semibold">1.0x</span></div>
              <div className="flex items-center gap-4"><Camera className="h-5 w-5" /><RefreshCw className="h-5 w-5" /><Maximize2 className="h-5 w-5" /></div>
            </div>
          </div>
        </div>
        <div className="rounded-md border border-[rgba(255,255,255,0.08)] bg-[rgba(255,255,255,0.04)] p-5">
          <h3 className="flex items-center gap-2 text-xl font-semibold text-[#EAFBFF]"><Camera className="h-5 w-5 text-[#27D7E8]" />云台控制</h3>
          <div className="mt-6 grid grid-cols-3 gap-3">
            {['↖', '↑', '↗', '←', '●', '→', '↙', '↓', '↘'].map((item) => <button key={item} className="grid h-14 place-items-center rounded-md border border-[rgba(255,255,255,0.1)] bg-[rgba(255,255,255,0.05)] text-xl font-semibold text-[rgba(234,251,255,0.7)] hover:bg-[rgba(39,215,232,0.1)]">{item}</button>)}
          </div>
          <div className="mt-6 space-y-4 text-sm text-[rgba(234,251,255,0.7)]">
            <div><div className="mb-2 flex justify-between"><span>焦距</span><span>65%</span></div><div className="h-2 rounded-full bg-[rgba(255,255,255,0.08)]"><div className="h-full w-[65%] rounded-full bg-[#27D7E8]" /></div></div>
            <div><div className="mb-2 flex justify-between"><span>亮度</span><span>72%</span></div><div className="h-2 rounded-full bg-[rgba(255,255,255,0.08)]"><div className="h-full w-[72%] rounded-full bg-[#67D66E]" /></div></div>
            <div><div className="mb-2 flex justify-between"><span>巡航速度</span><span>中速</span></div><div className="h-2 rounded-full bg-[rgba(255,255,255,0.08)]"><div className="h-full w-1/2 rounded-full bg-[#FF9F3F]" /></div></div>
          </div>
          <button className="mt-6 flex w-full items-center justify-center gap-2 rounded-md bg-[rgba(39,215,232,0.2)] px-5 py-3 text-sm font-semibold text-[#27D7E8]"><Zap className="h-4 w-4" />开始巡航</button>
        </div>
      </div>
    </div>
  );
}

const weatherMetrics = [
  { label: "空气温度", value: "32.8", unit: "℃", icon: Thermometer, color: "#FF9F3F" },
  { label: "空气湿度", value: "25.7", unit: "%", icon: Droplets, color: "#27D7E8" },
  { label: "大气压强", value: "1007", unit: "hPa", icon: BarChart3, color: "#a855f7" },
  { label: "风速", value: "1.9", unit: "m/s", icon: Wind, color: "#67D66E" },
  { label: "风向", value: "东南风", unit: "", icon: Wind, color: "#27D7E8" },
  { label: "降雨量", value: "0", unit: "mm", icon: Droplets, color: "#06b6d4" },
  { label: "光照强度", value: "18620", unit: "lux", icon: Sun, color: "#facc15" },
  { label: "雨量累计", value: "0", unit: "mm", icon: Droplets, color: "#64748b" },
];

function WeatherStationDetail({ device }: { device: DevicePoint }) {
  const chartOption = useMemo(() => {
    const timeData = Array.from({ length: 24 }, (_, i) => `${String(i).padStart(2, "0")}:00`);
    const tempData = [28.5, 27.8, 27.2, 26.8, 26.5, 26.2, 26.8, 28.2, 30.5, 32.8, 34.5, 35.2, 35.8, 36.2, 36.5, 35.8, 34.2, 32.5, 30.8, 29.5, 28.8, 28.2, 27.8, 27.5];
    const humidityData = [85, 88, 90, 92, 93, 94, 92, 85, 72, 58, 45, 38, 32, 28, 25, 28, 35, 45, 55, 65, 72, 78, 82, 85];
    const pressureData = [1008, 1008, 1009, 1009, 1010, 1010, 1010, 1009, 1008, 1007, 1006, 1005, 1005, 1006, 1007, 1007, 1008, 1009, 1009, 1010, 1010, 1010, 1009, 1008];
    const windData = [1.2, 1.0, 0.8, 0.6, 0.5, 0.5, 0.8, 1.5, 2.2, 2.8, 3.2, 3.5, 3.8, 3.5, 3.2, 2.8, 2.5, 2.2, 1.8, 1.5, 1.2, 1.0, 0.8, 0.6];
    return {
      tooltip: { trigger: "axis", backgroundColor: "rgba(6,26,36,0.9)", borderColor: "rgba(39,215,232,0.3)", textStyle: { color: "#EAFBFF" } },
      legend: { data: ["空气温度", "空气湿度", "大气压强", "风速"], textStyle: { color: "rgba(234,251,255,0.7)" }, top: 0 },
      grid: { left: 50, right: 20, top: 40, bottom: 40 },
      xAxis: { type: "category", data: timeData, axisLabel: { color: "rgba(234,251,255,0.5)", fontSize: 10 }, axisLine: { lineStyle: { color: "rgba(255,255,255,0.1)" } } },
      yAxis: [
        { type: "value", name: "温度(℃)/湿度(%)", nameTextStyle: { color: "rgba(234,251,255,0.5)" }, axisLabel: { color: "rgba(234,251,255,0.5)" }, splitLine: { lineStyle: { color: "rgba(255,255,255,0.1)" } }, axisLine: { lineStyle: { color: "rgba(255,255,255,0.1)" } } },
        { type: "value", name: "压强(hPa)/风速(m/s)", nameTextStyle: { color: "rgba(234,251,255,0.5)" }, axisLabel: { color: "rgba(234,251,255,0.5)" }, splitLine: { show: false }, axisLine: { lineStyle: { color: "rgba(255,255,255,0.1)" } } },
      ],
      series: [
        { name: "空气温度", type: "line", data: tempData, smooth: true, symbol: "none", lineStyle: { color: "#FF9F3F", width: 2 }, itemStyle: { color: "#FF9F3F" } },
        { name: "空气湿度", type: "line", data: humidityData, smooth: true, symbol: "none", lineStyle: { color: "#27D7E8", width: 2 }, itemStyle: { color: "#27D7E8" } },
        { name: "大气压强", type: "line", yAxisIndex: 1, data: pressureData, smooth: true, symbol: "none", lineStyle: { color: "#a855f7", width: 2 }, itemStyle: { color: "#a855f7" } },
        { name: "风速", type: "line", yAxisIndex: 1, data: windData, smooth: true, symbol: "none", lineStyle: { color: "#67D66E", width: 2 }, itemStyle: { color: "#67D66E" } },
      ],
    };
  }, []);
  return (
    <div className="space-y-6">
      <DeviceInfoGrid device={device} />
      <div className="rounded-md border border-[rgba(255,255,255,0.08)] bg-[rgba(255,255,255,0.04)] p-5">
        <div className="flex flex-wrap items-center justify-between gap-4 border-b border-[rgba(255,255,255,0.08)] pb-4">
          <div className="flex items-center gap-3"><Sun className="h-6 w-6 text-[#a855f7]" /><h3 className="text-xl font-semibold text-[#EAFBFF]">实时数据<span className="ml-2 text-sm text-[#67D66E]">({device.status})</span></h3></div>
          <div className="flex flex-wrap gap-3 text-sm text-[rgba(234,251,255,0.6)]"><span className="flex items-center gap-1"><BatteryFull className="h-4 w-4 text-[#67D66E]" />电量:100%</span><span className="flex items-center gap-1"><Signal className="h-4 w-4 text-[#27D7E8]" />信号:强</span><span className="flex items-center gap-1"><Clock className="h-4 w-4 text-[rgba(234,251,255,0.4)]" />数据更新时间:2026-06-05 14:35:28</span></div>
        </div>
        <div className="mt-5 grid gap-4 md:grid-cols-4">
          {weatherMetrics.map((metric) => (
            <div key={metric.label} className="rounded-md border border-[rgba(255,255,255,0.08)] bg-[rgba(255,255,255,0.05)] p-5">
              <div className="flex items-center gap-2"><metric.icon className="h-4 w-4" style={{ color: metric.color }} /><p className="text-sm font-semibold text-[rgba(234,251,255,0.6)]">{metric.label}</p></div>
              <div className="mt-3 flex items-end gap-2"><span className="text-3xl font-bold" style={{ color: metric.color }}>{metric.value}</span><span className="pb-1 text-sm font-semibold text-[rgba(234,251,255,0.5)]">{metric.unit}</span></div>
            </div>
          ))}
        </div>
      </div>
      <div className="rounded-md border border-[rgba(255,255,255,0.08)] bg-[rgba(255,255,255,0.04)] p-5">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <h3 className="text-xl font-semibold text-[#EAFBFF]">数据统计</h3>
          <div className="flex flex-wrap items-center gap-3 text-sm"><span className="font-semibold text-[rgba(234,251,255,0.6)]">时间范围</span><input value="2026-06-01" readOnly className="h-10 w-32 rounded-md border border-[rgba(255,255,255,0.1)] bg-[rgba(255,255,255,0.05)] px-4 text-[rgba(234,251,255,0.7)]" /><span className="text-[rgba(234,251,255,0.5)]">至</span><input value="2026-06-05" readOnly className="h-10 w-32 rounded-md border border-[rgba(255,255,255,0.1)] bg-[rgba(255,255,255,0.05)] px-4 text-[rgba(234,251,255,0.7)]" /><button className="h-10 rounded-md bg-[rgba(39,215,232,0.2)] px-8 font-semibold text-[#27D7E8]">查询</button></div>
        </div>
        <div className="mt-6 h-80 rounded-md border border-[rgba(255,255,255,0.08)] bg-[rgba(255,255,255,0.03)] p-4">
          <ReactECharts option={chartOption} style={{ height: "100%", width: "100%" }} />
        </div>
      </div>
    </div>
  );
}

function DeviceDetailModal({ device, onClose }: { device: DevicePoint; onClose: () => void }) {
  const title = device.type === "摄像头" ? "摄像头详情" : device.type === "墒情设备" ? "墒情监测详情" : device.type === "气象站" ? "气象站详情" : "虫情监测详情";
  return (
    <div className="fixed inset-0 z-[9999] flex items-start justify-center overflow-auto bg-[rgba(3,20,28,0.75)] p-6 backdrop-blur-sm">
      <div className="my-4 w-full max-w-[1200px] overflow-hidden rounded-[10px] border border-[rgba(39,215,232,0.2)] bg-[rgba(6,26,36,0.95)] shadow-2xl">
        <div className="flex items-center justify-between border-b border-[rgba(39,215,232,0.15)] bg-[rgba(10,37,48,0.9)] px-7 py-5">
          <div><h2 className="text-2xl font-semibold text-[#EAFBFF]">{title}</h2><p className="mt-1 text-sm text-[rgba(234,251,255,0.6)]">{device.name} · {device.value}</p></div>
          <button onClick={onClose} className="text-3xl font-light leading-none text-[rgba(234,251,255,0.5)] hover:text-[#EAFBFF]">×</button>
        </div>
        <div className="min-h-[560px] bg-[rgba(6,26,36,0.5)] p-7">
          {device.type === "墒情设备" && <MoistureDetail device={device} />}
          {device.type === "虫情设备" && <InsectDetail device={device} />}
          {device.type === "摄像头" && <CameraDetail device={device} />}
          {device.type === "气象站" && <WeatherStationDetail device={device} />}
        </div>
      </div>
    </div>
  );
}

export default function SupervisionMap({ onBack }: SupervisionMapProps) {
  const [regionId, setRegionId] = useState("anhui");
  const [keyword, setKeyword] = useState("");
  const [searchText, setSearchText] = useState("");
  const [selectedProject, setSelectedProject] = useState<HighStandardProject | null>(null);
  const [selectedParcel, setSelectedParcel] = useState<SupervisionParcelSearchResult | null>(null);
  const [hasSearched, setHasSearched] = useState(false);
  const [detailProject, setDetailProject] = useState<HighStandardProject | null>(null);
  const [detailDevice, setDetailDevice] = useState<DevicePoint | null>(null);
  const [detailTab, setDetailTab] = useState<DetailTab>("项目基本信息");
  const [layers, setLayers] = useState(defaultSupervisionLayers);
  const regionProjects = useMemo(() => filterSupervisionProjects(regionId), [regionId]);
  const projects = useMemo(() => filterSupervisionProjects(regionId, keyword), [keyword, regionId]);
  const parcelResults = useMemo(() => matchHighStandardParcels(regionProjects, keyword), [keyword, regionProjects]);
  const mapProjects = keyword ? regionProjects : projects;
  const stats = useMemo(() => buildSupervisionStats(projects), [projects]);
  const statusRows = useMemo(() => ["建设中", "已完工", "待验收", "整改中"].map((status) => ({ status, count: projects.filter((project) => project.status === status).length })), [projects]);

  useEffect(() => {
    setKeyword("");
    setSearchText("");
    setSelectedProject(null);
    setSelectedParcel(null);
    setHasSearched(false);
  }, [regionId]);

  const selectProject = (project: HighStandardProject) => {
    setSelectedProject(project);
    setSelectedParcel(null);
  };

  const selectParcel = (item: SupervisionParcelSearchResult) => {
    if (regionId !== "feixi") {
      setRegionId("feixi");
      window.setTimeout(() => {
        setSelectedProject(item.project);
        setSelectedParcel(item);
      }, 0);
      return;
    }
    setSelectedProject(item.project);
    setSelectedParcel(item);
  };

  const handleSearch = () => {
    const text = searchText.trim();
    setKeyword(text);
    setHasSearched(Boolean(text));
    const matchedParcel = matchHighStandardParcels(regionProjects, text)[0];
    if (matchedParcel) {
      selectParcel(matchedParcel);
      return;
    }
    const matched = filterSupervisionProjects(regionId, text)[0];
    setSelectedParcel(null);
    setSelectedProject(matched ?? null);
  };

  const openProjectDetail = (project: HighStandardProject) => {
    setDetailTab("项目基本信息");
    setDetailProject(project);
  };

  return (
    <main className="min-h-screen overflow-hidden bg-[#061A24] text-cyan-50">
      <style>{`
        ::-webkit-scrollbar {
          display: none;
        }
      `}</style>
      <div className="fixed inset-0 bg-[radial-gradient(circle_at_15%_10%,rgba(39,215,232,0.08),transparent_26%),radial-gradient(circle_at_82%_8%,rgba(39,215,232,0.06),transparent_28%),linear-gradient(135deg,#061A24_0%,#0A2530_48%,#061A24_100%)]" />
      <div className="fixed inset-0 opacity-[0.12] [background-image:linear-gradient(rgba(39,215,232,0.15)_1px,transparent_1px),linear-gradient(90deg,rgba(39,215,232,0.12)_1px,transparent_1px)] [background-size:44px_44px]" />
      <section className="relative mx-auto max-w-[1760px] p-5">
        <header className="flex flex-wrap items-center justify-between gap-4 rounded-[10px] border border-[rgba(39,215,232,0.18)] bg-[rgba(7,35,43,0.78)] px-5 py-4">
          <div className="flex items-center gap-4">
            <button onClick={onBack} className="grid h-11 w-11 place-items-center rounded-lg bg-[rgba(39,215,232,0.15)] text-[#27D7E8]"><ArrowLeft className="h-5 w-5" /></button>
            <div><p className="text-[12px] font-semibold tracking-[0.25em] text-[rgba(234,251,255,0.55)]">HIGH STANDARD FARMLAND GIS</p><h1 className="mt-1 text-[32px] font-bold text-[#EAFBFF]">高标准农田建设监管系统 · 一张图</h1></div>
          </div>
          <div className="flex items-center gap-3 rounded-md border border-[rgba(39,215,232,0.18)] bg-transparent px-4 py-2 text-sm font-semibold text-[#DDF8FF]"><LocateFixed className="h-5 w-5 text-[#27D7E8]" />当前范围：{getSupervisionRegionName(regionId)}</div>
        </header>

        <section className="mt-5 grid gap-3 md:grid-cols-2 xl:grid-cols-6">
          <StatCard label="项目数量" value={stats.count} unit="个" icon={Building2} />
          <StatCard label="建设面积" value={stats.area.toLocaleString()} unit="亩" icon={BarChart3} />
          <StatCard label="投资金额" value={stats.investment.toLocaleString()} unit="万元" icon={Coins} />
          <StatCard label="平均进度" value={stats.progress} unit="%" icon={TrendingUp} />
          <StatCard label="问题数量" value={stats.issues} unit="项" icon={ShieldAlert} />
          <StatCard label="整改率" value={stats.rectificationRate} unit="%" icon={ClipboardList} />
        </section>

        <section className="mt-5 grid gap-5 xl:grid-cols-[300px_minmax(760px,1fr)_340px]">
          <aside className="space-y-5">
            <div className="rounded-[10px] border border-[rgba(39,215,232,0.18)] bg-[rgba(7,35,43,0.78)] p-4">
              <div className="flex items-center gap-2">
                <div className="h-4 w-1 rounded-full bg-[#27D7E8]" />
                <p className="text-[15px] font-semibold text-[#DDF8FF]">GIS 空间查询</p>
              </div>
              <div className="mt-3 flex gap-2 rounded-lg border border-[rgba(255,255,255,0.08)] bg-[rgba(255,255,255,0.05)] p-2">
                <input value={searchText} onChange={(event) => setSearchText(event.target.value)} onKeyDown={(event) => { if (event.key === "Enter") handleSearch(); }} placeholder="输入项目名称/项目编号/地块编号" className="min-w-0 flex-1 bg-transparent px-2 text-sm text-cyan-50 outline-none placeholder:text-cyan-100/40" />
                <button onClick={handleSearch} className="grid h-9 w-9 place-items-center rounded-lg bg-[#27D7E8] text-[#061A24]"><Search className="h-4 w-4" /></button>
              </div>
              {hasSearched && (
                <div className="mt-3 space-y-2">
                  {parcelResults.slice(0, 8).map((item) => (
                    <button key={`${item.project.id}-${item.index}`} onClick={() => selectParcel(item)} className={`w-full rounded-lg border px-3 py-2.5 text-left text-sm transition ${selectedParcel?.project.id === item.project.id && selectedParcel.index === item.index ? "border-[#27D7E8] bg-[rgba(39,215,232,0.1)]" : "border-[rgba(255,255,255,0.08)] bg-[rgba(255,255,255,0.02)] hover:bg-[rgba(255,255,255,0.06)]"}`}>
                      <div className="font-semibold text-cyan-50">{item.code}</div>
                      <div className="mt-1 text-xs text-cyan-100/50">{item.project.name} · {item.project.town}</div>
                    </button>
                  ))}
                  {!parcelResults.length && projects.slice(0, 5).map((project) => (
                    <button key={project.id} onClick={() => selectProject(project)} className={`w-full rounded-lg border px-3 py-2.5 text-left text-sm transition ${selectedProject?.id === project.id && !selectedParcel ? "border-[#27D7E8] bg-[rgba(39,215,232,0.1)]" : "border-[rgba(255,255,255,0.08)] bg-[rgba(255,255,255,0.02)] hover:bg-[rgba(255,255,255,0.06)]"}`}>
                      <div className="font-semibold text-cyan-50">{project.name}</div>
                      <div className="mt-1 text-xs text-cyan-100/50">{project.code} · {project.county}{project.town} · {project.progress}%</div>
                    </button>
                  ))}
                  {!parcelResults.length && !projects.length && <div className="rounded-lg border border-[rgba(255,255,255,0.08)] bg-[rgba(255,255,255,0.02)] px-3 py-3 text-sm font-semibold text-cyan-100/50">未查询到匹配项目或地块</div>}
                </div>
              )}
            </div>
            <div className="rounded-[10px] border border-[rgba(39,215,232,0.18)] bg-[rgba(7,35,43,0.78)] p-4">
              <div className="flex items-center gap-2">
                <div className="h-4 w-1 rounded-full bg-[#27D7E8]" />
                <p className="text-[15px] font-semibold text-[#DDF8FF]">资金与问题</p>
              </div>
              <div className="mt-3 grid grid-cols-2 gap-3 text-sm">
                <div className="rounded-lg border border-[rgba(255,255,255,0.08)] bg-[rgba(255,255,255,0.05)] p-3"><span className="text-cyan-100/60">已拨付资金</span><br /><span className="text-lg font-semibold text-[#DDFB9A]">{stats.paid.toLocaleString()} 万元</span></div>
                <div className="rounded-lg border border-[rgba(255,255,255,0.08)] bg-[rgba(255,255,255,0.05)] p-3"><span className="text-cyan-100/60">问题整改</span><br /><span className="text-lg font-semibold text-cyan-50">{stats.rectified}/{stats.issues} 项</span></div>
              </div>
              <div className="mt-3 rounded-lg border border-[rgba(255,255,255,0.08)] bg-[rgba(255,255,255,0.05)] p-3 text-xs leading-5 text-cyan-100/50">
                资金拨付、问题整改与项目进度联动展示，点击地图项目区可查看单项目明细。
              </div>
            </div>
            <div className="rounded-[10px] border border-[rgba(39,215,232,0.18)] bg-[rgba(7,35,43,0.78)] p-4">
              <div className="flex items-center gap-2">
                <div className="h-4 w-1 rounded-full bg-[#27D7E8]" />
                <p className="text-[15px] font-semibold text-[#DDF8FF]">状态分布</p>
              </div>
              <div className="mt-3 space-y-2">
                {statusRows.map((row) => (
                  <div key={row.status}>
                    <div className="mb-1 flex justify-between text-xs font-semibold text-cyan-100/60"><span>{row.status}</span><span>{row.count} 个</span></div>
                    <div className="h-1.5 overflow-hidden rounded-full bg-[rgba(255,255,255,0.08)]"><div className="h-full rounded-full" style={{ width: `${projects.length ? (row.count / projects.length) * 100 : 0}%`, backgroundColor: projectStatusColor(row.status as HighStandardProject["status"]) }} /></div>
                  </div>
                ))}
              </div>
            </div>
          </aside>

          <SupervisionGisMap projects={mapProjects} regionId={regionId} selectedProjectId={selectedProject?.id} selectedParcel={selectedParcel ? { projectId: selectedParcel.project.id, index: selectedParcel.index } : null} layers={layers} onLayersChange={setLayers} onProjectSelect={selectProject} onRegionDrill={setRegionId} onOpenProjectDetail={openProjectDetail} onOpenDeviceDetail={setDetailDevice} />

          <aside className="space-y-5">
            {selectedProject ? <ProjectPanel project={selectedProject} onOpenDetail={openProjectDetail} /> : <RegionProjectSummaryPanel regionName={getSupervisionRegionName(regionId)} stats={stats} statusRows={statusRows} />}
          </aside>
        </section>
      </section>

      {detailProject && <ProjectDetailModal project={detailProject} activeTab={detailTab} onTabChange={setDetailTab} onClose={() => setDetailProject(null)} />}
      {detailDevice && <DeviceDetailModal device={detailDevice} onClose={() => setDetailDevice(null)} />}
    </main>
  );
}
