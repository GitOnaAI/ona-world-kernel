# GDD — Duskfang Prowler (validation feature, Ona game package)

> Status: approved for build — 2026-07-08
> Scope: smallest end-to-end gameplay feature exercising the Ona World method
> (GDD → game-designer discovery → content/sim implementation → gate → playtest).

## 1. Visão do Jogo (recorte)
Uma variação rara de lobo — o **Duskfang Prowler** — aparece ao entardecer nas
matas ao norte de Eastbrook Vale. Reutiliza a família de criaturas de lobo do
kernel com tinting escuro; nenhum asset novo. Dá aos jogadores de nível baixo
um pequeno objetivo de caça com recompensa de vendor.

## 2. Loop de Gameplay
Caçar (explorar as matas do norte) → matar → lootar a **Duskfang Pelt** →
vender ao vendor da cidade. Loop de sessão: 5-10 min. Sem impacto no loop de
progressão além de copper/XP padrão.

## 3. Sistemas (SIS-n)
- SIS-1: Reuso integral — mob AI (wander/aggro/leash), threat, loot e vendor
  existentes. Nenhuma mecânica nova.

## 4. Conteúdo
- 1 mob template: Duskfang Prowler, família wolf (recolor escuro), nível 4-5,
  spawns na região dos lobos ao norte de Eastbrook (zone1), quantidade pequena
  (2-4 spawns), respawn padrão.
- 1 item: Duskfang Pelt — junk/trade white item, vendável (preço coerente com
  a faixa: consultar itens white de nível similar).
- Loot: pelt com chance alta (~60-80%) no Duskfang Prowler apenas.

## 5. Progressão
XP/copper padrão para o nível do mob. Sem itens equipáveis, sem talento, sem
quest (fora de escopo desta validação).

## 6. Requisitos
- RF-1: Duskfang Prowler spawna nos pontos definidos de zone1 e é hostil
  padrão (aggro por proximidade da família wolf).
- RF-2: ao morrer, dropa Duskfang Pelt com a chance definida via tabela de
  loot determinística (Rng seedado).
- RF-3: Duskfang Pelt é vendável em vendor pela faixa de preço definida.
- RNF-1: determinismo intacto (nenhum Math.random/wall-clock; tudo via Rng).
- RNF-2: i18n — nomes via chaves estáveis (en + pt_BR preenchidos).
- RNF-3: zero assets novos em public/ (tint procedural da família wolf).
- RNF-4: testes — cobertura no padrão do repo para mob/item/loot novos.

## 7. Critérios de Playtest
Dado que caminho pelas matas ao norte de Eastbrook ao anoitecer,
Quando encontro e mato um Duskfang Prowler,
Então looto uma Duskfang Pelt e consigo vendê-la ao vendor da cidade —
com o nome correto em pt_BR e sem nenhum erro de console.
