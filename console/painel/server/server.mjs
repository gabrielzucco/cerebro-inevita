// portable/server.mjs
import { createServer } from "node:http";
import { randomBytes, createHash as createHash10, timingSafeEqual } from "node:crypto";
import { readFileSync as readFileSync25, readdirSync as readdirSync21, lstatSync as lstatSync20, realpathSync as realpathSync16, existsSync as existsSync23 } from "node:fs";
import { resolve as resolve27, join as join25, relative as relative23, extname as extname2, sep as sep25 } from "node:path";

// ../scripts/lib/catalog-protocol.mjs
import { createHash } from "node:crypto";
import { existsSync, lstatSync, readFileSync, realpathSync } from "node:fs";
import { join, relative, resolve, sep } from "node:path";

// ../scripts/lib/json-schema-runtime.mjs
function object(value) {
  return value !== null && typeof value === "object" && !Array.isArray(value);
}
function same(left, right) {
  return JSON.stringify(left) === JSON.stringify(right);
}
function resolveRef(rootSchema, ref) {
  if (!String(ref).startsWith("#/")) throw new Error("artifact-schema-external-ref-not-supported");
  let current = rootSchema;
  for (const segment of ref.slice(2).split("/")) {
    const key2 = segment.replaceAll("~1", "/").replaceAll("~0", "~");
    if (!object(current) || !Object.hasOwn(current, key2)) throw new Error("artifact-schema-ref-missing");
    current = current[key2];
  }
  return current;
}
function matchesType(value, type) {
  if (type === "null") return value === null;
  if (type === "array") return Array.isArray(value);
  if (type === "object") return object(value);
  if (type === "integer") return Number.isInteger(value);
  if (type === "number") return typeof value === "number" && Number.isFinite(value);
  return typeof value === type;
}
function validateNode(value, schema2, rootSchema, path, errors) {
  if (!object(schema2)) {
    errors.push(`${path}: schema inv\xE1lido`);
    return;
  }
  if (schema2.$ref) {
    validateNode(value, resolveRef(rootSchema, schema2.$ref), rootSchema, path, errors);
    return;
  }
  if (Array.isArray(schema2.oneOf)) {
    const matches2 = schema2.oneOf.filter((candidate) => {
      const candidateErrors = [];
      validateNode(value, candidate, rootSchema, path, candidateErrors);
      return candidateErrors.length === 0;
    });
    if (matches2.length !== 1) errors.push(`${path}: precisa corresponder a exatamente uma op\xE7\xE3o`);
    return;
  }
  if (Object.hasOwn(schema2, "const") && !same(value, schema2.const)) errors.push(`${path}: const inv\xE1lida`);
  if (Array.isArray(schema2.enum) && !schema2.enum.some((item) => same(item, value))) errors.push(`${path}: enum inv\xE1lido`);
  const types = Array.isArray(schema2.type) ? schema2.type : schema2.type ? [schema2.type] : [];
  if (types.length && !types.some((type) => matchesType(value, type))) {
    errors.push(`${path}: tipo inv\xE1lido`);
    return;
  }
  if (typeof value === "string") {
    if (Number.isInteger(schema2.minLength) && value.length < schema2.minLength) errors.push(`${path}: texto curto`);
    if (Number.isInteger(schema2.maxLength) && value.length > schema2.maxLength) errors.push(`${path}: texto longo`);
    if (schema2.pattern && !new RegExp(schema2.pattern).test(value)) errors.push(`${path}: padr\xE3o inv\xE1lido`);
  }
  if (Array.isArray(value)) {
    if (Number.isInteger(schema2.minItems) && value.length < schema2.minItems) errors.push(`${path}: poucos itens`);
    if (schema2.uniqueItems && new Set(value.map((item) => JSON.stringify(item))).size !== value.length) {
      errors.push(`${path}: itens repetidos`);
    }
    if (schema2.items) value.forEach((item, index) => validateNode(item, schema2.items, rootSchema, `${path}[${index}]`, errors));
  }
  if (object(value)) {
    for (const key2 of schema2.required || []) if (!Object.hasOwn(value, key2)) errors.push(`${path}.${key2}: obrigat\xF3rio`);
    if (schema2.additionalProperties === false) {
      const allowed = new Set(Object.keys(schema2.properties || {}));
      for (const key2 of Object.keys(value)) if (!allowed.has(key2)) errors.push(`${path}.${key2}: n\xE3o permitido`);
    }
    for (const [key2, property] of Object.entries(schema2.properties || {})) {
      if (Object.hasOwn(value, key2)) validateNode(value[key2], property, rootSchema, `${path}.${key2}`, errors);
    }
  }
}
function validateJsonSchema(value, schema2) {
  const errors = [];
  validateNode(value, schema2, schema2, "$", errors);
  return [...new Set(errors)];
}

// ../scripts/lib/catalog-protocol.mjs
var PROTOCOL = new URL("../../protocol/", import.meta.url);
var CATALOG_SCHEMAS = Object.freeze({
  area: "area-contract.schema.json",
  system: "system-organization.schema.json",
  workflow: "workflow-contract.schema.json",
  package: "package-contract.schema.json",
  agent: "agent-contract.schema.json",
  source: "source-preparation.schema.json",
  artifact: "artifact-contract.schema.json",
  journey: "journey-contract.schema.json",
  work: "work-receipt.schema.json"
});
var CATALOG_COLLECTIONS = Object.freeze([
  ["areas", "area", "area_id"],
  ["systems", "system", "system_id"],
  ["workflows", "workflow", "workflow_id"],
  ["packages", "package", "package_id"],
  ["agents", "agent", "agent_id"],
  ["sources", "source", "source_id"],
  ["artifacts", "artifact", "artifact_id"],
  ["journeys", "journey", "journey_id"]
]);
var DEFAULT_CATALOG_DIR = ".cerebro/catalog";
var CATALOG_INDEX = "catalog.json";
var CATALOG_LOCK = "catalog.lock.json";
var schemaCache = /* @__PURE__ */ new Map();
function object2(value) {
  return value !== null && typeof value === "object" && !Array.isArray(value);
}
function loadCatalogSchema(kind) {
  const name = CATALOG_SCHEMAS[kind];
  if (!name) throw new Error(`catalog-schema-unknown:${kind}`);
  if (!schemaCache.has(kind)) {
    schemaCache.set(kind, JSON.parse(readFileSync(new URL(name, PROTOCOL), "utf8")));
  }
  return schemaCache.get(kind);
}
function schemaErrors(kind, value) {
  return validateJsonSchema(value, loadCatalogSchema(kind));
}
function uniqueIds(errors, items, key2, label) {
  const seen = /* @__PURE__ */ new Set();
  for (const item of items) {
    const id3 = item?.[key2];
    if (seen.has(id3)) errors.push(`${label}: ${key2} repetido '${id3}'`);
    seen.add(id3);
  }
  return seen;
}
function validateAreaContract(value) {
  const errors = schemaErrors("area", value);
  if (errors.length) return errors;
  uniqueIds(errors, value.sub_areas, "sub_area_id", `area ${value.area_id}`);
  if (value.status === "active" && value.leader_ref === null) {
    errors.push(`area ${value.area_id}: ativa sem l\xEDder nomeado (regra de corte 1)`);
  }
  if (value.status === "active" && value.system_refs.length === 0) {
    errors.push(`area ${value.area_id}: ativa sem sistema (regra de corte 1)`);
  }
  const rule = value.decision_rule;
  if (rule.cross_lane_decisions === "both-founders" && value.leader_ref !== null && rule.tie_break_ref !== value.leader_ref) {
    errors.push(`area ${value.area_id}: desempate das decis\xF5es de ciclo precisa ser o l\xEDder da \xE1rea`);
  }
  if (rule.cross_lane_decisions === "leader" && rule.tie_break_ref !== null) {
    errors.push(`area ${value.area_id}: decis\xE3o pelo l\xEDder n\xE3o tem desempate`);
  }
  return [...new Set(errors)];
}
function validateSystemEntry(value) {
  const errors = schemaErrors("system", value);
  if (errors.length) return errors;
  if (value.organization.responsible_refs.includes(value.organization.owner_ref)) {
    errors.push(`system ${value.system_id}: dono n\xE3o se lista como respons\xE1vel`);
  }
  return [...new Set(errors)];
}
function triggerErrors(errors, label, trigger) {
  const expected = { schedule: "schedule", event: "event", person: "person" };
  for (const key2 of Object.keys(expected)) {
    const present = trigger[key2] !== null;
    if (key2 === trigger.type && !present) errors.push(`${label}: trigger.${key2} obrigat\xF3rio para type ${trigger.type}`);
    if (key2 !== trigger.type && present) errors.push(`${label}: trigger.${key2} n\xE3o cabe em type ${trigger.type}`);
  }
  const schedule = trigger.schedule;
  if (schedule) {
    if (schedule.cadence === "weekly" && schedule.weekdays.length === 0) {
      errors.push(`${label}: cad\xEAncia semanal sem dia da semana`);
    }
    if (schedule.cadence === "monthly" && schedule.month_days.length === 0) {
      errors.push(`${label}: cad\xEAncia mensal sem dia do m\xEAs`);
    }
    for (const day of schedule.month_days) {
      if (!Number.isInteger(day) || day < 1 || day > 28) errors.push(`${label}: dia do m\xEAs fora de 1..28`);
    }
    if (schedule.cadence !== "weekly" && schedule.cadence !== "weekdays" && schedule.weekdays.length) {
      errors.push(`${label}: weekdays s\xF3 cabe em cad\xEAncia semanal ou de dias \xFAteis`);
    }
    if (schedule.cadence !== "monthly" && schedule.month_days.length) {
      errors.push(`${label}: month_days s\xF3 cabe em cad\xEAncia mensal`);
    }
  }
}
function validateWorkflowContract(value) {
  const errors = schemaErrors("workflow", value);
  if (errors.length) return errors;
  const label = `workflow ${value.workflow_id}`;
  triggerErrors(errors, label, value.trigger);
  const plain = ["workflow", "child"].includes(value.kind);
  const cyclic = ["cycle", "cycle-variant"].includes(value.kind);
  if (value.alias === "rotina" && value.trigger.type !== "schedule") {
    errors.push(`${label}: alias rotina exige gatilho de rel\xF3gio`);
  }
  if (plain && value.trigger.type === "schedule" && value.alias !== "rotina") {
    errors.push(`${label}: workflow com rel\xF3gio leva alias rotina`);
  }
  if (value.scope === "system") {
    if (value.system_ref === null) errors.push(`${label}: escopo de sistema exige system_ref`);
    if (value.cycle !== null) errors.push(`${label}: escopo de sistema n\xE3o declara ciclo`);
    if (!plain) errors.push(`${label}: escopo de sistema s\xF3 admite kind workflow ou child`);
  } else {
    if (value.system_ref !== null) errors.push(`${label}: escopo de \xE1rea n\xE3o tem system_ref`);
    if (cyclic && value.cycle === null) errors.push(`${label}: ciclo exige bloco cycle`);
    if (plain && value.cycle !== null) errors.push(`${label}: workflow de \xE1rea sem raias n\xE3o declara bloco cycle`);
  }
  if (value.cycle) {
    if (value.kind === "cycle") {
      if (value.cycle.cycle_ref !== null || value.cycle.variant !== null) errors.push(`${label}: ciclo n\xE3o aponta para outro ciclo`);
      if (value.cycle.lanes.length === 0) errors.push(`${label}: ciclo exige pelo menos uma raia`);
    }
    if (value.kind === "cycle-variant") {
      if (value.cycle.cycle_ref === null) errors.push(`${label}: variante exige cycle_ref`);
      if (value.cycle.variant !== value.workflow_id) errors.push(`${label}: variant precisa ser o pr\xF3prio workflow_id`);
    }
    uniqueIds(errors, value.cycle.lanes, "system_ref", `${label} lanes`);
  }
  const stepIds = uniqueIds(errors, value.steps, "step_id", label);
  const handoffIds = uniqueIds(errors, value.handoffs, "handoff_id", label);
  for (const step of value.steps) {
    for (const required of step.requires) {
      if (required === step.step_id) errors.push(`${label}: passo ${step.step_id} depende de si mesmo`);
      else if (!stepIds.has(required)) errors.push(`${label}: passo ${step.step_id} depende de passo inexistente ${required}`);
    }
    if (step.handoff_ref !== null && !handoffIds.has(step.handoff_ref)) {
      errors.push(`${label}: passo ${step.step_id} aponta handoff inexistente ${step.handoff_ref}`);
    }
    if (value.scope === "system" && step.system_ref !== value.system_ref) {
      errors.push(`${label}: passo ${step.step_id} fora do sistema do workflow`);
    }
    if (step.system_ref === null && !(value.scope === "area" && plain)) {
      errors.push(`${label}: passo ${step.step_id} sem sistema s\xF3 cabe em workflow de \xE1rea sem raias`);
    }
    if (step.verbs.includes("external-action") && step.executor.kind === "agent" && step.package_ref === null) {
      errors.push(`${label}: passo ${step.step_id} com a\xE7\xE3o externa por agente exige pacote`);
    }
    if (step.child_workflow_ref === value.workflow_id) errors.push(`${label}: passo ${step.step_id} chama o pr\xF3prio workflow`);
  }
  for (const handoff of value.handoffs) {
    if (handoff.from_system_ref === handoff.to_system_ref) errors.push(`${label}: handoff ${handoff.handoff_id} entre o mesmo sistema`);
  }
  return [...new Set(errors)];
}
function validatePackageContract(value) {
  const errors = schemaErrors("package", value);
  if (errors.length) return errors;
  uniqueIds(errors, value.collections, "collection_id", `package ${value.package_id}`);
  if (value.status === "active" && (value.approval.approved_by === null || value.validity.issued_at === null)) {
    errors.push(`package ${value.package_id}: ativo exige aprova\xE7\xE3o e emiss\xE3o registradas`);
  }
  if (value.status === "revoked" && value.validity.revoked_at === null) {
    errors.push(`package ${value.package_id}: revogado exige revoked_at`);
  }
  return [...new Set(errors)];
}
function validateAgentContract(value) {
  const errors = schemaErrors("agent", value);
  if (errors.length) return errors;
  const label = `agent ${value.agent_id}`;
  if (value.mandate.mode === "on-behalf-of" && value.mandate.on_behalf_of_ref === null) {
    errors.push(`${label}: mandato em nome de algu\xE9m exige on_behalf_of_ref`);
  }
  if (value.mandate.mode === "autonomous" && value.mandate.on_behalf_of_ref !== null) {
    errors.push(`${label}: mandato aut\xF4nomo n\xE3o leva on_behalf_of_ref`);
  }
  if (value.mandate.external_actions && !value.mandate.approval_required) {
    errors.push(`${label}: a\xE7\xE3o externa sem aprova\xE7\xE3o humana n\xE3o \xE9 admitida`);
  }
  if (value.memory.enabled && value.memory.store_ref === null) {
    errors.push(`${label}: mem\xF3ria ligada exige store_ref`);
  }
  return [...new Set(errors)];
}
function validateSourcePreparation(value) {
  const errors = schemaErrors("source", value);
  if (errors.length) return errors;
  const cadence = value.preparation.cadence;
  if (cadence.time !== null && cadence.timezone === null) {
    errors.push(`source ${value.source_id}: hor\xE1rio sem fuso`);
  }
  if (!value.preparation.layers.includes("raw") && value.preparation.preparer_workflow_ref !== null) {
    errors.push(`source ${value.source_id}: s\xF3 fonte com camada bruta tem workflow de preparo`);
  }
  return [...new Set(errors)];
}
var HANDOFF_ARTIFACT_KINDS = Object.freeze(["lead-qualificado", "compra", "oportunidade-de-expansao"]);
var SPICED_FIELDS = Object.freeze(["situation", "pain", "impact", "critical-event", "decision"]);
function validateArtifactContract(value) {
  const errors = schemaErrors("artifact", value);
  if (errors.length) return errors;
  const label = `artifact ${value.artifact_id}`;
  const handoffKind = HANDOFF_ARTIFACT_KINDS.includes(value.kind);
  if (handoffKind && value.role !== "handoff") errors.push(`${label}: tipo ${value.kind} atravessa handoff; papel precisa ser handoff`);
  if (!handoffKind && value.role === "handoff") errors.push(`${label}: tipo ${value.kind} \xE9 produzido por n\xF3s, n\xE3o handoff`);
  if (value.parent_ref === value.artifact_id) errors.push(`${label}: artefato pai de si mesmo`);
  if (value.versioning.links_to_version_of.includes(value.artifact_id)) errors.push(`${label}: aponta a pr\xF3pria vers\xE3o`);
  if (value.validity.inherits_from_ref !== null && !value.validity.windowed) errors.push(`${label}: herda janela sem ser janelado`);
  if (value.validity.inherits_from_ref === value.artifact_id) errors.push(`${label}: herda janela de si mesmo`);
  return [...new Set(errors)];
}
function validateJourneyContract(value) {
  const errors = schemaErrors("journey", value);
  if (errors.length) return errors;
  const label = `journey ${value.journey_id}`;
  const stageIds = uniqueIds(errors, value.stages, "stage_id", label);
  uniqueIds(errors, value.stages, "order", `${label} ordem`);
  const byId = new Map(value.stages.map((stage) => [stage.stage_id, stage]));
  const nodes = value.stages.filter((stage) => stage.side === "node");
  if (nodes.length !== 1) errors.push(`${label}: a gravata tem exatamente um n\xF3 (a compra)`);
  const node = nodes[0];
  if (node) {
    for (const stage of value.stages) {
      if (stage.side === "left" && stage.order >= node.order) errors.push(`${label}: est\xE1gio ${stage.stage_id} \xE0 esquerda depois do n\xF3`);
      if (stage.side === "right" && stage.order <= node.order) errors.push(`${label}: est\xE1gio ${stage.stage_id} \xE0 direita antes do n\xF3`);
    }
    if (value.node.stage_ref !== node.stage_id) errors.push(`${label}: node.stage_ref precisa ser o est\xE1gio do n\xF3`);
  }
  if (!value.stages.some((stage) => stage.side === "left") || !value.stages.some((stage) => stage.side === "right")) {
    errors.push(`${label}: a gravata tem as duas metades`);
  }
  for (const stage of value.stages) {
    const stageLabel = `${label}: est\xE1gio ${stage.stage_id}`;
    for (const ref of stage.next_stage_refs) {
      if (ref === stage.stage_id) errors.push(`${stageLabel} aponta para si mesmo`);
      else if (!stageIds.has(ref)) errors.push(`${stageLabel} aponta est\xE1gio inexistente ${ref}`);
    }
    for (const [type, measure] of Object.entries(stage.measures)) {
      if (measure.decided && (measure.statement === null || measure.source_ref === null)) {
        errors.push(`${stageLabel}: medida de ${type} decidida exige enunciado e fonte`);
      }
    }
  }
  const from = byId.get(value.loop.from_stage_ref);
  const to = byId.get(value.loop.to_stage_ref);
  if (!from) errors.push(`${label}: loop sai de est\xE1gio inexistente`);
  else if (from.side !== "right") errors.push(`${label}: o loop sai da metade direita`);
  if (!to) errors.push(`${label}: loop volta para est\xE1gio inexistente`);
  else if (to.side !== "left") errors.push(`${label}: o loop volta para a metade esquerda`);
  const covered = new Set(value.stages.flatMap((stage) => stage.spiced_fields));
  for (const field of SPICED_FIELDS) if (!covered.has(field)) errors.push(`${label}: campo SPICED ${field} n\xE3o \xE9 colhido em nenhum est\xE1gio`);
  if (!value.instance.fields.includes(value.subject.id_field)) errors.push(`${label}: inst\xE2ncia sem o campo de identidade ${value.subject.id_field}`);
  return [...new Set(errors)];
}
function validateWorkReceipt(value) {
  const errors = schemaErrors("work", value);
  if (errors.length) return errors;
  const label = `work ${value.work_id}`;
  uniqueIds(errors, value.steps, "step_id", label);
  if (["completed", "failed", "cancelled"].includes(value.status) && value.completed_at === null) {
    errors.push(`${label}: estado terminal exige completed_at`);
  }
  if (["queued", "running", "blocked"].includes(value.status) && value.completed_at !== null) {
    errors.push(`${label}: estado aberto n\xE3o tem completed_at`);
  }
  if (value.trigger.type === "schedule" && value.trigger.scheduled_for === null) {
    errors.push(`${label}: disparo de rel\xF3gio exige scheduled_for`);
  }
  for (const step of value.steps) {
    if (!Number.isInteger(step.attempts) || step.attempts < 1) errors.push(`${label}: passo ${step.step_id} com attempts < 1`);
    if (step.status === "blocked" && step.blocked_by === null) errors.push(`${label}: passo ${step.step_id} bloqueado sem motivo`);
    if (step.status === "completed" && step.completed_at === null) errors.push(`${label}: passo ${step.step_id} conclu\xEDdo sem completed_at`);
    const usage = step.otel?.attributes;
    if (usage && ((usage["gen_ai.usage.input_tokens"] ?? 0) < 0 || (usage["gen_ai.usage.output_tokens"] ?? 0) < 0)) {
      errors.push(`${label}: passo ${step.step_id} com tokens negativos`);
    }
  }
  return [...new Set(errors)];
}
var CATALOG_VALIDATORS = Object.freeze({
  area: validateAreaContract,
  system: validateSystemEntry,
  workflow: validateWorkflowContract,
  package: validatePackageContract,
  agent: validateAgentContract,
  source: validateSourcePreparation,
  artifact: validateArtifactContract,
  journey: validateJourneyContract,
  work: validateWorkReceipt
});
function safePath(root, path, label) {
  const base = realpathSync(root);
  const target = resolve(base, path);
  const rel = relative(base, target);
  if (!rel || rel.startsWith("..") || rel.startsWith(sep)) throw new Error(`${label}: fora do C\xE9rebro`);
  return target;
}
function readJsonFile(path, label) {
  if (!existsSync(path)) throw new Error(`${label}: ausente`);
  const stat = lstatSync(path);
  if (stat.isSymbolicLink() || !stat.isFile()) throw new Error(`${label}: precisa ser arquivo regular`);
  if (stat.size > 4e6) throw new Error(`${label}: maior que o limite`);
  try {
    return JSON.parse(readFileSync(path, "utf8"));
  } catch {
    throw new Error(`${label}: JSON inv\xE1lido`);
  }
}
function catalogDirectory(root) {
  const layoutPath = join(root, ".cerebro", "layout.json");
  let configured = DEFAULT_CATALOG_DIR;
  if (existsSync(layoutPath)) {
    const layout2 = readJsonFile(layoutPath, ".cerebro/layout.json");
    if (typeof layout2.catalog === "string" && layout2.catalog.trim()) configured = layout2.catalog;
  }
  return safePath(root, configured, "catalog");
}
function readCatalog(root) {
  const dir = catalogDirectory(root);
  const index = readJsonFile(join(dir, CATALOG_INDEX), CATALOG_INDEX);
  if (!object2(index) || index.protocol_version !== 1 || !object2(index.files)) {
    throw new Error(`${CATALOG_INDEX}: \xEDndice inv\xE1lido`);
  }
  const files = {};
  const collections = {};
  for (const [collection] of CATALOG_COLLECTIONS) {
    const name = index.files[collection];
    if (typeof name !== "string" || !/^[a-z0-9-]+\.json$/.test(name)) throw new Error(`${CATALOG_INDEX}: files.${collection} inv\xE1lido`);
    const value = readJsonFile(join(dir, name), name);
    if (!Array.isArray(value)) throw new Error(`${name}: precisa ser lista`);
    files[collection] = name;
    collections[collection] = value;
  }
  const inventoryName = index.files.legacy_inventory;
  if (typeof inventoryName !== "string" || !/^[a-z0-9-]+\.json$/.test(inventoryName)) {
    throw new Error(`${CATALOG_INDEX}: files.legacy_inventory inv\xE1lido`);
  }
  const legacyInventory = readJsonFile(join(dir, inventoryName), inventoryName);
  files.legacy_inventory = inventoryName;
  const lockPath = join(dir, CATALOG_LOCK);
  const lock = existsSync(lockPath) ? readJsonFile(lockPath, CATALOG_LOCK) : null;
  return { root, dir, index, files, ...collections, legacyInventory, lock };
}
function validateLegacyInventory(inventory) {
  const errors = [];
  if (!object2(inventory) || inventory.protocol_version !== 1) return ["legacy-inventory: protocol_version precisa ser 1"];
  for (const key2 of ["systems", "routines", "sources"]) {
    if (!Array.isArray(inventory[key2]) || inventory[key2].some((id3) => typeof id3 !== "string" || !/^[a-z0-9][a-z0-9-]{0,63}$/.test(id3))) {
      errors.push(`legacy-inventory: ${key2} precisa ser lista de ids`);
    } else if (new Set(inventory[key2]).size !== inventory[key2].length) {
      errors.push(`legacy-inventory: ${key2} com id repetido`);
    }
  }
  return errors;
}
function validateCatalog(catalog) {
  const errors = [];
  const warnings = [];
  const byId = {};
  for (const [collection, kind, key2] of CATALOG_COLLECTIONS) {
    const items = catalog[collection] ?? [];
    byId[collection] = /* @__PURE__ */ new Map();
    for (const [index, item] of items.entries()) {
      for (const error of CATALOG_VALIDATORS[kind](item)) errors.push(`${collection}[${index}]: ${error}`);
      const id3 = item?.[key2];
      if (typeof id3 === "string") {
        if (byId[collection].has(id3)) errors.push(`${collection}: ${key2} repetido '${id3}'`);
        byId[collection].set(id3, item);
      }
    }
  }
  const inventoryErrors = validateLegacyInventory(catalog.legacyInventory);
  errors.push(...inventoryErrors);
  if (errors.length) return { errors: [...new Set(errors)], warnings, summary: summary(catalog) };
  const areas = byId.areas;
  const systems = byId.systems;
  const workflows = byId.workflows;
  const packages = byId.packages;
  const agents = byId.agents;
  const sources = byId.sources;
  const artifacts2 = byId.artifacts;
  const journeys = byId.journeys;
  const areaOf = (systemId) => systems.get(systemId)?.organization.area_ref;
  for (const area of areas.values()) {
    const subAreas = new Set(area.sub_areas.map((item) => item.sub_area_id));
    for (const ref of area.system_refs) {
      const system = systems.get(ref);
      if (!system) errors.push(`area ${area.area_id}: sistema ${ref} n\xE3o existe`);
      else if (system.organization.area_ref !== area.area_id) errors.push(`area ${area.area_id}: sistema ${ref} declara outra \xE1rea`);
    }
    for (const ref of area.cycle_refs) {
      const cycle = workflows.get(ref);
      if (!cycle) errors.push(`area ${area.area_id}: ciclo ${ref} n\xE3o existe`);
      else if (cycle.kind !== "cycle" || cycle.area_ref !== area.area_id) errors.push(`area ${area.area_id}: ${ref} n\xE3o \xE9 ciclo desta \xE1rea`);
    }
    for (const ref of area.workflow_refs) {
      const workflow = workflows.get(ref);
      if (!workflow) errors.push(`area ${area.area_id}: workflow ${ref} n\xE3o existe`);
      else if (workflow.scope !== "area" || !["workflow", "child"].includes(workflow.kind) || workflow.area_ref !== area.area_id) {
        errors.push(`area ${area.area_id}: ${ref} n\xE3o \xE9 workflow de \xE1rea desta \xE1rea`);
      }
    }
    if (area.status === "active" && ![...area.system_refs].some((ref) => systems.get(ref)?.status === "active")) {
      errors.push(`area ${area.area_id}: ativa sem nenhum sistema ativo (regra de corte 1)`);
    }
    for (const sub of area.sub_areas) {
      if (sub.status === "active" && sub.owner_ref === null) errors.push(`area ${area.area_id}: sub-\xE1rea ${sub.sub_area_id} ativa sem dono`);
    }
    area.__subAreas = subAreas;
  }
  for (const system of systems.values()) {
    const area = areas.get(system.organization.area_ref);
    if (!area) {
      errors.push(`system ${system.system_id}: \xE1rea ${system.organization.area_ref} n\xE3o existe`);
      continue;
    }
    if (!area.system_refs.includes(system.system_id)) errors.push(`system ${system.system_id}: n\xE3o listado na \xE1rea ${area.area_id}`);
    const sub = system.organization.sub_area_ref;
    if (sub !== null && !area.__subAreas.has(sub)) errors.push(`system ${system.system_id}: sub-\xE1rea ${sub} n\xE3o existe em ${area.area_id}`);
    for (const ref of system.workflow_refs) {
      const workflow = workflows.get(ref);
      if (!workflow) {
        errors.push(`system ${system.system_id}: workflow ${ref} n\xE3o existe`);
        continue;
      }
      const belongs = workflow.scope === "system" ? workflow.system_ref === system.system_id : workflow.steps.some((step) => step.system_ref === system.system_id) || (workflow.cycle?.lanes ?? []).some((lane) => lane.system_ref === system.system_id);
      if (!belongs) errors.push(`system ${system.system_id}: workflow ${ref} n\xE3o passa por este sistema`);
    }
    if (system.kind === "system" && system.status === "active" && system.workflow_refs.length === 0) {
      errors.push(`system ${system.system_id}: ativo sem workflow (teste de sistema de verdade)`);
    }
  }
  for (const workflow of workflows.values()) {
    const label = `workflow ${workflow.workflow_id}`;
    const area = areas.get(workflow.area_ref);
    if (!area) {
      errors.push(`${label}: \xE1rea ${workflow.area_ref} n\xE3o existe`);
      continue;
    }
    let laneSystems = null;
    if (workflow.scope === "area" && ["workflow", "child"].includes(workflow.kind)) {
      if (!area.workflow_refs.includes(workflow.workflow_id)) errors.push(`${label}: workflow de \xE1rea n\xE3o listado em ${area.area_id}`);
      for (const step of workflow.steps) {
        if (step.system_ref !== null && areaOf(step.system_ref) !== workflow.area_ref) {
          errors.push(`${label}: passo ${step.step_id} aponta sistema de outra \xE1rea`);
        }
      }
    }
    if (workflow.scope === "system") {
      const system = systems.get(workflow.system_ref);
      if (!system) errors.push(`${label}: sistema ${workflow.system_ref} n\xE3o existe`);
      else {
        if (system.organization.area_ref !== workflow.area_ref) errors.push(`${label}: sistema ${workflow.system_ref} \xE9 de outra \xE1rea`);
        if (!system.workflow_refs.includes(workflow.workflow_id)) errors.push(`${label}: n\xE3o listado no sistema ${workflow.system_ref}`);
      }
    } else if (workflow.kind === "cycle") {
      laneSystems = /* @__PURE__ */ new Set();
      for (const lane of workflow.cycle.lanes) {
        if (!systems.has(lane.system_ref)) errors.push(`${label}: raia ${lane.system_ref} n\xE3o existe`);
        else if (areaOf(lane.system_ref) !== workflow.area_ref) errors.push(`${label}: raia ${lane.system_ref} \xE9 de outra \xE1rea`);
        laneSystems.add(lane.system_ref);
      }
      if (!area.cycle_refs.includes(workflow.workflow_id)) errors.push(`${label}: ciclo n\xE3o listado na \xE1rea ${area.area_id}`);
    } else if (workflow.kind === "cycle-variant") {
      const parent = workflows.get(workflow.cycle.cycle_ref);
      if (!parent) errors.push(`${label}: ciclo ${workflow.cycle.cycle_ref} n\xE3o existe`);
      else if (parent.kind !== "cycle" || parent.area_ref !== workflow.area_ref) errors.push(`${label}: ${workflow.cycle.cycle_ref} n\xE3o \xE9 ciclo desta \xE1rea`);
      else {
        laneSystems = new Set(parent.cycle.lanes.map((lane) => lane.system_ref));
        for (const lane of workflow.cycle.lanes) {
          if (!laneSystems.has(lane.system_ref)) errors.push(`${label}: raia ${lane.system_ref} n\xE3o existe no ciclo ${parent.workflow_id}`);
        }
      }
    }
    for (const step of workflow.steps) {
      if (laneSystems && !laneSystems.has(step.system_ref)) errors.push(`${label}: passo ${step.step_id} fora das raias do ciclo`);
      if (step.system_ref !== null && !systems.has(step.system_ref)) errors.push(`${label}: passo ${step.step_id} aponta sistema inexistente ${step.system_ref}`);
      if (step.package_ref !== null && !packages.has(step.package_ref)) errors.push(`${label}: passo ${step.step_id} aponta pacote inexistente ${step.package_ref}`);
      if (step.executor.kind === "agent" && !agents.has(step.executor.ref)) errors.push(`${label}: passo ${step.step_id} executa por agente sem contrato ${step.executor.ref}`);
      if (step.child_workflow_ref !== null) {
        const child = workflows.get(step.child_workflow_ref);
        if (!child) errors.push(`${label}: passo ${step.step_id} chama workflow inexistente ${step.child_workflow_ref}`);
        else if (child.area_ref !== workflow.area_ref) errors.push(`${label}: passo ${step.step_id} chama workflow de outra \xE1rea`);
        else if (!["workflow", "child"].includes(child.kind)) errors.push(`${label}: passo ${step.step_id} chama um ciclo como filho`);
      }
    }
    for (const handoff of workflow.handoffs) {
      for (const ref of [handoff.from_system_ref, handoff.to_system_ref]) {
        if (!systems.has(ref)) errors.push(`${label}: handoff ${handoff.handoff_id} aponta sistema inexistente ${ref}`);
      }
      if (handoff.opens_workflow_ref !== null) {
        const opened = workflows.get(handoff.opens_workflow_ref);
        if (!opened) errors.push(`${label}: handoff ${handoff.handoff_id} abre workflow inexistente`);
        else if (opened.kind !== "cycle") errors.push(`${label}: handoff ${handoff.handoff_id} s\xF3 abre ciclo`);
      }
    }
  }
  const prefixes = /* @__PURE__ */ new Set();
  for (const pkg of packages.values()) {
    const label = `package ${pkg.package_id}`;
    if (prefixes.has(pkg.prefix)) errors.push(`${label}: prefixo repetido '${pkg.prefix}'`);
    prefixes.add(pkg.prefix);
    const area = areas.get(pkg.area_ref);
    if (!area) errors.push(`${label}: \xE1rea ${pkg.area_ref} n\xE3o existe`);
    else if (area.leader_ref !== null && pkg.grantor_ref !== area.leader_ref) {
      errors.push(`${label}: quem concede \xE9 o l\xEDder da \xE1rea ${area.area_id}`);
    } else if (area.leader_ref === null) warnings.push(`${label}: \xE1rea sem l\xEDder; concess\xE3o fica provis\xF3ria`);
    if (pkg.subject.type === "system" && !systems.has(pkg.subject.ref)) errors.push(`${label}: sujeito sistema ${pkg.subject.ref} n\xE3o existe`);
    if (pkg.subject.type === "agent" && !agents.has(pkg.subject.ref)) errors.push(`${label}: sujeito agente ${pkg.subject.ref} n\xE3o existe`);
    for (const collection of pkg.collections) {
      if (!areas.has(collection.area_ref)) errors.push(`${label}: cole\xE7\xE3o ${collection.collection_id} aponta \xE1rea inexistente`);
      for (const ref of collection.source_refs) {
        if (!sources.has(ref)) errors.push(`${label}: cole\xE7\xE3o ${collection.collection_id} aponta fonte inexistente ${ref}`);
      }
    }
  }
  for (const agent of agents.values()) {
    const label = `agent ${agent.agent_id}`;
    for (const ref of agent.mandate.workflow_refs) if (!workflows.has(ref)) errors.push(`${label}: workflow ${ref} n\xE3o existe`);
    for (const ref of agent.mandate.system_refs) if (!systems.has(ref)) errors.push(`${label}: sistema ${ref} n\xE3o existe`);
    for (const ref of agent.package_refs) {
      const pkg = packages.get(ref);
      if (!pkg) errors.push(`${label}: pacote ${ref} n\xE3o existe`);
    }
    const used = [...workflows.values()].some((workflow) => workflow.steps.some((step) => step.executor.kind === "agent" && step.executor.ref === agent.agent_id));
    if (agent.status === "active" && !used) warnings.push(`${label}: ativo sem passo que o execute`);
  }
  for (const source of sources.values()) {
    const label = `source ${source.source_id}`;
    const prep = source.preparation;
    if (!areas.has(prep.owner_area_ref)) errors.push(`${label}: \xE1rea ${prep.owner_area_ref} n\xE3o existe`);
    if (prep.owner_system_ref !== null) {
      if (!systems.has(prep.owner_system_ref)) errors.push(`${label}: sistema ${prep.owner_system_ref} n\xE3o existe`);
      else if (areaOf(prep.owner_system_ref) !== prep.owner_area_ref) errors.push(`${label}: sistema dono fora da \xE1rea dona`);
    }
    if (prep.preparer_workflow_ref !== null && !workflows.has(prep.preparer_workflow_ref)) {
      errors.push(`${label}: workflow de preparo ${prep.preparer_workflow_ref} n\xE3o existe`);
    }
  }
  for (const artifact of artifacts2.values()) {
    const label = `artifact ${artifact.artifact_id}`;
    const area = areas.get(artifact.area_ref);
    if (!area) {
      errors.push(`${label}: \xE1rea ${artifact.area_ref} n\xE3o existe`);
      continue;
    }
    if (artifact.system_ref !== null) {
      if (!systems.has(artifact.system_ref)) errors.push(`${label}: sistema ${artifact.system_ref} n\xE3o existe`);
      else if (areaOf(artifact.system_ref) !== artifact.area_ref) errors.push(`${label}: sistema ${artifact.system_ref} \xE9 de outra \xE1rea`);
    }
    if (artifact.kind === "oferta" && area.leader_ref !== null && artifact.owner_ref !== area.leader_ref) {
      errors.push(`${label}: a oferta \xE9 do l\xEDder da \xE1rea ${area.area_id}`);
    }
    if (artifact.parent_ref !== null) {
      const seen = /* @__PURE__ */ new Set([artifact.artifact_id]);
      let cursor = artifact.parent_ref;
      while (cursor !== null) {
        const parent = artifacts2.get(cursor);
        if (!parent) {
          errors.push(`${label}: pai ${cursor} n\xE3o existe`);
          break;
        }
        if (seen.has(cursor)) {
          errors.push(`${label}: hierarquia circular`);
          break;
        }
        seen.add(cursor);
        cursor = parent.parent_ref;
      }
    }
    for (const ref of artifact.versioning.links_to_version_of) {
      if (!artifacts2.has(ref)) errors.push(`${label}: aponta vers\xE3o de artefato inexistente ${ref}`);
    }
    if (artifact.validity.inherits_from_ref !== null && !artifacts2.has(artifact.validity.inherits_from_ref)) {
      errors.push(`${label}: herda janela de artefato inexistente ${artifact.validity.inherits_from_ref}`);
    }
    for (const [relation, links] of [["produzido", artifact.produced_by], ["consumido", artifact.consumed_by]]) {
      for (const link of links) {
        const workflow = workflows.get(link.workflow_ref);
        if (!workflow) {
          errors.push(`${label}: ${relation} por workflow inexistente ${link.workflow_ref}`);
          continue;
        }
        if (link.step_ref !== null && !workflow.steps.some((step) => step.step_id === link.step_ref)) {
          errors.push(`${label}: ${relation} em passo inexistente ${link.workflow_ref}/${link.step_ref}`);
        }
      }
    }
    if (artifact.role === "produced" && artifact.status === "active" && artifact.produced_by.length === 0) {
      warnings.push(`${label}: ativo sem workflow que o produza`);
    }
  }
  const handoffUses = new Map([...artifacts2.values()].filter((item) => item.role === "handoff").map((item) => [item.artifact_id, 0]));
  for (const workflow of workflows.values()) {
    for (const handoff of workflow.handoffs) {
      if (!handoffUses.has(handoff.artifact_type)) {
        errors.push(`workflow ${workflow.workflow_id}: handoff ${handoff.handoff_id} atravessa artefato sem contrato ${handoff.artifact_type}`);
      } else {
        handoffUses.set(handoff.artifact_type, handoffUses.get(handoff.artifact_type) + 1);
      }
    }
  }
  for (const [id3, uses] of handoffUses) if (uses === 0) warnings.push(`artifact ${id3}: handoff sem workflow que o atravesse`);
  for (const journey of journeys.values()) {
    const label = `journey ${journey.journey_id}`;
    const area = areas.get(journey.area_ref);
    if (!area) {
      errors.push(`${label}: \xE1rea ${journey.area_ref} n\xE3o existe`);
      continue;
    }
    for (const stage of journey.stages) {
      const stageLabel = `${label}: est\xE1gio ${stage.stage_id}`;
      const system = systems.get(stage.system_ref);
      if (!system) errors.push(`${stageLabel} aponta sistema inexistente ${stage.system_ref}`);
      else {
        if (system.organization.area_ref !== journey.area_ref) errors.push(`${stageLabel} aponta sistema de outra \xE1rea`);
        if (stage.owner_ref !== system.organization.owner_ref) errors.push(`${stageLabel}: o dono do est\xE1gio \xE9 o dono do sistema ${system.system_id}`);
      }
      for (const ref of stage.touchpoint_source_refs) if (!sources.has(ref)) errors.push(`${stageLabel} aponta fonte inexistente ${ref}`);
      for (const ref of stage.workflow_refs) if (!workflows.has(ref)) errors.push(`${stageLabel} aponta workflow inexistente ${ref}`);
    }
    for (const ref of [journey.node.handoff_artifact_ref, journey.loop.artifact_ref]) {
      const artifact = artifacts2.get(ref);
      if (!artifact || artifact.role !== "handoff") errors.push(`${label}: ${ref} n\xE3o \xE9 artefato de handoff`);
    }
    const opened = workflows.get(journey.node.opens_cycle_ref);
    if (!opened || opened.kind !== "cycle" || opened.area_ref !== journey.area_ref) errors.push(`${label}: o n\xF3 abre um ciclo da pr\xF3pria \xE1rea`);
    else if (!journey.cycle_refs.includes(opened.workflow_id)) errors.push(`${label}: o ciclo aberto no n\xF3 precisa estar em cycle_refs`);
    for (const ref of [journey.loop.identified_by_system_ref, journey.loop.closed_by_system_ref]) {
      if (!systems.has(ref)) errors.push(`${label}: loop aponta sistema inexistente ${ref}`);
      else if (areaOf(ref) !== journey.area_ref) errors.push(`${label}: loop aponta sistema de outra \xE1rea`);
    }
    for (const ref of journey.cycle_refs) {
      const cycle = workflows.get(ref);
      if (!cycle || cycle.kind !== "cycle" || cycle.area_ref !== journey.area_ref) {
        errors.push(`${label}: ${ref} n\xE3o \xE9 ciclo desta \xE1rea`);
        continue;
      }
      if ((cycle.cycle.journey_ref ?? null) !== journey.journey_id) errors.push(`${label}: ciclo ${ref} n\xE3o aponta para esta jornada`);
    }
    if (!sources.has(journey.instance.store_ref)) errors.push(`${label}: casa da inst\xE2ncia ${journey.instance.store_ref} n\xE3o \xE9 fonte do cat\xE1logo`);
  }
  for (const workflow of workflows.values()) {
    const ref = workflow.cycle?.journey_ref ?? null;
    if (ref === null) continue;
    const journey = journeys.get(ref);
    if (!journey) errors.push(`workflow ${workflow.workflow_id}: jornada ${ref} n\xE3o existe`);
    else if (journey.area_ref !== workflow.area_ref) errors.push(`workflow ${workflow.workflow_id}: jornada ${ref} \xE9 de outra \xE1rea`);
    else if (workflow.kind === "cycle" && !journey.cycle_refs.includes(workflow.workflow_id)) {
      errors.push(`workflow ${workflow.workflow_id}: jornada ${ref} n\xE3o lista este ciclo`);
    }
  }
  const inventory = catalog.legacyInventory;
  const legacySystems = new Set(inventory.systems);
  const legacyRoutines = new Set(inventory.routines);
  const legacySources = new Set(inventory.sources);
  const systemClaims = /* @__PURE__ */ new Map();
  const routineClaims = /* @__PURE__ */ new Map();
  const claim = (map, id3, by) => map.set(id3, [...map.get(id3) ?? [], by]);
  for (const system of systems.values()) {
    for (const ref of system.legacy.system_refs) claim(systemClaims, ref, `system ${system.system_id}`);
  }
  for (const workflow of workflows.values()) {
    for (const ref of workflow.legacy.system_refs) claim(systemClaims, ref, `workflow ${workflow.workflow_id}`);
    for (const ref of workflow.legacy.routine_refs) claim(routineClaims, ref, `workflow ${workflow.workflow_id}`);
  }
  for (const [id3, by] of systemClaims) {
    if (!legacySystems.has(id3)) errors.push(`legado: sistema ${id3} (em ${by.join(", ")}) n\xE3o est\xE1 no invent\xE1rio`);
  }
  for (const id3 of legacySystems) {
    if (!systemClaims.has(id3)) errors.push(`legado: sistema ${id3} n\xE3o foi reabsorvido por nenhum objeto`);
  }
  for (const [id3, by] of routineClaims) {
    if (!legacyRoutines.has(id3)) errors.push(`legado: rotina ${id3} (em ${by.join(", ")}) n\xE3o est\xE1 no invent\xE1rio`);
    if (by.length > 1) errors.push(`legado: rotina ${id3} reabsorvida mais de uma vez (${by.join(", ")})`);
  }
  for (const id3 of legacyRoutines) {
    if (!routineClaims.has(id3)) errors.push(`legado: rotina ${id3} n\xE3o virou workflow`);
  }
  for (const id3 of legacySources) {
    if (!sources.has(id3)) errors.push(`legado: fonte ${id3} sem entrada de preparo`);
  }
  for (const id3 of sources.keys()) {
    if (!legacySources.has(id3)) errors.push(`legado: fonte ${id3} n\xE3o est\xE1 no invent\xE1rio`);
  }
  for (const area of areas.values()) delete area.__subAreas;
  return { errors: [...new Set(errors)], warnings: [...new Set(warnings)], summary: summary(catalog) };
}
function summary(catalog) {
  const counts = {};
  for (const [collection] of CATALOG_COLLECTIONS) counts[collection] = (catalog[collection] ?? []).length;
  const workflows = catalog.workflows ?? [];
  counts.cycles = workflows.filter((item) => item?.kind === "cycle").length;
  counts.cycle_variants = workflows.filter((item) => item?.kind === "cycle-variant").length;
  counts.rotinas = workflows.filter((item) => item?.alias === "rotina").length;
  counts.journey_stages = (catalog.journeys ?? []).reduce((total, item) => total + (item?.stages?.length ?? 0), 0);
  counts.handoff_artifacts = (catalog.artifacts ?? []).filter((item) => item?.role === "handoff").length;
  counts.legacy_systems = catalog.legacyInventory?.systems?.length ?? 0;
  counts.legacy_routines = catalog.legacyInventory?.routines?.length ?? 0;
  return counts;
}
function canonicalJson(value) {
  if (Array.isArray(value)) return `[${value.map(canonicalJson).join(",")}]`;
  if (object2(value)) {
    return `{${Object.keys(value).sort().map((key2) => `${JSON.stringify(key2)}:${canonicalJson(value[key2])}`).join(",")}}`;
  }
  return JSON.stringify(value);
}
function sha256(text6) {
  return createHash("sha256").update(text6).digest("hex");
}
function catalogDigest(catalog) {
  const files = {};
  const ordered = [
    [CATALOG_INDEX, catalog.index],
    ...CATALOG_COLLECTIONS.map(([collection]) => [catalog.files[collection], catalog[collection]]),
    [catalog.files.legacy_inventory, catalog.legacyInventory]
  ];
  for (const [name, value] of ordered) files[name] = sha256(canonicalJson(value));
  const catalog_sha256 = sha256(ordered.map(([name]) => `${name}
${files[name]}
`).join(""));
  return { files, catalog_sha256 };
}
function lockDocument(catalog) {
  const digest2 = catalogDigest(catalog);
  return { protocol_version: 1, algorithm: "sha256", catalog_sha256: digest2.catalog_sha256, files: digest2.files };
}

// portable/profile.mjs
var PERSON_LABELS = Object.freeze({});
var COMPANY_MAP_SPEC = [
  { id: "business", name: "Meu neg\xF3cio", purpose: "Oferta, decis\xF5es e prioridades da empresa.", entries: [
    { id: "business-notes", name: "Neg\xF3cio e decis\xF5es", refs: ["meu-negocio"] },
    { id: "knowledge", name: "Conhecimento", refs: ["conhecimento"] }
  ] },
  { id: "work", name: "Trabalhos e entregas", purpose: "Sistemas, rotinas e materiais produzidos.", entries: [
    { id: "systems", name: "Sistemas", refs: ["sistemas", ".cerebro/contracts/systems"], view: "systems" },
    { id: "operations", name: "Opera\xE7\xE3o", refs: ["operacao"] },
    { id: "outputs", name: "Entregas das rotinas", refs: [".cerebro/runtime/outputs/routines"] },
    { id: "routines", name: "Rotinas", refs: [".cerebro/contracts/routines"], view: "routines" },
    { id: "experiments", name: "Experimentos", refs: [".cerebro/contracts/experiments"] }
  ] },
  { id: "community", name: "Comunidade", purpose: "Materiais publicados para os membros.", entries: [
    { id: "community-notes", name: "Materiais da comunidade", refs: ["comunidade"] }
  ] }
];
function sanitizeCommercialDetail() {
  throw new Error("commercial-adapter-not-installed");
}
function commercialRecordMarkdown() {
  throw new Error("commercial-adapter-not-installed");
}
var COMPANY_TEXT_ROOTS = ["meu-negocio", "conhecimento", "operacao", "sistemas", "comunidade"];

// ../scripts/lib/catalog-read-model.mjs
var CATALOG_VIEW_LABELS = Object.freeze({
  status: { proposed: "proposto", confirmed: "confirmado", active: "ativo", needs_attention: "aten\xE7\xE3o", paused: "pausado", retired: "encerrado", expired: "expirado", revoked: "revogado" },
  kind: { workflow: "workflow", child: "workflow filho", cycle: "ciclo", "cycle-variant": "variante de ciclo", system: "sistema", infrastructure: "infraestrutura" },
  executor: { person: "pessoa", agent: "agente", script: "script", service: "servi\xE7o" },
  side: { left: "esquerda", node: "n\xF3", right: "direita" },
  measure: { volume: "Volume", conversion: "Convers\xE3o", time: "Tempo", cost: "Custo" },
  spiced: { situation: "Situa\xE7\xE3o", pain: "Dor", impact: "Impacto", "critical-event": "Evento cr\xEDtico", decision: "Decis\xE3o" },
  layer: { raw: "bruto", organized: "tratado", distilled: "destilado", atoms: "\xE1tomos", consolidated: "consolidado", index: "\xEDndice" },
  placement: { "host-gabriel-local": "Mac", vps: "VPS", "github-actions": "GitHub Actions", railway: "Railway", manual: "manual", none: "nenhum" }
});
var WEEKDAY = { MO: "seg", TU: "ter", WE: "qua", TH: "qui", FR: "sex", SA: "s\xE1b", SU: "dom" };
var CADENCE = { interval: "Por intervalo", hourly: "A cada hora", daily: "Di\xE1rio", weekdays: "Dias \xFAteis", weekly: "Semanal", monthly: "Mensal", continuous: "Cont\xEDnua", "on-event": "Por evento", manual: "Manual", unspecified: "N\xE3o declarada" };
function personLabel(ref) {
  if (!ref) return "\u2014";
  return PERSON_LABELS[ref] || ref;
}
function triggerSummary(trigger) {
  if (!trigger || typeof trigger !== "object") return "Sem gatilho";
  if (trigger.type === "schedule" && trigger.schedule) {
    const s = trigger.schedule;
    const days = Array.isArray(s.weekdays) && s.weekdays.length ? ` (${s.weekdays.map((d) => WEEKDAY[d] || d).join(", ")})` : "";
    const when = s.time ? ` \xE0s ${s.time}` : "";
    const detail = s.detail ? ` \xB7 ${s.detail}` : "";
    return `${CADENCE[s.cadence] || s.cadence}${days}${when}${detail}`;
  }
  if (trigger.type === "event" && trigger.event) {
    return `Evento: ${trigger.event.events.join(", ")}${trigger.event.source_ref ? ` (${trigger.event.source_ref})` : ""}`;
  }
  if (trigger.type === "person" && trigger.person) {
    return `Pedido${trigger.person.requester_ref ? ` de ${personLabel(trigger.person.requester_ref)}` : ""}: ${trigger.person.description}`;
  }
  return String(trigger.type || "Sem gatilho");
}
function cadenceSummary(cadence) {
  if (!cadence) return "N\xE3o declarada";
  const when = cadence.time ? ` \xE0s ${cadence.time}${cadence.timezone ? ` (${cadence.timezone})` : ""}` : "";
  const detail = cadence.detail ? ` \xB7 ${cadence.detail}` : "";
  return `${CADENCE[cadence.kind] || cadence.kind}${when}${detail}`;
}
function unavailable(reason, now) {
  return { available: false, reason, generated_at: now.toISOString(), counts: {}, areas: [], systems: [], cycles: [], workflows: [], journeys: [], artifacts: [], sources: [], packages: [], agents: [], people: [], validation: { errors: [], warnings: [] } };
}
function buildCatalogReadModel(root, { now = /* @__PURE__ */ new Date() } = {}) {
  let catalog;
  try {
    catalog = readCatalog(root);
  } catch (error) {
    return unavailable(error.message, now);
  }
  const validation = validateCatalog(catalog);
  const lock = lockDocument(catalog);
  const lockMatches = catalog.lock !== null && canonicalJson(catalog.lock) === canonicalJson(lock);
  const areaById = new Map(catalog.areas.map((item) => [item.area_id, item]));
  const systemById = new Map(catalog.systems.map((item) => [item.system_id, item]));
  const workflowById = new Map(catalog.workflows.map((item) => [item.workflow_id, item]));
  const agentById = new Map(catalog.agents.map((item) => [item.agent_id, item]));
  const sourceById = new Map(catalog.sources.map((item) => [item.source_id, item]));
  const artifactById = new Map(catalog.artifacts.map((item) => [item.artifact_id, item]));
  const packageBySystem = new Map(catalog.packages.filter((item) => item.subject?.type === "system").map((item) => [item.subject.ref, item]));
  const areaName = (ref) => areaById.get(ref)?.name ?? ref ?? "\u2014";
  const systemName = (ref) => systemById.get(ref)?.name ?? ref ?? "\u2014";
  const workflowName = (ref) => workflowById.get(ref)?.name ?? ref ?? "\u2014";
  const sourceName = (ref) => sourceById.get(ref)?.name ?? ref ?? "\u2014";
  const executorLabel = (executor) => {
    if (!executor) return "\u2014";
    if (executor.kind === "person") return personLabel(executor.ref);
    if (executor.kind === "agent") return agentById.get(executor.ref)?.name ?? executor.ref;
    return executor.ref;
  };
  const producedBy = /* @__PURE__ */ new Map();
  const consumedBy = /* @__PURE__ */ new Map();
  for (const artifact of catalog.artifacts) {
    for (const link of artifact.produced_by) producedBy.set(link.workflow_ref, [...producedBy.get(link.workflow_ref) ?? [], artifact.artifact_id]);
    for (const link of artifact.consumed_by) consumedBy.set(link.workflow_ref, [...consumedBy.get(link.workflow_ref) ?? [], artifact.artifact_id]);
  }
  const unique6 = (items) => [...new Set(items)];
  const workflows = catalog.workflows.map((workflow) => ({
    workflow_id: workflow.workflow_id,
    name: workflow.name,
    version: workflow.version,
    status: workflow.status,
    scope: workflow.scope,
    kind: workflow.kind,
    alias: workflow.alias,
    area_ref: workflow.area_ref,
    area_name: areaName(workflow.area_ref),
    system_ref: workflow.system_ref,
    system_name: workflow.system_ref ? systemName(workflow.system_ref) : null,
    cycle: workflow.cycle ? {
      cycle_ref: workflow.cycle.cycle_ref,
      cycle_name: workflow.cycle.cycle_ref ? workflowName(workflow.cycle.cycle_ref) : null,
      variant: workflow.cycle.variant,
      journey_ref: workflow.cycle.journey_ref ?? null,
      lanes: workflow.cycle.lanes.map((lane) => ({ system_ref: lane.system_ref, system_name: systemName(lane.system_ref), measure: lane.measure }))
    } : null,
    trigger: { type: workflow.trigger.type, summary: triggerSummary(workflow.trigger), schedule: workflow.trigger.schedule },
    responsible_ref: workflow.responsible_ref,
    responsible: personLabel(workflow.responsible_ref),
    result: workflow.result,
    steps: workflow.steps.map((step, index) => ({
      index: index + 1,
      step_id: step.step_id,
      name: step.name,
      system_ref: step.system_ref,
      system_name: step.system_ref ? systemName(step.system_ref) : null,
      executor: { kind: step.executor.kind, ref: step.executor.ref, label: executorLabel(step.executor), kind_label: CATALOG_VIEW_LABELS.executor[step.executor.kind] || step.executor.kind },
      package_ref: step.package_ref,
      verbs: step.verbs,
      submission_criterion: step.submission_criterion,
      idempotency: step.idempotency,
      requires: step.requires,
      handoff_ref: step.handoff_ref,
      child_workflow_ref: step.child_workflow_ref,
      child_workflow_name: step.child_workflow_ref ? workflowName(step.child_workflow_ref) : null,
      optional: step.optional
    })),
    handoffs: workflow.handoffs.map((handoff) => ({
      ...handoff,
      from_system_name: systemName(handoff.from_system_ref),
      to_system_name: systemName(handoff.to_system_ref),
      artifact_name: artifactById.get(handoff.artifact_type)?.name ?? handoff.artifact_type,
      opens_workflow_name: handoff.opens_workflow_ref ? workflowName(handoff.opens_workflow_ref) : null
    })),
    legacy: {
      placement: workflow.legacy.placement,
      placement_label: CATALOG_VIEW_LABELS.placement[workflow.legacy.placement] || workflow.legacy.placement,
      routine_refs: workflow.legacy.routine_refs,
      system_refs: workflow.legacy.system_refs,
      skill_refs: workflow.legacy.skill_refs,
      workflow_definition_ref: workflow.legacy.workflow_definition_ref,
      notes: workflow.legacy.notes
    },
    produces: unique6(producedBy.get(workflow.workflow_id) ?? []).map((id3) => ({ artifact_id: id3, name: artifactById.get(id3)?.name ?? id3 })),
    consumes: unique6(consumedBy.get(workflow.workflow_id) ?? []).map((id3) => ({ artifact_id: id3, name: artifactById.get(id3)?.name ?? id3 })),
    parents: catalog.workflows.filter((parent) => parent.steps.some((step) => step.child_workflow_ref === workflow.workflow_id)).map((parent) => ({ workflow_id: parent.workflow_id, name: parent.name }))
  }));
  const workflowView = new Map(workflows.map((item) => [item.workflow_id, item]));
  const cycles = workflows.filter((item) => item.kind === "cycle").map((cycle) => ({
    ...cycle,
    variants: workflows.filter((item) => item.kind === "cycle-variant" && item.cycle?.cycle_ref === cycle.workflow_id).map((item) => ({ workflow_id: item.workflow_id, name: item.name, status: item.status, trigger: item.trigger.summary }))
  }));
  const systems = catalog.systems.map((system) => {
    const org = system.organization;
    const pkg = packageBySystem.get(system.system_id) ?? null;
    const systemWorkflows = system.workflow_refs.map((ref) => workflowView.get(ref)).filter(Boolean);
    return {
      system_id: system.system_id,
      name: system.name,
      status: system.status,
      kind: system.kind,
      kind_label: CATALOG_VIEW_LABELS.kind[system.kind] || system.kind,
      area_ref: org.area_ref,
      area_name: areaName(org.area_ref),
      sub_area_ref: org.sub_area_ref,
      client: org.client,
      result: org.result,
      measure: org.measure,
      owner_ref: org.owner_ref,
      owner: personLabel(org.owner_ref),
      responsible_refs: org.responsible_refs,
      responsibles: org.responsible_refs.map(personLabel),
      workflows: systemWorkflows.map((item) => ({
        workflow_id: item.workflow_id,
        name: item.name,
        status: item.status,
        kind: item.kind,
        alias: item.alias,
        scope: item.scope,
        trigger: item.trigger.summary,
        trigger_type: item.trigger.type,
        responsible: item.responsible,
        steps: item.steps.length,
        placement_label: item.legacy.placement_label
      })),
      counts: {
        workflows: systemWorkflows.length,
        rotinas: systemWorkflows.filter((item) => item.alias === "rotina").length,
        active: systemWorkflows.filter((item) => item.status === "active").length
      },
      sources: catalog.sources.filter((source) => source.preparation.owner_system_ref === system.system_id).map((source) => ({ source_id: source.source_id, name: source.name })),
      artifacts: catalog.artifacts.filter((artifact) => artifact.system_ref === system.system_id).map((artifact) => ({ artifact_id: artifact.artifact_id, name: artifact.name, role: artifact.role })),
      package: pkg ? { package_id: pkg.package_id, name: pkg.name, status: pkg.status, prefix: pkg.prefix, grants: pkg.legacy.grant_refs.length } : null,
      legacy: { system_refs: system.legacy.system_refs, notes: system.legacy.notes },
      contract_ref: system.contract_ref
    };
  });
  const systemView = new Map(systems.map((item) => [item.system_id, item]));
  const areas = catalog.areas.map((area) => {
    const areaSystems = area.system_refs.map((ref) => systemView.get(ref)).filter(Boolean);
    const areaWorkflows = workflows.filter((item) => item.area_ref === area.area_id);
    return {
      area_id: area.area_id,
      name: area.name,
      status: area.status,
      leader_ref: area.leader_ref,
      leader: area.leader_ref ? personLabel(area.leader_ref) : "A escolher",
      measure: area.measure,
      sub_areas: area.sub_areas.map((sub) => ({ ...sub, owner: personLabel(sub.owner_ref) })),
      systems: areaSystems.map((item) => ({ system_id: item.system_id, name: item.name, status: item.status, kind: item.kind, owner: item.owner, workflows: item.counts.workflows })),
      cycles: area.cycle_refs.map((ref) => cycles.find((item) => item.workflow_id === ref)).filter(Boolean).map((cycle) => ({
        workflow_id: cycle.workflow_id,
        name: cycle.name,
        status: cycle.status,
        journey_ref: cycle.cycle?.journey_ref ?? null,
        lanes: cycle.cycle.lanes,
        variants: cycle.variants
      })),
      workflows: area.workflow_refs.map((ref) => workflowView.get(ref)).filter(Boolean).map((item) => ({ workflow_id: item.workflow_id, name: item.name, status: item.status, kind: item.kind, alias: item.alias, trigger: item.trigger.summary, responsible: item.responsible, steps: item.steps.length, placement_label: item.legacy.placement_label })),
      decision_rule: area.decision_rule,
      open_items: area.open_items,
      notes: area.notes ?? null,
      counts: {
        systems: areaSystems.length,
        workflows: areaWorkflows.length,
        rotinas: areaWorkflows.filter((item) => item.alias === "rotina").length,
        cycles: area.cycle_refs.length,
        artifacts: catalog.artifacts.filter((item) => item.area_ref === area.area_id).length,
        sources: catalog.sources.filter((item) => item.preparation.owner_area_ref === area.area_id).length
      }
    };
  });
  const journeys = catalog.journeys.map((journey) => ({
    journey_id: journey.journey_id,
    name: journey.name,
    status: journey.status,
    area_ref: journey.area_ref,
    area_name: areaName(journey.area_ref),
    model: journey.model,
    subject: journey.subject,
    stages: [...journey.stages].sort((a, b) => a.order - b.order).map((stage) => ({
      stage_id: stage.stage_id,
      name: stage.name,
      side: stage.side,
      side_label: CATALOG_VIEW_LABELS.side[stage.side] || stage.side,
      order: stage.order,
      system_ref: stage.system_ref,
      system_name: systemName(stage.system_ref),
      owner_ref: stage.owner_ref,
      owner: personLabel(stage.owner_ref),
      entry_criterion: stage.entry_criterion,
      exit_criterion: stage.exit_criterion,
      measures: Object.entries(stage.measures).map(([type, measure]) => ({ type, type_label: CATALOG_VIEW_LABELS.measure[type] || type, ...measure, source_name: measure.source_ref ? sourceName(measure.source_ref) : null })),
      spiced_fields: stage.spiced_fields.map((field) => ({ field, label: CATALOG_VIEW_LABELS.spiced[field] || field })),
      touchpoints: stage.touchpoint_source_refs.map((ref) => ({ source_id: ref, name: sourceName(ref) })),
      workflows: stage.workflow_refs.map((ref) => ({ workflow_id: ref, name: workflowName(ref), status: workflowById.get(ref)?.status ?? null })),
      next_stage_refs: stage.next_stage_refs
    })),
    node: { ...journey.node, handoff_artifact_name: artifactById.get(journey.node.handoff_artifact_ref)?.name ?? journey.node.handoff_artifact_ref, opens_cycle_name: workflowName(journey.node.opens_cycle_ref) },
    loop: { ...journey.loop, artifact_name: artifactById.get(journey.loop.artifact_ref)?.name ?? journey.loop.artifact_ref, identified_by_name: systemName(journey.loop.identified_by_system_ref), closed_by_name: systemName(journey.loop.closed_by_system_ref) },
    cycle_refs: journey.cycle_refs.map((ref) => ({ workflow_id: ref, name: workflowName(ref) })),
    instance: { ...journey.instance, store_name: sourceName(journey.instance.store_ref) },
    notes: journey.legacy.notes,
    counts: { stages: journey.stages.length, decided_measures: journey.stages.reduce((total, stage) => total + Object.values(stage.measures).filter((measure) => measure.decided).length, 0), total_measures: journey.stages.length * 4 }
  }));
  const artifacts2 = catalog.artifacts.map((artifact) => ({
    artifact_id: artifact.artifact_id,
    name: artifact.name,
    status: artifact.status,
    kind: artifact.kind,
    role: artifact.role,
    area_ref: artifact.area_ref,
    area_name: areaName(artifact.area_ref),
    system_ref: artifact.system_ref,
    system_name: artifact.system_ref ? systemName(artifact.system_ref) : null,
    owner_ref: artifact.owner_ref,
    owner: personLabel(artifact.owner_ref),
    parent_ref: artifact.parent_ref,
    parent_name: artifact.parent_ref ? artifactById.get(artifact.parent_ref)?.name ?? artifact.parent_ref : null,
    versioning: { ...artifact.versioning, links_to: artifact.versioning.links_to_version_of.map((ref) => ({ artifact_id: ref, name: artifactById.get(ref)?.name ?? ref })) },
    validity: artifact.validity,
    produced_by: artifact.produced_by.map((link) => ({ ...link, workflow_name: workflowName(link.workflow_ref) })),
    consumed_by: artifact.consumed_by.map((link) => ({ ...link, workflow_name: workflowName(link.workflow_ref) })),
    schema_ref: artifact.schema_ref,
    experiments: artifact.experiments,
    notes: artifact.legacy.notes,
    registry_refs: artifact.legacy.registry_refs
  }));
  const sources = catalog.sources.map((source) => ({
    source_id: source.source_id,
    name: source.name,
    layers: source.preparation.layers,
    layer_labels: source.preparation.layers.map((layer) => CATALOG_VIEW_LABELS.layer[layer] || layer),
    cadence: cadenceSummary(source.preparation.cadence),
    sensitivity: source.preparation.sensitivity,
    owner_area_ref: source.preparation.owner_area_ref,
    owner_area_name: areaName(source.preparation.owner_area_ref),
    owner_system_ref: source.preparation.owner_system_ref,
    owner_system_name: source.preparation.owner_system_ref ? systemName(source.preparation.owner_system_ref) : null,
    preparer_workflow_ref: source.preparation.preparer_workflow_ref,
    preparer_workflow_name: source.preparation.preparer_workflow_ref ? workflowName(source.preparation.preparer_workflow_ref) : null,
    notes: source.legacy.notes
  }));
  const packages = catalog.packages.map((pkg) => ({
    package_id: pkg.package_id,
    name: pkg.name,
    prefix: pkg.prefix,
    status: pkg.status,
    subject: { ...pkg.subject, name: pkg.subject.type === "system" ? systemName(pkg.subject.ref) : pkg.subject.type === "agent" ? agentById.get(pkg.subject.ref)?.name ?? pkg.subject.ref : personLabel(pkg.subject.ref) },
    area_ref: pkg.area_ref,
    area_name: areaName(pkg.area_ref),
    grantor_ref: pkg.grantor_ref,
    grantor: personLabel(pkg.grantor_ref),
    verbs: pkg.verbs,
    collections: pkg.collections.map((collection) => ({ collection_id: collection.collection_id, layer: collection.layer, area_ref: collection.area_ref, source_refs: collection.source_refs, sources: collection.source_refs.map(sourceName) })),
    grants: pkg.legacy.grant_refs.length,
    grant_refs: pkg.legacy.grant_refs,
    notes: pkg.legacy.notes
  }));
  const agents = catalog.agents.map((agent) => ({
    agent_id: agent.agent_id,
    name: agent.name,
    status: agent.status,
    principal_ref: agent.identity?.principal_ref ?? null,
    principal: agent.identity?.principal_ref ? personLabel(agent.identity.principal_ref) : "\u2014",
    placement: agent.identity?.placement ?? null,
    mandate: { mode: agent.mandate.mode, on_behalf_of: agent.mandate.on_behalf_of_ref ? personLabel(agent.mandate.on_behalf_of_ref) : null, workflows: agent.mandate.workflow_refs.map((ref) => ({ workflow_id: ref, name: workflowName(ref) })), systems: agent.mandate.system_refs.map((ref) => ({ system_id: ref, name: systemName(ref) })), external_actions: agent.mandate.external_actions, approval_required: agent.mandate.approval_required },
    package_refs: agent.package_refs,
    memory_enabled: agent.memory?.enabled ?? false,
    steps: workflows.reduce((total, workflow) => total + workflow.steps.filter((step) => step.executor.kind === "agent" && step.executor.ref === agent.agent_id).length, 0)
  }));
  const people = /* @__PURE__ */ new Map();
  const person = (ref) => {
    if (!ref || agentById.has(ref)) return null;
    if (!people.has(ref)) people.set(ref, { ref, label: personLabel(ref), leads: [], owns_systems: [], owns_sub_areas: [], responsible_for: [], executes_steps: 0, owns_artifacts: [], grants_packages: [], owns_stages: [] });
    return people.get(ref);
  };
  for (const area of catalog.areas) {
    person(area.leader_ref)?.leads.push({ area_id: area.area_id, name: area.name });
    for (const sub of area.sub_areas) person(sub.owner_ref)?.owns_sub_areas.push({ area_id: area.area_id, sub_area_id: sub.sub_area_id, name: sub.name });
  }
  for (const system of catalog.systems) person(system.organization.owner_ref)?.owns_systems.push({ system_id: system.system_id, name: system.name });
  for (const workflow of catalog.workflows) {
    person(workflow.responsible_ref)?.responsible_for.push({ workflow_id: workflow.workflow_id, name: workflow.name });
    for (const step of workflow.steps) if (step.executor.kind === "person") {
      const entry = person(step.executor.ref);
      if (entry) entry.executes_steps += 1;
    }
  }
  for (const artifact of catalog.artifacts) person(artifact.owner_ref)?.owns_artifacts.push({ artifact_id: artifact.artifact_id, name: artifact.name });
  for (const pkg of catalog.packages) person(pkg.grantor_ref)?.grants_packages.push({ package_id: pkg.package_id, name: pkg.name });
  for (const journey of catalog.journeys) for (const stage of journey.stages) person(stage.owner_ref)?.owns_stages.push({ journey_id: journey.journey_id, stage_id: stage.stage_id, name: stage.name });
  return {
    available: true,
    generated_at: now.toISOString(),
    catalog_version: catalog.index.catalog_version ?? null,
    catalog_name: catalog.index.name ?? null,
    catalog_sha256: lock.catalog_sha256,
    lock_matches: lockMatches,
    counts: validation.summary,
    validation: { errors: validation.errors, warnings: validation.warnings },
    areas,
    systems,
    cycles,
    workflows,
    journeys,
    artifacts: artifacts2,
    sources,
    packages,
    agents,
    people: [...people.values()].sort((a, b) => a.label.localeCompare(b.label, "pt-BR"))
  };
}

// ../scripts/lib/painel-evidence.mjs
import { readFileSync as readFileSync22, realpathSync as realpathSync13, statSync as statSync7, readdirSync as readdirSync18, lstatSync as lstatSync16, openSync as openSync5, readSync as readSync2, closeSync as closeSync5 } from "node:fs";
import { resolve as resolve22, relative as relative21, dirname as dirname8, sep as sep22 } from "node:path";

// ../scripts/lib/graph-read-model.mjs
import { createHash as createHash7 } from "node:crypto";
import { existsSync as existsSync21, readdirSync as readdirSync16 } from "node:fs";
import { basename as basename2, join as join20 } from "node:path";

// ../scripts/lib/canvas-layout-runtime.mjs
import { existsSync as existsSync3, mkdirSync as mkdirSync2, readFileSync as readFileSync4, realpathSync as realpathSync3 } from "node:fs";
import { join as join3, relative as relative3, resolve as resolve3, sep as sep3 } from "node:path";

// ../scripts/lib/system-protocol.mjs
import {
  appendFileSync,
  existsSync as existsSync2,
  lstatSync as lstatSync2,
  mkdirSync,
  readFileSync as readFileSync3,
  readdirSync,
  realpathSync as realpathSync2,
  renameSync,
  writeFileSync
} from "node:fs";
import { dirname, isAbsolute, join as join2, relative as relative2, resolve as resolve2, sep as sep2 } from "node:path";

// ../scripts/lib/execution-context.mjs
import { readFileSync as readFileSync2 } from "node:fs";
var executionContextSchema = JSON.parse(readFileSync2(
  new URL("../../protocol/execution-context.schema.json", import.meta.url),
  "utf8"
));
var timestamp = (value) => typeof value === "string" && /^\d{4}-\d\d-\d\dT/.test(value) && Number.isFinite(Date.parse(value)) && new Date(value).toISOString() === value;
function validateExecutionContext(value) {
  const errors = validateJsonSchema(value, executionContextSchema);
  if (errors.length) return errors;
  if (value.items.length > 256) errors.push("execution_context.items excessivo");
  if (!timestamp(value.observed_at)) errors.push("execution_context.observed_at inv\xE1lido");
  for (const item of value.items) {
    if (!item.version && !item.digest) errors.push("execution_context exige vers\xE3o ou hash");
    if (!timestamp(item.window.from) || !timestamp(item.window.until) || Date.parse(item.window.from) >= Date.parse(item.window.until) || Date.parse(item.window.until) > Date.parse(value.observed_at)) {
      errors.push("execution_context.window inv\xE1lida");
    }
    if (/\b(?:sk-|ghp_|github_pat_|Bearer)/i.test(JSON.stringify(item))) errors.push("execution_context refer\xEAncia inv\xE1lida");
  }
  return [...new Set(errors)];
}
function validateExecutionContextForRecord(record2) {
  const errors = validateExecutionContext(record2.execution_context);
  if (errors.length) return errors;
  const observed = Date.parse(record2.execution_context.observed_at);
  if (record2.completed_at && observed > Date.parse(record2.completed_at)) errors.push("execution_context posterior ao run");
  return errors;
}

// ../scripts/lib/context-consumption-policy.mjs
var CONTEXT_LAYERS = Object.freeze([
  "raw",
  "organized",
  "distilled",
  "period_summary",
  "atoms",
  "projection",
  "profile",
  "index"
]);
var DURATION_PATTERN = "^P(?=.+)(?:[0-9]+(?:\\.[0-9]+)?W|(?:[0-9]+D)?(?:T(?=.+)(?:[0-9]+H)?(?:[0-9]+M)?(?:[0-9]+(?:\\.[0-9]+)?S)?)?)$";
var PARTITION_PATTERN = "^(?!all$|whole-source$|source$)[A-Za-z0-9][A-Za-z0-9_.:-]{0,127}$";
var durationRe = new RegExp(DURATION_PATTERN);
var partitionRe = new RegExp(PARTITION_PATTERN);
var partitionsOf = (value) => Array.isArray(value) ? value : [value];
function durationMilliseconds(value) {
  if (typeof value !== "string" || !durationRe.test(value)) return null;
  const units = { W: 604800, D: 86400, H: 3600, M: 60, S: 1 };
  const result = [...value.matchAll(/(\d+(?:\.\d+)?)([WDHMS])/g)].reduce((sum, [, count, unit]) => sum + Number(count) * units[unit] * 1e3, 0);
  return Number.isFinite(result) && result <= Number.MAX_SAFE_INTEGER ? result : null;
}
function validPartition(value) {
  const values = partitionsOf(value);
  return values.length > 0 && values.length <= 128 && new Set(values).size === values.length && values.every((item) => typeof item === "string" && partitionRe.test(item));
}
function validateConsumptionRole(item, path) {
  const errors = [];
  if (item.layer !== void 0 && !CONTEXT_LAYERS.includes(item.layer)) errors.push(`${path}.layer inv\xE1lido`);
  if (item.partition !== void 0 && !validPartition(item.partition)) errors.push(`${path}.partition exige recorte opaco expl\xEDcito`);
  if (item.raw_reason !== void 0 && (typeof item.raw_reason !== "string" || !item.raw_reason.trim() || item.raw_reason.length > 512)) errors.push(`${path}.raw_reason inv\xE1lido`);
  const freshness = item.required_freshness;
  if (typeof freshness === "string") {
    if (!freshness.trim()) errors.push(`${path}.required_freshness precisa ser texto n\xE3o vazio`);
  } else if (!freshness || typeof freshness !== "object" || Array.isArray(freshness) || Object.keys(freshness).sort().join(",") !== "block,warn") {
    errors.push(`${path}.required_freshness exige texto ou {warn, block}`);
  } else {
    const warn = durationMilliseconds(freshness.warn), block = durationMilliseconds(freshness.block);
    if (warn === null || block === null) errors.push(`${path}.required_freshness exige dura\xE7\xE3o ISO-8601 fixa`);
    else if (warn > block) errors.push(`${path}.required_freshness.warn n\xE3o pode exceder block`);
  }
  return errors;
}
function consumptionWarnings(contract) {
  return (Array.isArray(contract?.retrieval?.source_roles) ? contract.retrieval.source_roles : []).flatMap((item, index) => item?.layer === "raw" && (typeof item.raw_reason !== "string" || !item.raw_reason.trim()) ? [`retrieval.source_roles[${index}].raw_reason obrigat\xF3rio para layer=raw`] : []);
}

// ../scripts/lib/privacy-disclosure.mjs
var VENDOR_DISCLOSURE_KEY = "content_shared_with_vendor";
var LEGACY_DISCLOSURE_KEY = "content_shared_with_inevita";
var DISCLOSURE_KEYS = Object.freeze([LEGACY_DISCLOSURE_KEY, VENDOR_DISCLOSURE_KEY]);
var DISCLOSURE_KEY_SET = new Set(DISCLOSURE_KEYS);
function object3(value) {
  return value !== null && typeof value === "object" && !Array.isArray(value);
}
function isDisclosureKey(key2) {
  return typeof key2 === "string" && DISCLOSURE_KEY_SET.has(key2);
}
function presentDisclosureKeys(privacy) {
  if (!object3(privacy)) return [];
  return DISCLOSURE_KEYS.filter((key2) => Object.hasOwn(privacy, key2));
}
function disclosureKeyOf(privacy) {
  const present = presentDisclosureKeys(privacy);
  return present.length === 1 ? present[0] : null;
}
function disclosureValue(privacy) {
  const key2 = disclosureKeyOf(privacy);
  return key2 === null ? null : privacy[key2];
}
function hasValidDisclosure(privacy) {
  return disclosureValue(privacy) === false;
}
function disclosureErrors(errors, privacy, path = "privacy") {
  if (!object3(privacy)) {
    errors.push(`${path} precisa ser objeto`);
    return errors;
  }
  const present = presentDisclosureKeys(privacy);
  if (present.length === 0) {
    errors.push(`${path}.${VENDOR_DISCLOSURE_KEY} ausente`);
    return errors;
  }
  if (present.length > 1) {
    errors.push(`${path} declara v1 e v2 ao mesmo tempo; use s\xF3 ${VENDOR_DISCLOSURE_KEY}`);
    return errors;
  }
  if (privacy[present[0]] !== false) {
    errors.push(`${path}.${VENDOR_DISCLOSURE_KEY} precisa ser false`);
  }
  return errors;
}
function privacyKeys(...other) {
  return [...DISCLOSURE_KEYS, ...other.flat()];
}
function hasExactPrivacyKeys(privacy, other = []) {
  if (!object3(privacy) || disclosureKeyOf(privacy) === null) return false;
  const expected = new Set(other);
  if (expected.size !== [...other].length) return false;
  const observed = Object.keys(privacy).filter((key2) => !isDisclosureKey(key2));
  return observed.length === expected.size && observed.every((key2) => expected.has(key2));
}
function hasExactPrivacyShape(privacy, other = []) {
  return hasValidDisclosure(privacy) && hasExactPrivacyKeys(privacy, other);
}
function emitPrivacy(other = {}) {
  if (!object3(other)) throw new TypeError("privacy extras precisam ser objeto");
  if (Object.keys(other).some(isDisclosureKey)) {
    throw new TypeError("privacy extras n\xE3o podem declarar divulga\xE7\xE3o");
  }
  return { [VENDOR_DISCLOSURE_KEY]: false, ...other };
}

// ../scripts/lib/company-brain-protocol-v2.mjs
var ID_RE = /^[a-z0-9][a-z0-9-]{0,63}$/;
var REF_RE = /^[A-Za-z0-9][A-Za-z0-9_-]{0,127}$/;
var LOCAL_REF_RE = /^(?!.*\.\.(?:\/|$))[A-Za-z0-9.][A-Za-z0-9_./:-]{0,255}$/;
var VERSION_RE = /^\d+\.\d+\.\d+(?:[-+][A-Za-z0-9.-]+)?$/;
var ACCEPTED_VERSION_RE = /^\d+(?:\.x|\.\d+(?:\.x|\.\d+)?)?$/;
var ASSURANCES = /* @__PURE__ */ new Set(["runtime-enforced", "receipt-audited", "exported"]);
var OPAQUE_REF_RE = /^[A-Za-z0-9][A-Za-z0-9_.:-]{0,127}$/;
var EXPERIMENT_ID_RE = /^EXP-[A-Za-z0-9_-]{1,48}$/;
var LOCAL_SOURCE_TYPES = /* @__PURE__ */ new Set([
  "local-folder",
  "local-file",
  "obsidian",
  "git-repository",
  "meetings-folder",
  "knowledge-workspace"
]);
var SECRET_VALUE_PATTERNS = Object.freeze([
  /\bBearer\s+[A-Za-z0-9._~+/=-]{8,}/i,
  /\b(?:sk|ghp|github_pat|xox[baprs]|AKIA)[-_A-Za-z0-9]{12,}\b/,
  /-----BEGIN (?:RSA |EC |OPENSSH )?PRIVATE KEY-----/,
  /\b[A-Za-z0-9_-]{20,}\.[A-Za-z0-9_-]{10,}\.[A-Za-z0-9_-]{10,}\b/,
  /https?:\/\/[^\s/:]+:[^\s/@]+@/
]);
var containsSecretValue = (value) => typeof value === "string" && SECRET_VALUE_PATTERNS.some((pattern) => pattern.test(value));
var FORBIDDEN_PAYLOAD_TERMS = [
  "raw",
  "bruto",
  "content",
  "body",
  "transcript",
  "transcription",
  "secret",
  "token",
  "password",
  "apikey",
  "privatekey"
];
function object4(value) {
  return value !== null && typeof value === "object" && !Array.isArray(value);
}
function closed(errors, value, path, keys) {
  if (!object4(value)) return;
  const allowed = new Set(keys);
  for (const key2 of Object.keys(value)) {
    if (!allowed.has(key2)) errors.push(`${path}.${key2} n\xE3o \xE9 permitido`);
  }
}
function string(errors, value, path) {
  if (typeof value !== "string" || !value.trim()) errors.push(`${path} precisa ser texto n\xE3o vazio`);
}
function list(errors, value, path, minimum = 0) {
  if (!Array.isArray(value)) errors.push(`${path} precisa ser lista`);
  else if (value.length < minimum) errors.push(`${path} precisa ter pelo menos ${minimum} item(ns)`);
}
function stringList(errors, value, path, minimum = 0) {
  list(errors, value, path, minimum);
  if (!Array.isArray(value)) return;
  for (const [index, item] of value.entries()) string(errors, item, `${path}[${index}]`);
}
function date(errors, value, path, nullable = false) {
  if (nullable && value === null) return;
  if (typeof value !== "string" || !Number.isFinite(Date.parse(value))) errors.push(`${path} inv\xE1lido`);
}
function unique(errors, values, path) {
  if (Array.isArray(values) && new Set(values).size !== values.length) {
    errors.push(`${path} n\xE3o pode repetir valores`);
  }
}
function referenceOnly(errors, value, path) {
  if (Array.isArray(value)) {
    value.forEach((item, index) => referenceOnly(errors, item, `${path}[${index}]`));
    return;
  }
  if (!object4(value)) {
    if (containsSecretValue(value)) {
      errors.push(`${path} parece conter segredo; use refer\xEAncia opaca`);
    }
    return;
  }
  for (const [key2, item] of Object.entries(value)) {
    const normalized = key2.replaceAll("_", "").replaceAll("-", "").toLowerCase();
    const forbidden = !isDisclosureKey(key2) && FORBIDDEN_PAYLOAD_TERMS.some((term) => normalized === term || normalized.startsWith(term) || normalized.endsWith(term));
    if (forbidden) {
      errors.push(`${path}.${key2} carrega payload/segredo; contrato aceita somente refer\xEAncia`);
      continue;
    }
    referenceOnly(errors, item, `${path}.${key2}`);
  }
}
function validateRef(errors, value, path) {
  if (!object4(value)) {
    errors.push(`${path} precisa ser objeto`);
    return;
  }
  closed(errors, value, path, ["role", "id"]);
  if (!ID_RE.test(value.role || "")) errors.push(`${path}.role inv\xE1lido`);
  if (!REF_RE.test(value.id || "")) errors.push(`${path}.id inv\xE1lido`);
}
function validateSystemShape(errors, value, version) {
  const top = [
    "protocol_version",
    "system_id",
    "name",
    "version",
    "status",
    "result",
    "trigger",
    "capability",
    "entities",
    "sources",
    "pipeline",
    "permissions",
    "eval",
    "learning",
    "extensions"
  ];
  if (version === 2) top.push("retrieval", "artifacts");
  closed(errors, value, "system_contract", top);
  closed(errors, value.result, "result", [
    "statement",
    "non_success",
    "output_type",
    "definition_of_done",
    "owner",
    "human_gate"
  ]);
  closed(errors, value.trigger, "trigger", ["type", "description"]);
  closed(errors, value.capability, "capability", ["capability_id", "version", "origin"]);
  for (const [index, entity] of (Array.isArray(value.entities) ? value.entities : []).entries()) {
    closed(errors, entity, `entities[${index}]`, ["type", "role", "required"]);
  }
  for (const [index, source] of (Array.isArray(value.sources) ? value.sources : []).entries()) {
    closed(errors, source, `sources[${index}]`, [
      "role",
      "source_id",
      "required",
      "access",
      "freshness",
      "purpose"
    ]);
  }
  for (const [index, state2] of (Array.isArray(value.pipeline) ? value.pipeline : []).entries()) {
    closed(errors, state2, `pipeline[${index}]`, ["state", "input", "output", "gate"]);
  }
  closed(errors, value.permissions, "permissions", ["read", "write", "external_actions"]);
  closed(errors, value.eval, "eval", [
    "version",
    "deterministic_gates",
    "human_questions",
    "outcome_measure",
    "baseline"
  ]);
  closed(errors, value.learning, "learning", [
    "correction_policy",
    "promotion_threshold",
    "requires_replay",
    "requires_human_approval"
  ]);
  if (value.extensions !== void 0 && !object4(value.extensions)) errors.push("extensions precisa ser objeto");
  if (object4(value.extensions) && value.extensions.interface_role !== void 0 && !ID_RE.test(value.extensions.interface_role || "")) {
    errors.push("extensions.interface_role inv\xE1lido");
  }
}
function validateRetrieval(errors, retrieval, sources) {
  if (!object4(retrieval)) {
    errors.push("retrieval precisa ser objeto");
    return;
  }
  closed(errors, retrieval, "retrieval", [
    "version",
    "source_roles",
    "conflict_policy",
    "fallback",
    "stop_conditions",
    "context_budget",
    "evidence"
  ]);
  if (!VERSION_RE.test(retrieval.version || "")) errors.push("retrieval.version precisa ser semver");
  list(errors, retrieval.source_roles, "retrieval.source_roles", 1);
  const declaredRoles = new Set((Array.isArray(sources) ? sources : []).map((source) => source?.role));
  const roles = [];
  const priorities = [];
  for (const [index, item] of (Array.isArray(retrieval.source_roles) ? retrieval.source_roles : []).entries()) {
    const path = `retrieval.source_roles[${index}]`;
    if (!object4(item)) {
      errors.push(`${path} precisa ser objeto`);
      continue;
    }
    closed(errors, item, path, [
      "role",
      "priority",
      "selection",
      "filters",
      "window",
      "required_freshness",
      "on_unavailable",
      "layer",
      "partition",
      "raw_reason"
    ]);
    if (!ID_RE.test(item.role || "")) errors.push(`${path}.role inv\xE1lido`);
    else if (!declaredRoles.has(item.role)) errors.push(`${path}.role n\xE3o existe em sources`);
    roles.push(item.role);
    if (!Number.isInteger(item.priority) || item.priority < 1) errors.push(`${path}.priority precisa ser inteiro >= 1`);
    priorities.push(item.priority);
    if (!["explicit", "recent", "relevant", "mixed"].includes(item.selection)) errors.push(`${path}.selection inv\xE1lido`);
    stringList(errors, item.filters, `${path}.filters`);
    string(errors, item.window, `${path}.window`);
    errors.push(...validateConsumptionRole(item, path));
    if (!["stop", "fallback", "continue-with-gap"].includes(item.on_unavailable)) {
      errors.push(`${path}.on_unavailable inv\xE1lido`);
    }
  }
  unique(errors, roles, "retrieval.source_roles.role");
  unique(errors, priorities, "retrieval.source_roles.priority");
  for (const source of Array.isArray(sources) ? sources : []) {
    if (source?.required && !roles.includes(source.role)) {
      errors.push(`retrieval n\xE3o declara a fonte obrigat\xF3ria ${source.role}`);
    }
  }
  string(errors, retrieval.conflict_policy, "retrieval.conflict_policy");
  if (!object4(retrieval.fallback)) errors.push("retrieval.fallback precisa ser objeto");
  else {
    closed(errors, retrieval.fallback, "retrieval.fallback", ["enabled", "order", "on_exhausted"]);
    if (typeof retrieval.fallback.enabled !== "boolean") errors.push("retrieval.fallback.enabled precisa ser booleano");
    list(errors, retrieval.fallback.order, "retrieval.fallback.order", retrieval.fallback.enabled ? 1 : 0);
    for (const [index, role] of (Array.isArray(retrieval.fallback.order) ? retrieval.fallback.order : []).entries()) {
      if (!ID_RE.test(role || "") || !declaredRoles.has(role)) errors.push(`retrieval.fallback.order[${index}] inv\xE1lido`);
    }
    unique(errors, retrieval.fallback.order, "retrieval.fallback.order");
    if (!["stop", "continue-with-gap"].includes(retrieval.fallback.on_exhausted)) {
      errors.push("retrieval.fallback.on_exhausted inv\xE1lido");
    }
  }
  stringList(errors, retrieval.stop_conditions, "retrieval.stop_conditions", 1);
  if (!object4(retrieval.context_budget)) errors.push("retrieval.context_budget precisa ser objeto");
  else {
    closed(errors, retrieval.context_budget, "retrieval.context_budget", ["unit", "maximum", "per_source_maximum"]);
    if (!["tokens", "items", "characters"].includes(retrieval.context_budget.unit)) errors.push("retrieval.context_budget.unit inv\xE1lido");
    if (!Number.isInteger(retrieval.context_budget.maximum) || retrieval.context_budget.maximum < 1) {
      errors.push("retrieval.context_budget.maximum precisa ser inteiro >= 1");
    }
    const perSource = retrieval.context_budget.per_source_maximum;
    if (perSource !== null && (!Number.isInteger(perSource) || perSource < 1)) {
      errors.push("retrieval.context_budget.per_source_maximum precisa ser null ou inteiro >= 1");
    }
    if (Number.isInteger(perSource) && Number.isInteger(retrieval.context_budget.maximum) && perSource > retrieval.context_budget.maximum) {
      errors.push("retrieval.context_budget.per_source_maximum n\xE3o pode exceder maximum");
    }
  }
  if (!object4(retrieval.evidence)) errors.push("retrieval.evidence precisa ser objeto");
  else {
    closed(errors, retrieval.evidence, "retrieval.evidence", ["required", "provenance", "minimum_refs"]);
    if (retrieval.evidence.required !== true) errors.push("retrieval.evidence.required precisa ser true");
    if (!["per-item", "per-claim"].includes(retrieval.evidence.provenance)) errors.push("retrieval.evidence.provenance inv\xE1lido");
    if (!Number.isInteger(retrieval.evidence.minimum_refs) || retrieval.evidence.minimum_refs < 1) {
      errors.push("retrieval.evidence.minimum_refs precisa ser inteiro >= 1");
    }
  }
  referenceOnly(errors, { ...retrieval, source_roles: (Array.isArray(retrieval.source_roles) ? retrieval.source_roles : []).map((item) => object4(item) ? Object.fromEntries(Object.entries(item).filter(([key2]) => key2 !== "raw_reason")) : item) }, "retrieval");
  for (const item of Array.isArray(retrieval.source_roles) ? retrieval.source_roles : []) {
    if (containsSecretValue(item?.raw_reason)) errors.push("retrieval.raw_reason parece conter segredo");
  }
}
function validateArtifacts(errors, artifacts2) {
  if (!object4(artifacts2)) {
    errors.push("artifacts precisa ser objeto");
    return;
  }
  closed(errors, artifacts2, "artifacts", ["produces", "consumes"]);
  list(errors, artifacts2.produces, "artifacts.produces");
  list(errors, artifacts2.consumes, "artifacts.consumes");
  if (Array.isArray(artifacts2.produces) && Array.isArray(artifacts2.consumes) && artifacts2.produces.length + artifacts2.consumes.length === 0) {
    errors.push("artifacts precisa declarar ao menos um produces ou consumes");
  }
  const produceRoles = [];
  for (const [index, item] of (Array.isArray(artifacts2.produces) ? artifacts2.produces : []).entries()) {
    const path = `artifacts.produces[${index}]`;
    if (!object4(item)) {
      errors.push(`${path} precisa ser objeto`);
      continue;
    }
    closed(errors, item, path, ["role", "artifact_type", "schema_ref", "schema_version", "sensitivity"]);
    if (!ID_RE.test(item.role || "")) errors.push(`${path}.role inv\xE1lido`);
    produceRoles.push(item.role);
    if (!ID_RE.test(item.artifact_type || "")) errors.push(`${path}.artifact_type inv\xE1lido`);
    if (!LOCAL_REF_RE.test(item.schema_ref || "")) errors.push(`${path}.schema_ref inv\xE1lido`);
    if (!VERSION_RE.test(item.schema_version || "")) errors.push(`${path}.schema_version precisa ser semver`);
    if (!["private", "team", "public"].includes(item.sensitivity)) errors.push(`${path}.sensitivity inv\xE1lido`);
  }
  unique(errors, produceRoles, "artifacts.produces.role");
  const consumeRoles = [];
  for (const [index, item] of (Array.isArray(artifacts2.consumes) ? artifacts2.consumes : []).entries()) {
    const path = `artifacts.consumes[${index}]`;
    if (!object4(item)) {
      errors.push(`${path} precisa ser objeto`);
      continue;
    }
    closed(errors, item, path, ["role", "artifact_type", "schema_ref", "accepted_versions", "required"]);
    if (!ID_RE.test(item.role || "")) errors.push(`${path}.role inv\xE1lido`);
    consumeRoles.push(item.role);
    if (!ID_RE.test(item.artifact_type || "")) errors.push(`${path}.artifact_type inv\xE1lido`);
    if (!LOCAL_REF_RE.test(item.schema_ref || "")) errors.push(`${path}.schema_ref inv\xE1lido`);
    list(errors, item.accepted_versions, `${path}.accepted_versions`, 1);
    for (const [rangeIndex, range] of (Array.isArray(item.accepted_versions) ? item.accepted_versions : []).entries()) {
      if (!ACCEPTED_VERSION_RE.test(range || "")) errors.push(`${path}.accepted_versions[${rangeIndex}] inv\xE1lido`);
    }
    unique(errors, item.accepted_versions, `${path}.accepted_versions`);
    if (typeof item.required !== "boolean") errors.push(`${path}.required precisa ser booleano`);
  }
  unique(errors, consumeRoles, "artifacts.consumes.role");
  referenceOnly(errors, artifacts2, "artifacts");
}
function validateSystemContractVersion(value, validateV1, { strictRawReason = false, warnings = [] } = {}) {
  if (!object4(value)) return ["system contract precisa ser objeto"];
  if (value.protocol_version === 1) {
    const errors2 = validateV1(value);
    validateSystemShape(errors2, value, 1);
    return [...new Set(errors2)];
  }
  if (value.protocol_version !== 2) return ["protocol_version de System Contract suportada: 1 ou 2"];
  const base = { ...value, protocol_version: 1 };
  delete base.retrieval;
  delete base.artifacts;
  const errors = validateV1(base).filter((error) => error !== "protocol_version precisa ser 1");
  validateSystemShape(errors, value, 2);
  list(errors, value.sources, "sources", 1);
  validateRetrieval(errors, value.retrieval, value.sources);
  const notices = consumptionWarnings(value);
  warnings.push(...notices);
  if (strictRawReason) errors.push(...notices);
  if (value.artifacts !== void 0) validateArtifacts(errors, value.artifacts);
  return [...new Set(errors)];
}
function validateRunShape(errors, value, version) {
  const top = [
    "protocol_version",
    "run_id",
    "system_id",
    "system_version",
    "capability",
    "status",
    "started_at",
    "completed_at",
    "entity_refs",
    "source_refs",
    "output_refs",
    "eval",
    "human_decision",
    "correction_ref",
    "outcomes",
    "privacy",
    "extensions"
  ];
  if (version === 2) top.push("context_snapshot", "execution_context", "chain_id", "mode", "experiment_ref", "handoff_refs");
  closed(errors, value, "run_record", top);
  if (value.execution_context !== void 0) errors.push(...validateExecutionContextForRecord(value));
  if (value.capability !== void 0 && value.capability !== null) {
    if (!object4(value.capability)) errors.push("capability precisa ser objeto ou null");
    else {
      closed(errors, value.capability, "capability", ["capability_id", "version"]);
      if (!ID_RE.test(value.capability.capability_id || "")) errors.push("capability.capability_id inv\xE1lido");
      string(errors, value.capability.version, "capability.version");
    }
  }
  for (const [index, ref] of (Array.isArray(value.entity_refs) ? value.entity_refs : []).entries()) {
    validateRef(errors, ref, `entity_refs[${index}]`);
  }
  for (const [index, ref] of (Array.isArray(value.source_refs) ? value.source_refs : []).entries()) {
    validateRef(errors, ref, `source_refs[${index}]`);
  }
  stringList(errors, value.output_refs, "output_refs");
  if (!object4(value.eval)) errors.push("eval precisa ser objeto");
  else {
    closed(errors, value.eval, "eval", ["version", "passed"]);
    string(errors, value.eval.version, "eval.version");
    if (value.eval.passed !== null && typeof value.eval.passed !== "boolean") {
      errors.push("eval.passed precisa ser booleano ou null");
    }
  }
  if (value.completed_at !== void 0 && value.completed_at !== null) date(errors, value.completed_at, "completed_at");
  if (value.correction_ref !== void 0 && value.correction_ref !== null) string(errors, value.correction_ref, "correction_ref");
  list(errors, value.outcomes || [], "outcomes");
  for (const [index, outcome] of (Array.isArray(value.outcomes) ? value.outcomes : []).entries()) {
    const path = `outcomes[${index}]`;
    if (!object4(outcome)) errors.push(`${path} precisa ser objeto`);
    else {
      closed(errors, outcome, path, ["measure", "value"]);
      if (!ID_RE.test(outcome.measure || "")) errors.push(`${path}.measure inv\xE1lido`);
      if (!["string", "number", "boolean"].includes(typeof outcome.value)) errors.push(`${path}.value inv\xE1lido`);
    }
  }
  if (!object4(value.privacy)) errors.push("privacy precisa ser objeto");
  else closed(errors, value.privacy, "privacy", privacyKeys());
  if (value.extensions !== void 0 && !object4(value.extensions)) errors.push("extensions precisa ser objeto");
  if (version === 2) {
    const lineageDeclared = ["chain_id", "mode", "experiment_ref", "handoff_refs"].some((key2) => Object.hasOwn(value, key2));
    if (lineageDeclared) {
      if (value.chain_id !== null && !OPAQUE_REF_RE.test(value.chain_id || "")) errors.push("chain_id inv\xE1lido");
      if (value.chain_id === null && value.mode !== null) errors.push("mode exige chain_id");
      if (value.chain_id !== null && !["replay", "live"].includes(value.mode)) errors.push("chain_id exige mode replay ou live");
      if (value.mode !== null && value.mode !== void 0 && !["replay", "live"].includes(value.mode)) errors.push("mode inv\xE1lido");
      if (value.experiment_ref !== null && value.experiment_ref !== void 0 && !EXPERIMENT_ID_RE.test(value.experiment_ref || "")) errors.push("experiment_ref inv\xE1lido");
      if (value.experiment_ref && !value.chain_id) errors.push("experiment_ref exige chain_id");
      stringList(errors, value.handoff_refs, "handoff_refs");
      unique(errors, value.handoff_refs, "handoff_refs");
      for (const [index, ref] of (Array.isArray(value.handoff_refs) ? value.handoff_refs : []).entries()) {
        if (!LOCAL_REF_RE.test(ref || "")) errors.push(`handoff_refs[${index}] inv\xE1lido`);
      }
    }
  }
}
function validateContextSnapshot(errors, snapshot, run) {
  if (!object4(snapshot)) {
    errors.push("context_snapshot precisa ser objeto");
    return;
  }
  closed(errors, snapshot, "context_snapshot", [
    "system_contract_version",
    "retrieval_version",
    "observed_at",
    "accesses",
    "gaps",
    "fallbacks",
    "conflicts"
  ]);
  string(errors, snapshot.system_contract_version, "context_snapshot.system_contract_version");
  if (snapshot.system_contract_version !== run.system_version) {
    errors.push("context_snapshot.system_contract_version precisa corresponder a system_version");
  }
  string(errors, snapshot.retrieval_version, "context_snapshot.retrieval_version");
  date(errors, snapshot.observed_at, "context_snapshot.observed_at");
  list(errors, snapshot.accesses, "context_snapshot.accesses", 1);
  const runSourceRefs = new Set((Array.isArray(run.source_refs) ? run.source_refs : []).map((ref) => `${ref?.role}:${ref?.id}`));
  for (const [index, access] of (Array.isArray(snapshot.accesses) ? snapshot.accesses : []).entries()) {
    const path = `context_snapshot.accesses[${index}]`;
    if (!object4(access)) {
      errors.push(`${path} precisa ser objeto`);
      continue;
    }
    closed(errors, access, path, [
      "source_ref",
      "selected_refs",
      "query",
      "filters",
      "window",
      "freshness_marker",
      "assurance"
    ]);
    validateRef(errors, access.source_ref, `${path}.source_ref`);
    if (object4(access.source_ref) && !runSourceRefs.has(`${access.source_ref.role}:${access.source_ref.id}`)) {
      errors.push(`${path}.source_ref n\xE3o existe em source_refs`);
    }
    stringList(errors, access.selected_refs, `${path}.selected_refs`, 1);
    string(errors, access.query, `${path}.query`);
    stringList(errors, access.filters, `${path}.filters`);
    string(errors, access.window, `${path}.window`);
    if (access.freshness_marker !== null) string(errors, access.freshness_marker, `${path}.freshness_marker`);
    if (!ASSURANCES.has(access.assurance)) errors.push(`${path}.assurance inv\xE1lido`);
  }
  list(errors, snapshot.gaps, "context_snapshot.gaps");
  for (const [index, gap] of (Array.isArray(snapshot.gaps) ? snapshot.gaps : []).entries()) {
    const path = `context_snapshot.gaps[${index}]`;
    if (!object4(gap)) errors.push(`${path} precisa ser objeto`);
    else {
      closed(errors, gap, path, ["source_role", "reason_code", "detail_ref"]);
      if (!ID_RE.test(gap.source_role || "")) errors.push(`${path}.source_role inv\xE1lido`);
      if (!ID_RE.test(gap.reason_code || "")) errors.push(`${path}.reason_code inv\xE1lido`);
      if (gap.detail_ref !== null) string(errors, gap.detail_ref, `${path}.detail_ref`);
    }
  }
  list(errors, snapshot.fallbacks, "context_snapshot.fallbacks");
  for (const [index, fallback] of (Array.isArray(snapshot.fallbacks) ? snapshot.fallbacks : []).entries()) {
    const path = `context_snapshot.fallbacks[${index}]`;
    if (!object4(fallback)) errors.push(`${path} precisa ser objeto`);
    else {
      closed(errors, fallback, path, ["from_role", "to_role", "reason_code"]);
      for (const field of ["from_role", "to_role", "reason_code"]) {
        if (!ID_RE.test(fallback[field] || "")) errors.push(`${path}.${field} inv\xE1lido`);
      }
    }
  }
  list(errors, snapshot.conflicts, "context_snapshot.conflicts");
  for (const [index, conflict] of (Array.isArray(snapshot.conflicts) ? snapshot.conflicts : []).entries()) {
    const path = `context_snapshot.conflicts[${index}]`;
    if (!object4(conflict)) errors.push(`${path} precisa ser objeto`);
    else {
      closed(errors, conflict, path, ["source_roles", "resolution", "decision_ref"]);
      list(errors, conflict.source_roles, `${path}.source_roles`, 2);
      for (const [roleIndex, role] of (Array.isArray(conflict.source_roles) ? conflict.source_roles : []).entries()) {
        if (!ID_RE.test(role || "")) errors.push(`${path}.source_roles[${roleIndex}] inv\xE1lido`);
      }
      if (!["authority-wins", "freshest-wins", "human-decision", "unresolved"].includes(conflict.resolution)) {
        errors.push(`${path}.resolution inv\xE1lido`);
      }
      if (conflict.resolution === "human-decision" && !conflict.decision_ref) {
        errors.push(`${path}.decision_ref obrigat\xF3rio para decis\xE3o humana`);
      }
      if (conflict.decision_ref !== null) string(errors, conflict.decision_ref, `${path}.decision_ref`);
    }
  }
  referenceOnly(errors, snapshot, "context_snapshot");
}
function validateRunRecordVersion(value, validateV1) {
  if (!object4(value)) return ["run record precisa ser objeto"];
  if (value.protocol_version === 1) {
    const errors2 = validateV1(value);
    validateRunShape(errors2, value, 1);
    return [...new Set(errors2)];
  }
  if (value.protocol_version !== 2) return ["protocol_version de Run Record suportada: 1 ou 2"];
  const base = { ...value, protocol_version: 1 };
  delete base.context_snapshot;
  delete base.chain_id;
  delete base.mode;
  delete base.experiment_ref;
  delete base.handoff_refs;
  const errors = validateV1(base).filter((error) => error !== "protocol_version precisa ser 1");
  validateRunShape(errors, value, 2);
  validateContextSnapshot(errors, value.context_snapshot, value);
  return [...new Set(errors)];
}
function validateSourceContract(value) {
  const errors = [];
  if (!object4(value)) return ["source contract precisa ser objeto"];
  closed(errors, value, "source_contract", [
    "protocol_version",
    "source_id",
    "name",
    "type",
    "status",
    "truth",
    "authority",
    "scope",
    "sensitivity",
    "pii",
    "modes",
    "freshness",
    "retention",
    "revocation",
    "connector",
    "authorized_consumers",
    "assurance",
    "extensions"
  ]);
  if (value.protocol_version !== 1) errors.push("protocol_version precisa ser 1");
  if (!ID_RE.test(value.source_id || "")) errors.push("source_id inv\xE1lido");
  string(errors, value.name, "name");
  if (!ID_RE.test(value.type || "")) errors.push("type inv\xE1lido");
  if (!["mapped", "active", "degraded", "revoked"].includes(value.status)) errors.push("status inv\xE1lido");
  if (!object4(value.truth)) errors.push("truth precisa ser objeto");
  else {
    closed(errors, value.truth, "truth", ["home_ref", "source_of_truth"]);
    string(errors, value.truth.home_ref, "truth.home_ref");
    if (typeof value.truth.source_of_truth !== "boolean") errors.push("truth.source_of_truth precisa ser booleano");
  }
  if (!object4(value.authority)) errors.push("authority precisa ser objeto");
  else {
    closed(errors, value.authority, "authority", ["owner_ref", "status"]);
    if (value.authority.owner_ref !== null && !REF_RE.test(value.authority.owner_ref || "")) errors.push("authority.owner_ref inv\xE1lido");
    if (!["confirmed", "unconfirmed"].includes(value.authority.status)) errors.push("authority.status inv\xE1lido");
    if (value.authority.status === "confirmed" && value.authority.owner_ref === null) errors.push("authority.owner_ref obrigat\xF3rio quando confirmado");
  }
  if (!object4(value.scope)) errors.push("scope precisa ser objeto");
  else {
    closed(errors, value.scope, "scope", ["purpose", "entity_types", "boundaries"]);
    string(errors, value.scope.purpose, "scope.purpose");
    list(errors, value.scope.entity_types, "scope.entity_types");
    for (const [index, entity] of (Array.isArray(value.scope.entity_types) ? value.scope.entity_types : []).entries()) {
      if (!ID_RE.test(entity || "")) errors.push(`scope.entity_types[${index}] inv\xE1lido`);
    }
    stringList(errors, value.scope.boundaries, "scope.boundaries");
  }
  if (!["private", "team", "public"].includes(value.sensitivity)) errors.push("sensitivity inv\xE1lido");
  if (!object4(value.pii)) errors.push("pii precisa ser objeto");
  else {
    closed(errors, value.pii, "pii", ["classification", "handling"]);
    if (!["unknown", "none", "possible", "contains"].includes(value.pii.classification)) errors.push("pii.classification inv\xE1lido");
    if (!["reference-only", "local-processing", "not-applicable"].includes(value.pii.handling)) errors.push("pii.handling inv\xE1lido");
  }
  list(errors, value.modes, "modes", 1);
  for (const [index, mode] of (Array.isArray(value.modes) ? value.modes : []).entries()) {
    if (!["read", "propose", "write-with-approval", "external-action"].includes(mode)) errors.push(`modes[${index}] inv\xE1lido`);
  }
  unique(errors, value.modes, "modes");
  if (!object4(value.freshness)) errors.push("freshness precisa ser objeto");
  else {
    closed(errors, value.freshness, "freshness", ["policy", "observed_at"]);
    string(errors, value.freshness.policy, "freshness.policy");
    date(errors, value.freshness.observed_at, "freshness.observed_at", true);
  }
  if (!object4(value.retention)) errors.push("retention precisa ser objeto");
  else {
    closed(errors, value.retention, "retention", ["policy", "until"]);
    string(errors, value.retention.policy, "retention.policy");
    date(errors, value.retention.until, "retention.until", true);
  }
  if (!object4(value.revocation)) errors.push("revocation precisa ser objeto");
  else {
    closed(errors, value.revocation, "revocation", ["method", "effect", "revocable"]);
    string(errors, value.revocation.method, "revocation.method");
    if (!["future-only", "receipt-only", "irreversible-export"].includes(value.revocation.effect)) errors.push("revocation.effect inv\xE1lido");
    if (typeof value.revocation.revocable !== "boolean") errors.push("revocation.revocable precisa ser booleano");
  }
  if (!object4(value.connector)) errors.push("connector precisa ser objeto");
  else {
    closed(errors, value.connector, "connector", ["kind", "binding_ref", "credential_ref", "custody"]);
    if (!ID_RE.test(value.connector.kind || "")) errors.push("connector.kind inv\xE1lido");
    if (value.connector.binding_ref !== null) string(errors, value.connector.binding_ref, "connector.binding_ref");
    if (value.connector.credential_ref !== null && !LOCAL_REF_RE.test(value.connector.credential_ref || "")) errors.push("connector.credential_ref inv\xE1lido");
    if (!["runtime-exclusive", "agent-direct", "none"].includes(value.connector.custody)) errors.push("connector.custody inv\xE1lido");
  }
  list(errors, value.authorized_consumers, "authorized_consumers");
  for (const [index, consumer] of (Array.isArray(value.authorized_consumers) ? value.authorized_consumers : []).entries()) {
    const path = `authorized_consumers[${index}]`;
    if (!object4(consumer)) errors.push(`${path} precisa ser objeto`);
    else {
      closed(errors, consumer, path, ["subject_type", "subject_ref"]);
      if (!["system", "agent", "role", "person"].includes(consumer.subject_type)) errors.push(`${path}.subject_type inv\xE1lido`);
      if (!REF_RE.test(consumer.subject_ref || "")) errors.push(`${path}.subject_ref inv\xE1lido`);
    }
  }
  if (!ASSURANCES.has(value.assurance)) errors.push("assurance inv\xE1lido");
  if (value.assurance === "runtime-enforced") {
    if (LOCAL_SOURCE_TYPES.has(value.type)) errors.push("fonte local n\xE3o pode declarar runtime-enforced");
    if (value.connector?.custody !== "runtime-exclusive") errors.push("runtime-enforced exige connector.custody runtime-exclusive");
    if (!value.connector?.credential_ref) errors.push("runtime-enforced exige connector.credential_ref opaco");
  }
  if (value.assurance === "exported") {
    if (value.revocation?.effect !== "irreversible-export" || value.revocation?.revocable !== false) {
      errors.push("exported exige revoga\xE7\xE3o marcada como c\xF3pia irrevers\xEDvel e n\xE3o revog\xE1vel");
    }
    if (value.connector?.custody !== "none") errors.push("exported exige connector.custody none");
  }
  if (value.revocation?.effect === "irreversible-export" && value.revocation?.revocable !== false) {
    errors.push("irreversible-export n\xE3o pode ser revog\xE1vel");
  }
  if (value.extensions !== void 0 && !object4(value.extensions)) errors.push("extensions precisa ser objeto");
  referenceOnly(errors, value, "source_contract");
  return [...new Set(errors)];
}
function validateAccessGrant(value) {
  const errors = [];
  if (!object4(value)) return ["access grant precisa ser objeto"];
  closed(errors, value, "access_grant", [
    "protocol_version",
    "grant_id",
    "subject",
    "scope",
    "mode",
    "assurance",
    "custody",
    "reason",
    "issued_at",
    "expires_at",
    "revoked_at",
    "approved_by",
    "credential_ref",
    "receipts",
    "extensions"
  ]);
  if (value.protocol_version !== 1) errors.push("protocol_version precisa ser 1");
  if (!REF_RE.test(value.grant_id || "")) errors.push("grant_id inv\xE1lido");
  if (!object4(value.subject)) errors.push("subject precisa ser objeto");
  else {
    closed(errors, value.subject, "subject", ["type", "ref"]);
    if (!["system", "agent", "role", "person"].includes(value.subject.type)) errors.push("subject.type inv\xE1lido");
    if (!REF_RE.test(value.subject.ref || "")) errors.push("subject.ref inv\xE1lido");
  }
  if (!object4(value.scope)) errors.push("scope precisa ser objeto");
  else {
    closed(errors, value.scope, "scope", ["company_ref", "unit_ref", "system_refs", "source_refs", "actions"]);
    if (!REF_RE.test(value.scope.company_ref || "")) errors.push("scope.company_ref inv\xE1lido");
    if (value.scope.unit_ref !== null && !REF_RE.test(value.scope.unit_ref || "")) errors.push("scope.unit_ref inv\xE1lido");
    list(errors, value.scope.system_refs, "scope.system_refs", 1);
    for (const [index, ref] of (Array.isArray(value.scope.system_refs) ? value.scope.system_refs : []).entries()) {
      if (!ID_RE.test(ref || "")) errors.push(`scope.system_refs[${index}] inv\xE1lido`);
    }
    list(errors, value.scope.source_refs, "scope.source_refs", 1);
    for (const [index, ref] of (Array.isArray(value.scope.source_refs) ? value.scope.source_refs : []).entries()) {
      if (!REF_RE.test(ref || "")) errors.push(`scope.source_refs[${index}] inv\xE1lido`);
    }
    list(errors, value.scope.actions, "scope.actions", 1);
    for (const [index, action] of (Array.isArray(value.scope.actions) ? value.scope.actions : []).entries()) {
      if (!ID_RE.test(action || "")) errors.push(`scope.actions[${index}] inv\xE1lido`);
    }
  }
  if (!["read", "propose", "write-with-approval", "external-action"].includes(value.mode)) errors.push("mode inv\xE1lido");
  if (!ASSURANCES.has(value.assurance)) errors.push("assurance inv\xE1lido");
  if (!["runtime-exclusive", "agent-direct", "exported-copy"].includes(value.custody)) errors.push("custody inv\xE1lido");
  string(errors, value.reason, "reason");
  date(errors, value.issued_at, "issued_at");
  date(errors, value.expires_at, "expires_at", true);
  date(errors, value.revoked_at, "revoked_at", true);
  if (!REF_RE.test(value.approved_by || "")) errors.push("approved_by obrigat\xF3rio e precisa ser refer\xEAncia opaca");
  if (value.credential_ref !== null && !LOCAL_REF_RE.test(value.credential_ref || "")) errors.push("credential_ref inv\xE1lido");
  if (!object4(value.receipts)) errors.push("receipts precisa ser objeto");
  else {
    closed(errors, value.receipts, "receipts", ["use_refs", "revocation_ref"]);
    stringList(errors, value.receipts.use_refs, "receipts.use_refs");
    if (value.receipts.revocation_ref !== null) string(errors, value.receipts.revocation_ref, "receipts.revocation_ref");
  }
  const issued = Date.parse(value.issued_at || "");
  if (value.expires_at && Date.parse(value.expires_at) <= issued) errors.push("expires_at precisa ser posterior a issued_at");
  if (value.revoked_at && Date.parse(value.revoked_at) < issued) errors.push("revoked_at n\xE3o pode ser anterior a issued_at");
  if (value.revoked_at && !value.receipts?.revocation_ref) errors.push("grant revogado exige receipts.revocation_ref");
  if (value.assurance === "runtime-enforced") {
    if (value.custody !== "runtime-exclusive") errors.push("runtime-enforced exige custody runtime-exclusive");
    if (!value.credential_ref) errors.push("runtime-enforced exige credential_ref opaco");
  }
  if (value.assurance === "receipt-audited" && value.custody === "exported-copy") {
    errors.push("receipt-audited n\xE3o pode declarar custody exported-copy");
  }
  if (value.assurance === "exported") {
    if (value.custody !== "exported-copy") errors.push("exported exige custody exported-copy");
    if (value.credential_ref !== null) errors.push("c\xF3pia exportada n\xE3o carrega credential_ref");
  }
  if (value.extensions !== void 0 && !object4(value.extensions)) errors.push("extensions precisa ser objeto");
  referenceOnly(errors, value, "access_grant");
  return [...new Set(errors)];
}

// ../scripts/lib/system-vocabulary.mjs
var CANONICAL_PUBLISHER_ORIGIN = "publisher";
var LEGACY_PUBLISHER_ORIGIN = "inevita";
var CANONICAL_BINDING_DISCLOSURE_KEY = "shared_with_vendor";
var LEGACY_BINDING_DISCLOSURE_KEY = "shared_with_inevita";
var CANONICAL_CAPABILITY_ORIGINS = Object.freeze(["local", "publisher", "external"]);
var ERROR_ERRORS = "system-vocabulary-errors-invalid";
var MESSAGE_PRIVACY_OBJECT = "privacy precisa ser objeto simples";
var MESSAGE_PROTOCOL = "protocol_version precisa ser 1 ou 2";
var MESSAGE_MISSING_V1 = "privacy precisa declarar a compatibilidade hist\xF3rica do fornecedor no protocolo 1";
var MESSAGE_FORBIDDEN_CANONICAL = "privacy n\xE3o pode declarar shared_with_vendor no protocolo 1";
var MESSAGE_MISSING_V2 = "privacy precisa declarar shared_with_vendor no protocolo 2";
var MESSAGE_FORBIDDEN_LEGACY = "privacy n\xE3o pode declarar a compatibilidade hist\xF3rica do fornecedor no protocolo 2";
var MESSAGE_FLAG_FALSE = "a declara\xE7\xE3o de compartilhamento com fornecedor precisa ser false";
function isPlainObject(value) {
  if (value === null || typeof value !== "object" || Array.isArray(value)) return false;
  const proto = Object.getPrototypeOf(value);
  return proto === Object.prototype || proto === null;
}
function normalizeCapabilityOrigin(value) {
  if (typeof value !== "string") return null;
  if (value === LEGACY_PUBLISHER_ORIGIN) return CANONICAL_PUBLISHER_ORIGIN;
  return CANONICAL_CAPABILITY_ORIGINS.includes(value) ? value : null;
}
function bindingDisclosureErrors(errors, privacy, protocolVersion) {
  if (!Array.isArray(errors)) throw new TypeError(ERROR_ERRORS);
  if (!isPlainObject(privacy)) {
    errors.push(MESSAGE_PRIVACY_OBJECT);
    return errors;
  }
  if (protocolVersion !== 1 && protocolVersion !== 2) {
    errors.push(MESSAGE_PROTOCOL);
    return errors;
  }
  const legacyPresent = Object.hasOwn(privacy, LEGACY_BINDING_DISCLOSURE_KEY);
  const canonicalPresent = Object.hasOwn(privacy, CANONICAL_BINDING_DISCLOSURE_KEY);
  const historical = protocolVersion === 1;
  const requiredKey = historical ? LEGACY_BINDING_DISCLOSURE_KEY : CANONICAL_BINDING_DISCLOSURE_KEY;
  const requiredPresent = historical ? legacyPresent : canonicalPresent;
  const forbiddenPresent = historical ? canonicalPresent : legacyPresent;
  if (forbiddenPresent) errors.push(historical ? MESSAGE_FORBIDDEN_CANONICAL : MESSAGE_FORBIDDEN_LEGACY);
  if (!requiredPresent) {
    errors.push(historical ? MESSAGE_MISSING_V1 : MESSAGE_MISSING_V2);
    return errors;
  }
  if (privacy[requiredKey] !== false) errors.push(MESSAGE_FLAG_FALSE);
  return errors;
}

// ../scripts/lib/system-protocol.mjs
var ID_RE2 = /^[a-z0-9][a-z0-9-]{0,63}$/;
var REF_ID_RE = /^[A-Za-z0-9][A-Za-z0-9_-]{0,127}$/;
var VERSION_RE2 = /^\d+\.\d+\.\d+(?:[-+][A-Za-z0-9.-]+)?$/;
var HUMAN_DECISIONS = /* @__PURE__ */ new Set(["pending", "approved", "changes_requested", "rejected"]);
var SYSTEM_STATUSES = /* @__PURE__ */ new Set(["proposed", "confirmed", "active", "needs_attention"]);
function object5(value) {
  return value !== null && typeof value === "object" && !Array.isArray(value);
}
function requiredString(errors, value, path) {
  if (typeof value !== "string" || !value.trim()) errors.push(`${path} precisa ser texto n\xE3o vazio`);
}
function requiredArray(errors, value, path, minimum = 0) {
  if (!Array.isArray(value)) errors.push(`${path} precisa ser lista`);
  else if (value.length < minimum) errors.push(`${path} precisa ter pelo menos ${minimum} item(ns)`);
}
function allowedKeys(errors, value, path, keys) {
  if (!object5(value)) return;
  const allowed = new Set(keys);
  for (const key2 of Object.keys(value)) {
    if (!allowed.has(key2)) errors.push(`${path}.${key2} n\xE3o \xE9 permitido`);
  }
}
function validatePermissions(errors, permissions, path) {
  if (!object5(permissions)) {
    errors.push(`${path} precisa ser objeto`);
    return;
  }
  allowedKeys(errors, permissions, path, ["read", "write", "external_actions"]);
  requiredArray(errors, permissions.read, `${path}.read`);
  requiredArray(errors, permissions.write, `${path}.write`);
  if (typeof permissions.external_actions !== "boolean") {
    errors.push(`${path}.external_actions precisa ser booleano`);
  }
}
function validateSystemContractV1(value) {
  const errors = [];
  if (!object5(value)) return ["system contract precisa ser objeto"];
  if (value.protocol_version !== 1) errors.push("protocol_version precisa ser 1");
  if (!ID_RE2.test(value.system_id || "")) errors.push("system_id inv\xE1lido");
  requiredString(errors, value.name, "name");
  if (!VERSION_RE2.test(value.version || "")) errors.push("version precisa ser semver");
  if (!SYSTEM_STATUSES.has(value.status)) errors.push("status inv\xE1lido");
  if (!object5(value.result)) errors.push("result precisa ser objeto");
  else {
    for (const field of ["statement", "non_success", "definition_of_done", "owner", "human_gate"]) {
      requiredString(errors, value.result[field], `result.${field}`);
    }
    if (!ID_RE2.test(value.result.output_type || "")) errors.push("result.output_type inv\xE1lido");
  }
  if (!object5(value.trigger)) errors.push("trigger precisa ser objeto");
  else {
    if (!["manual", "event", "schedule"].includes(value.trigger.type)) errors.push("trigger.type inv\xE1lido");
    requiredString(errors, value.trigger.description, "trigger.description");
  }
  if (!object5(value.capability)) errors.push("capability precisa ser objeto");
  else {
    if (!ID_RE2.test(value.capability.capability_id || "")) errors.push("capability.capability_id inv\xE1lido");
    if (!VERSION_RE2.test(value.capability.version || "")) errors.push("capability.version precisa ser semver");
    if (normalizeCapabilityOrigin(value.capability.origin) === null) errors.push("capability.origin inv\xE1lido");
  }
  requiredArray(errors, value.entities, "entities");
  for (const [index, entity] of (Array.isArray(value.entities) ? value.entities : []).entries()) {
    if (!object5(entity)) {
      errors.push(`entities[${index}] precisa ser objeto`);
      continue;
    }
    if (!ID_RE2.test(entity.type || "")) errors.push(`entities[${index}].type inv\xE1lido`);
    if (!ID_RE2.test(entity.role || "")) errors.push(`entities[${index}].role inv\xE1lido`);
    if (typeof entity.required !== "boolean") errors.push(`entities[${index}].required precisa ser booleano`);
  }
  requiredArray(errors, value.sources, "sources");
  for (const [index, source] of (Array.isArray(value.sources) ? value.sources : []).entries()) {
    if (!object5(source)) {
      errors.push(`sources[${index}] precisa ser objeto`);
      continue;
    }
    if (!ID_RE2.test(source.role || "")) errors.push(`sources[${index}].role inv\xE1lido`);
    if (source.source_id !== null && source.source_id !== void 0 && !REF_ID_RE.test(source.source_id)) {
      errors.push(`sources[${index}].source_id inv\xE1lido`);
    }
    if (typeof source.required !== "boolean") errors.push(`sources[${index}].required precisa ser booleano`);
    if (!["manual", "read-only", "write-with-approval"].includes(source.access)) {
      errors.push(`sources[${index}].access inv\xE1lido`);
    }
    requiredString(errors, source.freshness, `sources[${index}].freshness`);
    requiredString(errors, source.purpose, `sources[${index}].purpose`);
  }
  requiredArray(errors, value.pipeline, "pipeline", 1);
  for (const [index, state2] of (Array.isArray(value.pipeline) ? value.pipeline : []).entries()) {
    if (!object5(state2)) {
      errors.push(`pipeline[${index}] precisa ser objeto`);
      continue;
    }
    if (!ID_RE2.test(state2.state || "")) errors.push(`pipeline[${index}].state inv\xE1lido`);
    for (const field of ["input", "output", "gate"]) requiredString(errors, state2[field], `pipeline[${index}].${field}`);
  }
  validatePermissions(errors, value.permissions, "permissions");
  if (!object5(value.eval)) errors.push("eval precisa ser objeto");
  else {
    if (!VERSION_RE2.test(value.eval.version || "")) errors.push("eval.version precisa ser semver");
    requiredArray(errors, value.eval.deterministic_gates, "eval.deterministic_gates", 1);
    requiredArray(errors, value.eval.human_questions, "eval.human_questions", 1);
    requiredString(errors, value.eval.outcome_measure, "eval.outcome_measure");
  }
  if (!object5(value.learning)) errors.push("learning precisa ser objeto");
  else {
    if (value.learning.correction_policy !== "candidate-first") errors.push("learning.correction_policy inv\xE1lido");
    if (!Number.isInteger(value.learning.promotion_threshold) || value.learning.promotion_threshold < 3) {
      errors.push("learning.promotion_threshold precisa ser inteiro >= 3");
    }
    if (value.learning.requires_replay !== true) errors.push("learning.requires_replay precisa ser true");
    if (value.learning.requires_human_approval !== true) errors.push("learning.requires_human_approval precisa ser true");
  }
  return errors;
}
function validateRefList(errors, refs4, path) {
  requiredArray(errors, refs4, path);
  for (const [index, ref] of (Array.isArray(refs4) ? refs4 : []).entries()) {
    if (!object5(ref) || !ID_RE2.test(ref.role || "") || !REF_ID_RE.test(ref.id || "")) {
      errors.push(`${path}[${index}] precisa ter role e id v\xE1lidos`);
    }
  }
}
function validateRunRecordV1(value) {
  const errors = [];
  if (!object5(value)) return ["run record precisa ser objeto"];
  if (value.protocol_version !== 1) errors.push("protocol_version precisa ser 1");
  if (!REF_ID_RE.test(value.run_id || "")) errors.push("run_id inv\xE1lido");
  if (!ID_RE2.test(value.system_id || "")) errors.push("system_id inv\xE1lido");
  requiredString(errors, value.system_version, "system_version");
  if (!["started", "completed"].includes(value.status)) errors.push("status inv\xE1lido");
  if (!Number.isFinite(Date.parse(value.started_at || ""))) errors.push("started_at inv\xE1lido");
  if (value.status === "completed" && !Number.isFinite(Date.parse(value.completed_at || ""))) {
    errors.push("completed_at obrigat\xF3rio no run conclu\xEDdo");
  }
  validateRefList(errors, value.entity_refs, "entity_refs");
  validateRefList(errors, value.source_refs, "source_refs");
  requiredArray(errors, value.output_refs, "output_refs");
  if (!object5(value.eval) || typeof value.eval.version !== "string") errors.push("eval inv\xE1lido");
  if (!HUMAN_DECISIONS.has(value.human_decision)) errors.push("human_decision inv\xE1lida");
  disclosureErrors(errors, value.privacy, "privacy");
  return errors;
}
function validateSystemContract(value, options = {}) {
  const errors = validateSystemContractVersion(value, validateSystemContractV1, options);
  if (value?.protocol_version === 1 && value?.capability?.origin === CANONICAL_PUBLISHER_ORIGIN) {
    errors.push("capability.origin inv\xE1lido");
  }
  return [...new Set(errors)];
}
function validateRunRecord(value) {
  return validateRunRecordVersion(value, validateRunRecordV1);
}
function readJson(path, label = path) {
  try {
    return JSON.parse(readFileSync3(path, "utf8"));
  } catch {
    throw new Error(`${label} inv\xE1lido`);
  }
}
function writeJsonAtomic(path, value, mode = 384) {
  mkdirSync(dirname(path), { recursive: true });
  const temporary = `${path}.tmp`;
  writeFileSync(temporary, `${JSON.stringify(value, null, 2)}
`, { mode });
  renameSync(temporary, path);
}
function layout(root) {
  const path = join2(root, ".cerebro", "layout.json");
  return existsSync2(path) ? readJson(path, ".cerebro/layout.json") : {};
}
function ledgerPath(root) {
  const configured = layout(root).runLedger;
  return configured ? resolve2(root, configured) : join2(root, ".cerebro", "ledger", "runs.jsonl");
}
function readRunLedger(root) {
  const path = ledgerPath(root);
  if (!existsSync2(path)) return [];
  return readFileSync3(path, "utf8").split("\n").filter(Boolean).map((line, index) => {
    try {
      return JSON.parse(line);
    } catch {
      throw new Error(`ledger inv\xE1lido na linha ${index + 1}`);
    }
  });
}
function latestRunRecords(root) {
  const byRun = /* @__PURE__ */ new Map();
  for (const record2 of readRunLedger(root)) byRun.set(record2.run_id, record2);
  return [...byRun.values()].sort((left, right) => String(left.started_at).localeCompare(String(right.started_at)));
}

// ../scripts/lib/canvas-layout-runtime.mjs
var KEY_RE = /^[a-z0-9][a-z0-9-]{0,127}$/;
function directory(root, { create = false } = {}) {
  const runtime = resolve3(root, ".cerebro", "runtime");
  const target = resolve3(root, layout(root).canvasLayouts || join3(".cerebro", "runtime", "canvas-layouts"));
  const rel = relative3(runtime, target);
  if (!rel || rel.startsWith("..") || rel.startsWith(sep3)) throw new Error("canvas-layout-not-private");
  if (!create && !existsSync3(target)) return target;
  if (create) mkdirSync2(target, { recursive: true, mode: 448 });
  const realRel = relative3(realpathSync3(runtime), realpathSync3(target));
  if (!realRel || realRel.startsWith("..") || realRel.startsWith(sep3)) throw new Error("canvas-layout-outside-runtime");
  return target;
}
function file(root, key2, options) {
  if (!KEY_RE.test(key2 || "")) throw new Error("canvas-layout-key-invalid");
  return join3(directory(root, options), `${key2}.json`);
}
function readCanvasLayout(root, key2) {
  const path = file(root, key2);
  if (!existsSync3(path)) return { protocol_version: 1, layout_key: key2, positions: {}, updated_at: null, updated_by: null };
  let value;
  try {
    value = JSON.parse(readFileSync4(path, "utf8"));
  } catch {
    throw new Error("canvas-layout-json-invalid");
  }
  if (value.protocol_version !== 1 || value.layout_key !== key2 || typeof value.positions !== "object") {
    throw new Error("canvas-layout-invalid");
  }
  return value;
}

// ../scripts/lib/console-read-model.mjs
import { existsSync as existsSync19, readFileSync as readFileSync19, readdirSync as readdirSync14, statSync as statSync4 } from "node:fs";
import { join as join18, relative as relative18, resolve as resolve19, sep as sep19 } from "node:path";

// ../scripts/lib/access-runtime.mjs
import { randomUUID } from "node:crypto";
import {
  closeSync,
  existsSync as existsSync4,
  lstatSync as lstatSync3,
  mkdirSync as mkdirSync3,
  openSync,
  readFileSync as readFileSync5,
  realpathSync as realpathSync4,
  renameSync as renameSync2,
  unlinkSync,
  writeFileSync as writeFileSync2
} from "node:fs";
import { dirname as dirname2, isAbsolute as isAbsolute2, join as join4, resolve as resolve4, sep as sep4 } from "node:path";
var LOCAL_REF_RE2 = /^[A-Za-z0-9][A-Za-z0-9_./:-]{0,255}$/;
var CREDENTIAL_REF_RE = /^[a-z][a-z0-9-]{1,31}:[A-Za-z0-9][A-Za-z0-9_./:-]{0,223}$/;
var DECISIONS = /* @__PURE__ */ new Set(["allowed", "denied", "failed", "revoked", "file-only"]);
var MODES = /* @__PURE__ */ new Set(["read", "propose", "write-with-approval", "external-action"]);
var ASSURANCES2 = /* @__PURE__ */ new Set(["runtime-enforced", "receipt-audited", "exported"]);
var CREDENTIAL_STATUSES = /* @__PURE__ */ new Set(["present", "missing", "not-checked"]);
var LOCK_ATTEMPTS = 400;
var LOCK_WAIT_MS = 5;
var LOCK_WAIT = new Int32Array(new SharedArrayBuffer(4));
function object6(value) {
  return value !== null && typeof value === "object" && !Array.isArray(value);
}
function safeConfiguredDirectory(root, configured, fallback) {
  const brainRoot = resolve4(root);
  const target = resolve4(root, configured || fallback);
  if (target === brainRoot || !target.startsWith(`${brainRoot}${sep4}`)) {
    throw new Error("layout do runtime aponta para fora do c\xE9rebro");
  }
  return target;
}
function accessGrantDirectory(root) {
  const configured = layout(root).accessGrants;
  return safeConfiguredDirectory(root, configured, join4(".cerebro", "contracts", "access-grants"));
}
function accessGrantPath(root, grantId) {
  if (!REF_ID_RE.test(grantId || "")) throw new Error("grant_id inv\xE1lido");
  return join4(accessGrantDirectory(root), `${grantId}.json`);
}
function accessReceiptDirectory(root) {
  const configured = layout(root).accessReceipts;
  return safeConfiguredDirectory(root, configured, join4(".cerebro", "runtime", "receipts", "access"));
}
function realDirectory(path, label) {
  if (typeof path !== "string" || !isAbsolute2(path) || resolve4(path) !== path) {
    throw new Error(`${label} precisa ser diret\xF3rio absoluto`);
  }
  let stat;
  let canonical3;
  try {
    stat = lstatSync3(path);
    canonical3 = realpathSync4(path);
  } catch {
    throw new Error(`${label} indispon\xEDvel`);
  }
  if (!stat.isDirectory() || stat.isSymbolicLink()) {
    throw new Error(`${label} inv\xE1lido`);
  }
  return canonical3;
}
function realExistingDirectory(path, label) {
  const canonical3 = realDirectory(path, label);
  if (canonical3 !== path) throw new Error(`${label} inv\xE1lido`);
  return canonical3;
}
function realExistingFile(path, label) {
  let stat;
  let canonical3;
  try {
    stat = lstatSync3(path);
    canonical3 = realpathSync4(path);
  } catch {
    throw new Error(`${label} indispon\xEDvel`);
  }
  if (!stat.isFile() || stat.isSymbolicLink() || canonical3 !== path) {
    throw new Error(`${label} inv\xE1lido`);
  }
  return canonical3;
}
function secureRuntimeLayout(root, label) {
  realExistingDirectory(join4(root, ".cerebro"), `${label} .cerebro`);
  const path = join4(root, ".cerebro", "layout.json");
  if (existsSync4(path)) realExistingFile(path, `${label} layout`);
  return layout(root);
}
function secureReceiptDirectory(root, label) {
  const configured = secureRuntimeLayout(root, label).accessReceipts;
  const directory2 = safeConfiguredDirectory(
    root,
    configured,
    join4(".cerebro", "runtime", "receipts", "access")
  );
  return realExistingDirectory(directory2, `${label} de recibos`);
}
function secureGrantPath(root, grantId) {
  if (!REF_ID_RE.test(grantId || "")) throw new Error("grant_id inv\xE1lido");
  const configured = secureRuntimeLayout(root, "authorityRoot").accessGrants;
  const directory2 = safeConfiguredDirectory(
    root,
    configured,
    join4(".cerebro", "contracts", "access-grants")
  );
  realExistingDirectory(directory2, "authorityRoot de grants");
  return join4(directory2, `${grantId}.json`);
}
function overlaps(left, right) {
  return left === right || left.startsWith(`${right}${sep4}`) || right.startsWith(`${left}${sep4}`);
}
function receiptStore(root, options) {
  if (!Object.hasOwn(options, "receiptRoot")) return { root, readonlyAuthority: false };
  const authorityRoot = realDirectory(root, "authorityRoot");
  const receiptRoot = realDirectory(options.receiptRoot, "receiptRoot");
  if (overlaps(authorityRoot, receiptRoot)) {
    throw new Error("receiptRoot precisa ser distinto de authorityRoot");
  }
  secureReceiptDirectory(receiptRoot, "receiptRoot");
  return { root: receiptRoot, authorityRoot, readonlyAuthority: true };
}
function loadReadonlyAuthority(root, grantId) {
  const path = secureGrantPath(root, grantId);
  realExistingFile(path, "Access Grant");
  const grant = readJson(path, `Access Grant ${grantId}`);
  const errors = runtimeGrantErrors(grant);
  if (errors.length) throw new Error(`Access Grant inv\xE1lido: ${errors.join(" \xB7 ")}`);
  if (grant.grant_id !== grantId) throw new Error("Access Grant n\xE3o corresponde ao grant_id solicitado");
  return { grant, path, ref: `access-grant:${grant.grant_id}` };
}
function validateAccessReceipt(value) {
  const errors = [];
  if (!object6(value)) return ["access receipt precisa ser objeto"];
  const allowed = /* @__PURE__ */ new Set([
    "protocol_version",
    "receipt_id",
    "decision",
    "occurred_at",
    "grant_ref",
    "grant_id",
    "subject_ref",
    "system_ref",
    "source_ref",
    "action",
    "mode",
    "assurance",
    "reason_code",
    "credential_ref",
    "credential_status",
    "operation_ref",
    "approved_by",
    "privacy"
  ]);
  for (const key2 of Object.keys(value)) if (!allowed.has(key2)) errors.push(`${key2} n\xE3o \xE9 permitido`);
  if (value.protocol_version !== 1) errors.push("protocol_version precisa ser 1");
  if (!REF_ID_RE.test(value.receipt_id || "")) errors.push("receipt_id inv\xE1lido");
  if (!DECISIONS.has(value.decision)) errors.push("decision inv\xE1lida");
  if (!Number.isFinite(Date.parse(value.occurred_at || ""))) errors.push("occurred_at inv\xE1lido");
  if (!LOCAL_REF_RE2.test(value.grant_ref || "")) errors.push("grant_ref inv\xE1lido");
  if (!REF_ID_RE.test(value.grant_id || "")) errors.push("grant_id inv\xE1lido");
  if (!REF_ID_RE.test(value.subject_ref || "")) errors.push("subject_ref inv\xE1lido");
  if (value.system_ref !== null && !ID_RE2.test(value.system_ref || "")) errors.push("system_ref inv\xE1lido");
  if (value.source_ref !== null && !REF_ID_RE.test(value.source_ref || "")) errors.push("source_ref inv\xE1lido");
  if (value.action !== null && !ID_RE2.test(value.action || "")) errors.push("action inv\xE1lida");
  if (!MODES.has(value.mode)) errors.push("mode inv\xE1lido");
  if (!ASSURANCES2.has(value.assurance)) errors.push("assurance inv\xE1lido");
  if (!ID_RE2.test(value.reason_code || "")) errors.push("reason_code inv\xE1lido");
  if (value.credential_ref !== null && !LOCAL_REF_RE2.test(value.credential_ref || "")) errors.push("credential_ref inv\xE1lido");
  if (!CREDENTIAL_STATUSES.has(value.credential_status)) errors.push("credential_status inv\xE1lido");
  if (value.operation_ref !== null && !LOCAL_REF_RE2.test(value.operation_ref || "")) errors.push("operation_ref inv\xE1lido");
  if (value.approved_by !== null && !REF_ID_RE.test(value.approved_by || "")) errors.push("approved_by inv\xE1lido");
  if (!hasExactPrivacyShape(value.privacy)) errors.push("privacy inv\xE1lida");
  if (value.decision === "revoked") {
    if (value.system_ref !== null || value.source_ref !== null || value.action !== null) {
      errors.push("revoga\xE7\xE3o precisa representar o grant inteiro");
    }
    if (value.credential_status !== "not-checked") errors.push("revoga\xE7\xE3o n\xE3o pode alegar inspe\xE7\xE3o da credencial");
    if (value.approved_by === null) errors.push("revoga\xE7\xE3o exige approved_by");
  } else if (value.system_ref === null || value.source_ref === null || value.action === null) {
    errors.push("recibo operacional exige system_ref, source_ref e action");
  }
  const serialized = JSON.stringify(value);
  if (/Bearer\s+|-----BEGIN .*PRIVATE KEY-----|\b(?:sk|ghp|xoxb)[-_A-Za-z0-9]{12,}/i.test(serialized)) {
    errors.push("receipt parece conter segredo");
  }
  return errors;
}
function receipt(root, grant, request, decision, reasonCode, {
  credentialStatus = "not-checked",
  operationRef = null,
  approvedBy = null,
  now = /* @__PURE__ */ new Date(),
  receiptId = `access-${randomUUID()}`,
  requireExistingStore = false
} = {}) {
  const value = {
    protocol_version: 1,
    receipt_id: receiptId,
    decision,
    occurred_at: now.toISOString(),
    grant_ref: `access-grant:${grant.grant_id}`,
    grant_id: grant.grant_id,
    subject_ref: request.subject_ref,
    system_ref: request.system_ref,
    source_ref: request.source_ref,
    action: request.action,
    mode: request.mode,
    assurance: grant.assurance,
    reason_code: reasonCode,
    credential_ref: grant.credential_ref,
    credential_status: credentialStatus,
    operation_ref: operationRef,
    approved_by: approvedBy,
    privacy: emitPrivacy()
  };
  const errors = validateAccessReceipt(value);
  if (errors.length) throw new Error(`Access Receipt inv\xE1lido: ${errors.join(" \xB7 ")}`);
  let path = join4(accessReceiptDirectory(root), `${value.receipt_id}.json`);
  if (!requireExistingStore) {
    writeJsonAtomic(path, value);
  } else {
    const directory2 = secureReceiptDirectory(root, "receiptRoot");
    path = join4(directory2, `${value.receipt_id}.json`);
    const temporary = `${path}.tmp`;
    try {
      const descriptor = openSync(temporary, "wx", 384);
      try {
        writeFileSync2(descriptor, `${JSON.stringify(value, null, 2)}
`);
      } finally {
        closeSync(descriptor);
      }
      renameSync2(temporary, path);
    } catch (error) {
      try {
        unlinkSync(temporary);
      } catch {
      }
      throw error;
    }
  }
  return { value, path, ref: `access-receipt:${value.receipt_id}` };
}
function withGrantLock(grantPath, callback) {
  mkdirSync3(dirname2(grantPath), { recursive: true });
  const lockPath = `${grantPath}.lock`;
  let descriptor;
  for (let attempt = 0; attempt < LOCK_ATTEMPTS; attempt += 1) {
    try {
      descriptor = openSync(lockPath, "wx", 384);
      break;
    } catch (error) {
      if (error?.code !== "EEXIST") throw error;
      Atomics.wait(LOCK_WAIT, 0, 0, LOCK_WAIT_MS);
    }
  }
  if (descriptor === void 0) throw new Error("Access Grant ocupado por outra opera\xE7\xE3o");
  try {
    return callback();
  } finally {
    closeSync(descriptor);
    try {
      unlinkSync(lockPath);
    } catch {
    }
  }
}
function appendUseReceiptLocked(grantPath, grant, receiptRef) {
  const next = {
    ...grant,
    receipts: {
      ...grant.receipts,
      use_refs: [.../* @__PURE__ */ new Set([...grant.receipts.use_refs || [], receiptRef])]
    }
  };
  const errors = validateAccessGrant(next);
  if (errors.length) throw new Error(`Access Grant inv\xE1lido ap\xF3s recibo: ${errors.join(" \xB7 ")}`);
  writeJsonAtomic(grantPath, next);
  return next;
}
function canonical(value) {
  if (Array.isArray(value)) return value.map(canonical);
  if (!object6(value)) return value;
  return Object.fromEntries(Object.keys(value).sort().map((key2) => [key2, canonical(value[key2])]));
}
function authorityIdentity(grant) {
  const { receipts, ...authority } = grant;
  return JSON.stringify(canonical({
    ...authority,
    receipts: { revocation_ref: receipts?.revocation_ref ?? null }
  }));
}
function operationClock(options) {
  if (options.clock !== void 0) {
    if (typeof options.clock !== "function") throw new Error("clock precisa ser fun\xE7\xE3o");
    return options.clock;
  }
  if (Object.hasOwn(options, "now")) {
    const fixed = new Date(options.now);
    if (!Number.isFinite(fixed.getTime())) throw new Error("now inv\xE1lido");
    return () => new Date(fixed);
  }
  return () => /* @__PURE__ */ new Date();
}
function instant(clock) {
  const value = clock();
  const now = value instanceof Date ? new Date(value) : new Date(value);
  if (!Number.isFinite(now.getTime())) throw new Error("clock retornou instante inv\xE1lido");
  return now;
}
function requestErrors(request) {
  const errors = [];
  if (!REF_ID_RE.test(request.subject_ref || "")) errors.push("subject_ref inv\xE1lido");
  if (!ID_RE2.test(request.system_ref || "")) errors.push("system_ref inv\xE1lido");
  if (!REF_ID_RE.test(request.source_ref || "")) errors.push("source_ref inv\xE1lido");
  if (!ID_RE2.test(request.action || "")) errors.push("action inv\xE1lida");
  if (!MODES.has(request.mode)) errors.push("mode inv\xE1lido");
  return errors;
}
function runtimeGrantErrors(grant) {
  const errors = validateAccessGrant(grant);
  if (grant?.assurance === "runtime-enforced" && !CREDENTIAL_REF_RE.test(grant.credential_ref || "")) {
    errors.push("runtime-enforced exige credential_ref namespaced, nunca valor cru");
  }
  return errors;
}
function loadAccessGrant(root, grantId) {
  const path = accessGrantPath(root, grantId);
  if (!existsSync4(path)) throw new Error(`Access Grant n\xE3o encontrado: ${grantId}`);
  const grant = readJson(path, `Access Grant ${grantId}`);
  const errors = runtimeGrantErrors(grant);
  if (errors.length) throw new Error(`Access Grant inv\xE1lido: ${errors.join(" \xB7 ")}`);
  return { grant, path, ref: `access-grant:${grant.grant_id}` };
}
function evaluateGrantAccess(grant, request, now) {
  const invalidRequest = requestErrors(request);
  if (invalidRequest.length) return { decision: "denied", reason_code: "request-invalid", credential_status: "not-checked" };
  if (grant.revoked_at && Date.parse(grant.revoked_at) <= now.getTime()) {
    return { decision: "denied", reason_code: "grant-revoked", credential_status: "not-checked" };
  }
  if (Date.parse(grant.issued_at) > now.getTime()) {
    return { decision: "denied", reason_code: "grant-not-active", credential_status: "not-checked" };
  }
  if (grant.expires_at && Date.parse(grant.expires_at) <= now.getTime()) {
    return { decision: "denied", reason_code: "grant-expired", credential_status: "not-checked" };
  }
  if (grant.subject.ref !== request.subject_ref) {
    return { decision: "denied", reason_code: "subject-not-granted", credential_status: "not-checked" };
  }
  if (!grant.scope.system_refs.includes(request.system_ref)) {
    return { decision: "denied", reason_code: "system-not-granted", credential_status: "not-checked" };
  }
  if (!grant.scope.source_refs.includes(request.source_ref)) {
    return { decision: "denied", reason_code: "source-not-granted", credential_status: "not-checked" };
  }
  if (!grant.scope.actions.includes(request.action)) {
    return { decision: "denied", reason_code: "action-not-granted", credential_status: "not-checked" };
  }
  if (grant.mode !== request.mode) {
    return { decision: "denied", reason_code: "mode-not-granted", credential_status: "not-checked" };
  }
  if (grant.assurance === "receipt-audited") {
    return { decision: "file-only", reason_code: "direct-access-not-runtime-enforced", credential_status: "not-checked" };
  }
  if (grant.assurance === "exported") {
    return { decision: "file-only", reason_code: "export-not-revocable", credential_status: "not-checked" };
  }
  return { decision: "allowed", reason_code: "grant-valid", credential_status: "not-checked" };
}
function evaluateCredential(grant, provider) {
  if (!provider?.available) {
    return {
      decision: "denied",
      reason_code: provider?.status?.().reason_code || "secret-provider-unavailable",
      credential_status: "not-checked"
    };
  }
  try {
    const present = provider.hasSecret(grant.credential_ref);
    if (!present) return { decision: "denied", reason_code: "credential-missing", credential_status: "missing" };
  } catch {
    return { decision: "denied", reason_code: "credential-ref-invalid", credential_status: "not-checked" };
  }
  return { decision: "allowed", reason_code: "grant-valid", credential_status: "present" };
}
function evaluateAccess(grant, request, provider, now = /* @__PURE__ */ new Date()) {
  const authority = evaluateGrantAccess(grant, request, now);
  return authority.decision === "allowed" ? evaluateCredential(grant, provider) : authority;
}
function checkAccess(root, grantId, request, provider, options = {}) {
  const invalidRequest = requestErrors(request);
  if (invalidRequest.length) throw new Error(invalidRequest.join(" \xB7 "));
  const clock = operationClock(options);
  const store = receiptStore(root, options);
  const path = accessGrantPath(root, grantId);
  if (store.readonlyAuthority) {
    const checkedAt = instant(clock);
    const loaded = loadReadonlyAuthority(store.authorityRoot, grantId);
    let evaluation = evaluateAccess(loaded.grant, request, provider, checkedAt);
    const confirmedAt = instant(clock);
    let current = loaded;
    if (confirmedAt.getTime() < checkedAt.getTime()) {
      evaluation = {
        decision: "denied",
        reason_code: "clock-regressed-during-access",
        credential_status: "not-checked"
      };
    } else {
      try {
        current = loadReadonlyAuthority(store.authorityRoot, grantId);
      } catch {
        evaluation = {
          decision: "denied",
          reason_code: "grant-unavailable-after-access",
          credential_status: "not-checked"
        };
      }
      if (evaluation.decision === "allowed" && authorityIdentity(current.grant) !== authorityIdentity(loaded.grant)) {
        evaluation = {
          decision: "denied",
          reason_code: "grant-changed-during-access",
          credential_status: "not-checked"
        };
      }
      if (evaluation.decision === "allowed") evaluation = evaluateGrantAccess(current.grant, request, confirmedAt);
    }
    const recorded = receipt(
      store.root,
      current.grant,
      request,
      evaluation.decision,
      evaluation.reason_code,
      {
        credentialStatus: evaluation.credential_status,
        now: confirmedAt,
        requireExistingStore: true
      }
    );
    return { ...evaluation, assurance: current.grant.assurance, receipt_ref: recorded.ref };
  }
  return withGrantLock(path, () => {
    const checkedAt = instant(clock);
    const loaded = loadAccessGrant(root, grantId);
    let evaluation = evaluateAccess(loaded.grant, request, provider, checkedAt);
    const confirmedAt = instant(clock);
    if (confirmedAt.getTime() < checkedAt.getTime()) {
      evaluation = {
        decision: "denied",
        reason_code: "clock-regressed-during-access",
        credential_status: "not-checked"
      };
    } else {
      const currentAuthority = evaluateGrantAccess(loaded.grant, request, confirmedAt);
      if (currentAuthority.decision !== "allowed") evaluation = currentAuthority;
    }
    const recorded = receipt(
      root,
      loaded.grant,
      request,
      evaluation.decision,
      evaluation.reason_code,
      { credentialStatus: evaluation.credential_status, now: confirmedAt }
    );
    appendUseReceiptLocked(loaded.path, loaded.grant, recorded.ref);
    return {
      ...evaluation,
      assurance: loaded.grant.assurance,
      receipt_ref: recorded.ref
    };
  });
}

// ../scripts/lib/correction-loop.mjs
import {
  closeSync as closeSync3,
  existsSync as existsSync12,
  lstatSync as lstatSync9,
  mkdirSync as mkdirSync7,
  openSync as openSync3,
  readdirSync as readdirSync7,
  realpathSync as realpathSync10,
  statSync as statSync3,
  unlinkSync as unlinkSync3,
  writeFileSync as writeFileSync4
} from "node:fs";
import { join as join12, relative as relative11, resolve as resolve12, sep as sep12 } from "node:path";

// ../scripts/lib/source-read-runtime.mjs
import { createHash as createHash2, randomUUID as randomUUID2 } from "node:crypto";
import { existsSync as existsSync6, lstatSync as lstatSync5, readFileSync as readFileSync7, readdirSync as readdirSync3, realpathSync as realpathSync5 } from "node:fs";
import { join as join6, relative as relative5, resolve as resolve6, sep as sep6 } from "node:path";

// ../scripts/lib/system-source-binding.mjs
import { existsSync as existsSync5, lstatSync as lstatSync4, mkdirSync as mkdirSync4, readFileSync as readFileSync6, readdirSync as readdirSync2 } from "node:fs";
import { join as join5, relative as relative4, resolve as resolve5, sep as sep5 } from "node:path";
var STATUSES = /* @__PURE__ */ new Set(["proposed", "awaiting-approval", "ready", "degraded", "incompatible", "revoked"]);
var ACCESS = /* @__PURE__ */ new Set(["manual", "read-only", "write-with-approval"]);
function object7(value) {
  return value !== null && typeof value === "object" && !Array.isArray(value);
}
function closed2(errors, value, path, allowed) {
  if (!object7(value)) {
    errors.push(`${path} precisa ser objeto`);
    return;
  }
  const keys = new Set(allowed);
  for (const key2 of Object.keys(value)) if (!keys.has(key2)) errors.push(`${path}.${key2} n\xE3o \xE9 permitido`);
}
function date2(value) {
  return typeof value === "string" && Number.isFinite(Date.parse(value));
}
function requestedGrantMode(access) {
  return access === "write-with-approval" ? "write-with-approval" : "read";
}
function validateSystemSourceBinding(value) {
  const errors = [];
  closed2(errors, value, "system_source_binding", [
    "protocol_version",
    "binding_id",
    "system_ref",
    "system_version",
    "role",
    "source_ref",
    "requested_access",
    "status",
    "grant_ref",
    "checked_at",
    "reason_codes",
    "approval",
    "privacy"
  ]);
  if (!object7(value)) return errors;
  if (![1, 2].includes(value.protocol_version)) errors.push("protocol_version precisa ser 1 ou 2");
  if (!REF_ID_RE.test(value.binding_id || "")) errors.push("binding_id inv\xE1lido");
  if (!ID_RE2.test(value.system_ref || "")) errors.push("system_ref inv\xE1lido");
  if (!VERSION_RE2.test(value.system_version || "")) errors.push("system_version inv\xE1lido");
  if (!ID_RE2.test(value.role || "")) errors.push("role inv\xE1lido");
  if (!REF_ID_RE.test(value.source_ref || "")) errors.push("source_ref inv\xE1lido");
  if (!ACCESS.has(value.requested_access)) errors.push("requested_access inv\xE1lido");
  if (!STATUSES.has(value.status)) errors.push("status inv\xE1lido");
  if (value.grant_ref !== null && !REF_ID_RE.test(value.grant_ref || "")) errors.push("grant_ref inv\xE1lido");
  if (!date2(value.checked_at)) errors.push("checked_at inv\xE1lido");
  if (!Array.isArray(value.reason_codes) || !value.reason_codes.length || value.reason_codes.some((code) => !ID_RE2.test(code)) || new Set(value.reason_codes).size !== value.reason_codes.length) errors.push("reason_codes inv\xE1lido");
  closed2(errors, value.approval, "approval", ["approved_by", "approved_at"]);
  if (object7(value.approval)) {
    if (value.approval.approved_by !== null && !REF_ID_RE.test(value.approval.approved_by || "")) {
      errors.push("approval.approved_by inv\xE1lido");
    }
    if (value.approval.approved_at !== null && !date2(value.approval.approved_at)) {
      errors.push("approval.approved_at inv\xE1lido");
    }
    if (value.approval.approved_by === null !== (value.approval.approved_at === null)) {
      errors.push("approval precisa ter aprovador e instante juntos");
    }
  }
  const disclosureKey = value.protocol_version === 1 ? LEGACY_BINDING_DISCLOSURE_KEY : CANONICAL_BINDING_DISCLOSURE_KEY;
  closed2(errors, value.privacy, "privacy", ["content_copied", "credential_stored", disclosureKey]);
  if (object7(value.privacy)) {
    if (value.privacy.content_copied !== false) errors.push("privacy.content_copied precisa ser false");
    if (value.privacy.credential_stored !== false) errors.push("privacy.credential_stored precisa ser false");
    bindingDisclosureErrors(errors, value.privacy, value.protocol_version);
  }
  if (value.status === "ready") {
    if (!value.grant_ref) errors.push("binding ready exige grant_ref");
    if (!value.approval?.approved_by || !value.approval?.approved_at) errors.push("binding ready exige aprova\xE7\xE3o humana");
    if (!value.reason_codes?.includes("role-source-compatible") || !value.reason_codes?.includes("grant-active")) {
      errors.push("binding ready exige reason_codes role-source-compatible e grant-active");
    }
  }
  if (["proposed", "awaiting-approval"].includes(value.status)) {
    if (value.grant_ref !== null) errors.push(`${value.status} n\xE3o pode declarar grant ativo`);
    if (value.approval?.approved_by !== null || value.approval?.approved_at !== null) {
      errors.push(`${value.status} n\xE3o pode declarar aprova\xE7\xE3o conclu\xEDda`);
    }
  }
  return errors;
}
function includesConsumer(source, systemRef) {
  const consumers = Array.isArray(source.authorized_consumers) ? source.authorized_consumers : [];
  if (!consumers.length) return true;
  return consumers.some((consumer) => consumer.subject_type === "system" && consumer.subject_ref === systemRef);
}
function validateSystemSourceBindingReferences(binding, { system, source, grant = null }) {
  const errors = [...validateSystemSourceBinding(binding)];
  const systemErrors = validateSystemContract(system);
  const sourceErrors = validateSourceContract(source);
  if (systemErrors.length) errors.push(`System Contract inv\xE1lido: ${systemErrors.join(" \xB7 ")}`);
  if (sourceErrors.length) errors.push(`Source Contract inv\xE1lido: ${sourceErrors.join(" \xB7 ")}`);
  if (systemErrors.length || sourceErrors.length) return errors;
  if (system.system_id !== binding.system_ref) errors.push("system_ref n\xE3o corresponde ao System Contract");
  if (system.version !== binding.system_version) errors.push("system_version n\xE3o corresponde ao System Contract");
  if (source.source_id !== binding.source_ref) errors.push("source_ref n\xE3o corresponde ao Source Contract");
  const requirements = system.sources.filter((item) => item.role === binding.role);
  if (requirements.length !== 1) errors.push("role precisa existir exatamente uma vez no System Contract");
  const requirement = requirements[0];
  if (requirement) {
    if (requirement.access !== binding.requested_access) errors.push("requested_access diverge do papel no System Contract");
    if (requirement.source_id && requirement.source_id !== binding.source_ref) {
      errors.push("Source Contract diverge do source_id expl\xEDcito do Sistema");
    }
    const mode = requestedGrantMode(requirement.access);
    if (!source.modes.includes(mode)) errors.push(`Source Contract n\xE3o permite modo ${mode}`);
  }
  if (binding.status === "ready" && source.status !== "active") errors.push("binding ready exige Source Contract ativo");
  if (!includesConsumer(source, binding.system_ref)) errors.push("Source Contract n\xE3o autoriza este Sistema");
  if (binding.status === "ready") {
    if (!grant) errors.push("binding ready exige Access Grant existente");
    else {
      const grantErrors = validateAccessGrant(grant);
      if (grantErrors.length) errors.push(`Access Grant inv\xE1lido: ${grantErrors.join(" \xB7 ")}`);
      else {
        const checkedAt = Date.parse(binding.checked_at);
        if (grant.grant_id !== binding.grant_ref) errors.push("grant_ref n\xE3o corresponde ao Access Grant");
        if (grant.subject.type !== "system" || grant.subject.ref !== binding.system_ref) {
          errors.push("Access Grant precisa ter o Sistema como sujeito");
        }
        if (!grant.scope.system_refs.includes(binding.system_ref)) errors.push("Access Grant n\xE3o cobre o Sistema");
        if (!grant.scope.source_refs.includes(binding.source_ref)) errors.push("Access Grant n\xE3o cobre a Fonte");
        if (grant.mode !== requestedGrantMode(binding.requested_access)) errors.push("Access Grant n\xE3o cobre o modo solicitado");
        if (grant.assurance !== source.assurance) errors.push("Access Grant diverge da garantia da Fonte");
        if (Date.parse(grant.issued_at) > checkedAt) errors.push("Access Grant ainda n\xE3o tinha sido emitido");
        if (grant.revoked_at && Date.parse(grant.revoked_at) <= checkedAt) errors.push("Access Grant revogado");
        if (grant.expires_at && Date.parse(grant.expires_at) <= checkedAt) errors.push("Access Grant expirado");
        if (grant.approved_by !== binding.approval.approved_by) errors.push("aprovador do binding diverge do Access Grant");
        if (Date.parse(binding.approval.approved_at) > checkedAt) errors.push("aprova\xE7\xE3o ocorreu depois da checagem");
      }
    }
  }
  return errors;
}
function inside(root, configured, fallback) {
  const brain = resolve5(root);
  const directory2 = resolve5(root, configured || fallback);
  const rel = relative4(brain, directory2);
  if (!rel || rel.startsWith("..") || rel.startsWith(sep5)) throw new Error("systemSourceBindings aponta para fora do C\xE9rebro");
  return directory2;
}
function systemSourceBindingDirectory(root) {
  return inside(root, layout(root).systemSourceBindings, ".cerebro/runtime/system-source-bindings");
}
function listSystemSourceBindings(root, issues = []) {
  const directory2 = systemSourceBindingDirectory(root);
  if (!existsSync5(directory2)) return [];
  const bindings = [];
  for (const name of readdirSync2(directory2).filter((item) => item.endsWith(".json")).sort()) {
    const path = join5(directory2, name);
    try {
      if (!lstatSync4(path).isFile() || lstatSync4(path).isSymbolicLink()) throw new Error("not-file");
      const binding = JSON.parse(readFileSync6(path, "utf8"));
      const errors = validateSystemSourceBinding(binding);
      if (errors.length) throw new Error(errors.join(" \xB7 "));
      bindings.push({ binding, path });
    } catch {
      issues.push({ reason_code: "system-source-binding-invalid", ref: relative4(root, path).replaceAll("\\", "/") });
    }
  }
  return bindings;
}
function indexSystemSourceBindings(root, issues = []) {
  const byRole = /* @__PURE__ */ new Map();
  for (const entry of listSystemSourceBindings(root, issues)) {
    const key2 = `${entry.binding.system_ref}:${entry.binding.role}`;
    if (byRole.has(key2)) {
      byRole.set(key2, { binding: null, path: null, ambiguous: true });
      issues.push({ reason_code: "system-source-binding-ambiguous", ref: key2 });
    } else byRole.set(key2, entry);
  }
  return byRole;
}

// ../scripts/lib/source-read-runtime.mjs
var receiptSchema = JSON.parse(readFileSync7(new URL("../../protocol/source-read-receipt.schema.json", import.meta.url)));
function validateSourceReadReceipt(value) {
  const errors = validateJsonSchema(value, receiptSchema);
  if (errors.length) return errors;
  if (!Number.isFinite(Date.parse(value.occurred_at))) errors.push("source-read-time-invalid");
  if (value.would_deny !== (value.decision === "denied") || value.blocked !== (value.mode === "enforce" && value.would_deny)) errors.push("source-read-decision-invalid");
  if (value.bytes !== null && value.bytes < 0) errors.push("source-read-bytes-invalid");
  if (value.blocked && (value.content_digest !== null || value.bytes !== null)) errors.push("denied-read-cannot-contain-content");
  return errors;
}
var sourceDigest = (bytes) => `sha256:${createHash2("sha256").update(bytes).digest("hex")}`;
var REF = /^[A-Za-z0-9][A-Za-z0-9_.:-]{0,127}$/;
function sourceReadMode(mode = "observe") {
  if (!["observe", "enforce"].includes(mode)) throw new Error("source-read-mode-invalid");
  return mode;
}
function regularLocalFile(root, path) {
  const base = realpathSync5(root);
  const rel = relative5(resolve6(root), resolve6(root, path));
  const target = resolve6(base, rel);
  if (!rel || rel.startsWith("..") || rel.startsWith(sep6)) throw new Error("source-path-invalid");
  let cursor = base;
  for (const [i, part] of rel.split(sep6).entries()) {
    cursor = join6(cursor, part);
    const stat = lstatSync5(cursor);
    if (stat.isSymbolicLink() || !(i === rel.split(sep6).length - 1 ? stat.isFile() : stat.isDirectory())) {
      throw new Error("source-path-invalid");
    }
  }
  return target;
}
function json(root, path) {
  return JSON.parse(readFileSync7(regularLocalFile(root, path), "utf8"));
}
function instant2(clock) {
  const now = new Date(typeof clock === "function" ? clock() : clock);
  if (!Number.isFinite(now.getTime())) throw new Error("source-read-clock-invalid");
  return now;
}
function validateRequest(request) {
  if (!request || !ID_RE2.test(request.system_ref || "") || !REF_ID_RE.test(request.source_ref || "") || !REF.test(request.run_ref || "") || !ID_RE2.test(request.action || "read-source") || request.role != null && !ID_RE2.test(request.role) || request.layer != null && !CONTEXT_LAYERS.includes(request.layer) || request.partition != null && !REF.test(request.partition) || request.version != null && !REF.test(request.version) || request.grant_ref != null && !REF_ID_RE.test(request.grant_ref)) throw new Error("source-read-request-invalid");
}
function evaluateSourceRead(root, request, { now = /* @__PURE__ */ new Date(), secretProvider } = {}) {
  validateRequest(request);
  const denied = (reason_code) => ({ decision: "denied", reason_code, grant_ref: null, binding_ref: null, authority_digest: null });
  try {
    const config = layout(root);
    const system = json(root, join6(config.systemContracts || ".cerebro/contracts/systems", `${request.system_ref}.json`));
    const source = json(root, join6(config.sourceContracts || ".cerebro/contracts/sources", `${request.source_ref}.json`));
    const roles = system.sources?.filter((s) => s.source_id === request.source_ref && (!request.role || s.role === request.role)) || [];
    if (roles.length !== 1) return denied("source-role-missing-or-ambiguous");
    const directory2 = systemSourceBindingDirectory(root);
    const bindings = existsSync6(directory2) ? readdirSync3(directory2).filter((n) => n.endsWith(".json")).map((n) => json(root, join6(directory2, n))).filter((b) => b.system_ref === request.system_ref && b.role === roles[0].role) : [];
    if (bindings.length !== 1) return denied(bindings.length ? "binding-ambiguous" : "binding-missing");
    const binding = bindings[0];
    if (binding.status !== "ready") return denied("binding-not-ready");
    const grant = loadAccessGrant(root, binding.grant_ref).grant;
    json(root, join6(config.accessGrants || ".cerebro/contracts/access-grants", `${binding.grant_ref}.json`));
    const refs4 = { grant_ref: grant.grant_id, binding_ref: binding.binding_id, authority_digest: null };
    const no = (reason_code) => ({ decision: "denied", reason_code, ...refs4 });
    if (request.grant_ref && request.grant_ref !== grant.grant_id) return no("binding-grant-mismatch");
    const access = evaluateAccess(grant, {
      subject_ref: request.system_ref,
      system_ref: request.system_ref,
      source_ref: request.source_ref,
      action: request.action || "read-source",
      mode: "read"
    }, secretProvider, now);
    if (!["allowed", "file-only"].includes(access.decision)) return no(access.reason_code);
    if (validateSystemSourceBindingReferences(binding, { system, source, grant }).length) return no("binding-reference-invalid");
    if (Date.parse(binding.approval.approved_at) > now.getTime()) return no("binding-not-active");
    const role = system.retrieval?.source_roles?.find((r) => r.role === roles[0].role);
    if (role?.layer && role.layer !== request.layer) return no("layer-not-bound");
    if (role?.partition && ![].concat(role.partition).includes(request.partition)) return no("partition-not-bound");
    return {
      decision: "allowed",
      reason_code: "grant-and-binding-valid",
      ...refs4,
      authority_digest: sourceDigest(JSON.stringify({ grant: authorityIdentity(grant), binding, system, source }))
    };
  } catch {
    return denied("source-authority-unavailable");
  }
}
function record(root, request, evaluation, mode, now, { digest: digest2 = null, bytes = null, phase = "read" } = {}) {
  const receipt2 = {
    schema_version: 1,
    receipt_id: `source-read-${randomUUID2()}`,
    run_ref: request.run_ref,
    system_ref: request.system_ref,
    source_ref: request.source_ref,
    action: request.action || "read-source",
    role: request.role ?? null,
    layer: request.layer ?? null,
    partition: request.partition ?? null,
    version: request.version ?? null,
    selection_digest: sourceDigest(String(request.selection_ref || request.path_ref || "undeclared")),
    mode,
    phase,
    occurred_at: now.toISOString(),
    decision: evaluation.decision,
    would_deny: evaluation.decision !== "allowed",
    blocked: mode === "enforce" && evaluation.decision !== "allowed",
    reason_code: evaluation.reason_code,
    grant_ref: evaluation.grant_ref,
    binding_ref: evaluation.binding_ref,
    authority_digest: evaluation.authority_digest,
    content_digest: digest2,
    bytes
  };
  if (validateSourceReadReceipt(receipt2).length) throw new Error("source-read-receipt-invalid");
  writeJsonAtomic(join6(root, ".cerebro/runtime/receipts/source-reads", `${receipt2.receipt_id}.json`), receipt2);
  return { ...receipt2, ref: `source-read:${receipt2.receipt_id}` };
}
function createSourceReader(root, { runRef, systemRef, mode = "observe", clock = () => /* @__PURE__ */ new Date(), secretProvider } = {}) {
  mode = sourceReadMode(mode);
  const receipts = [], consumed = [];
  const requestFor = (input) => {
    const request = { ...input, run_ref: runRef, system_ref: systemRef };
    validateRequest(request);
    return request;
  };
  const evaluate = (request, now) => evaluateSourceRead(root, request, { now, secretProvider });
  const save = (request, evaluation, now, options) => {
    const receipt2 = record(root, request, evaluation, mode, now, options);
    receipts.push(receipt2);
    return receipt2;
  };
  function read(input, loader) {
    const request = requestFor(input), started = instant2(clock), before = evaluate(request, started);
    if (mode === "enforce" && before.decision !== "allowed") {
      return { delivered: false, receipt: save(request, before, started) };
    }
    let content;
    try {
      content = loader();
      if (!(typeof content === "string" || Buffer.isBuffer(content))) throw new Error("source-reader-bytes-required");
    } catch {
      const receipt3 = save(request, { ...before, decision: "denied", reason_code: "source-read-failed" }, instant2(clock));
      return { delivered: false, receipt: receipt3 };
    }
    const finished = instant2(clock);
    let after = evaluate(request, finished);
    if (finished < started) after = { ...after, decision: "denied", reason_code: "clock-regressed" };
    else if (before.decision === "allowed" && after.decision === "allowed" && before.authority_digest !== after.authority_digest) {
      after = { ...after, decision: "denied", reason_code: "authority-changed-during-read" };
    } else if (before.decision !== "allowed") after = before;
    const blocked = mode === "enforce" && after.decision !== "allowed";
    const receipt2 = save(request, after, finished, blocked ? {} : { digest: sourceDigest(content), bytes: Buffer.byteLength(content) });
    if (blocked) return { delivered: false, receipt: receipt2 };
    consumed.push({ request, authority_digest: after.authority_digest, receipt: receipt2 });
    return { delivered: true, content, receipt: receipt2 };
  }
  return {
    mode,
    receipts,
    // Loader belongs to a trusted connector, never to a model or captured content.
    read,
    readFile(input) {
      return read(input, () => {
        const file2 = regularLocalFile(root, input.path_ref);
        const config = layout(root);
        const source = json(root, join6(config.sourceContracts || ".cerebro/contracts/sources", `${input.source_ref}.json`));
        const scopes = source.extensions?.porta?.paths || [source.truth?.home_ref];
        const matched = scopes.some((scope) => {
          if (typeof scope !== "string" || scope.includes(":") || scope.startsWith("/")) return false;
          const home = resolve6(realpathSync5(root), scope);
          return file2 === home || file2.startsWith(`${home}${sep6}`);
        });
        if (!matched) throw new Error("source-file-not-bound");
        return readFileSync7(file2, "utf8");
      });
    },
    check(input) {
      const request = requestFor(input), now = instant2(clock);
      return save(request, evaluate(request, now), now, { phase: "preflight" });
    },
    recheck() {
      let allowed = true;
      for (const item of consumed) {
        const now = instant2(clock);
        let result = evaluate(item.request, now);
        if (result.decision === "allowed" && item.authority_digest !== result.authority_digest) {
          result = { ...result, decision: "denied", reason_code: "authority-changed-before-provider" };
        }
        if (result.decision !== "allowed") allowed = false;
        save(item.request, result, now, { phase: "before-provider" });
      }
      return mode === "observe" || allowed;
    }
  };
}
function guardDerivedOutput(root, receipt2, options = {}) {
  if (receipt2.provider_context?.mode !== "enforce") return () => {
  };
  const reader = createSourceReader(root, { ...options, mode: "enforce", runRef: receipt2.run_id, systemRef: receipt2.system_ref });
  const sources = receipt2.provider_context.attempts.at(-1)?.sources || [];
  const prior = /* @__PURE__ */ new Map();
  return () => {
    for (const source of sources) {
      const ref = source.access_receipt_ref;
      if (!/^source-read:source-read-[a-f0-9-]{36}$/.test(ref || "")) throw new Error("source-output-receipt-invalid");
      const original = json(root, join6(".cerebro/runtime/receipts/source-reads", `${ref.slice("source-read:".length)}.json`));
      if (original.run_ref !== receipt2.run_id || original.system_ref !== receipt2.system_ref || original.source_ref !== source.source_ref || original.content_digest !== source.content_digest || original.decision !== "allowed") throw new Error("source-output-receipt-mismatch");
      const checked = reader.check({
        source_ref: source.source_ref,
        action: original.action,
        role: original.role,
        layer: source.layer,
        partition: source.partition,
        version: source.version,
        grant_ref: source.grant_ref
      });
      if (checked.blocked || original.authority_digest !== checked.authority_digest || prior.has(ref) && prior.get(ref) !== checked.authority_digest) {
        throw new Error("source-output-access-denied");
      }
      prior.set(ref, checked.authority_digest);
    }
  };
}

// ../scripts/lib/judgment-protocol.mjs
import { createHash as createHash5, randomUUID as randomUUID4 } from "node:crypto";
import {
  existsSync as existsSync10,
  lstatSync as lstatSync8,
  readFileSync as readFileSync13,
  readdirSync as readdirSync6,
  realpathSync as realpathSync8,
  statSync as statSync2
} from "node:fs";
import { dirname as dirname3, join as join10, relative as relative9, resolve as resolve10, sep as sep10 } from "node:path";

// ../scripts/lib/provider-context-receipt.mjs
import { readFileSync as readFileSync8 } from "node:fs";
var providerContextSchema = JSON.parse(readFileSync8(new URL("../../protocol/provider-context.schema.json", import.meta.url)));
function validateProviderContext(value) {
  const errors = validateJsonSchema(value, providerContextSchema);
  if (errors.length) return errors;
  if (value.attempts.length > 100 || value.access_receipt_refs.length > 1e4) errors.push("provider-context-too-large");
  let previous = 0;
  for (const item of value.attempts) {
    if (item.attempt <= previous || item.attempt < 1 || item.bytes < 0) errors.push("provider-attempt-invalid");
    previous = item.attempt;
    if (item.coverage === "mediated" !== !item.unmediated_reads_possible) errors.push("provider-coverage-invalid");
    if (item.sources.some((s) => s.bytes < 0) || item.inputs.some((s) => s.bytes < 0)) errors.push("provider-bytes-invalid");
  }
  return errors;
}

// ../scripts/lib/routine-output-verification.mjs
function validateRequiredOutputs(value) {
  if (!Array.isArray(value) || value.length === 0 || value.length > 32 || new Set(value).size !== value.length || value.some((ref) => typeof ref !== "string" || !/^[A-Za-z0-9_.\/-]+(?:\{date\}[A-Za-z0-9_.\/-]*)?$/.test(ref) || ref.startsWith("/") || ref.split("/").some((part) => part === ".." || part === ".") || !ref.endsWith(".md"))) return ["extensions.required_outputs exige caminhos relativos .md; {date} opcional"];
  return [];
}

// ../scripts/lib/routine-protocol.mjs
import { existsSync as existsSync7, readFileSync as readFileSync9, readdirSync as readdirSync4 } from "node:fs";
import { isAbsolute as isAbsolute3, join as join7, relative as relative6, resolve as resolve7, sep as sep7 } from "node:path";
var LOCAL_REF_RE3 = /^(?!\.?\.?$)(?!\.\.?\/)(?!.*\/\.\.(?:\/|$))[A-Za-z0-9.][A-Za-z0-9_./:-]{0,255}$/;
var ADAPTERS = /* @__PURE__ */ new Set(["codex-cli", "claude-code"]);
var RECEIPT_ADAPTERS = /* @__PURE__ */ new Set([...ADAPTERS, "unresolved", "procedural"]);
var AUTH_STATUSES = /* @__PURE__ */ new Set(["ready", "missing", "authentication-required", "degraded"]);
var PERMISSIONS = /* @__PURE__ */ new Set(["read-only", "workspace-write"]);
var REASONING = /* @__PURE__ */ new Set(["low", "medium", "high", "xhigh", "max"]);
var RUN_STATUSES = /* @__PURE__ */ new Set(["completed", "failed", "denied", "skipped"]);
var MODES2 = /* @__PURE__ */ new Set(["read", "propose", "write-with-approval"]);
var WEEKDAYS = /* @__PURE__ */ new Set(["MO", "TU", "WE", "TH", "FR", "SA", "SU"]);
var MIGRATION_SOURCES = /* @__PURE__ */ new Set([
  "claude-scheduled-task",
  "codex-automation",
  "launchd",
  "cron",
  "github-actions",
  "other"
]);
var MIGRATION_STATUSES = /* @__PURE__ */ new Set([
  "awaiting-legacy-pause",
  "ready-for-activation",
  "cutover-completed",
  "cancelled"
]);
var COLLECTOR_EXECUTABLES = /* @__PURE__ */ new Set(["python3", "node"]);
var COLLECTOR_ARG_RE = /^(?!-c$)(?!.*[;&|`$<>])[A-Za-z0-9._/:=-]{1,255}$/;
var JSON_POINTER_RE = /^\/(?:[A-Za-z0-9_.-]+(?:\/[A-Za-z0-9_.-]+)*)?$/;
var SHA256_RE = /^[a-f0-9]{64}$/;
var WEEKDAY_FROM_INTL = { Mon: "MO", Tue: "TU", Wed: "WE", Thu: "TH", Fri: "FR", Sat: "SA", Sun: "SU" };
var SECRET_RE = /Bearer\s+|-----BEGIN .*PRIVATE KEY-----|\b(?:sk|ghp|xoxb)[-_A-Za-z0-9]{12,}/i;
var MAX_SCHEDULE_LOOKBACK_MINUTES = 62 * 24 * 60;
function object8(value) {
  return value !== null && typeof value === "object" && !Array.isArray(value);
}
function closed3(errors, value, path, keys) {
  if (!object8(value)) return;
  const allowed = new Set(keys);
  for (const key2 of Object.keys(value)) if (!allowed.has(key2)) errors.push(`${path}.${key2} n\xE3o \xE9 permitido`);
}
function text(errors, value, path) {
  if (typeof value !== "string" || !value.trim()) errors.push(`${path} precisa ser texto n\xE3o vazio`);
}
function date3(errors, value, path, nullable = false) {
  if (nullable && value === null) return;
  if (!Number.isFinite(Date.parse(value || ""))) errors.push(`${path} inv\xE1lido`);
}
function localRef(errors, value, path, { relativePath = false, allowDot = false } = {}) {
  if (relativePath && allowDot && value === ".") return;
  if (!LOCAL_REF_RE3.test(value || "")) {
    errors.push(`${path} inv\xE1lido`);
    return;
  }
  if (relativePath) {
    if (value === "." || isAbsolute3(value) || value.split(/[\\/]/).includes("..")) errors.push(`${path} precisa ficar dentro do C\xE9rebro`);
  }
}
function unique2(errors, values, path) {
  if (Array.isArray(values) && new Set(values).size !== values.length) errors.push(`${path} n\xE3o pode repetir itens`);
}
function list2(errors, value, path) {
  if (!Array.isArray(value)) errors.push(`${path} precisa ser lista`);
}
function validTimezone(value) {
  try {
    new Intl.DateTimeFormat("en-US", { timeZone: value }).format(/* @__PURE__ */ new Date());
    return true;
  } catch {
    return false;
  }
}
function referenceOnly2(errors, value, path) {
  const serialized = JSON.stringify(value);
  if (SECRET_RE.test(serialized)) errors.push(`${path} parece conter segredo`);
  if (/"(?:prompt|output|raw_error|token|api_key|oauth)"\s*:/i.test(serialized)) {
    errors.push(`${path} cont\xE9m payload ou credencial em vez de refer\xEAncia`);
  }
}
function validateRoutineContract(value) {
  const errors = [];
  if (!object8(value)) return ["routine contract precisa ser objeto"];
  closed3(errors, value, "routine_contract", [
    "protocol_version",
    "routine_id",
    "version",
    "name",
    "lifecycle",
    "system_ref",
    "trigger",
    "placement",
    "executor",
    "context",
    "permission_mode",
    "destination",
    "operations",
    "approval",
    "privacy",
    "extensions"
  ]);
  if (value.protocol_version !== 1) errors.push("protocol_version precisa ser 1");
  if (!ID_RE2.test(value.routine_id || "")) errors.push("routine_id inv\xE1lido");
  if (!VERSION_RE2.test(value.version || "")) errors.push("version inv\xE1lida");
  text(errors, value.name, "name");
  if (!["draft", "approved", "retired"].includes(value.lifecycle)) errors.push("lifecycle inv\xE1lido");
  if (!ID_RE2.test(value.system_ref || "")) errors.push("system_ref inv\xE1lido");
  if (!object8(value.trigger)) errors.push("trigger precisa ser objeto");
  else {
    closed3(errors, value.trigger, "trigger", ["type", "schedule"]);
    if (!["manual", "schedule"].includes(value.trigger.type)) errors.push("trigger.type inv\xE1lido");
    if (value.trigger.type === "manual" && value.trigger.schedule !== null) errors.push("trigger manual exige schedule null");
    if (value.trigger.type === "schedule" && !object8(value.trigger.schedule)) errors.push("trigger schedule exige calend\xE1rio");
    if (object8(value.trigger.schedule)) {
      const schedule = value.trigger.schedule;
      closed3(errors, schedule, "trigger.schedule", [
        "cadence",
        "time",
        "timezone",
        "weekdays",
        "month_days",
        "not_before",
        "missed_run_policy"
      ]);
      if (!["daily", "weekly", "monthly"].includes(schedule.cadence)) errors.push("trigger.schedule.cadence inv\xE1lida");
      if (!/^(?:[01][0-9]|2[0-3]):[0-5][0-9]$/.test(schedule.time || "")) errors.push("trigger.schedule.time inv\xE1lido");
      if (!validTimezone(schedule.timezone)) errors.push("trigger.schedule.timezone inv\xE1lido");
      list2(errors, schedule.weekdays, "trigger.schedule.weekdays");
      const weekdays = Array.isArray(schedule.weekdays) ? schedule.weekdays : [];
      for (const day of weekdays) if (!WEEKDAYS.has(day)) errors.push("trigger.schedule.weekdays cont\xE9m valor inv\xE1lido");
      unique2(errors, schedule.weekdays, "trigger.schedule.weekdays");
      list2(errors, schedule.month_days, "trigger.schedule.month_days");
      const monthDays = Array.isArray(schedule.month_days) ? schedule.month_days : [];
      for (const day of monthDays) {
        if (!Number.isInteger(day) || day < 1 || day > 28) errors.push("trigger.schedule.month_days cont\xE9m valor inv\xE1lido");
      }
      unique2(errors, schedule.month_days, "trigger.schedule.month_days");
      if (schedule.cadence === "weekly" && weekdays.length === 0) errors.push("cad\xEAncia semanal exige weekdays");
      if (schedule.cadence !== "weekly" && weekdays.length !== 0) errors.push("weekdays s\xF3 existe na cad\xEAncia semanal");
      if (schedule.cadence === "monthly" && monthDays.length === 0) errors.push("cad\xEAncia mensal exige month_days");
      if (schedule.cadence !== "monthly" && monthDays.length !== 0) errors.push("month_days s\xF3 existe na cad\xEAncia mensal");
      date3(errors, schedule.not_before, "trigger.schedule.not_before");
      if (!["run-on-wake", "skip"].includes(schedule.missed_run_policy)) errors.push("missed_run_policy inv\xE1lida");
    }
  }
  if (!object8(value.placement)) errors.push("placement precisa ser objeto");
  else {
    closed3(errors, value.placement, "placement", ["host_ref", "workspace_ref"]);
    if (!REF_ID_RE.test(value.placement.host_ref || "")) errors.push("placement.host_ref inv\xE1lido");
    if (!REF_ID_RE.test(value.placement.workspace_ref || "")) errors.push("placement.workspace_ref inv\xE1lido");
  }
  if (!object8(value.executor)) errors.push("executor precisa ser objeto");
  else {
    closed3(errors, value.executor, "executor", ["binding_ref", "requested_model", "reasoning_effort"]);
    if (!REF_ID_RE.test(value.executor.binding_ref || "")) errors.push("executor.binding_ref inv\xE1lido");
    localRef(errors, value.executor.requested_model, "executor.requested_model");
    if (!REASONING.has(value.executor.reasoning_effort)) errors.push("executor.reasoning_effort inv\xE1lido");
  }
  if (!object8(value.context)) errors.push("context precisa ser objeto");
  else {
    closed3(errors, value.context, "context", ["prompt_ref", "skill_refs", "access_requests"]);
    localRef(errors, value.context.prompt_ref, "context.prompt_ref", { relativePath: true });
    if (value.context.skill_refs !== void 0) {
      list2(errors, value.context.skill_refs, "context.skill_refs");
      for (const ref of Array.isArray(value.context.skill_refs) ? value.context.skill_refs : []) {
        localRef(errors, ref, "context.skill_refs[]", { relativePath: true });
      }
      unique2(errors, value.context.skill_refs, "context.skill_refs");
    }
    list2(errors, value.context.access_requests, "context.access_requests");
    const grantRefs = [];
    const accessRequests = Array.isArray(value.context.access_requests) ? value.context.access_requests : [];
    for (const [index, request] of accessRequests.entries()) {
      const path = `context.access_requests[${index}]`;
      if (!object8(request)) {
        errors.push(`${path} precisa ser objeto`);
        continue;
      }
      closed3(errors, request, path, ["grant_ref", "source_ref", "action", "mode"]);
      if (!REF_ID_RE.test(request.grant_ref || "")) errors.push(`${path}.grant_ref inv\xE1lido`);
      if (!REF_ID_RE.test(request.source_ref || "")) errors.push(`${path}.source_ref inv\xE1lido`);
      if (!ID_RE2.test(request.action || "")) errors.push(`${path}.action inv\xE1lida`);
      if (!MODES2.has(request.mode)) errors.push(`${path}.mode inv\xE1lido`);
      grantRefs.push(request.grant_ref);
    }
    unique2(errors, grantRefs, "context.access_requests.grant_ref");
  }
  if (!PERMISSIONS.has(value.permission_mode)) errors.push("permission_mode inv\xE1lido");
  if (value.permission_mode === "read-only" && Array.isArray(value.context?.access_requests) && value.context.access_requests.some((request) => request?.mode === "write-with-approval")) {
    errors.push("write-with-approval exige permission_mode workspace-write");
  }
  if (!object8(value.destination)) errors.push("destination precisa ser objeto");
  else {
    closed3(errors, value.destination, "destination", ["kind", "ref"]);
    if (!["runtime-output", "local-file"].includes(value.destination.kind)) errors.push("destination.kind inv\xE1lido");
    localRef(errors, value.destination.ref, "destination.ref", { relativePath: value.destination.kind === "local-file" });
  }
  if (!object8(value.operations)) errors.push("operations precisa ser objeto");
  else {
    closed3(errors, value.operations, "operations", ["timeout_seconds", "retry", "concurrency"]);
    if (!Number.isInteger(value.operations.timeout_seconds) || value.operations.timeout_seconds < 10 || value.operations.timeout_seconds > 7200) errors.push("operations.timeout_seconds inv\xE1lido");
    if (value.operations.concurrency !== "forbid") errors.push("operations.concurrency precisa ser forbid");
    if (!object8(value.operations.retry)) errors.push("operations.retry precisa ser objeto");
    else {
      const retry = value.operations.retry;
      closed3(errors, retry, "operations.retry", ["max_attempts", "backoff_seconds", "idempotency_scope"]);
      if (!Number.isInteger(retry.max_attempts) || retry.max_attempts < 1 || retry.max_attempts > 3) errors.push("retry.max_attempts inv\xE1lido");
      if (!Number.isInteger(retry.backoff_seconds) || retry.backoff_seconds < 0 || retry.backoff_seconds > 900) errors.push("retry.backoff_seconds inv\xE1lido");
      if (retry.idempotency_scope !== "scheduled-slot") errors.push("retry.idempotency_scope precisa ser scheduled-slot");
    }
  }
  if (!object8(value.approval)) errors.push("approval precisa ser objeto");
  else {
    closed3(errors, value.approval, "approval", ["required_before_schedule", "approved_by", "approved_at"]);
    if (value.approval.required_before_schedule !== true) errors.push("approval.required_before_schedule precisa ser true");
    if (value.approval.approved_by !== null && !REF_ID_RE.test(value.approval.approved_by || "")) errors.push("approval.approved_by inv\xE1lido");
    date3(errors, value.approval.approved_at, "approval.approved_at", true);
    if (value.lifecycle === "approved" && (!value.approval.approved_by || !value.approval.approved_at)) {
      errors.push("routine approved exige approved_by e approved_at");
    }
    if (value.lifecycle === "draft" && (value.approval.approved_by !== null || value.approval.approved_at !== null)) {
      errors.push("routine draft n\xE3o pode fingir aprova\xE7\xE3o");
    }
  }
  if (!hasExactPrivacyShape(value.privacy)) errors.push("privacy inv\xE1lida");
  if (value.extensions !== void 0 && !object8(value.extensions)) errors.push("extensions precisa ser objeto");
  if (value.extensions?.required_outputs !== void 0) errors.push(...validateRequiredOutputs(value.extensions.required_outputs));
  if (object8(value.extensions?.decision_context)) {
    const decision = value.extensions.decision_context;
    closed3(errors, decision, "extensions.decision_context", [
      "schema_version",
      "required",
      "binding_ref",
      "execution_mode"
    ]);
    if (decision.schema_version !== 1) errors.push("extensions.decision_context.schema_version inv\xE1lido");
    if (decision.required !== true) errors.push("extensions.decision_context.required precisa ser true");
    if (!REF_ID_RE.test(decision.binding_ref || "")) errors.push("extensions.decision_context.binding_ref inv\xE1lido");
    if (decision.execution_mode !== "output-only") errors.push("extensions.decision_context.execution_mode inv\xE1lido");
  } else if (value.extensions?.decision_context !== void 0) {
    errors.push("extensions.decision_context precisa ser objeto");
  }
  if (object8(value.extensions?.preparation)) {
    const preparation = value.extensions.preparation;
    closed3(errors, preparation, "extensions.preparation", [
      "kind",
      "binding_ref",
      "output_ref",
      "source_selections"
    ]);
    if (preparation.kind !== "trusted-local-command") errors.push("extensions.preparation.kind inv\xE1lido");
    if (!REF_ID_RE.test(preparation.binding_ref || "")) errors.push("extensions.preparation.binding_ref inv\xE1lido");
    localRef(errors, preparation.output_ref, "extensions.preparation.output_ref", { relativePath: true });
    if (preparation.source_selections !== void 0) {
      list2(errors, preparation.source_selections, "extensions.preparation.source_selections");
      const sourceRefs = [];
      const selections = Array.isArray(preparation.source_selections) ? preparation.source_selections : [];
      for (const [index, selection] of selections.entries()) {
        const path = `extensions.preparation.source_selections[${index}]`;
        if (!object8(selection)) {
          errors.push(`${path} precisa ser objeto`);
          continue;
        }
        closed3(errors, selection, path, [
          "source_ref",
          "selected_pointers",
          "freshness_pointer",
          "retrieval_receipt_pointer",
          "expected_profile_sha256"
        ]);
        if (!REF_ID_RE.test(selection.source_ref || "")) errors.push(`${path}.source_ref inv\xE1lido`);
        sourceRefs.push(selection.source_ref);
        const pointerMode = selection.selected_pointers !== void 0 || selection.freshness_pointer !== void 0;
        const receiptMode = selection.retrieval_receipt_pointer !== void 0 || selection.expected_profile_sha256 !== void 0;
        if (pointerMode === receiptMode) {
          errors.push(`${path} exige exatamente um modo: JSON Pointer ou retrieval receipt`);
        } else if (pointerMode) {
          list2(errors, selection.selected_pointers, `${path}.selected_pointers`);
          const pointers = Array.isArray(selection.selected_pointers) ? selection.selected_pointers : [];
          if (pointers.length === 0) errors.push(`${path}.selected_pointers precisa ter pelo menos 1 item`);
          for (const pointer of pointers) {
            if (!JSON_POINTER_RE.test(pointer || "")) errors.push(`${path}.selected_pointers cont\xE9m JSON Pointer inv\xE1lido`);
          }
          unique2(errors, selection.selected_pointers, `${path}.selected_pointers`);
          if (selection.freshness_pointer !== null && !JSON_POINTER_RE.test(selection.freshness_pointer || "")) {
            errors.push(`${path}.freshness_pointer inv\xE1lido`);
          }
        } else {
          if (!JSON_POINTER_RE.test(selection.retrieval_receipt_pointer || "")) {
            errors.push(`${path}.retrieval_receipt_pointer inv\xE1lido`);
          }
          if (!SHA256_RE.test(selection.expected_profile_sha256 || "")) {
            errors.push(`${path}.expected_profile_sha256 inv\xE1lido`);
          }
        }
      }
      unique2(errors, sourceRefs, "extensions.preparation.source_selections.source_ref");
    }
  } else if (value.extensions?.preparation !== void 0) {
    errors.push("extensions.preparation precisa ser objeto");
  }
  if (object8(value.extensions?.evaluation)) {
    const evaluation = value.extensions.evaluation;
    closed3(errors, evaluation, "extensions.evaluation", ["kind", "evaluator_ref", "source_pointer"]);
    if (evaluation.kind !== "registered-evaluator") errors.push("extensions.evaluation.kind inv\xE1lido");
    if (evaluation.evaluator_ref !== "calls-deterministic-v1") {
      errors.push("extensions.evaluation.evaluator_ref inv\xE1lido");
    }
    if (!JSON_POINTER_RE.test(evaluation.source_pointer || "")) {
      errors.push("extensions.evaluation.source_pointer inv\xE1lido");
    }
    if (!object8(value.extensions?.preparation) || !Array.isArray(value.extensions.preparation.source_selections)) {
      errors.push("extensions.evaluation exige preparation com source_selections");
    }
  } else if (value.extensions?.evaluation !== void 0) {
    errors.push("extensions.evaluation precisa ser objeto");
  }
  referenceOnly2(errors, value, "routine_contract");
  return [...new Set(errors)];
}
function validateExecutorBinding(value) {
  const errors = [];
  if (!object8(value)) return ["executor binding precisa ser objeto"];
  closed3(errors, value, "executor_binding", [
    "protocol_version",
    "binding_id",
    "adapter",
    "host_ref",
    "workspace_ref",
    "workspace_path",
    "auth",
    "model_policy",
    "permission_profile",
    "observed_at",
    "privacy"
  ]);
  if (value.protocol_version !== 1) errors.push("protocol_version precisa ser 1");
  if (!REF_ID_RE.test(value.binding_id || "")) errors.push("binding_id inv\xE1lido");
  if (!ADAPTERS.has(value.adapter)) errors.push("adapter inv\xE1lido");
  if (!REF_ID_RE.test(value.host_ref || "")) errors.push("host_ref inv\xE1lido");
  if (!REF_ID_RE.test(value.workspace_ref || "")) errors.push("workspace_ref inv\xE1lido");
  localRef(errors, value.workspace_path, "workspace_path", { relativePath: true, allowDot: true });
  if (!object8(value.auth)) errors.push("auth precisa ser objeto");
  else {
    closed3(errors, value.auth, "auth", ["type", "status"]);
    if (value.auth.type !== "provider-session") errors.push("auth.type precisa ser provider-session");
    if (!AUTH_STATUSES.has(value.auth.status)) errors.push("auth.status inv\xE1lido");
  }
  if (!object8(value.model_policy)) errors.push("model_policy precisa ser objeto");
  else {
    closed3(errors, value.model_policy, "model_policy", ["default_model", "allowed_models"]);
    localRef(errors, value.model_policy.default_model, "model_policy.default_model");
    list2(errors, value.model_policy.allowed_models, "model_policy.allowed_models");
    const allowedModels = Array.isArray(value.model_policy.allowed_models) ? value.model_policy.allowed_models : [];
    for (const model of allowedModels) localRef(errors, model, "model_policy.allowed_models[]");
    unique2(errors, value.model_policy.allowed_models, "model_policy.allowed_models");
    if (allowedModels.length > 0 && !allowedModels.includes(value.model_policy.default_model)) {
      errors.push("default_model precisa estar em allowed_models quando a lista \xE9 fechada");
    }
  }
  if (!PERMISSIONS.has(value.permission_profile)) errors.push("permission_profile inv\xE1lido");
  date3(errors, value.observed_at, "observed_at");
  if (!object8(value.privacy) || value.privacy.credential_stored !== false || !hasExactPrivacyShape(value.privacy, ["credential_stored"])) {
    errors.push("privacy inv\xE1lida");
  }
  referenceOnly2(errors, value, "executor_binding");
  return [...new Set(errors)];
}
function validateCollectorBinding(value) {
  const errors = [];
  if (!object8(value)) return ["collector binding precisa ser objeto"];
  closed3(errors, value, "collector_binding", [
    "protocol_version",
    "binding_id",
    "kind",
    "executable",
    "args",
    "workspace_ref",
    "workspace_path",
    "output_ref",
    "timeout_seconds",
    "status",
    "observed_at",
    "privacy"
  ]);
  if (value.protocol_version !== 1) errors.push("protocol_version precisa ser 1");
  if (!REF_ID_RE.test(value.binding_id || "")) errors.push("binding_id inv\xE1lido");
  if (value.kind !== "trusted-local-command") errors.push("kind inv\xE1lido");
  if (!COLLECTOR_EXECUTABLES.has(value.executable)) errors.push("executable inv\xE1lido");
  list2(errors, value.args, "args");
  if (!Array.isArray(value.args) || value.args.length < 1 || value.args.length > 16) errors.push("args exige 1 a 16 itens");
  for (const argument of Array.isArray(value.args) ? value.args : []) {
    if (!COLLECTOR_ARG_RE.test(argument || "") || isAbsolute3(argument) || argument.split(/[\\/]/).includes("..")) errors.push("args cont\xE9m item inseguro");
  }
  if (!REF_ID_RE.test(value.workspace_ref || "")) errors.push("workspace_ref inv\xE1lido");
  localRef(errors, value.workspace_path, "workspace_path", { relativePath: true, allowDot: true });
  localRef(errors, value.output_ref, "output_ref", { relativePath: true });
  if (!Number.isInteger(value.timeout_seconds) || value.timeout_seconds < 10 || value.timeout_seconds > 1800) {
    errors.push("timeout_seconds inv\xE1lido");
  }
  if (!["ready", "missing", "degraded"].includes(value.status)) errors.push("status inv\xE1lido");
  date3(errors, value.observed_at, "observed_at");
  if (!object8(value.privacy) || value.privacy.credential_stored !== false || value.privacy.stdout_recorded !== false || !hasExactPrivacyShape(value.privacy, ["credential_stored", "stdout_recorded"])) {
    errors.push("privacy inv\xE1lida");
  }
  referenceOnly2(errors, value, "collector_binding");
  return [...new Set(errors)];
}
function validateRoutineRunReceipt(value) {
  const errors = [];
  if (!object8(value)) return ["routine run receipt precisa ser objeto"];
  closed3(errors, value, "routine_run_receipt", [
    "protocol_version",
    "receipt_id",
    "run_id",
    "routine_ref",
    "routine_id",
    "routine_version",
    "system_ref",
    "binding_ref",
    "adapter",
    "requested_model",
    "model_observation",
    "trigger",
    "model_usage",
    "slot_key",
    "scheduled_for",
    "attempts",
    "status",
    "reason_code",
    "started_at",
    "completed_at",
    "input_refs",
    "output_ref",
    "output_digest",
    "output_bytes",
    "access_receipt_refs",
    "decision_context",
    "execution_context",
    "context_observation_ref",
    "content_shared_with_provider",
    "privacy",
    "provider_context"
  ]);
  if (value.provider_context !== void 0) {
    const contextErrors = validateProviderContext(value.provider_context);
    errors.push(...contextErrors);
    if (!contextErrors.length && (value.content_shared_with_provider !== value.provider_context.attempts.length > 0 || value.provider_context.attempts.some((a) => a.attempt > value.attempts))) errors.push("provider-context-attempts-mismatch");
  }
  if (value.execution_context !== void 0) errors.push(...validateExecutionContextForRecord(value));
  if (value.context_observation_ref !== void 0) localRef(errors, value.context_observation_ref, "context_observation_ref");
  if (value.protocol_version !== 1) errors.push("protocol_version precisa ser 1");
  if (!REF_ID_RE.test(value.receipt_id || "")) errors.push("receipt_id inv\xE1lido");
  if (!REF_ID_RE.test(value.run_id || "")) errors.push("run_id inv\xE1lido");
  localRef(errors, value.routine_ref, "routine_ref");
  if (!ID_RE2.test(value.routine_id || "")) errors.push("routine_id inv\xE1lido");
  if (!VERSION_RE2.test(value.routine_version || "")) errors.push("routine_version inv\xE1lida");
  if (value.routine_ref !== `routine:${value.routine_id}:${value.routine_version}`) errors.push("routine_ref n\xE3o corresponde ao id/vers\xE3o");
  if (!ID_RE2.test(value.system_ref || "")) errors.push("system_ref inv\xE1lido");
  if (!REF_ID_RE.test(value.binding_ref || "")) errors.push("binding_ref inv\xE1lido");
  if (!RECEIPT_ADAPTERS.has(value.adapter)) errors.push("adapter inv\xE1lido");
  const procedural = value.adapter === "procedural";
  if (procedural) {
    if (value.requested_model !== null) errors.push("adapter procedural exige requested_model null");
    if (value.model_observation !== "not-applicable") {
      errors.push("adapter procedural exige model_observation not-applicable");
    }
  } else {
    localRef(errors, value.requested_model, "requested_model");
    if (!["requested-not-verified", "provider-reported"].includes(value.model_observation)) {
      errors.push("model_observation inv\xE1lido");
    }
  }
  const hasModelUsage = value.model_usage !== void 0 && value.model_usage !== null;
  if (value.model_usage !== void 0 && value.model_usage !== null) {
    if (!object8(value.model_usage)) errors.push("model_usage precisa ser objeto ou null");
    else {
      const models = Object.keys(value.model_usage);
      if (models.length < 1 || models.length > 16) errors.push("model_usage exige 1 a 16 modelos");
      for (const model of models) {
        if (!/^claude-[a-z0-9][a-z0-9._-]{0,119}$/.test(model)) {
          errors.push("model_usage cont\xE9m modelo inv\xE1lido");
          continue;
        }
        const usage = value.model_usage[model];
        if (!object8(usage)) {
          errors.push(`model_usage.${model} precisa ser objeto`);
          continue;
        }
        closed3(errors, usage, `model_usage.${model}`, [
          "inputTokens",
          "outputTokens",
          "cacheReadInputTokens",
          "cacheCreationInputTokens"
        ]);
        if (!Object.hasOwn(usage, "outputTokens")) {
          errors.push(`model_usage.${model}.outputTokens \xE9 obrigat\xF3rio`);
        }
        for (const field of [
          "inputTokens",
          "outputTokens",
          "cacheReadInputTokens",
          "cacheCreationInputTokens"
        ]) {
          if (Object.hasOwn(usage, field) && (!Number.isSafeInteger(usage[field]) || usage[field] < 0)) {
            errors.push(`model_usage.${model}.${field} inv\xE1lido`);
          }
        }
      }
    }
  }
  if (value.model_observation === "provider-reported" && !hasModelUsage) {
    errors.push("provider-reported exige model_usage observado");
  }
  if (value.model_observation === "requested-not-verified" && hasModelUsage) {
    errors.push("requested-not-verified n\xE3o pode alegar model_usage observado");
  }
  if (procedural && hasModelUsage) errors.push("adapter procedural n\xE3o pode alegar model_usage");
  if (!["manual", "schedule"].includes(value.trigger)) errors.push("trigger inv\xE1lido");
  if (!REF_ID_RE.test(value.slot_key || "")) errors.push("slot_key inv\xE1lido");
  date3(errors, value.scheduled_for, "scheduled_for", true);
  if (value.trigger === "schedule" && value.scheduled_for === null) errors.push("trigger schedule exige scheduled_for");
  if (value.trigger === "manual" && value.scheduled_for !== null) errors.push("trigger manual exige scheduled_for null");
  const recurring = procedural && value.routine_id === "context-input-recurring";
  const protocolMarkers = Array.isArray(value.input_refs) ? value.input_refs.filter((ref) => typeof ref === "string" && ref.startsWith("context-input-recurring-protocol:")) : [];
  const knownMeetingMarkers = /* @__PURE__ */ new Set(["context-input-recurring-protocol:2", "context-input-recurring-protocol:3"]);
  if (recurring && (protocolMarkers.length > 1 || protocolMarkers.some((ref) => !knownMeetingMarkers.has(ref)))) {
    errors.push("marcadores de protocolo recorrente incompat\xEDveis");
  }
  const recurringMeetings = recurring && protocolMarkers.length === 1 && knownMeetingMarkers.has(protocolMarkers[0]);
  const maxAttempts = recurringMeetings ? 4 : 3;
  if (!Number.isInteger(value.attempts) || value.attempts < 0 || value.attempts > maxAttempts) errors.push("attempts inv\xE1lido");
  if (!RUN_STATUSES.has(value.status)) errors.push("status inv\xE1lido");
  if (!ID_RE2.test(value.reason_code || "")) errors.push("reason_code inv\xE1lido");
  date3(errors, value.started_at, "started_at");
  date3(errors, value.completed_at, "completed_at");
  if (Date.parse(value.completed_at || "") < Date.parse(value.started_at || "")) errors.push("completed_at anterior a started_at");
  list2(errors, value.input_refs, "input_refs");
  for (const ref of Array.isArray(value.input_refs) ? value.input_refs : []) localRef(errors, ref, "input_refs[]");
  unique2(errors, value.input_refs, "input_refs");
  if (value.output_ref !== null) localRef(errors, value.output_ref, "output_ref", { relativePath: true });
  if (value.status === "completed" && value.output_ref === null) errors.push("run conclu\xEDdo exige output_ref");
  if (["denied", "skipped"].includes(value.status) && value.output_ref !== null) errors.push("run n\xE3o executado n\xE3o pode ter output_ref");
  const hasOutputDigest = value.output_digest !== void 0;
  const hasOutputBytes = value.output_bytes !== void 0;
  if (hasOutputDigest !== hasOutputBytes) errors.push("identidade do output exige digest e tamanho juntos");
  if (hasOutputDigest) {
    if (value.output_digest !== null && !/^sha256:[a-f0-9]{64}$/.test(value.output_digest || "")) {
      errors.push("output_digest inv\xE1lido");
    }
    if (value.output_bytes !== null && (!Number.isInteger(value.output_bytes) || value.output_bytes < 0)) {
      errors.push("output_bytes inv\xE1lido");
    }
    if (value.output_digest === null !== (value.output_bytes === null)) {
      errors.push("output_digest e output_bytes precisam ter a mesma nulabilidade");
    }
    if (value.output_ref === null && (value.output_digest !== null || value.output_bytes !== null)) {
      errors.push("output ausente n\xE3o pode ter identidade de bytes");
    }
  }
  list2(errors, value.access_receipt_refs, "access_receipt_refs");
  for (const ref of Array.isArray(value.access_receipt_refs) ? value.access_receipt_refs : []) localRef(errors, ref, "access_receipt_refs[]");
  unique2(errors, value.access_receipt_refs, "access_receipt_refs");
  if (value.decision_context !== void 0 && value.decision_context !== null) {
    const decision = value.decision_context;
    if (!object8(decision)) errors.push("decision_context precisa ser objeto ou null");
    else {
      closed3(errors, decision, "decision_context", [
        "attempt",
        "binding_ref",
        "authority_case_ref",
        "authority_receipt_ref",
        "registry_ref",
        "decision_refs",
        "fingerprint",
        "gate"
      ]);
      if (!Number.isInteger(decision.attempt) || decision.attempt < 1 || decision.attempt > 3) errors.push("decision_context.attempt inv\xE1lido");
      for (const field of ["binding_ref", "authority_case_ref", "authority_receipt_ref", "registry_ref"]) {
        localRef(errors, decision[field], `decision_context.${field}`);
      }
      list2(errors, decision.decision_refs, "decision_context.decision_refs");
      for (const ref of Array.isArray(decision.decision_refs) ? decision.decision_refs : []) localRef(errors, ref, "decision_context.decision_refs[]");
      unique2(errors, decision.decision_refs, "decision_context.decision_refs");
      if (!/^sha256:[a-f0-9]{64}$/.test(decision.fingerprint || "")) errors.push("decision_context.fingerprint inv\xE1lido");
      if (!["governing", "changed", "failed"].includes(decision.gate)) errors.push("decision_context.gate inv\xE1lido");
    }
  }
  if (value.status === "completed" && value.decision_context !== void 0 && (value.output_digest === void 0 || value.output_digest === null)) {
    errors.push("run governado conclu\xEDdo exige identidade do output");
  }
  if (typeof value.content_shared_with_provider !== "boolean") errors.push("content_shared_with_provider precisa ser booleano");
  if (value.attempts === 0 && value.content_shared_with_provider !== false) errors.push("zero tentativas n\xE3o pode alegar envio ao provider");
  if (procedural && value.content_shared_with_provider !== false) {
    errors.push("adapter procedural n\xE3o compartilha conte\xFAdo com provider");
  }
  if (!object8(value.privacy) || value.privacy.prompt_recorded !== false || value.privacy.output_recorded !== false || value.privacy.raw_error_recorded !== false || !hasExactPrivacyShape(value.privacy, [
    "prompt_recorded",
    "output_recorded",
    "raw_error_recorded"
  ])) errors.push("privacy inv\xE1lida");
  referenceOnly2(errors, value, "routine_run_receipt");
  return [...new Set(errors)];
}
function validateRoutineMigration(value) {
  const errors = [];
  if (!object8(value)) return ["routine migration precisa ser objeto"];
  closed3(errors, value, "routine_migration", [
    "protocol_version",
    "migration_id",
    "routine_id",
    "routine_ref",
    "source",
    "status",
    "duplicate_run_risk",
    "observed_at",
    "legacy_pause",
    "cutover",
    "privacy"
  ]);
  if (value.protocol_version !== 1) errors.push("protocol_version precisa ser 1");
  if (!REF_ID_RE.test(value.migration_id || "")) errors.push("migration_id inv\xE1lido");
  if (!ID_RE2.test(value.routine_id || "")) errors.push("routine_id inv\xE1lido");
  const routineMatch = String(value.routine_ref || "").match(/^routine:([a-z0-9][a-z0-9-]{0,63}):(\d+\.\d+\.\d+(?:[-+][A-Za-z0-9.-]+)?)$/);
  if (!routineMatch || routineMatch[1] !== value.routine_id) errors.push("routine_ref inv\xE1lido");
  if (!object8(value.source)) errors.push("source precisa ser objeto");
  else {
    closed3(errors, value.source, "source", ["kind", "schedule_ref", "schedule_summary"]);
    if (!MIGRATION_SOURCES.has(value.source.kind)) errors.push("source.kind inv\xE1lido");
    localRef(errors, value.source.schedule_ref, "source.schedule_ref");
    text(errors, value.source.schedule_summary, "source.schedule_summary");
    if (typeof value.source.schedule_summary === "string" && value.source.schedule_summary.length > 240) {
      errors.push("source.schedule_summary excede 240 caracteres");
    }
  }
  if (!MIGRATION_STATUSES.has(value.status)) errors.push("status inv\xE1lido");
  if (typeof value.duplicate_run_risk !== "boolean") errors.push("duplicate_run_risk precisa ser booleano");
  date3(errors, value.observed_at, "observed_at");
  if (!object8(value.legacy_pause)) errors.push("legacy_pause precisa ser objeto");
  else {
    closed3(errors, value.legacy_pause, "legacy_pause", ["status", "evidence_ref", "confirmed_by", "confirmed_at"]);
    const pause = value.legacy_pause;
    if (!["unknown", "confirmed", "not-required"].includes(pause.status)) errors.push("legacy_pause.status inv\xE1lido");
    if (pause.evidence_ref !== null) localRef(errors, pause.evidence_ref, "legacy_pause.evidence_ref");
    if (pause.confirmed_by !== null && !REF_ID_RE.test(pause.confirmed_by || "")) errors.push("legacy_pause.confirmed_by inv\xE1lido");
    date3(errors, pause.confirmed_at, "legacy_pause.confirmed_at", true);
    const hasReadback = pause.evidence_ref && pause.confirmed_by && pause.confirmed_at;
    if (pause.status === "confirmed" && !hasReadback) errors.push("pausa confirmada exige evid\xEAncia, autor e data");
    if (pause.status === "unknown" && [pause.evidence_ref, pause.confirmed_by, pause.confirmed_at].some((item) => item !== null)) {
      errors.push("pausa desconhecida n\xE3o pode fingir readback");
    }
    if (value.duplicate_run_risk && pause.status === "not-required") errors.push("risco de duplicidade exige pausa confirmada");
    if (value.status === "awaiting-legacy-pause" && pause.status !== "unknown") errors.push("status awaiting exige pausa desconhecida");
    if (value.status === "ready-for-activation" && !["confirmed", "not-required"].includes(pause.status)) {
      errors.push("status ready exige readback da agenda legada");
    }
  }
  if (!object8(value.cutover)) errors.push("cutover precisa ser objeto");
  else {
    closed3(errors, value.cutover, "cutover", ["activation_receipt_ref", "completed_at"]);
    if (value.cutover.activation_receipt_ref !== null) localRef(errors, value.cutover.activation_receipt_ref, "cutover.activation_receipt_ref");
    date3(errors, value.cutover.completed_at, "cutover.completed_at", true);
    if (value.status === "cutover-completed" && (!value.cutover.activation_receipt_ref || !value.cutover.completed_at)) {
      errors.push("cutover conclu\xEDdo exige recibo de ativa\xE7\xE3o e data");
    }
    if (value.status !== "cutover-completed" && (value.cutover.activation_receipt_ref !== null || value.cutover.completed_at !== null)) {
      errors.push("cutover pendente n\xE3o pode fingir conclus\xE3o");
    }
  }
  if (!object8(value.privacy) || value.privacy.legacy_payload_recorded !== false || !hasExactPrivacyShape(value.privacy, ["legacy_payload_recorded"])) {
    errors.push("privacy inv\xE1lida");
  }
  referenceOnly2(errors, value, "routine_migration");
  return [...new Set(errors)];
}
function safeDirectory(root, configured, fallback, privateBase) {
  const brainRoot = resolve7(root);
  const target = resolve7(root, configured || fallback);
  if (target === brainRoot || !target.startsWith(`${brainRoot}${sep7}`)) throw new Error("layout de Rotinas aponta para fora do C\xE9rebro");
  const boundary = resolve7(root, privateBase);
  if (target === boundary || !target.startsWith(`${boundary}${sep7}`)) {
    throw new Error(`layout de Rotinas precisa ficar em ${privateBase}`);
  }
  return target;
}
function routineContractPath(root, routineId2) {
  if (!ID_RE2.test(routineId2 || "")) throw new Error("routine_id inv\xE1lido");
  return join7(safeDirectory(
    root,
    layout(root).routineContracts,
    join7(".cerebro", "contracts", "routines"),
    join7(".cerebro", "contracts")
  ), `${routineId2}.json`);
}
function executorBindingPath(root, bindingId) {
  if (!REF_ID_RE.test(bindingId || "")) throw new Error("binding_id inv\xE1lido");
  return join7(safeDirectory(
    root,
    layout(root).executorBindings,
    join7(".cerebro", "runtime", "executors"),
    join7(".cerebro", "runtime")
  ), `${bindingId}.json`);
}
function collectorBindingPath(root, bindingId) {
  if (!REF_ID_RE.test(bindingId || "")) throw new Error("binding_id inv\xE1lido");
  return join7(safeDirectory(
    root,
    layout(root).collectorBindings,
    join7(".cerebro", "runtime", "collectors"),
    join7(".cerebro", "runtime")
  ), `${bindingId}.json`);
}
function routineReceiptDirectory(root) {
  return safeDirectory(
    root,
    layout(root).routineReceipts,
    join7(".cerebro", "runtime", "receipts", "routines"),
    join7(".cerebro", "runtime")
  );
}
function routineStateDirectory(root) {
  return safeDirectory(
    root,
    layout(root).routineState,
    join7(".cerebro", "runtime", "routines"),
    join7(".cerebro", "runtime")
  );
}
function routineMigrationDirectory(root) {
  return safeDirectory(
    root,
    layout(root).routineMigrations,
    join7(".cerebro", "runtime", "migrations", "routines"),
    join7(".cerebro", "runtime")
  );
}
function routineOutputDirectory(root) {
  return safeDirectory(
    root,
    layout(root).routineOutputs,
    join7(".cerebro", "runtime", "outputs", "routines"),
    join7(".cerebro", "runtime")
  );
}
function loadRoutineContract(root, routineId2) {
  const path = routineContractPath(root, routineId2);
  if (!existsSync7(path)) throw new Error(`Routine Contract n\xE3o encontrado: ${routineId2}`);
  const contract = readJson(path, `Routine Contract ${routineId2}`);
  const errors = validateRoutineContract(contract);
  if (errors.length) throw new Error(`Routine Contract inv\xE1lido: ${errors.join(" \xB7 ")}`);
  return { contract, path, ref: `routine:${contract.routine_id}:${contract.version}` };
}
function listRoutineContracts(root) {
  const directory2 = safeDirectory(
    root,
    layout(root).routineContracts,
    join7(".cerebro", "contracts", "routines"),
    join7(".cerebro", "contracts")
  );
  if (!existsSync7(directory2)) return [];
  return readdirSync4(directory2).filter((name) => name.endsWith(".json")).sort().map((name) => {
    const value = readJson(join7(directory2, name), `Routine Contract ${name}`);
    const errors = validateRoutineContract(value);
    if (errors.length) throw new Error(`Routine Contract ${name} inv\xE1lido: ${errors.join(" \xB7 ")}`);
    return value;
  });
}
function loadExecutorBinding(root, bindingId) {
  const path = executorBindingPath(root, bindingId);
  if (!existsSync7(path)) throw new Error(`Executor Binding n\xE3o encontrado: ${bindingId}`);
  const binding = readJson(path, `Executor Binding ${bindingId}`);
  const errors = validateExecutorBinding(binding);
  if (errors.length) throw new Error(`Executor Binding inv\xE1lido: ${errors.join(" \xB7 ")}`);
  return { binding, path, ref: `executor-binding:${binding.binding_id}` };
}
function loadCollectorBinding(root, bindingId) {
  const path = collectorBindingPath(root, bindingId);
  if (!existsSync7(path)) throw new Error(`Collector Binding n\xE3o encontrado: ${bindingId}`);
  const binding = readJson(path, `Collector Binding ${bindingId}`);
  const errors = validateCollectorBinding(binding);
  if (errors.length) throw new Error(`Collector Binding inv\xE1lido: ${errors.join(" \xB7 ")}`);
  return { binding, path, ref: `collector-binding:${binding.binding_id}` };
}
function routineStatePath(root, routineId2) {
  if (!ID_RE2.test(routineId2 || "")) throw new Error("routine_id inv\xE1lido");
  return join7(routineStateDirectory(root), `${routineId2}.state.json`);
}
function defaultRoutineState(routineId2) {
  return {
    runtime_version: 1,
    routine_id: routineId2,
    status: "disabled",
    activated_at: null,
    activated_by: null,
    activation_evidence_ref: null,
    paused_at: null,
    paused_by: null,
    last_checked_at: null,
    last_scheduled_for: null,
    last_receipt_ref: null
  };
}
function validateRoutineState(value) {
  const errors = [];
  if (!object8(value)) return ["routine state precisa ser objeto"];
  closed3(errors, value, "routine_state", [
    "runtime_version",
    "routine_id",
    "status",
    "activated_at",
    "activated_by",
    "activation_evidence_ref",
    "paused_at",
    "paused_by",
    "last_checked_at",
    "last_scheduled_for",
    "last_receipt_ref"
  ]);
  if (value.runtime_version !== 1) errors.push("runtime_version precisa ser 1");
  if (!ID_RE2.test(value.routine_id || "")) errors.push("routine_id inv\xE1lido");
  if (!["disabled", "active", "paused"].includes(value.status)) errors.push("status inv\xE1lido");
  for (const field of ["activated_at", "paused_at", "last_checked_at", "last_scheduled_for"]) date3(errors, value[field], field, true);
  for (const field of ["activated_by", "paused_by"]) {
    if (value[field] !== null && !REF_ID_RE.test(value[field] || "")) errors.push(`${field} inv\xE1lido`);
  }
  for (const field of ["activation_evidence_ref", "last_receipt_ref"]) {
    if (value[field] !== null) localRef(errors, value[field], field);
  }
  if (value.status === "active" && (!value.activated_at || !value.activated_by || !value.activation_evidence_ref)) {
    errors.push("estado active exige ativa\xE7\xE3o e evid\xEAncia");
  }
  if (value.status === "paused" && (!value.paused_at || !value.paused_by)) errors.push("estado paused exige autor e data");
  return [...new Set(errors)];
}
function loadRoutineState(root, routineId2) {
  const path = routineStatePath(root, routineId2);
  if (!existsSync7(path)) return { state: defaultRoutineState(routineId2), path };
  const state2 = readJson(path, `Routine State ${routineId2}`);
  const errors = validateRoutineState(state2);
  if (errors.length) throw new Error(`Routine State inv\xE1lido: ${errors.join(" \xB7 ")}`);
  return { state: state2, path };
}
function readRoutineRunReceipt(root, receiptRef) {
  const prefix = "routine-receipt:";
  const receiptId = receiptRef?.startsWith(prefix) ? receiptRef.slice(prefix.length) : "";
  if (!REF_ID_RE.test(receiptId)) throw new Error("Routine Run Receipt inv\xE1lido");
  const path = join7(routineReceiptDirectory(root), `${receiptId}.json`);
  if (!existsSync7(path)) throw new Error("Routine Run Receipt n\xE3o encontrado");
  const value = readJson(path, "Routine Run Receipt");
  const errors = validateRoutineRunReceipt(value);
  if (errors.length) throw new Error(`Routine Run Receipt inv\xE1lido: ${errors.join(" \xB7 ")}`);
  return value;
}
function listRoutineRunReceipts(root, routineId2 = null) {
  const directory2 = routineReceiptDirectory(root);
  if (!existsSync7(directory2)) return [];
  return readdirSync4(directory2).filter((name) => name.endsWith(".json")).sort().map((name) => {
    const value = readJson(join7(directory2, name), `Routine Run Receipt ${name}`);
    const errors = validateRoutineRunReceipt(value);
    if (errors.length) throw new Error(`Routine Run Receipt ${name} inv\xE1lido: ${errors.join(" \xB7 ")}`);
    return value;
  }).filter((value) => routineId2 === null || value.routine_id === routineId2);
}
function routineMigrationPath(root, routineId2) {
  if (!ID_RE2.test(routineId2 || "")) throw new Error("routine_id inv\xE1lido");
  return join7(routineMigrationDirectory(root), `${routineId2}.json`);
}
function loadRoutineMigration(root, routineId2, { optional = false } = {}) {
  const path = routineMigrationPath(root, routineId2);
  if (!existsSync7(path)) {
    if (optional) return { migration: null, path, ref: null };
    throw new Error(`Routine Migration n\xE3o encontrada: ${routineId2}`);
  }
  const migration = readJson(path, `Routine Migration ${routineId2}`);
  const errors = validateRoutineMigration(migration);
  if (errors.length) throw new Error(`Routine Migration inv\xE1lido: ${errors.join(" \xB7 ")}`);
  return { migration, path, ref: `routine-migration:${migration.migration_id}` };
}
function routineMigrationBlocker(root, routineId2) {
  const { migration } = loadRoutineMigration(root, routineId2, { optional: true });
  if (!migration) return null;
  if (migration.status === "cancelled") return "routine-migration-cancelled";
  if (migration.duplicate_run_risk && migration.legacy_pause.status !== "confirmed") {
    return "legacy-schedule-not-paused";
  }
  return null;
}
var ZONED_FORMATTERS = /* @__PURE__ */ new Map();
var ZONED_PARTS_CACHE = /* @__PURE__ */ new Map();
var ZONED_PARTS_CACHE_MAX = 4e5;
function zonedFormatter(timezone) {
  let formatter = ZONED_FORMATTERS.get(timezone);
  if (!formatter) {
    formatter = new Intl.DateTimeFormat("en-US", {
      timeZone: timezone,
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
      hourCycle: "h23",
      weekday: "short"
    });
    ZONED_FORMATTERS.set(timezone, formatter);
  }
  return formatter;
}
function zonedParts(dateValue, timezone) {
  const epochMinute = Math.floor(new Date(dateValue).getTime() / 6e4);
  const cacheKey = `${epochMinute}|${timezone}`;
  const cached = ZONED_PARTS_CACHE.get(cacheKey);
  if (cached) return cached;
  const parts = zonedFormatter(timezone).formatToParts(dateValue);
  const value = Object.fromEntries(parts.filter((part) => part.type !== "literal").map((part) => [part.type, part.value]));
  const result = {
    localDate: `${value.year}-${value.month}-${value.day}`,
    day: Number(value.day),
    time: `${value.hour}:${value.minute}`,
    weekday: WEEKDAY_FROM_INTL[value.weekday]
  };
  if (ZONED_PARTS_CACHE.size >= ZONED_PARTS_CACHE_MAX) ZONED_PARTS_CACHE.clear();
  ZONED_PARTS_CACHE.set(cacheKey, result);
  return result;
}
function scheduleMatches(schedule, instant3) {
  if (instant3.getTime() < Date.parse(schedule.not_before)) return false;
  const parts = zonedParts(instant3, schedule.timezone);
  if (parts.time !== schedule.time) return false;
  if (schedule.cadence === "weekly" && !schedule.weekdays.includes(parts.weekday)) return false;
  if (schedule.cadence === "monthly" && !schedule.month_days.includes(parts.day)) return false;
  return true;
}
function scheduledSlotsBetween(schedule, after, until) {
  const end = new Date(until);
  const afterDate = new Date(after);
  if (!Number.isFinite(end.getTime()) || !Number.isFinite(afterDate.getTime()) || end <= afterDate) return [];
  const floorEnd = Math.floor(end.getTime() / 6e4) * 6e4;
  const cappedAfter = Math.max(afterDate.getTime(), floorEnd - MAX_SCHEDULE_LOOKBACK_MINUTES * 6e4);
  let cursor = Math.floor(cappedAfter / 6e4) * 6e4 + 6e4;
  const slots = /* @__PURE__ */ new Map();
  for (; cursor <= floorEnd; cursor += 6e4) {
    const instant3 = new Date(cursor);
    if (!scheduleMatches(schedule, instant3)) continue;
    const local = zonedParts(instant3, schedule.timezone);
    const localKey = `${local.localDate}-${schedule.time}-${schedule.timezone}`;
    if (!slots.has(localKey)) slots.set(localKey, instant3.toISOString());
  }
  return [...slots.values()];
}

// ../scripts/lib/decision-runtime.mjs
import { createHash as createHash4 } from "node:crypto";
import { existsSync as existsSync9, lstatSync as lstatSync7, readFileSync as readFileSync12, realpathSync as realpathSync7 } from "node:fs";
import { join as join9, relative as relative8, resolve as resolve9, sep as sep9 } from "node:path";

// ../scripts/lib/context-contracts.mjs
import { readFileSync as readFileSync10 } from "node:fs";
var schema = JSON.parse(readFileSync10(new URL("../../protocol/context/record.v1.schema.json", import.meta.url)));
var bindingSchema = JSON.parse(readFileSync10(new URL("../../protocol/context/binding.private.v1.schema.json", import.meta.url)));
var externalKinds = /* @__PURE__ */ new Set(["actor", "policy", "procedure", "context", "output", "evidence", "system", "routine"]);
var object9 = (value) => value !== null && typeof value === "object" && !Array.isArray(value);
var referenceOf = ({ kind, id: id3, version }) => ({ kind, id: id3, version });
var key = (value) => JSON.stringify([value.kind, value.id, value.version]);
var same2 = (a, b) => a != null && b != null && key(a) === key(b);
var isRef = (value) => object9(value) && Object.keys(value).sort().join(",") === "id,kind,version";
var time = (value) => Date.parse(value);
var active = (validity, now) => time(validity.from) <= time(now) && (validity.until === null || time(now) < time(validity.until));
function validDate(value) {
  if (typeof value !== "string" || !/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d+)?(?:Z|[+-]\d{2}:\d{2})$/.test(value) || !Number.isFinite(time(value))) return false;
  const [year, month, day] = value.slice(0, 10).split("-").map(Number);
  return month >= 1 && month <= 12 && day >= 1 && day <= new Date(Date.UTC(year, month, 0)).getUTCDate();
}
function scalarChecks(value, node, root, path, errors) {
  if (node.$ref) return scalarChecks(value, root.$defs[node.$ref.split("/").at(-1)], root, path, errors);
  if (node.oneOf) {
    const candidate = node.oneOf.find((item) => validateJsonSchema(value, { ...item, $defs: root.$defs }).length === 0);
    if (candidate) scalarChecks(value, candidate, root, path, errors);
    return;
  }
  if (node.format === "date-time" && value !== null && !validDate(value)) errors.push(`${path}: invalid-date`);
  if (node.type === "integer" && !Number.isSafeInteger(value)) errors.push(`${path}: unsafe-integer`);
  if (typeof value === "number" && node.minimum !== void 0 && value < node.minimum) errors.push(`${path}: below-minimum`);
  if (typeof value === "number" && node.maximum !== void 0 && value > node.maximum) errors.push(`${path}: above-maximum`);
  if (Array.isArray(value)) value.forEach((item, i) => scalarChecks(item, node.items, root, `${path}[${i}]`, errors));
  if (Array.isArray(value) && value.every(isRef) && new Set(value.map(key)).size !== value.length) errors.push(`${path}: duplicate-reference`);
  if (object9(value)) for (const [field, item] of Object.entries(value)) {
    if (node.properties?.[field]) scalarChecks(item, node.properties[field], root, `${path}.${field}`, errors);
  }
}
function scan(value, { privateBinding = false } = {}, path = "$", errors = []) {
  if (typeof value === "string") {
    if (/\bBearer\s+\S+|-----BEGIN .*PRIVATE KEY-----|\b(?:sk-[A-Za-z0-9_-]{12,}|gh[pousr]_[A-Za-z0-9]{12,}|AKIA[A-Z0-9]{16})\b|(?:password|api[_-]?key|access[_-]?token|secret)\s*[:=]\s*\S+|[\w.+-]+@[\w.-]+\.[A-Za-z]{2,}/i.test(value)) errors.push("embedded-secret-or-pii");
    if (!privateBinding && /(?:os-keychain|keychain|vault-secret|env):|\.cerebro\/runtime|\/Users\/|\/home\/|https?:\/\//i.test(value)) errors.push("private-binding-in-record");
  }
  if (Array.isArray(value)) value.forEach((item, i) => scan(item, { privateBinding }, `${path}[${i}]`, errors));
  else if (object9(value)) for (const [field, item] of Object.entries(value)) {
    if (/^(?:secret|password|token|api_key|access_token|raw|prompt|transcript|body)$/i.test(field) || !privateBinding && /^(?:credential_ref|binding_ref|environment_ref|runtime_ref|runtime|connector|home_ref)$/.test(field)) errors.push("prohibited-field");
    scan(item, { privateBinding }, `${path}.${field}`, errors);
  }
  return errors;
}
function references(value, path = "$", found = []) {
  if (isRef(value)) found.push({ value, path });
  else if (Array.isArray(value)) value.forEach((item, i) => references(item, `${path}[${i}]`, found));
  else if (object9(value)) for (const [field, item] of Object.entries(value)) references(item, `${path}.${field}`, found);
  return found;
}
function validateContextRecord(value) {
  const errors = validateJsonSchema(value, schema);
  errors.push(...scan(value));
  if (errors.length) return [...new Set(errors)];
  scalarChecks(value, schema, schema, "$", errors);
  const check2 = (condition, code) => {
    if (!condition) errors.push(code);
  };
  const window = value.window || value.validity;
  if (window?.until !== null && window) check2(time(window.from) < time(window.until), "invalid-window");
  if (value.supersedes) check2(!same2(value, value.supersedes), "self-supersession");
  if (value.model) {
    check2(value.model.status === "observed" ? value.model.model_id !== null && value.model.evidence !== null : value.model.model_id === null && value.model.effort === null && value.model.evidence === null, "model-observation-unproven");
  }
  if (value.kind === "source") {
    check2(value.milestone_policy.captured === "required", "capture-required");
    if (value.service_levels) for (const stage of ["captured", "prepared", "consolidated"]) {
      const target = value.service_levels[stage];
      const required = value.milestone_policy[stage] === "required";
      check2(target.mode === "not_required" === !required, `service-level-${stage}-requirement-mismatch`);
      check2(
        target.mode === "not_required" ? target.max_lag_seconds === null : Number.isSafeInteger(target.max_lag_seconds) && target.max_lag_seconds >= 1 && target.max_lag_seconds <= 31536e3,
        `service-level-${stage}-lag-invalid`
      );
    }
  }
  if (value.kind === "source-revision") {
    if (value.occurred_at) check2(time(value.occurred_at) <= time(value.observed_at), "observation-before-occurrence");
    if (value.captured_at) check2(time(value.observed_at) <= time(value.captured_at), "capture-before-observation");
    if (["captured", "prepared", "eligible"].includes(value.state)) check2(value.captured_at !== null, "capture-time-required");
    if (value.state === "eligible") check2(value.access === "allowed", "eligible-without-access");
  }
  if (value.kind === "coverage") {
    const { counts, denominator, cursor, milestones } = value;
    check2(denominator.status === "unknown" ? denominator.expected === null && denominator.evidence === null : denominator.expected !== null && denominator.evidence !== null, "denominator-evidence-required");
    if (denominator.status === "independent") check2(!same2(denominator.evidence, cursor.capture_receipt) && !Object.values(milestones).some((stage) => same2(stage.evidence, denominator.evidence)), "denominator-not-independent");
    check2(counts.captured <= counts.observed && counts.prepared <= counts.captured && counts.consolidated <= counts.captured, "invalid-stage-counts");
    check2(counts.late === value.late_items.length && counts.late <= counts.observed, "late-items-count-mismatch");
    check2(!cursor.committed || cursor.capture_receipt !== null, "cursor-before-persisted-capture");
    for (const stage of Object.values(milestones)) {
      check2(stage.status === "measured" ? stage.through !== null && stage.evidence !== null : stage.through === null && stage.evidence === null, "milestone-evidence-required");
      if (stage.through) check2(time(stage.through) >= time(value.window.from) && time(stage.through) <= time(value.window.until) && time(stage.through) <= time(value.attempted_at), "milestone-outside-window");
    }
    for (const stage of ["prepared", "consolidated"]) if (milestones[stage].status === "measured") {
      check2(milestones.captured.status === "measured" && time(milestones[stage].through) <= time(milestones.captured.through), "derivation-ahead-of-capture");
    }
    for (const gap of value.gaps) check2(time(gap.window.from) < time(gap.window.until) && time(gap.window.from) >= time(value.window.from) && time(gap.window.until) <= time(value.window.until), "gap-outside-window");
    if (value.next_attempt_at) check2(time(value.next_attempt_at) > time(value.attempted_at), "retry-before-attempt");
    if (value.state !== "observed") check2(!cursor.committed && Object.values(milestones).every((stage) => stage.status !== "measured"), "unobserved-coverage-claim");
    if (value.state === "not_consulted") check2(Object.values(counts).every((n) => n === 0), "unconsulted-counts");
  }
  if (value.kind === "derived") {
    if (value.state === "eligible") check2(value.validations.every((v) => v.status === "passed" && v.evidence), "eligible-without-validation");
    check2(value.state === "withdrawn" ? value.withdrawal !== null : value.withdrawal === null, "withdrawal-evidence-mismatch");
    if (value.state === "expired") check2(value.validity.until !== null, "expiry-required");
  }
  if (value.kind === "decision") {
    check2(value.state === "candidate" ? value.approver === null && value.approval === null : value.approver !== null && value.approval !== null, "human-approval-required");
    check2(value.state === "revoked" ? value.revocation !== null : value.revocation === null, "revocation-evidence-mismatch");
  }
  if (value.kind === "work") {
    if (value.state === "completed") check2(value.closure_evidence !== null, "closure-evidence-required");
    check2(value.authorization.validity.until === null || time(value.authorization.validity.from) < time(value.authorization.validity.until), "invalid-policy-window");
  }
  if (value.kind === "run") {
    check2(Boolean(value.work || value.routine), "run-parent-required");
    check2(value.state === "started" ? value.completed_at === null : value.completed_at !== null, "run-completion-time-required");
    if (value.completed_at) check2(time(value.completed_at) >= time(value.started_at), "run-time-order");
    for (const effect of value.effects) if (effect.state === "applied") check2(effect.evidence !== null, "effect-evidence-required");
  }
  if (value.kind === "release") check2(value.state === "candidate" ? value.promotion === null : value.promotion !== null, "publisher-promotion-required");
  return [...new Set(errors)];
}
function validatePrivateBinding(value) {
  const errors = [...scan(value, { privateBinding: true })];
  if (validateJsonSchema(value, bindingSchema).length) errors.push("private-binding-shape-invalid");
  if (value?.custody === "runtime-exclusive" && !value.credential_ref) errors.push("runtime-credential-ref-required");
  return [...new Set(errors)];
}
function validateContextBundle(records, externalRefs = []) {
  if (!Array.isArray(records) || !Array.isArray(externalRefs)) return ["bundle-arrays-required"];
  const errors = records.flatMap((record2, i) => validateContextRecord(record2).map((error) => `record[${i}]: ${error}`));
  for (const ref of externalRefs) if (!isRef(ref) || !externalKinds.has(ref.kind) || validateJsonSchema(ref, { ...schema.$defs.ref }).length || scan(ref).length) errors.push("invalid-external-reference");
  if (errors.length) return errors;
  const catalog = /* @__PURE__ */ new Map();
  for (const record2 of [...externalRefs, ...records]) {
    if (catalog.has(key(record2))) errors.push("duplicate-reference");
    catalog.set(key(record2), record2);
  }
  for (const record2 of records) for (const ref of references(record2)) if (!catalog.has(key(ref.value))) errors.push(`${record2.kind}.${ref.path}: missing-reference`);
  if (errors.length) return [...new Set(errors)];
  const get = (ref) => catalog.get(key(ref));
  for (const record2 of records) {
    const check2 = (condition, code) => {
      if (!condition) errors.push(`${record2.kind}: ${code}`);
    };
    if (record2.supersedes) {
      const prior = get(record2.supersedes);
      if (record2.kind === "decision") check2(JSON.stringify(record2.scope) === JSON.stringify(prior.scope), "supersession-scope-mismatch");
      if (record2.kind === "source-revision") check2(same2(record2.source, prior.source) && record2.instance_ref === prior.instance_ref && record2.item_id === prior.item_id, "supersession-source-mismatch");
      if (record2.kind === "release") check2(same2(record2.obra, prior.obra), "supersession-obra-mismatch");
      const visited = /* @__PURE__ */ new Set([key(record2)]);
      let cursor = record2.supersedes;
      while (cursor) {
        if (visited.has(key(cursor))) {
          errors.push("supersession-cycle");
          break;
        }
        visited.add(key(cursor));
        cursor = get(cursor).supersedes;
      }
    }
    if (record2.kind === "coverage") {
      for (const stage of ["captured", "prepared", "consolidated"]) {
        check2(record2.milestones[stage].status === "not_required" === (get(record2.source).milestone_policy[stage] === "not_required"), "milestone-policy-mismatch");
      }
      for (const ref of record2.late_items) {
        const revision = get(ref);
        check2(same2(revision.source, record2.source) && revision.instance_ref === record2.instance_ref, "late-item-source-mismatch");
      }
    }
    if (record2.kind === "source-revision") {
      check2(same2(record2.permission, get(record2.source).permission_policy), "revision-permission-policy-mismatch");
    }
    if (record2.kind === "derived") for (const ref of record2.revisions) {
      const revision = get(ref);
      check2(record2.coverage.some((c) => {
        const coverage = get(c);
        return same2(coverage.source, revision.source) && coverage.instance_ref === revision.instance_ref;
      }), "coverage-source-mismatch");
    }
    if (record2.kind === "work") for (const run of record2.runs) check2(same2(get(run).work, record2), "work-run-mismatch");
    if (record2.kind === "run" && record2.work) {
      const work = get(record2.work);
      check2(work.runs.some((ref) => same2(ref, record2)), "run-work-mismatch");
      if (work.lineage) check2(record2.lineage && same2(record2.lineage.obra, work.lineage.obra) && same2(record2.lineage.release, work.lineage.release), "run-work-lineage-mismatch");
      else check2(!record2.lineage, "run-lineage-without-work-lineage");
    }
    if (record2.kind === "run" && !record2.work) check2(!record2.lineage, "run-lineage-without-work");
    if (record2.lineage) {
      const release = get(record2.lineage.release);
      check2(same2(release.obra, record2.lineage.obra) && release.state === "published", "invalid-release-lineage");
    }
    if (record2.kind === "release") check2(record2.publisher_role === get(record2.obra).publisher_role, "publisher-role-mismatch");
  }
  return [...new Set(errors)];
}
function assertValid(errors) {
  if (errors.length) throw new Error(`context-contract-invalid: ${errors.join("; ")}`);
}
function projectContext({ records, external_refs = [], bindings = [], now, scope }) {
  assertValid(validateContextBundle(records, external_refs));
  if (!validDate(now)) throw new Error("invalid-projection-time");
  assertValid(validateJsonSchema(scope, schema.$defs.scope));
  const catalog = new Map(records.map((record2) => [key(record2), record2]));
  const get = (ref) => catalog.get(key(ref));
  const allRefs = new Set([...records, ...external_refs].map(key));
  const bindingKeys = /* @__PURE__ */ new Set();
  for (const binding of bindings) {
    assertValid(validatePrivateBinding(binding));
    if (references(binding).some((ref) => !allRefs.has(key(ref.value)))) throw new Error("binding-reference-missing");
    const id3 = JSON.stringify([key(binding.source), binding.instance_ref]);
    if (bindingKeys.has(id3)) throw new Error("binding-conflict");
    bindingKeys.add(id3);
  }
  const superseded = (record2, candidates) => candidates.some((next) => same2(next.supersedes, record2));
  const revisions = records.filter((r) => r.kind === "source-revision");
  const revisionEligible = (revision) => ["captured", "prepared", "eligible"].includes(revision.state) && revision.access === "allowed" && time(revision.observed_at) <= time(now) && time(revision.captured_at) <= time(now) && !superseded(revision, revisions.filter((r) => time(r.observed_at) <= time(now))) && bindings.some((b) => {
    const source = get(revision.source);
    return same2(b.source, revision.source) && b.instance_ref === revision.instance_ref && b.access === "allowed" && same2(b.permission, revision.permission) && same2(revision.permission, source.permission_policy);
  });
  const within = (value, window) => time(window.from) <= time(value) && time(value) < time(window.until);
  const coverageIncludes = (coverage, revision) => {
    const eventTime = revision.occurred_at || revision.observed_at;
    const captured = coverage.milestones.captured;
    return coverage.state === "observed" && time(coverage.attempted_at) <= time(now) && within(eventTime, coverage.window) && captured.status === "measured" && time(captured.through) >= time(eventTime) && time(revision.captured_at) <= time(coverage.attempted_at) && !coverage.gaps.some((gap) => within(eventTime, gap.window));
  };
  const derivatives = records.filter((r) => r.kind === "derived");
  const derived = derivatives.map((record2) => ({ reference: referenceOf(record2), state: record2.state === "eligible" && active(record2.validity, now) && time(record2.generated_at) <= time(now) && !superseded(record2, derivatives.filter((d) => d.state !== "candidate" && time(d.generated_at) <= time(now))) && record2.revisions.every((ref) => revisionEligible(get(ref))) && record2.revisions.every((ref) => record2.coverage.some((coverageRef) => {
    const coverage = get(coverageRef), revision = get(ref);
    return same2(coverage.source, revision.source) && coverage.instance_ref === revision.instance_ref && coverageIncludes(coverage, revision);
  })) ? "eligible" : "unavailable" }));
  const decisions = records.filter((r) => r.kind === "decision" && r.scope.purpose === scope.purpose && r.scope.target === scope.target);
  const effectiveSuccessors = decisions.filter((d) => d.state !== "candidate" && time(d.validity.from) <= time(now));
  const governing = decisions.filter((d) => d.state === "approved" && active(d.validity, now) && !superseded(d, effectiveSuccessors));
  const revokedSuccessor = effectiveSuccessors.some((d) => d.state === "revoked" && d.supersedes);
  return {
    namespace: "brain-context-read-model",
    schema_version: 1,
    observed_at: now,
    decisions: {
      state: governing.length > 1 ? "conflict" : governing.length === 1 ? "governing" : revokedSuccessor ? "requires_resolution" : "insufficient_evidence",
      references: governing.length === 1 ? [referenceOf(governing[0])] : []
    },
    derived,
    coverage: records.filter((r) => r.kind === "coverage").map((r) => ({
      reference: referenceOf(r),
      state: time(r.attempted_at) > time(now) ? "not_yet_observed" : r.state === "observed" ? r.denominator.status === "unknown" ? "not_measured" : "measured" : r.state,
      attempted_at: r.attempted_at,
      expected: r.denominator.expected,
      observed: r.counts.observed,
      milestones: structuredClone(r.milestones),
      gaps: structuredClone(r.gaps),
      next_attempt_at: r.next_attempt_at
    })),
    works: records.filter((r) => r.kind === "work").map((r) => ({
      reference: referenceOf(r),
      state: r.state,
      owner: r.owner,
      system: r.system || null,
      runs: r.runs,
      closure_condition: r.closure_condition
    }))
  };
}

// ../scripts/lib/decision-case.mjs
import { createHash as createHash3, randomUUID as randomUUID3 } from "node:crypto";
import {
  closeSync as closeSync2,
  existsSync as existsSync8,
  linkSync,
  lstatSync as lstatSync6,
  mkdirSync as mkdirSync5,
  openSync as openSync2,
  readFileSync as readFileSync11,
  readdirSync as readdirSync5,
  realpathSync as realpathSync6,
  statSync,
  unlinkSync as unlinkSync2,
  writeFileSync as writeFileSync3,
  writeSync
} from "node:fs";
import { basename, join as join8, relative as relative7, resolve as resolve8, sep as sep8 } from "node:path";
var DECISION_VERDICTS = /* @__PURE__ */ new Set(["decided", "dropped", "deferred"]);
var ROLLBACK_REASONS = /* @__PURE__ */ new Set(["wrong-verdict", "wrong-evidence", "duplicate", "superseded", "mistake"]);
var EVIDENCE_KINDS = /* @__PURE__ */ new Set(["decision-queue", "routine-receipt", "judgment-receipt", "run-record", "experiment", "note"]);
var MIN_DECISION_TEXT_CHARS = 40;
var MAX_DECISION_TEXT_CHARS = 8e3;
var MIN_TITLE_CHARS = 8;
var MAX_TITLE_CHARS = 120;
var MAX_EVIDENCE = 20;
var PREVIEW_TTL_MS = 15 * 60 * 1e3;
var EXECUTION_METADATA_START = "<!-- BRAIN-EXECUTION-METADATA-V1:START -->";
var EXECUTION_METADATA_END = "<!-- BRAIN-EXECUTION-METADATA-V1:END -->";
var EXECUTION_METADATA_HEADING = "## Proje\xE7\xE3o derivada para execu\xE7\xE3o";
var LOCAL_REF_RE4 = /^(?!\.?\.?$)(?!\.\.?\/)(?!.*\/\.\.(?:\/|$))[A-Za-z0-9.][A-Za-z0-9_./:-]{0,255}$/;
var SECRET_RE2 = /Bearer\s+|-----BEGIN .*PRIVATE KEY-----|\b(?:sk|ghp|xoxb)[-_A-Za-z0-9]{12,}/i;
var EMAIL_RE = /[A-Za-z0-9_.+-]+@[A-Za-z0-9-]+\.[A-Za-z0-9-.]+/;
var PHONE_RE = /\+55\s?\(?\d{2}\)?\s?9?\d{4}[-\s]?\d{4}/;
var CPF_RE = /\b\d{3}\.\d{3}\.\d{3}-\d{2}\b/;
var PII_PATTERNS = Object.freeze([EMAIL_RE, PHONE_RE, CPF_RE]);
var NON_HUMAN_ACTOR_RE = /^(?:agent|bot|system|console|cerebro|model|automation)[-_]/i;
function object10(value) {
  return value !== null && typeof value === "object" && !Array.isArray(value);
}
function closed4(errors, value, path, keys) {
  if (!object10(value)) return;
  const allowed = new Set(keys);
  for (const key2 of Object.keys(value)) if (!allowed.has(key2)) errors.push(`${path}.${key2} n\xE3o \xE9 permitido`);
}
function isCalendarDate(value) {
  if (typeof value !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const parsed = /* @__PURE__ */ new Date(`${value}T00:00:00.000Z`);
  return Number.isFinite(parsed.getTime()) && parsed.toISOString().slice(0, 10) === value;
}
function isInstant(value) {
  if (typeof value !== "string" || !/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/.test(value)) return false;
  const parsed = new Date(value);
  return Number.isFinite(parsed.getTime()) && parsed.toISOString() === value;
}
var GROUP_DIR_RE = /^02-dados-terceiros\/grupos-raw\/[a-z0-9-]+$/;
var MAX_POLICY_GROUP_DIRS = 8;
function isGroupDirList(value) {
  return Array.isArray(value) && value.length >= 1 && value.length <= MAX_POLICY_GROUP_DIRS && value.every((dir, index) => typeof dir === "string" && GROUP_DIR_RE.test(dir) && (index === 0 || value[index - 1] < dir));
}
var immutableGroupKey = (immutable) => object10(immutable) && Object.hasOwn(immutable, "group_dirs") ? "group_dirs" : "group_dir";
function digestOf(value) {
  return `sha256:${createHash3("sha256").update(value).digest("hex")}`;
}
function decisionCaseIdFor(queueKey) {
  if (typeof queueKey !== "string" || !queueKey.trim()) throw new Error("queue-key-invalid");
  return `case-${createHash3("sha256").update(queueKey).digest("hex").slice(0, 32)}`;
}
function insideRealDirectory(parent, child) {
  const rel = relative7(parent, child);
  return Boolean(rel) && !rel.startsWith("..") && !rel.startsWith(sep8);
}
function privateDirectory(root, configured, fallback, label) {
  const brain = resolve8(root);
  const runtime = resolve8(root, ".cerebro", "runtime");
  const target = resolve8(root, configured || fallback);
  if (target === brain || !target.startsWith(`${brain}${sep8}`)) throw new Error(`${label}-layout-outside-brain`);
  if (target === runtime || !target.startsWith(`${runtime}${sep8}`)) throw new Error(`${label}-layout-not-private`);
  if (!existsSync8(runtime)) throw new Error(`${label}-runtime-missing`);
  if (!insideRealDirectory(realpathSync6(brain), realpathSync6(runtime))) throw new Error(`${label}-runtime-outside-brain`);
  let existing = target;
  while (!existsSync8(existing)) {
    const parent = resolve8(existing, "..");
    if (parent === existing) throw new Error(`${label}-storage-parent-missing`);
    existing = parent;
  }
  if (lstatSync6(existing).isSymbolicLink()) throw new Error(`${label}-storage-symlink-blocked`);
  const real = realpathSync6(existing);
  if (real !== realpathSync6(runtime) && !insideRealDirectory(realpathSync6(runtime), real)) {
    throw new Error(`${label}-storage-outside-runtime`);
  }
  return target;
}
function decisionReceiptDirectory(root) {
  return privateDirectory(
    root,
    layout(root).decisionReceipts,
    join8(".cerebro", "runtime", "receipts", "decisions"),
    "decision-receipt"
  );
}
function decisionNotesDirectory(root) {
  const brain = resolve8(root);
  const runtime = resolve8(root, ".cerebro");
  const configured = layout(root).decisionNotes || join8("01-nucleo-privado", "decisoes");
  const target = resolve8(root, configured);
  if (target === brain || !target.startsWith(`${brain}${sep8}`)) throw new Error("decision-notes-outside-brain");
  if (target === runtime || target.startsWith(`${runtime}${sep8}`)) throw new Error("decision-notes-inside-runtime");
  if (target.startsWith(`${resolve8(root, "02-dados-terceiros")}${sep8}`)) throw new Error("decision-notes-in-third-party-zone");
  if (!existsSync8(target)) throw new Error("decision-notes-missing");
  if (lstatSync6(target).isSymbolicLink()) throw new Error("decision-notes-symlink-blocked");
  if (!insideRealDirectory(realpathSync6(brain), realpathSync6(target))) throw new Error("decision-notes-outside-brain");
  return target;
}
function decisionQueuePath(root) {
  return resolve8(root, layout(root).decisionQueue || join8(".automacao", "_FILA-DECISAO.json"));
}
var DECISION_CATEGORY_PRIORITY = Object.freeze({
  "trava-terceiros": 0,
  experimento: 1,
  "excecao-loop": 1,
  "sinal-radar": 1,
  "revisao-persona": 1,
  martelo: 2,
  curadoria: 3,
  integracao: 4,
  organizacao: 5
});
function decisionPriority(category) {
  return Object.hasOwn(DECISION_CATEGORY_PRIORITY, category) ? DECISION_CATEGORY_PRIORITY[category] : 6;
}
function readDecisionQueue(root) {
  const path = decisionQueuePath(root);
  if (!existsSync8(path) || lstatSync6(path).isSymbolicLink()) {
    return { available: false, path: null, digest: null, open: [], decided_total: 0 };
  }
  let data;
  try {
    data = JSON.parse(readFileSync11(path, "utf8"));
  } catch {
    return { available: false, path: null, digest: null, open: [], decided_total: 0 };
  }
  const now = Date.now();
  const open = Object.entries(data.abertos || {}).filter(([key2, item]) => typeof key2 === "string" && object10(item)).map(([key2, item]) => ({
    key: key2,
    case_id: decisionCaseIdFor(key2),
    title: String(item.titulo || key2),
    category: String(item.categoria || "sem-categoria"),
    first_seen: String(item.first_seen || ""),
    last_seen: String(item.last_seen || ""),
    age_days: Math.max(0, Math.round((now - Date.parse(`${item.first_seen}T12:00:00`)) / 864e5)) || 0
  })).sort((left, right) => decisionPriority(left.category) - decisionPriority(right.category) || right.age_days - left.age_days || left.key.localeCompare(right.key));
  return {
    available: true,
    path: relative7(resolve8(root), path),
    digest: digestOf(readFileSync11(path)),
    open,
    decided_total: Array.isArray(data.historico) ? data.historico.length : 0
  };
}
function caseDirectory(root, caseId) {
  if (!REF_ID_RE.test(caseId || "")) throw new Error("case-id-invalid");
  return join8(decisionReceiptDirectory(root), caseId);
}
function listDecisionCaseEvents(root, caseId) {
  let directory2, receipts;
  try {
    receipts = decisionReceiptDirectory(root);
    directory2 = caseDirectory(root, caseId);
  } catch (error) {
    if (error.message === "decision-receipt-runtime-missing") return [];
    throw error;
  }
  if (!existsSync8(directory2)) return [];
  const directoryStat = lstatSync6(directory2);
  if (!directoryStat.isDirectory() || directoryStat.isSymbolicLink() || realpathSync6(join8(directory2, "..")) !== realpathSync6(receipts)) {
    throw new Error("decision-case-receipt-path-invalid");
  }
  return readdirSync5(directory2, { withFileTypes: true }).filter((entry) => entry.name.endsWith(".json")).sort((left, right) => left.name.localeCompare(right.name)).map((entry) => {
    const path = join8(directory2, entry.name);
    if (!entry.isFile() || entry.isSymbolicLink() || lstatSync6(path).isSymbolicLink() || realpathSync6(join8(path, "..")) !== realpathSync6(directory2)) {
      throw new Error("decision-case-receipt-path-invalid");
    }
    const value = readJson(realpathSync6(path), "Decision Case Receipt");
    const errors = validateDecisionCaseReceipt(value);
    if (errors.length) throw new Error("decision-case-receipt-invalid");
    return value;
  }).sort((left, right) => left.sequence - right.sequence || Date.parse(left.recorded_at) - Date.parse(right.recorded_at) || left.event_id.localeCompare(right.event_id));
}
function decisionCaseState(root, caseId) {
  const events = listDecisionCaseEvents(root, caseId);
  const last = events.at(-1) || null;
  const applied = [...events].reverse().find((event) => event.event === "applied") || null;
  return {
    status: last ? last.event === "applied" ? "applied" : "rolled-back" : "pending",
    event_count: events.length,
    applied_ref: last?.event === "applied" ? `decision-case-receipt:${applied.event_id}` : null,
    canonical_path: last?.event === "applied" ? applied.canonical_writes[0].path : null,
    last_event: last ? {
      event: last.event,
      event_ref: `decision-case-receipt:${last.event_id}`,
      recorded_at: last.recorded_at,
      actor_ref: last.actor_ref,
      verdict: last.verdict,
      canonical_writes: last.canonical_writes,
      reason_code: last.reason_code || null
    } : null,
    history: events.map((event) => ({
      event: event.event,
      event_ref: `decision-case-receipt:${event.event_id}`,
      recorded_at: event.recorded_at,
      actor_ref: event.actor_ref,
      verdict: event.verdict,
      reason_code: event.reason_code || null
    }))
  };
}
function validateDecisionCaseReceipt(value) {
  const errors = [];
  if (!object10(value)) return ["decision case receipt precisa ser objeto"];
  closed4(errors, value, "decision_case_receipt", [
    "protocol_version",
    "event_id",
    "event",
    "sequence",
    "case_id",
    "case_ref",
    "queue_ref",
    "queue_key",
    "verdict",
    "review_on",
    "title",
    "title_digest",
    "decision_text_digest",
    "decision_text_chars",
    "evidence",
    "canonical_writes",
    "snapshot_ref",
    "reason_code",
    "applied_event_ref",
    "actor_ref",
    "authorship",
    "recorded_at",
    "plan_digest",
    "privacy",
    "execution_metadata_digest"
  ]);
  if (value.protocol_version !== 1) errors.push("protocol_version precisa ser 1");
  if (!REF_ID_RE.test(value.event_id || "")) errors.push("event_id inv\xE1lido");
  if (!["applied", "rolled-back"].includes(value.event)) errors.push("event inv\xE1lido");
  if (!Number.isInteger(value.sequence) || value.sequence < 1) errors.push("sequence inv\xE1lida");
  if (!REF_ID_RE.test(value.case_id || "")) errors.push("case_id inv\xE1lido");
  if (value.case_ref !== `decision-case:${value.case_id}`) errors.push("case_ref diverge de case_id");
  if (typeof value.queue_key !== "string" || !value.queue_key.trim() || value.queue_key.length > 512) {
    errors.push("queue_key inv\xE1lido");
  } else {
    if (value.queue_ref !== `decision-queue:${value.queue_key}`) errors.push("queue_ref diverge de queue_key");
    if (value.case_id !== decisionCaseIdFor(value.queue_key)) errors.push("case_id n\xE3o deriva do queue_key");
  }
  if (!DECISION_VERDICTS.has(value.verdict)) errors.push("verdict inv\xE1lido");
  if (value.verdict === "deferred" ? !isCalendarDate(value.review_on) : value.review_on !== null) {
    errors.push("review_on inv\xE1lido para o veredito");
  }
  if (typeof value.title !== "string" || value.title.length < MIN_TITLE_CHARS || value.title.length > MAX_TITLE_CHARS) {
    errors.push("title inv\xE1lido");
  }
  for (const field of ["title_digest", "decision_text_digest", "plan_digest"]) {
    if (!/^sha256:[0-9a-f]{64}$/.test(value[field] || "")) errors.push(`${field} inv\xE1lido`);
  }
  if (Object.hasOwn(value, "execution_metadata_digest") && !/^sha256:[0-9a-f]{64}$/.test(value.execution_metadata_digest || "")) {
    errors.push("execution_metadata_digest inv\xE1lido");
  }
  if (!Number.isInteger(value.decision_text_chars) || value.decision_text_chars < MIN_DECISION_TEXT_CHARS || value.decision_text_chars > MAX_DECISION_TEXT_CHARS) errors.push("decision_text_chars inv\xE1lido");
  if (!Array.isArray(value.evidence) || !value.evidence.length || value.evidence.length > MAX_EVIDENCE) {
    errors.push("evid\xEAncia obrigat\xF3ria");
  } else {
    for (const [index, entry] of value.evidence.entries()) {
      closed4(errors, entry, `evidence[${index}]`, ["ref", "kind", "provenance", "path", "digest"]);
      if (!LOCAL_REF_RE4.test(entry?.ref || "")) errors.push(`evidence[${index}].ref inv\xE1lido`);
      if (!EVIDENCE_KINDS.has(entry?.kind)) errors.push(`evidence[${index}].kind inv\xE1lido`);
      if (!["observed", "declared", "inferred"].includes(entry?.provenance)) errors.push(`evidence[${index}].provenance inv\xE1lida`);
      if (entry?.path !== null && (typeof entry?.path !== "string" || !entry.path || entry.path.length > 512)) {
        errors.push(`evidence[${index}].path inv\xE1lido`);
      }
      if (!/^sha256:[0-9a-f]{64}$/.test(entry?.digest || "")) errors.push(`evidence[${index}].digest inv\xE1lido`);
    }
    if (!value.evidence.some((entry) => entry?.kind !== "decision-queue")) {
      errors.push("caso precisa de evid\xEAncia al\xE9m do pr\xF3prio item da fila");
    }
  }
  if (!Array.isArray(value.canonical_writes) || value.canonical_writes.length !== 1) {
    errors.push("canonical_writes precisa ter exatamente uma escrita");
  } else {
    const [write] = value.canonical_writes;
    closed4(errors, write, "canonical_writes[0]", ["path", "operation", "before_digest", "after_digest", "bytes"]);
    if (typeof write?.path !== "string" || !write.path.endsWith(".md") || write.path.includes("..") || write.path.length > 512) {
      errors.push("canonical_writes[0].path inv\xE1lido");
    }
    if (!Number.isInteger(write?.bytes) || write.bytes < 0) errors.push("canonical_writes[0].bytes inv\xE1lido");
    if (!["create", "delete"].includes(write?.operation)) errors.push("canonical_writes[0].operation inv\xE1lida");
    if (value.event === "applied" && (write?.operation !== "create" || write.before_digest !== null || !/^sha256:[0-9a-f]{64}$/.test(write?.after_digest || ""))) errors.push("escrita aplicada inconsistente");
    if (value.event === "rolled-back" && (write?.operation !== "delete" || write.after_digest !== null || !/^sha256:[0-9a-f]{64}$/.test(write?.before_digest || ""))) errors.push("revers\xE3o inconsistente");
  }
  if (value.event === "rolled-back") {
    if (!ROLLBACK_REASONS.has(value.reason_code)) errors.push("reason_code inv\xE1lido");
    if (!LOCAL_REF_RE4.test(value.snapshot_ref || "")) errors.push("snapshot_ref obrigat\xF3rio na revers\xE3o");
    if (!LOCAL_REF_RE4.test(value.applied_event_ref || "")) errors.push("applied_event_ref obrigat\xF3rio na revers\xE3o");
  } else {
    if (value.reason_code !== null) errors.push("reason_code s\xF3 existe em revers\xE3o");
    if (value.snapshot_ref !== null) errors.push("snapshot_ref s\xF3 existe em revers\xE3o");
    if (value.applied_event_ref !== null) errors.push("applied_event_ref s\xF3 existe em revers\xE3o");
  }
  if (!REF_ID_RE.test(value.actor_ref || "")) errors.push("actor_ref inv\xE1lido");
  if (NON_HUMAN_ACTOR_RE.test(value.actor_ref || "")) errors.push("martelo exige autoria humana");
  if (value.authorship !== "human") errors.push("authorship precisa ser human");
  if (!isInstant(value.recorded_at)) errors.push("recorded_at inv\xE1lido");
  if (!object10(value.privacy)) errors.push("privacy precisa ser objeto");
  else {
    closed4(errors, value.privacy, "privacy", privacyKeys(
      "decision_text_recorded",
      "canonical_write",
      "external_action_executed",
      "pii_scanned"
    ));
    disclosureErrors(errors, value.privacy, "privacy");
    if (value.privacy.decision_text_recorded !== false) errors.push("recibo n\xE3o guarda o texto da decis\xE3o");
    if (value.privacy.canonical_write !== true) errors.push("Decision Case sempre declara a escrita can\xF4nica");
    if (value.privacy.external_action_executed !== false) errors.push("Decision Case n\xE3o executa a\xE7\xE3o externa");
    if (value.privacy.pii_scanned !== true) errors.push("nota precisa passar pelo gate de PII");
  }
  const serialized = JSON.stringify(value);
  if (/"(?:prompt|output|decision_text|note|raw_error|token|api_key|oauth)"\s*:/i.test(serialized)) {
    errors.push("Decision Case Receipt cont\xE9m payload ou credencial");
  }
  return [...new Set(errors)];
}
function normalizeExecutionMetadata(value) {
  if (value === void 0 || value === null) return null;
  const errors = [];
  const exact2 = (candidate, fields) => object10(candidate) && Object.keys(candidate).sort().join(",") === [...fields].sort().join(",");
  if (!object10(value)) throw new Error("execution-metadata-invalid");
  if (value.projection_type === "context-input-policy-scope-change") {
    closed4(errors, value, "execution_metadata", ["schema_version", "projection_type", "scope_change"]);
    if (value.schema_version !== 1) errors.push("schema_version");
    const change = value.scope_change;
    const legacyRef = (candidate) => typeof candidate === "string" && /^ref:[a-f0-9]{64}$/.test(candidate);
    const digest2 = (candidate) => typeof candidate === "string" && /^sha256:[a-f0-9]{64}$/.test(candidate);
    const instant3 = (candidate) => typeof candidate === "string" && Number.isFinite(Date.parse(candidate));
    const uuid = (candidate) => typeof candidate === "string" && /^[a-f0-9]{8}-[a-f0-9]{4}-[1-8][a-f0-9]{3}-[89ab][a-f0-9]{3}-[a-f0-9]{12}$/i.test(candidate);
    const idList = (candidate, name) => {
      if (!Array.isArray(candidate) || candidate.length < 1 || candidate.length > 10 || candidate.some((id3) => !uuid(id3)) || new Set(candidate).size !== candidate.length) {
        errors.push(name);
      }
    };
    if (!object10(change)) errors.push("scope_change");
    else {
      closed4(errors, change, "execution_metadata.scope_change", [
        "case_id",
        "baseline_digest",
        "preview_digest",
        "from_policy_ref",
        "to_policy_ref",
        "proposed_policy_digest",
        "purpose",
        "approval_evidence_ref",
        "current_meeting_ids",
        "proposed_meeting_ids",
        "added_meeting_ids",
        "removed_meeting_ids",
        "immutable_fields",
        "selection_effects",
        "changes",
        "challenge"
      ]);
      if (!/^case-[a-f0-9]{32}$/.test(change.case_id || "")) errors.push("scope_change.case_id");
      if (![change.baseline_digest, change.preview_digest, change.proposed_policy_digest].every(digest2)) {
        errors.push("scope_change.digest");
      }
      if (![change.from_policy_ref, change.to_policy_ref, change.approval_evidence_ref].every(legacyRef) || change.from_policy_ref === change.to_policy_ref) errors.push("scope_change.ref");
      if (change.purpose !== "post-meeting-followup-audit") errors.push("scope_change.purpose");
      idList(change.current_meeting_ids, "scope_change.current_meeting_ids");
      idList(change.proposed_meeting_ids, "scope_change.proposed_meeting_ids");
      const current = new Set(change.current_meeting_ids || []);
      const proposed = new Set(change.proposed_meeting_ids || []);
      const added = (change.proposed_meeting_ids || []).filter((id3) => !current.has(id3));
      const removed = (change.current_meeting_ids || []).filter((id3) => !proposed.has(id3));
      if (!Array.isArray(change.added_meeting_ids) || !Array.isArray(change.removed_meeting_ids) || JSON.stringify(change.added_meeting_ids) !== JSON.stringify(added) || JSON.stringify(change.removed_meeting_ids) !== JSON.stringify(removed) || added.length + removed.length === 0) errors.push("scope_change.membership_diff");
      const immutable = change.immutable_fields;
      if (!object10(immutable)) errors.push("scope_change.immutable_fields");
      else {
        closed4(errors, immutable, "execution_metadata.scope_change.immutable_fields", [
          "remote_origin",
          "organization_id",
          immutableGroupKey(immutable),
          "group_from",
          "group_to",
          "original_retention",
          "purpose"
        ]);
        try {
          const origin = new URL(immutable.remote_origin);
          if (origin.protocol !== "https:" || !origin.hostname.endsWith(".up.railway.app") || origin.origin !== immutable.remote_origin) errors.push("scope_change.immutable_origin");
        } catch {
          errors.push("scope_change.immutable_origin");
        }
        if (!uuid(immutable.organization_id) || (immutableGroupKey(immutable) === "group_dirs" ? !isGroupDirList(immutable.group_dirs) : typeof immutable.group_dir !== "string") || !/^\d{4}-\d{2}-\d{2}$/.test(immutable.group_from || "") || !/^\d{4}-\d{2}-\d{2}$/.test(immutable.group_to || "") || immutable.original_retention !== "unchanged" || immutable.purpose !== change.purpose) errors.push("scope_change.immutable_values");
      }
      const effects = change.selection_effects;
      if (!exact2(effects, ["meetings", "platform"]) || effects.meetings !== "only selected meeting ids can be captured or consumed after a new observation" || effects.platform !== "lesson scope may be derived from selected meetings only after a new observation; no lesson id is inferred here") {
        errors.push("scope_change.selection_effects");
      }
      if (!Array.isArray(change.changes) || change.changes.length !== 3 || JSON.stringify(change.changes.map((item) => item?.field)) !== JSON.stringify(["authorization_ref", "expires_at", "meeting_ids"])) {
        errors.push("scope_change.changes");
      } else {
        change.changes.forEach((item, index) => {
          if (!exact2(item, ["field", "from", "to"])) errors.push(`scope_change.changes[${index}]`);
        });
        if (!legacyRef(change.changes[0]?.from) || !legacyRef(change.changes[0]?.to) || change.changes[0]?.from === change.changes[0]?.to || !instant3(change.changes[1]?.from) || !instant3(change.changes[1]?.to) || JSON.stringify(change.changes[2]?.from) !== JSON.stringify(change.current_meeting_ids) || JSON.stringify(change.changes[2]?.to) !== JSON.stringify(change.proposed_meeting_ids)) {
          errors.push("scope_change.changes.values");
        }
      }
      const challenge = change.challenge;
      if (!object10(challenge)) errors.push("scope_change.challenge");
      else {
        closed4(errors, challenge, "execution_metadata.scope_change.challenge", [
          "action",
          "challenge_id",
          "issued_at",
          "expires_at",
          "baseline_digest",
          "from_policy_ref",
          "to_policy_ref",
          "proposed_policy_digest",
          "purpose",
          "approval_evidence_ref"
        ]);
        if (challenge.action !== "change-context-input-policy-scope" || !legacyRef(challenge.challenge_id) || !instant3(challenge.issued_at) || !instant3(challenge.expires_at) || Date.parse(challenge.expires_at) <= Date.parse(challenge.issued_at) || challenge.baseline_digest !== change.baseline_digest || challenge.from_policy_ref !== change.from_policy_ref || challenge.to_policy_ref !== change.to_policy_ref || challenge.proposed_policy_digest !== change.proposed_policy_digest || challenge.purpose !== change.purpose || challenge.approval_evidence_ref !== change.approval_evidence_ref) {
          errors.push("scope_change.challenge.values");
        }
      }
    }
    if (SECRET_RE2.test(JSON.stringify(value)) || EMAIL_RE.test(JSON.stringify(value)) || PHONE_RE.test(JSON.stringify(value)) || CPF_RE.test(JSON.stringify(value))) errors.push("sensitive-content");
    if (errors.length) throw new Error("execution-metadata-invalid");
    return structuredClone(value);
  }
  if (value.projection_type === "context-input-policy-renewal") {
    closed4(errors, value, "execution_metadata", ["schema_version", "projection_type", "renewal"]);
    if (value.schema_version !== 1) errors.push("schema_version");
    const renewal = value.renewal;
    const legacyRef = (candidate) => typeof candidate === "string" && /^ref:[a-f0-9]{64}$/.test(candidate);
    const digest2 = (candidate) => typeof candidate === "string" && /^sha256:[a-f0-9]{64}$/.test(candidate);
    const policyInstant = (candidate) => typeof candidate === "string" && /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d+)?(?:Z|[+-]\d{2}:\d{2})$/.test(candidate) && Number.isFinite(Date.parse(candidate));
    if (!object10(renewal)) errors.push("renewal");
    else {
      closed4(errors, renewal, "execution_metadata.renewal", [
        "case_id",
        "baseline_digest",
        "preview_digest",
        "from_policy_ref",
        "to_policy_ref",
        "proposed_policy_digest",
        "purpose",
        "approval_evidence_ref",
        "changes",
        "challenge"
      ]);
      if (!/^case-[a-f0-9]{32}$/.test(renewal.case_id || "")) errors.push("renewal.case_id");
      if (!digest2(renewal.baseline_digest) || !digest2(renewal.preview_digest) || !digest2(renewal.proposed_policy_digest)) errors.push("renewal.digest");
      if (![renewal.from_policy_ref, renewal.to_policy_ref, renewal.approval_evidence_ref].every(legacyRef) || renewal.from_policy_ref === renewal.to_policy_ref) errors.push("renewal.ref");
      if (renewal.purpose !== "post-meeting-followup-audit") errors.push("renewal.purpose");
      if (!Array.isArray(renewal.changes) || renewal.changes.length !== 2) errors.push("renewal.changes");
      else {
        const fields = renewal.changes.map((change) => change?.field);
        if (JSON.stringify(fields) !== JSON.stringify(["authorization_ref", "expires_at"])) {
          errors.push("renewal.changes.fields");
        }
        renewal.changes.forEach((change, index) => {
          if (!object10(change) || Object.keys(change).sort().join(",") !== "field,from,to") {
            errors.push(`renewal.changes[${index}]`);
          }
        });
        if (!legacyRef(renewal.changes[0]?.from) || !legacyRef(renewal.changes[0]?.to) || renewal.changes[0]?.from === renewal.changes[0]?.to || !policyInstant(renewal.changes[1]?.from) || !policyInstant(renewal.changes[1]?.to) || Date.parse(renewal.changes[1]?.to) <= Date.parse(renewal.changes[1]?.from)) {
          errors.push("renewal.changes.values");
        }
      }
      const challenge = renewal.challenge;
      if (!object10(challenge)) errors.push("renewal.challenge");
      else {
        closed4(errors, challenge, "execution_metadata.renewal.challenge", [
          "action",
          "challenge_id",
          "issued_at",
          "expires_at",
          "baseline_digest",
          "from_policy_ref",
          "to_policy_ref",
          "proposed_policy_digest",
          "purpose",
          "approval_evidence_ref"
        ]);
        if (challenge.action !== "renew-context-input-policy" || !legacyRef(challenge.challenge_id) || !isInstant(challenge.issued_at) || !isInstant(challenge.expires_at) || Date.parse(challenge.expires_at) <= Date.parse(challenge.issued_at) || challenge.baseline_digest !== renewal.baseline_digest || challenge.from_policy_ref !== renewal.from_policy_ref || challenge.to_policy_ref !== renewal.to_policy_ref || challenge.proposed_policy_digest !== renewal.proposed_policy_digest || challenge.purpose !== renewal.purpose || challenge.approval_evidence_ref !== renewal.approval_evidence_ref) {
          errors.push("renewal.challenge.values");
        }
      }
    }
    if (SECRET_RE2.test(JSON.stringify(value)) || EMAIL_RE.test(JSON.stringify(value)) || PHONE_RE.test(JSON.stringify(value)) || CPF_RE.test(JSON.stringify(value))) errors.push("sensitive-content");
    if (errors.length) throw new Error("execution-metadata-invalid");
    return {
      schema_version: 1,
      projection_type: "context-input-policy-renewal",
      renewal: {
        case_id: renewal.case_id,
        baseline_digest: renewal.baseline_digest,
        preview_digest: renewal.preview_digest,
        from_policy_ref: renewal.from_policy_ref,
        to_policy_ref: renewal.to_policy_ref,
        proposed_policy_digest: renewal.proposed_policy_digest,
        purpose: renewal.purpose,
        approval_evidence_ref: renewal.approval_evidence_ref,
        changes: renewal.changes.map((change) => ({ field: change.field, from: change.from, to: change.to })),
        challenge: {
          action: renewal.challenge.action,
          challenge_id: renewal.challenge.challenge_id,
          issued_at: renewal.challenge.issued_at,
          expires_at: renewal.challenge.expires_at,
          baseline_digest: renewal.challenge.baseline_digest,
          from_policy_ref: renewal.challenge.from_policy_ref,
          to_policy_ref: renewal.challenge.to_policy_ref,
          proposed_policy_digest: renewal.challenge.proposed_policy_digest,
          purpose: renewal.challenge.purpose,
          approval_evidence_ref: renewal.challenge.approval_evidence_ref
        }
      }
    };
  }
  if (value.projection_type === "context-input-policy-admission-change") {
    closed4(errors, value, "execution_metadata", ["schema_version", "projection_type", "admission_change"]);
    if (value.schema_version !== 1) errors.push("schema_version");
    const change = value.admission_change;
    const legacyRef = (candidate) => typeof candidate === "string" && /^ref:[a-f0-9]{64}$/.test(candidate);
    const digest2 = (candidate) => typeof candidate === "string" && /^sha256:[a-f0-9]{64}$/.test(candidate);
    const uuid = (candidate) => typeof candidate === "string" && /^[a-f0-9]{8}-[a-f0-9]{4}-[1-8][a-f0-9]{3}-[89ab][a-f0-9]{3}-[a-f0-9]{12}$/i.test(candidate);
    const policyInstant = (candidate) => typeof candidate === "string" && /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d+)?(?:Z|[+-]\d{2}:\d{2})$/.test(candidate) && Number.isFinite(Date.parse(candidate));
    const flat = (candidate) => JSON.stringify(object10(candidate) ? Object.fromEntries(Object.keys(candidate).sort().map((key2) => [key2, candidate[key2]])) : candidate);
    const admission = (candidate, path) => {
      if (!object10(candidate) || Object.keys(candidate).sort().join(",") !== "kind,max_admitted,occurred_from,status" || candidate.kind !== "society-meeting-ingests" || candidate.status !== "succeeded" || !isInstant(candidate.occurred_from) || !Number.isInteger(candidate.max_admitted) || candidate.max_admitted < 1 || candidate.max_admitted > 40) errors.push(path);
    };
    if (!object10(change)) errors.push("admission_change");
    else {
      closed4(errors, change, "execution_metadata.admission_change", [
        "case_id",
        "baseline_digest",
        "preview_digest",
        "from_policy_ref",
        "to_policy_ref",
        "proposed_policy_digest",
        "purpose",
        "approval_evidence_ref",
        "current_admission",
        "proposed_admission",
        "explicit_meeting_ids",
        "admitted_leaving_selection",
        "excluded_meeting_ids",
        "immutable_fields",
        "admission_effects",
        "changes",
        "challenge"
      ]);
      if (!/^case-[a-f0-9]{32}$/.test(change.case_id || "")) errors.push("admission_change.case_id");
      if (![change.baseline_digest, change.preview_digest, change.proposed_policy_digest].every(digest2)) {
        errors.push("admission_change.digest");
      }
      if (![change.from_policy_ref, change.to_policy_ref, change.approval_evidence_ref].every(legacyRef) || change.from_policy_ref === change.to_policy_ref) errors.push("admission_change.ref");
      if (change.purpose !== "post-meeting-followup-audit") errors.push("admission_change.purpose");
      const withdraws = change.proposed_admission === null;
      if (change.current_admission !== null) {
        admission(change.current_admission, "admission_change.current_admission");
      }
      if (!withdraws) admission(change.proposed_admission, "admission_change.proposed_admission");
      if (flat(change.current_admission) === flat(change.proposed_admission)) {
        errors.push("admission_change.rule_unchanged");
      }
      const lowerUuid = (id3) => uuid(id3) && id3 === id3.toLowerCase();
      const ids = change.explicit_meeting_ids;
      if (!Array.isArray(ids) || ids.length < 1 || ids.length > 10 || ids.some((id3) => !lowerUuid(id3)) || new Set(ids).size !== ids.length) errors.push("admission_change.explicit_meeting_ids");
      const leaving = change.admitted_leaving_selection;
      if (!Array.isArray(leaving) || leaving.length > 40 || leaving.some((id3) => !lowerUuid(id3)) || new Set(leaving).size !== leaving.length || Array.isArray(ids) && leaving.some((id3) => ids.includes(id3)) || change.current_admission === null && leaving.length > 0) {
        errors.push("admission_change.admitted_leaving_selection");
      }
      const excluded = change.excluded_meeting_ids;
      if (!Array.isArray(excluded) || excluded.length > 200 || excluded.some((id3) => !lowerUuid(id3)) || new Set(excluded).size !== excluded.length || JSON.stringify(excluded) !== JSON.stringify([...excluded].sort()) || Array.isArray(ids) && excluded.some((id3) => ids.includes(id3)) || Array.isArray(leaving) && excluded.some((id3) => leaving.includes(id3))) {
        errors.push("admission_change.excluded_meeting_ids");
      }
      const realDay = (candidate) => typeof candidate === "string" && /^\d{4}-\d{2}-\d{2}$/.test(candidate) && Number.isFinite(Date.parse(candidate)) && new Date(candidate).toISOString().slice(0, 10) === candidate;
      const immutable = change.immutable_fields;
      if (!object10(immutable)) errors.push("admission_change.immutable_fields");
      else {
        closed4(errors, immutable, "execution_metadata.admission_change.immutable_fields", [
          "remote_origin",
          "organization_id",
          "meeting_ids",
          immutableGroupKey(immutable),
          "group_from",
          "group_to",
          "original_retention",
          "purpose"
        ]);
        try {
          const origin = new URL(immutable.remote_origin);
          if (origin.protocol !== "https:" || !origin.hostname.endsWith(".up.railway.app") || origin.origin !== immutable.remote_origin) errors.push("admission_change.immutable_origin");
        } catch {
          errors.push("admission_change.immutable_origin");
        }
        if (!uuid(immutable.organization_id) || (immutableGroupKey(immutable) === "group_dirs" ? !isGroupDirList(immutable.group_dirs) : typeof immutable.group_dir !== "string" || !GROUP_DIR_RE.test(immutable.group_dir)) || !realDay(immutable.group_from) || !realDay(immutable.group_to) || immutable.group_from >= immutable.group_to || Date.parse(immutable.group_to) - Date.parse(immutable.group_from) > 31 * 864e5 || immutable.original_retention !== "unchanged" || immutable.purpose !== change.purpose || JSON.stringify(immutable.meeting_ids) !== JSON.stringify(ids)) {
          errors.push("admission_change.immutable_values");
        }
      }
      const expectedEffects = withdraws ? {
        meetings: "discovery stops and only explicit meeting ids stay selected; every ingest admitted under the current rule leaves the selection",
        access: "admission selects metadata capture only; transcript bytes, processing and retrieval keep their own grants and decisions",
        epoch: "admissions stay in the ledger as history only; adopting a rule again starts a new epoch from its occurred_from"
      } : {
        meetings: "eligible meeting ingests of this organization may be admitted by discovery under this rule, up to max_admitted, while the policy is current",
        access: "admission selects metadata capture only; transcript bytes, processing and retrieval keep their own grants and decisions",
        epoch: "this transition starts a new rule epoch: ingests admitted under earlier rules leave the selection, discovery restarts at occurred_from, and explicit ids removed by a scope change stay out of discovery until a scope change adds them back"
      };
      const effects = change.admission_effects;
      if (!object10(effects) || Object.keys(effects).sort().join(",") !== "access,epoch,meetings" || Object.keys(expectedEffects).some((key2) => effects[key2] !== expectedEffects[key2])) {
        errors.push("admission_change.admission_effects");
      }
      const allowed = ["admission", "authorization_ref", "expires_at", "schema_version"];
      const fields = Array.isArray(change.changes) ? change.changes.map((item) => item?.field) : null;
      if (!fields || fields.length < 2 || fields.length > 4 || JSON.stringify(fields) !== JSON.stringify([...fields].sort()) || new Set(fields).size !== fields.length || fields.some((field) => !allowed.includes(field)) || !fields.includes("admission") || !fields.includes("authorization_ref")) {
        errors.push("admission_change.changes");
      } else {
        change.changes.forEach((item, index) => {
          if (!object10(item) || Object.keys(item).sort().join(",") !== "field,from,to") {
            errors.push(`admission_change.changes[${index}]`);
          }
        });
        const byField = Object.fromEntries(change.changes.map((item) => [item?.field, item]));
        if (flat(byField.admission?.from) !== flat(change.current_admission) || flat(byField.admission?.to) !== flat(change.proposed_admission) || !legacyRef(byField.authorization_ref?.from) || !legacyRef(byField.authorization_ref?.to) || byField.authorization_ref?.from === byField.authorization_ref?.to || byField.expires_at && (!policyInstant(byField.expires_at.from) || !policyInstant(byField.expires_at.to)) || (change.current_admission === null ? byField.schema_version?.from !== 1 || byField.schema_version?.to !== 2 : withdraws ? byField.schema_version?.from !== 2 || byField.schema_version?.to !== 1 : Boolean(byField.schema_version))) {
          errors.push("admission_change.changes.values");
        }
      }
      const challenge = change.challenge;
      if (!object10(challenge)) errors.push("admission_change.challenge");
      else {
        closed4(errors, challenge, "execution_metadata.admission_change.challenge", [
          "action",
          "challenge_id",
          "issued_at",
          "expires_at",
          "baseline_digest",
          "from_policy_ref",
          "to_policy_ref",
          "proposed_policy_digest",
          "purpose",
          "approval_evidence_ref"
        ]);
        if (challenge.action !== "change-context-input-policy-admission" || !legacyRef(challenge.challenge_id) || !isInstant(challenge.issued_at) || !isInstant(challenge.expires_at) || Date.parse(challenge.expires_at) - Date.parse(challenge.issued_at) !== 5 * 60 * 1e3 || challenge.baseline_digest !== change.baseline_digest || challenge.from_policy_ref !== change.from_policy_ref || challenge.to_policy_ref !== change.to_policy_ref || challenge.proposed_policy_digest !== change.proposed_policy_digest || challenge.purpose !== change.purpose || challenge.approval_evidence_ref !== change.approval_evidence_ref) {
          errors.push("admission_change.challenge.values");
        }
      }
    }
    if (SECRET_RE2.test(JSON.stringify(value)) || EMAIL_RE.test(JSON.stringify(value)) || PHONE_RE.test(JSON.stringify(value)) || CPF_RE.test(JSON.stringify(value))) errors.push("sensitive-content");
    if (errors.length) throw new Error("execution-metadata-invalid");
    return structuredClone(value);
  }
  if (value.projection_type === "context-input-policy-group-scope-change") {
    closed4(errors, value, "execution_metadata", ["schema_version", "projection_type", "group_scope_change"]);
    if (value.schema_version !== 1) errors.push("schema_version");
    const change = value.group_scope_change;
    const legacyRef = (candidate) => typeof candidate === "string" && /^ref:[a-f0-9]{64}$/.test(candidate);
    const digest2 = (candidate) => typeof candidate === "string" && /^sha256:[a-f0-9]{64}$/.test(candidate);
    const uuid = (candidate) => typeof candidate === "string" && /^[a-f0-9]{8}-[a-f0-9]{4}-[1-8][a-f0-9]{3}-[89ab][a-f0-9]{3}-[a-f0-9]{12}$/i.test(candidate);
    const policyInstant = (candidate) => typeof candidate === "string" && /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d+)?(?:Z|[+-]\d{2}:\d{2})$/.test(candidate) && Number.isFinite(Date.parse(candidate));
    const flat = (candidate) => JSON.stringify(candidate ?? null);
    const window = (candidate) => object10(candidate) && Object.keys(candidate).sort().join(",") === "from,to" && isCalendarDate(candidate.from) && isCalendarDate(candidate.to) && candidate.from < candidate.to && Date.parse(candidate.to) - Date.parse(candidate.from) <= 31 * 864e5;
    if (!object10(change)) errors.push("group_scope_change");
    else {
      closed4(errors, change, "execution_metadata.group_scope_change", [
        "case_id",
        "baseline_digest",
        "preview_digest",
        "from_policy_ref",
        "to_policy_ref",
        "proposed_policy_digest",
        "purpose",
        "approval_evidence_ref",
        "current_group_dirs",
        "proposed_group_dirs",
        "added_group_dirs",
        "removed_group_dirs",
        "current_window",
        "proposed_window",
        "immutable_fields",
        "admission",
        "group_effects",
        "changes",
        "challenge"
      ]);
      if (!/^case-[a-f0-9]{32}$/.test(change.case_id || "")) errors.push("group_scope_change.case_id");
      if (![change.baseline_digest, change.preview_digest, change.proposed_policy_digest].every(digest2)) {
        errors.push("group_scope_change.digest");
      }
      if (![change.from_policy_ref, change.to_policy_ref, change.approval_evidence_ref].every(legacyRef) || change.from_policy_ref === change.to_policy_ref) errors.push("group_scope_change.ref");
      if (change.purpose !== "post-meeting-followup-audit") errors.push("group_scope_change.purpose");
      const current = change.current_group_dirs, proposed = change.proposed_group_dirs;
      if (!isGroupDirList(current) || !isGroupDirList(proposed)) {
        errors.push("group_scope_change.group_dirs");
      } else if (JSON.stringify(change.added_group_dirs) !== JSON.stringify(proposed.filter((dir) => !current.includes(dir))) || JSON.stringify(change.removed_group_dirs) !== JSON.stringify(current.filter((dir) => !proposed.includes(dir)))) {
        errors.push("group_scope_change.membership_diff");
      }
      if (!window(change.current_window) || !window(change.proposed_window)) {
        errors.push("group_scope_change.window");
      } else if (flat(current) === flat(proposed) && change.current_window.from === change.proposed_window.from && change.current_window.to === change.proposed_window.to) {
        errors.push("group_scope_change.scope_unchanged");
      }
      const immutable = change.immutable_fields;
      if (!object10(immutable)) errors.push("group_scope_change.immutable_fields");
      else {
        closed4(errors, immutable, "execution_metadata.group_scope_change.immutable_fields", [
          "remote_origin",
          "organization_id",
          "meeting_ids",
          "original_retention",
          "purpose"
        ]);
        try {
          const origin = new URL(immutable.remote_origin);
          if (origin.protocol !== "https:" || !origin.hostname.endsWith(".up.railway.app") || origin.origin !== immutable.remote_origin) errors.push("group_scope_change.immutable_origin");
        } catch {
          errors.push("group_scope_change.immutable_origin");
        }
        const ids = immutable.meeting_ids;
        if (!uuid(immutable.organization_id) || !Array.isArray(ids) || ids.length < 1 || ids.length > 10 || ids.some((id3) => !uuid(id3)) || new Set(ids).size !== ids.length || immutable.original_retention !== "unchanged" || immutable.purpose !== change.purpose) errors.push("group_scope_change.immutable_values");
      }
      const admission = change.admission;
      if (admission !== null && (!object10(admission) || Object.keys(admission).sort().join(",") !== "kind,max_admitted,occurred_from,status" || admission.kind !== "society-meeting-ingests" || admission.status !== "succeeded" || !isInstant(admission.occurred_from) || !Number.isInteger(admission.max_admitted) || admission.max_admitted < 1 || admission.max_admitted > 40)) {
        errors.push("group_scope_change.admission");
      }
      const expectedEffects = {
        groups: "only the listed group directories, inside the window, are observed from the next capture on; nothing is copied or moved",
        materialization: "each listed directory is materialized as its own instance and coverage, under the group authority, after a capture that includes it",
        meetings: "explicit meeting ids, the admission rule and its epoch are unchanged"
      };
      const effects = change.group_effects;
      if (!object10(effects) || Object.keys(effects).sort().join(",") !== "groups,materialization,meetings" || Object.keys(expectedEffects).some((key2) => effects[key2] !== expectedEffects[key2])) {
        errors.push("group_scope_change.group_effects");
      }
      const allowed = ["authorization_ref", "expires_at", "group_dir", "group_dirs", "group_from", "group_to"];
      const fields = Array.isArray(change.changes) ? change.changes.map((item) => item?.field) : null;
      if (!fields || fields.length < 2 || fields.length > allowed.length || JSON.stringify(fields) !== JSON.stringify([...fields].sort()) || new Set(fields).size !== fields.length || fields.some((field) => !allowed.includes(field)) || !fields.includes("authorization_ref") || !["group_dirs", "group_from", "group_to"].some((field) => fields.includes(field)) || fields.includes("group_dir") && !fields.includes("group_dirs")) {
        errors.push("group_scope_change.changes");
      } else {
        change.changes.forEach((item, index) => {
          if (!object10(item) || Object.keys(item).sort().join(",") !== "field,from,to") {
            errors.push(`group_scope_change.changes[${index}]`);
          }
        });
        const byField = Object.fromEntries(change.changes.map((item) => [item?.field, item]));
        const legacy = byField.group_dir !== void 0;
        if (!legacyRef(byField.authorization_ref?.from) || !legacyRef(byField.authorization_ref?.to) || byField.authorization_ref?.from === byField.authorization_ref?.to || byField.expires_at && (!policyInstant(byField.expires_at.from) || !policyInstant(byField.expires_at.to)) || legacy && (byField.group_dir.to !== null || !Array.isArray(current) || byField.group_dir.from !== current[0] || current.length !== 1 || byField.group_dirs?.from !== null) || byField.group_dirs && flat(byField.group_dirs.to) !== flat(proposed) || byField.group_dirs && !legacy && flat(byField.group_dirs.from) !== flat(current) || byField.group_from && (byField.group_from.from !== change.current_window?.from || byField.group_from.to !== change.proposed_window?.from) || byField.group_to && (byField.group_to.from !== change.current_window?.to || byField.group_to.to !== change.proposed_window?.to)) {
          errors.push("group_scope_change.changes.values");
        }
      }
      const challenge = change.challenge;
      if (!object10(challenge)) errors.push("group_scope_change.challenge");
      else {
        closed4(errors, challenge, "execution_metadata.group_scope_change.challenge", [
          "action",
          "challenge_id",
          "issued_at",
          "expires_at",
          "baseline_digest",
          "from_policy_ref",
          "to_policy_ref",
          "proposed_policy_digest",
          "purpose",
          "approval_evidence_ref"
        ]);
        if (challenge.action !== "change-context-input-policy-groups" || !legacyRef(challenge.challenge_id) || !isInstant(challenge.issued_at) || !isInstant(challenge.expires_at) || Date.parse(challenge.expires_at) - Date.parse(challenge.issued_at) !== 5 * 60 * 1e3 || challenge.baseline_digest !== change.baseline_digest || challenge.from_policy_ref !== change.from_policy_ref || challenge.to_policy_ref !== change.to_policy_ref || challenge.proposed_policy_digest !== change.proposed_policy_digest || challenge.purpose !== change.purpose || challenge.approval_evidence_ref !== change.approval_evidence_ref) {
          errors.push("group_scope_change.challenge.values");
        }
      }
    }
    if (SECRET_RE2.test(JSON.stringify(value)) || EMAIL_RE.test(JSON.stringify(value)) || PHONE_RE.test(JSON.stringify(value)) || CPF_RE.test(JSON.stringify(value))) errors.push("sensitive-content");
    if (errors.length) throw new Error("execution-metadata-invalid");
    return structuredClone(value);
  }
  if (value.projection_type === "prepared-retrieval-policy") {
    closed4(errors, value, "execution_metadata", ["schema_version", "projection_type", "policy"]);
    if (value.schema_version !== 1) errors.push("schema_version");
    const policy = value.policy;
    const localRef2 = (candidate, path, kind) => {
      if (!object10(candidate) || Object.keys(candidate).some((key2) => !["kind", "id", "version"].includes(key2)) || candidate.kind !== kind || !LOCAL_REF_RE4.test(candidate.id || "") || !LOCAL_REF_RE4.test(candidate.version || "")) errors.push(path);
    };
    if (!object10(policy)) errors.push("policy");
    else {
      closed4(errors, policy, "execution_metadata.policy", [
        "schema_version",
        "policy_ref",
        "scope",
        "gate_policy",
        "limits",
        "review_policy",
        "state",
        "revocation_reason"
      ]);
      if (policy.schema_version !== 1) errors.push("policy.schema_version");
      localRef2(policy.policy_ref, "policy.policy_ref", "policy");
      if (!object10(policy.scope)) errors.push("policy.scope");
      else {
        closed4(errors, policy.scope, "execution_metadata.policy.scope", [
          "source_refs",
          "revision_rule",
          "recipe_ref",
          "procedure_ref",
          "purpose",
          "residence_binding_ref",
          "source_authorizations"
        ]);
        if (!Array.isArray(policy.scope.source_refs) || policy.scope.source_refs.length === 0 || policy.scope.source_refs.length > 100) errors.push("policy.scope.source_refs");
        else policy.scope.source_refs.forEach((ref2, index) => localRef2(
          ref2,
          `policy.scope.source_refs[${index}]`,
          "source"
        ));
        if (policy.scope.revision_rule !== "current-only") errors.push("policy.scope.revision_rule");
        localRef2(policy.scope.recipe_ref, "policy.scope.recipe_ref", "procedure");
        localRef2(policy.scope.procedure_ref, "policy.scope.procedure_ref", "procedure");
        localRef2(
          policy.scope.residence_binding_ref,
          "policy.scope.residence_binding_ref",
          "residence-binding"
        );
        if (!LOCAL_REF_RE4.test(policy.scope.purpose || "")) errors.push("policy.scope.purpose");
        if (!Array.isArray(policy.scope.source_authorizations) || policy.scope.source_authorizations.length !== policy.scope.source_refs?.length) {
          errors.push("policy.scope.source_authorizations");
        } else policy.scope.source_authorizations.forEach((entry, index) => {
          if (!object10(entry)) errors.push(`policy.scope.source_authorizations[${index}]`);
          else {
            closed4(
              errors,
              entry,
              `execution_metadata.policy.scope.source_authorizations[${index}]`,
              ["source_ref", "authorization_ref", "permission_policy_ref"]
            );
            localRef2(entry.source_ref, `policy.scope.source_authorizations[${index}].source_ref`, "source");
            localRef2(
              entry.authorization_ref,
              `policy.scope.source_authorizations[${index}].authorization_ref`,
              "authorization"
            );
            localRef2(
              entry.permission_policy_ref,
              `policy.scope.source_authorizations[${index}].permission_policy_ref`,
              "policy"
            );
          }
        });
      }
      if (!object10(policy.gate_policy)) errors.push("policy.gate_policy");
      else {
        closed4(errors, policy.gate_policy, "execution_metadata.policy.gate_policy", [
          "policy",
          "state",
          "validity",
          "external_automation",
          "minimum_maturity",
          "envelope"
        ]);
        localRef2(policy.gate_policy.policy, "policy.gate_policy.policy", "policy");
        if (JSON.stringify(policy.gate_policy.policy) !== JSON.stringify(policy.policy_ref)) {
          errors.push("policy.gate_policy.policy");
        }
        if (!["approved", "revoked"].includes(policy.gate_policy.state)) errors.push("policy.gate_policy.state");
        if (policy.gate_policy.external_automation !== false) errors.push("policy.gate_policy.external_automation");
        if (!["tested", "proven"].includes(policy.gate_policy.minimum_maturity)) {
          errors.push("policy.gate_policy.minimum_maturity");
        }
        if (!object10(policy.gate_policy.validity) || Object.keys(policy.gate_policy.validity).some((key2) => !["from", "until"].includes(key2)) || !isInstant(policy.gate_policy.validity.from) || policy.gate_policy.validity.until !== null && !isInstant(policy.gate_policy.validity.until)) errors.push("policy.gate_policy.validity");
        else if (policy.gate_policy.validity.until !== null && Date.parse(policy.gate_policy.validity.until) <= Date.parse(policy.gate_policy.validity.from)) {
          errors.push("policy.gate_policy.validity.order");
        }
        if (!Array.isArray(policy.gate_policy.envelope) || policy.gate_policy.envelope.length === 0 || policy.gate_policy.envelope.length > 20) errors.push("policy.gate_policy.envelope");
        else policy.gate_policy.envelope.forEach((effect, index) => {
          if (!object10(effect) || Object.keys(effect).some((key2) => !["action", "target", "external"].includes(key2)) || !LOCAL_REF_RE4.test(effect.action || "") || !LOCAL_REF_RE4.test(effect.target || "") || effect.external !== false) errors.push(`policy.gate_policy.envelope[${index}]`);
        });
      }
      if (!object10(policy.limits) || Object.keys(policy.limits).some((key2) => !["max_documents", "max_document_bytes", "max_total_bytes"].includes(key2)) || !Number.isSafeInteger(policy.limits.max_documents) || policy.limits.max_documents < 0 || policy.limits.max_documents > 256 || !Number.isSafeInteger(policy.limits.max_document_bytes) || policy.limits.max_document_bytes < 1 || policy.limits.max_document_bytes > 1e6 || !Number.isSafeInteger(policy.limits.max_total_bytes) || policy.limits.max_total_bytes < 1 || policy.limits.max_total_bytes > 4e6 || policy.limits.max_document_bytes > policy.limits.max_total_bytes) errors.push("policy.limits");
      if (!object10(policy.review_policy) || Object.keys(policy.review_policy).some((key2) => !["first_n", "sample_every"].includes(key2)) || !Number.isSafeInteger(policy.review_policy.first_n) || policy.review_policy.first_n < 0 || policy.review_policy.first_n > 100 || !Number.isSafeInteger(policy.review_policy.sample_every) || policy.review_policy.sample_every < 0 || policy.review_policy.sample_every > 1e3) errors.push("policy.review_policy");
      if (!["available", "revoked"].includes(policy.state)) errors.push("policy.state");
      if (policy.state === "available" !== (policy.gate_policy?.state === "approved")) {
        errors.push("policy.state.gate");
      }
      if (policy.state === "revoked") {
        if (typeof policy.revocation_reason !== "string" || !policy.revocation_reason.trim() || policy.revocation_reason.length > 240) errors.push("policy.revocation_reason");
      } else if (policy.revocation_reason !== null) errors.push("policy.revocation_reason");
    }
    if (SECRET_RE2.test(JSON.stringify(value)) || EMAIL_RE.test(JSON.stringify(value)) || PHONE_RE.test(JSON.stringify(value)) || CPF_RE.test(JSON.stringify(value))) errors.push("sensitive-content");
    if (errors.length) throw new Error("execution-metadata-invalid");
    const ref = (candidate) => ({ kind: candidate.kind, id: candidate.id, version: candidate.version });
    const compare3 = (left, right) => JSON.stringify(left).localeCompare(JSON.stringify(right));
    const sourceRefs = policy.scope.source_refs.map(ref).sort(compare3);
    const sourceAuthorizations = policy.scope.source_authorizations.map((entry) => ({
      source_ref: ref(entry.source_ref),
      authorization_ref: ref(entry.authorization_ref),
      permission_policy_ref: ref(entry.permission_policy_ref)
    })).sort((left, right) => compare3(left.source_ref, right.source_ref));
    if (new Set(sourceRefs.map((value2) => JSON.stringify(value2))).size !== sourceRefs.length || sourceRefs.some((sourceRef, index) => JSON.stringify(sourceRef) !== JSON.stringify(sourceAuthorizations[index]?.source_ref))) {
      throw new Error("execution-metadata-invalid");
    }
    return {
      schema_version: 1,
      projection_type: "prepared-retrieval-policy",
      policy: {
        schema_version: 1,
        policy_ref: ref(policy.policy_ref),
        scope: {
          source_refs: sourceRefs,
          revision_rule: "current-only",
          recipe_ref: ref(policy.scope.recipe_ref),
          procedure_ref: ref(policy.scope.procedure_ref),
          purpose: policy.scope.purpose,
          residence_binding_ref: ref(policy.scope.residence_binding_ref),
          source_authorizations: sourceAuthorizations
        },
        gate_policy: {
          policy: ref(policy.gate_policy.policy),
          state: policy.gate_policy.state,
          validity: { from: policy.gate_policy.validity.from, until: policy.gate_policy.validity.until },
          external_automation: false,
          minimum_maturity: policy.gate_policy.minimum_maturity,
          envelope: [...policy.gate_policy.envelope].map((effect) => ({
            action: effect.action,
            target: effect.target,
            external: false
          })).sort(compare3)
        },
        limits: { ...policy.limits },
        review_policy: { ...policy.review_policy },
        state: policy.state,
        revocation_reason: policy.revocation_reason
      }
    };
  }
  if (value.projection_type === "prepared-material-availability") {
    closed4(errors, value, "execution_metadata", [
      "schema_version",
      "projection_type",
      "definition"
    ]);
    if (value.schema_version !== 1) errors.push("schema_version");
    const definition = value.definition;
    if (!object10(definition)) errors.push("definition");
    else {
      closed4(errors, definition, "execution_metadata.definition", [
        "schema_version",
        "definition_ref",
        "derived_ref",
        "source_revision_refs",
        "output_ref",
        "content_digest",
        "purpose",
        "residence_binding_ref",
        "procedure_ref",
        "source_authorizations",
        "validity",
        "state",
        "revocation_reason"
      ]);
      if (definition.schema_version !== 1) errors.push("definition.schema_version");
      const reference = (candidate, path, kind) => {
        if (!object10(candidate) || Object.keys(candidate).some((key2) => !["kind", "id", "version"].includes(key2)) || candidate.kind !== kind || !LOCAL_REF_RE4.test(candidate.id || "") || !LOCAL_REF_RE4.test(candidate.version || "")) errors.push(path);
      };
      reference(definition.definition_ref, "definition.definition_ref", "material-availability");
      reference(definition.derived_ref, "definition.derived_ref", "derived");
      reference(definition.output_ref, "definition.output_ref", "output");
      reference(definition.residence_binding_ref, "definition.residence_binding_ref", "residence-binding");
      reference(definition.procedure_ref, "definition.procedure_ref", "procedure");
      if (!/^sha256:[0-9a-f]{64}$/.test(definition.content_digest || "")) {
        errors.push("definition.content_digest");
      }
      if (!LOCAL_REF_RE4.test(definition.purpose || "")) errors.push("definition.purpose");
      if (!object10(definition.validity) || Object.keys(definition.validity).some((key2) => !["from", "until"].includes(key2)) || !isInstant(definition.validity.from) || definition.validity.until !== null && !isInstant(definition.validity.until)) {
        errors.push("definition.validity");
      } else if (definition.validity.until !== null && Date.parse(definition.validity.until) <= Date.parse(definition.validity.from)) {
        errors.push("definition.validity.order");
      }
      if (!["available", "revoked"].includes(definition.state)) errors.push("definition.state");
      if (definition.state === "revoked") {
        if (typeof definition.revocation_reason !== "string" || !definition.revocation_reason.trim() || definition.revocation_reason.length > 240) {
          errors.push("definition.revocation_reason");
        }
      } else if (definition.revocation_reason !== null) errors.push("definition.revocation_reason");
      const revisionKeys = /* @__PURE__ */ new Set();
      if (!Array.isArray(definition.source_revision_refs) || definition.source_revision_refs.length === 0 || definition.source_revision_refs.length > 100) errors.push("definition.source_revision_refs");
      else for (const [index, ref2] of definition.source_revision_refs.entries()) {
        reference(ref2, `definition.source_revision_refs[${index}]`, "source-revision");
        const key2 = `${ref2?.id}:${ref2?.version}`;
        if (revisionKeys.has(key2)) errors.push(`definition.source_revision_refs[${index}].duplicate`);
        revisionKeys.add(key2);
      }
      const authorizationKeys = /* @__PURE__ */ new Set();
      if (!Array.isArray(definition.source_authorizations) || definition.source_authorizations.length === 0 || definition.source_authorizations.length > 100) errors.push("definition.source_authorizations");
      else for (const [index, authorization] of definition.source_authorizations.entries()) {
        if (!object10(authorization)) {
          errors.push(`definition.source_authorizations[${index}]`);
          continue;
        }
        closed4(errors, authorization, `execution_metadata.definition.source_authorizations[${index}]`, [
          "source_ref",
          "source_revision_ref",
          "authorization_ref",
          "permission_policy_ref"
        ]);
        reference(authorization.source_ref, `definition.source_authorizations[${index}].source_ref`, "source");
        reference(
          authorization.source_revision_ref,
          `definition.source_authorizations[${index}].source_revision_ref`,
          "source-revision"
        );
        reference(
          authorization.authorization_ref,
          `definition.source_authorizations[${index}].authorization_ref`,
          "authorization"
        );
        reference(
          authorization.permission_policy_ref,
          `definition.source_authorizations[${index}].permission_policy_ref`,
          "policy"
        );
        const key2 = `${authorization.source_revision_ref?.id}:${authorization.source_revision_ref?.version}`;
        if (authorizationKeys.has(key2)) errors.push(`definition.source_authorizations[${index}].duplicate`);
        authorizationKeys.add(key2);
      }
      if (revisionKeys.size !== authorizationKeys.size || [...revisionKeys].some((key2) => !authorizationKeys.has(key2))) {
        errors.push("definition.source_authorizations.incomplete");
      }
    }
    if (SECRET_RE2.test(JSON.stringify(value)) || EMAIL_RE.test(JSON.stringify(value)) || PHONE_RE.test(JSON.stringify(value)) || CPF_RE.test(JSON.stringify(value))) errors.push("sensitive-content");
    if (errors.length) throw new Error("execution-metadata-invalid");
    const ref = (candidate) => ({ kind: candidate.kind, id: candidate.id, version: candidate.version });
    const compareRef = (left, right) => {
      const leftKey = `${left.id}:${left.version}`;
      const rightKey = `${right.id}:${right.version}`;
      return leftKey < rightKey ? -1 : leftKey > rightKey ? 1 : 0;
    };
    const normalizedDefinition = value.definition;
    return {
      schema_version: 1,
      projection_type: "prepared-material-availability",
      definition: {
        schema_version: 1,
        definition_ref: ref(normalizedDefinition.definition_ref),
        derived_ref: ref(normalizedDefinition.derived_ref),
        source_revision_refs: normalizedDefinition.source_revision_refs.map(ref).sort(compareRef),
        output_ref: ref(normalizedDefinition.output_ref),
        content_digest: normalizedDefinition.content_digest,
        purpose: normalizedDefinition.purpose,
        residence_binding_ref: ref(normalizedDefinition.residence_binding_ref),
        procedure_ref: ref(normalizedDefinition.procedure_ref),
        source_authorizations: normalizedDefinition.source_authorizations.map((authorization) => ({
          source_ref: ref(authorization.source_ref),
          source_revision_ref: ref(authorization.source_revision_ref),
          authorization_ref: ref(authorization.authorization_ref),
          permission_policy_ref: ref(authorization.permission_policy_ref)
        })).sort((left, right) => compareRef(left.source_revision_ref, right.source_revision_ref)),
        validity: { from: normalizedDefinition.validity.from, until: normalizedDefinition.validity.until },
        state: normalizedDefinition.state,
        revocation_reason: normalizedDefinition.revocation_reason
      }
    };
  }
  if (value.projection_type === "meeting-context-materialization") {
    closed4(errors, value, "execution_metadata", [
      "schema_version",
      "projection_type",
      "definition"
    ]);
    const definition = value.definition;
    const v1 = definition?.schema_version === 1;
    const v2 = definition?.schema_version === 2;
    if (value.schema_version !== 1) errors.push("schema_version");
    const digest2 = (candidate) => typeof candidate === "string" && /^sha256:[a-f0-9]{64}$/.test(candidate);
    const ref = (candidate) => object10(candidate) && Object.keys(candidate).sort().join(",") === "id,kind,version" && ["policy", "procedure", "evidence"].includes(candidate.kind) && LOCAL_REF_RE4.test(candidate.id || "") && LOCAL_REF_RE4.test(candidate.version || "");
    if (!object10(definition)) errors.push("definition");
    else {
      closed4(errors, definition, "execution_metadata.definition", v2 ? [
        "schema_version",
        "source_contract_ref",
        "source_contract_digest",
        "source",
        "external_refs",
        "partition",
        "validity",
        "standing_scope",
        "next_attempt_at",
        "gaps"
      ] : [
        "schema_version",
        "source_contract_ref",
        "source_contract_digest",
        "source",
        "external_refs",
        "partition",
        "content_window",
        "validity",
        "capture_binding",
        "next_attempt_at",
        "gaps"
      ]);
      if (!v1 && !v2 || typeof definition.source_contract_ref !== "string" || !LOCAL_REF_RE4.test(definition.source_contract_ref) || !digest2(definition.source_contract_digest)) errors.push("definition.identity");
      if (!Array.isArray(definition.external_refs) || definition.external_refs.length < 1 || definition.external_refs.length > 32 || !definition.external_refs.every(ref)) {
        errors.push("definition.external_refs");
      }
      if (definition.partition !== "meeting-ingests:selected" || definition.next_attempt_at !== null || !Array.isArray(definition.gaps) || definition.gaps.length !== 0) errors.push("definition.materialization");
      for (const [field, window] of [
        ...v1 ? [["content_window", definition.content_window]] : [],
        ["validity", definition.validity]
      ]) {
        if (!exact2(window, ["from", "until"]) || !isInstant(window.from) || !isInstant(window.until) || Date.parse(window.until) <= Date.parse(window.from)) {
          errors.push(`definition.${field}`);
        }
      }
      if (!object10(definition.source) || definition.source.id !== definition.source_contract_ref || definition.source.family !== "meetings" || definition.source.nature !== "structured_event" || validateContextBundle([definition.source], definition.external_refs).length) {
        errors.push("definition.source");
      }
      if (v1) {
        const binding = definition.capture_binding;
        if (!exact2(binding, [
          "policy_ref",
          "attempt_id",
          "attempt_observed_at",
          "receipt_count",
          "receipt_revision_keys_digest",
          "receipt_payloads_digest",
          "capture_basis_digest",
          "candidate_digest"
        ]) || typeof binding.policy_ref !== "string" || !/^ref:[a-f0-9]{64}$/.test(binding.policy_ref) || typeof binding.attempt_id !== "string" || !/^[a-f0-9]{8}-[a-f0-9]{4}-[1-8][a-f0-9]{3}-[89ab][a-f0-9]{3}-[a-f0-9]{12}$/i.test(binding.attempt_id) || !isInstant(binding.attempt_observed_at) || !Number.isSafeInteger(binding.receipt_count) || binding.receipt_count < 0 || binding.receipt_count > 2e3 || !digest2(binding.receipt_revision_keys_digest) || !digest2(binding.receipt_payloads_digest) || !digest2(binding.capture_basis_digest) || !digest2(binding.candidate_digest)) {
          errors.push("definition.capture_binding");
        }
      } else if (v2) {
        const scope = definition.standing_scope;
        if (!exact2(scope, ["kind", "policy_ref", "window"]) || scope.kind !== "standing-policy" || typeof scope.policy_ref !== "string" || !/^ref:[a-f0-9]{64}$/.test(scope.policy_ref) || !exact2(scope.window, ["from", "until"]) || scope.window.from !== "policy.admission.occurred_from" || scope.window.until !== "attempt.observed_at") {
          errors.push("definition.standing_scope");
        }
      }
    }
    if (SECRET_RE2.test(JSON.stringify(value)) || EMAIL_RE.test(JSON.stringify(value)) || PHONE_RE.test(JSON.stringify(value)) || CPF_RE.test(JSON.stringify(value))) {
      errors.push("sensitive-content");
    }
    if (errors.length) throw new Error("execution-metadata-invalid");
    const canonicalRef = (candidate) => ({
      kind: candidate.kind,
      id: candidate.id,
      version: candidate.version
    });
    const canonical3 = (candidate) => Array.isArray(candidate) ? candidate.map(canonical3) : object10(candidate) ? Object.fromEntries(Object.keys(candidate).sort().map((key2) => [key2, canonical3(candidate[key2])])) : candidate;
    const externalRefs = definition.external_refs.map(canonicalRef).sort((left, right) => JSON.stringify(left).localeCompare(JSON.stringify(right)));
    if (new Set(externalRefs.map((candidate) => JSON.stringify(candidate))).size !== externalRefs.length) {
      throw new Error("execution-metadata-invalid");
    }
    return {
      schema_version: 1,
      projection_type: "meeting-context-materialization",
      definition: {
        schema_version: definition.schema_version,
        source_contract_ref: definition.source_contract_ref,
        source_contract_digest: definition.source_contract_digest,
        source: canonical3(definition.source),
        external_refs: externalRefs,
        partition: "meeting-ingests:selected",
        ...v1 ? {
          content_window: {
            from: definition.content_window.from,
            until: definition.content_window.until
          }
        } : {
          standing_scope: {
            kind: "standing-policy",
            policy_ref: definition.standing_scope.policy_ref,
            window: {
              from: "policy.admission.occurred_from",
              until: "attempt.observed_at"
            }
          }
        },
        validity: { from: definition.validity.from, until: definition.validity.until },
        ...v1 ? {
          capture_binding: {
            policy_ref: definition.capture_binding.policy_ref,
            attempt_id: definition.capture_binding.attempt_id,
            attempt_observed_at: definition.capture_binding.attempt_observed_at,
            receipt_count: definition.capture_binding.receipt_count,
            receipt_revision_keys_digest: definition.capture_binding.receipt_revision_keys_digest,
            receipt_payloads_digest: definition.capture_binding.receipt_payloads_digest,
            capture_basis_digest: definition.capture_binding.capture_basis_digest,
            candidate_digest: definition.capture_binding.candidate_digest
          }
        } : {},
        next_attempt_at: null,
        gaps: []
      }
    };
  }
  if (value.projection_type === "platform-context-materialization") {
    closed4(errors, value, "execution_metadata", [
      "schema_version",
      "projection_type",
      "definition"
    ]);
    if (value.schema_version !== 1) errors.push("schema_version");
    const definition = value.definition;
    const digest2 = (candidate) => typeof candidate === "string" && /^sha256:[a-f0-9]{64}$/.test(candidate);
    const ref = (candidate) => object10(candidate) && Object.keys(candidate).sort().join(",") === "id,kind,version" && ["policy", "procedure", "evidence"].includes(candidate.kind) && LOCAL_REF_RE4.test(candidate.id || "") && LOCAL_REF_RE4.test(candidate.version || "");
    if (!object10(definition)) errors.push("definition");
    else {
      const v1 = definition.schema_version === 1;
      const v2 = definition.schema_version === 2;
      closed4(errors, definition, "execution_metadata.definition", v1 ? [
        "schema_version",
        "source_contract_ref",
        "source_contract_digest",
        "source",
        "external_refs",
        "partition",
        "content_window",
        "validity",
        "next_attempt_at",
        "gaps",
        "observation_binding"
      ] : [
        "schema_version",
        "source_contract_ref",
        "source_contract_digest",
        "source",
        "external_refs",
        "partition",
        "validity",
        "next_attempt_at",
        "gaps",
        "standing_scope"
      ]);
      if (!v1 && !v2 || typeof definition.source_contract_ref !== "string" || !LOCAL_REF_RE4.test(definition.source_contract_ref) || !digest2(definition.source_contract_digest)) errors.push("definition.identity");
      if (!Array.isArray(definition.external_refs) || definition.external_refs.length < 1 || definition.external_refs.length > 32 || !definition.external_refs.every(ref)) {
        errors.push("definition.external_refs");
      }
      if (typeof definition.partition !== "string" || !LOCAL_REF_RE4.test(definition.partition) || definition.next_attempt_at !== null || !Array.isArray(definition.gaps) || definition.gaps.length !== 0) errors.push("definition.materialization");
      for (const [field, window] of [
        ...v1 ? [["content_window", definition.content_window]] : [],
        ["validity", definition.validity]
      ]) {
        if (!object10(window) || Object.keys(window).some((key2) => !["from", "until"].includes(key2)) || !isInstant(window.from) || !isInstant(window.until) || Date.parse(window.until) <= Date.parse(window.from)) errors.push(`definition.${field}`);
      }
      if (!object10(definition.source) || definition.source.id !== definition.source_contract_ref || definition.source.family !== "platform" || definition.source.nature !== "structured_event" || validateContextBundle([definition.source], definition.external_refs).length) {
        errors.push("definition.source");
      }
      if (v1 && Object.hasOwn(definition, "observation_binding")) {
        const binding = definition.observation_binding;
        if (!exact2(binding, [
          "policy_ref",
          "attempt_id",
          "attempt_observed_at",
          "receipt_count",
          "receipt_revision_keys_digest",
          "receipt_payloads_digest"
        ]) || typeof binding.policy_ref !== "string" || !/^ref:[a-f0-9]{64}$/.test(binding.policy_ref) || typeof binding.attempt_id !== "string" || !/^[a-f0-9]{8}-[a-f0-9]{4}-[1-8][a-f0-9]{3}-[89ab][a-f0-9]{3}-[a-f0-9]{12}$/i.test(binding.attempt_id) || !isInstant(binding.attempt_observed_at) || !Number.isSafeInteger(binding.receipt_count) || binding.receipt_count < 0 || binding.receipt_count > 2e3 || !digest2(binding.receipt_revision_keys_digest) || !digest2(binding.receipt_payloads_digest)) {
          errors.push("definition.observation_binding");
        }
      }
      if (v2) {
        const scope = definition.standing_scope;
        if (!exact2(scope, ["kind", "policy_ref", "window"]) || scope.kind !== "standing-policy" || typeof scope.policy_ref !== "string" || !/^ref:[a-f0-9]{64}$/.test(scope.policy_ref) || !exact2(scope.window, ["from", "until"]) || scope.window.from !== "policy.admission.occurred_from" || scope.window.until !== "attempt.observed_at") {
          errors.push("definition.standing_scope");
        }
      }
    }
    if (SECRET_RE2.test(JSON.stringify(value)) || EMAIL_RE.test(JSON.stringify(value)) || PHONE_RE.test(JSON.stringify(value)) || CPF_RE.test(JSON.stringify(value))) {
      errors.push("sensitive-content");
    }
    if (errors.length) throw new Error("execution-metadata-invalid");
    const canonicalRef = (candidate) => ({
      kind: candidate.kind,
      id: candidate.id,
      version: candidate.version
    });
    const canonical3 = (candidate) => Array.isArray(candidate) ? candidate.map(canonical3) : object10(candidate) ? Object.fromEntries(Object.keys(candidate).sort().map((key2) => [key2, canonical3(candidate[key2])])) : candidate;
    const externalRefs = definition.external_refs.map(canonicalRef).sort((left, right) => JSON.stringify(left).localeCompare(JSON.stringify(right)));
    if (new Set(externalRefs.map((candidate) => JSON.stringify(candidate))).size !== externalRefs.length) {
      throw new Error("execution-metadata-invalid");
    }
    return {
      schema_version: 1,
      projection_type: "platform-context-materialization",
      definition: {
        schema_version: definition.schema_version,
        source_contract_ref: definition.source_contract_ref,
        source_contract_digest: definition.source_contract_digest,
        source: canonical3(definition.source),
        external_refs: externalRefs,
        partition: definition.partition,
        ...definition.schema_version === 1 ? {
          content_window: {
            from: definition.content_window.from,
            until: definition.content_window.until
          }
        } : {
          standing_scope: {
            kind: "standing-policy",
            policy_ref: definition.standing_scope.policy_ref,
            window: {
              from: "policy.admission.occurred_from",
              until: "attempt.observed_at"
            }
          }
        },
        validity: { from: definition.validity.from, until: definition.validity.until },
        next_attempt_at: null,
        gaps: [],
        ...Object.hasOwn(definition, "observation_binding") ? {
          observation_binding: {
            policy_ref: definition.observation_binding.policy_ref,
            attempt_id: definition.observation_binding.attempt_id,
            attempt_observed_at: definition.observation_binding.attempt_observed_at,
            receipt_count: definition.observation_binding.receipt_count,
            receipt_revision_keys_digest: definition.observation_binding.receipt_revision_keys_digest,
            receipt_payloads_digest: definition.observation_binding.receipt_payloads_digest
          }
        } : {}
      }
    };
  }
  closed4(errors, value, "execution_metadata", [
    "schema_version",
    "registry_id",
    "complete",
    "binding",
    "instruction_ref",
    "decisions"
  ]);
  if (value.schema_version !== 1) errors.push("schema_version");
  if (!REF_ID_RE.test(value.registry_id || "")) errors.push("registry_id");
  if (value.complete !== true) errors.push("complete");
  if (!object10(value.binding)) errors.push("binding");
  else {
    closed4(errors, value.binding, "execution_metadata.binding", [
      "routine_ref",
      "system_ref",
      "purpose",
      "target"
    ]);
    for (const field of ["routine_ref", "system_ref", "purpose", "target"]) {
      if (!LOCAL_REF_RE4.test(value.binding[field] || "")) errors.push(`binding.${field}`);
    }
  }
  if (!object10(value.instruction_ref) || Object.keys(value.instruction_ref).some((key2) => !["id", "version"].includes(key2)) || !LOCAL_REF_RE4.test(value.instruction_ref.id || "") || !LOCAL_REF_RE4.test(value.instruction_ref.version || "")) errors.push("instruction_ref");
  if (!Array.isArray(value.decisions) || value.decisions.length === 0 || value.decisions.length > 100) {
    errors.push("decisions");
  } else {
    const identities = /* @__PURE__ */ new Set();
    for (const [index, decision] of value.decisions.entries()) {
      if (!object10(decision)) {
        errors.push(`decisions[${index}]`);
        continue;
      }
      closed4(errors, decision, `execution_metadata.decisions[${index}]`, [
        "id",
        "version",
        "scope",
        "validity",
        "state",
        "supersedes",
        "revocation_reason"
      ]);
      if (!LOCAL_REF_RE4.test(decision.id || "") || !LOCAL_REF_RE4.test(decision.version || "")) errors.push(`decisions[${index}].identity`);
      const identity = `${decision.id}:${decision.version}`;
      if (identities.has(identity)) errors.push(`decisions[${index}].duplicate`);
      identities.add(identity);
      if (!object10(decision.scope) || Object.keys(decision.scope).some((key2) => !["purpose", "target"].includes(key2)) || !LOCAL_REF_RE4.test(decision.scope.purpose || "") || !LOCAL_REF_RE4.test(decision.scope.target || "")) errors.push(`decisions[${index}].scope`);
      if (!object10(decision.validity) || Object.keys(decision.validity).some((key2) => !["from", "until"].includes(key2)) || !isInstant(decision.validity.from) || decision.validity.until !== null && !isInstant(decision.validity.until)) errors.push(`decisions[${index}].validity`);
      if (!["candidate", "approved", "superseded", "revoked"].includes(decision.state)) errors.push(`decisions[${index}].state`);
      if (decision.supersedes !== null && (!object10(decision.supersedes) || Object.keys(decision.supersedes).some((key2) => !["id", "version"].includes(key2)) || !LOCAL_REF_RE4.test(decision.supersedes.id || "") || !LOCAL_REF_RE4.test(decision.supersedes.version || ""))) errors.push(`decisions[${index}].supersedes`);
      if (decision.state === "revoked") {
        if (typeof decision.revocation_reason !== "string" || !decision.revocation_reason.trim() || decision.revocation_reason.length > 240) errors.push(`decisions[${index}].revocation_reason`);
      } else if (decision.revocation_reason !== null) errors.push(`decisions[${index}].revocation_reason`);
    }
  }
  if (SECRET_RE2.test(JSON.stringify(value)) || EMAIL_RE.test(JSON.stringify(value)) || PHONE_RE.test(JSON.stringify(value)) || CPF_RE.test(JSON.stringify(value))) errors.push("sensitive-content");
  if (errors.length) throw new Error("execution-metadata-invalid");
  const compare2 = (left, right) => left.id === right.id ? left.version < right.version ? -1 : left.version > right.version ? 1 : 0 : left.id < right.id ? -1 : 1;
  return {
    schema_version: 1,
    registry_id: value.registry_id,
    complete: true,
    binding: {
      routine_ref: value.binding.routine_ref,
      system_ref: value.binding.system_ref,
      purpose: value.binding.purpose,
      target: value.binding.target
    },
    instruction_ref: { id: value.instruction_ref.id, version: value.instruction_ref.version },
    decisions: value.decisions.map((decision) => ({
      id: decision.id,
      version: decision.version,
      scope: { purpose: decision.scope.purpose, target: decision.scope.target },
      validity: { from: decision.validity.from, until: decision.validity.until },
      state: decision.state,
      supersedes: decision.supersedes ? { id: decision.supersedes.id, version: decision.supersedes.version } : null,
      revocation_reason: decision.revocation_reason
    })).sort(compare2)
  };
}
function listDecisionCases(root) {
  const queue = readDecisionQueue(root);
  const cases = queue.open.map((item) => ({
    ...item,
    case_ref: `decision-case:${item.case_id}`,
    state: decisionCaseState(root, item.case_id)
  }));
  let houseReady = true;
  try {
    decisionNotesDirectory(root);
  } catch {
    houseReady = false;
  }
  return {
    available: queue.available,
    house_ready: houseReady,
    queue_path: queue.path,
    open_count: cases.length,
    decided_total: queue.decided_total,
    applied_count: cases.filter((entry) => entry.state.status === "applied").length,
    cases
  };
}

// ../scripts/lib/decision-runtime.mjs
var REF_RE2 = /^[A-Za-z0-9][A-Za-z0-9_.:-]{0,255}$/;
var BINDING_ID_RE = /^[A-Za-z0-9][A-Za-z0-9_-]{0,127}$/;
var INSTANT_RE = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/;
var DECISION_HEADING = "## Decis\xE3o (verbatim de quem deu o martelo)";
var ITEM_HEADING = "## O item que esperava martelo";
var UNAVAILABLE_SECRET_PROVIDER = Object.freeze({
  available: false,
  status: () => ({ reason_code: "secret-provider-unavailable" })
});
function validInstant(value) {
  if (!INSTANT_RE.test(value || "")) return false;
  const parsed = new Date(value);
  return Number.isFinite(parsed.getTime()) && parsed.toISOString() === value;
}
function digest(value) {
  return `sha256:${createHash4("sha256").update(value).digest("hex")}`;
}
function object11(value) {
  return value !== null && typeof value === "object" && !Array.isArray(value);
}
function bindingDirectory(root) {
  const runtime = resolve9(root, ".cerebro", "runtime");
  const directory2 = resolve9(runtime, "bindings", "decisions");
  if (!existsSync9(runtime) || lstatSync7(runtime).isSymbolicLink()) throw new Error("decision-binding-runtime-missing");
  const realRuntime = realpathSync7(runtime);
  let existing = directory2;
  while (!existsSync9(existing)) existing = resolve9(existing, "..");
  const realExisting = realpathSync7(existing);
  const rel = relative8(realRuntime, realExisting);
  if (realExisting !== realRuntime && (rel.startsWith("..") || rel.startsWith(sep9))) {
    throw new Error("decision-binding-outside-runtime");
  }
  return directory2;
}
function decisionRuntimeBindingPath(root, bindingId) {
  if (!BINDING_ID_RE.test(bindingId || "")) throw new Error("decision-binding-ref-invalid");
  return join9(bindingDirectory(root), `${bindingId}.json`);
}
function validateDecisionRuntimeBinding(value) {
  const errors = [];
  if (!object11(value)) return ["decision binding precisa ser objeto"];
  const allowed = /* @__PURE__ */ new Set([
    "protocol_version",
    "binding_id",
    "authority_case_ref",
    "registry_id",
    "routine_ref",
    "system_ref",
    "purpose",
    "target",
    "observed_at",
    "privacy"
  ]);
  for (const key2 of Object.keys(value)) if (!allowed.has(key2)) errors.push(`decision_binding.${key2} n\xE3o \xE9 permitido`);
  if (value.protocol_version !== 1) errors.push("protocol_version precisa ser 1");
  if (!BINDING_ID_RE.test(value.binding_id || "")) errors.push("binding_id inv\xE1lido");
  if (!/^decision-case:[A-Za-z0-9][A-Za-z0-9_-]{0,127}$/.test(value.authority_case_ref || "")) errors.push("authority_case_ref inv\xE1lido");
  for (const field of ["registry_id", "routine_ref", "system_ref", "purpose", "target"]) {
    if (!REF_RE2.test(value[field] || "")) errors.push(`${field} inv\xE1lido`);
  }
  if (!validInstant(value.observed_at)) errors.push("observed_at inv\xE1lido");
  if (!object11(value.privacy) || Object.keys(value.privacy).some((key2) => key2 !== "decision_content_recorded") || value.privacy.decision_content_recorded !== false) errors.push("privacy inv\xE1lida");
  return [...new Set(errors)];
}
function loadDecisionRuntimeBinding(root, bindingId) {
  const path = decisionRuntimeBindingPath(root, bindingId);
  if (!existsSync9(path) || lstatSync7(path).isSymbolicLink()) throw new Error("decision-binding-missing");
  let binding;
  try {
    binding = JSON.parse(readFileSync12(path, "utf8"));
  } catch {
    throw new Error("decision-binding-invalid");
  }
  if (binding.binding_id !== bindingId || validateDecisionRuntimeBinding(binding).length) throw new Error("decision-binding-invalid");
  return { binding, path };
}
function parseCanonicalDecisionNote(content) {
  const starts = content.split(EXECUTION_METADATA_START).length - 1;
  const ends = content.split(EXECUTION_METADATA_END).length - 1;
  if (starts === 0 && ends === 0) throw new Error("decision-metadata-missing");
  if (starts !== 1 || ends !== 1) throw new Error("decision-metadata-ambiguous");
  const decisionAt = content.indexOf(`${DECISION_HEADING}

`);
  const metadataAt = content.indexOf(`${EXECUTION_METADATA_HEADING}

`);
  const itemAt = content.indexOf(`
${ITEM_HEADING}
`);
  if (decisionAt < 0 || metadataAt < 0 || itemAt < 0 || !(decisionAt < metadataAt && metadataAt < itemAt)) {
    throw new Error("decision-metadata-position-invalid");
  }
  const block = content.slice(metadataAt, itemAt);
  const match = block.match(/^## Projeção derivada para execução\n\nEste bloco técnico foi gerado pelo Console e fez parte do diff aprovado pelo humano\.\nEle não é fala humana nem autoridade independente\.\n\n<!-- BRAIN-EXECUTION-METADATA-V1:START -->\n```json\n([\s\S]+)\n```\n<!-- BRAIN-EXECUTION-METADATA-V1:END -->\n$/);
  if (!match) throw new Error("decision-metadata-format-invalid");
  let metadata;
  try {
    metadata = normalizeExecutionMetadata(JSON.parse(match[1]));
  } catch {
    throw new Error("decision-metadata-invalid");
  }
  if (match[1] !== JSON.stringify(metadata, null, 2)) throw new Error("decision-metadata-format-invalid");
  const decisionTextStart = decisionAt + `${DECISION_HEADING}

`.length;
  const decisionText = content.slice(decisionTextStart, metadataAt).trim();
  if (!decisionText) throw new Error("decision-text-missing");
  return { metadata, decisionText };
}
function projectedRecords(metadata, receipt2) {
  const evidence = { kind: "evidence", id: receipt2.event_id, version: String(receipt2.sequence) };
  const actor = { kind: "actor", id: receipt2.actor_ref, version: "1" };
  const records = metadata.decisions.map((definition) => ({
    namespace: "brain-context",
    schema_version: 1,
    kind: "decision",
    id: definition.id,
    version: definition.version,
    origin: { authorship: "human", evidence },
    approver: definition.state === "candidate" ? null : actor,
    approval: definition.state === "candidate" ? null : evidence,
    scope: definition.scope,
    validity: definition.validity,
    state: definition.state,
    supersedes: definition.supersedes ? { kind: "decision", ...definition.supersedes } : null,
    revocation: definition.state === "revoked" ? evidence : null,
    effect_evidence: []
  }));
  return { records, externalRefs: [evidence, actor] };
}
function assertBindingMatches(binding, metadata, contract) {
  const expectedRoutine = `routine:${contract.routine_id}:${contract.version}`;
  const actual = metadata?.binding;
  if (metadata?.schema_version !== 1 || metadata.complete !== true || metadata.registry_id !== binding.registry_id || actual?.routine_ref !== expectedRoutine || actual?.routine_ref !== binding.routine_ref || actual?.system_ref !== contract.system_ref || actual?.system_ref !== binding.system_ref || actual?.purpose !== binding.purpose || actual?.target !== binding.target) {
    throw new Error("decision-binding-mismatch");
  }
  if (!Array.isArray(metadata.decisions) || metadata.decisions.some((record2) => record2?.scope?.purpose !== binding.purpose || record2?.scope?.target !== binding.target)) {
    throw new Error("decision-registry-incomplete");
  }
}
function resolveRoutineDecision(root, contract, now = /* @__PURE__ */ new Date()) {
  const declaration = contract.extensions?.decision_context;
  if (!declaration) return { required: false };
  if (declaration.execution_mode !== "output-only") throw new Error("decision-execution-mode-invalid");
  const { binding, path: bindingPath } = loadDecisionRuntimeBinding(root, declaration.binding_ref);
  const caseId = binding.authority_case_ref.slice("decision-case:".length);
  const state2 = decisionCaseState(root, caseId);
  if (state2.status !== "applied") throw new Error(state2.status === "rolled-back" ? "decision-authority-rolled-back" : "decision-authority-unavailable");
  const receipt2 = listDecisionCaseEvents(root, caseId).at(-1);
  if (!receipt2 || receipt2.event !== "applied" || receipt2.verdict !== "decided" || receipt2.authorship !== "human") {
    throw new Error("decision-authority-not-decided");
  }
  const notePath = resolve9(root, receipt2.canonical_writes[0].path);
  const notes = decisionNotesDirectory(root);
  if (!notePath.startsWith(`${notes}${sep9}`) || !existsSync9(notePath) || lstatSync7(notePath).isSymbolicLink() || realpathSync7(join9(notePath, "..")) !== realpathSync7(notes)) throw new Error("decision-authority-unavailable");
  const content = readFileSync12(notePath, "utf8");
  if (digest(content) !== receipt2.canonical_writes[0].after_digest) throw new Error("decision-authority-digest-mismatch");
  const { metadata, decisionText } = parseCanonicalDecisionNote(content);
  assertBindingMatches(binding, metadata, contract);
  const { records, externalRefs } = projectedRecords(metadata, receipt2);
  const errors = validateContextBundle(records, externalRefs);
  if (errors.length) throw new Error("decision-registry-invalid");
  const observedAt = now instanceof Date ? now.toISOString() : new Date(now).toISOString();
  const projection = projectContext({
    records,
    external_refs: externalRefs,
    now: observedAt,
    scope: { purpose: binding.purpose, target: binding.target }
  });
  if (projection.decisions.state !== "governing") {
    throw new Error(`decision-${projection.decisions.state.replaceAll("_", "-")}`);
  }
  const [governing] = projection.decisions.references;
  if (governing.id !== metadata.instruction_ref.id || governing.version !== metadata.instruction_ref.version) {
    throw new Error("decision-instruction-not-governing");
  }
  const authorityDigest = digest(JSON.stringify({
    binding: digest(readFileSync12(bindingPath)),
    receipt: digest(JSON.stringify(receipt2)),
    note: receipt2.canonical_writes[0].after_digest,
    references: projection.decisions.references
  }));
  return {
    required: true,
    binding_ref: binding.binding_id,
    authority_case_ref: binding.authority_case_ref,
    authority_receipt_ref: `decision-case-receipt:${receipt2.event_id}`,
    registry_ref: `decision-registry:${binding.registry_id}`,
    decision_refs: projection.decisions.references.map((ref) => `decision:${ref.id}:${ref.version}`),
    fingerprint: authorityDigest,
    instruction: decisionText
  };
}
function routineDecisionStillCurrent(root, contract, snapshot, now = /* @__PURE__ */ new Date()) {
  try {
    const current = resolveRoutineDecision(root, contract, now);
    return current.required && current.fingerprint === snapshot.fingerprint ? { ok: true, current } : { ok: false, reason_code: "decision-context-changed", current };
  } catch (error) {
    return { ok: false, reason_code: error instanceof Error ? error.message : "decision-context-unavailable" };
  }
}
function readGovernedRoutineOutput(root, contract, receipt2, options = {}) {
  const { secretProvider = UNAVAILABLE_SECRET_PROVIDER } = options;
  const suppliedClock = Object.hasOwn(options, "clock") ? options.clock : Object.hasOwn(options, "now") ? options.now : () => /* @__PURE__ */ new Date();
  const clock = () => {
    const value = typeof suppliedClock === "function" ? suppliedClock() : suppliedClock;
    const instant3 = new Date(value);
    if (!Number.isFinite(instant3.getTime())) throw new Error("clock-invalid");
    return instant3;
  };
  const checkSourceAccess2 = guardDerivedOutput(root, receipt2, { clock, secretProvider });
  checkSourceAccess2();
  const now = clock();
  if (receipt2?.status !== "completed" || receipt2?.decision_context?.gate !== "governing" || typeof receipt2.output_ref !== "string") throw new Error("governed-output-not-completed");
  const current = routineDecisionStillCurrent(root, contract, receipt2.decision_context, now);
  if (!current.ok) throw new Error(current.reason_code);
  for (const request of contract.context?.access_requests || []) {
    const grantId = request.grant_ref.startsWith("access-grant:") ? request.grant_ref.slice("access-grant:".length) : request.grant_ref;
    let access;
    try {
      access = checkAccess(root, grantId, {
        subject_ref: contract.system_ref,
        system_ref: contract.system_ref,
        source_ref: request.source_ref,
        action: request.action,
        mode: request.mode
      }, secretProvider, { clock });
    } catch {
      throw new Error("access-check-failed");
    }
    if (!["allowed", "file-only"].includes(access.decision) || access.assurance === "runtime-enforced") throw new Error(access.reason_code || "access-denied");
  }
  const outputRoot = resolve9(routineOutputDirectory(root));
  const output = resolve9(root, receipt2.output_ref);
  if (!output.startsWith(`${outputRoot}${sep9}`) || !existsSync9(output) || lstatSync7(output).isSymbolicLink() || realpathSync7(join9(output, "..")) !== realpathSync7(outputRoot)) throw new Error("governed-output-unavailable");
  if (!/^sha256:[a-f0-9]{64}$/.test(receipt2.output_digest || "") || !Number.isInteger(receipt2.output_bytes) || receipt2.output_bytes < 0) {
    throw new Error("governed-output-identity-missing");
  }
  const outputBytes = readFileSync12(output);
  if (digest(outputBytes) !== receipt2.output_digest || outputBytes.length !== receipt2.output_bytes) {
    throw new Error("output-integrity-mismatch");
  }
  checkSourceAccess2();
  const { instruction: _privateInstruction, ...referenceOnlyContext } = current.current;
  return { content: outputBytes.toString("utf8"), decision_context: referenceOnlyContext };
}

// ../scripts/lib/judgment-protocol.mjs
var MAX_PRIVATE_OUTPUT_BYTES = 512 * 1024;
var MAX_JUDGMENT_NOTE_CHARS = 2e3;
var VERDICTS = /* @__PURE__ */ new Set(["approved", "changes-requested", "rejected"]);
var ACTION_INTENTS = /* @__PURE__ */ new Set(["none", "propose-action"]);
var LOCAL_REF_RE5 = /^(?!\.?\.?$)(?!\.\.?\/)(?!.*\/\.\.(?:\/|$))[A-Za-z0-9.][A-Za-z0-9_./:-]{0,255}$/;
var SECRET_RE3 = /Bearer\s+|-----BEGIN .*PRIVATE KEY-----|\b(?:sk|ghp|xoxb)[-_A-Za-z0-9]{12,}/i;
function object12(value) {
  return value !== null && typeof value === "object" && !Array.isArray(value);
}
function closed5(errors, value, path, keys) {
  if (!object12(value)) return;
  const allowed = new Set(keys);
  for (const key2 of Object.keys(value)) if (!allowed.has(key2)) errors.push(`${path}.${key2} n\xE3o \xE9 permitido`);
}
function insideRealDirectory2(parent, child) {
  const rel = relative9(parent, child);
  return Boolean(rel) && !rel.startsWith("..") && !rel.startsWith(sep10);
}
function nearestExistingPath(path) {
  let current = path;
  while (!existsSync10(current)) {
    const parent = dirname3(current);
    if (parent === current) throw new Error("private-storage-parent-missing");
    current = parent;
  }
  return current;
}
function safePrivateDirectory(root) {
  const brain = resolve10(root);
  const privateRoot = resolve10(root, ".cerebro", "runtime");
  const target = resolve10(root, layout(root).routineJudgments || join10(".cerebro", "runtime", "judgments"));
  if (target === brain || !target.startsWith(`${brain}${sep10}`)) throw new Error("judgment-layout-outside-brain");
  if (target === privateRoot || !target.startsWith(`${privateRoot}${sep10}`)) throw new Error("judgment-layout-not-private");
  if (!existsSync10(privateRoot)) throw new Error("judgment-runtime-missing");
  const realBrain = realpathSync8(brain);
  const realPrivateRoot = realpathSync8(privateRoot);
  if (!insideRealDirectory2(realBrain, realPrivateRoot)) throw new Error("judgment-runtime-outside-brain");
  const existing = nearestExistingPath(target);
  if (lstatSync8(existing).isSymbolicLink()) throw new Error("judgment-storage-symlink-blocked");
  const realExisting = realpathSync8(existing);
  if (realExisting !== realPrivateRoot && !insideRealDirectory2(realPrivateRoot, realExisting)) {
    throw new Error("judgment-storage-outside-runtime");
  }
  return target;
}
function judgmentDirectory(root, receiptId) {
  if (!REF_ID_RE.test(receiptId || "")) throw new Error("receipt-id-invalid");
  return join10(safePrivateDirectory(root), receiptId);
}
function validateJudgmentReceipt(value) {
  const errors = [];
  if (!object12(value)) return ["judgment receipt precisa ser objeto"];
  closed5(errors, value, "judgment_receipt", [
    "protocol_version",
    "judgment_id",
    "routine_receipt_ref",
    "receipt_id",
    "routine_id",
    "run_id",
    "output_digest",
    "output_bytes",
    "verdict",
    "action_intent",
    "note",
    "actor_ref",
    "decided_at",
    "privacy"
  ]);
  if (value.protocol_version !== 1) errors.push("protocol_version precisa ser 1");
  if (!REF_ID_RE.test(value.judgment_id || "")) errors.push("judgment_id inv\xE1lido");
  if (!LOCAL_REF_RE5.test(value.routine_receipt_ref || "")) errors.push("routine_receipt_ref inv\xE1lido");
  if (!REF_ID_RE.test(value.receipt_id || "")) errors.push("receipt_id inv\xE1lido");
  if (value.routine_receipt_ref !== `routine-receipt:${value.receipt_id}`) errors.push("routine_receipt_ref diverge de receipt_id");
  if (!ID_RE2.test(value.routine_id || "")) errors.push("routine_id inv\xE1lido");
  if (!REF_ID_RE.test(value.run_id || "")) errors.push("run_id inv\xE1lido");
  const hasOutputDigest = value.output_digest !== void 0;
  const hasOutputBytes = value.output_bytes !== void 0;
  if (hasOutputDigest !== hasOutputBytes) errors.push("identidade do output exige digest e tamanho juntos");
  if (hasOutputDigest) {
    if (!/^sha256:[a-f0-9]{64}$/.test(value.output_digest || "")) errors.push("output_digest inv\xE1lido");
    if (!Number.isInteger(value.output_bytes) || value.output_bytes < 0) errors.push("output_bytes inv\xE1lido");
  }
  if (!VERDICTS.has(value.verdict)) errors.push("verdict inv\xE1lido");
  if (!ACTION_INTENTS.has(value.action_intent)) errors.push("action_intent inv\xE1lido");
  if (value.action_intent === "propose-action" && value.verdict !== "approved") {
    errors.push("propose-action exige verdict approved");
  }
  if (typeof value.note !== "string" || value.note.length > MAX_JUDGMENT_NOTE_CHARS) errors.push("note inv\xE1lida");
  if ((value.verdict !== "approved" || value.action_intent === "propose-action") && !String(value.note || "").trim()) {
    errors.push("note obrigat\xF3ria para mudan\xE7a, rejei\xE7\xE3o ou inten\xE7\xE3o de a\xE7\xE3o");
  }
  if (/\u0000|\r/.test(value.note || "")) errors.push("note cont\xE9m controle inv\xE1lido");
  if (SECRET_RE3.test(value.note || "")) errors.push("note parece conter segredo");
  if (!REF_ID_RE.test(value.actor_ref || "")) errors.push("actor_ref inv\xE1lido");
  if (!Number.isFinite(Date.parse(value.decided_at || ""))) errors.push("decided_at inv\xE1lido");
  if (!object12(value.privacy)) errors.push("privacy precisa ser objeto");
  else {
    closed5(errors, value.privacy, "privacy", privacyKeys(
      "output_recorded",
      "note_private",
      "external_action_executed"
    ));
    disclosureErrors(errors, value.privacy, "privacy");
    if (value.privacy.output_recorded !== false) errors.push("Judgment Receipt n\xE3o grava output");
    if (value.privacy.note_private !== true) errors.push("nota precisa permanecer privada");
    if (value.privacy.external_action_executed !== false) errors.push("julgamento n\xE3o executa a\xE7\xE3o externa");
  }
  const serialized = JSON.stringify(value);
  if (/"(?:prompt|output|raw_error|token|api_key|oauth)"\s*:/i.test(serialized.replace('"output_recorded":false', ""))) {
    errors.push("Judgment Receipt cont\xE9m payload ou credencial");
  }
  return [...new Set(errors)];
}
function readValidatedJudgment(path) {
  const value = readJson(path, "Judgment Receipt");
  const errors = validateJudgmentReceipt(value);
  if (errors.length) throw new Error(`judgment-receipt-invalid`);
  return value;
}
function listJudgmentReceipts(root, receiptId) {
  const directory2 = judgmentDirectory(root, receiptId);
  if (!existsSync10(directory2)) return [];
  return readdirSync6(directory2).filter((name) => name.endsWith(".json")).sort().map((name) => readValidatedJudgment(join10(directory2, name))).sort((left, right) => Date.parse(left.decided_at) - Date.parse(right.decided_at) || left.judgment_id.localeCompare(right.judgment_id));
}
function judgmentSummary(value, historyCount = 0) {
  if (!value) return { status: "pending", verdict: null, action_intent: "none", actor_ref: null, decided_at: null, history_count: historyCount };
  return {
    status: "decided",
    verdict: value.verdict,
    action_intent: value.action_intent,
    actor_ref: value.actor_ref,
    decided_at: value.decided_at,
    history_count: historyCount
  };
}
function receiptForOutput(root, receiptId) {
  if (!REF_ID_RE.test(receiptId || "")) throw new Error("receipt-id-invalid");
  let receipt2;
  try {
    receipt2 = readRoutineRunReceipt(root, `routine-receipt:${receiptId}`);
  } catch {
    throw new Error("routine-receipt-not-found");
  }
  if (receipt2.status !== "completed" || !receipt2.output_ref) throw new Error("output-not-available");
  return receipt2;
}
function readPrivateRoutineOutput(root, receiptId, {
  clock = () => /* @__PURE__ */ new Date(),
  secretProvider
} = {}) {
  const receipt2 = receiptForOutput(root, receiptId);
  const checkSourceAccess2 = guardDerivedOutput(root, receipt2, { clock, secretProvider });
  checkSourceAccess2();
  const { contract } = loadRoutineContract(root, receipt2.routine_id);
  const contractGoverned = contract.extensions?.decision_context !== void 0;
  const receiptGoverned = receipt2.decision_context !== void 0;
  if (contractGoverned || receiptGoverned) {
    if (!contractGoverned || !receiptGoverned || receipt2.routine_ref !== `routine:${contract.routine_id}:${contract.version}`) {
      throw new Error("governed-output-context-mismatch");
    }
    const accessClock = typeof clock === "function" ? clock : () => new Date(clock);
    readGovernedRoutineOutput(root, contract, receipt2, { clock: accessClock, secretProvider });
  }
  const outputRoot = routineOutputDirectory(root);
  const outputPath = resolve10(root, receipt2.output_ref);
  const rel = relative9(outputRoot, outputPath);
  if (!rel || rel.startsWith("..") || rel.startsWith(sep10)) throw new Error("output-outside-runtime");
  if (!existsSync10(outputRoot) || !existsSync10(outputPath)) throw new Error("output-not-found");
  if (lstatSync8(outputRoot).isSymbolicLink()) throw new Error("output-root-symlink-blocked");
  if (lstatSync8(outputPath).isSymbolicLink()) throw new Error("output-symlink-blocked");
  const realBrain = realpathSync8(resolve10(root));
  const realRoot = realpathSync8(outputRoot);
  if (!insideRealDirectory2(realBrain, realRoot)) throw new Error("output-root-outside-brain");
  const realOutput = realpathSync8(outputPath);
  const realRel = relative9(realRoot, realOutput);
  if (!realRel || realRel.startsWith("..") || realRel.startsWith(sep10)) throw new Error("output-outside-runtime");
  const details = statSync2(realOutput);
  if (!details.isFile()) throw new Error("output-not-file");
  if (details.size > MAX_PRIVATE_OUTPUT_BYTES) throw new Error("output-too-large");
  const bytes = readFileSync13(realOutput);
  if (bytes.includes(0)) throw new Error("output-binary-blocked");
  const hasOutputIdentity = receipt2.output_digest !== void 0 && receipt2.output_bytes !== void 0;
  if (hasOutputIdentity) {
    const actualDigest = `sha256:${createHash5("sha256").update(bytes).digest("hex")}`;
    if (receipt2.output_digest !== actualDigest || receipt2.output_bytes !== bytes.length) {
      throw new Error("output-integrity-mismatch");
    }
  }
  let content;
  try {
    content = new TextDecoder("utf-8", { fatal: true }).decode(bytes);
  } catch {
    throw new Error("output-encoding-invalid");
  }
  const history = listJudgmentReceipts(root, receiptId);
  const historyWithIdentity = history.map((judgment) => ({
    ...judgment,
    output_identity: !hasOutputIdentity || judgment.output_digest === void 0 ? "legacy-unverified" : judgment.output_digest === receipt2.output_digest && judgment.output_bytes === receipt2.output_bytes ? "matches-output" : "different-output"
  }));
  const current = historyWithIdentity.at(-1)?.output_identity === "matches-output" ? history.at(-1) : null;
  return {
    receipt: {
      receipt_id: receipt2.receipt_id,
      receipt_ref: `routine-receipt:${receipt2.receipt_id}`,
      run_id: receipt2.run_id,
      routine_id: receipt2.routine_id,
      system_ref: receipt2.system_ref,
      trigger: receipt2.trigger,
      completed_at: receipt2.completed_at,
      output_ref: receipt2.output_ref,
      output_digest: receipt2.output_digest ?? null,
      output_bytes: receipt2.output_bytes ?? null,
      output_integrity: hasOutputIdentity ? "verified" : "legacy-unverified"
    },
    output: { content, bytes: details.size, media_type: "text/markdown; charset=utf-8" },
    judgment: {
      current,
      summary: {
        ...judgmentSummary(current, history.length),
        output_identity: historyWithIdentity.at(-1)?.output_identity || "none"
      },
      history: historyWithIdentity.slice(-50)
    },
    privacy: emitPrivacy({
      output_in_console_read_model: false,
      explicit_local_read: true
    })
  };
}
function judgmentView(root, receiptId, {
  clock = () => /* @__PURE__ */ new Date(),
  secretProvider
} = {}) {
  const history = listJudgmentReceipts(root, receiptId);
  try {
    return readPrivateRoutineOutput(root, receiptId, { clock, secretProvider }).judgment.summary;
  } catch (error) {
    const observedReason = error instanceof Error ? error.message : "";
    const reasonCode = /^[a-z0-9][a-z0-9-]{0,127}$/.test(observedReason) ? observedReason : "judgment-state-unavailable";
    return {
      ...judgmentSummary(null, history.length),
      status: "unavailable",
      reason_code: reasonCode,
      output_identity: "unavailable"
    };
  }
}

// ../scripts/lib/context-input-ledger.mjs
import { isDeepStrictEqual } from "node:util";

// ../scripts/lib/context-baseline.mjs
var BASELINE_FAMILIES = Object.freeze(["platform", "meetings", "groups"]);
var SAMPLE_CLASSES = Object.freeze(["pilot", "backfill", "steady_state", "unknown"]);
var STAGES = Object.freeze(["captured", "prepared", "consolidated"]);

// ../scripts/lib/meetings-context-adapter.mjs
var MEETING_CONTEXT_BOUNDARY = Object.freeze({
  workflow: "capture-meeting-context",
  closes_meeting: false,
  separate_from: "fechar-encontro-society",
  external_targets: Object.freeze([])
});
var PROVIDERS = Object.freeze({
  fathom: Object.freeze({
    source_id: "fathom-recordings",
    nature: "transcript",
    cursor: "opaque",
    limitations: Object.freeze([
      "Current Fathom collector uses created_after plus opaque pagination; coverage of edits and deletions is not proven.",
      "The existing fathom_seen state is append-only and cannot establish provider-side removal.",
      "Transcript availability can lag meeting metadata."
    ])
  }),
  zoom: Object.freeze({
    source_id: "zoom-recordings",
    nature: "transcript",
    cursor: "none",
    limitations: Object.freeze([
      "Local Zoom capture has no provider deletion feed; missing files do not prove removal.",
      "recording_magic is required as stable identity; filenames and paths are not canonical IDs.",
      "Cloud recording assets depend on account settings and can arrive independently."
    ])
  }),
  encontro: Object.freeze({
    source_id: "society-meeting-ingests",
    nature: "structured_event",
    cursor: "opaque",
    limitations: Object.freeze([
      "society_meeting_ingests is publication metadata, not proof that provider transcript or recording was captured.",
      "Selected meeting IDs are a bounded policy scope, not a denominator for the provider archive.",
      "Row absence or an unavailable page does not prove deletion."
    ])
  }),
  "society-transcript": Object.freeze({
    source_id: "society-published-transcripts",
    nature: "transcript",
    cursor: "none",
    limitations: Object.freeze([
      "The immutable object identity belongs to the Society publication manifest; it does not establish Fathom or Zoom as the upstream provider.",
      "society_meeting_ingests metadata and row presence are not evidence of transcript bytes; a private-bucket read with an independent current host grant is required.",
      "An unavailable manifest, row or object is not withdrawal evidence and cannot revoke a previously observed revision.",
      "Published VTT bytes and their normalized in-memory representation have separate digests whenever normalization changes bytes."
    ])
  })
});

// ../scripts/lib/group-context-adapter.mjs
var external = (kind, id3, version = "1") => ({ kind, id: id3, version });
var POLICY = Object.freeze({
  authority: external("policy", "groups-authority"),
  permission: external("policy", "groups-access"),
  residence: external("policy", "groups-private-residence"),
  retention: external("policy", "groups-original-retention")
});
var PROCEDURE = Object.freeze({
  reconcile: external("procedure", "groups-document-reconciliation"),
  prepare: external("procedure", "groups-reference-preparation"),
  validate: external("procedure", "groups-reference-validation")
});
var DERIVED_CONTEXT = external("context", "groups-reference-only");

// ../scripts/lib/context-input-ledger.mjs
var LEGACY_REF = /^ref:[a-f0-9]{64}$/;
var LOWER_UUID = /^[a-f0-9]{8}-[a-f0-9]{4}-[1-8][a-f0-9]{3}-[89ab][a-f0-9]{3}-[a-f0-9]{12}$/;
var CHALLENGE_LIFETIME_MS = 5 * 60 * 1e3;
var exact = (value, fields) => value && typeof value === "object" && !Array.isArray(value) && Object.keys(value).sort().join(",") === [...fields].sort().join(",");
function requireValue(condition, reason) {
  if (!condition) throw new Error(`context_ledger_${reason}`);
}
var ADMISSION_KIND = "society-meeting-ingests";
var MAX_ADMITTED_PER_RULE = 40;
var ADMISSION_EFFECTS = Object.freeze({
  adopt: Object.freeze({
    meetings: "eligible meeting ingests of this organization may be admitted by discovery under this rule, up to max_admitted, while the policy is current",
    access: "admission selects metadata capture only; transcript bytes, processing and retrieval keep their own grants and decisions",
    epoch: "this transition starts a new rule epoch: ingests admitted under earlier rules leave the selection, discovery restarts at occurred_from, and explicit ids removed by a scope change stay out of discovery until a scope change adds them back"
  }),
  withdraw: Object.freeze({
    meetings: "discovery stops and only explicit meeting ids stay selected; every ingest admitted under the current rule leaves the selection",
    access: "admission selects metadata capture only; transcript bytes, processing and retrieval keep their own grants and decisions",
    epoch: "admissions stay in the ledger as history only; adopting a rule again starts a new epoch from its occurred_from"
  })
});
var canonicalInstant = (value) => typeof value === "string" && Number.isFinite(Date.parse(value)) && new Date(value).toISOString() === value;
function validateAdmission(admission) {
  requireValue(
    exact(admission, ["kind", "status", "occurred_from", "max_admitted"]) && admission.kind === ADMISSION_KIND && admission.status === "succeeded" && canonicalInstant(admission.occurred_from) && Number.isInteger(admission.max_admitted) && admission.max_admitted >= 1 && admission.max_admitted <= MAX_ADMITTED_PER_RULE,
    "policy_admission"
  );
}
var GROUP_DIR = /^02-dados-terceiros\/grupos-raw\/[a-z0-9-]+$/;
var MAX_POLICY_GROUP_DIRS2 = 8;
var groupKeyOf = (policy) => policy && Object.hasOwn(policy, "group_dirs") ? "group_dirs" : "group_dir";
function policyGroupDirs(policy) {
  return groupKeyOf(policy) === "group_dirs" ? [...policy.group_dirs] : [policy.group_dir];
}
function validatePilotPolicy(policy) {
  const standing = policy?.schema_version === 2;
  const groupKey = groupKeyOf(policy);
  requireValue(exact(policy, [
    "schema_version",
    "authorization_ref",
    "remote_origin",
    "organization_id",
    "meeting_ids",
    groupKey,
    "group_from",
    "group_to",
    "expires_at",
    "original_retention",
    "purpose",
    ...standing ? ["admission"] : []
  ]), "policy_fields");
  requireValue((policy.schema_version === 1 || standing) && LEGACY_REF.test(policy.authorization_ref), "policy_authority");
  const origin = new URL(policy.remote_origin);
  requireValue(origin.protocol === "https:" && origin.hostname.endsWith(".up.railway.app") && origin.origin === policy.remote_origin, "policy_origin");
  const uuid = (value) => typeof value === "string" && /^[a-f0-9]{8}-[a-f0-9]{4}-[1-8][a-f0-9]{3}-[89ab][a-f0-9]{3}-[a-f0-9]{12}$/i.test(value);
  requireValue(uuid(policy.organization_id) && Array.isArray(policy.meeting_ids) && policy.meeting_ids.length >= 1 && policy.meeting_ids.length <= 10 && policy.meeting_ids.every(standing ? (value) => LOWER_UUID.test(value) : uuid) && new Set(policy.meeting_ids).size === policy.meeting_ids.length, "policy_scope");
  if (standing) validateAdmission(policy.admission);
  requireValue(groupKey === "group_dirs" ? Array.isArray(policy.group_dirs) && policy.group_dirs.length >= 1 && policy.group_dirs.length <= MAX_POLICY_GROUP_DIRS2 && policy.group_dirs.every((value, index) => typeof value === "string" && GROUP_DIR.test(value) && (index === 0 || policy.group_dirs[index - 1] < value)) : typeof policy.group_dir === "string" && GROUP_DIR.test(policy.group_dir), "policy_group");
  requireValue(
    [policy.group_from, policy.group_to].every((value) => typeof value === "string" && /^\d{4}-\d{2}-\d{2}$/.test(value) && Number.isFinite(Date.parse(value)) && new Date(value).toISOString().slice(0, 10) === value) && policy.group_from < policy.group_to && Date.parse(policy.group_to) - Date.parse(policy.group_from) <= 31 * 864e5,
    "policy_window"
  );
  requireValue(typeof policy.expires_at === "string" && Number.isFinite(Date.parse(policy.expires_at)) && policy.purpose === "post-meeting-followup-audit" && policy.original_retention === "unchanged", "policy_retention");
  return policy;
}
var hasAdmissionRule = (policy) => policy?.schema_version === 2;
function renewalChanges(from, to) {
  validatePilotPolicy(from);
  validatePilotPolicy(to);
  const changed = Object.keys(from).filter((key2) => !isDeepStrictEqual(from[key2], to[key2])).sort();
  requireValue(isDeepStrictEqual(changed, ["authorization_ref", "expires_at"]) && from.authorization_ref !== to.authorization_ref && Date.parse(to.expires_at) > Date.parse(from.expires_at), "renewal_scope_expanded");
  return changed.map((field) => ({ field, from: from[field], to: to[field] }));
}
function scopeChangeChanges(from, to) {
  validatePilotPolicy(from);
  validatePilotPolicy(to);
  const changed = Object.keys(from).filter((key2) => !isDeepStrictEqual(from[key2], to[key2])).sort();
  requireValue(isDeepStrictEqual(changed, ["authorization_ref", "expires_at", "meeting_ids"]) && from.authorization_ref !== to.authorization_ref && !isDeepStrictEqual(from.meeting_ids, to.meeting_ids), "scope_change_fields");
  return changed.map((field) => ({ field, from: structuredClone(from[field]), to: structuredClone(to[field]) }));
}
function admissionChangeChanges(from, to) {
  validatePilotPolicy(from);
  validatePilotPolicy(to);
  const fields = [.../* @__PURE__ */ new Set([...Object.keys(from), ...Object.keys(to)])].sort();
  const changed = fields.filter((key2) => !isDeepStrictEqual(from[key2], to[key2]));
  const allowed = ["admission", "authorization_ref", "expires_at", "schema_version"];
  const adopts = hasAdmissionRule(to) && (!changed.includes("schema_version") || from.schema_version === 1);
  const withdraws = hasAdmissionRule(from) && to.schema_version === 1;
  requireValue(
    (adopts || withdraws) && changed.includes("admission") && changed.includes("authorization_ref") && changed.every((key2) => allowed.includes(key2)),
    "admission_change_fields"
  );
  return changed.map((field) => ({
    field,
    from: structuredClone(from[field] ?? null),
    to: structuredClone(to[field] ?? null)
  }));
}
function groupScopeChangeChanges(from, to) {
  validatePilotPolicy(from);
  validatePilotPolicy(to);
  const fields = [.../* @__PURE__ */ new Set([...Object.keys(from), ...Object.keys(to)])].sort();
  const changed = fields.filter((key2) => !isDeepStrictEqual(from[key2], to[key2]));
  const allowed = [
    "authorization_ref",
    "expires_at",
    "group_dir",
    "group_dirs",
    "group_from",
    "group_to"
  ];
  const groupScope = (policy) => [policyGroupDirs(policy), policy.group_from, policy.group_to];
  requireValue(groupKeyOf(to) === "group_dirs" && changed.includes("authorization_ref") && changed.every((key2) => allowed.includes(key2)) && !isDeepStrictEqual(groupScope(from), groupScope(to)), "group_scope_change_fields");
  return changed.map((field) => ({
    field,
    from: structuredClone(from[field] ?? null),
    to: structuredClone(to[field] ?? null)
  }));
}
var GROUP_SCOPE_EFFECTS = Object.freeze({
  groups: "only the listed group directories, inside the window, are observed from the next capture on; nothing is copied or moved",
  materialization: "each listed directory is materialized as its own instance and coverage, under the group authority, after a capture that includes it",
  meetings: "explicit meeting ids, the admission rule and its epoch are unchanged"
});
var TRANSITIONS = Object.freeze({
  renewal: {
    action: "renew-context-input-policy",
    namespace: "context-policy-renewal",
    changes: renewalChanges,
    count: 2
  },
  "group-scope-change": {
    action: "change-context-input-policy-groups",
    namespace: "context-policy-group-scope-change",
    changes: groupScopeChangeChanges,
    count: null
  },
  "scope-change": {
    action: "change-context-input-policy-scope",
    namespace: "context-policy-scope-change",
    changes: scopeChangeChanges,
    count: 3
  },
  "admission-change": {
    action: "change-context-input-policy-admission",
    namespace: "context-policy-admission-change",
    changes: admissionChangeChanges,
    count: null
  }
});

// ../scripts/lib/context-freshness.mjs
var FRESHNESS_STAGES = Object.freeze(["captured", "prepared", "consolidated"]);

// ../scripts/lib/context-snapshot-runtime.mjs
var MAX_CONTEXT_ARTIFACT_BYTES = 4 * 1024 * 1024;
var MAX_RETRIEVAL_RECEIPT_BYTES = 256 * 1024;
var MAX_INDEX_RECEIPT_BYTES = 512 * 1024;
var RETRIEVAL_RECEIPT_KEYS = /* @__PURE__ */ new Set([
  "protocol_version",
  "receipt_id",
  "kind",
  "status",
  "decision",
  "reason_code",
  "query_sha256",
  "profile_sha256",
  "started_at",
  "completed_at",
  "latency_ms",
  "adapter_invoked",
  "provider_ref",
  "transport",
  "index_receipt_ref",
  "corpus_sha256",
  "selected_refs",
  "evidence",
  "privacy"
]);
var PROVIDER_V1_RETRIEVAL_RECEIPT_KEYS = new Set(
  [...RETRIEVAL_RECEIPT_KEYS].filter((key2) => !["index_receipt_ref", "corpus_sha256"].includes(key2))
);
var LEGACY_RETRIEVAL_RECEIPT_KEYS = new Set(
  [...PROVIDER_V1_RETRIEVAL_RECEIPT_KEYS].filter((key2) => key2 !== "provider_ref")
);
var INDEX_RECEIPT_KEYS = /* @__PURE__ */ new Set([
  "protocol_version",
  "receipt_id",
  "kind",
  "provider_ref",
  "provider_version",
  "driver",
  "status",
  "reason_code",
  "plan_sha256",
  "corpus_sha256",
  "previous_receipt_ref",
  "started_at",
  "completed_at",
  "document_count",
  "updated_refs",
  "orphan_refs",
  "documents",
  "benchmark",
  "daemon_restarted",
  "privacy"
]);
var INDEX_RECEIPT_V2_KEYS = /* @__PURE__ */ new Set([...INDEX_RECEIPT_KEYS, "index_mapping", "index_mapping_sha256"]);
var INDEX_RECEIPT_V3_KEYS = /* @__PURE__ */ new Set([...INDEX_RECEIPT_V2_KEYS, "catalog_fingerprint"]);

// ../scripts/lib/evaluation-runtime.mjs
var MAX_SOURCE_BYTES = 8 * 1024 * 1024;
var MAX_OUTPUT_BYTES = 2 * 1024 * 1024;

// ../scripts/lib/execution-trace-runtime.mjs
import {
  appendFileSync as appendFileSync2,
  existsSync as existsSync11,
  mkdirSync as mkdirSync6,
  readFileSync as readFileSync14,
  realpathSync as realpathSync9
} from "node:fs";
import { dirname as dirname4, join as join11, relative as relative10, resolve as resolve11, sep as sep11 } from "node:path";
var ID_RE3 = /^[a-z0-9][a-z0-9-]{0,63}$/;
var REF_RE3 = /^[A-Za-z0-9][A-Za-z0-9_./:-]{0,255}$/;
var LOCAL_REF_RE6 = /^(?!.*\.\.(?:\/|$))[A-Za-z0-9.][A-Za-z0-9_./:-]{0,255}$/;
var STEP_TYPES = /* @__PURE__ */ new Set([
  "run",
  "access",
  "collector",
  "retrieval",
  "skill",
  "model",
  "connector",
  "capability",
  "output",
  "eval",
  "judgment"
]);
var STATES = /* @__PURE__ */ new Set([
  "declared",
  "running",
  "completed",
  "failed",
  "denied",
  "skipped",
  "gap",
  "pending"
]);
var SECRET_RE4 = /Bearer\s+|-----BEGIN .*PRIVATE KEY-----|\b(?:sk|ghp|xoxb)[-_A-Za-z0-9]{12,}/i;
var OPAQUE_REF_RE2 = /^[A-Za-z0-9][A-Za-z0-9_.:-]{0,127}$/;
var EXPERIMENT_ID_RE2 = /^EXP-[A-Za-z0-9_-]{1,48}$/;
var MODEL_ASSURANCES = /* @__PURE__ */ new Set(["requested-not-verified", "provider-reported", "verified"]);
var CONNECTOR_ASSURANCES = /* @__PURE__ */ new Set(["exported", "receipt-audited", "runtime-enforced"]);
function object13(value) {
  return value !== null && typeof value === "object" && !Array.isArray(value);
}
function insideRuntime(root, configured, fallback) {
  const runtime = resolve11(root, ".cerebro", "runtime");
  const target = resolve11(root, configured || fallback);
  const lexical = relative10(runtime, target);
  if (!lexical || lexical.startsWith("..") || lexical.startsWith(sep11)) {
    throw new Error("trace-layout-not-private");
  }
  mkdirSync6(target, { recursive: true, mode: 448 });
  const realRuntime = realpathSync9(runtime);
  const realTarget = realpathSync9(target);
  const real = relative10(realRuntime, realTarget);
  if (!real || real.startsWith("..") || real.startsWith(sep11)) throw new Error("trace-layout-outside-runtime");
  return target;
}
function executionTraceDirectory(root) {
  return insideRuntime(
    root,
    layout(root).executionTraces,
    join11(".cerebro", "runtime", "traces")
  );
}
function validateExecutionTraceEvent(value) {
  const errors = [];
  if (!object13(value)) return ["execution trace event precisa ser objeto"];
  const allowed = /* @__PURE__ */ new Set([
    "protocol_version",
    "trace_id",
    "event_id",
    "run_id",
    "sequence",
    "step_id",
    "step_type",
    "state",
    "occurred_at",
    "parent_step_id",
    "system_ref",
    "routine_ref",
    "source_ref",
    "capability_ref",
    "skill_ref",
    "input_refs",
    "output_refs",
    "reason_code",
    "evidence_ref",
    "model_ref",
    "connector_ref",
    "assurance",
    "chain_id",
    "mode",
    "experiment_ref",
    "handoff_refs",
    "privacy",
    "extensions"
  ]);
  for (const key2 of Object.keys(value)) if (!allowed.has(key2)) errors.push(`${key2} n\xE3o \xE9 permitido`);
  if (value.protocol_version !== 1) errors.push("protocol_version precisa ser 1");
  for (const field of ["trace_id", "event_id", "run_id"]) {
    if (!REF_RE3.test(value[field] || "") || String(value[field]).length < 8) errors.push(`${field} inv\xE1lido`);
  }
  if (!Number.isInteger(value.sequence) || value.sequence < 1) errors.push("sequence inv\xE1lida");
  if (!ID_RE3.test(value.step_id || "")) errors.push("step_id inv\xE1lido");
  if (!STEP_TYPES.has(value.step_type)) errors.push("step_type inv\xE1lido");
  if (!STATES.has(value.state)) errors.push("state inv\xE1lido");
  if (!Number.isFinite(Date.parse(value.occurred_at || ""))) errors.push("occurred_at inv\xE1lido");
  for (const field of ["parent_step_id", "system_ref", "routine_ref", "source_ref", "capability_ref", "model_ref", "connector_ref", "reason_code", "evidence_ref"]) {
    if (value[field] !== null && !REF_RE3.test(value[field] || "")) errors.push(`${field} inv\xE1lido`);
  }
  if (value.skill_ref !== null && !LOCAL_REF_RE6.test(value.skill_ref || "")) errors.push("skill_ref inv\xE1lido");
  for (const field of ["input_refs", "output_refs"]) {
    if (!Array.isArray(value[field])) errors.push(`${field} precisa ser lista`);
    else if (value[field].some((ref) => !LOCAL_REF_RE6.test(ref || ""))) errors.push(`${field} cont\xE9m refer\xEAncia inv\xE1lida`);
  }
  if (value.skill_ref !== null && value.step_type !== "skill") errors.push("skill_ref s\xF3 existe em step_type skill");
  if (value.step_type === "skill" && value.state === "completed" && (!value.skill_ref || !String(value.evidence_ref || "").startsWith("sha256:"))) {
    errors.push("skill conclu\xEDda exige skill_ref e evid\xEAncia sha256");
  }
  if (value.step_type === "model") {
    if (!value.model_ref) errors.push("step_type model exige model_ref");
    if (!MODEL_ASSURANCES.has(value.assurance)) errors.push("step_type model exige assurance de modelo");
  } else if (value.model_ref != null) errors.push("model_ref s\xF3 existe em step_type model");
  if (value.step_type === "connector") {
    if (!value.connector_ref) errors.push("step_type connector exige connector_ref");
    if (!CONNECTOR_ASSURANCES.has(value.assurance)) errors.push("step_type connector exige assurance de conector");
  } else if (value.connector_ref != null) errors.push("connector_ref s\xF3 existe em step_type connector");
  if (!["model", "connector"].includes(value.step_type) && value.assurance != null) {
    errors.push("assurance s\xF3 existe em step_type model ou connector");
  }
  if (value.chain_id != null && !OPAQUE_REF_RE2.test(value.chain_id || "")) errors.push("chain_id inv\xE1lido");
  if (value.chain_id == null && value.mode != null) errors.push("mode exige chain_id");
  if (value.chain_id != null && !["replay", "live"].includes(value.mode)) errors.push("chain_id exige mode replay ou live");
  if (value.mode != null && !["replay", "live"].includes(value.mode)) errors.push("mode inv\xE1lido");
  if (value.experiment_ref != null && !EXPERIMENT_ID_RE2.test(value.experiment_ref || "")) errors.push("experiment_ref inv\xE1lido");
  if (value.experiment_ref && !value.chain_id) errors.push("experiment_ref exige chain_id");
  if (value.handoff_refs !== void 0 && !Array.isArray(value.handoff_refs)) errors.push("handoff_refs precisa ser lista");
  else if (Array.isArray(value.handoff_refs)) {
    if (new Set(value.handoff_refs).size !== value.handoff_refs.length) errors.push("handoff_refs n\xE3o pode repetir valores");
    if (value.handoff_refs.some((ref) => !LOCAL_REF_RE6.test(ref || ""))) errors.push("handoff_refs cont\xE9m refer\xEAncia inv\xE1lida");
  }
  if (!object13(value.privacy) || !hasValidDisclosure(value.privacy) || value.privacy.payload_recorded !== false || value.privacy.raw_error_recorded !== false) errors.push("privacy inv\xE1lida");
  const serialized = JSON.stringify(value);
  if (SECRET_RE4.test(serialized)) errors.push("trace parece conter segredo");
  if (/"(?:prompt|output|raw_error|content|payload)"\s*:/i.test(serialized)) {
    errors.push("trace cont\xE9m payload em vez de refer\xEAncia");
  }
  return [...new Set(errors)];
}
function tracePath(root, runId) {
  if (!REF_RE3.test(runId || "")) throw new Error("trace-run-id-invalid");
  return join11(executionTraceDirectory(root), `${runId}.jsonl`);
}
function readExecutionTrace(root, runId) {
  const path = tracePath(root, runId);
  if (!existsSync11(path)) return [];
  const events = readFileSync14(path, "utf8").split("\n").filter(Boolean).map((line, index) => {
    let event;
    try {
      event = JSON.parse(line);
    } catch {
      throw new Error(`trace-json-invalid-${index + 1}`);
    }
    const errors = validateExecutionTraceEvent(event);
    if (errors.length) throw new Error(`trace-event-invalid-${index + 1}:${errors.join("|")}`);
    return event;
  });
  for (let index = 0; index < events.length; index += 1) {
    if (events[index].sequence !== index + 1) throw new Error("trace-sequence-invalid");
    if (events[index].run_id !== runId) throw new Error("trace-run-mismatch");
    if (index > 0 && events[index].trace_id !== events[0].trace_id) throw new Error("trace-id-mismatch");
  }
  return events;
}
function latestStepStates(events) {
  const byStep = /* @__PURE__ */ new Map();
  for (const event of events) byStep.set(event.step_id, event);
  return byStep;
}

// ../scripts/lib/model-executors.mjs
var COMMANDS = Object.freeze({
  "codex-cli": "codex",
  "claude-code": "claude"
});
var AUTH_COMMANDS = Object.freeze({
  "codex-cli": ["login", "status"],
  "claude-code": ["auth", "status"]
});
var CLAUDE_OUTPUT_ONLY_FLAGS = Object.freeze([
  "--print",
  "--input-format",
  "--output-format",
  "--no-session-persistence",
  "--model",
  "--effort",
  "--safe-mode",
  "--tools",
  "--strict-mcp-config",
  "--mcp-config",
  "--setting-sources",
  "--disable-slash-commands"
]);
var CLAUDE_NON_SUBSCRIPTION_ENV = Object.freeze([
  "ANTHROPIC_API_KEY",
  "ANTHROPIC_AUTH_TOKEN",
  "ANTHROPIC_BASE_URL",
  "CLAUDE_CODE_USE_BEDROCK",
  "CLAUDE_CODE_USE_VERTEX",
  "CLAUDE_CODE_USE_FOUNDRY"
]);
var SUPPORTED_EXECUTOR_ADAPTERS = Object.freeze(Object.keys(COMMANDS));

// ../scripts/lib/routine-runtime.mjs
var UNAVAILABLE_SECRET_PROVIDER2 = Object.freeze({
  available: false,
  status: () => ({ reason_code: "secret-provider-unavailable" })
});
var MAX_SUPPLEMENTAL_PROMPT_CHARS = 8 * 1024;

// ../scripts/lib/correction-loop.mjs
var LOCAL_REF_RE7 = /^(?!\.?\.?$)(?!\.?\.?\/)(?!.*\/\.\.(?:\/|$))[A-Za-z0-9.][A-Za-z0-9_./:-]{0,255}$/;
var TERMINAL_STATUSES = /* @__PURE__ */ new Set(["completed", "failed", "denied", "skipped"]);
function object14(value) {
  return value !== null && typeof value === "object" && !Array.isArray(value);
}
function closed6(errors, value, path, keys) {
  if (!object14(value)) return;
  const allowed = new Set(keys);
  for (const key2 of Object.keys(value)) if (!allowed.has(key2)) errors.push(`${path}.${key2} n\xE3o \xE9 permitido`);
}
function validDate2(value) {
  return Number.isFinite(Date.parse(value || ""));
}
function privateDirectory2(root, configured, fallback, label) {
  const brain = resolve12(root);
  const runtime = resolve12(root, ".cerebro", "runtime");
  const target = resolve12(root, configured || fallback);
  if (target === brain || !target.startsWith(`${brain}${sep12}`)) throw new Error(`${label}-layout-outside-brain`);
  if (target === runtime || !target.startsWith(`${runtime}${sep12}`)) throw new Error(`${label}-layout-not-private`);
  if (!existsSync12(runtime)) throw new Error(`${label}-runtime-missing`);
  const realBrain = realpathSync10(brain);
  const realRuntime = realpathSync10(runtime);
  const runtimeRel = relative11(realBrain, realRuntime);
  if (!runtimeRel || runtimeRel.startsWith("..") || runtimeRel.startsWith(sep12)) throw new Error(`${label}-runtime-outside-brain`);
  let existing = target;
  while (!existsSync12(existing)) {
    const parent = resolve12(existing, "..");
    if (parent === existing) throw new Error(`${label}-storage-parent-missing`);
    existing = parent;
  }
  if (lstatSync9(existing).isSymbolicLink()) throw new Error(`${label}-storage-symlink-blocked`);
  const realExisting = realpathSync10(existing);
  const rel = relative11(realRuntime, realExisting);
  if (realExisting !== realRuntime && (!rel || rel.startsWith("..") || rel.startsWith(sep12))) {
    throw new Error(`${label}-storage-outside-runtime`);
  }
  return target;
}
function correctionDirectory(root) {
  return privateDirectory2(
    root,
    layout(root).routineCorrections,
    join12(".cerebro", "runtime", "corrections"),
    "correction"
  );
}
function learningDirectory(root) {
  return privateDirectory2(
    root,
    layout(root).learningCandidates,
    join12(".cerebro", "runtime", "learning-candidates"),
    "learning"
  );
}
function referenceOnly3(errors, value, path) {
  const serialized = JSON.stringify(value);
  if (/"(?:prompt|output|note|raw_error|token|api_key|oauth)"\s*:/i.test(serialized)) {
    errors.push(`${path} cont\xE9m conte\xFAdo ou credencial`);
  }
}
function validateCorrectionRunReceipt(value) {
  const errors = [];
  if (!object14(value)) return ["correction run receipt precisa ser objeto"];
  closed6(errors, value, "correction_run_receipt", [
    "protocol_version",
    "correction_id",
    "baseline_routine_receipt_ref",
    "correction_judgment_ref",
    "resulting_routine_receipt_ref",
    "routine_id",
    "system_ref",
    "requested_by",
    "requested_at",
    "completed_at",
    "status",
    "reason_code",
    "privacy"
  ]);
  if (value.protocol_version !== 1) errors.push("protocol_version precisa ser 1");
  if (!REF_ID_RE.test(value.correction_id || "")) errors.push("correction_id inv\xE1lido");
  for (const field of [
    "baseline_routine_receipt_ref",
    "correction_judgment_ref",
    "resulting_routine_receipt_ref"
  ]) if (!LOCAL_REF_RE7.test(value[field] || "")) errors.push(`${field} inv\xE1lido`);
  if (!String(value.baseline_routine_receipt_ref || "").startsWith("routine-receipt:")) errors.push("baseline precisa ser Routine Run Receipt");
  if (!String(value.correction_judgment_ref || "").startsWith("judgment-receipt:")) errors.push("corre\xE7\xE3o precisa ser Judgment Receipt");
  if (!String(value.resulting_routine_receipt_ref || "").startsWith("routine-receipt:")) errors.push("resultado precisa ser Routine Run Receipt");
  if (!ID_RE2.test(value.routine_id || "")) errors.push("routine_id inv\xE1lido");
  if (!ID_RE2.test(value.system_ref || "")) errors.push("system_ref inv\xE1lido");
  if (!REF_ID_RE.test(value.requested_by || "")) errors.push("requested_by inv\xE1lido");
  if (!validDate2(value.requested_at)) errors.push("requested_at inv\xE1lido");
  if (!validDate2(value.completed_at)) errors.push("completed_at inv\xE1lido");
  if (validDate2(value.requested_at) && validDate2(value.completed_at) && Date.parse(value.completed_at) < Date.parse(value.requested_at)) errors.push("completed_at anterior ao pedido");
  if (!TERMINAL_STATUSES.has(value.status)) errors.push("status inv\xE1lido");
  if (!ID_RE2.test(value.reason_code || "")) errors.push("reason_code inv\xE1lido");
  if (!object14(value.privacy)) errors.push("privacy precisa ser objeto");
  else {
    closed6(errors, value.privacy, "privacy", privacyKeys(
      "prompt_recorded",
      "output_recorded",
      "judgment_note_recorded",
      "correction_shared_with_provider",
      "external_action_executed"
    ));
    disclosureErrors(errors, value.privacy, "privacy");
    if (value.privacy.prompt_recorded !== false) errors.push("prompt n\xE3o pode entrar no recibo");
    if (value.privacy.output_recorded !== false) errors.push("output n\xE3o pode entrar no recibo");
    if (value.privacy.judgment_note_recorded !== false) errors.push("nota n\xE3o pode entrar no recibo");
    if (typeof value.privacy.correction_shared_with_provider !== "boolean") errors.push("fronteira do provider inv\xE1lida");
    if (value.privacy.external_action_executed !== false) errors.push("corre\xE7\xE3o n\xE3o executa a\xE7\xE3o externa");
  }
  referenceOnly3(errors, value, "correction_run_receipt");
  return [...new Set(errors)];
}
function validateLearningCandidate(value) {
  const errors = [];
  if (!object14(value)) return ["learning candidate precisa ser objeto"];
  closed6(errors, value, "learning_candidate", [
    "protocol_version",
    "candidate_id",
    "learning_type",
    "system_ref",
    "routine_id",
    "source_correction_ref",
    "evidence_run_ref",
    "approval_judgment_ref",
    "status",
    "occurrences",
    "promotion_threshold",
    "replay_status",
    "created_by",
    "created_at",
    "privacy"
  ]);
  if (value.protocol_version !== 1) errors.push("protocol_version precisa ser 1");
  if (!REF_ID_RE.test(value.candidate_id || "")) errors.push("candidate_id inv\xE1lido");
  if (value.learning_type !== "correction-candidate") errors.push("learning_type inv\xE1lido");
  if (!ID_RE2.test(value.system_ref || "")) errors.push("system_ref inv\xE1lido");
  if (!ID_RE2.test(value.routine_id || "")) errors.push("routine_id inv\xE1lido");
  for (const field of ["source_correction_ref", "evidence_run_ref", "approval_judgment_ref"]) {
    if (!LOCAL_REF_RE7.test(value[field] || "")) errors.push(`${field} inv\xE1lido`);
  }
  if (!String(value.source_correction_ref || "").startsWith("correction-run:")) errors.push("source_correction_ref inv\xE1lido");
  if (!String(value.evidence_run_ref || "").startsWith("routine-receipt:")) errors.push("evidence_run_ref inv\xE1lido");
  if (!String(value.approval_judgment_ref || "").startsWith("judgment-receipt:")) errors.push("approval_judgment_ref inv\xE1lido");
  if (value.status !== "candidate") errors.push("status precisa ser candidate");
  if (value.occurrences !== 1) errors.push("primeiro candidato precisa nascer com 1 ocorr\xEAncia");
  if (!Number.isInteger(value.promotion_threshold) || value.promotion_threshold < 3) errors.push("promotion_threshold precisa ser >= 3");
  if (value.replay_status !== "not-eligible") errors.push("primeiro candidato ainda n\xE3o \xE9 eleg\xEDvel para replay");
  if (!REF_ID_RE.test(value.created_by || "")) errors.push("created_by inv\xE1lido");
  if (!validDate2(value.created_at)) errors.push("created_at inv\xE1lido");
  if (!object14(value.privacy)) errors.push("privacy precisa ser objeto");
  else {
    closed6(errors, value.privacy, "privacy", privacyKeys(
      "correction_recorded",
      "output_recorded",
      "motor_changed",
      "external_action_executed"
    ));
    disclosureErrors(errors, value.privacy, "privacy");
    for (const field of [
      "correction_recorded",
      "output_recorded",
      "motor_changed",
      "external_action_executed"
    ]) if (value.privacy[field] !== false) errors.push(`privacy.${field} precisa ser false`);
  }
  referenceOnly3(errors, value, "learning_candidate");
  return [...new Set(errors)];
}
function readCorrection(path) {
  if (lstatSync9(path).isSymbolicLink()) throw new Error("correction-receipt-symlink-blocked");
  const value = readJson(path, "Correction Run Receipt");
  const errors = validateCorrectionRunReceipt(value);
  if (errors.length) throw new Error("correction-receipt-invalid");
  return value;
}
function readCandidate(path) {
  if (lstatSync9(path).isSymbolicLink()) throw new Error("learning-candidate-symlink-blocked");
  const value = readJson(path, "Learning Candidate");
  const errors = validateLearningCandidate(value);
  if (errors.length) throw new Error("learning-candidate-invalid");
  return value;
}
function listCorrectionRunReceipts(root) {
  const directory2 = correctionDirectory(root);
  if (!existsSync12(directory2)) return [];
  return readdirSync7(directory2).filter((name) => name.endsWith(".json")).sort().map((name) => readCorrection(join12(directory2, name))).sort((left, right) => Date.parse(left.requested_at) - Date.parse(right.requested_at));
}
function listLearningCandidates(root) {
  const directory2 = learningDirectory(root);
  if (!existsSync12(directory2)) return [];
  return readdirSync7(directory2).filter((name) => name.endsWith(".json")).sort().map((name) => readCandidate(join12(directory2, name))).sort((left, right) => Date.parse(left.created_at) - Date.parse(right.created_at));
}
function correctionForResult(root, receiptId) {
  const ref = `routine-receipt:${receiptId}`;
  return listCorrectionRunReceipts(root).find((item) => item.resulting_routine_receipt_ref === ref) || null;
}
function candidateForCorrection(root, correctionId) {
  const ref = `correction-run:${correctionId}`;
  return listLearningCandidates(root).find((item) => item.source_correction_ref === ref) || null;
}
function correctionView(root, receiptId) {
  const receiptRef = `routine-receipt:${receiptId}`;
  const all = listCorrectionRunReceipts(root);
  const asResult = all.find((item) => item.resulting_routine_receipt_ref === receiptRef) || null;
  const asBaseline = all.filter((item) => item.baseline_routine_receipt_ref === receiptRef).at(-1) || null;
  const correction = asResult || asBaseline;
  if (!correction) return null;
  const candidate = candidateForCorrection(root, correction.correction_id);
  return {
    role: asResult ? "candidate" : "baseline",
    correction_ref: `correction-run:${correction.correction_id}`,
    baseline_receipt_ref: correction.baseline_routine_receipt_ref,
    resulting_receipt_ref: correction.resulting_routine_receipt_ref,
    correction_judgment_ref: correction.correction_judgment_ref,
    status: correction.status,
    comparison_available: correction.status === "completed",
    learning_candidate: candidate ? {
      candidate_ref: `learning-candidate:${candidate.candidate_id}`,
      status: candidate.status,
      occurrences: candidate.occurrences,
      promotion_threshold: candidate.promotion_threshold,
      replay_status: candidate.replay_status,
      motor_changed: candidate.privacy.motor_changed
    } : null
  };
}
function correctionActions(root, receiptId) {
  let judgment = null;
  try {
    judgment = readPrivateRoutineOutput(root, receiptId).judgment.current;
  } catch {
  }
  const all = listCorrectionRunReceipts(root);
  const alreadyUsed = judgment ? all.some((item) => item.correction_judgment_ref === `judgment-receipt:${judgment.judgment_id}`) : false;
  const correction = correctionForResult(root, receiptId);
  const candidate = correction ? candidateForCorrection(root, correction.correction_id) : null;
  return {
    can_rerun_with_correction: Boolean(judgment?.verdict === "changes-requested" && judgment.note.trim() && !alreadyUsed),
    can_compare: correction?.status === "completed",
    can_create_learning_candidate: Boolean(correction?.status === "completed" && judgment?.verdict === "approved" && !candidate)
  };
}

// ../scripts/lib/experiment-protocol.mjs
import { existsSync as existsSync13, readdirSync as readdirSync8 } from "node:fs";
import { join as join13, relative as relative12, resolve as resolve13, sep as sep13 } from "node:path";
var EXPERIMENT_ID_RE3 = /^EXP-[A-Za-z0-9_-]{1,48}$/;
var HASH_RE = /^[a-f0-9]{64}$/;
var OPAQUE_REF_RE3 = /^[A-Za-z0-9][A-Za-z0-9_.:-]{0,127}$/;
var CONTRACT_KEYS = /* @__PURE__ */ new Set([
  "protocol_version",
  "experiment_id",
  "name",
  "version",
  "lifecycle",
  "contract_status",
  "gaps",
  "system_ref",
  "measurement_system_refs",
  "owner_ref",
  "offer_ref",
  "baseline",
  "hypothesis",
  "change",
  "preconditions",
  "arms_status",
  "arms",
  "primary_metric",
  "guardrails",
  "diagnostic_refs",
  "decision_rule",
  "window",
  "source_refs",
  "freeze",
  "privacy"
]);
var STATE_KEYS = /* @__PURE__ */ new Set([
  "protocol_version",
  "experiment_id",
  "status",
  "phase",
  "started_on",
  "read_on",
  "closed_on",
  "amendment_count",
  "amendments",
  "run_refs",
  "chain_refs",
  "measurement",
  "verdict",
  "learning",
  "observed_at",
  "privacy"
]);
var STATUSES2 = /* @__PURE__ */ new Set(["queued", "running", "ready-for-read", "decided", "cancelled", "blocked"]);
var PHASES = /* @__PURE__ */ new Set(["contract", "execution", "measurement", "decision", "learning"]);
function object15(value) {
  return value !== null && typeof value === "object" && !Array.isArray(value);
}
function requiredText(errors, value, path) {
  if (typeof value !== "string" || !value.trim()) errors.push(`${path} precisa ser texto n\xE3o vazio`);
}
function optionalDate(errors, value, path) {
  if (value !== null && (typeof value !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(value))) {
    errors.push(`${path} precisa ser data ou null`);
  }
}
function exactKeys(errors, value, allowed, path) {
  if (!object15(value)) return;
  for (const key2 of Object.keys(value)) if (!allowed.has(key2)) errors.push(`${path}.${key2} n\xE3o \xE9 permitido`);
}
function refList(errors, values, path, pattern = REF_ID_RE, minimum = 0) {
  if (!Array.isArray(values)) {
    errors.push(`${path} precisa ser lista`);
    return;
  }
  if (values.length < minimum) errors.push(`${path} precisa ter pelo menos ${minimum} item(ns)`);
  if (new Set(values).size !== values.length) errors.push(`${path} n\xE3o pode repetir refer\xEAncias`);
  values.forEach((value, index) => {
    if (!pattern.test(value || "")) errors.push(`${path}[${index}] inv\xE1lido`);
  });
}
function validateExperimentContract(value) {
  const errors = [];
  if (!object15(value)) return ["experiment contract precisa ser objeto"];
  exactKeys(errors, value, CONTRACT_KEYS, "contract");
  if (value.protocol_version !== 1) errors.push("protocol_version precisa ser 1");
  if (!EXPERIMENT_ID_RE3.test(value.experiment_id || "")) errors.push("experiment_id inv\xE1lido");
  requiredText(errors, value.name, "name");
  if (!VERSION_RE2.test(value.version || "")) errors.push("version precisa ser semver");
  if (value.lifecycle !== "frozen") errors.push("lifecycle precisa ser frozen");
  if (!["complete", "legacy-incomplete"].includes(value.contract_status)) errors.push("contract_status inv\xE1lido");
  const allowedGaps = /* @__PURE__ */ new Set(["arms-not-structured", "guardrail-rule-missing", "decision-rule-missing"]);
  if (!Array.isArray(value.gaps) || value.gaps.some((gap) => !allowedGaps.has(gap))) errors.push("gaps inv\xE1lido");
  if (value.contract_status === "complete" && value.gaps?.length) errors.push("contract completo n\xE3o pode ter gaps");
  if (value.contract_status === "legacy-incomplete" && !value.gaps?.length) errors.push("contract legado incompleto precisa declarar gaps");
  if (!ID_RE2.test(value.system_ref || "")) errors.push("system_ref inv\xE1lido");
  refList(errors, value.measurement_system_refs, "measurement_system_refs", ID_RE2, 1);
  if (!REF_ID_RE.test(value.owner_ref || "")) errors.push("owner_ref inv\xE1lido");
  if (value.offer_ref !== null && value.offer_ref !== void 0 && !REF_ID_RE.test(value.offer_ref || "")) {
    errors.push("offer_ref inv\xE1lido");
  }
  requiredText(errors, value.hypothesis, "hypothesis");
  requiredText(errors, value.change, "change");
  if (!["structured", "not-structured"].includes(value.arms_status)) errors.push("arms_status inv\xE1lido");
  if (!Array.isArray(value.arms)) errors.push("arms precisa ser lista");
  else {
    if (value.arms.length > 20) errors.push("arms aceita no m\xE1ximo 20 bra\xE7os");
    value.arms.forEach((arm, index) => {
      if (!object15(arm) || !REF_ID_RE.test(arm.arm_id || "")) errors.push(`arms[${index}].arm_id inv\xE1lido`);
      if (!["control", "variation", "single", "unspecified"].includes(arm?.role)) errors.push(`arms[${index}].role inv\xE1lido`);
    });
    if (value.arms_status === "structured" && value.arms.length === 0) errors.push("arms estruturados n\xE3o podem estar vazios");
    if (value.arms_status === "not-structured" && value.arms.length > 0) errors.push("arms n\xE3o estruturados precisam permanecer vazios");
  }
  if (!object15(value.primary_metric)) errors.push("primary_metric precisa ser objeto");
  else {
    if (!ID_RE2.test(value.primary_metric.metric_id || "")) errors.push("primary_metric.metric_id inv\xE1lido");
    requiredText(errors, value.primary_metric.definition, "primary_metric.definition");
    if (value.primary_metric.query_ref !== null && !OPAQUE_REF_RE3.test(value.primary_metric.query_ref || "")) {
      errors.push("primary_metric.query_ref inv\xE1lido");
    }
  }
  if (!object15(value.guardrails)) errors.push("guardrails precisa ser objeto");
  else {
    if (value.guardrails.rule !== null) requiredText(errors, value.guardrails.rule, "guardrails.rule");
    refList(errors, value.guardrails.metric_refs, "guardrails.metric_refs", ID_RE2);
  }
  refList(errors, value.diagnostic_refs || [], "diagnostic_refs", ID_RE2);
  if (value.decision_rule !== null) requiredText(errors, value.decision_rule, "decision_rule");
  if (value.contract_status === "complete") {
    requiredText(errors, value.guardrails?.rule, "guardrails.rule");
    requiredText(errors, value.decision_rule, "decision_rule");
    if (value.arms_status !== "structured") errors.push("contract completo exige arms estruturados");
  }
  if (!object15(value.window)) errors.push("window precisa ser objeto");
  else {
    optionalDate(errors, value.window.started_on, "window.started_on");
    optionalDate(errors, value.window.read_on, "window.read_on");
  }
  refList(errors, value.source_refs, "source_refs", REF_ID_RE, 1);
  if (!object15(value.freeze)) errors.push("freeze precisa ser objeto");
  else {
    if (!["sha256", "legacy-attested"].includes(value.freeze.kind)) errors.push("freeze.kind inv\xE1lido");
    if (value.freeze.frozen_at !== null && !Number.isFinite(Date.parse(value.freeze.frozen_at || ""))) errors.push("freeze.frozen_at inv\xE1lido");
    requiredText(errors, value.freeze.source_ref, "freeze.source_ref");
    if (!HASH_RE.test(value.freeze.source_sha256 || "")) errors.push("freeze.source_sha256 inv\xE1lido");
  }
  if (!object15(value.privacy) || !hasValidDisclosure(value.privacy) || value.privacy.summary_safe !== true || value.privacy.detail_requires_explicit_read !== true) {
    errors.push("privacy inv\xE1lida");
  }
  return errors;
}
function validateExperimentState(value) {
  const errors = [];
  if (!object15(value)) return ["experiment state precisa ser objeto"];
  exactKeys(errors, value, STATE_KEYS, "state");
  if (value.protocol_version !== 1) errors.push("protocol_version precisa ser 1");
  if (!EXPERIMENT_ID_RE3.test(value.experiment_id || "")) errors.push("experiment_id inv\xE1lido");
  if (!STATUSES2.has(value.status)) errors.push("status inv\xE1lido");
  if (!PHASES.has(value.phase)) errors.push("phase inv\xE1lida");
  optionalDate(errors, value.started_on, "started_on");
  optionalDate(errors, value.read_on, "read_on");
  optionalDate(errors, value.closed_on, "closed_on");
  if (!Number.isInteger(value.amendment_count) || value.amendment_count < 0) errors.push("amendment_count inv\xE1lido");
  if (!Array.isArray(value.amendments)) errors.push("amendments precisa ser lista");
  else {
    if (value.amendments.length !== value.amendment_count) errors.push("amendment_count diverge de amendments");
    value.amendments.forEach((amendment, index) => {
      if (!object15(amendment) || !REF_ID_RE.test(amendment.amendment_id || "")) errors.push(`amendments[${index}] inv\xE1lida`);
      optionalDate(errors, amendment?.on ?? null, `amendments[${index}].on`);
      if (!Number.isInteger(amendment?.change_count) || amendment.change_count < 0) errors.push(`amendments[${index}].change_count inv\xE1lido`);
    });
  }
  refList(errors, value.run_refs, "run_refs", OPAQUE_REF_RE3);
  if (value.chain_refs !== void 0) refList(errors, value.chain_refs, "chain_refs", OPAQUE_REF_RE3);
  if (!object15(value.measurement)) errors.push("measurement precisa ser objeto");
  else {
    if (!["not-started", "collecting", "ready", "complete", "blocked"].includes(value.measurement.status)) errors.push("measurement.status inv\xE1lido");
    if (!ID_RE2.test(value.measurement.primary_metric_ref || "")) errors.push("measurement.primary_metric_ref inv\xE1lido");
    refList(errors, value.measurement.diagnostic_refs, "measurement.diagnostic_refs", ID_RE2);
  }
  if (!object15(value.verdict) || !["pending", "recorded", "not-executed"].includes(value.verdict?.status)) errors.push("verdict inv\xE1lido");
  else optionalDate(errors, value.verdict.decided_on, "verdict.decided_on");
  if (!object15(value.learning) || !["pending", "unlinked", "linked", "not-applicable"].includes(value.learning?.status)) errors.push("learning inv\xE1lido");
  else if (value.learning.status === "linked" && !value.learning.ref) errors.push("learning linked exige ref");
  if (!Number.isFinite(Date.parse(value.observed_at || ""))) errors.push("observed_at inv\xE1lido");
  if (!object15(value.privacy) || !hasValidDisclosure(value.privacy) || value.privacy.verdict_in_summary !== false) {
    errors.push("privacy inv\xE1lida");
  }
  return errors;
}
function inside2(root, configured, fallback) {
  const brain = resolve13(root);
  const target = resolve13(root, configured || fallback);
  const rel = relative12(brain, target);
  if (!rel || rel.startsWith("..") || rel.startsWith(sep13)) throw new Error("layout de Experimentos aponta para fora do C\xE9rebro");
  return target;
}
function paths(root) {
  const configured = layout(root);
  return {
    contracts: inside2(root, configured.experimentContracts, ".cerebro/contracts/experiments"),
    states: inside2(root, configured.experimentStates, ".cerebro/runtime/experiments")
  };
}
function jsonFiles(directory2) {
  if (!existsSync13(directory2)) return [];
  return readdirSync8(directory2).filter((name) => name.endsWith(".json")).sort().map((name) => join13(directory2, name));
}
function linkedRunRefs(records, experimentId) {
  return records.filter((record2) => (record2.entity_refs || []).some((ref) => ref.role === "experiment" && ref.id === experimentId)).map((record2) => `run-record:${record2.run_id}`);
}
function stateFile(root, experimentId) {
  return join13(paths(root).states, `${experimentId.toLowerCase()}.json`);
}
function stateFor(root, experimentId) {
  const path = stateFile(root, experimentId);
  if (!existsSync13(path)) return null;
  const state2 = readJson(path, "Experiment State");
  const errors = validateExperimentState(state2);
  if (errors.length) throw new Error(`Experiment State inv\xE1lido: ${errors.join(" \xB7 ")}`);
  if (state2.experiment_id !== experimentId) throw new Error("experiment state diverge do contract");
  return state2;
}
function listExperimentContracts(root) {
  return jsonFiles(paths(root).contracts).map((path) => {
    const contract = readJson(path, "Experiment Contract");
    const errors = validateExperimentContract(contract);
    if (errors.length) throw new Error(`Experiment Contract inv\xE1lido: ${errors.join(" \xB7 ")}`);
    return { path, contract };
  });
}
function buildExperimentReadModel(root, { runRecords = null } = {}) {
  const issues = [];
  let records = runRecords;
  if (!records) {
    try {
      records = latestRunRecords(root);
    } catch {
      records = [];
    }
  }
  const experiments = [];
  for (const { path, contract } of (() => {
    try {
      return listExperimentContracts(root);
    } catch (error) {
      issues.push({ reason_code: "experiment-contract-invalid", ref: ".cerebro/contracts/experiments" });
      return [];
    }
  })()) {
    try {
      const state2 = stateFor(root, contract.experiment_id);
      const runRefs = [.../* @__PURE__ */ new Set([...state2?.run_refs || [], ...linkedRunRefs(records, contract.experiment_id)])];
      experiments.push({
        experiment_id: contract.experiment_id,
        name: contract.name,
        status: state2?.status || "queued",
        phase: state2?.phase || "contract",
        system_ref: contract.system_ref,
        measurement_system_refs: contract.measurement_system_refs,
        primary_metric_ref: contract.primary_metric.metric_id,
        contract_status: contract.contract_status,
        contract_gap_count: contract.gaps.length,
        arms_status: contract.arms_status,
        arm_count: contract.arms.length,
        started_on: state2?.started_on || contract.window.started_on,
        read_on: state2?.read_on || contract.window.read_on,
        closed_on: state2?.closed_on || null,
        amendment_count: state2?.amendment_count || 0,
        run_count: runRefs.length,
        verdict_status: state2?.verdict.status || "pending",
        learning_status: state2?.learning.status || "pending",
        detail_requires_explicit_read: true
      });
    } catch {
      issues.push({ reason_code: "experiment-state-invalid", ref: relative12(root, path).replaceAll("\\", "/") });
    }
  }
  return { experiments: experiments.sort((a, b) => a.experiment_id.localeCompare(b.experiment_id, void 0, { numeric: true })), issues };
}

// ../scripts/lib/compatibility-diagnostic.mjs
import {
  existsSync as existsSync14,
  lstatSync as lstatSync10,
  readFileSync as readFileSync15,
  readdirSync as readdirSync9
} from "node:fs";
import {
  isAbsolute as isAbsolute4,
  join as join14,
  relative as relative13,
  resolve as resolve14,
  sep as sep14
} from "node:path";
var MANIFEST_KEYS = [
  "protocol",
  "manifest_version",
  "profile",
  "distribution",
  "version_ref",
  "identity_ref",
  "layout_ref",
  "entrypoints",
  "runtime",
  "privacy",
  "compatibility"
];
var CONTRACT_KINDS = ["source", "system", "run", "access", "routine", "trace", "experiment", "handoff"];
var REQUIRED_CONTRACT_KINDS = ["source", "system", "run"];
var PROFILES = /* @__PURE__ */ new Set(["full", "starter", "legacy-compatible"]);
var DISTRIBUTIONS = /* @__PURE__ */ new Set(["inevita", "private"]);
var RUNTIME_MODES = /* @__PURE__ */ new Set(["file-only", "local-optional", "local-required"]);
function object16(value) {
  return value !== null && typeof value === "object" && !Array.isArray(value);
}
function allowedKeys2(errors, value, path, keys) {
  if (!object16(value)) return;
  const allowed = new Set(keys);
  for (const key2 of Object.keys(value)) {
    if (!allowed.has(key2)) errors.push(`${path}.${key2} n\xE3o \xE9 permitido`);
  }
}
function relativeRef(value) {
  return typeof value === "string" && value.length > 0 && value.length <= 240 && !isAbsolute4(value) && !value.includes("\\") && !value.split("/").includes("..");
}
function versionList(errors, value, path) {
  if (!Array.isArray(value) || value.length === 0) {
    errors.push(`${path} precisa ser lista n\xE3o vazia`);
    return;
  }
  if (new Set(value).size !== value.length) errors.push(`${path} n\xE3o pode repetir vers\xF5es`);
  if (value.some((version) => !Number.isInteger(version) || version < 1)) {
    errors.push(`${path} aceita somente inteiros positivos`);
  }
}
function validateBrainManifest(value) {
  const errors = [];
  if (!object16(value)) return ["Brain Manifest precisa ser objeto"];
  allowedKeys2(errors, value, "manifest", MANIFEST_KEYS);
  if (value.protocol !== "company-brain") errors.push("protocol precisa ser company-brain");
  if (value.manifest_version !== 1) errors.push("manifest_version precisa ser 1");
  if (!PROFILES.has(value.profile)) errors.push("profile inv\xE1lido");
  if (!DISTRIBUTIONS.has(value.distribution)) errors.push("distribution inv\xE1lida");
  for (const field of ["version_ref", "identity_ref", "layout_ref"]) {
    if (!relativeRef(value[field])) errors.push(`${field} precisa ser refer\xEAncia relativa segura`);
  }
  if (!Array.isArray(value.entrypoints) || value.entrypoints.length === 0) {
    errors.push("entrypoints precisa ser lista n\xE3o vazia");
  } else {
    if (new Set(value.entrypoints).size !== value.entrypoints.length) errors.push("entrypoints n\xE3o pode repetir refer\xEAncias");
    if (value.entrypoints.some((entry) => !relativeRef(entry))) errors.push("entrypoints cont\xE9m refer\xEAncia insegura");
  }
  if (!object16(value.runtime)) errors.push("runtime precisa ser objeto");
  else {
    allowedKeys2(errors, value.runtime, "runtime", ["mode", "provider_control"]);
    if (!RUNTIME_MODES.has(value.runtime.mode)) errors.push("runtime.mode inv\xE1lido");
    if (value.runtime.provider_control !== "owner-controlled") errors.push("runtime.provider_control precisa ser owner-controlled");
  }
  if (!object16(value.privacy)) errors.push("privacy precisa ser objeto");
  else {
    allowedKeys2(errors, value.privacy, "privacy", ["data_plane", "network_content_sync", "reference_only_receipts"]);
    if (value.privacy.data_plane !== "local") errors.push("privacy.data_plane precisa ser local");
    if (value.privacy.network_content_sync !== false) errors.push("privacy.network_content_sync precisa ser false");
    if (value.privacy.reference_only_receipts !== true) errors.push("privacy.reference_only_receipts precisa ser true");
  }
  if (!object16(value.compatibility)) errors.push("compatibility precisa ser objeto");
  else {
    allowedKeys2(errors, value.compatibility, "compatibility", ["contracts", "migration_mode", "unknown_fields"]);
    if (value.compatibility.migration_mode !== "preview-diff-confirm") {
      errors.push("compatibility.migration_mode precisa ser preview-diff-confirm");
    }
    if (value.compatibility.unknown_fields !== "reject") errors.push("compatibility.unknown_fields precisa ser reject");
    if (!object16(value.compatibility.contracts)) errors.push("compatibility.contracts precisa ser objeto");
    else {
      allowedKeys2(errors, value.compatibility.contracts, "compatibility.contracts", CONTRACT_KINDS);
      for (const kind of REQUIRED_CONTRACT_KINDS) {
        if (!(kind in value.compatibility.contracts)) errors.push(`compatibility.contracts.${kind} \xE9 obrigat\xF3rio`);
      }
      for (const [kind, versions] of Object.entries(value.compatibility.contracts)) {
        versionList(errors, versions, `compatibility.contracts.${kind}`);
      }
    }
  }
  return errors;
}
function manifestReferenceErrors(root, manifest) {
  const errors = [];
  const required = [
    ["version_ref", manifest.version_ref],
    ["layout_ref", manifest.layout_ref],
    ...(manifest.entrypoints || []).map((ref, index) => [`entrypoints[${index}]`, ref])
  ];
  if (manifest.profile !== "starter") required.push(["identity_ref", manifest.identity_ref]);
  for (const [field, ref] of required) {
    if (!relativeRef(ref)) continue;
    const target = safeInside(root, ref, ref);
    if (!target || !existsSync14(target)) {
      errors.push({ reason_code: "brain-manifest-reference-missing", ref, field });
      continue;
    }
    try {
      const stat = lstatSync10(target);
      if (stat.isSymbolicLink() || !stat.isFile()) {
        errors.push({ reason_code: "brain-manifest-reference-invalid", ref, field });
      }
    } catch {
      errors.push({ reason_code: "brain-manifest-reference-invalid", ref, field });
    }
  }
  return errors;
}
function technicalJson(path, label, issues) {
  if (!existsSync14(path)) return null;
  try {
    if (lstatSync10(path).isSymbolicLink()) throw new Error("symlink-not-allowed");
    return JSON.parse(readFileSync15(path, "utf8"));
  } catch (error) {
    issues.push({ reason_code: `${label}-invalid`, ref: label === "brain-manifest" ? ".cerebro/manifest.json" : null });
    return null;
  }
}
function safeInside(root, configured, fallback) {
  const brain = resolve14(root);
  const target = resolve14(root, configured || fallback);
  const rel = relative13(brain, target);
  if (!rel || rel.startsWith("..") || rel.startsWith(sep14)) return null;
  return target;
}
function technicalJsonFiles(root, directory2, issues, label) {
  if (!directory2 || !existsSync14(directory2)) return [];
  try {
    if (lstatSync10(directory2).isSymbolicLink()) throw new Error("symlink-not-allowed");
    return readdirSync9(directory2, { withFileTypes: true }).filter((entry) => entry.isFile() && entry.name.endsWith(".json")).map((entry) => join14(directory2, entry.name)).sort();
  } catch {
    issues.push({ reason_code: `${label}-directory-invalid`, ref: relative13(root, directory2).replaceAll("\\", "/") });
    return [];
  }
}
function readValidatedFiles(root, paths2, validate, label, issues) {
  return paths2.flatMap((path) => {
    const value = technicalJson(path, label, issues);
    if (!value) return [];
    const errors = validate(value);
    if (errors.length) {
      issues.push({ reason_code: `${label}-invalid`, ref: relative13(root, path).replaceAll("\\", "/") });
      return [];
    }
    return [{ value, ref: relative13(root, path).replaceAll("\\", "/") }];
  });
}
function layoutAssessment(root, issues) {
  const ref = ".cerebro/layout.json";
  const value = technicalJson(join14(root, ref), "layout", issues);
  if (!value || !object16(value)) return { valid: false, value: {}, ref };
  const refs4 = Object.entries(value).filter(([, configured]) => typeof configured === "string");
  const unsafe = refs4.filter(([, configured]) => !safeInside(root, configured, configured));
  const hasSystemRef = typeof value.systemContracts === "string" || typeof value.systemContract === "string";
  const valid = Number.isInteger(value.version) && value.version >= 1 && typeof value.sourceContracts === "string" && hasSystemRef && typeof value.runLedger === "string" && unsafe.length === 0;
  if (!valid) issues.push({ reason_code: "layout-incompatible", ref });
  return { valid, value, ref };
}
function systemPaths(root, layout2, issues) {
  const found = /* @__PURE__ */ new Set();
  const directory2 = safeInside(root, layout2.systemContracts, ".cerebro/contracts/systems");
  for (const path of technicalJsonFiles(root, directory2, issues, "system-contract")) found.add(path);
  if (typeof layout2.systemContract === "string") {
    const configured = safeInside(root, layout2.systemContract, layout2.systemContract);
    if (configured && existsSync14(configured)) found.add(configured);
  }
  const systemsRoot = join14(root, "sistemas");
  if (existsSync14(systemsRoot) && !lstatSync10(systemsRoot).isSymbolicLink()) {
    for (const entry of readdirSync9(systemsRoot, { withFileTypes: true })) {
      if (!entry.isDirectory()) continue;
      const path = join14(systemsRoot, entry.name, "contract.json");
      if (existsSync14(path)) found.add(path);
    }
  }
  const activation = join14(root, "operacao", "arquitetura", "primeiro-sistema.json");
  if (existsSync14(activation)) found.add(activation);
  return [...found].sort();
}
function latestSystems(items) {
  const latest = /* @__PURE__ */ new Map();
  for (const item of items) {
    const current = latest.get(item.value.system_id);
    if (!current || String(current.value.version).localeCompare(String(item.value.version), void 0, { numeric: true }) < 0) {
      latest.set(item.value.system_id, item);
    }
  }
  return [...latest.values()].sort((left, right) => left.value.system_id.localeCompare(right.value.system_id));
}
function readRunRecords(root, layout2, issues) {
  const configured = safeInside(root, layout2.runLedger, ".cerebro/ledger/runs.jsonl");
  if (!configured || !existsSync14(configured)) return [];
  try {
    if (lstatSync10(configured).isSymbolicLink()) throw new Error("symlink-not-allowed");
    const latest = /* @__PURE__ */ new Map();
    for (const [index, line] of readFileSync15(configured, "utf8").split("\n").filter(Boolean).entries()) {
      let record2;
      try {
        record2 = JSON.parse(line);
      } catch {
        throw new Error(`line-${index + 1}`);
      }
      const errors = validateRunRecord(record2);
      if (errors.length) throw new Error(`line-${index + 1}`);
      latest.set(record2.run_id, record2);
    }
    return [...latest.values()];
  } catch {
    issues.push({ reason_code: "run-ledger-invalid", ref: relative13(root, configured).replaceAll("\\", "/") });
    return [];
  }
}
function check(id3, label, status, reasonCode, evidenceRefs = []) {
  return {
    id: id3,
    label,
    status,
    reason_code: reasonCode,
    evidence_refs: [...new Set(evidenceRefs.filter(Boolean))]
  };
}
function systemReadiness(systems, sourceIds) {
  const ready = [];
  const blocked = [];
  for (const { value: system } of systems) {
    const blockers = [];
    const migrationStage = system.extensions?.migration_stage || (system.status === "active" ? "active" : system.status === "proposed" ? "mapped" : "configured");
    if (migrationStage !== "active") blockers.push(`system-not-active:${migrationStage}`);
    if (system.protocol_version !== 2) blockers.push("retrieval-not-declared");
    for (const source of system.sources.filter((item2) => item2.required)) {
      if (!source.source_id) blockers.push(`source-role-unbound:${source.role}`);
      else if (!sourceIds.has(source.source_id)) blockers.push(`source-contract-missing:${source.source_id}`);
    }
    const item = { system_id: system.system_id, blockers };
    if (blockers.length) blocked.push(item);
    else ready.push({ system_id: system.system_id });
  }
  return { ready, blocked };
}
function recommendations(classification, checks) {
  const preserve = checks.flatMap((item) => item.status === "met" ? item.evidence_refs : []);
  const adapt = checks.filter((item) => item.status === "partial").map((item) => item.reason_code);
  const add = checks.filter((item) => item.status === "missing").map((item) => item.reason_code);
  if (classification === "partial-brain" && !adapt.includes("canonical-manifest-missing")) {
    adapt.unshift("canonical-manifest-missing");
  }
  return {
    preserve: [...new Set(preserve)],
    adapt: [...new Set(adapt)],
    add: [...new Set(add)],
    do_not_touch: [
      "conte\xFAdo humano e Fontes can\xF4nicas",
      "outputs privados e credenciais",
      "hist\xF3rico Git ou estrutura existente sem preview e confirma\xE7\xE3o"
    ]
  };
}
function readBrainManifest(root) {
  const issues = [];
  const ref = ".cerebro/manifest.json";
  const brainRoot = resolve14(root);
  const value = technicalJson(join14(brainRoot, ref), "brain-manifest", issues);
  if (!value) return { status: existsSync14(join14(resolve14(root), ref)) ? "invalid" : "missing", ref, value: null, errors: issues };
  const schemaErrors2 = validateBrainManifest(value).map((reason) => ({ reason_code: "brain-manifest-invalid", ref, reason }));
  const referenceErrors = schemaErrors2.length ? [] : manifestReferenceErrors(brainRoot, value);
  const errors = [...schemaErrors2, ...referenceErrors];
  return { status: errors.length ? "invalid" : "valid", ref, value, errors };
}
function buildCompatibilityDiagnostic(root, { now = /* @__PURE__ */ new Date() } = {}) {
  const brainRoot = resolve14(root);
  const observedAt = new Date(now);
  if (!Number.isFinite(observedAt.getTime())) throw new Error("rel\xF3gio inv\xE1lido");
  const issues = [];
  const manifest = readBrainManifest(brainRoot);
  issues.push(...manifest.errors);
  const layout2 = layoutAssessment(brainRoot, issues);
  const legacyRef = ".cerebro/legacy-brain.json";
  const legacy = technicalJson(join14(brainRoot, legacyRef), "legacy-marker", issues);
  const legacyValid = legacy?.protocol === "company-brain" && legacy?.compatibility === "legacy-vault";
  const sourceDirectory = safeInside(brainRoot, layout2.value.sourceContracts, ".cerebro/contracts/sources");
  const sources = readValidatedFiles(
    brainRoot,
    technicalJsonFiles(brainRoot, sourceDirectory, issues, "source-contract"),
    validateSourceContract,
    "source-contract",
    issues
  );
  const systems = latestSystems(readValidatedFiles(
    brainRoot,
    systemPaths(brainRoot, layout2.value, issues),
    validateSystemContract,
    "system-contract",
    issues
  ));
  const runs = readRunRecords(brainRoot, layout2.value, issues);
  const routineDirectory = safeInside(brainRoot, layout2.value.routineContracts, ".cerebro/contracts/routines");
  const routines = readValidatedFiles(
    brainRoot,
    technicalJsonFiles(brainRoot, routineDirectory, issues, "routine-contract"),
    validateRoutineContract,
    "routine-contract",
    issues
  );
  const grantDirectory = safeInside(brainRoot, layout2.value.accessGrants, ".cerebro/contracts/access-grants");
  const grants = readValidatedFiles(
    brainRoot,
    technicalJsonFiles(brainRoot, grantDirectory, issues, "access-grant"),
    validateAccessGrant,
    "access-grant",
    issues
  );
  const entrypoints = ["COMECE-AQUI.md", "START-HERE.md", "AGENTS.md", "CLAUDE.md", "_START.md"].filter((ref) => existsSync14(join14(brainRoot, ref)));
  const contextRef = typeof layout2.value.companyMap === "string" ? layout2.value.companyMap : null;
  const contextExists = contextRef && safeInside(brainRoot, contextRef, contextRef) ? existsSync14(safeInside(brainRoot, contextRef, contextRef)) : false;
  const hasOrganizedContext = contextExists || ["meu-negocio", "company", "knowledge", "conhecimento"].some((name) => existsSync14(join14(brainRoot, name)));
  const hasBrainTechnicalState = existsSync14(join14(brainRoot, ".cerebro")) || legacyValid || sources.length > 0 || systems.length > 0 || runs.length > 0;
  let classification = "new";
  if (manifest.status === "valid" && layout2.valid) classification = "inevita-compatible";
  else if (hasBrainTechnicalState) classification = "partial-brain";
  else if (hasOrganizedContext || entrypoints.length > 0) classification = "organized-context";
  const retrievalCount = systems.filter((item) => item.value.protocol_version === 2).length;
  const contextRunCount = runs.filter((record2) => record2.protocol_version === 2).length;
  const manifestEvidence = manifest.status === "valid" ? [manifest.ref] : legacyValid ? [legacyRef] : [];
  const sourceRefs = sources.map((item) => item.ref);
  const systemRefs = systems.map((item) => item.ref);
  const ledgerRef = runs.length > 0 ? relative13(brainRoot, safeInside(brainRoot, layout2.value.runLedger, ".cerebro/ledger/runs.jsonl")).replaceAll("\\", "/") : null;
  const checks = [
    check(
      "manifest",
      "Brain Manifest V1",
      manifest.status === "valid" ? "met" : legacyValid ? "partial" : "missing",
      manifest.status === "valid" ? "canonical-manifest-valid" : legacyValid ? "legacy-marker-only" : "canonical-manifest-missing",
      manifestEvidence
    ),
    check(
      "layout",
      "Layout can\xF4nico",
      layout2.valid ? "met" : layout2.value && Object.keys(layout2.value).length ? "partial" : "missing",
      layout2.valid ? "layout-compatible" : "layout-incompatible",
      layout2.value && Object.keys(layout2.value).length ? [layout2.ref] : []
    ),
    check(
      "privacy",
      "Fronteira local",
      manifest.status === "valid" ? "met" : legacyValid ? "partial" : "missing",
      manifest.status === "valid" ? "local-privacy-declared" : legacyValid ? "legacy-privacy-boundary" : "privacy-profile-missing",
      manifestEvidence
    ),
    check(
      "context",
      "Mapa de contexto",
      contextExists ? "met" : hasOrganizedContext || entrypoints.length ? "partial" : "missing",
      contextExists ? "company-map-present" : hasOrganizedContext || entrypoints.length ? "organized-context-without-canonical-map" : "company-context-missing",
      contextExists ? [contextRef] : entrypoints
    ),
    check(
      "sources",
      "Contratos de Fonte",
      sources.length ? "met" : "missing",
      sources.length ? "source-contracts-valid" : "source-contracts-missing",
      sourceRefs
    ),
    check(
      "systems",
      "Contratos de Sistema",
      systems.length ? "met" : "missing",
      systems.length ? "system-contracts-valid" : "system-contracts-missing",
      systemRefs
    ),
    check(
      "retrieval",
      "Recupera\xE7\xE3o declarada",
      systems.length && retrievalCount === systems.length ? "met" : retrievalCount ? "partial" : "missing",
      systems.length && retrievalCount === systems.length ? "retrieval-v2-complete" : retrievalCount ? "retrieval-v2-partial" : "retrieval-v2-missing",
      systemRefs
    ),
    check(
      "runs",
      "Execu\xE7\xE3o observada",
      runs.length ? "met" : "missing",
      runs.length ? "run-records-valid" : "run-records-missing",
      ledgerRef ? [ledgerRef] : []
    ),
    check(
      "context-receipts",
      "Recibo exato de contexto",
      runs.length && contextRunCount === runs.length ? "met" : contextRunCount ? "partial" : "missing",
      runs.length && contextRunCount === runs.length ? "context-snapshots-complete" : contextRunCount ? "context-snapshots-partial" : "context-snapshots-missing",
      ledgerRef ? [ledgerRef] : []
    )
  ];
  const met = checks.filter((item) => item.status === "met").length;
  const stage = runs.length ? "operational" : sources.length || systems.length ? "contracted" : "foundation";
  const sourceIds = new Set(sources.map((item) => item.value.source_id));
  return {
    protocol_version: 1,
    generated_at: observedAt.toISOString(),
    target: {
      classification,
      activation_stage: stage,
      recognized_as: manifest.status === "valid" ? "manifest-v1" : legacyValid ? "legacy-vault" : "unrecognized"
    },
    manifest: {
      status: manifest.status,
      ref: manifest.ref,
      profile: manifest.status === "valid" ? manifest.value.profile : null,
      version: manifest.status === "valid" ? manifest.value.manifest_version : null,
      identity_status: manifest.status === "valid" && existsSync14(join14(brainRoot, manifest.value.identity_ref)) ? "assigned" : "unassigned",
      runtime_mode: manifest.status === "valid" ? manifest.value.runtime.mode : null
    },
    score: { percent: Math.round(met / checks.length * 100), met, applicable: checks.length },
    checks,
    inventory: {
      sources: { valid: sources.length },
      systems: { valid: systems.length, retrieval_v2: retrievalCount },
      runs: { valid: runs.length, context_snapshot_v2: contextRunCount },
      routines: { valid: routines.length },
      access_grants: { valid: grants.length }
    },
    system_readiness: systemReadiness(systems, sourceIds),
    recommendations: recommendations(classification, checks),
    issues,
    guarantees: {
      read_only: true,
      content_files_opened: false,
      source_connected: false,
      migration_performed: false,
      duplicate_brain_created: false
    }
  };
}

// ../scripts/lib/system-taxonomy.mjs
var OPERATING_AREA_DEFINITIONS = [
  { id: "commercial", label: "Comercial" },
  { id: "operations-technology", label: "Opera\xE7\xF5es & Tecnologia" },
  { id: "product-community", label: "Produto & Comunidade" }
];
var BUSINESS_FUNCTION_DEFINITIONS = [
  { id: "sales", label: "Vendas" },
  { id: "marketing", label: "Marketing" },
  { id: "product", label: "Produto" },
  { id: "operations", label: "Opera\xE7\xF5es" },
  { id: "community", label: "Comunidade" },
  { id: "data-technology", label: "Dados & Tecnologia" }
];
var LEGACY_OPERATING_AREAS = /* @__PURE__ */ new Map([
  ["crescimento", "commercial"],
  ["fundacao", "operations-technology"],
  ["produto-comunidade", "product-community"]
]);
var OPERATING_AREA_LABELS = new Map(OPERATING_AREA_DEFINITIONS.map((item) => [item.id, item.label]));
var BUSINESS_FUNCTION_LABELS = new Map(BUSINESS_FUNCTION_DEFINITIONS.map((item) => [item.id, item.label]));
function readable(value) {
  return String(value || "geral").replaceAll("-", " ").replace(/^./, (letter) => letter.toUpperCase());
}
function normalizeOperatingArea(value) {
  const ref = String(value || "general");
  return LEGACY_OPERATING_AREAS.get(ref) || ref;
}
function normalizeBusinessFunction(value) {
  const ref = String(value || "unclassified");
  return BUSINESS_FUNCTION_LABELS.has(ref) ? ref : "unclassified";
}
function operatingAreaLabel(value) {
  const ref = normalizeOperatingArea(value);
  return OPERATING_AREA_LABELS.get(ref) || readable(ref);
}
function systemClassification(extensions = {}) {
  return {
    operating_area: normalizeOperatingArea(extensions.operating_area || extensions.area_ref),
    business_function: normalizeBusinessFunction(extensions.business_function)
  };
}
function systemTaxonomy() {
  return {
    operating_areas: OPERATING_AREA_DEFINITIONS.map((item) => ({ ...item })),
    business_functions: BUSINESS_FUNCTION_DEFINITIONS.map((item) => ({ ...item }))
  };
}

// ../scripts/lib/system-runtime-binding.mjs
import { existsSync as existsSync15, lstatSync as lstatSync11, mkdirSync as mkdirSync8, readFileSync as readFileSync16, readdirSync as readdirSync10 } from "node:fs";
import { join as join15, relative as relative14, resolve as resolve15, sep as sep15 } from "node:path";
var ID_RE4 = /^[a-z0-9][a-z0-9-]{0,63}$/;
var REF_RE4 = /^[A-Za-z0-9][A-Za-z0-9_-]{0,127}$/;
var LOCAL_REF_RE8 = /^(?!\.?\.?$)(?!\.?\.?\/)(?!.*\/\.\.(?:\/|$))[A-Za-z0-9.][A-Za-z0-9_./:-]{0,255}$/;
var LOCAL_HTTP_HOSTS = /* @__PURE__ */ new Set(["localhost", "127.0.0.1", "[::1]"]);
function object17(value) {
  return value !== null && typeof value === "object" && !Array.isArray(value);
}
function closed7(errors, value, path, allowed) {
  if (!object17(value)) {
    errors.push(`${path} precisa ser objeto`);
    return;
  }
  const keys = new Set(allowed);
  for (const key2 of Object.keys(value)) if (!keys.has(key2)) errors.push(`${path}.${key2} n\xE3o \xE9 permitido`);
}
function validInterfaceUrl(value) {
  try {
    const url = new URL(value);
    const localHttp = url.protocol === "http:" && LOCAL_HTTP_HOSTS.has(url.hostname.toLowerCase());
    return (url.protocol === "https:" || localHttp) && !url.username && !url.password && !url.search && !url.hash;
  } catch {
    return false;
  }
}
function validateSystemRuntimeBinding(value) {
  const errors = [];
  closed7(errors, value, "system_runtime_binding", [
    "protocol_version",
    "binding_id",
    "system_ref",
    "kind",
    "host_ref",
    "workspace_ref",
    "workspace_path",
    "interface",
    "status",
    "observed_at",
    "privacy"
  ]);
  if (!object17(value)) return errors;
  if (value.protocol_version !== 1) errors.push("protocol_version precisa ser 1");
  if (!REF_RE4.test(value.binding_id || "")) errors.push("binding_id inv\xE1lido");
  if (!ID_RE4.test(value.system_ref || "")) errors.push("system_ref inv\xE1lido");
  if (value.kind !== "local-system") errors.push("kind precisa ser local-system");
  if (!REF_RE4.test(value.host_ref || "")) errors.push("host_ref inv\xE1lido");
  if (!REF_RE4.test(value.workspace_ref || "")) errors.push("workspace_ref inv\xE1lido");
  if (value.workspace_path !== "." && !LOCAL_REF_RE8.test(value.workspace_path || "")) errors.push("workspace_path inv\xE1lido");
  closed7(errors, value.interface, "interface", ["role", "kind", "url", "launch_mode", "healthcheck"]);
  if (object17(value.interface)) {
    if (!ID_RE4.test(value.interface.role || "")) errors.push("interface.role inv\xE1lido");
    if (value.interface.kind !== "web-ui") errors.push("interface.kind precisa ser web-ui");
    if (!validInterfaceUrl(value.interface.url)) errors.push("interface.url precisa ser HTTPS ou HTTP local sem segredo");
    if (value.interface.launch_mode !== "external-browser") errors.push("interface.launch_mode precisa ser external-browser");
    closed7(errors, value.interface.healthcheck, "interface.healthcheck", ["method", "timeout_ms"]);
    if (object17(value.interface.healthcheck)) {
      if (value.interface.healthcheck.method !== "HEAD") errors.push("interface.healthcheck.method precisa ser HEAD");
      const timeout = value.interface.healthcheck.timeout_ms;
      if (!Number.isInteger(timeout) || timeout < 100 || timeout > 2e3) {
        errors.push("interface.healthcheck.timeout_ms precisa estar entre 100 e 2000");
      }
    }
  }
  if (!["installed", "missing", "degraded"].includes(value.status)) errors.push("status inv\xE1lido");
  if (!Number.isFinite(Date.parse(value.observed_at || ""))) errors.push("observed_at inv\xE1lido");
  closed7(errors, value.privacy, "privacy", privacyKeys("credential_stored"));
  if (object17(value.privacy)) {
    if (value.privacy.credential_stored !== false) errors.push("privacy.credential_stored precisa ser false");
    disclosureErrors(errors, value.privacy, "privacy");
  }
  return errors;
}
function systemRuntimeBindingDirectory(root) {
  const brain = resolve15(root);
  const directory2 = resolve15(root, layout(root).systemRuntimeBindings || ".cerebro/runtime/system-bindings");
  const rel = relative14(brain, directory2);
  if (!rel || rel.startsWith("..") || rel.startsWith(sep15)) throw new Error("systemRuntimeBindings aponta para fora do C\xE9rebro");
  return directory2;
}
function listSystemRuntimeBindings(root, issues = []) {
  const directory2 = systemRuntimeBindingDirectory(root);
  if (!existsSync15(directory2)) return [];
  const bindings = [];
  for (const name of readdirSync10(directory2).filter((item) => item.endsWith(".json")).sort()) {
    const path = join15(directory2, name);
    try {
      if (!lstatSync11(path).isFile()) throw new Error("not-file");
      const binding = JSON.parse(readFileSync16(path, "utf8"));
      const errors = validateSystemRuntimeBinding(binding);
      if (errors.length) throw new Error(errors.join(" \xB7 "));
      bindings.push({ binding, path });
    } catch {
      issues.push({ reason_code: "system-runtime-binding-invalid", ref: relative14(root, path).replaceAll("\\", "/") });
    }
  }
  return bindings;
}
function indexSystemRuntimeBindings(root, issues = []) {
  const bySystem = /* @__PURE__ */ new Map();
  const ambiguous = /* @__PURE__ */ new Set();
  for (const entry of listSystemRuntimeBindings(root, issues)) {
    const systemRef = entry.binding.system_ref;
    if (bySystem.has(systemRef)) {
      ambiguous.add(systemRef);
      bySystem.set(systemRef, { binding: null, path: null, ambiguous: true });
      issues.push({ reason_code: "system-runtime-binding-ambiguous", ref: systemRef });
      continue;
    }
    if (!ambiguous.has(systemRef)) bySystem.set(systemRef, entry);
  }
  return bySystem;
}

// ../scripts/lib/experience-manifest.mjs
import { existsSync as existsSync16, lstatSync as lstatSync12, readFileSync as readFileSync17, readdirSync as readdirSync11 } from "node:fs";
import { join as join16, relative as relative15, resolve as resolve16, sep as sep16 } from "node:path";
var ID_RE5 = /^[a-z0-9][a-z0-9-]{0,63}$/;
var MARK_RE = /^[A-Za-z0-9&+]{1,3}$/;
var ACCENT_RE = /^#[0-9A-Fa-f]{6}$/;
function object18(value) {
  return value !== null && typeof value === "object" && !Array.isArray(value);
}
function closed8(errors, value, path, allowed) {
  if (!object18(value)) {
    errors.push(`${path} precisa ser objeto`);
    return;
  }
  const keys = new Set(allowed);
  for (const key2 of Object.keys(value)) if (!keys.has(key2)) errors.push(`${path}.${key2} n\xE3o \xE9 permitido`);
}
function boundedString(errors, value, path, max) {
  if (typeof value !== "string" || value.trim() !== value || !value || value.length > max) {
    errors.push(`${path} precisa ser texto entre 1 e ${max} caracteres, sem espa\xE7o nas bordas`);
  }
}
function validateExperienceManifest(value) {
  const errors = [];
  closed8(errors, value, "experience_manifest", [
    "protocol_version",
    "experience_id",
    "system_ref",
    "publisher",
    "presentation",
    "surfaces"
  ]);
  if (!object18(value)) return errors;
  if (value.protocol_version !== 1) errors.push("protocol_version precisa ser 1");
  if (!ID_RE5.test(value.experience_id || "")) errors.push("experience_id inv\xE1lido");
  if (!ID_RE5.test(value.system_ref || "")) errors.push("system_ref inv\xE1lido");
  closed8(errors, value.publisher, "publisher", ["publisher_id", "display_name", "kind"]);
  if (object18(value.publisher)) {
    if (!ID_RE5.test(value.publisher.publisher_id || "")) errors.push("publisher.publisher_id inv\xE1lido");
    boundedString(errors, value.publisher.display_name, "publisher.display_name", 80);
    if (!["organization", "person"].includes(value.publisher.kind)) errors.push("publisher.kind inv\xE1lido");
  }
  closed8(errors, value.presentation, "presentation", ["tagline", "mark"]);
  if (object18(value.presentation)) {
    boundedString(errors, value.presentation.tagline, "presentation.tagline", 120);
    closed8(errors, value.presentation.mark, "presentation.mark", ["kind", "text", "accent"]);
    if (object18(value.presentation.mark)) {
      if (value.presentation.mark.kind !== "monogram") errors.push("presentation.mark.kind precisa ser monogram");
      if (!MARK_RE.test(value.presentation.mark.text || "")) errors.push("presentation.mark.text inv\xE1lido");
      if (!ACCENT_RE.test(value.presentation.mark.accent || "")) errors.push("presentation.mark.accent inv\xE1lido");
    }
  }
  if (!Array.isArray(value.surfaces) || value.surfaces.length < 1 || value.surfaces.length > 8) {
    errors.push("surfaces precisa ter entre 1 e 8 itens");
  } else {
    const ids = /* @__PURE__ */ new Set();
    for (const [index, surface] of value.surfaces.entries()) {
      const path = `surfaces[${index}]`;
      closed8(errors, surface, path, ["surface_id", "role", "kind", "launch_label"]);
      if (!object18(surface)) continue;
      if (!ID_RE5.test(surface.surface_id || "")) errors.push(`${path}.surface_id inv\xE1lido`);
      if (ids.has(surface.surface_id)) errors.push(`${path}.surface_id duplicado`);
      ids.add(surface.surface_id);
      if (!ID_RE5.test(surface.role || "")) errors.push(`${path}.role inv\xE1lido`);
      if (surface.kind !== "external-application") errors.push(`${path}.kind precisa ser external-application`);
      boundedString(errors, surface.launch_label, `${path}.launch_label`, 40);
    }
  }
  return errors;
}
function experienceManifestDirectory(root) {
  const brain = resolve16(root);
  const directory2 = resolve16(root, layout(root).experienceManifests || ".cerebro/contracts/experiences");
  const rel = relative15(brain, directory2);
  if (!rel || rel.startsWith("..") || rel.startsWith(sep16)) throw new Error("experienceManifests aponta para fora do C\xE9rebro");
  return directory2;
}
function packagedManifests(root) {
  const systemsRoot = join16(root, "sistemas");
  if (!existsSync16(systemsRoot)) return [];
  return readdirSync11(systemsRoot, { withFileTypes: true }).filter((entry) => entry.isDirectory()).map((entry) => join16(systemsRoot, entry.name, "experience.json")).filter(existsSync16).map((path) => ({ path, source: "published-package", priority: 0 }));
}
function installedManifests(root) {
  const directory2 = experienceManifestDirectory(root);
  if (!existsSync16(directory2)) return [];
  return readdirSync11(directory2).filter((name) => name.endsWith(".json")).sort().map((name) => ({ path: join16(directory2, name), source: "installed", priority: 1 }));
}
function listExperienceManifests(root, issues = []) {
  const manifests = [];
  for (const entry of [...packagedManifests(root), ...installedManifests(root)]) {
    try {
      if (!lstatSync12(entry.path).isFile()) throw new Error("not-file");
      const manifest = JSON.parse(readFileSync17(entry.path, "utf8"));
      const errors = validateExperienceManifest(manifest);
      if (errors.length) throw new Error(errors.join(" \xB7 "));
      manifests.push({
        manifest,
        path: entry.path,
        manifest_ref: relative15(root, entry.path).replaceAll("\\", "/"),
        source: entry.source,
        priority: entry.priority
      });
    } catch {
      issues.push({ reason_code: "experience-manifest-invalid", ref: relative15(root, entry.path).replaceAll("\\", "/") });
    }
  }
  return manifests;
}
function indexExperienceManifests(root, issues = []) {
  const bySystem = /* @__PURE__ */ new Map();
  for (const entry of listExperienceManifests(root, issues)) {
    const ref = entry.manifest.system_ref;
    const current = bySystem.get(ref);
    if (!current || entry.priority > current.priority) {
      bySystem.set(ref, entry);
      continue;
    }
    if (entry.priority === current.priority) {
      bySystem.delete(ref);
      issues.push({ reason_code: "experience-manifest-ambiguous", ref });
    }
  }
  return bySystem;
}
function experienceManifestView(entry, interfaceRole = null) {
  if (!entry) return null;
  const manifest = entry.manifest;
  const primarySurface = manifest.surfaces.find((surface) => surface.role === interfaceRole) || manifest.surfaces.find((surface) => surface.surface_id === "primary") || manifest.surfaces[0];
  return {
    protocol_version: manifest.protocol_version,
    experience_id: manifest.experience_id,
    manifest_ref: entry.manifest_ref,
    source: entry.source,
    publisher: manifest.publisher,
    presentation: manifest.presentation,
    primary_surface: primarySurface
  };
}

// ../scripts/lib/skill-read-model.mjs
import { existsSync as existsSync17, readFileSync as readFileSync18, readdirSync as readdirSync12 } from "node:fs";
import { dirname as dirname5, join as join17, relative as relative16, resolve as resolve17, sep as sep17 } from "node:path";
import { fileURLToPath } from "node:url";
var DEFAULT_ENGINE_ROOT = resolve17(dirname5(fileURLToPath(import.meta.url)), "..", "..");
var SKILL_ID_RE = /^[a-z0-9][a-z0-9-]{0,95}$/;
function skillDirectories(root, packageRoot) {
  const directory2 = join17(root, packageRoot, "skills");
  if (!existsSync17(directory2)) return [];
  return readdirSync12(directory2, { withFileTypes: true }).filter((entry) => entry.isDirectory() && SKILL_ID_RE.test(entry.name) && existsSync17(join17(directory2, entry.name, "SKILL.md"))).map((entry) => entry.name).sort();
}
function countInstalledSkills(root) {
  const brainRoot = resolve17(root);
  return (/* @__PURE__ */ new Set([
    ...skillDirectories(brainRoot, ".claude"),
    ...skillDirectories(brainRoot, ".agents")
  ])).size;
}

// ../scripts/lib/workflow-definition.mjs
import { createHash as createHash6 } from "node:crypto";
import {
  closeSync as closeSync4,
  constants,
  existsSync as existsSync18,
  fstatSync,
  lstatSync as lstatSync13,
  mkdirSync as mkdirSync9,
  openSync as openSync4,
  readSync,
  readdirSync as readdirSync13,
  renameSync as renameSync3,
  writeFileSync as writeFileSync5
} from "node:fs";
import { dirname as dirname6, isAbsolute as isAbsolute5, relative as relative17, resolve as resolve18, sep as sep18 } from "node:path";
var TOKEN_RE = /^[a-z0-9][a-z0-9_-]{0,127}$/;
var VERSION_RE3 = /^[A-Za-z0-9][A-Za-z0-9._-]{0,63}$/;
var SHA256_RE2 = /^[a-f0-9]{64}$/;
var COMMIT_RE = /^[a-f0-9]{40}$/;
var REPO_RE = /^[A-Za-z0-9][A-Za-z0-9._/-]{0,255}$/;
var SOURCE_PATH_RE = /^(?!\/)(?!.*(?:^|\/)\.\.(?:\/|$))[A-Za-z0-9._/-]{1,512}$/;
var FIELD_PATH_RE = /^[A-Za-z0-9_.-]{1,128}$/;
var WORKFLOW_SCHEMAS = /* @__PURE__ */ new Set(["society-meeting-workflow-v1"]);
var MAX_DEFINITION_BYTES = 512 * 1024;
var MAX_STEPS = 128;
var MAX_ITEMS = 128;
var MAX_TEXT = 4096;
var WORKFLOW_IMPORT_BASE = ".cerebro/workflows/imports";
function object19(value) {
  return value !== null && typeof value === "object" && !Array.isArray(value);
}
function closed9(errors, value, path, keys) {
  if (!object19(value)) return;
  const allowed = new Set(keys);
  for (const key2 of Object.keys(value)) {
    if (!allowed.has(key2)) errors.push(`${path}.${key2} n\xE3o \xE9 permitido`);
  }
}
function text2(errors, value, path, { max = MAX_TEXT } = {}) {
  if (typeof value !== "string" || !value.trim() || value.length > max) {
    errors.push(`${path} precisa ser texto n\xE3o vazio com at\xE9 ${max} caracteres`);
  }
}
function token(errors, value, path) {
  if (typeof value !== "string" || !TOKEN_RE.test(value)) errors.push(`${path} inv\xE1lido`);
}
function list3(errors, value, path, { min = 0, max = MAX_ITEMS } = {}) {
  if (!Array.isArray(value) || value.length < min || value.length > max) {
    errors.push(`${path} precisa ter entre ${min} e ${max} itens`);
    return [];
  }
  return value;
}
function unique3(errors, values, path) {
  if (new Set(values).size !== values.length) errors.push(`${path} n\xE3o pode repetir itens`);
}
function stringList2(errors, value, path, options = {}) {
  const values = list3(errors, value, path, options);
  for (const [index, item] of values.entries()) text2(errors, item, `${path}[${index}]`);
  unique3(errors, values, path);
  return values;
}
function canonicalWorkflow(value) {
  if (Array.isArray(value)) return `[${value.map(canonicalWorkflow).join(",")}]`;
  if (value && typeof value === "object") {
    return `{${Object.keys(value).sort().map((key2) => `${JSON.stringify(key2)}:${canonicalWorkflow(value[key2])}`).join(",")}}`;
  }
  return JSON.stringify(value);
}
function semanticWorkflowSha256(definition) {
  return createHash6("sha256").update(canonicalWorkflow(definition)).digest("hex");
}
function byteSha256(bytes) {
  return createHash6("sha256").update(bytes).digest("hex");
}
function validateTrigger(errors, trigger) {
  if (!object19(trigger)) {
    errors.push("workflow.trigger precisa ser objeto");
    return;
  }
  closed9(errors, trigger, "workflow.trigger", ["type", "source", "events"]);
  token(errors, trigger.type, "workflow.trigger.type");
  if (trigger.source !== void 0) token(errors, trigger.source, "workflow.trigger.source");
  if (trigger.events !== void 0) stringList2(errors, trigger.events, "workflow.trigger.events", { min: 1, max: 32 });
}
function validateExecutor(errors, executor) {
  if (executor === void 0) return;
  if (!object19(executor)) {
    errors.push("workflow.executor precisa ser objeto");
    return;
  }
  closed9(errors, executor, "workflow.executor", ["kind", "project", "service"]);
  token(errors, executor.kind, "workflow.executor.kind");
  if (executor.project !== void 0) text2(errors, executor.project, "workflow.executor.project", { max: 128 });
  if (executor.service !== void 0) text2(errors, executor.service, "workflow.executor.service", { max: 128 });
}
function validateSteps(errors, steps) {
  const values = list3(errors, steps, "workflow.steps", { min: 1, max: MAX_STEPS });
  const ids = [];
  for (const [index, step] of values.entries()) {
    const path = `workflow.steps[${index}]`;
    if (!object19(step)) {
      errors.push(`${path} precisa ser objeto`);
      continue;
    }
    closed9(errors, step, path, [
      "id",
      "title",
      "system",
      "mode",
      "implementation",
      "requires",
      "handoff",
      "optional"
    ]);
    token(errors, step.id, `${path}.id`);
    text2(errors, step.title, `${path}.title`, { max: 256 });
    token(errors, step.system, `${path}.system`);
    if (!["automatic", "assisted", "human", "manual"].includes(step.mode)) errors.push(`${path}.mode inv\xE1lido`);
    if (!["executor", "human"].includes(step.implementation)) errors.push(`${path}.implementation inv\xE1lido`);
    const requires = stringList2(errors, step.requires, `${path}.requires`, { max: MAX_STEPS });
    for (const required of requires) token(errors, required, `${path}.requires[]`);
    if (step.handoff !== void 0) token(errors, step.handoff, `${path}.handoff`);
    if (step.optional !== void 0 && typeof step.optional !== "boolean") errors.push(`${path}.optional precisa ser booleano`);
    ids.push(step.id);
  }
  unique3(errors, ids, "workflow.steps.id");
  const known = new Set(ids);
  for (const [index, step] of values.entries()) {
    if (!object19(step) || !Array.isArray(step.requires)) continue;
    for (const dependency of step.requires) {
      if (!known.has(dependency)) errors.push(`workflow.steps[${index}].requires referencia etapa ausente: ${dependency}`);
      if (dependency === step.id) errors.push(`workflow.steps[${index}] n\xE3o pode depender de si mesma`);
    }
  }
  const visiting = /* @__PURE__ */ new Set();
  const visited = /* @__PURE__ */ new Set();
  const byId = new Map(values.filter(object19).map((step) => [step.id, step]));
  function visit(id3) {
    if (visited.has(id3) || !byId.has(id3)) return;
    if (visiting.has(id3)) {
      errors.push(`workflow.steps cont\xE9m ciclo em ${id3}`);
      return;
    }
    visiting.add(id3);
    for (const dependency of Array.isArray(byId.get(id3).requires) ? byId.get(id3).requires : []) visit(dependency);
    visiting.delete(id3);
    visited.add(id3);
  }
  for (const id3 of ids) visit(id3);
  return known;
}
function validateClosure(errors, closure, stepIds) {
  if (!object19(closure)) {
    errors.push("workflow.closure precisa ser objeto");
    return;
  }
  closed9(errors, closure, "workflow.closure", ["requires"]);
  const rules = list3(errors, closure.requires, "workflow.closure.requires", { min: 1, max: MAX_ITEMS });
  for (const [index, rule] of rules.entries()) {
    const path = `workflow.closure.requires[${index}]`;
    if (!object19(rule)) {
      errors.push(`${path} precisa ser objeto`);
      continue;
    }
    closed9(errors, rule, path, ["step", "field", "accept", "label"]);
    token(errors, rule.step, `${path}.step`);
    if (!stepIds.has(rule.step)) errors.push(`${path}.step referencia etapa ausente`);
    if (rule.field !== void 0 && !FIELD_PATH_RE.test(rule.field || "")) errors.push(`${path}.field inv\xE1lido`);
    stringList2(errors, rule.accept, `${path}.accept`, { min: 1, max: 32 });
    text2(errors, rule.label, `${path}.label`, { max: 256 });
  }
}
function validateHandoffs(errors, handoffs) {
  const values = list3(errors, handoffs, "workflow.handoffs", { max: MAX_ITEMS });
  const ids = [];
  for (const [index, handoff] of values.entries()) {
    const path = `workflow.handoffs[${index}]`;
    if (!object19(handoff)) {
      errors.push(`${path} precisa ser objeto`);
      continue;
    }
    closed9(errors, handoff, path, ["id", "artifact", "consumers"]);
    token(errors, handoff.id, `${path}.id`);
    text2(errors, handoff.artifact, `${path}.artifact`);
    const consumers = stringList2(errors, handoff.consumers, `${path}.consumers`, { min: 1, max: 64 });
    for (const consumer of consumers) token(errors, consumer, `${path}.consumers[]`);
    ids.push(handoff.id);
  }
  unique3(errors, ids, "workflow.handoffs.id");
  return new Set(ids);
}
function validateConsumers(errors, consumers) {
  const values = list3(errors, consumers, "workflow.consumers", { max: MAX_ITEMS });
  const ids = [];
  for (const [index, consumer] of values.entries()) {
    const path = `workflow.consumers[${index}]`;
    if (!object19(consumer)) {
      errors.push(`${path} precisa ser objeto`);
      continue;
    }
    closed9(errors, consumer, path, ["id", "title", "owner", "closure_condition"]);
    token(errors, consumer.id, `${path}.id`);
    text2(errors, consumer.title, `${path}.title`, { max: 256 });
    text2(errors, consumer.owner, `${path}.owner`, { max: 256 });
    if (typeof consumer.closure_condition !== "boolean") errors.push(`${path}.closure_condition precisa ser booleano`);
    ids.push(consumer.id);
  }
  unique3(errors, ids, "workflow.consumers.id");
  return new Set(ids);
}
function validateNotice(errors, notice) {
  if (notice === void 0) return;
  if (!object19(notice)) {
    errors.push("workflow.notice precisa ser objeto");
    return;
  }
  closed9(errors, notice, "workflow.notice", [
    "channel",
    "queue",
    "sender",
    "idempotency",
    "delivery",
    "delivery_gap",
    "closure_receipts",
    "summary",
    "on_failure",
    "resend"
  ]);
  token(errors, notice.channel, "workflow.notice.channel");
  text2(errors, notice.queue, "workflow.notice.queue", { max: 256 });
  for (const key2 of ["sender", "idempotency", "delivery", "delivery_gap", "on_failure", "resend"]) {
    text2(errors, notice[key2], `workflow.notice.${key2}`);
  }
  stringList2(errors, notice.closure_receipts, "workflow.notice.closure_receipts", { max: 32 });
  if (!object19(notice.summary)) errors.push("workflow.notice.summary precisa ser objeto");
  else {
    closed9(errors, notice.summary, "workflow.notice.summary", [
      "procedure",
      "automatic_generation",
      "requires_privacy_review",
      "on_failure"
    ]);
    text2(errors, notice.summary.procedure, "workflow.notice.summary.procedure", { max: 256 });
    if (typeof notice.summary.automatic_generation !== "boolean") errors.push("workflow.notice.summary.automatic_generation precisa ser booleano");
    if (typeof notice.summary.requires_privacy_review !== "boolean") errors.push("workflow.notice.summary.requires_privacy_review precisa ser booleano");
    text2(errors, notice.summary.on_failure, "workflow.notice.summary.on_failure", { max: 256 });
  }
}
function validateCompleteness(errors, completeness) {
  if (completeness === void 0) return;
  if (!object19(completeness)) {
    errors.push("workflow.completeness precisa ser objeto");
    return;
  }
  closed9(errors, completeness, "workflow.completeness", ["state", "open"]);
  token(errors, completeness.state, "workflow.completeness.state");
  stringList2(errors, completeness.open, "workflow.completeness.open", { max: 64 });
}
function validateSupersedes(errors, supersedes) {
  if (supersedes === void 0) return;
  const values = list3(errors, supersedes, "workflow.supersedes", { max: 64 });
  for (const [index, item] of values.entries()) {
    const path = `workflow.supersedes[${index}]`;
    if (!object19(item)) errors.push(`${path} precisa ser objeto`);
    else {
      closed9(errors, item, path, ["ref", "state"]);
      text2(errors, item.ref, `${path}.ref`);
      text2(errors, item.state, `${path}.state`);
    }
  }
}
function validateWorkflowDefinition(value) {
  const errors = [];
  if (!object19(value)) return ["workflow precisa ser objeto"];
  closed9(errors, value, "workflow", [
    "schema",
    "id",
    "version",
    "title",
    "owner_system",
    "result",
    "trigger",
    "executor",
    "steps",
    "legacy_receipts",
    "closure",
    "handoffs",
    "consumers",
    "notice",
    "completeness",
    "supersedes"
  ]);
  if (typeof value.schema !== "string" || !WORKFLOW_SCHEMAS.has(value.schema)) errors.push("workflow.schema n\xE3o reconhecido");
  token(errors, value.id, "workflow.id");
  if (typeof value.version !== "string" || !VERSION_RE3.test(value.version)) errors.push("workflow.version inv\xE1lida");
  text2(errors, value.title, "workflow.title", { max: 256 });
  token(errors, value.owner_system, "workflow.owner_system");
  text2(errors, value.result, "workflow.result");
  validateTrigger(errors, value.trigger);
  validateExecutor(errors, value.executor);
  const stepIds = validateSteps(errors, value.steps);
  if (value.legacy_receipts !== void 0) stringList2(errors, value.legacy_receipts, "workflow.legacy_receipts", { max: 64 });
  validateClosure(errors, value.closure, stepIds);
  const handoffIds = validateHandoffs(errors, value.handoffs);
  const consumerIds = validateConsumers(errors, value.consumers);
  for (const [index, step] of (Array.isArray(value.steps) ? value.steps : []).entries()) {
    if (step?.handoff && !handoffIds.has(step.handoff)) errors.push(`workflow.steps[${index}].handoff n\xE3o declarado`);
  }
  for (const [index, handoff] of (Array.isArray(value.handoffs) ? value.handoffs : []).entries()) {
    for (const consumer of Array.isArray(handoff?.consumers) ? handoff.consumers : []) {
      if (!consumerIds.has(consumer)) errors.push(`workflow.handoffs[${index}].consumers referencia consumidor ausente`);
    }
  }
  validateNotice(errors, value.notice);
  validateCompleteness(errors, value.completeness);
  validateSupersedes(errors, value.supersedes);
  return [...new Set(errors)];
}
function validateWorkflowImportManifest(value) {
  const errors = [];
  if (!object19(value)) return ["workflow import precisa ser objeto"];
  closed9(errors, value, "workflow_import", ["protocol_version", "definition_file", "workflow", "origin"]);
  if (value.protocol_version !== 1) errors.push("workflow_import.protocol_version precisa ser 1");
  if (value.definition_file !== "definition.json") errors.push("workflow_import.definition_file precisa ser definition.json");
  if (!object19(value.workflow)) errors.push("workflow_import.workflow precisa ser objeto");
  else {
    closed9(errors, value.workflow, "workflow_import.workflow", ["id", "version"]);
    token(errors, value.workflow.id, "workflow_import.workflow.id");
    if (!VERSION_RE3.test(value.workflow.version || "")) errors.push("workflow_import.workflow.version inv\xE1lida");
  }
  if (!object19(value.origin)) errors.push("workflow_import.origin precisa ser objeto");
  else {
    closed9(errors, value.origin, "workflow_import.origin", [
      "repo",
      "path",
      "commit",
      "imported_at",
      "byte_sha256",
      "semantic_sha256"
    ]);
    if (typeof value.origin.repo !== "string" || !REPO_RE.test(value.origin.repo)) errors.push("workflow_import.origin.repo inv\xE1lido");
    if (typeof value.origin.path !== "string" || !SOURCE_PATH_RE.test(value.origin.path)) errors.push("workflow_import.origin.path inv\xE1lido");
    if (typeof value.origin.commit !== "string" || !COMMIT_RE.test(value.origin.commit)) errors.push("workflow_import.origin.commit inv\xE1lido");
    if (typeof value.origin.imported_at !== "string" || !Number.isFinite(Date.parse(value.origin.imported_at))) errors.push("workflow_import.origin.imported_at inv\xE1lido");
    if (typeof value.origin.byte_sha256 !== "string" || !SHA256_RE2.test(value.origin.byte_sha256)) errors.push("workflow_import.origin.byte_sha256 inv\xE1lido");
    if (typeof value.origin.semantic_sha256 !== "string" || !SHA256_RE2.test(value.origin.semantic_sha256)) errors.push("workflow_import.origin.semantic_sha256 inv\xE1lido");
  }
  return [...new Set(errors)];
}
function relativeImportRef(id3, version, semantic, bytes) {
  return `${WORKFLOW_IMPORT_BASE}/${id3}/${version}/${semantic}/${bytes}/import.json`;
}
function assertWithin(base, target, label) {
  const rel = relative17(base, target);
  if (rel.startsWith("..") || isAbsolute5(rel)) throw new Error(`${label} precisa ficar dentro de ${WORKFLOW_IMPORT_BASE}`);
}
function assertNoSymlink(root, target, { allowMissing = false } = {}) {
  const rootPath = resolve18(root);
  const base = resolve18(rootPath, WORKFLOW_IMPORT_BASE);
  assertWithin(resolve18(rootPath, ".cerebro"), base, "raiz de imports");
  assertWithin(base, target, "artefato");
  let current = rootPath;
  if (existsSync18(current) && lstatSync13(current).isSymbolicLink()) throw new Error("workflow_import_symlink");
  const parts = relative17(rootPath, target).split(sep18);
  for (const part of parts) {
    current = resolve18(current, part);
    if (!existsSync18(current)) {
      if (allowMissing) continue;
      throw new Error("workflow_import_missing");
    }
    if (lstatSync13(current).isSymbolicLink()) throw new Error("workflow_import_symlink");
  }
}
function parseDefinition(bytes) {
  if (!Buffer.isBuffer(bytes) || bytes.length === 0 || bytes.length > MAX_DEFINITION_BYTES) {
    throw new Error(`workflow_definition_size_invalid:${bytes?.length ?? 0}`);
  }
  let definition;
  try {
    definition = JSON.parse(new TextDecoder("utf-8", { fatal: true }).decode(bytes));
  } catch {
    throw new Error("workflow_definition_json_or_utf8_invalid");
  }
  const errors = validateWorkflowDefinition(definition);
  if (errors.length) throw new Error(`workflow_definition_invalid:${errors.join(" \xB7 ")}`);
  return definition;
}
function readRegularFile(path, { maxBytes, missingCode = "workflow_import_missing" } = {}) {
  if (!existsSync18(path)) throw new Error(missingCode);
  if (lstatSync13(path).isSymbolicLink()) throw new Error("workflow_import_symlink");
  const limit = Number.isFinite(maxBytes) ? maxBytes : MAX_DEFINITION_BYTES;
  let descriptor;
  try {
    descriptor = openSync4(
      path,
      constants.O_RDONLY | (constants.O_NOFOLLOW || 0) | (constants.O_NONBLOCK || 0)
    );
    const info = fstatSync(descriptor);
    if (!info.isFile()) throw new Error("workflow_import_not_regular_file");
    if (Number.isFinite(maxBytes) && info.size > maxBytes) {
      throw new Error("workflow_import_file_too_large");
    }
    const output = Buffer.alloc(limit + 1);
    let offset = 0;
    while (offset < output.length) {
      const count = readSync(descriptor, output, offset, output.length - offset, null);
      if (count === 0) break;
      offset += count;
    }
    if (offset > limit) throw new Error("workflow_import_file_too_large");
    return output.subarray(0, offset);
  } catch (error) {
    if (error?.code === "ENOENT") throw new Error(missingCode);
    if (error?.code === "ELOOP") throw new Error("workflow_import_symlink");
    if (["EAGAIN", "EWOULDBLOCK", "ENODEV", "ENOTSUP", "ENXIO", "EOPNOTSUPP"].includes(error?.code)) {
      throw new Error("workflow_import_not_regular_file");
    }
    if (typeof error?.code === "string") throw new Error("workflow_import_not_regular_file");
    throw error;
  } finally {
    if (descriptor !== void 0) closeSync4(descriptor);
  }
}
function expectedImportRef(pointer) {
  return relativeImportRef(pointer.id, pointer.version, pointer.semantic_sha256, pointer.byte_sha256);
}
function validateWorkflowPointer(pointer) {
  const errors = [];
  if (!object19(pointer)) return ["extensions.workflow precisa ser objeto"];
  closed9(errors, pointer, "extensions.workflow", [
    "schema_version",
    "import_ref",
    "id",
    "version",
    "semantic_sha256",
    "byte_sha256",
    "manifest_sha256"
  ]);
  if (pointer.schema_version !== 1) errors.push("extensions.workflow.schema_version precisa ser 1");
  token(errors, pointer.id, "extensions.workflow.id");
  if (typeof pointer.version !== "string" || !VERSION_RE3.test(pointer.version)) errors.push("extensions.workflow.version inv\xE1lida");
  if (typeof pointer.semantic_sha256 !== "string" || !SHA256_RE2.test(pointer.semantic_sha256)) errors.push("extensions.workflow.semantic_sha256 inv\xE1lido");
  if (typeof pointer.byte_sha256 !== "string" || !SHA256_RE2.test(pointer.byte_sha256)) errors.push("extensions.workflow.byte_sha256 inv\xE1lido");
  if (typeof pointer.manifest_sha256 !== "string" || !SHA256_RE2.test(pointer.manifest_sha256)) errors.push("extensions.workflow.manifest_sha256 inv\xE1lido");
  if (errors.length === 0 && pointer.import_ref !== expectedImportRef(pointer)) {
    errors.push("extensions.workflow.import_ref n\xE3o corresponde \xE0 identidade e aos hashes declarados");
  }
  return errors;
}
function loadWorkflowImport(root, importRef) {
  if (typeof importRef !== "string" || !importRef.startsWith(`${WORKFLOW_IMPORT_BASE}/`) || !importRef.endsWith("/import.json")) {
    throw new Error("workflow_import_ref_invalid");
  }
  const manifestPath = resolve18(root, importRef);
  assertNoSymlink(root, manifestPath);
  const manifestBytes = readRegularFile(manifestPath, { maxBytes: 64 * 1024 });
  let manifest;
  try {
    manifest = JSON.parse(manifestBytes.toString("utf8"));
  } catch {
    throw new Error("workflow_import_manifest_json_invalid");
  }
  const manifestErrors = validateWorkflowImportManifest(manifest);
  if (manifestErrors.length) throw new Error(`workflow_import_manifest_invalid:${manifestErrors.join(" \xB7 ")}`);
  const expectedRef = relativeImportRef(
    manifest.workflow.id,
    manifest.workflow.version,
    manifest.origin.semantic_sha256,
    manifest.origin.byte_sha256
  );
  if (importRef !== expectedRef) throw new Error("workflow_import_address_mismatch");
  const definitionPath = resolve18(dirname6(manifestPath), manifest.definition_file);
  assertNoSymlink(root, definitionPath);
  const bytes = readRegularFile(definitionPath, { maxBytes: MAX_DEFINITION_BYTES });
  const definition = parseDefinition(bytes);
  if (byteSha256(bytes) !== manifest.origin.byte_sha256) throw new Error("workflow_import_byte_sha256_mismatch");
  if (semanticWorkflowSha256(definition) !== manifest.origin.semantic_sha256) throw new Error("workflow_import_semantic_sha256_mismatch");
  if (definition.id !== manifest.workflow.id || definition.version !== manifest.workflow.version) {
    throw new Error("workflow_import_identity_mismatch");
  }
  return { import_ref: importRef, manifest, manifest_sha256: byteSha256(manifestBytes), definition, bytes };
}
function publicError(error) {
  const code = String(error?.message || "workflow_import_invalid").split(":")[0];
  return code.startsWith("workflow_") ? code : "workflow_import_invalid";
}
function publicPointer(pointer) {
  if (!object19(pointer)) return null;
  return {
    schema_version: Number.isInteger(pointer.schema_version) ? pointer.schema_version : null,
    import_ref: typeof pointer.import_ref === "string" && pointer.import_ref.length <= 512 && pointer.import_ref.startsWith(`${WORKFLOW_IMPORT_BASE}/`) ? pointer.import_ref : null,
    id: typeof pointer.id === "string" && TOKEN_RE.test(pointer.id) ? pointer.id : null,
    version: typeof pointer.version === "string" && VERSION_RE3.test(pointer.version) ? pointer.version : null,
    semantic_sha256: typeof pointer.semantic_sha256 === "string" && SHA256_RE2.test(pointer.semantic_sha256) ? pointer.semantic_sha256 : null,
    byte_sha256: typeof pointer.byte_sha256 === "string" && SHA256_RE2.test(pointer.byte_sha256) ? pointer.byte_sha256 : null,
    manifest_sha256: typeof pointer.manifest_sha256 === "string" && SHA256_RE2.test(pointer.manifest_sha256) ? pointer.manifest_sha256 : null
  };
}
function publicDefinition(definition) {
  return {
    id: definition.id,
    version: definition.version,
    title: definition.title,
    owner_system: definition.owner_system,
    result: definition.result,
    trigger: definition.trigger,
    executor: definition.executor || null,
    steps: definition.steps.map((step) => ({
      id: step.id,
      title: step.title,
      system: step.system,
      mode: step.mode,
      implementation: step.implementation,
      requires: [...step.requires],
      optional: step.optional === true,
      handoff: step.handoff || null,
      evidence: { status: "not_consulted", reason_code: "step_receipts_not_connected" }
    })),
    closure: { requires: definition.closure.requires.map((rule) => ({ ...rule, accept: [...rule.accept] })) },
    handoffs: definition.handoffs.map((handoff) => ({
      id: handoff.id,
      artifact: handoff.artifact,
      consumers: [...handoff.consumers]
    })),
    consumers: definition.consumers.map((consumer) => ({ ...consumer })),
    completeness: definition.completeness ? {
      state: definition.completeness.state,
      open: [...definition.completeness.open]
    } : null,
    notice: definition.notice ? {
      channel: definition.notice.channel,
      queue: definition.notice.queue,
      sender: definition.notice.sender,
      idempotency: definition.notice.idempotency,
      delivery: definition.notice.delivery,
      delivery_gap: definition.notice.delivery_gap,
      closure_receipts: [...definition.notice.closure_receipts],
      summary: {
        procedure: definition.notice.summary.procedure,
        automatic_generation: definition.notice.summary.automatic_generation,
        requires_privacy_review: definition.notice.summary.requires_privacy_review,
        on_failure: definition.notice.summary.on_failure
      },
      on_failure: definition.notice.on_failure,
      resend: definition.notice.resend
    } : null
  };
}
function importedProjection(imported, { routineId: routineId2 = null, systemRef = null, pointer = null } = {}) {
  const { definition, manifest } = imported;
  return {
    workflow_id: definition.id,
    title: definition.title,
    routine_id: routineId2,
    system_ref: systemRef || definition.owner_system,
    status: routineId2 ? "verified_definition" : "imported_unlinked",
    reason_code: routineId2 ? null : "workflow_routine_pointer_absent",
    mismatches: [],
    pointer: publicPointer(pointer),
    origin: { ...manifest.origin, import_ref: imported.import_ref, manifest_sha256: imported.manifest_sha256 },
    definition: publicDefinition(definition),
    execution_evidence: { status: "not_consulted", reason_code: "step_receipts_not_connected" }
  };
}
function projectWorkflowImport(root, importRef) {
  try {
    return importedProjection(loadWorkflowImport(root, importRef));
  } catch (error) {
    return {
      workflow_id: null,
      title: "Defini\xE7\xE3o importada inv\xE1lida",
      routine_id: null,
      system_ref: null,
      status: "invalid_import",
      reason_code: publicError(error),
      mismatches: [],
      pointer: null,
      origin: { import_ref: importRef },
      definition: null,
      execution_evidence: { status: "not_consulted", reason_code: "step_receipts_not_connected" }
    };
  }
}
function projectWorkflowForRoutine(root, contract) {
  const pointer = contract.extensions?.workflow;
  if (!pointer) return null;
  const pointerErrors = validateWorkflowPointer(pointer);
  if (pointerErrors.length) {
    const safePointer = publicPointer(pointer);
    return {
      workflow_id: safePointer?.id || contract.routine_id,
      title: contract.name,
      routine_id: contract.routine_id,
      system_ref: contract.system_ref,
      status: "invalid_pointer",
      reason_code: "workflow_pointer_invalid",
      pointer: safePointer,
      origin: null,
      definition: null,
      execution_evidence: { status: "not_consulted", reason_code: "step_receipts_not_connected" }
    };
  }
  let imported;
  try {
    imported = loadWorkflowImport(root, pointer.import_ref);
  } catch (error) {
    return {
      workflow_id: pointer.id,
      title: contract.name,
      routine_id: contract.routine_id,
      system_ref: contract.system_ref,
      status: publicError(error) === "workflow_import_missing" ? "missing" : "invalid_import",
      reason_code: publicError(error),
      pointer: publicPointer(pointer),
      origin: null,
      definition: null,
      execution_evidence: { status: "not_consulted", reason_code: "step_receipts_not_connected" }
    };
  }
  const { definition, manifest } = imported;
  const mismatches = [];
  if (pointer.id !== definition.id) mismatches.push("id");
  if (pointer.version !== definition.version) mismatches.push("version");
  if (pointer.semantic_sha256 !== manifest.origin.semantic_sha256) mismatches.push("semantic_sha256");
  if (pointer.byte_sha256 !== manifest.origin.byte_sha256) mismatches.push("byte_sha256");
  if (pointer.manifest_sha256 !== imported.manifest_sha256) mismatches.push("manifest_sha256");
  const projection = importedProjection(imported, {
    routineId: contract.routine_id,
    systemRef: contract.system_ref,
    pointer
  });
  if (!mismatches.length) return projection;
  return {
    ...projection,
    status: "divergent",
    reason_code: "workflow_pointer_mismatch",
    mismatches
  };
}
function listWorkflowImports(root) {
  const base = resolve18(root, WORKFLOW_IMPORT_BASE);
  if (!existsSync18(base)) return [];
  assertNoSymlink(root, base);
  const refs4 = [];
  function walk(directory2) {
    for (const entry of readdirSync13(directory2, { withFileTypes: true })) {
      const path = resolve18(directory2, entry.name);
      if (entry.isSymbolicLink()) continue;
      if (entry.isDirectory()) walk(path);
      else if (entry.isFile() && entry.name === "import.json") refs4.push(relative17(resolve18(root), path).split(sep18).join("/"));
    }
  }
  walk(base);
  return refs4.sort();
}

// ../scripts/lib/console-read-model.mjs
function inside3(root, configured, fallback) {
  const brain = resolve19(root);
  const target = resolve19(root, configured || fallback);
  const rel = relative18(brain, target);
  if (!rel || rel.startsWith("..") || rel.startsWith(sep19)) throw new Error("layout do Console aponta para fora do C\xE9rebro");
  return target;
}
function jsonFiles2(directory2) {
  if (!existsSync19(directory2)) return [];
  return readdirSync14(directory2).filter((name) => name.endsWith(".json")).sort().map((name) => join18(directory2, name));
}
function listSourceContracts(root, issues) {
  const directory2 = inside3(root, layout(root).sourceContracts, join18(".cerebro", "contracts", "sources"));
  return jsonFiles2(directory2).flatMap((path) => {
    try {
      const contract = readJson(path, "Source Contract");
      const errors = validateSourceContract(contract);
      if (errors.length) throw new Error(errors.join(" \xB7 "));
      return [{
        source_id: contract.source_id,
        name: contract.name,
        type: contract.type,
        status: contract.status,
        assurance: contract.assurance,
        custody: contract.connector.custody,
        pii: contract.pii.classification,
        modes: contract.modes,
        freshness: contract.freshness,
        revocation: contract.revocation
      }];
    } catch (error) {
      issues.push({ reason_code: "source-contract-invalid", ref: relative18(root, path).replaceAll("\\", "/") });
      return [];
    }
  });
}
function systemSourceEvidence(root, systems, runRecords, now, issues) {
  const sourceDirectory = inside3(root, layout(root).sourceContracts, join18(".cerebro", "contracts", "sources"));
  const sources = /* @__PURE__ */ new Map();
  for (const path of jsonFiles2(sourceDirectory)) {
    try {
      const source = readJson(path, "Source Contract");
      if (!validateSourceContract(source).length) sources.set(source.source_id, source);
    } catch {
    }
  }
  const bindings = indexSystemSourceBindings(root, issues);
  return systems.flatMap((system) => {
    let contract;
    try {
      contract = readJson(resolve19(root, system.contract_ref), "System Contract");
    } catch {
      return [];
    }
    return system.source_refs.map((requirement) => {
      const source = sources.get(requirement.source_id) || null;
      const entry = bindings.get(`${contract.system_id}:${requirement.role}`) || null;
      const binding = entry?.binding || null;
      let bindingStatus = entry?.ambiguous ? "ambiguous" : binding?.status || "missing";
      let bound = false;
      if (bindingStatus === "ready" && source?.status === "active") {
        try {
          const grant = loadAccessGrant(root, binding.grant_ref).grant;
          const errors = validateSystemSourceBindingReferences(binding, { system: contract, source, grant });
          const at = now.getTime();
          bound = !errors.length && Date.parse(grant.issued_at) <= at && (!grant.expires_at || Date.parse(grant.expires_at) > at) && (!grant.revoked_at || Date.parse(grant.revoked_at) > at);
        } catch {
        }
        if (!bound) bindingStatus = "degraded";
      }
      const access = runRecords.flatMap((record2) => {
        if (record2.system_id !== contract.system_id || record2.system_version !== contract.version || !["completed", "succeeded"].includes(record2.status)) return [];
        return (record2.context_snapshot?.accesses || []).filter((item) => item.source_ref?.id === requirement.source_id && (item.source_ref?.role || item.role) === requirement.role).map((item) => ({
          observed_at: record2.context_snapshot.observed_at || record2.completed_at,
          freshness_marked: Boolean(item.freshness_marker)
        }));
      }).sort((left, right) => String(right.observed_at).localeCompare(String(left.observed_at)))[0] || null;
      return {
        system_ref: contract.system_id,
        system_version: contract.version,
        role: requirement.role,
        source_id: requirement.source_id,
        required: requirement.required !== false,
        contract_status: source?.status || null,
        binding_ref: binding?.binding_id || null,
        binding_status: bindingStatus,
        bound,
        last_access_at: access?.observed_at || null,
        freshness_marked: access?.freshness_marked || false
      };
    });
  });
}
function collectSystemPaths(root) {
  const found = new Set(jsonFiles2(inside3(root, layout(root).systemContracts, join18(".cerebro", "contracts", "systems"))));
  const systemsRoot = join18(root, "sistemas");
  if (existsSync19(systemsRoot)) {
    for (const entry of readdirSync14(systemsRoot, { withFileTypes: true })) {
      if (entry.isDirectory()) {
        const path = join18(systemsRoot, entry.name, "contract.json");
        if (existsSync19(path)) found.add(path);
      }
    }
  }
  const activation = join18(root, "operacao", "arquitetura", "primeiro-sistema.json");
  if (existsSync19(activation)) found.add(activation);
  return [...found].sort();
}
function listSystemContracts(root, issues) {
  const systems = /* @__PURE__ */ new Map();
  const runtimeBindings = indexSystemRuntimeBindings(root, issues);
  const experiences = indexExperienceManifests(root, issues);
  for (const path of collectSystemPaths(root)) {
    try {
      const contract = readJson(path, "System Contract");
      const errors = validateSystemContract(contract);
      if (errors.length) throw new Error(errors.join(" \xB7 "));
      const current = systems.get(contract.system_id);
      if (!current || String(current.version).localeCompare(String(contract.version), void 0, { numeric: true }) < 0) {
        const portfolioSystemRef = contract.extensions?.portfolio_system_ref || contract.system_id;
        const migrationStage = contract.extensions?.migration_stage || (contract.status === "active" ? "active" : contract.status === "proposed" ? "mapped" : "configured");
        const classification = systemClassification(contract.extensions);
        const runtimeEntry = runtimeBindings.get(portfolioSystemRef) || runtimeBindings.get(contract.system_id) || null;
        const runtimeBinding = runtimeEntry?.binding || null;
        const runtimeAmbiguous = runtimeEntry?.ambiguous === true;
        const runtimeWorkspaceObserved = runtimeBinding ? existsSync19(resolve19(root, runtimeBinding.workspace_path)) : false;
        const runtimeBindingStatus = runtimeAmbiguous ? "degraded" : runtimeBinding?.status === "installed" && !runtimeWorkspaceObserved ? "degraded" : runtimeBinding?.status || null;
        if (runtimeBinding?.status === "installed" && !runtimeWorkspaceObserved) {
          issues.push({ reason_code: "system-runtime-workspace-missing", ref: runtimeBinding.binding_id });
        }
        const legacyInterfaceRef = runtimeAmbiguous ? null : contract.extensions?.interface_ref || null;
        const interfaceRole = runtimeBinding?.interface.role || contract.extensions?.interface_role || null;
        const experience = experienceManifestView(
          experiences.get(portfolioSystemRef) || experiences.get(contract.system_id) || null,
          interfaceRole
        );
        systems.set(contract.system_id, {
          contract_id: contract.system_id,
          contract_ref: relative18(root, path).replaceAll("\\", "/"),
          system_id: portfolioSystemRef,
          name: contract.extensions?.portfolio_name || contract.name,
          version: contract.version,
          status: contract.status,
          migration_stage: migrationStage,
          human_maturity: contract.extensions?.human_maturity || null,
          human_attention: contract.extensions?.human_attention || null,
          wake_condition: contract.extensions?.wake_condition || null,
          source_manifest_ref: contract.extensions?.source_manifest_ref || null,
          interface_expected: Boolean(contract.extensions?.interface_role || runtimeBinding || legacyInterfaceRef),
          interface_role: interfaceRole,
          interface_ref: runtimeBinding?.interface.url || legacyInterfaceRef,
          interface_ref_source: runtimeBinding ? "runtime-binding" : legacyInterfaceRef ? "legacy-system-contract" : null,
          interface_health_timeout_ms: runtimeBinding?.interface.healthcheck.timeout_ms || 800,
          runtime_binding: runtimeBinding ? {
            binding_id: runtimeBinding.binding_id,
            status: runtimeBindingStatus,
            host_ref: runtimeBinding.host_ref,
            workspace_ref: runtimeBinding.workspace_ref,
            observed_at: runtimeBinding.observed_at
          } : null,
          runtime_binding_status: runtimeBindingStatus || (legacyInterfaceRef ? "legacy" : "unbound"),
          experience,
          component_statuses: contract.extensions?.component_statuses || null,
          next_gate: contract.extensions?.next_gate || null,
          operating_area: classification.operating_area,
          business_function: classification.business_function,
          result: contract.result.statement,
          operational_owner: contract.result.owner,
          human_gate: contract.result.human_gate,
          retrieval_status: contract.protocol_version === 2 ? "declared" : "retrieval-not-declared",
          source_refs: contract.sources.map((source) => ({
            role: source.role,
            source_id: source.source_id || null,
            required: source.required,
            access: source.access,
            freshness: source.freshness
          }))
        });
      }
    } catch {
      issues.push({ reason_code: "system-contract-invalid", ref: relative18(root, path).replaceAll("\\", "/") });
    }
  }
  return [...systems.values()].sort((left, right) => left.name.localeCompare(right.name, "pt-BR"));
}
function scheduleSummary(contract) {
  if (contract.trigger.type === "manual") return "Manual";
  const schedule = contract.trigger.schedule;
  const cadence = schedule.cadence === "daily" ? "Todos os dias" : schedule.cadence === "weekly" ? `Semanal \xB7 ${schedule.weekdays.join(", ")}` : `Mensal \xB7 dias ${schedule.month_days.join(", ")}`;
  return `${cadence} \xE0s ${schedule.time} \xB7 ${schedule.timezone}`;
}
function nextScheduledAt(contract, state2, now) {
  if (contract.trigger.type !== "schedule" || state2.status !== "active") return null;
  const horizon = new Date(now.getTime() + 62 * 24 * 60 * 60 * 1e3);
  return scheduledSlotsBetween(contract.trigger.schedule, now, horizon)[0] || null;
}
function bindingView(root, contract) {
  try {
    const binding = loadExecutorBinding(root, contract.executor.binding_ref).binding;
    return {
      binding_id: binding.binding_id,
      adapter: binding.adapter,
      auth_status: binding.auth.status,
      permission_profile: binding.permission_profile,
      requested_model: contract.executor.requested_model,
      model_observation: "requested-not-verified",
      observed_at: binding.observed_at
    };
  } catch {
    return {
      binding_id: contract.executor.binding_ref,
      adapter: "unresolved",
      auth_status: "missing",
      permission_profile: null,
      requested_model: contract.executor.requested_model,
      model_observation: "requested-not-verified",
      observed_at: null
    };
  }
}
function accessViews(root, contract) {
  return contract.context.access_requests.map((request) => {
    try {
      const grant = loadAccessGrant(root, request.grant_ref.replace(/^access-grant:/, "")).grant;
      return {
        source_ref: request.source_ref,
        action: request.action,
        requested_mode: request.mode,
        grant_ref: request.grant_ref,
        grant_status: grant.revoked_at ? "revoked" : "granted",
        assurance: grant.assurance,
        custody: grant.custody,
        revocation_effect: grant.assurance === "exported" ? "irreversible-export" : "future-only"
      };
    } catch {
      return {
        source_ref: request.source_ref,
        action: request.action,
        requested_mode: request.mode,
        grant_ref: request.grant_ref,
        grant_status: "missing",
        assurance: "unknown",
        custody: "unknown",
        revocation_effect: "unknown"
      };
    }
  });
}
function preparationView(root, contract) {
  const preparation = contract.extensions?.preparation;
  if (!preparation) return null;
  try {
    const binding = loadCollectorBinding(root, preparation.binding_ref).binding;
    return {
      kind: preparation.kind,
      binding_ref: preparation.binding_ref,
      executable: binding.executable,
      status: binding.status,
      output_ref: preparation.output_ref,
      stdout_recorded: binding.privacy.stdout_recorded
    };
  } catch {
    return {
      kind: preparation.kind,
      binding_ref: preparation.binding_ref,
      executable: null,
      status: "missing",
      output_ref: preparation.output_ref,
      stdout_recorded: false
    };
  }
}
function healthReason(contract, state2, binding, preparation, migration, receipts) {
  if (migration?.status === "cancelled") return "routine-migration-cancelled";
  if (migration?.duplicate_run_risk && migration.legacy_pause.status !== "confirmed") return "legacy-schedule-not-paused";
  if (contract.lifecycle !== "approved") return "routine-not-approved";
  if (preparation && preparation.status !== "ready") return `collector-${preparation.status}`;
  if (binding.auth_status !== "ready") return `executor-${binding.auth_status}`;
  if (state2.status === "active") return "active";
  if (state2.status === "paused") return "routine-paused";
  return receipts.some((receipt2) => receipt2.trigger === "manual" && receipt2.status === "completed") ? "ready-to-activate" : "ready-manual-run";
}
function routineView(root, contract, now, runRecordsById) {
  const state2 = loadRoutineState(root, contract.routine_id).state;
  const binding = bindingView(root, contract);
  const preparation = preparationView(root, contract);
  const migration = loadRoutineMigration(root, contract.routine_id, { optional: true }).migration;
  const receipts = listRoutineRunReceipts(root, contract.routine_id).sort((left, right) => Date.parse(right.completed_at) - Date.parse(left.completed_at));
  const latestManual = receipts.find((receipt2) => receipt2.trigger === "manual" && receipt2.status === "completed") || null;
  const blocker = routineMigrationBlocker(root, contract.routine_id);
  const health = healthReason(contract, state2, binding, preparation, migration, receipts);
  return {
    routine_id: contract.routine_id,
    name: contract.name,
    version: contract.version,
    lifecycle: contract.lifecycle,
    system_ref: contract.system_ref,
    trigger: contract.trigger.type,
    schedule: scheduleSummary(contract),
    next_scheduled_at: nextScheduledAt(contract, state2, now),
    permission_mode: contract.permission_mode,
    destination: contract.destination,
    prompt_ref: contract.context.prompt_ref,
    privacy: contract.privacy,
    operations: contract.operations,
    state: state2,
    binding,
    preparation,
    workflow: projectWorkflowForRoutine(root, contract),
    migration,
    access: accessViews(root, contract),
    health_reason_code: health,
    actions: {
      can_run: contract.lifecycle === "approved" && binding.auth_status === "ready",
      can_activate: state2.status === "disabled" && Boolean(latestManual) && !blocker,
      can_pause: state2.status === "active",
      can_resume: state2.status === "paused" && !blocker,
      can_confirm_legacy_pause: migration?.status === "awaiting-legacy-pause",
      activation_evidence_ref: latestManual ? `routine-receipt:${latestManual.receipt_id}` : null
    },
    receipts: receipts.map((receipt2) => {
      const runRecord = runRecordsById.get(receipt2.run_id) || null;
      return {
        receipt_id: receipt2.receipt_id,
        receipt_ref: `routine-receipt:${receipt2.receipt_id}`,
        routine_version: receipt2.routine_version,
        trigger: receipt2.trigger,
        status: receipt2.status,
        reason_code: receipt2.reason_code,
        scheduled_for: receipt2.scheduled_for,
        started_at: receipt2.started_at,
        completed_at: receipt2.completed_at,
        requested_model: receipt2.requested_model,
        model_observation: receipt2.model_observation,
        model_usage: receipt2.model_usage ?? null,
        input_refs: receipt2.input_refs,
        output_ref: receipt2.output_ref,
        access_receipt_refs: receipt2.access_receipt_refs,
        content_shared_with_provider: receipt2.content_shared_with_provider,
        run_record_ref: runRecord ? `run-record:${runRecord.run_id}` : null,
        context_status: runRecord?.protocol_version === 2 ? "recorded" : "context-not-recorded",
        context_source_count: runRecord?.protocol_version === 2 ? runRecord.context_snapshot.accesses.length : 0
      };
    })
  };
}
function judgmentInbox(root, routines, issues, runRecordsById, observedAt) {
  const names = new Map(routines.map((routine) => [routine.routine_id, routine.name]));
  return listRoutineRunReceipts(root).filter((receipt2) => receipt2.status === "completed" && receipt2.output_ref).map((receipt2) => {
    const runRecord = runRecordsById.get(receipt2.run_id) || null;
    let judgment;
    let correction = null;
    let actions = {
      can_rerun_with_correction: false,
      can_compare: false,
      can_create_learning_candidate: false
    };
    try {
      judgment = judgmentView(root, receipt2.receipt_id, { clock: () => observedAt });
      if (judgment.status === "unavailable") {
        issues.push({
          reason_code: judgment.reason_code || "judgment-state-unavailable",
          ref: `routine-receipt:${receipt2.receipt_id}`
        });
      }
    } catch {
      judgment = {
        status: "unavailable",
        verdict: null,
        action_intent: "none",
        actor_ref: null,
        decided_at: null,
        history_count: 0
      };
      issues.push({ reason_code: "judgment-receipt-invalid", ref: `routine-receipt:${receipt2.receipt_id}` });
    }
    try {
      correction = correctionView(root, receipt2.receipt_id);
      actions = correctionActions(root, receipt2.receipt_id);
    } catch {
      issues.push({ reason_code: "correction-state-invalid", ref: `routine-receipt:${receipt2.receipt_id}` });
    }
    return {
      receipt_id: receipt2.receipt_id,
      receipt_ref: `routine-receipt:${receipt2.receipt_id}`,
      routine_id: receipt2.routine_id,
      routine_name: names.get(receipt2.routine_id) || receipt2.routine_id,
      system_ref: receipt2.system_ref,
      run_id: receipt2.run_id,
      trigger: receipt2.trigger,
      completed_at: receipt2.completed_at,
      requested_model: receipt2.requested_model,
      model_observation: receipt2.model_observation,
      model_usage: receipt2.model_usage ?? null,
      output_ref: receipt2.output_ref,
      run_record_ref: runRecord ? `run-record:${runRecord.run_id}` : null,
      context_status: runRecord?.protocol_version === 2 ? "recorded" : "context-not-recorded",
      context_source_count: runRecord?.protocol_version === 2 ? runRecord.context_snapshot.accesses.length : 0,
      judgment,
      correction,
      actions
    };
  }).sort((left, right) => {
    const pending = Number(right.judgment.status !== "decided") - Number(left.judgment.status !== "decided");
    return pending || Date.parse(right.completed_at) - Date.parse(left.completed_at);
  });
}
function buildConsoleReadModel(root, { now = /* @__PURE__ */ new Date() } = {}) {
  const observedAt = new Date(now);
  if (!Number.isFinite(observedAt.getTime())) throw new Error("rel\xF3gio inv\xE1lido");
  const issues = [];
  const compatibility = buildCompatibilityDiagnostic(root, { now: observedAt });
  const sources = listSourceContracts(root, issues);
  const systems = listSystemContracts(root, issues);
  let runRecords = [];
  try {
    runRecords = latestRunRecords(root);
  } catch {
    issues.push({ reason_code: "run-ledger-invalid", ref: ".cerebro/runtime/ledger/runs.jsonl" });
  }
  const runRecordsById = new Map(runRecords.map((record2) => [record2.run_id, record2]));
  const sourceEvidence = systemSourceEvidence(root, systems, runRecords, observedAt, issues);
  const experimentModel = buildExperimentReadModel(root, { runRecords });
  issues.push(...experimentModel.issues);
  let routines = [];
  try {
    routines = listRoutineContracts(root).map((contract) => routineView(root, contract, observedAt, runRecordsById));
  } catch {
    issues.push({ reason_code: "routine-contract-invalid", ref: ".cerebro/contracts/routines" });
  }
  const routineWorkflows = routines.flatMap((routine) => routine.workflow ? [routine.workflow] : []);
  let importedWorkflows = [];
  try {
    const linked = new Set(routineWorkflows.filter((workflow) => workflow.definition).map((workflow) => workflow.pointer?.import_ref).filter(Boolean));
    importedWorkflows = listWorkflowImports(root).filter((ref) => !linked.has(ref)).map((ref) => {
      const imported = projectWorkflowImport(root, ref);
      const related = routineWorkflows.find((workflow) => workflow.pointer?.id === imported.workflow_id && workflow.pointer?.version === imported.definition?.version);
      if (!related || !imported.origin) return imported;
      const mismatches = ["semantic_sha256", "byte_sha256", "manifest_sha256"].filter((field) => related.pointer?.[field] !== imported.origin?.[field]);
      return {
        ...imported,
        status: mismatches.length ? "divergent" : imported.status,
        reason_code: mismatches.length ? "workflow_pointer_mismatch" : imported.reason_code,
        mismatches,
        related_routine_id: related.routine_id,
        related_pointer: related.pointer
      };
    });
  } catch {
    issues.push({ reason_code: "workflow-import-catalog-invalid", ref: ".cerebro/workflows/imports" });
  }
  const workflows = [...routineWorkflows, ...importedWorkflows];
  const systemById = new Map(systems.flatMap((system) => [
    [system.system_id, system],
    [system.contract_id, system]
  ]));
  const areas = [...new Set(systems.map((system) => system.operating_area))].sort().map((operatingArea) => ({
    operating_area: operatingArea,
    name: operatingAreaLabel(operatingArea),
    system_refs: systems.filter((system) => system.operating_area === operatingArea).map((system) => system.system_id),
    routine_refs: routines.filter((routine) => systemById.get(routine.system_ref)?.operating_area === operatingArea).map((routine) => routine.routine_id)
  }));
  const attention = routines.filter((routine) => !["active", "ready-manual-run", "ready-to-activate"].includes(routine.health_reason_code));
  const judgments = judgmentInbox(root, routines, issues, runRecordsById, observedAt);
  const routineRunIds = new Set(routines.flatMap((routine) => routine.receipts.map((receipt2) => receipt2.run_id)));
  const runRecordViews = runRecords.map((record2) => ({
    run_id: record2.run_id,
    run_record_ref: `run-record:${record2.run_id}`,
    system_ref: record2.system_id,
    status: record2.status,
    started_at: record2.started_at,
    completed_at: record2.completed_at,
    chain_id: record2.chain_id ?? null,
    mode: record2.mode ?? null,
    experiment_ref: record2.experiment_ref ?? null,
    handoff_count: record2.handoff_refs?.length || 0,
    has_routine_receipt: routineRunIds.has(record2.run_id)
  }));
  const pendingJudgments = judgments.filter((item) => item.judgment.status !== "decided");
  let learningCandidates = 0;
  try {
    learningCandidates = listLearningCandidates(root).length;
  } catch {
    issues.push({ reason_code: "learning-candidate-invalid", ref: ".cerebro/runtime/learning-candidates" });
  }
  return {
    protocol_version: 1,
    generated_at: observedAt.toISOString(),
    cache: { kind: "none", rebuildable_from: ["manifest", "contracts", "bindings", "state", "receipts", "run-ledger", "experiments", "judgments", "corrections", "learning-candidates"] },
    privacy: {
      content_shared_with_inevita: false,
      raw_output_exposed: false,
      prompt_exposed: false,
      explicit_local_output_read: true
    },
    counts: {
      areas: areas.length,
      systems: systems.length,
      skills: countInstalledSkills(root),
      sources: sources.length,
      experiments: experimentModel.experiments.length,
      routines: routines.length,
      workflows: workflows.length,
      attention: attention.length,
      judgments: pendingJudgments.length,
      executions: runRecordViews.length,
      learning_candidates: learningCandidates,
      compatibility_gaps: compatibility.checks.filter((item) => item.status !== "met").length
    },
    system_taxonomy: systemTaxonomy(),
    areas,
    systems,
    sources,
    system_source_evidence: sourceEvidence,
    experiments: experimentModel.experiments,
    routines,
    workflows,
    run_records: runRecordViews,
    judgments,
    compatibility,
    today: {
      needs_attention: attention.map((routine) => routine.routine_id),
      ready_to_work: routines.filter((routine) => ["ready-manual-run", "ready-to-activate"].includes(routine.health_reason_code)).map((routine) => routine.routine_id),
      active: routines.filter((routine) => routine.health_reason_code === "active").map((routine) => routine.routine_id),
      pending_judgments: pendingJudgments.map((item) => item.receipt_id)
    },
    issues
  };
}

// ../scripts/lib/handoff-protocol.mjs
import {
  existsSync as existsSync20,
  lstatSync as lstatSync14,
  mkdirSync as mkdirSync10,
  readFileSync as readFileSync20,
  readdirSync as readdirSync15,
  realpathSync as realpathSync11,
  statSync as statSync5
} from "node:fs";
import { join as join19, relative as relative19, resolve as resolve20, sep as sep20 } from "node:path";
var OPAQUE_REF_RE4 = /^[A-Za-z0-9][A-Za-z0-9_.:-]{0,127}$/;
var LOCAL_REF_RE9 = /^(?!.*\.\.(?:\/|$))[A-Za-z0-9.][A-Za-z0-9_./:-]{0,255}$/;
var HASH_RE2 = /^[a-f0-9]{64}$/;
var EXPERIMENT_ID_RE4 = /^EXP-[A-Za-z0-9_-]{1,48}$/;
var MAX_ARTIFACT_BYTES = 4 * 1024 * 1024;
var RECEIPT_KEYS = /* @__PURE__ */ new Set([
  "protocol_version",
  "receipt_id",
  "handoff_ref",
  "chain_id",
  "mode",
  "experiment_ref",
  "producer_run_ref",
  "artifact",
  "gate",
  "consumer_run_ref",
  "status",
  "produced_at",
  "gated_at",
  "consumed_at",
  "privacy",
  "extensions"
]);
function object20(value) {
  return value !== null && typeof value === "object" && !Array.isArray(value);
}
function requiredText2(errors, value, path) {
  if (typeof value !== "string" || !value.trim()) errors.push(`${path} precisa ser texto n\xE3o vazio`);
}
function exactKeys2(errors, value, allowed, path) {
  if (!object20(value)) return;
  for (const key2 of Object.keys(value)) if (!allowed.has(key2)) errors.push(`${path}.${key2} n\xE3o \xE9 permitido`);
}
function optionalDateTime(errors, value, path) {
  if (value === null) return;
  if (typeof value !== "string" || !Number.isFinite(Date.parse(value))) errors.push(`${path} inv\xE1lido`);
}
function validateHandoffReceipt(value) {
  const errors = [];
  if (!object20(value)) return ["handoff receipt precisa ser objeto"];
  exactKeys2(errors, value, RECEIPT_KEYS, "handoff_receipt");
  if (value.protocol_version !== 1) errors.push("protocol_version precisa ser 1");
  if (!OPAQUE_REF_RE4.test(value.receipt_id || "")) errors.push("receipt_id inv\xE1lido");
  if (!ID_RE2.test(value.handoff_ref || "")) errors.push("handoff_ref inv\xE1lido");
  if (!OPAQUE_REF_RE4.test(value.chain_id || "")) errors.push("chain_id inv\xE1lido");
  if (!["replay", "live"].includes(value.mode)) errors.push("mode precisa ser replay ou live");
  if (value.experiment_ref !== null && !EXPERIMENT_ID_RE4.test(value.experiment_ref || "")) {
    errors.push("experiment_ref precisa ser EXP-* ou null");
  }
  if (!OPAQUE_REF_RE4.test(value.producer_run_ref || "")) errors.push("producer_run_ref inv\xE1lido");
  if (!object20(value.artifact)) errors.push("artifact precisa ser objeto");
  else {
    exactKeys2(errors, value.artifact, /* @__PURE__ */ new Set([
      "artifact_ref",
      "artifact_type",
      "schema_ref",
      "schema_version",
      "sha256",
      "schema_validated"
    ]), "artifact");
    if (!LOCAL_REF_RE9.test(value.artifact.artifact_ref || "")) errors.push("artifact.artifact_ref inv\xE1lido");
    if (!ID_RE2.test(value.artifact.artifact_type || "")) errors.push("artifact.artifact_type inv\xE1lido");
    if (!LOCAL_REF_RE9.test(value.artifact.schema_ref || "")) errors.push("artifact.schema_ref inv\xE1lido");
    if (!VERSION_RE2.test(value.artifact.schema_version || "")) errors.push("artifact.schema_version precisa ser semver");
    if (!HASH_RE2.test(value.artifact.sha256 || "")) errors.push("artifact.sha256 inv\xE1lido");
    if (typeof value.artifact.schema_validated !== "boolean") errors.push("artifact.schema_validated precisa ser booleano");
  }
  if (!object20(value.gate)) errors.push("gate precisa ser objeto");
  else {
    exactKeys2(errors, value.gate, /* @__PURE__ */ new Set(["result", "checks", "human_decision"]), "gate");
    if (!["passed", "failed", "pending"].includes(value.gate.result)) errors.push("gate.result inv\xE1lido");
    if (!Array.isArray(value.gate.checks)) errors.push("gate.checks precisa ser lista");
    else {
      value.gate.checks.forEach((item, index) => {
        if (!object20(item)) {
          errors.push(`gate.checks[${index}] precisa ser objeto`);
          return;
        }
        exactKeys2(errors, item, /* @__PURE__ */ new Set(["check", "passed"]), `gate.checks[${index}]`);
        requiredText2(errors, item.check, `gate.checks[${index}].check`);
        if (typeof item.passed !== "boolean") errors.push(`gate.checks[${index}].passed precisa ser booleano`);
      });
    }
    if (!["approved", "rejected", "pending", "not-required"].includes(value.gate.human_decision)) {
      errors.push("gate.human_decision inv\xE1lida");
    }
  }
  if (value.consumer_run_ref !== null && !OPAQUE_REF_RE4.test(value.consumer_run_ref || "")) {
    errors.push("consumer_run_ref precisa ser refer\xEAncia opaca ou null");
  }
  if (!["delivered", "accepted", "rejected", "failed"].includes(value.status)) errors.push("status inv\xE1lido");
  if (typeof value.produced_at !== "string" || !Number.isFinite(Date.parse(value.produced_at))) {
    errors.push("produced_at inv\xE1lido");
  }
  optionalDateTime(errors, value.gated_at, "gated_at");
  optionalDateTime(errors, value.consumed_at, "consumed_at");
  if (object20(value.gate)) {
    if (value.gate.result === "pending" && value.gated_at !== null) errors.push("gate pendente n\xE3o pode ter gated_at");
    if (["passed", "failed"].includes(value.gate.result) && !value.gated_at) {
      errors.push("gate decidido exige gated_at");
    }
    if (value.gate.result === "passed") {
      if (value.artifact?.schema_validated !== true) errors.push("gate n\xE3o pode passar sem schema validado no artefato");
      if (Array.isArray(value.gate.checks) && value.gate.checks.some((item) => item?.passed === false)) {
        errors.push("gate n\xE3o pode passar com check reprovado");
      }
    }
  }
  if (value.status === "accepted") {
    if (value.gate?.result !== "passed") errors.push("status accepted exige gate.result passed");
    if (!value.consumer_run_ref) errors.push("status accepted exige consumer_run_ref");
    if (!value.consumed_at) errors.push("status accepted exige consumed_at");
  }
  if (value.status === "delivered" && value.consumer_run_ref !== null) {
    errors.push("status delivered n\xE3o pode ter consumer_run_ref; use accepted");
  }
  if (value.status === "rejected" && value.gate?.result !== "failed" && value.gate?.human_decision !== "rejected") {
    errors.push("status rejected exige gate reprovado ou decis\xE3o humana rejected");
  }
  const producedAt = Date.parse(value.produced_at || "");
  if (value.gated_at && Date.parse(value.gated_at) < producedAt) errors.push("gated_at n\xE3o pode ser anterior a produced_at");
  if (value.consumed_at && value.gated_at && Date.parse(value.consumed_at) < Date.parse(value.gated_at)) {
    errors.push("consumed_at n\xE3o pode ser anterior a gated_at");
  }
  disclosureErrors(errors, value.privacy, "privacy");
  if (value.extensions !== void 0 && !object20(value.extensions)) errors.push("extensions precisa ser objeto");
  return [...new Set(errors)];
}
function safeDirectory2(root, configured, fallback, { runtimeOnly = false } = {}) {
  const rootPath = resolve20(root);
  const target = resolve20(root, configured || fallback);
  const lexical = relative19(rootPath, target);
  if (!lexical || lexical.startsWith("..") || lexical.startsWith(sep20)) throw new Error("handoff-layout-outside-brain");
  if (runtimeOnly) {
    const runtime = resolve20(root, ".cerebro", "runtime");
    const runtimeRelative = relative19(runtime, target);
    if (!runtimeRelative || runtimeRelative.startsWith("..") || runtimeRelative.startsWith(sep20)) {
      throw new Error("handoff-receipts-not-private");
    }
  }
  mkdirSync10(target, { recursive: true, mode: 448 });
  if (lstatSync14(target).isSymbolicLink()) throw new Error("handoff-directory-symlink-blocked");
  const realRoot = realpathSync11(rootPath);
  const realTarget = realpathSync11(target);
  const realRelative = relative19(realRoot, realTarget);
  if (!realRelative || realRelative.startsWith("..") || realRelative.startsWith(sep20)) {
    throw new Error("handoff-directory-outside-brain");
  }
  return realTarget;
}
function handoffReceiptDirectory(root) {
  return safeDirectory2(root, layout(root).handoffReceipts, join19(".cerebro", "runtime", "receipts", "handoffs"), {
    runtimeOnly: true
  });
}
function listHandoffReceipts(root) {
  const configured = resolve20(root, layout(root).handoffReceipts || join19(".cerebro", "runtime", "receipts", "handoffs"));
  if (!existsSync20(configured)) return [];
  const directory2 = handoffReceiptDirectory(root);
  return readdirSync15(directory2).filter((name) => name.endsWith(".json")).sort().flatMap((name) => {
    try {
      const receipt2 = readJson(join19(directory2, name), "Handoff Receipt");
      return validateHandoffReceipt(receipt2).length ? [] : [receipt2];
    } catch {
      return [];
    }
  });
}

// ../scripts/lib/graph-read-model.mjs
var ARTIFACT_REFS = Symbol("artifact-refs");
var ARTIFACT_POINTERS = Symbol("artifact-pointers");
function graphNode(id3, kind, label, state2 = "declared", details = {}) {
  return { id: id3, kind, label, state: state2, actual: false, details };
}
function graphEdge(id3, source, target, relation, state2 = "declared") {
  return { id: id3, source, target, relation, state: state2, actual: false };
}
function readableRef(value) {
  return String(value || "").replaceAll("_", " ").replaceAll("-", " ").replace(/\s+/g, " ").trim().replace(/(^|\s)\S/g, (character) => character.toUpperCase());
}
function stableId(prefix, value) {
  return `${prefix}:${createHash7("sha256").update(String(value)).digest("hex").slice(0, 16)}`;
}
function applyLayout(root, key2, graph) {
  const saved = readCanvasLayout(root, key2);
  return {
    ...graph,
    layout: { key: key2, editable: "positions-only", positions: saved.positions, updated_at: saved.updated_at },
    nodes: graph.nodes.map((node) => saved.positions[node.id] ? { ...node, position: saved.positions[node.id] } : node)
  };
}
function systemContracts(root) {
  const directory2 = join20(root, layout(root).systemContracts || ".cerebro/contracts/systems");
  if (!existsSync21(directory2)) return [];
  return readdirSync16(directory2).filter((name) => name.endsWith(".json")).sort().flatMap((name) => {
    try {
      const contract = readJson(join20(directory2, name), "System Contract");
      return validateSystemContract(contract).length ? [] : [contract];
    } catch {
      return [];
    }
  });
}
function findSystem(root, ref) {
  const found = systemContracts(root).find((contract) => contract.system_id === ref || contract.extensions?.portfolio_system_ref === ref);
  if (!found) throw new Error("graph-system-not-found");
  return found;
}
function routinesForSystem(root, systemId) {
  return listRoutineContracts(root).filter((routine) => routine.system_ref === systemId);
}
function buildSystemGraph(root, systemRef) {
  const system = findSystem(root, systemRef);
  const routines = routinesForSystem(root, system.system_id);
  const sourceContracts = new Map(buildConsoleReadModel(root).sources.map((source) => [source.source_id, source]));
  const nodes = [];
  const edges = [];
  const sourceNodeByRole = /* @__PURE__ */ new Map();
  for (const source of system.sources) {
    const id3 = `source:${source.source_id || source.role}`;
    const sourceContract = source.source_id ? sourceContracts.get(source.source_id) : null;
    sourceNodeByRole.set(source.role, id3);
    nodes.push(graphNode(id3, "source", sourceContract?.name || source.source_id || source.role, "declared", {
      ref: source.source_id || null,
      type: sourceContract?.type || null,
      role: source.role,
      required: source.required,
      freshness: source.freshness,
      purpose: source.purpose
    }));
  }
  const hasCollector = routines.some((routine) => routine.extensions?.preparation);
  if (hasCollector) nodes.push(graphNode("collector", "collector", "Coleta determin\xEDstica", "declared", {
    binding_refs: routines.map((routine) => routine.extensions?.preparation?.binding_ref).filter(Boolean)
  }));
  nodes.push(graphNode("retrieval", "retrieval", "Recupera\xE7\xE3o de contexto", "declared", {
    version: system.retrieval?.version || null,
    budget: system.retrieval?.context_budget || null
  }));
  const skillRefs = [...new Set(routines.flatMap((routine) => routine.context.skill_refs || []))];
  for (const ref of skillRefs) nodes.push(graphNode(`skill:${ref}`, "skill", ref.split("/").slice(-2, -1)[0] || ref, "declared", { ref }));
  const consumedArtifacts = system.artifacts?.consumes || [];
  const producedArtifacts = system.artifacts?.produces || [];
  for (const artifact of consumedArtifacts) nodes.push(graphNode(
    `artifact-contract:consume:${artifact.role}`,
    "artifact",
    readableRef(artifact.role),
    "declared",
    {
      direction: "consumes",
      artifact_type: artifact.artifact_type,
      schema_ref: artifact.schema_ref,
      accepted_versions: artifact.accepted_versions,
      required: artifact.required
    }
  ));
  nodes.push(graphNode("capability", "capability", system.capability.capability_id, "declared", {
    version: system.capability.version,
    origin: system.capability.origin
  }));
  const stageIds = system.pipeline.map((stage, index) => {
    const id3 = `stage:${index + 1}:${stage.state}`;
    nodes.push(graphNode(id3, "stage", readableRef(stage.state), "declared", {
      order: index + 1,
      state_ref: stage.state,
      input: stage.input,
      output: stage.output,
      gate: stage.gate
    }));
    return id3;
  });
  nodes.push(graphNode("output", "output", system.result.output_type, "declared", {
    result: system.result.statement,
    done: system.result.definition_of_done
  }));
  for (const artifact of producedArtifacts) nodes.push(graphNode(
    `artifact-contract:produce:${artifact.role}`,
    "artifact",
    readableRef(artifact.role),
    "declared",
    {
      direction: "produces",
      artifact_type: artifact.artifact_type,
      schema_ref: artifact.schema_ref,
      schema_version: artifact.schema_version,
      sensitivity: artifact.sensitivity
    }
  ));
  system.eval.deterministic_gates.forEach((gate, index) => nodes.push(
    graphNode(`gate:${index + 1}`, "gate", gate, "declared", { index: index + 1 })
  ));
  nodes.push(graphNode("judgment", "judgment", "Julgamento humano", "pending", {
    authority: system.result.human_gate,
    questions: system.eval.human_questions
  }));
  for (const [role, sourceId] of sourceNodeByRole) {
    edges.push(graphEdge(
      `edge:${sourceId}:${hasCollector ? "collector" : "retrieval"}`,
      sourceId,
      hasCollector ? "collector" : "retrieval",
      role
    ));
  }
  if (hasCollector) edges.push(graphEdge("edge:collector:retrieval", "collector", "retrieval", "produces"));
  if (skillRefs.length) {
    for (const ref of skillRefs) edges.push(graphEdge(`edge:retrieval:skill:${ref}`, "retrieval", `skill:${ref}`, "loads"));
    for (const ref of skillRefs) edges.push(graphEdge(`edge:skill:${ref}:capability`, `skill:${ref}`, "capability", "instructs"));
  } else edges.push(graphEdge("edge:retrieval:capability", "retrieval", "capability", "grounds"));
  for (const artifact of consumedArtifacts) edges.push(graphEdge(
    `edge:artifact-contract:consume:${artifact.role}:capability`,
    `artifact-contract:consume:${artifact.role}`,
    "capability",
    "consumed-by"
  ));
  if (stageIds.length) {
    edges.push(graphEdge(`edge:capability:${stageIds[0]}`, "capability", stageIds[0], "starts"));
    stageIds.slice(1).forEach((stageId, index) => edges.push(
      graphEdge(`edge:${stageIds[index]}:${stageId}`, stageIds[index], stageId, "advances")
    ));
    edges.push(graphEdge(`edge:${stageIds.at(-1)}:output`, stageIds.at(-1), "output", "produces"));
  } else edges.push(graphEdge("edge:capability:output", "capability", "output", "produces"));
  for (const artifact of producedArtifacts) edges.push(graphEdge(
    `edge:output:artifact-contract:produce:${artifact.role}`,
    "output",
    `artifact-contract:produce:${artifact.role}`,
    "materializes"
  ));
  system.eval.deterministic_gates.forEach((_gate, index) => {
    const source = index === 0 ? "output" : `gate:${index}`;
    edges.push(graphEdge(`edge:${source}:gate:${index + 1}`, source, `gate:${index + 1}`, "evaluates"));
  });
  edges.push(graphEdge(
    `edge:gate:${system.eval.deterministic_gates.length}:judgment`,
    `gate:${system.eval.deterministic_gates.length}`,
    "judgment",
    "hands-off"
  ));
  return applyLayout(root, `system-${system.system_id}`, {
    protocol_version: 1,
    graph_type: "system",
    graph_ref: system.system_id,
    title: system.name,
    subtitle: system.result.statement,
    trace_origin: null,
    nodes,
    edges,
    states: { legend: ["declared", "running", "completed", "gap", "pending", "failed", "denied"] },
    privacy: { content_shared_with_inevita: false, payload_exposed: false }
  });
}
function receiptById(root, receiptId) {
  if (String(receiptId).startsWith("run-record:")) {
    const runId = String(receiptId).slice("run-record:".length);
    const record2 = latestRunRecords(root).find((item) => item.run_id === runId);
    if (!record2) throw new Error("graph-run-not-found");
    const routineRef = String(record2.extensions?.routine_ref || "");
    const routineMatch = routineRef.match(/^routine:([a-z0-9][a-z0-9-]{0,63}):/);
    return {
      receipt_id: `record-${record2.run_id}`,
      run_id: record2.run_id,
      routine_id: routineMatch?.[1] || `execucao-${record2.system_id}`,
      system_ref: record2.system_id,
      status: record2.status,
      reason_code: record2.mode === "replay" ? "governed-replay" : "run-record",
      started_at: record2.started_at,
      completed_at: record2.completed_at,
      input_refs: record2.context_snapshot?.accesses.flatMap((access) => access.selected_refs) || [],
      output_ref: record2.output_refs[0] || null,
      synthetic_from_run_record: true
    };
  }
  try {
    return readRoutineRunReceipt(root, `routine-receipt:${receiptId}`);
  } catch {
    throw new Error("graph-run-not-found");
  }
}
function setNode(graph, id3, state2, actual = true, extra = {}) {
  const index = graph.nodes.findIndex((node) => node.id === id3);
  if (index === -1) return;
  graph.nodes[index] = { ...graph.nodes[index], state: state2, actual, details: { ...graph.nodes[index].details, ...extra } };
}
function activateEdges(graph) {
  const actual = new Set(graph.nodes.filter((node) => node.actual).map((node) => node.id));
  graph.edges = graph.edges.map((edge) => actual.has(edge.source) && actual.has(edge.target) ? { ...edge, state: "completed", actual: true } : edge);
}
function applyRecordedTrace(graph, events) {
  const steps = latestStepStates(events);
  for (const event of steps.values()) {
    let nodeId = null;
    if (event.source_ref) nodeId = `source:${event.source_ref}`;
    else if (event.step_type === "collector") nodeId = "collector";
    else if (event.step_type === "retrieval") nodeId = "retrieval";
    else if (event.step_type === "skill" && event.skill_ref) nodeId = `skill:${event.skill_ref}`;
    else if (event.step_type === "model" && event.model_ref) {
      nodeId = `model:${event.model_ref}`;
      if (!graph.nodes.some((node) => node.id === nodeId)) graph.nodes.push(graphNode(
        nodeId,
        "model",
        readableRef(event.model_ref),
        event.state,
        {
          ref: event.model_ref,
          assurance: event.assurance
        }
      ));
    } else if (event.step_type === "connector" && event.connector_ref) {
      nodeId = `connector:${event.connector_ref}`;
      if (!graph.nodes.some((node) => node.id === nodeId)) graph.nodes.push(graphNode(
        nodeId,
        "connector",
        readableRef(event.connector_ref),
        event.state,
        {
          ref: event.connector_ref,
          assurance: event.assurance
        }
      ));
    } else if (event.step_type === "capability") nodeId = "capability";
    else if (event.step_type === "output") nodeId = "output";
    else if (event.step_type === "judgment") nodeId = "judgment";
    if (nodeId) setNode(graph, nodeId, event.state, true, { reason_code: event.reason_code });
    if (event.step_type === "eval" && Array.isArray(event.extensions?.gate_results)) {
      event.extensions.gate_results.forEach((gate, index) => setNode(
        graph,
        `gate:${index + 1}`,
        gate.passed ? "completed" : "failed",
        true,
        { gate_id: gate.gate_id, issue_count: gate.issue_count, not_applicable: gate.not_applicable }
      ));
    }
  }
}
function canonicalArtifactRef(ref) {
  const value = String(ref || "");
  if (value.startsWith("context-artifact:")) return value.split(":json-pointer:", 1)[0];
  return value;
}
function artifactReference(ref) {
  const value = String(ref || "");
  return Boolean(value) && !value.startsWith("source:") && !value.startsWith("access-receipt:") && !value.startsWith("routine-receipt:") && !value.startsWith("execution-trace:");
}
function artifactType(ref) {
  const value = String(ref || "").toLowerCase();
  if (value.startsWith("context-artifact:")) return "context-snapshot";
  if (value.startsWith("collector-output:")) return "collector-output";
  if (value.includes(".prompt.")) return "instruction";
  if (value.includes("/outputs/")) return "deliverable";
  if (value.startsWith("https://")) return "external-object";
  return "artifact";
}
function artifactLabel(ref, system) {
  const value = canonicalArtifactRef(ref);
  const kind = artifactType(value);
  if (kind === "context-snapshot") return "Context Snapshot";
  if (kind === "collector-output") return `Coleta \xB7 ${readableRef(basename2(value.slice("collector-output:".length)).replace(/\.[^.]+$/, ""))}`;
  if (kind === "instruction") return "Instru\xE7\xE3o da rotina";
  if (kind === "deliverable") {
    const file3 = basename2(value).replace(/\.[^.]+$/, "");
    return `Entrega \xB7 ${readableRef(file3 || system.result.output_type)}`;
  }
  if (value.includes("app.clickup.com/")) return "Objeto no ClickUp";
  if (value.includes("drive.google.com/")) return "Objeto no Drive";
  const file2 = basename2(value).replace(/\.[^.]+$/, "");
  return file2 && file2 !== "." ? readableRef(file2) : "Artefato observado";
}
function artifactState(current, candidate) {
  const rank = { declared: 0, gap: 1, pending: 2, running: 3, skipped: 4, denied: 5, failed: 6, completed: 7 };
  return (rank[candidate] ?? 0) >= (rank[current] ?? 0) ? candidate : current;
}
function ensureArtifact(graph, ref, system, state2 = "completed", { selected = false } = {}) {
  const canonical3 = canonicalArtifactRef(ref);
  const id3 = stableId("artifact", canonical3);
  const existing = graph.nodes.find((node2) => node2.id === id3);
  const pointer = String(ref).includes(":json-pointer:");
  if (existing) {
    existing.state = artifactState(existing.state, state2);
    existing.actual = true;
    existing[ARTIFACT_REFS].add(String(ref));
    if (pointer || selected) existing[ARTIFACT_POINTERS].add(String(ref));
    existing.details.reference_count = existing[ARTIFACT_REFS].size;
    existing.details.selected_pointer_count = existing[ARTIFACT_POINTERS].size;
    return id3;
  }
  const node = graphNode(id3, "artifact", artifactLabel(canonical3, system), state2, {
    ref: canonical3,
    artifact_type: artifactType(canonical3),
    reference_count: 1,
    selected_pointer_count: pointer || selected ? 1 : 0,
    ...canonical3.startsWith("https://") ? { external_url: canonical3 } : {}
  });
  node.actual = true;
  node[ARTIFACT_REFS] = /* @__PURE__ */ new Set([String(ref)]);
  node[ARTIFACT_POINTERS] = new Set(pointer || selected ? [String(ref)] : []);
  graph.nodes.push(node);
  return id3;
}
function addActualEdge(graph, source, target, relation, state2 = "completed") {
  if (!source || !target || source === target) return;
  const existing = graph.edges.find((edge2) => edge2.source === source && edge2.target === target && edge2.relation === relation);
  if (existing) {
    existing.actual = true;
    existing.state = state2;
    return;
  }
  const edge = graphEdge(stableId("edge", `${source}|${target}|${relation}`), source, target, relation, state2);
  edge.actual = true;
  graph.edges.push(edge);
}
function traceNodeId(event) {
  if (event.source_ref) return `source:${event.source_ref}`;
  if (event.step_type === "collector") return "collector";
  if (event.step_type === "retrieval") return "retrieval";
  if (event.step_type === "skill" && event.skill_ref) return `skill:${event.skill_ref}`;
  if (event.step_type === "model" && event.model_ref) return `model:${event.model_ref}`;
  if (event.step_type === "connector" && event.connector_ref) return `connector:${event.connector_ref}`;
  if (event.step_type === "capability" || event.step_type === "run") return "capability";
  if (event.step_type === "output") return "output";
  if (event.step_type === "eval") return "gate:1";
  if (event.step_type === "judgment") return "judgment";
  return null;
}
var TRACE_TERMINAL_STATES = /* @__PURE__ */ new Set(["completed", "failed", "denied", "skipped"]);
var TRACE_TIMED_TYPES = /* @__PURE__ */ new Set(["collector", "retrieval", "capability", "model", "output", "eval"]);
function traceTime(value) {
  const parsed = Date.parse(value || "");
  return Number.isFinite(parsed) ? parsed : null;
}
function receiptDuration(startedAt, completedAt) {
  const start = traceTime(startedAt);
  const end = traceTime(completedAt);
  return start !== null && end !== null && end >= start ? end - start : null;
}
function deriveTraceTiming(events, {
  startedAt = null,
  completedAt = null,
  origin = "recorded"
} = {}) {
  const ordered = [...events].sort((left, right) => left.sequence - right.sequence);
  const runStart = ordered.find((event) => event.step_type === "run" && event.state === "running");
  const runEnd = [...ordered].reverse().find((event) => event.step_type === "run" && TRACE_TERMINAL_STATES.has(event.state));
  const totalDuration = receiptDuration(
    runStart?.occurred_at || startedAt,
    runEnd?.occurred_at || completedAt
  );
  if (!ordered.length) return {
    assurance: "total-only",
    total_duration_ms: totalDuration,
    measured_duration_ms: 0,
    unattributed_duration_ms: totalDuration,
    coverage_ratio: 0,
    dominant_step_id: null,
    critical_path: [],
    nested_stages: []
  };
  const stages = [];
  const paired = /* @__PURE__ */ new Set();
  for (const [index, event] of ordered.entries()) {
    if (event.state !== "running" || event.step_type === "run" || !TRACE_TIMED_TYPES.has(event.step_type)) continue;
    const nextStart = ordered.findIndex((candidate, candidateIndex) => candidateIndex > index && candidate.step_id === event.step_id && candidate.step_type === event.step_type && candidate.state === "running");
    const windowEnd = nextStart === -1 ? ordered.length : nextStart;
    const terminal = ordered.slice(index + 1, windowEnd).filter((candidate) => candidate.step_id === event.step_id && candidate.step_type === event.step_type && TRACE_TERMINAL_STATES.has(candidate.state)).at(-1);
    const start = traceTime(event.occurred_at);
    const end = traceTime(terminal?.occurred_at);
    const duration = start !== null && end !== null && end >= start ? end - start : null;
    paired.add(`${event.step_type}:${event.step_id}`);
    stages.push({
      step_id: event.step_id,
      step_type: event.step_type,
      state: terminal?.state || "running",
      started_at: event.occurred_at,
      completed_at: terminal?.occurred_at || null,
      duration_ms: duration,
      measurement: duration === null ? "open" : "paired-events",
      node_id: traceNodeId(terminal || event),
      parent_step_id: event.parent_step_id,
      started_sequence: event.sequence
    });
  }
  for (const event of ordered) {
    const key2 = `${event.step_type}:${event.step_id}`;
    if (paired.has(key2) || event.step_type !== "model") continue;
    stages.push({
      step_id: event.step_id,
      step_type: event.step_type,
      state: event.state,
      started_at: null,
      completed_at: event.occurred_at,
      duration_ms: null,
      measurement: "completion-only",
      node_id: traceNodeId(event),
      parent_step_id: event.parent_step_id,
      started_sequence: event.sequence
    });
  }
  const judgment = [...ordered].reverse().find((event) => event.step_type === "judgment");
  const criticalPath = stages.filter((stage) => stage.parent_step_id === "run").sort((left, right) => left.started_sequence - right.started_sequence);
  if (judgment) criticalPath.push({
    step_id: judgment.step_id,
    step_type: judgment.step_type,
    state: judgment.state,
    started_at: judgment.occurred_at,
    completed_at: null,
    duration_ms: null,
    measurement: "state-marker",
    node_id: traceNodeId(judgment),
    parent_step_id: judgment.parent_step_id,
    started_sequence: judgment.sequence
  });
  const measured = criticalPath.reduce((sum, stage) => sum + (stage.duration_ms || 0), 0);
  const dominant = criticalPath.filter((stage) => stage.duration_ms !== null).sort((left, right) => right.duration_ms - left.duration_ms)[0] || null;
  const clean = (stage) => {
    const { started_sequence: _sequence, parent_step_id: _parent, ...publicStage } = stage;
    return {
      ...publicStage,
      share_of_total: stage.duration_ms !== null && totalDuration > 0 ? stage.duration_ms / totalDuration : null
    };
  };
  return {
    assurance: origin === "recorded" ? "event-derived" : "reconstructed-events",
    total_duration_ms: totalDuration,
    measured_duration_ms: measured,
    unattributed_duration_ms: totalDuration === null ? null : Math.max(0, totalDuration - measured),
    coverage_ratio: totalDuration > 0 ? Math.min(1, measured / totalDuration) : measured === 0 ? 0 : 1,
    dominant_step_id: dominant?.step_id || null,
    critical_path: criticalPath.map(clean),
    nested_stages: stages.filter((stage) => stage.parent_step_id !== "run").sort((left, right) => left.started_sequence - right.started_sequence).map(clean)
  };
}
function annotateTraceTiming(graph, timing) {
  for (const stage of [...timing.critical_path, ...timing.nested_stages]) {
    if (!stage.node_id) continue;
    const node = graph.nodes.find((item) => item.id === stage.node_id);
    if (!node) continue;
    node.details = {
      ...node.details,
      timing_measurement: stage.measurement,
      ...stage.duration_ms === null ? {} : {
        duration_ms: stage.duration_ms,
        duration_share: stage.share_of_total
      }
    };
  }
}
function runIdFromRef(ref) {
  return String(ref || "").startsWith("run-record:") ? String(ref).slice("run-record:".length) : null;
}
function materializeChain(root, graph, record2, selectedRunId, system) {
  if (!record2?.chain_id) return;
  const records = latestRunRecords(root).filter((item) => item.chain_id === record2.chain_id);
  const recordById = new Map(records.map((item) => [item.run_id, item]));
  const receipts = listHandoffReceipts(root).filter((item) => item.chain_id === record2.chain_id);
  for (const receipt2 of receipts) {
    const producerId = runIdFromRef(receipt2.producer_run_ref);
    const consumerId = runIdFromRef(receipt2.consumer_run_ref);
    if (!producerId || !consumerId || !recordById.has(producerId) || !recordById.has(consumerId)) continue;
    const endpoint = (runId, role) => {
      if (runId === selectedRunId) return role === "producer" ? "output" : "capability";
      const id3 = `run:${runId}`;
      if (!graph.nodes.some((node) => node.id === id3)) {
        const linked = recordById.get(runId);
        const node = graphNode(id3, "run", `Execu\xE7\xE3o \xB7 ${readableRef(linked.system_id)}`, linked.status === "completed" ? "completed" : "running", {
          run_id: runId,
          system_ref: linked.system_id,
          chain_id: linked.chain_id,
          mode: linked.mode,
          experiment_ref: linked.experiment_ref
        });
        node.actual = true;
        graph.nodes.push(node);
      }
      return id3;
    };
    const producerNode = endpoint(producerId, "producer");
    const consumerNode = endpoint(consumerId, "consumer");
    const artifactId = ensureArtifact(
      graph,
      receipt2.artifact.artifact_ref,
      system,
      receipt2.status === "accepted" ? "completed" : "pending"
    );
    const artifactNode = graph.nodes.find((node) => node.id === artifactId);
    artifactNode.details = {
      ...artifactNode.details,
      artifact_type: receipt2.artifact.artifact_type,
      schema_ref: receipt2.artifact.schema_ref,
      schema_version: receipt2.artifact.schema_version,
      sha256: receipt2.artifact.sha256,
      handoff_ref: receipt2.handoff_ref,
      handoff_receipt_ref: `handoff-receipt:${receipt2.receipt_id}`,
      chain_id: receipt2.chain_id,
      mode: receipt2.mode,
      experiment_ref: receipt2.experiment_ref
    };
    const state2 = receipt2.status === "accepted" ? "completed" : "pending";
    addActualEdge(graph, producerNode, artifactId, "hands-off", state2);
    addActualEdge(graph, artifactId, consumerNode, "consumed-by", state2);
  }
}
function materializeRecordedArtifacts(graph, events, system) {
  const accessBySource = /* @__PURE__ */ new Map();
  for (const event of events) {
    const stepNode = traceNodeId(event);
    if (event.source_ref) {
      const accessRefs = [...event.input_refs, ...event.output_refs].filter((ref) => ref.startsWith("access-receipt:"));
      const refs4 = /* @__PURE__ */ new Set([...accessBySource.get(event.source_ref) || [], ...accessRefs]);
      accessBySource.set(event.source_ref, refs4);
      setNode(graph, `source:${event.source_ref}`, event.state, true, { access_receipt_count: refs4.size });
    }
    if (event.step_type === "collector") {
      const bindingRefs = event.input_refs.filter((ref) => /^collector-[a-z0-9-]+$/.test(ref));
      setNode(
        graph,
        "collector",
        event.state,
        true,
        bindingRefs.length ? { binding_refs: bindingRefs } : {}
      );
    }
    for (const ref of event.input_refs.filter((value) => artifactReference(value) && !(event.step_type === "collector" && /^collector-[a-z0-9-]+$/.test(value)))) {
      const artifactId = ensureArtifact(graph, ref, system, event.state, { selected: Boolean(event.source_ref) });
      if (event.source_ref && event.step_type === "retrieval") {
        addActualEdge(graph, `source:${event.source_ref}`, artifactId, "selects", event.state);
      } else addActualEdge(graph, artifactId, stepNode, "consumed-by", event.state);
    }
    if (event.step_type === "run") continue;
    for (const ref of event.output_refs.filter(artifactReference)) {
      const artifactId = ensureArtifact(graph, ref, system, event.state);
      addActualEdge(graph, stepNode, artifactId, "produces", event.state);
    }
  }
}
function materializeRecordArtifacts(graph, record2, receipt2, system) {
  if (record2?.protocol_version === 2) {
    for (const access of record2.context_snapshot.accesses) {
      const sourceId = `source:${access.source_ref.id}`;
      setNode(graph, sourceId, "completed", true, { selected_ref_count: access.selected_refs.length });
      for (const ref of access.selected_refs.filter(artifactReference)) {
        const artifactId = ensureArtifact(graph, ref, system, "completed", { selected: true });
        addActualEdge(graph, sourceId, artifactId, "selects");
        addActualEdge(graph, artifactId, "capability", "grounds");
      }
    }
    for (const ref of record2.output_refs.filter(artifactReference)) {
      const artifactId = ensureArtifact(graph, ref, system);
      addActualEdge(graph, "output", artifactId, "produces");
      addActualEdge(graph, artifactId, "judgment", "awaits-judgment", record2.human_decision === "pending" ? "pending" : "completed");
    }
  }
  for (const ref of (receipt2.input_refs || []).filter(artifactReference)) {
    const artifactId = ensureArtifact(graph, ref, system);
    if (ref.startsWith("collector-output:")) addActualEdge(graph, "collector", artifactId, "produces");
    addActualEdge(graph, artifactId, "capability", "consumed-by");
  }
  if (receipt2.output_ref && artifactReference(receipt2.output_ref)) {
    const artifactId = ensureArtifact(graph, receipt2.output_ref, system, receipt2.status === "completed" ? "completed" : receipt2.status);
    addActualEdge(graph, "output", artifactId, "produces", receipt2.status === "completed" ? "completed" : receipt2.status);
    addActualEdge(graph, artifactId, "judgment", "awaits-judgment", "pending");
  }
}
function applyReconstructedTrace(root, graph, receipt2, record2) {
  for (const ref of receipt2.input_refs || []) {
    if (ref.startsWith("source:")) setNode(graph, `source:${ref.slice("source:".length)}`, "completed");
    if (ref.startsWith("collector-output:")) setNode(graph, "collector", "completed");
  }
  if (record2?.protocol_version === 2) {
    setNode(graph, "retrieval", "completed", true, {
      selected_source_count: record2.context_snapshot.accesses.length,
      gap_count: record2.context_snapshot.gaps.length
    });
    for (const access of record2.context_snapshot.accesses) setNode(graph, `source:${access.source_ref.id}`, "completed");
    const system = findSystem(root, receipt2.system_ref);
    for (const gap of record2.context_snapshot.gaps) {
      const source = system.sources.find((item) => item.role === gap.source_role);
      if (source?.source_id) setNode(graph, `source:${source.source_id}`, "gap", true, { reason_code: gap.reason_code });
    }
  }
  const executionState = receipt2.status === "completed" ? "completed" : receipt2.status;
  setNode(graph, "capability", executionState, true, { reason_code: receipt2.reason_code });
  if (receipt2.output_ref) setNode(graph, "output", executionState);
  if (record2?.eval?.passed !== null && record2?.eval?.passed !== void 0) {
    for (const node of graph.nodes.filter((item) => item.kind === "gate")) {
      setNode(graph, node.id, record2.eval.passed ? "completed" : "failed");
    }
  }
}
function executionGraphBase(base) {
  const stageIds = new Set(base.nodes.filter((node) => node.kind === "stage").map((node) => node.id));
  if (!stageIds.size) return base;
  return {
    ...base,
    nodes: base.nodes.filter((node) => !stageIds.has(node.id)),
    edges: [
      ...base.edges.filter((edge) => !stageIds.has(edge.source) && !stageIds.has(edge.target)),
      graphEdge("edge:capability:output", "capability", "output", "produces")
    ]
  };
}
function buildRunGraph(root, receiptId) {
  const receipt2 = receiptById(root, receiptId);
  const record2 = latestRunRecords(root).find((item) => item.run_id === receipt2.run_id) || null;
  const system = findSystem(root, receipt2.system_ref);
  const base = executionGraphBase(buildSystemGraph(root, receipt2.system_ref));
  const graph = {
    ...base,
    graph_type: "run",
    graph_ref: receipt2.run_id,
    title: `Run \xB7 ${receipt2.routine_id}`,
    subtitle: `${receipt2.status} \xB7 ${receipt2.reason_code}`,
    run: {
      run_id: receipt2.run_id,
      receipt_ref: receipt2.synthetic_from_run_record ? null : `routine-receipt:${receipt2.receipt_id}`,
      started_at: receipt2.started_at,
      completed_at: receipt2.completed_at,
      status: receipt2.status,
      reason_code: receipt2.reason_code,
      eval_passed: record2?.eval?.passed ?? null,
      chain_id: record2?.chain_id ?? null,
      mode: record2?.mode ?? null,
      experiment_ref: record2?.experiment_ref ?? null,
      handoff_refs: record2?.handoff_refs ?? [],
      canonical_ref: `run-record:${receipt2.run_id}`,
      routine_receipt_ref: receipt2.synthetic_from_run_record ? null : `routine-receipt:${receipt2.receipt_id}`
    }
  };
  let events = [];
  try {
    events = readExecutionTrace(root, receipt2.run_id);
  } catch {
    events = [];
  }
  if (events.length) {
    graph.trace_origin = events[0].extensions?.origin === "reconstructed" ? "reconstructed" : "recorded";
    graph.trace_ref = `execution-trace:${events[0].trace_id}`;
    graph.trace_events = events.length;
    graph.trace_timeline = [...events].sort((left, right) => left.sequence - right.sequence).map((event) => ({
      sequence: event.sequence,
      step_id: event.step_id,
      step_type: event.step_type,
      state: event.state,
      occurred_at: event.occurred_at,
      elapsed_ms: Math.max(0, Date.parse(event.occurred_at) - Date.parse(events[0].occurred_at)),
      node_id: traceNodeId(event)
    }));
    graph.trace_timing = deriveTraceTiming(events, {
      startedAt: receipt2.started_at,
      completedAt: receipt2.completed_at,
      origin: graph.trace_origin
    });
    applyRecordedTrace(graph, events);
    annotateTraceTiming(graph, graph.trace_timing);
  } else {
    graph.trace_origin = "reconstructed";
    graph.trace_ref = null;
    graph.trace_events = 0;
    graph.trace_timeline = [];
    graph.trace_timing = deriveTraceTiming([], {
      startedAt: receipt2.started_at,
      completedAt: receipt2.completed_at,
      origin: "reconstructed"
    });
    applyReconstructedTrace(root, graph, receipt2, record2);
  }
  const tracedJudgment = graph.nodes.find((node) => node.id === "judgment");
  if (receipt2.synthetic_from_run_record) {
    if (!tracedJudgment?.actual) {
      setNode(graph, "judgment", record2?.human_decision === "approved" ? "completed" : record2?.human_decision === "rejected" ? "failed" : "pending", true, {
        verdict: record2?.human_decision || "pending"
      });
    }
  } else {
    try {
      const judgment = judgmentView(root, receipt2.receipt_id);
      if (judgment.status === "decided") setNode(graph, "judgment", judgment.verdict === "approved" ? "completed" : judgment.verdict === "rejected" ? "failed" : "pending", true, {
        verdict: judgment.verdict,
        decided_at: judgment.decided_at
      });
      else if (judgment.status === "unavailable") setNode(graph, "judgment", "failed", true, {
        verdict: null,
        reason_code: judgment.reason_code || "judgment-state-unavailable"
      });
      else if (!tracedJudgment?.actual) setNode(graph, "judgment", "pending", true, { verdict: "pending" });
    } catch {
      setNode(graph, "judgment", "failed", true, {
        verdict: null,
        reason_code: "judgment-state-unavailable"
      });
    }
  }
  const recordedGates = graph.nodes.filter((node) => node.kind === "gate" && node.actual);
  if (recordedGates.length === 0 && record2?.eval?.passed !== null && record2?.eval?.passed !== void 0) {
    for (const node of graph.nodes.filter((item) => item.kind === "gate")) {
      setNode(graph, node.id, record2.eval.passed ? "completed" : "failed", true);
    }
  }
  materializeRecordArtifacts(graph, record2, receipt2, system);
  if (events.length) materializeRecordedArtifacts(graph, events, system);
  materializeChain(root, graph, record2, receipt2.run_id, system);
  activateEdges(graph);
  return applyLayout(root, `run-${receipt2.run_id}`, graph);
}

// ../scripts/lib/company-map-spec.mjs
import { readdirSync as readdirSync17, readFileSync as readFileSync21, statSync as statSync6, lstatSync as lstatSync15, realpathSync as realpathSync12 } from "node:fs";
import { resolve as resolve21, sep as sep21, relative as relative20, dirname as dirname7, basename as basename3, extname } from "node:path";
var NOTE_LIMIT_DEFAULT = 200;
var WALK_LIMIT = 2e4;
function entryById(entryId) {
  for (const group of COMPANY_MAP_SPEC) {
    const entry = group.entries.find((item) => item.id === entryId);
    if (entry) return { group, entry };
  }
  return null;
}
function insideRoot(root, absolute) {
  const base = resolve21(root) + sep21;
  return absolute.startsWith(base);
}
function firstTitle(content) {
  const match = content.match(/^ {0,3}#{1,6}[ \t]+(.+)$/m);
  return match ? match[1].replace(/[ \t]+#+[ \t]*$/, "").trim() : null;
}
function frontmatterOf(content) {
  if (!content.startsWith("---")) return {};
  const end = content.indexOf("\n---", 3);
  if (end < 0) return {};
  const block = content.slice(3, end);
  const out = {};
  let pendingKey = null;
  const list5 = [];
  const flush = () => {
    if (pendingKey && list5.length) out[pendingKey] = `[${list5.join(", ")}]`;
    list5.length = 0;
  };
  for (const line of block.split("\n")) {
    const m = line.match(/^([\p{L}_-]+):\s*(.*)$/u);
    if (m) {
      flush();
      pendingKey = m[1];
      out[m[1]] = m[2].trim().replace(/^"|"$/g, "");
    } else if (pendingKey && /^\s+-\s+/.test(line)) list5.push(line.replace(/^\s+-\s+/, "").trim());
  }
  flush();
  return out;
}
var MAX_NOTE_BYTES = 2 * 1024 * 1024;
var TEXT_EXTENSIONS = /* @__PURE__ */ new Set([".md", ".json", ".txt", ".html"]);
function blockedNotePath(path) {
  return /(^|\/)(02-dados-terceiros|grupos-raw|grupo|grupos|membros|clientes|node_modules|\.git|secrets?|credentials?)(\/|$)/i.test(path) || /(^|\/)(\.env(?:\..*)?|[^/]*(?:credential|secret|token)[^/]*|[^/]*\.(?:pem|key|p12))$/i.test(path) || /(?:entrevista-pm-paypal|\/fichas(?:\/|-)|\/runtime\/(?:credentials|members|contacts))/i.test(path) || path.split("/").some((part) => part.startsWith(".") && ![".cerebro", ".agents", ".automacao"].includes(part));
}
function safeNotePath(root, path, { requireAllowed = true } = {}) {
  if (typeof path !== "string" || !path || path.includes("\\") || /[\x00-\x1f]/.test(path) || path.startsWith("/") || path.split("/").some((part) => part === ".." || part === ".") || !TEXT_EXTENSIONS.has(extname(path).toLowerCase())) return { ok: false, reason: "caminho-invalido" };
  if (blockedNotePath(path)) return { ok: false, reason: "conteudo-restrito" };
  const base = resolve21(root);
  const absolute = resolve21(base, path);
  if (!insideRoot(base, absolute)) return { ok: false, reason: "fora-da-raiz" };
  if (requireAllowed && !COMPANY_MAP_SPEC.some((group) => group.entries.some((entry) => !entry.sealed && entry.refs.some((ref) => path === ref || path.startsWith(ref + "/"))))) return { ok: false, reason: "fora-do-mapa" };
  if (extname(path).toLowerCase() === ".txt" && !COMPANY_TEXT_ROOTS.some((prefix) => path.startsWith(prefix + "/"))) return { ok: false, reason: "formato-restrito" };
  try {
    let cursor = base;
    for (const part of path.split("/")) {
      cursor = resolve21(cursor, part);
      if (lstatSync15(cursor).isSymbolicLink()) return { ok: false, reason: "symlink-restrito" };
    }
    const real = realpathSync12(absolute);
    const realBase = realpathSync12(base);
    if (!real.startsWith(realBase + sep21)) return { ok: false, reason: "fora-da-raiz" };
    const stats = statSync6(real);
    if (!stats.isFile()) return { ok: false, reason: "nao-e-arquivo" };
    if (stats.size > MAX_NOTE_BYTES) return { ok: false, reason: "arquivo-grande" };
    return { ok: true, absolute: real, path, stats };
  } catch {
    return { ok: false, reason: "ilegivel" };
  }
}
function redactNoteText(text6) {
  return String(text6).replace(/[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/gi, "[e-mail omitido]").replace(/(?:\+?55[ .()-]*)?\(?[1-9][0-9]\)?[ .-]*(?:9[ .-]*)?[0-9]{4}[ .-]+[0-9]{4}\b/g, "[telefone omitido]");
}
function containsSecret(text6) {
  return /-----BEGIN (?:RSA |EC |OPENSSH )?PRIVATE KEY-----|\b(?:sk-[A-Za-z0-9_-]{20,}|gh[pousr]_[A-Za-z0-9]{20,}|EA[A-Za-z0-9]{70,})\b/.test(text6) || /["']?(?:access_token|api_key|api_secret|client_secret|private_key|password)["']?\s*[:=]\s*["'][^"'\n]{12,}["']/i.test(text6);
}
function htmlAsText(text6) {
  return text6.replace(/<!--[^]*?-->/g, "").replace(/<(script|style|iframe|object|svg)\b[^>]*>[^]*?<\/\1\s*>/gi, "").replace(/<(?:br|hr)\b[^>]*>|<\/(?:p|div|h[1-6]|li|section|tr|article)>/gi, "\n").replace(/<[^>]*>/g, "").replace(/&nbsp;/gi, " ").replace(/&amp;/gi, "&").replace(/&lt;/gi, "<").replace(/&gt;/gi, ">").replace(/&quot;/gi, '"').replace(/&#39;/gi, "'").replace(/\n[ \t]+/g, "\n").replace(/\n{3,}/g, "\n\n").trim();
}
function readNote(root, relativePath) {
  const checked = safeNotePath(root, relativePath);
  if (!checked.ok) return checked;
  let content;
  try {
    content = readFileSync21(checked.absolute, "utf8");
  } catch {
    return { ok: false, reason: "ilegivel" };
  }
  if (content.includes("\0") || containsSecret(content)) return { ok: false, reason: "conteudo-restrito" };
  content = redactNoteText(content);
  const extension = extname(relativePath).toLowerCase();
  const front = extension === ".md" ? frontmatterOf(content) : {};
  const boundary = content.startsWith("---") ? content.indexOf("\n---", 3) : -1;
  let body = extension === ".md" && boundary >= 0 ? content.slice(boundary + 4) : content;
  const format = extension === ".html" ? "txt" : extension.slice(1);
  const htmlTitle = extension === ".html" ? content.match(/<title[^>]*>([^]*?)<\/title>/i)?.[1] : null;
  const declaredTitle = [front.title, front.titulo, front["t\xEDtulo"]].find((value) => typeof value === "string" && value.trim());
  if (extension === ".html") body = htmlAsText(body);
  return { ok: true, path: relativePath, title: declaredTitle?.trim().replace(/^'|'$/g, "") ?? firstTitle(body) ?? htmlTitle ?? basename3(relativePath), frontmatter: front, body, format };
}
function walkReadableNotes(root, ref, { limit = WALK_LIMIT } = {}) {
  if (blockedNotePath(ref)) return [];
  const out = [];
  const base = resolve21(root);
  function walk(path) {
    if (out.length >= limit || blockedNotePath(path)) return;
    const absolute = resolve21(base, path);
    if (!insideRoot(base, absolute)) return;
    let stats;
    try {
      stats = lstatSync15(absolute);
    } catch {
      return;
    }
    if (stats.isSymbolicLink()) return;
    if (stats.isDirectory()) {
      let children;
      try {
        children = readdirSync17(absolute, { withFileTypes: true });
      } catch {
        return;
      }
      for (const entry of children.sort((a, b) => a.name.localeCompare(b.name))) walk(`${path}/${entry.name}`);
    } else if (stats.isFile() && TEXT_EXTENSIONS.has(extname(path).toLowerCase())) {
      const checked = safeNotePath(root, path);
      if (checked.ok) out.push({ path, absolute: checked.absolute, mtime: checked.stats.mtimeMs });
    }
  }
  walk(ref);
  return out;
}
function indexNotePaths(root) {
  const files = /* @__PURE__ */ new Map();
  for (const group of COMPANY_MAP_SPEC) for (const entry of group.entries) if (!entry.sealed) {
    for (const ref of entry.refs) for (const file2 of walkReadableNotes(root, ref)) files.set(file2.path, file2);
  }
  return [...files.values()];
}
function resolveNoteReference(root, target, { fromPath = "", files } = {}) {
  if (typeof target !== "string" || !target || target.length > 1500 || /[\x00-\x1f\\]/.test(target)) return { ok: false, reason: "referencia-invalida" };
  let value;
  try {
    value = decodeURIComponent(target).replace(/^\[\[|\]\]$/g, "").split("|")[0].split("#")[0].trim();
  } catch {
    return { ok: false, reason: "referencia-invalida" };
  }
  if (!value || /^(?:[a-z]+:|\/)/i.test(value) || blockedNotePath(value.split("/").filter((part) => part !== ".." && part !== ".").join("/"))) return { ok: false, reason: "referencia-restrita" };
  const candidates = [];
  if (fromPath && safeNotePath(root, fromPath).ok) candidates.push(relative20(resolve21(root), resolve21(root, dirname7(fromPath), value)).split(sep21).join("/"));
  candidates.push(value);
  for (const candidate of candidates) {
    for (const path of extname(candidate) ? [candidate] : [candidate + ".md", candidate + ".txt"]) if (safeNotePath(root, path).ok) return { ok: true, path };
  }
  if (value.includes("/") || value.includes("..")) return { ok: false, reason: "nao-encontrada" };
  const wanted = basename3(value, extname(value)).normalize("NFC").toLocaleLowerCase("pt-BR");
  const matches2 = (files ?? indexNotePaths(root)).filter((file2) => basename3(file2.path, extname(file2.path)).normalize("NFC").toLocaleLowerCase("pt-BR") === wanted);
  return matches2.length === 1 ? { ok: true, path: matches2[0].path } : { ok: false, reason: matches2.length ? "referencia-ambigua" : "nao-encontrada", matches: matches2.length };
}
function scanCompanyMap(root) {
  return COMPANY_MAP_SPEC.map((group) => ({
    id: group.id,
    name: group.name,
    purpose: group.purpose,
    entries: group.entries.map((entry) => {
      const files = /* @__PURE__ */ new Map();
      if (!entry.sealed) for (const ref of entry.refs) for (const file2 of walkReadableNotes(root, ref)) files.set(file2.path, file2);
      const latest = Math.max(0, ...[...files.values()].map((file2) => file2.mtime));
      return { id: entry.id, name: entry.name, refs: entry.refs, sealed: Boolean(entry.sealed), view: entry.view ?? null, exists: files.size > 0, notes: files.size, latest_modified: latest ? new Date(latest).toISOString() : null };
    })
  }));
}
function listCollectionNotes(root, entryId, { limit = NOTE_LIMIT_DEFAULT, query = "" } = {}) {
  const found = entryById(entryId);
  if (!found) return { ok: false, reason: "entrada-desconhecida", notes: [] };
  const { group, entry } = found;
  if (entry.sealed) return { ok: true, sealed: true, group: group.name, entry: entry.name, total: 0, notes: [] };
  const files = /* @__PURE__ */ new Map();
  for (const ref of entry.refs) for (const file2 of walkReadableNotes(root, ref)) files.set(file2.path, file2);
  const needle = String(query).toLocaleLowerCase("pt-BR").trim();
  const notes = [...files.values()].sort((a, b) => b.mtime - a.mtime).flatMap((file2) => {
    const note = readNote(root, file2.path);
    if (!note.ok || needle && !`${note.title} ${file2.path} ${note.body}`.toLocaleLowerCase("pt-BR").includes(needle)) return [];
    const front = note.frontmatter;
    return [{ path: file2.path, title: note.title, tipo: front.tipo ?? note.format, fonte: front.fonte ?? null, criado: front.criado ?? null, pode_ir_comunidade: front["pode-ir-comunidade"] ?? null, modified: new Date(file2.mtime).toISOString() }];
  });
  return { ok: true, sealed: false, group: group.name, entry: entry.name, total: notes.length, notes: notes.slice(0, Math.min(2e4, Math.max(1, limit))) };
}

// ../scripts/lib/painel-evidence.mjs
var IDS = /^[a-zA-Z0-9][a-zA-Z0-9_.:-]{0,200}$/;
var GRAPH_DETAIL_KEYS = /* @__PURE__ */ new Set(["ref", "version", "role", "required", "purpose", "order", "state_ref", "input", "output", "gate", "result", "done", "authority", "questions", "direction", "artifact_type", "verdict", "decided_at", "reason_code", "selected_ref_count", "access_receipt_count", "reference_count", "selected_pointer_count", "duration_ms", "timing_measurement"]);
var STAGES2 = [
  ["sources", "Fontes consultadas"],
  ["context", "Contexto selecionado"],
  ["recommendation", "Recomenda\xE7\xE3o ou entrega"],
  ["decision", "Decis\xE3o humana"],
  ["action", "A\xE7\xE3o realizada"],
  ["results", "Resultados observados"],
  ["next", "Ajuste seguinte"]
];
var text3 = (value, max = 600) => typeof value === "string" ? value.slice(0, max) : "";
var array = (value) => Array.isArray(value) ? value : [];
var unique4 = (values) => [...new Set(values.filter(Boolean))];
function evidenceRef(value, label = null) {
  const ref = typeof value === "string" ? value : value?.id || value?.ref;
  if (!ref || typeof ref !== "string" || ref.length > 1e3 || /[\r\n@]|(?:token|secret|password|api[_-]?key)[=:]/i.test(ref)) return null;
  const normalized = ref.replaceAll("\\", "/");
  if (normalized.startsWith("/") || normalized.split("/").includes("..") || normalized.includes("02-dados-terceiros/") || /founders\/(grupos|grupo)\//.test(normalized)) return null;
  const isNote = /^(01-nucleo-privado|docs|escrita)\/.*\.(md|txt|html)$/.test(normalized) || /^\.cerebro\/runtime\/outputs\/routines\/[A-Za-z0-9_.-]+\.md$/.test(normalized);
  const pointer = normalized.match(/:json-pointer:\/(.+)$/)?.[1];
  const readable2 = pointer ? `Contexto selecionado: ${pointer.replaceAll("_", " ")}` : normalized.startsWith(".cerebro/runtime/outputs/routines/") ? "Abrir relat\xF3rio desta execu\xE7\xE3o" : normalized.startsWith("routine-receipt:") || normalized.startsWith("run-record:") ? "Recibo desta execu\xE7\xE3o" : ref;
  return { id: ref, label: text3(label || readable2, 180), ...isNote ? { path: normalized } : {}, kind: "reference" };
}
function refs(values) {
  return array(values).map((value) => evidenceRef(value)).filter(Boolean);
}
function reportDate(note) {
  const value = note.frontmatter?.["data-referencia"] || note.frontmatter?.data || note.frontmatter?.criado || note.title || "";
  const iso2 = String(value).match(/\b(20\d{2}-\d{2}-\d{2})\b/)?.[1];
  const br = String(value).match(/\b(\d{2})\/(\d{2})\/(20\d{2})\b/);
  const date7 = iso2 || (br ? `${br[3]}-${br[2]}-${br[1]}` : null);
  return date7 && Number.isFinite(Date.parse(date7)) ? date7 : null;
}
function runDeliveries(root, record2, receipt2) {
  return refs(unique4([...array(record2?.output_refs), receipt2?.output_ref])).filter((ref) => ref.path).map((ref) => {
    const runId = receipt2?.run_id || record2?.run_id;
    const versionState = runId && ref.path === `.cerebro/runtime/outputs/routines/${runId}.md` ? "run-file" : "current-file";
    const note = readNote(root, ref.path);
    if (!note.ok) return { ...ref, available: false, report_date: null, version_state: versionState, linked_refs: [] };
    const linked = /* @__PURE__ */ new Map();
    for (const match of note.body.matchAll(/(?<!!)\[([^\]\n]+)\]\(([^)\n]+)\)/g)) {
      let target = match[2].replace(/^<|>$/g, "");
      try {
        target = decodeURIComponent(target);
      } catch {
        continue;
      }
      const base = resolve22(root) + sep22;
      if (target.startsWith(base)) target = target.slice(base.length);
      else if (target.startsWith("/") || /^[a-z]+:/i.test(target)) continue;
      const resolved = resolveNoteReference(root, target, { fromPath: ref.path });
      if (!resolved.ok || resolved.path === ref.path) continue;
      const cited = evidenceRef(resolved.path);
      if (!cited?.path) continue;
      const linkedNote = readNote(root, cited.path);
      if (linkedNote.ok) linked.set(cited.path, { ...cited, label: text3(linkedNote.title, 180), relation: "documento citado no relat\xF3rio" });
    }
    const title = note.title && !/^routine-run-.*\.md$/.test(note.title) ? note.title : "Relat\xF3rio da execu\xE7\xE3o";
    return { ...ref, label: text3(title, 180), available: true, report_date: reportDate(note), version_state: versionState, linked_refs: [...linked.values()] };
  });
}
function callCaptureCoverage(root, { now = /* @__PURE__ */ new Date() } = {}) {
  let latest = null, count = 0, unreadable = 0;
  const scan2 = (path) => {
    let entries;
    try {
      if (lstatSync16(path).isSymbolicLink()) return;
      entries = readdirSync18(path, { withFileTypes: true });
    } catch {
      unreadable++;
      return;
    }
    for (const entry of entries) {
      if (entry.name.startsWith("_") || entry.isSymbolicLink()) continue;
      const child = resolve22(path, entry.name);
      if (entry.isDirectory()) {
        scan2(child);
        continue;
      }
      if (!entry.isFile() || !entry.name.endsWith(".md")) continue;
      let fd;
      try {
        fd = openSync5(child, "r");
        const buffer = Buffer.alloc(8192);
        const length = readSync2(fd, buffer, 0, buffer.length, 0);
        const front = buffer.toString("utf8", 0, length).match(/^---\r?\n([\s\S]*?)\r?\n---/)?.[1];
        const date7 = front?.match(/^(?:data|criado):\s*["']?(20\d{2}-\d{2}-\d{2})/m)?.[1];
        if (date7) {
          count++;
          if (!latest || date7 > latest) latest = date7;
        }
      } catch {
        unreadable++;
      } finally {
        if (fd !== void 0) closeSync5(fd);
      }
    }
  };
  for (const path of ["01-nucleo-privado/founders/dailies", "02-dados-terceiros/calls-raw"]) scan2(resolve22(root, path));
  return {
    status: "unverified",
    checked_at: now.toISOString(),
    latest_source_date: latest,
    label: latest ? `\xDAltima call no acervo local: ${latest.split("-").reverse().join("/")}` : "Nenhuma call datada encontrada no acervo local",
    notes: [
      `O pulso procura arquivos j\xE1 capturados; concluir a rotina n\xE3o comprova que todas as reuni\xF5es chegaram. ${count} arquivos de calls datados nesta leitura.`,
      "A captura do Fathom roda separadamente no GitHub Actions. Conferir a captura, a publica\xE7\xE3o e a sincroniza\xE7\xE3o local antes de concluir que n\xE3o houve calls novas.",
      ...unreadable ? ["Parte do acervo n\xE3o p\xF4de ser inspecionada; a cobertura \xE9 parcial."] : []
    ]
  };
}
function workflowDataCoverage(root, workflow, now) {
  return workflow.legacy.routine_refs.includes("cerebro-pulso-diario") ? callCaptureCoverage(root, { now }) : null;
}
function readConfinedJson(root, path) {
  const base = realpathSync13(root);
  const full = realpathSync13(resolve22(base, path));
  if (!full.startsWith(base + sep22) || statSync7(full).size > 2e6) throw new Error("definition-outside-root");
  return JSON.parse(readFileSync22(full, "utf8"));
}
function safeEvidenceGraph(graph) {
  if (!graph) return null;
  const nodes = array(graph.nodes).slice(0, 400).map((node) => {
    const details = {};
    for (const [key2, value] of Object.entries(node.details || {})) {
      if (!GRAPH_DETAIL_KEYS.has(key2)) continue;
      if (key2 === "ref" && !evidenceRef(value)) continue;
      if (typeof value === "string") details[key2] = text3(value);
      else if (typeof value === "number" || typeof value === "boolean" || value === null) details[key2] = value;
      else if (Array.isArray(value)) details[key2] = value.filter((v) => typeof v === "string").slice(0, 20).map((v) => text3(v));
    }
    const ref = evidenceRef(node.details?.ref);
    const href = ref?.path ? `/cerebro/nota?path=${encodeURIComponent(ref.path)}` : void 0;
    return { id: text3(node.id, 220), kind: text3(node.kind, 60), label: text3(node.label, 180), state: text3(node.state, 60), actual: node.actual === true, details, ...href ? { href } : {} };
  });
  const ids = new Set(nodes.map((node) => node.id));
  return { title: text3(graph.title, 180), nodes, edges: array(graph.edges).filter((edge) => ids.has(edge.source) && ids.has(edge.target)).map((edge) => ({ id: text3(edge.id, 450), source: edge.source, target: edge.target, relation: text3(edge.relation, 100), state: text3(edge.state, 60), actual: edge.actual === true })) };
}
function definitionFor(root, workflow, routines) {
  for (const routine of routines.filter((item) => workflow.legacy.routine_refs.includes(item.routine_id))) {
    const imported = routine.extensions?.workflow;
    if (!imported?.import_ref) continue;
    try {
      if (!imported.import_ref.startsWith(".cerebro/workflows/imports/")) continue;
      const manifest = readConfinedJson(root, imported.import_ref);
      if (!/^[a-zA-Z0-9_.-]+\.json$/.test(manifest.definition_file || "")) continue;
      const path = relative21(resolve22(root), resolve22(root, dirname8(imported.import_ref), manifest.definition_file)).split(sep22).join("/");
      const definition = readConfinedJson(root, path);
      if (definition.id !== imported.id || String(definition.version) !== String(imported.version)) continue;
      return {
        path: workflow.legacy.workflow_definition_ref || path,
        version: String(definition.version),
        steps: array(definition.steps).map((step) => ({ id: text3(step.id, 100), name: text3(step.title || step.name, 180), description: text3(step.description || step.submission_criterion || ""), requires: array(step.requires).map((v) => text3(v, 100)), produces: step.handoff ? array(definition.handoffs).filter((h) => h.id === step.handoff).map((h) => text3(h.artifact)) : array(step.produces).map((v) => text3(v)), executor: text3(step.mode || definition.executor?.kind) || null }))
      };
    } catch {
    }
  }
  return null;
}
function readEvidenceStore(root) {
  const warnings = [];
  const read = (fn, label) => {
    try {
      return fn(root);
    } catch {
      warnings.push(`N\xE3o foi poss\xEDvel ler ${label}.`);
      return [];
    }
  };
  return { records: read(latestRunRecords, "o ledger de execu\xE7\xF5es"), receipts: read(listRoutineRunReceipts, "os recibos de rotinas"), routines: read(listRoutineContracts, "os contratos de rotinas"), warnings };
}
function recordsForWorkflow(model, workflow, store) {
  const routines = new Set(workflow.legacy.routine_refs);
  const uniqueSystems = new Set(workflow.legacy.system_refs.filter((ref) => model.workflows.filter((w) => w.legacy.system_refs.includes(ref)).length === 1));
  const receipts = store.receipts.filter((receipt2) => routines.has(receipt2.routine_id) || !routines.size && uniqueSystems.has(receipt2.system_ref));
  const receiptRunIds = new Set(receipts.map((r) => r.run_id));
  const records = store.records.filter((record2) => receiptRunIds.has(record2.run_id) || uniqueSystems.has(record2.system_id));
  const entries = new Map(records.map((record2) => [record2.run_id, { record: record2, receipt: null }]));
  for (const receipt2 of receipts) entries.set(receipt2.run_id, { record: entries.get(receipt2.run_id)?.record || null, receipt: receipt2 });
  return [...entries.values()].sort((a, b) => String(b.receipt?.started_at || b.record?.started_at).localeCompare(String(a.receipt?.started_at || a.record?.started_at)));
}
function stagesForTrace(record2, receipt2, graph) {
  const accesses = array(record2?.context_snapshot?.accesses);
  const sourceRefs = accesses.map((a) => evidenceRef(a.source_ref, a.source_ref?.id)).filter(Boolean);
  const selectedRefs = refs(accesses.flatMap((a) => array(a.selected_refs)));
  const outputRefs = refs(unique4([...array(record2?.output_refs), receipt2?.output_ref]));
  const decision = record2?.human_decision;
  const decided = ["approved", "rejected", "changes_requested"].includes(decision);
  const judgment = graph?.nodes.find((node) => node.kind === "judgment" && node.actual && ["approved", "rejected", "changes_requested"].includes(node.details.verdict));
  const outcomes = array(record2?.outcomes);
  const correction = evidenceRef(record2?.correction_ref);
  const status = receipt2?.status || record2?.status || "unknown";
  const statusLabel = { completed: "conclu\xEDdo", failed: "falhou", running: "em execu\xE7\xE3o", denied: "acesso negado", blocked: "bloqueado", pending: "pendente", skipped: "n\xE3o executado" }[status] || status;
  const states = [
    { state: sourceRefs.length ? "recorded" : "missing", summary: sourceRefs.length ? `${sourceRefs.length} fontes com acesso registrado nesta execu\xE7\xE3o.` : "Nenhum acesso a fonte registrado nesta leitura.", refs: sourceRefs },
    { state: selectedRefs.length ? "recorded" : "missing", summary: selectedRefs.length ? `${selectedRefs.length} refer\xEAncias selecionadas; abrir a fonte exige acesso ao conte\xFAdo.` : "Sem refer\xEAncias de contexto selecionado nesta execu\xE7\xE3o.", refs: selectedRefs },
    { state: outputRefs.length ? "recorded" : "missing", summary: outputRefs.length ? "Sa\xEDdas referenciadas pelo recibo. A refer\xEAncia n\xE3o confirma aprova\xE7\xE3o nem resultado comercial." : "Nenhuma recomenda\xE7\xE3o ou entrega referenciada.", refs: outputRefs },
    { state: decided || judgment ? "recorded" : "missing", summary: decided || judgment ? `Decis\xE3o registrada: ${{ approved: "aprovado", rejected: "recusado", changes_requested: "ajustes pedidos" }[decision || judgment.details.verdict]}.` : "Sem decis\xE3o humana registrada.", refs: [] },
    { state: receipt2 || record2 ? "recorded" : "missing", summary: `Estado do trabalho no recibo: ${statusLabel}. Efeitos externos dependem dos registros do destino.`, refs: refs([receipt2 ? `routine-receipt:${receipt2.receipt_id}` : `run-record:${record2?.run_id}`]) },
    { state: outcomes.length ? "recorded" : "missing", summary: outcomes.length ? `${outcomes.length} resultados referenciados no ledger.` : "Resultado de neg\xF3cio ainda n\xE3o registrado nesta leitura.", refs: refs(outcomes.map((o) => o.ref || o.evidence_ref).filter(Boolean)) },
    { state: correction ? "recorded" : "missing", summary: correction ? "Corre\xE7\xE3o referenciada para a pr\xF3xima execu\xE7\xE3o." : "Sem ajuste seguinte registrado.", refs: correction ? [correction] : [] }
  ];
  return STAGES2.map(([id3, label], index) => ({ id: id3, label, ...states[index] }));
}
function declaredStages(model, workflow) {
  const packages = model.packages.filter((p) => workflow.steps.some((s) => s.package_ref === p.package_id));
  const sourceIds = unique4(packages.flatMap((p) => p.collections.flatMap((c) => c.source_refs)));
  const declared = sourceIds.map((id3) => ({ id: id3, label: model.sources.find((s) => s.source_id === id3)?.name || id3, url: `/contexto/fonte/${encodeURIComponent(id3)}`, relation: "dispon\xEDvel no pacote, uso n\xE3o comprovado" }));
  const outputs = workflow.produces.map((item) => ({ id: item.artifact_id, label: item.name, url: `/operacao/artefato/${encodeURIComponent(item.artifact_id)}`, relation: "entrega prevista" }));
  return STAGES2.map(([id3, label]) => ({ id: id3, label, state: id3 === "sources" && declared.length || id3 === "recommendation" && outputs.length || id3 === "action" ? "declared" : "missing", summary: id3 === "sources" ? "Fontes dispon\xEDveis pelos pacotes. Selecione uma execu\xE7\xE3o para conferir quais foram consultadas." : id3 === "recommendation" ? "Documentos previstos no cat\xE1logo; as pe\xE7as concretas abrem na cole\xE7\xE3o." : id3 === "action" ? workflow.result.statement : "O registro aparece na execu\xE7\xE3o quando existir.", refs: id3 === "sources" ? declared : id3 === "recommendation" ? outputs : [] }));
}
function buildWorkflowEvidence(catalogRoot, dataRoot, workflowId, { now = /* @__PURE__ */ new Date(), model = null, store = null, runId = null } = {}) {
  if (!IDS.test(workflowId || "")) return { available: false, reason: "invalid-workflow" };
  model ||= buildCatalogReadModel(catalogRoot, { now });
  const workflow = model.workflows.find((item) => item.workflow_id === workflowId);
  if (!workflow) return { available: false, reason: "workflow-not-found" };
  store ||= readEvidenceStore(dataRoot);
  const entries = recordsForWorkflow(model, workflow, store);
  const selectedId = runId || entries[0]?.receipt?.run_id || entries[0]?.record?.run_id;
  const visibleEntries = entries.slice(0, 40);
  const historical = runId ? entries.find((entry) => (entry.receipt?.run_id || entry.record?.run_id) === runId) : null;
  if (historical && !visibleEntries.includes(historical)) visibleEntries.push(historical);
  const traces = visibleEntries.map(({ record: record2, receipt: receipt2 }) => {
    let rawGraph = null;
    if ((receipt2?.run_id || record2?.run_id) === selectedId) {
      try {
        rawGraph = buildRunGraph(dataRoot, receipt2 ? receipt2.receipt_id : `run-record:${record2.run_id}`);
      } catch {
      }
    }
    const graph = safeEvidenceGraph(rawGraph);
    let origin = rawGraph?.trace_origin || "reconstructed";
    if (!rawGraph) {
      try {
        const events = readExecutionTrace(dataRoot, receipt2?.run_id || record2?.run_id);
        if (events.length && events[0].extensions?.origin !== "reconstructed") origin = "recorded";
      } catch {
      }
    }
    return { id: receipt2?.run_id || record2.run_id, started_at: receipt2?.started_at || record2?.started_at || null, completed_at: receipt2?.completed_at || record2?.completed_at || null, status: receipt2?.status || record2?.status || "unknown", origin, stages: stagesForTrace(record2, receipt2, graph), deliveries: runDeliveries(dataRoot, record2, receipt2), graph };
  });
  const systemRefs = unique4([...workflow.legacy.system_refs, ...store.routines.filter((r) => workflow.legacy.routine_refs.includes(r.routine_id)).map((r) => r.system_ref)]);
  const legacy_graphs = systemRefs.flatMap((system_id) => {
    try {
      return [{ system_id, graph: safeEvidenceGraph(buildSystemGraph(dataRoot, system_id)) }];
    } catch {
      return [];
    }
  });
  return { available: true, workflow_id: workflowId, generated_at: now.toISOString(), coverage: { label: "Registros locais lidos agora; cada execu\xE7\xE3o conserva sua data.", live: false, notes: [...store.warnings, "A aus\xEAncia de recibo local n\xE3o prova que a rotina deixou de rodar na VPS.", ...entries.length > 40 ? [`Mostrando as 40 execu\xE7\xF5es mais recentes de ${entries.length}${visibleEntries.length > 40 ? ", al\xE9m da execu\xE7\xE3o hist\xF3rica indicada no aviso" : ""}.`] : []] }, data_coverage: workflowDataCoverage(dataRoot, workflow, now), definition: definitionFor(dataRoot, workflow, store.routines), declared: declaredStages(model, workflow), traces, legacy_graphs };
}
function buildPainelActivity(catalogRoot, dataRoot, { now = /* @__PURE__ */ new Date(), model = null, store = null } = {}) {
  model ||= buildCatalogReadModel(catalogRoot, { now });
  store ||= readEvidenceStore(dataRoot);
  const histories = model.workflows.map((workflow) => ({ workflow, entries: recordsForWorkflow(model, workflow, store) }));
  const deliveryCache = /* @__PURE__ */ new Map();
  const itemFor = (workflow, { receipt: receipt2, record: record2 }) => {
    const runId = receipt2?.run_id || record2.run_id;
    if (!deliveryCache.has(runId)) deliveryCache.set(runId, runDeliveries(dataRoot, record2, receipt2));
    return { workflow_id: workflow.workflow_id, name: workflow.name, area_ref: workflow.area_ref, system_ref: workflow.system_ref, responsible_ref: workflow.responsible_ref, run_id: runId, status: receipt2?.status || record2.status, started_at: receipt2?.started_at || record2.started_at, completed_at: receipt2?.completed_at || record2?.completed_at || null, output_refs: refs(unique4([...array(record2?.output_refs), receipt2?.output_ref])), deliveries: deliveryCache.get(runId), reason_code: text3(receipt2?.reason_code, 120) || null };
  };
  const items = histories.flatMap(({ workflow, entries }) => entries[0] ? [{ ...itemFor(workflow, entries[0]), data_coverage: workflowDataCoverage(dataRoot, workflow, now) }] : []).sort((a, b) => String(b.started_at).localeCompare(String(a.started_at)));
  const uniqueRuns = /* @__PURE__ */ new Map();
  for (const { workflow, entries } of histories.sort((a, b) => Number(b.workflow.alias === "rotina") - Number(a.workflow.alias === "rotina"))) {
    for (const entry of entries) {
      const runId = entry.receipt?.run_id || entry.record?.run_id;
      const reference = { id: workflow.workflow_id, label: workflow.name, kind: "workflow", url: `/operacao/workflow/${encodeURIComponent(workflow.workflow_id)}?run=${encodeURIComponent(runId)}` };
      if (uniqueRuns.has(runId)) {
        uniqueRuns.get(runId).workflow_refs.push(reference);
        continue;
      }
      uniqueRuns.set(runId, { workflow, entry, started_at: entry.receipt?.started_at || entry.record?.started_at, workflow_refs: [reference] });
    }
  }
  const allReports = [...uniqueRuns.values()].filter(({ entry }) => [...array(entry.record?.output_refs), entry.receipt?.output_ref].some((ref) => evidenceRef(ref)?.path)).sort((a, b) => String(b.started_at).localeCompare(String(a.started_at)));
  const reports = allReports.slice(0, 200).map(({ workflow, entry, workflow_refs }) => ({ ...itemFor(workflow, entry), workflow_refs, data_coverage: items.find((item) => item.workflow_id === workflow.workflow_id && item.run_id === (entry.receipt?.run_id || entry.record?.run_id))?.data_coverage ?? null }));
  return { available: true, generated_at: now.toISOString(), coverage: { live: false, label: "\xDAltimos recibos encontrados no registro local", notes: [...store.warnings, ...allReports.length > reports.length ? [`O acervo mostra as ${reports.length} entregas mais recentes de ${allReports.length}; o hist\xF3rico de cada workflow preserva as demais execu\xE7\xF5es.`] : []] }, items, reports };
}

// ../scripts/lib/painel-inbox-events.mjs
import { createHash as createHash8 } from "node:crypto";
import { existsSync as existsSync22, lstatSync as lstatSync17, readdirSync as readdirSync19 } from "node:fs";
var TOKEN = /^[A-Za-z0-9][A-Za-z0-9_.:-]{0,255}$/;
var KINDS = /* @__PURE__ */ new Set(["run", "decision", "proposal", "delivery", "purchase"]);
var STATUSES3 = /* @__PURE__ */ new Set(["completed", "failed", "blocked", "denied", "pending", "running", "queued", "cancelled", "skipped", "recorded", "dismissed", "deferred", "candidate", "unknown"]);
var LABELS = { completed: "conclu\xEDdo", failed: "falhou", blocked: "bloqueado", denied: "acesso negado", pending: "pendente", running: "em execu\xE7\xE3o", queued: "na fila", cancelled: "cancelado", skipped: "n\xE3o executado", recorded: "decis\xE3o registrada", dismissed: "descartado", deferred: "adiado", candidate: "proposta pendente", unknown: "estado n\xE3o confirmado" };
var array2 = (value) => Array.isArray(value) ? value : [];
var token2 = (value) => typeof value === "string" && TOKEN.test(value) ? value : null;
var unique5 = (values) => [...new Set(values.filter(Boolean))];
var fingerprint = (value) => createHash8("sha256").update(JSON.stringify(value)).digest("hex");
function safeText(value, fallback = "", max = 200) {
  if (typeof value !== "string" || /[\u0000-\u001f<>]|[\w.+-]+@[\w.-]+\.[A-Za-z]{2,}|(?:\+55\s*)?\(?\d{2}\)?[ -]?9\d{4}[ -]?\d{4}|\b\d{3}\.\d{3}\.\d{3}-\d{2}\b|Bearer\s|(?:token|secret|password|api[_-]?key)\s*[=:]/i.test(value)) return fallback;
  return value.slice(0, max);
}
function date4(value) {
  if (typeof value !== "string" || !/^\d{4}-\d{2}-\d{2}(?:T\d{2}:\d{2}:\d{2}(?:\.\d+)?(?:Z|[+-]\d{2}:\d{2}))?$/.test(value) || !Number.isFinite(Date.parse(value))) return null;
  if (/^\d{4}-\d{2}-\d{2}$/.test(value)) return (/* @__PURE__ */ new Date(`${value}T00:00:00Z`)).toISOString().slice(0, 10) === value ? value : null;
  return new Date(value).toISOString();
}
function refs2(values, kind = "reference") {
  const seen = /* @__PURE__ */ new Set();
  return array2(values).flatMap((value) => {
    const safe = evidenceRef(typeof value === "string" ? value : value?.id || value?.ref || value?.path);
    if (!safe || seen.has(safe.id) || /[?&#]|^[a-z]+:\/\//i.test(safe.id)) return [];
    seen.add(safe.id);
    const provided = typeof value === "object" && value ? value : {};
    return [{ ...safe, kind, label: safeText(provided.label, kind === "source" ? "Fonte referenciada no registro" : safe.label), ...token2(provided.relation) ? { relation: provided.relation } : {} }];
  });
}
function normalizeInboxEvent(input) {
  if (!input || !KINDS.has(input.kind) || !token2(input.event_key)) return null;
  const status = STATUSES3.has(input.status) ? input.status : "unknown";
  const occurred = date4(input.occurred_at);
  const workflowRefs = unique5(array2(input.workflow_refs).map(token2)).sort();
  const doc = {
    schema_version: 1,
    event_id: `inbox-event-${fingerprint(input.event_key).slice(0, 32)}`,
    event_key: input.event_key,
    kind: input.kind,
    occurred_at: occurred,
    timestamp_precision: occurred ? occurred.length === 10 ? "date" : "instant" : "unknown",
    started_at: date4(input.started_at),
    completed_at: date4(input.completed_at),
    status,
    execution_mode: ["live", "replay", "fixture", "simulation"].includes(input.execution_mode) ? input.execution_mode : "unverified",
    is_simulation: ["replay", "fixture", "simulation"].includes(input.execution_mode),
    title: safeText(input.title, "Registro da opera\xE7\xE3o"),
    summary: safeText(input.summary, `Estado registrado: ${LABELS[status]}.`, 500),
    area_id: token2(input.area_id),
    system_id: token2(input.system_id),
    workflow_id: token2(input.workflow_id),
    routine_id: token2(input.routine_id),
    run_id: token2(input.run_id),
    workflow_refs: workflowRefs,
    routine_refs: unique5(array2(input.routine_refs).map(token2)).sort(),
    legacy_system_ref: token2(input.legacy_system_ref),
    workflow_version: token2(input.workflow_version),
    routine_version: token2(input.routine_version),
    executor: token2(input.executor),
    executor_ref: token2(input.executor_ref),
    model: token2(input.model),
    requested_model: token2(input.requested_model),
    model_observation: ["provider-reported", "requested-not-verified"].includes(input.model_observation) ? input.model_observation : null,
    observed_models: unique5(array2(input.observed_models).map(token2)).sort(),
    human_decision: ["pending", "approved", "changes_requested", "rejected"].includes(input.human_decision) ? input.human_decision : null,
    reason_code: token2(input.reason_code),
    category: token2(input.category),
    case_id: input.kind === "decision" ? token2(input.case_id) : null,
    case_ref: input.kind === "decision" && token2(input.case_id) ? `decision-case:${input.case_id}` : null,
    decision_kind: input.kind === "decision" ? token2(input.decision_kind) : null,
    output_refs: refs2(input.output_refs, "output"),
    source_refs: refs2(input.source_refs, "source"),
    evidence_refs: refs2(input.evidence_refs),
    outcome_refs: refs2(input.outcome_refs, "outcome"),
    correction_ref: evidenceRef(input.correction_ref)?.id ?? null,
    correction: input.correction ? {
      ref: evidenceRef(input.correction.ref)?.id ?? null,
      baseline_run_id: token2(input.correction.baseline_run_id),
      baseline_receipt_ref: evidenceRef(input.correction.baseline_receipt_ref)?.id ?? null,
      resulting_receipt_ref: evidenceRef(input.correction.resulting_receipt_ref)?.id ?? null,
      judgment_ref: evidenceRef(input.correction.judgment_ref)?.id ?? null,
      validation_verdict: input.correction.validation_verdict === "approved" && evidenceRef(input.correction.approval_ref) ? "approved" : null,
      approval_ref: input.correction.validation_verdict === "approved" ? evidenceRef(input.correction.approval_ref)?.id ?? null : null
    } : null,
    resolution: input.resolution ? {
      verdict: ["decided", "dropped", "deferred", "rolled-back"].includes(input.resolution.verdict) ? input.resolution.verdict : null,
      recorded_at: date4(input.resolution.recorded_at),
      ref: evidenceRef(input.resolution.ref)?.id ?? null
    } : null,
    linkage: { state: ["exact", "ambiguous", "unmapped"].includes(input.linkage?.state) ? input.linkage.state : "unmapped", basis: unique5(array2(input.linkage?.basis).map(token2)).sort() },
    provenance: array2(input.provenance).map((item) => ({ adapter: token2(item?.adapter), ref: evidenceRef(item?.ref)?.id ?? null })).filter((item) => item.adapter && item.ref)
  };
  return { ...doc, revision: fingerprint(doc) };
}
function routineId(ref) {
  return typeof ref === "string" ? token2(ref.match(/^routine:([^:]+):[^:]+$/)?.[1]) : null;
}
function associations(model, { routineIds = [], explicitWorkflowIds = [], legacySystem = null } = {}) {
  const direct = new Set(explicitWorkflowIds.filter((id3) => model.workflows.some((workflow) => workflow.workflow_id === id3)));
  const byRoutine = model.workflows.filter((workflow) => array2(workflow.legacy?.routine_refs).some((ref) => routineIds.includes(ref)));
  let matches2 = model.workflows.filter((workflow) => direct.has(workflow.workflow_id) || byRoutine.includes(workflow));
  let basis = [...direct.size ? ["workflow-id"] : [], ...byRoutine.length ? ["routine-id"] : []];
  let ambiguous = false;
  if (!matches2.length && legacySystem) {
    const candidates = model.workflows.filter((workflow) => array2(workflow.legacy?.system_refs).includes(legacySystem));
    if (candidates.length === 1) {
      matches2 = candidates;
      basis = ["unique-legacy-system"];
    } else ambiguous = candidates.length > 1;
  }
  matches2.sort((a, b) => Number(["cycle", "cycle-variant"].includes(a.kind)) - Number(["cycle", "cycle-variant"].includes(b.kind)) || a.workflow_id.localeCompare(b.workflow_id));
  const primary = matches2[0];
  const fallbackSystems = model.systems.filter((system2) => system2.system_id === legacySystem || array2(system2.legacy?.system_refs).includes(legacySystem));
  const system = primary?.system_ref ? model.systems.find((item) => item.system_id === primary.system_ref) : matches2.length ? null : fallbackSystems.length === 1 ? fallbackSystems[0] : null;
  return { primary, area_id: primary?.area_ref ?? system?.area_ref ?? null, system_id: primary?.system_ref ?? system?.system_id ?? null, workflow_id: primary?.workflow_id ?? null, workflow_refs: matches2.map((workflow) => workflow.workflow_id), linkage: { state: matches2.length ? "exact" : ambiguous ? "ambiguous" : "unmapped", basis } };
}
function readDecisionHistory(root, warnings) {
  try {
    const directory2 = decisionReceiptDirectory(root);
    if (!existsSync22(directory2)) return [];
    if (lstatSync17(directory2).isSymbolicLink() || !lstatSync17(directory2).isDirectory()) throw new Error("unsafe");
    return readdirSync19(directory2, { withFileTypes: true }).filter((entry) => entry.isDirectory() && !entry.isSymbolicLink() && token2(entry.name)).flatMap((entry) => {
      try {
        return listDecisionCaseEvents(root, entry.name).map((event) => ({ ...event, case_id: entry.name }));
      } catch {
        warnings.push("Um hist\xF3rico de decis\xE3o n\xE3o p\xF4de ser validado.");
        return [];
      }
    });
  } catch {
    warnings.push("Hist\xF3rico de decis\xF5es indispon\xEDvel nesta leitura.");
    return [];
  }
}
function collectInboxEvents(catalogRoot, dataRoot, options = {}) {
  const now = new Date(options.now ?? /* @__PURE__ */ new Date());
  const warnings = [];
  const read = (key2, fn, fallback, label) => {
    if (Object.hasOwn(options, key2)) return options[key2];
    try {
      return fn();
    } catch {
      warnings.push(`${label} indispon\xEDvel nesta leitura.`);
      return fallback;
    }
  };
  const model = options.model ?? buildCatalogReadModel(catalogRoot, { now });
  const store = read("store", () => readEvidenceStore(dataRoot), { records: [], receipts: [], routines: [], warnings: [] }, "Registro de execu\xE7\xF5es");
  warnings.push(...array2(store.warnings));
  const decisionCases = read("decisionCases", () => listDecisionCases(dataRoot), { available: false, cases: [] }, "Fila de decis\xF5es");
  const decisionHistory = read("decisionHistory", () => readDecisionHistory(dataRoot, warnings), [], "Hist\xF3rico de decis\xF5es");
  const learning = read("learningCandidates", () => listLearningCandidates(dataRoot), [], "Propostas de aprendizado");
  const corrections = read("corrections", () => listCorrectionRunReceipts(dataRoot), [], "Recibos de corre\xE7\xE3o");
  const events = [];
  const excludedSimulations = [];
  const runs = /* @__PURE__ */ new Map();
  const receiptsById = new Map(array2(store.receipts).map((receipt2) => [receipt2.receipt_id, receipt2]));
  const add = (id3, kind, record2) => {
    if (!token2(id3)) return;
    const entry = runs.get(id3) ?? { records: [], receipts: [] };
    entry[kind].push(record2);
    runs.set(id3, entry);
  };
  for (const record2 of array2(store.records)) add(record2.run_id, "records", record2);
  for (const receipt2 of array2(store.receipts)) add(receipt2.run_id, "receipts", receipt2);
  const byTime = (a, b) => String(b.completed_at ?? b.started_at ?? "").localeCompare(String(a.completed_at ?? a.started_at ?? ""));
  for (const [runId, entry] of runs) {
    const receipt2 = entry.receipts.sort(byTime)[0];
    const record2 = entry.records.sort(byTime)[0];
    const modes = [record2?.mode, record2?.extensions?.origin, receipt2?.execution_mode];
    const explicitMode = modes.find((value) => ["replay", "governed-replay", "fixture", "simulation"].includes(value)) ?? modes.find((value) => value === "live");
    const executionMode = explicitMode === "governed-replay" ? "replay" : explicitMode ?? "unverified";
    if (["replay", "fixture", "simulation"].includes(executionMode) && options.includeSimulations !== true) {
      excludedSimulations.push(runId);
      continue;
    }
    const routineIds = unique5([...entry.receipts.map((item) => token2(item.routine_id)), ...entry.records.map((item) => routineId(item.extensions?.routine_ref))]);
    const legacySystem = token2(receipt2?.system_ref ?? record2?.system_id);
    const linked = associations(model, { routineIds, legacySystem, explicitWorkflowIds: unique5(entry.records.map((item) => token2(item.execution_context?.workflow_ref?.id))) });
    const occurredAt = receipt2?.completed_at ?? record2?.completed_at ?? receipt2?.started_at ?? record2?.started_at;
    const status = receipt2?.status ?? record2?.status ?? "unknown";
    const correction = corrections.find((item) => entry.receipts.some((receipt3) => item.resulting_routine_receipt_ref === `routine-receipt:${receipt3.receipt_id}`));
    const observedModels = receipt2?.model_observation === "provider-reported" ? Object.keys(receipt2.model_usage ?? {}).filter(token2) : [];
    const sourceRefs = [...entry.records.flatMap((item) => [
      ...array2(item.context_snapshot?.accesses).map((access) => ({ ...evidenceRef(access.source_ref), relation: "access-recorded" })),
      ...array2(item.source_refs).map((ref) => ({ ...evidenceRef(ref), relation: "referenced-by-run" }))
    ]), ...entry.receipts.flatMap((item) => array2(item.input_refs).filter((ref) => /^source:[A-Za-z0-9_.-]+:[A-Za-z0-9_.-]+$/.test(ref)).map((ref) => ({ ...evidenceRef(ref.split(":")[1]), relation: "input-reference" })))].filter((ref) => ref.id).map((ref) => ({ ...ref, label: model.sources.find((source) => source.source_id === ref.id)?.name ?? "Fonte referenciada no registro" }));
    const title = linked.primary?.name ?? store.routines?.find((item) => routineIds.includes(item.routine_id))?.name ?? "Execu\xE7\xE3o sem v\xEDnculo de workflow";
    const correctionRef = record2?.correction_ref ?? (correction ? `correction-run:${correction.correction_id}` : null);
    const baselineReceiptId = correction?.baseline_routine_receipt_ref?.replace(/^routine-receipt:/, "");
    let approval = null;
    if (correctionRef && receipt2) {
      try {
        const judgments = Object.hasOwn(options, "judgments") ? array2(options.judgments?.[receipt2.receipt_id]) : listJudgmentReceipts(dataRoot, receipt2.receipt_id);
        const latest = [...judgments].sort((a, b) => String(b.decided_at).localeCompare(String(a.decided_at)))[0];
        if (latest?.verdict === "approved" && latest.run_id === runId && latest.receipt_id === receipt2.receipt_id && latest.routine_receipt_ref === `routine-receipt:${receipt2.receipt_id}` && Date.parse(latest.decided_at) >= Date.parse(receipt2.completed_at) && Date.parse(latest.decided_at) <= now.getTime() && !(receipt2.output_digest && latest.output_digest && receipt2.output_digest !== latest.output_digest)) approval = latest;
      } catch {
        warnings.push("Um julgamento de corre\xE7\xE3o n\xE3o p\xF4de ser validado.");
      }
    }
    events.push(normalizeInboxEvent({
      event_key: `run:${runId}`,
      kind: "run",
      run_id: runId,
      ...linked,
      routine_id: routineIds.length === 1 ? routineIds[0] : null,
      routine_refs: routineIds,
      legacy_system_ref: legacySystem,
      occurred_at: occurredAt,
      started_at: receipt2?.started_at ?? record2?.started_at,
      completed_at: receipt2?.completed_at ?? record2?.completed_at,
      execution_mode: executionMode,
      status,
      title: ["replay", "fixture", "simulation"].includes(executionMode) ? `[Simula\xE7\xE3o] ${title}` : title,
      summary: `${safeText(title, "Trabalho")}: ${LABELS[status] ?? "estado n\xE3o confirmado"}. ${receipt2?.output_ref || record2?.output_refs?.length ? "H\xE1 entrega referenciada para conferir." : "Nenhuma entrega referenciada nesta leitura."}`,
      reason_code: receipt2?.reason_code,
      human_decision: record2?.human_decision,
      workflow_version: record2?.execution_context?.workflow_ref?.version,
      routine_version: receipt2?.routine_version,
      executor: receipt2?.adapter,
      executor_ref: receipt2?.binding_ref,
      model: observedModels.length === 1 ? observedModels[0] : null,
      observed_models: observedModels,
      model_observation: receipt2?.model_observation,
      requested_model: receipt2?.requested_model,
      output_refs: [...entry.records.flatMap((item) => array2(item.output_refs)), ...entry.receipts.map((item) => item.output_ref)],
      source_refs: sourceRefs,
      evidence_refs: [...entry.receipts.map((item) => `routine-receipt:${item.receipt_id}`), ...entry.records.map((item) => `run-record:${item.run_id}`), ...entry.receipts.flatMap((item) => array2(item.access_receipt_refs))],
      outcome_refs: entry.records.flatMap((item) => array2(item.outcomes).map((outcome) => outcome.ref ?? outcome.evidence_ref)),
      correction_ref: correctionRef,
      correction: correctionRef ? { ref: correctionRef, baseline_run_id: receiptsById.get(baselineReceiptId)?.run_id, baseline_receipt_ref: correction?.baseline_routine_receipt_ref, resulting_receipt_ref: correction?.resulting_routine_receipt_ref ?? (receipt2 ? `routine-receipt:${receipt2.receipt_id}` : null), judgment_ref: correction?.correction_judgment_ref, validation_verdict: approval ? "approved" : null, approval_ref: approval ? `judgment-receipt:${approval.judgment_id}` : null } : null,
      provenance: [...entry.receipts.map((item) => ({ adapter: "routine-receipt", ref: `routine-receipt:${item.receipt_id}` })), ...entry.records.map((item) => ({ adapter: "run-ledger", ref: `run-record:${item.run_id}` }))]
    }));
  }
  const decisions = new Map(array2(Array.isArray(decisionCases) ? decisionCases : decisionCases.cases).map((item) => [item.case_id, { item, history: [] }]));
  for (const event of array2(decisionHistory)) {
    if (!token2(event.case_id)) continue;
    const entry = decisions.get(event.case_id) ?? { item: null, history: [] };
    entry.history.push(event);
    decisions.set(event.case_id, entry);
  }
  for (const [caseId, { item, history }] of decisions) {
    const latest = history.sort((a, b) => (b.sequence ?? 0) - (a.sequence ?? 0) || String(b.recorded_at).localeCompare(String(a.recorded_at)))[0] ?? item?.state?.last_event;
    const verdict = latest?.event === "rolled-back" ? "rolled-back" : latest?.verdict;
    const status = verdict === "decided" ? "recorded" : verdict === "dropped" ? "dismissed" : verdict === "deferred" ? "deferred" : "pending";
    const reference = latest?.event_ref ?? (latest?.event_id ? `decision-case-receipt:${latest.event_id}` : null);
    const metadataTitle = item?.title ?? latest?.title;
    const title = safeText(
      typeof metadataTitle === "string" ? metadataTitle.replace(/>(?=\s*\d)/g, "acima de ").replace(/<(?=\s*\d)/g, "abaixo de ") : null,
      status === "pending" ? "Decis\xE3o pendente" : "Decis\xE3o com registro humano"
    );
    events.push(normalizeInboxEvent({
      event_key: `decision:${caseId}`,
      kind: "decision",
      occurred_at: latest?.recorded_at ?? item?.first_seen,
      status,
      title,
      category: item?.category,
      case_id: caseId,
      decision_kind: item?.category,
      summary: `Caso de decis\xE3o: ${LABELS[status]}. ${!latest ? "A pend\xEAncia continua aberta at\xE9 existir um recibo de resolu\xE7\xE3o." : "Estado sustentado por recibo; abrir a evid\xEAncia para conferir."}`,
      evidence_refs: [`decision-case:${caseId}`, reference],
      output_refs: array2(latest?.canonical_writes).map((write) => write.path),
      resolution: latest ? { verdict, recorded_at: latest.recorded_at, ref: reference } : null,
      provenance: [{ adapter: "decision-case", ref: `decision-case:${caseId}` }]
    }));
  }
  for (const candidate of array2(learning)) {
    if (!token2(candidate.candidate_id)) continue;
    const receiptId = candidate.evidence_run_ref?.replace(/^routine-receipt:/, "");
    const receipt2 = receiptsById.get(receiptId);
    const linked = associations(model, { routineIds: [candidate.routine_id], legacySystem: candidate.system_ref });
    events.push(normalizeInboxEvent({
      event_key: `proposal:${candidate.candidate_id}`,
      kind: "proposal",
      ...linked,
      routine_id: candidate.routine_id,
      routine_refs: [candidate.routine_id],
      run_id: receipt2?.run_id,
      occurred_at: candidate.created_at,
      status: "candidate",
      title: linked.primary ? `Proposta de melhoria: ${linked.primary.name}` : "Proposta de melhoria pendente",
      summary: "Candidato derivado de corre\xE7\xE3o registrada; n\xE3o comprova promo\xE7\xE3o nem mudan\xE7a do motor.",
      correction_ref: candidate.source_correction_ref,
      evidence_refs: [candidate.evidence_run_ref, candidate.approval_judgment_ref],
      provenance: [{ adapter: "learning-candidate", ref: `learning-candidate:${candidate.candidate_id}` }]
    }));
  }
  return { available: model.available !== false, generated_at: now.toISOString(), events: events.filter(Boolean).sort((a, b) => String(b.occurred_at ?? "").localeCompare(String(a.occurred_at ?? "")) || a.event_key.localeCompare(b.event_key)), coverage: {
    live: false,
    label: "Recibos e pend\xEAncias locais, incluindo hist\xF3rico anterior a hoje",
    history_complete: false,
    excluded_simulations: excludedSimulations.length,
    excluded_run_ids: excludedSimulations,
    counts: { ledger_records: array2(store.records).length, routine_receipts: array2(store.receipts).length, runs: runs.size, decision_cases: decisions.size, proposals: array2(learning).length },
    adapters: { runs: { available: !array2(store.warnings).length }, decisions: { available: Array.isArray(decisionCases) || decisionCases.available === true, resolutions_explicit: true }, proposals: { available: !warnings.some((warning) => warning.startsWith("Propostas de aprendizado")) }, purchases: { available: false, reason: "N\xE3o h\xE1 espelho local governado de compras integrado a esta leitura." }, deliveries: { available: false, reason: "N\xE3o h\xE1 registro local governado de envios comerciais integrado a esta leitura." } },
    notes: unique5([...warnings, "Aus\xEAncia no registro local n\xE3o comprova aus\xEAncia de execu\xE7\xE3o na VPS.", "Desaparecer da fila n\xE3o equivale a uma decis\xE3o resolvida.", "Nenhuma consulta de compradores, conte\xFAdo de mensagens ou fonte com PII foi executada."])
  } };
}

// ../scripts/lib/painel-inbox.mjs
import { createHash as createHash9, randomUUID as randomUUID5 } from "node:crypto";
import { mkdirSync as mkdirSync11, readFileSync as readFileSync23, writeFileSync as writeFileSync6, renameSync as renameSync4, unlinkSync as unlinkSync4, openSync as openSync6, closeSync as closeSync6, lstatSync as lstatSync18, realpathSync as realpathSync14 } from "node:fs";
import { resolve as resolve23, dirname as dirname9, parse, join as join21, sep as sep23 } from "node:path";
var hash = (value) => createHash9("sha256").update(typeof value === "string" ? value : JSON.stringify(value)).digest("hex");
var iso = (now) => new Date(now).toISOString();
var attentionStatuses = /* @__PURE__ */ new Set(["failed", "blocked", "denied", "waiting_approval", "pending", "needs_review", "open", "proposed", "candidate", "deferred"]);
var terminalStatuses = /* @__PURE__ */ new Set(["completed", "resolved", "approved", "rejected", "cancelled", "closed"]);
var snapshotAllowed = (note) => note.ok && ![true, "true"].includes(note.frontmatter?.sealed) && ![true, "true"].includes(note.frontmatter?.selado) && note.frontmatter?.tipo !== "transcricao" && !note.frontmatter?.["member-id"];
var validId = (value) => typeof value === "string" && /^msg-[a-f0-9]{24}$/.test(value);
function privateStateDirectory(path) {
  const absolute = resolve23(path);
  let cursor = parse(absolute).root;
  for (const part of absolute.slice(cursor.length).split(sep23).filter(Boolean)) {
    cursor = join21(cursor, part);
    try {
      if (lstatSync18(cursor).isSymbolicLink()) throw new Error("state-symlink");
    } catch (error) {
      if (error.code !== "ENOENT") throw error;
      mkdirSync11(cursor, { mode: 448 });
    }
  }
  if (realpathSync14(absolute) !== absolute) throw new Error("state-path-invalid");
  return absolute;
}
function safeFile(path) {
  try {
    if (lstatSync18(path).isSymbolicLink()) throw new Error("state-symlink");
  } catch (error) {
    if (error.code !== "ENOENT") throw error;
  }
  return path;
}
function atomicJson(path, value) {
  safeFile(path);
  const temporary = join21(dirname9(path), `.write-${randomUUID5()}`);
  try {
    writeFileSync6(temporary, JSON.stringify(value), { mode: 384, flag: "wx" });
    renameSync4(temporary, path);
  } finally {
    try {
      unlinkSync4(temporary);
    } catch {
    }
  }
}
function emptyState() {
  return { version: 1, messages: [], heads: {}, snapshots: {}, last_scan_at: null, coverage: null };
}
function subjectOf(event) {
  return event.kind === "purchase" && event.commercial ? "commercial:purchases" : event.routine_id ? `routine:${event.routine_id}` : event.workflow_id ? `workflow:${event.workflow_id}` : event.event_key;
}
function isSimulation(event) {
  return event.is_simulation === true || ["simulation", "replay", "fixture", "test", "demo", "dry-run"].includes(event.execution_mode);
}
function relevant(event) {
  if (isSimulation(event) || event.commercial?.confirmation === "pending") return false;
  return event.kind !== "run" || attentionStatuses.has(event.status) || event.status === "completed" && event.output_refs?.length > 0;
}
function artifactVersion(note) {
  return hash({ path: note.path, body: note.body, format: note.format, title: note.title });
}
function occurrenceFingerprint(event, artifact) {
  return hash({
    event_key: event.event_key,
    status: event.status,
    title: event.title,
    summary: event.summary,
    reason_code: event.reason_code,
    outputs: event.output_refs,
    sources: event.source_refs,
    correction_ref: event.correction_ref,
    artifact_version: artifact?.version ?? null,
    ...event.commercial ? {
      commercial: sanitizeCommercialDetail(event.commercial),
      commercial_ownership: { area_id: event.area_id, system_id: event.system_id, workflow_id: event.workflow_id },
      commercial_evidence: event.evidence_refs
    } : {}
  });
}
function createInboxRepository({ stateRoot, dataRoot, now = () => /* @__PURE__ */ new Date(), readArtifact = readNote }) {
  const directory2 = privateStateDirectory(stateRoot);
  const file2 = join21(directory2, "inbox.json");
  const lock = join21(directory2, ".inbox-lock");
  const read = () => {
    try {
      const value = JSON.parse(readFileSync23(safeFile(file2), "utf8"));
      if (value.version !== 1 || !Array.isArray(value.messages) || !value.heads || !value.snapshots) throw new Error("inbox-invalid");
      return value;
    } catch (error) {
      if (error.code === "ENOENT") return emptyState();
      throw new Error("inbox-unreadable");
    }
  };
  const transact = (callback) => {
    let descriptor;
    try {
      descriptor = openSync6(safeFile(lock), "wx", 384);
    } catch (error) {
      if (error.code !== "EEXIST") throw error;
      const recovery = join21(directory2, ".inbox-recovery");
      let guard;
      try {
        guard = openSync6(safeFile(recovery), "wx", 384);
      } catch {
        throw new Error("inbox-locked");
      }
      try {
        let owner;
        try {
          owner = JSON.parse(readFileSync23(safeFile(lock), "utf8")).pid;
        } catch {
          throw new Error("inbox-locked");
        }
        if (!Number.isInteger(owner) || owner < 1) throw new Error("inbox-locked");
        try {
          process.kill(owner, 0);
          throw new Error("inbox-locked");
        } catch (cause) {
          if (cause.code !== "ESRCH") throw new Error("inbox-locked");
        }
        unlinkSync4(lock);
        descriptor = openSync6(lock, "wx", 384);
        writeFileSync6(descriptor, JSON.stringify({ pid: process.pid }));
      } finally {
        closeSync6(guard);
        unlinkSync4(recovery);
      }
    }
    try {
      writeFileSync6(lock, JSON.stringify({ pid: process.pid }), { mode: 384 });
      const state2 = read();
      const result = callback(state2);
      atomicJson(file2, state2);
      return result;
    } finally {
      closeSync6(descriptor);
      unlinkSync4(lock);
    }
  };
  const publicMessage = (message) => ({ ...message, artifact: message.artifact ? { ...message.artifact, title: /\.(md|txt)$/i.test(message.artifact.title ?? "") ? message.title : message.artifact.title } : null, workflow_refs: (message.workflow_refs ?? []).map((ref) => typeof ref === "string" ? { id: ref, kind: "workflow", label: ref, url: `/operacao/workflow/${encodeURIComponent(ref)}` } : ref) });
  const getMessage = (id3) => validId(id3) ? read().messages.find((item) => item.id === id3) ?? null : null;
  return {
    ingest(collection) {
      if (!Array.isArray(collection.events)) throw new Error("invalid-collection");
      return transact((state2) => {
        let added = 0;
        const observed = iso(now());
        const excluded = new Set(collection.coverage?.excluded_run_ids ?? []);
        for (const item of state2.messages) if (excluded.has(item.run_id)) item.excluded_reason = "Replay de demonstra\xE7\xE3o comprovado no registro de origem.";
        for (const event of collection.events) {
          if (event.commercial?.confirmation === "pending") {
            for (const item of state2.messages) if (item.event_key === event.event_key && item.status === "pending") item.excluded_reason = "Prepara\xE7\xE3o normal na fila, sem envio confirmado ou a\xE7\xE3o solicitada.";
          }
          if (!event.event_key || !event.event_id || !relevant(event)) continue;
          let artifact = null;
          for (const reference of event.output_refs ?? []) {
            if (!reference.path) continue;
            const note = readArtifact(dataRoot, reference.path);
            if (snapshotAllowed(note)) {
              const version = artifactVersion(note);
              if (!state2.snapshots[version]) state2.snapshots[version] = { ...note, captured_at: observed };
              artifact = { id: version, title: /\.(md|txt)$/i.test(note.title ?? "") ? event.title : note.title, path: reference.path, version, captured_at: state2.snapshots[version].captured_at, available: true };
              break;
            }
            artifact ??= { id: null, title: reference.label || "Entrega", path: reference.path, version: null, available: false, reason: note.reason || "Leitura indispon\xEDvel." };
          }
          const fingerprint2 = occurrenceFingerprint(event, artifact);
          const id3 = `msg-${hash(`${event.event_key}:${fingerprint2}`).slice(0, 24)}`;
          const existing = state2.messages.find((item) => item.id === id3);
          if (existing) {
            if (event.commercial) existing.subject_id = subjectOf(event);
            if (state2.heads[event.event_key] !== id3) {
              const head = state2.messages.find((item) => item.id === state2.heads[event.event_key]);
              if (head) {
                head.resolution = "superseded";
                head.superseded_by = id3;
              }
              existing.resolution = attentionStatuses.has(event.status) ? "open" : "recorded";
              existing.read_at = null;
              existing.reobserved_at = observed;
              delete existing.superseded_by;
              state2.heads[event.event_key] = id3;
            }
            continue;
          }
          const prior = state2.messages.find((item) => item.id === state2.heads[event.event_key]);
          if (prior) {
            prior.resolution = "superseded";
            prior.superseded_by = id3;
          }
          const attention = attentionStatuses.has(event.status);
          const message = {
            id: id3,
            event_id: event.event_id,
            event_key: event.event_key,
            kind: event.kind,
            occurred_at: event.occurred_at || observed,
            observed_at: observed,
            title: event.title,
            body: event.summary,
            status: event.status,
            priority: attention ? "attention" : "update",
            resolution: attention ? "open" : "recorded",
            read_at: null,
            snoozed_until: null,
            subject_id: subjectOf(event),
            area_id: event.area_id ?? null,
            system_id: event.system_id ?? null,
            workflow_id: event.workflow_id ?? null,
            routine_id: event.routine_id ?? null,
            run_id: event.run_id ?? null,
            workflow_refs: event.workflow_refs ?? [],
            output_refs: event.output_refs ?? [],
            source_refs: event.source_refs ?? [],
            evidence_refs: event.evidence_refs ?? [],
            provenance: event.provenance ?? null,
            execution_mode: event.execution_mode ?? "unverified",
            is_simulation: false,
            case_id: event.case_id ?? null,
            case_ref: event.case_ref ?? null,
            decision_kind: event.decision_kind ?? null,
            workflow_version: event.workflow_version ?? null,
            executor: event.executor ?? null,
            model: event.model ?? null,
            correction_ref: event.correction_ref ?? null,
            artifact,
            ...event.commercial ? { commercial: sanitizeCommercialDetail(event.commercial) } : {}
          };
          state2.messages.push(message);
          state2.heads[event.event_key] = id3;
          added++;
        }
        state2.last_scan_at = observed;
        state2.coverage = collection.coverage;
        return { added, total: state2.messages.length };
      });
    },
    list() {
      const state2 = read();
      const date7 = iso(now());
      const messages = state2.messages.filter((item) => !item.excluded_reason).sort((a, b) => b.occurred_at.localeCompare(a.occurred_at) || b.observed_at.localeCompare(a.observed_at)).map(publicMessage);
      const active2 = messages.filter((item) => item.resolution !== "superseded" && (!item.snoozed_until || item.snoozed_until <= date7));
      return {
        ok: true,
        generated_at: date7,
        last_scan_at: state2.last_scan_at,
        coverage: state2.coverage,
        messages,
        unread_count: active2.filter((item) => !item.read_at).length,
        attention_count: active2.filter((item) => item.resolution === "open").length
      };
    },
    message: getMessage,
    markRead(id3, value) {
      if (!validId(id3) || typeof value !== "boolean") throw new Error("invalid-read");
      return transact((state2) => {
        const item = state2.messages.find((message) => message.id === id3);
        if (!item) throw new Error("message-not-found");
        item.read_at = value ? iso(now()) : null;
        return publicMessage(item);
      });
    },
    snooze(id3, until) {
      const date7 = until === null ? null : new Date(until);
      if (!validId(id3) || date7 && (!Number.isFinite(date7.valueOf()) || date7 <= new Date(now()) || date7 > new Date(new Date(now()).valueOf() + 30 * 864e5))) throw new Error("invalid-snooze");
      return transact((state2) => {
        const item = state2.messages.find((message) => message.id === id3);
        if (!item) throw new Error("message-not-found");
        item.snoozed_until = date7 ? date7.toISOString() : null;
        return publicMessage(item);
      });
    },
    record(id3) {
      const item = getMessage(id3);
      if (!item) return { ok: false, reason: "Registro n\xE3o encontrado." };
      const lines = [item.body, "", "## Estado observado", `- Estado: ${item.status}`, `- Ocorr\xEAncia: ${item.occurred_at}`, `- Registrado pelo assistente: ${item.observed_at}`, "", "## Identificadores de origem"];
      for (const [label, value] of [["Evento", item.event_key], ["\xC1rea", item.area_id], ["Sistema", item.system_id], ["Workflow", item.workflow_id], ["Rotina", item.routine_id], ["Execu\xE7\xE3o", item.run_id]]) if (value) lines.push(`- ${label}: ${value}`);
      if (item.commercial) lines.push("", commercialRecordMarkdown(item.commercial));
      lines.push("", "Este \xE9 o registro da ocorr\xEAncia dispon\xEDvel nesta leitura. Ele n\xE3o substitui um relat\xF3rio de intelig\xEAncia, nem comprova efeitos externos sem recibo do destino.");
      const order = item.commercial?.order_ref;
      const related = order ? read().messages.filter((message) => message.id !== id3 && message.commercial?.order_ref === order && !message.excluded_reason && message.resolution !== "superseded").sort((a, b) => a.occurred_at.localeCompare(b.occurred_at)).map((message) => ({ id: message.id, title: message.title, kind: message.kind, occurred_at: message.occurred_at })) : [];
      return { ok: true, title: item.title, body: lines.join("\n"), format: "md", path: "", message: publicMessage(item), record_only: true, related_messages: related };
    },
    artifact(id3) {
      const state2 = read();
      const item = validId(id3) && state2.messages.find((message) => message.id === id3);
      if (!item?.artifact?.available) return { ok: false, reason: "Nenhuma vers\xE3o leg\xEDvel preservada para esta mensagem." };
      const snapshot = state2.snapshots[item.artifact.version];
      const current = readArtifact(dataRoot, item.artifact.path);
      if (!snapshotAllowed(current)) return { ok: false, reason: "A origem n\xE3o est\xE1 mais acess\xEDvel. A vers\xE3o preservada permanece restrita." };
      if (!snapshot || artifactVersion(snapshot) !== item.artifact.version) return { ok: false, reason: "A vers\xE3o preservada n\xE3o p\xF4de ser verificada." };
      return {
        ...snapshot,
        title: /\.(md|txt)$/i.test(item.artifact.title ?? "") ? item.title : item.artifact.title,
        ok: true,
        version: item.artifact.version,
        current_changed: artifactVersion(current) !== item.artifact.version,
        version_label: "Vers\xE3o observada pelo assistente",
        message: publicMessage(item)
      };
    },
    origin(id3) {
      const message = getMessage(id3);
      if (!message) return null;
      const artifact = this.artifact(id3);
      return {
        ...message,
        message_id: message.id,
        summary: message.body,
        origin_url: message.workflow_id ? `/operacao/workflow/${encodeURIComponent(message.workflow_id)}${message.run_id ? `?run=${encodeURIComponent(message.run_id)}` : ""}` : null,
        artifact: artifact.ok ? { path: artifact.path, title: artifact.title, version: artifact.version, body: artifact.body } : null,
        artifact_unavailable_reason: artifact.ok ? null : artifact.reason
      };
    },
    attachInvestigation(messageId, investigationId) {
      return transact((state2) => {
        const item = state2.messages.find((message) => message.id === messageId);
        if (!item) throw new Error("message-not-found");
        item.investigation_ids = [.../* @__PURE__ */ new Set([...item.investigation_ids ?? [], ...item.investigation_id ? [item.investigation_id] : [], investigationId])];
        item.investigation_id = investigationId;
        return publicMessage(item);
      });
    },
    // Evidence is selected by the server from collected records; the UI cannot declare validation.
    reconcileCorrections(collection, investigations = []) {
      return transact((state2) => {
        let verified = 0;
        for (const investigation of investigations) {
          const original = state2.messages.find((item) => item.investigation_id === investigation.id || item.investigation_ids?.includes(investigation.id));
          if (!original || original.resolution === "verified") continue;
          const validation = collection.events.find((event) => !isSimulation(event) && event.run_id && event.run_id !== original.run_id && terminalStatuses.has(event.status) && event.status === "completed" && event.routine_id === original.routine_id && original.routine_id && event.occurred_at > original.occurred_at && event.correction_ref && ([investigation.id, `investigation:${investigation.id}`].includes(typeof event.correction_ref === "string" ? event.correction_ref : event.correction_ref.id) || /^correction-run:[a-zA-Z0-9_.:-]+$/.test(event.correction_ref) && event.correction?.baseline_run_id === original.run_id));
          if (!validation || validation.correction?.baseline_run_id !== original.run_id || validation.correction?.validation_verdict !== "approved" || !validation.correction?.approval_ref) continue;
          original.resolution = "verified";
          original.validation_run_id = validation.run_id;
          original.correction_ref = validation.correction_ref;
          original.validation_evidence = validation.correction;
          const update = state2.messages.find((item) => item.event_key === validation.event_key && item.resolution !== "superseded");
          if (update) {
            update.validates_message_id = original.id;
            update.body += " A corre\xE7\xE3o tem nova execu\xE7\xE3o e aprova\xE7\xE3o registradas; a ocorr\xEAncia anterior foi vinculada.";
          }
          verified++;
        }
        return { verified };
      });
    }
  };
}
function startInboxCollector({ repository, collect, intervalMs = 3e4, onError = () => {
} }) {
  let stopped = false;
  let inFlight = null;
  let error = null;
  const scan2 = () => {
    if (stopped) return Promise.resolve();
    if (inFlight) return inFlight;
    inFlight = Promise.resolve().then(collect).then((result) => {
      if (stopped) return;
      repository.ingest(result);
      repository.reconcileCorrections(result, repository.list().messages.flatMap((item) => [.../* @__PURE__ */ new Set([...item.investigation_ids ?? [], ...item.investigation_id ? [item.investigation_id] : []])].map((id3) => ({ id: id3 }))));
      error = null;
    }).catch((cause) => {
      error = "A coleta n\xE3o p\xF4de ser atualizada. O hist\xF3rico anterior foi preservado.";
      onError(cause);
    }).finally(() => {
      inFlight = null;
    });
    return inFlight;
  };
  const ready = scan2();
  const timer = setInterval(scan2, intervalMs);
  timer.unref?.();
  return { ready, scan: scan2, get error() {
    return error;
  }, stop() {
    stopped = true;
    clearInterval(timer);
  } };
}

// portable/updates.mjs
import { lstat, readFile } from "node:fs/promises";
import { join as join22, resolve as resolve24 } from "node:path";
var OFFICIAL_RELEASE_REPO = "gabrielzucco/cerebro-inevita";
var VERSION = /^(0|[1-9]\d*)\.(0|[1-9]\d*)\.(0|[1-9]\d*)(?:-([0-9A-Za-z]+(?:[.-][0-9A-Za-z]+)*))?$/;
var MAX_RELEASE_BYTES = 128 * 1024;
function versionParts(value) {
  const match = VERSION.exec(value || "");
  if (!match || match.slice(1, 4).some((part) => !Number.isSafeInteger(Number(part)))) return null;
  return { numbers: match.slice(1, 4).map(Number), prerelease: match[4] || null };
}
function compare(current, latest) {
  const left = versionParts(current), right = versionParts(latest);
  for (let index = 0; index < 3; index++) {
    if (left.numbers[index] !== right.numbers[index]) return left.numbers[index] > right.numbers[index] ? 1 : -1;
  }
  return left.prerelease ? -1 : 0;
}
function plainText(value, limit) {
  return typeof value === "string" ? value.replace(/<[^>]*>/g, "").replace(/[\u0000-\u0008\u000b\u000c\u000e-\u001f\u007f\u202a-\u202e\u2066-\u2069]/g, "").replace(/\r\n?/g, "\n").trim().slice(0, limit) : "";
}
async function installedVersion(root) {
  try {
    const path = join22(root, "VERSION"), info = await lstat(path);
    if (!info.isFile() || info.isSymbolicLink() || info.size > 100) return null;
    const value = (await readFile(path, "utf8")).trim();
    return versionParts(value) ? value : null;
  } catch {
    return null;
  }
}
async function boundedJson(response, maxBytes) {
  if (Number(response.headers?.get("content-length")) > maxBytes) throw new Error("release-too-large");
  if (!response.body?.getReader) throw new Error("release-invalid");
  const reader = response.body.getReader(), chunks = [];
  let size = 0;
  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      size += value.byteLength;
      if (size > maxBytes) throw new Error("release-too-large");
      chunks.push(value);
    }
    return JSON.parse(Buffer.concat(chunks, size).toString("utf8"));
  } finally {
    void reader.cancel().catch(() => {
    });
  }
}
function createUpdateReader({
  root,
  fetchImpl = globalThis.fetch,
  now = () => /* @__PURE__ */ new Date(),
  ttlMs = 15 * 60 * 1e3,
  timeoutMs = 6e3,
  repo = OFFICIAL_RELEASE_REPO,
  maxBytes = MAX_RELEASE_BYTES
} = {}) {
  if (typeof root !== "string" || !root) throw new Error("update-root-required");
  const memberRoot = resolve24(root);
  const cacheDuration = Math.max(0, Math.min(Number(ttlMs) || 0, 24 * 60 * 60 * 1e3));
  const byteLimit = Math.max(1, Math.min(Number(maxBytes) || MAX_RELEASE_BYTES, MAX_RELEASE_BYTES));
  let cache = null, until = 0, pending = null, pendingVersion = null;
  async function check2(currentVersion, checkedAt) {
    const result = {
      schema_version: 1,
      status: "unavailable",
      current_version: currentVersion,
      latest_version: null,
      checked_at: checkedAt.toISOString(),
      release: null,
      preview_command: null,
      reason: null,
      privacy: {
        company_context_sent: false,
        credentials_sent: false,
        public_metadata_only: true,
        automatic_install: false,
        update_requires_confirmation: true
      }
    };
    if (repo !== OFFICIAL_RELEASE_REPO) return { ...result, reason: "update-source-invalid" };
    if (!currentVersion) return { ...result, status: "unversioned", reason: "installation-version-unavailable" };
    const controller = new AbortController();
    let timer;
    try {
      const request = async () => {
        const response = await fetchImpl(`https://api.github.com/repos/${OFFICIAL_RELEASE_REPO}/releases/latest`, {
          headers: { Accept: "application/vnd.github+json", "User-Agent": "cerebro-painel" },
          redirect: "error",
          signal: controller.signal
        });
        if (!response?.ok || response.redirected) throw new Error("update-check-unavailable");
        return boundedJson(response, byteLimit);
      };
      const release = await Promise.race([request(), new Promise((_, reject) => {
        timer = setTimeout(
          () => {
            controller.abort();
            reject(new Error("update-check-timeout"));
          },
          Math.max(1, Math.min(Number(timeoutMs) || 6e3, 15e3))
        );
      })]);
      const tag = release?.tag_name, version = typeof tag === "string" && tag.startsWith("v") ? tag.slice(1) : "";
      const parsed = versionParts(version);
      if (!parsed || parsed.prerelease || release.draft !== false || release.prerelease !== false || typeof release.published_at !== "string" || !/^\d{4}-\d{2}-\d{2}T/.test(release.published_at) || !Number.isFinite(Date.parse(release.published_at))) {
        throw new Error("release-invalid");
      }
      const comparison = compare(currentVersion, version);
      const status = comparison < 0 ? "update-available" : comparison > 0 ? "ahead" : "current";
      return {
        ...result,
        status,
        latest_version: version,
        release: {
          tag,
          title: plainText(release.name, 160) || `C\xE9rebro ${tag}`,
          body: plainText(release.body, 6e3),
          url: `https://github.com/${OFFICIAL_RELEASE_REPO}/releases/tag/${tag}`,
          published_at: release.published_at
        },
        preview_command: status === "update-available" ? `node scripts/update.mjs --tag ${tag} --root .` : null
      };
    } catch (error) {
      const allowed = ["release-invalid", "release-too-large", "update-check-timeout"];
      return { ...result, reason: allowed.includes(error?.message) ? error.message : "update-check-unavailable" };
    } finally {
      clearTimeout(timer);
      controller.abort();
    }
  }
  return {
    async read() {
      const current = await installedVersion(memberRoot), clock = new Date(now());
      if (cache && cache.current_version === current && clock.getTime() < until) return structuredClone(cache);
      if (pending && pendingVersion === current) return structuredClone(await pending);
      if (pending) await pending;
      pendingVersion = current;
      pending = check2(current, clock);
      try {
        cache = await pending;
        until = clock.getTime() + cacheDuration;
        return structuredClone(cache);
      } finally {
        pending = null;
      }
    }
  };
}

// portable/metrics-overview.mjs
import { lstat as lstat2, readdir, realpath, readFile as readFile2 } from "node:fs/promises";
import { join as join23, resolve as resolve25, relative as relative22, sep as sep24 } from "node:path";
var ID = /^[A-Za-z0-9][A-Za-z0-9._:-]{0,159}$/;
var MAX_FILES = 200;
var MAX_BYTES = 256 * 1024;
var MAX_TOTAL = 4 * 1024 * 1024;
var text4 = (value, max = 500) => typeof value === "string" ? value.replace(/[\u0000-\u0008\u000b\u000c\u000e-\u001f\u007f]/g, "").trim().slice(0, max) : "";
var id = (value) => typeof value === "string" && ID.test(value) ? value : null;
var number = (value) => typeof value === "number" && Number.isFinite(value) ? value : null;
var date5 = (value) => typeof value === "string" && /^\d{4}-\d{2}-\d{2}T/.test(value) && Number.isFinite(Date.parse(value)) ? new Date(value).toISOString() : null;
var refs3 = (value) => Array.isArray(value) ? [...new Set(value.slice(0, 50).map(id).filter(Boolean))] : [];
var METRIC_EXAMPLES = Object.freeze([
  { topic: "Onboarding e progresso", examples: ["Pessoas que conclu\xEDram cada etapa", "Tempo at\xE9 o primeiro resultado comprovado"] },
  { topic: "Conte\xFAdo", examples: ["Visualiza\xE7\xF5es por publica\xE7\xE3o", "Novos seguidores no per\xEDodo"] },
  { topic: "Marketing", examples: ["Investimento por campanha", "Custo por lead com origem comprovada"] },
  { topic: "Vendas", examples: ["Compras aprovadas", "Receita e reembolsos por per\xEDodo"] },
  { topic: "Produto", examples: ["Uso das fun\xE7\xF5es", "Reten\xE7\xE3o e resultados comprovados"] },
  { topic: "Uso do C\xE9rebro", examples: ["Execu\xE7\xF5es com recibo", "Entregas aprovadas e falhas"] }
]);
function scopeOf(value = {}) {
  return {
    area_ref: id(value?.area_ref),
    system_ref: id(value?.system_ref),
    workflow_refs: refs3(value?.workflow_refs).sort(),
    subject: value?.subject && id(value.subject.ref) ? { kind: text4(value.subject.kind, 60) || "unspecified", ref: id(value.subject.ref) } : null
  };
}
function periodOf(value = {}) {
  const period = Object.fromEntries(["kind", "mode", "label", "start", "end", "start_date", "end_date", "started_at", "ended_at", "from", "to", "timezone", "cycle_ref", "edition_ref"].filter((key2) => typeof value?.[key2] === "string").map((key2) => [key2, text4(value[key2], 150)]));
  if (typeof value?.partial_day === "boolean") period.partial_day = value.partial_day;
  return period;
}
function fraction(value) {
  if (number(value) !== null) return value;
  if (typeof value === "string" && text4(value)) return { key: null, label: text4(value, 150), value: null, definition: "" };
  if (!value || typeof value !== "object" || Array.isArray(value)) return null;
  return { key: id(value.key), label: text4(value.label, 150), value: number(value.value), definition: text4(value.definition, 500) };
}
function metricOf(value, definition = false) {
  if (!value || !id(value.key) || !text4(value.label, 160) || !text4(value.unit, 40)) return null;
  const measured = Object.hasOwn(value, "value") ? number(value.value) : number(value.count) ?? number(value.brl_cents);
  return {
    key: value.key,
    label: text4(value.label, 160),
    unit: text4(value.unit, 40),
    value: !definition && value.state === "measured" ? measured : null,
    state: !definition && value.state === "measured" && measured !== null ? "measured" : "unavailable",
    target: number(value.target),
    definition: text4(value.definition, 1500) || null,
    numerator: fraction(value.numerator),
    denominator: fraction(value.denominator),
    source_refs: refs3(value.source_refs),
    attribution: text4(typeof value.attribution === "object" ? value.attribution?.basis : value.attribution, 1e3) || "N\xE3o informada.",
    workflow_effect: "not_asserted"
  };
}
function snapshotOf(value) {
  const observedAt = date5(value?.observed_at), sourceId = id(value?.source?.id);
  if (!id(value?.snapshot_id) || !observedAt || !sourceId || !Array.isArray(value.metrics)) return null;
  const metrics = value.metrics.slice(0, 200).map((item) => metricOf(item)).filter(Boolean);
  if (!metrics.length) return null;
  return {
    snapshot_id: value.snapshot_id,
    observed_at: observedAt,
    source: { id: sourceId, label: text4(value.source.label, 160) || sourceId, queried_at: date5(value.source.queried_at) },
    scope: scopeOf(value.scope),
    period: periodOf(value.period),
    metrics
  };
}
function matches(scope, { area, system, workflow }) {
  return (!area || scope.area_ref === area) && (!system || scope.system_ref === system) && (!workflow || scope.workflow_refs.includes(workflow));
}
var scopeKey = (scope) => JSON.stringify(scope);
function buildMetricsOverview(_root, {
  model = {},
  snapshots = [],
  definitions = [],
  area = "",
  system = "",
  workflow = "",
  now = /* @__PURE__ */ new Date(),
  issues = []
} = {}) {
  const filters = { area: id(area), system: id(system), workflow: id(workflow) };
  const invalidFilter = area && !filters.area || system && !filters.system || workflow && !filters.workflow;
  const supplied = Array.isArray(snapshots) ? snapshots.slice(0, 1e3) : [];
  const valid = supplied.map(snapshotOf).filter(Boolean);
  const seen = /* @__PURE__ */ new Set(), unique6 = valid.filter((snapshot) => {
    if (seen.has(snapshot.snapshot_id)) return false;
    seen.add(snapshot.snapshot_id);
    return true;
  });
  const selected = invalidFilter ? [] : unique6.filter((snapshot) => matches(snapshot.scope, filters));
  const registry = /* @__PURE__ */ new Map();
  for (const snapshot of selected) for (const metric of snapshot.metrics) {
    const key2 = JSON.stringify([metric.key, metric.unit, snapshot.source.id, scopeKey(snapshot.scope)]);
    if (!registry.has(key2)) registry.set(key2, { id: key2, ...metric, scope: snapshot.scope, history: [], configured: false });
    registry.get(key2).history.push({
      ...metric,
      snapshot_id: snapshot.snapshot_id,
      observed_at: snapshot.observed_at,
      source: snapshot.source,
      period: snapshot.period
    });
  }
  for (const record2 of registry.values()) {
    record2.history.sort((a, b) => b.observed_at.localeCompare(a.observed_at) || b.snapshot_id.localeCompare(a.snapshot_id));
    Object.assign(record2, record2.history[0]);
    record2.history = record2.history.slice(0, 100);
  }
  for (const raw of (Array.isArray(definitions) ? definitions : []).slice(0, 500)) {
    const definition = metricOf(raw, true), scope = scopeOf(raw?.scope);
    if (!definition || invalidFilter || !matches(scope, filters)) continue;
    const sourceId = id(raw.source_ref);
    const existing = [...registry.values()].filter((item) => item.key === definition.key && item.unit === definition.unit && scopeKey(item.scope) === scopeKey(scope) && (!sourceId || item.source.id === sourceId));
    for (const item of existing) {
      item.configured = true;
      if (item.target === null) item.target = definition.target;
      if (!item.definition) item.definition = definition.definition;
    }
    if (!existing.length) {
      const key2 = JSON.stringify([definition.key, definition.unit, sourceId, scopeKey(scope)]);
      registry.set(key2, {
        id: key2,
        ...definition,
        scope,
        configured: true,
        snapshot_id: null,
        observed_at: null,
        source: sourceId ? { id: sourceId, label: sourceId, queried_at: null } : null,
        period: {},
        history: []
      });
    }
  }
  const indicators = [...registry.values()].map((item) => ({
    ...item,
    target_state: item.target === null ? "not-defined" : "defined",
    value_state: item.state,
    history_count: item.history.length,
    labels: {
      area: model.areas?.find((area2) => area2.area_id === item.scope.area_ref)?.name || item.scope.area_ref,
      system: model.systems?.find((system2) => system2.system_id === item.scope.system_ref)?.name || item.scope.system_ref,
      workflows: item.scope.workflow_refs.map((ref) => ({ ref, label: model.workflows?.find((workflow2) => workflow2.workflow_id === ref)?.name || ref }))
    }
  })).sort((a, b) => (b.observed_at || "").localeCompare(a.observed_at || "") || a.label.localeCompare(b.label));
  return {
    schema_version: 1,
    generated_at: new Date(now).toISOString(),
    filters,
    indicators,
    catalog: {
      areas: (model.areas || []).map((item) => ({ id: item.area_id, label: item.name })),
      systems: (model.systems || []).map((item) => ({ id: item.system_id, label: item.name, area_ref: item.area_ref })),
      workflows: (model.workflows || []).map((item) => ({ id: item.workflow_id, label: item.name, area_ref: item.area_ref, system_ref: item.system_ref }))
    },
    coverage: {
      snapshots_received: supplied.length,
      snapshots_valid: unique6.length,
      snapshots_selected: selected.length,
      rejected_snapshots: supplied.length - valid.length,
      duplicate_snapshots: valid.length - unique6.length,
      measured: indicators.filter((item) => item.state === "measured").length,
      without_value: indicators.filter((item) => item.state !== "measured").length,
      without_target: indicators.filter((item) => item.target === null).length,
      issues: [
        ...issues.slice(0, 30),
        ...invalidFilter ? ["invalid-filter"] : [],
        ...Array.isArray(snapshots) && snapshots.length > 1e3 ? ["snapshot-record-limit"] : []
      ],
      scope: "registered-sources-only"
    },
    examples: METRIC_EXAMPLES,
    workflow_effect: "not_asserted",
    explanation: "As m\xE9tricas pertencem \xE0s \xE1reas, sistemas e workflows indicados nas fontes. Execu\xE7\xE3o e resultado relacionado n\xE3o comprovam efeito causal."
  };
}
async function safeJson(root, parts, budget) {
  let path = root;
  for (const part of parts) {
    if (!part || part === "." || part === ".." || part.includes("/") || part.includes("\\")) throw new Error("unsafe-path");
    path = join23(path, part);
    const info2 = await lstat2(path);
    if (info2.isSymbolicLink()) throw new Error("symlink-blocked");
  }
  const canonical3 = await realpath(path), rel = relative22(root, canonical3);
  if (!rel || rel.startsWith(`..${sep24}`) || rel === ".." || rel.startsWith(sep24)) throw new Error("unsafe-path");
  const info = await lstat2(path);
  if (!info.isFile() || info.size > MAX_BYTES || budget.bytes + info.size > MAX_TOTAL) throw new Error("read-limit");
  const bytes = await readFile2(path);
  if (bytes.length > MAX_BYTES || budget.bytes + bytes.length > MAX_TOTAL) throw new Error("read-limit");
  budget.bytes += bytes.length;
  return JSON.parse(bytes.toString("utf8"));
}
async function readLocalMetricRegistry(root) {
  const result = { definitions: [], snapshots: [], issues: [] }, budget = { bytes: 0 };
  let base;
  try {
    const resolved = resolve25(root);
    if ((await lstat2(resolved)).isSymbolicLink()) throw new Error();
    base = await realpath(resolved);
  } catch {
    return { ...result, issues: ["metrics-root-unavailable"] };
  }
  try {
    const value = await safeJson(base, [".cerebro", "metrics", "definitions.json"], budget);
    result.definitions = Array.isArray(value) ? value.slice(0, 500) : Array.isArray(value.definitions) ? value.definitions.slice(0, 500) : [];
    if (!Array.isArray(value) && !Array.isArray(value?.definitions)) result.issues.push("definitions-invalid");
  } catch (error) {
    if (error.code !== "ENOENT") result.issues.push("definitions-unavailable");
  }
  try {
    for (const path of [join23(base, ".cerebro"), join23(base, ".cerebro", "metrics"), join23(base, ".cerebro", "metrics", "snapshots")]) {
      if ((await lstat2(path)).isSymbolicLink()) throw new Error("symlink-blocked");
    }
    const files = (await readdir(join23(base, ".cerebro", "metrics", "snapshots"), { withFileTypes: true })).filter((item) => item.name.endsWith(".json")).sort((a, b) => a.name.localeCompare(b.name));
    if (files.length > MAX_FILES) result.issues.push("snapshot-file-limit");
    for (const file2 of files.slice(0, MAX_FILES)) {
      try {
        const value = await safeJson(base, [".cerebro", "metrics", "snapshots", file2.name], budget);
        result.snapshots.push(value);
      } catch {
        result.issues.push("snapshot-unreadable");
      }
    }
  } catch (error) {
    if (error.code !== "ENOENT") result.issues.push("snapshots-unavailable");
  }
  result.issues = [...new Set(result.issues)];
  return result;
}
async function readMetricsOverview(root, options = {}) {
  const local = await readLocalMetricRegistry(root);
  return buildMetricsOverview(root, {
    ...options,
    definitions: [...local.definitions, ...options.definitions || []],
    snapshots: [...options.snapshots || [], ...local.snapshots],
    issues: [...local.issues, ...options.issues || []]
  });
}

// portable/installed-contracts.mjs
import { lstatSync as lstatSync19, readdirSync as readdirSync20, readFileSync as readFileSync24, realpathSync as realpathSync15 } from "node:fs";
import { join as join24, resolve as resolve26 } from "node:path";
var ID2 = /^[A-Za-z0-9][A-Za-z0-9_-]{0,127}$/;
var object21 = (value) => value && typeof value === "object" && !Array.isArray(value);
var list4 = (value) => Array.isArray(value) ? value : [];
function text5(value, max = 500) {
  if (typeof value !== "string" || !value.trim() || value.length > max || /[\x00-\x08\x0b\x0c\x0e-\x1f]/.test(value) || /Bearer\s|-----BEGIN .*PRIVATE KEY|\b(?:sk-[\w-]{16,}|gh[pousr]_[\w]{16,}|xox[baprs]-[\w-]{16,})/i.test(value)) return null;
  return value.trim().replace(/[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/gi, "[e-mail omitido]");
}
var id2 = (value) => typeof value === "string" && ID2.test(value) ? value : null;
var date6 = (value) => typeof value === "string" && /^\d{4}-\d{2}-\d{2}T/.test(value) && Number.isFinite(Date.parse(value)) ? new Date(value).toISOString() : null;
var state = (value) => typeof value === "string" && /^[a-z][a-z0-9_-]{0,63}$/.test(value) ? value : null;
function readDirectory(root, directory2, { limit, issues, onlyName = null }) {
  let cursor = root;
  for (const part of directory2.split("/")) {
    cursor = join24(cursor, part);
    try {
      const info = lstatSync19(cursor);
      if (info.isSymbolicLink() || !info.isDirectory()) {
        issues.add("Um caminho de contratos ou recibos foi recusado.");
        return [];
      }
    } catch (error) {
      if (error.code !== "ENOENT") issues.add("Uma pasta de contratos ou recibos n\xE3o p\xF4de ser lida.");
      return [];
    }
  }
  let names;
  try {
    names = readdirSync20(cursor).filter((name) => onlyName ? name === onlyName : name.endsWith(".json")).sort();
  } catch {
    issues.add("Uma pasta de contratos ou recibos n\xE3o p\xF4de ser lida.");
    return [];
  }
  if (names.length > limit) issues.add(`O limite de ${limit} registros por pasta foi atingido; a leitura \xE9 parcial.`);
  return names.slice(0, limit).flatMap((name) => {
    try {
      const file2 = join24(cursor, name), info = lstatSync19(file2);
      if (info.isSymbolicLink() || !info.isFile() || info.size > 1024 * 1024) throw new Error("restricted-record");
      const record2 = JSON.parse(readFileSync24(file2, "utf8"));
      if (!object21(record2)) throw new Error("invalid-record");
      return [{ record: record2, path: `${directory2}/${name}` }];
    } catch {
      issues.add("H\xE1 registros ileg\xEDveis ou recusados; eles n\xE3o entraram nesta leitura.");
      return [];
    }
  });
}
function nativeContracts(root, limit, issues) {
  const pending = [{ path: "sistemas", depth: 0 }], rows = [];
  let visited = 0;
  while (pending.length) {
    if (++visited > limit) {
      issues.add("O limite de pastas de sistemas foi atingido; a leitura \xE9 parcial.");
      break;
    }
    const { path, depth } = pending.shift();
    let entries;
    try {
      const info = lstatSync19(join24(root, path));
      if (info.isSymbolicLink() || !info.isDirectory()) {
        issues.add("Um caminho de sistemas foi recusado.");
        continue;
      }
      entries = readdirSync20(join24(root, path), { withFileTypes: true });
    } catch (error) {
      if (error.code !== "ENOENT") issues.add("Uma pasta de sistemas n\xE3o p\xF4de ser lida.");
      continue;
    }
    if (entries.some((entry) => entry.name === "contract.json")) {
      rows.push(...readDirectory(root, path, { limit: 1, issues, onlyName: "contract.json" }));
      continue;
    }
    const children = entries.filter((entry) => !entry.name.startsWith(".") && !["releases", "workspace", "node_modules"].includes(entry.name) && (entry.isDirectory() || entry.isSymbolicLink())).sort((a, b) => a.name.localeCompare(b.name));
    if (depth >= 6 && children.length) {
      issues.add("H\xE1 sistemas al\xE9m da profundidade permitida; a leitura \xE9 parcial.");
      continue;
    }
    for (const entry of children) pending.push({ path: `${path}/${entry.name}`, depth: depth + 1 });
  }
  return rows;
}
var canonical2 = (value) => Array.isArray(value) ? value.map(canonical2) : object21(value) ? Object.fromEntries(Object.keys(value).sort().map((key2) => [key2, canonical2(value[key2])])) : value;
function contractCopies(rows) {
  const seen = /* @__PURE__ */ new Set();
  return rows.filter((row) => {
    const key2 = JSON.stringify(canonical2(row.record));
    if (seen.has(key2)) return false;
    seen.add(key2);
    return true;
  });
}
function uniqueRecords(rows, key2, issues) {
  const counts = /* @__PURE__ */ new Map();
  for (const row of rows) if (id2(row.record[key2])) counts.set(row.record[key2], (counts.get(row.record[key2]) || 0) + 1);
  return rows.filter((row) => {
    const value = id2(row.record[key2]);
    if (!value || counts.get(value) !== 1) {
      issues.add("H\xE1 identificadores ausentes ou duplicados; os registros afetados n\xE3o foram associados.");
      return false;
    }
    return true;
  });
}
function readInstalledContracts(root, { now = Date.now(), contractLimit = 1e3, receiptLimit = 5e3 } = {}) {
  const generated_at = new Date(now).toISOString();
  const unavailable2 = () => ({ available: false, generated_at, systems: [], coverage: { complete: false, notes: ["N\xE3o foi poss\xEDvel ler a pasta expl\xEDcita desta empresa."] } });
  if (typeof root !== "string" || !root) return unavailable2();
  let base;
  try {
    base = realpathSync15(resolve26(root));
    if (!lstatSync19(base).isDirectory()) return unavailable2();
  } catch {
    return unavailable2();
  }
  const issues = /* @__PURE__ */ new Set();
  const read = (directory2, limit = contractLimit) => readDirectory(base, directory2, { limit: Math.max(1, Math.min(1e4, limit)), issues });
  const systems = uniqueRecords(contractCopies([...read(".cerebro/contracts/systems"), ...nativeContracts(base, contractLimit, issues)]), "system_id", issues);
  const states = uniqueRecords(read(".cerebro/sistemas"), "system_id", issues);
  const installations = new Map(states.map((row) => [row.record.system_id, { status: state(row.record.status), version: text5(row.record.package_version, 50), updated_at: date6(row.record.updated_at), state_path: row.path }]));
  const declaredIds = new Set(systems.map((row) => row.record.system_id));
  for (const row of states) if (!declaredIds.has(row.record.system_id)) systems.push({ record: { system_id: row.record.system_id }, path: null });
  const sources = uniqueRecords(read(".cerebro/contracts/sources"), "source_id", issues);
  const routines = uniqueRecords(read(".cerebro/contracts/routines"), "routine_id", issues);
  const sourceNames = new Map(sources.map(({ record: record2 }) => [record2.source_id, text5(record2.name, 180) || record2.source_id]));
  const receipts = read(".cerebro/runtime/receipts/routines", receiptLimit).flatMap(({ record: record2, path }) => {
    const runId = id2(record2.run_id) || id2(record2.receipt_id);
    const started = date6(record2.started_at), completed = date6(record2.completed_at);
    const at = completed || started;
    if (!runId || !at || Date.parse(at) > now) return [];
    const routineId2 = id2(record2.routine_id) || id2(typeof record2.routine_ref === "string" ? record2.routine_ref.replace(/^routine:/, "") : null);
    return [{ id: runId, routine_id: routineId2, system_ref: id2(record2.system_ref), at, status: state(record2.status), receipt_path: path }];
  });
  const projected = systems.map(({ record: record2, path }) => {
    const owned = routines.filter((row) => row.record.system_ref === record2.system_id);
    const routineIds = new Set(owned.map((row) => row.record.routine_id));
    const runs = [...new Map(receipts.filter((run) => run.system_ref === record2.system_id || !run.system_ref && routineIds.has(run.routine_id)).sort((a, b) => a.at.localeCompare(b.at)).map((run) => [run.id, run])).values()].sort((a, b) => b.at.localeCompare(a.at));
    return {
      id: record2.system_id,
      name: text5(record2.name, 180) || record2.system_id,
      version: text5(record2.version, 50),
      status: state(record2.status),
      contract_path: path,
      installation: installations.get(record2.system_id) || null,
      result: text5(record2.result?.statement),
      area: text5(record2.extensions?.business_function, 120) || text5(record2.extensions?.operating_area, 120),
      source_refs: list4(record2.sources).flatMap((source) => object21(source) ? [{ id: id2(source.source_id), role: text5(source.role, 120), name: sourceNames.get(source.source_id) || id2(source.source_id), required: source.required === true }] : []),
      steps: list4(record2.pipeline).flatMap((step) => {
        if (!object21(step)) return [];
        const name = text5(step.name, 180) || text5(step.state, 180) || text5(step.step_id, 180);
        return name ? [{ name, input: text5(step.input), output: text5(step.output), gate: text5(step.gate) }] : [];
      }),
      routines: owned.map(({ record: routine, path: routinePath }) => ({
        id: routine.routine_id,
        name: text5(routine.name, 180) || routine.routine_id,
        status: state(routine.lifecycle),
        contract_path: routinePath,
        cadence: state(routine.trigger?.schedule?.cadence),
        time: text5(routine.trigger?.schedule?.time, 20),
        timezone: text5(routine.trigger?.schedule?.timezone, 80)
      })),
      runs_total: runs.length,
      last_run: runs[0] || null
    };
  });
  return { available: true, generated_at, systems: projected, coverage: {
    complete: issues.size === 0,
    notes: [
      "Contratos locais, anteriores \xE0 organiza\xE7\xE3o por \xE1reas e workflows. Nenhuma \xE1rea, etapa ou rela\xE7\xE3o foi criada por esta leitura.",
      "Fontes e passos s\xE3o declara\xE7\xF5es do contrato; n\xE3o comprovam leitura, permiss\xE3o ou execu\xE7\xE3o. Execu\xE7\xF5es exigem recibo com in\xEDcio ou conclus\xE3o e v\xEDnculo expl\xEDcito.",
      ...issues
    ]
  } };
}

// portable/server.mjs
var sha = (text6) => createHash10("sha256").update(text6).digest("hex");
var MIME = { ".html": "text/html; charset=utf-8", ".js": "text/javascript; charset=utf-8", ".css": "text/css; charset=utf-8", ".svg": "image/svg+xml", ".woff2": "font/woff2", ".png": "image/png", ".ico": "image/x-icon" };
var missing = (reason) => ({ ok: false, available: false, reason });
function assertLocalTree(root, part = ".cerebro") {
  let cursor = root;
  for (const name of part.split("/")) {
    cursor = join25(cursor, name);
    if (!existsSync23(cursor)) return;
    if (lstatSync20(cursor).isSymbolicLink()) throw new Error("member-tree-symlink");
  }
  const pending = [cursor];
  let visited = 0;
  while (pending.length) {
    const path = pending.pop();
    if (++visited > 3e4) throw new Error("member-tree-limit");
    const info = lstatSync20(path);
    if (info.isSymbolicLink()) throw new Error("member-tree-symlink");
    if (info.isDirectory()) pending.push(...readdirSync21(path).map((name) => join25(path, name)));
  }
}
function memberCatalog(root) {
  assertLocalTree(root);
  const model = buildCatalogReadModel(root);
  if (model.available) return model;
  if (existsSync23(join25(root, ".cerebro/catalog/catalog.json"))) return model;
  return {
    ...model,
    available: true,
    reason: null,
    catalog_name: "Minha empresa",
    catalog_version: null,
    catalog_sha256: null,
    lock_matches: false,
    counts: { areas: 0, systems: 0, workflows: 0, packages: 0, agents: 0, sources: 0, artifacts: 0, journeys: 0 },
    validation: { errors: [], warnings: ["A empresa ainda n\xE3o tem um cat\xE1logo de \xE1reas e sistemas. Seus arquivos continuam dispon\xEDveis em C\xE9rebro."] },
    setup_required: true
  };
}
function artifacts(root, type) {
  const items = indexNotePaths(root).flatMap(({ path }) => {
    const note = readNote(root, path);
    if (!note.ok) return [];
    const kind = note.frontmatter?.tipo || "nota";
    if (type && type !== "todos" && kind !== type) return [];
    const id3 = `note-${sha(path).slice(0, 24)}`;
    const origin = note.frontmatter?.origem ? resolveNoteReference(root, note.frontmatter.origem, { fromPath: path }) : null;
    return [{
      id: id3,
      type: kind,
      title: note.title,
      status: "unknown",
      status_label: "Estado n\xE3o declarado",
      format: note.format,
      date: note.frontmatter?.criado || null,
      version: sha(note.body),
      path,
      content_url: `/api/artifacts/content?id=${id3}`,
      source_refs: origin?.ok ? [{ path: origin.path, label: "Origem registrada" }] : [],
      used_by: [],
      versions: []
    }];
  });
  return { available: true, generated_at: (/* @__PURE__ */ new Date()).toISOString(), items, coverage: { label: "Arquivos leg\xEDveis desta empresa", live: false, complete: true, notes: ["O tipo vem da propriedade tipo da nota. Arquivos restritos n\xE3o aparecem."] } };
}
async function requestJson(request) {
  let size = 0;
  const chunks = [];
  for await (const chunk of request) {
    size += chunk.length;
    if (size > 16e3) throw new Error("body-limit");
    chunks.push(chunk);
  }
  return JSON.parse(Buffer.concat(chunks).toString("utf8"));
}
function createPortablePanel({ root, staticRoot, updateReader, collectIntervalMs = 3e4 }) {
  if (!root || !staticRoot) throw new Error("explicit-member-and-static-roots-required");
  const memberRoot = realpathSync16(resolve27(root));
  const assets = realpathSync16(resolve27(staticRoot));
  if (!lstatSync20(memberRoot).isDirectory() || !lstatSync20(assets).isDirectory()) throw new Error("directory-required");
  assertLocalTree(memberRoot);
  const themeHashes = [...readFileSync25(join25(assets, "index.html"), "utf8").matchAll(/<script>([\s\S]*?)<\/script>/g)].map((match) => ` 'sha256-${createHash10("sha256").update(match[1]).digest("base64")}'`).join("");
  const token3 = randomBytes(32).toString("hex");
  const repository = createInboxRepository({ dataRoot: memberRoot, stateRoot: join25(memberRoot, ".cerebro/runtime/painel-assistant") });
  const updates = updateReader || createUpdateReader({ root: memberRoot });
  const investigations = /* @__PURE__ */ new Map();
  const collector = startInboxCollector({ repository, intervalMs: collectIntervalMs, collect: () => {
    const model = memberCatalog(memberRoot);
    const collection = collectInboxEvents(memberRoot, memberRoot, { model });
    return { ...collection, events: collection.events.filter((event) => !event.commercial) };
  } });
  const send = (response, status, body) => {
    response.writeHead(status, { "content-type": "application/json; charset=utf-8", "cache-control": "no-store", "x-content-type-options": "nosniff" });
    response.end(JSON.stringify(body));
  };
  const server = createServer(async (request, response) => {
    const address = server.address();
    const port = address?.port;
    const hosts = /* @__PURE__ */ new Set([`127.0.0.1:${port}`, `localhost:${port}`]);
    if (!hosts.has(request.headers.host)) return send(response, 403, missing("host-not-allowed"));
    if (request.headers.origin && request.headers.origin !== `http://${request.headers.host}`) return send(response, 403, missing("origin-not-allowed"));
    const url = new URL(request.url, `http://${request.headers.host}`);
    const path = url.pathname;
    const q = url.searchParams;
    if (!["GET", "POST"].includes(request.method)) return send(response, 405, missing("method-not-allowed"));
    if (request.method === "POST") {
      const supplied = request.headers["x-painel-token"];
      if (typeof supplied !== "string" || !/^[a-f0-9]{64}$/.test(supplied) || !timingSafeEqual(Buffer.from(token3), Buffer.from(supplied))) return send(response, 403, missing("session-token-required"));
      if (!request.headers["content-type"]?.startsWith("application/json")) return send(response, 415, missing("json-required"));
    }
    try {
      if (path.startsWith("/api/")) assertLocalTree(memberRoot);
      if (path === "/api/painel/installed-systems" && request.method === "GET") return send(response, 200, readInstalledContracts(memberRoot));
      if (path === "/api/catalog" && request.method === "GET") return send(response, 200, memberCatalog(memberRoot));
      if (path === "/api/painel/metrics/overview" && request.method === "GET") return send(response, 200, await readMetricsOverview(memberRoot, { model: memberCatalog(memberRoot), area: q.get("area") || "", system: q.get("system") || "", workflow: q.get("workflow") || "" }));
      if (path === "/api/painel/update" && request.method === "GET") return send(response, 200, await updates.read());
      if (path === "/api/painel/inbox" && request.method === "GET") {
        await collector.ready;
        return send(response, 200, { ...repository.list(), csrf_token: token3, error: collector.error, capabilities: { local_only: true } });
      }
      if (path === "/api/painel/inbox/record" && request.method === "GET") return send(response, 200, repository.record(q.get("id")));
      if (path === "/api/painel/inbox/artifact" && request.method === "GET") return send(response, 200, repository.artifact(q.get("id")));
      if (path === "/api/painel/inbox/read" && request.method === "POST") {
        const b = await requestJson(request);
        return send(response, 200, { ok: true, message: repository.markRead(b.id, b.read) });
      }
      if (path === "/api/painel/inbox/snooze" && request.method === "POST") {
        const b = await requestJson(request);
        return send(response, 200, { ok: true, message: repository.snooze(b.id, b.until) });
      }
      if (path === "/api/painel/activity" && request.method === "GET") return send(response, 200, buildPainelActivity(memberRoot, memberRoot, { model: memberCatalog(memberRoot) }));
      if (path === "/api/workflow-evidence" && request.method === "GET") return send(response, 200, buildWorkflowEvidence(memberRoot, memberRoot, q.get("id"), { model: memberCatalog(memberRoot), runId: q.get("run") }));
      if (path === "/api/cerebro/map" && request.method === "GET") return send(response, 200, { generated_at: (/* @__PURE__ */ new Date()).toISOString(), groups: scanCompanyMap(memberRoot), diagnostic: { total_notes: indexNotePaths(memberRoot).length, domains: scanCompanyMap(memberRoot).map((group) => ({ name: group.name, count: group.entries.reduce((sum, entry) => sum + entry.notes, 0) })).sort((a, b) => b.count - a.count), most_linked: [] } });
      if (path === "/api/cerebro/collection" && request.method === "GET") return send(response, 200, listCollectionNotes(memberRoot, q.get("id"), { limit: 300, query: q.get("q") || "" }));
      if (path === "/api/cerebro/note" && request.method === "GET") {
        const note = readNote(memberRoot, q.get("path"));
        return send(response, note.ok ? 200 : 404, note);
      }
      if (path === "/api/cerebro/resolve" && request.method === "GET") return send(response, 200, resolveNoteReference(memberRoot, q.get("target"), { fromPath: q.get("from") || "" }));
      if (path === "/api/artifacts" && request.method === "GET") return send(response, 200, artifacts(memberRoot, q.get("type")));
      if (path === "/api/artifacts/content" && request.method === "GET") {
        const item = artifacts(memberRoot).items.find((item2) => item2.id === q.get("id"));
        return send(response, item ? 200 : 404, item ? readNote(memberRoot, item.path) : missing("Artefato n\xE3o encontrado."));
      }
      if (path === "/api/experiments" && request.method === "GET") return send(response, 200, { available: false, experiments: [], reason: "Abra os contratos de experimento no C\xE9rebro desta empresa." });
      if (path === "/api/painel/assistant" && request.method === "POST") {
        const body = await requestJson(request);
        if (typeof body.message !== "string" || body.message.length > 2e3) return send(response, 400, missing("Pergunta inv\xE1lida."));
        const query = body.message.toLocaleLowerCase("pt-BR").split(/\W+/).filter((word) => word.length > 3);
        const found = artifacts(memberRoot).items.filter((item) => query.some((word) => item.title.toLocaleLowerCase("pt-BR").includes(word))).slice(0, 8);
        return send(response, 200, { ok: true, generated_at: (/* @__PURE__ */ new Date()).toISOString(), answer: found.length ? "Encontrei estes arquivos pelo t\xEDtulo. Abra as refer\xEAncias para ler o conte\xFAdo. Esta \xE9 uma busca local, sem resposta gerada por modelo." : "N\xE3o encontrei um arquivo pelo t\xEDtulo. Os avisos aparecem quando suas rotinas registram entregas. Para analisar ou executar um trabalho, abra seu C\xE9rebro no Codex ou Claude.", refs: found.map((item) => ({ path: item.path, label: item.title })) });
      }
      if (path === "/api/painel/investigations/capabilities" && request.method === "GET") return send(response, 200, { available: true, tools: ["codex", "claude"].map((id3) => ({ id: id3, installed: false, mode: "copy", name: id3 === "codex" ? "Codex" : "Claude", can_open: false, reason: "Copie o contexto para a ferramenta que usa nesta empresa." })) });
      if (path === "/api/painel/investigations/prepare" && request.method === "POST") {
        const b = await requestJson(request);
        const origin = repository.origin(b.message_id);
        if (!origin) return send(response, 404, missing("Ocorr\xEAncia n\xE3o encontrada."));
        const id3 = `local-${sha(b.message_id + String(b.question || "")).slice(0, 24)}`;
        const investigation = { id: id3, tool: ["codex", "claude"].includes(b.tool) ? b.tool : "codex", observation: String(b.question || "").slice(0, 2e3), context_text: [origin.title, origin.body, `Evento: ${origin.event_key}`, `Workflow: ${origin.workflow_id || "n\xE3o identificado"}`, `Execu\xE7\xE3o: ${origin.run_id || "n\xE3o identificada"}`, origin.artifact?.path ? `Artefato: ${origin.artifact.path}` : "", String(b.question || "").slice(0, 2e3)].join("\n"), status: "prepared", created_at: (/* @__PURE__ */ new Date()).toISOString() };
        investigations.set(id3, { messageId: b.message_id, investigation });
        return send(response, 200, { ok: true, investigation });
      }
      if (path === "/api/painel/investigations/launch" && request.method === "POST") {
        const b = await requestJson(request);
        const item = investigations.get(b.id);
        return send(response, 200, item && repository.origin(item.messageId) ? { ok: true, status: "copy_required", opened: false, investigation: item.investigation, reason: "Copie o contexto para sua ferramenta. Nenhum aplicativo foi aberto." } : missing("Prepare novamente o contexto."));
      }
      if (path === "/api/painel/investigations/read" && request.method === "GET") {
        const stored = investigations.get(q.get("id"));
        return send(response, 200, stored && repository.origin(stored.messageId) ? { ok: true, investigation: stored.investigation } : missing("Prepare novamente o contexto desta ocorr\xEAncia."));
      }
      if (path.startsWith("/api/")) return send(response, 404, missing("Recurso n\xE3o instalado nesta empresa."));
      if (request.method !== "GET") return send(response, 405, missing("method-not-allowed"));
      const requested = decodeURIComponent(path);
      const file2 = resolve27(assets, "." + (requested === "/" ? "/index.html" : requested));
      if (!file2.startsWith(assets + sep25)) return send(response, 403, missing("static-path-denied"));
      const real = realpathSync16(file2);
      if (!real.startsWith(assets + sep25) || !lstatSync20(real).isFile()) return send(response, 404, missing("not-found"));
      response.writeHead(200, { "content-type": MIME[extname2(real)] || "application/octet-stream", "cache-control": "no-cache", "x-content-type-options": "nosniff", "referrer-policy": "no-referrer", "content-security-policy": `default-src 'self'; script-src 'self'${themeHashes}; style-src 'self' 'unsafe-inline'; img-src 'self' data: https:; font-src 'self'; connect-src 'self'; frame-src 'none'; object-src 'none'; base-uri 'self'; frame-ancestors 'none'` });
      response.end(readFileSync25(real));
    } catch (error) {
      send(response, error.code === "ENOENT" ? 404 : 400, missing("N\xE3o foi poss\xEDvel ler este registro dentro da pasta autorizada."));
    }
  });
  server.once("close", () => collector.stop());
  return { server, repository, collector, root: memberRoot, close: () => {
    collector.stop();
    server.close();
  } };
}
export {
  assertLocalTree,
  createPortablePanel,
  memberCatalog
};
