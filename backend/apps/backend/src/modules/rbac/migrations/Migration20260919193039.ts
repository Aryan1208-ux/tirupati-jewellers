import { Migration } from "@medusajs/framework/mikro-orm/migrations";

export class Migration20260919193039 extends Migration {

  override async up(): Promise<void> {
    this.addSql(`alter table if exists "rbac_role" drop constraint if exists "rbac_role_code_unique";`);
    this.addSql(`alter table if exists "rbac_permission" drop constraint if exists "rbac_permission_code_unique";`);
    this.addSql(`create table if not exists "rbac_permission" ("id" text not null, "code" text not null, "name" text not null, "description" text null, "module" text null, "action" text null, "created_at" timestamptz not null default now(), "updated_at" timestamptz not null default now(), "deleted_at" timestamptz null, constraint "rbac_permission_pkey" primary key ("id"));`);
    this.addSql(`CREATE UNIQUE INDEX IF NOT EXISTS "IDX_rbac_permission_code_unique" ON "rbac_permission" ("code") WHERE deleted_at IS NULL;`);
    this.addSql(`CREATE INDEX IF NOT EXISTS "IDX_rbac_permission_deleted_at" ON "rbac_permission" ("deleted_at") WHERE deleted_at IS NULL;`);

    this.addSql(`create table if not exists "rbac_role" ("id" text not null, "name" text not null, "code" text not null, "description" text null, "is_system_role" boolean not null default false, "created_at" timestamptz not null default now(), "updated_at" timestamptz not null default now(), "deleted_at" timestamptz null, constraint "rbac_role_pkey" primary key ("id"));`);
    this.addSql(`CREATE UNIQUE INDEX IF NOT EXISTS "IDX_rbac_role_code_unique" ON "rbac_role" ("code") WHERE deleted_at IS NULL;`);
    this.addSql(`CREATE INDEX IF NOT EXISTS "IDX_rbac_role_deleted_at" ON "rbac_role" ("deleted_at") WHERE deleted_at IS NULL;`);

    this.addSql(`create table if not exists "rbac_role_permission" ("id" text not null, "role_id" text not null, "permission_id" text not null, "created_at" timestamptz not null default now(), "updated_at" timestamptz not null default now(), "deleted_at" timestamptz null, constraint "rbac_role_permission_pkey" primary key ("id"));`);
    this.addSql(`CREATE INDEX IF NOT EXISTS "IDX_rbac_role_permission_role_id" ON "rbac_role_permission" ("role_id") WHERE deleted_at IS NULL;`);
    this.addSql(`CREATE INDEX IF NOT EXISTS "IDX_rbac_role_permission_permission_id" ON "rbac_role_permission" ("permission_id") WHERE deleted_at IS NULL;`);
    this.addSql(`CREATE INDEX IF NOT EXISTS "IDX_rbac_role_permission_deleted_at" ON "rbac_role_permission" ("deleted_at") WHERE deleted_at IS NULL;`);

    this.addSql(`create table if not exists "rbac_user_role" ("id" text not null, "user_id" text not null, "role_id" text not null, "created_at" timestamptz not null default now(), "updated_at" timestamptz not null default now(), "deleted_at" timestamptz null, constraint "rbac_user_role_pkey" primary key ("id"));`);
    this.addSql(`CREATE INDEX IF NOT EXISTS "IDX_rbac_user_role_role_id" ON "rbac_user_role" ("role_id") WHERE deleted_at IS NULL;`);
    this.addSql(`CREATE INDEX IF NOT EXISTS "IDX_rbac_user_role_deleted_at" ON "rbac_user_role" ("deleted_at") WHERE deleted_at IS NULL;`);

    this.addSql(`alter table if exists "rbac_role_permission" add constraint "rbac_role_permission_role_id_foreign" foreign key ("role_id") references "rbac_role" ("id") on update cascade;`);
    this.addSql(`alter table if exists "rbac_role_permission" add constraint "rbac_role_permission_permission_id_foreign" foreign key ("permission_id") references "rbac_permission" ("id") on update cascade;`);

    this.addSql(`alter table if exists "rbac_user_role" add constraint "rbac_user_role_role_id_foreign" foreign key ("role_id") references "rbac_role" ("id") on update cascade;`);
  }

  override async down(): Promise<void> {
    this.addSql(`alter table if exists "rbac_role_permission" drop constraint if exists "rbac_role_permission_permission_id_foreign";`);

    this.addSql(`alter table if exists "rbac_role_permission" drop constraint if exists "rbac_role_permission_role_id_foreign";`);

    this.addSql(`alter table if exists "rbac_user_role" drop constraint if exists "rbac_user_role_role_id_foreign";`);

    this.addSql(`drop table if exists "rbac_permission" cascade;`);

    this.addSql(`drop table if exists "rbac_role" cascade;`);

    this.addSql(`drop table if exists "rbac_role_permission" cascade;`);

    this.addSql(`drop table if exists "rbac_user_role" cascade;`);
  }

}
