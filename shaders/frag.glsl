#version 300 es
precision mediump float;

uniform vec2 u_screenSize;
uniform float u_zoomLevel;

// Output pixel color.
out vec4 fragColor;

struct mandelbrotData {
    bool inside;
    vec2 firstOutsideZ;
    int firstOutsideIndex;
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

mandelbrotData mandelbrot(vec2 point) {
    // Optimisation as per: https://en.wikipedia.org/wiki/Plotting_algorithms_for_the_Mandelbrot_set#Cardioid_/_bulb_checking
    if (isInMandelbrotCardioid(point) || isInMandelbrotBulb(point)) return mandelbrotData(true, vec2(0, 0), 0);

    vec2 z = vec2(0, 0);

    // TODO: Period checking.
    for (int i = 0; i < 5000; i++) {
        z = vec2(z.x*z.x - z.y*z.y, 2.0*z.x*z.y) + point;
        if (length(z) > 2.0) return mandelbrotData(false, z, i);
    }

    return mandelbrotData(true, vec2(0, 0), 0);
}

// transformAxes shifts the origin from bottom left toward the center (kinda) and zooms in.
vec2 transformAxes(vec2 point) {
    float width = u_screenSize.x;
    float height = u_screenSize.y;

    vec2 transformed = point - vec2(width/1.75, height/2.0);
    return transformed / u_zoomLevel;
}

float sin01(float x) {
    return (sin(x) + 1.0) / 2.0;
}

void main() {
    vec2 wh = u_screenSize;
    vec2 xy = gl_FragCoord.xy;

    vec2 transformedWH = transformAxes(wh);
    vec2 transformedXY = transformAxes(xy);

    mandelbrotData data = mandelbrot(transformedXY);
    if (data.inside) {
        fragColor = vec4(0.0, 0.0, 0.0, 1);
        return;
    }


    // Bright blue boundary.
    fragColor = vec4(0.0, 0.0, float(data.firstOutsideIndex) / 12.0, 1);

    // Bright rainbow boundary.
    // fragColor = vec4(xy * float(data.firstOutsideIndex) / (wh * 12.0), float(data.firstOutsideIndex) / 12.0, 1);

    // All layers visible.
    // fragColor = vec4(0, 0, sin01(float(data.firstOutsideIndex)), 1);

    // All layers visible + z information.
    // fragColor = vec4(0, sin01(length(data.firstOutsideZ)), sin01(float(data.firstOutsideIndex)), 1);
}
