// Загрузка контракта и валидация ответов по схемам (ADR-004, ADR-005).
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
  doc = (await SwaggerParser.dereference(new URL("../../shared/api-spec/openapi.yaml", import.meta.url).pathname)) as OpenApiDoc;
  ajv = new Ajv({ allErrors: true, strict: false });
  addFormats(ajv);
  for (const [name, schema] of Object.entries(doc.components.schemas)) {
    ajv.addSchema(schema, `#/components/schemas/${name}`);
  }
  return doc;
}

/** Валидация тела по схеме из components.schemas. Возвращает список ошибок (пусто = ОК). */
export function validate(schemaName: string, body: unknown): string[] {
  const validateFn = ajv!.getSchema(`#/components/schemas/${schemaName}`);
  if (!validateFn) throw new Error(`schema not found: ${schemaName}`);
  const ok = validateFn(body);
  return ok ? [] : (validateFn.errors ?? []).map((e) => `${e.instancePath || "/"} ${e.message ?? ""}`);
}
