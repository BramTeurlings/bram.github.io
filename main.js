//Scene setup
var clock = new THREE.Clock(true);
var scene = new THREE.Scene();
var canvas = document.querySelector("canvas");
var camera = new THREE.PerspectiveCamera(90, window.innerWidth / window.document.documentElement.clientHeight, 0.1, 1000);
var renderer = new THREE.WebGLRenderer();
renderer.setSize({canvas: canvas});
document.body.appendChild(renderer.domElement);
var numCubes = 0;
var renderCubes = false; /*document.currentScript.getAttribute("cubes");*/
var numTriangles = 5;

// Generate random seeds for each triangle
let randomSeeds = [];
for (let i = 0; i < numTriangles; i++) {
    randomSeeds.push(new THREE.Vector2(Math.random(), Math.random())); // Generate random seed pairs
}

var shadervs = 
`
	void main() {
	gl_Position =  projectionMatrix * modelViewMatrix * vec4( position, 1.0 );
	}
`;

var shaderfs = 
`
	#ifdef GL_ES
	precision mediump float;
	#endif

	uniform vec2 u_resolution;
	uniform vec2 u_mouse;
	uniform float u_time;
	uniform vec2 u_randomSeeds[5];
				
	/*Params:
		1 - st: texcoords between 0.0 and 1.0
		2 - wavewidth: width of the wave
		3 - waveheight: amplitude of the wave
		4 - heightposwave: height possition of the wave
		5 - widthposwave: startingpoint of the wave
		6 - uppercolour: upper wave colour
		7 - lowercolour: lower wave colour
		8 - time: time or speed value
	*/
	float wave(vec2 st, float wavewidth, float waveheight, float heightposwave, float widthposwave){
		return 	step(st.y, ((sin(st.x*wavewidth+u_time +widthposwave)+heightposwave)/waveheight)); 	// upperwave
	}

	/**
	 * Calculates a wave pattern based on the input parameters.
	 *
	 * @param st            The 2D coordinate of the point in the texture.
	 * @param wavewidth     Width of the wave pattern.
	 * @param waveheight    Height of the wave pattern.
	 * @param heightposwave Positional offset for the height of the wave.
	 * @param widthposwave  Positional offset for the width of the wave.
	 * @param uppercolour   Color of the upper part of the wave.
	 * @param lowercolour   Color of the lower part of the wave.
	 * @param time          Time parameter for animation.
	 *
	 * @return              A vec3 representing the color at the specified point.
	 */
	vec3 wave(vec2 st, float wavewidth, float waveheight, float heightposwave, float widthposwave, vec3 uppercolour, vec3 lowercolour, float wavecenter, float time) {
		// Calculate the upper wave using sine function and interpolation
		vec3 upperwave = step(st.y, waveheight) * uppercolour * 1.2;

		// Define the center of the screen
		float center = 0.5 + wavecenter;

		// Calculate horizontal position based on distance from the center normalized to the range [0, 1]
		float distanceFromCenterX = abs(center - st.x);
		float wavePosX = 1.0 - step(wavewidth * (1.0 +time), distanceFromCenterX); // Apply sine function to wave width

		// Calculate the lower wave using step function
		//vec3 lowerwave = step(((sin(wavePosX * wavewidth + time + widthposwave) + heightposwave) / waveheight), st.y) * lowercolour;
		vec3 lowerwave = step(((wavePosX + time) / waveheight), st.y + distanceFromCenterX) * lowercolour;

		return upperwave + lowerwave;
	}

	void main() {              
		vec2 st = gl_FragCoord.xy/u_resolution.xy;

		vec3 bg = vec3(0.785,0.025,0.278)*st.y+0.1;

		// Add random factor to wave height and offset from center
		vec3 w1 = wave(st, 1.3, clamp(u_randomSeeds[0].x * 8.5, 5.1, 8.5), 5.25, 5.508, vec3(0.244,0.495,0.253), bg, clamp(u_randomSeeds[0].y * -0.3, -0.3, 0.0), sin(u_time/1.0));
		vec3 w2 = wave(st, 1.3, clamp(u_randomSeeds[1].x * 7.5, 5.7, 7.5), 4.25, 3.508, vec3(0.265,0.530,0.386), bg, clamp(u_randomSeeds[0].y * -0.5, -0.5, 0.0), sin(u_time/1.952));
		vec3 w3 = wave(st, 1.3, clamp(u_randomSeeds[2].x * 8.5, 5.3, 8.5), 3.25, 2.276, vec3(0.217,0.740,0.633), bg, u_randomSeeds[0].y, sin(u_time/1.6));
		vec3 w4 = wave(st, 1.3, clamp(u_randomSeeds[0].x * 9.5, 6.0, 9.5), 2.25, 1.276, vec3(0.158,0.608,0.680), bg, clamp(u_randomSeeds[0].y * 0.3, 0.0, 0.3), sin(u_time));
		vec3 w5 = wave(st, 1.3, clamp(u_randomSeeds[0].x * 10.5, 6.5, 10.5), 1.970, 4.428, vec3(0.690,0.985,0.859), bg, clamp(u_randomSeeds[0].y * 0.5, 0.0, 0.5), sin(u_time-1.35));


		float cmix = 0.5; //mix value divided by the amount of waves
		vec3 w = mix(w1, w2, cmix);
		w = mix(w, w3, cmix/3.0);
		w = mix(w, w4, cmix/4.0);
		w = mix(w, w5, cmix/5.0);
		//w = mix(w, w6, cmix/5.0);
		gl_FragColor=vec4(w, 1.0);
	}
`
;

