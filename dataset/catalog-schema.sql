-- Proposed PostgreSQL storage for the local catalog contract. Not applied/deployed.
-- Keep observations nullable. Import timestamps never become checked_at timestamps.
begin;
create schema if not exists fashion_catalog;
set search_path to fashion_catalog, public;
create table entities (
 id text primary key,
 kind text not null check(kind in ('brand','location','channel')),
 unique(id,kind)
);
create table brands (
 id text primary key,
 entity_kind text not null default 'brand' check(entity_kind='brand'),
 slug text unique not null,
 display_name text not null,
 normalized_name text not null,
 legal_name text,
 category_primary text,
 status text not null default 'uncertain' check(status in ('active','uncertain','inactive','seasonal')),
 signature_flag boolean not null default false,
 short_description text,
 last_reviewed_at timestamptz,
 foreign key(id,entity_kind) references entities(id,kind)
);
create table brand_aliases (
 brand_id text not null references brands(id),
 alias text not null,
 alias_normalized text not null,
 alias_type text not null,
 primary key(brand_id,alias_normalized)
);
create index alias_lookup on brand_aliases(alias_normalized);
create table locations (
 id text primary key,
 entity_kind text not null default 'location' check(entity_kind='location'),
 brand_id text not null references brands(id),
 label text,
 address_raw text,
 address_normalized text,
 city text,
 country_code text,
 district_groups text[] not null default '{}',
 ward text,
 lat numeric(9,6) check(lat between -90 and 90),
 lng numeric(9,6) check(lng between -180 and 180),
 geo_precision text not null default 'unknown' check(geo_precision in ('exact','street','district','unknown')),
 visit_mode text not null check(visit_mode in ('walk_in','appointment','online_only','hub','pop_up','unknown')),
 status text not null default 'uncertain' check(status in ('open','uncertain','opening_soon','closed','seasonal')),
 timezone text not null default 'Asia/Ho_Chi_Minh',
 last_verified_at timestamptz,
 check((lat is null)=(lng is null)),
 foreign key(id,entity_kind) references entities(id,kind)
);
create table channels (
 id text primary key,
 entity_kind text not null default 'channel' check(entity_kind='channel'),
 brand_id text not null references brands(id),
 channel_type text not null,
 url text,
 handle text,
 ships_domestic boolean,
 ships_international boolean,
 cod_available boolean,
 foreign key(id,entity_kind) references entities(id,kind)
);
create table sources (
 id bigint generated always as identity primary key,
 entity_id text not null references entities(id),
 source_type text not null,
 source_url text,
 source_excerpt text,
 captured_at timestamptz
);
create table verification_events (
 id bigint generated always as identity primary key,
 entity_id text not null references entities(id),
 method text not null,
 level text not null check(level in ('verified','likely','unverified','stale')),
 issue_flag text,
 notes text,
 source_id bigint references sources(id),
 checked_at timestamptz,
 logged_at timestamptz not null default now(),
 checked_by text,
 check(level<>'verified' or (checked_at is not null and source_id is not null))
);
create index latest_verification on verification_events(entity_id,checked_at desc nulls last,logged_at desc);
create table location_hours (
 id bigint generated always as identity primary key,
 location_id text not null references locations(id),
 weekday smallint not null check(weekday between 0 and 6),
 opens_at time,
 closes_at time,
 closes_next_day boolean not null default false,
 closed_all_day boolean not null default false,
 source_id bigint not null references sources(id),
 checked_at timestamptz not null,
 note text,
 check((closed_all_day and opens_at is null and closes_at is null) or (not closed_all_day and opens_at is not null and closes_at is not null))
 -- Multiple shifts per weekday are supported. Enforce overlap checks on reviewed import.
);
create table brand_attributes (
 brand_id text primary key references brands(id),
 tier text,
 materials text[] not null default '{}',
 occasions text[] not null default '{}',
 style_tags text[] not null default '{}',
 price_band_min_vnd bigint check(price_band_min_vnd>=0),
 price_band_max_vnd bigint check(price_band_max_vnd>=price_band_min_vnd),
 made_to_order boolean,
 rental_available boolean
);
create table editorial_notes (
 id bigint generated always as identity primary key,
 brand_id text not null references brands(id),
 body text not null,
 source_id bigint references sources(id)
);
create function audit_catalog_edit() returns trigger language plpgsql as $$
begin
 insert into verification_events(entity_id,method,level,notes)
 values(new.id,'catalog_edit','unverified',TG_TABLE_NAME||' '||TG_OP||'; content change requires evidence review.');
 return new;
end; $$;
create trigger brand_edits after insert or update on brands for each row execute function audit_catalog_edit();
create trigger location_edits after insert or update on locations for each row execute function audit_catalog_edit();
create trigger channel_edits after insert or update on channels for each row execute function audit_catalog_edit();
create function immutable_evidence() returns trigger language plpgsql as $$
begin raise exception 'Evidence history is append-only; record a correction event.'; end; $$;
create trigger evidence_history before update or delete on verification_events for each row execute function immutable_evidence();
create function audit_brand_child_edit() returns trigger language plpgsql as $$
begin
 insert into verification_events(entity_id,method,level,notes)
 values(case when TG_OP='DELETE' then old.brand_id else new.brand_id end,
 'catalog_edit','unverified',TG_TABLE_NAME||' '||TG_OP||'; evidence review required.');
 if TG_OP='DELETE' then return old; end if;
 return new;
end; $$;
create trigger alias_edits after insert or update or delete on brand_aliases for each row execute function audit_brand_child_edit();
create trigger attribute_edits after insert or update or delete on brand_attributes for each row execute function audit_brand_child_edit();
create trigger editorial_edits after insert or update or delete on editorial_notes for each row execute function audit_brand_child_edit();
create function audit_hours_edit() returns trigger language plpgsql as $$
begin
 insert into verification_events(entity_id,method,level,notes)
 values(case when TG_OP='DELETE' then old.location_id else new.location_id end,
 'hours_edit','unverified','Schedule changed; review source and current exceptions.');
 if TG_OP='DELETE' then return old; end if;
 return new;
end; $$;
create trigger hours_edits after insert or update or delete on location_hours for each row execute function audit_hours_edit();
create trigger source_history before update or delete on sources for each row execute function immutable_evidence();
-- Saved/compare sets deliberately stay on the visitor's device in the current product.
commit;
