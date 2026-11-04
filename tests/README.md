# Exemplos de testes

Os arquivos desta pasta são um ponto de partida. Eles usam o módulo `node:test`, incluído no Node.js, e exercitam as regras de negócio sem abrir o navegador.

Execute na pasta do projeto:

```bash
npm test
```

As funções de domínio ficam em `src/domain` e podem ser importadas diretamente. O cálculo de uma compra passa por `quoteLines` em `src/domain/pricing.js`. O fechamento do pedido passa por `placeOrder` em `src/services/checkout.js`.

Amplie a suíte com novos arquivos `*.test.js`. Casos úteis para explorar:

- limites exatos das regras e os valores imediatamente abaixo e acima;
- quantidades inválidas;
- precisão de centavos;
- cupom inexistente, vencido e de valor diferente do desconto automático;
- fluxo completo de compra, estoque e consulta do pedido gravado;
- repetição imediata da finalização;
- permissões de cliente e de administrador.

Mantenha os testes quando corrigir o sistema. Na aula de regressão, execute a suíte inteira antes e depois da atualização entregue pelo professor.
