export type SupplementaryStatus = "待鉴定" | "县级初验" | "市级复核" | "省级备案" | "整改中" | "已通过";
export type QualityGrade = "优等" | "良等" | "中等" | "一般";
export type SupplementaryLayers = {
  parcels: boolean;
  units: boolean;
  samples: boolean;
  quality: boolean;
  boundary: boolean;
};

export type SupplementaryParcel = {
  id: string;
  code: string;
  projectName: string;
  regionId: string;
  city: string;
  county: string;
  town: string;
  area: number;
  landType: "水田" | "水浇地" | "旱地";
  evaluationUnit: string;
  sampleCount: number;
  testResult: string;
  qualityGrade: QualityGrade;
  status: SupplementaryStatus;
  latLng: [number, number];
  path: Array<[number, number]>;
  unitPaths: Array<Array<[number, number]>>;
  samplePoints: Array<[number, number]>;
};

const meta: Array<[string, string, string, string, string, [number, number], QualityGrade, SupplementaryStatus]> = [
  ["changfeng", "合肥市", "长丰县", "双墩镇", "长丰县双墩镇补充耕地项目", [32.17, 117.2], "良等", "市级复核"],
  ["feidong", "合肥市", "肥东县", "店埠镇", "肥东县店埠镇占补平衡项目", [31.88, 117.48], "优等", "已通过"],
  ["feixi", "合肥市", "肥西县", "花岗镇", "肥西县花岗镇新增耕地项目", [31.7, 117.08], "中等", "县级初验"],
  ["yongqiao", "宿州市", "埇桥区", "夹沟镇", "埇桥区夹沟镇补充耕地项目", [33.72, 117.04], "良等", "整改中"],
  ["lingbi", "宿州市", "灵璧县", "禅堂镇", "灵璧县禅堂镇土地整治项目", [33.58, 117.56], "一般", "待鉴定"],
  ["yingzhou", "阜阳市", "颍州区", "三十里铺镇", "颍州区三十里铺镇补充耕地项目", [32.84, 115.86], "优等", "省级备案"],
  ["taihe", "阜阳市", "太和县", "赵集乡", "太和县赵集乡耕地质量提升项目", [33.15, 115.65], "良等", "已通过"],
];

export const supplementaryParcels: SupplementaryParcel[] = Array.from({ length: 28 }, (_, index) => {
  const item = meta[index % meta.length];
  const lat = item[5][0] + ((index % 4) - 1.5) * 0.022;
  const lng = item[5][1] + ((Math.floor(index / 4) % 4) - 1.5) * 0.026;
  const latLng: [number, number] = [Number(lat.toFixed(5)), Number(lng.toFixed(5))];
  const dLat = 0.012 + (index % 3) * 0.002;
  const dLng = 0.014 + (index % 4) * 0.002;
  const path: Array<[number, number]> = [
    [latLng[0] + dLat, latLng[1] - dLng],
    [latLng[0] + dLat * 0.72, latLng[1] + dLng * 0.8],
    [latLng[0] - dLat * 0.56, latLng[1] + dLng],
    [latLng[0] - dLat, latLng[1] - dLng * 0.35],
    [latLng[0] + dLat * 0.12, latLng[1] - dLng],
  ];
  const unitPaths = Array.from({ length: 4 }, (_, unitIndex) => {
    const cLat = latLng[0] + (unitIndex < 2 ? 0.45 : -0.45) * dLat;
    const cLng = latLng[1] + (unitIndex % 2 ? 0.45 : -0.45) * dLng;
    return [
      [Number((cLat + dLat * 0.38).toFixed(5)), Number((cLng - dLng * 0.38).toFixed(5))],
      [Number((cLat + dLat * 0.32).toFixed(5)), Number((cLng + dLng * 0.42).toFixed(5))],
      [Number((cLat - dLat * 0.36).toFixed(5)), Number((cLng + dLng * 0.36).toFixed(5))],
      [Number((cLat - dLat * 0.42).toFixed(5)), Number((cLng - dLng * 0.3).toFixed(5))],
    ] as Array<[number, number]>;
  });
  const samplePoints: Array<[number, number]> = Array.from({ length: 3 + (index % 4) }, (_, pointIndex) => [Number((latLng[0] + (pointIndex - 1.5) * dLat * 0.32).toFixed(5)), Number((latLng[1] + ((pointIndex % 3) - 1) * dLng * 0.32).toFixed(5))]);

  return {
    id: `supp-${index + 1}`,
    code: `BCGD-340000-${String(index + 1).padStart(5, "0")}`,
    projectName: item[4],
    regionId: item[0],
    city: item[1],
    county: item[2],
    town: item[3],
    area: Number((92 + index * 6.8 + (index % 5) * 2.4).toFixed(2)),
    landType: ["水田", "水浇地", "旱地"][index % 3] as SupplementaryParcel["landType"],
    evaluationUnit: `PJ-${item[0].toUpperCase()}-${String(100 + index)}`,
    sampleCount: samplePoints.length,
    testResult: `${item[6]}，有机质 ${(18 + index * 0.7).toFixed(1)}g/kg，pH ${(6.1 + (index % 6) * 0.12).toFixed(1)}`,
    qualityGrade: item[6],
    status: item[7],
    latLng,
    path,
    unitPaths,
    samplePoints,
  };
});

export const defaultSupplementaryLayers: SupplementaryLayers = {
  parcels: true,
  units: true,
  samples: true,
  quality: true,
  boundary: true,
};

export function supplementaryGradeColor(grade: QualityGrade) {
  if (grade === "优等") return "#16a34a";
  if (grade === "良等") return "#84cc16";
  if (grade === "中等") return "#f59e0b";
  return "#f97316";
}

export function filterSupplementaryParcels(regionId: string, keyword: string, grade: string, status: string) {
  return supplementaryParcels.filter((item) => {
    const regionMatch = regionId === "anhui" || item.regionId === regionId || (regionId === "hefei" && ["changfeng", "feidong", "feixi"].includes(item.regionId)) || (regionId === "suzhou" && ["yongqiao", "lingbi"].includes(item.regionId)) || (regionId === "fuyang" && ["yingzhou", "taihe"].includes(item.regionId));
    const keywordMatch = !keyword || item.projectName.includes(keyword) || item.code.includes(keyword) || item.county.includes(keyword);
    const gradeMatch = grade === "全部" || item.qualityGrade === grade;
    const statusMatch = status === "全部" || item.status === status;
    return regionMatch && keywordMatch && gradeMatch && statusMatch;
  });
}

export function buildSupplementaryStats(items: SupplementaryParcel[]) {
  const area = items.reduce((sum, item) => sum + item.area, 0);
  const passed = items.filter((item) => item.status === "已通过" || item.status === "省级备案").length;
  const samples = items.reduce((sum, item) => sum + item.sampleCount, 0);
  return {
    count: items.length,
    area: Number(area.toFixed(1)),
    passed,
    samples,
    passRate: items.length ? Number(((passed / items.length) * 100).toFixed(1)) : 0,
  };
}
