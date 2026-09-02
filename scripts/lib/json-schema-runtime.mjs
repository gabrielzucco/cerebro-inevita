function object(value) {
  return value !== null && typeof value === 'object' && !Array.isArray(value);
}

function same(left, right) {
  return JSON.stringify(left) === JSON.stringify(right);
}

function resolveRef(rootSchema, ref) {
  if (!String(ref).startsWith('#/')) throw new Error('artifact-schema-external-ref-not-supported');
  let current = rootSchema;
  for (const segment of ref.slice(2).split('/')) {
    const key = segment.replaceAll('~1', '/').replaceAll('~0', '~');
    if (!object(current) || !Object.hasOwn(current, key)) throw new Error('artifact-schema-ref-missing');
    current = current[key];
  }
  return current;
}

function matchesType(value, type) {
  if (type === 'null') return value === null;
  if (type === 'array') return Array.isArray(value);
  if (type === 'object') return object(value);
  if (type === 'integer') return Number.isInteger(value);
  if (type === 'number') return typeof value === 'number' && Number.isFinite(value);
  return typeof value === type;
}

function validateNode(value, schema, rootSchema, path, errors) {
  if (!object(schema)) {
    errors.push(`${path}: schema inválido`);
    return;
  }
  if (schema.$ref) {
    validateNode(value, resolveRef(rootSchema, schema.$ref), rootSchema, path, errors);
    return;
  }
  if (Array.isArray(schema.oneOf)) {
    const matches = schema.oneOf.filter((candidate) => {
      const candidateErrors = [];
      validateNode(value, candidate, rootSchema, path, candidateErrors);
      return candidateErrors.length === 0;
    });
    if (matches.length !== 1) errors.push(`${path}: precisa corresponder a exatamente uma opção`);
    return;
  }
  if (Object.hasOwn(schema, 'const') && !same(value, schema.const)) errors.push(`${path}: const inválida`);
  if (Array.isArray(schema.enum) && !schema.enum.some((item) => same(item, value))) errors.push(`${path}: enum inválido`);
  const types = Array.isArray(schema.type) ? schema.type : schema.type ? [schema.type] : [];
  if (types.length && !types.some((type) => matchesType(value, type))) {
    errors.push(`${path}: tipo inválido`);
    return;
  }
  if (typeof value === 'string') {
    if (Number.isInteger(schema.minLength) && value.length < schema.minLength) errors.push(`${path}: texto curto`);
    if (Number.isInteger(schema.maxLength) && value.length > schema.maxLength) errors.push(`${path}: texto longo`);
    if (schema.pattern && !(new RegExp(schema.pattern)).test(value)) errors.push(`${path}: padrão inválido`);
  }
  if (Array.isArray(value)) {
    if (Number.isInteger(schema.minItems) && value.length < schema.minItems) errors.push(`${path}: poucos itens`);
    if (schema.uniqueItems && new Set(value.map((item) => JSON.stringify(item))).size !== value.length) {
      errors.push(`${path}: itens repetidos`);
    }
    if (schema.items) value.forEach((item, index) => validateNode(item, schema.items, rootSchema, `${path}[${index}]`, errors));
  }
  if (object(value)) {
    for (const key of schema.required || []) if (!Object.hasOwn(value, key)) errors.push(`${path}.${key}: obrigatório`);
    if (schema.additionalProperties === false) {
      const allowed = new Set(Object.keys(schema.properties || {}));
      for (const key of Object.keys(value)) if (!allowed.has(key)) errors.push(`${path}.${key}: não permitido`);
    }
    for (const [key, property] of Object.entries(schema.properties || {})) {
      if (Object.hasOwn(value, key)) validateNode(value[key], property, rootSchema, `${path}.${key}`, errors);
    }
  }
}

export function validateJsonSchema(value, schema) {
  const errors = [];
  validateNode(value, schema, schema, '$', errors);
  return [...new Set(errors)];
}
