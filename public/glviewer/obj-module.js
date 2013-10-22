var gl;
var scene;
var xoff = -2;
var mvMatrixStack = [];

var triangleVertexPositionBuffer;
var squareVertexPositionBuffer;

var modelLoaded = false;
var modelTextureLoaded = false;
var modelTexture2Loaded = false;

var zoom = -8;



function initGL(canvas) {
    try {
        gl = canvas.getContext("webgl");
        gl.viewportWidth = canvas.width;
        gl.viewportHeight = canvas.height;
    } catch (e) {
    }
    if (!gl) {
        alert("Could not initialise WebGL, sorry :-(  Try Chrome?");
    }
}


 function getShader(gl, id) {
    var shaderScript = document.getElementById(id);
    if (!shaderScript) {
        return null;
    }

    var str = "";
    var k = shaderScript.firstChild;
    while (k) {
        if (k.nodeType == 3) {
            str += k.textContent;
        }
        k = k.nextSibling;
    }

    var shader;
    if (shaderScript.type == "x-shader/x-fragment") {
        shader = gl.createShader(gl.FRAGMENT_SHADER);
    } else if (shaderScript.type == "x-shader/x-vertex") {
        shader = gl.createShader(gl.VERTEX_SHADER);
    } else {
        return null;
    }

    gl.shaderSource(shader, str);
    gl.compileShader(shader);

    if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
        alert(gl.getShaderInfoLog(shader));
        return null;
    }

    return shader;
}

var modelTexture;
var modelTexture2;
function initTexture() {
    modelTexture = gl.createTexture();
    modelTexture.image = new Image();
    modelTexture.image.onload = function() {
        handleLoadedTexture(modelTexture);
        modelTextureLoaded = true;
    }
    modelTexture.image.src = "/uploads/uffizi_probe.png";

    modelTexture2 = gl.createTexture();
    modelTexture2.image = new Image();
    modelTexture2.image.onload = function() {
        handleLoadedTexture(modelTexture2);
        modelTexture2Loaded = true;
    }
    modelTexture2.image.src = "/uploads/sand.gif";
}

function handleLoadedTexture(texture) {
    gl.bindTexture(gl.TEXTURE_2D, texture);
    gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, texture.image);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR_MIPMAP_NEAREST);
    gl.generateMipmap(gl.TEXTURE_2D);
    gl.bindTexture(gl.TEXTURE_2D, null);
    
}

var shaderProgram;

function initShaders() {
    var fragmentShader = getShader(gl, "shader-fs");
    var vertexShader = getShader(gl, "shader-vs");

    shaderProgram = gl.createProgram();
    gl.attachShader(shaderProgram, vertexShader);
    gl.attachShader(shaderProgram, fragmentShader);
    gl.linkProgram(shaderProgram);

    if (!gl.getProgramParameter(shaderProgram, gl.LINK_STATUS)) {
        alert("Could not initialise shaders");
    }

    gl.useProgram(shaderProgram);

    shaderProgram.vertexPositionAttribute = gl.getAttribLocation(shaderProgram, "aVertexPosition");
    gl.enableVertexAttribArray(shaderProgram.vertexPositionAttribute);

    shaderProgram.vertexNormalAttribute = gl.getAttribLocation(shaderProgram, "aVertexNormal");
    gl.enableVertexAttribArray(shaderProgram.vertexNormalAttribute);

    shaderProgram.textureCoordAttribute = gl.getAttribLocation(shaderProgram, "aTextureCoord");
    gl.enableVertexAttribArray(shaderProgram.textureCoordAttribute);

    shaderProgram.pMatrixUniform = gl.getUniformLocation(shaderProgram, "uPMatrix");
    shaderProgram.mvMatrixUniform = gl.getUniformLocation(shaderProgram, "uMVMatrix");
    shaderProgram.nMatrixUniform = gl.getUniformLocation(shaderProgram, "uNMatrix");
    shaderProgram.samplerUniform = gl.getUniformLocation(shaderProgram, "uSampler");
    shaderProgram.samplerUniform2 = gl.getUniformLocation(shaderProgram, "uSampler2");
    shaderProgram.useLightingUniform = gl.getUniformLocation(shaderProgram, "uUseLighting");
    shaderProgram.ambientColorUniform = gl.getUniformLocation(shaderProgram, "uAmbientColor");
    shaderProgram.lightingDirectionUniform = gl.getUniformLocation(shaderProgram, "uLightingDirection");
    shaderProgram.directionalColorUniform = gl.getUniformLocation(shaderProgram, "uDirectionalColor");
    shaderProgram.lightPosition = gl.getUniformLocation(shaderProgram, "lightPosition");
    shaderProgram.lightPositionUniform = gl.getUniformLocation(shaderProgram, "lightPosition");
}


