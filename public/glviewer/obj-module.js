var gl;
var scene;
var xoff = 0;
var yoff = 0;
var mvMatrixStack = [];

var triangleVertexPositionBuffer;
var squareVertexPositionBuffer;

var modelLoaded = false;
var modelTextureLoaded = false;
var modelTexture2Loaded = false;

var zoom = -8;




/***************************************************************/
/*---------------------------SHADERS---------------------------*/
/***************************************************************/

function getShader(gl, id) {
    var shaderScript, theSource, currentChild, shader;

    shaderScript = document.getElementById(id);

    if (!shaderScript) {
        return null;
    }

    theSource = "";
    currentChild = shaderScript.firstChild;

    while(currentChild) {
        if (currentChild.nodeType == currentChild.TEXT_NODE) {
            theSource += currentChild.textContent;
        }

        currentChild = currentChild.nextSibling;
    }

    var shader;
    if (shaderScript.type == "x-shader/x-fragment") {
        shader = gl.createShader(gl.FRAGMENT_SHADER);
    } else if (shaderScript.type == "x-shader/x-vertex") {
        shader = gl.createShader(gl.VERTEX_SHADER);
    } else {
        return null;
    }

    gl.shaderSource(shader, theSource);
    gl.compileShader(shader);

    if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
        alert(gl.getShaderInfoLog(shader));
        return null;
    }

    return shader;
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
        alert("shaders not linked!");
    }

    gl.useProgram(shaderProgram);

    shaderProgram.vertexPositionAttribute = gl.getAttribLocation(shaderProgram, "aVertexPosition");
    gl.enableVertexAttribArray(shaderProgram.vertexPositionAttribute);

    shaderProgram.vertexNormalAttribute = gl.getAttribLocation(shaderProgram, "aVertexNormal");
    gl.enableVertexAttribArray(shaderProgram.vertexNormalAttribute);
/*
    shaderProgram.textureCoordAttribute = gl.getAttribLocation(shaderProgram, "aTextureCoord");
    gl.enableVertexAttribArray(shaderProgram.textureCoordAttribute);

    */
    shaderProgram.pMatrixUniform = gl.getUniformLocation(shaderProgram, "uPMatrix");
    shaderProgram.mvMatrixUniform = gl.getUniformLocation(shaderProgram, "uMVMatrix");
    shaderProgram.nMatrixUniform = gl.getUniformLocation(shaderProgram, "uNMatrix");

    shaderProgram.ambientColorUniform = gl.getUniformLocation(shaderProgram, "uAmbientColor");
    shaderProgram.lightPositionUniform = gl.getUniformLocation(shaderProgram, "lightPosition");
}




/***************************************************************/
/*---------------------------DRAWING---------------------------*/
/***************************************************************/

var mvMatrix = mat4.create();
var pMatrix = mat4.create();

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

function customInvert43(matrix){
    var returnmat = mat3.create(); 
    mat3.fromMat4(returnmat, matrix);
    mat3.invert(returnmat, returnmat);
    return returnmat;
}

function setMatrixUniforms() {
    gl.uniformMatrix4fv(shaderProgram.pMatrixUniform, false, pMatrix);
    gl.uniformMatrix4fv(shaderProgram.mvMatrixUniform, false, mvMatrix);

    var normalMatrix = mat3.create();
    normalMatrix = customInvert43(mvMatrix);
    //mat4.toInverseMat3(mvMatrix, normalMatrix);
    mat3.transpose(normalMatrix, normalMatrix);
    gl.uniformMatrix3fv(shaderProgram.nMatrixUniform, false, normalMatrix);
}


