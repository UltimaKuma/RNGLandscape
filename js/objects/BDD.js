class BDD {
    constructor(parentScene, updateQueue) {
        this.parentScene = parentScene;
        // Update will be called on this queue when needed
        this.updateQueue = updateQueue;
        this.bddScene;
        this.orbitRadius = 36;
        // BDD rotation
        this.xRotationOffset = Math.PI / 2;
        this.yRotationOffset = Math.PI;
        this.zRotationOffset = Math.PI / 2;
        // BDD position (is relative to sun)
        this.xPos = sunModel.sunMesh.position.x;
        this.yPos = sunModel.sunMesh.position.y;
        this.zPos = sunModel.sunMesh.position.z;
        // Audio
        this.audioResponse = 0
        // Trail audio max
        this.maxTrailScale = 5;
        // Instantiate a loader
        let loader = new THREE.GLTFLoader();

        // Load a glTF resource
        loader.load(
            // resource URL
            'models/toonBDD.glb',

            // called when the resource is loaded
            function (gltf) {
                console.log(gltf.scene);
                this.bddScene = gltf.scene;
                this.parentScene.add(gltf.scene);

                this.bddScene.traverse((o) => {
                    if (o.isMesh) {
                        o.material = this.toToonMaterial(o.material)
                    };
                    if (o.parent.name == "bddInverse") o.material.side = THREE.FrontSide;
                });

                this.updateQueue.push(this);
            }.bind(this),

            // called while loading is progressing
            function (xhr) {
                console.log((xhr.loaded / xhr.total * 100) + '% loaded');
            },

            // called when loading has errors
            function (error) {
                console.log(error);
            }
        );

        this.trailGeometry = new THREE.Geometry();
        // this.trailGeometry.vertices = new Array(100);
        for (let i = 0; i < 100; i++) {
            this.trailGeometry.vertices.unshift(new THREE.Vector3(this.xPos, this.yPos, this.zPos));
        }

        this.trailLine = new THREE.Line(this.trailGeometry, new THREE.LineBasicMaterial({
            color: 0xffffff,
        }));
        this.parentScene.add(this.trailLine);
    }

    toToonMaterial(material) {
        let toonMaterial = new THREE.MeshToonMaterial({
            color: material.color,
            fog: false,
            wireframe: false,
            shininess: 0,
            // TURNS OUT ALL MODEL MESHES WERE BACKWARDS (Aside from mouth)
            side: THREE.BackSide
        });
        return toonMaterial;
    }

    setAudio(audioArray) {
        if (audioArray === undefined) console.log(audioArray);
        let total = 0;
        // Average whole audio response
        for (let i = 0; i < audioArray.length; i++) {
            total += audioArray[i];
        }
        this.audioResponse = total / audioArray.length;
    }

    update() {
        // Function for orbit around "sun"
        let timer = Date.now() * 0.00025;
        this.xPos = Math.sin(timer * 7) * this.orbitRadius * ((this.maxTrailScale - 1) * this.audioResponse + 1) + sunModel.sunMesh.position.x;
        this.yPos = Math.cos(timer * 5) * this.orbitRadius * ((this.maxTrailScale - 1) * this.audioResponse + 1) + sunModel.sunMesh.position.y;
        this.zPos = Math.cos(timer * 3) * this.orbitRadius * ((this.maxTrailScale - 1) * this.audioResponse + 1) + sunModel.sunMesh.position.z;
        this.bddScene.position.set(this.xPos, this.yPos, this.zPos)

        // Update trail following bdd
        this.trailGeometry.vertices.unshift(new THREE.Vector3(this.xPos, this.yPos, this.zPos));
        if (this.trailGeometry.vertices.length > 100) {
            this.trailGeometry.vertices.pop();
        }
        this.trailGeometry.verticesNeedUpdate = true;

        // Rotate around center
        this.bddScene.rotation.set(timer * 7 + this.xRotationOffset, timer * 5 + this.yRotationOffset, timer * 3 + this.zRotationOffset);
    }

    remove(index) {
        this.parentScene.remove(this.bddScene);
        this.parentScene.remove(this.trailLine);
        optionalUpdateQueue.splice(index);
    }
}
