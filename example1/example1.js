"use strict";

var gl;
let canvas;
let mvMatrix ;
let mvMatrixLoc;
let pMatrix;
let pMatrixLoc;
let colorLoc;
let normalLoc;
let program;


let vertices= [];
let cubeVertexIndices =[];
let normalsArray = [];

let scaleValue = 1.0;

let translateX = 0.0;
let theta = [0,0,0];


let x = 0;
let y = 0; 
let z = 0;

let eye =[0.0 , 0.0, -2.0];
let at = [0,0,0];
let up = [0,1,0] ;
let fovy = 45;
let aspect;
let near = 0.1;
let far  = 1000.0;

let lightPosition = vec4(1.0, 1.0, 1.0, 0.0 );

let lightAmbient = vec4(0.2, 0.2, 0.2, 1.0 ); 
let lightDiffuse = vec4( 1.0, 1.0, 1.0, 1.0 ); 
let lightSpecular = vec4( 1.0, 1.0, 1.0, 1.0 ); 

let materialAmbient = vec4( 1.0, 1.0, 1.0, 1.0 ); 
let materialDiffuse = vec4( 1.0, 0.8, 0.0, 1.0); 
let materialSpecular = vec4( 1.0, 0.8, 0.0, 1.0 ); 
let materialShininess = 100.0;

let moveX = 0.0;
let moveY = 0.0;
let offsetX = 0.0;
let offsetY = 0.0; 
let isDown = false;

window.onload = function init()
{
    canvas = document.getElementById( "gl-canvas" );
    const ROTATE_X_PLUS = document.querySelector(".rotateX_plus");
    const ROTATE_Y_PLUS = document.querySelector(".rotateY_plus");
    const ROTATE_Z_PLUS = document.querySelector(".rotateZ_plus");
    const SCALE_PLUS = document.querySelector(".scale_plus");

    const ROTATE_X_MINUS = document.querySelector(".rotateX_minus");
    const ROTATE_Y_MINUS = document.querySelector(".rotateY_minus");
    const ROTATE_Z_MINUS = document.querySelector(".rotateZ_minus");
    const SCALE_MINUS = document.querySelector(".scale_minus");

    const TRANSLATE_PLUS = document.querySelector(".translate_plus");
    const TRANSLATE_MINUS = document.querySelector(".translate_minus");

    const TOP_VIEW = document.querySelector(".top_view");
    const FRONT_VIEW = document.querySelector(".front_view");
    const SIDE_VIEW = document.querySelector(".side_view");

    const LIGHT_X = document.querySelector(".light_x");
    const LIGHT_Y = document.querySelector(".light_y");


    gl = WebGLUtils.setupWebGL( canvas );
    if ( !gl ) { alert( "WebGL isn't available" ); }

    gl.viewport( 0, 0, canvas.width, canvas.height );
    gl.clearColor( 1.0, 1.0, 1.0, 1.0 );

    makeJ();
    makeD();
    makeG();

    program = initShaders( gl, "vertex-shader", "fragment-shader" );
    gl.useProgram(program);
    gl.enable(gl.DEPTH_TEST);
    
    // vertices를 gpu에 전달
    var bufferId = gl.createBuffer();
    gl.bindBuffer( gl.ARRAY_BUFFER, bufferId );
    gl.bufferData( gl.ARRAY_BUFFER, flatten(vertices), gl.STATIC_DRAW );

    // cubeVertexIndices를 gpu에 전달
    let cubeVerticesIndexBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, cubeVerticesIndexBuffer);
    gl.bufferData(
        gl.ELEMENT_ARRAY_BUFFER,
        new Uint16Array(cubeVertexIndices),
        gl.STATIC_DRAW,
      );

    let vPosition = gl.getAttribLocation( program, "vPosition" );
    gl.vertexAttribPointer( vPosition, 3, gl.FLOAT, false, 0, 0 );
    gl.enableVertexAttribArray( vPosition );

    pMatrixLoc = gl.getUniformLocation(program, "projection");
    mvMatrixLoc = gl.getUniformLocation(program, "modelView");
    colorLoc = gl.getUniformLocation(program, "uColor");

    // normal 벡터 데이터를 버퍼에 전달
    let normalBuffer = gl.createBuffer();
    gl.bindBuffer( gl.ARRAY_BUFFER, normalBuffer );
    gl.bufferData( gl.ARRAY_BUFFER, flatten(normalsArray), gl.STATIC_DRAW );

    // 법선 속성을 활성화
    normalLoc = gl.getAttribLocation( program, "vNormal" );
    gl.vertexAttribPointer( normalLoc, 3, gl.FLOAT, false, 0, 0 );
    gl.enableVertexAttribArray( normalLoc );
    
    ROTATE_X_PLUS.addEventListener("click",function(event){
        theta[0]  += 5.0;  
        render();
    });

    ROTATE_Y_PLUS.addEventListener("click",function(event){
        theta[1]  += 5.0; 
        
        render();
    });
    ROTATE_Z_PLUS.addEventListener("click",function(event){
        theta[2]  +=  5.0;
        render();
    });

    SCALE_PLUS.addEventListener("click",function(event){
        scaleValue += 0.2; 
        render();
    });

    ROTATE_X_MINUS.addEventListener("click",function(event){
        theta[0]  -= 5.0;  
        render();
    });

    ROTATE_Y_MINUS.addEventListener("click",function(event){
        theta[1]  -= 5.0; 
        
        render();
    });
    ROTATE_Z_MINUS.addEventListener("click",function(event){
        theta[2]  -=  5.0;
        render();
    });

    SCALE_MINUS.addEventListener("click",function(event){
        if(scaleValue > 0.2){
            scaleValue -= 0.2; 

        }
        render();
    }); 

    TRANSLATE_PLUS.addEventListener("click",function(event){
        translateX += 1.0;
        console.log(translateX);
        render();
    });

    TRANSLATE_MINUS.addEventListener("click",function(event){
            translateX -= 1.0;        
        render();
    });

   
    TOP_VIEW.addEventListener('click',function(){
        eye[0] = 0.0;
        eye[1] = 2.0;
        render();
    });

    FRONT_VIEW.addEventListener('click',function(){
        eye[0] = 0.0;
        eye[1] = 0.0;
        render();
    });

    SIDE_VIEW.addEventListener('click',function(){
        eye[0] = 2.0;
        eye[1] = 0.0;
        render();
    });

    LIGHT_X.addEventListener('click',function(){
        lightPosition[0] *= -1;
        render();
    });

    LIGHT_Y.addEventListener('click',function(){
        lightPosition[1] *= -1;
        render();
    });

    document.addEventListener('pointerdown' , onDown,false);
    document.addEventListener('pointerup' ,onUp,false);
    document.addEventListener('pointermove' ,onMove,false);
    render();
};


