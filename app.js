/* PULSE: ứng dụng báo điện tử thuần JavaScript, không cần framework. */
"use strict";

// CÁC HÀM TIỆN ÍCH: chọn phần tử, bảo vệ nội dung nhập và lưu dữ liệu.
const $ = (s) => document.querySelector(s);
const escapeHTML = (s) =>
  String(s).replace(
    /[&<>"']/g,
    (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c],
  );
const read = (key, fallback) => {
  try {
    return JSON.parse(localStorage.getItem("pulse-" + key)) ?? fallback;
  } catch {
    return fallback;
  }
};
function write(key, value) {
  try {
    localStorage.setItem("pulse-" + key, JSON.stringify(value));
    return true;
  } catch {
    toast("Trình duyệt không cho phép lưu dữ liệu.");
    return false;
  }
}

// TRẠNG THÁI: các lựa chọn hiện tại của người đọc.
let saved = new Set(read("saved", []).filter(Number.isInteger));
let category = "Tất cả",
  query = "",
  savedOnly = false,
  limit = 9,
  currentArticle = null,
  fontSize = 18;
const categories = [
  "Tất cả",
  "Công nghệ",
  "Kinh doanh",
  "Đời sống",
  "Thể thao",
  "Giải trí",
  "Du lịch",
  "Ô tô",
];
const normalize = (s) =>
  s
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/đ/g, "d")
    .replace(/Đ/g, "D")
    .toLowerCase();
const time = (a) =>
  new Date(a.date).toLocaleDateString("vi-VN", { day: "2-digit", month: "2-digit" });
function toast(message) {
  $("#toast").textContent = message;
  $("#toast").classList.add("show");
  clearTimeout(toast.timer);
  toast.timer = setTimeout(() => $("#toast").classList.remove("show"), 3200);
}
function image(a, extra = "") {
  return `<img src="${a.image}" alt="Ảnh minh họa: ${escapeHTML(a.category)}" ${extra ? 'loading="eager"' : 'loading="lazy"'} ${extra}>`;
}
function bookmark(a) {
  return `<button class="bookmark ${saved.has(a.id) ? "on" : ""}" data-save="${a.id}" aria-label="${saved.has(a.id) ? "Bỏ lưu" : "Lưu"} bài ${escapeHTML(a.title)}" aria-pressed="${saved.has(a.id)}">${saved.has(a.id) ? "◆" : "◇"}</button>`;
}
function card(a) {
  return `<article class="news-card"><a class="photo" href="#article-${a.id}">${image(a)}</a><span class="eyebrow">${a.category.toUpperCase()}</span><h3><a href="#article-${a.id}">${a.title}</a></h3><p>${a.description}</p><div class="meta"><span>${time(a)} · ${a.minutes} phút đọc</span>${bookmark(a)}</div></article>`;
}

// TẠO MENU VÀ DANH SÁCH TIN: lọc dữ liệu rồi đưa HTML vào trang.
function renderNav() {
  $("#nav").innerHTML = categories
    .map(
      (c, i) =>
        `<button data-cat="${c}" class="${category === c && !savedOnly ? "active" : ""}" aria-pressed="${category === c && !savedOnly}">${i === 0 ? "Trang chủ" : c}</button>`,
    )
    .join("");
}
function render() {
  renderNav();
  $("#saveCount").textContent = saved.size;
  $("#saved").setAttribute("aria-pressed", savedOnly);
  const filtered = category !== "Tất cả" || query || savedOnly;
  $("#homeLead").hidden = !!filtered;
  $("#clear").hidden = !filtered;
  $("#listTitle").innerHTML =
    escapeHTML(
      savedOnly
        ? "Tin đã lưu"
        : query
          ? "Kết quả tìm kiếm"
          : category === "Tất cả"
            ? "Tin mới nhất"
            : category,
    ) + "<span>.</span>";
  let list = ARTICLES.filter(
    (a) =>
      (category === "Tất cả" || a.category === category) &&
      (!savedOnly || saved.has(a.id)) &&
      normalize(a.title + " " + a.description + " " + a.category).includes(
        normalize(query),
      ),
  );
  list.sort(
    $("#sort").value === "popular"
      ? (a, b) => b.views - a.views
      : (a, b) => new Date(b.date) - new Date(a.date),
  );
  $("#resultInfo").textContent = filtered
    ? `${list.length} bài viết${query ? " cho “" + query + "”" : ""}`
    : "";
  $("#newsGrid").innerHTML = list.length
    ? list.slice(0, limit).map(card).join("")
    : '<div class="empty">Chưa có bài viết nào ở đây.<br>Thử tìm từ khóa khác hoặc lưu một câu chuyện bạn yêu thích.</div>';
  $("#loadMore").hidden = list.length <= limit;
}
function selectCategory(c) {
  category = c;
  query = "";
  savedOnly = false;
  limit = 9;
  $("#search").value = "";
  render();
  if (c !== "Tất cả")
    $(".news-section").scrollIntoView({ behavior: "smooth", block: "start" });
}

