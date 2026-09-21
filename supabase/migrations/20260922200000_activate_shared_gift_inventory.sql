-- Empty canonical inventory at first activation; no demo credits are minted.
do $$
begin
 if not public.profile_gift_inventory_is_active_v1() then
  perform public.profile_activate_gift_inventory_v1('android-shared-inventory-20260921','[]'::jsonb);
 end if;
end $$;