var cubevs = 
`
	varying vec3 v_VertPosition;
	varying vec3 v_NormalDir;
	varying vec3 v_CamPosition;

	void main()
	{
		v_VertPosition = (modelMatrix * vec4( position, 1.0 )).xyz;
		v_NormalDir = (modelMatrix * vec4( normal, 1.0 )).xyz;
		v_CamPosition = cameraPosition;

		gl_Position = projectionMatrix * modelViewMatrix * vec4( position, 1.0 );
	}
`;

var cubefs = 
`
	/*
	* Shading model from "Real Time Rendering" used.
	*/

	uniform vec2 u_resolution;
	uniform float u_time;
	uniform vec3 u_surface;

	varying vec3 v_VertPosition;
	varying vec3 v_NormalDir;
	varying vec3 v_CamPosition;

	vec3 lights[2];
	vec3 lightColor = 	vec3(.9, 0.6, 0.3)/2.0;

	//vec3 surface = 	vec3( .8, 0.2, 0.3);
	vec3 cool = 		vec3( .0, .0, .55);
	vec3 warm = 		vec3(0.5, 0.3, 0.0);
	vec3 highlight =	vec3(2.0, 2.0, 2.0);

	vec3 lit(vec3 l, vec3 n, vec3 v){
		vec3 r_l = reflect(-l, n);
		float s = clamp(100.0 * dot(r_l, v) - 97.0, 0.0, 1.0);
		return mix(warm, highlight, s);
	}

	vec3 unlit(){
		return  0.56 * cool;
	}
	
	void main() {
		lights[0] = vec3(3.0, 3.0, 4.0);
		lights[1] = vec3(-3.0, -3.0, -3.2);

		cool 	+= u_surface;
		warm 	+= u_surface;

		vec3 n = normalize(v_NormalDir);
		vec3 v = normalize(v_CamPosition - v_VertPosition);

		vec4 outputColor = vec4(unlit(), 1.0);

		for(int i = 0; i < 2; i++){
			vec3 l = normalize(lights[i] - v_VertPosition);
			float NdL = clamp(dot(n, l), 0.0, 1.0);
			outputColor += vec4(NdL * lightColor * lit(l, n, v), 0.0);
		}

		gl_FragColor=outputColor;
	}
`
;

	var uniforms = {
		u_time: { type: "f", value: 1.0 },
		u_resolution: { type: "v2", value: new THREE.Vector2() },
		u_mouse: { type: "v2", value: new THREE.Vector2() },
		u_surface: {type: "v3", value: new THREE.Vector3()},
		u_randomSeeds: { value: randomSeeds }

	};


	var planematerial = new THREE.ShaderMaterial( {
		uniforms: uniforms,
		vertexShader: shadervs,
		fragmentShader: shaderfs
	} );

	var cubematerial = new THREE.ShaderMaterial( {
		uniforms: uniforms,
		vertexShader: cubevs,
		fragmentShader: cubefs
	} );

//geometry
var cubeGeometry = new THREE.BoxGeometry(1, 1, 1);
var planeGeometry = new THREE.PlaneGeometry(15, 15, 1);
var material = new THREE.MeshBasicMaterial( {color: 0x0c6297  });
var centerCube = new THREE.Mesh(cubeGeometry, cubematerial);
var backgroundPlane = new THREE.Mesh(planeGeometry, planematerial);



function resize() {
	var width = canvas.clientWidth;
	var height = window.document.documentElement.clientHeight;

	if (width != canvas.width || height != canvas.height)
		renderer.setSize(width, height, false);
	camera.aspect = width / height;
	camera.updateProjectionMatrix();
}

//rendering
function animate(){
	requestAnimationFrame(animate);
	resize();
	
	uniforms.u_time.value = clock.getElapsedTime();
	uniforms.u_resolution.value = new THREE.Vector2(canvas.clientWidth, canvas.clientHeight);
	uniforms.u_surface.value = new THREE.Vector3(0.8, 0.2, 0.3); // cube surface color
	uniforms.u_randomSeeds.value = randomSeeds;
	

	if(renderCubes == true){
		//update cubes
		cubes.forEach(transform);

		//updating code
		centerCube.rotation.x += 0.01;
		centerCube.rotation.y += 0.01;
	}
	


	//plane.scale.y = canvas.clientWidth/canvas.clientHeight;
	backgroundPlane.scale.x = canvas.clientWidth/canvas.clientHeight;
	
	//render call
	renderer.render(scene, camera);
}


function transform(localcube, index) {
	var mag = 3;
	var scroll = document.documentElement.scrollTop / canvas.height;
	localcube.position.x = mag * Math.cos(2*Math.PI/ numCubes * index + clock.getElapsedTime());
	localcube.position.y = scroll + mag * Math.sin(2*Math.PI/ numCubes * index+ clock.getElapsedTime());
	centerCube.position.y = 0.0 + scroll;

	localcube.rotation.x = Math.cos(clock.getElapsedTime());
	localcube.rotation.y = Math.sin(clock.getElapsedTime());
}

//-------------main------------
//camera var
camera.position.z = 5;
backgroundPlane.position.z = -2;

//cube list
if(renderCubes == true){
	var cubes =  new Array(numCubes);
	for(i = 0; i < numCubes; i++){
		var lcube = new THREE.Mesh(cubeGeometry, cubematerial);
		cubes.push(lcube);
		scene.add(lcube);
	}
	scene.add(centerCube);
}

scene.add(backgroundPlane);

animate();