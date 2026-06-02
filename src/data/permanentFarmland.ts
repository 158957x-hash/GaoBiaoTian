export type RegionLevel = "province" | "city" | "county";
export type LandType = "水田" | "水浇地" | "旱地";
export type ArchiveStatus = "已建档" | "待完善" | "调整中" | "已调出";

export type Region = {
  id: string;
  name: string;
  level: RegionLevel;
  parentId?: string;
};

export type Plot = {
  id: string;
  plotNo: string;
  blockNo: string;
  regionId: string;
  city: string;
  county: string;
  town: string;
  village: string;
  area: number;
  landType: LandType;
  qualityLevel: number;
  isHighStandard: boolean;
  projectName: string;
  archiveStatus: ArchiveStatus;
  updatedAt: string;
  points: string;
  center: { x: number; y: number };
  soilType: string;
  organicMatter: string;
  phosphorus: string;
  potassium: string;
  ph: string;
};

export type Filters = {
  regionId: string;
  year: string;
  qualityLevel: string;
  landType: string;
  highStandard: string;
  archiveStatus: string;
  keyword: string;
};

export const regions: Region[] = [
  { id: "anhui", name: "安徽省", level: "province" },
  { id: "hefei", name: "合肥市", level: "city", parentId: "anhui" },
  { id: "suzhou", name: "宿州市", level: "city", parentId: "anhui" },
  { id: "fuyang", name: "阜阳市", level: "city", parentId: "anhui" },
  { id: "changfeng", name: "长丰县", level: "county", parentId: "hefei" },
  { id: "feidong", name: "肥东县", level: "county", parentId: "hefei" },
  { id: "feixi", name: "肥西县", level: "county", parentId: "hefei" },
  { id: "yongqiao", name: "埇桥区", level: "county", parentId: "suzhou" },
  { id: "lingbi", name: "灵璧县", level: "county", parentId: "suzhou" },
  { id: "yingzhou", name: "颍州区", level: "county", parentId: "fuyang" },
  { id: "taihe", name: "太和县", level: "county", parentId: "fuyang" },
];

const countyMeta = [
  ["changfeng", "合肥市", "长丰县", "双墩镇"],
  ["feidong", "合肥市", "肥东县", "店埠镇"],
  ["feixi", "合肥市", "肥西县", "上派镇"],
  ["yongqiao", "宿州市", "埇桥区", "夹沟镇"],
  ["lingbi", "宿州市", "灵璧县", "韦集镇"],
  ["yingzhou", "阜阳市", "颍州区", "三十里铺镇"],
  ["taihe", "阜阳市", "太和县", "旧县镇"],
];

const landTypes: LandType[] = ["水田", "水浇地", "旱地"];
const statuses: ArchiveStatus[] = ["已建档", "待完善", "调整中", "已调出"];
const soils = ["水稻土", "潮土", "黄棕壤", "砂姜黑土"];

export const plots: Plot[] = Array.from({ length: 42 }, (_, index) => {
  const [regionId, city, county, town] = countyMeta[index % countyMeta.length];
  const col = index % 7;
  const row = Math.floor(index / 7);
  const x = 70 + col * 112 + (row % 2) * 18;
  const y = 70 + row * 78 + (col % 3) * 9;
  const width = 62 + (index % 4) * 9;
  const height = 40 + (index % 5) * 7;
  const level = (index % 10) + 1;
  const isHighStandard = index % 3 !== 1;
  const status = statuses[index % statuses.length];
  const no = `${String(index + 1).padStart(6, "0")}`;

  return {
    id: `plot-${index + 1}`,
    plotNo: `TB-340121-${String(4582 + index).padStart(6, "0")}`,
    blockNo: `YJJBNT-340121-${no}`,
    regionId,
    city,
    county,
    town,
    village: `${["新民村", "丰乐村", "良田村", "稻香村"][index % 4]}`,
    area: Number((38 + (index % 11) * 7.26 + row * 1.7).toFixed(2)),
    landType: landTypes[index % landTypes.length],
    qualityLevel: level,
    isHighStandard,
    projectName: isHighStandard ? `2024 年${county}高标准农田建设项目` : "未关联高标田项目",
    archiveStatus: status,
    updatedAt: `2026-05-${String(10 + (index % 19)).padStart(2, "0")}`,
    points: `${x},${y} ${x + width},${y + 8} ${x + width - 10},${y + height} ${x + 14},${y + height + 10}`,
    center: { x: x + width / 2, y: y + height / 2 },
    soilType: soils[index % soils.length],
    organicMatter: `${(22 + (index % 9) * 1.4).toFixed(1)} g/kg`,
    phosphorus: `${(12 + (index % 8) * 1.6).toFixed(1)} mg/kg`,
    potassium: `${108 + (index % 10) * 9} mg/kg`,
    ph: `${(6.2 + (index % 6) * 0.16).toFixed(1)}`,
  };
});

