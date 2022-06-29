import { readFileSync, readdirSync } from "node:fs"
import { it, expect } from "vitest"
import datasets from "../src/assets/datasets.json"

it("accuracy of datasets.json", () => {
    expect(datasets.sort()).toEqual(readdirSync("public/data").sort())
})

it.each(datasets)("accuracy of genes field of cells.json of dataset '%s'", dataset => {
    const data_contents = JSON.parse(readFileSync(`public/data/${dataset}/cells.json`).toString()).genes.map(e => e.toLowerCase())
    data_contents.sort()
    const dir_contents = readdirSync(`public/data/${dataset}/gene`).map(e => e.slice(0, e.length - 5))
    dir_contents.sort()
    expect(data_contents).toEqual(dir_contents)
})

it.each(datasets)("no gene in dataset '%s' parses to a float", dataset => {
    expect(
        readdirSync(`public/data/${dataset}/gene`)
        .reduce((p, c) => p || parseFloat(c.slice(0, c.length - 5)), NaN)
    ).toEqual(NaN)
})

it.each(datasets)("no gene contains operators", dataset => {
    expect(
        readdirSync(`public/data/${dataset}/gene`)
        .map(e => e.slice(0, e.length - 5))
    ).not.toMatch(/!|&|\||\(|\)/)
})