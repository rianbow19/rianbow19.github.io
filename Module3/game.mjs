import { Container, Graphics, Text } from "./pixi.mjs";
export { Game }

let dragTarget = null;
let dragStartPos = null;
let rotationCenter = null;
let draggingJoint = null;

const DRAG_AREA = new Graphics()
    .rect(0, 0, 1920, 1080)
    .fill({ color: 0x000000, alpha: 0 });
DRAG_AREA.eventMode = 'static';
DRAG_AREA.cursor = 'pointer';
DRAG_AREA.zIndex = 9999;
DRAG_AREA.visible = false;
DRAG_AREA.on('pointerup', onDragEnd);
DRAG_AREA.on('pointerupoutside', onDragEnd);
DRAG_AREA.on('pointermove', onDragMove);

const DELETE_AREA = new Container()
DELETE_AREA.box = new Graphics()
    .roundRect(10, 530, 400, 540, 20)
    .fill({ color: 0x000000, alpha: 0.2 })
    .stroke({ width: 5, color: 0xffffff })
DELETE_AREA.text = new Text("刪除區", {
    fontSize: 30,
    fill: 0x000000
});
DELETE_AREA.text.position.set(205, 570);
DELETE_AREA.text.anchor.set(0.5);
DELETE_AREA.addChild(DELETE_AREA.box, DELETE_AREA.text);

const componentsToDelete = [];

function rotateAroundPoint(point, center, angle) {
    const sin = Math.sin(angle);
    const cos = Math.cos(angle);

    const translatedX = point.x - center.x;
    const translatedY = point.y - center.y;

    const rotatedX = translatedX * cos - translatedY * sin;
    const rotatedY = translatedX * sin + translatedY * cos;

    return {
        x: rotatedX + center.x,
        y: rotatedY + center.y
    };
}

function onDragStart(event) {
    if (this.parent instanceof Battery || this.parent instanceof Wire) {
        dragTarget = this.parent;
        draggingJoint = this;
    } else {
        dragTarget = this;
        draggingJoint = this;
    }
    DRAG_AREA.visible = true;

    dragStartPos = { x: event.global.x, y: event.global.y };
    rotationCenter = { rotation: dragTarget.rotation };

    // 記錄物件與滑鼠位置的偏移
    const globalPos = dragTarget.toGlobal({ x: 0, y: 0 });
    dragTarget.offset = {
        x: globalPos.x - event.global.x,
        y: globalPos.y - event.global.y
    };
}


function onDragMove(event) {
    if (dragTarget && draggingJoint) {
        checkAllDelete();

        if (dragTarget instanceof Wire && draggingJoint.isJoint) {
            // 電線的拉伸邏輯
            const jointIndex = dragTarget.joints.indexOf(draggingJoint);
            const localPos = dragTarget.toLocal(event.global);
            draggingJoint.position.set(localPos.x, localPos.y);
            dragTarget.redrawWire();
        } else if (draggingJoint.isJoint) {
            // 電池的旋轉邏輯
            const pivotJoint = dragTarget.joints.find(j => j !== draggingJoint);
            const pivotGlobal = dragTarget.toGlobal(pivotJoint.position);

            const startAngle = Math.atan2(
                dragStartPos.y - pivotGlobal.y,
                dragStartPos.x - pivotGlobal.x
            );
            const currentAngle = Math.atan2(
                event.global.y - pivotGlobal.y,
                event.global.x - pivotGlobal.x
            );
            const rotationDiff = currentAngle - startAngle;

            const currentPos = { x: dragTarget.x, y: dragTarget.y };
            const newPos = rotateAroundPoint(
                currentPos,
                dragTarget.parent.toLocal(pivotGlobal),
                rotationDiff
            );

            dragTarget.position.set(newPos.x, newPos.y);
            dragTarget.rotation = rotationCenter.rotation + rotationDiff;

            dragStartPos = { x: event.global.x, y: event.global.y };
            rotationCenter.rotation = dragTarget.rotation;
        } else {
            // 一般拖曳邏輯（新增偏移處理）
            const oldPos = { x: dragTarget.position.x, y: dragTarget.position.y };
            const newGlobalPos = {
                x: event.global.x + dragTarget.offset.x,
                y: event.global.y + dragTarget.offset.y
            };
            dragTarget.position.set(
                dragTarget.parent.toLocal(newGlobalPos).x,
                dragTarget.parent.toLocal(newGlobalPos).y
            );

            // 更新連接的元件位置
            if (dragTarget.connectedComponent != -1) {
                Components.children.forEach(element => {
                    if (element !== dragTarget && element.connectedComponent == dragTarget.connectedComponent) {
                        const dx = dragTarget.position.x - oldPos.x;
                        const dy = dragTarget.position.y - oldPos.y;
                        element.x += dx;
                        element.y += dy;
                    }
                });
            }
        }
    }
}

