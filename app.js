const canvas = document.querySelector("#photoCanvas");
const ctx = canvas.getContext("2d", { willReadFrequently: true });
const welcomePanel = document.querySelector("#welcomePanel");
const startWelcomeButton = document.querySelector("#startWelcomeButton");
const welcomeStats = {
  today: document.querySelector("#todayCheckCount"),
  monthly: document.querySelector("#monthlyImproveCount"),
  stability: document.querySelector("#stabilityLiftRate"),
};
const SKIN_ENERGY_HISTORY_KEY = "fascineSkinEnergyHistory";
const imageInput = document.querySelector("#imageInput");
const cameraInput = document.querySelector("#cameraInput");
const uploadActions = document.querySelector(".upload-actions");
const uploadStatus = document.querySelector("#uploadStatus");
const photoPanel = document.querySelector(".photo-panel");
const emptyState = document.querySelector("#emptyState");
const autoAlignButton = document.querySelector("#autoAlignButton");
const copyReportButton = document.querySelector("#copyReportButton");
const viewResultButton = document.querySelector("#viewResultButton");
const retakeButton = document.querySelector("#retakeButton");
const analysisProgress = document.querySelector("#analysisProgress");
const stageTransition = document.querySelector("#stageTransition");
const stageTitle = document.querySelector("#stageTitle");
const stageSteps = document.querySelector("#stageSteps");
const consultationForm = document.querySelector("#consultationForm");
const startAnalysisButton = document.querySelector("#startAnalysisButton");
const backToPhotoButton = document.querySelector("#backToPhotoButton");
const journeyStepButton = document.querySelector(".journey-step");
const journeyStepCount = document.querySelector("#journeyStepCount");
const journeyStepTitle = document.querySelector("#journeyStepTitle");
const journeyStepHint = document.querySelector("#journeyStepHint");
const journeyProgressBar = document.querySelector("#journeyProgressBar");
const cameraModal = document.querySelector("#cameraModal");
const cameraPreview = document.querySelector("#cameraPreview");
const cameraStatus = document.querySelector("#cameraStatus");
const closeCameraButton = document.querySelector("#closeCameraButton");
const captureButton = document.querySelector("#captureButton");
const fallbackUploadButton = document.querySelector("#fallbackUploadButton");
const alignmentInputs = {
  x: document.querySelector("#faceX"),
  y: document.querySelector("#faceY"),
  width: document.querySelector("#faceWidth"),
  height: document.querySelector("#faceHeight"),
};

let loadedImage = null;
let imageBounds = { x: 0, y: 0, width: canvas.width, height: canvas.height };
let isDraggingGuide = false;
let isDraggingPhoto = false;
let pendingPhotoDrag = false;
let dragOffset = { x: 0, y: 0 };
let photoDragStart = { x: 0, y: 0, offsetX: 0, offsetY: 0 };
let lastResult = null;
let lastRoutine = [];
let lastRecommendedProducts = [];
let cameraStream = null;
let lastPhotoSource = "upload";
let journeyStep = "welcome";
let customerProfile = null;
let isStageTransitioning = false;
let currentRoutineMode = "day";
const journeyCopy = {
  welcome: {
    count: "Skin Coach",
    title: "肌膚對話室",
    hint: "先放慢一點，聽聽肌膚最近想告訴妳什麼。",
    progress: 0,
  },
  capture: {
    count: "Step 01 / 05",
    title: "臉部拍攝",
    hint: "請拍照或上傳您的正面清晰照片，讓 AI 顧問為您深度分析膚況。",
    progress: 20,
  },
  consult: {
    count: "Step 02 / 05",
    title: "Skin Consultation",
    hint: "AI 顧問會綜合日常習慣與影像分析，整理專屬保養提案。",
    progress: 40,
  },
  analyze: {
    count: "AI 分析中",
    title: "正在分析肌膚狀態",
    hint: "正在整合妳的問答內容、照片光線與臉部觀察資料。",
    progress: 52,
  },
  result: {
    count: "Step 03 / 05",
    title: "AI 顧問檢測報告",
    hint: "先理解肌膚正在表達什麼，再查看分數與保養方向。",
    progress: 60,
  },
  routine: {
    count: "Step 04 / 05",
    title: "保養建議",
    hint: "切換日間防禦與夜間修護，查看 FASCINÉ 使用順序。",
    progress: 80,
  },
  shop: {
    count: "Step 05 / 05",
    title: "專屬改善方案",
    hint: "依照水潤、透亮、穩定與平衡中較需要照顧的狀態，排序適合優先查看的產品。",
    progress: 100,
  },
};
const faceGuide = {
  x: 50,
  y: 51,
  width: 29,
  height: 38,
};
const defaultFaceGuide = { ...faceGuide };
const photoAdjust = {
  x: 0,
  y: 0,
  zoom: 100,
};

const fields = {
  overallScore: document.querySelector("#overallScore"),
  overallBar: document.querySelector("#overallBar"),
  hydrationScore: document.querySelector("#hydrationScore"),
  hydrationNote: document.querySelector("#hydrationNote"),
  evennessScore: document.querySelector("#evennessScore"),
  evennessNote: document.querySelector("#evennessNote"),
  rednessScore: document.querySelector("#rednessScore"),
  rednessNote: document.querySelector("#rednessNote"),
  shineScore: document.querySelector("#shineScore"),
  shineNote: document.querySelector("#shineNote"),
  hydrationSignal: document.querySelector("#hydrationSignal"),
  evennessSignal: document.querySelector("#evennessSignal"),
  rednessSignal: document.querySelector("#rednessSignal"),
  shineSignal: document.querySelector("#shineSignal"),
  analysisFacePreview: document.querySelector("#analysisFacePreview"),
  scanFacePhoto: document.querySelector(".scan-face-photo"),
  faceMesh: document.querySelector("#faceMesh"),
  skinFingerprint: document.querySelector("#skinFingerprint"),
  ageBenchmark: document.querySelector("#ageBenchmark"),
  summaryList: document.querySelector("#summaryList"),
  sampleMode: document.querySelector("#sampleMode"),
  facePosition: document.querySelector("#facePosition"),
  lightingStatus: document.querySelector("#lightingStatus"),
  colorVariance: document.querySelector("#colorVariance"),
  highlightRatio: document.querySelector("#highlightRatio"),
  routineList: document.querySelector("#routineList"),
  shopProfile: document.querySelector("#shopProfile"),
  shoppingList: document.querySelector("#shoppingList"),
  coachLetter: document.querySelector("#coachLetter"),
  growthSystem: document.querySelector("#growthSystem"),
};

const clamp = (value, min = 0, max = 100) => Math.max(min, Math.min(max, value));
const scoreText = (score) => Math.round(clamp(score)).toString();
const scoreOutOf = (score) => `${scoreText(score)}/100`;
const scoreStatus = (score) => {
  if (score >= 78) return "穩定維持";
  if (score >= 62) return "可微調";
  if (score >= 52) return "建議加強";
  return "優先照顧";
};
const pct = (value) => `${Math.round(clamp(value))}%`;
const displayScore = (score) => {
  const value = clamp(score, 1, 99);
  return clamp(50 + Math.sqrt(value / 99) * 36 + value * 0.08, 52, 96);
};

function setJourneyStep(step, panel = null) {
  journeyStep = step;
  document.body.dataset.journeyStep = step;
  if (welcomePanel) welcomePanel.hidden = step !== "welcome";
  analysisProgress.hidden = step !== "analyze";
  if (step !== "analyze") stageTransition.hidden = true;
  const copy = journeyCopy[step] || journeyCopy.capture;
  journeyStepButton.dataset.journeyTarget = step === "shop" ? "shop" : step;
  journeyStepCount.textContent = copy.count;
  journeyStepTitle.textContent = copy.title;
  journeyStepHint.textContent = copy.hint;
  journeyProgressBar.style.width = `${copy.progress}%`;

  if (panel) activatePanel(panel);
  window.scrollTo({ top: 0, behavior: "smooth" });
}

function seededNumber(seed) {
  let value = seed;
  value = (value ^ 61) ^ (value >>> 16);
  value += value << 3;
  value ^= value >>> 4;
  value *= 0x27d4eb2d;
  value ^= value >>> 15;
  return Math.abs(value);
}

function formatNumber(value) {
  return Math.round(value).toLocaleString("zh-TW");
}

function updateWelcomeStats() {
  if (!welcomeStats.today || !welcomeStats.monthly || !welcomeStats.stability) return;

  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");
  const daySeed = Number(`${year}${month}${day}`);
  const monthSeed = Number(`${year}${month}`);
  const dateIndex = now.getDate();
  const dayOfYear = Math.floor((now - new Date(year, 0, 0)) / 86400000);
  const dailyCountFor = (dayIndex, includeTodayProgress = false) => {
    const loopDay = String(dayIndex).padStart(2, "0");
    const loopSeed = Number(`${year}${month}${loopDay}`);
    const monthlyLift = Math.min(9, Math.floor((dayIndex - 1) * 0.5));
    const dayVariation = seededNumber(loopSeed + 37) % 6;
    const hourLift = includeTodayProgress ? Math.min(6, Math.floor(now.getHours() / 4)) : 6;
    return clamp(10 + monthlyLift + dayVariation + hourLift, 10, 29);
  };
  const today = dailyCountFor(dateIndex, true);
  const monthBase = 88 + (seededNumber(monthSeed + 11) % 12);
  let monthly = monthBase;
  for (let dayIndex = 1; dayIndex <= dateIndex; dayIndex += 1) {
    monthly += dailyCountFor(dayIndex, dayIndex === dateIndex);
  }
  const stability = 93 + (seededNumber(daySeed + dayOfYear) % 4);

  welcomeStats.today.textContent = formatNumber(today);
  welcomeStats.monthly.textContent = formatNumber(monthly);
  welcomeStats.stability.textContent = formatNumber(clamp(stability, 93, 96));
}

function sleep(ms) {
  return new Promise((resolve) => window.setTimeout(resolve, ms));
}

async function showStageTransition({ title, steps, duration = 1050, mode = "face" }) {
  if (isStageTransitioning) return;
  isStageTransitioning = true;
  stageTitle.textContent = title;
  stageSteps.innerHTML = steps.map((step) => `<li>${step}</li>`).join("");
  stageTransition.dataset.mode = mode;
  document.body.classList.add("is-processing");
  stageTransition.hidden = false;
  stageTransition.classList.remove("is-leaving");
  window.scrollTo({ top: 0, behavior: "smooth" });
  await sleep(duration);
  stageTransition.classList.add("is-leaving");
  await sleep(180);
  stageTransition.hidden = true;
  delete stageTransition.dataset.mode;
  stageTransition.classList.remove("is-leaving");
  document.body.classList.remove("is-processing");
  isStageTransitioning = false;
}

async function transitionToStep(step, panel, transition) {
  if (isStageTransitioning) return;
  if (transition) {
    await showStageTransition(transition);
  }
  setJourneyStep(step, panel);
}

function activatePanel(panelName) {
  document.querySelectorAll(".tab").forEach((item) => item.classList.toggle("active", item.dataset.panel === panelName));
  document.querySelectorAll(".panel").forEach((panel) => panel.classList.toggle("active", panel.id === panelName));
}

function reset() {
  loadedImage = null;
  lastResult = null;
  lastRoutine = [];
  lastRecommendedProducts = [];
  customerProfile = null;
  currentRoutineMode = "day";
  resetFaceGuide();
  resetPhotoAdjust();
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  emptyState.hidden = false;
  imageInput.value = "";
  cameraInput.value = "";
  consultationForm.reset();
  updateStartAnalysisState();
  if (copyReportButton) {
    copyReportButton.disabled = true;
    copyReportButton.textContent = "儲存我的建議";
  }
  setUploadStatus("照片只會在本頁進行分析，不會被上傳或儲存。");
  for (const key of ["overallScore", "hydrationScore", "evennessScore", "rednessScore", "shineScore"]) {
    fields[key].textContent = "--";
  }
  fields.overallBar.style.width = "0%";
  fields.hydrationNote.textContent = "等待檢測";
  fields.evennessNote.textContent = "等待檢測";
  fields.rednessNote.textContent = "等待檢測";
  fields.shineNote.textContent = "等待檢測";
  fields.hydrationSignal.style.width = "8%";
  fields.evennessSignal.style.width = "8%";
  fields.rednessSignal.style.width = "8%";
  fields.shineSignal.style.width = "8%";
  [fields.hydrationSignal, fields.evennessSignal, fields.rednessSignal, fields.shineSignal].forEach((field) => {
    field.dataset.score = "--/100";
  });
  fields.analysisFacePreview.removeAttribute("src");
  fields.scanFacePhoto.src = "assets/scan-face-woman.png";
  renderAlignedFaceMesh(null);
  fields.skinFingerprint.innerHTML = "<span>AI 臉部膚況辨識</span><strong>等待檢測</strong><p>完成檢測後，會整理你目前偏向的肌膚狀態與保養主軸。</p>";
  fields.coachLetter.innerHTML = "<span>AI 顧問給妳的一封信</span><p>完成檢測後，這裡會整理一段專屬於妳的肌膚照護提醒。</p>";
  fields.growthSystem.innerHTML = "<span>Skin Score Journey</span><strong>等待建立肌膚分數等級</strong><p>完成檢測後，會顯示目前分數、下一等級距離與建議補強節奏。僅記錄上次分數作為本機參考，不儲存照片。</p>";
  fields.ageBenchmark.innerHTML = "<span>同齡分數參考</span><strong>等待年齡資料</strong><p>完成膚況問答後，這裡會顯示同年齡層建議維持的分數區間。</p>";
  fields.summaryList.innerHTML = "<p>完成檢測後，這裡會顯示你的主要肌膚觀察與保養方向。</p>";
  fields.sampleMode.textContent = "上傳照片後，這裡會觀察肌膚的水潤與細緻感。";
  fields.facePosition.textContent = "上傳照片後，這裡會說明這次主要讀取的臉部區域。";
  fields.lightingStatus.textContent = "上傳照片後，這裡會提醒光線是否影響結果。";
  fields.colorVariance.textContent = "上傳照片後，這裡會觀察膚色均勻與透亮感。";
  fields.highlightRatio.textContent = "上傳照片後，這裡會整理泛紅、油光與妝前狀態。";
  fields.routineList.innerHTML = "<p>完成檢測後，這裡會提供適合妳的 FASCINÉ 梵希婗日間防禦與夜間修護流程。</p>";
  fields.shopProfile.innerHTML = "<strong>等待肌膚分數檢測</strong><p>完成檢測後，這裡會整理本次適合優先補強的改善建議。</p>";
  fields.shoppingList.innerHTML = "<p>完成檢測後，這裡會出現依膚況排序的產品建議。</p>";
  viewResultButton.disabled = true;
  viewResultButton.textContent = "下一步：膚況諮詢";
  activatePanel("summary");
  setJourneyStep("welcome");
}

function stopCamera() {
  if (cameraStream) {
    cameraStream.getTracks().forEach((track) => track.stop());
  }
  cameraStream = null;
  cameraPreview.srcObject = null;
  cameraModal.hidden = true;
}

function setUploadStatus(message, type = "neutral") {
  uploadStatus.textContent = message;
  uploadStatus.classList.toggle("is-error", type === "error");
  uploadActions.classList.toggle("is-error", type === "error");
}

const consultationLabels = {
  lifeFactor: {
    sleep: "睡不飽",
    stress: "壓力大",
    busy: "工作忙",
    diet: "飲食不規律",
    ac: "經常吹冷氣",
    selfcare: "最近很少照顧自己",
  },
  ageRange: {
    under20: "20 歲以下",
    "20s": "20-29 歲",
    "30s": "30-39 歲",
    "40s": "40-49 歲",
    "50up": "50 歲以上",
  },
  skinConcern: {
    hydration: "乾燥粗糙與緊繃",
    evenness: "黯沉蠟黃與疲態",
    redness: "泛紅不適與敏弱",
    shine: "油光泛濫與痘痘",
    texture: "毛孔粗大與粗糙",
    fineLines: "細紋與缺乏彈性",
  },
  routineHabit: {
    minimal: "極簡清潔",
    basic: "基礎保濕",
    complete: "進階護理",
    antioxidant: "高效抗氧",
    clinical: "醫美或機能保養",
  },
  skinScenario: {
    bare: "素顏精緻感",
    stress: "告別壓力肌",
    season: "提升防護力",
    ageing: "視覺逆齡感",
    makeup: "持效完美度",
  },
  routinePace: {
    simple: "3步內極簡保養",
    daily: "早晚基礎保養",
    intensive: "加強保養",
    completeCare: "全方位護膚",
    flexible: "視當天膚況調整",
  },
};

function selectedRadioValue(name) {
  return consultationForm.querySelector(`input[name="${name}"]:checked`)?.value || "";
}

function selectedCheckboxValues(name) {
  return [...consultationForm.querySelectorAll(`input[name="${name}"]:checked`)].map((input) => input.value);
}

function hasConcern(value) {
  return Boolean(customerProfile?.concernValues?.includes(value) || customerProfile?.concernValue === value);
}

function hasLifeFactor(value) {
  return Boolean(customerProfile?.lifeValues?.includes(value));
}

function hasScenario(value) {
  return Boolean(customerProfile?.skinScenarioValues?.includes(value) || customerProfile?.skinScenarioValue === value);
}

function collectCustomerProfile() {
  const ageValue = selectedRadioValue("ageRange") || "20s";
  const lifeValues = selectedCheckboxValues("lifeFactor");
  const lifeLabels = lifeValues.map((value) => consultationLabels.lifeFactor[value]).filter(Boolean);
  const concernValues = selectedCheckboxValues("skinConcern");
  const concernValue = concernValues[0] || "";
  const concernLabels = concernValues.map((value) => consultationLabels.skinConcern[value]).filter(Boolean);
  const routineHabitValue = selectedRadioValue("routineHabit") || "basic";
  const skinScenarioValues = selectedCheckboxValues("skinScenario");
  const skinScenarioValue = skinScenarioValues[0] || "bare";
  const skinScenarioLabels = skinScenarioValues.map((value) => consultationLabels.skinScenario[value]).filter(Boolean);
  const routinePaceValue = selectedRadioValue("routinePace") || "simple";

  return {
    lifeValues,
    lifeLabels,
    lifeLabel: lifeLabels.join("、"),
    ageValue,
    ageLabel: consultationLabels.ageRange[ageValue] || "",
    concernValue,
    concernValues,
    concernLabel: concernLabels.join("、"),
    concernLabels,
    routineHabitValue,
    routineHabitLabel: consultationLabels.routineHabit[routineHabitValue],
    skinScenarioValue,
    skinScenarioValues,
    skinScenarioLabel: skinScenarioLabels.join("、") || consultationLabels.skinScenario[skinScenarioValue],
    skinScenarioLabels,
    routinePaceValue,
    routinePaceLabel: consultationLabels.routinePace[routinePaceValue],
  };
}

