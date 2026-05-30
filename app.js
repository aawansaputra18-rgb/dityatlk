/* ============================================================
   app.js — Portal Curhat Anonim
   Vanilla JS, no dependencies
   ============================================================ */

'use strict';

// ── Config ──────────────────────────────────────────────────
const API = 'api.php';

// ── State ───────────────────────────────────────────────────
let currentPage  = 1;
let isLoading    = false;
let hasMore      = false;
let totalCurhat  = 0;

// ── DOM refs ────────────────────────────────────────────────
const skeletonList   = document.getElementById('skeleton-list');
const cardList       = document.getElementById('card-list');
const emptyState     = document.getElementById('empty-state');
const loadMoreWrap   = document.getElementById('load-more-wrap');
const btnLoadMore    = document.getElementById('btn-load-more');
const statTotal      = document.getElementById('stat-total');

// Form refs
const formCurhat     = document.getElementById('form-curhat');
const inputNama      = document.getElementById('input-nama');
const inputIsi       = document.getElementById('input-isi');
const charCount      = document.getElementById('char-count');
const errorIsi       = document.getElementById('error-isi');
const btnSubmit      = document.getElementById('btn-submit');

// Reply modal
const replyOverlay   = document.getElementById('reply-overlay');
const replyPreview   = document.getElementById('reply-preview');
const repliesLoading = document.getElementById('replies-loading');
const repliesList    = document.getElementById('replies-list');
const noReplies      = document.getElementById('no-replies');
const replyNama      = document.getElementById('reply-nama');
const replyIsi       = document.getElementById('reply-isi');
const errorReply     = document.getElementById('error-reply');
const btnReplySubmit = document.getElementById('btn-reply-submit');
const replyCurhatId  = document.getElementById('reply-curhat-id');
const formReply      = document.getElementById('form-reply');

// ── Utilities ────────────────────────────────────────────────

function showToast(msg, type = '') {
  const toast = document.getElementById('toast');
  toast.textContent = msg;
  toast.className = 'toast show ' + type;
  clearTimeout(toast._tid);
  toast._tid = setTimeout(() => { toast.className = 'toast'; }, 3200);
}

function setLoadingState(btn, loading) {
  const label   = btn.querySelector('.btn-label');
  const spinner = btn.querySelector('.btn-loading');
  if (loading) {
    label.style.display   = 'none';
    spinner.style.display = 'inline-flex';
    btn.disabled          = true;
  } else {
    label.style.display   = '';
    spinner.style.display = 'none';
    btn.disabled          = false;
  }
}

