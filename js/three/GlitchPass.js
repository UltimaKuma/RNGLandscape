/**
 * @author alteredq / http://alteredqualia.com/
 */

THREE.GlitchPass = function () {

	THREE.Pass.call(this);

	if (THREE.DigitalGlitch === undefined) console.error("THREE.GlitchPass relies on THREE.DigitalGlitch");

	var shader = THREE.DigitalGlitch;
	this.uniforms = THREE.UniformsUtils.clone(shader.uniforms);

	this.material = new THREE.ShaderMaterial({
		uniforms: this.uniforms,
		vertexShader: shader.vertexShader,
		fragmentShader: shader.fragmentShader
	});

	this.fsQuad = new THREE.Pass.FullScreenQuad(this.material);

	this.goWild = true;
	this.curF = 0;
	this.generateTrigger();

};

THREE.GlitchPass.prototype = Object.assign(Object.create(THREE.Pass.prototype), {

	constructor: THREE.GlitchPass,

	render: function (renderer, writeBuffer, readBuffer /*, deltaTime, maskActive */) {

		this.uniforms["tDiffuse"].value = readBuffer.texture;
		this.uniforms['seed'].value = Math.random();//default seeding
		this.uniforms['byp'].value = 0;

		if (this.curF % this.randX == 0 || this.goWild == true) {

			this.uniforms['amount'].value = Math.random() / 128;
			this.uniforms['angle'].value = THREE.Math.randFloat(- Math.PI, Math.PI);
			this.uniforms['seed_x'].value = THREE.Math.randFloat(- 1, 1);
			this.uniforms['seed_y'].value = THREE.Math.randFloat(- 1, 1);
			this.uniforms['distortion_x'].value = THREE.Math.randFloat(0, 1);
			this.curF = 0;
			this.generateTrigger();

		} else if (this.curF % this.randX < this.randX / 5) {

			this.uniforms['amount'].value = Math.random() / 90;
			this.uniforms['angle'].value = THREE.Math.randFloat(- Math.PI, Math.PI);
			this.uniforms['distortion_x'].value = THREE.Math.randFloat(0, 1);
			this.uniforms['distortion_y'].value = THREE.Math.randFloat(0, 1);
			this.uniforms['seed_x'].value = THREE.Math.randFloat(- 0.3, 0.3);
			this.uniforms['seed_y'].value = THREE.Math.randFloat(- 0.3, 0.3);

		} else if (this.goWild == false) {

			this.uniforms['byp'].value = 1;

		}

		this.curF++;

		if (this.renderToScreen) {

			renderer.setRenderTarget(null);
			this.fsQuad.render(renderer);

		} else {

			renderer.setRenderTarget(writeBuffer);
			if (this.clear) renderer.clear();
			this.fsQuad.render(renderer);

		}

	},

	generateTrigger: function () {

		this.randX = THREE.Math.randInt(120, 240);

	},
});
