/** @type {number} */
let zoomLevel = Math.min(400.0, window.innerWidth / 4.25); // This Math.min makes the fractal fit on mobile screens.
/** @type {[number, number]} */
let translation = [-0.5, 0]; // -0.5 centers the mandelbrot set.
/** @type {boolean} */
let isMouseDown = false; // Keep track if mouse is down, for click and drag.
/** @type {number} */
let resolution = 200; // Number of iterations in the escape time algorithm.

/**
 * @param {HTMLCanvasElement} canvas
 */
function attachMouseControls(canvas) {
    canvas.addEventListener("mousedown", (ev) => isMouseDown = true);
    canvas.addEventListener("mouseup", (ev) => isMouseDown = false);

    // Respond to mouse wheel movements.
    canvas.addEventListener("wheel", (ev) => {
        zoomLevel = Math.max(10, zoomLevel - (ev.deltaY * zoomLevel * 0.001));
    });

    // Keep track of mouse movement, for click and drag.
    canvas.addEventListener("mousemove", (ev) => {
        // Do nothing if mouse is not down.
        if (!isMouseDown) return;
        // Update translation.
        translation = [translation[0] - ev.movementX / zoomLevel, translation[1] + ev.movementY / zoomLevel];
    });
}

/**
 * @param {HTMLCanvasElement} canvas
 */
function attachTouchControls(canvas) {
    let lastTouch;
    let lastPinchWidth;

    canvas.addEventListener("touchstart", (event) => {
        event.preventDefault();

        // To display the crosshair.
        isMouseDown = true;

        const { touches } = event;
        if (touches.length === 2) {
            lastPinchWidth = Math.hypot(touches[0].clientX - touches[1].clientX, touches[0].clientY - touches[1].clientY);
        }
    });

    canvas.addEventListener("touchend", (event) => {
        event.preventDefault();

        // To remove the crosshair.
        isMouseDown = false;

        lastTouch = null;
        initialDistance = null;
    });

    canvas.addEventListener("touchmove", (event) => {
        event.preventDefault();

        const { touches } = event;
        switch (touches.length) {
            // Handle translation/scrolling.
            case 1:
                if (lastTouch) {
                    const mx = touches[0].pageX - lastTouch.pageX;
                    const my = touches[0].pageY - lastTouch.pageY;
                    translation = [translation[0] - mx / zoomLevel, translation[1] + my / zoomLevel];
                }

                lastTouch = touches[0];
                break;
            // Handle zooming.
            case 2:
                const currentPinchWidth = Math.hypot(touches[0].clientX - touches[1].clientX, touches[0].clientY - touches[1].clientY);
                zoomLevel = Math.max(10, zoomLevel - ((lastPinchWidth - currentPinchWidth) * zoomLevel * 0.005));
                lastPinchWidth = currentPinchWidth;
            default:
                break;
        }
    });
}

