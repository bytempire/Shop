(function () {
  var ADMIN_TELEGRAM_IDS = [];

  var tg = window.Telegram && window.Telegram.WebApp;
  if (tg) {
    tg.ready();
    tg.expand();
    tg.setHeaderColor("#0a0e0c");
    tg.setBackgroundColor("#0a0e0c");
  }

  var denyEl = document.getElementById("denyPanel");
  var adminEl = document.getElementById("adminPanel");
  var listEl = document.getElementById("adminList");
  var searchEl = document.getElementById("adminSearch");
  var metaEl = document.getElementById("adminMeta");
  var toastEl = document.getElementById("adminToast");

  function showDeny(html) {
    denyEl.innerHTML = html;
    denyEl.hidden = false;
    adminEl.hidden = true;
  }

  function toast(msg) {
    toastEl.textContent = msg;
    toastEl.hidden = false;
    clearTimeout(toast._t);
    toast._t = setTimeout(function () {
      toastEl.hidden = true;
    }, 2200);
  }

  var uid =
    tg && tg.initDataUnsafe && tg.initDataUnsafe.user && tg.initDataUnsafe.user.id;
  var adminIds = ADMIN_TELEGRAM_IDS.map(Number).filter(function (x) {
    return !isNaN(x) && x > 0;
  });

  if (!uid) {
    showDeny(
      "<p><strong>Нет данных Telegram.</strong></p><p>Откройте страницу из мини-приложения бота.</p>"
    );
    return;
  }
  if (!adminIds.length) {
    showDeny(
      "<p><strong>Админы не настроены.</strong></p><p>В <code>web/admin.js</code> заполните <code>ADMIN_TELEGRAM_IDS</code>.</p><p>Ваш id: <code>" +
        uid +
        "</code></p>"
    );
    return;
  }
  if (adminIds.indexOf(Number(uid)) === -1) {
    showDeny(
      "<p><strong>Нет доступа.</strong></p><p>Ваш id: <code>" + uid + "</code></p>"
    );
    return;
  }

  denyEl.hidden = true;
  adminEl.hidden = false;

  function bootAdmin(products) {
    if (!products.length) {
      metaEl.textContent = "Нет данных в products.json";
      return;
    }
    metaEl.textContent = products.length + " поз. · id: " + uid;
    initAdmin(products);
  }

  function initAdmin(products) {
  var rows = [];

  function makeEmptyThumb() {
    var d = document.createElement("div");
    d.className = "admin-row__thumb admin-row__thumb--empty";
    d.textContent = "нет фото";
    return d;
  }

  function refreshThumb(li, url) {
    var old = li.querySelector(".admin-row__thumb, .admin-row__thumb--empty");
    if (!old) return;
    var parent = old.parentNode;
    old.remove();
    var t;
    if (url) {
      t = document.createElement("img");
      t.className = "admin-row__thumb";
      t.src = url;
      t.alt = "";
      t.referrerPolicy = "no-referrer";
      t.onerror = function () {
        t.replaceWith(makeEmptyThumb());
      };
    } else {
      t = makeEmptyThumb();
    }
    parent.insertBefore(t, parent.firstChild);
  }

  products.forEach(function (p) {
    var id = String(p.id);
    var li = document.createElement("li");
    li.className = "admin-row";
    li.dataset.hay = ((p.name || "") + " " + (p.sku || "") + " " + id).toLowerCase();
    var map = window.shop62Images.getMap();
    var url = map[id] || (p.image ? String(p.image) : "");
    var thumb;
    if (url) {
      thumb = document.createElement("img");
      thumb.className = "admin-row__thumb";
      thumb.src = url;
      thumb.alt = "";
      thumb.referrerPolicy = "no-referrer";
      thumb.onerror = function () {
        thumb.replaceWith(makeEmptyThumb());
      };
    } else {
      thumb = makeEmptyThumb();
    }
    var body = document.createElement("div");
    body.className = "admin-row__body";
    body.innerHTML =
      '<p class="admin-row__name"></p><p class="admin-row__id"></p>' +
      '<input type="url" class="admin-row__input" placeholder="https://…" />' +
      '<div class="admin-row__actions">' +
      '<button type="button" class="admin-row__btn save-btn">Сохранить</button>' +
      '<button type="button" class="admin-row__btn secondary clear-btn">Убрать</button></div>';
    body.querySelector(".admin-row__name").textContent = p.name || "—";
    body.querySelector(".admin-row__id").textContent =
      "id: " + id + (p.sku ? " · арт. " + p.sku : "");
    var input = body.querySelector(".admin-row__input");
    input.value = url;
    body.querySelector(".save-btn").addEventListener("click", function () {
      var v = input.value.trim();
      var ok = window.shop62Images.setUrlForProduct(id, v);
      toast(v ? (ok ? "Сохранено" : "Ошибка") : "Снято");
      refreshThumb(li, v);
    });
    body.querySelector(".clear-btn").addEventListener("click", function () {
      input.value = "";
      window.shop62Images.setUrlForProduct(id, "");
      toast("Убрано");
      refreshThumb(li, "");
    });
    li.appendChild(thumb);
    li.appendChild(body);
    listEl.appendChild(li);
    rows.push(li);
  });

  function applyFilter() {
    var q = (searchEl.value || "").toLowerCase().trim();
    var n = 0;
    rows.forEach(function (li) {
      var show = !q || li.dataset.hay.indexOf(q) !== -1;
      li.style.display = show ? "" : "none";
      if (show) n++;
    });
    metaEl.textContent = products.length + " поз. · показано: " + n + " · id: " + uid;
  }
  searchEl.addEventListener("input", applyFilter);

  var exportBtn = document.getElementById("exportBtn");
  if (exportBtn) {
    exportBtn.addEventListener("click", function () {
      var map = window.shop62Images.getMap();
      var blob = new Blob([JSON.stringify(map, null, 2)], {
        type: "application/json;charset=utf-8",
      });
      var a = document.createElement("a");
      a.href = URL.createObjectURL(blob);
      a.download = "shop62_product_images.json";
      a.click();
      URL.revokeObjectURL(a.href);
      toast("Скачано");
    });
  }
  }

  var embedded =
    typeof window.__SHOP_CATALOG__ !== "undefined" &&
    Array.isArray(window.__SHOP_CATALOG__) &&
    window.__SHOP_CATALOG__.length > 0;

  if (embedded) {
    bootAdmin(window.__SHOP_CATALOG__);
  } else {
    fetch("products.json", { cache: "no-store" })
      .then(function (r) { return r.json(); })
      .then(function (d) { bootAdmin(Array.isArray(d) ? d : []); })
      .catch(function () { metaEl.textContent = "Ошибка загрузки products.json"; });
  }
})();