var mvMatrix = mat4.create();
var pMatrix = mat4.create();

function setMatrixUniforms() {
    gl.uniformMatrix4fv(shaderProgram.pMatrixUniform, false, pMatrix);
    gl.uniformMatrix4fv(shaderProgram.mvMatrixUniform, false, mvMatrix);

    var normalMatrix = mat3.create();
    normalMatrix = customInvert43(mvMatrix);
    //mat4.toInverseMat3(mvMatrix, normalMatrix);
    mat3.transpose(normalMatrix, normalMatrix);
    gl.uniformMatrix3fv(shaderProgram.nMatrixUniform, false, normalMatrix);
}

var pyramidVertexPositionBuffer;
var pyramidVertexColorBuffer;
function initBuffers() {
    pyramidVertexPositionBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, pyramidVertexPositionBuffer);
    var vertices = [
        // Front face
         0.0,  1.0,  0.0,
        -1.0, -1.0,  1.0,
         1.0, -1.0,  1.0,

        // Right face
         0.0,  1.0,  0.0,
         1.0, -1.0,  1.0,
         1.0, -1.0, -1.0,

        // Back face
         0.0,  1.0,  0.0,
         1.0, -1.0, -1.0,
        -1.0, -1.0, -1.0,

        // Left face
         0.0,  1.0,  0.0,
        -1.0, -1.0, -1.0,
        -1.0, -1.0,  1.0
    ];
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(vertices), gl.STATIC_DRAW);
    pyramidVertexPositionBuffer.itemSize = 3;
    pyramidVertexPositionBuffer.numItems = 12;

    pyramidVertexColorBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, pyramidVertexColorBuffer);
    var colors = [
        // Front face
        1.0, 0.0, 0.0, 1.0,
        0.0, 1.0, 0.0, 1.0,
        0.0, 0.0, 1.0, 1.0,

        // Right face
        1.0, 0.0, 0.0, 1.0,
        0.0, 0.0, 1.0, 1.0,
        0.0, 1.0, 0.0, 1.0,

        // Back face
        1.0, 0.0, 0.0, 1.0,
        0.0, 1.0, 0.0, 1.0,
        0.0, 0.0, 1.0, 1.0,

        // Left face
        1.0, 0.0, 0.0, 1.0,
        0.0, 0.0, 1.0, 1.0,
        0.0, 1.0, 0.0, 1.0
    ];
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(colors), gl.STATIC_DRAW);
    pyramidVertexColorBuffer.itemSize = 4;
    pyramidVertexColorBuffer.numItems = 12;
}



function drawScene() {
    gl.viewport(0, 0, gl.viewportWidth, gl.viewportHeight);
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

    mat4.perspective(pMatrix, 45, gl.viewportWidth / gl.viewportHeight, 0.1, 100.0);


    mat4.identity(mvMatrix);
    mat4.translate(mvMatrix, mvMatrix, [0, 0.0, zoom]);


    if(modelLoaded && modelTextureLoaded && modelTexture2Loaded){
        mvPushMatrix();
        mat4.translate(mvMatrix, mvMatrix, [0, -1.5, 0.0]);
        mat4.rotate(mvMatrix, mvMatrix, 0.3*Math.sin(xoff), [1.0, 0.0, 0.0]);
        mat4.rotate(mvMatrix, mvMatrix, 0.4*Math.cos(2*xoff), [0.0, 0.0, 1.0]);
        mat4.rotate(mvMatrix, mvMatrix, xoff, [0.0, 1.0, 0.0]);
        
        //mat4.translate(mvMatrix, mvMatrix, [0, 0, 1.0]);
        
        //Bind Vertex Locations
        gl.bindBuffer(gl.ARRAY_BUFFER, modelVertexPositionBuffer);
        gl.vertexAttribPointer(shaderProgram.vertexPositionAttribute, modelVertexPositionBuffer.itemSize, gl.FLOAT, false, 0, 0);

        //Bind Normals
        gl.bindBuffer(gl.ARRAY_BUFFER, modelVertexNormalBuffer);
        gl.vertexAttribPointer(shaderProgram.vertexNormalAttribute, modelVertexNormalBuffer.itemSize, gl.FLOAT, false, 0, 0);

        //Bind Texture Face Coords
        gl.bindBuffer(gl.ARRAY_BUFFER, modelVertexTextureBuffer);
        gl.vertexAttribPointer(shaderProgram.textureCoordAttribute, modelVertexTextureBuffer.itemSize, gl.FLOAT, false, 0, 0);

        //Textures
        gl.activeTexture(gl.TEXTURE0);
        gl.bindTexture(gl.TEXTURE_2D, modelTexture);
        gl.uniform1i(shaderProgram.samplerUniform, 0);

        gl.activeTexture(gl.TEXTURE1);
        gl.bindTexture(gl.TEXTURE_2D, modelTexture2);
        gl.uniform1i(shaderProgram.samplerUniform2, 1);

        //Lighting
        gl.uniform3f(
            shaderProgram.ambientColorUniform,
            0.2,
            0.2,
            0.2
        );

        var lightingDirection = [
            0.3,
            0.3,
            0.3
        ];
        var adjustedLD = vec3.create();
        vec3.normalize(adjustedLD, lightingDirection);
        //vec3.scale(adjustedLD, -1);
        gl.uniform3fv(shaderProgram.lightingDirectionUniform, adjustedLD);

        gl.uniform3f(
            shaderProgram.directionalColorUniform,
            .8,
            .8,
            .8
        );

        gl.uniform3f(
            shaderProgram.lightPositionUniform,
            6.5,
            7.0,
            -3.0
        );
        
        //Bind Vertex Indicies and draw
        gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, modelVertexIndexBuffer);
        setMatrixUniforms();
        gl.drawElements(gl.TRIANGLES, modelVertexIndexBuffer.numItems, gl.UNSIGNED_SHORT, 0);
        mvPopMatrix();
    }
}
function customInvert43(matrix){
    var returnmat = mat3.create(); 
    mat3.fromMat4(returnmat, matrix);
    mat3.invert(returnmat, returnmat);
    return returnmat;
}


