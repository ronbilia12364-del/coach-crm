-- Create storage bucket for client media
insert into storage.buckets (id, name, public)
values ('client-media', 'client-media', false)
on conflict do nothing;

-- Coach (service role) can do anything
create policy "service role full access" on storage.objects
  for all using (bucket_id = 'client-media');

-- Clients can upload/read their own files
create policy "client upload own" on storage.objects
  for insert with check (
    bucket_id = 'client-media'
    and (storage.foldername(name))[1] = (
      select id::text from public.clients
      where phone = current_setting('request.jwt.claims', true)::json->>'phone'
    )
  );

create policy "client read own" on storage.objects
  for select using (
    bucket_id = 'client-media'
    and (storage.foldername(name))[1] = (
      select id::text from public.clients
      where phone = current_setting('request.jwt.claims', true)::json->>'phone'
    )
  );
