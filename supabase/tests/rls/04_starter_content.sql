-- Integrity of supabase/content (starter content must be usable end to end).
do $$
declare
  v int;
begin
  select count(*) into v from public.journey_stages s
  where not exists (select 1 from public.journey_modules m where m.stage_id = s.id);
  if v > 0 then raise exception 'FAILED: % stages without modules', v; end if;
  raise notice 'ok - every stage has modules';

  select count(*) into v from public.journey_modules m
  left join public.devotionals d on d.id = m.devotional_id
  left join public.plans p on p.id = m.plan_id
  where (m.kind = 'devotional' and not coalesce(d.is_published, false))
     or (m.kind = 'plan' and not coalesce(p.is_published, false));
  if v > 0 then raise exception 'FAILED: % modules point to unpublished content', v; end if;
  raise notice 'ok - every module points to published content';

  select count(*) into v from public.plans p
  where p.is_published and (
    (select count(*) from public.plan_days d where d.plan_id = p.id) = 0
    or (select max(day_number) from public.plan_days d where d.plan_id = p.id)
       <> (select count(*) from public.plan_days d where d.plan_id = p.id));
  if v > 0 then raise exception 'FAILED: % plans with missing or non-consecutive days', v; end if;
  raise notice 'ok - published plans have consecutive days';
end $$;