function render() {
    gl.clear( gl.COLOR_BUFFER_BIT );

    eye[0] = eye[0] + moveX * 0.01;
    eye[1] = eye[1] + moveY * 0.01;

    if(eye[0] > 2){
        eye[0] = 2;
    }
    else if(eye[0] < -2){
        eye[0] = -2;
    }

    if(eye[1] > 2){
        eye[1] = 2;
    }
    else if(eye[1] < -2){
        eye[1] = -2;
    }

    let scaleMatrix = scalem(scaleValue, scaleValue, scaleValue);
    let translateMatrix = translate(translateX , 0,0);
    mvMatrix = lookAt(eye,at,up);

    mvMatrix = mult(mvMatrix,rotateX(theta[0]));
    mvMatrix = mult(mvMatrix,rotateY(theta[1]));
    mvMatrix = mult(mvMatrix,rotateZ(theta[2]));
    mvMatrix = mult(mvMatrix,scaleMatrix);
    mvMatrix = mult(mvMatrix, translateMatrix);
    
    pMatrix = perspective(45,canvas.width / canvas.height , near, far);

    gl.uniformMatrix4fv(mvMatrixLoc, false , flatten(mvMatrix));
    gl.uniformMatrix4fv(pMatrixLoc, false , flatten(pMatrix));

    let ambientProduct = mult(lightAmbient, materialAmbient);
    let diffuseProduct = mult(lightDiffuse, materialDiffuse);
    let specularProduct = mult(lightSpecular, materialSpecular);

    gl.uniform4fv(gl.getUniformLocation(program,"ambientProduct"), flatten(ambientProduct));
    gl.uniform4fv(gl.getUniformLocation(program,"diffuseProduct"), flatten(diffuseProduct));
    gl.uniform4fv(gl.getUniformLocation(program,"specularProduct"), flatten(specularProduct));
    gl.uniform4fv(gl.getUniformLocation(program,"lightPosition"), flatten(lightPosition));
    
    gl.uniform1f(gl.getUniformLocation(program, "shininess"),materialShininess);
    
    gl.uniform4f(colorLoc, 0.2,1.0,0.2 , 1);
    gl.drawElements(gl.TRIANGLES, cubeVertexIndices.length, gl.UNSIGNED_SHORT, 0);
}