function drawScene() {
    gl.viewport(0, 0, gl.viewportWidth, gl.viewportHeight);
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

    mat4.perspective(pMatrix, 45, gl.viewportWidth / gl.viewportHeight, 0.1, 1000.0);


    mat4.identity(mvMatrix);
    mat4.translate(mvMatrix, mvMatrix, [0, 0.0, zoom]);


    if(modelLoaded){
        mvPushMatrix();
        mat4.rotate(mvMatrix, mvMatrix, xoff, [0.0, 1.0, 0.0]);
        mat4.rotate(mvMatrix, mvMatrix, yoff, [1.0, 0.0, 0.0]);
        mat4.translate(mvMatrix, mvMatrix, [-center[0], -center[1], -center[2]]);

        
        //Bind Vertex Locations
        gl.bindBuffer(gl.ARRAY_BUFFER, modelVertexPositionBuffer);
        gl.vertexAttribPointer(shaderProgram.vertexPositionAttribute, modelVertexPositionBuffer.itemSize, gl.FLOAT, false, 0, 0);

        //Bind Normals
        gl.bindBuffer(gl.ARRAY_BUFFER, modelVertexNormalBuffer);
        gl.vertexAttribPointer(shaderProgram.vertexNormalAttribute, modelVertexNormalBuffer.itemSize, gl.FLOAT, false, 0, 0);

        gl.uniform3f(
            shaderProgram.ambientColorUniform,
            0.0,
            0.0,
            0.0
        );


        gl.uniform3f(
            shaderProgram.lightPositionUniform,
            9.5,
            7.0,
            -40.0
        );
        
        //Bind Vertex Indicies and draw
        gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, modelVertexIndexBuffer);
        setMatrixUniforms();
        gl.drawElements(gl.TRIANGLES, modelVertexIndexBuffer.numItems, gl.UNSIGNED_SHORT, 0);
        mvPopMatrix();
    }
}




/***************************************************************/
/*------------------------INITALIZATION------------------------*/
/***************************************************************/

function initGL(canvas) {
    try {
        var _canvas = document.getElementById("my-canvas");
        gl = _canvas.getContext("webgl", {preserveDrawingBuffer: true});
        console.log("w: " + canvas.width);
        console.log("h: " + canvas.height);
        gl.viewportWidth = canvas.width;
        gl.viewportHeight = canvas.height;
    } catch (e) {
        console.log("asdffdsa");
    }
    //debugger;
    if (!gl) {
        alert("Could not initialise WebGL, sorry :-(  Try Chrome?");
    }
}

function webGLStart() {
    var canvas = document.getElementById("my-canvas");
    initGL(canvas);
    initShaders();
    initScene();
    initMouseGestures();
    getModelFromFile(modelURL, canvas);


    gl.clearColor(1.0, 1.0, 1.0, 1.0);
    gl.enable(gl.DEPTH_TEST);

    tick();
}

function initScene(){
    scene = new Object();
    scene.vertices = new Array();
    scene.faces = new Array();
}

function initMouseGestures() {
    var mousedown = false;
    var canvas = $('#my-canvas');
    var coord = {x:0, y:0};
    document.getElementById("my-canvas").addEventListener('mousewheel', onMouseWheel, false);
    canvas.mousedown(function(event){
        console.log(event);
        mousedown = true;
        coord.x = event.offsetX;
        coord.y = event.offsetY;
    });
    canvas.mouseup(function(){
        mousedown = false;
    });
    canvas.mouseout(function(){
        mousedown = false;
    });
    canvas.mousemove(function(event){
        console.log(mousedown);
        if(mousedown){
            var xdiff = event.offsetX - coord.x;
            var ydiff = event.offsetY - coord.y;
            coord.y = event.offsetY;
            coord.x = event.offsetX;
            xoff += .01*xdiff;
            yoff += .01*ydiff;
            //zoom += .1*ydiff;
        }

    });
}


function onMouseWheel(event) {
    event.preventDefault();
    zoom += .005*event.wheelDeltaY;
}


/***************************************************************/
/*---------------------------RUNNING---------------------------*/
/***************************************************************/

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
        //xoff += (1 * elapsed) / 1000.0;
        //rSquare += (75 * elapsed) / 1000.0;
    }
    lastTime = timeNow;
}


/***************************************************************/
/*------------------------MODEL PARSING------------------------*/
/***************************************************************/


var modelVertexPositionBuffer;
var modelVertexTextureBuffer;
var modelVertexIndexBuffer;
var modelVertexNormalBuffer;
var normalAccumilator;
var avex = 0;
var avey = 0;
var avez = 0;
var max_min_x = [0,0];
var max_min_y = [0,0];
var max_min_z = [0,0];

