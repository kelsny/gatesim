import { WatchedSet } from "../augments/WatchedSet";
import { IS_MAC_OS } from "../circular";
import { ACTIVATED_CSS_COLOR, GET_ACTIVATED_COLOR, TOAST_DURATION } from "../constants";
import { fromFile, saveDiagram } from "../files";
import { Component } from "../reified/Component";
import { Display } from "../reified/Display";
import { Input } from "../reified/Input";
import { Output } from "../reified/Output";
import { Reified, overlappedBounds } from "../reified/Reified";
import { SevenSegmentDisplay } from "../reified/SevenSegmentDisplay";
import { CanvasManager } from "./CanvasManager";
import { DraggingManager } from "./DraggingManager";
import { KeybindsManager } from "./KeybindsManager";
import { MouseManager } from "./MouseManager";
import { SandboxManager } from "./SandboxManager";
import { ToastManager } from "./ToastManager";
import { WiringManager } from "./WiringManager";

export class SelectionManager {
    static selected = new WatchedSet<Reified>();

    static readonly #mousedown = (e: MouseEvent) => {
        const target = e.target as Element;

        const element = [
            target.closest("button.board-input"),
            target.closest("button.board-output"),
            target.closest("div.component"),
            target.closest("div.display"),
        ].find((element) => element !== null);

        const reified = [...Reified.active].find((component) => component.element === element);

        if (reified) {
            if (
                (IS_MAC_OS && (KeybindsManager.isKeyDown("MetaLeft") || KeybindsManager.isKeyDown("MetaRight"))) ||
                (!IS_MAC_OS && (KeybindsManager.isKeyDown("ControlLeft") || KeybindsManager.isKeyDown("ControlRight")))
            )
                this.addSelection(reified);
            else if (!this.selected.has(reified)) this.select(reified);
        } else {
            this.selected.clear();
        }
    };

    static readonly #copy = async (e: ClipboardEvent) => {
        if (this.selected.size) {
            e.preventDefault();

            const array = [...this.selected];

            const data = saveDiagram(
                array,
                [...WiringManager.wires].filter(
                    (wiring) =>
                        array.some((component) => {
                            if (component instanceof Input) return wiring.from === component.element;

                            if (component instanceof Output) return false;

                            if (
                                component instanceof Component ||
                                component instanceof Display ||
                                component instanceof SevenSegmentDisplay
                            )
                                return component.outputs.some((output) => wiring.from === output);

                            throw new Error("Unknown component type.");
                        }) &&
                        array.some((component) => {
                            if (component instanceof Input) return false;

                            if (component instanceof Output) return wiring.to === component.element;

                            if (
                                component instanceof Component ||
                                component instanceof Display ||
                                component instanceof SevenSegmentDisplay
                            )
                                return component.inputs.some((input) => wiring.to === input);

                            throw new Error("Unknown component type.");
                        }),
                ),
            );

            await navigator.clipboard.writeText(data);
        }
    };

    static readonly #paste = async () => {
        const {
            error,
            result: [, components, wirings],
        } = fromFile(await navigator.clipboard.readText());

        if (error)
            return ToastManager.toast({
                message: "Unable to paste diagram data.",
                color: ACTIVATED_CSS_COLOR,
                duration: TOAST_DURATION,
            });

        const mouse = { ...MouseManager.mouse };

        const selection = this.selected.clone(true);

        SandboxManager.pushHistory(
            () => {
                Reified.active.addAll(components!);

                if (components!.every((component) => Reified.active.has(component))) {
                    components!.forEach((component) => {
                        component.attach();

                        if (
                            component instanceof Component ||
                            component instanceof Display ||
                            component instanceof SevenSegmentDisplay
                        ) {
                            component.inputs.forEach((input) => input.classList.remove("activated"));

                            requestAnimationFrame(() => component.update());
                        }

                        if (component instanceof Output) {
                            component.element.classList.remove("activated");
                        }
                    });

                    if (MouseManager.mouse.x !== -1 && MouseManager.mouse.y !== -1) {
                        const topleft = components!
                            .sort((a, b) => {
                                const ax = parseFloat(a.element.style.left);
                                const ay = parseFloat(a.element.style.top);
                                const bx = parseFloat(b.element.style.left);
                                const by = parseFloat(b.element.style.top);
                                const ad = Math.sqrt(ax * ax + ay * ay);
                                const bd = Math.sqrt(bx * bx + by * by);
                                return ad - bd;
                            })[0]
                            .element.getBoundingClientRect();

                        components!.forEach((component) => {
                            const offset = component.element.getBoundingClientRect();

                            component.move({
                                x: mouse.x + offset.left - topleft.left,
                                y: mouse.y + offset.top - topleft.top,
                            });
                        });
                    }

                    WiringManager.wires.addAll(wirings!);

                    this.selected.clear();

                    components!.forEach((component) => this.addSelection(component));

                    DraggingManager.snapToGridBasedUpdate();
                }
            },
            () => {
                Reified.active.deleteAll(components!);

                components!.forEach((component) => {
                    component.detach();
                });

                WiringManager.wires.deleteAll(wirings!);

                this.selected.clear();

                selection.forEach((component) => this.addSelection(component));
            },
        );
    };

    static select(reified: Reified) {
        this.selected.clear();

        this.selected.add(reified);

        Reified.active.forEach((component) => (component.element.style.zIndex = "100"));

        reified.element.style.zIndex = "1000";

        return this;
    }

    static selectAllIn(from: { x: number; y: number }, to: { x: number; y: number }) {
        this.selected.clear();

        const reified = [...Reified.active].filter((component) =>
            overlappedBounds(component.element.getBoundingClientRect(), from, to),
        );

        this.selected.addAll(reified);

        Reified.active.forEach((component) => (component.element.style.zIndex = "100"));

        reified.forEach((component) => (component.element.style.zIndex = "1000"));

        return this;
    }

    static addSelection(reified: Reified) {
        this.selected.add(reified);

        Reified.active.forEach((component) => (component.element.style.zIndex = "100"));

        reified.element.style.zIndex = "1000";

        return this;
    }

    static isSelected(element: HTMLElement) {
        return [...this.selected].some((component) => {
            if (component instanceof Input) return element === component.element;

            if (component instanceof Output) return element === component.element;

            if (
                component instanceof Component ||
                component instanceof Display ||
                component instanceof SevenSegmentDisplay
            )
                return (
                    component.inputs.some((input) => element === input) ||
                    component.outputs.some((output) => element === output) ||
                    element === component.element
                );

            throw new Error("Unknown component type.");
        });
    }

    static render({ fg }: { fg: CanvasRenderingContext2D }) {
        SelectionManager.selected.forEach((component) => {
            const rect = component.element.getBoundingClientRect();

            fg.strokeStyle = GET_ACTIVATED_COLOR();

            fg.lineWidth = 1;

            fg.lineJoin = "miter";

            fg.strokeRect(rect.left - 15, rect.top - 15, rect.width + 15 + 15, rect.height + 15 + 15);
        });
    }

    static listen() {
        CanvasManager.addJob(this.render.bind(this));

        document.body.addEventListener("mousedown", this.#mousedown);
        document.addEventListener("copy", this.#copy);
        document.addEventListener("paste", this.#paste);

        return this;
    }

    static deafen() {
        document.body.removeEventListener("mousedown", this.#mousedown);
        document.removeEventListener("copy", this.#copy);
        document.removeEventListener("paste", this.#paste);

        return this;
    }

    static reset() {
        this.selected.clear();

        this.deafen();

        return this;
    }
}
