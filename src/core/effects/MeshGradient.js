export class MeshGradient {
    constructor(canvas) {
        this.canvas = canvas;
        this.gl = canvas.getContext('webgl');
        this.program = null;
        this.colors = [
            [1.0, 0.3, 0.0], // Orange
            [0.0, 0.33, 1.0], // Blue
            [0.0, 1.0, 0.25], // Green
            [1.0, 0.0, 0.5]  // Pink
        ];
        this.time = 0;
        this.animationFrame = null;
        this.isPlaying = false;
        
        this.init();
    }

    init() {
        if (!this.gl) {
            console.error('WebGL not supported');
            return;
        }

        const vsSource = `
            attribute vec4 aVertexPosition;
            void main() {
                gl_Position = aVertexPosition;
            }
        `;

        const fsSource = `
            precision mediump float;
            uniform vec2 uResolution;
            uniform float uTime;
            uniform vec3 uColors[4];

            void main() {
                vec2 st = gl_FragCoord.xy / uResolution.xy;
                
                float t = uTime * 0.2;
                
                vec2 p1 = vec2(0.2 + 0.3*sin(t), 0.2 + 0.3*cos(t*1.2));
                vec2 p2 = vec2(0.8 - 0.3*cos(t*0.8), 0.2 + 0.3*sin(t));
                vec2 p3 = vec2(0.2 + 0.3*sin(t*0.5), 0.8 - 0.3*cos(t*0.9));
                vec2 p4 = vec2(0.8 - 0.3*cos(t*0.7), 0.8 + 0.3*sin(t*1.1));
                
                float d1 = distance(st, p1);
                float d2 = distance(st, p2);
                float d3 = distance(st, p3);
                float d4 = distance(st, p4);
                
                // Metaball-ish blending
                float sum = 1.0/pow(d1, 2.0) + 1.0/pow(d2, 2.0) + 1.0/pow(d3, 2.0) + 1.0/pow(d4, 2.0);
                
                vec3 color = (uColors[0]/pow(d1, 2.0) + uColors[1]/pow(d2, 2.0) + uColors[2]/pow(d3, 2.0) + uColors[3]/pow(d4, 2.0)) / sum;
                
                // Add some noise/dithering to prevent banding
                // float noise = fract(sin(dot(st.xy, vec2(12.9898,78.233))) * 43758.5453);
                // color += (noise - 0.5) * 0.02;

                gl_FragColor = vec4(color, 1.0);
            }
        `;

        const shaderProgram = this.initShaderProgram(this.gl, vsSource, fsSource);
        if (!shaderProgram) return;

        this.program = {
            program: shaderProgram,
            attribLocations: {
                vertexPosition: this.gl.getAttribLocation(shaderProgram, 'aVertexPosition'),
            },
            uniformLocations: {
                resolution: this.gl.getUniformLocation(shaderProgram, 'uResolution'),
                time: this.gl.getUniformLocation(shaderProgram, 'uTime'),
                colors: this.gl.getUniformLocation(shaderProgram, 'uColors'),
            },
        };

        // Buffer
        const positionBuffer = this.gl.createBuffer();
        this.gl.bindBuffer(this.gl.ARRAY_BUFFER, positionBuffer);
        const positions = [
            -1.0,  1.0,
             1.0,  1.0,
            -1.0, -1.0,
             1.0, -1.0,
        ];
        this.gl.bufferData(this.gl.ARRAY_BUFFER, new Float32Array(positions), this.gl.STATIC_DRAW);
        this.positionBuffer = positionBuffer;
    }

    initShaderProgram(gl, vsSource, fsSource) {
        const vertexShader = this.loadShader(gl, gl.VERTEX_SHADER, vsSource);
        const fragmentShader = this.loadShader(gl, gl.FRAGMENT_SHADER, fsSource);

        if (!vertexShader || !fragmentShader) return null;

        const shaderProgram = gl.createProgram();
        gl.attachShader(shaderProgram, vertexShader);
        gl.attachShader(shaderProgram, fragmentShader);
        gl.linkProgram(shaderProgram);

        if (!gl.getProgramParameter(shaderProgram, gl.LINK_STATUS)) {
            console.error('Unable to initialize the shader program: ' + gl.getProgramInfoLog(shaderProgram));
            return null;
        }

        return shaderProgram;
    }

    loadShader(gl, type, source) {
        const shader = gl.createShader(type);
        gl.shaderSource(shader, source);
        gl.compileShader(shader);

        if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
            console.error('An error occurred compiling the shaders: ' + gl.getShaderInfoLog(shader));
            gl.deleteShader(shader);
            return null;
        }

        return shader;
    }

    setColors(hexColors) {
        // Convert hex to normalized vec3
        this.colors = hexColors.map(hex => {
            const r = parseInt(hex.slice(1, 3), 16) / 255;
            const g = parseInt(hex.slice(3, 5), 16) / 255;
            const b = parseInt(hex.slice(5, 7), 16) / 255;
            return [r, g, b];
        });
    }

    play() {
        if (this.isPlaying) return;
        this.isPlaying = true;
        this.renderLoop();
    }

    stop() {
        this.isPlaying = false;
        if (this.animationFrame) {
            cancelAnimationFrame(this.animationFrame);
        }
    }

    renderLoop() {
        if (!this.isPlaying) return;
        this.time += 0.01;
        this.draw();
        this.animationFrame = requestAnimationFrame(() => this.renderLoop());
    }

    draw() {
        if (!this.gl || !this.program) return;

        const width = this.canvas.clientWidth;
        const height = this.canvas.clientHeight;
        
        if (this.canvas.width !== width || this.canvas.height !== height) {
            this.canvas.width = width;
            this.canvas.height = height;
            this.gl.viewport(0, 0, width, height);
        }

        this.gl.clearColor(0.0, 0.0, 0.0, 1.0);
        this.gl.clear(this.gl.COLOR_BUFFER_BIT);

        this.gl.useProgram(this.program.program);

        // Set Uniforms
        this.gl.uniform2f(this.program.uniformLocations.resolution, width, height);
        this.gl.uniform1f(this.program.uniformLocations.time, this.time);
        
        const flatColors = this.colors.flat();
        this.gl.uniform3fv(this.program.uniformLocations.colors, new Float32Array(flatColors));

        // Bind Vertex Position
        this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this.positionBuffer);
        this.gl.vertexAttribPointer(
            this.program.attribLocations.vertexPosition,
            2,
            this.gl.FLOAT,
            false,
            0,
            0
        );
        this.gl.enableVertexAttribArray(this.program.attribLocations.vertexPosition);

        this.gl.drawArrays(this.gl.TRIANGLE_STRIP, 0, 4);
    }
}
