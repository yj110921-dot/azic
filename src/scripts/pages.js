
const pageBody = document.body;
const pageType = pageBody.dataset.page;
const pageLogoFrames = Array.from({ length: 36 }, (_, index) => `./assets/images/landing-logos/Group ${index + 24}.png`);
const pickRandomPageLogo = () => pageLogoFrames[Math.floor(Math.random() * pageLogoFrames.length)];

if (pageBody.classList.contains('page-body')) {
  let cornerLogo = document.querySelector('.page-corner-logo');
  if (!cornerLogo) {
    pageBody.insertAdjacentHTML('afterbegin', `
      <a class="page-corner-logo" href="./index.html#story" aria-label="azic 홈페이지로 돌아가기">
        <img src="" alt="azic logo" />
      </a>
    `);
    cornerLogo = document.querySelector('.page-corner-logo');
  }

  const cornerLogoImage = cornerLogo?.querySelector('img');
  if (cornerLogoImage) {
    cornerLogoImage.src = pickRandomPageLogo();
  }
}

const formatDate = (value) => new Intl.DateTimeFormat('ko-KR', {
  year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit'
}).format(new Date(value));

const safeText = (value) => (value || '').trim();

const loadStore = (key) => {
  try {
    return JSON.parse(localStorage.getItem(key) || '[]');
  } catch {
    return [];
  }
};

const saveStore = (key, data) => {
  localStorage.setItem(key, JSON.stringify(data));
};

const escapeHtml = (value) => value
  .replaceAll('&', '&amp;')
  .replaceAll('<', '&lt;')
  .replaceAll('>', '&gt;')
  .replaceAll('"', '&quot;')
  .replaceAll("'", '&#39;');

if (pageType === 'page3') {
  const STORAGE_KEY = 'azic-relay-novel-v1';
  const form = document.getElementById('relayForm');
  const list = document.getElementById('relayEntries');
  const render = () => {
    const entries = loadStore(STORAGE_KEY);
    if (!entries.length) {
      list.innerHTML = '<p class="empty-state">첫 문장을 남겨서 azic의 릴레이 소설을 시작해보세요.</p>';
      return;
    }
    list.innerHTML = entries.map((entry, index) => `
      <article class="novel-panel">
        <div class="entry-meta">${index + 1}번째 문장 · ${escapeHtml(entry.author)} · ${formatDate(entry.createdAt)}</div>
        <div class="entry-copy">${escapeHtml(entry.text)}</div>
      </article>
    `).join('');
  };
  form?.addEventListener('submit', (event) => {
    event.preventDefault();
    const author = safeText(form.author.value) || '익명의 작성자';
    const text = safeText(form.text.value);
    if (!text) return;
    const entries = loadStore(STORAGE_KEY);
    entries.push({ author, text, createdAt: Date.now() });
    saveStore(STORAGE_KEY, entries);
    form.reset();
    render();
  });
  render();
}

