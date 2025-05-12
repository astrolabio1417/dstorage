CREATE TYPE "public"."types" AS ENUM('FOLDER', 'FILE');--> statement-breakpoint
CREATE TABLE "files" (
	"createdAt" timestamp DEFAULT now() NOT NULL,
	"endRange" integer DEFAULT 0 NOT NULL,
	"id" integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "files_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START WITH 1 CACHE 1),
	"node" integer,
	"size" integer DEFAULT 0 NOT NULL,
	"startRange" integer DEFAULT 0 NOT NULL,
	"url" varchar(255) NOT NULL,
	CONSTRAINT "field__start_range" UNIQUE("node","startRange")
);
--> statement-breakpoint
CREATE TABLE "nodes" (
	"createdAt" timestamp DEFAULT now() NOT NULL,
	"id" integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "nodes_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START WITH 1 CACHE 1),
	"name" varchar(255) NOT NULL,
	"parent" integer,
	"type" "types" DEFAULT 'FOLDER',
	"updatedAt" timestamp
);
--> statement-breakpoint
ALTER TABLE "files" ADD CONSTRAINT "files_node_nodes_id_fk" FOREIGN KEY ("node") REFERENCES "public"."nodes"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "nodes" ADD CONSTRAINT "parent_fk" FOREIGN KEY ("parent") REFERENCES "public"."nodes"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "unique_name_parent_not_null" ON "nodes" USING btree ("name","parent") WHERE "nodes"."parent" IS NOT NULL;--> statement-breakpoint
CREATE UNIQUE INDEX "unique_name_parent_null" ON "nodes" USING btree ("name") WHERE "nodes"."parent" IS NULL;