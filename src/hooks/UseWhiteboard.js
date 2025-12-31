// import api from "../api/api";
// import { WhiteWebSdk } from "white-web-sdk";

// export async function openWhiteboard() {
//   const { data } = await api.post("/whiteboard/session");

//   const sdk = new WhiteWebSdk({
//     appIdentifier: import.meta.env.VITE_WHITEBOARD_APP_ID,
//   });
//   console.log(data,"data of whiteboard");
//   console.log(sdk,"sdk of whiteboard");
//   return sdk.joinRoom({
//     uuid: data.roomUUID,
//     roomToken: data.roomToken,
//   });
// }
