const fs = require("fs");

imageFormats = ["webp"];

files = fs.readdirSync("src/img");
let gameCode;
gameCode = fs.readFileSync("dist/game.js", "utf-8");
for (let image of files) {
    console.log(image)
    if (!imageFormats.includes(image.split(".")[1])) continue;
    try {
        const data = fs.readFileSync(`src/img/${image}`, null);
        console.log(data.toString("base64url"));
        gameCode = gameCode.replaceAll(image, `data:image/webp;base64,${data.toString("base64url")}`);
    } catch (err) {
        console.error(err);
    }
}

// console.log(gameCode)

fs.writeFileSync("dist/game.js", gameCode, "utf-8");
