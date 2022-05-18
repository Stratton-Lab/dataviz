/* @refresh reload */
import { mkBinarySearchFilter, type Filter } from './subset';
import datasets from "./datasets.json";

import { render } from "solid-js/web";
import {
    createSignal,
    For,
    Show,
    onMount,
    createResource,
    createEffect,
    on,
    untrack
} from "solid-js";


import Chart from "chart.js/auto";
import { type ChartConfiguration } from "chart.js";

import palette from "google-palette";

render(() => {

    let chart = null;
    let filter: Filter = null;
    let config : ChartConfiguration  = {
        type: "scatter",
        data: null,
        options: null
    };

    const [getDataSetName, setDataSetName] = createSignal(datasets[0]);
    const [getDispGene, setDispGene] = createSignal(null);
    const [getSendGene, setSendGene] = createSignal(null, {equals : false});
    const [getCutoff, setCutoff] = createSignal(null);
    const [getCmpModeG, setCmpModeG] = createSignal(true);

    const [getCellData] = createResource(getDataSetName, async dataset => await fetch(`data/${dataset}/cells.json`).then(r => r.json()));
    const [getGeneData] = createResource(getSendGene, async gene => await fetch(`data/${untrack(getDataSetName)}/gene/${gene}.json`).then(r => r.json()));

    createEffect(on(getGeneData, geneData => {
        filter = mkBinarySearchFilter(geneData, getCutoff());
        chart.update();
    }, { defer : true }));

    createEffect(on(getCellData, cellData => {
        const colours = palette("mpn65", Object.keys(cellData.cells).length).map(
            hex => (`rgb(${parseInt(hex.slice(0,2), 16)}, ${parseInt(hex.slice(2,4), 16)}, ${parseInt(hex.slice(4,6), 16)}`)
        );
        config.data = {
                datasets: Array.from(Object.keys(cellData.cells), category => {
                    let labels = [];
                    let data = [];
                    cellData.cells[category].forEach(([barcode, umap_1, umap_2]) => {
                        labels.push(barcode);
                        data.push({ x : umap_1, y : umap_2 })
                    });
                    return {
                        data: data,
                        label: category
                    }
                })
        };
        config.options = {
            elements: {
                point: {
                    radius: 1.2,
                    backgroundColor: ctx => {
                        if (filter === null) {
                            return `${colours[ctx.datasetIndex]}, 1)`
                        }
                        if (untrack(getCmpModeG)) {
                            return `${colours[ctx.datasetIndex]}, ${filter(cellData.cells[ctx.dataset.label][ctx.dataIndex][0]) ? 1 : 0})`;
                        } else {
                            return `${colours[ctx.datasetIndex]}, ${filter(cellData.cells[ctx.dataset.label][ctx.dataIndex][0]) ? 0 : 1})`;
                        }
                    }
                }
            },
            plugins: {
                tooltip: {
                    callbacks: {
                        label: ctx => cellData.cells[ctx.dataset.label][ctx.dataIndex][0]
                    }
                },
                legend: {
                    labels: {
                        generateLabels: chart => Array.from(Chart.defaults.plugins.legend.labels.generateLabels(chart), (label, index) => {
                            label.fillStyle = `${colours[index]}, 1)`;
                            return label;
                        })
                    }
                }
            }
        };
        chart.update();
    }, { defer : true }));




    onMount(() => {
        chart = new Chart("chart", config);
    });

    return (<>
        <p>select a dataset:&nbsp;
            <select onInput={e => {setDataSetName(e.currentTarget.value)}}>
                <For each={datasets}>
                    {(item: string) => <option value={item}>{item}</option>}
                </For>
            </select>
        </p>
        <p>select a feature:&nbsp;
            <select onInput={e => {setDispGene(e.currentTarget.value)}}>
                <Show when={!getCellData.loading} fallback={<>loading cell data ...</>}>
                    <For each={getCellData().genes} fallback={<>loading button ...</>}>
                        {(item: string) => <option value={item}>{item}</option>}
                    </For>
                </Show>
            </select>
        </p>
        <p>select a cutoff:&nbsp;
            <input type="number" step="0.1" min="0" max="10" onInput={e => {setCutoff(parseFloat(e.currentTarget.value))}}></input>
        </p>
        <p>select mode:&nbsp;
            <select onInput={e => {setCmpModeG(e.currentTarget.value === "g")}}>
                <option value="g">greater than</option>
                <option value="l">lesser or equal than</option>
            </select>
        </p>


        <Show when={getDispGene() !== null && getCutoff() !== null} fallback={<p>please input gene and cutoff</p>}>
            <p><button onClick={() => setSendGene(getDispGene())}>subset</button></p>
        </Show>
        <p><button onClick={() => {
            filter = null;
            setDispGene(null)
            setCutoff(null)
            chart.update();
        }}>reset</button></p>
        <p>disp gene: {getDispGene()}</p>
        <p>cutoff: {getCutoff()}</p>
        <p>comparison set to: {getCmpModeG() ? "greater" : "lesser or equal"} than</p>
        <canvas id="chart"></canvas>
    </>)


}, document.getElementById("root") as HTMLElement);