function webGLStart() {
    var canvas = document.getElementById("my-canvas");
    //canvas.width = $(window).width(); 
    //canvas.height = $(window).height()*.9; 
    initGL(canvas);
    initShaders();
    initBuffers();
    initScene();
    initTexture();
    getModelFromFile(modelURL);

    gl.clearColor(1.0, 1.0, 1.0, 1.0);
    gl.enable(gl.DEPTH_TEST);

    tick();
}
function tick(){
    animate();
    drawScene();
    requestAnimFrame(tick);
}

var lastTime = 0;
function animate() {
var timeNow = new Date().getTime();
    if (lastTime != 0) {
        var elapsed = timeNow - lastTime;
        xoff += (1 * elapsed) / 1000.0;
        //rSquare += (75 * elapsed) / 1000.0;
    }
    lastTime = timeNow;
}


var modelVertexPositionBuffer;
var modelVertexTextureBuffer;
var modelVertexIndexBuffer;
var modelVertexNormalBuffer;
var normalAccumilator;
function finishedModelDownload(data){
    //debugger;

    var text= String(data);
    var lines = text.split(/\n/);
    normalAccumilator = new Array();
    scene.vertices = new Array();
    for(var i =0; i < lines.length; i++){
        var line = lines[i];
        var lineElems = line.split(" ");
//            for(int i = 0; i < lineElems.length; i)
        for(var j = 0; j < lineElems.length; j++){
            if(lineElems[j] == ""){
                lineElems.splice(j,1);
                j--;
            }
        }
        /*for(var j = 0; j < lineElems.length; j++){
            lineElems[j] = lineElems[]
        }*/
        if(lineElems[0] == "v"){

            //var vertex = vec3.create();
            //vec3.set(vertex, parseFloat(lineElems[1]), parseFloat(lineElems[2]), parseFloat(lineElems[3]));
            //scene.vertices.push(vertex);
            scene.vertices.push(parseFloat(lineElems[1]));
            scene.vertices.push(parseFloat(lineElems[2]));
            scene.vertices.push(parseFloat(lineElems[3]));
            normalAccumilator.push(vec3.create());
        }
        else if(lineElems[0] == "f"){

            var tempFace;
            if(lineElems.length == 4){//triangle face
                tempFace = vec3.fromValues(parseInt(lineElems[1])-1,parseInt(lineElems[2])-1,parseInt(lineElems[3])-1);
            }
            if(lineElems.length == 5){//quad face, open gl only does traingle so convert quad
                tempFace = vec3.fromValues(lineElems[1],lineElems[2],lineElems[3]);
                tempFace = vec3.fromValues(lineElems[3],lineElems[4],lineElems[1]);
            }
            scene.faces.push(tempFace);
        }
    }
    //console.log(scene.faces);
    //console.log(normalAccumilator[0]);
    
    for(var i = 0; i < scene.faces.length; i++){
        var currFace = scene.faces[i];
        var vec12 = vec3.fromValues(
            scene.vertices[currFace[1]*3]-scene.vertices[currFace[0]*3],
            scene.vertices[currFace[1]*3+1]-scene.vertices[currFace[0]*3+1],
            scene.vertices[currFace[1]*3+2]-scene.vertices[currFace[0]*3+2]);
        var vec23 = vec3.fromValues(
            scene.vertices[currFace[2]*3]-scene.vertices[currFace[1]*3],
            scene.vertices[currFace[2]*3+1]-scene.vertices[currFace[1]*3+1],
            scene.vertices[currFace[2]*3+2]-scene.vertices[currFace[1]*3+2]);
        var cross12_23 = vec3.create();
        vec3.cross(cross12_23, vec12, vec23);
        //console.log(cross12_23);
        
        vec3.add(normalAccumilator[currFace[0]], normalAccumilator[currFace[0]], cross12_23);
        vec3.add(normalAccumilator[currFace[1]], normalAccumilator[currFace[1]], cross12_23);
        vec3.add(normalAccumilator[currFace[2]], normalAccumilator[currFace[2]], cross12_23);
    }
    for(var i = 0; i < normalAccumilator.length; i++){
        vec3.normalize(normalAccumilator[i],normalAccumilator[i]);
    }

    modelVertexNormalBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, modelVertexNormalBuffer);
    var vertexNormals = [];
    for(var i = 0; i < normalAccumilator.length; i++){
        vertexNormals.push(normalAccumilator[i][0]);
        vertexNormals.push(normalAccumilator[i][1]);
        vertexNormals.push(normalAccumilator[i][2]);
    }
    console.log(vertexNormals);
    console.log(vertexNormals.length);
    console.log(scene.vertices.length);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(vertexNormals), gl.STATIC_DRAW);
    modelVertexNormalBuffer.itemSize = 3;
    modelVertexNormalBuffer.numItems = normalAccumilator.length;


    modelVertexPositionBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, modelVertexPositionBuffer);

    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(scene.vertices), gl.STATIC_DRAW);
    modelVertexPositionBuffer.itemSize = 3;
    modelVertexPositionBuffer.numItems = scene.vertices.length/3;


    modelVertexTextureBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, modelVertexTextureBuffer);
    var textureCoords = [
      // Front face
      0.0, 0.9,
      0.1, 0.95,
      0.15, 1.0,
      0.2, 0.8,
      0.25, 0.85,
      0.3, 0.4,
      0.35, 0.5,
      0.4, 0.55,
      0.45, 0.33,
      0.5, 0.7,
      0.6, 0.45,
      0.65, 0.2,
      0.7, 0.75,
      0.75, 0.25,
      0.8, 0.1,
      0.85, 0.15,
      0.9, 0.05,
      0.95, 0.7,
      1.0, 0.67
    ];
    var texture = [];
    for(var i = 0; i < scene.vertices.length/3; i++){
        texture.push(textureCoords[i%textureCoords.length]);
        texture.push(textureCoords[i%textureCoords.length+1]);
    }
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(texture), gl.STATIC_DRAW);
    modelVertexTextureBuffer.itemSize = 2;
    modelVertexTextureBuffer.numItems = scene.vertices.length/3;


    modelVertexIndexBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, modelVertexIndexBuffer);
    var modelVertexIndices = [];
    for (var i = 0; i < scene.faces.length; i++) {
        var face = scene.faces[i];
        modelVertexIndices.push(face[0]);
        modelVertexIndices.push(face[1]);
        modelVertexIndices.push(face[2]);
    }
    gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint16Array(modelVertexIndices), gl.STATIC_DRAW);
    modelVertexIndexBuffer.itemSize = 1;
    modelVertexIndexBuffer.numItems = modelVertexIndices.length;


    modelLoaded = true;
    //drawScene();
}
function getModelFromFile(modelURL){
    $.get(modelURL, finishedModelDownload, 'text')
}

