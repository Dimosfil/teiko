import json
from pathlib import Path

BASE = Path(__file__).resolve().parent

PRODUCTS = [
    {
        "id": "ftorsic-cf-antirain-50",
        "sku": "OZ-3220762950",
        "seller": "LimeShop36",
        "brand": "FTORSiC",
        "title": {"ru": "FTORSiC CF Антидождь, 50 мл", "en": "FTORSiC CF Anti-rain, 50 ml"},
        "category": {"ru": "Антидождь", "en": "Anti-rain"},
        "price": 690,
        "oldPrice": 990,
        "rating": 4.8,
        "reviews": 126,
        "stock": 24,
        "badge": {"ru": "Стекла", "en": "Glass"},
        "source": "https://uz.ozon.com/product/ftorsiccf-antidozhd50-ml-3220762950/",
        "image": "assets/products/ftorsic-antirain-cf.jpg",
        "description": {
            "ru": "Водоотталкивающий состав для стекол и зеркал автомобиля: дождь и мокрый снег скатываются крупными каплями.",
            "en": "Hydrophobic coating for car glass and mirrors: rain and wet snow roll off in large drops.",
        },
    },
    {
        "id": "ftorsic-interior-kit-4",
        "sku": "OZ-2760825360",
        "seller": "LimeShop36",
        "brand": "FTORSiC",
        "title": {"ru": "Набор «Интерьер» для автомобиля FTORSiC, 4 предмета", "en": "FTORSiC Interior car care kit, 4 pcs"},
        "category": {"ru": "Салон", "en": "Interior"},
        "price": 1890,
        "oldPrice": 2490,
        "rating": 4.8,
        "reviews": 74,
        "stock": 15,
        "badge": {"ru": "Набор", "en": "Kit"},
        "source": "https://uz.ozon.com/product/nabor-interer-dlya-avtomobilya-ftorsic-4-predmeta-2760825360/",
        "image": "assets/products/ftorsic-interior-kit.jpg",
        "description": {
            "ru": "Комплект для ухода за интерьером автомобиля: очистка и финишная обработка поверхностей салона.",
            "en": "Interior car care kit for cleaning and finishing cabin surfaces.",
        },
    },
    {
        "id": "ftorsic-detailing-kit-6",
        "sku": "OZ-2647681884",
        "seller": "LimeShop36",
        "brand": "FTORSiC",
        "title": {"ru": "Набор детейлинга автомобиля FTORSiC, 6 предметов", "en": "FTORSiC car detailing kit, 6 pcs"},
        "category": {"ru": "Детейлинг", "en": "Detailing"},
        "price": 2990,
        "oldPrice": 3890,
        "rating": 4.8,
        "reviews": 91,
        "stock": 12,
        "badge": {"ru": "6 предметов", "en": "6 pcs"},
        "source": "https://am.ozon.com/product/nabor-deteylinga-avtomobilya-ftorsic-6-predmetov-2647681884/",
        "image": "assets/products/ftorsic-detailing-kit.jpg",
        "description": {
            "ru": "Набор для комплексного ухода за автомобилем; в найденной карточке указан универсальный очиститель FTORSiC RCOH.",
            "en": "Complete car care kit; the indexed product card mentions FTORSiC RCOH universal cleaner.",
        },
    },
    {
        "id": "ftorsic-antirain-max-kit-6",
        "sku": "YM-4607397981",
        "seller": "LimeShop36",
        "brand": "FTORSiC",
        "title": {"ru": "Комплект Антидождь FTORSiC Максимум, 6 предметов", "en": "FTORSiC Maximum Anti-rain kit, 6 pcs"},
        "category": {"ru": "Антидождь", "en": "Anti-rain"},
        "price": 2490,
        "oldPrice": 3290,
        "rating": 4.7,
        "reviews": 58,
        "stock": 10,
        "badge": {"ru": "Максимум", "en": "Maximum"},
        "source": "https://market.yandex.ru/card/komplekt-antidozhd-ftorsic-6-predmetov/4607397981",
        "image": "assets/products/ftorsic-antirain-max-kit.jpg",
        "description": {
            "ru": "Расширенный комплект антидождя FTORSiC для подготовки, нанесения и ухода за стеклами.",
            "en": "Extended FTORSiC anti-rain kit for glass preparation, application, and maintenance.",
        },
    },
    {
        "id": "krytex-antirain-50",
        "sku": "OZ-3601125570",
        "seller": "LimeShop36",
        "brand": "KRYTEX",
        "title": {"ru": "KRYTEX Антидождь, готовый раствор, 50 мл", "en": "KRYTEX Anti-rain ready-to-use solution, 50 ml"},
        "category": {"ru": "Антидождь", "en": "Anti-rain"},
        "price": 760,
        "oldPrice": 1090,
        "rating": 4.8,
        "reviews": 136,
        "stock": 22,
        "badge": {"ru": "Готовый", "en": "Ready"},
        "source": "https://am.ozon.com/product/krytex-antidozhd-50-ml-1-sht-3601125570/",
        "image": "assets/products/krytex-antirain-50.jpg",
        "description": {
            "ru": "Готовый водоотталкивающий состав KRYTEX для стекол автомобиля.",
            "en": "Ready-to-use KRYTEX hydrophobic coating for automotive glass.",
        },
    },
    {
        "id": "krytex-mega-glass-50",
        "sku": "OZ-1590359470",
        "seller": "LimeShop36",
        "brand": "KRYTEX",
        "title": {"ru": "KRYTEX MEGA Glass, гидрофобное покрытие антидождь, 50 мл", "en": "KRYTEX MEGA Glass hydrophobic anti-rain coating, 50 ml"},
        "category": {"ru": "Стекла", "en": "Glass"},
        "price": 890,
        "oldPrice": 1290,
        "rating": 4.8,
        "reviews": 112,
        "stock": 18,
        "badge": {"ru": "MEGA Glass", "en": "MEGA Glass"},
        "source": "https://ozon.by/product/gidrofobnoe-pokrytie-antidozhd-dlya-stekol-krytex-mega-glass-50ml-k001-1590359470/",
        "image": "assets/products/krytex-mega-glass.jpg",
        "description": {
            "ru": "Гидрофобное покрытие для автомобильных стекол, рассчитанное на стойкий водоотталкивающий эффект.",
            "en": "Hydrophobic coating for automotive glass designed for a durable water-repellent effect.",
        },
    },
    {
        "id": "krytex-parfume-pro-10-gold-dust",
        "sku": "OZ-PARFUME-10",
        "seller": "LimeShop36",
        "brand": "KRYTEX",
        "title": {"ru": "Ароматизатор-спрей KRYTEX Parfume Pro №10 «Золотая пыль», 50 мл", "en": "KRYTEX Parfume Pro No. 10 Gold Dust spray fragrance, 50 ml"},
        "category": {"ru": "Ароматы", "en": "Fragrance"},
        "price": 840,
        "oldPrice": 3999,
        "rating": 4.7,
        "reviews": 270,
        "stock": 12,
        "badge": {"ru": "Золотая пыль", "en": "Gold Dust"},
        "source": "https://www.ozon.ru/seller/limeshop36/",
        "image": "assets/products/krytex-parfume-10-gold-dust.jpg",
        "description": {
            "ru": "Премиальный ароматизатор-спрей KRYTEX для автомобиля, дома и офиса.",
            "en": "Premium KRYTEX spray fragrance for car, home, and office.",
        },
    },
    {
        "id": "krytex-parfume-pro-1-blue-sky",
        "sku": "OZ-PARFUME-1",
        "seller": "LimeShop36",
        "brand": "KRYTEX",
        "title": {"ru": "Ароматизатор-спрей KRYTEX Parfume Pro №1 «Синее небо», 50 мл", "en": "KRYTEX Parfume Pro No. 1 Blue Sky spray fragrance, 50 ml"},
        "category": {"ru": "Ароматы", "en": "Fragrance"},
        "price": 840,
        "oldPrice": 3999,
        "rating": 4.7,
        "reviews": 270,
        "stock": 12,
        "badge": {"ru": "Синее небо", "en": "Blue Sky"},
        "source": "https://www.ozon.ru/seller/limeshop36/",
        "image": "assets/products/krytex-parfume-1-blue-sky.jpg",
        "description": {
            "ru": "Премиальный ароматизатор-спрей KRYTEX для автомобиля, дома и офиса.",
            "en": "Premium KRYTEX spray fragrance for car, home, and office.",
        },
    },
    {
        "id": "krytex-parfume-pro-3-male-soul",
        "sku": "OZ-PARFUME-3",
        "seller": "LimeShop36",
        "brand": "KRYTEX",
        "title": {"ru": "Ароматизатор-спрей KRYTEX Parfume Pro №3 «Мужская душа», 50 мл", "en": "KRYTEX Parfume Pro No. 3 Male Soul spray fragrance, 50 ml"},
        "category": {"ru": "Ароматы", "en": "Fragrance"},
        "price": 971,
        "oldPrice": 3999,
        "rating": 4.8,
        "reviews": 270,
        "stock": 13,
        "badge": {"ru": "Мужская душа", "en": "Male Soul"},
        "source": "https://www.ozon.ru/seller/limeshop36/",
        "image": "assets/products/krytex-parfume-3-male-soul.jpg",
        "description": {
            "ru": "Премиальный ароматизатор-спрей KRYTEX для автомобиля, дома и офиса.",
            "en": "Premium KRYTEX spray fragrance for car, home, and office.",
        },
    },
    {
        "id": "krytex-parfume-pro-5-narcotic-flower",
        "sku": "OZ-PARFUME-5",
        "seller": "LimeShop36",
        "brand": "KRYTEX",
        "title": {"ru": "Ароматизатор-спрей KRYTEX Parfume Pro №5 «Наркотический цветок», 50 мл", "en": "KRYTEX Parfume Pro No. 5 Narcotic Flower spray fragrance, 50 ml"},
        "category": {"ru": "Ароматы", "en": "Fragrance"},
        "price": 858,
        "oldPrice": 3999,
        "rating": 4.8,
        "reviews": 270,
        "stock": 12,
        "badge": {"ru": "Наркотический цветок", "en": "Narcotic Flower"},
        "source": "https://www.ozon.ru/seller/limeshop36/",
        "image": "assets/products/krytex-parfume-5-narcotic-flower.jpg",
        "description": {
            "ru": "Премиальный ароматизатор-спрей KRYTEX для автомобиля, дома и офиса.",
            "en": "Premium KRYTEX spray fragrance for car, home, and office.",
        },
    },
    {
        "id": "ftorsic-interior-krytex-pro-2",
        "sku": "OZ-2819385013",
        "seller": "LimeShop36",
        "brand": "FTORSiC / KRYTEX",
        "title": {"ru": "Набор «Интерьер + Krytex Pro №2» для автомобиля FTORSiC, 5 предметов", "en": "FTORSiC Interior + Krytex Pro No. 2 car kit, 5 pcs"},
        "category": {"ru": "Салон", "en": "Interior"},
        "price": 2390,
        "oldPrice": 3190,
        "rating": 4.8,
        "reviews": 49,
        "stock": 11,
        "badge": {"ru": "5 предметов", "en": "5 pcs"},
        "source": "https://am.ozon.com/product/nabor-interer-dlya-avtomobilya-ftorsic-5-predmetov-2819385013/",
        "image": "assets/products/ftorsic-krytex-interior-kit.jpg",
        "description": {
            "ru": "Комбинированный набор для ухода за салоном автомобиля с продуктами FTORSiC и KRYTEX.",
            "en": "Combined interior care kit with FTORSiC and KRYTEX products.",
        },
    },
    {
        "id": "krytex-mega-glass-anti-rain-50",
        "sku": "OZ-1576507717",
        "seller": "LimeShop36",
        "brand": "KRYTEX",
        "title": {"ru": "Антидождь KRYTEX MEGA Glass, защитное водоотталкивающее покрытие стекол", "en": "KRYTEX MEGA Glass protective water-repellent glass coating"},
        "category": {"ru": "Стекла", "en": "Glass"},
        "price": 890,
        "oldPrice": 1290,
        "rating": 4.8,
        "reviews": 86,
        "stock": 14,
        "badge": {"ru": "Защита", "en": "Protection"},
        "source": "https://ozon.by/product/antidozhd-krytex-mega-glass-zashchitnoe-vodoottalkivayushchee-nanopokrytie-stekol-i-1576507717/",
        "image": "assets/products/krytex-mega-glass-protection.jpg",
        "description": {
            "ru": "Защитное водоотталкивающее нанопокрытие для стекол автомобиля.",
            "en": "Protective water-repellent nano coating for automotive glass.",
        },
    },
]

