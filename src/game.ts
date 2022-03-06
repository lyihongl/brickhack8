import * as wglt from "wglt"
import {Console, DialogState, Terminal, Dialog, GUI, Rect, Point, Colors, DefaultDialogRenderer, MessageDialog, SelectDialog, Keys} from 'wglt'
// import {DialogRenderer} from 'gui/dialogrenderer'
import {GameMap, Interactive} from "./map";
import * as io from "socket.io-client"


const SCREEN_WIDTH = 80;
const SCREEN_HEIGHT = 45;

const interactiveLocations:[number, number][] = [[10,3],[10,15],[40,7],[55,20],[35,10]]

enum PlayerType {
    parent = "Parent",
    kid = "Kid",
    notset = "None",
}

enum GameState {
    menu,
    playing
}

const term = new wglt.Terminal(
    document.querySelector('canvas') as HTMLCanvasElement,
    SCREEN_WIDTH,
    SCREEN_HEIGHT
)
// term.fillRect(0, 0, 80, 40, 0, wglt.Colors.YELLOW, wglt.Colors.DARK_BLUE);

let gamestate: GameState = GameState.menu;
let playertype: PlayerType = PlayerType.notset;

const gui = new GUI(term, new DefaultDialogRenderer())
const kidGui = new GUI(term, new DefaultDialogRenderer())
const parentGui = new GUI(term, new DefaultDialogRenderer())

var socket = io.io();

const keys  = ["Brief case code", "Key1", "Phone number", "Phone number", "Morse code", "Key3"]
const dialog1 = ["", "Seems like you need a code...", "Seems like you need a key...", "Hmm theres a phone, but no contacts", "A morse code lock??"]
const dialog2 = ["There seems to be a code, but its quite blurry.\nAsk your parent(s) what their highschool graduation\
was like,\nmaybe it will help you get a clearer picture", "Theres another key but its stuck!\nAsk your parent(s) what's their favorite traditional holiday",
"Maybe your parent(s) know who you need to call\nAsk them how they met"]
const dialog3 = []

let generateInteractives = () => {
    let a: Interactive[] = [];
    for(let i = 0; i<3; i++){
        a.push({
            data: [dialog1[i], dialog2[i], ""],
            location: interactiveLocations[i],
            display: ""+(i+1),
            displayF: (inv: Set<string>) => {
                if(inv.has(keys[i])){
                    return 2;
                }
                if(i == 0 && !inv.has(keys[i])){
                    return 1
                }                 
                if (i > 0 && inv.has(keys[i-1])){
                    return 1
                }
                return 0
            }
        }) 
    }
    return a;
}

let drawInteractives = (a: Interactive[], term:Terminal, selected: number) => {
    a.forEach((it: Interactive, i) => {
        if(i == selected){
            term.drawString(it.location[0], it.location[1], it.display, Colors.LIGHT_GREEN, Colors.WHITE)
        } else {
            term.drawString(it.location[0], it.location[1], it.display)
        }
    })
}

let parentPrompt = -1;
let interactives = generateInteractives()
socket.on("iop-ack-kid", (args)=>{
    if(playertype == PlayerType.kid){
        inventory.add(keys[args])
    }
})

socket.on("iop-req", (args)=>{
    console.log("iop-req", args)
    parentPrompt = args
    parentGui.add(new MessageDialog("Prompt: ", interactives[parentPrompt].data[1]+"\npress space to confirm question has been addressed"+"\npress esc to close"))
})
let inventory:Set<string> = new Set();
let renderInv = (term:Terminal) => {
    let i = 0;
    term.drawString(1, 19, "Inventory:");
    inventory.forEach((it) => {
        term.drawString(1, 20+i, it);
        i++
    })
}
socket.on("add-inv", (args)=>{
    if(playertype == PlayerType.kid) {
        inventory.add(args)
    }
})
let parentGame = (term: Terminal) => {
    if(parentGui.handleInput()) {
        if(term.isKeyPressed(Keys.VK_SPACE)){
            console.log("ack")
            socket.emit("iop-ack", parentPrompt)
        }
    }
    parentGui.draw()
}

let interactive = -1;
let kidGame = (term: Terminal) => {
    drawInteractives(interactives, term, interactive);
    renderInv(term);
    if(!kidGui.handleInput()){
        if(term.isKeyPressed(Keys.VK_RIGHT)){
            interactive = (interactive+1)%5;
            console.log("interactive", interactive);
        }else if(term.isKeyPressed(Keys.VK_LEFT)) {
            if(interactive == 0) interactive = 5;
            interactive = (interactive-1)%5;
            console.log("interactive", interactive);
        } else if(term.isKeyPressed(Keys.VK_SPACE)){
            kidGui.add(new MessageDialog("Prompt:", interactives[interactive].data[interactives[interactive].displayF(inventory)]+"\npress esc to close"))
            console.log("interactive", interactive, interactives[interactive].displayF(inventory))
            if(interactives[interactive].displayF(inventory) == 1){
                socket.emit("iop", interactive)
            }
        }
    }
    kidGui.draw()
}

term.update = () => {
    term.clear()
    switch(gamestate) {
        case GameState.menu: {
            if(!gui.handleInput()){
                gui.add(new SelectDialog("You are:", ["Parent", "Kid"], (choice)=> {
                    switch(choice) {
                        case 0: {
                            playertype = PlayerType.parent;
                            break;
                        }
                        case 1: {
                            playertype = PlayerType.kid;
                            break;
                        }
                    }
                    gamestate = GameState.playing;
                }))
            }
            gui.draw()
            break;
        }
        case GameState.playing: {
            term.fillRect(0, 0, SCREEN_WIDTH, SCREEN_HEIGHT, 0, Colors.YELLOW, Colors.LIGHT_GRAY);
            term.drawString(1, 1, "Playing as: " + playertype);
            switch(playertype) {
                case PlayerType.parent: {
                    // drawInteractives(generateInteractives(), term, -1);
                    parentGame(term);
                    break;
                }
                case PlayerType.kid: {
                    kidGame(term);
                    break;
                }
            }
            break;
        }
    }
}

// socket.on("test", ()=>{
//     console.log("ok")
// })
 