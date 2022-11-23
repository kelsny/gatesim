import { chips } from "./chips";
import { Component } from "./Component";
import { INPUT_COMPONENT_CSS_SIZE, ORIGIN_POINT, OUTPUT_COMPONENT_CSS_SIZE } from "./constants";
import { DraggingManager } from "./DraggingManager";
import { fromFile, saveDiagram } from "./files";
import { Input } from "./Input";
import { MenuManager } from "./MenuManager";
import { Output } from "./Output";
import { Reified } from "./Reified";
import { WiringManager } from "./WiringManager";

export const [queueNewContext] = MenuManager.use(Reified.root, [
    {
        "insert-chip": {
            label: "Insert chip",
            callback: (e) => {
                const name = prompt("Enter the chip's name:");

                if (!name) return;

                const chip = chips.get(name.toUpperCase());

                if (!chip) return;

                const component = new Component(Reflect.construct(chip, []), ORIGIN_POINT);

                Reified.active.add(component);

                component.attach();

                DraggingManager.watch(component.element, component.name);

                const { width, height } = getComputedStyle(component.element);

                component.move({
                    x: e.clientX - parseFloat(width) / 2,
                    y: e.clientY - parseFloat(height) / 2,
                });
            },
        },
    },
    {
        "new-input": {
            label: "New input",
            callback: (e) => {
                const input = new Input({
                    x: e.clientX - INPUT_COMPONENT_CSS_SIZE / 2,
                    y: e.clientY - INPUT_COMPONENT_CSS_SIZE / 2,
                });

                Reified.active.add(input);

                input.attach();
            },
        },
        "new-output": {
            label: "New output",
            callback: (e) => {
                const output = new Output({
                    x: e.clientX - OUTPUT_COMPONENT_CSS_SIZE / 2,
                    y: e.clientY - OUTPUT_COMPONENT_CSS_SIZE / 2,
                });

                Reified.active.add(output);

                output.attach();
            },
        },
    },
    // {
    //     "new-chip": {
    //         label: "New chip from diagram",
    //         callback: () => {
    //             const name = prompt("Enter the name of the chip:");

    //             if (!name) return;

    //             if (
    //                 !chips.has(name.trim().toUpperCase()) &&
    //                 !confirm("A chip already exists with this name. Are you sure you want to replace it?")
    //             )
    //                 return;

    //             if (!/^\w+$/.test(name.trim().toUpperCase()))
    //                 return alert("Chip name must consist of only alphanumeric characters.");

    //             const inputs = [...Reified.active.values()].filter((v) => v instanceof Input).length;
    //             const outputs = [...Reified.active.values()].filter((v) => v instanceof Output).length;

    //             chips.set(
    //                 name.trim().toUpperCase(),
    //                 class _ extends Chip<number, number> {
    //                     static readonly NAME = name!.trim().toUpperCase();
    //                     static readonly INPUTS = inputs;
    //                     static readonly OUTPUTS = outputs;

    //                     constructor() {
    //                         super(name!, inputs, outputs);
    //                     }

    //                     output(inputs: boolean[]): boolean[] {
    //                         //TODO: SOMEHOW COMPILE THE DIAGRAM

    //                         return [];
    //                     }
    //                 },
    //             );

    //             Reified.active.forEach((component) => component.detach());

    //             WiringManager.wires.forEach((wire) => wire.destroy());
    //         },
    //     },
    // },
    {
        "save-as": {
            label: "Save as file",
            callback: () => {
                Object.assign(document.createElement("a"), {
                    href: URL.createObjectURL(
                        new Blob([saveDiagram([...Reified.active], [...WiringManager.wires])], {
                            type: "application/json",
                        }),
                    ),
                    download: `gatesim-${Date.now()}.json`,
                }).click();
            },
        },
        "import-from": {
            label: "Import from file",
            callback: async () => {
                const input = Object.assign(document.createElement("input"), { type: "file" });

                input.click();

                const file = await new Promise<File | undefined>((resolve) => {
                    input.onchange = () => resolve(input.files?.[0] ?? undefined);

                    input.onerror = () => resolve(undefined);
                });

                if (!file) return;

                const reader = new FileReader();

                reader.readAsText(file);

                const raw = await new Promise<string | undefined>((resolve) => {
                    reader.onload = () => resolve(reader.result?.toString() ?? undefined);

                    reader.onerror = () => resolve(undefined);
                });

                if (!raw) return;

                const {
                    error,
                    result: [components, wires],
                } = fromFile(raw);

                if (error) return alert(error);

                Reified.active.forEach((component) => component.detach());

                Reified.active = new Set(components);

                Reified.active.forEach((component) => component.attach());

                WiringManager.wires.forEach((wire) => wire.destroy());

                WiringManager.wires = new Set(wires);

                //
            },
        },
    },
]);
