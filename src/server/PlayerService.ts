import axios from "axios";
import Player from "../game/models/Player";
import { GameState } from "../game/models/GameState";
import { PlayerAction } from "../game/models/PlayerAction";

export class PlayerService {

    public async waitAction(player: Player, gameState: GameState) {
        return await this.requestAction(player, gameState);
    }

    private requestAction(player: Player, gameState: GameState) {
        return new Promise<number>((resolve) => {

            this.mockAction(player, gameState.toJson(player), resolve);
            return;

            let betUrl = `${player.url}/action`

            axios.post(betUrl, gameState.toJson(player), {
                timeout: 30000
            }).then((response) => {
                console.log(response.data);
                let betValue = parseInt(response.data);
                if ( isNaN(betValue) ) {
                    betValue = PlayerAction.FOLD;
                }
                resolve(betValue);
            })
            .catch((error) => {
                console.error(error);
                resolve(PlayerAction.FOLD);
            })
        });
    }

    private mockAction(player: Player, gameState: GameState, resolve) {
        setTimeout(()=>{ 
            resolve( gameState.you.callValue );
            // resolve( PlayerAction.FOLD );
         }, 20);
    }

}