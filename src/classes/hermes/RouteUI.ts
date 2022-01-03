import * as BABYLON from 'babylonjs';
import Hermes from "./Hermes";
import FrameUpdater from '../FrameUpdater';
import RoadRig from '../DynamicWorld/RoadRig';

const controlPointsPerAxis = 5;
const gridSize = 50;
const epsilon = 1; // tolerance for selection

export default class RouteUI {
    protected hermes: Hermes = null;
    private frameUpdaterID: string;
    private vehicle: RoadRig = null;
    private uiSpheres: BABYLON.Mesh[] = [];
    private selection: BABYLON.Vector3[] = [];
    private normalMaterial: BABYLON.StandardMaterial;
    private selectedMaterial: BABYLON.StandardMaterial;

    constructor(hermes: Hermes) {
        this.hermes = hermes;

        this.buildMaterials();
    }

    buildMaterials() {
        const scene = this.hermes.app.scene;
        this.normalMaterial = new BABYLON.StandardMaterial("normalMaterial", scene);

        this.normalMaterial.diffuseColor = new BABYLON.Color3(1, 1, 1);
        this.normalMaterial.specularColor = new BABYLON.Color3(0.5, 0.6, 0.87);
        this.normalMaterial.emissiveColor = new BABYLON.Color3(1, 1, 1);
        this.normalMaterial.ambientColor = new BABYLON.Color3(0.23, 0.98, 0.53);

        this.selectedMaterial = new BABYLON.StandardMaterial("selectedMaterial", scene);

        this.selectedMaterial.diffuseColor = new BABYLON.Color3(0, 0, 0);
        this.selectedMaterial.specularColor = new BABYLON.Color3(0.5, 0.6, 0.87);
        this.selectedMaterial.emissiveColor = new BABYLON.Color3(0, 0.2, 0.9);
        this.selectedMaterial.ambientColor = new BABYLON.Color3(0.23, 0.98, 0.53);
    }

    /**
     * @param vehicle: the 'cursor' vehicle
     */
    enable(vehicle) {
        this.vehicle = vehicle;
        const scene = this.hermes.app.scene;
        const num_spheres = Math.pow(controlPointsPerAxis, 3);

        for (let i = 0; i < num_spheres; i++) {
            const sphere = BABYLON.MeshBuilder.CreateSphere("uiSphere", {
                sideOrientation: BABYLON.Mesh.DOUBLESIDE,
                diameter: 3
            }, scene);
            sphere.actionManager = new BABYLON.ActionManager(scene);

            sphere.actionManager.registerAction(
                new BABYLON.ExecuteCodeAction(
                    BABYLON.ActionManager.OnPickTrigger,
                    () => {
                        this.sphereClicked(sphere);
                    }
                )
            );

            this.uiSpheres.push(sphere);
        }

        this.frameUpdaterID = FrameUpdater.addUpdater(this.update.bind(this));
    }

    disable() {
        FrameUpdater.removeUpdater(this.frameUpdaterID);
        this.uiSpheres.forEach(sphere => sphere.dispose());
        this.uiSpheres = [];
    }

    sphereClicked(sphere: BABYLON.Mesh) {
        if (this.isPositionSelected(sphere.position)) {
            // unselect
            this.selection = this.selection.filter(
                (position) => position.subtract(sphere.position).lengthSquared() > epsilon);

            return;
        }

        this.selection.push(sphere.position.clone());

        if (this.selection.length == 2) {
            const forward = this.selection[1].subtract(this.selection[0]).normalize();
            const up = new BABYLON.Vector3(0, 1, 0);
            const point1ID = this.hermes.routeDb.addPoint({
                point: this.selection[0],
                up,
                forward
            });

            const point2ID = this.hermes.routeDb.addPoint({
                point: this.selection[1],
                up,
                forward
            });

            this.hermes.routeDb.addSegment({
                point1ID,
                point2ID,
                has_left_wall: true,
                has_right_wall: true,
                is_noodle: true,
            });

            this.vehicle.setTarget(
                this.selection[1].add(forward.scale(-30)).add(up.scale(5)),
                forward
            );

            this.selection = [this.selection[1]];
        }
    }

    update() {
        const model = this.vehicle.dynamicObject.physicsModel;
        const vehiclePositionRounded: BABYLON.Vector3 = model.position.clone();

        const {x,y,z} = vehiclePositionRounded;
        const vp = vehiclePositionRounded;
        vp.x = Math.round(x / gridSize) * gridSize;
        vp.y = Math.round(y / gridSize) * gridSize;
        vp.z = Math.round(z / gridSize) * gridSize;

        // Place a sphere at all positions
        // This part could be cached
        const positions = [];
        for (let i = 0; i < controlPointsPerAxis; i++) {
            for (let j = 0; j < controlPointsPerAxis; j++) {
                for (let k = 0; k < controlPointsPerAxis; k++) {
                    positions.push([
                        (i - controlPointsPerAxis / 2) * gridSize,
                        (j - controlPointsPerAxis / 2) * gridSize,
                        (k - controlPointsPerAxis / 2) * gridSize
                    ]);
                }
            }
        }

        this.uiSpheres.forEach((sphere, index) => {
            sphere.position.x = positions[index][0] + vp.x;
            sphere.position.y = positions[index][1] + vp.y;
            sphere.position.z = positions[index][2] + vp.z;

            const selected = this.isPositionSelected(sphere.position);

            sphere.material = selected ? this.selectedMaterial : this.normalMaterial;
        });
    }

    private isPositionSelected(positionToCheck: BABYLON.Vector3): boolean {
        const selected = this.selection.reduce((acc, position) => {
            return position.subtract(positionToCheck).lengthSquared() < epsilon || acc
        }, false);
        return selected;
    }
}
