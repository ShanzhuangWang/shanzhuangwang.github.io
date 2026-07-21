/* ============================================
   Reflections Page — Timeline Memo
   Add / delete work reflections, persisted in localStorage
   ============================================ */
(function () {
  'use strict';

  const STORAGE_KEY = 'panda_reflections_v1';
  const timelineEl = document.getElementById('timeline');
  const addBtn = document.getElementById('addEntryBtn');
  const overlay = document.getElementById('modalOverlay');
  const closeBtn = document.getElementById('modalClose');
  const cancelBtn = document.getElementById('modalCancel');
  const saveBtn = document.getElementById('modalSave');
  const dateInput = document.getElementById('entryDate');
  const titleInput = document.getElementById('entryTitle');
  const bodyInput = document.getElementById('entryBody');

  // --- Seed sample data (first visit only) ---
  const SEED = [
    {
      id: 'seed-1',
      date: '2026-07-20',
      title: '关于 Agent 招聘的一点思考',
      body: '今天和几位做 Agent 框架的候选人聊下来，发现真正稀缺的不是会调 API 的人，而是能设计多 Agent 协作拓扑、理解上下文窗口与状态管理边界的架构型人才。这类人往往在技术社区有长期沉淀，主动寻猎比等投递更有效。'
    },
    {
      id: 'seed-2',
      date: '2026-03-15',
      title: 'Infra 与算法的招聘节奏差异',
      body: '做分布式训练/推演加速的 Infra 人才，跳槽决策周期明显比算法长——他们更看重算力规模和工程自由度。沟通时要先讲清楚平台能给到多少卡、什么网络拓扑，再谈其他。'
    },
    {
      id: 'seed-3',
      date: '2025-12-01',
      title: '长期主义是这行的底色',
      body: 'AGI 不是一年两年的事。做人才连接也一样，不能只看一次成单，而要真的帮候选人看清三年后的自己。今天拒绝了几个急功近利的短期机会，虽然少赚，但睡得踏实。'
    }
  ];

  function load() {
    let data;
    try {
      data = JSON.parse(localStorage.getItem(STORAGE_KEY));
    } catch (e) {
      data = null;
    }
    if (!data || !Array.isArray(data) || data.length === 0) {
      data = SEED.slice();
      save(data);
    }
    return data;
  }

  function save(data) {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
    } catch (e) {
      /* storage unavailable — keep in memory only */
    }
  }

  function escapeHtml(str) {
    return String(str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  }

  function formatDate(iso) {
    // iso: YYYY-MM-DD -> "Jul 20, 2026" style, but keep Chinese-friendly
    const parts = iso.split('-');
    if (parts.length !== 3) return iso;
    const [y, m, d] = parts;
    const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    return `${monthNames[parseInt(m, 10) - 1]} ${parseInt(d, 10)}, ${y}`;
  }

  function render() {
    let data = load();
    // Sort by date descending (newest first)
    data.sort((a, b) => (a.date < b.date ? 1 : a.date > b.date ? -1 : 0));

    if (!data.length) {
      timelineEl.innerHTML =
        '<p style="text-align:center;color:var(--gray-400);padding:40px 0;">还没有任何感悟，点击下方按钮写下第一条吧 🐼</p>';
      return;
    }

    timelineEl.innerHTML = data
      .map(function (item) {
        const titleHtml = item.title
          ? `<h4 class="timeline-card-title">${escapeHtml(item.title)}</h4>`
          : '';
        return `
          <div class="timeline-item" data-id="${escapeHtml(item.id)}">
            <div class="timeline-dot"></div>
            <div class="timeline-date">${formatDate(item.date)}</div>
            <div class="timeline-card">
              ${titleHtml}
              <p class="timeline-card-body">${escapeHtml(item.body).replace(/\n/g, '<br>')}</p>
              <div class="timeline-actions">
                <button class="timeline-delete" data-del="${escapeHtml(item.id)}">删除</button>
              </div>
            </div>
          </div>`;
      })
      .join('');

    // Bind delete buttons
    timelineEl.querySelectorAll('[data-del]').forEach(function (btn) {
      btn.addEventListener('click', function () {
        const id = this.getAttribute('data-del');
        let current = load();
        current = current.filter(function (x) {
          return x.id !== id;
        });
        save(current);
        render();
      });
    });
  }

  // --- Modal controls ---
  function openModal() {
    // Default date = today
    const now = new Date();
    const today = now.toISOString().split('T')[0];
    dateInput.value = today;
    titleInput.value = '';
    bodyInput.value = '';
    overlay.style.display = 'flex';
    setTimeout(function () {
      titleInput.focus();
    }, 50);
  }

  function closeModal() {
    overlay.style.display = 'none';
  }

  function saveEntry() {
    const date = dateInput.value || new Date().toISOString().split('T')[0];
    const title = titleInput.value.trim();
    const body = bodyInput.value.trim();
    if (!body) {
      bodyInput.focus();
      bodyInput.style.borderColor = '#EF4444';
      setTimeout(function () {
        bodyInput.style.borderColor = '';
      }, 1500);
      return;
    }
    const data = load();
    data.push({
      id: 'r-' + Date.now(),
      date: date,
      title: title,
      body: body
    });
    save(data);
    render();
    closeModal();
  }

  // --- Bind events ---
  if (addBtn) addBtn.addEventListener('click', openModal);
  if (closeBtn) closeBtn.addEventListener('click', closeModal);
  if (cancelBtn) cancelBtn.addEventListener('click', closeModal);
  if (saveBtn) saveBtn.addEventListener('click', saveEntry);
  if (overlay) {
    overlay.addEventListener('click', function (e) {
      if (e.target === overlay) closeModal();
    });
  }
  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape' && overlay && overlay.style.display === 'flex') {
      closeModal();
    }
  });

  // --- Initial render ---
  render();
})();
