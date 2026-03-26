(function () {
  var tg = window.Telegram && window.Telegram.WebApp;

  function hideTgActionButtons() {
    if (!tg) return;
    try {
      if (tg.MainButton) {
        tg.MainButton.hide();
        if (typeof tg.MainButton.setParams === "function") {
          tg.MainButton.setParams({ is_visible: false });
        }
      }
      if (tg.SecondaryButton) {
        tg.SecondaryButton.hide();
        if (typeof tg.SecondaryButton.setParams === "function") {
          tg.SecondaryButton.setParams({ is_visible: false });
        }
      }
    } catch (e) {}
  }

  if (tg) {
    tg.ready();
    tg.expand();
    tg.setHeaderColor("#0a0e0c");
    tg.setBackgroundColor("#0a0e0c");
    hideTgActionButtons();
    [0, 50, 200, 500].forEach(function (ms) {
      setTimeout(hideTgActionButtons, ms);
    });
    if (typeof tg.onEvent === "function") {
      ["viewportChanged", "themeChanged", "safeAreaChanged"].forEach(function (ev) {
        try {
          tg.onEvent(ev, hideTgActionButtons);
        } catch (e) {}
      });
    }
  }

  var APPLE_SUBS = [
    { family: "iphone", label: "iPhone" },
    { family: "ipad", label: "iPad" },
    { family: "apple_watch", label: "Watch" },
    { family: "airpods", label: "AirPods" },
    { family: "macbook", label: "MacBook" },
    { family: "imac", label: "iMac" },
  ];
  var SAMSUNG_SUBS = [
    { family: "samsung_phone", label: "Смартфоны" },
    { family: "samsung_watch", label: "Умные часы" },
  ];
  var XIAOMI_SUBS = [
    { family: "xm_redmi", label: "Redmi" },
    { family: "xm_mi", label: "Mi" },
    { family: "xm_poco", label: "POCO" },
    { family: "xm_realme", label: "Realme" },
    { family: "xm_honor", label: "Honor" },
  ];
  var HUAWEI_SUBS = [
    { family: "huawei_phone", label: "Смартфоны" },
    { family: "huawei_tablet", label: "Планшеты" },
  ];
  var GOOGLE_SUBS = [{ family: "pixel_phone", label: "Pixel" }];
  var GARMIN_SUBS = [{ family: "garmin_watch", label: "Часы" }];
  var GAMING_SUBS = [{ family: "gaming_item", label: "Приставки" }];
  var AUDIO_SUBS = [
    { family: "marshall_speakers", label: "Marshall" },
    { family: "audio_jbl", label: "JBL" },
    { family: "audio_sony", label: "Sony" },
    { family: "audio_yandex", label: "Яндекс" },
    { family: "audio_headphones", label: "Наушники / TWS" },
    { family: "audio_harman", label: "Harman/Kardon" },
    { family: "audio_soundbars", label: "Саундбары" },
    { family: "audio_logitech", label: "Logitech" },
    { family: "audio_beyerdynamic", label: "Beyerdynamic" },
  ];

  var state = {
    products: [],
    screen: "home",
    brand: null,
    family: null,
    filterCat: null,
    query: "",
    cart: {},
    prevScreen: null,
    prevTagline: "",
  };

  function productsJsonUrl() {
    var s = document.querySelector('script[src*="app.js"]');
    if (s && s.src) {
      return new URL("products.json", s.src).href;
    }
    return new URL("products.json", location.href).href;
  }

  function normalizeProducts(raw) {
    if (!Array.isArray(raw)) return [];
    return raw
      .map(function (p, idx) {
        var name = p.name != null ? String(p.name) : "";
        var b = (p.brand || "").toString().trim().toLowerCase();
        var f = (p.family || "").toString().trim().toLowerCase();
        var n = name.toLowerCase();
        if (!b || !f) {
          if (n.indexOf("iphone") !== -1) {
            b = "apple";
            f = "iphone";
          } else if (n.indexOf("ipad") !== -1) {
            b = "apple";
            f = "ipad";
          } else if (n.indexOf("airpods") !== -1) {
            b = "apple";
            f = "airpods";
          } else if (
            n.indexOf("macbook") !== -1 ||
            n.indexOf("mb ") !== -1 ||
            n.indexOf("neo ") !== -1
          ) {
            b = "apple";
            f = "macbook";
          } else if (n.indexOf("imac") !== -1) {
            b = "apple";
            f = "imac";
          } else if (n.indexOf("watch") !== -1) {
            b = "apple";
            f = "apple_watch";
          } else if (n.indexOf("samsung") !== -1 || n.indexOf("galaxy") !== -1) {
            b = "samsung";
            f = n.indexOf("watch") !== -1 ? "samsung_watch" : "samsung_phone";
          } else if (n.indexOf("pixel") !== -1) {
            b = "google";
            f = "pixel_phone";
          } else if (n.indexOf("garmin") !== -1) {
            b = "garmin";
            f = "garmin_watch";
          } else if (
            n.indexOf("dualsense") !== -1 ||
            n.indexOf("ps5") !== -1 ||
            n.indexOf("playstation") !== -1
          ) {
            b = "gaming";
            f = "gaming_item";
          } else if (n.indexOf("realme") !== -1) {
            b = "xiaomi";
            f = "xm_realme";
          } else if (n.indexOf("honor") !== -1) {
            b = "xiaomi";
            f = "xm_honor";
          } else if (n.indexOf("huawei") !== -1) {
            b = "huawei";
            f = n.indexOf("matepad") !== -1 ? "huawei_tablet" : "huawei_phone";
          } else if (n.indexOf("poco") !== -1) {
            b = "xiaomi";
            f = "xm_poco";
          } else if (/\bredmi\b/.test(n)) {
            b = "xiaomi";
            f = "xm_redmi";
          } else if (/\bmi\s+\d/.test(n) || n.indexOf("xiaomi mi") !== -1) {
            b = "xiaomi";
            f = "xm_mi";
          }
        }
        var price = Number(p.price);
        if (Number.isNaN(price)) price = 0;
        var img = p.image != null ? String(p.image).trim() : "";
        return {
          id: p.id != null ? String(p.id) : "p-" + idx,
          brand: b,
          family: f,
          category: p.category != null ? String(p.category) : "",
          sku: p.sku != null ? String(p.sku) : "",
          name: name,
          country: p.country != null ? String(p.country) : "",
          price: price,
          currency: p.currency != null ? String(p.currency) : "RUB",
          image: img,
        };
      })
      .filter(function (p) {
        return p.name && p.brand && p.family;
      });
  }

  var els = {
    siteHeader: document.getElementById("siteHeader"),
    headerBanner: document.getElementById("headerBanner"),
    headerLogo: document.getElementById("headerLogo"),
    headerRow: document.getElementById("headerRow"),
    backBtn: document.getElementById("backBtn"),
    tagline: document.getElementById("tagline"),
    viewHome: document.getElementById("viewHome"),
    viewSub: document.getElementById("viewSub"),
    viewCatalog: document.getElementById("viewCatalog"),
    viewCart: document.getElementById("viewCart"),
    subHead: document.getElementById("subHead"),
    subGrid: document.getElementById("subGrid"),
    grid: document.getElementById("grid"),
    chips: document.getElementById("chips"),
    search: document.getElementById("search"),
    count: document.getElementById("count"),
    cartBar: document.getElementById("cartBar"),
    cartTotal: document.getElementById("cartTotal"),
    cartViewBtn: document.getElementById("cartViewBtn"),
    cartList: document.getElementById("cartList"),
    cartViewTotal: document.getElementById("cartViewTotal"),
    orderBtn: document.getElementById("orderBtn"),
    cartOrderBtn: document.getElementById("cartOrderBtn"),
    homeLoadError: document.getElementById("homeLoadError"),
  };

  function formatPrice(n, currency) {
    var cur = (currency || "RUB").toString().toUpperCase();
    var sym = cur === "USD" ? " $" : " ₽";
    return new Intl.NumberFormat("ru-RU").format(n) + sym;
  }

  function countInFamily(brand, family) {
    return state.products.filter(function (p) {
      return p.brand === brand && p.family === family;
    }).length;
  }

  function categories(list) {
    var set = {};
    list.forEach(function (p) {
      set[p.category] = true;
    });
    return Object.keys(set).sort(function (a, b) {
      return a.localeCompare(b, "ru");
    });
  }

  function filtered() {
    var q = state.query.trim().toLowerCase();
    return state.products.filter(function (p) {
      if (p.brand !== state.brand || p.family !== state.family) return false;
      if (state.filterCat && p.category !== state.filterCat) return false;
      if (!q) return true;
      var hay = (p.name + " " + p.sku + " " + p.country).toLowerCase();
      return hay.indexOf(q) !== -1;
    });
  }

  function cartSum() {
    var s = 0;
    var n = 0;
    var cur = null;
    Object.keys(state.cart).forEach(function (id) {
      var qty = state.cart[id];
      var p = state.products.find(function (x) {
        return x.id === id;
      });
      if (p && qty > 0) {
        s += p.price * qty;
        n += qty;
        if (cur == null) cur = p.currency || "RUB";
      }
    });
    return { sum: s, count: n, currency: cur || "RUB" };
  }

  function bumpCartById(id, delta) {
    var q = (state.cart[id] || 0) + delta;
    if (q <= 0) delete state.cart[id];
    else state.cart[id] = q;
    saveCart();

    if (state.screen === "cart") renderCartView();
    else if (state.screen === "catalog") renderGrid();

    updateCartBar();
  }

  function getCartRows() {
    var rows = [];
    Object.keys(state.cart || {}).forEach(function (id) {
      var qty = state.cart[id];
      if (qty < 1) return;
      var p = state.products.find(function (x) {
        return x.id === id;
      });
      if (!p) return;
      rows.push({ p: p, qty: qty });
    });
    rows.sort(function (a, b) {
      return String(a.p.name || "").localeCompare(String(b.p.name || ""), "ru");
    });
    return rows;
  }

  function renderCartView() {
    if (!els.cartList) return;

    var rows = getCartRows();
    els.cartList.innerHTML = "";

    var t = cartSum();
    if (els.cartViewTotal) els.cartViewTotal.textContent = formatPrice(t.sum, t.currency);

    if (!rows.length) {
      var li0 = document.createElement("li");
      li0.className = "empty";
      li0.textContent = "В этой корзине пока нет товаров.";
      els.cartList.appendChild(li0);
      return;
    }

    rows.forEach(function (r) {
      var p = r.p;
      var qty = r.qty;
      var lineSum = p.price * qty;
      var meta = [];
      if (p.sku) meta.push("Арт. " + p.sku);
      if (p.country) meta.push(p.country);
      if (p.category) meta.push(p.category);

      var li = document.createElement("li");
      li.className = "cart-item";
      li.dataset.id = p.id;
      li.innerHTML =
        '<div class="cart-item__top">' +
        '<div>' +
        '<p class="cart-item__name"></p>' +
        '<div class="cart-item__meta"></div>' +
        "</div>" +
        '<div class="cart-item__sum"></div>' +
        "</div>" +
        '<div class="cart-item__qty-row">' +
        '<button type="button" class="btn-qty btn-qty--minus" aria-label="Убрать одну">−</button>' +
        '<span class="cart-item__qty-n"></span>' +
        '<button type="button" class="btn-qty btn-qty--plus" aria-label="Добавить ещё">+</button>' +
        "</div>";

      li.querySelector(".cart-item__name").textContent = p.name;
      li.querySelector(".cart-item__meta").textContent = meta.join(" · ");
      li.querySelector(".cart-item__sum").textContent = formatPrice(lineSum, p.currency);
      li.querySelector(".cart-item__qty-n").textContent = qty + " шт.";

      li.querySelector(".btn-qty--minus").addEventListener("click", function () {
        bumpCartById(p.id, -1);
      });
      li.querySelector(".btn-qty--plus").addEventListener("click", function () {
        bumpCartById(p.id, 1);
      });

      els.cartList.appendChild(li);
    });
  }

  function showCart() {
    state.prevScreen = state.screen;
    state.prevTagline = els.tagline ? els.tagline.textContent : "";
    if (els.tagline) els.tagline.textContent = "В корзине";
    showScreen("cart");
    renderCartView();
    if (els.cartBar) els.cartBar.hidden = true;
    hideTgActionButtons();
    updateCartBar();
  }

  function restoreFromCart() {
    var prev = state.prevScreen || "home";
    if (els.tagline && state.prevTagline) els.tagline.textContent = state.prevTagline;

    if (prev === "catalog") {
      showScreen("catalog");
      renderChips();
      renderGrid();
      updateCartBar();
      return;
    }
    if (prev === "sub") {
      if (state.brand) goSub(state.brand);
      else goHome();
      return;
    }
    goHome();
  }

  function showScreen(name) {
    state.screen = name;
    els.viewHome.hidden = name !== "home";
    els.viewSub.hidden = name !== "sub";
    els.viewCatalog.hidden = name !== "catalog";
    if (els.viewCart) els.viewCart.hidden = name !== "cart";
    var onHome = name === "home";
    if (els.backBtn) {
      els.backBtn.hidden = onHome;
      els.backBtn.setAttribute("aria-hidden", onHome ? "true" : "false");
    }
    if (els.headerRow) els.headerRow.classList.toggle("header-row--home", onHome);
    if (els.headerBanner) els.headerBanner.hidden = !onHome;
    if (els.siteHeader) els.siteHeader.classList.toggle("site-header--inner", !onHome);
    if (els.headerLogo) els.headerLogo.hidden = onHome;
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

  function plural(n, a, b, c) {
    var m10 = n % 10;
    var m100 = n % 100;
    if (m100 >= 11 && m100 <= 14) return c;
    if (m10 === 1) return a;
    if (m10 >= 2 && m10 <= 4) return b;
    return c;
  }

  function goSub(brand) {
    state.brand = brand;
    state.family = null;
    var subs;
    var title;
    if (brand === "apple") {
      subs = APPLE_SUBS;
      title = "Apple";
    } else if (brand === "samsung") {
      subs = SAMSUNG_SUBS;
      title = "Samsung";
    } else if (brand === "huawei") {
      subs = HUAWEI_SUBS;
      title = "Huawei";
    } else if (brand === "google") {
      subs = GOOGLE_SUBS;
      title = "Google";
    } else if (brand === "garmin") {
      subs = GARMIN_SUBS;
      title = "Garmin";
    } else if (brand === "gaming") {
      subs = GAMING_SUBS;
      title = "Gaming";
    } else if (brand === "audio") {
      subs = AUDIO_SUBS;
      title = "Аудио";
    } else {
      subs = XIAOMI_SUBS;
      title = "Xiaomi";
    }
    els.subHead.textContent = title;
    els.tagline.textContent = title;
    els.subGrid.innerHTML = "";
    subs.forEach(function (s) {
      var cnt = countInFamily(brand, s.family);
      var btn = document.createElement("button");
      btn.type = "button";
      btn.className = "sub-card";
      btn.innerHTML =
        '<span class="sub-card__title"></span><span class="sub-card__note"></span>';
      btn.querySelector(".sub-card__title").textContent = s.label;
      var noteEl = btn.querySelector(".sub-card__note");
      if (cnt === 0) noteEl.textContent = "Пока нет позиций в прайсе";
      else noteEl.textContent = cnt + " " + plural(cnt, "позиция", "позиции", "позиций");
      btn.addEventListener("click", function () {
        goCatalog(brand, s.family, s.label);
      });
      els.subGrid.appendChild(btn);
    });
    showScreen("sub");
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
    var list = state.products.filter(function (p) {
      return p.brand === state.brand && p.family === state.family;
    });
    var cats = categories(list);
    els.chips.innerHTML = "";
    if (cats.length <= 1) {
      els.chips.style.display = "none";
      state.filterCat = null;
      return;
    }
    els.chips.style.display = "";
    var all = document.createElement("button");
    all.type = "button";
    all.className = "chip" + (!state.filterCat ? " active" : "");
    all.textContent = "Все";
    all.addEventListener("click", function () {
      state.filterCat = null;
      renderChips();
      renderGrid();
    });
    els.chips.appendChild(all);
    cats.forEach(function (c) {
      var b = document.createElement("button");
      b.type = "button";
      b.className = "chip" + (state.filterCat === c ? " active" : "");
      b.textContent = c;
      b.addEventListener("click", function () {
        state.filterCat = state.filterCat === c ? null : c;
        renderChips();
        renderGrid();
      });
      els.chips.appendChild(b);
    });
  }

  function renderGrid() {
    var list = filtered();
    els.count.textContent =
      list.length + " поз." + (state.filterCat ? " · " + state.filterCat : "");
    els.grid.innerHTML = "";
    if (!list.length) {
      var li0 = document.createElement("li");
      li0.className = "empty";
      li0.textContent =
        "В этой категории пока нет товаров в прайсе — загляните позже или выберите другой раздел.";
      els.grid.appendChild(li0);
      return;
    }
    var showCategory =
      categories(
        state.products.filter(function (p) {
          return p.brand === state.brand && p.family === state.family;
        })
      ).length > 1;
    list.forEach(function (p) {
      var qty = state.cart[p.id] || 0;
      var li = document.createElement("li");
      li.className = "card";
      var imgUrl =
        typeof window.shop62Images !== "undefined"
          ? window.shop62Images.getUrlForProduct(p)
          : p.image || null;
      li.innerHTML =
        (imgUrl
          ? '<div class="card-img-wrap"><img class="card-img" alt="" loading="lazy" referrerpolicy="no-referrer" decoding="async" /></div>'
          : "") +
        '<div class="card-top">' +
        '<div><p class="card-name"></p></div>' +
        '<span class="card-price"></span></div>' +
        '<div class="card-meta"></div>' +
        '<div class="card-actions"></div>';
      if (imgUrl) {
        var imgEl = li.querySelector(".card-img");
        imgEl.src = imgUrl;
        imgEl.onerror = function () {
          var w = li.querySelector(".card-img-wrap");
          if (w) w.remove();
        };
      }
      li.querySelector(".card-name").textContent = p.name;
      li.querySelector(".card-price").textContent = formatPrice(p.price, p.currency);
      var meta = [];
      if (p.sku) meta.push("Арт. " + p.sku);
      if (p.country) meta.push(p.country);
      if (showCategory) meta.push(p.category);
      li.querySelector(".card-meta").textContent = meta.join(" · ");
      var actions = li.querySelector(".card-actions");
      function bumpCart(delta) {
        bumpCartById(p.id, delta);
      }
      if (qty > 0) {
        actions.className = "card-actions card-actions--qty";
        actions.innerHTML =
          '<button type="button" class="btn-qty btn-qty--minus" aria-label="Убрать одну">−</button>' +
          '<span class="card-qty-n"></span>' +
          '<button type="button" class="btn-qty btn-qty--plus" aria-label="Добавить ещё">+</button>';
        actions.querySelector(".card-qty-n").textContent = qty + " шт.";
        actions.querySelector(".btn-qty--minus").addEventListener("click", function () {
          bumpCart(-1);
        });
        actions.querySelector(".btn-qty--plus").addEventListener("click", function () {
          bumpCart(1);
        });
      } else {
        actions.className = "card-actions";
        var btn = document.createElement("button");
        btn.type = "button";
        btn.className = "btn-pill add-btn";
        btn.textContent = "В корзину";
        btn.addEventListener("click", function () {
          bumpCart(1);
        });
        actions.appendChild(btn);
      }
      els.grid.appendChild(li);
    });
  }

  function updateCartBar() {
    var t = cartSum();
    if (state.screen === "cart") {
      if (els.cartViewTotal) els.cartViewTotal.textContent = formatPrice(t.sum, t.currency);
      if (els.cartBar) els.cartBar.hidden = true;
      hideTgActionButtons();
      return;
    }
    if (t.count === 0) {
      els.cartBar.hidden = true;
      hideTgActionButtons();
      return;
    }
    els.cartBar.hidden = false;
    els.cartTotal.textContent = formatPrice(t.sum, t.currency);
    hideTgActionButtons();
  }

  function saveCart() {
    try {
      localStorage.setItem("shop62_cart", JSON.stringify(state.cart));
    } catch (e) {}
  }

  function loadCart() {
    try {
      var raw = localStorage.getItem("shop62_cart");
      if (raw) state.cart = JSON.parse(raw) || {};
    } catch (e) {
      state.cart = {};
    }
  }

  function submitOrder() {
    var lines = [];
    Object.keys(state.cart).forEach(function (id) {
      var qty = state.cart[id];
      if (qty < 1) return;
      var p = state.products.find(function (x) {
        return x.id === id;
      });
      if (!p) return;
      lines.push({
        sku: p.sku,
        name: p.name,
        price: p.price,
        qty: qty,
        sum: p.price * qty,
      });
    });
    if (!lines.length) {
      alert("Корзина пуста.");
      return;
    }
    var payload = {
      source: "62yabloka_catalog",
      items: lines,
      total: lines.reduce(function (a, x) {
        return a + x.sum;
      }, 0),
    };
    var text =
      "Заказ из мини-приложения 62 ЯБЛОКА:\n" +
      lines
        .map(function (l) {
          return (
            (l.sku ? l.sku + " — " : "") +
            l.name +
            "\n" +
            l.qty +
            " × " +
            formatPrice(l.price) +
            " = " +
            formatPrice(l.sum)
          );
        })
        .join("\n\n") +
      "\n\nИтого: " +
      formatPrice(payload.total);
    if (tg && tg.sendData) {
      try {
        tg.sendData(JSON.stringify(payload));
        tg.close();
        return;
      } catch (e) {}
    }
    alert(text + "\n\n(Подключите бота: web_app_data или отправьте текст менеджеру.)");
  }

  els.backBtn.addEventListener("click", function () {
    if (state.screen === "cart") restoreFromCart();
    else if (state.screen === "catalog") goSub(state.brand);
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

  var phoneBtn = document.querySelector(".header-banner__phone");
  if (phoneBtn) {
    var triggerPhoneCall = function (e) {
      var href = phoneBtn.getAttribute("href");
      if (!href) return;
      e.preventDefault();
      try {
        if (tg && typeof tg.openLink === "function") {
          tg.openLink(href);
          return;
        }
      } catch (e1) {}
      try {
        window.open(href, "_blank");
        return;
      } catch (e2) {}
      try {
        window.location.assign(href);
      } catch (err) {
        try {
          window.open(href, "_self");
        } catch (e3) {}
      }
    };
    phoneBtn.addEventListener("click", triggerPhoneCall);
    phoneBtn.addEventListener("pointerup", triggerPhoneCall);
    phoneBtn.addEventListener("touchend", triggerPhoneCall, { passive: false });
  }

  els.search.addEventListener("input", function () {
    state.query = els.search.value;
    renderGrid();
  });

  els.orderBtn.addEventListener("click", submitOrder);
  if (els.cartViewBtn) {
    els.cartViewBtn.addEventListener("click", function () {
      if (state.screen === "cart") return;
      showCart();
    });
  }
  if (els.cartOrderBtn) els.cartOrderBtn.addEventListener("click", submitOrder);

  loadCart();
  goHome();
  updateCartBar();
  if (els.homeLoadError) els.homeLoadError.hidden = true;

  function applyCatalog(data) {
    state.products = normalizeProducts(data);
    goHome();
    if (els.homeLoadError) els.homeLoadError.hidden = state.products.length > 0;
    updateCartBar();
  }

  var embedded =
    typeof window.__SHOP_CATALOG__ !== "undefined" &&
    Array.isArray(window.__SHOP_CATALOG__) &&
    window.__SHOP_CATALOG__.length > 0;

  if (embedded) {
    applyCatalog(window.__SHOP_CATALOG__);
  } else {
    fetch(productsJsonUrl(), { cache: "no-store" })
      .then(function (r) {
        if (!r.ok) throw new Error("products.json");
        return r.json();
      })
      .then(applyCatalog)
      .catch(function () {
        state.products = [];
        goHome();
        if (els.homeLoadError) els.homeLoadError.hidden = false;
        updateCartBar();
      });
  }
})();
