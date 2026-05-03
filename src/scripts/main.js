const body = document.body;
const landingGate = document.getElementById("landingGate");
const landingLogo = document.getElementById("landingLogo");
const cornerLogo = document.getElementById("cornerLogo");
const mapViewport = document.getElementById("mapViewport");
const mapCanvas = document.getElementById("mapCanvas");
const mapHome = document.getElementById("mapHome");
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
let targetScrollLeft = 0;
let targetScrollTop = 0;
let bgScrollLeft = 0;
let bgScrollTop = 0;
let titleScrollLeft = 0;
let titleScrollTop = 0;
let objectScrollLeft = 0;
let objectScrollTop = 0;
let noteScrollLeft = 0;
let noteScrollTop = 0;
let parallaxFrameId = null;
const EDITOR_KEY = 'azic-local-editor-v2';
const MOBILE_LAYOUT_QUERY = window.matchMedia('(max-width: 900px)');
const isLocalEditor = location.protocol === 'file:';
const editorTargets = {
  mapTitle: document.getElementById('mapTitle'),
  mapBackground: document.getElementById('mapBackground'),
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
    mapTitle: { x: 2105, y: 1312, width: 880, scale: 0.74, opacity: 1, rotation: 0 },
    mapBackground: { x: 2099, y: -193, width: 3978, scale: 0.42, opacity: 1, rotation: 0 },
    about: { x: 2138, y: 1210, width: 119, scale: 1.91, opacity: 1, rotation: -8 },
    upload: { x: 1731, y: 1720, width: 71, scale: 1.37, opacity: 1, rotation: -14.5 },
    roundRobin: { x: 1995, y: 1755, width: 162, scale: 1.74, opacity: 1, rotation: 4.5 },
    product: { x: 1546, y: 1209, width: 172, scale: 1.86, opacity: 1, rotation: 3.5 },
    cornerLogo: { x: 24, y: 20, width: 108, scale: 1, opacity: 0.92, rotation: 0 },
  },
  mobile: {
    mapTitle: { x: 1100, y: 1240, width: 180, scale: 1, opacity: 1, rotation: 0 },
    mapBackground: { x: 1083, y: 1017, width: 387, scale: 1.07, opacity: 1, rotation: 0 },
    about: { x: 1029, y: 1090, width: 59, scale: 1.07, opacity: 1, rotation: 48 },
    upload: { x: 903, y: 1252, width: 41, scale: 0.89, opacity: 1, rotation: -4 },
    roundRobin: { x: 974, y: 1263, width: 110, scale: 0.97, opacity: 1, rotation: -7 },
    product: { x: 825, y: 1066, width: 110, scale: 0.91, opacity: 1, rotation: -6 },
    cornerLogo: { x: 24, y: 20, width: 108, scale: 1, opacity: 0.92, rotation: 0 },
  },
};

const ENTRY_VIEW_PRESETS = {};