function escapeHtml(str) {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

function getInitials(name) {
  const parts = name.split(/\s+/);
  if (parts.length >= 2) {
    return (parts[0][0] + parts[1][0]).toUpperCase();
  }
  const m = name.match(/#(\d+)$/);
  if (m) return '#' + m[1].slice(-2);
  return name.slice(0, 2).toUpperCase();
}

function animateNumber(el, target, duration = 600) {
  const start = parseInt(el.textContent) || 0;
  const diff  = target - start;
  const startTime = performance.now();
  function update(now) {
    const progress = Math.min((now - startTime) / duration, 1);
    const ease     = 1 - Math.pow(1 - progress, 3);
    el.textContent = Math.round(start + diff * ease);
    if (progress < 1) requestAnimationFrame(update);
  }
  requestAnimationFrame(update);
}

// ── Scroll helper ─────────────────────────────────────────────
function scrollToTop(e) {
  e.preventDefault();
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

// ── Fetch helpers ──────────────────────────────────────────────

async function fetchJSON(url, options = {}) {
  const res  = await fetch(url, options);
  const data = await res.json();
  return data;
}

// ── Load curhat feed ───────────────────────────────────────────

async function loadFeed(page = 1) {
  if (isLoading) return;
  isLoading = true;

  if (page === 1) {
    skeletonList.style.display = 'flex';
    skeletonList.style.flexDirection = 'column';
    cardList.innerHTML = '';
  } else {
    btnLoadMore.textContent = 'Memuat…';
    btnLoadMore.disabled = true;
  }

  try {
    const data = await fetchJSON(`${API}?action=list&page=${page}`);

    if (!data.success) throw new Error(data.message);

    const items = data.data;
    totalCurhat = data.meta.total;
    hasMore     = data.meta.has_more;

    // Update stat
    animateNumber(statTotal, totalCurhat);

    if (page === 1) {
      skeletonList.style.display = 'none';
      if (items.length === 0) {
        emptyState.style.display = 'block';
        return;
      }
    }

    // Render cards
    items.forEach((item, i) => {
      const card = buildCard(item, i * 60);
      cardList.appendChild(card);
    });

    // Load more button
    loadMoreWrap.style.display = hasMore ? 'block' : 'none';
    btnLoadMore.textContent = 'Muat Lebih Banyak';
    btnLoadMore.disabled = false;

  } catch (err) {
    console.error(err);
    skeletonList.style.display = 'none';
    showToast('Gagal memuat curhat. Coba lagi.', 'error');
  } finally {
    isLoading = false;
  }
}

function loadMore() {
  currentPage++;
  loadFeed(currentPage);
}

// ── Build card ─────────────────────────────────────────────────

function buildCard(item, delay = 0) {
  const card = document.createElement('article');
  card.className = 'curhat-card';
  card.style.animationDelay = delay + 'ms';
  card.dataset.id = item.id;

  const initials = getInitials(item.nama);
  const body     = escapeHtml(item.isi);
  const isLong   = item.isi.length > 300;
  const replyLabel = item.jumlah_balasan > 0
    ? `${item.jumlah_balasan} balasan`
    : 'Belum ada balasan';

  card.innerHTML = `
    <div class="card-meta">
      <div class="card-author">
        <div class="author-avatar">${escapeHtml(initials)}</div>
        <div class="author-info">
          <span class="author-name">${escapeHtml(item.nama)}</span>
          <span class="author-time">${escapeHtml(item.time_ago)}</span>
        </div>
      </div>
    </div>

    <div class="card-body${isLong ? ' collapsed' : ''}" id="body-${item.id}">
      ${body.replace(/\n/g, '<br />')}
    </div>
    ${isLong ? `<button class="read-more-btn" id="expand-${item.id}" onclick="toggleExpand(${item.id})">Baca selengkapnya ↓</button>` : ''}

    <div class="card-footer">
      <span class="reply-count">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>
        <span id="reply-count-${item.id}">${replyLabel}</span>
      </span>
      <button class="btn-reply" onclick="openReply(${item.id}, this)">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><polyline points="9 17 4 12 9 7"/><path d="M20 18v-2a4 4 0 0 0-4-4H4"/></svg>
        Balas
      </button>
    </div>
  `;

  return card;
}

function toggleExpand(id) {
  const body = document.getElementById(`body-${id}`);
  const btn  = document.getElementById(`expand-${id}`);
  if (!body || !btn) return;

  if (body.classList.contains('collapsed')) {
    body.classList.remove('collapsed');
    btn.textContent = 'Sembunyikan ↑';
  } else {
    body.classList.add('collapsed');
    btn.textContent = 'Baca selengkapnya ↓';
  }
}

// ── Modal: Tulis Curhat ─────────────────────────────────────────

function openModal() {
  const overlay = document.getElementById('modal-overlay');
  overlay.classList.add('active');
  document.body.style.overflow = 'hidden';
  setTimeout(() => inputIsi.focus(), 150);
}

function closeModal(event) {
  if (event && event.target !== document.getElementById('modal-overlay')) return;
  const overlay = document.getElementById('modal-overlay');
  overlay.classList.remove('active');
  document.body.style.overflow = '';
  resetFormCurhat();
}

function resetFormCurhat() {
  formCurhat.reset();
  charCount.textContent = '0 / 2000';
  charCount.className   = 'char-count';
  errorIsi.textContent  = '';
  inputIsi.classList.remove('error');
}

// Close on Escape
document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape') {
    closeModal();
    closeReply();
  }
});

// Char counter
inputIsi.addEventListener('input', () => {
  const len = inputIsi.value.length;
  charCount.textContent = `${len} / 2000`;
  charCount.className   = 'char-count' + (len > 1800 ? ' danger' : len > 1400 ? ' warn' : '');
  if (len >= 10) {
    errorIsi.textContent = '';
    inputIsi.classList.remove('error');
  }
});

// Submit curhat
formCurhat.addEventListener('submit', async (e) => {
  e.preventDefault();

  const isi  = inputIsi.value.trim();
  const nama = inputNama.value.trim();

  // Client-side validation
  if (isi.length < 10) {
    errorIsi.textContent = 'Curhat terlalu pendek (min. 10 karakter).';
    inputIsi.classList.add('error');
    inputIsi.focus();
    return;
  }

  setLoadingState(btnSubmit, true);

  try {
    const data = await fetchJSON(API, {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify({ action: 'post_curhat', nama, isi }),
    });

    if (!data.success) throw new Error(data.message || 'Gagal mengirim');

    // Prepend to feed
    const card = buildCard(data.data);
    cardList.insertBefore(card, cardList.firstChild);
    totalCurhat++;
    animateNumber(statTotal, totalCurhat);
    emptyState.style.display = 'none';

    // Close & notify
    const overlay = document.getElementById('modal-overlay');
    overlay.classList.remove('active');
    document.body.style.overflow = '';
    resetFormCurhat();
    showToast('✓ Curhatmu berhasil dikirim!', 'success');

  } catch (err) {
    showToast(err.message || 'Terjadi kesalahan. Coba lagi.', 'error');
  } finally {
    setLoadingState(btnSubmit, false);
  }
});

