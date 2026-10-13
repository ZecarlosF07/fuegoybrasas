-- H3: referencia versionada. No confirma modalidades pendientes de PT-05.
begin;
set local role app_owner;
insert into public.categories(id,slug,name,sort_order,active) values
('11111111-1111-4111-8111-000000000001','promociones','Promociones',0,true),
('11111111-1111-4111-8111-000000000002','pollo-a-la-brasa','Pollo a la brasa',1,true),
('11111111-1111-4111-8111-000000000003','mostritos','Mostritos',2,true),
('11111111-1111-4111-8111-000000000004','alitas','Alitas',3,true),
('11111111-1111-4111-8111-000000000005','platos-criollos','Platos criollos',4,true),
('11111111-1111-4111-8111-000000000006','chicharron-de-pollo','Chicharrón de pollo',5,true),
('11111111-1111-4111-8111-000000000007','clasicos','Clásicos',6,true)
on conflict(id) do nothing;
insert into public.catalog_items(id,source_ref,category_id,slug,name,kind,portion_label,inclusions,source_price_cents,sort_order,online_enabled,publication_status) values
('22222222-2222-4222-8222-000000000001','C01','11111111-1111-4111-8111-000000000002','cuarto-pollo-mesa','Pollo a la brasa','regular','¼ de pollo — para mesa',array['Papas fritas','Cremas']::text[],1000,0,false,'draft'),
('22222222-2222-4222-8222-000000000002','C02','11111111-1111-4111-8111-000000000002','cuarto-pollo-para-llevar','Pollo a la brasa','regular','¼ de pollo — para llevar',array['Papas fritas','Cremas']::text[],1390,1,false,'draft'),
('22222222-2222-4222-8222-000000000003','C03','11111111-1111-4111-8111-000000000002','medio-pollo-a-la-brasa','Pollo a la brasa','regular','½ pollo',array['Papas fritas','Cremas']::text[],3290,2,false,'draft'),
('22222222-2222-4222-8222-000000000004','C04','11111111-1111-4111-8111-000000000002','pollo-entero-a-la-brasa','Pollo a la brasa','regular','Pollo entero',array['Papas fritas','Cremas']::text[],5990,3,false,'draft'),
('22222222-2222-4222-8222-000000000005','C05','11111111-1111-4111-8111-000000000007','salchipapa','Salchipapa','regular',null,array[]::text[],1000,4,false,'draft'),
('22222222-2222-4222-8222-000000000006','C06','11111111-1111-4111-8111-000000000007','broaster','Broaster','regular',null,array[]::text[],1000,5,false,'draft'),
('22222222-2222-4222-8222-000000000007','C07','11111111-1111-4111-8111-000000000004','alitas-clasicas','Alitas clásicas','regular','4 alitas',array['Papas fritas']::text[],1500,6,false,'draft'),
('22222222-2222-4222-8222-000000000008','C08','11111111-1111-4111-8111-000000000004','alitas-dulces','Alitas dulces','regular','4 alitas',array['Papas fritas']::text[],1500,7,false,'draft'),
('22222222-2222-4222-8222-000000000009','C09','11111111-1111-4111-8111-000000000004','alitas-picantes','Alitas picantes','regular','4 alitas',array['Papas fritas']::text[],1500,8,false,'draft'),
('22222222-2222-4222-8222-000000000010','C10','11111111-1111-4111-8111-000000000004','alitas-acevichadas','Alitas acevichadas','regular','4 alitas',array['Papas fritas']::text[],1500,9,false,'draft'),
('22222222-2222-4222-8222-000000000011','C11','11111111-1111-4111-8111-000000000004','alitas-maracuya','Alitas en salsa de maracuyá','regular','4 alitas',array['Papas fritas']::text[],1500,10,false,'draft'),
('22222222-2222-4222-8222-000000000012','C12','11111111-1111-4111-8111-000000000005','lomo-saltado','Lomo saltado','regular',null,array[]::text[],1500,11,false,'draft'),
('22222222-2222-4222-8222-000000000013','C13','11111111-1111-4111-8111-000000000005','tallarin-saltado','Tallarín saltado','regular',null,array[]::text[],1500,12,false,'draft'),
('22222222-2222-4222-8222-000000000014','C14','11111111-1111-4111-8111-000000000005','chaufa-pollo','Chaufa de pollo','regular',null,array[]::text[],1400,13,false,'draft'),
('22222222-2222-4222-8222-000000000015','C15','11111111-1111-4111-8111-000000000005','chaufa-carne','Chaufa de carne','regular',null,array[]::text[],1600,14,false,'draft'),
('22222222-2222-4222-8222-000000000016','C16','11111111-1111-4111-8111-000000000005','mollejitas','Mollejitas','regular',null,array[]::text[],1500,15,false,'draft'),
('22222222-2222-4222-8222-000000000017','C17','11111111-1111-4111-8111-000000000005','caldo-gallina','Caldo de gallina','regular',null,array[]::text[],1200,16,false,'draft'),
('22222222-2222-4222-8222-000000000018','C18','11111111-1111-4111-8111-000000000006','chicharron-cuarto-pollo','Chicharrón de pollo','regular','¼ de pollo',array[]::text[],1990,17,false,'draft'),
('22222222-2222-4222-8222-000000000019','C19','11111111-1111-4111-8111-000000000006','chicharron-medio-pollo','Chicharrón de pollo','regular','½ pollo',array[]::text[],3290,18,false,'draft'),
('22222222-2222-4222-8222-000000000020','C20','11111111-1111-4111-8111-000000000006','chicharron-pollo-entero','Chicharrón de pollo','regular','Pollo entero',array[]::text[],5990,19,false,'draft'),
('22222222-2222-4222-8222-000000000021','C21','11111111-1111-4111-8111-000000000003','mostrito-octavo-pollo','Mostrito','regular','⅛ de pollo',array[]::text[],1500,20,false,'draft'),
('22222222-2222-4222-8222-000000000022','C22','11111111-1111-4111-8111-000000000003','mostrito-cuarto-pollo','Mostrito','regular','¼ de pollo',array[]::text[],2000,21,false,'draft'),
('22222222-2222-4222-8222-000000000023','C23','11111111-1111-4111-8111-000000000003','mostrito-medio-pollo','Mostrito','regular','½ pollo',array[]::text[],3690,22,false,'draft'),
('22222222-2222-4222-8222-000000000024','C24','11111111-1111-4111-8111-000000000003','mostrito-pollo-entero','Mostrito','regular','Pollo entero',array[]::text[],6990,23,false,'draft'),
('22222222-2222-4222-8222-000000000101','P01','11111111-1111-4111-8111-000000000001','promo-mostrito','Mostrito','promotion','⅛ de pollo a la brasa',array['Chaufa','Papas fritas','Ensalada']::text[],1490,24,false,'draft'),
('22222222-2222-4222-8222-000000000102','P02','11111111-1111-4111-8111-000000000001','promo-pollo-entero','Pollo entero a la brasa','promotion','Pollo entero',array['Papas fritas','Ensalada','Cremas']::text[],4490,25,false,'draft'),
('22222222-2222-4222-8222-000000000103','P03','11111111-1111-4111-8111-000000000001','ronda-alitas','Ronda de alitas','promotion','16 alitas',array['Papas familiares','Ensalada','Cremas']::text[],4490,26,false,'draft'),
('22222222-2222-4222-8222-000000000104','P04','11111111-1111-4111-8111-000000000001','combo-mostrito','Combo Mostrito','promotion','Pollo entero',array['Papas fritas','Arroz chaufa','Ensalada','Cremas','Gaseosa de 1.5 L']::text[],5990,27,false,'draft'),
('22222222-2222-4222-8222-000000000105','P05','11111111-1111-4111-8111-000000000001','gran-promocion','Gran Promoción','promotion','Pollo entero + ½ pollo',array['Papas fritas','Arroz chaufa','Ensalada','Cremas','Gaseosa de 1.5 L']::text[],8990,28,true,'published')
on conflict(id) do nothing;
insert into public.catalog_prices(id,item_id,mode,price_cents,verified) values
('33333333-3333-4333-8333-000000000001','22222222-2222-4222-8222-000000000001','dine_in',1000,true),
('33333333-3333-4333-8333-000000000105','22222222-2222-4222-8222-000000000105','delivery',8990,true)
on conflict(item_id,mode) do nothing;
insert into public.promotions(item_id,enabled,previous_price_cents,comparison_verified)
select id,true,case when source_ref='P05' then 11000 else null end,source_ref='P05'
from public.catalog_items where source_ref in ('P01','P02','P03','P04','P05')
on conflict(item_id) do nothing;
reset role;
commit;

