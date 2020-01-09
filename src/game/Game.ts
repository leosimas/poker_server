import {MeuLogger} from "../server/MeuLogger";
import { Croupier } from "./roles/Croupier";
import { configs } from "./Configs";
import { GameState, HandStage } from "./models/GameState";
import Player from "./models/Player";
import { MathUtils } from "../utils/MathUtils";
import { PlayerService } from "../server/PlayerService";
import { PlayerAction } from "./models/PlayerAction";
import pokerRank from "poker-rank";
import { Card } from "./models/Card";

export default class Game {
    private playerService = new PlayerService();
    private croupier = new Croupier();
    private state : GameState;
    
    private initGameState() {
        let s = new GameState();
        s.anteValue = 0;
        s.blindValue = configs.game.blind;
        s.currentHand = 1;
        s.maxHands = configs.game.maxHands;
        
        s.players = [];
        configs.players.forEach(json => {
            const p = new Player();
            p.chips = configs.game.buyIn;
            p.betChips = 0;
            p.name = json.name;
            p.url = json.url;
            s.players.push(p);
        });

        s.currentDealerIndex = null;

        this.state = s;

        let names = this.state.players.map(p =>{ return p.name }).join("\n\t");
        MeuLogger.info(`Players: \n\t${names}`);
    }

    public start() {
        MeuLogger.info( "=================================================" );
        MeuLogger.info( "================ Iniciando jogo! ================" );
        
        this.initGameState();

        this.gameStart();
    }

    private gameStart() {
        // TODO print game configs
        // TODO loop hands:




        
            this.newHand();
            this.runStages();
    }

    private newHand() {
        // shuffle cards
        this.croupier.shuffleAll();

        // increase hand counter
        this.state.currentHand++;
        this.state.handStage = HandStage.PREFLOP;

        // reset all players:
        this.state.activePlayers = [];
        this.state.players.forEach((p: Player) => {
            p.isDealer = false;
            p.hand = [];
            p.hasFolded = false;

            if (p.chips > 0) {
                p.isActive = true;
                this.state.activePlayers.push(p);
            } else {
                p.isActive = false;
            }
        });


        // set the next Dealer
        let activePlayers = this.state.activePlayers.length;
        if (this.state.currentDealerIndex == null) {
            // FIXME: remove teste:
            this.state.currentDealerIndex = 0;
            // this.state.currentDealerIndex = MathUtils.randIndex(activePlayers);
        } else {
            this.state.currentDealerIndex = MathUtils.next(this.state.currentDealerIndex, activePlayers);
        }

        // TODO pay Ante
        // ...
        
        // TODO pay blinds
        let blindValue = this.state.blindValue;

        let smallBlindIndex = MathUtils.next(this.state.currentDealerIndex, activePlayers);
        let bigBlindIndex = MathUtils.next(smallBlindIndex, activePlayers);

        let smallPlayer = this.state.activePlayers[smallBlindIndex];
        smallPlayer.betChips = blindValue;
        smallPlayer.chips -= blindValue;

        let bigPlayer = this.state.activePlayers[bigBlindIndex];
        bigPlayer.betChips = blindValue * 2;
        bigPlayer.chips -= bigPlayer.betChips;

        this.state.callValue = blindValue * 2;

        // info
        let dealerPlayer = this.state.activePlayers[this.state.currentDealerIndex];
        MeuLogger.info(`DEALER = ${dealerPlayer.name}`);
        MeuLogger.info(`\tSMALL BLIND payed ${smallPlayer.betChips} - ${smallPlayer.name}`);
        MeuLogger.info(`\tBIG BLIND payed ${bigPlayer.betChips} - ${bigPlayer.name}`);

        // distribute cards
        let firstPlayerIndex = MathUtils.next(bigBlindIndex, activePlayers);
        this.state.firstPlayerIndex = firstPlayerIndex;

        MeuLogger.info("---- PRE FLOP ----");
        MeuLogger.info(`==> giving cards`);
        this.croupier.distributeCardsTo(this.state.activePlayers, 2, firstPlayerIndex);

    }

    private async runStages() {
        while (true) {
            if ( this.state.handStage == HandStage.SHOWDOWN) {
                this.calculateWinner();
                return true;
            } else {
                const hasWon = await this.bets();
                if (hasWon) {
                    this.calculateWinner();
                    return true;
                }
            }

            this.collectBets();
            this.runNextStage();
        }
    }

    private calculateWinner() {
        // TODO calculate winner
        MeuLogger.debug(`calculate winner...`);

        let commons = this.state.commonCards.map((c)=>{return c.toRank()})

        let bettingPlayers = this.state.activePlayers.filter((p)=>{ return !p.hasFolded });
        let hands = bettingPlayers.map((p)=>{
            return p.hand.map((c)=>{return c.toRank()}).concat( commons );
        });

        const ranked = pokerRank(hands);

        let drawRanks = [];

        ranked.forEach(item => {
            let cards = item.filter((i)=>{return i.rank}).map((r)=>{return Card.toString(r)}).join(" ");
            MeuLogger.debug(`    rank data, i= ${item.index} , str=${item.rank.strength} , cards = ${cards} - ${item.rank.name} ${item.rank.rank}`);
            if (item.exequo) { // draw
                item.cards = cards;
                drawRanks.push(item);
            }
        });

        if ( drawRanks.length == 0 ) {
            MeuLogger.info(`WINNER, i= ${ranked[0].index} - ${bettingPlayers[ranked[0].index].name}`);
        } else {
            let drawLog = drawRanks
                .map((item)=>{return `    ${bettingPlayers[item.index].name}, i= ${item.index} , str=${item.rank.strength} , cards = ${item.cards} - ${item.rank.name} ${item.rank.rank}` })
                .join("\n");
            MeuLogger.info(`DRAW: \n${drawLog}`);
        }


    }

