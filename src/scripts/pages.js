
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



  renderArchive();
  requestAnimationFrame(autoScroll);
}

