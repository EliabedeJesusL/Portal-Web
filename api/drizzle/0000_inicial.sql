CREATE TYPE "public"."estado_versao" AS ENUM('submetido', 'aprovado', 'reprovado', 'substituida');--> statement-breakpoint
CREATE TABLE "curadores" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"nome" text NOT NULL,
	"token_hash" text NOT NULL,
	"criado_em" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "curadores_token_hash_unique" UNIQUE("token_hash")
);
--> statement-breakpoint
CREATE TABLE "estacoes" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"nome" text NOT NULL,
	"token_hash" text NOT NULL,
	"criado_em" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "estacoes_token_hash_unique" UNIQUE("token_hash")
);
--> statement-breakpoint
CREATE TABLE "jogos" (
	"id" text PRIMARY KEY NOT NULL,
	"nome" text NOT NULL,
	"descricao" text NOT NULL,
	"resumo" text,
	"autores" text[] NOT NULL,
	"controles" text NOT NULL,
	"classico_referencia" text NOT NULL,
	"mecanica" text NOT NULL,
	"tema" text NOT NULL,
	"nivel" text NOT NULL,
	"capa" text NOT NULL,
	"repositorio_url" text NOT NULL,
	"criado_em" timestamp with time zone DEFAULT now() NOT NULL,
	"atualizado_em" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "pacotes" (
	"versao_id" uuid PRIMARY KEY NOT NULL,
	"conteudo" "bytea" NOT NULL
);
--> statement-breakpoint
CREATE TABLE "versoes" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"jogo_id" text NOT NULL,
	"versao" text NOT NULL,
	"estado" "estado_versao" DEFAULT 'submetido' NOT NULL,
	"ref" text NOT NULL,
	"commit_sha" text NOT NULL,
	"tamanho_bytes" integer NOT NULL,
	"sha256" text NOT NULL,
	"manifesto" jsonb NOT NULL,
	"total_questoes" integer NOT NULL,
	"decidido_por" uuid,
	"justificativa" text,
	"submetido_em" timestamp with time zone DEFAULT now() NOT NULL,
	"decidido_em" timestamp with time zone,
	CONSTRAINT "versoes_tamanho_positivo" CHECK ("versoes"."tamanho_bytes" > 0)
);
--> statement-breakpoint
CREATE TABLE "anonimizacoes" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"curador_id" uuid NOT NULL,
	"jogo_id" text,
	"partidas_afetadas" integer NOT NULL,
	"votos_afetados" integer NOT NULL,
	"criado_em" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "partidas" (
	"id_partida" uuid PRIMARY KEY NOT NULL,
	"jogo_id" text NOT NULL,
	"jogador" text NOT NULL,
	"pontos" integer NOT NULL,
	"duracao_s" integer NOT NULL,
	"acertos" integer NOT NULL,
	"erros" integer NOT NULL,
	"tema" text NOT NULL,
	"jogado_em" timestamp with time zone NOT NULL,
	"estacao_id" uuid NOT NULL,
	"recebido_em" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "partidas_jogador_valido" CHECK ("partidas"."jogador" ~ '^[A-Z0-9]{1,9}$'),
	CONSTRAINT "partidas_valores_nao_negativos" CHECK ("partidas"."pontos" >= 0 and "partidas"."duracao_s" >= 0 and "partidas"."acertos" >= 0 and "partidas"."erros" >= 0)
);
--> statement-breakpoint
CREATE TABLE "votos" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"jogo_id" text NOT NULL,
	"jogador" text NOT NULL,
	"id_partida" uuid NOT NULL,
	"nota" smallint NOT NULL,
	"comentario" text,
	"atualizado_em" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "votos_nota_valida" CHECK ("votos"."nota" between 1 and 5),
	CONSTRAINT "votos_jogador_valido" CHECK ("votos"."jogador" ~ '^[A-Z0-9]{1,9}$')
);
--> statement-breakpoint
ALTER TABLE "pacotes" ADD CONSTRAINT "pacotes_versao_id_versoes_id_fk" FOREIGN KEY ("versao_id") REFERENCES "public"."versoes"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "versoes" ADD CONSTRAINT "versoes_jogo_id_jogos_id_fk" FOREIGN KEY ("jogo_id") REFERENCES "public"."jogos"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "versoes" ADD CONSTRAINT "versoes_decidido_por_curadores_id_fk" FOREIGN KEY ("decidido_por") REFERENCES "public"."curadores"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "anonimizacoes" ADD CONSTRAINT "anonimizacoes_curador_id_curadores_id_fk" FOREIGN KEY ("curador_id") REFERENCES "public"."curadores"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "anonimizacoes" ADD CONSTRAINT "anonimizacoes_jogo_id_jogos_id_fk" FOREIGN KEY ("jogo_id") REFERENCES "public"."jogos"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "partidas" ADD CONSTRAINT "partidas_jogo_id_jogos_id_fk" FOREIGN KEY ("jogo_id") REFERENCES "public"."jogos"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "partidas" ADD CONSTRAINT "partidas_estacao_id_estacoes_id_fk" FOREIGN KEY ("estacao_id") REFERENCES "public"."estacoes"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "votos" ADD CONSTRAINT "votos_jogo_id_jogos_id_fk" FOREIGN KEY ("jogo_id") REFERENCES "public"."jogos"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "votos" ADD CONSTRAINT "votos_id_partida_partidas_id_partida_fk" FOREIGN KEY ("id_partida") REFERENCES "public"."partidas"("id_partida") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "versoes_jogo_id_index" ON "versoes" USING btree ("jogo_id");--> statement-breakpoint
CREATE UNIQUE INDEX "versoes_uma_aprovada_por_jogo" ON "versoes" USING btree ("jogo_id") WHERE "versoes"."estado" = 'aprovado';--> statement-breakpoint
CREATE UNIQUE INDEX "versoes_numero_unico_por_jogo" ON "versoes" USING btree ("jogo_id","versao") WHERE "versoes"."estado" <> 'reprovado';--> statement-breakpoint
CREATE INDEX "partidas_jogo_id_jogador_index" ON "partidas" USING btree ("jogo_id","jogador");--> statement-breakpoint
CREATE UNIQUE INDEX "votos_um_por_jogador" ON "votos" USING btree ("jogo_id","jogador") WHERE "votos"."jogador" <> 'ANON';