const pickRandomLogo = () => logoFrames[Math.floor(Math.random() * logoFrames.length)];

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
  if (!(key === 'mapTitle' || key === 'mapBackground' || key === 'cornerLogo')) {
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
    if (!(key === 'mapTitle' || key === 'mapBackground' || key === 'cornerLogo')) {
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

const syncScrollTargets = () => {
  if (!mapViewport) return;
  targetScrollLeft = mapViewport.scrollLeft;
  targetScrollTop = mapViewport.scrollTop;
  if (!bgScrollLeft && !bgScrollTop && !titleScrollLeft && !titleScrollTop && !objectScrollLeft && !objectScrollTop && !noteScrollLeft && !noteScrollTop) {
    bgScrollLeft = titleScrollLeft = objectScrollLeft = noteScrollLeft = targetScrollLeft;
    bgScrollTop = titleScrollTop = objectScrollTop = noteScrollTop = targetScrollTop;
  }
};

const clampTargets = () => {
  if (!mapViewport) return;
  const maxLeft = Math.max(0, mapViewport.scrollWidth - mapViewport.clientWidth);
  const maxTop = Math.max(0, mapViewport.scrollHeight - mapViewport.clientHeight);
  targetScrollLeft = Math.min(maxLeft, Math.max(0, targetScrollLeft));
  targetScrollTop = Math.min(maxTop, Math.max(0, targetScrollTop));
};

const centerMapView = () => {
  if (!mapViewport) return;
  const mode = getLayoutMode();
  const maxLeft = Math.max(0, mapViewport.scrollWidth - mapViewport.clientWidth);
  const maxTop = Math.max(0, mapViewport.scrollHeight - mapViewport.clientHeight);
  const preset = ENTRY_VIEW_PRESETS[mode];
  if (preset) {
    mapViewport.scrollLeft = Math.min(maxLeft, Math.max(0, preset.left));
    mapViewport.scrollTop = Math.min(maxTop, Math.max(0, preset.top));
    syncScrollTargets();
    return;
  }
  const title = editorTargets.mapTitle;
  if (!title) return;
  const metrics = getEditorMetrics(title);
  const naturalRatio = title.naturalWidth && title.naturalHeight
    ? title.naturalHeight / title.naturalWidth
    : ((title.offsetHeight || 1) / (title.offsetWidth || 1));
  const renderedHeight = metrics.width * naturalRatio * metrics.scale;
  const centerX = metrics.x;
  const centerY = metrics.y + renderedHeight * 0.5;
  const nextLeft = Math.min(maxLeft, Math.max(0, centerX - mapViewport.clientWidth * 0.5));
  const nextTop = Math.min(maxTop, Math.max(0, centerY - mapViewport.clientHeight * 0.5));
  mapViewport.scrollLeft = nextLeft;
  mapViewport.scrollTop = nextTop;
  syncScrollTargets();
};

const updateTooltipPosition = (element) => {
  if (!mapTooltip || !mapViewport || !element) return;
  const viewportRect = mapViewport.getBoundingClientRect();
  const rect = element.getBoundingClientRect();
  const tooltipX = Math.min(
    Math.max(rect.left - viewportRect.left + rect.width * 0.5 + 24, 18),
    viewportRect.width - 300
  );
  const tooltipY = Math.min(
    Math.max(rect.top - viewportRect.top - 28, 18),
    viewportRect.height - 120
  );
  mapTooltip.style.left = `${tooltipX}px`;
  mapTooltip.style.top = `${tooltipY}px`;
};

const updateParallax = () => {
  if (!mapHome) return;

  const bgShiftX = (-bgScrollLeft * 0.012) + (-bgScrollTop * 0.003);
  const bgShiftY = (-bgScrollTop * 0.012) + (-bgScrollLeft * 0.003);

  const titleShiftX = (-titleScrollLeft * 0.026) + (-titleScrollTop * 0.01);
  const titleShiftY = (-titleScrollTop * 0.026) + (-titleScrollLeft * 0.01);

  const objectShiftX = (objectScrollLeft * 0.075) + (objectScrollTop * 0.03);
  const objectShiftY = (objectScrollTop * 0.075) + (objectScrollLeft * 0.03);

  const noteShiftX = (noteScrollLeft * 0.05) + (noteScrollTop * 0.018);
  const noteShiftY = (noteScrollTop * 0.05) + (noteScrollLeft * 0.018);

  mapHome.style.setProperty('--bg-shift-x', `${bgShiftX}px`);
  mapHome.style.setProperty('--bg-shift-y', `${bgShiftY}px`);
  mapHome.style.setProperty('--title-shift-x', `${titleShiftX}px`);
  mapHome.style.setProperty('--title-shift-y', `${titleShiftY}px`);
  mapHome.style.setProperty('--object-shift-x', `${objectShiftX}px`);
  mapHome.style.setProperty('--object-shift-y', `${objectShiftY}px`);
  mapHome.style.setProperty('--note-shift-x', `${noteShiftX}px`);
  mapHome.style.setProperty('--note-shift-y', `${noteShiftY}px`);
};

const animateParallax = () => {
  if (!mapViewport) {
    parallaxFrameId = null;
    return;
  }

  clampTargets();

  const nextViewportLeft = mapViewport.scrollLeft + (targetScrollLeft - mapViewport.scrollLeft) * 0.13;
  const nextViewportTop = mapViewport.scrollTop + (targetScrollTop - mapViewport.scrollTop) * 0.13;
  mapViewport.scrollLeft = nextViewportLeft;
  mapViewport.scrollTop = nextViewportTop;

  const sourceLeft = mapViewport.scrollLeft;
  const sourceTop = mapViewport.scrollTop;

  bgScrollLeft += (sourceLeft - bgScrollLeft) * 0.14;
  bgScrollTop += (sourceTop - bgScrollTop) * 0.14;

  titleScrollLeft += (sourceLeft - titleScrollLeft) * 0.075;
  titleScrollTop += (sourceTop - titleScrollTop) * 0.075;

  objectScrollLeft += (sourceLeft - objectScrollLeft) * 0.03;
  objectScrollTop += (sourceTop - objectScrollTop) * 0.03;

  noteScrollLeft += (sourceLeft - noteScrollLeft) * 0.045;
  noteScrollTop += (sourceTop - noteScrollTop) * 0.045;

  updateParallax();
  updateTooltipPosition(activeObject);

  const viewportDone = Math.abs(targetScrollLeft - mapViewport.scrollLeft) < 0.18 && Math.abs(targetScrollTop - mapViewport.scrollTop) < 0.18;
  const bgDone = Math.abs(sourceLeft - bgScrollLeft) < 0.08 && Math.abs(sourceTop - bgScrollTop) < 0.08;
  const titleDone = Math.abs(sourceLeft - titleScrollLeft) < 0.08 && Math.abs(sourceTop - titleScrollTop) < 0.08;
  const objectDone = Math.abs(sourceLeft - objectScrollLeft) < 0.08 && Math.abs(sourceTop - objectScrollTop) < 0.08;
  const noteDone = Math.abs(sourceLeft - noteScrollLeft) < 0.08 && Math.abs(sourceTop - noteScrollTop) < 0.08;

  if (viewportDone && bgDone && titleDone && objectDone && noteDone) {
    mapViewport.scrollLeft = targetScrollLeft;
    mapViewport.scrollTop = targetScrollTop;
    bgScrollLeft = titleScrollLeft = objectScrollLeft = noteScrollLeft = targetScrollLeft;
    bgScrollTop = titleScrollTop = objectScrollTop = noteScrollTop = targetScrollTop;
    updateParallax();
    updateTooltipPosition(activeObject);
    parallaxFrameId = null;
    return;
  }

  parallaxFrameId = requestAnimationFrame(animateParallax);
};

const requestParallax = () => {
  syncScrollTargets();
  clampTargets();
  if (parallaxFrameId !== null) return;
  parallaxFrameId = requestAnimationFrame(animateParallax);
};

const nudgeMap = (deltaX, deltaY) => {
  targetScrollLeft += deltaX;
  targetScrollTop += deltaY;
  clampTargets();
  if (parallaxFrameId === null) {
    parallaxFrameId = requestAnimationFrame(animateParallax);
  }
};


const setActiveObject = (element) => {
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
  updateTooltipPosition(element);
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
  object.addEventListener('mouseenter', () => setActiveObject(object));
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
window.addEventListener('resize', () => {
  const nextMode = getLayoutMode();
  applyResponsiveSources();
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

mapViewport?.addEventListener('mousedown', (event) => {
  if (event.button !== 0 || event.target.closest('.map-object')) return;
  isDragging = true;
  dragMoved = false;
  dragStartX = event.clientX;
  dragStartY = event.clientY;
  dragScrollLeft = mapViewport.scrollLeft;
  dragScrollTop = mapViewport.scrollTop;
  mapViewport.classList.add('is-dragging');
});

window.addEventListener('mousemove', (event) => {
  if (!isDragging || !mapViewport) return;
  const dx = event.clientX - dragStartX;
  const dy = event.clientY - dragStartY;
  if (Math.abs(dx) > 3 || Math.abs(dy) > 3) dragMoved = true;
  targetScrollLeft = dragScrollLeft - dx;
  targetScrollTop = dragScrollTop - dy;
  clampTargets();
  if (parallaxFrameId === null) {
    parallaxFrameId = requestAnimationFrame(animateParallax);
  }
});

window.addEventListener('mouseup', () => {
  isDragging = false;
  mapViewport?.classList.remove('is-dragging');
  window.setTimeout(() => {
    dragMoved = false;
  }, 10);
});

mapViewport?.addEventListener('wheel', (event) => {
  event.preventDefault();
  nudgeMap(event.deltaX, event.deltaY);
}, { passive: false });

mapViewport?.addEventListener('scroll', () => {
  if (isDragging || parallaxFrameId !== null) return;
  requestParallax();
});


if (isLocalEditor && editorTarget) {
  editorTarget.addEventListener('change', fillEditorInputs);
  [editorX, editorY, editorWidth, editorScale, editorOpacity, editorRotation].forEach((input) => {
    input?.addEventListener('input', updateSelectedEditorTarget);
  });
  editorResetTarget?.addEventListener('click', () => {
    const key = editorTarget.value;
    applyEditorTransform(editorTargets[key], key, editorDefaults[currentLayoutMode][key]);
    saveEditorLayout();
    fillEditorInputs();
  });
  editorResetAll?.addEventListener('click', () => {
    Object.entries(editorDefaults[currentLayoutMode]).forEach(([key, values]) => applyEditorTransform(editorTargets[key], key, values));
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
