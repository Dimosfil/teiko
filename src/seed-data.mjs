import products from "../teiko-demo/data/products.json" with { type: "json" };

const normalizeMarketplace = (url) => {
  const host = new URL(url).host;
  if (host.includes("wildberries")) return "Wildberries";
  if (host.includes("ozon")) return "Ozon";
  if (host.includes("market.yandex")) return "Яндекс Маркет";
  return host.replace(/^www\./, "");
};

export const seedPayload = {
  settings: {
    siteName: "TEIKO",
    headerTitle: "TEIKO",
    headerText: "Витрина автохимии, ухода за автомобилем и детейлинга.",
    heroTitle: "TEIKO: витрина товаров с переходом на маркетплейсы",
    heroText:
      "Сайт совмещает лаконичную визитку бренда и каталог: выбирайте товар, изучайте описание и переходите к покупке на Ozon, Wildberries или другую площадку.",
    aboutTitle: "Без корзины и оплаты на сайте",
    aboutText:
      "Карточки товаров ведут на внешние площадки. Контент, слайды, описания и товары управляются через отдельную закрытую рабочую зону.",
    contactsTitle: "Покупка на удобной площадке",
    contactsText: "Откройте карточку товара и нажмите кнопку нужного маркетплейса.",
    phone: "",
    email: "",
    logo: "/assets/logo-alpha.png",
    logoBack: "/assets/logo-back.jpg"
  },
  slides: [
    {
      eyebrow: "TEIKO showroom",
      title: "Автохимия и детейлинг в одной витрине",
      text: "Стартовая шапка использует logo-back как графический слой бренда и ведет к каталогу.",
      ctaLabel: "Смотреть каталог",
      ctaHref: "#catalog",
      image: "/assets/logo-back.jpg",
      sortOrder: 1,
      isActive: true
    },
    {
      eyebrow: "Маркетплейсы",
      title: "Покупка происходит на Ozon, Wildberries и других площадках",
      text: "На сайте нет оплаты: каждая карточка хранит набор внешних ссылок для покупки.",
      ctaLabel: "Где купить",
      ctaHref: "#catalog",
      image: "/assets/logo-back.jpg",
      sortOrder: 2,
      isActive: true
    },
    {
      eyebrow: "Каталог",
      title: "Карточки меняются без правки витрины",
      text: "Слайды, шапка, тексты, фото и карточки товаров редактируются в отдельной закрытой рабочей зоне.",
      ctaLabel: "Смотреть товары",
      ctaHref: "#catalog",
      image: "/assets/logo-back.jpg",
      sortOrder: 3,
      isActive: true
    }
  ],
  products: products.map((product, index) => ({
    slug: product.id,
    title: product.title.ru,
    shortDescription: product.description.ru,
    description: product.description.ru,
    brand: product.brand,
    category: product.category.ru,
    badge: product.badge.ru,
    sku: product.sku,
    price: product.price,
    oldPrice: product.oldPrice,
    rating: product.rating,
    image: `/${product.image.replace("assets/products", "uploads")}`,
    marketplaceLinks: [
      {
        label: normalizeMarketplace(product.source),
        url: product.source
      }
    ],
    specs: [
      { label: "Артикул", value: product.sku },
      { label: "Бренд", value: product.brand },
      { label: "Категория", value: product.category.ru }
    ],
    sortOrder: index + 1,
    isActive: true
  }))
};
