// 기준: 250 µL → 0.5 L 물 → EC +0.4
const baseNutrient = 250; // µL
const baseWater = 0.5;    // L
const baseEC = 0.4;       // mS/cm

const fmt = (n, d=2) => Number.isFinite(n) ? Number(n.toFixed(d)).toString() : "—";
const $ = (id) => document.getElementById(id);

let lastNeededUl = null; // 기능 A 계산 결과(µL) 저장해 단위 변경시 재표시

function show(el, text, isError=false){
  el.textContent = text;
  el.classList.toggle('error', !!isError);
}

function formatAmount(ul){
  const unit = $("unitSelect").value; // 'ul' | 'ml'
  if (unit === "ml") return `${fmt(ul/1000, 3)} mL`;
  return `${fmt(ul, 1)} µL`;
}

function renderNeeded(){
  if (lastNeededUl == null) return;
  show($("resultA"), `필요한 양액량: 약 ${formatAmount(lastNeededUl)}`);
}

// 기능 A: 목표 EC → 필요한 양액량
function calculateA() {
  const targetEC = parseFloat($("targetEC").value);
  const waterVolume = parseFloat($("waterVolumeA").value);

  if (!Number.isFinite(targetEC) || !Number.isFinite(waterVolume)) {
    show($("resultA"), "값을 모두 입력하세요.", true);
    lastNeededUl = null;
    return;
  }
  if (targetEC < 0) {
    show($("resultA"), "목표 EC는 0 이상이어야 합니다.", true);
    lastNeededUl = null;
    return;
  }
  if (waterVolume <= 0) {
    show($("resultA"), "물의 양은 0보다 커야 합니다.", true);
    lastNeededUl = null;
    return;
  }

  lastNeededUl = (targetEC / baseEC) * (baseNutrient * (waterVolume / baseWater)); // µL
  renderNeeded();
}

// 기능 B: 양액량 → 예상 EC
function calculateB() {
  const nutrientVolume = parseFloat($("nutrientVolume").value);
  const waterVolume = parseFloat($("waterVolumeB").value);

  if (!Number.isFinite(nutrientVolume) || !Number.isFinite(waterVolume)) {
    show($("resultB"), "값을 모두 입력하세요.", true);
    return;
  }
  if (nutrientVolume <= 0) {
    show($("resultB"), "양액 주입량은 0보다 커야 합니다.", true);
    return;
  }
  if (waterVolume <= 0) {
    show($("resultB"), "물의 양은 0보다 커야 합니다.", true);
    return;
  }

  const expectedEC = (nutrientVolume / (baseNutrient * (waterVolume / baseWater))) * baseEC;
  show($("resultB"), `예상 EC: 약 ${fmt(expectedEC,2)} mS/cm`);
}

// 이벤트 연결
document.addEventListener('DOMContentLoaded', () => {
  $("btnA").addEventListener('click', calculateA);
  $("btnB").addEventListener('click', calculateB);
  $("unitSelect").addEventListener('change', renderNeeded); // 단위 바꾸면 즉시 다시 표기
});