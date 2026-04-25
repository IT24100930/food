// This file auto-generates individual route files
// Each file below is a standalone route module

const { orderRouter, paymentRouter, inventoryRouter, taxRouter, discountRouter, refundRouter } = require('./_allRoutes');

// Export each router so server.js can require them individually
module.exports = { orderRouter, paymentRouter, inventoryRouter, taxRouter, discountRouter, refundRouter };
