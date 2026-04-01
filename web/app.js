(function () {
  var tg = window.Telegram && window.Telegram.WebApp;
  var runtimeConfig = window.__SHOP_CONFIG__ || {};
  var TELEGRAM_BOT_TOKEN = String(runtimeConfig.TELEGRAM_BOT_TOKEN || "").trim();
  var TELEGRAM_GROUP_CHAT_ID = String(runtimeConfig.TELEGRAM_GROUP_CHAT_ID || "").trim();
  var ORDER_API_URL_CFG = String(runtimeConfig.ORDER_API_URL || "").trim();

  function resolveOrderApiUrl(raw) {
    var s = String(raw || "").trim();
    if (!s) return "";
    try {
      return new URL(s, location.href).href;
    } catch (e) {
      return s;
    }
  }

  function defaultOrderApiUrl() {
    try {
      var h = location.hostname;
      var port = String(location.port || "");
      if ((h === "127.0.0.1" || h === "localhost") && port === "8787") {
        return location.protocol + "//" + location.host + "/api/order";
      }
    } catch (e) {}
    return "";
  }

  var ORDER_API_URL = resolveOrderApiUrl(ORDER_API_URL_CFG) || resolveOrderApiUrl(defaultOrderApiUrl());

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
    { family: "mac_mini", label: "Mac Mini" },
    { family: "apple_acc", label: "Аксессуары" },
  ];
  var SAMSUNG_SUBS = [
    { family: "samsung_phone", label: "Смартфоны" },
    { family: "samsung_tablet", label: "Планшеты" },
    { family: "samsung_watch", label: "Умные часы" },
    { family: "samsung_audio", label: "Galaxy Buds" },
  ];
  var XIAOMI_SUBS = [
    { family: "xm_mi", label: "Mi / Xiaomi" },
    { family: "xm_redmi", label: "Redmi" },
    { family: "xm_poco", label: "POCO" },
    { family: "xm_watch", label: "Часы" },
    { family: "xm_honor", label: "Honor" },
    { family: "xm_realme", label: "Realme" },
    { family: "xm_infinix", label: "Infinix" },
    { family: "xm_tecno", label: "Tecno" },
    { family: "xm_nothing", label: "Nothing" },
    { family: "xm_vivo", label: "Vivo" },
    { family: "xm_itel", label: "Itel" },
  ];
  var HUAWEI_SUBS = [
    { family: "huawei_phone", label: "Смартфоны" },
    { family: "huawei_tablet", label: "Планшеты" },
    { family: "huawei_watch", label: "Часы" },
  ];
  var GOOGLE_SUBS = [{ family: "pixel_phone", label: "Pixel" }];
  var GARMIN_SUBS = [{ family: "garmin_watch", label: "Часы" }];
  var GAMING_SUBS = [
    { family: "gaming_item", label: "Приставки" },
    { family: "gaming_xbox", label: "Xbox" },
    { family: "gaming_gpu", label: "ВИДЕОКАРТЫ" },
    { family: "gaming_ssd", label: "SSD" },
    { family: "gaming_ddr5", label: "DDR5" },
  ];
  var AUDIO_SUBS = [
    { family: "marshall_speakers", label: "Marshall" },
    { family: "audio_jbl", label: "JBL" },
    { family: "audio_sony", label: "Sony" },
    { family: "audio_yandex", label: "Яндекс" },
    { family: "audio_headphones", label: "Наушники / TWS" },
    { family: "audio_beats", label: "Beats" },
    { family: "audio_bose", label: "Bose" },
    { family: "audio_harman", label: "Harman/Kardon" },
    { family: "audio_other", label: "Другое" },
  ];

  var HOME_OFFICE_SUBS = [
    { family: "home_office_gadgets", label: "Гаджеты / МБТ" },
    { family: "home_office_network", label: "Сетевое оборудование" },
    { family: "home_office_mfu", label: "МФУ" },
    { family: "home_office_media", label: "Медиаплееры" },
  ];

  var DYSON_SUBS = [
    { family: "dyson", label: "Все товары" },
    { family: "dyson_airstrait", label: "Airstrait" },
    { family: "dyson_airwrap", label: "AirWrap" },
  ];

  var PHOTO_VIDEO_SUBS = [
    { family: "photo_video_canon", label: "Canon" },
    { family: "photo_video_gopro", label: "GoPro" },
    { family: "photo_video_insta360", label: "Insta360" },
    { family: "photo_video_dji", label: "DJI" },
    { family: "photo_video_jetson", label: "Jetson" },
  ];

  var LAPTOPS_SUBS = [
    { family: "laptop_asus", label: "ASUS" },
    { family: "laptop_lenovo", label: "Lenovo" },
    { family: "laptop_msi", label: "MSI" },
    { family: "laptop_acer", label: "Acer" },
    { family: "laptop_hp", label: "HP" },
    { family: "laptop_dell", label: "Dell" },
    { family: "laptop_honor", label: "Honor" },
    { family: "laptop_huawei", label: "Huawei" },
    { family: "laptop_maibenben", label: "Maibenben" },
    { family: "laptop_chuwi", label: "Chuwi" },
    { family: "laptop_acd", label: "ACD" },
    { family: "laptop_other", label: "Другие" },
  ];

  var VR_META_SUBS = [
    { family: "vr_meta_quest", label: "Meta Quest" },
    { family: "vr_meta_rayban", label: "Meta Ray-Ban" },
  ];

  var lastSendDataError = null;

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
          currency: "RUB",
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
    orderModal: document.getElementById("orderModal"),
    orderModalBackdrop: document.getElementById("orderModalBackdrop"),
    orderModalClose: document.getElementById("orderModalClose"),
    orderForm: document.getElementById("orderForm"),
    orderName: document.getElementById("orderName"),
    orderPhone: document.getElementById("orderPhone"),
    orderTelegram: document.getElementById("orderTelegram"),
    orderFormError: document.getElementById("orderFormError"),
    orderFormSubmit: document.getElementById("orderFormSubmit"),
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
    } else if (brand === "home_office") {
      subs = HOME_OFFICE_SUBS;
      title = "Home/Office";
    } else if (brand === "dyson") {
      subs = DYSON_SUBS;
      title = "Dyson";
    } else if (brand === "photo_video") {
      subs = PHOTO_VIDEO_SUBS;
      title = "Фото/Видео";
    } else if (brand === "vr_meta") {
      subs = VR_META_SUBS;
      title = "VR/Meta";
    } else if (brand === "laptops") {
      subs = LAPTOPS_SUBS;
      title = "Ноутбуки";
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

  function collectOrderLines() {
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
    return lines;
  }

  function openOrderModal() {
    var lines = collectOrderLines();
    if (!lines.length) {
      alert("Корзина пуста.");
      return;
    }
    if (!els.orderModal) {
      alert("Не найдено окно оформления. Обновите страницу.");
      return;
    }
    if (els.orderFormError) {
      els.orderFormError.hidden = true;
      els.orderFormError.textContent = "";
    }
    els.orderModal.hidden = false;
    if (els.orderName) setTimeout(function () { els.orderName.focus(); }, 10);
  }

  function closeOrderModal() {
    if (!els.orderModal) return;
    els.orderModal.hidden = true;
  }

  function normalizeTelegram(v) {
    var t = String(v || "").trim();
    if (!t) return "";
    if (t.charAt(0) !== "@") t = "@" + t.replace(/^@+/, "");
    return t;
  }

  function showOrderFormError(msg) {
    if (!els.orderFormError) return;
    els.orderFormError.textContent = msg || "Ошибка отправки";
    els.orderFormError.hidden = false;
  }

  function formatOrderText(lines, customer, total) {
    return (
      "Новый заказ 62 ЯБЛОКА\n\n" +
      "Имя: " +
      customer.name +
      "\nТелефон: " +
      customer.phone +
      "\nTelegram: " +
      customer.telegram +
      "\n\n" +
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
      formatPrice(total)
    );
  }

  function sendMessageViaBotApi(text) {
    if (!TELEGRAM_BOT_TOKEN || !TELEGRAM_GROUP_CHAT_ID) {
      return Promise.reject(new Error("telegram_not_configured"));
    }
    var url = "https://api.telegram.org/bot" + TELEGRAM_BOT_TOKEN + "/sendMessage";
    return fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        chat_id: TELEGRAM_GROUP_CHAT_ID,
        text: text,
      }),
    }).then(function (r) {
      if (!r.ok) throw new Error("telegram_http_" + r.status);
      return r.json();
    });
  }

  function sendOrderViaProxy(text) {
    if (!ORDER_API_URL) {
      return Promise.reject(new Error("order_proxy_not_configured"));
    }
    return fetch(ORDER_API_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ text: text }),
    }).then(function (r) {
      return r.text().then(function (raw) {
        var body = null;
        try {
          body = raw ? JSON.parse(raw) : {};
        } catch (e) {
          body = { ok: false, detail: raw };
        }
        if (!r.ok || !body || !body.ok) {
          var d = body && body.detail ? JSON.stringify(body.detail) : "";
          throw new Error("order_proxy_" + r.status + (d ? " " + d : ""));
        }
        return body;
      });
    });
  }

  function payloadForMiniApp(customer, lines, total, text) {
    var p = { source: "62yabloka_catalog", customer: customer, total: total, text: text };
    var maxLen = 3900;
    function encodedLen(x) {
      try {
        return JSON.stringify(x).length;
      } catch (e) {
        return 999999;
      }
    }

    if (encodedLen(p) <= maxLen) return p;

    // Telegram WebApp sendData limit is tight; keep payload small and deterministic.
    p = {
      source: "62yabloka_catalog",
      total: total,
      customer: {
        name: customer && customer.name ? String(customer.name) : "",
        phone: customer && customer.phone ? String(customer.phone) : "",
        telegram: customer && customer.telegram ? String(customer.telegram) : "",
      },
      text: String(text || ""),
    };

    if (p.text.length > 3200) p.text = p.text.slice(0, 3200) + "\n…";
    while (encodedLen(p) > maxLen && p.text.length > 200) {
      p.text = p.text.slice(0, Math.max(200, p.text.length - 200));
    }
    return p;
  }

  function submitOrderWithCustomer(customer) {
    var lines = collectOrderLines();
    if (!lines.length) {
      alert("Корзина пуста.");
      closeOrderModal();
      return;
    }
    var total = lines.reduce(function (a, x) {
      return a + x.sum;
    }, 0);
    var text = formatOrderText(lines, customer, total);
    var payload = payloadForMiniApp(customer, lines, total, text);

    function resetOrderFormSubmit() {
      if (els.orderFormSubmit) {
        els.orderFormSubmit.disabled = false;
        els.orderFormSubmit.textContent = "Отправить заказ";
      }
    }

    function onOrderSendOk() {
      alert("Заказ отправлен. Мы скоро свяжемся с вами.");
      state.cart = {};
      saveCart();
      closeOrderModal();
      if (state.screen === "cart") renderCartView();
      else if (state.screen === "catalog") renderGrid();
      updateCartBar();
      resetOrderFormSubmit();
    }

    function onOrderSendFail(hint) {
      showOrderFormError(hint);
      if (els.orderFormError) {
        try {
          els.orderFormError.scrollIntoView({ block: "nearest", behavior: "smooth" });
        } catch (e2) {}
      }
      resetOrderFormSubmit();
    }

    function orderUrlBlockedByMixedContent(url) {
      try {
        if (!url || location.protocol !== "https:") return false;
        return new URL(url).protocol === "http:";
      } catch (e) {
        return false;
      }
    }

    function fallbackSendOrder() {
      var apiChain = TELEGRAM_BOT_TOKEN && TELEGRAM_GROUP_CHAT_ID
        ? sendMessageViaBotApi(text)
        : ORDER_API_URL
          ? sendOrderViaProxy(text)
          : Promise.reject(new Error("no_fallback"));

      apiChain
        .then(function () { onOrderSendOk(); })
        .catch(function () {
          onOrderSendFail(
            "Не удалось отправить заказ. Попробуйте открыть каталог через кнопку меню бота."
          );
        });
    }

    function attemptSendDataToBot() {
      lastSendDataError = null;
      if (!tg || typeof tg.sendData !== "function") return false;
      try {
        try {
          if (tg.HapticFeedback && typeof tg.HapticFeedback.notificationOccurred === "function") {
            tg.HapticFeedback.notificationOccurred("success");
          }
        } catch (h) {}
        tg.sendData(JSON.stringify(payload));
        setTimeout(function () {
          if (document && document.visibilityState !== "hidden") {
            fallbackSendOrder();
          } else {
            state.cart = {};
            saveCart();
          }
        }, 1500);
        return true;
      } catch (e) {
        return false;
      }
    }

    if (els.orderFormSubmit) {
      els.orderFormSubmit.disabled = true;
      els.orderFormSubmit.textContent = "Отправка...";
    }
    if (els.orderFormError) {
      els.orderFormError.hidden = true;
      els.orderFormError.textContent = "";
    }

    if (tg && typeof tg.sendData === "function") {
      if (!attemptSendDataToBot()) {
        fallbackSendOrder();
      }
      return;
    }

    if (ORDER_API_URL && orderUrlBlockedByMixedContent(ORDER_API_URL)) {
      onOrderSendFail(
        "Сайт открыт по HTTPS, а адрес отправки — по HTTP; браузер блокирует такой запрос. " +
          "В .env укажите ORDER_API_URL=/api/order (тот же домен, настройте прокси на сервере) или полный https://… URL бэкенда, " +
          "затем выполните python3 scripts/build_runtime_config.py."
      );
      return;
    }

    if (els.orderFormSubmit) {
      els.orderFormSubmit.disabled = true;
      els.orderFormSubmit.textContent = "Отправка...";
    }
    if (els.orderFormError) {
      els.orderFormError.hidden = true;
      els.orderFormError.textContent = "";
    }

    var chain = ORDER_API_URL
      ? sendOrderViaProxy(text)
      : sendMessageViaBotApi(text);

    chain
      .then(function () {
        onOrderSendOk();
      })
      .catch(function () {
        var hint =
          "Откройте каталог кнопкой меню бота с типом Web App (иначе sendData недоступен). " +
          "Либо настройте ORDER_API_URL для отправки с сайта (см. .env.example).";
        if (lastSendDataError && tg) {
          hint = "Telegram: " + lastSendDataError + "\n\n" + hint;
        }
        onOrderSendFail(hint);
      });
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

  els.orderBtn.addEventListener("click", openOrderModal);
  if (els.cartViewBtn) {
    els.cartViewBtn.addEventListener("click", function () {
      if (state.screen === "cart") return;
      showCart();
    });
  }
  if (els.cartOrderBtn) els.cartOrderBtn.addEventListener("click", openOrderModal);

  if (els.orderModalClose) {
    els.orderModalClose.addEventListener("click", closeOrderModal);
  }
  if (els.orderModalBackdrop) {
    els.orderModalBackdrop.addEventListener("click", closeOrderModal);
  }
  if (els.orderForm) {
    els.orderForm.addEventListener("submit", function (e) {
      e.preventDefault();
      var name = (els.orderName && els.orderName.value ? els.orderName.value : "").trim();
      var phone = (els.orderPhone && els.orderPhone.value ? els.orderPhone.value : "").trim();
      var telegram = normalizeTelegram(
        els.orderTelegram && els.orderTelegram.value ? els.orderTelegram.value : ""
      );

      if (!name) {
        showOrderFormError("Укажите имя.");
        if (els.orderName) els.orderName.focus();
        return;
      }
      if (name.length < 2) {
        showOrderFormError("Имя слишком короткое.");
        if (els.orderName) els.orderName.focus();
        return;
      }
      if (!phone) {
        showOrderFormError("Укажите номер телефона.");
        if (els.orderPhone) els.orderPhone.focus();
        return;
      }
      if (phone.length < 5) {
        showOrderFormError("Укажите корректный номер телефона.");
        if (els.orderPhone) els.orderPhone.focus();
        return;
      }
      if (!telegram || telegram === "@") {
        showOrderFormError("Укажите Telegram (@username).");
        if (els.orderTelegram) els.orderTelegram.focus();
        return;
      }
      if (!/^@[A-Za-z0-9_]{4,}$/.test(telegram)) {
        showOrderFormError("Telegram: только латиница, цифры и _, минимум 4 символа после @.");
        if (els.orderTelegram) els.orderTelegram.focus();
        return;
      }

      submitOrderWithCustomer({
        name: name,
        phone: phone,
        telegram: telegram,
      });
    });
  }

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
