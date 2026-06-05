import { useMemo, useState } from "react";
import { ArrowLeft, BarChart3, BatteryFull, Bug, Building2, CalendarDays, Camera, CheckCircle2, ChevronLeft, ChevronRight, ClipboardList, Clock, Coins, Droplets, FileText, LocateFixed, Maximize2, Pause, Play, RefreshCw, Search, ShieldAlert, Signal, Square, TrendingUp, Upload, Volume2, Zap } from "lucide-react";
import SupervisionGisMap from "@/components/supervision/SupervisionGisMap";
import {
  buildSupervisionStats,
  defaultSupervisionLayers,
  filterSupervisionProjects,
  getSupervisionParentRegion,
  getSupervisionRegionName,
  highStandardProjects,
  projectStatusColor,
  type DevicePoint,
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

const detailTabs = ["项目基本信息", "项目投资信息", "项目建设内容", "项目建设审核", "项目验收投资", "项目验收信息", "工程建设矢量数据"] as const;

type DetailTab = (typeof detailTabs)[number];

function DisabledField({ label, value, required, wide, multiline, calendar, select }: { label: string; value?: string | number; required?: boolean; wide?: boolean; multiline?: boolean; calendar?: boolean; select?: boolean }) {
  return (
    <label className={`grid items-start gap-3 text-[15px] font-black text-slate-600 ${wide ? "md:col-span-2" : "md:grid-cols-[170px_1fr]"}`}>
      <span className={`pt-3 ${wide ? "" : "text-right"}`}>{required && <b className="mr-1 text-red-500">*</b>}{label}：</span>
      <div className={`relative rounded-md border border-slate-200 bg-slate-100/80 px-4 text-slate-400 ${multiline ? "min-h-28 py-3" : "h-14 leading-[3.4rem]"}`}>
        {calendar && <CalendarDays className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-300" />}
        <span className={calendar ? "pl-7" : ""}>{value ?? ""}</span>
        {select && <span className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-300">⌄</span>}
      </div>
    </label>
  );
}

function UploadField({ label, required, files }: { label: string; required?: boolean; files?: string[] }) {
  return (
    <div className="grid gap-3 text-[15px] font-black text-slate-600 md:grid-cols-[170px_1fr]">
      <span className="pt-3 text-right">{required && <b className="mr-1 text-red-500">*</b>}{label}：</span>
      <div>
        <button className="inline-flex h-12 items-center gap-2 rounded-md bg-[#80bff5] px-8 text-sm font-black text-white"><Upload className="h-4 w-4" />上传文件</button>
        <p className="mt-6 text-sm font-medium text-slate-500">支持扩展名： doc .docx .pdf .jpg ...</p>
        {files && (
          <div className="mt-7 space-y-4 text-sm font-medium text-slate-600">
            {files.map((file) => (
              <div key={file} className="flex items-center justify-between gap-4">
                <span className="flex min-w-0 items-center gap-3"><FileText className="h-5 w-5 shrink-0 text-slate-400" /><span className="truncate">{file}</span></span>
                <CheckCircle2 className="h-5 w-5 shrink-0 text-emerald-500" />
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
      <div className="flex justify-end pt-4"><button className="rounded-md border border-slate-200 px-8 py-3 text-slate-500">取 消</button></div>
    </div>
  );
}

function ProjectDetailModal({ project, activeTab, onTabChange, onClose }: { project: HighStandardProject; activeTab: DetailTab; onTabChange: (tab: DetailTab) => void; onClose: () => void }) {
  return (
    <div className="fixed inset-0 z-[9999] flex items-start justify-center overflow-auto bg-slate-950/55 p-6 backdrop-blur-sm">
      <div className="my-4 w-full max-w-[1200px] overflow-hidden rounded-md bg-white shadow-2xl">
        <div className="flex items-center justify-between border-b border-blue-200 px-7 py-5">
          <h2 className="text-2xl font-medium text-slate-800">查看农田项目</h2>
          <button onClick={onClose} className="text-3xl font-light leading-none text-slate-400 hover:text-slate-700">×</button>
        </div>
        <div className="p-7">
          <div className="flex flex-wrap gap-5">
            {detailTabs.map((tab) => (
              <button key={tab} onClick={() => onTabChange(tab)} className={`rounded-md border border-blue-500 px-2 py-2 text-xl transition ${activeTab === tab ? "bg-[#2f95ec] text-white" : "bg-white text-slate-900 hover:bg-blue-50"}`}>{tab}</button>
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
  { label: "土温2", value: "22.4", unit: "℃", color: "#2f95ec" },
  { label: "土湿1", value: "31.8", unit: "%", color: "#10b981" },
  { label: "土湿2", value: "29.6", unit: "%", color: "#06b6d4" },
  { label: "土湿3", value: "26.5", unit: "%", color: "#f59e0b" },
];

const chartBars = [38, 52, 44, 68, 57, 72, 61, 75, 66, 84, 73, 78, 69, 88, 76, 82, 71, 79];

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
      <div className="rounded-md border border-slate-200 bg-slate-50 p-4"><p className="text-xs font-black text-slate-400">设备编号</p><p className="mt-2 font-black text-slate-700">{device.id.toUpperCase()}</p></div>
      <div className="rounded-md border border-slate-200 bg-slate-50 p-4"><p className="text-xs font-black text-slate-400">设备名称</p><p className="mt-2 font-black text-slate-700">{device.name}</p></div>
      <div className="rounded-md border border-slate-200 bg-slate-50 p-4"><p className="text-xs font-black text-slate-400">设备状态</p><p className="mt-2 font-black text-emerald-600">{device.status}</p></div>
      <div className="rounded-md border border-slate-200 bg-slate-50 p-4"><p className="text-xs font-black text-slate-400">更新时间</p><p className="mt-2 font-black text-slate-700">{device.time}</p></div>
    </div>
  );
}

function MoistureDetail({ device }: { device: DevicePoint }) {
  return (
    <div className="space-y-6">
      <DeviceInfoGrid device={device} />
      <div className="rounded-md border border-blue-100 bg-white p-5">
        <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-100 pb-4">
          <div className="flex items-center gap-3"><Droplets className="h-6 w-6 text-[#2f95ec]" /><h3 className="text-xl font-medium text-slate-800">实时数据<span className="ml-2 text-sm text-emerald-600">({device.status})</span></h3></div>
          <div className="flex flex-wrap gap-3 text-sm font-bold text-slate-500"><span className="flex items-center gap-1"><BatteryFull className="h-4 w-4 text-emerald-500" />电量:100%</span><span className="flex items-center gap-1"><Signal className="h-4 w-4 text-blue-500" />信号:强</span><span className="flex items-center gap-1"><Clock className="h-4 w-4 text-slate-400" />数据更新时间:2026-06-05 14:31:26</span></div>
        </div>
        <div className="mt-5 grid gap-4 md:grid-cols-4">
          {moistureMetrics.map((metric) => (
            <div key={metric.label} className="rounded-md border border-slate-200 bg-slate-50 p-5">
              <p className="text-sm font-black text-slate-500">{metric.label}</p>
              <div className="mt-3 flex items-end gap-2"><span className="text-3xl font-black" style={{ color: metric.color }}>{metric.value}</span><span className="pb-1 text-sm font-black text-slate-400">{metric.unit}</span></div>
            </div>
          ))}
        </div>
      </div>
      <div className="rounded-md border border-blue-100 bg-white p-5">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <h3 className="text-xl font-medium text-slate-800">数据统计</h3>
          <div className="flex flex-wrap items-center gap-3 text-sm"><span className="font-black text-slate-500">时间选择</span><input value="2026-06-05" readOnly className="h-10 rounded-md border border-slate-200 bg-slate-50 px-4 text-slate-500" /><button className="h-10 rounded-md bg-[#2f95ec] px-8 font-black text-white">查询</button></div>
        </div>
        <div className="mt-6 h-72 rounded-md border border-slate-200 bg-[linear-gradient(to_right,#eef2f7_1px,transparent_1px),linear-gradient(to_bottom,#eef2f7_1px,transparent_1px)] bg-[size:54px_46px] p-6">
          <div className="flex h-full items-end gap-3">
            {chartBars.map((height, index) => <div key={index} className="flex flex-1 flex-col items-center justify-end gap-2"><div className="w-full rounded-t-md bg-gradient-to-t from-[#2f95ec] to-cyan-300" style={{ height: `${height}%` }} /><span className="text-[10px] font-bold text-slate-400">{index + 1}</span></div>)}
          </div>
        </div>
        <div className="mt-4 flex items-center justify-between rounded-md bg-slate-100 px-4 py-3 text-xs font-bold text-slate-500"><span>00:00</span><div className="h-2 flex-1 mx-5 overflow-hidden rounded-full bg-slate-200"><div className="h-full w-2/3 rounded-full bg-[#2f95ec]" /></div><span>24:00</span></div>
      </div>
    </div>
  );
}

function InsectDetail({ device }: { device: DevicePoint }) {
  return (
    <div className="space-y-6">
      <DeviceInfoGrid device={device} />
      <div className="rounded-md border border-blue-100 bg-white p-5">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3"><Bug className="h-6 w-6 text-orange-500" /><h3 className="text-xl font-medium text-slate-800">虫情测报灯</h3><span className="rounded-full bg-orange-100 px-3 py-1 text-xs font-black text-orange-600">AI 识别已接入</span></div>
          <button className="rounded-md bg-[#2f95ec] px-6 py-2 text-sm font-black text-white">AI 分析</button>
        </div>
        <div className="mt-5 grid gap-3 md:grid-cols-[1fr_1fr_1.4fr_auto_auto]">
          <input readOnly value="害虫名称：全部" className="h-11 rounded-md border border-slate-200 bg-slate-50 px-4 text-sm text-slate-500" />
          <input readOnly value="是否有虫：全部" className="h-11 rounded-md border border-slate-200 bg-slate-50 px-4 text-sm text-slate-500" />
          <input readOnly value="时间范围：2026-06-01 至 2026-06-05" className="h-11 rounded-md border border-slate-200 bg-slate-50 px-4 text-sm text-slate-500" />
          <button className="h-11 rounded-md bg-[#2f95ec] px-7 text-sm font-black text-white">查询</button>
          <button className="h-11 rounded-md border border-blue-300 px-7 text-sm font-black text-[#2f95ec]">重置</button>
        </div>
      </div>
      <div className="grid gap-5 md:grid-cols-4">
        {insectRows.map((row) => (
          <div key={row.id} className="overflow-hidden rounded-md border border-slate-200 bg-white shadow-sm">
            <div className="relative h-36 bg-[radial-gradient(circle_at_34%_40%,#334155_0_3px,transparent_4px),radial-gradient(circle_at_62%_58%,#78350f_0_4px,transparent_5px),linear-gradient(135deg,#ecfccb,#fef3c7)]">
              <span className="absolute left-3 top-3 rounded-full bg-slate-950/60 px-3 py-1 text-xs font-black text-white">{row.pest}</span>
            </div>
            <div className="space-y-2 p-4 text-sm text-slate-600">
              <p><b>时间：</b>{row.time}</p>
              <p><b>害虫总数：</b>{row.total} 头</p>
              <p><b>识别种数：</b>{row.species} 种</p>
              <button className="mt-2 w-full rounded-md border border-blue-300 py-2 font-black text-[#2f95ec]">查看详情</button>
            </div>
          </div>
        ))}
      </div>
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-md border border-slate-200 bg-white px-5 py-4 text-sm text-slate-500"><span>共 8430 条</span><span className="rounded-md border border-slate-200 px-3 py-2">10条/页</span><div className="flex items-center gap-2"><button className="rounded border px-2 py-1"><ChevronLeft className="h-4 w-4" /></button>{[1, 2, 3, 4, 5].map((page) => <button key={page} className={`rounded border px-3 py-1 ${page === 1 ? "bg-[#2f95ec] text-white" : "bg-white"}`}>{page}</button>)}<button className="rounded border px-2 py-1"><ChevronRight className="h-4 w-4" /></button><span>前往 1 页</span></div></div>
    </div>
  );
}

function CameraDetail({ device }: { device: DevicePoint }) {
  return (
    <div className="space-y-6">
      <DeviceInfoGrid device={device} />
      <div className="grid gap-5 lg:grid-cols-[1fr_280px]">
        <div className="overflow-hidden rounded-md border border-slate-800 bg-slate-950 shadow-2xl">
          <div className="relative h-[520px] bg-[radial-gradient(circle_at_24%_20%,rgba(255,255,255,.18),transparent_18%),linear-gradient(145deg,#17412f_0%,#1d5d3b_34%,#89a85d_35%,#72934f_48%,#2d6542_49%,#103827_100%)]">
            <div className="absolute inset-x-0 bottom-20 h-28 bg-[repeating-linear-gradient(100deg,rgba(254,240,138,.56)_0_8px,rgba(16,185,129,.25)_8px_16px)] opacity-80" />
            <div className="absolute right-4 top-4 rounded bg-slate-950/70 px-3 py-2 text-sm font-black text-white">2026-06-05 14:31:26</div>
            <div className="absolute left-4 top-4 rounded bg-slate-950/60 px-3 py-2 text-sm font-black text-cyan-100">{device.name}</div>
            <div className="absolute bottom-0 left-0 right-0 flex items-center justify-between bg-slate-950/88 px-5 py-4 text-white">
              <div className="flex items-center gap-4"><Play className="h-5 w-5" /><Pause className="h-5 w-5" /><Square className="h-5 w-5" /><Volume2 className="h-5 w-5" /><span className="rounded bg-white/10 px-3 py-1 text-xs font-black">高清</span><span className="rounded bg-white/10 px-3 py-1 text-xs font-black">1.0x</span></div>
              <div className="flex items-center gap-4"><Camera className="h-5 w-5" /><RefreshCw className="h-5 w-5" /><Maximize2 className="h-5 w-5" /></div>
            </div>
          </div>
        </div>
        <div className="rounded-md border border-blue-100 bg-white p-5">
          <h3 className="flex items-center gap-2 text-xl font-medium text-slate-800"><Camera className="h-5 w-5 text-[#2f95ec]" />云台控制</h3>
          <div className="mt-6 grid grid-cols-3 gap-3">
            {['↖', '↑', '↗', '←', '●', '→', '↙', '↓', '↘'].map((item) => <button key={item} className="grid h-14 place-items-center rounded-md border border-slate-200 bg-slate-50 text-xl font-black text-slate-600 hover:bg-blue-50">{item}</button>)}
          </div>
          <div className="mt-6 space-y-4 text-sm font-bold text-slate-600">
            <div><div className="mb-2 flex justify-between"><span>焦距</span><span>65%</span></div><div className="h-2 rounded-full bg-slate-100"><div className="h-full w-[65%] rounded-full bg-[#2f95ec]" /></div></div>
            <div><div className="mb-2 flex justify-between"><span>亮度</span><span>72%</span></div><div className="h-2 rounded-full bg-slate-100"><div className="h-full w-[72%] rounded-full bg-emerald-500" /></div></div>
            <div><div className="mb-2 flex justify-between"><span>巡航速度</span><span>中速</span></div><div className="h-2 rounded-full bg-slate-100"><div className="h-full w-1/2 rounded-full bg-orange-400" /></div></div>
          </div>
          <button className="mt-6 flex w-full items-center justify-center gap-2 rounded-md bg-[#2f95ec] px-5 py-3 text-sm font-black text-white"><Zap className="h-4 w-4" />开始巡航</button>
        </div>
      </div>
    </div>
  );
}

function DeviceDetailModal({ device, onClose }: { device: DevicePoint; onClose: () => void }) {
  const title = device.type === "摄像头" ? "摄像头详情" : device.type === "墒情设备" ? "墒情监测详情" : "虫情监测详情";
  return (
    <div className="fixed inset-0 z-[9999] flex items-start justify-center overflow-auto bg-slate-950/55 p-6 backdrop-blur-sm">
      <div className="my-4 w-full max-w-[1200px] overflow-hidden rounded-md bg-white shadow-2xl">
        <div className="flex items-center justify-between border-b border-blue-200 px-7 py-5">
          <div><h2 className="text-2xl font-medium text-slate-800">{title}</h2><p className="mt-1 text-sm font-bold text-slate-400">{device.name} · {device.value}</p></div>
          <button onClick={onClose} className="text-3xl font-light leading-none text-slate-400 hover:text-slate-700">×</button>
        </div>
        <div className="min-h-[560px] bg-[#f7fbff] p-7">
          {device.type === "墒情设备" && <MoistureDetail device={device} />}
          {device.type === "虫情设备" && <InsectDetail device={device} />}
          {device.type === "摄像头" && <CameraDetail device={device} />}
        </div>
      </div>
    </div>
  );
}

export default function SupervisionMap({ onBack }: SupervisionMapProps) {
  const [regionId, setRegionId] = useState("anhui");
  const [keyword, setKeyword] = useState("");
  const [searchText, setSearchText] = useState("");
  const [selectedProject, setSelectedProject] = useState<HighStandardProject | null>(highStandardProjects[0]);
  const [detailProject, setDetailProject] = useState<HighStandardProject | null>(null);
  const [detailDevice, setDetailDevice] = useState<DevicePoint | null>(null);
  const [detailTab, setDetailTab] = useState<DetailTab>("项目基本信息");
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

  const openProjectDetail = (project: HighStandardProject) => {
    setDetailTab("项目基本信息");
    setDetailProject(project);
  };

  return (
    <main className="min-h-screen bg-[#e9f1ea] text-slate-900">
      <div className="fixed inset-0 bg-[radial-gradient(circle_at_12%_8%,rgba(34,197,94,0.2),transparent_25%),radial-gradient(circle_at_84%_10%,rgba(14,165,233,0.16),transparent_28%),linear-gradient(180deg,#f4f8ef_0%,#e7f0e6_58%,#f5f0dd_100%)]" />
      <section className="relative mx-auto max-w-[1760px] px-6 py-6">
        <header className="flex flex-wrap items-center justify-between gap-4 rounded-[2rem] border border-white/80 bg-white/80 px-6 py-5 shadow-[0_18px_70px_rgba(18,61,47,0.08)] backdrop-blur-xl">
          <div className="flex items-center gap-4">
            <button onClick={onBack} className="grid h-12 w-12 place-items-center rounded-2xl bg-[#123d2f] text-white"><ArrowLeft className="h-5 w-5" /></button>
            <div><p className="text-sm font-black tracking-[0.28em] text-emerald-700">HIGH STANDARD FARMLAND GIS</p><h1 className="mt-1 text-3xl font-black text-[#123d2f]">高标准农田建设监管系统 · 一张图</h1></div>
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

          <SupervisionGisMap projects={projects} regionId={regionId} selectedProjectId={selectedProject?.id} layers={layers} onLayersChange={setLayers} onProjectSelect={setSelectedProject} onRegionDrill={setRegionId} onOpenProjectDetail={openProjectDetail} onOpenDeviceDetail={setDetailDevice} />

          <aside className="space-y-5">
            <ProjectPanel project={selectedProject} onOpenDetail={openProjectDetail} />
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

      {detailProject && <ProjectDetailModal project={detailProject} activeTab={detailTab} onTabChange={setDetailTab} onClose={() => setDetailProject(null)} />}
      {detailDevice && <DeviceDetailModal device={detailDevice} onClose={() => setDetailDevice(null)} />}
    </main>
  );
}
