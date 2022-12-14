import { getAdjacentBinaryExprs, joinAdjacentExprs } from "../../solver/factoring";
import { BinaryExpr, Expr, ExprPass, GroupingExpr, LiteralExpr, UnaryExpr, VariableExpr } from "../expr";
import { ExpressionPrinter } from "../printer";
import { TokenType } from "../token";

const print = ExpressionPrinter.prototype.print.bind(new ExpressionPrinter({ minimal: true }));

// sort and re-order nodes to a standard so that later passes
// will have an easier time working with nested structures
export class ExpressionNormalizingPass implements ExprPass {
    pass(expr: Expr): Expr {
        return expr.accept(this);
    }

    visitBinaryExpr(expr: BinaryExpr): Expr {
        expr.left = expr.left.accept(this);
        expr.right = expr.right.accept(this);

        const level = getAdjacentBinaryExprs(expr);

        // sorting the expressions and assigning the re-ordered nodes back to the original
        if (level.length > 2) {
            level.sort((a, b) => (print(a) > print(b) ? -1 : 1));

            const sorted = joinAdjacentExprs(level, expr.operator.type) as BinaryExpr;

            expr.left = sorted.left;
            expr.right = sorted.right;
        } else {
            if (print(expr.left) > print(expr.right)) [expr.left, expr.right] = [expr.right, expr.left];
        }

        return expr;
    }

    visitGroupingExpr(expr: GroupingExpr): Expr {
        expr.expression = expr.expression.accept(this);

        if (
            expr.expression instanceof GroupingExpr ||
            expr.expression instanceof VariableExpr ||
            expr.expression instanceof LiteralExpr ||
            // only applies to negation since it has high precedence
            (expr.expression instanceof UnaryExpr && expr.expression.operator.type === TokenType.Not)
        )
            return expr.expression;

        return expr;
    }

    visitLiteralExpr(expr: LiteralExpr): Expr {
        return expr;
    }

    visitUnaryExpr(expr: UnaryExpr): Expr {
        expr.right = expr.right.accept(this);

        return expr;
    }

    visitVariableExpr(expr: VariableExpr): Expr {
        return expr;
    }
}
