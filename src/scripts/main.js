const body = document.body;
const landingGate = document.getElementById("landingGate");
const landingLogo = document.getElementById("landingLogo");
const cornerLogo = document.getElementById("cornerLogo");
const mapViewport = document.getElementById("mapViewport");
const mapCanvas = document.getElementById("mapCanvas");
const mapHome = document.getElementById("mapHome");
const deskChaosLayer = document.getElementById("deskChaosLayer");
const mapTooltip = document.getElementById("mapTooltip");
const mapTooltipTitle = document.getElementById("mapTooltipTitle");
const mapTooltipCopy = document.getElementById("mapTooltipCopy");
const mapInfoTitle = document.getElementById("mapInfoTitle");
const mapInfoCopy = document.getElementById("mapInfoCopy");
const interactiveObjects = Array.from(document.querySelectorAll('.map-object'));
const responsiveImages = Array.from(document.querySelectorAll('[data-desktop-src][data-mobile-src]'));
const editorPanel = document.getElementById('editorPanel');
const editorCenterMarker = document.getElementById('editorCenterMarker');
const editorTarget = document.getElementById('editorTarget');
const editorX = document.getElementById('editorX');
const editorY = document.getElementById('editorY');
const editorWidth = document.getElementById('editorWidth');
const editorScale = document.getElementById('editorScale');
const editorOpacity = document.getElementById('editorOpacity');
const editorRotation = document.getElementById('editorRotation');
const editorResetTarget = document.getElementById('editorResetTarget');
const editorResetAll = document.getElementById('editorResetAll');
const editorCopy = document.getElementById('editorCopy');

const logoFrames = Array.from({ length: 36 }, (_, index) => {
  const frameNumber = index + 24;
  return `./assets/images/landing-logos/Group ${frameNumber}.png`;
});

let currentLogoIndex = 0;
let landingIntervalId = null;
let activeObject = null;
let isDragging = false;
let dragMoved = false;
let dragStartX = 0;
let dragStartY = 0;
let dragScrollLeft = 0;
let dragScrollTop = 0;
let parallaxFrameId = null;
let stageScale = 1;
let stageOffsetX = 0;
let stageOffsetY = 0;
let pointerTargetX = 0;
let pointerTargetY = 0;
let bgShiftStateX = 0;
let bgShiftStateY = 0;
let titleShiftStateX = 0;
let titleShiftStateY = 0;
let objectShiftStateX = 0;
let objectShiftStateY = 0;
let noteShiftStateX = 0;
let noteShiftStateY = 0;
let chaosFrameId = null;
let deskChaosBuildToken = 0;
const deskChaosItems = [];
const deskChaosPointer = { active: false, x: 0, y: 0 };
let deskChaosBounds = null;
const DESK_CHAOS_COUNT = 27;
const deskChaosSources = Array.from({ length: DESK_CHAOS_COUNT }, (_, index) => `./assets/images/desk-chaos/${index + 1}.png`);
const EDITOR_KEY = 'azic-local-editor-v4';
const MOBILE_LAYOUT_QUERY = window.matchMedia('(max-width: 900px)');
const isLocalEditor = location.protocol === 'file:';
const editorTargets = {
  mapTitle: document.getElementById('mapTitle'),
  about: document.querySelector('.node-about'),
  upload: document.querySelector('.node-upload'),
  roundRobin: document.querySelector('.node-round-robin'),
  product: document.querySelector('.node-product'),
  cornerLogo: document.getElementById('cornerLogo'),
};
const editorDefaults = { desktop: {}, mobile: {} };
let currentLayoutMode = MOBILE_LAYOUT_QUERY.matches ? 'mobile' : 'desktop';
const LAYOUT_PRESETS = {
  desktop: {
    mapTitle: { x: 2099, y: 960, width: 970, scale: 0.74, opacity: 1, rotation: 0 },
    about: { x: 2372, y: 1060, width: 124, scale: 1.91, opacity: 1, rotation: -8 },
    upload: { x: 1769, y: 1490, width: 79, scale: 1.59, opacity: 1, rotation: -33 },
    roundRobin: { x: 2394, y: 1468, width: 190, scale: 1.74, opacity: 1, rotation: 4.5 },
    product: { x: 1672, y: 1046, width: 179, scale: 1.86, opacity: 1, rotation: 3.5 },
    cornerLogo: { x: 24, y: 20, width: 108, scale: 1, opacity: 0.92, rotation: 0 },
  },
  mobile: {
    mapTitle: { x: 1100, y: 1195, width: 180, scale: 1, opacity: 1, rotation: 0 },
    about: { x: 1157, y: 1190, width: 59, scale: 1.07, opacity: 1, rotation: 48 },
    upload: { x: 1010, y: 1298, width: 39, scale: 0.89, opacity: 1, rotation: -12.5 },
    roundRobin: { x: 1153, y: 1288, width: 99, scale: 0.97, opacity: 1, rotation: -7 },
    product: { x: 958, y: 1172, width: 103, scale: 0.91, opacity: 1, rotation: -0.5 },
    cornerLogo: { x: 24, y: 20, width: 108, scale: 1, opacity: 0.92, rotation: 0 },
  },
};