function applyQuestionProfileToScores(scores) {
  if (!customerProfile) return scores;

  const adjusted = { ...scores };
  const concernAdjustments = {
    hydration: { hydration: -4, shine: 1 },
    evenness: { evenness: -4, redness: -1 },
    redness: { redness: -4, hydration: -1 },
    shine: { shine: -4, hydration: 1 },
    texture: { hydration: -2, evenness: -2 },
    fineLines: { hydration: -3, evenness: -1 },
  };
  const lifeAdjustments = {
    sleep: { evenness: -2, redness: -1 },
    stress: { redness: -2, shine: -1 },
    busy: { hydration: -1, evenness: -1 },
    diet: { shine: -2, evenness: -1 },
    ac: { hydration: -3, redness: -1 },
    selfcare: { hydration: -2, evenness: -2 },
  };
  const habitAdjustments = {
    minimal: { hydration: -2, evenness: -1, shine: -1 },
    basic: { hydration: 2, redness: 1 },
    complete: { hydration: 3, evenness: 4, redness: 3, shine: 1 },
    antioxidant: { hydration: 3, evenness: 5, redness: 3, shine: 2 },
    clinical: { hydration: 2, evenness: 3, redness: 1 },
  };
  const scenarioAdjustments = {
    makeup: { hydration: -1, shine: -1 },
    bare: { evenness: -2 },
    season: { redness: -2, hydration: -1 },
    stress: { evenness: -2, redness: -1 },
    ageing: { hydration: -2, evenness: -1 },
  };
  const paceAdjustments = {
    simple: { hydration: 1, redness: 1 },
    daily: { hydration: 2, evenness: 2 },
    intensive: { hydration: 3, evenness: 2, redness: 2 },
    completeCare: { hydration: 4, evenness: 3, redness: 3, shine: 1 },
    flexible: { hydration: 1, redness: 1 },
  };
  const ageAdjustments = {
    under20: { shine: -1 },
    "20s": { shine: -1 },
    "30s": { hydration: -1, evenness: -1 },
    "40s": { hydration: -2, evenness: -2 },
    "50up": { hydration: -3, evenness: -3 },
  };
  const allAdjustments = [
    ...(customerProfile.lifeValues || []).map((value) => lifeAdjustments[value]).filter(Boolean),
    ...(customerProfile.concernValues || []).map((value) => concernAdjustments[value]).filter(Boolean),
    habitAdjustments[customerProfile.routineHabitValue],
    ...(customerProfile.skinScenarioValues || []).map((value) => scenarioAdjustments[value]).filter(Boolean),
    paceAdjustments[customerProfile.routinePaceValue],
    ageAdjustments[customerProfile.ageValue],
  ].filter(Boolean);

  for (const adjustment of allAdjustments) {
    for (const [key, value] of Object.entries(adjustment)) {
      adjusted[key] = clamp((adjusted[key] ?? scores[key]) + value, 52, 96);
    }
  }

  const advancedHabitLift = {
    minimal: 0,
    basic: 1,
    complete: 2,
    antioxidant: 3,
    clinical: 2,
  }[customerProfile.routineHabitValue] || 0;
  const routineCommitmentLift = {
    simple: 0,
    daily: 1,
    intensive: 2,
    completeCare: 3,
    flexible: 1,
  }[customerProfile.routinePaceValue] || 0;
  const careConsistencyLift = Math.min(5, advancedHabitLift + routineCommitmentLift);

  if (careConsistencyLift) {
    for (const key of Object.keys(adjusted)) {
      adjusted[key] = clamp(adjusted[key] + careConsistencyLift, 52, 96);
    }
  }

  return adjusted;
}

function calibrateConsumerScoreRange(scores, maintainedSkinLift = 0) {
  const adjusted = { ...scores };
  const values = Object.values(adjusted);
  const average = values.reduce((sum, score) => sum + score, 0) / values.length;
  const habitLift = {
    minimal: -1,
    basic: 2,
    complete: 8,
    antioxidant: 11,
    clinical: 7,
  }[customerProfile?.routineHabitValue] || 0;
  const paceLift = {
    simple: 0,
    daily: 2,
    intensive: 4,
    completeCare: 6,
    flexible: 1,
  }[customerProfile?.routinePaceValue] || 0;
  const stressLoad = [
    ...(customerProfile?.concernValues || []),
    ...(customerProfile?.lifeValues || []),
    ...(customerProfile?.skinScenarioValues || []),
  ].length;
  const skinSignalLift = clamp((maintainedSkinLift - 1.8) * 1.5, -2, 4);
  const targetAverage = clamp(64 + habitLift + paceLift + skinSignalLift - Math.min(4, stressLoad * 0.45), 60, 82);
  const effectiveAverage = average < targetAverage
    ? targetAverage
    : clamp(average + Math.max(0, habitLift + paceLift) * 0.25, targetAverage, 88);

  for (const key of Object.keys(adjusted)) {
    const personalSpread = (adjusted[key] - average) * 0.9;
    adjusted[key] = clamp(effectiveAverage + personalSpread, 56, 92);
  }

  return adjusted;
}

function separateTiedMetricScores(scores, concernSignals) {
  const nextScores = { ...scores };
  const grouped = Object.keys(nextScores).reduce((groups, key) => {
    const rounded = scoreText(nextScores[key]);
    groups[rounded] = groups[rounded] || [];
    groups[rounded].push(key);
    return groups;
  }, {});

  for (const tiedKeys of Object.values(grouped)) {
    if (tiedKeys.length < 2) continue;

    const ordered = tiedKeys
      .map((key) => ({ key, signal: concernSignals[key] ?? 0 }))
      .sort((a, b) => b.signal - a.signal);
    const offsetsByLength = {
      2: [-1.4, 1.4],
      3: [-2.4, 0.4, 2.4],
      4: [-3.2, -1.1, 1.1, 3.2],
    };
    const offsets = offsetsByLength[ordered.length] || offsetsByLength[4];

    ordered.forEach((item, index) => {
      nextScores[item.key] = clamp(nextScores[item.key] + offsets[index], 52, 96);
    });
  }

  return nextScores;
}

function spreadCloseMetricScores(scores, concernSignals) {
  const nextScores = { ...scores };
  const values = Object.values(nextScores).map((value) => Math.round(value));
  const spread = Math.max(...values) - Math.min(...values);
  if (spread >= 7) return nextScores;

  const ordered = Object.keys(nextScores)
    .map((key) => ({ key, signal: concernSignals[key] ?? 0 }))
    .sort((a, b) => b.signal - a.signal);
  const offsets = [-6.4, -2.2, 2.2, 6.4];
  const center = Math.max(58, ordered.reduce((sum, item) => sum + nextScores[item.key], 0) / ordered.length + 3);

  ordered.forEach((item, index) => {
    const naturalPull = clamp(((concernSignals[item.key] ?? 0) - 50) * -0.055, -2.1, 2.1);
    nextScores[item.key] = clamp(center + offsets[index] + naturalPull, 52, 96);
  });

  return nextScores;
}

function updateStartAnalysisState() {
  if (lastResult) {
    lastResult = null;
    lastRoutine = [];
    lastRecommendedProducts = [];
    viewResultButton.textContent = "下一步：回答膚況問題";
  }
  const profile = collectCustomerProfile();
  const isReady = Boolean(loadedImage && profile.ageValue && profile.concernValues.length);
  startAnalysisButton.disabled = !isReady;
}

function preparePhotoForConsultation(fileName = "照片") {
  lastResult = null;
  lastRoutine = [];
  lastRecommendedProducts = [];
  customerProfile = null;
  if (copyReportButton) copyReportButton.disabled = true;
  viewResultButton.disabled = false;
  viewResultButton.textContent = "下一步：回答膚況問題";
  renderPreviewOnly();
  updateStartAnalysisState();
  setUploadStatus(`已準備好：${fileName}。請確認臉部對準後，進入膚況問答。`);
}

function resetFaceGuide() {
  faceGuide.x = defaultFaceGuide.x;
  faceGuide.y = defaultFaceGuide.y;
  faceGuide.width = defaultFaceGuide.width;
  faceGuide.height = defaultFaceGuide.height;
  syncAlignmentInputs();
}

function resetPhotoAdjust() {
  photoAdjust.x = 0;
  photoAdjust.y = 0;
  photoAdjust.zoom = 100;
  syncPhotoInputs();
}

function syncAlignmentInputs() {
  alignmentInputs.x.value = faceGuide.x;
  alignmentInputs.y.value = faceGuide.y;
  alignmentInputs.width.value = faceGuide.width;
  alignmentInputs.height.value = faceGuide.height;
}

function syncPhotoInputs() {
  return;
}

function setPhotoAdjust(next) {
  photoAdjust.zoom = clamp(next.zoom ?? photoAdjust.zoom, 90, 220);
  photoAdjust.x = clamp(next.x ?? photoAdjust.x, -36, 36);
  photoAdjust.y = clamp(next.y ?? photoAdjust.y, -36, 36);
  syncPhotoInputs();
}

function setFaceGuide(next) {
  faceGuide.width = clamp(next.width ?? faceGuide.width, 18, 44);
  faceGuide.height = clamp(next.height ?? faceGuide.height, 28, 48);
  faceGuide.x = clamp(next.x ?? faceGuide.x, faceGuide.width, 100 - faceGuide.width);
  faceGuide.y = clamp(next.y ?? faceGuide.y, faceGuide.height, 100 - faceGuide.height);
  syncAlignmentInputs();
}

function drawImageCover(image) {
  const ratio = Math.min(canvas.width / image.width, canvas.height / image.height);
  const zoomRatio = photoAdjust.zoom / 100;
  const width = image.width * ratio * zoomRatio;
  const height = image.height * ratio * zoomRatio;
  const x = (canvas.width - width) / 2 + (photoAdjust.x / 100) * canvas.width;
  const y = (canvas.height - height) / 2 + (photoAdjust.y / 100) * canvas.height;
  imageBounds = { x, y, width, height };

  ctx.clearRect(0, 0, canvas.width, canvas.height);
  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = "high";
  ctx.fillStyle = "#FAF5EF";
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  ctx.drawImage(image, x, y, width, height);
}

function isLikelySkinPixel(r, g, b) {
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  const chroma = max - min;
  const brightness = (r + g + b) / 3;
  const saturation = max === 0 ? 0 : chroma / max;
  const y = 0.299 * r + 0.587 * g + 0.114 * b;
  const cb = 128 - 0.168736 * r - 0.331264 * g + 0.5 * b;
  const cr = 128 + 0.5 * r - 0.418688 * g - 0.081312 * b;
  const ycbcrSkin = cr > 132 && cr < 182 && cb > 72 && cb < 138;
  const rgbSkin = r > 45 && g > 32 && b > 24 && r > b * 1.04 && r >= g * 0.82;

  return brightness > 45 && brightness < 238 && saturation > 0.08 && saturation < 0.78 && chroma > 8 && y > 42 && (ycbcrSkin || rgbSkin);
}

function percentile(values, ratio) {
  if (!values.length) return 0;
  const sorted = [...values].sort((a, b) => a - b);
  return sorted[Math.floor((sorted.length - 1) * ratio)];
}

function getSkinDetectionBox() {
  const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
  const { data } = imageData;
  const points = [];
  const step = 5;
  const left = Math.max(0, Math.floor(imageBounds.x));
  const right = Math.min(canvas.width, Math.ceil(imageBounds.x + imageBounds.width));
  const top = Math.max(0, Math.floor(imageBounds.y));
  const bottom = Math.min(canvas.height, Math.ceil(imageBounds.y + imageBounds.height));

  for (let y = top; y < bottom; y += step) {
    for (let x = left; x < right; x += step) {
      const index = (y * canvas.width + x) * 4;
      if (isLikelySkinPixel(data[index], data[index + 1], data[index + 2])) {
        points.push({ x, y });
      }
    }
  }

  if (points.length < 260) return false;

  const xs = points.map((point) => point.x);
  const ys = points.map((point) => point.y);
  let minX = percentile(xs, 0.08);
  let maxX = percentile(xs, 0.92);
  let minY = percentile(ys, 0.06);
  let maxY = percentile(ys, 0.88);
  const detectedWidth = maxX - minX;
  const detectedHeight = maxY - minY;

  if (detectedWidth < canvas.width * 0.08 || detectedHeight < canvas.height * 0.1) return false;

  return { minX, maxX, minY, maxY, detectedWidth, detectedHeight, points: points.length };
}

function setGuideFromDetectionBox(box) {
  const { minX, maxX, minY, maxY, detectedWidth, detectedHeight } = box;
  const centerX = ((minX + maxX) / 2 / canvas.width) * 100;
  const centerY = (((minY + maxY) / 2 - detectedHeight * 0.05) / canvas.height) * 100;
  const radiusX = (detectedWidth / 2 / canvas.width) * 126;
  const radiusY = (detectedHeight / 2 / canvas.height) * 142;

  setFaceGuide({
    x: centerX,
    y: centerY,
    width: radiusX,
    height: Math.max(radiusY, radiusX * 1.22),
  });

  return true;
}

function detectFaceGuideFromImage() {
  const box = getSkinDetectionBox();
  if (!box) return false;
  return setGuideFromDetectionBox(box);
}

function fitPhotoToDetectionBox(box) {
  const faceCenterX = (box.minX + box.maxX) / 2;
  const faceCenterY = (box.minY + box.maxY) / 2 - box.detectedHeight * 0.04;
  const targetX = canvas.width * (defaultFaceGuide.x / 100);
  const targetY = canvas.height * (defaultFaceGuide.y / 100);
  const targetWidth = canvas.width * 0.44;
  const zoomFactor = clamp(targetWidth / Math.max(box.detectedWidth, 1), 0.92, 1.72);
  const nextZoom = clamp(photoAdjust.zoom * zoomFactor, 92, 210);
  const actualFactor = nextZoom / photoAdjust.zoom;
  const centerXAfterZoom = canvas.width / 2 + (faceCenterX - canvas.width / 2) * actualFactor;
  const centerYAfterZoom = canvas.height / 2 + (faceCenterY - canvas.height / 2) * actualFactor;

  setPhotoAdjust({
    zoom: nextZoom,
    x: photoAdjust.x + ((targetX - centerXAfterZoom) / canvas.width) * 100,
    y: photoAdjust.y + ((targetY - centerYAfterZoom) / canvas.height) * 100,
  });
}

function autoFitPhotoToFace() {
  drawImageCover(loadedImage);
  const firstBox = getSkinDetectionBox();
  if (!firstBox) return false;

  fitPhotoToDetectionBox(firstBox);
  drawImageCover(loadedImage);
  const refinedBox = getSkinDetectionBox();
  if (refinedBox) {
    const targetWidth = canvas.width * 0.44;
    const widthGap = Math.abs(refinedBox.detectedWidth - targetWidth) / targetWidth;
    if (widthGap > 0.22) {
      fitPhotoToDetectionBox(refinedBox);
      drawImageCover(loadedImage);
    }
  }
  resetFaceGuide();
  return true;
}

async function detectNativeFaceGuide() {
  if (!("FaceDetector" in window)) return false;

  try {
    const detector = new FaceDetector({ fastMode: true, maxDetectedFaces: 1 });
    const faces = await detector.detect(canvas);
    if (!faces.length) return false;

    const box = faces[0].boundingBox;
    setFaceGuide({
      x: ((box.x + box.width / 2) / canvas.width) * 100,
      y: ((box.y + box.height / 2) / canvas.height) * 100,
      width: (box.width / 2 / canvas.width) * 106,
      height: (box.height / 2 / canvas.height) * 98,
    });
    return true;
  } catch {
    return false;
  }
}

async function autoDetectFaceGuide() {
  return (await detectNativeFaceGuide()) || detectFaceGuideFromImage();
}

function isInsideFaceOval(x, y) {
  const cx = canvas.width * (faceGuide.x / 100);
  const cy = canvas.height * (faceGuide.y / 100);
  const rx = canvas.width * (faceGuide.width / 100);
  const ry = canvas.height * (faceGuide.height / 100);
  const dx = (x - cx) / rx;
  const dy = (y - cy) / ry;
  const inOval = dx * dx + dy * dy <= 1;
  const eyeBand = y > cy - ry * 0.45 && y < cy - ry * 0.18 && Math.abs(x - cx) < rx * 0.82;
  const mouthBand = y > cy + ry * 0.28 && y < cy + ry * 0.58 && Math.abs(x - cx) < rx * 0.56;
  return inOval && !eyeBand && !mouthBand;
}

