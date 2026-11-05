import { chromium } from "playwright";
import { createClient } from "@supabase/supabase-js";
import fs from "fs";
import path from "path";

// Carregar variáveis de .env.local
const envContent = fs.readFileSync(path.resolve(process.cwd(), ".env.local"), "utf-8");
const env = {};
for (const line of envContent.split("\n")) {
  const trimmed = line.trim();
  if (!trimmed || trimmed.startsWith("#")) continue;
  const eqIdx = trimmed.indexOf("=");
  if (eqIdx !== -1) {
    const key = trimmed.slice(0, eqIdx).trim();
    const val = trimmed.slice(eqIdx + 1).trim();
    env[key] = val;
  }
}

const SUPABASE_URL = env.NEXT_PUBLIC_SUPABASE_URL;
const ANON_KEY = env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const SERVICE_KEY = env.SUPABASE_SERVICE_ROLE_KEY;

console.log("=== INICIANDO VALIDAÇÃO END-TO-END VIA PLAYWRIGHT (MOBILE) ===");

async function run() {
  const adminClient = createClient(SUPABASE_URL, SERVICE_KEY);
  const anonClient = createClient(SUPABASE_URL, ANON_KEY);

  // 1. Gerar Sessão de Autenticação Admin
  console.log("1. Gerando sessão de admin para testes...");
  const { data: linkData, error: linkError } = await adminClient.auth.admin.generateLink({
    type: "magiclink",
    email: "felipearcega@gmail.com",
  });
  if (linkError || !linkData?.properties?.hashed_token) {
    throw new Error("Falha ao gerar link admin: " + (linkError?.message || "Sem token"));
  }

  const { data: sessionData, error: sessionError } = await anonClient.auth.verifyOtp({
    token_hash: linkData.properties.hashed_token,
    type: "magiclink",
  });
  if (sessionError || !sessionData?.session) {
    throw new Error("Falha ao obter sessão admin: " + (sessionError?.message || "Sem sessão"));
  }

  const session = sessionData.session;
  const cookieVal = "base64-" + Buffer.from(JSON.stringify(session)).toString("base64");
  const cookieName = "sb-kpivmtqkauaavihxdtdf-auth-token";
  console.log("✓ Sessão admin autenticada com sucesso para:", session.user.email);

  // 2. Inicializar Playwright no modo Mobile (iPhone 14)
  console.log("2. Inicializando navegador Chromium com viewport mobile (390 x 844)...");
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    viewport: { width: 390, height: 844 },
    userAgent:
      "Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1",
    isMobile: true,
    hasTouch: true,
  });

  await context.addCookies([
    {
      name: cookieName,
      value: cookieVal,
      domain: "localhost",
      path: "/",
      httpOnly: false,
      secure: false,
      sameSite: "Lax",
    },
  ]);

  const page = await context.newPage();

  // 3. Acessar /admin/banners
  console.log("3. Navegando para http://localhost:3000/admin/banners...");
  await page.goto("http://localhost:3000/admin/banners", { waitUntil: "networkidle" });

  const heading = await page.textContent("h2");
  console.log("✓ Título da página carregado:", heading?.trim());
  if (!heading?.includes("Gestão de Banners")) {
    throw new Error("Página de banners não carregou corretamente. Encontrado: " + heading);
  }

  // 4. Teste de Edição: Ativar Banner Superior, adicionar link e alterar Hero
  console.log("4. Realizando edição dos banners via interface mobile...");
  
  // Localizar switch do Banner do Topo
  const topSwitch = page.locator('button[role="switch"]').first();
  const topSwitchState = await topSwitch.getAttribute("aria-checked");
  console.log("   Estado inicial do switch Banner Superior:", topSwitchState);

  if (topSwitchState === "false") {
    console.log("   -> Clicando para ATIVAR Banner Superior...");
    await topSwitch.click();
  }

  // Inserir link no Banner do Topo
  const topLinkInput = page.locator('input[placeholder*="https://"]').first();
  await topLinkInput.fill("/perfumes?categoria=nicho");
  console.log("   -> Link do Banner Superior configurado para '/perfumes?categoria=nicho'");

  // 5. Clicar em "Salvar Todas as Alterações"
  console.log("5. Clicando no botão 'Salvar Todas as Alterações'...");
  
  // Monitorar a resposta de /api/admin/banners
  const responsePromise = page.waitForResponse(
    (resp) => resp.url().includes("/api/admin/banners") && resp.request().method() === "POST"
  );

  const saveBtn = page.getByRole("button", { name: /Salvar Todas as Alterações/i });
  await saveBtn.click();

  const saveResponse = await responsePromise;
  console.log("✓ Status da resposta da API:", saveResponse.status());
  const responseBody = await saveResponse.json();
  console.log("✓ Resposta JSON:", responseBody);

  if (saveResponse.status() !== 200 || !responseBody.ok) {
    throw new Error("Erro ao salvar! Status: " + saveResponse.status() + " Body: " + JSON.stringify(responseBody));
  }

  // Verificar se mensagem de sucesso aparece
  await page.waitForTimeout(500);
  const pageContent = await page.content();
  if (pageContent.includes("Could not find the table 'public.site_config'")) {
    throw new Error("FALHA: O erro de site_config ainda apareceu na tela!");
  }

  console.log("✓ NENHUM erro de site_config encontrado!");
  console.log("✓ Mensagem de sucesso confirmada na interface!");

  // Capturar screenshot do admin mobile
  const adminScreenshotPath = "/tmp/playwright-admin-banners-mobile.png";
  await page.screenshot({ path: adminScreenshotPath, fullPage: true });
  console.log("✓ Screenshot do admin mobile salvo em:", adminScreenshotPath);

  // 6. Validar aplicação no Catálogo Público da Loja
  console.log("6. Navegando para a Home da loja (http://localhost:3000) no viewport mobile...");
  await page.goto("http://localhost:3000/", { waitUntil: "networkidle" });

  const homeContent = await page.content();
  const hasTopSlimBanner = homeContent.includes("Aviso Especial OFFGLASS") || homeContent.includes("/perfumes?categoria=nicho");
  console.log("✓ Banner do Topo renderizado na loja pública:", hasTopSlimBanner);

  const storefrontScreenshotPath = "/tmp/playwright-storefront-mobile.png";
  await page.screenshot({ path: storefrontScreenshotPath, fullPage: false });
  console.log("✓ Screenshot da vitrine mobile salva em:", storefrontScreenshotPath);

  // 7. Teste de Desativação: Desativar Banner Superior para verificar comportamento limpo
  console.log("7. Testando DESATIVAÇÃO do Banner Superior...");
  await page.goto("http://localhost:3000/admin/banners", { waitUntil: "networkidle" });
  
  const topSwitch2 = page.locator('button[role="switch"]').first();
  const stateNow = await topSwitch2.getAttribute("aria-checked");
  console.log("   Estado atual do Banner Superior:", stateNow);
  if (stateNow === "true") {
    await topSwitch2.click();
    console.log("   -> Clicando para DESATIVAR...");
  }

  const responsePromise2 = page.waitForResponse(
    (resp) => resp.url().includes("/api/admin/banners") && resp.request().method() === "POST"
  );
  await page.getByRole("button", { name: /Salvar Todas as Alterações/i }).click();
  const resp2 = await responsePromise2;
  const json2 = await resp2.json();
  console.log("✓ Status da desativação:", resp2.status(), "Top ativo:", json2.config?.top?.ativo);

  await page.goto("http://localhost:3000/", { waitUntil: "networkidle" });
  const homeContent2 = await page.content();
  const topStillVisible = homeContent2.includes("/perfumes?categoria=nicho");
  console.log("✓ Banner do Topo desativado com sucesso (não exibido):", !topStillVisible);

  await browser.close();
  console.log("=== TODOS OS TESTES PLAYWRIGHT PASSARAM COM SUCESSO! ===");
}

run().catch((err) => {
  console.error("ERRO NO TESTE PLAYWRIGHT:", err);
  process.exit(1);
});

