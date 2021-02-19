import * as dam from "./dataAccessModule";


import * as wsSever from "./wsServer";
async function main() {
    wsSever.init();
    await dam.init();
    console.log(await dam.getAllEmails());
}
main();
