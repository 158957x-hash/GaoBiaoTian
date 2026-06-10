import { useMemo, useState } from "react";
import PermanentFarmland from "@/pages/PermanentFarmland";
import SupervisionMap from "@/pages/SupervisionMap";
import SupplementaryLand from "@/pages/SupplementaryLand";
import {
  BarChart3,
  Building2,
  ChevronRight,
  DatabaseZap,
  Layers3,
  LockKeyhole,
  Settings2,
  ShieldCheck,
  Sprout,
  UserRound,
} from "lucide-react";

type PortalProps = {
  onLogout: () => void;
  onOpenPermanent: () => void;
  onOpenSupervisionScreen: () => void;
  onOpenSupplementaryMap: () => void;
};

const systems = [
  { title: "高标准农田建设监管系统", desc: "保留原系统入口，演示时可在外部打开真实业务系统", icon: Building2, tone: "from-emerald-500 to-lime-400", badge: "原系统", count: "438", unit: "项目", action: "placeholder" },
  { title: "高标田一张图", desc: "直接进入高标准农田项目大屏和 GIS 一张图演示页面", icon: Layers3, tone: "from-sky-400 to-cyan-300", badge: "一张图", count: "438", unit: "项目", action: "supervisionScreen" },
  { title: "补充耕地验收管理系统", desc: "保留原系统入口，演示时可在外部打开真实业务系统", icon: Sprout, tone: "from-amber-400 to-orange-300", badge: "原系统", count: "12.8", unit: "万亩", action: "placeholder" },
  { title: "补充耕地一张图", desc: "直接进入补充耕地质量验收 GIS 一张图演示页面", icon: DatabaseZap, tone: "from-lime-400 to-emerald-300", badge: "一张图", count: "28", unit: "图斑", action: "supplementaryMap" },
  { title: "永久基本农田质量管理", desc: "质量等级评价、地块档案、一张图展示和高标田关联", icon: ShieldCheck, tone: "from-teal-400 to-cyan-300", badge: "质量保护", count: "36,218", unit: "图斑", action: "permanent" },
  { title: "系统管理", desc: "组织机构、角色权限、平台参数、运行日志与安全审计", icon: Settings2, tone: "from-slate-300 to-emerald-200", badge: "平台配置", count: "128", unit: "用户", action: "placeholder" },
];

const metrics = [
  { label: "监管耕地面积", value: "7,826", unit: "万亩" },
  { label: "在管建设项目", value: "438", unit: "个" },
  { label: "验收通过率", value: "96.8", unit: "%" },
  { label: "一张图图层", value: "32", unit: "类" },
];

const notices = ["高标田建设进度已同步至省级监管库", "补充耕地验收资料完整率持续提升", "永久基本农田质量监测专题图层已更新"];

function LoginView({ onLogin }: { onLogin: () => void }) {
  return (
    <main className="relative min-h-screen overflow-hidden bg-[#061A24] text-cyan-50">
      <div className="fixed inset-0 bg-[radial-gradient(circle_at_15%_10%,rgba(39,215,232,0.08),transparent_26%),radial-gradient(circle_at_82%_8%,rgba(103,214,110,0.06),transparent_28%),linear-gradient(135deg,#061A24_0%,#0A2530_48%,#061A24_100%)]" />
      <div className="fixed inset-0 opacity-[0.12] [background-image:linear-gradient(rgba(39,215,232,0.15)_1px,transparent_1px),linear-gradient(90deg,rgba(39,215,232,0.12)_1px,transparent_1px)] [background-size:44px_44px]" />
      <section className="relative mx-auto grid min-h-screen max-w-7xl grid-cols-1 items-center gap-10 px-6 py-10 lg:grid-cols-[1.12fr_0.88fr] lg:px-10">
        <div className="space-y-8">
          <div className="inline-flex items-center gap-3 rounded-full border border-[#27D7E8]/20 bg-[#0A2530] px-5 py-2 text-sm text-[#27D7E8] shadow-2xl">
            <DatabaseZap className="h-4 w-4 text-[#67D66E]" />
            安徽粮食 · 农田数字监管门户
          </div>
          <div className="max-w-3xl space-y-5">
            <h1 className="text-5xl font-bold leading-tight tracking-tight md:text-7xl">一屏统管<span className="block bg-gradient-to-r from-[#27D7E8] via-[#67D66E] to-[#35A7FF] bg-clip-text text-transparent">良田建设与保护</span></h1>
            <p className="max-w-2xl text-lg leading-8 text-cyan-100/60">汇聚高标准农田、补充耕地、永久基本农田质量与空间监管能力，为农田保护和项目监管提供统一入口。</p>
          </div>
          <div className="grid max-w-2xl grid-cols-3 gap-4">
            {metrics.slice(0, 3).map((item) => <div key={item.label} className="rounded-[10px] border border-[#27D7E8]/20 bg-[#0A2530] p-4"><div className="text-2xl font-bold text-[#27D7E8]">{item.value}</div><div className="mt-1 text-xs text-cyan-100/50">{item.label}</div></div>)}
          </div>
        </div>
        <div className="mx-auto w-full max-w-md rounded-[10px] border border-[#27D7E8]/20 bg-[#0A2530] p-7 shadow-2xl">
          <div className="mb-8 flex items-center justify-between"><div><p className="text-sm text-cyan-100/60">欢迎登录</p><h2 className="mt-1 text-2xl font-bold text-cyan-50">农田监管门户</h2></div><div className="grid h-12 w-12 place-items-center rounded-lg bg-[#27D7E8]/20 text-[#27D7E8] shadow-lg"><LockKeyhole className="h-6 w-6" /></div></div>
          <form className="space-y-5" onSubmit={(event) => { event.preventDefault(); onLogin(); }}>
            <label className="block"><span className="mb-2 block text-sm text-cyan-100/60">账号</span><div className="flex items-center gap-3 rounded-lg border border-[#27D7E8]/20 bg-[#061A24] px-4 py-3 focus-within:border-[#27D7E8]"><UserRound className="h-5 w-5 text-[#27D7E8]" /><input className="w-full bg-transparent text-cyan-50 outline-none" defaultValue="admin" /></div></label>
            <label className="block"><span className="mb-2 block text-sm text-cyan-100/60">密码</span><div className="flex items-center gap-3 rounded-lg border border-[#27D7E8]/20 bg-[#061A24] px-4 py-3 focus-within:border-[#27D7E8]"><LockKeyhole className="h-5 w-5 text-[#27D7E8]" /><input className="w-full bg-transparent text-cyan-50 outline-none" defaultValue="123456" type="password" /></div></label>
            <div className="flex items-center justify-between text-sm text-cyan-100/50"><label className="flex items-center gap-2"><input className="h-4 w-4 accent-[#27D7E8]" defaultChecked type="checkbox" />记住账号</label><span>政务专网访问</span></div>
            <button className="group flex w-full items-center justify-center gap-2 rounded-lg bg-[#27D7E8] px-5 py-4 font-semibold text-[#061A24] shadow-2xl transition hover:-translate-y-0.5">进入门户首页<ChevronRight className="h-5 w-5 transition group-hover:translate-x-1" /></button>
          </form>
        </div>
      </section>
    </main>
  );
}

