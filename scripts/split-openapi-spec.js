#!/usr/bin/env node
/**
 * Splits a combined OpenAPI spec into individual spec files per endpoint
 * (one file per path + HTTP method).
 *
 * Usage: node scripts/split-openapi-spec.js [input-spec] [output-dir]
 * Default: static/express-apis-openapi-spec-devex.json -> static/ (replaces existing per-endpoint files)
 */

const fs = require('fs');
const path = require('path');

const INPUT_SPEC = process.argv[2] || path.join(__dirname, '../static/express-apis-openapi-spec-devex.json');
const OUTPUT_DIR = process.argv[3] || path.join(__dirname, '../static');

/** Map (path, method) -> existing static filename (replaces these files in static/) */
const OUTPUT_FILENAMES = {
    '/alpha/tagged-documents': { get: 'alpha-tagged-documents.json' },
    '/alpha/tagged-documents/{documentId}': { get: 'alpha-tagged-documents-documentId.json' },
    '/alpha/generate-variation': { post: 'alpha-generate-variation.json' },
    '/alpha/export-rendition': { post: 'alpha-export-rendition.json' },
    '/status/{jobId}': { get: 'status-jobId.json' },
};

/**
 * Recursively collect all $ref values (e.g. "#/components/schemas/Foo") from an object.
 * @param {object} obj - Any JSON object (path item, schema, etc.)
 * @param {Set<string>} refs - Set to add refs to
 */
function collectRefs(obj, refs = new Set()) {
    if (obj === null || typeof obj !== 'object') return refs;
    if (Array.isArray(obj)) {
        obj.forEach((item) => collectRefs(item, refs));
        return refs;
    }
    if (obj.$ref && typeof obj.$ref === 'string') {
        refs.add(obj.$ref);
        return refs;
    }
    for (const value of Object.values(obj)) {
        collectRefs(value, refs);
    }
    return refs;
}

/**
 * Resolve a JSON pointer like "#/components/schemas/Foo" to the referenced object.
 * @param {object} root - Full spec (root)
 * @param {string} ref - e.g. "#/components/schemas/Foo"
 * @returns {object|undefined}
 */
function resolveRef(root, ref) {
    if (!ref || !ref.startsWith('#/')) return undefined;
    const parts = ref.slice(2).split('/');
    let current = root;
    for (const key of parts) {
        current = current?.[key];
        if (current === undefined) return undefined;
    }
    return current;
}

/**
 * Get component key from ref: "#/components/schemas/Foo" -> ["schemas", "Foo"]
 * @param {string} ref
 * @returns {[string, string]|null} e.g. ["schemas", "Foo"] or ["examples", "Bar"]
 */
function refToComponentKey(ref) {
    const match = /^#\/components\/(schemas|examples|securitySchemes)\/(.+)$/.exec(ref);
    return match ? [match[1], match[2]] : null;
}

/**
 * Collect all refs that are transitively needed (refs inside components too).
 * @param {object} spec - Full OpenAPI spec
 * @param {Set<string>} initialRefs - Refs from the path item
 * @returns {Set<string>}
 */
function collectTransitiveRefs(spec, initialRefs) {
    const refs = new Set(initialRefs);
    let added = true;
    while (added) {
        added = false;
        for (const ref of refs) {
            const key = refToComponentKey(ref);
            if (!key) continue;
            const [compType, name] = key;
            const comp = spec.components?.[compType]?.[name];
            if (!comp) continue;
            const before = refs.size;
            collectRefs(comp, refs);
            if (refs.size > before) added = true;
        }
    }
    return refs;
}

/**
 * Build a safe filename from path and method.
 * e.g. "/alpha/tagged-documents", "get" -> "alpha-tagged-documents-get"
 * e.g. "/alpha/tagged-documents/{documentId}", "get" -> "alpha-tagged-documents-documentId-get"
 */
function pathAndMethodToFilename(pathStr, method) {
    const noLeading = pathStr.replace(/^\//, '');
    const slug = noLeading
        .replace(/\//g, '-')
        .replace(/\{[^}]+\}/g, (m) => m.slice(1, -1)); // {documentId} -> documentId
    return `${slug}-${method}`.toLowerCase();
}

function main() {
    const specPath = path.resolve(INPUT_SPEC);
    const outDir = path.resolve(OUTPUT_DIR);

    if (!fs.existsSync(specPath)) {
        console.error('Input spec not found:', specPath);
        process.exit(1);
    }

    const spec = JSON.parse(fs.readFileSync(specPath, 'utf8'));
    const paths = spec.paths || {};
    const components = spec.components || {};

    if (!fs.existsSync(outDir)) {
        fs.mkdirSync(outDir, { recursive: true });
    }

    const written = [];

    for (const [pathStr, pathItem] of Object.entries(paths)) {
        if (typeof pathItem !== 'object' || pathItem === null) continue;

        const methods = ['get', 'post', 'put', 'patch', 'delete', 'head', 'options'];
        for (const method of methods) {
            const operation = pathItem[method];
            if (!operation) continue;

            // Single-path spec: only this path and this method
            const singlePath = {
                [pathStr]: {
                    [method]: operation,
                    // Preserve path-level parameters if any
                    ...(pathItem.parameters && { parameters: pathItem.parameters }),
                },
            };

            const initialRefs = collectRefs(singlePath, new Set());
            const allRefs = collectTransitiveRefs(spec, initialRefs);

            const filteredComponents = {
                securitySchemes: components.securitySchemes || {},
                schemas: {},
                examples: {},
            };

            for (const ref of allRefs) {
                const key = refToComponentKey(ref);
                if (!key) continue;
                const [compType, name] = key;
                if (compType === 'securitySchemes') continue; // already included
                if ((compType === 'schemas' || compType === 'examples') && components[compType]?.[name]) {
                    filteredComponents[compType][name] = components[compType][name];
                }
            }

            const miniSpec = {
                openapi: spec.openapi,
                info: spec.info,
                servers: spec.servers,
                paths: singlePath,
                components: filteredComponents,
            };

            if (spec.security) {
                miniSpec.security = spec.security;
            }

            const filename =
                OUTPUT_FILENAMES[pathStr]?.[method] ||
                `${pathAndMethodToFilename(pathStr, method)}.json`;
            const outPath = path.join(outDir, filename);
            fs.writeFileSync(outPath, JSON.stringify(miniSpec, null, 4), 'utf8');
            written.push({ path: pathStr, method, file: filename });
        }
    }

    console.log(`Wrote ${written.length} spec(s) to ${outDir}:`);
    written.forEach(({ path: p, method, file }) => console.log(`  ${p} [${method}] -> ${file}`));
}

main();
