class TerrainRandomiser {
    constructor(terrainWidth, terrainDepth, minHeight) {
        this.width = terrainWidth;
        this.depth = terrainDepth;
        this.minHeight = minHeight;
        // Affects height of various terrain
        this.microTerrainMaxHeight = 1;
        this.subTerrainMaxHeight = 4;
        this.superTerrainMaxHeight = 6;
        // Affects roughness of terrain
        this.microTerrainDivisor = 5;
        this.noiseStepScale = 20;
        this.noiseOffsetIncrement = 1 / this.noiseStepScale;
        this.noiseOffset = 0;
        // Initialise 2D array for random values
        this.terrainArray = new Array(this.depth + 1);
        for (let z = 0; z < this.depth + 1; z++) {
            this.terrainArray[z] = new Array(this.width + 1);
        }

        // Seed simplex noise
        noise.seed(Math.random());

        // Generates terrain
        // Terrain composed of micro, sub and superterrain
        // Microterrain and subterrain consists of simplex noise
        // Superterrain consists of sine/cosine function to create a valley
        for (let z = 0; z < this.depth + 1; z++) {
            for (let x = 0; x < this.width + 1; x++) {
                let microTerrain = noise.simplex2((x + 100) / (this.noiseStepScale / this.microTerrainDivisor), (z + 100) / (this.noiseStepScale / this.microTerrainDivisor) + this.noiseOffset * this.microTerrainDivisor) * this.microTerrainMaxHeight;
                let subTerrain = noise.simplex2(x / this.noiseStepScale, z / this.noiseStepScale + this.noiseOffset) * this.subTerrainMaxHeight;
                let superTerrain = Math.cos(2 * Math.PI * x / this.width) * this.superTerrainMaxHeight;
                this.terrainArray[z][x] = microTerrain + subTerrain + superTerrain;
                this.terrainArray[z][x] = (this.terrainArray[z][x] <= this.minHeight) ? this.minHeight : this.terrainArray[z][x];
            }
        }
        // Next call will be offset to simulate movement
        this.noiseOffset -= this.noiseOffsetIncrement;
    }

    stepTerrainHeight() {
        let z = 0;
        let nextTerrainArray = new Array();
        this.terrainArray.pop();
        for (let x = 0; x < this.width + 1; x++) {
            let microTerrain = noise.simplex2((x + 100) / (this.noiseStepScale / this.microTerrainDivisor), (z + 100) / (this.noiseStepScale / this.microTerrainDivisor) + this.noiseOffset * this.microTerrainDivisor) * this.microTerrainMaxHeight;
            let subTerrain = noise.simplex2(x / this.noiseStepScale, z / this.noiseStepScale + this.noiseOffset) * this.subTerrainMaxHeight;
            let superTerrain = Math.cos(2 * Math.PI * x / this.width) * this.superTerrainMaxHeight;
            nextTerrainArray[x] = microTerrain + subTerrain + superTerrain;
            nextTerrainArray[x] = (nextTerrainArray[x] <= this.minHeight) ? this.minHeight : nextTerrainArray[x];
        }
        this.terrainArray.unshift(nextTerrainArray);
        this.noiseOffset -= this.noiseOffsetIncrement;
    }
}

