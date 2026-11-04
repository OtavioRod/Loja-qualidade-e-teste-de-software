# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: aula04.spec.cjs >> acessibilidade: cadastro sem violações automatizadas detectadas
- Location: tests\interface\aula04.spec.cjs:3:1

# Error details

```
Error: expect(received).toEqual(expected) // deep equality

- Expected  -  1
+ Received  + 42

- Array []
+ Array [
+   Object {
+     "description": "Ensure all page content is contained by landmarks",
+     "help": "All page content should be contained by landmarks",
+     "helpUrl": "https://dequeuniversity.com/rules/axe/4.14/region?application=playwright",
+     "id": "region",
+     "impact": "moderate",
+     "nodes": Array [
+       Object {
+         "all": Array [],
+         "any": Array [
+           Object {
+             "data": Object {
+               "isIframe": false,
+             },
+             "id": "region",
+             "impact": "moderate",
+             "message": "Some page content is not contained by landmarks",
+             "relatedNodes": Array [],
+           },
+         ],
+         "failureSummary": "Fix any of the following:
+   Some page content is not contained by landmarks",
+         "html": "<img id=\"vlibras-popup\" src=\"https://vlibras.gov.br/app/assets/images/vlibras-popup.webp\" alt=\"Acessível com VLibras\">",
+         "impact": "moderate",
+         "none": Array [],
+         "target": Array [
+           Array [
+             "#vlibras-access-wrapper",
+             "#vlibras-popup",
+           ],
+         ],
+       },
+     ],
+     "tags": Array [
+       "cat.keyboard",
+       "best-practice",
+       "RGAAv4",
+       "RGAA-9.2.1",
+     ],
+   },
+ ]
```

# Page snapshot

```yaml
- generic [active] [ref=e1]:
  - link "Ir para o conteúdo" [ref=e2] [cursor=pointer]:
    - /url: "#conteudo"
  - banner [ref=e3]:
    - link "Loja Aurora" [ref=e4] [cursor=pointer]:
      - /url: "#catalogo"
    - searchbox "Buscar no catálogo" [ref=e6]
    - navigation "Principal" [ref=e7]:
      - link "Catálogo" [ref=e8] [cursor=pointer]:
        - /url: "#catalogo"
      - link "Carrinho 0" [ref=e9] [cursor=pointer]:
        - /url: "#carrinho"
      - link "Pedidos" [ref=e10] [cursor=pointer]:
        - /url: "#pedidos"
      - link "Entrar" [ref=e11] [cursor=pointer]:
        - /url: "#entrar"
  - paragraph [ref=e12]
  - main [ref=e13]:
    - generic [ref=e14]:
      - heading "Cadastro" [level=1] [ref=e15]
      - generic [ref=e16]:
        - generic [ref=e17]:
          - text: Nome
          - textbox "Nome" [ref=e18]
        - generic [ref=e19]:
          - text: E-mail
          - textbox "E-mail" [ref=e20]
        - generic [ref=e21]:
          - text: Senha
          - textbox "Senha" [ref=e22]
        - button "Criar conta" [ref=e23] [cursor=pointer]
        - paragraph [ref=e24]
  - contentinfo [ref=e25]:
    - paragraph [ref=e26]: Loja Aurora — ambiente local com dados fictícios.
  - generic [ref=e27]:
    - img "Acessível com VLibras" [ref=e28]
    - button "Conteúdo acessível em Libras usando o VLibras Widget com opções dos Avatares Ícaro, Hosana ou Guga." [ref=e29] [cursor=pointer]
```

# Test source

```ts
  1  | const { test,expect } = require('@playwright/test');
  2  | const AxeBuilder = require('@axe-core/playwright').default;
  3  | test('acessibilidade: cadastro sem violações automatizadas detectadas', async ({page}) => {
  4  |   await page.goto('/#cadastro');
  5  |   await expect(page.locator('#view-register')).toBeVisible();
  6  |   const resultado = await new AxeBuilder({page}).analyze();
> 7  |   expect(resultado.violations).toEqual([]);
     |                                ^ Error: expect(received).toEqual(expected) // deep equality
  8  | });
  9  | test('acessibilidade: Nome possui rótulo associado', async ({page}) => {
  10 |   await page.goto('/#cadastro');
  11 |   await expect(page.locator('#view-register')).toBeVisible();
  12 |   await expect(page.locator('#register-form').getByLabel('Nome',{exact:true})).toBeVisible();
  13 | });
  14 | test('acessibilidade: adicionar produto pode receber foco por Tab', async ({page}) => {
  15 |   await page.goto('/#catalogo');
  16 |   const alvo = page.locator('[data-testid="add-to-cart"][data-product-id="produto-teste"]');
  17 |   await expect(alvo).toBeVisible();
  18 |   await page.locator('#refresh-catalog').focus();
  19 |   await page.keyboard.press('Tab');
  20 |   await expect(alvo).toBeFocused();
  21 | });
  22 | 
```