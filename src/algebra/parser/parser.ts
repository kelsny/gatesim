import { BinaryExpr, Expr, GroupingExpr, LiteralExpr, UnaryExpr, VariableExpr } from "./expr";
import { Token, TokenType } from "./token";

//
export class Parser {
    #current = 0;

    constructor(readonly tokens: Token[]) {}

    parse() {
        return this.expression();
    }

    private expression(): Expr {
        return this.or();
    }

    private or() {
        let expr = this.and();

        while (this.match(TokenType.Or, TokenType.Nor)) {
            const operator = this.previous();

            const right = this.and();

            expr = new BinaryExpr(expr, operator, right);
        }

        return expr;
    }

    private and() {
        let expr = this.xor();

        while (this.match(TokenType.And, TokenType.Nand)) {
            const operator = this.previous();

            const right = this.xor();

            expr = new BinaryExpr(expr, operator, right);
        }

        return expr;
    }

    private xor() {
        let expr = this.not();

        while (this.match(TokenType.Xor, TokenType.Xnor)) {
            const operator = this.previous();
            const right = this.not();
            expr = new BinaryExpr(expr, operator, right);
        }

        return expr;
    }

    private not(): Expr {
        if (this.match(TokenType.Not)) {
            const operator = this.previous();

            const right = this.not();

            return new UnaryExpr(operator, right);
        }

        return this.primary();
    }

    private primary() {
        if (this.match(TokenType.False)) return new LiteralExpr(false);
        if (this.match(TokenType.True)) return new LiteralExpr(true);

        if (this.match(TokenType.Variable)) return new VariableExpr(this.previous());

        if (this.match(TokenType.LeftParen)) {
            const expr = this.expression();

            this.consume(TokenType.RightParen, "Expected closing parentheses after expression.");

            return new GroupingExpr(expr);
        }

        if (this.match(TokenType.LeftBrack)) {
            const expr = this.expression();

            this.consume(TokenType.RightBrack, "Expected closing bracket after expression.");

            return new GroupingExpr(expr);
        }

        if (this.match(TokenType.LeftBrace)) {
            const expr = this.expression();

            this.consume(TokenType.RightBrace, "Expected closing brace after expression.");

            return new GroupingExpr(expr);
        }

        throw new SyntaxError();
    }

    private consume(type: TokenType, message?: string) {
        if (this.check(type)) return this.advance();

        throw new SyntaxError(message);
    }

    private match(...types: TokenType[]) {
        for (const type of types) {
            if (this.check(type)) {
                this.advance();
                return true;
            }
        }

        return false;
    }

    private check(type: TokenType) {
        if (this.isAtEnd()) return false;
        return this.peek().type == type;
    }

    private advance() {
        if (!this.isAtEnd()) this.#current++;
        return this.previous();
    }

    private isAtEnd() {
        return this.peek().type === TokenType.Eof;
    }

    private peek() {
        return this.tokens[this.#current];
    }

    private previous() {
        return this.tokens[this.#current - 1];
    }
}
