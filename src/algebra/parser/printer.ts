import type { BinaryExpr, Expr, ExprVisitor, GroupingExpr, LiteralExpr, UnaryExpr, VariableExpr } from "./expr";
import { Scanner } from "./scanner";

export interface ExpressionPrinterOptions {
    minimal?: boolean;
    explicitGrouping?: boolean;
    printConstantsAsNumbers?: boolean;
}

// accepts number for options for convenience when using in .map
export function printExpr(expr: Expr, options?: ExpressionPrinterOptions | number) {
    return new ExpressionPrinter(typeof options === "number" ? undefined : options).print(expr);
}

export class ExpressionPrinter implements ExprVisitor<string> {
    #options: Required<ExpressionPrinterOptions>;

    constructor(options: ExpressionPrinterOptions = { printConstantsAsNumbers: false }) {
        this.#options = {
            minimal: false,
            explicitGrouping: false,
            printConstantsAsNumbers: false,
            ...options,
        };
    }

    print(expr: Expr) {
        return expr.accept(this);
    }

    visitBinaryExpr(expr: BinaryExpr): string {
        if (this.#options.minimal)
            return `${this.#options.explicitGrouping ? "<" : ""}${expr.left.accept(this)}${Scanner.symbolForKeyword.get(
                expr.operator.type,
            )!}${expr.right.accept(this)}${this.#options.explicitGrouping ? ">" : ""}`;

        return `${this.#options.explicitGrouping ? "<" : ""}${expr.left.accept(this)} ${
            expr.operator.lexeme
        } ${expr.right.accept(this)}${this.#options.explicitGrouping ? ">" : ""}`;
    }

    visitGroupingExpr(expr: GroupingExpr): string {
        return `(${expr.expression.accept(this)})`;
    }

    visitLiteralExpr(expr: LiteralExpr): string {
        if (this.#options.minimal || this.#options.printConstantsAsNumbers) return Number(expr.value).toString();

        return expr.value.toString();
    }

    visitUnaryExpr(expr: UnaryExpr): string {
        if (this.#options.minimal)
            return `${Scanner.symbolForKeyword.get(expr.operator.type)!}${expr.right.accept(this)}`;

        return `${expr.operator.lexeme}${this.#options.explicitGrouping ? "<" : " "}${expr.right.accept(this)}${
            this.#options.explicitGrouping ? ">" : ""
        }`;
    }

    visitVariableExpr(expr: VariableExpr): string {
        return expr.name.lexeme;
    }
}