export const defaultFilters: Filters = {
  regionId: "anhui",
  year: "2026",
  qualityLevel: "全部",
  landType: "全部",
  highStandard: "全部",
  archiveStatus: "全部",
  keyword: "",
};

export function getRegionName(regionId: string) {
  return regions.find((item) => item.id === regionId)?.name ?? "安徽省";
}

export function getChildRegions(regionId: string) {
  return regions.filter((item) => item.parentId === regionId);
}

export function getRegionTrail(regionId: string) {
  const current = regions.find((item) => item.id === regionId);
  if (!current) return [regions[0]];
  if (!current.parentId) return [current];
  const parent = regions.find((item) => item.id === current.parentId);
  if (!parent?.parentId) return parent ? [parent, current] : [current];
  const grand = regions.find((item) => item.id === parent.parentId);
  return [grand, parent, current].filter(Boolean) as Region[];
}

export function getParentRegion(regionId: string) {
  const current = regions.find((item) => item.id === regionId);
  return current?.parentId ?? regionId;
}

export function filterPlots(filters: Filters) {
  const region = regions.find((item) => item.id === filters.regionId);
  const childIds = getChildRegions(filters.regionId).map((item) => item.id);
  const countyIds = region?.level === "city" ? getChildRegions(filters.regionId).map((item) => item.id) : childIds;

  return plots.filter((plot) => {
    const regionMatch =
      filters.regionId === "anhui" || plot.regionId === filters.regionId || (region?.level === "city" && countyIds.includes(plot.regionId));
    const levelMatch = filters.qualityLevel === "全部" || `${plot.qualityLevel}等` === filters.qualityLevel;
    const landMatch = filters.landType === "全部" || plot.landType === filters.landType;
    const highMatch = filters.highStandard === "全部" || (filters.highStandard === "已建高标田" ? plot.isHighStandard : !plot.isHighStandard);
    const statusMatch = filters.archiveStatus === "全部" || plot.archiveStatus === filters.archiveStatus;
    const keywordMatch = !filters.keyword || plot.blockNo.includes(filters.keyword) || plot.county.includes(filters.keyword);
    return regionMatch && levelMatch && landMatch && highMatch && statusMatch && keywordMatch;
  });
}

export function qualityColor(level: number) {
  if (level <= 3) return "#15803d";
  if (level <= 6) return "#65a30d";
  if (level <= 8) return "#facc15";
  return "#f97316";
}

export function buildStats(items: Plot[]) {
  const area = items.reduce((sum, item) => sum + item.area, 0);
  const archived = items.filter((item) => item.archiveStatus === "已建档").length;
  const highArea = items.filter((item) => item.isHighStandard).reduce((sum, item) => sum + item.area, 0);
  const pending = items.filter((item) => item.archiveStatus === "待完善").length;
  const average = items.length ? items.reduce((sum, item) => sum + item.qualityLevel, 0) / items.length : 0;
  return {
    area: Number(area.toFixed(1)),
    count: items.length,
    archived,
    average: Number(average.toFixed(1)),
    highArea: Number(highArea.toFixed(1)),
    pending,
  };
}

export function qualityGroups(items: Plot[]) {
  const groups = [
    { label: "1-3 等", value: 0, color: "#15803d" },
    { label: "4-6 等", value: 0, color: "#65a30d" },
    { label: "7-8 等", value: 0, color: "#facc15" },
    { label: "9-10 等", value: 0, color: "#f97316" },
  ];
  items.forEach((item) => {
    const index = item.qualityLevel <= 3 ? 0 : item.qualityLevel <= 6 ? 1 : item.qualityLevel <= 8 ? 2 : 3;
    groups[index].value += item.area;
  });
  return groups.map((item) => ({ ...item, value: Number(item.value.toFixed(1)) }));
}

export function statusGroups(items: Plot[]) {
  return statuses.map((status) => ({ label: status, value: items.filter((item) => item.archiveStatus === status).length }));
}

export function countyRanking(items: Plot[]) {
  const map = new Map<string, number>();
  items.forEach((item) => map.set(item.county, (map.get(item.county) ?? 0) + item.area));
  return Array.from(map.entries())
    .map(([label, value]) => ({ label, value: Number(value.toFixed(1)) }))
    .sort((a, b) => b.value - a.value)
    .slice(0, 5);
}
