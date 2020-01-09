import Player from "./Player";
import PlayerJson from "./PlayerJson";
import { Card } from "./Card";

export enum HandStage {
    PREFLOP,
    FLOP,
    TURN,
    RIVER,
    SHOWDOWN
}

export class GameState {

    players : Player[]
    activePlayers: Player[] = [];

    // game data:
    anteValue = 0;
    blindValue = 50;
    maxHands = 10;

    // 
    currentHand = 1;
    commonCards: Card[];

    firstPlayerIndex: number;
    currentPlayerIndex: number;
    currentDealerIndex: number;
    lastRaisedIndex: number;
    pot = 0;
    handStage: HandStage;
    callValue: number;

    // player json data:
    you : PlayerJson;

    public toJson(player: Player) : GameState {
        const yourHand = player.hand;

        let json : GameState = JSON.parse( JSON.stringify(this) );
        json.players.forEach((p : Player) => {
            delete p.hand;
        });
        json.activePlayers.forEach((p : Player) => {
            delete p.hand;
        });

        json.you = new PlayerJson();
        json.you.hand = yourHand;
        json.you.callValue = this.callValue - player.betChips;

        return json;
    }

}