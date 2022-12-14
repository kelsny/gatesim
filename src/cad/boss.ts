export type BossOnGen = (diagram: string) => void;

export class Boss {
    #table;
    #worker;
    #ongens = new Set<BossOnGen>();

    constructor(table: readonly boolean[][][]) {
        this.#table = table;

        this.#worker = new Worker(new URL("./employee.ts", import.meta.url));
    }

    ongen(run: BossOnGen) {
        this.#ongens.add(run);

        return this;
    }

    offgen(run: BossOnGen) {
        this.#ongens.delete(run);

        return this;
    }

    async work() {
        this.#worker.postMessage(this.#table);

        return new Promise<string>((resolve, reject) => {
            this.#worker.addEventListener("message", (e) => {
                const data = e.data;

                if (data.code === "ERROR") {
                    this.#worker.terminate();

                    return reject(data.error);
                }

                if (data.code === "GENERATION") {
                    return this.#ongens.forEach((run) => run.call(undefined, data.message));
                }

                if (data.code === "FINISHED") {
                    return resolve(data.message);
                }
            });
        });
    }

    async fired() {
        this.#worker.terminate();
    }
}