if (pageType === 'page4') {
  const STORAGE_KEY = 'azic-upload-community-v1';
  const form = document.getElementById('uploadForm');
  const list = document.getElementById('communityFeed');

  const renderFeed = () => {
    const posts = loadStore(STORAGE_KEY);
    if (!posts.length) {
      list.innerHTML = '<p class="empty-state">아직 첫 책장이 올라오지 않았어요. 쌓여 있는 책 사진이나 마음을 남겨보세요.</p>';
      return;
    }
    list.innerHTML = posts.map((post) => `
      <article class="feed-card" data-post-id="${post.id}">
        ${post.image ? `<img src="${post.image}" alt="${escapeHtml(post.title)} 이미지" />` : ''}
        <div class="entry-meta">${escapeHtml(post.author)} · ${formatDate(post.createdAt)}</div>
        <h3>${escapeHtml(post.title)}</h3>
        <p class="feed-card__copy">${escapeHtml(post.story)}</p>
        <section class="comment-list">
          ${(post.comments || []).length ? (post.comments || []).map((comment) => `
            <div class="comment-card">
              <div class="comment-meta">${escapeHtml(comment.author)} · ${formatDate(comment.createdAt)}</div>
              <div>${escapeHtml(comment.text)}</div>
            </div>
          `).join('') : '<p class="empty-state">첫 코멘트를 남겨보세요.</p>'}
        </section>
        <form class="comment-form" data-comment-form="${post.id}">
          <input name="author" type="text" placeholder="닉네임" />
          <textarea name="text" placeholder="이 책장에 한마디 남겨보세요."></textarea>
          <button type="submit">코멘트 남기기</button>
        </form>
      </article>
    `).join('');

    list.querySelectorAll('[data-comment-form]').forEach((commentForm) => {
      commentForm.addEventListener('submit', (event) => {
        event.preventDefault();
        const postId = commentForm.dataset.commentForm;
        const author = safeText(commentForm.author.value) || '익명의 방문자';
        const text = safeText(commentForm.text.value);
        if (!text) return;
        const posts = loadStore(STORAGE_KEY);
        const target = posts.find((post) => post.id === postId);
        if (!target) return;
        target.comments = target.comments || [];
        target.comments.push({ author, text, createdAt: Date.now() });
        saveStore(STORAGE_KEY, posts);
        renderFeed();
      });
    });
  };

  form?.addEventListener('submit', async (event) => {
    event.preventDefault();
    const author = safeText(form.author.value) || '익명의 방문자';
    const title = safeText(form.title.value);
    const story = safeText(form.story.value);
    const file = form.image.files?.[0];
    if (!title || !story) return;

    const toDataUrl = (blob) => new Promise((resolve) => {
      if (!blob) return resolve('');
      const reader = new FileReader();
      reader.onload = () => resolve(String(reader.result || ''));
      reader.readAsDataURL(blob);
    });

    const image = await toDataUrl(file);
    const posts = loadStore(STORAGE_KEY);
    posts.unshift({
      id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      author,
      title,
      story,
      image,
      comments: [],
      createdAt: Date.now(),
    });
    saveStore(STORAGE_KEY, posts);
    form.reset();
    renderFeed();
  });

  renderFeed();
}


