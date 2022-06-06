import { it, expect } from "vitest"
import { readFileSync, statSync } from "node:fs"
import datasets from "../src/datasets.json"
import { mkFilterBuilder } from "../src/query"

const tests_per_dataset = 5

for (const dataset of datasets) {
    const cells = JSON.parse(readFileSync(`public/data/${dataset}/cells.json`).toString())
    cells.genes.sort((lhs, rhs) => statSync(`public/data/${dataset}/gene/${rhs.toLowerCase()}.json`).size - statSync(`public/data/${dataset}/gene/${lhs.toLowerCase()}.json`).size)
    const barcodes = Object.keys(cells.cells).flatMap(category => cells.cells[category].map((e) => e[0]))
    for (let i = 0; i < tests_per_dataset; i += 1) {
        const indices = Array.from({length: 7}, _ => Math.round(Math.random() * 7))
        const cutoffs = Array.from({length: 5}, _ => Math.random() * 10)
        let query = `(${cells.genes[indices[0]]} > ${cutoffs[0]} | ${cutoffs[1]} > ${cells.genes[indices[1]]})`
        query += `& (${cells.genes[indices[2]]} < ${cutoffs[2]} | ${cutoffs[3]} < ${cells.genes[indices[3]]})`
        query += `| (${cells.genes[indices[4]]} > ${cutoffs[4]}`
        query += `& (${cells.genes[indices[5]]} = 0 | 0 = ${cells.genes[indices[6]]}))`
        let ctx = {}
        for (const j of indices) {
            if (typeof ctx[cells.genes[j]] === "undefined") {
                ctx[cells.genes[j]] = JSON.parse(readFileSync(`public/data/${dataset}/gene/${cells.genes[j].toLowerCase()}.json`).toString()).levels
            }
        }
        const filter = mkFilterBuilder(query)[0](ctx)
        const q_filtered = barcodes.filter(filter)
        const m_filtered = barcodes.filter(e =>
            ((ctx[cells.genes[indices[0]]][e] || 0) > cutoffs[0] || cutoffs[1] > (ctx[cells.genes[indices[1]]][e] || 0)) &&
            ((ctx[cells.genes[indices[2]]][e] || 0) < cutoffs[2] || cutoffs[3] < (ctx[cells.genes[indices[3]]][e] || 0)) ||
            ((ctx[cells.genes[indices[4]]][e] || 0) > cutoffs[4] &&
            ((ctx[cells.genes[indices[5]]][e] || 0) === 0 || (ctx[cells.genes[indices[6]]][e] || 0) === 0)))
        it(`testing query ${query} on dataset ${dataset}`, () => expect(m_filtered).toEqual(q_filtered))
    }
}