var center;

function maxmin(x, y, z){
    if(x < max_min_x[0]){
        max_min_x[0] = x;
    }
    if(x > max_min_x[1]){
        max_min_x[1] = x;
    }
    if(y < max_min_y[0]){
        max_min_y[0] = y;
    }
    if(y > max_min_y[1]){
        max_min_y[1] = y;
    }
    if(z < max_min_z[0]){
        max_min_z[0] = z;
    }
    if(z > max_min_z[1]){
        max_min_z[1] = z;
    }
}
function finishedModelDownload(data){
    //debugger;

    var text= String(data);
    var lines = text.split(/\n/);
    normalAccumilator = new Array();
    scene.vertices = new Array();
    console.log("start parsing");


    for(var i =0; i < lines.length; i++){

        var line = lines[i].trim();

        if(line[0] == "v" && line[1] == " "){
            //found vertex
            var elems = line.split(/\s+/g);
            if(elems.length > 4){
                console.log("bad vertex? " + line);
            }else{
                var v1 = parseFloat( elems[ 1 ] );
                var v2 = parseFloat( elems[ 2 ] );
                var v3 = parseFloat( elems[ 3 ] );
                avex += v1;
                avey += v2;
                avez += v3;
                maxmin(v1,v2,v3);
                scene.vertices.push(v1);
                scene.vertices.push(v2);
                scene.vertices.push(v3);
                normalAccumilator.push(vec3.create());
            }
        }
        else if(line[0] == "f" && line[1] == " "){
            var elems = line.split(/\s+/g);
            if(elems.length < 4){
                console.log("face was messed up: " + line);
            }
            var numFaces = elems.length - 2;
            for(var j = 1; j < numFaces; j++){
                var a = parseInt( elems[1].split("/")[0] )-1;
                var b = parseInt( elems[j+1].split("/")[0] )-1;
                var c = parseInt( elems[j+2].split("/")[0] )-1;
                tempFace = vec3.fromValues(a,b,c);
                scene.faces.push(tempFace);
            }
        }
    }
    avex = avex / scene.vertices.length;
    avey = avey / scene.vertices.length;
    avez = avez / scene.vertices.length;

    center = [(max_min_x[1] + max_min_x[0])/2,(max_min_y[1] + max_min_y[0])/2,(max_min_z[1] + max_min_z[0])/2];

    console.log("finished parsing");
    console.log(scene.vertices.length);
    console.log(scene.faces.length);
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
    var loader = $('#loaderbar').width(1);
    var canvas = $('#my-canvas');
    console.log("getting file from url: " + modelURL);
    $.ajax({
        url: modelURL,
        type: "GET",
        dataType: "text/html",
        success: function() { console.log("hello?")},
        complete: function(data) {
            $('#loaderbar').width(canvas.width()).animate({
                height: '0px',
                opacity: '0'
                }, 500);
            finishedModelDownload(data.responseText);
            console.log("here?");
        },
        xhr: function(){
            var xhr = new window.XMLHttpRequest();
            xhr.addEventListener("progress", function(evt){
                if (evt.lengthComputable) {  
                    var percentComplete = evt.loaded / evt.total;
                    console.log(percentComplete+"%");
                    loader.width(canvas.width()*percentComplete);
                }
            }, false);
            return xhr;
        }
    });
}


function face(_v1, _v2, _v3){
    this.v1 = parseInt(_v1);
    this.v2 = parseInt(_v2);
    this.v3 = parseInt(_v3);

    function setNormal(normal) {
        this.normal = normal;
    }
}

function goFullScreen(){
    var canvas = document.getElementById("my-canvas");
    console.log(canvas);
    if(canvas.requestFullScreen)
        canvas.requestFullScreen();
    else if(canvas.webkitRequestFullScreen)
        canvas.webkitRequestFullScreen();
    else if(canvas.mozRequestFullScreen)
        canvas.mozRequestFullScreen();
}
