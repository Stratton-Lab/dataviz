import { readFileSync, readdirSync } from "node:fs";
import { it, expect } from "vitest";
import datasets from "../src/datasets.json";

it("accuracy of datasets.json", () => {
    expect(datasets).toEqual(readdirSync("public/data"));
});

it.each(datasets)("accuracy of genes field of cells.json of dataset %s", dataset => {
    expect(
        JSON.parse(readFileSync(`public/data/${dataset}/cells.json`).toString()).genes.sort()
    ).toEqual(
        readdirSync(`public/data/${dataset}/gene`)
        .map(e => e.slice(0, e.length-5))
        .sort()
    );
});