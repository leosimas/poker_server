export class MathUtils {

    public static next(index: number, length: number) : number {
        return (index + 1) % length;
    }

    public static randIndex(length: number) : number {
        return Math.floor(Math.random() * length);
    }

}