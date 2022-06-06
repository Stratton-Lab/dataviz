import datasets from "./datasets.json"
import "./hover.css"
import { fetchGeneData, fetchCellData } from './cache'
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

export default () => {

    const colours = palette("tol-sq", 100)
    let chart = null
    let config : ChartConfiguration  = {
        type: "scatter",
        data: null,
        options: {
            plugins: {
                legend: {
                    display: false
                }
            }
        }
    }

    const [getDataSetName, setDataSetName] = createSignal(datasets[0])
    const [getGene, setGene] = createSignal(null)

    const [getCellData] = createResource(getDataSetName, fetchCellData)
    const [getGeneData, {mutate: setGeneData}] = createResource(getGene, async gene => await fetchGeneData(getDataSetName(), gene))

    createEffect(on(getGeneData, geneData => {
        if (geneData !== null) {
            const cellData = getCellData()
            const minLevel = geneData.min
            const maxDelta = geneData.max - minLevel
            config.options.elements.point.backgroundColor = ctx => {
                const exprLevel = geneData.levels[cellData.cells[ctx.dataset.label][ctx.dataIndex][0]]
                return typeof exprLevel === "undefined" ? "rgba(0,0,0,0)" : `#${colours[Math.min(Math.floor(((exprLevel - minLevel)/maxDelta) * 100 ), 99)]}`
            }
        } else {
            config.options.elements.point.backgroundColor = _ => "rgb(0,0,0)"
        }
        chart.update()
    }, {defer: true}))

    createEffect(on(getCellData, cellData => {
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
                backgroundColor: _ => "rgb(0,0,0)",
                radius: 1.2
            }
        }
        chart.update()
    }, {defer: true}))


    const reset = () => {
        setGeneData(null)
        document.querySelectorAll("select.to-reset-feature").forEach(
            (e: HTMLSelectElement | HTMLInputElement) => e.value = ""
        )
    }

    onMount(() => {
        chart = new Chart("feature-chart", config)
    })

    return <div>
        <div class="text-3xl float-left ">Feature Map</div>
        <div class="text-s tooltip">(?)
            <span class="tooltip-text">
            creates a feature map of expression for a selected gene, with darkest being high levels of expression,
            lightest being low levels of expression (units of expression are arbitrary log normalized values)
            </span>
        </div>
        <br></br> <br></br>
        {"select a dataset: "}
        <select onInput={e => {
                reset()
                setDataSetName(e.currentTarget.value)
            }}>
            <For each={datasets}>
                {(item: string) => <option value={item}>{item}</option>}
            </For>
        </select>
        {" "}
        {"select a feature: "}
        {
            getCellData.loading ?
            "loading cell data..." :
            <select value="" class="px-2 to-reset-feature" onInput={e => {setGene(e.currentTarget.value)}}>
                <option selected hidden disabled value=""></option>
                <For each={getCellData().genes} fallback={<>loading button ...</>}>
                    {(item: string) => <option value={item}>{item}</option>}
                </For>
            </select>
        }
        {" "}
        <button class="bg-gray-300 hover:bg-gray-400 text-gray-800 px-2 shadow" onClick={reset}>reset</button>
        <br></br>
        <div id="feature-chart-div"><canvas id="feature-chart"></canvas></div>
    </div>
}