(function (global) {
  var KEY = "shop62_product_images";

  function getMap() {
    try {
      var o = JSON.parse(global.localStorage.getItem(KEY) || "{}");
      return o && typeof o === "object" ? o : {};
    } catch (e) {
      return {};
    }
  }

  function setMap(obj) {
    try {
      global.localStorage.setItem(KEY, JSON.stringify(obj));
      return true;
    } catch (e) {
      return false;
    }
  }

  function getUrlForProduct(product) {
    if (!product || !product.id) return null;
    var map = getMap();
    if (map[product.id]) return map[product.id];
    if (product.image) return String(product.image).trim() || null;
    return null;
  }

  function setUrlForProduct(productId, url) {
    var map = getMap();
    var id = String(productId);
    var u = (url || "").trim();
    if (u) map[id] = u;
    else delete map[id];
    return setMap(map);
  }

  global.shop62Images = {
    KEY: KEY,
    getMap: getMap,
    setMap: setMap,
    getUrlForProduct: getUrlForProduct,
    setUrlForProduct: setUrlForProduct,
  };
})(typeof window !== "undefined" ? window : this);