function PortalHome({ onLogout, onOpenPermanent, onOpenSupervisionScreen, onOpenSupplementaryMap }: PortalProps) {
  const [toast, setToast] = useState("");
  const dateText = useMemo(() => new Intl.DateTimeFormat("zh-CN", { dateStyle: "full" }).format(new Date()), []);
  const openPlaceholder = (name: string) => { setToast(`${name} 暂未建设二级页面`); window.setTimeout(() => setToast(""), 1800); };

  return (
    <main className="min-h-screen overflow-hidden bg-[#061A24] text-cyan-50">
      <div className="fixed inset-0 bg-[radial-gradient(circle_at_15%_10%,rgba(39,215,232,0.08),transparent_26%),radial-gradient(circle_at_82%_8%,rgba(103,214,110,0.06),transparent_28%),linear-gradient(135deg,#061A24_0%,#0A2530_48%,#061A24_100%)]" />
      <div className="fixed inset-0 opacity-[0.12] [background-image:linear-gradient(rgba(39,215,232,0.15)_1px,transparent_1px),linear-gradient(90deg,rgba(39,215,232,0.12)_1px,transparent_1px)] [background-size:44px_44px]" />
      <section className="relative mx-auto max-w-[1480px] p-5">
        <header className="flex items-center justify-between rounded-[10px] border border-[#27D7E8]/20 bg-[#0A2530] px-6 py-4 shadow-lg">
          <div className="flex items-center gap-5">
            <div className="grid h-14 w-14 place-items-center rounded-lg bg-[#27D7E8]/20 text-[#27D7E8] shadow-lg"><Layers3 className="h-7 w-7" /></div>
            <div><p className="text-[12px] font-semibold tracking-[0.2em] text-[#27D7E8]">ANHUI FARMLAND SUPERVISION</p><h1 className="mt-1 text-[32px] font-bold text-cyan-50">安徽粮食农田综合监管门户</h1></div>
          </div>
          <div className="flex items-center gap-4"><div className="text-right"><p className="text-sm font-semibold text-cyan-50">省级监管中心</p><p className="text-xs text-cyan-100/50">{dateText}</p></div><button onClick={onLogout} className="rounded-lg bg-[#27D7E8] px-5 py-2.5 text-sm font-semibold text-[#061A24] transition hover:bg-[#35A7FF]">退出登录</button></div>
        </header>

        <section className="mt-5 grid gap-5 xl:grid-cols-[1.1fr_0.9fr]">
          <div className="relative overflow-hidden rounded-[10px] border border-[#27D7E8]/20 bg-[#0A2530] p-6 shadow-lg">
            <div className="absolute right-0 top-0 h-full w-1/2 bg-[radial-gradient(circle_at_70%_35%,rgba(39,215,232,0.1),transparent_28%),linear-gradient(135deg,transparent,rgba(255,255,255,0.04))]" />
            <div className="relative max-w-3xl"><p className="inline-flex rounded-full border border-[#27D7E8]/20 bg-[#0A2530] px-4 py-2 text-sm font-semibold text-[#27D7E8]">耕地保护 · 建设监管 · 质量评价 · 空间一张图</p><h2 className="mt-5 text-4xl font-bold leading-tight text-cyan-50">统筹农田建设、保护、验收与质量档案</h2><p className="mt-4 max-w-2xl leading-7 text-cyan-100/60">围绕粮食安全和耕地保护目标，整合业务系统入口、监管指标、空间图层和运行动态，形成统一的农田监管工作台。</p></div>
            <div className="relative mt-6 grid grid-cols-4 gap-4">{metrics.map((item) => <div key={item.label} className="rounded-[10px] border border-[#27D7E8]/20 bg-[#0A2530] p-4"><div className="flex items-end gap-1"><span className="text-3xl font-bold text-[#27D7E8]">{item.value}</span><span className="pb-1 text-xs text-cyan-100/50">{item.unit}</span></div><p className="mt-2 text-sm text-cyan-100/60">{item.label}</p></div>)}</div>
          </div>
          <div className="grid gap-4 rounded-[10px] border border-[#27D7E8]/20 bg-[#0A2530] p-5 shadow-lg">
            <div className="flex items-center justify-between"><div><p className="text-[13px] font-semibold text-[#27D7E8]">监管动态</p><h3 className="text-xl font-bold text-cyan-50">今日运行概览</h3></div><BarChart3 className="h-7 w-7 text-[#27D7E8]" /></div>
            {notices.map((notice, index) => <div key={notice} className="flex gap-4 rounded-lg bg-white/[0.02] p-4"><span className="grid h-8 w-8 shrink-0 place-items-center rounded-lg bg-[#27D7E8]/20 text-sm font-semibold text-[#27D7E8]">0{index + 1}</span><div><p className="font-semibold text-cyan-50">{notice}</p><p className="mt-1 text-xs text-cyan-100/50">数据校核完成，已进入工作台待办队列</p></div></div>)}
          </div>
        </section>

        <section className="mt-5 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {systems.map((system) => {
            const Icon = system.icon;
            return (
              <button key={system.title} onClick={() => { if (system.action === "supervisionScreen") { onOpenSupervisionScreen(); return; } if (system.action === "supplementaryMap") { onOpenSupplementaryMap(); return; } if (system.action === "permanent") { onOpenPermanent(); return; } openPlaceholder(system.title); }} className="group relative overflow-hidden rounded-[10px] border border-[#27D7E8]/20 bg-[#0A2530] p-5 text-left shadow-lg transition hover:-translate-y-1 hover:shadow-xl">
                <div className={`absolute -right-8 -top-10 h-28 w-28 rounded-full bg-gradient-to-br ${system.tone} opacity-20 transition group-hover:scale-125`} />
                <div className="relative flex items-center justify-between"><div className={`grid h-11 w-11 place-items-center rounded-lg bg-gradient-to-br ${system.tone} text-[#061A24] shadow-md`}><Icon className="h-6 w-6" /></div><span className="rounded-full bg-white/[0.04] px-3 py-1 text-xs font-semibold text-cyan-100/70">{system.badge}</span></div>
                <h3 className="relative mt-4 min-h-12 text-lg font-bold leading-snug text-cyan-50">{system.title}</h3>
                <p className="relative mt-2 min-h-14 text-sm leading-6 text-cyan-100/50">{system.desc}</p>
                <div className="relative mt-4 flex items-end justify-between border-t border-[#27D7E8]/10 pt-3"><div><span className="text-2xl font-bold text-[#27D7E8]">{system.count}</span><span className="ml-1 text-xs text-cyan-100/50">{system.unit}</span></div><span className="flex items-center gap-1 text-sm font-semibold text-[#27D7E8]">进入<ChevronRight className="h-4 w-4 transition group-hover:translate-x-1" /></span></div>
              </button>
            );
          })}
        </section>
      </section>
      {toast && <div className="fixed bottom-8 left-1/2 z-50 -translate-x-1/2 rounded-full bg-[#27D7E8] px-6 py-3 text-sm font-semibold text-[#061A24] shadow-2xl">{toast}</div>}
    </main>
  );
}

export default function Home() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [activeSystem, setActiveSystem] = useState<"portal" | "permanent" | "supervisionScreen" | "supplementaryMap">("portal");

  if (!isLoggedIn) return <LoginView onLogin={() => setIsLoggedIn(true)} />;
  if (activeSystem === "permanent") return <PermanentFarmland onBack={() => setActiveSystem("portal")} />;
  if (activeSystem === "supervisionScreen") return <SupervisionMap onBack={() => setActiveSystem("portal")} initialView="screen" />;
  if (activeSystem === "supplementaryMap") return <SupplementaryLand onBack={() => setActiveSystem("portal")} initialView="map" />;
  return <PortalHome onLogout={() => setIsLoggedIn(false)} onOpenPermanent={() => setActiveSystem("permanent")} onOpenSupervisionScreen={() => setActiveSystem("supervisionScreen")} onOpenSupplementaryMap={() => setActiveSystem("supplementaryMap")} />;
}