function makeJ(){
    
    //J top front
    vertices.push(vec3(0.8,0.4,0.0)); // 0
    vertices.push(vec3(0.8,0.5,0.0)); // 1 
    vertices.push(vec3(0.4,0.5,0.0)); // 2
    vertices.push(vec3(0.4,0.4,0.0)); // 3

    // J top back
    vertices.push(vec3(0.8,0.4,0.3)); // 4
    vertices.push(vec3(0.8,0.5,0.3)); // 5
    vertices.push(vec3(0.4,0.5,0.3)); // 6
    vertices.push(vec3(0.4,0.4,0.3)); // 7

    // J mid front
    vertices.push(vec3(0.6,0.0,0.0)); //8 
    vertices.push(vec3(0.6,0.4,0.0)); //9 
    vertices.push(vec3(0.5,0.4,0.0)); // 10
    vertices.push(vec3(0.5,0.0,0.0)); // 11

    // J mid back
    vertices.push(vec3(0.6,0.0,0.3)); // 12
    vertices.push(vec3(0.6,0.4,0.3)); // 13
    vertices.push(vec3(0.5,0.4,0.3)); // 14
    vertices.push(vec3(0.5,0.0,0.3)); // 15

    // J bottom front
    vertices.push(vec3(0.8,-0.1,0.0)); // 16
    vertices.push(vec3(0.8,0.0,0.0)); // 17
    vertices.push(vec3(0.5,-0.1,0.0)); // 18

    // J bottom back
    vertices.push(vec3(0.8,-0.1,0.3)); // 19
    vertices.push(vec3(0.8,0.0,0.3)); // 20
    vertices.push(vec3(0.5,-0.1,0.3)); // 21


    // J top front
    cubeVertexIndices.push(0,1,2);
    cubeVertexIndices.push(0,3,2);

    // J top top
    cubeVertexIndices.push(1,5,6);
    cubeVertexIndices.push(1,2,6);

    // J top back
    cubeVertexIndices.push(4,5,6);
    cubeVertexIndices.push(4,7,6);

    // J top right 
    cubeVertexIndices.push(3,2,6);
    cubeVertexIndices.push(3,7,6);

    // J top left
    cubeVertexIndices.push(0,1,5);
    cubeVertexIndices.push(0,4,5);

    // J top bottom left
    cubeVertexIndices.push(0,4,13);
    cubeVertexIndices.push(0,9,13);

    // J top bottom right
    cubeVertexIndices.push(10,14,7);
    cubeVertexIndices.push(10,3,7);


    // J mid front
    cubeVertexIndices.push(8,9,10);
    cubeVertexIndices.push(8,11,10);

    //J mid right
    cubeVertexIndices.push(11,10,14);
    cubeVertexIndices.push(11,15,14);

    // J mid back
    cubeVertexIndices.push(12,15,14);
    cubeVertexIndices.push(12,13,14);

    // J mid left
    cubeVertexIndices.push(8,12,13);
    cubeVertexIndices.push(8,9,13);


    // J bottom front
    cubeVertexIndices.push(16,17,11);
    cubeVertexIndices.push(16,18,11);

    // J bottom right
    cubeVertexIndices.push(11,15,21);
    cubeVertexIndices.push(11,18,21);

    // J bottom back
    cubeVertexIndices.push(19,20,15);
    cubeVertexIndices.push(19,21,15);

    // J bottom left
    cubeVertexIndices.push(16,17,20);
    cubeVertexIndices.push(16,19,20);

    // J bottom top
    cubeVertexIndices.push(17,20,15);
    cubeVertexIndices.push(17,11,15);

     // J bottom bottom
     cubeVertexIndices.push(16,19,21);
     cubeVertexIndices.push(16,18,21);


    /// noraml : J top 
    // J top front
    normalsArray.push(0,0,1);
    normalsArray.push(0,0,1);
    normalsArray.push(0,0,1);
    normalsArray.push(0,0,1);
    normalsArray.push(0,0,1);
    normalsArray.push(0,0,1);

    // J top top
    normalsArray.push(0,1,0);
    normalsArray.push(0,1,0);
    normalsArray.push(0,1,0);
    normalsArray.push(0,1,0);
    normalsArray.push(0,1,0);
    normalsArray.push(0,1,0);

    // J top back
    normalsArray.push(0,0,-1);
    normalsArray.push(0,0,-1);
    normalsArray.push(0,0,-1);
    normalsArray.push(0,0,-1);
    normalsArray.push(0,0,-1);
    normalsArray.push(0,0,-1);

    // J top right 
    normalsArray.push(-1,0,0);
    normalsArray.push(-1,0,0);
    normalsArray.push(-1,0,0);
    normalsArray.push(-1,0,0);
    normalsArray.push(-1,0,0);
    normalsArray.push(-1,0,0);

    // J top left
    normalsArray.push(1,0,0);
    normalsArray.push(1,0,0);
    normalsArray.push(1,0,0);
    normalsArray.push(1,0,0);
    normalsArray.push(1,0,0);
    normalsArray.push(1,0,0);

    // J top bottom left    
    normalsArray.push(0,-1,0);
    normalsArray.push(0,-1,0);
    normalsArray.push(0,-1,0);
    normalsArray.push(0,-1,0);
    normalsArray.push(0,-1,0);
    normalsArray.push(0,-1,0);

    // J top bottom right
    normalsArray.push(0,-1,0);
    normalsArray.push(0,-1,0);
    normalsArray.push(0,-1,0);
    normalsArray.push(0,-1,0);
    normalsArray.push(0,-1,0);
    normalsArray.push(0,-1,0);


     // J mid front
    normalsArray.push(0,0,1);
    normalsArray.push(0,0,1);
    normalsArray.push(0,0,1);
    normalsArray.push(0,0,1);
    normalsArray.push(0,0,1);
    normalsArray.push(0,0,1);
 
     // J mid right
     normalsArray.push(-1,0,0);
     normalsArray.push(-1,0,0);
     normalsArray.push(-1,0,0);
     normalsArray.push(-1,0,0);
     normalsArray.push(-1,0,0);
     normalsArray.push(-1,0,0); 
 
     // J mid back
    normalsArray.push(0,0,-1);
    normalsArray.push(0,0,-1);
    normalsArray.push(0,0,-1);
    normalsArray.push(0,0,-1);
    normalsArray.push(0,0,-1);
    normalsArray.push(0,0,-1);
 
     // J mid left
     normalsArray.push(1,0,0);
     normalsArray.push(1,0,0);
     normalsArray.push(1,0,0);
     normalsArray.push(1,0,0);
     normalsArray.push(1,0,0);
     normalsArray.push(1,0,0);

      // J bottom front
    normalsArray.push(0,0,1);
    normalsArray.push(0,0,1);
    normalsArray.push(0,0,1);
    normalsArray.push(0,0,1);
    normalsArray.push(0,0,1);
    normalsArray.push(0,0,1);
 
     // J bottom right
     normalsArray.push(-1,0,0);
     normalsArray.push(-1,0,0);
     normalsArray.push(-1,0,0);
     normalsArray.push(-1,0,0);
     normalsArray.push(-1,0,0);
     normalsArray.push(-1,0,0); 
 
     // J bottom back
    normalsArray.push(0,0,-1);
    normalsArray.push(0,0,-1);
    normalsArray.push(0,0,-1);
    normalsArray.push(0,0,-1);
    normalsArray.push(0,0,-1);
    normalsArray.push(0,0,-1);
 
     // J bottom left
     normalsArray.push(1,0,0);
     normalsArray.push(1,0,0);
     normalsArray.push(1,0,0);
     normalsArray.push(1,0,0);
     normalsArray.push(1,0,0);
     normalsArray.push(1,0,0);


      // J bottom top
    normalsArray.push(0,1,0);
    normalsArray.push(0,1,0);
    normalsArray.push(0,1,0);
    normalsArray.push(0,1,0);
    normalsArray.push(0,1,0);
    normalsArray.push(0,1,0);


    // J bottom bottom
    normalsArray.push(0,-1,0);
    normalsArray.push(0,-1,0);
    normalsArray.push(0,-1,0);
    normalsArray.push(0,-1,0);
    normalsArray.push(0,-1,0);
    normalsArray.push(0,-1,0);
}


