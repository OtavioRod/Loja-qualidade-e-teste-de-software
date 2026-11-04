"use strict";

function listVisibleOrders(db, userId) {
  const owned = db.listOrders().filter((order) => order.userId === userId);
  return owned.map((order) => {
    const items = order.items.map((item) => {
      let quantitySoldToCustomer = 0;
      for (const current of owned) {
        for (const candidate of current.items) {
          if (candidate.productId === item.productId) {
            quantitySoldToCustomer += Number(candidate.quantity) || 0;
          }
        }
      }
      return { ...item, quantitySoldToCustomer };
    });
    return { ...order, items };
  });
}

module.exports = {
  listVisibleOrders,
};
