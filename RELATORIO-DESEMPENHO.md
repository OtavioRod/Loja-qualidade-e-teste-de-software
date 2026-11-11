# Relatório de Testes de Carga e Estresse

**Data:** 10/11/2026  
**Projeto:** Loja Aurora  
**Resultado geral:** critérios atendidos nas etapas executadas; limite de capacidade não determinado.

## 1. Ambiente e funcionalidade testada

- Sistema: Windows; Node.js v24.16.0.
- Aplicação iniciada localmente em `http://127.0.0.1:3000`.
- Funcionalidade: consulta do catálogo, visualização de detalhes e cotação de um item no carrinho.
- Perfil das jornadas: 60% consulta ao catálogo, 30% consulta seguida de detalhe do produto e 10% consulta, detalhe e cotação.
- Dados: catálogo fictício da loja; não houve login, checkout, alteração de estoque ou gravação de pedidos.
- Destino de teste: loopback local; o script recusa destinos externos.

## 2. Objetivo e critérios definidos antes da execução

Verificar o atendimento sob carga progressiva e observar degradação e recuperação quando a demanda aumenta e depois diminui.

Critérios ilustrativos adotados antes da rodada:

- p95 de resposta menor ou igual a 2.000 ms.
- Taxa de falhas técnicas menor que 1%.
- Respostas de catálogo, detalhe e cotação com estrutura e conteúdo esperados.
- Na recuperação, p95 dentro do limite de 2.000 ms e falhas abaixo de 1%.

## 3. Roteiro utilizado

Script: [`scripts/performance.js`](./scripts/performance.js). Cada etapa durou 5 segundos, com pausa de 100 ms entre ações.

```powershell
npm run test:load -- --stage-seconds 5 --think-time-ms 100
npm run test:stress -- --stage-seconds 5 --think-time-ms 100
```

O teste de carga usou 5, 10 e 20 usuários virtuais. O teste de estresse usou 10, 20, 40 e 60 usuários, seguido de redução para 10.

## 4. Resultados por etapa

| Cenário | Etapa | Usuários virtuais | Duração | Requisições | p50 | p95 | Vazão | Falhas | Critério |
|---|---:|---:|---:|---:|---:|---:|---:|---:|---|
| Carga | 1 | 5 | 5,0 s | 240 | 4,6 ms | 10,4 ms | 47,6 req/s | 0,00% | Atende |
| Carga | 2 | 10 | 5,1 s | 480 | 4,7 ms | 14,3 ms | 94,1 req/s | 0,00% | Atende |
| Carga | 3 | 20 | 5,1 s | 950 | 5,1 ms | 14,3 ms | 186,4 req/s | 0,00% | Atende |
| Estresse | 1 | 10 | 5,1 s | 479 | 4,8 ms | 14,5 ms | 94,0 req/s | 0,00% | Atende |
| Estresse | 2 | 20 | 5,1 s | 957 | 4,3 ms | 12,7 ms | 187,7 req/s | 0,00% | Atende |
| Estresse | 3 | 40 | 5,1 s | 1.800 | 11,0 ms | 36,6 ms | 351,8 req/s | 0,00% | Atende |
| Estresse | 4 | 60 | 5,1 s | 2.101 | 46,4 ms | 80,3 ms | 412,1 req/s | 0,00% | Atende |
| Recuperação | 5 | 10 | 5,1 s | 482 | 4,0 ms | 12,6 ms | 94,8 req/s | 0,00% | Atende |

**Evidência:** saída de `test:load` e `test:stress` do Node.js. Todas as respostas verificadas foram válidas; não foram observadas falhas técnicas. A suíte automatizada `npm test` também passou: 25 testes, 0 falhas.

## 5. Análise de degradação e recuperação

Na carga, o aumento de 5 para 20 usuários elevou a vazão de 47,6 para 186,4 req/s, enquanto o p95 permaneceu em até 14,3 ms. No estresse, de 20 para 40 usuários a vazão cresceu de 187,7 para 351,8 req/s; de 40 para 60, cresceu para 412,1 req/s, enquanto o p95 subiu de 36,6 para 80,3 ms. Há aumento de latência e crescimento menos proporcional da vazão nas etapas maiores, sinais para continuar investigando; os dados não demonstram saturação nem falha.

Após reduzir de 60 para 10 usuários, o p95 caiu para 12,6 ms e a vazão foi de 94,8 req/s, próxima dos 94,0 req/s da etapa inicial de 10 usuários. A recuperação atendeu aos critérios definidos.

Os resultados representam uma execução curta em ambiente local. Não foram coletadas métricas de CPU, memória ou atraso do event loop; portanto, não identificam a causa do aumento de latência nem comprovam capacidade de produção.

## 6. Proposta de melhoria fundamentada

Antes de alterar o sistema, repetir as etapas de 40 e 60 usuários por mais tempo e em pelo menos três rodadas, registrando CPU, memória e atraso do event loop. Comparar essas medidas com a latência do catálogo, que é consultado em toda jornada. Isso permitirá verificar se o crescimento de p95 e a desaceleração da vazão se repetem e localizar o recurso limitante. Só então priorizar uma otimização e repetir o mesmo roteiro para comparar resultados.

## Limitações

O limite de capacidade não foi encontrado: a etapa mais alta planejada (60 usuários) permaneceu dentro dos critérios. Os números são específicos desta máquina, deste dataset e desta duração de teste. Os limites de aprovação são didáticos e devem ser substituídos pelos requisitos do ambiente-alvo.
