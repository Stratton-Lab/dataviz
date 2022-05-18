export interface Filter {
    (barcode: string): boolean
};

export const mkBinarySearchFilter = (geneData: [string, number][], cutoff: number): Filter => {
    const maxIdx = geneData.length - 1;
    if (geneData[maxIdx][1] <= cutoff) {
        return _ => false;
    }
    let left = 0;
    let right = maxIdx;
    let startIdx = null;

    while (left <= right) {
        let mid = Math.floor((left + right) / 2);
        if (geneData[mid][1] > cutoff) {
            startIdx = mid;
            right = mid - 1;
        } else {
            left = mid + 1;
        }
    }

    const geneSet = new Set();
    for (let i = startIdx; i < maxIdx; i += 1) {
        geneSet.add(geneData[i][0]);
    }
    return barcode => geneSet.has(barcode);
}