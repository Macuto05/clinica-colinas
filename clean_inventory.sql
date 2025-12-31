-- Clean up Inventory and Procurement Data for fresh testing

-- 1. Clean Stock and Batches
TRUNCATE TABLE "stock_lote" CASCADE;
TRUNCATE TABLE "stock" CASCADE;

-- 2. Clean Movements
TRUNCATE TABLE "movimiento_detalle" CASCADE;
TRUNCATE TABLE "movimiento_inventario" CASCADE;

-- 3. Clean Purchase Orders
TRUNCATE TABLE "pedido_compra_detalle" CASCADE;
TRUNCATE TABLE "pedido_compra" CASCADE;

-- 4. Clean Batches (Lotes) - clearly necessary for a clean "new flow with batches" text
TRUNCATE TABLE "lote" CASCADE;
