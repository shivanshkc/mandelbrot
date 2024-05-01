async function main() {
    const vSource = await utils.fetchText("shaders/vert.glsl");
    const fSource = await utils.fetchText("shaders/frag.glsl");

    // Initialize WebGL context.
    const canvas = document.getElementById("universe");
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;

    const subtext = document.getElementById("subtext");

    const gl = canvas.getContext("webgl2");
    if (!gl) {
        alert("Unable to initialize WebGL. Your browser may not support it.");
        return;
    }

    const vShader = compileVertexShader(gl, vSource);
    const fShader = compileFragmentShader(gl, fSource);

    const program = createProgram(gl, vShader, fShader);
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

    const uScreenSizeLoc = gl.getUniformLocation(program, 'u_screenSize');
    gl.uniform2f(uScreenSizeLoc, window.innerWidth, window.innerHeight);

    const uZoomLevelLoc = gl.getUniformLocation(program, "u_zoomLevel");
    let zoomLevel = 300.0;

    window.onwheel = (event) => {
        if (zoomLevel + event.deltaY > 10) zoomLevel += event.deltaY;
    };

    /**
     * Main render loop.
     * @param {number} timestamp
     */
    function renderLoop(timestamp) {
        utils.showFPS(timestamp, subtext);

        // Update zoom level.
        gl.uniform1f(uZoomLevelLoc, zoomLevel);

        // Clear the canvas and draw.
        gl.clearColor(0, 0, 0, 1);
        gl.clear(gl.COLOR_BUFFER_BIT);
        gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);

        requestAnimationFrame(renderLoop);
    }

    requestAnimationFrame(renderLoop);
}

function compileVertexShader(gl, source) {
    // Create vertex shader.
    const vertexShader = gl.createShader(gl.VERTEX_SHADER);
    gl.shaderSource(vertexShader, source);

    // Compile vertex shader.
    gl.compileShader(vertexShader);
    if (!gl.getShaderParameter(vertexShader, gl.COMPILE_STATUS)) {
        console.error("Failed to compile vertex shader:", gl.getShaderInfoLog(vertexShader));
        return;
    }

    return vertexShader;
}

function compileFragmentShader(gl, source) {
    // Create fragment shader.
    const fragmentShader = gl.createShader(gl.FRAGMENT_SHADER);
    gl.shaderSource(fragmentShader, source);

    // Compile fragment shader.
    gl.compileShader(fragmentShader);
    if (!gl.getShaderParameter(fragmentShader, gl.COMPILE_STATUS)) {
        console.error("Failed to compile fragment shader:", gl.getShaderInfoLog(fragmentShader));
        return;
    }

    return fragmentShader;
}

function createProgram(gl, vertexShader, fragmentShader) {
    // Create and setup program.
    const program = gl.createProgram();
    gl.attachShader(program, vertexShader);
    gl.attachShader(program, fragmentShader);
    gl.linkProgram(program);

    if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
        console.error("Failed to link program:", gl.getProgramInfoLog(program));
        return;
    }

    gl.validateProgram(program);
    if (!gl.getProgramParameter(program, gl.VALIDATE_STATUS)) {
        console.error("Failed to validate program:", gl.getProgramInfoLog(program));
        return;
    }

    return program;
};