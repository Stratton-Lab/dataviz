import "./css/hover.css"

export const SubsetToolTip = () => <div class="tooltip"><sup style="border-bottom: 1px dotted black">(?)</sup>
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

export const FeatureToolTip = () => <div class="tooltip"><sup style="border-bottom: 1px dotted black">(?)</sup>
    <span class="tooltip-text">
    creates a feature map of expression for a selected gene, with darkest being high levels of expression,
    lightest being low levels of expression (units of expression are log normalized values)
    </span>
</div>