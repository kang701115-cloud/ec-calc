const DEFAULTS = {
  baseNutrient: 250,
  baseWater: 0.5,
  baseEC: 0.4
};

function loadBaseline() {
  const stored = JSON.parse(localStorage.getItem('ecBaseline') || '{}');
  document.getElementById('baseNutrient').value = stored.baseNutrient ?? DEFAULTS.baseNutrient;
  document.getElementById('baseWater').value = stored.baseWater ?? DEFAULTS.baseWater;
  document.getElementById('baseEC').value = stored.baseEC ?? DEFAULTS.baseEC;
}

function getBaseline() {
  const baseNutrient = parseFloat(document.getElementById('baseNutrient').value);
  const baseWater = parseFloat(document.getElementById('baseWater').value);
  const baseEC = parseFloat(document.getElementById('baseEC').value);
  if ([baseNutrient, baseWater, baseEC].some(v => isNaN(v) || v <= 0)) {
    throw new Error('기준값을 올바르게 입력하세요.');
  }
  return { baseNutrient, baseWater, baseEC };
}

function saveBaseline() {
  try {
    const b = getBaseline();
    localStorage.setItem('ecBaseline', JSON.stringify(b));
    showSaved();
  } catch (e) {
    alert(e.message);
  }
}

function resetBaseline() {
  document.getElementById('baseNutrient').value = DEFAULTS.baseNutrient;
  document.getElementById('baseWater').value = DEFAULTS.baseWater;
  document.getElementById('baseEC').value = DEFAULTS.baseEC;
  saveBaseline();
}

function showSaved() {
  const pill = document.getElementById('saveStatus');
  pill.style.display = 'inline-flex';
  setTimeout(() => pill.style.display = 'none', 1400);
}

function toDisplay(value_uL, unit) {
  if (unit === 'mL') return (value_uL / 1000).toFixed(3) + ' mL';
  return value_uL.toFixed(1) + ' µL';
}

function toMicroLiter(value, unit) {
  return unit === 'mL' ? value * 1000 : value;
}

function calculateA() {
  try {
    const { baseNutrient, baseWater, baseEC } = getBaseline();
    const targetEC = parseFloat(document.getElementById('targetEC').value);
    const waterVolume = parseFloat(document.getElementById('waterVolumeA').value);
    const unit = document.getElementById('unitA').value;

    if (isNaN(targetEC) || isNaN(waterVolume) || targetEC <= 0 || waterVolume <= 0) {
      document.getElementById('resultA').innerText = '값을 모두 올바르게 입력하세요.';
      return;
    }

    const nutrientNeeded_uL = (targetEC / baseEC) * (baseNutrient * (waterVolume / baseWater));
    document.getElementById('resultA').innerText =
      `필요한 양액량: ${toDisplay(nutrientNeeded_uL, unit)}`;
  } catch (e) {
    document.getElementById('resultA').innerText = e.message;
  }
}

function calculateB() {
  try {
    const { baseNutrient, baseWater, baseEC } = getBaseline();
    const nutrientRaw = parseFloat(document.getElementById('nutrientVolume').value);
    const unit = document.getElementById('unitB').value;
    const waterVolume = parseFloat(document.getElementById('waterVolumeB').value);

    if (isNaN(nutrientRaw) || isNaN(waterVolume) || nutrientRaw <= 0 || waterVolume <= 0) {
      document.getElementById('resultB').innerText = '값을 모두 올바르게 입력하세요.';
      return;
    }

    const nutrient_uL = toMicroLiter(nutrientRaw, unit);
    const expectedEC = (nutrient_uL / (baseNutrient * (waterVolume / baseWater))) * baseEC;

    document.getElementById('resultB').innerText =
      `예상 EC: 약 ${expectedEC.toFixed(2)} mS/cm`;
  } catch (e) {
    document.getElementById('resultB').innerText = e.message;
  }
}

function calculateC() {
  try {
    const volA = parseFloat(document.getElementById('volumeA').value);
    const volB = parseFloat(document.getElementById('volumeB').value);
    const targetNK = parseFloat(document.getElementById('targetRatio').value);

    if ([volA, volB, targetNK].some(v => isNaN(v) || v <= 0)) {
      document.getElementById('resultC').innerText = '값을 모두 올바르게 입력하세요.';
      return;
    }

    const totalVolume_uL = volA + volB;

    // ✅ 밀도: 1.21 mg/µL
    const totalWeight_mg = totalVolume_uL * 1.21;

    // N, K 함량 비율
    const N_percent = 5.75 / 100;
    const K_percent = 4.25 / 100;

    const nitrogen_mg = totalWeight_mg * N_percent;
    const potassium_mg = totalWeight_mg * K_percent;

    const currentNK = nitrogen_mg / potassium_mg;

    if (currentNK <= targetNK) {
      document.getElementById('resultC').innerText =
        `이미 N:K 비율이 목표 이하입니다.\n현재 비율: ${currentNK.toFixed(2)}:1`;
      return;
    }

    const desiredK_mg = nitrogen_mg / targetNK;
    const neededK_mg = desiredK_mg - potassium_mg;

    if (neededK_mg <= 0) {
      document.getElementById('resultC').innerText = '추가 칼륨이 필요하지 않습니다.';
      return;
    }

    const K_in_K2SO4 = 0.4487; // 황산칼륨 내 K 비율
    const solution_concentration = 0.10; // 10% wt

    const required_K2SO4_mg = neededK_mg / K_in_K2SO4;
    const required_solution_mL = required_K2SO4_mg / (solution_concentration * 1000);

    document.getElementById('resultC').innerText =
      `🔬 목표 N:K 비율 달성을 위해\n약 ${required_solution_mL.toFixed(3)} mL의 10% 황산칼륨 수용액이 필요합니다.\n\n(현재 비율: ${currentNK.toFixed(2)}:1 → 목표: ${targetNK.toFixed(2)}:1)`;
  } catch (e) {
    document.getElementById('resultC').innerText = e.message;
  }
}

// 이벤트 바인딩
document.getElementById('saveBaselineBtn').addEventListener('click', saveBaseline);
document.getElementById('resetBaselineBtn').addEventListener('click', resetBaseline);
window.addEventListener('load', () => {
  loadBaseline();
  document.getElementById('unitA').value = 'uL';
  document.getElementById('unitB').value = 'uL';
});
