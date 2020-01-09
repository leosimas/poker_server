import { Card } from "./Card";

export default class Player {

    // configs:
    id : string;
    name: string;
    url: string;

    // state:
    chips: number;
    betChips: number = 0;
    isDealer = false;
    isActive = false;
    hasFolded = false;

    // private to player:
    hand: Card[] = [];

}