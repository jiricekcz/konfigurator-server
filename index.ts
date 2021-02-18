import * as dam from "./dataAccessModule";

import * as sql from "./sql";

import * as wsSever from "./wsServer";
async function main() {
    wsSever.init();
    await dam.init();
    console.log(await dam.createUser("test@gmail.com", "test", "password"));
    // console.log(await dam.getAllEmails());
}
main();
