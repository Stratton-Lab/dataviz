/* @refresh reload */
import { mkBinarySearchFilter, type Filter } from './subset'
import datasets from "./datasets.json"
import "./index.css"
import { render } from "solid-js/web"
import {
    createSignal,
    For,
    onMount,
    createResource,
    createEffect,
    on,
    untrack,
    batch
} from "solid-js"


import Chart from "chart.js/auto"
import { type ChartConfiguration } from "chart.js"

import palette from "google-palette"

render(() => {

    let chart = null
    let filter: Filter = null
    let config : ChartConfiguration  = {
        type: "scatter",
        data: null,
        options: {
            maintainAspectRatio: false
        }
    }

    const [getDataSetName, setDataSetName] = createSignal(datasets[0])
    const [getDispGene, setDispGene] = createSignal(null)
    const [getSendGene, setSendGene] = createSignal(null, {equals : false})
    const [getCutoff, setCutoff] = createSignal(null)
    const [getCmpModeG, setCmpModeG] = createSignal(true)

    const [getCellData] = createResource(getDataSetName, async dataset => await fetch(`data/${dataset}/cells.json`).then(r => r.json()))

    //TODO: set up cache for already explored genes
    // maybe not necessary considering browser request caching policies
    const [getGeneData, {refetch: refetchGeneData}] = createResource(getSendGene, async gene => await fetch(`data/${untrack(getDataSetName)}/gene/${gene}.json`).then(r => r.json()))

    createEffect(on(getGeneData, geneData => {
        const newGeneName = getSendGene()
        const newCutoff = getCutoff()
        if (filter === null || filter.gene !== newGeneName || filter.cutoff !== newCutoff) {
            filter = mkBinarySearchFilter(geneData, newGeneName, newCutoff)
        }
        chart.update()
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
                backgroundColor: ctx => {
                    if (filter === null) {
                        return `${colours[ctx.datasetIndex]}, 1)`
                    }
                    if (getCmpModeG()) {
                        return `${colours[ctx.datasetIndex]}, ${filter(cellData.cells[ctx.dataset.label][ctx.dataIndex][0]) ? 1 : 0})`
                    } else {
                        return `${colours[ctx.datasetIndex]}, ${filter(cellData.cells[ctx.dataset.label][ctx.dataIndex][0]) ? 0 : 1})`
                    }
                }
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


    const reset = () => {
        filter = null
        chart.update()
        setDispGene(null)
        setCutoff(null)
        document.querySelectorAll("select.toReset, input.toReset").forEach(
            (e: HTMLSelectElement|HTMLInputElement) => e.value = ""
        )
    }

    onMount(() => {
        chart = new Chart("chart", config)
    })

    return (<>
        <div id="center-buttons">
            select a dataset:&nbsp
            <select onInput={e => {
                    setDataSetName(e.currentTarget.value)
                    reset()
                }}>
                <For each={datasets}>
                    {(item: string) => <option value={item}>{item}</option>}
                </For>
            </select>
            <br></br>
            {
                getDispGene() !== null && getCutoff() !== null ?
                <button onClick={() => {batch(() => {
                        setSendGene(getDispGene())
                        refetchGeneData() // force update of geneData even when sendGene is unchanged
                    })}}>
                    display only cells with expression of {getDispGene()} {getCmpModeG() ? "above" : "less or equal to"} {getCutoff()}
                </button> :
                "please input gene and cutoff"
            }
            <br></br>
            <button onClick={reset}>reset</button>
        </div>
        <br></br>
        <div id="constraint-chart-flex">
            <div id="multi-constaint-flex">
                <div id="constraint-select-box">
                    <div>select a feature:&nbsp
                        {
                            getCellData.loading ?
                            "loading cell data..." :
                            <select value="" class="toReset" onInput={e => {setDispGene(e.currentTarget.value)}}>
                                <option selected hidden disabled value=""></option>
                                <For each={getCellData().genes} fallback={<>loading button ...</>}>
                                    {(item: string) => <option value={item}>{item}</option>}
                                </For>
                            </select>
                        }
                    </div>
                    <div>select a cutoff:&nbsp
                        <input size="3" class="toReset" type="number" step="0.1" min="0" max="10" onInput={e => {setCutoff(parseFloat(e.currentTarget.value))}}></input>
                    </div>
                    <div>select mode:&nbsp
                        <select onInput={e => {setCmpModeG(e.currentTarget.value === "g")}}>
                            <option value="g">greater than</option>
                            <option value="l">lesser or equal than</option>
                        </select>
                    </div>
                </div>
            </div>
            <div id="chart-div"><canvas id="chart"></canvas></div>
        </div>
    </>)


}, document.getElementById("root") as HTMLElement)