function checkAllDelete() {
    componentsToDelete.length = 0;

    // 獲取刪除區域的全局邊界
    const deleteAreaBounds = DELETE_AREA.getBounds();

    Components.children.forEach(component => {
        component.tint = 0xffffff;
        const jointNum = component.joints.length;
        let inTrashJoints = 0;

        component.joints.forEach(joint => {
            const globalPos = component.toGlobal(joint.position);
            if (globalPos.x >= deleteAreaBounds.x && 
                globalPos.x <= deleteAreaBounds.x + deleteAreaBounds.width &&
                globalPos.y >= deleteAreaBounds.y && 
                globalPos.y <= deleteAreaBounds.y + deleteAreaBounds.height) {
                inTrashJoints++;
            }
        });

        if (inTrashJoints === jointNum) {
            component.tint = 0xff0000;
            componentsToDelete.push(component);
        }
    });
}

function doAllDelete() {
    componentsToDelete.forEach(component => {
        Components.removeChild(component);
    });
}

function recheckAllConnections() {
    Components.children.forEach(component => {
        component.connectedComponent = -1;
        component.joints.forEach(joint => {
            joint.connected = false;
            joint.tint = 0xffffff;
        });
    });
    // 檢查所有可能的連接
    for (let i = 0; i < Components.children.length; i++) {
        const component1 = Components.children[i];
        const joints1 = component1.getGlobalJointPositions();

        for (let j = i + 1; j < Components.children.length; j++) {
            const component2 = Components.children[j];
            const joints2 = component2.getGlobalJointPositions();

            joints1.forEach((joint1Pos, idx1) => {
                joints2.forEach((joint2Pos, idx2) => {
                    if (areJointsOverlapping(joint1Pos, joint2Pos)) {
                        component1.joints[idx1].connected = true;
                        component2.joints[idx2].connected = true;
                        component1.joints[idx1].tint = 0x00FF00;
                        component2.joints[idx2].tint = 0x00FF00;

                        if (component1.connectedComponent === -1 && component2.connectedComponent === -1) {
                            const newGroup = Groups.length;
                            Groups.push(newGroup);
                            component1.connectedComponent = newGroup;
                            component2.connectedComponent = newGroup;
                        } else if (component1.connectedComponent === -1) {
                            component1.connectedComponent = component2.connectedComponent;
                        } else if (component2.connectedComponent === -1) {
                            component2.connectedComponent = component1.connectedComponent;
                        } else if (component1.connectedComponent !== component2.connectedComponent) {
                            const oldGroup = component2.connectedComponent;
                            Components.children.forEach(comp => {
                                if (comp.connectedComponent === oldGroup) {
                                    comp.connectedComponent = component1.connectedComponent;
                                }
                            });
                        }
                    }
                });
            });
        }
    }
}

function areJointsOverlapping(joint1Pos, joint2Pos) {
    const distance = Math.sqrt(
        Math.pow(joint1Pos.x - joint2Pos.x, 2) +
        Math.pow(joint1Pos.y - joint2Pos.y, 2)
    );
    return distance < 10;
}

function onDragEnd() {
    if (dragTarget) {
        DRAG_AREA.visible = false;
        dragTarget.alpha = 1;

        Groups.length = 0;
        doAllDelete();
        recheckAllConnections();

        dragTarget = null;
        draggingJoint = null;
        dragStartPos = null;
        rotationCenter = null;
    }
}

const Components = new Container();
const AllJoints = new Container();
const Groups = [];

const JOINT_POSITON = {
    'Battery': [[-60, 0], [60, 0]],
}

class Game {
    constructor() {
        this.container = new Container();
        this.container.addChild(DELETE_AREA, DRAG_AREA, Components, AllJoints);
        this.createBatteryBtn();
        this.createWireBtn();
    }

