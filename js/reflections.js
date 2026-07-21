/* ============================================
   Reflections Page — Timeline Memo
   - Public data source: js/reflections-data.json (shared, read by all visitors)
   - Owner unlocks with password → edits locally → exports data to update site
   - Visitors see the shared JSON (same content for everyone)
   ============================================ */
(function () {
  'use strict';

  /* ========== CONFIG ========= */
  var ADMIN_PASSWORD = 'panda2026';  // ← 改这里换密码
  var SESSION_KEY = 'panda_admin_unlocked';
  var DRAFT_KEY = 'panda_reflections_draft';  // local edits before publishing
  var DATA_URL = 'js/reflections-data.json';

  /* ========== DOM refs ========= */
  var timelineEl = document.getElementById('timeline');
  var addBtn = document.getElementById('addEntryBtn');
  var addWrapper = document.getElementById('addEntryWrapper');
  var overlay = document.getElementById('modalOverlay');
  var closeBtn = document.getElementById('modalClose');
  var cancelBtn = document.getElementById('modalCancel');
  var saveBtn = document.getElementById('modalSave');
  var dateInput = document.getElementById('entryDate');
  var titleInput = document.getElementById('entryTitle');
  var bodyInput = document.getElementById('entryBody');
  var pwdInput = document.getElementById('adminPwdInput');
  var unlockBtn = document.getElementById('adminUnlockBtn');
  var lockBtn = document.getElementById('adminLockBtn');
  var lockedView = document.getElementById('adminLockedView');
  var unlockedView = document.getElementById('adminUnlockedView');
  var exportBtn = document.getElementById('exportDataBtn');

  /* ========== Shared data (fetched from JSON) ========== */
  var sharedData = [];
  var dataReady = false;

  function fetchSharedData(cb) {
    var xhr = new XMLHttpRequest();
    xhr.open('GET', DATA_URL + '?t=' + Date.now(), true);  // cache-buster
    xhr.onreadystatechange = function () {
      if (xhr.readyState === 4) {
        if (xhr.status === 200) {
          try {
            sharedData = JSON.parse(xhr.responseText);
          } catch (e) {
            sharedData = [];
          }
        }
        dataReady = true;
        if (cb) cb();
      }
    };
    xhr.send();
  }

  /* ========== Auth helpers ========= */
  function isUnlocked() {
    return sessionStorage.getItem(SESSION_KEY) === '1';
  }
  function unlock() {
    sessionStorage.setItem(SESSION_KEY, '1');
    applyLockState();
  }
  function lock() {
    sessionStorage.removeItem(SESSION_KEY);
    applyLockState();
  }

  /* ========== Draft (local edits) helpers ========== */
  // When unlocked, edits go to a local draft (localStorage) so the owner
  // can preview changes. Others still see the shared JSON.
  function loadDraft() {
    try {
      var d = JSON.parse(localStorage.getItem(DRAFT_KEY));
      if (d && Array.isArray(d)) return d;
    } catch (e) {}
    return null;
  }
  function saveDraft(data) {
    try {
      localStorage.setItem(DRAFT_KEY, JSON.stringify(data));
    } catch (e) {}
  }
  function clearDraft() {
    try {
      localStorage.removeItem(DRAFT_KEY);
    } catch (e) {}
  }

  /* ========== Current data ========= */
  // Unlocked → draft if exists, else shared.
  // Locked → shared.
  function currentData() {
    if (isUnlocked()) {
      var draft = loadDraft();
      if (draft) return draft;
    }
    return sharedData;
  }

  function applyLockState() {
    var ok = isUnlocked();
    if (addWrapper) addWrapper.style.display = ok ? '' : 'none';
    if (lockedView) lockedView.style.display = ok ? 'none' : '';
    if (unlockedView) unlockedView.style.display = ok ? '' : 'none';
    render();
  }

  /* --- Unlock button handler --- */
  if (unlockBtn) {
    unlockBtn.addEventListener('click', function () {
      var val = pwdInput ? pwdInput.value : '';
      if (val === ADMIN_PASSWORD) {
        unlock();
        if (pwdInput) { pwdInput.value = ''; }
      } else {
        if (pwdInput) {
          pwdInput.style.borderColor = '#EF4444';
          setTimeout(function () { pwdInput.style.borderColor = ''; }, 1500);
        }
      }
    });
  }

  /* --- Lock button handler (manually lock back to read-only) --- */
  if (lockBtn) {
    lockBtn.addEventListener('click', function () {
      lock();
    });
  }
  if (pwdInput) {
    pwdInput.addEventListener('keydown', function (e) {
      if (e.key === 'Enter') {
        if (unlockBtn) unlockBtn.click();
      }
    });
  }

  /* --- Export data button: copy latest JSON to clipboard --- */
  if (exportBtn) {
    exportBtn.addEventListener('click', function () {
      var data = currentData();
      var text = JSON.stringify(data, null, 2);
      // Try clipboard API, fallback to prompt
      if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(text).then(function () {
          exportBtn.textContent = '✅ 已复制！发给助手更新';
          setTimeout(function () {
            exportBtn.textContent = '📋 复制最新数据（用于更新网站）';
          }, 2500);
        }).catch(function () {
          window.prompt('复制下面这段数据，发给助手更新到网站：', text);
        });
      } else {
        window.prompt('复制下面这段数据，发给助手更新到网站：', text);
      }
    });
  }

  /* ========== Utils ========= */
  function escapeHtml(str) {
    return String(str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  }

  function formatDate(iso) {
    var parts = String(iso).split('-');
    if (parts.length !== 3) return iso;
    var y = parts[0], m = parts[1], d = parts[2];
    var monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    return monthNames[parseInt(m, 10) - 1] + ' ' + parseInt(d, 10) + ', ' + y;
  }

  function render() {
    var data = currentData().slice();
    var ok = isUnlocked();
    // Sort by date descending (newest first)
    data.sort(function (a, b) {
      return a.date < b.date ? 1 : a.date > b.date ? -1 : 0;
    });

    if (!dataReady) {
      timelineEl.innerHTML =
        '<p style="text-align:center;color:var(--gray-400);padding:40px 0;">加载中… 🐼</p>';
      return;
    }

    if (!data.length) {
      timelineEl.innerHTML =
        '<p style="text-align:center;color:var(--gray-400);padding:40px 0;">' +
        (ok ? '还没有任何感悟，点击上方按钮写下第一条吧 🐼' : '还没有发布任何感悟 🐼') +
        '</p>';
      return;
    }

    timelineEl.innerHTML = data
      .map(function (item) {
        var titleHtml = item.title
          ? '<h4 class="timeline-card-title">' + escapeHtml(item.title) + '</h4>'
          : '';
        var actionsHtml = ok
          ? '<div class="timeline-actions"><button class="timeline-delete" data-del="' +
            escapeHtml(item.id) + '">删除</button></div>'
          : '';
        return (
          '<div class="timeline-item" data-id="' + escapeHtml(item.id) + '">' +
            '<div class="timeline-dot"></div>' +
            '<div class="timeline-date">' + formatDate(item.date) + '</div>' +
            '<div class="timeline-card">' +
              titleHtml +
              '<p class="timeline-card-body">' + escapeHtml(item.body).replace(/\n/g, '<br>') + '</p>' +
              actionsHtml +
            '</div>' +
          '</div>'
        );
      })
      .join('');

    // Bind delete buttons (only when unlocked)
    if (ok) {
      timelineEl.querySelectorAll('[data-del]').forEach(function (btn) {
        btn.addEventListener('click', function () {
          var id = this.getAttribute('data-del');
          var cur = currentData().slice();
          cur = cur.filter(function (x) {
            return x.id !== id;
          });
          saveDraft(cur);
          render();
        });
      });
    }
  }

  /* --- Modal controls --- */
  function openModal() {
    if (!isUnlocked()) return;
    var now = new Date();
    var today = now.toISOString().split('T')[0];
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
    if (!isUnlocked()) return;
    var date = dateInput.value || new Date().toISOString().split('T')[0];
    var title = titleInput.value.trim();
    var body = bodyInput.value.trim();
    if (!body) {
      bodyInput.focus();
      bodyInput.style.borderColor = '#EF4444';
      setTimeout(function () {
        bodyInput.style.borderColor = '';
      }, 1500);
      return;
    }
    var data = currentData().slice();
    data.push({
      id: 'r-' + Date.now(),
      date: date,
      title: title,
      body: body
    });
    saveDraft(data);
    render();
    closeModal();
  }

  /* --- Bind events --- */
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

  /* --- Init: fetch shared data, then render (read-only by default) --- */
  fetchSharedData(function () {
    applyLockState();
  });
})();
