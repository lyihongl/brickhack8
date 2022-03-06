export type Interactive = {
    location: [number, number],
    data: [string, string, string], 
    display: string,
    displayF: (inv: Set<string>) => number
}

export type GameMap = {
    layout: number[][];
    interactList: Interactive[]
}