TRANSLATIONS = {
    "ru": {
        "catalog": "Каталог", "cart": "Корзина", "heroEyebrow": "Автохимия и детейлинг",
        "heroTitle": "TEIKO: черно-белая витрина автохимии",
        "heroText": "Технический каталог средств для мойки, защиты, салона, стекол, шин и зимнего ухода.",
        "shopNow": "Смотреть товары", "demoOrder": "Быстрый демо-заказ", "todayDeals": "Позиции",
        "bestPrice": "Старт набора", "delivery": "доставка", "rating": "рейтинг", "database": "файлы",
        "filters": "Фильтры", "reset": "Сбросить", "sort": "Сортировка", "sortPopular": "Популярные",
        "sortPriceAsc": "Сначала дешевле", "sortPriceDesc": "Сначала дороже", "sortRating": "Высокий рейтинг",
        "saleOnly": "Только со скидкой", "inStockOnly": "В наличии",
        "sellerLine": "LimeShop36 / товары из Ozon / тестовый каталог", "catalogTitle": "Автохимия",
        "items": "Товары", "deliveryCost": "Доставка", "total": "Итого", "checkout": "Оформить",
        "checkoutTitle": "Данные заказа", "name": "Имя", "phone": "Телефон", "address": "Адрес доставки",
        "noPayment": "Оплата не подключена: заказ фиксируется как демо-покупка.",
        "placeOrder": "Подтвердить заказ", "orderSummary": "Состав заказа",
        "searchPlaceholder": "Искать автохимию, бренд или артикул", "addToCart": "В корзину",
        "details": "Подробнее", "emptyCart": "Корзина пока пустая", "emptyResults": "Товары не найдены",
        "emptyHint": "Попробуйте сбросить фильтры или изменить запрос.", "favorites": "Избранное",
        "all": "Все", "reviews": "отзывов", "stock": "остаток", "source": "Источник", "remove": "Удалить",
        "orderCreated": "Заказ создан", "orderNumber": "Номер заказа", "added": "Добавлено в корзину",
        "favoriteAdded": "Добавлено в избранное", "favoriteRemoved": "Убрано из избранного",
        "cartRequired": "Добавьте товары в корзину.", "formRequired": "Заполните данные заказа.",
        "savedLocal": "Демо-заказ сохранен в браузере.", "result": "товаров", "free": "Бесплатно",
    },
    "en": {
        "catalog": "Catalog", "cart": "Cart", "heroEyebrow": "Car care chemicals",
        "heroTitle": "TEIKO: black and white car care storefront",
        "heroText": "A technical catalog for wash, protection, interior, glass, tires, and winter care.",
        "shopNow": "Shop products", "demoOrder": "Quick demo order", "todayDeals": "Items",
        "bestPrice": "Kit starts at", "delivery": "delivery", "rating": "rating", "database": "files",
        "filters": "Filters", "reset": "Reset", "sort": "Sort", "sortPopular": "Popular",
        "sortPriceAsc": "Price low to high", "sortPriceDesc": "Price high to low", "sortRating": "Top rated",
        "saleOnly": "Discounted only", "inStockOnly": "In stock",
        "sellerLine": "LimeShop36 / Ozon products / test catalog", "catalogTitle": "Car care",
        "items": "Items", "deliveryCost": "Delivery", "total": "Total", "checkout": "Checkout",
        "checkoutTitle": "Order details", "name": "Name", "phone": "Phone", "address": "Delivery address",
        "noPayment": "Payments are disabled: this is saved as a demo purchase.",
        "placeOrder": "Confirm order", "orderSummary": "Order summary",
        "searchPlaceholder": "Search car care, brand, or SKU", "addToCart": "Add to cart",
        "details": "Details", "emptyCart": "Your cart is empty", "emptyResults": "No products found",
        "emptyHint": "Try resetting filters or changing the query.", "favorites": "Favorites",
        "all": "All", "reviews": "reviews", "stock": "stock", "source": "Source", "remove": "Remove",
        "orderCreated": "Order created", "orderNumber": "Order number", "added": "Added to cart",
        "favoriteAdded": "Added to favorites", "favoriteRemoved": "Removed from favorites",
        "cartRequired": "Add products to the cart.", "formRequired": "Fill in order details.",
        "savedLocal": "Demo order saved in the browser.", "result": "products", "free": "Free",
    },
}


def main():
    (BASE / "data" / "products.json").write_text(
        json.dumps(PRODUCTS, ensure_ascii=True, indent=2) + "\n",
        encoding="ascii",
    )

    app_path = BASE / "app.mjs"
    app = app_path.read_text(encoding="ascii")
    start = app.index("const embeddedProducts = ")
    mid = app.index("const translations = ", start)
    storage = app.index("const storage = ", mid)
    head = (
        "const embeddedProducts = "
        + json.dumps(PRODUCTS[:3], ensure_ascii=True, indent=2)
        + ";\n\nconst translations = "
        + json.dumps(TRANSLATIONS, ensure_ascii=True, indent=2)
        + ";\n\n"
    )
    app = head + app[storage:]
    app = app.replace("teiko-carcare-6", "teiko-carcare-7")
    app_path.write_text(app, encoding="ascii")

    index_path = BASE / "index.html"
    index = index_path.read_text(encoding="utf-8").replace("teiko-carcare-6", "teiko-carcare-7")
    index_path.write_text(index, encoding="utf-8")


if __name__ == "__main__":
    main()
