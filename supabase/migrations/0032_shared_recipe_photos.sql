-- The recipe-photos bucket is marked "public" (so getPublicUrl() returns an
-- unsigned URL), but that flag doesn't bypass RLS on storage.objects — the
-- existing "members can read" policy still blocks anonymous /share visitors,
-- which is why cover photos didn't render on the public menu-board preview.
-- This adds a second, permissive read policy: a photo is also readable when
-- its household currently has sharing turned on. Photos are stored under
-- <household_id>/<uuid>.<ext>, not per-recipe, so this can only scope to the
-- whole household — fine in practice since filenames are random UUIDs and
-- get_shared_recipes() already limits which URLs are ever handed out.
create policy "recipe-photos: public can read when household is shared"
on storage.objects for select
using (
  bucket_id = 'recipe-photos'
  and exists (
    select 1 from households h
    where h.id = (storage.foldername(name))[1]::uuid
      and h.share_code is not null
  )
);