function face(_v1, _v2, _v3){
    this.v1 = parseInt(_v1);
    this.v2 = parseInt(_v2);
    this.v3 = parseInt(_v3);

    function setNormal(normal) {
        this.normal = normal;
    }
}
function initScene(){
    scene = new Object();
    scene.vertices = new Array();
    scene.faces = new Array();
}
function mvPushMatrix() {
    var copy = mat4.create();
    copy = mat4.clone(mvMatrix);
    //mat4.set(mvMatrix, copy);
    mvMatrixStack.push(copy);
}
function mvPopMatrix() {
    if (mvMatrixStack.length == 0) {
        throw "Invalid popMatrix!";
    }
    mvMatrix = mvMatrixStack.pop();
}
function render(a){
    var x = document.getElementById("selection").options[document.getElementById("selection").selectedIndex].value;
    var filename;
    if(x == 1) {
        filename = "teapot.obj";
    }
    else if(x == 2) {
        filename = "cow.obj";
    }
    else if(x == 3) {
        filename = "pumpkin.obj";
    }
    else if(x == 4) {
        filename = "teddy.obj";
    }
    else if(x == 5) {
        filename = "airplane2.obj";
    }
    var canvas = document.getElementById("my-canvas");
    initGL(canvas);
    initShaders();
    initBuffers();
    initScene();
    initTexture();
    modelLoaded = false;
    getModelFromFile(filename);
}