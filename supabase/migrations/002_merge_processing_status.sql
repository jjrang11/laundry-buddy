-- Merge 'Washing', 'Drying', and 'Folding / Ironing' into a single 'Processing' status
update public.orders
set status = 'Processing'
where status in ('Washing', 'Drying', 'Folding / Ironing');