// LƯU / BỎ LƯU BÀI: dùng localStorage của trình duyệt.
function toggleSave(id) {
  saved.has(id) ? saved.delete(id) : saved.add(id);
  const ok = write("saved", [...saved]);
  render();
  if (currentArticle) {
    const btn = $("#readerSave");
    if (btn) {
      btn.textContent = saved.has(id) ? "◆ Đã lưu" : "◇ Lưu bài";
      btn.setAttribute("aria-pressed", saved.has(id));
    }
  }
  if (ok) toast(saved.has(id) ? "Đã thêm vào tin đã lưu" : "Đã bỏ lưu bài viết");
}
function commentsFor(id) {
  const all = read("comments", {});
  return Array.isArray(all[id]) ? all[id] : [];
}
function renderComments(id) {
  $("#commentList").innerHTML =
    commentsFor(id)
      .map(
        (c) =>
          `<div class="comment"><strong>${escapeHTML(c.name)}</strong> <small>${escapeHTML(c.date)}</small><p>${escapeHTML(c.text)}</p></div>`,
      )
      .join("") ||
    '<p class="meta" style="margin-top:20px">Chưa có bình luận. Hãy chia sẻ góc nhìn đầu tiên.</p>';
}

// MỞ BÀI VIẾT: tạo nội dung, công cụ đọc và biểu mẫu bình luận.
function openArticle(id) {
  const a = ARTICLES.find((a) => a.id === id);
  if (!a) {
    toast("Không tìm thấy bài viết");
    return;
  }
  currentArticle = a;
  $("#articleContent").innerHTML =
    `<span class="eyebrow">${a.category.toUpperCase()} / GÓC NHÌN PULSE</span><h1>${a.title}</h1><p style="color:var(--muted)">${a.description}</p><div class="meta" style="margin-top:20px">${a.author} · ${time(a)}/2026 · ${a.minutes} phút đọc</div><div class="article-tools"><button id="readerSave" data-save="${a.id}" aria-pressed="${saved.has(a.id)}">${saved.has(a.id) ? "◆ Đã lưu" : "◇ Lưu bài"}</button><button id="shareArticle">↗ Sao chép liên kết</button><button id="listenArticle">▷ Nghe bài viết</button></div><p class="article-disclaimer">Bài viết mẫu phục vụ trải nghiệm website. Ảnh minh họa từ Unsplash, không mô tả một sự kiện cụ thể.</p><div class="article-cover">${image(a)}</div><div class="body">${a.body.map((p, i) => (i === 1 || i === 3 ? "<h2>" + p + "</h2>" : "<p>" + p + "</p>")).join("")}</div><section class="comments"><h2>Góc nhìn của bạn</h2><p class="meta" style="margin-top:10px">Bình luận chỉ lưu trên trình duyệt của bạn.</p><form id="commentForm"><input name="name" aria-label="Tên hiển thị" placeholder="Tên của bạn" maxlength="50" required><textarea name="comment" aria-label="Nội dung bình luận" placeholder="Chia sẻ suy nghĩ của bạn…" rows="3" maxlength="1000" required></textarea><button>Đăng bình luận</button></form><div id="commentList"></div></section><section class="related"><h2>Tiếp tục khám phá</h2>${ARTICLES.filter(
      (x) => x.category === a.category && x.id !== a.id,
    )
      .slice(0, 3)
      .map((x) => `<button data-open="${x.id}">${x.title} ↗</button>`)
      .join("")}</section>`;
  renderComments(id);
  if (!$("#reader").open) $("#reader").showModal();
  $("#reader").scrollTop = 0;
  document.body.style.overflow = "hidden";
  if ("speechSynthesis" in window) speechSynthesis.cancel();
  $("#shareArticle").onclick = async () => {
    try {
      await navigator.clipboard.writeText(location.href);
      toast("Đã sao chép liên kết bài viết");
    } catch {
      toast("Bạn có thể sao chép đường dẫn trên thanh địa chỉ.");
    }
  };
  $("#listenArticle").onclick = () => {
    if (!("speechSynthesis" in window)) {
      toast("Trình duyệt chưa hỗ trợ đọc văn bản.");
      return;
    }
    if (speechSynthesis.speaking) {
      speechSynthesis.cancel();
      $("#listenArticle").textContent = "▷ Nghe bài viết";
      return;
    }
    const speech = new SpeechSynthesisUtterance(a.title + ". " + a.body.join(". "));
    speech.lang = "vi-VN";
    speech.rate = 0.95;
    speech.onend = speech.onerror = () => {
      if ($("#listenArticle")) $("#listenArticle").textContent = "▷ Nghe bài viết";
    };
    speechSynthesis.speak(speech);
    $("#listenArticle").textContent = "◼ Dừng đọc";
  };
  $("#commentForm").onsubmit = (e) => {
    e.preventDefault();
    const form = new FormData(e.target),
      name = form.get("name").trim(),
      text = form.get("comment").trim();
    if (!name || !text) {
      toast("Vui lòng nhập tên và bình luận.");
      return;
    }
    const comments = read("comments", {});
    comments[id] = [
      ...commentsFor(id),
      { name, text, date: new Date().toLocaleDateString("vi-VN") },
    ];
    if (write("comments", comments)) {
      renderComments(id);
      e.target.reset();
      toast("Đã lưu bình luận trên thiết bị này");
    }
  };
}

