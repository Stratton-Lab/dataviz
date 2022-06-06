/* @refresh reload */

import Header from "./header"
import { render } from "solid-js/web"
import SubsetMap from "./subset"
import FeatureMap from "./feature"

render(() => {

    return (<>
        <Header />
        <br></br>
        <SubsetMap />
        <br></br>
        <FeatureMap />
    </>)


}, document.getElementById("root") as HTMLElement)
