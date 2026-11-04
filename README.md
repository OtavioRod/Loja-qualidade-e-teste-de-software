# Loja Aurora

Loja virtual local para as práticas de Gestão da Qualidade e Teste de Software. O navegador usa HTML, CSS e JavaScript. O servidor é Node.js, sem dependências externas, e grava os dados em um arquivo JSON nesta máquina.

Compare o comportamento do sistema com [REQUISITOS.md](REQUISITOS.md). Quando um teste falhar, corrija o código e conserve o teste para as aulas seguintes.

## Preparação

1. Instale o Node.js 18 ou superior: <https://nodejs.org/>
2. Abra esta pasta no VS Code.
3. No terminal, cada dupla redefine a base e inicia o servidor:

```bash
npm run reset
npm start
```

4. Acesse <http://127.0.0.1:3000>

Não é necessário executar `npm install`.

Para encerrar o servidor, use Ctrl+C no terminal.

Se a porta 3000 estiver ocupada, inicie com outra porta:

```bash
# Windows PowerShell
$env:PORT=3001; npm start
```

## Reset

`npm run reset` recria `data/db.json` a partir somente de `data/dataset_loja_6000.json`. O mesmo comando está disponível como `npm run seed` e `npm run restore`.

Pare o servidor antes de executar o reset e inicie-o de novo depois. Cada execução substitui a base didática inteira, inclusive cadastros e pedidos feitos em aula, e volta aos mesmos identificadores, estoques e pedidos. Rodar o comando outra vez não duplica registros.

O reset não altera `dataset_loja_6000.json` e não grava arquivos fora da pasta da loja. Os arquivos separados de produtos, clientes, cupons e pedidos não são importados junto com o JSON consolidado.

O estoque gravado é o do dataset. Os pedidos históricos não descontam esse estoque de novo.

## Contas locais

A senha abaixo existe só para estas três contas. Ela não aparece na interface.

| E-mail | Senha | Perfil |
| --- | --- | --- |
| cliente-a@loja.test | SenhaDidatica123! | cliente |
| cliente-b@loja.test | SenhaDidatica123! | cliente |
| admin@loja.test | SenhaDidatica123! | administrador |

As demais contas do dataset não usam essa senha. Contas marcadas como inativas não entram.

## Fixtures

- `produto-teste`: R$ 150,00 e estoque 5.
- `pedido-cliente-b`: pedido do `cliente-b`.
- `ANTIGO`: 20%, vencido em 06/10/2026.
- `VINTE`: 20%, válido até 31/12/2026.
- `CINCO`: 5%, válido até 31/12/2026.

Nos testes de validade de cupom, fixe o relógio em `2026-10-07T15:00:00.000Z` com `setClock` de `src/domain/clock.js`.

## Dataset e diferenças de schema

O arquivo consolidado guarda valores em centavos inteiros e itens de pedido em lista própria. A loja converte o preço para reais na interface e mantém os centavos originais. Os identificadores são preservados.

| Dataset | Loja |
| --- | --- |
| produtos.nome, precoCentavos, estoque, ativo | products.name, price e priceCents, stock, active |
| clientes.papel (`cliente` ou `admin`) | users.role (`customer` ou `admin`) |
| cupons.codigo, percentual, validade | coupons.code, type `percent`, value, expiresAt |
| pedidos.clienteId, itensPedido | orders.userId e orders.items |
| endereco.logradouro, numero, bairro, cidade, uf, cep | address.street, number, district, city, state, zip |

O catálogo público lista apenas produtos ativos. O frete e os totais dos pedidos importados permanecem os do dataset, em que o frete cobrado é de R$ 20,00. Novas cotações seguem as regras descritas em REQUISITOS.md.

## Testes

```bash
npm test
```

A pasta `tests` traz exemplos com `node:test`. O guia para ampliá-los está em [tests/README.md](tests/README.md). As regras de negócio ficam em `src/domain` e podem ser testadas sem abrir a interface.

## Volume para a prática de desempenho

O comando abaixo recria a base com o catálogo inicial, os pedidos iniciais e um volume adicional reproduzível:

```bash
npm run generate -- --products 4000 --orders 2000
```

Os dois números podem ser alterados. Reinicie o servidor depois de gerar os dados. Ao terminar a prática, cada dupla executa `npm run reset` para voltar aos mesmos dados.

## Organização

- `public` — interface
- `src/domain` — regras de negócio
- `src/services` — fechamento e histórico
- `src/persistence` — leitura e gravação da base
- `src/routes` — API HTTP
- `data` — dados fictícios e a base usada em execução
- `tests` — testes automatizados