    private collectBets() {
        let bets = 0;
        this.state.activePlayers.forEach((p)=>{
            // TODO calculate different pots too
            // MeuLogger.debug(`\tcollecting ${p.betChips} from : ${p.name}`);
            bets += p.betChips;
            p.betChips = 0;
        });

        this.state.pot += bets;

        // MeuLogger.debug(`\t\t POT : ${this.state.pot}`);
    }

    private runNextStage() {
        if ( this.state.handStage == HandStage.PREFLOP ) {
            this.state.handStage = HandStage.FLOP;
            this.state.commonCards = this.croupier.draw(3);

            let cards = this.state.commonCards.map((card) =>{ return card.toString() }).join("  ");
            MeuLogger.info(`---- FLOP: ${cards} ----`);

        } else {
            let stageName = "";
            if (this.state.handStage == HandStage.FLOP) {
                this.state.handStage = HandStage.TURN;
                stageName = "TURN";
            } else if (this.state.handStage == HandStage.TURN) {
                this.state.handStage = HandStage.RIVER;
                stageName = "RIVER";
            } else if (this.state.handStage == HandStage.RIVER) {
                this.state.handStage = HandStage.SHOWDOWN;
                return;
            }

            let card = this.croupier.draw(1);
            this.state.commonCards.concat( card );

            MeuLogger.info(`---- ${stageName}: ${card.toString()} ----`);
        }
    }

    private async bets() : Promise<boolean> {
        this.state.currentPlayerIndex = this.state.firstPlayerIndex;
        this.state.lastRaisedIndex = this.state.firstPlayerIndex;

        return await this.bettingLoop()
    }

    private async bettingLoop() : Promise<boolean> {
        let hasFinished = await this.askBet();
        if (hasFinished) {
            if (this.hasBettingPlayers()) {
                // advance to next stage
                return false;
            } else {
                // someone has won
                return true;
            }
        } else {
            // update next player, some might have folded:
            this.state.currentPlayerIndex = this.findNextBettingPlayer();
            
            return this.bettingLoop();
        }
    }

    private hasBettingPlayers() : boolean {
        return this.state.activePlayers.filter(p =>{ return !p.hasFolded }).length > 1;
    }

    private findNextBettingPlayer() : number {
        let index = this.state.currentPlayerIndex;
        while (true) {
            index = MathUtils.next(index, this.state.activePlayers.length);
            if (!this.state.activePlayers[index].hasFolded) {
                return index;
            }
        }
    }

    private async askBet() : Promise<boolean> {
        let player = this.state.activePlayers[this.state.currentPlayerIndex];
        await this.waitPlayerAction(player);
        if ( !this.hasBettingPlayers() ) { // others folded
            // TODO finish hand, give/distribute pot value(s)
            return true;
        } else { // has players
            let nextIndex = this.findNextBettingPlayer();
            if ( nextIndex == this.state.lastRaisedIndex ) { // all players have payed
                // TODO finish hand, give/distribute pot value(s)
                return true;
            } else { // keep asking players actions:
                return false;
            }
        }
    }

    private waitPlayerAction(player: Player)  {
        return new Promise((resolve) => {
            this.playerService.waitAction(player, this.state)
            .then((betValue) => {
                // TODO validate bet values

                switch (betValue) {
                    case PlayerAction.FOLD:
                        this.foldPlayer(player);
                        break;
                    case PlayerAction.CHECK:
                        // validate check:
                        if ( this.state.callValue != 0
                            && player.betChips != this.state.callValue ) {
                            // invalid check
                            this.foldPlayer(player);
                        } else {
                            MeuLogger.info(`${player.name} CHECKED`);
                        }
                        // check, do nothing
                        break;
                    default:
                        // call or raise
                        if ( player.chips < betValue ) {
                            // TODO player cant bet that amount...
                            // try to call with less?
                            // fold for now:
                            this.foldPlayer(player);
                        } else if (betValue + player.betChips < this.state.callValue) {
                            this.foldPlayer(player);
                        } else {
                            const newBet = (player.betChips + betValue);
                            player.betChips = newBet;
                            player.chips -= betValue;

                            if ( this.state.callValue == player.betChips || this.state.callValue == newBet ) {
                                MeuLogger.info(`${player.name} CALLED ${player.betChips}`);
                            } else {
                                this.state.callValue = player.betChips;
                                this.state.lastRaisedIndex = this.state.activePlayers.findIndex((p)=>{ p.name === player.name });
                                MeuLogger.info(`${player.name} RAISED ${player.betChips}`);
                            }
                        }
                }

                // MeuLogger.debug(`waitPlayerAction ${JSON.stringify(this.state)}`)

                resolve();
            });
        });
    }

    private foldPlayer(player: Player) {
        player.hasFolded = true;
        MeuLogger.info(`${player.name} FOLDED`);
    }

}
