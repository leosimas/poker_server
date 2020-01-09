export enum CardType {
    Spade = "S",
    Heart = "H",
    Diamond = "D",
    Club = "C"
}

export class Card {
    public static readonly TYPES = [CardType.Club, CardType.Spade, CardType.Heart, CardType.Diamond];
    
    private value: number;
    private type: CardType;

    constructor(value: number, type: CardType) {
        this.value = value;
        this.type = type;
    }

    public toString(): string {
        let value;
        if (this.value > 10) {
            switch (this.value) {
                case 11: value = "J"; break;
                case 12: value = "Q"; break;
                case 13: value = "K"; break;
                case 14: value = "A"; break;
            }
        } else {
            value = `${this.value}`;
        }

        return `${value}${this.type}`;
    }

    public toRank() : any {
        let value;
        if (this.value > 10) {
            switch (this.value) {
                case 11: value = "J"; break;
                case 12: value = "Q"; break;
                case 13: value = "K"; break;
                case 14: value = "A"; break;
            }
        } else {
            value = `${this.value}`;
        }

        return {rank: value, type: this.type};
    }

    public static toString(rank: any) : string {
        return `${rank.rank}${rank.type}`;
    }
    
}
