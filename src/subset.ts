// TODO: stabilize Filter API
// move to Filter Generator api ?
export interface Filter {
    isOn(): boolean,
    reset(): void,
    newData(geneData: [string, number][], cutoff: number): void,
    check(barcode: string): boolean
};

export class SimpleFilter implements Filter {
    geneSet: Set<string>;
    constructor() {
        this.geneSet = null;
    }
    newData(geneData: [string, number][], cutoff: number) {
        // TODO: refactor geneSet init
        // since elements in geneData array are already sorted,
        // binary search can find matching element index faster
        // than just going through all elements one after the other
        this.geneSet = new Set();
        for (const i in geneData) {
            if (geneData[i][1] > cutoff) {
                this.geneSet.add(geneData[i][0]);
            }
        }
    }
    check(barcode: string) {
        return this.geneSet.has(barcode);
    }
    reset() {
        this.geneSet = null;
    }
    isOn(): boolean {
        return this.geneSet !== null;
    }

}