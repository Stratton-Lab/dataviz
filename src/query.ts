type Op = 1 | 2 | 3
type Cmp = 0 | 1 | 2
const LEFT_PAREN = 0
const NOT_OP: Op = 3
const AND_OP: Op = 2
const OR_OP: Op = 1
const LT: Cmp = 0
const EQ: Cmp = 1
const GT: Cmp = 2
type ExprAtom = {
    gene: string
    mode: Cmp
    cutoff: number
}

export const mkFilterBuilder = (query: string): [((ctx) => (barcode: string) => boolean), string[]] => {

    // implementation of shunting yards algorithm to translate infix query to RPN
    let i = 0
    const gene_list = []
    const tokens: (Op | ExprAtom)[] = []
    const op_stack: (Op | typeof LEFT_PAREN)[] = []
    const q_len = query.length
    while (i < q_len) {
        const c = query[i]
        if (c === "!") {
            op_stack.push(NOT_OP)
            i += 1
        } else if (c === "&") {
            while (op_stack.length > 0 && op_stack[op_stack.length-1] >= AND_OP) {
                tokens.push(op_stack.pop() as Op)
            }
            op_stack.push(AND_OP)
            i += 1
        } else if (c === "|") {
            while (op_stack.length > 0 && op_stack[op_stack.length - 1] >= OR_OP) {
                tokens.push(op_stack.pop() as Op)
            }
            op_stack.push(OR_OP)
            i += 1
        } else if (c === "(") {
            op_stack.push(LEFT_PAREN)
            i += 1
        } else if (c === ")") {
            while (op_stack[op_stack.length - 1] !== LEFT_PAREN) {
                if (op_stack.length === 0) {
                    throw new Error(`could not parse expression: ${query} (extra closing parenthesis)`)
                }
                tokens.push(op_stack.pop() as Op)
            }
            if (op_stack.pop() !== LEFT_PAREN) {
                throw new Error(`could not parse expression: ${query} (extra closing parenthesis)`)
            }
            i += 1
        } else if (c !== " ") {
            let expr = c
            i += 1
            while (i < query.length && query[i] !== "&" && query[i] !== "|" && query[i] !== "(" && query[i] !== ")" && query[i] !== "!") {
                if (query[i] !== " ") {
                    expr += query[i]
                }
                i += 1
            }
            let cmp = null
            let idx = null
            for (let j = 0; j < expr.length; j += 1) {
                if (expr[j] === "<") {
                    cmp = LT
                    idx = j
                    break
                }
                if (expr[j] === "=") {
                    cmp = EQ
                    idx = j
                    break
                }
                if (expr[j] === ">") {
                    cmp = GT
                    idx = j
                    break
                }
            }
            if (idx === null) {
                throw new Error(`could not parse the subexpression: ${expr} (failed to find < or >)`)
            }
            let lhs = expr.slice(0,idx)
            let rhs = expr.slice(idx+1)
            let rhs_parse = parseFloat(rhs)
            if (isNaN(rhs_parse)) {
                if (cmp === LT) { cmp = GT } else if (cmp === GT) { cmp = LT }
                const tmp = lhs
                lhs = rhs
                rhs = tmp
                rhs_parse = parseFloat(rhs)
                if (isNaN(rhs_parse)) {
                    throw new Error(`could not parse the subexpression: ${expr} (failed to find cutoff number)`)
                }
            }
            gene_list.push(lhs)
            tokens.push({
                gene: lhs,
                mode: cmp,
                cutoff: rhs_parse
            })
        } else {
            i += 1
        }
    }
    while (op_stack.length > 0) {
        const op = op_stack.pop()
        if (op === LEFT_PAREN) {
            throw new Error(`could not parse expression: ${query} (unclosed opening parenthesis)`)
        }
        tokens.push(op as Op)
    }

    // interpret RPN token stack
    const fn_stack: ((ctx) => (barcode: string) => boolean)[] = [];
    for (const token of tokens) {
        if (token === NOT_OP) {
            if (fn_stack.length < 1) {
                throw new Error(`could not parse expression: ${query} (not operator supplied with insufficient operands)`)
            }
            const inv = fn_stack.pop()
            fn_stack.push(ctx => {
                const f_inv = inv(ctx)
                return barcode => !f_inv(barcode)
            })
        } else if (token === AND_OP) {
            if (fn_stack.length < 2) {
                throw new Error(`could not parse expression: ${query} (and operator supplied with insufficient operands)`)
            }
            const lhs = fn_stack.pop()
            const rhs = fn_stack.pop()
            fn_stack.push(ctx => {
                const f_lhs = lhs(ctx)
                const f_rhs = rhs(ctx)
                return barcode => f_lhs(barcode) && f_rhs(barcode)
            })
        } else if (token === OR_OP) {
            if (fn_stack.length < 2) {
                throw new Error(`could not parse expression: ${query} (or operator supplied with insufficient operands)`)
            }
            const lhs = fn_stack.pop()
            const rhs = fn_stack.pop()
            fn_stack.push(ctx => {
                const f_lhs = lhs(ctx)
                const f_rhs = rhs(ctx)
                return barcode => f_lhs(barcode) || f_rhs(barcode)
            })
        } else {
            const cutoff = token.cutoff
            const gene = token.gene
            if (token.mode === LT) {
                fn_stack.push(ctx => {
                    const geneExprMap = ctx[gene]
                    return barcode => (geneExprMap[barcode] || 0) < cutoff
                })
            } else if (token.mode === EQ) {
                fn_stack.push(ctx => {
                    const geneExprMap = ctx[gene]
                    return barcode => (geneExprMap[barcode] || 0) === cutoff
                })
            } else {
                fn_stack.push(ctx => {
                    const geneExprMap = ctx[gene]
                    return barcode => (geneExprMap[barcode] || 0) > cutoff
                })
            }
        }
    }
    if (fn_stack.length !== 1) {
        throw new Error(`could not parse expression: ${query} (incorrect operator usage)`)
    }
    return [fn_stack[0], gene_list]
}