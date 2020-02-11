class Sun {
    constructor(parentScene) {
        // The scene where sun is added
        this.parentScene = parentScene;
        this.sunColor = 0xff2025;
        // Affects properties of sun
        this.maxSunScale = 5;
        // Add sun to scene
        this.sunGeometry = new THREE.SphereGeometry(24, 32, 32);
        this.sunAlpha = new THREE.TextureLoader().load("textures/sunAlpha.png");
        this.sunAlpha.minFilter = THREE.NearestFilter;
        this.sunMaterial = new THREE.MeshToonMaterial({
            color: this.sunColor,
            alphaMap: this.sunAlpha,
            transparent: true,
            wireframe: false,
            fog: false,
            shininess: 0,
        });
        this.sunMesh = new THREE.Mesh(this.sunGeometry, this.sunMaterial);
        this.sunMesh.position.set(40, 12, -12)
        this.parentScene.add(this.sunMesh);

        // Generating sun inverse
        this.inverseSunMaterial = new THREE.MeshBasicMaterial({
            color: 0x000000,
            alphaMap: this.sunAlpha,
            transparent: true,
            side: THREE.BackSide,
            wireframe: false,
            fog: false,
        });
        this.inverseSunMesh = new THREE.Mesh(this.sunGeometry, this.inverseSunMaterial);
        this.inverseSunMesh.scale.set(1.01, 1.01, 1.01);
        this.sunMesh.add(this.inverseSunMesh);

        // Audio
        this.audioResponse = 0;
    }

    setAudio(audioArray) {
        if (audioArray === undefined) return;
        let total = 0;
        // Average whole audio response
        for (let i = 0; i < audioArray.length; i++) {
            total += audioArray[i];
        }
        this.audioResponse = total / audioArray.length;
    }

    update() {
        let scaleDiff = sunModel.maxSunScale - 1;
        let sunScale = (scaleDiff * this.audioResponse) + 1;
        this.sunMesh.scale.set(sunScale, sunScale, sunScale);
    }
}
