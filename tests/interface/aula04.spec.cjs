const { test,expect } = require('@playwright/test');
const AxeBuilder = require('@axe-core/playwright').default;
test('acessibilidade: cadastro sem violações automatizadas detectadas', async ({page}) => {
  await page.goto('/#cadastro');
  await expect(page.locator('#view-register')).toBeVisible();
  const resultado = await new AxeBuilder({page}).analyze();
  expect(resultado.violations).toEqual([]);
});
test('acessibilidade: Nome possui rótulo associado', async ({page}) => {
  await page.goto('/#cadastro');
  await expect(page.locator('#view-register')).toBeVisible();
  await expect(page.locator('#register-form').getByLabel('Nome',{exact:true})).toBeVisible();
});
test('acessibilidade: adicionar produto pode receber foco por Tab', async ({page}) => {
  await page.goto('/#catalogo');
  const alvo = page.locator('[data-testid="add-to-cart"][data-product-id="produto-teste"]');
  await expect(alvo).toBeVisible();
  await page.locator('#refresh-catalog').focus();
  await page.keyboard.press('Tab');
  await expect(alvo).toBeFocused();
});
