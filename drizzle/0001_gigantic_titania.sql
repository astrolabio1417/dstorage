CREATE TABLE "tokens" (
	"createdAt" timestamp DEFAULT now(),
	"id" integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "tokens_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START WITH 1 CACHE 1),
	"token" varchar(255) NOT NULL,
	CONSTRAINT "tokens_token_unique" UNIQUE("token")
);
