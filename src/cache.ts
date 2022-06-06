const geneDataCache = new Map()
const cellDataCache = new Map()

const geneFetch = async (dataset: string, gene: string, err_handler: () => void) => {
    return await fetch(`data/${dataset}/gene/${gene}.json`).then(r => {
        if (r.ok) {
            return r.json()
        } else {
            err_handler()
            return Promise.reject()
        }
    })
}

export const fetchGeneData = async (dataset: string, gene: string, err_handler: () => void = () => {}) => {
    const gene_lowered = gene.toLowerCase()
    if (!geneDataCache.has(dataset)) {
        const data = await geneFetch(dataset, gene_lowered, err_handler)
        geneDataCache.set(dataset, new Map())
        geneDataCache.get(dataset).set(gene_lowered, data)
        return data
    } else {
        if (geneDataCache.get(dataset).has(gene_lowered)) {
            return geneDataCache.get(dataset).get(gene_lowered)
        }
        const data = await geneFetch(dataset, gene_lowered, err_handler)
        geneDataCache.get(dataset).set(gene_lowered, data)
        return data
    }
}

export const fetchCellData = async (dataset: string) => {
    if (!cellDataCache.has(dataset)) {
        const data = await fetch(`data/${dataset}/cells.json`).then(r => r.json())
        cellDataCache.set(dataset, data)
        return data
    }
    return cellDataCache.get(dataset)
}