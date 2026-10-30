import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { describe, it } from "node:test";
import ts from "typescript";

const filename = new URL("../components/store/ProductDetail.tsx", import.meta.url);
const source = ts.createSourceFile("ProductDetail.tsx", readFileSync(filename, "utf8"), ts.ScriptTarget.Latest, true, ts.ScriptKind.TSX);

function jsxText(node: ts.JsxAttribute) {
  return node.initializer?.getText(source) ?? "";
}

function galleryButtons(label: string) {
  const result: ts.JsxElement[] = [];
  function visit(node: ts.Node) {
    if (ts.isJsxElement(node) && node.openingElement.tagName.getText(source) === "button") {
      const attributes = node.openingElement.attributes.properties;
      const accessibleName = attributes.find((item) => ts.isJsxAttribute(item) && item.name.getText(source) === "aria-label");
      if (accessibleName && jsxText(accessibleName as ts.JsxAttribute).includes(label)) result.push(node);
    }
    ts.forEachChild(node, visit);
  }
  visit(source);
  return result;
}

function attributes(button: ts.JsxElement) {
  return button.openingElement.attributes.properties.filter(ts.isJsxAttribute);
}

describe("Galería del detalle del producto", () => {
  it("reserva la apertura del visor a la imagen principal", () => {
    const [main] = galleryButtons("Ampliar foto");
    assert.ok(main);
    const click = attributes(main).find((attribute) => attribute.name.getText(source) === "onClick");
    assert.equal(click?.initializer?.getText(source), "{() => openLightbox(activeImage)}");
  });

  it("permite que las miniaturas solo seleccionen la imagen, sin enlaces ni eventos táctiles duplicados", () => {
    const thumbnails = galleryButtons("Mostrar foto");
    assert.equal(thumbnails.length, 1);
    const [button] = thumbnails;
    const props = attributes(button);
    assert.ok(props.some((attribute) => attribute.name.getText(source) === "type" && jsxText(attribute) === '"button"'));
    assert.ok(props.some((attribute) => attribute.name.getText(source) === "aria-pressed"));
    assert.equal(props.find((attribute) => attribute.name.getText(source) === "onClick")?.initializer?.getText(source), "{() => setActiveImage(index)}");
    assert.ok(!props.some((attribute) => ["onTouchEnd", "onPointerUp"].includes(attribute.name.getText(source))));

    for (let parent = button.parent; parent; parent = parent.parent) {
      if (!ts.isJsxElement(parent)) continue;
      const parentProps = parent.openingElement.attributes.properties.filter(ts.isJsxAttribute);
      assert.ok(!["a", "Link"].includes(parent.openingElement.tagName.getText(source)));
      assert.ok(!parentProps.some((attribute) => ["onClick", "onTouchEnd", "onPointerUp"].includes(attribute.name.getText(source))));
    }
  });
});
