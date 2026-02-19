-- Create bookmarks table
create table if not exists bookmarks (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users(id) on delete cascade not null,
  title text not null,
  url text not null,
  created_at timestamptz default now() not null
);

-- Enable Row Level Security
alter table bookmarks enable row level security;

-- Policy: users can only see their own bookmarks
create policy "Users can view own bookmarks"
  on bookmarks for select
  using (auth.uid() = user_id);

-- Policy: users can only insert their own bookmarks
create policy "Users can insert own bookmarks"
  on bookmarks for insert
  with check (auth.uid() = user_id);

-- Policy: users can only delete their own bookmarks
create policy "Users can delete own bookmarks"
  on bookmarks for delete
  using (auth.uid() = user_id);

-- Enable realtime for bookmarks table
alter publication supabase_realtime add table bookmarks;