    createBatteryBtn() {
        const createButton = new Container();
        const buttonBackground = new Graphics()
            .roundRect(-75, -20, 150, 40, 10)
            .fill(0x4CAF50);

        const buttonText = new Text('新增電池', {
            fontSize: 20,
            fill: 0xFFFFFF
        });
        buttonText.anchor.set(0.5);

        createButton.addChild(buttonBackground, buttonText);
        createButton.position.set(200, 100);
        createButton.eventMode = 'static';
        createButton.cursor = 'pointer';
        createButton.on('pointerdown', () => {
            const battery = new Battery();
            battery.position.set(
                600 + Math.random() * (1920 - 600 - 200),
                200 + Math.random() * (1080 - 400)
            );
            Components.addChild(battery);
        });
        this.container.addChild(createButton);
    }

    createWireBtn() {
        const createButton = new Container();
        const buttonBackground = new Graphics()
            .roundRect(-75, -20, 150, 40, 10)
            .fill(0x4CAF50);

        const buttonText = new Text('新增電線', {
            fontSize: 20,
            fill: 0xFFFFFF
        });
        buttonText.anchor.set(0.5);

        createButton.addChild(buttonBackground, buttonText);
        createButton.position.set(400, 100);
        createButton.eventMode = 'static';
        createButton.cursor = 'pointer';
        createButton.on('pointerdown', () => {
            const wire = new Wire();
            wire.position.set(
                600 + Math.random() * (1920 - 600 - 200),
                200 + Math.random() * (1080 - 400)
            );
            Components.addChild(wire);
        });
        this.container.addChild(createButton);
    }

    update(time) {

    }
}

class Battery extends Container {
    constructor() {
        super();
        this.type = 'Battery';
        this.connectedComponent = -1;
        this.joints = [];

        const body = new Graphics()
            .roundRect(-50, -20, 100, 40, 15)
            .fill(0x4F4F4F);
        body.eventMode = 'static';
        body.cursor = 'pointer';
        body.on('pointerdown', onDragStart);

        for (let [x, y] of JOINT_POSITON[this.type]) {
            const joint = new Graphics()
                .circle(0, 0, 20)
                .fill({ color: 0xffffff, alpha: 0.5 })
                .stroke({ color: 0xffffff, width: 2 })
            joint.eventMode = 'static';
            joint.cursor = 'pointer';
            joint.on('pointerdown', onDragStart);
            joint.position.set(x, y);
            joint.connected = false;
            joint.isJoint = true;
            joint.zIndex = 2;
            this.joints.push(joint);
            this.addChild(joint);
        }

        this.addChild(body);
    }

    getGlobalJointPositions() {
        return this.joints.map(joint => {
            const globalPos = this.toGlobal(joint.position);
            return { x: globalPos.x, y: globalPos.y };
        });
    }
}

class Wire extends Container {
    constructor() {
        super();
        this.type = 'Wire';
        this.connectedComponent = -1;
        this.joints = [];
        this.wireBody = new Graphics();
        this.wireBody.eventMode = 'static';
        this.wireBody.cursor = 'pointer';
        this.wireBody.on('pointerdown', onDragStart);

        // 創建兩個端點
        for (let i = 0; i < 2; i++) {
            const joint = new Graphics()
                .circle(0, 0, 20)
                .fill({ color: 0xffffff, alpha: 0.5 })
                .stroke({ color: 0xffffff, width: 2 })
            joint.eventMode = 'static';
            joint.cursor = 'pointer';
            joint.on('pointerdown', onDragStart);
            joint.position.set(i * 100, 0);  // 初始位置，兩個端點間隔100
            joint.connected = false;
            joint.isJoint = true;
            joint.zIndex = 3;
            this.joints.push(joint);
            this.addChild(joint);
        }

        this.addChild(this.wireBody);
        this.redrawWire();
    }

    redrawWire() {
        this.wireBody.clear();
        this.wireBody
            .moveTo(this.joints[0].x, this.joints[0].y)
            .lineTo(this.joints[1].x, this.joints[1].y)
            .stroke({ width: 20, color: 0xff8000, cap: "round" })

    }

    getGlobalJointPositions() {
        return this.joints.map(joint => {
            const globalPos = this.toGlobal(joint.position);
            return { x: globalPos.x, y: globalPos.y };
        });
    }
}