function makeD(){

    // D left front
    vertices.push(vec3(0.0,-0.1,0.0)); // 22
    vertices.push(vec3(0.0,0.5,0.0)); // 23
    vertices.push(vec3(-0.1,0.5,0.0)); // 24
    vertices.push(vec3(-0.1,-0.1,0.0)); //25

    // D left back
    vertices.push(vec3(0.0,-0.1,0.3)); //26 
    vertices.push(vec3(0.0,0.5,0.3)); //27 
    vertices.push(vec3(-0.1,0.5,0.3)); //28
    vertices.push(vec3(-0.1,-0.1,0.3)); // 29

    // D left right
    vertices.push(vec3(-0.1,0.0,0.0)); //30
    vertices.push(vec3(-0.1,0.4,0.0)); // 31
    vertices.push(vec3(-0.1,0.4,0.3)); // 32
    vertices.push(vec3(-0.1,0.0,0.3)); //33

    // D right front
    vertices.push(vec3(-0.3,0.1,0.0)); // 34
    vertices.push(vec3(-0.3,0.3,0.0)); // 35
    vertices.push(vec3(-0.4,0.3,0.0)); //36
    vertices.push(vec3(-0.4,0.1,0.0)); // 37

    // D right back
    vertices.push(vec3(-0.3,0.1,0.3)); // 38
    vertices.push(vec3(-0.3,0.3,0.3)); // 39
    vertices.push(vec3(-0.4,0.3,0.3)); //40
    vertices.push(vec3(-0.4,0.1,0.3)); // 41




    // D left front
    cubeVertexIndices.push(22,23,24);
    cubeVertexIndices.push(22,25,24);
    pushNormFront();

    // D left right
    cubeVertexIndices.push(30,31,32);
    cubeVertexIndices.push(30,33,32);
    pushNormRight();

    // D left back
    cubeVertexIndices.push(26,27,28);
    cubeVertexIndices.push(26,29,28);
    pushNormBack();

    // D left left
    cubeVertexIndices.push(22,23,27);
    cubeVertexIndices.push(22,26,27);
    pushNormLeft();

    // D left top
    cubeVertexIndices.push(23,27,28);
    cubeVertexIndices.push(23,24,28);
    pushNormTop();

    // D left bottom
    cubeVertexIndices.push(22,26,29);
    cubeVertexIndices.push(22,25,29);
    pushNormBottom();

    // D right front
    cubeVertexIndices.push(34,35,36);
    cubeVertexIndices.push(34,37,36);
    pushNormFront();

    // D right right
    cubeVertexIndices.push(37,36,40);
    cubeVertexIndices.push(37,41,40);
    quad(36,37,41);

    // D right back
    cubeVertexIndices.push(38,39,40);
    cubeVertexIndices.push(38,41,40);
    quad(40,41,38);

    // D right left
    cubeVertexIndices.push(34,35,39);
    cubeVertexIndices.push(34,38,39);
    quad(39,38,34);
    
    // D mid top front
    cubeVertexIndices.push(31,24,36);
    cubeVertexIndices.push(31,35,36);
    pushNormFront();


    // D mid top back
    cubeVertexIndices.push(32,28,40);
    cubeVertexIndices.push(32,39,40);
    pushNormBack();

    // D mid top top
    cubeVertexIndices.push(24,28,40);
    cubeVertexIndices.push(24,36,40);
    quad(28,24,36);

    // D mid top bottom
    cubeVertexIndices.push(31,32,39);
    cubeVertexIndices.push(31,35,39);
    quad(31,32,39);



    // D mid 2nd front
    cubeVertexIndices.push(30,34,37);
    cubeVertexIndices.push(30,25,37);
    pushNormFront();


    // D mid 2nd back
    cubeVertexIndices.push(33,38,41);
    cubeVertexIndices.push(33,29,41);
    pushNormBack();

    // D mid 2nd top
    cubeVertexIndices.push(30,33,38);
    cubeVertexIndices.push(30,34,38);
    quad(34,38,33);

    // D mid 2nd bottom
    cubeVertexIndices.push(25,29,41);
    cubeVertexIndices.push(25,37,41);
    quad(25,29,41);
}


