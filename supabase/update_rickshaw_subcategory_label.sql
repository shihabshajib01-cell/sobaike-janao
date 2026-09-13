-- Migration: Update public.subcategories display names for charging-station-location
-- Updates the existing subcategory row to use clean labels without changing id or segment_id.

UPDATE public.subcategories
SET
  name_en = 'Illegal Charging Station',
  name_bn = 'অবৈধ চার্জিং স্টেশন'
WHERE id = 'charging-station-location'
  AND segment_id = 'rickshaw';
