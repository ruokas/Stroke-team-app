const registry = new Map();

/**
 * Register a boot feature with optional dependencies.
 * @param {{ id: string, init: (context: any) => any | Promise<any>, deps?: string[] }} feature
 */
export function registerFeature(feature) {
  if (!feature?.id) throw new Error('Feature id is required');
  if (typeof feature.init !== 'function')
    throw new Error(`Feature "${feature.id}" is missing init()`);
  if (registry.has(feature.id))
    throw new Error(`Feature "${feature.id}" already registered`);
  registry.set(feature.id, { ...feature, deps: feature.deps ?? [] });
}

/**
 * Run all registered features honoring declared dependencies.
 * @param {any} context
 */
export async function runAll(context) {
  const executed = new Set();
  const visiting = new Set();

  const runFeature = async (id) => {
    if (executed.has(id)) return;
    const feature = registry.get(id);
    if (!feature) throw new Error(`Unknown feature "${id}"`);
    if (visiting.has(id))
      throw new Error(`Circular dependency detected at "${id}"`);
    visiting.add(id);
    for (const dep of feature.deps) {
      await runFeature(dep);
    }
    await feature.init(context);
    executed.add(id);
    visiting.delete(id);
  };

  for (const id of registry.keys()) {
    await runFeature(id);
  }
}

export function clearFeatures() {
  registry.clear();
}
