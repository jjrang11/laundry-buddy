-- ============================================================
-- Laundry Buddy – Development Seed Data
-- Run AFTER 001_initial_schema.sql
-- ============================================================

insert into public.orders (customer_name, contact_number, order_type, address, weight, price_per_kg, notes, status) values
  ('Maria Santos',    '09171234567', 'pickup', 'Block 3 Lot 5, Sampaguita St',   3.5, 80, 'Handle with care', 'New Order'),
  ('Jose Reyes',      '09281234567', 'walkin', null,                              2.0, 80, null,               'New Order'),
  ('Ana Cruz',        '09391234567', 'pickup', '456 Rizal Ave, Brgy. 7',          5.0, 80, 'Separate whites',  'For Pickup'),
  ('Pedro Gomez',     '09501234567', 'walkin', null,                              1.5, 80, null,               'Arrived at Shop'),
  ('Rosa Dela Cruz',  '09611234567', 'pickup', 'Unit 2B, Marigold Condo',         4.0, 80, 'Ironing needed',   'Processing'),
  ('Carlos Bautista', '09721234567', 'walkin', null,                              3.0, 80, null,               'Processing'),
  ('Elena Mendoza',   '09831234567', 'pickup', '789 Mabini St',                   2.5, 80, 'Fold neatly',      'Ready for Delivery'),
  ('Luis Fernandez',  '09941234567', 'pickup', 'Brgy. Bagong Silang, House 12',   6.0, 80, null,               'Out for Delivery'),
  ('Carmen Ramos',    '09151234567', 'walkin', null,                              1.0, 80, null,               'Completed');
