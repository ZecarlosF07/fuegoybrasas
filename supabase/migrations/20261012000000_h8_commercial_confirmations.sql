-- H8: confirmaciones del propietario. Los estimados siguen sin verificar.
begin;
set local role app_owner;
select id from public.business_settings where id=1 for update;
update public.business_settings set
  address='Fuego y Brasas — ubicación confirmada en Google Maps (-14.04883, -75.70694)',
  maps_url='https://www.google.com/maps/dir/?api=1&destination=-14.04883%2C-75.70694',
  location_verified=true,
  opening_periods=(select jsonb_agg(jsonb_build_object('day',day,'opensAt','12:00','closesAt','23:00','closesNextDay',false) order by day) from generate_series(1,7) day),
  schedule_confirmed=false
where id=1;

insert into public.payment_methods(code,label,needs_change,enabled,verified,sort_order) values
  ('cash','Efectivo',true,false,false,0),
  ('yape','Yape',false,false,false,1),
  ('plin','Plin',false,false,false,2)
on conflict(code) do nothing;

update public.catalog_items set inclusions=array['Arroz chaufa','Papas fritas','Ensalada']::text[]
where source_ref in ('C21','C22','C23','C24') and deleted_at is null and not content_verified;

-- El trigger invalida la verificación al cambiar contenido: confirmar después.
insert into public.catalog_prices(item_id,mode,price_cents,verified)
select i.id,m.mode,i.source_price_cents,true from public.catalog_items i
cross join (values ('pickup'),('delivery')) m(mode)
where i.source_ref in ('C02','C03','C04','C07','C08','C09','C10','C11','C21','C22','C23','C24','P01','P02','P03','P04')
  and i.deleted_at is null
on conflict(item_id,mode) do nothing;

update public.catalog_items set online_enabled=true,content_verified=true,publication_status='published'
where source_ref in ('C02','C03','C04','C07','C08','C09','C10','C11','C21','C22','C23','C24','P01','P02','P03','P04')
  and deleted_at is null and publication_status='draft';
-- C01 sigue fuera de web; P05 solo delivery. No se inventan porciones ni inclusiones faltantes.
-- Costo del premio, flags, cargos y aprobaciones del programa no se modifican.
reset role;
commit;