if (pageType === 'page1') {
  const archiveRail = document.getElementById('aboutArchiveRail');
  const archiveTrack = document.getElementById('aboutArchiveTrack');
  const archiveUpload = document.getElementById('aboutArchiveUpload');
  const aboutModal = document.getElementById('aboutModal');
  const aboutModalImage = document.getElementById('aboutModalImage');
  const aboutModalClose = document.getElementById('aboutModalClose');
  const ARCHIVE_KEY = 'azic-about-archive-v1';
  const baseArchive = [
    './assets/images/about-assets/이미지 아카이빙 존/overview.png',
    './assets/images/about-assets/이미지 아카이빙 존/overview-1.png',
    './assets/images/about-assets/이미지 아카이빙 존/overview-2.png',
    './assets/images/about-assets/이미지 아카이빙 존/overview-3.png',
    './assets/images/about-assets/이미지 아카이빙 존/overview-4.png',
    './assets/images/about-assets/이미지 아카이빙 존/overview-5.png',
    './assets/images/about-assets/이미지 아카이빙 존/overview-6.png',
    './assets/images/about-assets/이미지 아카이빙 존/overview-7.png',
    './assets/images/about-assets/이미지 아카이빙 존/overview-8.png',
    './assets/images/about-assets/이미지 아카이빙 존/overview-9.png'
  ];

  let archivePaused = false;

  const renderArchive = () => {
    const uploaded = loadStore(ARCHIVE_KEY);
    const images = [...baseArchive, ...uploaded];
    archiveTrack.innerHTML = images.map((src, index) => `
      <button class="about-archive__item" type="button" data-archive-src="${src}" aria-label="archive image ${index + 1}">
        <img src="${src}" alt="about archive image ${index + 1}" />
      </button>
    `).join('');

    archiveTrack.querySelectorAll('[data-archive-src]').forEach((button) => {
      button.addEventListener('click', () => {
        aboutModalImage.src = button.dataset.archiveSrc;
        aboutModal.hidden = false;
      });
    });
  };

  const readFiles = async (files) => {
    const toDataUrl = (blob) => new Promise((resolve) => {
      const reader = new FileReader();
      reader.onload = () => resolve(String(reader.result || ''));
      reader.readAsDataURL(blob);
    });
    return Promise.all(Array.from(files).map(toDataUrl));
  };

  archiveUpload?.addEventListener('change', async () => {
    const files = archiveUpload.files;
    if (!files?.length) return;
    const uploaded = loadStore(ARCHIVE_KEY);
    uploaded.push(...await readFiles(files));
    saveStore(ARCHIVE_KEY, uploaded);
    archiveUpload.value = '';
    renderArchive();
  });

  aboutModalClose?.addEventListener('click', () => {
    aboutModal.hidden = true;
    aboutModalImage.src = '';
  });

  aboutModal?.addEventListener('click', (event) => {
    if (event.target === aboutModal) {
      aboutModal.hidden = true;
      aboutModalImage.src = '';
    }
  });

  archiveRail?.addEventListener('mouseenter', () => { archivePaused = true; });
  archiveRail?.addEventListener('mouseleave', () => { archivePaused = false; });
  archiveRail?.addEventListener('touchstart', () => { archivePaused = true; }, { passive: true });
  archiveRail?.addEventListener('touchend', () => { archivePaused = false; }, { passive: true });

  const autoScroll = () => {
    if (archiveRail && !archivePaused) {
      archiveRail.scrollLeft += 0.55;
      if (archiveRail.scrollLeft >= archiveRail.scrollWidth - archiveRail.clientWidth - 1) {
        archiveRail.scrollLeft = 0;
      }
    }
    requestAnimationFrame(autoScroll);
  };



  if (location.protocol === 'file:') {
    const messageCanvas = document.querySelector('.about-message__canvas');
    const messageTargets = {
      yejinCard: document.querySelector('.about-message__note--yejin'),
      yejinPhotoA: document.querySelector('.about-message__photo--yejin-main'),
      yejinPhotoB: document.querySelector('.about-message__photo--yejin-side'),
      sebinPhotoA: document.querySelector('.about-message__photo--sebin'),
      sebinCard: document.querySelector('.about-message__note--sebin'),
      yejiCard: document.querySelector('.about-message__note--yeji'),
      yejiPhotoA: document.querySelector('.about-message__photo--yeji-main'),
      yejiPhotoB: document.querySelector('.about-message__photo--yeji-side'),
      yewonPhoto: document.querySelector('.about-message__photo--yewon'),
      yewonCard: document.querySelector('.about-message__note--yewon'),
    };

    if (messageCanvas && Object.values(messageTargets).every(Boolean)) {
      const modeQuery = window.matchMedia('(max-width: 900px)');
      const editorStorageKey = 'azic-about-message-editor-v1';
      let currentMode = modeQuery.matches ? 'mobile' : 'desktop';
      const editorDefaults = { desktop: {}, mobile: {} };
      let selectedKey = 'yejinCard';

      const parseTransform = (value) => {
        if (!value || value === 'none') return { scale: 1, rotation: 0 };
        const match = value.match(/matrix\(([^)]+)\)/);
        if (!match) return { scale: 1, rotation: 0 };
        const [a, b] = match[1].split(',').map((part) => parseFloat(part.trim()));
        const scale = Math.sqrt((a || 1) * (a || 1) + (b || 0) * (b || 0)) || 1;
        const rotation = Math.atan2(b || 0, a || 1) * (180 / Math.PI);
        return { scale, rotation };
      };

      const getMetrics = (element) => {
        const canvasRect = messageCanvas.getBoundingClientRect();
        const rect = element.getBoundingClientRect();
        const styles = getComputedStyle(element);
        const transform = parseTransform(styles.transform);
        return {
          x: rect.left - canvasRect.left,
          y: rect.top - canvasRect.top,
          width: rect.width,
          scale: Number(transform.scale.toFixed(2)),
          opacity: Number(parseFloat(styles.opacity || '1').toFixed(2)),
          rotation: Number(transform.rotation.toFixed(1)),
        };
      };

      const applyMetrics = (element, values) => {
        element.classList.add('about-message__editable');
        element.style.position = 'absolute';
        element.style.left = `${values.x}px`;
        element.style.top = `${values.y}px`;
        element.style.right = 'auto';
        element.style.bottom = 'auto';
        element.style.width = `${values.width}px`;
        element.style.opacity = values.opacity;
        element.style.transform = `rotate(${values.rotation}deg) scale(${values.scale})`;
      };

      const captureDefaults = () => {
        currentMode = modeQuery.matches ? 'mobile' : 'desktop';
        Object.entries(messageTargets).forEach(([key, element]) => {
          const metrics = getMetrics(element);
          editorDefaults[currentMode][key] = metrics;
          applyMetrics(element, metrics);
        });
      };

      const loadStore = () => {
        try {
          return JSON.parse(localStorage.getItem(editorStorageKey) || '{}');
        } catch {
          return {};
        }
      };

      const saveStoreState = () => {
        const store = loadStore();
        store[currentMode] = store[currentMode] || {};
        Object.entries(messageTargets).forEach(([key, element]) => {
          store[currentMode][key] = getMetrics(element);
        });
        localStorage.setItem(editorStorageKey, JSON.stringify(store));
      };

      const applyStoredLayout = () => {
        const store = loadStore();
        const data = store[currentMode] || {};
        Object.entries(messageTargets).forEach(([key, element]) => {
          applyMetrics(element, data[key] || editorDefaults[currentMode][key]);
        });
      };

      pageBody.insertAdjacentHTML('beforeend', `
        <aside class="about-message-editor" id="aboutMessageEditor" hidden>
          <div class="about-message-editor__header">
            <strong>Message Layout</strong>
            <span>Shift + D</span>
          </div>
          <label class="about-message-editor__field">
            <span>Target</span>
            <select id="aboutMessageTarget">
              <option value="yejinCard">예진 카드</option>
              <option value="yejinPhotoA">예진 사진 A</option>
              <option value="yejinPhotoB">예진 사진 B</option>
              <option value="sebinPhotoA">세빈 사진 A</option>
              <option value="sebinCard">세빈 카드</option>
              <option value="yejiCard">예지 카드</option>
              <option value="yejiPhotoA">예지 사진 A</option>
              <option value="yejiPhotoB">예지 사진 B</option>
              <option value="yewonPhoto">예원 사진</option>
              <option value="yewonCard">예원 카드</option>
            </select>
          </label>
          <label class="about-message-editor__field"><span>X</span><input id="aboutMessageX" type="number" step="1" /></label>
          <label class="about-message-editor__field"><span>Y</span><input id="aboutMessageY" type="number" step="1" /></label>
          <label class="about-message-editor__field"><span>Width</span><input id="aboutMessageWidth" type="number" step="1" min="40" /></label>
          <label class="about-message-editor__field"><span>Scale</span><input id="aboutMessageScale" type="number" step="0.01" min="0.1" /></label>
          <label class="about-message-editor__field"><span>Opacity</span><input id="aboutMessageOpacity" type="number" step="0.01" min="0" max="1" /></label>
          <label class="about-message-editor__field"><span>Rotation</span><input id="aboutMessageRotation" type="number" step="0.1" /></label>
          <div class="about-message-editor__actions">
            <button id="aboutMessageResetTarget" type="button">Reset target</button>
            <button id="aboutMessageResetAll" type="button">Reset all</button>
          </div>
          <button class="about-message-editor__copy" id="aboutMessageCopy" type="button">Copy layout JSON</button>
          <p class="about-message-editor__hint">about message 섹션 전용 로컬 편집 모드</p>
        </aside>
      `);

      const panel = document.getElementById('aboutMessageEditor');
      const targetSelect = document.getElementById('aboutMessageTarget');
      const inputX = document.getElementById('aboutMessageX');
      const inputY = document.getElementById('aboutMessageY');
      const inputWidth = document.getElementById('aboutMessageWidth');
      const inputScale = document.getElementById('aboutMessageScale');
      const inputOpacity = document.getElementById('aboutMessageOpacity');
      const inputRotation = document.getElementById('aboutMessageRotation');
      const resetTargetButton = document.getElementById('aboutMessageResetTarget');
      const resetAllButton = document.getElementById('aboutMessageResetAll');
      const copyButton = document.getElementById('aboutMessageCopy');

      const refreshSelection = () => {
        Object.entries(messageTargets).forEach(([key, element]) => {
          element.classList.toggle('is-selected', key === selectedKey);
        });
        const values = getMetrics(messageTargets[selectedKey]);
        targetSelect.value = selectedKey;
        inputX.value = Math.round(values.x);
        inputY.value = Math.round(values.y);
        inputWidth.value = Math.round(values.width);
        inputScale.value = values.scale;
        inputOpacity.value = values.opacity;
        inputRotation.value = values.rotation;
      };

      const updateSelected = () => {
        const element = messageTargets[selectedKey];
        applyMetrics(element, {
          x: parseFloat(inputX.value || '0'),
          y: parseFloat(inputY.value || '0'),
          width: parseFloat(inputWidth.value || '0'),
          scale: parseFloat(inputScale.value || '1'),
          opacity: parseFloat(inputOpacity.value || '1'),
          rotation: parseFloat(inputRotation.value || '0'),
        });
        saveStoreState();
        refreshSelection();
      };

      captureDefaults();
      applyStoredLayout();
      refreshSelection();

      targetSelect.addEventListener('change', () => {
        selectedKey = targetSelect.value;
        refreshSelection();
      });
      [inputX, inputY, inputWidth, inputScale, inputOpacity, inputRotation].forEach((input) => {
        input.addEventListener('input', updateSelected);
      });

      resetTargetButton.addEventListener('click', () => {
        applyMetrics(messageTargets[selectedKey], editorDefaults[currentMode][selectedKey]);
        saveStoreState();
        refreshSelection();
      });

      resetAllButton.addEventListener('click', () => {
        Object.entries(messageTargets).forEach(([key, element]) => {
          applyMetrics(element, editorDefaults[currentMode][key]);
        });
        saveStoreState();
        refreshSelection();
      });

      copyButton.addEventListener('click', async () => {
        const payload = {};
        Object.entries(messageTargets).forEach(([key, element]) => {
          payload[key] = getMetrics(element);
        });
        await navigator.clipboard.writeText(JSON.stringify(payload, null, 2));
        copyButton.textContent = 'Copied!';
        window.setTimeout(() => { copyButton.textContent = 'Copy layout JSON'; }, 900);
      });

      window.addEventListener('keydown', (event) => {
        if (event.key.toLowerCase() === 'd' && event.shiftKey) {
          event.preventDefault();
          panel.hidden = !panel.hidden;
          if (!panel.hidden) refreshSelection();
        }
      });

      window.addEventListener('resize', () => {
        const nextMode = modeQuery.matches ? 'mobile' : 'desktop';
        if (nextMode !== currentMode) {
          currentMode = nextMode;
          captureDefaults();
          applyStoredLayout();
          refreshSelection();
        }
      });
    }
  }

  renderArchive();
  requestAnimationFrame(autoScroll);
}

