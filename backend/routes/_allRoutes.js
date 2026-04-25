// ─── orderRoutes.js ──────────────────────────────────────────────────────────
const express = require('express');
const orderRouter = express.Router();
const { createOrder, getOrders, getMyOrders, getOrder, updateOrderStatus, cancelOrder } = require('../controllers/orderController');
const { protect, authorize } = require('../middleware/auth');

orderRouter.use(protect);
orderRouter.post('/',              createOrder);
orderRouter.get('/',               authorize('Admin','Staff'), getOrders);
orderRouter.get('/my-orders',      getMyOrders);
orderRouter.get('/:id',            getOrder);
orderRouter.patch('/:id/status',   authorize('Admin','Staff'), updateOrderStatus);
orderRouter.patch('/:id/cancel',   cancelOrder);

// ─── paymentRoutes.js ─────────────────────────────────────────────────────────
const paymentRouter = express.Router();
const { getExchangeRates, processPayment, getPayments, getPayment, getPaymentAnalytics } = require('../controllers/paymentController');

paymentRouter.use(protect);
paymentRouter.get('/exchange-rates', getExchangeRates);
paymentRouter.get('/analytics',      authorize('Admin'), getPaymentAnalytics);
paymentRouter.post('/',              processPayment);
paymentRouter.get('/',               authorize('Admin','Staff'), getPayments);
paymentRouter.get('/:id',            getPayment);

// ─── inventoryRoutes.js ───────────────────────────────────────────────────────
const inventoryRouter = express.Router();
const { getInventory, getInventoryItem, createInventoryItem, updateInventoryItem, deleteInventoryItem, adjustStock, getStockHistory, getInventoryAlerts } = require('../controllers/inventoryController');

inventoryRouter.use(protect, authorize('Admin','Staff'));
inventoryRouter.get('/',              getInventory);
inventoryRouter.get('/alerts',        getInventoryAlerts);
inventoryRouter.get('/:id',           getInventoryItem);
inventoryRouter.get('/:id/history',   getStockHistory);
inventoryRouter.post('/',             createInventoryItem);
inventoryRouter.put('/:id',           updateInventoryItem);
inventoryRouter.delete('/:id',        authorize('Admin'), deleteInventoryItem);
inventoryRouter.patch('/:id/stock',   adjustStock);

// ─── taxRoutes.js ─────────────────────────────────────────────────────────────
const taxRouter = express.Router();
const { getTaxes, createTax, updateTax, deleteTax, toggleTax } = require('../controllers/taxDiscountRefundController');

taxRouter.use(protect);
taxRouter.get('/',            getTaxes);
taxRouter.post('/',           authorize('Admin'), createTax);
taxRouter.put('/:id',         authorize('Admin'), updateTax);
taxRouter.delete('/:id',      authorize('Admin'), deleteTax);
taxRouter.patch('/:id/toggle',authorize('Admin'), toggleTax);

// ─── discountRoutes.js ────────────────────────────────────────────────────────
const discountRouter = express.Router();
const { getDiscounts, createDiscount, updateDiscount, deleteDiscount, validateDiscountCode } = require('../controllers/taxDiscountRefundController');

discountRouter.use(protect);
discountRouter.get('/',          getDiscounts);
discountRouter.post('/',         authorize('Admin'), createDiscount);
discountRouter.post('/validate', validateDiscountCode);
discountRouter.put('/:id',       authorize('Admin'), updateDiscount);
discountRouter.delete('/:id',    authorize('Admin'), deleteDiscount);

// ─── refundRoutes.js ──────────────────────────────────────────────────────────
const refundRouter = express.Router();
const { getRefunds, createRefund, updateRefundStatus } = require('../controllers/taxDiscountRefundController');

refundRouter.use(protect, authorize('Admin','Staff'));
refundRouter.get('/',         getRefunds);
refundRouter.post('/',        createRefund);
refundRouter.patch('/:id',    updateRefundStatus);

module.exports = { orderRouter, paymentRouter, inventoryRouter, taxRouter, discountRouter, refundRouter };
