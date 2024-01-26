// Observes cart changes and triggers the cart processing
const observeCartChanges = () => {
  processCartItems();

  const cartObserver = new PerformanceObserver((list) => {
    list.getEntries().forEach((entry) => {
      if (isValidCartChangeRequest(entry)) {
        processCartItems();
      }
    });
  });
  cartObserver.observe({ entryTypes: ["resource"] });
};

const isValidCartChangeRequest = (entry) => {
  const isValidRequestType = ["xmlhttprequest", "fetch"].includes(
    entry.initiatorType
  );
  const isCartChangeRequest = /\/cart\//.test(entry.name);
  return isValidRequestType && isCartChangeRequest;
};

const processCartItems = async () => {
  const cart = await fetchCart();
  cart.items.forEach(processItem);
};

const fetchCart = async () => {
  const response = await fetch("/cart.js");
  return response.json();
};

const processItem = (item) => {
  if (hasDiscounts(item)) {
    applyDiscount(item);
  } else {
    updatePriceDisplay(item);
  }
};

const hasDiscounts = (item) => item.discounts && item.discounts.length > 0;

const applyDiscount = (item) => {
  if (isProductPage(item.handle)) {
    updatePriceElement(item);
  }

  if (isCollectionsPage()) {
    updatePriceElementInCollection(item);
  }
};

const updatePriceDisplay = (item) => {
  if (document.querySelector("#abra-inserted-discount")) {
    let priceElement = document.querySelector(".price__regular");

    if (isCollectionsPage()) {
      priceElement = getPriceElementInCollection(item);
    }
    if (!priceElement) return;

    priceElement.innerHTML = formatRegularPrice(item);
  }
};

const isProductPage = (itemHandle) => window.location.pathname.includes(itemHandle);

const isCollectionsPage = () =>
  window.location.pathname.includes("/collections");

const updatePriceElement = (item, isDiscounted) => {
  const priceElement = document.querySelector(".price__regular");
  priceElement.innerHTML = formatDiscountedPrice(item);
};

const updatePriceElementInCollection = (item, isDiscounted) => {
  const priceElement = getPriceElementInCollection(item);
  if (!priceElement) return;

  priceElement.innerHTML = formatDiscountedPrice(item);
};

const getPriceElementInCollection = (item) => {
  const card = getProductCardOnCollectionPage(item);
  return card?.querySelector(".price__regular");
};

const getProductCardOnCollectionPage = (item) => {
  const itemUrl = item.url.includes("?") ? item.url.split("?")[0] : item.url;
  const productLinkElement = document.querySelector(
    `a[href="${itemUrl}"][id*="CardLink"]`
  );
  return productLinkElement?.closest(".card__content");
};

const formatRegularPrice = (item) => {
  return `<span class="price-item price-item--regular">${formatPrice(
    item.original_price
  )}</span>`;
};

const formatDiscountedPrice = (item) => {
  return `
    <span class="price-item price-item--regular"><s>${formatPrice(
      item.original_price
    )}</s></span>
    <span class="price-item price-item--sale" id="abra-inserted-discount">${formatPrice(
      item.discounted_price
    )}</span>
  `;
};

const formatPrice = (price) => {
  switch(window.Shopify.currency.active) {
    case "BRL":
      return (price/100).toLocaleString("pt-BR", {
        style: "currency",
        currency: "BRL",
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      });
    case "USD":
      return (price/100).toLocaleString("en-US", {
        style: "currency",
        currency: "USD",
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      });
    default:
      return (price/100).toLocaleString("en-US", {
        style: "currency",
        currency: window.Shopify.currency.active,
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      });
  }
};


document.addEventListener("DOMContentLoaded", observeCartChanges);