function makeG(){

    // G left front
    vertices.push(vec3(-0.6,-0.1,0.0)); // 42
    vertices.push(vec3(-0.6,0.5,0.0)); // 43
    vertices.push(vec3(-0.7,0.5,0.0)); // 44
    vertices.push(vec3(-0.7,-0.1,0.0)); // 45

    // G left back
    vertices.push(vec3(-0.6,-0.1,0.3)); //46
    vertices.push(vec3(-0.6,0.5,0.3)); // 47
    vertices.push(vec3(-0.7,0.5,0.3)); // 48
    vertices.push(vec3(-0.7,-0.1,0.3)); //49


    // G top front
    vertices.push(vec3(-0.7,0.4,0.0)); //50
    vertices.push(vec3(-1.0,0.5,0.0)); // 51
    vertices.push(vec3(-1.0,0.4,0.0)); // 52

    // G top back
    vertices.push(vec3(-0.7,0.4,0.3)); //53
    vertices.push(vec3(-1.0,0.5,0.3)); // 54
    vertices.push(vec3(-1.0,0.4,0.3)); // 55

    // G bottom front
    vertices.push(vec3(-0.7,0.0,0.0)); // 56
    vertices.push(vec3(-1.0,0.0,0.0)); // 57
    vertices.push(vec3(-1.0,-0.1,0.0)); //58

    // G bottom back
    vertices.push(vec3(-0.7,0.0,0.3)); // 59
    vertices.push(vec3(-1.0,0.0,0.3)); // 60
    vertices.push(vec3(-1.0,-0.1,0.3)); // 61

    vertices.push(vec3(-0.9,0.0,0.0)); // 62
    vertices.push(vec3(-0.9,0.1,0.0)); // 63
    vertices.push(vec3(-1.0,0.1,0.0)); // 64

    vertices.push(vec3(-0.9,0.0,0.3)); // 65
    vertices.push(vec3(-0.9,0.1,0.3)); // 66
    vertices.push(vec3(-1.0,0.1,0.3)); // 67

    vertices.push(vec3(-0.8,0.1,0.0)); // 68
    vertices.push(vec3(-0.8,0.2,0.0)); // 69
    vertices.push(vec3(-1.0,0.2,0.0)); // 70

    vertices.push(vec3(-0.8,0.1,0.3)); // 71
    vertices.push(vec3(-0.8,0.2,0.3)); // 72
    vertices.push(vec3(-1.0,0.2,0.3)); // 73


    // G left front
    cubeVertexIndices.push(42,43,44);
    cubeVertexIndices.push(42,45,44);
    pushNormFront();
    
    // G left back
    cubeVertexIndices.push(46,47,48);
    cubeVertexIndices.push(46,49,48);
    pushNormBack();

    //G left left
    cubeVertexIndices.push(42,43,47);
    cubeVertexIndices.push(42,46,47);
    pushNormLeft();

    //G left Right
    cubeVertexIndices.push(50,53,59);
    cubeVertexIndices.push(50,56,59);
    pushNormRight();

    // G top front
    cubeVertexIndices.push(50,44,51);
    cubeVertexIndices.push(50,52,51);
    pushNormFront();

    // G top back
    cubeVertexIndices.push(48,53,55);
    cubeVertexIndices.push(48,54,55);
    pushNormBack();

    // G top right
    cubeVertexIndices.push(51,54,55);
    cubeVertexIndices.push(51,52,55);
    pushNormRight();
   
    // G top top
    cubeVertexIndices.push(43,47,54);
    cubeVertexIndices.push(43,51,54);
    pushNormTop();

    // G top bottom
    cubeVertexIndices.push(50,53,55);
    cubeVertexIndices.push(50,52,55);
    pushNormBottom();


    // G bottom
    cubeVertexIndices.push(56,58,57);
    cubeVertexIndices.push(56,58,45);
    pushNormFront();

    cubeVertexIndices.push(49,59,60);
    cubeVertexIndices.push(49,61,60);
    pushNormBack();

    cubeVertexIndices.push(58,57,60);
    cubeVertexIndices.push(58,61,60);
    pushNormRight();

    cubeVertexIndices.push(42,61,46);
    cubeVertexIndices.push(42,61,58);
    pushNormBottom();


    // G mid  front
    cubeVertexIndices.push(62,63,64);
    cubeVertexIndices.push(62,57,64);
    pushNormFront();

    // G mid  Back
    cubeVertexIndices.push(65,66,67);
    cubeVertexIndices.push(65,60,67);
    pushNormBack();

   
    

     // G mid  Right
     cubeVertexIndices.push(58,70,73);
     cubeVertexIndices.push(58,61,73);
     pushNormRight();

     // G mid  Left Left
     cubeVertexIndices.push(62,63,66);
     cubeVertexIndices.push(62,65,66);
     pushNormLeft();


     // G mid  Long Front
     cubeVertexIndices.push(68,69,70);
     cubeVertexIndices.push(68,64,70);
     pushNormFront();

     // G mid  Long Back
     cubeVertexIndices.push(71,72,73);
     cubeVertexIndices.push(71,67,73);
     pushNormBack();

     // G mid  Top
     cubeVertexIndices.push(69,72,73);
     cubeVertexIndices.push(69,70,73);
     pushNormTop();


     // G mid 
     cubeVertexIndices.push(69,72,71);
     cubeVertexIndices.push(69,68,71);
     pushNormLeft();
}

