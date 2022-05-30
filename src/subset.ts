export interface Filter {
    (barcode: string): boolean
    gene: string
    cutoff: number
}

export const mkBinarySearchFilter = (geneData: [string, number][], geneName: string, cutoff: number): Filter => {
    const maxIdx = geneData.length - 1
    if (geneData[maxIdx][1] <= cutoff) {
        const filter = _ => false
        filter.gene = geneName
        filter.cutoff = cutoff
        return filter
    }
    let startIdx = null
    if (geneData[0][1] > cutoff) {
        startIdx = 0
    } else {
        let left = 0
        let right = maxIdx

        while (left <= right) {
            let mid = Math.floor((left + right) / 2)
            if (geneData[mid][1] > cutoff) {
                startIdx = mid
                right = mid - 1
            } else {
                left = mid + 1
            }
        }
    }

    const geneSet = new Set()
    for (let i = startIdx; i < maxIdx; i += 1) {
        geneSet.add(geneData[i][0])
    }
    const filter = barcode => geneSet.has(barcode)
    filter.gene = geneName
    filter.cutoff = cutoff
    return filter
}