// ĐÓNG BÀI VÀ ĐỊNH TUYẾN: phần #article-ID trên đường dẫn xác định bài.
function closeReader() {
  if ($("#reader").open) $("#reader").close();
  currentArticle = null;
  document.body.style.overflow = "";
  if ("speechSynthesis" in window) speechSynthesis.cancel();
}
function route() {
  const match = location.hash.match(/^#article-(\d+)$/);
  if (match) openArticle(Number(match[1]));
  else closeReader();
}

// KHỞI TẠO: ngày tháng, giao diện và các khối tin trên trang chủ.
$("#date").textContent = new Date().toLocaleDateString("vi-VN", {
  weekday: "long",
  day: "numeric",
  month: "long",
  year: "numeric",
});
if (read("news-theme", "light") === "dark") document.body.classList.add("dark");
$("#theme").onclick = () => {
  document.body.classList.toggle("dark");
  write("news-theme", document.body.classList.contains("dark") ? "dark" : "light");
};
const hero = ARTICLES[0];
$("#hero").innerHTML =
  image(hero, 'fetchpriority="high"') +
  `<div class="hero-content"><span class="eyebrow">CÔNG NGHỆ</span><h2><a href="#article-1">${hero.title}</a></h2><p>${hero.description}</p><div class="meta"><span>${hero.author}</span><span>·</span><span>${hero.minutes} phút đọc</span><span style="margin-left:auto;color:var(--accent)">↗</span></div></div>`;
$("#sideStories").innerHTML = ARTICLES.slice(1, 3)
  .map(
    (a) =>
      `<article class="side-card"><a class="photo" href="#article-${a.id}">${image(a)}</a><span class="eyebrow">${a.category.toUpperCase()}</span><h3><a href="#article-${a.id}">${a.title}</a></h3><div class="meta">${time(a)} · ${a.minutes} phút đọc</div></article>`,
  )
  .join("");
$("#briefList").innerHTML = [ARTICLES[8], ARTICLES[4], ARTICLES[5]]
  .map(
    (a, i) =>
      `<div class="brief-item"><span>0${i + 1}</span><button data-open="${a.id}">${a.title}</button></div>`,
  )
  .join("");
$("#popular").innerHTML = [
  ARTICLES[0],
  ARTICLES[8],
  ARTICLES[3],
  ARTICLES[11],
  ARTICLES[2],
]
  .map(
    (a, i) =>
      `<div class="popular-item"><span>0${i + 1}</span><div><h3><a href="#article-${a.id}">${a.title}</a></h3><small>${a.category} · ${a.views.toLocaleString("vi-VN")} lượt đọc mẫu</small></div></div>`,
  )
  .join("");
$("#pollOptions").innerHTML = ["Công nghệ", "Đời sống", "Du lịch"]
  .map((c) => `<button data-poll="${c}">○ ${c}</button>`)
  .join("");
if (read("poll", null))
  $("#pollNote").textContent =
    "Bạn đã chọn: " + read("poll", null) + ". Có thể chọn lại bất cứ lúc nào.";

// XỬ LÝ SỰ KIỆN: kiểm tra nút người đọc vừa bấm.
document.addEventListener("click", (e) => {
  const save = e.target.closest("[data-save]"),
    cat = e.target.closest("[data-cat]"),
    open = e.target.closest("[data-open]"),
    tag = e.target.closest("[data-query]"),
    poll = e.target.closest("[data-poll]");
  if (save) toggleSave(Number(save.dataset.save));
  if (cat) selectCategory(cat.dataset.cat);
  if (open) {
    const hash = "#article-" + open.dataset.open;
    if (location.hash === hash) route();
    else location.hash = hash;
  }
  if (tag) {
    $("#search").value = tag.dataset.query;
    query = tag.dataset.query;
    category = "Tất cả";
    savedOnly = false;
    limit = 9;
    render();
  }
  if (poll) {
    if (write("poll", poll.dataset.poll)) {
      $("#pollNote").textContent = "Bạn đã chọn: " + poll.dataset.poll;
      toast("Đã lưu chủ đề yêu thích");
      selectCategory(poll.dataset.poll);
    }
  }
});

// CÁC THAO TÁC: tìm kiếm, sắp xếp, lưu tin, đổi cỡ chữ và bàn phím.
$("#searchForm").onsubmit = (e) => {
  e.preventDefault();
  query = $("#search").value.trim();
  category = "Tất cả";
  savedOnly = false;
  limit = 9;
  render();
};
$("#search").addEventListener("input", () => {
  query = $("#search").value.trim();
  savedOnly = false;
  category = "Tất cả";
  limit = 9;
  render();
});
$("#saved").onclick = () => {
  savedOnly = !savedOnly;
  category = "Tất cả";
  query = "";
  $("#search").value = "";
  limit = 9;
  render();
};
$("#clear").onclick = () => selectCategory("Tất cả");
$("#sort").onchange = render;
$("#loadMore").onclick = () => {
  limit += 9;
  render();
};
$("#latestBtn").onclick = () => $(".news-section").scrollIntoView({ behavior: "smooth" });
$("#backTop").onclick = () => window.scrollTo({ top: 0, behavior: "smooth" });
$("#newsletter").onsubmit = (e) => {
  e.preventDefault();
  if (
    write("newsletter", { email: $("#email").value, topic: read("poll", "Công nghệ") })
  ) {
    toast("Đã lưu lựa chọn. Bản demo không gửi email.");
    e.target.reset();
  }
};
$("#closeReader").onclick = () => {
  history.replaceState(null, "", location.pathname + location.search);
  closeReader();
};
$("#reader").addEventListener("cancel", (e) => {
  e.preventDefault();
  $("#closeReader").click();
});
$("#reader").addEventListener("click", (e) => {
  if (e.target === $("#reader")) {
    const r = $("#reader").getBoundingClientRect();
    if (
      e.clientX < r.left ||
      e.clientX > r.right ||
      e.clientY < r.top ||
      e.clientY > r.bottom
    )
      $("#closeReader").click();
  }
});
$("#fontUp").onclick = () => {
  fontSize = Math.min(26, fontSize + 2);
  document.documentElement.style.setProperty("--reading", fontSize + "px");
};
$("#fontDown").onclick = () => {
  fontSize = Math.max(14, fontSize - 2);
  document.documentElement.style.setProperty("--reading", fontSize + "px");
};
$("#about").onclick = (e) => {
  e.preventDefault();
  toast("PULSE · Dự án báo điện tử mẫu với 24 bài viết, 7 chuyên mục.");
};
document.addEventListener("keydown", (e) => {
  if (
    e.key === "/" &&
    !["INPUT", "TEXTAREA", "SELECT"].includes(document.activeElement.tagName) &&
    !$("#reader").open
  ) {
    e.preventDefault();
    $("#search").focus();
  }
});
window.addEventListener("hashchange", route);
render();
route();

// Logo luôn đưa người đọc trở lại trang chủ.
document
  .querySelectorAll("a.logo")
  .forEach((link) => link.addEventListener("click", () => selectCategory("Tất cả")));
