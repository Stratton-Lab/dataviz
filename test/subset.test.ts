/// <reference types="node" />
import { readFileSync } from "node:fs";
import { it, expect } from "vitest";
import { mkBinarySearchFilter, type Filter } from "../src/subset";
import datasets from "../src/datasets.json";

const mkSimpleFilter = (geneData: [string, number][], cutoff: number): Filter => {
    const maxIdx = geneData.length - 1;
    if (geneData[geneData.length - 1][1] <= cutoff) {
        return _ => false;
    }
    const geneSet = new Set();
    for (let i = 0; i < maxIdx; i += 1) {
        if (geneData[i][1] > cutoff) {
            geneSet.add(geneData[i][0]);
        }
    }
    return barcode => geneSet.has(barcode);
}

for (const dataset of datasets) {
    const {cells, genes} = JSON.parse(readFileSync(`public/data/${dataset}/cells.json`).toString());
    const barcodes = Object.keys(cells).flatMap(category => cells[category].map((e: [string, number]) => e[0]));

    it.each(genes)(`binary search filter correctness, using gene %s, dataset ${dataset}`, gene => {

        const cutoff = Math.random() * 10;
        const geneData = JSON.parse(readFileSync(`public/data/pediatric_2yo/gene/${gene}.json`).toString());
        const filter_s = mkSimpleFilter(geneData, cutoff);
        const filter_b = mkBinarySearchFilter(geneData, cutoff);

        expect(barcodes.filter(e => filter_b(e))).toEqual(barcodes.filter(e => filter_s(e)));
    });
}