async function main() {
    // Load shaders.
    const vSource = await utils.fetchText("shaders/vert.glsl");
    const fSource = await utils.fetchText("shaders/frag.glsl");

    // Load the canvas.
    const canvas = document.getElementById("universe");
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;

    window.onresize = (event) => {
        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight;
    };

    // Element to render FPS.
    const subtext = document.getElementById("subtext");

    // Element to control the mandelbrot degree.
    const degreeSlider = document.getElementById("degree-slider-input");
    degreeSlider.disabled = true;

    // Element to control the render resolution.
    const resolutionSlider = document.getElementById("resolution-slider-input");
    resolutionSlider.disabled = true;

    // Reset button element.
    const resetButton = document.getElementById("reset-button");
    resetButton.disabled = true;

    // Initialize WebGL context.
    const gl = canvas.getContext("webgl2");
    if (!gl) {
        alert("Unable to initialize WebGL. Your browser may not support it.");
        return;
    }

    // Compile shaders.
    const vShader = utils.compileVertexShader(gl, vSource);
    const fShader = utils.compileFragmentShader(gl, fSource);

    // Create and use program.
    const program = utils.createProgram(gl, vShader, fShader);
    gl.useProgram(program);

    // Create buffer to store vertex positions.
    const positionBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
    const positions = [-1, -1, 1, -1, -1, 1, 1, 1];
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(positions), gl.STATIC_DRAW);

    // Specify how to pull the data out of the buffer.
    const positionAttributeLocation = gl.getAttribLocation(program, "vertex");
    gl.enableVertexAttribArray(positionAttributeLocation);
    gl.vertexAttribPointer(positionAttributeLocation, 2, gl.FLOAT, false, 0, 0);

    attachMouseControls(canvas);
    attachTouchControls(canvas);

    // Uniform for screen size.
    const uScreenSizeLoc = gl.getUniformLocation(program, 'u_screenSize');
    // Uniform for zoom level.
    const uZoomLevelLoc = gl.getUniformLocation(program, "u_zoomLevel");
    // Uniform for axis translation.
    const uTranslationLoc = gl.getUniformLocation(program, "u_translation");
    // Uniform to control if the crosshair should be shown.
    const uShowCrosshair = gl.getUniformLocation(program, "u_showCrosshair");
    // Uniform to send FPS to the shader.
    const uFPS = gl.getUniformLocation(program, "u_fps");
    // Uniform to control the resolution of the render.
    const uResolution = gl.getUniformLocation(program, "u_resolution");

    // Uniform to control the power of z in the mandelbrot function.
    const uDegree = gl.getUniformLocation(program, "u_degree");
    let degree = 0;

    // First timestamp to normalize render loop timestamps.
    let firstTimestamp;

    // Keeps track of whether the startup animation is complete.
    let isStartupAnimationDone = false;

    // Reset everything on reset button click.
    resetButton.onclick = (ev) => {
        zoomLevel = Math.min(400.0, window.innerWidth / 4.25);
        translation = [-0.5, 0];
        isMouseDown = false;
        degreeSlider.value = 2;
        resolutionSlider.value = 200;
    };

    /**
     * Main render loop.
     * @param {number} timestamp
     */
    function renderLoop(timestamp) {
        if (!firstTimestamp) firstTimestamp = timestamp;
        timestamp -= firstTimestamp;

        const fps = utils.showFPS(timestamp);
        subtext.innerText = `${fps.average10} FPS`;

        // Update screen size.
        gl.uniform2f(uScreenSizeLoc, window.innerWidth, window.innerHeight);

        // Update zoom level.
        gl.uniform1f(uZoomLevelLoc, zoomLevel);
        // Update axis translation.
        gl.uniform2f(uTranslationLoc, ...translation);
        // Update crosshair visibility.
        gl.uniform1i(uShowCrosshair, isMouseDown ? 1 : 0);
        // Update FPS.
        gl.uniform1f(uFPS, fps.average10);

        // Run startup animation.
        if (!isStartupAnimationDone && degree < 2) {
            let next = Math.sin(timestamp * 0.001) + 1;
            degree = next > degree ? next : 2; // Don't let animation go beyond degree == 2
        } else {
            // Once degree reaches 2, the startup animation shouldn't get triggered,
            // even if degree is reduced below 2 by the slider.
            isStartupAnimationDone = true;

            // Enable the UI control elements the first time this else block executes.
            if (degreeSlider.disabled) {
                degree = 2;
                // Enable degree slider.
                degreeSlider.disabled = false;
                degreeSlider.value = degree;
                // Enable resolution slider.
                resolutionSlider.disabled = false;
                resolutionSlider.value = resolution;
                // Enable reset button.
                resetButton.disabled = false;
            } else {
                degree = degreeSlider.value; // Change degree value based on slider input.
                resolution = resolutionSlider.value; // Change resolution value based on slider input.
            }
        }

        // Update degree in shader.
        gl.uniform1f(uDegree, degree);
        // Update resolution in shader.
        gl.uniform1i(uResolution, resolution);

        // Clear the canvas and draw.
        gl.clearColor(0, 0, 0, 1);
        gl.clear(gl.COLOR_BUFFER_BIT);
        gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);

        // Next frame.
        requestAnimationFrame(renderLoop);
    }

    // Trigger animation loop.
    requestAnimationFrame(renderLoop);
}
