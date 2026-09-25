-- FaultLine weekend schema.
-- All access goes through Next.js server routes using the secret key, so RLS is
-- enabled with no policies: the public (publishable) key can read nothing.

create extension if not exists vector with schema extensions;

-- Live plant state (machines, faults, feed) as one versioned document.
-- Optimistic concurrency on `version` keeps concurrent taps from clobbering each other.
create table public.plant_state (
  id text primary key,
  state jsonb not null,
  version integer not null default 1,
  updated_at timestamptz not null default now()
);

create table public.manuals (
  id uuid primary key default gen_random_uuid(),
  machine_id text not null,
  title text not null,
  storage_path text,
  page_count integer not null default 0,
  created_at timestamptz not null default now()
);
create index manuals_machine_idx on public.manuals (machine_id);

create table public.manual_pages (
  manual_id uuid not null references public.manuals(id) on delete cascade,
  machine_id text not null,
  page integer not null,
  content text not null,
  primary key (manual_id, page)
);
create index manual_pages_machine_page_idx on public.manual_pages (machine_id, page);

create table public.manual_chunks (
  id bigint generated always as identity primary key,
  manual_id uuid not null references public.manuals(id) on delete cascade,
  machine_id text not null,
  page integer not null,
  content text not null,
  embedding extensions.vector(1536) not null
);
create index manual_chunks_machine_idx on public.manual_chunks (machine_id);
create index manual_chunks_embedding_idx on public.manual_chunks
  using hnsw (embedding extensions.vector_cosine_ops);

create or replace function public.match_manual_chunks(
  p_machine_id text,
  p_embedding extensions.vector(1536),
  p_count integer default 8
)
returns table (id bigint, page integer, content text, similarity double precision)
language sql stable
set search_path = public, extensions
as $$
  select c.id, c.page, c.content, 1 - (c.embedding <=> p_embedding) as similarity
  from public.manual_chunks c
  where c.machine_id = p_machine_id
  order by c.embedding <=> p_embedding
  limit least(greatest(p_count, 1), 20);
$$;

alter table public.plant_state enable row level security;
alter table public.manuals enable row level security;
alter table public.manual_pages enable row level security;
alter table public.manual_chunks enable row level security;

revoke all on public.plant_state, public.manuals, public.manual_pages, public.manual_chunks from anon, authenticated;
revoke execute on function public.match_manual_chunks(text, extensions.vector, integer) from public, anon, authenticated;
grant execute on function public.match_manual_chunks(text, extensions.vector, integer) to service_role;

insert into storage.buckets (id, name, public)
values ('manuals', 'manuals', false)
on conflict (id) do nothing;
