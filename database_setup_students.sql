-- Create students table
create table public.students (
  id uuid not null default gen_random_uuid (),
  parent_id uuid null,
  section_id uuid null,
  first_name text not null,
  last_name text not null,
  date_of_birth date null,
  student_id text null,
  profile_picture_url text null,
  enrollment_date date null default CURRENT_DATE,
  is_active boolean null default true,
  created_at timestamp with time zone null default now(),
  constraint students_pkey primary key (id),
  constraint students_student_id_key unique (student_id),
  constraint students_parent_id_fkey foreign KEY (parent_id) references user_profiles (id) on delete CASCADE,
  constraint students_section_id_fkey foreign KEY (section_id) references sections (id)
) TABLESPACE pg_default;

create index IF not exists idx_students_parent_active on public.students using btree (parent_id, is_active) TABLESPACE pg_default;

create index IF not exists idx_students_section on public.students using btree (section_id) TABLESPACE pg_default;

create index IF not exists idx_students_parent_active_lookup on public.students using btree (parent_id, is_active) TABLESPACE pg_default
where
  (is_active = true);
