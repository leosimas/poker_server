import express from "express";
import Game from "./game/Game";

new Game().start();

// const app = express();
// const port = 3000;

// app.get("/", (req, res) => {
//     res.send("The sedulous hyena ate the antelope!");
// });

// app.get("/start", (req, res) => {
//     res.send("started!");
    
// });

// app.listen(port, (err) => {
//     if (err) {
//         return console.error(err);
//     }
//     return console.log(`server is listening on ${port}`);
// });
