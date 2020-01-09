import { knuthShuffle } from "knuth-shuffle";
import { Card } from "../models/Card";
import {MeuLogger} from "../../server/MeuLogger";
import Player from "../models/Player";
import { MathUtils } from "../../utils/MathUtils";

export class Croupier {

    private MAIN_DECK: Card[];
    private deck: Card[];

    constructor() {
        this.MAIN_DECK = Array<Card>();

        Card.TYPES.forEach((type) => {
            for (let num = 2; num <= 14; num++) {
                this.MAIN_DECK.push( new Card(num, type) );
            }
        });

        this.resetDeck();
    }

    public shuffle() {
        this.deck = knuthShuffle(this.deck.slice(0));
    }

    public shuffleAll() {
        this.resetDeck();
        this.shuffle();
    }

    private resetDeck() {
        this.deck = this.MAIN_DECK.slice(0);
    }

    public distributeCardsTo(players: Player[], cards: number, fromIndex: number) {
        for (let i = 0; i < cards; i++) {
            let index = fromIndex;
            do {
                const c = this.deck.pop();
                const p = players[index];
                p.hand.push( c );

                // MeuLogger.logger.debug(`card : ${c.toString()} to ${p.name}`);

                index = MathUtils.next(index, players.length);
            } while( index != fromIndex )
        }

    }

    public draw(cards: number) : Card[] {
        let list = [];
        for (let i = 0; i < cards; i++) {
            list.push( this.deck.pop() );
        }
        return list;
    }

}