class Terrain {
    constructor(parentScene) {
        // Scene terrain is to be rendered to
        this.parentScene = parentScene;
        // Affects terrain
        this.terrainWidth = 80;
        this.terrainDepth = 100;
        this.terrainStep = 0.6;
        // Affects limits at which terrain is colored
        this.snowLimit = 5;
        this.mountainLimit = 0;
        this.grassLimit = -6;
        this.sandLimit = -7;
        // Terrain colors
        this.snowColor = 0xFFFFFF;
        this.mountainColor = 0x292f42;
        this.grassColor = 0x9bb2e0;
        this.sandColor = 0x37393d;
        this.waterColor = 0x6d98e8;
        // Generating random terrain heights
        this.terrainRandomiser = new TerrainRandomiser(this.terrainWidth, this.terrainDepth, this.sandLimit);

        // Generate terrain geometry
        this.geometry = new THREE.Geometry();
        for (let z = 0; z < this.terrainDepth; z++) {
            for (let x = 0; x < this.terrainWidth; x++) {
                // Creating a plane with vertices in order:
                // 0-1
                // |/|
                // 2-3
                this.geometry.vertices.push(
                    new THREE.Vector3(x, this.terrainRandomiser.terrainArray[z][x], z),
                    new THREE.Vector3(x + 1, this.terrainRandomiser.terrainArray[z][x + 1], z),
                    new THREE.Vector3(x, this.terrainRandomiser.terrainArray[z + 1][x], z + 1),
                    new THREE.Vector3(x + 1, this.terrainRandomiser.terrainArray[z + 1][x + 1], z + 1),
                );

                // Getting index for 0th vertex 
                let planeIndex = z * this.terrainWidth * 4 + x * 4;
                // Generating faces using vertices 0, 1, 2 and 1, 2, 3
                this.geometry.faces.push(
                    new THREE.Face3(planeIndex, planeIndex + 2, planeIndex + 1),
                    new THREE.Face3(planeIndex + 1, planeIndex + 2, planeIndex + 3),
                );
            }
        }

        // Genrating mesh
        this.terrainMaterial = new THREE.MeshBasicMaterial({
            color: 0xFFFFFF,
            side: THREE.FrontSide,
            vertexColors: THREE.FaceColors,
        });
        this.mesh = new THREE.Mesh(this.geometry, this.terrainMaterial);
        this.parentScene.add(this.mesh);

        // Generating inverse
        this.inverseTerrainMaterial = new THREE.MeshBasicMaterial({
            color: 0x000000,
            side: THREE.BackSide,
            fog: false,
            wireframe: false,
        });
        this.inverseTerrainMesh = new THREE.Mesh(this.geometry, this.inverseTerrainMaterial);
        this.inverseTerrainMesh.position.setY(this.inverseTerrainMesh.position.y + 0.1);
        this.mesh.add(this.inverseTerrainMesh);
    }

    update() {
        this.mesh.position.z += this.terrainStep;
        if (this.mesh.position.z >= 1) {
            //reset etep and render next chunk
            this.mesh.position.z = 0;
            this.terrainRandomiser.stepTerrainHeight();
            for (let z = 0; z < this.terrainDepth; z++) {
                for (let x = 0; x < this.terrainWidth; x++) {
                    let planeIndex = z * this.terrainWidth * 4 + x * 4;
                    this.geometry.vertices[planeIndex].y = this.terrainRandomiser.terrainArray[z][x];
                    this.geometry.vertices[planeIndex + 1].y = this.terrainRandomiser.terrainArray[z][x + 1];
                    this.geometry.vertices[planeIndex + 2].y = this.terrainRandomiser.terrainArray[z + 1][x];
                    this.geometry.vertices[planeIndex + 3].y = this.terrainRandomiser.terrainArray[z + 1][x + 1];
                }
            }
            this.updateTerrainColor();
            this.geometry.verticesNeedUpdate = true;
        }
    }

    // Colors faces of a plane depending on the y values of vertices
    updateTerrainColor() {
        this.geometry.faces.forEach(function (face) {
            let maxY = Math.max(this.geometry.vertices[face.a].y, this.geometry.vertices[face.b].y, this.geometry.vertices[face.c].y);
            let minY = Math.min(this.geometry.vertices[face.a].y, this.geometry.vertices[face.b].y, this.geometry.vertices[face.c].y);
            if (maxY > this.snowLimit) {
                face.color.setHex(this.snowColor);
            } else if (maxY > this.mountainLimit) {
                face.color.setHex(this.mountainColor);
            } else if (maxY > this.grassLimit) {
                face.color.setHex(this.grassColor);
            } else if (maxY > this.sandLimit) {
                face.color.setHex(this.sandColor);
            } else {
                face.color.setHex(this.waterColor);
            }
        }.bind(this));
        this.geometry.colorsNeedUpdate = true;
    }
}
