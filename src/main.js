/**
 * Функция для расчета выручки
 * @param purchase запись о покупке
 * @param _product карточка товара
 * @returns {number}
 */
function calculateSimpleRevenue(purchase, _product) {
    const { discount, sale_price, quantity } = purchase;
   // @TODO: Расчет выручки от операции
   const sumNotDiscount =   1 - (purchase.discount / 100);
   const simpleRevenuve = sale_price * quantity * sumNotDiscount;
   return simpleRevenuve;
}

/**
 * Функция для расчета бонусов
 * @param index порядковый номер в отсортированном массиве
 * @param total общее число продавцов
 * @param seller карточка продавца
 * @returns {number}
 */
function calculateBonusByProfit(index, total, seller) {
    const { profit } = seller;
    const maxBonus = 0.15;
    const prizeBonus = 0.10;
    const defaultBonus = 0.05;
    // @TODO: Расчет бонуса от позиции в рейтинге
    if (index === 0) {
        return profit * maxBonus;
    } else if (index === 1 || index === 2) {
        return profit * prizeBonus;
    } else if (index === total - 1) {
        return 0;
    } else {
        return profit * defaultBonus;
    }
}

/**
 * Функция для анализа данных продаж
 * @param data
 * @param options
 * @returns {{revenue, top_products, bonus, name, sales_count, profit, seller_id}[]}
 */
function analyzeSalesData(data, options) {
    const { calculateRevenue, calculateBonus } = options;
    // @TODO: Проверка входных данных
    if(!data || data.customers.length === 0 || data.products.length === 0 ||
        data.sellers.length === 0 || data.purchase_records.length === 0 ||
        !Array.isArray(data.customers) || !Array.isArray(data.products) ||
        !Array.isArray(data.sellers) || !Array.isArray(data.purchase_records)
    ) {
        throw new Error("Нет входных данный или они не верны!");
    }
    // @TODO: Проверка наличия опций
    if(!options || 
        typeof calculateSimpleRevenue !== 'function' || 
        typeof calculateBonusByProfit !== 'function'
    ) {
        throw new Error("Функции для расчёта не переданы!");
    }

    // @TODO: Подготовка промежуточных данных для сбора статистики
    const sellerStats = data.sellers.map(seller => ({
        id: seller.id,
        name: `${seller.first_name} ${seller.last_name}`,
        revenue: 0,
        profit: 0,
        sales_count: 0,
        products_sold: {}
    }));

    // @TODO: Индексация продавцов и товаров для быстрого доступа
    const sellerIndex = Object.fromEntries(sellerStats.map(seller => [seller.id, seller]));
    const productIndex  = Object.fromEntries(data.products.map(product => [product.sku, product]));

    // @TODO: Расчет выручки и прибыли для каждого продавца
    data.purchase_records.forEach(record => { // Чек 
        const seller = sellerIndex[record.seller_id]; // Продавец
        seller.sales_count += 1;
        seller.revenue += record.total_amount;

        // Расчёт прибыли для каждого товара
        record.items.forEach(item => {
            const product = productIndex[item.sku]; // Товар

            //Расчеты себестоимости, выручки и прибыли
            const cost = product.purchase_price * item.quantity;
            const revenue = calculateSimpleRevenue(item, product);
            const profit = revenue - cost;
            seller.profit += profit;

            //Увеличить счётчик проданых товаров у продавца
            if (!seller.products_sold[item.sku]) {
                seller.products_sold[item.sku] = 0;
            }
            seller.products_sold[item.sku] += item.quantity;
        });
    });

    // @TODO: Сортировка продавцов по прибыли
    sellerStats.sort((a, b) => b.profit - a.profit);
    console.log(sellerStats);

    // @TODO: Назначение премий на основе ранжирования
    sellerStats.forEach((seller, index) => {
        seller.bonus = calculateBonusByProfit(index, sellerStats.length, seller);
        seller.top_products = Object.entries(seller.products_sold).map(([sku, quantity]) => ({sku, quantity})).sort((a, b) => b.quantity - a.quantity).slice(0, 10);
    }); 

    // @TODO: Подготовка итоговой коллекции с нужными полями
    return sellerStats.map(seller => ({
        seller_id: seller.id,
        name: seller.name,
        revenue: parseFloat(seller.revenue.toFixed(2)),
        profit: parseFloat(seller.profit.toFixed(2)),
        sales_count: seller.sales_count,
        top_products: seller.top_products,
        bonus: parseFloat(seller.bonus.toFixed(2))
    }));
}
