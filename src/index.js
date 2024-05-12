/** @type {number} */
let zoomLevel = Math.min(300.0, window.innerWidth / 4.25); // This Math.min makes the fractal fit on mobile screens.
/** @type {[number, number]} */
let translation = [-0.5, 0]; // -0.5 centers the mandelbrot set.
/** @type {boolean} */
let isMouseDown = false; // Keep track if mouse is down, for click and drag.

function attachMouseControls() {
    window.onmousedown = () => isMouseDown = true;
    window.onmouseup = () => isMouseDown = false;

    // Respond to mouse wheel movements.
    window.onwheel = (event) => {
        zoomLevel = Math.max(10, zoomLevel - (event.deltaY * zoomLevel * 0.001));
    }

    // Keep track of mouse movement, for click and drag.
    window.onmousemove = (event) => {
        // Do nothing if mouse is not down.
        if (!isMouseDown) return;
        // Update translation.
        translation = [translation[0] - event.movementX / zoomLevel, translation[1] + event.movementY / zoomLevel];
    };
}

function attachTouchControls() {
    let lastTouch;
    let lastPinchWidth;

    window.ontouchstart = (event) => {
        event.preventDefault();

        // To display the crosshair.
        isMouseDown = true;

        const { touches } = event;
        if (touches.length === 2) {
            lastPinchWidth = Math.hypot(touches[0].clientX - touches[1].clientX, touches[0].clientY - touches[1].clientY);
        }
    }

    window.ontouchend = (event) => {
        event.preventDefault();

        // To remove the crosshair.
        isMouseDown = false;

        lastTouch = null;
        initialDistance = null;
    }

    window.ontouchmove = (event) => {
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
    };
}

async function main() {
    // Load shaders.
    const vSource = await utils.fetchText("shaders/vert.glsl");
    const fSource = await utils.fetchText("shaders/frag.glsl");

    // Load the canvas.
    const canvas = document.getElementById("universe");
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;

    // Element to render FPS.
    const subtext = document.getElementById("subtext");

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

    attachMouseControls();
    attachTouchControls();

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

    // Uniform to control the power of z in the mandelbrot function.
    const uZPower = gl.getUniformLocation(program, "u_zPower");
    let zPower = 0.0;

    // Degree of the mandelbrot set for animations.
    const mandelDegree = 2.001;
    const a = (mandelDegree - 1) / 2;
    const b = (mandelDegree + 1) / 2;

    /**
     * Main render loop.
     * @param {number} timestamp
     */
    function renderLoop(timestamp) {
        const fps = utils.showFPS(timestamp);
        subtext.innerText = `${fps.actual} FPS`;

        // Update screen size.
        gl.uniform2f(uScreenSizeLoc, window.innerWidth, window.innerHeight);

        // Update zoom level.
        gl.uniform1f(uZoomLevelLoc, zoomLevel);
        // Update axis translation.
        gl.uniform2f(uTranslationLoc, ...translation);
        // Update crosshair visibility.
        gl.uniform1i(uShowCrosshair, isMouseDown ? 1 : 0);
        // Update FPS.
        gl.uniform1f(uFPS, fps.actual);

        // Update the power of Z.
        if (zPower < 2) {
            zPower = (Math.cos(timestamp * 0.002 - Math.PI) * a) + b;
            gl.uniform1f(uZPower, zPower);
        } else {
            gl.uniform1f(uZPower, 2);
        }

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
