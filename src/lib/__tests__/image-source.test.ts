import { test } from "node:test";
import assert from "node:assert/strict";
import { isOptimizableImage, storageRemotePattern } from "../image-source.ts";

const SUPA = "https://abc123.supabase.co";

test("aceita foto do storage público do Supabase", () => {
  assert.equal(isOptimizableImage(`${SUPA}/storage/v1/object/public/gifts/site/a.webp`, SUPA), true);
});

test("recusa link externo, data URL, caminho de outro bucket privado e lixo", () => {
  assert.equal(isOptimizableImage("https://exemplo.com/foto.jpg", SUPA), false);
  assert.equal(isOptimizableImage("data:image/png;base64,AAAA", SUPA), false);
  assert.equal(isOptimizableImage(`${SUPA}/storage/v1/object/sign/x/a.png`, SUPA), false);
  assert.equal(isOptimizableImage("http://abc123.supabase.co/storage/v1/object/public/a.png", SUPA), false);
  assert.equal(isOptimizableImage("não é url", SUPA), false);
  assert.equal(isOptimizableImage(null, SUPA), false);
});

test("sem Supabase configurado nada é otimizado", () => {
  assert.equal(isOptimizableImage(`${SUPA}/storage/v1/object/public/a.png`, undefined), false);
  assert.equal(isOptimizableImage(`${SUPA}/storage/v1/object/public/a.png`, ""), false);
  assert.equal(storageRemotePattern(""), null);
});

test("remotePattern restringe ao caminho público do storage", () => {
  assert.deepEqual(storageRemotePattern(SUPA), {
    protocol: "https",
    hostname: "abc123.supabase.co",
    pathname: "/storage/v1/object/public/**",
  });
});

test("imagens do editor do site: aceita https, data:image e arquivos estáticos do próprio app", async () => {
  const { isAllowedSiteImage } = await import("../image-source.ts");
  for (const ok of [
    "",
    "https://exemplo.com/foto.jpg",
    "HTTPS://exemplo.com/foto.jpg",
    "data:image/webp;base64,AAAA",
    "/images/aceito/img-01-casal-capa.webp",
    "/brand/logo.png",
    "/images/a_b-c.1.JPG",
  ]) {
    assert.equal(isAllowedSiteImage(ok), true, ok);
  }
});

test("imagens do editor do site: recusa esquemas perigosos, hosts sem https e caminhos suspeitos", async () => {
  const { isAllowedSiteImage } = await import("../image-source.ts");
  for (const bad of [
    "javascript:alert(1)",
    "JaVaScRiPt:alert(1)",
    "data:text/html;base64,AAAA",
    "http://exemplo.com/foto.jpg",
    "//evil.com/foto.jpg",
    "/\\evil.com/foto.jpg",
    "/../etc/foto.png",
    "/images/../../foto.png",
    "/images/%2e%2e/foto.png",
    "/images//foto.png",
    "/images/.oculta.png",
    "/images/foto.png?x=1",
    "/images/foto.png#a",
    "/images/foto.html",
    "/images/foto",
    "/api/export/guests",
    "/images/foto.png\n",
    "images/foto.png",
    "ftp://exemplo.com/foto.png",
    "/ images/foto.png",
  ]) {
    assert.equal(isAllowedSiteImage(bad), false, JSON.stringify(bad));
  }
});

test("caminho estático próprio: só dentro do app", async () => {
  const { isOwnStaticImagePath } = await import("../image-source.ts");
  assert.equal(isOwnStaticImagePath("/images/aceito/img-01-casal-capa.webp"), true);
  assert.equal(isOwnStaticImagePath("https://exemplo.com/a.png"), false);
  assert.equal(isOwnStaticImagePath("/"), false);
});