function drawFaceGuide() {
  const cx = canvas.width * (faceGuide.x / 100);
  const cy = canvas.height * (faceGuide.y / 100);
  const rx = canvas.width * (faceGuide.width / 100);
  const ry = canvas.height * (faceGuide.height / 100);

  ctx.save();
  ctx.fillStyle = "rgba(255, 255, 255, 0.06)";
  ctx.strokeStyle = "rgba(255, 255, 255, 0.92)";
  ctx.lineWidth = 7;
  ctx.setLineDash([14, 10]);
  ctx.beginPath();
  ctx.ellipse(cx, cy, rx, ry, 0, 0, Math.PI * 2);
  ctx.stroke();
  ctx.strokeStyle = "rgba(180, 90, 76, 0.96)";
  ctx.lineWidth = 4;
  ctx.setLineDash([14, 10]);
  ctx.beginPath();
  ctx.ellipse(cx, cy, rx, ry, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();
  ctx.setLineDash([]);
  ctx.strokeStyle = "rgba(255, 255, 255, 0.9)";
  ctx.lineWidth = 4;
  for (const [sx, sy, start, end] of [
    [cx - rx, cy - ry, 0, 28],
    [cx + rx, cy - ry, -28, 0],
    [cx - rx, cy + ry, 0, -28],
    [cx + rx, cy + ry, -28, 0],
  ]) {
    ctx.beginPath();
    ctx.moveTo(sx, sy);
    ctx.lineTo(sx + end, sy);
    ctx.moveTo(sx, sy);
    ctx.lineTo(sx, sy + (sy < cy ? 28 : -28));
    ctx.stroke();
  }
  ctx.fillStyle = "rgba(180, 90, 76, 0.96)";
  ctx.beginPath();
  ctx.arc(cx, cy, 8, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = "#FFFFFF";
  ctx.strokeStyle = "rgba(180, 90, 76, 0.96)";
  ctx.lineWidth = 4;
  for (const [hx, hy] of [
    [cx - rx, cy],
    [cx + rx, cy],
    [cx, cy - ry],
    [cx, cy + ry],
  ]) {
    ctx.beginPath();
    ctx.arc(hx, hy, 9, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
  }
  ctx.restore();
}

function captureAnalysisPreview() {
  try {
    return canvas.toDataURL("image/jpeg", 0.86);
  } catch {
    return "";
  }
}

const defaultMeshMarkup = fields.faceMesh?.innerHTML || "";

function renderAlignedFaceMesh(mesh) {
  if (!fields.faceMesh) return;
  if (!mesh) {
    fields.faceMesh.setAttribute("viewBox", "0 0 180 220");
    fields.faceMesh.innerHTML = defaultMeshMarkup;
    return;
  }

  const { width, height, cx, cy, rx, ry } = mesh;
  const points = {
    top: [cx, cy - ry * 0.66],
    leftBrow: [cx - rx * 0.5, cy - ry * 0.43],
    rightBrow: [cx + rx * 0.5, cy - ry * 0.43],
    leftEye: [cx - rx * 0.34, cy - ry * 0.17],
    rightEye: [cx + rx * 0.34, cy - ry * 0.17],
    leftCheek: [cx - rx * 0.82, cy + ry * 0.06],
    rightCheek: [cx + rx * 0.82, cy + ry * 0.06],
    nose: [cx, cy + ry * 0.14],
    leftMouth: [cx - rx * 0.46, cy + ry * 0.48],
    rightMouth: [cx + rx * 0.46, cy + ry * 0.48],
    chin: [cx, cy + ry * 0.92],
  };
  const line = (...names) => names.map((name) => points[name].join(" ")).join(" L");
  const dot = (name, delay, size = 5.4) => `<circle class="mesh-dot" cx="${points[name][0].toFixed(1)}" cy="${points[name][1].toFixed(1)}" r="${size}" style="--d: ${delay}s" />`;

  fields.faceMesh.setAttribute("viewBox", `0 0 ${width} ${height}`);
  fields.faceMesh.innerHTML = `
    <ellipse class="mesh-face" cx="${cx.toFixed(1)}" cy="${cy.toFixed(1)}" rx="${(rx * 1.02).toFixed(1)}" ry="${(ry * 0.98).toFixed(1)}" />
    <path d="M${line("leftBrow", "top", "rightBrow", "rightCheek", "rightMouth", "chin", "leftMouth", "leftCheek", "leftBrow")}" />
    <path d="M${line("top", "nose", "chin")} M${line("leftCheek", "rightCheek")} M${line("leftMouth", "rightMouth")}" />
    <path d="M${line("leftBrow", "leftEye", "nose", "rightEye", "rightBrow")} M${line("leftEye", "leftCheek", "leftMouth", "nose", "rightMouth", "rightCheek", "rightEye")} M${line("top", "leftEye", "leftMouth")} M${line("top", "rightEye", "rightMouth")}" />
    ${dot("top", 0, 6)}
    ${dot("leftBrow", 0.12)}
    ${dot("rightBrow", 0.24)}
    ${dot("leftEye", 0.36)}
    ${dot("rightEye", 0.48)}
    ${dot("leftCheek", 0.6)}
    ${dot("nose", 0.72, 6)}
    ${dot("rightCheek", 0.84)}
    ${dot("leftMouth", 0.96)}
    ${dot("rightMouth", 1.08)}
    ${dot("chin", 1.2, 6.4)}
  `;
}

function captureFaceFocusedPreview() {
  try {
    const cx = canvas.width * (faceGuide.x / 100);
    const cy = canvas.height * (faceGuide.y / 100);
    const rx = canvas.width * (faceGuide.width / 100);
    const ry = canvas.height * (faceGuide.height / 100);
    const targetAspect = 0.82;
    let cropWidth = Math.max(rx * 2.42, ry * 1.68);
    let cropHeight = Math.max(ry * 2.34, cropWidth / targetAspect);

    if (cropWidth / cropHeight > targetAspect) {
      cropHeight = cropWidth / targetAspect;
    } else {
      cropWidth = cropHeight * targetAspect;
    }

    cropWidth = Math.min(cropWidth, canvas.width);
    cropHeight = Math.min(cropHeight, canvas.height);

    let sourceX = cx - cropWidth / 2;
    let sourceY = cy - cropHeight * 0.48;
    sourceX = clamp(sourceX, 0, canvas.width - cropWidth);
    sourceY = clamp(sourceY, 0, canvas.height - cropHeight);

    const previewCanvas = document.createElement("canvas");
    previewCanvas.width = 720;
    previewCanvas.height = Math.round(previewCanvas.width / targetAspect);
    const previewCtx = previewCanvas.getContext("2d");
    previewCtx.imageSmoothingEnabled = true;
    previewCtx.imageSmoothingQuality = "high";
    previewCtx.fillStyle = "#FAF5EF";
    previewCtx.fillRect(0, 0, previewCanvas.width, previewCanvas.height);
    previewCtx.drawImage(canvas, sourceX, sourceY, cropWidth, cropHeight, 0, 0, previewCanvas.width, previewCanvas.height);

    return {
      src: previewCanvas.toDataURL("image/jpeg", 0.88),
      mesh: {
        width: previewCanvas.width,
        height: previewCanvas.height,
        cx: (cx - sourceX) / cropWidth * previewCanvas.width,
        cy: (cy - sourceY) / cropHeight * previewCanvas.height,
        rx: rx / cropWidth * previewCanvas.width,
        ry: ry / cropHeight * previewCanvas.height,
      },
    };
  } catch {
    return { src: captureAnalysisPreview(), mesh: null };
  }
}

function updateAnalysisPreviewImage() {
  drawImageCover(loadedImage);
  const preview = captureFaceFocusedPreview();
  const previewSrc = preview?.src || captureAnalysisPreview();
  if (previewSrc) {
    fields.analysisFacePreview.src = previewSrc;
    fields.scanFacePhoto.src = previewSrc;
  }
  renderAlignedFaceMesh(preview?.mesh);
  return previewSrc;
}

function renderAndAnalyze() {
  if (!loadedImage) return;

  customerProfile = collectCustomerProfile();
  setJourneyStep("analyze");
  setUploadStatus("正在分析你的肌膚狀態...");
  updateAnalysisPreviewImage();
  const result = analyzeSkin();
  drawFaceGuide();
  emptyState.hidden = true;

  if (!result) {
    window.setTimeout(() => {
      fields.summaryList.innerHTML = "<p>AI 無法確認這是一張可判讀的正面臉部照片。請重新拍攝正臉、臉部置中、光線明亮的照片後再試一次。</p>";
      setUploadStatus("判讀失敗：未偵測到清楚正面臉部，請重新拍攝或上傳臉部照片。", "error");
      setJourneyStep("capture");
    }, 2600);
    return;
  }

  window.setTimeout(() => {
    updateResults(result);
    setUploadStatus(`檢測完成，請查看下方摘要與保養建議。`);
    viewResultButton.disabled = false;
    viewResultButton.textContent = "查看我的 AI 膚況結果";
    setJourneyStep("result", "summary");
  }, 4200);
}

function renderPreviewOnly() {
  if (!loadedImage) return;
  drawImageCover(loadedImage);
  updateAnalysisPreviewImage();
  drawFaceGuide();
  emptyState.hidden = true;
}

function createZoneAccumulator() {
  return {
    count: 0,
    brightness: 0,
    texture: 0,
    localTexture: 0,
    redness: 0,
    highlight: 0,
    dark: 0,
  };
}

function faceZoneForSample(sample) {
  const ax = Math.abs(sample.nx);
  if (ax < 0.58 && sample.ny > 0.38) return "lower";
  if (ax < 0.26 && sample.ny > -0.62 && sample.ny <= 0.38) return "tZone";
  if (ax > 0.22 && ax < 0.82 && sample.ny > -0.22 && sample.ny < 0.52) return "cheeks";
  if (ax < 0.58 && sample.ny <= -0.42) return "forehead";
  return null;
}

function addZoneSample(zone, sample, avg) {
  zone.count += 1;
  zone.brightness += sample.brightness;
  zone.texture += Math.abs(sample.brightness - avg.brightness);
  zone.localTexture += sample.localContrast || 0;
  zone.redness += sample.redness;
  if (sample.brightness > avg.brightness + 22 && sample.brightness > 128) zone.highlight += 1;
  if (sample.brightness < avg.brightness - 24) zone.dark += 1;
}

function finalizeZone(zone) {
  if (!zone.count) {
    return {
      count: 0,
      brightness: 0,
      texture: 0,
      localTexture: 0,
      redness: 0,
      highlightRatio: 0,
      darkRatio: 0,
    };
  }
  return {
    count: zone.count,
    brightness: zone.brightness / zone.count,
    texture: zone.texture / zone.count,
    localTexture: zone.localTexture / zone.count,
    redness: zone.redness / zone.count,
    highlightRatio: zone.highlight / zone.count,
    darkRatio: zone.dark / zone.count,
  };
}

function analyzeSkin() {
  const detectedSkinBox = getSkinDetectionBox();
  const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
  const { data } = imageData;
  const pixels = [];
  const fallbackPixels = [];
  const rawPixels = [];
  let ovalSampleCount = 0;
  let skinCandidateCount = 0;
  const step = 3;
  const cx = canvas.width * (faceGuide.x / 100);
  const cy = canvas.height * (faceGuide.y / 100);
  const rx = canvas.width * (faceGuide.width / 100);
  const ry = canvas.height * (faceGuide.height / 100);

  for (let y = 0; y < canvas.height; y += step) {
    for (let x = 0; x < canvas.width; x += step) {
      if (!isInsideFaceOval(x, y)) continue;
      ovalSampleCount += 1;
      const index = (y * canvas.width + x) * 4;
      const r = data[index];
      const g = data[index + 1];
      const b = data[index + 2];
      const isSkin = isLikelySkinPixel(r, g, b);
      if (isSkin) skinCandidateCount += 1;
      const max = Math.max(r, g, b);
      const min = Math.min(r, g, b);
      const brightness = (r + g + b) / 3;
      const saturation = max === 0 ? 0 : (max - min) / max;
      const rightIndex = (y * canvas.width + Math.min(canvas.width - 1, x + step)) * 4;
      const downIndex = (Math.min(canvas.height - 1, y + step) * canvas.width + x) * 4;
      const rightBrightness = (data[rightIndex] + data[rightIndex + 1] + data[rightIndex + 2]) / 3;
      const downBrightness = (data[downIndex] + data[downIndex + 1] + data[downIndex + 2]) / 3;
      const sample = {
        r,
        g,
        b,
        brightness,
        saturation,
        localContrast: Math.abs(brightness - rightBrightness) + Math.abs(brightness - downBrightness),
        redness: r - (g + b) / 2,
        nx: (x - cx) / rx,
        ny: (y - cy) / ry,
      };

      if (brightness > 8 && brightness < 252) {
        rawPixels.push(sample);
      }

      if (isSkin || (brightness > 38 && brightness < 238 && saturation > 0.06 && saturation < 0.72 && r > b * 0.94)) {
        fallbackPixels.push(sample);
      }

      if (!isSkin && (brightness < 44 || brightness > 238 || saturation > 0.78)) continue;
      pixels.push(sample);
    }
  }

  const imagePixels = [];
  if (rawPixels.length < 80) {
    const left = Math.max(0, Math.floor(imageBounds.x));
    const right = Math.min(canvas.width, Math.ceil(imageBounds.x + imageBounds.width));
    const top = Math.max(0, Math.floor(imageBounds.y));
    const bottom = Math.min(canvas.height, Math.ceil(imageBounds.y + imageBounds.height));

    for (let y = top; y < bottom; y += 8) {
      for (let x = left; x < right; x += 8) {
        const index = (y * canvas.width + x) * 4;
        const r = data[index];
        const g = data[index + 1];
        const b = data[index + 2];
        const brightness = (r + g + b) / 3;
        if (brightness > 8 && brightness < 252) {
          imagePixels.push({ r, g, b, brightness, saturation: 0, localContrast: 0, redness: r - (g + b) / 2, nx: 0, ny: 0 });
        }
      }
    }
  }

  let activePixels = pixels;
  let mode = "skin";
  if (activePixels.length < 120) {
    activePixels = fallbackPixels;
    mode = "fallback";
  }
  if (activePixels.length < 80) {
    activePixels = rawPixels;
    mode = "raw";
  }
  if (activePixels.length < 60) {
    activePixels = imagePixels;
    mode = "image";
  }

  if (activePixels.length < 30) {
    return null;
  }
  const skinRatio = ovalSampleCount ? skinCandidateCount / ovalSampleCount : 0;
  const faceAreaRatio = activePixels.length / Math.max(ovalSampleCount, 1);
  const detectedFaceRatio = detectedSkinBox
    ? detectedSkinBox.detectedWidth / Math.max(detectedSkinBox.detectedHeight, 1)
    : 0;
  const isCameraPhoto = lastPhotoSource === "camera";
  const relaxedDetectedShape = Boolean(detectedSkinBox && detectedFaceRatio > 0.3 && detectedFaceRatio < 1.75 && detectedSkinBox.points > 210);
  const detectedFaceShape = Boolean(detectedSkinBox && detectedFaceRatio > 0.38 && detectedFaceRatio < 1.52 && detectedSkinBox.points > 260);
  const strongOvalFace = relaxedDetectedShape && activePixels.length >= 220 && skinCandidateCount >= 110 && skinRatio >= 0.075;
  const relaxedCameraFace = isCameraPhoto && activePixels.length >= 180 && skinCandidateCount >= 85 && skinRatio >= 0.055;
  const faceReadConfidence = clamp(skinRatio * 100 + Math.min(activePixels.length, 2600) / 52 + faceAreaRatio * 18, 0, 100);
  const isValidFaceRead =
    mode !== "raw" &&
    mode !== "image" &&
    (detectedFaceShape || strongOvalFace || relaxedCameraFace);

  if (!isValidFaceRead) {
    return null;
  }

  const avg = activePixels.reduce(
    (sum, p) => {
      sum.r += p.r;
      sum.g += p.g;
      sum.b += p.b;
      sum.brightness += p.brightness;
      sum.saturation += p.saturation;
      sum.redness += p.redness;
      return sum;
    },
    { r: 0, g: 0, b: 0, brightness: 0, saturation: 0, redness: 0 },
  );

  for (const key of Object.keys(avg)) avg[key] /= activePixels.length;

  let variance = 0;
  let rednessCount = 0;
  let highlightCount = 0;
  let darkSpotCount = 0;
  let textureEnergy = 0;
  let localTexture = 0;
  let brightnessVariance = 0;
  let rednessVariance = 0;
  let leftBrightness = 0;
  let rightBrightness = 0;
  let leftCount = 0;
  let rightCount = 0;
  let tZoneHighlightCount = 0;
  let tZoneCount = 0;
  const zoneAccumulators = {
    forehead: createZoneAccumulator(),
    tZone: createZoneAccumulator(),
    cheeks: createZoneAccumulator(),
    lower: createZoneAccumulator(),
  };

  for (const p of activePixels) {
    const colorDistance = Math.hypot(p.r - avg.r, p.g - avg.g, p.b - avg.b);
    variance += colorDistance;
    brightnessVariance += (p.brightness - avg.brightness) ** 2;
    rednessVariance += (p.redness - avg.redness) ** 2;
    if (p.redness > avg.redness + 10 && p.r > p.g * 1.04) rednessCount += 1;
    if (p.brightness > avg.brightness + 24 && p.brightness > 126) highlightCount += 1;
    if (p.brightness < avg.brightness - 24 && colorDistance > 18) darkSpotCount += 1;
    textureEnergy += Math.abs(p.brightness - avg.brightness);
    localTexture += p.localContrast || 0;
    if (p.nx < -0.12) {
      leftBrightness += p.brightness;
      leftCount += 1;
    }
    if (p.nx > 0.12) {
      rightBrightness += p.brightness;
      rightCount += 1;
    }
    if (Math.abs(p.nx) < 0.28 && p.ny < 0.36) {
      tZoneCount += 1;
      if (p.brightness > avg.brightness + 18 && p.brightness > 132) tZoneHighlightCount += 1;
    }
    const zoneKey = faceZoneForSample(p);
    if (zoneKey) addZoneSample(zoneAccumulators[zoneKey], p, avg);
  }

  variance /= activePixels.length;
  textureEnergy /= activePixels.length;
  localTexture /= activePixels.length;
  brightnessVariance = Math.sqrt(brightnessVariance / activePixels.length);
  rednessVariance = Math.sqrt(rednessVariance / activePixels.length);

  const rednessRatio = rednessCount / activePixels.length;
  const highlightRatio = highlightCount / activePixels.length;
  const darkSpotRatio = darkSpotCount / activePixels.length;
  const tZoneHighlightRatio = tZoneCount ? tZoneHighlightCount / tZoneCount : highlightRatio;
  const sideBalance = leftCount && rightCount ? Math.abs(leftBrightness / leftCount - rightBrightness / rightCount) : 0;
  const zones = Object.fromEntries(
    Object.entries(zoneAccumulators).map(([key, zone]) => [key, finalizeZone(zone)]),
  );
  const cheekTextureSignal = clamp((zones.cheeks.texture - textureEnergy) * 0.72 + (zones.lower.texture - textureEnergy) * 0.34, -4, 9);
  const tZoneOilSignal = clamp(tZoneHighlightRatio * 120 + zones.tZone.highlightRatio * 155 + Math.max(0, zones.tZone.brightness - avg.brightness - 8) * 0.22, 0, 18);
  const cheekRednessSignal = clamp((Math.max(0, zones.cheeks.redness - avg.redness) * 0.16) + zones.cheeks.highlightRatio * 26, 0, 10);
  const toneZoneSignal = clamp(
    Math.abs(zones.cheeks.brightness - zones.forehead.brightness) * 0.18 +
      Math.abs(zones.cheeks.brightness - zones.lower.brightness) * 0.14 +
      zones.forehead.darkRatio * 46 +
      zones.lower.darkRatio * 38,
    0,
    16,
  );

  const modePenalty = { skin: 0, fallback: 5, raw: 9, image: 12 }[mode];
  const lightPenalty = Math.abs(avg.brightness - 152) * 0.12;
  const rawHydration = clamp(94 - textureEnergy * 0.58 - brightnessVariance * 0.32 - localTexture * 0.42 - highlightRatio * 155 - cheekTextureSignal * 1.15 - lightPenalty - modePenalty * 0.8, 1, 99);
  const rawEvenness = clamp(100 - variance * 0.95 - darkSpotRatio * 360 - sideBalance * 1.25 - toneZoneSignal * 0.78 - avg.saturation * 16 - modePenalty * 0.8, 1, 99);
  const rawRedness = clamp(99 - rednessRatio * 180 - cheekRednessSignal * 1.8 - Math.max(0, avg.redness - 42) * 0.35 - rednessVariance * 0.22 - modePenalty * 0.8, 1, 99);
  const rawShine = clamp(98 - highlightRatio * 250 - tZoneHighlightRatio * 300 - tZoneOilSignal * 0.92 - Math.max(0, avg.brightness - 176) * 0.38 - modePenalty * 0.8, 1, 99);
  const featureLift = clamp((brightnessVariance - 18) * 0.1 + (variance - 24) * 0.07 + (textureEnergy - 13) * 0.1, -3, 4);
  const balancedLightBonus = avg.brightness > 108 && avg.brightness < 188 ? 1.2 : 0;
  const imageSignature = {
    hydration: clamp((16 - textureEnergy) * 0.18 + (22 - brightnessVariance) * 0.08 - highlightRatio * 12, -4, 5),
    evenness: clamp((22 - variance) * 0.16 - sideBalance * 0.08 - darkSpotRatio * 28, -4, 5),
    redness: clamp(2.6 - rednessRatio * 34 - Math.max(0, avg.redness - 34) * 0.07, -5, 4),
    shine: clamp(2.4 - tZoneHighlightRatio * 38 - highlightRatio * 16 + (avg.brightness < 122 ? 1.2 : 0), -5, 4),
  };
  const maintainedSkinLift = clamp(
    (15 - textureEnergy) * 0.16 +
      (24 - variance) * 0.1 +
      (0.065 - rednessRatio) * 18 +
      (0.075 - tZoneHighlightRatio) * 12 +
      (balancedLightBonus ? 0.8 : 0),
    0,
    5,
  );
  const personalizedScores = applyQuestionProfileToScores({
    hydration: displayScore(rawHydration - featureLift + balancedLightBonus) + imageSignature.hydration + maintainedSkinLift * 0.8,
    evenness: displayScore(rawEvenness - Math.max(0, sideBalance - 8) * 0.11 - darkSpotRatio * 54) + imageSignature.evenness + maintainedSkinLift * 0.7,
    redness: displayScore(rawRedness - rednessRatio * 46) + imageSignature.redness + maintainedSkinLift * 0.75,
    shine: displayScore(rawShine - tZoneHighlightRatio * 74 + (avg.brightness < 118 ? 1.5 : 0)) + imageSignature.shine + maintainedSkinLift * 0.45,
  });
  const concernSignals = {
    hydration: 100 - rawHydration + textureEnergy * 0.5 + brightnessVariance * 0.22 + highlightRatio * 80,
    evenness: 100 - rawEvenness + variance * 0.5 + darkSpotRatio * 90 + sideBalance * 0.4,
    redness: 100 - rawRedness + rednessRatio * 120 + rednessVariance * 0.3,
    shine: 100 - rawShine + tZoneHighlightRatio * 140 + highlightRatio * 90,
  };
  const calibratedScores = calibrateConsumerScoreRange(personalizedScores, maintainedSkinLift);
  const finalScores = spreadCloseMetricScores(separateTiedMetricScores(calibratedScores, concernSignals), concernSignals);
  const { hydration, evenness, redness, shine } = finalScores;
  const overall = clamp(hydration * 0.25 + evenness * 0.32 + redness * 0.22 + shine * 0.21, 52, 96);
  const confidence = clamp(
    96
      - modePenalty * 3
      - Math.max(0, 2200 - activePixels.length) / 60
      - Math.max(0, Math.abs(avg.brightness - 152) - 48) * 0.55
      - Math.max(0, sideBalance - 18) * 0.9,
      - Math.max(0, 58 - faceReadConfidence) * 0.9,
    35,
    98,
  );

  return {
    hydration,
    evenness,
    redness,
    shine,
    overall,
    pixels: activePixels.length,
    variance,
    highlightRatio,
    tZoneHighlightRatio,
    darkSpotRatio,
    rednessRatio,
    textureEnergy,
    localTexture,
    brightnessVariance,
    sideBalance,
    zones,
    zoneSignals: {
      cheekTexture: cheekTextureSignal,
      tZoneOil: tZoneOilSignal,
      cheekRedness: cheekRednessSignal,
      tone: toneZoneSignal,
    },
    mode,
    avgBrightness: avg.brightness,
    confidence,
  };
}

function labelFor(score, good, mid, low) {
  if (score >= 78) return good;
  if (score >= 58) return mid;
  return low;
}

const fascineProducts = {
  cleanser: {
    name: "極淨水潤雙效潔顏凝露",
    role: "極致清潔",
    amount: "卸妝按壓 4-5 下；洗臉按壓 2-3 下",
    image: "assets/products/the-pure.jpg",
    routineImage: "assets/routine-products/the-pure.jpg",
    shopImage: "assets/routine-products/the-pure.jpg",
    href: "https://www.fascine.tw/SalePage/Index/11815253",
    match: "在清潔過程中形成細緻潔淨網，溫和洗淨皮脂、彩妝與髒污，還原柔嫩水光的膚觸。",
    keyBenefit: "清潔力與保濕平衡",
  },
  lotion: {
    name: "24HR 保濕精質蜜",
    role: "海量注水",
    amount: "每次按壓 6-10 下",
    image: "assets/products/the-lotion.jpg",
    routineImage: "assets/routine-products/the-lotion.jpg",
    shopImage: "assets/routine-products/the-lotion.jpg",
    href: "https://www.fascine.tw/SalePage/Index/11814666",
    match: "多重補水與鎖水機制同步啟動，維持肌膚長效含水度，打造全天候飽滿澎潤的水感肌。",
    keyBenefit: "補水打底與水潤感",
  },
  cream: {
    name: "極光晶潤霜",
    role: "逆齡發光",
    amount: "每次按壓 2-4 下",
    image: "assets/products/the-cream.jpg",
    routineImage: "assets/routine-products/the-cream.jpg",
    shopImage: "assets/routine-products/the-cream.jpg",
    href: "https://www.fascine.tw/SalePage/Index/11814606",
    match: "為肌膚注入盈潤滋養的頂級呵護，保持柔嫩與彈性，有感提升膚色明亮度、告別疲態。",
    keyBenefit: "鎖水修護與柔潤度",
  },
  sun: {
    name: "裸紗／智慧防曬系列",
    role: "全面防護",
    amount: "均勻且足量使用於全臉與頸部肌膚",
    image: "assets/products/sun-cream.jpg",
    routineImage: "assets/routine-products/sun-cream.jpg",
    shopImage: "assets/routine-products/sun-cream.jpg",
    href: "https://www.fascine.tw/SalePage/Index/11814600",
    match: "具備 SPF50+ 最高防護力，於保養程序完成後均勻塗抹，為肌膚鋪開高效抗氧防護網。",
    keyBenefit: "防曬防護與妝前穩定",
  },
  vitalC: {
    name: "亮白精華 C",
    role: "極效提亮",
    amount: "每次使用 6-8 滴",
    image: "assets/products/vital-c.jpg",
    routineImage: "assets/routine-products/vital-c.jpg",
    shopImage: "assets/routine-products/vital-c.jpg",
    href: "https://www.fascine.tw/SalePage/Index/11814690",
    match: "推薦於保養程序中適量加入，有感提升肌膚光澤度，迅速擺脫蠟黃暗沉。",
    keyBenefit: "透亮度與膚色均勻",
  },
  mask: {
    name: "智慧淨白面膜",
    role: "加強嫩白",
    amount: "每日 1 片，每次 10-15 分鐘",
    image: "assets/products/the-mask.jpg",
    routineImage: "assets/routine-products/the-mask.jpg",
    shopImage: "assets/routine-products/the-mask.jpg",
    href: "https://www.fascine.tw/SalePage/Index/11814850",
    match: "敷後接續日常保養，在最短時間內完成高效營養補充，提升肌膚透亮與細緻感。",
    keyBenefit: "週期提亮與細緻感",
  },
  serum22: {
    name: "小金球・精萃",
    role: "修護精華油",
    amount: "每次使用 1-2 顆",
    image: "assets/products/the-serum-30.jpg",
    routineImage: "assets/routine-products/the-serum-30.jpg",
    shopImage: "assets/routine-products/the-serum-30.jpg",
    href: "https://www.fascine.tw/SalePage/Index/11815187",
    match: "為肌膚注入高營養修護養分，柔化粗糙與微細紋路，重現水潤緊緻的絲滑膚觸。",
    keyBenefit: "滋養度與乾燥紋理",
  },
  primer: {
    name: "亮膚奇肌露",
    role: "前導緊緻",
    amount: "均勻噴灑於全臉與頸部肌膚",
    image: "assets/products/bright-primer-product.jpg",
    routineImage: "assets/products/bright-primer-product.jpg",
    shopImage: "assets/products/bright-primer-product.jpg",
    href: "https://www.fascine.tw/SalePage/Index/11815200",
    match: "全方位潤澤並緊緻肌膚，賦予彈力與透亮光澤，瞬間開啟後續保養的吸收通道。",
    keyBenefit: "前導吸收與舒緩穩定",
  },
  balanceDew: {
    name: "平衡水光露",
    role: "精準調理",
    amount: "每次使用 4-5 滴",
    image: "assets/products/balance-dew-product.jpg",
    routineImage: "assets/routine-products/balance-dew-product.jpg",
    shopImage: "assets/routine-products/balance-dew-product.jpg",
    href: "https://www.fascine.tw/SalePage/Index/11814639",
    match: "溫和更新角質、調理油水平衡，舒緩肌膚不適，使膚況更加穩定，同時勻亮膚色。",
    keyBenefit: "油水平衡與膚色調理",
  },
  exocell: {
    name: "外泌源",
    role: "百億級修護",
    amount: "均勻使用於全臉與頸部肌膚",
    image: "assets/products/the-cream.jpg",
    routineImage: "assets/routine-products/the-cream.jpg",
    shopImage: "assets/routine-products/the-cream.jpg",
    href: "https://www.fascine.tw/",
    match: "幫助肌膚降低修護壓力，適合需要密集修護、穩定屏障與提升細緻度時加入。",
    keyBenefit: "密集修護與屏障支持",
  },
  hydraMask: {
    name: "注水修護面膜",
    role: "加強保濕",
    amount: "每日 1 片，每次 10-15 分鐘",
    image: "assets/products/the-mask.jpg",
    routineImage: "assets/routine-products/the-mask.jpg",
    shopImage: "assets/routine-products/the-mask.jpg",
    href: "https://www.fascine.tw/",
    match: "快速補充水分與營養，適合乾燥、緊繃或需要短期密集修護的膚況。",
    keyBenefit: "高效補水與修護",
  },
  eyeCream: {
    name: "抗氧眼霜",
    role: "眼周養護",
    amount: "兩眼周各 3 顆綠豆大小",
    image: "assets/products/vital-c.jpg",
    routineImage: "assets/routine-products/vital-c.jpg",
    shopImage: "assets/routine-products/vital-c.jpg",
    href: "https://www.fascine.tw/",
    match: "針對眼周疲態與細紋感加強抗氧照護，讓整體膚況看起來更有精神。",
    keyBenefit: "眼周抗氧與細緻感",
  },
};

const productPriorityByMetric = {
  hydration: ["lotion", "serum22", "cream", "primer", "hydraMask"],
  evenness: ["sun", "vitalC", "primer", "mask"],
  redness: ["primer", "lotion", "cream", "exocell"],
  shine: ["primer", "balanceDew", "sun", "cleanser", "lotion"],
};

const metricTags = {
  hydration: "水潤加強",
  evenness: "透亮加強",
  redness: "舒緩穩定",
  shine: "清爽控光",
  daily: "日常基礎",
};

const metricProfiles = {
  hydration: {
    title: "補水修護型",
    english: "Hydration & Repair | Intensive Care",
    focus: "核心對策：以深度補水、長效鎖水與夜間密集修護為主軸，賦予肌膚飽滿澎潤的視覺質感。",
    reason: "本次水潤感較需要照顧，代表肌膚可能容易乾燥、緊繃或妝前不夠服貼，建議優先從補水與鎖水產品開始。",
  },
  evenness: {
    title: "透亮防護型",
    english: "Radiance & Defense | Priority Care",
    focus: "核心對策：以日間抗氧防護與夜間精準提亮為主軸，全方位勻亮膚色、重現澄淨光澤。",
    reason: "本次透亮與均勻度是主要觀察重點，代表肌膚可能容易暗沉、蠟黃或膚色不均，建議優先搭配防護與提亮產品。",
  },
  redness: {
    title: "舒緩穩定型",
    english: "Soothing & Stability | Priority Care",
    focus: "核心對策：以簡化保養程序與穩定肌膚屏障為首要目標，先回歸純淨健康，再開啟功能型保養。",
    reason: "本次舒緩穩定度較需要照顧，代表肌膚可能容易泛紅、敏弱或換季不穩，建議先選擇保濕修護與屏障照護產品。",
  },
  shine: {
    title: "清爽控光型",
    english: "Matte & Balance | Maintenance",
    focus: "核心對策：以清爽補水與日間控油防護為主，精準調控妝前油光，讓妝感細緻、不浮粉脫妝。",
    reason: "本次油光與皮脂平衡是主要觀察重點，代表肌膚可能容易出油、毛孔粗糙或 T 字泛光，建議優先從調理油水平衡與清爽防護產品開始。",
  },
};

const guideSkinProfiles = {
  dry: {
    label: "乾性肌照護",
    title: "乾性肌｜補水修護型",
    english: "Dry Skin | Hydration Repair",
    focus: "依官網保養指南方向，先以補水、鎖水與夜間修護為主，讓乾燥緊繃感先穩定下來。",
    reason: "本次判斷偏向乾燥缺水型，建議優先把前導、保濕與鎖水產品安排完整。",
    products: ["cleanser", "primer", "lotion", "cream", "serum22", "hydraMask"],
  },
  oilyAcne: {
    label: "油痘肌照護",
    title: "油痘肌｜清爽平衡型",
    english: "Oily Skin | Sebum Balance",
    focus: "依官網保養指南方向，先以溫和清潔、油水平衡與清爽防護為主，避免只去油卻忽略補水。",
    reason: "本次判斷偏向油光與毛孔調理需求，建議以清爽補水、局部平衡與白天防護為核心。",
    products: ["cleanser", "balanceDew", "primer", "sun", "lotion"],
  },
  sensitive: {
    label: "敏弱肌照護",
    title: "敏弱肌｜舒緩穩定型",
    english: "Sensitive Skin | Barrier Support",
    focus: "依官網保養指南方向，先簡化步驟並建立穩定屏障，再慢慢加入進階修護。",
    reason: "本次判斷偏向敏弱或不穩定狀態，建議先以舒緩、補水與屏障照護為第一順位。",
    products: ["cleanser", "primer", "lotion", "cream", "exocell"],
  },
  normalCombo: {
    label: "一般肌／混合肌照護",
    title: "一般肌／混合肌｜日常維持型",
    english: "Normal & Combination | Daily Balance",
    focus: "依官網保養指南方向，維持清潔、補水、防護與局部調理，讓膚況穩定累積。",
    reason: "本次判斷偏向日常維持與局部調整，建議用基礎步驟搭配局部加強，避免過度堆疊。",
    products: ["cleanser", "primer", "lotion", "sun", "balanceDew", "cream"],
  },
  dull: {
    label: "暗沉透亮照護",
    title: "暗沉肌｜透亮防護型",
    english: "Dull Skin | Radiance Defense",
    focus: "依官網保養指南方向，白天加強防護，夜間安排透亮與補水修護，讓膚色更乾淨有光澤。",
    reason: "本次判斷偏向暗沉與光澤不足，建議優先安排防曬、前導與提亮修護產品。",
    products: ["cleanser", "sun", "vitalC", "primer", "lotion", "mask"],
  },
};

function getMetricRanking(result) {
  return [
    ["hydration", result.hydration],
    ["evenness", result.evenness],
    ["redness", result.redness],
    ["shine", result.shine],
  ].sort((a, b) => a[1] - b[1]);
}

function getGuideSkinProfile(result) {
  const metrics = getMetricRanking(result);
  const lowest = metrics[0][0];
  const secondLowest = metrics[1][0];
  const oilySignal = result.tZoneHighlightRatio > 0.075 || hasConcern("shine") || result.shine < 64;
  const drySignal = hasConcern("hydration") || result.hydration < 64;
  const sensitiveSignal = hasConcern("redness") || result.redness < 64 || result.zoneSignals?.cheekRedness > 7;
  const dullSignal = hasConcern("evenness") || result.evenness < 64 || result.darkSpotRatio > 0.018;

  if (sensitiveSignal && (lowest === "redness" || secondLowest === "redness")) return guideSkinProfiles.sensitive;
  if (oilySignal && drySignal) {
    return result.shine <= result.hydration ? guideSkinProfiles.oilyAcne : guideSkinProfiles.dry;
  }
  if (oilySignal && (lowest === "shine" || secondLowest === "shine")) return guideSkinProfiles.oilyAcne;
  if (drySignal && (lowest === "hydration" || secondLowest === "hydration")) return guideSkinProfiles.dry;
  if (dullSignal && (lowest === "evenness" || secondLowest === "evenness")) return guideSkinProfiles.dull;
  return guideSkinProfiles.normalCombo;
}

function getShopProfile(result) {
  const metrics = getMetricRanking(result);
  const primary = metrics[0][0];
  const secondary = metrics[1][0];
  const profile = metricProfiles[primary];
  const guideProfile = getGuideSkinProfile(result);
  const secondaryText = metricTags[secondary].replace("加強", "").replace("控光", "控油光");
  const intensity = metrics[0][1] < 55 ? "優先補強" : metrics[0][1] < 68 ? "建議提升" : "穩定累積";
  const lifeText = customerProfile?.lifeLabel ? `，也把最近的「${customerProfile.lifeLabel}」納入照護節奏` : "";
  const projection = getEnergyProjection(result);

  return {
    title: `${guideProfile.title}｜${intensity}`,
    english: `Skin Score Plan | ${guideProfile.english}`,
    focus: `${guideProfile.focus} 同時參考本次分數，第二重點是${secondaryText}${customerProfile?.concernLabel ? `，並納入在意的「${customerProfile.concernLabel}」${lifeText}。` : "，照護步驟會依這兩個方向分層建議。"} ${projection.rhythm}`,
    reason: `建議原因：${guideProfile.reason} ${profile.reason}`,
    primary,
    secondary,
    guideProfile,
  };
}

function getSkinFingerprint(result) {
  const metrics = getMetricRanking(result);
  const primary = metrics[0][0];
  const secondary = metrics[1][0];
  const profile = metricProfiles[primary];
  let type = {
    hydration: result.hydration < 55 ? "缺水修護型肌膚" : "補水維持型肌膚",
    evenness: result.evenness < 55 ? "壓力暗沉型肌膚" : "透亮調理型肌膚",
    redness: result.redness < 55 ? "敏感守護型肌膚" : "舒緩穩定型肌膚",
    shine: result.shine < 55 ? "缺水偽油型肌膚" : "清爽平衡型肌膚",
  }[primary];
  if (hasLifeFactor("sleep") || hasLifeFactor("busy")) type = "熬夜奮鬥型肌膚";
  if (hasLifeFactor("stress") && primary === "redness") type = "敏感守護型肌膚";
  if (primary === "shine" && result.hydration < 62) type = "缺水偽油型肌膚";
  const textureLabel = result.textureEnergy >= 12 ? "紋理觀察明顯" : result.textureEnergy >= 7 ? "紋理觀察中等" : "膚表觀察平順";
  const typeNotes = {
    熬夜奮鬥型肌膚: "努力生活，經常把時間留給工作，卻忘記把時間留給自己。肌膚正在提醒妳，需要更穩定的補水與修護節奏。",
    敏感守護型肌膚: "天生比較細膩，對環境變化與壓力特別敏感，需要更多保濕、舒緩與屏障修護。",
    缺水偽油型肌膚: "表面看起來出油，其實肌底正在喊渴。先補水再控油，會比單純去油更適合妳。",
  };

  return {
    type,
    title: type,
    primaryLabel: metricTags[primary],
    secondaryLabel: metricTags[secondary],
    textureLabel,
    note: typeNotes[type] || `${profile.focus} 同時也觀察到${metricTags[secondary]}需要留意，建議依這個順序安排保養。`,
  };
}

function buildCoachLetter(result, fingerprint) {
  const name = "親愛的妳";
  const lifeText = customerProfile?.lifeLabel
    ? `這次問答中，我們也看見妳最近可能有「${customerProfile.lifeLabel}」的狀態。`
    : "這次問答中，我們也看見妳願意停下來，好好了解自己的肌膚。";
  return `
    <span>AI 顧問給妳的一封信</span>
    <strong>${name}</strong>
    <p>謝謝妳願意花時間了解自己。</p>
    <p>${lifeText}</p>
    <p>妳的肌膚其實沒有想像中糟糕，它只是正在提醒妳：該把一點關心留給自己了。</p>
    <p>未來的保養，不是為了變成別人，而是讓自己維持最舒服的狀態。接下來，就交給我們陪妳一起改善。</p>
    <small>— 梵希婗 FASCINÉ</small>
  `;
}

function getSkinEnergy(result) {
  return Math.round(clamp(result.overall, 1, 100));
}

function getSkinEnergyLevel(energy) {
  if (energy >= 96) return { level: 5, name: "梵希婗鑽石肌", min: 96, next: 100 };
  if (energy >= 86) return { level: 4, name: "發光肌養成期", min: 86, next: 96 };
  if (energy >= 76) return { level: 3, name: "透亮養成期", min: 76, next: 86 };
  if (energy >= 61) return { level: 2, name: "穩定修護期", min: 61, next: 76 };
  return { level: 1, name: "肌膚急救期", min: 0, next: 61 };
}

function getEnergyProjection(result) {
  const metrics = getMetricRanking(result);
  const primary = metrics[0][0];
  const careByMetric = {
    hydration: {
      product: "24HR 保濕精質蜜 + 小金球・精萃",
      direction: "先建立補水與鎖水節奏，讓乾燥紋理慢慢回到穩定狀態。",
      rhythm: "建議先連續 7 天維持補水，再於夜間加入滋養修護。",
    },
    evenness: {
      product: "裸紗／智慧防曬系列 + 亮白精華 C",
      direction: "先把日間防護做足，再用夜間提亮節奏慢慢調整暗沉與色差。",
      rhythm: "建議以 14 天為一個透亮觀察週期，避免一次疊太多活性產品。",
    },
    redness: {
      product: "亮膚奇肌露 + 極光晶潤霜",
      direction: "先簡化刺激來源，讓肌膚屏障進入比較安定的修護節奏。",
      rhythm: "建議先做 7 天舒緩觀察，再視穩定度加入進階保養。",
    },
    shine: {
      product: "平衡水光露 + 裸紗／智慧防曬系列",
      direction: "先補水再調理油光，讓 T 字與兩頰不需要用同一種厚度照顧。",
      rhythm: "建議以早上清爽、晚上修護的方式，連續觀察 7-14 天。",
    },
  };
  const careReadiness = {
    minimal: "先從低負擔基礎保養開始",
    basic: "可維持基礎保濕並加入一個補強重點",
    complete: "適合安排早晚分工的進階節奏",
    antioxidant: "可進入抗氧與透亮的週期管理",
    clinical: "建議以穩定修護為核心，逐步銜接功能型保養",
  }[customerProfile?.routineHabitValue] || "可先建立穩定保養節奏";
  const commitment = {
    simple: "極簡照護",
    daily: "日常穩定",
    intensive: "加強修護",
    completeCare: "全方位養成",
    flexible: "彈性調整",
  }[customerProfile?.routinePaceValue] || "保養養成";
  return {
    ...(careByMetric[primary] || careByMetric.hydration),
    careReadiness,
    commitment,
  };
}

function readPreviousSkinEnergy() {
  try {
    const raw = window.localStorage?.getItem(SKIN_ENERGY_HISTORY_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (!Number.isFinite(parsed.energy)) return null;
    return parsed;
  } catch {
    return null;
  }
}

function saveSkinEnergy(energy) {
  try {
    window.localStorage?.setItem(SKIN_ENERGY_HISTORY_KEY, JSON.stringify({
      energy,
      date: new Date().toISOString().slice(0, 10),
    }));
  } catch {
    // Local storage may be unavailable in some in-app browsers.
  }
}

function buildGrowthSystem(result, previousEnergy) {
  const energy = getSkinEnergy(result);
  const level = getSkinEnergyLevel(energy);
  const projection = getEnergyProjection(result);
  const potentialLabel = energy >= 86 ? "維持發光節奏" : energy >= 76 ? "有機會進入發光養成" : energy >= 61 ? "有機會進入透亮養成" : "先進入穩定修護";
  const progressText = previousEnergy
    ? energy >= previousEnergy.energy
      ? "比上次更接近下一階段"
      : "本次分數略低於上次，建議調整保養節奏"
    : "首次建立肌膚分數基準";
  const progressTone = previousEnergy && energy < previousEnergy.energy ? "提醒調整" : "持續累積";
  return `
    <span>Skin Score Journey</span>
    <strong>Lv.${level.level} ${level.name}</strong>
    <div class="growth-grid">
      <b><small>目前分數</small>${energy}/100</b>
      <b><small>上次參考</small>${previousEnergy ? `${previousEnergy.energy}/100` : "首次建立"}</b>
      <b><small>照護節奏</small>${projection.commitment}</b>
      <b><small>改善方向</small>${potentialLabel}</b>
    </div>
    <div class="energy-progress">
      <span>${progressTone}</span>
      <strong>${progressText}</strong>
      <small>下一階段：持續完成本次補強節奏，讓肌膚逐步往更穩定狀態推進。</small>
    </div>
    <small class="privacy-note">僅記錄上次分數作為本機參考，不儲存照片。</small>
    <p>${projection.careReadiness}。本次建議搭配 ${projection.product}，${projection.direction} ${projection.rhythm}</p>
  `;
}

function getAgeBenchmark(result) {
  const ageValue = customerProfile?.ageValue || "30s";
  const benchmarks = {
    under20: { range: "78-86", target: 82, label: "年輕肌穩定參考", note: "此年齡層通常以油水平衡、清爽度與防曬習慣作為維持重點。" },
    "20s": { range: "76-84", target: 80, label: "20+ 肌膚參考", note: "此年齡層建議把保濕、防曬與作息穩定做好，避免暗沉與油光反覆。" },
    "30s": { range: "72-82", target: 77, label: "30+ 肌膚參考", note: "此年齡層可開始重視補水鎖水、透亮度與妝前穩定度。" },
    "40s": { range: "68-78", target: 73, label: "40+ 肌膚參考", note: "此年齡層建議把修護、保濕與日間防護放在核心位置。" },
    "50up": { range: "64-76", target: 70, label: "熟齡肌參考", note: "此年齡層可優先看重滋潤度、柔嫩感與屏障穩定。" },
  };
  const benchmark = benchmarks[ageValue] || benchmarks["30s"];
  const gap = Math.round(result.overall - benchmark.target);
  const status = gap >= 7 ? "維持度不錯" : gap >= -6 ? "接近同齡參考" : "可加強保養";
  const suggestion = gap >= 7
    ? "目前整體維持度不錯，建議持續穩定防曬與日常保濕。"
    : gap >= -6
      ? "目前落在可維持區間，依本次較低項目微調保養即可。"
      : "目前有幾個項目適合優先照顧，建議先連續保養 7 天，再用同光源重新檢測追蹤變化。";

  return {
    ...benchmark,
    gap,
    status,
    suggestion,
  };
}

function getCareRhythmInsight(result) {
  const lowMetrics = getMetricRanking(result).slice(0, 2).map(([key]) => key);
  const hasStressLoad = hasLifeFactor("sleep") || hasLifeFactor("stress") || hasLifeFactor("busy") || hasLifeFactor("selfcare");
  const prefersSimple = customerProfile?.routinePaceValue === "simple" || customerProfile?.routinePaceValue === "flexible";
  const wantsMoreCare = ["intensive", "completeCare"].includes(customerProfile?.routinePaceValue);

  if (lowMetrics.includes("redness") || hasStressLoad) {
    return {
      title: "修護節奏",
      tip: "目前比較適合先降低保養刺激感，把補水、舒緩與鎖水固定 7 天，再逐步加入提亮或加強型產品。",
    };
  }

  if (lowMetrics.includes("shine")) {
    return {
      title: "油水平衡",
      tip: "建議不要只做去油，先用清爽補水穩住肌膚，再把 T 字與兩頰分區調整，妝前狀態會更穩。",
    };
  }

  if (lowMetrics.includes("evenness")) {
    return {
      title: "透亮節奏",
      tip: "白天防護與晚間提亮要一起做，先穩定防曬，再安排溫和亮膚保養，膚色均勻度會更好追蹤。",
    };
  }

  if (wantsMoreCare) {
    return {
      title: "進階照護",
      tip: "肌膚可以接受更完整的保養節奏，但加強型產品建議分天加入，避免一次疊太多造成負擔。",
    };
  }

  return {
    title: prefersSimple ? "高效保養節奏" : "日常維持節奏",
    tip: prefersSimple
      ? "目前適合把流程維持在清潔、補水、防護與夜間修護，先用少步驟做出穩定感。"
      : "目前可以維持早晚基礎保養，並依當週膚況微調保濕、提亮與防護的比例。",
  };
}

function getRecommendedProducts(result) {
  const metrics = getMetricRanking(result);
  const guideProfile = getGuideSkinProfile(result);
  const paceLabel = customerProfile?.routinePaceLabel || "";
  const scenarioLabel = customerProfile?.skinScenarioLabel || "";
  const concernLabel = customerProfile?.concernLabel || "";

  const deficit = {
    hydration: 100 - result.hydration,
    evenness: 100 - result.evenness,
    redness: 100 - result.redness,
    shine: 100 - result.shine,
  };
  const zoneSignals = result.zoneSignals || {};
  const zoneOil = zoneSignals.tZoneOil || 0;
  const zoneTexture = zoneSignals.cheekTexture || 0;
  const zoneTone = zoneSignals.tone || 0;
  const zoneRedness = zoneSignals.cheekRedness || 0;

  const productScores = {
    cleanser: {
      score: 22 + deficit.shine * 0.28 + deficit.redness * 0.18 + zoneOil * 0.72,
      reason: "讓清潔步驟穩定，避免後續保養被油光或髒污影響。",
    },
    lotion: {
      score: 30 + deficit.hydration * 0.8 + deficit.redness * 0.55 + deficit.shine * 0.18 + zoneTexture * 1.4 + zoneRedness * 0.8,
      reason: "先補水打底，適合乾燥、泛紅或妝前不穩定時優先使用。",
    },
    cream: {
      score: 14 + deficit.hydration * 0.88 + deficit.redness * 0.62 - deficit.shine * 0.28 + zoneTexture * 1.1 + zoneRedness * 1.2,
      reason: "晚間鎖水修護，適合兩頰乾、粗糙或泛紅時加強。",
    },
    sun: {
      score: 28 + deficit.evenness * 0.78 + deficit.shine * 0.32 + zoneTone * 0.9 + zoneOil * 0.35,
      reason: "白天穩定防護，膚色不均、暗沉或妝前油光時優先查看。",
    },
    vitalC: {
      score: 6 + deficit.evenness * 1.05 + result.darkSpotRatio * 180 + zoneTone * 1.3 + (result.redness >= 62 ? 10 : -18),
      reason: "膚色不均、暗沉與斑點感明顯時，晚間少量加入。",
    },
    mask: {
      score: 8 + deficit.evenness * 0.68 + deficit.hydration * 0.26 + (result.redness >= 58 ? 8 : -14),
      reason: "想加強透亮與儀式感時使用；泛紅明顯時先降低頻率。",
    },
    serum22: {
      score: 8 + deficit.hydration * 0.92 + result.textureEnergy * 2.1 + zoneTexture * 1.6 + (result.shine >= 58 ? 8 : -6),
      reason: "水潤感不足或紋理較明顯時，放在晚間修護步驟。",
    },
    primer: {
      score: 34 + deficit.redness * 0.58 + deficit.evenness * 0.5 + deficit.hydration * 0.32 + zoneRedness * 1.25 + zoneTone * 0.5,
      reason: "作為前導步驟，幫助後續保養銜接，適合泛紅、乾燥或膚色疲態時加入。",
    },
    balanceDew: {
      score: 10 + deficit.shine * 0.82 + deficit.evenness * 0.32 + result.tZoneHighlightRatio * 120 + zoneOil * 1.8,
      reason: "針對 T 字油光與膚況不穩，協助調理油水平衡與膚色明亮感。",
    },
    exocell: {
      score: 6 + deficit.redness * 0.65 + deficit.hydration * 0.44 + result.textureEnergy * 1.2 + zoneRedness * 1.3 + zoneTexture * 0.8,
      reason: "適合修護壓力較高、屏障需要穩定或想進階加強的人。",
    },
    hydraMask: {
      score: 6 + deficit.hydration * 0.8 + deficit.redness * 0.28,
      reason: "短期加強補水，適合乾燥緊繃或想快速提升水潤感時安排。",
    },
    eyeCream: {
      score: 4 + deficit.evenness * 0.36 + result.textureEnergy * 1.6 + (hasScenario("ageing") ? 18 : 0),
      reason: "適合眼周疲態、細緻度與逆齡照護需求較高時搭配。",
    },
  };

  if (hasConcern("hydration")) {
    productScores.lotion.score += 24;
    productScores.cream.score += 18;
    productScores.primer.score += 12;
    productScores.serum22.score += 12;
    productScores.hydraMask.score += 18;
  }
  if (hasConcern("evenness")) {
    productScores.vitalC.score += 24;
    productScores.sun.score += 18;
    productScores.mask.score += 12;
    productScores.primer.score += 10;
  }
  if (hasConcern("redness")) {
    productScores.lotion.score += 22;
    productScores.cream.score += 22;
    productScores.primer.score += 18;
    productScores.exocell.score += 12;
    productScores.vitalC.score -= 12;
    productScores.mask.score -= 8;
  }
  if (hasConcern("shine")) {
    productScores.cleanser.score += 20;
    productScores.primer.score += 8;
    productScores.sun.score += 14;
    productScores.lotion.score += 8;
    productScores.balanceDew.score += 24;
  }
  if (hasConcern("texture")) {
    productScores.serum22.score += 24;
    productScores.cream.score += 12;
    productScores.lotion.score += 10;
    productScores.exocell.score += 10;
  }
  if (hasConcern("fineLines")) {
    productScores.serum22.score += 22;
    productScores.cream.score += 16;
    productScores.vitalC.score += 8;
    productScores.eyeCream.score += 16;
  }
  if (hasLifeFactor("sleep") || hasLifeFactor("stress") || hasLifeFactor("selfcare")) {
    productScores.primer.score += 14;
    productScores.lotion.score += 12;
    productScores.cream.score += 10;
    productScores.vitalC.score += 8;
  }
  if (hasLifeFactor("ac")) {
    productScores.lotion.score += 16;
    productScores.cream.score += 12;
  }
  if (hasLifeFactor("diet")) {
    productScores.cleanser.score += 8;
    productScores.sun.score += 8;
  }
  if (customerProfile?.routineHabitValue === "minimal") {
    productScores.lotion.score += 12;
    productScores.cream.score += 10;
  }
  if (customerProfile?.routineHabitValue === "complete") {
    productScores.vitalC.score += 8;
    productScores.serum22.score += 8;
  }
  if (customerProfile?.routineHabitValue === "antioxidant") {
    productScores.vitalC.score += 10;
    productScores.mask.score += 10;
    productScores.eyeCream.score += 10;
  }
  if (customerProfile?.routineHabitValue === "clinical") {
    productScores.lotion.score += 12;
    productScores.cream.score += 12;
    productScores.exocell.score += 16;
    productScores.vitalC.score -= 6;
  }
  if (hasScenario("makeup")) {
    productScores.primer.score += 12;
    productScores.lotion.score += 12;
    productScores.sun.score += 12;
    productScores.cleanser.score += 6;
  }
  if (hasScenario("bare")) {
    productScores.vitalC.score += 16;
    productScores.mask.score += 12;
    productScores.sun.score += 10;
  }
  if (hasScenario("stress")) {
    productScores.vitalC.score += 12;
    productScores.cream.score += 10;
  }
  if (hasScenario("season")) {
    productScores.lotion.score += 14;
    productScores.cream.score += 14;
    productScores.primer.score += 12;
  }
  if (hasScenario("ageing")) {
    productScores.serum22.score += 18;
    productScores.cream.score += 12;
    productScores.eyeCream.score += 18;
    productScores.exocell.score += 10;
  }
  if (customerProfile?.routinePaceValue === "simple") {
    productScores.lotion.score += 12;
    productScores.sun.score += 10;
    productScores.cleanser.score += 8;
    productScores.vitalC.score -= 6;
    productScores.mask.score -= 8;
  }
  if (customerProfile?.routinePaceValue === "daily") {
    productScores.lotion.score += 10;
    productScores.cream.score += 8;
    productScores.sun.score += 8;
  }
  if (customerProfile?.routinePaceValue === "intensive") {
    productScores.lotion.score += 16;
    productScores.serum22.score += 12;
    productScores.vitalC.score += 14;
    productScores.mask.score += 10;
    productScores.exocell.score += 14;
    productScores.eyeCream.score += 10;
  }
  if (customerProfile?.routinePaceValue === "completeCare") {
    productScores.serum22.score += 16;
    productScores.vitalC.score += 16;
    productScores.mask.score += 12;
    productScores.exocell.score += 16;
    productScores.hydraMask.score += 12;
    productScores.eyeCream.score += 12;
  }
  if (customerProfile?.routinePaceValue === "flexible") {
    productScores.lotion.score += 12;
    productScores.cream.score += 10;
  }
  guideProfile.products.forEach((key, index) => {
    if (productScores[key]) productScores[key].score += 48 - index * 5;
  });

  const tagForProduct = (key) => {
    const relatedMetric = metrics.find(([metricKey]) => productPriorityByMetric[metricKey].includes(key));
    return relatedMetric ? metricTags[relatedMetric[0]] : metricTags.daily;
  };

  const reasonForProduct = (key, baseReason) => {
    const primary = metrics[0][0];
    const secondary = metrics[1][0];
    const priorityText = productPriorityByMetric[primary].includes(key)
      ? "本次照護計畫第一順位。"
      : productPriorityByMetric[secondary].includes(key)
        ? "搭配加強本次第二照護重點。"
        : "作為延伸補充，讓整套照護更完整。";
    const answerText = customerProfile
      ? `依你選擇「${concernLabel}、${scenarioLabel}、${paceLabel}」調整排序。`
      : "";
    return `${priorityText}${answerText}${fascineProducts[key].keyBenefit}：${baseReason}`;
  };

  const sorted = Object.entries(productScores)
    .map(([key, data]) => ({
      ...fascineProducts[key],
      tag: tagForProduct(key),
      match: reasonForProduct(key, data.reason),
      priorityScore: data.score,
      productKey: key,
    }))
    .sort((a, b) => b.priorityScore - a.priorityScore);

  const primaryKey = metrics[0][0];
  const guideProducts = guideProfile.products
    .map((key) => sorted.find((product) => product.name === fascineProducts[key].name))
    .filter(Boolean);
  const fallbackPrimaryProducts = productPriorityByMetric[primaryKey]
    .slice(0, primaryKey === "redness" ? 2 : 3)
    .map((key) => sorted.find((product) => product.name === fascineProducts[key].name))
    .filter(Boolean);
  const primaryProducts = (guideProducts.length ? guideProducts : fallbackPrimaryProducts).slice(0, 3);
  const answerProductKeys = new Set();
  const addAnswerProducts = (...keys) => keys.forEach((key) => answerProductKeys.add(key));
  addAnswerProducts(...guideProfile.products);

  if (hasConcern("hydration")) addAnswerProducts("lotion", "cream", "serum22", "hydraMask");
  if (hasConcern("evenness")) addAnswerProducts("sun", "vitalC", "mask", "primer");
  if (hasConcern("redness")) addAnswerProducts("primer", "lotion", "cream", "exocell");
  if (hasConcern("shine")) addAnswerProducts("primer", "balanceDew", "sun", "cleanser", "lotion");
  if (hasConcern("texture")) addAnswerProducts("serum22", "cream", "lotion", "exocell");
  if (hasConcern("fineLines")) addAnswerProducts("serum22", "cream", "vitalC", "eyeCream");

  if (customerProfile?.routineHabitValue === "minimal") addAnswerProducts("cleanser", "primer", "lotion", "sun");
  if (customerProfile?.routineHabitValue === "basic") addAnswerProducts("primer", "lotion", "cream", "sun");
  if (customerProfile?.routineHabitValue === "complete") addAnswerProducts("vitalC", "mask", "serum22", "balanceDew");
  if (customerProfile?.routineHabitValue === "antioxidant") addAnswerProducts("vitalC", "mask", "serum22", "eyeCream");
  if (customerProfile?.routineHabitValue === "clinical") addAnswerProducts("primer", "lotion", "cream", "exocell", "sun");

  if (hasScenario("makeup")) addAnswerProducts("lotion", "sun", "cleanser", "balanceDew");
  if (hasScenario("bare")) addAnswerProducts("vitalC", "mask", "sun", "primer");
  if (hasScenario("stress")) addAnswerProducts("vitalC", "cream", "mask", "exocell");
  if (hasScenario("season")) addAnswerProducts("primer", "lotion", "cream", "serum22");
  if (hasScenario("ageing")) addAnswerProducts("serum22", "cream", "vitalC", "eyeCream");

  if (customerProfile?.routinePaceValue === "simple") addAnswerProducts("cleanser", "primer", "lotion", "sun");
  if (customerProfile?.routinePaceValue === "daily") addAnswerProducts("cleanser", "primer", "lotion", "cream", "sun", "vitalC");
  if (customerProfile?.routinePaceValue === "intensive") addAnswerProducts("cleanser", "primer", "lotion", "cream", "sun", "vitalC", "mask", "serum22", "exocell");
  if (customerProfile?.routinePaceValue === "completeCare") addAnswerProducts("cleanser", "primer", "serum22", "lotion", "balanceDew", "cream", "sun", "vitalC", "mask", "exocell", "eyeCream");
  if (customerProfile?.routinePaceValue === "flexible") addAnswerProducts("cleanser", "primer", "lotion", "cream", "sun", "balanceDew");

  const answerProducts = Array.from(answerProductKeys)
    .map((key) => sorted.find((product) => product.name === fascineProducts[key].name))
    .filter(Boolean);

  const picked = new Map();
  const targetCount = ["intensive", "completeCare"].includes(customerProfile?.routinePaceValue)
    ? 7
    : customerProfile?.routinePaceValue === "simple"
      ? 4
      : metrics[0][1] < 55 || metrics[1][1] < 58
        ? 6
        : 5;
  [...primaryProducts, ...answerProducts, ...sorted].forEach((product) => {
    if (picked.size < targetCount && !picked.has(product.name)) picked.set(product.name, product);
  });

  const primerProduct = sorted.find((product) => product.name === fascineProducts.primer.name);
  if (primerProduct && !picked.has(primerProduct.name)) {
    if (picked.size >= targetCount) {
      const replaceable = Array.from(picked.values()).reverse().find((product) => product.name !== fascineProducts.lotion.name);
      if (replaceable) picked.delete(replaceable.name);
    }
    if (picked.size < targetCount) picked.set(primerProduct.name, primerProduct);
  }

  if (["intensive", "completeCare"].includes(customerProfile?.routinePaceValue)) {
    ["vitalC", "mask", "serum22", "exocell", "eyeCream"].forEach((key) => {
      const product = sorted.find((item) => item.name === fascineProducts[key].name);
      if (product && picked.size < 7 && !picked.has(product.name)) picked.set(product.name, product);
    });
  }

  return Array.from(picked.values()).map((product, index) => ({
    ...product,
    rankLabel: index === 0 ? "本次優先" : index < 3 ? "搭配加強" : "可選擇補充",
  }));
}

function renderProductCard(product, compact = false) {
  const stepLabel = product.rankLabel === "本次優先"
    ? "第一步"
    : product.rankLabel === "搭配加強"
      ? "第二步"
      : product.rankLabel === "基礎必備"
        ? "基礎保養"
        : "延伸照護";
  return `
    <article class="product-card product-${product.productKey || "item"}${compact ? " compact" : ""}">
      <div class="product-image">
        <img src="${product.shopImage || product.image}" alt="${product.name}" loading="lazy" />
        <span>${product.tag}</span>
      </div>
      <div class="product-card-body">
        <small>${stepLabel} · ${product.rankLabel || product.role}</small>
        <strong>${product.name}</strong>
        <p>${product.amount}</p>
        ${compact ? "" : `<em><b>推薦購買原因</b>${product.match}</em>`}
        <a href="${product.href}" rel="noopener">查看產品</a>
      </div>
    </article>
  `;
}

function renderProductRecommendations(products, profile) {
  const cleanserProduct = products.find((product) => product.productKey === "cleanser") || {
    ...fascineProducts.cleanser,
    productKey: "cleanser",
    tag: metricTags.daily,
    rankLabel: "基礎必備",
    match: "不論偏乾、出油、泛紅或暗沉，清潔都是保養吸收與後續穩定度的第一步。先把皮脂、髒污與防曬殘留洗乾淨，後續保濕與修護才更好銜接。",
  };
  const skinProducts = products.filter((product) => product.productKey !== "cleanser");
  const priorityProducts = skinProducts.slice(0, 3);
  const optionalProducts = skinProducts.slice(3);
  const priorityNames = priorityProducts.map((product) => product.name).join("、");
  fields.shopProfile.innerHTML = `
    <span>專屬改善主軸</span>
    <strong>${profile.title}</strong>
    <em>${profile.english}</em>
    <p>${profile.reason} ${profile.focus}</p>
    <p class="shop-priority-reason">依官網保養指南分類，本次偏向「${profile.guideProfile?.label || "日常照護"}」。建議先看：${priorityNames}。這 3 個品項會依照目前較需要照顧的狀態與問答結果排序，先處理最明顯的保養需求，再依照肌膚反應慢慢補齊照護節奏。</p>
  `;
  fields.shoppingList.innerHTML = `
    <div class="product-section product-section-basic">
      <div class="product-section-title">
        <span>Base Care</span>
        <strong>基礎必備</strong>
      </div>
      <div class="product-grid-inner product-grid-basic">
        ${renderProductCard({ ...cleanserProduct, rankLabel: "基礎必備" })}
      </div>
    </div>
    <div class="product-section">
      <div class="product-section-title">
        <span>Priority 01</span>
        <strong>本次優先建議</strong>
      </div>
      <div class="product-grid-inner">
        ${priorityProducts.map((product) => renderProductCard(product)).join("")}
      </div>
    </div>
    ${optionalProducts.length ? `
      <div class="product-section product-section-optional">
        <div class="product-section-title">
          <span>Optional Care</span>
          <strong>想加強再查看</strong>
        </div>
        <div class="product-grid-inner">
          ${optionalProducts.map((product) => renderProductCard(product)).join("")}
        </div>
      </div>
    ` : ""}
  `;
}

const routineBlueprint = {
  day: {
    title: "日間防禦：平衡與防護",
    english: "Day Routine: Balance & Protect",
    icon: "☀",
    steps: [
      ["晨間洗淨", "雙效潔顏凝露", "cleanser", "在清潔過程中形成細緻潔淨網，溫和洗淨夜間分泌皮脂與髒污，還原柔嫩水光的原始膚觸。"],
      ["前導緊緻", "亮膚奇肌露", "primer", "全方位潤澤並緊緻肌膚，賦予彈力與透亮光澤，瞬間開啟後續保養的吸收通道。"],
      ["黃金修護", "小金球・精萃", "serum22", "為肌膚注入高營養修護養分，柔化粗糙與微細紋路，重現水潤緊緻的絲滑膚觸。"],
      ["海量注水", "24HR 保濕精質蜜", "lotion", "多重補水與鎖水機制同步啟動，維持肌膚長效含水度，打造全天候飽滿澎潤的水感肌。"],
      ["煥膚調理", "平衡水光露", "balanceDew", "溫和更新角質、調理油水平衡。舒緩肌膚不適，使膚況更加穩定，同時勻亮膚色。"],
      ["逆齡發光", "極光晶潤霜", "cream", "為肌膚注入盈潤滋養的頂級呵護，保持柔嫩與彈性，有感提升膚色明亮度、告別疲態。"],
      ["全面防護", "裸紗／智慧防曬系列", "sun", "具備 SPF50+ 最高防護力。於保養程序完成後，取適量均勻塗抹於臉部與頸部，為肌膚鋪開高效抗氧防護網。"],
    ],
  },
  night: {
    title: "夜間修護：深度滋養",
    english: "Night Routine: Deep Repair",
    icon: "☾",
    steps: [
      ["深度洗淨", "雙效潔顏凝露", "cleanser", "在清潔過程中形成細緻潔淨網，溫和洗淨彩妝、殘留髒污與老廢角質，還原柔嫩水光的膚觸。"],
      ["前導緊緻", "亮膚奇肌露", "primer", "全方位潤澤並緊緻肌膚，賦予彈力與透亮光澤，瞬間開啟後續保養的吸收通道。"],
      ["黃金修護", "小金球・精萃", "serum22", "為肌膚注入高營養修護養分，柔化粗糙與微細紋路，重現水潤緊緻的絲滑膚觸。"],
      ["海量注水", "24HR 保濕精質蜜", "lotion", "多重補水與鎖水機制同步啟動，維持肌膚長效含水度，打造全天候飽滿澎潤的水感肌。"],
      ["煥膚調理", "平衡水光露", "balanceDew", "溫和更新角質、調理油水平衡。舒緩肌膚不適，使膚況更加穩定，同時勻亮膚色。"],
      ["逆齡發光", "極光晶潤霜", "cream", "為肌膚注入盈潤滋養的頂級呵護，保持柔嫩與彈性，有感提升膚色明亮度、告別疲態。"],
    ],
  },
};

function renderRoutineProductChip(key) {
  const product = fascineProducts[key];
  if (!product) return "";
  return `
    <span class="routine-product">
      <img src="${product.routineImage || product.image}" alt="${product.name}" loading="lazy" />
      <small>${product.name}</small>
    </span>
  `;
}

function getRoutineModeAdvice(result) {
  const pace = customerProfile?.routinePaceValue;
  const habit = customerProfile?.routineHabitValue;
  if (["intensive", "antioxidant", "clinical"].includes(pace) || ["antioxidant", "clinical"].includes(habit)) {
    return {
      title: "進階保養模式",
      english: "Advanced Mode",
      text: "進階加入『外泌源、亮白精華C、抗氧眼霜與面膜系列』。初期每週 2-3 次，7 天後待肌膚完全適應，即可提升為每日保養。溫馨提醒：外泌源與亮白精華C因活性成分濃度較高，建議早晚錯開使用。",
    };
  }
  if (["completeCare", "daily"].includes(pace) || habit === "complete") {
    return {
      title: "全方位保養模式",
      english: "Comprehensive Mode",
      text: "日間以輕盈保養與抗氧防護為主，夜間著重於密集補水與深度修護。若當天有使用防曬或底妝，夜間清潔後請先觀察肌膚是否有緊繃或泛紅現象，並適時調整『極光晶潤霜』的用量。",
    };
  }
  return {
    title: "基礎保養模式",
    english: "Essential Mode",
    text: "日間請先保留『雙效潔顏凝露、亮膚奇肌露、保濕精質蜜、防曬產品』；夜間保留『雙效潔顏凝露、亮膚奇肌露、小金球精萃、保濕精質蜜』。先讓肌膚穩定調理 7 天後，再逐步加入加強型調理精華或乳霜。",
  };
}

function getScoreAdaptations(result) {
  const metrics = getMetricRanking(result).slice(0, 2).map(([key]) => key);
  const pool = {
    hydration: [
      ["加強保濕", "Hydration Boost", "晚間保養時，『保濕精質蜜』可按壓 10 下作為厚敷鎖水使用，密集提升含水量。"],
      ["滋養頻率", "Nourishment Frequency", "推薦早晚使用 1-2 顆『小金球精萃』，能高效穩定膚況，打造健康透亮的肌底。"],
    ],
    evenness: [
      ["提亮方案", "Radiance Enhancement", "推薦於保養程序中加入適量『亮白精華C』，有感提升肌膚光澤度，迅速擺脫蠟黃暗沉。"],
      ["面膜頻率", "Masking Routine", "建議連續每日使用 1 片面膜，每次 10-15 分鐘，敷後接續日常保養，在最短時間內完成高效營養補充。"],
    ],
    redness: [
      ["舒緩方案", "Soothing Relief", "推薦使用含有甘草精華的『亮膚奇肌露』適量噴灑於全臉，溫柔安撫並 Hold 住不穩定膚況。"],
      ["敏弱節奏", "Sensitive Skin Rhythm", "逆齡抗氧系列如亮白精華C、外泌源、抗氧眼霜，請先調整為每週 1-2 晚使用，並於夜間加強搭配『極光晶潤霜』建立防護層。"],
    ],
    shine: [
      ["油光調整", "Sebum Control", "日間將『平衡水光露』適量局部使用於 T 字部位；夜間可將水光露滴入『極光晶潤霜』中混合均勻後塗抹，溫和調理出油狀況。"],
      ["妝前防護", "Makeup Prep", "建議將『裸紗／智慧防曬系列』均勻且足量地塗抹於全臉與頸部肌膚，築起完美的妝前防護防線。"],
    ],
  };
  return metrics.flatMap((key) => pool[key]).slice(0, 4);
}

function renderRoutineRecommendations(result) {
  const mode = currentRoutineMode;
  const routine = routineBlueprint[mode] || routineBlueprint.day;
  const modeAdvice = getRoutineModeAdvice(result);
  const scoreAdvice = getScoreAdaptations(result);
  document.querySelectorAll("[data-routine-tab]").forEach((button) => {
    button.classList.toggle("active", button.dataset.routineTab === mode);
  });
  fields.routineList.innerHTML = `
    <section class="routine-hero ${mode}">
      <span>${routine.icon}</span>
      <div>
        <strong>${routine.title}</strong>
        <em>${routine.english}</em>
      </div>
    </section>
    <div class="routine-steps">
      ${routine.steps.map(([title, productName, productKey, body], index) => `
        <article class="routine-step ${mode === "day" ? "day" : "night"}">
          <span class="step-number">${String(index + 1).padStart(2, "0")}</span>
          <span class="step-icon" aria-hidden="true">${mode === "day" ? "Day" : "Night"}</span>
          <div>
            <strong>${title}｜${productName}</strong>
            <p>${body}</p>
            <div class="routine-products">${renderRoutineProductChip(productKey)}</div>
          </div>
        </article>
      `).join("")}
    </div>
    <section class="ai-advice-bubble">
      <span>AI Personalized Adaptations</span>
      <strong>${modeAdvice.title} <small>${modeAdvice.english}</small></strong>
      <p>${modeAdvice.text}</p>
    </section>
    <div class="adaptation-grid">
      ${scoreAdvice.map(([title, english, text]) => `
        <article>
          <span>${english}</span>
          <strong>${title}</strong>
          <p>${text}</p>
        </article>
      `).join("")}
    </div>
    <section class="care-cycle">
      <strong>護膚週期建議 <small>Long-term Care</small></strong>
      <p><b>7 天肌膚追蹤：</b>請先連續 7 天依照上述建議調整，避免一次將過多全新產品加入流程，有助於精準觀察肌膚的真實正向反應。</p>
      <p><b>週期性健康檢測：</b>建議每週在相同的光源環境下，運用本 AI 系統重新檢測 1 次，依當週狀態動態微調產品用量與頻率。</p>
    </section>
  `;
}

function parseRoutineItem(item) {
  const [title, ...bodyParts] = item.split("｜");
  const body = bodyParts.join("｜");
  const stepType = title.includes("晨間")
    ? "morning"
    : title.includes("日間")
      ? "day"
      : title.includes("夜間")
        ? "night"
        : title.includes("追蹤") || title.includes("週期")
          ? "track"
          : "boost";
  const icon = title.includes("潔淨") || title.includes("清潔")
    ? "淨膚"
    : title.includes("補水")
      ? "補濕"
      : title.includes("防護")
        ? "防禦"
        : title.includes("修護")
          ? "修護"
          : title.includes("提亮")
            ? "亮膚"
            : title.includes("面膜")
              ? "敷膜"
              : title.includes("油光")
                ? "控衡"
                : title.includes("舒緩") || title.includes("敏弱")
                  ? "安膚"
                  : "調理";

  return { title, body, stepType, icon };
}

function getRoutineProducts(title) {
  if (title.includes("潔淨") || title.includes("清潔")) return ["cleanser"];
  if (title.includes("補水")) return ["lotion"];
  if (title.includes("日間防護") || title.includes("妝前防護")) return ["sun"];
  if (title.includes("夜間修護")) return ["lotion", "cream"];
  if (title.includes("保濕加強") || title.includes("舒緩方案")) return ["cream", "lotion"];
  if (title.includes("滋養")) return ["serum22"];
  if (title.includes("提亮")) return ["vitalC"];
  if (title.includes("面膜")) return ["mask"];
  if (title.includes("油光調整")) return ["lotion", "sun"];
  if (title.includes("敏弱")) return ["lotion", "cream"];
  return [];
}

function renderRoutineStep(item, index) {
  const step = parseRoutineItem(item);
  const products = getRoutineProducts(step.title);
  const productImages = products
    .map((key) => fascineProducts[key])
    .map(
      (product) => `
        <span class="routine-product">
          <img src="${product.routineImage || product.image}" alt="${product.name}" loading="lazy" />
          <small>${product.name}</small>
        </span>
      `,
    )
    .join("");

  return `
    <li class="routine-step ${step.stepType}">
      <span class="step-number">${String(index + 1).padStart(2, "0")}</span>
      <span class="step-icon" aria-hidden="true">${step.icon}</span>
      <div>
        <strong>${step.title}</strong>
        <p>${step.body}</p>
        ${productImages ? `<div class="routine-products">${productImages}</div>` : ""}
      </div>
    </li>
  `;
}

function buildFascineRoutine(result) {
  const metrics = [
    {
      key: "hydration",
      title: "水潤感",
      score: result.hydration,
      reason: `水潤感 ${scoreText(result.hydration)}，紋理變化 ${result.textureEnergy.toFixed(1)}`,
      primary: "主推：24HR 保濕精質蜜 + 極光晶潤霜。24HR 保濕精質蜜先補水，極光晶潤霜放在晚間最後一步鎖水。",
      support: "加強：若水潤感低於 55，每週 2-3 次加入小金球・精萃，放在 24HR 保濕精質蜜後、霜前。",
    },
    {
      key: "evenness",
      title: "均勻度",
      score: result.evenness,
      reason: `均勻度 ${scoreText(result.evenness)}，平均色差 ${result.variance.toFixed(1)}，暗沉/斑點 ${(result.darkSpotRatio * 100).toFixed(1)}%`,
      primary: "主推：亮白精華 C。晚間保濕前使用，針對暗沉、膚色不均與斑點感。",
      support: "加強：若均勻度低於 60，每週 1-2 次搭配智慧淨白面膜；白天固定用裸紗防曬。",
    },
    {
      key: "redness",
      title: "泛紅",
      score: result.redness,
      reason: `泛紅 ${scoreText(result.redness)}，泛紅取樣 ${(result.rednessRatio * 100).toFixed(1)}%`,
      primary: "主推：24HR 保濕精質蜜 + 極光晶潤霜。先把流程簡化，降低刺激、穩定屏障。",
      support: "加強：若泛紅低於 55，亮白精華 C 先降到每週 1-2 次，智慧淨白面膜暫時減量，等泛紅穩定後再增加。",
    },
    {
      key: "shine",
      title: "油光",
      score: result.shine,
      reason: `油光 ${scoreText(result.shine)}，全臉高光 ${(result.highlightRatio * 100).toFixed(1)}%，T 字高光 ${(result.tZoneHighlightRatio * 100).toFixed(1)}%`,
      primary: "主推：裸紗防曬。白天少量分區上，T 字薄擦，兩頰依乾燥程度調整。",
      support: "加強：若油光低於 60，早上 24HR 保濕精質蜜薄擦即可；極光晶潤霜改放晚上或只擦乾燥區。",
    },
  ].sort((a, b) => a.score - b.score);

  const primary = metrics[0];
  const secondary = metrics[1];
  const routine = [
    `晨間潔淨｜雙效潔顏凝露約 1 顆黃豆大小，加水起泡後輕洗 20-30 秒，洗後不要有緊繃感。`,
    `晨間補水｜24HR 保濕精質蜜 1-2 泵，以按壓方式帶過全臉；T 字容易出油時先用 1 泵即可。`,
    `日間防護｜裸紗防曬約 2 指節量，全臉均勻擦，額頭、鼻樑與兩頰外側記得補足。`,
    `夜間清潔｜雙效潔顏凝露 1 顆黃豆大小清潔；若有防曬或底妝，可清潔兩次但力道放輕。`,
    `夜間修護｜24HR 保濕精質蜜 1-2 泵打底，再擦極光晶潤霜約 1 顆珍珠大小，放在最後一步鎖水。`,
  ];

  if (customerProfile?.routinePaceValue === "simple") {
    routine.push("簡化優先｜早上保留潔淨、補水、防護；晚上保留清潔、補水、鎖水。先讓肌膚穩定 7 天，加強型精華與面膜不急著同時加入。");
  }

  if (customerProfile?.routinePaceValue === "daily") {
    routine.push("早晚完整｜早上以清爽防護為主，晚上以補水修護為主。若當天有防曬或底妝，夜間清潔後先觀察是否緊繃，再調整極光晶潤霜用量。");
  }

  if (customerProfile?.routinePaceValue === "intensive") {
    routine.push("加強保養｜加強品項不要每天全部疊加。亮白精華 C 先安排晚間 2-3 次，智慧淨白面膜每週 1-2 次，小金球・精萃放在乾燥或粗糙感明顯的晚上。");
  }

  if (customerProfile?.routinePaceValue === "completeCare") {
    routine.push("全方位護膚｜可以把保養拆成「每日基礎」與「每週加強」。每日先穩定清潔、補水、防護；每週再安排亮白精華 C、智慧淨白面膜與小金球・精萃，避免同一天堆疊過多刺激。");
  }

  if (customerProfile?.routinePaceValue === "flexible") {
    routine.push("彈性調整｜肌膚穩定時維持基礎保濕與防曬；乾燥或熬夜後加極光晶潤霜；暗沉時再加入亮白精華 C 或面膜，讓保養跟著當天狀態走。");
  }

  const productGuides = {
    hydration: [
      "保濕加強｜極光晶潤霜晚間加到 1.5 顆珍珠大小，兩頰與嘴角可多疊一層。",
      "滋養頻率｜小金球・精萃每週 2-3 晚，每次 2-3 滴，放在 24HR 保濕精質蜜後、極光晶潤霜前。",
    ],
    evenness: [
      "提亮方案｜亮白精華 C 晚間使用，每次 2-3 滴或薄擦全臉，先每週 3 晚開始。",
      "面膜頻率｜智慧淨白面膜每週 1-2 次，每次 10-15 分鐘，敷後接 24HR 保濕精質蜜與極光晶潤霜。",
    ],
    redness: [
      "舒緩方案｜24HR 保濕精質蜜 1-2 泵搭配極光晶潤霜 1 顆珍珠大小，連續 7 天簡化保養。",
      "敏弱節奏｜亮白精華 C 先降到每週 1-2 晚，每次少量局部用；面膜暫時減量。",
    ],
    shine: [
      "油光調整｜早上 24HR 保濕精質蜜用 1 泵薄擦，極光晶潤霜改晚上用，白天只補乾燥區。",
      "妝前防護｜裸紗防曬全臉薄擦，T 字半指節量即可，兩頰可正常補足。",
    ],
  };

  for (const metric of [primary, secondary]) {
    routine.push(...productGuides[metric.key]);
  }

  if (primary.score < 55) {
    routine.push(`7 天追蹤｜先連續 7 天照以上用量做，不要一次加入太多新產品，方便觀察肌膚反應。`);
  } else {
    routine.push("週期維持｜每週同光源檢測一次，依當週狀態調整亮白精華 C、智慧淨白面膜與極光晶潤霜的使用頻率。");
  }

  return routine;
}

function getZoneInsight(result) {
  const signals = result.zoneSignals || {};
  const items = [
    {
      key: "tZoneOil",
      label: "T 字油光",
      zone: "額頭與鼻翼",
      value: signals.tZoneOil || 0,
      tip: "妝前可薄擦清爽保濕，白天搭配防曬與局部控光。",
    },
    {
      key: "cheekTexture",
      label: "兩頰紋理",
      zone: "兩頰與下巴",
      value: signals.cheekTexture || 0,
      tip: "晚間先補水再鎖水，乾燥處可多疊一層修護霜。",
    },
    {
      key: "tone",
      label: "膚色落差",
      zone: "額頭、兩頰與下巴",
      value: signals.tone || 0,
      tip: "白天防曬要足量，夜間再加入溫和提亮與穩定保濕。",
    },
    {
      key: "cheekRedness",
      label: "局部泛紅",
      zone: "兩頰",
      value: signals.cheekRedness || 0,
      tip: "先簡化刺激性保養，保留舒緩、補水與屏障修護。",
    },
  ].sort((a, b) => b.value - a.value);
  const primary = items[0];
  const secondary = items[1];
  const status = primary.value >= 10 ? "明顯" : primary.value >= 5 ? "輕微" : "穩定";
  return {
    title: `${primary.zone}：${primary.label}${status}`,
    tip: `${primary.tip} 第二觀察區為${secondary.zone}，建議一起納入保養排序。`,
    primary,
    secondary,
  };
}

function updateResults(result) {
  lastResult = result;
  const skinEnergy = getSkinEnergy(result);
  const previousEnergy = readPreviousSkinEnergy();
  fields.overallScore.textContent = scoreOutOf(skinEnergy);
  fields.overallBar.style.width = pct(result.overall);
  const confidenceLabel = result.confidence >= 82 ? "高" : result.confidence >= 64 ? "中" : "低";

  fields.hydrationScore.textContent = scoreOutOf(result.hydration);
  fields.evennessScore.textContent = scoreOutOf(result.evenness);
  fields.rednessScore.textContent = scoreOutOf(result.redness);
  fields.shineScore.textContent = scoreOutOf(result.shine);
  [
    [fields.hydrationSignal, result.hydration],
    [fields.evennessSignal, result.evenness],
    [fields.rednessSignal, result.redness],
    [fields.shineSignal, result.shine],
  ].forEach(([field, score]) => {
    field.style.width = pct(score);
    field.dataset.score = scoreOutOf(score);
  });

  fields.hydrationNote.textContent = `${scoreStatus(result.hydration)}｜${labelFor(result.hydration, "水潤狀態穩定", "局部需要補水", "建議優先補水修護")}`;
  fields.evennessNote.textContent = `${scoreStatus(result.evenness)}｜${labelFor(result.evenness, "透亮狀態穩定", "有些暗沉落差", "建議提升透亮防護")}`;
  fields.rednessNote.textContent = `${scoreStatus(result.redness)}｜${labelFor(result.redness, "穩定狀態良好", "局部需要舒緩", "建議優先穩定屏障")}`;
  fields.shineNote.textContent = `${scoreStatus(result.shine)}｜${labelFor(result.shine, "平衡狀態良好", "T 字局部泛光", "建議調理油水平衡")}`;

  const modeLabel = {
    skin: "臉部辨識良好",
    fallback: "臉部資訊可用",
    raw: "照片資訊較少",
    image: "照片需重新調整",
  }[result.mode];
  const quality = result.pixels >= 8000 ? "高" : result.pixels >= 1800 ? "中" : "低";
  const lightLabel = result.avgBrightness < 72 ? "偏暗" : result.avgBrightness > 205 ? "偏亮" : "正常";
  const faceFitLabel = result.mode === "skin" ? "已對準" : result.mode === "fallback" ? "大致可用" : "建議調整";
  const lightTip = lightLabel === "正常" ? "這次光線穩定，膚色與油光判讀較可靠。" : "光線會影響膚色與油光判讀，建議下次改在窗邊自然光拍攝。";
  const evennessLabel = result.evenness >= 78 ? "均勻" : result.evenness >= 58 ? "略有暗沉" : "不均明顯";
  const shineLabel = result.shine >= 78 ? "清爽" : result.shine >= 58 ? "局部油光" : "油光明顯";
  const rednessLabel = result.redness >= 78 ? "穩定" : result.redness >= 58 ? "輕微泛紅" : "泛紅明顯";
  const hydrationLabel = result.hydration >= 78 ? "飽滿穩定" : result.hydration >= 58 ? "局部偏乾" : "明顯缺水";
  const readAreaLabel = faceFitLabel === "已對準" ? "讀取完整" : faceFitLabel === "大致可用" ? "可作參考" : "建議重拍";
  const careZoneTip = result.hydration < 58
    ? "兩頰、嘴角與額頭可優先加強補水鎖水。"
    : "臉部主要區域已可用來安排日常保養順序。";
  const zoneInsight = getZoneInsight(result);
  const baseTip = result.shine < 58
    ? "妝前 T 字建議薄擦，兩頰照乾燥程度補足保濕。"
    : "妝前狀態相對穩定，維持輕薄防護與規律保濕即可。";
  const calmTip = result.redness < 58 ? "泛紅較明顯時，先簡化保養、降低刺激。" : "舒緩穩定度尚可。";

  fields.sampleMode.innerHTML = `<span class="detail-status">${hydrationLabel}</span>${labelFor(result.hydration, "肌膚表面看起來較平整，保濕維持度不錯。", "局部有乾紋或粗糙感，建議補水後再鎖水。", "乾燥紋理較明顯，建議把保濕修護排在第一優先。")}`;
  fields.facePosition.innerHTML = `<span class="detail-status">${readAreaLabel}</span>${modeLabel}。${careZoneTip} 主要分區觀察：${zoneInsight.title}。`;
  fields.lightingStatus.innerHTML = `<span class="detail-status">${lightLabel}</span>${lightTip}`;
  fields.colorVariance.innerHTML = `<span class="detail-status">${evennessLabel}</span>${result.evenness < 58 ? "膚色落差較明顯，建議白天防曬、晚上提亮保養同步進行。" : "膚色整體可維持，日間防護仍是透亮感關鍵。"}`;
  fields.highlightRatio.innerHTML = `<span class="detail-status">${shineLabel} / ${rednessLabel}</span>${baseTip} ${calmTip}`;

  const priorities = [
    ["hydration", result.hydration, "水潤狀態", "先補水再鎖水，避免過度清潔。"],
    ["evenness", result.evenness, "透亮狀態", "白天穩定防曬，晚上加入溫和亮膚成分。"],
    ["redness", result.redness, "穩定狀態", "降低刺激，優先使用舒緩與屏障修護。"],
    ["shine", result.shine, "平衡狀態", "保留保濕，改用輕質乳液與分區控油。"],
  ].sort((a, b) => a[1] - b[1]);
  const careRhythm = getCareRhythmInsight(result);

  const fingerprint = getSkinFingerprint(result);
  const benchmark = getAgeBenchmark(result);
  fields.skinFingerprint.innerHTML = `
    <span>AI 膚況顧問觀察</span>
    <strong>${fingerprint.title}</strong>
    <p>${fingerprint.note}</p>
    <div class="fingerprint-tags">
      <b>${fingerprint.primaryLabel}</b>
      <b>${fingerprint.secondaryLabel}</b>
      <b>${fingerprint.textureLabel}</b>
    </div>
  `;
  fields.coachLetter.innerHTML = buildCoachLetter(result, fingerprint);
  fields.growthSystem.innerHTML = buildGrowthSystem(result, previousEnergy);
  fields.ageBenchmark.innerHTML = `
    <span>${customerProfile?.ageLabel || "同齡"}肌膚分數參考</span>
    <div class="benchmark-compare">
      <b><small>目前分數</small>${scoreOutOf(skinEnergy)}</b>
      <b><small>同齡參考</small>${benchmark.range}/100</b>
    </div>
    <strong>${benchmark.status}</strong>
    <p>${benchmark.label}：${benchmark.suggestion}</p>
    <small>${benchmark.note}</small>
  `;

  fields.summaryList.innerHTML = priorities
    .slice(0, 3)
    .concat([
      { hideScore: true, title: `分區觀察｜${zoneInsight.title}`, tip: zoneInsight.tip },
      { hideScore: true, title: careRhythm.title, tip: careRhythm.tip },
    ])
    .map(
      (item) => {
        const score = Array.isArray(item) ? item[1] : item.score;
        const title = Array.isArray(item) ? item[2] : item.title;
        const tip = Array.isArray(item) ? item[3] : item.tip;
        const heading = item.hideScore ? title : `${title} ${scoreOutOf(score)}｜${scoreStatus(score)}`;
        return `
        <p class="summary-item">
          <strong>${heading}</strong>
          <span>${tip}</span>
        </p>
      `;
      },
    )
    .join("");

  const routine = buildFascineRoutine(result);
  const shopProfile = getShopProfile(result);
  const recommendedProducts = getRecommendedProducts(result);
  lastRoutine = routine;
  lastRecommendedProducts = recommendedProducts;
  renderProductRecommendations(recommendedProducts, shopProfile);
  renderRoutineRecommendations(result);
  saveSkinEnergy(skinEnergy);
  if (copyReportButton) copyReportButton.disabled = false;
}

function buildCustomerReport() {
  if (!lastResult) return "";

  const fingerprint = getSkinFingerprint(lastResult);
  const sortedMetrics = [
    ["水潤感", lastResult.hydration],
    ["均勻度", lastResult.evenness],
    ["泛紅", lastResult.redness],
    ["油光", lastResult.shine],
  ].sort((a, b) => a[1] - b[1]);

  return [
    "FASCINÉ 梵希婗肌膚保養建議",
    "",
    `整體膚況：${scoreText(lastResult.overall)} 分`,
    `AI 膚況辨識：${fingerprint.type}`,
    `本次主軸：${fingerprint.primaryLabel}，第二重點：${fingerprint.secondaryLabel}`,
    customerProfile?.concernLabel ? `客人自填：${customerProfile.ageLabel}｜最困擾 ${customerProfile.concernLabel}｜${customerProfile.routineHabitLabel}｜期待${customerProfile.skinScenarioLabel}｜偏好${customerProfile.routinePaceLabel}` : "",
    "",
    "本次保養重點：",
    `1. 優先改善：${sortedMetrics[0][0]}`,
    `2. 第二重點：${sortedMetrics[1][0]}`,
    `3. 維持觀察：${sortedMetrics[2][0]}、${sortedMetrics[3][0]}`,
    "",
    "四項分數：",
    `水潤感 ${scoreText(lastResult.hydration)}｜均勻度 ${scoreText(lastResult.evenness)}｜泛紅 ${scoreText(lastResult.redness)}｜油光 ${scoreText(lastResult.shine)}`,
    "",
    "建議使用方式：",
    ...lastRoutine.map((item, index) => `${index + 1}. ${item}`),
    "",
    "建議商品：",
    ...lastRecommendedProducts.map((product, index) => `${index + 1}. ${product.name}｜${product.amount}｜${product.href}`),
    "",
    "提醒：本建議為日常保養參考，不等同皮膚科診斷；若有發炎、疼痛或快速惡化，建議諮詢專業醫師。",
  ].join("\n");
}

async function copyCustomerReport() {
  if (!copyReportButton) return;
  const report = buildCustomerReport();
  if (!report) return;

  try {
    await navigator.clipboard.writeText(report);
    copyReportButton.textContent = "已儲存建議";
    window.setTimeout(() => {
      copyReportButton.textContent = "儲存我的建議";
    }, 1800);
  } catch {
    copyReportButton.textContent = "儲存失敗，請再試一次";
    window.setTimeout(() => {
      copyReportButton.textContent = "儲存我的建議";
    }, 2200);
  }
}

async function handleImage(file, source = "upload") {
  if (!file) return;
  lastPhotoSource = source;
  const fileName = file.name || "這張照片";
  const fileType = `${file.type || ""} ${fileName}`.toLowerCase();

  if (fileType.includes("heic") || fileType.includes("heif")) {
    setUploadStatus("目前瀏覽器讀不到 HEIC/HEIF，請改選 JPG、PNG 或 WebP。", "error");
    return;
  }

  setUploadStatus(`正在讀取：${fileName}`);
  const imageUrl = URL.createObjectURL(file);
  let didFinish = false;
  const timeoutId = window.setTimeout(() => {
    if (didFinish) return;
    setUploadStatus("圖片讀取時間較久。若一直沒有出現，請換成 JPG 或 PNG。", "error");
  }, 3500);

  const finishLoad = async (image) => {
    didFinish = true;
    window.clearTimeout(timeoutId);
    loadedImage = image;
    URL.revokeObjectURL(imageUrl);
    resetPhotoAdjust();
    resetFaceGuide();
    drawImageCover(loadedImage);
    const fitted = autoFitPhotoToFace();
    const detected = fitted || await autoDetectFaceGuide();
    setUploadStatus(detected ? `已自動校準臉部位置：${fileName}` : `已載入：${fileName}，請拖曳紅色框對準臉部。`);
    preparePhotoForConsultation(fileName);
  };

  const failLoad = () => {
    didFinish = true;
    window.clearTimeout(timeoutId);
    URL.revokeObjectURL(imageUrl);
    setUploadStatus("讀不到這張照片。請改用 JPG、PNG 或 WebP 再試一次。", "error");
  };

  if ("createImageBitmap" in window) {
    try {
      const bitmap = await createImageBitmap(file, { imageOrientation: "from-image" });
      await finishLoad(bitmap);
      return;
    } catch {
      // Some browsers cannot decode every file through createImageBitmap.
    }
  }

  const image = new Image();
  image.onload = () => finishLoad(image);
  image.onerror = failLoad;
  image.src = imageUrl;
}

async function openCamera() {
  if (!navigator.mediaDevices?.getUserMedia) {
    setUploadStatus("這個瀏覽器不支援直接拍照，請改用相簿照片。", "error");
    cameraInput.click();
    return;
  }

  cameraModal.hidden = false;
  cameraStatus.textContent = "正在開啟相機...";

  try {
    stopCamera();
    cameraModal.hidden = false;
    cameraStream = await navigator.mediaDevices.getUserMedia({
      audio: false,
      video: {
        facingMode: "user",
        width: { ideal: 1280 },
        height: { ideal: 1600 },
      },
    });
    cameraPreview.srcObject = cameraStream;
    cameraStatus.textContent = "請把臉對準白色臉框、光線均勻，再按「開始分析這張」。";
  } catch {
    cameraModal.hidden = true;
    setUploadStatus("無法開啟相機。請確認瀏覽器相機權限，或改用相簿照片。", "error");
  }
}

function captureCameraPhoto() {
  if (!cameraPreview.videoWidth || !cameraPreview.videoHeight) {
    cameraStatus.textContent = "相機還在準備中，請稍等一下再拍。";
    return;
  }

  const photoCanvas = document.createElement("canvas");
  photoCanvas.width = cameraPreview.videoWidth;
  photoCanvas.height = cameraPreview.videoHeight;
  const photoCtx = photoCanvas.getContext("2d");
  photoCtx.translate(photoCanvas.width, 0);
  photoCtx.scale(-1, 1);
  photoCtx.drawImage(cameraPreview, 0, 0, photoCanvas.width, photoCanvas.height);
  photoCanvas.toBlob((blob) => {
    if (!blob) {
      cameraStatus.textContent = "拍照失敗，請再試一次。";
      return;
    }
    const photoFile = new File([blob], `camera-skin-check-${Date.now()}.jpg`, { type: "image/jpeg" });
    stopCamera();
    handleImage(photoFile, "camera");
  }, "image/jpeg", 0.92);
}

function pointerToCanvas(event) {
  const rect = canvas.getBoundingClientRect();
  return {
    x: ((event.clientX - rect.left) / rect.width) * canvas.width,
    y: ((event.clientY - rect.top) / rect.height) * canvas.height,
  };
}

function pointIsNearGuide(point) {
  const cx = canvas.width * (faceGuide.x / 100);
  const cy = canvas.height * (faceGuide.y / 100);
  const rx = canvas.width * (faceGuide.width / 100);
  const ry = canvas.height * (faceGuide.height / 100);
  const dx = (point.x - cx) / rx;
  const dy = (point.y - cy) / ry;
  const distance = Math.sqrt(dx * dx + dy * dy);
  const nearCenter = Math.hypot(point.x - cx, point.y - cy) < 38;
  const insideFrame = distance <= 1.15;
  const nearFrame = distance > 0.72 && distance < 1.32;
  const nearHandle = [
    [cx - rx, cy],
    [cx + rx, cy],
    [cx, cy - ry],
    [cx, cy + ry],
  ].some(([hx, hy]) => Math.hypot(point.x - hx, point.y - hy) < 30);

  return insideFrame || nearCenter || nearFrame || nearHandle;
}

imageInput.addEventListener("change", (event) => {
  handleImage(event.target.files[0], "upload");
});

document.querySelector(".camera-box").addEventListener("click", (event) => {
  event.preventDefault();
  openCamera();
});

cameraInput.addEventListener("change", (event) => {
  handleImage(event.target.files[0], "camera");
});

closeCameraButton.addEventListener("click", stopCamera);

captureButton.addEventListener("click", captureCameraPhoto);

fallbackUploadButton.addEventListener("click", () => {
  stopCamera();
  cameraInput.click();
});

photoPanel.addEventListener("dragover", (event) => {
  event.preventDefault();
});

photoPanel.addEventListener("drop", (event) => {
  event.preventDefault();
  handleImage(event.dataTransfer.files[0], "upload");
});

if (copyReportButton) copyReportButton.addEventListener("click", copyCustomerReport);

autoAlignButton.addEventListener("click", async () => {
  if (!loadedImage) {
    resetFaceGuide();
    return;
  }
  drawImageCover(loadedImage);
  const fitted = autoFitPhotoToFace();
  const detected = fitted || await autoDetectFaceGuide();
  if (!detected) {
    resetFaceGuide();
    setUploadStatus("臉部位置不夠清楚，請把紅色框拖曳到臉部主要區域。", "error");
  } else {
    setUploadStatus("已重新定位臉部區域。");
  }
  preparePhotoForConsultation("目前照片");
});

Object.values(alignmentInputs).forEach((input) => {
  input.addEventListener("input", () => {
    setFaceGuide({
      x: Number(alignmentInputs.x.value),
      y: Number(alignmentInputs.y.value),
      width: Number(alignmentInputs.width.value),
      height: Number(alignmentInputs.height.value),
    });
    preparePhotoForConsultation("目前照片");
  });
});

canvas.addEventListener("pointerdown", (event) => {
  if (!loadedImage) return;
  const point = pointerToCanvas(event);

  canvas.setPointerCapture(event.pointerId);
  isDraggingPhoto = true;
  pendingPhotoDrag = true;
  photoDragStart = {
    x: point.x,
    y: point.y,
    offsetX: photoAdjust.x,
    offsetY: photoAdjust.y,
  };
});

canvas.addEventListener("pointermove", (event) => {
  if (!loadedImage || (!isDraggingGuide && !isDraggingPhoto)) return;
  const point = pointerToCanvas(event);
  if (isDraggingPhoto) {
    const deltaX = point.x - photoDragStart.x;
    const deltaY = point.y - photoDragStart.y;
    const distance = Math.hypot(deltaX, deltaY);
    if (pendingPhotoDrag && distance < 18) return;
    if (pendingPhotoDrag) {
      pendingPhotoDrag = false;
      setUploadStatus("正在移動照片，請把臉對準紅色圓圈，放開後可進入膚況問答。");
    }
    setPhotoAdjust({
      x: photoDragStart.offsetX + (deltaX / canvas.width) * 62,
      y: photoDragStart.offsetY + (deltaY / canvas.height) * 62,
    });
    renderPreviewOnly();
    return;
  }

  setFaceGuide({
    x: point.x / canvas.width * 100 - dragOffset.x,
    y: point.y / canvas.height * 100 - dragOffset.y,
  });
  renderPreviewOnly();
});

canvas.addEventListener("pointerup", () => {
  const shouldAnalyze = isDraggingGuide || (isDraggingPhoto && !pendingPhotoDrag);
  isDraggingGuide = false;
  isDraggingPhoto = false;
  pendingPhotoDrag = false;
  if (shouldAnalyze) preparePhotoForConsultation("目前照片");
});

canvas.addEventListener("pointercancel", () => {
  const shouldAnalyze = isDraggingGuide || (isDraggingPhoto && !pendingPhotoDrag);
  isDraggingGuide = false;
  isDraggingPhoto = false;
  pendingPhotoDrag = false;
  if (shouldAnalyze) preparePhotoForConsultation("目前照片");
});

canvas.addEventListener("wheel", (event) => {
  if (!loadedImage) return;
  event.preventDefault();
  const zoomChange = event.deltaY > 0 ? -2 : 2;
  setPhotoAdjust({ zoom: photoAdjust.zoom + zoomChange });
  preparePhotoForConsultation("目前照片");
}, { passive: false });

document.querySelectorAll(".tab").forEach((tab) => {
  tab.addEventListener("click", () => {
    activatePanel(tab.dataset.panel);
    setJourneyStep(tab.dataset.panel === "summary" || tab.dataset.panel === "details" ? "result" : tab.dataset.panel);
  });
});

document.querySelectorAll("[data-go-panel]").forEach((button) => {
  button.addEventListener("click", async () => {
    const panelName = button.dataset.goPanel;
    const stepName = panelName === "summary" || panelName === "details" ? "result" : panelName;
    const forwardTransitions = {
      routine: {
        title: "正在生成妳的肌膚照護節奏",
        steps: ["讀取本次膚況優先順序", "拆解早晚保養程序", "安排 FASCINÉ 產品用量與頻率"],
        duration: 3300,
        mode: "routine",
      },
      shop: {
        title: "正在整理專屬改善方案",
        steps: ["比對本次較需要照顧的狀態", "判斷出油、乾燥與穩定狀態", "整理 FASCINÉ 產品優先順序"],
        duration: 3200,
        mode: "shop",
      },
    };
    await transitionToStep(stepName, panelName, forwardTransitions[stepName]);
  });
});

document.querySelectorAll("[data-go-step]").forEach((button) => {
  button.addEventListener("click", () => {
    const stepName = button.dataset.goStep;
    setJourneyStep(stepName, stepName === "result" ? "summary" : null);
  });
});

document.querySelectorAll("[data-routine-tab]").forEach((button) => {
  button.addEventListener("click", () => {
    currentRoutineMode = button.dataset.routineTab || "day";
    if (lastResult) renderRoutineRecommendations(lastResult);
  });
});

document.querySelectorAll("[data-reset-flow]").forEach((button) => {
  button.addEventListener("click", reset);
});

if (startWelcomeButton) {
  startWelcomeButton.addEventListener("click", () => {
    setJourneyStep("capture");
  });
}

updateWelcomeStats();

document.querySelectorAll(".journey-step").forEach((button) => {
  button.addEventListener("click", () => {
    const step = journeyStep;
    if (step === "capture") {
      setJourneyStep("capture");
      return;
    }
    if (step === "analyze") {
      setJourneyStep(lastResult ? "result" : "capture", lastResult ? "summary" : null);
      return;
    }
    if (step === "consult") {
      setJourneyStep("consult");
      return;
    }
    if (!lastResult) {
      setUploadStatus(loadedImage ? "請先完成膚況問答，再開始 AI 解析。" : "請先拍照或上傳照片，完成分析後就能查看結果。");
      setJourneyStep(loadedImage ? "consult" : "capture");
      return;
    }
    if (step === "result") setJourneyStep("result", "summary");
    if (step === "routine") setJourneyStep("routine", "routine");
    if (step === "shop") setJourneyStep("shop", "shop");
  });
});

viewResultButton.addEventListener("click", async () => {
  if (!loadedImage) return;
  if (lastResult) {
    setJourneyStep("result", "summary");
    return;
  }
  await transitionToStep("consult", null, {
    title: "正在校準本次照片",
    steps: [
      "鎖定臉部框架 Aligning facial contours",
      "確認拍攝光線與照片比例 Verifying lighting and aspect ratio",
      "準備客製化膚況問答 Preparing personalized skin consultation",
    ],
    duration: 2300,
  });
});

consultationForm.addEventListener("input", updateStartAnalysisState);
consultationForm.addEventListener("change", updateStartAnalysisState);

backToPhotoButton.addEventListener("click", () => {
  setJourneyStep("capture");
});

startAnalysisButton.addEventListener("click", () => {
  if (journeyStep === "analyze") return;
  updateStartAnalysisState();
  if (startAnalysisButton.disabled) return;
  customerProfile = collectCustomerProfile();
  renderAndAnalyze();
});

retakeButton.addEventListener("click", () => {
  setJourneyStep("capture");
  imageInput.click();
});

reset();
