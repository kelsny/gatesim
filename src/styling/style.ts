import { css } from "../reified/Reified";

export default css`
    *,
    *::before,
    *::after {
        margin: 0;
        box-sizing: border-box;
    }

    html {
        height: 100%;

        overflow: hidden;

        overscroll-behavior: none;
    }

    body {
        height: 100%;
    }

    .reified-root {
        z-index: 0;

        height: 100vh;
        width: 100vw;

        position: absolute;
    }

    canvas {
        position: absolute;

        pointer-events: none;

        z-index: -100;

        width: 100vw;
        height: 100vh;
    }
`;
