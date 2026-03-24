(function () {
  const tg = window.Telegram && window.Telegram.WebApp;
  if (tg) {
    tg.ready();
    tg.expand();
    tg.setHeaderColor("#0a0e0c");
    tg.setBackgroundColor("#0a0e0c");
  }

  const APPLE_SUBS = [
    { family: "iphone", label: "iPhone" },
    { family: "apple_watch", label: "Watch" },
  ];
  const SAMSUNG_SUBS = [
    { family: "samsung_phone", label: "Смартфоны" },
    { family: "samsung_watch", label: "Умные часы" },
  ];

  const state = {
    products: [],
    screen: "home",
    brand: null,
    family: null,
    filterCat: null,
    query: "",
    cart: {},
  };

  function productsJsonUrl() {
    var s = document.querySelector('script[src*="app.js"]');
    if (s && s.src) {
      return new URL("products.json", s.src).href;
    }
    return new URL("products.json", location.href).href;
  }

  const els = {
    backBtn: document.getElementById("backBtn"),
    tagline: document.getElementById("tagline"),
    viewHome: document.getElementById("viewHome"),
    viewSub: document.getElementById("viewSub"),
    viewCatalog: document.getElementById("viewCatalog"),
    subHead: document.getElementById("subHead"),
    subGrid: document.getElementById("subGrid"),
    grid: document.getElementById("grid"),
    chips: document.getElementById("chips"),
    search: document.getElementById("search"),
    count: document.getElementById("count"),
    cartBar: document.getElementById("cartBar"),
    cartTotal: document.getElementById("cartTotal"),
    orderBtn: document.getElementById("orderBtn"),
    homeLoadError: document.getElementById("homeLoadError"),
  };

  function formatPrice(n) {
    return new Intl.NumberFormat("ru-RU").format(n) + " ₽";
  }

  function countInFamily(brand, family) {
    return state.products.filter((p) => p.brand === brand && p.family === family).length;
  }

  function categories(list) {
    const set = new Set();
    list.forEach((p) => set.add(p.category));
    return Array.from(set).sort((a, b) => a.localeCompare(b, "ru"));
  }

  function filtered() {
    const q = state.query.trim().toLowerCase();
    return state.products.filter((p) => {
      if (p.brand !== state.brand || p.family !== state.family) return false;
      if (state.filterCat && p.category !== state.filterCat) return false;
      if (!q) return true;
      const hay = (p.name + " " + p.sku + " " + p.country).toLowerCase();
      return hay.includes(q);
    });
  }

  function cartSum() {
    let s = 0;
    let n = 0;
    Object.entries(state.cart).forEach(([id, qty]) => {
      const p = state.products.find((x) => x.id === id);
      if (p && qty > 0) {
        s += p.price * qty;
        n += qty;
      }
    });
    return { sum: s, count: n };
  }

  function showScreen(name) {
    state.screen = name;
    els.viewHome.hidden = name !== "home";
    els.viewSub.hidden = name !== "sub";
    els.viewCatalog.hidden = name !== "catalog";
    els.backBtn.hidden = name === "home";
  }

  function goHome() {
    state.brand = null;
    state.family = null;
    state.query = "";
    state.filterCat = null;
    els.search.value = "";
    els.tagline.textContent = "Выберите бренд";
    showScreen("home");
  }

  function goSub(brand) {
    state.brand = brand;
    state.family = null;
    const subs = brand === "apple" ? APPLE_SUBS : SAMSUNG_SUBS;
    const title = brand === "apple" ? "Apple" : "Samsung";
    els.subHead.textContent = title;
    els.tagline.textContent = title;
    els.subGrid.innerHTML = "";
    subs.forEach((s) => {
      const n = countInFamily(brand, s.family);
      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = "sub-card";
      btn.innerHTML =
        '<span class="sub-card__title"></span><span class="sub-card__note"></span>';
      btn.querySelector(".sub-card__title").textContent = s.label;
      const noteEl = btn.querySelector(".sub-card__note");
      if (n === 0) {
        noteEl.textContent = "Пока нет позиций в прайсе";
      } else {
        noteEl.textContent = n + " " + plural(n, "позиция", "позиции", "позиций");
      }
      btn.addEventListener("click", () => goCatalog(brand, s.family, s.label));
      els.subGrid.appendChild(btn);
    });
    showScreen("sub");
  }

  function plural(n, a, b, c) {
    const m10 = n % 10;
    const m100 = n % 100;
    if (m100 >= 11 && m100 <= 14) return c;
    if (m10 === 1) return a;
    if (m10 >= 2 && m10 <= 4) return b;
    return c;
  }

  function goCatalog(brand, family, label) {
    state.brand = brand;
    state.family = family;
    state.query = "";
    state.filterCat = null;
    els.search.value = "";
    els.tagline.textContent = label;
    renderChips();
    renderGrid();
    updateCartBar();
    showScreen("catalog");
  }

  function renderChips() {
    const list = state.products.filter(
      (p) => p.brand === state.brand && p.family === state.family
    );
    const cats = categories(list);
    els.chips.innerHTML = "";
    if (cats.length <= 1) {
      els.chips.style.display = "none";
      state.filterCat = null;
      return;
    }
    els.chips.style.display = "";
    const all = document.createElement("button");
    all.type = "button";
    all.className = "chip" + (!state.filterCat ? " active" : "");
    all.textContent = "Все";
    all.addEventListener("click", () => {
      state.filterCat = null;
      renderChips();
      renderGrid();
    });
    els.chips.appendChild(all);
    cats.forEach((c) => {
      const b = document.createElement("button");
      b.type = "button";
      b.className = "chip" + (state.filterCat === c ? " active" : "");
      b.textContent = c;
      b.addEventListener("click", () => {
        state.filterCat = state.filterCat === c ? null : c;
        renderChips();
        renderGrid();
      });
      els.chips.appendChild(b);
    });
  }

  function renderGrid() {
    const list = filtered();
    els.count.textContent =
      list.length +
      " поз." +
      (state.filterCat ? " · " + state.filterCat : "");
    els.grid.innerHTML = "";
    if (!list.length) {
      const li = document.createElement("li");
      li.className = "empty";
      li.textContent =
        "В этой категории пока нет товаров в прайсе — загляните позже или выберите другой раздел.";
      els.grid.appendChild(li);
      return;
    }
    const showCategory = categories(
      state.products.filter(
        (p) => p.brand === state.brand && p.family === state.family
      )
    ).length > 1;
    list.forEach((p) => {
      const qty = state.cart[p.id] || 0;
      const li = document.createElement("li");
      li.className = "card";
      li.innerHTML =
        '<div class="card-top">' +
        "<div><p class=\"card-name\"></p></div>" +
        '<span class="card-price"></span></div>' +
        '<div class="card-meta"></div>' +
        '<div class="card-actions"><button type="button" class="btn-pill add-btn"></button></div>';
      li.querySelector(".card-name").textContent = p.name;
      li.querySelector(".card-price").textContent = formatPrice(p.price);
      const meta = [];
      if (p.sku) meta.push("Арт. " + p.sku);
      if (p.country) meta.push(p.country);
      if (showCategory) meta.push(p.category);
      li.querySelector(".card-meta").textContent = meta.join(" · ");
      const btn = li.querySelector(".add-btn");
      btn.textContent = qty ? "В корзине ×" + qty + " · +1" : "В корзину";
      btn.addEventListener("click", () => {
        state.cart[p.id] = (state.cart[p.id] || 0) + 1;
        saveCart();
        renderGrid();
        updateCartBar();
      });
      els.grid.appendChild(li);
    });
  }

  function updateCartBar() {
    const { sum, count } = cartSum();
    if (count === 0) {
      els.cartBar.hidden = true;
      if (tg) tg.MainButton.hide();
      return;
    }
    els.cartBar.hidden = false;
    els.cartTotal.textContent = formatPrice(sum);
    if (tg) {
      tg.MainButton.setText("Оформить · " + formatPrice(sum));
      tg.MainButton.show();
    }
  }

  function saveCart() {
    try {
      localStorage.setItem("shop62_cart", JSON.stringify(state.cart));
    } catch (_) {}
  }

  function loadCart() {
    try {
      const raw = localStorage.getItem("shop62_cart");
      if (raw) state.cart = JSON.parse(raw) || {};
    } catch (_) {
      state.cart = {};
    }
  }

  function submitOrder() {
    const lines = [];
    Object.entries(state.cart).forEach(([id, qty]) => {
      if (qty < 1) return;
      const p = state.products.find((x) => x.id === id);
      if (!p) return;
      lines.push({
        sku: p.sku,
        name: p.name,
        price: p.price,
        qty,
        sum: p.price * qty,
      });
    });
    const payload = {
      source: "62yabloka_catalog",
      items: lines,
      total: lines.reduce((a, x) => a + x.sum, 0),
    };
    const text =
      "Заказ из мини-приложения 62 ЯБЛОКА:\n" +
      lines
        .map(
          (l) =>
            (l.sku ? l.sku + " — " : "") +
            l.name +
            "\n" +
            l.qty +
            " × " +
            formatPrice(l.price) +
            " = " +
            formatPrice(l.sum)
        )
        .join("\n\n") +
      "\n\nИтого: " +
      formatPrice(payload.total);

    if (tg && tg.sendData) {
      try {
        tg.sendData(JSON.stringify(payload));
        tg.close();
        return;
      } catch (_) {}
    }
    alert(text + "\n\n(Подключите бота: обработка web_app_data или вставьте этот текст менеджеру.)");
  }

  els.backBtn.addEventListener("click", () => {
    if (state.screen === "catalog") goSub(state.brand);
    else goHome();
  });

  var brandGrid = document.querySelector(".brand-grid");
  if (brandGrid) {
    brandGrid.addEventListener("click", function (e) {
      var card = e.target.closest(".brand-card");
      if (!card || !brandGrid.contains(card)) return;
      var brand = card.getAttribute("data-brand");
      if (brand) goSub(brand);
    });
  }

  els.search.addEventListener("input", () => {
    state.query = els.search.value;
    renderGrid();
  });

  els.orderBtn.addEventListener("click", submitOrder);
  if (tg) tg.MainButton.onClick(submitOrder);

  loadCart();
  goHome();
  if (els.homeLoadError) els.homeLoadError.hidden = true;

  fetch(productsJsonUrl())
    .then((r) => {
      if (!r.ok) throw new Error("products.json");
      return r.json();
    })
    .then((data) => {
      state.products = Array.isArray(data) ? data : [];
      goHome();
      if (els.homeLoadError) els.homeLoadError.hidden = true;
    })
    .catch(() => {
      state.products = [];
      goHome();
      if (els.homeLoadError) els.homeLoadError.hidden = false;
    });
})();