function quad(a, b, c, d) {
    var t1 = subtract(vertices[b], vertices[a]);
    var t2 = subtract(vertices[c], vertices[b]);
    var normal = cross(t1, t2);
    var normal = vec3(normal);
    normalsArray.push(normal);
    normalsArray.push(normal);
    normalsArray.push(normal);
    normalsArray.push(normal);
    normalsArray.push(normal);
}




function pushNormTop(){
    normalsArray.push(0,1,0);
    normalsArray.push(0,1,0);
    normalsArray.push(0,1,0);
    normalsArray.push(0,1,0);
    normalsArray.push(0,1,0);
    normalsArray.push(0,1,0);
}

function pushNormBottom(){
    normalsArray.push(0,-1,0);
    normalsArray.push(0,-1,0);
    normalsArray.push(0,-1,0);
    normalsArray.push(0,-1,0);
    normalsArray.push(0,-1,0);
    normalsArray.push(0,-1,0);
}

function pushNormRight(){
    normalsArray.push(-1,0,0);
    normalsArray.push(-1,0,0);
    normalsArray.push(-1,0,0);
    normalsArray.push(-1,0,0);
    normalsArray.push(-1,0,0);
    normalsArray.push(-1,0,0);
}

function pushNormLeft(){
    normalsArray.push(1,0,0);
    normalsArray.push(1,0,0);
    normalsArray.push(1,0,0);
    normalsArray.push(1,0,0);
    normalsArray.push(1,0,0);
    normalsArray.push(1,0,0);
}

function pushNormFront(){
    normalsArray.push(0,0,1);
    normalsArray.push(0,0,1);
    normalsArray.push(0,0,1);
    normalsArray.push(0,0,1);
    normalsArray.push(0,0,1);
    normalsArray.push(0,0,1);
}

function pushNormBack(){
    normalsArray.push(0,0,-1);
    normalsArray.push(0,0,-1);
    normalsArray.push(0,0,-1);
    normalsArray.push(0,0,-1);
    normalsArray.push(0,0,-1);
    normalsArray.push(0,0,-1);
}

function onDown(e){
    isDown = true;
    moveX = 0.0;
    moveY = 0.0;

    // 마우스를 누른 위치 저장
    offsetX = e.clientX;
    offsetY = e.clientY;
}

function onMove(e){
    
    if(isDown){
       // 이동 중에 실시간으로 움직인 거리 계산
       moveX = -(e.clientX - offsetX);
       offsetX = e.clientX;
       moveY = -(e.clientY - offsetY);
       offsetY = e.clientY;
       render();
    }
}

function onUp(e){
    isDown = false;
}