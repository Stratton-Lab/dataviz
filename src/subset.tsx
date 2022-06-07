import datasets from "./datasets.json"
import "./hover.css"
import { mkFilterBuilder } from "./query"
import { fetchGeneData, fetchCellData } from './cache'
import {
    createSignal,
    For,
    onMount,
    createResource,
    createEffect,
    on,
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
    const [getQuery, setQuery] = createSignal(null)
    const [getErrorMsg, setErrorMsg] = createSignal("")

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
        <div class="text-3xl float-left ">Subset Tool</div>
        <div class="text-s tooltip">(?)
            <span class="tooltip-text">
                <p>subsets datasets via queries about gene expression levels (units of expression are log normalized values).</p>
                <p>express queries about gene expression by writing a comparison between the gene name and some numeric value, using &lt;, =, or &gt;.</p>
                <p>multiple different conditions can be joined by conjunction (both conditions are true) or disjunction (one of the conditions must be true)
                conditions using the &amp;, |and ! operators, respectively.</p>
                <p>a condition can be negated using the ! operator.</p>
                <p>note: ! has higher precendence than &amp; which has higher precedence than | and both &amp; and | are left associative</p>
                <br></br>
                examples:
                <ul class="list-disc list-inside">
                    <li> <pre class="inline">FTL &lt; 4.2</pre> : only shows a cell if it has expression of FTL strictly below 4.2</li>
                    <li> <pre class="inline">FTL = 0</pre> : only shows a cell if it has expression of FTL equal to zero, i.e. no expression</li>
                    <li> <pre class="inline">FTL &gt; 4.2</pre> : only shows a cell if it has expression of FTL strictly above 4.2</li>
                    <li> <pre class="inline">4.2 &lt; FTL</pre> : equivalent to previous</li>
                    <li> <pre class="inline">1.6 &lt; FTL &amp; FTL &lt; 4.2</pre> : only shows a cell if it has expression of FTL strictly strictly between 1.6 and 4.2</li>
                    <li> <pre class="inline">APOE &lt; 4 | 2 &lt; RHOB &amp; FTL = 0</pre> : only shows a cell if it has no expression of FTL and expression of RHOB above 2 or if the cell has expression of APOE below 4 (&amp; is evaluated before |)</li>
                    <li> <pre class="inline">(APOE &lt; 4 | 2 &lt; RHOB) &amp; FTL = 0</pre> : only shows a cell if it has has expression of APOE below 4 or expression of RHOB above 2 while also having no FTL expression</li>
                    <li> <pre class="inline">! APOE &lt; 4 &amp; FTL &lt; 2</pre> : only shows a cell if it does not have expression of APOE below 4 while also having expression of FTL below 2 (! is evaluated before &)</li>
                    <li> <pre class="inline">! (APOE &lt; 4 &amp; FTL &lt; 2)</pre> : only shows a cell if it does not have both expression of APOE below 4 and expression of FTL below 2</li>
                </ul>
            </span>
        </div>
        <br></br> <br></br>
        <div>
            {"select a dataset: "}
            <select onInput={e => {
                    reset(false)
                    setDataSetName(e.currentTarget.value)
                }}>
                <For each={datasets}>
                    {(item: string) => <option value={item}>{item}</option>}
                </For>
            </select>
            {" "}
            <input style="width:25vw" class="border" id="subset-query-input-field"></input>
            {" "}
            <button class="bg-gray-300 hover:bg-gray-400 text-gray-800 px-2 border" onClick={() => setQuery((document.getElementById("subset-query-input-field") as HTMLInputElement).value)}>run query</button>
            {" "}
            <button class="bg-gray-300 hover:bg-gray-400 text-gray-800 px-2" onClick={() => reset(true)}>reset</button>
            {" "}
            <div class="inline text-red-600">{getErrorMsg()}</div>
        </div>
        <br></br>
        <div id="subset-chart-div"><canvas id="subset-chart"></canvas></div>
    </div>
}
