import datasets from "./assets/datasets.json"
import { SubsetToolTip } from "./tooltip"
import { mkFilterBuilder } from "./query"
import { fetchGeneData, fetchCellData } from './cache'
import {
    createSignal,
    For,
    onMount,
    createResource,
    createEffect,
    on,
    untrack
} from "solid-js"


import Chart from "chart.js/auto"
import { type ChartConfiguration } from "chart.js"

import palette from "google-palette"

export default () => {

    let chart = null
    let config : ChartConfiguration  = {
        type: "scatter",
        data: null,
        options: {}
    }
    let filter = null
    let filter_builder = null

    const [getDataSetName, setDataSetName] = createSignal(datasets[0])
    const [getGenes, setGenes] = createSignal(null)
    const [getQuery, setQuery] = createSignal(null, {equals: false})
    const [getErrorMsg, setErrorMsg] = createSignal("")
    const [getShowAdvanced, setShowAdvanced] = createSignal(false)
    const [getMin, setMin] = createSignal(0)
    const [getMax, setMax] = createSignal(null)
    const [getMaxInclusive, setMaxInclusive] = createSignal(false)
    const [getMinInclusive, setMinInclusive] = createSignal(false)
    const [getDispGene, setDispGene] = createSignal(null)

    const [getCellData] = createResource(getDataSetName, fetchCellData)
    const [getGeneData] = createResource(getGenes, async genes => await Promise.all(genes.map(gene => fetchGeneData(getDataSetName(), gene, () => setErrorMsg(`requested gene ${gene} could not be found`)))))

    createEffect(on(getQuery, query => {
        if (query === null) {
            filter = null
            chart.update()
        }
        else {
            try {
                const [fb, gl] = mkFilterBuilder(query)
                filter_builder = fb
                setGenes(gl)
            } catch (err) {
                setErrorMsg(`${err.message}`)
            }
        }
    }, {defer: true}))

    createEffect(on(getGeneData, geneDataArray => {
        if (typeof geneDataArray !== "undefined") {
            const genes = getGenes()
            const ctx = {}
            for (let i = 0; i < geneDataArray.length; i += 1) {
                ctx[genes[i]] = geneDataArray[i].levels
            }
            filter = filter_builder(ctx)
            setErrorMsg("")
            chart.update()
        }
    }, {defer: true}))


    createEffect(on(getCellData, cellData => {
        const colours = palette("mpn65", Object.keys(cellData.cells).length).map(
            hex => (`rgb(${parseInt(hex.slice(0,2), 16)}, ${parseInt(hex.slice(2,4), 16)}, ${parseInt(hex.slice(4,6), 16)}`)
        )
        config.data = {
                datasets: Array.from(Object.keys(cellData.cells), category => {
                    return {
                        data: cellData.cells[category].map(([_, umap_1, umap_2]) => { return { x : umap_1, y : umap_2 } }),
                        label: category
                    }
                })
        }
        config.options.elements = {
            point: {
                radius: 1.2,
                backgroundColor: ctx => filter === null ? `${colours[ctx.datasetIndex]}, 1)` : `${colours[ctx.datasetIndex]}, ${filter(cellData.cells[ctx.dataset.label][ctx.dataIndex][0]) ? 1 : 0})`
            }
        }
        config.options.plugins = {
            tooltip: {
                callbacks: {
                    label: ctx => cellData.cells[ctx.dataset.label][ctx.dataIndex][0]
                }
            },
            legend: {
                labels: {
                    generateLabels: chart => Array.from(Chart.defaults.plugins.legend.labels.generateLabels(chart), (label, index) => {
                        label.fillStyle = `${colours[index]}, 1)`
                        return label
                    })
                }
            }
        }
        chart.update()
    }, {defer: true}))


    const reset = (full: boolean) => {
        if (full) {
            (document.getElementById("subset-query-input-field") as HTMLInputElement).value = ""
        }
        setQuery(null)
        setErrorMsg("")
    }

    onMount(() => {
        chart = new Chart("subset-chart", config)
    })

    return <div>
        <h2 class="text-3xl float-left">Subset Tool</h2>
        <br></br> <br></br>
        <span>select a dataset: </span>
        <select onInput={e => {
            reset(false)
            setDataSetName(e.currentTarget.value)
        }}>
            <For each={datasets}>
                {(item: string) => <option value={item}>{item}</option>}
            </For>
        </select>
        <span> </span>
        <button class="bg-gray-300 hover:bg-gray-400 text-gray-800 px-2" onClick={() => reset(false)}>reset</button>
        <span> </span>
        {
            getMax() !== null && getDispGene() !== null ?
            <button class="bg-gray-300 hover:bg-gray-400 text-gray-800 px-2" onClick={() => {
                const max = untrack(getMax)
                const min = untrack(getMin)
                const max_inc = untrack(getMaxInclusive)
                const min_inc = untrack(getMinInclusive)
                const gene = untrack(getDispGene)
                if (max_inc) {
                    if (min_inc) {
                        filter_builder = ctx => {
                            const geneExprMap = ctx[gene]
                            return barcode => {
                                const level = (geneExprMap[barcode] || 0)
                                return min <= level && level <= max
                            }
                        }
                    } else {
                        filter_builder = ctx => {
                            const geneExprMap = ctx[gene]
                            return barcode => {
                                const level = (geneExprMap[barcode] || 0)
                                return min < level && level <= max
                            }
                        }
                    }
                } else {
                    if (min_inc) {
                        filter_builder = ctx => {
                            const geneExprMap = ctx[gene]
                            return barcode => {
                                const level = (geneExprMap[barcode] || 0)
                                return min <= level && level < max
                            }
                        }
                    } else {
                        filter_builder = ctx => {
                            const geneExprMap = ctx[gene]
                            return barcode => {
                                const level = (geneExprMap[barcode] || 0)
                                return min < level && level < max
                            }
                        }
                    }
                }

                setGenes([gene])
            }}>show only cells with expression of {getDispGene()} between {getMin()} ({getMinInclusive() ? "inclusive" : "exclusive"}) and {getMax()} ({getMaxInclusive() ? "inclusive" : "exclusive"})</button> :
            "please select a maximum expression level and a gene"
        }
        <br></br>
        <span>select a minimum: </span>
        <input class="shadow border px-1 text-gray-700 leading-tight focus:outline-none focus:shadow-outline" type="number" step="0.1" min="0" max="10" value="0" onInput={e => setMin(parseFloat(e.currentTarget.value))}></input>
        <span> check box to make minimum inclusive: </span> <input type="checkbox" onClick={() => setMinInclusive((prev) => !prev)}></input>
        <br></br>
        <span>select a maximum: </span>
        <input class="shadow border px-1 text-gray-700 leading-tight focus:outline-none focus:shadow-outline" type="number" step="0.1" min="0" max="10" value="" onInput={e => setMax(parseFloat(e.currentTarget.value))}></input>
        <span> check box to make maximum inclusive: </span> <input type="checkbox" onClick={() => setMaxInclusive((prev) => !prev)}></input>
        <br></br>
        <span>select a feature: </span>
        {
            getCellData.loading ?
            "loading cell data..." :
            <select value="" class="px-2 to-reset-feature" onInput={e => {setDispGene(e.currentTarget.value)}}>
                <option selected hidden disabled value=""></option>
                <For each={getCellData().genes} fallback={<>loading button ...</>}>
                    {(item: string) => <option value={item}>{item}</option>}
                </For>
            </select>
        }

        <br></br>
        <button onClick={() => setShowAdvanced((prev) => !prev) }>{getShowAdvanced() ? "\u2bc6" : "\u2bc8"}</button> <span>click arrow for advanced query <SubsetToolTip /></span>
        <div style={getShowAdvanced() ? "display: block" : "display: none"}>
            <div>
                {" "}
                <input style="width:25vw" class="border" id="subset-query-input-field"></input>
                {" "}
                <button class="bg-gray-300 hover:bg-gray-400 text-gray-800 px-2 border" onClick={() => setQuery((document.getElementById("subset-query-input-field") as HTMLInputElement).value)}>run query</button>
                {" "}
                <button class="bg-gray-300 hover:bg-gray-400 text-gray-800 px-2 border" onClick={() => reset(true)}>reset</button>
                {" "}
                <div class="inline text-red-600">{getErrorMsg()}</div>
            </div>
        </div>
        <br></br>
        <div id="subset-chart-div"><canvas id="subset-chart"></canvas></div>
    </div>
}
