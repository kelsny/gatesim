//@ts-nocheck

import { ACTIVATED_CSS_COLOR } from "./constants";

if (location.pathname.startsWith("/cad")) {
    await import(`./cad/index.ts`);

    console.log("%cGATESIM CAD", `color: ${ACTIVATED_CSS_COLOR}; font-size: 2rem;`);
    console.log("Input a truth table to get started.");
    console.log("The program will find a circuit that matches the table.");
} else {
    await import(`./app.ts`);

    console.log("%cGATESIM", `color: ${ACTIVATED_CSS_COLOR}; font-size: 2rem;`);
    console.log("Right click to get started.");
    console.log("Press '?' for help.");
}

export {};
