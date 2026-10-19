// Загрузка контракта и валидация ответов по схемам (ADR-004, ADR-005).
import { fileURLToPath } from "node:url";
import SwaggerParser from "@apidevtools/swagger-parser";
import Ajv from "ajv";
import addFormats from "ajv-formats";

export type OpenApiDoc = Record<string, unknown> & {
  components: { schemas: Record<string, object> };
};

let doc: OpenApiDoc | null = null;
let ajv: Ajv | null = null;

export async function loadSpec(): Promise<OpenApiDoc> {
  if (doc) return doc;
  // dereference: разворачиваем $ref, ajv валидирует плоские схемы
  const specPath = fileURLToPath(new URL("../../../shared/api-spec/openapi.yaml", import.meta.url));
  doc = (await SwaggerParser.dereference(specPath)) as OpenApiDoc;
  ajv = new Ajv({ allErrors: true, strict: false });
  addFormats(ajv);
  // OAS 3.0 допускает boolean exclusiveMinimum; draft-07 — нет. Переводим в custom-ключ.
  ajv.addKeyword({
    keyword: "xExclusiveMinimum",
    validate(schemaValue: number, data: number) {
      return typeof data === "number" && data > schemaValue;
    },
  });
  for (const [name, schema] of Object.entries(doc.components.schemas)) {
    ajv.addSchema(oasToDraft07(schema), `#/components/schemas/${name}`);
  }
  return doc;
}

function oasToDraft07(node: unknown): unknown {
  if (Array.isArray(node)) return node.map(oasToDraft07);
  if (!node || typeof node !== "object") return node;
  const out: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(node)) {
    if (key === "exclusiveMinimum" && value === true) {
      if (typeof out.minimum === "number") {
        out.xExclusiveMinimum = out.minimum;
        delete out.minimum;
      }
      continue;
    }
    out[key] = oasToDraft07(value);
  }
  return out;
}

/** Валидация тела по схеме из components.schemas. Возвращает список ошибок (пусто = ОК). */
export function validate(schemaName: string, body: unknown): string[] {
  const validateFn = ajv!.getSchema(`#/components/schemas/${schemaName}`);
  if (!validateFn) throw new Error(`schema not found: ${schemaName}`);
  const ok = validateFn(body);
  return ok ? [] : (validateFn.errors ?? []).map((e) => `${e.instancePath || "/"} ${e.message ?? ""}`);
}
