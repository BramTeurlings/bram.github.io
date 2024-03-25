// Author:
// Title:

#ifdef GL_ES
precision mediump float;
#endif

uniform vec2 u_resolution;
uniform vec2 u_mouse;
uniform float u_time;
			
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

	        // vec3 wave(vec2 st, float wavewidth, float waveheight, float heightposwave, float widthposwave, vec3 uppercolour, vec3 lowercolour){
	        // 	return 	step(st.y, ((sin(st.x*wavewidth+u_time +widthposwave)+heightposwave)/waveheight)) * uppercolour + 	// upperwave
	        // step(((sin(st.x*wavewidth+u_time +widthposwave)+heightposwave)/waveheight), st.y)*lowercolour;			//lowerwave
	        // }

	        vec3 wave(vec2 st, float wavewidth, float waveheight, float heightposwave, float widthposwave, vec3 uppercolour, vec3 lowercolour, float time){
	        	return 	step(st.y, ((sin(st.x*wavewidth+time +widthposwave)+heightposwave)/waveheight))	/*<- upperwave*/ * mix( ((sin(st.x*wavewidth+time +widthposwave)+heightposwave)/waveheight) +0.616, sin(st.y)*4.008, .5)*uppercolour*1.2 /*<-upperwave colour interpolation*/ 
                    	// //step() params are just switched for a counterwave
	       			+	step(((sin(st.x*wavewidth+time +widthposwave)+heightposwave)/waveheight), st.y)	/*<- lowerwave*/ *lowercolour;
	        }

			
			// //FAILED :/
			//  vec3 wave(vec2 st, float wavewidth, float waveheight, float heightposwave, float widthposwave, vec3 uppercolour, vec3 lowercolour){
			// return 	step(st.y,((sin(st.x*wavewidth+u_time +widthposwave)+heightposwave)/waveheight)) 	/*<- upperwave*/ /** mix(1., .5, ((sin(st.y*wavewidth+u_time +widthposwave)+heightposwave)/waveheight))*uppercolour /*<-upperwave colour interpolation*/
			// //step() params are just switched for a counterwave
			// -step(st.y,((sin(st.x*wavewidth+u_time +widthposwave)+heightposwave)/waveheight))	/*<- lowerwave*/ *lowercolour;					//lowerwave
			// ;
			// }
			

	        void main() {
	        	vec2 st = gl_FragCoord.xy/u_resolution.xy;
	        	
				vec3 bg = vec3(0.785,0.441,0.289)*st.y+0.1;
                
    			vec3 w1 = wave(st, 1.3, 16.628, 15.946,-0.508,vec3(0.495,0.145,0.112), bg, u_time/1.);
                //vec3 w2 = wave(st, -5.468, 7.180, 9.626,-0.508,vec3(0.310,0.360,0.590), bg, u_time/1.5);
    			vec3 w2 = wave(st, 1.3, 7.076, 5.874,7.508, vec3(0.530,0.100,0.120), bg, u_time/1.952);
    			vec3 w3 = wave(st, 1.3, 5.5, 1.378,5.364, vec3(0.173,0.230,0.740), bg, u_time/1.6);
    			vec3 w4 = wave(st, 1.3, 5.5, 2.25,1.276, vec3(0.535,0.654,0.680), bg, sin(u_time));
    			vec3 w5 = wave(st, 1.3, 5.5, 3.754,3.316, vec3(0.348,0.366,0.985), bg, sin(u_time-1.35));

				
                float cmix = 0.5; //mix value divided by the amount of waves
               	vec3 w = mix(w1, w2, cmix);
    			w = mix(w, w3, cmix/3.0);
    			w = mix(w, w4, cmix/4.0);
    			w = mix(w, w5, cmix/5.0);
                //w = mix(w, w6, cmix/5.0);
	            gl_FragColor=vec4(w, 1.0);
	            
	        }