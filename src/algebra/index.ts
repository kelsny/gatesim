import type { Expr } from "./parser/expr";
import { Parser } from "./parser/parser";
import { ConstantExpressionEvaluationPass as ConstExprEvalPass } from "./parser/passes/constants";
import { ExpressionSimplificationPass as ExprSimpPass } from "./parser/passes/expressions";
import { ExpressionNormalizingPass as ExprNormPass } from "./parser/passes/normalizer";
import { pipeline } from "./parser/passes/pipeline";
import { printExpr } from "./parser/printer";
import { Scanner } from "./parser/scanner";
import { areTreesExactlyEqual } from "./parser/trees/equal";
import { factoringSteps } from "./solver/factoring";
import { negationExtractionSteps } from "./solver/negations";

// const lines = String.raw`
// a \neg b \neg c + \neg a b \neg c + \neg a \neg b c + a b c
// (a+b+c)
// 1 + 0
// (a + not a)
// not a
// not not a
// not not not a
// not not not not a
// not not not not not a
// 1 + 0
// 10
// (1 + 0)
// (10)
// (a)
// ((a))
// ((a) or ((b and c)) xor (0))(11)
// (not (a nand b))
// (((not (a nand b)) xor 1) and (a or not a))
// % comment % 1
// (((    (a nand b)) xor 1) and (a or not a))
// `
//     .split("\n")
//     .filter(Boolean);

// const lines = String.raw`
// c0b1a % multiplication should be sorted alphabetically and prioritize constants to back with 1 before 0 %
// c+0+b+1+a % same rules as above %
// c0b+ba+a1c % ab + 1ac + 0bc %
// (cd+ba1)(ca+db1) % (1ab + cd)(ac + 1db) %
// `
//     .split("\n")
//     .filter(Boolean);

// const lines = String.raw`
// (b or not b) % 1 %
// (not c and c) % 0 %
// not (not b xor a) % a xor b %
// not (a xnor not b) % a xor not b %
// ((a and not b) or (not a and b)) % a xor b %
// ((a and b) or (not a and not b)) % a xnor b %
// `
//     .split("\n")
//     .filter(Boolean);

// const lines = String.raw`
// (a or b) and c % lower precedence %
// (a and b) and c % same precedence %
// (a xor b) and c % higher precedence %
// a and (b or c) % lower precedence %
// a and (b and c) % same precedence %
// a and (b xor c) % higher precedence %
// (a and b) and (c and d)
// `
//     .split("\n")
//     .filter(Boolean);

// const lines = String.raw`
// a and a
// a or a
// a nand a
// a nor a
// a xor a
// a xnor a
// `
//     .split("\n")
//     .filter(Boolean);

const lines = String.raw`
a \neg b \neg c + \neg a b \neg c + \neg a \neg b c + a b c
`
    .split("\n")
    .filter(Boolean);

// const lines = String.raw`
// x(ab + ac + d)
// `
//     .split("\n")
//     .filter(Boolean);

function show(source: string) {
    const tokens = new Scanner(source).scanTokens();

    const singlePass = pipeline(ExprNormPass, ConstExprEvalPass, ExprSimpPass);

    const maxPass = (expr: Expr) => {
        let passed = singlePass(expr);

        // simplify until the passes do not change anything
        while (!areTreesExactlyEqual(expr, passed)) [expr, passed] = [passed, singlePass(expr)];

        // at least one pass should be done
        expr = singlePass(expr);

        return expr;
    };

    let expr = new Parser(tokens).parse();

    expr = maxPass(expr);

    console.log(printExpr(expr, { explicitGrouping: true }));

    const factoringStepsToTry = factoringSteps({ description: "initial", expr });

    factoringStepsToTry.forEach(({ description, expr }) => {
        console.log("+".repeat(16));

        console.log(description);
        console.log(printExpr(maxPass(expr), { explicitGrouping: true }));

        const factoringStepsToTry = factoringSteps({ description: "initial", expr });

        factoringStepsToTry.forEach(({ description, expr }) => {
            console.log(description);
            console.log(printExpr(maxPass(expr), { explicitGrouping: true }));

            const extractedNegationStepsToTry = negationExtractionSteps({ description: "initial", expr });

            extractedNegationStepsToTry.forEach(({ description, expr }) => {
                console.log(description);
                console.log(printExpr(maxPass(expr), { explicitGrouping: true }));
            });
        });

        console.log("+".repeat(16));
    });
}

console.clear();

lines.forEach(show);
