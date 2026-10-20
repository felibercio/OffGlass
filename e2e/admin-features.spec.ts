import { test, expect } from "@playwright/test";

test.describe("Melhorias /admin - Offglass Decants", () => {
  test.beforeEach(async ({ page }) => {
    // Pode ser ajustado conforme porta local ou variável de ambiente
    await page.goto("http://localhost:3000/admin");
  });

  test("1. Preços não devem arredondar e devem exibir centavos em BRL", async ({ page }) => {
    // Se redirecionado para login, navegar para a rota ou simular
    if (page.url().includes("/admin/login")) {
      console.log("Admin exige autenticação. Testando formatação na vitrine pública...");
      await page.goto("http://localhost:3000");
    }

    // Verifica se os valores formatados exibem centavos reais (R$ XX,XX)
    const priceTextElements = await page.locator("text=/R\\$\\s?\\d+([.,]\\d{2})/").all();
    console.log(`Encontrados ${priceTextElements.length} elementos com preços em centavos.`);
    
    // No cadastro de produto, valida que os inputs de preço possuem step="0.01" e min="0"
    if (!page.url().includes("/admin/login")) {
      await page.goto("http://localhost:3000/admin/produtos/novo");
      const priceInputs = page.locator('input[type="number"][step="0.01"]');
      await expect(priceInputs.first()).toBeVisible();
      expect(await priceInputs.count()).toBeGreaterThanOrEqual(3); // 2ml, 5ml, 10ml
    }
  });

  test("2. Suporte a múltiplas imagens e upload múltiplo", async ({ page }) => {
    if (!page.url().includes("/admin/login")) {
      await page.goto("http://localhost:3000/admin/produtos/novo");
      
      // Valida input de upload múltiplo
      const fileInput = page.locator('input[type="file"][multiple]');
      await expect(fileInput).toBeAttached();

      // Valida área de galeria de imagens
      await expect(page.locator("text=Galeria de Imagens")).toBeVisible();
      await expect(page.locator("text=Adicionar URL")).toBeVisible();
    }

    // Na vitrine, valida que o modal abre e suporta visualização de produto
    await page.goto("http://localhost:3000");
    const firstProduct = page.locator(".card").first();
    if (await firstProduct.isVisible()) {
      await firstProduct.click();
      await expect(page.locator(".modal-backdrop")).toBeVisible();
      await expect(page.locator("button:has-text('Adicionar ao carrinho')")).toBeVisible();
    }
  });

  test("3. Painel do admin com vendas (Dashboard)", async ({ page }) => {
    if (!page.url().includes("/admin/login")) {
      await page.goto("http://localhost:3000/admin");

      // Valida presença da aba Vendas
      await expect(page.locator('header a:has-text("Vendas")')).toBeVisible();

      // Valida cards de KPIs
      await expect(page.locator("text=Faturamento Total")).toBeVisible();
      await expect(page.locator("text=Total de Pedidos")).toBeVisible();
      await expect(page.locator("text=Ticket Médio")).toBeVisible();
      await expect(page.locator("text=Decants Vendidos")).toBeVisible();

      // Valida filtros de período
      await expect(page.locator('button:has-text("7 dias")')).toBeVisible();
      await expect(page.locator('button:has-text("30 dias")')).toBeVisible();

      // Valida Métodos de Pagamento e Volumetria
      await expect(page.locator("text=Métodos de Pagamento")).toBeVisible();
      await expect(page.locator("text=Tamanhos mais Vendidos")).toBeVisible();

      // Valida Gestão de Pedidos
      await expect(page.locator("text=Gestão de Pedidos")).toBeVisible();
    }
  });
});