// ── Modal: Balas ────────────────────────────────────────────────

let currentReplyCard = null; // reference to card element for reply count update

async function openReply(id, btn) {
  // Find card data for preview
  const card      = btn.closest('.curhat-card');
  const authorEl  = card.querySelector('.author-name');
  const bodyEl    = card.querySelector('.card-body');

  const authorName = authorEl ? authorEl.textContent : 'Anonim';
  const bodyText   = bodyEl ? bodyEl.innerText : '';

  // Set preview
  replyPreview.innerHTML = `
    <div class="preview-author">${escapeHtml(authorName)}</div>
    <div class="preview-text">${escapeHtml(bodyText)}</div>
  `;

  replyCurhatId.value = id;
  currentReplyCard = card;

  // Clear & show modal
  repliesList.innerHTML = '';
  noReplies.style.display = 'none';
  repliesLoading.style.display = 'block';
  replyNama.value = '';
  replyIsi.value  = '';
  errorReply.textContent = '';

  replyOverlay.classList.add('active');
  document.body.style.overflow = 'hidden';

  // Fetch replies
  try {
    const data = await fetchJSON(`${API}?action=replies&id=${id}`);
    repliesLoading.style.display = 'none';

    if (!data.success) throw new Error(data.message);

    if (data.data.length === 0) {
      noReplies.style.display = 'block';
    } else {
      data.data.forEach(r => repliesList.appendChild(buildReplyItem(r)));
    }
  } catch (err) {
    repliesLoading.style.display = 'none';
    repliesList.innerHTML = `<div class="no-replies" style="color:var(--red)">Gagal memuat balasan.</div>`;
  }

  setTimeout(() => replyIsi.focus(), 200);
}

function closeReply(event) {
  if (event && event.target !== replyOverlay) return;
  replyOverlay.classList.remove('active');
  document.body.style.overflow = '';
  currentReplyCard = null;
}

function buildReplyItem(item) {
  const div = document.createElement('div');
  div.className = 'reply-item';
  div.innerHTML = `
    <div class="reply-item-meta">
      <span class="reply-item-author">${escapeHtml(item.nama)}</span>
      <span class="reply-item-time">${escapeHtml(item.time_ago)}</span>
    </div>
    <div class="reply-item-body">${escapeHtml(item.isi).replace(/\n/g, '<br />')}</div>
  `;
  return div;
}

// Submit reply
formReply.addEventListener('submit', async (e) => {
  e.preventDefault();

  const id   = parseInt(replyCurhatId.value);
  const nama = replyNama.value.trim();
  const isi  = replyIsi.value.trim();

  if (isi.length < 2) {
    errorReply.textContent = 'Balasan tidak boleh kosong.';
    replyIsi.classList.add('error');
    replyIsi.focus();
    return;
  }

  setLoadingState(btnReplySubmit, true);
  errorReply.textContent = '';
  replyIsi.classList.remove('error');

  try {
    const data = await fetchJSON(API, {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify({ action: 'post_reply', curhat_id: id, nama, isi }),
    });

    if (!data.success) throw new Error(data.message || 'Gagal mengirim');

    // Append reply to list
    noReplies.style.display = 'none';
    repliesList.appendChild(buildReplyItem(data.data));

    // Scroll replies to bottom
    const rc = document.getElementById('replies-container');
    rc.scrollTop = rc.scrollHeight;

    // Update reply count on card
    if (currentReplyCard) {
      const countEl = currentReplyCard.querySelector('[id^="reply-count-"]');
      if (countEl) {
        const current = parseInt(countEl.textContent) || 0;
        const next    = current + 1;
        countEl.textContent = `${next} balasan`;
      }
    }

    // Clear textarea
    replyIsi.value  = '';
    replyNama.value = '';
    showToast('✓ Balasan terkirim!', 'success');

  } catch (err) {
    showToast(err.message || 'Gagal mengirim balasan.', 'error');
  } finally {
    setLoadingState(btnReplySubmit, false);
  }
});

// ── Init ────────────────────────────────────────────────────────

document.addEventListener('DOMContentLoaded', () => {
  loadFeed(1);
});
