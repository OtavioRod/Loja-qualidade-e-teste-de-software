# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: aula04.spec.cjs >> acessibilidade: adicionar produto pode receber foco por Tab
- Location: tests\interface\aula04.spec.cjs:14:1

# Error details

```
Error: expect(locator).toBeFocused() failed

Locator:  locator('[data-testid="add-to-cart"][data-product-id="produto-teste"]')
Expected: focused
Received: inactive
Timeout:  5000ms

Call log:
  - Expect "toBeFocused" locator('[data-testid="add-to-cart"][data-product-id="produto-teste"]') with timeout 5000ms
  - waiting for locator('[data-testid="add-to-cart"][data-product-id="produto-teste"]')
    14 × locator resolved to <div data-testid="add-to-cart" class="button button-primary" data-product-id="produto-teste">Adicionar ao carrinho</div>
       - unexpected value "inactive"

```

```yaml
- text: Adicionar ao carrinho
```

# Test source

```ts
  1  | const { test,expect } = require('@playwright/test');
  2  | const AxeBuilder = require('@axe-core/playwright').default;
  3  | test('acessibilidade: cadastro sem violações automatizadas detectadas', async ({page}) => {
  4  |   await page.goto('/#cadastro');
  5  |   await expect(page.locator('#view-register')).toBeVisible();
  6  |   const resultado = await new AxeBuilder({page}).analyze();
  7  |   expect(resultado.violations).toEqual([]);
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
> 20 |   await expect(alvo).toBeFocused();
     |                      ^ Error: expect(locator).toBeFocused() failed
  21 | });
  22 | 
```