const ENTRY_VIEW_PRESETS = {};

const pickRandomLogo = () => logoFrames[Math.floor(Math.random() * logoFrames.length)];

const createSeededRandom = (seed) => {
  let value = seed >>> 0;
  return () => {
    value += 0x6D2B79F5;
    let t = value;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
};

const rectsOverlap = (a, b, padding = 0) => !(
  a.x + a.width + padding < b.x ||
  b.x + b.width + padding < a.x ||
  a.y + a.height + padding < b.y ||
  b.y + b.height + padding < a.y
);

const loadDeskChaosAssetMeta = () => Promise.all(
  deskChaosSources.map((src) => new Promise((resolve) => {
    const probe = new Image();
    probe.onload = () => resolve({ src, width: probe.naturalWidth || 100, height: probe.naturalHeight || 100 });
    probe.onerror = () => resolve({ src, width: 100, height: 100 });
    probe.src = src;
  }))
);

const getTitleExclusionRect = (mode) => {
  const title = editorTargets.mapTitle;
  const preset = LAYOUT_PRESETS[mode]?.mapTitle || getEditorMetrics(title);
  const ratio = title && title.naturalWidth && title.naturalHeight
    ? title.naturalHeight / title.naturalWidth
    : 1;
  const renderedWidth = preset.width * preset.scale;
  const renderedHeight = renderedWidth * ratio;
  const padX = mode === 'mobile' ? 150 : 340;
  const padY = mode === 'mobile' ? 150 : 280;
  return {
    x: preset.x - renderedWidth * 0.5 - padX,
    y: preset.y - padY,
    width: renderedWidth + padX * 2,
    height: renderedHeight + padY * 2,
  };
};

const requestDeskChaosFrame = () => {
  if (chaosFrameId !== null) return;
  chaosFrameId = requestAnimationFrame(() => {
    let needsMore = false;
    deskChaosItems.forEach((item) => {
      if (deskChaosPointer.active) {
        const centerX = item.x + item.width * 0.5;
        const centerY = item.y + item.height * 0.5;
        const dx = centerX - deskChaosPointer.x;
        const dy = centerY - deskChaosPointer.y;
        const distance = Math.hypot(dx, dy) || 0.0001;
        if (distance < item.radius) {
          const force = (1 - distance / item.radius);
          item.vx += (dx / distance) * force * item.pushPower;
          item.vy += (dy / distance) * force * item.pushPower;
        }
      }

      item.vx *= 0.94;
      item.vy *= 0.94;
      item.x += item.vx;
      item.y += item.vy;

      if (deskChaosBounds) {
        const minX = deskChaosBounds.minX;
        const maxX = deskChaosBounds.maxX - item.width;
        const minY = deskChaosBounds.minY;
        const maxY = deskChaosBounds.maxY - item.height;
        if (item.x < minX) {
          item.x = minX;
          item.vx = Math.abs(item.vx) * 0.68;
        }
        if (item.x > maxX) {
          item.x = maxX;
          item.vx = -Math.abs(item.vx) * 0.68;
        }
        if (item.y < minY) {
          item.y = minY;
          item.vy = Math.abs(item.vy) * 0.68;
        }
        if (item.y > maxY) {
          item.y = maxY;
          item.vy = -Math.abs(item.vy) * 0.68;
        }
      }

      item.element.style.left = `${item.x.toFixed(2)}px`;
      item.element.style.top = `${item.y.toFixed(2)}px`;
      item.element.style.transform = `rotate(${item.rotation}deg)`;

      if (deskChaosPointer.active || Math.abs(item.vx) > 0.06 || Math.abs(item.vy) > 0.06) {
        needsMore = true;
      }
    });
    chaosFrameId = null;
    if (needsMore) requestDeskChaosFrame();
  });
};

const clearDeskChaosPointer = () => {
  deskChaosPointer.active = false;
  requestDeskChaosFrame();
};

const buildDeskChaosLayer = async () => {
  if (!deskChaosLayer || !mapCanvas) return;
  const token = ++deskChaosBuildToken;
  const mode = getLayoutMode();
  const rng = Math.random;
  const assets = await loadDeskChaosAssetMeta();
  if (token !== deskChaosBuildToken) return;

  deskChaosLayer.innerHTML = '';
  deskChaosItems.length = 0;

  const canvasWidth = mapCanvas.offsetWidth || (mode === 'mobile' ? 2200 : 4300);
  const canvasHeight = mapCanvas.offsetHeight || (mode === 'mobile' ? 2900 : 3400);
  const viewport = getViewportMetrics();
  const fitScale = getStageFitScale();
  const visibleWidth = viewport.width / Math.max(fitScale, 0.001);
  const visibleHeight = viewport.height / Math.max(fitScale, 0.001);
  const margin = mode === 'mobile' ? 20 : 34;
  const titleExclusion = getTitleExclusionRect(mode);
  const titleCenterX = titleExclusion.x + titleExclusion.width * 0.5;
  const titleCenterY = titleExclusion.y + titleExclusion.height * 0.5;
  deskChaosBounds = {
    minX: Math.max(margin, titleCenterX - visibleWidth * (mode === 'mobile' ? 0.42 : 0.44)),
    maxX: Math.min(canvasWidth - margin, titleCenterX + visibleWidth * (mode === 'mobile' ? 0.42 : 0.44)),
    minY: Math.max(margin, titleCenterY - visibleHeight * (mode === 'mobile' ? 0.38 : 0.40)),
    maxY: Math.min(canvasHeight - margin, titleCenterY + visibleHeight * (mode === 'mobile' ? 0.44 : 0.46)),
  };

  const entries = [];
  assets.forEach((asset) => {
    const copies = 1 + Math.floor(rng() * 7);
    for (let i = 0; i < copies; i += 1) entries.push(asset);
  });
  entries.sort(() => rng() - 0.5);

  const width = mode === 'mobile' ? 58 : 92;

  entries.forEach((asset) => {
    const height = Math.round(width * (asset.height / asset.width));
    let x = 0;
    let y = 0;
    let tries = 0;
    do {
      const spreadX = (rng() + rng() + rng()) / 3;
      const spreadY = (rng() + rng() + rng()) / 3;
      x = deskChaosBounds.minX + spreadX * Math.max(1, deskChaosBounds.maxX - deskChaosBounds.minX - width);
      y = deskChaosBounds.minY + spreadY * Math.max(1, deskChaosBounds.maxY - deskChaosBounds.minY - height);
      tries += 1;
    } while (rectsOverlap({ x, y, width, height }, titleExclusion, mode === 'mobile' ? 18 : 24) && tries < 24);

    const element = document.createElement('img');
    element.className = 'desk-chaos-item';
    element.src = asset.src;
    element.alt = '';
    element.style.left = `${x}px`;
    element.style.top = `${y}px`;
    element.style.width = `${width}px`;
    const rotation = (rng() * 58 - 29).toFixed(2);
    deskChaosLayer.appendChild(element);
    deskChaosItems.push({
      element,
      x,
      y,
      width,
      height,
      rotation,
      vx: 0,
      vy: 0,
      radius: mode === 'mobile' ? 170 : 260,
      pushPower: mode === 'mobile' ? 3.8 : 5.6,
    });
  });

  requestDeskChaosFrame();
};

const getEditorMetrics = (element) => {
  if (!element) return { x: 0, y: 0, width: 0, scale: 1, opacity: 1, rotation: 0 };
  const style = window.getComputedStyle(element);
  const x = style.left === 'auto' ? element.offsetLeft : parseFloat(style.left);
  const y = style.top === 'auto' ? element.offsetTop : parseFloat(style.top);
  const width = parseFloat(style.width);
  const opacity = parseFloat(style.opacity || 1);
  const scale = parseFloat(element.dataset.editorScale || '1');
  const rotation = parseFloat(element.style.getPropertyValue('--rotation') || style.getPropertyValue('--rotation') || 0) || 0;
  return { x, y, width, scale, opacity, rotation };
};

const applyEditorTransform = (element, key, values) => {
  if (!element || !values) return;
  element.style.left = `${values.x}px`;
  element.style.top = `${values.y}px`;
  element.style.width = `${values.width}px`;
  element.style.opacity = `${values.opacity}`;
  element.dataset.editorScale = `${values.scale}`;
  element.style.setProperty('--editor-scale', `${values.scale}`);
  if (!(key === 'mapTitle' || key === 'cornerLogo')) {
    element.style.setProperty('--rotation', `${values.rotation}deg`);
  }
};

const getLayoutMode = () => (MOBILE_LAYOUT_QUERY.matches ? 'mobile' : 'desktop');

const getEditorStorageKey = (mode = currentLayoutMode) => `${EDITOR_KEY}-${mode}`;

const clearEditorTransforms = () => {
  Object.entries(editorTargets).forEach(([key, element]) => {
    if (!element) return;
    element.style.left = '';
    element.style.top = '';
    element.style.width = '';
    element.style.opacity = '';
    element.dataset.editorScale = '1';
    element.style.removeProperty('--editor-scale');
    if (!(key === 'mapTitle' || key === 'cornerLogo')) {
      element.style.removeProperty('--rotation');
    }
  });
};

const captureEditorDefaults = (mode = currentLayoutMode) => {
  const defaults = {};
  Object.entries(editorTargets).forEach(([key, element]) => {
    defaults[key] = getEditorMetrics(element);
  });
  editorDefaults[mode] = defaults;
};

const saveEditorLayout = (mode = currentLayoutMode) => {
  if (!isLocalEditor) return;
  const payload = {};
  Object.entries(editorTargets).forEach(([key, element]) => {
    payload[key] = getEditorMetrics(element);
  });
  localStorage.setItem(getEditorStorageKey(mode), JSON.stringify(payload));
};

const loadEditorLayout = (mode = currentLayoutMode) => {
  if (!isLocalEditor) return false;
  try {
    const raw = localStorage.getItem(getEditorStorageKey(mode));
    const saved = JSON.parse(raw || '{}');
    if (!Object.keys(saved).length) return false;
    Object.entries(saved).forEach(([key, values]) => applyEditorTransform(editorTargets[key], key, values));
    return true;
  } catch (error) {
    console.warn('Failed to load editor layout', error);
    return false;
  }
};

const initializeEditorLayout = (mode = getLayoutMode()) => {
  currentLayoutMode = mode;
  clearEditorTransforms();
  captureEditorDefaults(mode);
  const preset = LAYOUT_PRESETS[mode];
  if (preset) {
    Object.entries(preset).forEach(([key, values]) => applyEditorTransform(editorTargets[key], key, values));
    editorDefaults[mode] = JSON.parse(JSON.stringify(preset));
  }
  loadEditorLayout(mode);
};

const fillEditorInputs = () => {
  if (!isLocalEditor || !editorTarget) return;
  const key = editorTarget.value;
  const values = getEditorMetrics(editorTargets[key]);
  editorX.value = Math.round(values.x);
  editorY.value = Math.round(values.y);
  editorWidth.value = Math.round(values.width);
  editorScale.value = values.scale;
  editorOpacity.value = values.opacity;
  editorRotation.value = values.rotation;
};

const updateSelectedEditorTarget = () => {
  if (!isLocalEditor || !editorTarget) return;
  const key = editorTarget.value;
  const element = editorTargets[key];
  if (!element) return;
  const values = {
    x: parseFloat(editorX.value || 0),
    y: parseFloat(editorY.value || 0),
    width: parseFloat(editorWidth.value || 0),
    scale: parseFloat(editorScale.value || 1),
    opacity: parseFloat(editorOpacity.value || 1),
    rotation: parseFloat(editorRotation.value || 0),
  };
  applyEditorTransform(element, key, values);
  if (key === "mapTitle") buildDeskChaosLayer();
  saveEditorLayout();
};

const toggleEditorMode = () => {
  if (!isLocalEditor || !editorPanel || !editorCenterMarker) return;
  const nextHidden = !editorPanel.hidden;
  editorPanel.hidden = nextHidden;
  editorCenterMarker.hidden = nextHidden;
  if (!nextHidden) fillEditorInputs();
};

const showNextLogo = () => {
  if (!landingLogo) return;
  landingLogo.src = logoFrames[currentLogoIndex];
  currentLogoIndex = (currentLogoIndex + 1) % logoFrames.length;
};

const setCornerLogo = () => {
  if (!cornerLogo) return;
  cornerLogo.src = pickRandomLogo();
};

const applyResponsiveSources = () => {
  const isMobile = window.matchMedia('(max-width: 900px)').matches;
  responsiveImages.forEach((image) => {
    const keepDesktopOnMobile = image.closest('.map-primary');
    image.src = isMobile && !keepDesktopOnMobile ? image.dataset.mobileSrc : image.dataset.desktopSrc;
  });
};

const getViewportMetrics = () => ({
  width: mapViewport?.clientWidth || window.innerWidth,
  height: mapViewport?.clientHeight || window.innerHeight,
});

const getStageFitScale = () => {
  const mode = getLayoutMode();
  const { width, height } = getViewportMetrics();
  if (mode === 'mobile') {
    const mobileScale = Math.min(width / 430, height / 930);
    return Math.max(0.82, Math.min(1.18, mobileScale));
  }
  const desktopScale = Math.min(width / 1760, height / 1220);
  return Math.max(0.74, Math.min(1.08, desktopScale));
};

const centerMapView = () => {
  if (!mapViewport || !mapCanvas) return;
  const title = editorTargets.mapTitle;
  if (!title) return;
  const metrics = getEditorMetrics(title);
  const naturalRatio = title.naturalWidth && title.naturalHeight
    ? title.naturalHeight / title.naturalWidth
    : ((title.offsetHeight || 1) / (title.offsetWidth || 1));
  const renderedHeight = metrics.width * naturalRatio * metrics.scale;
  const centerX = metrics.x;
  const centerY = metrics.y + renderedHeight * 0.5;
  const viewport = getViewportMetrics();
  stageScale = getStageFitScale();
  stageOffsetX = viewport.width * 0.5 - centerX * stageScale;
  stageOffsetY = viewport.height * 0.5 - centerY * stageScale;
  mapCanvas.style.transform = `translate3d(${stageOffsetX}px, ${stageOffsetY}px, 0) scale(${stageScale})`;
};

const updateParallax = () => {
  if (!mapHome) return;
  mapHome.style.setProperty('--bg-shift-x', `${bgShiftStateX}px`);
  mapHome.style.setProperty('--bg-shift-y', `${bgShiftStateY}px`);
  mapHome.style.setProperty('--title-shift-x', `${titleShiftStateX}px`);
  mapHome.style.setProperty('--title-shift-y', `${titleShiftStateY}px`);
  mapHome.style.setProperty('--object-shift-x', `${objectShiftStateX}px`);
  mapHome.style.setProperty('--object-shift-y', `${objectShiftStateY}px`);
  mapHome.style.setProperty('--note-shift-x', `${noteShiftStateX}px`);
  mapHome.style.setProperty('--note-shift-y', `${noteShiftStateY}px`);
};

const animateParallax = () => {
  const bgTargetX = pointerTargetX * 8 + pointerTargetY * 3;
  const bgTargetY = pointerTargetY * 8 + pointerTargetX * 3;
  const titleTargetX = pointerTargetX * 16 + pointerTargetY * 6;
  const titleTargetY = pointerTargetY * 16 + pointerTargetX * 6;
  const objectTargetX = pointerTargetX * 34 + pointerTargetY * 14;
  const objectTargetY = pointerTargetY * 34 + pointerTargetX * 14;
  const noteTargetX = pointerTargetX * 22 + pointerTargetY * 9;
  const noteTargetY = pointerTargetY * 22 + pointerTargetX * 9;

  bgShiftStateX += (bgTargetX - bgShiftStateX) * 0.08;
  bgShiftStateY += (bgTargetY - bgShiftStateY) * 0.08;
  titleShiftStateX += (titleTargetX - titleShiftStateX) * 0.055;
  titleShiftStateY += (titleTargetY - titleShiftStateY) * 0.055;
  objectShiftStateX += (objectTargetX - objectShiftStateX) * 0.032;
  objectShiftStateY += (objectTargetY - objectShiftStateY) * 0.032;
  noteShiftStateX += (noteTargetX - noteShiftStateX) * 0.042;
  noteShiftStateY += (noteTargetY - noteShiftStateY) * 0.042;

  updateParallax();
  updateTooltipPosition(activeObject);

  const done = [
    Math.abs(bgTargetX - bgShiftStateX),
    Math.abs(bgTargetY - bgShiftStateY),
    Math.abs(titleTargetX - titleShiftStateX),
    Math.abs(titleTargetY - titleShiftStateY),
    Math.abs(objectTargetX - objectShiftStateX),
    Math.abs(objectTargetY - objectShiftStateY),
    Math.abs(noteTargetX - noteShiftStateX),
    Math.abs(noteTargetY - noteShiftStateY),
  ].every((value) => value < 0.08);

  if (done && Math.abs(pointerTargetX) < 0.001 && Math.abs(pointerTargetY) < 0.001) {
    parallaxFrameId = null;
    return;
  }

  parallaxFrameId = requestAnimationFrame(animateParallax);
};

const requestParallax = () => {
  if (parallaxFrameId !== null) return;
  parallaxFrameId = requestAnimationFrame(animateParallax);
};

const updateMotionPointer = (clientX, clientY) => {
  if (!mapViewport) return;
  const rect = mapViewport.getBoundingClientRect();
  const relativeX = (clientX - rect.left) / Math.max(1, rect.width);
  const relativeY = (clientY - rect.top) / Math.max(1, rect.height);
  pointerTargetX = (relativeX - 0.5) * 2;
  pointerTargetY = (relativeY - 0.5) * 2;
  deskChaosPointer.active = true;
  deskChaosPointer.x = (clientX - rect.left - stageOffsetX) / Math.max(stageScale, 0.001);
  deskChaosPointer.y = (clientY - rect.top - stageOffsetY) / Math.max(stageScale, 0.001);
  requestParallax();
  requestDeskChaosFrame();
};

const clearMotionPointer = () => {
  pointerTargetX = 0;
  pointerTargetY = 0;
  clearDeskChaosPointer();
  requestParallax();
};


const setActiveObject = (element, pointer = null) => {
  activeObject = element;
  mapHome?.classList.add('has-focus');
  mapHome?.classList.toggle('has-primary-focus', element.classList.contains('map-primary'));
  interactiveObjects.forEach((object) => {
    object.classList.toggle('is-active', object === element);
  });
  if (!element || !mapTooltip || !mapTooltipTitle || !mapTooltipCopy) return;
  mapTooltipTitle.textContent = element.dataset.title || '';
  mapTooltipCopy.textContent = element.dataset.copy || '';
  mapTooltip.classList.add('is-visible');
  mapTooltip.setAttribute('aria-hidden', 'false');
  updateTooltipPosition(element, pointer);
};

const clearActiveObject = () => {
  activeObject = null;
  mapHome?.classList.remove('has-focus');
  mapHome?.classList.remove('has-primary-focus');
  interactiveObjects.forEach((object) => object.classList.remove('is-active'));
  mapTooltip?.classList.remove('is-visible');
  mapTooltip?.setAttribute('aria-hidden', 'true');
};

const updateInfoPanel = (element) => {
  if (!mapInfoTitle || !mapInfoCopy) return;
  mapInfoTitle.textContent = element?.dataset.title || 'Azic world';
  mapInfoCopy.textContent =
    element?.dataset.detail ||
    '오브젝트 위를 천천히 훑어보세요. 브랜드 세계관이 흩어진 지도처럼 펼쳐져 있습니다.';
};

const enterSite = () => {
  if (!landingGate || body.classList.contains('site-entered')) return;
  body.classList.remove('is-gated');
  body.classList.add('site-entered');
  window.clearInterval(landingIntervalId);
  landingGate.setAttribute('aria-hidden', 'true');
  buildDeskChaosLayer();
  const runCenteringPass = () => {
    centerMapView();
    requestParallax();
  };
  requestAnimationFrame(() => {
    requestAnimationFrame(runCenteringPass);
  });
  window.setTimeout(runCenteringPass, 40);
  window.setTimeout(runCenteringPass, 260);
  window.setTimeout(runCenteringPass, 620);
};

interactiveObjects.forEach((object) => {
  object.addEventListener('mouseenter', (event) => setActiveObject(object, { x: event.clientX, y: event.clientY }));
  object.addEventListener('mousemove', (event) => {
    if (activeObject === object) {
      updateTooltipPosition(object, { x: event.clientX, y: event.clientY });
    }
  });
  object.addEventListener('mouseleave', () => {
    if (activeObject === object) clearActiveObject();
  });
  object.addEventListener('focus', () => setActiveObject(object));
  object.addEventListener('blur', () => {
    if (activeObject === object) clearActiveObject();
  });
  object.addEventListener('click', (event) => {
    if (dragMoved) {
      event.preventDefault();
      return;
    }
    updateInfoPanel(object);
    const href = object.dataset.href;
    if (href) {
      window.location.href = href;
    }
  });
});

setCornerLogo();
showNextLogo();
landingIntervalId = window.setInterval(showNextLogo, 500);
applyResponsiveSources();
initializeEditorLayout(currentLayoutMode);
buildDeskChaosLayer();
window.addEventListener('resize', () => {
  const nextMode = getLayoutMode();
  applyResponsiveSources();
  buildDeskChaosLayer();
  if (nextMode !== currentLayoutMode) {
    initializeEditorLayout(nextMode);
    if (isLocalEditor && editorPanel && !editorPanel.hidden) fillEditorInputs();
  }
  centerMapView();
  requestParallax();
});
window.addEventListener('load', () => {
  currentLayoutMode = getLayoutMode();
  initializeEditorLayout(currentLayoutMode);
  buildDeskChaosLayer();
  centerMapView();
  requestParallax();
  if (isLocalEditor) {
    editorPanel.hidden = true;
    editorCenterMarker.hidden = true;
    fillEditorInputs();
  }
});

landingGate?.addEventListener('click', enterSite);
landingGate?.addEventListener('keydown', (event) => {
  if (event.key === 'Enter' || event.key === ' ') {
    event.preventDefault();
    enterSite();
  }
});

mapViewport?.addEventListener('mousemove', (event) => {
  updateMotionPointer(event.clientX, event.clientY);
});

mapViewport?.addEventListener('mouseleave', () => {
  clearMotionPointer();
});

mapViewport?.addEventListener('touchmove', (event) => {
  const touch = event.touches[0];
  if (!touch) return;
  updateMotionPointer(touch.clientX, touch.clientY);
}, { passive: true });

mapViewport?.addEventListener('touchend', () => {
  clearMotionPointer();
}, { passive: true });

mapViewport?.addEventListener('touchcancel', () => {
  clearMotionPointer();
}, { passive: true });

if (isLocalEditor && editorTarget) {
  editorTarget.addEventListener('change', fillEditorInputs);
  [editorX, editorY, editorWidth, editorScale, editorOpacity, editorRotation].forEach((input) => {
    input?.addEventListener('input', updateSelectedEditorTarget);
  });
  editorResetTarget?.addEventListener('click', () => {
    const key = editorTarget.value;
    applyEditorTransform(editorTargets[key], key, editorDefaults[currentLayoutMode][key]);
    if (key === "mapTitle") buildDeskChaosLayer();
    saveEditorLayout();
    fillEditorInputs();
  });
  editorResetAll?.addEventListener('click', () => {
    Object.entries(editorDefaults[currentLayoutMode]).forEach(([key, values]) => applyEditorTransform(editorTargets[key], key, values));
    buildDeskChaosLayer();
    localStorage.removeItem(getEditorStorageKey(currentLayoutMode));
    fillEditorInputs();
  });
  editorCopy?.addEventListener('click', async () => {
    const payload = {};
    Object.entries(editorTargets).forEach(([key, element]) => {
      payload[key] = getEditorMetrics(element);
    });
    try {
      await navigator.clipboard.writeText(JSON.stringify(payload, null, 2));
      editorCopy.textContent = 'Copied';
      setTimeout(() => {
        editorCopy.textContent = 'Copy layout JSON';
      }, 1000);
    } catch (error) {
      console.warn('Copy failed', error);
    }
  });
  window.addEventListener('keydown', (event) => {
    if (event.shiftKey && event.key.toLowerCase() === 'd') {
      event.preventDefault();
      toggleEditorMode();
    }
  });
}
