const utils = {};

/**
 * Compiles and returns a vertex shader.
 * @param {WebGL2RenderingContext} gl
 * @param {string} source
 * @returns {WebGLShader}
 */
utils.compileVertexShader = function (gl, source) {
    // Create vertex shader.
    const vertexShader = gl.createShader(gl.VERTEX_SHADER);
    gl.shaderSource(vertexShader, source);

    // Compile vertex shader.
    gl.compileShader(vertexShader);
    if (!gl.getShaderParameter(vertexShader, gl.COMPILE_STATUS) || !vertexShader) {
        throw new Error("Failed to compile vertex shader: " + gl.getShaderInfoLog(vertexShader));
    }

    return vertexShader;
};

/**
 * Compiles and returns a fragment shader.
 * @param {WebGL2RenderingContext} gl
 * @param {string} source
 * @returns {WebGLShader}
 */
utils.compileFragmentShader = function (gl, source) {
    // Create fragment shader.
    const fragmentShader = gl.createShader(gl.FRAGMENT_SHADER);
    gl.shaderSource(fragmentShader, source);

    // Compile fragment shader.
    gl.compileShader(fragmentShader);
    if (!gl.getShaderParameter(fragmentShader, gl.COMPILE_STATUS) || !fragmentShader) {
        throw new Error("Failed to compile fragment shader: " + gl.getShaderInfoLog(fragmentShader));
    }

    return fragmentShader;
};

/**
 * Creates and links a program.
 * @param {WebGL2RenderingContext} gl
 * @param {WebGLShader} vertexShader
 * @param {WebGLShader} fragmentShader
 * @returns {WebGLProgram}
 */
utils.createProgram = function (gl, vertexShader, fragmentShader) {
    // Create and setup program.
    const program = gl.createProgram();
    gl.attachShader(program, vertexShader);
    gl.attachShader(program, fragmentShader);
    gl.linkProgram(program);

    if (!gl.getProgramParameter(program, gl.LINK_STATUS) || !program) {
        throw new Error("Failed to link program: " + gl.getProgramInfoLog(program));
    }

    gl.validateProgram(program);
    if (!gl.getProgramParameter(program, gl.VALIDATE_STATUS)) {
        throw new Error("Failed to validate program: " + gl.getProgramInfoLog(program));
    }

    return program;
};

/**
 * fetchText fetches all data from the given path as text.
 * @param {string} path
 * @returns {Promise<string>}
 */
utils.fetchText = async function (path) {
    return (await fetch(path)).text();
};

// state variables for the FPS calculator.
let _lastTimestamp = 0.0;
let _frameCountYet = 0.0;
let _lastAverageFPMS = 0.0;

/**
 * showFPS calculates the FPS as per the given timestamp and puts it in the given UI element.
 * @param {number} timestamp
 * @returns {{ average: number, actual: number }}
 */
utils.showFPS = function (timestamp) {
    const currentFPMS = 1.0 / (timestamp - _lastTimestamp);
    if (!isFinite(currentFPMS)) return 0;

    const latestAverageFPMS =
        (_frameCountYet * _lastAverageFPMS + currentFPMS) /
        (_frameCountYet + 1);

    const averageFPS = Math.ceil(latestAverageFPMS * 1000);
    const actualFPS = Math.ceil(currentFPMS * 1000);

    _lastTimestamp = timestamp;
    _lastAverageFPMS = latestAverageFPMS;
    _frameCountYet++;

    return { average: averageFPS, actual: actualFPS };
};
