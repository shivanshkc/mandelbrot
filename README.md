# Mandelbrot

A GPU accelerated, optimized and interactive Mandelbrot set renderer.

![Render](https://github.com/shivanshkc/mandelbrot/blob/main/showcase/mandelbrot.png)

## Features

- Supports Mandelbrot and Multibrot sets up to degree 6.
- Adjustable resolution with live FPS.
- Fully compatible with all screen sizes and GPUs.
- Optimized for performance using WebGL shaders.

## How to run

### Method 1 - Podman or Docker (Recommended)

1. Clone the repository:
   ```sh
   git clone https://github.com/shivanshkc/mandelbrot.git
   cd mandelbrot
   ```
2. Build the container image.
   ```sh
   docker build --file Containerfile --tag mandelbrot:latest .
   ```
2. Run the container.
   ```sh
   docker run --detach --name mandelbrot --publish 8080:8080 mandelbrot:latest
   ```
4. Open your browser and navigate to `http://localhost:8080`.

### Method 2 - NPX HTTP Server

1. Clone the repository:
   ```sh
   git clone https://github.com/shivanshkc/mandelbrot.git
   cd mandelbrot
   ```
2. Run the npx HTTP server.
   ```sh
   npx http-server
   ```
3. Open your browser and navigate to `http://localhost:8080`.

## Usage

- Zoom in and out using your mouse wheel.
- Click and drag to navigate different regions of the set.
- Adjust settings (degree, iterations) using the UI controls.
- Restore to defaults using the reset button.

## Folder Structure

```
mandelbrot/
|-- index.html         # Entry point
|-- tailwind-in.css    # Input CSS (Tailwind)
|-- tailwind-out.css   # Generated CSS
|-- src/               # JavaScript source files
|   |-- index.js       # Main script
|   |-- utils.js       # Helper functions
|-- shaders/           # WebGL shaders
|   |-- vert.glsl      # Vertex shader
|   |-- frag.glsl      # Fragment shader
|-- showcase/          # Showcase images
|-- nginx/             # Nginx configuration
|-- .github/           # GitHub Actions workflows
```

## What is the Mandelbrot Set?

The Mandelbrot set is a complex and famous fractal, defined by the iterative equation:

$z_{n+1} = z_n^2 + c$

Here, $z$ and $c$ are complex numbers. The set is named after Benoit B. Mandelbrot and is known for its intricate, infinitely detailed boundary when visualized.

To learn more, check out: [Exploring the Mandelbrot Set (Paul Bourke)](http://paulbourke.net/fractals/mandelbrot/)

## Contributing

Contributions are welcome! Please follow these steps to contribute:

1. Fork the repository.
2. Create a new branch for your feature or bug fix.
3. Make your changes and test thoroughly.
4. Submit a pull request with a detailed description of your changes.

## License

This project is licensed under the terms of the [MIT License](LICENSE).
