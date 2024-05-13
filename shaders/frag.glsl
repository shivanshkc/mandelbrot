#version 300 es
precision highp float;

uniform vec2 u_screenSize;
uniform float u_zoomLevel;
uniform vec2 u_translation;
uniform int u_showCrosshair;
uniform float u_degree;
uniform float u_fps;

// Output pixel color.
out vec4 fragColor;

struct mandelbrotData {
    bool inside;

    vec2 firstOutsideZ;
    int firstOutsideIndex;

    bool isEquationOptimized;
};

bool isInMandelbrotCardioid(vec2 point) {
    float q = pow(point.x - 0.25, 2.0) + point.y * point.y;
    float lhs = q * (q + (point.x - 0.25));
    float rhs = 0.25 * point.y * point.y;
    return lhs <= rhs;
}

bool isInMandelbrotBulb(vec2 point) {
    return pow(point.x + 1.0, 2.0) + point.y*point.y <= 0.0625;
}

vec2 cpow(vec2 base, float exponent) {
    if (exponent == 0.0) return vec2(1, 0);
    if (exponent == 1.0) return base;
    if (exponent == 2.0) return vec2(base.x*base.x - base.y*base.y, 2.0 * base.x * base.y);
    if (exponent == 3.0) return vec2(base.x*base.x*base.x - 3.0*base.x*base.y*base.y, 3.0*base.x*base.x*base.y-base.y*base.y*base.y);

    float theta = atan(base.y, base.x);
    float rho = length(base);

    float newTheta = theta * exponent;
    float newRho = pow(rho, exponent);

    return vec2(newRho * cos(newTheta), newRho * sin(newTheta));
}

mandelbrotData mandelbrot(vec2 point) {
    // Optimisation as per: https://en.wikipedia.org/wiki/Plotting_algorithms_for_the_Mandelbrot_set#Cardioid_/_bulb_checking
    if (u_degree == 2.0 && (isInMandelbrotCardioid(point) || isInMandelbrotBulb(point)))
        return mandelbrotData(true, vec2(0, 0), 0, true);

    vec2 z = vec2(0, 0);

    for (int i = 0; i < 200; i++) {
        // Znew = Z^n + C
        z = cpow(z, u_degree) + point;
        // Escape time algorithm.
        // Using 256 here instead of 2.0 for color smoothing.
        if (length(z) > 256.0) return mandelbrotData(false, z, i, false);
    }

    return mandelbrotData(true, vec2(0, 0), 0, false);
}

// transformAxes shifts the origin from bottom left toward the center (kinda) and zooms in.
vec2 transformAxes(vec2 point) {
    float width = u_screenSize.x;
    float height = u_screenSize.y;

    point -= u_screenSize / 2.0;
    return point / u_zoomLevel + u_translation;
}

float sin01(float x) {
    return (sin(x) + 1.0) / 2.0;
}

bool drawCrosshair(vec2 xy) {
    // Don't render if uniform is not 1.
    if (u_showCrosshair != 1) return false;

    vec2 cxy = xy - u_screenSize / 2.0;
    float ax = abs(cxy.x);
    float ay = abs(cxy.y);

    if ((ax > 50.0 || ay > 1.0) && (ay > 50.0 || ax > 1.0))
        return false;

    fragColor = vec4(0.5, 0.5, 0.5, 1.0);
    return true;
}

void main() {
    vec2 xy = gl_FragCoord.xy;
    if (drawCrosshair(xy)) return;

    vec2 transformedXY = transformAxes(xy);
    mandelbrotData data = mandelbrot(transformedXY);
    if (data.inside) {
        fragColor = vec4(0, 0, 0, 1);
        return;
    }

    // Bright blue boundary.
    // fragColor = vec4(0.0, 0.0, float(data.firstOutsideIndex) / 12.0, 1);

    // Bright fiery boundary.
    // fragColor = vec4(xy * float(data.firstOutsideIndex) / (u_screenSize * 12.0), 0, 1);

    // JMAIO's color scheme. // Requires a smoothing factor in the mandelbrot function (z < 256)
    float sl = float(data.firstOutsideIndex) - log2(log2(length(data.firstOutsideZ))) + 4.0;
    vec3 col = 0.5 + 0.5*cos(1.0 +  sl*0.5 + vec3(0.0, 0.6, 1.0));
    fragColor = vec4(col, 1.0);

    // All layers visible.
    // fragColor = vec4(0, 0, sin01(float(data.firstOutsideIndex)), 1);

    // All layers visible + z information.
    // fragColor = vec4(0, sin01(length(data.firstOutsideZ)), sin01(float(data.firstOutsideIndex)), 1);
}
